// ============================================================
// PETS (Phase 8)
// ============================================================
const PET_RARITY = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const PET_RARITY_MULT = [1, 1.5, 2.2, 3, 4];
const PET_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
const PET_TAG_COLOR = { Fire:'#e8572e', Water:'#3b82c4', Flying:'#9ec9ef', Ground:'#9a7b4f', Beast:'#b07a4a', Mystic:'#a77be0', Frost:'#a7e3f2' };
const PERSONALITIES = [
  ['Brave', { atk:.02 }], ['Lazy', { offlineH:1 }], ['Greedy', { gold:.04 }], ['Curious', { explore:.04 }],
  ['Playful', { xp:.02 }], ['Proud', { hp:.03 }], ['Lucky', { luckStrike:.003 }], ['Diligent', { gyield:.02 }],
];
// Species: id: [name, rarity, size, tags, region|null, boost (per rarity-1, level 1), combat ability (active only), evolve [to, level], desc]
const SPECIES = {
  ember_mouse: ['Ember Mouse', 0, 0, ['Fire'], 'emberfall', { skillYield:{ mining:.04 } }, { crit:.01 }, null, 'Nests in warm forge ash.'],
  pebble_tortoise: ['Pebble Tortoise', 0, 1, ['Ground'], 'emberfall', { def:.04 }, { dmgTaken:-.03 }, null, 'Mistaken for a rock. Often.'],
  moss_sprite: ['Moss Sprite', 0, 0, ['Mystic'], 'woods', { xp:.03 }, { regen:.08 }, null, 'Hums when it is happy.'],
  lantern_moth: ['Lantern Moth', 0, 0, ['Flying'], 'woods', { explore:.05 }, { dodge:.01 }, null, 'Glows faintly at dusk.'],
  tunnel_mole: ['Tunnel Mole', 0, 1, ['Ground'], 'ironpeak', { skillYield:{ mining:.05 } }, { atk:.02 }, null, 'Digs faster than you. Smugly.'],
  marsh_frog: ['Marsh Frog', 0, 0, ['Water'], 'marsh', { skillYield:{ fishing:.05 } }, { regen:.08 }, null, 'Catches flies, and sometimes fish.'],
  sand_gecko: ['Sand Gecko', 0, 0, ['Fire'], 'desert', { gold:.05 }, { crit:.01 }, null, 'Licks its own eyes. Finds coins.'],
  snow_hare: ['Snow Hare', 0, 1, ['Frost'], 'frost', { fightSpeed:.02 }, { dodge:.015 }, null, 'Disappears against fresh snow.'],
  hedgehog: ['Hedgehog', 0, 0, ['Beast'], null, { loot:.03 }, { dmgTaken:-.02 }, null, 'Rolls up when startled, and when not.'],
  barn_cat: ['Barn Cat', 0, 1, ['Beast'], null, { luckStrike:.003 }, { crit:.01 }, null, 'Owns you now.'],
  ash_fox: ['Ash Fox', 1, 1, ['Fire', 'Beast'], 'emberfall', { atk:.03 }, { crit:.015 }, ['cinder_fox', 20], 'Leaves sooty pawprints everywhere.'],
  cinder_fox: ['Cinder Fox', 1, 2, ['Fire', 'Beast'], null, { atk:.05 }, { crit:.025, critDmg:.10 }, null, 'Its tail smoulders like a coal.'],
  owlet: ['Owlet', 1, 1, ['Flying'], 'woods', { xp:.04 }, { crit:.01 }, ['great_owl', 20], 'Judges you silently.'],
  great_owl: ['Great Horned Owl', 1, 2, ['Flying'], null, { xp:.06, explore:.03 }, { crit:.02 }, null, 'Judges you silently, but wiser.'],
  stone_pup: ['Stone Pup', 1, 2, ['Ground', 'Beast'], 'ironpeak', { def:.05 }, { dmgTaken:-.03 }, ['golem_hound', 25], 'Its bark sounds like falling gravel.'],
  golem_hound: ['Golem Hound', 1, 3, ['Ground', 'Beast'], null, { def:.08, hp:.03 }, { dmgTaken:-.05 }, null, 'Large enough to ride. Grudgingly allows it.'],
  bog_turtle: ['Bog Turtle', 1, 2, ['Water'], 'marsh', { hp:.04 }, { regen:.12 }, ['shellback', 25], 'Older than the outpost.'],
  shellback: ['Shellback', 1, 3, ['Water', 'Ground'], null, { hp:.07 }, { regen:.18, dmgTaken:-.03 }, null, 'Carries a small garden on its shell.'],
  scorpling: ['Dune Scorpling', 1, 1, ['Fire'], 'desert', { crit:.01, gold:.03 }, { crit:.02 }, ['sand_stalker', 25], 'Pinches, affectionately.'],
  sand_stalker: ['Sand Stalker', 1, 2, ['Fire'], null, { crit:.02, gold:.05 }, { crit:.03, critDmg:.10 }, null, 'Hunts by the heat of a heartbeat.'],
  frost_fox: ['Frost Fox', 1, 1, ['Frost', 'Beast'], 'frost', { dodge:.01 }, { dodge:.02 }, ['glacier_fox', 20], 'Its breath leaves frost on your sleeve.'],
  glacier_fox: ['Glacier Fox', 1, 2, ['Frost', 'Beast'], null, { dodge:.02, fightSpeed:.02 }, { dodge:.03 }, null, 'Moves like snowfall.'],
  wyrmling: ['Wyrmling', 2, 1, ['Fire', 'Flying'], 'chasm', { atk:.03, gyield:.02 }, { atk:.03 }, ['drake', 20], 'Hiccups sparks.'],
  drake: ['Drake', 2, 3, ['Fire', 'Flying'], null, { atk:.05, gyield:.03 }, { atk:.05, crit:.01 }, ['elder_dragon', 40], 'Strong enough to carry you, if it wants to.'],
  elder_dragon: ['Elder Dragon', 2, 4, ['Fire', 'Flying'], null, { atk:.08, gyield:.05 }, { atk:.08, crit:.02, critDmg:.15 }, null, 'The sky goes quiet when it flies.'],
  dire_pup: ['Dire Wolf Pup', 2, 2, ['Beast'], 'woods', { atk:.04 }, { atk:.03 }, ['dire_wolf', 25], 'All paws and appetite.'],
  dire_wolf: ['Dire Wolf', 2, 3, ['Beast'], null, { atk:.06, travel:.05 }, { atk:.05, crit:.01 }, null, 'Runs all night without tiring.'],
  griffin_chick: ['Griffin Chick', 2, 1, ['Flying', 'Beast'], 'ironpeak', { travel:.05 }, { crit:.015 }, ['griffin', 25], 'Half eagle, half kitten, all trouble.'],
  griffin: ['Griffin', 2, 3, ['Flying', 'Beast'], null, { travel:.08, atk:.03 }, { crit:.025 }, null, 'Proud, loyal, and an excellent mount.'],
  ghost_wisp: ['Ghost Wisp', 2, 0, ['Mystic'], 'void', { loot:.05 }, { loot:.05 }, ['spectral_lantern', 25], 'Leads you to treasure, then giggles.'],
  spectral_lantern: ['Spectral Lantern', 2, 1, ['Mystic', 'Flying'], null, { loot:.08 }, { loot:.08 }, null, 'Its light shows what others miss.'],
  crystal_tortoise: ['Crystal Tortoise', 2, 2, ['Ground', 'Mystic'], 'ironpeak', { enchant:.02, def:.04 }, { dmgTaken:-.04 }, null, 'Its shell is a geode.'],
  pegasus_foal: ['Pegasus Foal', 3, 2, ['Flying'], 'frost', { travel:.06, xp:.03 }, { dodge:.02 }, ['pegasus', 30], 'Wobbly wings, big dreams.'],
  pegasus: ['Pegasus', 3, 3, ['Flying'], null, { travel:.10, xp:.05 }, { dodge:.03, fightSpeed:.02 }, null, 'Carries you above the clouds.'],
  whale_calf: ['Sky Whale Calf', 3, 3, ['Flying', 'Water'], 'void', { gyield:.04, offlineH:1 }, { regen:.15 }, ['sky_whale', 35], 'Sings in a voice you feel in your ribs.'],
  sky_whale: ['Sky Whale', 3, 4, ['Flying', 'Water'], null, { gyield:.06, offlineH:2 }, { regen:.25, hp:.05 }, null, 'A floating island that loves you.'],
  phoenix_chick: ['Phoenix Chick', 3, 1, ['Fire', 'Flying'], 'desert', { regen:.10, xp:.03 }, { regen:.20 }, ['phoenix', 35], 'Warm as a hearth, light as ash.'],
  phoenix: ['Phoenix', 3, 3, ['Fire', 'Flying'], null, { regen:.15, xp:.05 }, { regen:.35, hp:.05 }, null, 'Every dawn it burns, and every dawn it returns.'],
  kirin_foal: ['Kirin Foal', 3, 2, ['Mystic', 'Beast'], 'woods', { luckStrike:.004, loot:.03 }, { loot:.04 }, ['kirin', 30], 'Flowers bloom where it steps.'],
  kirin: ['Kirin', 3, 3, ['Mystic', 'Beast'], null, { luckStrike:.006, loot:.05 }, { loot:.06, crit:.01 }, null, 'Only appears to the kind-hearted.'],
  roc_hatchling: ['Roc Hatchling', 4, 2, ['Flying'], 'chasm', { travel:.08, atk:.03 }, { atk:.04 }, ['roc', 40], 'Already bigger than a horse.'],
  roc: ['Roc', 4, 4, ['Flying'], null, { travel:.12, atk:.06 }, { atk:.07, crit:.02 }, null, 'It carries off elephants. Carefully, it carries you.'],
  world_turtle: ['World Turtle Hatchling', 4, 3, ['Ground', 'Water'], 'chasm', { hp:.06, offlineH:2 }, { dmgTaken:-.06 }, ['great_turtle', 40], 'There is a tiny forest on its back.'],
  great_turtle: ['World Turtle', 4, 4, ['Ground', 'Water'], null, { hp:.10, offlineH:3 }, { dmgTaken:-.10, regen:.20 }, null, 'Some say the world rests on one like it.'],
  star_serpent: ['Star Serpent', 4, 2, ['Mystic', 'Flying'], 'void', { xp:.05, gyield:.04 }, { crit:.02, loot:.04 }, ['celestial_serpent', 40], 'Its scales hold constellations.'],
  celestial_serpent: ['Celestial Serpent', 4, 4, ['Mystic', 'Flying'], null, { xp:.08, gyield:.06 }, { crit:.03, loot:.06 }, null, 'Coils around the moon when no one is watching.'],
  // Hybrids (breeding only)
  steam_kit: ['Steam Kit', 2, 1, ['Fire', 'Water'], null, { regen:.10, atk:.03 }, { regen:.15 }, null, 'A hissing, cheerful little cloud with paws.', true],
  rimecat: ['Rimecat', 2, 2, ['Frost', 'Beast'], null, { crit:.015, dodge:.015 }, { crit:.02, dodge:.02 }, null, 'Purrs like cracking ice.', true],
  thunderbird: ['Thunderbird', 3, 3, ['Flying', 'Mystic'], null, { fightSpeed:.04, explore:.05 }, { atk:.05, fightSpeed:.03 }, null, 'Every wingbeat is thunder.', true],
  wyvern: ['Wyvern', 3, 3, ['Fire', 'Ground'], null, { atk:.05, def:.05 }, { atk:.05, dmgTaken:-.04 }, null, 'A dragon’s stubborn cousin.', true],
};
const HYBRIDS = [[['Fire', 'Water'], 'steam_kit'], [['Frost', 'Beast'], 'rimecat'], [['Flying', 'Mystic'], 'thunderbird'], [['Fire', 'Ground'], 'wyvern']];
const COMBOS = [
  { id:'steam', name:'Steam Burst', tags:['Fire', 'Frost'], mods:{ atk:.05 }, text:'Fire and Frost together: +5% attack.' },
  { id:'storm', name:'Storm Front', tags:['Water', 'Flying'], mods:{ travel:.05, explore:.05 }, text:'Water and Flying together: faster travel and exploring.' },
  { id:'spirit', name:'Spirit Hunt', tags:['Beast', 'Mystic'], mods:{ loot:.05 }, text:'Beast and Mystic together: more rare drops.' },
  { id:'earthsky', name:'Sky and Earth', tags:['Ground', 'Flying'], mods:{ gyield:.04 }, text:'Ground and Flying together: more gathering yield.' },
];
// Eggs
const EGGS = {
  egg_common: { name:'Common Egg', rarity:0, mins:10, actions:2000 }, egg_rare: { name:'Rare Egg', rarity:1, mins:30, actions:6000 },
  egg_epic: { name:'Epic Egg', rarity:2, mins:120, actions:20000 }, egg_legendary: { name:'Legendary Egg', rarity:3, mins:360, actions:60000 },
  egg_mythic: { name:'Mythic Egg', rarity:4, mins:720, actions:120000 },
};
const EGG_ROLL = [0.70, 0.22, 0.06, 0.018, 0.002];
const PET_CFG = { eggPerCompletion: 1 / 50000, maxLevel: 50, costBase: 40, costGrowth: 1.18, activeXp: 0.10, supportXp: 0.05, supportMult: 0.35, hungerPerMin: 0.1, feed: 25, incubCost: [5000, 50000, 400000, 3000000], daycareSlots: 2, daycareHours: [1, 4, 8], breedCost: 50000, breedCooldownH: 12, breedLevel: 20, mountGround: 0.25, mountFlying: 0.40, mountCapBonus: 0.25 };
const SUPPORT_UNLOCK = [10, 30, 60, 90];
const PET_HATS = [['party_hat', 'Party Hat', 5000], ['wizard_hat', 'Wizard Hat', 20000], ['flower_crown', 'Flower Crown', 20000], ['pirate_hat', 'Pirate Hat', 60000], ['tiny_crown', 'Tiny Crown', 200000]];
const PET_AURAS = [['ember', 'Ember Aura', 5, '#ff6b3d'], ['frost', 'Frost Aura', 5, '#9fe2f2'], ['starlight', 'Starlight Aura', 10, '#ffe08a'], ['void', 'Void Aura', 10, '#a77be0']];
const COLLECTION_STEPS = [0.25, 0.5, 0.75, 1];
const COLLECTION_BONUS = { pets: { gyield:.02 }, monsters: { loot:.02 }, items: { xp:.02 }, regions: { travel:.04 } };

for (const [id, e] of Object.entries(EGGS)) ITEMS[id] = { name: e.name, type: 'egg', rarity: e.rarity, value: [200, 2000, 15000, 80000, 400000][e.rarity], desc: `Hatches in an incubator after ${e.mins >= 60 ? e.mins / 60 + ' hours' : e.mins + ' minutes'} or ${e.actions.toLocaleString()} of your actions, whichever comes first.` };
for (const r of ['emberfall', 'woods', 'ironpeak', 'marsh', 'desert', 'frost', 'void', 'chasm']) ITEMS['egg_' + r] = { name: `${r === 'emberfall' ? 'Emberfall' : r === 'woods' ? 'Woodland' : r === 'ironpeak' ? 'Mountain' : r === 'marsh' ? 'Marsh' : r === 'desert' ? 'Desert' : r === 'frost' ? 'Frost' : r === 'void' ? 'Void' : 'Chasm'} Egg`, type: 'egg', rarity: 1, value: 3000, region: r, desc: 'Hatches into a creature from its region. Usually common, sometimes not.' };
for (const [id, s] of Object.entries(SPECIES)) if (s[9]) ITEMS['egg_h_' + id] = { name: `${s[0]} Egg`, type: 'egg', rarity: s[1], value: 20000, species: id, desc: `A hybrid egg. It will hatch into a ${s[0]}.` };
SHOP.eggs = ['egg_common', 'egg_rare'];
ITEMS.egg_common.cost = 2000; ITEMS.egg_rare.cost = 20000;
SHARD_SHOP.push({ key: 'egg_epic', price: 20 }, { key: 'egg_legendary', price: 60 });

ACHIEVEMENTS.push(
  { id:'pet1', cat:'Pets', name:'New Friend', desc:'Hatch your first pet.', pts:5, goal:1, stat:'hatched' },
  { id:'pet10', cat:'Pets', name:'Menagerie', desc:'Discover 10 species.', pts:15, goal:10, stat:'species' },
  { id:'pet30', cat:'Pets', name:'Living Bestiary', desc:'Discover 30 species.', pts:50, goal:30, stat:'species' },
  { id:'petmythic', cat:'Pets', name:'Mythic Companion', desc:'Hatch a Mythic pet.', pts:50, goal:1, stat:'mythicPet' },
  { id:'petevolve', cat:'Pets', name:'Growing Up', desc:'Evolve a pet.', pts:10, goal:1, stat:'evolved' },
  { id:'mount', cat:'Pets', name:'Saddle Up', desc:'Ride a mount.', pts:15, goal:1, stat:'mounted' },
  { id:'combo', cat:'Secrets', name:'???', real:'Perfect Pair', desc:'Discover a pet combo.', pts:15, goal:1, stat:'combos', hidden:true },
  { id:'hybrid', cat:'Pets', name:'Mad Science', desc:'Breed a hybrid egg.', pts:25, goal:1, stat:'bred' },
  { id:'coll50', cat:'Exploration', name:'Collector', desc:'Reach 50% in every collection.', pts:50, goal:50, stat:'collMin' },
);
