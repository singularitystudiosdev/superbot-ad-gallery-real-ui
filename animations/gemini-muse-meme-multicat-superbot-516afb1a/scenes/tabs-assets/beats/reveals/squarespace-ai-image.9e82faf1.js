// Squarespace, the site editor's 'Image Studio' AI panel, as live-streamed in the 'Release Notes Live' stream of 2026-10-01 (Squarespace Circle,
// YouTube iF6ofBQzCL8, t=90.4-96.2 s; spec .tmp/clone-9e82faf1/reveal-refs/squarespace-ai-image/spec.json, confidence 0.55; frames
// ae_sq_just_submitted, ae_sq_pending_bar_early, ae_sq_pending_bar_mid, ae_sq_pending_bar_late, ae_sq_pending_bar_zoom, ae_sq_landing_single,
// ae_sq_landing_storyset4). A near-white studio: a slim header with the title 'Image Studio', a centred 'New image | Story set | Reshoot' tab pill
// and a close cross, a large preview pane and a floating prompt box ('Describe an image to generate', a 3:4 / Default / # 1 row and a round
// send button). Pressing send leaves the pane blank, a pale grey field; the only in-flight cue is a thin solid dark (#111, ~2 px) determinate
// bar creeping left to right along the pane's top-left edge, with no spinner, percentage, caption or queue label, while the prompt and its
// settings sit as a compact readout at the pane's top-right. The finished picture then fills the pane (a 'Story set' run fills it with a row of
// four related pictures), the bar gone.
// Adapted to ten images: the pane is one 5 x 2 block of ten portrait (3:4) pictures that drop into it strictly one after another in reading order
// over the blank field, the bar creeping from render(t) until the last has landed. Omitted: the AI-credits chip, the 'All AI images' link, the
// BETA mark, the footage's presenter inset and its subtitles, the editor behind the studio and the 'AI Terms' footnote. Every picture is our own
// meme; no Squarespace logo or wordmark is drawn, only system type and plain glyphs.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sqs';
const ROOT_H = 432, COLS = 5, GAP = 8, PANE_PAD = 12;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 20px; border-radius: 10px; background: #f6f4f2; color: #111; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e7e4e0; }
.${P}-top { position: relative; flex: none; display: flex; align-items: center; height: 34px; }
.${P}-top b { font-size: 9px; font-weight: 600; letter-spacing: -.1px; color: #111; }
.${P}-top svg { margin-left: auto; flex: none; width: 9px; height: 9px; fill: none; stroke: #111; stroke-width: 1.5; stroke-linecap: round; }
.${P}-tabs { position: absolute; left: 50%; top: 5px; display: flex; gap: 2px; height: 24px; padding: 0 3px; transform: translateX(-50%); border-radius: 12px; background: #fff; }
.${P}-tabs span { display: grid; place-items: center; padding: 0 10px; margin: 3px 0; border-radius: 9px; font-size: 7.5px; line-height: 1; color: #6b6a68; white-space: nowrap; }
.${P}-tabs .${P}-on { background: #e9e7e4; font-weight: 600; color: #111; }
.${P}-read { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 22px; margin-top: 6px; font-size: 7px; color: #8a8885; white-space: nowrap; }
.${P}-read span:first-child { box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 4px; background: #fff; font-size: 7.5px; line-height: 20px; color: #111; }
.${P}-pane { position: relative; flex: none; height: 282px; margin-top: 6px; background: #ececeb; box-shadow: 0 -1px 0 #fff; overflow: hidden; }
.${P}-bar { position: absolute; left: 0; top: 0; width: 0; height: 2px; background: #111; }
.${P}-g { position: absolute; left: ${PANE_PAD}px; right: ${PANE_PAD}px; top: ${PANE_PAD}px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 2px; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-box { flex: none; box-sizing: border-box; width: 340px; height: 58px; margin: 12px auto 0; padding: 9px 12px 0; border-radius: 10px; background: #fff; box-shadow: 0 1px 6px rgba(17, 17, 17, .06); }
.${P}-box p { margin: 0; font-size: 8.5px; line-height: 12px; color: #8a8885; }
.${P}-opts { display: flex; align-items: center; gap: 13px; margin-top: 11px; font-size: 7.5px; color: #111; }
.${P}-opts i { display: block; box-sizing: border-box; width: 8px; height: 8px; margin-right: 4px; vertical-align: -1px; border-radius: 1.5px; box-shadow: inset 0 0 0 1.1px #111; }
.${P}-opts span { display: inline-flex; align-items: center; }
.${P}-send { margin-left: auto; display: grid; place-items: center; width: 17px; height: 17px; border-radius: 4px; background: #d9d8d6; }
.${P}-send svg { display: block; width: 9px; height: 9px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'a Muse in a lecture hall holding up a handwritten note, meme style';
const CROSS = '<svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>';
const UP = '<svg viewBox="0 0 10 10"><path d="M5 9V1.5M2 4.5l3-3 3 3"/></svg>';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.12);   // picture i fills its place (reading order), the last at 1.70
const BAR0 = 0.03, BAR1 = 0.96;                   // the bar's width as the card opens and when the last picture lands

export default {
  id: 'squarespace-ai-image',
  label: 'Squarespace AI image (2026)',
  source: {
    platform: "Squarespace site editor (squarespace.com/config), the 'Image Studio' AI panel (a live-stream recording on YouTube, 'Release Notes Live', 2026-10-01; confirmed by two further 2026 tutorials)",
    feature: "a blank near-white preview pane with a thin dark determinate bar creeping along its top-left edge and no spinner, percentage or caption, beside the prompt box (3:4, Default, # 1, a round send button) and the 'New image | Story set | Reshoot' tabs; the finished picture then fills the pane (adapted to 10: a 5 x 2 block of 3:4 pictures dropping into the pane one at a time in reading order; the AI-credits chip, the BETA mark and the 'All AI images' link are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=iF6ofBQzCL8', retrieved: '2026-10-14' }],
    extrapolated: "the filmed wait is only ~2.5 s of a 6-30 s run (the bar at ~6 % then ~9 % before the stream cut away) and the footage's result is one picture filling the pane or a row of four; here the bar's whole creep (3 % -> 96 %) is compressed into the beat's window with an easing-out curve, the pane holds ten 3:4 pictures landing at an even step, and the prompt readout beside the pane is drawn above it to keep the width",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'squarespace-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>Image Studio</b><div class="${P}-tabs"><span class="${P}-on">New image</span><span>Story set</span><span>Reshoot</span></div>${CROSS}</div><div class="${P}-read"><span>${x.esc(PROMPT)}</span><span>3:4</span><span>Default</span></div><div class="${P}-pane"><div class="${P}-bar"></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-box"><p>Describe an image to generate</p><div class="${P}-opts"><span><i></i>3:4</span><span>Default</span><span># 1</span><span>+</span><div class="${P}-send">${UP}</div></div></div></div>`);
    const bar = root.querySelector(`.${P}-bar`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the thin bar creeps along the pane's top edge until the last picture has landed, then it is gone
        const over = s >= LAND[9];
        const u = Math.min(1, Math.max(0, s) / LAND[9]);
        const pct = BAR0 + (BAR1 - BAR0) * (1 - Math.pow(1 - u, 1.5));
        put('bar', over ? 'off' : (pct * 100).toFixed(1), (v) => { bar.style.display = v === 'off' ? 'none' : ''; if (v !== 'off') bar.style.width = `${v}%`; });

        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
