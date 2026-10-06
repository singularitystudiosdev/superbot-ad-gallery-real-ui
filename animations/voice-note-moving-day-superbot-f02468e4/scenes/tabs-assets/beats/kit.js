// Shared pieces for the moving-day beats: the streamed one-line answer, eased entrances, step chips that resolve to
// green checks, the press curve of a pointer click, a pointer path through on-screen targets and the voice note's
// waveform. Every function is pure in t, so any frame can be rendered on its own.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

export const press = (t, at) => Math.sin(Math.PI * seg(t, at - 0.04, at + 0.14));

// the answer line, streamed in at cps characters a second (the unstreamed tail keeps the line's height)
export function sayLine(el, esc, text) {
  const node = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(text)}</span></div>`);
  const vis = node.firstElementChild, hid = node.lastElementChild;
  let last = -1;
  return {
    node,
    render(t, at, cps = 110) {
      const c = Math.floor(clamp((t - at) * cps, 0, text.length));
      if (c === last) return;
      vis.textContent = text.slice(0, c);
      hid.textContent = text.slice(c);
      last = c;
    },
  };
}

// fade and rise into place over d seconds from at
export function rise(node, t, at, dy = 12, d = 0.34) {
  const p = outCubic(seg(t, at, at + d));
  node.style.opacity = p.toFixed(3);
  node.style.visibility = p > 0 ? 'visible' : 'hidden';
  node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
  return p;
}

// a small overshooting pop, for chips and tags
export function pop(node, t, at) {
  const p = outBack(seg(t, at, at + 0.3));
  node.style.opacity = clamp(p * 1.3).toFixed(3);
  node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px) scale(${lerp(0.85, 1, p).toFixed(3)})`;
}

// crossfade a screen in (and slide it a little from the right)
export function show(node, p, dx = 0) {
  node.style.opacity = p.toFixed(3);
  node.style.visibility = p > 0 ? 'visible' : 'hidden';
  node.style.transform = p >= 1 || !dx ? 'none' : `translateX(${((1 - p) * dx).toFixed(2)}px)`;
}

// Superbot's step chips: [running label, done label]; times[i] = [lands, resolves]
export function stepChips(el, esc, list) {
  const node = el(`<div class="sh-chips">${list.map(([run]) => `<span class="ch-tool"><i class="spin"></i><span class="sh-cl">${esc(run)}</span></span>`).join('')}</div>`);
  const chips = [...node.children].map((c) => ({ c, spin: c.querySelector('.spin'), lab: c.querySelector('.sh-cl') }));
  return {
    node,
    render(t, times) {
      chips.forEach((ch, i) => {
        const [a, d] = times[i];
        pop(ch.c, t, a);
        const done = t >= d;
        ch.spin.classList.toggle('done', done);
        ch.c.classList.toggle('sh-ok', done);
        const want = list[i][done ? 1 : 0];
        if (ch.lab.textContent !== want) ch.lab.textContent = want;
        ch.spin.style.transform = done ? 'none' : `rotate(${((t - a) * 400).toFixed(1)}deg)`;
      });
    },
  };
}

// the pointer through targets: stops = [[t, node, fx, fy], ...]; it glides in from below the first target, eases
// between stops (leaving each 0.12 s after its press) and fades out after the last
export function pointerPath(box, t, stops, enter, leave) {
  if (t < enter || t > leave + 0.25) return null;
  const at = ([, node, fx = 0.5, fy = 0.5]) => { const b = box(node); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pts = stops.map((s) => [s[0], at(s)]);
  const start = { x: pts[0][1].x - 60, y: pts[0][1].y + 150 };
  let x = start.x, y = start.y;
  let prevT = enter, prev = start;
  for (let i = 0; i < pts.length; i++) {
    const [t1, p1] = pts[i];
    const s0 = i === 0 ? prevT : prevT + 0.12;
    if (t <= s0) { x = prev.x; y = prev.y; break; }
    const m = inOutCubic(seg(t, s0, t1 - 0.05));
    x = lerp(prev.x, p1.x, m); y = lerp(prev.y, p1.y, m);
    if (t < t1) break;
    prevT = t1; prev = p1;
  }
  const v = seg(t, enter, enter + 0.15) * (1 - seg(t, leave, leave + 0.25));
  const p = Math.max(0, ...stops.map((s) => press(t, s[0])));
  return { x, y, p, v };
}

// the voice note's waveform: n bar heights in 0..1, the same shape wherever it is drawn (a speech-like envelope:
// phrases with short gaps between them)
export function waveBars(n) {
  let s = 0x2468e4;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const phrase = 0.55 + 0.45 * Math.abs(Math.sin(u * Math.PI * 5.2 + 0.4));
    const gap = (Math.abs(Math.sin(u * Math.PI * 7.3 + 1.1)) < 0.12) ? 0.25 : 1;
    return clamp(0.18 + 0.82 * phrase * gap * (0.45 + 0.55 * rnd()), 0.14, 1);
  });
}
export const waveHTML = (n, cls) => waveBars(n).map((h) => `<i class="${cls}" style="height:${(h * 100).toFixed(0)}%"></i>`).join('');
export const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
