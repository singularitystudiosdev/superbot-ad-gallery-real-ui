// Tencent Hunyuan's image playground (腾讯混元 视觉生成; bilibili BV1AjnfzuETh t56.5-59.0s; spec .tmp/clone-9e82faf1/reveal-refs/hunyuan/
// spec.json, confidence 0.55; frames g1_queue_dense_10fps_t56.5-59, g1_completion_t57.30, g1_completion_t57.90): a LIGHT two-column
// web app, a #F7F7F7 rail on the left under a #F6F6F4 header, a #FDFDFD work area: a composer card (current model as plain
// text 'HunyuanImage 3.0', an aspect select, a number select, a full-width black '立即生成' pill) beside a '预览效果' preview panel.
// Pending is ONE state: the pill greys out and the panel shows a small light-grey spinner with the single line '任务排队中…' (no
// percentage, no bar, no shimmer). Completion is an INSTANT in-place swap: a white bordered result card holding the image with a
// small four-icon action row beneath, and the pill turns black again. Nothing animates between the two.
// Adapted to ten images: the number select reads 10 and the preview panel holds a grid of ten slots, each showing the spinner and
// the queue line until its image swaps in, in order; the pill turns black once the last one has landed.
// Drawn in the system UI face with plain shapes: none of the product's logo, icons or fonts is drawn or shipped.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hy';
const HEAD_H = 26, BODY_H = 244;
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; height: ${HEAD_H + BODY_H}px; border-radius: 12px; background: #fdfdfd; color: #1d1d1f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e9e9ec; }
.${P}-hd { display: flex; align-items: center; gap: 7px; height: ${HEAD_H}px; padding: 0 12px; background: #f6f6f4; font-size: 9px; color: #8a8a8f; }
.${P}-hd i { flex: none; width: 11px; height: 11px; border-radius: 50%; background: #3d7be8; box-shadow: inset -3px -2px 0 #8fc0ff; }
.${P}-hd b { font-weight: 600; color: #1d1d1f; }
.${P}-bd { display: flex; height: ${BODY_H}px; }
.${P}-rail { flex: none; width: 62px; box-sizing: border-box; padding: 10px 6px; background: #f7f7f7; font-size: 9px; line-height: 12px; color: #55555a; }
.${P}-rail div { padding: 6px 4px; border-radius: 6px; white-space: nowrap; }
.${P}-rail .${P}-on { background: #ececee; color: #111; font-weight: 600; }
.${P}-cmp { flex: none; width: 168px; box-sizing: border-box; display: flex; flex-direction: column; padding: 10px 12px 12px; border-right: 1px solid #efeff1; }
.${P}-lab { margin: 0 0 4px; font-size: 8.5px; line-height: 12px; font-weight: 600; color: #2a2a2d; }
.${P}-box { display: flex; align-items: center; justify-content: space-between; height: 24px; margin-bottom: 9px; padding: 0 8px; box-sizing: border-box; border-radius: 6px; background: #fff; box-shadow: 0 0 0 1px #e4e4e8; font-size: 9px; color: #1d1d1f; white-space: nowrap; }
.${P}-box s { flex: none; width: 5px; height: 5px; border-right: 1.3px solid #77777c; border-bottom: 1.3px solid #77777c; transform: rotate(45deg) translateY(-1px); text-decoration: none; }
.${P}-go { margin-top: auto; height: 28px; border-radius: 14px; background: #111; color: #fff; font-size: 10px; line-height: 28px; font-weight: 600; text-align: center; }
.${P}-pv { flex: 1; min-width: 0; box-sizing: border-box; padding: 10px 12px; }
.${P}-ti { font-size: 9.5px; line-height: 13px; font-weight: 600; color: #2a2a2d; }
.${P}-emp { display: flex; flex-direction: column; align-items: center; justify-content: center; height: ${BODY_H - 46}px; gap: 3px; font-size: 8.5px; color: #a8a8ad; }
.${P}-emp i { display: block; width: 26px; height: 20px; margin-bottom: 4px; box-sizing: border-box; border: 1.3px solid #c9c9ce; border-top-width: 5px; border-radius: 3px; }
.${P}-gr { display: none; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px 6px; margin-top: 8px; }
.${P}-s { position: relative; }
.${P}-card { position: relative; aspect-ratio: 3 / 4; box-sizing: border-box; border-radius: 6px; overflow: hidden; }
.${P}-card img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-wait { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
.${P}-wait i { display: block; width: 13px; height: 13px; box-sizing: border-box; border-radius: 50%; border: 1.6px solid #c3c3c8; border-top-color: #f2f2f4; }
.${P}-wait span { font-size: 6.5px; line-height: 9px; color: #8e8e93; white-space: nowrap; }
.${P}-ac { display: none; justify-content: center; gap: 5px; height: 11px; margin-top: 2px; }
.${P}-ac i { display: block; width: 6px; height: 6px; box-sizing: border-box; margin-top: 2px; border: 1px solid #8e8e93; border-radius: 2px; }
.${P}-ac i:nth-child(2) { border-radius: 50%; }
.${P}-ac i:nth-child(4) { border-radius: 2px 2px 2px 6px; }
`;

const RAIL = ['对话', '视觉生成', '模型接入', '开源模型', '创作工具'];

export default {
  id: 'hunyuan',
  label: 'Hunyuan (Tencent)',
  source: {
    platform: 'Tencent Hunyuan (腾讯混元) 视觉生成 image playground, light web app',
    feature: 'Preview panel: a small grey spinner with the single line 任务排队中… while the 立即生成 pill is greyed, then an instant in-place swap to a white bordered result card with a four-icon action row and the pill black again (adapted to a grid of 10 slots swapping in order)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1AjnfzuETh', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'hunyuan');
    const slot = (g, i) => `<div class="${P}-s"><div class="${P}-card"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-wait"><i></i><span>任务排队中…</span></div></div><div class="${P}-ac"><i></i><i></i><i></i><i></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><i></i><b>混元</b>视觉生成 &gt; 体验</div><div class="${P}-bd"><div class="${P}-rail">${RAIL.map((r, k) => `<div${k === 1 ? ` class="${P}-on"` : ''}>${r}</div>`).join('')}</div><div class="${P}-cmp"><div class="${P}-lab">当前模型</div><div class="${P}-box">HunyuanImage 3.0</div><div class="${P}-lab">尺寸 (Aspect Ratio)</div><div class="${P}-box">3:4<s></s></div><div class="${P}-lab">数量 (Number)</div><div class="${P}-box">${tiles.length}<s></s></div><div class="${P}-go">立即生成</div></div><div class="${P}-pv"><div class="${P}-ti">预览效果</div><div class="${P}-emp"><i></i>暂无内容<span>开始生成试试吧~</span></div><div class="${P}-gr">${tiles.map(slot).join('')}</div></div></div></div>`);
    const emp = root.querySelector(`.${P}-emp`), gr = root.querySelector(`.${P}-gr`), go = root.querySelector(`.${P}-go`);
    const cells = [...root.querySelectorAll(`.${P}-s`)].map((n, i) => ({
      im: n.querySelector('img'), wait: n.querySelector(`.${P}-wait`), sp: n.querySelector(`.${P}-wait i`), ac: n.querySelector(`.${P}-ac`),
      card: n.querySelector(`.${P}-card`), g: tiles[i], done: null,
    }));
    ctx.gate(cells.map((c) => c.im));
    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const started = t >= ctx.seq(0)[0], finished = t >= ctx.lastLand;
        // idle: the empty-box panel and a black pill; submitted: the ten slots appear, queued, and the pill greys out
        put('start', started, (on) => { emp.style.display = on ? 'none' : 'flex'; gr.style.display = on ? 'grid' : 'none'; });
        put('pill', started && !finished, (busy) => {
          go.style.background = busy ? '#ececec' : '#111';
          go.style.color = busy ? '#a9a9ae' : '#fff';
        });
        cells.forEach((c, i) => {
          // an instant in-place swap at the end of the slot's window: spinner and queue line out, bordered result card in
          const done = t >= ctx.seq(i)[1];
          if (done !== c.done) {
            c.im.style.display = done ? 'block' : 'none';
            c.wait.style.display = done ? 'none' : 'flex';
            c.ac.style.display = done ? 'flex' : 'none';
            c.card.style.background = done ? '#fff' : 'transparent';
            c.card.style.boxShadow = done ? '0 0 0 1px #e6e6ea' : 'none';
            c.done = done;
          }
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the spinner turns while the slot waits, each a little out of step
          if (!done) c.sp.style.transform = `rotate(${((t * 360 + i * 41) % 360).toFixed(1)}deg)`;
        });
      },
    };
  },
};
