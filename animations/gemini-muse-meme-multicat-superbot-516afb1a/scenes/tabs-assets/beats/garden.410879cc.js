// The garden variant's art: a printable garden design template (a 24 × 18 ft backyard plan on 1 ft grid paper, a key,
// the bed list and blank name/date fields) that Gemini draws inside the beat's build window. The sheet is a plan
// diagram, so it is SVG laid out here rather than a sourced image. paint(p) is a pure function of build progress: the
// frame and grid wipe in, outlines sketch in Gemini blue and settle to their ink as the fills flood, plants pop in on a
// sweep from the top left, then the labels, the key and the bed list land.
import { lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.9b47fc30.js';
import { shareDisc } from './share.29a362ea.js';

const W = 360, H = 256;
const X0 = 14, Y0 = 40, S = 10; // the plot's top-left corner on the sheet, and sheet px per ft
const PLOT = { w: 24, h: 18 };
const BLUE = [77, 138, 240];

const n = (v) => +v.toFixed(1);
const fx = (x) => n(X0 + x * S);
const fy = (y) => n(Y0 + y * S);
const ft = (v) => n(v * S);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, e) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], e))).join(',')})`;

// outlines as paths, so every one draws on through pathLength="1"
function rr(x, y, w, h, r = 0) {
  const [a, b, c, d, q] = [fx(x), fy(y), fx(x + w), fy(y + h), ft(r)];
  return `M${n(a + q)} ${b}H${n(c - q)}A${q} ${q} 0 0 1 ${c} ${n(b + q)}V${n(d - q)}A${q} ${q} 0 0 1 ${n(c - q)} ${d}H${n(a + q)}A${q} ${q} 0 0 1 ${a} ${n(d - q)}V${n(b + q)}A${q} ${q} 0 0 1 ${n(a + q)} ${b}Z`;
}
function ell(cx, cy, rx, ry = rx) {
  const [x, y, a, b] = [fx(cx), fy(cy), ft(rx), ft(ry)];
  return `M${n(x - a)} ${y}A${a} ${b} 0 1 0 ${n(x + a)} ${y}A${a} ${b} 0 1 0 ${n(x - a)} ${y}Z`;
}
function grid(step) {
  let d = '';
  for (let x = 0; x <= PLOT.w; x += step) d += `M${fx(x)} ${fy(0)}V${fy(PLOT.h)}`;
  for (let y = 0; y <= PLOT.h; y += step) d += `M${fx(0)} ${fy(y)}H${fx(PLOT.w)}`;
  return d;
}

const BEDS = [
  { tag: 'A', crop: 'Tomatoes', x: 1, y: 1, leaf: '#7fb064', dot: '#e0674f' },
  { tag: 'B', crop: 'Lettuce', x: 6, y: 1, leaf: '#a9cf7a', dot: '#d9ecb8' },
  { tag: 'C', crop: 'Peppers', x: 1, y: 5, leaf: '#7fb064', dot: '#f0a24a' },
  { tag: 'D', crop: 'Beans', x: 6, y: 5, leaf: '#6fa458', dot: '#b9d98f' },
  { tag: 'E', crop: 'Herbs', x: 1, y: 9.3, h: 3.3 },
];
const SOIL = { fill: '#cdb08b', ink: '#8c6c4c' };

// the filled areas, in draw order (each sketches on in blue, then settles to its ink as its fill floods)
const AREAS = [
  { d: rr(9.6, 9, 11, 8.4, 1.6), fill: '#d5e5b5', ink: '#9fbb7c' },
  { d: rr(0, 13.6, 8.6, 4.4), fill: '#d6cec1', ink: '#9f9687' },
  ...BEDS.map((b) => ({ d: rr(b.x, b.y, 4, b.h || 3, 0.25), ...SOIL })),
  { d: ell(19, 4, 2.4), fill: '#e2d9c6', ink: '#a89c84' },
  { d: ell(15.6, 12.8, 2.3, 1.35), fill: '#b6d9ea', ink: '#78acc6' },
];
// gravel: the aisle between the beds down to the patio, and the branch that curves out to the seating circle
const PATHS = [
  { d: `M${fx(5.5)} ${fy(0.6)}V${fy(13.6)}`, w: 0.8, a: 0.14 },
  { d: `M${fx(5.5)} ${fy(10.8)}C${fx(9)} ${fy(10.8)} ${fx(11.5)} ${fy(9.6)} ${fx(13.2)} ${fy(7.4)}S${fx(15.6)} ${fy(4)} ${fx(16.6)} ${fy(4)}`, w: 1.1, a: 0.2 },
];

function plants() {
  const out = [];
  BEDS.slice(0, 4).forEach((b) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) out.push({ x: b.x + 1.35 + i * 1.1, y: b.y + 0.9 + j * 1.2, r: 0.46, fill: b.leaf, ink: '#557d42', dot: b.dot, dr: 0.16 });
  });
  const herb = BEDS[4];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const lav = (i + j) % 2;
    out.push({ x: herb.x + 1.05 + i * 0.8, y: herb.y + 0.75 + j * 0.9, r: 0.3, fill: lav ? '#b9a3dc' : '#9fbf8a', ink: lav ? '#7d7398' : '#6d8f5b' });
  }
  const BLOOM = [['#e8a0b4', '#c46f88'], ['#b9a3dc', '#7d7398'], ['#f2c879', '#c59a45']];
  const bloom = (x, y, k) => out.push({ x, y, r: 0.42, fill: BLOOM[k % 3][0], ink: BLOOM[k % 3][1], dot: '#fff6e0', dr: 0.12 });
  // a flower ring round the seating circle, open on the west where the path comes in
  for (let k = 0, a = -150; a <= 150; a += 30, k++) bloom(19 + 3.1 * Math.cos(a * Math.PI / 180), 4 + 3.1 * Math.sin(a * Math.PI / 180), k);
  [[6.4, 13.05], [7.25, 13.05], [8.1, 13.05], [12.9, 12], [13.1, 13.7], [18.3, 12], [18.1, 13.7]].forEach(([x, y], k) => bloom(x, y, k + 1));
  [8.4, 11, 13.6, 16.2].forEach((y) => out.push({ x: 22.7, y, r: 1.15, fill: '#79a564', ink: '#4f7a3f', scallop: true }));
  out.push({ x: 12.9, y: 2.7, r: 2.55, fill: '#97bd7a', ink: '#5d8a4a', scallop: true, inner: 1.5, dot: '#7a5a3e', dr: 0.22 });
  // sweep rank: they land from the top left towards the bottom right
  const order = out.map((pl, i) => [pl.x + pl.y * 0.8, i]).sort((a, b) => a[0] - b[0]);
  order.forEach(([, i], k) => { out[i].at = 0.42 + 0.38 * (k / (order.length - 1)); });
  return out;
}

const KEY = [['Raised beds', SOIL.fill], ['Flowers', '#e8a0b4'], ['Shrubs & trees', '#79a564'], ['Lawn', '#d5e5b5'], ['Gravel path', '#ddd3bf'], ['Patio', '#d6cec1'], ['Pond', '#b6d9ea']];
const COL = 266; // the right-hand column: plot facts, the key and the bed list

function plantSvg(pl) {
  const r = ft(pl.r);
  const scallop = pl.scallop ? ` stroke-dasharray="${n(r * 0.42)} ${n(r * 0.16)}" stroke-width="1"` : ' stroke-width=".6"';
  return `<g transform="translate(${fx(pl.x)} ${fy(pl.y)}) scale(0)" opacity="0"><circle r="${r}" fill="${pl.fill}" stroke="${pl.ink}"${scallop}/>`
    + (pl.inner ? `<circle r="${ft(pl.inner)}" fill="none" stroke="#86ad69" stroke-width=".7"/>` : '')
    + (pl.dot ? `<circle r="${ft(pl.dr)}" fill="${pl.dot}"/>` : '') + '</g>';
}

function sheetSvg(PL) {
  const t = (x, y, cls, s, anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" opacity="0">${s}</text>`;
  const draw = (d, extra) => `<path d="${d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" opacity="0" ${extra}/>`;
  const furniture = [[19, 4 - 1.55], [19 + 1.55, 4], [19, 4 + 1.55], [19 - 1.55, 4]]
    .map(([x, y]) => `<rect x="${n(fx(x) - 3.5)}" y="${n(fy(y) - 3.5)}" width="7" height="7" rx="1.5" fill="#fbf8f1" stroke="#8f8471" stroke-width=".6"/>`).join('')
    + `<circle cx="${fx(19)}" cy="${fy(4)}" r="${ft(0.75)}" fill="#fbf8f1" stroke="#8f8471" stroke-width=".7"/>`;
  const pavers = `M${fx(2.15)} ${fy(13.6)}V${fy(18)}M${fx(4.3)} ${fy(13.6)}V${fy(18)}M${fx(6.45)} ${fy(13.6)}V${fy(18)}M${fx(0)} ${fy(15.8)}H${fx(8.6)}`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Garden design template">
<defs><clipPath id="gd-wipe-410879cc"><rect class="gd-wipe" x="${X0}" y="${Y0}" width="0" height="${ft(PLOT.h)}"/></clipPath></defs>
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="#ddd5c3" stroke-width=".6"/>
${t(14, 25, 'gd-t', 'GARDEN DESIGN<tspan class="gd-tk" dx="6">TEMPLATE</tspan>')}
<g class="gd-fields" opacity="0"><text x="196" y="25" class="gd-k">NAME</text><path d="M214 26.5H262" stroke="#b9b09c" stroke-width=".6"/><text x="270" y="25" class="gd-k">DATE</text><path d="M288 26.5H346" stroke="#b9b09c" stroke-width=".6"/></g>
${draw('M14 32.5H346', 'fill="none" stroke="#cfc6b2" stroke-width=".6"')}
<g clip-path="url(#gd-wipe-410879cc)" class="gd-grid"><path d="${grid(1)}" fill="none" stroke="#e7e0d0" stroke-width=".45"/><path d="${grid(6)}" fill="none" stroke="#d6ccb6" stroke-width=".7"/></g>
${PATHS.map((pa) => draw(pa.d, `class="gd-gravel" fill="none" stroke="#ddd3bf" stroke-width="${ft(pa.w)}"`)).join('')}
${AREAS.map((a) => draw(a.d, `class="gd-area" fill="${a.fill}" fill-opacity="0" stroke-width="1"`)).join('')}
<g class="gd-detail" opacity="0"><path d="${pavers}" fill="none" stroke="#b7ad9c" stroke-width=".6"/>${furniture}</g>
${PL.map(plantSvg).join('')}
${BEDS.map((b) => t(fx(b.x + 0.45), fy(b.y + (b.h || 3) / 2 + 0.22), 'gd-b', b.tag, 'middle')).join('')}
${t(fx(3.22), fy(15.05), 'gd-p', 'PATIO', 'middle')}${t(fx(15.6), fy(16.1), 'gd-p', 'LAWN', 'middle')}${t(fx(15.6), fy(12.98), 'gd-p', 'POND', 'middle')}${t(fx(19), fy(8.25), 'gd-p', 'SEATING', 'middle')}
${draw(rr(0, 0, PLOT.w, PLOT.h), 'fill="none" stroke="#4a4f43" stroke-width="1.1"')}
${t(COL, 47, 'gd-k', 'PLOT')}${t(COL, 56, 'gd-v', '24 × 18 ft')}${t(COL + 52, 47, 'gd-k', 'ZONE')}${t(COL + 52, 56, 'gd-v', '7b')}
${t(COL, 67, 'gd-k', 'SUN')}${t(COL, 76, 'gd-v', 'Full sun, south')}
<path d="M${COL} 83.5H346" stroke="#ddd5c3" stroke-width=".6"/>
${t(COL, 93, 'gd-k', 'KEY')}
${KEY.map(([label, c], i) => `<g class="gd-row" opacity="0"><rect x="${COL}" y="${96 + i * 9.5}" width="6" height="6" rx="1" fill="${c}" stroke="#a49a86" stroke-width=".4"/><text x="${COL + 10}" y="${101.4 + i * 9.5}" class="gd-l">${label}</text></g>`).join('')}
<path d="M${COL} 166.5H346" stroke="#ddd5c3" stroke-width=".6"/>
${t(COL, 176, 'gd-k', 'BEDS')}
${BEDS.map((b, i) => `<g class="gd-bed" opacity="0"><text x="${COL}" y="${185 + i * 8.6}" class="gd-l"><tspan class="gd-lb">${b.tag}</tspan><tspan dx="4">${b.crop}</tspan></text></g>`).join('')}
<g class="gd-foot" opacity="0">
<rect x="14" y="236" width="50" height="3" fill="#4a4f43"/><rect x="64" y="236" width="50" height="3" fill="#f7f4ec" stroke="#4a4f43" stroke-width=".6"/>
${'<text x="14" y="247" class="gd-k" opacity="1">0</text><text x="64" y="247" class="gd-k" opacity="1" text-anchor="middle">5</text><text x="114" y="247" class="gd-k" opacity="1" text-anchor="middle">10 FT</text>'}
<text x="132" y="240.5" class="gd-k" opacity="1">1 SQUARE = 1 FT</text>
<path d="M248 248L252 234L256 248L252 245Z" fill="#4a4f43"/><text x="252" y="231" class="gd-k" opacity="1" text-anchor="middle">N</text>
</g>
</svg>`;
}

export function makeGarden(x) {
  const PL = plants();
  const node = x.el(`<div class="qc-img qc-gd">${sheetSvg(PL)}<i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating template<b class="qc-genn"></b></span>${shareDisc('Garden design template')}</div>`);
  const q = (s) => [...node.querySelectorAll(s)];
  const svg = node.querySelector('svg');
  const gen = node.querySelector('.qc-gen'), pill = node.querySelector('.qc-genl'), pct = node.querySelector('.qc-genn'), share = node.querySelector('.qc-share');
  const wipe = svg.querySelector('.gd-wipe');
  const [title, ...texts] = q('svg > text');
  // every sketched outline with its window: the header rule and the plot's fence frame the sheet, gravel lays in its
  // own colour, areas sketch blue then settle
  const rule = svg.querySelector('path[d="M14 32.5H346"]');
  const fence = [...svg.children].filter((c) => c.tagName === 'path' && c.getAttribute('pathLength')).pop();
  const draws = [
    { el: rule, a: 0, b: 0.2 },
    { el: fence, a: 0.02, b: 0.24 },
    ...q('.gd-gravel').map((el, i) => ({ el, a: PATHS[i].a, b: PATHS[i].a + 0.3 })),
    ...q('.gd-area').map((el, i) => {
      const a = 0.16 + i * 0.035, b = a + 0.26;
      return { el, a, b, ink: rgb(AREAS[i].ink), fa: b - 0.08 };
    }),
  ];
  const plantEls = q('svg > g[transform]').map((el, i) => ({ el, pl: PL[i] }));
  // plan labels, then the column's facts, in reading order
  const planLabels = texts.filter((el) => /gd-b|gd-p/.test(el.getAttribute('class')));
  const facts = texts.filter((el) => /gd-k|gd-v/.test(el.getAttribute('class')));
  const fields = svg.querySelector('.gd-fields'), detail = svg.querySelector('.gd-detail'), foot = svg.querySelector('.gd-foot');
  const rows = q('.gd-row'), beds = q('.gd-bed');
  let lastP = -1, lastPct = -1;

  function paint(p) {
    const op = (el, v) => el.setAttribute('opacity', v.toFixed(3));
    op(title, outCubic(seg(p, 0.02, 0.2)));
    op(fields, outCubic(seg(p, 0.08, 0.26)));
    const g = inOutCubic(seg(p, 0.04, 0.32));
    wipe.setAttribute('width', ft(PLOT.w * g));
    draws.forEach((d) => {
      const e = inOutCubic(seg(p, d.a, d.b));
      d.el.setAttribute('opacity', e > 0 ? '1' : '0');
      d.el.setAttribute('stroke-dashoffset', (1 - e).toFixed(4));
      if (!d.ink) return;
      // a finished outline closes up (no dash seam) once its stroke has settled
      d.el.setAttribute('stroke-dasharray', e >= 1 ? 'none' : '1 1');
      d.el.setAttribute('stroke', mix(BLUE, d.ink, seg(p, d.b, d.b + 0.15)));
      d.el.setAttribute('fill-opacity', outCubic(seg(p, d.fa, d.fa + 0.18)).toFixed(3));
    });
    op(detail, outCubic(seg(p, 0.55, 0.7)));
    plantEls.forEach(({ el, pl }) => {
      const e = seg(p, pl.at, pl.at + 0.17);
      const s = e >= 1 ? 1 : Math.max(0, outBack(e));
      el.setAttribute('transform', `translate(${fx(pl.x)} ${fy(pl.y)}) scale(${s.toFixed(4)})`);
      op(el, outCubic(seg(e, 0, 0.4)));
    });
    planLabels.forEach((el, i) => op(el, outCubic(seg(p, 0.66 + i * 0.025, 0.8 + i * 0.025))));
    facts.forEach((el, i) => op(el, outCubic(seg(p, 0.3 + i * 0.025, 0.44 + i * 0.025))));
    rows.forEach((el, i) => op(el, outCubic(seg(p, 0.5 + i * 0.035, 0.64 + i * 0.035))));
    beds.forEach((el, i) => op(el, outCubic(seg(p, 0.64 + i * 0.04, 0.78 + i * 0.04))));
    op(foot, outCubic(seg(p, 0.74, 0.9)));
    gen.style.transform = `translateX(${lerp(-110, 110, (p * 1.6) % 1).toFixed(1)}%)`;
    gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
  }

  return {
    node,
    render(t, T, label) {
      const p = seg(t, T.w0, T.w1);
      if (p !== lastP) { paint(p); lastP = p; }
      const pc = Math.round(inOutCubic(p) * 100);
      if (pc !== lastPct) { pct.textContent = `${pc}%`; lastPct = pc; }
      pill.style.opacity = label;
      // the finished template is what there is to share: the disc comes in as the build pill leaves
      share.style.opacity = (1 - label).toFixed(3);
      share.style.visibility = label < 1 ? '' : 'hidden';
    },
  };
}
