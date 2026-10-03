// Photos beat: Gemini checks the user's 2,400 bird photos before anything trains on them. Its line streams and a card
// rises (the base's hub-card grammar, no tabs, no footer controls): a flat glyph, "Your photos" with the muted
// "2,400 photos, 24 species", then a grid of real bird photos (4 x 3, every tile a real photograph from photos/, see
// photos/CREDITS.txt), each with its species as a plain-text caption. One after another Gemini's findings land on four
// tiles: the second copy of the Blue jay dims ("duplicate, removed"), the blurred Mourning dove (the photo itself, with a
// CSS blur on it) dims ("blurry, removed"), and two wrong labels are struck through with the right species under them
// ("house finch" -> "purple finch", "house sparrow" -> "song sparrow"; the photos ARE a purple finch and a song sparrow).
// Under the grid a status line: a spinner and "Checking 2,400 photos", which resolves to the muted summary "61
// duplicates and 37 blurry shots removed", then the green check line "2,302 photos kept across 24 species". Pure
// function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { mi } from './ml-icons.js?v=9312bd04';

const photo = (f) => new URL('../../../photos/' + f, import.meta.url).href;
const SAY = 'Checked all 2,400 photos and fixed 44 wrong labels';
const TITLE = 'Your photos', META = '2,400 photos, 24 species';
// the grid, in reading order: [file, caption, finding]. finding: { kind: 'dup' | 'blur' | 'fix', text }
export const TILES = [
  ['northern-cardinal.jpg', 'northern cardinal'],
  ['blue-jay.jpg', 'blue jay'],
  ['american-robin.jpg', 'american robin'],
  ['black-capped-chickadee.jpg', 'black-capped chickadee'],
  ['blue-jay.jpg', 'blue jay', { kind: 'dup', text: 'duplicate, removed' }],
  ['american-goldfinch.jpg', 'american goldfinch'],
  ['purple-finch.jpg', 'house finch', { kind: 'fix', text: 'purple finch' }],
  ['downy-woodpecker.jpg', 'downy woodpecker'],
  ['mourning-dove.jpg', 'mourning dove', { kind: 'blur', text: 'blurry, removed' }],
  ['carolina-wren.jpg', 'carolina wren'],
  ['eastern-bluebird.jpg', 'eastern bluebird'],
  ['song-sparrow.jpg', 'house sparrow', { kind: 'fix', text: 'song sparrow' }],
];
// the order the findings land in (tile indices)
const ORDER = [4, 8, 6, 11];
const CHECKING = 'Checking 2,400 photos';
const SUMMARY = '61 duplicates and 37 blurry shots removed';
const DONE = '2,302 photos kept across 24 species';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const TILE_IN = 0.03;                  // one tile fading up after the one before (reading order)
const FIND_AT = 0.55;                  // the card landing to the first finding
const FIND = 0.32; /* deliberate */    // one finding to the next (each reads before the next lands)
const FIND_IN = 0.24;                  // a finding landing (dim, strike, the new caption rising in)
const SUM_AT = 0.12;                   // the last finding landed, then the spinner resolves to the summary
const SUM_IN = 0.22;
const DONE_AT = 0.26;                  // the summary in, then the green check line
const DONE_IN = 0.22;
const HOLD = 0.4; /* deliberate */    // the result reads before the next status line

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.find = ORDER.map((_, i) => T.card + FIND_AT + i * FIND);
    T.sum = T.find[ORDER.length - 1] + FIND_IN + SUM_AT;
    T.done = T.sum + SUM_IN + DONE_AT;
    T.end = Math.max(T.done + DONE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const tile = ([f, cap, fd]) => `<figure class="ph-t${fd ? ' ph-' + fd.kind : ''}"><span class="ph-im"><img src="${photo(f)}" alt="" decoding="sync"/></span>`
      + `<figcaption><span class="ph-c">${x.esc(cap)}</span><span class="ph-f">${fd ? x.esc(fd.text) : ''}</span></figcaption></figure>`;
    const card = x.el(`<div class="ph-card">
      <div class="ph-hd"><span class="ph-ic">${mi('images')}</span><b>${x.esc(TITLE)}</b><span class="ph-sub">${x.esc(META)}</span></div>
      <div class="ph-grid">${TILES.map(tile).join('')}</div>
      <div class="ph-st"><span class="ph-ico"><i class="ph-spin"></i></span><span class="ph-tx"><span class="ph-a">${x.esc(CHECKING)}</span><span class="ph-b">${x.esc(SUMMARY)}</span></span></div>
      <div class="ph-ok">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const figs = [...card.querySelectorAll('.ph-t')].map((n) => ({ n, im: n.querySelector('.ph-im'), c: n.querySelector('.ph-c'), f: n.querySelector('.ph-f') }));
    const st = $('.ph-st'), spin = $('.ph-spin'), ta = $('.ph-a'), tb = $('.ph-b'), ok = $('.ph-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.find[0], st], [T.done, ok]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        figs.forEach((g, i) => {
          const a = T.card + 0.1 + i * TILE_IN;
          g.n.style.opacity = outCubic(seg(t, a, a + 0.25)).toFixed(3);
          const j = ORDER.indexOf(i);
          if (j < 0) return;
          const p = outCubic(seg(t, T.find[j], T.find[j] + FIND_IN));
          const kind = TILES[i][2].kind;
          if (kind === 'fix') {
            g.c.style.setProperty('--strike', p.toFixed(3));
            g.c.classList.toggle('on', p > 0);
          } else {
            g.im.style.opacity = lerp(1, 0.32, p).toFixed(3);
            g.c.style.opacity = lerp(1, 0.55, p).toFixed(3);
          }
          g.f.style.opacity = p.toFixed(3);
          g.f.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
        });

        // the status: spinning while the findings land, then it resolves to the muted summary, then the check line
        const si = outCubic(seg(t, T.card + 0.3, T.card + 0.5));
        st.style.opacity = si.toFixed(3);
        spin.style.opacity = (1 - seg(t, T.sum - 0.06, T.sum + 0.08)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const sw = seg(t, T.sum, T.sum + SUM_IN);
        ta.style.opacity = (1 - outCubic(seg(sw, 0, 0.5))).toFixed(3);
        tb.style.opacity = outCubic(seg(sw, 0.5, 1)).toFixed(3);
        const d = outCubic(seg(t, T.done, T.done + DONE_IN));
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = d >= 1 ? 'none' : `translateY(${((1 - d) * 6).toFixed(2)}px)`;
      },
    };
  },
};
