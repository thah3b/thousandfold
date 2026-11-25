// ============================================================
// SOCIAL (Phase 10): display names, friends, chat, mailbox and gifts,
// secure trading. Needs a Thousandfold account (Supabase provider);
// every action is a server function that checks the caller.
// ============================================================
let soc = { me: undefined, friends: [], blocked: [], mail: 0, trades: 0, globalLast: 0, err: '', mailList: null, tradeList: null, chan: 'global', msgs: {}, busy: false, sel: null, gift: null, offer: null, lastTick: 0 };
const socOn = () => cloud.provider === 'supabase' && cloud.state === 'ready';
async function rpc(name, args) { return sbFetch('/rest/v1/rpc/' + name, { method: 'POST', body: JSON.stringify(args || {}) }); }
const friendsOnly = () => soc.friends.filter(f => f.status === 'friend');
const friendName = id => (soc.friends.find(f => f.id === id) || {}).name || 'Someone';

// ---------- Polling ----------
async function socRefresh() {
  if (!socOn()) return;
  try {
    const s = await rpc('tf_social');
    soc.me = s.me; soc.friends = s.friends || []; soc.blocked = s.blocked || []; soc.mail = s.mail || 0; soc.trades = s.trades || 0; soc.globalLast = s.global_last || 0; soc.err = '';
  } catch (e) { soc.err = e.message || String(e); }
  soc.lastTick = Date.now();
  if (soc.trades || Object.keys(account.escrow || {}).length) await tradeSync();
  socPaint();
}
function socPaint() {
  if (screen !== 'game') return;
  const chip = document.getElementById('mailchip'); if (chip) chip.outerHTML = mailChip();
  if (typeof renderNav === 'function') renderNav();
  if (['friends', 'mail', 'trade'].includes(tab) && !document.activeElement?.closest?.('#main input, #main textarea, #main select')) renderMain();
}
let chatTimer = null;
function chatLoop() {
  clearTimeout(chatTimer);
  if (screen === 'game' && tab === 'chat' && socOn() && soc.me) chatFetch().finally(() => { if (!document.hidden) chatTimer = setTimeout(chatLoop, 4000); });
}
async function chatFetch() {
  const ch_ = soc.chan, list = soc.msgs[ch_] || (soc.msgs[ch_] = []), after = list.length ? list[list.length - 1].id : 0;
  try {
    const r = await rpc('tf_chat_get', { p_channel: ch_, p_after: after });
    if (r && r.length) { list.push(...r.filter(m => !list.some(x => x.id === m.id))); if (list.length > 200) list.splice(0, list.length - 200); chatPaint(true); }
    const last = list.length ? list[list.length - 1].id : 0; account.chatSeen = account.chatSeen || {}; if (last > (account.chatSeen[ch_] || 0)) { account.chatSeen[ch_] = last; renderNav(); }
  } catch (e) { soc.err = e.message || String(e); chatPaint(false); }
}
function unreadChat() {
  const seen = account.chatSeen || {};
  let n = soc.globalLast > (seen.global || 0) && seen.global !== undefined ? 1 : 0;
  for (const f of friendsOnly()) if (f.last_dm && !f.last_dm_mine && f.last_dm > (seen['dm:' + f.id] || 0)) n++;
  return n;
}
function socBadge(id) {
  if (!socOn() || !soc.me) return '';
  const n = id === 'mail' ? soc.mail : id === 'trade' ? soc.trades : id === 'friends' ? soc.friends.filter(f => f.status === 'incoming').length : id === 'chat' ? unreadChat() : 0;
  return n ? ` <span class="chip" style="padding:0 6px">${n}</span>` : '';
}
function mailChip() { return `<button class="chip" id="mailchip" data-act="tab" data-arg="mail" title="Mailbox">Mail ${socOn() && soc.me ? soc.mail : 0}</button>`; }

// ---------- Gate ----------
function socGate() {
  if (cloud.sbBlocked) return `<div class="card"><p style="margin:0">Friends, chat, mail and trading work on the game’s website: <a href="https://thah3b.github.io/thousandfold/" target="_blank" rel="noopener">thah3b.github.io/thousandfold</a>. Claude links block connections to the game server.</p></div>`;
  if (!socOn()) return `<div class="card"><p style="margin:0">Sign in to your Thousandfold account first.</p><div class="row" style="margin-top:10px"><button class="pri" data-act="tab" data-arg="account">Go to Account</button></div></div>`;
  if (soc.me === undefined) { socRefresh(); return '<p class="mute">Loading…</p>'; }
  if (!soc.me) return `<div class="card" style="max-width:520px"><h3>Choose a display name</h3><p class="mute" style="font-size:14px">This is how other players see you in chat, on friend lists and on trades. It’s separate from your characters’ names. Any letters, symbols or emoji, up to 24 characters.</p>
    <div class="row"><input id="socname" maxlength="64" autocomplete="off" aria-label="Display name" style="flex:1"><button class="pri" data-act="socname">Save</button></div><div class="err" id="socerr"></div></div>`;
  return '';
}
const errBox = () => soc.err ? `<p class="bad" style="font-size:14px">${esc(soc.err)}</p>` : '';

// ---------- Friends ----------
function tabFriends() {
  const g = socGate(); if (g) return `<h2>Friends</h2>${g}`;
  const inc = soc.friends.filter(f => f.status === 'incoming'), out = soc.friends.filter(f => f.status === 'outgoing'), fr = friendsOnly();
  const row = f => `<div class="prow"><span><span class="odot ${f.online ? 'on' : ''}" title="${f.online ? 'Online' : 'Offline'}"></span> <b>${esc(f.name)}</b> <span class="mute" style="font-size:12px">${esc(f.code)} · ${f.online ? 'online' : 'seen ' + ago(f.last_seen)}</span></span>
    <span class="row" style="gap:4px"><button class="sm" data-act="socdm" data-arg="${f.id}">Chat</button><button class="sm" data-act="socgift" data-arg="${f.id}">Gift</button><button class="sm" data-act="soctrade" data-arg="${f.id}">Trade</button><button class="sm ghost" data-act="socmore" data-arg="${f.id}">⋯</button></span></div>`;
  return `<div class="spread"><h2>Friends</h2><button class="sm" data-act="socrefresh">Refresh</button></div>${errBox()}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));margin-top:12px;align-items:start">
      <div class="card"><h3>You</h3><p style="margin:6px 0"><b>${esc(soc.me.name)}</b>${soc.me.admin ? ' <span class="chip">Admin</span>' : ''}</p>
        <p class="mute" style="font-size:14px;margin:0">Friend code <b class="num" style="color:var(--ink)">${esc(soc.me.code)}</b> <button class="sm ghost" data-act="soccopy">Copy</button></p>
        <div class="row" style="margin-top:10px;gap:6px"><input id="socadd" placeholder="Friend code or display name" autocomplete="off" aria-label="Friend code or name" style="flex:1"><button class="pri" data-act="socadd">Add friend</button></div>
        <div class="err" id="socerr"></div>
        <p class="mute" style="font-size:12px;margin:8px 0 0">Change your player name on the <button class="linkbtn" data-act="tab" data-arg="account">Account</button> tab.</p></div>
      ${inc.length ? `<div class="card"><h3>Friend requests</h3><div class="grid" style="gap:6px;margin-top:8px">${inc.map(f => `<div class="prow"><span><b>${esc(f.name)}</b> <span class="mute" style="font-size:12px">wants to be friends</span></span><span class="row" style="gap:4px"><button class="sm pri" data-act="socaccept" data-arg="${f.id}">Accept</button><button class="sm" data-act="socdecline" data-arg="${f.id}">Decline</button></span></div>`).join('')}</div></div>` : ''}
    </div>
    <h3 style="margin:16px 0 8px">Friends (${fr.length})</h3>${fr.length ? `<div class="grid" style="gap:6px">${fr.map(row).join('')}</div>` : '<p class="mute">No friends yet. Share your friend code, or add someone by their code or display name.</p>'}
    ${out.length ? `<h3 style="margin:16px 0 8px">Waiting for them</h3><div class="grid" style="gap:6px">${out.map(f => `<div class="prow"><span>${esc(f.name)} <span class="mute" style="font-size:12px">request sent</span></span><button class="sm ghost" data-act="socremove" data-arg="${f.id}">Cancel</button></div>`).join('')}</div>` : ''}
    ${soc.blocked.length ? `<details style="margin-top:16px"><summary class="mute">Blocked players (${soc.blocked.length})</summary><div class="grid" style="gap:6px;margin-top:8px">${soc.blocked.map(b => `<div class="prow"><span>${esc(b.name)}</span><button class="sm" data-act="socunblock" data-arg="${b.id}">Unblock</button></div>`).join('')}</div></details>` : ''}`;
}
function ago(t) { const s = (Date.now() - Date.parse(t)) / 1000; return s < 3600 ? Math.max(1, Math.round(s / 60)) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago'; }

// ---------- Chat ----------
function tabChat() {
  const g = socGate(); if (g) return `<h2>Chat</h2>${g}`;
  setTimeout(chatLoop, 0);
  const seen = account.chatSeen || {}, chans = [['global', 'World']].concat(friendsOnly().map(f => ['dm:' + f.id, f.name, f]));
  return `<div class="spread"><h2>Chat</h2><span class="mute" style="font-size:13px">Be kind. Messages are checked for bad words.</span></div>
    <div class="row" style="margin:10px 0;gap:6px">${chans.map(([k, n, f]) => `<button class="chip ${soc.chan === k ? 'on' : ''}" data-act="socchan" data-arg="${esc(k)}">${f ? `<span class="odot ${f.online ? 'on' : ''}"></span> ` : ''}${esc(n)}${f && f.last_dm && !f.last_dm_mine && f.last_dm > (seen[k] || 0) && soc.chan !== k ? ' <span class="dot"></span>' : ''}</button>`).join('')}</div>
    <div class="card chatbox"><div id="chatlog" class="chatlog" aria-live="polite">${chatHtml()}</div>
      <div class="row" style="gap:6px;margin-top:8px"><input id="chatin" maxlength="200" autocomplete="off" placeholder="${soc.chan === 'global' ? 'Say something to everyone' : 'Message ' + esc(friendName(soc.chan.slice(3)))}" aria-label="Message" style="flex:1"><button class="pri" data-act="chatsend">Send</button></div><div class="err" id="chaterr">${esc(soc.err || '')}</div></div>`;
}
function chatHtml() {
  const list = soc.msgs[soc.chan] || [];
  if (!list.length) return '<p class="mute" style="margin:auto;text-align:center">No messages yet.</p>';
  return list.map(m => `<div class="cmsg ${m.mine ? 'mine' : ''}"><span class="cname">${m.mine ? 'You' : `<button class="linkbtn" data-act="socwho" data-arg="${esc(m.from)}|${esc(m.name)}">${esc(m.name)}</button>`}</span> <span class="mute" style="font-size:11px">${new Date(m.at).toLocaleTimeString([], { timeStyle: 'short' })}</span>${m.mine || (soc.me && soc.me.admin) ? ` <button class="linkbtn mute" style="font-size:11px" data-act="chatdel" data-arg="${m.id}">remove</button>` : ''}<div>${esc(m.body)}</div></div>`).join('');
}
function chatPaint(scroll) {
  if (tab !== 'chat') return; const el = document.getElementById('chatlog'); if (!el) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  el.innerHTML = chatHtml(); if (scroll && atBottom || el.dataset.first !== '1') { el.scrollTop = el.scrollHeight; el.dataset.first = '1'; }
  const e = document.getElementById('chaterr'); if (e) e.textContent = soc.err || '';
}
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'chatin') { e.preventDefault(); HANDLERS.chatsend(); } });

// ---------- Items that may change hands ----------
function giftable(key) {
  const it = ITEM(key); if (!it || it.bind) return false;
  if (key.startsWith('g:')) { const b = GEAR[parseG(key).base]; if (!b || b.ego || b.growth) return false; }
  return !['quest', 'keepsake'].includes(it.type);
}
function acceptItem(key) { try { return !!ITEM(key) && giftable(key); } catch (e) { return false; } }
function haveOffer(o) { if ((o.gold || 0) > ch.gold) return 'Not enough gold.'; for (const [k, q] of Object.entries(o.items || {})) if ((ch.inv[k] || 0) < q) return `You don’t have ${N(q)} ${ITEM(k).name}.`; return ''; }
function takeOffer(o) { ch.gold -= o.gold || 0; for (const [k, q] of Object.entries(o.items || {})) takeItem(k, q); dirty = true; }
function giveOffer(o, why) {
  const got = [], lost = [];
  if (o.gold) { ch.gold += +o.gold; got.push(N(o.gold) + ' gold'); }
  for (const [k, q] of Object.entries(o.items || {})) { if (acceptItem(k)) { addItem(k, +q, true); got.push(`${N(q)} ${ITEM(k).name}`); } else lost.push(k); }
  if (lost.length) addLog('sys', `${lost.length} unknown item${lost.length > 1 ? 's' : ''} from ${why} could not be received.`);
  dirty = true; save(); return got.join(', ') || 'nothing';
}
const offerText = o => [o.gold ? N(o.gold) + ' gold' : '', ...Object.entries(o.items || {}).map(([k, q]) => { let n = k; try { n = ITEM(k).name; } catch (e) { } return `${N(q)} ${n}`; })].filter(Boolean).join(', ') || 'nothing';
function offerEditor(o, max, actPrefix) {
  const keys = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && giftable(k)).sort((a, b) => ITEM(a).name.localeCompare(ITEM(b).name));
  const chosen = Object.entries(o.items);
  return `<div class="row" style="gap:6px;align-items:center"><label class="mute" for="${actPrefix}gold" style="font-size:14px">Gold</label><input id="${actPrefix}gold" type="number" min="0" step="1" value="${o.gold || 0}" style="width:9em" data-act-input="${actPrefix}gold"><span class="mute" style="font-size:13px">of ${N(ch.gold)}</span></div>
    <div class="grid" style="gap:4px;margin-top:8px">${chosen.length ? chosen.map(([k, q]) => `<div class="prow"><span>${itemIcon(k, 18)} ${rname(k)} <span class="mute" style="font-size:12px">have ${N(ch.inv[k] || 0)}</span></span><span class="row" style="gap:4px"><input type="number" min="1" step="1" max="${ch.inv[k] || 1}" value="${q}" style="width:6em" data-offerq="${actPrefix}|${esc(k)}" aria-label="Quantity"><button class="sm ghost" data-act="${actPrefix}rm" data-arg="${esc(k)}">×</button></span></div>`).join('') : '<p class="mute" style="margin:0;font-size:14px">No items added.</p>'}</div>
    ${chosen.length < max ? `<div class="row" style="gap:6px;margin-top:8px"><select id="${actPrefix}pick" aria-label="Item to add" style="flex:1;min-width:0"><option value="">Add an item…</option>${keys.filter(k => !(k in o.items)).map(k => `<option value="${esc(k)}">${esc(ITEM(k).name)} (${N(ch.inv[k])})</option>`).join('')}</select><button class="sm" data-act="${actPrefix}add">Add</button></div>` : `<p class="mute" style="font-size:13px">Up to ${max} different items.</p>`}`;
}
function readOffer(prefix, o) {
  const g = document.getElementById(prefix + 'gold'); if (g) o.gold = Math.max(0, Math.floor(+g.value || 0));
  document.querySelectorAll(`[data-offerq^="${prefix}|"]`).forEach(el => { const k = el.dataset.offerq.slice(prefix.length + 1); o.items[k] = Math.max(1, Math.floor(+el.value || 1)); });
  return o;
}

// ---------- Mailbox ----------
function tabMail() {
  const g = socGate(); if (g) return `<h2>Mailbox</h2>${g}`;
  if (soc.mailList === null && !soc.mailLoading) { soc.mailLoading = true; rpc('tf_mail_list').then(r => { soc.mailList = r || []; }).catch(e => { soc.err = e.message; soc.mailList = []; }).finally(() => { soc.mailLoading = false; if (tab === 'mail') renderMain(); }); }
  const list = soc.mailList || [];
  const gift = soc.gift, gf = gift && friendsOnly().find(f => f.id === gift.to);
  return `<div class="spread"><h2>Mailbox</h2><span class="row" style="gap:6px"><button class="sm" data-act="mailrefresh">Refresh</button><button class="sm pri" data-act="socgift" data-arg="">Send a gift</button></span></div>${errBox()}
    ${gift ? `<div class="card" style="margin-top:12px;border-color:var(--gold)"><div class="spread"><h3>Gift${gf ? ' to ' + esc(gf.name) : ''}</h3><button class="sm ghost" data-act="giftclose">Close</button></div>
      ${gf ? '' : `<div class="row" style="gap:4px;margin:8px 0">${friendsOnly().map(f => `<button class="chip" data-act="giftto" data-arg="${f.id}">${esc(f.name)}</button>`).join('') || '<span class="mute">Add a friend first.</span>'}</div>`}
      <p class="mute" style="font-size:13px;margin:4px 0 8px">Gifts arrive in their mailbox. Up to 5 different items, 20 gifts a day. You can gift up to 1,000 gold, or a quarter of the gold you’ve earned on the leaderboard if that’s more.</p>
      ${offerEditor(gift.offer, 5, 'gift')}
      <textarea id="giftnote" maxlength="200" placeholder="Add a note (optional)" style="width:100%;margin-top:8px;height:60px" aria-label="Note">${esc(gift.note || '')}</textarea>
      <div class="row" style="margin-top:8px"><button class="pri" data-act="giftsend" ${gf ? '' : 'disabled'}>Send gift</button></div><div class="err" id="gifterr"></div></div>` : ''}
    ${soc.me.admin ? adminMailPanel() : ''}
    <div class="grid" style="gap:6px;margin-top:12px">${soc.mailList === null ? '<p class="mute">Loading…</p>' : list.length ? list.map(m => { const has = +m.gold > 0 || Object.keys(m.items || {}).length; return `<div class="card mailrow ${m.claimed ? '' : 'new'}"><div class="spread"><b>${esc(m.subject || 'A letter')}</b><span class="mute" style="font-size:12px">${esc(m.from_name)} · ${new Date(m.at).toLocaleDateString()}</span></div>
      ${m.body ? `<p style="margin:6px 0;white-space:pre-wrap">${esc(m.body)}</p>` : ''}
      ${has ? `<div class="spread" style="margin-top:6px"><span>${m.claimed ? '<span class="mute">Collected:</span> ' : '🎁 '}${esc(offerText(m))}</span>${m.claimed ? `<button class="sm ghost" data-act="maildel" data-arg="${m.id}">Delete</button>` : `<button class="sm pri" data-act="mailclaim" data-arg="${m.id}">Collect to ${esc(ch.name)}</button>`}</div>` : `<div class="row" style="justify-content:flex-end"><button class="sm ghost" data-act="maildel" data-arg="${m.id}">Delete</button></div>`}
      <div class="mute" style="font-size:11px;margin-top:4px">Kept until ${new Date(m.expires).toLocaleDateString()}</div></div>`; }).join('') : '<p class="mute">Your mailbox is empty.</p>'}</div>`;
}

// ---------- Trading ----------
async function tradeSync() {
  try { soc.tradeList = await rpc('tf_trade_list'); } catch (e) { soc.err = e.message; return; }
  account.escrow = account.escrow || {};
  for (const t of soc.tradeList) {
    const esc_ = account.escrow[t.id];
    if (t.status === 'open') {
      if (esc_ && !t.my_ok) { returnEscrow(t.id, 'The trade with ' + t.with_name + ' changed, so your items came back. Check it again.'); }
      continue;
    }
    if (t.settled && !esc_) continue;
    if (esc_ && esc_.cid !== ch.id) continue; // the character holding the escrow must be playing
    try {
      const r = await rpc('tf_trade_settle', { p_id: t.id });
      if (r.already && !esc_) continue;
      if (r.status === 'done') {
        if (!esc_) { addLog('sys', `Trade with ${t.with_name} finished, but your side was never put up on this device.`); continue; }
        delete account.escrow[t.id];
        const got = giveOffer(r.theirs, 'a trade');
        addLog('lucky', `Trade with ${t.with_name} complete. You received ${got}.`); toast(`<b>Trade complete</b> · received ${esc(got)}`, 'verd');
      } else if (esc_) returnEscrow(t.id, `Trade with ${t.with_name} was cancelled. Your items came back.`);
    } catch (e) { soc.err = e.message; }
  }
  save();
}
function returnEscrow(id, msg) {
  const e = account.escrow && account.escrow[id]; if (!e) return;
  const owner = account.slots.find(c => c && c.id === e.cid);
  if (owner && owner !== ch) { owner.gold += e.offer.gold || 0; for (const [k, q] of Object.entries(e.offer.items || {})) owner.inv[k] = (owner.inv[k] || 0) + q; }
  else { ch.gold += e.offer.gold || 0; for (const [k, q] of Object.entries(e.offer.items || {})) addItem(k, q, true); }
  delete account.escrow[id]; addLog('sys', msg); toast(esc(msg)); dirty = true; save();
}
function tabTrade() {
  const g = socGate(); if (g) return `<h2>Trades</h2>${g}`;
  if (soc.tradeList === null || soc.tradeList === undefined) { tradeSync().then(() => tab === 'trade' && renderMain()); return '<h2>Trades</h2><p class="mute">Loading…</p>'; }
  const list = soc.tradeList, t = list.find(x => x.id === soc.sel) || list.find(x => x.status === 'open');
  if (t && soc.sel !== t.id) { soc.sel = t.id; soc.offer = null; }
  if (t && t.status === 'open' && !soc.offer) soc.offer = { id: t.id, gold: +t.mine.gold || 0, items: Object.assign({}, t.mine.items) };
  const esc_ = t && account.escrow && account.escrow[t.id];
  const changed = t && soc.offer && JSON.stringify({ g: soc.offer.gold, i: soc.offer.items }) !== JSON.stringify({ g: +t.mine.gold || 0, i: t.mine.items });
  const pane = !t ? '<p class="mute">No trade open. Start one from your Friends list.</p>' : `<div class="card" style="margin-top:12px">
      <div class="spread"><h3>Trade with ${esc(t.with_name)}</h3><span class="chip ${t.status === 'done' ? 'on' : ''}">${t.status === 'open' ? (t.my_ok && t.their_ok ? 'Done' : t.my_ok ? 'You confirmed' : t.their_ok ? 'They confirmed' : 'Open') : t.status === 'done' ? 'Complete' : 'Cancelled'}</span></div>
      <p class="mute" style="font-size:13px;margin:4px 0 10px">How it’s kept fair: both offers are on the server, and any change to either offer cancels both confirmations. The trade happens only when you both confirm the same offers. While you’re confirmed, your side is set aside so you can’t spend it twice.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));align-items:start">
        <div><h4 class="shopgrp">Your offer ${t.my_ok ? '<span class="verd">✓ confirmed</span>' : ''}</h4>${t.status === 'open' && !t.my_ok ? offerEditor(soc.offer, 8, 'tr') + `<div class="row" style="margin-top:8px"><button class="${changed ? 'pri' : ''}" data-act="trsave" ${changed ? '' : 'disabled'}>Update my offer</button></div>` : `<p>${esc(offerText(t.mine))}</p>`}</div>
        <div><h4 class="shopgrp">${esc(t.with_name)} offers ${t.their_ok ? '<span class="verd">✓ confirmed</span>' : ''}</h4><p>${esc(offerText(t.theirs))}</p></div>
      </div>
      <div class="err" id="trerr"></div>
      ${t.status === 'open' ? `<div class="row" style="margin-top:10px">${t.my_ok ? `<button data-act="trunconfirm" data-arg="${t.id}">Take back my confirmation</button>` : `<button class="pri" data-act="trconfirm" data-arg="${t.id}" ${changed ? 'disabled title="Update your offer first"' : ''}>Confirm this trade</button>`}<button class="ghost" data-act="trcancel" data-arg="${t.id}">Cancel trade</button><button class="sm" data-act="trrefresh">Refresh</button></div>`
        : t.status === 'done' && esc_ && esc_.cid !== ch.id ? `<p class="mute">Switch to ${esc((account.slots.find(c => c && c.id === esc_.cid) || {}).name || 'the character who confirmed')} to receive this trade.</p>` : ''}
    </div>`;
  return `<div class="spread"><h2>Trades</h2><button class="sm" data-act="trrefresh">Refresh</button></div>${errBox()}
    ${list.length ? `<div class="row" style="gap:6px;margin-top:10px">${list.map(x => `<button class="chip ${t && x.id === t.id ? 'on' : ''}" data-act="trsel" data-arg="${x.id}">${esc(x.with_name)} · ${x.status === 'open' ? 'open' : x.status === 'done' ? 'complete' : 'cancelled'}</button>`).join('')}</div>` : ''}${pane}`;
}

// ---------- Handlers ----------
const socErr = (id, e) => { const el = document.getElementById(id); const m = (e && e.message) || String(e); if (el) el.textContent = m; else toast(esc(m)); };
const SOCIAL_HANDLERS = {
  socrefresh: () => socRefresh(),
  socname: async () => { const v = $('#socname').value.trim(), p = nameProblem(v); if (p) { socErr('socerr', p); return; } try { await rpc('tf_set_profile', { p_name: v }); await socRefresh(); renderMain(); toast('Display name saved.', 'verd'); } catch (e) { socErr('socerr', e); } },
  soccopy: async () => { try { await navigator.clipboard.writeText(soc.me.code); toast('Friend code copied.'); } catch (e) { toast('Your friend code is ' + esc(soc.me.code)); } },
  socadd: async () => { const v = $('#socadd').value.trim(); if (!v) return; try { const r = await rpc('tf_friend_add', { p_target: v }); toast({ sent: 'Friend request sent.', accepted: 'You’re now friends!', already: 'You’re already friends.', pending: 'Request already sent.' }[r] || 'Done.', 'verd'); await socRefresh(); renderMain(); } catch (e) { socErr('socerr', e); } },
  socaccept: async id => { try { await rpc('tf_friend_respond', { p_other: id, p_accept: true }); await socRefresh(); renderMain(); } catch (e) { toast(esc(e.message)); } },
  socdecline: async id => { try { await rpc('tf_friend_respond', { p_other: id, p_accept: false }); await socRefresh(); renderMain(); } catch (e) { toast(esc(e.message)); } },
  socremove: async id => { try { await rpc('tf_friend_remove', { p_other: id }); closeModal(); await socRefresh(); renderMain(); } catch (e) { toast(esc(e.message)); } },
  socunblock: async id => { try { await rpc('tf_block', { p_other: id, p_on: false }); await socRefresh(); renderMain(); } catch (e) { toast(esc(e.message)); } },
  socblock: async id => { try { await rpc('tf_block', { p_other: id, p_on: true }); closeModal(); soc.msgs = {}; await socRefresh(); renderMain(); toast('Blocked. You won’t see their messages.'); } catch (e) { toast(esc(e.message)); } },
  socmore: id => { const f = soc.friends.find(x => x.id === id); modal(`<h3>${esc(f.name)}</h3><p class="mute">${esc(f.code)}</p><div class="row" style="margin-top:12px"><button data-act="socremove" data-arg="${id}">Remove friend</button><button data-act="socblock" data-arg="${id}">Block</button><button class="ghost" data-act="close">Close</button></div>`); },
  socwho: a => { const [id, name] = a.split('|'); const fr = soc.friends.find(f => f.id === id); modal(`<h3>${esc(name)}</h3><div class="row" style="margin-top:12px">${fr ? '' : `<button class="pri" data-act="socaddname" data-arg="${esc(name)}">Add friend</button>`}<button data-act="socblock" data-arg="${esc(id)}">Block</button><button class="ghost" data-act="close">Close</button></div>`); },
  socaddname: async n => { try { const r = await rpc('tf_friend_add', { p_target: n }); closeModal(); toast(r === 'accepted' ? 'You’re now friends!' : 'Friend request sent.', 'verd'); socRefresh(); } catch (e) { toast(esc(e.message)); } },
  socdm: id => { soc.chan = 'dm:' + id; HANDLERS.tab('chat'); },
  socchan: k => { soc.chan = k; soc.err = ''; renderMain(); chatLoop(); },
  chatsend: async () => { const el = $('#chatin'); if (!el) return; const v = el.value.trim(); if (!v) return; try { await rpc('tf_chat_send', { p_channel: soc.chan, p_body: v }); el.value = ''; soc.err = ''; await chatFetch(); el.focus(); } catch (e) { soc.err = e.message; chatPaint(false); } },
  socgift: id => { soc.gift = { to: id || null, offer: { gold: 0, items: {} }, note: '' }; if (tab !== 'mail') HANDLERS.tab('mail'); else renderMain(); },
  giftto: id => { readOffer('gift', soc.gift.offer); soc.gift.to = id; renderMain(); },
  giftclose: () => { soc.gift = null; renderMain(); },
  giftadd: () => { readOffer('gift', soc.gift.offer); soc.gift.note = $('#giftnote').value; const k = $('#giftpick').value; if (k) soc.gift.offer.items[k] = 1; renderMain(); },
  giftrm: k => { readOffer('gift', soc.gift.offer); soc.gift.note = $('#giftnote').value; delete soc.gift.offer.items[k]; renderMain(); },
  giftsend: async () => {
    const o = readOffer('gift', soc.gift.offer), note = $('#giftnote').value, bad = haveOffer(o);
    if (bad) { socErr('gifterr', bad); return; }
    if (!o.gold && !Object.keys(o.items).length) { socErr('gifterr', 'Add gold or an item.'); return; }
    try { await rpc('tf_gift_send', { p_to: soc.gift.to, p_gift: o, p_note: note }); takeOffer(o); save(); addLog('sys', `Sent ${offerText(o)} to ${friendName(soc.gift.to)}.`); toast('Gift sent!', 'verd'); soc.gift = null; renderMain(); }
    catch (e) { socErr('gifterr', e); }
  },
  mailrefresh: () => { soc.mailList = null; socRefresh(); renderMain(); },
  mailclaim: async id => { try { const r = await rpc('tf_mail_claim', { p_id: +id }); const got = giveOffer(r, 'the mailbox'); toast(`Collected ${esc(got)}.`, 'verd'); addLog('lucky', `From the mailbox: ${got}.`); soc.mailList = null; await socRefresh(); renderMain(); } catch (e) { toast(esc(e.message)); soc.mailList = null; renderMain(); } },
  maildel: async id => { try { await rpc('tf_mail_delete', { p_id: +id }); soc.mailList = (soc.mailList || []).filter(m => m.id !== +id); renderMain(); } catch (e) { toast(esc(e.message)); } },
  soctrade: async id => { try { const tid = await rpc('tf_trade_open', { p_with: id }); soc.sel = +tid; soc.offer = null; soc.tradeList = null; HANDLERS.tab('trade'); } catch (e) { toast(esc(e.message)); } },
  trsel: id => { soc.sel = +id; soc.offer = null; renderMain(); },
  trrefresh: async () => { soc.offer = null; await tradeSync(); renderMain(); },
  tradd: () => { readOffer('tr', soc.offer); const k = $('#trpick').value; if (k) soc.offer.items[k] = 1; renderMain(); },
  trrm: k => { readOffer('tr', soc.offer); delete soc.offer.items[k]; renderMain(); },
  trsave: async () => { const o = readOffer('tr', soc.offer), bad = haveOffer(o); if (bad) { socErr('trerr', bad); return; } try { await rpc('tf_trade_offer', { p_id: soc.offer.id, p_offer: { gold: o.gold, items: o.items } }); soc.offer = null; await tradeSync(); renderMain(); } catch (e) { socErr('trerr', e); } },
  trconfirm: async id => {
    const t = soc.tradeList.find(x => x.id === +id), bad = haveOffer(t.mine); if (bad) { socErr('trerr', bad); return; }
    try {
      takeOffer(t.mine); account.escrow = account.escrow || {}; account.escrow[t.id] = { cid: ch.id, offer: t.mine }; save();
      const r = await rpc('tf_trade_confirm', { p_id: t.id, p_version: t.version });
      if (r.status === 'done') toast('Both confirmed. Finishing the trade…', 'verd');
      await tradeSync(); renderMain();
    } catch (e) { returnEscrow(+id, 'Your items came back: ' + e.message); soc.offer = null; await tradeSync(); renderMain(); }
  },
  trunconfirm: async id => { try { await rpc('tf_trade_unconfirm', { p_id: +id }); returnEscrow(+id, 'Confirmation taken back; your items are back.'); await tradeSync(); renderMain(); } catch (e) { toast(esc(e.message)); } },
  trcancel: async id => { try { await rpc('tf_trade_cancel', { p_id: +id }); soc.offer = null; await tradeSync(); renderMain(); } catch (e) { toast(esc(e.message)); } },
};
document.addEventListener('change', e => {
  const t = e.target; if (!t) return;
  if (t.id === 'giftgold' && soc.gift) soc.gift.offer.gold = Math.max(0, Math.floor(+t.value || 0));
  if (t.id === 'trgold' && soc.offer) { soc.offer.gold = Math.max(0, Math.floor(+t.value || 0)); renderMain(); }
  const q = t.dataset && t.dataset.offerq; if (q) { const p = q.split('|')[0], k = q.slice(q.indexOf('|') + 1), o = p === 'gift' ? soc.gift && soc.gift.offer : soc.offer; if (o) o.items[k] = Math.max(1, Math.floor(+t.value || 1)); if (p === 'tr') renderMain(); }
});
setInterval(() => { if (screen === 'game' && socOn() && !document.hidden && Date.now() - soc.lastTick > 60000) socRefresh(); }, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && screen === 'game' && socOn() && Date.now() - soc.lastTick > 15000) { socRefresh(); if (tab === 'chat') chatLoop(); } });

// ---------- Admin letters (v0.11a) ----------
let adminDraft = { to: '', subject: '', body: '', gold: 0, items: {} };
function adminItemKeys() {
  const keys = new Set([...RES.map(r => r.id), ...Object.keys(ITEMS)]);
  return [...keys].filter(k => { try { return acceptItem(k); } catch (e) { return false; } }).sort((a, b) => ITEM(a).name.localeCompare(ITEM(b).name));
}
function adminMailPanel() {
  const d = adminDraft, keys = adminItemKeys();
  return `<details class="card" style="margin-top:12px;border-color:var(--ember)" ${d.open ? 'open' : ''}><summary><b>Admin: send a letter</b> <span class="mute" style="font-size:13px">to one player or everyone</span></summary>
    <div class="grid" style="gap:8px;margin-top:10px;max-width:640px">
      <input id="admto" placeholder="Display name (leave empty for everyone)" value="${esc(d.to)}" aria-label="Recipient display name">
      <input id="admsubj" maxlength="80" placeholder="Subject" value="${esc(d.subject)}" aria-label="Subject">
      <textarea id="admbody" maxlength="2000" placeholder="Message" style="height:90px" aria-label="Message">${esc(d.body)}</textarea>
      <div class="row" style="gap:6px;align-items:center"><label class="mute" for="admgold" style="font-size:14px">Gold</label><input id="admgold" type="number" min="0" step="1" value="${d.gold || 0}" style="width:10em"></div>
      <div class="grid" style="gap:4px">${Object.entries(d.items).map(([k, q]) => `<div class="prow"><span>${itemIcon(k, 18)} ${rname(k)}</span><span class="row" style="gap:4px"><input type="number" min="1" step="1" value="${q}" style="width:7em" data-admq="${esc(k)}" aria-label="Quantity"><button class="sm ghost" data-act="admrm" data-arg="${esc(k)}">×</button></span></div>`).join('')}</div>
      <div class="row" style="gap:6px"><select id="admpick" aria-label="Item to attach" style="flex:1;min-width:0"><option value="">Attach an item…</option>${keys.filter(k => !(k in d.items)).map(k => `<option value="${esc(k)}">${esc(ITEM(k).name)}</option>`).join('')}</select><button class="sm" data-act="admadd">Add</button></div>
      <div class="row"><button class="pri" data-act="admsend">Send letter</button></div><div class="err" id="admerr"></div>
      <p class="mute" style="font-size:12px;margin:0">Letters to everyone reach every player who has picked a display name. Attachments are created by the server, not taken from your inventory.</p>
    </div></details>`;
}
function readAdmin() {
  const d = adminDraft, v = id => (document.getElementById(id) || {}).value;
  d.to = v('admto') || ''; d.subject = v('admsubj') || ''; d.body = v('admbody') || ''; d.gold = Math.max(0, Math.floor(+v('admgold') || 0)); d.open = true;
  document.querySelectorAll('[data-admq]').forEach(el => { d.items[el.dataset.admq] = Math.max(1, Math.floor(+el.value || 1)); });
  return d;
}
Object.assign(SOCIAL_HANDLERS, {
  admadd: () => { const d = readAdmin(), k = $('#admpick').value; if (k) d.items[k] = 1; renderMain(); },
  admrm: k => { readAdmin(); delete adminDraft.items[k]; renderMain(); },
  admsend: async () => {
    const d = readAdmin();
    if (!d.subject.trim()) { socErr('admerr', 'Add a subject.'); return; }
    const who = d.to.trim() ? d.to.trim() : 'EVERY player';
    if (!confirm(`Send "${d.subject}" to ${who}?`)) return;
    try {
      const n = await rpc('tf_admin_mail_to', { p_name: d.to.trim() || null, p_subject: d.subject, p_body: d.body, p_gift: { gold: d.gold, items: d.items } });
      toast(`Letter sent to ${n} player${n === 1 ? '' : 's'}.`, 'verd'); adminDraft = { to: '', subject: '', body: '', gold: 0, items: {} }; soc.mailList = null; await socRefresh(); renderMain();
    } catch (e) { socErr('admerr', e); }
  },
  chatdel: async id => { try { await rpc('tf_chat_delete', { p_id: +id }); const l = soc.msgs[soc.chan] || []; const i = l.findIndex(m => m.id === +id); if (i >= 0) l.splice(i, 1); chatPaint(false); } catch (e) { toast(esc(e.message)); } },
});
