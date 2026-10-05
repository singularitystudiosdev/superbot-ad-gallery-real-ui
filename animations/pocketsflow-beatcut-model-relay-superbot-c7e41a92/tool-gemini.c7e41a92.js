// Gemini app with the image tool on (Nano Banana Pro, gemini-3-pro-image): four 16:9 stills at 2K,
// generated for real on 2026-10-05. A loupe proves the model's strength: legible text inside the pixels.
import { h } from './shell.c7e41a92.js';
import { icon, geminiMark } from './icons.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { G, PANEL, CLIPS } from './plan.c7e41a92.js';

const ASK = 'Four stills for a Pocketsflow launch film, 16:9 at 2K. The text in them has to be readable: “New sale $29.00”, “keep $95 of every $100”, “pocketsflow.com”.';
const CELLS = [
  { src: 'img/nb1.jpg', x: 253, y: 122, used: true },
  { src: 'img/nb2.jpg', x: 647, y: 122, used: true },
  { src: 'img/nb3-sm.jpg', x: 253, y: 346, used: false },
  { src: 'img/nb4.jpg', x: 647, y: 346, used: true },
];
const CW = 380, CH = 214, LOUPE = 220, ZOOM = 2.6;
// Loupe stops: [cell, u, v] in the cell's 0..1 space (poster headline, then the phone's sale card).
const STOPS = [[3, 0.58, 0.33], [3, 0.6, 0.42], [0, 0.5, 0.5], [0, 0.52, 0.5]];

export function buildGemini() {
  const el = h(`<div class="tool t-gem">
<nav class="gnav"><span>${icon('filter')}</span><span>${icon('plus')}</span><span>${icon('message')}</span></nav>
<header class="gtop"><span class="gword">Gemini</span><span class="gpick">Nano Banana Pro ${icon('chevron')}</span><span class="gav">D</span></header>
<div class="gask" data-ask><span>${ASK}</span><em class="gtool">🍌 Images</em></div>
<div class="ghead" data-head>${geminiMark('gs')}<span class="gst"><span class="a" data-ga>Creating your images...</span><span class="b" data-gb>Here are 4 stills, 16:9 at 2K.</span></span>
  <span class="gmeta" data-meta>gemini-3-pro-image · 2752×1536 · SynthID</span></div>
${CELLS.map((c, i) => `<div class="gcell" data-cell style="left:${c.x}px;top:${c.y}px;width:${CW}px;height:${CH}px"><span class="gsh"></span><img src="${c.src}" alt="" data-img${i}>
  ${c.used ? `<span class="gpick-b" data-used>${icon('check')}In the edit</span>` : ''}</div>`).join('')}
<div class="gloupe" data-loupe style="width:${LOUPE}px;height:${LOUPE}px"></div>
<div class="gnote" data-note>Text rendered inside the image, not overlaid</div>
</div>`);
  const cells = [...el.querySelectorAll('[data-cell]')];
  const imgs = cells.map((c) => c.querySelector('img'));
  const shims = cells.map((c) => c.querySelector('.gsh'));
  const used = [...el.querySelectorAll('[data-used]')];
  const q = (s) => el.querySelector(s);
  const ask = q('[data-ask]'), head = q('[data-head]'), ga = q('[data-ga]'), gb = q('[data-gb]'), meta = q('[data-meta]');
  const loupe = q('[data-loupe]'), note = q('[data-note]');
  const RES = [G + 1.5, G + 1.7, G + 1.9, G + 2.1];
  const L0 = G + 2.7, L1 = G + 3.45, L2 = G + 3.6, L3 = G + 4.25;

  for (const c of CLIPS) {
    const i = { nb1: 0, nb2: 1, nb4: 3 }[c.id];
    if (i !== undefined) c.src = [CELLS[i].x, PANEL.tabsH + CELLS[i].y, CW, CH];
  }

  function loupeAt(t) {
    const seg = t < L1 ? [STOPS[0], STOPS[1], (t - L0) / (L1 - L0)] : [STOPS[2], STOPS[3], (t - L2) / (L3 - L2)];
    const [a, b, k] = seg;
    const cell = CELLS[a[0]];
    const u = lerp(a[1], b[1], clamp01(k)), v = lerp(a[2], b[2], clamp01(k));
    return { cell, u, v };
  }

  return {
    id: 'gemini', label: 'Nano Banana Pro', logo: 'brand/gemini-logo.svg', tileBg: '#fff', el,
    update(t) {
      const a0 = prog(t, G + 0.35, 0.35, EASE.standard);
      ask.style.opacity = a0.toFixed(3);
      ask.style.transform = `translateY(${((1 - a0) * 10).toFixed(2)}px)`;
      head.style.opacity = prog(t, G + 0.6, 0.3, EASE.standard).toFixed(3);
      const done = prog(t, G + 2.2, 0.3, EASE.standard);
      ga.style.opacity = (1 - done).toFixed(3);
      gb.style.opacity = done.toFixed(3);
      ga.style.webkitMaskPosition = `${(100 - ((((t - G) % 1.2) + 1.2) % 1.2) / 1.2 * 100).toFixed(1)}% 0`;
      meta.style.opacity = prog(t, G + 2.35, 0.3, EASE.standard).toFixed(3);
      cells.forEach((c, i) => {
        c.style.opacity = prog(t, G + 0.7 + i * 0.06, 0.3, EASE.standard).toFixed(3);
        const r = prog(t, RES[i], 0.55, EASE.outCubic);
        imgs[i].style.opacity = r.toFixed(3);
        imgs[i].style.filter = `blur(${((1 - r) * 18).toFixed(2)}px) saturate(${lerp(0.4, 1, r).toFixed(3)})`;
        imgs[i].style.transform = `scale(${lerp(1.06, 1, r).toFixed(4)})`;
        shims[i].style.opacity = (1 - r).toFixed(3);
        shims[i].style.backgroundPosition = `${(100 - ((((t - G) % 1.1) + 1.1) % 1.1) / 1.1 * 100).toFixed(1)}% 0`;
        if (!CELLS[i].used) c.style.filter = `saturate(${lerp(1, 0.25, prog(t, G + 4.2, 0.4, EASE.standard)).toFixed(3)}) brightness(${lerp(1, 0.7, prog(t, G + 4.2, 0.4, EASE.standard)).toFixed(3)})`;
      });
      used.forEach((u, i) => {
        const k = prog(t, G + 4.2 + i * 0.06, 0.35, EASE.outBack);
        u.style.opacity = clamp01(k).toFixed(3);
        u.style.transform = `scale(${lerp(0.6, 1, k).toFixed(4)})`;
      });
      const lv = prog(t, L0, 0.3, EASE.outBack) * (1 - prog(t, L3, 0.25, EASE.standard));
      const swap = Math.min(prog(t, L1, 0.12, EASE.standard), 1 - prog(t, L2, 0.12, EASE.standard));
      if (lv <= 0.001) {
        loupe.style.opacity = '0';
        note.style.opacity = '0';
        return;
      }
      const { cell, u, v } = loupeAt(t);
      const cx = cell.x + u * CW, cy = cell.y + v * CH;
      loupe.style.opacity = clamp01(lv * (1 - 0.85 * swap)).toFixed(3);
      loupe.style.left = `${(cx - LOUPE / 2).toFixed(2)}px`;
      loupe.style.top = `${(cy - LOUPE / 2).toFixed(2)}px`;
      loupe.style.transform = `scale(${lerp(0.5, 1, clamp01(lv)).toFixed(4)})`;
      loupe.style.backgroundImage = `url(${cell.src})`;
      loupe.style.backgroundSize = `${CW * ZOOM}px ${CH * ZOOM}px`;
      loupe.style.backgroundPosition = `${(LOUPE / 2 - u * CW * ZOOM).toFixed(2)}px ${(LOUPE / 2 - v * CH * ZOOM).toFixed(2)}px`;
      note.style.opacity = clamp01(lv).toFixed(3);
      note.style.left = `${(cx - 150).toFixed(2)}px`;
      note.style.top = `${(cy + LOUPE / 2 + 8).toFixed(2)}px`;
    },
  };
}
