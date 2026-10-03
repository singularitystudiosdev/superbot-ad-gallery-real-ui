// EAS beat: Expo, a tool (routed the way the data fork routes its DuckDB step), builds the app for iOS on EAS Build and
// submits it. Its line streams and a build card styled on the EAS dashboard rises (Expo's own dark theme tokens and its
// Inter face): the Expo mark, "Build for iOS" and "Steadyloop 1.0 (1), production" on top, a status line ("Building")
// over a thin progress bar, then four of EAS Build's real iOS build phases tick one by one with their durations
// (the phase names are EAS's own buildPhaseDisplayName strings from @expo/eas-build-job: Install dependencies, Install
// pods, Run fastlane, Upload application archive), the status resolves to "Build finished" and two rows land: the
// artifact (Steadyloop.ipa, 24.6 MB) and the submission ("Sent to App Store Connect"). Expo's blue is the card's one
// accent (the bar); success green is only for the checks. Not a second code panel.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Built it for iOS on EAS Build and sent it to App Store Connect.';
const TITLE = 'Build for iOS';
const SUB = 'Steadyloop 1.0 (1), production';
// [phase, duration shown once it is done] (made up for the spot)
const PHASES = [
  ['Install dependencies', '41s'],
  ['Install pods', '1m 18s'],
  ['Run fastlane', '6m 02s'],
  ['Upload application archive', '12s'],
];
// the rows that land once it is finished: [label, value, kind]
const ROWS = [
  ['Artifact', 'Steadyloop.ipa, 24.6 MB', 'file'],
  ['Submit', 'Sent to App Store Connect', 'ok'],
];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams
const SAY_AT = 0.048;
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.32;                     // the card rising in
const PH_AT = 0.12;                    // the card landing to the first phase starting
const PH = 0.17; /* deliberate */      // one phase running before its check lands (the next starts as it does)
const POP = 0.18;                      // a check popping in
const DONE_AT = 0.06;                  // the last phase checked to "Build finished"
const ROWS_AT = 0.12;                  // finished to the first row
const STAGGER = 0.14;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in

const svg = (d, cls) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const CHECK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'ex-ck');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PH_AT;                                  // the first phase starts
    T.ph = PHASES.map((_, i) => T.p0 + (i + 1) * PH);       // each phase's check lands
    T.done = T.ph[PHASES.length - 1] + DONE_AT;            // "Build finished"
    T.rows = ROWS.map((_, i) => T.done + POP + ROWS_AT + i * STAGGER);
    T.end = Math.max(T.rows[ROWS.length - 1] + ROW_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const logo = x.brand('expo-logo.svg');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ex-card">
      <div class="ex-hd"><span class="ex-logo"><img src="${logo}" alt=""/></span><span class="ex-ti"><b>${x.esc(TITLE)}</b><small>${x.esc(SUB)}</small></span></div>
      <div class="ex-st">
        <div class="ex-sl"><span class="ex-s"><i class="ex-spin"></i>${CHECK}</span><b class="ex-stl">Building</b></div>
        <div class="ex-bar"><i></i></div>
      </div>
      <div class="ex-phs">${PHASES.map(([p, d]) => `<div class="ex-ph"><span class="ex-s"><i class="ex-spin"></i>${CHECK}</span><span class="ex-pn">${x.esc(p)}</span><span class="ex-pd">${x.esc(d)}</span></div>`).join('')}</div>
      ${ROWS.map(([l, v, kind]) => `<div class="ex-row ex-${kind}"><span class="ex-k">${x.esc(l)}</span><span class="ex-v">${x.esc(v)}</span>${kind === 'ok' ? CHECK : ''}</div>`).join('')}
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = $('.ex-st'), stl = $('.ex-stl'), bar = $('.ex-bar i');
    const stSpin = $('.ex-sl .ex-spin'), stCk = $('.ex-sl .ex-ck');
    const phs = [...card.querySelectorAll('.ex-ph')].map((n) => ({ n, spin: n.querySelector('.ex-spin'), ck: n.querySelector('.ex-ck'), d: n.querySelector('.ex-pd') }));
    const rows = [...card.querySelectorAll('.ex-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastSt = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.rows[ROWS.length - 1], card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the phases: each one waits (dim), runs (spinner), then lands its check and its duration
        phs.forEach((o, i) => {
          const a = T.p0 + i * PH, b = T.ph[i];
          const on = t >= a;
          o.n.classList.toggle('ex-on', on);
          o.spin.style.opacity = on ? (1 - seg(t, b - 0.06, b + 0.04)).toFixed(3) : '0';
          o.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
          const q = outCubic(seg(t, b, b + POP));
          o.ck.style.opacity = q.toFixed(3);
          o.ck.style.transform = `scale(${lerp(0.4, 1, q).toFixed(4)})`;
          o.d.style.opacity = q.toFixed(3);
        });
        // the status: "Building" over the bar (it runs with the phases), then "Build finished" with its check
        const p = inOutCubic(seg(t, T.p0, T.done));
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        const done = t >= T.done;
        const s = done ? 'Build finished' : 'Building';
        if (s !== lastSt) { stl.textContent = s; lastSt = s; }
        st.classList.toggle('ex-done', done);
        stSpin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.04)).toFixed(3);
        stSpin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const o = outCubic(seg(t, T.done, T.done + POP));
        stCk.style.opacity = o.toFixed(3);
        stCk.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;

        rows.forEach((n, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          n.style.opacity = q.toFixed(3);
          n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
      },
    };
  },
};
