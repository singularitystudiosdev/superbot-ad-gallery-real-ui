// AdCreative.ai (by Appier), Product Photo Ads, as it appears in the official walkthrough 'Renewed Product Photo Ads AI: Transform Product
// Photos into Powerful Photoshoots & Ads' (YouTube lF7WXk8UwOg, published 2024-07-10, t~283-335 s; the older UI vintage of the same pending
// card is PDwxcgzFvpg, 2024-01-29, t~232 s; spec .tmp/clone-9e82faf1/reveal-refs/adcreative-ai/spec.json, confidence 0.72; frames
// ak2_lf_t283.0, ak2_lf_t286.0, ak2_lf_t288.0, ak2_lf_t318.0, ak2_lf_t321.0, ak2_lf_t333.0). A light, pink-tinted web app: a left rail with
// a pink 'Generate' pill (the active entry) over Brands, Projects, Creative Insights, Competitor Insights, Inspiration Gallery, Creative
// Scoring AI and Settings, and a content column. The composer ('AI Background Styles', its three option rows, the selected styles and a pink
// 'Generate' pill) sits over the panel heading 'AI-Generated Product Shoots / Your conversion-focused product shoots.'. Pressing the pill swaps
// the composer for a pink-tinted card headed 'Your ad creative is being generated.' over four grey step rows, each with a ring at its right
// end, and the footer 'The process may take up to a minute, depending on the current load on our servers.'. In the footage row 1 goes from
// an open circle to a ticked ring within about two seconds; there is no bar, no percentage, no timer. The card is then replaced in place by
// the result grid under the sub-line '1st generation  Beach, Green and custom styles were used for this generation.': portrait cards that
// each carry a 'Commercially safe' pill top-left and a 'Convert to ads' footer with two ghost icon buttons are laid out empty first (a flat
// pale body, no shimmer), and the photographs then land into them one at a time, whole, with no fade.
// Adapted to ten images: ten cards in a 5 + 5 block landing strictly in reading order, the pending rows turning from render(t) (the ring's
// open arc turns with t). Omitted: the sidebar credit card (credits, plan name, renewal line, the free-credits button), the logo and the
// avatar cube, the presenter's webcam bubble, the browser dots, the 'Step n/n' strips above the panel heading and the NEW/BETA badges.
// The footage's own photographs are never reproduced: every card is our own meme. No logo, wordmark or platform font is drawn (plain
// shapes, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-adc';
const ROOT_H = 384, SIDE_W = 88, COLS = 5, GAP = 6, GRID_TOP = 62;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fbf8fd; color: #2d2d33; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e9e2f1; }
.${P}-side { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${SIDE_W}px; padding: 16px 10px 10px; background: linear-gradient(180deg, #fcfaff, #f1eaf8); }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 5px; height: 16px; font-size: 6px; font-weight: 500; color: #1d1850; white-space: nowrap; }
.${P}-nav i { flex: none; display: block; width: 7px; height: 7px; border-radius: 2px; background: #1d1850; }
.${P}-nav.${P}-on { gap: 0; justify-content: space-between; box-sizing: border-box; height: 19px; margin-bottom: 7px; padding: 0 5px 0 7px; border-radius: 10px; background: linear-gradient(90deg, #f0306e, #f65a98); box-shadow: 0 2px 5px rgba(240, 48, 110, .28); font-weight: 600; color: #fff; }
.${P}-nav.${P}-on i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, .55); }
.${P}-main { position: relative; flex: 1; min-width: 0; background: linear-gradient(135deg, #fefcff, #f6f0fb); }
.${P}-view { position: absolute; left: 0; top: 0; right: 0; bottom: 0; }
.${P}-cmp { position: absolute; left: 10px; right: 10px; top: 10px; box-sizing: border-box; height: 178px; padding: 9px 11px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #f0eaf5, 0 3px 10px rgba(80, 40, 120, .06); }
.${P}-ch { display: flex; align-items: center; gap: 5px; height: 17px; }
.${P}-ch u { flex: none; display: block; width: 8px; height: 8px; border-radius: 3px; background: #f0306e; }
.${P}-ch b { display: block; font-size: 7px; font-weight: 600; line-height: 8px; color: #1d1850; }
.${P}-ch small { display: block; font-size: 4.8px; line-height: 6px; color: #8a8a93; }
.${P}-cols { display: flex; gap: 12px; margin-top: 7px; }
.${P}-opts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.${P}-opt { display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 27px; padding: 0 5px; border-radius: 7px; background: #faf7fd; }
.${P}-opt i { flex: none; display: block; width: 13px; height: 13px; border-radius: 50%; background: #ece6f6; box-shadow: inset 0 0 0 3.5px #ece6f6, inset 0 0 0 9px #1d1850; }
.${P}-opt div { flex: 1; min-width: 0; }
.${P}-opt b { display: block; font-size: 6.5px; font-weight: 600; line-height: 8px; color: #1d1850; white-space: nowrap; }
.${P}-opt small { display: block; font-size: 4.6px; line-height: 6px; color: #8a8a93; white-space: nowrap; }
.${P}-opt em { flex: none; font-style: normal; display: grid; place-items: center; height: 11px; padding: 0 6px; border-radius: 3px; background: #1d1850; font-size: 5px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-sel { flex: none; width: 138px; }
.${P}-sh { display: flex; align-items: center; justify-content: space-between; height: 10px; font-size: 6.5px; font-weight: 600; color: #1d1850; }
.${P}-sh small { font-size: 4.8px; font-weight: 500; color: #4a4a55; }
.${P}-sel > small { display: block; margin-top: 1px; font-size: 4.6px; line-height: 6px; color: #8a8a93; }
.${P}-sw { display: flex; gap: 4px; margin-top: 6px; }
.${P}-sw div { flex: 1; min-width: 0; }
.${P}-sw i { display: block; height: 38px; border-radius: 4px; }
.${P}-sw span { display: block; margin-top: 2px; font-size: 4px; line-height: 5px; color: #55555e; white-space: nowrap; overflow: hidden; }
.${P}-go { position: absolute; right: 14px; bottom: 11px; display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 58px; height: 17px; border-radius: 4px; background: linear-gradient(90deg, #f0306e, #f5469a); font-size: 6.5px; font-weight: 600; color: #fff; }
.${P}-go svg { width: 5px; height: 5px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd { position: absolute; left: 10px; right: 10px; display: flex; align-items: center; gap: 7px; height: 28px; }
.${P}-hd i { flex: none; display: grid; place-items: center; width: 19px; height: 19px; border-radius: 50%; background: #fbe3ee; }
.${P}-hd i::after { content: ""; display: block; width: 8px; height: 8px; border-radius: 2px; background: #e0245f; }
.${P}-hd b { display: block; font-size: 11px; font-weight: 600; line-height: 13px; color: #e0245f; white-space: nowrap; }
.${P}-hd small { display: block; font-size: 5.6px; line-height: 7px; color: #55555e; white-space: nowrap; }
.${P}-hd em { margin-left: auto; font-style: normal; font-size: 4.6px; color: #9a9aa3; white-space: nowrap; }
.${P}-pend { position: absolute; left: 50%; top: 66px; box-sizing: border-box; width: 272px; margin-left: -136px; padding: 13px 15px 10px; border-radius: 11px; background: linear-gradient(180deg, #fbeaf4, #f8eef8); box-shadow: 0 0 0 1px #f5dcea; }
.${P}-pt { text-align: center; font-size: 9px; font-weight: 600; line-height: 12px; color: #e0245f; }
.${P}-rows { display: flex; flex-direction: column; gap: 5px; margin-top: 11px; }
.${P}-row { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 21px; padding: 0 7px; border-radius: 7px; background: #f3f1f5; }
.${P}-row span { flex: 1; min-width: 0; font-size: 6.2px; white-space: nowrap; }
.${P}-ring { position: relative; flex: none; box-sizing: border-box; width: 10px; height: 10px; border-radius: 50%; border: 1.2px solid #e1dfe6; }
.${P}-arc { position: absolute; left: -1.2px; top: -1.2px; right: -1.2px; bottom: -1.2px; box-sizing: border-box; border-radius: 50%; border: 1.2px solid transparent; border-top-color: #1a1a1f; }
.${P}-ring svg { position: absolute; left: 1.2px; top: 1.4px; width: 5px; height: 5px; fill: none; stroke: #e0245f; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ft { margin-top: 12px; text-align: center; font-size: 4.8px; line-height: 6px; color: #8a8a93; }
.${P}-ft b { font-weight: 600; color: #55555e; }
.${P}-gen { position: absolute; left: 14px; top: 46px; display: flex; align-items: baseline; gap: 6px; font-size: 6px; color: #55555e; white-space: nowrap; }
.${P}-gen b { font-size: 6.4px; font-weight: 600; color: #1d1850; }
.${P}-g { position: absolute; left: 10px; right: 10px; top: ${GRID_TOP}px; bottom: 10px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-card { box-sizing: border-box; min-height: 0; display: flex; flex-direction: column; padding: 4px; border-radius: 7px; background: #fff; box-shadow: 0 0 0 1px #f0eaf5, 0 2px 6px rgba(80, 40, 120, .05); }
.${P}-safe { flex: none; display: flex; align-items: center; gap: 2px; align-self: flex-start; box-sizing: border-box; height: 9px; margin-bottom: 3px; padding: 0 3px; border-radius: 5px; background: #f1eef8; font-size: 4.3px; font-weight: 600; color: #1d1850; white-space: nowrap; }
.${P}-safe svg { width: 4px; height: 4px; fill: #1d1850; }
.${P}-ph { position: relative; flex: 1; min-height: 0; border-radius: 4px; overflow: hidden; background: #ecebf5; }
.${P}-ph img { position: absolute; left: 0; top: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cover { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: #ecebf5; }
.${P}-cf { flex: none; display: flex; align-items: center; gap: 4px; height: 11px; margin-top: 3px; font-size: 4.6px; font-weight: 600; color: #1d1850; white-space: nowrap; }
.${P}-cf svg { width: 5px; height: 5px; fill: none; stroke: #55555e; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cf s { flex: 1; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.1;                               // the cursor presses Generate
const ISSUE = 0.22;                               // the composer gives way to the pending card
const TICK = [0.36, 0.56, 0.74, 0.9];             // row r's ring becomes a tick; the next row is active from then (extrapolated: only row 1 was filmed)
const SKEL = 1.0;                                 // the pending card gives way to the result panel, its ten cards still empty
const LAND = Array.from({ length: 10 }, (_, i) => 1.12 + i * 0.08);   // card i's photograph lands (reading order), the last at 1.84
const STEPS = ['Our AI is analyzing your product image.', "Based on the selected presets, we're creating backgrounds.", 'Applying shadows and border lighting is in progress.', 'Finalizing your AI-generated product photo ad now.'];
const NAV = ['Brands', 'Projects', 'Creative Insights', 'Competitor Insights', 'Inspiration Gallery', 'Creative Scoring AI', 'Settings'];
const SHIELD = '<svg viewBox="0 0 10 10"><path d="M5 .8l3.7 1.4v2.8c0 2.1-1.6 3.6-3.7 4.2C2.9 8.6 1.3 7.100 1.300 5V2.200z"/></svg>';
const FOLDER = '<svg viewBox="0 0 10 10"><path d="M1 2.8h3l1 1.2h4v4.400H1z"/></svg>';
const DOWNLOAD = '<svg viewBox="0 0 10 10"><path d="M5 1.500v5M2.800 4.800L5 7l2.200-2.200M1.800 8.600h6.400"/></svg>';
const THUMB = '<svg viewBox="0 0 10 10"><path d="M2 4.600h2l1.600-3c.9 0 1.300.6 1.100 1.500L6.500 4h1.800c.6 0 1 .5.9 1.100L8.600 8c-.1.4-.5.700-.9.700H2z"/></svg>';
const HEAD = (title) => `<i></i><div><b>AI-Generated Product Shoots</b><small>Your conversion-focused product shoots.</small></div>${title}`;

export default {
  id: 'adcreative-ai',
  label: 'AdCreative.ai product shoots (2024)',
  source: {
    platform: 'AdCreative.ai by Appier, Product Photo Ads (desktop web app, light pink-tinted theme; official walkthrough screen recordings on the AdCreative AI by Appier YouTube channel, 2024)',
    feature: "left rail with the pink 'Generate' pill active; the 'AI Background Styles' composer with a pink Generate pill; pressing it swaps in a pink-tinted card headed 'Your ad creative is being generated.' over four step rows with rings at their right end (row 1 goes from an open ring to a tick) and the footer 'The process may take up to a minute, depending on the current load on our servers.' (no bar, no percentage); the panel then becomes 'AI-Generated Product Shoots' with '1st generation' and a grid of portrait cards, each carrying a 'Commercially safe' pill and a 'Convert to ads' footer, empty first and then filled by the photographs one at a time (adapted to 10: a 5 + 5 block landing in reading order; the credit card, logo, webcam bubble, step strips and NEW/BETA badges are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=lF7WXk8UwOg', retrieved: '2026-10-14', videoId: 'lF7WXk8UwOg', published: '2024-07-10', note: 'composer t=283, pending card t=286-290.5, landing grid t=317-335' },
      { url: 'https://www.youtube.com/watch?v=PDwxcgzFvpg', retrieved: '2026-10-14', videoId: 'PDwxcgzFvpg', published: '2024-01-29', note: 'older-UI pending card t=232-240, same four step rows and footer' },
    ],
    extrapolated: [
      "rows 2-4 of the step list activating in order and ticking (the footage cut to the presenter after row 1 ticked, so only row 1's circle-to-tick was ever filmed; the tick times here are invented)",
      "the open arc that turns on the active row's ring (the footage shows a plain circle, then a tick)",
      'the press-to-pending and pending-to-grid timings (the recording cuts to the presenter for ~26 s in between, so the swap itself was never filmed)',
      "the second row of cards and the 5-column layout (the footage shows a 3-column grid that keeps growing; ten cards are laid out 5 + 5 to fit one fixed block)",
      "the composer's option rows and selected-style swatches are drawn schematically from t=283",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'adcreative-ai');
    const card = (g, i) => `<div class="${P}-card"><div class="${P}-safe">${SHIELD}Commercially safe</div><div class="${P}-ph"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cover"></div></div><div class="${P}-cf">Convert to ads${THUMB}<s></s>${FOLDER}${DOWNLOAD}</div></div>`;
    const opt = (n, s, b) => `<div class="${P}-opt"><i></i><div><b>${n}</b><small>${s}</small></div><em>${b}</em></div>`;
    const sw = (bg, n) => `<div><i style="background: ${bg}"></i><span>${n}</span></div>`;
    const row = (n) => `<div class="${P}-row"><span>${x.esc(n)}</span><i class="${P}-ring"><u class="${P}-arc"></u><svg viewBox="0 0 10 10"><path d="M2 5.400l2 2L8 3"/></svg></i></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-side"><div class="${P}-nav ${P}-on">Generate<i></i></div>${NAV.map((n) => `<div class="${P}-nav"><i></i>${n}</div>`).join('')}</div><div class="${P}-main"><div class="${P}-view ${P}-va"><div class="${P}-cmp"><div class="${P}-ch"><u></u><div><b>AI Background Styles</b><small>Choose up to 6 presets from our list or customize your own.</small></div></div><div class="${P}-cols"><div class="${P}-opts">${opt('Preset Styles', 'Tested styles for HQ outputs', 'See all presets')}${opt('Custom Style', 'Create your own custom style.', 'Create')}${opt('Style Match', 'Upload an image to match its style.', 'Upload')}</div><div class="${P}-sel"><div class="${P}-sh">Selected Styles<small>Remove All</small></div><small>Select up to 4 styles to generate with.</small><div class="${P}-sw">${sw('linear-gradient(180deg, #7fb6dc 0%, #bfe0ee 45%, #e5c9a8 46%, #d9a77e)', 'Beach Picnic Blanket')}${sw('linear-gradient(180deg, #b9d8ee 0%, #cfe6c3 40%, #5f9a3c 41%, #3f7a2c)', 'Grassy Field Sunlight')}${sw('linear-gradient(160deg, #efe6f6, #d8cbe9)', 'Custom Style')}${sw('linear-gradient(160deg, #f1eef8, #e6e1f1)', 'Style Match')}</div></div></div><div class="${P}-go">Generate<svg viewBox="0 0 10 10"><path d="M3 1.500L6.500 5 3 8.500"/></svg></div></div><div class="${P}-hd" style="top: 198px">${HEAD(`<em>You haven't created a project yet</em>`)}</div></div><div class="${P}-view ${P}-vb" style="display: none"><div class="${P}-hd" style="top: 10px">${HEAD('')}</div><div class="${P}-pend"><div class="${P}-pt">Your ad creative is being generated.</div><div class="${P}-rows">${STEPS.map(row).join('')}</div><div class="${P}-ft">The process may take <b>up to a minute</b>, depending on the current load on our servers.</div></div></div><div class="${P}-view ${P}-vc" style="visibility: hidden"><div class="${P}-hd" style="top: 10px">${HEAD('')}</div><div class="${P}-gen"><b>1st generation</b>Beach, Green and custom styles were used for this generation.</div><div class="${P}-g">${tiles.map(card).join('')}</div></div></div></div>`);
    const q = (c) => root.querySelector(`.${P}-${c}`);
    const go = q('go'), vA = q('va'), vB = q('vb'), vC = q('vc');
    const rows = [...root.querySelectorAll(`.${P}-row`)].map((n) => ({ label: n.querySelector('span'), ring: n.querySelector(`.${P}-ring`), arc: n.querySelector(`.${P}-arc`), tick: n.querySelector('svg') }));
    const cells = [...root.querySelectorAll(`.${P}-ph`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-cover`), g: tiles[i] }));
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
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });

        // composer -> pending card -> result panel
        const ph = s < ISSUE ? 0 : s < SKEL ? 1 : 2;
        put('ph', ph, (v) => { vA.style.display = v === 0 ? '' : 'none'; vB.style.display = v === 1 ? '' : 'none'; vC.style.visibility = v === 2 ? '' : 'hidden'; });

        // the step rows: a ring that is open while its step runs and a tick once it is done, the next row taking over
        rows.forEach((r, i) => {
          const done = s >= TICK[i], active = !done && s >= (i === 0 ? ISSUE : TICK[i - 1]);
          const state = done ? 2 : active ? 1 : 0;
          put(`s${i}`, state, (v) => {
            r.label.style.color = v === 0 ? '#9c9ca3' : '#2d2d33';
            r.ring.style.borderColor = v === 2 ? '#fbd0e1' : v === 1 ? '#cfcdd6' : '#e1dfe6';
            r.ring.style.background = v === 2 ? '#fde7f0' : 'transparent';
            r.tick.style.visibility = v === 2 ? '' : 'hidden';
            r.arc.style.visibility = v === 1 ? '' : 'hidden';
          });
          // the open arc turns with t (its phase differs per row); a function of t alone
          const deg = (((t * 540 + i * 70) % 360) + 360) % 360;
          put(`a${i}`, deg.toFixed(0), (d) => { r.arc.style.transform = `rotate(${d}deg)`; });
        });

        // the ten cards: empty first, then each photograph lands whole, in reading order
        cells.forEach((c, i) => {
          const on = s >= LAND[i];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cover.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
