// Alibaba Tongyi Wanxiang (通义万相), wanxiang.aliyun.com/creation, the 文本生成图像 page (two Bilibili screen recordings: BV1vW4y1f7QY,
// 2023-07-06, t=83-85 s, and BV181Ww6XEZi, 2026-10-13, t=44.6-45.9 s; spec .tmp/clone-9e82faf1/reveal-refs/tongyi-wanxiang/spec.json,
// confidence 0.60; frames j_wan_A_z45.0.png, j_wan_A_t46.png). A dark two-column page: a left composer (a '文本生成图像' selector, the
// prompt with a 'n/500' character count, a 风格 / 图像比例 line over a grid of labelled style thumbnails, aspect chips and a purple
// '生成创意画作' button) and a right '生成记录' column of record cards, each headed '文本生成图像' with the prompt under it and a
// '复用创意 / 再次生成' pair on the right. While a run is going the button becomes a full-width violet bar 'AI 正在生成中...' with a small
// red stop badge, and the newest record card carries a near-black placeholder (#00060A to #0C1518) with a small blue-violet glyph and a
// small percentage, then the pictures. The percentage is a low-confidence read, so it stays small and plain. The card's status line reads
// 'AI正在生成中...' while the run goes and turns into a timestamp when it is done.
// Adapted to ten images: three record cards (4 + 4 + 2) issued in turn, each newer card pushing the older ones down, the pictures of a
// card landing in reading order; the button stays a violet bar for the whole run. The footage's older records (their pictures), its
// style thumbnails' artwork, the header's account chip and the creator overlay are not reproduced: the style thumbnails are plain
// labelled squares, every picture is our own meme, and no logo, wordmark or platform font is drawn (a plain glyph, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wx';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 440, LEFT_W = 168;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #05080b; color: #dfe3ea; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #151a21; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 12px; background: #0a0e13; box-shadow: 0 1px 0 #11161c; }
.${P}-top i { flex: none; width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, #7c6cff, #4c31de); }
.${P}-top b { font-size: 9px; font-weight: 600; color: #e9ecf3; white-space: nowrap; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: ${LEFT_W}px; padding: 12px 10px 12px 12px; }
.${P}-sel { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 20px; padding: 0 7px; border-radius: 5px; background: #0f151c; box-shadow: inset 0 0 0 1px #1a222c; font-size: 7.5px; font-weight: 600; color: #e9ecf3; white-space: nowrap; }
.${P}-sel i { flex: none; display: grid; place-items: center; width: 9px; height: 9px; border-radius: 2px; background: #4c31de; font-style: normal; font-size: 6px; font-weight: 700; line-height: 9px; color: #fff; }
.${P}-sel svg { margin-left: auto; width: 7px; height: 7px; fill: #8b94a3; }
.${P}-box { flex: none; position: relative; box-sizing: border-box; height: 74px; padding: 6px 7px 14px; border-radius: 5px; background: #0a1016; box-shadow: inset 0 0 0 1px #151d26; font-size: 7.5px; line-height: 11px; color: #d7dce5; overflow: hidden; }
.${P}-cnt { position: absolute; right: 22px; bottom: 3px; font-size: 6px; line-height: 8px; color: #6c7686; }
.${P}-clr { position: absolute; right: 7px; bottom: 3px; display: grid; place-items: center; width: 8px; height: 8px; border-radius: 50%; background: #3a4352; font-size: 6px; line-height: 8px; color: #0a1016; }
.${P}-sty { flex: none; display: flex; align-items: center; justify-content: space-between; height: 10px; font-size: 6.5px; color: #8b94a3; white-space: nowrap; }
.${P}-sty svg { width: 7px; height: 7px; fill: #8b94a3; }
.${P}-th { flex: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px 4px; }
.${P}-th div { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 5.5px; line-height: 7px; color: #9ba4b3; white-space: nowrap; }
.${P}-th i { display: block; box-sizing: border-box; width: 100%; aspect-ratio: 1; border-radius: 4px; }
.${P}-th .on { color: #cfc8ff; }
.${P}-th .on i { box-shadow: 0 0 0 1.5px #7a66ff; }
.${P}-asp { flex: none; display: flex; gap: 4px; }
.${P}-asp span { flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; height: 15px; border-radius: 3px; background: #0f151c; box-shadow: inset 0 0 0 1px #1a222c; font-size: 6px; color: #9ba4b3; white-space: nowrap; }
.${P}-asp span::before { content: ""; width: 5px; height: 5px; border-radius: 1px; box-shadow: inset 0 0 0 1px currentColor; }
.${P}-asp span:nth-child(2)::before { width: 7px; height: 4px; }
.${P}-asp span:nth-child(3)::before { width: 4px; height: 7px; }
.${P}-asp .on { background: #3a28b8; box-shadow: none; color: #fff; }
.${P}-btn { position: relative; margin-top: auto; flex: none; display: grid; place-items: center; box-sizing: border-box; height: 24px; border-radius: 4px; background: #6a50f0; font-size: 8px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-btn.busy { background: #4c31de; }
.${P}-stop { position: absolute; right: 7px; top: 50%; display: none; width: 10px; height: 10px; margin-top: -5px; border-radius: 50%; background: #e5484d; }
.${P}-stop::after { content: ""; position: absolute; left: 3px; top: 3px; width: 4px; height: 4px; border-radius: 1px; background: #fff; }
.${P}-btn.busy .${P}-stop { display: block; }
.${P}-right { flex: 1; min-width: 0; position: relative; display: flex; flex-direction: column; gap: 6px; padding: 12px 12px 12px 4px; }
.${P}-rh { flex: none; display: flex; align-items: center; justify-content: space-between; height: 12px; font-size: 8px; font-weight: 600; color: #e9ecf3; }
.${P}-rh span { font-size: 6px; font-weight: 400; color: #8b94a3; }
.${P}-list { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 7px; }
.${P}-card { flex: none; }
.${P}-ch { display: flex; align-items: center; gap: 4px; height: 11px; font-size: 6px; color: #8b94a3; white-space: nowrap; }
.${P}-ch i { flex: none; display: grid; place-items: center; width: 7px; height: 7px; border-radius: 2px; background: #2a3140; font-style: normal; font-size: 5px; font-weight: 700; line-height: 7px; color: #cfd5e0; }
.${P}-ch b { font-weight: 600; color: #aab2c0; }
.${P}-ch em { font-style: normal; color: #5f6a7c; }
.${P}-lk { margin-left: auto; display: flex; gap: 8px; }
.${P}-pr { margin-top: 3px; height: 11px; font-size: 7px; line-height: 11px; font-weight: 600; color: #f2f4f8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-row { position: relative; margin-top: 4px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.${P}-c { position: relative; aspect-ratio: 1; overflow: hidden; background: #060c10; }
.${P}-c img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: linear-gradient(180deg, #00060a, #0c1518); }
.${P}-ov { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: linear-gradient(180deg, #00060a, #0c1518); }
.${P}-spin { display: block; width: 13px; height: 13px; }
.${P}-spin svg { display: block; width: 100%; height: 100%; fill: #6f6af8; }
.${P}-ov span { font-size: 6px; line-height: 7px; color: #8b94a3; }
`;

const PROMPT = '一位缪斯在阶梯教室里举着手写便条，梗图风格，色彩明快';
const STYLES = [
  ['默认', 'linear-gradient(135deg, #5b3fd9, #d46bb3)'], ['水彩', 'linear-gradient(135deg, #6fb7c9, #e9a7b8)'], ['油画', 'linear-gradient(135deg, #c79a2f, #6b4a1a)'], ['中国画', 'linear-gradient(135deg, #4d8fa8, #d05a3a)'],
  ['扁平插画', 'linear-gradient(135deg, #e08a5a, #a24a7a)'], ['二次元', 'linear-gradient(135deg, #3a4a7a, #9b7ad0)'], ['素描', 'linear-gradient(135deg, #bdbdbd, #4a4a4a)'], ['3D卡通', 'linear-gradient(135deg, #d9a05a, #5a3a2a)'],
];
const REF = 1.84;                                // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                             // the cursor presses 生成创意画作
const BUSY = [0.15, 1.75];                       // the button is a violet bar over this stretch
const FADE = 0.05;                               // a placeholder thins away over this long before its picture lands
// three records, newest on top: when it is issued, when each of its pictures lands, its finished timestamp
const CARDS = [
  { n: 4, at: 0.16, land: [0.42, 0.5, 0.58, 0.66], stamp: '2026-10-14 10:21:07' },
  { n: 4, at: 0.8, land: [1.02, 1.1, 1.18, 1.26], stamp: '2026-10-14 10:21:34' },
  { n: 2, at: 1.38, land: [1.56, 1.66], stamp: '2026-10-14 10:22:02' },
];
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 1.5l3.1 7.4 7.4 3.1-7.4 3.1-3.1 7.4-3.1-7.4-7.4-3.1 7.4-3.1z"/></svg>';
const CHEV = '<svg viewBox="0 0 12 12"><path d="M2.5 4l3.5 4 3.5-4z"/></svg>';

export default {
  id: 'tongyi-wanxiang',
  label: 'Tongyi Wanxiang (Alibaba)',
  source: {
    platform: 'Alibaba Tongyi Wanxiang (通义万相), wanxiang.aliyun.com/creation text-to-image page (desktop browser, dark theme; tutorial screen recordings on Bilibili, 2023-07-06 and 2026-10-13)',
    feature: "dark two-column page: a left composer (prompt with a character count, style thumbnails, aspect chips) whose purple 生成创意画作 button becomes a violet 'AI 正在生成中...' bar with a red stop badge, and a right 生成记录 column whose newest card, headed 文本生成图像, shows a near-black placeholder with a small glyph and percentage before its pictures (adapted to 10: three record cards of 4 + 4 + 2 issued in turn, pictures landing in reading order; the older records' pictures and the account chip are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1vW4y1f7QY', retrieved: '2026-10-14' }, { url: 'https://www.bilibili.com/video/BV181Ww6XEZi', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'tongyi-wanxiang');
    let g = 0;
    const cardHtml = (c) => {
      const cells = c.land.map((_, j) => { const i = g + j; return `<div class="${P}-c"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${tiles[i].origin}"/><div class="${P}-ph"></div></div>`; }).join('');
      g += c.n;
      return `<div class="${P}-card" style="position: absolute; left: 0; right: 0; top: 0; visibility: hidden"><div class="${P}-ch"><i>T</i><b>文本生成图像</b><em class="${P}-st">AI正在生成中...</em><span class="${P}-lk"><span>复用创意</span><span>再次生成</span></span></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-row">${cells}<div class="${P}-ov"><i class="${P}-spin">${STAR}</i><span>2%</span></div></div></div>`;
    };
    const cardsHtml = CARDS.map(cardHtml).reverse().join('');   // newest first in the column
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i></i><b>通义万相</b></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-sel"><i>T</i>文本生成图像${CHEV}</div><div class="${P}-box">${x.esc(PROMPT)}<span class="${P}-cnt">${[...PROMPT].length}/500</span><span class="${P}-clr">×</span></div><div class="${P}-sty"><span>风格默认，图像比例 1:1</span>${CHEV}</div><div class="${P}-th">${STYLES.map(([n, bg], i) => `<div${i === 0 ? ` class="on"` : ''}><i style="background: ${bg}"></i>${n}</div>`).join('')}</div><div class="${P}-asp"><span class="on">1 : 1</span><span>16 : 9</span><span>9 : 16</span></div><div class="${P}-btn"><span class="${P}-bl">生成创意画作</span><i class="${P}-stop"></i></div></div><div class="${P}-right"><div class="${P}-rh">生成记录<span>管理画作</span></div><div class="${P}-list">${cardsHtml}</div></div></div></div>`);
    const btn = root.querySelector(`.${P}-btn`), bl = root.querySelector(`.${P}-bl`);
    const domCards = [...root.querySelectorAll(`.${P}-card`)].reverse();   // back to issue order
    let at = 0;
    const cards = CARDS.map((c, k) => {
      const n = domCards[k];
      const cs = [...n.querySelectorAll(`.${P}-c`)].map((cn, j) => ({ im: cn.querySelector('img'), ph: cn.querySelector(`.${P}-ph`), g: tiles[at + j] }));
      at += c.n;
      return { n, c, cells: cs, ov: n.querySelector(`.${P}-ov`), spin: n.querySelector(`.${P}-spin`), pct: n.querySelector(`.${P}-ov span`), st: n.querySelector(`.${P}-st`) };
    });
    ctx.gate(cards.flatMap((k) => k.cells.map((c) => c.im)));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the button is pressed, is a violet bar for the run, and is the purple button again after
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= BUSY[0] && s < BUSY[1];
        put('busy', busy, (v) => { btn.classList.toggle('busy', v); bl.textContent = v ? 'AI 正在生成中...' : '生成创意画作'; });

        cards.forEach((cd, ci) => {
          const { c } = cd;
          const issued = s >= c.at;
          // an unissued card stays in the layout's tree but out of its flow, so its pictures are decoded and painted from the start
          put(`v${ci}`, issued, (v) => { cd.n.style.position = v ? '' : 'absolute'; cd.n.style.visibility = v ? '' : 'hidden'; });

          // the placeholder block carries the glyph and the small percentage until the first picture lands
          const a0 = c.land[0];
          const f0 = seg(s, a0 - FADE, a0);
          put(`o${ci}`, f0.toFixed(3), () => {
            if (f0 >= 1) { cd.ov.style.display = 'none'; cd.ov.style.opacity = ''; } else { cd.ov.style.display = ''; cd.ov.style.opacity = f0 > 0 ? (1 - f0).toFixed(3) : ''; }
          });
          const pct = Math.round(2 + 95 * seg(s, c.at, a0 - FADE));
          put(`p${ci}`, pct, (v) => { cd.pct.textContent = `${v}%`; });
          const deg = (((t * 300 + ci * 70) % 360) + 360) % 360;
          put(`r${ci}`, deg.toFixed(0), (d) => { cd.spin.style.transform = `rotate(${d}deg)`; });

          cd.cells.forEach((cell, j) => {
            const a = c.land[j];
            const f = seg(s, a - FADE, a);
            put(`i${ci}.${j}`, s >= a - FADE, (v) => { cell.im.style.visibility = v ? '' : 'hidden'; });
            cell.im.style.filter = restFilter(cell.g);
            cell.im.style.transform = restTransform(cell.g);
            put(`h${ci}.${j}`, f.toFixed(3), () => {
              if (f >= 1) { cell.ph.style.display = 'none'; cell.ph.style.opacity = ''; } else { cell.ph.style.display = ''; cell.ph.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
            });
          });
          // the status line turns into the finished timestamp once the card's last picture has landed
          const done = s >= c.land[c.land.length - 1];
          put(`s${ci}`, done, (v) => { cd.st.textContent = v ? c.stamp : 'AI正在生成中...'; });
        });
      },
    };
  },
};
