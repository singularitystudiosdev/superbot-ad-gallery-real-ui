// Yodayo / Moescape AI, the 'Art' tab of the web app (official Moescape AI channel on YouTube: iVDz0c4s73E, published 2026-06-01,
// t~48.6-49.8 s; QZwLzH1BZbc, 2025-07-25, t~64.5-66 s; spec .tmp/clone-9e82faf1/reveal-refs/yodayo/spec.json, confidence 0.58; frames
// v_yod_02_request-queued.png, v_yod_03_result.png). A near-black page: a row of tabs (Art, Video, Image Editing, Image Presets), a prompt
// box with an 'Image prompt' button and a yellow generate button that turns into a small spinner while a request runs, and a canvas
// below. A pending request shows, centred in the canvas, a three-dot spinner (yellow, pink and blue dots) over the grey label
// 'Request queued', with a white-outlined 'Cancel' and a yellow 'Generate another image' beneath; the finished picture then replaces
// all of it, the generate button returns and a 'Post' button appears. No progress bar, no percentage and no blur.
// Adapted to ten images: ten tiles in a 5 x 2 block, each with its own spinner and 'Request queued' until its picture lands, strictly in
// reading order (the spinners' phase comes from render(t)); 'Cancel' and 'Generate another image' sit under the block while any tile is
// pending, 'Post' once all ten have landed. Omitted: the side navigation, the account and credits bar, the right-hand settings panel,
// the Model Hub, the cursor and the download toast of the footage, and the Moescape wordmark. The footage's pictures are never
// reproduced: every tile is our own meme, and no logo, wordmark or platform font is drawn.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-yod';
const ROOT_H = 480, COLS = 5, GAP = 6;
const YEL = '#e6f25a', PINK = '#ff2f8f', BLUE = '#1fc0ee', DOT = '#f4c76f';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0a0a0c; color: #e9e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c1c21; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 18px; height: 42px; padding: 0 16px; font-size: 11px; font-weight: 500; color: #a1a1a8; white-space: nowrap; }
.${P}-tabs span { display: flex; align-items: center; gap: 5px; }
.${P}-tabs i { display: block; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1.4px #8d8d95; }
.${P}-tabs .on { color: #f6f6f8; }
.${P}-tabs .on i { box-shadow: inset 0 0 0 1.4px #f6f6f8; }
.${P}-box { flex: none; position: relative; box-sizing: border-box; height: 92px; margin: 0 16px; padding: 10px 12px; border-radius: 8px; background: #111114; font-size: 11px; line-height: 16px; color: #d8d8dc; }
.${P}-row { position: absolute; left: 12px; right: 12px; bottom: 10px; display: flex; align-items: center; gap: 10px; }
.${P}-ip { display: flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px; border-radius: 6px; background: #1b1b20; font-size: 9.5px; color: #cfcfd5; white-space: nowrap; }
.${P}-ip i { display: block; width: 9px; height: 9px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #bdbdc5; }
.${P}-sp { flex: 1; }
.${P}-btn { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 24px; border-radius: 6px; background: ${YEL}; font-size: 10.5px; font-weight: 600; color: #13140a; white-space: nowrap; }
.${P}-gen { padding: 0 14px; }
.${P}-busy { width: 30px; }
.${P}-busy i { display: block; width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(19, 20, 10, .28); }
.${P}-neg { flex: none; margin: 8px 16px 0; height: 24px; font-size: 9.5px; line-height: 24px; color: #6d6d75; white-space: nowrap; }
.${P}-cv { position: relative; flex: none; margin: 4px 16px 0; height: 258px; }
.${P}-es { position: absolute; inset: 0; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 7px; overflow: hidden; background: #131316; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; background: #131316; }
.${P}-dots { position: relative; display: block; width: 26px; height: 18px; }
.${P}-dots i { position: absolute; display: block; width: 7px; height: 7px; border-radius: 50%; }
.${P}-dots i:nth-child(1) { left: 1px; top: 10px; background: ${BLUE}; }
.${P}-dots i:nth-child(2) { left: 10px; top: 5px; background: ${PINK}; }
.${P}-dots i:nth-child(3) { left: 18px; top: 0; background: ${DOT}; }
.${P}-pend span { font-size: 8px; color: #9a9aa2; white-space: nowrap; }
.${P}-ft { flex: none; position: relative; height: 52px; margin: 0 16px; }
.${P}-ft > div { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
.${P}-cancel { display: grid; place-items: center; box-sizing: border-box; height: 26px; padding: 0 14px; border-radius: 6px; box-shadow: inset 0 0 0 1.4px #f1f1f4; font-size: 10.5px; font-weight: 600; color: #f6f6f8; }
.${P}-post { display: grid; place-items: center; box-sizing: border-box; height: 26px; padding: 0 18px; border-radius: 6px; box-shadow: inset 0 0 0 1.4px #f1f1f4; font-size: 10.5px; font-weight: 600; color: #f6f6f8; }
.${P}-ft .${P}-btn { height: 26px; padding: 0 14px; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the generate button
const ISSUE = 0.2;                                // the empty canvas gives way to ten queued requests
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1489);   // tile i's picture lands (reading order), the last at 1.84
const FADE = 0.05;                                // the spinner's cover thins away over this long before the picture lands

export default {
  id: 'yodayo',
  label: 'Yodayo / Moescape (2026)',
  source: {
    platform: "Moescape AI (formerly Yodayo), the 'Art' tab of the web app (official Moescape AI channel on YouTube, 2025-07-25 and 2026-06-01; dark theme)",
    feature: "a three-dot spinner (yellow, pink and blue dots) over the grey label 'Request queued', with 'Cancel' and 'Generate another image', then the picture (adapted to 10: ten tiles, each with its own spinner and 'Request queued' until it lands, in strict reading order; side navigation, account bar, settings panel and the wordmark are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=iVDz0c4s73E', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=QZwLzH1BZbc', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage shows one pending request and one result, not ten: the 5 x 2 block of per-tile spinners, the strict one-by-one landing order and every timing (generate pressed at 0.06 s, tiles queued from 0.2 s, landing from 0.5 s to the last at 1.84 s) are our adaptation; the dots' pulsing phase is drawn from t because only still frames of the spinner were captured.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'yodayo');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-dots"><i></i><i></i><i></i></div><span>Request queued</span></div></div>`;
    const tab = (on, name) => `<span${on ? ' class="on"' : ''}><i></i>${name}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-tabs">${tab(true, 'Art')}${tab(false, 'Video')}${tab(false, 'Image Editing')}${tab(false, 'Image Presets')}</div><div class="${P}-box">${x.esc(PROMPT)}<div class="${P}-row"><div class="${P}-ip"><i></i>Image prompt</div><div class="${P}-sp"></div><div class="${P}-btn ${P}-gen">Generate</div><div class="${P}-btn ${P}-busy" style="display: none"><i></i></div></div></div><div class="${P}-neg">Negative Prompt  (not supported for selected model)</div><div class="${P}-cv"><div class="${P}-es"></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-ft"><div class="${P}-wait" style="display: none"><span class="${P}-cancel">Cancel</span><span class="${P}-btn">Generate another image</span></div><div class="${P}-done" style="display: none"><span class="${P}-post">+ Post</span></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const gen = q(`.${P}-gen`), busy = q(`.${P}-busy`), es = q(`.${P}-es`), grid = q(`.${P}-g`), wait = q(`.${P}-wait`), done = q(`.${P}-done`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), dots: [...n.querySelectorAll(`.${P}-dots i`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the generate button is pressed, becomes the small busy button while requests are queued, and returns once all have landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const issued = s >= ISSUE, over = s >= LAND[9];
        put('iss', issued, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });
        put('busy', issued && !over, (v) => { busy.style.display = v ? '' : 'none'; gen.style.display = v ? 'none' : ''; });
        put('wait', issued && !over, (v) => { wait.style.display = v ? '' : 'none'; });
        put('done', over, (v) => { done.style.display = v ? '' : 'none'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the three dots swell and shrink in turn (phase from t alone, offset per tile)
          c.dots.forEach((d, j) => {
            const ph = t * 1.5 + i * 0.13 - j * 0.18;
            const sc = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(ph * 2 * Math.PI));
            put(`d${i}.${j}`, sc.toFixed(2), (v) => { d.style.transform = `scale(${v})`; });
          });
        });
      },
    };
  },
};
