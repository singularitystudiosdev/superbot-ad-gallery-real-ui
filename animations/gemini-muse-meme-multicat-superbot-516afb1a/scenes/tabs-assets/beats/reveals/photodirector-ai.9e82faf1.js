// PhotoDirector AI (2024), CyberLink's phone app, the 'Text to Image' screen (YouTube mLYdQbouqw4, 2024-09-19, composer t~76 s,
// generating t~78-87 s, results t~90-92 s; spec .tmp/clone-9e82faf1/reveal-refs/photodirector-ai/spec.json, confidence 0.68; frames
// ai_composer_tt2i_76s.png, ai_pending_78s.png, ai_pending_spinner_81s.png, ai_pending_84s.png, ai_result_landing_90s.png,
// ai_result_92s.png). A near-black phone screen: a back arrow and the title 'Text to Image', the label 'Describe what image you want to
// generate' over an outlined prompt field, 'Select a style' with a Portrait | Scenery tab pair and a two-row grid of rounded style
// tiles, and an 'Editor's Choice' feed. Tapping the full-width bottom button collapses the composer to a 'Description' line and the
// result column fills with dark rounded tiles, each holding a glowing orb spinner: a soft blurred ball with a purple, blue and magenta
// halo and a faint 'T' glyph at its centre, swirling slowly. The button is greyed and reads 'Generating'; when the pictures arrive
// they replace the tiles and it reads 'Generate More'. There is no percentage and no queue label.
// Adapted to ten images: the footage's single scrolling column of square tiles becomes a 5 x 2 block of portrait tiles, each with its
// own orb (phases offset), swapping to its picture one at a time in reading order.
// Omitted: the balance chip and its 10 -> 8 count, the cost line under the button, the end card of the tutorial, the brand title, the
// title card, the floating grey handle and the badges on the tiles.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-phd';
const ROOT_H = 496, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 18px 14px; border-radius: 14px; background: #0b0b0d; color: #f1f1f4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #26262b; }
.${P}-top { flex: none; display: flex; align-items: center; height: 44px; }
.${P}-top svg { flex: none; display: block; width: 16px; height: 16px; fill: none; stroke: #f1f1f4; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top b { flex: 1; padding-right: 16px; text-align: center; font-size: 13px; font-weight: 500; color: #f1f1f4; }
.${P}-body { position: relative; flex: 1; min-height: 0; }
.${P}-pane { position: absolute; inset: 0; }
.${P}-lab { height: 18px; font-size: 12px; line-height: 18px; color: #d4d4da; }
.${P}-field { box-sizing: border-box; height: 56px; margin-top: 7px; padding: 8px 10px; border-radius: 6px; box-shadow: inset 0 0 0 1px #4a4a52; font-size: 11px; line-height: 15px; color: #8e8e98; overflow: hidden; }
.${P}-sel { height: 18px; margin-top: 14px; font-size: 12px; line-height: 18px; color: #d4d4da; }
.${P}-tabs { display: flex; height: 26px; margin-top: 4px; border-bottom: 1px solid #2c2c32; font-size: 11px; font-weight: 600; }
.${P}-tabs span { flex: 1; display: grid; place-items: center; color: #8e8e98; }
.${P}-tabs .${P}-on { color: #f1f1f4; box-shadow: 0 1.5px 0 #f1f1f4; }
.${P}-sg { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px 10px; margin-top: 10px; }
.${P}-sg div { font-size: 9px; text-align: center; color: #aeaeb8; white-space: nowrap; }
.${P}-sg i { display: block; box-sizing: border-box; height: 54px; margin-bottom: 4px; border-radius: 7px; background: radial-gradient(circle at 50% 38%, rgba(255, 255, 255, .55) 0 9px, transparent 10px), radial-gradient(ellipse at 50% 104%, rgba(255, 255, 255, .42) 0 20px, transparent 21px), linear-gradient(150deg, var(--a), var(--b)); }
.${P}-sg .${P}-on i { box-shadow: 0 0 0 1.5px #0b0b0d, 0 0 0 3px #c9c9d2; }
.${P}-ec { margin-top: 12px; font-size: 12px; font-weight: 500; text-align: center; color: #e6e6ea; }
.${P}-ecs { display: flex; gap: 10px; margin-top: 8px; }
.${P}-ecs i { flex: 1; display: block; height: 50px; border-radius: 8px 8px 0 0; background: linear-gradient(160deg, #3a3550, #1c1b26); }
.${P}-dsc { height: 16px; font-size: 11px; line-height: 16px; color: #d4d4da; }
.${P}-dsc2 { height: 18px; font-size: 10.5px; line-height: 15px; color: #8e8e98; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 9px; background: #2b2b2e; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #2b2b2e; }
.${P}-halo { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; background: conic-gradient(from 0deg, #8a5cff, #3c7bff, #e04bd2, #8a5cff); filter: blur(5px); }
.${P}-orb { position: relative; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 47% 53% 50% 50% / 52% 46% 54% 48%; background: radial-gradient(circle at 42% 34%, #ffffff 0, #d9d8ff 32%, #8f84f4 72%, #5b4be0 100%); box-shadow: inset 0 0 5px rgba(255, 255, 255, .8), 0 0 4px rgba(190, 150, 255, .9); font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1; color: rgba(40, 30, 90, .55); }
.${P}-btn { flex: none; display: grid; place-items: center; height: 38px; border-radius: 6px; background: #f1f1f4; font-size: 13px; font-weight: 600; color: #101012; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.08;                              // the finger taps the button
const ISSUE = 0.18;                               // the composer collapses and the dark tiles fill the column
const LAND = Array.from({ length: 10 }, (_, i) => 0.45 + i * 0.1367);   // tile i swaps to its picture (reading order), the last at 1.68
const ICON_BACK = '<svg viewBox="0 0 16 16"><path d="M13 8H3M7.4 3.4L2.8 8l4.6 4.6"/></svg>';
const STYLES = [['Pure', '#f0c2b0,#9f8cc4'], ['Watercolor', '#9ec8e8,#7a8fd6'], ['B&W', '#d8d8d8,#4a4a4a'], ['Oil', '#e3b66a,#7c4b2a'], ['Cartoon', '#ffb7cf,#b58cff'], ['Neon', '#ff6bd6,#3b2fd0'], ['Vintage', '#d6b48a,#6b5137'], ['Steampunk', '#c99863,#3f3a33'], ['Fantasy', '#9ee0c8,#6b6bd6'], ['Pixel', '#7ee0a8,#4b6bd6']];

export default {
  id: 'photodirector-ai',
  label: 'PhotoDirector AI (2024)',
  source: {
    platform: "CyberLink PhotoDirector AI phone app, the 'Text to Image' screen (iOS, dark theme; a tutorial screen recording on YouTube, 2024-09-19)",
    feature: "near-black phone screen: a prompt field and a Portrait | Scenery style grid that collapse, on tapping the full-width bottom button ('Generate' -> 'Generating'), into a column of dark rounded tiles each holding a glowing orb spinner (a soft blurred ball with a purple, blue and magenta halo and a faint 'T' glyph, swirling), swapped for the finished pictures with the button reading 'Generate More' (no percentage or queue label; adapted to 10: a 5 x 2 block of portrait tiles swapping one at a time in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=mLYdQbouqw4', title: 'PhotoDirector AI text to image tutorial', published: '2024-09-19', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "ten tiles in a 5 x 2 block: the footage shows a single scrolling column of square tiles, so the orbs sit in a grid of portrait tiles that swap one at a time in reading order (the footage's pictures land together)",
      "the orb's pulse and swirl rates: the footage shows it settling slowly, so the halo turns about once a second and the ball breathes a few percent, both functions of t alone",
      "the 'Editor's Choice' feed is drawn as two cropped plain cards (the footage's are photographs); the style tiles are plain gradient silhouettes of our own",
      "the 'Generate More' label after the last picture has landed (the footage shows it once every picture is in)",
      'the portrait phone screen reflowed into the 560 px column: the page is stretched to the card width and the style grid shows two rows of five',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'photodirector-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-halo"></i><i class="${P}-orb">T</i></div></div>`;
    const sty = STYLES.map(([n, c], i) => `<div${i === 5 ? ` class="${P}-on"` : ''}><i style="--a: ${c.split(',')[0]}; --b: ${c.split(',')[1]}"></i>${x.esc(n)}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top">${ICON_BACK}<b>Text to Image</b></div><div class="${P}-body"><div class="${P}-pane ${P}-comp"><div class="${P}-lab">Describe what image you want to generate</div><div class="${P}-field">${x.esc(PROMPT)}</div><div class="${P}-sel">Select a style</div><div class="${P}-tabs"><span class="${P}-on">Portrait</span><span>Scenery</span></div><div class="${P}-sg">${sty}</div><div class="${P}-ec">Editor's Choice</div><div class="${P}-ecs"><i></i><i></i></div></div><div class="${P}-pane ${P}-res" style="visibility: hidden"><div class="${P}-dsc">Description</div><div class="${P}-dsc2">${x.esc(PROMPT)}</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div><div class="${P}-btn">Generate</div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const comp = q('comp'), res = q('res'), btn = q('btn');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), halo: n.querySelector(`.${P}-halo`), orb: n.querySelector(`.${P}-orb`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the tap on the button, then the composer collapses to the result column and the label reads 'Generating'
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('press', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });
        const on = s >= ISSUE;
        put('iss', on, (v) => { comp.style.visibility = v ? 'hidden' : ''; res.style.visibility = v ? '' : 'hidden'; });
        const done = s >= LAND[9];
        const label = !on ? 'Generate' : done ? 'Generate More' : 'Generating';
        put('lab', label, (v) => { btn.textContent = v; btn.style.background = v === 'Generating' ? '#3a3a3f' : ''; btn.style.color = v === 'Generating' ? '#a8a8b2' : ''; });

        cells.forEach((c, i) => {
          const v = s >= LAND[i];
          put(`i${i}`, v, (on1) => { c.im.style.visibility = on1 ? '' : 'hidden'; c.pend.style.display = on1 ? 'none' : ''; });
          // the orb: the halo turns and the ball breathes, a function of t alone (its phase differs per tile), covered or not
          const deg = Math.round((((t * 340 + i * 41) % 360) + 360) % 360);
          const sc = Math.round(100 + 5 * Math.sin(t * 5.1 + i * 0.9));
          const wob = Math.round(10 * Math.sin(t * 2.3 + i * 1.3));
          put(`o${i}`, `${deg}/${sc}/${wob}`, () => { c.halo.style.transform = `rotate(${deg}deg)`; c.orb.style.transform = `scale(${(sc / 100).toFixed(2)}) rotate(${wob}deg)`; });
        });
      },
    };
  },
};
