// Google AI Studio's 'Generate Media' console running Imagen, as in a 2025-10 screen recording (Jason Gandy, YouTube KShkaaB6ytk, 2025-10-11, t=205-216 s)
// and a 2026-06 Google Cloud screencast (YouTube fqEWIuhWD5k) that shows the same placeholder at 1:1; spec
// .tmp/clone-9e82faf1/reveal-refs/google-ai-studio/spec.json, confidence 0.78; frames wy_aistudio_idle_imagen.jpg, pending_early/mid/late.jpg,
// pending_button_zoom.png, pending_spinner_zoom.png, landed.jpg, src2_pending.jpg. The Studio shell is near-black (#171717), not light: only the
// placeholders are pale. Idle, a centred heading 'Generate images with Imagen' sits over a rounded prompt bar holding the prompt and a periwinkle 'Run' pill
// with its keyboard hint, beside a 'Run settings' panel (model dropdown, 'Number of results', 'Aspect ratio' tiles). Pressing Run swaps the heading for
// FLAT pale-periwinkle (#D6DCFC) rounded placeholders, each with a thin indigo ring spinner at its centre (no shimmer, caption, percentage or bar),
// drops the prompt bar to the foot of the canvas and flips the Run pill in place to 'Running N.Ns' (a stop-in-progress glyph, a live seconds counter in tenths).
// The pictures then hard-swap in, the pill goes back to 'Run' and the breadcrumb title is named from the prompt.
// Adapted to ten images: 'Number of results' reads 10 and the canvas holds a 5 x 2 block (1:1, the aspect the second source shows) resolving in reading
// order. The footage's counter (about 10 s of real time) is compressed into the beat window and driven from t. Omitted: the 'Google AI Studio' wordmark,
// the Get-API-key pill and top tabs, the left rail, the example-image row, the recording's like-and-follow strip. No footage picture is reproduced.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gas';
const ROOT_H = 372, SIDE_W = 136, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #171717; color: #e3e3e3; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2a2a; }
.${P}-main { position: relative; flex: 1; min-width: 0; }
.${P}-bc { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 38px; margin: 0 14px; padding-top: 4px; border-bottom: 1px solid #2b2b2b; font-size: 10px; font-weight: 500; color: #9aa0a6; white-space: nowrap; }
.${P}-bc b { font-weight: 600; color: #f1f3f4; }
.${P}-bc em { font-style: normal; font-size: 8px; color: #6b7075; }
.${P}-cv { position: absolute; left: 14px; right: 14px; top: 38px; bottom: 74px; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 50%; margin-top: -48px; text-align: center; font-size: 19px; font-weight: 500; line-height: 26px; color: #e8eaed; }
.${P}-hd i { font-style: normal; color: #8ab4f8; }
.${P}-g { position: absolute; left: 0; right: 0; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 9px; overflow: hidden; background: #d6dcfc; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: #d6dcfc; }
.${P}-ring { position: absolute; left: 50%; top: 50%; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; box-sizing: border-box; border-radius: 50%; border: 1.3px solid transparent; border-top-color: #5f6bd8; border-right-color: #5f6bd8; border-bottom-color: #aab3ee; }
.${P}-bar { position: absolute; left: 14px; right: 14px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; height: 46px; padding: 0 9px 0 16px; border-radius: 23px; background: #232323; box-shadow: 0 0 0 1px #2d2d2d; font-size: 10px; color: #e3e3e3; white-space: nowrap; }
.${P}-bar.${P}-idle { top: 50%; margin-top: -3px; }
.${P}-bar.${P}-run { top: auto; bottom: 26px; }
.${P}-pr { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-pill { flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 28px; padding: 0 12px; border-radius: 14px; background: #809ff2; font-size: 10px; font-weight: 600; color: #1a2b6b; white-space: nowrap; }
.${P}-pill u { text-decoration: none; font-size: 8px; font-weight: 500; opacity: .75; }
.${P}-stop { display: none; position: relative; flex: none; width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; border: 1.4px solid #1a2b6b; border-bottom-color: transparent; }
.${P}-stop::after { content: ""; position: absolute; left: 2.6px; top: 2.6px; width: 4px; height: 4px; border-radius: 1px; background: #1a2b6b; }
.${P}-note { position: absolute; left: 14px; bottom: 8px; font-size: 7.5px; color: #8a8f94; }
.${P}-side { flex: none; box-sizing: border-box; width: ${SIDE_W}px; padding: 12px 11px; border-left: 1px solid #2b2b2b; background: #1b1b1b; }
.${P}-sh { font-size: 10px; font-weight: 600; color: #f1f3f4; }
.${P}-dd { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 27px; margin-top: 10px; padding: 0 8px; border-radius: 6px; box-shadow: inset 0 0 0 1px #343434; font-size: 8.5px; color: #e3e3e3; white-space: nowrap; }
.${P}-dd i { font-style: normal; font-size: 6px; color: #b0b4b8; }
.${P}-lb { margin-top: 12px; font-size: 8.5px; color: #c4c7c5; }
.${P}-nr { display: flex; align-items: center; gap: 6px; margin-top: 7px; }
.${P}-trk { position: relative; flex: 1; height: 3px; border-radius: 2px; background: #484848; }
.${P}-trk b { position: absolute; right: -4px; top: -3.5px; width: 10px; height: 10px; border-radius: 50%; background: #b8bec4; }
.${P}-nr span { flex: none; font-size: 8px; color: #8a8f94; }
.${P}-ar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 7px; }
.${P}-ar span { display: flex; flex-direction: column; align-items: center; gap: 3px; box-sizing: border-box; padding: 6px 0 5px; border-radius: 5px; font-size: 7.5px; font-weight: 600; color: #e3e3e3; }
.${P}-ar span i { display: block; box-sizing: border-box; border: 1.2px solid #b8bec4; border-radius: 1.5px; }
.${P}-ar .${P}-on { background: #3b3b3b; }
`;

const PROMPT = 'A muse holding a handwritten note, meme style';
const TITLE = 'Muse Lecture Hall Meme';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const RUN_AT = 0.05;                              // the cursor presses Run
const ISSUE = 0.15;                               // the heading gives way to the placeholders, the bar drops, the pill flips
const SECS = 9.9;                                 // the footage's counter ran to Running 9.9s before the picture landed
const RATIOS = [['1:1', 10, 10], ['9:16', 7, 11], ['16:9', 11, 7], ['4:3', 10, 8], ['3:4', 8, 10]];

export default {
  id: 'google-ai-studio',
  label: 'Google AI Studio, Imagen (2025)',
  source: {
    platform: "Google AI Studio 'Generate Media' console running Imagen (desktop browser, dark Studio theme; a screen recording on YouTube, 2025-10-11, and a Google Cloud screencast, 2026-06-18)",
    feature: "flat pale-periwinkle (#D6DCFC) placeholders each with a thin centred indigo ring spinner (no shimmer, caption, percentage or bar) while the 'Run' pill flips in place to 'Running N.Ns' with a live seconds counter; the pictures then hard-swap in and the pill reads 'Run' again (adapted to 10: a 5 x 2 block, 'Number of results' 10, resolving in reading order; the wordmark, API-key pill, left rail and example-image row are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=KShkaaB6ytk', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=fqEWIuhWD5k', retrieved: '2026-10-14' },
      { url: 'https://ai.google.dev/gemini-api/docs/imagen', retrieved: '2026-10-14' },
    ],
    // the capture ran Number of results = 1 (one placeholder, one picture); Imagen itself is retired in the Gemini API as of 2026-09
    extrapolated: [
      'ten placeholders in a 5 x 2 block and ten pictures landing one at a time in reading order (the footage shows one)',
      "the live 'Running N.Ns' counter (about 10 s of real time, edited down to 5 s on screen) compressed into the beat window and driven from t",
      'a 1:1 aspect for every tile (the footage shows 16:9 and, in the second source, 1:1)',
      "the 'Run' pill coming back and the breadcrumb being named only once the last picture has landed",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-ai-studio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-ph"><i class="${P}-ring"></i></div></div>`;
    const ratio = ([name, w, h], j) => `<span${j === 0 ? ` class="${P}-on"` : ''}><i style="width: ${w}px; height: ${h}px"></i>${name}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-main"><div class="${P}-bc">Generate Media<em>&#8250;</em><b>Untitled prompt</b></div><div class="${P}-cv"><div class="${P}-hd">Generate images with <i>Imagen</i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-bar ${P}-idle"><span class="${P}-pr">${x.esc(PROMPT)}</span><div class="${P}-pill"><i class="${P}-stop"></i><span class="${P}-pt">Run</span><u>&#8984;&#8629;</u></div></div><div class="${P}-note">Imagen makes mistakes, so double-check it.</div></div><div class="${P}-side"><div class="${P}-sh">Run settings</div><div class="${P}-dd">Imagen 4 (Preview)<i>&#9660;</i></div><div class="${P}-lb">Number of results</div><div class="${P}-nr"><div class="${P}-trk"><b></b></div><span>10</span></div><div class="${P}-lb">Aspect ratio</div><div class="${P}-ar">${RATIOS.map(ratio).join('')}</div></div></div>`);
    const bc = root.querySelector(`.${P}-bc b`), hd = root.querySelector(`.${P}-hd`), grid = root.querySelector(`.${P}-g`), bar = root.querySelector(`.${P}-bar`);
    const pill = root.querySelector(`.${P}-pill`), stop = pill.querySelector(`.${P}-stop`), pt = pill.querySelector(`.${P}-pt`), hint = pill.querySelector('u');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const land = cells.map((_, i) => ctx.seq(i)[1]);
        const sIss = ctx.cardIn + ISSUE * k;

        // Run is pressed
        const rp = press(s, RUN_AT, 0.05, 0.05, 0.12);
        put('run', rp.toFixed(3), () => { pill.style.transform = rp > 0 ? `scale(${(1 - 0.06 * rp).toFixed(4)})` : 'none'; });

        // the heading gives way to the placeholders; the bar drops to the foot of the canvas
        const on = t >= sIss;
        put('iss', on, (v) => {
          hd.style.display = v ? 'none' : '';
          grid.style.visibility = v ? '' : 'hidden';
          bar.className = `${P}-bar ${v ? `${P}-run` : `${P}-idle`}`;
        });

        // the pill reads 'Run' with its hint, flips in place to 'Running N.Ns' while the batch runs, and goes back once the last picture has landed
        const running = on && t < land[9];
        const el = SECS * seg(t, sIss, land[9]);
        put('pill', running ? el.toFixed(1) : '-', (v) => {
          stop.style.display = v === '-' ? 'none' : 'block';
          hint.style.display = v === '-' ? '' : 'none';
          pt.textContent = v === '-' ? 'Run' : `Running ${v}s`;
        });
        // the stop glyph's arc turns with t
        const sd = Math.round(((((t * 360) % 360) + 360) % 360) / 12) * 12;
        put('stopr', sd, (d) => { stop.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          put(`i${i}`, t >= land[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.ph.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the thin ring turns with t (a function of t alone, its phase differs per tile)
          const deg = Math.round(((((t * 420 + i * 37) % 360) + 360) % 360) / 6) * 6;
          put(`r${i}`, deg, (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });

        // the breadcrumb is named from the prompt once the run is done
        put('title', t >= land[9], (v) => { bc.textContent = v ? TITLE : 'Untitled prompt'; });
      },
    };
  },
};
