// ElevenLabs — the audio. Its job: pull the voice out of the reel's room noise and cut it into takes you can
// put on a chip. The two waveforms are the real thing (assets/waveform.js is measured from bark-clean.wav and
// reel-noisy.wav), so the "before" really is louder than the "after" everywhere the dog is not barking.
import { seg, outCubic, lerp, streamCount, outBack, press } from '../../../lib.js';
import { SPECTRUM } from '../../../assets/waveform.js';

const SAY = 'Isolated the bark: 12 clean takes, 0.9s each, the room gone.';
const ROWS = [
  ['Separating his voice from the reel', 'Separated voice from room · 24s dive'],
  ['Trimming the barks', 'Trimmed 12 takes · 0.9s avg'],
];

export default {
  times(r) {
    const T = { r };
    T.rows = [r + 0.1, r + 0.62];
    T.rowsDone = [r + 0.72, r + 1.5];
    T.btn = r + 1.0;
    T.out = r + 1.2;
    T.clean = [r + 1.1, r + 2.0];
    T.clips = r + 1.85;
    T.ready = r + 2.35;
    T.end = r + 2.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));

    const v = x.pane.el('el');
    const inCard = v.querySelector('#el-in');
    const inBars = [...inCard.querySelectorAll('rect')];
    const outCard = v.querySelector('#el-out');
    const outBars = [...outCard.querySelectorAll('rect')];
    const btn = x.pane.q('el', '#el-go');
    const clips = [...x.pane.q('el', '#el-clips').children];
    const steps = [...x.pane.q('el', '#el-steps').children];
    const ready = x.pane.q('el', '#el-ready');
    const specHost = x.pane.q('el', '#el-spec-bars');
    specHost.innerHTML = SPECTRUM.map(() => '<i></i>').join('');
    const specBars = [...specHost.children];
    const outTan = x.pane.q('el', '#el-out-tan');
    const inp = inBars.map((b) => parseFloat(b.getAttribute('height')));
    const outp = outBars.map((b) => parseFloat(b.getAttribute('height')));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.rows[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.rows[i], T.rows[i] + 0.32), 8);
          const done = t >= T.rowsDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.rows[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? ROWS[i][1] : ROWS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // pane: the isolate button presses, the noisy waveform settles down onto the clean one, output card lands
        const pr = press(t, T.btn);
        btn.style.transform = `scale(${(1 - 0.045 * pr).toFixed(4)})`;
        btn.textContent = t < T.btn ? 'Isolate voice' : 'Isolating…';
        if (t >= T.out) btn.textContent = 'Isolated';
        const cp = outCubic(seg(t, T.clean[0], T.clean[1]));
        inBars.forEach((b, i) => { b.setAttribute('height', lerp(inp[i], Math.min(inp[i], outp[i] * 1.25 + 2), cp).toFixed(2)); });
        inBars.forEach((b, i) => { const h = parseFloat(b.getAttribute('height')); b.setAttribute('y', ((96 - h) / 2).toFixed(2)); });
        inCard.style.opacity = (1 - 0.55 * cp).toFixed(3);
        const oc = outCubic(seg(t, T.out, T.out + 0.4));
        outCard.parentElement.style.opacity = oc.toFixed(3);
        outCard.parentElement.style.transform = oc >= 1 ? '' : `translateY(${((1 - oc) * 12).toFixed(2)}px)`;
        outTan.textContent = cp < 1 ? 'isolating…' : 'clean · −38 dB noise';
        clips.forEach((c, i) => {
          const p = outCubic(seg(t, T.clips + i * 0.09, T.clips + i * 0.09 + 0.4));
          c.style.opacity = p.toFixed(3);
          c.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
        });
        steps.forEach((s, i) => {
          const d = t >= T.rowsDone[i] + 0.1;
          s.style.opacity = (0.5 + 0.5 * (d ? 1 : 0)).toFixed(2);
          const st = s.firstElementChild;
          st.innerHTML = d ? x.OK : '<i></i>';
        });
        // the measured band strip grows in with the isolation
        specBars.forEach((b, i) => {
          const v = SPECTRUM[i] * 44;
          const q = outCubic(seg(t, T.clean[0] + i * 0.012, T.clean[0] + 0.5 + i * 0.012));
          b.style.height = Math.max(4, v * q).toFixed(1) + 'px';
        });
        rise(ready, seg(t, T.ready, T.ready + 0.4), 6);
      },
    };
  },
};