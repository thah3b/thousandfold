// ============================================================
// ARENA (v1.3) — asynchronous PvP. You publish a defence
// snapshot (your stats and 4 ordered skills); fights against
// other players' snapshots are simulated on the server, then
// played back here as an animated battle.
// ============================================================
// [name, unlock level, cooldown (turns), description]. Kept in step with tf_private.pvp_skills().
const PVP_SKILLS = {
  power: ['Power Strike', 1, 3, 'A heavy blow: 180% damage.'],
  flurry: ['Flurry', 5, 4, 'Three quick hits of 55% damage. Each can crit or miss.'],
  guard: ['Guard', 8, 4, 'Halve the damage of the next 2 hits you take.'],
  heal: ['Second Wind', 10, 5, 'Heal 25% of your HP. Waits until you are below 60%.'],
  bash: ['Shield Bash', 12, 6, '80% damage and stuns: the enemy loses its next turn.'],
  rend: ['Rend', 15, 5, '60% damage, then the enemy bleeds for 3 turns.'],
  focus: ['Focus', 18, 4, 'No attack this turn. Your next hit can’t miss and crits for +50%.'],
  drain: ['Life Drain', 20, 4, '110% damage and heal half of it.'],
  haste: ['Quicken', 25, 6, '+40% speed for 3 of your turns.'],
  hex: ['Hex', 28, 5, 'The enemy deals 25% less damage for 3 turns.'],
  sunder: ['Sunder', 30, 5, '100% damage and the enemy’s defence drops 40% for 3 turns.'],
  execute: ['Finisher', 35, 4, '120% damage, or 300% if the enemy is below 30% HP.'],
  barrier: ['Barrier', 40, 6, 'A shield that absorbs 20% of your HP. Not used while one is up.'],
  blast: ['Arcane Blast', 45, 5, '220% damage that ignores half the enemy’s defence.'],
};
const PVP_AFFINITY = { warrior: 'power', archer: 'flurry', mage: 'blast', rogue: 'rend', necromancer: 'drain', healer: 'heal', farmer: 'guard', merchant: 'execute', beastmaster: 'bash', alchemist: 'hex', bard: 'haste', monk: 'focus', summoner: 'barrier', runesmith: 'sunder', tidecaller: 'heal', wayfinder: 'flurry' };
const PVP_TIERS = [['Bronze', '#c08850'], ['Silver', '#c8ccd4'], ['Gold', '#e8c15a'], ['Platinum', '#7fe8d8'], ['Diamond', '#7ec8f0'], ['Champion', '#e88ab8']];
const PVP_TIER_AT = [0, 1100, 1250, 1400, 1600, 1800];
const RN = n => Math.round(+n || 0).toLocaleString();
const pvpTierChip = t => `<span class="chip pvptier" style="color:${PVP_TIERS[t][1]};border-color:${PVP_TIERS[t][1]}">${PVP_TIERS[t][0]}</span>`;
ACHIEVEMENTS.push(
  { id: 'pvp_1', cat: 'Combat', name: 'First Blood', desc: 'Win an Arena fight.', pts: 10, goal: 1, stat: 'pvpWins' },
  { id: 'pvp_50', cat: 'Combat', name: 'Crowd Pleaser', desc: 'Win 50 Arena fights.', pts: 25, goal: 50, stat: 'pvpWins' },
);
// Arena rewards in the Wardrobe: the best tier you've ever reached on this account.
FASHIONS.push(
  F('cape_arena', 'cape', 'Arena Cape', '#b8463a', { pvp: 1 }), F('hat_gladiator', 'hat', 'Gladiator Helm', 'gladiator', { pvp: 2 }),
  F('out_gladiator', 'outfit', 'Gladiator Harness', ['#8a3a2a', '#e8c15a', false], { pvp: 3 }), F('prop_champblade', 'prop', 'Diamond Blade', 'champblade', { pvp: 4 }),
  F('hat_laurel', 'hat', 'Champion’s Laurel', 'laurel', { pvp: 5 }),
);
for (const f of FASHIONS.slice(-5)) FASHION_BY[f.id] = f;

const pvp = { state: null, opps: null, board: null, sig: '', busy: false, err: '', fight: null };
const pvpSkillsOf = c => { c.pvp = c.pvp || {}; if (!Array.isArray(c.pvp.skills)) c.pvp.skills = [PVP_AFFINITY[c.cls] || 'power', 'power'].filter((s, i, a) => a.indexOf(s) === i); return c.pvp.skills; };
const pvpUnlocked = (c, s) => s === PVP_AFFINITY[c.cls] || c.level >= PVP_SKILLS[s][1];
function pvpSnap() {
  const Dd = D(), L = pxLookOf(ch);
  return { cid: ch.id, name: ch.name, level: ch.level, asc: ch.ascension || 0, cls: ch.cls, race: ch.race, gender: ch.gender,
    hp: Math.round(Dd.maxHP), atk: Math.round(Dd.attack * 100) / 100, def: Math.round(Dd.defense * 100) / 100, spd: Math.round(Dd.cspeed),
    crit: Math.round(Math.min(0.8, Dd.crit) * 1000) / 1000, cdmg: Math.round(Math.min(6, Dd.critDmg) * 100) / 100, dodge: Math.round(Math.min(0.6, Dd.dodge) * 1000) / 1000,
    skills: pvpSkillsOf(ch).filter(s => pvpUnlocked(ch, s)).slice(0, 4), look: L };
}
const pvpOn = () => typeof socOn === 'function' && socOn() && soc.me;
async function pvpSync(force) {
  if (!pvpOn() || ch.debugUsed) return;
  const snap = pvpSnap(), sig = JSON.stringify(snap);
  try {
    if (force || sig !== pvp.sig) { await rpc('tf_pvp_publish', { p_snap: snap }); pvp.sig = sig; }
    pvp.state = await rpc('tf_pvp_state', {}); pvp.err = '';
    const t = Math.max(pvp.state.bestTier || 0, (pvp.state.last && pvp.state.last.tier) || 0);
    if (t > (account.pvpBest || 0)) { account.pvpBest = t; save(); }
  } catch (e) { pvp.err = e.message || 'The Arena is unavailable right now.'; }
}
async function pvpLoad() {
  if (pvp.busy) return; pvp.busy = true;
  await pvpSync(false);
  if (!pvp.err) { try { pvp.opps = await rpc('tf_pvp_opponents', {}); pvp.board = await rpc('tf_pvp_board', {}); } catch (e) { pvp.err = e.message; } }
  pvp.busy = false; if (tab === 'arena') renderMain();
}
const pvpLookOf = s => ({ race: s.race || 'human', cls: s.cls || 'warrior', gender: s.gender || 'Male', ...(s.look || {}) });
const pvpCp = s => Math.round(Math.sqrt(s.atk * (1 + s.crit * (s.cdmg - 1)) * (s.spd / 100) * s.hp * (1 + s.def / 200) / (1 - s.dodge)));

function tabArena() {
  if (!pvpOn()) return `<h2>Arena</h2><p class="mute">Fight other players’ heroes for rating, seasonal rewards and bragging rights. The Arena needs an account: sign in on the Account tab (guests can’t enter).</p><button class="pri" data-act="tab" data-arg="account">Go to Account</button>`;
  if (ch.debugUsed) return `<h2>Arena</h2><p class="mute">Characters that used debug tools can’t enter the Arena.</p>`;
  if (!pvp.state && !pvp.err && !pvp.busy) setTimeout(pvpLoad, 0);
  const S = pvp.state, sk = pvpSkillsOf(ch), mine = pvpSnap();
  const seasonEnd = (() => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); })();
  const head = S ? `<div class="card arenahead"><div class="row" style="gap:14px;flex-wrap:wrap;align-items:center">${pxChibi(mine.look, 64, { cls: 'chibi' })}
      <div style="flex:1;min-width:200px"><div class="row" style="gap:8px;align-items:center"><b style="font-size:22px">${RN(S.rating)}</b>${pvpTierChip(S.tier)}<span class="mute">rank #${S.rank}</span></div>
      <div class="mute" style="font-size:14px">Season ${esc(S.season)} · ends ${seasonEnd.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' })} (UTC) · ${S.wins} won, ${S.losses} lost · best ${RN(S.best)}</div>
      <div class="mute" style="font-size:14px">Your power ${N(pvpCp(mine))} · tickets <b class="gold">${S.left}</b> / ${S.tickets} today (refill at midnight UTC)</div></div>
      <button class="sm" data-act="pvpref">Refresh</button></div>
      ${S.last ? `<p class="mute" style="font-size:13px;margin:8px 0 0">Last season (${esc(S.last.season)}): best ${RN(S.last.best)} · ${PVP_TIERS[S.last.tier][0]}.</p>` : ''}</div>`
    : `<div class="card"><p class="mute" style="margin:0">${pvp.err ? `<span class="bad">${esc(pvp.err)}</span> <button class="sm" data-act="pvpref">Try again</button>` : 'Entering the Arena…'}</p></div>`;
  const slots = [0, 1, 2, 3].map(i => {
    const s = sk[i]; if (!s) return `<div class="pvpslot empty"><span class="mute">${i + 1}. Empty slot</span></div>`;
    const [n, , cd] = PVP_SKILLS[s];
    return `<div class="pvpslot"><b>${i + 1}. ${esc(n)}</b>${s === PVP_AFFINITY[ch.cls] ? ' <span class="chip" title="Your class skill is 20% stronger">Class</span>' : ''}<span class="mute" style="font-size:12px"> · every ${cd} turns</span>
      <span class="row" style="gap:4px;margin-left:auto"><button class="sm ghost" data-act="pvpmv" data-arg="${i}|-1" ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button class="sm ghost" data-act="pvpmv" data-arg="${i}|1" ${i < sk.length - 1 ? '' : 'disabled'} aria-label="Move down">↓</button><button class="sm ghost" data-act="pvprm" data-arg="${s}" aria-label="Remove">✕</button></span></div>`;
  }).join('');
  const pool = Object.entries(PVP_SKILLS).map(([id, [n, lvl, cd, desc]]) => {
    const un = pvpUnlocked(ch, id), on = sk.includes(id);
    return `<div class="pvpskill ${un ? '' : 'locked'}"><div><b>${esc(n)}</b>${id === PVP_AFFINITY[ch.cls] ? ' <span class="chip">Class +20%</span>' : ''} <span class="mute" style="font-size:12px">· every ${cd} turns</span><div class="mute" style="font-size:13px">${esc(desc)}</div></div>
      ${on ? '<span class="mute" style="font-size:12px">Equipped</span>' : un ? `<button class="sm" data-act="pvpadd" data-arg="${id}" ${sk.length >= 4 ? 'disabled' : ''}>Equip</button>` : `<span class="mute" style="font-size:12px">🔒 Level ${lvl}</span>`}</div>`;
  }).join('');
  const opps = !S ? '' : !pvp.opps ? '<p class="mute">Finding opponents…</p>' : pvp.opps.map((o, i) => {
    const s = o.snap, cp = pvpCp(s), mc = pvpCp(mine), r = cp / Math.max(1, mc);
    const odds = r < 0.85 ? ['verd', 'Favoured'] : r < 1.15 ? ['', 'Even'] : r < 1.5 ? ['bad', 'Tough'] : ['bad', 'Very tough'];
    const cls = CLASSES.find(k => k.id === s.cls);
    return `<div class="card pvpopp"><div class="row" style="gap:10px;flex-wrap:nowrap;align-items:center">${pxChibi(pvpLookOf(s), 48, { cls: 'chibi', style: 'transform:scaleX(-1)' })}
      <div style="flex:1;min-width:0"><b>${esc(s.name)}</b>${o.bot ? ' <span class="chip">Practice</span>' : ''}<div class="mute" style="font-size:13px">Lv ${s.level} ${esc(cls ? cls.name : '')} · ${RN(o.rating)} ${PVP_TIERS[o.tier][0]}</div>
      <div style="font-size:13px">Power ${N(cp)} · <span class="${odds[0]}">${odds[1]}</span></div></div>
      <button class="pri sm" data-act="pvpfight" data-arg="${o.bot ? 'b' + o.bot : o.id}" ${S.left > 0 ? '' : 'disabled'}>Fight</button></div></div>`;
  }).join('');
  const hist = S && S.history.length ? S.history.map(h => `<div class="spread" style="font-size:14px;padding:3px 0"><span>${h.me === 0 ? 'You attacked' : 'Attacked by'} ${esc(h.vs || '?')}${h.bot ? ' (practice)' : ''}</span><span class="${h.won ? 'verd' : 'bad'}">${h.won ? 'Won' : 'Lost'} ${h.delta > 0 ? '+' : ''}${h.delta}</span></div>`).join('') : '<p class="mute" style="margin:0">No fights yet.</p>';
  const board = pvp.board && pvp.board.rows.length ? `<table class="simtab pvpboard"><thead><tr><th>#</th><th>Player</th><th>Hero</th><th>Rating</th><th>W–L</th></tr></thead><tbody>${pvp.board.rows.map((r, i) => `<tr><td>${i + 1}</td><td><a href="#" data-act="profuser" data-arg="${r.id}">${esc(r.name)}</a></td><td>${esc(r.char || '')} · Lv ${r.level}</td><td style="color:${PVP_TIERS[r.tier][1]}">${RN(r.rating)}</td><td>${r.wins}–${r.losses}</td></tr>`).join('')}</tbody></table>` : '<p class="mute" style="margin:0">No ranked fights this season yet. Be the first!</p>';
  const rewards = PVP_TIERS.map(([n, c], t) => { const f = FASHIONS.find(x => x.src.pvp === t); return `<div class="spread" style="font-size:14px;padding:2px 0"><span style="color:${c}">${n}</span><span class="mute">${t ? RN(PVP_TIER_AT[t]) + '+' : 'start'}${f ? ' · ' + esc(f.name) : ''}${(account.pvpBest || 0) >= t && f ? ' ✓' : ''}</span></div>`; }).join('');
  return `<div class="spread"><h2>Arena</h2><span class="chip">Season ${esc(S ? S.season : '')}</span></div>
    <p class="mute" style="margin:4px 0 12px">Pick 4 skills and put them in order: each turn your hero uses the first one that’s ready, otherwise a basic attack. Other players fight the hero you leave here, even when you’re away. A clever order can beat a stronger hero.</p>
    ${head}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px;margin-top:12px;align-items:start">
      <div class="card"><h3>Your fight plan</h3><div class="pvpslots">${slots}</div><details style="margin-top:10px"><summary>All skills</summary><div style="margin-top:6px">${pool}</div></details></div>
      <div class="card"><div class="spread"><h3>Opponents</h3><button class="sm ghost" data-act="pvpref">New opponents</button></div><div style="display:grid;gap:8px;margin-top:8px">${opps}</div></div>
      <div class="card"><h3>Recent fights</h3>${hist}</div>
      <div class="card"><h3>Season rewards</h3><p class="mute" style="font-size:13px;margin:4px 0 6px">Reach a rank to unlock its Wardrobe piece on this account for good. Ratings are reset halfway towards 1,000 each month.</p>${rewards}</div>
      <div class="card" style="grid-column:1/-1"><h3>Season leaderboard</h3>${board}</div>
    </div>`;
}

// ---------- Battle playback ----------
function pvpBattleHtml(f) {
  const mL = pvpLookOf(f.me), oL = pvpLookOf(f.op);
  const bar = (i, nm) => `<div class="pvphp"><div class="spread"><b>${esc(nm)}</b><span class="mute" id="pvphpt${i}">${N(f.max[i])}</span></div><div class="bar"><i id="pvphp${i}" style="width:100%"></i></div></div>`;
  return `<div class="pvpfight"><div class="pvpbars">${bar(0, f.me.name)}<b class="vs">VS</b>${bar(1, f.op.name)}</div>
    <div class="pvpstage" style="background:${SHOWCASE_BG}"><div class="pvpf" id="pvpf0">${pxChibi(mL, 128, { cls: 'chibi' })}</div><div class="pvpcall" id="pvpcall">Fight!</div><div class="pvpf flip" id="pvpf1">${pxChibi(oL, 128, { cls: 'chibi' })}</div></div>
    <div id="pvpres" class="pvpres"></div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:10px" id="pvpctl"><button class="sm" data-act="pvpspeed">Speed ×${pvp.fast ? 1 : 2}</button><button class="sm pri" data-act="pvpskip">Skip to result</button></div></div>`;
}
const pvpName = k => k === 'atk' ? 'Attack' : k === 'bleed' ? 'Bleeding' : k === 'stunned' ? 'Stunned!' : (PVP_SKILLS[k] || [k])[0];
function pvpPop(i, text, cls) {
  const el = document.getElementById('pvpf' + i); if (!el) return;
  const p = document.createElement('span'); p.className = 'pvppop ' + (cls || ''); p.textContent = text; el.appendChild(p); setTimeout(() => p.remove(), 900);
}
function pvpApply(f, ev) {
  for (const i of [0, 1]) { const w = Math.max(0, ev.hp[i] / f.max[i] * 100); const b = document.getElementById('pvphp' + i), t = document.getElementById('pvphpt' + i); if (b) b.style.width = w + '%'; if (t) t.textContent = N(ev.hp[i]); }
}
function pvpStep() {
  const f = pvp.fight; if (!f || !document.getElementById('pvpcall')) { pvp.fight = null; return; }
  if (f.i >= f.log.length) { pvpFinish(); return; }
  const ev = f.log[f.i++], a = ev.t, o = 1 - a, call = document.getElementById('pvpcall'), side = a === 0 ? f.me.name : f.op.name;
  call.textContent = `${side}: ${pvpName(ev.k)}`;
  if (ev.k === 'bleed') { pvpPop(a, '-' + N(ev.d), 'dmg'); }
  else if (ev.k !== 'stunned') {
    const el = document.getElementById('pvpf' + a); if (el) { el.classList.remove('lunge'); void el.offsetWidth; el.classList.add('lunge'); }
    if (ev.d != null) { if (ev.m) pvpPop(o, 'Miss', 'miss'); else { pvpPop(o, (ev.c ? 'Crit! ' : '') + '-' + N(ev.d), ev.c ? 'crit' : 'dmg'); const t = document.getElementById('pvpf' + o); if (t) { t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); } } }
    if (ev.h) pvpPop(a, '+' + N(ev.h), 'heal');
    if (ev.x && !ev.d && !ev.h) pvpPop(a, pvpName(ev.k), 'buff');
  }
  pvpApply(f, ev);
  f.timer = setTimeout(pvpStep, pvp.fast ? 320 : 650);
}
function pvpFinish() {
  const f = pvp.fight; if (!f) return; clearTimeout(f.timer);
  if (f.log.length) pvpApply(f, f.log[f.log.length - 1]);
  const won = f.win === 0, res = document.getElementById('pvpres'), ctl = document.getElementById('pvpctl'), call = document.getElementById('pvpcall');
  if (call) call.textContent = won ? 'Victory!' : 'Defeat';
  const loser = document.getElementById('pvpf' + (won ? 1 : 0)); if (loser) loser.classList.add('down');
  if (res) res.innerHTML = `<h2 class="${won ? 'gold' : 'bad'}" style="margin:6px 0 2px">${won ? 'Victory!' : 'Defeat'}</h2><div>Rating ${RN(f.rating)} <b class="${f.delta >= 0 ? 'verd' : 'bad'}">(${f.delta >= 0 ? '+' : ''}${f.delta})</b> · ${PVP_TIERS[f.tier][0]} · ${f.left} ticket${f.left === 1 ? '' : 's'} left</div>`;
  if (ctl) ctl.innerHTML = `<button class="pri" data-act="close">Close</button>`;
  pvp.fight = null;
}
const ARENA_HANDLERS = {
  pvpref: () => { pvp.opps = null; pvp.err = ''; renderMain(); pvpLoad(); },
  pvpadd: s => { const sk = pvpSkillsOf(ch); if (sk.length < 4 && !sk.includes(s) && pvpUnlocked(ch, s)) sk.push(s); dirty = true; save(); renderMain(); },
  pvprm: s => { ch.pvp.skills = pvpSkillsOf(ch).filter(x => x !== s); dirty = true; save(); renderMain(); },
  pvpmv: a => { const [i, d] = a.split('|').map(Number), sk = pvpSkillsOf(ch), j = i + d; if (j < 0 || j >= sk.length) return; [sk[i], sk[j]] = [sk[j], sk[i]]; dirty = true; save(); renderMain(); },
  pvpspeed: () => { pvp.fast = !pvp.fast; const b = document.querySelector('[data-act=pvpspeed]'); if (b) b.textContent = `Speed ×${pvp.fast ? 1 : 2}`; },
  pvpskip: () => pvpFinish(),
  pvpfight: async a => {
    if (pvp.busy) return; pvp.busy = true;
    try {
      await pvpSync(false); if (pvp.err) throw new Error(pvp.err);
      const r = await rpc('tf_pvp_fight', a[0] === 'b' ? { p_bot: +a.slice(1) } : { p_opponent: a });
      pvp.fight = { ...r, i: 0 };
      if (r.win === 0) { ch.counters.pvpWins = (ch.counters.pvpWins || 0) + 1; checkProgress(); }
      ch.counters.pvpFights = (ch.counters.pvpFights || 0) + 1;
      addLog(r.win === 0 ? 'lucky' : 'sys', `Arena: ${r.win === 0 ? 'beat' : 'lost to'} ${r.op.name} (${r.delta >= 0 ? '+' : ''}${r.delta} rating).`);
      if (r.tier > (account.pvpBest || 0)) { account.pvpBest = r.tier; toast(`<b>${PVP_TIERS[r.tier][0]} rank reached!</b> New Wardrobe piece unlocked.`, 'gold'); }
      dirty = true; save();
      modal(pvpBattleHtml(pvp.fight), 'wide');
      if (account.settings.reduced) pvpFinish(); else pvp.fight.timer = setTimeout(pvpStep, 500);
      pvp.state = Object.assign(pvp.state || {}, { rating: r.rating, tier: r.tier, best: r.best, left: r.left });
      pvp.busy = false; pvpLoad();
    } catch (e) { pvp.busy = false; toast(esc(e.message || 'The fight could not start.')); }
  },
};
