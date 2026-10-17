// ReimagineHome (reimaginehome.ai web app) in a desktop browser (YouTube 3ZLnUrBxESU 'REimagine Home, a free A.I tool to generate
// creative interior designs from images', 2023-03-13, 640x318 screen recording, t~91.8-104 s; spec
// .tmp/clone-9e82faf1/reveal-refs/reimagine-home/spec.json, confidence 0.58; frames at_reimagine_2pct_92.0.png,
// at_reimagine_45pct_98.0.png, at_reimagine_generating_sheet.png). A white single-column workspace: a back chevron and the headline
// 'REimagine your space in seconds', then ONE bare status line, 'Generating ideas NN%', centred above a small 'Example' label and
// the grey ghost frames, and a 'Used inputs:' row of chips under them. The percentage is the only moving thing: it climbs from 2% to
// 100% at about +5%/s (a timer, not bytes), with no spinner, bar or queue label; then the finished rooms replace the ghosts and the
// line is gone.
// Adapted to ten images: the line counts 2 -> 100 over the first part of the beat (the number is a function of render(t)), then ten
// ideas replace their ghost frames one after another in reading order (5 x 2); the counter is gone once the last has landed.
// Omitted: the 'Generated using REimagineHome' badges the finished tiles carry, the wordmark and its tagline, the account chip with
// the person's name, the credits banner and the other header links. The footage's rooms are never reproduced: every idea is our own
// meme, and no logo, wordmark or platform font is drawn (plain boxes, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rmh';
const ROOT_H = 288, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 14px 18px 12px; border-radius: 12px; background: #ffffff; color: #111827; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 7px; height: 20px; }
.${P}-top svg { flex: none; width: 9px; height: 9px; fill: none; stroke: #111827; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top b { flex: 1; font-size: 11.5px; font-weight: 700; letter-spacing: -.01em; color: #111827; white-space: nowrap; }
.${P}-top span { flex: none; font-size: 6.5px; color: #374151; }
.${P}-top i { flex: none; width: 14px; height: 14px; border-radius: 50%; background: #e5e7eb; box-shadow: inset 0 0 0 1px #d1d5db; }
.${P}-pct { flex: none; margin-top: 12px; height: 11px; text-align: center; font-size: 7.5px; line-height: 11px; color: #4b5563; white-space: nowrap; }
.${P}-ex { flex: none; margin-top: 7px; height: 9px; text-align: center; font-size: 6.5px; line-height: 9px; color: #8a8a8a; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 5px; }
.${P}-t { position: relative; aspect-ratio: 6 / 5; border-radius: 6px; overflow: hidden; background: #dedede; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-t img { position: absolute; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, #e4e4e4, #d8d8d8); }
.${P}-in { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: auto; height: 12px; font-size: 6.5px; color: #6b7280; }
.${P}-in span { box-sizing: border-box; height: 12px; padding: 0 6px; border-radius: 6px; background: #f3f4f6; line-height: 12px; color: #6b7280; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.16;                               // the line 'Generating ideas 2%' appears over the ten ghost frames
const FULL = 0.9;                                 // the counter reads 100%
const LAND = Array.from({ length: 10 }, (_, i) => 0.96 + i * 0.08);   // idea i replaces its ghost (reading order), the last at 1.68
const pctAt = (s) => Math.min(100, 2 + Math.floor(98 * seg(s, ISSUE, FULL) + 1e-9));   // 2 at the start, +1 steps, 100 at FULL
const HEAD = 'REimagine your space in seconds';

export default {
  id: 'reimagine-home',
  label: 'ReimagineHome (2023)',
  source: {
    platform: 'ReimagineHome (reimaginehome.ai) in a desktop browser (light theme; a 640x318 screen recording on YouTube, 2023-03-13)',
    feature: "white single-column workspace: a headline 'REimagine your space in seconds', one bare line 'Generating ideas NN%' that counts from 2% to 100% (about +5%/s, no spinner, bar or queue label) above an 'Example' label and grey ghost frames, then the finished rooms replace the ghosts (adapted to 10: the counter, then ten ideas landing in reading order in a 5 x 2 block; the 'Generated using REimagineHome' badges, wordmark and account chrome are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=3ZLnUrBxESU', retrieved: '2026-10-14' }],
    videos: [{ id: '3ZLnUrBxESU', published: '2023-03-13', window: 't=91.8-104 s (2% to 67% swept; ~+5%/s)' }],
    extrapolated: [
      'ten ideas: the footage generates ONE design per run; the ten ghost frames, the 5 x 2 block and their strict reading-order landing are extrapolated',
      'the counter is compressed from ~20 s to under a second of the beat (2 -> 100 in +1 steps); its rate in the footage is ~+5%/s, the pace here is not',
      'the ideas land AFTER the counter reads 100% (the footage cuts straight to the finished room, so any step between 100% and the picture is unobserved)',
      "the progress bar the footage draws under the line is left out (the line itself is the affordance); the 'Used inputs:' chips (Bedroom, Farmhouse, Greenery) are read from a 640x318 frame",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'reimagine-home');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const back = '<svg viewBox="0 0 12 12"><path d="M7.5 2L3.5 6l4 4"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top">${back}<b>${x.esc(HEAD)}</b><span>History</span><i></i></div><div class="${P}-pct" style="visibility: hidden"></div><div class="${P}-ex" style="visibility: hidden">Example</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-in">Used inputs:<span>Bedroom</span><span>Farmhouse</span><span>Greenery</span></div></div>`);
    const pct = root.querySelector(`.${P}-pct`), ex = root.querySelector(`.${P}-ex`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => {
      const im = n.querySelector('img');
      im.style.filter = restFilter(tiles[i]);
      return { im, pend: n.querySelector(`.${P}-pend`) };
    });
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the live counter, from t alone: it reads 2% when the line appears, climbs to 100%, and is gone once the last idea has landed
        const live = s >= ISSUE && s < LAND[9];
        const n = pctAt(s);
        put('pct', live ? n : -1, (v) => {
          pct.style.visibility = v < 0 ? 'hidden' : '';
          pct.textContent = v < 0 ? '' : `Generating ideas ${v}%`;
        });
        put('ex', live, (v) => { ex.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => {
            c.im.style.visibility = v ? '' : 'hidden';
            c.pend.style.display = v ? 'none' : '';
          });
          c.im.style.transform = restTransform(tiles[i]);
        });
      },
    };
  },
};
