// Snapchat's AI Snaps text-to-image generator on Android, opened from the Camera's AI text bar (YouTube X2vjMbV48ZI, 2025-03-28,
// onboarding to result t=30-60 s, generating screen t=49-52 s, result t=56 s; spec .tmp/clone-9e82faf1/reveal-refs/snapchat-my-ai/
// spec.json, confidence 0.55; frames u_snapchat-my-ai_generating_t49, _generating_t52, _result_t56, _result-next_t60). This is the
// Camera's prompt-to-image surface, NOT the My AI chat and NOT the Memories 'Dreams' selfie packs (see snapchat-dreams). Sending a
// prompt opens a full-bleed purple screen, violet (#5b2c9e) at the top fading to deep plum (#2a1240): the line 'Generating your AI
// Snap...' at the top, a white four-point sparkle with a small one beside it that pulses over a lavender glow (#b79ce0) that
// breathes, a dark rounded prompt chip with a sparkle glyph and the prompt, and a plain 'Cancel' at the foot. The wait is a held
// screen (no ring, percentage, bar or queue label). The panel then hard-swaps for the finished image under an 'AI Snaps' header
// (back chevron left, a save glyph right): the picture full-bleed on black, the prompt chip over its foot and a full-width blue
// 'Next' pill.
// Adapted to ten images: the generating screen holds, then gives way to the results screen where ten portrait (9:16) pictures fill a
// 5 x 2 block in strict reading order under the 'AI Snaps' header, the prompt chip and the blue Next pill below them.
// Omitted: the Android status bar and navigation bar of the creator's phone, the yellow tutorial frame around it, the 'Welcome to AI
// Snaps' onboarding and the prompt-suggestion sheet. The footage's pictures are never reproduced: every tile is our own meme; no
// Snapchat ghost, wordmark or platform font is drawn (a plain four-point star of our own, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sai';
const ROOT_H = 520, HEAD_H = 44;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 16px; background: #0f0f12; color: #ffffff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { position: relative; display: flex; align-items: center; justify-content: center; height: ${HEAD_H}px; font-size: 14px; font-weight: 600; color: #ffffff; }
.${P}-hd svg { position: absolute; top: 14px; width: 16px; height: 16px; fill: none; stroke: #ffffff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd .${P}-bk { left: 16px; }
.${P}-hd .${P}-sv { right: 16px; }
.${P}-vw { box-sizing: border-box; display: flex; flex-direction: column; height: ${ROOT_H - HEAD_H}px; padding: 4px 14px 14px; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 9 / 16; border-radius: 9px; overflow: hidden; background: #1c1c22; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; background: #23232b; }
.${P}-chip { flex: none; display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 34px; margin-top: 10px; padding: 0 12px; border-radius: 10px; background: #1d1d24; font-size: 11px; color: #ececf2; white-space: nowrap; overflow: hidden; }
.${P}-chip svg { flex: none; width: 13px; height: 13px; fill: #ffffff; }
.${P}-chip span { overflow: hidden; text-overflow: ellipsis; }
.${P}-next { flex: none; display: grid; place-items: center; height: 40px; margin-top: auto; border-radius: 20px; background: #2f7bff; font-size: 14px; font-weight: 600; color: #ffffff; }
.${P}-ov { position: absolute; inset: 0; background: linear-gradient(180deg, #5b2c9e 0%, #3a1a6e 38%, #2c1650 70%, #200e38 100%); }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 24px; text-align: center; font-size: 14px; font-weight: 600; color: #ffffff; }
.${P}-gl { position: absolute; left: 50%; top: 196px; width: 300px; height: 300px; margin: -150px 0 0 -150px; border-radius: 50%; background: radial-gradient(circle, rgba(183, 156, 224, .95) 0%, rgba(150, 110, 210, .55) 30%, rgba(120, 80, 190, .18) 58%, rgba(120, 80, 190, 0) 72%); }
.${P}-sk { position: absolute; left: 50%; top: 196px; width: 84px; height: 84px; margin: -42px 0 0 -42px; }
.${P}-sk svg { display: block; width: 100%; height: 100%; fill: #ffffff; }
.${P}-cp { position: absolute; left: 50%; top: 396px; display: flex; align-items: center; gap: 9px; box-sizing: border-box; width: 420px; height: 40px; margin-left: -210px; padding: 0 14px; border-radius: 12px; background: rgba(34, 12, 56, .72); font-size: 11.5px; color: #f2eefa; white-space: nowrap; overflow: hidden; }
.${P}-cp svg { flex: none; width: 14px; height: 14px; fill: #ffffff; }
.${P}-cp span { overflow: hidden; text-overflow: ellipsis; }
.${P}-cn { position: absolute; left: 0; right: 0; top: 468px; text-align: center; font-size: 13px; font-weight: 500; color: #ffffff; }
`;

const PROMPT = 'A muse holding up a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OV_OUT = 0.8;                               // the generating screen has held; it now gives way to the results over 0.1 s
const OV_FADE = 0.1;
const LAND = Array.from({ length: 10 }, (_, i) => 0.94 + i * 0.0956);   // result i is filled (reading order), the last at 1.80
const FADE = 0.05;                                // an empty slot's tint thins away over this long before the picture lands
const STAR = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M21 5c1.7 11 5.5 14.9 16.5 16.5C26.5 23.2 22.7 27 21 38c-1.7-11-5.5-14.8-16.5-16.5C15.5 19.9 19.3 16 21 5z"/><path d="M37.5 4c.6 4 2 5.4 6 6-4 .6-5.4 2-6 6-.6-4-2-5.4-6-6 4-.6 5.4-2 6-6z"/></svg>';
const GLYPH = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M20 6c1.6 10.4 5.2 14 15.6 15.6C25.2 23.2 21.6 26.8 20 37.2c-1.6-10.4-5.2-14-15.6-15.6C14.8 20 18.4 16.4 20 6z"/><path d="M38 28c.7 4.7 2.3 6.3 7 7-4.7.7-6.3 2.3-7 7-.7-4.7-2.3-6.3-7-7 4.7-.7 6.3-2.3 7-7z"/></svg>';

export default {
  id: 'snapchat-ai-snaps',
  label: 'Snapchat AI Snaps (2025)',
  source: {
    platform: 'Snapchat Camera AI Snaps text-to-image generator on Android (dark theme; a tutorial screen recording on YouTube, 2025-03-28; not the My AI chat and not the Memories Dreams packs)',
    feature: "full-bleed purple 'Generating your AI Snap...' screen (a four-point sparkle pulsing over a breathing lavender glow, a dark prompt chip, 'Cancel'; no ring, percentage or queue label) held for the wait, then the finished result under an 'AI Snaps' header with the prompt chip and a blue 'Next' pill (adapted to 10: the generating screen holds, then ten portrait results fill a 5 x 2 block in strict reading order; the status and navigation bars of the phone and the onboarding sheet are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=X2vjMbV48ZI', retrieved: '2026-10-14' }],
    extrapolated: ['ten portrait results in a 5 x 2 block filling in strict reading order (the footage lands one full-screen picture)', 'the cross-fade from the generating screen to the results (the footage hard-swaps)', 'the prompt chip sitting under the block (the footage overlays it on the picture)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'snapchat-ai-snaps');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"></div></div>`;
    const back = `<svg class="${P}-bk" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5 5 8l5.5 5.5"/></svg>`;
    const save = `<svg class="${P}-sv" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.6 6.8 8 10.2l3.4-3.4M3 13.5h10"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${back}AI Snaps${save}</div><div class="${P}-vw"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-chip">${GLYPH}<span>${x.esc(PROMPT)}</span></div><div class="${P}-next">Next</div></div><div class="${P}-ov"><div class="${P}-ttl">Generating your AI Snap...</div><div class="${P}-gl"></div><div class="${P}-sk">${STAR}</div><div class="${P}-cp">${GLYPH}<span>${x.esc(PROMPT)}</span></div><div class="${P}-cn">Cancel</div></div></div>`);
    const ov = root.querySelector(`.${P}-ov`), glow = root.querySelector(`.${P}-gl`), spark = root.querySelector(`.${P}-sk svg`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the sparkle pulses and the glow breathes: functions of t alone, covered or not
        const pulse = 1 + 0.14 * Math.sin(t * 4.4);
        put('sp', pulse.toFixed(3), () => { spark.style.transform = `scale(${pulse.toFixed(3)})`; });
        const breathe = 1 + 0.1 * Math.sin(t * 2.2 - 0.6);
        put('gl', breathe.toFixed(3), () => { glow.style.transform = `scale(${breathe.toFixed(3)})`; glow.style.opacity = (0.82 + 0.18 * Math.sin(t * 2.2 - 0.6)).toFixed(3); });

        // the generating screen gives way to the results
        const o = seg(s, OV_OUT, OV_OUT + OV_FADE);
        put('ov', o.toFixed(3), () => {
          if (o >= 1) { ov.style.display = 'none'; ov.style.opacity = ''; } else { ov.style.display = ''; ov.style.opacity = o > 0 ? (1 - o).toFixed(3) : ''; }
        });

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
