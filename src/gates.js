// ============================================================
// v2.5 — Unlocks by progression + a step-by-step guided tutorial.
// New characters start with Home, their two starting skills, Quests,
// Inventory, Character, Shop and Settings. Everything else opens as
// they progress (shown greyed out with a lock until then).
// Characters made before v2.5 keep everything unlocked (c.gate.all).
// ============================================================

// Each tab: a list of alternatives; each alternative is a list of conditions
// that must all be met. ['lvl', n] character level · ['sk', skill, n] skill level · ['quest'] starter quests done.
const GATES = {
  mining: [[['sk', 'woodcutting', 5]], [['lvl', 5]]],
  woodcutting: [[['sk', 'mining', 5]], [['lvl', 5]]],
  farming: [[['sk', 'woodcutting', 5]], [['lvl', 8]]],
  fishing: [[['sk', 'farming', 5]], [['lvl', 10]]],
  herbalism: [[['sk', 'farming', 10]], [['lvl', 12]]],
  skinning: [[['sk', 'woodcutting', 10]], [['lvl', 15]]],
  blacksmithing: [[['sk', 'mining', 10]]],
  cooking: [[['sk', 'farming', 10], ['sk', 'fishing', 10]]],
  alchemy: [[['sk', 'herbalism', 10]]],
  tailoring: [[['sk', 'skinning', 10]]],
  jewelcrafting: [[['sk', 'blacksmithing', 15]]],
  enchanting: [[['sk', 'mining', 20], ['sk', 'herbalism', 20]]],
  combat: [[['lvl', 5]]], prof: [[['lvl', 5]]], map: [[['quest']]], pets: [[['quest']]], bank: [[['lvl', 8]]],
  class: [[['lvl', 10]]], talents: [[['lvl', 10]]], training: [[['lvl', 10]]],
  wardrobe: [[['lvl', 12]]], arsenal: [[['lvl', 12]]], collection: [[['lvl', 12]]], titles: [[['lvl', 12]]], ach: [[['lvl', 12]]], showcase: [[['lvl', 12]]],
  companions: [[['lvl', 15]]], auction: [[['lvl', 15]]], trade: [[['lvl', 15]]], friends: [[['lvl', 15]]], chat: [[['lvl', 15]]],
  guild: [[['lvl', 20]]], casino: [[['lvl', 20]]],
  events: [[['lvl', 3]]], games: [[['lvl', 3]]], leaders: [[['lvl', 5]]], secrets: [[['lvl', 10]]],
  dungeons: [[['lvl', 50]]], arena: [[['lvl', 55]]],
};
const GATE_WHY = {
  blacksmithing: 'Smiths melt ore from Mining (and use wood from Woodcutting).', cooking: 'Cooks need crops from Farming and fish from Fishing.',
  alchemy: 'Potions are brewed from Herbalism plants.', tailoring: 'Tailors work hides from Skinning.', jewelcrafting: 'Jewellers set gems in metal from Blacksmithing.',
  enchanting: 'Enchanting binds crystals from Mining with herbs from Herbalism.', dungeons: 'Dungeons are tough. Grow strong first; there is plenty to explore before then.',
  arena: 'The Arena pits you against other players’ heroes.', map: 'Finish your first quests to open the world map.', pets: 'Finish your first quests to earn a starter egg.',
};
const GATE_ALWAYS = new Set(['home', 'quests', 'inv', 'char', 'shop', 'settings', 'account', 'cloud', 'debug', 'lore', 'mail']);
const tabName = id => { for (const [, items] of NAV) for (const [i, n] of items) if (i === id) return n; return SKILLS[id] ? SKILLS[id].name : id; };
const gateCondMet = (c, [k, a, b]) => k === 'lvl' ? c.level >= a : k === 'sk' ? !!(c.skills[a] && c.skills[a].level >= b) : k === 'quest' ? !!(c.quest && c.quest.done) : false;
// Tabs the starter quests need open at each step (starting skills from the very start).
function gateStarter(c, id) {
  const t = TUTORIALS[c.region]; if (!t || !c.quest) return false;
  const st = c.quest.done ? 99 : c.quest.step;
  if (id === ACT(t.res1).skill || id === ACT(t.res2).skill) return true;
  if (st >= 5 && RECIPE[t.craft] && id === RECIPE[t.craft].skill) return true;
  if (st >= 8 && id === 'combat') return true;
  return false;
}
function tabOpen(id, c) {
  c = c || ch; if (!c || !c.gate || c.gate.all || GATE_ALWAYS.has(id)) return true;
  if (c.gate.open && c.gate.open[id]) return true;
  if (gateStarter(c, id)) return true;
  if (SKILLS[id] && c.skills[id] && (c.skills[id].level > 1 || c.skills[id].xp > 0)) return true;
  const g = GATES[id]; if (!g) return true;
  return g.some(alt => alt.every(cond => gateCondMet(c, cond)));
}
// The skill tab an action belongs to (gathering/crafting skill, combat, map, training).
const actTab = a => a.kind === 'combat' ? 'combat' : a.skill === 'exploration' ? 'map' : a.skill === 'training' || a.kind === 'training' ? 'training' : a.skill;
const condText = ([k, a, b]) => k === 'lvl' ? `level ${a}` : k === 'sk' ? `${SKILLS[a].name} level ${b}` : 'finishing your first 10 quests';
function gateText(id) { const g = GATES[id]; if (!g) return ''; return g.map(alt => alt.map(condText).join(' and ')).join(', or '); }
// The alternative you're closest to, for the progress bars.
function gateBest(id) {
  const g = GATES[id] || [];
  const score = alt => alt.reduce((s, cd) => s + Math.min(1, cd[0] === 'lvl' ? ch.level / cd[1] : cd[0] === 'sk' ? ch.skills[cd[1]].level / cd[2] : ch.quest.done ? 1 : ch.quest.step / 10), 0) / alt.length;
  return g.slice().sort((a, b) => score(b) - score(a))[0] || [];
}

// How far an alternative is (0 = met), for 'next unlock' hints.
const gateNear = alt => alt.reduce((s, cd) => s + Math.max(0, cd[0] === 'lvl' ? cd[1] - ch.level : cd[0] === 'sk' ? cd[2] - ch.skills[cd[1]].level : ch.quest.done ? 0 : 10 - ch.quest.step), 0);

// Newly opened tabs: remembered, logged, a NEW badge until visited.
function gateTick(quiet) {
  if (!ch || !ch.gate || ch.gate.all) return;
  const g = ch.gate; g.open = g.open || {}; g.fresh = g.fresh || {};
  const got = [];
  for (const [, items] of NAV) for (const [id] of items) {
    if (g.open[id] || GATE_ALWAYS.has(id)) continue;
    if (tabOpen(id)) { g.open[id] = Date.now(); if (!gateStarter(ch, id) || ch.quest.step > 0) { g.fresh[id] = 1; got.push(id); } }
  }
  if (!got.length) return;
  for (const id of got) addLog('level', `Unlocked: ${tabName(id)}.`);
  if (!quiet && screen === 'game') { toast(`🔓 <b>Unlocked:</b> ${got.map(id => esc(tabName(id))).join(', ')}`, 'gold'); renderNav(); }
  save();
}
setInterval(() => { try { if (typeof screen !== 'undefined' && screen === 'game') gateTick(false); } catch (e) { } }, 1000);
const gateFreshSeen = id => { if (ch && ch.gate && ch.gate.fresh && ch.gate.fresh[id]) { delete ch.gate.fresh[id]; } };

// Nav decorations
function navLockAttr(id) { return tabOpen(id) ? '' : ` class="locked" title="${esc('Unlocks at ' + gateText(id))}"`; }
function navLockIco(id) { return tabOpen(id) ? '' : '<span class="lockico" aria-label="locked">🔒</span>'; }
function navNew(id) { return ch && ch.gate && ch.gate.fresh && ch.gate.fresh[id] ? ' <span class="newb">NEW</span>' : ''; }

// The page shown for a locked tab.
function tabLocked(id) {
  const best = gateBest(id);
  const bars = best.map(cd => {
    const [k, a, b] = cd, have = k === 'lvl' ? ch.level : k === 'sk' ? ch.skills[a].level : ch.quest.done ? 10 : ch.quest.step, need = k === 'lvl' ? a : k === 'sk' ? b : 10;
    const label = k === 'lvl' ? 'Character level' : k === 'sk' ? `${SKILLS[a].name} level` : 'First quests';
    const go = k === 'sk' && tabOpen(a) ? `<button class="sm" data-act="tab" data-arg="${a}">Go to ${esc(SKILLS[a].name)}</button>` : k === 'quest' ? `<button class="sm" data-act="tab" data-arg="quests">Go to Quests</button>` : '';
    return `<div style="margin:10px 0"><div class="spread" style="font-size:14px"><span>${label}</span><span class="num">${Math.min(have, need)} / ${need}</span></div><div class="bar"><i style="width:${Math.min(100, have / need * 100)}%"></i></div>${go ? `<div style="margin-top:6px">${go}</div>` : ''}</div>`;
  }).join('');
  return `<div class="card lockpage" style="max-width:560px"><div class="lockbig" aria-hidden="true">🔒</div><h2 style="margin:4px 0">${esc(tabName(id))}</h2>
    <p style="margin:0 0 6px">Unlocks at <b>${esc(gateText(id))}</b>.</p>${GATE_WHY[id] ? `<p class="mute" style="margin:0 0 6px;font-size:14px">${esc(GATE_WHY[id])}</p>` : ''}${bars}</div>`;
}

// ============================================================
// Guided tutorial ("coach"): short lessons that fire at the right moment.
// During a lesson you must click the highlighted thing to go on (other
// clicks are blocked); "Skip tutorial" turns it all off.
// ============================================================
const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
const q1 = sel => { for (const el of document.querySelectorAll(sel)) if (vis(el)) return el; return null; };
// Where to click to reach a tab: the side menu, a collapsed group, the phone sheet or the phone bottom bar.
function navTarget(id) {
  const n = q1(`#nav [data-act=tab][data-arg="${id}"]`); if (n) return n;
  const s = q1(`.modal [data-act=bgo][data-arg="${id}"]`); if (s) return s;
  if (vis(document.getElementById('nav'))) { for (const [g, items] of NAV) if (items.some(([i]) => i === id)) { const h = q1(`#nav [data-act=navgrp][data-arg="${g}"]`); if (h) return h; } }
  return q1(`#bnav [data-arg="${navGroupOf(id)}"]`);
}
const tutT = () => TUTORIALS[ch.region];
const nm = id => ACT(id) ? ACT(id).name : ITEM(id).name;
const goTab = (id, h, p) => ({ h, p, target: () => navTarget(id), done: () => tab === id });
const COACH = {
  basics: { when: () => true, steps: () => {
    const t = tutT(), s1 = ACT(t.res1).skill, s2 = ACT(t.res2).skill;
    return [
      { h: 'Welcome to Thousandfold!', p: 'This short guide shows you the basics, one step at a time. Click the highlighted thing to carry on. You can skip the tutorial at any time.', next: true },
      goTab(s1, `Open ${SKILLS[s1].name}`, `${nm(t.res1)} is gathered in ${SKILLS[s1].name}. Click it in the menu.`),
      { h: `${SKILLS[s1].verb} ${nm(t.res1)}`, p: `Click the button to start gathering ${nm(t.res1)}.`, target: () => q1(`#main [data-act=start][data-arg="${t.res1}"]`), done: () => ch.actions.some(a => a.res === t.res1) },
      { h: 'It keeps going on its own', p: 'Your hero gathers by themself, even while the game is closed. Each running action uses 1 stamina (the boxes here). You start with 2 stamina, so you can run 2 things at once.', target: () => q1('#act .pips, #homeact, #act'), next: true },
      goTab(s2, `Open ${SKILLS[s2].name}`, `Use your second stamina point. ${nm(t.res2)} comes from ${SKILLS[s2].name}.`),
      { h: `${SKILLS[s2].verb} ${nm(t.res2)}`, p: 'Two actions now run side by side.', target: () => q1(`#main [data-act=start][data-arg="${t.res2}"]`), done: () => ch.actions.some(a => a.res === t.res2) },
      { h: 'How to get more stamina', p: 'More stamina means more actions at once. Dexterity (DEX) gives it: +1 stamina for every 10 DEX up to 100, then +1 for every 20 DEX up to 200. DEX can give up to 16. On top of that, each class advance adds +5, and some talents, perks and meals add more. Tip: early on, put your stat points into DEX until you reach the cap. It is the fastest way to grow.', next: true },
      goTab('quests', 'Your quests', 'Open Quests to see what to do next.'),
      { h: 'Follow the quests', p: 'These 10 quests teach the game and give a permanent stat point each. Finish them to open the world map. Other sections unlock as you grow: locked ones show a 🔒 and what they need.', target: () => q1('#main .card.quest.cur, #main .card'), next: true },
    ];
  } },
  stats: { when: () => ch.unspent > 0 && ch.level >= 2, steps: () => [
    goTab('char', 'You have stat points', 'You levelled up! Open Character to spend your stat points.'),
    { h: 'Put points into DEX', p: 'DEX raises your stamina so you can run more actions at once. Add points to DEX.', target: () => q1('#main [data-act=pend][data-arg="DEX|5"]') || q1('#main [data-act=pend][data-arg="DEX|1"]'), done: () => (pend.DEX || 0) > 0 || (ch.alloc.DEX || 0) > 0 },
    { h: 'Confirm', p: 'Click Apply to keep your choice.', target: () => q1('#main [data-act=apply]'), done: () => (ch.alloc.DEX || 0) > 0 },
    { h: 'Nice!', p: 'Keep doing this every level until your stamina reaches 16. A new stamina box appears each time DEX crosses the next step.', target: () => q1('#act .pips'), next: true },
  ] },
  sell: { when: () => !ch.quest.done && ch.quest.step === 3, base: () => ch.counters.goldEarned, steps: b => [
    goTab('inv', 'Time to earn some gold', 'Open your Inventory to sell what you gathered.'),
    { h: 'Sell', p: `Sell your ${nm(tutT().res1)} (or anything else) for gold.`, target: () => q1(`#main [data-act=sell][data-arg="${tutT().res1}|all"]`) || q1('#main [data-act=sell]'), done: () => ch.counters.goldEarned > b },
  ] },
  buy: { when: () => !ch.quest.done && ch.quest.step === 4, base: () => ch.counters.shopBuys, steps: b => [
    goTab('shop', 'Visit the shop', `Buy ${ITEM(tutT().buy).name} at the shop.`),
    { h: `Buy ${ITEM(tutT().buy).name}`, p: 'Click to buy one.', target: () => q1(`#main [data-act=buy][data-arg^="${tutT().buy}|"]`), done: () => ch.counters.shopBuys > b },
  ] },
  craft: { when: () => !ch.quest.done && ch.quest.step === 5, steps: () => { const r = RECIPE[tutT().craft]; return [
    goTab(r.skill, `${SKILLS[r.skill].name} unlocked`, `Crafting turns resources into useful things. Open ${SKILLS[r.skill].name}.`),
    { h: `Make ${r.name}`, p: 'Crafting runs on its own like gathering, as long as you have the materials.', target: () => q1(`#main [data-act=start][data-arg="${r.id}"]`), done: () => ch.actions.some(a => a.res === r.id) || (ch.prof[r.id] || 0) > 0 },
  ]; } },
  eat: { when: () => !ch.quest.done && ch.quest.step === 6, base: () => ch.counters.potions, steps: b => [
    goTab('inv', 'Food and potions', 'Meals and potions give you a boost for a while. Open your Inventory.'),
    { h: 'Use one', p: 'Eat a meal or drink a potion.', target: () => q1('#main [data-act=drink]'), done: () => ch.counters.potions > b },
  ] },
  fight: { when: () => !ch.quest.done && ch.quest.step === 8, steps: () => { const e = 'e_' + tutT().e1; return [
    goTab('combat', 'Combat unlocked', 'Fights also run on their own. Open Combat.'),
    { h: `Fight ${ENEMY_BY[e].name}`, p: 'Keep your combat power above the enemy’s recommended power. Food helps you heal.', target: () => q1(`#main [data-act=start][data-arg="${e}"]`), done: () => ch.actions.some(a => a.res === e) || (ch.prof[e] || 0) > 0 },
  ]; } },
  map: { when: () => ch.quest.done, steps: () => [
    goTab('map', 'The world is open!', 'You finished your first quests. Open the Map to travel to new regions.'),
    { h: 'Travel and explore', p: 'Each region has new resources, enemies and quests. That’s the end of the tutorial: have fun! New sections keep unlocking as you grow.', next: true },
  ] },
};
const COACH_ORDER = ['basics', 'stats', 'sell', 'buy', 'craft', 'eat', 'fight', 'map'];
let coachCur = null; // { id, i, steps, key }
function coachOn() { return !!(ch && ch.coach && ch.coach.on && screen === 'game'); }
function coachPick() {
  const c = ch.coach; c.done = c.done || {};
  for (const id of COACH_ORDER) if (!c.done[id] && COACH[id].when()) { const base = COACH[id].base ? COACH[id].base() : 0; return { id, i: 0, steps: COACH[id].steps(base) }; }
  return null;
}
function coachStep() { return coachCur && coachCur.steps[coachCur.i]; }
function coachAdvance() {
  if (!coachCur) return; coachCur.i++; coachCur.key = '';
  if (coachCur.i >= coachCur.steps.length) { ch.coach.done[coachCur.id] = 1; coachCur = null; save(); if (COACH_ORDER.every(id => ch.coach.done[id])) { ch.coach.on = false; } }
}
function coachSkip() { if (!ch) return; ch.coach = { on: false, done: ch.coach ? ch.coach.done : {} }; coachCur = null; coachHide(); save(); toast('Tutorial off. You can restart it from Settings.'); }
function coachHide() { const s = document.getElementById('coachspot'); if (s) s.remove(); const b = document.getElementById('coachbox'); if (b) b.remove(); }
function coachTick() {
  if (!coachOn()) { if (coachCur) coachCur = null; coachHide(); return; }
  if (!coachCur) coachCur = coachPick();
  if (!coachCur) { coachHide(); return; }
  let s = coachStep();
  // Steps already done skip themselves (e.g. you opened the tab on your own).
  let guard = 0; while (s && !s.next && s.done && s.done() && guard++ < 10) { coachAdvance(); s = coachStep(); }
  if (!s) { coachHide(); return; }
  const el = s.target ? s.target() : null;
  // Box
  let box = document.getElementById('coachbox');
  if (!box) { box = document.createElement('div'); box.id = 'coachbox'; box.className = 'coachbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const key = coachCur.id + ':' + coachCur.i;
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = `<div class="spread"><span class="mute" style="font-size:12px">Tutorial</span><button class="sm ghost" data-act="coachskip">Skip tutorial</button></div>
      <h3 style="margin:2px 0 4px">${esc(s.h)}</h3><p style="margin:0;font-size:15px">${esc(s.p)}</p>
      ${s.next ? `<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="sm pri" data-act="coachnext">Got it</button></div>` : `<p class="mute" style="margin:8px 0 0;font-size:13px">${el ? '👉 Click the highlighted button.' : 'Follow the step above.'}</p>`}`;
  }
  coachTarget = el; coachNext = !!s.next;
  if (el && !s.next) { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } } }
  coachPlace();
  if (!s.next && s.done && s.done()) coachAdvance();
}
// Spotlight follows its target every frame (scrolling, re-renders).
let coachTarget = null, coachNext = false;
function coachPlace() {
  let sp = document.getElementById('coachspot'); const el = coachTarget, box = document.getElementById('coachbox');
  if (!el || !document.body.contains(el) || !coachCur) { if (sp) sp.remove(); return; }
  if (!sp) { sp = document.createElement('div'); sp.id = 'coachspot'; sp.className = 'coachspot'; document.body.appendChild(sp); }
  const r = el.getBoundingClientRect(), pad = 6;
  sp.style.left = r.left - pad + 'px'; sp.style.top = r.top - pad + 'px'; sp.style.width = r.width + pad * 2 + 'px'; sp.style.height = r.height + pad * 2 + 'px';
  sp.classList.toggle('soft', coachNext);
  if (box) { const br = box.getBoundingClientRect(); if (!(r.right < br.left || r.left > br.right || r.bottom < br.top || r.top > br.bottom)) box.classList.toggle('attop', r.top > innerHeight / 2); }
}
(function coachRaf() { try { if (coachCur) coachPlace(); } catch (e) { } requestAnimationFrame(coachRaf); })();
setInterval(() => { try { coachTick(); } catch (e) { console.warn(e); } }, 150);
// Forced clicks: while a click-step is shown, only the highlighted target (and the tutorial box, and pop-up sheets) take clicks.
document.addEventListener('click', e => {
  if (!coachOn() || !coachCur) return;
  const s = coachStep(); if (!s) return;
  if (e.target.closest('#coachbox')) return;
  if (s.next) { e.preventDefault(); e.stopPropagation(); return; }
  const el = s.target && s.target(); if (!el) return;
  if (el.contains(e.target)) return;
  if (e.target.closest('.modal') && !e.target.closest('.modal.sheet')) return; // other dialogs (e.g. cloud save) still work
  e.preventDefault(); e.stopPropagation();
  const sp = document.getElementById('coachspot'); if (sp) { sp.classList.remove('nudge'); void sp.offsetWidth; sp.classList.add('nudge'); }
}, true);
const GATE_HANDLERS = {
  coachnext: () => { coachAdvance(); coachTick(); },
  coachskip: () => coachSkip(),
  coachrestart: () => { ch.coach = { on: true, done: {} }; coachCur = null; save(); HANDLERS.tab('home'); toast('Tutorial restarted.'); },
};
