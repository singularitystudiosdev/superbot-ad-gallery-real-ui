// Gemini watches the attached 0:52 walkthrough of the old apartment: the clip's scrubber runs while four frames
// (bedroom 0:06, living room 0:19, hallway boxes 0:33, stairwell 0:47) are scanned and marked with numbered boxes,
// the inventory fills beside them (1 queen bed, 2 dressers, 1 three-seat sofa, 1 55 in TV, 1 desk, 18 boxes), the
// stairwell adds the note '3rd floor walk-up, no elevator.' and the estimate chip lands: '2 movers, about 4 hours,
// truck needed.'
import { seg, outCubic, inOutCubic } from '../../../lib.js';
import { sayLine, rise, pop, mmss } from './kit.js';

const SAY = 'Watched your 0:52 walkthrough. Here is everything that has to move.';
// [image, timestamp, boxes [label, left%, top%, width%, height%], inventory rows [qty, item] marked from this frame]
const FRAMES = [
  ['walk-bedroom.jpg', 6, [['queen bed', 38, 29, 50, 47], ['dresser', 28, 15, 18, 30], ['dresser', 77, 28, 23, 70]], [['1', 'queen bed'], ['2', 'dressers']]],
  ['walk-living.jpg', 19, [['55 in TV', 3, 22, 20, 44], ['desk', 22, 32, 14, 24], ['three-seat sofa', 58, 34, 41, 66]], [['1', 'three-seat sofa'], ['1', '55 in TV'], ['1', 'desk']]],
  ['walk-boxes.jpg', 33, [['18 boxes', 39, 14, 33, 86]], [['18', 'boxes']]],
  ['walk-stairs.jpg', 47, [['3rd floor stairs', 9, 4, 45, 94]], []],
];
const NOTE = '3rd floor walk-up, no elevator.';
const EST = '2 movers, about 4 hours, truck needed.';
const IC = {
  video: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="14" height="13" rx="2"/><path d="M16.5 10l5-3v10l-5-3z"/></svg>',
  stairs: '<svg viewBox="0 0 24 24"><path d="M3 20h5v-4.5h4.5V11H17V6.5h4"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 2.5c.6 5 4.5 8.9 9.5 9.5-5 .6-8.9 4.5-9.5 9.5-.6-5-4.5-8.9-9.5-9.5 5-.6 8.9-4.5 9.5-9.5z"/></svg>',
};

export default {
  times(r) {
    const T = { say: r + 0.02, card: r + 0.2, play0: r + 0.45 };
    T.scan = FRAMES.map((_, i) => r + 0.5 + i * 0.72);           // each frame's scan starts
    T.mark = T.scan.map((a) => a + 0.45);                         // and its boxes start landing
    T.play1 = T.mark[3] + 0.2;
    T.note = T.mark[3] + 0.15;
    T.est = T.note + 0.5;
    T.end = r + 5.6;
    return T;
  },

  cues(T) {
    const out = [];
    FRAMES.forEach((f, i) => f[2].forEach((_, j) => out.push({ t: T.mark[i] + j * 0.12, kind: 'tag' })));
    out.push({ t: T.note, kind: 'pop' }, { t: T.est, kind: 'ok' });
    return out;
  },

  build(k, { el, esc, img }) {
    const T = k.T;
    const say = sayLine(el, esc, SAY);
    const frames = FRAMES.map(([f, ts, boxes], i) => `<div class="gw-fr"><img src="${img(f)}" alt=""/><i class="gw-scan"></i>${boxes.map(([l, x, y, w, h]) =>
      `<span class="gw-bx" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><em>${esc(l)}</em></span>`).join('')}<b class="gw-ts">${mmss(ts)}</b></div>`).join('');
    const rows = FRAMES.flatMap(([, , , inv], fi) => inv.map(([q, item]) => `<div class="gw-row" data-f="${fi}"><b>${esc(q)}</b><span>${esc(item)}</span></div>`)).join('');
    const card = el(`<div class="mv-card gw-card">
  <div class="gw-top"><span class="gw-file">${IC.video}walkthrough.mov</span><span class="gw-bar"><i></i></span><span class="gw-time">0:00 / 0:52</span></div>
  <div class="gw-body">
    <div class="gw-grid">${frames}</div>
    <div class="gw-list"><div class="gw-h">Inventory</div>${rows}<div class="gw-note">${IC.stairs}<span>${esc(NOTE)}</span></div></div>
  </div>
  <div class="gw-est">${IC.spark}<span>${esc(EST)}</span></div>
</div>`.replace(/>\s+</g, '><'));
    const n = {
      bar: card.querySelector('.gw-bar i'), time: card.querySelector('.gw-time'),
      frs: [...card.querySelectorAll('.gw-fr')].map((f) => ({ f, scan: f.querySelector('.gw-scan'), bxs: [...f.querySelectorAll('.gw-bx')] })),
      rows: [...card.querySelectorAll('.gw-row')], note: card.querySelector('.gw-note'), est: card.querySelector('.gw-est'),
    };
    let lastTime = '';

    return {
      nodes: [say.node, card],
      marks: [[T.card, card], [T.est, n.est]],
      render(t) {
        say.render(t, T.say);
        rise(card, t, T.card, 14);
        const pp = seg(t, T.play0, T.play1);
        n.bar.style.width = (pp * 100).toFixed(2) + '%';
        const tl = `${mmss(pp * 52)} / 0:52`;
        if (tl !== lastTime) { n.time.textContent = tl; lastTime = tl; }
        n.frs.forEach(({ f, scan, bxs }, i) => {
          const s = seg(t, T.scan[i], T.mark[i]);
          f.classList.toggle('gw-live', t >= T.scan[i] && t < T.mark[i] + 0.3);
          f.style.opacity = (0.35 + 0.65 * outCubic(seg(t, T.scan[i] - 0.1, T.scan[i] + 0.15))).toFixed(3);
          scan.style.opacity = (s > 0 && s < 1 ? 1 : 0).toString();
          scan.style.left = (inOutCubic(s) * 100).toFixed(2) + '%';
          bxs.forEach((b, j) => pop(b, t, T.mark[i] + j * 0.12));
        });
        let ri = 0;
        n.rows.forEach((row) => {
          const fi = +row.dataset.f;
          const j = ri - n.rows.findIndex((x) => +x.dataset.f === fi);
          rise(row, t, T.mark[fi] + 0.06 + j * 0.12, 6, 0.28);
          ri++;
        });
        pop(n.note, t, T.note);
        pop(n.est, t, T.est);
      },
    };
  },
};
