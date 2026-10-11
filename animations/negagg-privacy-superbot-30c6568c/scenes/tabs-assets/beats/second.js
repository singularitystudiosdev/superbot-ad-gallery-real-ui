// The second answer, in the SAME thread, now on the user's own computer. The composer's model chip was switched to
// the local model superbot-omni in the picker (chat.js renderPicker), the follow-up is typed and sent with the
// pointer on the send button, and the answer lands with the LOCAL badge and the chip's own "on this device" sub.
// The follow-up only makes sense with the first turn still in context, so the thread is visibly continuous.
// No complaint, quote, count or error state is on screen. Pure function of t.
import { clamp, lerp, seg, outCubic, outBack, streamCount, boxIn } from '../../../lib.js';

const SAY = 'Added the numbers to point two.';
const LABEL = 'superbot-omni · on this device';
const LINES = ['Where the project slowed down.', 'Band 4, midpoint, and review date.', 'One line for the comp cycle.'];
const CLOSE = 'Same thread. Answered on this machine.';

export default {
  times(r) {
    const T = { r };
    T.say0 = r + 0.06; T.say1 = T.say0 + 0.8;
    T.card = r + 0.95; T.cardOn = T.card + 0.45;
    T.close = T.cardOn + LINES.length * 0.16 + 0.4;
    T.end = T.close + 0.6 + 1.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-draft qc-draft-dev"><b>${x.esc(LABEL)}</b>${LINES.map((l) => `<span>${x.esc(l)}</span>`).join('')}</div>`);
    const close = x.el(`<div class="qc-close">${x.esc(CLOSE)}</div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('span')];
    let shown = -1;
    return {
      nodes: [say, card, close],
      marks: [[T.r, say], [T.card, card], [T.close, close]],
      render(t) {
        const n = streamCount(SAY, T.say0, 40, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.cardOn));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        rows.forEach((row, i) => {
          const p = outCubic(seg(t, T.card + 0.18 + i * 0.16, T.card + 0.48 + i * 0.16));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
        });
        const cv = outCubic(seg(t, T.close, T.close + 0.45));
        close.style.opacity = cv.toFixed(3);
        close.style.transform = cv >= 1 ? 'none' : `translateY(${((1 - cv) * 8).toFixed(2)}px)`;
      },
      // the pointer presses send on the follow-up, so the second turn reads as the user's
      pointer(t) {
        if (!x.send) return null;
        const a = k.send - 0.5, b = k.send + 0.35;
        if (t < a || t > b) return null;
        const bb = boxIn(x.send, x.send.closest('.ask-root') || x.send.ownerDocument.body);
        const down = t >= k.send && t < k.send + 0.16 ? 1 - seg(t, k.send + 0.06, k.send + 0.16) : 0;
        return { x: bb.cx, y: bb.cy, p: down, v: 1 };
      },
    };
  },
};