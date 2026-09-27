// Sound beat (step 5 of the Inkwave spot, chat.js together(['eleven', 'suno'], sound, { markRows: true })): one
// request, two models, so the reply is one board with two lanes side by side and each lane runs on its own clock.
// The reply header above already signs both models; this beat draws what they did in parallel.
//
// LEFT, ElevenLabs Sound Effects (eleven_text_to_sound_v2): nine named effects. Each row lands, its own waveform
// records in left to right under the playhead, the row stamps its check when the take is in, and the lane's bar fills
// as the list grows. RIGHT, Suno v6: it composes "Turf War (Kraken Pier)" from the style tags, writes the sections
// ([intro] [verse] [chorus] [drop] [outro]) in turn, unveils the track's spectrogram left to right, and its four stem
// meters rise band by band. Each lane recolours green and resolves its spinner when it lands, and the two tool chips
// leave as their own lane finishes. Whichever lane lands last is when the ask is done.
//
// Every waveform here is measured, never drawn: img/ink/sound/audio-data.js holds peaks and band RMS taken off this
// spot's own source audio (ffmpeg; see that file's header and img/ink/sound/CREDITS.txt), so a row's envelope is the
// real envelope of the clip its duration names, and the stems are real bands of the track.
//
// Pure function of t: every moving value is written from t, so ?t= freezes any frame. Values are only written to the
// DOM when the frame's number differs, so a still frame costs almost nothing and a seek backwards still repaints.
import { lerp, seg, outCubic, inOutCubic, outBack, streamCount } from '../../../lib.js';
import { SFX_BARS, STEM_BARS } from '../../../img/ink/sound/audio-data.js?v=1';

const SAY = 'Nine splat effects and the Turf War theme, at once.';
const TRACK = 'Turf War (Kraken Pier)';
const SUNO_LOGO = 'ink/sound/suno.svg';                  // img/ink/sound/CREDITS.txt
const SPECTROGRAM = 'ink/sound/turf-war-spectrogram.webp';
const TAGS = ['J-pop', 'surf rock', '174 BPM'];
const SECTIONS = ['intro', 'verse', 'chorus', 'drop', 'outro'];
// [name, duration, clip seconds]: the nine effects, in the order the rows land, and the real slice length each row's
// waveform was measured over (the duration it shows). SFX_BARS[i] is row i's envelope, in this order.
const SFX = [
  ['Ink splat', '0:01', 1.0],
  ['Squid swim', '0:03', 3.4],
  ['Splat bomb', '0:02', 1.6],
  ['Charger shot', '0:01', 1.2],
  ['Super jump', '0:03', 2.6],
  ['Ready? GO! (announcer)', '0:01', 1.4],
  ['1 minute left!', '0:03', 3.0],
  ['Victory jingle', '0:04', 4.4],
  ['Splatted', '0:02', 1.8],
];
// [stem label, key in STEM_BARS]: the four bands the composer laid down, low to high
const STEMS = [['bass', 'bass'], ['guitar', 'guitar'], ['vocal', 'vocal'], ['cymbals', 'air']];
const BARS = 28;        // bars per effect waveform
const SN = 48;          // bars per stem meter (STEM_BARS' own width)
const STAG = 0.26;      // gap between one effect row landing and the next
const STEM_STAG = 0.44; // gap between one stem starting to rise and the next
const STEM_RISE = 0.55; // how long one stem takes to rise, left to right
const SPEC_ARC = 2.14;  // how long the spectrogram takes to unveil under its playhead
const ROW_LEAD = 0.3;   // the feed's glide is 0.8s long (chat.js renderScroll), so a mark set exactly on a row would
                        // still be short when that row finished appearing; leading it by 0.3s puts the row in place
                        // before it has fully landed. Same mark the stub shipped, per row.
const PLAY = '<svg class="sn-play-i" viewBox="0 0 24 24"><path d="M8.5 5.5 18 12l-9.5 6.5Z"/></svg>';

// write a style value only when this frame's number differs from the last one written, so a frozen ?t= frame costs a
// handful of comparisons instead of a repaint, and a seek backwards still repaints (a "furthest so far" mark would not)
const w = (n, prop, v) => { if (n['_w' + prop] !== v) { n['_w' + prop] = v; n.style[prop] = v; } };
const setOn = (n, on) => { if (n.classList.contains('on') !== on) n.classList.toggle('on', on); };
const setDone = (n, done) => { if (n.classList.contains('sn-done') !== done) n.classList.toggle('sn-done', done); };
const sfxH = (v) => 4 + 14 * v;                    // an effect bar's resting height, 4..18px in the 18px wave box

const rowMarks = (opts, T, rows) =>
  (opts && opts.markRows ? T.row.map((a, i) => [a - ROW_LEAD, rows[i]]) : [[T.row[0], rows[0]]]);

export default {
  times(r, opts = {}) {
    const T = { r };
    T.chip = [r + 0.24, r + 0.34];                     // the two tool chips land, one per model
    T.lanes = r + 0.40;                                // both lanes rise together: the step is one parallel run
    // LEFT: nine takes, one after another down the list, each recording in for as long as its clip is
    T.row = SFX.map((_, i) => T.lanes + 0.30 + i * STAG);
    T.rec = SFX.map(([, , secs], i) => T.row[i] + 0.30 + 0.05 * secs);
    T.ok = T.rec.map((a) => a + 0.05);                 // ...and stamps its check
    T.el = T.ok[T.ok.length - 1] + 0.12;               // the effects lane is done
    // RIGHT: the track can be written faster than the effects render, but it is shown composing across the same run
    T.tag = TAGS.map((_, i) => T.lanes + 0.14 + i * 0.1);
    T.spec = [T.lanes + 0.20, T.lanes + SPEC_ARC];     // the spectrogram unveils under its playhead
    T.mk = SECTIONS.map((_, i) => T.lanes + 0.24 + i * 0.46);
    T.stem = STEMS.map((_, i) => T.lanes + 0.30 + i * STEM_STAG);
    T.suno = T.stem[T.stem.length - 1] + STEM_RISE + 0.12;
    T.done = Math.max(T.el, T.suno);                   // the ask is done when the slower lane lands
    T.end = T.done + 0.95;                             // the finished board holds, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    // Suno's own mark (img/ink/sound/suno.svg) in the lane and its chip: chat.js APPS.suno.logo is still null, so the
    // routing chip and the reply header draw the app initial, and the beat carries the real logo where it can.
    const sunoTile = `<span class="qc-tile qc-t-suno"><img src="${x.img(SUNO_LOGO)}" alt=""/></span>`;
    const chips = x.el(`<div class="dd-chiprow sn-chiprow">
      <span class="ch-tool sn-chip">${x.tile('eleven')}<span class="ch-tool-t">Generating 9 sound effects</span></span>
      <span class="ch-tool sn-chip">${sunoTile}<span class="ch-tool-t">Composing ${x.esc(TRACK)}</span></span>
    </div>`);
    const rowsHtml = SFX.map(([name, dur], i) => `<div class="sn-row">
      <span class="sn-play">${PLAY}</span>
      <span class="sn-name">${x.esc(name)}</span>
      <span class="sn-d">${x.esc(dur)}</span>
      <span class="sn-wave" aria-hidden="true"><i class="sn-head"></i>${SFX_BARS[i].map((v) => `<i class="sn-b" style="height:${sfxH(v).toFixed(1)}px"></i>`).join('')}</span>
      <span class="sn-tick">${x.OK}</span>
    </div>`).join('');
    const stemsHtml = STEMS.map(([name, band]) => `<div class="sn-stem"><b>${x.esc(name)}</b><span class="sn-sb" aria-hidden="true">${STEM_BARS[band].map(() => '<i class="sn-sbb"></i>').join('')}</span></div>`).join('');
    const lanes = x.el(`<div class="sn-lanes">
      <div class="sn-lane sn-l-el">
        <div class="sn-hd">${x.tile('eleven')}<b>ElevenLabs</b><span class="sn-model sn-m-el">SFX v2</span><span class="sn-st"><span class="spin"></span></span></div>
        <span class="sn-sub">9 clips, 1 to 4 s</span>
        <div class="sn-bar"><i></i></div>
        <div class="sn-list">${rowsHtml}</div>
      </div>
      <div class="sn-lane sn-l-suno">
        <div class="sn-hd">${sunoTile}<b>Suno</b><span class="sn-model sn-m-suno">v6</span><span class="sn-st"><span class="spin"></span></span></div>
        <div class="sn-title">${x.esc(TRACK)}</div>
        <div class="sn-tags">${TAGS.map((tg) => `<span class="sn-tag">${x.esc(tg)}</span>`).join('')}</div>
        <div class="sn-spec"><img class="sn-spec-img" src="${x.img(SPECTROGRAM)}" alt=""/><i class="sn-spec-head"></i></div>
        <div class="sn-mks">${SECTIONS.map((s) => `<span class="sn-mk"><i></i><b>[${x.esc(s)}]</b></span>`).join('')}</div>
        <div class="sn-stems">${stemsHtml}</div>
        <div class="sn-foot"><div class="sn-bar"><i></i></div><span class="sn-len">3:00</span></div>
      </div>
    </div>`);

    const chips2 = [...chips.children].map((n, i) => ({ n, done: [T.el, T.suno][i] }));
    const lanes2 = [...lanes.children];
    const lLane = lanes2[0], sLane = lanes2[1];
    const lBar = lLane.querySelector('.sn-bar i'), sBar = sLane.querySelector('.sn-bar i');
    const spinners = [lLane.querySelector('.sn-st .spin'), sLane.querySelector('.sn-st .spin')];
    const rows = [...lLane.querySelectorAll('.sn-row')];
    const bars = rows.map((row) => [...row.querySelectorAll('.sn-b')]);
    const heads = rows.map((row) => row.querySelector('.sn-head'));
    const plays = rows.map((row) => row.querySelector('.sn-play'));
    const ticks = rows.map((row) => row.querySelector('.sn-tick'));
    const tags = [...sLane.querySelectorAll('.sn-tag')];
    const specImg = sLane.querySelector('.sn-spec-img'), specHead = sLane.querySelector('.sn-spec-head');
    const mks = [...sLane.querySelectorAll('.sn-mk')];
    const stems = [...sLane.querySelectorAll('.sn-stem')];
    const sBars = stems.map((st) => [...st.querySelectorAll('.sn-sbb')]);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const was = rows.map(() => new Array(BARS).fill(-1));   // last value written per effect bar
    const hWas = stems.map(() => new Array(SN).fill(-1));   // ...and per stem bar

    return {
      nodes: [say, chips, lanes],
      marks: [[T.r, say], [T.chip[0], chips], [T.lanes, lanes], ...rowMarks(k.opts, T, rows)],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the two tool chips: they land with the ask and each one leaves as its own lane lands. The row itself carries
        // the pair (chat.css .dd-chiprow sits at opacity 0 until a beat writes it), so it holds while either chip does.
        let chipUp = 0;
        chips2.forEach(({ n: c, done }, i) => {
          const li = outCubic(seg(t, T.chip[i], T.chip[i] + 0.3));
          const gone = seg(t, done - 0.12, done + 0.24);
          const o = li * (1 - gone);
          if (o > chipUp) chipUp = o;
          w(c, 'opacity', o.toFixed(3));
          w(c, 'transform', `translateY(${((1 - li) * 6).toFixed(2)}px)`);
        });
        w(chips, 'opacity', chipUp.toFixed(3));

        // the board rises in as one sheet, the two lanes already side by side
        const ci = outCubic(seg(t, T.lanes, T.lanes + 0.45));
        w(lanes, 'opacity', ci.toFixed(3));
        w(lanes, 'transform', ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`);

        // ---- LEFT lane: nine takes ---------------------------------------------------------------------------------
        setDone(lLane, t >= T.el);
        w(lBar, 'transform', `scaleX(${seg(t, T.lanes, T.el).toFixed(4)})`);
        spinners[0].classList.toggle('done', t >= T.el);
        w(spinners[0], 'transform', t >= T.el ? '' : `rotate(${(((t - T.lanes) * 430) % 360).toFixed(1)}deg)`);
        rows.forEach((row, i) => {
          const a = T.row[i];
          const p = outCubic(seg(t, a, a + 0.3));
          w(row, 'opacity', p.toFixed(3));
          w(row, 'transform', p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`);

          // the waveform records in left to right: bar j fills once the playhead has swept past it
          const rec = seg(t, a, T.rec[i]);
          bars[i].forEach((b, j) => {
            const pw = (j / (BARS - 1)) * 0.92;
            const v = outCubic(seg(rec, pw, pw + 0.06));
            if (v === was[i][j]) return;
            was[i][j] = v;
            w(b, 'opacity', lerp(0.16, 1, v).toFixed(3));
            w(b, 'transform', `scaleY(${lerp(0.2, 1, v).toFixed(3)})`);
          });
          w(heads[i], 'transform', `translateX(${lerp(0, 100, rec).toFixed(2)}%)`);
          w(heads[i], 'opacity', (1 - seg(t, T.rec[i] - 0.05, T.rec[i] + 0.07)).toFixed(3));

          // the take is in: the row stamps its check and its play glyph comes up to full
          const cp = seg(t, T.ok[i], T.ok[i] + 0.24);
          w(ticks[i], 'opacity', outCubic(seg(t, T.ok[i], T.ok[i] + 0.14)).toFixed(3));
          w(ticks[i], 'transform', `scale(${lerp(0.35, 1, outBack(cp)).toFixed(3)})`);
          w(plays[i], 'opacity', lerp(0.5, 1, outCubic(cp)).toFixed(3));
        });

        // ---- RIGHT lane: the track ---------------------------------------------------------------------------------
        setDone(sLane, t >= T.suno);
        w(sBar, 'transform', `scaleX(${seg(t, T.lanes, T.suno).toFixed(4)})`);
        spinners[1].classList.toggle('done', t >= T.suno);
        w(spinners[1], 'transform', t >= T.suno ? '' : `rotate(${(((t - T.lanes) * 430) % 360).toFixed(1)}deg)`);
        tags.forEach((tg, i) => {
          const p = outCubic(seg(t, T.tag[i], T.tag[i] + 0.22));
          w(tg, 'opacity', p.toFixed(3));
          w(tg, 'transform', p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`);
        });

        // the spectrogram of the track unveils left to right under the playhead, which then drops away
        const rv = inOutCubic(seg(t, T.spec[0], T.spec[1]));
        w(specImg, 'clipPath', `inset(0 ${((1 - rv) * 100).toFixed(2)}% 0 0)`);
        w(specHead, 'left', `${(rv * 100).toFixed(2)}%`);
        w(specHead, 'opacity', (1 - seg(t, T.spec[1] - 0.06, T.spec[1] + 0.12)).toFixed(3));

        // each section marker lights as the composer writes past it
        mks.forEach((m, i) => {
          setOn(m, t >= T.mk[i]);
          const p = outCubic(seg(t, T.mk[i], T.mk[i] + 0.24));
          w(m.firstElementChild, 'transform', `scaleX(${lerp(0.25, 1, p).toFixed(3)})`);
          w(m.lastElementChild, 'opacity', lerp(0.45, 1, p).toFixed(3));
        });

        // the four stems rise, bar by bar, each band at its own real level
        stems.forEach((st, j) => {
          setOn(st, t >= T.stem[j] + STEM_RISE);
          const data = STEM_BARS[STEMS[j][1]];
          sBars[j].forEach((b, k) => {
            const a = T.stem[j] + (k / (SN - 1)) * 0.26;
            const v = outCubic(seg(t, a, a + 0.16));
            const h = Math.round((1 + 13 * v * data[k]) * 2) / 2;
            if (h === hWas[j][k]) return;
            hWas[j][k] = h;
            w(b, 'height', h.toFixed(1) + 'px');
            w(b, 'opacity', lerp(0.25, 1, v).toFixed(2));
          });
        });
      },
    };
  },
};