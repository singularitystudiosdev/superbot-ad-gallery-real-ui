// Claude beat: the writing hand-off. Claude Opus 5.5 gets Gemini's findings (what each comment is about, the moment in
// the video that answers it) and writes the four replies the way Sam writes them, then names the one to pin. Shown as
// prose replies, one under each comment they answer: no editor, no file, because a reply is not a document.
// Pure function of t.
import { seg, outQuart, esc, streamCount, rise } from '../../../lib.js';
import { ms } from './yt-icons.js?v=88a89e94';
import { COMMENTS, REPLY, PINNED } from './data.js?v=88a89e94';

const CARD_AT = 0.05, CARD_IN = 0.45;
const FIRST = 0.4;        // reply start to the first reply streaming
const CPS = 105;          // a fast, readable stream
const NEXT = 0.14;        // one reply finished to the next one starting
const ROW_IN = 0.4;
const PIN_AT = 0.22, PIN_IN = 0.42;
const READ = 0.6;         // the pick landed to the beat's end

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    let a = r + FIRST;
    T.rows = COMMENTS.map((c) => {
      const s = a, e = s + REPLY[c.first].length / CPS;
      a = e + NEXT;
      return [s, e];
    });
    T.pin = T.rows[T.rows.length - 1][1] + PIN_AT;
    T.end = T.pin + PIN_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const pick = COMMENTS[PINNED];
    const card = x.el(`<div class="cl-card">
      <div class="cl-head"><span>Replies</span><small>in your voice · from your last 200 replies</small></div>
      ${COMMENTS.map((c) => `<div class="cl-row">
        <div class="cl-to"><img src="${x.img(c.av)}" alt=""/><b>${esc(c.name)}</b><span>${esc(c.text)}</span></div>
        <div class="cl-re"><img src="${x.img('av-sam.jpg')}" alt=""/><p class="cl-txt"><span class="cl-ghost">${esc(REPLY[c.first])}</span><span class="cl-live"></span></p></div>
      </div>`).join('')}
      <div class="cl-pin">${ms('keep-outline')}<span>Pin <b>${esc(pick.first)}'s question</b>, ${esc(pick.tag)}. The answer saves everyone asking again.</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.cl-row')];
    // the full reply sits invisible under the stream, so a wrapping line never jumps the rows below it
    const txts = rows.map((r) => r.querySelector('.cl-live'));
    const head = card.querySelector('.cl-head');
    const pin = card.querySelector('.cl-pin');
    const last = txts.map(() => null);
    return {
      nodes: [card],
      marks: [[T.card, head], ...T.rows.map(([s], i) => [s, rows[i]]), [T.pin, pin]],
      render(t) {
        rise(card, outQuart(seg(t, T.card, T.card + CARD_IN)), 12);
        T.rows.forEach(([s, e], i) => {
          rise(rows[i], outQuart(seg(t, s - 0.08, s - 0.08 + ROW_IN)), 10);
          const text = REPLY[COMMENTS[i].first];
          const n = t < s ? 0 : streamCount(text, s, CPS, t);
          const html = `${esc(text.slice(0, n))}${t >= s && t < e + 0.15 ? '<i class="cl-caret"></i>' : ''}`;
          if (html !== last[i]) { txts[i].innerHTML = html; last[i] = html; }
        });
        rise(pin, outQuart(seg(t, T.pin, T.pin + PIN_IN)), 8);
      },
    };
  },
};
