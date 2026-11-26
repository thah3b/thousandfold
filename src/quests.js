// ============================================================
// PHASE 7 — elixirs, training, region stories, quest boards, shard exchange
// ============================================================
// Elixirs of Growth: [stat, name, grade-1 trophy, grade-1 herb, grade-3 trophy, grade-3 herb]
const ELIXIR_DEFS = [
  ['STR', 'Might', 'troll_tusk', 'bloodroot', 'rime_tusk', 'phoenix_fern'],
  ['INT', 'Insight', 'sprite_dust', 'moonpetal', 'djinn_smoke', 'dreamshade'],
  ['DEX', 'Precision', 'harpy_feather', 'silverleaf', 'scorpion_stinger', 'voidbloom'],
  ['AGI', 'Swiftness', 'gray_wolf_fang', 'sunbloom', 'frost_fang', 'spirit_lotus'],
  ['VIT', 'Fortitude', 'dire_tusk', 'ghostcap', 'yeti_fur', 'elysian_lily'],
  ['WIS', 'Clarity', 'living_bark', 'moonpetal', 'ancient_linen', 'dreamshade'],
  ['LUCK', 'Fortune', 'goblin_ear', 'silverleaf', 'wyrm_scale', 'phoenix_fern'],
  ['CHARM', 'Grace', 'sprite_dust', 'sunbloom', 'djinn_smoke', 'elysian_lily'],
  ['PER', 'Sight', 'golem_core', 'ghostcap', 'giants_rime', 'voidbloom'],
];
const ELIXIR_GRADES = [['', 1, 2], ['Greater ', 3, 3], ['Mythic ', 8, 5]]; // [prefix, stat points, rarity]
const ELIXIR_CAP = 150;           // most points any one stat can get from elixirs
for (const [stat, nm] of ELIXIR_DEFS) ELIXIR_GRADES.forEach(([pre, pts, rar], g) => {
  ITEMS[`elixir_${stat.toLowerCase()}_${g}`] = { name: `${pre}Elixir of ${nm}`, type: 'elixir', stat, grade: g, pts, rarity: rar, value: [400, 6000, 60000][g],
    desc: `Permanently +${pts} ${stat}, less as you near the ${ELIXIR_CAP}-point elixir cap for ${stat}.` };
});

// Training: one idle activity per stat. Each completion adds a sliver of the stat, up to a daily cap.
const TRAINING = [
  ['STR', 'Weight Lifting', 'Lift the smithy’s anvils. Slowly.'], ['INT', 'Study', 'Borrow books from the town archive.'],
  ['DEX', 'Target Practice', 'Knives at a straw target.'], ['AGI', 'Sprints', 'Up and down the town walls.'],
  ['VIT', 'Endurance Runs', 'Long runs in heavy boots.'], ['WIS', 'Meditation', 'Sit very still. Harder than it sounds.'],
  ['LUCK', 'Dice Games', 'Lose a little, learn a lot.'], ['CHARM', 'Tavern Storytelling', 'Win the room with a good tale.'],
  ['PER', 'Lookout Duty', 'Watch the road from the bell tower.'],
];
const TRAIN_CFG = { baseTime: 5, perCompletion: 0.01, dailyCap: 5 };

// Region story chains: 3 quests each. Goal types: explore (fraction), hunt (wins vs any normal enemy here), boss.
const REGION_STORY = {
  emberfall: ['STR', ['The Smoke on the Hill', 'Elder Brannoch wants the hollow mapped before the next ash storm.'], ['Hogs and Highwaymen', 'Farmers are losing pigs and purses. Thin out the wilds.'], ['The Burning Ram', 'Cinderhorn has come down from the hollow. End it before it reaches the forge.']],
  woods: ['WIS', ['Lanterns in the Dark', 'Warden Ilsabet asks you to relight the path lanterns deep in the forest.'], ['Too Many Teeth', 'The wolves have grown bold. Remind them who walks these woods.'], ['Tears of the Glade', 'The Weeping Dryad heals every wound but her own. Put her to rest.']],
  ironpeak: ['VIT', ['The Ringing Mountain', 'Foreman Dagna needs the deep galleries charted.'], ['Goblin Trouble', 'Goblins are stealing ore carts. Make them stop.'], ['The King Under Stone', 'Gorrak claims the whole mountain. Disagree with him, firmly.']],
  marsh: ['LUCK', ['Charting the Reeds', 'Ferryman Orrin’s maps are mostly guesses. Make them less so.'], ['Things in the Water', 'Something keeps eating the fishing boats. Hunt it.'], ['Get Off His Swamp', 'Grumbo the Bog Ogre wants everyone gone. Persuade him otherwise.']],
  desert: ['INT', ['The Buried Avenue', 'Caravaneer Saffi heard of a road beneath the dunes. Find it.'], ['Sand and Stingers', 'Caravans won’t move until the dunes are safe.'], ['The King Who Would Not Die', 'The Sandbound King’s curse reaches the oasis. Break it.']],
  frost: ['AGI', ['Footprints in the Ice', 'Huntress Velka follows tracks into the ice wall. Go with her.'], ['The Long Winter Hunt', 'The lodge needs meat and safety. Hunt the snowfields.'], ['The Frost Jarl', 'Hrimvald wants the hamlet as his footstool. Topple his throne.']],
  void: ['PER', ['The Edge of Everything', 'The keeper of the Last Lantern wants to know how far the Rift goes.'], ['Things That Blink', 'Stalkers creep toward the lantern. Push them back.'], ['A Crown of Nothing', 'The Hollow Sovereign rules emptiness. Show it what is real.']],
  chasm: ['CHARM', ['Down to the Heart', 'The smiths of Deepforge want the Root Halls mapped.'], ['Old Giants', 'Titans and wyrms stir in the deep. Keep them below.'], ['The Warden of the World', 'The Warden guards the world’s heart. Prove you are worthy of it.']],
};
const STORY_GOALS = [{ type: 'explore', frac: 0.5 }, { type: 'hunt', n: 100 }, { type: 'boss' }];
const STORY_REWARD = { stat: 2, gold: 2000 };

// Quest board (per town). Daily: 3 offers, weekly: 2 offers. Rewards scale with level.
const BOARD = { daily: 3, weekly: 2, maxActive: 6, dailyGold: 1500, weeklyGold: 15000, dailyShards: 1, weeklyShards: 5, weeklyElixirChance: 1 };
// Thousandium exchange (earn-only currency).
const SHARD_SHOP = [
  ...ELIXIR_DEFS.map(([stat]) => ({ key: `elixir_${stat.toLowerCase()}_2`, price: 30 })),
  { key: 'satchel', price: 15 }, { key: 'potion_prod5', price: 8 }, { key: 'enlightenment', price: 8 },
];

ACHIEVEMENTS.push(
  { id:'daily10', cat:'Exploration', name:'Odd Jobs', desc:'Complete 10 board quests.', pts:10, goal:10, stat:'boardDone' },
  { id:'daily100', cat:'Exploration', name:'Pillar of the Community', desc:'Complete 100 board quests.', pts:25, goal:100, stat:'boardDone' },
  { id:'weekly10', cat:'Exploration', name:'Week In, Week Out', desc:'Complete 10 weekly quests.', pts:25, goal:10, stat:'weeklyDone' },
  { id:'story1', cat:'Exploration', name:'Local Hero', desc:'Finish a region’s story.', pts:15, goal:1, stat:'storiesDone' },
  { id:'story8', cat:'Exploration', name:'Hero of the Realm', desc:'Finish every region’s story.', pts:100, goal:8, stat:'storiesDone' },
  { id:'elixir1', cat:'Crafting', name:'Growing Pains', desc:'Drink an Elixir of Growth.', pts:5, goal:1, stat:'elixirs' },
  { id:'elixir100', cat:'Crafting', name:'Bottled Greatness', desc:'Drink 100 Elixirs of Growth.', pts:25, goal:100, stat:'elixirs' },
  { id:'train50', cat:'Gathering', name:'No Pain, No Gain', desc:'Gain 50 stat points from training.', pts:15, goal:50, stat:'trainedPts' },
  { id:'titles10', cat:'Exploration', name:'Many Names', desc:'Earn 10 titles.', pts:15, goal:10, stat:'titlesEarned' },
  { id:'titles40', cat:'Exploration', name:'Name Collector', desc:'Earn 40 titles.', pts:50, goal:40, stat:'titlesEarned' },
  { id:'gm5', cat:'Gathering', name:'Five Grandmasteries', desc:'Reach Grandmaster on 5 things.', pts:50, goal:5, stat:'grand' },
  { id:'shards50', cat:'Economy', name:'Shard Hoarder', desc:'Earn 50 Thousandium.', pts:15, goal:50, stat:'shardsEarned' },
);
