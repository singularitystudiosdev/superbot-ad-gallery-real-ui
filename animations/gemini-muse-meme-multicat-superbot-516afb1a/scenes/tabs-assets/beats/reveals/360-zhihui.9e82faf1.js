// 360智绘, the 文生图 (text-to-image) web app of Qihoo 360 (Bilibili BV1Wc411q7c4, 2023-11-29, generating state t=27.75-28.6 s, finished
// state t=33 s; spec .tmp/clone-9e82faf1/reveal-refs/360-zhihui/spec.json, confidence 0.60; frames u_360-zhihui_generating_t27.75 ..
// t28.6, u_360-zhihui_result_t33). A near-black page (#0b0b0d) under a slim bar ('< 返回', the title '文生图'): a left column with the
// 文生图 / 图生图 / 历史记录 tabs, the 选择绘图模型 picker, the 尺寸 tiles and 生成数量, a centre canvas with a dashed border, a prompt-chip
// row under it and a blue 生成 button. Pressing 生成 greys the button into '生成中' and fills the canvas with dark tiles under a faint
// diagonal cross-hatch, each with a blue ring dial that fills clockwise to a live percentage (the footage steps through 43, 50, 60, 97
// and 99 %) and the grey caption '生成中...'; the finished picture then replaces the placeholder (hard swap) and the button re-enables.
// Adapted to ten images: ten 3:4 tiles in a 4 + 4 + 2 block, each dial climbing 0 to 99 % from t and the tiles landing in strict reading
// order. Omitted: the 360 logo beside the title, the account avatar's photo, the model thumbnails' pictures and the tutorial's caption
// overlays. The footage's pictures are never reproduced: every tile is our own meme, and no logo, wordmark or platform font is drawn
// (a plain ring, plain squares, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-zhi';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 496, LEFT_W = 148, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0b0b0d; color: #e8e8ec; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1d22; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; justify-content: center; height: 28px; }
.${P}-back { position: absolute; left: 8px; top: 6px; display: grid; place-items: center; box-sizing: border-box; height: 16px; padding: 0 6px; border-radius: 4px; background: #151518; box-shadow: inset 0 0 0 1px #222228; font-size: 6.5px; color: #d0d0d6; }
.${P}-ttl { font-size: 9px; font-weight: 600; color: #f2f2f5; }
.${P}-av { position: absolute; right: 8px; top: 6px; width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(140deg, #4a4a55, #2a2a31); }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 8px; padding: 0 8px 8px; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; }
.${P}-tabs { flex: none; display: flex; height: 20px; border-radius: 6px; background: #121215; font-size: 7px; font-weight: 600; color: #8a8a92; }
.${P}-tabs span { flex: 1; display: grid; place-items: center; white-space: nowrap; }
.${P}-tabs .on { color: #2e9bff; box-shadow: inset 0 -1.5px 0 #2e7bf6; }
.${P}-pan { flex: none; box-sizing: border-box; padding: 7px 7px 8px; border-radius: 8px; background: #121215; box-shadow: inset 0 0 0 1px #1c1c21; }
.${P}-ph { display: flex; align-items: center; justify-content: space-between; height: 11px; font-size: 7px; font-weight: 600; color: #e8e8ec; }
.${P}-ph small { font-size: 6px; font-weight: 400; color: #8a8a92; }
.${P}-sub { display: flex; gap: 8px; margin-top: 6px; font-size: 6px; color: #8a8a92; }
.${P}-sub .on { color: #f2f2f5; box-shadow: 0 1.5px 0 #f2f2f5; }
.${P}-mg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; margin-top: 6px; }
.${P}-mg div { display: flex; flex-direction: column; justify-content: flex-end; box-sizing: border-box; height: 38px; padding: 0 0 3px; border-radius: 5px; background: linear-gradient(150deg, #2b2f3d, #17181f); text-align: center; font-size: 6px; font-weight: 600; color: #e8e8ec; }
.${P}-mg .on { box-shadow: 0 0 0 1px #2e7bf6; }
.${P}-more { display: grid; place-items: center; height: 14px; margin-top: 6px; border-radius: 4px; background: #1b1b20; font-size: 6.5px; color: #b0b0b8; }
.${P}-sz { display: flex; gap: 4px; margin-top: 6px; }
.${P}-sz span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-sizing: border-box; height: 32px; border-radius: 5px; background: #17171b; box-shadow: inset 0 0 0 1px #222228; font-size: 6.5px; font-weight: 600; color: #b8b8c0; }
.${P}-sz span i { display: block; border-radius: 1.5px; box-shadow: inset 0 0 0 1.2px #8a8a92; }
.${P}-sz .on { box-shadow: inset 0 0 0 1px #2e7bf6; color: #ffffff; }
.${P}-sz .on i { box-shadow: inset 0 0 0 1.2px #2e9bff; }
.${P}-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.${P}-cv { position: relative; flex: none; box-sizing: border-box; padding: 8px; border-radius: 8px; border: 1px dashed #3a3a42; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; text-align: center; transform: translateY(-50%); font-size: 8px; color: #55555d; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #141416; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #141416 repeating-linear-gradient(45deg, #1b1b20 0, #1b1b20 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, #1b1b20 0, #1b1b20 1px, transparent 1px, transparent 6px); }
.${P}-dw { position: relative; width: 34px; height: 34px; }
.${P}-dial { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, #2e7bf6 0deg, #2a2d38 0deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); }
.${P}-pc { position: absolute; inset: 0; display: grid; place-items: center; font-size: 8px; font-weight: 500; color: #eaf0fa; }
.${P}-c span { font-size: 6px; color: #8a8a92; white-space: nowrap; }
.${P}-hint { flex: none; box-sizing: border-box; height: 14px; padding: 0 6px; border-radius: 4px; background: #121215; box-shadow: inset 0 0 0 1px #1f1f25; font-size: 5.5px; line-height: 14px; color: #6a6a72; white-space: nowrap; overflow: hidden; }
.${P}-pr { flex: none; display: flex; gap: 6px; }
.${P}-chips { flex: 1; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 4px; padding: 5px; border-radius: 6px; box-shadow: inset 0 0 0 1px #3a3a42; }
.${P}-chips span { display: grid; place-items: center; height: 14px; padding: 0 5px; border-radius: 3px; background: #1f1f25; font-size: 6.5px; color: #e8e8ec; white-space: nowrap; }
.${P}-go { flex: none; align-self: flex-end; display: grid; place-items: center; box-sizing: border-box; width: 42px; height: 22px; border-radius: 6px; background: #2e7bf6; font-size: 8px; font-weight: 700; color: #ffffff; }
.${P}-pub { flex: none; display: flex; justify-content: space-between; font-size: 5.5px; color: #55555d; white-space: nowrap; }
`;

const CHIPS = ['一位缪斯', '阶梯教室', '手写便条', '梗图风格', '色彩明快', '高清', '写实', '微笑'];
const MODELS = [['生活体验', 0], ['国潮国风', 0], ['3D手办', 0], ['照片写实', 1]];
const SIZES = [['1:1', 8, 8], ['3:4', 7, 9], ['4:3', 9, 7], ['9:16', 6, 10], ['16:9', 10, 6]];
const PROMPT_NOTE = '在山间的悬崖城堡，梦幻，童话，草地，鲜花，树木，灯光，白色的主体结构';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 生成
const ISSUE = 0.16;                               // the canvas fills with ten hatched placeholders
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i is hard-swapped for its picture (reading order), the last at 1.68
// the dial's percentage against the tile's own progress from ISSUE to its landing: the footage's 34, 43, 50, 60, 97 and 99 steps
const CURVE = [[0, 0], [0.12, 34], [0.3, 43], [0.48, 50], [0.64, 60], [0.86, 97], [1, 99]];
const pctAt = (u) => {
  for (let j = 1; j < CURVE.length; j++) {
    if (u <= CURVE[j][0]) { const [a, pa] = CURVE[j - 1], [b, pb] = CURVE[j]; return Math.round(pa + ((pb - pa) * (u - a)) / (b - a)); }
  }
  return 99;
};

export default {
  id: '360-zhihui',
  label: '360智绘 (2023)',
  source: {
    platform: '360智绘 文生图 web app (desktop browser, dark theme; a product demo screen recording on Bilibili, 2023-11-29)',
    feature: "dark 文生图 page: a left model / 尺寸 column, a dashed canvas, a prompt-chip row and a blue 生成 button that greys to '生成中'; pending tiles are dark cross-hatched placeholders each with a blue ring dial carrying a live percentage (43 / 50 / 60 / 97 / 99 % seen) and the caption '生成中...', hard-swapped for the finished pictures (adapted to 10: a 4 + 4 + 2 block resolving in strict reading order; the 360 logo and the account avatar's photo are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1Wc411q7c4', retrieved: '2026-10-14' }],
    extrapolated: ['ten tiles in a 4 + 4 + 2 block landing one after another (the footage shows four tiles advancing together and landing at once)', "each dial's own climb to 99 % ending at its tile's landing", '生成 re-enabling once the last tile has landed (read from the finished frame)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, '360-zhihui');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"><div class="${P}-dw"><i class="${P}-dial"></i><div class="${P}-pc">0%</div></div><span>生成中...</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-back">&lsaquo; 返回</div><b class="${P}-ttl">文生图</b><i class="${P}-av"></i></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-tabs"><span class="on">文生图</span><span>图生图</span><span>历史记录</span></div><div class="${P}-pan"><div class="${P}-ph">选择绘图模型<small>查看更多 &rsaquo;</small></div><div class="${P}-sub"><span class="on">推荐</span><span>收藏</span><span>我创建的</span><span>最近使用</span></div><div class="${P}-mg">${MODELS.map(([n, on]) => `<div${on ? ' class="on"' : ''}>${n}</div>`).join('')}</div><div class="${P}-more">展开</div></div><div class="${P}-pan"><div class="${P}-ph">尺寸</div><div class="${P}-sz">${SIZES.map(([n, w, h], i) => `<span${i === 1 ? ' class="on"' : ''}><i style="width: ${w}px; height: ${h}px"></i>${n}</span>`).join('')}</div><div class="${P}-ph" style="margin-top: 8px">生成数量<small>10 张</small></div></div></div><div class="${P}-right"><div class="${P}-cv"><div class="${P}-es">输入描述，点击生成</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-hint">${x.esc(PROMPT_NOTE)}</div><div class="${P}-pr"><div class="${P}-chips">${CHIPS.map((c) => `<span>${c}</span>`).join('')}<span>+</span></div><div class="${P}-go">生成</div></div><div class="${P}-pub"><span>公开作品，生成的图片将会被其他人看到</span><span>复制提示词　清空提示词</span></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), dial: n.querySelector(`.${P}-dial`), pc: n.querySelector(`.${P}-pc`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 生成 is pressed and greys into 生成中 until the last tile has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= GEN_AT && s < LAND[9];
        put('busy', busy, (v) => { go.textContent = v ? '生成中' : '生成'; go.style.background = v ? '#1c3556' : ''; go.style.color = v ? '#5f7ea8' : ''; });

        // the empty canvas gives way to the pending tiles
        put('iss', s >= ISSUE, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.cv.style.display = v ? 'none' : ''; });
          // the live percentage: the tile's own climb from ISSUE to its landing, a function of t alone
          const pct = landed ? 99 : pctAt(seg(s, ISSUE, LAND[i]));
          put(`p${i}`, pct, (v) => { c.pc.textContent = `${v}%`; c.dial.style.background = `conic-gradient(from 0deg, #2e7bf6 ${(v * 3.6).toFixed(1)}deg, #2a2d38 0deg)`; });
        });
      },
    };
  },
};
