// The ChatGPT beat: the ask is routed to ChatGPT and ChatGPT comes back with its own failure state instead of
// an answer. Recreated as a UI state, no screenshots: the thread returns blank, "Looks like you're offline"
// over a dead composer, a Retry that spins and then gives up on "There's a problem with your request". Both
// messages are what reviewers quote in the one and two star ChatGPT reviews this ad is built from.
// Pure function of t (the tabs scene's local time).
import { clamp, lerp, seg, outCubic, inOutCubic, esc } from '../../../lib.js';

const OFFLINE = "Looks like you're offline";
const OFFLINE_SUB = 'Reconnect to send messages.';
const CODE = "There's a problem with your request";

export default {
  times(r) {
    const T = { r };
    T.in = r + 0.2;        // the failed thread rises in
    T.retry = r + 1.15;    // the pointer presses Retry
    T.spinEnd = r + 2.15;  // the retry gives up
    T.code = r + 2.25;     // the second real failure message lands
    T.end = r + 3.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const card = x.el(`<div class="qc-err">
      <div class="qc-err-skel"><i></i><i></i><i></i></div>
      <div class="qc-err-box">
        <span class="qc-err-ic"><svg viewBox="0 0 24 24"><path d="M2 8.8A16.5 16.5 0 0 1 22 8.8"/><path d="M5.5 12.4a11 11 0 0 1 13 0"/><path d="M9 16a5.5 5.5 0 0 1 6 0"/><circle cx="12" cy="19.6" r="1.2" fill="currentColor" stroke="none"/><path d="M3.2 3.2 20.8 20.8"/></svg></span>
        <b class="qc-err-t">${esc(OFFLINE)}</b>
        <small class="qc-err-s">${esc(OFFLINE_SUB)}</small>
        <span class="qc-err-btn"><i class="qc-err-spin"></i><span>Retry</span></span>
      </div>
      <div class="qc-err-code">${esc(CODE)}</div>
    </div>`);
    const box = card.querySelector('.qc-err-box');
    const btn = card.querySelector('.qc-err-btn');
    const spin = card.querySelector('.qc-err-spin');
    const lbl = btn.lastElementChild;
    const code = card.querySelector('.qc-err-code');
    return {
      nodes: [card],
      marks: [[T.in, card]],
      render(t) {
        const p = outCubic(seg(t, T.in, T.in + 0.5));
        card.style.opacity = p.toFixed(3);
        card.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
        // the retry: pressed, then it spins for a second and comes back as "Retry" with nothing landed
        const spinning = t >= T.retry && t < T.spinEnd;
        spin.style.display = spinning ? '' : 'none';
        lbl.textContent = spinning ? 'Retrying' : 'Retry';
        spin.style.transform = `rotate(${((t - T.retry) * 520).toFixed(1)}deg)`;
        const down = t >= T.retry && t < T.retry + 0.16 ? 1 - seg(t, T.retry + 0.06, T.retry + 0.16) : 0;
        btn.style.transform = `scale(${(1 - 0.07 * down).toFixed(3)})`;
        btn.style.opacity = spinning ? '0.8' : '1';
        const cp = outCubic(seg(t, T.code, T.code + 0.4));
        code.style.opacity = cp.toFixed(3);
        code.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 6).toFixed(2)}px)`;
        // the box gives a short shake when the retry fails
        const sh = seg(t, T.code, T.code + 0.5);
        box.style.transform = sh > 0 && sh < 1 ? `translateX(${(Math.sin(sh * 34) * (1 - sh) * 3).toFixed(2)}px)` : 'none';
      },
      pointer(t) {
        const a = T.retry - 0.3, b = T.retry + 0.5;
        if (t < a || t > b) return null;
        const bb = x.box(btn);
        const down = t >= T.retry && t < T.retry + 0.16 ? 1 - seg(t, T.retry + 0.06, T.retry + 0.16) : 0;
        return { x: bb.cx, y: bb.cy, p: down, v: 1 };
      },
    };
  },
};
