// Dreamlike.art's /create page in 2025 (YouTube Z2pJ-qNNWi8, 2025-05-09, the result tiles at t=233-241 s; spec
// .tmp/clone-9e82faf1/reveal-refs/dreamlike-art/spec.json, confidence 0.60; frames ae_d01_empty_t231, ae_d02_pending_t233,
// ae_d03_timer_t235, ae_d05_landing_t241, ae_d06_montage). A near-black, blue-accented three-part page: a slim nav column (a blue Create
// button over Profile, FAQ, Settings, Discord, Twitter, Legal, Affiliate Program), a composer column ('Number of Images' slider,
// an 'Initial Image' drop zone with Clear / Upload, an 'Adapter' chip row, a 'Strength' slider, a 'Mode' pair and a wide blue
// Generate button) and a results column under an 'All | Enhanced | Favorited' chip row. The button turns the empty results line
// ('There's nothing here yet!') into dark navy tiles that hold NO spinner, bar, percentage or shimmer: each carries only a small
// centred caption in a muted blue-grey, 'Waiting, N.Ns' with a tiny 'Cancel' button under it while the job is queued, then
// 'Generating, N.Ns' once it runs, the seconds changing live (in the footage 0.7 -> 3.5 -> 5.2 s on the waiting tile). A finished
// tile is a hard swap to the picture, and the column ends with the line "You've reached the end!".
// Adapted to ten images: ten tiles in a 3 + 3 + 3 + 1 block, every tile 'Waiting' at the press and then 'Generating' in turn, landing
// strictly one after another in reading order. Omitted: the credit cost on the Generate button, the Free Plan card with its credit
// count and 'Upgrade Now', the Celebrity subscription chip, the site wordmark and the account row. The footage's pictures are never
// reproduced: every tile is our own meme, and no logo or platform font is drawn (plain boxes, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dla';
const ROOT_H = 408, NAV_W = 74, FORM_W = 190, COLS = 3, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #03070f; color: #d3dbea; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #121a2b; }
.${P}-nav { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${NAV_W}px; padding: 12px 7px 9px; background: #060b16; box-shadow: 1px 0 0 #121a2b; }
.${P}-new { display: grid; place-items: center; height: 17px; margin-bottom: 5px; border-radius: 4px; background: #2762a4; font-size: 7px; font-weight: 700; color: #ffffff; }
.${P}-it { display: flex; align-items: center; gap: 4px; height: 13px; font-size: 6.2px; font-weight: 600; color: #a9b6cf; white-space: nowrap; }
.${P}-it i { flex: none; display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #7f8fae; }
.${P}-form { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${FORM_W}px; padding: 12px 9px 9px; box-shadow: 1px 0 0 #121a2b; }
.${P}-lb { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 5px; row-gap: 1px; font-size: 7px; font-weight: 700; color: #e4eaf6; }
.${P}-lb small { white-space: nowrap; font-size: 5.5px; font-weight: 400; color: #4f93e0; }
.${P}-sl { position: relative; height: 2px; margin: 8px 0 11px; border-radius: 1px; background: #1a2338; }
.${P}-sl i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 1px; background: #2762a4; }
.${P}-sl b { position: absolute; top: -3px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #dfe7f5; }
.${P}-ini { display: flex; align-items: center; gap: 4px; }
.${P}-ini small { font-size: 5.5px; font-weight: 400; color: #7f8fae; }
.${P}-ini span { margin-left: auto; box-sizing: border-box; height: 11px; padding: 0 4px; border-radius: 3px; background: #101a2e; font-size: 5.5px; line-height: 11px; color: #7fb0ee; }
.${P}-drop { display: grid; place-items: center; box-sizing: border-box; height: 76px; margin-top: 5px; border-radius: 5px; background: #08101f; box-shadow: inset 0 0 0 1px #16213a; }
.${P}-drop i { display: block; width: 20px; height: 15px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #3a4a6d; }
.${P}-adp { margin-top: 10px; }
.${P}-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.${P}-chips span { box-sizing: border-box; height: 12px; padding: 0 4px; border-radius: 3px; background: #0f1a30; font-size: 5.8px; line-height: 12px; color: #9fb0cf; white-space: nowrap; }
.${P}-chips .${P}-on { background: #2762a4; color: #ffffff; }
.${P}-mode { margin-top: 2px; }
.${P}-go { display: flex; align-items: center; margin-top: auto; height: 22px; padding: 0 9px; border-radius: 4px; background: #2762a4; font-size: 7.5px; font-weight: 700; color: #ffffff; white-space: nowrap; }
.${P}-go small { margin-left: auto; box-sizing: border-box; padding: 0 3px; height: 10px; border-radius: 2px; background: rgba(255, 255, 255, .16); font-size: 5px; font-weight: 600; line-height: 10px; }
.${P}-res { position: relative; flex: 1; min-width: 0; box-sizing: border-box; padding: 11px 9px 8px; }
.${P}-tabs { display: flex; align-items: center; gap: 4px; height: 17px; }
.${P}-tabs span { box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 8px; background: #0f1a30; font-size: 6.5px; font-weight: 600; line-height: 15px; color: #9fb0cf; }
.${P}-tabs .${P}-on { background: #1d3e6e; color: #ffffff; }
.${P}-tabs em { margin-left: auto; font-style: normal; box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 8px; background: #12203c; font-size: 6.5px; font-weight: 600; line-height: 15px; color: #cfe0fa; }
.${P}-nothing { position: absolute; left: 0; right: 0; top: 40%; text-align: center; font-size: 7.5px; color: #6b7a97; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 4px; overflow: hidden; background: #0e1830; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #0e1830; }
.${P}-c b { font-size: 6.4px; font-weight: 500; color: #6f86b5; white-space: nowrap; }
.${P}-c u { display: block; box-sizing: border-box; height: 10px; padding: 0 6px; line-height: 10px; border-radius: 2px; background: #1a2744; font-size: 5.2px; text-decoration: none; color: #7f94bd; }
.${P}-end { margin-top: 10px; text-align: center; font-size: 6.8px; color: #8fa0c0; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // 'There's nothing here yet!' gives way to ten dark tiles, all 'Waiting'
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps its caption for the picture (reading order), the last at 1.68
const GEN = Array.from({ length: 10 }, (_, i) => ISSUE + 0.06 + i * 0.115);   // tile i starts 'Generating' (strictly before it lands)
const RATE = 4.2;                                 // displayed seconds per layout second: the readout runs over the real ~7 s wait

export default {
  id: 'dreamlike-art',
  label: 'Dreamlike.art (2025)',
  source: {
    platform: 'dreamlike.art web app, the /create page (desktop browser, dark blue-accented theme; a YouTube tutorial screen recording, 2025-05-09)',
    feature: "dark /create page: a nav column, a composer (Number of Images, Initial Image, Adapter, Strength, Mode, a blue Generate button) and a results column whose tiles are plain dark navy boxes captioned only 'Waiting, N.Ns' (with a small Cancel button) then 'Generating, N.Ns' with a live seconds readout (no spinner, bar or percentage), swapping for the finished pictures (adapted to 10: a 3 + 3 + 3 + 1 tile block landing in reading order; credits, the plan card with 'Upgrade Now' and the Celebrity chip omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=Z2pJ-qNNWi8', retrieved: '2026-10-14' }],
    extrapolated: [
      "the seconds readout counts UP from 0.0 on every tile (waiting tiles from the press, generating tiles from the moment they start); the footage's readouts rose 0.7 -> 3.5 -> 5.2 s but its true count direction and zero point are unresolved",
      'ten tiles (the footage generates two) in a 3 + 3 + 3 + 1 block, all Waiting at the press, Generating in turn and landing one at a time in strict reading order (the footage has one tile Waiting while the other already reads Generating)',
      "the displayed seconds run at ~4x the beat's own clock so the readout reaches a plausible figure inside the compressed window",
      "the Initial Image box drawn empty (the footage's uploaded picture is not reproduced), Number of Images 10 and a 'Generate 10 images' label",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dreamlike-art');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"><b></b><u>Cancel</u></div></div>`;
    const chip = (s, on) => `<span${on ? ` class="${P}-on"` : ''}>${s}</span>`;
    const nav = ['Profile', 'FAQ', 'Settings', 'Discord', 'Twitter', 'Legal', 'Affiliate Program'].map((s) => `<div class="${P}-it"><i></i>${s}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><div class="${P}-new">Create</div>${nav}</div><div class="${P}-form"><div class="${P}-lb">Number of Images (10)<small>How many images to generate</small></div><div class="${P}-sl"><i style="width: 100%"></i><b style="left: 100%"></b></div><div class="${P}-ini"><div class="${P}-lb">Initial Image</div><small>640x448px</small><span>Clear</span><span>Upload</span></div><div class="${P}-drop"><i></i></div><div class="${P}-adp"><div class="${P}-lb">Adapter</div><div class="${P}-chips">${chip('None (img2img)', true)}${chip('Pose')}${chip('Canny')}${chip('Sketch')}${chip('Depth')}</div></div><div class="${P}-adp"><div class="${P}-lb">Strength (0.75)<small>How much to prioritize init image over creativity</small></div><div class="${P}-sl"><i style="width: 75%"></i><b style="left: 75%"></b></div></div><div class="${P}-mode"><div class="${P}-lb">Mode<small>Advanced mode shows rarely used parameters</small></div><div class="${P}-chips">${chip('Simplified', true)}${chip('Advanced')}</div></div><div class="${P}-go" style="margin-top: auto">Generate 10 images<small>Ctrl + G</small></div></div><div class="${P}-res"><div class="${P}-tabs">${chip('All', true)}${chip('Enhanced')}${chip('Favorited')}<em>New First</em></div><div class="${P}-nothing">There's nothing here yet!</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-end" style="visibility: hidden">You've reached the end!</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), nothing = root.querySelector(`.${P}-nothing`), grid = root.querySelector(`.${P}-g`), end = root.querySelector(`.${P}-end`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), cap: n.querySelector(`.${P}-c b`), cancel: n.querySelector(`.${P}-c u`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

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

        // the empty line gives way to the ten tiles; the end-of-list line sits under them
        const on = s >= ISSUE;
        put('iss', on, (v) => { nothing.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; end.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.cv.style.display = v ? 'none' : ''; });
          // the caption is a function of t alone: 'Waiting, N.Ns' (with Cancel) until this tile starts, then 'Generating, N.Ns'
          let cap = '', wait = true;
          if (on && !landed) {
            wait = s < GEN[i];
            cap = wait ? `Waiting, ${((s - ISSUE) * RATE).toFixed(1)}s` : `Generating, ${((s - GEN[i]) * RATE).toFixed(1)}s`;
          }
          put(`k${i}`, cap, (v) => { c.cap.textContent = v; });
          put(`w${i}`, wait, (v) => { c.cancel.style.display = v ? '' : 'none'; });
        });
      },
    };
  },
};
