// ============================================================
// v2.0c — Home screen, phone bottom bar, collapsible sidebar.
// ============================================================
const isPhone = () => window.innerWidth <= 900;
// Bottom-bar groups (phone). Each opens a sheet of its pages.
const BNAV = [
  ['home', 'Home', '⌂', null],
  ['skills', 'Skills', '⚒', ['Gathering', 'Crafting']],
  ['adventure', 'Adventure', '⚔', ['Adventure']],
  ['social', 'Social', '☺', ['Social']],
  ['more', 'More', '☰', ['You', 'Town', 'Misc']],
];
const navGroupOf = t => { if (t === 'home') return 'home'; for (const [id, , , gs] of BNAV) if (gs && NAV.some(([g, items]) => gs.includes(g) && items.some(([i]) => i === t))) return id; return 'more'; };
function bnavBadge(id) {
  if (id === 'skills') return ch.actions.some(a => ACT(a.res).kind !== 'combat') ? '<span class="dot"></span>' : '';
  if (id === 'adventure') return (ch.quest.done && ch.qactive.some(q => questHave(q) >= q.need)) ? '<span class="dot"></span>' : '';
  if (id === 'more') return (tabOpen('events') && ch.daily && !ch.daily.claimed) || (tabOpen('games') && typeof rwPlayedToday === 'function' && !rwPlayedToday()) || (ch.gate && ch.gate.fresh && Object.keys(ch.gate.fresh).length) ? '<span class="dot"></span>' : '';
  if (id === 'social') { const n = (typeof soc !== 'undefined' && soc.me ? soc.mail || 0 : 0) + (typeof fb !== 'undefined' && fb.unread ? fb.unread : 0); return n ? `<span class="bcount">${n}</span>` : ''; }
  return '';
}
function renderBnav() {
  const el = document.getElementById('bnav'); if (!el || !ch) return;
  const cur = navGroupOf(tab);
  el.innerHTML = BNAV.map(([id, n, ic]) => `<button class="${cur === id ? 'on' : ''}" data-act="${id === 'home' ? 'tab' : 'bsheet'}" data-arg="${id}" aria-label="${n}"><span class="bic" aria-hidden="true">${ic}</span><span>${n}</span>${bnavBadge(id)}</button>`).join('');
}
function bsheet(id) {
  const g = BNAV.find(b => b[0] === id); if (!g) return;
  const groups = NAV.filter(([name]) => g[3].includes(name));
  const running = new Set(ch.actions.map(a => ACT(a.res).skill));
  modal(`<div class="spread"><h3>${g[1]}</h3><button class="sm ghost" data-act="close" aria-label="Close">✕</button></div>` + groups.map(([name, items]) => `<div class="mute bsh-h">${name}</div><div class="bsh-grid">${items.filter(([i]) => i !== 'debug' || isDev()).map(([i, n]) => `<button class="${tab === i ? 'on' : ''} ${tabOpen(i) ? '' : 'locked'}" data-act="bgo" data-arg="${i}">${tabOpen(i) ? (SKILLS[i] ? skillIcon(i) : '') : '<span class="lockico">🔒</span>'}<span>${n}${navNew(i)}</span>${SKILLS[i] ? `<small class="mute">Lv ${ch.skills[i].level}</small>` : ''}${running.has(i) ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>`).join(''));
  const m = document.querySelector('.modal'); if (m) m.classList.add('sheet');
}
const skillIcon = s => { try { const o = (CHAIN[s] || RECIPES_BY[s] || [])[0]; return o ? (o.inputs ? actIcon(o) : resIcon(o)) : ''; } catch (e) { return ''; } };

// ---------- Home ----------
// v2.5: the next few unlocks, closest first.
function homeSoon() {
  if (!ch.gate || ch.gate.all) return '';
  const soon = Object.keys(GATES).filter(id => !tabOpen(id) && NAV.some(([, it]) => it.some(([x]) => x === id))).map(id => [id, gateBest(id)]).sort((a, b) => gateNear(a[1]) - gateNear(b[1])).slice(0, 3);
  if (!soon.length) return '';
  return `<div class="card"><b>Coming up</b><div class="homeneeds">${soon.map(([id]) => `<button class="chip locked" data-act="tab" data-arg="${id}">🔒 ${esc(tabName(id))} <span class="mute">· ${esc(gateText(id))}</span></button>`).join('')}</div></div>`;
}
function homeNeeds() {
  const n = [];
  if (ch.daily && !ch.daily.claimed) n.push(['events', '★ Daily reward ready']);
  if (typeof rwPlayedToday === 'function' && !rwPlayedToday()) n.push(['games', '\u{1F524} Today\u2019s Runeword']);
  if (!ch.quest.done) n.push(['quests', `Quest ${ch.quest.step + 1}/10: ${TUTORIAL_TITLES[ch.quest.step]}`]);
  else if (ch.qactive.some(q => questHave(q) >= q.need)) n.push(['quests', '✔ Quest ready to hand in']);
  if (typeof soc !== 'undefined' && soc.me && soc.mail) n.push(['mail', `✉ ${soc.mail} mail`]);
  const chests = Object.keys(ch.inv).filter(k => ITEMS[k] && ITEMS[k].type === 'chest').reduce((s, k) => s + ch.inv[k], 0);
  if (chests) n.push(['inv', `\u{1F381} ${chests} chest${chests > 1 ? 's' : ''} to open`]);
  if (ch.unspent) n.push(['char', `${ch.unspent} stat point${ch.unspent > 1 ? 's' : ''} to spend`]);
  if (ch.skillPts) n.push(['talents', `${ch.skillPts} talent point${ch.skillPts > 1 ? 's' : ''} to spend`]);
  if (typeof fb !== 'undefined' && fb.unread) n.push(['chat', `✉ ${fb.unread} new feedback`]);
  if (!ch.actions.length) n.push([GATHER_SKILLS.find(x => tabOpen(x)) || 'mining', 'Nothing running: start something']);
  return n.filter(([id]) => tabOpen(id));
}
function homeActHtml() {
  const d = D(), used = staminaUsed();
  return `<div class="spread"><b>Running</b><span class="row" style="gap:6px"><span class="mute" style="font-size:14px" title="${esc(d.staminaParts.map(([n, v]) => n + ' ' + v).join(' · '))}">Stamina ${used}/${d.stamina}</span>${ch.actions.length ? '<button class="sm" data-act="stopall">Stop all</button>' : ''}</span></div>
    ${ch.actions.length ? ch.actions.map(a => actSlotHtml(a)).join('')
      : '<p class="mute" style="margin:6px 0 0">Nothing running.</p>'}`;
}
function tabHome() {
  const now = Date.now(), pots = Object.entries(ch.potions).filter(([, p]) => p.until > now);
  const a = sceneAction(), last = (ch.log || []).slice(0, 5);
  return `<div class="home">
    <div class="card homestage"><div class="spread"><span><b>${esc(ch.name)}</b> <span class="mute" style="font-size:14px">${ch.travel ? 'travelling' : a ? esc(a.name) : 'resting'} · ${esc(REGION_BY[ch.loc].name)}</span></span></div>
      ${account.settings.anim === false ? `<div class="mute" style="padding:20px 0;text-align:center">Animations are off (Settings → Comfort).</div>` : '<div class="scene-slot homescene"></div>'}
      ${pots.length ? `<div class="row" style="gap:6px;margin-top:8px">${pots.map(([cat, p]) => `<span class="chip">${POTION_CATS[cat]} ${esc(ITEMS[p.id].name)} <b data-live="pot:${cat}"></b></span>`).join('')}</div>` : ''}</div>
    <div class="card" id="homeact">${homeActHtml()}</div>
    <div class="card"><b>Needs you</b><div class="homeneeds">${homeNeeds().map(([t, s]) => `<button class="chip" data-act="tab" data-arg="${t}">${esc(s)}</button>`).join('') || '<span class="mute">All caught up.</span>'}</div></div>${homeSoon()}
    <div class="card"><b>Recent</b><div class="log" style="margin-top:6px">${last.map(l => `<div class="${l.k === 'bad' ? 'bad' : l.k === 'lucky' ? 'k-lucky' : ''}">${esc(l.s)}</div>`).join('') || '<div class="mute">Nothing yet.</div>'}</div></div>
  </div>`;
}
const HOME_HANDLERS = {
  bsheet: id => bsheet(id),
  bgo: t => { closeModal(); HANDLERS.tab(t); },
  navgrp: g => { const c = account.settings.navCollapsed = account.settings.navCollapsed || {}; if (c[g]) delete c[g]; else c[g] = 1; save(); renderNav(); },
};

// ---------- Active buffs (top-bar button) ----------
function buffsModal() {
  const now = Date.now(), list = Object.entries(ch.potions).filter(([, p]) => p.until > now && ITEMS[p.id]);
  modal(`<div class="spread"><h3>Active buffs</h3><button class="sm ghost" data-act="close" aria-label="Close">✕</button></div>
    ${list.length ? list.map(([cat, p]) => { const it = ITEMS[p.id], have = ch.inv[p.id] || 0, au = ch.autoUse && ch.autoUse[p.id];
      return `<div class="aslot" style="margin-top:8px">${itemIcon ? itemIcon(p.id) : ''}<div style="flex:1;min-width:0"><div class="spread"><b>${esc(it.name)}</b><b data-live="pot:${cat}"></b></div>
        <div class="mute" style="font-size:13px">${POTION_CATS[cat]} · ${esc(it.desc)}</div>
        <div class="row" style="gap:6px;margin-top:6px">${have ? `<button class="sm" data-act="drink" data-arg="${p.id}">${qs('stackPotion') ? 'Add time' : 'Use again'} (${N(have)} left)</button>` : '<span class="mute" style="font-size:13px">None left in your bag</span>'}${autoUsable(p.id) && have ? `<button class="sm ${au ? 'pri' : ''}" data-act="autouse" data-arg="${p.id}">${au ? 'Auto-use: on' : 'Auto-use'}</button>` : ''}</div></div></div>`; }).join('')
      : '<p class="mute">No buffs right now. Potions and buff meals from your inventory show up here.</p>'}
    <p class="mute" style="font-size:12px;margin:10px 0 0">One buff of each kind at a time. A stronger one replaces a weaker one, a weaker one can’t be used over a stronger one, and the same one adds its time${qs('stackPotion') ? ' (up to 24 hours)' : ' when "Stack potion time" is on'}.</p>`);
}
HOME_HANDLERS.buffs = () => buffsModal();
