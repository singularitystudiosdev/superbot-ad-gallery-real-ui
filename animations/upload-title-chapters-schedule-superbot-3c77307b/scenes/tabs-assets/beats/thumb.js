// Thumbnail beat: GPT-6 Astra picks the thumbnail frame and checks every field before anything goes to YouTube. Its
// line streams and a card rises: on the left a strip of four candidate frames from the file (1:12, 3:40, 6:41, 11:30,
// img/frames/) that a highlight scans in turn while the big preview shows each one; the highlight comes back to 6:41
// (Sam under the $14 light bar, the desk lit), the pick ring lands and the preview turns into the thumbnail itself
// (img/thumbs/desk-89.jpg: the 6:41 frame with the bold "$89"). On the right, six checks resolve from spinner to green
// check one by one, each with its measured value (49/100, 0:00, shortest 1:12, 9 of 9, 224/500, 1280 x 720), then the
// footer. Every value comes from story.js. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { FILE, CHAPTERS, TITLE, GEAR, TAG_CHARS, THUMB_AT, SHORTEST, clock } from './story.js?v=3c77307b';

const SAY = `Picked the ${clock(THUMB_AT)} frame for the thumbnail and checked every field.`;
// [at, frame]: the candidates, in file order; the pick is the 6:41 one
const CANDS = [[72, 'desk-000'], [220, 'desk-340'], [THUMB_AT, 'desk-641'], [690, 'desk-1130']];
const PICK = 2;
const CHECKS = [
  ['Title under 100 characters', `${TITLE.length}/100`],
  ['First chapter at 0:00', clock(CHAPTERS[0][0])],
  ['Every chapter 10 s or longer', `min ${clock(SHORTEST)}`],
  ['Links open', `${GEAR.length} of ${GEAR.length}`],
  ['Tags under 500 characters', `${TAG_CHARS}/500`],
  ['Thumbnail 1280 x 720', '16:9'],
];
const DONE = `${CHECKS.length} of ${CHECKS.length} checks green. Ready for YouTube Studio`;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;
const SAY_AT = 0.05;
const CARD = 0.14;
const RISE = 0.3;
const SCAN_AT = 0.2;                    // the card landing to the highlight starting on the first candidate
const SCAN_STEP = 0.15;                 // one candidate to the next
const PICK_AT = 0.12;                   // the last candidate to the highlight coming back to 6:41
const THUMB_AT_ = 0.12;                 // the pick to the "$89" thumbnail fading over the frame
const THUMB_IN = 0.24;
const CHECK_AT = 0.16;                  // the pick to the first check
const CHECK_STAGGER = 0.1;              // one check to the next
const POP = 0.16;
const FOOT_AT = 0.12;
const FOOT_IN = 0.24;
const READ = 0.3; /* deliberate */      // the finished card holds before the next pill lands

const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.scan = CANDS.map((_, i) => T.card + RISE * 0.6 + SCAN_AT + i * SCAN_STEP);
    T.pick = T.scan[CANDS.length - 1] + SCAN_STEP + PICK_AT;
    T.thumb = T.pick + THUMB_AT_;
    T.ok = CHECKS.map((_, i) => T.pick + CHECK_AT + i * CHECK_STAGGER);
    T.foot = T.ok[CHECKS.length - 1] + POP + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="th-card">
      <div class="th-hd"><span class="th-st"><i class="th-spin"></i>${x.OK}</span><b>Thumbnail and checks</b><span class="th-of">${x.esc(FILE.name)}</span></div>
      <div class="th-body">
        <div class="th-left">
          <div class="th-pv">${CANDS.map(([, f]) => `<img class="th-fr" data-f="${f}" src="${x.img(`frames/${f}.jpg`)}" width="1280" height="720" alt=""/>`).join('')}
            <img class="th-89" src="${x.img('thumbs/desk-89.jpg')}" width="1280" height="720" alt=""/><i class="th-ts">${clock(THUMB_AT)}</i></div>
          <div class="th-strip">${CANDS.map(([s, f]) => `<span class="th-c"><img src="${x.img(`frames/${f}.jpg`)}" width="1280" height="720" alt=""/><i>${clock(s)}</i></span>`).join('')}</div>
        </div>
        <ul class="th-checks">${CHECKS.map(([l, v]) => `<li><span class="th-ok"><i class="th-cs"></i>${TICK}</span><span class="th-l">${x.esc(l)}</span><b>${x.esc(v)}</b></li>`).join('')}</ul>
      </div>
      <div class="th-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const frs = [...card.querySelectorAll('.th-fr')], th89 = $('.th-89'), ts = $('.th-ts');
    const cands = [...card.querySelectorAll('.th-c')];
    const checks = [...card.querySelectorAll('.th-checks li')].map((n) => ({ n, spin: n.querySelector('.th-cs'), ck: n.querySelector('.th-ok svg') }));
    const spin = $('.th-spin'), ok = $('.th-st .qc-ok'), ft = $('.th-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, cur = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the highlight: each candidate in turn, then back to the pick
        let on = t >= T.pick ? PICK : -1;
        if (on < 0) T.scan.forEach((a, i) => { if (t >= a) on = i; });
        const show = on < 0 ? 0 : on;
        if (show !== cur) { frs.forEach((im, i) => { im.style.opacity = i === show ? '1' : '0'; }); cur = show; }
        cands.forEach((c, i) => {
          c.classList.toggle('on', i === on && t < T.pick);
          c.classList.toggle('pick', i === PICK && t >= T.pick);
        });
        const ring = outCubic(seg(t, T.pick, T.pick + 0.18));
        cands[PICK].style.transform = t >= T.pick && ring < 1 ? `scale(${(1 + 0.08 * Math.sin(Math.PI * ring)).toFixed(4)})` : '';
        ts.textContent = clock(CANDS[show][0]);
        const tb = outCubic(seg(t, T.thumb, T.thumb + THUMB_IN));
        th89.style.opacity = tb.toFixed(3);
        th89.style.transform = tb >= 1 ? 'none' : `scale(${lerp(1.04, 1, tb).toFixed(4)})`;

        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          c.n.classList.toggle('done', t >= T.ok[i]);
        });
        const last = T.ok[CHECKS.length - 1];
        const d = outCubic(seg(t, last, last + 0.2));
        spin.style.opacity = (1 - seg(t, last - 0.08, last + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
