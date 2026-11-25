// ============================================================
// CLASSES — innate passives, talent trees, specializations, advancement.
// Mods are per rank. Keys: atk hp def crit critDmg dodge dmgTaken lifesteal fightSpeed regen loot gold xp
// gyield cyield potion sell discount travel explore stamina luckStrike bonusFind enchant quality
// stats{} skillYield{} skillSpeed{} skillLuck{} skillXp{}
// ============================================================
const INNATE = {
  warrior: { atk:.05, hp:.05 }, archer: { crit:.03, fightSpeed:.03 }, mage: { atk:.06, skillYield:{ alchemy:.05, enchanting:.05 } },
  rogue: { gold:.10, dodge:.02 }, necromancer: { lifesteal:.03, loot:.05 }, healer: { regen:.25, hp:.05 },
  farmer: { gyield:.10, skillYield:{ cooking:.10 } }, merchant: { sell:.10, gold:.05 }, beastmaster: { skillYield:{ skinning:.10 }, atk:.03 },
  alchemist: { potion:.15 }, bard: { xp:.05, luckStrike:.005 }, monk: { dodge:.03, fightSpeed:.03, regen:.15 },
  summoner: { atk:.04, explore:.05 }, runesmith: { skillYield:{ mining:.05, blacksmithing:.05, enchanting:.05 }, def:.05 },
  tidecaller: { skillYield:{ fishing:.10 }, def:.03 }, wayfinder: { bonusFind:.02, travel:.10, explore:.10 },
};
// Tier-1 trees: [name, ranks, mods, kind('active'|'cap'|''), note]. Prerequisites follow a fixed shape (see TREE_SHAPE).
const T1 = {
  warrior: [['Weapon Training',5,{atk:.03}],['Cleave',3,{atk:.04},'active','Spends Rage to strike everything in reach.'],['Iron Hide',5,{hp:.03}],['Battle Hardened',3,{dmgTaken:-.04}],['Whirlwind',3,{fightSpeed:.03},'active','A spinning flurry that ends fights sooner.'],['Unbreakable',1,{hp:.10,atk:.05},'cap']],
  archer: [['Steady Aim',5,{crit:.01}],['Power Shot',3,{atk:.05},'active','Spends Focus on a heavy, drawn-out shot.'],['Light Feet',5,{dodge:.01}],['Hawk Eye',3,{critDmg:.06}],['Multishot',3,{fightSpeed:.03},'active','Three arrows, one breath.'],['Dead Center',1,{crit:.05,critDmg:.20},'cap']],
  mage: [['Arcane Study',5,{atk:.03}],['Fireball',3,{atk:.05},'active','Spends Mana on a ball of fire.'],['Mana Shield',5,{dmgTaken:-.03}],['Scholar’s Focus',3,{skillYield:{alchemy:.03,enchanting:.03}}],['Chain Lightning',3,{fightSpeed:.03},'active','Lightning that jumps from foe to foe.'],['Archmagic',1,{atk:.12,xp:.05},'cap']],
  rogue: [['Quick Hands',5,{gold:.05}],['Backstab',3,{crit:.015},'active','Spends Energy to strike from behind.'],['Evasion',5,{dodge:.01}],['Pickpocket',3,{loot:.03}],['Fan of Knives',3,{fightSpeed:.03},'active','A spray of blades.'],['Perfect Heist',1,{gold:.15,loot:.10},'cap']],
  necromancer: [['Dark Arts',5,{atk:.03}],['Raise Dead',3,{atk:.04,hp:.02},'active','Spends Soul Fragments to raise a fallen foe to fight for you.'],['Soul Siphon',5,{lifesteal:.01}],['Grave Robbing',3,{loot:.03}],['Corpse Explosion',3,{fightSpeed:.03},'active','Your minions go out with a bang.'],['Lord of the Dead',1,{lifesteal:.05,atk:.08},'cap']],
  healer: [['Devotion',5,{regen:.10}],['Smite',3,{atk:.04},'active','Spends Faith on holy fire.'],['Blessed Skin',5,{hp:.03}],['Purity',3,{xp:.02}],['Mend',3,{lifesteal:.015},'active','Heals mid-fight.'],['Miracle',1,{hp:.10,regen:.40},'cap']],
  farmer: [['Green Thumb',5,{gyield:.03}],['Scythe Sweep',3,{atk:.05},'active','Spends Vigor on a wide, wicked swing.'],['Hardy Stock',5,{hp:.03}],['Good Soil',3,{skillYield:{farming:.05,herbalism:.03}}],['Harvest Moon',3,{gyield:.04},'active','Under the harvest moon, everything grows more.'],['Bountiful Earth',1,{gyield:.10,stamina:1},'cap']],
  merchant: [['Haggling',5,{sell:.03}],['Coin Toss',3,{gold:.05},'active','Spends Coin Sense to make the fight pay.'],['Shrewd Eye',5,{bonusFind:.003}],['Bulk Deals',3,{discount:.02}],['Golden Opportunity',3,{loot:.04},'active','Spots the valuable bits.'],['Monopoly',1,{sell:.10,gold:.15},'cap']],
  beastmaster: [['Animal Bond',5,{atk:.03}],['Maul',3,{atk:.04,crit:.01},'active','Spends Bond: your beast attacks with you.'],['Thick Pelt',5,{hp:.03}],['Tracker',3,{skillYield:{skinning:.05}}],['Pack Tactics',3,{fightSpeed:.03},'active','You and your beast flank as one.'],['Beast Lord',1,{atk:.08,hp:.08},'cap']],
  alchemist: [['Potent Brews',5,{potion:.04}],['Acid Flask',3,{atk:.05},'active','Spends Reagents on a thrown flask.'],['Toxin Resistance',5,{dmgTaken:-.03}],['Efficient Distilling',3,{skillYield:{alchemy:.05}}],['Volatile Mix',3,{fightSpeed:.03},'active','It is not supposed to fizz like that.'],['Philosopher’s Spark',1,{potion:.15,cyield:.05},'cap']],
  bard: [['Inspiring Tune',5,{xp:.02}],['Discord',3,{atk:.04},'active','Spends Inspiration on a jarring chord.'],['Lucky Melody',5,{luckStrike:.002}],['Silver Tongue',3,{sell:.03,discount:.01}],['Rousing Chorus',3,{gyield:.03},'active','Everyone works harder to a good tune.'],['Legendary Ballad',1,{xp:.08,luckStrike:.01},'cap']],
  monk: [['Iron Body',5,{hp:.03}],['Palm Strike',3,{atk:.05},'active','Spends Chi on a single perfect blow.'],['Flowing Step',5,{dodge:.01}],['Meditation',3,{regen:.10}],['Flurry',3,{fightSpeed:.04},'active','Too many blows to count.'],['Perfect Balance',1,{dodge:.04,fightSpeed:.05},'cap']],
  summoner: [['Binding Lore',5,{atk:.03}],['Summon Familiar',3,{atk:.04,hp:.02},'active','Spends Essence to call a spirit ally.'],['Ward Circle',5,{def:.04}],['Far Sight',3,{explore:.04}],['Elemental Burst',3,{fightSpeed:.03},'active','Your spirits detonate.'],['Grand Pact',1,{atk:.10,explore:.10},'cap']],
  runesmith: [['Rune Carving',5,{skillYield:{blacksmithing:.03,enchanting:.03}}],['Runic Strike',3,{atk:.05},'active','Spends Runes on a glowing blow.'],['Stone Skin',5,{def:.05}],['Steady Hand',3,{enchant:.02}],['Rune Burst',3,{atk:.03,fightSpeed:.02},'active','Every rune flares at once.'],['Living Rune',1,{def:.10,enchant:.05},'cap']],
  tidecaller: [['Ocean’s Gift',5,{skillYield:{fishing:.05}}],['Water Lash',3,{atk:.05},'active','Spends Tide on a whip of water.'],['Tidal Barrier',5,{dmgTaken:-.03}],['Undertow',3,{dodge:.01}],['Whirlpool',3,{fightSpeed:.03},'active','Pulls everything under.'],['Call of the Tide',1,{skillYield:{fishing:.10},hp:.08},'cap']],
  wayfinder: [['Pathsense',5,{travel:.04}],['Ambush',3,{crit:.015},'active','Spends Bearings to strike first.'],['Keen Senses',5,{bonusFind:.003}],['Mapmaker',3,{explore:.05}],['Hit and Run',3,{fightSpeed:.03},'active','In, out, gone.'],['Horizon Walker',1,{travel:.15,explore:.10},'cap']],
};
// Node i requires: [nodeIndex, rank] pairs. Capstone also needs a level.
const TREE_SHAPE = [[], [], [[0, 2]], [[2, 1]], [[1, 2]], [[0, 5], [4, 1]]];
const CAP_LEVEL = { 1: 20, 2: 40, 3: 75, 4: 99 };

// Specializations: [name, focus, signature skill, tier-3 name]
const SPECS = {
  warrior: [['Berserker','offense','Blood Frenzy','Warlord'],['Guardian','defense','Bulwark','Aegis Lord'],['Duelist','speed','Riposte','Blademaster']],
  archer: [['Sniper','offense','Deadeye Shot','Farsight'],['Ranger','speed','Volley','Wildwarden'],['Hunter','wealth','Trapper’s Snare','Apex Hunter']],
  mage: [['Elementalist','offense','Firestorm','Archmage of Storms'],['Arcanist','craft','Arcane Surge','Grand Arcanist'],['Spellblade','speed','Runic Edge','Spellsword Paragon']],
  rogue: [['Assassin','offense','Shadowstrike','Nightblade'],['Shadowdancer','defense','Vanish','Umbral Dancer'],['Swashbuckler','wealth','Plunder','Corsair King']],
  necromancer: [['Lich Scholar','magic','Soul Harvest','Archlich'],['Bone Lord','defense','Bone Wall','Ossuary King'],['Plague Doctor','support','Miasma','Grand Physician']],
  healer: [['Saint','support','Sanctuary','Living Saint'],['Cleric','defense','Holy Ward','High Cleric'],['Oracle','luck','Foresight','Voice of Fate']],
  farmer: [['Master Harvester','gather','Harvest Festival','Lord of Plenty'],['Beast Rancher','offense','Stampede','Herdmaster'],['Grove Warden','support','Rootbind','Greenheart']],
  merchant: [['Magnate','wealth','Golden Touch','Tycoon'],['Smuggler','luck','Hidden Cargo','Shadow Broker'],['Quartermaster','craft','Supply Line','Master of Coin']],
  beastmaster: [['Packlord','offense','Pack Hunt','Alpha'],['Wyrmtamer','defense','Wyrm Breath','Dragonlord'],['Wildspeaker','gather','Call of the Wild','Voice of the Wilds']],
  alchemist: [['Transmuter','craft','Transmute','Philosopher'],['Grenadier','offense','Flask Barrage','Bombardier'],['Apothecary','support','Elixir Rain','Master Apothecary']],
  bard: [['Skald','offense','War Chant','Saga-Singer'],['Troubadour','luck','Ballad of Fortune','Maestro'],['Warchanter','defense','Anthem of Iron','Voice of Legions']],
  monk: [['Iron Fist','offense','Hundred Fists','Grandmaster of Fists'],['Windwalker','speed','Gale Step','Stormwalker'],['Ascetic','support','Inner Peace','Enlightened One']],
  summoner: [['Conjurer','offense','Summon Elemental','Archconjurer'],['Spiritbinder','defense','Spirit Shield','Soulweaver'],['Stormcaller','speed','Call Lightning','Tempest Lord']],
  runesmith: [['Runeforger','craft','Runeforge','Master Runewright'],['Glyphguard','defense','Glyph of Warding','Living Bastion']],
  tidecaller: [['Stormherald','offense','Tidal Wave','Storm Sovereign'],['Deepwarden','gather','Call of the Deep','Abyssal Warden']],
  wayfinder: [['Pathfinder','speed','Trailblaze','Worldstrider'],['Cartographer','explore','Survey','Master Cartographer'],['Relic Hunter','luck','Treasure Sense','Grand Relic Hunter']],
};
const FOCUS_MODS = {
  offense: { main:{atk:.03}, active:{atk:.04,crit:.01}, util:{critDmg:.05}, apex:{atk:.10} },
  defense: { main:{hp:.03}, active:{dmgTaken:-.04}, util:{def:.04}, apex:{hp:.10,dmgTaken:-.05} },
  speed: { main:{fightSpeed:.02}, active:{atk:.03,dodge:.01}, util:{dodge:.01}, apex:{fightSpeed:.05,atk:.05} },
  wealth: { main:{gold:.05}, active:{loot:.04}, util:{sell:.03}, apex:{gold:.15,loot:.10} },
  magic: { main:{atk:.03}, active:{atk:.03,lifesteal:.01}, util:{cyield:.03}, apex:{atk:.08,xp:.05} },
  support: { main:{regen:.10}, active:{lifesteal:.015}, util:{xp:.02}, apex:{hp:.08,regen:.30} },
  luck: { main:{luckStrike:.003}, active:{loot:.04}, util:{bonusFind:.004}, apex:{luckStrike:.01,loot:.10} },
  gather: { main:{gyield:.03}, active:{gyield:.03}, util:{bonusFind:.004}, apex:{gyield:.10,stamina:1} },
  craft: { main:{cyield:.03}, active:{cyield:.03}, util:{potion:.03}, apex:{cyield:.10,quality:.03} },
  explore: { main:{explore:.03}, active:{travel:.04}, util:{bonusFind:.004}, apex:{explore:.10,travel:.10} },
};
const TIER_STATS = { 2: [10, 5], 3: [25, 15], 4: [60, 40] }; // [primary, secondary]
const TIER_LEVEL = { 2: 25, 3: 60, 4: 99 };
const TIER_FRAME = { 1: null, 2: '#c98a4b', 3: '#d6dde6', 4: '#ffd86b' };

// Advancement: [master, tier-2 region, tier-2 trial, tier-3 region, tier-3 trial, tier-4 trial, goal metric, goal amount, goal label]
const ADVANCE = {
  warrior: ['Blademaster Aldric','ironpeak','The Iron Champion','frost','Shieldmaiden Sigrun','The First Warrior','kills',300,'Win {n} fights'],
  archer: ['Ranger-Captain Elowen','woods','The Phantom Stag','desert','The Sandstorm Archer','The Last Arrow','kills',300,'Win {n} fights'],
  mage: ['Archmage Quill','ironpeak','The Animated Spellbook','void','The Rift Elemental','The Unwritten Spell','magicCraft',120,'Brew or imbue {n} times'],
  rogue: ['The Grey Whisper','woods','Your Shadow Double','desert','The Master of Masks','The Faceless','goldEarned',20000,'Earn {n} gold'],
  necromancer: ['Morwen of the Barrow','woods','The Barrow King','marsh','The Drowned Lich','Death’s Herald','kills',400,'Win {n} fights'],
  healer: ['Mother Seraphine','emberfall','The Plague Spirit','frost','The Frozen Martyr','The Final Sickness','potions',20,'Use {n} potions or meals'],
  farmer: ['Granny Hollis','emberfall','The Giant Pumpkin','marsh','The Blight Treant','The Hungry Year','skill:farming',3000,'Harvest {n} crops'],
  merchant: ['Guildmaster Orsolo','ironpeak','The Golden Golem','desert','The Djinn of Debts','The Market Itself','goldEarned',50000,'Earn {n} gold'],
  beastmaster: ['Wildmother Kesh','woods','The Alpha Direwolf','frost','The Ice Mammoth','The First Beast','skill:skinning',2000,'Skin {n} hides'],
  alchemist: ['Doctor Vell','emberfall','The Living Reagent','marsh','The Toxic Homunculus','The Great Work','skill:alchemy',250,'Brew {n} potions'],
  bard: ['Maestro Lirien','woods','The Echo Wraith','desert','The Song-Eater','The Silence','skill:exploration',400,'Explore {n} times'],
  monk: ['Abbot Toma','ironpeak','The Stone Sentinel','frost','The Ice Monk','Your Own Shadow','kills',300,'Win {n} fights'],
  summoner: ['Seer Ondra','woods','The Unbound Spirit','void','The Rift Titan','The Great Elemental','skill:exploration',400,'Explore {n} times'],
  runesmith: ['Forgemaster Bryn','ironpeak','The Rune Golem','frost','The Glacier Forge Guardian','The Unwritten Rune','skill:blacksmithing',250,'Forge {n} items'],
  tidecaller: ['Tidemother Nalu','woods','The River Serpent','marsh','The Bog Leviathan','The Endless Tide','skill:fishing',3000,'Catch {n} fish'],
  wayfinder: ['Old Compass Jory','woods','The Lost Wanderer','desert','The Mirage Guardian','The Edge of the Map','skill:exploration',600,'Explore {n} times'],
};
const ADVANCE_GOAL_MULT = { 2: 1, 3: 8, 4: 30 };

// Career trees (one per skill) and the general tree.
function careerTree(s) {
  const N = SKILLS[s].name, combat = s === 'slaying', explore = s === 'exploration';
  if (s === 'beastmastery') return [[`Efficient ${N}`, 5, { petPower:.03 }], [`Swift ${N}`, 3, { eggFind:.10 }], [`Lucky ${N}`, 3, { luckStrike:.002 }], [`${N} Mastery`, 1, { petPower:.10 }, 'cap', `Needs ${N} level 50.`]];
  return [
    [`Efficient ${N}`, 5, combat ? { loot:.03 } : explore ? { explore:.03 } : { skillYield:{ [s]:.02 } }],
    [`Swift ${N}`, 3, combat ? { fightSpeed:.02 } : { skillSpeed:{ [s]:.02 } }],
    [`Lucky ${N}`, 3, combat ? { gold:.04 } : { skillLuck:{ [s]:.005 } }],
    [`${N} Mastery`, 1, combat ? { atk:.05, loot:.05 } : explore ? { explore:.10, travel:.05 } : { skillYield:{ [s]:.10 }, skillXp:{ [s]:.05 } }, 'cap', `Needs ${N} level 50.`],
  ];
}
const CAREER_SHAPE = [[], [[0, 2]], [[0, 2]], [[0, 5]]];
const GENERAL_TREE = [
  ['Toughness', 5, { hp:.02 }], ['Fortune', 5, { luckStrike:.002 }], ['Scholar', 5, { xp:.02 }], ['Haggler', 3, { sell:.03 }],
  ['Wanderer', 3, { travel:.05 }], ['Endurance', 2, { stamina:1 }, 'cap', 'Rank 1 at level 30, rank 2 at level 60.'], ['Night Watch', 2, { offlineH:1 }],
];
const GENERAL_SHAPE = [[], [], [], [], [], [[0, 3]], [[2, 2]]];
const MOD_LABELS = { atk:'attack', hp:'max HP', def:'defense', crit:'crit chance', critDmg:'crit damage', dodge:'dodge', dmgTaken:'damage taken', lifesteal:'life steal', fightSpeed:'fight speed', regen:'HP regen', loot:'rare drop chance', gold:'gold from fights', xp:'XP', gyield:'gathering yield', cyield:'crafting output', potion:'potion strength', sell:'sell prices', discount:'shop discount', travel:'travel speed', explore:'exploration speed', stamina:'Stamina', luckStrike:'Lucky Strike', bonusFind:'bonus find', enchant:'upgrade success', quality:'craft quality', offlineH:'hour offline cap', petPower:'pet strength', eggFind:'egg find chance' };
