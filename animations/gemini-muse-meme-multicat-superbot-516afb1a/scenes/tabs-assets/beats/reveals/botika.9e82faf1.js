// Botika's on-model generator, app.botika.io (YouTube dtCygTT1D9U, Shopioso 'AI Fashion Models for Your E-Commerce Brand with Botika AI |
// Review & Demo', published 2025-04-05, real-time screen recording, t~234.5-238.5 s; spec .tmp/clone-9e82faf1/reveal-refs/botika/spec.json,
// confidence 0.65; frames as_botika_creating_t235, as_botika_creating_t238, as_botika_result_t240). Pressing Generate does not fill a
// canvas in place: the whole app is REPLACED by a blank white page. Nothing on it but a slim light-grey rounded strip (~250 x 6 px,
// centred a little above the middle) and, under it, the plain dark-grey line 'Creating project...'; no percentage, no timer, no
// illustration, no logo. After about four seconds the page is swapped for the project view (a slim header with the project title, a close
// mark and a 'Download All' button, a row with 'Create Video' and 'Download Photo', and the generated on-model photos).
// Adapted to ten images: the takeover holds for the first part of the beat with the strip filling from t, then swaps to the project view,
// whose ten photo slots (3:4, five by two) start as blank pale tiles and take their AI-model photos in strict reading order.
// EXTRAPOLATED, not footage: the footage never shows the strip fill (it is not visibly moving at 2 fps over ~4 s), so the fill from t is our
// reading of an indeterminate strip; the project view holds ONE large photo and one thumbnail, so the ten-slot grid, the blank slots, the
// ten staggered landings (0.1067 s apart in layout time, the last at 1.68) and the swap time are ours. The strip stops at the swap, so the
// block is frozen once all ten are in. Omitted: the plan and credit chrome, the Botika logo and wordmark, the 'Created with' watermark on
// the footage photo, the browser window and the presenter's webcam inset; no platform font is drawn (system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-btk';
const ROOT_H = 372, COLS = 5, GAP = 10;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #fff; color: #1d1d1f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6e6e8; }
.${P}-take { position: absolute; inset: 0; background: #fff; }
.${P}-strip { position: absolute; left: 155px; top: 150px; width: 250px; height: 6px; border-radius: 3px; background: #ececec; overflow: hidden; }
.${P}-strip i { display: block; height: 100%; width: 0; border-radius: 3px; background: #cfcfcf; }
.${P}-say { position: absolute; left: 0; right: 0; top: 178px; text-align: center; font-size: 13px; font-weight: 500; color: #3b3b3b; }
.${P}-view { position: absolute; inset: 0; background: #fff; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 0; height: 40px; border-bottom: 1px solid #efefef; }
.${P}-name { position: absolute; left: 0; right: 0; top: 0; line-height: 40px; text-align: center; font-size: 12px; font-weight: 500; color: #2b2b2d; }
.${P}-all { position: absolute; right: 44px; top: 8px; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 24px; padding: 0 10px; border-radius: 6px; box-shadow: inset 0 0 0 1px #d9d9dc; font-size: 8.5px; font-weight: 500; color: #222; white-space: nowrap; }
.${P}-x { position: absolute; right: 16px; top: 13px; width: 14px; height: 14px; }
.${P}-x:before, .${P}-x:after { content: ""; position: absolute; left: 6px; top: 0; width: 1.6px; height: 14px; border-radius: 1px; background: #222; transform: rotate(45deg); }
.${P}-x:after { transform: rotate(-45deg); }
.${P}-sub { position: absolute; left: 24px; right: 24px; top: 50px; height: 20px; display: flex; align-items: center; gap: 18px; font-size: 8.5px; font-weight: 500; color: #222; }
.${P}-sub b { flex: 1; font-weight: 400; color: #3b3b3d; white-space: nowrap; }
.${P}-sub span { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.${P}-g { position: absolute; left: 24px; right: 24px; top: 82px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #f3f3f4; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #f3f3f4; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SWAP = 0.62;                                 // the blank takeover gives way to the project view
const LAND = Array.from({ length: 10 }, (_, i) => 0.72 + i * 0.1067);   // photo i lands (strict reading order), the last at 1.68

export default {
  id: 'botika',
  label: 'Botika AI fashion models (2025)',
  source: {
    platform: "Botika on-model generator, app.botika.io (desktop browser, light theme; a review and demo screen recording on YouTube, published 2025-04-05)",
    feature: "a full-page blank white takeover with only a slim light-grey rounded strip and 'Creating project...' (no percentage, no timer, no logo) that swaps to the project view where the AI-model photos appear (adapted to 10: the strip fills from t, then ten pale 3:4 slots in two rows of five take their photos in strict reading order; plan and credit chrome and the logo are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=dtCygTT1D9U', retrieved: '2026-10-14' }],
    dates: { published: '2025-04-05', retrieved: '2026-10-14', clip: 't~234.5-238.5 s' },
    extrapolated: [
      'the strip filling from t (the footage strip is not visibly moving)',
      'ten photo slots in two rows of five with blank pale slots before landing (the footage project view shows one large photo and one thumbnail)',
      'strict reading-order landing of ten photos, 0.1067 s apart',
      'the takeover-to-project swap time within the beat',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'botika');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const dl = '<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#222" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1.5v6.5M3.2 5.4 6 8.2l2.8-2.8M2 10.5h8"/></svg>';
    const vid = '<svg width="10" height="9" viewBox="0 0 14 12" fill="none" stroke="#222" stroke-width="1.3" stroke-linejoin="round"><rect x="1" y="2.5" width="8" height="7" rx="1.5"/><path d="M9 5.2 13 3.4v5.2L9 6.8z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-view"><div class="${P}-hd"><div class="${P}-name">Muse memes</div><div class="${P}-all">Download All ${dl}</div><i class="${P}-x"></i></div><div class="${P}-sub"><b>On-model photos</b><span>Create Video ${vid}</span><span>Download Photo ${dl}</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-take"><div class="${P}-strip"><i></i></div><div class="${P}-say">Creating project…</div></div></div>`);
    const take = root.querySelector(`.${P}-take`), fill = root.querySelector(`.${P}-strip i`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate(cells.map((c) => c.im));
    tiles.forEach((g, i) => { cells[i].im.style.filter = restFilter(g); cells[i].im.style.transform = restTransform(g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the blank page's strip fills from t and stops at the swap; the page itself is gone from the swap on
        const f = seg(s, 0, SWAP);
        put('fill', f.toFixed(3), () => { fill.style.width = `${(f * 100).toFixed(1)}%`; });
        put('take', s >= SWAP, (v) => { take.style.display = v ? 'none' : ''; });

        // the photos land in strict reading order in the project view
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
