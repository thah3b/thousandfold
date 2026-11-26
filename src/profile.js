// ============================================================
// PLAYER PROFILES (v0.15): a public page per player showing their
// characters. Published from the game (migration 0008_profiles.sql);
// viewable by anyone from a link, chat, friends and leaderboards.
// ============================================================
const SITE_URL = 'https://thah3b.github.io/thousandfold/';
let prof = { lastPub: 0, sig: '', view: null };

// A snapshot of each character for the public card. Debug-tool characters are left out.
function profileCard() {
  const chars = account.slots.filter(c => c && !c.debugUsed).slice(0, 4).map(c => {
    let coll = 0; try { const C = collectionPct(c); coll = Math.round(Object.values(C).reduce((s, v) => s + v, 0) / 4 * 100); } catch (e) { }
    const ach = ACHIEVEMENTS.filter(a => c.ach && c.ach[a.id]).reduce((s, a) => s + a.pts, 0);
    const pet = c.petActive && (c.pets || []).find(p => p.uid === c.petActive);
    const skills = SKILL_IDS.filter(s => c.skills[s]).map(s => [s, c.skills[s].level]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const egos = Object.keys(c.egos || {}).map(k => (EGOS && EGOS[k] ? EGOS[k].name : k)).slice(0, 6);
    return {
      name: c.name, race: c.race, cls: c.cls, gender: c.gender, mark: c.mark, look: fashionLook(c), adv: { tier: (c.adv && c.adv.tier) || 1 },
      tierName: (() => { try { return tierName(c.cls, c.adv && c.adv.spec, (c.adv && c.adv.tier) || 1); } catch (e) { return ''; } })(),
      asc: c.ascension || 0, level: c.level, title: showcaseOf(c).title || '', ach, coll,
      species: Object.keys(c.petDex || {}).length, pet: pet ? { sp: pet.sp, name: pet.name || '', level: pet.level || 1 } : null,
      comp: c.comp && c.comp.cls && COMPANIONS[c.comp.cls] ? COMPANIONS[c.comp.cls][0] : null,
      egos, secrets: Object.keys(c.secrets || {}).length, lore: Object.keys(c.lore || {}).length,
      skills, gathered: c.counters.gathered || 0, kills: c.counters.kills || 0, events: c.counters.eventsJoined || 0,
      streak: (c.daily && c.daily.best) || 0, created: c.created || 0,
      showcase: (() => { const sc = showcaseOf(c); return { sub: sc.sub || '', style: sc.style, bg: sc.bg, frame: sc.frame }; })(),
      arena: account.pvpBest || 0, dg: [0, 1, 2].map(d => sxDg(c, d)), gear: profBestGear(c), trophies: profTrophies(c),
      fun: { mined: c.counters.mined || 0, crafted: c.counters.crafted || 0, gold: c.counters.goldEarned || 0, potions: c.counters.potions || 0, chests: c.counters.chests || 0, digs: c.counters.digs || 0, lucky: c.counters.lucky || 0, junk: c.counters.junk || 0, bosses: c.counters.bossWins || 0, uniques: c.counters.uniques || 0 },
    };
  });
  return { v: 1, chars, at: Date.now() };
}
async function profilePublish(force) {
  if (!socOn() || !soc.me) return;
  if (!force && Date.now() - prof.lastPub < 2 * 60000) return;
  const card = profileCard(), sig = JSON.stringify(card.chars) + (account.settings.profileHidden ? 'h' : '');
  if (!force && sig === prof.sig) return;
  try { const ok = await rpc('tf_profile_publish', { p_card: card, p_hidden: !!account.settings.profileHidden }); if (ok !== false) { prof.lastPub = Date.now(); prof.sig = sig; } } catch (e) { }
}

async function profileOpen(by) {
  modal(`<div class="profpage"><p class="mute">Loading profile…</p></div>`, 'wide');
  try {
    const args = by.code ? { p_code: by.code } : { p_user: by.id };
    const d = await (socOn() ? rpc('tf_profile_get', args) : sbFetch('/rest/v1/rpc/tf_profile_get', { method: 'POST', body: JSON.stringify(args) }, false));
    prof.view = d;
    const el = document.querySelector('#modal .profpage'); if (el) el.outerHTML = profileHtml(d);
  } catch (e) { const el = document.querySelector('#modal .profpage'); if (el) el.innerHTML = `<p class="bad">${esc(e.message || 'Could not load that profile.')}</p><div class="row"><button data-act="close">Close</button></div>`; }
}
const profNum = n => N(+n || 0);
function profileHtml(d) {
  if (!d) return `<div class="profpage"><h2>Player not found</h2><p class="mute">That link or code doesn’t match a player.</p><div class="row"><button data-act="close">Close</button></div></div>`;
  const C = d.card, chars = (C && C.chars) || [];
  const head = `<div class="profhead"><div class="row" style="gap:12px;flex-wrap:nowrap;align-items:flex-start">${gameIcon(40)}<div><h2 style="margin:0">${esc(d.name)} ${d.guild ? `<span class="chip" title="${esc(d.guild.name)}">${esc(d.guild.tag)}</span>` : ''}</h2>
      <div class="mute" style="font-size:14px">${d.online ? '<span class="odot on"></span> online · ' : ''}${d.guild ? `${esc(G_RANK[d.guild.rank] || '')} of ${esc(d.guild.name)} · ` : ''}playing since ${new Date(d.joined).toLocaleDateString([], { month: 'short', year: 'numeric' })} · friend code <b>${esc(d.code)}</b></div></div></div>
      <div class="row" style="gap:6px">${d.me ? '' : socOn() && soc.me && !soc.friends.some(f => f.id === d.id) ? `<button class="sm pri" data-act="socaddname" data-arg="${esc(d.code)}">Add friend</button>` : ''}<button class="sm" data-act="profcopy" data-arg="${esc(d.code)}">Copy link</button></div></div>`;
  if (!C) return `<div class="profpage">${head}<p class="mute" style="margin-top:12px">${d.hidden ? 'This player keeps their characters private.' : 'This player hasn’t shared their characters yet.'}</p><div class="row"><button data-act="close">Close</button></div></div>`;
  const cards = chars.map(c => {
    const R = RACES.find(r => r.id === c.race) || RACES[0], K = CLASSES.find(k => k.id === c.cls) || CLASSES[0];
    return `${showcaseCharCard(c)}
        <div class="mute" style="font-size:14px">${esc(R.name)} ${esc(c.tierName || K.name)} · <b>${c.asc ? `A${c.asc} · ` : ''}Lv ${c.level}</b></div></div></div>
      <div class="profstats">
        <span><b>${profNum(c.ach)}</b> achievement points</span><span><b>${c.coll}%</b> collection</span>
        <span><b>${profNum(c.gathered)}</b> gathered</span><span><b>${profNum(c.kills)}</b> fights won</span>
        <span><b>${c.species}</b> pet species</span><span><b>${c.secrets}</b> secrets · <b>${c.lore}</b> lore page${c.lore === 1 ? '' : 's'}</span>
        ${c.events ? `<span><b>${c.events}</b> event${c.events === 1 ? '' : 's'}</span>` : ''}${c.streak ? `<span><b>${c.streak}</b>-day best streak</span>` : ''}</div>
      <div class="profrow">${(c.skills || []).map(([s, l]) => `<span class="chip">${esc(SKILLS[s] ? SKILLS[s].name : s)} ${l}</span>`).join('')}</div>
      ${profExtras(c)}
      ${c.pet || c.comp || (c.egos || []).length ? `<div class="profrow">${c.pet && typeof petGlyph === 'function' && SP(c.pet.sp) ? `<span class="row" style="gap:4px">${petGlyph(c.pet.sp, 32)}<span style="font-size:13px">${esc(c.pet.name || SP(c.pet.sp).name)} <span class="mute">Lv ${c.pet.level}</span></span></span>` : ''}${c.comp ? `<span style="font-size:13px">⚔ with <b>${esc(c.comp)}</b></span>` : ''}${(c.egos || []).length ? `<span style="font-size:13px">Sentient weapons: ${c.egos.map(esc).join(', ')}</span>` : ''}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="profpage">${head}<div class="profchars">${cards || '<p class="mute">No characters yet.</p>'}</div>
    <p class="mute" style="font-size:12px;margin:10px 0 0">Updated ${d.updated ? new Date(d.updated).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}.</p>
    <div class="row" style="margin-top:10px"><button data-act="close">Close</button></div></div>`;
}
function myProfileCard() {
  if (!socOn() || !soc.me) return '';
  const link = SITE_URL + '?p=' + encodeURIComponent(soc.me.code), hid = !!account.settings.profileHidden;
  return `<div class="card" style="margin-top:12px"><div class="spread"><h3>Your public profile</h3><span class="chip ${hid ? '' : 'on'}">${hid ? 'Hidden' : 'Public'}</span></div>
    <p class="mute" style="font-size:14px;margin:4px 0 8px">${hid ? 'Your characters are hidden. Others only see your player name, guild and friend code.' : 'Anyone with your link, and players who click your name, can see your characters: levels, titles, achievements, pets and progress. Never your email or save.'}</p>
    <div class="row" style="gap:6px"><input readonly value="${esc(link)}" aria-label="Profile link" style="flex:1;min-width:200px" onclick="this.select()"><button class="sm" data-act="profcopy" data-arg="${esc(soc.me.code)}">Copy link</button></div>
    <div class="row" style="gap:6px;margin-top:8px"><button class="sm" data-act="profview" data-arg="${esc(soc.me.code)}">View my profile</button><button class="sm ghost" data-act="profhide">${hid ? 'Make it public' : 'Hide my characters'}</button></div></div>`;
}
const PROFILE_HANDLERS = {
  profview: code => profileOpen({ code }),
  profuser: id => profileOpen({ id }),
  profcopy: async code => { const link = SITE_URL + '?p=' + encodeURIComponent(code); try { await navigator.clipboard.writeText(link); toast('Profile link copied.', 'verd'); } catch (e) { toast(esc(link)); } },
  profhide: async () => { account.settings.profileHidden = !account.settings.profileHidden; save(); await profilePublish(true); renderMain(); toast(account.settings.profileHidden ? 'Your characters are hidden.' : 'Your profile is public.', 'verd'); },
};
// Open a shared link: ?p=FRIENDCODE (works on the character screen, signed in or not).
function profileFromUrl() {
  const m = location.search.match(/[?&]p=([^&]+)/); if (!m) return;
  const code = decodeURIComponent(m[1]); history.replaceState(null, '', location.pathname + location.hash);
  setTimeout(() => { const w = document.getElementById('modal'); if (w) closeModal(); profileOpen({ code }); }, 50);
}

// v2.3: best gear, trophies and the extra profile sections.
function profBestGear(c) {
  let best = null;
  for (const k of Object.values((c.equip && c.equip.slots) || {})) { if (!k || typeof k !== 'string' || !k.startsWith('g:')) continue; const g = parseG(k), it = ITEM(k); if (!it) continue; const sc = g.grade * 100 + g.plus * 2 + (it.unique ? 50 : 0); if (!best || sc > best.sc) best = { sc, name: it.name, grade: g.grade, plus: g.plus }; }
  return best ? { name: best.name, grade: best.grade, plus: best.plus } : null;
}
function profTrophies(c) {
  const out = (c.pins || []).map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return a ? { k: 'ach', n: a.name } : null; }).filter(Boolean);
  const seen = new Set();
  for (const k of [...Object.values((c.equip && c.equip.slots) || {}), ...Object.keys(c.inv || {})]) { if (!k || typeof k !== 'string' || !k.startsWith('g:')) continue; const it = ITEM(k); if (it && it.unique && !seen.has(it.name)) { seen.add(it.name); out.push({ k: 'item', n: it.name }); } if (out.length >= 8) break; }
  return out.slice(0, 8);
}
function profExtras(c) {
  const parts = [], dgN = ['Normal', 'Heroic', 'Mythic'];
  if (c.arena || (c.dg && c.dg.some(Boolean)) || c.gear) parts.push(`<div class="profrow">${c.arena ? `<span class="chip" style="color:${PVP_TIERS[c.arena][1]};border-color:${PVP_TIERS[c.arena][1]}">Arena best: ${PVP_TIERS[c.arena][0]}</span>` : ''}${(c.dg || []).map((n, i) => n ? `<span class="chip">${dgN[i]} dungeons: ${n}</span>` : '').join('')}${c.gear ? `<span class="chip grade-${c.gear.grade}">Best gear: ${esc(c.gear.name)}${c.gear.plus ? ' +' + c.gear.plus : ''} (${GRADES[c.gear.grade]})</span>` : ''}</div>`);
  const f = c.fun;
  if (f) parts.push(`<details class="proffun"><summary>Lifetime stats</summary><div class="profstats">
      <span><b>${profNum(f.mined)}</b> rocks hit</span><span><b>${profNum(f.crafted)}</b> things crafted</span><span><b>${profNum(f.gold)}</b> gold earned</span>
      <span><b>${profNum(f.potions)}</b> potions and meals</span><span><b>${profNum(f.chests)}</b> chests opened</span><span><b>${profNum(f.digs)}</b> treasure dug up</span>
      <span><b>${profNum(f.lucky)}</b> Lucky Strikes</span><span><b>${profNum(f.junk)}</b> pieces of junk</span><span><b>${profNum(f.bosses)}</b> bosses beaten</span></div></details>`);
  if (c.trophies && c.trophies.length) parts.push(`<div class="trophies"><span class="mute" style="font-size:12px">Trophy shelf</span>${c.trophies.map(t => `<span class="trophy ${t.k}" title="${t.k === 'ach' ? 'Achievement' : 'Unique item'}">${t.k === 'ach' ? '\u{1F3C6}' : '\u2726'} ${esc(t.n)}</span>`).join('')}</div>`);
  return parts.join('');
}
