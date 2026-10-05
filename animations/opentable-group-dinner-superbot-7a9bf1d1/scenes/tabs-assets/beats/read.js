// Gemini reads the attached "Fri crew" screenshot: the phone shot sits on the left of its card, each bubble lights
// up in turn and the constraint it holds lands as a chip in the column beside it (the ask's own two first).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { NEEDS, PEOPLE, GROUP } from './dinner.js';
import { shotHTML } from './shot.js';

const SAY = `Read the ${GROUP} chat. Here is what everyone needs.`;
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
export const NEED_IC = {
  ppl: `<svg viewBox="0 0 24 24" ${S}><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.9c2.4.2 4 1.8 4.5 4.6"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" ${S}><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" ${S}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19l7-7"/></svg>`,
  wheat: `<svg viewBox="0 0 24 24" ${S}><path d="M12 21V8"/><path d="M12 12c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4Zm0 0c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4Zm0 4c-2.5 0-4-1.6-4-4 2.5 0 4 1.6 4 4Zm0 0c2.5 0 4-1.6 4-4-2.5 0-4 1.6-4 4Z"/><path d="M4 4l16 16"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" ${S}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2.1 2.7.9 2.7 2.2-1.2 2.1-2.7 2.1c-1.2 0-2.3-.6-2.8-1.6M12 6.3v1.5M12 16.2v1.5"/></svg>`,
};
const STEP = 0.3;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.need = NEEDS.map((_, i) => T.card + 0.45 + i * STEP);
    T.end = T.need[T.need.length - 1] + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const who = (i) => (i < 0 ? '<span class="gm-from gm-you">you</span>' : `<span class="gm-from"><i style="background:${PEOPLE[i].col}">${PEOPLE[i].init}</i>${PEOPLE[i].name}</span>`);
    const card = x.el(`<div class="gm-card">
      <div class="gm-shot">${shotHTML('fc-gm')}<i class="gm-scan"></i></div>
      <div class="gm-side">
        <div class="gm-h"><b>Constraints</b><span class="gm-n">0 of ${NEEDS.length}</span></div>
        <div class="gm-list">${NEEDS.map((n) => `<div class="gm-need"><span class="gm-ic">${NEED_IC[n.ic]}</span><b>${x.esc(n.label)}</b>${who(n.from)}</div>`).join('')}</div>
      </div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const needs = [...card.querySelectorAll('.gm-need')];
    const msgs = [...card.querySelectorAll('.fc-msg')];
    const scan = card.querySelector('.gm-scan'), cnt = card.querySelector('.gm-n');
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px)`;
        // one read pass sweeps the phone shot top to bottom while the chips land
        const sp = seg(t, T.card + 0.2, T.need[T.need.length - 1] + 0.3);
        scan.style.opacity = (seg(sp, 0, 0.08) * (1 - seg(sp, 0.9, 1))).toFixed(3);
        scan.style.transform = `translateY(${lerp(-40, 100, sp).toFixed(1)}%)`;
        // the bubble a chip came from glows while that chip lands
        const lit = msgs.map(() => 0);
        needs.forEach((nd, i) => {
          const a = T.need[i], p = seg(t, a, a + 0.32), e = outBack(p);
          nd.style.opacity = outCubic(seg(t, a, a + 0.2)).toFixed(3);
          nd.style.transform = p >= 1 ? '' : `translateX(${((1 - outCubic(p)) * -14).toFixed(2)}px) scale(${lerp(0.85, 1, e).toFixed(4)})`;
          nd.style.setProperty('--hot', (seg(t, a, a + 0.08) * (1 - seg(t, a + 0.3, a + 0.55))).toFixed(3));
          const f = NEEDS[i].from;
          if (f >= 0) lit[f] = Math.max(lit[f], seg(t, a - 0.12, a) * (1 - seg(t, a + 0.28, a + 0.5)));
        });
        msgs.forEach((m, i) => m.style.setProperty('--lit', lit[i].toFixed(3)));
        const got = T.need.filter((a) => t >= a).length;
        const txt = `${got} of ${NEEDS.length}`;
        if (cnt.textContent !== txt) cnt.textContent = txt;
      },
    };
  },
};
