// Replicate's model page as it looked in 2023, a Stable Diffusion run on replicate.com/stability-ai/stable-diffusion (OnlineComputerTips,
// YouTube RcpeO9JrVZ0, 2023-05-19, t=64-80 s; the prediction-page chrome from Replicate's own video ijhT8keE4I4, 2024-01-18; spec
// .tmp/clone-9e82faf1/reveal-refs/replicate/spec.json, confidence 0.63; frames wy_replicate_sd_starting.jpg, sd_running1-3.jpg, sd_done.jpg,
// pred_succeeded.jpg). A white two-column page: an 'Input' form on the left (each field a small mono name chip over its control and a grey
// hint) and an 'Output' column on the right. While the prediction runs the Output header carries a grey arc spinner and a status string,
// 'Checking status...' and then 'Running...', a 'Cancel' button under it and, filling the column, a light-grey monospace log panel streaming
// tqdm lines ('6/50 [00:00<00:02, 21.28it/s]' with a block bar and a percentage). Nothing of the picture shows while the loop runs; the
// finished images are then swapped in at once and the header reads a green 'Succeeded' with the runtime.
// Adapted to ten images: the num_outputs slider reads 10, the Output column keeps a blank 4 + 4 + 2 grid between the status line and the log,
// and its pictures are painted in one at a time in reading order; the step loop (0 -> 50 of 50) is driven from t and compressed into the beat
// window, 'Succeeded' appearing with the last picture. Omitted: the site's navigation and the sign-in / get-started buttons, the
// recording's browser chrome and channel watermark, the hardware label. The footage's pictures are never reproduced.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-rpl';
const ROOT_H = 452, COLS = 4, GAP = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; gap: 20px; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 16px 18px 0; border-radius: 12px; background: #ffffff; color: #111827; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-in { flex: none; width: 188px; }
.${P}-out { flex: 1; min-width: 0; }
.${P}-h { height: 22px; font-size: 13px; font-weight: 500; line-height: 22px; color: #374151; }
.${P}-f { margin-top: 12px; }
.${P}-f:first-of-type { margin-top: 8px; }
.${P}-n { display: flex; align-items: center; gap: 5px; height: 16px; font-size: 8px; color: #6b7280; }
.${P}-n b { font-family: ${MONO_FONT}; font-size: 8px; font-weight: 400; padding: 1px 5px; border-radius: 3px; background: #f3f4f6; color: #111827; }
.${P}-c { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; height: 25px; margin-top: 4px; padding: 0 7px; border-radius: 2px; background: #ffffff; box-shadow: 0 0 0 1px #d1d5db; font-size: 8.5px; color: #111827; white-space: nowrap; overflow: hidden; }
.${P}-c i { font-style: normal; font-size: 6px; color: #374151; }
.${P}-d { margin-top: 3px; font-size: 7.5px; line-height: 10px; color: #9ca3af; }
.${P}-num { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.${P}-num span { flex: none; box-sizing: border-box; width: 34px; height: 25px; padding: 0 7px; box-shadow: 0 0 0 1px #d1d5db; font-size: 8.5px; line-height: 25px; color: #111827; }
.${P}-trk { position: relative; flex: 1; height: 3px; border-radius: 2px; background: #e5e7eb; }
.${P}-trk i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: #1d4ed8; }
.${P}-trk b { position: absolute; top: -3px; width: 9px; height: 9px; margin-left: -5px; border-radius: 50%; background: #1d4ed8; }
.${P}-st { display: flex; align-items: center; gap: 7px; height: 20px; margin-top: 8px; font-size: 9px; color: #6b7280; white-space: nowrap; }
.${P}-sp { flex: none; display: block; width: 11px; height: 11px; border-radius: 50%; box-sizing: border-box; border: 1.6px solid #d1d5db; border-top-color: #6b7280; border-right-color: #9ca3af; }
.${P}-ok { flex: none; box-sizing: border-box; height: 16px; padding: 0 7px; border-radius: 3px; background: #dcfce7; box-shadow: inset 0 0 0 1px #86efac; font-size: 8px; font-weight: 600; line-height: 16px; color: #166534; }
.${P}-rt { font-size: 8.5px; color: #374151; }
.${P}-cx { box-sizing: border-box; display: grid; place-items: center; width: 56px; height: 24px; margin-top: 4px; border-radius: 2px; background: #ffffff; box-shadow: 0 0 0 1px #374151; font-size: 8.5px; color: #111827; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: #ffffff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #ffffff; }
.${P}-log { box-sizing: border-box; height: 98px; margin-top: 8px; padding: 5px 6px; border-radius: 2px; background: #f3f4f6; font-family: ${MONO_FONT}; font-size: 7.5px; line-height: 9.5px; color: #111827; white-space: pre; overflow: hidden; }
`;

const PROMPT = 'a muse holding a note, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const STEPS = 50, LINES = 9;                      // the log panel shows its newest nine lines
const RUN_AT = 0.04;                              // the prediction starts: spinner, 'Checking status...', Cancel
const GO_AT = 0.3;                                // 'Checking status...' gives way to 'Running...' and the log starts to stream
const RATE = 21.28;                               // it/s printed in the log
const mmss = (sec) => { const n = Math.max(0, Math.round(sec)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
// one tqdm line: percentage, a ten-cell block bar, n/50 and [elapsed<eta, it/s]
const tq = (n) => {
  if (n === 0) return '  0%|          | 0/50 [00:00<?, ?it/s]';
  const cells = Math.floor((n / STEPS) * 10 + 1e-9);
  const pct = String(Math.floor((n / STEPS) * 100 + 1e-9)).padStart(3);
  return `${pct}%|${'█'.repeat(cells)}${' '.repeat(10 - cells)}| ${String(n).padStart(2)}/${STEPS} [${mmss(n / RATE)}<${mmss((STEPS - n) / RATE)}, ${RATE.toFixed(2)}it/s]`;
};
// the banner, then a line every three steps (0, 3, ... 48) and the loop's closing 50/50
const LOG = ['Running prediction(h3k9q2xv7wlbz4ncgfa81d)  Using seed: 29075', 'input_shape: torch.Size([1, 77])', ...Array.from({ length: 17 }, (_, j) => tq(j * 3)), tq(STEPS)];

export default {
  id: 'replicate',
  label: 'Replicate (2023)',
  source: {
    platform: 'Replicate model page, replicate.com/stability-ai/stable-diffusion (desktop Chrome, light theme; a screen recording on YouTube, 2023-05-19, prediction-page chrome from the official channel, 2024-01-18)',
    feature: "Input form left; Output column with a grey arc spinner and 'Checking status...' then 'Running...', a Cancel button and a streaming monospace tqdm log ('6/50 [00:00<00:02, 21.28it/s]' lines), no picture while the loop runs; the images then hard-swap in and the header reads 'Succeeded' (adapted to 10: num_outputs 10, a blank 4 + 4 + 2 grid between the status line and the log whose pictures are painted in one at a time in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=RcpeO9JrVZ0', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=ijhT8keE4I4', retrieved: '2026-10-14' },
      { url: 'https://replicate.com/docs/topics/predictions/lifecycle', retrieved: '2026-10-14' },
    ],
    // the capture shows num_outputs 4 landing together; no per-image landing, no ten-image grid and no queued frame
    extrapolated: [
      'ten pictures landing one at a time in reading order (the footage swaps its four in together)',
      'a 4 + 4 + 2 grid and num_outputs 10 (the footage ran 4)',
      "the step loop (0/50 -> 50/50 at about 21 it/s, about 15 s of real time) compressed into the beat window and driven from t; the log's lines advance with it",
      "the 'Succeeded' pill and runtime shown with the last picture (taken from the official prediction-page video)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'replicate');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"></div></div>`;
    const chev = `<i>&#9660;</i>`;
    const root = x.el(`<div class="${P}"><div class="${P}-in"><div class="${P}-h">Input</div><div class="${P}-f"><div class="${P}-n">T <b>prompt</b></div><div class="${P}-c">${x.esc(PROMPT)}</div><div class="${P}-d">Input prompt</div></div><div class="${P}-f"><div class="${P}-n">&#8801; <b>image_dimensions</b></div><div class="${P}-c">768x768${chev}</div><div class="${P}-d">pixel dimensions of output image</div></div><div class="${P}-f"><div class="${P}-n">T <b>negative_prompt</b></div><div class="${P}-c"></div><div class="${P}-d">Specify things to not see in the output</div></div><div class="${P}-f"><div class="${P}-n"># <b>num_outputs</b></div><div class="${P}-num"><span>10</span><div class="${P}-trk"><i style="width: 100%"></i><b style="left: 100%"></b></div></div><div class="${P}-d">Number of images to output. (minimum: 1; maximum: 10)</div></div><div class="${P}-f"><div class="${P}-n"># <b>num_inference_steps</b></div><div class="${P}-num"><span>50</span><div class="${P}-trk"><i style="width: 9%"></i><b style="left: 9%"></b></div></div><div class="${P}-d">Number of denoising steps. (minimum: 1; maximum: 500)</div></div></div><div class="${P}-out"><div class="${P}-h">Output</div><div class="${P}-st" style="visibility: hidden"><i class="${P}-sp"></i><span class="${P}-sx">Checking status...</span><span class="${P}-ok" style="display: none">Succeeded</span><span class="${P}-rt" style="display: none">13.47 seconds</span></div><div class="${P}-cx" style="visibility: hidden">Cancel</div><div class="${P}-log"></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div>`);
    const out = root.querySelector(`.${P}-out`);
    const st = out.querySelector(`.${P}-st`), spin = out.querySelector(`.${P}-sp`), stx = out.querySelector(`.${P}-sx`), ok = out.querySelector(`.${P}-ok`), rt = out.querySelector(`.${P}-rt`), cx = out.querySelector(`.${P}-cx`), log = out.querySelector(`.${P}-log`);
    const cells = [...out.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const last = ctx.seq(9)[1];

        // the status line: nothing, then spinner + 'Checking status...' + Cancel, then 'Running...', then 'Succeeded' with the runtime
        const phase = t >= last ? 3 : s >= GO_AT ? 2 : s >= RUN_AT ? 1 : 0;
        put('ph', phase, (v) => {
          st.style.visibility = v === 0 ? 'hidden' : '';
          cx.style.visibility = v === 1 || v === 2 ? '' : 'hidden';
          spin.style.display = v === 3 ? 'none' : '';
          stx.style.display = v === 3 ? 'none' : '';
          ok.style.display = v === 3 ? '' : 'none';
          rt.style.display = v === 3 ? '' : 'none';
          stx.textContent = v === 2 ? 'Running...' : 'Checking status...';
        });
        // the arc turns with t (a function of t alone)
        const deg = Math.round((((t * 540) % 360) + 360) % 360 / 6) * 6;
        put('rot', deg, (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // the log streams the step loop: banner first, then a line every three steps, 0 -> 50 across the run
        const prog = seg(s, GO_AT, (last - ctx.cardIn) / k);
        const n = phase >= 2 ? Math.min(STEPS, Math.floor(prog * STEPS)) : -1;
        // lines shown: banner (2) + one line per step multiple of three reached (0, 3, ... 48), the closing 50/50 last
        const shown = n < 0 ? 0 : n >= STEPS ? LOG.length : 2 + Math.min(17, Math.floor(n / 3) + 1);
        put('log', shown, (v) => { log.textContent = LOG.slice(Math.max(0, v - LINES), v).join('\n'); });

        // each picture is painted into its blank cell in one frame, no fade
        cells.forEach((c, i) => {
          const on = t >= ctx.seq(i)[1];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cv.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
