// Claude Opus 5.5 — the code. Its job: make the print actually do the one thing it was asked for. The pane is
// the project: bark.ino streaming in, and the build log under it ending in a real flash size. The paw pin, the
// I2S DAC and the bark buffer are named in the sketch, so the wiring it claims is the wiring in the file.
import { seg, outCubic, lerp, streamCount, outBack } from '../../../lib.js';

const SAY = 'Wrote the firmware: paw press plays bark.wav. Built and flashed.';
const ROWS = [
  ['Writing bark.ino', 'Wrote bark.ino · 19 lines'],
  ['Flashing the chip', 'Flashed · 342 kB / 8 MB flash'],
];
// [indent, html]. Streaming it is a line reveal, so seek(t) lands on whole lines.
const CODE = [
  [0, '<span class="cm">// bark.ino: Biscuit, 88 mm. Press the paw, he barks.</span>'],
  [0, '<span class="cm">// XIAO ESP32S3 · PCM5102 I2S DAC · paw switch on GPIO3</span>'],
  [0, '<span class="kw">#include</span> <span class="st">"bark_wav.h"</span>'],
  [0, '<span class="kw">#include</span> <span class="st">&lt;driver/i2s.h&gt;</span>'],
  [0, '<span class="kw">#include</span> <span class="st">"PawButton.h"</span>'],
  [0, ''],
  [0, '<span class="kw">static</span> <span class="ty">PawButton</span> paw(<span class="nm">GPIO3</span>, LOW, <span class="nm">25</span>);'],
  [0, '<span class="kw">static</span> <span class="ty">I2SDAC</span>    dac(<span class="nm">44100</span>, <span class="nm">16</span>);'],
  [0, '<span class="kw">static</span> <span class="ty">bool</span>      bark = <span class="kw">false</span>;'],
  [0, ''],
  [0, '<span class="ty">void</span> <span class="fn">onPaw</span>() { bark = <span class="kw">true</span>; }  <span class="cm">// one bark per press</span>'],
  [0, '<span class="ty">void</span> <span class="fn">setup</span>() {'],
  [1, 'paw.<span class="fn">attach</span>(onPaw);'],
  [1, 'dac.<span class="fn">begin</span>();   <span class="cm">// 44.1 kHz 16-bit mono, 3 W amp</span>'],
  [0, '}'],
  [0, ''],
  [0, '<span class="ty">void</span> <span class="fn">loop</span>() {'],
  [1, '<span class="kw">if</span> (bark) { dac.<span class="fn">play</span>(bark_wav, BARK_WAV_LEN); bark = <span class="kw">false</span>; }'],
  [0, '}'],
];
const TERM = [
  ['dm', '$ pio run -e xiao_esp32s3'],
  ['dm', 'Compiling .pio/build/xiao_esp32s3/src/bark.ino.cpp'],
  ['wr', 'note: bark_wav.h holds one 0.9 s bark · 79 kB'],
  ['ok', 'RAM:   18.4% (used 60,240 bytes from 327,680)'],
  ['ok', 'Flash: 342 kB (used 342,776 bytes from 8,388,608)'],
  ['ok', '✓ Build succeeded · 3.9 s'],
  ['dm', '$ pio run -t upload'],
  ['ok', '✓ Flashed · chip reboots and waits for a paw'],
];

export default {
  times(r) {
    const T = { r };
    T.rows = [r + 0.12, r + 1.15];
    T.rowsDone = [r + 1.05, r + 2.0];
    T.code = [r + 0.2, r + 1.7];
    T.term = r + 1.3;
    T.badge = r + 1.95;
    T.end = r + 3.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const v = x.pane.el('code');
    const code = x.pane.q('code', '#cd-code');
    const term = x.pane.q('code', '#cd-term');
    const badge = x.pane.q('code', '#cd-badge');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = rows.map((r) => r.firstElementChild);
    let shown = -1, lastCode = -1, lastTerm = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], ...rows.map((r, i) => [T.rows[i], r])],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          rise(rows[i], seg(t, T.rows[i], T.rows[i] + 0.3), 8);
          const done = t >= T.rowsDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.rows[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? ROWS[i][1] : ROWS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const lines = Math.floor(CODE.length * seg(t, T.code[0], T.code[1]) + 0.001);
        if (lines !== lastCode) {
          code.innerHTML = CODE.slice(0, lines).map(([ind, html], i) =>
            `<div><span class="ln">${String(i + 1).padStart(2, ' ')}</span>${html === '' ? '' : '&nbsp;'.repeat(ind * 2) + html}</div>`).join('');
          lastCode = lines;
        }
        const done = t >= T.rowsDone[1];
        const tl = done ? TERM.length : Math.floor(TERM.length * seg(t, T.term, T.rowsDone[1]) + 0.001);
        if (tl !== lastTerm) {
          term.innerHTML = TERM.slice(0, tl).map(([c, s]) => `<div class="${c}">${x.esc(s)}</div>`).join('') + (tl < TERM.length ? '<div class="dm">▍</div>' : '');
          lastTerm = tl;
        }
        const b = outBack(seg(t, T.badge, T.badge + 0.45));
        badge.style.opacity = seg(t, T.badge, T.badge + 0.2).toFixed(3);
        badge.style.transform = `scale(${lerp(0.7, 1, b).toFixed(3)})`;
      },
    };
  },
};