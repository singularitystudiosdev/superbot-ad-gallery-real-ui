// Adobe Stock Generate (2024), the 'Generate' tab of Adobe Stock on the web, stock.adobe.com/generate/images (one third-party screen
// recording on YouTube, 7EsyXEwN2xA, 2024-08-12, original t~80.6-88.5 s; spec .tmp/clone-9e82faf1/reveal-refs/adobe-stock-generate/spec.json,
// confidence 0.60; frames wy_adobestock_pend_05.png, wy_adobestock_reveal_01.png, wy_adobestock_generatepillzoom.png). A white
// nav row with the Generate item active, a left settings rail (Aspect ratio radios with 'Landscape (4:3)' selected, Content type
// radios, a '...' button and the wide Generate pill at its foot) and a #EEEEEE results column with a rounded prompt bar holding the
// prompt, a '...' button and the Generate pill. After Generate four landscape 4:3 tiles fill the results row, each a smooth
// diagonal grey shimmer (bright #F6F6F6 top-left and bottom-right corners, a #969696 band along the top-right to bottom-left
// diagonal, #C8C8C8 between) whose mean brightness cycles about every 2 s; there is no text, glyph, percentage or blur. In the same
// state the Generate pill turns light grey (#EAEAEA) and shows a blue indeterminate arc spinner in place of its label. All four
// tiles are replaced by the finished renders at once in a hard cut, and the pill's label becomes 'Refresh'.
// Adapted to ten images: ten landscape tiles in a 4 + 4 + 2 grid, all shimmering from Generate (the shimmer is driven by t, a
// ~2 s period) and hard-swapping to the pictures one after another in reading order (the source swaps all four at once). Omitted:
// the Adobe Stock mark and the nav's 'Unlimited images' and 'Pricing' pills, the account row, the rail's Style Reference and
// Effects blocks, the 'Similar from Adobe Stock' row and the footer strip. Every picture is our own meme; no logo, wordmark or
// platform font is drawn (plain grey, a plain arc, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-asg';
const ROOT_H = 352, RAIL_W = 112, COLS = 4, GAP = 6, PERIOD = 2;
const NAV = ['Photos', 'Illustrations', 'Vectors', 'Videos', 'Audio', 'Templates', 'Free', 'Fonts', 'Plugins', '3D', 'Generate'];
const ASPECT = ['Landscape (4:3)', 'Portrait (3:4)', 'Square (1:1)', 'Widescreen (16:9)'];
const CONTENT = ['None', 'Photo', 'Art'];
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #eee; color: #2c2c2c; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d4d4d4; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 11px; height: 26px; padding: 0 14px; background: #fff; box-shadow: 0 1px 0 #e1e1e1; font-size: 7px; color: #444; white-space: nowrap; }
.${P}-nav span.${P}-on { color: #1a1a1a; font-weight: 700; box-shadow: 0 2px 0 #1473e6; line-height: 24px; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${RAIL_W}px; padding: 10px 10px 8px 12px; background: #fafafa; box-shadow: 1px 0 0 #e1e1e1; }
.${P}-rh { margin: 0 0 6px; font-size: 7.5px; font-weight: 700; color: #1f1f1f; }
.${P}-rh.${P}-n { margin-top: 12px; }
.${P}-rd { display: flex; align-items: center; gap: 5px; height: 15px; font-size: 7px; color: #2c2c2c; white-space: nowrap; }
.${P}-rd i { flex: none; position: relative; width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; box-shadow: inset 0 0 0 1px #8a8a8a; background: #fff; }
.${P}-rd.${P}-on i { background: #1473e6; box-shadow: none; }
.${P}-rd.${P}-on i::after { content: ""; position: absolute; left: 2px; top: 2px; width: 3px; height: 3px; border-radius: 50%; background: #fff; }
.${P}-foot { margin-top: auto; display: flex; align-items: center; gap: 6px; }
.${P}-more { flex: none; font-size: 9px; font-weight: 700; line-height: 6px; letter-spacing: 1px; color: #444; }
.${P}-main { flex: 1; min-width: 0; box-sizing: border-box; padding: 10px 12px; }
.${P}-bar { display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 32px; padding: 0 6px 0 10px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #e1e1e1; font-size: 7.5px; color: #6a6a6a; white-space: nowrap; }
.${P}-bar .${P}-pt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-pill { display: flex; align-items: center; justify-content: center; box-sizing: border-box; height: 20px; border-radius: 10px; background: #1473e6; font-size: 7.5px; font-weight: 700; color: #fff; white-space: nowrap; }
.${P}-bar .${P}-pill { flex: none; width: 62px; }
.${P}-foot .${P}-pill { flex: 1; }
.${P}-arc { display: none; width: 10px; height: 10px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(20, 115, 230, 0) 0deg, #1473e6 270deg, rgba(20, 115, 230, 0) 300deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 14px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 6px; overflow: hidden; background: #c8c8c8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: linear-gradient(135deg, #f6f6f6 0%, #c8c8c8 28%, #969696 50%, #c8c8c8 72%, #f6f6f6 100%); }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the results row fills with the ten shimmering tiles
// the shimmer's gradient for a phase in [0, 1): the dark diagonal band sweeps across the tile while the whole sheen brightens and settles back
const shimmer = (ph) => {
  const w = 2 * Math.PI * ph;
  const m = 50 + 20 * Math.sin(w);                // where the band centre sits along the 135deg axis
  const dk = Math.round(150 + 34 * (0.5 - 0.5 * Math.cos(w)));   // the band's grey, #969696 at its darkest
  const hex = (n) => n.toString(16).padStart(2, '0').repeat(3);
  return `linear-gradient(135deg, #f6f6f6 0%, #c8c8c8 ${(m - 22).toFixed(1)}%, #${hex(dk)} ${m.toFixed(1)}%, #c8c8c8 ${(m + 22).toFixed(1)}%, #f6f6f6 100%)`;
};

export default {
  id: 'adobe-stock-generate',
  label: 'Adobe Stock Generate (2024)',
  source: {
    platform: "Adobe Stock on the web, the Generate tab at stock.adobe.com/generate/images (a third-party screen recording on YouTube, 2024-08-12; the page now redirects elsewhere and returns 403 to scrapers)",
    feature: "four landscape 4:3 result tiles each with an animated diagonal grey shimmer (#969696 to #F6F6F6, ~2 s period), the Generate pill turning light grey with a blue arc spinner in place of its label; no text, percentage or blur; the finished renders replace the tiles in one hard cut and the pill reads 'Refresh' (adapted to 10: a 4 + 4 + 2 grid of tiles, all shimmering from Generate, hard-swapping one after another in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=7EsyXEwN2xA', retrieved: '2026-10-14' },
    ],
    extrapolated: "The source swaps all four tiles on one frame and shows four tiles per batch: ten tiles in a 4 + 4 + 2 grid, sequenced to land one after another in reading order, and the second Generate pill at the rail's foot reading 'Refresh' once the batch has landed are extrapolated; the pill's pre-press blue state is the product's own and the shimmer's brightness cycle is fitted to the measured 166-195-166 mean-luminance period.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'adobe-stock-generate');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const pill = `<div class="${P}-pill"><i class="${P}-arc"></i><span>Generate</span></div>`;
    const rd = (n, on) => `<div class="${P}-rd${on ? ` ${P}-on` : ''}"><i></i>${n}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${NAV.map((n) => `<span${n === 'Generate' ? ` class="${P}-on"` : ''}>${n}</span>`).join('')}</div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-rh">Aspect ratio</div>${ASPECT.map((n, i) => rd(n, i === 0)).join('')}<div class="${P}-rh ${P}-n">Content type</div>${CONTENT.map((n, i) => rd(n, i === 0)).join('')}<div class="${P}-foot"><span class="${P}-more">...</span>${pill}</div></div><div class="${P}-main"><div class="${P}-bar"><span class="${P}-pt">${x.esc(PROMPT)}</span><span class="${P}-more">...</span>${pill}</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div></div>`);
    const pills = [...root.querySelectorAll(`.${P}-pill`)].map((n) => ({ n, arc: n.querySelector(`.${P}-arc`), lab: n.querySelector('span') }));
    const grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    cells.forEach((c) => { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed: the pill goes light grey and swaps its label for a blue arc; once the batch has landed it reads 'Refresh'
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        const st = s < GEN_AT ? 0 : t < ctx.lastLand ? 1 : 2;
        put('go', `${gp.toFixed(3)}${st}`, () => pills.forEach((p) => {
          p.n.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none';
          p.n.style.background = st === 0 ? '#1473e6' : '#eaeaea';
          p.n.style.color = st === 0 ? '#fff' : '#4a4a4a';
          p.arc.style.display = st === 1 ? 'block' : 'none';
          p.lab.style.display = st === 1 ? 'none' : '';
          p.lab.textContent = st === 2 ? 'Refresh' : 'Generate';
        }));

        // the results row fills with the shimmering tiles
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        // the sheen is a function of t alone: one shared phase, quantised to sixtieths of a period
        const q = Math.round((((t / PERIOD) % 1) + 1) % 1 * 60) % 60;
        put('sh', q, (v) => { const g = shimmer(v / 60); cells.forEach((c) => { c.pend.style.background = g; }); });

        cells.forEach((c, i) => {
          const done = t >= ctx.seq(i)[1];             // a hard swap, tile by tile, strictly in reading order
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });

        // the arc turns with t
        const deg = (((t * 420) % 360) + 360) % 360;
        put('arc', deg.toFixed(0), (d) => pills.forEach((p) => { p.arc.style.transform = `rotate(${d}deg)`; }));
      },
    };
  },
};
