// TikTok's in-app text-to-image 'AI Greenscreen' effect (2022, four iOS screen recordings from launch week; spec
// .tmp/clone-9e82faf1/reveal-refs/tiktok-ai-greenscreen/spec.json, confidence 0.75; frames aj_tt_create_btn.png, aj_tt_wait_bar_seq.png,
// aj_tt_wait_waltz_t28/t40/t55/t70.png, aj_tt_land_fade.png, aj_tt_landed_spaghetti.png). The effect's preview fills the camera screen
// with the white label 'Enter a few words', a dark translucent text field carrying the typed phrase, and a blue->violet 'Create' pill.
// Tapping Create swaps the pill, in the same place, for a slim fully-rounded DETERMINATE bar (a cyan #14B5E7 -> violet #8E76E9 fill on a
// #404040 track) that advances left to right, with the white caption 'Loading...' centred under it; the phrase stays on the screen as a
// plain white caption at the top. The bar goes, the still dissolves in over about two seconds as the full-frame background behind the
// live camera, and the field and 'Create' pill come back so another can be made. There is no percentage, ring, ETA or shimmer.
// Adapted to ten images: the phone's single full-frame background becomes a 5 x 2 block of ten portrait backgrounds, each landing as a
// short opacity cross-dissolve (a function of t, never a CSS transition) in reading order, all while the one bar fills; the bar reaches
// its end as the last background has dissolved in, and the field and pill return. The live camera preview is a plain dark stage (our
// own meme fills the tiles). Omitted: the TikTok logo, the username and the right-hand rail of icons with their counts.
import { press, seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-tgs';
const ROOT_H = 500, COLS = 5, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: linear-gradient(180deg, #1d2024, #121416); color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2b2e33; }
.${P}-cap { position: absolute; left: 14px; right: 14px; top: 16px; text-align: center; white-space: nowrap; font-size: 12px; line-height: 17px; font-weight: 600; letter-spacing: .1px; text-shadow: 0 1px 3px rgba(0, 0, 0, .6); }
.${P}-g { position: absolute; left: 16px; right: 16px; top: 48px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 8px; overflow: hidden; background: #24282c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #24282c; }
.${P}-ctl { position: absolute; left: 0; right: 0; top: 340px; height: 140px; }
.${P}-form, .${P}-wait { position: absolute; left: 0; right: 0; top: 0; height: 140px; display: flex; flex-direction: column; align-items: center; }
.${P}-lab { margin-top: 4px; font-size: 15px; line-height: 20px; font-weight: 500; text-shadow: 0 1px 3px rgba(0, 0, 0, .5); }
.${P}-field { box-sizing: border-box; width: 450px; max-width: 90%; height: 36px; margin-top: 8px; padding: 0 12px; border-radius: 4px; background: rgba(48, 50, 54, .86); font-size: 11.5px; line-height: 36px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; }
.${P}-pill { box-sizing: border-box; width: 104px; height: 34px; margin-top: 16px; border-radius: 17px; background: linear-gradient(90deg, #1fc8f2, #7d6df0); font-size: 13px; line-height: 34px; font-weight: 600; text-align: center; }
.${P}-wait { padding-top: 72px; box-sizing: border-box; }
.${P}-trk { position: relative; width: 264px; height: 10px; border-radius: 5px; background: #404040; overflow: hidden; }
.${P}-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 5px; background: linear-gradient(90deg, #14b5e7, #8e76e9); }
.${P}-load { margin-top: 12px; font-size: 12px; line-height: 16px; font-weight: 600; text-shadow: 0 1px 3px rgba(0, 0, 0, .5); }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TAP_AT = 0.08;                              // the finger taps 'Create'
const PEND = 0.16;                                // the pill is swapped for the bar; the phrase moves up as the caption
const DONE = 1.84;                                // the bar is full: the field and the pill return
const DISSOLVE = 0.13;                            // one background's cross-dissolve, in layout seconds
const START = Array.from({ length: 10 }, (_, i) => 0.44 + i * 0.14);   // background i begins to dissolve in (reading order), the last finishing at 1.84

export default {
  id: 'tiktok-ai-greenscreen',
  label: 'TikTok AI Greenscreen (2022)',
  source: {
    platform: "TikTok phone app (iOS), the in-app text-to-image 'AI Greenscreen' camera effect (four third-party screen recordings from launch week, 2022-08-14..18)",
    feature: "dark camera screen: the 'Enter a few words' field and blue->violet 'Create' pill give way, in place, to a slim determinate bar (cyan #14B5E7 -> violet #8E76E9 on a #404040 track) filling left to right with the white caption 'Loading...' beneath it (no percentage, ring or shimmer); the generated still then cross-dissolves in as the background and the field and pill return (adapted to 10: a 5 x 2 block of ten backgrounds, each a short opacity cross-dissolve in reading order; the TikTok logo, username and side-rail icons are omitted)",
    refs: [
      { url: 'https://www.tiktok.com/@waltzinthestreet/video/7132171812691021098', published: '2022-08-15', retrieved: '2026-10-14' },
      { url: 'https://www.tiktok.com/@aigreenscreens/video/7131910055640714542', published: '2022-08-15', retrieved: '2026-10-14' },
      { url: 'https://www.tiktok.com/@ai.greenscreeen/video/7133229385124973826', published: '2022-08-18', retrieved: '2026-10-14' },
      { url: 'https://www.tiktok.com/@utahmom613/video/7131748435979423019', published: '2022-08-14', retrieved: '2026-10-14' },
      { url: 'https://www.makeuseof.com/how-to-use-tiktok-ai-greenscreen-filter-text-to-image/', published: '2022-08-16', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten backgrounds: the effect makes one full-frame still per Create (the user taps again for more), so the ten sit in a 5 x 2 block of portrait tiles, dissolving in one after another in reading order',
      'the per-tile cross-dissolve is a function of t (~0.13 layout seconds each, the footage shows one ~1.5-2 s dissolve of a single still); the bar fills across the whole window and is full as the tenth has dissolved in, where the footage fills the bar first (~5 s) and dissolves afterwards',
      "the live camera preview is drawn as a plain dark stage (no person, no room); the empty tiles are flat #24282C boxes",
      'the 576 x 1024 portrait screen reflowed to the 560 px column: the caption sits over the block and the field, pill and bar sit under it',
      "the phrase stays in the field after the landing (the footage shows the field returning); the caption 'Loading...' and the 'Enter a few words' label are verbatim",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'tiktok-ai-greenscreen');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-cap" style="visibility: hidden">${x.esc(PROMPT)}</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-ctl"><div class="${P}-form"><div class="${P}-lab">Enter a few words</div><div class="${P}-field">${x.esc(PROMPT)}</div><div class="${P}-pill">Create</div></div><div class="${P}-wait" style="visibility: hidden"><div class="${P}-trk"><i class="${P}-fill"></i></div><div class="${P}-load">Loading...</div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const cap = q('cap'), form = q('form'), wait = q('wait'), pill = q('pill'), fill = q('fill');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // before: field + pill; while pending the pill's slot holds the bar and the phrase is the caption; once the last has landed the field and pill return
        const mode = s < PEND ? 0 : s < DONE ? 1 : 2;
        put('mode', mode, (m) => {
          form.style.visibility = m === 1 ? 'hidden' : '';
          wait.style.visibility = m === 1 ? '' : 'hidden';
          cap.style.visibility = m === 0 ? 'hidden' : '';
        });
        const gp = press(s, TAP_AT, 0.05, 0.04, 0.06);
        put('press', gp.toFixed(3), () => { pill.style.transform = gp > 0 ? `scale(${(1 - 0.07 * gp).toFixed(4)})` : 'none'; });

        // the determinate bar: its fill is a plain function of t, left to right
        const fp = (seg(s, PEND, DONE) * 100).toFixed(1);
        put('fill', fp, (v) => { fill.style.width = `${v}%`; });

        // each background cross-dissolves in over the empty tile, in reading order
        cells.forEach((c, i) => {
          const r = seg(s, START[i], START[i] + DISSOLVE);
          put(`i${i}`, r.toFixed(3), () => {
            c.im.style.visibility = r > 0 ? '' : 'hidden';
            c.pend.style.opacity = r > 0 && r < 1 ? (1 - r).toFixed(3) : '';
            c.pend.style.display = r >= 1 ? 'none' : '';
          });
        });
      },
    };
  },
};
