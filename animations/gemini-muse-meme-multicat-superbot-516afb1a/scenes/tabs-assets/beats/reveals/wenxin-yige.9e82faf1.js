// Baidu Wenxin Yige (文心一格), yige.baidu.com/creation, as it ran in 2023 (Bilibili BV1tr4y1f7gi, 2023-09-25, t=121-130.5 s; spec
// .tmp/clone-9e82faf1/reveal-refs/wenxin-yige/spec.json, confidence 0.55; frame j_yig_t124.0.png). A dark app: a top nav (首页 / AI创作 /
// AI编辑 / 实验室 / 热门活动 / 灵感中心), a left composer ('AI 创作' | 'AI 编辑' tabs, the 推荐 / 自定义 / 海报 / 艺术字 chips, the prompt
// with a '4 / 200' counter and 清空, 画面类型, 比例, a 数量 slider, 灵感模式 and a teal '立即生成' button), a centre 2 x 2 grid and a right
// '创作记录' rail. A pending tile is a #252525 dashed square with a centred cyan lightning glyph (#46FDEC) and the text '50%'. The '50%'
// was never seen to move, so it stays static here; the tile then swaps to the finished picture in one frame.
// Adapted to ten images: grids of 4 + 4 + 2 in turn (each batch's 2 x 2 grid replaces the last, the batches filed in the rail, newest on
// top, each rail entry a pending glyph until its batch has landed, then its first picture). Omitted: the '会员加速中…' membership chip,
// the credit cost ('实付') beside the button, the account area of the nav and the footage's own pictures: every tile is our own meme,
// and no logo, wordmark or platform font is drawn (a plain square for the mark, plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-yg';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 404, LEFT_W = 170, RAIL_W = 54;
const CYAN = '#46fdec';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1d1d1d; color: #e6e6e6; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2c2c2c; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 12px; height: 26px; padding: 0 12px; background: #161616; box-shadow: 0 1px 0 #262626; font-size: 7px; color: #cfcfcf; white-space: nowrap; }
.${P}-brand { display: flex; align-items: center; gap: 4px; margin-right: 4px; font-size: 8.5px; font-weight: 700; color: #f4f4f4; }
.${P}-brand i { display: block; width: 9px; height: 9px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.5px #f4f4f4; }
.${P}-nav .on { color: ${CYAN}; }
.${P}-mg { margin-left: auto; padding: 0 6px; height: 14px; border-radius: 7px; background: #262626; line-height: 14px; font-size: 6.5px; color: #cfcfcf; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 8px 10px 10px 10px; background: #202020; box-shadow: inset -1px 0 0 #2a2a2a; }
.${P}-tabs { flex: none; display: flex; justify-content: center; gap: 22px; height: 18px; font-size: 8px; color: #9a9a9a; }
.${P}-tabs span { padding: 0 2px; line-height: 18px; white-space: nowrap; }
.${P}-tabs .on { color: #f4f4f4; box-shadow: 0 1.5px 0 ${CYAN}; }
.${P}-sub { flex: none; display: flex; gap: 3px; }
.${P}-sub span { position: relative; flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 17px; border-radius: 3px; background: #2a2a2a; font-size: 6.5px; color: #bdbdbd; white-space: nowrap; }
.${P}-sub .on { background: #173a38; box-shadow: inset 0 0 0 1px ${CYAN}; color: ${CYAN}; }
.${P}-sub em { position: absolute; right: 0; top: -5px; padding: 0 2px; border-radius: 3px 3px 3px 0; background: ${CYAN}; font-style: normal; font-size: 4.5px; font-weight: 700; line-height: 6px; color: #06201e; }
.${P}-prompt { position: relative; flex: none; box-sizing: border-box; height: 58px; padding: 6px 7px 14px; border-radius: 4px; background: #2a2a2a; font-size: 7.5px; line-height: 11px; color: #ededed; overflow: hidden; }
.${P}-pc { position: absolute; right: 7px; bottom: 3px; display: flex; gap: 5px; font-size: 6px; line-height: 8px; color: #9a9a9a; }
.${P}-lb { flex: none; height: 9px; margin-top: 1px; font-size: 6.5px; line-height: 9px; color: #bdbdbd; display: flex; justify-content: space-between; }
.${P}-ty { flex: none; display: flex; gap: 5px; }
.${P}-ty div { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 5.5px; line-height: 7px; color: #bdbdbd; white-space: nowrap; }
.${P}-ty i { display: block; width: 100%; aspect-ratio: 1; border-radius: 4px; }
.${P}-ty .more i { background: #2a2a2a; }
.${P}-rt { flex: none; display: flex; gap: 4px; }
.${P}-rt span { flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; height: 16px; border-radius: 3px; background: #2a2a2a; font-size: 6.5px; color: #bdbdbd; white-space: nowrap; }
.${P}-rt span::before { content: ""; width: 5px; height: 7px; border-radius: 1px; box-shadow: inset 0 0 0 1px currentColor; }
.${P}-rt span:nth-child(2)::before { width: 7px; }
.${P}-rt span:nth-child(3)::before { width: 8px; height: 5px; }
.${P}-rt .on { background: #173a38; box-shadow: inset 0 0 0 1px ${CYAN}; color: ${CYAN}; }
.${P}-sl { position: relative; flex: none; height: 8px; margin: 0 3px 0 0; }
.${P}-sl::before { content: ""; position: absolute; left: 0; right: 0; top: 3px; height: 2px; border-radius: 1px; background: #3a3a3a; }
.${P}-sl::after { content: ""; position: absolute; left: 0; top: 3px; width: 25%; height: 2px; border-radius: 1px; background: ${CYAN}; }
.${P}-sl i { position: absolute; left: 25%; top: 0; width: 8px; height: 8px; margin-left: -4px; box-sizing: border-box; border-radius: 50%; background: #1d1d1d; box-shadow: inset 0 0 0 1.6px ${CYAN}; }
.${P}-ins { flex: none; display: flex; align-items: center; justify-content: space-between; height: 12px; font-size: 6.5px; color: #bdbdbd; }
.${P}-ins span { display: flex; align-items: center; gap: 4px; font-size: 6px; color: #8a8a8a; }
.${P}-ins b { position: relative; display: block; width: 14px; height: 8px; border-radius: 4px; background: #4a4a4a; }
.${P}-ins b::after { content: ""; position: absolute; left: 1px; top: 1px; width: 6px; height: 6px; border-radius: 50%; background: #d0d0d0; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 24px; border-radius: 12px; background: #46e8da; font-size: 8.5px; font-weight: 600; color: #04211f; }
.${P}-cv { position: relative; flex: 1; min-width: 0; }
.${P}-g { position: absolute; left: 12px; right: 10px; top: 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.${P}-c { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 3px; }
.${P}-c img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }
.${P}-ph { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; border: 1px dashed #3d3d3d; border-radius: 3px; background: #252525; }
.${P}-ph svg { display: block; width: 22px; height: 22px; }
.${P}-ph span { font-size: 7px; line-height: 9px; color: #c4c4c4; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${RAIL_W}px; padding: 8px 7px 8px 6px; box-shadow: inset 1px 0 0 #262626; }
.${P}-rh { flex: none; height: 10px; font-size: 6.5px; line-height: 10px; color: #bdbdbd; white-space: nowrap; }
.${P}-rl { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; }
.${P}-ri { position: relative; flex: none; aspect-ratio: 1; border-radius: 4px; background: #252525; overflow: hidden; }
.${P}-ri.on { box-shadow: 0 0 0 1px ${CYAN}; }
.${P}-ri img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-rp { position: absolute; inset: 0; display: grid; place-items: center; background: #252525; }
.${P}-rp svg { display: block; width: 13px; height: 13px; }
.${P}-ri b { position: absolute; right: 0; bottom: 0; min-width: 7px; padding: 0 2px; box-sizing: border-box; border-radius: 3px 0 0 0; background: rgba(20, 20, 20, .78); font-size: 5.5px; font-weight: 600; line-height: 8px; text-align: center; color: #eee; }
`;

const PROMPT = '一位缪斯在阶梯教室里举着手写便条';
const REF = 1.84;                                // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                             // the cursor presses 立即生成
const FADE = 0.05;                               // a placeholder cover thins away over this long before its picture lands
// the three batches: when each grid is issued (hard swap of the grid), when each of its pictures lands
const BATCHES = [
  { n: 4, at: 0.14, land: [0.4, 0.5, 0.6, 0.7] },
  { n: 4, at: 0.84, land: [1.06, 1.16, 1.26, 1.36] },
  { n: 2, at: 1.46, land: [1.62, 1.74] },
];
// the lightning glyph: a soft grey shadow copy under the cyan bolt
const BOLT = () => `<svg viewBox="0 0 24 24"><path d="M14.4 3.6L6.2 15.2h5.4l-2.2 6.4 8.4-11.8h-5.6z" fill="#4a4a4a"/><path d="M13 2L5 13.6h5.4L8.4 20 16.8 8.4h-5.6z" fill="${CYAN}"/></svg>`;

export default {
  id: 'wenxin-yige',
  label: 'Wenxin Yige (Baidu, 2023)',
  source: {
    platform: 'Baidu Wenxin Yige (文心一格), yige.baidu.com/creation AI 创作 (desktop browser, dark theme; a tutorial screen recording on Bilibili, 2023-09-25)',
    feature: "dark app: a left composer (prompt with a counter, 画面类型, 比例, a 数量 slider, 灵感模式, a teal 立即生成 button), a centre 2 x 2 grid of #252525 dashed placeholders each with a centred cyan lightning glyph and a static '50%' that swap to the finished picture, a right 创作记录 rail (adapted to 10: grids of 4 + 4 + 2 in turn, each batch filed in the rail; the 会员加速中… chip and the credit cost are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1tr4y1f7gi', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'wenxin-yige');
    const nav = ['首页', 'AI创作', 'AI编辑', '实验室', '热门活动', '灵感中心'].map((n) => `<span${n === 'AI创作' ? ' class="on"' : ''}>${n}</span>`).join('');
    const types = [['智能推荐', 'linear-gradient(135deg, #4aa8ff, #b46bff 60%, #ff7ad0)'], ['唯美二次元', 'linear-gradient(135deg, #3a2f4a, #b26b8a)'], ['中国风', 'linear-gradient(135deg, #2f6a4a, #8ac06a)']].map(([n, bg]) => `<div><i style="background: ${bg}"></i>${n}</div>`).join('') + `<div class="more"><i></i>更多</div>`;
    let g = 0;
    const grids = BATCHES.map((b) => {
      const cells = b.land.map((_, j) => { const i = g + j; return `<div class="${P}-c"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${tiles[i].origin}"/><div class="${P}-ph">${BOLT()}<span>50%</span></div></div>`; }).join('');
      g += b.n;
      return `<div class="${P}-g" style="visibility: hidden">${cells}</div>`;
    }).join('');
    // the rail, newest first; each entry is out of flow (but rendered) until its batch is issued
    let first = 0;
    const rail = BATCHES.map((b) => {
      const h = `<div class="${P}-ri" style="position: absolute; left: 0; top: 0; right: 0; visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${first + 1}" style="visibility: hidden"/><div class="${P}-rp">${BOLT()}</div><b>${b.n}</b></div>`;
      first += b.n;
      return h;
    }).reverse().join('');
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span class="${P}-brand"><i></i>文心一格</span>${nav}<span class="${P}-mg">创作管理</span></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-tabs"><span class="on">AI 创作</span><span>AI 编辑</span></div><div class="${P}-sub"><span class="on">推荐</span><span>自定义</span><span>海报<em>NEW</em></span><span>艺术字</span></div><div class="${P}-prompt">${x.esc(PROMPT)}<span class="${P}-pc"><span>${[...PROMPT].length} / 200</span><span>清空</span></span></div><div class="${P}-lb">画面类型</div><div class="${P}-ty">${types}</div><div class="${P}-lb">比例</div><div class="${P}-rt"><span>竖图</span><span class="on">方图</span><span>横图</span></div><div class="${P}-lb"><span>数量</span><span>4</span></div><div class="${P}-sl"><i></i></div><div class="${P}-ins">灵感模式<span>已关闭<b></b></span></div><div class="${P}-go">立即生成</div></div><div class="${P}-cv">${grids}</div><div class="${P}-rail"><div class="${P}-rh">创作记录</div><div class="${P}-rl">${rail}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`);
    const gridEls = [...root.querySelectorAll(`.${P}-g`)];
    let at = 0;
    const bs = BATCHES.map((b, bi) => {
      const cells = [...gridEls[bi].querySelectorAll(`.${P}-c`)].map((cn, j) => ({ im: cn.querySelector('img'), ph: cn.querySelector(`.${P}-ph`), g: tiles[at + j] }));
      at += b.n;
      return { b, grid: gridEls[bi], cells };
    });
    const ris = [...root.querySelectorAll(`.${P}-ri`)].reverse();    // back to issue order
    bs.forEach((o, bi) => { const r = ris[bi]; o.ri = r; o.rim = r.querySelector('img'); o.rp = r.querySelector(`.${P}-rp`); });
    ctx.gate([...bs.flatMap((o) => o.cells.map((c) => c.im)), ...bs.map((o) => o.rim)]);

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

        // the batch in the centre is the latest one issued; a new one replaces it in one frame
        let cur = -1;
        BATCHES.forEach((b, bi) => { if (s >= b.at) cur = bi; });

        bs.forEach((o, bi) => {
          // a grid is hidden by visibility, never display: its pictures stay laid out, decoded and painted
          put(`g${bi}`, cur === bi, (v) => { o.grid.style.visibility = v ? '' : 'hidden'; });
          o.cells.forEach((c, j) => {
            const a = o.b.land[j];
            const f = seg(s, a - FADE, a);
            put(`i${bi}.${j}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
            put(`h${bi}.${j}`, f.toFixed(3), () => {
              if (f >= 1) { c.ph.style.display = 'none'; c.ph.style.opacity = ''; } else { c.ph.style.display = ''; c.ph.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
            });
          });

          // the rail entry: in the flow from its batch's issue, a pending glyph until the batch has landed, then its first picture
          put(`r${bi}`, s >= o.b.at, (v) => { o.ri.style.position = v ? '' : 'absolute'; o.ri.style.visibility = v ? '' : 'hidden'; });
          put(`s${bi}`, cur === bi, (v) => { o.ri.classList.toggle('on', v); });
          const done = s >= o.b.land[o.b.n - 1];
          put(`d${bi}`, done, (v) => { o.rim.style.visibility = v ? '' : 'hidden'; o.rp.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
