// Lensa Magic Avatars (Lensa AI for Android, Prisma Labs), the avatar-creation flow as screen-recorded in December 2022 (YouTube
// w71VcFg90So, RyeTech, 2022-12-10, t=128-168 s; corroborated by CP86b4DUHVI, 2022-12-09; spec .tmp/clone-9e82faf1/reveal-refs/lensa/spec.json,
// confidence 0.82; frames s_lensa_w71_creating_{20,17,8,5}min, s_lensa_w71_results_pack1_t147.png). There are no placeholder tiles: the
// pending surface is a whole black PHONE SCREEN, a back arrow and the bold title 'Creating Avatars...', a large circular ring (a dark
// track under a white arc that grows clockwise from 12 o'clock) holding a big remaining time ('20 min', white) over the grey 'Remaining
// time', the line "When it's finished, you'll get N images generated for you. Feel free to close the app." and two buttons at the
// foot (a white 'NOTIFY ME WHEN IT'S DONE', a dark 'HIDE THIS SCREEN'). The time counts down in whole minutes (20 -> 17 -> 8 -> 5 in the
// footage, with the phone's clock advancing 6:28 -> 6:41) and the screen is then replaced by the 'Pack #1' page: a header with
// 'SAVE ALL' and a grid of finished avatars under a style label, the last row ending in a single tile.
// Adapted to ten images: the finished page holds ten avatar tiles under one style label ('Stylish'), three to a row (the footage's
// grid was two to a row and scrolls; ten tiles must all be on screen), landing in reading order. The ~13 real minutes the footage
// compresses into ~12 s are compressed again into the beat's window (extrapolated); the sampled readings 20 / 17 / 8 / 5 min and the
// status-bar clock are interpolated between. The caption names ten images, not the footage's 50. Omitted: the upload screen, every
// price and paywall, the status-bar icons, the footage's glow behind the phone and its avatars: every tile is our own meme, and no logo,
// wordmark or platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ln';
const ROOT_H = 500, PH_W = 306, PH_H = 484, COLS = 3, GAP = 8, RING = 164, TRACK_W = 9;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; align-items: center; justify-content: center; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: radial-gradient(circle at 12% 30%, #2a2c30 0%, #0a0a0b 38%), radial-gradient(circle at 90% 8%, #26282c 0%, #0a0a0b 40%), #0a0a0b; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1f2023; }
.${P}-ph { position: relative; flex: none; box-sizing: border-box; width: ${PH_W}px; height: ${PH_H}px; border-radius: 22px; background: #000; box-shadow: 0 0 0 1px #2a2c30, 0 0 40px rgba(255, 255, 255, .06); overflow: hidden; }
.${P}-sb { position: absolute; left: 0; right: 0; top: 0; height: 20px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; background: #111315; font-size: 8px; font-weight: 500; color: #e8eaed; }
.${P}-sb i { display: block; width: 22px; height: 7px; border-radius: 2px; box-shadow: inset 0 0 0 1px #9aa0a6; }
.${P}-pg { position: absolute; left: 0; right: 0; top: 20px; bottom: 0; background: #000; }
.${P}-bk { position: absolute; left: 12px; top: 14px; width: 12px; height: 12px; }
.${P}-bk svg { display: block; width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ti { position: absolute; left: 0; right: 0; top: 36px; text-align: center; font-size: 17px; line-height: 22px; font-weight: 600; color: #fff; }
.${P}-ti span { display: inline-block; width: 15px; text-align: left; }
.${P}-ring { position: absolute; left: 50%; top: 82px; width: ${RING}px; height: ${RING}px; margin-left: -${RING / 2}px; border-radius: 50%; background: conic-gradient(from 0deg, #f2f4f5 0%, #f2f4f5 0%, #1b1d1f 0%, #1b1d1f 100%); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - ${TRACK_W + 0.6}px), #000 calc(100% - ${TRACK_W}px)); mask: radial-gradient(farthest-side, transparent calc(100% - ${TRACK_W + 0.6}px), #000 calc(100% - ${TRACK_W}px)); }
.${P}-rt { position: absolute; left: 50%; top: 82px; width: ${RING}px; height: ${RING}px; margin-left: -${RING / 2}px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.${P}-rt b { font-size: 21px; line-height: 24px; font-weight: 500; color: #fff; font-variant-numeric: tabular-nums; }
.${P}-rt span { font-size: 8.5px; line-height: 11px; color: #9aa0a6; }
.${P}-cp { position: absolute; left: 30px; right: 30px; top: 262px; text-align: center; font-size: 8.5px; line-height: 13px; color: #e8eaed; }
.${P}-b1, .${P}-b2 { position: absolute; left: 22px; right: 22px; box-sizing: border-box; height: 34px; border-radius: 4px; display: grid; place-items: center; font-size: 8.5px; font-weight: 600; letter-spacing: .2px; }
.${P}-b1 { bottom: 52px; background: #f4f8fa; color: #202124; }
.${P}-b2 { bottom: 12px; background: #1c1c1e; color: #e8eaed; }
.${P}-rs { position: absolute; left: 0; right: 0; top: 20px; bottom: 0; background: #000; }
.${P}-rh { position: absolute; left: 0; right: 0; top: 0; height: 40px; display: flex; align-items: center; padding: 0 14px 0 12px; background: #0d0e0f; }
.${P}-rh svg { flex: none; width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-rh b { margin-left: 14px; font-size: 11.5px; font-weight: 500; color: #fff; }
.${P}-rh span { margin-left: auto; font-size: 8px; font-weight: 500; color: #e8eaed; }
.${P}-lb { position: absolute; left: 14px; top: 52px; font-size: 11px; font-weight: 600; color: #fff; }
.${P}-g { position: absolute; left: 14px; right: 14px; top: 76px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: #131415; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #17181a; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SWAP = 1.1;                                  // the pending screen is replaced by the 'Pack #1' page
const LAND = Array.from({ length: 10 }, (_, i) => 1.16 + i * 0.075);   // tile i lands (reading order), the last at 1.835
const FADE = 0.05;                                 // an avatar slot's cover thins away over this long before its picture lands
// the footage's readings along the beat: [layout seconds, remaining minutes, phone clock in minutes past 6:00]
const KEYS = [[0, 20, 28], [0.3, 20, 28], [0.52, 17, 32], [0.84, 8, 38], [1.06, 5, 41]];
const TOTAL = 20;
const lerpKeys = (s, col) => {
  if (s <= KEYS[0][0]) return KEYS[0][col];
  for (let i = 1; i < KEYS.length; i++) {
    if (s <= KEYS[i][0]) { const a = KEYS[i - 1], b = KEYS[i]; return a[col] + (b[col] - a[col]) * ((s - a[0]) / (b[0] - a[0])); }
  }
  return KEYS[KEYS.length - 1][col];
};
const ARROW = '<svg viewBox="0 0 12 12"><path d="M10 6H2.5M5.5 2.5L2 6l3.5 3.5"/></svg>';
const clock = (m) => `6:${String(Math.round(m)).padStart(2, '0')}`;

export default {
  id: 'lensa',
  label: 'Lensa Magic Avatars (2022)',
  source: {
    platform: 'Lensa AI for Android (Prisma Labs), the Magic Avatars flow (dark theme; a direct Android screen recording on YouTube, 2022-12-10)',
    feature: "a black phone screen: a back arrow, the title 'Creating Avatars...', a white ring arc growing clockwise round a big countdown ('20 min' -> '17' -> '8' -> '5 min') over 'Remaining time', the line about getting the images, and two buttons (NOTIFY ME WHEN IT'S DONE / HIDE THIS SCREEN), then the 'Pack #1' page with SAVE ALL and a grid of finished avatars (adapted to 10: ten tiles landing in reading order, three to a row; the upload screen, every price and paywall are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=w71VcFg90So', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=CP86b4DUHVI', retrieved: '2026-10-14' },
    ],
    extrapolated: "the real wait is ~20 minutes and the footage itself compresses ~13 of them into ~12 s; here the readings 20 / 17 / 8 / 5 min (and the clock 6:28 -> 6:41) are interpolated across the beat's window",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'lensa');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ph"><div class="${P}-sb"><span class="${P}-clk">6:28</span><i></i></div><div class="${P}-pg"><div class="${P}-bk">${ARROW}</div><div class="${P}-ti">Creating Avatars<span class="${P}-el">...</span></div><div class="${P}-ring"></div><div class="${P}-rt"><b>20 min</b><span>Remaining time</span></div><div class="${P}-cp">When it's finished, you'll get ${tiles.length} images generated for you. Feel free to close the app.</div><div class="${P}-b1">NOTIFY ME WHEN IT'S DONE</div><div class="${P}-b2">HIDE THIS SCREEN</div></div><div class="${P}-rs" style="visibility: hidden"><div class="${P}-rh">${ARROW}<b>Pack #1</b><span>SAVE ALL</span></div><div class="${P}-lb">Stylish</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const clk = q(`.${P}-clk`), pg = q(`.${P}-pg`), rs = q(`.${P}-rs`), ring = q(`.${P}-ring`), el = q(`.${P}-el`), big = q(`.${P}-rt b`), b1 = q(`.${P}-b1`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the countdown, the ring arc and the phone clock all follow the footage's readings
        const rem = lerpKeys(s, 1);
        const shown = Math.round(rem);
        put('min', shown, (v) => { big.textContent = `${v} min`; });
        const f = Math.max(0.012, (TOTAL - rem) / TOTAL);   // a short dot at the start, the arc growing clockwise
        const pc = (f * 100).toFixed(1);
        put('arc', pc, (v) => { ring.style.background = `conic-gradient(from 0deg, #f2f4f5 0%, #f2f4f5 ${v}%, #1b1d1f ${v}%, #1b1d1f 100%)`; });
        put('clk', clock(lerpKeys(s, 2)), (v) => { clk.textContent = v; });
        // the title's ellipsis runs . .. ... from t
        const n = 1 + ((Math.floor(s * 6.5) % 3) + 3) % 3;
        put('el', n, (v) => { el.textContent = '.'.repeat(v); });
        const bp = press(s, 0.9, 0.05, 0.1, 0.14);
        put('b1', bp.toFixed(3), () => { b1.style.transform = bp > 0 ? `scale(${(1 - 0.03 * bp).toFixed(4)})` : 'none'; });

        // the hard swap to the finished page
        const on = s >= SWAP;
        put('swap', on, (v) => { pg.style.visibility = v ? 'hidden' : ''; rs.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const fd = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, fd.toFixed(3), () => {
            if (fd >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = fd > 0 ? (1 - fd).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
