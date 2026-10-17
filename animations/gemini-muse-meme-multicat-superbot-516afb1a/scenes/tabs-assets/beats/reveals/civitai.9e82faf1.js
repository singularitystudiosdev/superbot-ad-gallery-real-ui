// Civitai's on-site image generator as it looked in early 2025: the /generate page (YouTube Gez8OaJJSQs, 2025-02-25, press -> 'Pending'
// at t=104-107.8 s; spec .tmp/clone-9e82faf1/reveal-refs/civitai/spec.json, confidence 0.70; frames ae_c01_queue_empty_t100,
// ae_c02_jobcard_t104, ae_c03_pending_t106, ae_c04_landing_t108, ae_c05_pending_crop). A near-black page: a slim top bar (Models
// dropdown, a search field, a blue Create button), a green rule under it, a left generator rail (Aspect Ratio tiles, Advanced: CFG
// Scale / Sampler / Steps / Seed, a job-count line, Quantity and the Generate button) and a centre column under a 'Queue | Feed' tab
// pair. Before the press the queue shows an empty state (a tray glyph over 'The queue is empty'). Pressing Generate puts a job card
// at the top of the queue: a yellow 'N/4' pill with the start time, the prompt, the chips 'TEXT-TO-IMAGE' and the model chip, and
// the card's output area made of large dark tiles, each with a small grey rounded-square glyph and the single word 'Pending' under
// it. There is no bar, percentage, spinner or shimmer: the tiles hold exactly like that until a picture arrives, and the pill is the
// only counter, counting up as outputs land. The left rail's job line changes to '1 job in queue'.
// Adapted to ten images: Quantity 10, the pill reads 0/10 and counts up as the ten tiles land one at a time in reading order
// (4 + 4 + 2 landscape tiles), each a hard swap of the 'Pending' tile for its picture. Omitted: everything that is Buzz (the balance,
// the 'Claim 25 Buzz' link, the cost chip on the Generate button and on the job card), the site wordmark and the account chrome, and the
// creator's browser frame. The footage's pictures are never reproduced: every tile is our own meme, and no logo or platform font is
// drawn (plain boxes and system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cvt';
const ROOT_H = 430, RAIL_W = 142, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #141517; color: #c9cbd1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #25272b; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 9px; background: #141517; box-shadow: 0 1.5px 0 #2f9e44; }
.${P}-brand { flex: none; display: flex; gap: 3px; width: ${RAIL_W - 14}px; }
.${P}-brand i { display: block; width: 9px; height: 9px; border-radius: 2px; background: #2b2d31; }
.${P}-dd { flex: none; display: flex; align-items: center; gap: 12px; box-sizing: border-box; height: 17px; padding: 0 7px; border-radius: 4px 0 0 4px; background: #25262a; font-size: 7px; color: #c9cbd1; }
.${P}-srch { flex: 1; box-sizing: border-box; display: flex; align-items: center; height: 17px; margin-left: -8px; padding: 0 7px; border-radius: 0 4px 4px 0; background: #1d1e21; font-size: 7px; color: #6b6e74; }
.${P}-mk { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 17px; padding: 0 9px; border-radius: 4px; background: #17324f; font-size: 7px; font-weight: 600; color: #8cc0f5; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 8px 7px 7px; background: #1a1b1e; box-shadow: 1px 0 0 #25272b; }
.${P}-lab { font-size: 6.5px; font-weight: 600; color: #a6a9b0; }
.${P}-ar { display: flex; gap: 3px; }
.${P}-ar div { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1.5px; box-sizing: border-box; padding: 4px 0 3px; border-radius: 4px; background: #202226; font-size: 5.5px; font-weight: 600; color: #a6a9b0; }
.${P}-ar div i { display: block; width: 11px; height: 8px; border-radius: 1.5px; background: #131416; box-shadow: inset 0 0 0 1px #34363b; }
.${P}-ar div small { font-size: 4.5px; font-weight: 400; color: #6b6e74; }
.${P}-ar div.${P}-sel { background: #2a2c31; color: #f1f2f4; }
.${P}-adv { display: flex; align-items: center; justify-content: space-between; height: 13px; margin-top: 2px; padding: 0 5px; border-radius: 3px; background: #202226; font-size: 6.5px; font-weight: 600; color: #e1e3e7; }
.${P}-row { display: flex; align-items: center; gap: 3px; height: 14px; font-size: 6px; color: #a6a9b0; }
.${P}-row b { flex: 1; font-weight: 600; white-space: nowrap; }
.${P}-row span { flex: none; box-sizing: border-box; display: grid; place-items: center; height: 11px; padding: 0 2px; border-radius: 2px; background: #25272b; font-size: 5.2px; white-space: nowrap; color: #8e9198; }
.${P}-row .${P}-on { background: #14304f; box-shadow: inset 0 0 0 1px #2d6cb0; color: #9ccaf7; }
.${P}-fld { box-sizing: border-box; display: flex; align-items: center; height: 14px; padding: 0 5px; border-radius: 3px; background: #121315; box-shadow: inset 0 0 0 1px #2b2d31; font-size: 6px; color: #8e9198; }
.${P}-vae { justify-content: center; background: #14304f; box-shadow: none; color: #9ccaf7; }
.${P}-sl { position: relative; flex: 1; height: 2px; border-radius: 1px; background: #2f3237; }
.${P}-sl i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 1px; background: #2d7fd0; }
.${P}-sl b { position: absolute; top: -2.5px; width: 7px; height: 7px; margin-left: -3px; border-radius: 50%; background: #3b8de0; }
.${P}-jobs { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 5px 0 4px; border-radius: 4px; background: #202226; font-size: 6.5px; font-weight: 600; color: #c9cbd1; }
.${P}-jobs span { display: flex; gap: 3px; }
.${P}-jobs span i { display: block; width: 12px; height: 1.5px; border-radius: 1px; background: #3a3d43; }
.${P}-buy { display: flex; align-items: center; gap: 5px; }
.${P}-qty { flex: none; display: flex; flex-direction: column; gap: 1px; width: 24px; font-size: 5px; color: #8e9198; }
.${P}-qty b { display: grid; place-items: center; height: 11px; border-radius: 2px; background: #121315; box-shadow: inset 0 0 0 1px #2b2d31; font-size: 7px; font-weight: 600; color: #e1e3e7; }
.${P}-go { flex: 1; display: grid; place-items: center; height: 22px; margin-top: 6px; border-radius: 4px; background: #2d8ee8; font-size: 8px; font-weight: 700; color: #ffffff; }
.${P}-rs { flex: none; display: grid; place-items: center; height: 22px; margin-top: 6px; padding: 0 5px; border-radius: 4px; background: #25272b; font-size: 6.5px; font-weight: 600; color: #c9cbd1; }
.${P}-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 7px 9px 8px; background: #17191b; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 4px; height: 17px; }
.${P}-tabs span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 15px; padding: 0 7px; border-radius: 8px; font-size: 7px; font-weight: 600; color: #8e9198; }
.${P}-tabs span i { display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px #8e9198; }
.${P}-tabs .${P}-tab-on { background: #25262a; color: #e8e9ec; }
.${P}-tabs em { margin-left: auto; font-style: normal; font-size: 6.5px; color: #8e9198; }
.${P}-note { flex: none; height: 14px; margin-top: 6px; font-size: 5.8px; line-height: 14px; color: #8e9198; white-space: nowrap; }
.${P}-empty { position: absolute; left: 0; right: 0; top: 46%; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 7px; color: #a6a9b0; }
.${P}-empty i { display: block; width: 24px; height: 18px; margin-bottom: 4px; border-radius: 4px; box-shadow: inset 0 0 0 1.3px #c9cbd1; }
.${P}-empty small { font-size: 6px; color: #6b6e74; }
.${P}-empty small u { text-decoration: none; color: #3b8de0; }
.${P}-card { flex: none; box-sizing: border-box; margin-top: 3px; padding: 7px 8px 0; border-radius: 4px; background: #1b1c20; box-shadow: inset 0 0 0 1px #25272b; }
.${P}-hd { display: flex; align-items: center; gap: 5px; height: 14px; font-size: 6.5px; color: #a6a9b0; }
.${P}-pill { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 6px; background: #3b3322; font-size: 6.5px; font-weight: 700; color: #e6cf8e; }
.${P}-pill i { display: block; width: 6px; height: 6px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #e6cf8e; }
.${P}-hd s { margin-left: auto; display: flex; gap: 6px; text-decoration: none; }
.${P}-hd s i { display: block; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1px #6b6e74; }
.${P}-pr { margin-top: 5px; font-size: 6.2px; line-height: 9px; color: #d5d7dc; height: 18px; overflow: hidden; }
.${P}-more { margin-top: 1px; font-size: 6.2px; line-height: 9px; color: #3b8de0; }
.${P}-chips { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; margin-top: 3px; }
.${P}-chips span { display: block; box-sizing: border-box; height: 10px; padding: 0 4px; border-radius: 3px; font-size: 5.2px; font-weight: 700; line-height: 10px; letter-spacing: .02em; white-space: nowrap; }
.${P}-c1 { background: #2d2347; color: #b9a1f5; }
.${P}-c2 { background: #15283a; color: #8ec5f3; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 7px; }
.${P}-t { position: relative; aspect-ratio: 1216 / 832; border-radius: 3px; overflow: hidden; background: #1b1c20; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; background: #1b1c20; box-shadow: inset 0 0 0 1px #27292e; }
.${P}-pend i { display: block; width: 11px; height: 9px; border-radius: 2.5px; box-shadow: inset 0 0 0 1.2px #4a4d54; }
.${P}-pend span { font-size: 6px; color: #7a7d84; }
.${P}-more2 { display: flex; align-items: center; height: 19px; margin: 8px -8px 0; padding: 0 8px; border-top: 1px solid #25272b; font-size: 7px; font-weight: 700; color: #c9cbd1; }
`;

const PROMPT = 'a lecture hall full of students, a muse holds up a handwritten note, meme style, bright colours, wide shot, sharp focus, the room is warm and slightly blurred behind her.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the empty queue gives way to the job card with ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i swaps 'Pending' for its picture (reading order), the last at 1.68

export default {
  id: 'civitai',
  label: 'Civitai generator (2025)',
  source: {
    platform: 'Civitai on-site generator, the /generate page (desktop browser, dark theme; a YouTube tutorial screen recording, 2025-02-25)',
    feature: "dark /generate page: a left generator rail (aspect ratio, advanced settings, Quantity, a Generate button) and a centre 'Queue | Feed' column; Generate swaps the empty-queue state for a job card with a yellow 'N/4' pill, the start time, the prompt and chips, and large dark tiles each holding a grey glyph and the single word 'Pending' (no bar, percentage or spinner), the pill counting up as outputs land (adapted to 10: a 4 + 4 + 2 tile block landing in reading order; all Buzz and cost chrome omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=Gez8OaJJSQs', retrieved: '2026-10-14' }],
    extrapolated: [
      'ten tiles in the job card (the footage shows one tile for a four-image job that was never seen landing), in a 4 + 4 + 2 block landing one at a time in strict reading order, the pill reading N/10',
      "Quantity 10 and the left rail's '10 jobs available' line (the footage reads 4); the line turns to '1 job in queue' at the press, as in the footage",
      "the landed pictures are hard swaps of the 'Pending' tile (the footage's only landed view is a full-screen lightbox)",
      "the card's start time held at 6:36pm (the footage's value) and the prompt text shortened to our own scene",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'civitai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i></i><span>Pending</span></div></div>`;
    const rowOf = (name, opts, on) => `<div class="${P}-row"><b>${name}</b>${opts.map((o, k) => `<span${k === on ? ` class="${P}-on"` : ''}>${o}</span>`).join('')}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-brand"><i></i><i></i><i></i></div><div class="${P}-dd">Models<span>&#8964;</span></div><div class="${P}-srch">Search</div><div class="${P}-mk">Create</div></div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-lab">Aspect Ratio</div><div class="${P}-ar"><div><i></i>Square<small>1024x1024</small></div><div class="${P}-sel"><i></i>Landscape<small>1216x832</small></div><div><i></i>Portrait<small>832x1216</small></div></div><div class="${P}-adv">Advanced<span>&#8963;</span></div>${rowOf('CFG Scale', ['Creative', 'Balanced', 'Precise'], 0)}<div class="${P}-row"><span>4.0</span><div class="${P}-sl"><i style="width: 32%"></i><b style="left: 32%"></b></div></div>${rowOf('Sampler', ['Fast', 'Popular'], 0)}<div class="${P}-fld">Euler a</div>${rowOf('Steps', ['Fast', 'Balanced', 'High'], -1)}<div class="${P}-row"><span>30</span><div class="${P}-sl"><i style="width: 48%"></i><b style="left: 48%"></b></div></div>${rowOf('Seed', ['Random', 'Custom'], 0)}<div class="${P}-fld ${P}-vae">+ Add VAE</div><div class="${P}-lab" style="margin-top: 2px">Request Priority</div><div class="${P}-fld">Standard</div><div class="${P}-jobs"><b class="${P}-jl">10 jobs available</b><span><i></i><i></i><i></i></span></div><div class="${P}-buy"><div class="${P}-qty">Quantity<b>10</b></div><div class="${P}-go">Generate</div><div class="${P}-rs">Reset</div></div></div><div class="${P}-main"><div class="${P}-tabs"><span class="${P}-tab-on"><i></i>Queue</span><span><i></i>Feed</span><em>Newest</em></div><div class="${P}-note">Creations are kept in the Generator for 30 days. Download or Post them to your Profile to save them!</div><div class="${P}-empty"><i></i>The queue is empty<small>Try <u>generating</u> new images with our resources</small></div><div class="${P}-card" style="visibility: hidden"><div class="${P}-hd"><div class="${P}-pill"><i></i><b class="${P}-pn">0/10</b></div>6:36pm<s><i></i><i></i><i></i></s></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-more">Show More</div><div class="${P}-chips"><span class="${P}-c1">TEXT-TO-IMAGE</span><span class="${P}-c2">PONY REALISM &middot; V2.2 MAIN...</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-more2">Additional Details</div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), jl = root.querySelector(`.${P}-jl`), empty = root.querySelector(`.${P}-empty`), card = root.querySelector(`.${P}-card`), pn = root.querySelector(`.${P}-pn`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
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

        // the empty queue gives way to the job card; the rail's job line follows
        const on = s >= ISSUE;
        put('iss', on, (v) => { empty.style.display = v ? 'none' : ''; card.style.visibility = v ? '' : 'hidden'; jl.textContent = v ? '1 job in queue' : '10 jobs available'; });

        let n = 0;
        cells.forEach((c, i) => {
          const landed = s >= LAND[i];
          if (landed) n++;
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, landed, (v) => { c.pend.style.display = v ? 'none' : ''; });
        });

        // the pill is the only counter: it counts up as outputs land
        put('pn', n, (v) => { pn.textContent = `${v}/10`; });
      },
    };
  },
};
