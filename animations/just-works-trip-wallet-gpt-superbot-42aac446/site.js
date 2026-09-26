/* site.js - the generated frontend: superbot.app/p/trip-wallet, "Trips".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the merge counters, the live flight's gate block, the Maui
   points stay and the Marriott Free Night Award row, and .is-active on the Miles & points tab; all are
   styled in site.css. The tab click swaps the booking list for the wallet table through a :has() plus
   sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the five
   account counters ticking up (SYNC_A/SYNC_B), the merge beat (25 records collapsing to 11 bookings, see
   MERGE_A/MERGE_B), the live card's fields easing in (LIVE_A/LIVE_B), the timeline rows settling in turn
   (TL_A/TL_B) and the sync bar, all pure functions of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it booked, changed, cancelled
   or redeemed anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/* the sync beat inside the browser scene: the five accounts are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the duplicate confirmations collapse from MERGE_A to MERGE_B, both
   inside the first scroll hold in ad.js (f 0.13 to 0.3), so the finished 25 / 14 / 11 card holds on screen
   before the page moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.15;
const MERGE_A = 0.165;
const MERGE_B = 0.285;
/* the live card is the second hold (ad.js f 0.355 to 0.5, p 0.416 to 0.544): its gate, terminal, boarding,
   seat and confirmation ease in as it scrolls up (from f 0.3, p 0.367) and are all settled just after it
   lands, so the card holds about 1.3 s complete with the cursor on the gate block */
const LIVE_A = 0.3;
const LIVE_B = 0.375;
/* the timeline is the third hold (f 0.555 to 0.66, p 0.601 to 0.677): its eleven rows settle in turn while
   it scrolls in (from f 0.5, p 0.566) and are all still just before it lands */
const TL_A = 0.5;
const TL_B = 0.585;

export const syncDone = (p) => clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
export const mergeDone = (p) => clamp01((p - MERGE_A) / (MERGE_B - MERGE_A));
export const liveDone = (p) => clamp01((p - LIVE_A) / (LIVE_B - LIVE_A));
export const tripDone = (p) => clamp01((p - TL_A) / (TL_B - TL_A));

/* the sync card: tick i counts from 0 to its number over its own window, so the five accounts land one after
   another and the sixth tick (the trips) closes the card at g = 1 */
const TICK_STEP = 0.14;
const TICK_LEN = 0.3;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* the live dot's halo: one pulse per 1.4 s of scene time, so 10.5 / 1.4 = 7.5 pulses across the beat. A
   sawtooth on p, never a CSS animation, so every frame is still a pure function of p and of nothing else */
const PULSES = 7.5;

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  list: '<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  calendar: '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
  'triangle-alert': '<path d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  merge: '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4m-8-6v6M2 18h20"/>',
  hotel: '<path d="M10 22v-6.57M14 22v-6.57"/><path d="M2 22h20m-18 0V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"/><path d="M6 10h.01M6 14h.01M10 10h.01M10 14h.01M14 10h.01M14 14h.01"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2m0 4v2m0 4v2"/>',
  'timer-off': '<path d="M10 2h4m-9.4 9a8 8 0 0 0 1.7 8.7a8 8 0 0 0 8.7 1.7m-7.6-14a8 8 0 0 1 10.3 1a8 8 0 0 1 .9 10.2M2 2l20 20M12 12v-2"/>',
  'arrow-right': '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  seat: '<path d="M6 11V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6m0 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/><path d="M8 19v2m8-2v2"/>',
};

const ico = (name) =>
  `<svg class="tw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* an account tag: the account's mark plus its short name */
const appTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="tw-ltag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

const statusPill = (b) =>
  b.live
    ? `<span class="tw-pill tw-pill--live"><span class="tw-pdot"><span class="tw-phalo"></span></span>${esc(b.status)}</span>`
    : `<span class="tw-pill tw-pill--${b.status === 'Confirmed' ? 'ok' : b.status === 'Booked on points' ? 'pts' : 'plan'}">${esc(b.status)}</span>`;

function topBar(data) {
  const { counts, meta, accounts } = data;
  return (
    '<header class="tw-top">' +
      '<div class="tw-topin">' +
        '<span class="tw-brand"><img class="tw-brandico" src="./brand/app.svg" alt=""><b>Trips</b><span class="tw-by">by Superbot</span></span>' +
        '<nav class="tw-tabs">' +
          `<span class="tw-tab tw-tab--1">${ico('list')}Timeline <i>${n0(counts.bookings)}</i></span>` +
          `<span class="tw-tab tw-tab--2">${ico('credit-card')}Miles &amp; points <i>${n0(counts.wallets)}</i></span>` +
        '</nav>' +
        '<div class="tw-status">' +
          '<span class="tw-logs">' +
            accounts.map((a) => `<img src="${esc(a.logo)}" alt="">`).join('') +
            `${ico('lock')}Read-only` +
          '</span>' +
          `<span class="tw-synced"><span class="tw-dot"></span>Synced ${esc(meta.synced)}</span>` +
        '</div>' +
      '</div>' +
      '<div class="tw-syncbar"><span class="tw-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="tw-tick tw-tick--s${i + 1}"><img src="${esc(a.logo)}" alt=""><span>${esc(a.name)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="tw-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="tw-tick tw-tick--s${last + 1} tw-tick--trips"><span class="tw-tickico">${ico('route')}</span><span>Built into trips</span>` +
      `<b data-n="${counts.trips}" data-i="${last}">0</b><span class="tw-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="tw-sync">' +
      '<div class="tw-synchead">' +
        `<span class="tw-syncnow">${ico('refresh-cw')}${esc(data.copy.syncNow)}<span class="tw-synccount">0 of ${n0(counts.pulled)} records</span></span>` +
        `<span class="tw-stamp">${ico('circle-check')}${esc(data.copy.syncStamp)}</span>` +
      '</div>' +
      `<ul class="tw-ticks">${ticks.join('')}</ul>` +
      '<div class="tw-merge">' +
        '<span class="tw-pad tw-pad--merge"></span>' +
        '<div class="tw-mbar"><span class="tw-mun"></span><span class="tw-mdup"></span></div>' +
        '<div class="tw-mrow">' +
          `<span class="tw-mk"><b class="tw-pulled">${n0(counts.pulled)}</b>records pulled</span>` +
          `<span class="tw-mk tw-mk--dup"><b class="tw-dupnow">0</b>duplicate confirmations</span>` +
          `<span class="tw-mk tw-mk--uniq"><b class="tw-uniqnow">${n0(counts.pulled)}</b>bookings</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/* the card on the right of the hero: the shape of the whole trip set at a glance */
function tripCard(data) {
  const { counts, meta, stats, live, countdown } = data;
  return (
    '<aside class="tw-trips">' +
      `<span class="tw-tripk">${ico('map-pin')}${esc(meta.user)}</span>` +
      `<h2>${esc(`Your next ${counts.trips} trips`)}</h2>` +
      `<p class="tw-tripday">${ico('calendar')}${esc(`${meta.windowStart} to ${meta.windowEnd}`)}</p>` +
      '<ul class="tw-tripfacts">' +
        stats.map((s) =>
          `<li class="tw-fact tw-fact--${esc(s.key)}"><small>${esc(s.label)}</small><b>${esc(s.value)}</b><em>${esc(s.note)}</em></li>`,
        ).join('') +
      '</ul>' +
      '<div class="tw-next">' +
        `<div class="tw-nexth">${ico('plane')}Next up</div>` +
        `<div class="tw-nextrow"><b>${esc(live.flight)}</b><span>${esc(`${live.from.code} to ${live.to.code}`)}</span><em>Departs in ${esc(countdown)}</em></div>` +
        `<p class="tw-nextn">${ico('lock')}${esc(meta.readOnly)}</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts, meta } = data;
  return (
    '<section class="tw-hero">' +
      '<img class="tw-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="tw-heroin">' +
        '<div class="tw-herot">' +
          `<span class="tw-kicker">${ico('plane')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="tw-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="tw-stats">' +
            `<li><b>${n0(counts.bookings)}</b><span>bookings</span></li>` +
            `<li><b>${n0(counts.trips)}</b><span>trips</span></li>` +
            `<li class="tw-stat--flag"><b>${n0(counts.expiring)}</b><span>expiring soon</span></li>` +
            `<li class="tw-stat--ok"><b>${n0(counts.wallets)}</b><span>balances tracked</span></li>` +
          '</ul>' +
          `<p class="tw-herodate">${ico('clock')}${esc(`Read ${meta.dayLong} at ${meta.synced} ET`)}</p>` +
        '</div>' +
        tripCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the seat card beside the boarding pass: the booked seat in its row, plus the next 72 hours */
function seatCard(data) {
  const { seatmap, next72 } = data;
  const row = (r) => {
    const cells = seatmap.letters.map((l) => {
      const mine = `${r}${l}` === seatmap.picked;
      return `<i class="tw-cell${mine ? ' tw-cell--mine' : ''}">${esc(l)}</i>`;
    });
    return (
      `<li class="tw-maprow${r === seatmap.rows[1] ? ' tw-maprow--here' : ''}"><b>${r}</b>` +
      cells.slice(0, 3).join('') +
      '<span class="tw-aisle"></span>' +
      cells.slice(3).join('') +
      '</li>'
    );
  };
  return (
    '<aside class="tw-seatcard">' +
      '<div class="tw-seath" data-j="0">' +
        `<span class="tw-seatico">${ico('seat')}</span>` +
        `<span class="tw-seatt"><b>${esc(seatmap.title)}</b><small>${esc(seatmap.sub)}</small></span>` +
        `<span class="tw-seatband">${esc(seatmap.band)}</span>` +
      '</div>' +
      '<ul class="tw-map" data-j="0">' +
        `<li class="tw-maprow tw-maprow--h"><b></b>${seatmap.letters.slice(0, 3).map((l) => `<i>${esc(l)}</i>`).join('')}<span class="tw-aisle"></span>${seatmap.letters.slice(3).map((l) => `<i>${esc(l)}</i>`).join('')}</li>` +
        seatmap.rows.map(row).join('') +
      '</ul>' +
      `<p class="tw-seatnote" data-j="1">${ico('plane')}${esc(seatmap.note)}</p>` +
      '<div class="tw-n72" data-j="1">' +
        `<div class="tw-n72h">${ico('clock')}Next 72 hours</div>` +
        '<ul class="tw-n72l">' +
          next72.map((n) =>
            `<li><span class="tw-n72w">${esc(n.time ? `${n.day} · ${n.time}` : n.day)}</span><span class="tw-n72a">${esc(n.what)}</span></li>`,
          ).join('') +
        '</ul>' +
      '</div>' +
    '</aside>'
  );
}

/* the next-up live flight card: the one booking with live status at 1:40 PM */
function liveSection(data) {
  const { live, copy } = data;
  const cell = (j, small, big, note, cls) =>
    `<div class="tw-lcell${cls ? ' ' + cls : ''}" data-j="${j}"><small>${esc(small)}</small><b>${esc(big)}</b>${note ? `<em>${esc(note)}</em>` : ''}</div>`;
  return (
    '<section class="tw-live">' +
      `<div class="tw-sech"><h2>${esc(copy.liveTitle)}</h2><span>${esc(copy.liveDek)}</span></div>` +
      '<div class="tw-livecards">' +
        '<div class="tw-livecard">' +
          '<div class="tw-liveh">' +
            `<span class="tw-livepill"><span class="tw-pdot"><span class="tw-phalo"></span></span>${esc(live.status)}</span>` +
            `<span class="tw-livek">${esc(live.week)}</span>` +
            `<span class="tw-livec"><img src="${esc(accOf(data, live.carrier).logo)}" alt="">${esc(live.flight)}</span>` +
          '</div>' +
          '<div class="tw-liverow">' +
            `<div class="tw-apt"><b>${esc(live.from.code)}</b><span>${esc(live.from.city)}</span><em>${esc(live.outTime)}</em></div>` +
            `<div class="tw-arc"><span class="tw-arcico">${ico('plane')}</span><span class="tw-arcbar"></span><span class="tw-arcl">Departs in ${esc(data.countdown)}</span></div>` +
            `<div class="tw-apt tw-apt--r"><b>${esc(live.to.code)}</b><span>${esc(live.to.city)}</span><em>${esc(`${live.inTime}, ${live.inDay}`)}</em></div>` +
          '</div>' +
          '<div class="tw-livefoot">' +
            '<span class="tw-pad tw-pad--live"></span>' +
            '<div class="tw-live-gate">' +
              cell(0, 'Gate', live.gate, '') +
              cell(1, 'Terminal', live.terminal, '') +
              cell(2, 'Boards', live.boarding, '') +
              cell(3, 'Departure', live.outTime, 'from Newark') +
            '</div>' +
            '<div class="tw-live-pax">' +
              cell(0, 'Seat', live.seat, live.seatClass) +
              cell(1, 'Confirmation', live.conf, 'from Gmail', 'tw-lcell--mono') +
            '</div>' +
          '</div>' +
        '</div>' +
        seatCard(data) +
      '</div>' +
      `<p class="tw-livenote">${ico('info')}${esc(copy.liveNote)}</p>` +
    '</section>'
  );
}

function timelineSection(data) {
  const { trips, copy } = data;
  let r = 0;
  const groups = trips.map((t) => {
    const rows = t.bookings.map((b) => {
      const row =
        `<li class="tw-row tw-row--${esc(b.key)} tw-row--${esc(b.type)}" data-r="${r}">` +
          `<span class="tw-glyph"><img src="${esc(b.glyph)}" alt=""></span>` +
          `<span class="tw-rt"><b>${esc(b.title)}</b><small>${esc(b.when)}</small></span>` +
          `<span class="tw-conf">${esc(b.conf)}</span>` +
          `<span class="tw-seat">${esc(b.seat)}</span>` +
          statusPill(b) +
          `<span class="tw-srcs">${b.sources.map((id) => appTag(data, id)).join('')}</span>` +
          (b.key === 'lisbon-marriott' ? '<span class="tw-pad tw-pad--row"></span>' : '') +
        '</li>';
      r += 1;
      return row;
    }).join('');
    return (
      `<div class="tw-trip tw-trip--${esc(t.key)}">` +
        '<div class="tw-triph">' +
          `<span class="tw-tripn">${t.index + 1}</span>` +
          `<span class="tw-tript"><b>${esc(t.city)}</b><small>${esc(`${t.dates} · ${t.nights} nights`)}</small></span>` +
          `<span class="tw-tripm"><b>${esc(String(t.bookings.length))}</b><small>${t.bookings.length === 1 ? 'booking' : 'bookings'}</small></span>` +
          `<span class="tw-tripapps">${t.sources.map((id) => `<img src="${esc(accOf(data, id).logo)}" alt="">`).join('')}</span>` +
        '</div>' +
        `<ul class="tw-rows">${rows}</ul>` +
        `<p class="tw-tripnote">${ico('route')}${esc(t.note)}</p>` +
      '</div>'
    );
  }).join('');
  return (
    '<section class="tw-timeline">' +
      `<div class="tw-sech"><h2>${esc(copy.timelineH)}</h2><span>${esc(copy.timelineDek)}</span></div>` +
      groups +
    '</section>'
  );
}

function bookingsPanel(data) {
  const { bookings, counts, copy } = data;
  return (
    '<div class="tw-panel tw-panel--1">' +
      `<div class="tw-sech"><h2>${esc(copy.bookingsH)}</h2><span>${esc(copy.bookingsDek)}</span></div>` +
      '<div class="tw-table">' +
        '<div class="tw-brow tw-brow--h"><span>Booking</span><span>When</span><span>Confirmation</span><span>Seat or room</span><span>Found in</span><span>Status</span></div>' +
        bookings.map((b) =>
          `<div class="tw-brow tw-brow--${esc(b.key)}">` +
            `<span class="tw-bname"><img src="${esc(b.glyph)}" alt=""><span><b>${esc(b.title)}</b><small>${esc(`${b.tripName} · ${b.typeText}`)}</small></span></span>` +
            `<span class="tw-bwhen">${esc(b.when)}</span>` +
            `<span class="tw-bconf">${esc(b.conf)}</span>` +
            `<span class="tw-bseat">${esc(b.seat)}</span>` +
            `<span class="tw-srcs">${b.sources.map((id) => appTag(data, id)).join('')}</span>` +
            `<span class="tw-bstat">${statusPill(b)}</span>` +
          '</div>',
        ).join('') +
        `<div class="tw-more">${ico('merge')}${esc(`${counts.dupes} duplicate confirmations merged into the ${counts.bookings} rows above. ${counts.flights} flights and ${counts.stays} stays, nothing left doubled.`)}</div>` +
      '</div>' +
    '</div>'
  );
}

function walletPanel(data) {
  const { wallet, counts, copy, meta } = data;
  const rows = wallet.slice().sort((a, b) => (a.days == null ? 1e9 : a.days) - (b.days == null ? 1e9 : b.days));
  return (
    '<div class="tw-panel tw-panel--2">' +
      `<div class="tw-sech"><h2>${esc(copy.walletH)}</h2><span>${esc(copy.walletDek)}</span></div>` +
      '<div class="tw-wsum">' +
        `<span class="tw-wsumk"><b>${n0(counts.wallets)}</b>balances</span>` +
        `<span class="tw-wsumk tw-wsumk--flag"><b>${n0(counts.expiring)}</b>expiring within ${esc(String(meta.expiryWindow))} days</span>` +
        `<span class="tw-wsumk tw-wsumk--ok"><b>${n0(counts.noExpiry)}</b>with no expiry date</span>` +
        `<span class="tw-wsumk tw-wsumk--muted">${ico('clock')}Sorted by soonest expiry</span>` +
      '</div>' +
      '<div class="tw-table tw-table--w">' +
        '<div class="tw-wrow tw-wrow--h"><span>Program</span><span>Balance</span><span>Status</span><span>Expires</span></div>' +
        rows.map((w) =>
          `<div class="tw-wrow tw-wrow--${esc(w.key)}${w.flag ? ' tw-wrow--flag' : ''}">` +
            (w.key === 'freenight' ? '<span class="tw-pad tw-pad--wrow"></span>' : '') +
            `<span class="tw-wprog"><img src="${esc(w.logo)}" alt=""><span><b>${esc(w.program)}</b><small>${esc(w.kind)}</small></span></span>` +
            `<span class="tw-wbal"><b>${esc(w.balanceText)}</b></span>` +
            `<span class="tw-wstat">${esc(w.status)}</span>` +
            '<span class="tw-wexp">' +
              (w.flag
                ? `<span class="tw-echip tw-echip--soon">${ico('timer-off')}${esc(w.soon)}</span>`
                : `<span class="tw-wdate">${esc(w.days == null ? w.expires : w.dateText)}</span>`) +
            '</span>' +
          '</div>',
        ).join('') +
      '</div>' +
      `<p class="tw-walletnote">${ico('triangle-alert')}${esc(copy.walletNote)}</p>` +
    '</div>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/trip-wallet';
  return (
    '<footer class="tw-foot">' +
      `<span>${ico('lock')}${esc(`Made by Superbot for ${data.meta.user}. Read-only access to ${n0(data.counts.accounts)} accounts.`)}</span>` +
      `<span class="tw-credit">${esc(data.copy.credit)}</span>` +
      `<span>${esc(url)}</span>` +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    liveSection(data) +
    timelineSection(data) +
    '<section class="tw-panels">' +
      bookingsPanel(data) +
      walletPanel(data) +
    '</section>' +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = mergeDone(p);
  const lv = liveDone(p);
  const tl = tripDone(p);
  const data = fallback;
  const { counts } = data;

  // the five accounts tick up, then the trips step closes the card
  const heroEl = root.querySelector('.tw-hero');
  let read = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const v = Math.round(Number(b.dataset.n) * tickDone(g, i));
    b.textContent = n0(v);
    if (i < counts.accounts) read += v;
  }
  if (heroEl) {
    const ticks = counts.accounts + 1;
    for (let i = 0; i < ticks; i++) heroEl.classList.toggle(`is-s${i + 1}`, tickDone(g, i) >= 0.999);
    heroEl.classList.toggle('is-m1', mg > 0.06);
    heroEl.classList.toggle('is-m2', mg >= 0.999);
  }
  const count = root.querySelector('.tw-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.pulled)} records`;

  // the merge: the bar starts all amber as pulled, the duplicate band shrinks to its share
  const bar = root.querySelector('.tw-mbar');
  if (bar) {
    const k = ease(mg);
    const uniq = counts.pulled - counts.dupes * k;
    const mun = bar.querySelector('.tw-mun');
    const mdup = bar.querySelector('.tw-mdup');
    if (mun) mun.style.width = pct((counts.bookings / counts.pulled) * 100);
    if (mdup) mdup.style.width = pct(((uniq - counts.bookings) / counts.pulled) * 100);
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const dupnow = root.querySelector('.tw-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(counts.dupes * ease(mg)));
  const uniqnow = root.querySelector('.tw-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(counts.pulled - counts.dupes * ease(mg)));

  // the live card: its fields ease in as the card lands, staggered left to right
  for (const c of root.querySelectorAll('.tw-live [data-j]')) {
    const j = Number(c.dataset.j) || 0;
    const k = ease(clamp01((lv - j * 0.16) / 0.68));
    c.style.opacity = (0.12 + 0.88 * k).toFixed(3);
    c.style.transform = `translateY(${((1 - k) * 8).toFixed(2)}px)`;
  }

  // the timeline: eleven rows settle in turn, and each trip header lands with its own group
  for (const row of root.querySelectorAll('.tw-row')) {
    const i = Number(row.dataset.r) || 0;
    const k = ease(clamp01((tl - i * 0.045) / 0.5));
    row.style.opacity = (0.14 + 0.86 * k).toFixed(3);
    row.style.transform = `translateY(${((1 - k) * 12).toFixed(2)}px)`;
  }
  for (const head of root.querySelectorAll('.tw-triph')) {
    head.style.opacity = (0.3 + 0.7 * ease(clamp01(tl / 0.7))).toFixed(3);
  }

  const fill = root.querySelector('.tw-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));

  // the live dot's halo, a sawtooth on p: it grows and fades once every 1.4 s of the browser beat
  const ph = (clamp01(p) * PULSES) % 1;
  for (const halo of root.querySelectorAll('.tw-phalo')) {
    halo.style.transform = `scale(${(1 + 1.1 * ph).toFixed(3)})`;
    halo.style.opacity = (0.75 * (1 - ph)).toFixed(3);
  }
}

export { build };