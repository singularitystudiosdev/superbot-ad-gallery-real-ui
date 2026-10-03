// Checks beat: GPT-6 Astra checks every stream before anything goes onto Twitch. Its line streams and a card rises
// (the base's check-run card grammar, no shell prompt): a header ("Checking 5 streams", the week), then a mono well
// where the check lines land one by one (a check glyph left, the check, the count right-aligned in mono); all six pass.
// Then the run's chips land: "5 of 5 passed", "0 overlaps", "2 rest days", and the footer: "Schedule checked, ready for
// Twitch". The title limit is Twitch's own (Create Channel Stream Schedule Segment, title: "The title may contain a
// maximum of 140 characters."). The well is laid out whole from the start, so nothing reflows while it fills. Pure
// function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { ti } from './twitch-icons.js?v=936ae421';

const SAY = "Checked every stream against your viewer slots and Twitch's rules.";
// the check run, top to bottom: [kind, text, count]; every line lands with a check
const LINES = [
  ['ok', 'Every stream starts in a top viewer slot', '5/5'],
  ['ok', 'Every stream ends by 11 PM', '5/5'],
  ['ok', 'No two streams overlap', '5/5'],
  ['ok', "Titles fit Twitch's 140 character limit", '5/5'],
  ['ok', 'Every category exists on Twitch', '5/5'],
  ['ok', 'Rest days kept on Mon and Wed', '2/2'],
];
const CHIPS = ['5 of 5 passed', '0 overlaps', '2 rest days'];
const DONE = 'Schedule checked, ready for Twitch';
// timing (seconds from the reply start, or from the card where noted), in the query beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first check line
const LINE = 0.13;                     // one check line to the next
const LINE_IN = 0.16;                  // a check line landing
const CHIPS_AT = 0.12;                 // the last line in, then the first chip
const STAGGER = 0.07;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + RUN_AT + i * LINE);
    const last = T.lines[LINES.length - 1] + LINE_IN;
    T.chips = CHIPS.map((_, i) => last + CHIPS_AT + i * STAGGER);
    T.foot = T.chips[CHIPS.length - 1] + CHIP_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([kind, text, n]) => `<div class="ck-ln ck-${kind}">${ti('check', 'ck-ck')}<span>${esc(text)}</span><em>${esc(n)}</em></div>`;
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>Checking 5 streams</b><span class="ck-host">Oct 5 to Oct 11</span></div>
      <div class="ck-term">${LINES.map(line).join('')}</div>
      <div class="ck-chips">${CHIPS.map((c) => `<span class="ck-chip">${esc(c)}</span>`).join('')}</div>
      <div class="ck-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ck-ln')];
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const chips = [...card.querySelectorAll('.ck-chip')];
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.lines[LINES.length - 1] + LINE_IN;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[3], rows[3]], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.lines[i], T.lines[i] + LINE_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
        });
        // the header's status: spinning while the run plays, the check once the last line is in
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        st.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.chips[i], T.chips[i] + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
