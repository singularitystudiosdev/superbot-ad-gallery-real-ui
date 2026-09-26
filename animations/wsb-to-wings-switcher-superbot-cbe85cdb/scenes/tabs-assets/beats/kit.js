// Shared pieces for the WSB-to-wings beats: the streamed reply line, the tool-chip rows (spinner -> green check,
// label swaps from "doing" to "done"), the card rise, number formats and the stroke icons. Every render is a pure
// function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

export const ICON = {
  up: '<svg viewBox="0 0 24 24"><path d="M12 4 4.5 12.5H9V20h6v-7.5h4.5Z"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 20l7.5-8.5H15V4H9v7.5H4.5Z"/></svg>',
  comment: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M14 5l6 6-6 6"/><path d="M20 11H10a6 6 0 0 0-6 6v2"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
};

export const comma = (n) => Math.round(n).toLocaleString('en-US');
export const money = (n) => '$' + n.toFixed(2);

// opacity + rise; a card also eases up from 97% scale
export function rise(n, p, dy = 10, scale = false) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)${scale ? ` scale(${lerp(0.97, 1, e).toFixed(4)})` : ''}`;
}
export const cardIn = (n, t, a) => rise(n, seg(t, a, a + 0.55), 18, true);

// the app's reply line, streamed in (the hidden tail keeps the line's width from the first frame)
export function say(x, text, t0, cps = 80) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = n.firstElementChild, hid = n.lastElementChild;
  let shown = -1;
  return {
    n,
    render(t) {
      const c = streamCount(text, t0, cps, t);
      if (c !== shown) { vis.textContent = text.slice(0, c); hid.textContent = text.slice(c); shown = c; }
    },
  };
}

// tool chips: [running label, done label] pairs landing at ins[i] and resolving at dones[i]
export function chips(x, pairs, ins, dones) {
  const rows = pairs.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
  const parts = rows.map((r) => ({ sp: r.querySelector('.spin'), lab: r.querySelector('.ch-tool-t') }));
  return {
    rows,
    marks: rows.map((r, i) => [ins[i], r]),
    render(t) {
      rows.forEach((r, i) => {
        rise(r, seg(t, ins[i], ins[i] + 0.35), 8);
        const done = t >= dones[i];
        const { sp, lab } = parts[i];
        sp.classList.toggle('done', done);
        sp.style.transform = done ? '' : `rotate(${(((t - ins[i]) * 450) % 360).toFixed(1)}deg)`;
        const s = done ? pairs[i][1] : pairs[i][0];
        if (lab.textContent !== s) lab.textContent = s;
      });
    },
  };
}
