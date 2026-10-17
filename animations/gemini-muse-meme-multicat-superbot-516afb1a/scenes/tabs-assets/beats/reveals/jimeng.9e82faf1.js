// Jimeng (即梦) as its PHONE app shows it, the '想象' feed (bilibili BV19aXbBBEtN t78.6-83.0s; spec .tmp/clone-9e82faf1/reveal-refs/jimeng/
// spec.json, confidence 0.75; frames g1_pending_t80.00, g1_gen69/71/76, g1_pending_sheet*): a near-black #0D0D0F screen with the
// title '想象' and two line icons on top, a feed of generation cards, a composer bar under it. A new card is inserted at the TOP
// of the feed: a flat pastel pink-to-blue gradient tile; then the tile shimmers with a small white '排队中…' top-left and, under
// it, the status line '正在准备生成中，预计等…'; then the tile shows a heavily blurred, shimmering version of the image with a small
// white percentage top-left (69% .. 83% observed, the label sits where '排队中…' sat); then an INSTANT swap to the sharp 9:16
// image, overlay gone, a '图片 3.0  9:16' chip and two text buttons '重新编辑' / '再次生成' beside it. The capture stops counting at 83%
// before the swap, so no 100% frame is drawn. The membership upsell link beside the status line is left out.
// Adapted to ten images: ten cards are inserted at the top in turn (each a compact row so a phone-width column holds several),
// each running that sequence, so the images land in order; the older rows are pushed down and out of the screen as new ones arrive.
// Drawn in the system UI face with plain shapes: none of the app's icons, logo or fonts is drawn or shipped.
import { lerp, seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-jm';
const TW = 46, TH = 82, ROW = 90;      // a card's tile (9:16) and its row pitch, px
const FEED_H = Math.round(ROW * 3.5);  // the feed's visible height
const PHONE_W = 300;
const CSS = `
.${P} { box-sizing: border-box; display: flex; justify-content: center; width: 560px; max-width: 100%; padding: 12px; border-radius: 14px; background: #050506; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-ph { position: relative; box-sizing: border-box; flex: none; width: ${PHONE_W}px; max-width: 100%; border-radius: 20px; background: #0d0d0f; box-shadow: 0 0 0 1px #1d1d21; overflow: hidden; color: #e6e6ea; }
.${P}-bar { display: flex; align-items: center; justify-content: space-between; height: 36px; padding: 0 14px; }
.${P}-bar b { font-size: 15px; font-weight: 600; color: #f3f3f5; }
.${P}-bar svg { width: 15px; height: 15px; margin-left: 12px; fill: none; stroke: #d9d9de; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vertical-align: middle; }
.${P}-feed { position: relative; height: ${FEED_H}px; margin: 0 10px; overflow: hidden; }
.${P}-c { position: absolute; left: 0; right: 0; top: 0; height: ${ROW}px; box-sizing: border-box; padding: 4px 0; display: none; }
.${P}-t { position: absolute; left: 0; top: 4px; width: ${TW}px; height: ${TH}px; border-radius: 8px; overflow: hidden; background: linear-gradient(160deg, #e6a9bf 0%, #b7b3e6 52%, #9fbfee 100%); }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-sh { position: absolute; top: 0; bottom: 0; left: 0; width: 70%; display: none; background: linear-gradient(100deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .42), rgba(255, 255, 255, 0)); }
.${P}-lb { position: absolute; left: 4px; top: 4px; display: none; font-size: 8px; line-height: 10px; font-weight: 500; color: #fff; white-space: nowrap; text-shadow: 0 0 4px rgba(0, 0, 0, .35); }
.${P}-i { position: absolute; left: ${TW + 10}px; right: 0; top: 4px; height: ${TH}px; display: flex; flex-direction: column; min-width: 0; }
.${P}-cap { font-size: 8.5px; line-height: 11px; color: #6c6c73; }
.${P}-pr { margin-top: 2px; font-size: 9.5px; line-height: 12.5px; color: #d7d7dc; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.${P}-ch { margin-top: 3px; font-size: 8.5px; line-height: 12px; color: #6c6c73; }
.${P}-ch span { padding: 1px 5px; border-radius: 5px; background: #1a1a1d; }
.${P}-bt { display: none; gap: 5px; margin-top: auto; white-space: nowrap; }
.${P}-bt span { height: 17px; padding: 0 7px; border-radius: 9px; background: #1c1c1f; font-size: 9px; line-height: 17px; color: #d2d2d7; }
.${P}-st { display: none; margin-top: auto; align-items: center; gap: 4px; font-size: 8.5px; line-height: 12px; color: #6c6c73; white-space: nowrap; overflow: hidden; }
.${P}-st i { flex: none; width: 8px; height: 8px; box-sizing: border-box; border-radius: 50%; border: 1px solid #6c6c73; }
.${P}-cp { display: flex; align-items: center; gap: 7px; height: 28px; margin: 7px 10px 10px; padding: 0 10px; border-radius: 14px; background: #161619; font-size: 9.5px; color: #6f6f76; white-space: nowrap; overflow: hidden; }
.${P}-cp em { flex: none; font-style: normal; color: #5ec7d6; }
.${P}-cp span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-cp i { flex: none; width: 10px; height: 10px; background: #8fd4ff; transform: rotate(45deg) scale(.8); border-radius: 2px; }
`;

const PROMPT = 'Make my meme into a ten-image set';
const LIFE = 0.4;       // a card's run (insertion to the swap) as a share of the beat's span, so about four cards run at once
const FLAT = 0.06;      // the share of a run spent as the flat gradient tile
const QUEUE = 0.3;      // ... up to which the tile is queued (shimmer, '排队中…', the status line)
const P0 = 69, P1 = 83; // the counter's observed range; it is not carried to 100
const BLUR = 14;        // px, heavy as in the frames
const FUNNEL = '<svg viewBox="0 0 16 16"><path d="M2 3h12l-4.6 5.4V13l-2.8-1.4V8.4z"/></svg>';
const FOLDER = '<svg viewBox="0 0 16 16"><path d="M2 4.5h4l1.4 1.5H14v6.5H2z"/></svg>';

export default {
  id: 'jimeng',
  label: 'Jimeng (app)',
  source: {
    platform: 'Jimeng (即梦) phone app, the 想象 feed (dark theme)',
    feature: 'A new card inserted at the top of the feed: flat gradient tile, shimmer with 排队中… and the status line, a blurred shimmering preview with a counting percentage (to the low 80s), then an instant swap to the sharp image with its buttons (adapted to 10 cards inserted in turn, landing in order)',
    refs: [{ url: 'https://www.bilibili.com/video/BV19aXbBBEtN', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'jimeng');
    const card = (g, i) => `<div class="${P}-c"><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><i class="${P}-sh"></i><span class="${P}-lb"></span></div><div class="${P}-i"><div class="${P}-cap">图片生成</div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-ch"><span>图片 3.0  9:16</span></div><div class="${P}-bt"><span>重新编辑</span><span>再次生成</span></div><div class="${P}-st"><i></i>正在准备生成中，预计等…</div></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ph"><div class="${P}-bar"><b>想象</b><span>${FUNNEL}${FOLDER}</span></div><div class="${P}-feed">${tiles.map(card).join('')}</div><div class="${P}-cp"><em>图片生成</em><span>请输入你想要生成的画面…</span><i></i></div></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({
      n, im: n.querySelector('img'), sh: n.querySelector(`.${P}-sh`), lb: n.querySelector(`.${P}-lb`),
      bt: n.querySelector(`.${P}-bt`), st: n.querySelector(`.${P}-st`), g: tiles[i], phase: '', text: null, top: null,
    }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        // card i is inserted at A(i) and swaps to its sharp image at B(i) = A(i) + run; the last swap is lastLand
        const S = ctx.seq(0)[0], E = ctx.lastLand, run = LIFE * (E - S), step = (E - S - run) / (cells.length - 1);
        const A = (i) => S + i * step;
        let n = 0;
        while (n < cells.length && t >= A(n)) n++;
        cells.forEach((c, i) => {
          const a = A(i), b = a + run;
          const u = (t - a) / (b - a);
          const phase = u < 0 ? 'off' : u >= 1 ? 'done' : u < FLAT ? 'flat' : u < QUEUE ? 'queue' : 'gen';
          if (phase === 'off') {
            if (c.phase !== 'off') { c.n.style.display = 'none'; c.phase = 'off'; }
            return;
          }
          // a card's row: the newest sits at the top, each later insertion pushes it one row down
          const top = (n - 1 - i) * ROW;
          if (c.top !== top) { c.n.style.top = `${top}px`; c.top = top; }
          if (c.phase === 'off' || c.phase === '') c.n.style.display = 'block';
          if (phase !== c.phase) {
            const done = phase === 'done', gen = phase === 'gen', q = phase === 'queue';
            c.im.style.display = gen || done ? 'block' : 'none';
            c.sh.style.display = q || gen ? 'block' : 'none';
            c.lb.style.display = q || gen ? 'block' : 'none';
            c.bt.style.display = gen || done ? 'flex' : 'none';
            c.st.style.display = q ? 'flex' : 'none';
            c.phase = phase;
          }
          if (phase === 'done') {
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
            return;
          }
          if (phase === 'flat') return;
          // the sheen sweeps across the tile, each card a little out of step with its neighbours
          const sw = (t * 1.5 + i * 0.21) % 1;
          c.sh.style.transform = `translateX(${lerp(-TW * 0.8, TW * 1.1, sw).toFixed(1)}px)`;
          let label;
          if (phase === 'queue') {
            label = '排队中…';
          } else {
            // the counter climbs to the low 80s; the swap to the sharp image comes before any 100%
            const p = seg(u, QUEUE, 1);
            label = `${Math.min(P1, P0 + Math.floor((P1 - P0 + 1) * p))}%`;
            c.im.style.filter = `blur(${BLUR}px) saturate(.9) brightness(${(0.92 + 0.08 * Math.sin(t * 9 + i)).toFixed(3)}) ${c.g.grade}`.trim();
            c.im.style.transform = `scale(${(c.g.zoom * 1.25).toFixed(4)})`;
          }
          if (c.text !== label) { c.lb.textContent = label; c.text = label; }
        });
      },
    };
  },
};
