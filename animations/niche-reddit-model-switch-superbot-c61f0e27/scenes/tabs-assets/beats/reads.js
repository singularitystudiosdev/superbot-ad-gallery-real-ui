// Reads beat: Gemini reads what bread communities post. Its line streams, a card rises ("Reading 1,240 top posts from
// 6 bread communities", the count running up), and inside it a Reddit-styled window of compact post rows (vote count,
// short title) scrolls fast while the count runs. Then the reading resolves: the rows dim under a scrim and what
// Gemini took from them lands as two chip groups over them, one chip at a time: the post flair (in Reddit's flair
// colours) and the five rules, numbered. The grammar is the Discord fork's backlog.js (niche-discord-model-switch-
// superbot-3b7e91c4); the window is Reddit's dark theme (chat.css --rd-*), its type Reddit Sans.
// The post titles are made up for the spot: no community names, no usernames.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { icon } from './rd-icons.js?v=c61f0e27';

const SAY = 'Read what bread communities post and pulled out five flairs and five rules.';
const TOTAL = 1240;
const COMMUNITIES = 6;
// [votes, title]: what bread communities post, made up for the spot
const ROWS = [
  ['412', 'First loaf, why is it so dense?'],
  ['1.2k', 'Crumb shot, 78% hydration'],
  ['86', 'Starter not rising after 5 days'],
  ['23', 'Anyone selling starter?'],
  ['301', 'Bake swap this Sunday'],
  ['958', 'Finally got an ear on my batard'],
  ['64', 'Is this overproofed?'],
  ['2.4k', 'Ten years of the same starter'],
  ['147', 'Rye and spelt, recipe in comments'],
  ['39', 'Starter smells like nail polish'],
  ['512', 'Crumb shot after a cold retard'],
  ['77', 'Meetup photos from the market'],
  ['203', 'What flour do you all use?'],
  ['18', 'DM to buy my starter'],
  ['689', 'My kid scored her first loaf'],
  ['95', 'Bake along this weekend?'],
  ['330', 'Recipe: 70% whole wheat boule'],
  ['44', 'Help, my starter has hooch'],
];
// what Gemini took from them, each in a Reddit colour (fill and text): the hexes are Reddit's own global tokens in its
// live stylesheet (styles-css-inlined, chat.css): --color-alert-caution, --color-identity-moderator,
// --color-global-alienblue, --color-identity-self and --color-action-downvote
export const FLAIRS = [
  ['Bake', '#FFB000', '#000'],
  ['Crumb shot', '#46D160', '#000'],
  ['Starter help', '#0079D3', '#fff'],
  ['Recipe', '#0DD3BB', '#000'],
  ['Meetup', '#7193FF', '#000'],
];
export const RULES = ['Be kind to beginners', 'Show your crumb', 'Recipe in the comments', 'No selling starter', 'Flair every post'];
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the posts scrolling past (the count runs with it)
const CHIPS_AT = 0.82;                 // the card landing to the first chip
const STAGGER = 0.04;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 6;                       // rows visible in the window
const ROW = 28;                        // one row's height, px

const fmt = (n) => n.toLocaleString('en-US');
const N_CHIPS = 2 + FLAIRS.length + RULES.length; // two group labels + the chips

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = Array.from({ length: N_CHIPS }, (_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the last chip settled, or the line's last character
    T.end = Math.max(T.chip[N_CHIPS - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const up = icon('arrow-big-up', 'rr-up');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rr-card">
      <div class="rr-hd"><span class="rr-st"><i class="rr-spin"></i>${x.OK}</span><b>Reading <span class="rr-n">0</span> top posts from ${COMMUNITIES} bread communities</b></div>
      <div class="rr-vp">
        <div class="rr-list">${ROWS.map(([v, txt]) => `<div class="rr-row"><span class="rr-v">${up}${x.esc(v)}</span><span class="rr-t">${x.esc(txt)}</span></div>`).join('')}</div>
        <i class="rr-scrim"></i>
        <div class="rr-chips">
          <div class="rr-grp"><span class="rr-lab rr-c">Post flair</span>${FLAIRS.map(([f, bg, fg]) => `<span class="rr-chip rr-flair rr-c" style="--bg: ${bg}; --fg: ${fg}">${x.esc(f)}</span>`).join('')}</div>
          <div class="rr-grp"><span class="rr-lab rr-c">Rules</span>${RULES.map((ru, i) => `<span class="rr-chip rr-rule rr-c"><i>${i + 1}</i>${x.esc(ru)}</span>`).join('')}</div>
        </div>
      </div>
    </div>`);
    const list = card.querySelector('.rr-list'), n = card.querySelector('.rr-n'), scrim = card.querySelector('.rr-scrim');
    const vp = card.querySelector('.rr-vp'), groups = card.querySelector('.rr-chips');
    const chips = [...card.querySelectorAll('.rr-c')];
    const spin = card.querySelector('.rr-spin'), ok = card.querySelector('.rr-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
    // the window is as tall as SHOWN rows, or as the two chip groups need at this column width (measured once laid out)
    let fitted = 0;
    const fit = () => {
      const w = card.offsetWidth;
      if (!w || w === fitted) return;
      fitted = w;
      vp.style.height = `${Math.max(SHOWN * ROW, groups.scrollHeight + 4)}px`;
    };
    let shown = -1, count = '';
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((wt) => document.fonts.load(`${wt} 16px "Reddit Sans RX"`));

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        fit();
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scroll: fast through the middle (a touch of blur at speed), the count running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = fmt(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check as the count lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the reading resolves: the rows dim under the scrim, the flair and the rules land over them
        const sc = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2));
        scrim.style.opacity = sc.toFixed(3);
        list.style.opacity = (1 - sc).toFixed(3); // the rows leave with the scrim, so no title ghosts under the chips
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
