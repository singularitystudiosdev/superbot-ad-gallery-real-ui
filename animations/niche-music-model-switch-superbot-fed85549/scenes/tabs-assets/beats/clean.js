// Clean beat (the scribe beat's card grammar, re-skinned): SAM Audio (Meta's text-prompted audio separation model) pulls
// two sounds out of the vocal chop take. Its line streams and a card rises ("Separating Vox Chop, take 3"): the two text
// prompts land as chips ("air conditioner hum", "headphone bleed"), the noise floor readout runs from -48 dB to -82 dB
// while the bar fills, and in the window under it a sweep crosses the take: left of the sweep the waveform is the clean
// one (silence between the phrases), right of it still the noisy one (a raised floor of hum and bleed). Each prompt chip
// ticks as its sound is removed, and the file line "vox_chop_clean.wav  ·  2 sources removed" lands last.
// The waveforms are UI (bars from a fixed seed), not audio. Made up for the spot (brand/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Pulled the air conditioner hum and headphone bleed out of your vocal chop.';
const LABEL = 'Separating Vox Chop, take 3';
const PROMPTS = ['air conditioner hum', 'headphone bleed'];
const FLOOR0 = -48, FLOOR1 = -82;      // the noise floor, before and after
const META = ['vox_chop_clean.wav', 'noise floor -82 dB', '2 sources removed'];
const BARS = 96;
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PROMPT_AT = 0.06, PROMPT_STAGGER = 0.12, PROMPT_IN = 0.2; // the card landing to the prompt chips landing
const COUNT_AT = 0.3, COUNT = 0.66;    // the card landing to the floor readout running -48 to -82 (the bar fills with it)
const SWEEP_AT = 0.3, SWEEP = 0.66;    // the card landing to the sweep crossing the take
const POP = 0.16;                      // a prompt chip's check popping in
const META_AT = 0.06, META_IN = 0.26;  // the sweep done to the file line landing

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OKI = '<svg class="cl-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the take: four sung phrases; the noisy copy carries a raised floor everywhere (hum + bleed), the clean one does not
function takes() {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const PH = [[0.04, 0.2], [0.27, 0.45], [0.53, 0.7], [0.77, 0.95]];
  const clean = [], noisy = [];
  for (let i = 0; i < BARS; i++) {
    const u = (i + 0.5) / BARS;
    const ph = PH.find(([a, b]) => u >= a && u <= b);
    const env = ph ? 0.4 + 0.6 * Math.sin(Math.PI * (u - ph[0]) / (ph[1] - ph[0])) : 0;
    const v = ph ? Math.max(0.08, env * (0.6 + 0.4 * rnd())) : 0.025;
    clean.push(v);
    noisy.push(Math.min(1, Math.max(v, 0.2 + 0.12 * rnd() + 0.06 * Math.sin(i * 1.7))));
  }
  return { clean, noisy };
}
const svgBars = (hs, cls) => `<svg class="cl-wv ${cls}" viewBox="0 0 ${BARS * 4} 40" preserveAspectRatio="none" aria-hidden="true">${hs.map((h, i) => `<rect x="${i * 4 + 0.6}" y="${(20 - h * 19).toFixed(2)}" width="2.6" height="${Math.max(0.8, h * 38).toFixed(2)}" rx="1.2"/>`).join('')}</svg>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p = PROMPTS.map((_, i) => T.card + PROMPT_AT + i * PROMPT_STAGGER); // the prompt chips land
    T.c0 = T.card + COUNT_AT; T.c1 = T.c0 + COUNT;     // the floor readout runs, the bar fills; the check lands at c1
    T.s0 = T.card + SWEEP_AT; T.s1 = T.s0 + SWEEP;     // the sweep crosses the take
    T.ok = [T.s0 + SWEEP * 0.5, T.s1];                 // each prompt ticks as its sound is out
    T.meta = T.s1 + META_AT;
    // the beat's last visible change: the file line settled, or the line's last character
    T.end = Math.max(T.meta + META_IN, T.ok[1] + POP, T.c1 + 0.2, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const { clean, noisy } = takes();
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cl-card">
      <div class="cl-hd"><span class="cl-st"><i class="cl-spin"></i>${x.OK}</span><b>${esc(LABEL)}</b>
        <span class="cl-cnt">noise floor <b class="cl-n">${FLOOR0}</b> dB</span></div>
      <div class="cl-bar"><i class="cl-fill"></i></div>
      <div class="cl-prompts">${PROMPTS.map((p) => `<span class="cl-pc">${x.tile('samaudio')}<span class="cl-pt">remove</span><b>${esc(p)}</b><span class="cl-ok"><i class="cl-pspin"></i>${OKI}</span></span>`).join('')}</div>
      <div class="cl-win">
        <div class="cl-tl"><span>Vox Chop</span><span class="cl-tr">0:00.0 to 0:08.0</span></div>
        <div class="cl-lane">
          <div class="cl-wave">${svgBars(noisy, 'cl-noisy')}<div class="cl-done">${svgBars(clean, 'cl-clean')}</div></div>
          <i class="cl-floor"></i>
          <i class="cl-ph"></i>
        </div>
      </div>
      <div class="cl-meta"><b>${META[0]}</b><i>&middot;</i><span>${META[1]}</span><i>&middot;</i><span>${META[2]}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const n = $('.cl-n'), fill = $('.cl-fill'), spin = $('.cl-spin'), ok = $('.cl-st .qc-ok');
    const done = $('.cl-done'), ph = $('.cl-ph'), meta = $('.cl-meta'), floor = $('.cl-floor');
    const chips = [...card.querySelectorAll('.cl-pc')].map((c) => ({ c, spin: c.querySelector('.cl-pspin'), ck: c.querySelector('.cl-ck') }));
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

        // the prompt chips land, each with a spinner that resolves to a check as its sound is removed
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.p[i], T.p[i] + PROMPT_IN));
          ch.c.style.opacity = q.toFixed(3);
          ch.c.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, q).toFixed(4)})`;
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          ch.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          ch.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          ch.ck.style.opacity = o.toFixed(3);
          ch.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          ch.c.classList.toggle('on', t >= T.ok[i]);
        });

        // the noise floor readout runs down and the bar fills; the spinner resolves to the check as it lands
        const p = outCubic(seg(t, T.c0, T.c1));
        const c = String(Math.round(lerp(FLOOR0, FLOOR1, p)));
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the sweep: left of it the clean take, right of it the noisy one; the floor band shrinks behind it
        const sp = seg(t, T.s0, T.s1);
        done.style.clipPath = `inset(0 ${((1 - sp) * 100).toFixed(3)}% 0 0)`;
        floor.style.left = `${(sp * 100).toFixed(3)}%`;
        ph.style.left = `${(sp * 100).toFixed(3)}%`;
        ph.style.opacity = (seg(t, T.s0 - 0.1, T.s0) * (1 - seg(t, T.s1, T.s1 + 0.2))).toFixed(3);

        const m = outCubic(seg(t, T.meta, T.meta + META_IN));
        meta.style.opacity = m.toFixed(3);
        meta.style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 8).toFixed(2)}px)`;
      },
    };
  },
};
