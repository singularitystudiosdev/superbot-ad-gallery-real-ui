// Hostinger Website Builder, the editor's 'AI image generator' panel, as screen-recorded in 'How to Generate Images With Hostinger AI Image
// Generator' (YouTube 1FjFnVJisb0, published 2025-11-27, 360p, t~15.3-18.6 s; spec .tmp/clone-9e82faf1/reveal-refs/hostinger-ai-image/spec.json,
// confidence 0.70; frames ae_pending_bar22, ae_pending_bar40, ae_land_first, ae_land_both). A white rounded panel titled 'AI image generator'
// with a close cross. Pressing its purple 'Create images' button swaps the whole prompt form for the pending view: a pale chip 'Created images
// are saved in the media library', grey placeholder tiles (#edf0f2) each holding a thin dark ring spinner, a violet determinate bar on a
// lavender track (observed ~22 % at t=16.0, ~40 % at t=16.8) and the two-line caption 'We're excited to bring your vision to life! Please wait
// a few moments while we create your personalized image.' The first picture then hard-swaps its spinner for the finished image (t~17.2) and at
// that moment the bar and caption give way to a 'Rate images' row with thumbs, a purple 'Create again' button and a 'Back to form' button; the
// rest of the tiles keep spinning until their own pictures drop in (t~18.6), no blur, fade or shimmer.
// Adapted to ten images: the footage's pair of tiles becomes a 5 x 2 block of square tiles (the panel's own tile style), the pictures dropping in
// strictly one after another in reading order; the bar creeps from render(t) until the first picture lands. Omitted: the editor behind the panel
// (its toolbar, the 'Go live' button, the site), the prompt form and the Business-plan upsell that other captures of this flow run into. Every
// picture is our own meme; no Hostinger logo or wordmark is drawn, only system type and plain glyphs.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hai';
const ROOT_H = 430, COLS = 5, GAP = 6;
const VIOLET = '#5b2edd';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 18px 20px 0; border-radius: 12px; background: #fff; color: #1d1e20; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3e5e8, 0 6px 18px rgba(29, 30, 32, .08); }
.${P}-head { flex: none; display: flex; align-items: center; height: 24px; }
.${P}-head b { font-size: 13.5px; font-weight: 700; letter-spacing: -.1px; color: #1d1e20; }
.${P}-head svg { margin-left: auto; flex: none; width: 10px; height: 10px; fill: none; stroke: #1d1e20; stroke-width: 1.7; stroke-linecap: round; }
.${P}-chip { flex: none; display: grid; place-items: center; height: 20px; margin-top: 10px; border-radius: 6px; background: #eceff1; font-size: 8px; color: #6d7480; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 5px; overflow: hidden; background: #edf0f2; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #edf0f2; }
.${P}-pend svg { display: block; width: 22px; height: 22px; fill: none; stroke: #4a4f57; stroke-width: 1.7; stroke-linecap: round; }
.${P}-slot { position: relative; flex: none; height: 84px; margin-top: 8px; }
.${P}-wait, .${P}-done { position: absolute; left: 0; right: 0; top: 0; }
.${P}-trk { height: 6px; margin-top: 2px; border-radius: 3px; background: #ede7fb; overflow: hidden; }
.${P}-fill { height: 100%; width: 0; border-radius: 3px; background: ${VIOLET}; }
.${P}-cap { margin-top: 10px; text-align: center; font-size: 8px; line-height: 12px; color: #6d7480; }
.${P}-rate { display: flex; align-items: center; height: 22px; font-size: 8px; color: #8a9099; }
.${P}-rate span { display: flex; gap: 12px; margin-left: auto; }
.${P}-rate svg { display: block; width: 11px; height: 11px; fill: #3b3f46; }
.${P}-rate svg + svg { transform: rotate(180deg); }
.${P}-again { display: flex; align-items: center; justify-content: center; gap: 5px; box-sizing: border-box; height: 26px; margin-top: 4px; border-radius: 5px; background: ${VIOLET}; font-size: 8.5px; font-weight: 600; color: #fff; }
.${P}-again svg { flex: none; width: 9px; height: 9px; fill: currentColor; }
.${P}-back { display: grid; place-items: center; box-sizing: border-box; height: 24px; margin-top: 4px; border-radius: 5px; box-shadow: inset 0 0 0 1px #e3e5e8; font-size: 8.5px; font-weight: 600; color: ${VIOLET}; }
.${P}-note { flex: none; display: grid; place-items: center; height: 22px; font-size: 7.5px; color: #8a9099; }
.${P}-foot { flex: none; display: flex; align-items: center; gap: 5px; height: 26px; border-top: 1px solid #f0f1f3; font-size: 7.5px; color: #8a9099; }
.${P}-foot i { display: block; box-sizing: border-box; width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1.2px #8a9099; }
.${P}-foot u { text-decoration: none; color: ${VIOLET}; }
`;

const CROSS = '<svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>';
const SPARK = '<svg viewBox="0 0 16 16"><path d="M8 0.5c.5 3.9 3.6 7 7.5 7.5-3.9.5-7 3.6-7.5 7.5C7.5 11.6 4.4 8.5.5 8 4.4 7.5 7.5 4.4 8 .5z"/></svg>';
const RING = '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="10.5" stroke-dasharray="52 14"/></svg>';
const THUMB = '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.12);   // tile i takes its picture (reading order), the last at 1.70
const BAR0 = 0.04, BAR1 = 0.56;                   // the bar's width as the card opens and at the first picture (the footage: ~22 % -> ~40 % on its way)

export default {
  id: 'hostinger-ai-image',
  label: 'Hostinger AI Image Generator (2025)',
  source: {
    platform: "Hostinger Website Builder (builder.hostinger.com) editor, the 'AI image generator' panel (light theme; one uncut 360p desktop screen recording on YouTube, 2025-11-27)",
    feature: "white rounded panel: a pale 'Created images are saved in the media library' chip over grey placeholder tiles each carrying a thin dark ring spinner, a violet determinate progress bar and the caption 'We're excited to bring your vision to life! Please wait a few moments while we create your personalized image.'; the pictures hard-swap into the tiles one at a time, the bar giving way to 'Rate images', a purple 'Create again' button and 'Back to form' once the first lands (adapted to 10: a 5 x 2 block, strict one-by-one landing; the editor behind the panel, the prompt form and the plan upsell are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=1FjFnVJisb0', retrieved: '2026-10-14' }],
    extrapolated: "the footage shows two tiles, the left landing at t~17.2 and the right at t~18.6, with the bar at ~22 % (t=16.0) and ~40 % (t=16.8); here ten square tiles land at an even step, strictly one at a time, and the bar's rise (4 % -> 56 %) up to the first picture, the spinners' turning rate and the compressed timing are drawn from the beat's window, not measured",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'hostinger-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${RING}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-head"><b>AI image generator</b>${CROSS}</div><div class="${P}-chip">Created images are saved in the media library</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-slot"><div class="${P}-wait"><div class="${P}-trk"><div class="${P}-fill"></div></div><div class="${P}-cap">We're excited to bring your vision to life! Please wait a few moments while we create your personalized image.</div></div><div class="${P}-done" style="display: none"><div class="${P}-rate">Rate images<span>${THUMB}${THUMB}</span></div><div class="${P}-again">${SPARK}<span>Create again</span></div><div class="${P}-back">Back to form</div></div></div><div class="${P}-note">AI outputs may be misleading or inaccurate</div><div class="${P}-foot"><i></i><span><u>Rate this feature.</u> Help us improve.</span></div></div>`);
    const q = (s) => root.querySelector(s);
    const fill = q(`.${P}-fill`), wait = q(`.${P}-wait`), done = q(`.${P}-done`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-pend svg`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the bar creeps until the first picture lands, then the rating row and the buttons take its slot
        const pending = s < LAND[0];
        put('mode', pending, (v) => { wait.style.display = v ? '' : 'none'; done.style.display = v ? 'none' : ''; });
        const pct = pending ? BAR0 + (BAR1 - BAR0) * Math.max(0, s) / LAND[0] : BAR1;
        put('bar', (pct * 100).toFixed(1), (v) => { fill.style.width = `${v}%`; });

        // each pending tile's ring turns with the clock (a full turn every 0.8 layout seconds)
        const turn = Math.round((((s * 450) % 360) + 360) % 360 / 4) * 4;
        cells.forEach((c, i) => {
          const a = LAND[i];
          put(`i${i}`, s >= a, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (s < a) put(`r${i}`, turn, (v) => { c.ring.style.transform = `rotate(${v}deg)`; });
        });
      },
    };
  },
};
