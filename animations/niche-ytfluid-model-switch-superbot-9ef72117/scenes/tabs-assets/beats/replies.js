// Replies beat (Claude Opus 5.5, the writer). One card: "Replies in your voice", matched to Sam's past replies. Each
// of Gemini's four comments gets a row (the commenter's avatar and name, then Sam's reply streaming in with a soft
// leading edge; the unstreamed rest already holds its space, so nothing below it moves). When the last reply has
// landed, the pin decision lands on Priya's row and as one line under the card: the most-asked question, and the
// reply answers it. Pure function of t.
import { esc } from '../../../lib.js';
import { smooth, spring, rise, streamHTML, streamEnd, lerp } from '../motion.js?v=9ef72117';
import { ms } from './yt-icons.js?v=9ef72117';
import { TOP } from './watch.js?v=9ef72117';

// Sam's replies, in the order of Gemini's rows (studio.js posts these)
export const REPLIES = [
  'The $49 dynamic. It ignores most of the room, you can hear it side by side at 7:05.',
  'Same thing happened to my editor. The $29 one is the sleeper of the whole video.',
  'It’s a $25 scissor arm, the shock mount came in the box. Both are linked in the description.',
  'Headsets are next. Already testing six of them.',
];
const PIN = 'Pin Priya’s comment: 214 people asked it, and the reply answers it.';

const CPS = 78;
// seconds from the reply line
const CARD = 0.1, ROW = 0.32, STAG = 0.3, TYPE = 0.14;
const rowAt = (r, i) => r + ROW + STAG * i;
const typeAt = (r, i) => rowAt(r, i) + TYPE;
const lastAt = (r) => Math.max(...REPLIES.map((s, i) => streamEnd(s, typeAt(r, i), CPS)));

export default {
  times(sw, base) {
    const pin = lastAt(base.reply) + 0.12;
    return { pin, end: pin + 0.65 };
  },

  build(k, ctx) {
    const r = k.reply, pinAt = k.T.pin;
    const card = ctx.el(`<div class="rp-card">
  <div class="rp-head"><b>Replies in your voice</b><small>matched to 312 of your past replies</small></div>
  ${TOP.map(([n, col], i) => `<div class="rp-row"><span class="rp-av" style="background:${col}">${n[0]}</span><div class="rp-c"><span class="rp-n">${esc(n)}${i === 0 ? `<em class="rp-pin">${ms('keep', 'rp-pi')}Pin</em>` : ''}</span><span class="rp-t"></span></div></div>`).join('')}
</div>`);
    const line = ctx.el(`<div class="rp-dec">${ms('keep', 'rp-di')}<span>${esc(PIN)}</span></div>`);
    const rows = [...card.querySelectorAll('.rp-row')], texts = [...card.querySelectorAll('.rp-t')];
    const pin = card.querySelector('.rp-pin'), head = card.querySelector('.rp-head small');
    const last = texts.map(() => '');
    return {
      nodes: [card, line],
      marks: [[r + CARD, card.querySelector('.rp-head')], [rowAt(r, 1), rows[1]], [rowAt(r, 3), rows[3]], [pinAt, line]],
      render(t) {
        rise(card, t, r + CARD, 14, 0.65);
        head.style.opacity = smooth(t, r + 0.3, r + 0.7).toFixed(3);
        rows.forEach((row, i) => {
          rise(row, t, rowAt(r, i), 10, 0.55);
          const html = streamHTML(REPLIES[i], typeAt(r, i), CPS, t, esc);
          if (html !== last[i]) { texts[i].innerHTML = html; last[i] = html; }
        });
        const p = smooth(t, pinAt, pinAt + 0.35);
        pin.style.opacity = p.toFixed(3);
        pin.style.transform = `scale(${lerp(0.8, 1, spring(t, pinAt, 0.5)).toFixed(4)})`;
        rise(line, t, pinAt + 0.08, 8, 0.55);
      },
    };
  },
};
