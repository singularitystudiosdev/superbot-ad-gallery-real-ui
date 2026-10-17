// Mochi Diffusion (2023), the native macOS SwiftUI Stable Diffusion app, in its Simplified-Chinese build, while a batch is running
// (YouTube 3CVKGn0gqGM, 2023-04-23, t=199-202 s; spec .tmp/clone-9e82faf1/reveal-refs/mochi-diffusion/spec.json, confidence 0.55,
// frames af2_mochi_generating_t199.0.png, af2_mochi_generating_t202.0.png, af2_mochi_inspector_t200.0.png, af2_mochi_toolbar_ring_t201.6.png,
// af2_mochi_stopgen_btn_t201.6.png). A dark window with the traffic lights, a mauve-to-indigo inspector on the left (关键词, 反向关键词,
// the HD checkbox and the generate control, 原始图像 with 强度, 图像数量, 迭代步数, 关键词权重, 随机种, 模型), a toolbar (the
// sidebar toggle, the title 'Mochi Diffusion' over a live 'n images' count, then trash, magic wand, download, share, the inspector
// toggle and a 搜索 field), the gallery of square thumbnails and a '无' (none) detail column. While the batch runs an indeterminate BLUE
// ring spins at the left of the toolbar's icon row, the inspector's generate control has become the light mauve '终止生成' (stop
// generation) pill and the prompt box has a red-tinted border; there is no placeholder tile, no bar and no percentage: finished
// pictures simply appear in the gallery one at a time and the toolbar count climbs 1 -> 2 -> 3. The 'n / 75' under the prompt is the CLIP
// token counter, not progress, and stays static.
// Adapted to ten images: the count climbs 1 .. 10 and the gallery fills in reading order (4 + 4 + 2 thumbnails); 图像数量 reads 10.
// Omitted: the macOS menu bar (and its Apple menu), the presenter's burned-in captions and the '5倍速>>' speed badge. The footage's
// pictures are never reproduced: every thumbnail is our own meme; no app icon or logo is drawn, only system type and plain glyphs.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mch';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 340, SIDE_W = 128, DET_W = 84, COLS = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #222222; color: #e8e8ea; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #3d3d40; }
.${P}-side { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${SIDE_W}px; padding: 8px 8px 8px 8px; background: linear-gradient(180deg, #323534 0%, #302836 38%, #442831 62%, #483944 100%); box-shadow: 1px 0 0 #1a1a1c; }
.${P}-lights { flex: none; display: flex; gap: 4px; height: 12px; padding-left: 1px; margin-bottom: 2px; }
.${P}-lights i { display: block; width: 7px; height: 7px; border-radius: 50%; }
.${P}-lab { flex: none; height: 8px; margin-top: 4px; font-size: 5.5px; line-height: 8px; color: #a7a3ab; white-space: nowrap; }
.${P}-lab2 { display: flex; justify-content: space-between; }
.${P}-ta { flex: none; box-sizing: border-box; padding: 3px 4px; border-radius: 3px; background: #1b1b1b; font-size: 6.5px; line-height: 9px; color: #ececee; overflow: hidden; }
.${P}-cnt { flex: none; height: 8px; font-size: 5px; line-height: 8px; text-align: right; color: #77737b; }
.${P}-act { flex: none; display: flex; align-items: center; gap: 3px; height: 17px; margin-top: 5px; font-size: 6.5px; color: #ececee; }
.${P}-chk { flex: none; display: grid; place-items: center; width: 7px; height: 7px; border-radius: 2px; background: #0a84ff; }
.${P}-chk svg { width: 5px; height: 5px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-wand { flex: none; width: 8px; height: 8px; fill: none; stroke: #bdb8c1; stroke-width: 1.1; stroke-linecap: round; }
.${P}-go { margin-left: auto; flex: none; display: grid; place-items: center; box-sizing: border-box; height: 15px; min-width: 40px; padding: 0 7px; border-radius: 4px; font-size: 6.5px; color: #fff; white-space: nowrap; }
.${P}-hr { flex: none; height: 1px; margin: 5px 0 1px; background: rgba(255, 255, 255, .1); }
.${P}-orig { flex: none; display: flex; gap: 8px; height: 30px; margin-top: 2px; }
.${P}-img { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 28px; height: 30px; border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22); }
.${P}-img svg { width: 11px; height: 9px; fill: none; stroke: #8d8992; stroke-width: 1; stroke-linejoin: round; }
.${P}-ctl { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 3px; padding-top: 2px; }
.${P}-tick { height: 5px; border-radius: 1px; background: repeating-linear-gradient(90deg, rgba(255, 255, 255, .28) 0 1px, transparent 1px 4px); }
.${P}-btn2 { display: flex; justify-content: flex-end; gap: 3px; }
.${P}-btn2 i { display: block; width: 11px; height: 8px; border-radius: 2px; background: rgba(255, 255, 255, .17); }
.${P}-fld { flex: none; position: relative; box-sizing: border-box; height: 12px; margin-top: 1px; padding: 0 4px; border-radius: 2px; background: rgba(255, 255, 255, .1); font-size: 6px; line-height: 12px; color: #ececee; white-space: nowrap; overflow: hidden; }
.${P}-fld i { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255, 255, 255, .1); }
.${P}-fld span { position: relative; }
.${P}-row { flex: none; display: flex; gap: 3px; }
.${P}-row .${P}-fld { flex: 1; min-width: 0; }
.${P}-row b { flex: none; box-sizing: border-box; width: 18px; height: 12px; margin-top: 1px; border-radius: 2px; background: rgba(255, 255, 255, .17); }
.${P}-dim { color: #8f8a94; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-bar { flex: none; display: flex; align-items: center; height: 28px; padding: 0 8px 0 8px; background: #313131; box-shadow: 0 1px 0 #1b1b1b; }
.${P}-tg { flex: none; width: 10px; height: 8px; box-sizing: border-box; border-radius: 2px; box-shadow: inset 0 0 0 1px #b4b4b8; background: linear-gradient(90deg, transparent 3px, #b4b4b8 3px 4px, transparent 4px); }
.${P}-ttl { flex: none; margin-left: 12px; display: flex; flex-direction: column; justify-content: center; height: 20px; white-space: nowrap; }
.${P}-ttl b { font-size: 7px; font-weight: 600; line-height: 10px; color: #f1f1f3; }
.${P}-ttl span { font-size: 5px; line-height: 7px; color: #a2a2a6; }
.${P}-ic { margin-left: auto; flex: none; display: flex; align-items: center; gap: 11px; }
.${P}-ring { display: block; flex: none; width: 10px; height: 10px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(58, 142, 246, 0) 0deg, rgba(58, 142, 246, .25) 120deg, #3a8ef6 330deg, rgba(58, 142, 246, 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.4px)); }
.${P}-ic svg { flex: none; width: 9px; height: 9px; fill: none; stroke: #5c5c60; stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ic .${P}-ion { stroke: #d6d6da; }
.${P}-sr { flex: none; display: flex; align-items: center; gap: 3px; box-sizing: border-box; width: 62px; height: 14px; margin-left: 11px; padding: 0 4px; border-radius: 4px; box-shadow: inset 0 0 0 1px #4a4a4e; font-size: 6px; color: #7c7c80; white-space: nowrap; }
.${P}-sr svg { width: 6px; height: 6px; fill: none; stroke: #9a9a9e; stroke-width: 1.2; stroke-linecap: round; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-gal { flex: 1; min-width: 0; box-sizing: border-box; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-auto-rows: min-content; gap: 6px; align-content: start; padding: 8px 10px; }
.${P}-cell { position: relative; aspect-ratio: 1; }
.${P}-fr { position: absolute; inset: 0; border-radius: 3px; overflow: hidden; background: #1b1b1b; box-shadow: 0 0 0 2px #1b1b1b; }
.${P}-fr img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-det { flex: none; display: grid; place-items: center; box-sizing: border-box; width: ${DET_W}px; font-size: 7px; color: #6e6e72; box-shadow: -1px 0 0 #2c2c2e; }
`;

const PROMPT = 'a muse holding up a meme note';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the generate control
const ISSUE = 0.16;                               // the run starts: the ring spins and the control reads 终止生成
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // picture i appears in the gallery (reading order), the last at 1.68
const SPIN = 380;                                 // the ring's degrees per second

const svg = (d) => `<svg viewBox="0 0 12 12">${d}</svg>`;
const ICONS = [
  svg('<path d="M3.5 3.5h5l-.5 6.5h-4zM2.5 3.5h7M5 2.2h2"/>'),
  svg('<path d="M2 10L8.5 3.5M7.5 2.5l2 2M3 3.5v1.5M2.3 4.2h1.4M9.5 8v1.5M8.8 8.7h1.4"/>'),
  svg('<path d="M6 2v5.5M3.8 5.5L6 7.7l2.2-2.2M2.5 8.5v1.5h7V8.5"/>'),
  svg('<path d="M6 7.5V2M3.8 4L6 1.8 8.2 4M2.5 6v4h7V6"/>'),
];

export default {
  id: 'mochi-diffusion',
  label: 'Mochi Diffusion (2023)',
  source: {
    platform: 'Mochi Diffusion, the native macOS SwiftUI Stable Diffusion app (Core ML), Simplified-Chinese localization, dark appearance (a tutorial screen recording on YouTube, 2023-04-23)',
    feature: "dark macOS window: a mauve-to-indigo inspector (关键词 with its static token counter, 反向关键词, HD, the generate control, 原始图像, 图像数量, 迭代步数, 关键词权重, 随机种, 模型), a toolbar carrying an indeterminate BLUE ring at the left of the icon row and the title with a live 'n images' count, a gallery where finished thumbnails simply appear one at a time (no placeholder, bar or percentage) and a '无' detail column; while it runs the generate control reads the light mauve pill '终止生成' (adapted to 10: the count climbs 1..10 and the gallery fills 4 + 4 + 2 in reading order; the macOS menu bar, the presenter's captions and the speed badge are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=3CVKGn0gqGM', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten images: the source batch shows 3 of 4 images; the rest are extended to ten in the app's own gallery layout (square thumbnails filling the grid left to right, 4 + 4 + 2 at this window width), the count climbing 1 images .. 10 images, and 图像数量 reads 10",
      "the idle label of the generate control is '生成' (not captured in the footage; the observed string is the running label '终止生成'), and the toolbar ring and the red prompt border are drawn only while the batch runs",
      "before the first image the toolbar count reads '0 images' (the footage starts at '1 images'); no progress bar, percentage or placeholder tile is drawn: none appears in this build",
      "the prompt, the inspector's 7 / 75 token counter and the other field values are static; the prompt is our own sentence in place of the footage's English prompt",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'mochi-diffusion');
    const cell = (g, i) => `<div class="${P}-cell"><div class="${P}-fr" style="visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div></div>`;
    const tick = '<svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.4 2.4 4.6-5"/></svg>';
    const root = x.el(`<div class="${P}">`
      + `<div class="${P}-side"><div class="${P}-lights"><i style="background: #ff5f57"></i><i style="background: #febc2e"></i><i style="background: #28c840"></i></div>`
      + `<div class="${P}-lab">关键词</div><div class="${P}-ta" style="height: 40px">${x.esc(PROMPT)}</div><div class="${P}-cnt">7 / 75</div>`
      + `<div class="${P}-lab">反向关键词</div><div class="${P}-ta" style="height: 26px"></div>`
      + `<div class="${P}-act"><span class="${P}-chk">${tick}</span><svg class="${P}-wand" viewBox="0 0 12 12"><path d="M2 10L8.5 3.5M7.5 2.5l2 2M3 3.5v1.5M2.3 4.2h1.4"/></svg>HD<span class="${P}-go"></span></div>`
      + `<div class="${P}-hr"></div>`
      + `<div class="${P}-lab ${P}-lab2"><span>原始图像</span><span>强度</span></div><div class="${P}-orig"><div class="${P}-img"><svg viewBox="0 0 12 10"><path d="M1.5 1.5h9v7h-9zM2.5 8l2.5-3 2 2 1.2-1.2L10 8"/></svg></div><div class="${P}-ctl"><div class="${P}-tick"></div><div class="${P}-btn2"><i></i><i></i></div></div></div>`
      + `<div class="${P}-hr"></div>`
      + `<div class="${P}-lab">图像数量</div><div class="${P}-fld"><span>10</span></div>`
      + `<div class="${P}-lab">迭代步数</div><div class="${P}-fld"><i style="width: 32%"></i><span>20</span></div>`
      + `<div class="${P}-lab">关键词权重</div><div class="${P}-fld"><i style="width: 52%"></i><span>13.0</span></div>`
      + `<div class="${P}-lab">随机种</div><div class="${P}-row"><div class="${P}-fld"><span class="${P}-dim">随机</span></div><b></b></div>`
      + `<div class="${P}-lab">模型</div><div class="${P}-row"><div class="${P}-fld"><span>realisticVision-v20_spli…</span></div><b></b></div></div>`
      + `<div class="${P}-main"><div class="${P}-bar"><i class="${P}-tg"></i><div class="${P}-ttl"><b>Mochi Diffusion</b><span class="${P}-n">0 images</span></div>`
      + `<div class="${P}-ic"><i class="${P}-ring" style="visibility: hidden"></i>${ICONS[0]}${ICONS[1]}${ICONS[2]}${ICONS[3]}<svg class="${P}-ion" viewBox="0 0 12 12"><path d="M1.8 2.5h8.4v7H1.8zM7.3 2.5v7"/></svg></div>`
      + `<div class="${P}-sr"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.2"/><path d="M7.5 7.5L10.5 10.5"/></svg>搜索</div></div>`
      + `<div class="${P}-body"><div class="${P}-gal">${tiles.map(cell).join('')}</div><div class="${P}-det">无</div></div></div>`
      + `</div>`);
    const ta = root.querySelector(`.${P}-ta`), go = root.querySelector(`.${P}-go`), ring = root.querySelector(`.${P}-ring`), num = root.querySelector(`.${P}-n`);
    const cells = [...root.querySelectorAll(`.${P}-fr`)].map((fr, i) => ({ fr, im: fr.querySelector('img'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the generate control is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // how many pictures have landed; the batch runs from ISSUE until the last one lands
        let n = 0;
        for (let i = 0; i < LAND.length; i++) if (s >= LAND[i]) n = i + 1;
        const running = s >= ISSUE && n < LAND.length;

        // idle: the blue generate pill; running: the light mauve 终止生成 pill, the red-tinted prompt border and the spinning ring
        put('run', running, (v) => {
          go.textContent = v ? '终止生成' : '生成';
          go.style.background = v ? 'rgba(214, 178, 190, .42)' : '#0a84ff';
          ta.style.boxShadow = v ? 'inset 0 0 0 1px rgba(255, 82, 72, .6)' : 'none';
          ring.style.visibility = v ? '' : 'hidden';
        });
        const deg = running ? (((s * SPIN) % 360) + 360) % 360 : 0;
        put('spin', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // the toolbar count climbs as pictures appear
        put('n', n, (v) => { num.textContent = `${v} images`; });
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.fr.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
