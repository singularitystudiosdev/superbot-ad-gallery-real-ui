// Claude Opus 5.5 picks Casa Lumbre and says why in one line, then drafts the text for the group: an unsent
// iMessage bubble addressed to "Fri crew" that Superbot sends once the table is booked.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { PICK, DRAFT, GROUP, PEOPLE, MAYA } from './dinner.js';

const CPS = 85, DCPS = 120;

export default {
  times(r) {
    const T = { r };
    T.pickEnd = r + 0.05 + PICK.length / CPS;
    T.card = T.pickEnd + 0.15;
    T.d0 = T.card + 0.3;
    T.d1 = T.d0 + DRAFT.length / DCPS;
    T.end = T.d1 + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say cl-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(PICK)}</span></div>`);
    const card = x.el(`<div class="cl-card">
      <div class="cl-h"><img src="${x.brand('messages-logo.svg')}" alt=""/><b>Draft to ${x.esc(GROUP)}</b><span class="cl-to">${[...PEOPLE, MAYA].map((p) => `<i style="background:${p.col}">${p.init}</i>`).join('')}</span></div>
      <div class="cl-bub"><span class="cl-vis"></span><span class="cl-hid">${x.esc(DRAFT)}</span></div>
      <div class="cl-note">Sends after the booking</div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const dv = card.querySelector('.cl-vis'), dh = card.querySelector('.cl-hid'), note = card.querySelector('.cl-note');
    let shown = -1, dn = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(PICK, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = PICK.slice(0, n); hid.textContent = PICK.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.4));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const m = streamCount(DRAFT, T.d0, DCPS, t);
        if (m !== dn) { dv.textContent = DRAFT.slice(0, m); dh.textContent = DRAFT.slice(m); dn = m; }
        note.style.opacity = outCubic(seg(t, T.d1, T.d1 + 0.3)).toFixed(3);
      },
    };
  },
};
