// Claude Opus 5.5 writes the deposit email to Greenpoint Realty: To and Subject are set, the body types out
// ("Hi Dana, we moved out of 218 Kent Ave, Apt 3R on Oct 10. ...") and the 24 move-out photos (empty rooms, clean
// walls, the keys in the lockbox) fill the attachment strip underneath.
import { clamp, seg } from '../../../lib.js';
import { sayLine, rise, pop } from './kit.js';

const SAY = 'Here is the deposit email to Greenpoint Realty.';
export const TO = 'Dana, Greenpoint Realty Mgmt';
export const SUBJECT = 'Deposit return, 218 Kent Ave, Apt 3R';
export const BODY = 'Hi Dana, we moved out of 218 Kent Ave, Apt 3R on Oct 10. Keys are in the lockbox. 24 move-out photos attached. Please return the $2,800 deposit within 14 days per section 6 of the lease.';
const SIGN = 'Thanks, Sam';
const CPS = 82;
const IC = { clip: '<svg viewBox="0 0 24 24"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.1-8.1a3.3 3.3 0 0 1 4.7 4.7l-8.1 8.1a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"/></svg>' };

export default {
  times(r) {
    const T = { say: r + 0.02, card: r + 0.2, type0: r + 0.45 };
    T.type1 = T.type0 + (BODY.length + SIGN.length) / CPS;
    T.photos = r + 0.9;
    T.photosEnd = T.photos + 23 * 0.05;
    T.end = r + 5.0;
    return T;
  },

  cues(T) {
    const out = [];
    for (let t = T.type0; t < T.type1; t += 0.05) out.push({ t, kind: 'key' });
    out.push({ t: T.photos, kind: 'tag' }, { t: T.photosEnd, kind: 'ok' });
    return out;
  },

  build(k, { el, esc, img }) {
    const T = k.T;
    const say = sayLine(el, esc, SAY);
    const thumbs = Array.from({ length: 24 }, (_, i) => `<img src="${img(`mo-${String(i + 1).padStart(2, '0')}.jpg`)}" alt=""/>`).join('');
    const card = el(`<div class="mv-card ce-card">
  <div class="ce-row"><small>To</small><span>${esc(TO)}</span></div>
  <div class="ce-row"><small>Subject</small><span>${esc(SUBJECT)}</span></div>
  <div class="ce-body"><p><span class="ce-v"></span><span class="ce-h">${esc(BODY)}</span></p><p class="ce-sign"><span class="ce-v"></span><span class="ce-h">${esc(SIGN)}</span></p></div>
  <div class="ce-att"><div class="ce-ah">${IC.clip}<span>24 move-out photos</span><b class="ce-n">0 / 24</b></div><div class="ce-strip">${thumbs}</div></div>
</div>`.replace(/>\s+</g, '><'));
    const ps = [...card.querySelectorAll('.ce-body p')].map((p) => ({ v: p.querySelector('.ce-v'), h: p.querySelector('.ce-h') }));
    const n = { ps, imgs: [...card.querySelectorAll('.ce-strip img')], cnt: card.querySelector('.ce-n'), caret: el('<i class="ce-caret">&#8288;</i>') };
    let last = -1, lastN = -1;

    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, t, T.card, 14);
        const c = Math.floor(clamp((t - T.type0) * CPS, 0, BODY.length + SIGN.length));
        if (c !== last) {
          const a = Math.min(c, BODY.length), b = Math.max(0, c - BODY.length);
          ps[0].v.textContent = BODY.slice(0, a); ps[0].h.textContent = BODY.slice(a);
          ps[1].v.textContent = SIGN.slice(0, b); ps[1].h.textContent = SIGN.slice(b);
          const at = c < BODY.length ? ps[0] : ps[1];
          at.v.after(n.caret);
          last = c;
        }
        n.caret.style.opacity = t >= T.type0 && (t < T.type1 + 0.3 || Math.floor(t * 2.5) % 2 === 0) && t < T.type1 + 0.9 ? '1' : '0';
        n.imgs.forEach((im, i) => pop(im, t, T.photos + i * 0.05));
        const shown = Math.round(24 * clamp(seg(t, T.photos + 0.05, T.photosEnd + 0.1)));
        if (shown !== lastN) { n.cnt.textContent = `${shown} / 24`; lastN = shown; }
      },
    };
  },
};
