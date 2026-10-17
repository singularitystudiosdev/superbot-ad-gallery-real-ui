// Slidesgo AI Presentation Maker (2026), the creating view on slidesgo.com after 'Generate presentation' (YouTube VXvqi-Eh9nQ 'How to Use
// Slidesgo AI Step by Step', channel 'AI with Vandhana', published 2026-01-29, uncut 1080p screen recording, t~148.5-165.5 s; the submit
// surface is corroborated by jdeXn8i_Pko, 2023-12-17; spec .tmp/clone-9e82faf1/reveal-refs/slidesgo-ai/spec.json, confidence 0.64; frames
// ap_slidesgo_01..22). A white creating panel: a three-dot step pill whose last dot is a wide violet bar, a status row with a small spinner
// glyph, a caption that cycles 'Generating outline...' (0-3 %), 'Generating slide content...' (4-7 %), 'Creating images...' (8-13 %) and a live
// PERCENTAGE right-aligned on the same row, a thin determinate pink-to-violet bar under it on a pale track, and below it skeleton slide
// cards: rounded white cards with a grey title bar and grey paragraph bars on the left and a flat grey image well on the right (static
// fills, no shimmer, no blur). In the footage the page then hands off to the outline editor ('Refine and customize your slide content for
// a compelling presentation.' and a second 'Generate presentation ->'), which is not drawn here.
// Adapted to ten images: ten skeleton cards in a 2 x 5 block whose image wells fill with the pictures one after another in strict reading
// order, the percentage and the bar carrying on past the footage's last reading (13 %) up to 100 % as the last picture lands, the spinner
// then giving way to a check mark and everything freezing. Extrapolated: the ten cards (the footage shows two of them above the fold), the
// pictures filling the wells (the footage's wells stay grey until the hand-off), the percentage continuing from 13 % to 100 %, the wait being
// compressed from ~17 s to under two seconds, and the final check glyph. Omitted: the '0/3 downloads' pill, the 'Get unlimited' button and
// the X, the browser tab strip, the screen-share bar and the Windows taskbar of the creator's recording (plan chrome and their environment),
// and the Slidesgo mark, which is not inside the creating panel. No logo is drawn; every picture is our own meme, the glyphs are plain CSS
// and the type is the system face.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sgo';
const ROOT_H = 470, COLS = 2, ROWS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #fafafb; color: #0a0a0a; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e4ea; }
.${P}-step { flex: none; display: flex; align-items: center; justify-content: center; gap: 5px; height: 26px; padding-top: 6px; }
.${P}-step i { display: block; width: 6px; height: 6px; border-radius: 3px; background: #dcdce2; }
.${P}-step i.${P}-cur { width: 26px; background: #9a45b7; }
.${P}-head { flex: none; box-sizing: border-box; padding: 6px 12px 0 12px; }
.${P}-row { display: flex; align-items: center; gap: 6px; height: 16px; }
.${P}-glyph { position: relative; flex: none; width: 11px; height: 11px; }
.${P}-spin { position: absolute; inset: 0; box-sizing: border-box; border-radius: 50%; border: 1.5px solid #cfcfd6; border-top-color: #6a6a74; }
.${P}-ok { position: absolute; inset: 0; box-sizing: border-box; border-radius: 50%; background: #9a45b7; }
.${P}-ok::after { content: ""; position: absolute; left: 3.6px; top: 1.9px; width: 2.2px; height: 4.6px; border-right: 1.4px solid #fff; border-bottom: 1.4px solid #fff; transform: rotate(40deg); }
.${P}-cap { flex: 1; min-width: 0; font-size: 10px; line-height: 16px; color: #4a4a52; white-space: nowrap; }
.${P}-pct { flex: none; font-size: 10px; font-weight: 600; line-height: 16px; color: #0a0a0a; font-variant-numeric: tabular-nums; }
.${P}-trk { height: 3px; margin-top: 3px; border-radius: 2px; background: #ededf2; overflow: hidden; }
.${P}-fil { height: 100%; width: 0; border-radius: 2px; background: linear-gradient(90deg, #fb3e8c, #c13bf0); }
.${P}-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); grid-template-rows: repeat(${ROWS}, minmax(0, 1fr)); gap: ${GAP}px; padding: 12px; }
.${P}-c { box-sizing: border-box; display: flex; align-items: stretch; gap: 8px; padding: 8px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px #ececf1, 0 1px 3px rgba(20, 20, 40, .06); overflow: hidden; }
.${P}-tx { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.${P}-tx i { display: block; height: 4px; border-radius: 2px; background: #e9e9ed; }
.${P}-tx i.${P}-ttl { width: 56%; height: 5px; margin-bottom: 2px; }
.${P}-w { position: relative; flex: none; width: 40%; border-radius: 5px; background: #e9e9ed; overflow: hidden; }
.${P}-w img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-wc { position: absolute; inset: 0; background: #e9e9ed; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const CAP2 = 0.3, CAP3 = 0.55;                    // the caption swaps to 'Generating slide content...' and then 'Creating images...'
const LAND = Array.from({ length: 10 }, (_, i) => 0.82 + i * 0.0956);   // well i fills with its picture (reading order), the last at 1.68
const END = LAND[9];                              // the counter reaches 100 % and everything freezes
const SPIN = 560;
const WIDTHS = [100, 100, 86, 70];
const IMG13 = 0.82;                               // the counter has read 8..13 (the footage's whole 'Creating images...' stage) by the time the first picture lands
// the percentage: 0-3 under the outline caption, 4-7 under the slide-content caption, 8-13 as in the footage, then on to 100 (the extrapolated tail) as the pictures land
const pctAt = (s) => (s >= END ? 100 : s < CAP2 ? Math.floor(4 * seg(s, 0, CAP2)) : s < CAP3 ? 4 + Math.floor(4 * seg(s, CAP2, CAP3)) : s < IMG13 ? 8 + Math.floor(6 * seg(s, CAP3, IMG13)) : 14 + Math.floor(86 * seg(s, IMG13, END)));

export default {
  id: 'slidesgo-ai',
  label: 'Slidesgo AI (2026)',
  source: {
    platform: "Slidesgo AI Presentation Maker, the in-page creating view on slidesgo.com (desktop Chrome, light theme; a continuous screen recording on YouTube, 2026-01-29)",
    feature: "white creating panel: a three-dot step pill, a status row with a spinner glyph whose caption cycles 'Generating outline...' (0-3 %), 'Generating slide content...' (4-7 %), 'Creating images...' (8-13 %) beside a live percentage, a determinate pink-to-violet bar on a pale track, and skeleton slide cards (grey title and paragraph bars plus a grey image well); adapted to 10: a 2 x 5 block of skeleton cards whose wells fill with the pictures in reading order while the percentage carries on to 100 %",
    refs: [
      { url: 'https://www.youtube.com/watch?v=VXvqi-Eh9nQ', videoId: 'VXvqi-Eh9nQ', published: '2026-01-29', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=jdeXn8i_Pko', videoId: 'jdeXn8i_Pko', published: '2023-12-17', retrieved: '2026-10-14' },
    ],
    videoIds: ['VXvqi-Eh9nQ', 'jdeXn8i_Pko'],
    dates: { published: '2026-01-29 (VXvqi-Eh9nQ), 2023-12-17 (jdeXn8i_Pko)', retrieved: '2026-10-14', capture: 't~148.5-165.5 s of a 454 s uncut screen recording' },
    extrapolated: [
      'ten skeleton cards in a 2 x 5 block (the footage shows two cards above the fold in a single column)',
      "the pictures filling the image wells in strict reading order (the footage's wells stay grey until the hand-off to the outline editor)",
      "the percentage continuing from the footage's last reading (13 %) to 100 % as the last picture lands (the counter there stops at 13 % at the hand-off)",
      'the length of the wait (about 17 s in the footage, compressed to the beat window)',
      'the check glyph that replaces the spinner once the counter reads 100 % (the footage hands off to a different page instead)',
      "the leading glyph's exact shape (a spinner or an asterisk, unresolved at ~20 px)",
    ],
    omitted: ["the '0/3 downloads' pill, the 'Get unlimited' button and the close X (plan chrome)", "the browser tab strip, the screen-share bar and the Windows taskbar (the creator's environment)", 'the outline editor the footage hands off to'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'slidesgo-ai');
    const bars = WIDTHS.map((w) => `<i style="width: ${w}%"></i>`).join('');
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-tx"><i class="${P}-ttl"></i>${bars}</div><div class="${P}-w"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-wc"></div></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-step"><i></i><i></i><i class="${P}-cur"></i></div><div class="${P}-head"><div class="${P}-row"><div class="${P}-glyph"><i class="${P}-spin"></i><i class="${P}-ok" style="display: none"></i></div><span class="${P}-cap">Generating outline...</span><span class="${P}-pct">0%</span></div><div class="${P}-trk"><div class="${P}-fil"></div></div></div><div class="${P}-grid">${tiles.map(cell).join('')}</div></div>`);
    const spin = root.querySelector(`.${P}-spin`), ok = root.querySelector(`.${P}-ok`), cap = root.querySelector(`.${P}-cap`), pct = root.querySelector(`.${P}-pct`), fil = root.querySelector(`.${P}-fil`);
    const cells = [...root.querySelectorAll(`.${P}-w`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-wc`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the caption and the live percentage, with the bar filling to it
        const p = pctAt(s);
        put('cap', s < CAP2 ? 0 : s < CAP3 ? 1 : 2, (v) => { cap.textContent = ['Generating outline...', 'Generating slide content...', 'Creating images...'][v]; });
        put('pct', p, (v) => { pct.textContent = `${v}%`; fil.style.width = `${v}%`; });

        // the glyph turns with t while the job runs and freezes (hidden, a check mark in its place) once the last picture has landed
        const running = s < END;
        put('run', running, (v) => { spin.style.display = v ? '' : 'none'; ok.style.display = v ? 'none' : ''; });
        const deg = running ? Math.round(((Math.max(s, 0) * SPIN) % 360 + 360) % 360) : 0;
        put('deg', deg, (d) => { spin.style.transform = `rotate(${d}deg)`; });

        // the image wells fill with the pictures one after another, in reading order
        cells.forEach((c, i) => {
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.cover.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
