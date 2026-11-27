// ============================================================
// BALANCE CONFIG — every tunable number lives here.
// ============================================================
const BALANCE = {
  tickMs: 100,                 // internal engine step
  minActionSec: 0.1,           // hard floor
  uiHz: 4,                     // number refreshes per second
  logFlushMs: 1000,            // aggregate log lines once per second
  autosaveMs: 30000,

  // Proficiency tiers (completions needed to reach T1..T10)
  tierThresholds: [0, 10, 50, 200, 750, 2500, 10000, 25000, 50000, 100000],
  tierYieldBonus: [0, 0, 0, 0, 0, 0, 0.5, 1.0, 1.5, 2.0],
  tierNames: ['T1','T2','T3','T4','T5','T6','Mastered','T8','T9','Grandmaster'],
  stoneTierTimes: [4, 2, 1, 0.5, 0.25, 0.1],
  unlockAt: 1000,              // completions of resource N needed to unlock resource N+1 (~10 min early on)
  speedBonusCap: 0.5,          // tools + AGI + buffs, total

  // Gathering chain generation. xpGrowth is derived: level.g^levelStep / chainHoursGrowth,
  // so every chain paces like the ore chain (each step takes a little longer than the last).
  chainHoursGrowth: 1.08, maxReq: 97,
  chains: {
    mining:      { start: 4, end: 12, flatUntil: 5, valueGrowth: 1.7,  staminaEvery: 10 },
    woodcutting: { start: 3, end: 10, flatUntil: 4, valueGrowth: 1.75, staminaEvery: 10 },
    farming:     { start: 5, end: 14, flatUntil: 4, valueGrowth: 1.75, staminaEvery: 10 },
    fishing:     { start: 4, end: 12, flatUntil: 4, valueGrowth: 1.75, staminaEvery: 10 },
    herbalism:   { start: 3, end: 10, flatUntil: 4, valueGrowth: 1.75, staminaEvery: 10 },
    skinning:    { start: 5, end: 14, flatUntil: 3, valueGrowth: 2.2,  staminaEvery: 7 },
  },
  junkChance: 0.005,

  // Crafting
  craft: {
    baseTimeMin: 3, baseTimeMax: 10,      // base time scales with recipe level
    valueMult: 1.4, xpMult: 1.2,          // output value / xp vs. inputs
    extraChance: [0.25, 0.35, 0.45, 0.6], // T7..T10 chance of +50% output
    qualityNames: ['Crude', 'Normal', 'Fine', 'Superior', 'Masterwork'],
    qualityMult: [0.85, 1, 1.15, 1.3, 1.5],
    qualityCut: [0.15, 0.75, 0.95, 0.995], // cumulative roll thresholds
    qualityTierShift: 0.03, qualityIntShift: 0.0005,
  },
  enchant: {
    success: [1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2], // chance to go from +N to +N+1
    dropFrom: 5,             // failing at +5 or higher loses one level
    perPlus: 0.10,           // +10% item stats per level
    stoneFor: ['lesser_stone','lesser_stone','lesser_stone','greater_stone','greater_stone','greater_stone','grand_stone','grand_stone','grand_stone','mythic_stone'],
    goldCost: lvl => Math.round(50 * Math.pow(2.2, lvl)),
    wisBonus: 0.001,
    levelGapCap: 10,
  },
  food: { staminaCap: 3 },

  // Combat, travel, exploration (Phase 4)
  combat: {
    winAt: 0.0526, winK: 4,          // win chance = 1 / (1 + winAt * (rec/CP)^winK); 95% at CP = rec
    recNormal: 0.85, recHidden: 1.0, recBoss: 1.15, recTutorialBoss: 0.75, // enemy recommended power vs. a typical build of its level
    baseTime: 6, bossBase: 10, bossMinSec: 5,
    crushAt: 1.5,                    // v1.3: CP this far above the enemy's → fights take the 0.1 s floor (not bosses)
    dpsFrac: 0.02,                   // enemy damage per second, as a share of a typical player's HP at that level
    dmgExp: 1.5, lossDmgMult: 2,
    regenFight: 0.01, regenIdle: 0.02, regenVitBonus: 0.002, // per second, share of max HP
    autoEatAt: 0.5, defeatHpFrac: 0.25,
    xpBase: 1.5, xpGrowth: 1.138, goldBase: 0.6, goldGrowth: 1.2, bossXp: 4, bossGold: 5,
    archetype: { str: 0.25, vit: 0.25, dex: 0.15 }, // stat-point split used to scale enemies
  },
  travel: { perAgi: 0.002, cap: 0.5, fastBase: 40, fastGrowth: 1.8, encountersPerMin: 0.25 },
  explore: { target: 150, baseTime: 6, perBand: 1, areaAt: [0, 0.35, 0.75], hiddenAt: 0.5, chestChance: 0.03 },
  events: { minMin: 10, maxMin: 25 },

  // Storage & economy
  storage: { invSlots: 500, invHalf: 0.5, invGrowth: 6, bankSlots: 30, invUp: 10, bankUp: 15, invCost: [5000, 40000, 250000, 1.5e6, 9e6], invFirst: 2500, invStep: 1.2, bankCost: [2000, 20000, 150000, 1e6, 6e6, 3.5e7] },
  market: { saturation: 2500, floor: 0.15, halfLifeH: 2, dailySwing: 0.06 },
  // Prices rise with your level so gold stays meaningful as gathering income grows (~1.21x per level).
  // Shop items grow by priceGrowth per level from level 1 (never below 1.5x their sell value); upgrades/fees use the same index.
  economy: { priceGrowth: 1.19, supplyGrowth: 1.04, autoSellKeep: [0, 100, 1000, 10000, 100000],
    // Potion price at level 1 = unit x power^exp x hours. Stronger tiers cost disproportionately more,
    // so cheaper tiers stay worth buying. Then the level index above applies.
    potionUnit: { yield: 40000, xp: 40000, proc: 1500000, luck: 1200000, skill: 15000 }, potionExp: 1.8,
    buyQty: [1, 10, 100, 1000] },
  // Ascension: at max level of your final class tier, reset character level to 1 and keep everything else.
  talentShards: 10, // v3.0c: spare talent points per 1 Thousandium
  ascension: { needTier: 4, needLevel: 99, xp: 0.05, yield: 0.05, power: 0.03, shards: 10 },
  banker: { dailyRate: 0.01, cap: 5e6 },

  // Skill / character level curve: xp to go from L to L+1 = a * L^p * g^(L-1)
  level: { a: 60, p: 1.0, g: 1.17, over99: 1.03, max: 99, statPointsPerLevel: 20,
           skillPointsPerLevel: 1, skillPointsMilestone: 3, classGrowthPerLevel: 1, charXpShare: 0.4 },

  // Stat soft caps: [threshold, multiplier applied past it]
  softCaps: [[100, 0.75], [250, 0.5], [500, 0.25]],
  startStat: 10,
  maxCreationBonus: 2,

  // Stat effects (per effective point above the starting 10)
  fx: {
    agiSpeed: 0.001, agiSpeedCap: 0.30,
    strHeavyYield: 0.0015,
    luckStrikeBase: 0.01, luckStrike: 0.0004, luckTripleShare: 0.1,
    perBonusFind: 0.0005,
    wisXp: 0.002,
    charmDiscount: 0.001, charmDiscountCap: 0.25,
    luckDrop: 0.002,
  },

  // Stamina
  stamina: { base: 2, hardCap: 16, perAdvance: 5, costPerTen: 1 },

  // Yield additive pool soft cap (+300%)
  yieldPoolSoftCap: 3.0, yieldPoolOverflow: 0.25,

  // Dopamine
  richVein: { chancePerSec: 1 / 900, durationSec: 45, bonus: 1.0 },

  // Offline
  offline: { baseCapH: 8, maxCapH: 24, upgradeH: 2, upgradeCost: [2000, 15000, 80000, 400000, 2000000, 8000000, 30000000, 120000000] },

  // Respec
  respec: { baseCost: 500, growth: 2, freeEvery: 10, freeUntilLevel: 30 },

  // Market-ish
  sellMultiplier: 1.0,
};
