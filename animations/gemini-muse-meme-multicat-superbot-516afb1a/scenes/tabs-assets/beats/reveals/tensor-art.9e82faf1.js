// Tensor.Art's web app (spec .tmp/clone-9e82faf1/reveal-refs/tensor-art/spec.json, confidence 0.5; Bilibili BV1gw411P7Bd, 2023-11-20,
// frames in reveal-refs/tensor-art/frames/ and the bili_BV1gw411P7Bd sheet). A near-black two-column app: a composer panel at
// the left (model block, prompt, size buttons, sampler sliders, a teal '在线生成' button) and the output feed at the right.
// Clicking the button shows a green '生成任务提交成功' toast and inserts a pending tile at the top of the feed: a flat #2B2B2B rounded
// tile, a centred thin ring reading '0%' and a slow diagonal shimmer. Then the tile shows the image with a WHITE circular % ring
// overlaid (counting up to 99%) and an amber '生成中' badge after the post's timestamp; at 100% the ring and the badge both clear
// and only the finished image is left. No wait string, no timer.
// Adapted to ten images: ten tiles in the feed (a 5 x 2 block of portrait tiles, each under its own timestamp line), queued
// one after another in order, then each generating (image + counting ring + amber badge) on the beat's overlapping cascade and
// clearing when it completes. The composer is plain controls and the face is the system UI stack: none of Tensor.Art's logo,
// wordmark or fonts is drawn or shipped.
import { clamp, seg, lerp, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ta';
const H = 236, LEFT = 176, RING = 36;   // px
const CIRC = 2 * Math.PI * 15;           // the ring's circumference in its 36-unit viewBox
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; gap: 8px; width: 560px; max-width: 100%; height: ${H}px; padding: 8px; border-radius: 12px; background: #171717; color: #d6d6d6; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-L { flex: none; box-sizing: border-box; width: ${LEFT}px; display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 10px; background: #212121; }
.${P}-md { display: flex; gap: 8px; align-items: center; height: 34px; }
.${P}-md i { flex: none; width: 34px; height: 34px; border-radius: 8px; background: #3a3a3a; }
.${P}-md span { flex: 1; display: grid; gap: 5px; }
.${P}-md b { display: block; height: 5px; border-radius: 3px; background: #3a3a3a; }
.${P}-md b + b { width: 60%; background: #2e2e2e; }
.${P}-pr { height: 52px; box-sizing: border-box; padding: 7px 8px; border-radius: 8px; background: #181818; font-size: 9.5px; line-height: 13px; color: #a8a8a8; overflow: hidden; }
.${P}-lb { font-size: 9px; line-height: 12px; color: #8a8a8a; }
.${P}-ch { display: flex; gap: 5px; margin-top: 3px; }
.${P}-ch i { flex: 1; height: 20px; border-radius: 6px; background: #2d2d2d; }
.${P}-ch i:first-child { background: #1d5f63; box-shadow: inset 0 0 0 1px #2bb7b0; }
.${P}-sl { position: relative; height: 3px; margin-top: 8px; border-radius: 2px; background: #333; }
.${P}-sl i { position: absolute; left: 0; top: 0; bottom: 0; width: 40%; border-radius: 2px; background: #2bb7b0; }
.${P}-sl i::after { content: ""; position: absolute; right: -4px; top: -3px; width: 9px; height: 9px; border-radius: 50%; background: #e8e8e8; }
.${P}-go { margin-top: auto; height: 30px; display: grid; place-items: center; border-radius: 8px; background: #1fc7b6; color: #04211f; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.${P}-R { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-auto-rows: min-content; gap: 10px 6px; align-content: start; padding: 16px 4px 0; }
.${P}-c { visibility: hidden; }
.${P}-hd { display: flex; align-items: center; gap: 4px; height: 10px; margin-bottom: 3px; font-size: 7.5px; line-height: 10px; color: #8a8a8a; white-space: nowrap; }
.${P}-hd u { display: none; text-decoration: none; color: #f2a51f; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #2b2b2b; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-pd { position: absolute; inset: 0; background: #2b2b2b; overflow: hidden; }
.${P}-sh { position: absolute; top: -20%; bottom: -20%; left: 0; width: 55%; background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .06), rgba(255, 255, 255, 0)); transform: skewX(-22deg); }
.${P}-rg { position: absolute; left: 50%; top: 50%; width: ${RING}px; height: ${RING}px; margin: -${RING / 2}px 0 0 -${RING / 2}px; display: none; place-items: center; font-size: 9.5px; font-weight: 600; font-variant-numeric: tabular-nums; color: #d6d6d6; }
.${P}-rg svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); fill: none; stroke-width: 2; }
.${P}-rg .k { stroke: rgba(228, 228, 231, .3); }
.${P}-rg .v { stroke: #e4e4e7; stroke-linecap: round; stroke-dasharray: ${CIRC.toFixed(3)}; }
.${P}-rg.${P}-on { color: #fff; filter: drop-shadow(0 0 2px rgba(0, 0, 0, .55)); }
.${P}-rg.${P}-on .k { stroke: rgba(255, 255, 255, .35); }
.${P}-rg.${P}-on .v { stroke: #fff; }
.${P}-toast { position: absolute; left: ${LEFT + 20}px; right: 12px; margin: 0 auto; width: max-content; top: 4px; display: none; height: 14px; padding: 0 8px; border-radius: 5px; background: #1f8f5a; color: #eafff4; font-size: 8.5px; font-weight: 600; line-height: 14px; white-space: nowrap; z-index: 2; }
`;

const PROMPT = 'masterpiece, best quality, a legendary meme, studio light';
const TIME = '22:21';
// the beat in layout seconds from the card's entrance, stretched to the real cardIn .. lastLand window
const REF = 1.84;
const PRESS = [0.04, 0.14];            // the teal button is pressed
const TOAST = [0.12, 1.0];             // '生成任务提交成功' shows
const QUEUE0 = 0.14, QUEUE_GAP = 0.012;  // tile i is queued (the flat tile with its '0%' ring) from here, one after another
const GEN0 = 0.25, GEN_GAP = 0.11, GEN_LEN = 0.6;   // tile i generates on the beat's cascade: the image, the counting ring and the amber badge
const SHEEN_S = 1.6;                   // seconds per shimmer sweep

export default {
  id: 'tensor-art',
  label: 'Tensor.art',
  source: {
    platform: "Tensor.Art's web app (model run page, dark theme)",
    feature: "'在线生成' pressed: a pending tile (flat dark tile, centred '0%' ring, slow shimmer) in the output feed, then the image with a white circular % ring and an amber '生成中' badge, both clearing on completion (adapted to 10 tiles in the feed, in order)",
    refs: [
      { url: 'https://www.bilibili.com/video/BV1gw411P7Bd', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'tensor-art');
    const ring = `<span class="${P}-rg"><svg viewBox="0 0 36 36"><circle class="k" cx="18" cy="18" r="15"/><circle class="v" cx="18" cy="18" r="15"/></svg><span>0%</span></span>`;
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-hd"><span>${TIME}</span><u>生成中</u></div><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-pd"><i class="${P}-sh"></i></div>${ring}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-L"><div class="${P}-md"><i></i><span><b></b><b></b></span></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div><div class="${P}-lb">图片大小</div><div class="${P}-ch"><i></i><i></i><i></i></div></div><div><div class="${P}-lb">采样次数</div><div class="${P}-sl"><i></i></div></div><div class="${P}-go">在线生成</div></div><div class="${P}-R">${tiles.map(cell).join('')}</div><div class="${P}-toast">生成任务提交成功</div></div>`);
    const go = root.querySelector(`.${P}-go`), toast = root.querySelector(`.${P}-toast`);
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({
      el: n, im: n.querySelector('img'), pd: n.querySelector(`.${P}-pd`), sh: n.querySelector(`.${P}-sh`), bd: n.querySelector(`.${P}-hd u`),
      rg: n.querySelector(`.${P}-rg`), v: n.querySelector(`.${P}-rg .v`), num: n.querySelector(`.${P}-rg > span`), g: tiles[i], state: '', pct: -1, sheen: '',
    }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        const L = ctx.lastLand - ctx.cardIn, k = L / REF;
        const s = (t - ctx.cardIn) / k;

        // the teal button dips on the press; the green submit toast comes and goes
        const pp = seg(s, ...PRESS);
        go.style.transform = pp > 0 && pp < 1 ? `scale(${(1 - 0.06 * Math.sin(Math.PI * pp)).toFixed(4)})` : 'none';
        const tOn = s >= TOAST[0] && s < TOAST[1];
        if (toast.style.display !== (tOn ? 'block' : 'none')) { toast.style.display = tOn ? 'block' : 'none'; if (!tOn) toast.style.opacity = ''; }
        if (tOn) toast.style.opacity = Math.min(seg(s, TOAST[0], TOAST[0] + 0.08), 1 - seg(s, TOAST[1] - 0.15, TOAST[1])).toFixed(3);

        cells.forEach((c, i) => {
          const q = QUEUE0 + i * QUEUE_GAP;
          const a = GEN0 + i * GEN_GAP, b = a + GEN_LEN;
          const state = s < q ? 'hidden' : s < a ? 'queued' : s < b ? 'gen' : 'done';
          if (c.state !== state) {
            c.state = state;
            c.el.style.visibility = state === 'hidden' ? 'hidden' : 'visible';
            c.im.style.display = state === 'gen' || state === 'done' ? 'block' : 'none';
            c.pd.style.display = state === 'queued' || state === 'hidden' ? '' : 'none';
            c.rg.style.display = state === 'queued' || state === 'gen' ? 'grid' : 'none';
            c.rg.classList.toggle(`${P}-on`, state === 'gen');
            c.bd.style.display = state === 'gen' ? 'inline' : 'none';
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
            if (state !== 'gen') { c.pct = -1; c.num.textContent = '0%'; c.v.style.strokeDashoffset = state === 'queued' ? CIRC.toFixed(3) : ''; }
            if (state !== 'queued' && c.sheen) { c.sh.style.left = ''; c.sheen = ''; }
          }
          if (state === 'queued') {
            // the flat tile's slow diagonal shimmer
            const f = (((t - ctx.cardIn) / SHEEN_S) + i * 0.07) % 1;
            const left = `${lerp(-60, 125, f).toFixed(2)}%`;
            if (c.sheen !== left) { c.sh.style.left = left; c.sheen = left; }
          } else if (state === 'gen') {
            // the ring counts up to 99%, then the ring and the badge clear with the finished image
            const p = clamp((s - a) / (GEN_LEN - 0.05));
            const pct = Math.min(99, Math.floor(100 * outCubic(p) * 0.5 + 100 * p * 0.5));
            if (c.pct !== pct) {
              c.pct = pct;
              c.num.textContent = `${pct}%`;
              c.v.style.strokeDashoffset = (CIRC * (1 - pct / 100)).toFixed(3);
            }
          }
        });
      },
    };
  },
};
