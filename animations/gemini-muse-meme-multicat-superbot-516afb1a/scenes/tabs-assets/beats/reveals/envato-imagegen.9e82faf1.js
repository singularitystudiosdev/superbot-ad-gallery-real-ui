// Envato Labs' AI ImageGen (Beta), labs.envato.com (YouTube DaJ8KZOlZlM, 2024-03-25, t=57-90 s; spec
// .tmp/clone-9e82faf1/reveal-refs/envato-imagegen/spec.json, confidence 0.80; frames t_57.png, t_64.png, t_68.png, t_74.png, t_78.png, t_90.png). A very
// light page (white, a faint dotted texture): a slim top bar with the title 'AI ImageGen' and a 'Beta' pill, and in the empty state a big
// centred 'AI ImageGen' heading, a two-line strapline and a wide rounded prompt field with a black 'Generate' button carrying a sparkle.
// Pressing it turns the page into a results view: the prompt echoed as a plain caption line top-left, a 4-column grid of flat light-grey
// (#EDEDED) rounded square cards, EVERY one with a single small pale-olive ring spinner and nothing else (no text, percentage, queue
// label or blur), the prompt field floating at the bottom with a 'Generate +' button, and the pictures landing one at a time, each card
// hard-swapping to its image (batch of 8, ~10-14 s).
// Adapted to ten images: ten cards in a 5 x 2 block landing in reading order, so the block fits one fixed-height frame. Omitted: the
// 'envato' wordmark and 'Labs' pill, the avatar and menu glyphs (plain circles stay), the 'Smart Suggestion' row, the sample gallery, the
// chat launcher, the amber warning triangle and the footage's own pictures: every card is our own meme.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ev';
const ROOT_H = 388, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background-color: #ffffff; background-image: radial-gradient(#e6e6e6 0.8px, transparent 0.9px); background-size: 9px 9px; color: #1a1a1a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e4e4; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 14px; background: #fff; }
.${P}-brand { display: flex; align-items: center; gap: 5px; font-size: 8.5px; font-weight: 500; color: #1a1a1a; white-space: nowrap; }
.${P}-brand em { font-style: normal; height: 11px; padding: 0 5px; border-radius: 6px; background: #dce8fa; font-size: 6px; line-height: 11px; color: #3b6fc4; }
.${P}-acts { display: flex; align-items: center; gap: 8px; }
.${P}-acts i { display: block; width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #5a5a5a; }
.${P}-acts b { display: block; width: 10px; height: 7px; background: linear-gradient(#5a5a5a, #5a5a5a) 0 0 / 100% 1.2px no-repeat, linear-gradient(#5a5a5a, #5a5a5a) 0 3px / 100% 1.2px no-repeat, linear-gradient(#5a5a5a, #5a5a5a) 0 6px / 100% 1.2px no-repeat; }
.${P}-cap { flex: none; height: 16px; padding: 0 14px; font-size: 7.5px; line-height: 16px; color: #1a1a1a; white-space: nowrap; }
.${P}-body { position: relative; flex: none; margin: 4px 14px 0; height: 252px; }
.${P}-hero { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; text-align: center; }
.${P}-hero h3 { margin: 0; font-size: 26px; font-weight: 400; line-height: 28px; color: #111; }
.${P}-hero p { margin: 0; font-size: 8px; line-height: 12px; color: #666; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; overflow: hidden; border-radius: 10px; background: #efefef; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 10px; background: #efefef; }
.${P}-ring { display: block; width: 24px; height: 24px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(143, 176, 89, 0) 0deg, #8fb059 226deg, rgba(143, 176, 89, 0) 230deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.4px), #000 calc(100% - 2.9px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3.4px), #000 calc(100% - 2.9px)); }
.${P}-bar { position: absolute; left: 50%; bottom: 12px; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: 380px; height: 36px; padding: 0 5px 0 12px; margin-left: -190px; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #dedede, 0 4px 14px rgba(0, 0, 0, .08); font-size: 8px; color: #1a1a1a; white-space: nowrap; }
.${P}-bar span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-btn { flex: none; display: flex; align-items: center; justify-content: center; gap: 4px; height: 26px; padding: 0 11px; border-radius: 13px; background: #111; font-size: 8.5px; font-weight: 500; color: #fff; }
.${P}-btn svg { width: 8px; height: 8px; fill: #fff; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses Generate
const ISSUE = 0.16;                                // the empty state gives way to ten grey cards, each with its spinner
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.145);   // card i lands (reading order), the last at 1.805

export default {
  id: 'envato-imagegen',
  label: 'Envato ImageGen (2024)',
  source: {
    platform: "Envato Labs' AI ImageGen (Beta), labs.envato.com (desktop browser, light theme; a third-party screen recording on YouTube, 2024-03-25)",
    feature: "white page: a prompt field with a black 'Generate' button and sparkle, a results grid of flat light-grey cards each with one small pale-olive ring spinner, landing one at a time by hard swap (adapted to 10: a 5 x 2 block in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=DaJ8KZOlZlM', retrieved: '2026-10-14' }],
    extrapolated: "the footage's batch is eight cards in a 4 x 2 grid; the ten cards in a 5 x 2 block, the landing in reading order (the footage's first card to land was in the top-right) and the compressed ~10 s timing are not in the footage",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'envato-imagegen');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    const spark = '<svg viewBox="0 0 12 12"><path d="M5 0.5l1.1 3.4 3.4 1.1-3.4 1.1L5 9.5 3.9 6.1 0.5 5l3.4-1.1z"/><path d="M9.6 6.6l0.6 1.7 1.7 0.6-1.7 0.6-0.6 1.7-0.6-1.7-1.7-0.6 1.7-0.6z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-brand">AI ImageGen<em>Beta</em></div><div class="${P}-acts"><i></i><b></b></div></div><div class="${P}-cap" style="visibility: hidden">${x.esc(PROMPT)}</div><div class="${P}-body"><div class="${P}-hero"><h3>AI ImageGen</h3><p>Inspirational images from the top AI generators.<br/>Simply enter a subject and let AI bring your vision to life.</p></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-bar"><span>${x.esc(PROMPT)}</span><div class="${P}-btn"><b class="${P}-lbl">Generate</b>${spark}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const cap = q(`.${P}-cap`), hero = q(`.${P}-hero`), grid = q(`.${P}-g`), btn = q(`.${P}-btn`), lbl = q(`.${P}-lbl`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed; in the results view the button reads 'Generate +'
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('iss', s >= ISSUE, (v) => { hero.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; cap.style.visibility = v ? '' : 'hidden'; lbl.textContent = v ? 'Generate +' : 'Generate'; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (!done) {
            // the ring turns with t (its phase differs per card); a function of t alone
            const deg = (((t * 420 + i * 37) % 360) + 360) % 360;
            put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
          }
        });
      },
    };
  },
};
