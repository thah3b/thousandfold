// ============================================================
// v2.0b — player feedback (to the admin's Feedback inbox in Chat),
// auto-buy of shop ingredients for crafting, and per-item
// "auto-use until it runs out" for potions and meals.
// ============================================================

// ---------- Feedback ----------
const FB_CATS = [['bug', 'Bug'], ['idea', 'Idea'], ['other', 'Other']];
const fb = { cat: 'idea', list: null, all: false, err: '', busy: false };
function deviceId() {
  if (!account.deviceId) { const a = new Uint8Array(12); (crypto.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256)); account.deviceId = 'd' + Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); save(); }
  return account.deviceId;
}
function feedbackModal() {
  const me = typeof soc !== 'undefined' && soc.me;
  modal(`<h3>Send feedback</h3><p class="mute" style="margin:4px 0 10px;font-size:14px">Found a bug, have an idea, or just want to say something? It goes straight to the developer.</p>
    <div class="row" style="gap:6px;margin-bottom:8px" id="fbcats">${FB_CATS.map(([v, n]) => `<button class="chip ${fb.cat === v ? 'on' : ''}" data-act="fbcat" data-arg="${v}">${n}</button>`).join('')}</div>
    <textarea id="fbbody" maxlength="1000" rows="6" style="width:100%" placeholder="What happened, or what would you like to see?" aria-label="Your feedback"></textarea>
    <div class="mute" style="font-size:12px;text-align:right"><span id="fbcount">0</span> / 1,000</div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:6px;margin-top:6px"><input id="fbname" maxlength="40" placeholder="Name (optional)" value="${esc(me ? me.name || '' : ch ? ch.name : '')}" aria-label="Name"><input id="fbcontact" maxlength="80" placeholder="How to reach you (optional)" aria-label="Contact"></div>
    <p class="mute" style="font-size:12px;margin:8px 0 0">We also send the game version, your device type and a short summary of your character (class, race, level) to help with bug reports. Up to 3 messages an hour.</p>
    <div id="fbmsg" class="mute" style="font-size:14px;min-height:1.2em;margin-top:6px"></div>
    <div class="row" style="justify-content:flex-end;gap:6px;margin-top:6px"><button data-act="close">Cancel</button><button class="pri" data-act="fbsend">Send</button></div>`);
  const t = document.getElementById('fbbody'); if (t) { t.addEventListener('input', () => { const c = document.getElementById('fbcount'); if (c) c.textContent = t.value.length; }); t.focus(); }
}
function fbMeta() {
  const ua = navigator.userAgent || '', mob = /Mobi|Android|iPhone|iPad/i.test(ua) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Other';
  return { v: GAME_VERSION, device: `${mob ? 'Phone' : 'Desktop'} · ${br}`, w: window.innerWidth, h: window.innerHeight, tab: typeof tab !== 'undefined' ? tab : '',
    char: ch ? { race: ch.race, cls: ch.cls, level: ch.level, asc: ch.ascension || 0, loc: ch.loc } : null, guest: !(typeof soc !== 'undefined' && soc.me) };
}
async function fbSend() {
  const body = (document.getElementById('fbbody') || {}).value || '', msg = document.getElementById('fbmsg');
  if (body.trim().length < 3) { if (msg) msg.textContent = 'Please write a little more.'; return; }
  if (fb.busy) return; fb.busy = true; if (msg) msg.textContent = 'Sending…';
  const args = { p_device: deviceId(), p_name: (document.getElementById('fbname') || {}).value || '', p_contact: (document.getElementById('fbcontact') || {}).value || '', p_category: fb.cat, p_body: body, p_meta: fbMeta() };
  try {
    if (typeof socOn === 'function' && socOn()) await rpc('tf_feedback_send', args);
    else await sbFetch('/rest/v1/rpc/tf_feedback_send', { method: 'POST', body: JSON.stringify(args) }, false);
    closeModal(); toast('<b>Thank you!</b> Your feedback was sent.', 'verd');
  } catch (e) {
    const offline = /claude|claudeusercontent/.test(location.hostname) || /Failed to fetch|NetworkError|Load failed/i.test(e.message || '');
    if (msg) { msg.className = 'bad'; msg.textContent = offline ? 'Couldn’t reach the server. Feedback works on the website: thah3b.github.io/thousandfold' : (e.message || 'Couldn’t send. Please try again.'); }
  }
  fb.busy = false;
}
// Admin inbox (Chat tab → Feedback).
const isAdminMe = () => typeof soc !== 'undefined' && soc.me && soc.me.admin;
async function fbLoad() { try { fb.list = await rpc('tf_feedback_list', { p_all: fb.all }); fb.err = ''; fb.unread = 0; if (typeof renderNav === 'function') renderNav(); account.fbSeen = Math.max(account.fbSeen || 0, ...(fb.list || []).map(f => f.id)); save(); } catch (e) { fb.err = e.message || 'Could not load feedback.'; } if (tab === 'chat') renderMain(); }
function feedbackInboxHtml() {
  if (!fb.list && !fb.err) { setTimeout(fbLoad, 0); return '<p class="mute">Loading feedback…</p>'; }
  if (fb.err) return `<p class="bad">${esc(fb.err)}</p>`;
  const catc = { bug: 'bad', idea: 'verd', other: 'mute' };
  return `<div class="spread" style="margin-bottom:8px"><span class="mute" style="font-size:14px">${fb.list.length} ${fb.all ? 'messages' : 'open'} · newest first</span><span class="row" style="gap:6px"><button class="chip ${fb.all ? 'on' : ''}" data-act="fball">${fb.all ? 'Showing all' : 'Open only'}</button><button class="sm" data-act="fbrefresh">Refresh</button></span></div>
    ${fb.list.length ? fb.list.map(f => { const m = f.meta || {}, c = m.char; return `<div class="card fbitem ${f.done ? 'done' : ''}"><div class="spread"><span><b class="${catc[f.category] || ''}">${esc(f.category.toUpperCase())}</b> · <b>${esc(f.name || f.player || 'Anonymous')}</b>${f.signedIn ? ` <span class="chip">${esc(f.player || 'player')}</span>` : ' <span class="chip">guest</span>'}</span><span class="mute" style="font-size:12px">${new Date(f.at).toLocaleString()}</span></div>
      <p style="margin:6px 0;white-space:pre-wrap">${esc(f.body)}</p>
      <div class="mute" style="font-size:12px">${esc(m.v || '')} · ${esc(m.device || '')}${m.w ? ` · ${m.w}×${m.h}` : ''}${c ? ` · ${esc(c.race)} ${esc(c.cls)} Lv ${c.level}${c.asc ? ' A' + c.asc : ''} in ${esc(c.loc)}` : ''}${m.tab ? ` · on ${esc(m.tab)}` : ''}${f.contact ? ` · contact: ${esc(f.contact)}` : ''}</div>
      <div class="row" style="margin-top:6px"><button class="sm ${f.done ? '' : 'pri'}" data-act="fbdone" data-arg="${f.id}|${!f.done}">${f.done ? 'Reopen' : 'Mark done'}</button></div></div>`; }).join('') : '<p class="mute">No feedback yet.</p>'}`;
}
const FEEDBACK_HANDLERS = {
  feedback: () => feedbackModal(),
  fbcat: c => { fb.cat = c; document.querySelectorAll('#fbcats .chip').forEach(b => b.classList.toggle('on', b.dataset.arg === c)); },
  fbsend: () => fbSend(),
  fbrefresh: () => { fb.list = null; renderMain(); },
  fball: () => { fb.all = !fb.all; fb.list = null; renderMain(); },
  fbdone: async a => { const [id, d] = a.split('|'); try { await rpc('tf_feedback_done', { p_id: +id, p_done: d === 'true' }); } catch (e) { toast(esc(e.message)); } fb.list = null; renderMain(); },
};

// ---------- Auto-buy shop ingredients for crafting ----------
const abOn = () => account.settings.autoBuy !== false;
const abTarget = () => Math.max(1, Math.min(1e6, Math.floor(+account.settings.buyTarget || 1000)));
const shopIngredient = k => SHOP.supplies.includes(k);
function autoBuy(quiet) {
  if (!ch || !abOn()) return;
  const want = new Set();
  for (const a of ch.actions) { const o = ACT(a.res); if (o && o.inputs) for (const k of Object.keys(o.inputs)) if (shopIngredient(k)) want.add(k); }
  if (!want.size) return;
  const d = D(), target = abTarget(), bought = [];
  for (const k of want) {
    const have = ch.inv[k] || 0; if (have >= target) continue;
    const price = shopPrice(k, d); if (!(price > 0)) continue;
    const n = Math.min(target - have, Math.floor(ch.gold * 0.5 / price)); // never spend more than half your gold
    if (n <= 0) continue;
    if (!ch.inv[k] && usedSlots() >= ch.invSlots) continue;
    ch.gold -= n * price; addItem(k, n, true); ch.counters.shopBuys++; bought.push(`${N(n)} ${ITEM(k).name} (${N(n * price)}g)`);
  }
  if (bought.length) { addLog('sys', `Auto-bought ${bought.join(', ')}.`); dirty = true; }
}
function autoBuyBar(skill) {
  const uses = RECIPES_BY[skill] && RECIPES_BY[skill].some(r => r.inputs && Object.keys(r.inputs).some(shopIngredient));
  if (!uses) return '';
  return `<div class="row abbar" style="gap:6px;align-items:center;margin:-2px 0 10px"><button class="chip ${abOn() ? 'on' : ''}" data-act="set" data-arg="autoBuy|${!abOn()}">Auto-buy shop ingredients: ${abOn() ? 'on' : 'off'}</button>
    <label class="mute" style="font-size:14px" for="abtarget">Keep</label><input id="abtarget" type="number" min="1" step="100" inputmode="numeric" value="${abTarget()}" style="width:8em" aria-label="Amount to keep in stock">
    <span class="mute" style="font-size:13px">in stock (spends at most half your gold)</span></div>`;
}
if (typeof document !== 'undefined') document.addEventListener('change', e => { if (e.target && e.target.id === 'abtarget') { account.settings.buyTarget = Math.max(1, Math.min(1e6, Math.floor(+e.target.value || 1000))); save(); toast(`Auto-buy keeps ${N(abTarget())} in stock.`); } });

// ---------- Auto-use a consumable until it runs out ----------
const autoUsable = k => { const it = ITEMS[k]; return !!(it && (it.type === 'potion' || it.type === 'food') && it.cat && (it.power || Object.keys(it.fx || {}).length)); };
function autoUseTick() {
  const au = ch.autoUse; if (!au || !ch.actions.length) return;
  const now = Date.now();
  for (const k of Object.keys(au)) {
    if (!(ch.inv[k] > 0)) { delete au[k]; addLog('sys', `${ITEMS[k] ? ITEMS[k].name : k} ran out: auto-use stopped.`); dirty = true; continue; }
    const it = ITEMS[k]; if (!it || activeBuff(ch, it.cat, now)) continue;
    takeItem(k, 1); ch.potions[it.cat] = { id: k, until: now + it.mins * 60000 }; ch.counters.potions++;
    addLog('lucky', `Auto-used ${it.name} (${N(ch.inv[k] || 0)} left).`); dirty = true;
  }
}
const EXTRA_HANDLERS = { autouse: k => { ch.autoUse = ch.autoUse || {}; if (ch.autoUse[k]) delete ch.autoUse[k]; else if (autoUsable(k)) ch.autoUse[k] = 1; dirty = true; save(); renderMain(); } };

// Admins: count new feedback for the Chat badge (checked once a minute while signed in).
let fbPollAt = 0;
async function fbPoll() {
  if (!isAdminMe() || Date.now() - fbPollAt < 60000) return; fbPollAt = Date.now();
  try { const l = await rpc('tf_feedback_list', { p_all: false }); fb.unread = (l || []).filter(f => f.id > (account.fbSeen || 0)).length; if (tab === 'chat' && soc.chan === 'feedback') { fb.list = l; account.fbSeen = Math.max(account.fbSeen || 0, ...l.map(f => f.id)); fb.unread = 0; save(); renderMain(); } renderNav(); } catch (e) {}
}
