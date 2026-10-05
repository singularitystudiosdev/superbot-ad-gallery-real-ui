// Claude Opus 5.5's answer: the pick, in one line, then the week sketched as three day chips on a thin timeline
// (Sat Nov 21 to Fri Nov 27, the seven days after the overnight LH 411): Salzburg x3, Hallstatt x2, Munich x2.
// Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const PICK = 'LH 411.';
const SAY = 'Nonstop, lands 7:10 AM, trains to Salzburg every hour, $102 under your limit each.';
const DAYS = [['Salzburg x3', 'Nov 21 to 23', 3], ['Hallstatt x2', 'Nov 24 to 25', 2], ['Munich x2', 'Nov 26 to 27', 2]];

export default {
  times(r) {
    return { say: r + 0.02, line: r + 0.95, chips: r + 1.0, end: r + 2.45 };
  },

  build(k, { el, esc }) {
    const T = k.T;
    const full = `${PICK} ${SAY}`;
    const say = el(`<div class="qc-say cl-say"><span class="qc-vis"></span><span class="qc-hid">${esc(full)}</span></div>`);
    const chips = DAYS.map(([a, b, d]) => `<span class="cl-day" style="flex:${d}"><b>${esc(a)}</b><small>${esc(b)}</small></span>`).join('');
    const week = el(`<div class="cl-week"><i class="cl-line"></i>${chips}</div>`);
    const n = { vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), line: week.querySelector('.cl-line'), days: [...week.querySelectorAll('.cl-day')] };
    let lastSay = -1;
    // the flight number is set bold as it streams
    const paint = (c) => {
      const p = Math.min(c, PICK.length);
      n.vis.innerHTML = `<b>${esc(full.slice(0, p))}</b>${esc(full.slice(p, c))}`;
      n.hid.textContent = full.slice(c);
    };

    return {
      nodes: [say, week],
      marks: [[T.chips, week]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, full.length));
        if (c !== lastSay) { paint(c); lastSay = c; }
        n.line.style.transform = `scaleX(${inOutCubic(seg(t, T.line, T.line + 0.5)).toFixed(4)})`;
        n.days.forEach((d, i) => {
          const p = outBack(seg(t, T.chips + i * 0.14, T.chips + i * 0.14 + 0.32));
          d.style.opacity = clamp(p * 1.4).toFixed(3);
          d.style.transform = `translateY(${((1 - Math.min(p, 1)) * 8).toFixed(2)}px) scale(${lerp(0.85, 1, p).toFixed(4)})`;
        });
        week.style.opacity = seg(t, T.line - 0.05, T.line + 0.05).toFixed(3);
      },
    };
  },
};
