// YouCam AI Pro (2024), Perfect Corp's phone app, the 'Text to Image' tab while it generates (YouTube PdBpIBNIX-Q, 2024-12-06,
// overlay on screen t~243.5-247.0 s of the clip; spec .tmp/clone-9e82faf1/reveal-refs/youcam-ai-pro/spec.json, confidence 0.62; frames
// ai_composer_tt2i_240s.png, ai_pending_30pct_244s.png, ai_pending_30pct_246s.png, ai_later_290s.png). A white phone page: a prompt card
// with its character counter, a 'Generate Prompt' / 'Add Photo' chip row, 'Select Style' with category chips and a row of style tiles
// (one selected, ringed), a big purple 'Generate' button and a three-tab bar. Pressing the button does not make tiles: the WHOLE composer
// dims behind a scrim (the prompt stays readable through it) and a white stack is centred on it, 'Generating...', 'Please don't close
// the app or lock the screen.', a thin purple-to-blue progress bar and its percentage, with the greyed button still visible beneath.
// There is no spinner, queue label or tile placeholder; the footage only ever shows 30%, then jump-cuts.
// Adapted to ten images: the composer gains a 'Results' strip of ten empty tiles under the button (the app opens a separate result view,
// which does not fit a fixed card); when the bar fills the scrim lifts and the ten pictures land one at a time in reading order.
// Omitted: the sub-line under the button, the brand title and crown badge, the Android status bar and the badges on the tiles.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-yca';
const ROOT_H = 516, COLS = 10, GAP = 4;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 14px; border-radius: 14px; background: #f7f7fc; color: #1d1b2a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dedcea; }
.${P}-top { flex: none; display: flex; align-items: center; height: 38px; }
.${P}-top b { flex: 1; font-size: 15px; font-weight: 700; color: #1d1b2a; }
.${P}-gear { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #ecebf6; }
.${P}-gear svg { display: block; width: 13px; height: 13px; fill: none; stroke: #3a3750; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-card { flex: none; position: relative; box-sizing: border-box; height: 74px; padding: 9px 12px 0; border-radius: 12px; background: #ffffff; box-shadow: 0 0 0 1px #e4e2f0; }
.${P}-card p { margin: 0; height: 32px; overflow: hidden; font-size: 11.5px; line-height: 16px; color: #1d1b2a; }
.${P}-card div { position: absolute; left: 12px; right: 12px; bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 9px; color: #6d6a82; }
.${P}-card div i { flex: none; display: block; width: 8px; height: 10px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #6d6a82; }
.${P}-card div span { flex: 1; }
.${P}-card div u { flex: none; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; background: #1d1b2a; text-decoration: none; font-size: 8px; line-height: 8px; color: #ffffff; }
.${P}-chips { flex: none; display: flex; align-items: center; gap: 8px; height: 28px; margin-top: 10px; }
.${P}-chips span { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 26px; padding: 0 11px; border-radius: 13px; background: #ecebf6; font-size: 10.5px; font-weight: 500; color: #2c2940; white-space: nowrap; }
.${P}-chips span.${P}-r { padding: 0; width: 26px; justify-content: center; }
.${P}-chips svg { display: block; width: 11px; height: 11px; fill: none; stroke: #2c2940; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-sh { flex: none; display: flex; align-items: center; height: 18px; margin-top: 14px; }
.${P}-sh b { flex: 1; font-size: 13px; font-weight: 700; }
.${P}-sh span { font-size: 10px; font-weight: 600; color: #4b34d6; }
.${P}-cats { flex: none; display: flex; align-items: center; gap: 6px; height: 22px; margin-top: 6px; font-size: 10.5px; color: #3c3950; white-space: nowrap; }
.${P}-cats span { box-sizing: border-box; height: 20px; padding: 0 9px; border-radius: 10px; line-height: 20px; }
.${P}-cats .${P}-on { background: #4b34d6; font-weight: 600; color: #ffffff; }
.${P}-sty { flex: none; display: flex; gap: 10px; margin-top: 8px; }
.${P}-st { flex: none; width: 64px; font-size: 9px; text-align: center; color: #2c2940; white-space: nowrap; }
.${P}-st i { position: relative; display: block; width: 64px; height: 64px; margin-bottom: 4px; border-radius: 8px; box-sizing: border-box; }
.${P}-st.${P}-on { font-weight: 600; }
.${P}-st.${P}-on i { box-shadow: 0 0 0 2px #f7f7fc, 0 0 0 4px #7c5cff; }
.${P}-no { background: #d2d1dc; }
.${P}-no::after { content: ""; position: absolute; left: 22px; top: 22px; width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px #85839a; background: linear-gradient(135deg, transparent 46%, #85839a 46%, #85839a 54%, transparent 54%); }
.${P}-av { background: radial-gradient(circle at 50% 36%, rgba(255, 255, 255, .62) 0 10px, transparent 11px), radial-gradient(ellipse at 50% 104%, rgba(255, 255, 255, .5) 0 22px, transparent 23px), linear-gradient(150deg, var(--a), var(--b)); }
.${P}-slot { flex: none; position: relative; align-self: center; width: 260px; height: 40px; margin-top: 12px; }
.${P}-go { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 20px; background: #5b3de8; font-size: 14px; font-weight: 700; color: #ffffff; }
.${P}-rh { flex: none; height: 18px; margin-top: 12px; font-size: 13px; font-weight: 700; line-height: 18px; }
.${P}-row { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 6px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; background: #e6e4f1; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-nav { flex: none; display: flex; height: 44px; margin: auto -14px 0; border-top: 1px solid #e4e2f0; background: #ffffff; }
.${P}-nav span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 9px; color: #4a4760; }
.${P}-nav span.${P}-on { background: #ecebfb; font-weight: 600; color: #4b34d6; }
.${P}-nav svg { display: block; width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-scrim { position: absolute; inset: 0; display: none; background: rgba(14, 12, 28, .56); }
.${P}-ov { position: absolute; left: 50%; top: 47%; display: flex; flex-direction: column; align-items: center; width: 300px; margin-left: -150px; transform: translateY(-50%); text-align: center; color: #ffffff; }
.${P}-ov b { font-size: 17px; font-weight: 700; line-height: 22px; }
.${P}-ov span { margin-top: 5px; font-size: 11.5px; line-height: 16px; color: #f1f0f8; }
.${P}-bar { position: relative; width: 250px; height: 6px; margin-top: 14px; border-radius: 3px; background: rgba(255, 255, 255, .34); overflow: hidden; }
.${P}-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 3px; background: linear-gradient(90deg, #a58cff, #4fb0ff); }
.${P}-ov em { margin-top: 8px; font-size: 12px; font-style: normal; font-weight: 500; color: #ffffff; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.08;                              // the finger taps 'Generate'
const ISSUE = 0.16;                               // the scrim comes down over the whole composer
const FILL_END = 0.62;                            // the bar reaches 100%
const LIFT = [0.64, 0.74];                        // the scrim lifts
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);   // tile i hands its box to the picture (reading order), the last at 1.68
const ICON = {
  gear: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4"/></svg>',
  hist: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.6"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
  text: '<svg viewBox="0 0 16 16"><rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.4"/><path d="M5.4 5.6h5.2M8 5.6v5.2"/></svg>',
  photo: '<svg viewBox="0 0 16 16"><rect x="2.2" y="4" width="9.4" height="9.4" rx="2"/><circle cx="6.9" cy="8.7" r=".9"/><path d="M12.8 1.8v3.4M11.1 3.5h3.4"/></svg>',
  tune: '<svg viewBox="0 0 16 16"><path d="M2.4 5h11.2M2.4 11h11.2"/><circle cx="6" cy="5" r="1.6"/><circle cx="10.4" cy="11" r="1.6"/></svg>',
  img: '<svg viewBox="0 0 16 16"><rect x="2.4" y="3" width="11.2" height="10" rx="2"/><path d="M3.4 11.2l3-3 2.4 2.4 1.6-1.6 2.2 2.2"/></svg>',
  wand: '<svg viewBox="0 0 16 16"><path d="M3 13L10.6 5.4M9.4 2.2v2.4M13.8 6.6h-2.4M12.2 3.8l-1.6 1.6"/></svg>',
  tools: '<svg viewBox="0 0 16 16"><rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.4"/><path d="M5.2 10.6L8 5.2l2.8 5.4M6.2 8.8h3.6"/></svg>',
};
const STYLES = [['No Style', ''], ['3D Cartoon', '#ff9bb3,#a56bff'], ['Movie Persona', '#f3c58b,#7b8cff'], ['Console Style', '#7fa07a,#37506b'], ['Pixel Art', '#7ee0c3,#4b6bd6'], ['Watercolor', '#ffc8a2,#e87fb0']];

export default {
  id: 'youcam-ai-pro',
  label: 'YouCam AI Pro (2024)',
  source: {
    platform: "Perfect Corp YouCam AI Pro phone app, the 'Text to Image' tab (Android; a tutorial screen recording on YouTube, 2024-12-06)",
    feature: "white phone composer (prompt card, 'Generate Prompt' / 'Add Photo' chips, 'Select Style' chips and tiles, purple 'Generate' button) that a dim scrim covers whole while a white stack is centred on it, 'Generating...' / 'Please don't close the app or lock the screen.' / a thin purple-to-blue progress bar / its percentage (no spinner, queue label or tile placeholder); the scrim lifts and the pictures land (adapted to 10: a 'Results' strip of ten tiles under the button landing one at a time in reading order; the sub-line under the button, the brand title and the status bar are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=PdBpIBNIX-Q', title: 'how to use YouCam Ai Pro app | text to image ai generator (SCAM VIEW)', published: '2024-12-06', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "the progress bar and percentage rise from 0 to 100 with an ease-out: the footage only ever shows 30% (at t~244-247 s) before it jump-cuts, so the count and the 100% end are not observed",
      "the 'Results' strip of ten empty tiles under the button, and the scrim lifting onto it: the app opens a separate result view after the wait (and the clip jump-cuts), so the landing is invented to fit a fixed card; the pictures land one at a time in reading order",
      "the prompt, the 'Generate' label returning, and the button's greyed 'Generating...' label under the scrim (read from the 30% frame, which shows the button dimmed)",
      "the style tiles are plain gradient silhouettes of our own (the footage's tiles are photographs), and the 'Editor's Choice' feed below the button is replaced by the Results strip",
      'the portrait phone page reflowed into the 560 px column: the page is stretched to the card width and the style row shows six tiles',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'youcam-ai-pro');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const sty = STYLES.map(([n, c], i) => `<div class="${P}-st${i === 1 ? ' ' + P + '-on' : ''}"><i class="${i === 0 ? `${P}-no` : `${P}-av`}"${c ? ` style="--a: ${c.split(',')[0]}; --b: ${c.split(',')[1]}"` : ''}></i>${n}</div>`).join('');
    const cats = ['HOT', 'Figurines', 'Artistry', 'Contemporary', 'Classics'].map((n, i) => `<span${i === 0 ? ` class="${P}-on"` : ''}>${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>Text to Image</b><i class="${P}-gear">${ICON.gear}</i></div><div class="${P}-card"><p>${x.esc(PROMPT)}</p><div><i></i><span>Add Tags</span>${PROMPT.length}/600<u>×</u></div></div><div class="${P}-chips"><span class="${P}-r">${ICON.hist}</span><span>${ICON.text}Generate Prompt</span><span>${ICON.photo}Add Photo</span><span class="${P}-r">${ICON.tune}</span></div><div class="${P}-sh"><b>Select Style</b><span>View more &gt;</span></div><div class="${P}-cats">${cats}</div><div class="${P}-sty">${sty}</div><div class="${P}-slot"><div class="${P}-go">Generate</div></div><div class="${P}-rh">Results</div><div class="${P}-row">${tiles.map(cell).join('')}</div><div class="${P}-nav"><span class="${P}-on">${ICON.img}Text to Image</span><span>${ICON.wand}AI Editing</span><span>${ICON.tools}AI Tools</span></div><div class="${P}-scrim"><div class="${P}-ov"><b>Generating...</b><span>Please don't close the app or lock the screen.</span><div class="${P}-bar"><i></i></div><em>0%</em></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const go = q('go'), scrim = q('scrim'), fill = q('bar').firstElementChild, pct = q('ov').querySelector('em');
    const thumbs = [...root.querySelectorAll(`.${P}-t img`)];
    ctx.gate(thumbs);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the tap on Generate; under the scrim the button reads 'Generating...' and is dimmed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('press', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= ISSUE && s < LIFT[1];
        put('busy', busy, (v) => { go.textContent = v ? 'Generating...' : 'Generate'; go.style.background = v ? '#4a3a99' : ''; go.style.color = v ? '#b9b0e3' : ''; });

        // the scrim over the whole composer: it comes down at ISSUE and lifts once the bar is full
        const a = seg(s, ISSUE, ISSUE + 0.05) * (1 - seg(s, LIFT[0], LIFT[1]));
        put('scrim', a.toFixed(3), () => { scrim.style.display = a > 0 ? 'block' : 'none'; scrim.style.opacity = a >= 1 ? '' : a.toFixed(3); });
        // the progress bar and its percentage rise from t (an ease-out toward 100)
        const f = 1 - Math.pow(1 - seg(s, ISSUE, FILL_END), 2.2);
        const p = Math.min(100, Math.floor(f * 100));
        put('pct', p, (v) => { fill.style.width = `${v}%`; pct.textContent = `${v}%`; });

        // the pictures land in reading order, each a hard swap
        thumbs.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
      },
    };
  },
};
