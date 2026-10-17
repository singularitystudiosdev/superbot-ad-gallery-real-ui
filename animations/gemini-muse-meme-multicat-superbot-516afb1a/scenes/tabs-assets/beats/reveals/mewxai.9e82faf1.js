// MewXAI AI绘画 (mewxai.cn), an independent AI art app (NOT a Meitu product), as shown in the app's own promo on Bilibili (MewXAI official account,
// BV1PW4y1c7wm, 2024-01-24, t=23.0-25.0 s; spec .tmp/clone-9e82faf1/reveal-refs/meitu/spec.json (filed under the id 'meitu'), confidence 0.60;
// frames p_mewx_gen10.png, p_mewx_gen20.png, p_mewx_result.png). After 生成 the phone app opens its 作品详情 overlay: a black top bar with the title and a
// '...' | ring control pill, then the work's area, where the target picture sits as a heavily blurred, darkened full-bleed backdrop (no sharp preview),
// a small black circular badge with a thin blue arc along its edge and a whole-number percentage in white (10%, a beat later 20%), under it a large
// gold caption with an orange outline, '壁纸就在AI生成中了~'; below the area a 关键词 (keywords) block ending in a 复制 chip. No skeleton, shimmer or bar:
// the ring is the only progress cue, and the overlay clears to the finished picture in a hard cut (~2 s on screen in an edited promo).
// Adapted to ten images: ten 作品详情 cards in a 5 x 2 block, each with its own blurred backdrop, ring and caption, landing one at a time on
// ctx.seq(i); the keywords block sits under the cards. Omitted: the grey hint line about the lightning 高速通道 (fast lane) toggle, an upsell, and the
// creator's burned-in MewXAI / bilibili marks. No MewXAI logo is drawn; the system UI face stands in for its caption face, and every picture is OUR meme.
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mx';
const CJK = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC'";
const ROOT_H = 424;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 16px; overflow: hidden; background: #000; color: #f2f2f4; font-family: ${UI_FONT}, ${CJK}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px #24262c; }
.${P}-top { flex: none; display: flex; align-items: center; height: 44px; padding: 0 12px; }
.${P}-back { flex: none; width: 24px; }
.${P}-back svg { display: block; width: 14px; height: 14px; fill: none; stroke: #f2f2f4; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ttl { flex: 1; text-align: center; font-size: 13px; font-weight: 600; color: #fff; }
.${P}-pill { flex: none; display: flex; align-items: center; justify-content: center; gap: 9px; box-sizing: border-box; width: 62px; height: 24px; border-radius: 12px; box-shadow: inset 0 0 0 1px #4a4c54; }
.${P}-pill i { display: block; width: 2.6px; height: 2.6px; border-radius: 50%; background: #fff; box-shadow: -5px 0 #fff, 5px 0 #fff; margin: 0 5px; }
.${P}-pill b { display: block; width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px #fff; }
.${P}-pill b::after { content: ""; display: block; width: 4.6px; height: 4.6px; margin: 3.2px; border-radius: 50%; background: #fff; }
.${P}-grid { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin: 0 12px; }
.${P}-c { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #111318; }
.${P}-c img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ov { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.${P}-ring { position: relative; flex: none; width: 36px; height: 36px; border-radius: 50%; }
.${P}-ring::before { content: ""; position: absolute; inset: 3px; border-radius: 50%; background: #15171c; }
.${P}-pc { position: absolute; inset: 0; display: grid; place-items: center; font-size: 8.5px; line-height: 10px; font-weight: 500; font-variant-numeric: tabular-nums; color: #fff; }
.${P}-cap { padding: 0 2px; font-size: 8.4px; line-height: 12px; font-weight: 800; white-space: nowrap; text-align: center; color: #ffd98a; text-shadow: -.6px -.6px 0 #e8761a, .6px -.6px 0 #e8761a, -.6px .6px 0 #e8761a, .6px .6px 0 #e8761a, 0 0 4px rgba(255, 170, 60, .75); }
.${P}-kw { flex: none; margin: 12px 12px 0; padding-top: 10px; border-top: 1px solid #2a2c32; font-size: 10px; line-height: 17px; color: #a3a5ad; }
.${P}-kw b { font-weight: 400; color: #85878f; }
.${P}-kw span { display: inline-block; box-sizing: border-box; margin-left: 4px; padding: 0 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px #4a4c54; font-size: 9px; line-height: 15px; color: #d4d6dc; }
`;

const KEYWORDS = '梗图，缪斯在阶梯教室里举着手写便条，动漫美学，色彩明快，32k uhd';
const CAPTION = '壁纸就在AI生成中了~';
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// a card's percentage as a function of how far through its own ramp it is: it opens on the footage's 10% and climbs by an ease-out to 99, never
// 100 before the picture is in (only 10% and 20% are observed; the rest is extrapolated)
const percent = (u) => Math.min(99, 10 + Math.floor(89 * (1 - (1 - clamp01(u)) * (1 - clamp01(u)))));

export default {
  id: 'mewxai',
  label: 'MewXAI (2024)',
  source: {
    platform: 'MewXAI AI绘画 (mewxai.cn), an independent AI art app (not a Meitu product), mobile 作品详情 overlay, dark theme; the app\'s own promo on Bilibili (MewXAI official account, 2024-01-24)',
    feature: "作品详情 overlay while generating: the target picture as a heavily blurred, darkened backdrop (no sharp preview), a small black circular percentage ring with a thin blue arc counting up (10%, then 20%) and the gold outlined caption '壁纸就在AI生成中了~', clearing to the finished picture in a hard cut (adapted to 10: ten cards in a 5 x 2 block, each with its own ring and caption, landing one at a time in strict sequence; the lightning 高速通道 hint is omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1PW4y1c7wm', retrieved: '2026-10-14' }],
    // the footage is an edited ~2 s beat of ONE overlay: only 10% and 20% and the cut to the picture are observed
    extrapolated: [
      'the percentage ramp after 20% (an ease-out climb to 99% as each card lands); the footage samples only 10% and 20%',
      'ten cards, their 5 x 2 block and their one-at-a-time landing order (the footage is a single full-screen overlay)',
      'the caption kept as the footage\'s fixed string for every card (the app likely substitutes the prompt\'s subject for 壁纸; seen once)',
      'the keywords line under the cards (the footage shows its own prompt there; ours is our own meme prompt)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'mewxai');
    const card = (g, i) => `<div class="${P}-c"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-ov"><div class="${P}-ring"><span class="${P}-pc"></span></div><div class="${P}-cap">${CAPTION}</div></div></div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-top"><span class="${P}-back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></span><span class="${P}-ttl">作品详情</span><span class="${P}-pill"><i></i><b></b></span></div>
<div class="${P}-grid">${tiles.map(card).join('')}</div>
<div class="${P}-kw"><b>关键词：</b>${x.esc(KEYWORDS)}<span>复制</span></div>
</div>`);

    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({
      im: n.querySelector('img'), ov: n.querySelector(`.${P}-ov`), ring: n.querySelector(`.${P}-ring`), pc: n.querySelector(`.${P}-pc`), g: tiles[i],
    }));
    ctx.gate(cells.map((c) => c.im));

    const tStart = Math.min(ctx.cardIn, ctx.seq(0)[0]);
    // each card's ramp ends exactly when it lands and starts a hair before the block appears (a seeded 0-0.12 s), so the rings open near the footage's 10% and each climbs to its landing
    const ramps = cells.map((_, i) => ({ a: tStart - 0.12 * hash(53, i), e: ctx.seq(i)[1] }));

    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          const landed = t >= ctx.seq(i)[1];
          put(`l${i}`, landed, (v) => {
            c.ov.style.visibility = v ? 'hidden' : 'visible';
            // pending: the card's own picture as a heavily blurred, darkened backdrop; landed: sharp at its crop, the hard cut
            c.im.style.filter = v ? restFilter(c.g) : 'blur(9px) brightness(.55)';
            c.im.style.transform = v ? restTransform(c.g) : `scale(${(c.g.zoom * 1.25).toFixed(4)})`;
          });
          const r = ramps[i];
          const p = percent((t - r.a) / (r.e - r.a));
          put(`p${i}`, landed ? 100 : p, (v) => {
            c.pc.textContent = `${v}%`;
            c.ring.style.background = `conic-gradient(#3d7bff 0 ${v}%, #2a2d36 0)`;
          });
        });
      },
    };
  },
};
