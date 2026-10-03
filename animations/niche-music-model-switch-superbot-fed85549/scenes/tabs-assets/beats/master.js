// Master beat (the reframe beat's card grammar, re-skinned): GPT-6 Astra masters the mix against the producer's
// reference. Its line streams and a card rises holding a spectrum analyser under a "Matching to reference" chip: the
// reference's spectrum (a dashed line) and the mix's (a filled curve, its low end 3.5 dB hot and a 7 kHz bump) morph
// until the mix sits on the reference, within 0.5 dB. Beside it the three steps tick off in turn, a loudness meter runs
// to its -14 LUFS target, and the two readouts count and lock: -14.0 LUFS integrated, -1.0 dBTP true peak (from the
// +1.8 dB the master clipped at).
// The spectrum, the meter and the readouts are data display drawn from fixed curves (UI), not audio.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Mastered it against your reference: -14 LUFS integrated, -1.0 dBTP, mono-safe below 120 Hz.';
const STEPS = ['Low end matched within 0.5 dB', 'EQ Eight, Glue Compressor, Limiter', 'Mono below 120 Hz'];
const LUFS0 = -19.6, LUFS1 = -14.0;    // integrated loudness, before and after
const TP0 = 1.8, TP1 = -1.0;           // true peak, before (clipping) and after
const LMIN = -30, LMAX = 0;            // the loudness meter's scale
// the analyser: N points, log-spaced 20 Hz to 20 kHz; dB from -60 (bottom) to 0 (top)
const N = 56, F0 = 20, F1 = 20000, DB0 = -60, DB1 = 0;
const VW = 320, VH = 150;
const LABELS = [[50, '50'], [100, '100'], [500, '500'], [1000, '1k'], [5000, '5k'], [10000, '10k']];
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const REF_AT = 0.2, REF_IN = 0.22;     // the card landing to the reference curve drawing in
const MORPH_AT = 0.36, MORPH = 0.5;    // the card landing to the mix morphing onto the reference
const LOCK_AT = 0.38, LOCK_IN = 0.24;  // the morph done to the readouts locking
const POP = 0.16;                      // a step's check popping in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OKI = '<svg class="ms-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const lf = (f) => Math.log10(f / F0) / Math.log10(F1 / F0);           // 0..1 across the analyser
const gauss = (f, c, w) => Math.exp(-((Math.log2(f / c) / w) ** 2));
const FREQ = Array.from({ length: N }, (_, i) => F0 * (F1 / F0) ** (i / (N - 1)));
// the reference: a modern hip-hop master's long-term spectrum (a sub peak near 55 Hz, a gentle downward tilt, air rolloff)
const REF = FREQ.map((f) => -24 + 9 * gauss(f, 55, 1.1) - 3.1 * Math.log2(Math.max(1, f / 160)) - 14 * Math.max(0, lf(f) - 0.9) / 0.1 - 10 * Math.max(0, 0.08 - lf(f)) / 0.08);
// the mix before: 3.5 dB hot at 50 Hz (kick and 808), a 7 kHz bump (the hats), 2 dB quieter overall
const PRE = FREQ.map((f, i) => REF[i] - 2 + 3.5 * gauss(f, 50, 0.7) + 3 * gauss(f, 7000, 0.5) + 0.6 * Math.sin(i * 1.3));
// the mix after: on the reference, within 0.5 dB
const POST = FREQ.map((f, i) => REF[i] + 0.35 * Math.sin(i * 0.9 + 1));
const X = (i) => lf(FREQ[i]) * VW;
const Y = (db) => (1 - (db - DB0) / (DB1 - DB0)) * VH;
const line = (ys) => ys.map((db, i) => `${i ? 'L' : 'M'}${X(i).toFixed(2)} ${Y(db).toFixed(2)}`).join('');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.ref = T.card + REF_AT;                           // the reference curve draws in
    T.m0 = T.card + MORPH_AT; T.m1 = T.m0 + MORPH;     // the mix morphs onto it
    T.ok = [T.m1, T.m1 + 0.14, T.m1 + 0.28];           // the three steps tick
    T.lock = T.m1 + LOCK_AT;                           // the readouts lock
    // the beat's last visible change: the readouts locked, or the line's last character
    T.end = Math.max(T.lock + LOCK_IN, T.ok[2] + POP, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const grid = [-12, -24, -36, -48].map((db) => `<path class="ms-gl" d="M0 ${Y(db).toFixed(2)}H${VW}"/>`).join('')
      + LABELS.map(([f]) => `<path class="ms-gl" d="M${(lf(f) * VW).toFixed(2)} 0V${VH}"/>`).join('');
    const card = x.el(`<div class="ms-card">
      <div class="ms-stage">
        <svg class="ms-spec" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" aria-hidden="true">${grid}
          <path class="ms-area" d=""/><path class="ms-mix" d=""/><path class="ms-ref" d="${line(REF)}"/></svg>
        <div class="ms-fx">${LABELS.map(([f, l]) => `<span style="left:${(lf(f) * 100).toFixed(2)}%">${l}</span>`).join('')}</div>
        <span class="ms-genl">${x.tile('astra')}Matching to reference</span>
        <span class="ms-key"><i class="ms-k-ref"></i>reference<i class="ms-k-mix"></i>mix</span>
        <span class="ms-ar"><b>low end</b><i>within</i><b>0.5 dB</b></span>
      </div>
      <div class="ms-side">
        <div class="ms-steps">${STEPS.map((s) => `<div class="ms-step"><span class="ms-ok"><i class="ms-spin"></i>${OKI}</span><span>${esc(s)}</span></div>`).join('')}</div>
        <div class="ms-meter"><span class="ms-ml">Loudness</span><span class="ms-track"><i class="ms-mf"></i><i class="ms-tgt" style="left:${((-14 - LMIN) / (LMAX - LMIN) * 100).toFixed(2)}%"></i></span></div>
        <div class="ms-reads">
          <span class="ms-rd"><b class="ms-lufs">${LUFS0.toFixed(1)}</b><small>LUFS integrated</small></span>
          <span class="ms-rd"><b class="ms-tp">+${TP0.toFixed(1)}</b><small>dBTP true peak</small></span>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const area = $('.ms-area'), mix = $('.ms-mix'), ref = $('.ms-ref'), genl = $('.ms-genl'), ar = $('.ms-ar');
    const mf = $('.ms-mf'), lufs = $('.ms-lufs'), tp = $('.ms-tp'), reads = [...card.querySelectorAll('.ms-rd')];
    const checks = [...card.querySelectorAll('.ms-ok')].map((n) => ({ spin: n.querySelector('.ms-spin'), ck: n.querySelector('.ms-ck') }));
    const steps = [...card.querySelectorAll('.ms-step')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastM = -1, lastL = '', lastP = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the reference draws in; the chip reads while Astra matches
        ref.style.opacity = outCubic(seg(t, T.ref, T.ref + REF_IN)).toFixed(3);
        genl.style.opacity = (seg(t, T.card + 0.1, T.card + 0.3) * (1 - seg(t, T.m1, T.m1 + 0.2))).toFixed(3);

        // the mix morphs from its own spectrum onto the reference's
        const m = inOutCubic(seg(t, T.m0, T.m1));
        if (Math.abs(m - lastM) > 1e-4) {
          const ys = PRE.map((v, i) => lerp(v, POST[i], m));
          const d = line(ys);
          mix.setAttribute('d', d);
          area.setAttribute('d', `${d}L${VW} ${VH}L0 ${VH}Z`);
          lastM = m;
        }
        ar.style.opacity = outCubic(seg(t, T.m1, T.m1 + 0.2)).toFixed(3);

        checks.forEach((ck, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          ck.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          ck.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          ck.ck.style.opacity = o.toFixed(3);
          ck.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          steps[i].classList.toggle('on', t >= T.ok[i]);
        });

        // the meter and the readouts run with the morph and lock on target
        const q = outCubic(seg(t, T.m0, T.lock));
        const L = lerp(LUFS0, LUFS1, q), P = lerp(TP0, TP1, q);
        mf.style.transform = `scaleX(${((L - LMIN) / (LMAX - LMIN)).toFixed(4)})`;
        const ls = L.toFixed(1), ps = `${P > 0.05 ? '+' : ''}${P.toFixed(1)}`;
        if (ls !== lastL) { lufs.textContent = ls; lastL = ls; }
        if (ps !== lastP) { tp.textContent = ps; lastP = ps; }
        const lk = seg(t, T.lock, T.lock + LOCK_IN);
        reads.forEach((rd) => {
          rd.classList.toggle('on', t >= T.lock);
          rd.style.transform = lk > 0 && lk < 1 ? `scale(${(1 + 0.06 * Math.sin(Math.PI * lk)).toFixed(4)})` : 'none';
        });
        tp.classList.toggle('hot', P > 0);
      },
    };
  },
};
