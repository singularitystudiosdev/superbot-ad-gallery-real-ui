// Google Search's generative-AI image creation (the 2023 SGE / Search Labs build), as shown in a real Chrome screen recording of google.com
// (YouTube fs6WLqVuvqQ, 2023-10-13, t~52.0-60.5 s; spec .tmp/clone-9e82faf1/reveal-refs/google-search-create-images/spec.json, confidence 0.6, frames
// am2_sge_placeholder_grid.png, am2_sge_four_images.png). A white results page: a search box holding the typed 'draw an image of ...' query with
// its clear cross, a tab strip 'AI Mode | Images | News | Shopping | Videos | Maps', the grey caption 'Generative AI is experimental' beside a
// small four-point sparkle, and under it a grid of pale-blue rounded placeholder tiles (about #E7F1FE, ~10 px radius) carrying only a faint
// diagonal sheen. There is no spinner, no percentage and no text on a tile: each one is simply swapped for its finished picture, and a larger
// 'Generated image' panel then shows the first picture on the right.
// Adapted to ten images: the footage's 2 x 2 grid is extrapolated to ten tiles in a 4 + 4 + 2 block resolving in strict reading order (the sheen
// sweeps from render(t) and is frozen once the last tile has landed), then the panel with the first picture. Omitted: the Google wordmark and the
// account avatar (a plain search box stands in). The footage's pictures are never reproduced: every tile is our own meme.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gsc';
const FONT = `'Google Sans', Roboto, ${UI_FONT}`;
const ROOT_H = 384, COLS = 4, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f8fafd; color: #202124; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3e7ee; }
.${P}-bar { flex: none; box-sizing: border-box; padding: 9px 16px 0; background: #fff; box-shadow: 0 1px 6px rgba(32, 33, 36, .08); }
.${P}-box { display: flex; align-items: center; gap: 7px; box-sizing: border-box; width: 436px; max-width: 100%; height: 28px; padding: 0 9px 0 12px; border-radius: 14px; background: #fff; box-shadow: 0 1px 5px rgba(32, 33, 36, .22); }
.${P}-q { flex: 1; min-width: 0; font-size: 9px; color: #202124; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-x { flex: none; width: 9px; height: 9px; fill: none; stroke: #5f6368; stroke-width: 1.5; stroke-linecap: round; }
.${P}-go { flex: none; display: block; width: 12px; height: 12px; fill: none; stroke: #1a73e8; stroke-width: 1.7; stroke-linecap: round; }
.${P}-tabs { display: flex; align-items: center; gap: 6px; height: 29px; padding-top: 5px; }
.${P}-tabs span { display: flex; align-items: center; box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 1px #dadce0; font-size: 8px; color: #202124; white-space: nowrap; }
.${P}-tabs span:first-child { color: #1a73e8; }
.${P}-body { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 10px 16px 0; }
.${P}-cap { flex: none; display: flex; align-items: center; gap: 6px; height: 14px; font-size: 8.5px; color: #4d5156; white-space: nowrap; }
.${P}-cap svg { flex: none; width: 11px; height: 11px; fill: #1a73e8; }
.${P}-main { position: relative; flex: 1; min-height: 0; margin-top: 8px; }
.${P}-g { position: absolute; left: 0; top: 0; width: 342px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: #e7f1fe; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(135deg, #e7f1fe 0%, #eaf2ff 45%, #f1f5fb 70%, #e7f1fe 100%); }
.${P}-pend i { position: absolute; left: 0; top: -20%; bottom: -20%; width: 70%; background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .6), rgba(255, 255, 255, 0)); transform: translateX(-100%) skewX(-22deg); }
.${P}-btns { position: absolute; left: 0; top: 262px; display: flex; gap: 6px; }
.${P}-btns span { display: flex; align-items: center; box-sizing: border-box; height: 20px; padding: 0 10px; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 1px #dadce0; font-size: 8px; color: #1a73e8; white-space: nowrap; }
.${P}-pn { position: absolute; right: 0; top: 0; width: 168px; box-sizing: border-box; padding: 9px 9px 10px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px #e3e7ee, 0 1px 4px rgba(32, 33, 36, .1); }
.${P}-pn b { display: block; height: 12px; font-size: 8.5px; font-weight: 500; line-height: 12px; color: #202124; }
.${P}-pic { position: relative; margin-top: 6px; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #e7f1fe; }
.${P}-pic img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pn em { display: block; margin-top: 6px; height: 20px; overflow: hidden; font-style: normal; font-size: 7.5px; line-height: 10px; color: #5f6368; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style, bright colours';
const QUERY = `draw an image of ${PROMPT}`;
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the search button is pressed
const ISSUE = 0.16;                               // the result column gives way to the ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i is swapped for its picture (reading order), the last at 1.68
const PANEL_AT = 1.74;                            // the larger 'Generated image' panel shows the first picture
const FADE = 0.05;                                // the pale cover thins away over this long before the picture lands
const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 1.5C12.7 8.2 15.8 11.3 22.5 12C15.8 12.7 12.7 15.8 12 22.5C11.3 15.8 8.2 12.7 1.5 12C8.2 11.3 11.3 8.2 12 1.5Z"/></svg>';
const TABS = ['AI Mode', 'Images', 'News', 'Shopping', 'Videos', 'Maps'];

export default {
  id: 'google-search-create-images',
  label: 'Google Search SGE images (2023)',
  source: {
    platform: 'Google Search results page with the Search Labs generative-AI experiment (SGE), desktop Chrome, light theme (a real screen recording, 2023-10)',
    feature: "a search box holding the typed 'draw an image of ...' query, the tab strip AI Mode / Images / News / Shopping / Videos / Maps and the caption 'Generative AI is experimental'; silent pale-blue (#E7F1FE, ~10 px radius) placeholder tiles with a faint diagonal sheen, no spinner, percentage or text, each hard-swapped for its finished picture in reading order, then a larger 'Generated image' panel showing the first picture (adapted to 10: a 4 + 4 + 2 tile block extrapolated from the footage's 2 x 2; the sheen is driven from t and frozen once the last tile has landed; the Google wordmark and the account avatar are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=fs6WLqVuvqQ', retrieved: '2026-10-14', published: '2023-10-13' }],
    videoIds: ['fs6WLqVuvqQ'],
    dates: ['2023-10-13'],
    extrapolated: ['ten tiles in a 4 + 4 + 2 block (the footage shows a 2 x 2 grid of four)', 'tile landing times and the sheen sweep speed (the footage is a compressed montage)', 'the panel caption line (not legible in the footage) restates the prompt'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-search-create-images');
    const panelSrc = ownSrc(ctx.src, 'google-search-create-images-panel');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i></i></div></div>`;
    const cross = '<svg class="' + P + '-x" viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>';
    const lens = '<svg class="' + P + '-go" viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.6"/><path d="M7.8 7.8l3 3"/></svg>';
    const g0 = tiles[0];
    const root = x.el(`<div class="${P}"><div class="${P}-bar"><div class="${P}-box"><span class="${P}-q">${x.esc(QUERY)}</span>${cross}${lens}</div><div class="${P}-tabs">${TABS.map((s) => `<span>${x.esc(s)}</span>`).join('')}</div></div><div class="${P}-body"><div class="${P}-cap" style="visibility: hidden">${SPARK}<span>Generative AI is experimental</span></div><div class="${P}-main"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-btns" style="visibility: hidden"><span>Image</span></div><div class="${P}-pn" style="visibility: hidden"><b>Generated image</b><div class="${P}-pic"><img src="${panelSrc}" width="870" height="1024" decoding="sync" alt="Generated image" style="transform-origin: ${g0.origin}; transform: ${restTransform(g0)}; filter: ${restFilter(g0)}"/></div><em>${x.esc(PROMPT)}</em></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const lensEl = q(`.${P}-go`), cap = q(`.${P}-cap`), grid = q(`.${P}-g`), btns = q(`.${P}-btns`), panel = q(`.${P}-pn`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), sheen: n.querySelector(`.${P}-pend i`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), q(`.${P}-pic img`)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sf = Math.min(s, LAND[9]);               // the sheen's clock: it stops with the last tile

        // the search button is pressed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { lensEl.style.transform = gp > 0 ? `scale(${(1 - 0.18 * gp).toFixed(4)})` : 'none'; });

        // the results column opens: caption, then the ten pending tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { cap.style.visibility = v ? '' : 'hidden'; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the diagonal sheen sweeps across a pending tile; a function of the clock alone, frozen once the last tile has landed
          const ph = (((sf * 0.85 + i * 0.11) % 1) + 1) % 1;
          put(`h${i}`, ph.toFixed(3), () => { c.sheen.style.transform = `translateX(${(-100 + ph * 340).toFixed(1)}%) skewX(-22deg)`; });
        });

        // the larger 'Generated image' panel, with the first picture, once the tiles are all in
        put('pan', s >= PANEL_AT, (v) => { panel.style.visibility = v ? '' : 'hidden'; btns.style.visibility = v ? '' : 'hidden'; });
      },
    };
  },
};
