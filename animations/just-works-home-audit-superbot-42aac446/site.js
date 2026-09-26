/* site.js - the generated frontend: superbot.app/p/home-audit, "Home inventory".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the merge counters, the Offline tile, the Garage card and the
   "Garage door closes at 10 PM" automation row, and .is-active on the Automations tab; all are styled in
   site.css. The tab click swaps the device list for the automations panel through a :has() + sibling rule,
   so no JS runs on the click. The only clock-driven output is render(root, p): the top bar clock, the sync
   card ticking through the five apps, the merge beat (214 pulled collapsing to 127 unique, see
   SYNC_A/SYNC_B/MERGE_A/MERGE_B), the four flag counters easing in (GROW_A/GROW_B), the nine room cards
   settling (ROOM_A/ROOM_B) and the sync bar, all pure functions of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it changed anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "9:11:38 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the five apps are read from SYNC_A to SYNC_B of p (while the page
   grows out of the hub card) and the duplicate listings collapse from MERGE_A to MERGE_B, both inside the
   first scroll hold in ad.js (f 0.13 to 0.3, p 0.213 to 0.367), so the finished 214 / 87 / 127 card holds
   on screen before the page moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.15;
const MERGE_A = 0.165;
const MERGE_B = 0.285;
/* the flags strip is the second hold (ad.js f 0.355 to 0.52, p 0.416 to 0.566): its counters start easing in
   as it scrolls up (from f 0.3, p 0.367), finish at 6 / 9 / 11 / 4 just after it lands (f 0.38) and then
   hold settled about 1.3 s before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the room grid is the third hold (f 0.575 to 0.66, p 0.615 to 0.692): the nine cards settle in turn while
   it scrolls in (from f 0.52, p 0.566) and are all still by the time it lands (f 0.575, p 0.615) */
const ROOM_A = 0.535;
const ROOM_B = 0.61;

export function syncDone(p) {
  return clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
}

export function mergeDone(p) {
  return clamp01((p - MERGE_A) / (MERGE_B - MERGE_A));
}

export function growDone(p) {
  return clamp01((p - GROW_A) / (GROW_B - GROW_A));
}

export function roomDone(p) {
  return clamp01((p - ROOM_A) / (ROOM_B - ROOM_A));
}

/* the sync card: tick i counts from 0 to its number over its own window, so the five apps land one after
   another and the sixth tick (the rooms) closes the card at g = 1 */
const TICK_STEP = 0.14;
const TICK_LEN = 0.3;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  list: '<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
  workflow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
  'triangle-alert': '<path d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>',
  'wifi-off': '<path d="M12 20h.01M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 5.17-2.69m8.83 2.69a10 10 0 0 0-2.007-1.523M2 8.82a15 15 0 0 1 4.177-2.643M22 8.82a15 15 0 0 0-11.288-3.764M2 2l20 20"/>',
  'battery-low': '<path d="M22 14v-4M6 14v-4"/><rect width="16" height="12" x="2" y="6" rx="2"/>',
  cpu: '<path d="M12 20v2m0-20v2m5 16v2m0-20v2M2 12h2m-2 5h2M2 7h2m16 5h2m-2 5h2M20 7h2M7 20v2M7 2v2"/><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="8" height="8" x="8" y="8" rx="1"/>',
  'timer-off': '<path d="M10 2h4m-9.4 9a8 8 0 0 0 1.7 8.7a8 8 0 0 0 8.7 1.7m-7.6-14a8 8 0 0 1 10.3 1a8 8 0 0 1 .9 10.2M2 2l20 20M12 12v-2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  merge: '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  sofa: '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0zm2 2v2m16-2v2M12 4v9"/>',
  'cooking-pot': '<path d="M2 12h20m-2 0v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8m0-4l16-4M8.86 6.78l-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>',
  'bed-double': '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4m-8-6v6M2 18h20"/>',
  baby: '<path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5m1-4h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6a9 9 0 0 1-17.6 0a2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1m-3 5h.01"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  'door-open': '<path d="M10 21H2m8-18H7a2 2 0 0 0-2 2v16m9-9h.01"/><path d="M19 21V5a2 2 0 0 0-1.675-1.974l-6.163-1.013A1 1 0 0 0 10 3v18a1 1 0 0 0 1.124.992zm3 0h-3"/>',
  warehouse: '<path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11"/><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8zM6 13h12M6 17h12"/>',
  lamp: '<path d="M12 12v6m-7.923-7.385A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23ZM8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"/>',
  trees: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0m-3 6v6m6-3v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
};

const ico = (name) =>
  `<svg class="hm-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* an app tag: the app's mark plus its short name */
const appTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="hm-ltag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the four flag kinds and the words and icons they print with */
const KIND = {
  offline: { icon: 'wifi-off', word: 'offline' },
  battery: { icon: 'battery-low', word: 'battery' },
  firmware: { icon: 'cpu', word: 'firmware' },
  stale: { icon: 'timer-off', word: 'stale' },
};

function topBar(data) {
  const { counts, meta, accounts } = data;
  return (
    '<header class="hm-top">' +
      '<div class="hm-topin">' +
        '<span class="hm-brand"><img class="hm-brandico" src="./brand/app.svg" alt=""><b>Home inventory</b><span class="hm-by">by Superbot</span></span>' +
        '<nav class="hm-tabs">' +
          `<span class="hm-tab hm-tab--1">${ico('list')}Devices <i>${n0(counts.devices)}</i></span>` +
          `<span class="hm-tab hm-tab--2">${ico('workflow')}Automations <i>${n0(counts.automations)}</i></span>` +
        '</nav>' +
        '<div class="hm-status">' +
          '<span class="hm-logs">' +
            accounts.map((a) => `<img src="${esc(a.logo)}" alt="">`).join('') +
            `${ico('lock')}Read-only` +
          '</span>' +
          `<span class="hm-live"><span class="hm-dot"></span><span class="hm-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="hm-syncbar"><span class="hm-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="hm-tick hm-tick--s${i + 1}"><img src="${esc(a.logo)}" alt=""><span>${esc(a.name)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="hm-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="hm-tick hm-tick--s${last + 1} hm-tick--rooms"><span class="hm-tickico">${ico('house')}</span><span>Sorted into rooms</span>` +
      `<b data-n="${counts.rooms}" data-i="${last}">0</b><span class="hm-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="hm-sync">' +
      '<div class="hm-synchead">' +
        `<span class="hm-syncnow">${ico('refresh-cw')}Reading ${counts.accounts} apps, read-only<span class="hm-synccount">0 of ${n0(counts.pulled)} entries</span></span>` +
        `<span class="hm-stamp">${ico('circle-check')}Synced ${esc(meta.day)}, ${esc(meta.synced)}. Nothing changed in any app.</span>` +
      '</div>' +
      `<ul class="hm-ticks">${ticks.join('')}</ul>` +
      '<div class="hm-merge">' +
        '<div class="hm-mbar"><span class="hm-mun"></span><span class="hm-mdup"></span></div>' +
        '<div class="hm-mrow">' +
          `<span class="hm-mk"><b class="hm-pulled">${n0(counts.pulled)}</b>entries pulled</span>` +
          `<span class="hm-mk hm-mk--dup"><b class="hm-dupnow">0</b>already listed by another app</span>` +
          `<span class="hm-mk hm-mk--uniq"><b class="hm-uniqnow">${n0(counts.pulled)}</b>unique devices</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function homeCard(data) {
  const { meta, counts, hubs } = data;
  const healthyPct = (counts.healthy / counts.devices) * 100;
  return (
    '<aside class="hm-home">' +
      `<span class="hm-homek">${ico('map-pin')}${esc(meta.city)}</span>` +
      `<h2>${esc(meta.home)}</h2>` +
      `<p class="hm-homeday">${ico('clock')}Synced ${esc(meta.day)}, ${esc(meta.synced)}</p>` +
      '<ul class="hm-homefacts">' +
        `<li><small>Rooms</small><b>${n0(counts.rooms)}</b></li>` +
        `<li><small>Devices</small><b>${n0(counts.devices)}</b></li>` +
        `<li><small>Hubs</small><b>${n0(hubs.length)}</b></li>` +
        `<li><small>Automations</small><b>${n0(counts.automations)}</b></li>` +
      '</ul>' +
      '<div class="hm-health">' +
        `<div class="hm-healthh">${ico('shield-check')}Health check</div>` +
        '<div class="hm-healthrow">' +
          `<span><b>${n0(counts.healthy)}</b>devices fine</span>` +
          `<span class="hm-hr--bad"><b>${n0(counts.flaggedDevices)}</b>need a look</span>` +
          `<span class="hm-hr--stale"><b>${n0(counts.stale)}</b>stale automations</span>` +
        '</div>' +
        `<div class="hm-healthbar"><i style="width:${pct(healthyPct)}"></i></div>` +
        `<p class="hm-healthn">${ico('lock')}Read-only. Nothing was renamed, updated or removed.</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="hm-hero">' +
      '<img class="hm-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="hm-heroin">' +
        '<div class="hm-herot">' +
          `<span class="hm-kicker">${ico('house')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="hm-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="hm-stats">' +
            `<li><b>${n0(counts.devices)}</b><span>unique devices</span></li>` +
            `<li><b>${n0(counts.rooms)}</b><span>rooms</span></li>` +
            `<li class="hm-stat--flag"><b>${n0(counts.flaggedDevices)}</b><span>devices need a look</span></li>` +
            `<li class="hm-stat--ok"><b>${n0(counts.healthy)}</b><span>need nothing</span></li>` +
          '</ul>' +
        '</div>' +
        homeCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the five apps: what each listed, and what was left once the copies merged */
const ACC_NOTE = {
  ha: (a, hue) => `${n0(a.pulled - a.kept)} were Hue devices already in ${hue}`,
  hue: () => 'Every Hue light lives here, so all kept',
};

function accStrip(data) {
  const { accounts } = data;
  const hue = accOf(data, 'hue').short;
  return (
    '<section class="hm-accs"><ul class="hm-acclist">' +
      accounts.map((a) => {
        const dup = a.pulled - a.kept;
        const note = ACC_NOTE[a.id] ? ACC_NOTE[a.id](a, hue) : `${n0(dup)} already listed by another app`;
        return (
          `<li class="hm-acc hm-acc--${esc(a.id)}">` +
            `<img src="${esc(a.logo)}" alt="">` +
            `<span class="hm-acc-t"><b>${esc(a.name)}</b><small>${esc(a.handle)}</small></span>` +
            `<span class="hm-acc-v"><b>${n0(a.pulled)}</b><small>${esc(a.what)} read, <em>${n0(a.kept)} kept</em></small></span>` +
            `<span class="hm-acc-n">${esc(note)}</span>` +
            `<span class="hm-acc-ok">${ico('check')}</span>` +
          '</li>'
        );
      }).join('') +
    '</ul></section>'
  );
}

function flagsSection(data) {
  const { flags, copy } = data;
  return (
    '<section class="hm-flags">' +
      `<div class="hm-sech"><h2>${esc(copy.flagsH)}</h2><span>${esc(copy.flagsDek)}</span></div>` +
      '<ul class="hm-flaglist">' +
        flags.map((f) =>
          `<li class="hm-flag hm-flag--${esc(f.kind)}">` +
            '<div class="hm-flagh">' +
              `<span class="hm-flagi">${ico(f.icon)}</span>` +
              `<span class="hm-flagt"><b>${esc(f.label)}</b><small>${esc(f.rule)}</small></span>` +
              `<b class="hm-flagn" data-g="${f.n}">${n0(f.n)}</b>` +
            '</div>' +
            '<ul class="hm-flagex">' +
              f.examples.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="hm-flagmore">${f.n > f.examples.length ? `and ${n0(f.n - f.examples.length)} more` : 'That is all of them'}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

function roomsSection(data) {
  const { rooms, copy } = data;
  const chip = (kind, n) =>
    n ? `<span class="hm-chip hm-chip--${kind}"><i></i><b>${n0(n)}</b><em>${KIND[kind].word}</em></span>` : '';
  return (
    '<section class="hm-rooms">' +
      `<div class="hm-sech"><h2>${esc(copy.roomsH)}</h2><span>${esc(copy.roomsDek)}</span></div>` +
      '<ul class="hm-roomlist">' +
        rooms.map((r, i) => {
          const chips = ['offline', 'battery', 'firmware', 'stale'].map((k) => chip(k, r.flags[k])).join('');
          return (
            `<li class="hm-room hm-room--${esc(r.key)}" data-r="${i}">` +
              '<div class="hm-roomh">' +
                `<span class="hm-roomi">${ico(r.icon)}</span>` +
                `<span class="hm-roomt"><b>${esc(r.name)}</b><small>${esc(r.what)}</small></span>` +
                `<span class="hm-roomn"><b>${n0(r.devices)}</b><small>devices</small></span>` +
              '</div>' +
              '<div class="hm-roomf">' +
                `<span class="hm-roomapps">${r.apps.map((id) => `<img src="${esc(accOf(data, id).logo)}" alt="">`).join('')}</span>` +
                `<span class="hm-chips">${chips || `<span class="hm-chip hm-chip--ok">${ico('check')}<em>All good</em></span>`}</span>` +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ul>' +
    '</section>'
  );
}

function devicesPanel(data) {
  const { devices, counts, copy } = data;
  const status = (d) => {
    if (d.status === 'ok') return `<span class="hm-echip hm-echip--ok">${ico('check')}OK</span>`;
    return `<span class="hm-echip hm-echip--${esc(d.status)}">${ico(KIND[d.status].icon)}${esc(d.statusText)}</span>`;
  };
  return (
    '<div class="hm-panel hm-panel--1">' +
      `<div class="hm-sech"><h2>${esc(copy.devicesH)}</h2><span>${esc(copy.devicesDek)}</span></div>` +
      '<div class="hm-table">' +
        '<div class="hm-drow hm-drow--h"><span>Device</span><span>Room</span><span>Found in</span><span>Battery</span><span>Status</span></div>' +
        devices.map((d) =>
          `<div class="hm-drow hm-drow--${esc(d.key)}${d.apps.length > 1 ? ' hm-drow--merged' : ''}">` +
            `<span class="hm-dname"><img src="./brand/device.svg" alt=""><span><b>${esc(d.name)}</b><small>${esc(d.product)}</small></span></span>` +
            `<span class="hm-droom">${esc(d.roomName)}</span>` +
            `<span class="hm-rtags">${d.apps.map((id) => appTag(data, id)).join('')}</span>` +
            `<span class="hm-dbat${d.status === 'battery' ? ' is-low' : ''}">${d.battery ? esc(d.battery) : 'Wired'}</span>` +
            `<span class="hm-dstat">${status(d)}</span>` +
          '</div>',
        ).join('') +
        `<div class="hm-more">${ico('merge')}${n0(counts.devices - devices.length)} more devices in the inventory. ${n0(counts.dupes)} duplicate listings merged into the rows they belong to.</div>` +
      '</div>' +
    '</div>'
  );
}

function automationsPanel(data) {
  const { automations, meta, copy } = data;
  const rows = automations.slice().sort((a, b) => b.days - a.days);
  const maxDays = Math.max(...rows.map((a) => a.days), meta.staleDays + 1);
  const lim = (meta.staleDays / maxDays) * 100;
  return (
    '<div class="hm-panel hm-panel--2">' +
      `<div class="hm-sech"><h2>${esc(copy.autosH)}</h2><span>${esc(copy.autosDek)}</span></div>` +
      '<div class="hm-table">' +
        '<div class="hm-arow hm-arow--h"><span>Automation</span><span>App</span><span>Last fired</span><span>Days since</span><span>Status</span></div>' +
        rows.map((a) =>
          `<div class="hm-arow hm-arow--${esc(a.key)}${a.stale ? ' hm-arow--stale' : ''}">` +
            `<span class="hm-aname"><b>${esc(a.name)}</b><small>${esc(a.trigger)}</small></span>` +
            `<span class="hm-aapp">${appTag(data, a.app)}</span>` +
            `<span class="hm-alast">${esc(a.last)}</span>` +
            '<span class="hm-atrack">' +
              `<span class="hm-afill" style="width:${pct(Math.max(1.5, (a.days / maxDays) * 100))}"></span>` +
              `<span class="hm-alim" style="left:${pct(lim)}"></span>` +
              `<em class="hm-adays">${esc(a.ago)}</em>` +
            '</span>' +
            `<span class="hm-astat">${a.stale
              ? `<span class="hm-echip hm-echip--stale">${ico('timer-off')}Stale</span>`
              : `<span class="hm-echip hm-echip--ok">${ico('check')}Firing</span>`}</span>` +
            (a.stale ? `<span class="hm-arow-note">${ico('info')}${esc(a.why)}</span>` : '') +
          '</div>',
        ).join('') +
      '</div>' +
      `<p class="hm-autosum">${ico('triangle-alert')}<span>${esc(copy.worstNote)}</span></p>` +
    '</div>'
  );
}

function watchSection(data) {
  const { watch, copy } = data;
  return (
    '<section class="hm-watch">' +
      `<div class="hm-sech"><h2>${esc(copy.watchH)}</h2><span>${esc(copy.watchDek)}</span></div>` +
      '<ul class="hm-wlist">' +
        watch.map((w) =>
          `<li class="hm-w"><span class="hm-wi">${ico(w.icon)}</span><span class="hm-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span></li>`,
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/home-audit';
  return (
    '<footer class="hm-foot">' +
      `<span>${ico('lock')}Made by Superbot for ${esc(data.meta.user)}. Read-only access to ${n0(data.counts.accounts)} apps.</span>` +
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
    accStrip(data) +
    flagsSection(data) +
    roomsSection(data) +
    '<section class="hm-panels">' +
      devicesPanel(data) +
      automationsPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = mergeDone(p);
  const gw = growDone(p);
  const rw = roomDone(p);
  const data = fallback;
  const { counts, meta } = data;

  const clock = root.querySelector('.hm-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.hm-hero');
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
  const count = root.querySelector('.hm-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.pulled)} entries`;

  // the merge: the bar starts all amber-and-mint as pulled, the duplicate band shrinks to its share
  const bar = root.querySelector('.hm-mbar');
  if (bar) {
    const k = ease(mg);
    const uniq = counts.pulled - counts.dupes * k;
    const mun = bar.querySelector('.hm-mun');
    const mdup = bar.querySelector('.hm-mdup');
    if (mun) mun.style.width = pct((counts.devices / counts.pulled) * 100);
    if (mdup) mdup.style.width = pct(((uniq - counts.devices) / counts.pulled) * 100);
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const dupnow = root.querySelector('.hm-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(counts.dupes * ease(mg)));
  const uniqnow = root.querySelector('.hm-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(counts.pulled - counts.dupes * ease(mg)));

  // the flags strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) b.textContent = n0(Math.round(Number(b.dataset.g) * ease(gw)));
  for (const li of root.querySelectorAll('.hm-flagex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the room grid: nine cards settle in turn
  for (const card of root.querySelectorAll('.hm-room')) {
    const i = Number(card.dataset.r) || 0;
    const k = ease(clamp01((rw - i * 0.06) / 0.52));
    card.style.opacity = (0.2 + 0.8 * k).toFixed(3);
    card.style.transform = `translateY(${((1 - k) * 12).toFixed(2)}px)`;
  }

  const fill = root.querySelector('.hm-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}

export { build };
