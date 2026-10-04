// Pick beat: GPT-6 Astra decides which comment to pin. Its line streams and a card rises: "Which comment to pin" (spinner
// resolving to the check) over a scoring table, one row per top comment (letter avatar, name, a short excerpt) and one
// column per pin criterion with its weight. Rows stagger in, each cell's thin bar fills to its score, then every Total
// counts up at once so the winner's bar visibly runs furthest and lands at its total. The winner row takes the accent,
// then the preview rises: the comment as it will sit under the video once pinned ("Pinned by" the owner, the creator
// heart popping on), and the footer verdict lands with the check. Every name, score and figure comes from content.js.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba89fddc';
import { OWNER, VIDEO, TOP, REPLIES, PIN } from '../content.js?v=ba89fddc';

const WIN = TOP[PIN.winner];
const first = (name) => name.split(' ')[0];
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const SAY = `Scored the top ${WORDS[TOP.length]} for the pin. ${first(WIN.name)}'s ${WIN.kind.toLowerCase()} wins.`;
const TITLE = 'Which comment to pin';
const OF = `${TOP.length} comments, ${PIN.criteria.length} criteria`;
// the excerpt under each name: whole words up to EXCERPT characters, then an ellipsis (cut in JS, never by CSS)
const EXCERPT = 28;
const excerpt = (s) => {
  if (s.length <= EXCERPT) return s;
  const cut = s.slice(0, EXCERPT + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:!?]$/, '')}…`;
};
const REPLY_N = REPLIES[PIN.winner] ? 1 : 0;
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROW_AT = 0.06;                   // the card starting to rise to the first scored row
const STAGGER = 0.12;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const CELL_AT = 0.04;                  // a row starting to its first bar filling
const CELL_STEP = 0.04;                // one criterion's bar to the next in the same row
const FILL = 0.3;                      // a criterion bar filling to its score
const TOT_AT = 0.12;                   // the last row starting to every Total counting up
const TOT = 0.36; /* deliberate */     // the Totals counting up together (the winner's runs furthest, to its total)
const PREV_IN = 0.24;                  // the winner decided to the pin preview risen in (the row's accent lands with it)
const HEART_AT = 0.12;                 // the preview starting to the creator heart popping on
const HEART_IN = 0.16;                 // the creator heart popping on
const FOOT_AT = 0.16;                  // the preview starting to the verdict footer
const FOOT_IN = 0.24;                  // the verdict footer rising in (the spinner resolves to the check with it)

const av = (name, color, cls) => `<i class="${cls}" style="--c: ${color}">${name[0]}</i>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.row = TOP.map((_, i) => T.card + ROW_AT + i * STAGGER);
    T.tot = T.row[TOP.length - 1] + TOT_AT;
    T.win = T.tot + TOT;
    T.prev = T.win;
    T.foot = T.prev + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const cols = PIN.criteria.map((c) => `<span class="pk-th">${x.esc(c.label)}<small>${Math.round(c.weight * 100)}%</small></span>`).join('');
    const bar = (cls) => `<span class="pk-cell ${cls}"><i class="pk-tr"><i class="pk-fill"></i></i><b class="pk-n">0</b></span>`;
    const rows = TOP.map((c, i) => `<div class="pk-row${i === PIN.winner ? ' pk-win' : ''}">
        <span class="pk-who">${av(c.name, c.color, 'pk-av')}<span class="pk-id"><b>${x.esc(c.name)}${i === PIN.winner ? ms('keep', 'pk-pin') : ''}</b><small>${x.esc(excerpt(c.text))}</small></span></span>
        ${PIN.criteria.map(() => bar('pk-c')).join('')}${bar('pk-t')}
      </div>`).join('');
    const card = x.el(`<div class="pk-card">
      <div class="pk-hd"><span class="pk-st"><i class="pk-spin"></i>${x.OK}</span><b>${x.esc(TITLE)}</b><span class="pk-of">${x.esc(OF)}</span></div>
      <div class="pk-tb">
        <div class="pk-row pk-head"><span class="pk-th">Comment</span>${cols}<span class="pk-th">Total</span></div>
        ${rows}
      </div>
      <div class="pk-pv">
        <div class="pk-pinned">${ms('keep')}<span>Pinned by ${x.esc(OWNER.name)}</span><small>Preview under the video</small></div>
        <div class="pk-cm">
          ${av(WIN.name, WIN.color, 'pk-cav')}
          <div class="pk-cb">
            <div class="pk-cn"><b>${x.esc(WIN.name)}</b><span>${x.esc(VIDEO.age)}</span></div>
            <p>${x.esc(WIN.text)}</p>
            <div class="pk-acts">
              <span class="pk-ib">${ms('thumb-up-outline')}</span><span class="pk-lk">${x.esc(WIN.likes)}</span><span class="pk-ib">${ms('thumb-down-outline')}</span>
              <span class="pk-hrt">${av(OWNER.initial, OWNER.color, 'pk-hav')}${ms('favorite', 'pk-hf')}</span>
              <span class="pk-rb">Reply</span>
            </div>
            ${REPLY_N ? `<div class="pk-more">${ms('arrow-drop-down')}<span>${REPLY_N} reply</span></div>` : ''}
          </div>
        </div>
      </div>
      <div class="pk-ft">${x.OK}<span>${x.esc(PIN.why)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rowEls = [...card.querySelectorAll('.pk-row:not(.pk-head)')];
    const cells = rowEls.map((row) => [...row.querySelectorAll('.pk-cell')].map((c) => ({ fill: c.querySelector('.pk-fill'), n: c.querySelector('.pk-n') })));
    const head = $('.pk-head'), pv = $('.pk-pv'), hrt = $('.pk-hrt'), pin = $('.pk-pin'), win = rowEls[PIN.winner];
    const ft = $('.pk-ft'), spin = $('.pk-spin'), ok = $('.pk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // a bar and its number from a 0..1 progress toward score v (both from t, so the number never runs ahead of the bar)
    const fillTo = (c, v, p) => {
      c.fill.style.transform = `scaleX(${((v / 100) * p).toFixed(4)})`;
      c.n.textContent = String(Math.round(v * p));
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the column heads land with the first row; then each row rises and its criterion bars fill left to right
        head.style.opacity = outCubic(seg(t, T.row[0], T.row[0] + ROW_IN)).toFixed(3);
        rowEls.forEach((row, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
          const s = PIN.scores[i];
          PIN.criteria.forEach((c, j) => {
            const a = T.row[i] + CELL_AT + j * CELL_STEP;
            fillTo(cells[i][j], s[c.key], outCubic(seg(t, a, a + FILL)));
          });
          // every Total over the same seconds: the bars race and the winner's runs furthest
          fillTo(cells[i][PIN.criteria.length], s.total, outCubic(seg(t, T.tot, T.win)));
        });

        // decided: the winner row takes the accent wash and the pin glyph, and the preview rises below the table
        const w = outCubic(seg(t, T.win, T.win + PREV_IN));
        win.style.setProperty('--pk-on', w.toFixed(3));
        pin.style.opacity = w.toFixed(3);
        pin.style.transform = w >= 1 ? 'none' : `scale(${lerp(0.5, 1, w).toFixed(4)})`;
        const p = outCubic(seg(t, T.prev, T.prev + PREV_IN));
        pv.style.opacity = p.toFixed(3);
        pv.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px) scale(${lerp(0.98, 1, p).toFixed(4)})`;
        const h = seg(t, T.prev + HEART_AT, T.prev + HEART_AT + HEART_IN);
        hrt.style.opacity = Math.min(1, h * 3).toFixed(3);
        hrt.style.transform = h >= 1 ? 'none' : `scale(${lerp(0.4, 1, outBack(h)).toFixed(4)})`;

        // the spinner resolves to the check as the verdict footer lands
        const d = outCubic(seg(t, T.foot, T.foot + 0.2));
        spin.style.opacity = (1 - seg(t, T.foot - 0.08, T.foot + 0.06)).toFixed(3);
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
