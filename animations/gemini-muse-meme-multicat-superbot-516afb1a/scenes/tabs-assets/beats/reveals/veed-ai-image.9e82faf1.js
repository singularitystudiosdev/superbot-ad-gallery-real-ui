// VEED's AI Image Generator (the 'Text to Image' panel of the VEED editor, 2023; the official VEED STUDIO channel on YouTube, 7hrZK1XpIPo,
// published 2023-04-11, t=8-33 s; spec .tmp/clone-9e82faf1/reveal-refs/veed-ai-image/spec.json, confidence 0.72; frames
// aj_veed_prompt_placeholder_28.4s.png, aj_veed_prompt_generate_14.6s.png, aj_veed_pending_15.9s.png, aj_veed_pending_16.4s.png,
// aj_veed_gen_sheet_13.2_19.2s.png). A white page with a blue accent: a rounded prompt box with the placeholder 'Describe what you want to
// see (eg: rainy day in Paris in style of oil painting)' and a blue 'Generate' pill, two small cards on the right ('Text to Image' with the
// strapline 'Type a few words to imagine with our AI', and 'Image Settings' holding 'Resolution' and 'Style'), and under the box a results
// strip captioned 'Get AI generated images from prompt'. Pressing 'Generate' turns the newest slot into a large light-grey (#DCDADB) card
// with a faint blurred hint of the coming picture and, dead centre, a thin circular ring: a light-grey track and a short blue arc that
// turns. Nothing else moves and there is no text or percentage in the card; small grey labels beside it read 'Image N'. When the picture
// is ready the card is swapped for it in place, a 'Copy link' action appears, and the still joins the strip.
// Adapted to ten images: the strip holds ten thumbnails (the source shows three or four) and the single large card is reused for each in
// turn: it holds the ring, hands over to the finished still in place, and the still then joins the strip while the card goes back to
// pending for the next one, the tenth still staying in the card. Landing is in strict reading order. The ring turns from render(t).
// Omitted: the VEED logo and wordmark, the dark editor behind the modal, the footage's account chrome, the confetti the footage
// throws on a landing, and the earlier outputs (a clownfish and an avatar) the source's strip already holds. The footage's pictures are
// never reproduced: every tile is our own meme, and no logo, wordmark or platform font is drawn (system type, a plain ring).
import { press, stream } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ved';
const ROOT_H = 284, PAD = 14, STAGE = 134, COLS = 10, GAP = 5;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ffffff; color: #0e1318; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e6ea; }
.${P}-in { position: absolute; left: ${PAD}px; top: ${PAD}px; width: 396px; height: 30px; box-sizing: border-box; border-radius: 15px; background: #ffffff; box-shadow: inset 0 0 0 1.5px #0b4fd6; }
.${P}-in span { position: absolute; left: 14px; top: 0; right: 70px; height: 30px; overflow: hidden; font-size: 8px; line-height: 30px; color: #0e1318; white-space: nowrap; }
.${P}-in .${P}-ph { color: #8b919a; }
.${P}-in b { position: absolute; right: 4px; top: 4px; display: grid; place-items: center; width: 56px; height: 22px; border-radius: 11px; background: #0b4fd6; font-size: 8px; font-weight: 600; color: #ffffff; }
.${P}-card { position: absolute; left: 426px; width: 120px; box-sizing: border-box; padding: 9px 10px; border-radius: 8px; background: #ffffff; box-shadow: 0 0 0 1px #e4e6ea, 0 1px 3px rgba(14, 19, 24, .05); }
.${P}-card h4 { margin: 0; font-size: 9px; line-height: 12px; font-weight: 700; color: #0e1318; }
.${P}-card p { margin: 3px 0 0; font-size: 6.6px; line-height: 9px; color: #5b616a; }
.${P}-lb { margin-top: 8px; height: 9px; font-size: 6.6px; line-height: 9px; color: #5b616a; }
.${P}-sel { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; margin-top: 3px; height: 19px; padding: 0 7px; border-radius: 5px; box-shadow: inset 0 0 0 1px #dfe2e7; font-size: 7px; color: #0e1318; }
.${P}-sel svg { width: 7px; height: 7px; fill: none; stroke: #7b818a; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-stage { position: absolute; left: ${PAD}px; top: 56px; width: ${STAGE}px; height: ${STAGE}px; border-radius: 12px; overflow: hidden; background: #dcdadb; visibility: hidden; }
.${P}-hint { position: absolute; left: -16px; top: -16px; right: -16px; bottom: -16px; background: radial-gradient(ellipse at 30% 25%, #cfdaec 0, rgba(207, 218, 236, 0) 55%), radial-gradient(ellipse at 72% 60%, #e6d9dc 0, rgba(230, 217, 220, 0) 50%), radial-gradient(ellipse at 40% 85%, #d2d6e2 0, rgba(210, 214, 226, 0) 55%); filter: blur(12px); opacity: .85; }
.${P}-stage img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ring { position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: conic-gradient(from 0deg, #0b6bff 0deg, #0b6bff 100deg, #c9c9cd 100deg, #c9c9cd 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px)); }
.${P}-side { position: absolute; left: ${PAD + STAGE + 14}px; top: 60px; visibility: hidden; }
.${P}-side b { display: block; font-size: 9px; line-height: 12px; font-weight: 700; color: #0e1318; }
.${P}-copy { display: flex; align-items: center; gap: 4px; box-sizing: border-box; margin-top: 8px; width: 62px; height: 19px; padding: 0 7px; border-radius: 5px; box-shadow: inset 0 0 0 1px #dfe2e7; font-size: 7px; font-weight: 500; color: #0e1318; white-space: nowrap; }
.${P}-copy svg { flex: none; width: 7px; height: 7px; fill: none; stroke: #0e1318; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cap { position: absolute; left: ${PAD}px; top: 205px; font-size: 8px; line-height: 11px; font-weight: 600; color: #0e1318; white-space: nowrap; }
.${P}-strip { position: absolute; left: ${PAD}px; right: ${PAD}px; top: 222px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

const PROMPT = 'a muse holding up a funny note, meme style';
const PLACEHOLDER = 'Describe what you want to see (eg: rainy day in Paris in style of oil painting)';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TYPE_AT = 0.04, CPS = 150;                  // the prompt is typed into the box (the placeholder shows until the first letter)
const GEN_AT = 0.36;                              // the cursor presses 'Generate'
const ISSUE = 0.46;                               // the newest slot becomes the pending card
const LAND = Array.from({ length: 10 }, (_, i) => 0.7 + i * 0.109);   // still i lands in the card (reading order), the last at 1.681
const JOIN = 0.06;                                // a landed still stays in the card this long, then joins the strip and the card goes back to pending

export default {
  id: 'veed-ai-image',
  label: 'VEED AI image generator (2023)',
  source: {
    platform: "VEED.IO web editor (app.veed.io), the 2023 'AI Image Generator' panel (desktop browser, white UI with a blue accent; the official VEED STUDIO channel on YouTube, 2023-04-11)",
    feature: "a prompt box (placeholder 'Describe what you want to see (eg: rainy day in Paris in style of oil painting)') with a blue 'Generate' pill, 'Text to Image' and 'Image Settings' (Resolution, Style) cards, and a strip captioned 'Get AI generated images from prompt'; Generate turns the newest slot into a large light-grey #DCDADB card with a faint blurred hint and a centred thin circular ring (grey track plus a short blue arc that turns), no text or percentage inside and small grey labels 'Image N' / 'Resolution' beside it; the finished still replaces the card in place, gains 'Copy link' and joins the strip",
    refs: [
      { url: 'https://www.youtube.com/watch?v=7hrZK1XpIPo', videoId: '7hrZK1XpIPo', published: '2023-04-11', retrieved: '2026-10-14', note: "'How to Convert Text to Image | FREE AI Image Generator' (VEED STUDIO, official): the panel and its strip t=8-13 s, the prompt and the 'Generate' press t=14.3-15.4 s, the pending card with the turning ring t=15.5-17.7 s, the still replacing it in place t=17.8-18.2 s, a second generation t=27-33 s with the empty prompt box's placeholder visible at t~28.4 s" },
      { url: 'https://www.youtube.com/watch?v=O3jHAu9mSKg', videoId: 'O3jHAu9mSKg', published: '2026-05-02', retrieved: '2026-10-14', note: "'VEED The ULTIMATE AI Video Generator - Full Tutorial' (AI Guy): a 2026 dashboard tour that never shows the image wait; checked and not used" },
    ],
    extrapolated: [
      "the source shows one generation at a time with three or four thumbnails in the strip; ten stills landing in strict reading order, the single card reused for each (landing, then joining the strip while the card returns to pending) and the compressed 1.84 s timing (the real pending card is on screen ~2.2-2.4 s) are extrapolated",
      "the layout is scaled to a 560 px block (the footage is a 1920 px screen with digital zooms into the panel); the dark editor behind the modal is not drawn",
      "the prompt is ours ('a cat playing with a soccer ball' in the footage) and is typed in from the placeholder state in ~0.3 s; the 'Style' value 'None' and the 'Resolution' value '1080' are not legible in the footage and are our fill",
      "the blue arc's sweep rate (the footage does not show it at a measurable zoom) and the faint blurred hint's colours (a pale blue-grey wash) are extrapolated; the hint is a plain gradient, not the coming picture",
      "the 'Copy link' action shows beside the card while a still sits in it (the footage shows it under the finished still); the strip's 'Copy link' is not repeated per thumbnail",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'veed-ai-image');
    const srcLg = ownSrc(ctx.src, 'veed-ai-image-lg');   // the card's own size of the picture gets its own cache entry
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const share = '<svg viewBox="0 0 12 12"><circle cx="3" cy="6" r="1.4"/><circle cx="9" cy="2.8" r="1.4"/><circle cx="9" cy="9.2" r="1.4"/><path d="M4.3 5.3l3.4-1.8M4.3 6.7l3.4 1.8"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-in"><span class="${P}-ph">${x.esc(PLACEHOLDER)}</span><span style="display: none"></span><b>Generate</b></div><div class="${P}-card" style="top: ${PAD}px"><h4>Text to Image</h4><p>Type a few words to imagine with our AI</p></div><div class="${P}-card" style="top: 88px; height: 102px"><h4>Image Settings</h4><div class="${P}-lb">Resolution</div><div class="${P}-sel">1080${chev}</div><div class="${P}-lb">Style</div><div class="${P}-sel">None${chev}</div></div><div class="${P}-stage"><div class="${P}-hint"></div><div class="${P}-ring"></div><img src="${srcLg}" width="870" height="1024" decoding="sync" alt="Latest image" style="visibility: hidden"/></div><div class="${P}-side"><b>Image 1</b><div class="${P}-copy" style="visibility: hidden">${share}<span>Copy link</span></div></div><div class="${P}-cap">Get AI generated images from prompt</div><div class="${P}-strip">${tiles.map(cell).join('')}</div></div>`);
    const go = root.querySelector(`.${P}-in b`);
    const [ph, typedEl] = root.querySelectorAll(`.${P}-in span`);
    const stage = root.querySelector(`.${P}-stage`), hint = root.querySelector(`.${P}-hint`), ring = root.querySelector(`.${P}-ring`), big = stage.querySelector('img');
    const side = root.querySelector(`.${P}-side`), lbl = side.querySelector('b'), copy = side.querySelector(`.${P}-copy`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate([big, ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the prompt box: the placeholder until the first letter, then the typed prompt
        const txt = stream(PROMPT, TYPE_AT, CPS, s);
        put('txt', txt, (v) => { ph.style.display = v ? 'none' : ''; typedEl.style.display = v ? '' : 'none'; typedEl.textContent = v; });

        // 'Generate' is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // the card: pending (hint + ring) until a still replaces it in place, back to pending once that still has joined the strip
        const issued = s >= ISSUE;
        let cur = -1;
        LAND.forEach((a, i) => { if (s >= a) cur = i; });
        const showStill = issued && cur >= 0 && (cur === 9 || s < LAND[cur] + JOIN);
        const label = showStill ? cur + 1 : cur + 2;
        put('stg', issued, (v) => { stage.style.visibility = v ? 'visible' : 'hidden'; side.style.visibility = v ? 'visible' : 'hidden'; });
        put('pend', !showStill, (v) => { hint.style.display = v ? '' : 'none'; ring.style.display = v ? '' : 'none'; big.style.visibility = v ? 'hidden' : ''; copy.style.visibility = v ? 'hidden' : 'visible'; });
        put('lbl', label, (v) => { lbl.textContent = `Image ${v}`; });
        const g = tiles[Math.max(cur, 0)];
        put('big', Math.max(cur, 0), () => { big.style.transformOrigin = g.origin; });
        big.style.filter = restFilter(g);
        big.style.transform = restTransform(g);

        // the ring turns with t alone (a thin blue arc on a light-grey track)
        const deg = (((t * 300) % 360) + 360) % 360;
        put('ring', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // each still joins the strip, in reading order, once it has sat in the card
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i] + JOIN, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
