// Motorola's Image Studio on an Edge 60 Neo (YouTube 3Bl-lBQKIfE, 2026-08-07, tap Generate ~89.7 s, PENDING 92.3-99.9 s, crossfade to the result
// ~100 s; corroborated by ifTQORTvuh8, a Razr Fold, 2026-08-22; spec .tmp/clone-9e82faf1/reveal-refs/motorola-image-studio/spec.json,
// confidence 0.80; frames wz2_moto_t92.2_pending_fadein.png, wz2_moto_t96.0_pending.png, wz2_moto_text_zoom_t96.png, wz2_moto_t100.0_morph.png,
// wz2_moto_t100.3_image_crossfade.png, wz2_moto_t101.2_landed.png, wz2_moto_sheet_10fps_t98.8-101.8.png). A periwinkle-lilac phone page. Tapping
// 'Generate image' replaces the whole composer screen by a 'Create an image' page: the title bar is a back arrow and the title in bold
// navy, and the page is a centred stack - a rounded square (about 57 % of the width) filled with a soft out-of-focus gradient (blue at
// the top left, a red-orange glow in the middle, violet and magenta below, a pink halo bleeding outside it) that morphs continuously and
// slowly, the bold navy status 'Getting started...' beneath it and the fixed two-line tip 'Pro tip: the more you describe colours, style
// and mood, the better the result.'. Nothing else moves: no dots, percentage or queue label. After about 8 s the title becomes
// 'Generated images', the square stretches to a portrait card while the gradient crossfades to the finished picture, and three round
// buttons (Copy / Share / Save), the prompt line and a full-width 'Redo' pill fade in.
// Adapted to ten images: the card is a five-by-two block of portrait cards that opens out of the pending square, every card carrying the
// same morphing gradient and crossfading to its picture in strict reading order; the buttons, the prompt line and 'Redo' fade in with
// the tenth. Omitted: the phone bezel, camera hole, status bar and gesture bar, the first-run notification dialog, the cloud
// permission dialog, the composer screen, the desk, hands and the third-party watermark. The footage's picture is never reproduced:
// every card is our own meme, and no logo or platform font is drawn (plain shapes, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mis';
const FONT = UI_FONT;
const ROOT_H = 504, COLS = 5, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #aeb0ee; color: #0b0f3f; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #9ea1e0; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 14px; height: 54px; padding: 0 22px; }
.${P}-top svg { flex: none; width: 18px; height: 18px; fill: none; stroke: #0b0f3f; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top b { font-size: 17px; font-weight: 700; color: #0b0f3f; white-space: nowrap; }
.${P}-top i { margin-left: auto; display: flex; flex-direction: column; gap: 3px; }
.${P}-top i s { display: block; width: 3.5px; height: 3.5px; border-radius: 50%; background: #0b0f3f; }
.${P}-pg { position: absolute; left: 0; right: 0; top: 54px; bottom: 0; }
.${P}-sq { position: absolute; left: 50%; top: 96px; width: 172px; height: 172px; margin-left: -86px; border-radius: 22px; box-shadow: 0 0 42px 8px rgba(255, 130, 170, .38); }
.${P}-sts { position: absolute; left: 0; right: 0; top: 296px; text-align: center; font-size: 21px; font-weight: 700; line-height: 28px; color: #0b0f3f; }
.${P}-tip { position: absolute; left: 90px; right: 90px; top: 346px; text-align: center; font-size: 12px; font-weight: 500; line-height: 17px; color: #0b0f3f; }
.${P}-res { position: absolute; left: 0; right: 0; top: 54px; bottom: 0; }
.${P}-g { position: absolute; left: 16px; right: 16px; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 11px; overflow: hidden; background: #6a4bd8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-grad { position: absolute; inset: 0; }
.${P}-acts { position: absolute; left: 0; right: 0; top: 290px; display: flex; justify-content: center; gap: 36px; }
.${P}-act { display: flex; flex-direction: column; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 500; color: #0b0f3f; }
.${P}-act span { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #2a52e0; }
.${P}-act:nth-child(2) span { background: #3f46dc; }
.${P}-act:nth-child(3) span { background: #5a3ad6; }
.${P}-act svg { width: 18px; height: 18px; fill: none; stroke: #ffffff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ask { position: absolute; left: 24px; right: 24px; top: 372px; display: flex; align-items: center; gap: 12px; font-size: 11.5px; font-weight: 500; color: #0b0f3f; white-space: nowrap; }
.${P}-ask::before { content: ""; flex: none; width: 3px; height: 16px; background: #0b0f3f; }
.${P}-redo { position: absolute; left: 16px; right: 16px; top: 404px; display: flex; align-items: center; justify-content: center; gap: 8px; box-sizing: border-box; height: 38px; border-radius: 19px; box-shadow: inset 0 0 0 1.3px #0b0f3f; font-size: 13px; font-weight: 700; color: #0b0f3f; }
.${P}-redo svg { width: 14px; height: 14px; fill: none; stroke: #0b0f3f; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

const ASK = '"futuristic city and a muse holding a meme sign"';
const TIP = 'Pro tip: the more you describe colours, style and mood, the better the result.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SHOW = 0.1;                                 // the 'Create an image' page fades in
const OPEN = 0.2;                                 // the pending square gives way to the ten portrait cards (title becomes 'Generated images')
const OPENED = 0.34;                              // ... the cards are all there, still holding the gradient
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // card i crossfades to its picture (reading order), the last at 1.68
const FADE = 0.16;                                // the gradient crossfades away over this long before the picture is fully there
const BACK = '<svg viewBox="0 0 18 18"><path d="M15 9H3.5M8.5 4 3.5 9l5 5"/></svg>';
const I_COPY = '<svg viewBox="0 0 18 18"><rect x="6" y="6" width="9" height="9" rx="1.6"/><path d="M12 3.5V3.2A1.2 1.2 0 0 0 10.8 2H4.2A1.2 1.2 0 0 0 3 3.2v6.6A1.2 1.2 0 0 0 4.2 11h.3"/></svg>';
const I_SHARE = '<svg viewBox="0 0 18 18"><circle cx="4.5" cy="9" r="1.9"/><circle cx="13.5" cy="4.2" r="1.9"/><circle cx="13.5" cy="13.8" r="1.9"/><path d="M6.2 8.1l5.6-3M6.2 9.9l5.6 3"/></svg>';
const I_SAVE = '<svg viewBox="0 0 18 18"><path d="M9 2.5v8M5.8 7.6 9 10.8l3.2-3.2M3 12v2.2A1.3 1.3 0 0 0 4.3 15.5h9.4A1.3 1.3 0 0 0 15 14.2V12"/></svg>';
const I_REDO = '<svg viewBox="0 0 14 14"><path d="M11.5 7A4.5 4.5 0 1 1 9.7 3.4M11.8 1.6v2.6H9.2"/></svg>';

// the soft gradient: three blobs drifting slowly on their own periods (a function of t alone, stepped at 24 per second)
const grad = (q) => {
  const w = q / 24;
  const p = (a, b, k, f) => `${(a + b * Math.sin(w * k + f)).toFixed(1)}%`;
  return `radial-gradient(circle at ${p(54, 12, 0.9, 0)} ${p(52, 10, 0.7, 1.3)}, #ff5a3c 0%, rgba(255, 90, 60, 0) 58%), radial-gradient(circle at ${p(26, 12, 0.6, 2.1)} ${p(78, 9, 0.8, 0.4)}, #b02fa8 0%, rgba(176, 47, 168, 0) 60%), radial-gradient(circle at ${p(24, 10, 0.5, 4)} ${p(14, 10, 0.75, 2.6)}, #2f5bff 0%, rgba(47, 91, 255, 0) 56%), radial-gradient(circle at ${p(70, 10, 0.65, 3.3)} ${p(92, 6, 0.55, 5)}, #3b4cf0 0%, rgba(59, 76, 240, 0) 52%), #7a2db0`;
};

export default {
  id: 'motorola-image-studio',
  label: 'Motorola Image Studio (2026)',
  source: {
    platform: "Motorola Image Studio (Android, Edge 60 Neo; a hands-on overhead-camera phone video on YouTube, 2026-08-07, with the Razr Fold of 2026-08-22 as corroboration)",
    feature: "periwinkle phone page 'Create an image': a centred rounded square with a slowly morphing blue / red-orange / violet gradient and a pink halo, the bold status 'Getting started...' and the fixed tip 'Pro tip: the more you describe colours, style and mood, the better the result.' (no dots, percentage or queue label); on completion the title becomes 'Generated images', the square opens into the portrait card, the gradient crossfades to the picture and Copy / Share / Save, the prompt line and 'Redo' fade in (adapted to 10: a five-by-two block of cards, each crossfading to its picture in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=3Bl-lBQKIfE', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=ifTQORTvuh8', retrieved: '2026-10-14' }],
    extrapolated: [
      "ten portrait cards in a five-by-two block (the footage lands one card)",
      "the square opening into the card block as a crossfade of the two layers (the footage stretches the one square into the portrait card)",
      "one card at a time crossfading to its picture in reading order, and the Copy / Share / Save row, the prompt line and 'Redo' fading in only with the tenth",
      "the prompt line's wording (our own muse sentence in the footage's quoted style) and the compressed wait (the footage waits about 7.6-8.3 s)",
      "the gradient's colour drift, estimated from the frames (blob positions and periods are ours)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'motorola-image-studio');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-grad"></div></div>`;
    const act = (ic, label) => `<div class="${P}-act"><span>${ic}</span>${label}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top">${BACK}<b class="${P}-ttl">Create an image</b><i class="${P}-more" style="visibility: hidden"><s></s><s></s><s></s></i></div><div class="${P}-pg" style="opacity: 0"><div class="${P}-sq"></div><div class="${P}-sts">Getting started...</div><div class="${P}-tip">${x.esc(TIP)}</div></div><div class="${P}-res" style="opacity: 0"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-acts" style="opacity: 0">${act(I_COPY, 'Copy')}${act(I_SHARE, 'Share')}${act(I_SAVE, 'Save')}</div><div class="${P}-ask" style="opacity: 0">${x.esc(ASK)}</div><div class="${P}-redo" style="opacity: 0">${I_REDO}Redo</div></div></div>`);
    const q = (sel) => root.querySelector(`.${P}-${sel}`);
    const ttl = q('ttl'), more = q('more'), pg = q('pg'), res = q('res'), acts = q('acts'), ask = q('ask'), redo = q('redo');
    const sq = q('sq');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-grad`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the title and the page: 'Create an image' fades in, the square opens into the ten cards at the 'Generated images' title
        const opened = s >= OPEN + 0.06;
        put('ttl', opened, (v) => { ttl.textContent = v ? 'Generated images' : 'Create an image'; more.style.visibility = v ? '' : 'hidden'; });
        const pgo = seg(s, 0, SHOW) * (1 - seg(s, OPEN, OPENED));
        put('pg', pgo.toFixed(3), () => { pg.style.opacity = pgo > 0 ? pgo.toFixed(3) : '0'; pg.style.visibility = pgo > 0 ? '' : 'hidden'; });
        const reso = seg(s, OPEN, OPENED);
        put('res', reso.toFixed(3), () => { res.style.opacity = reso > 0 ? reso.toFixed(3) : '0'; res.style.visibility = reso > 0 ? '' : 'hidden'; });

        // the gradient morphs with t on the square and on every card still holding it
        const gq = Math.floor(s * 24 * 3);
        put('grad', gq, (v) => {
          const gr = grad(v);
          sq.style.background = gr;
          cells.forEach((c) => { c.cover.style.background = gr; });
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cover.style.display = 'none'; c.cover.style.opacity = ''; } else { c.cover.style.display = ''; c.cover.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });

        // Copy / Share / Save, the prompt line and Redo fade in with the tenth picture
        const fin = seg(s, LAND[9] - FADE, LAND[9] + 0.06);
        put('fin', fin.toFixed(3), () => { const o = fin > 0 ? fin.toFixed(3) : '0'; acts.style.opacity = o; ask.style.opacity = o; redo.style.opacity = o; });
      },
    };
  },
};
