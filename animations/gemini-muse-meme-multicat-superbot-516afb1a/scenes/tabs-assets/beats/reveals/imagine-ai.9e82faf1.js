// Imagine: AI Art Generator by Vyro AI, the iPhone app's 'Result' screen as 2023 screen recordings show it (YouTube ktKU6k9vczo, mrhackio,
// 2023-07-28, t~94-105 s, and P3jJkWvkuwA; spec .tmp/clone-9e82faf1/reveal-refs/imagine-ai/spec.json, confidence 0.66; frames
// w_imagine_k_generating, w_imagine_k_result, w_imagine_p3_analysing, w_imagine_p3_creating, w_imagine_p3_adding_details,
// w_imagine_p3_adding_clarity, w_imagine_preview_sheet). Tapping the black 'Generate' button opens the 'Result' screen (a back arrow, the title,
// a 'Save' pill) and, over it, a centred white rounded modal: a bold sentence that cycles through the stages ('AI is analysing prompt..',
// 'Creating beautiful artwork..', 'Adding more details..', 'Adding clarity to images..', 'Almost there...') above a thin determinate bar, a
// light-grey track with a solid purple fill growing left to right, while the screen behind is dimmed and inactive. There is no spinner,
// percentage or queue chip. When the bar is done the modal goes and the finished picture fills the result area, 'Variate' and
// 'Generate More' turn solid, and an 'Edit Input' prompt box sits under them.
// Adapted to ten images: the Result screen's image area holds ten empty portrait slots in a 5 x 2 block; the modal runs the five stages over
// the first stretch, then the dim lifts and the ten pictures take their slots one after another in reading order. Omitted: the phone's status
// bar and home indicator, the 'Watch an ad' caption on the button, the footage's own art and the creator's camera moves; no logo, wordmark or
// platform font is drawn (a system face, plain line icons).
import { seg, press, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-iai';
const ROOT_H = 484, COLS = 5, GAP = 6;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: #f4f4f6; color: #111114; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dedee3; }
.${P}-hd { flex: none; position: relative; display: flex; align-items: center; height: 48px; padding: 0 18px; font-size: 17px; font-weight: 600; }
.${P}-hd svg { display: block; width: 18px; height: 18px; margin-right: 14px; fill: none; stroke: #111114; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-save { position: absolute; right: 16px; top: 11px; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 26px; padding: 0 11px; border-radius: 13px; box-shadow: inset 0 0 0 1.5px #111114; font-size: 12.5px; font-weight: 600; }
.${P}-save svg { width: 12px; height: 12px; margin: 0; stroke-width: 2; }
.${P}-stage { flex: none; box-sizing: border-box; margin: 4px 16px 0; padding: 8px; border-radius: 14px; background: #e4e4e8; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; background: #d3d3d9; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-slot { position: absolute; inset: 0; display: grid; place-items: center; background: #d3d3d9; }
.${P}-slot svg { display: block; width: 22px; height: 22px; fill: none; stroke: #b4b4bd; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-acts { flex: none; display: flex; gap: 10px; margin: 14px 16px 0; }
.${P}-var { flex: none; display: flex; align-items: center; justify-content: center; gap: 7px; box-sizing: border-box; width: 120px; height: 46px; border-radius: 14px; background: #e1d5f5; font-size: 14px; font-weight: 600; color: #6c2bd9; }
.${P}-var svg { width: 16px; height: 16px; fill: none; stroke: #6c2bd9; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-more { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; box-sizing: border-box; height: 46px; border-radius: 14px; background: #0a0a0c; font-size: 15px; font-weight: 600; color: #ffffff; }
.${P}-more b { font-size: 21px; font-weight: 300; line-height: 18px; }
.${P}-edit { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; height: 18px; font-size: 12.5px; font-weight: 500; }
.${P}-edit svg { width: 12px; height: 12px; fill: none; stroke: #111114; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-box { flex: none; box-sizing: border-box; margin: 10px 16px 0; height: 56px; padding: 9px 12px; border-radius: 12px; background: #ffffff; box-shadow: inset 0 0 0 1.5px #7a3bee; font-size: 12.5px; line-height: 18px; color: #2a2a30; overflow: hidden; }
.${P}-dim { position: absolute; inset: 0; background: rgba(8, 8, 10, .64); visibility: hidden; }
.${P}-mod { position: absolute; left: 50%; top: 214px; box-sizing: border-box; width: 272px; height: 84px; margin-left: -136px; padding: 19px 18px 0; border-radius: 16px; background: #ffffff; box-shadow: 0 8px 28px rgba(0, 0, 0, .28); text-align: center; visibility: hidden; }
.${P}-msg { height: 20px; font-size: 14.5px; font-weight: 600; line-height: 20px; white-space: nowrap; color: #111114; }
.${P}-trk { position: relative; margin-top: 15px; height: 4px; border-radius: 2px; background: #e6e6ea; overflow: hidden; }
.${P}-trk i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 2px; background: #6c2bd9; transform-origin: 0 50%; transform: scaleX(0); }
`;

const PROMPT = 'a friendly ghost holding a handwritten note, meme style, bright colours, 4k';
const MSGS = ['AI is analysing prompt..', 'Creating beautiful artwork..', 'Adding more details..', 'Adding clarity to images..', 'Almost there...'];
const MSG_AT = [0, 0.12, 0.38, 0.58, 0.74];       // the share of the bar's run at which each sentence takes over
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor taps 'Generate More'
const MOD_IN = 0.16, MOD_OUT = 1.0;               // the modal is up from here to here; the bar fills across the whole run
const LAND = Array.from({ length: 10 }, (_, i) => 1.1 + i * 0.0778);   // slot i takes its picture (reading order), the last at 1.8
const FADE = 0.05;                                // the picture is in over this long, ending on its landing

export default {
  id: 'imagine-ai',
  label: 'Imagine AI (2023)',
  source: {
    platform: "Imagine: AI Art Generator by Vyro AI for iPhone, the 'Result' screen and its generation modal (iPhone screen recordings on YouTube, 2023, light and dark themes)",
    feature: "the Result screen (back arrow, title, Save pill) with a centred white rounded modal over the dimmed screen: a bold sentence cycling 'AI is analysing prompt..' -> 'Creating beautiful artwork..' -> 'Adding more details..' -> 'Adding clarity to images..' -> 'Almost there...' above a thin determinate purple bar; then the modal clears and the pictures land (adapted to 10: ten portrait slots in a 5 x 2 block that take their pictures one after another in reading order once the modal has gone)",
    refs: [{ url: 'https://www.youtube.com/watch?v=ktKU6k9vczo', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=P3jJkWvkuwA', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-slot 5 x 2 result block (the app makes one image per generation)', 'the ten pictures landing one after another after the modal (the app shows its single image at once)', 'the stage timings, compressed from the footage (the longest phase there is "Almost there..." at about 7 s)', 'the prompt wording'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'imagine-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-slot"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.6 3.6 3.2 2.4-2 5 4.4"/></svg></div></div>`;
    const back = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3L5 9l6 6M5.5 9H16"/></svg>';
    const dl = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.5v6.2M3.2 5.2L6 8l2.8-2.8M2 10.2h8"/></svg>';
    const vr = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 7A5 5 0 004.2 4L3 5.4M3 2.6v2.8h2.8M3 9a5 5 0 008.8 3L13 10.6M13 13.4v-2.8h-2.8"/></svg>';
    const pen = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 10l.5-2.4L8.2 1.9l1.9 1.9-5.7 5.7zM7.2 2.9l1.9 1.9"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${back}Results<div class="${P}-save">Save${dl}</div></div><div class="${P}-stage"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-acts"><div class="${P}-var">${vr}Variate</div><div class="${P}-more"><b>+</b>Generate More</div></div><div class="${P}-edit">${pen}Edit Input</div><div class="${P}-box">${x.esc(PROMPT)}</div><div class="${P}-dim"></div><div class="${P}-mod"><div class="${P}-msg">${MSGS[0]}</div><div class="${P}-trk"><i></i></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const more = q('more'), dim = q('dim'), mod = q('mod'), msg = q('msg'), fill = q('trk').firstElementChild;
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), slot: n.querySelector(`.${P}-slot`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // 'Generate More' is tapped (its label never changes)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gen', gp.toFixed(3), () => { more.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the modal over the dimmed screen: the sentence and the determinate bar run on the same clock
        const up = s >= MOD_IN && s < MOD_OUT;
        put('mod', up, (v) => { dim.style.visibility = v ? 'visible' : 'hidden'; mod.style.visibility = v ? 'visible' : 'hidden'; });
        const p = clamp((s - MOD_IN) / (MOD_OUT - MOD_IN));
        let m = 0;
        MSG_AT.forEach((a, j) => { if (p >= a) m = j; });
        put('msg', m, (v) => { msg.textContent = MSGS[v]; });
        const w = (0.97 * Math.pow(p, 0.82)).toFixed(4);
        put('bar', w, (v) => { fill.style.transform = `scaleX(${v})`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.slot.style.display = 'none'; c.slot.style.opacity = ''; } else { c.slot.style.display = ''; c.slot.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
