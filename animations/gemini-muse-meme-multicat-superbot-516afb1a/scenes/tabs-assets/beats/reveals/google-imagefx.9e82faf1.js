// Google Labs' ImageFX, the 2024 build (RETIRED: labs.google/fx/tools/image-fx now redirects to flow.google.com; spec
// .tmp/clone-9e82faf1/reveal-refs/google-imagefx/spec.json, confidence 0.5, single-sourced to one ~1 s generating window of BV1Dm411S7f4,
// t=159.5-162.7 s; frames in that folder: sheet.png, pane-gen.png, btn.png, chips.png, hdr.png). A dark full-page app: on the left a
// rounded #1E2223 prompt card with the prompt in large white text and inline periwinkle (#ABAEFB) chips, a 'Start over' chip and the
// purple 'Generate' pill, a strip of style-suggestion chips under it; on the right a result pane with arrow buttons and a letterspaced
// header ('NO IMAGES YET', then 'IMAGE SET 1/1'), a 2 x 2 grid of near-black tiles (hairline #131313 border) on the #0D0D0D page, a
// thumbnail strip, and a 'Settings | Download | Share' bar. Pressing Generate swaps the pill, in place, for one reading 'Generating
// image' with a thin rotating arc spinner (no percentage, count or bar anywhere), clears the pane to the four empty tiles, and each
// tile fills with an extremely dim, heavily blurred low-resolution render that brightens; then the finished image hard-swaps in
// (no cross-fade), the pill returns to 'Generate', the header switches and Download / Share light up.
// Adapted to ten images: three generations of 4 + 4 + 2 images (the pane clears to empty tiles each time, the header counts
// 'IMAGE SET n/3'), every image also joining the ten-slot thumbnail strip as it lands. The marks are plain shapes of our own and the
// face is the system UI stack: no Google logo, wordmark, 'ImageFX' lettering or font is drawn or shipped, no image from the footage is
// reproduced, and the tiles show only our own meme.
// Everything is a pure function of t (the spinner angle and the dim fill come from t; no CSS animation or transition), and every
// tile <img> stays in flow with visibility toggled, never display:none, so a seek paints like a fresh load.
import { injectStyle, hash, restTransform, restFilter, ownSrc, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-ifx';
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; gap: 14px; width: 560px; max-width: 100%; padding: 14px 12px 12px; border-radius: 14px; overflow: hidden; background: #0d0d0d; color: #f1f2f3; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-sq { position: absolute; width: 22px; height: 22px; border-radius: 6px; background: #1b1830; }
.${P}-l { flex: none; width: 232px; position: relative; }
.${P}-card { box-sizing: border-box; display: flex; flex-direction: column; height: 270px; padding: 14px; border-radius: 18px; background: #1e2223; }
.${P}-p { font-size: 15px; line-height: 27px; font-weight: 500; color: #fff; }
.${P}-p b { display: inline-block; padding: 0 6px; border-radius: 6px; background: #abaefb; color: #1b1d44; font-weight: 500; font-size: 13px; line-height: 20px; white-space: nowrap; }
.${P}-p b::after { content: ""; display: inline-block; margin: 0 0 1px 5px; border: 3px solid transparent; border-top: 4px solid #1b1d44; border-bottom: 0; }
.${P}-act { display: flex; align-items: center; gap: 6px; margin-top: auto; }
.${P}-lib { display: block; flex: none; width: 16px; height: 16px; margin-right: auto; box-sizing: border-box; border: 1.5px solid #8b9092; border-radius: 7px; }
.${P}-so { display: inline-flex; align-items: center; gap: 4px; flex: none; height: 26px; padding: 0 8px; border-radius: 999px; background: #2a2f30; color: #c6cacc; font-size: 9px; font-weight: 500; white-space: nowrap; }
.${P}-so i { display: block; width: 7px; height: 7px; box-sizing: border-box; border: 1.3px solid #c6cacc; border-radius: 50%; }
.${P}-gen { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; flex: none; width: 106px; height: 26px; border-radius: 999px; background: #abaefb; color: #1e2223; font-size: 10px; font-weight: 600; white-space: nowrap; }
.${P}-gen svg { width: 12px; height: 12px; flex: none; }
.${P}-spin { fill: none; stroke: #1e2223; stroke-width: 2.1; stroke-linecap: round; }
.${P}-star { fill: #1e2223; }
.${P}-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
.${P}-chips span { padding: 0 8px; border-radius: 999px; background: #181c1d; box-shadow: inset 0 0 0 1px #262b2c; color: #b4b9bb; font-size: 8.5px; line-height: 20px; white-space: nowrap; }
.${P}-chips span:first-child { color: #abaefb; }
.${P}-r { flex: 1; min-width: 0; }
.${P}-hd { display: flex; align-items: center; justify-content: space-between; height: 20px; }
.${P}-hd i { display: block; position: relative; width: 18px; height: 18px; border-radius: 50%; background: #1e2223; }
.${P}-hd i::after { content: ""; position: absolute; left: 7px; top: 6.5px; width: 4px; height: 4px; border-top: 1.5px solid #c6cacc; border-left: 1.5px solid #c6cacc; transform: rotate(-45deg); }
.${P}-hd i:last-child::after { left: 5.5px; transform: rotate(135deg); }
.${P}-hd span { font-family: ${MONO_FONT}; font-size: 8px; letter-spacing: .22em; color: #e6e8e9; white-space: nowrap; }
.${P}-pane { position: relative; aspect-ratio: 1; margin-top: 8px; }
.${P}-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; min-height: 0; border-radius: 12px; overflow: hidden; background: #0d0d0d; box-shadow: inset 0 0 0 1px #131313; }
.${P}-t img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-f { position: absolute; inset: -18%; filter: blur(16px); visibility: hidden; }
.${P}-th { display: flex; gap: 4px; margin-top: 8px; }
.${P}-th span { flex: 1; min-width: 0; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #0d0d0d; box-shadow: inset 0 0 0 1px #1a1a1a; }
.${P}-th img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-bar { display: flex; justify-content: center; margin-top: 10px; }
.${P}-bar div { display: flex; align-items: stretch; height: 24px; border-radius: 999px; background: #1e2223; color: #dfe2e3; font-size: 9px; line-height: 24px; overflow: hidden; }
.${P}-bar span { padding: 0 12px; }
.${P}-bar span + span { box-shadow: -1px 0 0 #0d0d0d; }
`;

const PROMPT = [
  ['A ', 0], ['cheerful ghost', 1], [' holding a ', 0], ['handwritten note', 1], [' in a ', 0], ['cozy cafe', 1],
];
const SUGGEST = ['More', 'photorealistic', '35mm film', 'minimal', 'sketchy', 'handmade', 'natural light', 'close up', 'cinematic'];
const SETS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export default {
  id: 'google-imagefx',
  label: 'Google ImageFX (2024, retired)',
  source: {
    platform: 'ImageFX (Google Labs, labs.google/fx/tools/image-fx), 2024 build, dark theme; retired, the page now redirects to flow.google.com',
    feature: 'Generate pill that reads \'Generating image\' with a thin rotating arc spinner, a 2 x 2 grid of near-black tiles that fill with an extremely dim blurred render and then hard-swap to the finished image, header NO IMAGES YET -> IMAGE SET n/3 (adapted to 10: three generations of 4 + 4 + 2 images, each image also joining a ten-slot thumbnail strip)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1Dm411S7f4', retrieved: '2026-10-14' }],
    retired: true,
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-imagefx');
    const im = (g, i, extra = '') => `<img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"${extra}/>`;
    const ang = (i) => Math.round(110 + hash(53, i) * 80);
    const grid = (ids) => `<div class="${P}-grid">${ids.map((i) => `<div class="${P}-t"><i class="${P}-f" style="background: linear-gradient(${ang(i)}deg, rgba(255,255,255,0) 18%, rgba(255,255,255,.55) 72%, rgba(255,255,255,.2) 100%)"></i>${im(tiles[i], i)}</div>`).join('')}</div>`;
    const root = x.el(`<div class="${P}">
<i class="${P}-sq" style="left: -9px; top: 70px"></i><i class="${P}-sq" style="right: -9px; bottom: 90px; width: 26px; height: 26px"></i>
<div class="${P}-l"><div class="${P}-card"><div class="${P}-p">${PROMPT.map(([s, c]) => (c ? `<b>${x.esc(s)}</b>` : x.esc(s))).join('')}</div>
<div class="${P}-act"><i class="${P}-lib"></i><span class="${P}-so"><i></i>Start over</span><span class="${P}-gen"><svg class="${P}-star" viewBox="0 0 16 16"><path d="M8 1l1.8 5.2L15 8l-5.2 1.8L8 15l-1.8-5.2L1 8l5.2-1.8z"/></svg><svg class="${P}-spin" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.6" stroke-dasharray="26 9.2"/></svg><span></span></span></div></div>
<div class="${P}-chips">${SUGGEST.map((s) => `<span>${x.esc(s)}</span>`).join('')}</div></div>
<div class="${P}-r"><div class="${P}-hd"><i></i><span></span><i></i></div>
<div class="${P}-pane">${SETS.map(grid).join('')}</div>
<div class="${P}-th">${tiles.map((g, i) => `<span>${im(g, i)}</span>`).join('')}</div>
<div class="${P}-bar"><div><span>Settings</span><span class="dl">Download</span><span class="dl">Share</span></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const grids = [...root.querySelectorAll(`.${P}-grid`)];
    const slots = [];
    SETS.forEach((ids, k) => [...grids[k].querySelectorAll(`.${P}-t`)].forEach((n, j) => slots.push({
      i: ids[j], k, j, n: SETS[k].length, fill: n.querySelector(`.${P}-f`), im: n.querySelector('img'),
    })));
    slots.sort((a, b) => a.i - b.i);
    const thumbs = [...root.querySelectorAll(`.${P}-th span`)].map((n) => ({ n, im: n.querySelector('img') }));
    const head = q(`.${P}-hd span`), [prev, next] = root.querySelectorAll(`.${P}-hd i`);
    const star = q(`.${P}-star`), spin = q(`.${P}-spin`), label = q(`.${P}-gen span`);
    const dls = [...root.querySelectorAll('.dl')];
    spin.style.cssText = 'transform: rotate(0deg); display: block';   // a fixed property order, so a seek leaves the same style text as a fresh load
    star.style.cssText = 'display: block';
    ctx.gate([...slots.map((s) => s.im), ...thumbs.map((s) => s.im)]);

    return {
      root,
      render(t) {
        // three generations of 4 + 4 + 2: each lands at S[k] (its last tile) and the next is pressed a beat later at P[k]
        const L = Math.max(0.6, ctx.lastLand - ctx.cardIn);
        const S = [ctx.cardIn + 0.42 * L, ctx.cardIn + 0.74 * L, ctx.lastLand];
        const Pk = [ctx.cardIn, S[0] + 0.07 * L, S[1] + 0.07 * L];
        const cur = t >= Pk[2] ? 2 : t >= Pk[1] ? 1 : 0;
        const pending = t < S[cur];
        grids.forEach((g, k) => { g.style.visibility = k === cur ? 'visible' : 'hidden'; });
        const swapAt = (s) => S[s.k] - (s.n - 1 - s.j) * 0.045 * L;
        slots.forEach((s) => {
          const swap = swapAt(s);
          const landed = t >= swap;
          const fs = Pk[s.k] + s.j * 0.05 * L;
          // the dim blurred render: nothing for a beat, then it brightens to a soft diagonal blob, never above a faint grey
          const fill = landed ? 0 : 0.5 * Math.pow(smooth(fs, swap, t), 1.4);
          s.fill.style.opacity = fill.toFixed(3);
          s.fill.style.visibility = landed || fill <= 0 ? 'hidden' : 'inherit';
          s.im.style.visibility = landed ? 'inherit' : 'hidden';   // 'inherit', so a hidden grid hides its landed images
          const th = thumbs[s.i];
          th.im.style.visibility = landed ? 'visible' : 'hidden';
          th.n.style.boxShadow = landed && s.k === cur && !pending ? 'inset 0 0 0 1.5px #abaefb' : '';
        });
        // the pill: 'Generate' while idle, 'Generating image' with the rotating arc while a set is pending
        star.style.display = pending ? 'none' : 'block';
        spin.style.display = pending ? 'block' : 'none';
        spin.style.transform = `rotate(${((t * 430) % 360).toFixed(1)}deg)`;
        const text = pending ? 'Generating image' : 'Generate';
        if (label.textContent !== text) label.textContent = text;
        const hd = pending ? 'NO IMAGES YET' : `IMAGE SET ${cur + 1}/3`;
        if (head.textContent !== hd) head.textContent = hd;
        prev.style.opacity = cur > 0 && !pending ? '1' : '0.45';
        next.style.opacity = '0.45';
        dls.forEach((d) => { d.style.opacity = pending ? '0.38' : '1'; });
      },
    };
  },
};
