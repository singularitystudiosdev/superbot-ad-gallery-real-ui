// Backlog beat: Gemini reads #general. Its line streams, a card rises ("Reading #general since Tuesday", a message
// counter), and inside it a Discord-styled window of compact message rows (avatar, display name, short text) scrolls
// fast from Tuesday to now while the counter runs up to 1,284 messages. Then the backlog resolves: the rows dim under
// a scrim and the topics Gemini found land as chips over them, one by one, the last one the gold "3 mentions for you".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read all 1,284 messages: five topics, three voice notes and 3 mentions for you.';
const LABEL = 'Reading #general since Tuesday';
const TOTAL = 1284;
// what #general said since Tuesday, oldest first: [name, default-avatar colour, role colour, text]. Made up for the spot.
const PEOPLE = {
  Leo: ['blurple', 'teal'], Maya: ['pink', 'orange'], Theo: ['green', 'blue'], Jordan: ['yellow', 'purple'],
  Priya: ['red', 'pink'], Kai: ['grey', 'gold'], Nina: ['blurple', 'blue'], Ravi: ['green', 'teal'],
};
const ROWS = [
  ['Leo', 'Steam page copy is in the doc'],
  ['Theo', 'build server is back up'],
  ['Maya', 'who is around for a playtest Friday?'],
  ['Kai', 'login loop again on 0.9.3'],
  ['Jordan', 'on it, fix is in review'],
  ['Nina', 'new title screen draft in #art'],
  ['Ravi', 'that logo goes hard'],
  ['Leo', 'moving launch to the 24th?'],
  ['Priya', 'patch notes draft is up'],
  ['Kai', 'we hit Boost Level 2'],
  ['Nina', 'custom stickers are live'],
  ['Theo', '0.9.4 is building now'],
  ['Maya', 'Friday 7pm ET works'],
  ['Ravi', 'need one more tester'],
  ['Jordan', '0.9.4 is out'],
  ['Leo', 'Steam page goes live Monday'],
  ['Priya', 'thoughts on the title screen?'],
  ['Kai', 'gg everyone'],
  ['Nina', 'trailer cut is uploading'],
  ['Theo', 'I can run the build server'],
  ['Maya', 'out of town Friday, sorry'],
  ['Ravi', 'pinned the playtest form'],
];
const TOPICS = ['Launch date', 'Playtest Friday', 'Build 0.9.4', 'Title screen', 'Boost Level 2'];
const MENTIONS = '3 mentions for you';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the backlog scrolling past, Tuesday to now (the counter runs with it)
const CHIPS_AT = 0.82;                 // the card landing to the first topic chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 28;                        // one row's height, px

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...TOPICS, MENTIONS].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const av = (name) => `<span class="bk-av" style="--c: var(--dc-av-${PEOPLE[name][0]})">${name[0]}</span>`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bk-card">
      <div class="bk-hd"><span class="bk-st"><i class="bk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="bk-cnt"><b class="bk-n">0</b> messages</span></div>
      <div class="bk-vp">
        <div class="bk-list">${ROWS.map(([n, txt]) => `<div class="bk-row">${av(n)}<b style="color: var(--dc-role-${PEOPLE[n][1]})">${n}</b><span>${x.esc(txt)}</span></div>`).join('')}</div>
        <i class="bk-scrim"></i>
        <div class="bk-chips">${TOPICS.map((tp) => `<span class="bk-chip">${x.esc(tp)}</span>`).join('')}<span class="bk-chip bk-ment">${x.esc(MENTIONS)}</span></div>
      </div>
    </div>`);
    const list = card.querySelector('.bk-list'), n = card.querySelector('.bk-n'), scrim = card.querySelector('.bk-scrim');
    const chips = [...card.querySelectorAll('.bk-chip')];
    const spin = card.querySelector('.bk-spin'), ok = card.querySelector('.bk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
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

        // the scroll: Tuesday to now, fast through the middle (a touch of blur at speed), the counter running with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = fmt(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the backlog resolves into its topics: the rows dim under the scrim, the chips land over them
        scrim.style.opacity = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2)).toFixed(3);
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
