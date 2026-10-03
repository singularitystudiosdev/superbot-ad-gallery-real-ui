// SMS beat: superbot connects Twilio and verifies the text channel. Its line streams, a card rises (the Twilio mark,
// name, "SMS"), the masked number's status flips from Verifying to Verified, and a test text lands as a sent bubble,
// "superbot alerts are on for today", stamped Delivered with a check.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Your number is verified for texts.';
const NUMBER = '+1 (•••) •••-0142';
const TEST = 'superbot alerts are on for today';
const CPS = 100;
const SAY_AT = 0.048;
const CARD_AT = 0.12;                // reply start to the card rising in
const RISE = 0.24;
const VERIFIED = 0.46;               // reply start to the number reading Verified
const BUBBLE = 0.56;                 // reply start to the test text landing
const DELIVERED = 0.86;              // reply start to Delivered
const POP = 0.16;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ver = r + VERIFIED;
    T.bub = r + BUBBLE;
    T.del = r + DELIVERED;
    T.end = Math.max(T.del + POP, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sm-card">
      <div class="sm-head"><img class="sm-logo" src="${x.brand('twilio-logo.svg')}" alt=""/><b>Twilio</b><small>SMS</small></div>
      <div class="sm-to"><span class="sm-k">To</span><b class="sm-num">${x.esc(NUMBER)}</b><span class="sm-st"><i class="spin"></i><span>Verifying</span></span></div>
      <div class="sm-thread"><span class="sm-k">Test text</span>
        <div class="sm-bub">${x.esc(TEST)}</div>
        <div class="sm-del">${x.OK}<span>Delivered</span></div>
      </div>
    </div>`);
    const st = card.querySelector('.sm-st'), stSpin = st.querySelector('.spin'), stL = st.lastElementChild;
    const bub = card.querySelector('.sm-bub'), del = card.querySelector('.sm-del'), delOk = del.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.bub, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`;
        const ok = t >= T.ver;
        stSpin.classList.toggle('done', ok);
        stSpin.style.transform = ok ? '' : `rotate(${(((t - T.card) * 420) % 360).toFixed(1)}deg)`;
        const sl = ok ? 'Verified' : 'Verifying';
        if (stL.textContent !== sl) stL.textContent = sl;
        st.classList.toggle('ok', ok);
        const b = outCubic(seg(t, T.bub, T.bub + RISE));
        bub.style.opacity = b.toFixed(3);
        bub.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * 10).toFixed(2)}px) scale(${lerp(0.94, 1, b).toFixed(4)})`;
        const d = outCubic(seg(t, T.del, T.del + POP));
        del.style.opacity = d.toFixed(3);
        delOk.style.transform = d >= 1 ? 'none' : `scale(${lerp(0.4, 1, d).toFixed(4)})`;
      },
    };
  },
};
