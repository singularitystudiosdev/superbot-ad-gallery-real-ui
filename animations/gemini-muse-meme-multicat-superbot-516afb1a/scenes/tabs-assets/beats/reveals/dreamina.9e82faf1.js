// Dreamina, the 2024 web page of ByteDance's image generator that 即梦 (Jimeng) was called before its May-2024 rename: the page
// dreamina.jianying.com/ai-tool/image/generate (Bilibili BV1Rw4m1y7K3, 2024-04-22, t~166-183 s; spec
// .tmp/clone-9e82faf1/reveal-refs/dreamina/spec.json, confidence 0.60; frames r_dreamina_web_pending_t168.0.png,
// r_dreamina_web_composer_pending_t170.5.png, r_dreamina_web_complete_t182.8.png, r_card_header_zoom.png). A near-black page with a slim top
// bar ('< 返回' on the left, a 'VIP 开通会员得更多积分' pill and a credit count on the right), a left composer panel titled '图片生成'
// ('输入': the prompt box with a '导入参考图' chip under the text; '模型' / '生图模型': a model row 'Dreamina 通用 v1.2'; a full-width cyan
// '立即生成' button with a '限时免费' badge) and a right column of generation CARDS: a '<time>  <prompt>  [Dreamina 通用 v1.2]  [1:1]'
// header, then a grid of square 1:1 tiles. Pressing the button turns the newest card's tiles into flat dark blue-grey placeholders with a
// single small blue mark turning in the middle of each (no caption, no percentage, no queue position, no shimmer and no gradient), held
// about 13 s, then the pictures land tile by tile with the mark leaving as each lands; '再次生成' / '重新编辑' chips sit under a finished card.
// Adapted to ten images: three cards in turn, 4 + 4 + 2 tiles, each card's tiles turning dark together when its turn comes and landing
// in reading order, the next card opening as the previous one finishes (the observed card is a 2 x 2 block; at this width the cards are one
// row of four instead). Omitted: the credit count's mark and the avatar, the '发送中...' chip, and the model's own cover picture. The
// footage's pictures and the brand mark are never reproduced: every tile is our own meme, the mark is a plain turning arc, and no logo,
// wordmark or platform font is drawn (plain text in the system stack).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dm';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 432, LEFT_W = 196;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 8px 10px 10px; border-radius: 12px; background: #0d1014; color: #e8ebf0; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d232b; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 26px; }
.${P}-back { box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 6px; background: #181d24; font-size: 8px; line-height: 20px; color: #8e97a3; white-space: nowrap; }
.${P}-vip { margin-left: auto; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 10px; background: #181d24; font-size: 7.5px; color: #c5ccd6; white-space: nowrap; }
.${P}-vip b { padding: 0 4px; border-radius: 3px; background: #323943; font-size: 7px; line-height: 11px; color: #e8ebf0; }
.${P}-cr { font-size: 8px; font-weight: 600; color: #d8dde5; white-space: nowrap; }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 8px; margin-top: 6px; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; border-radius: 10px; background: #151a21; box-shadow: inset 0 0 0 1px #1f262f; }
.${P}-ttl { flex: none; height: 28px; padding: 0 12px; font-size: 10px; font-weight: 600; line-height: 28px; color: #f1f3f6; box-shadow: 0 1px 0 #1f262f; }
.${P}-sec { flex: none; height: 16px; margin: 10px 12px 0; font-size: 8px; font-weight: 600; line-height: 16px; color: #e8ebf0; }
.${P}-sub { flex: none; margin: 4px 12px 0; font-size: 7px; line-height: 10px; color: #7b8491; }
.${P}-prompt { flex: none; box-sizing: border-box; margin: 4px 10px 0; padding: 8px 8px 6px; border-radius: 8px; background: #1b212a; box-shadow: inset 0 0 0 1px #242c36; }
.${P}-pt { height: 56px; font-size: 8.5px; line-height: 14px; color: #dfe4ea; overflow: hidden; }
.${P}-ref { display: inline-flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 5px; background: #242c36; font-size: 7.5px; font-weight: 600; color: #e8ebf0; white-space: nowrap; }
.${P}-ref i { display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #b4bcc8; }
.${P}-mdl { display: flex; align-items: center; gap: 7px; box-sizing: border-box; height: 34px; margin: 4px 10px 0; padding: 0 8px; border-radius: 8px; background: #1b212a; box-shadow: inset 0 0 0 1px #242c36; }
.${P}-mdl i { flex: none; width: 20px; height: 20px; border-radius: 5px; background: linear-gradient(150deg, #3a4a63, #1d2634); }
.${P}-mdl span { flex: 1; min-width: 0; font-size: 8px; font-weight: 600; color: #f1f3f6; white-space: nowrap; }
.${P}-mdl svg { flex: none; width: 8px; height: 8px; fill: none; stroke: #8e97a3; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-asp { display: flex; gap: 5px; margin: 5px 10px 0; }
.${P}-asp span { box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 6px; background: #1b212a; box-shadow: inset 0 0 0 1px #242c36; font-size: 7.5px; line-height: 20px; color: #aeb6c2; }
.${P}-asp .on { box-shadow: inset 0 0 0 1px #14b8c4; color: #e8fdff; }
.${P}-btnw { position: relative; flex: none; margin: auto 10px 10px; }
.${P}-go { display: grid; place-items: center; height: 30px; border-radius: 7px; background: #11bcc8; font-size: 10px; font-weight: 600; color: #05262a; }
.${P}-btnw em { position: absolute; right: 4px; top: -7px; padding: 0 5px; border-radius: 4px 4px 4px 0; background: #6fe8ee; font-style: normal; font-size: 6.5px; line-height: 12px; font-weight: 600; color: #05262a; }
.${P}-right { flex: 1; min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; padding: 10px 10px 8px; border-radius: 10px; background: #151a21; box-shadow: inset 0 0 0 1px #1f262f; }
.${P}-card { flex: none; display: flex; flex-direction: column; gap: 5px; }
.${P}-ch { display: flex; align-items: center; gap: 5px; height: 15px; white-space: nowrap; overflow: hidden; }
.${P}-ch b { flex: none; font-size: 7.5px; font-weight: 600; color: #9aa3af; }
.${P}-ch span { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-size: 8px; color: #e8ebf0; }
.${P}-ch em { flex: none; box-sizing: border-box; height: 13px; padding: 0 4px; border-radius: 3px; background: #1d232b; box-shadow: inset 0 0 0 1px #2a323d; font-style: normal; font-size: 6.5px; line-height: 13px; color: #aeb6c2; }
.${P}-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px; }
.${P}-t { position: relative; aspect-ratio: 1; overflow: hidden; background: #23272e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #23272e; }
.${P}-sp { display: block; width: 13px; height: 13px; box-sizing: border-box; border-radius: 50%; border: 2px solid rgba(143, 160, 232, .25); border-top-color: #7fb8f0; border-right-color: #8fa0e8; }
.${P}-act { display: flex; gap: 5px; height: 16px; }
.${P}-act span { box-sizing: border-box; height: 16px; padding: 0 7px; border-radius: 5px; background: #20262e; font-size: 7px; line-height: 16px; color: #c3cad4; white-space: nowrap; }
`;

const PROMPT = '一位缪斯在阶梯教室里举着手写便条，梗图风格，色彩明快，课堂是岛屿式';
const MODEL = 'Dreamina 通用 v1.2';
const TIMES = ['21:07', '21:07', '21:08'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 立即生成
const ISSUE = 0.16;                               // the first card's four tiles turn into dark placeholders
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its mark over to the picture (reading order), the last at 1.68
const FADE = 0.06;                                // the dark cover thins away over this long before the picture lands
const SIZES = [4, 4, 2];                          // three cards in turn
const CHEV = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';

export default {
  id: 'dreamina',
  label: 'Dreamina (2024)',
  source: {
    platform: "Dreamina web (dreamina.jianying.com), 即梦 (Jimeng)'s 2024 name before the May-2024 rename (a Windows desktop-browser screen recording on Bilibili, 2024-04-22, build 'Dreamina 通用 v1.2')",
    feature: "near-black page: a left '图片生成' composer (prompt box + '导入参考图', model row 'Dreamina 通用 v1.2', aspect chip 1:1, a cyan '立即生成' button) beside a right column of generation cards; pressing the button turns the card into flat dark tiles with one small mark turning in each (no caption, percentage, queue label or shimmer), then the pictures land tile by tile (adapted to 10: three cards in turn, 4 + 4 + 2, each landing in reading order; the observed 2 x 2 card is a row of four here; the credit mark, avatar and '发送中...' chip are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1Rw4m1y7K3', retrieved: '2026-10-14' }],
    extrapolated: ['the second and third card (the footage frames a single card of four)', 'the card header time (the footage reads 20:03, ours is invented)', 'the mark leaving each tile as its picture lands (the footage shows tiles landing, the mark vanishing with them)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dreamina');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-sp"></i></div></div>`;
    let n = 0;
    const cards = SIZES.map((len, k) => {
      const from = n; n += len;
      return `<div class="${P}-card" style="visibility: hidden"><div class="${P}-ch"><b>${TIMES[k]}</b><span>${x.esc(PROMPT)}</span><em>${MODEL}</em><em>1:1</em></div><div class="${P}-row">${tiles.slice(from, from + len).map((g, j) => cell(g, from + j)).join('')}</div><div class="${P}-act" style="visibility: hidden"><span>再次生成</span><span>重新编辑</span></div></div>`;
    }).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-back">‹ 返回</div><div class="${P}-vip"><b>VIP</b>开通会员得更多积分</div><div class="${P}-cr">60</div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-ttl">图片生成</div><div class="${P}-sec">输入</div><div class="${P}-prompt"><div class="${P}-pt">${x.esc(PROMPT)}</div><span class="${P}-ref"><i></i>导入参考图</span></div><div class="${P}-sec">模型</div><div class="${P}-sub">生图模型</div><div class="${P}-mdl"><i></i><span>${MODEL}</span>${CHEV}</div><div class="${P}-sec">比例</div><div class="${P}-asp"><span class="on">1:1</span><span>4:3</span><span>16:9</span></div><div class="${P}-btnw"><em>限时免费</em><div class="${P}-go">立即生成</div></div></div><div class="${P}-right">${cards}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`);
    const cardEls = [...root.querySelectorAll(`.${P}-card`)];
    const acts = cardEls.map((c) => c.querySelector(`.${P}-act`));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((el, i) => ({ im: el.querySelector('img'), pend: el.querySelector(`.${P}-pend`), sp: el.querySelector(`.${P}-sp`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    // each card's range of tiles, the moment it opens (the first at ISSUE; later ones as the previous card's last tile lands) and when it is done
    const firsts = [], lasts = []; let acc = 0;
    SIZES.forEach((len) => { firsts.push(acc); acc += len; lasts.push(acc - 1); });
    const opens = SIZES.map((_, k) => (k === 0 ? ISSUE : LAND[lasts[k - 1]]));

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

        // a card opens (its header and dark tiles) when its turn comes; its action chips arrive with its last picture
        cardEls.forEach((c, j) => {
          put(`o${j}`, s >= opens[j], (v) => { c.style.visibility = v ? '' : 'hidden'; });
          put(`a${j}`, s >= LAND[lasts[j]], (v) => { acts[j].style.visibility = v ? '' : 'hidden'; });
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the mark turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 430 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.sp.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
