// OPPO AI Studio, the built-in AI portrait generator on ColorOS 14/15 (an OPPO Reno 12F screen recording, YouTube 0gDbA0XBUR4,
// published 2024-08-28; spec .tmp/clone-9e82faf1/reveal-refs/oppo-ai-studio/spec.json, confidence 0.6; frames
// ad_oppo_pending_t21.5.png, ad_oppo_pending_t22.5.png, ad_oppo_landing_t26.3.png, ad_oppo_pending2_t43.5.png). A phone page, full
// bleed, in deep aubergine fading to black. After 'Generate' on a style template the whole screen is one waiting card: a back arrow
// and the template name ('Mecha boy' / 'Pollock style'), a centred bold 'Generating...' over the grey line 'Estimated to take 19 s',
// one dimmed rounded preview of the supplied photo with a green dotted speckle sweeping across it, the queue note 'The image will be
// generated in the background when it reaches the front of the queue. You will be notified when it is ready.' and a 'More templates'
// pill low on the screen. There is no spinner, no percentage, no bar, no tile grid and no blur ramp. When the job is done the whole
// screen is swapped for 'Generated results', a gallery of finished portraits (the source shows a 2x3 grid of six).
// Adapted to ten images: the gallery is a 5 x 2 block of rounded portrait tiles in the same style, each with a small heart, landing
// one at a time in reading order. The recording is a time-compressed edit (the estimate reads 19 s on screen for ~4.5 s of footage),
// so the estimate here steps 19 -> 18 -> 17 -> 16 across the compressed wait (the range the footage reads) instead of being held. Omitted: the status bar, the screen
// recorder pill, the system navigation bar and the points cost on the template cards. The footage's pictures are never reproduced:
// every picture is our own meme, and no logo, wordmark or platform font is drawn (system type, plain shapes).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-opo';
const ROOT_H = 460, COLS = 5, GAP = 9;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; overflow: hidden; background: radial-gradient(120% 70% at 92% 4%, #2b1450 0%, rgba(43, 20, 80, 0) 62%), linear-gradient(180deg, #170d2b 0%, #0d0719 52%, #040208 100%); color: #f2f0f7; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-scr { position: absolute; inset: 0; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 18px; height: 52px; padding: 0 22px; }
.${P}-hd svg { flex: none; width: 20px; height: 20px; fill: none; stroke: #f2f0f7; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd b { font-size: 15px; font-weight: 500; letter-spacing: .1px; color: #f2f0f7; white-space: nowrap; }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 62px; text-align: center; font-size: 31px; line-height: 38px; font-weight: 700; letter-spacing: -.2px; color: #f4f0fb; }
.${P}-est { position: absolute; left: 0; right: 0; top: 104px; text-align: center; font-size: 12.5px; line-height: 18px; color: #b9b3cb; }
.${P}-pv { position: absolute; left: 50%; top: 140px; width: 122px; height: 162px; margin-left: -61px; border-radius: 14px; overflow: hidden; background: #2a2140; box-shadow: 0 0 0 1px rgba(255, 255, 255, .06); }
.${P}-pv img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; filter: brightness(.58) saturate(.8) blur(.7px); }
.${P}-spk { position: absolute; top: 0; bottom: 0; left: 0; width: 200%; background: radial-gradient(circle at 50% 50%, rgba(235, 255, 240, .95) 0 .8px, rgba(235, 255, 240, 0) 1.4px) 0 0 / 9px 9px, linear-gradient(90deg, rgba(30, 140, 70, .5), rgba(30, 140, 70, .5)); -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 27%, #000 53%, transparent 78%); mask-image: linear-gradient(90deg, transparent 0%, #000 27%, #000 53%, transparent 78%); }
.${P}-note { position: absolute; left: 50%; top: 316px; width: 270px; margin-left: -135px; text-align: center; font-size: 12.5px; line-height: 18px; color: #a39dae; }
.${P}-pill { position: absolute; left: 50%; bottom: 26px; width: 140px; height: 36px; margin-left: -70px; display: grid; place-items: center; box-sizing: border-box; border-radius: 18px; background: #2a2433; font-size: 13.5px; font-weight: 500; color: #f4f2f8; white-space: nowrap; }
.${P}-grid { position: absolute; left: 20px; right: 20px; top: 76px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 12px; overflow: hidden; background: #2a2140; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #2a2140; }
.${P}-fav { position: absolute; right: 5px; bottom: 5px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: rgba(16, 9, 30, .55); }
.${P}-fav svg { width: 11px; height: 11px; fill: none; stroke: #f4f0fb; stroke-width: 1.7; stroke-linejoin: round; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SWAP = 0.8;                                 // the waiting screen is replaced by 'Generated results'
const LAND = Array.from({ length: 10 }, (_, i) => 0.96 + i * 0.0978);   // tile i lands (reading order), the last at 1.84
const FADE = 0.05;                                // the placeholder thins away over this long before the picture is in
const EST0 = 19;                                  // 'Estimated to take 19 s' at the start of the wait; the footage reads 19, 18, 16 s
const BACK = '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5C5 15.4 3 12.4 3 9.2 3 6.6 5 4.8 7.4 4.8c1.8 0 3.4 1 4.6 2.8 1.2-1.8 2.8-2.8 4.6-2.8C19 4.8 21 6.6 21 9.2c0 3.2-2 6.2-9 11.3z"/></svg>';

export default {
  id: 'oppo-ai-studio',
  label: 'OPPO AI Studio (2024)',
  source: {
    platform: 'OPPO AI Studio, the built-in AI portrait generator on ColorOS (an OPPO Reno 12F screen recording, YouTube 0gDbA0XBUR4, 2024-08-28)',
    feature: "full-screen deep-aubergine waiting card: back arrow + template name, bold 'Generating...' over the grey line 'Estimated to take N s', a dimmed rounded preview of the photo with a green dotted speckle, the queue note 'The image will be generated in the background when it reaches the front of the queue. You will be notified when it is ready.' and a 'More templates' pill (no spinner, percentage, bar or tile grid), then a hard swap to a 'Generated results' gallery of rounded portrait tiles (the source shows 2x3 of six; adapted to 10: a 5 x 2 block landing one at a time in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=0gDbA0XBUR4', retrieved: '2026-10-14' }],
    extrapolated: "The footage is a time-compressed edit (the estimate reads 19 s for ~4.5 s of screen time), so 'Estimated to take N s' is stepped here 19 -> 18 -> 17 -> 16 (one step per quarter of the compressed wait, the range the footage reads: 19 s, 16 s, and 18 s on the second beat); the source does not show the exact ticking. The ten-tile 5 x 2 gallery, its one-at-a-time landing in reading order and the small heart on each tile are extrapolated from the six-tile 2x3 results screen; the second beat (Pollock style) is not drawn separately.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'oppo-ai-studio');
    const pvSrc = ownSrc(ctx.src, 'oppo-ai-studio-preview');   // the preview is the same picture at another size: its own URL
    const g0 = tiles[0];
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"></div><span class="${P}-fav">${HEART}</span></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-scr ${P}-wait"><div class="${P}-hd">${BACK}<b>Mecha boy</b></div><div class="${P}-ttl">Generating...</div><div class="${P}-est">Estimated to take ${EST0} s</div><div class="${P}-pv"><img src="${pvSrc}" width="870" height="1024" decoding="sync" alt="Preview" style="transform-origin: ${g0.origin}"/><i class="${P}-spk"></i></div><div class="${P}-note">The image will be generated in the background when it reaches the front of the queue. You will be notified when it is ready.</div><div class="${P}-pill">More templates</div></div><div class="${P}-scr ${P}-res" style="visibility: hidden"><div class="${P}-hd">${BACK}<b>Generated results</b></div><div class="${P}-grid">${tiles.map(cell).join('')}</div></div></div>`);
    const wait = root.querySelector(`.${P}-wait`), res = root.querySelector(`.${P}-res`);
    const est = root.querySelector(`.${P}-est`), spk = root.querySelector(`.${P}-spk`), pvImg = root.querySelector(`.${P}-pv img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate([pvImg, ...cells.map((c) => c.im)]);
    pvImg.style.transform = restTransform(g0);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the waiting screen, then the hard swap to the results screen
        const done = s >= SWAP;
        put('scr', done, (v) => { wait.style.visibility = v ? 'hidden' : ''; res.style.visibility = v ? '' : 'hidden'; });

        // the estimate steps 19 -> 18 -> 17 -> 16, one step per quarter of the wait (the range the footage shows)
        const n = EST0 - Math.min(3, Math.max(0, Math.floor((s / SWAP) * 4)));
        put('est', n, (v) => { est.textContent = `Estimated to take ${v} s`; });

        // the green dotted speckle sweeps back and forth over the preview (a function of t alone)
        const ph = (t * 0.45) % 2, tri = ph < 1 ? ph : 2 - ph;
        put('spk', tri.toFixed(3), () => { spk.style.transform = `translateX(${(tri * 100 - 80).toFixed(1)}%)`; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; } else { c.cv.style.display = ''; c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
