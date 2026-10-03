// Reports beat: Gemini reads what players are saying about the jump and finds the root cause in the code. Its line
// streams and a card rises (the github sibling's repo-card grammar: a compact card, a counter, rows that resolve).
// First one player's itch.io comment, styled like a comment on an itch.io game page (avatar square, the author's
// name, the date, the text; no vote widgets): "Jump doesn't work half the time when I land on a ledge". Then
// "Reading N player reports" ticks up to 312 with its thin bar, and three findings resolve as rows (file glyph, mono
// path, one tag, the finding); the first, the root cause at scripts/player.gd:42, carries the highlight. The footer
// lands: "Root cause found across 312 player reports". Every name, path and number is made up for the spot. Pure
// function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { oct } from './glyphs.js?v=01d0971d';

const SAY = 'Read every player report and the jump code.';
// the one comment the card opens on (a fictional player handle, no @)
export const COMMENT = { who: 'mossyboots', date: 'Oct 02, 2026', text: "Jump doesn't work half the time when I land on a ledge" };
const TOTAL = 312;
// the findings: [path, finding, tag, highlighted]
const FINDINGS = [
  ['scripts/player.gd:42', 'Jump only counts if you are on the floor that exact frame', 'Root cause', true],
  ['scripts/player.gd:57', 'No coyote time, so jumps just off a ledge get dropped', 'Feel', false],
  ['test/test_player.gd', 'No test presses jump right before landing', 'Gap', false],
];
const DONE = 'Root cause found across 312 player reports';
// timing (seconds from the reply start, or from the card where noted): the sibling's repo beat, unchanged
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the counter starting
const READ = 0.5; /* deliberate */     // the comment read (the counter's first stretch)
const COUNT_AT = 0.08;                 // (the sibling's thread-to-counter gap, kept so the rows land on its marks)
const COUNT = 0.6; /* deliberate */    // the counter running on up to 312 (its bar fills with it)
const ROW_AT = 0.24;                   // the counter's second stretch starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rp-card">
      <div class="rp-src">${x.tile('itch', 'rp-it')}<span>Comments on <b>Pocket Summit</b></span></div>
      <div class="rp-com">
        <span class="rp-av" aria-hidden="true"></span>
        <div class="rp-cm">
          <span class="rp-hd"><b class="rp-who">${x.esc(COMMENT.who)}</b><span class="rp-dt">${x.esc(COMMENT.date)}</span></span>
          <span class="rp-body">${x.esc(COMMENT.text)}</span>
        </div>
      </div>
      <div class="rp-ch"><span class="rp-st"><i class="rp-spin"></i>${x.OK}</span><b>Reading <span class="rp-n">0</span> player reports</b></div>
      <i class="rp-cbar"><i></i></i>
      <div class="rp-list">${FINDINGS.map(([path, text, tag, hi]) => `<div class="rp-row${hi ? ' rp-hi' : ''}">${oct('file', 'rp-fi')}
        <div class="rp-main"><span class="rp-r1"><code>${x.esc(path)}</code><span class="rp-tag">${x.esc(tag)}</span></span><span class="rp-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="rp-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const cSt = { spin: $('.rp-ch .rp-spin'), ok: $('.rp-ch .qc-ok') };
    const com = $('.rp-com');
    const ch = $('.rp-ch'), cbarW = $('.rp-cbar'), cbar = $('.rp-cbar i'), n = $('.rp-n'), ft = $('.rp-ft');
    const rows = [...card.querySelectorAll('.rp-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the comment being read: a soft ring while the first stretch of the counter runs
        const ring = Math.sin(Math.PI * seg(t, T.p0, T.p1 + 0.2));
        com.style.boxShadow = `inset 0 0 0 1px rgba(250,92,92,${(0.55 * ring).toFixed(3)})`;

        // the report counter and its bar: 0 to 312 from the card landing to the end of the count
        const cin = outCubic(seg(t, T.p0 - 0.1, T.p0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.p0, T.c1));
        const cn = String(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.p0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
