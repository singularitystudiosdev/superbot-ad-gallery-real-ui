// NightCafe Studio's create flow in its 2026 layout (the official channel's YouTube -ZRO1NrnX-Q, 2026-08-17, a screen recording of
// creator.nightcafe.studio, pending tile t~79.5-82.0 s; spec .tmp/clone-9e82faf1/reveal-refs/nightcafe/spec.json, confidence 0.62;
// frames q_nc_pending_t80.5.png, q_nc_reveal_t82.0.png, q_nc_p14_full.png). A near-black three-column app shell (#0E0E10): a nav
// row, a left composer (CREATE with an Image / Video / Upload toggle, a TEXT PROMPT box, small option chips and a full-width pink
// 'Create' button), a centre creation canvas under a 'Creation: ...' header, and a right CREATIONS rail. Pressing Create opens the
// creation view, whose pending tile is a flat dark grey (#3A3A3A) rectangle at the output's aspect with a solid blue 'RUNNING' badge
// (#1E7FE0, white caps) at its top-right; there is no spinner, bar, percentage or queue number. When the render finishes the tile
// hard-swaps to the picture, the badge goes, and the header gains a green 'Done' button and the rail a new entry.
// Adapted to ten images: ten tiles in a 4 + 4 + 2 block, every one RUNNING until its turn, then landing in strict reading order.
// Omitted: the 'NightCafe CREATOR' script watermark in the middle of the pending tile (a wordmark: the tile carries a plain neutral
// picture glyph instead), the wordmark in the nav row, the 'FREE' tag on the button, the credits counter, avatar and the assistant
// chat panel. The footage's pictures are never reproduced: every tile is our own meme; no platform font is drawn (system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-nc';
const ROOT_H = 404, LEFT_W = 142, RAIL_W = 82, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0e0e10; color: #dcdce0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d1d22; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 14px; height: 30px; padding: 0 14px; font-size: 8px; font-weight: 500; color: #b9b9c0; white-space: nowrap; }
.${P}-nav span { flex: none; }
.${P}-nav b { margin-left: auto; display: grid; place-items: center; box-sizing: border-box; height: 18px; padding: 0 9px; border-radius: 5px; background: #2a2a2f; font-size: 8px; font-weight: 500; color: #cfcfd6; }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 6px; padding: 0 6px 6px; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; width: ${LEFT_W}px; padding: 8px; border-radius: 8px; background: #151518; }
.${P}-seg { flex: none; display: flex; align-items: center; gap: 2px; height: 18px; font-size: 6.5px; color: #8e8e96; }
.${P}-seg em { font-style: normal; letter-spacing: .04em; margin-right: 4px; }
.${P}-seg span { display: grid; place-items: center; height: 15px; padding: 0 5px; border-radius: 4px; }
.${P}-seg .on { background: #2a2a2f; color: #e8e8ec; }
.${P}-lab { flex: none; margin-top: 4px; font-size: 6px; letter-spacing: .06em; color: #8e8e96; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 110px; padding: 6px 7px; border-radius: 6px; background: #0e0e10; box-shadow: inset 0 0 0 1px #2a2a2f; font-size: 7.5px; line-height: 11px; color: #e3e3e7; overflow: hidden; }
.${P}-opts { flex: none; display: flex; gap: 7px; font-size: 6px; color: #8e8e96; white-space: nowrap; }
.${P}-note { flex: none; margin-top: 4px; font-size: 6.5px; color: #b9b9c0; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 26px; border-radius: 6px; background: #ef4f6a; font-size: 9px; font-weight: 700; color: #ffffff; }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; border-radius: 8px; background: #151518; overflow: hidden; }
.${P}-ch { flex: none; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 8px; font-size: 8px; font-weight: 600; color: #f1f1f4; white-space: nowrap; overflow: hidden; }
.${P}-ch span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-ch i { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 3px; background: #3d8b52; font-size: 7px; font-style: normal; font-weight: 600; color: #ffffff; }
.${P}-area { position: relative; flex: 1; min-height: 0; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; text-align: center; transform: translateY(-50%); font-size: 7.5px; color: #6a6a72; }
.${P}-g { position: absolute; left: 8px; right: 8px; top: 2px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 4px; overflow: hidden; background: #3a3a3a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: grid; place-items: center; background: #3a3a3a; }
.${P}-c svg { display: block; width: 18px; height: 18px; fill: none; stroke: #4a4a4c; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-c b { position: absolute; right: 3px; top: 3px; box-sizing: border-box; height: 8.5px; padding: 0 3px; border-radius: 2px; background: #1e7fe0; font-size: 4.8px; line-height: 8.5px; font-weight: 700; letter-spacing: .03em; color: #ffffff; white-space: nowrap; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 8px 8px 6px; border-radius: 8px; background: #151518; overflow: hidden; }
.${P}-rh { flex: none; height: 12px; font-size: 6px; letter-spacing: .06em; color: #8e8e96; line-height: 12px; }
.${P}-hi { flex: none; aspect-ratio: 1; border-radius: 4px; background: #2b2b2d; }
.${P}-hi.new { box-shadow: 0 0 0 1px #8a5cf6; background: #3a3a3a; }
`;

const PROMPT = 'A muse holding a handwritten note in a lecture hall, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Create
const ISSUE = 0.16;                               // the empty canvas gives way to the ten RUNNING tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps to its picture (reading order), the last at 1.68
const FADE = 0.04;                                // a tile's grey cover thins away over this long before the picture lands
const GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3L15.5 13 20 17.5"/></svg>';

export default {
  id: 'nightcafe',
  label: 'NightCafe (2026)',
  source: {
    platform: "NightCafe Studio web app (creator.nightcafe.studio), the 2026 studio layout (the official channel's walkthrough on YouTube, 2026-08-17)",
    feature: "near-black three-column shell: a left composer with a pink 'Create' button, a centre creation canvas whose pending tile is a flat #3A3A3A rectangle at the output aspect with a blue 'RUNNING' badge (no spinner, bar or percentage) hard-swapping to the picture, a right CREATIONS rail (adapted to 10: a 4 + 4 + 2 tile block, all RUNNING, landing in strict reading order; the 'NightCafe CREATOR' watermark, the wordmark and the 'FREE' tag are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=-ZRO1NrnX-Q', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'nightcafe');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c">${GLYPH}<b>RUNNING</b></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span>My Creations</span><span>My Feed</span><span>Explore</span><span>Challenges</span><span>Prompt</span><b>Create</b></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-seg"><em>CREATE</em><span class="on">Image</span><span>Video</span><span>Upload</span></div><div class="${P}-lab">TEXT PROMPT</div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-opts"><span>Image</span><span>Character</span><span>Prompt Magic</span></div><div class="${P}-note">10 images</div><div class="${P}-go">Create</div></div><div class="${P}-cv"><div class="${P}-ch"><span>Creation: ten Muse memes</span><i style="visibility: hidden">Done</i></div><div class="${P}-area"><div class="${P}-es">Your creation will appear here</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div><div class="${P}-rail"><div class="${P}-rh">CREATIONS</div><div class="${P}-hi new" style="visibility: hidden"></div><div class="${P}-hi"></div><div class="${P}-hi"></div><div class="${P}-hi"></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`);
    const done = root.querySelector(`.${P}-ch i`), fresh = root.querySelector(`.${P}-hi.new`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Create is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty canvas gives way to the ten RUNNING tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.visibility = v ? 'hidden' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; } else { c.cv.style.display = ''; c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });

        // the creation is Done and filed in the rail once the last picture has landed
        const fin = s >= LAND[9];
        put('fin', fin, (v) => { done.style.visibility = v ? '' : 'hidden'; fresh.style.visibility = v ? '' : 'hidden'; });
      },
    };
  },
};
