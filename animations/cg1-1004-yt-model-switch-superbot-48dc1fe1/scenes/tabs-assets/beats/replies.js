// Claude Opus 5.5's beat: the writing step. Five public replies in the creator's own voice, and the call on which
// comment to pin, is long-form writing and judgement, the work Claude is picked for. The nest reads:
//   steps   "Writing 5 replies in your voice" -> "Wrote 5 replies in your voice"
//           "Choosing the comment to pin" -> "Pinning Priya's question"
//   details the five drafts as superbot renders a model's answer: one row per commenter (avatar, handle), the reply
//           streaming in under it; Lena's reply carries GPT-6 Astra's answer, Priya's row takes the pin when it is
//           chosen, and a one-line reason closes the card.
// The camera pushes in on the card while it writes (T.focus, scenes/tabs.js) and pulls back once the pin is chosen.
// Every mark is the original beat's (reply + 0.08 card, +0.38 writing for 1.35 s, pin at +1.79, done +2.09, the
// camera back at +2.89), so the pacing is unchanged.
import { seg, outCubic, esc } from '../../../lib.js';
import { stepHtml, mountStep, renderStep, rise } from '../thread-ui.js?v=48dc1fe1';
import { TOP, avatar } from './watch.js?v=48dc1fe1';
import { ANSWER } from './frame.js?v=48dc1fe1';

export const REPLIES = [
  'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.',
  "My editor fell for the $29 one too. It's the sleeper of the whole video.",
  `${ANSWER}. Linked it in the description.`,
  "Headsets are already on the list. They're next.",
  'Same here, the USB one surprised me most.',
];
export const PIN = 0;             // Priya: asked 214 times, one reply answers them all
const WHY = '214 people asked it. One pinned reply answers all of them.';

const CARD_AT = 0.08, WRITE_AT = 0.3, WRITE = 1.35, REST_AT = 0.06, REST = 0.3;
const HOLD_DONE = 0.4, FOCUS_AT = 0.36, FOCUS_PUSH = 0.4, FOCUS_PULL = 0.4;

// the stream: reply i shows chars [0, n) once the running count passes its start
const STARTS = REPLIES.reduce((a, l, i) => (a.push(i ? a[i - 1] + REPLIES[i - 1].length : 0), a), []);
const CHARS = STARTS[STARTS.length - 1] + REPLIES[REPLIES.length - 1].length;
const PIN_SVG = '<svg viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>';

export function times(r, opts = {}) {
  const T = { r };
  T.card = r + CARD_AT;
  T.w0 = T.card + WRITE_AT;
  T.w1 = T.w0 + WRITE;
  T.n0 = T.w1 + REST_AT;      // the pin is chosen
  T.done = T.n0 + REST;
  if (opts.zoom !== false) {
    const sw = T.card + FOCUS_AT;
    T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL, fill: 0.86 };
  }
  T.end = T.focus ? T.focus.back : T.done + HOLD_DONE;
  return T;
}

// a row opening: its height eases from 0 to its content's while it fades up, so the card never shows empty space
function grow(n, t, a, pad = 6) {
  const p = outCubic(seg(t, a, a + 0.32));
  n.style.opacity = p.toFixed(3);
  n.style.height = p >= 1 ? '' : `${(n.scrollHeight * p).toFixed(2)}px`;
  if (pad) n.style.paddingTop = n.style.paddingBottom = p >= 1 ? '' : `${(pad * p).toFixed(2)}px`;
}

export function build(k, x) {
  const { T } = k;
  const steps = x.el(`<ol class="sb-steps">${stepHtml('Writing 5 replies in your voice')}${stepHtml('Choosing the comment to pin')}</ol>`);
  const [li1, li2] = steps.children;
  const s1 = mountStep(li1, ['Writing 5 replies in your voice', 'Wrote 5 replies in your voice']);
  const s2 = mountStep(li2, ['Choosing the comment to pin', "Pinning Priya's question"]);
  const card = x.el(`<div class="sb-det rp-card">
    <ol class="rp-rows">${TOP.map((c, i) => `<li class="rp-row">${avatar(c, x.img, 'rp-av')}<span class="rp-body"><span class="rp-to">Reply to <b>${esc(c.handle)}</b><em class="rp-pin">${PIN_SVG}Pin</em></span><span class="rp-tx"></span></span></li>`).join('')}</ol>
    <div class="rp-why">${PIN_SVG}<span>${esc(WHY)}</span></div>
  </div>`);
  const rows = [...card.querySelectorAll('.rp-row')];
  const txs = rows.map((r) => r.querySelector('.rp-tx'));
  const pin = rows[PIN].querySelector('.rp-pin');
  const why = card.querySelector('.rp-why');
  const shown = REPLIES.map(() => -1);

  return {
    nodes: [steps, card],
    marks: [[T.card, card]],
    focus: T.focus ? card : null,
    render(t) {
      renderStep(s1, t, T.card, T.w1);
      renderStep(s2, t, T.n0 - 0.2, T.done);
      rise(card, t, T.card, 8);
      // characters stream at an even rate across the five replies; each row rises as its first word lands
      const n = Math.floor(CHARS * seg(t, T.w0, T.w1) + 1e-6);
      REPLIES.forEach((line, i) => {
        const m = Math.max(0, Math.min(line.length, n - STARTS[i]));
        if (m !== shown[i]) { txs[i].innerHTML = esc(line.slice(0, m)) + (m > 0 && m < line.length ? '<i class="rp-caret"></i>' : ''); shown[i] = m; }
        grow(rows[i], t, T.w0 + (STARTS[i] / CHARS) * WRITE - 0.12);
      });
      const p = outCubic(seg(t, T.n0, T.n0 + 0.3));
      pin.style.opacity = p.toFixed(3);
      pin.style.transform = p >= 1 ? 'none' : `scale(${(0.6 + 0.4 * p).toFixed(4)})`;
      rows[PIN].classList.toggle('rp-on', t >= T.n0);
      rows[PIN].style.setProperty('--on', p.toFixed(3));
      grow(why, t, T.n0 + 0.08, 0);
    },
  };
}

export default { times, build };
