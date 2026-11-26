// ============================================================
// v2.2 — Languages. English (default) and Vietnamese (Tiếng Việt).
// The game renders in English; when Vietnamese is chosen, a translator rewrites
// text nodes and title/placeholder/aria-label attributes as they appear.
//   I18N_VI      exact strings
//   I18N_VI_TPL  templates: {#} = a number, {N} = any text (itself translated when known)
// Proper names (places, monsters, items, characters) stay in English on purpose.
// Missing strings simply stay in English.
// ============================================================
const LANGS = [['en', 'English', 'EN'], ['vi', 'Tiếng Việt', 'VI']];
const langNow = () => (typeof account !== 'undefined' && account && account.settings && account.settings.lang) || 'en';

const I18N_VI = {
  // ---- navigation & sections ----
  'Gathering': 'Thu thập', 'Crafting': 'Chế tạo', 'Adventure': 'Phiêu lưu', 'You': 'Bản thân', 'Social': 'Xã hội', 'Town': 'Thị trấn',
  'Home': 'Trang chủ', 'Skills': 'Kỹ năng', 'More': 'Thêm', 'Sections': 'Mục', 'Game sections': 'Các mục trong game',
  'Mining': 'Khai khoáng', 'Woodcutting': 'Đốn gỗ', 'Farming': 'Trồng trọt', 'Fishing': 'Câu cá', 'Herbalism': 'Hái thảo dược', 'Skinning': 'Lột da',
  'Blacksmithing': 'Rèn', 'Alchemy': 'Giả kim', 'Cooking': 'Nấu ăn', 'Tailoring': 'May vá', 'Enchanting': 'Phù phép', 'Jewelcrafting': 'Chế tác trang sức',
  'Exploration': 'Thám hiểm', 'Slaying': 'Săn quái', 'Research': 'Nghiên cứu',
  'Map': 'Bản đồ', 'Combat': 'Chiến đấu', 'Arena': 'Đấu trường', 'Dungeons': 'Hầm ngục', 'Quests': 'Nhiệm vụ', 'Secrets': 'Bí mật', 'Lore': 'Truyền thuyết',
  'Events': 'Sự kiện', 'Daily games': 'Trò chơi mỗi ngày', 'Leaderboards': 'Bảng xếp hạng',
  'Proficiency': 'Thành thạo', 'Inventory': 'Túi đồ', 'Character': 'Nhân vật', 'Wardrobe': 'Tủ đồ', 'Class': 'Lớp nhân vật', 'Talents': 'Thiên phú',
  'Companions': 'Đồng hành', 'Companion': 'Đồng hành', 'Pets': 'Thú cưng', 'Arsenal': 'Kho vũ khí', 'Collection': 'Bộ sưu tập', 'Titles': 'Danh hiệu', 'Achievements': 'Thành tựu',
  'Friends': 'Bạn bè', 'Chat': 'Trò chuyện', 'Mailbox': 'Hộp thư', 'Trades': 'Giao dịch', 'Guild': 'Bang hội',
  'Shop': 'Cửa hàng', 'Auction House': 'Nhà đấu giá', 'Bank': 'Ngân hàng', 'Training': 'Luyện tập', 'Account': 'Tài khoản', 'Settings': 'Cài đặt', 'Debug': 'Gỡ lỗi',
  '⌂ Home': '⌂ Trang chủ',
  // ---- top bar, home, actions ----
  'Gold': 'Vàng', 'Shards': 'Mảnh', 'Mail': 'Thư', '✉ Feedback': '✉ Góp ý', 'Feedback': 'Góp ý', '✦ Buffs': '✦ Hiệu ứng', 'Next:': 'Tiếp theo:',
  'Closest upcoming milestone': 'Mốc gần nhất sắp tới', 'Send feedback to the developer': 'Gửi góp ý cho nhà phát triển', 'Show your active buffs': 'Xem các hiệu ứng đang có',
  'Start an action': 'Bắt đầu một hành động', 'Active actions': 'Hành động đang chạy', 'Running': 'Đang chạy', 'Nothing running.': 'Không có gì đang chạy.',
  'Nothing running: start something': 'Không có gì đang chạy: hãy bắt đầu một việc', 'Stamina': 'Thể lực', 'Auto off': 'Tự động: tắt', 'Auto on': 'Tự động: bật',
  'Compact': 'Thu gọn', 'Full': 'Đầy đủ', 'Hide': 'Ẩn', 'Compact the actions panel': 'Thu gọn bảng hành động', 'Stop': 'Dừng', 'Stop all': 'Dừng tất cả',
  'Needs you': 'Cần bạn', 'Recent': 'Gần đây', 'All caught up.': 'Không còn việc gì.', 'Nothing yet.': 'Chưa có gì.', 'Resting': 'Đang nghỉ', 'resting': 'đang nghỉ', 'travelling': 'đang di chuyển',
  'Daily reward ready': 'Phần thưởng hằng ngày đã sẵn sàng', '★ Daily reward ready': '★ Phần thưởng hằng ngày đã sẵn sàng', 'Quest ready to hand in': 'Nhiệm vụ đã có thể nộp',
  'Event log': 'Nhật ký sự kiện', 'Combat power': 'Sức chiến đấu', 'HP': 'Máu', 'Show in the scene': 'Hiện trong cảnh',
  'Pick something in any gathering or crafting skill; each running action occupies stamina.': 'Chọn một việc trong bất kỳ kỹ năng thu thập hoặc chế tạo nào; mỗi hành động đang chạy chiếm một điểm thể lực.',
  'Active buffs': 'Hiệu ứng đang có', 'Add time': 'Thêm thời gian', 'Use again': 'Dùng lại', 'None left in your bag': 'Trong túi không còn', 'Auto-use': 'Tự dùng', 'Auto-use: on': 'Tự dùng: bật',
  'No buffs right now. Potions and buff meals from your inventory show up here.': 'Hiện chưa có hiệu ứng nào. Thuốc và món ăn tăng sức mạnh trong túi đồ sẽ hiện ở đây.',
  'Stronger buff active': 'Đang có hiệu ứng mạnh hơn', 'Drink': 'Uống', 'Eat': 'Ăn', 'Drink (+time)': 'Uống (+thời gian)', 'Eat (+time)': 'Ăn (+thời gian)',
  // ---- select screen & wizard ----
  'Choose your character': 'Chọn nhân vật', 'New character': 'Nhân vật mới', 'Play': 'Chơi', 'Delete': 'Xóa', 'Rename': 'Đổi tên', 'Fourth slot': 'Ô thứ tư',
  'Every swing counts. Ten thousand of them, and the mountain gives up its next secret.': 'Mỗi nhát cuốc đều có giá trị. Mười nghìn nhát, và ngọn núi sẽ hé lộ bí mật kế tiếp.',
  'Playing as a guest. Back up your saves with a save code now and then (Settings).': 'Bạn đang chơi với tư cách khách. Thỉnh thoảng hãy sao lưu bằng mã lưu (Cài đặt).',
  'Accounts: on the website': 'Tài khoản: trên trang web', 'Account and cloud save': 'Tài khoản và lưu đám mây', 'Language': 'Ngôn ngữ', 'Change language': 'Đổi ngôn ngữ',
  'Begin your story': 'Bắt đầu câu chuyện', 'Go back': 'Quay lại', 'Next': 'Tiếp', 'Back': 'Quay lại', 'Character name': 'Tên nhân vật', 'Unnamed': 'Chưa đặt tên',
  'New character · Identity': 'Nhân vật mới · Danh tính', 'New character · Origin': 'Nhân vật mới · Xuất thân', 'New character · Region': 'Nhân vật mới · Vùng đất',
  'New character · Class': 'Nhân vật mới · Lớp', 'New character · Confirm': 'Nhân vật mới · Xác nhận',
  'Races add a small flavour bonus and one passive. They never lock content.': 'Chủng tộc cho một chút điểm cộng và một nội tại. Chủng tộc không bao giờ khóa nội dung.',
  'Race and class are chosen when a character is created.': 'Chủng tộc và lớp được chọn khi tạo nhân vật.',
  'Male': 'Nam', 'Female': 'Nữ', 'Welcome to Thousandfold!': 'Chào mừng đến với Thousandfold!', 'Welcome,': 'Chào mừng,',
  'Skip tour': 'Bỏ qua hướng dẫn', 'Replay the tour': 'Xem lại hướng dẫn',
  // ---- skills ----
  'Auto-sell': 'Tự bán', 'Per action': 'Mỗi lần', 'XP / value': 'XP / giá trị', 'Yield bonus': 'Thưởng sản lượng', 'Undiscovered': 'Chưa khám phá',
  'Switch the list order': 'Đổi thứ tự danh sách', '↑ Starting first': '↑ Cơ bản trước', '↓ Best first': '↓ Tốt nhất trước', 'Show all locked': 'Hiện tất cả mục bị khóa',
  'Weapons': 'Vũ khí', 'Potions': 'Thuốc', 'Elixirs': 'Thuốc tiên', 'Other potions': 'Thuốc khác', 'Yield potions': 'Thuốc sản lượng', 'Materials': 'Nguyên liệu', 'Resources': 'Tài nguyên',
  'Leather & cloth': 'Da và vải', 'Amulets': 'Bùa hộ mệnh', 'Rings': 'Nhẫn', 'Armor': 'Giáp', 'Tools': 'Công cụ', 'Food': 'Thức ăn', 'Meals': 'Món ăn',
  'Amount to keep in stock': 'Số lượng muốn giữ trong kho', 'in stock (spends at most half your gold)': 'trong kho (tối đa tiêu một nửa số vàng)', 'in stock': 'trong kho', 'Keep': 'Giữ',
  'Auto-buy shop ingredients: on': 'Tự mua nguyên liệu: bật', 'Auto-buy shop ingredients: off': 'Tự mua nguyên liệu: tắt', 'Progress': 'Tiến độ',
  // ---- inventory & bank ----
  'Equipped': 'Đang trang bị', 'Tool belt': 'Thắt lưng công cụ', 'Search items': 'Tìm vật phẩm', 'List view': 'Dạng danh sách', 'Grid view': 'Dạng lưới', 'Sell all junk': 'Bán hết đồ vụn',
  'Sell Common gear': 'Bán trang bị Thường', 'Sell all': 'Bán hết', 'Sell': 'Bán', 'Buy': 'Mua', 'Equip': 'Trang bị', 'Unequip': 'Tháo', 'Quantity': 'Số lượng', 'Sell price each': 'Giá bán mỗi cái',
  'Stack value': 'Giá trị cả chồng', 'Auto-sell junk: off': 'Tự bán đồ vụn: tắt', 'Auto-sell junk: on': 'Tự bán đồ vụn: bật', 'Rarity': 'Độ hiếm', 'Head': 'Đầu', 'Chest': 'Thân', 'Legs': 'Chân',
  'Boots': 'Giày', 'Gloves': 'Găng tay', 'Weapon': 'Vũ khí', 'Offhand': 'Tay phụ', 'Amulet': 'Bùa hộ mệnh', 'Ring': 'Nhẫn', 'Empty': 'Trống', 'Pickaxe': 'Cuốc chim', 'Axe': 'Rìu', 'Hoe': 'Cuốc',
  'Rod': 'Cần câu', 'Sickle': 'Liềm', 'Skinning Knife': 'Dao lột da', 'Open': 'Mở', 'Use': 'Dùng', 'Hatch': 'Ấp',
  'Sells unequipped Common gear (not tools, uniques or special weapons)': 'Bán trang bị Thường không mặc (trừ công cụ, đồ độc nhất và vũ khí đặc biệt)',
  'Storage': 'Kho chứa', 'In the bank': 'Trong ngân hàng', 'Deposit': 'Gửi', 'Deposit all': 'Gửi tất cả', 'Withdraw': 'Rút', 'Withdraw all': 'Rút tất cả', 'Savings': 'Tiết kiệm',
  'In savings': 'Đang tiết kiệm', 'On hand': 'Đang có', 'Gold amount': 'Số vàng', 'Bank slots': 'Ô ngân hàng', 'Inventory slots': 'Ô túi đồ',
  'Nothing stored. Use "Bank" on any inventory row.': 'Chưa gửi gì. Dùng nút "Ngân hàng" ở mỗi dòng trong túi đồ.',
  'Common': 'Thường', 'Uncommon': 'Không phổ biến', 'Rare': 'Hiếm', 'Epic': 'Sử thi', 'Legendary': 'Huyền thoại', 'Mythic': 'Thần thoại', 'Unique': 'Độc nhất', 'Junk': 'Đồ vụn',
  // ---- character ----
  'Strength': 'Sức mạnh', 'Agility': 'Nhanh nhẹn', 'Dexterity': 'Khéo léo', 'Intellect': 'Trí tuệ', 'Wisdom': 'Thông thái', 'Vitality': 'Sinh lực', 'Perception': 'Nhạy bén', 'Luck': 'May mắn', 'Charm': 'Duyên dáng',
  'Derived': 'Chỉ số phụ', 'Defense': 'Phòng thủ', 'Attack': 'Tấn công', 'Magic attack': 'Tấn công phép', 'Crit chance': 'Tỉ lệ chí mạng', 'Crit damage': 'Sát thương chí mạng', 'Combat speed': 'Tốc độ chiến đấu',
  'Drop rate': 'Tỉ lệ rơi đồ', 'Carry weight': 'Sức mang', 'Max HP': 'Máu tối đa', 'Max resource': 'Năng lượng tối đa', 'Max stamina': 'Thể lực tối đa', 'Shop discount': 'Giảm giá cửa hàng',
  'XP bonus': 'Thưởng XP', 'Yield pool': 'Tổng sản lượng', 'Tool speed': 'Tốc độ công cụ', 'Agility speed': 'Tốc độ nhanh nhẹn', 'Race speed': 'Tốc độ chủng tộc', 'Class & talents': 'Lớp và thiên phú',
  'Class & talents speed': 'Tốc độ lớp và thiên phú', 'Bonus find (gathering)': 'Tìm thêm (thu thập)', 'Bonuses by skill': 'Điểm cộng theo kỹ năng', 'Skill points': 'Điểm kỹ năng', 'Unspent': 'Chưa dùng',
  'Preview': 'Xem trước', 'Apply': 'Áp dụng', 'Cancel': 'Hủy', 'Presets': 'Bộ trang bị', 'Preset name': 'Tên bộ', 'Save current setup': 'Lưu thiết lập hiện tại', 'Name, e.g. Gathering': 'Tên, ví dụ: Thu thập',
  'Add points to see exactly what changes before you apply.': 'Cộng điểm để xem chính xác điều gì thay đổi trước khi áp dụng.', 'Daily game': 'Trò chơi mỗi ngày',
  'Hit harder, carry more, break more rock.': 'Đánh mạnh hơn, mang nhiều hơn, đập vỡ nhiều đá hơn.', 'Move faster, avoid hits, get there sooner.': 'Di chuyển nhanh hơn, né đòn, đến nơi sớm hơn.',
  'Do more things at once with better precision.': 'Làm nhiều việc cùng lúc với độ chính xác cao hơn.', 'Stronger spells and sharper crafting.': 'Phép mạnh hơn, chế tạo tinh xảo hơn.',
  'Learn faster and heal better.': 'Học nhanh hơn và hồi máu tốt hơn.', 'Survive longer and fight tougher enemies.': 'Sống lâu hơn và đánh được kẻ địch mạnh hơn.',
  'Notice what others walk past.': 'Nhận ra những thứ người khác bỏ qua.', 'More rare finds and surprises.': 'Nhiều đồ hiếm và bất ngờ hơn.', 'Cheaper deals and friendlier NPCs.': 'Mua rẻ hơn, NPC thân thiện hơn.',
  'Each level gives stat points.': 'Mỗi cấp cho thêm điểm chỉ số.',
  // ---- class & talents ----
  'Choose your specialization': 'Chọn chuyên môn', 'Ascension perks': 'Đặc quyền Thăng thiên', 'Innate:': 'Nội tại:', 'Add a point': 'Cộng một điểm', 'Not learned': 'Chưa học', 'Careers': 'Nghề nghiệp',
  'General': 'Chung', 'Active · spends Rage': 'Chủ động · tốn Nộ', 'Class tree and innate passive': 'Cây lớp và nội tại', 'A second path': 'Con đường thứ hai',
  'Opens after your first advancement.': 'Mở sau lần thăng cấp đầu tiên.', 'Everything your class and talents give you': 'Mọi thứ lớp và thiên phú mang lại cho bạn',
  // ---- combat, map, dungeons ----
  'Fight': 'Chiến đấu', 'Flee': 'Rút lui', 'Win chance': 'Tỉ lệ thắng', 'Rewards': 'Phần thưởng', 'Recommended power': 'Sức mạnh đề nghị', 'Weakest first': 'Yếu nhất trước',
  'No fight running': 'Không có trận nào', 'No fights yet.': 'Chưa có trận nào.', 'Fight time': 'Thời gian trận', 'Combat food': 'Thức ăn chiến đấu', 'Monsters': 'Quái vật', 'Boss': 'Trùm',
  'World map': 'Bản đồ thế giới', 'You are here.': 'Bạn đang ở đây.', 'You are in': 'Bạn đang ở', 'Travel': 'Di chuyển', 'Explore': 'Thám hiểm', 'Found here': 'Tìm thấy ở đây', 'Local talk:': 'Người dân kể:',
  'Something here is hard to notice.': 'Có thứ gì đó ở đây rất khó nhận ra.', 'Region-only resources. Start them here; they keep running after you leave.': 'Tài nguyên chỉ có ở vùng này. Bắt đầu ở đây; chúng vẫn chạy khi bạn rời đi.',
  'Your power': 'Sức mạnh của bạn', 'Gear grades': 'Phẩm cấp trang bị', 'Visit the region first.': 'Hãy đến vùng đó trước.', 'Enter': 'Vào', 'Retreat': 'Rút lui', 'Normal': 'Thường', 'Heroic': 'Anh hùng',
  // ---- quests, secrets, events ----
  'Tutorial': 'Hướng dẫn', 'Region stories': 'Câu chuyện vùng đất', 'Go there': 'Đến đó', 'Go explore': 'Đi thám hiểm', 'Accept': 'Nhận', 'Hand in': 'Nộp', 'Claim': 'Nhận thưởng',
  'Opens after the tutorial.': 'Mở sau phần hướng dẫn.', 'No board quests accepted. Pick some from the board.': 'Chưa nhận nhiệm vụ nào trên bảng. Hãy chọn vài nhiệm vụ.',
  'Hidden places': 'Nơi bí ẩn', 'Easter eggs': 'Trứng phục sinh', 'Riddles': 'Câu đố', 'Regions': 'Vùng đất', 'Your class': 'Lớp của bạn', 'Not found yet.': 'Chưa tìm thấy.',
  'Daily reward': 'Phần thưởng hằng ngày', 'This week': 'Tuần này', 'Coming up': 'Sắp tới', 'ends in': 'kết thúc sau', 'holiday': 'ngày lễ', 'Events taken part in:': 'Số sự kiện đã tham gia:',
  'Achievement unlocked:': 'Mở khóa thành tựu:', 'New Lore page:': 'Trang truyền thuyết mới:',
  // ---- pets, wardrobe, training, shop ----
  'Incubators': 'Lò ấp', 'Empty incubator': 'Lò ấp trống', 'Breeding': 'Lai tạo', 'Daycare': 'Nhà trẻ', 'Nobody away.': 'Không ai đi vắng.', 'Pick two pets.': 'Chọn hai thú cưng.',
  'Set an active pet': 'Chọn thú cưng đang theo', 'Hats': 'Mũ', 'Outfits': 'Trang phục', 'Capes': 'Áo choàng', 'Held items': 'Vật cầm tay', 'Hair dye': 'Thuốc nhuộm tóc', 'Poses': 'Tư thế',
  'Class look': 'Diện mạo lớp', 'Wearing': 'Đang mặc', 'Owned': 'Đã có', 'Reset to class look': 'Về diện mạo lớp', 'Your class default': 'Mặc định của lớp', 'Trying on': 'Đang thử', 'Stop trying on': 'Thôi thử',
  'Bare head': 'Đầu trần', 'Train all stats': 'Luyện tất cả chỉ số', 'Trained in total': 'Tổng đã luyện', 'Per session': 'Mỗi buổi', 'Gain each': 'Nhận mỗi lần',
  'Supplies': 'Vật tư', 'Loot chests': 'Rương báu', 'Pet eggs': 'Trứng thú cưng', 'Exchange': 'Đổi', 'Travelling merchant': 'Thương nhân lữ hành', 'New stock every day': 'Hàng mới mỗi ngày', 'One skill': 'Một kỹ năng',
  'Bonus find': 'Tìm thêm', 'Hourglass of Patience': 'Đồng hồ cát Kiên nhẫn',
  // ---- leaderboards, social ----
  'Level': 'Cấp', 'Achievement points': 'Điểm thành tựu', 'Gold earned': 'Vàng kiếm được', 'Monsters slain': 'Quái đã hạ', 'Pet species': 'Loài thú cưng', 'Refresh': 'Làm mới',
  'Send': 'Gửi', 'Message': 'Tin nhắn', 'Friends, chat, mail and trading work on the game’s website:': 'Bạn bè, trò chuyện, thư và giao dịch hoạt động trên trang web của game:',
  // ---- daily games ----
  'How to play': 'Cách chơi', 'Your Runeword': 'Runeword của bạn', 'Played': 'Đã chơi', 'Won': 'Thắng', 'Streak': 'Chuỗi', 'Best': 'Cao nhất', 'Copy result': 'Sao chép kết quả',
  'Not enough letters.': 'Chưa đủ chữ cái.', 'Not in the word list.': 'Không có trong danh sách từ.', 'Runeword board': 'Bảng Runeword', 'Delete letter': 'Xóa chữ',
  // ---- settings ----
  'Comfort': 'Tiện nghi', 'Automation': 'Tự động hóa', 'Saves and accounts': 'Lưu và tài khoản', 'Save now': 'Lưu ngay', 'Save as file': 'Lưu thành tệp', 'Copy save code': 'Sao chép mã lưu',
  'Import save code': 'Nhập mã lưu', 'Character select': 'Chọn nhân vật', 'Patch notes': 'Ghi chú cập nhật', 'Game Guide': 'Hướng dẫn chơi', 'Send feedback': 'Gửi góp ý',
  'Found a bug or have an idea? Send it straight to the developer.': 'Gặp lỗi hoặc có ý tưởng? Gửi thẳng cho nhà phát triển.', 'High contrast': 'Tương phản cao', 'Parchment': 'Giấy da',
  'Numbers': 'Số', 'Sound: on': 'Âm thanh: bật', 'Sound: off': 'Âm thanh: tắt', 'Larger text: off': 'Chữ lớn: tắt', 'Larger text: on': 'Chữ lớn: bật', 'Reduced motion: off': 'Giảm chuyển động: tắt',
  'Reduced motion: on': 'Giảm chuyển động: bật', 'Action animations: on': 'Hoạt ảnh hành động: bật', 'Action animations: off': 'Hoạt ảnh hành động: tắt', 'Discovery pop-ups: off': 'Thông báo khám phá: tắt',
  'Discovery pop-ups: on': 'Thông báo khám phá: bật', 'Auto mode: off': 'Chế độ tự động: tắt', 'Auto mode: on': 'Chế độ tự động: bật', 'Auto-use potions: off': 'Tự dùng thuốc: tắt',
  'Auto-use potions: on': 'Tự dùng thuốc: bật', 'Stack potion time: on': 'Cộng dồn thời gian thuốc: bật', 'Stack potion time: off': 'Cộng dồn thời gian thuốc: tắt',
  'Stop at Grandmaster: off': 'Dừng ở Đại sư: tắt', 'Stop at Grandmaster: on': 'Dừng ở Đại sư: bật', 'List order: starting first': 'Thứ tự: cơ bản trước', 'List order: best first': 'Thứ tự: tốt nhất trước',
  'Optional helpers. Auto mode fills free stamina with gathering in your lowest skills.': 'Trợ giúp tùy chọn. Chế độ tự động dùng thể lực còn trống để thu thập ở các kỹ năng thấp nhất.',
  'Privacy policy': 'Chính sách quyền riêng tư', 'Terms of service': 'Điều khoản dịch vụ', 'Play online at': 'Chơi trực tuyến tại', 'tap a topic': 'chọn một chủ đề',
  'Sign-in and cloud save': 'Đăng nhập và lưu đám mây', 'Cloud save': 'Lưu đám mây', 'Player name': 'Tên người chơi', 'Leaderboard check': 'Kiểm tra bảng xếp hạng',
  'Sign in': 'Đăng nhập', 'Sign out': 'Đăng xuất', 'Create account': 'Tạo tài khoản', 'Email': 'Email', 'Password': 'Mật khẩu', 'Sign in with Google': 'Đăng nhập bằng Google',
  'Load it': 'Tải về', 'Decide later': 'Để sau', 'Keep this device (replaces the cloud save)': 'Giữ máy này (thay bản lưu trên đám mây)',
  // ---- feedback ----
  'Bug': 'Lỗi', 'Idea': 'Ý tưởng', 'Other': 'Khác', 'Name (optional)': 'Tên (không bắt buộc)', 'How to reach you (optional)': 'Cách liên hệ bạn (không bắt buộc)',
  'What happened, or what would you like to see?': 'Chuyện gì đã xảy ra, hoặc bạn muốn thấy điều gì?', 'Thank you!': 'Cảm ơn bạn!', 'Your feedback was sent.': 'Góp ý của bạn đã được gửi.',
  'Close': 'Đóng', 'Confirm': 'Xác nhận', 'Yes': 'Có', 'No': 'Không', 'OK': 'OK', 'Save': 'Lưu', 'Loading…': 'Đang tải…', 'Sending…': 'Đang gửi…', 'None yet': 'Chưa có', 'Unknown': 'Không rõ',
  'Night': 'Đêm', 'Dusk': 'Hoàng hôn', 'Dawn': 'Bình minh', 'Day': 'Ngày', 'Clear': 'Quang đãng', 'Rain': 'Mưa', 'Fog': 'Sương mù', 'Snow': 'Tuyết', 'Storm': 'Bão',

  // ---- batch 2: wizard, stats, classes, skills, misc ----
  'Name': 'Tên', 'Gender': 'Giới tính', 'Race': 'Chủng tộc', 'Origin': 'Xuất thân', 'Region': 'Vùng đất', 'Identity': 'Danh tính', 'Tour': 'Hướng dẫn',
  'STR': 'STR', 'Stats': 'Chỉ số', 'Dodge': 'Né tránh', 'Speed': 'Tốc độ', 'Potion': 'Thuốc', 'Power': 'Sức mạnh', 'Wins': 'Thắng', 'Meal': 'Món ăn', 'None': 'Không có', 'none': 'không có', 'Pet': 'Thú cưng',
  'Orphan': 'Mồ côi', 'Noble': 'Quý tộc', 'Soldier': 'Lính', 'Farmhand': 'Tá điền', 'Scholar': 'Học giả', 'Outcast': 'Kẻ lưu lạc',
  'You grew up in the alleys. A lucky coin is all you kept.': 'Bạn lớn lên trong những con hẻm. Một đồng xu may mắn là tất cả những gì bạn giữ lại.',
  'Born to a minor house, you left with a ring and a purse.': 'Sinh ra trong một gia tộc nhỏ, bạn ra đi với một chiếc nhẫn và một túi tiền.',
  'Sapper duty taught you how walls (and rocks) come down.': 'Thời làm công binh dạy bạn cách làm sập tường (và đá).',
  'Years of turning stony fields gave you a strong back.': 'Nhiều năm cày xới ruộng đá cho bạn một tấm lưng khỏe.',
  'You left the academy with notes and two borrowed tonics.': 'Bạn rời học viện với sổ ghi chép và hai lọ thuốc đi mượn.',
  'Living at the edges, you learned to notice everything.': 'Sống ở rìa xã hội, bạn học được cách để ý mọi thứ.',
  'A secret race, unlocked through hidden content.': 'Một chủng tộc bí mật, mở khóa qua nội dung ẩn.',
  'A forge town built around a hearth that has burned for a thousand years.': 'Một thị trấn lò rèn xây quanh ngọn lửa đã cháy suốt nghìn năm.',
  'Lantern-lit treehouses above a forest that talks back.': 'Những ngôi nhà trên cây thắp đèn lồng, phía trên một khu rừng biết trả lời.',
  'Switchback mining camps under a mountain that rings like a bell.': 'Những trại mỏ quanh co dưới ngọn núi ngân vang như chuông.',
  'Stilt houses, slow boats and a smell you get used to.': 'Nhà sàn, thuyền chậm và một mùi hương rồi bạn sẽ quen.',
  'A palm ring around black glass dunes and a market that never closes.': 'Một vòng cọ quanh những đụn cát thủy tinh đen và một khu chợ không bao giờ đóng cửa.',
  'Smoke-blackened lodges under a spire of blue ice.': 'Những túp lều ám khói dưới ngọn tháp băng xanh.',
  'Frontline fighter · Rage': 'Chiến binh tiền tuyến · Nộ', 'Ranged damage · Focus': 'Sát thương tầm xa · Tập trung', 'Spell damage · Mana': 'Sát thương phép · Mana',
  'Burst and Thieving · Energy / Combo': 'Bộc phá và trộm cắp · Năng lượng / Combo', 'Minions and life drain · Soul Fragments': 'Tay sai và hút máu · Mảnh linh hồn',
  'Healing, paired with a Paladin · Faith': 'Hồi máu, đi cùng một Paladin · Đức tin', 'Gathering powerhouse, scythe fighter · Vigor': 'Bậc thầy thu thập, chiến đấu bằng lưỡi hái · Sinh khí',
  'Trading and gold find · Coin Sense': 'Buôn bán và tìm vàng · Giác quan tiền bạc', 'Pets and taming · Bond': 'Thú cưng và thuần hóa · Gắn kết',
  'Potions and throwables · Reagents': 'Thuốc và vật ném · Dược liệu', 'Party buffs and luck · Inspiration': 'Hỗ trợ đồng đội và may mắn · Cảm hứng',
  'Unarmed, agile, self-healing · Chi': 'Tay không, nhanh nhẹn, tự hồi máu · Khí', 'Temporary spirit allies · Essence': 'Đồng minh linh hồn tạm thời · Tinh chất',
  'Rune-forging bruiser · Runes': 'Đấu sĩ rèn cổ ngữ · Cổ ngữ', 'Water magic, crowd control · Tide': 'Phép nước, khống chế · Thủy triều', 'Explorer and secret hunter · Bearings': 'Nhà thám hiểm và săn bí mật · Phương hướng',
  'Keen Nose: bonus-find chance doubled.': 'Mũi thính: gấp đôi tỉ lệ tìm thêm.',
  'A quick tour of the basics. It takes about a minute, and you can skip it at any time (replay it later from Settings).': 'Một chuyến tham quan nhanh những điều cơ bản. Mất khoảng một phút, bạn có thể bỏ qua bất cứ lúc nào (xem lại trong Cài đặt).',
  'Auto mode fills free stamina with gathering': 'Chế độ tự động dùng thể lực trống để thu thập',
  'running': 'đang chạy', 'reward ready': 'phần thưởng sẵn sàng', 'Off': 'Tắt', 'On': 'Bật', 'All': 'Tất cả', 'Done': 'Đã xong', 'Held': 'Đang giữ', 'Brew': 'Pha chế', 'Cook': 'Nấu', 'Imbue': 'Truyền phép', 'Craft': 'Chế tạo',
  'Enchant stones': 'Đá phù phép', 'mapped': 'đã vẽ bản đồ',
  'Combat food (': 'Thức ăn chiến đấu (', '(no speed bonus below recommended)': '(không có thưởng tốc độ khi dưới mức đề nghị)', 'Not countered': 'Không bị khắc chế', 'Unknown uncommon drop': 'Vật phẩm không phổ biến chưa biết',
    'Go to Account': 'Đến Tài khoản', 'Common+': 'Thường+', 'Rare+': 'Hiếm+', 'Epic+': 'Sử thi+', 'Legendary+': 'Huyền thoại+', '; lower grades stack as plain items.': '; phẩm cấp thấp hơn sẽ gộp thành vật phẩm thường.',
  'Tier': 'Bậc', 'Time': 'Thời gian', 'Bonus': 'Thưởng', 'Slots': 'Ô', 'Gear': 'Trang bị', 'Bound': 'Ràng buộc', 'Sort': 'Sắp xếp',
  'Sell price each (market flooded, recovers over time)': 'Giá bán mỗi cái (thị trường dư hàng, sẽ hồi dần)',
  'Save your gear, tools, pets, outfit and Arena plan, then switch in one click (for example, a gathering set and a combat set).': 'Lưu trang bị, công cụ, thú cưng, trang phục và chiến thuật Đấu trường, rồi đổi chỉ bằng một cú nhấp (ví dụ: bộ thu thập và bộ chiến đấu).',
  'Physical damage, carry weight, and a small yield bonus to heavy gathering (Mining, Woodcutting) and Blacksmithing.': 'Sát thương vật lý, sức mang, và một chút sản lượng cho thu thập nặng (Khai khoáng, Đốn gỗ) và Rèn.',
  'Magic damage, max mana, and a small yield bonus to Alchemy, Enchanting and Research.': 'Sát thương phép, mana tối đa, và một chút sản lượng cho Giả kim, Phù phép và Nghiên cứu.',
  'Max HP, defense, resistances and HP regen.': 'Máu tối đa, phòng thủ, kháng và hồi máu.', 'Healing power, mana regen, XP gain and enchanting power.': 'Sức hồi máu, hồi mana, nhận XP và sức phù phép.',
  'Finds hidden map nodes, rare resource spawns, bonus finds while gathering, and secrets.': 'Tìm điểm ẩn trên bản đồ, tài nguyên hiếm, đồ tìm thêm khi thu thập, và bí mật.',
    'Active skills from your talents spend Rage automatically in fights (roughly one fight in three); their effect is shown as an average.': 'Kỹ năng chủ động từ thiên phú tự tốn Nộ trong trận (khoảng một trong ba trận); hiệu quả được hiển thị dạng trung bình.',
  'Every Ascension gives one perk point to spend here. Ascend for the first time to earn one.': 'Mỗi lần Thăng thiên cho một điểm đặc quyền để dùng ở đây. Hãy thăng thiên lần đầu để nhận.',
  'Weapons with a life of their own. Equip them in your weapon slot.': 'Vũ khí có linh hồn riêng. Trang bị vào ô vũ khí.', 'Growth weapon': 'Vũ khí trưởng thành', 'Defeat any region boss to find one.': 'Hạ bất kỳ trùm vùng nào để tìm một cái.',
  'Eggs hatch after their time or after enough of your actions, whichever comes first. They keep going while you are offline.': 'Trứng nở khi hết thời gian hoặc sau đủ số hành động, tùy cái nào đến trước. Vẫn tiếp tục khi bạn ngoại tuyến.',
  'No eggs. They drop from anything you do, rarely.': 'Không có trứng. Trứng hiếm khi rơi ra từ mọi việc bạn làm.', 'Combos': 'Kết hợp', 'Breed': 'Lai tạo',
  'Some pairs of pets in your slots work together.': 'Một số cặp thú cưng trong ô sẽ phối hợp với nhau.', 'Pair the right two kinds of pet to find out.': 'Ghép đúng hai loại thú cưng để khám phá.',
  'Purely for looks. Buy once, put on any pet.': 'Chỉ để làm đẹp. Mua một lần, dùng cho bất kỳ thú cưng nào.', 'to have it join you here': 'để nó đi cùng bạn ở đây',
    'No bonus yet': 'Chưa có thưởng', 'Items': 'Vật phẩm', 'Points': 'Điểm', 'Recent:': 'Gần đây:', 'Pinned:': 'Đã ghim:', 'Pin': 'Ghim', 'Unpin': 'Bỏ ghim',
    'Shards are earned only: board quests, weeklies and Ascension. Prices never change.': 'Mảnh chỉ kiếm được qua nhiệm vụ bảng, nhiệm vụ tuần và Thăng thiên. Giá không bao giờ đổi.',
  'Gold only. Open them from your inventory; the odds are listed inside.': 'Chỉ bằng vàng. Mở từ túi đồ; tỉ lệ được ghi bên trong.', 'Yield': 'Sản lượng', 'Amount': 'Số lượng',
    'Starts every stat that isn’t done for today, as far as your stamina goes.': 'Bắt đầu luyện mọi chỉ số chưa xong hôm nay, trong giới hạn thể lực.', 'Study': 'Học',
  'Weight Lifting': 'Nâng tạ', 'Lift the smithy’s anvils. Slowly.': 'Nâng đe của lò rèn. Thật chậm.', 'Borrow books from the town archive.': 'Mượn sách từ thư viện thị trấn.',
  'Target Practice': 'Tập bắn', 'Knives at a straw target.': 'Phi dao vào bia rơm.', 'Sprints': 'Chạy nước rút', 'Up and down the town walls.': 'Lên xuống tường thành.',
  'Endurance Runs': 'Chạy bền', 'Long runs in heavy boots.': 'Chạy đường dài với đôi giày nặng.', 'Meditation': 'Thiền', 'Sit very still. Harder than it sounds.': 'Ngồi thật yên. Khó hơn bạn nghĩ.',
  'Dice Games': 'Chơi xúc xắc', 'Lose a little, learn a lot.': 'Thua một chút, học được nhiều.', 'Tavern Storytelling': 'Kể chuyện ở quán rượu', 'Win the room with a good tale.': 'Chinh phục cả quán bằng một câu chuyện hay.',
  'Lookout Duty': 'Canh gác', 'Watch the road from the bell tower.': 'Quan sát con đường từ tháp chuông.', 'Elixirs of Growth': 'Thuốc tiên tăng trưởng',
  'Your player name is used in chat, on friend lists and on trades. Player accounts work on the game’s website.': 'Tên người chơi dùng trong trò chuyện, danh sách bạn bè và giao dịch. Tài khoản người chơi hoạt động trên trang web của game.',
  'Each character is checked before it is ranked: level against XP, stat points against levels, progress against the character\'s age, and fair names.': 'Mỗi nhân vật được kiểm tra trước khi xếp hạng: cấp so với XP, điểm chỉ số so với cấp, tiến độ so với tuổi nhân vật, và tên hợp lệ.',
  'Not ranked: a skill level does not match its XP': 'Không xếp hạng: cấp kỹ năng không khớp với XP',
  'Getting started': 'Bắt đầu', 'Gathering and proficiency': 'Thu thập và thành thạo', 'Regions and travel': 'Vùng đất và di chuyển', 'Classes, talents and Ascension': 'Lớp, thiên phú và Thăng thiên',
  'Pets, companions and sentient weapons': 'Thú cưng, đồng hành và vũ khí có linh hồn', 'Events and daily rewards': 'Sự kiện và thưởng hằng ngày', 'Guilds, friends and trading': 'Bang hội, bạn bè và giao dịch',
  'Secrets and the Lore Journal': 'Bí mật và Nhật ký truyền thuyết', 'Theme': 'Giao diện', 'Dark': 'Tối', 'Light': 'Sáng', 'Forest': 'Rừng', 'Ocean': 'Đại dương', 'Follow app': 'Theo ứng dụng', 'About': 'Giới thiệu',
    'days': 'ngày', '· best streak:': '· chuỗi dài nhất:',
  'Every player shares the same event. Weekly events change on Monday (UTC); holidays take over on their dates.': 'Mọi người chơi cùng chung một sự kiện. Sự kiện tuần đổi vào thứ Hai (UTC); ngày lễ sẽ thay thế vào đúng ngày.',
  'Leaderboards need the online game link or a Thousandfold server.': 'Bảng xếp hạng cần đường dẫn game trực tuyến hoặc máy chủ Thousandfold.',
  'is in the right place,': 'đúng vị trí,', 'is in the word but somewhere else,': 'có trong từ nhưng sai vị trí,',
  'isn’t in the word. Answers are fantasy words (swords, spells, monsters, places…); any common English word can be a guess. More daily games are on the way.': 'không có trong từ. Đáp án là các từ tiếng Anh giả tưởng (kiếm, phép thuật, quái vật, địa danh…); bạn có thể đoán bằng bất kỳ từ tiếng Anh thông dụng nào. Sẽ có thêm trò chơi mỗi ngày.',
    'Rumour has it that some places aren’t on any map at all.': 'Có lời đồn rằng vài nơi không hề có trên bản đồ nào.',
  'Opens after the tutorial.': 'Mở sau phần hướng dẫn.', 'Active': 'Đang làm', 'Board': 'Bảng', 'Weekly': 'Hằng tuần', 'Daily': 'Hằng ngày',
    'First Gathering': 'Lần thu thập đầu tiên', 'Practice Makes Perfect': 'Có công mài sắt', 'Two Hands': 'Hai tay', 'Coin in Your Pocket': 'Đồng xu trong túi', 'First Craft': 'Lần chế tạo đầu tiên',
  'Fuel Up': 'Nạp năng lượng', 'Growing Strong': 'Lớn mạnh', 'First Blood': 'Giọt máu đầu', 'The Local Menace': 'Mối họa địa phương',
};
const I18N_VI_TPL = [
  ['Lv {#}', 'Cấp {#}'], ['Level {#}', 'Cấp {#}'], ['Level {#}+', 'Cấp {#}+'], ['{#} pts', '{#} điểm'], ['{#} gold', '{#} vàng'], ['{#} shards', '{#} mảnh'],
  ['{N} Shards', 'Mảnh {N}'],
  ['Stamina {#}/{#}', 'Thể lực {#}/{#}'], ['Stamina {#} of {#}', 'Thể lực {#}/{#}'], ['Active buffs: {#}', 'Hiệu ứng đang có: {#}'], ['Slot {#} is empty', 'Ô {#} đang trống'],
  ['Find {#} secrets to open it', 'Tìm {#} bí mật để mở'], ['Mine {N}', 'Đào {N}', 'item'], ['Chop {N}', 'Chặt {N}', 'item'], ['Harvest {N}', 'Thu hoạch {N}', 'item'], ['Fish {N}', 'Câu {N}', 'item'], ['Gather {N}', 'Hái {N}', 'item'], ['Skin {N}', 'Lột {N}', 'item'],
  ['Auto-sell {N}', 'Tự bán {N}', 'item'], ['Needs {#} {N} ({#} so far).', 'Cần {#} {N} (đã có {#}).'], ['Keep {#}', 'Giữ {#}'], ['Unequip {N}', 'Tháo {N}'],
  ['{#} of {#} unlocked ·', 'Mở khóa {#}/{#} ·'], ['{#} more beyond it.', 'Còn {#} mục sau đó.'], ['{#} / {#} XP', '{#} / {#} XP'], ['Tier {#}', 'Bậc {#}'], ['Tier {#} · level {#}', 'Bậc {#} · cấp {#}'],
  ['{#} of {#} done', 'Xong {#}/{#}'], ['{#} of {#} owned', 'Có {#}/{#}'], ['Quest {#} of {#} · {N}', 'Nhiệm vụ {#}/{#} · {N}'], ['Quest {#}/{#}: {N}', 'Nhiệm vụ {#}/{#}: {N}'],
  ['Gather {#} {N} · {#}/{#}', 'Thu thập {#} {N} · {#}/{#}'], ['Gather {#} {N}', 'Thu thập {#} {N}'], ['Explore {N} to {#}', 'Thám hiểm {N} đến {#}'],
  ['Train {N}', 'Luyện {N}'], ['Today: {#} {N}', 'Hôm nay: {#} {N}'], ['Add a point to {N}', 'Cộng một điểm vào {N}'], ['Add five points to {N}', 'Cộng năm điểm vào {N}'],
  ['Remove a point from {N}', 'Bỏ một điểm khỏi {N}'], ['Respec ({#}g)', 'Đặt lại điểm ({#} vàng)'], ['Reset talents ({#}g)', 'Đặt lại thiên phú ({#} vàng)'], ['Needs {#} points.', 'Cần {#} điểm.'], ['Needs {#} point.', 'Cần {#} điểm.'],
  ['{#} points to spend', '{#} điểm để dùng'], ['Reach level {#}', 'Đạt cấp {#}'], ['Win {#} fights', 'Thắng {#} trận'], ['Fight · {#} stamina', 'Chiến đấu · {#} thể lực'], ['Explore {N} · {#} stamina', 'Thám hiểm {N} · {#} thể lực'],
  ['Collect day {#} reward', 'Nhận thưởng ngày {#}'], ['{#}-day streak', 'Chuỗi {#} ngày'], ['Buy · {#}g', 'Mua · {#} vàng'], ['Max ({#})', 'Tối đa ({#})'], ['Offline cap: {#} hours', 'Giới hạn ngoại tuyến: {#} giờ'],
  ['Runeword #{#}', 'Runeword #{#}'], ['Guess the {#}-letter word in {#} tries', 'Đoán từ {#} chữ cái trong {#} lượt'], ['Solved in {#}!', 'Giải được sau {#} lượt!'], ['Next word in', 'Từ mới sau'],
  ['No boost active today. Next win: {#}.', 'Hôm nay chưa có hiệu ứng. Lần thắng tới: {#}.'], ['Today’s boost: {#} XP and yield.', 'Hiệu ứng hôm nay: {#} XP và sản lượng.'],
  ['Top {#} characters. Ascension counts here: A{#} means not yet ascended. Your characters are posted each time you save to the cloud.', 'Top {#} nhân vật. Thăng thiên được tính: A{#} nghĩa là chưa thăng thiên. Nhân vật của bạn được đăng mỗi lần lưu lên đám mây.'],
  ['Thousandfold v{#} · prototype. Saves stay in this browser and, when you are signed in, in the cloud.', 'Thousandfold v{#} · bản thử nghiệm. Dữ liệu lưu trong trình duyệt này và trên đám mây khi bạn đăng nhập.'],
  ['Current: v{#}', 'Hiện tại: v{#}'], ['Tour · {#} of {#}', 'Hướng dẫn · {#}/{#}'], ['{#} undiscovered', '{#} chưa khám phá'], ['Today: {N}', 'Hôm nay: {N}'],
  ['Achievement unlocked: {N} ({#} pts)', 'Mở khóa thành tựu: {N} ({#} điểm)'], ['New Lore page: {N}', 'Trang truyền thuyết mới: {N}'], ['Grows {N}; leans {N}', 'Tăng {N}; thiên về {N}'],
  ['Innate: {N}', 'Nội tại: {N}'], ['Recruit at level {#}', 'Chiêu mộ ở cấp {#}'], ['Another incubator · {#}g', 'Thêm lò ấp · {#} vàng'], ['{N} arrives in {N}.', '{N} đến {N}.'],
  ['Newer save from {N}', 'Bản lưu mới hơn từ {N}'], ['☁ Newer save on {N}', '☁ Bản lưu mới hơn trên {N}'], ['Sell ({#})', 'Bán ({#})'], ['Sell all ({#}g)', 'Bán hết ({#} vàng)'],

  ['{#} Identity', '{#} Danh tính'], ['{#} Class', '{#} Lớp'], ['{#} Origin', '{#} Xuất thân'], ['{#} Region', '{#} Vùng đất'], ['{#} Confirm', '{#} Xác nhận'],
  ['Starts in {N}', 'Bắt đầu ở {N}'], ['Guide: {N} · Gear: {N}', 'Người dẫn đường: {N} · Trang bị: {N}'], ['Mail {#}', 'Thư {#}'], ['Lv {#} {N}', 'Cấp {#} {N}'],
  ['{N} T{#} · {#}s', '{N} T{#} · {#}s'], ['Stop {N}', 'Dừng {N}', 'item'], ['· {#} running', '· {#} đang chạy'], ['· {#} pts', '· {#} điểm'], ['. Start with Stone in Mining.', '. Hãy bắt đầu với Stone trong Khai khoáng.'],
  ['· day {#} of your streak. Collect it in Events.', '· ngày {#} của chuỗi. Nhận trong Sự kiện.'], ['🔤 Today’s Runeword', '🔤 Runeword hôm nay'], ['★ {N}', '★ {N}'],
  ['total · {N} ({#} speed) · yield {#}', 'tổng · {N} ({#} tốc độ) · sản lượng {#}'], ['{#} of {#} recipes ·', '{#}/{#} công thức ·'], ['made · output {#}', 'đã làm · sản phẩm {#}'],
  ['each · {#} XP · {#} stamina · can make', 'mỗi lần · {#} XP · {#} thể lực · làm được'], ['each · streak', 'mỗi lần · chuỗi'],
  ['{#} attack · {#} {N}', '{#} tấn công · {#} {N}'], ['{#} defense · {#} {N} · {#} {N}', '{#} phòng thủ · {#} {N} · {#} {N}'], ['{#} defense · {#} {N}', '{#} phòng thủ · {#} {N}'], ['{#} {N} speed', '{#} tốc độ {N}'],
  ['{#} (yours {#})', '{#} (của bạn {#})'], ['{#} more areas here, including the boss lair. Explore from the Map tab to find them.', 'Còn {#} khu vực ở đây, gồm cả hang trùm. Thám hiểm từ thẻ Bản đồ để tìm ra.'],
  ['Auto-battles in {N}. One fight at a time; it occupies stamina like any action.', 'Tự chiến đấu ở {N}. Mỗi lần một trận; chiếm thể lực như mọi hành động.'], ['{N} (starter area)', '{N} (khu khởi đầu)'],
  ['{#} floors, then {N}. Needs {#} stamina while you’re inside. Rewards on every floor you clear, even if you retreat later.', '{#} tầng, rồi đến {N}. Cần {#} thể lực khi ở bên trong. Có thưởng ở mỗi tầng vượt qua, kể cả khi rút lui sau đó.'],
  ['Boss power {#} · clear chance', 'Sức mạnh trùm {#} · tỉ lệ vượt'], ['Boss drops: {N} + gear ({N})', 'Trùm rơi: {N} + trang bị ({N})'], ['Defeat {N} first.', 'Hãy hạ {N} trước.'], ['· {#}/{#} today', '· {#}/{#} hôm nay'],
  ['Elder Brannoch of {N} has work for you. Finish these to open the world map. Each one grants a permanent stat point.', 'Trưởng lão Brannoch ở {N} có việc cho bạn. Hoàn thành để mở bản đồ thế giới. Mỗi nhiệm vụ cho một điểm chỉ số vĩnh viễn.'],
  ['Active ({#}/{#})', 'Đang làm ({#}/{#})'], ['{N} quest board', 'Bảng nhiệm vụ {N}'], ['{N} story', 'Câu chuyện {N}'],
  ['{#} of {#} found by {N} · {#} across your account (find {#} to open a fourth character slot).', '{N} đã tìm {#}/{#} · {#} trên toàn tài khoản (tìm {#} để mở ô nhân vật thứ tư).'],
  ['Take part: {#} of {#} actions during the event. Events you take part in count toward achievements.', 'Tham gia: {#}/{#} hành động trong sự kiện. Các sự kiện đã tham gia được tính vào thành tựu.'],
  ['Day {#}', 'Ngày {#}'], ['Jewelcrafting level {#}', 'Chế tác trang sức cấp {#}'], ['Sell {#}', 'Bán {#}'], ['Lv {#} {N} {N}', 'Cấp {#} {N} {N}'], ['{N} · Orphan from {N}', '{N} · Mồ côi từ {N}'],
  ['{#} {N} yield · soft cap at {#}', '{#} sản lượng {N} · giới hạn mềm {#}'], ['Base {#}', 'Gốc {#}'], ['Base {#} · Race {#}', 'Gốc {#} · Chủng tộc {#}'], ['Base {#} · Origin {#}', 'Gốc {#} · Xuất thân {#}'],
  ['{#} action speed (cap {#}) · soft cap at {#}', '{#} tốc độ hành động (tối đa {#}) · giới hạn mềm {#}'], ['{#} max HP · soft cap at {#}', '{#} máu tối đa · giới hạn mềm {#}'],
  ['{#} XP; better enchant odds · soft cap at {#}', '{#} XP; phù phép dễ thành công hơn · giới hạn mềm {#}'], ['{#} shop discount · soft cap at {#}', '{#} giảm giá cửa hàng · giới hạn mềm {#}'],
  ['{#} bonus find · soft cap at {#}', '{#} tìm thêm · giới hạn mềm {#}'], ['{#} base {N} · soft cap at {#}', '{#} {N} gốc · giới hạn mềm {#}'], ['of {#} cap', 'trên tối đa {#}'],
  ['{#} max stamina; {#} {N} yield · soft cap at {#}', '{#} thể lực tối đa; {#} sản lượng {N} · giới hạn mềm {#}'], ['{#} {N} yield; better craft quality · soft cap at {#}', '{#} sản lượng {N}; chế tạo chất lượng hơn · giới hạn mềm {#}'],
  ['Accuracy, crit chance, ranged damage, fine-crafting yield, and {#} Stamina per {#} points (soft-capped).', 'Chính xác, tỉ lệ chí mạng, sát thương tầm xa, sản lượng chế tạo tinh xảo, và {#} Thể lực mỗi {#} điểm (giới hạn mềm).'],
  ['Dodge, combat turn speed, travel speed, and a small action speed bonus (capped at {#}).', 'Né tránh, tốc độ lượt đánh, tốc độ di chuyển, và một chút tốc độ hành động (tối đa {#}).'],
  ['Rare drop chance, egg and pet chance, {N} chance, and secret event odds.', 'Tỉ lệ rơi đồ hiếm, trứng và thú cưng, tỉ lệ {N}, và cơ hội sự kiện bí mật.'],
  ['Shop discounts (capped), reputation gain, market fee reduction (capped), companion bond gain, extra dialogue.', 'Giảm giá cửa hàng (có giới hạn), tăng danh tiếng, giảm phí chợ (có giới hạn), tăng gắn kết đồng hành, thêm hội thoại.'],
  ['🔒 Reach level {#}', '🔒 Đạt cấp {#}'], ['🔒 Collect {#} pet species', '🔒 Sưu tầm {#} loài thú cưng'], ['🔒 Find {#} secrets', '🔒 Tìm {#} bí mật'], ['🔒 Win {#} boss fights', '🔒 Thắng {#} trận đánh trùm'],
  ['🔒 Take part in {#} world event', '🔒 Tham gia {#} sự kiện thế giới'], ['🔒 Take part in {#} world events', '🔒 Tham gia {#} sự kiện thế giới'], ['🔒 Ascend once', '🔒 Thăng thiên một lần'],
  ['🔒 Reach Gold in the Arena', '🔒 Đạt hạng Vàng ở Đấu trường'], ['🔒 Reach Champion in the Arena', '🔒 Đạt hạng Vô địch ở Đấu trường'], ['🔒 Found in loot chests', '🔒 Có trong rương báu'],
  ['{N} · resource: {N} · grows {N}, leans {N}', '{N} · tài nguyên: {N} · tăng {N}, thiên về {N}'], ['{#} attack, {#} max HP.', '{#} tấn công, {#} máu tối đa.'], ['{#} {N}, {#} {N}, new talents', '{#} {N}, {#} {N}, thiên phú mới'],
  ['Advancement: tier {#}', 'Thăng cấp: bậc {#}'], ['{N} will test you for tier {#}', '{N} sẽ thử thách bạn để lên bậc {#}'], ['Travel to {N} and find {N}', 'Đến {N} và tìm {N}'],
  ['{#} XP from everything per rank', '{#} XP từ mọi nguồn mỗi bậc'], ['{#} gathering and crafting yield per rank', '{#} sản lượng thu thập và chế tạo mỗi bậc'], ['{#} attack and max HP per rank', '{#} tấn công và máu tối đa mỗi bậc'],
  ['{#} {N} chance per rank', '{#} tỉ lệ {N} mỗi bậc'], ['{#} bonus-find chance per rank', '{#} tỉ lệ tìm thêm mỗi bậc'], ['{#} gold from selling per rank', '{#} vàng khi bán mỗi bậc'],
  ['{#} hour offline cap per rank', '{#} giờ giới hạn ngoại tuyến mỗi bậc'], ['{#} stamina (one more action at a time) per rank', '{#} thể lực (thêm một hành động cùng lúc) mỗi bậc'], ['{#} inventory slots per rank', '{#} ô túi đồ mỗi bậc'],
  ['· spent {#}', '· đã dùng {#}'], ['Needs {N} {#}', 'Cần {N} {#}'], ['Capstone · {#} points', 'Đỉnh cao · {#} điểm'], ['Next: {N}', 'Tiếp theo: {N}'],
  ['At full strength: {#} attack, {#} defense. Starts at a quarter of that and grows with level, bond and gear.', 'Khi đủ sức: {#} tấn công, {#} phòng thủ. Bắt đầu ở một phần tư và tăng theo cấp, gắn kết và trang bị.'],
  ['Send an unslotted pet away for {#} {#} or {#} hours. It comes back with pet XP and resources from the region it left. {#} places.', 'Gửi một thú cưng không trong ô đi {#}, {#} hoặc {#} giờ. Nó trở về với XP và tài nguyên từ vùng đó. {#} chỗ.'],
  ['Two pets of level {#}+ with the right mix of types can make a hybrid egg. Costs {#}g, tires them out, and the nest needs {#} hours to rest.', 'Hai thú cưng cấp {#}+ với tổ hợp loại phù hợp có thể đẻ trứng lai. Tốn {#} vàng, làm chúng mệt, và tổ cần nghỉ {#} giờ.'],
  ['No pets at level {#} yet.', 'Chưa có thú cưng cấp {#}.'], ['{#} left', 'còn {#}'], ['{N} Shop', 'Cửa hàng {N}'], ['{N} Shard exchange', 'Đổi Mảnh {N}'],
  ['Each hourglass adds {#} hours of offline progress, up to {#}', 'Mỗi đồng hồ cát thêm {#} giờ tiến độ ngoại tuyến, tối đa {#}'], ['{#} inventory · {#}g', '{#} túi đồ · {#} vàng'], ['{#} bank · {#}g', '{#} ngân hàng · {#} vàng'],
  ['cap {#}', 'tối đa {#}'], ['{#} / {#} · next lesser {#}', '{#} / {#} · loại nhỏ tiếp theo {#}'], ['Type a {#}-letter word and press Enter.', 'Gõ một từ {#} chữ cái rồi nhấn Enter.'],
  ['{N}: {#} {N} and {N} yield.', '{N}: {#} sản lượng {N} và {N}.'], ['{N}: {#} {N} and {N} speed.', '{N}: {#} tốc độ {N} và {N}.'], ['{N}: {#} XP from every source.', '{N}: {#} XP từ mọi nguồn.'],
  ['{N}: {#} gold from selling.', '{N}: {#} vàng khi bán.'], ['{N}: {#} hour offline cap.', '{N}: {#} giờ giới hạn ngoại tuyến.'], ['{N}: {#} action speed on every skill.', '{N}: {#} tốc độ hành động cho mọi kỹ năng.'],
  ['{N}: {#} {N} chance.', '{N}: {#} tỉ lệ {N}.'], ['Gathering {#}/{#}', 'Thu thập {#}/{#}'], ['Unlocked {#}/{#}/{#}', 'Đã mở {#}/{#}/{#}'],
  ['Every {#} of a collection gives a small permanent bonus: pets add gathering yield, monsters add rare drops, items add XP, regions add travel speed.', 'Mỗi {#} món trong bộ sưu tập cho một điểm cộng nhỏ vĩnh viễn: thú cưng tăng sản lượng thu thập, quái vật tăng đồ hiếm, vật phẩm tăng XP, vùng đất tăng tốc độ di chuyển.'],
  ['Recognition only: achievements never give stats or items. Pin up to three for your profile. {#} hidden ones remain.', 'Chỉ để ghi nhận: thành tựu không bao giờ cho chỉ số hay vật phẩm. Ghim tối đa ba cái lên hồ sơ. Còn {#} thành tựu ẩn.'],
  ['The banker pays {#} a day on up to {#} gold, accruing even while you are away.', 'Chủ ngân hàng trả {#} mỗi ngày cho tối đa {#} vàng, vẫn tính lãi khi bạn vắng mặt.'],
  ['Auto-saves every {#} seconds and when you leave. Saves live in this browser; copy a save code (short and compressed) or save it as a file to move it.', 'Tự lưu mỗi {#} giây và khi bạn rời đi. Dữ liệu nằm trong trình duyệt này; sao chép mã lưu (ngắn, đã nén) hoặc lưu thành tệp để chuyển đi.'],
  ['Each region has a {#}-part story that starts when you first arrive and finish the tutorial.', 'Mỗi vùng có một câu chuyện {#} phần, bắt đầu khi bạn đến lần đầu và đã xong hướng dẫn.'],
  ['A new puzzle every day, the same for everyone. Win for a boost to XP and yield for all your characters until midnight, plus shards. Keep a streak going for a bigger boost (up to {#}).', 'Mỗi ngày một câu đố mới, giống nhau cho mọi người. Thắng để tăng XP và sản lượng cho mọi nhân vật đến nửa đêm, kèm theo mảnh. Giữ chuỗi để tăng nhiều hơn (tối đa {#}).'],
  ['Explore to {#} to find it', 'Thám hiểm đến {#} để tìm ra'], ['Each chapter: {#} STR permanently', 'Mỗi chương: {#} STR vĩnh viễn'],
  ['Below {#} HP you eat automatically. Cook fish for combat food. HP regenerates when you are not fighting.', 'Dưới {#} máu bạn sẽ tự ăn. Nấu cá để làm thức ăn chiến đấu. Máu tự hồi khi không chiến đấu.'],
  ['Gear adds stats, attack and defense; tools add speed to their skill ({#} cap).', 'Trang bị tăng chỉ số, tấn công và phòng thủ; công cụ tăng tốc độ cho kỹ năng của nó (tối đa {#}).'],
  // generic splitters last: each piece is translated on its own
  ['▾ {N}', '▾ {N}'], ['▸ {N}', '▸ {N}'], ['{N} · {N}', '{N} · {N}'], ['{N}: {N}', '{N}: {N}'], ['{#} {N}', '{#} {N}'], ['{N} ·', '{N} ·'], ['· {N}', '· {N}'],
];

// ---- translator ----
const I18N_NUM = '([+\\-−]?\\d[\\d,.]*(?:[KMBTkmb]|e\\d+)?%?)';
let I18N_RX = null, I18N_ITEMS = null;
const i18nIsItem = n => { if (!I18N_ITEMS) { I18N_ITEMS = new Set(); if (typeof ITEMS !== 'undefined') for (const it of Object.values(ITEMS)) if (it && it.name) I18N_ITEMS.add(it.name); if (typeof CHAIN !== 'undefined') for (const l of Object.values(CHAIN)) for (const r of l || []) if (r && r.name) I18N_ITEMS.add(r.name); if (typeof RESOURCES !== 'undefined') for (const r of Object.values(RESOURCES)) if (r && r.name) I18N_ITEMS.add(r.name); } return I18N_ITEMS.has(String(n).trim()); }; const I18N_CACHE = new Map();
function i18nCompile() {
  I18N_RX = I18N_VI_TPL.map(([en, vi, need]) => {
    const kinds = []; const src = en.replace(/[.*+?^${}()|[\]\\]/g, m => m === '{' || m === '}' ? m : '\\' + m)
      .replace(/\{#\}|\{N\}/g, m => { kinds.push(m); return m === '{#}' ? I18N_NUM : '(.+?)'; });
    return { rx: new RegExp('^' + src + '$'), vi, kinds, need };
  });
}
function trVI(s) {
  if (I18N_CACHE.has(s)) return I18N_CACHE.get(s);
  let out = s; I18N_CACHE.set(s, s); // guards against re-entry while translating pieces
  const m0 = s.match(/^(\s*)([\s\S]*?)(\s*)$/), lead = m0[1], core = m0[2], tail = m0[3];
  if (core && /[A-Za-z]/.test(core) && core.length < 400) {
    if (I18N_VI[core] != null) out = lead + I18N_VI[core] + tail;
    else {
      if (!I18N_RX) i18nCompile();
      for (const t of I18N_RX) {
        const m = core.match(t.rx); if (!m) continue;
        if (t.need === 'item' && !i18nIsItem(m[1])) continue;
        let i = 0; const parts = m.slice(1);
        const res = t.vi.replace(/\{#\}|\{N\}/g, ph => { const v = parts[i++] || ''; return ph === '{N}' ? trVI(v) : v; });
        out = lead + res + tail; break;
      }
    }
  }
  if (I18N_CACHE.size > 20000) I18N_CACHE.clear();
  I18N_CACHE.set(s, out); return out;
}
const I18N_ATTRS = ['title', 'placeholder', 'aria-label'];
function i18nNode(n) {
  if (n.nodeType === 3) { const p = n.parentElement; if (p && (p.closest('script,style,textarea,[data-noi18n]'))) return; const v = n.nodeValue, t = trVI(v); if (t !== v) n.nodeValue = t; return; }
  if (n.nodeType !== 1 || n.closest('[data-noi18n]')) return;
  for (const a of I18N_ATTRS) { const v = n.getAttribute(a); if (v) { const t = trVI(v); if (t !== v) n.setAttribute(a, t); } }
  if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA') return;
  const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let c;
  while ((c = w.nextNode())) {
    if (c.nodeType === 1) { if (c.hasAttribute('data-noi18n')) continue; for (const a of I18N_ATTRS) { const v = c.getAttribute(a); if (v) { const t = trVI(v); if (t !== v) c.setAttribute(a, t); } } }
    else { const p = c.parentElement; if (p && p.closest('script,style,textarea,[data-noi18n]')) continue; const v = c.nodeValue, t = trVI(v); if (t !== v) c.nodeValue = t; }
  }
}
let i18nObs = null;
function applyLang() {
  const vi = langNow() === 'vi';
  document.documentElement.lang = vi ? 'vi' : 'en';
  if (vi && !i18nObs && typeof MutationObserver !== 'undefined') {
    i18nObs = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') i18nNode(m.target); else if (m.type === 'attributes') i18nNode(m.target); else m.addedNodes.forEach(i18nNode); } });
    i18nObs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
    i18nNode(document.body);
  } else if (!vi && i18nObs) { i18nObs.disconnect(); i18nObs = null; }
}
function setLang(l) {
  if (!LANGS.some(x => x[0] === l) || l === langNow()) return;
  const was = langNow(); account.settings.lang = l; save();
  if (was === 'vi' && l === 'en') { applyLang(); }
  else applyLang();
  // Re-render so every string is drawn fresh in the new language.
  if (screen === 'game' && ch) { renderTop(); renderNav(); renderMain(); renderActions(); renderSide && renderSide(); } else if (screen === 'select') renderSelect();
}
const langButton = () => { const cur = LANGS.find(x => x[0] === langNow()) || LANGS[0]; return `<button class="langbtn" data-act="langmenu" data-noi18n aria-label="Language / Ngôn ngữ" title="Language / Ngôn ngữ"><span class="globe" aria-hidden="true">\u{1F310}</span> ${cur[1]}</button>`; };
const I18N_HANDLERS = {
  langmenu: () => modal(`<div data-noi18n><h3>Language · Ngôn ngữ</h3><div class="col" style="display:grid;gap:8px;margin-top:10px">${LANGS.map(([id, n]) => `<button class="${langNow() === id ? 'pri' : ''}" data-act="setlang" data-arg="${id}">${n}${langNow() === id ? ' ✓' : ''}</button>`).join('')}</div>
    <p class="mute" style="font-size:13px;margin:10px 0 0">Names of places, monsters and items stay in English. · Tên địa danh, quái vật và vật phẩm được giữ nguyên tiếng Anh.</p></div>`),
  setlang: l => { closeModal(); setLang(l); },
};
