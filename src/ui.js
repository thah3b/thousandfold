// ============================================================
// UI — icons, screens, tabs and commands.
// ============================================================
let mapSel = null, wz = null, pend = {}, invQ = '', invF = 'all', invSort = 'rarity', achCat = 'Gathering', profSkill = 'mining', craftCat = {}, showLocked = false, charSkill = 'mining';

// ---------- Icons ----------
const svg = (body, s) => `<svg class="ico" width="${s || 34}" height="${s || 34}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
const HI = '<path d="M0 0" />';
function oreIcon(color, size, glow) {
  return svg(`${glow ? `<circle cx="16" cy="17" r="14" fill="${color}" opacity=".25"/>` : ''}<path d="M3 22 9 11 18 8 27 13 30 23 20 28 7 27Z" fill="#4a3d36"/><path d="M3 22 7 27 20 28 30 23 19 22Z" fill="#2c231f"/><path d="M9 11 18 8 27 13 17 13Z" fill="#62524a"/>
<path d="M10 21 12.5 12 16 20Z" fill="${color}"/><path d="M12.5 12 16 20 14 21Z" fill="#000" opacity=".28"/><path d="M10 21 12.5 12 11.6 20Z" fill="#fff" opacity=".35"/>
<path d="M17 22 20 14 23.5 21.5Z" fill="${color}"/><path d="M20 14 23.5 21.5 21.4 22Z" fill="#000" opacity=".28"/><path d="M17 22 20 14 19.2 21.6Z" fill="#fff" opacity=".35"/><path d="M14.5 24 16 19.5 18 24Z" fill="${color}" opacity=".9"/>`, size);
}
function resIcon(r, size) {
  return pxRes(r, size || 34, tierOf(ch ? ch.prof[r.id] || 0 : 0) >= 9);
}
const SLOT_GLYPH = {
  weapon: c => `<path d="M24 4 27 7 12 22 9 20Z" fill="${c}"/><path d="M24 4 27 7 25 9 22 6Z" fill="#fff" opacity=".4"/><path d="M7 19l6 6-2 2-6-6Z" fill="#8a6b4f"/><path d="M5 25l2 2-2 2-2-2Z" fill="#c9a36a"/>`,
  offhand: c => `<path d="M16 3 27 7v8c0 7-5 12-11 14C10 27 5 22 5 15V7Z" fill="${c}"/><path d="M16 3v26C10 27 5 22 5 15V7Z" fill="#000" opacity=".18"/><path d="M16 9v14M10 15h12" stroke="#fff" opacity=".35" stroke-width="2"/>`,
  head: c => `<path d="M6 21c0-9 4-15 10-15s10 6 10 15v4H6Z" fill="${c}"/><path d="M9 17h14v4H9Z" fill="#000" opacity=".35"/><path d="M10 9c2-2 5-3 7-3" stroke="#fff" opacity=".4" fill="none" stroke-width="2"/>`,
  chest: c => `<path d="M9 5h14l5 5-3 4-2-1v15H9V13l-2 1-3-4Z" fill="${c}"/><path d="M16 5v23" stroke="#000" opacity=".2" stroke-width="2"/><path d="M11 9h3" stroke="#fff" opacity=".4" stroke-width="2"/>`,
  legs: c => `<path d="M8 4h16v8l-2 16h-5l-1-13-1 13h-5L8 12Z" fill="${c}"/><path d="M16 12v3" stroke="#000" opacity=".3" stroke-width="2"/>`,
  boots: c => `<path d="M8 4h9v14l9 4v5H6V22Z" fill="${c}"/><path d="M6 25h20v2H6Z" fill="#000" opacity=".3"/>`,
  gloves: c => `<path d="M10 28V14l-3-5 2-2 4 4V4h3v8V3h3v9V5h3v13l-2 10Z" fill="${c}"/><path d="M10 24h11" stroke="#000" opacity=".25" stroke-width="2"/>`,
  ring: c => `<circle cx="16" cy="19" r="8" fill="none" stroke="#c9a36a" stroke-width="3"/><path d="M12 9l4-5 4 5-4 3Z" fill="${c}"/><path d="M12 9l4-5v8Z" fill="#fff" opacity=".35"/>`,
  amulet: c => `<path d="M7 4c0 8 4 12 9 12s9-4 9-12" fill="none" stroke="#c9a36a" stroke-width="1.8"/><path d="M16 14l6 7-6 8-6-8Z" fill="${c}"/><path d="M16 14l-6 7 6 8Z" fill="#fff" opacity=".25"/>`,
  tool: c => `<path d="M5 9c6-6 16-6 22 0-6-2-16-2-22 0Z" fill="${c}"/><path d="M15 8h3l-1 20h-2Z" fill="#8a5a36"/><path d="M15 8h1.4l-.6 20H15Z" fill="#000" opacity=".25"/>`,
};
function itemIcon(key, size) {
  if (RES_BY[key]) return resIcon(RES_BY[key], size);
  const it = ITEM(key), img = pxItem(it, (RARITIES[it.rarity] || RARITIES[0]).color, size || 34);
  return it.gear && it.plus ? `<span class="pxw">${img}<b class="pxplus">+${it.plus}</b></span>` : img;
}
const actIcon = (a, size) => a.inputs ? itemIcon(a.gearOut ? gkey(a.out) : a.out, size) : resIcon(a, size);
function portrait(c, size) {
  const r = RACES.find(x => x.id === c.race) || RACES[0], S = size || 64, fr = c.adv && TIER_FRAME[c.adv.tier];
  return pxChibi(pxLookOf(c), S, { cls: 'portrait', h: Math.round(S * 1.125), style: `width:${S}px;height:${Math.round(S * 1.125)}px;object-fit:contain;background:linear-gradient(${r.color},#2a1d17);border:${fr ? 3 : 1}px solid ${fr || 'rgba(0,0,0,.35)'};border-radius:10px;box-sizing:border-box;padding:3px 2px 0` });
}
function tierBadge(count) { const k = tierOf(count); return `<span class="tier ${k >= 9 ? 't10' : k >= 6 ? 't7' : ''}">${BALANCE.tierNames[k]}</span>`; }
const rcol = r => r === 0 ? 'var(--ink)' : `color-mix(in srgb, ${RARITIES[r].color} 72%, var(--ink))`;
function rname(key) { const it = ITEM(key); return `<b style="color:${rcol(it.rarity)}">${esc(it.name)}</b>`; }
function statLine(it) {
  const parts = [];
  if (it.attack) parts.push(`${it.attack} attack`); if (it.defense) parts.push(`${it.defense} defense`);
  for (const [s, v] of Object.entries(it.stats || {})) parts.push(`+${v} ${s}`);
  if (it.speed) parts.push(`+${pct(it.speed, 1)} ${SKILLS[it.toolSkill].name} speed`);
  if (it.mods && Object.keys(it.mods).length) parts.push(modsText(it.mods));
  return parts.join(' · ');
}

// ---------- Live values ----------
function updateLive() {
  if (!ch) return;
  const now = Date.now(), dc = {}, dOf = s => dc[s] || (dc[s] = derive(ch, now, null, s));
  for (const el of $$('[data-live]')) {
    const L0 = el.dataset.live, ci = L0.indexOf(':'), k = ci < 0 ? L0 : L0.slice(0, ci), arg = ci < 0 ? '' : L0.slice(ci + 1); let v = '';
    switch (k) {
      case 'gold': v = N(ch.gold); break;
      case 'shards': v = N(account.shards); break;
      case 'stam': v = `${staminaUsed()}/${dOf('mining').stamina}`; break;
      case 'lvl': v = levelLabel(ch); break;
      case 'slvl': v = ch.skills[arg].level; break;
      case 'inv': v = N(ch.inv[arg] || 0); break;
      case 'bank': v = N(ch.bank[arg] || 0); break;
      case 'slots': v = `${usedSlots()} / ${ch.invSlots}`; break;
      case 'next': { const c = ch.prof[arg] || 0, k2 = tierOf(c); v = k2 < 9 ? `${N(c)} / ${N(BALANCE.tierThresholds[k2 + 1])}` : N(c); break; }
      case 'time': { const a = ACT(arg); v = fmtTime(actionSec(a, ch.prof[arg] || 0, dOf(a.skill).speed)); break; }
      case 'can': v = N(craftable(ch, RECIPE[arg])); break;
      case 'streak': { const a = ch.actions.find(x => x.res === arg); v = a ? N(a.streak) : '0'; break; }
      case 'total': v = N(ch.totals[arg]); break;
      case 'xpline': { const L = levelFromXp(ch.xp); v = L.need ? `${N(L.into)} / ${N(L.need)} XP` : 'Max level'; break; }
      case 'sxpline': { const L = levelFromXp(ch.skills[arg].xp); v = L.need ? `${N(L.into)} / ${N(L.need)} XP` : 'Max level'; break; }
      case 'rwnext': v = fmtTime(Math.max(0, rwMidnight() - now) / 1000); break;
      case 'ms': { const m = nextMilestone(); v = m ? `${m.label} · ${fmtTime(m.eta)}` : (ch.actions.length ? 'Keep going' : 'Start an action'); break; }
      case 'pot': { const p = ch.potions[arg]; v = p && p.until > now ? fmtTime((p.until - now) / 1000) : ''; if (!v) dirty = true; break; }
      case 'price': { const pr = sellPrice(arg, now); v = (pr < 10 ? pr.toFixed(1) : N(Math.floor(pr))) + 'g'; break; }
      case 'savings': v = N(Math.floor(savingsNow(ch, now))); break;
      case 'clock': v = clockText(); break;
      case 'hp': { const mh = dOf('slaying').maxHP; v = `${N(Math.max(0, Math.ceil(ch.hp == null ? mh : ch.hp)))} / ${N(mh)}`; break; }
      case 'cp': v = N(Math.round(combatPower(dOf('slaying')))); break;
      case 'travel': v = ch.travel ? `${REGION_BY[ch.travel.to].name} in ${fmtTime(Math.max(0, (ch.travel.end - now) / 1000))}` : REGION_BY[ch.loc].name; break;
      case 'xfrac': v = pct(exploreFrac(ch, arg)); break;
      case 'quest': { if (ch.quest.done) { v = 'Tutorial complete'; break; } const g = questGoal(ch.quest.step); v = `${g.label} · ${N(Math.min(g.have, g.need))}/${N(g.need)}`; break; }
      case 'foodn': v = N(healFoods().reduce((t, k) => t + ch.inv[k], 0)); break;
    }
    if (el.textContent !== String(v)) el.textContent = v;
  }
  for (const el of $$('[data-w]')) {
    const W0 = el.dataset.w, ci = W0.indexOf(':'), k = ci < 0 ? W0 : W0.slice(0, ci), arg = ci < 0 ? '' : W0.slice(ci + 1); let w = 0;
    if (k === 'xp') { const L = levelFromXp(ch.xp); w = L.need ? L.into / L.need : 1; }
    if (k === 'sxp') { const L = levelFromXp(ch.skills[arg].xp); w = L.need ? L.into / L.need : 1; }
    if (k === 'tier') { const c = ch.prof[arg] || 0, t = tierOf(c), T = BALANCE.tierThresholds; w = t < 9 ? (c - T[t]) / (T[t + 1] - T[t]) : 1; }
    if (k === 'hp') { const mh = derive(ch, now, null, 'slaying').maxHP; w = (ch.hp == null ? mh : Math.max(0, ch.hp)) / mh; }
    if (k === 'travel') w = ch.travel ? (now - ch.travel.start) / (ch.travel.end - ch.travel.start) : 0;
    if (k === 'xfrac') w = exploreFrac(ch, arg);
    if (k === 'quest') { if (ch.quest.done) w = 1; else { const g = questGoal(ch.quest.step); w = g.have / g.need; } }
    if (k === 'title') { const L = SKILL_TITLES[arg].line, i = L.findIndex(l => ch.totals[arg] < l[0]); w = i < 0 ? 1 : ch.totals[arg] / L[i][0]; }
    el.style.width = (Math.min(1, w) * 100).toFixed(1) + '%';
  }
}
function drawBars() {
  if (!ch) return;
  const tv = $('#traveller'); if (tv && ch.travel) { const w = Math.min(1, (Date.now() - ch.travel.start) / (ch.travel.end - ch.travel.start)); tv.setAttribute('cx', +tv.dataset.ax + (tv.dataset.bx - tv.dataset.ax) * w); tv.setAttribute('cy', +tv.dataset.ay + (tv.dataset.by - tv.dataset.ay) * w); }
  const now = Date.now(), dc = {};
  for (const a of ch.actions) {
    const el = document.querySelector(`.aslot[data-res="${a.res}"] .bar`); if (!el) continue;
    const act = ACT(a.res), d = dc[act.skill] || (dc[act.skill] = derive(ch, now, null, act.skill));
    const tms = act.kind === 'combat' ? (a.tms || 1000) : Math.max(100, Math.round(actionSec(act, ch.prof[a.res] || 0, d.speed) * 1000)), fast = tms <= 250;
    if (act.kind === 'combat') { const eb = $('#ehp'); if (eb) eb.style.width = fast ? '100%' : Math.max(0, 100 - (a.prog + loopAcc) / tms * 100).toFixed(1) + '%'; }
    el.classList.toggle('flow', fast && !account.settings.reduced);
    if (!fast) el.firstElementChild.style.width = Math.min(100, (a.prog + loopAcc) / tms * 100).toFixed(1) + '%';
  }
}
function clockText() {
  const d = new Date(), h = d.getHours();
  const tod = h >= 5 && h < 8 ? 'Dawn' : h < 18 && h >= 8 ? 'Day' : h >= 18 && h < 21 ? 'Dusk' : 'Night';
  const seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  const w = (ch.region === 'frost' ? ['Clear', 'Snow', 'Snow', 'Overcast', 'Blizzard'] : ch.region === 'oasis' ? ['Clear', 'Clear', 'Heat haze', 'Sandstorm', 'Clear'] : ['Clear', 'Overcast', 'Rain', 'Fog', 'Storm'])[seed % 5];
  return `${tod} · ${w}`;
}

// ---------- Loop ----------
let lastT = 0, loopAcc = 0, lastLive = 0, lastSave = Date.now();
// Tabs the player drives by hand: game ticks don't redraw them (live numbers still update), so open panels
// and animations aren't reset every second.
const QUIET_TABS = new Set(['casino', 'showcase']);
function frame(t) {
  if (screen === 'game' && ch) {
    const dt = lastT ? t - lastT : 0;
    if (dt > 5000) { runOffline(dt / 1000, dt > 60000); loopAcc = 0; }
    else { loopAcc += dt; let s = 0; while (loopAcc >= BALANCE.tickMs && s < 60) { step(); loopAcc -= BALANCE.tickMs; s++; } if (s >= 60) loopAcc = 0; }
    const now = Date.now();
    if (now - lastFlush >= BALANCE.logFlushMs) { lastFlush = now; flush(); }
    if (t - lastLive >= 1000 / BALANCE.uiHz) { lastLive = t; updateLive(); if (dirty) { dirty = false; if (!QUIET_TABS.has(tab)) renderMain(); else renderSide(); renderActions(); renderTop(); } }
    if (now - lastSave >= BALANCE.autosaveMs) { lastSave = now; save(); }
    if (now - (frame.sec || 0) >= 2000) { frame.sec = now; checkSecrets(); eventTick(); loreTick(); dungeonTick(); qolTick(); autoBuy(); autoUseTick(); fbPoll(); refreshScenes(); }
    drawBars();
  }
  lastT = t; requestAnimationFrame(frame);
}

// ============================================================
// SCREENS
// ============================================================
function applySettings() {
  const s = account.settings, r = document.documentElement;
  if (typeof applyLang === 'function') applyLang();
  if (s.theme === 'auto') { if (r.dataset.mine) { r.removeAttribute('data-theme'); delete r.dataset.mine; } } else { r.dataset.theme = s.theme; r.dataset.mine = '1'; }
  document.body.classList.toggle('large', s.large); document.body.classList.toggle('reduced', s.reduced);
}
function heroArt() {
  let s = 7; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647, cols = RES.map(o => o.color);
  let gems = '';
  for (let i = 0; i < 60; i++) { const x = rnd() * 1200, y = 60 + rnd() * 260, sc = 0.5 + rnd() * 1.3, c = cols[Math.floor(rnd() * cols.length)];
    gems += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${(sc * 3).toFixed(2)})" shape-rendering="crispEdges"><rect x="1" y="0" width="2" height="1" fill="#fff" opacity=".7"/><rect x="0" y="1" width="4" height="2" fill="${c}"/><rect x="2" y="1" width="2" height="2" fill="#000" opacity=".28"/><rect x="1" y="3" width="2" height="1" fill="${c}"/><rect x="1" y="1" width="1" height="1" fill="#fff" opacity=".45"/></g>`; }
  let sparks = ''; for (let i = 0; i < 26; i++) sparks += `<circle cx="${(820 + rnd() * 300).toFixed(0)}" cy="${(40 + rnd() * 200).toFixed(0)}" r="${(1 + rnd() * 2).toFixed(1)}" fill="#ffad87" opacity="${(.3 + rnd() * .6).toFixed(2)}"/>`;
  return `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="lamp" cx=".8" cy=".35" r=".55"><stop offset="0" stop-color="#ff7a45" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a45" stop-opacity="0"/></radialGradient><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#120d0b" stop-opacity="0"/><stop offset="1" stop-color="#120d0b" stop-opacity=".95"/></linearGradient></defs>
<rect width="1200" height="360" fill="#1d1512"/><path d="M0 70 C200 40 380 100 600 70 S1000 40 1200 80 V140 C980 110 820 160 600 130 S180 120 0 150Z" fill="#2a1f1a"/>
<path d="M0 150 C220 120 420 180 640 150 S1000 120 1200 160 V230 C960 200 800 250 600 220 S200 210 0 240Z" fill="#33261f"/><path d="M0 240 C240 210 440 270 660 240 S1000 210 1200 250 V360 H0Z" fill="#251b16"/>
${gems}<rect width="1200" height="360" fill="url(#lamp)"/>${sparks}<g transform="translate(980 70)"><path d="M0 0v30" stroke="#6b5444" stroke-width="3"/><path d="M-14 30h28l-4 34h-20Z" fill="#3b2c24"/><rect x="-9" y="36" width="18" height="22" rx="3" fill="#ffb07a"/><path d="M-16 64h32" stroke="#6b5444" stroke-width="4"/></g>
<rect width="1200" height="360" fill="url(#fade)"/></svg>`;
}
function renderSelect() {
  screen = 'select'; ch = null;
  const slots = account.slots.map((c, i) => c ? `<div class="card slot">
      <div class="row">${portrait(c)}<div><h3>${esc(c.name)}</h3><div class="mute">${esc(RACES.find(r => r.id === c.race).name)} ${esc(CLASSES.find(x => x.id === c.cls).name)}</div><div><b>${levelLabel(c)}</b></div></div></div>
      <div class="mute" style="font-size:14px">${esc(START_REGIONS.find(r => r.id === c.region).name)} · last played ${new Date(c.last).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
      <div class="row"><button class="pri" data-act="play" data-arg="${i}">Play</button><button class="ghost" data-act="delete" data-arg="${i}">Delete</button><button class="ghost sm" disabled title="Rename tokens come in a later phase">Rename</button></div></div>`
    : `<button class="card slot empty" data-act="new" data-arg="${i}"><span class="fell" style="font-size:26px">New character</span><span class="mute">Slot ${i + 1} is empty</span></button>`).join('');
  $('#root').innerHTML = `<div class="screen"><div class="hero">${heroArt()}<div class="txt">${gameIcon(72)}<h1>${heroTitle()}</h1></div></div>
    <div class="spread" style="margin-top:22px"><h2>Choose your character</h2><span class="row" style="gap:6px">${cloudChip()}<span class="chip">Thousandium <b class="gold">${N(account.shards)}</b></span></span></div>
    <div class="slots">${slots}${account.slot4 ? '' : `<div class="card slot empty" style="opacity:.6"><span class="fell" style="font-size:22px">Fourth slot</span><span class="mute">Find ${SECRET_CFG.slot4At} secrets to open it</span></div>`}</div>
    <p class="bottomline">Thousandfold ${GAME_VERSION} · prototype. Saves stay in this browser and, when you are signed in, in the cloud.</p><div class="langbar">${langButton()}</div></div>`;
}

// ---------- Wizard ----------
const WZ_STEPS = ['Identity', 'Class', 'Origin', 'Region', 'Confirm'];
function startWizard(slot) { screen = 'wizard'; wz = { slot, step: 0, name: '', gender: 'Male', race: 'human', cls: 'warrior', origin: 'orphan', region: 'emberfall', err: '' }; renderWizard(); }
function nameError(n) {
  const p = nameProblem(n); if (p) return p;
  n = n.trim();
  if (account.slots.some(c => c && c.name.toLowerCase() === n.toLowerCase())) return 'You already have a character with that name.';
  return '';
}
function wizardPreview() {
  const r = RACES.find(x => x.id === wz.race), c = CLASSES.find(x => x.id === wz.cls), o = ORIGINS.find(x => x.id === wz.origin), g = START_REGIONS.find(x => x.id === wz.region);
  const stats = STAT_IDS.map(id => { const v = 10 + (r.stat === id ? 1 : 0) + (o.stat === id ? 1 : 0); return `<span>${id}</span><span class="${v > 10 ? 'verd' : ''}">${v}</span>`; }).join('');
  return `<div class="card preview"><div class="row">${portrait({ name: wz.name || '?', race: wz.race, gender: wz.gender, cls: wz.cls }, 72)}<div><h3>${esc(wz.name || 'Unnamed')}</h3><div class="mute">${wz.gender} ${esc(r.name)}</div></div></div>
    <p style="margin:10px 0 10px">${esc(c.name)} · ${esc(o.name)}</p>
    <div class="kv">${stats}<span>Stamina</span><span>2</span></div><p class="mute" style="font-size:14px;margin:10px 0 0">Starts in ${esc(g.name)}</p></div>`;
}
function renderWizard() {
  const s = wz.step; let body = '';
  if (s === 0) body = `<div class="field"><label for="wzname">Name</label><input id="wzname" maxlength="64" value="${esc(wz.name)}" autocomplete="off"><div class="err" id="wzerr">${esc(wz.err)}</div></div>
    <div class="field"><label>Gender</label><div class="row">${['Male', 'Female'].map(g => `<button class="chip ${wz.gender === g ? 'on' : ''}" data-act="wzset" data-arg="gender|${g}">${g}</button>`).join('')}</div></div>
    <div class="field"><label>Race</label><p class="mute" style="margin:0 0 6px">Races add a small flavour bonus and one passive. They never lock content.</p><div class="pick">${RACES.map(r => r.secret && !(account.races && account.races[r.id])
    ? `<div class="opt locked card"><b>???</b><small>A secret race, unlocked through hidden content.</small></div>`
    : `<button class="opt ${wz.race === r.id ? 'on' : ''}" data-act="wzset" data-arg="race|${r.id}"><b style="color:color-mix(in srgb, ${r.color} 70%, var(--ink))">${r.name}</b><small>+1 ${r.stat}</small><small>${r.passive}</small></button>`).join('')}</div></div>`;
  if (s === 1) body = `<p class="mute">Every class can do everything; each has its own resource and four tiers of advancement (from level 25). Each class has an innate passive, a talent tree and three-tier advancement with specializations.</p><div class="pick">${CLASSES.map(c => `<button class="opt ${wz.cls === c.id ? 'on' : ''}" data-act="wzset" data-arg="cls|${c.id}"><b>${c.name}</b><small>${c.role} · ${c.res}</small><small>Grows ${c.pri}; leans ${c.sec}</small><small>Tier 2: ${c.specs.join(', ')}</small><small class="verd">Innate: ${modsText(INNATE[c.id])}</small></button>`).join('')}</div>`;
  if (s === 2) body = `<div class="pick">${ORIGINS.map(o => `<button class="opt ${wz.origin === o.id ? 'on' : ''}" data-act="wzset" data-arg="origin|${o.id}"><b>${o.name}</b><small>${o.flavor}</small><small>+1 ${o.stat} · ${o.qty > 1 ? o.qty + '× ' : ''}${esc(ITEM(o.item).name)}${o.gold ? ` · ${o.gold} gold` : ''}</small></button>`).join('')}</div>`;
  if (s === 3) body = `<p class="mute">Your home region has its own tutorial story, people and one secret only its natives find easily. (Travel and tutorials arrive in Phase 4.)</p><div class="pick">${START_REGIONS.map(g => `<button class="opt ${wz.region === g.id ? 'on' : ''}" data-act="wzset" data-arg="region|${g.id}"><b>${g.name}</b><small>${g.flavor}</small><small>Guide: ${g.npc} · Gear: ${g.gear}</small><small><i>“${g.rumor}”</i></small></button>`).join('')}</div>`;
  if (s === 4) { const r = RACES.find(x => x.id === wz.race), c = CLASSES.find(x => x.id === wz.cls), o = ORIGINS.find(x => x.id === wz.origin), g = START_REGIONS.find(x => x.id === wz.region);
    body = `<div class="card"><div class="kv" style="font-size:16px"><span>Name</span><span>${esc(wz.name)}</span><span>Gender</span><span>${wz.gender}</span><span>Race</span><span>${r.name}</span><span>Class</span><span>${c.name}</span><span>Origin</span><span>${o.name}</span><span>Region</span><span>${g.name}</span></div>
    <p class="mute">All stats start at 10 with 2 Stamina. Race and origin add +1 each. Every level gives 20 free stat points. You start with a worn tool for each gathering skill.</p></div>`; }
  const last = WZ_STEPS.length - 1;
  $('#root').innerHTML = `<div class="screen"><div class="spread"><h2>New character · ${WZ_STEPS[s]}</h2><button class="ghost" data-act="toselect">Cancel</button></div>
    <div class="steps">${WZ_STEPS.map((n, i) => `<span class="${i === s ? 'on' : ''}">${i + 1}. ${n}</span>`).join('')}</div>
    <div class="wz"><div>${body}<div class="row" style="margin-top:18px">${s > 0 ? `<button data-act="wzback">Go back</button>` : ''}<button class="pri" data-act="wznext">${s === last ? 'Begin your story' : 'Next'}</button></div></div><div>${wizardPreview()}</div></div></div>`;
  const ni = $('#wzname'); if (ni) ni.addEventListener('input', e => { wz.name = e.target.value; wz.err = ''; $('#wzerr').textContent = ''; $('.preview').outerHTML = wizardPreview(); });
}

// ---------- Game shell ----------
const NAV = [
  ['Gathering', GATHER_SKILLS.map(s => [s, SKILLS[s].name])],
  ['Crafting', CRAFT_SKILLS.map(s => [s, SKILLS[s].name])],
  ['Adventure', [['quests', 'Quests'], ['map', 'Map'], ['combat', 'Combat'], ['dungeons', 'Dungeons'], ['arena', 'Arena']]],
  ['You', [['inv', 'Inventory'], ['char', 'Character'], ['prof', 'Proficiency'], ['class', 'Class'], ['talents', 'Talents'], ['training', 'Training'], ['companions', 'Companions'], ['pets', 'Pets'], ['showcase', 'Profile'], ['wardrobe', 'Wardrobe'], ['arsenal', 'Arsenal'], ['collection', 'Collection'], ['titles', 'Titles'], ['ach', 'Achievements']]],
  ['Social', [['friends', 'Friends'], ['chat', 'Chat'], ['mail', 'Mailbox'], ['trade', 'Trades'], ['guild', 'Guild']]],
  ['Town', [['shop', 'Shop'], ['auction', 'Auction House'], ['bank', 'Bank'], ['account', 'Account'], ['settings', 'Settings'], ['debug', 'Debug']]],
  ['Misc', [['events', 'Events'], ['games', 'Daily games'], ['casino', 'Casino'], ['secrets', 'Secrets'], ['lore', 'Lore'], ['leaders', 'Leaderboards']]],
];
function enterGame(i) {
  account.activeSlot = i; ch = migrate(account.slots[i]); screen = 'game'; tab = 'home'; agg = {}; rate = {};
  $('#root').innerHTML = `<div class="app"><header class="top" id="top"></header><nav class="side" id="nav" aria-label="Game sections"></nav><nav class="bnav" id="bnav" aria-label="Sections"></nav><main id="main"></main><section class="act" id="act" aria-label="Active actions"><div id="actbody"></div><div id="actscene"></div></section><aside class="sidepanel" id="side"></aside></div>`;
  renderTop(); renderMain(); renderActions();
  checkProgress(true, []); syncAcctSecrets(); markFounder(); tourMaybe(); setTimeout(() => { if (typeof sxSync === 'function') sxSync(true); }, 3000);
  const away = (Date.now() - ch.last) / 1000;
  if (away >= 8 * 3600 && ch.cls === 'monk') setTimeout(() => unlockSecret('cls_monk'), 500);
  if (away > 60) runOffline(away, true);
  lastT = 0; save();
}
function renderTop() {
  if (!ch) return; const now = Date.now();
  const nb = Object.values(ch.potions).filter(p => p.until > now && ITEMS[p.id]).length;
  const pots = `<button class="chip buffbtn ${nb ? '' : 'mute'}" data-act="buffs" title="Show your active buffs" aria-label="Active buffs: ${nb}">\u2726 Buffs${nb ? ` <b>${nb}</b>` : ''}</button>`;
  $('#top').innerHTML = `<span class="brand">${gameIcon(22)} Thousandfold</span>
    <div class="cur"><span class="num">Gold <b class="gold" data-live="gold"></b></span><span class="num">Thousandium <b data-live="shards"></b></span><span>${ch.travel ? 'Travelling to ' : ''}<b data-live="travel"></b></span><span class="mute" data-live="clock"></span>${pots}
    ${cloud.held ? `<button class="chip bad" data-act="cloudheld" title="Cloud saving is paused on this device">\u2601 Newer save on ${esc(devLabel(cloud.held.device))}</button>` : ''}${mailChip()}${(() => { const e = worldEvent(); return `<button class="chip evchip" data-act="tab" data-arg="events" title="${esc(e.text)}">${e.holiday ? '\u2744 ' : '\u2605 '}${esc(e.name)}</button>`; })()}<button class="chip fbbtn" data-act="feedback" title="Send feedback to the developer">✉ Feedback</button></div>
    <div class="milestone" title="Closest upcoming milestone">Next: <b data-live="ms"></b></div>`;
  updateLive();
}
function renderNav() {
  const running = new Set(ch.actions.map(a => ACT(a.res).skill));
  const col = account.settings.navCollapsed || {};
  $('#nav').innerHTML = `<button class="${tab === 'home' ? 'on' : ''}" data-act="tab" data-arg="home">\u2302 Home</button>` + NAV.map(([g, items]) => { const shut = col[g] && !items.some(([i]) => i === tab); return `<button class="sep" data-act="navgrp" data-arg="${g}" aria-expanded="${!shut}">${shut ? '\u25B8' : '\u25BE'} ${g}</button>` + (shut ? '' : items.filter(([id]) => id !== 'debug' || isDev()).map(([id, n]) => `<button class="${tab === id ? 'on' : ''} ${tabOpen(id) ? '' : 'locked'}" data-act="tab" data-arg="${id}"${tabOpen(id) ? '' : ` title="${esc('Unlocks at ' + gateText(id))}"`}>${navLockIco(id)}${n}${navNew(id)}${SKILLS[id] ? ` <span class="mute num" style="font-size:13px">${ch.skills[id].level}</span>` : ''}${running.has(id) || (id === 'combat' && running.has('slaying')) || (id === 'map' && (running.has('exploration') || ch.travel)) ? ' <span class="dot" aria-label="running"></span>' : ''}${id === 'chat' && typeof fb !== 'undefined' && fb.unread ? ` <span class="chip" style="padding:0 6px" aria-label="new feedback">\u2709 ${fb.unread}</span>` : ''}${id === 'events' && ch.daily && !ch.daily.claimed ? ' <span class="dot" aria-label="reward ready"></span>' : ''}${id === 'quests' && !ch.quest.done ? ` <span class="chip" style="padding:0 6px">${ch.quest.step + 1}/10</span>` : ''}${id === 'quests' && ch.quest.done && ch.qactive.some(q => questHave(q) >= q.need) ? ' <span class="dot"></span>' : ''}${id === 'training' && running.has('training') ? ' <span class="dot"></span>' : ''}${id === 'talents' && ch.skillPts ? ` <span class="chip" style="padding:0 6px">${ch.skillPts}</span>` : ''}${id === 'class' && ((ch.adv.quest && ch.adv.quest.step >= 1 && (ch.adv.quest.step < 4 || ch.adv.quest.tier === 2)) || (!ch.adv.quest && canAscend())) ? ' <span class="dot"></span>' : ''}${id === 'char' && ch.unspent ? ` <span class="chip" style="padding:0 6px">${ch.unspent}</span>` : ''}${socBadge(id)}</button>`).join('')); }).join('')
    + (LATER.length ? `<div class="sep">Later phases</div>` : '') + LATER.map(([id, n]) => `<button class="later ${tab === id ? 'on' : ''}" data-act="tab" data-arg="${id}">${n}</button>`).join('');
  renderBnav();
}
function actSlotHtml(a) { const o = ACT(a.res); return `<div class="aslot ${a.vein > Date.now() ? 'vein' : ''} ${sceneAction() && sceneAction().id === o.id && ch.actions.length > 1 ? 'focus' : ''}" data-res="${o.id}" data-act="scenefocus" data-arg="${o.id}" title="Show in the scene">${actIcon(o)}<div><div class="spread"><b>${esc(o.name)}</b>${tierBadge(ch.prof[o.id] || 0)}</div><div class="bar" style="margin:5px 0"><i></i></div><div class="meta">${SKILLS[o.skill].name} · <span data-live="time:${o.id}"></span> each${o.inputs ? ` · <span data-live="can:${o.id}"></span> left` : ` · streak <span data-live="streak:${o.id}"></span>`}${a.vein > Date.now() ? ` · <b class="gold">${NODE_BONUS[o.skill]}</b>` : ''}</div></div><button class="sm" data-act="stop" data-arg="${o.id}" aria-label="Stop ${esc(o.name)}">Stop</button></div>`; }
function renderActions() {
  if (!ch || !$('#act')) return;
  const ha = document.getElementById('homeact'); if (ha) ha.innerHTML = homeActHtml();
  const d = D(), used = staminaUsed();
  const view = actView();
  if (view !== 'full') { $('#actbody').innerHTML = actHeader(view) + (view === 'compact' ? (ch.actions.length ? actChips() : '<p class="mute" style="margin:6px 0 0;font-size:14px">Nothing running.</p>') : ''); $('#act').dataset.view = view; refreshScenes(); updateLive(); return; }
  $('#act').dataset.view = view;
  $('#actbody').innerHTML = actHeader(view) + `
    <div class="pips" style="margin-top:6px" aria-label="Stamina ${used} of ${d.stamina}">${Array.from({ length: d.stamina }, (_, i) => `<i class="${i < used ? 'u' : ''}"></i>`).join('')}</div>
    ${ch.actions.length ? ch.actions.map(a => actSlotHtml(a)).join('')
      : `<p class="mute" style="margin:10px 0 0">Nothing running. Pick something in any gathering or crafting skill; each running action occupies stamina.</p>`}`;
  refreshScenes(); updateLive();
}
function renderSide() {
  if (!ch) return;
  const now = Date.now(), food = activeBuff(ch, 'food', now);
  $('#side').innerHTML = `<div class="row">${portrait(ch, 52)}<div style="flex:1"><b>${esc(ch.name)}</b>${ch.displayTitle ? `<div class="sidetitle">${styledTitle(ch.displayTitle, showcaseOf(ch).style)}</div>` : ''}<div class="mute" style="font-size:14px">${esc(race().name)} ${esc(tierName(ch.cls, ch.adv.spec, ch.adv.tier))}</div>
      <div class="spread" style="font-size:14px"><span><b data-live="lvl"></b></span><span class="mute num" data-live="xpline"></span></div><div class="bar xp"><i data-w="xp"></i></div></div></div>
    <div><div class="spread" style="font-size:14px"><span>HP</span><span class="num" data-live="hp"></span></div><div class="bar hpbar"><i data-w="hp"></i></div></div>
    ${!ch.quest.done ? `<button class="card qtrack" data-act="tab" data-arg="quests"><span class="mute" style="font-size:13px">Quest ${ch.quest.step + 1} of 10 · ${esc(TUTORIAL_TITLES[ch.quest.step])}</span><b data-live="quest"></b><span class="bar"><i data-w="quest"></i></span></button>` : ''}
    <div class="kv"><span>Inventory</span><span data-live="slots"></span><span>Combat power</span><span data-live="cp"></span><span>Lucky Strike</span><span>${pct(D().lucky, 1)}</span><span>Meal</span><span>${food ? esc(food.name) : '<span class="mute">None</span>'}</span><span>Companion</span><span>${ch.comp ? esc(COMPANIONS[ch.comp.cls][0]) + ' · Lv ' + compLevel(ch.comp) : '<span class="mute">None yet</span>'}</span><span>Pet</span><span>${(() => { const p = ch.petActive && petById(ch, ch.petActive); return p ? esc(petName(p)) + ' · Lv ' + p.lvl + (p.hunger < 20 ? ' <span class="bad">hungry</span>' : '') : '<span class="mute">None yet</span>'; })()}</span></div>
    <div><h3 style="margin-bottom:6px">Event log</h3><div class="log" id="log"></div></div>`;
  renderLog(); updateLive();
}
function renderLog() {
  const cl = $('#clog'); if (cl && ch) cl.innerHTML = ch.clog.slice(0, 14).map(l => `<div class="${l.k === 'bad' ? 'bad' : l.k === 'lucky' ? 'k-lucky' : ''}">${esc(l.s)}</div>`).join('') || '<div class="mute">No fights yet.</div>';
  const el = $('#log'); if (!el || !ch) return;
  el.innerHTML = ch.log.slice(0, 60).map(l => `<div class="k-${l.k}"><span class="mute">${new Date(l.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> ${esc(l.s)}</div>`).join('');
}
function renderMain() {
  if (!ch || !$('#main')) return;
  const ae = document.activeElement, keep = ae && ae.id && $('#main').contains(ae) ? { id: ae.id, s: ae.selectionStart } : null;
  const f = SKILLS[tab] && SKILLS[tab].kind === 'gather' ? () => tabGather(tab) : SKILLS[tab] && SKILLS[tab].kind === 'craft' ? () => tabCraft(tab) : { home: tabHome, games: tabGames, casino: tabCasino, showcase: tabShowcase, wardrobe: tabWardrobe, arena: tabArena, dungeons: tabDungeons, prof: tabProf, inv: tabInv, bank: tabBank, char: tabChar, titles: tabTitles, ach: tabAch, shop: tabShop, settings: tabSettings, map: tabMap, combat: tabCombat, quests: tabQuests, class: () => tabClass() + perkCard(), talents: tabTalents, companions: tabCompanions, arsenal: tabArsenal, training: tabTraining, pets: tabPets, collection: tabCollection, account: tabAccount, cloud: tabAccount, leaders: tabLeaders, friends: tabFriends, chat: tabChat, mail: tabMail, trade: tabTrade, auction: tabAuction, secrets: tabSecrets, debug: tabDebug, guild: tabGuild, events: tabEvents, lore: tabLore }[tab] || tabLater;
  const openD = new Set([...$('#main').querySelectorAll('details[open] > summary')].map(x => x.textContent));
  gateFreshSeen(tab);
  $('#main').innerHTML = tabOpen(tab) ? f() : tabLocked(tab);
  if (openD.size) for (const d of $('#main').querySelectorAll('details')) { const sm = d.querySelector(':scope > summary'); if (sm && openD.has(sm.textContent)) d.open = true; }
  renderNav(); renderSide(); const ap = document.querySelector('.app'); if (ap) ap.dataset.tab = tab;
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.s); } catch (e) { } } }
  bindMain(); updateLive(); refreshScenes();
}

// ---------- Skill tabs ----------
function skillHeader(skill, sub) {
  return `<div class="spread"><div><h2>${SKILLS[skill].name}</h2><p class="mute" style="margin:4px 0 0">${sub}</p></div>
    <div style="min-width:240px"><div class="spread"><span>Level <b data-live="slvl:${skill}"></b></span><span class="mute num" data-live="sxpline:${skill}"></span></div><div class="bar xp"><i data-w="sxp:${skill}"></i></div></div></div>`;
}
const bestFirst = () => account.settings.listOrder ? account.settings.listOrder === 'best' : window.innerWidth <= 900;
const orderToggle = () => `<button class="chip ${bestFirst() ? 'on' : ''}" data-act="set" data-arg="listOrder|${bestFirst() ? 'chain' : 'best'}" title="Switch the list order">${bestFirst() ? '↓ Best first' : '↑ Starting first'}</button>`;
function tabGather(skill) {
  const chain = CHAIN[skill], unl = chain.filter(o => isUnlocked(ch, o)), next = chain[unl.length], d = D(skill);
  const tool = ch.equip.tools[skill] ? ITEM(ch.equip.tools[skill]) : null;
  const card = o => { const c = ch.prof[o.id] || 0, k = tierOf(c), run = ch.actions.find(a => a.res === o.id);
    return `<div class="card ore ${run ? 'running' : ''}" style="order:${bestFirst() ? -o.index : 0}"><div class="head">${resIcon(o)}<div style="flex:1"><div class="spread"><b style="font-size:18px">${esc(o.name)}</b>${tierBadge(c)}</div><div class="mute" style="font-size:13px">${esc(o.region)}</div></div></div>
      <div class="bar"><i data-w="tier:${o.id}"></i></div>
      <div class="row asell" role="group" aria-label="Auto-sell ${esc(o.name)}"><span class="mute" style="font-size:13px">Auto-sell</span>${[['off', 'Off'], ...BALANCE.economy.autoSellKeep.map(k => [k, k ? 'Keep ' + k.toLocaleString() : 'All'])].map(([v, n]) => `<button class="chip ${(v === 'off' ? ch.autoSell[o.id] == null : ch.autoSell[o.id] === v) ? 'on' : ''}" data-act="autosell" data-arg="${o.id}|${v}">${n}</button>`).join('')}</div>
      <div class="kv"><span>Done</span><span data-live="next:${o.id}"></span><span>Per action</span><span data-live="time:${o.id}"></span><span>Yield bonus</span><span>+${pct(BALANCE.tierYieldBonus[k])}</span><span>Stamina</span><span>${o.stamina}</span><span>XP / value</span><span>${N(o.xp)} / ${N(o.value)}g</span><span>Held</span><span data-live="inv:${o.id}"></span></div>
      ${run ? `<button data-act="stop" data-arg="${o.id}">Stop</button>` : availableHere(o) ? `<button class="pri" data-act="start" data-arg="${o.id}">${SKILLS[skill].verb} ${esc(o.name)}</button>` : `<button data-act="gostart" data-arg="${o.id}" title="Travel to ${esc(REGIONS[o.band].name)} and start on arrival">Found in ${esc(REGIONS[o.band].name)} · Go</button>`}</div>`; };
  const fresh = false;
  return skillHeader(skill, `You are in ${esc(REGION_BY[ch.loc].name)}. Common resources can be gathered anywhere. Others must be gathered once in their own region; after that you can gather them from anywhere.<br>${unl.length} of ${chain.length} unlocked · <span data-live="total:${skill}"></span> total · ${tool ? esc(tool.name) + ` (+${pct(tool.speed, 1)} speed)` : 'no tool'} · yield +${pct(d.pool)}`)
    + (fresh ? `<div class="card" style="margin-top:14px;border-color:var(--ember)"><b>First swings.</b> Start with Stone. Every resource has its own proficiency: each tier halves the time per action until it hits 0.1s at T6, at 1,000 it opens the next resource (if your skill level is high enough), and at 10,000 (Mastered) it starts multiplying yield. You have 2 stamina, so run two things at once: try a tree in Woodcutting too. Crafting skills turn what you gather into gear, potions and meals.</div>` : '')
    + `<div class="row" style="margin-top:12px">${orderToggle()}</div><div class="cols" style="margin-top:10px">${unl.map(card).join('')}
    ${next ? `<div class="card ore locked" style="order:${bestFirst() ? 1 : 0}"><div class="head">${svg('<rect x="9" y="14" width="14" height="12" rx="2" fill="var(--mute)"/><path d="M12 14v-3a4 4 0 0 1 8 0v3" stroke="var(--mute)" stroke-width="2.4" fill="none"/>')}<div><b style="font-size:18px">???</b><div class="mute" style="font-size:13px">Undiscovered</div></div></div><p style="margin:0">Needs ${esc(lockReason(ch, next))}.</p><p class="mute" style="margin:0;font-size:14px">${chain.length - unl.length - 1 > 0 ? `${chain.length - unl.length - 1} more beyond it.` : 'The last one.'}</p></div>` : ''}</div>`;
}
const resKnown = r => isUnlocked(ch, r) || (ch.prof[r.id] || 0) > 0 || !!ch.seen[r.id];
function inputsHtml(rc) {
  return Object.entries(rc.inputs).map(([k, q]) => { const have = ch.inv[k] || 0, hide = RES_BY[k] && !resKnown(RES_BY[k]); return hide ? `<span class="chip short">${q}× ???</span>` : `<span class="chip ${have >= q ? '' : 'short'}" title="${esc(ITEM(k).name)}">${itemIcon(k, 18)} ${q}× ${esc(ITEM(k).name)} <span class="mute num" data-live="inv:${k}"></span></span>`; }).join('');
}
function tabCraft(skill) {
  const list = RECIPES_BY[skill], cats = [...new Set(list.map(r => r.cat))], cur = craftCat[skill] || 'All', d = D(skill);
  let shown = list.filter(r => cur === 'All' || r.cat === cur);
  const locked = shown.filter(r => !isUnlocked(ch, r));
  if (!showLocked) shown = shown.filter(r => isUnlocked(ch, r)).concat(locked.slice(0, 2));
  return skillHeader(skill, `${list.filter(r => isUnlocked(ch, r)).length} of ${list.length} recipes · <span data-live="total:${skill}"></span> made · output +${pct(d.pool)}`)
    + `<div class="row" style="margin:14px 0 10px">${['All', ...cats].map(c => `<button class="chip ${cur === c ? 'on' : ''}" data-act="ccat" data-arg="${skill}|${c}">${c}</button>`).join('')}<button class="chip ${showLocked ? 'on' : ''}" data-act="showlocked">${showLocked ? 'Hiding nothing' : 'Show all locked'}</button>${orderToggle()}</div>${autoBuyBar(skill)}
    <div class="grid">${shown.map(rc => { const u = isUnlocked(ch, rc), c = ch.prof[rc.id] || 0, run = ch.actions.find(a => a.res === rc.id), out = rc.gearOut ? ITEM(gkey(rc.out)) : ITEM(rc.out);
      return `<div class="card recipe ${run ? 'running' : ''} ${u ? '' : 'locked'}" style="order:${bestFirst() && u ? -list.indexOf(rc) - 1 : 0}">${actIcon(rc)}<div class="rmain"><div class="spread"><span>${rname(rc.gearOut ? gkey(rc.out) : rc.out)}${rc.qty > 1 ? ` ×${rc.qty}` : ''}</span>${u ? tierBadge(c) : `<span class="mute">Level ${rc.need || rc.lvl}</span>`}</div>
        <div class="mute" style="font-size:13px">${out.gear ? esc(statLine(out)) : esc(out.desc || '')}</div>
        <div class="row" style="gap:6px;margin-top:6px">${inputsHtml(rc)}</div>
        ${u ? `<div class="bar" style="margin-top:8px"><i data-w="tier:${rc.id}"></i></div><div class="mute" style="font-size:13px;margin-top:2px;font-variant-numeric:tabular-nums"><span data-live="next:${rc.id}"></span> · <span data-live="time:${rc.id}"></span> each · ${N(rc.xp)} XP · ${rc.stamina} stamina · can make <span data-live="can:${rc.id}"></span></div>` : ''}</div>
        <div class="ract">${u ? (run ? `<button data-act="stop" data-arg="${rc.id}">Stop</button>` : `<button class="pri" data-act="start" data-arg="${rc.id}">${SKILLS[skill].verb}</button>`) : ''}</div></div>`; }).join('') || '<p class="mute">Nothing here yet.</p>'}</div>
    ${rcNote(skill)}`;
}
function rcNote(skill) {
  return `<p class="bottomline">Each recipe has its own proficiency: time halves per tier to 0.1s, and from Mastered each craft has a ${pct(BALANCE.craft.extraChance[0])}–${pct(BALANCE.craft.extraChance[3])} chance of +50% output.${['blacksmithing', 'tailoring', 'jewelcrafting'].includes(skill) ? ' Gear rolls a quality (Crude to Masterwork); Intelligence and proficiency push the odds up.' : ''} Supplies like vials and thread come from the Shop.</p>`;
}
function tabProf() {
  const skill = profSkill, gather = SKILLS[skill].kind === 'gather', d = D(skill), list = gather ? CHAIN[skill] : skill === 'slaying' ? ENEMIES.filter(e => ch.prof[e.id] || ch.visited[e.region]) : skill === 'exploration' ? EXPLORES.filter(x => ch.visited[x.region]) : skill === 'training' ? TRAINS : RECIPES_BY[skill];
  return `<h2>Proficiency</h2><p class="mute">Every resource and recipe keeps its own count. Time halves per tier to the 0.1s floor at T6; past that, tiers add ${gather ? 'yield' : 'bonus output'}.${gather ? ' 1,000 of a resource unlocks the next one (plus its level requirement).' : ''} Speed bonuses (${SKILLS[skill].name} now +${pct(d.speed)}, cap 50%) stop mattering at the floor.</p>
    <div class="row" style="margin-bottom:10px">${SKILL_IDS.filter(s => SKILLS[s].kind !== 'pet').map(s => `<button class="chip ${profSkill === s ? 'on' : ''}" data-act="profskill" data-arg="${s}">${SKILLS[s].name}</button>`).join('')}</div>
    <div class="ptable"><div class="prow head"><span></span><span>Name</span><span>Tier</span><span>Progress</span><span class="hide-s">Time</span><span class="hide-s">Bonus</span><span class="hide-s">${gather ? 'Region' : 'Level'}</span></div>
    ${list.map(o => { const u = isUnlocked(ch, o), c = ch.prof[o.id] || 0, k = tierOf(c), bonus = gather ? '+' + pct(BALANCE.tierYieldBonus[k]) : pct(extraChance(k));
      return u ? `<div class="prow">${actIcon(o)}<b>${esc(o.name)}</b><span>${tierBadge(c)}</span><div><div class="bar"><i data-w="tier:${o.id}"></i></div><div class="mute num" style="font-size:13px" data-live="next:${o.id}"></div></div><span class="hide-s num" data-live="time:${o.id}"></span><span class="hide-s num">${bonus}</span><span class="hide-s mute" style="font-size:13px">${gather ? esc(o.region) : o.kind === 'combat' ? 'Lv ' + o.level : o.kind === 'explore' ? pct(exploreFrac(ch, o.region)) + ' mapped' : o.kind === 'train' ? o.stat : 'Lv ' + o.lvl}</span></div>`
        : `<div class="prow" style="opacity:.6">${svg('<rect x="9" y="14" width="14" height="12" rx="2" fill="var(--mute)"/><path d="M12 14v-3a4 4 0 0 1 8 0v3" stroke="var(--mute)" stroke-width="2.4" fill="none"/>')}${gather ? (o.index === 1 || isUnlocked(ch, CHAIN[skill][o.index - 2]) ? `<b>???</b><span class="mute">Next</span><span class="mute" style="font-size:13px">${esc(lockReason(ch, o))}</span>` : `<b>???</b><span class="mute"></span><span class="mute" style="font-size:13px">Undiscovered</span>`) + '<span class="hide-s"></span><span class="hide-s"></span><span class="hide-s"></span>' : `<b>${esc(o.name)}</b><span class="mute">Lv ${o.reqLevel || o.lvl}</span><span class="mute" style="font-size:13px">${esc(lockReason(ch, o))}</span><span class="hide-s num mute">${fmtTime(o.baseTime)}</span><span class="hide-s"></span><span class="hide-s"></span>`}</div>`; }).join('')}</div>`;
}

// ---------- Inventory, equipment, bank ----------
const INV_FILTERS = [['all', 'All'], ['resource', 'Resources'], ['material', 'Materials'], ['gear', 'Gear'], ['tool', 'Tools'], ['potion', 'Potions'], ['elixir', 'Elixirs'], ['food', 'Meals'], ['other', 'Other']];
function invMatch(key, f) { const t = ITEM(key).type; if (f === 'all') return true; if (f === 'other') return ['supply', 'junk', 'keepsake', 'stone', 'upgrade'].includes(t); return t === f; }
function equippedFor(it) { if (it.slot === 'tool') return ch.equip.tools[it.toolSkill]; if (it.slot === 'ring') return ch.equip.slots.ring1; return ch.equip.slots[it.slot]; }
function compareHtml(it) {
  const cur = equippedFor(it); if (!cur) return '<span class="up">Slot empty</span>';
  const e = ITEM(cur), diffs = [];
  const add = (n, a, b) => { const v = a - b; if (Math.abs(v) > 1e-9) diffs.push(`<span class="${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${n === 'speed' ? pct(v, 1) : v} ${n}</span>`); };
  add('attack', it.attack, e.attack); add('defense', it.defense, e.defense); add('speed', it.speed, e.speed);
  for (const s of new Set([...Object.keys(it.stats), ...Object.keys(e.stats)])) add(s, it.stats[s] || 0, e.stats[s] || 0);
  return `vs ${esc(e.name)}: ` + (diffs.join(' ') || '<span class="mute">same</span>');
}
function tabInv() {
  let keys = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && invMatch(k, invF));
  if (invQ) keys = keys.filter(k => ITEM(k).name.toLowerCase().includes(invQ.toLowerCase()));
  const sorters = { rarity: (a, b) => ITEM(b).rarity - ITEM(a).rarity || ITEM(b).value - ITEM(a).value, value: (a, b) => ITEM(b).value * ch.inv[b] - ITEM(a).value * ch.inv[a], qty: (a, b) => ch.inv[b] - ch.inv[a], name: (a, b) => ITEM(a).name.localeCompare(ITEM(b).name) };
  keys.sort(sorters[invSort]);
  const full = usedSlots() >= ch.invSlots;
  return `<div class="spread"><h2>Inventory</h2><span class="${full ? 'bad' : 'mute'}">Slots <b data-live="slots"></b>${full ? ' · full: gathering new items will stop' : ''}</span></div>
    ${equipPanel()}
    <div class="row" style="margin:14px 0 8px"><input id="invq" placeholder="Search items" value="${esc(invQ)}" style="flex:1;min-width:160px" aria-label="Search items">
      <select id="invsort" aria-label="Sort">${[['rarity', 'Rarity'], ['value', 'Stack value'], ['qty', 'Quantity'], ['name', 'Name']].map(([v, n]) => `<option value="${v}" ${invSort === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="chip ${account.settings.invGrid ? 'on' : ''}" data-act="invgrid">${account.settings.invGrid ? 'Grid view' : 'List view'}</button><button data-act="selljunk">Sell all junk</button><button class="chip ${ch.autoSellJunk ? 'on' : ''}" data-act="autojunk">Auto-sell junk: ${ch.autoSellJunk ? 'on' : 'off'}</button></div>
    <div class="row" style="margin:0 0 8px;gap:6px;align-items:center"><span class="mute" style="font-size:13px">Sell gear up to</span>${[0, 1, 2, 3].map(g => `<button class="sm" data-act="sellgradeask" data-arg="${g}" style="color:${GRADE_COLORS[g]}">${GRADES[g]}</button>`).join('')}
      <span class="mute" style="font-size:13px;margin-left:8px">Keep crafted gear from</span>${[0, 1, 2, 3].map(g => `<button class="chip ${(account.settings.gearKeep == null ? 1 : +account.settings.gearKeep) === g ? 'on' : ''}" data-act="set" data-arg="gearKeep|${g}">${GRADES[g]}</button>`).join('')}</div>
    <div class="row" style="margin-bottom:10px">${INV_FILTERS.map(([v, n]) => `<button class="chip ${invF === v ? 'on' : ''}" data-act="invf" data-arg="${v}">${n}</button>`).join('')}</div>
    <div class="${account.settings.invGrid ? 'igrid' : 'inv'}">${keys.length ? keys.slice(0, invShowAll ? keys.length : INV_PAGE).map(account.settings.invGrid ? invTile : invRow).join('') + (keys.length > INV_PAGE && !invShowAll ? `<button class="sm" data-act="invmore" style="grid-column:1/-1">Show all ${N(keys.length)} items</button>` : '') : `<p class="mute">${invQ || invF !== 'all' ? 'Nothing matches.' : 'Empty. Gathered resources land here.'}</p>`}</div>`;
}
// Big bags: draw the first 300 items, the rest on request (keeps the page fast).
const INV_PAGE = 300; let invShowAll = false;
function invRow(key) {
  const it = ITEM(key), rc = RARITIES[it.rarity], m = priceMult(ch, key, Date.now());
  let acts = '';
  if (it.type === 'potion' || it.type === 'food') acts = `${(() => { const r = it.cat && (it.power || Object.keys(it.fx || {}).length) ? buffRule(key) : { mode: 'new' }; return r.mode === 'blocked' ? `<button class="sm" data-act="drink" data-arg="${key}" title="${esc(r.cur.name)} is stronger and still active">Stronger buff active</button>` : `<button class="sm pri" data-act="drink" data-arg="${key}" title="${r.mode === 'stack' ? 'Adds its time to the active buff' : r.mode === 'replace' ? 'Replaces the weaker active buff' : ''}">${it.type === 'food' ? 'Eat' : 'Drink'}${r.mode === 'stack' ? ' (+time)' : ''}</button>`; })()}${autoUsable(key) ? `<button class="sm ${ch.autoUse && ch.autoUse[key] ? 'pri' : ''}" data-act="autouse" data-arg="${key}" title="Use one whenever its buff runs out (while something is running), until you run out">${ch.autoUse && ch.autoUse[key] ? 'Auto-use: on' : 'Auto-use'}</button>` : ''}`;
  if (it.gear) acts = `<button class="sm pri" data-act="equip" data-arg="${esc(key)}">Equip</button>${it.plus < 10 ? `<button class="sm" data-act="upgrade" data-arg="${esc(key)}">Upgrade</button>` : ''}`;
  if (it.type === 'upgrade') acts = `<button class="sm pri" data-act="use" data-arg="${key}">Use</button>`;
  if (it.type === 'egg') acts = `<button class="sm pri" data-act="incubate" data-arg="${key}" ${ch.incub.length < ch.incubSlots ? '' : 'disabled'}>Incubate</button>`;
  if (it.type === 'chest') acts = `<button class="sm pri" data-act="chest" data-arg="${key}">Open</button>`;
  if (it.type === 'map') acts = `<button class="sm pri" data-act="dig">Dig here</button>`;
  if (it.type === 'elixir') acts = `<button class="sm pri" data-act="elixir" data-arg="${key}">Drink (+${elixirGain(it.stat, it.pts).toFixed(2)} ${it.stat})</button>`;
  const sub = it.gear ? `${it.grade ? gradeChip(it.grade) + ' ' : ''}${esc(statLine(it))}<br>${compareHtml(it)}${it.lvl > (it.slot === 'tool' ? ch.skills[it.toolSkill].level : gateLevel(ch)) ? ` · <span class="bad">needs ${it.slot === 'tool' ? SKILLS[it.toolSkill].name + ' ' : ''}level ${it.lvl}</span>` : ''}` : `${rc.name} · ${esc(it.desc || '')}`;
  return `<div class="irow">${itemIcon(key)}<div>${rname(key)} ${it.bind ? '<span class="chip" style="font-size:12px">Bound</span>' : ''}${ch.autoSell[key] != null ? `<span class="chip" style="font-size:12px">Auto-sell${ch.autoSell[key] ? ' above ' + N(ch.autoSell[key]) : ''}</span>` : ''}<div class="mute" style="font-size:13px">${sub}</div></div>
    <span class="num" data-live="inv:${esc(key)}"></span><span class="num hide-s gold" title="Sell price each${m < 0.95 ? ' (market flooded, recovers over time)' : ''}"><span data-live="price:${esc(key)}"></span>${m < 0.95 ? ' <span class="down">↓</span>' : m > 1.03 ? ' <span class="up">↑</span>' : ''}</span>
    <div class="row" style="gap:6px">${acts}<button class="sm" data-act="sell" data-arg="${esc(key)}|1">Sell 1</button><button class="sm" data-act="sell" data-arg="${esc(key)}|all">Sell all</button><button class="sm ghost" data-act="deposit" data-arg="${esc(key)}">Bank</button></div></div>`;
}
function equipPanel() {
  const slot = (s, key, unarg) => `<div class="eslot" data-drop="${unarg}">${key ? itemIcon(key, 28) : `<span class="eico"></span>`}<div><div class="mute" style="font-size:12px">${s}</div>${key ? `${rname(key)}<div class="mute" style="font-size:12px">${esc(statLine(ITEM(key)))}</div>` : '<span class="mute">Empty</span>'}</div>${key ? `<button class="sm ghost" data-act="unequip" data-arg="${unarg}" aria-label="Unequip ${s}">×</button>` : ''}</div>`;
  return `<div class="card" style="margin-top:12px"><div class="spread"><b>Equipped</b><span class="mute" style="font-size:14px">Gear adds stats, attack and defense; tools add speed to their skill (50% cap).</span></div>
    <div class="egrid">${SLOTS.map(s => slot(SLOT_NAMES[s], ch.equip.slots[s], 's|' + s)).join('')}</div>
    <b style="display:block;margin-top:12px">Tool belt</b><div class="egrid">${GATHER_SKILLS.map(s => slot(SKILLS[s].tool, ch.equip.tools[s], 't|' + s)).join('')}</div></div>`;
}
function tabBank() {
  const now = Date.now(), sav = savingsNow(ch, now), S = BALANCE.storage;
  const bkeys = Object.keys(ch.bank).filter(k => ch.bank[k] > 0).sort((a, b) => ITEM(b).rarity - ITEM(a).rarity);
  const invUp = invUpCost(), bankUp = bankUpCost();
  return `<h2>Bank</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));margin-top:12px;align-items:start">
    <div class="card"><h3>Savings</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">The banker pays ${pct(BALANCE.banker.dailyRate)} a day on up to ${N(BALANCE.banker.cap)} gold, accruing even while you are away.</p>
      <div class="kv"><span>In savings</span><span class="gold" data-live="savings"></span><span>On hand</span><span class="gold" data-live="gold"></span></div>
      <div class="row" style="margin-top:10px"><input id="bankamt" type="number" min="0" inputmode="numeric" placeholder="Amount" style="width:140px" aria-label="Gold amount"><button data-act="savein">Deposit</button><button data-act="saveout">Withdraw</button></div>
      <div class="row" style="margin-top:6px"><button class="sm ghost" data-act="saveall">Deposit all</button><button class="sm ghost" data-act="takeall">Withdraw all</button></div></div>
    <div class="card"><h3>Storage</h3><div class="kv" style="margin-top:6px"><span>Inventory slots</span><span data-live="slots"></span><span>Bank slots</span><span>${bankUsed()} / ${ch.bankSlots}</span></div>
      <div class="row" style="margin-top:10px">${invUp ? `<button data-act="invup" ${ch.gold >= invUp ? '' : 'disabled'}>+${S.invUp} inventory · ${N(invUp)}g</button>` : '<span class="chip">Inventory maxed</span>'}${bankUp ? `<button data-act="bankup" ${ch.gold >= bankUp ? '' : 'disabled'}>+${S.bankUp} bank · ${N(bankUp)}g</button>` : '<span class="chip">Bank maxed</span>'}</div></div></div>
    <h3 style="margin:18px 0 8px">In the bank</h3><div class="inv">${bkeys.length ? bkeys.map(k => `<div class="irow">${itemIcon(k)}<div>${rname(k)}<div class="mute" style="font-size:13px">${esc(ITEM(k).gear ? statLine(ITEM(k)) : ITEM(k).desc || '')}</div></div><span class="num" data-live="bank:${esc(k)}"></span><span class="hide-s"></span><div class="row" style="gap:6px"><button class="sm" data-act="withdraw" data-arg="${esc(k)}">Withdraw</button></div></div>`).join('') : '<p class="mute">Nothing stored. Use "Bank" on any inventory row.</p>'}</div>`;
}

// ---------- Character, titles, achievements ----------
const DERIVED = [['cpow', 'Combat power', v => N(Math.round(v))], ['maxHP', 'Max HP', v => N(v)], ['maxRes', 'Max resource', v => N(v)], ['attack', 'Attack', v => N(v)], ['magic', 'Magic attack', v => N(v)], ['defense', 'Defense', v => N(v)], ['crit', 'Crit chance', v => pct(v, 1)], ['critDmg', 'Crit damage', v => pct(v)], ['dodge', 'Dodge', v => pct(v, 1)], ['cspeed', 'Combat speed', v => v], ['carry', 'Carry weight', v => N(v)], ['drop', 'Drop rate', v => '+' + pct(v, 1)], ['xpMult', 'XP bonus', v => '+' + pct(v - 1)], ['stamina', 'Max stamina', v => v], ['lucky', 'Lucky Strike', v => pct(v, 1)], ['bonusFind', 'Bonus find (gathering)', v => pct(v, 1)], ['discount', 'Shop discount', v => pct(v, 1)]];
function statEffect(id, total) {
  const a = above(total), F = BALANCE.fx;
  return { STR: `+${pct(a * F.strHeavyYield, 1)} Mining, Woodcutting, Blacksmithing yield`, INT: `+${pct(a * F.strHeavyYield, 1)} Alchemy, Enchanting yield; better craft quality`, DEX: `${maxStamina(total, 0, advStamina(ch))} max stamina; +${pct(a * F.strHeavyYield, 1)} Tailoring, Jewelcrafting yield`, AGI: `+${pct(Math.min(F.agiSpeedCap, a * F.agiSpeed), 1)} action speed (cap 30%)`, VIT: `${N(Math.round(50 + 10 * effPts(total)))} max HP`, WIS: `+${pct(a * F.wisXp, 1)} XP; better enchant odds`, LUCK: `${pct(F.luckStrikeBase + a * F.luckStrike, 2)} base Lucky Strike`, CHARM: `${pct(Math.min(F.charmDiscountCap, a * F.charmDiscount), 1)} shop discount`, PER: `${pct(a * F.perBonusFind, 2)} bonus find` }[id];
}
function tabChar() {
  const now = Date.now(), d0 = derive(ch, now, null, charSkill), d1 = derive(ch, now, pend, charSkill), spent = Object.values(pend).reduce((s, v) => s + v, 0), left = ch.unspent - spent;
  const respecCost = ch.freeRespecs > 0 ? 0 : BALANCE.respec.baseCost * Math.pow(BALANCE.respec.growth, ch.respecs);
  const allocTotal = Object.values(ch.alloc).reduce((s, v) => s + v, 0);
  const diffs = [...DERIVED, ['pool', 'Yield (' + SKILLS[charSkill].name + ')', v => '+' + pct(v)], ['speed', 'Speed (' + SKILLS[charSkill].name + ')', v => '+' + pct(v)]].filter(([k]) => Math.abs(d1[k] - d0[k]) > 1e-9).map(([k, n, f]) => `<span>${n}</span><span class="${d1[k] > d0[k] ? 'up' : 'down'}">${f(d0[k])} → ${f(d1[k])}</span>`).join('');
  return `<div class="spread"><h2>Character</h2><button class="chip" data-act="tab" data-arg="talents">Skill points <b>${ch.skillPts}</b></button></div>
    <div class="card" style="margin-top:12px"><div class="row" style="gap:16px;align-items:center"><div class="scene-slot charscene"></div><div style="flex:1;min-width:220px"><h3>${esc(ch.name)}</h3><div>${ch.displayTitle ? `<span class="gold">${esc(ch.displayTitle)}</span> · ` : ''}${levelLabel(ch)} ${esc(race().name)} ${esc(tierName(ch.cls, ch.adv.spec, ch.adv.tier))}</div>
      <div class="mute" style="font-size:14px">${esc(ch.gender || ch.pronouns || '')} · ${esc(ORIGINS.find(o => o.id === ch.origin).name)} from ${esc(regionName())}</div>
      <div class="mute" style="font-size:14px">${esc(race().passive)} · Class: ${esc(modsText(INNATE[ch.cls]))}</div><div class="row" style="gap:6px;margin-top:8px"><button class="sm" data-act="tab" data-arg="wardrobe">Wardrobe</button></div></div></div></div>
    <div style="margin-top:14px">${presetCard()}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));margin-top:14px;align-items:start">
    <div class="card"><div class="spread"><h3>Stats</h3><span>Unspent <b class="ember">${left}</b></span></div>
      ${STATS.map(s => { const b = d1.S[s.id], nb = nextBreak(b.total); return `<div class="srow"><div><b>${s.name}</b> <span class="mute" data-noi18n>${s.id}</span><div class="d" title="${esc(s.long)}">${esc(s.short)}</div>
        <div class="d">${esc(statEffect(s.id, b.total))}${nb ? ` · soft cap at ${nb.at}` : ''}</div><div class="d" style="font-size:12px">${b.parts.map(p => `${p[0]} ${p[1]}`).join(' · ')}</div></div>
        <b class="num" style="font-size:20px;text-align:right">${b.total}${pend[s.id] ? `<span class="up" style="font-size:14px"> +${pend[s.id]}</span>` : ''}</b>
        <div class="statbtns"><button data-act="pend" data-arg="${s.id}|-1" ${pend[s.id] ? '' : 'disabled'} aria-label="Remove a point from ${s.name}">−</button><button data-act="pend" data-arg="${s.id}|1" ${left > 0 ? '' : 'disabled'} aria-label="Add a point to ${s.name}">+</button><button data-act="pend" data-arg="${s.id}|5" ${left >= 5 ? '' : 'disabled'} aria-label="Add five points to ${s.name}">+5</button></div></div>`; }).join('')}
      <div class="card" style="margin-top:12px;background:var(--panel2)"><b>Preview</b>${spent ? `<div class="kv diff" style="margin-top:6px">${diffs || '<span class="mute">No derived changes</span><span></span>'}</div>` : `<p class="mute" style="margin:4px 0 0">Add points to see exactly what changes before you apply.</p>`}
      <div class="row" style="margin-top:10px"><button class="pri" data-act="apply" ${spent ? '' : 'disabled'}>Apply ${spent || ''}</button><button data-act="resetpend" ${spent ? '' : 'disabled'}>Clear</button>
      <button class="ghost" data-act="respec" ${allocTotal ? '' : 'disabled'}>Respec (${respecCost ? N(respecCost) + 'g' : 'free'})</button></div></div></div>
    <div class="card"><h3>Derived</h3><div class="kv" style="margin-top:8px;font-size:15px">${DERIVED.map(([k, n, f]) => `<span>${n}</span><span>${f(d0[k])}</span>`).join('')}</div>
      <h3 style="margin-top:16px">Bonuses by skill</h3><div class="row" style="margin:8px 0">${SKILL_IDS.map(s => `<button class="chip ${charSkill === s ? 'on' : ''}" data-act="charskill" data-arg="${s}">${SKILLS[s].name}</button>`).join('')}</div>
      <div class="kv">${d0.yieldParts.map(p => `<span>${p[0]}</span><span>+${pct(p[1], 1)}</span>`).join('')}<span><b>Yield pool</b></span><span><b>+${pct(d0.pool, 1)}</b>${d0.poolRaw > BALANCE.yieldPoolSoftCap ? ' (soft-capped)' : ''}</span></div>
      <p class="mute" style="font-size:14px">Final yield = base × (1 + proficiency) × (1 + pool). Pool is soft-capped at +300%.</p>
      <div class="kv">${d0.speedParts.map(p => `<span>${p[0]} speed</span><span>+${pct(p[1], 1)}</span>`).join('')}<span><b>Speed</b></span><span><b>+${pct(d0.speed)}</b> of 50% cap</span></div></div></div>`;
}
function tabTitles() {
  const tb = earnedTitleBonuses(ch), earned = tb.list.map(t => t.name);
  return `<div class="spread"><h2>Titles</h2><label class="row">Displayed <select id="disptitle">${earned.length ? earned.map(n => `<option ${ch.displayTitle === n ? 'selected' : ''}>${esc(n)}</option>`).join('') : '<option>None yet</option>'}</select></label></div>
    <p class="mute">Every earned title counts, shown or not. A skill's title line boosts that skill's yield; Grandmaster and secret titles boost everything. Stats from titles: ${Object.entries(tb.stats).map(([s, v]) => `+${v} ${s}`).join(', ') || 'none yet'}.</p>
    <div class="cols">${SKILL_IDS.map(s => { const line = SKILL_TITLES[s].line; return `<div class="card"><div class="spread"><h3>${SKILLS[s].name}</h3><span class="mute num" data-live="total:${s}"></span></div><div class="bar" style="margin:8px 0"><i data-w="title:${s}"></i></div>
      <div class="grid" style="gap:4px">${line.map(([n, name, y, st]) => { const got = ch.totals[s] >= n; return `<div class="spread" style="font-size:14px;${got ? '' : 'opacity:.55'}"><span><b class="${got ? 'gold' : ''}">${name}</b> <span class="mute">${N(n)}</span></span><span class="num">+${pct(y)} · +${st} ${SKILL_TITLES[s].stat}</span></div>`; }).join('')}</div></div>`; }).join('')}</div>
    <div class="card" style="margin-top:12px"><h3>Grandmaster titles</h3><p class="mute" style="margin:4px 0 8px">One per resource at 100,000: +2% yield everywhere and +2 PER each.</p>
      <div class="row">${RES.filter(r => (ch.prof[r.id] || 0) >= 1e5 || isUnlocked(ch, r)).map(r => (ch.prof[r.id] || 0) >= 1e5 ? `<span class="chip on">${esc(r.grandTitle)}</span>` : `<span class="chip" style="opacity:.5">${esc(r.grandTitle)}</span>`).join('')}<span class="chip" style="opacity:.5">…and more as you unlock resources</span></div></div>
    <div class="card" style="margin-top:12px"><h3>Secret titles</h3><div class="grid" style="margin-top:8px">${(() => { const mine = SECRET_TITLES.filter(s => !(SECRET_BY[s.id] && SECRET_BY[s.id].cls && SECRET_BY[s.id].cls !== ch.cls)), got = mine.filter(s => ch.secretTitles[s.id]), left = mine.length - got.length; return got.map(s => `<div><b class="gold">${s.name}</b> <span class="mute">${SECRET_BY[s.id] ? '' : s.desc + ' '}+${pct(s.yield)} yield, +${s.amt} ${s.stat}</span></div>`).join('') + (left ? `<div class="mute">${got.length ? '' : 'None yet. '}${left} more secret title${left > 1 ? 's' : ''} to find. Most come from secrets: see the <button class="linkbtn" data-act="tab" data-arg="secrets">Secrets</button> tab.</div>` : ''); })()}</div></div>`;
}
function tabAch() {
  const pts = ACHIEVEMENTS.filter(a => ch.ach[a.id]).reduce((s, a) => s + a.pts, 0), max = ACHIEVEMENTS.reduce((s, a) => s + a.pts, 0);
  const list = ACHIEVEMENTS.filter(a => a.cat === achCat);
  return `<div class="spread"><h2>Achievements</h2><span class="chip">Points <b class="gold">${pts}</b> / ${max}</span></div>
    <p class="mute">Recognition only: achievements never give stats or items. Pin up to three for your profile. ${ACHIEVEMENTS.filter(a => a.hidden && !ch.ach[a.id]).length} hidden ones remain.</p>
    ${(() => { const rec = ACHIEVEMENTS.filter(a => ch.ach[a.id]).sort((a, b) => ch.ach[b.id] - ch.ach[a.id]).slice(0, 5); return rec.length ? `<div class="row" style="margin-bottom:10px"><span class="mute">Recent:</span>${rec.map(a => `<span class="chip">${esc(a.real || a.name)}</span>`).join('')}</div>` : ''; })()}
    <div class="row" style="margin-bottom:10px"><span class="mute">Pinned:</span>${ch.pins.length ? ch.pins.map(id => { const a = ACHIEVEMENTS.find(x => x.id === id); return `<span class="chip on">${esc(a.real || a.name)}</span>`; }).join('') : '<span class="mute">none</span>'}</div>
    <div class="tabs">${ACH_CATS.map(c => `<button class="chip ${achCat === c ? 'on' : ''}" data-act="achcat" data-arg="${c}">${c} ${ACHIEVEMENTS.filter(a => a.cat === c && ch.ach[a.id]).length}/${ACHIEVEMENTS.filter(a => a.cat === c).length}</button>`).join('')}</div>
    <div class="grid">${list.length ? list.map(a => { const got = ch.ach[a.id], v = a.stat === 'level' ? ch.level : (ch.counters[a.stat] || 0), hid = a.hidden && !got;
      return `<div class="card spread" style="${got ? '' : 'opacity:.75'}"><div style="flex:1;min-width:200px"><b class="${got ? 'gold' : ''}">${esc(hid ? '???' : (a.real || a.name))}</b> <span class="mute">${a.pts} pts</span><div class="mute" style="font-size:14px">${hid ? 'Hidden until unlocked.' : esc(a.desc)}</div>
        ${got ? `<div class="mute" style="font-size:13px">Unlocked ${new Date(got).toLocaleDateString()}</div>` : hid ? '' : `<div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, v / a.goal * 100).toFixed(1)}%"></i></div><div class="mute num" style="font-size:13px">${N(Math.min(v, a.goal))} / ${N(a.goal)}</div>`}</div>
        ${got ? `<button class="sm ${ch.pins.includes(a.id) ? 'pri' : ''}" data-act="pin" data-arg="${a.id}">${ch.pins.includes(a.id) ? 'Pinned' : 'Pin'}</button>` : ''}</div>`; }).join('') : `<p class="mute">No ${achCat.toLowerCase()} achievements until that system arrives.</p>`}</div>`;
}

// ---------- Shop ----------
const shopPrice = (key, d) => { const it = ITEM(key), base = (it.cost || it.value * 4) * (1 - d.discount) * REGION_BY[ch.loc].priceMult; return it.type === 'supply' ? Math.ceil(base * Math.pow(BALANCE.economy.supplyGrowth, gateLevel(ch) - 1)) : Math.max(Math.ceil((it.value || 0) * 1.5), scaled(ch, base, 1)); };
const hgCost = () => { const c = BALANCE.offline.upgradeCost[ch.offlineUpgrades]; return c ? scaled(ch, c, 1) : 0; }, invUpCost = () => { const S = BALANCE.storage, n = ch.invUps || 0, last = S.invCost.length - 1, base = n <= last ? S.invCost[n] : S.invCost[last] * Math.pow(S.invGrowth, n - last); return scaled(ch, Math.round(base * S.invHalf), 1); }, bankUpCost = () => { const c = BALANCE.storage.bankCost[ch.bankUps]; return c ? scaled(ch, c, 1) : 0; };
const enchantGold = it => scaled(ch, BALANCE.enchant.goldCost(it.plus), it.lvl);
function merchantOffers() {
  const day = Math.floor(Date.now() / 864e5);
  if (ch.merchant.day !== day) ch.merchant = { day, bought: {} };
  const idx = [], h = n => Math.floor(hashStr(ch.id + ':' + day + ':' + n) * MERCHANT_POOL.length);
  for (let n = 0; idx.length < 3 && n < 30; n++) { const i = h(n); if (!idx.includes(i)) idx.push(i); }
  return idx.map(i => ({ i, ...MERCHANT_POOL[i], price: Math.max(Math.ceil(ITEM(MERCHANT_POOL[i].key).value * 1.2), scaled(ch, MERCHANT_POOL[i].price, 1)), left: MERCHANT_POOL[i].stock - (ch.merchant.bought[i] || 0) }));
}
function tabShop() {
  const d = D(), up = ch.offlineUpgrades, maxed = d.offlineH >= BALANCE.offline.maxCapH || up >= BALANCE.offline.upgradeCost.length;
  const row = (key, multi) => { const it = ITEM(key), p = shopPrice(key, d), max = Math.min(100000, Math.floor(ch.gold / p));
    return `<div class="irow shoprow">${itemIcon(key)}<div>${rname(key)}<div class="mute" style="font-size:13px">${esc(it.gear ? statLine(it) : it.desc || '')}${ch.inv[key] ? ` · you have ${N(ch.inv[key])}` : ''}</div></div><span class="num gold">${N(p)}g</span><span class="hide-s"></span>
      <div class="row" style="gap:4px">${(multi ? BALANCE.economy.buyQty : [1]).map(n => `<button class="sm ${ch.gold >= p * n ? 'pri' : ''}" data-act="buy" data-arg="${esc(key)}|${n}" ${ch.gold >= p * n ? '' : 'disabled'}>${multi ? '×' + n.toLocaleString() : 'Buy'}</button>`).join('')}${multi ? `<button class="sm" data-act="buy" data-arg="${esc(key)}|${max}" ${max > 0 ? '' : 'disabled'}>Max${max > 0 ? ' (' + N(max) + ')' : ''}</button>` : ''}</div></div>`; };
  const offers = merchantOffers();
  return `<div class="spread"><h2>${esc(REGION_BY[ch.loc].town)} Shop</h2><span>Gold <b class="gold" data-live="gold"></b>${d.discount ? ` <span class="mute">· ${pct(d.discount, 1)} Charm discount</span>` : ''}</span></div>
    <p class="mute">Prices rise as you level (an item costs more the further you are above its tier); supplies rise only slightly. Gold only, always. Potions boost results (yield, procs, XP, luck), never speed. One potion per category, plus one meal; an equal or stronger one refreshes the timer.</p>
    <div class="card" style="margin-top:12px;border-color:var(--gold)"><div class="spread"><h3>Travelling merchant</h3><span class="mute" style="font-size:14px">New stock every day</span></div>
      <div class="inv" style="margin-top:8px">${offers.map(o => { const p = Math.ceil(o.price * (1 - d.discount)); return `<div class="irow">${itemIcon(o.key)}<div>${rname(o.key)}<div class="mute" style="font-size:13px">${esc(ITEM(o.key).gear ? statLine(ITEM(o.key)) : ITEM(o.key).desc || '')}</div></div><span class="num gold">${N(p)}g</span><span class="mute hide-s">${o.left} left</span><button class="sm ${o.left && ch.gold >= p ? 'pri' : ''}" data-act="mbuy" data-arg="${o.i}" ${o.left && ch.gold >= p ? '' : 'disabled'}>${o.left ? 'Buy' : 'Sold out'}</button></div>`; }).join('')}</div></div>
    <div class="card" style="margin-top:12px"><div class="spread"><h3>Thousandium exchange</h3><span>Shards <b class="gold">${N(account.shards)}</b></span></div><p class="mute" style="margin:4px 0 8px;font-size:14px">Shards are earned only: board quests, weeklies and Ascension. Prices never change.</p>
      <div class="inv">${SHARD_SHOP.map((o, i) => `<div class="irow">${itemIcon(o.key)}<div>${rname(o.key)}<div class="mute" style="font-size:13px">${esc(ITEM(o.key).desc || '')}</div></div><span class="num gold">${o.price} shards</span><span class="hide-s"></span><button class="sm ${account.shards >= o.price ? 'pri' : ''}" data-act="buyshard" data-arg="${i}" ${account.shards >= o.price ? '' : 'disabled'}>Exchange</button></div>`).join('')}</div></div>
    <h3 style="margin:18px 0 8px">Supplies</h3><div class="inv">${SHOP.supplies.map(k => row(k, true)).join('')}</div>
    <h3 style="margin:18px 0 8px">Loot chests</h3><p class="mute" style="margin:0 0 8px;font-size:14px">Gold only. Open them from your inventory; the odds are listed inside.</p><div class="inv">${SHOP.chests.map(k => row(k, false)).join('')}</div>
    <h3 style="margin:18px 0 8px">Pet eggs</h3><div class="inv">${SHOP.eggs.map(k => row(k, true)).join('')}</div>
    <h3 style="margin:18px 0 8px">Tools</h3><div class="inv">${SHOP.tools.map(k => row(gkey(k))).join('')}</div>
    <h3 style="margin:18px 0 4px">Potions</h3><p class="mute" style="margin:0 0 8px;font-size:14px">No level or stat requirements: if you have the gold, you can buy it. One potion per category is active at a time; a stronger one replaces a weaker one.</p>${SHOP.potions.map(([g, ks]) => `<h4 class="shopgrp">${g}</h4><div class="inv">${ks.map(k => row(k, true)).join('')}</div>`).join('')}
    <h3 style="margin:18px 0 8px">Hourglass of Patience</h3><div class="card spread"><div><b>Offline cap: ${d.offlineH} hours</b><div class="mute" style="font-size:14px">Each hourglass adds ${BALANCE.offline.upgradeH} hours of offline progress, up to ${BALANCE.offline.maxCapH}.</div></div>
      ${maxed ? '<span class="chip">Maxed</span>' : `<button class="${ch.gold >= hgCost() ? 'pri' : ''}" data-act="hourglass" ${ch.gold >= hgCost() ? '' : 'disabled'}>Buy · ${N(hgCost())}g</button>`}</div>`;
}
function tabSettings() {
  const s = account.settings, opt = (k, v, n) => `<button class="chip ${s[k] === v ? 'on' : ''}" data-act="set" data-arg="${k}|${v}">${n}</button>`;
  return `<div class="spread"><h2>Settings</h2><span class="chip">Thousandfold <b>${GAME_VERSION}</b></span></div><div class="grid" style="margin-top:12px;max-width:760px">
    ${guideCard()}
    <div class="card"><b>Theme</b><div class="row" style="margin-top:8px">${THEMES.map(([v, n]) => opt('theme', v, n)).join('')}</div></div>
    ${automationCard()}
    <div class="card"><b>Feedback</b><p class="mute" style="margin:4px 0 8px;font-size:14px">Found a bug or have an idea? Send it straight to the developer.</p><button class="pri" data-act="feedback">Send feedback</button></div>
    <div class="card"><b>Numbers</b><div class="row" style="margin-top:8px">${opt('num', 'short', '1.2K')}${opt('num', 'sci', '1.2e3')}</div></div>
    <div class="card"><b>Language · Ngôn ngữ</b><div class="row" style="margin-top:8px;gap:6px" data-noi18n>${LANGS.map(([id, n]) => `<button class="chip ${langNow() === id ? 'on' : ''}" data-act="setlang" data-arg="${id}" aria-pressed="${langNow() === id}">\u{1F310} ${n}</button>`).join('')}</div></div>
    <div class="card"><b>Comfort</b><div class="row" style="margin-top:8px"><button class="chip ${s.anim === false ? '' : 'on'}" data-act="set" data-arg="anim|${s.anim === false}">${s.anim === false ? 'Action animations: off' : 'Action animations: on'}</button>${opt('large', !s.large, s.large ? 'Larger text: on' : 'Larger text: off')}${opt('reduced', !s.reduced, s.reduced ? 'Reduced motion: on' : 'Reduced motion: off')}${opt('sound', !s.sound, s.sound ? 'Sound: on' : 'Sound: off')}${opt('discOff', !s.discOff, s.discOff ? 'Discovery pop-ups: off' : 'Discovery pop-ups: on')}</div></div>
    <div class="card"><b>Save</b><p class="mute" style="margin:4px 0 8px;font-size:14px">Auto-saves every 30 seconds and when you leave. Saves live in this browser; copy a save code (short and compressed) or save it as a file to move it.</p>
      <div class="row"><button data-act="savenow">Save now</button><button data-act="copysave">Copy save code</button><button data-act="dlsave">Save as file</button><button data-act="importsave">Import save code</button></div><div id="savemsg" class="mute" style="font-size:14px;margin-top:6px"></div></div>
    <div class="card"><b>Character</b><div class="row" style="margin-top:8px"><button data-act="toselect">Character select</button></div></div>
    <div class="card"><b>About</b><p class="mute" style="margin:6px 0 0;font-size:14px">Play online at <a href="https://thah3b.github.io/thousandfold/" target="_blank" rel="noopener">thah3b.github.io/thousandfold</a> · <a href="https://thah3b.github.io/thousandfold/privacy.html" target="_blank" rel="noopener">Privacy policy</a> · <a href="https://thah3b.github.io/thousandfold/terms.html" target="_blank" rel="noopener">Terms of service</a></p></div>
    <div class="card"><div class="spread"><h3>Patch notes</h3><span class="mute">Current: ${GAME_VERSION}</span></div><p class="mute" style="margin:4px 0 8px;font-size:14px">Alpha since v1.0. Each update counts up (v1.1, v1.2…) with a letter for small fixes (v1.1a); every fifth update starts a new major version (v1.5, then v2.0). Beta versions were v0.3 to v0.15.</p>
      ${PATCH_NOTES.map((p, i) => `<details class="pnote" ${i === 0 ? 'open' : ''}><summary><b>${p.v}</b> · ${esc(p.title)} <span class="mute">${esc(p.date)}</span></summary><ul>${p.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>`).join('')}</div></div>`;
}
function tabLater() { const l = LATER.find(x => x[0] === tab); return `<div class="later"><h2>${l[1]}</h2><div class="card"><p style="margin:0">${l[3]}</p><p class="mute" style="margin:8px 0 0">Planned for build phase ${l[2]}.</p></div></div>`; }
function bindMain() {
  const q = $('#invq'); if (q) q.addEventListener('input', e => { invQ = e.target.value; renderMain(); });
  const so = $('#invsort'); if (so) so.addEventListener('change', e => { invSort = e.target.value; renderMain(); });
  const cf = $('#cfood'); if (cf) cf.addEventListener('change', e => { ch.combatFood = e.target.value || null; });
  const dt = $('#disptitle'); if (dt) dt.addEventListener('change', e => { ch.displayTitle = e.target.value; renderSide(); });
}

// ---------- Map ----------
function regionState(r) {
  const adj = openRoutes().some(([a, b]) => (a === r.id && ch.visited[b]) || (b === r.id && ch.visited[a]));
  if (!ch.quest.done && r.id !== ch.loc) return 'sealed';
  if (ch.visited[r.id]) return 'known';
  return adj ? 'near' : 'fog';
}
function mapSvg() {
  const W = 720, H = 470, px = r => r.x + 40, py = r => r.y + 25;
  const edges = openRoutes().map(([a, b, m]) => { const A = REGION_BY[a], B = REGION_BY[b], sa = regionState(A), sb = regionState(B), dim = sa === 'fog' || sb === 'fog' || sa === 'sealed' || sb === 'sealed';
    return `<line x1="${px(A)}" y1="${py(A)}" x2="${px(B)}" y2="${py(B)}" class="route ${dim ? 'dim' : ''}"/>${dim ? '' : `<text x="${(px(A) + px(B)) / 2}" y="${(py(A) + py(B)) / 2 - 4}" class="rmin">${m}m</text>`}`; }).join('');
  const nodes = REGIONS.filter(regionOpen).map(r => { const st = regionState(r), here = r.id === ch.loc, to = ch.travel && ch.travel.to === r.id, sel = mapSel === r.id, lock = gateLevel(ch) < r.lvl;
    const label = st === 'fog' ? '???' : r.name;
    return `<g class="node ${st} ${here ? 'here' : ''} ${sel ? 'sel' : ''} ${to ? 'to' : ''}" data-act="selregion" data-arg="${r.id}" tabindex="0" role="button" aria-label="${esc(label)}">
      <circle cx="${px(r)}" cy="${py(r)}" r="${here ? 24 : 20}" /><text x="${px(r)}" y="${py(r) + 5}" class="nlv">${st === 'fog' ? '?' : r.lvl}</text>
      <text x="${px(r)}" y="${py(r) + 40}" class="nname">${esc(label)}</text>${lock && st !== 'fog' ? `<text x="${px(r)}" y="${py(r) + 56}" class="nreq">Level ${r.lvl}</text>` : ''}</g>`; }).join('');
  let trav = '';
  if (ch.travel) { const A = REGION_BY[ch.travel.from], B = REGION_BY[ch.travel.to]; trav = `<circle id="traveller" r="7" cx="${px(A)}" cy="${py(A)}" data-ax="${px(A)}" data-ay="${py(A)}" data-bx="${px(B)}" data-by="${py(B)}"/>`; }
  return `<svg class="worldmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="World map"><defs><radialGradient id="mapglow" cx=".45" cy=".5" r=".7"><stop offset="0" class="mg0"/><stop offset="1" class="mg1"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#mapglow)" rx="14"/>${edges}${nodes}${trav}</svg>`;
}
function tabMap() {
  const sel = REGION_BY[mapSel || ch.loc] || REGION_BY[ch.loc], st = regionState(sel), here = sel.id === ch.loc && !ch.travel, d = D();
  const mins = travelMinutes(ch.loc, sel.id) * (1 - travelBonus(d)), fc = fastTravelCost(sel.id, ch), x = EXPLORE_BY['x_' + sel.id], xRun = ch.actions.find(a => a.res === x.id);
  const seen = ch.areasSeen[sel.id] || [], f = exploreFrac(ch, sel.id);
  const areaRow = (i, name) => { const open = f >= BALANCE.explore.areaAt[i], es = ENEMIES.filter(e => e.region === sel.id && e.area === i);
    return `<div class="area ${open ? '' : 'shut'}"><b>${open ? esc(name) : '???'}</b><span class="mute" style="font-size:13px">${open ? es.map(e => esc(e.name) + ' (' + e.level + ')').join(', ') : `Explore to ${pct(BALANCE.explore.areaAt[i])} to find it`}</span></div>`; };
  const hidden = ENEMIES.find(e => e.region === sel.id && e.area === 'hidden'), hidOpen = seen.includes('hidden');
  const hamlet = Object.entries(START_TO_REGION).find(([, r]) => r === sel.id);
  const resHere = st === 'known' ? RES.filter(r => r.band === sel.band) : [];
  let travelBox;
  if (here) travelBox = `<p class="verd" style="margin:0"><b>You are here.</b> ${esc(sel.town)} has a shop and a bank.</p>`;
  else if (ch.travel) travelBox = `<p class="mute" style="margin:0">On the road to ${esc(REGION_BY[ch.travel.to].name)}.</p><div class="bar" style="margin-top:6px"><i data-w="travel"></i></div>`;
  else if (st === 'sealed') travelBox = `<p class="mute" style="margin:0">Finish your tasks in ${esc(regionName())} before you leave (Quests tab).</p>`;
  else if (gateLevel(ch) < sel.lvl) travelBox = `<p class="bad" style="margin:0">Needs character level ${sel.lvl} (you are ${ch.level}).</p>`;
  else travelBox = `<div class="row"><button class="pri" data-act="travel" data-arg="${sel.id}">Travel · ${fmtTime(mins * 60)}</button><button data-act="fasttravel" data-arg="${sel.id}" ${ch.gold >= fc ? '' : 'disabled'}>Fast carriage · ${N(fc)}g</button></div><p class="mute" style="font-size:14px;margin:6px 0 0">The road may bring encounters. Gathering keeps running while you travel; fighting and exploring stop. Agility shortens trips${travelBonus(d) ? ` (now −${pct(travelBonus(d))})` : ''}.</p>`;
  return `<div class="spread"><div><h2>World map</h2><p class="mute" style="margin:4px 0 0">You are ${ch.travel ? 'travelling to' : 'in'} <b data-live="travel"></b>. Exploration level <b data-live="slvl:exploration"></b>.</p></div></div>
    <div class="mapwrap">${mapSvg()}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));margin-top:14px;align-items:start">
      <div class="card"><div class="spread"><h3>${st === 'fog' ? 'Unknown region' : esc(sel.name)}</h3><span class="chip">Level ${sel.lvl}+</span></div>
        <p class="mute" style="margin:6px 0 10px">${st === 'fog' ? 'Travel nearer to learn more about this place.' : esc(sel.desc)}</p>${st !== 'fog' && regionTalk(sel) ? `<p class="localtalk"><b>Local talk:</b> ${esc(regionTalk(sel))}</p>` : ''}${travelBox}</div>
      ${st === 'fog' ? '' : `<div class="card"><div class="spread"><h3>Exploration</h3><span class="num"><b data-live="xfrac:${sel.id}"></b> mapped</span></div><div class="bar" style="margin:8px 0"><i data-w="xfrac:${sel.id}"></i></div>
        ${here ? (xRun ? `<button data-act="stop" data-arg="${x.id}">Stop exploring</button>` : `<button class="pri" data-act="start" data-arg="${x.id}">Explore ${esc(sel.name)} · 1 stamina</button>`) : '<p class="mute" style="margin:0">Explore when you are here.</p>'}
        <div class="grid" style="gap:6px;margin-top:10px">${hamlet ? `<div class="area"><b>${esc(START_REGIONS.find(r => r.id === hamlet[0]).name)}</b><span class="mute" style="font-size:13px">${ENEMIES.filter(e => e.hamlet === hamlet[0]).map(e => esc(e.name)).join(', ')}</span></div>` : ''}
        ${sel.areas.map((n, i) => areaRow(i, n)).join('')}
        <div class="area ${hidOpen ? '' : 'shut'}"><b>${hidOpen ? 'Hidden: ' + esc(hidden.name) : '???'}</b><span class="mute" style="font-size:13px">${hidOpen ? 'A rare creature with a unique drop.' : 'Something here is hard to notice.'}</span></div></div></div>`}
      ${resHere.length ? `<div class="card"><h3>Found here</h3><p class="mute" style="font-size:14px;margin:4px 0 8px">Region-only resources. Start them here; they keep running after you leave.</p><div class="row" style="gap:6px">${resHere.filter(resKnown).map(r => `<span class="chip">${resIcon(r, 18)} ${esc(r.name)}</span>`).join('')}${resHere.filter(r => !resKnown(r)).length ? `<span class="chip mute">${resHere.filter(r => !resKnown(r)).length} undiscovered</span>` : ''}</div></div>` : ''}
    </div>`;
}
// ---------- Combat ----------
function lootHtml(e) {
  return e.loot.filter(l => !l.secret || ch.seen[l.key]).map(l => { const it = ITEM(l.key), known = ch.seen[l.key] || !l.rare, rc = RARITIES[it.rarity];
    return `<span class="chip" title="${esc(known ? it.name : 'Unknown ' + rc.name.toLowerCase() + ' drop')}">${known ? itemIcon(l.key, 16) + ' ' + esc(it.name) : '??? ' + rc.name} <span class="mute">${l.chance >= 1 ? '' : (l.chance * 100 < 1 ? (l.chance * 100).toFixed(1) : Math.round(l.chance * 100)) + '%'}</span></span>`; }).join('');
}
function enemyCard(e, d) {
  const f = fightInfo(ch, e, d), run = ch.actions.find(a => a.res === e.id), c = ch.prof[e.id] || 0, k = tierOf(c);
  const tone = f.win >= 0.9 ? 'verd' : f.win >= 0.6 ? 'gold' : 'bad', why = cantStart(e);
  return `<div class="card enemy ${run ? 'running' : ''} ${e.boss ? 'boss' : ''}"><div class="spread"><div class="row" style="gap:10px;flex-wrap:nowrap">${monsterIcon(e, e.boss ? 60 : 48)}<div><b style="font-size:18px">${esc(e.name)}</b> <span class="mute">Lv ${e.level}${e.boss ? ' · Boss' : e.role === 'hidden' ? ' · Rare' : ''}</span></div></div>${tierBadge(c)}</div>
    <p class="mute" style="margin:2px 0 8px;font-size:14px">${esc(e.flavor)}</p>
    <div class="kv"><span>Recommended power</span><span class="${tone}">${N(Math.round(f.rec))} (yours ${N(Math.round(f.cp))})</span><span>Win chance</span><span class="${tone}">${pct(f.win)}</span><span>Fight time</span><span>${fmtTime(f.time)}${f.crush ? ' <span class="verd">(you overpower it: 50%+ stronger)</span>' : ''}${!f.over ? ' <span class="mute">(no speed bonus below recommended)</span>' : ''}</span><span>Rewards</span><span>${N(e.xp * (1 + BALANCE.tierYieldBonus[k]))} XP · ${N(e.gold[0])}–${N(e.gold[1])}g</span><span>Wins</span><span data-live="next:${e.id}"></span></div>
    ${e.mech ? `<p style="margin:8px 0 0;font-size:14px"><b>${esc(e.mech.name)}.</b> ${esc(e.mech.text)} ${f.mech ? '<span class="verd">Countered</span>' : '<span class="bad">Not countered</span>'}</p>` : ''}
    <div class="row" style="gap:4px;margin:8px 0">${lootHtml(e)}</div>
    ${run ? `<button data-act="stop" data-arg="${e.id}">Retreat</button>` : why ? `<button disabled title="${esc(why)}">${esc(why)}</button>` : `<button class="pri" data-act="start" data-arg="${e.id}">Fight · ${e.stamina} stamina</button>`}</div>`;
}
function tabCombat() {
  const d = D('slaying'), run = ch.actions.find(a => ACT(a.res).kind === 'combat'), e = run && ACT(run.res);
  const here = ENEMIES.filter(x => x.region === ch.loc);
  const groups = [];
  const hamlet = here.filter(x => x.hamlet); if (hamlet.length) groups.push([START_REGIONS.find(r => r.id === hamlet[0].hamlet).name + ' (starter area)', hamlet]);
  REGION_BY[ch.loc].areas.forEach((n, i) => { const es = here.filter(x => x.area === i && areaOpen(ch, x, d)); if (es.length) groups.push([n, es]); });
  const trial = here.filter(x => x.area === 'trial' && areaOpen(ch, x, d)); if (trial.length) groups.unshift(['Class trial', trial]);
  const hid = here.filter(x => x.area === 'hidden' && areaOpen(ch, x, d)); if (hid.length) groups.push(['Hidden place', hid]);
  const shut = REGION_BY[ch.loc].areas.filter((n, i) => exploreFrac(ch, ch.loc) < BALANCE.explore.areaAt[i]).length;
  const foods = healFoods();
  return skillHeader('slaying', `Auto-battles in ${esc(REGION_BY[ch.loc].name)}. One fight at a time; it occupies stamina like any action.`)
    + `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));margin-top:14px;align-items:start">
      <div class="card"><div class="spread"><b>${esc(ch.name)}</b><span>Power <b data-live="cp"></b></span></div>
        <div class="spread" style="font-size:14px;margin-top:6px"><span>HP</span><span class="num" data-live="hp"></span></div><div class="bar hpbar"><i data-w="hp"></i></div>
        <div class="spread" style="margin-top:10px"><label for="cfood" style="font-size:14px">Combat food (<span data-live="foodn"></span>)</label>
        <select id="cfood" style="max-width:220px"><option value="">Weakest first</option>${foods.map(k => `<option value="${k}" ${ch.combatFood === k ? 'selected' : ''}>${esc(ITEMS[k].name)} (+${ITEMS[k].heal})</option>`).join('')}</select></div>
        <p class="mute" style="font-size:13px;margin:6px 0 0">Below ${pct(BALANCE.combat.autoEatAt)} HP you eat automatically. Cook fish for combat food. HP regenerates when you are not fighting.</p></div>
      <div class="card"><b>${e ? 'Fighting ' + esc(e.name) : ch.travel ? 'On the road' : 'No fight running'}</b>${e ? '<div class="scene-slot"></div>' : ''}
        ${e ? `<div class="spread" style="font-size:14px;margin-top:6px"><span>${esc(cls().res)}</span></div><div class="bar cres"><i style="width:${((run.streak % 3) / 3 * 100).toFixed(0)}%"></i></div><div class="spread" style="font-size:14px;margin-top:6px"><span>${esc(e.name)}</span><span class="mute">Lv ${e.level}</span></div><div class="bar ehp"><i id="ehp" style="width:100%"></i></div>` : ''}
        <div class="log clog" id="clog" style="margin-top:8px;max-height:180px"></div></div></div>
    ${ch.travel ? '<p class="mute">You are travelling. Fights resume when you arrive.</p>' : groups.map(([n, es]) => `<h3 style="margin:18px 0 8px">${esc(n)}</h3><div class="cols">${es.map(x => enemyCard(x, d)).join('')}</div>`).join('')}
    ${shut && !ch.travel ? `<p class="mute" style="margin-top:14px">${shut} more area${shut > 1 ? 's' : ''} here, including the boss lair. Explore from the Map tab to find ${shut > 1 ? 'them' : 'it'}.</p>` : ''}`;
}
// ---------- Quests ----------
function tutorialHtml() {
  const t = TUTORIALS[ch.region], npc = START_REGIONS.find(r => r.id === ch.region).npc;
  if (!t) return '';
  return `<div class="spread"><h3>Tutorial</h3><span class="chip">${ch.quest.done ? 'Tutorial complete' : `${ch.quest.step} of 10 done`}</span></div>
    <div class="row" style="gap:12px;flex-wrap:nowrap;margin-top:6px">${npcSprite(npc, 52)}<p class="mute" style="margin:0">${esc(npc)} of ${esc(START_REGIONS.find(r => r.id === ch.region).name)} has work for you. ${ch.quest.done ? 'All done; the world map is open.' : 'Finish these to open the world map. Each one grants a permanent stat point.'}</p></div>
    <div class="grid" style="margin-top:12px">${TUTORIAL_TITLES.map((title, i) => { const done = i < ch.quest.step || ch.quest.done, cur = i === ch.quest.step && !ch.quest.done, g = cur ? questGoal(i) : null;
      return `<div class="card quest ${done ? 'done' : cur ? 'cur' : 'todo'}"><div class="spread"><b>${i + 1}. ${esc(title)}</b><span class="${done ? 'verd' : 'mute'}">${done ? 'Done' : `+1 ${QUEST_STATS[i]}${i === 9 ? ' (+2), gear, 200g' : ''}`}</span></div>
        ${done || cur ? `<p style="margin:6px 0 0;font-size:15px">${esc(t.lines[i])}</p>` : ''}
        ${cur ? `<div class="spread" style="margin-top:8px"><span>${esc(g.label)}</span><span class="num">${N(Math.min(g.have, g.need))} / ${N(g.need)}</span></div><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, g.have / g.need * 100).toFixed(1)}%"></i></div><div class="row" style="margin-top:8px"><button class="sm pri" data-act="questgo" data-arg="${g.go}">Go there</button></div>` : ''}</div>`; }).join('')}</div>`;
}

// ---------- Class ----------
let talentTree = null, careerSkill = 'mining';
function tierBox(t) {
  const cur = ch.adv.tier, c = ch.cls, done = cur >= t, here = cur + 1 === t;
  let names;
  if (t === 1) names = [cls().name];
  else if (ch.adv.spec != null && cur >= 2) names = [tierName(c, ch.adv.spec, t)];
  else names = SPECS[c].map((sp, i) => tierName(c, i, t));
  const st = TIER_STATS[t];
  return `<div class="tierbox ${done ? 'done' : here ? 'next' : ''}"><span class="mute" style="font-size:13px">Tier ${t} · level ${t === 1 ? 1 : TIER_LEVEL[t]}</span><b>${names.map(esc).join(' / ')}</b>${st ? `<span class="mute" style="font-size:13px">+${st[0]} ${cls().pri}, +${st[1]} ${cls().sec}, +${BALANCE.stamina.perAdvance} stamina, new talents</span>` : '<span class="mute" style="font-size:13px">Class tree and innate passive</span>'}</div>`;
}
function tabClass() {
  const c = cls(), A = ADVANCE[ch.cls], q = ch.adv.quest, res = c.res;
  const AS = BALANCE.ascension;
  let questHtml = `<p class="mute" style="margin:4px 0 8px">You have reached your final tier. At level ${AS.needLevel} you can ascend: your level starts again at 1 and you keep everything else, including allocated stats, skills, talents, items and class. You earn stat and skill points all over again, with no cap.</p>
    <div class="kv"><span>Ascensions</span><span>A${ch.ascension}</span><span>Next ascension adds</span><span>+${pct(AS.xp)} XP, +${pct(AS.yield)} yield, +${pct(AS.power)} attack and HP, ${AS.shards} Thousandium</span><span>Level</span><span>${ch.level} / ${AS.needLevel}</span></div>
    <div class="row" style="margin-top:10px"><button class="pri" data-act="askascend" ${canAscend() ? '' : 'disabled'}>${canAscend() ? `Ascend to A${ch.ascension + 1}` : `Ascend at level ${AS.needLevel}`}</button></div>`;
  if (q) {
    const steps = [0, 1, 2, 3, 4].map(i => { const g = advGoal(i), done = i < q.step, cur = i === q.step;
      return `<div class="qstep ${done ? 'done' : cur ? 'cur' : ''}"><span>${done ? '✓' : i + 1}</span><div><b>${esc(g.label)}</b>${cur && i < 4 ? `<div class="spread" style="font-size:14px"><span class="mute">${N(Math.min(g.have, g.need))} / ${N(g.need)}</span>${g.go ? `<button class="sm" data-act="${g.region ? 'goregion' : 'questgo'}" data-arg="${g.region || g.go}">Go</button>` : ''}</div><div class="bar"><i style="width:${Math.min(100, g.have / g.need * 100).toFixed(1)}%"></i></div>` : ''}</div></div>`; }).join('');
    const choose = q.step === 4 && q.tier === 2 ? `<h3 style="margin:14px 0 8px">Choose your path</h3><div class="cols">${SPECS[ch.cls].map(([n, focus, sig, t3], i) => `<div class="card"><b style="font-size:18px">${esc(n)}</b><p class="mute" style="margin:4px 0;font-size:14px">Signature skill: ${esc(sig)}. Becomes ${esc(t3)} at tier 3.</p><p style="margin:4px 0;font-size:14px">${esc(modsText(FOCUS_MODS[focus].main, 5))}; ${esc(modsText(FOCUS_MODS[focus].active, 3))}; capstone ${esc(modsText(FOCUS_MODS[focus].apex))}</p><button class="pri" data-act="promote" data-arg="${i}">Become a ${esc(n)}</button></div>`).join('')}</div>` : '';
    questHtml = `<p class="mute" style="margin:4px 0 10px">${esc(A[0])} will test you for tier ${q.tier}.</p><div class="grid" style="gap:6px">${steps}</div>${choose}`;
  }
  const others = CLASSES.filter(x => x.id !== ch.cls);
  const sec = ch.adv.secondary ? CLASSES.find(x => x.id === ch.adv.secondary) : null;
  return `<div class="spread"><h2>Class</h2><span class="chip">Tier ${ch.adv.tier} · ${esc(tierName(ch.cls, ch.adv.spec, ch.adv.tier))}</span></div>
    <div class="card" style="margin-top:12px"><div class="row">${portrait(ch, 72)}<div style="flex:1"><h3>${esc(tierName(ch.cls, ch.adv.spec, ch.adv.tier))}</h3><div class="mute">${esc(c.role)} · resource: ${esc(res)} · grows ${c.pri}, leans ${c.sec}</div>
      <p style="margin:6px 0 0"><b>Innate:</b> ${esc(modsText(INNATE[ch.cls]))}.</p>${sec ? `<p style="margin:4px 0 0"><b>Second path:</b> ${esc(sec.name)}, ${esc(modsText(INNATE[sec.id], 0.5))}.</p>` : ''}
      <p class="mute" style="margin:6px 0 0;font-size:14px">Active skills from your talents spend ${esc(res)} automatically in fights (roughly one fight in three); their effect is shown as an average.</p></div></div></div>
    <div class="tierpath">${[1, 2, 3, 4].map(tierBox).join('')}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));margin-top:14px;align-items:start">
      <div class="card"><h3>${q ? `Advancement: tier ${q.tier}` : 'Advancement'}</h3>${questHtml}</div>
      <div class="grid">
        <div class="card"><h3>A second path</h3>${ch.adv.tier < 2 ? '<p class="mute">Opens after your first advancement.</p>' : !secReady() ? `<p class="mute">Reach level 35 and visit 3 regions (${Object.keys(ch.visited).length}/3), then a second class lends you half its innate passive.</p>` : `<p class="mute" style="margin:4px 0 8px">Half-strength innate passive from another class.${sec ? ` Changing costs ${N(secChangeCost())} gold.` : ''}</p><div class="row"><select id="secsel" aria-label="Second class">${others.map(x => `<option value="${x.id}" ${sec && sec.id === x.id ? 'selected' : ''}>${esc(x.name)}: ${esc(modsText(INNATE[x.id], 0.5))}</option>`).join('')}</select><button class="pri" data-act="setsec">${sec ? 'Change' : 'Take this path'}</button></div>`}</div>
        <div class="card"><h3>Reforge Destiny</h3>${ch.adv.tier < 2 ? '<p class="mute">Opens after your first advancement.</p>' : `<p class="mute" style="margin:4px 0 8px">Change your class and keep your tier. Class talents are refunded. Your master needs proof (defeat 3 different region bosses: ${ch.counters.bossKinds}/3) and ${N(reforgeCost())} gold.</p>
          <div class="row">${ch.inv.reforge_destiny ? '<button class="pri" data-act="use" data-arg="reforge_destiny">Use Reforge Destiny</button>' : `<button data-act="buyreforge" ${reforgeReady() && ch.gold >= reforgeCost() ? '' : 'disabled'}>Commission one · ${N(reforgeCost())}g</button>`}</div>`}</div>
      </div></div>`;
}
function reforgeModal() {
  modal(`<h3>Reforge your destiny</h3><p class="mute">Pick a new class. Your tier (${ch.adv.tier}) is kept${ch.adv.tier >= 2 ? '; pick its specialization too' : ''}. Class talents are refunded.</p>
    <div class="grid" style="gap:6px;max-height:50vh;overflow:auto">${CLASSES.filter(x => x.id !== ch.cls).map(x => ch.adv.tier >= 2 ? SPECS[x.id].map((sp, i) => `<button data-act="doreforge" data-arg="${x.id}|${i}">${esc(x.name)} → ${esc(tierName(x.id, i, ch.adv.tier))}</button>`).join('') : `<button data-act="doreforge" data-arg="${x.id}|0">${esc(x.name)}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button data-act="close">Cancel</button></div>`);
}
// ---------- Talents ----------
function nodeCard(n) {
  const r = nodeRank(n.id), why = canLearn(n), max = r >= n.ranks;
  return `<div class="card tnode ${r ? 'has' : ''} ${n.kind}"><div class="spread"><b>${esc(n.name)}</b><span class="num">${r}/${n.ranks}</span></div>
    ${n.kind === 'active' ? `<span class="chip" style="font-size:12px;width:max-content">Active · spends ${esc(cls().res)}</span>` : n.kind === 'cap' ? '<span class="chip" style="font-size:12px;width:max-content">Capstone · 3 points</span>' : ''}
    ${n.note ? `<p class="mute" style="margin:0;font-size:13px">${esc(n.note)}</p>` : ''}
    <p style="margin:0;font-size:14px">${r ? esc(modsText(n.mods, r)) : '<span class="mute">Not learned</span>'}</p>
    ${max ? '' : `<p class="mute" style="margin:0;font-size:13px">Next: ${esc(modsText(n.mods, r + 1))}</p>`}
    ${n.req.length ? `<p class="mute" style="margin:0;font-size:12px">Needs ${n.req.map(([id, k]) => `${esc(NODES[id].name)} ${k}`).join(', ')}</p>` : ''}
    ${max ? '' : `<button class="sm ${why ? '' : 'pri'}" data-act="learn" data-arg="${n.id}" ${why ? `disabled title="${esc(why)}"` : ''}>${why && why !== 'Maxed.' ? esc(why) : 'Learn'}</button>`}</div>`;
}
function tabTalents() {
  const tier = ch.adv.tier, trees = [['class', 'Class']];
  if (tier >= 2) trees.push(['spec', tierName(ch.cls, ch.adv.spec, 2)]);
  trees.push(['career', 'Careers'], ['general', 'General']);
  const cur = talentTree && trees.find(t => t[0] === talentTree) ? talentTree : 'class', rc = treeRespecCost();
  let body = '';
  if (cur === 'class') body = `<div class="tgrid">${TREES['class:' + ch.cls].map(nodeCard).join('')}</div>`;
  if (cur === 'spec') body = [2, 3, 4].map(t => t <= tier ? `<h3 style="margin:14px 0 8px">Tier ${t} · ${esc(tierName(ch.cls, ch.adv.spec, t))}</h3><div class="tgrid">${TREES[`spec:${ch.cls}:${ch.adv.spec}:${t}`].map(nodeCard).join('')}</div>` : `<p class="mute">Tier ${t} branch opens when you advance.</p>`).join('');
  if (cur === 'career') body = `<div class="row" style="margin-bottom:10px">${SKILL_IDS.map(s => `<button class="chip ${careerSkill === s ? 'on' : ''}" data-act="careerskill" data-arg="${s}">${SKILLS[s].name}${spentPoints(n => n.tree === 'career:' + s) ? ' •' : ''}</button>`).join('')}</div><div class="tgrid">${TREES['career:' + careerSkill].map(nodeCard).join('')}</div>`;
  if (cur === 'general') body = `<div class="tgrid">${TREES.general.map(nodeCard).join('')}</div>`;
  const M = classMods(ch);
  return `<div class="spread"><h2>Talents</h2><span class="chip">Skill points <b class="ember">${ch.skillPts}</b> · spent ${spentPoints()}</span></div>
    <p class="mute">One point per level, three more every tenth level. Capstones cost 3. ${tier < 2 ? 'Your specialization branch opens at tier 2.' : ''}</p>
    <div class="row" style="margin:10px 0">${trees.map(([id, n]) => `<button class="chip ${cur === id ? 'on' : ''}" data-act="ttree" data-arg="${id}">${esc(n)}</button>`).join('')}
      <button class="chip" data-act="respectal" ${spentPoints() ? '' : 'disabled'}>Reset talents (${rc ? N(rc) + 'g' : 'free'})</button></div>
    ${body}
    <div class="card" style="margin-top:14px"><b>Everything your class and talents give you</b><p class="mute" style="margin:6px 0 0;font-size:14px">${esc(modsText(M)) || 'Nothing yet.'}</p></div>`;
}

// ---------- Companions ----------
function compPortrait(name, size) {
  const cls = Object.keys(COMPANIONS).find(k => COMPANIONS[k][0] === name);
  return npcSprite(name, size, cls, true);
}
function tabCompanions() {
  const def = COMPANIONS[ch.comp ? ch.comp.cls : ch.cls];
  if (!ch.comp) return `<h2>Companions</h2><div class="card" style="margin-top:12px"><div class="row">${compPortrait(def[0], 64)}<div style="flex:1"><h3>${esc(def[0])} <span class="mute">${esc(def[1])}</span></h3><p style="margin:4px 0">${esc(def[2])}</p><p class="mute" style="margin:0;font-size:14px">At full strength: ${esc(modsText(def[3]))}. Starts at a quarter of that and grows with level, bond and gear.</p></div></div>
    <div class="row" style="margin-top:12px"><button class="pri" data-act="recruit" ${gateLevel(ch) >= COMPANION_UNLOCK_LEVEL ? '' : 'disabled'}>${gateLevel(ch) >= COMPANION_UNLOCK_LEVEL ? `Recruit ${esc(def[0])}` : `Recruit at level ${COMPANION_UNLOCK_LEVEL}`}</button></div></div>`;
  const c = ch.comp, L = compLevel(c), lx = levelFromXp(c.xp), mult = compMult(ch), cap = compCap(), pts = compPoints();
  const slotRow = slot => { const cur = c.gear[slot], opts = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && ITEM(k).gear && COMPANION_SLOTS[slot].includes(ITEM(k).slot));
    return `<div class="eslot">${cur ? itemIcon(cur, 28) : '<span class="eico"></span>'}<div><div class="mute" style="font-size:12px">${slot[0].toUpperCase() + slot.slice(1)}</div>${cur ? rname(cur) : '<span class="mute">Empty</span>'}</div>${cur ? `<button class="sm ghost" data-act="cunequip" data-arg="${slot}">×</button>` : ''}</div>
      ${opts.length ? `<div class="row" style="gap:4px;margin:4px 0 8px">${opts.slice(0, 6).map(k => `<button class="chip" data-act="cequip" data-arg="${slot}|${esc(k)}">${esc(ITEM(k).name)}</button>`).join('')}</div>` : ''}`; };
  const gifts = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && giftLikes(k)).slice(0, 8);
  const chapters = def[5].map((line, i) => { const done = i < c.chapter, cur = i === c.chapter, open = cur && c.chBase != null, g = open ? chapterGoal() : null;
    return `<div class="qstep ${done ? 'done' : open ? 'cur' : ''}"><span>${done ? '✓' : i + 1}</span><div><b>Chapter ${i + 1}</b>${done || open ? `<p style="margin:2px 0;font-size:14px">${esc(line)}</p>` : `<p class="mute" style="margin:2px 0;font-size:14px">Reach ${25 * (i + 1)} bond.</p>`}${open ? `<div class="spread" style="font-size:14px"><span>${esc(g.label)}</span><span class="mute num">${N(Math.min(g.have, g.need))} / ${N(g.need)}</span></div><div class="bar"><i style="width:${Math.min(100, g.have / g.need * 100).toFixed(1)}%"></i></div>` : ''}</div></div>`; }).join('');
  return `<div class="spread"><h2>Companions</h2>${c.sworn ? '<span class="chip on">Oath sworn</span>' : ''}</div>
    <div class="card" style="margin-top:12px"><div class="row">${compPortrait(def[0], 72)}<div style="flex:1"><h3>${esc(def[0])} <span class="mute">${esc(def[1])}</span></h3><p style="margin:2px 0">${esc(def[2])}</p>
      <div class="spread" style="font-size:14px"><span>Level ${L}</span><span class="mute num">${lx.need ? `${N(lx.into)} / ${N(lx.need)} XP` : 'Max'}</span></div><div class="bar xp"><i style="width:${lx.need ? (lx.into / lx.need * 100).toFixed(1) : 100}%"></i></div>
      <div class="spread" style="font-size:14px;margin-top:6px"><span>Bond ${Math.floor(c.bond)} / 100</span><span class="mute">${c.bond >= cap && cap < 100 ? 'Their chapter is waiting' : c.bond >= 100 ? '' : `Grows with time together and gifts`}</span></div><div class="bar bond"><i style="width:${c.bond}%"></i></div></div></div>
      <p style="margin:10px 0 0"><b>Helping you now:</b> ${esc(modsText(def[3], mult))}${ch.cls === 'healer' && c.cls === 'healer' ? ' <span class="verd">(Healer + Paladin: ×1.5, and they level with you)</span>' : ''}.</p>
      <p class="mute" style="margin:4px 0 0;font-size:13px">Strength ${pct(mult)} of full: level ${L}/99, bond ${Math.floor(c.bond)}, gear and talents. Earns 25% of your XP${ch.cls === 'healer' && c.cls === 'healer' ? ' (Paladin: 40%)' : ''}.</p></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));margin-top:14px;align-items:start">
      <div class="card"><h3>Gear</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Any gear from your inventory. Better gear makes them up to twice as effective for their level.</p>${['weapon', 'armour', 'trinket'].map(slotRow).join('')}</div>
      <div class="card"><div class="spread"><h3>Talents</h3><span class="chip">Points <b>${pts}</b></span></div><p class="mute" style="margin:4px 0 8px;font-size:14px">One point every 5 companion levels.</p>
        <div class="grid" style="gap:6px">${COMPANION_TREE.map(([n, r, m], i) => `<div class="spread area"><div><b>${esc(n)}</b> <span class="mute">${c.tree[i] || 0}/${r}</span><div class="mute" style="font-size:13px">${i === 0 ? `+${pct(m.eff)} companion strength per rank` : esc(modsText(m))} per rank</div></div><button class="sm" data-act="clearn" data-arg="${i}" ${pts > 0 && (c.tree[i] || 0) < r ? '' : 'disabled'}>Learn</button></div>`).join('')}</div></div>
      <div class="card"><h3>Their story</h3><div class="grid" style="gap:6px;margin-top:8px">${chapters}</div></div>
      <div class="card"><h3>Gifts</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">${esc(def[0])} likes ${GIFT_TYPES[def[4]]}. Each gift adds 2 bond.</p>${gifts.length ? `<div class="row" style="gap:4px">${gifts.map(k => `<button class="chip" data-act="gift" data-arg="${esc(k)}">${itemIcon(k, 16)} ${esc(ITEM(k).name)} (${N(ch.inv[k])})</button>`).join('')}</div>` : '<p class="mute">Nothing they like in your bags right now.</p>'}</div>
    </div>`;
}
// ---------- Arsenal ----------
function egoMood(b) { return b >= 100 ? 'Awakened' : b >= 75 ? 'Devoted' : b >= 50 ? 'Fond' : b >= 20 ? 'Content' : 'Sulking'; }
function tabArsenal() {
  const g = ch.growth, eqId = egoEquipped(ch);
  let growthHtml = '<p class="mute">Defeat any region boss to find one.</p>';
  if (g) {
    const cost = growthCost(g.lvl), lean = !g.path ? (g.kills && g.undead / g.kills >= 0.3 ? 'holy' : D().crit >= 0.15 ? 'assassin' : g.gatherXp > g.combatXp ? 'harvest' : 'berserk') : null;
    const feed = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && canFeed(k)).sort((a, b) => feedXp(b) - feedXp(a)).slice(0, 8);
    growthHtml = `<div class="spread"><b style="font-size:18px">${esc(growthName(g))}</b><span class="chip">Level ${g.lvl}/${GROWTH.maxLevel}</span></div>
      <div class="bar" style="margin:6px 0"><i style="width:${g.lvl >= GROWTH.maxLevel ? 100 : (g.xp / cost * 100).toFixed(1)}%"></i></div><div class="mute num" style="font-size:13px">${g.lvl >= GROWTH.maxLevel ? 'Fully grown' : `${N(g.xp)} / ${N(cost)} growth`}</div>
      <div class="kv" style="margin-top:8px"><span>Attack</span><span>${Math.round(GROWTH.attackBase + GROWTH.attackPerLevel * g.lvl)}</span><span>Passive</span><span>${g.path ? esc(modsText(GROWTH.passives[g.path][Math.min(1, g.tier - 2)])) : 'none until it evolves'}</span><span>${g.path ? 'Path' : 'Leaning'}</span><span>${esc(GROWTH.pathText[g.path || lean])}</span><span>Next evolution</span><span>${g.tier < 3 ? 'Level ' + GROWTH.evolveAt[g.tier - 1] : 'None, final form'}</span></div>
      <p class="mute" style="font-size:13px;margin:8px 0">It grows from kills while equipped (${GROWTH.killXp} × enemy level each) and from trophies and materials you feed it.${growthEquipped(ch) ? ' <span class="verd">Equipped.</span>' : ''}</p>
      ${feed.length ? `<div class="grid" style="gap:4px">${feed.map(k => `<div class="spread area"><span>${itemIcon(k, 16)} ${esc(ITEM(k).name)} <span class="mute">×${N(ch.inv[k])} · ${feedXp(k)} each</span></span><span class="row" style="gap:4px"><button class="sm" data-act="feed" data-arg="${esc(k)}|1">Feed 1</button><button class="sm" data-act="feed" data-arg="${esc(k)}|all">All</button></span></div>`).join('')}</div>` : '<p class="mute">No trophies or materials to feed it.</p>'}`;
  }
  const egoCard = id => { const e = EGOS[id], st = ch.egos[id];
    if (!st) return `<div class="card"><b>???</b><p class="mute" style="margin:4px 0 0;font-size:14px">${esc(EGO_HINTS[id])}</p></div>`;
    const abil = e.abilities.map((m, i) => { const at = [EGO_BOND.ab1, EGO_BOND.ab2, EGO_BOND.awaken][i], on = st.bond >= at && st.bond >= EGO_BOND.sulk; return `<div style="font-size:14px" class="${on ? 'verd' : 'mute'}">${at} bond: ${esc(modsText(m))}${on ? '' : ''}</div>`; }).join('');
    return `<div class="card ego ${eqId === id ? 'running' : ''}"><div class="spread"><b style="font-size:18px">${esc(ITEM(gkey('ego_' + id)).name)}</b><span class="chip ${st.bond < EGO_BOND.sulk ? 'short' : ''}">${egoMood(st.bond)}</span></div>
      <div class="mute" style="font-size:14px">${esc(e.epithet)} · ${eqId === id ? '<span class="verd">equipped</span>' : 'not equipped (bond only changes while equipped)'}</div>
      <div class="spread" style="font-size:14px;margin-top:6px"><span>Bond</span><span class="num">${st.bond.toFixed(1)} / 100</span></div><div class="bar bond"><i style="width:${st.bond}%"></i></div>
      <p style="margin:8px 0 4px;font-size:14px">Likes ${esc(e.likeText)}. Dislikes ${esc(e.dislikeText)}. Below ${EGO_BOND.sulk} bond it sulks and withholds its powers.</p>${abil}
      ${st.ch ? `<details style="margin-top:6px"><summary>Story (${st.ch}/3)</summary>${e.chapters.slice(0, st.ch).map(t => `<p style="font-size:14px;margin:6px 0">${esc(t)}</p>`).join('')}</details>` : ''}
      ${eqId === id ? '' : ch.inv[gkey('ego_' + id)] ? `<button class="sm pri" style="margin-top:8px" data-act="equip" data-arg="${gkey('ego_' + id)}">Equip</button>` : ''}</div>`; };
  return `<h2>Arsenal</h2><p class="mute">Weapons with a life of their own. Equip them in your weapon slot.</p>
    <div class="card" style="margin-top:12px"><h3>Growth weapon</h3>${growthHtml}${g && !growthEquipped(ch) && ch.inv[gkey('growth_blade')] ? `<button class="sm pri" style="margin-top:8px" data-act="equip" data-arg="${gkey('growth_blade')}">Equip</button>` : ''}</div>
    <h3 style="margin:18px 0 8px">Sentient weapons · ${Object.keys(ch.egos).length}/${Object.keys(EGOS).length}</h3><div class="cols">${Object.keys(EGOS).map(egoCard).join('')}</div>`;
}


function storyGoBtn(rid, step) {
  const G = STORY_GOALS[step]; if (!G) return '';
  if (G.type === 'explore') return `<div class="row" style="margin-top:6px"><button class="sm" data-act="gostart" data-arg="x_${rid}">Go explore</button></div>`;
  if (G.type === 'boss') { const b = ENEMIES.find(e => e.region === rid && e.role === 'boss'); return b ? `<div class="row" style="margin-top:6px"><button class="sm" data-act="gostart" data-arg="${b.id}">Go fight</button></div>` : ''; }
  return `<div class="row" style="margin-top:6px"><button class="sm" data-act="${rid === ch.loc ? 'tab' : 'goregion'}" data-arg="${rid === ch.loc ? 'combat' : rid}">Go</button></div>`;
}
function questRow(q, i) {
  const have = Math.min(questHave(q), q.need), done = have >= q.need;
  return `<div class="card quest ${done ? 'cur' : ''}"><div class="spread"><b>${esc(q.label)}</b><span class="chip">${q.kind === 'weekly' ? 'Weekly' : 'Daily'} · ${esc(REGION_BY[q.region].town)}</span></div>
    <div class="spread" style="font-size:14px;margin-top:6px"><span class="mute">Progress</span><span class="num">${N(have)} / ${N(q.need)}</span></div><div class="bar"><i style="width:${(have / q.need * 100).toFixed(1)}%"></i></div>
    <div class="row" style="margin-top:8px">${done ? `<button class="sm pri" data-act="claimq" data-arg="${i}">Claim reward</button>` : `<button class="sm" data-act="qgo" data-arg="${i}">Go</button>`}<button class="sm ghost" data-act="dropq" data-arg="${i}">Drop</button></div></div>`;
}
function tabQuests() {
  const rid = ch.loc, r = REGION_BY[rid], here = !ch.travel, offers = here && ch.quest.done ? boardOffers(rid) : null;
  const rw = k => { const g = scaled(ch, k === 'weekly' ? BOARD.weeklyGold : BOARD.dailyGold, r.lvl), sh = k === 'weekly' ? BOARD.weeklyShards : BOARD.dailyShards, el = ITEMS[`elixir_${REGION_STORY[rid][0].toLowerCase()}_${k === 'weekly' ? 1 : 0}`]; return `${N(g)} gold · ${sh} Thousandium · ${k === 'weekly' ? esc(el.name) : '20% chance of ' + esc(el.name)}`; };
  const offer = o => { const taken = ch.board.taken[o.oid]; return `<div class="card offer ${taken ? 'taken' : ''}"><div class="spread"><b>${esc(o.label)}</b><span class="chip">${o.kind === 'weekly' ? 'Weekly' : 'Daily'}</span></div><p class="mute" style="margin:4px 0 8px;font-size:14px">Reward: ${rw(o.kind)}</p>${taken ? '<span class="mute">Accepted</span>' : `<button class="sm pri" data-act="acceptq" data-arg="${o.oid}">Accept</button>`}</div>`; };
  const S = REGION_STORY[rid], st = ch.story[rid] || 0;
  const story = S && ch.visited[rid] ? [1, 2, 3].map(i => { const done = st >= i, cur = st === i - 1, g = cur ? storyGoal(rid, i - 1) : null;
    return `<div class="qstep ${done ? 'done' : cur ? 'cur' : ''}"><span>${done ? '✓' : i}</span><div><b>${esc(S[i][0])}</b>${done || cur ? `<p style="margin:2px 0;font-size:14px">${esc(S[i][1])}</p>` : ''}${cur ? `<div class="spread" style="font-size:14px"><span>${esc(g.label)}</span><span class="mute num">${g.pctMode ? pct(g.have) + ' / ' + pct(g.need) : N(Math.min(g.have, g.need)) + ' / ' + N(g.need)}</span></div><div class="bar"><i style="width:${Math.min(100, g.have / g.need * 100).toFixed(1)}%"></i></div>${storyGoBtn(rid, i - 1)}` : ''}</div></div>`; }).join('') : '';
  const allStories = REGIONS.filter(x => !x.secret).map(x => `<span class="chip ${(ch.story[x.id] || 0) >= 3 ? 'on' : ''}">${esc(x.name)} ${ch.visited[x.id] ? (ch.story[x.id] || 0) + '/3' : '???'}</span>`).join('');
  const act = ch.qactive.map((q, i) => q.kind === 'story' ? '' : questRow(q, i)).join('');
  return `<div class="spread"><h2>Quests</h2><span class="chip">Thousandium <b class="gold">${N(account.shards)}</b></span></div>
    ${!ch.quest.done ? `<div class="card" style="margin-top:12px">${tutorialHtml()}</div>` : ''}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));margin-top:14px;align-items:start">
      <div><h3 style="margin-bottom:8px">Active (${ch.qactive.length}/${BOARD.maxActive})</h3><div class="grid">${act || '<p class="mute">No board quests accepted. Pick some from the board.</p>'}</div></div>
      <div><h3 style="margin-bottom:4px">${here ? esc(r.town) + ' quest board' : 'Quest board'}</h3><p class="mute" style="margin:0 0 8px;font-size:14px">${!ch.quest.done ? 'Opens after the tutorial.' : here ? 'New dailies every day, new weeklies every Monday. Each town has its own board.' : 'You are on the road.'}</p>
        ${offers ? `<div class="grid">${offers.daily.map(offer).join('')}${offers.weekly.map(offer).join('')}</div>` : ''}</div></div>
    ${story ? `<div class="card" style="margin-top:14px"><div class="spread"><h3>${esc(r.name)} story</h3><span class="mute">Each chapter: +${STORY_REWARD.stat} ${S[0]} permanently</span></div><div class="grid" style="gap:6px;margin-top:8px">${story}</div></div>` : ''}
    <div class="card" style="margin-top:14px"><h3>Region stories</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Each region has a 3-part story that starts when you first arrive and finish the tutorial.</p><div class="row" style="gap:6px">${allStories}</div></div>
    ${ch.quest.done ? `<details style="margin-top:14px"><summary>Tutorial (complete)</summary><div style="margin-top:8px">${tutorialHtml()}</div></details>` : ''}`;
}
function tabTraining() {
  const d = D('training');
  return `<div class="spread"><h2>Training</h2><span class="chip">Level <b data-live="slvl:training"></b></span></div>
    <p class="mute">Slow, steady and permanent. Each session adds a sliver of a stat; you can gain up to ${TRAIN_CFG.dailyCap} points per stat per day (resets at midnight). Uses 1 stamina, like any action.</p>
    <div class="row" style="gap:6px;margin-top:8px"><button class="pri" data-act="trainall">Train all stats</button><span class="mute" style="font-size:14px">Starts every stat that isn’t done for today, as far as your stamina goes.</span></div>
    <div class="cols" style="margin-top:12px">${TRAINS.map(t => { const g = ch.trainDay.gained[t.stat] || 0, run = ch.actions.find(a => a.res === t.id), full = g >= TRAIN_CFG.dailyCap - 1e-9;
      return `<div class="card ore ${run ? 'running' : ''}"><div class="spread"><b style="font-size:18px">${esc(t.name)}</b>${tierBadge(ch.prof[t.id] || 0)}</div><div class="mute" style="font-size:14px">${esc(t.desc)}</div>
        <div class="spread" style="font-size:14px"><span>Today: +${g.toFixed(2)} ${t.stat}</span><span class="mute">cap ${TRAIN_CFG.dailyCap}</span></div><div class="bar"><i style="width:${(g / TRAIN_CFG.dailyCap * 100).toFixed(1)}%"></i></div>
        <div class="kv"><span>Per session</span><span data-live="time:${t.id}"></span><span>Gain each</span><span>+${(TRAIN_CFG.perCompletion * (1 + d.pool)).toFixed(3)} ${t.stat}</span><span>Trained in total</span><span>+${Math.floor(ch.trained[t.stat] || 0)} ${t.stat}</span></div>
        ${run ? `<button data-act="stop" data-arg="${t.id}">Stop</button>` : `<button class="${full ? '' : 'pri'}" data-act="start" data-arg="${t.id}" ${full ? 'disabled' : ''}>${full ? 'Done for today' : 'Train ' + t.stat}</button>`}</div>`; }).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>Elixirs of Growth</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Permanent stat potions. Each stat can take up to ${ELIXIR_CAP} points from elixirs, with smaller gains as you approach the cap. Brew them in Alchemy, find Mythic ones on region bosses, or trade Thousandium at the shop.</p>
      <div class="kv">${STAT_IDS.map(s => `<span>${s}</span><span>${(ch.elixirs[s] || 0).toFixed(1)} / ${ELIXIR_CAP} · next lesser +${elixirGain(s, 1).toFixed(2)}</span>`).join('')}</div></div>`;
}
// ---------- Commands ----------
function sell(key, q) {
  const have = ch.inv[key] || 0, n = q === 'all' ? have : Math.min(have, 1); if (!n) return 0;
  return sellN(key, n);
}
function drink(key) {
  const it = ITEMS[key], now = Date.now();
  if (it.type === 'food' && !Object.keys(it.fx || {}).length) { const mh = maxHP(); takeItem(key, 1); ch.hp = Math.min(mh, (ch.hp == null ? mh : ch.hp) + it.heal); ch.counters.potions++; addLog('sys', `Ate ${it.name}: +${it.heal} HP.`); checkProgress(); renderMain(); return; }
  const rule = buffRule(key, now), cur = rule.cur;
  if (rule.mode === 'blocked') { toast(`${esc(cur.name)} is stronger and still active. A weaker ${POTION_CATS[it.cat]} buff can\u2019t be added to it.`); return; }
  if (rule.mode === 'replace' && potStrength(ITEMS[cur.id]) < potStrength(it)) addLog('sys', `${it.name} replaced the weaker ${cur.name}.`);
  takeItem(key, 1); ch.potions[it.cat] = { id: key, until: Math.min(now + 24 * 3600000, (rule.mode === 'stack' ? cur.until : now) + it.mins * 60000) }; ch.counters.potions++; if (it.heal) { const mh = maxHP(); ch.hp = Math.min(mh, (ch.hp == null ? mh : ch.hp) + it.heal); }
  addLog('lucky', `${it.type === 'food' ? 'Ate' : 'Drank'} ${it.name}: ${it.desc}`); toast(`<b>${esc(it.name)}</b> active for ${fmtTime((ch.potions[it.cat].until - now) / 1000)}`, 'gold'); checkProgress(); renderMain(); renderTop(); renderActions();
}
function equip(key) {
  const it = ITEM(key), need = it.slot === 'tool' ? ch.skills[it.toolSkill].level : gateLevel(ch);
  if (it.lvl > need) { toast(`${esc(it.name)} needs ${it.slot === 'tool' ? SKILLS[it.toolSkill].name + ' ' : ''}level ${it.lvl}.`); return; }
  let where, slot;
  if (it.slot === 'tool') { where = ch.equip.tools; slot = it.toolSkill; }
  else { where = ch.equip.slots; slot = it.slot === 'ring' ? (!where.ring1 ? 'ring1' : !where.ring2 ? 'ring2' : 'ring1') : it.slot; }
  const old = where[slot]; takeItem(key, 1); where[slot] = key; if (old) addItem(old, 1, true);
  if (it.slot === 'tool' && it.speed > 0.03) ch.counters.toolsBought = Math.max(1, ch.counters.toolsBought);
  addLog('sys', `Equipped ${it.name}.`); fitStamina(); checkProgress(); renderMain(); renderActions();
}
function upgradeModal(key) {
  const it = ITEM(key), E = BALANCE.enchant, lvl = it.plus, stone = E.stoneFor[lvl], gold = enchantGold(it), d = D();
  const chance = Math.min(1, E.success[lvl] + d.wisAbove * E.wisBonus + (d.M.enchant || 0)), next = ITEM(withPlus(key, lvl + 1)), have = ch.inv[stone] || 0;
  modal(`<h3>Upgrade ${esc(it.name)}</h3><p class="mute">${esc(statLine(it))}<br>→ <span class="up">${esc(statLine(next))}</span></p>
    <div class="kv" style="font-size:16px"><span>Success chance</span><span><b>${pct(chance)}</b></span><span>Cost</span><span>1 ${esc(ITEMS[stone].name)} (have ${have}) + ${N(gold)}g</span><span>On failure</span><span>${lvl >= E.dropFrom ? '<span class="bad">drops to +' + (lvl - 1) + '</span>' : 'materials lost, item safe'}</span></div>
    <p class="mute" style="font-size:14px">Enchant stones come from Enchanting. Wisdom improves the odds.</p>
    <div class="row" style="margin-top:10px"><button class="pri" data-act="doupgrade" data-arg="${esc(key)}" ${have && ch.gold >= gold ? '' : 'disabled'}>Upgrade</button><button data-act="close">Cancel</button></div>`);
}
function doUpgrade(key) {
  const it = ITEM(key), E = BALANCE.enchant, lvl = it.plus, stone = E.stoneFor[lvl], gold = enchantGold(it);
  if (!ch.inv[key] || !ch.inv[stone] || ch.gold < gold) return;
  takeItem(stone, 1); ch.gold -= gold;
  const chance = Math.min(1, E.success[lvl] + D().wisAbove * E.wisBonus + (D().M.enchant || 0));
  if (rng() < chance) { takeItem(key, 1); const nk = withPlus(key, lvl + 1); addItem(nk, 1, true); ch.counters.upgrades++; ch.counters.maxPlus = Math.max(ch.counters.maxPlus, lvl + 1); addLog('lucky', `Upgrade succeeded: ${ITEM(nk).name}`); toast(`<b>Success!</b> ${esc(ITEM(nk).name)}`, 'gold'); chime(784, 1175); closeModal(); if (lvl + 1 < 10) upgradeModal(nk); }
  else if (lvl >= E.dropFrom) { takeItem(key, 1); const nk = withPlus(key, lvl - 1); addItem(nk, 1, true); addLog('sys', `Upgrade failed: ${it.name} dropped to +${lvl - 1}.`); toast(`Upgrade failed. ${esc(it.name)} dropped to +${lvl - 1}.`); closeModal(); }
  else { addLog('sys', `Upgrade failed: ${it.name} is unharmed.`); toast(`Upgrade failed. The stone crumbles; ${esc(it.name)} is fine.`); upgradeModal(key); }
  checkProgress(); renderMain();
}
function buy(key, n) {
  if (!(n > 0)) return;
  const p = shopPrice(key, D()) * n; if (ch.gold < p) return;
  if (!addItem(key, n)) { toast('Inventory full.'); return; }
  ch.gold -= p; ch.counters.shopBuys++; if (ITEM(key).slot === 'tool') ch.counters.toolsBought++;
  addLog('sys', `Bought ${n > 1 ? n + ' ' : ''}${ITEM(key).name} for ${N(p)} gold.`); toast(`Bought <b>${esc(ITEM(key).name)}</b>${n > 1 ? ' ×' + n : ''}${ITEM(key).gear ? '. Equip it from your inventory.' : ''}`); checkProgress(); renderMain();
}
function respec() {
  const cost = ch.freeRespecs > 0 ? 0 : BALANCE.respec.baseCost * Math.pow(BALANCE.respec.growth, ch.respecs);
  if (ch.gold < cost) { toast(`Respec costs ${N(cost)} gold.`); return; }
  modal(`<h3>Respec stats?</h3><p>All ${Object.values(ch.alloc).reduce((s, v) => s + v, 0)} allocated points return to your pool. ${cost ? `Costs ${N(cost)} gold; the next one costs double.` : 'This one is free.'}</p><div class="row"><button class="pri" data-act="dorespec">Respec</button><button data-act="close">Cancel</button></div>`);
}
function bankAmt() { const v = Math.floor(+($('#bankamt') || {}).value || 0); return v > 0 ? v : 0; }
function settleSavings() { const now = Date.now(); ch.savings = { bal: savingsNow(ch, now), t: now }; }
const HANDLERS = {
  ...CLOUD_HANDLERS,
  ...SOCIAL_HANDLERS,
  ...AUCTION_HANDLERS,
  ...SECRET_HANDLERS,
  ...GUILD_HANDLERS,
  ...PRESTIGE_HANDLERS,
  ...LORE_HANDLERS,
  ...PROFILE_HANDLERS,
  ...FASHION_HANDLERS,
  ...ARENA_HANDLERS,
  ...QOL_HANDLERS,
  ...ANIM_HANDLERS,
  ...LOOT_HANDLERS,
  ...FEEDBACK_HANDLERS,
  ...HOME_HANDLERS,
  ...I18N_HANDLERS,
  ...GAMES_HANDLERS,
  ...CASINO_HANDLERS,
  ...GATE_HANDLERS,
  ...SHOWCASE_HANDLERS,
  ...EXTRA_HANDLERS,
  incubate: k => { incubate(k); renderMain(); },
  hatchnow: i => { checkPets(); renderMain(); },
  petslot: a => { const [u, s] = a.split('|'); setPetSlot(u, s); renderMain(); },
  petfeed: a => { const [u, k] = a.split('|'); feedPet(u, k); renderMain(); },
  petfeedall: () => { feedAll(); renderMain(); },
  petsel: u => { petSel = u; renderMain(); },
  daycare: a => { const [u, h] = a.split('|'); sendDaycare(u, +h); renderMain(); },
  breedpick: a => { const [i, u] = a.split('|'); breedSel[+i] = u || null; renderMain(); },
  breed: () => { breed(breedSel[0], breedSel[1]); breedSel = [null, null]; renderMain(); },
  buyincub: () => { buyIncub(); renderMain(); },
  buycos: a => { const [k, id] = a.split('|'); buyCosmetic(k, id); renderMain(); },
  dress: a => { const [u, k, id] = a.split('|'); dressPet(u, k, id); renderMain(); },
  petrename: u => { const p = petById(ch, u); modal(`<h3>Rename ${esc(petName(p))}</h3><input id="petname" maxlength="16" value="${esc(p.name || '')}" aria-label="Pet name"><div class="row" style="margin-top:12px"><button class="pri" data-act="dorename" data-arg="${u}">Save</button><button data-act="close">Cancel</button></div>`); },
  dorename: u => { renamePet(u, $('#petname').value); closeModal(); renderMain(); },
  petrelease: u => { const p = petById(ch, u); modal(`<h3>Release ${esc(petName(p))}?</h3><p>They will return to the wild. Your collection keeps the species.</p><div class="row" style="margin-top:12px"><button class="pri" data-act="dorelease" data-arg="${u}">Release</button><button data-act="close">Keep</button></div>`); },
  dorelease: u => { releasePet(u); petSel = null; closeModal(); renderMain(); },
  colltab: t => { collTab = t; renderMain(); },
  close: () => closeModal(),
  new: i => startWizard(+i),
  play: i => enterGame(+i),
  toselect: () => { save(); renderSelect(); },
  delete: i => { const c = account.slots[+i]; modal(`<h3>Delete ${esc(c.name)}?</h3><p>This cannot be undone. Type the name to confirm.</p><input id="delname" autocomplete="off" aria-label="Character name"><div class="row" style="margin-top:12px"><button class="pri" data-act="dodelete" data-arg="${i}">Delete forever</button><button data-act="close">Cancel</button></div>`); },
  dodelete: i => { const c = account.slots[+i]; if (($('#delname').value || '').trim() !== c.name) { $('#delname').style.borderColor = 'var(--bad)'; return; } account.slots[+i] = null; if (account.activeSlot === +i) account.activeSlot = null; save(); closeModal(); renderSelect(); },
  wzset: a => { const [k, v] = a.split('|'); wz[k] = v; renderWizard(); },
  wzback: () => { wz.step--; renderWizard(); },
  wznext: () => {
    if (wz.step === 0) { const e = nameError(wz.name); if (e) { wz.err = e; renderWizard(); $('#wzname').focus(); return; } }
    if (wz.step < WZ_STEPS.length - 1) { wz.step++; renderWizard(); window.scrollTo(0, 0); return; }
    const e = nameError(wz.name); if (e) { wz.step = 0; wz.err = e; renderWizard(); return; }
    account.slots[wz.slot] = newCharacter(wz); save(); enterGame(wz.slot); secretName(wz.name);
    toast(`Welcome, <b>${esc(account.slots[wz.slot].name)}</b>. Start with Stone in Mining.`);
  },
  tab: t => { tab = t; pend = {}; invShowAll = false; if (SKILLS[t]) profSkill = charSkill = t; renderMain(); window.scrollTo({ top: 0 }); },
  start: id => { startAction(id); renderMain(); renderActions(); },
  stop: id => { stopAction(id); renderMain(); renderActions(); },
  swap: a => { const [out, inn] = a.split('|'); closeModal(); stopAction(out); startAction(inn); renderMain(); renderActions(); },
  sell: a => { const i = a.lastIndexOf('|'), key = a.slice(0, i), q = a.slice(i + 1), n = q === 'all' ? ch.inv[key] : 1, g = sell(key, q); if (g || n) addLog('sys', `Sold ${N(n)} ${ITEM(key).name} for ${N(g)} gold.`); checkProgress(); renderMain(); },
  invmore: () => { invShowAll = true; renderMain(); },
  selljunk: () => { let g = 0, n = 0; for (const k of Object.keys(ch.inv)) if (ITEM(k).type === 'junk') { n += ch.inv[k]; g += sell(k, 'all'); } addLog('sys', n ? `Sold ${n} junk for ${N(g)} gold.` : 'No junk to sell.'); checkProgress(); renderMain(); },
  drink, equip,
  use: key => { if (key === 'reforge_destiny') { reforgeModal(); return; }
    if (key === 'satchel') { takeItem(key, 1); ch.invSlots += 5; addLog('sys', 'Satchel of Holding: +5 inventory slots.'); toast('+5 inventory slots', 'gold'); renderMain(); } },
  upgrade: upgradeModal, doupgrade: doUpgrade,
  unequip: a => { const [w, s] = a.split('|'), where = w === 't' ? ch.equip.tools : ch.equip.slots; if (!where[s]) return; if (!addItem(where[s], 1)) { toast('Inventory full.'); return; } where[s] = null; fitStamina(); renderMain(); renderActions(); },
  buy: a => { const i = a.lastIndexOf('|'); buy(a.slice(0, i), +a.slice(i + 1)); },
  mbuy: i => { const o = merchantOffers().find(x => x.i === +i), p = Math.ceil(o.price * (1 - D().discount)); if (!o || !o.left || ch.gold < p) return; if (!addItem(o.key, 1)) { toast('Inventory full.'); return; } ch.gold -= p; ch.merchant.bought[o.i] = (ch.merchant.bought[o.i] || 0) + 1; ch.counters.merchantBuys++; addLog('lucky', `Bought ${ITEM(o.key).name} from the travelling merchant.`); checkProgress(); renderMain(); },
  deposit: key => { if (!ch.bank[key] && bankUsed() >= ch.bankSlots) { toast('Bank full. Buy more bank slots.'); return; } ch.bank[key] = (ch.bank[key] || 0) + ch.inv[key]; delete ch.inv[key]; renderMain(); },
  withdraw: key => { if (!addItem(key, ch.bank[key])) { toast('Inventory full.'); return; } delete ch.bank[key]; renderMain(); },
  savein: () => { const v = Math.min(bankAmt(), Math.floor(ch.gold)); if (!v) return; settleSavings(); ch.savings.bal += v; ch.gold -= v; checkProgress(); renderMain(); },
  saveout: () => { settleSavings(); const v = Math.min(bankAmt(), Math.floor(ch.savings.bal)); if (!v) return; ch.savings.bal -= v; ch.gold += v; renderMain(); },
  saveall: () => { settleSavings(); ch.savings.bal += Math.floor(ch.gold); ch.gold -= Math.floor(ch.gold); checkProgress(); renderMain(); },
  takeall: () => { settleSavings(); const v = Math.floor(ch.savings.bal); ch.savings.bal -= v; ch.gold += v; renderMain(); },
  invup: () => { const c = invUpCost(); if (!c || ch.gold < c) return; ch.gold -= c; ch.invUps++; ch.invSlots += BALANCE.storage.invUp; renderMain(); },
  bankup: () => { const c = bankUpCost(); if (!c || ch.gold < c) return; ch.gold -= c; ch.bankUps++; ch.bankSlots += BALANCE.storage.bankUp; renderMain(); },
  invf: v => { invF = v; renderMain(); },
  ccat: a => { const [s, c] = a.split('|'); craftCat[s] = c; renderMain(); },
  showlocked: () => { showLocked = !showLocked; renderMain(); },
  profskill: s => { profSkill = s; renderMain(); },
  charskill: s => { charSkill = s; renderMain(); },
  pend: a => { const [s, v] = a.split('|'); const spent = Object.values(pend).reduce((x, y) => x + y, 0); const add = Math.max(-(pend[s] || 0), Math.min(+v, ch.unspent - spent)); pend[s] = (pend[s] || 0) + add; if (!pend[s]) delete pend[s]; renderMain(); },
  resetpend: () => { pend = {}; renderMain(); },
  apply: () => { let n = 0; for (const [s, v] of Object.entries(pend)) { ch.alloc[s] = (ch.alloc[s] || 0) + v; n += v; } ch.unspent -= n; pend = {}; addLog('level', `Allocated ${n} stat points.`); renderMain(); renderActions(); },
  respec,
  dorespec: () => { const cost = ch.freeRespecs > 0 ? 0 : BALANCE.respec.baseCost * Math.pow(BALANCE.respec.growth, ch.respecs); if (cost) { ch.gold -= cost; ch.respecs++; } else ch.freeRespecs--; const n = Object.values(ch.alloc).reduce((s, v) => s + v, 0); ch.unspent += n; ch.alloc = {}; closeModal(); fitStamina(); addLog('sys', `Respec: ${n} points returned.`); renderMain(); renderActions(); },
  hourglass: () => { const c = hgCost(); if (!c || ch.gold < c) return; ch.gold -= c; ch.offlineUpgrades++; addLog('sys', `Offline cap raised to ${D().offlineH} hours.`); renderMain(); },
  achcat: c => { achCat = c; renderMain(); },
  promote: i => { promote(+i); renderMain(); renderSide(); },
  recruit: () => { recruitCompanion(); renderMain(); },
  elixir: k => { drinkElixir(k); renderMain(); },
  acceptq: oid => { const o = (() => { const b = boardOffers(ch.loc); return [...b.daily, ...b.weekly].find(x => x.oid === oid); })(); if (o) acceptQuest(o); renderMain(); },
  claimq: i => { claimQuest(+i); renderMain(); renderNav(); },
  dropq: i => { const q = ch.qactive[+i]; if (q) { ch.qactive.splice(+i, 1); addLog('sys', `Dropped: ${q.label}.`); } renderMain(); },
  buyshard: i => { buyShard(+i); renderMain(); },
  cequip: a => { const i = a.indexOf('|'); compEquip(a.slice(0, i), a.slice(i + 1)); renderMain(); },
  cunequip: s2 => { compEquip(s2, null); renderMain(); },
  clearn: i => { compLearn(+i); renderMain(); },
  gift: k => { giveGift(k); renderMain(); },
  feed: a => { const i = a.lastIndexOf('|'), k = a.slice(0, i), q = a.slice(i + 1); feedGrowth(k, q === 'all' ? ch.inv[k] : 1); renderMain(); },
  askascend: () => modal(`<h3>Ascend to A${ch.ascension + 1}?</h3><p>Your character level returns to 1. Everything else stays: stats you allocated, skill levels, proficiency, talents, items, gold and class tier. Region and gear requirements treat you as level ${BALANCE.ascension.needLevel}.</p><p class="verd">Permanent: +${pct(BALANCE.ascension.xp)} XP, +${pct(BALANCE.ascension.yield)} yield, +${pct(BALANCE.ascension.power)} attack and HP per ascension.</p><div class="row"><button class="pri" data-act="doascend">Ascend</button><button data-act="close">Not yet</button></div>`),
  doascend: () => { closeModal(); ascend(); renderMain(); renderSide(); renderTop(); },
  autosell: a => { const [k, v] = a.split('|'); if (v === 'off') delete ch.autoSell[k]; else ch.autoSell[k] = +v; autoSellTick(false); renderMain(); },
  autojunk: () => { ch.autoSellJunk = !ch.autoSellJunk; autoSellTick(false); renderMain(); },
  learn: id => { learn(id); renderMain(); renderActions(); },
  ttree: t => { talentTree = t; renderMain(); },
  careerskill: s2 => { careerSkill = s2; renderMain(); },
  respectal: () => { const c = treeRespecCost(); modal(`<h3>Reset all talents?</h3><p>Every point returns to you. ${c ? `Costs ${N(c)} gold; the next reset costs double.` : 'This one is free.'}</p><div class="row"><button class="pri" data-act="dorespectal">Reset</button><button data-act="close">Cancel</button></div>`); },
  dorespectal: () => { closeModal(); respecTalents(); renderMain(); renderActions(); },
  setsec: () => { const v = $('#secsel').value; setSecondary(v); renderMain(); },
  buyreforge: () => { buyReforge(); renderMain(); },
  doreforge: a => { const [c, sp] = a.split('|'); closeModal(); reforge(c, +sp); renderMain(); renderSide(); renderActions(); },
  selregion: r => { mapSel = r; renderMain(); },
  goregion: r => { mapSel = r; tab = 'map'; renderMain(); window.scrollTo({ top: 0 }); },
  travel: r => { startTravel(r, false); renderMain(); renderActions(); renderTop(); },
  fasttravel: r => { startTravel(r, true); renderMain(); renderActions(); renderTop(); },
  questgo: t => { tab = t; if (SKILLS[t]) profSkill = charSkill = t; renderMain(); window.scrollTo({ top: 0 }); },
  pin: id => { if (ch.pins.includes(id)) ch.pins = ch.pins.filter(x => x !== id); else if (ch.pins.length < 3) ch.pins.push(id); else toast('You can pin three. Unpin one first.'); renderMain(); },
  set: a => { const [k, v] = a.split('|'); account.settings[k] = v === 'true' ? true : v === 'false' ? false : v; applySettings(); save(); renderMain(); renderActions(); },
  savenow: () => { save(); $('#savemsg').textContent = 'Saved at ' + new Date().toLocaleTimeString(); },
  copysave: async () => { save(); const code = await makeSaveCode();
    const show = () => modal(`<h3>Save code</h3><p class="mute">${N(code.length)} characters. Copy it and keep it safe.</p><textarea style="width:100%;height:120px" readonly onclick="this.select()">${esc(code)}</textarea><div class="row" style="margin-top:10px">${navigator.share ? '<button data-act="sharesave">Share…</button>' : ''}<button data-act="dlsave">Save as file</button><button data-act="close">Done</button></div>`);
    try { await navigator.clipboard.writeText(code); $('#savemsg').textContent = `Save code copied (${N(code.length)} characters).`; } catch (e) { show(); } },
  sharesave: async () => { try { await navigator.share({ title: 'Thousandfold save', text: await makeSaveCode() }); } catch (e) { } },
  dlsave: async () => { const code = await makeSaveCode(), filename = `thousandfold-save-${new Date().toISOString().slice(0, 10)}.txt`;
    let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { }
    if (dl) { try { await dl.save({ filename, data: code }); const m = $('#savemsg'); if (m) m.textContent = 'Save file offered: ' + filename; } catch (e) { toast('The save file was not downloaded.'); } return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); },
  loadsavefile: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.txt,text/plain'; i.onchange = async () => { const f = i.files[0]; if (!f) return; $('#imp').value = (await f.text()).trim(); }; i.click(); },
  importsave: () => modal(`<h3>Import save code</h3><p class="mute">Paste a save code (new short codes and old long ones both work), or load a saved file. This replaces every character in this browser.</p><textarea id="imp" style="width:100%;height:120px" aria-label="Save code"></textarea><div class="err" id="imperr"></div><div class="row"><button class="pri" data-act="doimport">Import</button><button data-act="loadsavefile">Load file…</button><button data-act="close">Cancel</button></div>`),
  doimport: async () => { try { const a = await readSaveCode($('#imp').value); if (!a || !Array.isArray(a.slots)) throw 0; account = a; account.activeSlot = null; save(); closeModal(); applySettings(); renderSelect(); } catch (e) { $('#imperr').textContent = 'That code could not be read. Make sure you copied all of it.'; } },
  discgo: t => { const id = { Achievements: 'ach', Combat: 'combat', Arsenal: 'arsenal', Pets: 'pets', Inventory: 'inv' }[t]; const d = $('#disc'); if (d) d.remove(); if (id) HANDLERS.tab(id); setTimeout(showDiscover, 300); },
  discall: () => { discQ = []; const d = $('#disc'); if (d) d.remove(); },
  discclose: () => { const d = $('#disc'); if (d) d.remove(); showDiscover(); },
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = HANDLERS[b.dataset.act]; if (f) f(b.dataset.arg); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal')) closeModal(); });
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ---------- Boot ----------
function start(data) {
  if (booted) return; booted = true;
  account = (data && data.account) || loadLocal() || newAccount();
  account.settings = Object.assign(newAccount().settings, account.settings || {});
  if (!account.v || account.v < 2) { if (account.settings.theme === 'auto') account.settings.theme = 'dark'; account.v = 2; }
  applySettings();
  if (account.activeSlot != null && account.slots[account.activeSlot]) enterGame(account.activeSlot); else renderSelect();
  requestAnimationFrame(frame);
  setTimeout(() => cloudInit().catch(() => { }).then(() => profileFromUrl()), 0); setInterval(() => { try { cloudTick(); } catch (e) { } }, 30000);
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot(() => { if (ch) ch.last = Date.now(); return { account }; }); } catch (e) { }
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});

// ---------- Pets (Phase 8) ----------
let petSel = null, breedSel = [null, null], collTab = 'pets';
function petGlyph(sp, size, p) {
  return pxPet(sp, size, p);
}
const eggGlyph = (key, size) => pxEgg(key, size);
const tagChips = S => S.tags.map(t => `<span class="chip" style="font-size:12px;border-color:${PET_TAG_COLOR[t]}">${t}</span>`).join(' ');
function petCard(p, slot) {
  const S = SP(p.sp), sel = petSel === p.uid, away = ch.daycare.some(d => d.uid === p.uid), cost = petCost(p.lvl);
  return `<button class="petcard ${sel ? 'on' : ''} ${slot ? 'slotted' : ''}" data-act="petsel" data-arg="${p.uid}">${petGlyph(p.sp, 56, p)}<div style="text-align:left;min-width:0"><b>${esc(petName(p))}</b>${slot ? ` <span class="chip" style="font-size:11px">${slot}</span>` : ''}${away ? ' <span class="chip" style="font-size:11px">Daycare</span>' : ''}<div class="mute" style="font-size:12px">${PET_RARITY[S.rarity]} ${PET_SIZES[S.size]} · Lv ${p.lvl}</div>
    <div class="bar xp" style="height:4px;margin-top:3px"><i style="width:${p.lvl >= PET_CFG.maxLevel ? 100 : Math.min(100, p.xp / cost * 100).toFixed(1)}%"></i></div><div class="bar" style="height:4px;margin-top:2px" title="Hunger"><i style="width:${p.hunger}%;background:${p.hunger < 20 ? 'var(--bad)' : '#8bc34a'}"></i></div></div></button>`;
}
function petDetail(p) {
  const S = SP(p.sp), slot = ch.petActive === p.uid ? 'active' : ch.petSupport.includes(p.uid) ? 'support' : null, away = ch.daycare.some(d => d.uid === p.uid);
  const m = petMult(ch, p, slot === 'support'), pers = PERSONALITIES[p.pers], foods = Object.keys(ch.inv).filter(k => ITEM(k) && ITEM(k).type === 'food').slice(0, 6);
  const ev = S.evolve ? `Evolves into <b>${ch.petDex[S.evolve[0]] ? esc(SP(S.evolve[0]).name) : '???'}</b> at level ${S.evolve[1]}.` : 'Final form.';
  return `<div class="card" style="margin-top:12px"><div class="row" style="align-items:flex-start">${petGlyph(p.sp, 96, p)}<div style="flex:1;min-width:200px">
      <div class="spread"><h3>${esc(petName(p))}${p.name ? ` <span class="mute">${esc(S.name)}</span>` : ''}</h3><span class="row" style="gap:4px"><button class="sm ghost" data-act="petrename" data-arg="${p.uid}">Rename</button><button class="sm ghost" data-act="petrelease" data-arg="${p.uid}">Release</button></span></div>
      <div class="row" style="gap:4px;margin:4px 0">${tagChips(S)} <span class="chip" style="font-size:12px">${PET_RARITY[S.rarity]}</span> <span class="chip" style="font-size:12px">${PET_SIZES[S.size]}${isMount(p) ? ' · Mount' : ''}</span> <span class="chip" style="font-size:12px">${esc(pers[0])}</span></div>
      <p class="mute" style="margin:2px 0 6px;font-size:14px">${esc(S.desc)} ${ev}</p>
      <div class="spread" style="font-size:14px"><span>Level ${p.lvl} / ${PET_CFG.maxLevel}</span><span class="mute num">${p.lvl >= PET_CFG.maxLevel ? 'Max' : `${N(p.xp)} / ${N(petCost(p.lvl))} XP`}</span></div>
      <div class="spread" style="font-size:14px;margin-top:4px"><span>Hunger ${Math.round(p.hunger)} · Happiness ${Math.round(p.happy)}</span><span class="mute">Mood ×${petMood(p).toFixed(2)}${p.hunger < 20 ? ' <span class="bad">(hungry!)</span>' : ''}</span></div>
      <p style="margin:8px 0 0;font-size:14px"><b>Boost${slot === 'support' ? ' (support)' : ''}:</b> ${esc(modsText(S.boost, slot === 'support' ? m : petMult(ch, p, false)))}</p>
      <p style="margin:2px 0 0;font-size:14px"><b>In combat (active only):</b> ${esc(modsText(S.ability, petMult(ch, p, false)))}. <b>${esc(pers[0])}:</b> ${esc(modsText(pers[1]))}${isMount(p) ? `. <b>Mount:</b> +${pct(S.tags.includes('Flying') ? PET_CFG.mountFlying : PET_CFG.mountGround)} travel speed` : ''}.</p>
      <div class="row" style="gap:6px;margin-top:10px">${away ? '<span class="mute">Away at daycare.</span>' : `<button class="sm ${slot === 'active' ? '' : 'pri'}" data-act="petslot" data-arg="${p.uid}|active" ${slot === 'active' ? 'disabled' : ''}>Make active</button><button class="sm" data-act="petslot" data-arg="${p.uid}|support" ${slot === 'support' ? 'disabled' : ''}>Support</button>${slot ? `<button class="sm ghost" data-act="petslot" data-arg="${p.uid}|none">Unslot</button>` : PET_CFG.daycareHours.map(h => `<button class="sm" data-act="daycare" data-arg="${p.uid}|${h}" ${ch.daycare.length < PET_CFG.daycareSlots ? '' : 'disabled'}>Daycare ${h}h</button>`).join('')}`}</div>
      <div class="row" style="gap:4px;margin-top:8px">${foods.length ? foods.map(k => `<button class="chip" data-act="petfeed" data-arg="${p.uid}|${esc(k)}">${itemIcon(k, 16)} ${esc(ITEM(k).name)} (${N(ch.inv[k])})</button>`).join('') : '<span class="mute" style="font-size:13px">No food to feed them. Cook some, or buy it in the shop.</span>'}</div>
      ${(ch.cosmetics.hats.length || ch.cosmetics.auras.length) ? `<div class="row" style="gap:4px;margin-top:8px">${ch.cosmetics.hats.map(h => `<button class="chip ${p.hat === h ? 'on' : ''}" data-act="dress" data-arg="${p.uid}|hat|${h}">${esc(PET_HATS.find(x => x[0] === h)[1])}</button>`).join('')}${ch.cosmetics.auras.map(a => `<button class="chip ${p.aura === a ? 'on' : ''}" data-act="dress" data-arg="${p.uid}|aura|${a}">${esc(PET_AURAS.find(x => x[0] === a)[1])}</button>`).join('')}</div>` : ''}
    </div></div></div>`;
}
function tabPets() {
  const sl = supportSlots(ch), bl = ch.skills.beastmastery, lx = levelFromXp(bl.xp), eggs = Object.keys(ch.inv).filter(k => ITEM(k) && ITEM(k).type === 'egg');
  const nextSlot = SUPPORT_UNLOCK.find(l => bl.level < l);
  const incub = Array.from({ length: ch.incubSlots }, (_, i) => { const s = ch.incub[i]; if (!s) return `<div class="incub empty"><span class="mute">Empty incubator</span>${eggs.length ? `<div class="row" style="gap:4px;justify-content:center">${eggs.slice(0, 4).map(k => `<button class="chip" data-act="incubate" data-arg="${k}">${esc(ITEM(k).name)} (${ch.inv[k]})</button>`).join('')}</div>` : '<span class="mute" style="font-size:12px">No eggs. They drop from anything you do, rarely.</span>'}</div>`;
    const f = incubFrac(s), left = Math.max(0, s.mins * 60 - (Date.now() - s.start) / 1000);
    return `<div class="incub">${eggGlyph(s.egg, 48)}<b style="font-size:14px">${esc(ITEM(s.egg).name)}</b><div class="bar" style="width:100%"><i style="width:${(f * 100).toFixed(1)}%"></i></div><span class="mute" style="font-size:12px">${fmtTime(left)} or ${N(Math.max(0, s.need - s.actions))} actions</span></div>`; }).join('');
  const roster = [...ch.pets].sort((a, b) => (b.uid === ch.petActive) - (a.uid === ch.petActive) || ch.petSupport.includes(b.uid) - ch.petSupport.includes(a.uid) || SP(b.sp).rarity - SP(a.sp).rarity || b.lvl - a.lvl);
  const sel = petSel && petById(ch, petSel) ? petById(ch, petSel) : null;
  const combos = COMBOS.map(c => { const on = activeCombos(ch).includes(c), seen = ch.combosSeen[c.id]; return `<div class="prow"><div><b>${seen ? esc(c.name) : '???'}</b><div class="mute" style="font-size:13px">${seen ? esc(c.text) : 'Pair the right two kinds of pet to find out.'}</div></div>${on ? '<span class="chip on">Active</span>' : ''}</div>`; }).join('');
  const eligible = ch.pets.filter(p => p.lvl >= PET_CFG.breedLevel), hyb = breedSel[0] && breedSel[1] && breedSel[0] !== breedSel[1] ? hybridFor(petById(ch, breedSel[0]), petById(ch, breedSel[1])) : null;
  const pickRow = i => `<div class="row" style="gap:4px">${eligible.length ? eligible.map(p => `<button class="chip ${breedSel[i] === p.uid ? 'on' : ''}" data-act="breedpick" data-arg="${i}|${breedSel[i] === p.uid ? '' : p.uid}">${esc(petName(p))} ${SP(p.sp).tags.map(t => t[0]).join('')}</button>`).join('') : `<span class="mute" style="font-size:13px">No pets at level ${PET_CFG.breedLevel} yet.</span>`}</div>`;
  return `<div class="spread"><h2>Pets</h2><span class="chip">Beastmastery <b>${bl.level}</b></span></div>
    <div class="bar xp" style="margin:6px 0 2px"><i style="width:${lx.need ? (lx.into / lx.need * 100).toFixed(1) : 100}%"></i></div>
    <p class="mute" style="margin:0;font-size:14px">One active pet at full strength (it also fights beside you), and ${sl} support slot${sl === 1 ? '' : 's'} at ${pct(PET_CFG.supportMult)} strength${nextSlot ? `; the next opens at Beastmastery ${nextSlot}` : ''}${ch.cls === 'beastmaster' ? ' (Beastmaster: +1 slot, +25% strength)' : ''}. Pets earn ${pct(PET_CFG.activeXp)} of your XP when active, ${pct(PET_CFG.supportXp)} in support. Keep them fed: a hungry pet works at half strength.</p>
    <div class="card" style="margin-top:12px"><div class="spread"><h3>Incubators</h3>${incubCost() ? `<button class="sm ${ch.gold >= incubCost() ? 'pri' : ''}" data-act="buyincub" ${ch.gold >= incubCost() ? '' : 'disabled'}>Another incubator · ${N(incubCost())}g</button>` : '<span class="chip">Max</span>'}</div>
      <p class="mute" style="margin:4px 0 8px;font-size:14px">Eggs hatch after their time or after enough of your actions, whichever comes first. They keep going while you are offline.</p><div class="incubs">${incub}</div></div>
    ${ch.pets.length ? `<div class="spread" style="margin-top:14px"><h3>Your pets (${ch.pets.length})</h3><button class="sm" data-act="petfeedall">Feed slotted pets</button></div><div class="petgrid">${roster.map(p => petCard(p, p.uid === ch.petActive ? 'Active' : ch.petSupport.includes(p.uid) ? 'Support' : '')).join('')}</div>${sel ? petDetail(sel) : '<p class="mute">Pick a pet to see it up close.</p>'}` : `<div class="card" style="margin-top:12px"><p style="margin:0">No pets yet. Eggs turn up rarely from anything you do, from region bosses, weekly quests and the shop. Characters who finished the tutorial get a starter egg.</p></div>`}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));margin-top:14px;align-items:start">
      <div class="card"><h3>Daycare</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Send an unslotted pet away for 1, 4 or 8 hours. It comes back with pet XP and resources from the region it left. ${PET_CFG.daycareSlots} places.</p>
        ${ch.daycare.length ? ch.daycare.map(d => { const p = petById(ch, d.uid); return p ? `<div class="prow"><span>${esc(petName(p))} · ${d.hours}h</span><span class="mute num">${fmtTime(Math.max(0, (d.end - Date.now()) / 1000))}</span></div>` : ''; }).join('') : '<p class="mute" style="margin:0">Nobody away.</p>'}</div>
      <div class="card"><h3>Combos</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Some pairs of pets in your slots work together.</p><div class="grid" style="gap:6px">${combos}</div></div>
      <div class="card"><h3>Breeding</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Two pets of level ${PET_CFG.breedLevel}+ with the right mix of types can make a hybrid egg. Costs ${N(breedCost())}g, tires them out, and the nest needs ${PET_CFG.breedCooldownH} hours to rest.</p>
        ${pickRow(0)}<div style="height:6px"></div>${pickRow(1)}
        <div class="spread" style="margin-top:8px"><span class="mute" style="font-size:13px">${breedSel[0] && breedSel[1] ? (hyb ? `They could make a ${ch.petDex[hyb] ? esc(SP(hyb).name) : 'hybrid'} egg.` : 'No hybrid from this pair.') : 'Pick two pets.'}${Date.now() < ch.breedAt ? ` Nest resting: ${fmtTime((ch.breedAt - Date.now()) / 1000)}.` : ''}</span><button class="sm ${hyb ? 'pri' : ''}" data-act="breed" ${hyb && Date.now() >= ch.breedAt && ch.gold >= breedCost() ? '' : 'disabled'}>Breed</button></div></div>
      <div class="card"><h3>Wardrobe</h3><p class="mute" style="margin:4px 0 8px;font-size:14px">Purely for looks. Buy once, put on any pet.</p>
        <div class="grid" style="gap:6px">${PET_HATS.map(([id, n, c]) => { const own = ch.cosmetics.hats.includes(id), p = petPrice(c); return `<div class="prow"><span>${esc(n)}</span>${own ? '<span class="chip on">Owned</span>' : `<button class="sm" data-act="buycos" data-arg="hat|${id}" ${ch.gold >= p ? '' : 'disabled'}>${N(p)}g</button>`}</div>`; }).join('')}
        ${PET_AURAS.map(([id, n, c]) => { const own = ch.cosmetics.auras.includes(id); return `<div class="prow"><span>${esc(n)}</span>${own ? '<span class="chip on">Owned</span>' : `<button class="sm" data-act="buycos" data-arg="aura|${id}" ${account.shards >= c ? '' : 'disabled'}>${c} shards</button>`}</div>`; }).join('')}</div></div>
    </div>`;
}
function tabCollection() {
  const C = collectionPct(ch), tabs = [['pets', 'Pets'], ['monsters', 'Monsters'], ['items', 'Items'], ['regions', 'Regions']];
  const head = `<div class="spread"><h2>Collection</h2></div><p class="mute" style="margin:4px 0 10px">Every 25% of a collection gives a small permanent bonus: pets add gathering yield, monsters add rare drops, items add XP, regions add travel speed.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">${tabs.map(([k, n]) => { const steps = COLLECTION_STEPS.filter(t => C[k] >= t - 1e-9).length; return `<button class="card collcard ${collTab === k ? 'on' : ''}" data-act="colltab" data-arg="${k}"><b>${n}</b><div class="num" style="font-size:22px">${Math.floor(C[k] * 100)}%</div><div class="bar"><i style="width:${(C[k] * 100).toFixed(1)}%"></i></div><div class="mute" style="font-size:12px">${steps ? esc(modsText(COLLECTION_BONUS[k], steps)) : 'No bonus yet'}</div></button>`; }).join('')}</div>`;
  let body = '';
  if (collTab === 'pets') body = `<div class="dex">${Object.keys(SPECIES).map(id => { const S = SP(id), got = ch.petDex[id]; return `<div class="dexcell ${got ? '' : 'unk'}" title="${got ? esc(S.name) : '???'}">${got ? petGlyph(id, 44) : '<svg width="44" height="44" viewBox="0 0 64 64"><text x="32" y="42" text-anchor="middle" font-size="26" fill="currentColor" opacity=".4">?</text></svg>'}<span>${got ? esc(S.name) : '???'}</span><span class="mute" style="font-size:11px">${PET_RARITY[S.rarity]}${S.hybrid ? ' · Hybrid' : ''}</span></div>`; }).join('')}</div>`;
  else if (collTab === 'monsters') body = REGIONS.filter(r => !r.secret || ch.visited[r.id]).map(r => { const es = ENEMIES.filter(e => e.region === r.id && e.role !== 'trial'); return `<h4 class="shopgrp">${esc(r.name)}</h4><div class="dex">${es.map(e => { const k = ch.prof[e.id] || 0; return `<div class="dexcell ${k ? '' : 'unk'}"><span>${k || e.area !== 'hidden' ? esc(e.name) : '???'}</span><span class="mute" style="font-size:11px">${k ? N(k) + ' defeated' : 'Not yet'}</span></div>`; }).join('')}</div>`; }).join('');
  else if (collTab === 'items') { const all = [...RES.map(r => r.id), ...Object.keys(ITEMS).filter(k => !['supply', 'upgrade'].includes(ITEMS[k].type))]; const groups = {}; for (const k of all) { const it = ITEM(k) || RES_BY[k]; const g = (it && (it.type || 'resource')) || 'resource'; (groups[g] = groups[g] || []).push(k); }
    body = Object.entries(groups).map(([g, ks]) => `<h4 class="shopgrp">${esc(g[0].toUpperCase() + g.slice(1))} <span class="mute">${ks.filter(k => ch.seen[k]).length} / ${ks.length}</span></h4><div class="row" style="gap:4px">${ks.map(k => ch.seen[k] ? `<span class="chip" style="font-size:12px">${esc((ITEM(k) || RES_BY[k]).name)}</span>` : '<span class="chip mute" style="font-size:12px">???</span>').join('')}</div>`).join(''); }
  else body = `<div class="dex">${REGIONS.filter(r => !r.secret || ch.visited[r.id]).map(r => `<div class="dexcell ${ch.visited[r.id] ? '' : 'unk'}"><span>${ch.visited[r.id] ? esc(r.name) : '???'}</span><span class="mute" style="font-size:11px">${ch.visited[r.id] ? `Explored ${pct(exploreFrac(ch, r.id))}` : 'Not visited'}</span></div>`).join('')}</div>`;
  return head + `<div style="margin-top:14px">${body}</div>`;
}

// ---------- Save codes (v0.9b: compact + compressed) ----------
const SAVE_DROP = { log: [], clog: [], snap: null, _petPower: 0 };
function compactAccount() {
  return JSON.stringify(account, function (k, v) {
    if (this && this.skills && Object.prototype.hasOwnProperty.call(SAVE_DROP, k)) return SAVE_DROP[k];
    if (typeof v === 'number' && !Number.isInteger(v) && Number.isFinite(v)) return Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 1000) / 1000;
    return v;
  });
}
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { const b = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function streamBytes(bytes, T) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(T)).arrayBuffer()); }
async function makeSaveCode() {
  const json = compactAccount();
  if (typeof CompressionStream === 'function') { try { return 'TF2.' + b64u(await streamBytes(new TextEncoder().encode(json), new CompressionStream('deflate-raw'))); } catch (e) { } }
  return btoa(unescape(encodeURIComponent(json)));
}
async function readSaveCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (code.startsWith('TF2.')) return JSON.parse(new TextDecoder().decode(await streamBytes(unb64u(code.slice(4)), new DecompressionStream('deflate-raw'))));
  return JSON.parse(decodeURIComponent(escape(atob(code))));
}
