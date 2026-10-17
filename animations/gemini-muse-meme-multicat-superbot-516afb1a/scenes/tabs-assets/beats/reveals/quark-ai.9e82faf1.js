// AI生图 in Quark's (夸克) AI search answer card (the official 夸克_Quark promo on Bilibili, BV1RF9hYQEB2, 2025-03-02, t=10.13-11.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/quark-ai/spec.json, confidence 0.55; frames wz2_quark_t10.13_pending_1pct.png, wz2_quark_t10.33_pending_24pct.png,
// wz2_quark_t10.53_pending_50pct.png, wz2_quark_t10.87_pending_90pct.png, wz2_quark_status_chip_zoom_t10.53.png, wz2_quark_t11.6_landed.png).
// A near-white phone answer page: the prompt as a two-line header ('情绪人像风格，一个女孩身穿白色连衣裙，站在古老斑驳的石...'), a pale
// chip row 'AI搜索 · 图片正在生成中 摄影 4:3 高清' (bold blue 'AI' and blue style / size / quality parameters, grey text, a chevron), a
// '回答' heading with a small list glyph, the grey line '已为您自动润色提示词，并完成以下创作' and an image slot filled with a barely
// there pale grey (#F8F8F8) carrying a small image-generating icon and an integer percentage that counts up under it (1 -> 90 % in
// non-linear steps, about 0.85 s in the promo's time-compressed cut). The slot is then replaced by the finished 4:3 picture in one
// frame and the chip reads '图像生成' instead of '图片正在生成中'. A bottom bar carries back / pages icons, a pill with the prompt and
// grid / menu icons; before the answer the composer shows the prompt with a blue send button.
// Adapted to ten images: ten 4:3 slots in a 4 + 4 + 2 block, each counting up on its own curve (later tiles count more slowly, so
// they reach 99 % at their own landing moment, never going down) and hard-swapping to its picture in reading order; the chip changes
// when the tenth is there. Omitted: the corner watermark the finished picture carries, the phone frame, the blur of the composer
// leaving, the creator's captions. The promo's picture is never reproduced: every tile is our own meme, and no logo, wordmark or
// platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-qrk';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 500, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fcfdfe; color: #1c1f24; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e8ecf2; }
.${P}-main { flex: 1; min-height: 0; padding: 14px 20px 0; }
.${P}-ask { margin: 0; font-size: 16px; font-weight: 400; line-height: 23px; color: #22262b; }
.${P}-chip { display: flex; align-items: center; box-sizing: border-box; height: 30px; margin-top: 10px; padding: 0 14px; border-radius: 10px; background: #f3f6fb; font-size: 12px; color: #6d737b; white-space: nowrap; }
.${P}-chip b { font-weight: 700; color: #1f5fe0; }
.${P}-chip b.${P}-sp { margin-left: 3px; }
.${P}-chip svg { margin-left: auto; width: 11px; height: 11px; fill: none; stroke: #4a4f56; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ans { display: flex; align-items: center; gap: 7px; margin-top: 12px; height: 22px; font-size: 14.5px; font-weight: 700; color: #14171b; }
.${P}-ans svg { width: 13px; height: 11px; fill: none; stroke: #6d737b; stroke-width: 1.6; stroke-linecap: round; }
.${P}-note { margin-top: 6px; height: 17px; font-size: 12px; line-height: 17px; color: #8a9098; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 7px; overflow: hidden; background: #f8f8f8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #f8f8f8; }
.${P}-pend svg { width: 16px; height: 16px; fill: none; stroke: #2b2f35; stroke-width: 1.4; stroke-linejoin: round; stroke-linecap: round; }
.${P}-pend b { font-size: 10px; font-weight: 600; line-height: 12px; color: #2b2f35; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 22px 6px; }
.${P}-bar svg { flex: none; width: 17px; height: 17px; fill: none; stroke: #3b4047; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pill { flex: 1; box-sizing: border-box; display: flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 18px; box-shadow: inset 0 0 0 1px #2b2f35; background: #ffffff; font-size: 13px; color: #1c1f24; white-space: nowrap; overflow: hidden; }
.${P}-nv { display: flex; gap: 12px; }
.${P}-send { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #2b7bff; }
.${P}-send svg { width: 15px; height: 15px; stroke: #ffffff; stroke-width: 2.1; }
`;

const PROMPT = '情绪人像风格，一个女孩身穿白色连衣裙，站在古老斑驳的石...';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the blue send button is pressed
const ISSUE = 0.16;                               // the answer page: chip, 回答, grey line and ten pale slots, all counting from 1 %
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // slot i's picture replaces it (reading order), the last at 1.68
const CHEV = '<svg viewBox="0 0 12 12"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
const ICON = '<svg viewBox="0 0 16 16"><path d="M2 5.2V2.8h9.4a1 1 0 0 1 1 1V9"/><path d="M2 5.2h8.4a1 1 0 0 1 1 1V13H3a1 1 0 0 1-1-1z"/><path d="M13.4 10.6l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/></svg>';

export default {
  id: 'quark-ai',
  label: 'Quark 夸克 AI生图 (2025)',
  source: {
    platform: "Quark (夸克) AI search app, an AI生图 answer card on a phone (the official 夸克_Quark promo on Bilibili, 2025-03-02, 480x852)",
    feature: "near-white answer page: the prompt header, a pale chip row 'AI搜索 · 图片正在生成中 摄影 4:3 高清', '回答', the grey line '已为您自动润色提示词，并完成以下创作' and a pale #F8F8F8 image slot with a small icon and an integer percentage counting up (1 -> 90 %), hard-swapping to the finished 4:3 picture while the chip reads '图像生成' (adapted to 10: a 4 + 4 + 2 block of slots, each counting on its own curve and swapping in reading order)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1RF9hYQEB2', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten 4:3 slots in a 4 + 4 + 2 block (the promo shows one large slot)",
      "each slot's own percentage curve and its swap moment in reading order (the promo has one counter and one swap, about 0.85 s apart)",
      "the chip text changing once the tenth picture is there (in the promo it changes with the single swap)",
      "the pre-answer composer state (prompt pill with a blue send button) and the bottom bar's icons, read from a 480 x 852 cut",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'quark-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${ICON}<b>1%</b></div></div>`;
    const back = '<svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5"/></svg>';
    const pages = '<svg viewBox="0 0 16 16"><path d="M5 2.5h7a1 1 0 0 1 1 1V11"/><path d="M3 5.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>';
    const grid = '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1.2"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1.2"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1.2"/><rect x="9" y="9" width="4.5" height="4.5" rx="1.2"/></svg>';
    const menu = '<svg viewBox="0 0 16 16"><path d="M2.5 4h11M5 8h8.5M7.5 12h6"/></svg>';
    const up = '<svg viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
    const list = '<svg viewBox="0 0 13 11"><path d="M1 1.5h11M1 5.5h8M1 9.5h5"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-main"><div class="${P}-body" style="visibility: hidden"><p class="${P}-ask">${x.esc(PROMPT)}</p><div class="${P}-chip">AI搜索 · <span class="${P}-st">图片正在生成中</span><b class="${P}-sp">摄影</b><b class="${P}-sp">4:3</b><b class="${P}-sp">高清</b>${CHEV}</div><div class="${P}-ans">${list}回答</div><div class="${P}-note">已为您自动润色提示词，并完成以下创作</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div><div class="${P}-bar"><span class="${P}-nv">${back}${pages}</span><div class="${P}-pill">情绪人像风格，一个女…</div><span class="${P}-nv">${grid}${menu}</span><span class="${P}-send">${up}</span></div></div>`);
    const body = root.querySelector(`.${P}-body`), st = root.querySelector(`.${P}-st`), send = root.querySelector(`.${P}-send`);
    const navs = [...root.querySelectorAll(`.${P}-nv`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), pct: n.querySelector(`.${P}-pend b`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the blue send button is pressed; the answer page replaces the composer, the bar keeps its pill with the icons
        const gp = press(s, GEN_AT, 0.05, 0.05, 0.12);
        put('gp', gp.toFixed(3), () => { send.style.transform = gp > 0 ? `scale(${(1 - 0.1 * gp).toFixed(4)})` : 'none'; });
        const on = s >= ISSUE;
        put('iss', on, (v) => { body.style.visibility = v ? '' : 'hidden'; send.style.display = v ? 'none' : ''; navs.forEach((n) => { n.style.display = v ? '' : 'none'; }); });

        // the chip reads '图片正在生成中' until the tenth picture is there
        put('st', s >= LAND[9], (v) => { st.textContent = v ? '图像生成' : '图片正在生成中'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const done = s >= a;                         // a hard swap: the slot is the picture from this frame on
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the slot's own counter: 1 % at the issue, then up in uneven steps to 99 % at the moment its picture lands (never down)
          const p = seg(s, ISSUE, a);
          const eased = 1 - Math.pow(1 - p, 2.4);
          const pct = done ? 100 : Math.max(1, Math.min(99, Math.floor(eased * 33) * 3));
          put(`p${i}`, pct, (v) => { c.pct.textContent = `${v}%`; });
        });
      },
    };
  },
};
