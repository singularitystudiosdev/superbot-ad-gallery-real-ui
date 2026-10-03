// Channels beat: Gemini reads the backlog Sam missed. Its line streams, a card rises ("Reading 3,412 messages in 14
// channels", the count ticking up as it reads), and inside it a Slack-styled sidebar window (the Aubergine theme) builds
// the six conversations with the most traffic, each with Slack's unread-count badge. Then every row gets Gemini's
// verdict as a tag, "Needs you" or "FYI", one by one, and the card's last line lands: "5 threads need a reply. The rest
// is FYI." The grammar is the sibling forks' backlog beat (card, a platform-styled window, a counter, chips landing).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { icon } from './sk-icons.js?v=9156b108';
import { WORKSPACE, CHANNELS, MESSAGES } from './digest.js?v=9156b108';

const SAY = `Reading everything you missed in ${WORKSPACE} since Sep 22.`;
const TOTAL = MESSAGES;
// [kind, name, unread, needs you?]: the six busiest conversations, as the Slack sidebar names them
const ROWS = [
  ['ch', 'launch-q4', 142, true],
  ['ch', 'design', 58, true],
  ['ch', 'customer-feedback', 96, true],
  ['ch', 'eng-oncall', 311, false],
  ['ch', 'general', 402, true],
  ['dm', 'Marcus', 3, true],
];
const NEEDS = ROWS.filter((r) => r[3]).length;
const END = `${NEEDS} threads need a reply. The rest is FYI.`;
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.08, COUNT = 0.7; /* deliberate */ // the card landing to the counter running, and its run
const ROW_AT = 0.1, ROW_STAGGER = 0.1, ROW_IN = 0.24; // the conversations building in the window
const TAG_AT = 0.8;                    // the card landing to the first verdict tag
const TAG_STAGGER = 0.07, TAG_IN = 0.22; // one tag to the next, a tag popping in
const END_AT = 0.08, END_IN = 0.26;    // the last tag to the end line, and its rise

const fmt = (n) => n.toLocaleString('en-US');
const label = (n) => `Reading ${fmt(n)} messages in ${CHANNELS} channels`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = ROWS.map((_, i) => T.card + ROW_AT + i * ROW_STAGGER);
    T.tag = ROWS.map((_, i) => T.card + TAG_AT + i * TAG_STAGGER);
    T.endl = T.tag[ROWS.length - 1] + END_AT;
    // the beat's last visible change: the end line settled, or the reply line's last character
    T.end = Math.max(T.endl + END_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = ([kind, name, n, need]) => `<div class="cr-row">
      ${kind === 'ch' ? icon('hash', 'cr-ic') : `<span class="cr-av" style="--c: var(--sk-av-${name.toLowerCase()})">${name[0]}</span>`}
      <b class="cr-nm">${kind === 'dm' ? '<small>DM</small> ' : ''}${x.esc(name)}</b>
      <span class="cr-badge">${fmt(n)}</span>
      <span class="cr-tag ${need ? 'cr-need' : 'cr-fyi'}">${need ? 'Needs you' : 'FYI'}</span>
    </div>`;
    const card = x.el(`<div class="cr-card">
      <div class="cr-hd"><span class="cr-st"><i class="cr-spin"></i>${x.OK}</span><b class="cr-lb">${x.esc(label(0))}</b></div>
      <div class="cr-win">${ROWS.map(row).join('')}</div>
      <div class="cr-end">${x.esc(END)}</div>
    </div>`);
    const lb = card.querySelector('.cr-lb');
    const rows = [...card.querySelectorAll('.cr-row')];
    const tags = [...card.querySelectorAll('.cr-tag')];
    const endl = card.querySelector('.cr-end');
    const spin = card.querySelector('.cr-spin'), ok = card.querySelector('.cr-st .qc-ok');
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

        // the counter: the messages Gemini has read, running up to the total
        const c = label(Math.round(TOTAL * outCubic(seg(t, T.c0, T.c1))));
        if (c !== count) { lb.textContent = c; count = c; }
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the conversations build in, then each takes its verdict
        rows.forEach((n, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          n.style.opacity = q.toFixed(3);
          n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
        });
        tags.forEach((n, i) => {
          const q = outCubic(seg(t, T.tag[i], T.tag[i] + TAG_IN));
          n.style.opacity = q.toFixed(3);
          n.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * 6).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
        const e = outCubic(seg(t, T.endl, T.endl + END_IN));
        endl.style.opacity = e.toFixed(3);
        endl.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 6).toFixed(2)}px)`;
      },
    };
  },
};
