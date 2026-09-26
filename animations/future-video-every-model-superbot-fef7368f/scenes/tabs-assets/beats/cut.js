// Cut beat: the editing model assembles the film in an NLE timeline. Its line streams, the editor window rises,
// the four shot clips slide in from the right and snap onto V1 one after another (8s / 8s / 6s / 8s of a 30s cut),
// the voice track fills (teal, low alpha, tiny waveform), the score track fills (purple to pink, tiny waveform), the
// playhead then sweeps across all three tracks with the timecode counting up, and the "Exporting 1080p" chip below
// the window resolves to "Exported The Steep Part.mp4".
// Pure function of t: every moving value is written from t in render, so ?t= freezes any frame. No Date, no rAF,
// no CSS transitions or animations. The chip row reuses the shared .dd-chiprow / .ch-tool / .spin markup from
// chat.css, exactly as play.js does.
import { lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const SAY = 'Cut it together: four shots, the voice and the score.';
// [what the chip says while it works, what it says when it is done]
const CHIP = ['Exporting 1080p', 'Exported The Steep Part.mp4'];
// [still, duration label, proportional width]: the four shots the edit lays onto V1, in order
const CLIPS = [
  ['future/still-42.jpg', '8s', 8],
  ['future/still-152.jpg', '8s', 8],
  ['future/still-212.jpg', '6s', 6],
  ['future/still-172.jpg', '8s', 8],
];
const TOTAL = 30;   // seconds of timeline the four clips fill (8 + 8 + 6 + 8)
const FPS = 24;     // the timecode's frame rate
const VO_W = 72;    // the voice block covers the first 72% of the timeline
const SWEEP = 0.9;  // seconds the playhead takes to cross the whole timeline once the cut is assembled
const SNAP = 0.38;  // seconds one clip takes to slide in from the right and snap onto the track

// a tiny waveform: a smooth swell (the clip's average level) times deterministic jitter from an integer seed, so
// every frozen frame is the same pixels
const wave = (bars, seed) => Array.from({ length: bars }, (_, i) => {
  const swell = 0.5 + 0.5 * Math.sin(Math.PI * (i + 0.5) / bars);
  const h = (0.3 + 0.7 * rand(i * 3.7 + seed)) * swell;
  return `<i style="height:${(12 + 88 * h).toFixed(0)}%"></i>`;
}).join('');

// a timeline position in seconds as the NLE's clip timecode, "hh:mm:ss:ff"
function timecode(sec) {
  const p = (n) => String(n).padStart(2, '0');
  let f = Math.max(0, Math.round(sec * FPS));
  const ff = f % FPS; f = (f - ff) / FPS;
  const ss = f % 60; f = (f - ss) / 60;
  const mm = f % 60;
  const hh = (f - mm) / 60;
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.42;                                       // the editor window rises in
    T.clip = CLIPS.map((_, i) => T.card + 0.12 + i * 0.20);  // each clip starts sliding onto V1
    T.vo = r + 1.30;                                         // the voice track fills
    T.music = r + 1.46;                                      // the score track fills
    T.play = r + 1.72;                                       // the playhead starts its sweep
    T.chipIn = r + 2.00;                                     // "Exporting 1080p" lands
    T.chipDone = r + 2.72;                                   // it resolves to the exported film
    T.end = r + 3.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chipRow = x.el(`<div class="dd-chiprow cut-ex" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(CHIP[0])}</span></div></div>`);
    const card = x.el(`<div class="cut-win">
      <div class="cut-bar"><span class="cut-dots"><i></i><i></i><i></i></span><b class="cut-title">The Steep Part · timeline</b><span class="cut-tc">00:00:00:00</span></div>
      <div class="cut-main">
        <div class="cut-row cut-head"><span class="cut-lab"></span><span class="cut-rule"></span></div>
        <div class="cut-row"><span class="cut-lab">V1</span><div class="cut-lane">${CLIPS.map(([src, dur, w]) => `<span class="cut-clip" style="--cut-w:${w}"><img class="cut-shot" src="${x.img(src)}" alt=""/><b class="cut-clip-t">${x.esc(dur)}</b></span>`).join('')}</div></div>
        <div class="cut-row"><span class="cut-lab">VO</span><div class="cut-lane"><span class="cut-blk cut-vo" style="width:${VO_W}%"><i class="cut-wave">${wave(44, 11)}</i></span></div></div>
        <div class="cut-row"><span class="cut-lab">MUSIC</span><div class="cut-lane"><span class="cut-blk cut-mu" style="width:100%"><i class="cut-wave">${wave(88, 29)}</i></span></div></div>
        <i class="cut-play"><b class="cut-play-l"></b><b class="cut-play-h"></b></i>
      </div>
    </div>`);

    const clips = [...card.querySelectorAll('.cut-clip')];
    const vo = card.querySelector('.cut-vo');
    const mu = card.querySelector('.cut-mu');
    const play = card.querySelector('.cut-play');
    const tc = card.querySelector('.cut-tc');
    const chip = chipRow.firstElementChild;
    const spin = chip.firstElementChild;
    const chipT = chip.lastElementChild;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastTc = '';

    return {
      nodes: [say, card, chipRow],
      // the marks keep the window and then the export chip in view as they land
      marks: [[T.r, say], [T.card, card], [T.vo, card], [T.chipIn, chipRow]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the editor window rises in and settles
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each clip slides in from the right and snaps into its slot (outBack overshoots, then settles)
        clips.forEach((c, i) => {
          const p = seg(t, T.clip[i], T.clip[i] + SNAP);
          c.style.opacity = outCubic(p).toFixed(3);
          c.style.transform = p >= 1 ? 'none' : `translateX(${lerp(150, 0, outBack(p)).toFixed(2)}px)`;
        });

        // the voice and score tracks fill their lanes
        const blk = (n, a) => {
          const e = outCubic(seg(t, a, a + 0.42));
          n.style.opacity = e.toFixed(3);
          n.style.transform = e >= 1 ? 'none' : `scaleX(${lerp(0.88, 1, e).toFixed(4)})`;
        };
        blk(vo, T.vo);
        blk(mu, T.music);

        // the playhead: hidden until the cut is assembled, then sweeping every track as the timecode counts up
        const sweep = seg(t, T.play, T.play + SWEEP);
        play.style.opacity = (t >= T.play ? 1 : 0).toFixed(3);
        play.style.transform = `translateX(${(sweep * 100).toFixed(3)}%)`;
        const tcTxt = timecode(sweep * TOTAL);
        if (tcTxt !== lastTc) { tc.textContent = tcTxt; lastTc = tcTxt; }

        // the export chip: lands, spins, then resolves to the finished film
        const ei = outCubic(seg(t, T.chipIn, T.chipIn + 0.34));
        chipRow.style.opacity = ei.toFixed(3);
        chipRow.style.transform = ei >= 1 ? 'none' : `translateY(${((1 - ei) * 8).toFixed(2)}px)`;
        const done = t >= T.chipDone;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chipIn) * 450) % 360).toFixed(1)}deg)`;
        const lab = CHIP[done ? 1 : 0];
        if (chipT.textContent !== lab) chipT.textContent = lab;
      },
    };
  },
};