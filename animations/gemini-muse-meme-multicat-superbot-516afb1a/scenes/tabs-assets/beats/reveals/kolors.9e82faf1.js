// Kolors (可图), Kuaishou's image model, as it appears in the Kling AI web app, klingai.com 'AI 图片' (Bilibili BV1oTMmzaEVz,
// 2025-06-14, t~64.7-65.9 s; spec .tmp/clone-9e82faf1/reveal-refs/kolors/spec.json, confidence 0.72; frames
// j_kol_pending_t64.7.png, j_kol_partial_t65.0.png, j_kol_complete_t66.9.png). A near-black three-column shell: a slim header with the
// title 'AI 图片' and a model chip '可图 1.5' carrying a 'NEW' badge, a left composer ('文生图' | 'AI 试衣' tabs, a prompt box, the
// reference-image slots, the 图片比例 and 生成数量 rows and a lime-to-cyan '立即生成' button), a centre canvas and a right '历史'
// rail. Pressing the button swaps the canvas's empty state for dark rounded tiles, each with a small multicolour ring spinner and the
// fixed line '加载中，请稍候…'. There is no percentage, queue label or bar, and no blur: a tile simply hands the spinner over to the
// finished picture, tile by tile, and the finished batch is filed in the history rail.
// Adapted to ten images: ten tiles in a 4 + 4 + 2 block resolving in reading order (the spinners turn from render(t)), the history
// rail gaining a new entry once the last one has landed. Omitted: the credit cost the button shows in the footage, the account row
// (credits, member badge, API button) and the creator's subtitle burned into the frame. The footage's pictures are never reproduced:
// every tile is our own meme, and no logo, wordmark or platform font is drawn (a plain ring, plain squares, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ko';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 392, LEFT_W = 156, RAIL_W = 56, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0b0f12; color: #e4e8ea; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a2025; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px; }
.${P}-menu { flex: none; display: flex; flex-direction: column; gap: 2.5px; width: 10px; }
.${P}-menu i { display: block; height: 1.3px; border-radius: 1px; background: #cdd3d6; }
.${P}-ttl { flex: none; font-size: 10px; font-weight: 600; color: #f4f6f7; white-space: nowrap; }
.${P}-model { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 20px; padding: 0 7px; border-radius: 6px; background: #12181c; box-shadow: inset 0 0 0 1px #4fe3b4; font-size: 8px; font-weight: 500; color: #f0f3f4; white-space: nowrap; }
.${P}-model em { font-style: normal; font-size: 5.5px; font-weight: 700; line-height: 8px; padding: 0 3px; border-radius: 3px; background: linear-gradient(90deg, #62f08a, #35d6e8); color: #06241c; }
.${P}-model svg { width: 7px; height: 7px; fill: none; stroke: #aeb6ba; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 2px 6px 8px 10px; }
.${P}-tabs { flex: none; display: flex; gap: 12px; height: 18px; font-size: 8px; font-weight: 600; color: #7f898e; }
.${P}-tabs span { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.${P}-tabs .on { color: #f4f6f7; box-shadow: 0 1.5px 0 #5fe9b0; }
.${P}-tabs em { font-style: normal; font-size: 5.5px; font-weight: 700; line-height: 8px; padding: 0 3px; border-radius: 3px; background: #1c2a26; color: #5fe9b0; }
.${P}-pan { flex: none; box-sizing: border-box; padding: 7px 8px; border-radius: 8px; background: #11171a; box-shadow: inset 0 0 0 1px #1c2428; }
.${P}-ph1 { display: flex; align-items: center; gap: 4px; height: 11px; font-size: 7.5px; font-weight: 600; color: #e8ecee; white-space: nowrap; }
.${P}-ph1 i { flex: none; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1.3px #5fe9b0; }
.${P}-ph1 small { margin-left: 2px; font-size: 6.5px; font-weight: 400; color: #7b858a; }
.${P}-prompt { margin-top: 5px; box-sizing: border-box; height: 52px; padding: 5px 6px; border-radius: 6px; background: #0c1114; font-size: 7.5px; line-height: 11px; color: #d7dde0; overflow: hidden; }
.${P}-try { display: flex; align-items: center; gap: 4px; margin-top: 5px; height: 12px; font-size: 6px; color: #7b858a; white-space: nowrap; }
.${P}-try span { box-sizing: border-box; height: 12px; padding: 0 4px; border-radius: 4px; background: #182025; line-height: 12px; color: #aab3b7; }
.${P}-slots { display: flex; gap: 6px; margin-top: 5px; }
.${P}-slot { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-sizing: border-box; height: 34px; border-radius: 6px; background: #0c1114; box-shadow: inset 0 0 0 1px #222c31; font-size: 6px; color: #7b858a; white-space: nowrap; }
.${P}-slot b { font-size: 11px; font-weight: 300; line-height: 11px; color: #8b969b; }
.${P}-lab { height: 10px; margin-top: 6px; font-size: 6.5px; line-height: 10px; color: #8a959a; }
.${P}-chips { display: flex; gap: 3px; margin-top: 3px; }
.${P}-chips span { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 16px; border-radius: 4px; background: #182025; font-size: 6.5px; color: #aab3b7; }
.${P}-chips .on { background: #16282a; box-shadow: inset 0 0 0 1px #4fe3b4; color: #e9fff6; }
.${P}-cnt { display: flex; align-items: center; gap: 6px; margin-top: 3px; height: 12px; }
.${P}-trk { position: relative; flex: 1; height: 2px; border-radius: 1px; background: #2a3439; }
.${P}-trk i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 1px; background: #62f08a; }
.${P}-trk b { position: absolute; right: -3px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #f4f6f7; }
.${P}-cnt span { flex: none; font-size: 6.5px; color: #cfd6d9; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 26px; border-radius: 13px; background: linear-gradient(90deg, #90fb51, #6df6c7); font-size: 9px; font-weight: 700; color: #08211a; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; display: flex; flex-direction: column; align-items: center; gap: 7px; transform: translateY(-60%); font-size: 8px; color: #6c767b; }
.${P}-es i { display: block; width: 46px; height: 34px; border-radius: 7px; background: #141b1f; box-shadow: inset 0 0 0 1px #1f282d; }
.${P}-g { position: absolute; left: 6px; right: 6px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 7px; overflow: hidden; background: #151b1f; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: #151b1f; }
.${P}-ring { display: block; width: 17px; height: 17px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(53, 214, 232, 0) 0deg, #35d6e8 25deg, #6d7dfc 110deg, #b25cf5 190deg, #f2488f 265deg, #ffb347 320deg, rgba(255, 179, 71, 0) 340deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.1px)); }
.${P}-pend span { font-size: 6.5px; color: #99a3a8; white-space: nowrap; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 4px 6px 8px 4px; overflow: hidden; }
.${P}-rh { flex: none; height: 14px; font-size: 8px; font-weight: 600; color: #f0f3f4; line-height: 14px; }
.${P}-hi { position: relative; flex: none; aspect-ratio: 1; border-radius: 6px; background: linear-gradient(160deg, #1b2328, #121a1e); }
.${P}-hi::after { content: ""; position: absolute; left: 7px; top: 7px; right: 7px; bottom: 14px; border-radius: 4px; background: #202a30; }
.${P}-hi s { position: absolute; left: 3px; bottom: 3px; display: flex; gap: 2px; text-decoration: none; }
.${P}-hi s span { height: 8px; padding: 0 2px; border-radius: 3px; background: rgba(8, 11, 13, .72); font-size: 4.5px; line-height: 8px; color: #dfe5e8; white-space: nowrap; }
.${P}-hi.new { box-shadow: 0 0 0 1px #4fe3b4; }
`;

const PROMPT = '一位缪斯在阶梯教室里举着手写便条，梗图风格，色彩明快';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 立即生成
const ISSUE = 0.16;                               // the empty state gives way to the ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its spinner over to the picture (reading order), the last at 1.68
const FADE = 0.06;                                // the spinner's cover thins away over this long before the picture lands
const HIS = (n, kind) => `<div class="${P}-hi"><s><span>${kind}</span><span>${n}张</span></s></div>`;

export default {
  id: 'kolors',
  label: 'Kolors (Kling AI)',
  source: {
    platform: 'Kuaishou Kolors (可图) in the Kling AI web app, klingai.com AI 图片 (desktop browser, dark theme; a tutorial screen recording on Bilibili, 2025-06-14)',
    feature: "dark three-column shell: a model chip '可图 1.5 NEW', a left composer with a lime-to-cyan 立即生成 button, a centre canvas of dark tiles each with a multicolour ring spinner and '加载中，请稍候…' (no percentage, queue label or blur) resolving tile by tile, a right 历史 rail (adapted to 10: a 4 + 4 + 2 tile block resolving in reading order, the history rail gaining an entry at the end; the credit cost on the button and the account row are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1oTMmzaEVz', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kolors');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i><span>加载中，请稍候…</span></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu"><i></i><i></i><i></i></div><b class="${P}-ttl">AI 图片</b><div class="${P}-model">可图 1.5<em>NEW</em>${chev}</div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-tabs"><span class="on">文生图<em>NEW</em></span><span>AI 试衣</span></div><div class="${P}-pan"><div class="${P}-ph1"><i></i>创意描述</div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-try">推荐尝试<span>冰雕</span><span>国画</span><span>岁月</span></div></div><div class="${P}-pan"><div class="${P}-ph1">上传参考图<small>（非必填）</small></div><div class="${P}-slots"><div class="${P}-slot"><b>+</b>脸部参考</div><div class="${P}-slot"><b>+</b>主体物参考</div></div></div><div class="${P}-pan"><div class="${P}-ph1">参数设置</div><div class="${P}-lab">图片比例</div><div class="${P}-chips"><span class="on">1:1</span><span>16:9</span><span>4:3</span><span>3:4</span></div><div class="${P}-lab">生成数量</div><div class="${P}-cnt"><div class="${P}-trk"><i></i><b></b></div><span>10 张</span></div></div><div class="${P}-go">立即生成</div></div><div class="${P}-cv"><div class="${P}-es"><i></i>快去生成你的创意吧~</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-rail"><div class="${P}-rh">历史</div><div class="${P}-hi new" style="display: none"><s><span>AI 图片</span><span>10张</span></s></div>${HIS(4, 'AI 图片')}${HIS(2, 'AI 换装')}${HIS(4, 'AI 图片')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`), fresh = root.querySelector(`.${P}-hi.new`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 立即生成 is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty state gives way to the pending tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the ring turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 520 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });

        // the batch is filed in the history rail once the last picture has landed
        put('his', s >= LAND[9], (v) => { fresh.style.display = v ? '' : 'none'; });
      },
    };
  },
};
