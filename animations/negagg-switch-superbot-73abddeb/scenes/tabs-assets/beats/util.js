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
      if (cnt && count !== undefined) cnt.textContent = count;
    },
  };
}

export { seg, outCubic };
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const TREE = '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
export const BIKE = '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9 8h5l4.5 9"/><path d="M9 8 7.5 5.5H6"/><path d="m14 8-4.5 9"/></svg>';
export const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
