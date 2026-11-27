// ============================================================
// LOOT (v2.0) — gear grades with random affixes, gear drops,
// dungeons (Normal / Heroic / Mythic), loot chests with visible
// odds, a pity counter and opening animations, and treasure maps.
// In-game currency only, never real money.
// ============================================================
const GRADE_COLORS = ['#b9b2a8', '#4f9bff', '#b273ff', '#ff8f2e', '#ff4f7a'];
const gradeChip = g => `<span class="chip gradechip" style="color:${GRADE_COLORS[g]};border-color:${GRADE_COLORS[g]}">${GRADES[g]}</span>`;
// Affix pool: S = stat points, M = modifier (base share at Rare).
const AFFIX_POOL = [
  ...['STR', 'DEX', 'INT', 'VIT', 'AGI', 'LUCK', 'PER', 'WIS', 'CHARM'].map(s => ['S', s]),
  ['M', 'atk', 0.04], ['M', 'hp', 0.04], ['M', 'def', 0.05], ['M', 'crit', 0.01], ['M', 'critDmg', 0.06], ['M', 'dodge', 0.008], ['M', 'lifesteal', 0.006],
  ['M', 'xp', 0.03], ['M', 'gyield', 0.03], ['M', 'cyield', 0.03], ['M', 'gold', 0.05], ['M', 'loot', 0.04], ['M', 'luckStrike', 0.004], ['M', 'regen', 0.05], ['M', 'fightSpeed', 0.03],
];
// Grade odds in percent: [Common, Rare, Epic, Legendary, Mythic].
const GRADE_ODDS = {
  craft: [85, 12, 2.6, 0.38, 0.02], kill: [60, 28, 9, 2.6, 0.4],
  dg0: [55, 30, 12, 2.7, 0.3], dg1: [25, 40, 25, 8.5, 1.5], dg2: [0, 30, 40, 25, 5],
  chest_wood: [60, 30, 8, 1.8, 0.2], chest_iron: [35, 40, 18, 6, 1], chest_gold: [0, 45, 35, 17, 3], chest_myth: [0, 0, 50, 40, 10],
};
const CRAFT_QUALITY_BOOST = [0.6, 1, 1.4, 2, 3];
function rollGrade(odds, boost) {
  const w = odds.map((p, i) => i ? p * (boost || 1) : p), tot = w.reduce((a, b) => a + b, 0); let r = rng() * tot;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return 0;
}
function rollAffixes(grade, L) {
  const picks = [], pool = AFFIX_POOL.slice();
  for (let i = 0; i < grade && pool.length; i++) {
    const [t, id, base] = pool.splice(Math.floor(rng() * pool.length), 1)[0], r = 0.6 + 0.4 * rng();
    const v = t === 'S' ? Math.max(1, Math.round((2 + L * 0.3) * r * (1 + 0.25 * grade))) : Math.max(1, Math.round(base * 1000 * r * (1 + 0.5 * grade)));
    picks.push(t + id + v);
  }
  let s = picks.join('-'); while (s.length > 30 && picks.length > 1) { picks.pop(); s = picks.join('-'); }
  return s;
}
function makeGraded(base, q, grade) {
  if (!grade) return gkey(base, q, 0);
  return gkeyX(base, q, 0, grade, rollAffixes(grade, (GEAR[base] && GEAR[base].lvl) || 1));
}
// Equipped affix modifiers feed classMods.
function gearAffixMods(ch, M) {
  for (const k of Object.values(ch.equip.slots)) { if (!k || k.split(':').length < 6) continue; const it = ITEM(k); if (it.mods) addMods(M, it.mods, 1); }
}
// Gear bases that can drop: crafted armour, weapons and jewellery (no tools, uniques or special weapons).
let DROP_BASES = null;
function dropBases() {
  if (!DROP_BASES) DROP_BASES = RECIPES.filter(r => r.gearOut && GEAR[r.out] && GEAR[r.out].slot !== 'tool').map(r => r.out).filter((b, i, a) => a.indexOf(b) === i && !GEAR[b].unique && !GEAR[b].ego && !GEAR[b].growth);
  return DROP_BASES;
}
function pickBase(maxL) {
  const all = dropBases(), ok = all.filter(b => (GEAR[b].lvl || 1) <= maxL); if (!ok.length) return all[0];
  const top = Math.max(...ok.map(b => GEAR[b].lvl || 1)), near = ok.filter(b => (GEAR[b].lvl || 1) >= top - 12);
  return near[Math.floor(rng() * near.length)];
}
function rollDrop(oddsKey, maxL, forceMin) {
  let grade = rollGrade(GRADE_ODDS[oddsKey]); if (forceMin != null) grade = Math.max(grade, forceMin);
  const base = pickBase(maxL), q = 1 + (rng() < 0.3 ? 1 : 0);
  return { key: makeGraded(base, q, grade), grade };
}
function announceGear(key, quiet, notes, src) {
  const it = ITEM(key); if (!it.grade) return;
  ch.counters.gradedFound = (ch.counters.gradedFound || 0) + 1;
  if (it.grade >= 4) ch.counters.mythicGear = (ch.counters.mythicGear || 0) + 1;
  if (it.grade >= 3) ch.counters.legendGear = (ch.counters.legendGear || 0) + 1;
  const msg = `${src}: ${it.name} (${GRADES[it.grade]}).`;
  if (quiet) { if (notes) notes.push(msg); return; }
  addLog(it.grade >= 3 ? 'lucky' : 'sys', msg);
  if (it.grade >= 3) { toast(`<b style="color:${GRADE_COLORS[it.grade]}">${GRADES[it.grade]}!</b> ${esc(it.name)}`, 'gold'); chime(988, 1480); }
}
// Crafted gear: each item rolls a grade (better quality, better odds). Below the keep setting it stays a plain stackable item.
function addCraftOut(k, q, quiet, notes) {
  if (!k.startsWith('g:') || ITEM(k).slot === 'tool' || q <= 0) { addItem(k, q, true); return; }
  const { base, q: ql } = parseG(k), keep = account.settings.gearKeep == null ? 1 : +account.settings.gearKeep;
  let plain = 0;
  for (let i = 0; i < q; i++) {
    const g = rollGrade(GRADE_ODDS.craft, CRAFT_QUALITY_BOOST[ql] || 1);
    if (!g || g < keep) { plain++; continue; }
    const key = makeGraded(base, ql, g);
    // Bag full: sell it on the spot instead of overfilling (each graded piece takes its own slot).
    if (!ch.inv[key] && usedSlots() >= ch.invSlots) { addItem(key, 1, true); craftOverflow.gold += sellN(key, 1); craftOverflow.n++; continue; }
    addItem(key, 1, true); announceGear(key, quiet, notes, 'Crafted');
  }
  if (plain) addItem(k, plain, true);
  if (craftOverflow.n && Date.now() - craftOverflow.at > 60000) craftOverflowFlush(quiet, notes);
}
// Gear sold because the bag was full: reported at most once a minute.
const craftOverflow = { n: 0, gold: 0, at: 0 };
function craftOverflowFlush(quiet, notes) {
  if (!craftOverflow.n) return;
  const msg = `Bag full: sold ${N(craftOverflow.n)} crafted gear for ${N(craftOverflow.gold)} gold.`;
  if (notes) notes.push(msg); else addLog('sys', msg);
  craftOverflow.n = 0; craftOverflow.gold = 0; craftOverflow.at = Date.now();
}
// Monster kills: a small chance of a graded drop.
function killGearDrop(e, n, quiet, notes) {
  const ch0 = e.boss ? 0.03 : e.role === 'hidden' ? 0.01 : 0.003, drops = Math.min(40, probRound(n * ch0, rng));
  for (let i = 0; i < drops; i++) {
    const d = rollDrop('kill', Math.max(1, e.level)); if (!d.grade) continue;
    addItem(d.key, 1, true); announceGear(d.key, quiet, notes, `${e.name} dropped`);
  }
}

// ---------- Loot chests ----------
const CHESTS = {
  chest_wood: { name: 'Wooden Chest', color: '#a8744a', band: '#5e3b22', gear: [1, 1], gold: 2, wardrobe: 0.02, dupe: 2, pity: 40, cost: 1500 },
  chest_iron: { name: 'Iron Chest', color: '#8a909c', band: '#4a4f5a', gear: [1, 2], gold: 5, wardrobe: 0.05, dupe: 4, pity: 25, cost: 12000 },
  chest_gold: { name: 'Gilded Chest', color: '#e8c15a', band: '#a8822e', gear: [2, 2], gold: 12, wardrobe: 0.1, dupe: 8, pity: 15 },
  chest_myth: { name: 'Mythic Chest', color: '#ff4f7a', band: '#7a2a4a', gear: [3, 3], gold: 30, wardrobe: 0.25, dupe: 15, pity: 6 },
};
for (const [id, c] of Object.entries(CHESTS)) ITEMS[id] = { name: c.name, type: 'chest', rarity: { chest_wood: 1, chest_iron: 2, chest_gold: 4, chest_myth: 5 }[id], cost: c.cost, value: Math.round((c.cost || 30000) / 8), desc: `Open it for gear (${c.gear[0] === c.gear[1] ? c.gear[0] : c.gear[0] + '–' + c.gear[1]} piece${c.gear[1] > 1 ? 's' : ''}), gold and a chance of a chest-only Wardrobe piece. Guaranteed Legendary or better within ${c.pity} opens.` };
ITEMS.treasure_map = { name: 'Treasure Map', type: 'map', rarity: 2, value: 50, desc: 'An X marks a spot somewhere in this region. Dig it up for a chest.' };
SHARD_SHOP.push({ key: 'chest_gold', price: 20 });
SHOP.chests = ['chest_wood', 'chest_iron'];
// Chest-only Wardrobe pieces (duplicates turn into Thousandium).
FASHIONS.push(
  F('hat_mimic', 'hat', 'Mimic Hat', 'mimic', { chest: 1 }), F('hat_goldcrown', 'hat', 'Treasure Crown', 'crown', { chest: 1 }),
  F('out_pirate', 'outfit', 'Pirate Garb', ['#2a2a34', '#e8c15a', false], { chest: 1 }), F('out_dragon', 'outfit', 'Dragonscale Mail', ['#3a7a4a', '#ffd36b', false], { chest: 1 }),
  F('cape_treasure', 'cape', 'Treasure Cape', '#c0302a', { chest: 1 }), F('cape_abyss', 'cape', 'Abyss Cape', '#140c2a', { chest: 1 }),
  F('prop_key', 'prop', 'Golden Key', 'goldkey', { chest: 1 }), F('hair_gold', 'hair', 'Gilded', '#ffd36b', { chest: 1 }),
);
for (const f of FASHIONS.slice(-8)) FASHION_BY[f.id] = f;
const CHEST_WARDROBE = FASHIONS.filter(f => f.src.chest).map(f => f.id);
ACHIEVEMENTS.push(
  { id: 'chest_1', cat: 'Collection', name: 'Ooh, Shiny', desc: 'Open a loot chest.', pts: 10, goal: 1, stat: 'chests' },
  { id: 'chest_50', cat: 'Collection', name: 'Treasure Hunter', desc: 'Open 50 loot chests.', pts: 25, goal: 50, stat: 'chests' },
  { id: 'gear_leg', cat: 'Collection', name: 'Legendary!', desc: 'Find a Legendary item.', pts: 15, goal: 1, stat: 'legendGear' },
  { id: 'gear_myth', cat: 'Collection', name: 'Mythic!', desc: 'Find a Mythic item.', pts: 25, goal: 1, stat: 'mythicGear' },
  { id: 'dg_n', cat: 'Combat', name: 'Delver', desc: 'Clear a Normal dungeon.', pts: 10, goal: 1, stat: 'dgNormal' },
  { id: 'dg_h', cat: 'Combat', name: 'Heroic Delver', desc: 'Clear a Heroic dungeon.', pts: 25, goal: 1, stat: 'dgHeroic' },
  { id: 'dg_m', cat: 'Combat', name: 'Mythic Delver', desc: 'Clear a Mythic dungeon.', pts: 50, goal: 1, stat: 'dgMythic' },
);
const chestOdds = id => GRADE_ODDS[id].map((p, i) => [GRADES[i], p]).filter(([, p]) => p > 0);
function openChest(id) {
  const C = CHESTS[id]; if (!C || !(ch.inv[id] > 0)) return null;
  takeItem(id, 1); account.chestPity = account.chestPity || {}; const pity = (account.chestPity[id] || 0) + 1;
  const n = C.gear[0] + Math.floor(rng() * (C.gear[1] - C.gear[0] + 1)), maxL = Math.max(1, gateLevel(ch)), got = [];
  let best = 0;
  for (let i = 0; i < n; i++) {
    const force = i === 0 && pity >= C.pity ? 3 : null, d = rollDrop(id, maxL, force);
    addItem(d.key, 1, true); got.push({ key: d.key, grade: d.grade }); best = Math.max(best, d.grade); announceGear(d.key, true, null, 'Chest');
  }
  account.chestPity[id] = best >= 3 ? 0 : pity;
  const gold = Math.round(scaled(ch, 40 * C.gold, 1) * (0.7 + 0.6 * rng())); ch.gold += gold; ch.counters.goldEarned += gold;
  const extra = [];
  if (rng() < C.wardrobe) {
    const f = CHEST_WARDROBE[Math.floor(rng() * CHEST_WARDROBE.length)]; account.chestWardrobe = account.chestWardrobe || {};
    if (account.chestWardrobe[f]) { account.shards += C.dupe; extra.push({ text: `${FASHION_BY[f].name} (duplicate) → +${C.dupe} Thousandium`, cls: 'dupe' }); }
    else { account.chestWardrobe[f] = Date.now(); extra.push({ text: `New Wardrobe piece: ${FASHION_BY[f].name}!`, cls: 'ward' }); }
  }
  if (rng() < 0.25) { const st = maxL < 30 ? 'lesser_stone' : maxL < 55 ? 'greater_stone' : maxL < 80 ? 'grand_stone' : 'mythic_stone'; addItem(st, 1, true); extra.push({ key: st }); }
  ch.counters.chests = (ch.counters.chests || 0) + 1;
  addLog('lucky', `Opened ${C.name}: ${got.map(g => ITEM(g.key).name).join(', ')}, ${N(gold)} gold${extra.length ? ', ' + extra.map(x => x.text || ITEM(x.key).name).join(', ') : ''}.`);
  checkProgress(); dirty = true; save();
  return { got, gold, extra, best, pityHit: best >= 3 && pity >= C.pity };
}
// Chest sprite (32×32), closed or open.
function chestGrid(id, open) {
  const C = CHESTS[id], g = new PxGrid(32, 32), P = pxPal(C.color), B = pxPal(C.band);
  g.rect(3, 15, 26, 14, P.a).rect(3, 26, 26, 3, P.b).rect(3, 15, 26, 1, P.c);
  if (open) { g.rect(3, 4, 26, 6, P.b).rect(3, 4, 26, 1, P.c).rect(5, 10, 22, 5, '#2a1a10'); g.rect(6, 11, 20, 3, '#ffe08a'); for (const x of [8, 14, 20, 25]) g.set(x, 9, '#fff6c0'); }
  else { g.ell(16, 13, 13, 6, P.a, null, (x, y) => y <= 15); g.rect(3, 13, 26, 2, P.b); }
  for (const x of [7, 24]) g.rect(x, open ? 15 : 8, 2, open ? 14 : 21, B.a);
  g.rect(14, open ? 16 : 13, 4, 5, '#ffd36b').set(15, open ? 18 : 15, '#2a1a10');
  return g.outline();
}
const chestImg = (id, open, size, cls) => pxImg(`ch:${id}:${open ? 1 : 0}`, size, () => chestGrid(id, open), { cls: cls || 'chibi' });
function chestModal(id) {
  const C = CHESTS[id], have = ch.inv[id] || 0, pity = (account.chestPity || {})[id] || 0;
  modal(`<div class="chestbox" data-chest="${id}"><h3>${esc(C.name)}</h3>
    <div class="chestanim" id="chestanim">${chestImg(id, false, 128, 'chibi chestclosed')}</div>
    <div id="chestloot" class="chestloot"></div>
    <div class="row" style="justify-content:center;gap:6px;margin-top:10px" id="chestctl"><button class="pri" data-act="chestopen" data-arg="${id}" ${have ? '' : 'disabled'}>Open (${N(have)} left)</button><button data-act="close">Close</button></div>
    <details style="margin-top:10px;text-align:left"><summary>Odds</summary><div class="kv" style="margin-top:6px">${chestOdds(id).map(([g, p]) => `<span>${g}</span><span>${p}% per gear piece</span>`).join('')}<span>Gear pieces</span><span>${C.gear[0] === C.gear[1] ? C.gear[0] : C.gear[0] + '–' + C.gear[1]}</span><span>Wardrobe piece</span><span>${pct(C.wardrobe)} (duplicates → ${C.dupe} Thousandium)</span><span>Enchant stone</span><span>25%</span><span>Pity</span><span>Legendary or better guaranteed by open ${C.pity} (${pity} so far)</span></div></details></div>`, 'wide');
}
function chestReveal(id) {
  const r = openChest(id); if (!r) return;
  const anim = document.getElementById('chestanim'), loot = document.getElementById('chestloot'), ctl = document.getElementById('chestctl');
  const fast = !animOn();
  const cards = [...r.got.map(g => { const it = ITEM(g.key); return `<div class="lootcard g${g.grade}" style="--gc:${GRADE_COLORS[g.grade]}">${itemIcon(g.key, 40)}<div><b style="color:${GRADE_COLORS[g.grade]}">${esc(it.name)}</b><div class="mute" style="font-size:12px">${GRADES[g.grade]} · ${esc(statLine(it))}</div></div></div>`; }),
    `<div class="lootcard"><span class="gold" style="font-size:22px">●</span><div><b class="gold">${N(r.gold)} gold</b></div></div>`,
    ...r.extra.map(x => x.key ? `<div class="lootcard">${itemIcon(x.key, 40)}<div><b>${esc(ITEM(x.key).name)}</b></div></div>` : `<div class="lootcard ${x.cls}"><span style="font-size:22px">✦</span><div><b>${esc(x.text)}</b></div></div>`)];
  if (ctl) ctl.innerHTML = '<button data-act="chestskip">Skip</button>';
  if (loot) loot.innerHTML = '';
  if (anim) { anim.classList.remove('opened'); anim.classList.add('shaking'); }
  const done = () => {
    if (anim) { anim.classList.remove('shaking'); anim.classList.add('opened'); anim.innerHTML = chestImg(id, true, 128, 'chibi') + (r.best >= 3 ? `<span class="chestglow" style="--gc:${GRADE_COLORS[r.best]}"></span>` : ''); }
    if (loot) cards.forEach((c, i) => setTimeout(() => { if (loot.isConnected) loot.insertAdjacentHTML('beforeend', c.replace('lootcard', 'lootcard in')); }, fast ? 0 : 180 * i));
    const left = ch.inv[id] || 0;
    if (ctl) setTimeout(() => { if (ctl.isConnected) ctl.innerHTML = `${r.pityHit ? '<span class="chip">Pity reward!</span>' : ''}<button class="pri" data-act="chestopen" data-arg="${id}" ${left ? '' : 'disabled'}>Open another (${N(left)} left)</button><button data-act="close">Close</button>`; }, fast ? 0 : 180 * cards.length);
    renderMain(); renderTop();
  };
  chestReveal.pending = fast ? (done(), null) : setTimeout(done, 1100);
  chestReveal.done = done;
}

// ---------- Treasure maps ----------
function digMap() {
  if (!(ch.inv.treasure_map > 0)) return;
  if (ch.travel) { toast('You need to be in a region to dig.'); return; }
  const r = REGION_BY[ch.loc], band = r.band, id = band >= 6 ? 'chest_gold' : band >= 3 ? 'chest_iron' : 'chest_wood';
  takeItem('treasure_map', 1); addItem(id, 1, true);
  const gold = Math.round(scaled(ch, 300, r.lvl)); ch.gold += gold; ch.counters.goldEarned += gold; ch.counters.digs = (ch.counters.digs || 0) + 1;
  addLog('lucky', `Followed the map in ${r.name} and dug up a ${CHESTS[id].name} and ${N(gold)} gold.`);
  toast(`X marks the spot: <b>${esc(CHESTS[id].name)}</b> and ${N(gold)} gold!`, 'gold'); chime(784, 1175);
  dirty = true; save(); chestModal(id);
}

// ---------- Dungeons ----------
const DUNGEONS = {
  emberfall: ['The Old Kiln', 'Kilnmother Ashka'], woods: ['Rootdeep Hollow', 'The Gnarled Warden'], ironpeak: ['Hammerfall Mine', 'Foreman Grudge the Golem'],
  marsh: ['The Drowned Chapel', 'Bishop Bogwater'], desert: ['Tomb of the Sun-King', 'Sun-King Razul'], frost: ['Hall of the Frozen Jarl', 'Jarl Hrimgrim'],
  void: ['The Unmade Spire', 'The Hollow Prince'], chasm: ['Heart of the World', 'The World-Eater Wyrm'],
  hell: ['The Cinder Tower', 'Baron Ashmaw'], heaven: ['The Hall of Scales', 'The First Choir'],
};
const DG_DIFF = [{ name: 'Normal', mult: 1, lvl: 0, gold: 1, chest: 'chest_iron', drop: 0.3 }, { name: 'Heroic', mult: 1.7, lvl: 10, gold: 2, chest: 'chest_gold', drop: 0.45, daily: 3 }, { name: 'Mythic', mult: 2.8, lvl: 20, gold: 4, chest: 'chest_myth', drop: 0.6, daily: 1 }];
const DG_FLOORS = [0.85, 0.95, 1.05, 1.15, 1.35];
const dgBoss = rid => ENEMIES.find(e => e.region === rid && e.role === 'boss');
const dgDay = () => new Date().toDateString();
function dgState() { ch.dgClear = ch.dgClear || {}; ch.dgDaily = ch.dgDaily && ch.dgDaily.day === dgDay() ? ch.dgDaily : { day: dgDay(), runs: {} }; return ch.dgDaily; }
function dgFloors(rid, diff) {
  const boss = dgBoss(rid), D0 = DG_DIFF[diff], foes = ENEMIES.filter(e => e.region === rid && !e.hamlet && !e.boss && (e.area === 0 || e.area === 1));
  return DG_FLOORS.map((m, i) => { const last = i === DG_FLOORS.length - 1, e = last ? null : foes[i % Math.max(1, foes.length)];
    return { name: last ? DUNGEONS[rid][1] : (D0.name === 'Normal' ? '' : D0.name + ' ') + (e ? e.name : 'Guardian'), boss: last, rec: Math.round(boss.rec * m * D0.mult), level: boss.level + D0.lvl }; });
}
function dgLock(rid, diff) {
  const r = REGION_BY[rid], boss = dgBoss(rid), st = dgState(), D0 = DG_DIFF[diff];
  if (!ch.visited[rid]) return 'Visit the region first.';
  if (!ch.bossKilled[boss.id]) return `Defeat ${boss.name} first.`;
  if (diff > 0 && !(ch.dgClear[rid] >= diff - 1)) return `Clear ${DG_DIFF[diff - 1].name} first.`;
  if (gateLevel(ch) < Math.min(99, r.lvl + D0.lvl)) return `Needs level ${Math.min(99, r.lvl + D0.lvl)}.`;
  if (D0.daily && (st.runs[rid + diff] || 0) >= D0.daily) return `Done for today (${D0.daily}/day).`;
  return null;
}
function dgStart(rid, diff) {
  if (ch.dungeon && !ch.dungeon.done) { toast('You are already in a dungeon.'); return; }
  const why = dgLock(rid, diff); if (why) { toast(esc(why)); return; }
  if (ch.travel) { toast('You are on the road.'); return; }
  if (ch.loc !== rid) { toast(`Travel to ${esc(REGION_BY[rid].name)} first.`); return; }
  for (const a of [...ch.actions]) if (ACT(a.res).kind === 'combat') stopAction(a.res);
  if (staminaUsed() + 2 > D().stamina) { toast('A dungeon needs 2 free stamina. Stop something first.'); return; }
  const cp = combatPower(D('slaying')), floors = dgFloors(rid, diff), start = Date.now(); let t = start;
  for (const f of floors) { const ratio = f.rec / Math.max(1, cp); t += Math.round((f.boss ? 60 : 40) * 1000 * clamp(Math.pow(ratio, 1.2), 0.35, 2)); f.end = t; f.win = rng() < winChance(cp, f.rec); }
  const st = dgState(); st.runs[rid + diff] = (st.runs[rid + diff] || 0) + 1;
  ch.dungeon = { rid, diff, start, floors, at: 0, cp: Math.round(cp), log: [] };
  addLog('sys', `Entered ${DUNGEONS[rid][0]} (${DG_DIFF[diff].name}).`); dirty = true; save();
}
function dgFloorRewards(f, i) {
  const dg = ch.dungeon, D0 = DG_DIFF[dg.diff], boss = dgBoss(dg.rid), out = [];
  const gold = Math.round((boss.gold[0] + boss.gold[1]) / 2 * (f.boss ? 6 : 1.5) * D0.gold); ch.gold += gold; ch.counters.goldEarned += gold; out.push(`${N(gold)} gold`);
  addXp('slaying', boss.xp * (f.boss ? 4 : 1.2) * D0.mult, true, []);
  const maxL = Math.min(gateLevel(ch), REGION_BY[dg.rid].lvl + 5 + D0.lvl);
  if (f.boss || rng() < D0.drop) { const d = rollDrop('dg' + dg.diff, maxL); addItem(d.key, 1, true); announceGear(d.key, true, null, 'Dungeon'); out.push(ITEM(d.key).name); }
  if (!f.boss && rng() < 0.15) { addItem('chest_wood', 1, true); out.push('Wooden Chest'); }
  if (f.boss) { addItem(D0.chest, 1, true); out.push(CHESTS[D0.chest].name); if (rng() < 0.1) { addItem('treasure_map', 1, true); out.push('Treasure Map'); } }
  return out;
}
function dungeonTick() {
  const dg = ch && ch.dungeon; if (!dg || dg.done) return;
  const now = Date.now();
  while (dg.at < dg.floors.length && dg.floors[dg.at].end <= now) {
    const f = dg.floors[dg.at], i = dg.at;
    if (!f.win) { dg.log.push(`Floor ${i + 1}: ${f.name} was too strong. You retreat.`); dg.done = now; dg.failed = i; break; }
    const got = dgFloorRewards(f, i); dg.log.push(`Floor ${i + 1}: beat ${f.name}. ${got.join(', ')}.`); dg.at++;
  }
  if (dg.at >= dg.floors.length && !dg.done) {
    dg.done = now; ch.dgClear[dg.rid] = Math.max(ch.dgClear[dg.rid] == null ? -1 : ch.dgClear[dg.rid], dg.diff);
    const k = ['dgNormal', 'dgHeroic', 'dgMythic'][dg.diff]; ch.counters[k] = (ch.counters[k] || 0) + 1; ch.counters.dungeons = (ch.counters.dungeons || 0) + 1;
  }
  if (dg.done) {
    const name = `${DUNGEONS[dg.rid][0]} (${DG_DIFF[dg.diff].name})`, ok = dg.failed == null;
    addLog(ok ? 'lucky' : 'sys', ok ? `Cleared ${name}!` : `Left ${name} after ${dg.failed} floor${dg.failed === 1 ? '' : 's'}.`);
    toast(ok ? `<b>Dungeon cleared!</b> ${esc(name)}` : `${esc(name)}: you retreated on floor ${dg.failed + 1}.`, ok ? 'gold' : ''); if (ok) chime(659, 1047);
    checkProgress(); dirty = true; save();
  }
  if (dg.done || dg.at) dirty = true;
}
function dgSceneFoe() { const dg = ch && ch.dungeon; if (!dg || dg.done) return null; const f = dg.floors[Math.min(dg.at, dg.floors.length - 1)]; return { id: `dg:${dg.rid}:${dg.at}`, kind: 'combat', name: f.name, boss: f.boss, level: f.level, skill: 'slaying' }; }
function tabDungeons() {
  const dg = ch.dungeon, st = dgState(), cp = Math.round(combatPower(D('slaying'))), now = Date.now();
  let run = '';
  if (dg) {
    const name = `${DUNGEONS[dg.rid][0]} · ${DG_DIFF[dg.diff].name}`, total = dg.floors[dg.floors.length - 1].end - dg.start;
    const prog = dg.done ? 1 : Math.min(1, (now - dg.start) / total);
    run = `<div class="card dgrun ${dg.done ? 'done' : ''}" style="margin-top:12px"><div class="spread"><h3>${esc(name)}</h3>${dg.done ? `<button class="sm pri" data-act="dgclose">${dg.failed == null ? 'Collect & leave' : 'Leave'}</button>` : `<span class="mute">Floor ${Math.min(dg.at + 1, 5)} of 5</span>`}</div>
      ${dg.done ? '' : '<div class="scene-slot" style="margin-top:8px"></div>'}
      <div class="bar" style="margin-top:8px"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>
      <div class="dgfloors">${dg.floors.map((f, i) => `<span class="dgf ${i < dg.at ? 'won' : dg.failed === i ? 'lost' : i === dg.at && !dg.done ? 'cur' : ''}">${f.boss ? '👑' : i + 1}</span>`).join('')}</div>
      <div class="dglog">${dg.log.map(l => `<div>${esc(l)}</div>`).join('') || '<div class="mute">Fighting through the first floor…</div>'}</div></div>`;
  }
  const cards = Object.keys(DUNGEONS).filter(rid => REGION_BY[rid]).map(rid => {
    const r = REGION_BY[rid], best = ch.dgClear && ch.dgClear[rid] != null ? ch.dgClear[rid] : -1;
    const diffs = DG_DIFF.map((D0, i) => {
      const lock = dgLock(rid, i), fl = dgFloors(rid, i), clear = fl.reduce((p, f) => p * winChance(cp, f.rec), 1), D0d = D0.daily ? ` · ${D0.daily - (st.runs[rid + i] || 0)}/${D0.daily} today` : '';
      return `<div class="dgdiff ${lock ? 'locked' : ''}"><div class="spread"><b>${D0.name}</b>${best >= i ? '<span class="verd">✓ cleared</span>' : ''}</div>
        <div class="mute" style="font-size:13px">Boss power ${N(fl[4].rec)} · clear chance <b class="${clear > 0.75 ? 'verd' : clear > 0.35 ? '' : 'bad'}">${pct(clear)}</b>${D0d}</div>
        <div class="mute" style="font-size:12px">Boss drops: ${CHESTS[D0.chest].name} + gear (${GRADE_ODDS['dg' + i].map((p, g) => p ? `${GRADES[g]} ${p}%` : '').filter(Boolean).join(', ')})</div>
        ${lock ? `<button class="sm" disabled>${esc(lock)}</button>` : `<button class="sm pri" data-act="dgstart" data-arg="${rid}|${i}" ${dg && !dg.done ? 'disabled' : ''}>${ch.loc === rid ? 'Enter' : 'Travel there first'}</button>`}</div>`;
    }).join('');
    return `<div class="card dgcard"><div class="spread"><h3>${esc(DUNGEONS[rid][0])}</h3><span class="chip">${esc(r.name)}</span></div>
      <div class="row" style="gap:10px;flex-wrap:nowrap;align-items:center;margin:6px 0">${monsterIcon({ name: DUNGEONS[rid][1], boss: true }, 52)}<div class="mute" style="font-size:14px">4 floors, then ${esc(DUNGEONS[rid][1])}. Needs 2 stamina while you’re inside. Rewards on every floor you clear, even if you retreat later.</div></div>
      <div class="dgdiffs">${diffs}</div></div>`;
  }).join('');
  const keep = account.settings.gearKeep == null ? 1 : +account.settings.gearKeep;
  return `<div class="spread"><h2>Dungeons</h2><span>Your power <b>${N(cp)}</b></span></div>
    <p class="mute" style="margin:4px 0 0">Each region has a dungeon: 4 floors and a boss, in Normal, Heroic (3 a day) and Mythic (1 a day). Beat the region’s boss to open it. Bosses always drop gear and a loot chest.</p>
    ${run}
    <div class="card" style="margin-top:12px"><div class="spread"><b>Gear grades</b><span>${[0, 1, 2, 3, 4].map(gradeChip).join(' ')}</span></div>
      <p class="mute" style="margin:6px 0 0;font-size:14px">Higher grades have stronger base stats and 1–4 random bonuses (stats, attack, crit, XP, yield, gold…). Crafted gear rolls a grade too: better quality, better odds. Keep crafted gear from <span class="row" style="display:inline-flex;gap:4px">${[0, 1, 2, 3].map(g => `<button class="chip ${keep === g ? 'on' : ''}" data-act="set" data-arg="gearKeep|${g}">${GRADES[g]}+</button>`).join('')}</span>; lower grades stack as plain items.</p></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:12px;margin-top:12px;align-items:start">${cards}</div>`;
}
const LOOT_HANDLERS = {
  dgstart: a => { const [rid, d] = a.split('|'); if (ch.loc !== rid) { goStartRegion(rid); return; } dgStart(rid, +d); renderMain(); renderActions(); },
  dgclose: () => { ch.dungeon = null; dirty = true; save(); renderMain(); renderActions(); },
  chest: id => chestModal(id),
  chestopen: id => chestReveal(id),
  chestskip: () => { if (chestReveal.pending) { clearTimeout(chestReveal.pending); chestReveal.pending = null; chestReveal.done && chestReveal.done(); } },
  dig: () => digMap(),
  sellgradeask: g => {
    const max = +g; let n = 0, gold = 0;
    for (const k of Object.keys(ch.inv)) { if (!sellableGear(k, max)) continue; n += ch.inv[k]; gold += sellPrice(k) * ch.inv[k]; }
    if (!n) { toast('No unequipped gear at that grade or lower.'); return; }
    modal(`<h3>Sell gear up to ${esc(GRADES[max])}?</h3><p>Sells <b>${N(n)}</b> unequipped piece${n === 1 ? '' : 's'} of ${GRADES.slice(0, max + 1).map(esc).join(', ')} gear for about <b>${N(Math.floor(gold))}</b> gold. Tools, uniques, special weapons and anything you have equipped are kept.</p>
      <div class="row"><button class="pri" data-act="sellgrade" data-arg="${max}">Sell ${N(n)}</button><button data-act="close">Cancel</button></div>`);
  },
  sellgrade: g => { const max = +g; let n = 0, gold0 = ch.gold; closeModal(); for (const k of Object.keys(ch.inv)) { if (!sellableGear(k, max)) continue; n += sellN(k, ch.inv[k]); } toast(n ? `Sold ${N(n)} gear for ${N(ch.gold - gold0)} gold.` : 'Nothing to sell.'); renderMain(); renderTop(); },
};
const sellableGear = (k, max) => { if (!k.startsWith('g:') || !ch.inv[k]) return false; const it = ITEM(k); return !(it.slot === 'tool' || (it.grade || 0) > max || GEAR[it.base].unique || GEAR[it.base].ego || GEAR[it.base].growth); };
function goStartRegion(rid) { if (ch.travel) { toast('You’re already on the road.'); return; } startTravel(rid, false); if (ch.travel) toast(`Travelling to <b>${esc(REGION_BY[rid].name)}</b>. Come back to the Dungeons tab when you arrive.`, 'verd'); renderMain(); renderActions(); renderTop(); }
// Founders: everyone who played before v2.0 (frame shows up with the profile showcase).
const V2_RELEASE = Date.UTC(2026, 10, 25, 23, 0, 0);
function markFounder() { if (account.founder == null) account.founder = account.slots.some(c => c && c.created && c.created < V2_RELEASE); }
