// Verify beat (7c4a9f21, replaces the source's frame-only beat): GPT-6 Astra checks the five replies before anything is
// posted, which is what "answer the top comments" actually needs. Two duties, one card:
//   1 the fact check - one reply cites a moment in the video, so Astra reads the 4:38 frame (img/mic-frame.jpg, the one
//     real Pexels photo, img/CREDITS.txt) and returns the exact spec, which is what Lena's posted reply will say;
//   2 the rules check - all five replies run against YouTube's comment rules (link drops, personal data, spam words,
//     all-caps, duplicates) and each lands a green pass.
// The scan line crosses the frame, the boom-arm box lands, the fact resolves, the five rule rows tick, then the verdict
// and the footer. Every class is prefixed .vf-. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=7c4a9f21';

const SAY = 'Read the 4:38 frame and cleared all five replies against YouTube\'s rules.';
const PHOTO = { w: 1280, h: 720 };
// the boom arm's box in the crop's pixels (measured on the photo, as in the source's frame beat)
const BOX = [744, 40, 1276, 304];
export const FRAME_FACT = 'Low-profile boom arm, mic mounted underneath';
export const LENA_FINAL = 'Low-profile boom arm, mic mounted underneath. Linked it in the description.';
const TALLY = 'Cleared to post: no link drops, no personal data, no all-caps, no duplicates';
// the five replies checked against YouTube's comment rules: [commenter, what the check looked at, pass text]
const RULES = [
  ['Priya', 'link drop', 'only a timestamp, no link'],
  ['Marco', 'personal data', 'no names, handles or emails'],
  ['Lena', 'spam words', 'clean, talks about the video'],
  ['Dee', 'all-caps', 'one sentence, mixed case'],
  ['Tom', 'duplicates', 'no copy in the other four'],
];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.16;                  // the card landing to the scan line starting
const SCAN = 0.42; /* deliberate */    // the scan line crossing the frame top to bottom
const BOX_IN = 0.16;                   // the box popping in as the scan passes the arm
const FACT_AT = 0.06;                  // the scan done to the fact resolving
const FACT_IN = 0.22;
const RULE_AT = 0.15;                  // the scan starting to the first rule row (runs alongside)
const RULE_STAGGER = 0.09;             // one rule to the next
const RULE_IN = 0.14;
const VERDICT_AT = 0.12;               // the last rule to the verdict pill
const VERDICT_IN = 0.22;
const TALLY_AT = 0.14;                 // the verdict to the tally footer
const TALLY_IN = 0.24;

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in y, so the box lands the moment the line crosses its middle
    T.box = T.s0 + SCAN * ((BOX[1] + BOX[3]) / 2 / PHOTO.h);
    T.fact = T.s1 + FACT_AT;
    T.rule = RULES.map((_, i) => T.s0 + RULE_AT + i * RULE_STAGGER);
    T.verdict = Math.max(T.fact + FACT_IN, T.rule[RULES.length - 1] + RULE_IN) + VERDICT_AT;
    T.tally = T.verdict + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="vf-card">
      <div class="vf-hd"><span class="vf-st"><i class="vf-spin"></i>${x.OK}</span><b>Checking the five replies</b><span class="vf-of">before posting</span></div>
      <div class="vf-body">
        <div class="vf-ph" style="aspect-ratio: ${PHOTO.w} / ${PHOTO.h}">
          <img src="${x.img('mic-frame.jpg')}" width="${PHOTO.w}" height="${PHOTO.h}" alt=""/>
          <i class="vf-box" style="left: ${pct(BOX[0] / PHOTO.w)}; top: ${pct(BOX[1] / PHOTO.h)}; width: ${pct((BOX[2] - BOX[0]) / PHOTO.w)}; height: ${pct((BOX[3] - BOX[1]) / PHOTO.h)}"></i>
          <i class="vf-scan"></i>
          <i class="vf-ts">4:38</i>
        </div>
        <div class="vf-side">
          <div class="vf-fact"><small>${ms('auto-fix', 'vf-fic')}4:38 reads</small><b>${x.esc(FRAME_FACT)}</b><span class="vf-fok">${TICK}fact confirmed, Lena's reply updated</span></div>
          <div class="vf-rules"><small>Checked against YouTube's comment rules</small>
            <ul>${RULES.map(([who, what, ok]) => `<li><span class="vf-who">${x.esc(who)}</span><span class="vf-what">${x.esc(what)}</span><span class="vf-pass">${TICK}${x.esc(ok)}</span></li>`).join('')}</ul>
          </div>
        </div>
      </div>
      <span class="vf-verdict">${TICK}5 of 5 replies cleared to post</span>
      <div class="vf-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const box = $('.vf-box'), scan = $('.vf-scan'), fact = $('.vf-fact'), verdict = $('.vf-verdict'), ft = $('.vf-ft');
    const fok = $('.vf-fok'), spin = $('.vf-spin'), ok = $('.vf-st .qc-ok');
    const rules = [...card.querySelectorAll('.vf-rules li')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.rule[2], rules[2]], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scan line: linear top to bottom, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.top = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        const b = outCubic(seg(t, T.box, T.box + BOX_IN));
        box.style.opacity = b.toFixed(3);
        box.style.transform = b >= 1 ? 'none' : `scale(${lerp(1.08, 1, b).toFixed(4)})`;
        // done reading: the spinner resolves to the check as the scan finishes
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the fact the frame read returns, and the note that it went into Lena's reply
        const f = outCubic(seg(t, T.fact, T.fact + FACT_IN));
        fact.style.opacity = f.toFixed(3);
        fact.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
        fok.style.opacity = outCubic(seg(t, T.fact + FACT_IN * 0.5, T.fact + FACT_IN + 0.1)).toFixed(3);

        // the five replies clearing the rules, one row at a time
        rules.forEach((li, i) => {
          const o = outCubic(seg(t, T.rule[i], T.rule[i] + RULE_IN));
          li.style.opacity = o.toFixed(3);
          li.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -6).toFixed(2)}px)`;
        });

        const v = outCubic(seg(t, T.verdict, T.verdict + VERDICT_IN));
        verdict.style.opacity = v.toFixed(3);
        verdict.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, v).toFixed(4)})`;
        const g = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = g.toFixed(3);
        ft.style.transform = g >= 1 ? 'none' : `translateY(${((1 - g) * 6).toFixed(2)}px)`;
      },
    };
  },
};