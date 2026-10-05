// Listen beat: ElevenLabs measures the answer to the most-asked comment. Priya asked which mic to buy for a small
// untreated room (214 people asked it, and it is the comment the ad pins), and the video's 7:05 room test holds the
// answer: the same lines read into all 12 mics in one bare room. Its line streams and a 16:9 card rises. On the left
// the test's audio, the 12 clips end to end (cheapest first): a playhead runs across it and behind the playhead Voice
// Isolator pulls each clip apart into its voice (the top lane) and what is left once the voice is gone, the room's
// echo (the amber lane): on the $49 dynamic it is almost flat, on the shotgun it is half the voice. On the right the
// 12 mics then rank by voice-to-room ratio as their bars grow, and the winner's row lights. The footer lands with the
// check: the number Priya's reply quotes. The waveform is generated here, deterministically, from each mic's ratio, so
// the picture and the bars are the same data. In the zoom cut the camera hands straight from the switch pill to the
// card (chat.js FOCUS). Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Split the voice from the room in all 12 clips of the 7:05 room test, then measured the echo left over.';
// [label, kind, voice-to-room ratio in dB], in the order the mics were recorded (price order, as in the video)
export const MICS = [
  ['$29 USB', 'usb', 15], ['$35 USB', 'usb', 8], ['$39 lavalier', 'lav', 12], ['$45 USB', 'usb', 10],
  ['$49 dynamic', 'dyn', 24], ['$59 USB', 'usb', 16], ['$65 dynamic', 'dyn', 14], ['$69 shotgun', 'shot', 6],
  ['$79 dynamic', 'dyn', 18], ['$89 USB', 'usb', 13], ['$95 XLR condenser', 'ldc', 9], ['$99 XLR condenser', 'ldc', 11],
];
const RANK = MICS.map((m, i) => [...m, i]).sort((a, b) => b[2] - a[2]);
const WIN = RANK[0], NEXT = RANK[1];
export const VERDICT = `${WIN[0]}: ${WIN[2] - NEXT[2]} dB less room echo than the next best mic`;
const TALLY = `${VERDICT}. Priya's answer, measured.`;
const DB_MAX = 26;
// the waveform: SAMPLES bars per clip, a speech envelope shared by every clip (the same lines were read into each mic)
const SAMPLES = 18;
const VW = 600, VH = 150, MIX_Y = 75, VOICE_Y = 44, ROOM_Y = 116, AMP = 30;
const rnd = (i) => { const v = Math.sin(i * 78.233 + 1.7) * 43758.5453; return v - Math.floor(v); };
const voice = (j) => {
  const syll = Math.abs(Math.sin(j * 0.75 + 0.4)) * 0.7 + 0.3;
  const gap = (j % SAMPLES) === 0 || (j % SAMPLES) === SAMPLES - 1 ? 0.25 : 1;
  return Math.min(1, syll * gap * (0.72 + 0.28 * rnd(j)));
};
// room echo: the voice's energy scaled by the mic's ratio, smeared later in time (a tail), never silent
const room = (j, db) => {
  const k = Math.pow(10, -db / 20);
  const tail = 0.55 * voice(j) + 0.3 * voice(Math.max(0, j - 1)) + 0.15 * voice(Math.max(0, j - 2));
  return Math.max(0.025, k * tail * (0.8 + 0.4 * rnd(j + 999)));
};
const N = MICS.length * SAMPLES;
const BW = VW / N;
const bars = (fn, cy) => Array.from({ length: N }, (_, j) => {
  const h = Math.max(1, fn(j) * AMP * 2);
  return `<rect x="${(j * BW + BW * 0.18).toFixed(2)}" y="${(cy - h / 2).toFixed(2)}" width="${(BW * 0.64).toFixed(2)}" height="${h.toFixed(2)}" rx="${(BW * 0.3).toFixed(2)}"/>`;
}).join('');
const clipOf = (j) => Math.floor(j / SAMPLES);
const MIX = bars((j) => Math.min(1.25, voice(j) + room(j, MICS[clipOf(j)][2])) * 0.8, MIX_Y);
const VOICE = bars((j) => voice(j) * 0.86, VOICE_Y);
const ROOM = bars((j) => room(j, MICS[clipOf(j)][2]) * 0.86, ROOM_Y);

// the five mic kinds as 12 px line glyphs (drawn for the spot, the thumbnail's shapes reduced)
const GLYPH = {
  dyn: '<rect x="4" y="1" width="4" height="7" rx="2"/><path d="M2.5 4v2.5a3.5 3.5 0 0 0 7 0V4M6 10v1.5M4 11.5h4"/>',
  usb: '<rect x="3.6" y="1" width="4.8" height="8" rx="2.4"/><path d="M3.6 4.6h4.8M6 9v2.3M3.8 11.3h4.4"/>',
  ldc: '<rect x="4" y="1" width="4" height="7.2" rx="2"/><ellipse cx="6" cy="5.6" rx="3.6" ry="1"/><path d="M6 8.2v3.3M4 11.5h4"/>',
  lav: '<circle cx="6" cy="3" r="1.7"/><path d="M6 4.7v2.2M4.6 7h2.8M6 7c0 2.6 2.6 2 2.6 4.4"/>',
  shot: '<path d="M2 9.6 9.4 2.2"/><path d="M1.6 8.2l2.2 2.2"/><path d="M5 11.4h3.6"/>',
};
const glyph = (k) => `<svg class="el-g" viewBox="0 0 12 12" aria-hidden="true">${GLYPH[k]}</svg>`;

// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 115;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.2;                   // the card landing to the playhead starting
const SCAN = 0.8; /* deliberate */     // the playhead across all 12 clips (linear: each clip splits as it passes)
const SPLIT = 0.12;                    // a sample behind the playhead easing apart into its two lanes
const BAR_AT = 0.04;                   // a clip measured to its row landing
const BAR_IN = 0.3;                    // a bar growing to its value
const SORT_AT = 0.2;                   // the last bar landing to the rows sorting
const SORT = 0.42; /* deliberate */    // the rows travelling from recording order to rank order, inOutCubic
const ROW_H = 17;                      // a ranking row's pitch (16px row + 1px gap, listen.css)
const WIN_AT = 0;                      // the sort landed to the winner's row lighting
const WIN_IN = 0.22;
const TALLY_AT = 0.1;                  // the winner lit to the footer
const TALLY_IN = 0.24;                 // the footer rising in
const FOCUS_AT = 0.14; /* deliberate */  // the card has started rising, then the camera hands over from the pill to it
const FOCUS_PUSH = 0.5; /* deliberate */ // push-in, outQuint
const HOLD_DONE = 0.32; /* deliberate */ // the measured answer read, pushed in, before the pull-back
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // a clip label lights the moment the playhead clears the clip
    T.clip = MICS.map((_, i) => T.s0 + SCAN * ((i + 1) / MICS.length));
    // a mic's row lands (in recording order) the moment the playhead has measured its clip; once all 12 are in, the
    // rows sort into rank
    T.bar = RANK.map((m) => T.clip[m[3]] + BAR_AT);
    T.sort0 = Math.max(...T.bar) + SORT_AT;
    T.sort1 = T.sort0 + SORT;
    T.win = T.sort1 + WIN_AT;
    T.tally = T.win + TALLY_AT;
    T.done = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL, fill: 0.93 };
    }
    T.end = T.focus ? T.focus.back : T.done;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="el-card">
      <div class="el-hd"><span class="el-st"><i class="el-spin"></i>${x.OK}</span><b>Isolating the voice in 12 clips</b>
        <span class="el-chip">Room test · 7:05</span><span class="el-tool">Voice Isolator</span></div>
      <div class="el-l">
        <div class="el-wave">
          <span class="el-lane el-lv"><i></i>Voice</span><span class="el-lane el-lr"><i></i>Room echo</span>
          <div class="el-plot">
            <svg class="el-mix" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" aria-hidden="true">${MIX}</svg>
            <svg class="el-split" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" aria-hidden="true"><g class="el-v">${VOICE}</g><g class="el-r">${ROOM}</g></svg>
            ${MICS.map((_, i) => (i ? `<u style="left: ${((i / MICS.length) * 100).toFixed(3)}%"></u>` : '')).join('')}
            <i class="el-ph"></i>
          </div>
          <div class="el-clips">${MICS.map(([label], i) => `<span class="${i === WIN[3] ? 'el-w' : ''}">${x.esc(label.split(' ')[0])}</span>`).join('')}</div>
        </div>
        <span class="el-note">Same script, same bare room, 12 mics. Higher ratio, less room in the recording.</span>
      </div>
      <div class="el-r">
        <div class="el-rh"><b>Voice-to-room ratio</b><span>dB, higher is cleaner</span></div>
        <div class="el-rows">${RANK.map(([label, kind, db], i) => `<div class="el-row${i === 0 ? ' el-top' : ''}" style="--z: ${RANK.length - i}"><span class="el-rk">${i + 1}</span>${glyph(kind)}<span class="el-nm">${x.esc(label)}</span>
          <span class="el-tr"><i style="--w: ${(db / DB_MAX).toFixed(4)}"></i></span><span class="el-db"><b>0</b> dB</span></div>`).join('')}</div>
      </div>
      <div class="el-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const spin = $('.el-spin'), ok = $('.el-st .qc-ok');
    const split = $('.el-split'), mix = $('.el-mix'), ph = $('.el-ph');
    const vRects = [...card.querySelectorAll('.el-v rect')], rRects = [...card.querySelectorAll('.el-r rect')];
    const clips = [...card.querySelectorAll('.el-clips span')];
    const rows = [...card.querySelectorAll('.el-row')].map((n) => ({ n, rk: n.querySelector('.el-rk'), bar: n.querySelector('.el-tr i'), v: n.querySelector('.el-db b'), shown: '' }));
    const ft = $('.el-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    // each split sample starts on the mixed line and eases out to its lane as the playhead passes it
    const eased = new Array(N).fill('');

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: linear across the 12 clips; the mixed waveform is wiped away behind it and the split one shown
        const p = seg(t, T.s0, T.s1);
        const pc = (p * 100).toFixed(3);
        mix.style.clipPath = `inset(0 0 0 ${pc}%)`;
        split.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(3)}% 0 0)`;
        ph.style.left = `${pc}%`;
        ph.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 10, (1 - p) * 10) : 0).toFixed(3);
        // a sample eases from the mixed line to its lane over SPLIT seconds after the playhead passes it
        for (let j = 0; j < N; j++) {
          const tj = T.s0 + (SCAN * j) / N;
          const e = inOutCubic(seg(t, tj, tj + SPLIT));
          const key = e.toFixed(3);
          if (key === eased[j]) continue;
          eased[j] = key;
          vRects[j].setAttribute('transform', e >= 1 ? '' : `translate(0 ${((MIX_Y - VOICE_Y) * (1 - e)).toFixed(2)})`);
          rRects[j].setAttribute('transform', e >= 1 ? '' : `translate(0 ${((MIX_Y - ROOM_Y) * (1 - e)).toFixed(2)})`);
        }
        clips.forEach((c, i) => c.classList.toggle('on', t >= T.clip[i]));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the ranking: each row fades up in its recording slot as its clip is measured, its bar growing and its value
        // counting with it; then every row travels to its rank slot and the rank numbers come up
        const sp = inOutCubic(seg(t, T.sort0, T.sort1));
        rows.forEach((o, i) => {
          const off = (RANK[i][3] - i) * ROW_H * (1 - sp);
          o.n.style.transform = Math.abs(off) < 0.01 ? 'none' : `translateY(${off.toFixed(2)}px)`;
          o.rk.style.opacity = sp.toFixed(3);
          const a = outCubic(seg(t, T.bar[i] - 0.06, T.bar[i] + 0.14));
          o.n.style.opacity = a.toFixed(3);
          const g = outCubic(seg(t, T.bar[i], T.bar[i] + BAR_IN));
          o.bar.style.transform = `scaleX(${g.toFixed(4)})`;
          const v = String(Math.round(RANK[i][2] * g));
          if (v !== o.shown) { o.v.textContent = v; o.shown = v; }
        });
        const w = outCubic(seg(t, T.win, T.win + WIN_IN));
        rows[0].n.classList.toggle('el-lit', t >= T.win);
        rows[0].n.style.setProperty('--lit', w.toFixed(3));
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
