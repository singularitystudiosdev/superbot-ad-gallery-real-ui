// scenes/gh-rail.js: the model rail (bible MOTION ADDENDUM), the model-switch readout of beats C and D. A left
// stage column, 404 px wide, beside the framed browser: four chips top to bottom, Gemini, Claude Opus 5.5,
// GPT-6 Astra, superbot (avatar 64 px, name 40 px). The chip of a commit's author lights the moment that commit row
// lands (the previous one dims) and a thin connector draws from the chip to the row. Plain display: no hover, no
// pressed state, nothing that reads as a button. superbot's avatar is the live mark itself (mark.js).
import { seg, outCubic, op, boxIn } from '../lib.js';
import { makeMark, poseMark } from '../mark.js';
import { ROWS } from './gh.js';

const MODELS = [
  { name: 'Gemini', img: 'img/avatar-gemini.png', role: 'repro for #482', color: '110, 140, 255' },
  { name: 'Claude Opus 5.5', img: 'img/avatar-opus.png', role: 'the fix + test', color: '217, 119, 87' },
  { name: 'GPT-6 Astra', img: 'img/avatar-astra.png', role: 'review fixes', color: '45, 212, 191' },
  { name: 'superbot', img: null, role: 'changelog', color: '192, 38, 211' },
];
const IN = [1.35, 1.35 + 9 / 30];     // the rail slides in with the Commits tab
const OUT = [4.46, 4.46 + 7 / 30];    // ...and leaves as the checks dialog opens (D)
const LIT = 6 / 30;                   // chip light-up / dim crossfade
const DRAW = 8 / 30;                  // connector draw-in

export function mountRail(section) {
  const rail = document.createElement('div');
  rail.className = 'mrail';
  rail.innerHTML = MODELS.map((m) => `
  <div class="mchip" style="--c:${m.color}">
    <span class="mchip-av">${m.img ? `<img src="${m.img}" alt="">` : ''}</span>
    <span class="mchip-tx"><b>${m.name}</b><small>${m.role}</small></span>
  </div>`).join('');
  section.appendChild(rail);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mlinks');
  svg.setAttribute('viewBox', '0 0 1920 1080');
  svg.innerHTML = MODELS.map((m) => `<g style="--c:${m.color}"><path pathLength="1" d=""/><circle r="7" cx="0" cy="0"/></g>`).join('');
  section.appendChild(svg);
  const chips = [...rail.querySelectorAll('.mchip')];
  const mark = makeMark(chips[3].querySelector('.mchip-av'), 52);
  return { rail, chips, links: [...svg.querySelectorAll('g')], mark };
}

/** lit amount 0..1 of chip i at t: on from its row's landing until the next row lands */
function litOf(i, t) {
  const on = seg(t, ROWS[i], ROWS[i] + LIT);
  const next = ROWS[i + 1];
  return next === undefined ? on : on * (1 - seg(t, next, next + LIT));
}

export function renderRail(r, t, rows, section) {
  const vis = outCubic(seg(t, IN[0], IN[1])) * (1 - outCubic(seg(t, OUT[0], OUT[1])));
  const shown = vis > 0.001;
  r.rail.style.visibility = shown ? 'visible' : 'hidden';
  op(r.rail, vis);
  const slide = (1 - outCubic(seg(t, IN[0], IN[1]))) * -48 + outCubic(seg(t, OUT[0], OUT[1])) * -64;
  r.rail.style.transform = `translateX(${slide.toFixed(2)}px)`;
  poseMark(r.mark, t);

  r.chips.forEach((chip, i) => {
    const lit = litOf(i, t);
    chip.style.setProperty('--lit', lit.toFixed(3));
    chip.style.opacity = (0.42 + 0.58 * Math.max(lit, t < ROWS[0] ? 0.35 : 0)).toFixed(3);
  });

  // connectors: chip right edge -> the row's left edge, in stage px (boxIn divides out the stage fit)
  r.links.forEach((g, i) => {
    const lit = litOf(i, t);
    const a = lit * vis;
    if (!shown || a <= 0.001) { g.style.opacity = '0'; return; }
    const cb = boxIn(r.chips[i], section), rb = boxIn(rows[i], section);
    const x0 = cb.x + cb.w + 2, y0 = cb.cy, x1 = rb.x - 10, y1 = rb.cy;
    const mx = (x0 + x1) / 2;
    const path = g.querySelector('path'), dot = g.querySelector('circle');
    path.setAttribute('d', `M${x0.toFixed(1)} ${y0.toFixed(1)} C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`);
    const d = outCubic(seg(t, ROWS[i], ROWS[i] + DRAW));
    path.style.strokeDashoffset = (1 - d).toFixed(4);
    dot.setAttribute('cx', x1.toFixed(1)); dot.setAttribute('cy', y1.toFixed(1));
    dot.style.opacity = seg(d, 0.8, 1).toFixed(3);
    g.style.opacity = a.toFixed(3);
  });
}
