// Gemini's answer: it reads the couch in the cafe photo. The say line streams, then the photo card: a scan line
// sweeps it, a box locks onto the sofa, an 84 in dimension line draws across its back and the three tags pin on
// (tan leather on the seat, walnut legs on the front leg). Positions are percentages of the 560x300 photo box,
// measured on img/couch.jpg (object-position 0 80%). Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Mid-century 3-seat sofa, tan leather, walnut legs, about 84 in wide. New, around $1,700.';
// the sofa's box in the photo, and where each tag pins
const BOX = { l: 12.5, r: 88.2, t: 31.7, b: 87.5 };
const DIM_Y = 27.4;
const TAGS = [
  { text: 'tan leather', x: 50, y: 61, side: 'r' },
  { text: '84 in', x: 50.3, y: DIM_Y, side: 'c' },
  { text: 'walnut legs', x: 18.8, y: 85.6, side: 'r' },
];

export default {
  times(r) {
    return { say: r + 0.02, card: r + 0.1, scan: r + 0.2, box: r + 0.56, dim: r + 0.7, tags: r + 0.8, end: r + 1.78 };
  },

  build(k, { el, esc, img }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const tags = TAGS.map((g, i) => `<span class="gi-tag gi-tag-${g.side}" style="left:${g.x}%;top:${g.y}%" data-i="${i}"><i class="gi-dot"></i><b>${esc(g.text)}</b></span>`).join('');
    const card = el(`<div class="gi-card">
  <img class="gi-photo" src="${img('couch.jpg')}" alt="Tan leather sofa in a cafe"/>
  <i class="gi-veil"></i><i class="gi-scan"></i>
  <span class="gi-box" style="left:${BOX.l}%;top:${BOX.t}%;width:${(BOX.r - BOX.l).toFixed(1)}%;height:${(BOX.b - BOX.t).toFixed(1)}%"><i></i><i></i><i></i><i></i></span>
  <span class="gi-dim" style="left:${BOX.l + 1}%;top:${DIM_Y}%;width:${(BOX.r - BOX.l - 2).toFixed(1)}%"><i class="gi-dim-l"></i></span>
  ${tags}
</div>`.replace(/>\s+</g, '><'));
    const q = (s) => card.querySelector(s);
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), scan: q('.gi-scan'), veil: q('.gi-veil'),
      box: q('.gi-box'), dim: q('.gi-dim'), dimL: q('.gi-dim-l'), tags: [...card.querySelectorAll('.gi-tag')],
    };
    let lastSay = -1;

    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        const a = outCubic(seg(t, T.card, T.card + 0.32));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px)`;

        // the read: a bright line sweeps down the photo under a faint blue wash, then lets go
        const s = inOutCubic(seg(t, T.scan, T.scan + 0.55));
        const sOn = seg(t, T.scan, T.scan + 0.06) * (1 - seg(t, T.scan + 0.5, T.scan + 0.62));
        n.scan.style.top = (s * 100).toFixed(2) + '%';
        n.scan.style.opacity = sOn.toFixed(3);
        n.veil.style.opacity = (0.5 * sOn).toFixed(3);
        n.veil.style.height = (s * 100).toFixed(2) + '%';

        // the box locks on: corners close in from a little wide
        const b = outBack(seg(t, T.box, T.box + 0.3));
        n.box.style.opacity = clamp(b * 1.4).toFixed(3);
        n.box.style.transform = `scale(${lerp(1.06, 1, b).toFixed(4)})`;

        // the dimension line draws out from the middle
        const d = outCubic(seg(t, T.dim, T.dim + 0.3));
        n.dim.style.opacity = clamp(d * 2).toFixed(3);
        n.dimL.style.transform = `scaleX(${d.toFixed(4)})`;

        n.tags.forEach((g, i) => {
          const p = outBack(seg(t, T.tags + i * 0.12, T.tags + i * 0.12 + 0.3));
          g.style.opacity = clamp(p * 1.5).toFixed(3);
          g.style.setProperty('--s', lerp(0.6, 1, p).toFixed(4));
        });
      },
    };
  },
};
