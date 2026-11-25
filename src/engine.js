// ============================================================
// ENGINE — pure functions, no DOM.
// ============================================================
const RES = buildResources(BALANCE);
finishContent(BALANCE, RES);
for (const r of RES) r.kind = 'gather';
for (const r of RECIPES) r.kind = 'craft';
const RES_BY = Object.fromEntries(RES.map(r => [r.id, r]));
const CHAIN = Object.fromEntries(GATHER_SKILLS.map(s => [s, RES.filter(r => r.skill === s)]));
const RECIPE = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const RECIPES_BY = Object.fromEntries(CRAFT_SKILLS.map(s => [s, RECIPES.filter(r => r.skill === s)]));
const ACT = id => ACT2(id);
const ORES = CHAIN.mining, ORE = RES_BY; // back-compat names

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// --- Items ---
const gkey = (base, q, plus) => `g:${base}:${q == null ? 1 : q}:${plus || 0}`;
function parseG(key) { const [, base, q, plus] = key.split(':'); return { base, q: +q, plus: +plus }; }
function ITEM(key) {
  if (RES_BY[key]) { const r = RES_BY[key]; return { name: r.name, type: 'resource', rarity: r.rarity, value: r.value, color: r.color, desc: r.flavor, skill: r.skill }; }
  if (key.startsWith('g:')) {
    const { base, q, plus } = parseG(key), g = GEAR[base]; if (!g) return { name: 'Unknown', type: 'junk', rarity: 0, value: 0, desc: '' };
    const qm = BALANCE.craft.qualityMult[q], m = qm * (1 + plus * BALANCE.enchant.perPlus);
    const stats = {}; for (const [s, v] of Object.entries(g.stats || {})) stats[s] = Math.round(v * m);
    const qn = BALANCE.craft.qualityNames[q], cc = typeof ch !== 'undefined' ? ch : null;
    let gname = g.name, gatk = g.attack || 0;
    if (g.growth && cc && cc.growth) { gname = growthName(cc.growth); gatk = Math.round(GROWTH.attackBase + GROWTH.attackPerLevel * cc.growth.lvl); }
    if (g.ego && cc && cc.egos && cc.egos[g.ego] && cc.egos[g.ego].bond >= EGO_BOND.awaken) gname = g.name + ' (Awakened)';
    return { name: (q !== 1 ? qn + ' ' : '') + gname + (plus ? ' +' + plus : ''), type: g.slot === 'tool' ? 'tool' : 'gear', gear: true, base, q, plus,
      slot: g.slot, toolSkill: g.toolSkill, rarity: g.rarity, lvl: g.lvl || 1, desc: g.desc,
      value: Math.max(1, Math.round((g.value || 1) * qm * (1 + plus * 0.25))),
      attack: Math.round(gatk * m), defense: Math.round((g.defense || 0) * m), stats,
      speed: g.speed ? Math.round((g.speed * qm + plus * 0.005) * 1000) / 1000 : 0 };
  }
  const it = ITEMS[key]; return it ? Object.assign({ value: 0 }, it) : { name: key, type: 'junk', rarity: 0, value: 0, desc: '' };
}

// --- Proficiency ---
function tierOf(count) { const t = BALANCE.tierThresholds; let k = 0; while (k < t.length - 1 && count >= t[k + 1]) k++; return k; }
function tierTimes(a) {
  if (a.id === 'stone') return BALANCE.stoneTierTimes.slice();
  const r = Math.pow(BALANCE.minActionSec / a.baseTime, 1 / 5);
  return [0, 1, 2, 3, 4, 5].map(k => a.baseTime * Math.pow(r, k));
}
function tierTime(a, tier) { return tierTimes(a)[Math.min(tier, 5)]; }
function actionSec(a, count, speed) { return Math.max(BALANCE.minActionSec, tierTime(a, tierOf(count)) * (1 - Math.min(BALANCE.speedBonusCap, speed))); }

// --- Levels ---
function levelCost(L) { const l = BALANCE.level; return Math.round(l.a * Math.pow(L, l.p) * Math.pow(l.g, L - 1)); }
function levelFromXp(xp) { let L = 1, rest = xp; while (L < BALANCE.level.max && rest >= levelCost(L)) { rest -= levelCost(L); L++; } return { level: L, into: rest, need: L < BALANCE.level.max ? levelCost(L) : 0 }; }

// --- Stats ---
function effPts(p) {
  let e = 0, prev = 0, mult = 1;
  for (const [th, m] of BALANCE.softCaps) { if (p <= th) return e + (p - prev) * mult; e += (th - prev) * mult; prev = th; mult = m; }
  return e + (p - prev) * mult;
}
const above = p => Math.max(0, effPts(p) - effPts(BALANCE.startStat));
function nextBreak(p) { for (const [th, m] of BALANCE.softCaps) if (p < th) return { at: th, mult: m }; return null; }

function earnedTitleBonuses(ch) {
  const out = { global: 0, bySkill: {}, stats: {}, list: [] };
  const add = (name, y, stat, amt, skill) => { if (skill) out.bySkill[skill] = (out.bySkill[skill] || 0) + y; else out.global += y; out.stats[stat] = (out.stats[stat] || 0) + amt; out.list.push({ name, y, stat, amt, skill }); };
  for (const [skill, def] of Object.entries(SKILL_TITLES)) { const total = ch.totals[skill] || 0; for (const [n, name, y, s] of def.line) if (total >= n) add(name, y, def.stat, s, skill); }
  for (const r of RES) if ((ch.prof[r.id] || 0) >= BALANCE.tierThresholds[9]) add(r.grandTitle, GRANDMASTER_BONUS.yield, GRANDMASTER_BONUS.stat, GRANDMASTER_BONUS.statAmt);
  for (const s of SECRET_TITLES) if (ch.secretTitles[s.id]) add(s.name, s.yield, s.stat, s.amt);
  if (ch.adv) { const cl = CLASSES.find(c => c.id === ch.cls); for (let t = 2; t <= ch.adv.tier; t++) add(tierName(ch.cls, ch.adv.spec, t), 0.02, cl.pri, 5); }
  return out;
}
function equippedKeys(ch) { return [...Object.values(ch.equip.slots), ...Object.values(ch.equip.tools)].filter(Boolean); }
function gearTotals(ch) {
  const t = { stats: {}, attack: 0, defense: 0 };
  for (const k of Object.values(ch.equip.slots)) { if (!k) continue; const it = ITEM(k); t.attack += it.attack; t.defense += it.defense; for (const [s, v] of Object.entries(it.stats)) t.stats[s] = (t.stats[s] || 0) + v; }
  return t;
}
function statBreakdown(ch, pending) {
  const race = RACES.find(r => r.id === ch.race), origin = ORIGINS.find(o => o.id === ch.origin), cls = CLASSES.find(c => c.id === ch.cls);
  const titles = earnedTitleBonuses(ch), gear = gearTotals(ch), res = {};
  for (const id of STAT_IDS) {
    const parts = [['Base', BALANCE.startStat]];
    if (race && race.stat === id) parts.push(['Race', 1]);
    if (origin && origin.stat === id) parts.push(['Origin', 1]);
    if (cls && cls.pri === id && (ch.level > 1 || ch.ascGrowth)) parts.push(['Class growth', (ch.level - 1) * BALANCE.level.classGrowthPerLevel + (ch.ascGrowth || 0)]);
    const a = (ch.alloc[id] || 0) + ((pending && pending[id]) || 0); if (a) parts.push(['Allocated', a]);
    if (titles.stats[id]) parts.push(['Titles', titles.stats[id]]);
    if (gear.stats[id]) parts.push(['Gear', gear.stats[id]]);
    if (ch.questStats && ch.questStats[id]) parts.push(['Quests', ch.questStats[id]]);
    if (ch.elixirs && ch.elixirs[id] >= 1) parts.push(['Elixirs', Math.floor(ch.elixirs[id])]);
    if (ch.trained && ch.trained[id] >= 1) parts.push(['Training', Math.floor(ch.trained[id])]);
    if (ch.adv && ch.adv.tier > 1 && cls) { let v = 0; for (let t = 2; t <= ch.adv.tier; t++) v += cls.pri === id ? TIER_STATS[t][0] : cls.sec === id ? TIER_STATS[t][1] : 0; if (v) parts.push(['Class tier', v]); }
    res[id] = { total: parts.reduce((s, p) => s + p[1], 0), parts };
  }
  return res;
}
function maxStamina(dex, extra) {
  const a = (Math.min(dex, 100) - 10) / 10, b = clamp(dex - 100, 0, 100) / 20, c = Math.max(0, dex - 200) / 40;
  return Math.min(BALANCE.stamina.hardCap, BALANCE.stamina.base + Math.floor(Math.max(0, a + b + c)) + (extra || 0));
}
function activeBuff(ch, cat, now, skill) {
  const p = ch.potions[cat]; if (!p || p.until <= now) return null;
  const it = ITEMS[p.id]; if (!it) return null;
  if (it.skill && skill && it.skill !== skill) return null;
  const m = cat === 'food' ? 1 : 1 + (classMods(ch).potion || 0);
  return Object.assign({}, it, { power: (it.power || 0) * m, until: p.until, id: p.id });
}

function derive(ch, now, pending, skill) {
  skill = skill || 'mining';
  const S = statBreakdown(ch, pending), st = id => S[id].total, SK = SKILLS[skill], M = classMods(ch);
  const race = RACES.find(r => r.id === ch.race) || { fx: {} }, cls = CLASSES.find(c => c.id === ch.cls) || {};
  const F = BALANCE.fx, rfx = race.fx || {}, gather = SK.kind === 'gather';
  const tool = gather && ch.equip.tools[skill] ? ITEM(ch.equip.tools[skill]) : null;
  const titles = earnedTitleBonuses(ch), gear = gearTotals(ch);
  const food = activeBuff(ch, 'food', now), ev = ch.eventBuff && ch.eventBuff.until > now ? ch.eventBuff.fx : {}, ffx = {};
  for (const src of [(food && food.fx) || {}, ev]) for (const [k, v] of Object.entries(src)) ffx[k] = (ffx[k] || 0) + v;
  const agiSpeed = Math.min(F.agiSpeedCap, above(st('AGI')) * F.agiSpeed);
  const speedParts = [['Agility', agiSpeed], ['Tool', tool ? tool.speed : 0], ['Race', (rfx.speed || 0) + ((rfx.skillSpeed || {})[skill] || 0)], ['Class & talents', (M.skillSpeed[skill] || 0) + (skill === 'slaying' ? M.fightSpeed || 0 : 0) + (skill === 'exploration' ? M.explore || 0 : 0)]];
  const speedRaw = speedParts.reduce((s, p) => s + p[1], 0);
  const yPot = activeBuff(ch, 'yield', now, skill);
  const statY = SK.yieldStat ? above(st(SK.yieldStat)) * F.strHeavyYield : 0;
  const yieldParts = [
    ['Titles', (titles.bySkill[skill] || 0) + titles.global], [SK.yieldStat ? STATS.find(s => s.id === SK.yieldStat).name : 'Stats', statY],
    ['Race', (rfx.skillYieldR || {})[skill] || 0], ['Class & talents', (gather ? M.gyield || 0 : 0) + (SK.kind === 'craft' ? M.cyield || 0 : 0) + (M.skillYield[skill] || 0)],
    ['Potion', yPot ? yPot.power : 0], ['Food', gather ? ffx.gyield || 0 : 0],
  ];
  const poolRaw = yieldParts.reduce((s, p) => s + p[1], 0);
  const pool = poolRaw <= BALANCE.yieldPoolSoftCap ? poolRaw : BALANCE.yieldPoolSoftCap + (poolRaw - BALANCE.yieldPoolSoftCap) * BALANCE.yieldPoolOverflow;
  const procPot = activeBuff(ch, 'proc', now), xpPot = activeBuff(ch, 'xp', now), luckPot = activeBuff(ch, 'luck', now);
  const lucky = (F.luckStrikeBase + above(st('LUCK')) * F.luckStrike) * (1 + (rfx.luckStrikeMult || 0)) + (procPot ? procPot.power : 0) + (ffx.proc || 0) + (M.luckStrike || 0) + (M.skillLuck[skill] || 0);
  const bonusFind = gather ? (above(st('PER')) * F.perBonusFind) * (1 + (rfx.bonusFindMult || 0)) + (M.bonusFind || 0) + (luckPot ? luckPot.power : 0) : 0;
  const xpMult = 1 + above(st('WIS')) * F.wisXp + (rfx.xp || 0) + (xpPot ? xpPot.power : 0) + (ffx.xp || 0) + (M.xp || 0) + (M.skillXp[skill] || 0);
  const e = p => effPts(st(p));
  const out = {
    S, skill,
    M, maxHP: Math.round((50 + 10 * e('VIT')) * (1 + (M.hp || 0))), maxRes: Math.round(20 + 3 * e('INT')),
    attack: Math.round((2 * e('STR') + gear.attack) * (1 + (M.atk || 0))), magic: Math.round(2 * e('INT')), defense: Math.round((e('VIT') + gear.defense) * (1 + (M.def || 0))),
    crit: 0.05 + above(st('DEX')) * 0.001 + (M.crit || 0), critDmg: 1.5 + above(st('DEX')) * 0.005 + (M.critDmg || 0),
    dodge: Math.min(0.6, above(st('AGI')) * 0.001 + (M.dodge || 0)), cspeed: Math.round(100 + above(st('AGI'))),
    carry: Math.round(100 + 5 * e('STR')), drop: above(st('LUCK')) * F.luckDrop,
    speed: Math.min(BALANCE.speedBonusCap, speedRaw), speedRaw, speedParts, pool, poolRaw, yieldParts,
    lucky: Math.min(0.9, lucky), bonusFind: Math.min(0.9, bonusFind), xpMult,
    stamina: maxStamina(st('DEX'), Math.min(BALANCE.food.staminaCap, ffx.stamina || 0) + (M.stamina || 0)),
    intAbove: above(st('INT')) + (M.quality || 0) / BALANCE.craft.qualityIntShift, wisAbove: above(st('WIS')),
    discount: Math.min(F.charmDiscountCap, above(st('CHARM')) * F.charmDiscount + (M.discount || 0)),
    sell: 1 + (rfx.sell || 0) + (M.sell || 0),
    offlineH: Math.min(BALANCE.offline.maxCapH, BALANCE.offline.baseCapH + (ch.offlineUpgrades || 0) * BALANCE.offline.upgradeH + (rfx.offlineH || 0) + (M.offlineH || 0)),
  };
  out.cpow = combatPower(out); return out;
}

// --- Unlocks ---
function isUnlocked(ch, a) {
  if (a.kind === 'combat' || a.kind === 'explore' || a.kind === 'train') return true;
  if (a.inputs) return ch.skills[a.skill].level >= (a.need || a.lvl);
  if (a.index === 1) return true;
  const prev = CHAIN[a.skill][a.index - 2];
  return (ch.prof[prev.id] || 0) >= BALANCE.unlockAt && ch.skills[a.skill].level >= a.reqLevel;
}
function lockReason(ch, a) {
  if (a.inputs) return `${SKILLS[a.skill].name} level ${a.need || a.lvl}`;
  const prev = CHAIN[a.skill][a.index - 2], need = [];
  if ((ch.prof[prev.id] || 0) < BALANCE.unlockAt) need.push(`${BALANCE.unlockAt.toLocaleString()} ${prev.name} (${Math.floor(ch.prof[prev.id] || 0).toLocaleString()} so far)`);
  if (ch.skills[a.skill].level < a.reqLevel) need.push(SKILLS[a.skill].name + ' level ' + a.reqLevel);
  return need.join(' and ');
}

// --- Random helpers ---
function probRound(x, rng) { const f = Math.floor(x); return f + (rng() < x - f ? 1 : 0); }
function qualityProbs(k, intAbove) {
  const C = BALANCE.craft, shift = Math.max(0, k - 5) * C.qualityTierShift + intAbove * C.qualityIntShift;
  const cuts = C.qualityCut.map(c => Math.max(0, c - shift)), out = [];
  let prev = 0; for (const c of cuts) { out.push(c - prev); prev = c; } out.push(1 - prev); return out;
}
function rollQuality(k, intAbove, rng) { const p = qualityProbs(k, intAbove); let r = rng(); for (let i = 0; i < p.length; i++) { if (r < p[i]) return i; r -= p[i]; } return p.length - 1; }
const extraChance = k => k >= 6 ? BALANCE.craft.extraChance[Math.min(3, k - 6)] : 0;

// How many crafts the inventory can feed.
function craftable(ch, rc) { let n = Infinity; for (const [i, q] of Object.entries(rc.inputs)) n = Math.min(n, Math.floor((ch.inv[i] || 0) / q)); return n; }

// One batch of gathering completions.
function resolveGather(ch, res, n, D, rng, node) {
  const c0 = ch.prof[res.id] || 0; let units = 0, lucky = 0, triple = 0, finds = 0, xp = 0; const junk = {};
  for (let j = 0; j < n; j++) {
    const pb = BALANCE.tierYieldBonus[tierOf(c0 + j)];
    let got = probRound(res.baseYield * (1 + pb) * (1 + D.pool) * (node ? 1 + BALANCE.richVein.bonus : 1), rng);
    if (rng() < D.lucky) { const t = rng() < BALANCE.fx.luckTripleShare; got *= t ? 3 : 2; lucky++; if (t) triple++; }
    if (rng() < D.bonusFind) { got += 1; finds++; }
    if (rng() < BALANCE.junkChance) { const list = JUNK[res.skill], id = list[rng() < 0.75 ? 0 : 1][0]; junk[id] = (junk[id] || 0) + 1; }
    units += got; xp += res.xp * (1 + pb) * D.xpMult;
  }
  return { units, lucky, triple, finds, xp, junk };
}
// One batch of crafting completions (inputs are checked by the caller).
function resolveCraft(ch, rc, n, D, rng) {
  const c0 = ch.prof[rc.id] || 0, out = {}; let xp = 0, lucky = 0, triple = 0, best = 0;
  for (let j = 0; j < n; j++) {
    const k = tierOf(c0 + j);
    let q = probRound(rc.qty * (1 + D.pool), rng);
    if (rng() < extraChance(k)) q += probRound(rc.qty * 0.5, rng);
    if (rng() < D.lucky) { const t = rng() < BALANCE.fx.luckTripleShare; q *= t ? 3 : 2; lucky++; if (t) triple++; }
    let key = rc.out;
    if (rc.gearOut) { const ql = rollQuality(k, D.intAbove, rng); best = Math.max(best, ql); key = gkey(rc.out, ql, 0); }
    out[key] = (out[key] || 0) + q; xp += rc.xp * D.xpMult;
  }
  return { out, xp, lucky, triple, best };
}

// Closed-form offline progress: walk tier segments. Returns chunks of {k, n}.
function offlineChunks(a, count, sec, speed, maxDone) {
  const TH = BALANCE.tierThresholds; let c = count, t = sec, done = 0; const chunks = [];
  while (t > 0 && done < maxDone) {
    const k = tierOf(c), tm = actionSec(a, c, speed), next = k < TH.length - 1 ? TH[k + 1] : Infinity;
    const n = Math.min(next - c, Math.floor(t / tm + 1e-9), maxDone - done);
    if (n <= 0) break;
    chunks.push({ k, n }); c += n; done += n; t -= n * tm;
    if (c < next) break;
  }
  return { count: c, done, chunks };
}
// Expected outputs for a list of chunks.
function offlineGatherOut(res, chunks, D) {
  const ev = 1 + D.lucky * (1 + BALANCE.fx.luckTripleShare); let units = 0, xp = 0, n = 0;
  for (const { k, n: m } of chunks) { const pb = BALANCE.tierYieldBonus[k]; units += m * (res.baseYield * (1 + pb) * (1 + D.pool) * ev + D.bonusFind); xp += m * res.xp * (1 + pb) * D.xpMult; n += m; }
  return { units, xp, junk: n * BALANCE.junkChance };
}
function offlineCraftOut(rc, chunks, D) {
  const ev = 1 + D.lucky * (1 + BALANCE.fx.luckTripleShare), out = {}; let xp = 0;
  for (const { k, n } of chunks) {
    const per = rc.qty * (1 + D.pool) * (1 + extraChance(k) * 0.5) * ev * n; xp += n * rc.xp * D.xpMult;
    if (rc.gearOut) qualityProbs(k, D.intAbove).forEach((p, q) => { if (p > 0) { const key = gkey(rc.out, q, 0); out[key] = (out[key] || 0) + per * p; } });
    else out[rc.out] = (out[rc.out] || 0) + per;
  }
  return { out, xp };
}

// --- Market ---
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
function saturation(ch, key, now) { const m = ch.market[key]; if (!m) return 0; return m.s * Math.pow(0.5, (now - m.t) / 3.6e6 / BALANCE.market.halfLifeH); }
function priceMult(ch, key, now) {
  const M = BALANCE.market, day = Math.floor(now / 864e5);
  const swing = 1 + M.dailySwing * Math.sin(hashStr(key) * 6.283 + day * 0.9);
  return Math.max(M.floor, 1 / (1 + saturation(ch, key, now) / M.saturation)) * swing;
}
function savingsNow(ch, now) {
  const s = ch.savings; if (!s || !s.bal) return 0;
  const days = (now - s.t) / 864e5, B = BALANCE.banker;
  const earning = Math.min(s.bal, B.cap);
  return s.bal + earning * (Math.pow(1 + B.dailyRate, days) - 1);
}

// --- Formatting ---
const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
function fmt(n, mode) {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a < 1000) return (a < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString());
  if (mode === 'sci') return n.toExponential(2).replace('e+', 'e');
  let k = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(a) / 3)), v = n / Math.pow(1000, k);
  if (Math.abs(v) >= 999.5 && k < SUFFIX.length - 1) { k++; v = n / Math.pow(1000, k); }
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + SUFFIX[k];
}
function fmtTime(sec) {
  if (!isFinite(sec)) return '—';
  if (sec < 1) return sec.toFixed(2) + 's';
  if (sec < 60) return (sec < 10 ? sec.toFixed(1) : Math.round(sec)) + 's';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  if (m < 60) return m + 'm' + (s ? ' ' + s + 's' : '');
  const h = Math.floor(m / 60); if (h < 48) return h + 'h ' + (m % 60) + 'm';
  return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
}
const pct = (x, d) => (x * 100).toFixed(d == null ? (Math.abs(x) < 0.1 && x ? 1 : 0) : d) + '%';

// ============================================================
// COMBAT, TRAVEL, EXPLORATION (Phase 4)
// ============================================================
function archetype(L) {
  const C = BALANCE.combat.archetype, pts = BALANCE.level.statPointsPerLevel * (L - 1), t = Math.min(6, Math.floor((L - 1) / 14));
  const STR = 10 + (L - 1) + C.str * pts, VIT = 10 + C.vit * pts, DEX = 10 + C.dex * pts;
  const attack = 2 * effPts(STR) + 5 * Math.pow(1.55, t), defense = effPts(VIT) + 21 * Math.pow(1.55, t), hp = 50 + 10 * effPts(VIT);
  const crit = 0.05 + above(DEX) * 0.001, critDmg = 1.5 + above(DEX) * 0.005;
  return { cp: Math.sqrt(attack * (1 + crit * (critDmg - 1)) * hp * (1 + defense / 200)), hp };
}
function combatPower(D) { return Math.sqrt(D.attack * (1 + D.crit * (D.critDmg - 1)) * (D.cspeed / 100) * D.maxHP * (1 + D.defense / 200) / (1 - D.dodge)); }

// Build enemies, trophies, unique gear, explore actions.
const ENEMIES = [], ENEMY_BY = {};
for (const [key, list] of Object.entries(ENEMY_DEFS)) {
  const hamlet = key.startsWith('hamlet_') ? key.slice(7) : null, region = hamlet ? START_TO_REGION[hamlet] : key;
  let normal = 0;
  list.forEach(([name, L, flavor, trophy, hide, role]) => {
    role = role || ''; const id = slug(name), C = BALANCE.combat, a = archetype(L), boss = role === 'boss' || role === 'tboss';
    const tid = slug(trophy);
    ITEMS[tid] = ITEMS[tid] || { name: trophy, type: 'trophy', rarity: Math.min(5, Math.floor(L / 17)), value: Math.max(2, Math.round(C.goldBase * Math.pow(C.goldGrowth, L - 1) * (boss ? 6 : 2))), desc: `Taken from a ${name}. Sells well; collectors love them.` };
    const area = hamlet ? 'hamlet' : role === 'boss' ? 2 : role === 'hidden' ? 'hidden' : (normal++ < 2 ? 0 : 1);
    const loot = [{ key: tid, chance: boss ? 1 : 0.5, min: 1, max: boss ? 3 : 1 }];
    if (hide) loot.push({ key: hide, chance: 0.35, min: 1, max: 2 });
    loot.push({ key: L < 30 ? 'lesser_stone' : L < 55 ? 'greater_stone' : L < 80 ? 'grand_stone' : 'mythic_stone', chance: boss ? 0.15 : 0.01, min: 1, max: 1, rare: true });
    loot.push({ key: L < 20 ? 'potion_prod' : L < 50 ? 'potion_prod2' : 'potion_prod3', chance: boss ? 0.08 : 0.004, min: 1, max: 1, rare: true });
    const e = { id: 'e_' + id, eid: id, kind: 'combat', name, flavor, level: L, region, hamlet, area, role, boss, skill: 'slaying',
      rec: Math.round(a.cp * (role === 'tboss' ? C.recTutorialBoss : boss ? C.recBoss : role === 'hidden' ? C.recHidden : C.recNormal)),
      dps: C.dpsFrac * a.hp, baseTime: Math.round(((boss ? C.bossBase : C.baseTime) + L * 0.04) * 100) / 100,
      stamina: 1 + Math.floor(L / 25), mech: BOSS_MECH[id] || null,
      xp: Math.round(C.xpBase * Math.pow(C.xpGrowth, L - 1) * (boss ? C.bossXp : 1) * 10) / 10,
      gold: [C.goldBase * Math.pow(C.goldGrowth, L - 1) * (boss ? C.bossGold : 1) * 0.7, C.goldBase * Math.pow(C.goldGrowth, L - 1) * (boss ? C.bossGold : 1) * 1.3], loot };
    ENEMIES.push(e); ENEMY_BY[e.id] = e;
  });
}
for (const [id, name, slot, src, stats, chance] of UNIQUES) {
  const e = ENEMY_BY['e_' + src], t = Math.min(6, e.level / 14), boss = e.boss;
  GEAR[id] = { name, slot, stats, rarity: boss ? 4 : 3, lvl: Math.max(1, e.level - 3), value: Math.round(e.gold[1] * 40), unique: true, desc: `Unique. Dropped by ${e.name}.`,
    attack: slot === 'weapon' ? Math.round(5 * Math.pow(1.55, t) * 1.4) : 0, defense: ['head', 'chest', 'offhand'].includes(slot) ? Math.round(4 * Math.pow(1.55, t) * 1.3) : 0 };
  e.loot.push({ key: gkey(id), chance, min: 1, max: 1, rare: true, unique: true });
}
ITEMS.jacks_bean = { name: 'Jack’s Magical Bean', type: 'keepsake', rarity: 5, bind: true, value: 0, desc: 'It hums faintly and smells of clouds. Surely it wants to be planted somewhere.' };
for (const [src, drops] of Object.entries(SECRET_DROPS)) for (const [key, chance] of drops) ENEMY_BY['e_' + src].loot.push({ key, chance, min: 1, max: 1, rare: true, secret: true });
for (const [hid, t] of Object.entries(TUTORIALS)) { const [id, name, slot, stats] = t.gear; GEAR[id] = { name, slot, stats, rarity: 2, lvl: 1, value: 40, defense: 3, desc: `A gift for finishing your first tasks in ${START_REGIONS.find(r => r.id === hid).name}.` }; }
const EXPLORES = REGIONS.map(r => ({ id: 'x_' + r.id, kind: 'explore', name: 'Explore ' + r.name, region: r.id, skill: 'exploration', stamina: 1,
  baseTime: BALANCE.explore.baseTime + r.band * BALANCE.explore.perBand, xp: Math.round(2 * Math.pow(BALANCE.combat.xpGrowth, r.lvl - 1) * 10) / 10 }));
const EXPLORE_BY = Object.fromEntries(EXPLORES.map(x => [x.id, x]));
const ACT2 = id => RES_BY[id] || RECIPE[id] || ENEMY_BY[id] || EXPLORE_BY[id] || (typeof TRAIN_BY !== 'undefined' && TRAIN_BY[id]);

function winChance(cp, rec) { const C = BALANCE.combat; return 1 / (1 + C.winAt * Math.pow(rec / Math.max(1, cp), C.winK)); }
function mechActive(e, D) { return !!(e.mech && D.S[e.mech.stat].total < e.mech.need); }
function fightInfo(ch, e, D) {
  const cp = combatPower(D), m = mechActive(e, D) ? e.mech : {}, rec = e.rec * (m.rec || 1), over = cp >= rec;
  const count = ch.prof[e.id] || 0;
  let t = actionSec(e, count, 0); if (!over) t = e.baseTime; else t = Math.max(BALANCE.minActionSec, t * (1 - Math.min(BALANCE.speedBonusCap, D.speed)));
  const crush = !e.boss && cp >= rec * BALANCE.combat.crushAt; if (crush) t = BALANCE.minActionSec; // v1.3: 50%+ stronger → 0.1 s fights
  t *= (m.time || 1); if (e.boss) t = Math.max(BALANCE.combat.bossMinSec, t);
  const M = D.M || {}, ratio = rec / Math.max(1, cp), dmg = e.dps * t * Math.pow(ratio, BALANCE.combat.dmgExp) * (m.dmg || 1) * Math.max(0.2, 1 + (M.dmgTaken || 0)) * (1 - Math.min(0.5, (M.lifesteal || 0) * 3));
  const regen = BALANCE.combat.regenFight * D.maxHP * t * (1 + above(D.S.VIT.total) * BALANCE.combat.regenVitBonus) * (1 + (M.regen || 0));
  return { cp, rec, over, crush, time: t, win: winChance(cp, rec), dmg, regen, mech: e.mech ? !mechActive(e, D) : null };
}
function travelMinutes(from, to) {
  const dist = { [from]: 0 }, done = new Set();
  while (true) {
    let u = null; for (const k in dist) if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
    if (u === null || u === to) break; done.add(u);
    for (const [a, b, m] of (typeof openRoutes === 'function' && ch ? openRoutes() : ROUTES)) { const v = a === u ? b : b === u ? a : null; if (v && (dist[v] == null || dist[u] + m < dist[v])) dist[v] = dist[u] + m; }
  }
  return dist[to];
}
const travelBonus = D => Math.min(BALANCE.travel.cap + ((D.M && D.M.mounted) ? PET_CFG.mountCapBonus : 0), above(D.S.AGI.total) * BALANCE.travel.perAgi + ((D.M && D.M.travel) || 0));
const gateLevel = ch => ch.ascension ? BALANCE.ascension.needLevel : ch.level;
const priceIndex = (ch, itemLvl) => Math.max(1, Math.pow(BALANCE.economy.priceGrowth, gateLevel(ch) - Math.max(1, itemLvl || 1)));
const scaled = (ch, base, itemLvl) => Math.ceil(base * priceIndex(ch, itemLvl));
const levelLabel = c => (c.ascension ? `A${c.ascension} · ` : '') + 'Lv ' + c.level;
const fastTravelCost = (to, ch) => Math.round(BALANCE.travel.fastBase * Math.pow(BALANCE.travel.fastGrowth, REGION_BY[to].band) * (ch ? priceIndex(ch, REGION_BY[to].lvl) : 1));
const exploreFrac = (ch, rid) => Math.min(1, ((ch.prof['x_' + rid] || 0)) / BALANCE.explore.target);
function areaOpen(ch, e, D) {
  if (e.area === 'hamlet') return true;
  if (e.area === 'trial') return ch.cls === e.cls && !!(ch.adv && ch.adv.quest && ch.adv.quest.tier === e.tier && ch.adv.quest.step === 3);
  const f = exploreFrac(ch, e.region);
  if (e.area === 'hidden') return f >= BALANCE.explore.hiddenAt && D.S.PER.total >= REGION_BY[e.region].perReq;
  return f >= BALANCE.explore.areaAt[e.area];
}

// ============================================================
// CLASSES & TALENTS (Phase 5)
// ============================================================
const NODES = {}, TREES = {};
function addTree(tree, rows, shape, levelReq, extra) {
  TREES[tree] = rows.map(([name, ranks, mods, kind, note], i) => {
    const id = `${tree}#${i}`;
    const n = { id, tree, i, name, ranks, mods, kind: kind || '', note: note || '', req: (shape[i] || []).map(([j, r]) => [`${tree}#${j}`, r]), level: kind === 'cap' ? levelReq : 0, cost: kind === 'cap' ? 3 : 1, ...(extra || {}) };
    NODES[id] = n; return n;
  });
}
const scaleMods = (m, k) => { const o = {}; for (const [a, v] of Object.entries(m)) o[a] = typeof v === 'object' ? scaleMods(v, k) : v * k; return o; };
for (const [c, rows] of Object.entries(T1)) addTree(`class:${c}`, rows, TREE_SHAPE, CAP_LEVEL[1]);
for (const [c, specs] of Object.entries(SPECS)) specs.forEach(([name, focus, sig, t3], si) => {
  const F = FOCUS_MODS[focus];
  addTree(`spec:${c}:${si}:2`, [[`${name} Discipline`, 5, F.main], [sig, 3, F.active, 'active', 'Signature skill, spends your class resource.'], [`${name} Instinct`, 3, F.util], [`${name} Apex`, 1, F.apex, 'cap']], [[], [[0, 2]], [[0, 2]], [[0, 5], [1, 1]]], CAP_LEVEL[2]);
  addTree(`spec:${c}:${si}:3`, [[`${t3} Ascent`, 3, scaleMods(F.main, 1.5)], [`${sig} II`, 3, scaleMods(F.active, 1.5), 'active', 'An empowered signature skill.'], [`${t3} Legacy`, 1, scaleMods(F.apex, 1.5), 'cap']], [[], [[0, 1]], [[0, 3], [1, 1]]], CAP_LEVEL[3]);
  addTree(`spec:${c}:${si}:4`, [['Ascension', 1, { atk:.10, hp:.10, xp:.10, gyield:.10, cyield:.10 }, 'cap']], [[]], CAP_LEVEL[4]);
});
for (const s of SKILL_IDS) addTree(`career:${s}`, careerTree(s), CAREER_SHAPE, 0, { skillReq: s });
addTree('general', GENERAL_TREE, GENERAL_SHAPE, 30);

function addMods(acc, m, k) {
  for (const [a, v] of Object.entries(m)) {
    if (typeof v === 'object') { acc[a] = acc[a] || {}; for (const [b, w] of Object.entries(v)) acc[a][b] = (acc[a][b] || 0) + w * k; }
    else acc[a] = (acc[a] || 0) + v * k;
  }
}
function treeActive(ch, tree) {
  if (tree.startsWith('class:')) return tree === `class:${ch.cls}`;
  if (tree.startsWith('spec:')) { const [, c, si, t] = tree.split(':'); return c === ch.cls && ch.adv && +si === ch.adv.spec && +t <= ch.adv.tier; }
  return true;
}
function classMods(ch) {
  const M = { stats: {}, skillYield: {}, skillSpeed: {}, skillLuck: {}, skillXp: {} };
  addMods(M, INNATE[ch.cls] || {}, 1);
  if (ch.adv && ch.adv.secondary) addMods(M, INNATE[ch.adv.secondary] || {}, 0.5);
  if (ch.ascension) { const A = BALANCE.ascension; addMods(M, { xp: A.xp, gyield: A.yield, cyield: A.yield, atk: A.power, hp: A.power }, ch.ascension); }
  for (const [id, r] of Object.entries(ch.talents || {})) { const n = NODES[id]; if (n && r > 0 && treeActive(ch, n.tree)) addMods(M, n.mods, r); }
  if (typeof weaponMods === 'function') weaponMods(ch, M);
  if (typeof petMods === 'function') petMods(ch, M);
  if (typeof perkMods === 'function') perkMods(ch, M);
  if (typeof worldEventMods === 'function') worldEventMods(ch, M);
  return M;
}
function modsText(m, k) {
  k = k == null ? 1 : k; const out = [];
  for (const [a, v] of Object.entries(m)) {
    if (typeof v === 'object') { for (const [b, w] of Object.entries(v)) out.push(`+${pct(w * k, 1)} ${SKILLS[b] ? SKILLS[b].name : b} ${a === 'skillYield' ? 'yield' : a === 'skillSpeed' ? 'speed' : a === 'skillLuck' ? 'Lucky Strike' : a === 'skillXp' ? 'XP' : ''}`.trim()); continue; }
    if (a === 'stamina' || a === 'offlineH') out.push(`+${v * k} ${MOD_LABELS[a]}`);
    else if (a === 'dmgTaken') out.push(`${pct(v * k, 1)} ${MOD_LABELS[a]}`);
    else out.push(`+${pct(v * k, v * k < 0.1 ? 1 : 0)} ${MOD_LABELS[a] || a}`);
  }
  return out.join(', ');
}
function tierName(c, spec, tier) {
  const cl = CLASSES.find(x => x.id === c); if (tier <= 1 || spec == null) return cl.name;
  const sp = SPECS[c][spec]; return tier === 2 ? sp[0] : tier === 3 ? sp[3] : 'Ascended ' + sp[3];
}
// Class trial enemies (only appear during an advancement quest).
for (const [c, A] of Object.entries(ADVANCE)) [[2, A[1], A[2], 27], [3, A[3], A[4], 62], [4, 'chasm', A[5], 99]].forEach(([tier, region, name, L]) => {
  const a = archetype(L), C = BALANCE.combat, id = `e_trial_${c}_${tier}`;
  const e = { id, eid: id.slice(2), kind: 'combat', name, flavor: `A trial set by ${A[0]}. Win, and you advance.`, level: L, region, hamlet: null, area: 'trial', role: 'trial', boss: true, cls: c, tier, skill: 'slaying',
    rec: Math.round(a.cp), dps: C.dpsFrac * a.hp, baseTime: C.bossBase, stamina: 1, mech: null,
    xp: Math.round(C.xpBase * Math.pow(C.xpGrowth, L - 1) * C.bossXp), gold: [C.goldBase * Math.pow(C.goldGrowth, L - 1) * 3, C.goldBase * Math.pow(C.goldGrowth, L - 1) * 5], loot: [] };
  ENEMIES.push(e); ENEMY_BY[id] = e;
});

// ============================================================
// COMPANIONS, EGO & GROWTH WEAPONS (Phase 6)
// ============================================================
for (const [id, e] of Object.entries(EGOS)) {
  const t = Math.min(6, e.lvl / 14);
  GEAR['ego_' + id] = { name: e.name, slot: 'weapon', stats: e.stats, rarity: 5, lvl: Math.max(1, e.lvl - 3), value: Math.round(50 * Math.pow(1.2, e.lvl)), attack: Math.round(5 * Math.pow(1.55, t) * 1.5), ego: id, unique: true, desc: `Sentient. ${e.epithet[0].toUpperCase() + e.epithet.slice(1)}. Likes ${e.likeText}; dislikes ${e.dislikeText}.` };
  if (!e.source.startsWith('event:')) ENEMY_BY['e_' + e.source].loot.push({ key: gkey('ego_' + id), chance: e.chance, min: 1, max: 1, rare: true, unique: true, ego: id });
}
GEAR.growth_blade = { name: GROWTH.names.seed, slot: 'weapon', stats: {}, rarity: 4, lvl: 1, value: 200, attack: GROWTH.attackBase, growth: true, unique: true, desc: 'A living blade. It grows with every fight and every material you feed it, and evolves to match how you play.' };
function growthName(g) { return !g || !g.path ? GROWTH.names.seed : GROWTH.names[g.path][Math.min(1, g.tier - 2)]; }
const growthCost = L => Math.round(GROWTH.costBase * Math.pow(GROWTH.costGrowth, L));
function compLevel(c) { return levelFromXp(c.xp).level; }
function gearScore(keys) { let s = 0; for (const k of keys) { if (!k) continue; const it = ITEM(k); s += (it.attack || 0) + (it.defense || 0) + Object.values(it.stats || {}).reduce((a, b) => a + b, 0); } return s; }
function compMult(ch) {
  const c = ch.comp; if (!c) return 0;
  const L = compLevel(c), exp = 20 * Math.pow(1.5, L / 14), g = Math.min(1, gearScore(Object.values(c.gear)) / exp);
  const eff = ((c.tree && c.tree[0]) || 0) * COMPANION_TREE[0][2].eff;
  let m = (0.25 + 0.75 * L / 99) * (1 + c.bond / 200) * (1 + g) * (1 + eff);
  if (c.sworn) m *= 1.25;
  if (ch.cls === 'healer' && c.cls === 'healer') m *= 1.5;
  return m;
}
function egoEquipped(ch) { const k = ch.equip && ch.equip.slots && ch.equip.slots.weapon; if (!k) return null; const b = parseG(k).base; return GEAR[b] && GEAR[b].ego ? GEAR[b].ego : null; }
function growthEquipped(ch) { const k = ch.equip && ch.equip.slots && ch.equip.slots.weapon; return !!(k && parseG(k).base === 'growth_blade'); }
function egoAbilities(ch, id) { const b = ch.egos[id].bond, a = EGOS[id].abilities, out = []; if (b < EGO_BOND.sulk) return out; if (b >= EGO_BOND.ab1) out.push(a[0]); if (b >= EGO_BOND.ab2) out.push(a[1]); if (b >= EGO_BOND.awaken) out.push(a[2]); return out; }
function weaponMods(ch, M) {
  if (ch.comp) { const def = COMPANIONS[ch.comp.cls]; addMods(M, def[3], compMult(ch)); const t = ch.comp.tree || {}; COMPANION_TREE.slice(1).forEach(([, , m], i) => { if (t[i + 1]) addMods(M, m, t[i + 1]); }); }
  const eg = ch.egos && egoEquipped(ch); if (eg && ch.egos[eg]) for (const m of egoAbilities(ch, eg)) addMods(M, m, 1);
  if (ch.growth && ch.growth.path && growthEquipped(ch)) addMods(M, GROWTH.passives[ch.growth.path][Math.min(1, ch.growth.tier - 2)], 1);
}

// ============================================================
// PHASE 7 — elixir recipes (need trophies, so built after enemies), training, boss elixir drops
// ============================================================
function lateRecipe(skill, out, inputs, cat) {
  let x = 0, l = 1;
  for (const [i, q] of Object.entries(inputs)) { const r = RES_BY[i]; if (r) { x += r.xp * q; l = Math.max(l, r.reqLevel); } else x += 2 * q; }
  const rc = { skill, id: 'r_' + out, out, name: ITEMS[out].name, inputs, qty: 1, cat, kind: 'craft', lvl: l, xp: Math.round(x * BALANCE.craft.xpMult * 10) / 10 + 1,
    baseTime: Math.round((BALANCE.craft.baseTimeMin + (BALANCE.craft.baseTimeMax - BALANCE.craft.baseTimeMin) * (l - 1) / 98) * 100) / 100, stamina: 1 + Math.floor((l - 1) / 33) };
  RECIPES.push(rc); RECIPE[rc.id] = rc; RECIPES_BY[skill].push(rc); ITEMS[out].lvl = l;
}
for (const [stat, , t1, h1, t3, h3] of ELIXIR_DEFS) {
  lateRecipe('alchemy', `elixir_${stat.toLowerCase()}_0`, { [t1]: 3, [h1]: 5, vial: 1 }, 'Elixirs');
  lateRecipe('alchemy', `elixir_${stat.toLowerCase()}_1`, { [t3]: 5, [h3]: 8, vial: 2 }, 'Elixirs');
}
for (const [rid, story] of Object.entries(REGION_STORY)) {
  const st = story[0].toLowerCase();
  for (const e of ENEMIES) if (e.region === rid && !e.hamlet) {
    if (e.role === 'boss') e.loot.push({ key: `elixir_${st}_2`, chance: 0.01, min: 1, max: 1, rare: true });
    if (e.role === 'hidden') e.loot.push({ key: `elixir_${st}_1`, chance: 0.02, min: 1, max: 1, rare: true });
  }
}
const TRAINS = TRAINING.map(([stat, name, desc]) => ({ id: 't_' + stat.toLowerCase(), kind: 'train', name, stat, desc, skill: 'training', baseTime: TRAIN_CFG.baseTime, stamina: 1, xp: 1 }));
const TRAIN_BY = Object.fromEntries(TRAINS.map(t => [t.id, t]));

// ============================================================
// PETS (Phase 8)
// ============================================================
const SP = id => { const s = SPECIES[id]; return { id, name: s[0], rarity: s[1], size: s[2], tags: s[3], region: s[4], boost: s[5], ability: s[6], evolve: s[7], desc: s[8], hybrid: !!s[9] }; };
const petCost = L => Math.round(PET_CFG.costBase * Math.pow(PET_CFG.costGrowth, L));
const petById = (ch, uid) => (ch.pets || []).find(p => p.uid === uid);
function supportSlots(ch) { const bl = ch.skills && ch.skills.beastmastery ? ch.skills.beastmastery.level : 1; let n = SUPPORT_UNLOCK.filter(l => bl >= l).length; if (ch.cls === 'beastmaster') n++; return Math.min(4, n); }
function petMood(p) { return (p.hunger < 20 ? 0.5 : 1) * (0.75 + 0.25 * p.happy / 100); }
function petMult(ch, p, support) { const s = SP(p.sp); return PET_RARITY_MULT[s.rarity] * (1 + p.lvl / 25) * petMood(p) * (support ? PET_CFG.supportMult : 1) * (ch.cls === 'beastmaster' ? 1.25 : 1) * (1 + (ch._petPower || 0)); }
function isMount(p) { const s = SP(p.sp); return s.size >= 3 && (s.tags.includes('Flying') || s.tags.includes('Ground')); }
function activeCombos(ch) {
  const ps = [ch.petActive, ...(ch.petSupport || [])].map(u => petById(ch, u)).filter(Boolean);
  const tags = new Set(ps.flatMap(p => SP(p.sp).tags));
  return COMBOS.filter(c => c.tags.every(t => tags.has(t)) && ps.length >= 2);
}
const _collCache = new WeakMap();
function collectionPct(ch) {
  const c0 = _collCache.get(ch); if (c0 && Date.now() - c0.t < 3000) return c0.v;
  const v = collectionPctRaw(ch); _collCache.set(ch, { t: Date.now(), v }); return v;
}
function collectionPctRaw(ch) {
  const dex = Object.keys(ch.petDex || {}).length / Object.keys(SPECIES).length;
  const mons = ENEMIES.filter(e => e.role !== 'trial' && (ch.prof[e.id] || 0) > 0).length / ENEMIES.filter(e => e.role !== 'trial').length;
  const allItems = [...RES.map(r => r.id), ...Object.keys(ITEMS).filter(k => !['supply', 'upgrade'].includes(ITEMS[k].type))];
  const items = allItems.filter(k => ch.seen && ch.seen[k]).length / allItems.length;
  const regions = Math.min(1, Object.keys(ch.visited || {}).length / REGIONS.length);
  return { pets: dex, monsters: mons, items, regions };
}
function petMods(ch, M) {
  ch._petPower = M.petPower || 0;
  const a = ch.petActive && petById(ch, ch.petActive);
  if (a) { const s = SP(a.sp), m = petMult(ch, a, false); addMods(M, s.boost, m); addMods(M, s.ability, m); addMods(M, PERSONALITIES[a.pers][1], 1);
    if (isMount(a)) { M.travel = (M.travel || 0) + (s.tags.includes('Flying') ? PET_CFG.mountFlying : PET_CFG.mountGround); M.mounted = 1; } }
  for (const u of (ch.petSupport || []).slice(0, supportSlots(ch))) { const p = petById(ch, u); if (p) addMods(M, SP(p.sp).boost, petMult(ch, p, true)); }
  for (const c of activeCombos(ch)) addMods(M, c.mods, 1);
  if (ch.petDex) { const C = collectionPct(ch); for (const [k, v] of Object.entries(C)) addMods(M, COLLECTION_BONUS[k], COLLECTION_STEPS.filter(t => v >= t - 1e-9).length); }
}

// v0.9a: every crafting skill's easiest recipe is open at skill level 1 (the ladder shifts down,
// so Alchemy, Blacksmithing, Enchanting and Jewelcrafting no longer start fully locked).
for (const s of CRAFT_SKILLS) { const L = RECIPES.filter(r => r.skill === s), lo = Math.min(...L.map(r => r.lvl)); for (const r of L) r.need = Math.max(1, r.lvl - (lo - 1)); }
