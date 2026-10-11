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
export { money } from './data.js';
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ic = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
// neutral line icons for the statement's categories and the subscriptions (no brand marks anywhere)
export const ICONS = {
  rent: ic('<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>'),
  groc: ic('<path d="M4 5h2l2 10h9l2-7H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>'),
  eat: ic('<path d="M7 4v7a2 2 0 0 0 2 2v7"/><path d="M5 4v5M9 4v5"/><path d="M17 4c-2 1.5-2.5 4-2.5 7H17v9"/>'),
  trans: ic('<rect x="5" y="4" width="14" height="12" rx="3"/><path d="M5 11h14"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/><path d="M8 16l-2 4M16 16l2 4"/>'),
  subs: ic('<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>'),
  other: ic('<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'),
  play: ic('<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M10.5 9.5v5l4.5-2.5z"/>'),
  note: ic('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
  cloud: ic('<path d="M7 18a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 9.5 4.3 4.3 0 0 1 17 18z"/>'),
  bolt: ic('<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>'),
  book: ic('<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 0 7.5 23H19"/>'),
  laptop: ic('<rect x="5" y="5" width="14" height="10" rx="2"/><path d="M3 19h18"/>'),
  bell: ic('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
};
