// Ludo.ai Image Generator (YouTube JPhY5di-OSg 'How to Make Game Assets with AI (2026)', Ludo AI official channel, published 2026-10-06,
// t~16.9-17.6 s; spec .tmp/clone-9e82faf1/reveal-refs/ludo-ai/spec.json, confidence 0.55; frames ao2_ludo_t16.9.png,
// ao2_ludo_t17.0.png, ao2_ludo_pending_zoom.png, ao2_ludo_t17.4.png, ao2_ludo_t17.6.png). A dark violet app shell (#1B1035, bar #0F0A24)
// holding the Image Generator: a navy 'Filters' strip with three dropdowns (Art Style / Perspective / Aspect Ratio), a white prompt row with
// a Generate button that sits grey until pressed, and a white results card. Pressing Generate swaps the empty results area for pale lilac
// tiles (#E3DAFA) each holding a flat purple rounded cube (#7C5CE0); there is no spinner arc, caption, percentage or shimmer. The cube
// is replaced in place, with no blur and no fade, by the finished sprite.
// Adapted to ten images: ten square tiles in a 5 + 5 block landing one after another in strict reading order, each captioned with a
// style name as the footage's grid columns are. Extrapolated (the footage holds ~0.3-0.6 s of wait and a single placeholder tile): the ten
// simultaneous placeholders, the reading-order landing spread over the whole beat, the stretch of the wait, the captions of the second row.
// Omitted: the LUDO wordmark, the browser chrome and cursor, the assistant rail, and every credit or plan element. The footage's own
// pictures are never reproduced; every tile is our own meme, and the cube is drawn here as plain SVG with system type.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ldo';
const ROOT_H = 392, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1b1035; color: #ece8fa; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2a1d4d; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 14px; height: 28px; padding: 0 14px; background: #0f0a24; font-size: 8px; font-weight: 500; color: #7f76a6; white-space: nowrap; }
.${P}-top b { font-size: 10px; font-weight: 700; color: #f4f1ff; }
.${P}-top span { padding: 3px 0; }
.${P}-fil { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; height: 60px; padding: 9px 14px 0 14px; background: #0a0a36; box-shadow: inset 3px 0 0 #4b4be0; }
.${P}-fh { display: flex; align-items: center; gap: 4px; height: 10px; font-size: 8px; font-weight: 600; color: #cfd0ff; }
.${P}-fh svg { width: 7px; height: 7px; fill: none; stroke: #9a9bdc; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-fr { display: flex; gap: 16px; }
.${P}-fd { display: flex; flex-direction: column; gap: 2px; font-size: 6.5px; font-weight: 600; color: #8f92e8; }
.${P}-fd div { display: flex; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; min-width: 82px; height: 18px; padding: 0 8px 0 9px; border-radius: 9px; background: #04041f; font-size: 8px; font-weight: 500; color: #f4f1ff; white-space: nowrap; }
.${P}-fd i { display: block; width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 4px solid #f4f1ff; }
.${P}-pr { flex: none; display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 44px; padding: 0 14px; background: #ffffff; border-bottom: 1px solid #ece8f8; }
.${P}-in { flex: 1; min-width: 0; display: flex; align-items: center; box-sizing: border-box; height: 26px; padding: 0 10px; border-radius: 13px; box-shadow: inset 0 0 0 1px #d6d0ee; background: #faf9ff; font-size: 8.5px; color: #251a45; white-space: nowrap; overflow: hidden; }
.${P}-go { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 78px; height: 26px; border-radius: 13px; background: #d9d6e4; font-size: 9px; font-weight: 700; color: #8b86a2; }
.${P}-res { position: relative; flex: 1; min-height: 0; box-sizing: border-box; padding: 10px 12px 0 12px; background: #ffffff; }
.${P}-es { position: absolute; left: 0; right: 0; top: 50%; display: flex; flex-direction: column; align-items: center; gap: 6px; transform: translateY(-55%); font-size: 8.5px; color: #8b86a2; }
.${P}-es i { display: block; width: 40px; height: 40px; border-radius: 8px; background: #f2effc; box-shadow: inset 0 0 0 1px #e3dcf7; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 8px ${GAP}px; }
.${P}-c { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #e3dafa; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #e3dafa; box-shadow: inset 0 0 0 1px #f4f0ff; }
.${P}-pend svg { display: block; width: 46%; height: 46%; }
.${P}-n { position: absolute; left: 4px; top: 4px; display: grid; place-items: center; width: 11px; height: 11px; border-radius: 50%; background: rgba(27, 16, 53, .78); font-size: 6px; font-weight: 700; font-style: normal; color: #f4f1ff; }
.${P}-cap { height: 9px; font-size: 6.5px; line-height: 9px; color: #6a6388; text-align: center; white-space: nowrap; overflow: hidden; }
`;

const PROMPT = 'A muse holding a handwritten note in a lecture hall, meme style, bright colours';
const CAPS = ['Western Cartoon', 'Anime', 'Chibi', 'Micro Pixel', 'Cel-Shaded', 'Illustration', 'Inked Painterly', 'Pixel Art', '32-Bit', '16-Bit'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the empty results area gives way to the ten placeholder tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its cube over to the picture (reading order), the last at 1.68

// the placeholder: a flat rounded isometric cube in two purples, with pale pips as on the footage's tile
const CUBE = '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke-width="3" stroke-linejoin="round"><path d="M24 7.5L39 16L24 24.5L9 16Z" fill="#a48cf0" stroke="#a48cf0"/><path d="M9 16L24 24.5V40.5L9 32Z" fill="#7c5ce0" stroke="#7c5ce0"/><path d="M39 16V32L24 40.5V24.5Z" fill="#6a49cf" stroke="#6a49cf"/></g><g fill="#bfe4fb"><circle cx="24" cy="16" r="1.7"/><circle cx="15" cy="23.5" r="1.5"/><circle cx="18.5" cy="30" r="1.5"/><circle cx="31" cy="24" r="1.5"/><circle cx="31" cy="31" r="1.5"/><circle cx="29" cy="27.5" r="1.5"/></g></svg>';

export default {
  id: 'ludo-ai',
  label: 'Ludo.ai Image Generator (2026)',
  source: {
    platform: "Ludo.ai web app, the 'Image Generator' (desktop browser, dark violet shell with a white results card; Ludo AI's official tutorial 'How to Make Game Assets with AI (2026)' on YouTube)",
    feature: "an Image Generator panel: a 'Filters' strip (Art Style / Perspective / Aspect Ratio), a prompt row with a Generate button that is grey until pressed, and a results card whose empty area becomes pale lilac tiles each holding a flat purple rounded cube (#7C5CE0 on #E3DAFA, no spinner arc, caption, percentage or shimmer); the cube is replaced in place by the finished sprite, tile by tile (adapted to ten tiles in a 5 + 5 block, strict reading order; the logo and every credit or plan element are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=JPhY5di-OSg', videoId: 'JPhY5di-OSg', published: '2026-10-06', retrieved: '2026-10-14' }],
    videoIds: ['JPhY5di-OSg'],
    dates: { published: '2026-10-06', retrieved: '2026-10-14', capture: 't~16.9-17.6 s of a 294 s screen recording' },
    extrapolated: ['ten simultaneous placeholder tiles (the footage shows one cube tile)', 'strict reading-order landing spread over the whole beat (the footage swaps the cube for sprites within ~0.3-0.6 s)', 'the length of the wait, which the produced tutorial may time-compress', 'the style captions of the second row of tiles', 'the exact prompt wording (the footage shows a different prompt)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'ludo-ai');
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${CUBE}</div><i class="${P}-n" style="display: none">${i + 1}</i></div><span class="${P}-cap">${CAPS[i]}</span></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const dd = (lab, val) => `<div class="${P}-fd">${lab}<div>${val}<i></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>Image Generator</b><span>Sprite Generator</span><span>Animate</span></div><div class="${P}-fil"><div class="${P}-fh">Filters${chev}</div><div class="${P}-fr">${dd('Art Style', 'Any style')}${dd('Perspective', 'Any perspective')}${dd('Aspect Ratio', 'Auto')}</div></div><div class="${P}-pr"><div class="${P}-in">${x.esc(PROMPT)}</div><div class="${P}-go">Generate</div></div><div class="${P}-res"><div class="${P}-es"><i></i>Your images will appear here</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), es = root.querySelector(`.${P}-es`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), num: n.querySelector(`.${P}-n`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed: the grey button turns violet and dips
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('goc', s >= GEN_AT, (v) => { go.style.background = v ? '#7c5ce0' : ''; go.style.color = v ? '#ffffff' : ''; });

        // the empty results area gives way to the ten placeholder tiles
        const on = s >= ISSUE;
        put('iss', on, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        // each cube is replaced in place by its picture, in reading order (no fade: the footage swaps at once)
        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; c.num.style.display = v ? '' : 'none'; });
        });
      },
    };
  },
};
