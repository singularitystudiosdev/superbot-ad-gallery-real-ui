// Nano Banana Pro's answer: the couch, in the user's own living room. The say line streams, then the room card:
// the BEFORE photo (empty wall, rug, brass floor lamp, fiddle-leaf fig) with a wipe handle at its right edge. The
// pointer grabs the handle and drags it across, revealing the AFTER photo (the same room, the tan sofa on the rug,
// lit by the same window); the sound bed's swoosh rides the drag. Then an 84 in dimension line settles over the
// sofa. Both photos are the same 16:9 frame (img/room-before.jpg, img/room-after.jpg). Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Here it is in your living room. Your rug, lamp and fig stay put.';
const FROM = 94, TO = 5; // the handle's travel, % of the card width
// the sofa in img/room-after.jpg, % of the frame
const SOFA = { l: 25.5, r: 74.6, top: 49.5 };

export default {
  times(r) {
    return { say: r + 0.02, card: r + 0.1, ptrIn: r + 0.3, grab: r + 0.56, drag: r + 0.62, drop: r + 1.47, dim: r + 1.52, end: r + 2.22 };
  },

  build(k, { el, esc, img, box }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const card = el(`<div class="rw-card">
  <img class="rw-img" src="${img('room-after.jpg')}" alt="Living room with the tan sofa"/>
  <div class="rw-before"><img class="rw-img" src="${img('room-before.jpg')}" alt="Living room before"/></div>
  <span class="rw-lab rw-lab-b">Before</span><span class="rw-lab rw-lab-a">After</span>
  <span class="rw-dim" style="left:${SOFA.l + 0.6}%;top:${SOFA.top}%;width:${(SOFA.r - SOFA.l - 1.2).toFixed(1)}%"><i class="rw-dim-l"></i><b>84 in</b></span>
  <span class="rw-handle"><i class="rw-bar"></i><i class="rw-knob"><svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg></i></span>
</div>`.replace(/>\s+</g, '><'));
    const q = (s) => card.querySelector(s);
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), before: q('.rw-before'), handle: q('.rw-handle'),
      knob: q('.rw-knob'), labB: q('.rw-lab-b'), labA: q('.rw-lab-a'), dim: q('.rw-dim'), dimL: q('.rw-dim-l'), dimB: q('.rw-dim b'),
    };
    let lastSay = -1;
    const at = (t) => lerp(FROM, TO, inOutCubic(seg(t, T.drag, T.drop)));

    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        const a = outCubic(seg(t, T.card, T.card + 0.32));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px)`;

        // the wipe: BEFORE shows left of the handle, AFTER right of it
        const x = at(t);
        n.before.style.clipPath = `inset(0 ${(100 - x).toFixed(3)}% 0 0)`;
        n.handle.style.left = x.toFixed(3) + '%';
        const held = seg(t, T.grab - 0.06, T.grab + 0.06) * (1 - seg(t, T.drop, T.drop + 0.12));
        n.knob.style.transform = `translate(-50%, -50%) scale(${(1 + 0.12 * held).toFixed(4)})`;
        n.labB.style.opacity = clamp((x - 14) / 10).toFixed(3);
        n.labA.style.opacity = clamp((86 - x) / 10).toFixed(3);

        const d = outCubic(seg(t, T.dim, T.dim + 0.3));
        n.dim.style.opacity = clamp(d * 2).toFixed(3);
        n.dimL.style.transform = `scaleX(${d.toFixed(4)})`;
        n.dimB.style.transform = `translate(-50%, -50%) scale(${lerp(0.6, 1, outBack(seg(t, T.dim + 0.1, T.dim + 0.38))).toFixed(4)})`;
      },
      // the pointer comes in, grabs the knob and drags it across (section px via box)
      pointer(t) {
        if (t < T.ptrIn || t > T.drop + 0.35) return null;
        const kb = box(n.knob);
        const cx = kb.x + kb.w / 2, cy = kb.y + kb.h / 2;
        let x = cx + 4, y = cy + 6;
        if (t < T.grab) { const m = inOutCubic(seg(t, T.ptrIn, T.grab - 0.04)); x = lerp(cx + 70, cx + 4, m); y = lerp(cy + 120, cy + 6, m); }
        const v = seg(t, T.ptrIn, T.ptrIn + 0.15) * (1 - seg(t, T.drop + 0.15, T.drop + 0.35));
        const p = seg(t, T.grab - 0.06, T.grab + 0.04) * (1 - seg(t, T.drop, T.drop + 0.1));
        return { x, y, p, v };
      },
    };
  },
};
