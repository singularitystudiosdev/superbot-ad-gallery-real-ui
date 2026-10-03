// Checks beat: GPT-6 Astra checks every draft against the docs before anything is posted (the support fork's checks
// grammar: a hub card, a header whose spinner resolves to the check, a well where the rows land one by one). Each row
// is one draft: it lands with a spinner, then ticks green with the doc it matched; two rows turn amber instead, with a
// plain text tag "Left for you" and why ("billing, needs a person", "possible bug, send to the team"). A dim line counts
// the other 16 matches, and the summary line ticks in: "21 replies match the docs, 2 left for you" (5 + 16 = 21; 21 +
// 2 = the 23 posts Gemini found).
// X ad policy: the tag is text, not a pill; nothing here is a control.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Checked every draft against your docs. Two need a person.';
const HEAD = 'Checking 23 drafts against the docs';
// the rows, top to bottom: [kind, post, note]; 'ok' ticks green with the doc it matched, 'hold' turns amber
const ROWS = [
  ['ok', 'Sync stuck on "Waiting" after 4.2', 'Sync help'],
  ['ok', 'Export a notebook to PDF', 'Export guide'],
  ['ok', 'Share one page, not the whole notebook', 'Sharing'],
  ['hold', 'Refund for a yearly plan', 'billing, needs a person'],
  ['ok', 'Templates for meeting notes', 'Templates'],
  ['ok', 'Dark mode on iPad', 'Appearance'],
  ['hold', 'Notes missing after import', 'possible bug, send to the team'],
];
const MORE = '16 more replies match the docs';
const TAG = 'Left for you';
const DONE = '21 replies match the docs, 2 left for you';
// timing (seconds from the reply start, or from the card where noted), in the base's beat pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.16;                   // the card landing to the first row
const LINE = 0.1;                     // one row to the next
const LINE_IN = 0.16;                  // a row landing
const TICK_AT = 0.14;                  // a row landed to its verdict (green tick, or amber)
const TICK_IN = 0.16;                  // the verdict popping in
const MORE_AT = 0.1;                   // the last verdict to the "16 more" line
const FOOT_AT = 0.12;                  // the "16 more" line to the summary
const FOOT_IN = 0.24;                  // the summary rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROWS.map((_, i) => T.card + RUN_AT + i * LINE);
    T.ticks = T.rows.map((a) => a + TICK_AT);
    const last = T.ticks[ROWS.length - 1] + TICK_IN;
    T.more = last + MORE_AT;
    T.foot = T.more + LINE_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = ([kind, post, note]) => `<div class="ck-ln ck-k-${kind}">
      <span class="ck-st"><i class="ck-spin"></i>${kind === 'ok' ? x.OK : '<b class="ck-bang">!</b>'}</span>
      <span class="ck-post">${esc(post)}</span>
      ${kind === 'ok' ? `<em class="ck-doc">${esc(note)}</em>` : `<span class="ck-hold"><b class="ck-tag">${esc(TAG)}</b><em>${esc(note)}</em></span>`}</div>`;
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${esc(HEAD)}</b></div>
      <div class="ck-term">${ROWS.map(row).join('')}<div class="ck-more">${esc(MORE)}</div></div>
      <div class="ck-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ck-ln')].map((n, i) => ({
      n, kind: ROWS[i][0], spin: n.querySelector('.ck-spin'), v: n.querySelector('.ck-st > :last-child'), note: n.querySelector('.ck-doc, .ck-hold'),
    }));
    const hd = { spin: card.querySelector('.ck-hd .ck-spin'), ok: card.querySelector('.ck-hd .qc-ok') };
    const more = card.querySelector('.ck-more');
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.ticks[ROWS.length - 1] + TICK_IN;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.rows[4], rows[4].n], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((o, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + LINE_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          // the verdict: the row's spinner resolves to a green tick, or the row turns amber with its tag
          const v = outCubic(seg(t, T.ticks[i], T.ticks[i] + TICK_IN));
          o.spin.style.opacity = (1 - seg(t, T.ticks[i] - 0.06, T.ticks[i] + 0.04)).toFixed(3);
          o.spin.style.transform = `rotate(${((t - T.rows[i]) * 420).toFixed(1)}deg)`;
          o.v.style.opacity = v.toFixed(3);
          o.v.style.transform = `scale(${lerp(0.4, 1, v).toFixed(4)})`;
          o.note.style.opacity = v.toFixed(3);
          o.n.classList.toggle('ck-amber', o.kind === 'hold' && t >= T.ticks[i]);
        });
        // the header's status: spinning while the run plays, the check once the last verdict is in
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        hd.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        hd.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        hd.ok.style.opacity = d.toFixed(3);
        hd.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const m = outCubic(seg(t, T.more, T.more + LINE_IN));
        more.style.opacity = m.toFixed(3);
        more.style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 4).toFixed(2)}px)`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
