// Shared helpers for the canvas beats: entrance tweens, text that only writes when it changes, number formats,
// crops of the meme photo (img/muse-meme.png, 870x1024: the scene, the note and the reaction are three bands),
// a film-grain fill for the generation passes, and the line icons the cards use.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

export const rise = (n, p, dy = 8) => {
  const e = outCubic(Math.min(1, Math.max(0, p)));
  n.style.opacity = e.toFixed(3);
  n.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
};
export const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const kfmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
export const countTo = (to, t, a, b) => to * outCubic(seg(t, a, b));
// draws an SVG stroke from its start (pathLength must be 1 on the element)
export const drawStroke = (n, p) => { n.style.strokeDashoffset = (1 - Math.min(1, Math.max(0, p))).toFixed(4); };

// a reply line that streams in while the rest of its box stays reserved (no reflow)
export function sayLine(x, text) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = n.firstElementChild, hid = n.lastElementChild;
  let shown = -1;
  return {
    n,
    render(t, t0, cps) {
      const c = streamCount(text, t0, cps, t);
      if (c !== shown) { vis.textContent = text.slice(0, c); hid.textContent = text.slice(c); shown = c; }
    },
  };
}

// the thread's link to a canvas tab: thumbnail, title, what it holds, an open arrow (lit while its pane shows)
export function refChip(x, { thumb, title, sub }) {
  return x.el(`<div class="cv-ref"><span class="cv-ref-th">${thumb}</span><span class="cv-ref-t"><b>${x.esc(title)}</b><small>${x.esc(sub)}</small></span><span class="cv-ref-go">${x.ICON.open}</span></div>`);
}

// crops of the meme photo: region [x, y, w, h] in its own px, covering a bw x bh box
export const MEME = { w: 870, h: 1024 };
export function crop(url, [x, y, w, h], bw, bh) {
  const s = Math.max(bw / w, bh / h);
  const ox = x * s - (bw - w * s) / 2, oy = y * s - (bh - h * s) / 2;
  return `background-image:url('${url}');background-size:${(MEME.w * s).toFixed(2)}px ${(MEME.h * s).toFixed(2)}px;background-position:${(-ox).toFixed(2)}px ${(-oy).toFixed(2)}px;`;
}
export const REGION = {
  scene: [0, 0, 870, 334],
  note: [0, 334, 870, 350],
  reaction: [0, 684, 870, 340],
  mascot: [470, 0, 300, 250],
  face: [528, 18, 150, 150],
  reader: [225, 684, 420, 340],
  noteText: [250, 360, 460, 210],
};

export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .55  0 0 0 0 .6  0 0 0 1.4 -.35"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>')}")`;

const sv = (d, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24">${d}</svg>`;
export const IC = {
  up: sv('<path d="M12 4 5 12h4.5v8h5v-8H19Z"/>', 'ic-fill'),
  comment: sv('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
  star: sv('<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/>', 'ic-fill'),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  eye: sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  doc: sv('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>'),
  img: sv('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  spark: sv('<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>'),
  arrow: sv('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  pin: sv('<path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  home: sv('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>'),
  card: sv('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  bag: sv('<path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  scooter: sv('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h7l3-8h3"/><path d="M13 17 11 9H8"/>'),
  pen: sv('<path d="M4 20l4-1 11-11-3-3L5 16Z"/><path d="m14 6 3 3"/>'),
};

export { lerp, seg, outCubic };
