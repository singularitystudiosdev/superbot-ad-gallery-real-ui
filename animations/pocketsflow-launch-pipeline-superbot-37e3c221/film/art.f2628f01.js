// Product art for the Pocketsflow launch film, built by hand for this ad at the user's request (no stock, no
// generated pixels): four creator product covers, the sunset landscape the preset pack ships with, and a dotted
// world map rasterised once to a canvas. The products are the creator pages pocketsflow.com itself shows
// (inesonfilm presets, studionord icons, hanadraws zine, kofibeats drum kit), fetched 2026-10-05.
import { rnd } from './kit.f2628f01.js';

// the preset pack's sunset: sky, sun, two ridges, sea and its glint. ids carry a per-instance suffix: duplicate
// gradient ids resolve to the first in the document, which may sit in a hidden shot of another film instance.
export function landscape(id) {
  return `<svg class="pff-land" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c56f"/><stop offset=".6" stop-color="#f19a6a"/><stop offset="1" stop-color="#e3706b"/></linearGradient>
    <linearGradient id="sea${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d7f93"/><stop offset="1" stop-color="#2c394b"/></linearGradient>
  </defs>
  <rect width="400" height="176" fill="url(#sky${id})"/>
  <circle cx="262" cy="150" r="56" fill="#fff1cf" opacity=".26"/>
  <circle cx="262" cy="150" r="30" fill="#fff4d9"/>
  <path d="M112 70q5-5 10 0q5-5 10 0M150 58q4-4 8 0q4-4 8 0M96 88q3-3 6 0q3-3 6 0" stroke="#8a4642" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M0 150L40 128L78 140L120 112L162 138L205 120L240 142L290 126L330 140L372 118L400 132V176H0Z" fill="#c8705e"/>
  <path d="M0 168L52 146L96 160L140 140L186 162L232 150L276 166L318 152L360 164L400 150V180H0Z" fill="#8a4642"/>
  <rect y="174" width="400" height="86" fill="url(#sea${id})"/>
  <g fill="#ffe0ad"><rect x="232" y="182" width="60" height="3" rx="1.5" opacity=".85"/><rect x="242" y="192" width="40" height="3" rx="1.5" opacity=".6"/><rect x="250" y="202" width="24" height="2.5" rx="1.25" opacity=".45"/><rect x="255" y="212" width="14" height="2" rx="1" opacity=".3"/></g>
  <path d="M0 232Q60 224 120 234T240 232T400 230V260H0Z" fill="#1f2a38" opacity=".55"/>
</svg>`;
}

const ICONS = [
  '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 .5 9.5z"/>',
  '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
];

// the four covers, each a self-contained block that fills its box
export function cover(kind, id) {
  if (kind === 'presets') {
    return `<div class="pff-cv pff-cv-presets">${landscape(id)}<i class="pff-cv-strip"></i>
      <span class="pff-cv-t">Presets<br/>Vol. 3</span><span class="pff-cv-m">PORTRA 400 LOOK</span></div>`;
  }
  if (kind === 'icons') {
    return `<div class="pff-cv pff-cv-icons"><div class="pff-cv-grid">${ICONS.map((d) => `<svg viewBox="0 0 24 24">${d}</svg>`).join('')}</div>
      <span class="pff-cv-t">Nord Icons 2.0</span><span class="pff-cv-m">1,200 ICONS</span></div>`;
  }
  if (kind === 'zine') {
    return `<div class="pff-cv pff-cv-zine"><i class="pff-cv-dots"></i><span class="pff-cv-t">BIG<br/>DOG</span><span class="pff-cv-m">ZINE No. 4</span></div>`;
  }
  const bars = Array.from({ length: 34 }, (_, i) => {
    const h = 8 + Math.round((0.25 + 0.75 * rnd(i + 3) * Math.sin(Math.PI * (i + 1) / 35)) * 64);
    return `<rect x="${i * 6}" y="${40 - h / 2}" width="3.4" height="${h}" rx="1.7"/>`;
  }).join('');
  return `<div class="pff-cv pff-cv-beats"><i class="pff-cv-disc"></i><svg class="pff-cv-wave" viewBox="0 0 204 80">${bars}</svg>
    <span class="pff-cv-t">LOG DRUM</span><span class="pff-cv-m">VOL. 3</span></div>`;
}

export const PRODUCTS = {
  presets: { name: 'Presets Vol. 3', by: 'Inês Duarte', price: '$29' },
  icons: { name: 'Nord Icons 2.0', by: 'Studio Nord', price: '$49' },
  zine: { name: 'Big Dog Zine No. 4', by: 'Hana Draws', price: '$12' },
  beats: { name: 'Log Drum Vol. 3', by: 'Kofi Beats', price: '$39' },
};

export const tile = (kind, id) => {
  const p = PRODUCTS[kind];
  return `<div class="pff-tile">${cover(kind, id)}<div class="pff-tile-f"><div><b>${p.name}</b><small>${p.by}</small></div><span class="pff-price">${p.price}</span></div></div>`;
};

// ---------- the world, as dots ----------
// rough continent outlines, [lon, lat] pairs: a stylised map, not a survey
const LAND = [
  [[-168, 66], [-162, 70], [-140, 70], [-120, 72], [-95, 72], [-80, 73], [-65, 62], [-55, 52], [-66, 45], [-76, 38], [-81, 31], [-80, 25], [-90, 29], [-97, 26], [-97, 21], [-87, 21], [-83, 10], [-78, 8], [-85, 12], [-92, 15], [-105, 20], [-112, 29], [-118, 33], [-124, 40], [-125, 48], [-133, 56], [-148, 60], [-165, 60]],
  [[-50, 60], [-42, 60], [-20, 70], [-20, 80], [-60, 82], [-72, 77], [-55, 68]],
  [[-78, 8], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-38, -15], [-48, -26], [-58, -38], [-65, -42], [-68, -52], [-74, -50], [-72, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 1]],
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [5, 53], [8, 57], [5, 62], [12, 66], [20, 70], [30, 71], [40, 68], [45, 60], [40, 50], [30, 46], [28, 41], [22, 37], [15, 38], [12, 44], [8, 44], [3, 42], [-2, 37]],
  [[-6, 50], [2, 51], [-2, 56], [-5, 58], [-6, 55]],
  [[-17, 15], [-16, 24], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [42, -2], [40, -15], [35, -25], [20, -35], [17, -29], [12, -17], [13, -5], [9, 4], [0, 5], [-8, 4], [-13, 8]],
  [[28, 41], [36, 36], [35, 30], [44, 12], [52, 15], [58, 22], [60, 25], [67, 25], [72, 20], [77, 8], [80, 15], [88, 22], [92, 21], [98, 16], [103, 2], [104, 10], [109, 12], [108, 21], [117, 24], [122, 31], [121, 38], [126, 38], [130, 43], [141, 46], [142, 53], [156, 58], [163, 63], [180, 66], [180, 70], [140, 72], [110, 77], [80, 73], [68, 70], [55, 68], [45, 60], [40, 50], [50, 45], [48, 40], [40, 41]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 45], [139, 39], [133, 34]],
  [[95, 5], [105, -6], [115, -8], [125, -9], [140, -4], [131, -1], [118, 1], [109, 2], [100, 2]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [131, -32], [115, -34], [113, -26]],
  [[172, -34], [178, -38], [174, -41], [167, -46], [171, -41]],
];
export const MAP = { w: 1160, lat0: 76, lat1: -56 };
MAP.k = MAP.w / 360;
MAP.h = Math.round((MAP.lat0 - MAP.lat1) * MAP.k);
export const proj = (lon, lat) => ({ x: (lon + 180) * MAP.k, y: (MAP.lat0 - lat) * MAP.k });

const inside = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

let mapUrl = null;
export function worldDots() {
  if (mapUrl) return mapUrl;
  const S = 2, step = 8.6;
  const cv = document.createElement('canvas');
  cv.width = MAP.w * S; cv.height = MAP.h * S;
  const g = cv.getContext('2d');
  g.scale(S, S);
  g.fillStyle = 'rgba(11,11,11,.24)';
  for (let y = step / 2; y < MAP.h; y += step) {
    for (let x = step / 2; x < MAP.w; x += step) {
      const lon = x / MAP.k - 180, lat = MAP.lat0 - y / MAP.k;
      if (LAND.some((p) => inside([lon, lat], p))) { g.beginPath(); g.arc(x, y, 2.1, 0, Math.PI * 2); g.fill(); }
    }
  }
  mapUrl = cv.toDataURL('image/png');
  return mapUrl;
}
