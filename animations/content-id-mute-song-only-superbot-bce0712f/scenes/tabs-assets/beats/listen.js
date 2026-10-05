// Listen beat: Gemini listens to the claimed range of Jonah Plays' stream VOD (1:12:08 to 1:15:31 of 3:41:16). Its
// line streams and a dark result card rises: the VOD's thumbnail and title, then a two-lane waveform over the window
// 1:11:40 to 1:16:00 that the playhead sweeps left to right. The music lane is the song the stream speakers picked up
// ("Neon Harbor" by Kestrel Lane, fictional), its claimed range shaded red; the voice lane is Jonah's commentary in
// blue, talking over 94% of the segment (the figure counts up as the playhead crosses the range). The header's spinner
// resolves to the check and the verdict lands: trim would cut 3:23 of the final boss, Mute song only keeps the voice.
// Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Listening to the claimed range of your stream VOD.';
// one fictional video, song, claimant and range; claim.js reads the same values so every scene agrees
export const VOD = {
  title: 'Hollow Crown 100% Run, Final Boss (No Healing) LIVE',
  thumb: 'vod-final-boss.jpg',
  length: '3:41:16',
  streamed: 'Oct 4, 2026',
};
export const SONG = { title: 'Neon Harbor', artist: 'Kestrel Lane', claimant: 'Brightline Music Rights' };
export const RANGE = { a: 4328, b: 4531, label: '1:12:08 to 1:15:31', len: '3:23' }; // seconds of the VOD
const WIN = [4300, 4560];                       // the waveform's window, 1:11:40 to 1:16:00
const VOICE_PCT = 94;
const HEAD = `<b>Claimed range ${RANGE.label}</b><span class="ls-of">of ${VOD.length}</span>`;
const MUSIC = `<b>Music:</b> ${SONG.title}, ${SONG.artist} <span>(stream speakers)</span>`;
const VOICE = '<b>Voice:</b> Jonah, talking over <em class="ls-pc">0%</em> of the segment';
const VERDICT = `<b>Trim would cut ${RANGE.len} of the final boss.</b> <span class="ls-hi">Mute song only</span> keeps your commentary.`;
const BARS = 120;                               // bars per lane across the window
// timing (seconds from the reply start, or from the card where noted)
const CPS = 110;                                // the reply line streams
const SAY_AT = 0.03;
const CARD = 0.08;                              // reply start to the card rising in
const RISE = 0.2;
const SWEEP_AT = 0.2;                           // the card in to the playhead starting
const SWEEP = 1.1; /* deliberate */             // the playhead crossing the window (both lanes draw behind it)
const LABEL_IN = 0.16;
const VERDICT_AT = 0.06;                        // the sweep done to the verdict
const VERDICT_IN = 0.2;
const READ = 0.85; /* deliberate */             // the verdict holds, readable, before Studio takes over

const hms = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const xOf = (s) => (s - WIN[0]) / (WIN[1] - WIN[0]);   // a VOD second to the lane's 0..1
// deterministic waveforms (a seeded LCG): the song is a steady beat inside the claimed range (faint game ambience
// outside it), the voice is speech-shaped phrases with short pauses that add up to 94% of the range
function waves() {
  let s = 1234567;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const music = [], voice = [];
  for (let i = 0; i < BARS; i++) {
    const at = WIN[0] + ((i + 0.5) / BARS) * (WIN[1] - WIN[0]);
    const inR = at >= RANGE.a && at <= RANGE.b;
    const beat = i % 4 === 0 ? 1 : i % 2 === 0 ? 0.72 : 0.55;
    music.push(inR ? Math.min(1, beat * (0.7 + 0.3 * rnd())) : 0.08 + 0.08 * rnd());
    const phrase = Math.sin(i * 0.53) * 0.5 + 0.5;
    const pause = inR ? (i % 17 === 9) : (i % 7 === 3);
    voice.push(pause ? 0.04 : 0.25 + 0.6 * phrase * (0.6 + 0.4 * rnd()));
  }
  return { music, voice };
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.sweep = T.card + SWEEP_AT;
    T.inA = T.sweep + xOf(RANGE.a) * SWEEP;     // the playhead entering the claimed range
    T.inB = T.sweep + xOf(RANGE.b) * SWEEP;     // ...and leaving it
    T.music = T.inA + 0.06;                     // the song is named as soon as the playhead is inside the range
    T.voice = T.music + 0.18;
    T.done = T.sweep + SWEEP;                   // the header's check lands
    T.verdict = T.done + VERDICT_AT;
    T.end = Math.max(T.verdict + VERDICT_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { listen: T.sweep, listenEnd: T.done, verdict: T.verdict });
    const { music, voice } = waves();
    const lane = (vals, cls) => vals.map((v, i) => `<i class="${cls}" style="left:${((i / BARS) * 100).toFixed(3)}%;height:${(Math.max(0.06, v) * 100).toFixed(1)}%"></i>`).join('');
    const ra = (xOf(RANGE.a) * 100).toFixed(3), rw = ((xOf(RANGE.b) - xOf(RANGE.a)) * 100).toFixed(3);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ls-card">
      <div class="ls-hd"><span class="ls-st"><i class="ls-spin"></i>${x.OK}</span><span class="ls-th"><img src="${x.img('thumbs/' + VOD.thumb)}" alt=""/></span><span class="ls-ht"><span class="ls-vt">${x.esc(VOD.title)}</span><span class="ls-rg">${HEAD}</span></span><span class="ls-len">${RANGE.len} claimed</span></div>
      <div class="ls-wave">
        <div class="ls-ruler"><i style="left:${ra}%">${hms(RANGE.a)}</i><i style="left:${(+ra + +rw).toFixed(3)}%">${hms(RANGE.b)}</i></div>
        <div class="ls-lab ls-lab-m"><span class="ls-dot ls-dot-m"></span><span>${MUSIC}</span></div>
        <div class="ls-lane ls-lane-m"><i class="ls-range" style="left:${ra}%;width:${rw}%"></i><span class="ls-bars">${lane(music, 'ls-b')}</span></div>
        <div class="ls-lab ls-lab-v"><span class="ls-dot ls-dot-v"></span><span>${VOICE}</span></div>
        <div class="ls-lane ls-lane-v"><span class="ls-bars">${lane(voice, 'ls-b')}</span></div>
        <i class="ls-head"><b class="ls-ht2">${hms(WIN[0])}</b></i>
      </div>
      <div class="ls-ft">${x.OK}<span>${VERDICT}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const spin = $('.ls-spin'), ok = $('.ls-st .qc-ok'), ft = $('.ls-ft');
    const head = $('.ls-head'), headT = $('.ls-ht2'), pc = $('.ls-pc');
    const labM = $('.ls-lab-m'), labV = $('.ls-lab-v');
    const bars = [...card.querySelectorAll('.ls-lane .ls-bars')];
    // music bars inside the claimed range turn red as the song is identified
    const mBars = [...card.querySelectorAll('.ls-lane-m .ls-b')];
    mBars.forEach((b, i) => { const at = WIN[0] + ((i + 0.5) / BARS) * (WIN[1] - WIN[0]); if (at >= RANGE.a && at <= RANGE.b) b.classList.add('ls-b-c'); });
    const range = $('.ls-range');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastPc = '', lastHead = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead sweeps the window; both lanes draw behind it
        const p = inOutCubic(seg(t, T.sweep, T.done));
        bars.forEach((b) => { b.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`; });
        head.style.left = `${(p * 100).toFixed(3)}%`;
        head.style.opacity = (seg(t, T.sweep - 0.06, T.sweep) * (1 - seg(t, T.done, T.done + 0.16))).toFixed(3);
        const ht = hms(lerp(WIN[0], WIN[1], p));
        if (ht !== lastHead) { headT.textContent = ht; lastHead = ht; }
        range.style.opacity = seg(t, T.inA - 0.04, T.inA + 0.12).toFixed(3);
        card.classList.toggle('ls-id', t >= T.music);

        // the lane labels land as the song is named and the voice is measured; the share counts with the playhead
        [[labM, T.music], [labV, T.voice]].forEach(([n, a]) => {
          const l = outCubic(seg(t, a, a + LABEL_IN));
          n.style.opacity = l.toFixed(3);
          n.style.transform = l >= 1 ? 'none' : `translateX(${((1 - l) * -8).toFixed(2)}px)`;
        });
        const share = Math.round(VOICE_PCT * seg(lerp(WIN[0], WIN[1], p), RANGE.a, RANGE.b));
        const st = `${share}%`;
        if (st !== lastPc) { pc.textContent = st; lastPc = st; }

        const d = outCubic(seg(t, T.done, T.done + 0.16));
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.verdict, T.verdict + VERDICT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
