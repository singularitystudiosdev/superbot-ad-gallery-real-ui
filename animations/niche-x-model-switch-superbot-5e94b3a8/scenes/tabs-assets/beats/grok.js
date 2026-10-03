// Grok beat: Grok reads the comments on Sam's last post. Its line streams, a card rises ("Reading comments on your
// last post", a spinner and a comment counter), and inside it an X-styled window: a one-line snippet of Sam's post,
// then the four comments landing in turn (colour-circle initial avatar, display name, the comment). An intent tag
// lands on each one (Question, Bug report, Praise, Feature request), the spinner resolves to the check, and the
// summary chip "4 need a reply" lands under them.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { POST, COMMENTS } from './x.js?v=5e94b3a8';

const SAY = 'Read all 4 comments: a question, a bug report, some praise and a feature request.';
const LABEL = 'Reading comments on your last post';
const SUMMARY = '4 need a reply';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROW_AT = 0.16;                   // the card landing to the first comment row
const ROW_STAGGER = 0.12;              // one comment to the next
const ROW_IN = 0.22;                   // a row rising in
const TAG_AT = 0.3;                    // a row landing to its intent tag
const TAG_IN = 0.2;                    // a tag popping in
const DONE_AT = 0.1;                   // the last tag in, then the spinner resolves to the check
const SUM_AT = 0.06;                   // the check, then the summary chip
const CHIP_IN = 0.24;                  // the summary chip rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.row = COMMENTS.map((_, i) => T.card + ROW_AT + i * ROW_STAGGER);
    T.tag = T.row.map((a) => a + TAG_AT);
    T.done = T.tag[T.tag.length - 1] + TAG_IN + DONE_AT;
    T.sum = T.done + SUM_AT;
    // the beat's last visible change: the summary chip settled, or the line's last character
    T.end = Math.max(T.sum + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gk-card">
      <div class="gk-hd"><span class="gk-st"><i class="gk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="gk-cnt"><b class="gk-n">0</b> comments</span></div>
      <div class="gk-vp">
        <div class="gk-post"><span class="gk-av" style="--c: var(--xx-av-sam)">S</span><b>Sam Rivera</b><span class="gk-tx">${x.esc(POST.text)}</span></div>
        ${COMMENTS.map((c) => `<div class="gk-row"><span class="gk-av" style="--c: var(--xx-av-${c.key})">${x.esc(c.name[0])}</span><b>${x.esc(c.name)}</b><span class="gk-tx">${x.esc(c.text)}</span><span class="gk-tag gk-${c.intent.k}">${x.esc(c.intent.label)}</span></div>`).join('')}
      </div>
      <div class="gk-sum"><span class="gk-chip">${x.esc(SUMMARY)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.gk-row')], tags = rows.map((r) => r.querySelector('.gk-tag'));
    const n = card.querySelector('.gk-n'), chip = card.querySelector('.gk-chip');
    const spin = card.querySelector('.gk-spin'), ok = card.querySelector('.gk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the comments land in turn, the counter counting them; each gets its intent tag
        let landed = 0;
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
          if (t >= T.row[i]) landed++;
          const g = outCubic(seg(t, T.tag[i], T.tag[i] + TAG_IN));
          tags[i].style.opacity = g.toFixed(3);
          tags[i].style.transform = g >= 1 ? 'none' : `scale(${lerp(0.7, 1, g).toFixed(4)})`;
        });
        const c = String(landed);
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check, then the summary chip
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const s = outCubic(seg(t, T.sum, T.sum + CHIP_IN));
        chip.style.opacity = s.toFixed(3);
        chip.style.transform = s >= 1 ? 'none' : `translateY(${((1 - s) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, s).toFixed(4)})`;
      },
    };
  },
};
