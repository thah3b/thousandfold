// ============================================================
// VERSION & PATCH NOTES
// Version scheme: v0.(phase + 1). Minor / quality-of-life updates add a letter: v0.8a, v0.8b...
// ============================================================
const GAME_VERSION = 'v0.11a';
const PATCH_NOTES = [
  { v: 'v0.11a', date: '2026-11-24', title: 'Game letters', notes: [
    'The game team can now send letters, with gold or items attached, to one player or to everyone. They arrive in your Mailbox.',
    'You can remove your own chat messages.',
  ] },
  { v: 'v0.11', date: '2026-11-24', title: 'Phase 10: Friends, chat, mail and trading', notes: [
    'New Social section (needs a Thousandfold account on the website). Pick a display name; it is separate from your characters\u2019 names.',
    'Friends: add players by friend code or display name, accept or decline requests, see who is online, remove or block players.',
    'Chat: a World channel for everyone and private chats with friends. Unfriendly words are masked; you can block anyone from their name in chat.',
    'Mailbox: gifts from friends and letters from the game arrive here. Collect attachments into the character you are playing. The Mail button at the top shows unread mail.',
    'Gifts: send a friend gold and up to 5 different items, 20 gifts a day. You can gift up to 1,000 gold, or a quarter of your verified gold earned if that is more. Bound items and sentient or growth weapons can\u2019t be given away.',
    'Secure trading: both offers live on the server. Any change to either offer cancels both confirmations, and the trade happens only when you both confirm the same offers. While you are confirmed, your side is set aside so you can\u2019t spend it twice; if the trade is changed or cancelled it comes straight back.',
  ] },
  { v: 'v0.10c', date: '2026-11-24', title: 'The game has a website', notes: [
    'Thousandfold now has its own website: https://thah3b.github.io/thousandfold/ . Accounts, cloud saves and leaderboards work there.',
    'On the Claude link, the Cloud save tab links to the website and explains how to bring your save over with a save code.',
  ] },
  { v: 'v0.10b', date: '2026-11-24', title: 'Clearer cloud message on the Claude link', notes: [
    'The Cloud save tab on the Claude link now says plainly that accounts work only in the standalone game, and how to move your save there.',
  ] },
  { v: 'v0.10a', date: '2026-11-24', title: 'Thousandfold accounts go live', notes: [
    'The standalone game now connects to the Thousandfold server: create an account with your email on the Cloud save tab to get cloud saves and appear on the leaderboards.',
    'On the Claude link, outside connections are blocked, so the game falls back to browser saves and save codes there and says so on the Cloud save tab.',
  ] },
  { v: 'v0.10', date: '2026-11-24', title: 'Phase 9: Accounts, cloud saves and leaderboards', notes: [
    'New Cloud save tab (Town). Sign in and your characters are saved to the cloud automatically every 5 minutes, or whenever you press Save to cloud now. On a new device, the game offers to load your newer cloud save.',
    'On the game link, your account is your Claude account. Players who can only view the game link can still see the leaderboards; uploading needs edit access to the link. Everyone else keeps browser saves and save codes.',
    'New Leaderboards tab (Adventure): top 100 by Level (shown as A0 \u00b7 Lv for characters who have not ascended), Achievement points, Gold earned, Monsters slain, Pet species and Collection.',
    'Fair play checks: before a character is ranked it is checked (level against XP, skill levels against skill XP, stat points against levels, progress against the character\u2019s age, and its name). The Cloud save tab shows whether each character is eligible and, if not, why.',
    'Groundwork for the standalone game: Thousandfold server accounts (email and password) with cloud saves, leaderboards and the same checks run on the server. Set it up under Cloud save \u2192 Thousandfold server.',
    'Fixed: gold from region story chapters now counts toward Gold earned.',
  ] },
  { v: 'v0.9b', date: '2026-11-24', title: 'Short save codes and discovery pop-ups', notes: [
    'Save codes are now compressed and about 6 times shorter (a two-character save went from about 35,000 to about 6,000 characters), so they fit in a phone clipboard. Old long codes still import.',
    'New save options: Share\u2026 (on phones), Save as file, and Load file\u2026 when importing, for saves too big to paste.',
    'Discovery pop-ups: finding a hidden place, a secret drop, a sentient weapon, a secret pet combo, a new pet species or unlocking a secret achievement now opens a small window that says what you found, with a Close button and a shortcut to the right tab. Several at once queue up; Close all skips the rest.',
    'Turn discovery pop-ups off in Settings \u2192 Comfort if you prefer the old toasts.',
  ] },
  { v: 'v0.9a', date: '2026-11-24', title: 'Crafting unlock fix', notes: [
    'Fixed: Alchemy, Blacksmithing, Enchanting and Jewelcrafting had no recipe at skill level 1, so they could never be levelled. Each crafting skill now opens its easiest recipe at level 1 and the rest of its ladder moves down to match (Alchemy: Production Potion at 1, Scholar\u2019s Tea at 8, and so on).',
    'You still need the ingredients: Production Potion takes Mint, Sage (Herbalism) and a Vial from the shop.',
  ] },
  { v: 'v0.9', date: '2026-11-24', title: 'Phase 8: Pets', notes: [
    'New Pets tab. Eggs drop rarely from anything you do (online and offline), from region bosses (5%), weekly quests, some daily quests and a new "abandoned nest" region event. Common and Rare eggs are sold in the shop; Epic and Legendary eggs in the shard exchange.',
    'Incubators: eggs hatch after their time or after enough of your actions, whichever comes first, and keep going offline. Start with 1 incubator; buy up to 5.',
    'Around 50 species in five rarities (Common to Mythic), each with a size, type tags, a personality, a passive boost and a combat ability. Many evolve as they level, up to level 50.',
    'One active pet at full strength plus support slots at 35% strength, opened by the new Beastmastery skill (levels 10, 30, 60, 90). Beastmasters get an extra slot and +25% pet strength.',
    'Pets get hungry. Feed them any food; hungry pets work at half strength. Happiness also affects strength.',
    'Large and Huge Ground or Flying pets are mounts: +25% / +40% travel speed, and they raise the travel speed cap.',
    'Secret combos for certain pet pairings, breeding for hybrid eggs (four hybrid species), daycare expeditions for resources and pet XP, and a wardrobe of hats and auras.',
    'New Collection tab: pets, monsters, items and regions. Each 25% gives a small permanent bonus.',
    'Existing characters who finished the tutorial get a starter egg from their home region. New characters find one when they beat the tutorial boss.',
    'New achievements for pets and collections; Beastmastery has its own titles and career talents.',
  ] },
  { v: 'v0.8a', date: 'Nov 24', title: 'Patch notes and version', notes: [
    'The current version is shown in Settings, with these patch notes.',
    'Version numbers now follow the build phase (Phase 7 = v0.8). Small updates add a letter (v0.8a, v0.8b, ...).',
  ] },
  { v: 'v0.8', date: 'Nov 24', title: 'Phase 7: Quests, elixirs and training', notes: [
    'Quest boards in every town: 3 dailies (reset at midnight) and 2 weeklies (reset Monday). Hold up to 6. Rewards: gold, Ember Shards and elixirs.',
    'Region stories: a 3-part story in every region. Each part gives +2 to that region’s stat permanently.',
    'Elixirs of Growth: permanent +1 / +3 / +8 stat potions for all 9 stats. Each stat can take up to 150 points from elixirs, with smaller gains near the cap. Brew Lesser and Greater in Alchemy; Mythic drop from region bosses.',
    'Training (Town tab): one idle activity per stat that adds a sliver of it each time, up to +5 per stat per day.',
    'Ember Shard exchange in the shop: Mythic Elixirs, Satchel of Holding and top-tier potions. Shards are earned only.',
    '12 new achievements; the Achievements tab shows recent unlocks and how many hidden ones remain.',
    '"While you were away" now shows gold earned and training gains. The Character tab shows stats from elixirs and training.',
  ] },
  { v: 'v0.7', date: 'Nov 24', title: 'Phase 6: Companions, sentient and growth weapons', notes: [
    'Companions (from level 10): one per class, such as Ser Aldren the Paladin for Healers. They level, bond, wear 3 gear pieces, have a small talent tree and a 3-chapter story ending in an oath.',
    'Healer + Paladin: the Paladin is 50% stronger and levels at your pace.',
    'Six sentient weapons with personalities, likes and dislikes. Bond unlocks abilities and story chapters; low bond makes them sulk; full bond Awakens them.',
    'Growth weapon: the Seedling Blade drops from your first region boss. It levels from kills and feeding, then evolves at 20 and 40 along a path set by how you play.',
  ] },
  { v: 'v0.6b', date: 'Nov 24', title: 'Shop and discovery improvements', notes: [
    'Buy ×1 / ×10 / ×100 / ×1,000 or Max in the shop.',
    '24 potions in five tiers per type, with no level or stat requirements, including new +75%, +100% and +150% yield potions.',
    'Undiscovered resources now show as "???" until you unlock them.',
  ] },
  { v: 'v0.6a', date: 'Nov 24', title: 'Economy and Ascension', notes: [
    'Auto-sell for gathered resources (All, or keep 100 / 1,000 / 10,000), plus auto-sell junk.',
    'Shop prices and gold costs now rise with your level so gold stays meaningful. Flooding the market drops prices further.',
    'Ascension: at tier 4 and level 99, reset your level to 1 and keep everything else, for permanent bonuses. Shown as "A1 · Lv 1" after your first.',
  ] },
  { v: 'v0.6', date: 'Nov 24', title: 'Phase 5: Classes and talents', notes: [
    'Every class has an innate passive and a talent tree with active skills powered by its resource (Rage, Mana...).',
    'Class advancement at levels 25, 60 and 99: a class goal, a trip to your master and a trial boss. Choose a specialization at tier 2.',
    'Career trees for every skill and a general tree. Second path (half of another class’s passive) and Reforge Destiny (change class).',
  ] },
  { v: 'v0.5', date: 'Nov 24', title: 'Phase 4: World, combat and tutorials', notes: [
    'World map with 8 regions, fog of war, timed travel, road encounters and fast carriages.',
    'Exploration skill reveals areas, boss lairs and hidden places.',
    'Auto-battle combat with the Slaying skill, 66 enemies, region bosses with special mechanics, rarity loot and unique gear.',
    'A 10-quest tutorial in every starting region; finishing it opens the world map.',
  ] },
  { v: 'v0.4b', date: 'Nov 24', title: 'Simpler character creation', notes: [
    'The first page is now just name, gender and race. Appearance options were removed.',
  ] },
  { v: 'v0.4a', date: 'Nov 24', title: 'Faster unlocks', notes: [
    'The next resource in a chain now unlocks at 1,000 completions (was 10,000), about 10 minutes early on.',
    'Gathering XP raised to match, so level requirements don’t become a wall.',
  ] },
  { v: 'v0.4', date: 'Nov 24', title: 'Phase 3: Gathering, crafting and equipment', notes: [
    'Woodcutting, Farming, Fishing, Herbalism and Skinning chains.',
    'Six crafting skills with per-recipe mastery and quality rolls.',
    'Full equipment, tool belt and +1 to +10 upgrades.',
    'Shop, travelling merchant, bank and savings.',
  ] },
  { v: 'v0.3', date: 'Nov 24', title: 'Phases 1–2: First playable', notes: [
    'Character creation, 36 ores with per-ore mastery, stamina multitasking, offline progress.',
    'Stats with 20 points per level, potions, titles and achievements.',
  ] },
];
