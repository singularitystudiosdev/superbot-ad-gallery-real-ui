// Robinhood, the order: the GME order ticket in Robinhood's black layout. The fields fill in (limit order at
// yesterday's close, $250), the pointer presses "Submit order", and the button resolves into the confirmation
// "Buy 9.4 GME @ $26.60 limit" with a Filled pill. $250 / $26.60 = 9.398, shown as 9.4 shares.
import { seg, outCubic, outBack, lerp, press, path } from '../../../lib.js';
import { say, chips, cardIn, rise, ICON } from './kit.js?v=1';

const SAY = 'Limit order in at yesterday’s close, $26.60. It filled.';
const FIELDS = [
  ['Order type', 'Limit order', ''],
  ['Limit price', '$26.60', 'Yesterday’s close'],
  ['Amount', '$250.00', ''],
  ['Est. shares', '9.4', ''],
  ['Expires', 'Good for day', ''],
];

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.55];
    T.chipDone = [r + 0.8, r + 1.2];
    T.card = r + 1.1;
    T.fields = FIELDS.map((_, i) => T.card + 0.45 + i * 0.26);
    T.ptr = [T.card + 1.55, T.card + 2.1];   // the pointer glides onto the button
    T.press = T.card + 2.3;
    T.done = T.press + 0.25;
    T.fill = T.done + 0.55;
    T.end = T.fill + 1.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.done + 0.1, 70);
    const ch = chips(x, [
      ['Opening GME on Robinhood', 'Opened GME on Robinhood'],
      ['Pulling yesterday’s close', 'Yesterday’s close was $26.60'],
    ], T.chipIn, T.chipDone);
    const card = x.el(`<div class="rh-card">
      <div class="rh-head"><img src="${x.brand('robinhood-logo.svg')}" alt=""/><b>Buy GME</b><span class="rh-mkt">Market open</span></div>
      <div class="rh-fields">${FIELDS.map(([l, v, s]) => `<div class="rh-f"><span class="rh-fl">${l}${s ? `<small>${s}</small>` : ''}</span><span class="rh-fv"><b></b><i class="rh-caret"></i></span></div>`).join('')}</div>
      <div class="rh-zone">
        <div class="rh-submit">Submit order</div>
        <div class="rh-conf"><span class="rh-ok">${ICON.check}</span><span class="rh-ct"><b>Buy 9.4 GME @ $26.60 limit</b><small>9.4 shares at $26.60 · $250.00</small></span><em class="rh-filled">Filled</em></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const fields = [...card.querySelectorAll('.rh-f')].map((f) => ({ f, v: f.querySelector('.rh-fv b'), c: f.querySelector('.rh-caret') }));
    const btn = $('.rh-submit'), conf = $('.rh-conf'), ok = $('.rh-ok'), pill = $('.rh-filled');
    return {
      nodes: [...ch.rows, card, line.n],
      marks: [...ch.marks, [T.card, card], [T.done + 0.1, line.n]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        fields.forEach(({ f, v, c }, i) => {
          const a = T.fields[i], txt = FIELDS[i][1];
          rise(f, seg(t, a - 0.2, a + 0.15), 5);
          const n = Math.round(txt.length * seg(t, a, a + 0.22));
          const s = txt.slice(0, n);
          if (v.textContent !== s) v.textContent = s;
          c.style.opacity = t >= a - 0.05 && t < a + 0.32 ? '1' : '0';
        });
        const P = T.press;
        btn.style.transform = `scale(${(1 - 0.05 * press(t, P)).toFixed(4)})`;
        const sw = seg(t, T.done - 0.05, T.done + 0.3);
        btn.style.opacity = (1 - outCubic(sw)).toFixed(3);
        conf.style.opacity = outCubic(sw).toFixed(3);
        conf.style.transform = sw >= 1 ? '' : `translateY(${((1 - outCubic(sw)) * 8).toFixed(2)}px)`;
        const o = seg(t, T.done + 0.05, T.done + 0.4);
        ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
        const f = seg(t, T.fill, T.fill + 0.4);
        pill.style.opacity = outCubic(f).toFixed(3);
        pill.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
        card.classList.toggle('is-filled', t >= T.fill);
      },
      pointer(t) {
        if (t < T.ptr[0] - 0.2 || t > T.done + 0.5) return null;
        const b = x.box(btn);
        const p = path(t, [{ t: T.ptr[0], x: b.cx + 170, y: b.cy + 120 }, { t: T.ptr[1], x: b.cx + 24, y: b.cy + 6 }]);
        const v = seg(t, T.ptr[0] - 0.2, T.ptr[0] + 0.1) * (1 - seg(t, T.done + 0.2, T.done + 0.5));
        return { x: p.x, y: p.y, p: press(t, T.press), v };
      },
    };
  },
};
