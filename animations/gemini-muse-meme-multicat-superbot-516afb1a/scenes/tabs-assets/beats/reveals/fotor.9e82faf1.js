// Fotor's AI Image Generator, fotor.com/images/create as it ran in January 2024 (YouTube nxyuSLd0ZHw, KnowledgeBase, 2024-01-15,
// t~62.4-70.3 s; spec .tmp/clone-9e82faf1/reveal-refs/fotor/spec.json, confidence 0.70; frames s_pending_full.png, s_pending_overlay.png,
// s_complete.png). A dark web app: a slim top bar (Create / Inspiration / My Creation), a left panel (the 'From Text' | 'From Image'
// switch, the prompt with a 'Negative Prompts' toggle, 'Model version', 'Aspect Ratios', a 'Styles' grid, an image-count select and a
// green 'Generate' button), a centre result canvas and a right 'My Creation' rail. Pressing Generate turns the canvas into near-black
// placeholder slots (#26282A, split by a faint darker seam #1A1C1F, one per image) and floats a black rounded status card (#161618) in
// the middle: the line 'Speeding up for image generating...' in a moving gradient shimmer with an animated ellipsis, a small
// multicolour dot spinner at its right, and under it a lime 'Tips' pill beside the tip sentence the footage shows. There is no
// percentage, bar or queue position; after ~8 s the finished pictures replace the slots and the card disappears.
// Adapted to ten images: the count select reads '10 images' (the product allows 1 to 6; its own tip text, kept verbatim below, says so
// and still names the default of 2), ten slots in a 4 + 4 + 2 block, and instead of all pictures appearing together they land one by
// one in reading order once the card has gone; the finished ones are also filed at the head of the 'My Creation' rail, as in the
// footage. The ~8 s wait is compressed into the beat's window (extrapolated). Omitted: the logo and wordmark, the credits counter and
// pill, the 'Earn FREE Credits' card and the footage's own pictures: every tile is our own meme (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ft';
const ROOT_H = 424, TOP_H = 24, LEFT_W = 158, RAIL_W = 58, COLS = 4, GAP = 4, RAIL_N = 4;
const GREEN = '#46af7e';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #161618; color: #e9eaeb; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #26282a; }
.${P}-top { flex: none; position: relative; display: flex; align-items: center; height: ${TOP_H}px; padding: 0 10px; background: #0e0e10; font-size: 7.5px; color: #b6b8bb; white-space: nowrap; }
.${P}-top i { display: block; width: 8px; height: 8px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.4px #e9eaeb; margin-right: 5px; }
.${P}-nav { position: absolute; left: 50%; top: 0; bottom: 0; display: flex; align-items: center; gap: 14px; transform: translateX(-50%); }
.${P}-nav .on { color: #55d49a; font-weight: 600; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 8px 8px 8px 8px; gap: 6px; }
.${P}-sw { flex: none; display: flex; gap: 3px; padding: 2px; height: 20px; border-radius: 7px; background: #26282a; font-size: 7px; font-weight: 600; color: #a9acb0; box-sizing: border-box; }
.${P}-sw span { flex: 1; display: grid; place-items: center; border-radius: 5px; white-space: nowrap; }
.${P}-sw .on { background: #c6f2d9; color: #0f3a26; }
.${P}-pr { flex: none; box-sizing: border-box; height: 46px; padding: 5px 6px; border-radius: 5px; background: #fff; font-size: 7px; line-height: 10px; color: #26282a; overflow: hidden; }
.${P}-ng { flex: none; display: flex; justify-content: space-between; align-items: center; height: 10px; font-size: 6.5px; color: #a9acb0; }
.${P}-ng b { display: block; width: 14px; height: 7px; border-radius: 4px; background: #4a4c50; }
.${P}-lb { flex: none; height: 9px; font-size: 6.5px; line-height: 9px; color: #a9acb0; }
.${P}-dd { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 5px; background: #26282a; font-size: 7.5px; color: #f1f2f3; }
.${P}-dd svg { width: 7px; height: 7px; fill: none; stroke: #a9acb0; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ar { flex: none; display: flex; gap: 3px; }
.${P}-ar span { flex: 1; display: grid; place-items: center; box-sizing: border-box; height: 16px; border-radius: 4px; background: #26282a; font-size: 6.5px; color: #c9cbce; }
.${P}-ar .on { box-shadow: inset 0 0 0 1px #55d49a; color: #fff; }
.${P}-st { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.${P}-st div { display: flex; flex-direction: column; gap: 2px; font-size: 5.5px; line-height: 7px; color: #c9cbce; text-align: center; white-space: nowrap; }
.${P}-st i { display: block; aspect-ratio: 1.25; border-radius: 4px; }
.${P}-ft { margin-top: auto; flex: none; display: flex; gap: 5px; align-items: center; }
.${P}-ft .dd { flex: none; width: 66px; white-space: nowrap; }
.${P}-go { flex: 1; display: grid; place-items: center; height: 22px; border-radius: 6px; background: linear-gradient(90deg, #3fae78, #8ee07f); font-size: 8px; font-weight: 700; color: #06210f; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #1a1c1f; border-radius: 0; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 50%; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; transform: translateY(-50%); }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; background: #26282a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #26282a; }
.${P}-card { position: absolute; left: 50%; top: 50%; box-sizing: border-box; width: 244px; padding: 10px 12px 11px; margin: -33px 0 0 -122px; border-radius: 9px; background: #161618; box-shadow: 0 0 0 1px #202225; }
.${P}-l1 { display: flex; align-items: center; justify-content: space-between; height: 14px; }
.${P}-sh { font-size: 8px; line-height: 12px; font-weight: 600; white-space: nowrap; color: transparent; background: linear-gradient(90deg, #ff5ad8 0%, #46af7e 22%, #4fe0ff 44%, #ffffff 56%, #ff5ad8 78%, #46af7e 100%); background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; }
.${P}-sp { flex: none; display: block; width: 11px; height: 11px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255, 90, 216, 0), #ff5ad8 90deg, #5a7cff 200deg, rgba(90, 124, 255, 0) 340deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.4px), #000 calc(100% - 1.9px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.4px), #000 calc(100% - 1.9px)); }
.${P}-l2 { display: flex; align-items: flex-start; gap: 6px; margin-top: 7px; font-size: 6.5px; line-height: 9px; color: #88888a; }
.${P}-l2 b { flex: none; padding: 0 5px; height: 11px; border-radius: 4px; background: ${GREEN}; font-size: 6.5px; line-height: 11px; font-weight: 600; color: #fff; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 8px 6px; background: #161618; box-shadow: inset 1px 0 0 #202225; }
.${P}-rh { flex: none; height: 10px; font-size: 6.5px; line-height: 10px; color: #a9acb0; white-space: nowrap; }
.${P}-ri { position: relative; flex: none; aspect-ratio: 870 / 1024; overflow: hidden; border-radius: 4px; background: #26282a; }
.${P}-ri img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy.';
const TIP = 'By default, 2 images will be generated per generation. You can change this to 1 to 6 images in the lower left corner of the page.';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses Generate
const ISSUE = 0.14;                                // the canvas turns into the placeholder slots and the status card appears
const LAND = Array.from({ length: 10 }, (_, i) => 0.98 + i * 0.095);   // tile i lands (reading order), the last at 1.835
const STYLES = [['Pop Art', 'linear-gradient(135deg, #ff7a59, #ffd23f)'], ['Art Dolls', 'linear-gradient(135deg, #8a6bff, #ff8bd0)'], ['Jagged', 'linear-gradient(135deg, #2a6f9e, #9fd6e8)'], ['Color Merge', 'linear-gradient(135deg, #ff4f9a, #4f8bff)'], ['Tile Painting', 'linear-gradient(135deg, #b9803a, #f1d49a)'], ['Telegram', 'linear-gradient(135deg, #3aa8d8, #8ee0c0)']];

export default {
  id: 'fotor',
  label: 'Fotor (2024)',
  source: {
    platform: 'Fotor AI Image Generator, fotor.com/images/create (desktop browser, dark theme; a third-party screen recording on YouTube, 2024-01-15)',
    feature: "dark web app: a left panel (From Text tab, prompt, aspect ratio, styles, an image count, green Generate), a centre canvas that becomes near-black placeholder slots under a black status card ('Speeding up for image generating...' in gradient shimmer, a multicolour dot spinner, a lime Tips pill with the recorded tip sentence; no percentage or bar), a right My Creation rail (adapted to 10: the count select reads 10 though the product allows 1 to 6, ten slots in a 4 + 4 + 2 block landing one by one after the card; the logo, the credits counter and the Earn FREE Credits card are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=nxyuSLd0ZHw', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=TAOwEa-WQbs', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage's ~8 s wait ends with both pictures appearing together; here the wait is compressed into the beat window and ten pictures land one by one afterwards; the image count 10 is outside the product's 1 to 6",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'fotor');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const styles = STYLES.map(([n, bg]) => `<div><i style="background: ${bg}"></i>${n}</div>`).join('');
    const rsrc = ownSrc(ctx.src, 'fotor-rail');   // the rail thumbnails are a smaller raster of the same picture: a URL of their own keeps their decode apart from the tiles'
    const rail = Array.from({ length: RAIL_N }, (_, i) => `<div class="${P}-ri"><img src="${rsrc}" width="870" height="1024" decoding="sync" alt="My Creation ${i + 1}" style="visibility: hidden; transform-origin: ${tiles[i].origin}"/></div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i></i><span>Tools</span><div class="${P}-nav"><span class="on">Create</span><span>Inspiration</span><span>My Creation</span></div></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-sw"><span class="on">From Text</span><span>From Image</span></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-ng">Negative Prompts<b></b></div><div class="${P}-lb">Model version</div><div class="${P}-dd">Fotor M2${chev}</div><div class="${P}-lb">Aspect Ratios</div><div class="${P}-ar"><span class="on">1:1</span><span>4:3</span><span>3:4</span><span>16:9</span><span>9:16</span></div><div class="${P}-lb">Styles</div><div class="${P}-st">${styles}</div><div class="${P}-ft"><div class="${P}-dd dd">${tiles.length} images${chev}</div><div class="${P}-go">Generate</div></div></div><div class="${P}-cv"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-card" style="visibility: hidden"><div class="${P}-l1"><span class="${P}-sh">Speeding up for image generating<span class="${P}-el">...</span></span><i class="${P}-sp"></i></div><div class="${P}-l2"><b>Tips</b><span>${x.esc(TIP)}</span></div></div></div><div class="${P}-rail"><div class="${P}-rh">My Creation</div>${rail}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), grid = q(`.${P}-g`), card = q(`.${P}-card`), sh = q(`.${P}-sh`), sp = q(`.${P}-sp`), el = q(`.${P}-el`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    const rims = [...root.querySelectorAll(`.${P}-ri img`)];
    ctx.gate([...cells.map((c) => c.im), ...rims]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the canvas becomes the slots and the status card floats up; the card goes when the first picture lands
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        put('cd', s >= ISSUE && s < LAND[0], (v) => { card.style.visibility = v ? '' : 'hidden'; });

        // the status line's gradient shimmer sweeps, its ellipsis runs, the dot spinner turns: all from t
        const sx = ((((s * 90) % 220) + 220) % 220);
        put('sh', sx.toFixed(0), (v) => { sh.style.backgroundPosition = `${v}% 0`; });
        put('el', 1 + ((Math.floor(s * 5) % 3) + 3) % 3, (v) => { el.textContent = '.'.repeat(v); });
        const deg = ((t * 480) % 360 + 360) % 360;
        put('sp', deg.toFixed(0), (v) => { sp.style.transform = `rotate(${v}deg)`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, s >= a, (v) => { c.pend.style.display = v ? 'none' : ''; });
        });

        // the finished pictures are filed at the head of the My Creation rail once the last has landed
        const fin = s >= LAND[9];
        rims.forEach((im, i) => {
          put(`r${i}`, fin, (v) => { im.style.visibility = v ? '' : 'hidden'; });
          im.style.filter = restFilter(tiles[i]);
          im.style.transform = restTransform(tiles[i]);
        });
      },
    };
  },
};
