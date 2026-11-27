// ============================================================
// QUALITY OF LIFE (v1.4) — running-tasks panel views, automation
// (auto mode, auto potions, Grandmaster auto-stop), Train all,
// presets, quest Go buttons, the grid inventory with drag and
// drop, the new-character tour and extra colour themes.
// ============================================================
const QOL_DEFAULTS = { autoMode: false, autoPotion: false, stackPotion: true, gmStop: false, gmNext: false };
const qs = k => account.settings[k] !== undefined ? account.settings[k] : QOL_DEFAULTS[k];
const gmQueue = [];
const PRESET_MAX = 6;

// ---------- Starting actions without pop-ups ----------
function tryStart(id, quiet) {
  const a = ACT(id); if (!a || !isUnlocked(ch, a) || ch.actions.find(x => x.res === id)) return false;
  if (cantStart(a)) return false;
  if (a.inputs && craftable(ch, a) < 1) return false;
  if (staminaUsed() + a.stamina > D().stamina) return false;
  ch.actions.push({ res: id, prog: 0, streak: 0, vein: 0 });
  ch.counters.maxActive = Math.max(ch.counters.maxActive, ch.actions.length);
  if (!quiet) addLog('sys', `Started: ${SKILLS[a.skill].verb} ${a.name}.`);
  dirty = true; return true;
}
function stopAll() {
  const n = ch.actions.length; if (!n) return;
  ch.actions = []; addLog('sys', `Stopped all ${n} action${n > 1 ? 's' : ''}.`); dirty = true;
}

// ---------- Running-tasks panel ----------
const actView = () => account.settings.actView || (typeof window !== 'undefined' && window.innerWidth <= 900 ? 'compact' : 'full');
const ACT_VIEWS = { full: ['Compact', 'compact'], compact: ['Hide', 'hidden'], hidden: ['Show', 'full'] };
function actHeader(view) {
  const n = ch.actions.length, nx = ACT_VIEWS[view];
  return `<div class="spread acthead"><h3>Active actions${n ? ` <span class="mute" style="font-size:15px">· ${n} running</span>` : ''}</h3>
    <span class="row" style="gap:6px;align-items:center"><span class="num">Stamina <b data-live="stam"></b></span>
    <button class="sm chip ${qs('autoMode') ? 'on' : ''}" data-act="set" data-arg="autoMode|${!qs('autoMode')}" title="Auto mode fills free stamina with gathering">Auto ${qs('autoMode') ? 'on' : 'off'}</button>
    ${n ? '<button class="sm ghost" data-act="stopall">Stop all</button>' : ''}
    <button class="sm ghost" data-act="actview" data-arg="${nx[1]}" aria-label="${nx[0]} the actions panel">${nx[0]}</button></span></div>`;
}
function actChips() {
  return `<div class="achips">${ch.actions.map(a => { const o = ACT(a.res); return `<div class="aslot achip" data-res="${o.id}" title="${esc(o.name)} · ${SKILLS[o.skill].name}">${actIcon(o, 22)}<span class="achn">${esc(o.name)}</span><span class="bar"><i></i></span><button class="sm ghost achx" data-act="stop" data-arg="${o.id}" aria-label="Stop ${esc(o.name)}">✕</button></div>`; }).join('')}</div>`;
}
if (typeof window !== 'undefined') { let lastNarrow = null; window.addEventListener('resize', () => { const n = window.innerWidth <= 900; if (n !== lastNarrow) { lastNarrow = n; if (!account.settings.actView && ch && typeof renderActions === 'function') renderActions(); } }); }

// ---------- Automation ----------
const potStrength = it => it.power || Object.values(it.fx || {}).reduce((s, v) => s + v, 0);
// One buff per kind. A stronger one replaces a weaker one; a weaker one can't be used over a stronger one;
// the same strength adds its time (when "Stack potion time" is on), up to 24 hours.
function buffRule(key, now) {
  const it = ITEMS[key], cur = activeBuff(ch, it.cat, now || Date.now());
  if (!cur) return { mode: 'new' };
  const a = potStrength(ITEMS[cur.id]), b = potStrength(it);
  if (a > b) return { mode: 'blocked', cur };
  if (a < b) return { mode: 'replace', cur };
  return { mode: qs('stackPotion') ? 'stack' : 'replace', cur };
}
function autoPotions() {
  if (!ch.actions.length) return;
  const now = Date.now(), running = new Set(ch.actions.map(a => ACT(a.res).skill)), best = {};
  for (const k of Object.keys(ch.inv)) {
    const it = ITEMS[k]; if (!(ch.inv[k] > 0) || !it || it.type !== 'potion' || !it.cat || it.cat === 'food' || !potStrength(it)) continue;
    if (it.skill && !running.has(it.skill)) continue;
    if (activeBuff(ch, it.cat, now)) continue;
    const s = potStrength(it); if (!best[it.cat] || s > best[it.cat].s) best[it.cat] = { k, s };
  }
  for (const { k } of Object.values(best)) {
    const it = ITEMS[k]; takeItem(k, 1); ch.potions[it.cat] = { id: k, until: now + it.mins * 60000 }; ch.counters.potions++;
    addLog('lucky', `Auto-drank ${it.name}: ${it.desc}`); dirty = true;
  }
}
function processGm() {
  while (gmQueue.length) {
    const id = gmQueue.shift(), r = RES_BY[id]; if (!r || !qs('gmStop') || !ch.actions.find(a => a.res === id)) continue;
    stopAction(id, `${r.name} reached Grandmaster, so it stopped (Settings → Automation).`);
    if (qs('gmNext')) {
      const next = CHAIN[r.skill].filter(x => isUnlocked(ch, x) && availableHere(x) && tierOf(ch.prof[x.id] || 0) < 9 && !ch.actions.find(a => a.res === x.id)).pop();
      if (next && tryStart(next.id)) addLog('sys', `Moved on to ${next.name}.`);
    }
  }
}
function autoFill() {
  if (ch.travel || !ch.quest) return;
  let guard = 0;
  while (guard++ < 12) {
    const free = D().stamina - staminaUsed(); if (free <= 0) return;
    const busy = new Set(ch.actions.map(a => ACT(a.res).skill));
    const skills = GATHER_SKILLS.filter(s => !busy.has(s) && tabOpen(s)).sort((a, b) => ch.skills[a].level - ch.skills[b].level);
    let started = false;
    for (const s of skills) {
      const pick = CHAIN[s].filter(x => isUnlocked(ch, x) && availableHere(x) && x.stamina <= free && !(qs('gmStop') && tierOf(ch.prof[x.id] || 0) >= 9)).pop();
      if (pick && tryStart(pick.id, true)) { addLog('sys', `Auto mode: ${SKILLS[s].verb} ${pick.name}.`); started = true; break; }
    }
    if (!started) return;
  }
}
function qolTick() {
  if (!ch || screen !== 'game') return;
  try { processGm(); if (qs('autoPotion')) autoPotions(); if (qs('autoMode')) autoFill(); } catch (e) { console.warn(e); }
}

// ---------- Train all ----------
function trainAll() {
  let n = 0;
  for (const t of [...TRAINS].sort((a, b) => (ch.trainDay.gained[a.stat] || 0) - (ch.trainDay.gained[b.stat] || 0))) {
    if ((ch.trainDay.gained[t.stat] || 0) >= TRAIN_CFG.dailyCap - 1e-9) continue;
    if (tryStart(t.id, true)) n++;
  }
  if (n) addLog('sys', `Started training ${n} stat${n > 1 ? 's' : ''}.`);
  toast(n ? `Training ${n} stat${n > 1 ? 's' : ''}. ${staminaUsed() >= D().stamina ? 'Stamina is full.' : ''}` : 'Nothing to start: stamina is full or every stat is done for today.');
}

// ---------- Go: travel there and start ----------
function goStart(id) {
  const a = ACT(id); if (!a) return;
  const region = a.kind === 'gather' ? (a.band === 0 ? ch.loc : REGIONS[a.band].id) : a.kind === 'combat' ? a.region : a.kind === 'explore' ? a.id.slice(2) : ch.loc;
  const tabFor = a.kind === 'gather' ? a.skill : a.kind === 'combat' ? 'combat' : a.kind === 'explore' ? 'map' : tab;
  if (region === ch.loc && !ch.travel) {
    if (ch.actions.find(x => x.res === id)) { tab = tabFor; renderMain(); return; }
    if (!tryStart(id)) { const why = cantStart(a) || (staminaUsed() + a.stamina > D().stamina ? 'Not enough free stamina: stop something first.' : 'You can’t start that right now.'); toast(esc(why)); }
    if (a.kind === 'explore') mapSel = region;
    tab = tabFor; renderMain(); renderActions(); return;
  }
  if (ch.travel) { toast('You’re already on the road.'); return; }
  startTravel(region, false);
  if (ch.travel) { ch.travelThen = id; toast(`Travelling to <b>${esc(REGION_BY[region].name)}</b>. ${esc(a.name)} starts when you arrive.`, 'verd'); }
  renderMain(); renderActions(); renderTop();
}
function afterArrive(quiet, notes) {
  const id = ch.travelThen; if (!id) return; ch.travelThen = null;
  const a = ACT(id); if (!a) return;
  const ok = tryStart(id, true), why = !isUnlocked(ch, a) ? 'not unlocked yet' : cantStart(a) || (staminaUsed() + a.stamina > D().stamina ? 'no free stamina' : 'it can’t start right now'), msg = ok ? `Arrived and started ${a.name}.` : `Arrived, but couldn’t start ${a.name}: ${why}.`;
  if (quiet) notes.push(msg); else addLog('sys', msg);
}
function questGoTarget(q) {
  if (q.type === 'gather' || q.type === 'hunt' || q.type === 'boss' || q.type === 'explore') return q.target;
  return null;
}
const QUEST_GO_TAB = { craft: 'blacksmithing', gatherAny: 'mining', kills: 'combat' };

// ---------- Presets ----------
function presetNow(name) {
  return { name: String(name || '').trim().slice(0, 24) || `Preset ${(ch.presets || []).length + 1}`, slots: { ...ch.equip.slots }, tools: { ...ch.equip.tools }, pet: ch.petActive || null, support: [...(ch.petSupport || [])], fashion: { ...(ch.fashion || {}) }, pvp: [...pvpSkillsOf(ch)] };
}
function equipTo(key, where, slot) {
  const it = ITEM(key), need = it.slot === 'tool' ? ch.skills[it.toolSkill].level : gateLevel(ch);
  if (it.lvl > need || !(ch.inv[key] > 0)) return false;
  const old = where[slot]; takeItem(key, 1); where[slot] = key; if (old) addItem(old, 1, true);
  return true;
}
function applyPreset(i) {
  const p = (ch.presets || [])[i]; if (!p) return;
  let missing = 0;
  for (const [s, key] of Object.entries(p.slots || {})) if (key && ch.equip.slots[s] !== key) { if (!equipTo(key, ch.equip.slots, s)) missing++; }
  for (const [s, key] of Object.entries(p.tools || {})) if (key && ch.equip.tools[s] !== key) { if (!equipTo(key, ch.equip.tools, s)) missing++; }
  if (p.pet && ch.pets.some(x => x.uid === p.pet)) { ch.petActive = p.pet; ch.petSupport = (p.support || []).filter(u => u !== p.pet && ch.pets.some(x => x.uid === u)).slice(0, supportSlots(ch)); }
  ch.fashion = Object.fromEntries(Object.entries(p.fashion || {}).filter(([, id]) => FASHION_BY[id] && fashionOwned(ch, FASHION_BY[id])));
  if (Array.isArray(p.pvp)) { ch.pvp = ch.pvp || {}; ch.pvp.skills = p.pvp.filter(s => PVP_SKILLS[s] && pvpUnlocked(ch, s)).slice(0, 4); }
  fitStamina(); checkProgress();
  addLog('sys', `Preset "${p.name}" applied${missing ? ` (${missing} item${missing > 1 ? 's' : ''} not in your bag)` : ''}.`);
  toast(`<b>${esc(p.name)}</b> applied${missing ? ` · ${missing} item${missing > 1 ? 's' : ''} missing` : ''}.`, missing ? '' : 'verd');
  dirty = true; save(); renderMain(); renderActions(); renderSide();
}
function presetCard() {
  const P = ch.presets || [];
  return `<div class="card"><div class="spread"><h3>Presets</h3><span class="mute" style="font-size:13px">${P.length} / ${PRESET_MAX}</span></div>
    <p class="mute" style="margin:4px 0 8px;font-size:14px">Save your gear, tools, pets, outfit and Arena plan, then switch in one click (for example, a gathering set and a combat set).</p>
    ${P.map((p, i) => `<div class="spread presetrow"><span><b>${esc(p.name)}</b> <span class="mute" style="font-size:13px">${Object.values(p.slots || {}).filter(Boolean).length} gear · ${Object.values(p.tools || {}).filter(Boolean).length} tools${p.pet ? ' · pet' : ''}</span></span>
      <span class="row" style="gap:4px"><button class="sm pri" data-act="preapply" data-arg="${i}">Apply</button><button class="sm" data-act="presave" data-arg="${i}">Overwrite</button><button class="sm ghost" data-act="predel" data-arg="${i}" aria-label="Delete ${esc(p.name)}">✕</button></span></div>`).join('')}
    ${P.length < PRESET_MAX ? `<div class="row" style="gap:6px;margin-top:8px"><input id="prename" placeholder="Name, e.g. Gathering" maxlength="24" style="flex:1;min-width:140px" aria-label="Preset name"><button class="sm" data-act="presave" data-arg="new">Save current setup</button></div>` : ''}</div>`;
}

// ---------- Grid inventory with drag and drop ----------
function invTile(key) {
  const it = ITEM(key), q = ch.inv[key];
  return `<button class="itile r${it.rarity}" data-act="itile" data-arg="${esc(key)}" data-key="${esc(key)}" ${it.gear ? 'draggable="true"' : ''} aria-label="${esc(it.name)} × ${q}">${itemIcon(key, 40)}${q > 1 ? `<span class="iq">${N(q)}</span>` : ''}</button>`;
}
function itemTip(key) {
  const it = ITEM(key), rc = RARITIES[it.rarity];
  return `<b style="color:${rc.color}">${esc(it.name)}</b><div class="mute" style="font-size:12px">${rc.name}${it.gear ? ' · ' + esc(SLOT_NAMES[it.slot] || it.slot) : it.type ? ' · ' + esc(it.type) : ''} · ×${N(ch.inv[key] || 0)}</div>
    <div style="font-size:13px;margin-top:3px">${it.gear ? esc(statLine(it)) : esc(it.desc || '')}</div>${it.gear ? '<div class="mute" style="font-size:12px;margin-top:3px">Drag onto a matching slot to equip.</div>' : ''}`;
}
const dropSlotFor = it => !it || !it.gear ? null : it.slot === 'tool' ? ['t|' + it.toolSkill] : it.slot === 'ring' ? ['s|ring1', 's|ring2'] : ['s|' + it.slot];
function equipDrop(key, target) {
  const it = ITEM(key), ok = dropSlotFor(it); if (!ok || !ok.includes(target)) { toast('That doesn’t go there.'); return; }
  const [k, s] = target.split('|');
  const need = it.slot === 'tool' ? ch.skills[it.toolSkill].level : gateLevel(ch);
  if (it.lvl > need) { toast(`${esc(it.name)} needs ${it.slot === 'tool' ? SKILLS[it.toolSkill].name + ' ' : ''}level ${it.lvl}.`); return; }
  if (equipTo(key, k === 't' ? ch.equip.tools : ch.equip.slots, s)) { addLog('sys', `Equipped ${it.name}.`); fitStamina(); checkProgress(); dirty = true; renderMain(); renderActions(); }
}
if (typeof document !== 'undefined') {
  let dragKey = null;
  document.addEventListener('dragstart', e => { const t = e.target.closest && e.target.closest('.itile[draggable=true]'); if (!t) return; dragKey = t.dataset.key; e.dataTransfer.setData('text/plain', dragKey); e.dataTransfer.effectAllowed = 'move'; const ok = dropSlotFor(ITEM(dragKey)) || []; document.querySelectorAll('.eslot[data-drop]').forEach(el => el.classList.toggle('dropok', ok.includes(el.dataset.drop))); });
  document.addEventListener('dragend', () => { dragKey = null; document.querySelectorAll('.eslot.dropok,.eslot.dropover').forEach(el => el.classList.remove('dropok', 'dropover')); });
  document.addEventListener('dragover', e => { const s = e.target.closest && e.target.closest('.eslot.dropok'); if (s) { e.preventDefault(); s.classList.add('dropover'); } });
  document.addEventListener('dragleave', e => { const s = e.target.closest && e.target.closest('.eslot'); if (s) s.classList.remove('dropover'); });
  document.addEventListener('drop', e => { const s = e.target.closest && e.target.closest('.eslot[data-drop]'); if (!s) return; e.preventDefault(); const key = e.dataTransfer.getData('text/plain') || dragKey; if (key) equipDrop(key, s.dataset.drop); });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest && e.target.closest('.itile'), tip = document.getElementById('itip');
    if (!t) { if (tip) tip.hidden = true; return; }
    let el = tip; if (!el) { el = document.createElement('div'); el.id = 'itip'; el.className = 'itip'; document.body.appendChild(el); }
    el.innerHTML = itemTip(t.dataset.key); el.hidden = false;
    const r = t.getBoundingClientRect(); el.style.left = Math.min(window.innerWidth - 270, r.right + 8) + 'px'; el.style.top = Math.max(8, Math.min(window.innerHeight - 140, r.top)) + 'px';
  });
}

if (typeof document !== 'undefined') document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#modal .itemmodal button[data-act]'); if (b && b.dataset.act !== 'close' && b.dataset.act !== 'upgrade') setTimeout(() => { const m = document.querySelector('#modal .itemmodal'); if (m) closeModal(); }, 0); });

// ---------- New-character tour ----------
const TOUR = [
  { t: null, sel: null, h: 'Welcome to Thousandfold!', p: 'A quick tour of the basics. It takes about a minute, and you can skip it at any time (replay it later from Settings).' },
  { t: 'mining', sel: '#main .card.ore', h: 'Gathering', p: 'Each gathering skill has a chain of resources. Start one and it keeps going on its own, even while you’re away. The more you gather something, the faster you get at it.' },
  { t: 'mining', sel: '#act', h: 'Active actions', p: 'Everything you have running shows here. Each action uses stamina. Hide or shrink this panel, stop everything at once, or switch on Auto mode to fill free stamina for you.' },
  { t: 'quests', sel: '#main .card.quest.cur, #main .card', h: 'Quests', p: 'Your first guide has 10 small tasks for you. Each gives a permanent stat point, and finishing them opens the world map. Go buttons take you straight to the right place.' },
  { t: 'inv', sel: '#main .card', h: 'Inventory and gear', p: 'Sell, use and equip items here. Switch to the grid view to drag gear straight onto your equipment slots.' },
  { t: 'char', sel: '#main .card', h: 'Your hero', p: 'Spend stat points here, save presets for different jobs, and dress up in the Wardrobe.' },
  { t: 'combat', sel: '#main .card', h: 'Combat', p: 'Fights run on their own too. Keep your combat power above an enemy’s recommended power, and fights get very fast once you are far stronger.' },
  { t: 'settings', sel: '#main .card', h: 'Settings and the Game Guide', p: 'Read the Game Guide, pick a colour theme and switch on automation like auto-potions. That’s it: have fun!' },
];
function tourShow() {
  document.querySelectorAll('.tourhi').forEach(el => el.classList.remove('tourhi'));
  let box = document.getElementById('tourbox');
  if (!ch || !ch.tour || ch.tour.done || screen !== 'game') { if (box) box.remove(); return; }
  const i = Math.min(ch.tour.step, TOUR.length - 1), s = TOUR[i];
  if (s.t && tab !== s.t) { tab = s.t; renderMain(); }
  if (s.sel) { const el = document.querySelector(s.sel); if (el) { el.classList.add('tourhi'); try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { } } }
  if (!box) { box = document.createElement('div'); box.id = 'tourbox'; box.className = 'tourbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Tour'); document.body.appendChild(box); }
  box.innerHTML = `<div class="spread"><span class="mute" style="font-size:12px">Tour · ${i + 1} of ${TOUR.length}</span><button class="sm ghost" data-act="tourskip">Skip tour</button></div>
    <h3 style="margin:4px 0">${esc(s.h)}</h3><p style="margin:0 0 10px;font-size:15px">${esc(s.p)}</p>
    <div class="row" style="gap:6px;justify-content:flex-end">${i ? '<button class="sm" data-act="tourback">Back</button>' : ''}<button class="sm pri" data-act="tournext">${i === TOUR.length - 1 ? 'Finish' : 'Next'}</button></div>`;
}
function tourEnd(skipped) {
  if (!ch) return; ch.tour = { done: true }; account.tourSeen = true; save();
  document.querySelectorAll('.tourhi').forEach(el => el.classList.remove('tourhi')); const b = document.getElementById('tourbox'); if (b) b.remove();
  if (!skipped) toast('Tour done. You can replay it from Settings.', 'verd');
}
function tourMaybe() { if (ch && ch.tour && !ch.tour.done) setTimeout(tourShow, 50); }

// ---------- Colour themes ----------
const THEMES = [['dark', 'Dark'], ['light', 'Light'], ['ember', 'Ember'], ['forest', 'Forest'], ['ocean', 'Ocean'], ['parchment', 'Parchment'], ['midnight', 'Midnight'], ['contrast', 'High contrast'], ['auto', 'Follow app']];

function automationCard() {
  const tg = (k, on, off) => `<button class="chip ${qs(k) ? 'on' : ''}" data-act="set" data-arg="${k}|${!qs(k)}">${qs(k) ? on : off}</button>`;
  return `<div class="card"><b>Automation</b><p class="mute" style="margin:4px 0 8px;font-size:14px">Optional helpers. Auto mode fills free stamina with gathering in your lowest skills.</p>
    <div class="row" style="gap:6px">${tg('autoMode', 'Auto mode: on', 'Auto mode: off')}${tg('autoPotion', 'Auto-use potions: on', 'Auto-use potions: off')}${tg('stackPotion', 'Stack potion time: on', 'Stack potion time: off')}</div>
    <div class="row" style="gap:6px;margin-top:6px">${tg('gmStop', 'Stop at Grandmaster: on', 'Stop at Grandmaster: off')}${qs('gmStop') ? tg('gmNext', 'Then move on to the next resource: on', 'Then move on to the next resource: off') : ''}</div>
    <div class="row" style="gap:6px;margin-top:6px;align-items:center"><button class="chip ${abOn() ? 'on' : ''}" data-act="set" data-arg="autoBuy|${!abOn()}">Auto-buy shop ingredients: ${abOn() ? 'on' : 'off'}</button><label class="mute" style="font-size:14px" for="abtarget">Keep</label><input id="abtarget" type="number" min="1" step="100" inputmode="numeric" value="${abTarget()}" style="width:8em" aria-label="Amount to keep in stock"><span class="mute" style="font-size:13px">in stock</span></div>
    <div class="row" style="gap:6px;margin-top:6px">${(() => { const lo = account.settings.listOrder || (window.innerWidth <= 900 ? 'best' : 'chain'); return `<button class="chip ${lo === 'best' ? 'on' : ''}" data-act="set" data-arg="listOrder|${lo === 'best' ? 'chain' : 'best'}">List order: ${lo === 'best' ? 'best first' : 'starting first'}</button>`; })()}</div>
    <div class="row" style="gap:6px;margin-top:10px"><button class="sm" data-act="coachrestart">Restart the tutorial</button></div></div>`;
}

const QOL_HANDLERS = {
  stopall: () => { stopAll(); renderMain(); renderActions(); },
  actview: v => { account.settings.actView = v; save(); renderActions(); },
  trainall: () => { trainAll(); renderMain(); renderActions(); },
  gostart: id => goStart(id),
  qgo: i => { const q = ch.qactive[+i]; if (!q) return; const t = questGoTarget(q); if (t) goStart(t); else { tab = QUEST_GO_TAB[q.type] || 'prof'; renderMain(); } },
  presave: a => { ch.presets = ch.presets || []; if (a === 'new') { if (ch.presets.length >= PRESET_MAX) return; const el = document.getElementById('prename'); ch.presets.push(presetNow(el && el.value)); } else { const p = ch.presets[+a]; if (p) ch.presets[+a] = presetNow(p.name); } toast('Preset saved.', 'verd'); dirty = true; save(); renderMain(); },
  preapply: i => applyPreset(+i),
  predel: i => { ch.presets.splice(+i, 1); dirty = true; save(); renderMain(); },
  invgrid: () => { account.settings.invGrid = !account.settings.invGrid; save(); renderMain(); },
  itile: key => { if (!(ch.inv[key] > 0)) return; modal(`<div class="inv">${invRow(key)}</div><div class="row" style="justify-content:flex-end;margin-top:10px"><button data-act="close">Close</button></div>`, 'itemmodal'); },
  tournext: () => { if (!ch.tour) return; if (ch.tour.step >= TOUR.length - 1) tourEnd(false); else { ch.tour.step++; tourShow(); } },
  tourback: () => { if (!ch.tour) return; ch.tour.step = Math.max(0, ch.tour.step - 1); tourShow(); },
  tourskip: () => tourEnd(true),
  tourreplay: () => { ch.tour = { step: 0 }; tourShow(); },
};
