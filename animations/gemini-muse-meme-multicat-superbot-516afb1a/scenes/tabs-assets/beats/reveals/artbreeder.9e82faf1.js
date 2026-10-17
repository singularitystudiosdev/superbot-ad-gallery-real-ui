// Artbreeder's July 2020 compose page (spec .tmp/clone-9e82faf1/reveal-refs/artbreeder/spec.json, confidence 0.60; footage
// bilibili BV1Ai4y1G7N6 published 2020-07-29, frames in that folder: ab-compose-sheet.png, ab-children-sheet.png,
// pending-tile-zoom.png). This is the pre-2026-redesign UI. On a light #E5EBF2 page the left rail holds the 'Parents' (a stack of
// parent thumbnails, each over a Content and a Style weight slider), the centre panel holds the 'Genes' (a three-column grid of named
// sliders, each over a small numeric box), and the right side holds the 'Children': a three-wide grid of tiles with a helper line
// above and a circular refresh button centred below. After the refresh button is pressed every child slot is a FLAT #9EA2A6 grey
// rectangle (no glyph, shimmer, percentage, spinner or status text anywhere) and each slot is replaced by its finished image in a
// single cut, one after another. The footage was Chrome-translated and showed a themed portrait mode; every label here is our own
// plain English (Parents, Genes, Content, Style, Children, Crossbreed, Edit Genes and meme-flavoured gene names), the parent
// thumbnails are plain gradient swatches, and no portrait, character, logo, wordmark or font from the footage is drawn or shipped.
// Adapted to ten images: ten child slots in rows of three plus one, grey until each hard-swaps to our meme in reading order on
// ctx.seq(i). Everything is a pure function of t (slider knobs and their numeric boxes glide on seeded targets, the refresh button
// shows pressed for a beat before the first swap; no CSS animation or transition), and every tile <img> stays in flow with
// visibility toggled, never display:none, so a seek paints like a fresh load.
import { injectStyle, hash, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ab';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; border-radius: 10px; overflow: hidden; background: #e5ebf2; color: #2b3138; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px rgba(0, 0, 0, .1); }
.${P}-nav { box-sizing: border-box; display: flex; align-items: center; gap: 12px; height: 26px; padding: 0 10px; background: #fff; box-shadow: 0 1px 0 rgba(0, 0, 0, .08); }
.${P}-ttl { margin-right: auto; font-size: 11px; line-height: 14px; font-weight: 700; letter-spacing: .02em; color: #1f252b; }
.${P}-lk { position: relative; font-size: 7.5px; line-height: 14px; color: #4a525b; }
.${P}-lk.on { color: #1f252b; font-weight: 700; }
.${P}-lk.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5px; height: 2px; background: #8c86c6; }
.${P}-bg { display: block; width: 10px; height: 7px; border-top: 1.5px solid #4a525b; border-bottom: 1.5px solid #4a525b; position: relative; }
.${P}-bg::after { content: ""; position: absolute; left: 0; right: 0; top: 2px; height: 1.5px; background: #4a525b; }
.${P}-bd { display: grid; grid-template-columns: 74px 172px minmax(0, 1fr); }
.${P}-hd { margin: 0; padding: 6px 0 5px; text-align: center; font-size: 8px; line-height: 10px; font-weight: 600; color: #4a525b; }
.${P}-rail { box-sizing: border-box; padding: 0 5px 8px; }
.${P}-btns { display: flex; gap: 2px; margin-bottom: 5px; }
.${P}-btns span { flex: 1; text-align: center; border-radius: 2px; background: #d3dbe5; font-size: 6px; line-height: 11px; color: #2b3138; }
.${P}-par { box-sizing: border-box; margin-bottom: 5px; padding: 2px; border-radius: 4px; background: #fff; }
.${P}-sw { display: block; width: 100%; aspect-ratio: 1.15; border-radius: 3px; }
.${P}-pw { display: flex; gap: 2px; margin-top: 2px; }
.${P}-pw div { flex: 1; min-width: 0; text-align: center; font-size: 5.5px; line-height: 8px; color: #2b3138; }
.${P}-sl { position: relative; display: block; height: 8px; margin-top: 1px; }
.${P}-sl::before { content: ""; position: absolute; left: 3px; right: 3px; top: 3.5px; height: 1px; background: #b9c0ca; }
.${P}-sl b { position: absolute; top: 0; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #8c86c6; }
.${P}-gn { box-sizing: border-box; padding: 0 3px 8px; }
.${P}-gg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; }
.${P}-g { box-sizing: border-box; padding: 2px 2px 1px; border-radius: 2px; background: #fff; text-align: center; }
.${P}-gl { display: block; overflow: hidden; white-space: nowrap; text-overflow: clip; font-size: 6px; line-height: 8px; color: #2b3138; }
.${P}-nb { display: block; box-sizing: border-box; width: 70%; height: 9px; margin: 1px auto 0; padding: 0 2px; border: 1px solid #c5cbd3; background: #eceff3; text-align: left; font-size: 6px; line-height: 7px; color: #3a424b; }
.${P}-ch { box-sizing: border-box; min-width: 0; padding: 0 6px 6px 3px; }
.${P}-hp { margin: 0 0 4px; text-align: center; font-size: 6.5px; line-height: 10px; color: #6b727b; }
.${P}-gr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px; }
.${P}-t { position: relative; aspect-ratio: 1.12; overflow: hidden; background: #9ea2a6; box-shadow: 0 0 0 1.5px #fff; }
.${P}-t img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-rf { display: grid; place-items: center; box-sizing: border-box; width: 24px; height: 24px; margin: 7px auto 0; border-radius: 50%; background: #dfe4ea; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08); }
.${P}-rf svg { width: 12px; height: 12px; fill: none; stroke: #5a626c; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
`;

const GENES = ['Contrast', 'Warmth', 'Chaos', 'Grain', 'Caption', 'Sharpness', 'Saturation', 'Vignette', 'Glow', 'Irony', 'Zoom', 'Deep fry', 'Impact', 'Sparkle', 'Banter'];
const PARENTS = [
  'linear-gradient(135deg, #f2c27a, #e08f6a)',
  'linear-gradient(135deg, #9fb7d6, #5f7fae)',
  'linear-gradient(135deg, #b9d6a8, #6fa07a)',
];
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export default {
  id: 'artbreeder',
  label: 'Artbreeder (2020)',
  source: {
    platform: 'Artbreeder (artbreeder.com) compose page, July 2020 build, before the 2026 redesign',
    feature: 'Compose page (Parents rail with Content and Style weights, Genes slider grid, three-wide Children grid): after the circular refresh button every child slot is a flat grey #9EA2A6 rectangle that hard-cuts to its finished image, no percentage, spinner or status text (adapted to 10: ten slots in rows of three plus one, swapping in reading order)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1Ai4y1G7N6', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'artbreeder');
    const tile = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/></div>`;
    const slider = '<i class="' + P + '-sl"><b></b></i>';
    const parent = (bg) => `<div class="${P}-par"><i class="${P}-sw" style="background: ${bg}"></i><div class="${P}-pw"><div>Content${slider}</div><div>Style${slider}</div></div></div>`;
    const gene = (n) => `<div class="${P}-g"><span class="${P}-gl">${x.esc(n)}</span><span class="${P}-nb">0</span>${slider}</div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-nav"><span class="${P}-ttl">Compose</span><span class="${P}-lk on">Crossbreed</span><span class="${P}-lk">Edit Genes</span><span class="${P}-lk">Browse</span><i class="${P}-bg"></i></div>
<div class="${P}-bd">
<div class="${P}-rail"><p class="${P}-hd">Parents</p><div class="${P}-btns"><span>Select</span><span>Random</span></div>${PARENTS.map(parent).join('')}</div>
<div class="${P}-gn"><p class="${P}-hd">Genes</p><div class="${P}-gg">${GENES.map(gene).join('')}</div></div>
<div class="${P}-ch"><p class="${P}-hd" style="padding-bottom:0">Children</p><p class="${P}-hp">Click a child to save it.</p><div class="${P}-gr">${tiles.map(tile).join('')}</div><span class="${P}-rf"><svg viewBox="0 0 24 24"><path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/></svg></span></div>
</div></div>`);

    const slots = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ n, im: n.querySelector('img') }));
    // every slider knob: the three parents' weights (Content, Style) first, then the genes; the genes also carry a numeric box
    const knobs = [...root.querySelectorAll(`.${P}-sl b`)];
    const boxes = [...root.querySelectorAll(`.${P}-nb`)];
    const nPar = PARENTS.length * 2;
    const rf = root.querySelector(`.${P}-rf`);
    const t0 = Math.min(ctx.cardIn, ctx.seq(0)[0]);
    const span = Math.max(0.3, ctx.lastLand - t0);
    // each knob rests at a seeded value and glides once, at a seeded moment inside the batch window, to a second one
    const motion = knobs.map((_, k) => {
      const v0 = 0.12 + 0.5 * hash(11, k), v1 = Math.min(0.95, Math.max(0.05, v0 + (hash(23, k) - 0.5) * 0.6));
      const a = t0 + span * 0.7 * hash(37, k), b = a + span * (0.25 + 0.2 * hash(41, k));
      return { v0, v1, a, b };
    });
    ctx.gate(slots.map((s) => s.im));

    return {
      root,
      render(t) {
        const pressA = ctx.seq(0)[0] - 0.2, pressB = ctx.seq(0)[0];
        const pressed = t >= pressA && t < pressB;
        rf.style.background = pressed ? '#c4cad2' : '#dfe4ea';
        rf.style.transform = pressed ? 'scale(.92)' : 'none';
        motion.forEach((m, k) => {
          const v = m.v0 + (m.v1 - m.v0) * smooth(m.a, m.b, t);
          knobs[k].style.left = `${(3 + v * 94).toFixed(2)}%`;
          if (k >= nPar) boxes[k - nPar].textContent = String(Math.round(v * 10));
        });
        slots.forEach((s, i) => {
          s.im.style.visibility = t >= ctx.seq(i)[1] ? 'visible' : 'hidden';
        });
      },
    };
  },
};
