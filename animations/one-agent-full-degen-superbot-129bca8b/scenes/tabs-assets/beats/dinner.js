// 7. "Order a steak dinner, the bot earned it": superbot places the order itself. Ribeye and fries, arriving in
// 34 min. Photo: Wikimedia Commons, "Beef Ribeye Steak & Shrimps with Potato Fries" by Ceeseven, CC BY-SA 4.0
// (img/CREDITS.txt).
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { stdTimes, workBeat } from './wk.js?v=1';

const STAGES = ['Placed', 'Preparing', 'On the way'];

export default {
  times(r) {
    const T = stdTimes(r, 3, 1.7, 2.6);
    T.photo = T.body + 0.1;
    T.eta = T.body + 0.6;
    T.stages = STAGES.map((_, i) => T.body + 0.8 + i * 0.3);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const w = workBeat(x, k, {
      say: 'Ordered. Ribeye and fries, on the way.',
      title: 'Dinner order',
      sub: 'Delivery',
      steps: ['Found a steakhouse that delivers to you', 'Placed the order', 'Paid with your saved card'],
      cls: 'wk-dn',
      body: `<div class="dn-main"><span class="dn-ph"><img src="${x.img('ribeye.jpg')}" alt=""/></span>
          <span class="dn-tx"><b>Ribeye and fries</b><small>1 ribeye, 1 fries</small><span class="dn-eta"><small>Arriving in</small><b>34 min</b></span></span></div>
        <div class="dn-track">${STAGES.map((s, i) => `<span class="dn-stg${i === 0 ? ' done' : ''}"><i></i>${s}</span>`).join('<span class="dn-ln"><i></i></span>')}</div>`,
    });
    const ph = w.q('.dn-ph img'), eta = w.q('.dn-eta'), stg = w.qa('.dn-stg'), lns = w.qa('.dn-ln i');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        const p = seg(t, T.photo, T.photo + 0.8);
        ph.style.transform = `scale(${lerp(1.12, 1, outCubic(p)).toFixed(4)})`;
        const e = seg(t, T.eta, T.eta + 0.45);
        eta.style.opacity = outCubic(e).toFixed(3);
        eta.style.transform = `scale(${lerp(0.7, 1, outBack(e)).toFixed(4)})`;
        stg.forEach((s, i) => { s.style.opacity = outCubic(seg(t, T.stages[i], T.stages[i] + 0.3)).toFixed(3); });
        lns.forEach((l, i) => { l.style.width = (i === 0 ? 100 * outCubic(seg(t, T.stages[1] + 0.2, T.stages[1] + 1.4)) : 0).toFixed(1) + '%'; });
        stg[1].classList.toggle('now', t >= T.stages[1] + 0.3);
      },
    };
  },
};
