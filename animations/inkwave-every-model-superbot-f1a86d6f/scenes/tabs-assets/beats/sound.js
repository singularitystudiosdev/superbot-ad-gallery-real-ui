// Sound beat: one request forked to TWO models at once (chat.js's together(['eleven','suno'], sound)). ElevenLabs takes
// the left lane and records the spot's six sound effects as pads, each pad's waveform recording in left to right under
// its own playhead and each stamping its check as its take lands; Suno takes the right lane and cuts "Tidewater Riot",
// its cover art a real frame from the post, its master waveform and its four stems recording in as they render.
//
// EVERY bar height in this beat is a real peak of the POST'S OWN AUDIO (img/ink/sound/peaks.json: per-bin peak |sample|
// of post720.mp4's AAC track at the source spans that really hold each sound, with the stems band-split from the post's
// own music bed). Nothing here is a hash, a sine or a drawn shape: see img/ink/sound/CREDITS.txt for the spans and for
// what is on screen and in the audio at each one. The arrays are fetched once, at import; the bars a frame draws before
// the fetch lands are flat at the floor, never invented peaks.
//
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Forked the sound: six effects on ElevenLabs, the match track on Suno, same time.';
const PEAK_URL = new URL('../../../img/ink/sound/peaks.json', import.meta.url).href;

// the six effects ElevenLabs records, in the order the pads land: [label, span key in peaks.json, duration]
const PADS = [
  ['wet ink splat', 'splat', '0:02'],
  ['squid swim through ink', 'swim', '0:04'],
  ['super jump whoosh', 'jump', '0:03'],
  ['splattershot burst', 'burst', '0:02'],
  ["announcer: TIME'S UP!", 'timeup', '0:03'],
  ['crowd cheer, lime wins', 'cheer', '0:05'],
];
// the track's parts, in the order they render in: the four stems Suno separates, then the mixdown (the full-band bed)
// [label, duration, peak key]: the peak key names what peaks.json holds for that row
const STEMS = [['drums', '0:04'], ['bass', '0:04'], ['synth', '0:06'], ['vocal chops', '0:05'], ['air', '0:03'], ['mixdown', '2:47', 'bed']];
const TRACK = { title: 'Tidewater Riot', meta: 'upbeat turf war, J-pop punk, 172 bpm', dur: '2:47' };

const BARS = 42;      // bars per pad waveform
const SBARS = 34;     // bars per stem waveform
const MBARS = 96;     // bars in the track's master waveform: it spans the whole lane, so it needs twice the pads' count
const ROW_LEAD = 0.32;// a pad's scroll mark leads it by this much: the feed's glide is 0.45s long, so a mark set exactly
                      // on the row would still be short when the row landed and the pad would sit under the composer
const REC = 0.56;     // seconds a pad's waveform takes to record in, left to right
const STAGGER = 0.5;  // gap between one pad landing and the next
const S_REC = 0.6;    // seconds a stem's waveform takes to record in
const S_STAGGER = 0.3;
const FLOOR = 0.03;   // the flat bar a frame draws before the peaks land
const PLAY = '<svg class="sl-play-i" viewBox="0 0 24 24"><path d="M8.5 5.5 18 12l-9.5 6.5Z"/></svg>';
const NOTE = '<svg class="sl-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';

// the real peaks, fetched once. spans[key] = { src:[t0,t1], peaks:[48] }, stems[name] = [40]. Until the fetch lands
// every lookup is the floor, so a frame rendered mid-load shows a flat line rather than a made-up waveform.
const P = { spans: {}, stems: {} };
fetch(PEAK_URL).then((r) => r.json()).then((j) => { Object.assign(P.spans, j.spans); Object.assign(P.stems, j.stems); }).catch(() => {});

// peak k of n for a pad: the post's own peak at that point of its span, scaled into a bar height
function padPeak(key, j, n) {
  const a = P.spans[key] && P.spans[key].peaks;
  if (!a) return FLOOR;
  return Math.max(FLOOR, a[Math.min(a.length - 1, Math.floor((j / n) * a.length))]);
}
function stemPeak(name, j, n) {
  const a = P.stems[name] || (P.spans[name] && P.spans[name].peaks);   // a band array, or a whole span for the mixdown
  if (!a) return FLOOR;
  return Math.max(FLOOR, a[Math.min(a.length - 1, Math.floor((j / n) * a.length))]);
}
const barH = (v) => (3 + 15 * v).toFixed(1);

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.34;                                         // the two lanes fork in
    T.pad = PADS.map((_, i) => r + 0.52 + i * STAGGER);        // each SFX pad lands
    T.padRec = T.pad.map((a) => a + REC);                      // ...and its waveform records in
    T.padOk = T.padRec.map((a) => a + 0.06);                   // ...and its take stamps its check
    T.stem = STEMS.map((_, i) => r + 0.72 + i * S_STAGGER);     // each stem renders in
    T.stemRec = T.stem.map((a) => a + S_REC);
    T.stemOk = T.stemRec.map((a) => a + 0.06);
    T.end = Math.max(T.padOk[T.padOk.length - 1], T.stemOk[T.stemOk.length - 1]) + 0.34;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    // LEFT lane: ElevenLabs' six effects, each a pad with the effect's name, its real waveform and the check
    const padHtml = PADS.map(([label, , dur]) => `<div class="sl-pad">
        <span class="sl-play">${PLAY}</span>
        <span class="sl-lab">${x.esc(label)}</span>
        <span class="sl-d">${x.esc(dur)}</span>
        <span class="sl-tick">${x.OK}</span>
        <span class="sl-wave" aria-hidden="true"><i class="sl-head"></i>${Array.from({ length: BARS }, () => '<i class="sl-bar sl-bar-f"></i>').join('')}</span>
      </div>`).join('');
    const laneEl = x.el(`<div class="sl-lanes">
      <div class="sl-lane sl-lane-fx">
        <div class="sl-hd">${x.tile('eleven')}<b>ElevenLabs</b><small>sound effects</small></div>
        <div class="sl-sub">Six effects for the turf war</div>
        <div class="sl-pads">${padHtml}</div>
      </div>
      <div class="sl-lane sl-lane-track">
        <div class="sl-hd">${x.tile('suno')}<b>Suno v5</b><small>music</small></div>
        <div class="sl-card">
          <img class="sl-cover" src="${x.img('ink/sound/cover.jpg')}" alt=""/>
          <div class="sl-card-txt"><b class="sl-title">${x.esc(TRACK.title)}</b><span class="sl-meta">${x.esc(TRACK.meta)}</span></div>
          <span class="sl-d">${x.esc(TRACK.dur)}</span>
        </div>
        <div class="sl-wave sl-wave-master" aria-hidden="true"><i class="sl-head"></i>${Array.from({ length: MBARS }, (_, j) => `<i class="sl-bar sl-bar-m" style="height:${barH(padPeak('bed', j, MBARS))}px"></i>`).join('')}</div>
        <div class="sl-stems">
          <div class="sl-stem-hd">${NOTE}<span>Stems</span></div>
          ${STEMS.map(([name, dur, key]) => `<div class="sl-stem">
            <span class="sl-lab">${x.esc(name)}</span>
            <span class="sl-wave" aria-hidden="true"><i class="sl-head"></i>${Array.from({ length: SBARS }, (_, j) => `<i class="sl-bar sl-bar-g" style="height:${barH(stemPeak(key || name, j, SBARS))}px"></i>`).join('')}</span>
            <span class="sl-d">${x.esc(dur)}</span>
            <span class="sl-tick">${x.OK}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`);

    const pads = [...laneEl.querySelectorAll('.sl-pad')];
    const padWaves = pads.map((n) => ({ bars: [...n.querySelectorAll('.sl-bar')], head: n.querySelector('.sl-head'), tick: n.querySelector('.sl-tick'), play: n.querySelector('.sl-play') }));
    const stems = [...laneEl.querySelectorAll('.sl-stem')];
    const stemWaves = stems.map((n) => ({ bars: [...n.querySelectorAll('.sl-bar')], head: n.querySelector('.sl-head'), tick: n.querySelector('.sl-tick') }));
    const mw = laneEl.querySelector('.sl-wave-master');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const wasPad = padWaves.map(() => new Array(BARS).fill(-1));
    const wasStem = stemWaves.map(() => new Array(SBARS).fill(-1));
    const wasM = new Array(MBARS).fill(-1);
    const mwBars = [...mw.querySelectorAll('.sl-bar')];

    return {
      nodes: [say, laneEl],
      marks: [[T.r, say], [T.card, laneEl], ...pads.map((n, i) => [T.pad[i] - ROW_LEAD, n])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the two lanes fork in as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        laneEl.style.opacity = ci.toFixed(3);
        laneEl.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // LEFT: each pad lands, its waveform records in, then its take stamps its check
        pads.forEach((row, i) => {
          const a = T.pad[i];
          const p = outCubic(seg(t, a, a + 0.34));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 7).toFixed(2)}px)`;
          const rec = seg(t, a, T.padRec[i]);
          const wv = padWaves[i];
          wv.bars.forEach((b, j) => {
            const w = (j / (BARS - 1)) * 0.92;
            const v = outCubic(seg(rec, w, w + 0.06));
            if (v === wasPad[i][j]) return;
            wasPad[i][j] = v;
            b.style.height = barH(padPeak(PADS[i][1], j, BARS)) + 'px';
            b.style.opacity = lerp(0.16, 1, v).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.18, 1, v).toFixed(3)})`;
          });
          wv.head.style.transform = `translateX(${lerp(0, 100, rec).toFixed(2)}%)`;
          wv.head.style.opacity = (1 - seg(t, T.padRec[i] - 0.05, T.padRec[i] + 0.07)).toFixed(3);
          const cp = seg(t, T.padOk[i], T.padOk[i] + 0.24);
          wv.tick.style.opacity = outCubic(seg(t, T.padOk[i], T.padOk[i] + 0.14)).toFixed(3);
          wv.tick.style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
          wv.play.style.opacity = lerp(0.5, 1, outCubic(cp)).toFixed(3);
        });

        // RIGHT: the master waveform records in with the track, then each stem records in under its own playhead
        const mrec = seg(t, T.stem[0], T.stem[0] + 0.5);
        mw.style.opacity = outCubic(seg(t, T.card + 0.2, T.card + 0.55)).toFixed(3);
        mw.style.transform = `scaleX(${lerp(0.02, 1, mrec).toFixed(4)})`;
        // the master's bars are written from the post's own bed peaks here, in render, not once at build: the peaks
        // arrive from peaks.json after the module is mounted, so a height baked in at build would be the floor forever
        // (that is what made the master read as a flat stub). Written only when the value changes, like every other bar.
        mwBars.forEach((b, j) => {
          const v = padPeak('bed', j, MBARS);
          if (v === wasM[j]) return;
          wasM[j] = v;
          b.style.height = barH(v) + 'px';
        });
        stems.forEach((row, i) => {
          const a = T.stem[i];
          const p = outCubic(seg(t, a, a + 0.3));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          const rec = seg(t, a, T.stemRec[i]);
          const wv = stemWaves[i];
          wv.bars.forEach((b, j) => {
            const w = (j / (SBARS - 1)) * 0.92;
            const v = outCubic(seg(rec, w, w + 0.06));
            if (v === wasStem[i][j]) return;
            wasStem[i][j] = v;
            b.style.height = barH(stemPeak(STEMS[i][2] || STEMS[i][0], j, SBARS)) + 'px';
            b.style.opacity = lerp(0.16, 1, v).toFixed(3);
            b.style.transform = `scaleY(${lerp(0.18, 1, v).toFixed(3)})`;
          });
          wv.head.style.transform = `translateX(${lerp(0, 100, rec).toFixed(2)}%)`;
          wv.head.style.opacity = (1 - seg(t, T.stemRec[i] - 0.05, T.stemRec[i] + 0.07)).toFixed(3);
          const cp = seg(t, T.stemOk[i], T.stemOk[i] + 0.24);
          wv.tick.style.opacity = outCubic(seg(t, T.stemOk[i], T.stemOk[i] + 0.14)).toFixed(3);
          wv.tick.style.transform = `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`;
        });

        // a lane whose last take is in reads as done
        laneEl.querySelector('.sl-lane-fx').classList.toggle('sl-done', t >= T.padOk[PADS.length - 1]);
        laneEl.querySelector('.sl-lane-track').classList.toggle('sl-done', t >= T.stemOk[STEMS.length - 1]);
      },
    };
  },
};