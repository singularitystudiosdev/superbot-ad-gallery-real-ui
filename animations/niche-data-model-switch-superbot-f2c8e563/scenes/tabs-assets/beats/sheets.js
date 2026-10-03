// Sheets beat, the finale: superbot writes the work to Google Sheets. Its line streams, a connect card lands in the chat
// ("superbot connected to Google Sheets", "Opened Sales 2026", "Writing 2 tabs", three checks ticking in turn) with a
// mini Sheets window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of
// the Discord remake's discord.js (and the source's play.js). Full frame is a real-looking Google Sheets web window,
// light theme: title bar, menus, toolbar, formula bar, the grid and the sheet tabs. On the "Clean" tab the imported
// raw rows are cleaned in front of you: the duplicate rows tint red, strike through and collapse (a snackbar:
// "Removed 37 duplicate rows"), every Order date flips to YYYY-MM-DD and the blank regions fill in, every Amount flips
// to US dollars under its renamed "Amount (USD)" header, and the snackbar reads the result. Then the pointer clicks the
// "Revenue dashboard" tab: a title row, three KPI cells, the source table and two floating Sheets charts (revenue by
// month, columns growing in; revenue by region, a donut sweeping round), and the final state holds (READ) before the
// end card.
//
// There is ONE Sheets window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE, so its type reads like Sheets at that zoom) and scaled to
// the layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it
// takes Sheets' tablet-width layout: fewer columns, a shorter toolbar, the charts stacked.
// Row heights and column widths are constants (Sheets' own 21 px rows), so every row, cell, chart and the pointer's
// target are exact without measuring. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { MONTHS } from './query.js?v=f2c8e563';

const SAY = 'Writing the clean rows and your dashboard to Google Sheets.';
const DOC = 'Sales 2026';
const TITLE = 'Revenue dashboard  ·  Jan to Sep 2026';
// the rows as they were imported (made up for the spot): order id, raw date, the date cleaned, customer, raw region
// (blank = ''), the region filled in, product, raw amount, the amount in USD, raw currency, duplicate of the row above
const DATA = [
  ['10231', '03/14/2026', '2026-03-14', 'Northwind Traders', 'North America', '', 'Pro plan (annual)', '$1,240.00', '$1,240.00', 'USD'],
  ['10232', '2026-03-14', '2026-03-14', 'Bluefin Labs', 'Europe', '', 'Team seats x10', 'EUR 980.50', '$1,058.94', 'EUR'],
  ['10233', '14 Mar 2026', '2026-03-14', 'Harbor & Pine', '', 'North America', 'Starter plan', '2150', '$2,150.00', 'usd'],
  ['10233', '14 Mar 2026', '2026-03-14', 'Harbor & Pine', '', 'North America', 'Starter plan', '2150', '$2,150.00', 'usd', true],
  ['10234', 'Mar 14 26', '2026-03-14', 'Kestrel Supply', 'Asia Pacific', '', 'Pro plan (annual)', 'GBP 715', '$908.05', 'GBP'],
  ['10235', '2026/03/15', '2026-03-15', 'Alder Health', 'Latin America', '', 'Onboarding', 'USD 2050', '$2,050.00', 'USD'],
  ['10236', '03/15/2026', '2026-03-15', 'Quarry Point', 'Europe', '', 'Team seats x25', 'EUR 2,310.00', '$2,494.80', 'EUR'],
  ['10236', '03/15/2026', '2026-03-15', 'Quarry Point', 'Europe', '', 'Team seats x25', 'EUR 2,310.00', '$2,494.80', 'EUR', true],
  ['10237', '15 Mar 2026', '2026-03-15', 'Lumen Freight', '', 'Europe', 'Pro plan (annual)', '$3,480.00', '$3,480.00', 'USD'],
  ['10238', '2026-03-16', '2026-03-16', 'Cedar & Vale', 'North America', '', 'Starter plan', '1890', '$1,890.00', 'USD'],
  ['10239', 'Mar 16 26', '2026-03-16', 'Orchid Analytics', 'Asia Pacific', '', 'Team seats x10', 'GBP 1,240', '$1,574.80', 'GBP'],
  ['10240', '03/16/2026', '2026-03-16', 'Pinecrest Foods', 'North America', '', 'Enterprise add-on', 'USD 4200', '$4,200.00', 'USD'],
  ['10241', '16 Mar 2026', '2026-03-16', 'Silverline Media', 'Europe', '', 'Pro plan (annual)', 'EUR 1,150.00', '$1,242.00', 'EUR'],
  ['10242', '2026/03/17', '2026-03-17', 'Tidewater Co', 'Latin America', '', 'Onboarding', '960', '$960.00', 'usd'],
].map(([id, date, dateC, cust, region, regionC, prod, amt, amtC, cur, dup]) => ({ id, date, dateC, cust, region, regionC, prod, amt, amtC, cur, dup: !!dup }));
// the columns of the Clean tab: key, header, width (design px), right-aligned once clean. The 4:5 window shows four.
const COLS = {
  id: ['Order ID', 92], date: ['Order date', 112], cust: ['Customer', 150], region: ['Region', 124],
  prod: ['Product', 146], amt: ['Amount', 118], cur: ['Currency', 86],
};
const WIDE_KEYS = ['id', 'date', 'cust', 'region', 'prod', 'amt', 'cur'];
const TALL_KEYS = ['id', 'date', 'region', 'amt'];
const TALL_W = { id: 92, date: 112, region: 124, amt: 130 };
// revenue by region, $K (sums to the same 4,824 as MONTHS): name, Sheets palette colour
const REGIONS = [['North America', 1986, '#4285f4'], ['Europe', 1342, '#ea4335'], ['Asia Pacific', 1047, '#fbbc04'], ['Latin America', 449, '#34a853']];
const TOTAL_K = MONTHS.reduce((a, [, v]) => a + v, 0); // 4,824
const KPIS = [['Total revenue', '$4.82M'], ['Orders', '2,381'], ['Avg order', '$2,026']];
const SNACK = ['Removed 37 duplicate rows', '2,381 rows clean. Dates and currencies fixed.'];

// Sheets' metrics, design px
const RH = 21, CH = 20;                           // a row, the column-header row
const RNW = { wide: 46, tall: 40 };               // the row-number column
const CHROME = 64 + 48 + 30 + 40;                 // title bar, toolbar, formula bar, sheet tabs (sheets.css)
const APP_SCALE = { wide: 1.5, tall: 1.4 };       // full frame: the window's px to frame px
// the dashboard tab's rows: title, gap, KPI label, KPI value, gap, then plain rows
const DROWS = [40, 21, 22, 44, 21];

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const RAW_HOLD = 0.45;                           // full frame: the raw rows read before the first fix
const TINT = 0.2;                                // the duplicates tinting red and striking through
const DUP_HOLD = 0.25;                           // tinted, then they collapse
const COLLAPSE = 0.3;                            // a duplicate row closing to 0 height
const FIX_AT = 0.12;                             // collapsed, then the dates start flipping
const FLIP_STAGGER = 0.05;                       // one row's cell to the next (the brief: ~0.06)
const FLASH = 0.45;                              // the green flash on a fixed cell fading out
const AMT_AT = 0.15;                             // the last date flipped, then the amounts start
const SNACK_IN = 0.2;                            // the snackbar rising in, and its text swapping
const PTR_AT = 0.2;                              // the last amount flipped, then the pointer appears
const PTR_MOVE = 0.45;                           // the pointer travelling to the "Revenue dashboard" tab
const PRESS_AT = 0.05;                           // arrived, then the press
const DASH_AT = 0.1;                             // the press, then the dashboard tab lands
const DASH_IN = 0.2;                             // the dashboard fading in (.gs-dash opacity 0 -> 1)
const KPI_AT = 0.08, KPI_STAGGER = 0.06, KPI_IN = 0.22;
const COL_AT = 0.2, COL_STAGGER = 0.04, COL_IN = 0.35; // the month columns growing in
const PIE_AT = 0.25, PIE_IN = 0.7;               // the region donut sweeping round
const LEG_AT = 0.3, LEG_STAGGER = 0.06, LEG_IN = 0.2;
const LBL_IN = 0.2;                              // the slice percentages, after the sweep
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="gs-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  star: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>'),
  move: svg('<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17z"/><path d="M10 13h5M13 11l2 2-2 2"/>'),
  cloud: svg('<path d="M7 18.5h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 9.8 4.4 4.4 0 0 0 7 18.5z"/><path d="M9.5 14l2 2 3.5-3.5"/>'),
  hist: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5M12 7.5V12l3 2"/>'),
  cmt: svg('<path d="M4 4.5h16v11.5H8.5L4 20z"/><path d="M8 9h8M8 12.5h5"/>'),
  meet: svg('<rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="M15.5 10.5l5-3v9l-5-3"/>'),
  lock: svg('<rect x="5.5" y="10.5" width="13" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>'),
  caret: svg('<path d="M7 10l5 5 5-5z" class="gs-fl"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'),
  undo: svg('<path d="M9 14.5 4 9.5l5-5"/><path d="M4 9.5h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: svg('<path d="m15 14.5 5-5-5-5"/><path d="M20 9.5H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  print: svg('<path d="M6.5 9V3.5h11V9"/><path d="M6.5 17.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-5.5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-2"/><rect x="6.5" y="13.5" width="11" height="7"/>'),
  paint: svg('<rect x="4" y="3.5" width="13" height="5.5" rx="1"/><path d="M17 6.2h2.5v5H11v3"/><rect x="9.5" y="14.2" width="3" height="6.5" rx=".8"/>'),
  fill: svg('<path d="M5 11.5 11 5.5l6.5 6.5-6 6z"/><path d="M8 3.5l3 2M19.5 15s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3z"/>'),
  border: svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 12h16M12 4v16"/>'),
  merge: svg('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M7.5 12h9M9.5 10l-2 2 2 2M14.5 10l2 2-2 2"/>'),
  alignl: svg('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
  valign: svg('<path d="M4 20h16M12 4v12M8.5 12.5 12 16l3.5-3.5"/>'),
  wrap: svg('<path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4M4 18h5"/><path d="M14.5 16l-2 2 2 2"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  chart: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M8 16.5v-5M12 16.5v-9M16 16.5v-3"/>'),
  filter: svg('<path d="M3.5 5h17l-6.5 7.5v6L10 20.5v-8z"/>'),
  sigma: svg('<path d="M17.5 5H6.5l6 7-6 7h11"/>'),
  more: svg('<circle cx="12" cy="5.5" r="1.5" class="gs-fl"/><circle cx="12" cy="12" r="1.5" class="gs-fl"/><circle cx="12" cy="18.5" r="1.5" class="gs-fl"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  sheets: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  explore: svg('<path d="M12 3.5l1.8 5.2L19 10.5l-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/>'),
  check: '<svg class="gs-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const MENUS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'];
const letter = (i) => String.fromCharCode(65 + i);
const kfmt = (k) => (k >= 1000 ? `$${(k / 1000).toFixed(2)}M` : `$${k}K`);

// ---- the charts (inline SVG from the numbers above; a data plot, the one drawn thing on screen) ----
function columnChart(w, h) {
  const L = 52, R = 16, Tp = 52, B = 28;
  const pw = w - L - R, ph = h - Tp - B, max = 800;
  const slot = pw / MONTHS.length, bw = Math.min(44, slot * 0.62);
  const y = (v) => Tp + ph * (1 - v / max);
  const ticks = [0, 200, 400, 600, 800].map((v) => `<line x1="${L}" x2="${w - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="gs-gl${v === 0 ? ' gs-base' : ''}"/><text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" class="gs-ax" text-anchor="end">${v ? `$${v}K` : '$0'}</text>`).join('');
  const bars = MONTHS.map(([m, v], i) => {
    const cx = L + slot * (i + 0.5);
    return `<g class="gs-col"><rect x="${(cx - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" fill="#4285f4"/>
      <text x="${cx.toFixed(1)}" y="${(y(v) - 6).toFixed(1)}" class="gs-dl" text-anchor="middle">$${v}K</text></g>
      <text x="${cx.toFixed(1)}" y="${(h - B + 18).toFixed(1)}" class="gs-ax" text-anchor="middle">${m}</text>`;
  }).join('');
  return `<svg class="gs-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="18" y="30" class="gs-ct">Revenue by month</text>${ticks}${bars}</svg>`;
}
function donutChart(w, h) {
  const Tp = 46;
  const R = Math.max(40, Math.min((h - Tp - 16) / 2, w * 0.22));
  const cx = 26 + R, cy = Tp + (h - Tp - 8) / 2;
  const th = R * (R < 90 ? 0.6 : 0.5), rm = R - th / 2, C = 2 * Math.PI * rm;
  let acc = 0;
  const segs = REGIONS.map(([name, v, col]) => {
    const len = (v / TOTAL_K) * C, s = acc; acc += len;
    const mid = ((s + len / 2) / C) * 2 * Math.PI - Math.PI / 2;
    return { name, v, col, len, s, lx: cx + rm * Math.cos(mid), ly: cy + rm * Math.sin(mid) };
  });
  const lx = cx + R + 30, rowH = Math.min(30, (h - Tp - 10) / REGIONS.length), ly0 = cy - (rowH * REGIONS.length) / 2;
  const pct = (v) => `${((v / TOTAL_K) * 100).toFixed(1)}%`;
  return {
    C,
    segs,
    html: `<svg class="gs-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="18" y="30" class="gs-ct">Revenue by region</text>
      <g transform="rotate(-90 ${cx.toFixed(1)} ${cy.toFixed(1)})">${segs.map((s) => `<circle class="gs-seg" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rm.toFixed(1)}" fill="none" stroke="${s.col}" stroke-width="${th.toFixed(1)}" stroke-dasharray="0 ${C.toFixed(2)}" stroke-dashoffset="${(-s.s).toFixed(2)}"/>`).join('')}</g>
      ${segs.map((s) => `<text class="gs-pl${s.col === '#fbbc04' ? ' gs-pl-d' : ''}" x="${s.lx.toFixed(1)}" y="${(s.ly + 4).toFixed(1)}" text-anchor="middle">${pct(s.v).replace('.0%', '%')}</text>`).join('')}
      ${R >= 90 ? `<text class="gs-dt" x="${cx.toFixed(1)}" y="${(cy - 2).toFixed(1)}" text-anchor="middle">$4.82M</text><text class="gs-ax" x="${cx.toFixed(1)}" y="${(cy + 14).toFixed(1)}" text-anchor="middle">total</text>` : ''}
      ${segs.map((s, i) => `<g class="gs-lg" transform="translate(${lx.toFixed(1)} ${(ly0 + rowH * i).toFixed(1)})"><rect y="4" width="12" height="12" rx="2" fill="${s.col}"/><text x="20" y="15" class="gs-ln">${esc(s.name)}</text><text x="${Math.min(w - lx - 70, 150).toFixed(1)}" y="15" class="gs-lv">${kfmt(s.v)}</text></g>`).join('')}
    </svg>`,
  };
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, opened, writing: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame, the Clean tab's raw rows
    T.tint = T.full + RAW_HOLD;                       // the duplicates tint and strike through
    T.col0 = T.tint + TINT + DUP_HOLD;                // ...and collapse
    T.col1 = T.col0 + COLLAPSE;
    T.snack = T.col0;                                 // "Removed 37 duplicate rows"
    const kept = DATA.filter((d) => !d.dup).length;
    T.date = Array.from({ length: kept }, (_, i) => T.col1 + FIX_AT + i * FLIP_STAGGER); // each kept row's date flips
    T.amt0 = T.date[kept - 1] + AMT_AT;               // the Amount header is renamed
    T.amt = Array.from({ length: kept }, (_, i) => T.amt0 + 0.08 + i * FLIP_STAGGER);
    T.snack2 = T.amt[kept - 1] + 0.1;                 // "2,381 rows clean. Dates and currencies fixed."
    T.ptr = T.amt[kept - 1] + PTR_AT;                 // the pointer sets off for the dashboard tab
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;
    T.dash = T.press + DASH_AT;                       // the dashboard tab lands (.gs-dash opacity rises from 0)
    T.kpi = KPIS.map((_, i) => T.dash + KPI_AT + i * KPI_STAGGER);
    T.cols = MONTHS.map((_, i) => T.dash + COL_AT + i * COL_STAGGER);
    T.pie = T.dash + PIE_AT;
    T.leg = REGIONS.map((_, i) => T.dash + LEG_AT + i * LEG_STAGGER);
    T.settle = Math.max(T.cols[T.cols.length - 1] + COL_IN, T.pie + PIE_IN + LBL_IN, T.leg[T.leg.length - 1] + LEG_IN);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('googlesheets-logo.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say gs-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="gs-ct-i gs-ct-s"><img src="${mark}" alt=""/></span>`, '<b>superbot connected to Google Sheets</b>'],
      [`<span class="gs-ct-i gs-ct-d"><img src="${mark}" alt=""/></span>`, `Opened <b>${esc(DOC)}</b>`],
      ['<span class="gs-ct-i gs-ct-n">2</span>', 'Writing <b>2</b> tabs'],
    ];
    const card = x.el(`<div class="gs-card">
      ${steps.map(([icon, txt]) => `<div class="gs-step">${icon}<span class="gs-tx">${txt}</span><span class="gs-ok"><i class="gs-spin"></i>${I.check}</span></div>`).join('')}
      <div class="gs-shot"></div>
    </div>`);
    const shot = card.querySelector('.gs-shot');
    const checks = [...card.querySelectorAll('.gs-ok')].map((n) => ({ spin: n.querySelector('.gs-spin'), ck: n.querySelector('.gs-ck') }));

    // ---- the full-frame Sheets window (its two grids are built by layout(), once the frame's shape is known) ----
    const tb = (...items) => items.join('');
    const layer = x.el(`<div class="gs-full" aria-hidden="true"><div class="gs-app">
      <header class="gs-top">
        <span class="gs-logo"><img src="${mark}" alt=""/></span>
        <div class="gs-tt">
          <div class="gs-tr"><span class="gs-name">${esc(DOC)}</span><span class="gs-tic">${I.star}${I.move}${I.cloud}</span></div>
          <nav class="gs-menu">${MENUS.map((m) => `<span>${m}</span>`).join('')}</nav>
        </div>
        <div class="gs-rt"><span class="gs-rti">${I.hist}${I.cmt}</span><span class="gs-meet">${I.meet}${I.caret}</span><span class="gs-share">${I.lock}<b>Share</b></span><span class="gs-av">S</span></div>
      </header>
      <div class="gs-tb"><div class="gs-tbp">
        ${tb(`<span class="gs-tsrch">${I.search}</span>`, I.undo, I.redo, I.print, I.paint, '<span class="gs-tt2 gs-zoom">100%' + I.caret + '</span>', '<i class="gs-sep"></i>',
          '<span class="gs-tt2">$</span><span class="gs-tt2">%</span><span class="gs-tt2 gs-dec">.0</span><span class="gs-tt2 gs-dec">.00</span><span class="gs-tt2">123' + I.caret + '</span>', '<i class="gs-sep"></i>',
          '<span class="gs-font">Default (Ari...' + I.caret + '</span>', '<i class="gs-sep"></i>', '<span class="gs-fs"><b>&minus;</b><span>10</span><b>+</b></span>', '<i class="gs-sep"></i>',
          '<span class="gs-tt2 gs-b">B</span><span class="gs-tt2 gs-it">I</span><span class="gs-tt2 gs-st">S</span><span class="gs-tt2 gs-ca">A<i></i></span>', '<i class="gs-sep"></i>',
          I.fill, I.border, I.merge, '<i class="gs-sep"></i>', I.alignl, I.valign, I.wrap, '<i class="gs-sep"></i>', I.link, I.cmt, I.chart, I.filter, I.sigma)}
        <span class="gs-tbm">${I.more}</span>
      </div></div>
      <div class="gs-fx"><span class="gs-nb"><b class="gs-nbt">A1</b>${I.caret}</span><i class="gs-fsep"></i><span class="gs-fxi">fx</span><span class="gs-fv"></span></div>
      <div class="gs-grid"></div>
      <footer class="gs-tabs"><span class="gs-tbtn">${I.plus}</span><span class="gs-tbtn">${I.sheets}</span>
        ${['Raw', 'Clean', 'Revenue dashboard'].map((n) => `<span class="gs-tab">${esc(n)}${I.caret}</span>`).join('')}
        <span class="gs-explore">${I.explore}</span></footer>
      <div class="gs-snack"><span class="gs-sn1">${esc(SNACK[0])}</span><span class="gs-sn2">${esc(SNACK[1])}</span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const grid = app.querySelector('.gs-grid');
    const tabs = [...app.querySelectorAll('.gs-tab')];
    const nbt = app.querySelector('.gs-nbt'), fv = app.querySelector('.gs-fv');
    const snack = app.querySelector('.gs-snack'), sn1 = app.querySelector('.gs-sn1'), sn2 = app.querySelector('.gs-sn2');
    // the window's UI type is Roboto (vendored, sheets.css): ask for every weight it uses up front
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GS"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, G = null;
    let AW = 1280, AH = 720;

    // the Clean tab: the column header, the static row numbers, the data rows (which collapse and slide) and empty
    // rows to the bottom of the window; the selection box is placed from the column widths
    const buildClean = (keys, widths, rnw, rows, extra) => {
      const xs = []; let acc = 0;
      keys.forEach((kk) => { xs.push(acc); acc += widths[kk]; });
      const filler = extra.map((w) => `<span class="gs-c" style="width:${w}px"></span>`).join('');
      const hdr = (kk) => `<span class="gs-c gs-hd gs-k-${kk}" style="width:${widths[kk]}px"><span class="gs-v">${COLS[kk][0]}</span></span>`;
      const cell = (kk, d) => {
        const v = { id: d.id, date: d.date, cust: d.cust, region: d.region, prod: d.prod, amt: d.amt, cur: d.cur }[kk];
        const num = kk === 'id' || (kk === 'amt' && /^\d+$/.test(d.amt));
        return `<span class="gs-c gs-k-${kk}${num ? ' gs-num' : ''}" style="width:${widths[kk]}px"><span class="gs-v">${esc(v)}</span></span>`;
      };
      const pane = x.el(`<div class="gs-pane gs-clean">
        <div class="gs-chr"><span class="gs-corner" style="width:${rnw}px"></span>${keys.map((kk, i) => `<span class="gs-cl" style="width:${widths[kk]}px">${letter(i)}</span>`).join('')}${extra.map((w, i) => `<span class="gs-cl" style="width:${w}px">${letter(keys.length + i)}</span>`).join('')}</div>
        <div class="gs-body">
          <div class="gs-rn" style="width:${rnw}px">${Array.from({ length: rows }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>
          <div class="gs-rows">
            <div class="gs-r">${keys.map(hdr).join('')}${filler}</div>
            ${DATA.map((d) => `<div class="gs-r${d.dup ? ' gs-dupr' : ''}">${keys.map((kk) => cell(kk, d)).join('')}${filler}</div>`).join('')}
            ${Array.from({ length: rows }, () => `<div class="gs-r">${keys.map((kk) => `<span class="gs-c" style="width:${widths[kk]}px"></span>`).join('')}${filler}</div>`).join('')}
          </div>
          <i class="gs-sel"></i>
        </div>
      </div>`);
      const rowsEl = [...pane.querySelectorAll('.gs-rows > .gs-r')];
      const data = DATA.map((d, i) => {
        const r = rowsEl[i + 1];
        const c = (kk) => r.querySelector(`.gs-k-${kk}`);
        return { d, r, date: c('date'), region: c('region'), amt: c('amt'), cur: c('cur'), state: '' };
      });
      return { pane, xs, widths, keys, rnw, data, head: rowsEl[0], sel: pane.querySelector('.gs-sel'), letters: [...pane.querySelectorAll('.gs-cl')], nums: [...pane.querySelectorAll('.gs-rn span')] };
    };

    // the dashboard tab: the same grid (uniform columns) with its content placed on the cells: the merged title row,
    // three KPI cells, the source table (wide only) and the two floating charts
    const buildDash = (tall, gw, gh, rnw) => {
      const ncol = tall ? 6 : 12, cw = Math.floor(gw / ncol);
      const rows = Math.ceil(gh / RH) + 2;
      const rh = (i) => (i < DROWS.length ? DROWS[i] : RH);
      const ry = (i) => { let y = 0; for (let j = 0; j < i; j++) y += rh(j); return y; };
      const span = ncol / 3;
      const kpis = KPIS.map(([lab, val], i) => `<div class="gs-kpi" style="left:${i * span * cw}px; top:${ry(2)}px; width:${span * cw}px; height:${rh(2) + rh(3)}px"><span>${esc(lab)}</span><b>${esc(val)}</b></div>`).join('');
      const top = ry(5) + 6;
      let src = '', c1, c2;
      if (tall) {
        const w = gw - 16, hh = (gh - top - 12 - 10) / 2;
        c1 = { x: 8, y: top, w, h: hh }; c2 = { x: 8, y: top + hh + 10, w, h: hh };
      } else {
        const sx = 0, sy = ry(5);
        src = `<div class="gs-src" style="left:${sx}px; top:${sy}px">
          <div class="gs-sr gs-sh"><span style="width:${cw}px">Month</span><span style="width:${cw}px">Revenue</span></div>
          ${MONTHS.map(([m, v]) => `<div class="gs-sr"><span style="width:${cw}px">${m} 2026</span><span class="gs-num" style="width:${cw}px">$${(v * 1000).toLocaleString('en-US')}</span></div>`).join('')}
          <div class="gs-sr gs-tot"><span style="width:${cw}px">Total</span><span class="gs-num" style="width:${cw}px">$${(TOTAL_K * 1000).toLocaleString('en-US')}</span></div>
        </div>`;
        const x0 = 2 * cw + 20, w = (gw - x0 - 16 - 12) / 2, hh = gh - top - 14;
        c1 = { x: x0, y: top, w, h: hh }; c2 = { x: x0 + w + 12, y: top, w, h: hh };
      }
      const dn = donutChart(Math.round(c2.w), Math.round(c2.h));
      const pane = x.el(`<div class="gs-pane gs-dash">
        <div class="gs-chr"><span class="gs-corner" style="width:${rnw}px"></span>${Array.from({ length: ncol + 1 }, (_, i) => `<span class="gs-cl" style="width:${cw}px">${letter(i)}</span>`).join('')}</div>
        <div class="gs-body">
          <div class="gs-rn" style="width:${rnw}px">${Array.from({ length: rows }, (_, i) => `<span style="height:${rh(i)}px">${i + 1}</span>`).join('')}</div>
          <div class="gs-rows">${Array.from({ length: rows }, (_, i) => `<div class="gs-r" style="height:${rh(i)}px">${Array.from({ length: ncol + 1 }, () => `<span class="gs-c" style="width:${cw}px; height:${rh(i)}px"></span>`).join('')}</div>`).join('')}
            <div class="gs-ov">
              <div class="gs-title" style="width:${ncol * cw}px; height:${rh(0)}px">${esc(TITLE)}</div>
              ${kpis}${src}
              <div class="gs-chart" style="left:${c1.x}px; top:${c1.y}px; width:${Math.round(c1.w)}px; height:${Math.round(c1.h)}px">${columnChart(Math.round(c1.w), Math.round(c1.h))}</div>
              <div class="gs-chart" style="left:${c2.x}px; top:${c2.y}px; width:${Math.round(c2.w)}px; height:${Math.round(c2.h)}px">${dn.html}</div>
            </div>
          </div>
          <i class="gs-sel" style="left:${rnw - 1}px; top:-1px; width:${ncol * cw + 1}px; height:${rh(0) + 1}px"></i>
        </div>
      </div>`);
      return {
        pane,
        kpis: [...pane.querySelectorAll('.gs-kpi')],
        cols: [...pane.querySelectorAll('.gs-col')].map((g) => ({ rect: g.querySelector('rect'), lbl: g.querySelector('text') })),
        segs: [...pane.querySelectorAll('.gs-seg')].map((n, i) => ({ n, ...dn.segs[i] })),
        C: dn.C,
        pls: [...pane.querySelectorAll('.gs-pl')],
        legs: [...pane.querySelectorAll('.gs-lg')],
      };
    };

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the tablet layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('gs-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gs-tall', tall);
      const rnw = tall ? RNW.tall : RNW.wide;
      const gw = AW - rnw, gh = AH - CHROME - CH;
      const keys = tall ? TALL_KEYS : WIDE_KEYS;
      const widths = tall ? TALL_W : Object.fromEntries(WIDE_KEYS.map((kk) => [kk, COLS[kk][1]]));
      const used = keys.reduce((a, kk) => a + widths[kk], 0);
      const extra = []; for (let w = used; w < gw + 100; w += 100) extra.push(100);
      grid.innerHTML = '';
      const clean = buildClean(keys, widths, rnw, Math.ceil(gh / RH) + 2, extra);
      const dash = buildDash(tall, gw, gh, rnw);
      grid.append(clean.pane, dash.pane);
      G = { clean, dash, tall, last: {} };
    };

    // the selection box on the Clean tab at (column key, row), its header letter and row number lit
    const select = (C, kk, row) => {
      const i = C.keys.indexOf(kk);
      C.sel.style.left = `${C.rnw + C.xs[i] - 1}px`;
      C.sel.style.top = `${row * RH - 1}px`;
      C.sel.style.width = `${C.widths[kk] + 1}px`;
      C.sel.style.height = `${RH + 1}px`;
      C.letters.forEach((l, j) => l.classList.toggle('on', j === i));
      C.nums.forEach((n, j) => n.classList.toggle('on', j === row));
    };
    const setTxt = (n, s) => { if (n && n.firstElementChild.textContent !== s) n.firstElementChild.textContent = s; };
    // a fixed cell's soft green flash, fading out from its flip
    const flash = (n, t, at) => {
      if (!n) return;
      const f = t >= at ? 1 - seg(t, at, at + FLASH) : 0;
      n.style.backgroundColor = f > 0 ? `rgba(206, 234, 214, ${(f * 0.95).toFixed(3)})` : '';
      n.style.boxShadow = f > 0 ? `inset 0 0 0 1px rgba(52, 168, 83, ${(f * 0.8).toFixed(3)})` : '';
    };

    // the tab centre in the window's own px (transform-free: the window's rect divided by its current scale)
    const tabPt = () => {
      const a = app.getBoundingClientRect(), b = tabs[2].getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.45) / sc, y: (b.top - a.top + b.height * 0.55) / sc };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (!G) return;
        const C = G.clean, D = G.dash;

        // ---- the Clean tab ----
        // duplicates: tint red and strike through, then close to 0 height (the rows below slide up)
        let kept = 0;
        C.data.forEach((o) => {
          const { d } = o;
          if (d.dup) {
            const g = outCubic(seg(t, T.tint, T.tint + TINT));
            o.r.style.backgroundColor = g > 0 ? `rgba(252, 232, 230, ${g.toFixed(3)})` : '';
            o.r.classList.toggle('gs-strike', t >= T.tint + TINT * 0.4);
            const c = inOutCubic(seg(t, T.col0, T.col1));
            o.r.style.height = `${(RH * (1 - c)).toFixed(2)}px`;
            o.r.style.opacity = (1 - seg(t, T.col0, T.col0 + COLLAPSE * 0.7)).toFixed(3);
            return;
          }
          const i = kept++;
          // dates (and a blank region with them), then the amounts and their currency
          const fd = T.date[i], fa = T.amt[i];
          setTxt(o.date, t >= fd ? d.dateC : d.date);
          o.date.classList.toggle('gs-num', t >= fd);
          flash(o.date, t, fd);
          if (!d.region) {
            setTxt(o.region, t >= fd + 0.02 ? d.regionC : '');
            flash(o.region, t, fd + 0.02);
          }
          setTxt(o.amt, t >= fa ? d.amtC : d.amt);
          o.amt.classList.toggle('gs-num', t >= fa || /^\d+$/.test(d.amt));
          flash(o.amt, t, fa);
          if (o.cur) { setTxt(o.cur, t >= fa ? 'USD' : d.cur); flash(o.cur, t, fa); }
        });
        // the Amount header is renamed as the amounts start
        const ah = C.head.querySelector('.gs-k-amt');
        setTxt(ah, t >= T.amt0 ? 'Amount (USD)' : 'Amount');
        flash(ah, t, T.amt0);
        // the selection follows the fix: A1, the Order date column, the Amount header
        const sk = t >= T.amt0 ? 'amt' : t >= T.col1 ? 'date' : 'id';
        if (G.last.sk !== sk) { select(C, sk, 0); G.last.sk = sk; }
        // the snackbar: rises in on the collapse, its text swaps to the result, gone when the tab changes
        const si = outCubic(seg(t, T.snack, T.snack + SNACK_IN)) * (1 - seg(t, T.dash, T.dash + 0.15));
        snack.style.opacity = si.toFixed(3);
        snack.style.transform = `translateY(${((1 - outCubic(seg(t, T.snack, T.snack + SNACK_IN))) * 16).toFixed(2)}px)`;
        const sw = seg(t, T.snack2, T.snack2 + SNACK_IN * 0.75);
        sn1.style.opacity = (1 - sw).toFixed(3);
        sn2.style.opacity = sw.toFixed(3);

        // ---- the tabs: the press on "Revenue dashboard", then the dashboard ----
        const onDash = t >= T.dash;
        tabs.forEach((tb, i) => tb.classList.toggle('on', onDash ? i === 2 : i === 1));
        const pr = press(t, T.press);
        tabs[2].style.backgroundColor = !onDash && pr > 0 ? `rgba(68, 71, 70, ${(0.12 * pr).toFixed(3)})` : '';
        const di = outCubic(seg(t, T.dash, T.dash + DASH_IN));
        C.pane.style.display = di >= 1 ? 'none' : '';
        D.pane.style.display = onDash ? '' : 'none';
        D.pane.style.opacity = onDash ? di.toFixed(3) : '0';
        const nb = onDash ? 'A1' : sk === 'amt' ? `${letter(C.keys.indexOf('amt'))}1` : sk === 'date' ? 'B1' : 'A1';
        if (nbt.textContent !== nb) nbt.textContent = nb;
        const fx = onDash ? TITLE : sk === 'amt' ? (t >= T.amt0 ? 'Amount (USD)' : 'Amount') : sk === 'date' ? 'Order date' : 'Order ID';
        if (fv.textContent !== fx) fv.textContent = fx;

        // the dashboard builds: KPI cells pop, the month columns grow, the donut sweeps round, the legend lands
        D.kpis.forEach((n2, i) => {
          const q = outCubic(seg(t, T.kpi[i], T.kpi[i] + KPI_IN));
          n2.style.opacity = q.toFixed(3);
          n2.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
        D.cols.forEach((c, i) => {
          const q = outCubic(seg(t, T.cols[i], T.cols[i] + COL_IN));
          c.rect.style.transform = `scaleY(${q.toFixed(4)})`;
          c.lbl.style.opacity = seg(t, T.cols[i] + COL_IN * 0.6, T.cols[i] + COL_IN).toFixed(3);
        });
        const p = inOutCubic(seg(t, T.pie, T.pie + PIE_IN)) * D.C;
        D.segs.forEach((s) => {
          const l = Math.max(0, Math.min(s.len, p - s.s));
          s.n.setAttribute('stroke-dasharray', `${l.toFixed(2)} ${D.C.toFixed(2)}`);
        });
        const lb = seg(t, T.pie + PIE_IN, T.pie + PIE_IN + LBL_IN);
        D.pls.forEach((n2) => { n2.style.opacity = lb.toFixed(3); });
        D.legs.forEach((n2, i) => { n2.style.opacity = outCubic(seg(t, T.leg[i], T.leg[i] + LEG_IN)).toFixed(3); });
      },
      // the pointer: it sets off from the grid for the "Revenue dashboard" tab, presses it, and fades while the
      // dashboard builds. In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!G || t < T.ptr - 0.15 || t > T.dash + 0.6) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const tp = tabPt();
        const from = { x: tp.x + (G.tall ? 150 : 420), y: tp.y - (G.tall ? 260 : 230) };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.dash + 0.3, T.dash + 0.6));
        return { x: lerp(from.x, tp.x, m) * s, y: lerp(from.y, tp.y, m) * s, p: press(t, T.press), v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
