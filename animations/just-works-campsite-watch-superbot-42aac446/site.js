/* site.js - the generated frontend: superbot.app/p/campsite-watch, "Site Watch".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the booked log row and .is-active on the Reservation tab; both
   are styled in site.css. The tab click swaps the checkout panel for the reservation panel through a
   :has() + sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the
   top bar's clock, the 15-minute cart hold counting down on the hero (ring, digits, the steps it ticks
   off, then the checked-out stamp) and the watch bar, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n0(n);
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** seconds since midnight -> "5:52:14 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** seconds -> "14:18", the hold timer's digits */
export function holdText(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/* the hold beat inside the browser scene: the countdown runs from HOLD_A to HOLD_B of p, while ad.js
   holds the scroll on the hero; checkout lands at HOLD_B and the stamp stays for the rest of the beat */
const HOLD_A = 0.06;
const HOLD_B = 0.27;
const ease = (x) => x * x * (3 - 2 * x);

/** p -> seconds of the hold used so far, 0 .. meta.holdUsed */
export function holdUsed(p, meta = fallback.meta) {
  return Math.round(meta.holdUsed * ease(clamp01((p - HOLD_A) / (HOLD_B - HOLD_A))));
}

/* ---------- inline icons: drawn glyphs, never photos ---------- */
const SVG = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  tent: '<path d="M12 4 3 20h18Z"/><path d="M12 4v16"/><path d="m12 20 3.5-6"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M14 6v12" stroke-dasharray="2 2.4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.5l2.2 11h11.1l2-8H6.4"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pine: '<path d="M12 3 6 11h3l-4 6h14l-4-6h3Z"/><path d="M12 17v4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
};
const ico = (name, cls = '') =>
  `<svg class="cw-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]}</svg>`;

const mark = (ok) => `<span class="cw-mark ${ok ? 'is-ok' : 'is-no'}">${ico(ok ? 'check' : 'x')}</span>`;

/* the ring: r 52 in a 120 box; its arc is the seconds left in the current minute of the hold */
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const ringOffset = (left) => {
  const inMinute = left % 60 === 0 && left > 0 ? 60 : left % 60;
  return (RING_C * (1 - inMinute / 60)).toFixed(2);
};

/* ---------- top bar (sticky, carries the tabs the kit clicks) ---------- */
function topBar(cfg, data) {
  return `<header class="cw-top">
  <div class="cw-topin">
    <div class="cw-brand">${ico('tent', 'cw-brandico')}<b>Site Watch</b><span class="cw-by">by Superbot</span></div>
    <nav class="cw-tabs">
      <span class="cw-tab cw-tab--1">${ico('eye')}Watch</span>
      <span class="cw-tab cw-tab--2">${ico('ticket')}Reservation<i>1</i></span>
    </nav>
    <div class="cw-status">
      <span class="cw-acct"><img src="./brand/recgov.svg" alt=""/>${esc(data.meta.user)}</span>
      <span class="cw-live"><i class="cw-dot"></i><span class="cw-clock">${clockText(data.meta.holdStart)}</span></span>
    </div>
  </div>
  <div class="cw-watchbar"><i class="cw-watchfill"></i></div>
</header>`;
}

/* ---------- hero: the photo, the headline, the hold timer, and the reservation card ---------- */
function holdCard(data) {
  const m = data.meta;
  const s = data.stay;
  const ticks = [
    { k: 'signed', label: 'Signed in', icon: 'lock' },
    { k: 'cart', label: 'In cart', icon: 'cart' },
    { k: 'details', label: 'Details filled', icon: 'user' },
    { k: 'paid', label: `Paid ${usd(s.total)}`, icon: 'card' },
  ]
    .map((x) => `<li class="cw-tick cw-tick--${x.k}"><span>${ico(x.icon)}</span>${esc(x.label)}</li>`)
    .join('');
  return `<article class="cw-hold">
  <div class="cw-ring">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="cw-ringtrack" cx="60" cy="60" r="${RING_R}"/>
      <circle class="cw-ringarc" cx="60" cy="60" r="${RING_R}" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${ringOffset(m.holdSecs)}"/>
    </svg>
    <div class="cw-ringtext"><b class="cw-holdleft">${holdText(m.holdSecs)}</b><small>left on hold</small></div>
  </div>
  <div class="cw-holdbody">
    <p class="cw-holdk">${ico('clock')}${esc(data.copy.holdH)} · Site ${esc(s.site)} · ${esc(s.campground)}</p>
    <p class="cw-holdstate"><span class="cw-holdnow">Checking out before the 15:00 hold runs out</span><span class="cw-stamp">${ico('check')}Checked out, ${holdText(m.holdSecs - m.holdUsed)} left</span></p>
    <ul class="cw-ticks">${ticks}</ul>
  </div>
</article>`;
}

function resCard(data) {
  const s = data.stay;
  return `<article class="cw-res">
  <div class="cw-resart"><img src="${esc(s.img)}" alt=""/>
    <span class="cw-resbadge cw-resbadge--cart">${ico('cart')}In your cart</span>
    <span class="cw-resbadge cw-resbadge--ok">${ico('check')}Reserved ${esc(data.meta.booked)}</span>
  </div>
  <div class="cw-resbody">
    <p class="cw-respark">${esc(s.park)}</p>
    <h2>${esc(s.campground)}<span>Site ${esc(s.site)}</span></h2>
    <dl class="cw-resrows">
      <div><dt>Dates</dt><dd><b>Jul 3 to 6</b><small>${s.nights} nights</small></dd></div>
      <div><dt>Site</dt><dd><b>Tent, up to ${s.people}</b><small>${esc(s.loop)}</small></dd></div>
      <div><dt>Total</dt><dd><b>${usd(s.total)}</b><small>${s.nights} × ${usd(s.nightly)} + ${usd(s.fee)} fee</small></dd></div>
    </dl>
  </div>
</article>`;
}

function hero(data) {
  const c = data.counts;
  return `<section class="cw-hero">
  <img class="cw-herobg" src="./img/hero.jpg" alt=""/>
  <div class="cw-heroin">
    <div class="cw-herotext">
      <p class="cw-kicker">${ico('bell')}${esc(data.copy.kicker)}</p>
      <h1>${esc(data.copy.heroH1)}</h1>
      <p class="cw-dek">${esc(data.copy.heroDek)}</p>
      ${holdCard(data)}
      <ul class="cw-stats">
        <li><b>${n0(c.checks)}</b><span>checks, every ${c.every} s</span></li>
        <li><b>${n0(c.openings)}</b><span>openings seen</span></li>
        <li><b>${n0(c.skipped)}</b><span>passed over</span></li>
        <li class="cw-stat--hot"><b>${data.meta.holdUsed} s</b><span>cart to paid</span></li>
      </ul>
    </div>
    ${resCard(data)}
  </div>
</section>`;
}

/* ---------- what counts + the availability log (the hover lands on the booked row) ---------- */
function rulesSection(data) {
  const s = data.stay;
  const rules = [
    { icon: 'pin', label: 'Campground', value: `${s.campground}, ${s.area.split(',')[0]}`, note: `Recreation.gov #${s.id}` },
    { icon: 'cal', label: 'Dates', value: 'Jul 3 to 6, all 3', note: 'No partial stays' },
    { icon: 'tent', label: 'Site', value: 'Tent, fits 4', note: 'No RV-only sites' },
    { icon: 'clock', label: 'Check', value: `Every ${data.counts.every} s`, note: 'Day and night' },
  ];
  const chips = rules
    .map(
      (r) => `<li class="cw-rule">
      <span class="cw-rulei">${ico(r.icon)}</span>
      <span class="cw-rulet"><small>${esc(r.label)}</small><b>${esc(r.value)}</b><em>${esc(r.note)}</em></span>
    </li>`,
    )
    .join('');
  const rows = data.log
    .map(
      (l) => `<div class="cw-row${l.booked ? ' cw-row--booked' : ''}">
      <span class="cw-rtime"><b>${esc(l.day)}</b><small>${esc(l.time)}</small></span>
      <span class="cw-rsite">Site ${esc(l.site)}</span>
      <span class="cw-rnights">${esc(l.nights)}</span>
      <span class="cw-rkind">${esc(l.kind)}</span>
      <span class="cw-rresult">${mark(!!l.booked)}${esc(l.result)}</span>
    </div>`,
    )
    .join('');
  return `<section class="cw-rules">
  <div class="cw-sech"><h2>What counts as a catch</h2><span>${esc(s.campground)} · ${esc(s.park)}</span></div>
  <ul class="cw-rulelist">${chips}</ul>
  <div class="cw-log">
    <div class="cw-loghead"><p>${esc(data.copy.logH)}</p><span>${ico('eye')}Watching since ${esc(data.meta.since)}</span></div>
    <div class="cw-row cw-row--h"><span>Opened</span><span>Site</span><span>Nights</span><span>Type</span><span>Result</span></div>
    ${rows}
  </div>
</section>`;
}

/* ---------- panel 1: checkout, second by second ---------- */
function checkoutPanel(data) {
  const icons = ['bell', 'lock', 'cart', 'user', 'card', 'mail'];
  const steps = data.checkout
    .map(
      (s, i) => `<li class="cw-step${s.left ? ' cw-step--hold' : ''}">
      <span class="cw-stepi">${ico(icons[i] || 'check')}</span>
      <span class="cw-stept"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span>
      <span class="cw-stepleft">${s.left ? `${esc(s.left)} left` : ''}</span>
      <time>${esc(s.time)}</time>
    </li>`,
    )
    .join('');
  return `<div class="cw-panel cw-panel--1">
  <div class="cw-sech"><h2>${esc(data.copy.checkoutH)}</h2><span>51 seconds, opening to confirmation</span></div>
  <ol class="cw-steps">${steps}</ol>
</div>`;
}

/* ---------- panel 2: the reservation, swapped in by the Reservation tab ---------- */
function reservationPanel(data) {
  const s = data.stay;
  const days = data.dates
    .map(
      (d) => `<li class="cw-day${d.in ? ' is-in' : ''}${d.edge ? ' is-edge' : ''}">
      <small>${esc(d.w)}</small><b>${d.d}</b><em>${d.edge ? esc(d.edge) : d.in ? 'Night' : ''}</em>
    </li>`,
    )
    .join('');
  const amen = s.amenities.map((a) => `<li>${ico('check')}${esc(a)}</li>`).join('');
  const notes = data.notes
    .map((n) => `<li><span>${ico('info')}</span><b>${esc(n.k)}</b><small>${esc(n.v)}</small></li>`)
    .join('');
  return `<div class="cw-panel cw-panel--2">
  <div class="cw-conf">
    <img src="./img/camp.jpg" alt=""/>
    <div class="cw-confin">
      <p>${esc(data.copy.reservationH)} · Recreation.gov</p>
      <h2>${esc(s.campground)}, Site ${esc(s.site)}</h2>
      <span class="cw-confno">${ico('ticket')}Confirmation <b>${esc(s.number)}</b></span>
    </div>
    <span class="cw-confok">${ico('check')}Reserved</span>
  </div>
  <div class="cw-resgrid">
    <div class="cw-cal">
      <p class="cw-calh">${ico('cal')}July · ${s.nights} nights</p>
      <ol class="cw-days">${days}</ol>
      <dl class="cw-facts">
        <div><dt>Arrive</dt><dd>${esc(s.arrive)}</dd></div>
        <div><dt>Leave</dt><dd>${esc(s.leave)}</dd></div>
        <div><dt>Party</dt><dd>4 people, ${s.vehicles} vehicle</dd></div>
        <div><dt>Paid</dt><dd>${usd(s.total)}, ${esc(s.card)}</dd></div>
        <div><dt>Booked</dt><dd>${esc(data.meta.bookedDay)}, ${esc(data.meta.booked)}</dd></div>
        <div><dt>Hold used</dt><dd>${data.meta.holdUsed} s of ${holdText(data.meta.holdSecs)}</dd></div>
      </dl>
    </div>
    <div class="cw-site">
      <p class="cw-calh">${ico('pine')}Site ${esc(s.site)} · ${esc(s.loop)}</p>
      <p class="cw-sitetype">${esc(s.type)}, up to ${s.people} people, elevation ${esc(s.elevation)}</p>
      <div class="cw-sitebox"><img src="./img/locker.jpg" alt=""/><ul class="cw-amen">${amen}</ul></div>
      <ul class="cw-notes">${notes}</ul>
    </div>
  </div>
</div>`;
}

/* ---------- the backups, still watched ---------- */
function watchSection(data) {
  const cards = data.watching
    .map(
      (w) => `<li class="cw-back">
      <div class="cw-backart"><img src="${esc(w.img)}" alt=""/><span>${ico('eye')}Watching</span></div>
      <div class="cw-backbody">
        <b>${esc(w.name)}</b><small>${esc(w.where)} · ${esc(w.note)}</small>
        <p><span>${ico('cal')}${esc(w.nights)}</span><em>${esc(w.last)}</em></p>
      </div>
    </li>`,
    )
    .join('');
  return `<section class="cw-watch">
  <div class="cw-sech"><h2>${esc(data.copy.watchH)}</h2><span>${esc(data.copy.watchDek)}</span></div>
  <ul class="cw-backs">${cards}</ul>
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/campsite-watch';
  return `<footer class="cw-foot"><span>${ico('tent')}Made by Superbot for ${esc(data.meta.user)}</span><span>${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(cfg, data) +
    hero(data) +
    rulesSection(data) +
    '<section class="cw-panels">' +
      checkoutPanel(data) +
      reservationPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
}

/* clock hook: the top bar clock, the cart hold on the hero and the watch bar, all functions of p */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = clamp01(Number(p) || 0);
  const m = fallback.meta;
  const used = holdUsed(t, m);
  const left = m.holdSecs - used;
  const out = used >= m.holdUsed;
  const clock = root.querySelector('.cw-clock');
  if (clock) clock.textContent = clockText(m.holdStart + used + Math.max(0, t - HOLD_B) * 40);
  const digits = root.querySelector('.cw-holdleft');
  if (digits) digits.textContent = holdText(left);
  const arc = root.querySelector('.cw-ringarc');
  if (arc) arc.setAttribute('stroke-dashoffset', ringOffset(left));
  const heroEl = root.querySelector('.cw-hero');
  if (heroEl) {
    heroEl.classList.toggle('is-cart', t >= HOLD_A);
    heroEl.classList.toggle('is-details', used >= 15);
    heroEl.classList.toggle('is-out', out);
  }
  const fill = root.querySelector('.cw-watchfill');
  if (fill) fill.style.width = (t * 100).toFixed(2) + '%';
}

export { build };
