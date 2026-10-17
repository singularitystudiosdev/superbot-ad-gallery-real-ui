// Figma 'Make an image' (2025), the AI image action on the design canvas, in its Japanese UI (a third-party tutorial on YouTube,
// ZN3OakoWnvc, 2025-10-31, t=151.0-152.7 s; spec .tmp/clone-9e82faf1/reveal-refs/figma-make-image/spec.json, confidence 0.60;
// frames y_fg_pending_t151.png, y_fg_pending_t152.png, y_fg_resolved_t153.png). Figma paints NO placeholder on the canvas: the selected
// white artboard (1080 x 1350, a thin blue selection outline) stays blank through the wait. The AI image panel (the prompt, a model
// chip, the blue '実行する ⌘⏎' button) collapses on Run into a slim white pill at the canvas bottom-centre: a thin grey indeterminate
// arc spinner, the bold status '画像を作成中...' and a 'キャンセル Esc' button; there is no percentage, bar or timer. The recording
// cuts at the moment the picture lands (the image fills the frame and a '完了!' toast with a green check appears).
// Adapted to ten images: ten blank white frames on the canvas (5 x 2), selected, each staying blank until its picture lands, in
// strict reading order, while the pill shows; once the last has landed the pill gives way to the '完了!' toast. The Japanese strings
// are the observed ones; the prompt, the frame names and the model chip text are ours. Omitted: the Figma logo, the layers and
// properties panels and the presenter's subtitle bars. Every picture is our own meme; no logo, wordmark or platform font.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-fmi';
const FONT = `${UI_FONT}, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Noto Sans CJK JP', sans-serif`;
const ROOT_H = 440, COLS = 5;
const PROMPT = '手書きのメモを持つ陽気なおばけ、講義室、ミーム風';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f5f5f5; color: #1e1e1e; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdcdc; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 10px; background: #fff; border-bottom: 1px solid #e6e6e6; font-size: 8px; white-space: nowrap; }
.${P}-top b { font-weight: 600; }
.${P}-top span { color: #8a8a8a; font-size: 7px; }
.${P}-top .sh { margin-left: auto; padding: 3px 9px; border-radius: 5px; background: #0d99ff; font-size: 7.5px; font-weight: 600; color: #fff; }
.${P}-cv { flex: 1; min-height: 0; position: relative; box-sizing: border-box; padding: 12px 14px 0; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 0 12px; }
.${P}-f { min-width: 0; padding-bottom: 12px; }
.${P}-n { height: 11px; font-size: 6.5px; line-height: 11px; color: #7a7a7a; white-space: nowrap; overflow: hidden; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; overflow: hidden; background: #fff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #fff; box-shadow: inset 0 0 0 1px #0d99ff; }
.${P}-zone { position: absolute; left: 0; right: 0; bottom: 8px; height: 76px; }
.${P}-pill { position: absolute; left: 50%; bottom: 0; display: flex; align-items: center; gap: 8px; box-sizing: border-box; width: 300px; height: 34px; margin-left: -150px; padding: 0 6px 0 11px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08), 0 3px 10px rgba(0, 0, 0, .12); }
.${P}-arc { flex: none; width: 11px; height: 11px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(167, 167, 167, 0) 0deg, #a7a7a7 250deg, rgba(167, 167, 167, 0) 262deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1.1px)); }
.${P}-st { flex: 1; font-size: 8px; font-weight: 700; color: #2c2c2c; white-space: nowrap; }
.${P}-cx { flex: none; box-sizing: border-box; height: 22px; padding: 0 8px; border-radius: 5px; box-shadow: inset 0 0 0 1px #e2e2e2; font-size: 7.5px; line-height: 22px; color: #4e4e4e; white-space: nowrap; }
.${P}-cx em { font-style: normal; margin-left: 3px; color: #a0a0a0; }
.${P}-pan { position: absolute; left: 50%; bottom: 0; box-sizing: border-box; width: 340px; height: 66px; margin-left: -170px; padding: 8px 9px 7px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08), 0 4px 14px rgba(0, 0, 0, .14); }
.${P}-pr { height: 24px; font-size: 8px; line-height: 12px; color: #2c2c2c; overflow: hidden; }
.${P}-bar { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.${P}-mod { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 6px; border-radius: 5px; box-shadow: inset 0 0 0 1px #e2e2e2; font-size: 6.5px; color: #4e4e4e; white-space: nowrap; }
.${P}-mod i { width: 6px; height: 6px; border-radius: 2px; background: #b9b9b9; }
.${P}-run { margin-left: auto; box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 6px; background: #0d99ff; font-size: 7.5px; font-weight: 600; line-height: 20px; color: #fff; white-space: nowrap; }
.${P}-run em { font-style: normal; margin-left: 4px; font-weight: 400; color: #cfeaff; }
.${P}-done { position: absolute; left: 50%; bottom: 0; display: flex; align-items: center; gap: 6px; box-sizing: border-box; width: 150px; height: 28px; margin-left: -75px; padding: 0 9px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08), 0 3px 10px rgba(0, 0, 0, .12); font-size: 8px; font-weight: 600; color: #2c2c2c; }
.${P}-done svg { flex: none; width: 11px; height: 11px; }
.${P}-done span { margin-left: auto; font-weight: 400; color: #8a8a8a; }
`;

export default {
  id: 'figma-make-image',
  label: 'Figma Make an image (2025)',
  source: {
    platform: "Figma design canvas, the AI 'Make an image' action (Japanese UI; a third-party tutorial on YouTube, 2025-10-31)",
    feature: "Figma paints no placeholder: the blank white selected artboard waits while the AI image panel collapses into a slim pill (grey arc spinner, '画像を作成中...', 'キャンセル Esc'); the picture then lands on the artboard with a '完了!' toast (adapted to 10: ten blank white frames in a 5 x 2 canvas filling one after another in strict reading order while the pill shows)",
    refs: [{ url: 'https://www.youtube.com/watch?v=ZN3OakoWnvc', retrieved: '2026-10-14' }],
    extrapolated: "The footage has one artboard and cuts at the landing: ten frames (5 x 2), the strict per-frame landing order, the '完了!' toast timing after the last landing, the frame names, the model chip text and the prompt text are extrapolated or ours; the Japanese UI strings are the observed ones.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'figma-make-image');
    const frame = (g, i) => `<div class="${P}-f"><div class="${P}-n">フレーム ${i + 1}</div><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div></div>`;
    const check = '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#14ae5c"/><path d="M3.4 6.2l1.8 1.8 3.4-3.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>無題</b><span>ドラフト</span><div class="sh">共有</div></div><div class="${P}-cv"><div class="${P}-g">${tiles.map(frame).join('')}</div><div class="${P}-zone"><div class="${P}-pan"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-bar"><div class="${P}-mod"><i></i>Gemini 2.5 (Nano Banana)</div><div class="${P}-run">実行する<em>⌘⏎</em></div></div></div><div class="${P}-pill" style="display: none"><i class="${P}-arc"></i><b class="${P}-st">画像を作成中...</b><div class="${P}-cx">キャンセル<em>Esc</em></div></div><div class="${P}-done" style="display: none">${check}完了!<span>×</span></div></div></div></div>`);
    const run = root.querySelector(`.${P}-run`), pan = root.querySelector(`.${P}-pan`), pill = root.querySelector(`.${P}-pill`), arc = root.querySelector(`.${P}-arc`), done = root.querySelector(`.${P}-done`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const GEN = ctx.cardIn + (ctx.seq(0)[0] - ctx.cardIn) * 0.5;   // Run is pressed: the panel collapses into the pill

    return {
      root,
      render(t) {
        const gp = press(t, GEN, 0.06, 0, 0.02);
        const state = t < GEN ? 0 : t < ctx.lastLand ? 1 : 2;
        put('run', gp.toFixed(3), () => { run.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('zone', state, (v) => {
          pan.style.display = v === 0 ? '' : 'none';
          pill.style.display = v === 1 ? '' : 'none';
          done.style.display = v === 2 ? '' : 'none';
        });
        arc.style.transform = `rotate(${((((t * 420) % 360) + 360) % 360).toFixed(1)}deg)`;
        cells.forEach((c, i) => {
          // nothing is painted on a frame until its picture lands
          const on = t >= ctx.seq(i)[1];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
