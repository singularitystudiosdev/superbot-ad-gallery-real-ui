// 3. The alert: a weekday 9:25 AM text with the top WSB ticker and its sentiment. The switch flips on, the card
// reads Active, and a preview of the text lands.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { stdTimes, workBeat } from './wk.js?v=1';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BELL = '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';

export default {
  times(r) {
    const T = stdTimes(r, 2, 1.8, 2.9);
    T.days = [T.body + 0.2, T.body + 0.75];
    T.flip = T.body + 0.8;
    T.active = T.flip + 0.25;
    T.sms = T.body + 1.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const w = workBeat(x, k, {
      say: 'Done. Every weekday at 9:25 you get the top WSB ticker and the mood.',
      title: 'Alert',
      sub: 'Text message',
      steps: ['Scheduled a weekday job for 9:25 AM ET', 'Set it to text your phone'],
      cls: 'wk-al',
      body: `<div class="al-main"><span class="al-bell">${BELL}</span><span class="al-tx"><b>Mon to Fri 9:25 AM, top WSB ticker + sentiment</b><span class="al-days">${DAYS.map((d, i) => `<i class="${i < 5 ? 'on' : ''}">${d}</i>`).join('')}</span></span>
          <span class="al-right"><span class="al-sw"><i></i></span><em class="al-act"><i></i>Active</em></span></div>
        <div class="al-sms"><span class="al-sms-h">Text preview, 9:25 AM</span><span class="al-bub">superbot: GME is the top WSB ticker today, 1,912 mentions. Sentiment: bullish.</span></div>`,
    });
    const days = w.qa('.al-days i'), sw = w.q('.al-sw'), knob = w.q('.al-sw i'), act = w.q('.al-act'), sms = w.q('.al-sms');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        days.forEach((d, i) => { const p = seg(t, T.days[0] + i * 0.06, T.days[0] + i * 0.06 + 0.3); d.style.opacity = lerp(0.2, 1, outCubic(p)).toFixed(3); d.classList.toggle('lit', i < 5 && p > 0.5); });
        const f = seg(t, T.flip, T.flip + 0.3);
        knob.style.transform = `translateX(${(outCubic(f) * 14).toFixed(2)}px)`;
        sw.classList.toggle('on', f > 0.45);
        const a = seg(t, T.active, T.active + 0.4);
        act.style.opacity = outCubic(a).toFixed(3);
        act.style.transform = `scale(${lerp(0.6, 1, outBack(a)).toFixed(4)})`;
        const s = seg(t, T.sms, T.sms + 0.45);
        sms.style.opacity = outCubic(s).toFixed(3);
        sms.style.transform = s >= 1 ? '' : `translateY(${((1 - outCubic(s)) * 10).toFixed(2)}px)`;
      },
    };
  },
};
