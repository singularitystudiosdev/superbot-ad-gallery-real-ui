// Captions beat: Claude Opus 5.5 writes the Short's captions, its title and the replies. Its line streams and a card
// rises: "Captions and title". Left, the vertical cut (video/short-9x16, the real Mixkit footage reframed 9:16 with
// the crop GPT-6 Astra drew, video/CREDITS.txt) plays from Short time 0 at 12 px radius, and the captions appear ON it
// as Opus writes them (the chunk under the playhead shows only once its line has been written). Right, the caption
// track streams as timed lines in YouTube Studio's subtitle-editor grammar (a timecode column, the text), then the
// title, then one small line with a check: "Also wrote 5 replies in your voice".
// This file is also the ONE source of the caption text: TRACK (the timed lines) and CHUNKS (the burned-in Shorts
// chunks, 2-4 words each, word by word) are read by studio.js for the hero. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { clip, clipTime, sources } from '../../../video.js?v=b0c8e364';

const SAY = 'Wrote the captions and a title for the Short.';
// the caption track: [Short time (s), line]
export const TRACK = [
  [0, 'Blind test.'],
  [1, 'Four mics, no labels.'],
  [3, 'Which one sounds the most expensive?'],
  [5, 'My editor picked C every single time.'],
  [7, 'C is the $29 one.'],
];
export const TITLE = 'Can you hear the $29 mic?';
const ALSO = 'Also wrote 5 replies in your voice';
// the burned-in chunks on the Short: [text, from (Short s), to]; the timing follows the track (each line split in
// two where it is long), the last chunk holds to the end
export const CHUNKS = [
  ['Blind test.', 0, 1],
  ['Four mics,', 1, 2],
  ['no labels.', 2, 3],
  ['Which one sounds', 3, 4],
  ['the most expensive?', 4, 5],
  ['My editor picked C', 5, 6],
  ['every single time.', 6, 7],
  ['C is the $29 one.', 7, Infinity],
];
const WORD_SPAN = 0.7;                 // a chunk's words light up one by one over this share of its first second
// the chunk on screen at Short time st: its index, its words, and the word lit (yellow) now
export function chunkAt(st) {
  const i = CHUNKS.findIndex(([, a, b]) => st >= a && st < b);
  if (i < 0) return null;
  const [text, a] = CHUNKS[i];
  const words = text.split(' ');
  const active = Math.min(words.length - 1, Math.floor(((st - a) / WORD_SPAN) * words.length));
  return { i, words, active };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const chunkHTML = (c) => c.words.map((w, j) => `<span${j === c.active ? ' class="cap-on"' : ''}>${esc(w)}</span>`).join(' ');

// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 100;                   // superbot's line
const SAY_AT = 0.048;
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;
const LINE_AT = 0.1;                   // the card landing to the first caption line
const CPS = 75;                        // the caption lines stream at this many characters a second
const LINE_GAP = 0.08;                 // one line written to the next starting
const TITLE_AT = 0.15;                 // the last line to the title label
const CPS_TITLE = 60;
const ALSO_AT = 0.25;                  // the title written to the replies line
const ALSO_IN = 0.24;
const HOLD = 0.9; /* deliberate */     // the finished card reads before the next pill
const PLAY_TAIL = 2.6;                 // the vertical cut keeps playing while the card scrolls away

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.v0 = T.card + RISE;                          // the vertical cut starts at Short time 0
    let a = T.v0 + LINE_AT;
    T.l = TRACK.map(([, line]) => { const s = a; a = s + line.length / CPS + LINE_GAP; return s; });
    T.lEnd = TRACK.map(([, line], i) => T.l[i] + line.length / CPS);
    T.title = T.lEnd[TRACK.length - 1] + TITLE_AT;
    T.titleEnd = T.title + 0.12 + TITLE.length / CPS_TITLE;
    T.also = T.titleEnd + ALSO_AT;
    T.end = Math.max(T.also + ALSO_IN + HOLD, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cp-card">
      <div class="cp-hd"><span class="cp-st"><i class="cp-spin"></i>${x.OK}</span><b>Captions and title</b></div>
      <div class="cp-body">
        <div class="cp-ph">
          <video class="cp-vid" muted playsinline preload="auto" width="720" height="1280">${sources(x.video('short-9x16'))}</video>
          <div class="sb-cap cp-cap"></div>
        </div>
        <div class="cp-side">
          <div class="cp-track">${TRACK.map(([s, line]) => `<div class="cp-ln"><span class="cp-tc">${mmss(s)}</span><span class="cp-tx"><span class="qc-vis"></span><span class="qc-hid">${x.esc(line)}</span></span></div>`).join('')}</div>
          <div class="cp-title"><small>Title</small><b><span class="qc-vis"></span><span class="qc-hid">${x.esc(TITLE)}</span></b></div>
          <div class="cp-also">${x.OK}<span>${x.esc(ALSO)}</span></div>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const c = clip($('.cp-vid'), T.v0, T.end + PLAY_TAIL);
    const cap = $('.cp-cap');
    const lines = [...card.querySelectorAll('.cp-ln')].map((n) => ({ n, vis: n.querySelector('.qc-vis'), hid: n.querySelector('.qc-hid'), shown: -1 }));
    const title = $('.cp-title'), tVis = title.querySelector('.qc-vis'), tHid = title.querySelector('.qc-hid');
    const also = $('.cp-also'), spin = $('.cp-spin'), ok = $('.cp-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, tShown = -1, capHTML = null;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.title, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the track: each line streams in turn (its timecode shows with its first character)
        lines.forEach((l, i) => {
          const text = TRACK[i][1];
          const n = streamCount(text, T.l[i], CPS, t);
          if (n !== l.shown) { l.vis.textContent = text.slice(0, n); l.hid.textContent = text.slice(n); l.shown = n; }
          l.n.style.opacity = t >= T.l[i] ? '1' : '0';
        });
        title.style.opacity = outCubic(seg(t, T.title, T.title + 0.2)).toFixed(3);
        const nt = streamCount(TITLE, T.title + 0.12, CPS_TITLE, t);
        if (nt !== tShown) { tVis.textContent = TITLE.slice(0, nt); tHid.textContent = TITLE.slice(nt); tShown = nt; }
        const a = outCubic(seg(t, T.also, T.also + ALSO_IN));
        also.style.opacity = a.toFixed(3);
        also.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 6).toFixed(2)}px)`;
        const d = outCubic(seg(t, T.also, T.also + 0.2));
        spin.style.opacity = (1 - seg(t, T.also - 0.08, T.also + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the captions on the vertical cut: the chunk under the playhead, once its track line has been written
        const st = clipTime(c, t);
        const ch = t >= T.v0 ? chunkAt(st) : null;
        const li = ch ? TRACK.findIndex(([s], j) => st >= s && (j + 1 >= TRACK.length || st < TRACK[j + 1][0])) : -1;
        const html = ch && li >= 0 && t >= T.lEnd[li] ? chunkHTML(ch) : '';
        if (html !== capHTML) { cap.innerHTML = html; capHTML = html; }
      },
    };
  },
};
