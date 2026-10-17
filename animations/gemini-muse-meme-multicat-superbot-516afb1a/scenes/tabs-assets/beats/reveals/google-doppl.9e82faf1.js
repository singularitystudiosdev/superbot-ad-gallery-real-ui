// Google Doppl, the Google Labs AI try-on app, 2025 build (AI Academy tutorial 'How to Try On Any Clothes with Google Doppl', YouTube
// g9ICLvwyGgk, 2025-09-10, t~101-116 s for the wait and t~121 s for the landing; spec .tmp/clone-9e82faf1/reveal-refs/google-doppl/spec.json,
// confidence 0.78; frames as_doppl_pending_t101/t108/t116, as_doppl_result_t121). A phone app on a warm off-white page (#ECE8E2): a
// 'YOUR LOOKS' title top-left and a small round badge with a multicolour progress ring top-right. While a try-on generates the whole feed is
// replaced by one centred stack, held for ~17 s: a small tilted polaroid of the source photo, the serif-italic headline 'Getting your look
// ready…' in Doppl red, the grey line 'This will take about 30 seconds' and a solid black pill 'Try another look'. A hairline red bar creeps
// along the bottom edge of the app above a three-icon nav (a grid, a white '+' pill, a person). There is no percentage and no timer.
// Adapted to ten images: the app is drawn at 560 px as one fixed column. The ring turns and the red bar creeps from render(t) while the
// overlay is up; when the overlay thins away the feed beneath, 'YOUR LOOKS', shows ten pale pending cards in a five-wide, two-high grid,
// and the looks land in strict reading order. The ring and the bar belong to the wait: they go with the overlay, so nothing keeps moving
// once the tenth look has landed. Omitted: every Google mark, the status bar and the footage's real photographs (our own meme stands in for
// the source photo, the tiles are our own too); no platform typeface is drawn (system sans and the system serif).
import { seg, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dpl';
const SERIF = "Georgia, 'Times New Roman', 'Noto Serif', serif";
const ROOT_H = 460, HD_H = 52, NAV_H = 58, COLS = 5, GAP = 8;
const RED = '#c23b2b';
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #ece8e2; color: #1a1618; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #ddd7cd; }
.${P}-hd { position: absolute; left: 0; right: 0; top: 0; height: ${HD_H}px; }
.${P}-ttl { position: absolute; left: 20px; top: 18px; font-size: 13px; line-height: 16px; font-weight: 500; letter-spacing: .05em; color: #1a1618; }
.${P}-bdg { position: absolute; right: 18px; top: 9px; width: 34px; height: 34px; }
.${P}-ring { position: absolute; inset: 0; display: block; border-radius: 50%; background: conic-gradient(from 0deg, rgba(242, 142, 43, 0) 0deg, #f28e2b 40deg, #e8481f 110deg, #34a853 200deg, #1fb8b0 270deg, #4a8cf0 320deg, rgba(74, 140, 240, 0) 345deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.4px)); }
.${P}-core { position: absolute; left: 5px; top: 5px; right: 5px; bottom: 5px; border-radius: 50%; background: #e8481f; }
.${P}-feed { position: absolute; left: 0; right: 0; top: ${HD_H}px; bottom: ${NAV_H + 1}px; }
.${P}-g { position: absolute; left: 20px; right: 20px; top: 40px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; background: #e1dcd3; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #e1dcd3; }
.${P}-cv i { position: absolute; left: 50%; top: 50%; width: 30%; height: 44%; margin: -22% 0 0 -15%; border-radius: 40% 40% 12% 12%; background: #d8d2c8; }
.${P}-ov { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ece8e2; }
.${P}-pol { position: relative; flex: none; box-sizing: border-box; width: 120px; height: 138px; padding: 8px 8px 0; background: #f8f6f2; box-shadow: 0 1px 0 #e0dad0, 0 4px 10px rgba(60, 50, 40, .12); transform: rotate(-4deg); }
.${P}-pol img { display: block; width: 104px; height: 104px; object-fit: cover; object-position: 50% 30%; }
.${P}-hl { flex: none; margin-top: 24px; font-family: ${SERIF}; font-style: italic; font-size: 29px; line-height: 31px; text-align: center; color: ${RED}; white-space: nowrap; }
.${P}-sub { flex: none; margin-top: 12px; font-size: 14px; line-height: 18px; color: #4a4a4a; white-space: nowrap; }
.${P}-btn { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 150px; height: 38px; margin-top: 24px; border-radius: 19px; background: #070408; font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; }
.${P}-bar { position: absolute; left: 0; right: 0; bottom: ${NAV_H}px; height: 2px; background: rgba(194, 59, 43, .14); }
.${P}-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: ${RED}; transform-origin: 0 50%; }
.${P}-nav { position: absolute; left: 0; right: 0; bottom: 0; height: ${NAV_H}px; display: flex; align-items: center; justify-content: space-around; background: #ece8e2; }
.${P}-nav svg { display: block; width: 20px; height: 20px; fill: #2a2628; }
.${P}-nav b { display: grid; place-items: center; width: 62px; height: 38px; border-radius: 13px; background: #fff; font-size: 24px; line-height: 24px; font-weight: 300; color: ${RED}; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OV_FADE = 0.44, OV_END = 0.52;               // the wait overlay thins away over this stretch, then is gone for good
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.1178);   // look i lands (reading order), the last at 1.68
const FADE = 0.06;                                 // a pending card hands over to its picture over this long

export default {
  id: 'google-doppl',
  label: 'Google Doppl try-on (2025)',
  source: {
    platform: "Google Doppl, the Google Labs AI try-on app (iOS, light theme, 2025 build; AI Academy tutorial screen recording 'How to Try On Any Clothes with Google Doppl', YouTube g9ICLvwyGgk, 2025-09-10)",
    feature: "a warm off-white phone app: 'YOUR LOOKS' with a multicolour progress-ring badge top-right; while a try-on generates the feed is replaced by one centred stack (a tilted polaroid of the source photo, the serif-italic red headline 'Getting your look ready…', 'This will take about 30 seconds', a black pill 'Try another look') with a hairline red bar creeping along the bottom above the nav; no percentage, no timer (adapted to 10: the overlay gives way to a five-wide, two-high grid of pale pending cards in the feed and the looks land in strict reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=g9ICLvwyGgk', retrieved: '2026-10-14' },
    ],
    extrapolated: "The footage holds the wait overlay for ~17 s (t~101-116 s, OCR-identical frames) and at t~121 s the overlay is simply replaced by ONE finished try-on image filling the screen; it never shows a landing in progress, a grid of looks or pending cards. The ten pale pending cards in the 'YOUR LOOKS' feed, their landing one by one in reading order and the overlay thinning away before they do are all extrapolated, as is the compression of the ~17 s wait into the beat's window (the ring and the red bar run from t across it). The ring badge's orange core has no digit here (the footage's badge carries a small count that is not part of the wait). The nav icons are plain shapes of our own.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-doppl');
    const srcPol = ownSrc(ctx.src, 'google-doppl-src');   // the source photo at 104 x 104, a different decode size from the 98 x 130 tiles
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cv"><i></i></div></div>`;
    const grid = '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/></svg>';
    const person = '<svg viewBox="0 0 24 24"><circle cx="12" cy="4.6" r="2.3"/><path d="M5 8.6h14v2.2h-5.4v3.1l2.6 6.4h-2.4L12 15.9l-1.8 4.4H7.8l2.6-6.4v-3.1H5z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><b class="${P}-ttl">YOUR LOOKS</b><div class="${P}-bdg"><i class="${P}-ring"></i><i class="${P}-core"></i></div></div><div class="${P}-feed"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-ov"><div class="${P}-pol"><img src="${srcPol}" width="870" height="1024" decoding="sync" alt="Source photo"/></div><div class="${P}-hl">Getting your<br/>look ready…</div><div class="${P}-sub">This will take about 30 seconds</div><div class="${P}-btn">Try another look</div></div></div><div class="${P}-bar"><i></i></div><div class="${P}-nav">${grid}<b>+</b>${person}</div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const ov = q('ov'), bdg = q('bdg'), ring = q('ring'), bar = q('bar'), barFill = bar.querySelector('i');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i] }));
    ctx.gate([q('pol').querySelector('img'), ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the wait overlay: held, then thinning away; the ring and the red bar run with it and go with it (a function of t, clamped at the overlay's end)
        const o = seg(s, OV_FADE, OV_END);
        put('ov', o.toFixed(3), () => { ov.style.display = o >= 1 ? 'none' : ''; ov.style.opacity = o > 0 ? (1 - o).toFixed(3) : ''; });
        const waiting = o < 1;
        put('wait', waiting, (v) => { bdg.style.visibility = v ? '' : 'hidden'; bar.style.visibility = v ? '' : 'hidden'; });
        const tw = Math.min(t, ctx.cardIn + OV_END * k);   // time stops with the wait
        const deg = (((tw * 380) % 360) + 360) % 360;
        put('ring', deg.toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });
        const bw = clamp((s + 0.04) / (OV_END + 0.04));
        put('bar', bw.toFixed(3), (v) => { barFill.style.transform = `scaleX(${v})`; });

        // the looks land one by one in reading order
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
