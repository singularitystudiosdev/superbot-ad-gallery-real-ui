// shared helpers for the beats: pure functions of t, no clock of their own.
import { seg, outCubic, streamCount } from '../../../lib.js';

export const rise = (n, p, dy = 8) => {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
};

// a streamed line: the visible prefix plus the hidden rest (so the line's height is reserved and nothing reflows)
export function sayLine(x, text, cls = 'qc-say') {
  const node = x.el(`<div class="${cls}"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = node.firstElementChild, hid = node.lastElementChild;
  let shown = -1;
  return {
    node,
    update(t, t0, cps) {
      const n = streamCount(text, t0, cps, t);
      if (n !== shown) { vis.textContent = text.slice(0, n); hid.textContent = text.slice(n); shown = n; }
    },
  };
}

// a status chip: spinner -> check, a label that changes when it resolves, and an optional counter
export function statusChip(x, run, done, counter) {
  const node = x.el(`<div class="sw-chip"><span class="sw-sp"></span><span class="sw-chip-t">${x.esc(run)}</span>${counter ? '<b class="sw-chip-n">0</b>' : ''}</div>`);
  const sp = node.firstElementChild, lab = sp.nextElementSibling, cnt = counter ? node.lastElementChild : null;
  let lastLab = '';
  return {
    node,
    update(t, t0, tDone, count) {
      const isDone = t >= tDone;
      sp.classList.toggle('done', isDone);
      sp.style.transform = isDone ? '' : `rotate(${(((t - t0) * 450) % 360).toFixed(1)}deg)`;
      const l = isDone ? done : run;
      if (l !== lastLab) { lab.textContent = l; lastLab = l; }
      if (cnt && count !== undefined) { cnt.textContent = count; cnt.style.display = isDone ? 'none' : ''; }
    },
  };
}

export { seg, outCubic };
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ic = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
// neutral line icons (no brand marks anywhere)
export const ICONS = {
  clip: ic('<rect x="7" y="5" width="11" height="15" rx="2.2"/><path d="M10 5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1"/><path d="M10 11h5M10 14.5h3.5"/>'),
  star: ic('<path d="M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.7 5.4-.7z"/>'),
  img: ic('<rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5 3 3L15 13l4 4"/>'),
  arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};
