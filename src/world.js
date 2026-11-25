// ============================================================
// WORLD — regions, map, enemies, loot, unique gear, tutorials, events.
// Enemy power and rewards are filled in by the engine from BALANCE.combat.
// ============================================================
const REGIONS = [
  { id:'emberfall', name:'Emberfall Village', band:0, lvl:1, x:250, y:250, town:'Emberfall Square', priceMult:1.00, perReq:20,
    desc:'Forge smoke, warm stone and the first steps of every adventurer.', areas:['Village Outskirts','Ashen Fields','Cinder Hollow'] },
  { id:'woods', name:'Whispering Woods', band:1, lvl:8, x:200, y:120, town:'Lanternbough', priceMult:0.97, perReq:30,
    desc:'A forest that talks back, lit by lanterns hung in the canopy.', areas:['Lantern Path','Mossdeep','The Weeping Glade'] },
  { id:'ironpeak', name:'Ironpeak Mountains', band:2, lvl:16, x:390, y:95, town:'Bellhold', priceMult:1.02, perReq:45,
    desc:'Switchback camps under a mountain that rings like a bell.', areas:['Switchback Trail','The Deep Galleries','King’s Hall'] },
  { id:'marsh', name:'Sunken Marsh', band:3, lvl:26, x:180, y:370, town:'Stiltwater', priceMult:0.95, perReq:60,
    desc:'Stilt houses, slow boats, and something big past the reeds.', areas:['Reedways','The Drowned Grove','A Very Smelly Hut'] },
  { id:'desert', name:'Ashen Desert', band:4, lvl:36, x:520, y:300, town:'Glassmarket', priceMult:1.05, perReq:80,
    desc:'Black glass dunes around an oasis market that never closes.', areas:['Glass Dunes','The Buried Avenue','Tomb of the Sandbound'] },
  { id:'frost', name:'Frostspire', band:5, lvl:48, x:320, y:20, town:'Rimehall', priceMult:1.08, perReq:100,
    desc:'Smoke-blackened lodges beneath a spire of blue ice.', areas:['Snowfield','The Ice Caves','Jarl’s Throne'] },
  { id:'void', name:'Void Rift', band:6, lvl:60, x:640, y:150, town:'The Last Lantern', priceMult:1.15, perReq:130,
    desc:'Where the sky has a crack in it, and the crack is listening.', areas:['The Edge','Unmade Fields','The Hollow Court'] },
  { id:'chasm', name:'Worldheart Chasm', band:7, lvl:74, x:430, y:420, town:'Deepforge', priceMult:1.2, perReq:170,
    desc:'A wound in the world that goes down to its beating heart.', areas:['Magma Steps','The Root Halls','The Heartchamber'] },
];
const REGION_BY = Object.fromEntries(REGIONS.map(r => [r.id, r]));
// Travel graph: [a, b, minutes]
const ROUTES = [['emberfall','woods',2],['emberfall','marsh',2],['emberfall','desert',4],['woods','ironpeak',3],['woods','frost',5],['ironpeak','frost',4],['ironpeak','desert',4],['marsh','desert',4],['marsh','chasm',8],['desert','void',6],['frost','void',7],['void','chasm',8],['desert','chasm',6]];
// Starting hamlets live inside a world region.
const START_TO_REGION = { emberfall:'emberfall', woods:'woods', ironpeak:'ironpeak', marsh:'marsh', oasis:'desert', frost:'frost' };

// ---- Enemies: [name, level, flavour, trophy material, extra drop (resource id) or '', role]
// role: '' normal, 'hidden' (rare, needs Perception + exploration), 'boss'. Area index = position.
const ENEMY_DEFS = {
  hamlet_emberfall: [['Ember Rat',1,'Fat on forge scraps and very bold.','Singed Tail',''],['Cinder Beetle',2,'Its shell is still warm from the forge.','Cinder Shell',''],['Old Smokejaw',4,'A rat the size of a dog. The smiths are scared of him.','Smokejaw’s Tooth','','tboss']],
  hamlet_woods: [['Thornling',1,'A walking bramble with a mean streak.','Thorn Bundle',''],['Moss Toad',2,'Croaks your name. Nobody knows how.','Moss Slime',''],['The Bramble Stag',4,'Antlers like a hedge, temper like a storm.','Bramble Antler','deer_hide','tboss']],
  hamlet_ironpeak: [['Rock Mite',1,'Chews gravel. Also ankles.','Mite Carapace',''],['Tunnel Bat',2,'Screeches at lamps.','Bat Wing',''],['Grizzled Mole King',4,'Wears a bottle cap for a crown.','Bottle-Cap Crown','','tboss']],
  hamlet_marsh: [['Bog Leech',1,'Small, slimy, persistent.','Leech Slime',''],['Reed Snapper',2,'A turtle with opinions about your boots.','Snapper Shell',''],['Mother Mudcrab',4,'Guards the ferry landing. Has always guarded it.','Mudcrab Claw','','tboss']],
  hamlet_oasis: [['Sand Scarab',1,'Rolls dung, rolls dice, rolls at you.','Scarab Shell',''],['Dune Jackal',2,'Laughs at night. Bites by day.','Jackal Fang',''],['Sunscale Lizard',4,'Basks on the third well and will not move.','Sunscale','lizard_skin','tboss']],
  hamlet_frost: [['Snow Hare',1,'Fast, fluffy, surprisingly kicky.','Hare Foot','rabbit_pelt'],['Ice Weasel',2,'Steals fish, then your gloves.','Weasel Tail',''],['Whitefang',4,'The lodge dogs won’t go near the ice wall because of him.','Whitefang’s Fang','wolf_pelt','tboss']],
  emberfall: [['Feral Hog',3,'Snorting, stubborn, delicious if you win.','Hog Tusk','boar_hide'],['Ash Wolf',5,'Grey with soot, quick as a spark.','Ash Wolf Fang','wolf_pelt'],['Ember Imp',7,'Laughs every time it sets something alight.','Imp Horn',''],['Highway Bandit',9,'Wants your gold. Has a very small knife.','Bandit Mask',''],['Golden Hog',8,'Shines like a coin. Probably lucky.','Golden Bristle','boar_hide','hidden'],['Cinderhorn the Ram',11,'A ram with smouldering horns that guards the hollow.','Cinderhorn Shard','','boss']],
  woods: [['Gray Wolf',9,'Hunts in packs of three, always three.','Gray Wolf Fang','wolf_pelt'],['Forest Sprite',11,'Tiny, glowing, and unexpectedly stabby.','Sprite Dust',''],['Bark Golem',13,'A tree that got up one day and kept walking.','Living Bark',''],['Dire Boar',15,'Twice the hog, three times the attitude.','Dire Tusk','boar_hide'],['Silver Hart',14,'Seen once a season, never twice.','Silver Antler','elk_hide','hidden'],['The Weeping Dryad',19,'Her tears heal every wound you give her.','Dryad’s Tear','','boss']],
  ironpeak: [['Cave Goblin',17,'Collects shiny things, including teeth.','Goblin Ear',''],['Stone Golem',20,'Built by someone. Forgotten by everyone.','Golem Core',''],['Mountain Troll',23,'Turns to stone in daylight. Lives underground for a reason.','Troll Tusk','troll_hide'],['Harpy',25,'Screams in three keys at once.','Harpy Feather',''],['Crystal Basilisk',24,'Its gaze turns you to quartz, briefly.','Basilisk Eye','basilisk_hide','hidden'],['Gorrak the Mountain King',29,'A giant in armour plates forged from the mountain itself.','King’s Iron','','boss']],
  marsh: [['Swamp Lurker',27,'Mostly mouth.','Lurker Scale',''],['Giant Crocodile',30,'An old one. Very old. Very big.','Croc Tooth','crocodile_hide'],['Bog Wraith',33,'Made of fog and grudges.','Wraith Essence',''],['Hydra Hatchling',35,'Only three heads. For now.','Hatchling Head','hydra_scale'],['Will-o’-Wisp',34,'Follow it at your peril, and your profit.','Wisp Light','','hidden'],['Grumbo the Bog Ogre',39,'Lives in a hut, eats onions, and really wants you off his swamp.','Ogre’s Earwax','','boss']],
  desert: [['Scorpion Brute',37,'A tail like a spear and a shell like a shield.','Scorpion Stinger',''],['Sand Wyrm',40,'Swims through dunes like water.','Wyrm Scale','wyvern_scale'],['Mummified Guard',43,'Still on duty after a thousand years.','Ancient Linen',''],['Dust Djinn',46,'Grants no wishes. Lots of sandstorms.','Djinn Smoke',''],['Sun-Touched Sphinx',48,'Asks a riddle. Attacks if you are wrong. Attacks if you are right.','Sphinx Riddle Stone','manticore_hide','hidden'],['The Sandbound King',51,'A king who refused to die and a curse that agreed.','Sandbound Sceptre Shard','','boss']],
  frost: [['Frost Wolf',49,'White as the field and twice as cold.','Frost Fang','wolf_pelt'],['Ice Troll',52,'Its blood freezes the axe that cuts it.','Rime Tusk','troll_hide'],['Yeti',55,'Shy. Large. Extremely large.','Yeti Fur',''],['Frost Giant',59,'Born from a glacier, and still growing.','Giant’s Rime','frost_giant_hide'],['Rime Wyvern',60,'Breathes frost and hoards icicles.','Rime Wyvern Scale','wyvern_scale','hidden'],['Hrimvald the Frost Jarl',65,'The giant king of the spire, crowned in ice.','Jarl’s Frozen Heart','','boss']],
  void: [['Void Stalker',61,'You see it only when it blinks.','Void Shard',''],['Rift Horror',65,'Too many eyes, all of them yours.','Horror Eye',''],['Null Wraith',69,'Erases sounds. And then people.','Null Essence',''],['Star Eater',73,'Swallowed a star once. Still hungry.','Star Ember','',],['Shattered Seraph',75,'A fallen messenger, still trying to deliver.','Seraph Feather','phoenix_plume','hidden'],['The Hollow Sovereign',79,'A crown with nothing under it, ruling nothing, very angrily.','Hollow Crown Fragment','','boss']],
  chasm: [['Magma Colossus',76,'Walks through lava like a puddle.','Molten Core',''],['Elder Wyrm',82,'Old enough to remember the first fire.','Elder Wyrm Scale','hydra_scale'],['Primordial Titan',88,'Older than the gods. Grumpier, too.','Titan’s Shard',''],['World Serpent Spawn',93,'A small part of something that circles the world.','Serpent Scale','jormungandr_scale'],['Phoenix of the Deep',90,'Born again in magma every dawn.','Deep Phoenix Plume','phoenix_plume','hidden'],['The Worldheart Warden',99,'Keeper of the world’s heart. Will not let you pass without a fight.','Warden’s Heartstone','','boss']],
};
// Boss mechanics: a countering stat threshold; if unmet, the penalty applies.
const BOSS_MECH = {
  old_smokejaw: { name:'Gnaw', text:'Bites hard. Vitality 12+ shrugs it off.', stat:'VIT', need:12, dmg:1.4 },
  the_bramble_stag: { name:'Thorned Charge', text:'Charges through you. Vitality 12+ holds the line.', stat:'VIT', need:12, dmg:1.4 },
  grizzled_mole_king: { name:'Burrow', text:'Keeps digging away. Perception 12+ spots him.', stat:'PER', need:12, time:1.6 },
  mother_mudcrab: { name:'Hard Shell', text:'Tough shell. Strength 12+ cracks it.', stat:'STR', need:12, rec:1.3 },
  sunscale_lizard: { name:'Sunbask', text:'Heals in sunlight. Agility 12+ keeps it moving.', stat:'AGI', need:12, time:1.6 },
  whitefang: { name:'Pack Howl', text:'Calls the pack. Vitality 12+ endures it.', stat:'VIT', need:12, dmg:1.4 },
  cinderhorn_the_ram: { name:'Blazing Charge', text:'A burning charge. Vitality 30+ withstands it.', stat:'VIT', need:30, dmg:1.5 },
  the_weeping_dryad: { name:'Healing Tears', text:'Heals constantly. Dexterity 50+ crits through it.', stat:'DEX', need:50, time:1.8 },
  gorrak_the_mountain_king: { name:'Mountain Plate', text:'Armoured in stone. Strength 80+ breaks it.', stat:'STR', need:80, rec:1.3 },
  grumbo_the_bog_ogre: { name:'Onion Breath', text:'Truly awful breath. Vitality 100+ lets you breathe.', stat:'VIT', need:100, dmg:1.7 },
  the_sandbound_king: { name:'Curse of Ages', text:'Withers the weak-willed. Wisdom 120+ resists.', stat:'WIS', need:120, rec:1.25 },
  hrimvald_the_frost_jarl: { name:'Deep Freeze', text:'Freezes you in place. Agility 150+ keeps you moving.', stat:'AGI', need:150, time:1.6 },
  the_hollow_sovereign: { name:'Soul Drain', text:'Drains your life. Wisdom 180+ holds on.', stat:'WIS', need:180, dmg:1.8 },
  the_worldheart_warden: { name:'Heartfire Enrage', text:'Grows stronger the longer it lasts. Strength 250+ ends it fast.', stat:'STR', need:250, rec:1.4 },
};
// Unique gear: [id, name, slot, region drop source (enemy id), stats, chance]
const UNIQUES = [
  ['cinderhorn_helm','Cinderhorn Helm','head','cinderhorn_the_ram',{ VIT:8, STR:6 },0.03],
  ['golden_tusk','Golden Tusk Charm','amulet','golden_hog',{ LUCK:10 },0.05],
  ['dryadheart_staff','Dryadheart Staff','weapon','the_weeping_dryad',{ INT:14, WIS:10 },0.03],
  ['hartsilver_ring','Hartsilver Ring','ring','silver_hart',{ PER:14 },0.05],
  ['kings_maul','Mountain King’s Maul','weapon','gorrak_the_mountain_king',{ STR:24 },0.03],
  ['basilisk_amulet','Basilisk Eye Amulet','amulet','crystal_basilisk',{ PER:18, LUCK:6 },0.05],
  ['lucky_onion','Grumbo’s Lucky Onion','amulet','grumbo_the_bog_ogre',{ LUCK:24, VIT:10 },0.03],
  ['wisp_lantern','Wisplight Lantern','offhand','will_o_wisp',{ INT:16, WIS:16 },0.05],
  ['sandbound_crown','Crown of the Sandbound','head','the_sandbound_king',{ INT:24, CHARM:20 },0.03],
  ['riddle_ring','Riddle Ring','ring','sun_touched_sphinx',{ WIS:22, INT:12 },0.05],
  ['jarlsbane','Jarlsbane Greataxe','weapon','hrimvald_the_frost_jarl',{ STR:44, VIT:16 },0.03],
  ['rimescale_cloak','Rimescale Mantle','chest','rime_wyvern',{ AGI:36, VIT:12 },0.05],
  ['voidheart_blade','Voidheart Blade','weapon','the_hollow_sovereign',{ STR:56, DEX:24 },0.03],
  ['seraph_feather','Seraph’s Feather','amulet','shattered_seraph',{ WIS:40, LUCK:16 },0.05],
  ['worldheart_aegis','Worldheart Aegis','offhand','the_worldheart_warden',{ VIT:80, STR:30 },0.03],
  ['phoenix_ring','Phoenix Ember Ring','ring','phoenix_of_the_deep',{ STR:20, DEX:20, VIT:20, LUCK:20 },0.05],
];
const SECRET_DROPS = { grumbo_the_bog_ogre: [['jacks_bean', 0.01]] };

// ---- Tutorial chains (one per starting region). Mechanics are shared; words are local.
// Goal types: gather, prof, active, gold, buy, craft, buff, alloc, kill, boss
const TUTORIALS = {
  emberfall: { res1:'stone', res2:'potato', craft:'r_baked_potato', buy:'spice', e1:'ember_rat', boss:'old_smokejaw', gear:['ember_gloves','Ember-warmed Gloves','gloves',{ DEX:4, VIT:2 }],
    lines:['Elder Brannoch hands you a pick. "The hearth needs stone. Bring me twenty and we’ll talk."','"Again. And again. Your arms will learn faster than your head." Reach T3 on Stone.','"Two hands, two jobs." Dig potatoes in the elder’s patch while the pick keeps swinging.','"Coin keeps the forge lit." Sell what you’ve gathered for 30 gold.','"Old Marta sells spice in the square. Buy a pouch."','"Bake three potatoes. The smiths are always hungry."','"Eat. A full belly works harder." Eat a meal or drink a potion.','"You’re growing. Decide how." Spend 10 stat points on the Character tab.','"Rats in the forge cellar again. Clear out five Ember Rats."','"Old Smokejaw. He’s eaten three cats and a boot. End this."'] },
  woods: { res1:'pine', res2:'mint', craft:'r_rod_0', buy:'thread', e1:'thornling', boss:'the_bramble_stag', gear:['bark_hood','Bark-weave Hood','head',{ WIS:4, PER:2 }],
    lines:['Warden Ilsabet points at the pines. "They grow back. Bring twenty logs."','"The forest teaches by repetition." Reach T3 on Pine.','"Pick mint by the lantern path while you chop. The woods reward busy hands."','"Lanternbough runs on trade. Earn 30 gold at the market."','"The weaver sells thread. Buy a spool."','"Make three rods. The river folk will thank you."','"Try one of the old recipes: eat or drink something that helps."','"Stand taller. Spend 10 stat points."','"The thornlings are creeping onto the path. Cut down five."','"The Bramble Stag has gone wild. Calm him, by force if you must."'] },
  ironpeak: { res1:'stone', res2:'pine', craft:'r_rod_0', buy:'thread', e1:'rock_mite', boss:'grizzled_mole_king', gear:['miner_lamp','Miner’s Lamp','offhand',{ PER:4, DEX:2 }],
    lines:['Foreman Dagna slaps a pick into your hands. "Twenty stones. Go."','"Swing until it’s easy. Then keep swinging." Reach T3 on Stone.','"We need pit props. Chop pine while you mine."','"Bellhold pays in coin. Earn 30 gold."','"Get thread from the supply tent."','"Make three rods for the lake crew."','"Eat or drink something. Nobody mines hungry."','"Spend 10 stat points. You’ll need them below."','"Rock mites in the lower shaft. Squash five."','"The Mole King has taken the old tunnel. Evict him."'] },
  marsh: { res1:'shrimp', res2:'mint', craft:'r_cooked_shrimp', buy:'vial', e1:'bog_leech', boss:'mother_mudcrab', gear:['waxed_waders','Waxed Waders','boots',{ AGI:4, VIT:2 }],
    lines:['Ferryman Orrin hands you a net. "Twenty shrimp and you can ride for free."','"Again, till your wrists know the water." Reach T3 on Shrimp.','"Marsh mint grows on the stilts. Pick it while the net soaks."','"Stiltwater runs on coin. Earn 30 gold."','"Buy a vial from the herb woman. Everyone here carries one."','"Cook three shrimp. You’ll want them later."','"Eat or drink something. The marsh drains you."','"Spend 10 stat points. Trust me."','"Leeches on the landing. Pull off five."','"Mother Mudcrab blocks the ferry. Move her."'] },
  oasis: { res1:'potato', res2:'mint', craft:'r_baked_potato', buy:'spice', e1:'sand_scarab', boss:'sunscale_lizard', gear:['sun_veil','Sun-veil','head',{ CHARM:4, WIS:2 }],
    lines:['Caravaneer Saffi nods at the oasis gardens. "Dig twenty potatoes. Caravans need food."','"Again. The sand teaches patience." Reach T3 on Potato.','"Pick desert mint by the wells while you dig."','"Glassmarket never closes. Earn 30 gold there."','"Spice merchant, third stall. Buy a pouch."','"Bake three potatoes for the next caravan."','"Eat or drink something. The heat is no joke."','"Spend 10 stat points before the dunes do it for you."','"Scarabs in the grain. Crush five."','"The Sunscale Lizard is sitting on the third well again. Shift it."'] },
  frost: { res1:'rabbit_pelt', res2:'stone', craft:'r_rough_leather', buy:'thread', e1:'snow_hare', boss:'whitefang', gear:['fur_boots','Fur-lined Boots','boots',{ VIT:4, AGI:2 }],
    lines:['Huntress Velka tosses you a knife. "Twenty pelts. The lodge is cold."','"Again, cleaner this time." Reach T3 on Rabbit Pelt.','"Quarry stone for the hearth while you skin."','"Rimehall trades in coin. Earn 30 gold."','"Buy thread from the lodge store."','"Tan three hides into leather."','"Eat or drink something warm."','"Spend 10 stat points. The cold is coming."','"Snow hares are eating the stores. Chase down five."','"Whitefang prowls by the ice wall. End it."'] },
};
const TUTORIAL_TITLES = ['First Gathering','Practice Makes Perfect','Two Hands','Coin in Your Pocket','Supplies','First Craft','Fuel Up','Growing Strong','First Blood','The Local Menace'];

// ---- Region random events (fire every so often while you are in a region).
const EVENTS = [
  { id:'bard', text:'A wandering bard plays outside the inn. You feel inspired: +10% XP for 15 minutes.', fx:{ xp:0.10 }, mins:15 },
  { id:'blessing', text:'A shrine-keeper blesses your tools: +15% gathering yield for 15 minutes.', fx:{ gyield:0.15 }, mins:15 },
  { id:'clover', text:'You find a patch of four-leaf clover: +3% Lucky Strike for 15 minutes.', fx:{ proc:0.03 }, mins:15 },
  { id:'purse', text:'You find a dropped purse. Nobody claims it.', gold:true },
  { id:'cache', text:'A rockslide uncovers a cache of local resources.', cache:true },
  { id:'nest', text:'You find an abandoned nest. One egg is still warm.', egg:true },
];
