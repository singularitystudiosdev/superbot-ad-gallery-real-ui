// Interior AI (interiorai.com), the 2022-10 build, in a desktop browser (YouTube VvvPAQb34WM 'AI Design Your Interior | Get
// inspirational Ideas', 2022-10-12, uncut screen recording, t=77.6-85 s; spec .tmp/clone-9e82faf1/reveal-refs/interior-ai/spec.json,
// confidence 0.55; frames at_interiorai_tiles_first_77.6.png, at_interiorai_status_12pct.png, at_interiorai_pct_sheet.png,
// at_interiorai_result_88.png). A near-black two-part page: a narrow left rail of selects (the upload box 'Your current interior', TYPE,
// MODE, a render count and a generate button) beside a result column titled 'Your future interior'. Each result tile first shows a
// dark placeholder with a small white open-ring spinner and one centred white line, 'NN% (You're #1 in line)', whose number climbs
// (2%, 4%, 12%, 29% ... 100%, about +4%/s). At 100% the tile is swapped for the finished room with a 'Tropical' badge and a
// DOWNLOAD control. There is no shimmer, no bar and no blur: a hard swap, tile by tile.
// Adapted to ten images: ten tiles (4 + 4 + 2) each counting 2 -> 100 from render(t) and landing in strict reading order, so the
// first tiles climb fastest; the spinner turns from t and every count and turn FREEZES at the last landing. Omitted: the logo, the
// 'Pro' style entries and the Public / remove-errors toggles, the account chip. The footage's rooms are never reproduced: every
// tile is our own meme, and no logo, wordmark or platform font is drawn (a plain ring, plain boxes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ina';
const ROOT_H = 312, LEFT_W = 132, COLS = 4, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #101110; color: #f1f3f1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262a27; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 4px; width: ${LEFT_W}px; padding: 12px 10px 12px 12px; background: #141614; border-right: 3px solid #2a2d2b; }
.${P}-lab { flex: none; font-size: 5.8px; font-weight: 700; letter-spacing: .08em; line-height: 8px; color: #8f978f; white-space: nowrap; }
.${P}-box { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; height: 52px; border-radius: 7px; background: #0e100e; box-shadow: inset 0 0 0 1px #3a3f3b; font-size: 6.5px; color: #c6ccc6; }
.${P}-box i { display: block; width: 36px; height: 20px; border-radius: 3px; background: linear-gradient(180deg, #2b312c 0 55%, #4a4234 55%); }
.${P}-sel { flex: none; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 19px; padding: 0 7px; border-radius: 6px; background: #181a18; box-shadow: inset 0 0 0 1px #343835; font-size: 6.8px; color: #eef1ee; white-space: nowrap; }
.${P}-sel svg { width: 6px; height: 6px; fill: none; stroke: #aab1aa; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 22px; border-radius: 6px; background: #e9efe6; font-size: 7.5px; font-weight: 700; color: #101410; }
.${P}-right { flex: 1; min-width: 0; box-sizing: border-box; padding: 11px 12px 0; }
.${P}-ttl { height: 14px; font-size: 9px; font-weight: 700; line-height: 14px; color: #f6f8f6; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 6px; overflow: hidden; background: #0f1210; }
.${P}-t img { position: absolute; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #0f1210; box-shadow: inset 0 0 0 1px #1d211e; }
.${P}-ring { display: block; box-sizing: border-box; width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid #ffffff; border-right-color: transparent; }
.${P}-pend b { max-width: 88%; text-align: center; font-size: 6.2px; font-weight: 700; line-height: 8px; color: #ffffff; }
.${P}-ov { position: absolute; inset: 0; z-index: 3; }
.${P}-dl { position: absolute; left: 4px; top: 4px; box-sizing: border-box; height: 10px; padding: 0 4px; border-radius: 5px; background: rgba(8, 10, 8, .7); box-shadow: inset 0 0 0 1px #ffffff; font-size: 4.6px; font-weight: 600; letter-spacing: .04em; line-height: 10px; color: #ffffff; }
.${P}-badge { position: absolute; right: 4px; bottom: 4px; padding: 1px 3px; border-radius: 3px; background: rgba(8, 10, 8, .72); font-size: 5px; line-height: 7px; color: #ffffff; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses the generate button
const ISSUE = 0.16;                               // the ten tiles open as placeholders, all at 2%
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.13);   // tile i is swapped for its picture (reading order), the last at 1.67
const LINE = " (You're #1 in line)";
const pctAt = (s, i) => Math.min(100, 2 + Math.floor(98 * Math.pow(seg(s, ISSUE, LAND[i]), 1.15) + 1e-9));   // 2 at the start, 100 at the tile's landing

export default {
  id: 'interior-ai',
  label: 'Interior AI (2022)',
  source: {
    platform: 'Interior AI (interiorai.com, the 2022-10 build) in a desktop browser (dark theme; an uncut screen recording on YouTube, 2022-10-12)',
    feature: "near-black page: a left rail (the upload box 'Your current interior', TYPE, MODE, a render count) beside a 'Your future interior' column whose tiles each show a small open-ring spinner and a centred line 'NN% (You're #1 in line)' counting up (2%, 4%, 12%, 29% ... 100%, ~+4%/s), then swap hard for the finished room with a 'Tropical' badge and DOWNLOAD (adapted to 10: a 4 + 4 + 2 block, every tile counting from t and landing in reading order, counts and spinner frozen at the last landing; the logo, plan-tier entries and account chrome are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=VvvPAQb34WM', retrieved: '2026-10-14' }],
    videos: [{ id: 'VvvPAQb34WM', published: '2022-10-12', window: 't=77.6-85 s (2% at 77.6, 12% at ~80.5, 29% at ~82, rooms by ~84)' }],
    extrapolated: [
      'ten tiles: the footage shows two result tiles; the 4 + 4 + 2 block and the strict reading-order landing are extrapolated',
      "each tile's count runs from 2% at the start to 100% at its own landing, so earlier tiles climb faster; the footage's single ~+4%/s slope is compressed to a fraction of a second",
      "the queue wording '(You're #1 in line)' is the only position seen; it never changes here either",
      "the upload box 'Your current interior' is read from the 2026 site (the 2022 build's rail copy at that spot was not legible), and the 'Create design' button is that site's label: the 2022 button's text was never on screen",
      "the tile badge reads 'Tropical' as in the footage; its '0s ago' suffix and the four other hover actions (VIEW, USE AS INPUT, MIX & MASK, SHARPEN) are left out",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'interior-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i><b>2%${x.esc(LINE)}</b></div><div class="${P}-ov" style="display: none"><span class="${P}-dl">DOWNLOAD</span><span class="${P}-badge">Tropical</span></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const sel = (v) => `<div class="${P}-sel">${v}${chev}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-left"><div class="${P}-lab">UPLOAD</div><div class="${P}-box"><i></i>Your current interior</div><div class="${P}-lab">TYPE</div>${sel('Living room')}<div class="${P}-lab">STYLE</div>${sel('Tropical')}<div class="${P}-lab">MODE</div>${sel('Inspiration')}<div class="${P}-lab">NUMBER OF RENDERS</div>${sel('10')}<div class="${P}-go">Create design</div></div><div class="${P}-right"><div class="${P}-ttl">Your future interior</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => {
      const im = n.querySelector('img');
      im.style.filter = restFilter(tiles[i]);
      return { im, pend: n.querySelector(`.${P}-pend`), txt: n.querySelector(`.${P}-pend b`), ring: n.querySelector(`.${P}-ring`), ov: n.querySelector(`.${P}-ov`) };
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
        const sc = Math.min(s, LAND[9]);               // every count and turn runs on the clamped clock: frozen at the last landing

        // the generate button is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the ten placeholders open
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => {
            c.im.style.visibility = v ? '' : 'hidden';
            c.pend.style.display = v ? 'none' : '';
            c.ov.style.display = v ? '' : 'none';
          });
          c.im.style.transform = restTransform(tiles[i]);
          // the tile's own count and the ring's phase: functions of the clamped clock alone
          put(`p${i}`, done ? -1 : pctAt(sc, i), (v) => { if (v >= 0) c.txt.textContent = `${v}%${LINE}`; });
          const deg = (((sc * 760 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
