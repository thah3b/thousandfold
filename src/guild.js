// ============================================================
// GUILDS (Phase 13): create or join, ranks, guild chat, a shared gold
// bank, a weekly guild goal and the guild leaderboard. Server-side in
// migration 0007_guilds.sql; works on the website for signed-in players.
// ============================================================
let gd = { info: undefined, list: null, q: '', loading: false, err: '', at: 0, pay: null };
const G_RANK = { leader: 'Leader', officer: 'Officer', member: 'Member' };

async function guildLoad(force) {
  if (gd.loading || (!force && gd.info !== undefined && Date.now() - gd.at < 30000)) return;
  gd.loading = true;
  try {
    const [info, list] = await Promise.all([rpc('tf_guild_info'), rpc('tf_guild_list', { p_q: gd.q })]);
    gd.info = info; gd.list = list || []; gd.at = Date.now(); gd.err = '';
    soc.guild = info && info.guild ? { id: info.guild.id, name: info.guild.name, tag: info.guild.tag } : null;
    if (soc.guild && ch && !ch.counters.guildJoined) { ch.counters.guildJoined = 1; dirty = true; }
  } catch (e) { gd.err = e.message || String(e); if (gd.info === undefined) gd.info = null; }
  gd.loading = false; if (screen === 'game' && tab === 'guild') renderMain();
}
// Points for the weekly goal: actions done (gathered + crafted + won fights) since the last report.
const guildTotal = () => (ch.counters.gathered || 0) + (ch.counters.crafted || 0) + (ch.counters.kills || 0);
async function guildContribute() {
  if (!ch || !socOn() || !soc.me || !soc.guild || (ch.debugUsed)) return;
  if (ch.guildMark == null || ch.guildMark > guildTotal()) { ch.guildMark = guildTotal(); return; }
  const delta = guildTotal() - ch.guildMark; if (delta < 1) return;
  try { const r = await rpc('tf_guild_contribute', { p_n: delta }); if (r && r.ok) { ch.guildMark += +r.added; ch.guildPts = (ch.guildPts || 0) + +r.added; save(); } } catch (e) { }
}

function guildGoalBar(g) {
  const goals = g.goals.map(Number), max = goals[2], p = Math.min(1, g.week_points / max);
  const names = ['Bronze', 'Silver', 'Gold'];
  return `<div class="ggoal"><div class="gbar"><div class="gfill" style="width:${(p * 100).toFixed(1)}%"></div>${goals.map((v, i) => `<span class="gmark ${g.week_points >= v ? 'on' : ''}" style="left:${(v / max * 100).toFixed(1)}%" title="${names[i]}: ${N(v)}"></span>`).join('')}</div>
    <div class="row" style="justify-content:space-between;font-size:13px;margin-top:4px">${goals.map((v, i) => `<span class="${g.week_points >= v ? 'gold' : 'mute'}">${g.week_points >= v ? '✓ ' : ''}${names[i]} ${N(v)}</span>`).join('')}</div></div>`;
}
function guildTop() {
  const L = gd.list || [];
  return `<div class="card" style="margin-top:12px"><div class="spread"><h3>Guild leaderboard</h3><span class="mute" style="font-size:13px">This week</span></div>
    ${L.length ? `<div class="grid" style="gap:4px;margin-top:8px">${L.slice(0, 20).map((g, i) => `<div class="prow"><span><b>${i + 1}.</b> ${esc(g.name)} <span class="chip" style="font-size:11px">${esc(g.tag)}</span> <span class="mute" style="font-size:12px">${g.members} member${g.members === 1 ? '' : 's'}</span></span><span class="num"><b class="gold">${N(+g.week_points)}</b> <span class="mute" style="font-size:12px">· ${N(+g.total_points)} all time</span></span></div>`).join('')}</div>` : '<p class="mute">No guilds yet.</p>'}</div>`;
}
function tabGuild() {
  const gate = socGate(); if (gate) return `<h2>Guild</h2>${gate}`;
  if (gd.info === undefined) { guildLoad(true); return '<h2>Guild</h2><p class="mute">Loading…</p>'; }
  if (!gd.loading && (Date.now() - (gd.view || 0) > 3000 || Date.now() - gd.at > 60000)) setTimeout(() => guildLoad(true), 0);
  gd.view = Date.now();
  const I = gd.info, err = gd.err ? `<p class="bad" style="font-size:14px">${esc(gd.err)}</p>` : '';
  if (!I || !I.guild) {
    const req = new Set((I && I.requests) || []);
    return `<h2>Guild</h2><p class="mute" style="margin:4px 0 12px">Join a guild to chat together, share a gold bank and chase a weekly goal: every action members take counts, and every member gets the rewards.</p>${err}
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;align-items:start">
        <div class="card"><h3>Find a guild</h3><div class="row" style="gap:6px;margin-top:8px"><input id="gq" value="${esc(gd.q)}" placeholder="Search by name or tag" aria-label="Search guilds" style="flex:1"><button class="sm" data-act="gsearch">Search</button></div>
          <div class="grid" style="gap:6px;margin-top:10px">${(gd.list || []).length ? gd.list.map(g => `<div class="prow"><span><b>${esc(g.name)}</b> <span class="chip" style="font-size:11px">${esc(g.tag)}</span><br><span class="mute" style="font-size:12px">${g.members} member${g.members === 1 ? '' : 's'} · ${g.open ? 'open to all' : 'asks to join'}${g.descr ? ' · ' + esc(g.descr) : ''}</span></span>
            ${req.has(g.id) || g.requested ? `<button class="sm ghost" data-act="gcancel" data-arg="${g.id}">Cancel request</button>` : `<button class="sm ${g.open ? 'pri' : ''}" data-act="gjoin" data-arg="${g.id}">${g.open ? 'Join' : 'Ask to join'}</button>`}</div>`).join('') : '<p class="mute">No guilds found. Start one!</p>'}</div></div>
        <div class="card"><h3>Start a guild</h3>
          <div class="grid" style="gap:8px;margin-top:8px"><input id="gname" maxlength="24" placeholder="Guild name (3–24 characters)" aria-label="Guild name"><input id="gtag" maxlength="4" placeholder="Tag (2–4 letters or numbers)" aria-label="Guild tag" style="max-width:220px;text-transform:uppercase"><textarea id="gdesc" maxlength="300" rows="2" placeholder="What is your guild about? (optional)" aria-label="Description"></textarea>
            <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="gopen" checked> Anyone can join (untick to approve requests)</label></div>
          <div class="err" id="gerr"></div><button class="pri" data-act="gcreate" style="margin-top:6px">Create guild</button></div>
      </div>${guildTop()}`;
  }
  const g = I.guild, me = I.me.rank, off = me === 'leader' || me === 'officer', mine = I.members.find(m => m.me) || {};
  const members = I.members.map(m => `<div class="prow"><span><span class="odot ${m.online ? 'on' : ''}"></span> <b>${esc(m.name)}</b>${m.me ? ' <span class="mute">(you)</span>' : ''} <span class="chip" style="font-size:11px">${G_RANK[m.rank]}</span><br><span class="mute" style="font-size:12px">${N(+m.week_points)} this week · ${N(+m.total_points)} all time</span></span>
      <span class="row" style="gap:4px">${!m.me && me === 'leader' ? (m.rank === 'member' ? `<button class="sm ghost" data-act="grank" data-arg="${m.id}|officer">Make officer</button>` : `<button class="sm ghost" data-act="grank" data-arg="${m.id}|member">Make member</button>`) + `<button class="sm ghost" data-act="grank" data-arg="${m.id}|leader">Make leader</button>` : ''}${!m.me && off && m.rank !== 'leader' && (me === 'leader' || m.rank === 'member') ? `<button class="sm ghost" data-act="gkick" data-arg="${m.id}">Remove</button>` : ''}</span></div>`).join('');
  return `<div class="spread"><h2>${esc(g.name)} <span class="chip">${esc(g.tag)}</span></h2><span class="row" style="gap:6px"><button class="sm" data-act="gchat">Guild chat</button><button class="sm" data-act="grefresh" ${gd.loading ? 'disabled' : ''}>Refresh</button></span></div>
    <p class="mute" style="margin:4px 0 12px">${g.descr ? esc(g.descr) + ' · ' : ''}${I.members.length} of ${g.max_members} members · ${g.open ? 'open to all' : 'asks to join'} · you are ${G_RANK[me].toLowerCase()}</p>${err}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;align-items:start">
      <div class="card"><div class="spread"><h3>Weekly goal</h3><span class="mute" style="font-size:13px">resets Monday (UTC)</span></div>
        <p style="margin:6px 0"><b class="gold">${N(+g.week_points)}</b> points this week · your share <b>${N(+mine.week_points || 0)}</b></p>${guildGoalBar(g)}
        <p class="mute" style="font-size:12px;margin:8px 0 0">Every gathering action, craft and won fight is a point. Each goal reached mails every member a reward: Bronze 2,000 gold and a Common Egg, Silver 10,000 gold and a Rare Egg, Gold 50,000 gold and an Epic Egg.</p></div>
      <div class="card"><h3>Guild bank</h3><p style="margin:6px 0"><b class="gold">${N(+g.bank)}</b> gold</p>
        <div class="row" style="gap:6px"><input id="gdep" type="number" min="1" step="1" placeholder="Amount" style="width:9em" aria-label="Gold to deposit"><button class="sm" data-act="gdeposit">Deposit</button><span class="mute num" style="font-size:13px">you have <b class="gold" data-live="gold"></b></span></div>
        ${off ? `<div class="row" style="gap:6px;margin-top:8px"><select id="gpayto" aria-label="Pay to">${I.members.map(m => `<option value="${m.id}">${esc(m.name)}${m.me ? ' (you)' : ''}</option>`).join('')}</select><input id="gpayamt" type="number" min="1" step="1" placeholder="Amount" style="width:8em" aria-label="Gold to pay"><button class="sm" data-act="gpay">Pay out</button></div><p class="mute" style="font-size:12px;margin:6px 0 0">Payouts arrive in the member's Mailbox.</p>` : '<p class="mute" style="font-size:12px;margin:6px 0 0">Officers and the leader can pay members from the bank.</p>'}
        <div class="err" id="gbankerr"></div></div>
    </div>
    ${off && I.requests.length ? `<div class="card" style="margin-top:12px"><h3>Requests to join</h3><div class="grid" style="gap:6px;margin-top:8px">${I.requests.map(r => `<div class="prow"><span><b>${esc(r.name)}</b></span><span class="row" style="gap:4px"><button class="sm pri" data-act="gresp" data-arg="${r.id}|1">Accept</button><button class="sm ghost" data-act="gresp" data-arg="${r.id}|0">Decline</button></span></div>`).join('')}</div></div>` : ''}
    <div class="card" style="margin-top:12px"><h3>Members</h3><div class="grid" style="gap:6px;margin-top:8px">${members}</div></div>
    ${off ? `<details class="card" style="margin-top:12px"><summary><b>Guild settings</b></summary><div class="grid" style="gap:8px;margin-top:8px"><textarea id="gedesc" maxlength="300" rows="2" aria-label="Description">${esc(g.descr)}</textarea><label class="row" style="gap:6px;font-size:14px"><input type="checkbox" id="geopen" ${g.open ? 'checked' : ''}> Anyone can join</label><button class="sm" data-act="gedit" style="justify-self:start">Save</button></div></details>` : ''}
    <div class="card" style="margin-top:12px"><h3>Guild log</h3><div class="grid" style="gap:2px;margin-top:6px;font-size:13px">${I.log.length ? I.log.map(l => `<div><span class="mute">${new Date(l.at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span> ${esc(l.text)}</div>`).join('') : '<span class="mute">Nothing yet.</span>'}</div></div>
    ${guildTop()}
    <div class="row" style="margin-top:12px"><button class="ghost" data-act="gleave">Leave guild</button></div>`;
}
const gDo = async (fn, msg, errId) => {
  try { await fn(); if (msg) toast(msg, 'verd'); await guildLoad(true); }
  catch (e) { const el = errId && document.getElementById(errId); if (el) el.textContent = e.message || String(e); else toast(esc(e.message || String(e))); }
};
const GUILD_HANDLERS = {
  grefresh: () => guildLoad(true),
  gsearch: () => { gd.q = ($('#gq') || {}).value || ''; guildLoad(true); },
  gcreate: () => gDo(() => rpc('tf_guild_create', { p_name: $('#gname').value, p_tag: $('#gtag').value.trim(), p_descr: $('#gdesc').value, p_open: $('#gopen').checked }), 'Guild created.', 'gerr'),
  gjoin: id => gDo(async () => { const r = await rpc('tf_guild_join', { p_guild: +id }); toast(r === 'joined' ? 'Welcome to the guild!' : 'Request sent. An officer will review it.', 'verd'); }),
  gcancel: id => gDo(() => rpc('tf_guild_cancel_request', { p_guild: +id }), 'Request cancelled.'),
  gresp: a => { const [id, ok] = a.split('|'); gDo(() => rpc('tf_guild_respond', { p_user: id, p_accept: ok === '1' }), ok === '1' ? 'Accepted.' : 'Declined.'); },
  grank: a => { const [id, r] = a.split('|'); if (r === 'leader') { modal(`<h3>Hand over leadership?</h3><p>You will become an officer.</p><div class="row"><button class="pri" data-act="grankok" data-arg="${esc(a)}">Make leader</button><button data-act="close">Cancel</button></div>`); return; } gDo(() => rpc('tf_guild_rank', { p_user: id, p_rank: r }), 'Rank changed.'); },
  grankok: a => { closeModal(); const [id, r] = a.split('|'); gDo(() => rpc('tf_guild_rank', { p_user: id, p_rank: r }), 'Leadership handed over.'); },
  gkick: id => gDo(() => rpc('tf_guild_kick', { p_user: id }), 'Removed from the guild.'),
  gedit: () => gDo(() => rpc('tf_guild_edit', { p_descr: $('#gedesc').value, p_open: $('#geopen').checked }), 'Saved.'),
  gdeposit: () => {
    const n = Math.floor(+($('#gdep') || {}).value || 0), el = $('#gbankerr');
    if (n < 1) { el.textContent = 'Enter an amount.'; return; } if (n > ch.gold) { el.textContent = `You have ${N(ch.gold)} gold.`; return; }
    gDo(async () => { await rpc('tf_guild_deposit', { p_amount: n }); ch.gold -= n; save(); addLog('sys', `Deposited ${N(n)} gold in the guild bank.`); }, `Deposited ${N(n)} gold.`, 'gbankerr');
  },
  gpay: () => { const n = Math.floor(+($('#gpayamt') || {}).value || 0); if (n < 1) { $('#gbankerr').textContent = 'Enter an amount.'; return; } gDo(() => rpc('tf_guild_pay', { p_to: $('#gpayto').value, p_amount: n }), 'Paid. The gold is in their Mailbox.', 'gbankerr'); },
  gleave: () => modal(`<h3>Leave ${esc(gd.info.guild.name)}?</h3><p>${gd.info.me.rank === 'leader' && gd.info.members.length > 1 ? 'Leadership passes to an officer (or the longest member).' : gd.info.members.length === 1 ? 'You are the last member, so the guild and its bank will be gone.' : 'You can join again later if it is open.'}</p><div class="row"><button class="pri" data-act="gleaveok">Leave</button><button data-act="close">Cancel</button></div>`),
  gleaveok: () => { closeModal(); gDo(() => rpc('tf_guild_leave'), 'You left the guild.'); },
  gchat: () => { soc.chan = 'guild'; HANDLERS.tab('chat'); },
};
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'gq') GUILD_HANDLERS.gsearch(); });
