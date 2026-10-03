// Frame beat: GPT-6 Astra cuts the blind test and reframes it vertical. Its line streams and a card rises: "Reading the
// frames", the 16:9 SOURCE FOOTAGE playing in a 16:9 player frame (video/source-16x9, a real Mixkit clip,
// video/CREDITS.txt) with a flat timecode label "6:04" (plain text, no play glyph, no transport). A 9:16 crop box (2 px
// white outline, 12 px radius, the frame outside it dimmed to 45%) lands on the speaker and follows him as the footage plays:
// its x is keyframed (CROP below) so his face and the mic stay inside, the SAME keyframes the vertical Short was cut
// with (video/short-9x16, ffmpeg crop at these centres). Beside it two labels resolve with checks: "Cut 6:04 to 6:31",
// "Reframed vertical around Sam"; then the footer: "27 seconds cut from 6:04, framed for Shorts".
// Pure function of t: every moving value is written from t; the clip follows t through video.js.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { clip, clipTime, sources } from '../../../video.js?v=b0c8e364';

const SAY = 'Found the blind test in the footage and cut it vertical.';
const LABELS = ['Cut 6:04 to 6:31', 'Reframed vertical around Sam'];
const TALLY = '27 seconds cut from 6:04, framed for Shorts';
// the source clip is the original 1920 x 1080 frame cropped to x 330..1920, y 0..894 (Ampeg amp out of frame), so the
// 9:16 box is 503 / 1590 of the player's width; its centre follows CROP, in the ORIGINAL frame's width (seconds of
// original footage; the clip starts 0.25 s into it), smoothstep between keys (the Short's ffmpeg crop expression)
export const CROP = [[0, 0.59], [3, 0.62], [6, 0.645], [9, 0.635], [12, 0.66], [12.93, 0.66]];
const CLIP_IN = 0.25;
const SRC = { x: 330, w: 1590, ow: 1920 };
const BOX_W = 503 / 1590;
const smooth = (u) => u * u * (3 - 2 * u);
export function cropCentre(ct) {
  const s = ct + CLIP_IN;
  for (let i = 0; i < CROP.length - 1; i++) {
    const [t0, a] = CROP[i], [t1, b] = CROP[i + 1];
    if (s < t1 || i === CROP.length - 2) return a + (b - a) * smooth(Math.max(0, Math.min(1, (s - t0) / (t1 - t0))));
  }
  return CROP[CROP.length - 1][1];
}
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const BOX_AT = 0.5;                    // the card landing to the crop box landing on the speaker
const BOX_IN = 0.45;                   // the box drawing in (the dim comes up with it)
const LABEL_AT = [0.35, 1.25];         // the box landing to each label resolving
const LABEL_IN = 0.24;
const TALLY_AT = 0.45;                 // the last label to the footer
const TALLY_IN = 0.24;
const HOLD = 1.1; /* deliberate */     // the box keeps following him before the next pill
const PLAY_TAIL = 2.6;                 // the footage keeps playing while the card scrolls away under the next pill

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.box = T.card + RISE + BOX_AT;
    T.lab = LABEL_AT.map((d) => T.box + d);
    T.tally = T.lab[LABEL_AT.length - 1] + LABEL_IN + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fr-card">
      <div class="fr-hd"><span class="fr-st"><i class="fr-spin"></i>${x.OK}</span><b>Reading the frames</b><span class="fr-of">The blind test</span></div>
      <div class="fr-body">
        <div class="fr-ph">
          <video class="fr-vid" muted playsinline preload="auto" width="1280" height="720">${sources(x.video('source-16x9'))}</video>
          <i class="fr-dim fr-dl"></i><i class="fr-dim fr-dr"></i>
          <i class="fr-crop"></i>
          <i class="fr-ts">6:04</i>
        </div>
        <div class="fr-side">
          <small>For Shorts</small>
          <ul>${LABELS.map((d) => `<li>${TICK}${x.esc(d)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="fr-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const vid = $('.fr-vid');
    // the footage plays from the moment the card lands until it has scrolled away
    const c = clip(vid, T.card, T.end + PLAY_TAIL);
    const crop = $('.fr-crop'), dl = $('.fr-dl'), dr = $('.fr-dr'), items = [...card.querySelectorAll('.fr-side li')];
    const ft = $('.fr-ft'), spin = $('.fr-spin'), ok = $('.fr-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.tally, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the 9:16 box: it lands from a little wider, then rides the keyframed centre of the clip frame on screen
        const b = outCubic(seg(t, T.box, T.box + BOX_IN));
        const cx = (cropCentre(clipTime(c, t)) * SRC.ow - SRC.x) / SRC.w;
        const w = BOX_W * lerp(1.35, 1, b);
        crop.style.left = pct(cx - w / 2);
        crop.style.width = pct(w);
        crop.style.opacity = b.toFixed(3);
        // the frame outside the box dims to 45% (two panels, either side of it)
        dl.style.width = pct(Math.max(0, cx - w / 2));
        dr.style.left = pct(Math.min(1, cx + w / 2));
        dl.style.opacity = dr.style.opacity = b.toFixed(3);

        items.forEach((li, i) => {
          const q = outCubic(seg(t, T.lab[i], T.lab[i] + LABEL_IN));
          li.style.opacity = q.toFixed(3);
          li.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -6).toFixed(2)}px)`;
        });
        // done: the spinner resolves to the check as the last label lands
        const d0 = T.lab[LABEL_AT.length - 1];
        const d = outCubic(seg(t, d0, d0 + 0.2));
        spin.style.opacity = (1 - seg(t, d0 - 0.08, d0 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
