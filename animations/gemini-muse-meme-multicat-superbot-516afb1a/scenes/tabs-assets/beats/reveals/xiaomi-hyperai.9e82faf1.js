// Text-to-image in Xiaomi's 小爱同学 assistant on a phone (Bilibili BV1ZJ4m1h74X, 小搞机实验室, 2024-03-08, t~7.5-12.5 s; spec
// .tmp/clone-9e82faf1/reveal-refs/xiaomi-hyperai/spec.json, confidence 0.50; frames ab_xiaomi_pending_t8.5.png, ab_xiaomi_pending_t10.0.png,
// ab_xiaomi_landing_t12.5.png). A frosted light-lavender sheet with rounded top corners rises over the dark phone wallpaper: a header
// row ('小爱同学' and a small avatar), the user's blue request bubble ('帮我画一个…' with a pencil mark), the assistant's reply bubble,
// a row of suggestion chips ('画一幅少女与郁金香', '生成一幅复古色调的秋…') behind a brush glyph and a rounded input bar '有问题尽管问我...' with a
// home button at the left and a mic at the right. While the picture is made the reply bubble reads '好的，为你创作中' over the smaller grey
// '请耐心等待' beside a small multi-colour palette-like spinner icon, with a thin blue line along its foot; no percentage, bar, tile or
// blur. On completion the same bubble becomes '好的，已为你创作完成，画作如下' / '小爱还暂不支持对画作进行修改和解释~' and the picture sits inside it
// with a faint 'AI生成' watermark at its lower right, the caption '由AI大模型生成，仅供参考' under it and thumbs-up / thumbs-down marks.
// Adapted to ten images: the one picture becomes ten (5 + 5) in the bubble, landing one at a time in reading order, each in its own blank
// pale slot; the bubble's text swaps to the completion pair when the first picture is about to land (the footage swaps text and picture
// together). Omitted: the status bar, the weather and calendar widgets, the assistant's blob logo beside the title (a plain ring stands
// in), the bilibili uploader mark and the burned-in subtitles. The footage's picture is never reproduced: every image is our own meme,
// and no logo or platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-xmi';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 468, COLS = 5, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: linear-gradient(160deg, #2a0f26 0%, #160a1c 55%, #0d0a14 100%); color: #3b3b47; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a2430; }
.${P}-wall { flex: none; height: 34px; }
.${P}-sheet { flex: 1; min-height: 0; display: flex; flex-direction: column; box-sizing: border-box; padding: 6px 14px 12px; border-radius: 22px 22px 0 0; background: linear-gradient(180deg, #ece4fa 0%, #f1ecfa 60%, #eee8f9 100%); }
.${P}-grab { flex: none; align-self: center; width: 28px; height: 3px; border-radius: 2px; background: #b9b2cf; }
.${P}-hd { flex: none; display: flex; align-items: center; justify-content: space-between; height: 30px; font-size: 12px; font-weight: 500; color: #2b2b38; }
.${P}-hd span { display: flex; align-items: center; gap: 6px; }
.${P}-hd i { display: block; width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 2px #7c8cf0; }
.${P}-hd b { display: block; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #c9a37a, #6b4a3a); }
.${P}-me { flex: none; align-self: stretch; box-sizing: border-box; padding: 8px 12px; border-radius: 12px; background: #3d7cf2; font-size: 11px; line-height: 16px; color: #ffffff; }
.${P}-ai { flex: none; margin-top: 8px; box-sizing: border-box; padding: 10px 12px 12px; border-radius: 12px; background: #f6f2fc; box-shadow: inset 0 0 0 1px #ebe5f6; }
.${P}-pend { display: flex; align-items: center; gap: 12px; height: 38px; }
.${P}-ic { flex: none; display: block; width: 24px; height: 24px; border-radius: 50%; background: conic-gradient(from 0deg, #f06292, #ffb25b, #7be0a3, #5c9cf5, #5c6bc0, #b25cf5, #f06292); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6.5px)); }
.${P}-tx { display: flex; flex-direction: column; gap: 3px; }
.${P}-tx b { font-size: 12px; font-weight: 400; line-height: 16px; color: #2b2b38; }
.${P}-tx span { font-size: 9px; line-height: 12px; color: #8a8a99; }
.${P}-line { height: 1.5px; margin-top: 10px; background: #3d7cf2; }
.${P}-done { display: none; }
.${P}-done > div:first-child {font-size: 11px; line-height: 17px; color: #2b2b38; }
.${P}-g { position: relative; width: 380px; max-width: 100%; margin: 10px auto 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; background: #ebe5f6; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-slot { position: absolute; inset: 0; background: #ebe5f6; }
.${P}-wm { position: absolute; right: 6px; bottom: 4px; font-size: 8px; color: rgba(60, 50, 90, .3); }
.${P}-cap { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 8px; color: #8a8a99; }
.${P}-cap span { display: flex; gap: 10px; }
.${P}-cap i { display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #7a7a8c; }
.${P}-sug { flex: none; display: flex; align-items: center; gap: 14px; margin-top: auto; height: 28px; padding: 0 4px; font-size: 10px; color: #3b3b47; white-space: nowrap; overflow: hidden; }
.${P}-sug i { flex: none; display: block; width: 9px; height: 11px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #5b5b6a; }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 8px; height: 34px; margin-top: 4px; }
.${P}-bar i { flex: none; display: block; width: 30px; height: 30px; border-radius: 50%; background: #f6f2fc; box-shadow: inset 0 0 0 1px #e6dff3; }
.${P}-bar em { flex: 1; display: block; box-sizing: border-box; height: 30px; padding: 0 12px; border-radius: 15px; background: #f6f2fc; box-shadow: inset 0 0 0 1px #e6dff3; font-style: normal; font-size: 10px; line-height: 30px; color: #a09aae; }
`;

const ASK = '帮我画一位缪斯在阶梯教室里举着手写便条，梗图风格';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SEND_AT = 0.04;                             // the request leaves the input bar
const ISSUE = 0.16;                               // the assistant's reply bubble appears ('好的，为你创作中')
const LAND = Array.from({ length: 10 }, (_, i) => 0.6 + i * 0.12);   // slot i takes its picture (reading order), the last at 1.68
const FADE = 0.06;                                // the blank slot thins away over this long before the picture lands
const LEAD = 0.1;                                 // the bubble swaps to the completion text this long before the first picture lands

export default {
  id: 'xiaomi-hyperai',
  label: 'Xiaomi 小爱 AI创作 (2024)',
  source: {
    platform: 'Xiaomi phone, the 小爱同学 assistant sheet (MIUI 14 / HyperOS era, the 2024 小爱大模型 文生图 build; a hand-held third-party screen recording on Bilibili, 小搞机实验室, 2024-03-08)',
    feature: "frosted lavender assistant sheet: the user's blue request bubble, then a reply bubble '好的，为你创作中' / '请耐心等待' beside a small multi-colour spinner icon with a thin blue line (no percentage, bar, tile or blur), which becomes '好的，已为你创作完成，画作如下' / '小爱还暂不支持对画作进行修改和解释~' with the picture inline, a faint 'AI生成' watermark and the caption '由AI大模型生成，仅供参考' (adapted to 10: a 5 + 5 block of pictures landing one at a time in reading order inside the bubble)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1ZJ4m1h74X', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten pictures (the footage shows one) as a 5 + 5 block inside the reply bubble, each landing one at a time in reading order in its own blank pale slot",
      "the bubble swaps to the completion text just before the first picture lands, while the remaining slots are still blank (the footage swaps text and picture together)",
      "the user's request is our own text in the footage's '帮我画一个…' form",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'xiaomi-hyperai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-slot"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-wall"></div><div class="${P}-sheet"><div class="${P}-grab"></div><div class="${P}-hd"><span><i></i>小爱同学</span><b></b></div><div class="${P}-me" style="display: none">${x.esc(ASK)} ✎</div><div class="${P}-ai" style="display: none"><div class="${P}-pend"><i class="${P}-ic"></i><div class="${P}-tx"><b>好的，为你创作中</b><span>请耐心等待</span></div></div><div class="${P}-line"></div><div class="${P}-done"><div>好的，已为你创作完成，画作如下<br/>小爱还暂不支持对画作进行修改和解释~</div><div class="${P}-g">${tiles.map(cell).join('')}<span class="${P}-wm">AI生成</span></div><div class="${P}-cap">由AI大模型生成，仅供参考<span><i></i><i></i></span></div></div></div><div class="${P}-sug"><i></i><span>画一幅少女与郁金香</span><span>生成一幅复古色调的秋…</span></div><div class="${P}-bar"><i></i><em class="${P}-in"></em><i></i></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const me = q('me'), ai = q('ai'), pend = q('pend'), line = q('line'), done = q('done'), ic = q('ic'), inp = q('in');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-slot`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the request sits in the input bar, then it is sent and the bar empties; the request bubble and the reply bubble follow
        const sent = s >= ISSUE;
        put('in', sent, (v) => { inp.textContent = v ? '有问题尽管问我...' : ASK; inp.style.color = v ? '' : '#3b3b47'; });
        const sp = press(s, SEND_AT, 0.05, 0.05, 0.1);
        put('snd', sp.toFixed(3), () => { inp.style.transform = sp > 0 ? `scale(${(1 - 0.03 * sp).toFixed(4)})` : 'none'; });
        put('iss', sent, (v) => { const d = v ? '' : 'none'; me.style.display = d; ai.style.display = d; });

        // the reply bubble: the pending pair with its spinner until the first picture is about to land, then the completion text and the block
        const full = s >= LAND[0] - FADE - LEAD;
        put('full', full, (v) => { pend.style.display = v ? 'none' : ''; line.style.display = v ? 'none' : ''; done.style.display = v ? 'block' : ''; });
        const deg = (((t * 420) % 360) + 360) % 360;
        put('ic', deg.toFixed(0), (d) => { ic.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          put(`f${i}`, 1, () => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
