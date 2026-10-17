// Baidu ERNIE Bot (文心一言), the in-chat 智慧绘图 (smart drawing) flow on yiyan.baidu.com (Bilibili BV1gybYzYEAP, 小白AI知识库,
// 2025-08-13, t~142-174 s; spec .tmp/clone-9e82faf1/reveal-refs/ernie-bot/spec.json, confidence 0.74; frames s_composer.png,
// s_pending_0/12/mid/100.png, s_landed.png). A LIGHT chat app (page ~#F4F5FC, white chat column): a slim icon rail, a header with the
// model chip '文心 4.5 Turbo', the message history, and a bottom composer headed '智慧绘图' with the placeholder '请描述你想生成的图片
// 内容、风格、比例，或上传参考图'. Sending opens a white assistant bubble (blank for ~1.5 s) with the blue link '停止生成' under it, then a
// light periwinkle rounded PENDING CARD fills the bubble: three blue dots, a live percentage that climbs in coarse steps (and even
// dips, 4% -> 2%), a thin blue bar tracking it and the grey caption 'AI作图中'. At 100% the card hard-swaps to the finished pictures
// and a short follow-up line (badged with the model) follows. This is a chat-column UI, unlike wenxin-yige's dark three-column app.
// Adapted to ten images: the finished result is ten pictures in the bubble (the footage showed one large render plus two small ones);
// after the card's hard swap they land one by one in reading order. The footage's ~17 s climb is compressed into the beat's window
// (extrapolated). The percentage list is the footage's own sequence of readings. Omitted: the footage's left canvas, the browser
// chrome and the creator's own pictures: every tile is our own meme, and no logo, wordmark or platform font is drawn (plain shapes
// for the avatars, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-eb';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 470, RAIL_W = 36, COLS = 5, GAP = 5, STAGE_H = 206;
const BLUE = '#447af2';
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f4f5fc; color: #252b3b; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dfe3f1; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 12px; width: ${RAIL_W}px; padding: 12px 0; background: #fff; box-shadow: inset -1px 0 0 #eceef7; }
.${P}-rail i { display: block; width: 12px; height: 12px; border-radius: 3.5px; box-shadow: inset 0 0 0 1.4px #7b8296; }
.${P}-rail i.lead { width: 16px; height: 16px; border-radius: 5px; background: ${BLUE}; box-shadow: none; margin-bottom: 4px; }
.${P}-rail i.plus { width: 14px; height: 14px; border-radius: 50%; background: ${BLUE}; box-shadow: none; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px; background: #fff; box-shadow: 0 1px 0 #eceef7; font-size: 9.5px; font-weight: 600; color: #252b3b; white-space: nowrap; }
.${P}-hd s { display: block; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1.4px #6b7289; text-decoration: none; }
.${P}-hd svg { width: 8px; height: 8px; fill: none; stroke: #6b7289; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd u { margin-left: auto; display: flex; gap: 8px; text-decoration: none; }
.${P}-hd u b { display: block; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #8a90a3; }
.${P}-chat { flex: 1; min-height: 0; box-sizing: border-box; padding: 12px 14px 0; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.${P}-row { flex: none; display: flex; align-items: flex-start; gap: 8px; }
.${P}-av { flex: none; width: 20px; height: 20px; border-radius: 50%; background: #d5d8e3; box-shadow: inset 0 0 0 1px #c3c7d6; }
.${P}-av.bot { background: #1d2a52; box-shadow: inset 0 0 0 3.5px #1d2a52, inset 0 0 0 5.5px #5b86f4; }
.${P}-user { flex: 1; min-width: 0; font-size: 9px; line-height: 14px; color: #252b3b; }
.${P}-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.${P}-bub { position: relative; box-sizing: border-box; padding: 10px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px #eceef7; }
.${P}-stage { position: relative; height: ${STAGE_H}px; }
.${P}-card { position: absolute; left: 0; top: 0; bottom: 0; width: ${STAGE_H}px; border-radius: 14px; background: linear-gradient(155deg, #e3eef8 0%, #dde9f8 45%, #ced9f9 100%); overflow: hidden; }
.${P}-dots { position: absolute; left: 0; right: 0; top: 28%; display: flex; justify-content: center; gap: 5px; }
.${P}-dots i { display: block; width: 5px; height: 5px; border-radius: 50%; background: ${BLUE}; }
.${P}-pct { position: absolute; left: 0; right: 0; top: 47%; text-align: center; font-size: 12px; line-height: 14px; font-weight: 500; color: #414e6e; font-variant-numeric: tabular-nums; }
.${P}-bar { position: absolute; left: 50%; top: calc(47% + 22px); width: 76px; height: 3px; margin-left: -38px; border-radius: 2px; background: #c3d1eb; overflow: hidden; }
.${P}-bar i { display: block; height: 100%; width: 100%; border-radius: 2px; background: ${BLUE}; transform-origin: 0 50%; }
.${P}-cap { position: absolute; left: 0; right: 0; bottom: 9px; text-align: center; font-size: 7.5px; line-height: 10px; color: #9aa4bf; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-auto-rows: 1fr; gap: ${GAP}px; }
.${P}-t { position: relative; border-radius: 6px; overflow: hidden; background: #e6ecf8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; border-radius: 6px; background: linear-gradient(155deg, #e3eef8, #d3defa); }
.${P}-done { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; height: 14px; font-size: 8.5px; line-height: 14px; color: #252b3b; }
.${P}-done em { font-style: normal; font-size: 6px; color: #e3b88a; white-space: nowrap; }
.${P}-stop { height: 12px; font-size: 8px; line-height: 12px; color: ${BLUE}; }
.${P}-cmp { flex: none; box-sizing: border-box; margin: 0 14px; padding: 8px 10px; height: 66px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1.2px #5b7cf5; }
.${P}-ct { display: flex; align-items: center; gap: 5px; height: 12px; font-size: 8px; font-weight: 600; color: #252b3b; }
.${P}-ct i { display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #252b3b; }
.${P}-ct small { margin-left: auto; font-size: 7px; font-weight: 400; color: #6b7289; }
.${P}-in { position: relative; height: 22px; margin-top: 5px; font-size: 8px; line-height: 12px; }
.${P}-in span { position: absolute; left: 0; top: 0; right: 40px; }
.${P}-in .ph { color: #b5bacb; }
.${P}-in .tx { color: #252b3b; }
.${P}-tools { position: absolute; right: 0; bottom: -1px; display: flex; align-items: center; gap: 7px; }
.${P}-tools b { display: block; width: 9px; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #8a90a3; }
.${P}-tools b.send { width: 13px; height: 13px; border-radius: 50%; background: ${BLUE}; box-shadow: none; }
.${P}-ft { flex: none; height: 24px; margin: 0 14px; font-size: 6px; line-height: 24px; text-align: center; color: #aab0c2; white-space: nowrap; overflow: hidden; }
`;

const PROMPT_USER = '一位缪斯在阶梯教室里举着手写便条，梗图风格，色彩明快，比例3:4';
const PCTS = [0, 4, 2, 5, 12, 16, 20, 24, 33, 42, 51, 70, 80, 86, 90, 96, 99, 100];   // the footage's own readings, in order
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SEND_AT = 0.06;                              // the cursor presses send
const OPEN = 0.16;                                 // the user message and the blank assistant bubble (the queued shell) appear
const CARD = 0.34;                                 // the pending card materialises at 0%
const FULL = 1.02;                                 // the counter reaches 100% and the card hard-swaps for the pictures
const LAND = Array.from({ length: 10 }, (_, i) => 1.1 + i * 0.08);   // tile i lands (reading order), the last at 1.82

export default {
  id: 'ernie-bot',
  label: 'ERNIE Bot (文心一言, 2025)',
  source: {
    platform: 'Baidu 文心一言 (ERNIE Bot) web app, yiyan.baidu.com chat (desktop browser, light theme; a tutorial screen recording on Bilibili, 2025-08-13)',
    feature: "in-chat 智慧绘图: a composer headed 智慧绘图 with the placeholder 请描述你想生成的图片内容、风格、比例，或上传参考图 and the model chip 文心 4.5 Turbo; sending opens a white assistant bubble holding a light periwinkle pending card (three blue dots, a live 0% to 100% counter with a matching blue bar, the caption AI作图中) and a blue 停止生成 link under it, then a hard swap to the pictures (adapted to 10: the card is followed by ten pictures landing one by one; the ~17 s climb is compressed into the beat's window, extrapolated; the footage's left canvas is omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1gybYzYEAP', retrieved: '2026-10-14' }],
    extrapolated: 'the footage shows a ~17 s percentage climb ending in one hard swap to 1 large + 2 small renders; here the climb is compressed into the beat window and the swap is followed by ten pictures landing in reading order',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'ernie-bot');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const rail = '<i class="lead"></i><i class="plus"></i><i></i><i></i><i></i><i></i>';
    const root = x.el(`<div class="${P}"><div class="${P}-rail">${rail}</div><div class="${P}-main"><div class="${P}-hd"><s></s>文心 4.5 Turbo${chev}<u><b></b><b></b></u></div><div class="${P}-chat"><div class="${P}-row ${P}-r1" style="visibility: hidden"><div class="${P}-av"></div><div class="${P}-user">${x.esc(PROMPT_USER)}</div></div><div class="${P}-row ${P}-r2" style="visibility: hidden"><div class="${P}-av bot"></div><div class="${P}-col"><div class="${P}-bub"><div class="${P}-stage"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-card" style="visibility: hidden"><div class="${P}-dots"><i></i><i></i><i></i></div><div class="${P}-pct">0%</div><div class="${P}-bar"><i></i></div><div class="${P}-cap">AI作图中</div></div></div><div class="${P}-done" style="visibility: hidden"><span>已经为你完成了这些绘画创作，希望你会喜欢。</span><em>文心 4.5 Turbo 生成</em></div></div><div class="${P}-stop">停止生成</div></div></div></div><div class="${P}-cmp"><div class="${P}-ct"><i></i>智慧绘图<small>模板</small></div><div class="${P}-in"><span class="tx">${x.esc(PROMPT_USER)}</span><span class="ph" style="visibility: hidden">请描述你想生成的图片内容、风格、比例，或上传参考图</span><div class="${P}-tools"><b></b><b></b><b class="send"></b></div></div></div><div class="${P}-ft">内容由AI生成，无法确保真实准确，仅供参考</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const send = q(`.${P}-tools .send`), r1 = q(`.${P}-r1`), r2 = q(`.${P}-r2`), stop = q(`.${P}-stop`);
    const grid = q(`.${P}-g`), card = q(`.${P}-card`), dots = [...root.querySelectorAll(`.${P}-dots i`)], pct = q(`.${P}-pct`), barI = q(`.${P}-bar i`);
    const done = q(`.${P}-done`), tx = q(`.${P}-in .tx`), ph = q(`.${P}-in .ph`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the send arrow is pressed; the composer then drops to its placeholder
        const sp = press(s, SEND_AT, 0.06, 0.06, 0.14);
        put('snd', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.12 * sp).toFixed(4)})` : 'none'; });
        const sent = s >= SEND_AT;
        put('cmp', sent, (v) => { tx.style.visibility = v ? 'hidden' : ''; ph.style.visibility = v ? '' : 'hidden'; });

        // the user's message and the blank queued bubble, then the pending card, then the hard swap to the pictures
        put('op', s >= OPEN, (v) => { r1.style.visibility = v ? '' : 'hidden'; r2.style.visibility = v ? '' : 'hidden'; });
        const pending = s >= CARD && s < FULL;
        put('cd', pending, (v) => { card.style.visibility = v ? '' : 'hidden'; });
        put('gr', s >= FULL, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        const fin = s >= LAND[9];
        put('stp', s >= OPEN && !fin, (v) => { stop.style.visibility = v ? '' : 'hidden'; });
        put('dn', fin, (v) => { done.style.visibility = v ? '' : 'hidden'; });

        // the counter climbs in the footage's coarse steps; the bar tracks it; the three dots run left to right
        const idx = Math.min(PCTS.length - 1, Math.floor(seg(s, CARD, FULL - 0.04) * (PCTS.length - 0.001)));
        const p = PCTS[idx];
        put('pc', p, (v) => { pct.textContent = `${v}%`; barI.style.transform = `scaleX(${(v / 100).toFixed(2)})`; });
        const ph3 = (((s * 2.4) % 1) + 1) % 1;
        dots.forEach((d, j) => {
          const a = Math.max(0, 1 - Math.abs((((ph3 * 3.4) - j + 3.4) % 3.4) - 0.5) / 1.1);
          put(`d${j}`, a.toFixed(2), () => { d.style.opacity = (0.28 + 0.72 * a).toFixed(2); });
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, s >= a, (v) => { c.pend.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
