// Predis.ai, 'Create New' -> Text to Post, as it appears in the official 'Predis.ai - Demo' walkthrough (YouTube jwNf75aj5vo, published
// 2024-10-24, t~326-357 s; spec .tmp/clone-9e82faf1/reveal-refs/predis-ai/spec.json, confidence 0.72; frames ak2_pre_t334.0, ak2_pre_t337.0,
// ak2_pre_t343.0, ak2_pre_t352.0). A white workspace with a blue accent: a left rail (a blue 'Create New' button over Dashboard, Content
// Library, Content Calendar, Brand & Social Accounts, Competitor Analysis, Idea Lab) and the composer 'Select Content Type' with the
// 'Text to Post' pill, a 'What is your post about' textarea, a Post Design switch (AI-Picked | Choose), a 'Number of variants' slider
// (1 3 5 7), 'Media for Post' (AI-Picked | Choose Media) and a blue Generate pill bottom-right. Pressing it greys the pill, which reads
// 'Generating' beside a small ring, and washes the whole workspace out behind a centred stack: a rotating mark, the bold 'Generating Your
// Posts' and a grey marketing paragraph that rotates between two blurbs. There is no bar, no percentage, no step list. The app then dissolves
// straight back to 'Content Library' with the new post first in the grid: a flat grey placeholder carrying 'Click To View Caption', a green
// 'from your idea' chip and 'less than a minute ago', the picture filling in afterwards.
// Adapted to ten images: ten posts in a 5 + 5 block, the placeholders filling with the pictures strictly one after another in reading order,
// the mark turning and the blurb rotating from render(t). Omitted: the YouTube player's own pause button and timecode, the presenter's
// webcam bubble, the logo, the workspace switcher, the account row, the promo cards and every plan or credit line. The mark is a plain
// two-arc spinner, not the logo; the blurbs' trailing emoji are left out. The footage's own posts are never reproduced: every picture is
// our own meme, in the system type.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-prd';
const ROOT_H = 336, SIDE_W = 100, COLS = 5, GAP = 6, GRID_TOP = 58;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fff; color: #111827; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-side { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 3px; width: ${SIDE_W}px; padding: 34px 8px 8px; background: #fff; box-shadow: inset -1px 0 0 #eef0f3; }
.${P}-new { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 19px; margin-bottom: 8px; padding: 0 7px; border-radius: 3px; background: #1a6cf5; font-size: 6.8px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-new i { flex: none; display: grid; place-items: center; width: 7px; height: 7px; border-radius: 2px; box-shadow: inset 0 0 0 1px #fff; font-style: normal; font-size: 6px; line-height: 6px; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 16px; padding: 0 4px; border-radius: 3px; font-size: 5.9px; color: #374151; white-space: nowrap; }
.${P}-nav i { flex: none; display: block; width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px #6b7280; }
.${P}-main { position: relative; flex: 1; min-width: 0; overflow: hidden; background: #fff; }
.${P}-view { position: absolute; left: 0; top: 0; right: 0; bottom: 0; }
.${P}-back { position: absolute; left: 12px; top: 12px; width: 8px; height: 8px; fill: none; stroke: #111827; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 9px; text-align: center; font-size: 11px; font-weight: 700; line-height: 14px; color: #111827; }
.${P}-type { position: absolute; left: 50%; top: 30px; display: flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; width: 84px; height: 17px; margin-left: -42px; border-radius: 4px; background: #f3f4f6; box-shadow: 0 0 0 1px #e5e7eb; font-size: 6.4px; font-weight: 500; color: #111827; white-space: nowrap; }
.${P}-type i { flex: none; display: block; width: 7px; height: 7px; border-radius: 2px; background: #6d7bf0; }
.${P}-type svg { width: 4px; height: 4px; fill: none; stroke: #111827; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-lab { position: absolute; font-size: 6.2px; line-height: 8px; color: #374151; white-space: nowrap; }
.${P}-ta { position: absolute; left: 12px; top: 74px; box-sizing: border-box; width: 258px; height: 108px; padding: 9px 9px; border: 1px solid #d9dde3; border-radius: 3px; font-size: 7px; line-height: 10px; color: #111827; }
.${P}-lnk { position: absolute; display: flex; align-items: center; gap: 4px; font-size: 6.2px; color: #1a56c8; white-space: nowrap; }
.${P}-lnk i { display: block; width: 5px; height: 5px; border-radius: 1.5px; background: #1a56c8; }
.${P}-seg { position: absolute; left: 282px; right: 12px; display: flex; box-sizing: border-box; height: 16px; border-radius: 3px; background: #f3f4f6; }
.${P}-seg span { flex: 1; display: flex; align-items: center; justify-content: center; gap: 3px; font-size: 6px; color: #374151; white-space: nowrap; }
.${P}-seg .${P}-hot { margin: 1px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 .5px #e5e7eb; }
.${P}-seg i { display: block; width: 5px; height: 5px; border-radius: 1.5px; background: #1a56c8; }
.${P}-trk { position: absolute; left: 288px; right: 18px; top: 116px; height: 1px; background: #e5e7eb; }
.${P}-trk b { position: absolute; left: -3px; top: -3.5px; width: 7px; height: 7px; border-radius: 50%; background: #1a6cf5; }
.${P}-tk { position: absolute; left: 285px; right: 15px; top: 122px; display: flex; justify-content: space-between; font-size: 5.6px; color: #6b7280; }
.${P}-gen { position: absolute; right: 12px; bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 62px; height: 18px; border-radius: 9px; background: #1a6cf5; font-size: 6.8px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-ring { position: relative; flex: none; box-sizing: border-box; width: 6px; height: 6px; border-radius: 50%; border: 1px solid #fff; }
.${P}-ring u { position: absolute; left: -1px; top: -1px; right: -1px; bottom: -1px; box-sizing: border-box; border-radius: 50%; border: 1px solid transparent; border-top-color: #8e95a3; }
.${P}-wash { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, .92); }
.${P}-mark { position: absolute; left: 50%; top: 82px; width: 30px; height: 30px; margin-left: -15px; }
.${P}-mark svg { display: block; width: 30px; height: 30px; fill: none; stroke-width: 3; stroke-linecap: round; }
.${P}-wt { position: absolute; left: 0; right: 0; top: 128px; text-align: center; font-size: 15px; font-weight: 700; line-height: 18px; color: #111827; }
.${P}-bl { position: absolute; left: 50%; top: 158px; width: 290px; margin-left: -145px; text-align: center; font-size: 8.6px; line-height: 12px; color: #374151; }
.${P}-h1 { position: absolute; left: 12px; top: 10px; font-size: 11px; font-weight: 700; line-height: 14px; color: #111827; white-space: nowrap; }
.${P}-tabs { position: absolute; left: 12px; top: 30px; display: flex; gap: 14px; height: 15px; font-size: 6.4px; color: #374151; }
.${P}-tabs span { display: flex; align-items: center; height: 15px; box-sizing: border-box; }
.${P}-tabs .${P}-hot { color: #1a56c8; box-shadow: 0 1.5px 0 #1a56c8; }
.${P}-search { position: absolute; right: 54px; top: 9px; display: flex; align-items: center; box-sizing: border-box; width: 96px; height: 16px; padding: 0 6px; border-radius: 3px; box-shadow: inset 0 0 0 1px #d9dde3; font-size: 5.8px; color: #6b7280; white-space: nowrap; }
.${P}-filter { position: absolute; right: 12px; top: 9px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 36px; height: 16px; border-radius: 3px; background: #eaf2ff; box-shadow: inset 0 0 0 1px #9cc0f8; font-size: 6px; color: #1a56c8; }
.${P}-g { position: absolute; left: 12px; right: 12px; top: ${GRID_TOP}px; bottom: 8px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-card { box-sizing: border-box; min-height: 0; padding: 4px; border-radius: 4px; background: #fff; box-shadow: 0 0 0 1px #e5e7eb; overflow: hidden; }
.${P}-ph { position: relative; width: 100%; aspect-ratio: 1; border-radius: 2px; overflow: hidden; background: #a6a6a6; }
.${P}-ph img { position: absolute; left: 0; top: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cover { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: #a6a6a6; }
.${P}-ph s { position: absolute; left: 3px; top: 3px; display: flex; align-items: center; gap: 2px; text-decoration: none; height: 7px; padding: 0 2px; border-radius: 2px; background: rgba(17, 24, 39, .55); font-size: 4.4px; line-height: 7px; color: #fff; }
.${P}-ph s i { display: block; width: 3px; height: 3px; border-radius: 1px; box-shadow: inset 0 0 0 .7px #fff; }
.${P}-cap { margin-top: 4px; height: 8px; border-radius: 2px; background: #eef0f3; text-align: center; font-size: 4.8px; font-weight: 500; line-height: 8px; color: #1a56c8; white-space: nowrap; }
.${P}-chip { display: inline-block; margin-top: 4px; height: 8px; padding: 0 4px; border-radius: 4px; background: #c9efd3; font-size: 4.8px; font-weight: 500; line-height: 8px; color: #15663a; white-space: nowrap; }
.${P}-ago { margin-top: 3px; font-size: 4.8px; line-height: 6px; color: #6b7280; white-space: nowrap; }
`;

const PROMPT = 'make me 10 muse memes';
const NAV = ['Dashboard', 'Content Library', 'Content Calendar', 'Brand & Social Accounts', 'Competitor Analysis', 'Idea Lab'];
const BLURBS = [
  'We have our own AI models to generate creatives layer by layer, unlike the pixel by pixel generation of Midjourney or Stable Diffusion.',
  'We obey your brand guidelines to generate posts in your brand colors, font, logo, and gradients.',
];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.1;                               // the cursor presses Generate
const GREY = 0.16;                                // the pill greys and reads 'Generating'
const WASH = 0.3;                                 // the workspace is washed out behind 'Generating Your Posts'
const BLURB_EVERY = 0.4;                          // the blurb swaps this often (layout seconds)
const LIB = 1.0;                                  // the wash gives way to the Content Library, the ten placeholders already laid out
const LAND = Array.from({ length: 10 }, (_, i) => 1.12 + i * 0.08);   // post i's picture fills its placeholder (reading order), the last at 1.84

export default {
  id: 'predis-ai',
  label: 'Predis.ai posts (2024)',
  source: {
    platform: "Predis.ai web app, Create New -> Text to Post (desktop browser, white workspace with a blue accent; the official 'Predis.ai - Demo' screen recording on the Predis AI YouTube channel, 2024-10-24)",
    feature: "left rail with a blue 'Create New' button; the 'Select Content Type' composer (Text to Post, 'What is your post about', Post Design, Number of variants, Media for Post) with a blue Generate pill; pressing it greys the pill to 'Generating' and washes the workspace out behind a centred rotating mark, the bold 'Generating Your Posts' and a marketing blurb that rotates between two paragraphs (no bar, no percentage); the app then returns to 'Content Library' with the new posts first as flat grey placeholders reading 'Click To View Caption' with a green 'from your idea' chip and 'less than a minute ago', the pictures filling in afterwards (adapted to 10: a 5 + 5 block filling in reading order; the player chrome, webcam bubble, logo, workspace switcher, account row, promo cards and plan lines are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=jwNf75aj5vo', retrieved: '2026-10-14', videoId: 'jwNf75aj5vo', published: '2024-10-24', note: 'composer t=326-333, pressed pill t=334, wash t=336-350, Content Library landing t=352' }],
    extrapolated: [
      'the blurb cadence: only two paragraphs were seen across one ~15 s wait (blurb 1 until ~t=342, blurb 2 from ~t=343), so the swap every ~0.4 layout seconds, alternating the same two, is inferred; a longer list may exist',
      "the mark: the footage rotates the product's own logo; a plain two-arc spinner turning from t stands in for it",
      "the wash lifting in one step to the library and the ten placeholders filling one at a time (the footage shows one new post's placeholder only, and the picture's own fill was not filmed)",
      "the pill's exact press-to-grey instant (bracketed to t=333-334 of the footage)",
      "the composer's slider ticks and the second row of the library grid, drawn at the footage's layout but with our own content (the prompt is ours; the footage's prompt text is not reproduced)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'predis-ai');
    const card = (g, i) => `<div class="${P}-card"><div class="${P}-ph"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cover"></div><s><i></i>1:1</s></div><div class="${P}-cap">Click To View Caption</div><div class="${P}-chip">from your idea</div><div class="${P}-ago">less than a minute ago</div></div>`;
    const chev = '<svg viewBox="0 0 10 10"><path d="M3.500 2l3 3-3 3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-side"><div class="${P}-new"><i>+</i>Create New</div>${NAV.map((n) => `<div class="${P}-nav"><i></i>${x.esc(n)}</div>`).join('')}</div><div class="${P}-main"><div class="${P}-view ${P}-va"><svg class="${P}-back" viewBox="0 0 10 10"><path d="M8.500 5h-7M4.500 2L1.500 5l3 3"/></svg><div class="${P}-ttl">Select Content Type</div><div class="${P}-type"><i></i>Text to Post${chev}</div><div class="${P}-lab" style="left: 12px; top: 62px">What is your post about</div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-lnk" style="left: 12px; top: 190px"><i></i>Surprise me</div><div class="${P}-lab" style="left: 282px; top: 62px">Post Design</div><div class="${P}-seg" style="top: 73px"><span><i></i>AI-Picked</span><span class="${P}-hot"><i></i>(1) Choose</span></div><div class="${P}-lab" style="left: 282px; top: 98px">Number of variants</div><div class="${P}-trk"><b></b></div><div class="${P}-tk"><span>1</span><span>3</span><span>5</span><span>7</span></div><div class="${P}-lab" style="left: 282px; top: 140px">Media for Post</div><div class="${P}-seg" style="top: 151px"><span class="${P}-hot"><i></i>AI-Picked</span><span>+ Choose Media</span></div><div class="${P}-lnk" style="left: 282px; top: 178px"><i></i>More Settings</div><div class="${P}-gen"><span class="${P}-gl">Generate</span><i class="${P}-ring" style="display: none"><u></u></i></div><div class="${P}-wash" style="display: none"><div class="${P}-mark"><svg viewBox="0 0 30 30"><path d="M15 4a11 11 0 0 1 10.500 7.700" stroke="#1a6cf5"/><path d="M25.500 18.300A11 11 0 0 1 15 26" stroke="#e8342a"/><path d="M8 22.500A11 11 0 0 1 5 15" stroke="#1a6cf5"/></svg></div><div class="${P}-wt">Generating Your Posts</div><div class="${P}-bl">${x.esc(BLURBS[0])}</div><div class="${P}-bl" style="display: none">${x.esc(BLURBS[1])}</div></div></div><div class="${P}-view ${P}-vb" style="visibility: hidden"><div class="${P}-h1">Content Library</div><div class="${P}-tabs"><span class="${P}-hot">All</span><span>Image</span><span>Video</span><span>Carousel</span></div><div class="${P}-search">Search in your Posts</div><div class="${P}-filter">Filter</div><div class="${P}-g">${tiles.map(card).join('')}</div></div></div></div>`);
    const q = (c) => root.querySelector(`.${P}-${c}`);
    const gen = q('gen'), gl = q('gl'), gring = gen.querySelector(`.${P}-ring`), gspin = gring.firstElementChild;
    const vA = q('va'), vB = q('vb'), wash = q('wash'), mark = q('mark');
    const blurbs = [...root.querySelectorAll(`.${P}-bl`)];
    const navLib = root.querySelectorAll(`.${P}-nav`)[1];
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

        // Generate is pressed; the pill then greys and reads 'Generating' beside a small ring
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        const grey = s >= GREY;
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('gr', grey, (v) => {
          gen.style.background = v ? '#d3d6dc' : '#1a6cf5';
          gen.style.color = v ? '#9ca3af' : '#fff';
          gl.textContent = v ? 'Generating' : 'Generate';
          gring.style.display = v ? '' : 'none';
        });
        const gdeg = (((t * 480) % 360) + 360) % 360;
        put('gs', gdeg.toFixed(0), (d) => { gspin.style.transform = `rotate(${d}deg)`; });

        // composer + wash -> Content Library
        const ph = s < WASH ? 0 : s < LIB ? 1 : 2;
        put('ph', ph, (v) => {
          vA.style.display = v === 2 ? 'none' : '';
          wash.style.display = v === 1 ? '' : 'none';
          vB.style.visibility = v === 2 ? '' : 'hidden';
          navLib.style.background = v === 2 ? '#e3eeff' : 'transparent';
          navLib.style.color = v === 2 ? '#1a56c8' : '#374151';
        });

        // the mark turns and the blurb rotates between its two paragraphs, both from t
        const mdeg = (((t * 300) % 360) + 360) % 360;
        put('mk', mdeg.toFixed(0), (d) => { mark.style.transform = `rotate(${d}deg)`; });
        const bi = Math.floor(Math.max(0, s - WASH) / BLURB_EVERY) % BLURBS.length;
        put('bl', bi, (v) => { blurbs.forEach((b, i) => { b.style.display = i === v ? '' : 'none'; }); });

        // the ten placeholders fill with their pictures in reading order
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
