// ============================================================
// CLOUD (Phase 9): accounts, cloud saves, leaderboards, validation.
// Two providers behind one interface:
//  - 'claude'   : the published game link's own storage (claude.use('db') + 'user').
//                 Identity is the viewer's Claude account. Works for the owner,
//                 org members and invited Editors; public-link visitors can read only.
//  - 'supabase' : a Supabase project (see supabase/README.md). Email + password
//                 accounts, server-side validation in Postgres functions.
// Supabase wins when it is configured (here or in Settings → Cloud).
// ============================================================
const CLOUD_CFG = {
  supabaseUrl: 'https://tylhgokkzenqcefcrcau.supabase.co',     // project "My rpg project"
  supabaseAnonKey: 'sb_publishable_QQq8OI8DzOrsrZ8DAFMsxw_Dxo5aCeJ', // publishable key: safe to ship; RLS + RPC checks protect the data
};
const CLOUD = { autoMins: 5, lbCats: [
  ['prog', 'Level', e => `A${e.asc} · Lv ${e.level}`],
  ['ach', 'Achievement points', e => N(e.ach)],
  ['gold', 'Gold earned', e => N(e.gold)],
  ['kills', 'Monsters slain', e => N(e.kills)],
  ['species', 'Pet species', e => N(e.species)],
  ['coll', 'Collection', e => e.coll + '%'],
] };
let cloud = { provider: null, state: 'starting', msg: '', uid: null, canWrite: null, meta: null, lb: null, lbAt: 0, lbErr: '', busy: false, lastUp: 0, lastLb: '', modId: null, banned: {}, isOwner: false, prompt: false };

// ---------- Validation (mirrored in supabase/migrations/0001_init.sql → tf_validate) ----------
function statPtsEarned(c) { return BALANCE.level.statPointsPerLevel * ((c.ascension || 0) * (BALANCE.level.max - 1) + (c.level - 1)); }
function lbEntry(c) {
  const ach = ACHIEVEMENTS.filter(a => c.ach && c.ach[a.id]).reduce((s, a) => s + a.pts, 0);
  let coll = 0; try { const C = collectionPct(c); coll = Math.round(Object.values(C).reduce((s, v) => s + v, 0) / 4 * 100); } catch (e) { }
  return { cid: c.id, name: c.name, cls: c.cls, race: c.race, asc: c.ascension || 0, level: c.level, prog: (c.ascension || 0) * BALANCE.level.max + c.level,
    xp: Math.floor(c.xp), ach, gold: Math.floor(c.counters.goldEarned || 0), kills: c.counters.kills || 0, species: Object.keys(c.petDex || {}).length, coll,
    alloc: Object.values(c.alloc || {}).reduce((s, v) => s + (+v || 0), 0), unspent: c.unspent || 0, created: c.created || 0,
    skills: SKILL_IDS.map(s => [c.skills[s].level, Math.floor(c.skills[s].xp)]), ver: GAME_VERSION, at: Date.now() };
}
function validateEntry(e) {
  const f = [], num = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  for (const k of ['asc', 'level', 'xp', 'ach', 'gold', 'kills', 'species', 'coll', 'alloc', 'unspent', 'created']) if (!num(e[k])) f.push(`bad ${k}`);
  if (f.length) return f;
  if (e.level < 1 || e.level > BALANCE.level.max) f.push('level out of range');
  if (e.asc > 1000) f.push('ascension out of range');
  if (levelFromXp(e.xp).level !== e.level) f.push('level does not match XP');
  for (const [lv, xp] of e.skills || []) if (levelFromXp(xp).level !== lv) { f.push('a skill level does not match its XP'); break; }
  if (e.alloc + e.unspent > BALANCE.level.statPointsPerLevel * (e.asc * (BALANCE.level.max - 1) + e.level - 1) + 60) f.push('more stat points than levels give');
  const hours = Math.max(0, (Date.now() - e.created) / 3.6e6);
  if (e.prog > 15 + 60 * hours) f.push('levels gained faster than possible');
  if (e.ach > ACHIEVEMENTS.reduce((s, a) => s + a.pts, 0)) f.push('too many achievement points');
  if (e.species > Object.keys(SPECIES).length || e.coll > 100) f.push('collection out of range');
  if (nameProblem(e.name)) f.push('name not allowed');
  return f;
}

// ---------- Providers ----------
const sbOn = () => !!(cloudCfg().url && cloudCfg().key);
const cloudCfg = () => ({ url: ((account && account.settings.sbUrl) || CLOUD_CFG.supabaseUrl || '').replace(/\/+$/, ''), key: (account && account.settings.sbKey) || CLOUD_CFG.supabaseAnonKey || '' });
const SB_KEY = 'thousandfold.sb';
async function sbReachable() { try { const c = cloudCfg(); const r = await fetch(c.url + '/auth/v1/health', { headers: { apikey: c.key } }); return r.status < 500; } catch (e) { return false; } }
const sbSession = () => { try { return JSON.parse(localStorage.getItem(SB_KEY) || 'null'); } catch (e) { return null; } };
const sbStore = s => { try { s ? localStorage.setItem(SB_KEY, JSON.stringify(s)) : localStorage.removeItem(SB_KEY); } catch (e) { } };
async function sbFetch(path, opts = {}, auth = true) {
  const { url, key } = cloudCfg(), h = { apikey: key, 'Content-Type': 'application/json' };
  let s = sbSession();
  if (auth && s) {
    if (s.expires_at && s.expires_at * 1000 < Date.now() + 60000) { s = await sbRefresh(s); }
    if (s) h.Authorization = 'Bearer ' + s.access_token;
  }
  const r = await fetch(url + path, Object.assign({}, opts, { headers: Object.assign(h, opts.headers || {}) }));
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  if (!r.ok) throw new Error((j && (j.msg || j.message || j.error_description || j.hint)) || ('HTTP ' + r.status));
  return j;
}
async function sbRefresh(s) {
  try { const j = await sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) }, false); sbStore(j); return j; }
  catch (e) { sbStore(null); cloud.uid = null; cloud.state = 'signedout'; return null; }
}
const PROVIDERS = {
  supabase: {
    label: 'Thousandfold account',
    async init() { const s = sbSession(); if (!s) { cloud.state = 'signedout'; return; } cloud.uid = s.user && s.user.id; cloud.canWrite = true; cloud.state = 'ready'; if (s.expires_at * 1000 < Date.now() + 60000) await sbRefresh(s); if (sbSession()) { cloud.uid = sbSession().user.id; } },
    async signUp(email, pw) { const j = await sbFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password: pw }) }, false); if (j && j.access_token) { sbStore(j); return 'in'; } return 'confirm'; },
    async signIn(email, pw) { const j = await sbFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password: pw }) }, false); sbStore(j); cloud.uid = j.user.id; cloud.state = 'ready'; cloud.canWrite = true; },
    async signOut() { try { await sbFetch('/auth/v1/logout', { method: 'POST' }); } catch (e) { } sbStore(null); cloud.uid = null; cloud.state = 'signedout'; },
    async getSave() { const j = await sbFetch(`/rest/v1/cloud_saves?select=code,saved_at,version,device,summary&user_id=eq.${cloud.uid}`); const r = j && j[0]; return r ? { code: r.code, savedAt: Date.parse(r.saved_at), ver: r.version, device: r.device, chars: r.summary || [] } : null; },
    async putSave(d) { await sbFetch('/rest/v1/rpc/tf_put_save', { method: 'POST', body: JSON.stringify({ p_code: d.code, p_saved_at: new Date(d.savedAt).toISOString(), p_version: d.ver, p_device: d.device, p_summary: d.chars }) }); },
    async postScores(entries) { const r = await sbFetch('/rest/v1/rpc/tf_submit_scores', { method: 'POST', body: JSON.stringify({ p_entries: entries }) }); return r || []; },
    async leaderboard(cat) { const j = await sbFetch(`/rest/v1/tf_leaderboard?select=*&order=${cat}.desc&limit=100`); return (j || []).map(r => Object.assign({}, r, { mine: r.user_id === cloud.uid })); },
  },
  claude: {
    label: 'Claude account',
    async init() {
      const use = window.claude && window.claude.use; if (!use) { cloud.state = 'unavailable'; return; }
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) { cloud.state = db === null && user ? 'signedout' : 'unavailable'; return; }
      this.db = db; cloud.uid = await user.id(); cloud.isOwner = !!(await user.isOwner());
      if (!cloud.uid) { cloud.state = 'signedout'; return; }
      cloud.canWrite = null; cloud.state = 'ready';
    },
    async getSave() { const s = await this.db.doc(`data/users/${cloud.uid}/save`).get(); return s.exists ? s.data() : null; },
    async putSave(d) { await this.db.doc(`data/users/${cloud.uid}/save`).set(d); },
    async postScores(entries) {
      const res = entries.map(e => ({ cid: e.cid, flags: validateEntry(e) }));
      await this.db.doc(`lb/${cloud.uid}`).set({ chars: entries.map((e, i) => Object.assign({}, e, { skills: undefined, flags: res[i].flags })).map(e => JSON.parse(JSON.stringify(e))), at: Date.now() });
      return res;
    },
    async leaderboard(cat) {
      const [snap, mod] = await Promise.all([this.db.collection('lb').get(), this.db.doc('lbmod/bans').get()]);
      cloud.banned = mod.exists ? (mod.data().ids || {}) : {};
      const rows = [];
      for (const d of snap.docs) { if (cloud.banned[d.id] && !cloud.isOwner) continue; const v = d.data() || {}; for (const e of v.chars || []) { if (!e || typeof e !== 'object') continue; const flags = validateEntry(Object.assign({ skills: [] }, e)); rows.push(Object.assign({}, e, { user_id: d.id, mine: d.id === cloud.uid, flagged: flags.length > 0 || !!(e.flags && e.flags.length), banned: !!cloud.banned[d.id] })); } }
      return rows.filter(r => !r.flagged || cloud.isOwner).sort((a, b) => (a.flagged || a.banned) - (b.flagged || b.banned) || (+b[cat] || 0) - (+a[cat] || 0)).slice(0, 100);
    },
    async ban(uid, on) { const ref = this.db.doc('lbmod/bans'), s = await ref.get(), ids = Object.assign({}, s.exists ? s.data().ids : {}); if (on) ids[uid] = Date.now(); else delete ids[uid]; await ref.set({ ids }); },
  },
};
const P = () => cloud.provider && PROVIDERS[cloud.provider];

// Google sign-in: Supabase sends the player back to the game with the session in the URL fragment.
async function sbTakeRedirect() {
  const h = location.hash && location.hash.length > 1 ? new URLSearchParams(location.hash.slice(1)) : null, q = new URLSearchParams(location.search);
  const err = (h && (h.get('error_description') || h.get('error'))) || q.get('error_description') || q.get('error');
  if (!(h && h.get('access_token')) && !err) return;
  history.replaceState(null, '', location.pathname);
  if (err) { setTimeout(() => toast('Sign-in didn\u2019t finish: ' + esc(err.replace(/\+/g, ' '))), 300); return; }
  const tok = h.get('access_token'), { url, key } = cloudCfg();
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + tok } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const user = await r.json();
    sbStore({ access_token: tok, refresh_token: h.get('refresh_token'), expires_at: +h.get('expires_at') || Math.floor(Date.now() / 1000) + (+h.get('expires_in') || 3600), token_type: 'bearer', user });
    setTimeout(() => toast(`Signed in as <b>${esc(user.email || 'your Google account')}</b>.`, 'verd'), 300);
  } catch (e) { setTimeout(() => toast('Sign-in didn\u2019t finish. Please try again.'), 300); }
}
async function cloudInit() {
  if (sbOn()) await sbTakeRedirect();
  account.device = account.device || 'd' + Math.random().toString(36).slice(2, 10);
  cloud.sbBlocked = false;
  cloud.provider = sbOn() ? 'supabase' : (window.claude && window.claude.use ? 'claude' : null);
  // Claude links block outside connections: if the server can't be reached from here, fall back to the link's built-in cloud.
  if (cloud.provider === 'supabase' && !(await sbReachable())) { cloud.sbBlocked = true; cloud.provider = window.claude && window.claude.use ? 'claude' : null; }
  if (!cloud.provider) { cloud.state = 'unavailable'; return cloudRefreshUi(); }
  try { await P().init(); } catch (e) { cloud.state = 'error'; cloud.msg = String(e.message || e); }
  cloudRefreshUi();
  if (cloud.state === 'ready') { await cloudCheckRemote(true); if (cloud.provider === 'supabase') socRefresh(); }
}
async function cloudCheckRemote(onBoot) {
  try { cloud.meta = await P().getSave(); } catch (e) { cloud.msg = 'Could not reach the cloud: ' + (e.message || e); cloudRefreshUi(); return; }
  const m = cloud.meta;
  if (onBoot && m && m.code && m.device !== account.device && m.savedAt > (account.savedAt || 0) + 60000 && !(account.cloudSeen >= m.savedAt)) cloudOfferLoad(m);
  cloudRefreshUi();
}
function cloudOfferLoad(m) {
  account.cloudSeen = m.savedAt;
  modal(`<h3>Newer cloud save found</h3><p>Your cloud save is from <b>${new Date(m.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</b>, newer than the save on this device.</p>
    <p class="mute" style="font-size:14px">Cloud: ${esc((m.chars || []).map(c => `${c.name} (${c.asc ? 'A' + c.asc + ' · ' : ''}Lv ${c.level})`).join(', ') || 'no characters')}<br>This device: ${esc(account.slots.filter(Boolean).map(c => `${c.name} (${levelLabel(c)})`).join(', ') || 'no characters')}</p>
    <div class="row" style="margin-top:12px"><button class="pri" data-act="cloudload">Load cloud save</button><button data-act="close">Keep this device's save</button></div>`);
}
function cloudSummary() { return account.slots.filter(Boolean).map(c => ({ name: c.name, level: c.level, asc: c.ascension || 0, cls: c.cls })); }
async function cloudUpload(manual) {
  if (cloud.state !== 'ready' || cloud.busy || cloud.canWrite === false) return;
  cloud.busy = true; cloudRefreshUi();
  try {
    save(); const d = { code: await makeSaveCode(), savedAt: Date.now(), ver: GAME_VERSION, device: account.device, chars: cloudSummary() };
    await P().putSave(d); cloud.meta = d; cloud.lastUp = Date.now(); cloud.canWrite = true; account.cloudSeen = d.savedAt; cloud.msg = '';
    if (account.settings.lbOptOut !== true) await cloudPostScores();
    if (manual) toast('Saved to the cloud.', 'verd');
  } catch (e) {
    const code = e && e.code;
    if (code === 'invalid_argument' && cloud.provider === 'claude') { cloud.canWrite = false; cloud.msg = 'This game link lets your account read the cloud but not write to it. Cloud saves and leaderboard posting work for the game’s owner, their organization and invited Editors.'; }
    else cloud.msg = 'Cloud save failed: ' + (e.message || code || e);
    if (manual) toast(esc(cloud.msg));
  }
  cloud.busy = false; cloudRefreshUi();
}
async function cloudPostScores() {
  const entries = account.slots.filter(Boolean).map(lbEntry), key = JSON.stringify(entries.map(e => [e.cid, e.prog, e.ach, e.gold, e.kills, e.species, e.coll, e.name]));
  if (key === cloud.lastLb) return;
  const res = await P().postScores(entries); cloud.lastLb = key;
  cloud.flags = {}; for (const r of res || []) if (r && r.flags && r.flags.length) cloud.flags[r.cid] = r.flags;
}
async function cloudLoad() {
  closeModal();
  try {
    const m = cloud.meta || await P().getSave(); if (!m || !m.code) { toast('No cloud save yet.'); return; }
    const a = await readSaveCode(m.code); if (!a || !Array.isArray(a.slots)) throw new Error('unreadable');
    const keep = { sbUrl: account.settings.sbUrl, sbKey: account.settings.sbKey }, dev = account.device;
    if (ch) { ch = null; }
    account = a; account.activeSlot = null; account.device = dev; account.cloudSeen = m.savedAt; Object.assign(account.settings, keep);
    save(); applySettings(); renderSelect(); toast('Cloud save loaded.', 'verd');
  } catch (e) { toast('Could not load the cloud save: ' + esc(e.message || e)); }
}
function cloudTick() {
  if (cloud.state !== 'ready' || account.settings.cloudAuto === false || cloud.canWrite === false) return;
  if (Date.now() - cloud.lastUp > (document.hidden ? 30 : CLOUD.autoMins) * 60000) cloudUpload(false);
}
function cloudRefreshUi() { if (screen === 'game' && (tab === 'account' || tab === 'leaders')) renderMain(); if (screen === 'select') { const el = document.getElementById('cloudchip'); if (el) el.outerHTML = cloudChip(); } }
function cloudChip() {
  const ss = cloud.provider === 'supabase' && cloud.state === 'ready' ? sbSession() : null, email = ss && ss.user && ss.user.email;
  const t = cloud.sbBlocked && cloud.state !== 'ready' ? 'Accounts: on the website'
    : cloud.state === 'ready' ? (email || 'Signed in')
    : cloud.state === 'signedout' ? 'Account login'
    : cloud.state === 'starting' ? 'Connecting\u2026' : 'Account: offline';
  const tip = cloud.state === 'ready' && cloud.meta ? `Cloud save ${new Date(cloud.meta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : 'Account and cloud save';
  return `<button class="chip acctchip ${cloud.state === 'signedout' ? 'pri' : ''}" id="cloudchip" data-act="cloudopen" title="${esc(tip)}">${cloud.state === 'ready' ? '<span class="odot on"></span> ' : ''}${esc(t)}</button>`;
}

// ---------- UI ----------
function cloudPanel() {
  const p = P(), st = cloud.state, m = cloud.meta;
  let body = '';
  if (cloud.sbBlocked && (!cloud.provider || st === 'unavailable' || st === 'signedout')) body = `<p>Thousandfold accounts can\u2019t be created or used on this Claude link: Claude links block connections to outside servers. To make an account, play on the game\u2019s website: <a href="https://thah3b.github.io/thousandfold/" target="_blank" rel="noopener">thah3b.github.io/thousandfold</a>. Your saves here stay in this browser; move them to the website with <b>Copy save code</b> in Settings here, then <b>Import save code</b> there.</p>`;
  else if (!cloud.provider || st === 'unavailable') body = cloud.sbBlocked ? `<p>Thousandfold accounts can\u2019t connect from this page: the Claude link blocks outside connections. Play the standalone game to sign in. Saves here stay in this browser; move them with save codes in Settings.</p>` : `<p>Cloud saves and leaderboards need the online game link${sbOn() ? '' : ' (or a Thousandfold server, see below)'}. This copy keeps saves in this browser only; use save codes in Settings to move them.</p>`;
  else if (st === 'starting') body = '<p class="mute">Connecting…</p>';
  else if (st === 'error') body = `<p class="bad">${esc(cloud.msg)}</p>`;
  else if (st === 'signedout' && cloud.provider === 'claude') body = '<p>Cloud saves aren\u2019t available for you on this link right now. Sign in to Claude, or check back later. You can keep playing with saves in this browser and move them with save codes.</p>';
  else if (st === 'signedout') body = `<p>Sign in to keep your characters in the cloud, play on any device, and use leaderboards, friends, chat and trading.</p>
    <button class="gbtn" data-act="sbgoogle"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.1 5.5c4.2-3.9 7.2-9.6 7.2-17z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2.2 1.5-5 2.3-8.8 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Sign in with Google</button>
    <div class="orline"><span>or with email</span></div>
    <div class="grid" style="gap:8px;max-width:360px"><input id="sbemail" type="email" autocomplete="email" placeholder="Email" aria-label="Email"><input id="sbpw" type="password" autocomplete="current-password" placeholder="Password (8+ characters)" aria-label="Password"></div>
    <div class="err" id="sberr"></div><div class="row" style="margin-top:8px"><button class="pri" data-act="sbin">Sign in</button><button data-act="sbup">Create account</button></div>`;
  else {
    const ss = cloud.provider === 'supabase' ? sbSession() : null, via = ss && ss.user && ss.user.app_metadata && ss.user.app_metadata.provider === 'google' ? 'Google' : 'email';
    body = `<p style="margin:0">${ss && ss.user && ss.user.email ? `Signed in as <b>${esc(ss.user.email)}</b> <span class="mute">(${via})</span>` : `Signed in with your <b>${esc(p.label)}</b>`}.${cloud.isOwner ? ' <span class="chip">Game owner</span>' : ''}</p>
      <p class="mute" style="font-size:14px;margin:6px 0 0">${m ? `Cloud save: ${new Date(m.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}${m.device === account.device ? ' (this device)' : ' (another device)'} · ${esc((m.chars || []).map(c => c.name).join(', ') || 'no characters')}` : 'No cloud save yet.'}</p>
      ${cloud.canWrite === false ? `<p class="bad" style="font-size:14px">${esc(cloud.msg)}</p>` : cloud.msg ? `<p class="bad" style="font-size:14px">${esc(cloud.msg)}</p>` : ''}
      <div class="row" style="margin-top:10px"><button class="pri" data-act="cloudup" ${cloud.busy || cloud.canWrite === false ? 'disabled' : ''}>${cloud.busy ? 'Saving…' : 'Save to cloud now'}</button><button data-act="cloudget" ${m && m.code ? '' : 'disabled'}>Load cloud save</button>${cloud.provider === 'supabase' ? '<button class="ghost" data-act="sbout">Sign out</button>' : ''}</div>
      <div class="row" style="margin-top:10px">${['cloudAuto', 'lbOptOut'].map(k => { const on = k === 'cloudAuto' ? account.settings.cloudAuto !== false : account.settings.lbOptOut !== true; return `<button class="chip ${on ? 'on' : ''}" data-act="cloudset" data-arg="${k}">${k === 'cloudAuto' ? `Auto-save (every ${CLOUD.autoMins} min while open): ${on ? 'on' : 'off'}` : `Show my characters on leaderboards: ${on ? 'on' : 'off'}`}</button>`; }).join('')}</div>`;
  }
  const local = account.slots.filter(Boolean).map(c => { const f = validateEntry(lbEntry(c)).concat((cloud.flags && cloud.flags[c.id]) || []); return `<div class="prow"><span>${esc(c.name)} · ${levelLabel(c)}</span>${f.length ? `<span class="bad" style="font-size:13px">Not ranked: ${esc([...new Set(f)].join('; '))}</span>` : '<span class="chip on" style="font-size:12px">Eligible</span>'}</div>`; }).join('');
  return `<div class="card"><div class="spread"><h3>Cloud save</h3>${cloudChip()}</div>${body}</div>
    ${local ? `<div class="card" style="margin-top:12px"><h3>Leaderboard check</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Each character is checked before it is ranked: level against XP, stat points against levels, progress against the character's age, and fair names. ${cloud.provider === 'supabase' ? 'The server runs the same checks again.' : ''}</p><div class="grid" style="gap:6px">${local}</div></div>` : ''}
    <details class="card" style="margin-top:12px"><summary><b>Thousandfold server (advanced)</b></summary><p class="mute" style="font-size:14px">For the standalone game: paste the Supabase project URL and anon key from the server package. Leave empty to use the game link's built-in cloud.</p>
      <div class="grid" style="gap:8px;max-width:520px"><input id="sburl" placeholder="https://your-project.supabase.co" value="${esc(account.settings.sbUrl || '')}" aria-label="Supabase URL"><input id="sbkey" placeholder="anon key" value="${esc(account.settings.sbKey || '')}" aria-label="Supabase anon key"></div>
      <div class="row" style="margin-top:8px"><button data-act="sbcfg">Save and reconnect</button></div></details>`;
}
function tabAccount() {
  const r = RACES.find(x => x.id === ch.race) || RACES[0], cl = CLASSES.find(x => x.id === ch.cls) || {};
  const prof = !socOn() ? `<p class="mute" style="margin:0;font-size:14px">Your player name is used in chat, on friend lists and on trades. ${cloud.sbBlocked ? 'Player accounts work on the game\u2019s website.' : 'Sign in below to set it.'}</p>`
    : soc.me === undefined ? (socRefresh(), '<p class="mute">Loading\u2026</p>')
    : `<div class="row" style="gap:6px"><input id="socname" maxlength="64" value="${esc(soc.me ? soc.me.name : '')}" placeholder="Player name" aria-label="Player name" style="flex:1"><button class="pri" data-act="socname">Save</button></div><div class="err" id="socerr"></div>${soc.me ? `<p class="mute" style="font-size:13px;margin:6px 0 0">Friend code <b class="num" style="color:var(--ink)">${esc(soc.me.code)}</b></p>` : '<p class="mute" style="font-size:13px;margin:6px 0 0">Pick a name to use Friends, Chat, Mail and Trades.</p>'}`;
  return `<div class="spread"><h2>Account</h2></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));margin-top:12px;align-items:start">
      <div class="card"><h3>Character</h3><div class="row" style="margin-top:8px">${portrait(ch, 56)}<div class="mute" style="font-size:14px">${esc(r.name)} ${esc(cl.name || '')}<br>Race and class are chosen when a character is created.</div></div>
        <label class="mute" for="acname" style="font-size:14px;display:block;margin-top:10px">Name</label>
        <div class="row" style="gap:6px"><input id="acname" maxlength="64" value="${esc(ch.name)}" aria-label="Character name" style="flex:1"><button class="pri" data-act="acname">Save</button></div><div class="err" id="acerr"></div>
        <p class="mute" style="font-size:12px;margin:4px 0 0">Anything goes: letters from any language, numbers, symbols, emoji, ( \u0361\u00b0 \u035c\u0296 \u0361\u00b0). Up to ${NAME_MAX} characters.</p>
        <div class="mute" style="font-size:14px;margin-top:10px">Gender</div><div class="row" style="gap:6px;margin-top:4px">${['Male', 'Female'].map(g => `<button class="chip ${ch.gender === g ? 'on' : ''}" data-act="acgender" data-arg="${g}">${g}</button>`).join('')}</div></div>
      <div class="card"><h3>Player name</h3>${prof}</div>
    </div>
    <h3 style="margin:18px 0 8px">Sign-in and cloud save</h3>${cloudPanel()}`;
}
let lbCat = 'prog';
function tabLeaders() {
  const cat = CLOUD.lbCats.find(c => c[0] === lbCat) || CLOUD.lbCats[0];
  if (cloud.state === 'ready' && (!cloud.lb || cloud.lbCat !== lbCat || Date.now() - cloud.lbAt > 60000) && !cloud.lbLoading) cloudLoadLb();
  const rows = cloud.lb || [];
  const table = cloud.state !== 'ready' ? `<p class="mute">${cloud.state === 'signedout' ? 'Sign in on the Cloud save tab to see the leaderboards.' : cloud.state === 'starting' ? 'Connecting…' : 'Leaderboards need the online game link or a Thousandfold server.'}</p>`
    : cloud.lbErr ? `<p class="bad">${esc(cloud.lbErr)}</p>` : !cloud.lb ? '<p class="mute">Loading…</p>' : !rows.length ? '<p class="mute">Nobody has posted yet. Save to the cloud to be first.</p>'
    : `<div class="lbtable" role="table">${rows.map((e, i) => `<div class="lbrow ${e.mine ? 'mine' : ''} ${e.flagged || e.banned ? 'flag' : ''}" role="row"><span class="num lbrank">${i + 1}</span><span class="lbname"><b>${esc(e.name)}</b><span class="mute" style="font-size:12px"> ${esc((CLASSES.find(c => c.id === e.cls) || {}).name || '')}${e.mine ? ' · you' : ''}${e.flagged ? ' · failed checks' : ''}${e.banned ? ' · hidden' : ''}</span></span><span class="mute hide-s" style="font-size:13px">${cat[0] === 'prog' ? '' : `A${+e.asc || 0} · Lv ${+e.level || 1}`}</span><span class="num gold">${esc(cat[2](e))}</span>${cloud.isOwner && cloud.provider === 'claude' && !e.mine ? `<button class="sm ghost" data-act="lbban" data-arg="${esc(e.user_id)}">${e.banned ? 'Unhide' : 'Hide'}</button>` : ''}</div>`).join('')}</div>`;
  return `<div class="spread"><h2>Leaderboards</h2><button class="sm" data-act="lbrefresh" ${cloud.state === 'ready' ? '' : 'disabled'}>Refresh</button></div>
    <p class="mute">Top 100 characters. Ascension counts here: A0 means not yet ascended. Your characters are posted each time you save to the cloud.</p>
    <div class="row" style="margin:10px 0">${CLOUD.lbCats.map(([k, n]) => `<button class="chip ${lbCat === k ? 'on' : ''}" data-act="lbcat" data-arg="${k}">${n}</button>`).join('')}</div>${table}`;
}
async function cloudLoadLb() {
  cloud.lbLoading = true; cloud.lbErr = '';
  try { cloud.lb = await P().leaderboard(lbCat); cloud.lbCat = lbCat; cloud.lbAt = Date.now(); }
  catch (e) { cloud.lbErr = 'Could not load the leaderboard: ' + (e.message || e.code || e); }
  cloud.lbLoading = false; if (screen === 'game' && tab === 'leaders') renderMain();
}
const CLOUD_HANDLERS = {
  cloudopen: () => { if (screen === 'game') HANDLERS.tab('account'); else modal(`${cloudPanel()}<div class="row" style="margin-top:12px"><button data-act="close">Close</button></div>`); },
  cloudup: () => cloudUpload(true),
  acname: () => { const v = $('#acname').value.trim(), p = nameProblem(v); if (p) { $('#acerr').textContent = p; return; } if (account.slots.some(c => c && c !== ch && c.name.toLowerCase() === v.toLowerCase())) { $('#acerr').textContent = 'Another of your characters already has that name.'; return; } const old = ch.name; ch.name = v; cloud.lastLb = ''; save(); addLog('sys', `${old} is now known as ${v}.`); toast('Name saved.', 'verd'); renderTop(); renderMain(); renderActions(); },
  acgender: g => { if (!['Male', 'Female'].includes(g)) return; ch.gender = g; save(); renderMain(); },
  cloudget: () => modal(`<h3>Load cloud save?</h3><p>This replaces every character on this device with the cloud save from ${cloud.meta ? new Date(cloud.meta.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}. Copy a save code first if you want a backup.</p><div class="row" style="margin-top:12px"><button class="pri" data-act="cloudload">Load it</button><button data-act="close">Cancel</button></div>`),
  cloudload: () => cloudLoad(),
  cloudset: k => { if (k === 'cloudAuto') account.settings.cloudAuto = account.settings.cloudAuto === false; else { account.settings.lbOptOut = account.settings.lbOptOut !== true; cloud.lastLb = ''; } save(); renderMain(); },
  sbgoogle: () => {
    save();
    const back = location.origin + location.pathname.replace(/index\.html$/, '');
    location.href = cloudCfg().url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(back);
  },
  sbin: async () => { try { await PROVIDERS.supabase.signIn($('#sbemail').value.trim(), $('#sbpw').value); await cloudCheckRemote(true); socRefresh(); cloudRefreshUi(); if (screen !== 'game') { closeModal(); renderSelect(); } } catch (e) { $('#sberr').textContent = e.message || 'Sign-in failed.'; } },
  sbup: async () => { const em = $('#sbemail').value.trim(), pw = $('#sbpw').value; if (pw.length < 8) { $('#sberr').textContent = 'Use at least 8 characters.'; return; } try { const r = await PROVIDERS.supabase.signUp(em, pw); if (r === 'confirm') $('#sberr').textContent = 'Check your email to confirm the account, then sign in.'; else { await PROVIDERS.supabase.init(); cloudRefreshUi(); } } catch (e) { $('#sberr').textContent = e.message || 'Could not create the account.'; } },
  sbout: async () => { await PROVIDERS.supabase.signOut(); cloud.meta = null; cloud.lb = null; soc.me = undefined; soc.friends = []; soc.mail = 0; soc.trades = 0; soc.mailList = null; soc.tradeList = null; soc.msgs = {}; cloudRefreshUi(); socPaint(); },
  sbcfg: () => { account.settings.sbUrl = $('#sburl').value.trim(); account.settings.sbKey = $('#sbkey').value.trim(); save(); cloud = Object.assign(cloud, { provider: null, state: 'starting', meta: null, lb: null, msg: '' }); cloudRefreshUi(); cloudInit(); },
  lbcat: k => { lbCat = k; renderMain(); },
  lbrefresh: () => { cloud.lbAt = 0; cloud.lb = null; renderMain(); },
  lbban: async uid => { try { await PROVIDERS.claude.ban(uid, !cloud.banned[uid]); cloud.lb = null; renderMain(); } catch (e) { toast('Could not change that entry.'); } },
};
