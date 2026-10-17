// Doubao (豆包) as its iPhone app shows it, the 创作 tab (YouTube x2FuguoDo3Y '豆包AI图片生成经验分享', 2025-04-29, t~122.2-129.6 s;
// spec .tmp/clone-9e82faf1/reveal-refs/doubao/spec.json, confidence 0.60; frames wz2_x2f_t122.20, wz2_x2f_t124.80, wz2_x2f_t125.40,
// wz2_x2f_pending_zoom_t125.40, wz2_x2f_t126.50, wz2_x2f_t128.10, wz2_x2f_t129.60). A light screen (#FDFDFD), the opposite of the dark
// sibling apps: first the composer, filled, with a reference card, a row of style thumbnails (模板 / 插画 / 卡通 / 水墨), the chips
// '比例 9:16' / 扩图 / 消除 / 变清晰 and a round blue send arrow. Sending it swaps the screen for the chat page: a header '创作 | 模板'
// (创作 underlined), a small grey '09:02', the prompt as a blue bubble on the right, and under it a row of portrait 9:16 placeholder
// tiles, each a soft pink-to-lavender gradient with a white four-point sparkle and a white percentage that counts up in place
// (71% .. 90% observed, tile by tile, the neighbours a point or two apart). No bar, no ETA, no word on the tile, no shimmer and no
// blur preview; the finished picture simply takes the tile's place. Under the row sit the chips 'AI 生图' / 'AI 修图' and the composer
// '描述你想要创作的内容...' with a round voice button. The row runs off the right edge of the screen: it is a sideways scroller.
// Adapted to ten images: the row holds ten tiles, each counting its own percentage and landing in reading order; the row pages sideways
// two tiles at a time to follow the landing (the footage shows two tiles and no paging, so the paging and the count past two are
// extrapolated). The footage's 0-71% onset was trimmed by the editor, so the counts start in the late sixties and the swap itself
// (never caught between frames) is drawn as a hard cut. Omitted: the status bar, the keyboard, the phone's own full-screen viewer and
// anything about the account. The footage's pictures are never reproduced: every tile is our own meme; the app's logo, icons and fonts
// are not drawn (plain strokes and system type).
import { seg, outCubic, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dbo';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 512, PH_W = 304, PH_H = 494;
const TW = 152, TH = 270, TGAP = 6, TLEFT = 13;    // a tile (9:16), the gap between tiles and the row's left margin
const PAGE = 2 * (TW + TGAP);                       // one page of the row: two tiles
const CSS = `
.${P} { box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #e9e7ef; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-ph { position: relative; flex: none; box-sizing: border-box; width: ${PH_W}px; height: ${PH_H}px; border-radius: 24px; background: #fdfdfd; box-shadow: 0 0 0 1px #dcdae4, 0 6px 22px rgba(70, 60, 110, .12); overflow: hidden; color: #17171a; }
.${P}-chat { position: absolute; inset: 0; display: flex; flex-direction: column; }
.${P}-hd { position: relative; flex: none; height: 40px; margin-top: 4px; }
.${P}-back { position: absolute; left: 14px; top: 11px; width: 10px; height: 18px; fill: none; stroke: #17171a; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-more { position: absolute; right: 14px; top: 18px; display: flex; gap: 2.5px; }
.${P}-more i { display: block; width: 3.4px; height: 3.4px; border-radius: 50%; background: #17171a; }
.${P}-tabs { position: absolute; left: 0; right: 0; top: 0; height: 40px; display: flex; justify-content: center; gap: 24px; }
.${P}-tabs span { position: relative; display: block; line-height: 38px; font-size: 14.5px; font-weight: 600; color: #b0b0b6; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #17171a; }
.${P}-tabs .${P}-on::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; border-radius: 1px; background: #17171a; }
.${P}-time { flex: none; margin-top: 2px; text-align: center; font-size: 8.5px; line-height: 12px; color: #b4b4ba; }
.${P}-msg { flex: none; box-sizing: border-box; align-self: flex-end; width: 262px; margin: 8px 12px 0 0; padding: 9px 11px 9px; border-radius: 13px; background: #0a5ff4; box-shadow: inset 0 0 0 1px rgba(0, 28, 110, .35); font-size: 11.5px; line-height: 17px; color: #fff; }
.${P}-vp { position: relative; flex: none; height: ${TH}px; margin-top: 10px; overflow: hidden; }
.${P}-row { position: absolute; left: ${TLEFT}px; top: 0; display: flex; gap: ${TGAP}px; }
.${P}-t { position: relative; flex: none; width: ${TW}px; height: ${TH}px; border-radius: 12px; overflow: hidden; background: #e9c4d6; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
.${P}-v0 { background: radial-gradient(115% 62% at 0% 0%, #eba5c8 0%, rgba(235, 165, 200, 0) 70%), radial-gradient(95% 58% at 100% 0%, #f1dec6 0%, rgba(241, 222, 198, 0) 72%), radial-gradient(80% 55% at 0% 100%, #c6bcec 0%, rgba(198, 188, 236, 0) 74%), radial-gradient(90% 52% at 100% 100%, #e5a9ee 0%, rgba(229, 169, 238, 0) 76%), linear-gradient(180deg, #edc2cd, #e2c0e2 55%, #d8c1e8); }
.${P}-v1 { background: radial-gradient(105% 58% at 0% 0%, #eea0c6 0%, rgba(238, 160, 198, 0) 70%), radial-gradient(90% 56% at 100% 0%, #f2d8bd 0%, rgba(242, 216, 189, 0) 74%), radial-gradient(75% 55% at 0% 100%, #c2b8ee 0%, rgba(194, 184, 238, 0) 72%), radial-gradient(85% 52% at 100% 100%, #dca7ee 0%, rgba(220, 167, 238, 0) 76%), linear-gradient(180deg, #eab1c9, #d1b3e1 60%, #c8b9eb); }
.${P}-v2 { background: radial-gradient(110% 60% at 0% 0%, #efaccb 0%, rgba(239, 172, 203, 0) 70%), radial-gradient(100% 58% at 100% 0%, #f0e0cc 0%, rgba(240, 224, 204, 0) 72%), radial-gradient(85% 55% at 0% 100%, #cac0ee 0%, rgba(202, 192, 238, 0) 74%), radial-gradient(80% 50% at 100% 100%, #e7aef0 0%, rgba(231, 174, 240, 0) 76%), linear-gradient(180deg, #efc6d2, #e0c0e4 56%, #d6c2ea); }
.${P}-spk { display: block; width: 22px; height: 22px; fill: #fff; }
.${P}-pend b { display: block; font-size: 10.5px; line-height: 12px; font-weight: 400; letter-spacing: .2px; color: rgba(255, 255, 255, .88); }
.${P}-foot { flex: none; margin-top: auto; padding: 0 10px 11px; }
.${P}-qa { display: flex; gap: 7px; margin-bottom: 10px; }
.${P}-qa span { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 28px; padding: 0 10px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #ececf0, 0 1px 4px rgba(40, 40, 70, .05); font-size: 10.5px; font-weight: 600; color: #17171a; white-space: nowrap; }
.${P}-qa svg, .${P}-opt svg { flex: none; width: 12px; height: 12px; fill: none; stroke: #17171a; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cmp { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 40px; padding: 0 9px 0 12px; border-radius: 15px; background: #fff; box-shadow: 0 0 0 1px #f0f0f3, 0 3px 12px rgba(40, 40, 70, .08); font-size: 11.5px; color: #b2b2b8; white-space: nowrap; }
.${P}-vc { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px #17171a; }
.${P}-vc svg { width: 12px; height: 12px; fill: none; stroke: #17171a; stroke-width: 1.7; stroke-linecap: round; }
.${P}-pre { position: absolute; inset: 0; display: flex; flex-direction: column; background: #f3f3f6; }
.${P}-x { flex: none; width: 13px; height: 13px; margin: 18px 0 0 16px; fill: none; stroke: #17171a; stroke-width: 2; stroke-linecap: round; }
.${P}-ref { flex: 1; min-height: 0; display: grid; place-items: center; }
.${P}-ref i { display: grid; place-items: center; width: 88px; height: 118px; border-radius: 10px; background: #fff; box-shadow: 0 1px 6px rgba(40, 40, 70, .06); }
.${P}-ref svg { width: 22px; height: 22px; fill: none; stroke: #0a5ff4; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pn { flex: none; box-sizing: border-box; padding: 11px 9px 13px; border-radius: 18px 18px 0 0; background: #fff; box-shadow: 0 -2px 14px rgba(40, 40, 70, .07); }
.${P}-th { display: flex; gap: 6px; overflow: hidden; }
.${P}-th span { position: relative; flex: none; box-sizing: border-box; width: 53px; height: 66px; border-radius: 8px; overflow: hidden; }
.${P}-th span::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 30px; background: linear-gradient(0deg, rgba(0, 0, 0, .26), rgba(0, 0, 0, 0)); }
.${P}-th em { position: absolute; left: 0; right: 0; bottom: 6px; z-index: 1; text-align: center; font-style: normal; font-size: 9.5px; line-height: 12px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-th .${P}-s0 { background: linear-gradient(170deg, #a9c3d4, #7e9a68 80%); }
.${P}-th .${P}-s1 { background: linear-gradient(170deg, #efe1dc, #cdb3a8); }
.${P}-th .${P}-s2 { background: linear-gradient(170deg, #3f8aa6, #d2a06e); }
.${P}-th .${P}-s3 { background: linear-gradient(170deg, #f4f4f4, #8d8d92); }
.${P}-th .${P}-s4 { background: linear-gradient(170deg, #6b625f, #d7b9a6); }
.${P}-opt { display: flex; gap: 7px; margin-top: 10px; overflow: hidden; }
.${P}-opt span { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 28px; padding: 0 10px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #ececf0; font-size: 10.5px; font-weight: 600; color: #17171a; white-space: nowrap; }
.${P}-opt .${P}-hd2 { padding-right: 4px; }
.${P}-ed { position: relative; margin-top: 11px; min-height: 52px; padding-right: 36px; font-size: 12px; line-height: 18px; color: #17171a; }
.${P}-send { position: absolute; right: 0; bottom: 0; display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #0a5ff4; }
.${P}-send svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = '帮我生成一张图片：一位缪斯在阶梯教室里举着手写便条，梗图风格。比例 9:16。';
const REF = 1.84;                                           // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SEND_AT = 0.04;                                       // the blue arrow is pressed
const ISSUE = 0.17;                                         // the composer gives way to the chat page with the ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.42 + i * 0.145);   // tile i is swapped for its picture (reading order), the last at 1.725
const PAGE_AT = (p) => LAND[2 * p - 1] + 0.005;             // the row pages sideways to the next two tiles as the previous one lands
const PAGE_DUR = 0.125;
const COUNT_LEN = 0.6;                                      // a tile counts for at most this long before it lands
const START = (i) => 66 + ((i * 5) % 9);                    // where each tile's own count starts, the late sixties (the footage's first reading is 71%)
const START_AT = (i) => Math.max(ISSUE, LAND[i] - COUNT_LEN);
const END_PCT = 99;
const SPARK = `<svg class="${P}-spk" viewBox="0 0 24 24"><path d="M11 2C11.8 8 14 10.2 20 11C14 11.8 11.8 14 11 20C10.2 14 8 11.8 2 11C8 10.2 10.2 8 11 2Z"/><path d="M19.5 2.2C19.7 3.8 20.2 4.3 21.8 4.5C20.2 4.7 19.7 5.2 19.5 6.8C19.3 5.2 18.8 4.7 17.2 4.5C18.8 4.3 19.3 3.8 19.5 2.2Z"/><circle cx="19.5" cy="19.5" r="1.1"/></svg>`;

export default {
  id: 'doubao',
  label: 'Doubao 豆包 (2025)',
  source: {
    platform: 'ByteDance Doubao (豆包) iOS app, the 创作 tab (a phone screen recording on YouTube, 2025-04-29, light theme)',
    feature: "a composer with a blue send arrow gives way to a chat page: header 创作 | 模板, the prompt as a blue bubble, and a sideways row of portrait 9:16 tiles, each a pink-to-lavender gradient with a white four-point sparkle and a white percentage counting up in place (no bar, ETA, word, shimmer or blur), swapped for the finished picture tile by tile; chips AI 生图 / AI 修图 and the composer 描述你想要创作的内容... below",
    refs: [{ url: 'https://www.youtube.com/watch?v=x2FuguoDo3Y', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten tiles in the one sideways row (the footage shows two), each with its own counting percentage',
      'the row paging two tiles at a time to follow the landing (the footage never scrolls the row)',
      'the counts starting in the late sixties and capped at 99% (the footage is trimmed to 71% .. 90%)',
      'the placeholder-to-picture swap drawn as a hard cut (the footage never caught it between frames)',
      'the composer beat before the send compressed to a fraction of a second, and its style thumbnails drawn as plain gradients',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'doubao');
    const cell = (g, i) => `<div class="${P}-t ${P}-v${i % 3}"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${SPARK}<b>${START(i)}%</b></div></div>`;
    const ic = (d) => `<svg viewBox="0 0 16 16">${d}</svg>`;
    const picture = ic('<rect x="2" y="2.500" width="12" height="11" rx="2.500"/><circle cx="6" cy="6.500" r="1"/><path d="M2.500 12l3.500-3 3 2.500 2-1.500 3 2.500"/>');
    const retouch = ic('<rect x="2" y="2.500" width="12" height="11" rx="2.500"/><circle cx="6" cy="6.500" r="1"/><path d="M2.500 11.500l3.500-2.500 2.500 1.500M10 13.500l1.800-1.800 2-2"/>');
    const expand = ic('<rect x="2" y="2" width="12" height="12" rx="2.500"/><path d="M5.500 10.500l5-5M7.500 5.500h3v3"/>');
    const erase = ic('<path d="M3 10.500l5.500-6 4.500 4-3.500 4H5.500z"/><path d="M8 13.500h6"/>');
    const hd = ic('<rect x="1.500" y="3.500" width="13" height="9" rx="2"/><path d="M5 6.500v3M8 6.500v3M5 8h3M10 6.500v3h1.200a1.500 1.500 0 000-3z"/>');
    const root = x.el(`<div class="${P}"><div class="${P}-ph">`
      + `<div class="${P}-chat"><div class="${P}-hd"><svg class="${P}-back" viewBox="0 0 10 18"><path d="M8.500 1.500L2 9l6.500 7.500"/></svg><div class="${P}-tabs"><span class="${P}-on">创作</span><span>模板</span></div><div class="${P}-more"><i></i><i></i><i></i></div></div>`
      + `<div class="${P}-time">09:02</div><div class="${P}-msg">${x.esc(PROMPT)}</div>`
      + `<div class="${P}-vp"><div class="${P}-row">${tiles.map(cell).join('')}</div></div>`
      + `<div class="${P}-foot"><div class="${P}-qa"><span>${picture}AI 生图</span><span>${retouch}AI 修图</span></div><div class="${P}-cmp">描述你想要创作的内容...<div class="${P}-vc"><svg viewBox="0 0 12 12"><path d="M5 4.200v3.600M7.500 3v6M10 4.800v2.400"/></svg></div></div></div></div>`
      + `<div class="${P}-pre"><svg class="${P}-x" viewBox="0 0 13 13"><path d="M1.500 1.500l10 10M11.500 1.500l-10 10"/></svg><div class="${P}-ref"><i><svg viewBox="0 0 22 22"><rect x="3" y="4" width="14" height="13" rx="2.500"/><circle cx="8" cy="9" r="1.300"/><path d="M3 14.500l4.500-3.500 3.500 3 2.500-2 3.500 3M18 1.500v6M15 4.500h6"/></svg></i></div>`
      + `<div class="${P}-pn"><div class="${P}-th"><span class="${P}-s0"><em>模板 ›</em></span><span class="${P}-s1"><em>插画</em></span><span class="${P}-s2"><em>卡通</em></span><span class="${P}-s3"><em>水墨</em></span><span class="${P}-s4"><em>写真</em></span><span class="${P}-s0"><em>古风</em></span></div>`
      + `<div class="${P}-opt"><span>比例 9:16<svg viewBox="0 0 16 16" style="stroke: #8b8b92"><path d="M4 6.500l4 4 4-4"/></svg></span><span>${expand}扩图</span><span>${erase}消除</span><span class="${P}-hd2">${hd}变清晰</span></div>`
      + `<div class="${P}-ed">${x.esc(PROMPT)}<div class="${P}-send"><svg viewBox="0 0 12 12"><path d="M6 10.500v-9M2.500 5L6 1.500 9.500 5"/></svg></div></div></div></div>`
      + `</div></div>`);
    const pre = root.querySelector(`.${P}-pre`), send = root.querySelector(`.${P}-send`), row = root.querySelector(`.${P}-row`);
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

        // the blue arrow is pressed, then the chat page replaces the composer
        const sp = press(s, SEND_AT, 0.05, 0.04, 0.08);
        put('send', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.1 * sp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { pre.style.display = v ? 'none' : ''; });

        // the row pages sideways, two tiles at a time, to follow the landing
        let off = 0;
        for (let p = 1; p <= 4; p++) off += PAGE * outCubic(seg(s, PAGE_AT(p), PAGE_AT(p) + PAGE_DUR));
        put('off', off.toFixed(1), () => { row.style.transform = off > 0 ? `translateX(${(-off).toFixed(1)}px)` : 'none'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // each tile counts its own percentage up in place, a whole number, never past 99
          const n = Math.floor(START(i) + (END_PCT - START(i)) * seg(s, START_AT(i), a) + 1e-6);
          put(`p${i}`, n, (v) => { c.pct.textContent = `${v}%`; });
        });
      },
    };
  },
};
