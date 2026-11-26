// ============================================================
// PRESTIGE AND EVENTS (Phase 13): the Ascension perk tree, world
// events everyone shares, and the daily login streak.
// ============================================================

// ---------- Ascension perks: one point per Ascension, spent here. ----------
const PERKS = [
  { id:'hands', name:'Old Hands', text:'+5% XP from everything', max:5, mods:{ xp:0.05 } },
  { id:'steady', name:'Steady Hands', text:'+5% gathering and crafting yield', max:5, mods:{ gyield:0.05, cyield:0.05 } },
  { id:'veteran', name:'Veteran', text:'+5% attack and max HP', max:5, mods:{ atk:0.05, hp:0.05 } },
  { id:'fortune', name:'Fortune’s Favour', text:'+1% Lucky Strike chance', max:5, mods:{ luckStrike:0.01 } },
  { id:'eyes', name:'Sharp Eyes', text:'+1% bonus-find chance', max:5, mods:{ bonusFind:0.01 } },
  { id:'gilded', name:'Gilded Touch', text:'+5% gold from selling', max:5, mods:{ sell:0.05 } },
  { id:'swift', name:'Swift Return', text:'+1 hour offline cap', max:4, mods:{ offlineH:1 } },
  { id:'wind', name:'Second Wind', text:'+1 stamina (one more action at a time)', max:2, mods:{ stamina:1 } },
  { id:'pockets', name:'Deep Pockets', text:'+20 inventory slots', max:5, slots:20 },
];
const PERK_BY = Object.fromEntries(PERKS.map(p => [p.id, p]));
const PERK_RESET_SHARDS = 10;
const perkSpent = c => Object.values(c.perks || {}).reduce((s, n) => s + n, 0);
const perkFree = c => (c.ascension || 0) - perkSpent(c);
function perkMods(c, M) { for (const [id, n] of Object.entries(c.perks || {})) { const p = PERK_BY[id]; if (p && p.mods && n > 0) addMods(M, p.mods, n); } }
function buyPerk(id) {
  const p = PERK_BY[id]; ch.perks = ch.perks || {};
  if (!p || perkFree(ch) < 1 || (ch.perks[id] || 0) >= p.max) return;
  ch.perks[id] = (ch.perks[id] || 0) + 1;
  if (p.slots) ch.invSlots += p.slots;
  ch.counters.perksSpent = perkSpent(ch);
  addLog('lucky', `Ascension perk: ${p.name} ${ch.perks[id]}/${p.max}.`); toast(`<b>${esc(p.name)}</b> ${ch.perks[id]}/${p.max}`, 'gold'); chime(659, 988);
  dirty = true; save();
}
function resetPerks() {
  if (account.shards < PERK_RESET_SHARDS || !perkSpent(ch)) return;
  const pk = (ch.perks || {}).pockets || 0; ch.invSlots -= pk * PERK_BY.pockets.slots;
  account.shards -= PERK_RESET_SHARDS; ch.perks = {}; addLog('sys', 'Ascension perks reset.'); dirty = true; save();
}
function perkCard() {
  const free = perkFree(ch), spent = perkSpent(ch);
  return `<div class="card" style="margin-top:14px"><div class="spread"><h3>Ascension perks</h3><span class="chip ${free ? 'on' : ''}">${free} point${free === 1 ? '' : 's'} to spend</span></div>
    <p class="mute" style="margin:4px 0 10px;font-size:14px">${ch.ascension ? `Every Ascension gives one perk point. You have ascended ${ch.ascension} time${ch.ascension === 1 ? '' : 's'}.` : 'Every Ascension gives one perk point to spend here. Ascend for the first time to earn one.'}</p>
    <div class="perks">${PERKS.map(p => { const n = (ch.perks || {})[p.id] || 0, can = free > 0 && n < p.max;
      return `<div class="perk ${n ? 'has' : ''}"><div class="spread"><b>${esc(p.name)}</b><span class="pips">${'●'.repeat(n)}${'○'.repeat(p.max - n)}</span></div><div class="mute" style="font-size:13px">${esc(p.text)} per rank${n ? ` · now ${esc(perkNow(p, n))}` : ''}</div>
        <button class="sm ${can ? 'pri' : ''}" data-act="perk" data-arg="${p.id}" ${can ? '' : 'disabled'} style="margin-top:6px">${n >= p.max ? 'Maxed' : 'Add a point'}</button></div>`; }).join('')}</div>
    ${spent ? `<div class="row" style="margin-top:10px"><button class="sm ghost" data-act="perkreset" ${account.shards >= PERK_RESET_SHARDS ? '' : 'disabled'}>Reset perks (${PERK_RESET_SHARDS} Thousandium)</button></div>` : ''}</div>`;
}
function perkNow(p, n) {
  if (p.slots) return `+${p.slots * n} slots`;
  const [k, v] = Object.entries(p.mods)[0];
  return k === 'offlineH' ? `+${v * n} h` : k === 'stamina' ? `+${v * n} stamina` : `+${Math.round(v * n * 100)}%`;
}

// ---------- World events: the same event for every player, by calendar week. ----------
const WORLD_EVENTS = [
  { id:'harvest', name:'Harvest Week', text:'Fields and gardens overflow: +25% Farming and Herbalism yield.', mods:{ skillYield:{ farming:0.25, herbalism:0.25 } } },
  { id:'derby', name:'Fishing Derby', text:'The fish are biting: +25% Fishing yield and XP.', mods:{ skillYield:{ fishing:0.25 }, skillXp:{ fishing:0.25 } } },
  { id:'deepdelve', name:'Deep Delve', text:'Fresh seams everywhere: +25% Mining yield.', mods:{ skillYield:{ mining:0.25 } } },
  { id:'timber', name:'Timber Week', text:'The forests are generous: +25% Woodcutting and Skinning yield.', mods:{ skillYield:{ woodcutting:0.25, skinning:0.25 } } },
  { id:'forge', name:'Forgefire', text:'Every forge burns hot: +20% crafting yield.', mods:{ cyield:0.20 } },
  { id:'bloodmoon', name:'Blood Moon', text:'Monsters grow bold, and so do you: +15% attack and +25% Slaying XP.', mods:{ atk:0.15, skillXp:{ slaying:0.25 } } },
  { id:'scholar', name:'Scholar’s Week', text:'Everything is a lesson: +15% XP from everything.', mods:{ xp:0.15 } },
  { id:'fortune', name:'Lucky Stars', text:'Fortune favours everyone: +2% Lucky Strike and bonus-find chance.', mods:{ luckStrike:0.02, bonusFind:0.02 } },
];
const HOLIDAY_EVENTS = [
  { id:'spooky', name:'Lantern Night', from:[10, 25], to:[11, 1], text:'Lanterns in every window and something in the fog: +15% XP and +15% gathering yield.', mods:{ xp:0.15, gyield:0.15 } },
  { id:'winter', name:'Winter Lights', from:[12, 18], to:[1, 2], text:'Warm hearths, long nights: +20% gathering and crafting yield.', mods:{ gyield:0.20, cyield:0.20 } },
  { id:'spring', name:'First Bloom', from:[3, 20], to:[3, 27], text:'Everything grows at once: +30% Farming and Herbalism yield, +10% XP.', mods:{ skillYield:{ farming:0.30, herbalism:0.30 }, xp:0.10 } },
  { id:'midsummer', name:'Midsummer Fair', from:[6, 20], to:[6, 27], text:'The fair is in town: +15% gold from selling and +10% XP.', mods:{ sell:0.15, xp:0.10 } },
];
const EVENT_JOIN_ACTIONS = 1000;
function weekInfo(t) {
  const d = new Date(t), day = (d.getUTCDay() + 6) % 7, mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
  return { start: mon, end: mon + 7 * 864e5, n: Math.floor(mon / (7 * 864e5)) };
}
function holidayAt(t) {
  const d = new Date(t), md = (d.getMonth() + 1) * 100 + d.getDate();
  return HOLIDAY_EVENTS.find(h => { const a = h.from[0] * 100 + h.from[1], b = h.to[0] * 100 + h.to[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; });
}
function worldEventAt(t) {
  const h = holidayAt(t);
  if (h) {
    const d = new Date(t); let start = new Date(d.getFullYear(), h.from[0] - 1, h.from[1]).getTime(); if (start > t) start = new Date(d.getFullYear() - 1, h.from[0] - 1, h.from[1]).getTime();
    const sy = new Date(start).getFullYear(), end = new Date(sy + (h.to[0] < h.from[0] ? 1 : 0), h.to[0] - 1, h.to[1] + 1).getTime();
    return Object.assign({ holiday: true, key: h.id + '-' + sy, start, end }, h);
  }
  const w = weekInfo(t), e = WORLD_EVENTS[((w.n % WORLD_EVENTS.length) + WORLD_EVENTS.length) % WORLD_EVENTS.length];
  // A week that a holiday cuts into ends when the holiday starts.
  let end = w.end; for (let x = t + 36e5; x < w.end; x += 36e5) if (holidayAt(x)) { end = new Date(new Date(x).setHours(0, 0, 0, 0)).getTime(); break; }
  return Object.assign({ key: e.id + '-' + w.n, start: w.start, end }, e);
}
const worldEvent = () => worldEventAt(Date.now());
function worldEventMods(c, M) { const e = worldEvent(); if (e && e.mods) addMods(M, e.mods, 1); }
function upcomingEvents(n) {
  const out = []; let t = worldEvent().end + 1000;
  while (out.length < n) { const e = worldEventAt(t); if (!out.length || out[out.length - 1].key !== e.key) out.push(e); t = e.end + 1000; }
  return out;
}
// Taking part: 1,000 actions during an event earns it for your record.
let evMark = null;
function eventTick() {
  if (!ch || (typeof SIM !== 'undefined' && SIM)) return;
  const e = worldEvent(), tot = (ch.counters.gathered || 0) + (ch.counters.crafted || 0) + (ch.counters.kills || 0);
  ch.events = ch.events || {};
  if (evMark == null || evMark.c !== ch.id) { evMark = { c: ch.id, t: tot }; }
  const d = Math.max(0, tot - evMark.t); evMark.t = tot;
  if (!ch.events[e.key]) ch.events[e.key] = { n: 0, done: false };
  const E = ch.events[e.key]; E.n += d;
  if (!E.done && E.n >= EVENT_JOIN_ACTIONS) {
    E.done = true; ch.counters.eventsJoined = Object.values(ch.events).filter(x => x.done).length;
    addLog('lucky', `You took part in ${e.name}! (${ch.counters.eventsJoined} event${ch.counters.eventsJoined === 1 ? '' : 's'} so far)`);
    toast(`<b>${esc(e.name)}</b>: you took part! It’s in your record.`, 'gold'); chime(784, 1175); dirty = true;
  }
  dailyCheck();
}

// ---------- Daily login streak ----------
const DAILY = [
  { gold: 300 }, { item: ['potion_prod', 2] }, { gold: 800 }, { item: ['egg_common', 1] }, { gold: 2000 }, { item: ['potion_prod2', 2] }, { item: ['egg_rare', 1], shards: 2 },
];
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function dailyCheck() {
  const today = dayKey(Date.now()); ch.daily = ch.daily || { day: '', streak: 0, claimed: true, best: 0 };
  const D_ = ch.daily; if (D_.day === today) return;
  const yest = dayKey(Date.now() - 864e5);
  D_.streak = D_.day === yest ? D_.streak + 1 : 1; D_.day = today; D_.claimed = false; D_.best = Math.max(D_.best || 0, D_.streak);
  ch.counters.bestStreak = D_.best; dirty = true;
  if (screen === 'game') toast(`<b>Daily reward ready</b> · day ${D_.streak} of your streak. Collect it in Events.`, 'gold');
}
function dailyText(i) {
  const R = DAILY[i], p = [];
  if (R.gold) { const wk = Math.floor((((ch.daily && ch.daily.streak) || 1) - 1) / 7); p.push(`${N(dailyReward(wk * 7 + i + 1).gold)} gold`); }
  if (R.item) p.push(`${R.item[1] > 1 ? R.item[1] + '\u00d7 ' : ''}${ITEM(R.item[0]).name}`); if (R.shards) p.push(`${R.shards} Thousandium`);
  return p.join(' + ');
}
function dailyReward(streak) {
  const R = DAILY[(streak - 1) % 7], out = Object.assign({}, R);
  if (R.gold) out.gold = scaled(ch, R.gold * (1 + Math.floor((streak - 1) / 7) * 0.5), 1);
  return out;
}
function claimDaily() {
  const D_ = ch.daily; if (!D_ || D_.claimed) return;
  const R = dailyReward(D_.streak), got = [];
  if (R.gold) { ch.gold += R.gold; ch.counters.goldEarned += R.gold; got.push(`${N(R.gold)} gold`); }
  if (R.item) { addItem(R.item[0], R.item[1], true); got.push(`${R.item[1] > 1 ? R.item[1] + '\u00d7 ' : ''}${ITEM(R.item[0]).name}`); }
  if (R.shards) { account.shards += R.shards; ch.counters.shardsEarned += R.shards; got.push(`${R.shards} Thousandium`); }
  D_.claimed = true; addLog('lucky', `Daily reward (day ${D_.streak}): ${got.join(', ')}.`); toast(`<b>Day ${D_.streak}:</b> ${esc(got.join(', '))}`, 'gold'); chime(659, 988);
  dirty = true; save();
}

// ---------- Events tab ----------
function tabEvents() {
  const e = worldEvent(), E = (ch.events || {})[e.key] || { n: 0, done: false }, D_ = ch.daily || { streak: 0, claimed: true };
  const left = Math.max(0, (e.end - Date.now()) / 1000), up = upcomingEvents(4);
  const day = ((D_.streak || 1) - 1) % 7;
  return `<h2>Events</h2>
    <div class="card evnow" style="margin-top:10px"><div class="spread"><span class="chip on">${e.holiday ? 'Holiday event' : 'This week'}</span><span class="mute" style="font-size:13px">ends in <b>${fmtTime(left)}</b></span></div>
      <h3 style="margin:8px 0 4px;font-size:22px">${esc(e.name)}</h3><p style="margin:0">${esc(e.text)}</p>
      <p class="mute" style="font-size:13px;margin:8px 0 0">${E.done ? '✓ You took part in this event.' : `Take part: ${N(Math.min(E.n, EVENT_JOIN_ACTIONS))} of ${N(EVENT_JOIN_ACTIONS)} actions during the event. Events you take part in count toward achievements.`}</p>
      ${E.done ? '' : `<div class="gbar" style="margin-top:6px"><div class="gfill" style="width:${Math.min(100, E.n / EVENT_JOIN_ACTIONS * 100).toFixed(1)}%"></div></div>`}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;margin-top:12px;align-items:start">
      <div class="card"><div class="spread"><h3>Daily reward</h3><span class="chip">${D_.streak || 0}-day streak</span></div>
        <div class="daily">${DAILY.map((r, i) => `<div class="dday ${i < day || (i === day && D_.claimed) ? 'got' : i === day ? 'now' : ''}"><b>Day ${i + 1}</b><span>${esc(dailyText(i))}</span></div>`).join('')}</div>
        ${D_.claimed ? '<p class="mute" style="font-size:13px;margin:8px 0 0">Collected today. Come back tomorrow to keep your streak; miss a day and it starts again. Gold rewards grow every week you keep it going.</p>'
          : `<button class="pri" data-act="daily" style="margin-top:8px">Collect day ${D_.streak} reward</button>`}</div>
      <div class="card"><h3>Coming up</h3><div class="grid" style="gap:6px;margin-top:8px">${up.map(u => `<div><b>${esc(u.name)}</b>${u.holiday ? ' <span class="chip" style="font-size:11px">holiday</span>' : ''} <span class="mute" style="font-size:12px">${new Date(Math.max(u.start, Date.now())).toLocaleDateString([], { month: 'short', day: 'numeric' })} \u2013 ${new Date(u.end - 1).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span><div class="mute" style="font-size:13px">${esc(u.text)}</div></div>`).join('')}</div>
        <p class="mute" style="font-size:12px;margin:8px 0 0">Every player shares the same event. Weekly events change on Monday (UTC); holidays take over on their dates.</p></div>
    </div>
    <p class="mute" style="margin-top:12px">Events taken part in: <b>${ch.counters.eventsJoined || 0}</b> · best streak: <b>${(ch.daily && ch.daily.best) || 0}</b> days</p>`;
}
const PRESTIGE_HANDLERS = {
  perk: id => { buyPerk(id); renderMain(); renderSide(); },
  perkreset: () => modal(`<h3>Reset your perks?</h3><p>All ${perkSpent(ch)} points come back to spend again. Costs ${PERK_RESET_SHARDS} Thousandium.</p><div class="row"><button class="pri" data-act="perkresetok">Reset</button><button data-act="close">Cancel</button></div>`),
  perkresetok: () => { closeModal(); resetPerks(); renderMain(); },
  daily: () => { claimDaily(); renderMain(); renderTop(); },
};

ACHIEVEMENTS.push(
  { id:'ev_1', cat:'Social', name:'Joining In', desc:'Take part in a world event (1,000 actions during it).', pts:10, goal:1, stat:'eventsJoined' },
  { id:'ev_10', cat:'Social', name:'Never Miss a Party', desc:'Take part in 10 world events.', pts:30, goal:10, stat:'eventsJoined' },
  { id:'streak_7', cat:'Social', name:'Regular', desc:'Reach a 7-day login streak.', pts:10, goal:7, stat:'bestStreak' },
  { id:'streak_30', cat:'Social', name:'Part of the Furniture', desc:'Reach a 30-day login streak.', pts:30, goal:30, stat:'bestStreak' },
  { id:'guild_1', cat:'Social', name:'Strength in Numbers', desc:'Join or found a guild.', pts:10, goal:1, stat:'guildJoined' },
  { id:'perk_1', cat:'Economy', name:'Perks of the Job', desc:'Spend your first Ascension perk point.', pts:10, goal:1, stat:'perksSpent' },
);
