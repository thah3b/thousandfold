// ============================================================
// STATE — save/load, migration, progress, the game step and offline.
// ============================================================
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'thousandfold.v1';
// Names (v0.11b): any letters, symbols, emoji or lenny faces. Only limits: 1–24 characters,
// no invisible/control characters (they break layouts and allow look-alike tricks), no slurs.
const NAME_MAX = 24, NAME_BAD_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/;
function nameProblem(n) {
  n = String(n == null ? '' : n).trim(); const len = Array.from(n).length;
  if (!len) return 'Enter a name.';
  if (len > NAME_MAX) return `Up to ${NAME_MAX} characters.`;
  if (NAME_BAD_CHARS.test(n)) return 'That name has hidden or control characters in it.';
  const flat = n.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/[^a-z]/g, '');
  if (PROFANITY.some(w => flat.includes(w))) return 'Please choose another name.';
  return '';
}
const rng = Math.random;
const pick = a => a[Math.floor(Math.random() * a.length)];

let account = null, ch = null, screen = 'select', tab = 'mining', dirty = false;
let agg = {}, rate = {}, lastFlush = 0, booted = false;

function newAccount() {
  return { v: 2, slots: [null, null, null], slot4: false, shards: 0, activeSlot: null,
    settings: { theme: 'dark', num: 'short', reduced: false, large: false, sound: true } };
}
function save() { if (!account) return; if (ch) ch.last = Date.now(); account.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(account)); } catch (e) { } }
function loadLocal() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

const OLD_TOOLS = { worn_pick: 'g:worn_pickaxe:1:0', bronze_pick: 'g:pickaxe_0:1:0', sturdy_mattock: 'g:sturdy_mattock:1:0', iron_pick: 'g:pickaxe_1:1:0', steel_pick: 'g:pickaxe_2:1:0', mithril_pick: 'g:pickaxe_5:1:0', star_pick: 'g:pickaxe_6:1:0' };
function blankCounters() { return { gathered: 0, crafted: 0, sold: 0, goldEarned: 0, toolsBought: 0, potions: 0, lucky: 0, triple: 0, veins: 0, unsold: 0, midnight: 0, mastered: 0, grand: 0, oresUnlocked: 1, maxActive: 0, godore: 0, stoneGrand: 0, fine: 0, masterwork: 0, maxPlus: 0, slotsFilled: 0, merchantBuys: 0, savingsPeak: 0, junk: 0, boot: 0, minGatherLvl: 1, kills: 0, bossKinds: 0, bossWins: 0, undeadKills: 0, rareDrops: 0, upgrades: 0, masterworks: 0, arrivals: 0, egosFound: 0, compSworn: 0, growthTier: 0, hatched: 0, species: 0, mythicPet: 0, evolved: 0, mounted: 0, combos: 0, bred: 0, collMin: 0, boardDone: 0, weeklyDone: 0, storiesDone: 0, elixirs: 0, trainedPts: 0, titlesEarned: 0, shardsEarned: 0, uniques: 0, tutorial: 0, regionsVisited: 1, regionsMapped: 0, hiddenFound: 0, shopBuys: 0, secrets: 0 }; }
function migrate(c) {
  c.skills = c.skills || {}; c.totals = c.totals || {}; c.unlocked = c.unlocked || {};
  for (const s of SKILL_IDS) { c.skills[s] = c.skills[s] || { xp: 0, level: 1 }; c.totals[s] = c.totals[s] || 0; }
  for (const s of GATHER_SKILLS) c.unlocked[s] = c.unlocked[s] || 1;
  if (!c.equip || !c.equip.slots) {
    const old = c.equip && c.equip.tool;
    c.equip = { slots: Object.fromEntries(SLOTS.map(s => [s, null])), tools: Object.fromEntries(GATHER_SKILLS.map(s => [s, gkey(STARTER_TOOLS[s])])) };
    if (old && OLD_TOOLS[old]) c.equip.tools.mining = OLD_TOOLS[old];
  }
  for (const k of Object.keys(c.inv)) if (OLD_TOOLS[k]) { c.inv[OLD_TOOLS[k]] = (c.inv[OLD_TOOLS[k]] || 0) + c.inv[k]; delete c.inv[k]; }
  const cn = blankCounters(); if (c.counters && c.counters.mined != null) { c.counters.gathered = c.counters.mined; delete c.counters.mined; delete c.counters.unlocked; }
  c.counters = Object.assign(cn, c.counters || {});
  if (!c.quest) c.quest = { step: TUTORIAL_TITLES.length, done: true };
  c.talents = c.talents || {}; c.autoSell = c.autoSell || {}; c.ascension = c.ascension || 0; c.ascGrowth = c.ascGrowth || 0; c.egos = c.egos || {}; c.comp = c.comp || null; c.growth = c.growth || null;
  c.elixirs = c.elixirs || {}; c.trained = c.trained || {}; c.trainDay = c.trainDay || { day: '', gained: {} }; c.qactive = c.qactive || []; c.board = c.board || { taken: {} }; c.story = c.story || {}; c.storyBase = c.storyBase || {};
  for (const [k, v] of Object.entries({ pets: [], petActive: null, petSupport: [], incub: [], incubSlots: 1, petDex: {}, daycare: [], breedAt: 0, cosmetics: { hats: [], auras: [] }, combosSeen: {}, petSeq: 0 })) if (c[k] === undefined) c[k] = v;
  c.adv = c.adv || { tier: 1, spec: null, quest: { tier: 2, step: 0, base: 0 }, secondary: null, secOpen: false };
  c.freeTreeRespecs = c.freeTreeRespecs || 0; c.treeRespecs = c.treeRespecs || 0;
  if (!c.loc) c.loc = START_TO_REGION[c.region];
  c.visited = c.visited || { [c.loc]: true };
  c.secrets = c.secrets || {}; c.riddle = c.riddle || null;
  c.fashion = c.fashion || {}; c.wardrobe = c.wardrobe || {}; c.tour = c.tour || { done: true }; c.gate = c.gate || { all: true }; c.coach = c.coach || { on: false, done: {} }; c.presets = c.presets || [];
  if (c.invSlots != null && !c.bag100) c.invSlots += BALANCE.storage.invSlots - 60; // v0.12a: base bag 60 -> 100 (now -> 200 in one go)
  else if (c.invSlots != null && !c.bag200) c.invSlots += 100; // v2.0e: base bag 100 -> 200
  c.bag100 = true; c.bag200 = true;
  Object.assign(c, Object.assign({ market: {}, bank: {}, questStats: {}, seen: {}, bossKilled: {}, areasSeen: {}, clog: [], combatFood: null, travel: null, nextEvent: 0, eventBuff: null, hp: null, invSlots: BALANCE.storage.invSlots, bankSlots: BALANCE.storage.bankSlots, invUps: 0, bankUps: 0, savings: { bal: 0, t: Date.now() }, merchant: { day: 0, bought: {} }, titlesSeen: [], secretTitles: {}, pins: [], ach: {}, potions: {}, log: [] }, c));
  return c;
}
function gateVeteran() {
  if (typeof location !== 'undefined' && /[?&]tftest=1/.test(location.search)) return true; // automated tests start unlocked
  if (typeof account === 'undefined' || !account) return false;
  return account.slots.some(c => c && (!c.gate || c.gate.all || (typeof GATES !== 'undefined' && Object.keys(GATES).every(id => tabOpen(id, c)))));
}
function newCharacter(w) {
  const origin = ORIGINS.find(o => o.id === w.origin);
  const c = migrate({
    quest: { step: 0, done: false }, tour: { done: true },
    // v2.5: new players unlock tabs as they progress and get the guided tutorial; players who already have a
    // fully unlocked character on this save know the game, so their new characters start with everything open.
    ...(gateVeteran() ? { gate: { all: true }, coach: { on: false, done: {} } } : { gate: { all: false, open: {}, fresh: {} }, coach: { on: true, done: {} } }),
    id: 'c' + Date.now().toString(36), name: w.name.trim(), gender: w.gender,
    race: w.race, cls: w.cls, origin: w.origin, region: w.region, created: Date.now(), last: Date.now(),
    gold: 25 + origin.gold, xp: 0, level: 1, unspent: 0, skillPts: 0, respecs: 0, freeRespecs: 0, alloc: {}, prof: {}, inv: {}, actions: [], offlineUpgrades: 0, displayTitle: null,
  });
  c.inv[origin.item] = origin.qty;
  c.quest = { step: 0, done: false };
  c.log.push({ t: Date.now(), k: 'sys', s: `${c.name} arrives in ${START_REGIONS.find(r => r.id === c.region).name}.` });
  return c;
}

// ---------- Helpers ----------
const N = n => fmt(n, account && account.settings.num);
const race = () => RACES.find(r => r.id === ch.race), cls = () => CLASSES.find(c => c.id === ch.cls);
const regionName = () => START_REGIONS.find(r => r.id === ch.region).name;
const D = skill => derive(ch, Date.now(), null, skill);
const usedSlots = () => Object.keys(ch.inv).filter(k => ch.inv[k] > 0).length;
const bankUsed = () => Object.keys(ch.bank).filter(k => ch.bank[k] > 0).length;
function addItem(key, n, force) {
  if (n <= 0) return true;
  if (!ch.inv[key] && !force && usedSlots() >= ch.invSlots) return false;
  ch.inv[key] = (ch.inv[key] || 0) + n; ch.seen[key] = 1; return true;
}
function takeItem(key, n) { ch.inv[key] = (ch.inv[key] || 0) - n; if (ch.inv[key] <= 0) delete ch.inv[key]; }
function staminaUsed() { return ch.actions.reduce((s, a) => s + ACT(a.res).stamina, 0) + (ch.dungeon && !ch.dungeon.done ? 2 : 0); }
function sellPrice(key, now) { return ITEM(key).value * D().sell * priceMult(ch, key, now || Date.now()); }

// ---------- Toasts, modal, log, sound ----------
function toast(html, kind) {
  const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = html;
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), 4200);
  while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
}
function modal(html, cls) { closeModal(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.innerHTML = `<div class="card ${cls || ''}" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m); const f = m.querySelector('button.pri,input,button'); if (f) f.focus(); }
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
function addLog(k, s) { ch.log.unshift({ t: Date.now(), k, s }); if (ch.log.length > 150) ch.log.length = 150; if (typeof renderLog === 'function') renderLog(); }
let actx = null;
function chime(f1, f2) {
  if (!account.settings.sound) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const t = actx.currentTime;
    [f1, f2].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * .09); g.gain.exponentialRampToValueAtTime(0.08, t + i * .09 + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * .09 + .35); o.connect(g).connect(actx.destination); o.start(t + i * .09); o.stop(t + i * .09 + .4); });
  } catch (e) { }
}
function flash() { if (account.settings.reduced) return; const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 800); }

// ---------- Progress ----------
function addXp(skill, xp, quiet, notes) {
  const sk = ch.skills[skill]; sk.xp += xp;
  const L = levelFromXp(sk.xp).level;
  if (L > sk.level) { const msg = `${SKILLS[skill].name} reached level ${L}`; sk.level = L; quiet ? notes.push(msg) : addLog('level', msg); dirty = true; }
  ch.xp += xp * BALANCE.level.charXpShare;
  if (ch.comp) { const L0 = compLevel(ch.comp); ch.comp.xp += xp * (ch.cls === 'healer' && ch.comp.cls === 'healer' ? BALANCE.level.charXpShare : 0.25); const L1 = compLevel(ch.comp); if (L1 > L0) { const nm = COMPANIONS[ch.comp.cls][0], msg = `${nm} reached level ${L1}.`; quiet ? notes.push(msg) : addLog('level', msg); dirty = true; } }
  if (ch.pets && ch.pets.length && skill !== 'beastmastery') petXpShare(xp, quiet, notes);
  if (ch.growth && growthEquipped(ch)) { if (SKILLS[skill].kind === 'gather') ch.growth.gatherXp += xp; else if (skill === 'slaying') ch.growth.combatXp += xp; }
  const C = levelFromXp(ch.xp).level;
  if (C > ch.level) {
    const gained = C - ch.level; let sp = 0;
    for (let l = ch.level + 1; l <= C; l++) { sp += BALANCE.level.skillPointsPerLevel + (l % 10 === 0 ? BALANCE.level.skillPointsMilestone : 0); if (l % BALANCE.respec.freeEvery === 0 && l <= BALANCE.respec.freeUntilLevel) { ch.freeRespecs++; ch.freeTreeRespecs = (ch.freeTreeRespecs || 0) + 1; } }
    ch.level = C; ch.unspent += gained * BALANCE.level.statPointsPerLevel; ch.skillPts += sp; dirty = true;
    const msg = `Level ${C}! +${gained * BALANCE.level.statPointsPerLevel} stat points`;
    if (quiet) notes.push(msg); else { addLog('level', msg); toast(`<b>${msg}</b><br><span class="mute">Spend them on the Character tab.</span>`); chime(523, 784); }
  }
}
function tierUp(a, k, quiet, notes) {
  if (k >= 9 && RES_BY[a.id] && typeof gmQueue !== 'undefined') gmQueue.push(a.id);
  const msg = `${a.name} proficiency: ${BALANCE.tierNames[k]}` + (k <= 5 ? ` (${fmtTime(actionSec(a, BALANCE.tierThresholds[k], D(a.skill).speed))} per action)` : a.inputs ? ` (${pct(extraChance(k))} chance of +50% output)` : ` (+${pct(BALANCE.tierYieldBonus[k])} ${a.kind === 'combat' ? 'loot and XP' : 'yield'})`);
  if (quiet) { notes.push(msg); return; }
  addLog('tier', msg); toast(`<b>Tier up!</b> ${esc(msg)}`, 'verd'); chime(659, 988); if (k >= 6) flash(); dirty = true;
}
function checkProgress(quiet, notes) {
  let mastered = 0, grand = 0;
  for (const s of GATHER_SKILLS) {
    let u = 0; for (const r of CHAIN[s]) if (isUnlocked(ch, r)) u++; else break;
    if (u > ch.unlocked[s]) { for (let i = ch.unlocked[s]; i < u; i++) { const r = CHAIN[s][i], msg = `${r.name} unlocked`; quiet ? notes.push(msg) : (addLog('tier', msg), toast(`${resIcon(r, 22)} <b>${esc(r.name)} unlocked!</b>`, 'gold')); } ch.unlocked[s] = u; dirty = true; }
  }
  for (const [id, c] of Object.entries(ch.prof)) { if (c >= BALANCE.tierThresholds[6]) mastered++; if (c >= BALANCE.tierThresholds[9]) grand++; }
  checkQuest(quiet, notes);
  checkAdvance(quiet, notes);
  checkCompanions(quiet, notes);
  checkStories(quiet, notes);
  ch.counters.titlesEarned = earnedTitleBonuses(ch).list.length;
  const C = ch.counters;
  C.regionsVisited = Object.keys(ch.visited).length;
  C.mastered = mastered; C.grand = grand; C.oresUnlocked = ch.unlocked.mining; C.stoneGrand = (ch.prof.stone || 0) >= 1e5 ? 1 : 0;
  C.minGatherLvl = Math.min(...GATHER_SKILLS.map(s => ch.skills[s].level));
  C.slotsFilled = SLOTS.filter(s => ch.equip.slots[s]).length;
  C.savingsPeak = Math.max(C.savingsPeak, savingsNow(ch, Date.now()));
  if (C.unsold >= 1e5 && !ch.secretTitles.hoard) ch.secretTitles.hoard = true;
  const d = new Date(); if (ch.actions.length && d.getHours() === 0 && d.getMinutes() === 0 && !ch.secretTitles.nightowl) { ch.secretTitles.nightowl = true; C.midnight = 1; }
  for (const t of earnedTitleBonuses(ch).list) if (!ch.titlesSeen.includes(t.name)) {
    ch.titlesSeen.push(t.name); if (!ch.displayTitle) ch.displayTitle = t.name;
    const msg = `Title earned: ${t.name} (+${pct(t.y)} ${t.skill ? SKILLS[t.skill].name + ' ' : ''}yield, +${t.amt} ${t.stat})`;
    quiet ? notes.push(msg) : (addLog('lucky', msg), toast(`<b>${esc(msg)}</b>`, 'gold'), chime(784, 1175)); dirty = true;
  }
  for (const a of ACHIEVEMENTS) {
    if (ch.ach[a.id]) continue;
    const v = a.stat === 'level' ? ch.level : (C[a.stat] || 0);
    if (v >= a.goal) { ch.ach[a.id] = Date.now(); const nm = a.real || a.name; if (a.hidden) discover('Secret achievement', nm, `${a.desc} · ${a.pts} achievement points.${a.id === 'hoard_a' ? ' Also earns the secret title Dragon\u2019s Hoard (+3% yield, +3 LUCK).' : a.id === 'night_a' ? ' Also earns the secret title Night Shift (+2% yield, +2 PER).' : ''}`, 'Achievements'); quiet ? notes.push('Achievement: ' + nm) : (addLog('sys', `Achievement unlocked: ${nm} (${a.pts} pts)`), toast(`Achievement unlocked: <b>${esc(nm)}</b> · ${a.pts} pts`)); }
  }
}

// ---------- Actions ----------
function startAction(id) {
  const a = ACT(id); if (!a || !isUnlocked(ch, a) || ch.actions.find(x => x.res === id)) return;
  if (typeof tabOpen === 'function' && !tabOpen(actTab(a))) { toast(`🔒 ${esc(tabName(actTab(a)))} unlocks at ${esc(gateText(actTab(a)))}.`); return; }
  const why = cantStart(a); if (why) { toast(esc(why)); return; }
  if (a.kind === 'combat') { const cur = ch.actions.find(x => ACT(x.res).kind === 'combat'); if (cur) stopAction(cur.res); if (ch.hp != null && ch.hp < D('slaying').maxHP * 0.2) { toast('Too hurt to fight. Rest or eat first.'); return; } }
  if (a.inputs && craftable(ch, a) < 1) { toast(`Not enough materials for ${esc(a.name)}.`); return; }
  const max = D().stamina, used = staminaUsed();
  if (used + a.stamina > max) {
    modal(`<h3>Not enough stamina</h3><p>${esc(a.name)} needs ${a.stamina} stamina. You are using ${used} of ${max}.</p>
      <p class="mute">Stop one of these to make room, or raise Dexterity for more stamina.</p>
      <div class="grid">${ch.actions.map(x => `<button data-act="swap" data-arg="${x.res}|${id}">Swap out ${esc(ACT(x.res).name)} (frees ${ACT(x.res).stamina})</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button data-act="close">Cancel</button></div>`);
    return;
  }
  ch.actions.push({ res: id, prog: 0, streak: 0, vein: 0 });
  ch.counters.maxActive = Math.max(ch.counters.maxActive, ch.actions.length);
  addLog('sys', `Started: ${SKILLS[a.skill].verb} ${a.name}.`); dirty = true;
}
function stopAction(id, why) { ch.actions = ch.actions.filter(a => a.res !== id); if (why) { addLog('sys', why); toast(esc(why)); } dirty = true; }
function fitStamina() { const max = D().stamina; while (staminaUsed() > max && ch.actions.length) { const a = ch.actions.pop(); addLog('sys', `Stopped ${ACT(a.res).name}: not enough stamina.`); } }

// ---------- Engine step (one 100ms tick) ----------
function step() {
  const now = Date.now(), dc = {}, dOf = s => dc[s] || (dc[s] = derive(ch, now, null, s));
  worldTick(now, dOf);
  for (const a of [...ch.actions]) {
    const act = ACT(a.res), sk = act.skill, d = dOf(sk), gather = act.kind === 'gather';
    if (act.kind === 'combat') { combatTick(a, act, d, now); continue; }
    if (act.kind === 'explore') { exploreTick(a, act, d); continue; }
    if (act.kind === 'train') { trainTick(a, act, d); continue; }
    if (a.vein && a.vein < now) { a.vein = 0; dirty = true; }
    if (gather && !a.vein && rng() < BALANCE.richVein.chancePerSec * BALANCE.tickMs / 1000) {
      a.vein = now + BALANCE.richVein.durationSec * 1000; ch.counters.veins++;
      const nm = NODE_BONUS[sk]; addLog('lucky', `${nm}: ${act.name} yield doubled for ${BALANCE.richVein.durationSec}s!`); toast(`<b>${nm}!</b> ${esc(act.name)} yield doubled for ${BALANCE.richVein.durationSec}s`, 'gold'); chime(880, 1320); dirty = true;
    }
    a.prog += BALANCE.tickMs;
    const tms = Math.max(BALANCE.minActionSec * 1000, Math.round(actionSec(act, ch.prof[a.res] || 0, d.speed) * 1000));
    if (a.prog < tms) continue;
    let n = Math.floor(a.prog / tms); a.prog -= n * tms;
    const k0 = tierOf(ch.prof[a.res] || 0);
    const g = agg[a.res] || (agg[a.res] = { units: 0, xp: 0, lucky: 0, triple: 0, finds: 0, n: 0, outs: {} });
    let r;
    if (gather) {
      if (!ch.inv[a.res] && ch.autoSell[a.res] == null && usedSlots() >= ch.invSlots) { stopAction(a.res, `Inventory full: stopped ${act.name}. Sell or bank something.`); continue; }
      r = resolveGather(ch, act, n, d, rng, a.vein > now);
      addItem(a.res, r.units, true);
      for (const [j, c] of Object.entries(r.junk)) { if (addItem(j, c)) { ch.counters.junk += c; if (j === 'old_boot') ch.counters.boot = 1; addLog('sys', `Found junk: ${ITEMS[j].name}.`); } }
      ch.counters.gathered += r.units; ch.counters.unsold += r.units; g.units += r.units; g.finds += r.finds;
      if (a.res === 'god_ore') ch.counters.godore = 1;
      secretGather(act, n);
    } else {
      n = Math.min(n, craftable(ch, act));
      if (n <= 0) { stopAction(a.res, `Out of materials: stopped ${act.name}.`); continue; }
      for (const [i, q] of Object.entries(act.inputs)) takeItem(i, q * n);
      r = resolveCraft(ch, act, n, d, rng);
      for (const [k, q] of Object.entries(r.out)) { addCraftOut(k, q); g.outs[k] = (g.outs[k] || 0) + q; g.units += q; }
      ch.counters.crafted += n; if (r.best >= 2) ch.counters.fine = 1; if (r.best >= 4) { ch.counters.masterwork = 1; ch.counters.masterworks++; addLog('lucky', `Masterwork ${GEAR[act.out].name}!`); toast(`<b>Masterwork!</b> ${esc(GEAR[act.out].name)}`, 'gold'); chime(988, 1480); }
      if (act.gearOut && GEAR[act.out].slot === 'tool') ch.counters.toolsBought = Math.max(1, ch.counters.toolsBought);
    }
    ch.prof[a.res] = (ch.prof[a.res] || 0) + n; ch.totals[sk] += n; a.streak += n;
    ch.counters.lucky += r.lucky; ch.counters.triple += r.triple;
    g.xp += r.xp; g.lucky += r.lucky; g.triple += r.triple; g.n += n;
    addXp(sk, r.xp);
    const k1 = tierOf(ch.prof[a.res]); if (k1 > k0) { tierUp(act, k1); checkProgress(); }
  }
}
function flush() {
  const bySkill = {};
  for (const [id, g] of Object.entries(agg)) {
    const act = ACT(id), sk = act.skill; bySkill[sk] = bySkill[sk] || { xp: 0, n: 0 }; bySkill[sk].xp += g.xp; bySkill[sk].n += g.n;
    if (act.kind === 'combat') { flushCombat(act, g); continue; }
    if (act.kind === 'explore') { addLog('gain', `Explored ${REGION_BY[act.region].name} ${g.n}× (+${N(g.xp)} XP)`); continue; }
    if (act.kind === 'train') { if (g.gain) addLog('gain', `${act.name}: +${g.gain.toFixed(2)} ${act.stat} today`); continue; }
    let s = act.inputs ? `${SKILLS[sk].past} ${N(g.units)} ${act.name}` + (act.gearOut ? ' (' + Object.entries(g.outs).map(([k, q]) => `${q} ${BALANCE.craft.qualityNames[parseG(k).q]}`).join(', ') + ')' : '') : `${SKILLS[sk].past} ${N(g.units)} ${act.name}`;
    s += ` (+${N(g.xp)} XP)`;
    if (g.lucky) s += ` · ${g.lucky} Lucky Strike${g.lucky > 1 ? 's' : ''}${g.triple ? ` (${g.triple} triple)` : ''}`;
    if (g.finds) s += ` · ${g.finds} bonus find${g.finds > 1 ? 's' : ''}`;
    addLog(g.lucky ? 'lucky' : 'gain', s);
    const slot = document.querySelector(`.aslot[data-res="${id}"]`);
    if (slot && !account.settings.reduced) { const f = document.createElement('span'); f.className = 'float'; f.textContent = '+' + N(g.units); slot.appendChild(f); setTimeout(() => f.remove(), 1100); }
  }
  for (const s of SKILL_IDS) { const b = bySkill[s] || { xp: 0, n: 0 }, r = rate[s] || (rate[s] = { xp: 0, comp: 0 }); r.xp = r.xp * 0.85 + b.xp * 0.15; r.comp = r.comp * 0.85 + b.n * 0.15; }
  let comps = 0; for (const g of Object.values(agg)) comps += g.n || 0;
  if (comps) petActions(comps, false);
  agg = {};
  autoSellTick(false);
  bondTick(1, false);
  checkProgress();
}

// ---------- Offline ----------
function runOffline(sec, show) {
  if (!ch || sec < 1) return;
  if (ch.hp != null && !ch.actions.some(a => ACT(a.res).kind === 'combat')) ch.hp = null;
  if (!ch.actions.length && !ch.travel) return;
  if (typeof autoBuy === 'function') autoBuy(true);
  const d0 = D(), cap = d0.offlineH * 3600, use = Math.min(sec, cap);
  const start = Date.now() - sec * 1000, end = start + use * 1000;
  const cuts = [start, ...Object.values(ch.potions).map(p => p.until).filter(t => t > start && t < end), end].sort((a, b) => a - b);
  const sum = {}, notes = [], lv0 = ch.level, stopped = [], gold0 = ch.gold;
  if (ch.travel && ch.travel.end <= Date.now()) arrive(ch.travel.to, true, notes);
  for (let i = 0; i < cuts.length - 1; i++) {
    const len = (cuts[i + 1] - cuts[i]) / 1000; if (len <= 0) continue;
    for (const a of [...ch.actions]) {
      const act = ACT(a.res); if (!isUnlocked(ch, act)) continue;
      const d = derive(ch, cuts[i] + 1, null, act.skill);
      if (act.kind === 'combat') { offlineCombat(a, act, len, d, sum, notes); continue; }
      if (act.kind === 'explore') { offlineExplore(a, act, len, d, sum, notes); continue; }
      if (act.kind === 'train') { offlineTrain(a, act, len, d, sum, notes); continue; }
      const max = act.inputs ? craftable(ch, act) : Infinity;
      const seg = offlineChunks(act, ch.prof[a.res] || 0, len, d.speed, max);
      if (!seg.done) { if (act.inputs) { stopped.push(act.name); ch.actions = ch.actions.filter(x => x !== a); } continue; }
      const s = sum[a.res] || (sum[a.res] = { done: 0, units: 0, xp: 0 });
      let xp;
      if (act.inputs) {
        for (const [k, q] of Object.entries(act.inputs)) takeItem(k, q * seg.done);
        const o = offlineCraftOut(act, seg.chunks, d); xp = o.xp;
        for (const [k, q] of Object.entries(o.out)) { const u = probRound(q, rng); addCraftOut(k, u, true, notes); s.units += u; }
        ch.counters.crafted += seg.done;
        if (craftable(ch, act) < 1) { stopped.push(act.name); ch.actions = ch.actions.filter(x => x !== a); }
      } else {
        if (!ch.inv[a.res] && usedSlots() >= ch.invSlots) { stopped.push(act.name + ' (inventory full)'); ch.actions = ch.actions.filter(x => x !== a); continue; }
        const o = offlineGatherOut(act, seg.chunks, d); xp = o.xp;
        const u = probRound(o.units, rng); addItem(a.res, u, true); s.units += u;
        const jn = probRound(o.junk, rng); if (jn) { const j = JUNK[act.skill][0][0]; if (addItem(j, jn)) ch.counters.junk += jn; }
        ch.counters.gathered += u; ch.counters.unsold += u; if (a.res === 'god_ore') ch.counters.godore = 1; secretGather(act, seg.done);
      }
      const k0 = tierOf(ch.prof[a.res] || 0);
      ch.prof[a.res] = seg.count; ch.totals[act.skill] += seg.done; s.done += seg.done; s.xp += xp;
      for (let k = k0 + 1; k <= tierOf(seg.count); k++) tierUp(act, k, true, notes);
      addXp(act.skill, xp, true, notes);
    }
    checkProgress(true, notes);
  }
  ch.actions.forEach(a => a.prog = 0);
  bondTick(use, true, notes);
  petActions(Object.values(sum).reduce((t, x) => t + (x.done || 0), 0), true, notes);
  const autoGold = autoSellTick(true); if (autoGold) notes.push(`Auto-sold surplus for ${N(autoGold)} gold.`);
  dirty = true;
  addLog('sys', `While you were away (${fmtTime(use)}): progress applied.`);
  if (!show) return;
  modal(`<h2>While you were away</h2><p class="mute">Gone ${fmtTime(sec)}${sec > cap ? `, of which ${fmtTime(cap)} counted (offline cap ${d0.offlineH}h; raise it at the Shop)` : ''}.</p>
    <div class="grid" style="margin:12px 0">${Object.entries(sum).map(([id, s]) => `<div class="row">${actIcon(ACT(id), 28)}<div><b>${N(s.units)} ${esc(ACT(id).name)}</b><div class="mute" style="font-size:14px">${N(s.done)} actions · +${N(s.xp)} XP</div></div></div>`).join('') || '<p class="mute">Nothing could run.</p>'}</div>
    ${stopped.length ? `<p class="bad">Stopped: ${esc(stopped.join(', '))}.</p>` : ''}
    ${ch.gold > gold0 + 0.5 ? `<p class="gold" style="margin:4px 0"><b>+${N(ch.gold - gold0)} gold</b> while you were away.</p>` : ''}
    ${ch.level > lv0 ? `<p class="ember"><b>+${ch.level - lv0} levels</b> · ${(ch.level - lv0) * BALANCE.level.statPointsPerLevel} stat points to spend</p>` : ''}
    ${notes.length ? `<details open><summary>${notes.length} milestones</summary><ul>${notes.slice(0, 40).map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>` : ''}
    <div class="row" style="margin-top:12px"><button class="pri" data-act="close">Back to work</button></div>`);
}

// ---------- Milestone ----------
function nextMilestone() {
  let best = null; const cand = (label, eta) => { if (eta > 0 && isFinite(eta) && (!best || eta < best.eta)) best = { label, eta }; };
  const skills = new Set();
  for (const a of ch.actions) {
    const act = ACT(a.res), c = ch.prof[a.res] || 0, k = tierOf(c), d = D(act.skill); skills.add(act.skill);
    if (k < 9) cand(`${act.name} ${BALANCE.tierNames[k + 1]}`, (BALANCE.tierThresholds[k + 1] - c) * actionSec(act, c, d.speed));
    if (act.kind === 'gather' && c < BALANCE.unlockAt) { const nx = CHAIN[act.skill][act.index]; if (nx && !isUnlocked(ch, nx)) cand(`Unlock ${nx.name}`, (BALANCE.unlockAt - c) * actionSec(act, c, d.speed)); }
  }
  let total = 0;
  for (const s of skills) {
    const r = rate[s] || { xp: 0, comp: 0 }; total += r.xp;
    const L = levelFromXp(ch.skills[s].xp); if (r.xp > 0.01 && L.need) cand(`${SKILLS[s].name} level ${L.level + 1}`, (L.need - L.into) / r.xp);
    const line = SKILL_TITLES[s].line.find(l => ch.totals[s] < l[0]); if (line && r.comp > 0.01) cand(`Title: ${line[1]}`, (line[0] - ch.totals[s]) / r.comp);
  }
  const C = levelFromXp(ch.xp); if (total > 0.01 && C.need) cand(`Level ${C.level + 1}`, (C.need - C.into) / (total * BALANCE.level.charXpShare));
  return best;
}

// ============================================================
// WORLD STATE — location, combat, exploration, travel, events, quests (Phase 4)
// ============================================================
const regionOfBand = b => REGIONS[b];
function availableHere(res) { return res.band === 0 || (!ch.travel && (REGIONS[res.band].id === ch.loc || (REGION_BY[ch.loc].secret && REGION_BY[ch.loc].band === res.band))); }
function cantStart(a) {
  if (a.kind === 'gather' && !availableHere(a)) return ch.travel ? `You can't start new gathering while travelling.` : `${a.name} is only found in ${REGIONS[a.band].name}.`;
  if (a.kind === 'combat') {
    if (ch.travel) return `You are on the road.`;
    if (ch.dungeon && !ch.dungeon.done) return `You are inside a dungeon.`;
    if (a.region !== ch.loc) return `${a.name} lives in ${REGION_BY[a.region].name}.`;
    if (!areaOpen(ch, a, D('slaying'))) return `Explore ${REGION_BY[a.region].name} further to find ${a.name}.`;
  }
  if (a.kind === 'explore') { if (ch.travel) return `You are on the road.`; if (a.region !== ch.loc) return `Travel to ${REGION_BY[a.region].name} first.`; }
  return '';
}
function maxHP() { return D('slaying').maxHP; }
function healFoods() { return Object.keys(ch.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'food' && ITEMS[k].heal && ch.inv[k] > 0).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal); }
function eatFood(need) {
  let healed = 0, eaten = {};
  const order = ch.combatFood && ch.inv[ch.combatFood] ? [ch.combatFood, ...healFoods().filter(k => k !== ch.combatFood)] : healFoods();
  for (const k of order) { while (healed < need && ch.inv[k] > 0) { takeItem(k, 1); healed += ITEMS[k].heal; eaten[k] = (eaten[k] || 0) + 1; } if (healed >= need) break; }
  return { healed, eaten };
}
// One fight, fully resolved. Mutates ch (hp, items, prof, counters). Returns a summary.
function resolveFight(e, d, rng) {
  const f = fightInfo(ch, e, d), C = BALANCE.combat, mh = d.maxHP;
  const won = rng() < f.win;
  let dmg = f.dmg * (0.6 + rng() * 0.8) * (won ? 1 : C.lossDmgMult);
  ch.hp = Math.min(mh, (ch.hp == null ? mh : ch.hp) + f.regen - dmg);
  const out = { won: won && ch.hp > 0, dmg, time: f.time, xp: 0, gold: 0, loot: {}, rare: [] };
  if (ch.hp <= 0) { out.died = true; return out; }
  if (!out.won) return out;
  const c0 = ch.prof[e.id] || 0, pb = BALANCE.tierYieldBonus[tierOf(c0)];
  out.xp = e.xp * (1 + pb) * d.xpMult;
  out.gold = (e.gold[0] + rng() * (e.gold[1] - e.gold[0])) * (1 + pb) * (1 + (d.M.gold || 0));
  for (const l of e.loot) {
    const ch_ = l.chance * (l.rare ? 1 + d.drop + (d.M.loot || 0) : 1);
    if (l.ego && ch.egos[l.ego]) continue;
    if (l.secret && !ch.seen[l.key] ? pityRoll('drop_' + l.key, 1) : rng() < ch_) { if (l.ego) { grantEgo(l.ego); out.rare.push(l); continue; } if (l.secret && !ch.seen[l.key]) discover('Secret find', ITEM(l.key).name, `${ITEM(l.key).desc || ''} A secret drop from ${e.name}. Check your inventory.`, 'Inventory'); const q = l.rare ? 1 : probRound((l.min + rng() * (l.max - l.min)) * (1 + pb) * (1 + d.pool), rng); if (q > 0) { out.loot[l.key] = (out.loot[l.key] || 0) + q; if (l.rare) out.rare.push(l); } }
  }
  ch.prof[e.id] = c0 + 1; ch.totals.slaying++; ch.counters.kills++;
  if (e.boss) ch.counters.bossWins++; if (UNDEAD.includes(e.eid)) ch.counters.undeadKills++; if (out.rare.length) ch.counters.rareDrops += out.rare.length;
  if (e.role === 'boss' && !ch.growth) grantGrowth();
  if (e.role === 'boss' && rng() < 0.05) { addItem('egg_' + e.region, 1, true); out.rare.push({ key: 'egg_' + e.region }); }
  if (e.role === 'tboss' && !ch.starterEgg) { ch.starterEgg = 1; addItem('egg_' + e.region, 1, true); addLog('lucky', `${e.name} was guarding a nest. You found an egg! Put it in an incubator on the Pets tab.`); }
  if (ch.growth && growthEquipped(ch)) { ch.growth.kills++; if (UNDEAD.includes(e.eid)) ch.growth.undead++; growthXp(e.level * GROWTH.killXp); }
  if (e.boss && e.role === 'boss' && !ch.bossKilled[e.id]) { ch.bossKilled[e.id] = Date.now(); ch.counters.bossKinds = Object.keys(ch.bossKilled).length; }
  ch.gold += out.gold; ch.counters.goldEarned += out.gold;
  for (const [k, q] of Object.entries(out.loot)) { addItem(k, q, true); if (ITEM(k).gear && GEAR[parseG(k).base].unique) ch.counters.uniques++; }
  if (typeof killGearDrop === 'function') killGearDrop(e, 1, false, null);
  addXp('slaying', out.xp);
  return out;
}
function combatTick(a, e, d, now) {
  if (ch.hp == null) ch.hp = d.maxHP;
  a.prog += BALANCE.tickMs;
  const f = fightInfo(ch, e, d), tms = Math.max(100, Math.round(f.time * 1000));
  a.tms = tms; a.enemyHp = 1 - Math.min(1, a.prog / tms);
  if (a.prog < tms) return;
  a.prog -= tms;
  const k0 = tierOf(ch.prof[e.id] || 0), r = resolveFight(e, d, rng);
  const g = agg[a.res] || (agg[a.res] = { kind: 'combat', wins: 0, losses: 0, xp: 0, gold: 0, loot: {}, n: 0, dmg: 0, ate: {} });
  g.n++; g.dmg += r.dmg; if (r.won) { g.wins++; g.xp += r.xp; g.gold += r.gold; for (const [k, q] of Object.entries(r.loot)) g.loot[k] = (g.loot[k] || 0) + q; a.streak++; } else g.losses++;
  for (const l of r.rare) { const nm = ITEM(l.key).name; addLog('lucky', `Rare drop from ${e.name}: ${nm}!`); if (l.unique) { toast(`<b>Unique drop!</b> ${itemIcon(l.key, 20)} ${esc(nm)}`, 'gold'); chime(988, 1480); flash(); } }
  if (r.died) {
    ch.hp = d.maxHP * BALANCE.combat.defeatHpFrac;
    stopAction(a.res, `${e.name} defeated you. You limp back to ${REGION_BY[ch.loc].town} to recover.`);
    clog(`Defeated by ${e.name}.`, 'bad'); return;
  }
  if (ch.hp < d.maxHP * BALANCE.combat.autoEatAt) { const ate = eatFood(d.maxHP * 0.9 - ch.hp); ch.hp = Math.min(d.maxHP, ch.hp + ate.healed); for (const [k, q] of Object.entries(ate.eaten)) g.ate[k] = (g.ate[k] || 0) + q; }
  const k1 = tierOf(ch.prof[e.id] || 0); if (k1 > k0) { tierUp(e, k1); checkProgress(); }
  if (e.boss && r.won) { clog(`${e.name} falls!`, 'lucky'); dirty = true; }
}
function clog(s, k) { ch.clog.unshift({ t: Date.now(), s, k: k || '' }); if (ch.clog.length > 40) ch.clog.length = 40; }
function flushCombat(e, g) {
  let s = `${g.wins ? `Defeated ${g.wins} ${e.name}` : `Fought ${e.name}`}${g.losses ? ` · lost ${g.losses}` : ''} (+${N(g.xp)} XP, +${N(g.gold)} gold)`;
  const drops = Object.entries(g.loot).map(([k, q]) => `${ITEM(k).name} ×${q}`).join(', '); if (drops) s += ` · ${drops}`;
  const ate = Object.entries(g.ate).map(([k, q]) => `${q} ${ITEM(k).name}`).join(', '); if (ate) s += ` · ate ${ate}`;
  const acts = Object.entries(ch.talents).filter(([id, r]) => r && NODES[id] && NODES[id].kind === 'active' && treeActive(ch, NODES[id].tree)).map(([id]) => NODES[id].name);
  if (acts.length && g.wins) s += ` · ${acts[Math.floor(rng() * acts.length)]} ×${Math.max(1, Math.round(g.wins / 3))}`;
  addLog(g.wins ? 'gain' : 'sys', s); clog(s, g.losses ? 'bad' : '');
}
function exploreTick(a, x, d) {
  a.prog += BALANCE.tickMs;
  const tms = Math.max(100, Math.round(actionSec(x, ch.prof[x.id] || 0, d.speed) * 1000));
  if (a.prog < tms) return;
  const n = Math.floor(a.prog / tms); a.prog -= n * tms;
  const k0 = tierOf(ch.prof[x.id] || 0);
  ch.prof[x.id] = (ch.prof[x.id] || 0) + n; ch.totals.exploration += n; a.streak += n;
  const xp = x.xp * n * d.xpMult; addXp('exploration', xp);
  const g = agg[a.res] || (agg[a.res] = { xp: 0, n: 0 }); g.xp += xp; g.n += n;
  for (let i = 0; i < n; i++) if (rng() < BALANCE.explore.chestChance) findChest(x.region, false);
  checkExplore(x.region, false, null, n);
  const k1 = tierOf(ch.prof[x.id]); if (k1 > k0) tierUp(x, k1);
}
function findChest(rid, quiet, notes) {
  const r = REGION_BY[rid], C = BALANCE.combat, gold = Math.round(C.goldBase * Math.pow(C.goldGrowth, r.lvl) * 15);
  const pool = RES.filter(x => x.band === r.band), res = pick(pool), q = 3 + Math.floor(rng() * 10);
  ch.gold += gold; ch.counters.goldEarned += gold; addItem(res.id, q, true);
  const msg = `Found a cache in ${r.name}: ${N(gold)} gold and ${q} ${res.name}.`;
  if (rng() < 0.15) { addItem('treasure_map', 1, true); if (quiet) notes.push(`Found a Treasure Map in ${r.name}.`); else { addLog('lucky', `Found a Treasure Map in ${r.name}! Dig it up from your inventory.`); toast('<b>Treasure Map!</b> Dig it up from your inventory.', 'gold'); } }
  if (quiet) notes.push(msg); else addLog('lucky', msg); // v2.0: log only, no pop-up
}
// Hidden pieces (v1.0): each attempt has a tiny chance, and the 5,000th attempt always succeeds.
const PITY = { chance: 0.000005, at: 5000 };
function pityRoll(id, n) {
  if (!ch || n <= 0) return false; ch.pity = ch.pity || {};
  const c = (ch.pity[id] || 0) + n; ch.pity[id] = c;
  return c >= PITY.at || rng() < 1 - Math.pow(1 - PITY.chance, n);
}
function checkExplore(rid, quiet, notes, n) {
  const r = REGION_BY[rid], f = exploreFrac(ch, rid), seen = ch.areasSeen[rid] || (ch.areasSeen[rid] = []), d = D();
  BALANCE.explore.areaAt.forEach((at, i) => { if (f >= at && !seen.includes(i)) { seen.push(i); if (i > 0) { const msg = `Discovered ${r.areas[i]} in ${r.name}.`; quiet ? notes.push(msg) : (addLog('tier', msg), toast(`<b>New area:</b> ${esc(r.areas[i])}`, 'verd')); dirty = true; } } });
  if (f >= BALANCE.explore.hiddenAt && d.S.PER.total >= r.perReq && !seen.includes('hidden') && pityRoll('hidden_' + rid, n == null ? 1 : n)) { seen.push('hidden'); ch.counters.hiddenFound++; const msg = `Your sharp eyes spot a hidden place in ${r.name}.`; { const he = ENEMIES.find(e => e.region === rid && e.area === 'hidden'); discover('Hidden place', `${r.name}: a hidden place`, `Your sharp eyes spot a way off the beaten path.${he ? ` Something lurks there: ${he.name}, a rare enemy with its own unique drop. Find it on the Combat tab.` : ''}`, 'Combat'); } quiet ? notes.push(msg) : (addLog('lucky', msg), toast(`<b>Hidden place found!</b> ${esc(r.name)}`, 'gold'), chime(880, 1320)); dirty = true; }
  ch.counters.regionsMapped = REGIONS.filter(x => exploreFrac(ch, x.id) >= 1).length;
}
function startTravel(to, fast) {
  const r = REGION_BY[to], d = D();
  if (!ch.quest.done) { toast(`Finish your tasks in ${regionName()} before you leave.`); return; }
  if (ch.travel || ch.loc === to) return;
  if (ch.dungeon && !ch.dungeon.done) { toast('Finish or leave your dungeon first.'); return; }
  if (gateLevel(ch) < r.lvl) { toast(`${r.name} needs character level ${r.lvl}.`); return; }
  for (const a of [...ch.actions]) { const k = ACT(a.res).kind; if (k === 'combat' || k === 'explore') stopAction(a.res); }
  if (fast) { const c = fastTravelCost(to, ch); if (ch.gold < c) { toast('Not enough gold.'); return; } ch.gold -= c; addLog('sys', `Paid ${N(c)} gold for a fast carriage.`); arrive(to); return; }
  const mins = travelMinutes(ch.loc, to) * (1 - travelBonus(d)), start = Date.now(), end = start + mins * 60000;
  const enc = []; for (let t = 0; t < mins; t++) if (rng() < BALANCE.travel.encountersPerMin) enc.push(start + (t + rng()) * 60000);
  ch.travel = { from: ch.loc, to, start, end, enc: enc.filter(t => t < end) };
  addLog('sys', `Set out for ${r.name} (${fmtTime(mins * 60)}).`); dirty = true;
}
function arrive(to, quiet, notes) {
  const first = !ch.visited[to]; ch.loc = to; ch.visited[to] = true; ch.travel = null; ch.counters.arrivals++; ch.arrivedAt = Date.now();
  ch.counters.regionsVisited = Object.keys(ch.visited).length;
  const msg = `Arrived in ${REGION_BY[to].name}${first ? ' for the first time' : ''}.`;
  if (quiet) notes.push(msg); else { addLog('tier', msg); toast(`<b>${esc(REGION_BY[to].name)}</b>${first ? ' · new region!' : ''}`, first ? 'gold' : 'verd'); }
  checkExplore(to, quiet, notes); if (typeof afterArrive === 'function') afterArrive(quiet, notes); dirty = true;
}
function encounter(now) {
  const t = ch.travel, pool = ENEMIES.filter(e => (e.region === t.to || e.region === t.from) && e.area === 0);
  if (!pool.length) return;
  const e = pool.reduce((a, b) => (b.level < a.level ? b : a)), d = D('slaying');
  if (ch.hp == null) ch.hp = d.maxHP;
  const r = resolveFight(e, d, rng);
  if (r.died) { ch.hp = d.maxHP * BALANCE.combat.defeatHpFrac; addLog('sys', `Ambushed by a ${e.name} on the road! You fled, battered.`); return; }
  addLog(r.won ? 'gain' : 'sys', r.won ? `Ambushed by a ${e.name} on the road: you won (+${N(r.xp)} XP, +${N(r.gold)} gold).` : `Ambushed by a ${e.name}: you escaped.`);
}
function worldTick(now, dOf) {
  resetDaily();
  const d = dOf('slaying');
  if (ch.hp == null) ch.hp = d.maxHP;
  if (!ch.actions.some(a => ACT(a.res).kind === 'combat')) ch.hp = Math.min(d.maxHP, ch.hp + d.maxHP * BALANCE.combat.regenIdle * BALANCE.tickMs / 1000);
  if (ch.travel) {
    while (ch.travel.enc.length && ch.travel.enc[0] <= now) { ch.travel.enc.shift(); encounter(now); }
    if (now >= ch.travel.end) arrive(ch.travel.to);
    return;
  }
  if (!ch.nextEvent) ch.nextEvent = now + (BALANCE.events.minMin + rng() * (BALANCE.events.maxMin - BALANCE.events.minMin)) * 60000;
  if (now >= ch.nextEvent) { ch.nextEvent = 0; regionEvent(); }
}
function regionEvent() {
  if (secretEvent()) return;
  const ev = pick(EVENTS), r = REGION_BY[ch.loc];
  if (ev.fx) { ch.eventBuff = { id: ev.id, fx: ev.fx, until: Date.now() + ev.mins * 60000 }; addLog('lucky', `${r.name}: ${ev.text}`); toast(`<b>${esc(r.name)}</b> · ${esc(ev.text)}`, 'gold'); renderTop(); return; }
  if (ev.gold) { const g = Math.round(BALANCE.combat.goldBase * Math.pow(BALANCE.combat.goldGrowth, r.lvl) * 20); ch.gold += g; ch.counters.goldEarned += g; addLog('lucky', `${r.name}: ${ev.text} +${N(g)} gold.`); toast(`${esc(ev.text)} +${N(g)} gold`, 'gold'); return; }
  if (ev.cache) findChest(ch.loc, false);
  if (ev.egg) { addItem('egg_' + ch.loc, 1, true); toast(`<b>${esc(REGION_BY[ch.loc].name)}</b> · ${esc(ev.text)}`, 'gold'); }
}

// ---------- Tutorial quests ----------
const QUEST_STATS = ['STR', 'DEX', 'VIT', 'CHARM', 'LUCK', 'INT', 'WIS', 'AGI', 'STR', 'PER'];
function questGoal(step) {
  const t = TUTORIALS[ch.region], n = id => ACT(id) ? ACT(id).name : ITEM(id).name, P = id => ch.prof[id] || 0;
  const alloc = Object.values(ch.alloc).reduce((s, v) => s + v, 0);
  return [
    { label: `Gather 20 ${n(t.res1)}`, have: P(t.res1), need: 20, go: ACT(t.res1).skill },
    { label: `Reach T3 on ${n(t.res1)} (50 done)`, have: P(t.res1), need: 50, go: ACT(t.res1).skill },
    { label: `Run two actions at once (try ${n(t.res2)})`, have: Math.min(2, ch.counters.maxActive), need: 2, go: ACT(t.res2).skill },
    { label: 'Earn 30 gold by selling', have: Math.floor(ch.counters.goldEarned), need: 30, go: 'inv' },
    { label: `Buy ${ITEM(t.buy).name} at the shop`, have: ch.counters.shopBuys, need: 1, go: 'shop' },
    { label: `Make 3 ${RECIPE[t.craft].name}`, have: P(t.craft), need: 3, go: RECIPE[t.craft].skill },
    { label: 'Eat a meal or drink a potion', have: ch.counters.potions, need: 1, go: 'inv' },
    { label: 'Spend 10 stat points', have: alloc, need: 10, go: 'char' },
    { label: `Defeat 5 ${ENEMY_BY['e_' + t.e1].name}`, have: P('e_' + t.e1), need: 5, go: 'combat' },
    { label: `Defeat ${ENEMY_BY['e_' + t.boss].name}`, have: P('e_' + t.boss), need: 1, go: 'combat' },
  ][step];
}
function checkQuest(quiet, notes) {
  let guard = 0;
  while (!ch.quest.done && guard++ < 12) {
    const step = ch.quest.step, g = questGoal(step); if (g.have < g.need) return;
    const stat = QUEST_STATS[step], gold = 15 * (step + 1), amt = step === 9 ? 2 : 1;
    ch.questStats[stat] = (ch.questStats[stat] || 0) + amt; ch.gold += gold;
    if (step === 4) addItem('potion_prod', 1, true);
    let msg = `Quest complete: ${TUTORIAL_TITLES[step]}. +${gold} gold, +${amt} ${stat} (permanent).`;
    ch.quest.step++;
    if (ch.quest.step >= TUTORIAL_TITLES.length) {
      const t = TUTORIALS[ch.region]; ch.quest.done = true; ch.counters.tutorial = 1; addItem(gkey(t.gear[0], 2), 1, true); ch.gold += 200;
      msg += ` Tutorial finished! You received ${t.gear[1]} and 200 gold. The world map is open.`;
    }
    dirty = true;
    if (quiet) notes.push(msg); else { addLog('level', msg); toast(`<b>${esc(TUTORIAL_TITLES[step])}</b> complete<br><span class="ember">Stat gain: +${amt} ${stat}</span> · +${gold} gold${ch.quest.done ? '<br><b>The world map is open!</b>' : ''}`, 'gold'); chime(659, 1047); if (ch.quest.done) flash(); }
  }
}

// ---------- Offline for combat / exploration ----------
function offlineCombat(a, e, sec, d, sum, notes) {
  let t = sec, wins = 0, fights = 0, xp = 0, gold = 0; const loot = {}, s = sum[a.res] || (sum[a.res] = { done: 0, units: 0, xp: 0 });
  if (ch.hp == null) ch.hp = d.maxHP;
  while (t > 0) {
    const f = fightInfo(ch, e, d), c = ch.prof[e.id] || 0, k = tierOf(c), next = k < 9 ? BALANCE.tierThresholds[k + 1] : Infinity;
    const p = f.win, net = f.dmg * (p + (1 - p) * BALANCE.combat.lossDmgMult) - f.regen;
    let n = Math.min(Math.floor(t / f.time), Math.ceil((next - c) / Math.max(p, 0.01)));
    if (n <= 0) break;
    if (net > 0) {
      const budget = Math.max(0, ch.hp - d.maxHP * 0.1), canWithout = Math.floor(budget / net);
      if (n > canWithout) { const ate = eatFood((n - canWithout) * net); ch.hp += ate.healed; const can = Math.floor(Math.max(0, ch.hp - d.maxHP * 0.1) / net); if (can < n) { n = can; t = 0; notes.push(`Ran out of food fighting ${e.name}; stopped.`); ch.actions = ch.actions.filter(x => x !== a); } }
      ch.hp = Math.max(d.maxHP * 0.1, ch.hp - n * net);
    }
    if (n <= 0) break;
    const w = Math.round(n * p), pb = BALANCE.tierYieldBonus[k];
    wins += w; fights += n; t -= n * f.time;
    xp += w * e.xp * (1 + pb) * d.xpMult; gold += w * (e.gold[0] + e.gold[1]) / 2 * (1 + pb);
    for (const l of e.loot) { if (l.secret && !ch.seen[l.key]) { if (w > 0 && pityRoll('drop_' + l.key, w)) { loot[l.key] = (loot[l.key] || 0) + 1; notes.push(`Secret find: ${ITEM(l.key).name}!`); } continue; } const q = w * l.chance * (l.rare ? 1 + d.drop : 1) * (l.rare ? 1 : (l.min + l.max) / 2 * (1 + pb) * (1 + d.pool)); loot[l.key] = (loot[l.key] || 0) + q; }
    const k0 = k; ch.prof[e.id] = c + w; for (let kk = k0 + 1; kk <= tierOf(ch.prof[e.id]); kk++) tierUp(e, kk, true, notes);
    if (w === 0) break;
  }
  ch.totals.slaying += wins; ch.counters.kills += wins; ch.gold += gold; ch.counters.goldEarned += gold;
  if (wins && typeof killGearDrop === 'function') killGearDrop(e, wins, true, notes);
  if (ch.growth && growthEquipped(ch)) growthXp(wins * e.level * GROWTH.killXp, true, notes);
  for (const [k, q] of Object.entries(loot)) { const eg = GEAR[parseG(k).base] && k.startsWith('g:') && GEAR[parseG(k).base].ego; if (eg) { if (!ch.egos[eg] && rng() < Math.min(1, q)) grantEgo(eg, true, notes); continue; } const u = probRound(q, rng); if (u) { addItem(k, u, true); s.units += u; if (ITEM(k).gear && GEAR[parseG(k).base].unique) ch.counters.uniques++; } }
  if (wins && e.role === 'boss' && !ch.bossKilled[e.id]) { ch.bossKilled[e.id] = Date.now(); ch.counters.bossKinds = Object.keys(ch.bossKilled).length; }
  s.done += wins; s.xp += xp; addXp('slaying', xp, true, notes);
  if (fights) notes.push(`${e.name}: won ${N(wins)} of ${N(fights)} fights, +${N(gold)} gold.`);
}
function offlineExplore(a, x, sec, d, sum, notes) {
  const seg = offlineChunks(x, ch.prof[x.id] || 0, sec, d.speed, Infinity);
  const k0 = tierOf(ch.prof[x.id] || 0); ch.prof[x.id] = seg.count; ch.totals.exploration += seg.done;
  for (let k = k0 + 1; k <= tierOf(seg.count); k++) tierUp(x, k, true, notes);
  const xp = seg.done * x.xp * d.xpMult; addXp('exploration', xp, true, notes);
  const chests = probRound(seg.done * BALANCE.explore.chestChance, rng); for (let i = 0; i < Math.min(chests, 20); i++) findChest(x.region, true, notes);
  const s = sum[a.res] || (sum[a.res] = { done: 0, units: 0, xp: 0 }); s.done += seg.done; s.xp += xp;
  checkExplore(x.region, true, notes, seg.done);
}

// ============================================================
// CLASS ADVANCEMENT, TALENTS, SECONDARY CLASS, REFORGE (Phase 5)
// ============================================================
function metricValue(m) {
  if (m === 'kills') return ch.counters.kills; if (m === 'goldEarned') return Math.floor(ch.counters.goldEarned); if (m === 'potions') return ch.counters.potions;
  if (m === 'magicCraft') return ch.totals.alchemy + ch.totals.enchanting; if (m.startsWith('skill:')) return ch.totals[m.slice(6)] || 0; return 0;
}
function advGoal(step) {
  const q = ch.adv.quest, A = ADVANCE[ch.cls], t = q.tier, region = t === 4 ? 'chasm' : t === 2 ? A[1] : A[3], trial = `e_trial_${ch.cls}_${t}`, amt = A[7] * ADVANCE_GOAL_MULT[t];
  return [
    { label: `Reach level ${TIER_LEVEL[t]}`, have: ch.level, need: TIER_LEVEL[t], go: 'char' },
    { label: A[8].replace('{n}', N(amt)), have: Math.max(0, metricValue(A[6]) - (q.base || 0)), need: amt, go: A[6].startsWith('skill:') ? A[6].slice(6) : A[6] === 'kills' ? 'combat' : 'inv' },
    { label: `Travel to ${REGION_BY[region].name} and find ${t === 4 ? 'the Ascension trial' : A[0]}`, have: ch.loc === region && !ch.travel ? 1 : 0, need: 1, go: 'map', region },
    { label: `Defeat ${ENEMY_BY[trial].name}`, have: ch.prof[trial] ? 1 : 0, need: 1, go: 'combat' },
    { label: t === 2 ? 'Choose your specialization' : `Accept the title ${tierName(ch.cls, ch.adv.spec, t)}`, have: 0, need: 1, go: 'class' },
  ][step];
}
function checkAdvance(quiet, notes) {
  const q = ch.adv && ch.adv.quest; if (!q) return;
  let guard = 0;
  while (q.step < 4 && guard++ < 6) {
    const g = advGoal(q.step); if (g.have < g.need) return;
    q.step++; if (q.step === 1) q.base = metricValue(ADVANCE[ch.cls][6]);
    const msg = `Class quest: ${g.label} — done.`; quiet ? notes.push(msg) : (addLog('level', msg), toast(`<b>Class quest</b> · ${esc(g.label)}`, 'verd'));
    if (q.step === 3 && !quiet) toast(`<b>${esc(ENEMY_BY[`e_trial_${ch.cls}_${q.tier}`].name)}</b> awaits in ${esc(regionName2(ch.loc))}. Check the Combat tab.`, 'gold');
    dirty = true;
  }
  if (q.step === 4 && q.tier > 2) promote(null, quiet, notes);
}
const regionName2 = id => REGION_BY[id].name;
function promote(spec, quiet, notes) {
  const q = ch.adv.quest; if (!q || q.step < 4) return;
  if (q.tier === 2) { if (spec == null) return; ch.adv.spec = spec; }
  ch.adv.tier = q.tier; ch.adv.quest = q.tier < 4 ? { tier: q.tier + 1, step: 0, base: 0 } : null;
  const nm = tierName(ch.cls, ch.adv.spec, ch.adv.tier), cl = cls(), [p, s2] = TIER_STATS[ch.adv.tier];
  const msg = `Class advancement! You are now a ${nm}. +${p} ${cl.pri}, +${s2} ${cl.sec}, +${BALANCE.stamina.perAdvance} stamina, a new talent branch and the title "${nm}".`;
  if (quiet) notes.push(msg); else { addLog('level', msg); toast(`<b>${esc(nm)}</b><br>${esc(msg)}`, 'gold'); flash(); chime(523, 1047); }
  fitStamina(); checkProgress(quiet, notes); dirty = true;
}
// Talents
function nodeRank(id) { return (ch.talents && ch.talents[id]) || 0; }
function canLearn(n) {
  if (!treeActive(ch, n.tree)) return 'This branch is not yours.';
  const r = nodeRank(n.id); if (r >= n.ranks) return 'Maxed.';
  if (ch.skillPts < n.cost) return `Needs ${n.cost} point${n.cost > 1 ? 's' : ''}.`;
  for (const [id, need] of n.req) if (nodeRank(id) < need) return `Needs ${NODES[id].name} rank ${need}.`;
  if (n.tree === 'general' && n.i === 5) { const lv = r === 0 ? 30 : 60; if (gateLevel(ch) < lv) return `Needs level ${lv}.`; }
  else if (n.level && gateLevel(ch) < n.level) return `Needs level ${n.level}.`;
  if (n.skillReq && n.kind === 'cap' && ch.skills[n.skillReq].level < 50) return `Needs ${SKILLS[n.skillReq].name} level 50.`;
  return '';
}
function learn(id) {
  const n = NODES[id], why = canLearn(n); if (why) { toast(esc(why)); return; }
  ch.talents[id] = nodeRank(id) + 1; ch.skillPts -= n.cost;
  addLog('level', `Learned ${n.name} (rank ${ch.talents[id]}).`); fitStamina(); dirty = true;
}
function spentPoints(filter) { let t = 0; for (const [id, r] of Object.entries(ch.talents)) { const n = NODES[id]; if (n && (!filter || filter(n))) t += r * n.cost; } return t; }
const treeRespecCost = () => ch.freeTreeRespecs > 0 ? 0 : 1000 * Math.pow(2, ch.treeRespecs);
function respecTalents() {
  const c = treeRespecCost(); if (ch.gold < c) { toast(`Needs ${N(c)} gold.`); return; }
  if (c) { ch.gold -= c; ch.treeRespecs++; } else ch.freeTreeRespecs--;
  const back = spentPoints(); ch.skillPts += back; ch.talents = {}; fitStamina();
  addLog('sys', `Talents reset: ${back} points returned.`); dirty = true;
}
// Secondary class & reforge
const secReady = () => ch.adv.tier >= 2 && ch.level >= 35 && Object.keys(ch.visited).length >= 3;
function setSecondary(c) {
  if (c === ch.cls) return;
  if (ch.adv.secondary) { const c = secChangeCost(); if (ch.gold < c) { toast(`Changing your second path costs ${N(c)} gold.`); return; } ch.gold -= c; }
  ch.adv.secondary = c; addLog('level', `You walk a second path: ${CLASSES.find(x => x.id === c).name} (half-strength passive).`); toast(`Second path: <b>${esc(CLASSES.find(x => x.id === c).name)}</b>`, 'gold'); dirty = true;
}
const REFORGE_COST = 250000;
const reforgeCost = () => scaled(ch, REFORGE_COST, 25), secChangeCost = () => scaled(ch, 100000, 35);
const reforgeReady = () => ch.adv.tier >= 2 && ch.counters.bossKinds >= 3;
function buyReforge() {
  if (!reforgeReady() || ch.gold < reforgeCost()) return;
  ch.gold -= reforgeCost(); addItem('reforge_destiny', 1, true); addLog('lucky', 'Your master forges a Reforge Destiny for you.'); toast('<b>Reforge Destiny</b> added to your inventory.', 'gold'); dirty = true;
}
function reforge(c, spec) {
  if (!ch.inv.reforge_destiny || c === ch.cls) return;
  takeItem('reforge_destiny', 1);
  const back = spentPoints(n => n.tree.startsWith('class:') || n.tree.startsWith('spec:'));
  for (const id of Object.keys(ch.talents)) if (NODES[id].tree.startsWith('class:') || NODES[id].tree.startsWith('spec:')) delete ch.talents[id];
  ch.skillPts += back; const old = cls().name; ch.cls = c; ch.adv.spec = ch.adv.tier >= 2 ? (spec || 0) : null;
  if (ch.adv.secondary === c) ch.adv.secondary = null;
  if (ch.adv.quest) ch.adv.quest = { tier: ch.adv.quest.tier, step: Math.min(ch.adv.quest.step, 1), base: metricValue(ADVANCE[c][6]) };
  addLog('level', `Destiny reforged: ${old} → ${tierName(c, ch.adv.spec, ch.adv.tier)}. ${back} class talent points returned.`); toast(`<b>Destiny reforged</b> · ${esc(tierName(c, ch.adv.spec, ch.adv.tier))}`, 'gold'); flash(); fitStamina(); dirty = true;
}

// ============================================================
// SELLING, AUTO-SELL, ASCENSION (balance pass 2)
// ============================================================
// Sell n of an item in chunks so a big stack walks the price down as it floods the market.
function sellN(key, n) {
  if (key.startsWith('g:') && GEAR[parseG(key).base] && (GEAR[parseG(key).base].ego || GEAR[parseG(key).base].growth)) { toast('You can\'t bring yourself to sell it.'); return 0; }
  n = Math.min(n, ch.inv[key] || 0); if (n <= 0) return 0;
  const now = Date.now(), d = D(); let g = 0, left = n;
  while (left > 0) { const c = Math.max(1, Math.ceil(left / 8)); g += ITEM(key).value * c * d.sell * priceMult(ch, key, now); ch.market[key] = { s: saturation(ch, key, now) + c, t: now }; left -= c; }
  g = Math.floor(g); takeItem(key, n);
  ch.gold += g; ch.counters.sold += n; ch.counters.goldEarned += g; if (RES_BY[key]) ch.counters.unsold = 0;
  return g;
}
function autoSellTick(quiet) {
  let gold = 0, units = 0;
  for (const [k, keep] of Object.entries(ch.autoSell)) { const ex = (ch.inv[k] || 0) - keep; if (ex > 0) { units += ex; gold += sellN(k, ex); } }
  if (ch.autoSellJunk) for (const k of Object.keys(ch.inv)) if (ITEM(k).type === 'junk') { units += ch.inv[k]; gold += sellN(k, ch.inv[k]); }
  if (gold && !quiet) { ch.autoGoldAcc = (ch.autoGoldAcc || 0) + gold; ch.autoUnitsAcc = (ch.autoUnitsAcc || 0) + units;
    if (!ch.autoLogAt || Date.now() - ch.autoLogAt > 10000) { addLog('gain', `Auto-sold ${N(ch.autoUnitsAcc)} items for ${N(ch.autoGoldAcc)} gold.`); ch.autoGoldAcc = 0; ch.autoUnitsAcc = 0; ch.autoLogAt = Date.now(); } }
  return gold;
}
const canAscend = () => ch.adv.tier >= BALANCE.ascension.needTier && ch.level >= BALANCE.ascension.needLevel;
function ascend() {
  if (!canAscend()) return;
  const A = BALANCE.ascension;
  ch.ascGrowth = (ch.ascGrowth || 0) + (ch.level - 1) * BALANCE.level.classGrowthPerLevel;
  ch.ascension++; ch.level = 1; ch.xp = 0; account.shards += A.shards; ch.counters.shardsEarned += A.shards;
  const msg = `Ascension ${ch.ascension}! Your level starts again at 1. Stats, skills, talents, items and class all stay. Permanent bonus now: +${pct(A.xp * ch.ascension)} XP, +${pct(A.yield * ch.ascension)} yield, +${pct(A.power * ch.ascension)} attack and HP. +${A.shards} Thousandium.`;
  addLog('level', msg); toast(`<b>A${ch.ascension}</b> · ${esc(msg)}`, 'gold'); flash(); chime(523, 1568); dirty = true;
}

// ============================================================
// COMPANIONS, EGO & GROWTH WEAPONS (Phase 6)
// ============================================================
const compDef = () => ch.comp && COMPANIONS[ch.comp.cls];
const compCap = () => Math.min(100, 25 + 25 * ch.comp.chapter);
function recruitCompanion() {
  if (ch.comp || gateLevel(ch) < COMPANION_UNLOCK_LEVEL) return;
  ch.comp = { cls: ch.cls, xp: 0, bond: 10, gear: { weapon: null, armour: null, trinket: null }, tree: {}, chapter: 0, chBase: null, sworn: false };
  ch.counters.compRecruited = 1;
  const d = compDef(); addLog('level', `${d[0]} ${d[1]} joins you.`); toast(`<b>${esc(d[0])}</b> ${esc(d[1])} joins you!`, 'gold'); flash(); dirty = true;
}
function compMetric(m) { return { kills: ch.counters.kills, explore: ch.totals.exploration, craft: ch.counters.crafted, gold: Math.floor(ch.counters.goldEarned), farm: ch.totals.farming, skin: ch.totals.skinning, fish: ch.totals.fishing }[m] || 0; }
function chapterGoal() {
  const d = compDef(), [m, n] = d[6], need = n * (ch.comp.chapter + 1);
  return { label: CHAPTER_GOALS[m].replace('{n}', N(need)), have: ch.comp.chBase == null ? 0 : Math.max(0, compMetric(m) - ch.comp.chBase), need };
}
function checkCompanions(quiet, notes) {
  if (!ch.growth && ch.counters.bossKinds >= 1) grantGrowth(quiet, notes);
  if (!ch.egos.old_thunk && (ch.prof.stone || 0) >= 10000) grantEgo('old_thunk', quiet, notes);
  if (!ch.starterEgg && ch.quest.done) { ch.starterEgg = 1; addItem('egg_' + START_TO_REGION[ch.region], 1, true); const msg = 'A starter egg from your home region is waiting in your inventory. Incubate it on the Pets tab.'; quiet ? notes.push(msg) : (addLog('lucky', msg), toast(esc(msg), 'gold')); }
  checkPets(quiet, notes);
  const c = ch.comp; if (!c || c.chapter >= 3) return;
  if (c.bond >= compCap() && c.chBase == null) { c.chBase = compMetric(compDef()[6][0]); const msg = `${compDef()[0]} has something to tell you (chapter ${c.chapter + 1}).`; quiet ? notes.push(msg) : (addLog('tier', msg), toast(esc(msg), 'verd')); dirty = true; }
  if (c.chBase != null) { const g = chapterGoal(); if (g.have >= g.need) {
    c.chapter++; c.chBase = null; ch.questStats[cls().pri] = (ch.questStats[cls().pri] || 0) + 2;
    let msg = `Companion chapter ${c.chapter} complete. +2 ${cls().pri} (permanent).`;
    if (c.chapter >= 3) { msg += ` ${compDef()[0]} grows closer still. Reach 100 bond to swear an oath.`; }
    quiet ? notes.push(msg) : (addLog('level', msg), toast(esc(msg), 'gold')); dirty = true; } }
}
function bondTick(sec, quiet, notes) {
  const active = ch.actions.length > 0 || sec > 1;
  if (ch.comp && active) {
    const before = ch.comp.bond; ch.comp.bond = Math.min(compCap(), ch.comp.bond + sec / 600);
    if (ch.comp.bond >= 100 && !ch.comp.sworn && ch.comp.chapter >= 3) { ch.comp.sworn = true; ch.counters.compSworn = 1; const msg = `${compDef()[0]} swears an oath to you. Their help grows by a quarter.`; quiet ? notes.push(msg) : (addLog('level', msg), toast(`<b>Oath sworn</b> · ${esc(compDef()[0])}`, 'gold'), flash()); }
    if (Math.floor(before) !== Math.floor(ch.comp.bond) && Math.floor(ch.comp.bond) % 10 === 0) dirty = true;
  }
  // Ego weapon: likes and dislikes from what happened since last tick.
  const C = ch.counters, now = { kills: C.kills, bossKills: C.bossWins, undead: C.undeadKills, gathered: C.gathered, rare: C.rareDrops, upgrade: C.upgrades, masterwork: C.masterworks, sold: C.sold, potions: C.potions, travel: C.arrivals, newRegion: C.regionsVisited, explore: ch.totals.exploration, fished: ch.totals.fishing, goldK: C.goldEarned / 1000 };
  tickPets(sec);
  const prev = ch.snap || now; ch.snap = now;
  const id = egoEquipped(ch); if (!id || !ch.egos[id]) return;
  const e = EGOS[id], st = ch.egos[id], ev = {};
  for (const k of Object.keys(now)) ev[k] = Math.max(0, now[k] - prev[k]);
  const combatOn = ch.actions.some(a => ACT(a.res).kind === 'combat');
  ev.idleMin = combatOn ? 0 : sec / 60; ev.homeMin = ch.loc === 'woods' ? sec / 60 : 0; ev.farMin = FAR_REGIONS.includes(ch.loc) ? sec / 60 : 0;
  ev.sameRegionH = ch.arrivedAt && Date.now() - ch.arrivedAt > 3.6e6 ? sec / 3600 : 0; ev.offlineH = sec > 60 ? sec / 3600 : 0;
  let d = 0; for (const [k, w] of Object.entries(e.likes)) d += (ev[k] || 0) * w; for (const [k, w] of Object.entries(e.dislikes)) d -= (ev[k] || 0) * w;
  const b0 = st.bond; st.bond = Math.max(0, Math.min(100, st.bond + d));
  const cross = t => b0 < t && st.bond >= t, drop = t => b0 >= t && st.bond < t;
  EGO_BOND.chapters.forEach((t, i) => { if (cross(t) && st.ch <= i) { st.ch = i + 1; const msg = `${e.name}, chapter ${i + 1}: ${e.chapters[i]}`; quiet ? notes.push(msg) : (addLog('tier', msg), toast(`<b>${esc(e.name)}</b> opens up (chapter ${i + 1})`, 'verd')); } });
  if (cross(EGO_BOND.awaken)) { ch.counters.egoAwake = 1; const msg = `${e.name} awakens! ${e.lines.awaken}`; quiet ? notes.push(msg) : (addLog('level', msg), toast(`<b>${esc(e.name)} awakens!</b> ${esc(e.lines.awaken)}`, 'gold'), flash(), chime(523, 1568)); }
  if (drop(EGO_BOND.sulk) && !quiet) { addLog('sys', `${e.name} sulks and withholds its powers. ${e.lines.sulk}`); toast(`<b>${esc(e.name)}</b> is sulking.`); }
  if ([EGO_BOND.ab1, EGO_BOND.ab2, EGO_BOND.sulk].some(t => cross(t) || drop(t))) dirty = true;
  if (!quiet && (!st.lastLine || Date.now() - st.lastLine > 240000)) { st.lastLine = Date.now(); const line = st.bond < EGO_BOND.sulk ? e.lines.sulk : d > 0.001 ? e.lines.like : d < -0.001 ? e.lines.dislike : null; if (line) addLog('lucky', `${e.name}: ${line}`); }
}
function grantEgo(id, quiet, notes) {
  if (ch.egos[id]) return; const e = EGOS[id];
  ch.egos[id] = { bond: 30, ch: 0, lastLine: 0 }; addItem(gkey('ego_' + id), 1, true); ch.counters.egosFound = Object.keys(ch.egos).length;
  const msg = `You found ${e.name}, ${e.epithet}. ${e.lines.greet}`; discover('Sentient weapon', `${e.name}, ${e.epithet}`, `\u201c${e.lines.greet.replace(/^["\u201c]+|["\u201d]+$/g, '')}\u201d It is in your inventory. Equip it on the Arsenal tab, and keep it happy: it has likes and dislikes.`, 'Arsenal');
  if (quiet) notes.push(msg); else { addLog('lucky', msg); toast(`<b>Sentient weapon!</b> ${esc(e.name)}<br>${esc(e.lines.greet)}`, 'gold'); flash(); chime(659, 1319); }
  dirty = true;
}
function grantGrowth(quiet, notes) {
  if (ch.growth) return;
  ch.growth = { lvl: 1, xp: 0, path: null, tier: 1, kills: 0, undead: 0, gatherXp: 0, combatXp: 0 }; addItem(gkey('growth_blade'), 1, true);
  const msg = 'Among the boss’s hoard you find a sword with a sapling for a hilt. It feels warm. (Seedling Blade: a Growth weapon.)';
  if (quiet) notes.push(msg); else { addLog('lucky', msg); toast(`<b>Growth weapon found!</b> Seedling Blade`, 'gold'); flash(); }
  dirty = true;
}
function growthXp(x, quiet, notes) {
  const g = ch.growth; if (!g || g.lvl >= GROWTH.maxLevel) return;
  g.xp += x;
  while (g.lvl < GROWTH.maxLevel && g.xp >= growthCost(g.lvl)) {
    g.xp -= growthCost(g.lvl); g.lvl++;
    let msg = `${growthName(g)} reached level ${g.lvl}.`;
    if (g.lvl === GROWTH.evolveAt[0]) { g.path = g.kills && g.undead / g.kills >= 0.3 ? 'holy' : D().crit >= 0.15 ? 'assassin' : g.gatherXp > g.combatXp ? 'harvest' : 'berserk'; g.tier = 2; msg = `Your Seedling Blade evolves into ${growthName(g)}! ${GROWTH.pathText[g.path]}`; }
    else if (g.lvl === GROWTH.evolveAt[1]) { g.tier = 3; msg = `It evolves again: ${growthName(g)}!`; }
    ch.counters.growthTier = g.tier;
    if (quiet) notes.push(msg); else { addLog(g.lvl % 20 === 0 ? 'level' : 'tier', msg); if (g.lvl % 20 === 0) { toast(`<b>${esc(msg)}</b>`, 'gold'); flash(); } }
    dirty = true;
  }
  if (g.lvl >= GROWTH.maxLevel) g.xp = 0;
}
const feedXp = key => Math.max(1, Math.round(Math.pow(Math.log10(ITEM(key).value + 1), 2)));
const canFeed = key => { const t = ITEM(key).type; return t === 'trophy' || t === 'material'; };
function feedGrowth(key, n) { n = Math.min(n, ch.inv[key] || 0); if (!n || !ch.growth || !canFeed(key)) return; takeItem(key, n); const x = feedXp(key) * n; growthXp(x); addLog('sys', `Fed ${N(n)} ${ITEM(key).name} to ${growthName(ch.growth)} (+${N(x)} growth).`); dirty = true; }
function giftLikes(key) { const it = ITEM(key), t = compDef()[4]; return t === 'food' ? it.type === 'food' : t === 'potion' ? it.type === 'potion' : t === 'trophy' ? it.type === 'trophy' : t === 'bar' ? it.type === 'material' && /Bar$/.test(it.name) : false; }
function giveGift(key) { if (!ch.comp || !giftLikes(key) || !ch.inv[key]) return; if (ch.comp.bond >= compCap()) { toast(`${esc(compDef()[0])} wants to talk first: see their chapter.`); return; } takeItem(key, 1); ch.comp.bond = Math.min(compCap(), ch.comp.bond + 2); addLog('sys', `Gave ${ITEM(key).name} to ${compDef()[0]} (+2 bond).`); checkCompanions(); dirty = true; }
function compEquip(slot, key) {
  const c = ch.comp; if (!c) return; const old = c.gear[slot];
  if (key) { const it = ITEM(key); if (!it.gear || !COMPANION_SLOTS[slot].includes(it.slot) || !ch.inv[key]) return; takeItem(key, 1); }
  if (old) addItem(old, 1, true); c.gear[slot] = key || null; dirty = true;
}
const compPoints = () => Math.floor(compLevel(ch.comp) / 5) - Object.values(ch.comp.tree).reduce((a, b) => a + b, 0);
function compLearn(i) { const c = ch.comp; if (!c || compPoints() < 1 || (c.tree[i] || 0) >= COMPANION_TREE[i][1]) return; c.tree[i] = (c.tree[i] || 0) + 1; dirty = true; }

// ============================================================
// PHASE 7 — training, elixirs, region stories, quest board
// ============================================================
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const weekKey = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function resetDaily() {
  const t = todayKey(), w = weekKey();
  if (ch.trainDay.day !== t) ch.trainDay = { day: t, gained: {} };
  if (ch.board.day !== t || ch.board.week !== w) {
    const newWeek = ch.board.week !== w;
    ch.qactive = ch.qactive.filter(q => q.kind === 'story' || (q.kind === 'weekly' && !newWeek) || questHave(q) >= q.need);
    ch.board = { day: t, week: w, taken: newWeek ? {} : Object.fromEntries(Object.entries(ch.board.taken || {}).filter(([k]) => k.startsWith('w'))) };
    if (ch.board.day && booted) dirty = true;
  }
}
// Training
function trainTick(a, t, d) {
  a.prog += BALANCE.tickMs;
  const tms = Math.max(100, Math.round(actionSec(t, ch.prof[t.id] || 0, d.speed) * 1000));
  if (a.prog < tms) return;
  const n = Math.floor(a.prog / tms); a.prog -= n * tms;
  const left = TRAIN_CFG.dailyCap - (ch.trainDay.gained[t.stat] || 0);
  const gain = Math.min(left, n * TRAIN_CFG.perCompletion * (1 + d.pool));
  ch.trainDay.gained[t.stat] = (ch.trainDay.gained[t.stat] || 0) + gain; ch.trained[t.stat] = (ch.trained[t.stat] || 0) + gain;
  ch.counters.trainedPts = Object.values(ch.trained).reduce((x, y) => x + y, 0);
  const k0 = tierOf(ch.prof[t.id] || 0); ch.prof[t.id] = (ch.prof[t.id] || 0) + n; ch.totals.training += n; a.streak += n;
  addXp('training', n * t.xp * d.xpMult);
  const g = agg[a.res] || (agg[a.res] = { gain: 0, n: 0, xp: 0 }); g.gain += gain; g.n += n;
  if (tierOf(ch.prof[t.id]) > k0) tierUp(t, tierOf(ch.prof[t.id]));
  if (left - gain <= 1e-9) stopAction(a.res, `Daily limit reached for ${t.name} (+${TRAIN_CFG.dailyCap} ${t.stat} today). Come back tomorrow.`);
}
function offlineTrain(a, t, sec, d, sum, notes) {
  const left = TRAIN_CFG.dailyCap - (ch.trainDay.gained[t.stat] || 0); if (left <= 0) return;
  const per = TRAIN_CFG.perCompletion * (1 + d.pool), seg = offlineChunks(t, ch.prof[t.id] || 0, sec, d.speed, Math.ceil(left / per));
  const gain = Math.min(left, seg.done * per);
  ch.trainDay.gained[t.stat] = (ch.trainDay.gained[t.stat] || 0) + gain; ch.trained[t.stat] = (ch.trained[t.stat] || 0) + gain;
  ch.counters.trainedPts = Object.values(ch.trained).reduce((x, y) => x + y, 0);
  ch.prof[t.id] = seg.count; ch.totals.training += seg.done; addXp('training', seg.done * t.xp * d.xpMult, true, notes);
  notes.push(`${t.name}: +${gain.toFixed(2)} ${t.stat}.`);
  if (gain >= left - 1e-9) { ch.actions = ch.actions.filter(x => x !== a); notes.push(`${t.name} hit today's limit and stopped.`); }
}
// Elixirs
function elixirGain(stat, pts) { return pts * Math.max(0, 1 - (ch.elixirs[stat] || 0) / ELIXIR_CAP); }
function drinkElixir(key) {
  const it = ITEMS[key]; if (!it || it.type !== 'elixir' || !ch.inv[key]) return;
  const g = elixirGain(it.stat, it.pts); if (g < 0.01) { toast(`Your ${it.stat} has taken all an elixir can give (${ELIXIR_CAP}).`); return; }
  takeItem(key, 1); ch.elixirs[it.stat] = (ch.elixirs[it.stat] || 0) + g; ch.counters.elixirs++;
  addLog('level', `${it.name}: +${g.toFixed(2)} ${it.stat} (permanent).`); toast(`<b>Stat gain</b><br><span class="ember">+${g.toFixed(2)} ${it.stat}</span> from ${esc(it.name)}`, 'gold'); chime(659, 988);
  checkProgress(); dirty = true;
}
// Region stories
function storyGoal(rid, step) {
  const r = REGION_BY[rid], G = STORY_GOALS[step], base = ch.storyBase[rid] || 0;
  if (G.type === 'explore') return { label: `Explore ${r.name} to ${pct(G.frac)}`, have: Math.min(1, exploreFrac(ch, rid)), need: G.frac, pctMode: true };
  if (G.type === 'hunt') { const tot = ENEMIES.filter(e => e.region === rid && !e.hamlet && (e.area === 0 || e.area === 1)).reduce((t, e) => t + (ch.prof[e.id] || 0), 0); return { label: `Win ${G.n} fights in ${r.name}`, have: Math.max(0, tot - base), need: G.n }; }
  const boss = ENEMIES.find(e => e.region === rid && e.role === 'boss'); return { label: `Defeat ${boss.name}`, have: Math.max(0, (ch.prof[boss.id] || 0) - base), need: 1 };
}
function storyMetricBase(rid, step) { const G = STORY_GOALS[step]; if (G.type === 'hunt') return ENEMIES.filter(e => e.region === rid && !e.hamlet && (e.area === 0 || e.area === 1)).reduce((t, e) => t + (ch.prof[e.id] || 0), 0); if (G.type === 'boss') { const b = ENEMIES.find(e => e.region === rid && e.role === 'boss'); return ch.prof[b.id] || 0; } return 0; }
function checkStories(quiet, notes) {
  for (const rid of Object.keys(REGION_STORY)) {
    if (!ch.visited[rid] || !ch.quest.done) continue;
    let st = ch.story[rid] || 0, guard = 0;
    if (st === 0 && ch.storyBase[rid] == null) ch.storyBase[rid] = storyMetricBase(rid, 0);
    while (st < 3 && guard++ < 4) {
      const g = storyGoal(rid, st); if (g.have < g.need) break;
      const S = REGION_STORY[rid], stat = S[0], gold = scaled(ch, STORY_REWARD.gold * (st + 1), REGION_BY[rid].lvl);
      ch.questStats[stat] = (ch.questStats[stat] || 0) + STORY_REWARD.stat; ch.gold += gold; ch.counters.goldEarned += gold; st++; ch.story[rid] = st;
      if (st < 3) ch.storyBase[rid] = storyMetricBase(rid, st);
      if (st === 3) ch.counters.storiesDone = Object.values(ch.story).filter(v => v >= 3).length;
      const msg = `${REGION_BY[rid].name} story: "${S[st][0]}" complete. +${STORY_REWARD.stat} ${stat} (permanent), +${N(gold)} gold.`;
      if (quiet) notes.push(msg); else { addLog('level', msg); toast(`<b>${esc(S[st][0])}</b> complete<br><span class="ember">Stat gain: +${STORY_REWARD.stat} ${stat}</span>${st === 3 ? `<br><b>${esc(REGION_BY[rid].name)}</b> story finished!` : ''}`, 'gold'); chime(659, 1047); }
      dirty = true;
    }
  }
}
// Quest board
function questHave(q) {
  const m = { gather: () => ch.prof[q.target] || 0, hunt: () => ch.prof[q.target] || 0, craft: () => ch.counters.crafted, explore: () => ch.prof[q.target] || 0, gatherAny: () => ch.counters.gathered, kills: () => ch.counters.kills, boss: () => ch.prof[q.target] || 0 }[q.type];
  return Math.max(0, (m ? m() : 0) - q.base);
}
function boardOffers(rid) {
  const r = REGION_BY[rid], d = D('slaying'), seed = n => hashStr(`${ch.id}:${ch.board.day}:${rid}:${n}`);
  const known = RES.filter(x => (x.band === 0 || x.band === r.band) && isUnlocked(ch, x) && tabOpen(x.skill));
  const foes = ENEMIES.filter(e => e.region === rid && !e.hamlet && (e.area === 0 || e.area === 1) && areaOpen(ch, e, d));
  const hamletFoes = ENEMIES.filter(e => e.region === rid && e.hamlet && e.role !== 'tboss');
  const pool = [];
  if (known.length) { const x = known[Math.floor(seed(1) * known.length)]; pool.push({ type: 'gather', target: x.id, need: 1000, label: `Gather 1,000 ${x.name}` }); }
  const f = foes.length ? foes : hamletFoes; if (f.length) { const e = f[Math.floor(seed(2) * f.length)]; pool.push({ type: 'hunt', target: e.id, need: 100, label: `Defeat 100 ${e.name}` }); }
  pool.push({ type: 'craft', target: '', need: 50, label: 'Craft 50 items (anything)' });
  pool.push({ type: 'explore', target: 'x_' + rid, need: 100, label: `Explore ${r.name} 100 times` });
  const daily = pool.sort((a, b) => hashStr(ch.board.day + a.type) - hashStr(ch.board.day + b.type)).slice(0, BOARD.daily).map((o, i) => ({ ...o, kind: 'daily', oid: `d:${rid}:${i}`, region: rid }));
  const boss = ENEMIES.find(e => e.region === rid && e.role === 'boss');
  const wk = [areaOpen(ch, boss, d) ? { type: 'boss', target: boss.id, need: 5, label: `Defeat ${boss.name} 5 times` } : { type: 'explore', target: 'x_' + rid, need: 500, label: `Explore ${r.name} 500 times` },
    hashStr(ch.board.week + rid) < 0.5 ? { type: 'gatherAny', target: '', need: 20000, label: 'Gather 20,000 resources (any)' } : { type: 'kills', target: '', need: 2000, label: 'Win 2,000 fights (anywhere)' }];
  const weekly = wk.slice(0, BOARD.weekly).map((o, i) => ({ ...o, kind: 'weekly', oid: `w:${rid}:${i}`, region: rid }));
  return { daily, weekly };
}
function acceptQuest(o) {
  if (ch.board.taken[o.oid] || ch.qactive.filter(q => q.kind !== 'story').length >= BOARD.maxActive) { toast('Your quest log is full (6). Finish or drop one first.'); return; }
  const q = { ...o, base: 0, at: Date.now() }; q.base = questHave(q); ch.qactive.push(q); ch.board.taken[o.oid] = true;
  addLog('sys', `Accepted: ${o.label}.`); dirty = true;
}
function claimQuest(i) {
  const q = ch.qactive[i]; if (!q || questHave(q) < q.need) return;
  const weekly = q.kind === 'weekly', gold = scaled(ch, weekly ? BOARD.weeklyGold : BOARD.dailyGold, REGION_BY[q.region].lvl), shards = weekly ? BOARD.weeklyShards : BOARD.dailyShards;
  ch.gold += gold; ch.counters.goldEarned += gold; account.shards += shards; ch.counters.shardsEarned += shards; ch.counters.boardDone++; if (weekly) ch.counters.weeklyDone++;
  let extra = '';
  const stat = REGION_STORY[q.region][0].toLowerCase();
  if (weekly) { addItem(`elixir_${stat}_1`, 1, true); addItem('egg_rare', 1, true); extra = `, ${ITEMS[`elixir_${stat}_1`].name}, Rare Egg`; }
  else if (rng() < 0.1) { addItem('egg_common', 1, true); extra += ', Common Egg'; }
  else if (rng() < 0.2) { addItem(`elixir_${stat}_0`, 1, true); extra = `, ${ITEMS[`elixir_${stat}_0`].name}`; }
  ch.qactive.splice(i, 1);
  addLog('lucky', `Quest done: ${q.label}. +${N(gold)} gold, +${shards} Thousandium${extra}.`); toast(`<b>Quest complete</b> · +${N(gold)} gold, +${shards} Thousandium${esc(extra)}`, 'gold'); chime(659, 988);
  checkProgress(); dirty = true;
}
function buyShard(i) {
  const o = SHARD_SHOP[i]; if (!o || account.shards < o.price) return;
  if (!addItem(o.key, 1)) { toast('Inventory full.'); return; }
  account.shards -= o.price; addLog('sys', `Exchanged ${o.price} Thousandium for ${ITEM(o.key).name}.`); dirty = true;
}

// ============================================================
// PETS (Phase 8)
// ============================================================
function eggChance() { const d = D(); return PET_CFG.eggPerCompletion * (1 + above(d.S.LUCK.total) * 0.002 + (d.M.eggFind || 0)); }
function rollRarity() { let r = rng(), k = 0; for (; k < EGG_ROLL.length - 1; k++) { if (r < EGG_ROLL[k]) break; r -= EGG_ROLL[k]; } return k; }
function petActions(n, quiet, notes) {
  if (!n) return;
  for (const s of ch.incub) s.actions = (s.actions || 0) + n;
  const eggs = probRound(n * eggChance(), rng);
  for (let i = 0; i < Math.min(eggs, 25); i++) { const k = ['egg_common', 'egg_rare', 'egg_epic', 'egg_legendary', 'egg_mythic'][rollRarity()]; addItem(k, 1, true); const msg = `You found a ${ITEMS[k].name}!`; quiet ? notes.push(msg) : (addLog('lucky', msg), toast(`<b>${esc(ITEMS[k].name)}</b> found!`, 'gold'), chime(880, 1320)); }
  checkPets(quiet, notes);
}
function incubate(key) {
  if (!ch.inv[key] || ITEMS[key].type !== 'egg') return;
  if (ch.incub.length >= ch.incubSlots) { toast('All incubators are busy. Buy another one on the Pets tab.'); return; }
  takeItem(key, 1); const e = ITEMS[key], E = EGGS['egg_' + ['common', 'rare', 'epic', 'legendary', 'mythic'][e.rarity]];
  ch.incub.push({ egg: key, start: Date.now(), mins: E.mins, need: E.actions, actions: 0 }); addLog('sys', `Placed a ${e.name} in an incubator.`); dirty = true;
}
const incubFrac = s => Math.min(1, Math.max((Date.now() - s.start) / (s.mins * 60000), s.actions / s.need));
const isEvolved = id => Object.values(SPECIES).some(s => s[7] && s[7][0] === id);
function pickSpecies(key) {
  const e = ITEMS[key];
  if (e.species) return e.species;
  const base = Object.keys(SPECIES).filter(id => !SPECIES[id][9] && !isEvolved(id));
  let pool;
  if (e.region) { const r = rng(), rar = r < 0.75 ? 0 : r < 0.97 ? 1 : 2; pool = base.filter(id => SPECIES[id][4] === e.region && SPECIES[id][1] === rar); if (!pool.length) pool = base.filter(id => SPECIES[id][4] === e.region && SPECIES[id][1] <= rar); if (!pool.length) pool = base.filter(id => SPECIES[id][1] === 0); }
  else { pool = base.filter(id => SPECIES[id][1] === e.rarity); const local = pool.filter(id => SPECIES[id][4] === ch.loc); if (local.length && rng() < 0.5) pool = local; }
  return pool[Math.floor(rng() * pool.length)];
}
function hatch(i, quiet, notes) {
  const s = ch.incub[i]; if (!s) return;
  const sp = pickSpecies(s.egg), S = SP(sp);
  const p = { uid: 'p' + (++ch.petSeq), sp, lvl: 1, xp: 0, hunger: 80, happy: 70, pers: Math.floor(rng() * PERSONALITIES.length), hat: null, aura: null, name: '' };
  ch.pets.push(p); ch.incub.splice(i, 1); ch.totals.beastmastery++;
  const isNew = !ch.petDex[sp]; ch.petDex[sp] = 1; ch.counters.hatched++; ch.counters.species = Object.keys(ch.petDex).length; if (S.rarity === 4) ch.counters.mythicPet = 1;
  if (!ch.petActive) ch.petActive = p.uid;
  addXp('beastmastery', [20, 60, 200, 600, 2000][S.rarity], quiet, notes);
  const msg = `Your egg hatched: a ${PERSONALITIES[p.pers][0]} ${S.name} (${PET_RARITY[S.rarity]})!${isNew ? ' New species!' : ''}`; if (isNew) discover('New species', S.name, `${PET_RARITY[S.rarity]} ${PET_SIZES[S.size].toLowerCase()} pet (${S.tags.join(', ')}). ${S.desc} Added to your Collection.`, 'Pets', sp);
  if (quiet) notes.push(msg); else { addLog('lucky', msg); toast(`<b>It hatched!</b> ${esc(S.name)} · ${PET_RARITY[S.rarity]}${isNew ? '<br>New species for your collection!' : ''}`, 'gold'); flash(); chime(784, 1568); }
  dirty = true;
}
const petName = p => p.name || SP(p.sp).name;
function petGainXp(p, x, quiet, notes) {
  if (p.lvl >= PET_CFG.maxLevel) return;
  p.xp += x;
  while (p.lvl < PET_CFG.maxLevel && p.xp >= petCost(p.lvl)) {
    p.xp -= petCost(p.lvl); p.lvl++; ch.totals.beastmastery++; addXp('beastmastery', p.lvl * 3, true, []);
    const S = SP(p.sp);
    if (S.evolve && p.lvl >= S.evolve[1]) { const to = S.evolve[0]; p.sp = to; ch.petDex[to] = 1; ch.counters.evolved++; ch.counters.species = Object.keys(ch.petDex).length;
      const msg = `${S.name} evolved into ${SP(to).name}!`; discover('Evolution', SP(to).name, `${S.name} evolved into ${SP(to).name}. ${SP(to).desc} A new entry in your Collection.`, 'Pets', to); if (quiet) notes.push(msg); else { addLog('level', msg); toast(`<b>Evolution!</b> ${esc(msg)}`, 'gold'); flash(); } }
    dirty = true;
  }
  if (p.lvl >= PET_CFG.maxLevel) p.xp = 0;
}
function petXpShare(xp, quiet, notes) {
  const a = petById(ch, ch.petActive); if (a) petGainXp(a, xp * PET_CFG.activeXp, quiet, notes);
  for (const u of ch.petSupport.slice(0, supportSlots(ch))) { const p = petById(ch, u); if (p) petGainXp(p, xp * PET_CFG.supportXp, quiet, notes); }
}
function checkPets(quiet, notes) {
  if (!ch.pets) return;
  for (let i = ch.incub.length - 1; i >= 0; i--) if (incubFrac(ch.incub[i]) >= 1) hatch(i, quiet, notes);
  for (const c of activeCombos(ch)) if (!ch.combosSeen[c.id]) { ch.combosSeen[c.id] = 1; ch.counters.combos = Object.keys(ch.combosSeen).length; const msg = `Pet combo discovered: ${c.name}! ${c.text}`; discover('Secret pet combo', c.name, c.text + ' It stays active while both pets are slotted.', 'Pets'); quiet ? notes.push(msg) : (addLog('lucky', msg), toast(`<b>Secret combo: ${esc(c.name)}</b><br>${esc(c.text)}`, 'gold'), flash()); }
  const a = petById(ch, ch.petActive); if (a && isMount(a)) ch.counters.mounted = 1;
  const C = collectionPct(ch); ch.counters.collMin = Math.floor(Math.min(...Object.values(C)) * 100);
  for (let i = ch.daycare.length - 1; i >= 0; i--) if (Date.now() >= ch.daycare[i].end) collectDaycare(i, quiet, notes);
}
function tickPets(sec) {
  if (!ch.pets) return;
  const live = [petById(ch, ch.petActive), ...ch.petSupport.slice(0, supportSlots(ch)).map(u => petById(ch, u))].filter(Boolean);
  for (const p of live) {
    p.hunger = Math.max(0, p.hunger - sec / 60 * PET_CFG.hungerPerMin);
    p.happy = Math.max(0, Math.min(100, p.happy + (p.hunger < 20 ? -sec / 60 * 0.2 : p.uid === ch.petActive ? sec / 60 * 0.05 : 0)));
  }
}
function feedPet(uid, key) {
  const p = petById(ch, uid); if (!p || !ch.inv[key] || ITEM(key).type !== 'food') return;
  if (p.hunger >= 99) { toast(`${esc(petName(p))} is full.`); return; }
  takeItem(key, 1); p.hunger = Math.min(100, p.hunger + PET_CFG.feed); p.happy = Math.min(100, p.happy + 5); ch.totals.beastmastery++; addXp('beastmastery', 5); dirty = true;
}
function bestFood() { return Object.keys(ch.inv).filter(k => ITEM(k) && ITEM(k).type === 'food').sort((a, b) => (ITEM(a).value || 0) - (ITEM(b).value || 0))[0]; }
function feedAll() { const live = [ch.petActive, ...ch.petSupport].map(u => petById(ch, u)).filter(Boolean); let fed = 0; for (const p of live) while (p.hunger < 76) { const k = bestFood(); if (!k) break; takeItem(k, 1); p.hunger = Math.min(100, p.hunger + PET_CFG.feed); p.happy = Math.min(100, p.happy + 5); addXp('beastmastery', 5); ch.totals.beastmastery++; fed++; } toast(fed ? `Fed your pets ${fed} meal${fed > 1 ? 's' : ''}.` : 'No food in your bag. Cook some, or buy it in the shop.'); dirty = true; }
function setPetSlot(uid, slot) {
  if (ch.daycare.some(d => d.uid === uid)) { toast('That pet is away at daycare.'); return; }
  const wasActive = ch.petActive === uid;
  ch.petSupport = ch.petSupport.filter(u => u !== uid); if (wasActive) ch.petActive = null;
  if (slot === 'active') { if (ch.petActive && ch.petSupport.length < supportSlots(ch)) ch.petSupport.push(ch.petActive); ch.petActive = uid; }
  else if (slot === 'support') { if (ch.petSupport.length >= supportSlots(ch)) { toast(supportSlots(ch) ? `Support slots full (${supportSlots(ch)}).` : 'Support slots open at Beastmastery level 10.'); if (wasActive) ch.petActive = uid; } else ch.petSupport.push(uid); }
  checkPets(); dirty = true;
}
function sendDaycare(uid, hours) {
  if (ch.daycare.length >= PET_CFG.daycareSlots) { toast('Daycare is full.'); return; }
  if (ch.petActive === uid || ch.petSupport.includes(uid)) { toast('Take the pet out of its slot first.'); return; }
  ch.daycare.push({ uid, start: Date.now(), end: Date.now() + hours * 3.6e6, hours, region: ch.loc }); addLog('sys', `${petName(petById(ch, uid))} left on a ${hours}-hour expedition.`); dirty = true;
}
function collectDaycare(i, quiet, notes) {
  const d = ch.daycare[i], p = petById(ch, d.uid); ch.daycare.splice(i, 1); if (!p) return;
  const band = REGION_BY[d.region].band, pool = RES.filter(r => (r.band === band || r.band == null || r.band === 0) && isUnlocked(ch, r)), got = [];
  const picks = [...pool].sort(() => rng() - 0.5).slice(0, 3);
  for (const r of picks) { const q = Math.round(d.hours * 50 * (1 + p.lvl / 25)); addItem(r.id, q, true); got.push(`${N(q)} ${r.name}`); }
  ch.totals.beastmastery += d.hours * 10; petGainXp(p, d.hours * petCost(p.lvl) * 0.5, quiet, notes); addXp('beastmastery', d.hours * 20, quiet, notes);
  const msg = `${petName(p)} is back from daycare with ${got.join(', ') || 'stories'}.`; quiet ? notes.push(msg) : (addLog('lucky', msg), toast(esc(msg), 'verd')); dirty = true;
}
function hybridFor(a, b) { const ta = SP(a.sp).tags, tb = SP(b.sp).tags; for (const [[x, y], sp] of HYBRIDS) if ((ta.includes(x) && tb.includes(y)) || (ta.includes(y) && tb.includes(x))) return sp; return null; }
const petPrice = c => Math.ceil(c * (1 + gateLevel(ch) / 20));
const breedCost = () => petPrice(PET_CFG.breedCost);
function breed(u1, u2) {
  const a = petById(ch, u1), b = petById(ch, u2); if (!a || !b || a === b) { toast('Pick two different pets.'); return; }
  if (a.lvl < PET_CFG.breedLevel || b.lvl < PET_CFG.breedLevel) { toast(`Both pets need level ${PET_CFG.breedLevel}.`); return; }
  const sp = hybridFor(a, b); if (!sp) { toast('Those two can’t produce a hybrid.'); return; }
  if (Date.now() < ch.breedAt) { toast(`Breeding again in ${fmtTime((ch.breedAt - Date.now()) / 1000)}.`); return; }
  const c = breedCost(); if (ch.gold < c) { toast(`Breeding costs ${N(c)} gold.`); return; }
  ch.gold -= c; ch.breedAt = Date.now() + PET_CFG.breedCooldownH * 3.6e6; a.happy = Math.max(0, a.happy - 20); b.happy = Math.max(0, b.happy - 20);
  addItem('egg_h_' + sp, 1, true); ch.counters.bred++; addXp('beastmastery', 500);
  addLog('lucky', `Bred a ${ITEMS['egg_h_' + sp].name}!`); toast(`<b>Hybrid egg!</b> ${esc(ITEMS['egg_h_' + sp].name)}`, 'gold'); flash(); dirty = true;
}
const incubCost = () => { const c = PET_CFG.incubCost[ch.incubSlots - 1]; return c ? petPrice(c) : 0; };
function buyIncub() { const c = incubCost(); if (!c || ch.gold < c) return; ch.gold -= c; ch.incubSlots++; addLog('sys', `New incubator (${ch.incubSlots}).`); dirty = true; }
function buyCosmetic(kind, id) {
  if (kind === 'hat') { const h = PET_HATS.find(x => x[0] === id), c = petPrice(h[2]); if (ch.cosmetics.hats.includes(id) || ch.gold < c) return; ch.gold -= c; ch.cosmetics.hats.push(id); }
  else { const a = PET_AURAS.find(x => x[0] === id); if (ch.cosmetics.auras.includes(id) || account.shards < a[2]) return; account.shards -= a[2]; ch.cosmetics.auras.push(id); }
  dirty = true;
}
function dressPet(uid, kind, id) { const p = petById(ch, uid); if (!p) return; if (kind === 'hat') p.hat = p.hat === id ? null : id; else p.aura = p.aura === id ? null : id; dirty = true; }
function renamePet(uid, name) { const p = petById(ch, uid); if (!p) return; name = String(name || '').trim().slice(0, 16); if (PROFANITY.some(w => name.toLowerCase().includes(w))) { toast('Pick a different name.'); return; } p.name = name; secretPetName(name); dirty = true; }
function releasePet(uid) { if (ch.petActive === uid) ch.petActive = null; ch.petSupport = ch.petSupport.filter(u => u !== uid); ch.daycare = ch.daycare.filter(d => d.uid !== uid); ch.pets = ch.pets.filter(p => p.uid !== uid); dirty = true; }

// ---------- Discovery pop-ups (v0.9b) ----------
let discQ = [];
function discover(kind, title, text, tabName, petSp) {
  if (account && account.settings && account.settings.discOff) return;
  discQ.push({ kind, title, text, tabName, petSp }); setTimeout(showDiscover, 50);
}
function showDiscover() {
  if (typeof document === 'undefined' || document.getElementById('disc') || !discQ.length || screen !== 'game') return;
  const d = discQ.shift(), m = document.createElement('div');
  m.className = 'modal discover'; m.id = 'disc';
  m.innerHTML = `<div class="card discard" role="dialog" aria-modal="true" aria-labelledby="disct"><div class="disckind">✦ ${esc(d.kind)} ✦</div>${d.petSp && typeof petGlyph === 'function' ? `<div style="text-align:center">${petGlyph(d.petSp, 88)}</div>` : ''}<h3 id="disct">${esc(d.title)}</h3><p>${esc(d.text)}</p>
    <div class="row" style="justify-content:center;margin-top:12px">${d.tabName ? `<button data-act="discgo" data-arg="${esc(d.tabName)}">Go to ${esc(d.tabName)}</button>` : ''}<button class="pri" data-act="discclose">Close</button></div>${discQ.length ? `<p class="mute" style="text-align:center;margin:8px 0 0;font-size:13px">${discQ.length} more discover${discQ.length > 1 ? 'ies' : 'y'} waiting · <button class="linkbtn" data-act="discall">Close all</button></p>` : ''}</div>`;
  document.body.appendChild(m); const b = m.querySelector('button.pri'); if (b) b.focus();
  if (!account.settings.reduced) chime(659, 988);
}
