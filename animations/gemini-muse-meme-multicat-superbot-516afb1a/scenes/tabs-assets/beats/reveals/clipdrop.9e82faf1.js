// Clipdrop (2023), the text-to-image page of clipdrop.co/ja (a Japanese-narrated screen recording, YouTube _85D2nfuYRs,
// 2023-09-26, t~99.6-101.0 s for the text-to-image page and t~135.0-136.0 s for the Stable Doodle result grid; spec
// .tmp/clone-9e82faf1/reveal-refs/clipdrop/spec.json, confidence 0.78; frames s_clipdrop_sdxl_pending_t99.7.png,
// s_clipdrop_doodle_pending_t135.0.png and the sheet). A near-black (#141414) tool page: a rounded prompt box with a
// settings-sliders button and a blue 生成 button across the top, a 'Style | Aspect ratio | Negative prompt | Version PRO' tab strip
// under it, and a dotted-grid generation canvas. After 生成 the canvas holds one centred grey ring spinner and the small grey line
// 'Nの画像が処理待ち' (observed N=12); then the result grid, headed 'HD用に希望の画像を選択' with a '結果を共有' button, whose
// pending tiles are dark-grey rounded squares each carrying a bare grey ring, hard-swapped to the finished pictures. No percentage, bar
// or blur anywhere. The strings are kept in the Japanese the footage shows (the prompt too).
// Adapted to ten images: the queue state shows '10の画像が処理待ち'; the first picture then opens the result grid as a 5 x 2 block, the
// rest still ringed placeholders landing in strict order, with the queue line under the grid counting down the remaining of ten from
// t and clearing with the last one. Omitted: the 'Clipdrop by stability.ai' wordmark, the top nav, the 'by stability.ai' watermark on
// the pictures and the narrator's subtitle. The footage's pictures are never reproduced: every tile is our own meme, and no logo or
// platform font is drawn (a plain ring, plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cld';
const FONT = `${UI_FONT}, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'Noto Sans CJK JP', sans-serif`;
const ROOT_H = 364, COLS = 5, GAP = 6;   // px
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #141414; color: #d8d8d8; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #222; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 50px; padding: 0 12px; }
.${P}-box { flex: 1; min-width: 0; box-sizing: border-box; height: 32px; padding: 0 12px; border-radius: 10px; background: #1f1f1f; font-size: 11px; line-height: 32px; color: #e4e4e4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-set { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: #262626; }
.${P}-set svg { width: 14px; height: 14px; fill: none; stroke: #bdbdbd; stroke-width: 1.5; stroke-linecap: round; }
.${P}-go { flex: none; display: grid; place-items: center; width: 58px; height: 32px; border-radius: 10px; background: #3b5bfe; font-size: 12px; font-weight: 700; color: #fff; }
.${P}-tabs { flex: none; display: flex; margin: 0 12px; padding: 3px; gap: 3px; border-radius: 10px; background: #1b1b1b; }
.${P}-tabs span { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; height: 22px; border-radius: 8px; background: #222; font-size: 9.5px; color: #9a9a9a; white-space: nowrap; }
.${P}-tabs em { font-style: normal; font-size: 6.5px; font-weight: 700; line-height: 10px; padding: 0 4px; border-radius: 5px; background: #3b5bfe; color: #fff; }
.${P}-cv { position: relative; flex: 1; min-height: 0; margin: 10px 12px 12px; border-radius: 12px; background-color: #121212; background-image: radial-gradient(circle, #262626 0.8px, transparent 1.2px); background-size: 14px 14px; overflow: hidden; }
.${P}-q { position: absolute; left: 0; right: 0; top: 50%; display: flex; flex-direction: column; align-items: center; gap: 9px; transform: translateY(-50%); font-size: 9px; color: #8a8a8a; white-space: nowrap; }
.${P}-ring { display: block; flex: none; box-sizing: border-box; width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid #2a2a2a; border-top-color: #8a8a8a; border-right-color: #6a6a6a; }
.${P}-res { position: absolute; inset: 0; box-sizing: border-box; padding: 9px 10px; }
.${P}-hd { position: relative; height: 20px; font-size: 9.5px; line-height: 20px; text-align: center; color: #cfcfcf; white-space: nowrap; }
.${P}-hd b { position: absolute; right: 0; top: 1px; box-sizing: border-box; height: 18px; padding: 0 8px; border-radius: 6px; background: #3b5bfe; font-size: 7.5px; font-weight: 600; line-height: 18px; color: #fff; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 6px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 9px; overflow: hidden; background: #1b1b1b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #1b1b1b; }
.${P}-pend .${P}-ring { width: 20px; height: 20px; border-width: 2.5px; }
.${P}-qn { margin-top: 8px; height: 12px; font-size: 8.5px; line-height: 12px; text-align: center; color: #8a8a8a; white-space: nowrap; }
`;

const PROMPT = '日本の萌えアイドル';   // the prompt the footage types
const GEN_AT = 0.02;                  // the cursor presses 生成
const ISSUE = 0.08;                   // the canvas leaves its empty state for the queue line

export default {
  id: 'clipdrop',
  label: 'Clipdrop (2023)',
  source: {
    platform: 'Clipdrop web app, clipdrop.co/ja (Stability AI; desktop browser, dark theme, Japanese UI; a tutorial screen recording on YouTube, 2023-09-26)',
    feature: "dark tool page: a prompt box with a settings button and a blue 生成 button, a Style / Aspect ratio / Negative prompt / Version PRO tab strip, a dotted-grid canvas showing one centred grey ring spinner over '12の画像が処理待ち' and then, as in the Stable Doodle page, a result grid headed 'HD用に希望の画像を選択' of dark ringed placeholders hard-swapped to the finished images (adapted to 10: '10の画像が処理待ち', then a 5 x 2 grid landing in strict order, the queue line counting down the remaining of ten; the wordmark, nav and picture watermark are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=_85D2nfuYRs', retrieved: '2026-10-14' }],
    extrapolated: "the ten-image 5 x 2 grid and its one-at-a-time landing (the footage shows one text-to-image result, and a 2 x 2 grid from the Stable Doodle page whose three placeholders swap together), the queue line counting down under the grid (the footage shows it only on the full-canvas spinner, as a fixed 12), the use of the Doodle page's ringed placeholder tile for the pending tiles of the text-to-image page",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'clipdrop');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    const sliders = '<svg viewBox="0 0 16 16"><path d="M2 5h7M13 5h1M2 11h1M7 11h7"/><circle cx="11" cy="5" r="1.7"/><circle cx="5" cy="11" r="1.7"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-box">${x.esc(PROMPT)}</div><div class="${P}-set">${sliders}</div><div class="${P}-go">生成</div></div><div class="${P}-tabs"><span>Style</span><span>Aspect ratio</span><span>Negative prompt</span><span>Version<em>PRO</em></span></div><div class="${P}-cv"><div class="${P}-q" style="display: none"><i class="${P}-ring"></i><span>10の画像が処理待ち</span></div><div class="${P}-res" style="visibility: hidden"><div class="${P}-hd">HD用に希望の画像を選択<b>結果を共有</b></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-qn">10の画像が処理待ち</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), queue = q(`.${P}-q`), qring = q(`.${P}-q .${P}-ring`), res = q(`.${P}-res`), qn = q(`.${P}-qn`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);   // tile i hands its ring over to the picture here: ten non-overlapping windows

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;

        // 生成 is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.05, 0.04, 0.12);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // empty canvas -> queue line over one spinner -> result grid (opened by the first picture)
        const stage = t >= ends[0] ? 2 : s >= ISSUE ? 1 : 0;
        put('stage', stage, (v) => { queue.style.display = v === 1 ? '' : 'none'; res.style.visibility = v === 2 ? '' : 'hidden'; });
        const rdeg = (((t * 520) % 360) + 360) % 360;
        put('qr', rdeg.toFixed(0), (d) => { qring.style.transform = `rotate(${d}deg)`; });

        // the remaining of ten, from t alone (the queue line over the lone spinner is always the full ten: no picture has landed yet)
        const left = ends.filter((e) => t < e).length;
        put('qt', left, (n) => { qn.textContent = n > 0 ? `${n}の画像が処理待ち` : ''; });

        cells.forEach((c, i) => {
          put(`i${i}`, t >= ends[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the ring turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 520 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
