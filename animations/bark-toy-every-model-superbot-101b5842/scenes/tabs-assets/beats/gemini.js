// Gemini (Nano Banana Pro) — the image. Its job: one photo grid in, a four-view turnaround sheet out, with the
// dog's markings held across every view. The pane shows the prompt, the render resolving under the generation
// sweep, the output size and the text the model lettered onto the sheet, his three real colours, and the four
// view crops it can hand downstream.
import { seg, outCubic, lerp, streamCount, outBack } from '../../../lib.js';

const SAY = 'Drew him four ways: front, 3/4, side, back. Markings held in all four.';
const ROWS = [['Holding his markings across views', 'Held markings across all 4 views']];
// each crop frames one figure: the sheet is drawn 760 px wide behind a 168 x 226 window, offset so that view's
// centre (measured on the sheet: 0.140, 0.362, 0.624, 0.866 of the width; figures 0.24..0.78 of the height) sits
// in the middle of the window
const CROP_X = [-22, -191, -390, -574], CROP_Y = -103, CROP_W = 760;

export default {
  times(r) {
    const T = { r };
    T.row = r + 0.12;
    T.rowDone = r + 0.85;
    T.render = [r + 0.3, r + 1.7];
    T.genDone = r + 1.55;
    T.meta = r + 1.6;
    T.crops = r + 1.7;
    T.end = r + 2.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = ROWS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const v = x.pane.el('gem');
    const shot = x.pane.q('gem', '#gem-shot');
    const im = shot.querySelector('img');
    const sweep = x.pane.q('gem', '#gem-sweep');
    const gen = x.pane.q('gem', '#gem-gen');
    const promptEl = x.pane.q('gem', '#gem-prompt');
    const size = x.pane.q('gem', '#gem-size');
    const textPill = x.pane.q('gem', '#gem-text');
    const sws = [...v.querySelectorAll('.gem-sw')];
    const crops = [...x.pane.q('gem', '#gem-crops').children];
    const sheetUrl = im.src;
    crops.forEach((c, i) => {
      c.style.backgroundImage = `url(${sheetUrl})`;
      c.style.backgroundSize = `${CROP_W}px auto`;
      c.style.backgroundPosition = `${CROP_X[i]}px ${CROP_Y}px`;
    });
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chip = rows[0].firstElementChild;
    const spin = chip.firstElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows],
      marks: [[T.r, say], [T.row, rows[0]]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 100, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(rows[0], seg(t, T.row, T.row + 0.32), 8);
        const done = t >= T.rowDone;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.row) * 450) % 360).toFixed(1)}deg)`;
        const lab = done ? ROWS[0][1] : ROWS[0][0];
        if (chip.lastElementChild.textContent !== lab) chip.lastElementChild.textContent = lab;

        // the render resolves out of a blur under the sweep band
        const p = seg(t, ...T.render), e = outCubic(p);
        im.style.filter = e >= 1 ? 'none' : `blur(${lerp(26, 0, e).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
        im.style.transform = `scale(${lerp(1.06, 1, e).toFixed(4)})`;
        sweep.style.opacity = (p > 0 && p < 1 ? Math.sin(Math.PI * Math.min(1, p * 1.2)) : 0).toFixed(3);
        sweep.style.transform = `translateY(${lerp(-45, 105, p).toFixed(1)}%)`;
        gen.style.opacity = (1 - seg(t, T.genDone, T.genDone + 0.3)).toFixed(3);
        gen.querySelector('i').style.transform = `rotate(${((t - T.r) * 420 % 360).toFixed(1)}deg)`;
        const wp = streamCount('Four views of the corgi toy, same markings, on a light grey sheet.', T.r + 0.1, 90, t);
        const want = `<b>Nano Banana Pro</b> · image 16:9 · 2K · “${'Four views of the corgi toy, same markings, on a light grey sheet.'.slice(0, wp)}${wp < 60 ? '▍' : ''}”`;
        if (promptEl.innerHTML !== want) promptEl.innerHTML = want;
        const mp = outCubic(seg(t, T.meta, T.meta + 0.4));
        size.style.opacity = mp.toFixed(3); textPill.style.opacity = mp.toFixed(3);
        sws.forEach((s, i) => { const q = outBack(seg(t, T.meta + 0.1 + i * 0.07, T.meta + 0.45 + i * 0.07)); s.style.transform = `scale(${lerp(0.4, 1, q).toFixed(3)})`; });
        crops.forEach((c, i) => {
          const q = outCubic(seg(t, T.crops + i * 0.08, T.crops + i * 0.08 + 0.36));
          c.style.opacity = q.toFixed(3);
          c.style.transform = q >= 1 ? '' : `translateY(${((1 - q) * 14).toFixed(2)}px)`;
        });
      },
    };
  },
};