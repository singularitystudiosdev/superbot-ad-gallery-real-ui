// Split beat: superbot splits the storyboard between two video models at once. Its line streams, the "Rendering 4
// shots on 2 models" chip lands with both tiles on it, and the parallel queue card rises in: one sheet cut into two
// columns by a 1px divider, Veo 3 on the left and Kling on the right, each column with its own model tile, its own
// live "n of 2" count and its own two shot rows. Both columns render at the same moment at different speeds (Kling
// gets a slightly earlier start and a shorter render, Veo lands last), so the two progress bars move side by side
// and neither column waits on the other; each row is a 72x40 thumbnail resolving out of the dark under a single
// sweeping light band and then drifting in a slow t-driven ken-burns push, a thin bar filling and a percentage
// counting up until the shot lands, when the percentage swaps to a green check and "Done". Once both columns are
// done the merge row under them fills and resolves to the green check and "4 shots in, 30s of film": the two
// parallel queues became one film. The chip reads "4 shots rendered in parallel" as the last shot lands.
// Pure function of t: every moving value is written from t in render, so ?t= freezes any frame. No Date, no rAF,
// no CSS transitions or animations. The chip row reuses the shared .dd-chiprow / .ch-tool markup from chat.css,
// exactly as shots.js does.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Split the shots: Veo 3 and Kling render at the same time.';
// [what the chip says while both models work, what it says once the last shot lands]
const CHIP = ['Rendering 4 shots on 2 models', '4 shots rendered in parallel'];
// [what the merge row says while it assembles, what it says when the film is one file]
const MERGE = ['Merging 4 shots', 'Merged into the film'];
// [app, model name, start offset from the column headers, seconds one shot takes, gap inside the column, shots].
// Kling starts a touch earlier and renders each shot a little faster, so its column finishes first and Veo lands
// last; both run on the same clock, which is the whole point of the beat.
const COLS = [
  { app: 'veo', name: 'Veo 3', start: 0.10, dur: 1.28, stag: 0.14, shots: [
    ['future/still-42.jpg', 'Shot 01', 'Kid meets the machine'],
    ['future/still-152.jpg', 'Shot 02', 'Rooftop at dusk'],
  ] },
  { app: 'kling', name: 'Kling', start: 0.04, dur: 1.06, stag: 0.12, shots: [
    ['future/still-212.jpg', 'Shot 03', 'The bloom'],
    ['future/still-172.jpg', 'Shot 04', 'Garden and the moon'],
  ] },
];
const SHOT_N = COLS.reduce((n, c) => n + c.shots.length, 0);
const FILM_S = 30;    // seconds of film the four shots add up to (8 + 8 + 6 + 8), same total cut.js lays out

const SWEEP = 0.5;    // one band sweep across a thumbnail as it comes alive
const DRIFT = 1.2;    // seconds of ken-burns travel a row keeps moving for after its clip lands
const VID = '<svg class="split-vid" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="12.5" height="13" rx="2.6"/>'
  + '<path d="M15 10.4l5.5-2.9v9l-5.5-2.9z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.label = r + 0.26;                       // the "Rendering 4 shots on 2 models" chip lands
    T.card = r + 0.34;                        // the parallel queue card rises in
    T.head = T.card + 0.10;                   // both column headers land together (routed as one request)
    T.shot = COLS.map((c) => c.shots.map((_, i) => T.head + c.start + i * c.stag)); // each shot starts rendering
    T.shotDone = COLS.map((c, ci) => c.shots.map((_, i) => T.shot[ci][i] + c.dur)); // ...and lands here
    T.shots = Math.max(...T.shotDone.flat()); // both columns are done here (Veo, the slower one, last)
    T.chipOut = T.shots;                      // the chip turns to its rendered label the instant the last shot lands
    T.merge = T.shots + 0.10;                 // only now does the merge row start to fill
    T.mergeDur = 0.58;
    T.mergeDone = T.merge + T.mergeDur;
    T.end = T.mergeDone + 0.26;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    // the chip carries the tiles of the models this request was routed to (the par() step's k.apps), so it shows
    // the same two models the who-line above it names
    const apps = k.apps && k.apps.length ? k.apps : COLS.map((c) => c.app);
    const gen = x.el(`<div class="dd-chiprow split-genrow"><span class="ch-tool split-gen"><span class="split-gentiles">${apps.map((a) => x.tile(a)).join('')}</span><span class="ch-tool-t">${x.esc(CHIP[0])}</span></span></div>`);
    const card = x.el(`<div class="split-card">
      <div class="split-hd"><i class="split-ic">${VID}</i><b>Parallel render</b><span class="split-hd-l">0 of ${SHOT_N} done</span></div>
      <div class="split-cols">${COLS.map((c, ci) => `${ci ? '<i class="split-div" aria-hidden="true"></i>' : ''}<div class="split-col split-${c.app}">
        <div class="split-chd">${x.tile(c.app)}<b class="split-cname">${x.esc(c.name)}</b><span class="split-cnt">0 of ${c.shots.length}</span></div>
        <div class="split-rows">${c.shots.map(([src, no, name]) => `<div class="split-row">
          <span class="split-thumb"><img class="split-img" src="${x.img(src)}" alt="${x.esc(no + ', ' + name)}"/>
            <i class="split-band" aria-hidden="true"></i></span>
          <span class="split-txt"><span class="split-no">${x.esc(no)}</span><span class="split-name">${x.esc(name)}</span>
            <span class="split-prog"><span class="split-track"><i class="split-bar"></i></span>
              <span class="split-lab"><span class="split-pct">0%</span><span class="split-fin">${x.OK}<span class="split-fin-l">Done</span></span></span></span>
          </span>
        </div>`).join('')}</div>
      </div>`).join('')}</div>
      <div class="split-merge">
        <div class="split-mlrow"><b class="split-mlab">${x.esc(MERGE[0])}</b>
          <span class="split-mlout"><span class="split-mlpct">0%</span><span class="split-mlfin">${x.OK}<span class="split-mlfin-l">${SHOT_N} shots in, ${FILM_S}s of film</span></span></span></div>
        <span class="split-mltrack"><i class="split-mlbar"></i></span>
      </div>
    </div>`);

    // one ref set per column, so its rows render on their own clock while the other column runs beside it
    const cols = [...card.querySelectorAll('.split-col')].map((node, ci) => {
      const c = COLS[ci];
      return {
        node, c,
        cnt: node.querySelector('.split-cnt'),
        rows: [...node.querySelectorAll('.split-row')].map((row) => ({
          img: row.querySelector('.split-img'), band: row.querySelector('.split-band'),
          track: row.querySelector('.split-track'), bar: row.querySelector('.split-bar'),
          pct: row.querySelector('.split-pct'), fin: row.querySelector('.split-fin'),
        })),
        lastCnt: '', lastPct: c.shots.map(() => ''),
      };
    });
    const headL = card.querySelector('.split-hd-l');
    const genT = gen.querySelector('.ch-tool-t');
    const mlab = card.querySelector('.split-mlab');
    const mtrack = card.querySelector('.split-mltrack');
    const mbar = card.querySelector('.split-mlbar');
    const mpct = card.querySelector('.split-mlpct');
    const mfin = card.querySelector('.split-mlfin');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, genLab = '', lastDone = '', lastMp = '', lastMl = '';

    return {
      nodes: [say, gen, card],
      marks: [[T.r, say], [T.label, gen], [T.card, card], [T.shots, card], [T.merge, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: both model tiles side by side, landing with the ask and staying until the last shot lands,
        // when its label turns to the parallel-render line
        const li = outCubic(seg(t, T.label, T.label + 0.3));
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        const gl = t >= T.chipOut ? CHIP[1] : CHIP[0];
        if (gl !== genLab) { genLab = gl; genT.textContent = gl; }

        // the queue card rises in as one sheet
        const ci2 = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci2.toFixed(3);
        card.style.transform = ci2 >= 1 ? 'none' : `translateY(${((1 - ci2) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci2).toFixed(4)})`;

        let doneAll = 0;
        cols.forEach((col, ci) => {
          // both column headers drop in on the same frame: the two requests were routed together
          const hp = outCubic(seg(t, T.head, T.head + 0.3));
          const chd = col.node.firstElementChild;
          chd.style.opacity = hp.toFixed(3);
          chd.style.transform = hp >= 1 ? 'none' : `translateY(${((1 - hp) * 4).toFixed(2)}px)`;

          let done = 0;
          col.rows.forEach((r, i) => {
            const a = T.shot[ci][i], b = T.shotDone[ci][i];
            const p = seg(t, a, b), e = outCubic(p);
            const landed = t >= b;
            if (landed) done++;

            // the thumbnail: dark, blurred and desaturated while it renders, alive the moment it lands
            r.img.style.filter = e >= 1 ? 'none'
              : `brightness(${lerp(0.4, 1, e).toFixed(3)}) saturate(${lerp(0.3, 1, e).toFixed(3)}) blur(${((1 - e) * 6).toFixed(2)}px)`;
            r.img.style.opacity = lerp(0.4, 1, e).toFixed(3);
            // ken burns: a slow push that keeps travelling after the clip lands, so a rendered row reads as moving
            const kb = seg(t, a, a + col.c.dur + DRIFT);
            const dir = i % 2 ? -1 : 1;
            r.img.style.transform = `translate(${(lerp(-2.2, 2.2, kb) * dir).toFixed(2)}px, ${lerp(1, -1, kb).toFixed(2)}px) scale(${lerp(1.03, 1.1, kb).toFixed(4)})`;

            // the light band that sweeps the thumbnail once, while it resolves
            const bp = seg(t, a, a + SWEEP);
            r.band.style.transform = `translateX(${lerp(-115, 115, bp).toFixed(1)}%)`;
            r.band.style.opacity = (bp >= 1 ? 0 : 1 - seg(bp, 0.72, 1)).toFixed(3);

            // the bar fills and the percentage counts up; the instant the shot lands the percentage swaps to a check
            const pc = Math.min(99, Math.floor(p * 100)) + '%';
            if (col.lastPct[i] !== pc) { r.pct.textContent = pc; col.lastPct[i] = pc; }
            r.bar.style.width = (p * 100).toFixed(1) + '%';
            r.track.classList.toggle('split-on', landed);
            const fo = outCubic(seg(t, b, b + 0.26));
            r.pct.style.opacity = (1 - fo).toFixed(3);
            r.fin.style.opacity = fo.toFixed(3);
            r.fin.style.transform = `translateY(${((1 - fo) * 3).toFixed(2)}px)`;
          });
          doneAll += done;

          // this column's own count, so the two queues read as independent live jobs, and it turns green the
          // moment that column finishes, which is a different moment for each one
          const cl = `${done} of ${col.c.shots.length}`;
          if (col.lastCnt !== cl) { col.cnt.textContent = cl; col.lastCnt = cl; }
          col.node.classList.toggle('split-live', done === col.c.shots.length);
        });

        const dl = `${doneAll} of ${SHOT_N} done`;
        if (lastDone !== dl) { headL.textContent = dl; lastDone = dl; }

        // the merge row: quiet while the two columns work, then filling once they are both done, and resolving to
        // the green check and the length of film the four shots make
        const mf = outCubic(seg(t, T.merge, T.mergeDone));
        const mdone = t >= T.mergeDone;
        const mp = mdone ? '100%' : (t >= T.merge ? Math.min(99, Math.floor(seg(t, T.merge, T.mergeDone) * 100)) + '%' : '0%');
        if (lastMp !== mp) { mpct.textContent = mp; lastMp = mp; }
        mbar.style.width = (mf * 100).toFixed(1) + '%';
        mtrack.classList.toggle('split-on', mdone);
        const mfo = outCubic(seg(t, T.mergeDone, T.mergeDone + 0.3));
        mpct.style.opacity = (1 - mfo).toFixed(3);
        mfin.style.opacity = mfo.toFixed(3);
        mfin.style.transform = `translateY(${((1 - mfo) * 3).toFixed(2)}px)`;
        const ml = MERGE[mdone ? 1 : 0];
        if (lastMl !== ml) { lastMl = ml; mlab.textContent = ml; }
      },
    };
  },
};