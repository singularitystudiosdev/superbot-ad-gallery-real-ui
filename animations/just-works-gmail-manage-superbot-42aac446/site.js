/* site.js - the frontend superbot ships: "Inbox, handled".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners,
   no CSS animation. The kit toggles .is-hover / .is-active on the elements named in ad.js,
   so hover and click styling lives in site.css against those classes, never :hover. */

const DASH = ' · ';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function mark(src, cls, alt) {
  const n = el('img', cls);
  n.src = src;
  n.alt = alt || '';
  // no loading="lazy": the page is mounted twice (chat build card, then the Chrome viewport), and an image
  // that never enters the intersection viewport of one of those copies never completes loading at all.
  return n;
}

function add(parent, ...kids) {
  for (const k of kids) if (k) parent.appendChild(k);
  return parent;
}

const money = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.]/g, '')) || 0;
const usd = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const num = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const NAV = [
  ['Inbox', '12', true],
  ['Drafts', '9', false],
  ['Starred', '', false],
  ['Snoozed', '', false],
  ['Archive', '1,688', false],
  ['Unsubscribed', '41', false],
];

function rail(sum, calCount) {
  const aside = el('aside', 'iw-rail');

  const brand = el('div', 'iw-brand');
  add(brand, mark('./brand/gmail.svg', 'iw-brand-mark'), el('span', 'iw-brand-name', 'Gmail'));
  const unread = el('span', 'iw-brand-badge', num(sum.unread || 0));
  add(brand, unread);

  const nav = el('nav', 'iw-nav');
  for (const [label, count, on] of NAV) {
    const item = el('div', 'iw-nav-item' + (on ? ' is-on' : ''));
    add(item, el('span', 'iw-nav-label', label));
    if (count) add(item, el('span', 'iw-nav-count', count));
    add(nav, item);
  }

  const foot = el('div', 'iw-rail-foot');
  const cal = el('div', 'iw-cal');
  add(cal, mark('./brand/googlecalendar.svg', 'iw-cal-mark'),
    el('span', 'iw-cal-text', calCount + ' due dates read from Google Calendar'));
  const scan = el('div', 'iw-scan');
  add(scan, el('i', 'iw-scan-bar'));
  add(foot, cal, scan, el('p', 'iw-rail-note', 'superbot keeps working in the background. Nothing was deleted.'));

  add(aside, brand, nav, foot);
  return aside;
}

function topbar(sum) {
  const bar = el('header', 'iw-bar');
  const left = el('div', 'iw-bar-left');
  add(left, el('h1', 'iw-title', 'Inbox, handled'));
  add(left, el('p', 'iw-sub', 'superbot read ' + num(sum.unread || 0) + ' unread threads and left you the ones with a person on the other end.'));

  const right = el('div', 'iw-bar-right');
  const pill = el('span', 'iw-pill');
  add(pill, el('i', 'iw-pill-dot'), el('span', null, 'Gmail connected'));
  add(right, pill, el('button', 'iw-btn', 'Undo all'));

  add(bar, left, right);
  return bar;
}

function kpis(sum) {
  const row = el('section', 'iw-kpis');

  const lead = el('div', 'iw-kpi iw-kpi--lead');
  add(lead, el('span', 'iw-kpi-label', 'Unread this morning'));
  const run = el('div', 'iw-kpi-run');
  add(run, el('span', 'iw-kpi-num iw-kpi-num--was', num(sum.unread || 0)));
  add(run, el('span', 'iw-kpi-arrow', '→'));
  add(run, el('span', 'iw-kpi-num', String(sum.needYou || 0)));
  add(lead, run, el('span', 'iw-kpi-foot', 'threads need a person'));

  const tiles = [
    [String(sum.repliesDrafted || 0), 'replies drafted', 'written, not sent'],
    [num(sum.receiptsFiled || 0), 'receipts filed', 'in 2026 / Receipts'],
    [String(sum.sendersCut || 0), 'senders unsubscribed', 'no more newsletters'],
  ];
  add(row, lead);
  for (const [n, label, foot] of tiles) {
    const t = el('div', 'iw-kpi');
    add(t, el('span', 'iw-kpi-label', label));
    add(t, el('span', 'iw-kpi-num', n));
    add(t, el('span', 'iw-kpi-foot', foot));
    add(row, t);
  }
  return row;
}

function laneHead(title, sub, count) {
  const head = el('div', 'iw-lane-head');
  const hl = el('div', 'iw-lane-headline');
  add(hl, el('h2', 'iw-lane-title', title), el('span', 'iw-lane-count', count));
  add(head, hl, el('p', 'iw-lane-sub', sub));
  return head;
}

function mailCard(item) {
  const card = el('article', 'iw-mail');
  add(card, mark(item.img, 'iw-av', item.from));

  const body = el('div', 'iw-mail-body');
  const top = el('div', 'iw-mail-top');
  const meta = String(item.meta || '');
  const prefix = item.from + DASH;
  add(top, el('span', 'iw-from', item.from));
  add(top, el('span', 'iw-time', meta.startsWith(prefix) ? meta.slice(prefix.length) : meta));
  const tag = el('span', 'iw-tag');
  add(tag, el('span', 'iw-tag-idle', item.price), el('span', 'iw-tag-done', 'Sent'));
  add(top, tag);
  add(body, top, el('h3', 'iw-subject', item.title), el('p', 'iw-snippet', item.snippet));

  const reply = el('div', 'iw-reply');
  const rhead = el('div', 'iw-reply-head');
  add(rhead, el('span', 'iw-reply-label', 'Draft reply'), el('span', 'iw-reply-to', 'to ' + item.from));
  add(reply, rhead, el('p', 'iw-reply-text', item.draft));

  const actions = el('div', 'iw-reply-actions');
  const send = el('button', 'iw-send');
  add(send, el('span', 'iw-send-idle', 'Send'), el('span', 'iw-send-done', 'Sent'));
  add(actions, send, el('span', 'iw-sent-note', 'Sent just now'), el('span', 'iw-reply-hint', 'or edit it in Gmail first'));
  add(reply, actions);
  add(body, reply);
  add(card, body);
  return card;
}

function needsLane(replies) {
  const lane = el('section', 'iw-lane iw-lane--needs');
  add(lane, laneHead('Needs you', 'Every draft is written from the thread it answers, with your last three messages in that thread as the context.', String(replies.length)));
  const list = el('div', 'iw-mails');
  for (const item of replies) add(list, mailCard(item));
  add(lane, list);
  return lane;
}

function billsLane(bills) {
  const total = bills.reduce((a, b) => a + money(b.price), 0);
  const lane = el('section', 'iw-lane iw-lane--bills');
  add(lane, laneHead('Bills due', 'Three payments, dates pulled off the emails and matched to your calendar.', String(bills.length)));

  const list = el('div', 'iw-bills');
  for (const b of bills) {
    const row = el('div', 'iw-bill');
    add(row, mark(b.img, 'iw-av', b.from));
    const main = el('div', 'iw-bill-main');
    add(main, el('h3', 'iw-bill-name', b.from), el('p', 'iw-bill-note', b.snippet));
    add(row, main, el('span', 'iw-bill-due', 'Due ' + b.due), el('span', 'iw-bill-amt', b.price), el('button', 'iw-pay', 'Pay'));
    add(list, row);
  }
  const sum = el('div', 'iw-bill-total');
  add(sum, el('span', 'iw-bill-total-label', 'Total due this week'),
    el('span', 'iw-bill-total-amt', usd(total)),
    el('span', 'iw-bill-total-note', 'Card ending 4418 on file. Autopay is off for all three.'));
  add(lane, list, sum);
  return lane;
}

function handledLane(sum, handled) {
  const lane = el('section', 'iw-lane iw-lane--handled');
  add(lane, laneHead('Handled', num(sum.handled || 0) + ' threads left the inbox without you opening them.', 'auto'));
  const grid = el('div', 'iw-handled');
  for (const g of handled) {
    const card = el('div', 'iw-hcard');
    add(card, el('span', 'iw-hcount', num(g.count)), el('span', 'iw-hlabel', g.label), el('p', 'iw-hnote', g.note));
    add(grid, card);
  }
  add(lane, grid);
  return lane;
}

function unsubLane(sum, unsub) {
  const lane = el('section', 'iw-lane iw-lane--unsub');
  add(lane, laneHead('Unsubscribed', 'Cut one by one. The two senders you actually read stayed.', String(unsub.count || 0)));
  const wrap = el('div', 'iw-unsub');
  for (const name of unsub.senders) {
    const chip = el('span', 'iw-chip');
    add(chip, el('i', 'iw-chip-x', '×'), el('span', 'iw-chip-name', name));
    add(wrap, chip);
  }
  add(lane, wrap);
  add(lane, el('p', 'iw-unsub-foot', 'Nothing bounced back. 41 senders, 0 of your subscriptions that matter.'));
  return lane;
}

export default function build(root, ctx) {
  const data = (ctx && ctx.data) || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const handled = Array.isArray(data.handled) ? data.handled : [];
  const unsub = data.unsubscribed || { count: 0, senders: [] };
  const sum = data.summary || {};
  const cfg = (ctx && ctx.cfg) || {};
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/inbox';
  const calSrc = Array.isArray(cfg.sources) ? cfg.sources.filter((s) => s.id === 'calendar')[0] : null;
  const calCount = calSrc && calSrc.count ? num(calSrc.count) : '9';

  const app = el('div', 'iw-app');
  const main = el('main', 'iw-main');

  add(main, topbar(sum), kpis(sum));
  const lanes = el('div', 'iw-lanes');
  add(lanes, needsLane(items.filter((i) => i.draft)), billsLane(items.filter((i) => i.due)),
    handledLane(sum, handled), unsubLane(sum, unsub));
  add(main, lanes);

  const foot = el('footer', 'iw-foot');
  add(foot, el('span', 'iw-foot-text', 'Built by superbot for your Gmail.'), el('span', 'iw-foot-url', url));
  add(main, foot);

  add(app, rail(sum, calCount), main);
  root.appendChild(app);
}

/* clock driven detail: the thin progress line in the rail (p = browser scene progress 0..1) */
export function render(root, p) {
  root.style.setProperty('--iw-p', String(Math.max(0, Math.min(1, Number(p) || 0))));
}