// Remini (mobile app), the 'AI Photos' tab while a photo batch is being made, as screen-recorded on phones in 2023 (YouTube DNd2wcqCab4,
// Astrida Mascarenhas, 2023-07-14, Android; qmXT3fYicL0, TutorialsWithJames, 2023-10-17, iOS; spec .tmp/clone-9e82faf1/reveal-refs/remini/spec.json,
// confidence 0.60; frames x_remini_pending_est3min, x_remini_pending_qm_late, x_remini_ai_photos_pending, x_remini_result_landed). There are no
// placeholder tiles: the pending surface is the whole phone screen. A bold 'AI Photos' header with a gear, a rounded dark panel (#1f1e23)
// holding a small white promo card ('In the meantime, enhance your photos in just one tap!' + an 'Enhance' pill), a small pink open ring that
// turns, the bold white line 'We are working on your photos...', the grey 'Estimated time: N minutes' (3 / 4 / 6 minutes seen), the grey note
// "Don't worry! The first time takes longer, the next will take less than 1 minute!" and a white 'Notify Me When Ready' pill; the four-tab bar
// (Enhance / AI Photos / AI Avatars / AI Filters) sits below. The recordings then cut to the finished photos, which replace the screen in one frame.
// Adapted to ten results: after the pill's press the panel is replaced by the finished page, ten photo tiles in a 4 + 4 + 2 block landing one
// after another over a cover, with the round trash and download buttons the footage shows under a finished photo. The real wait is minutes
// and the footage cuts through it, so the estimate here counts 6 -> 5 -> 4 -> 3 -> 2 across the beat's window (the 6, 4 and 3 are read from
// the footage; 5 and 2 are extrapolated). Omitted: the 'Remini' wordmark and 'Generated with AI' watermark on a result, the PRO badge and every
// price or paywall, the status bar, the footage's own photos and its beach backdrop: every tile is our own meme, and no logo, wordmark or
// platform font is drawn (plain shapes, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rmn';
const ROOT_H = 520, PH_W = 350, PH_H = 504, COLS = 4, GAP = 6, ARC = 24;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; align-items: center; justify-content: center; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: radial-gradient(circle at 85% 12%, #3a2230 0%, #0c0b0e 45%), #0c0b0e; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #221f26; }
.${P}-ph { position: relative; flex: none; box-sizing: border-box; width: ${PH_W}px; height: ${PH_H}px; border-radius: 26px; background: #0b0a0d; box-shadow: 0 0 0 1px #2c2931, 0 0 36px rgba(245, 54, 107, .08); overflow: hidden; }
.${P}-hd { position: absolute; left: 16px; right: 16px; top: 16px; height: 24px; display: flex; align-items: center; justify-content: space-between; }
.${P}-hd b { font-size: 16px; font-weight: 700; color: #fff; }
.${P}-hd svg { width: 14px; height: 14px; fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pn { position: absolute; left: 8px; right: 8px; top: 50px; bottom: 54px; border-radius: 16px; background: #1f1e23; overflow: hidden; }
.${P}-pend, .${P}-done { position: absolute; inset: 0; }
.${P}-promo { position: absolute; left: 8px; right: 8px; top: 8px; height: 46px; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 0 8px; border-radius: 12px; background: #fff; color: #17151a; }
.${P}-promo i { flex: none; display: block; width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(150deg, #ffd24a, #ff8a5c); }
.${P}-promo span { flex: 1; font-size: 8px; line-height: 10.5px; }
.${P}-promo em { flex: none; font-style: normal; box-sizing: border-box; height: 22px; padding: 0 10px; border-radius: 11px; background: #17151a; font-size: 8px; line-height: 22px; font-weight: 600; color: #fff; }
.${P}-arc { position: absolute; left: 50%; top: 116px; width: ${ARC}px; height: ${ARC}px; margin-left: -${ARC / 2}px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(245, 54, 107, 0) 0deg, #f5366b 30deg, #f5366b 112deg, rgba(245, 54, 107, 0) 114deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.4px), #000 calc(100% - 2.9px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3.4px), #000 calc(100% - 2.9px)); }
.${P}-wk { position: absolute; left: 30px; right: 30px; top: 158px; text-align: center; font-size: 15px; line-height: 19px; font-weight: 700; color: #fff; }
.${P}-eta { position: absolute; left: 0; right: 0; top: 204px; text-align: center; font-size: 9.5px; line-height: 13px; color: #8a8a93; }
.${P}-dw { position: absolute; left: 28px; right: 28px; bottom: 62px; text-align: center; font-size: 8px; line-height: 11px; color: #70707a; }
.${P}-nt { position: absolute; left: 10px; right: 10px; bottom: 12px; box-sizing: border-box; height: 38px; border-radius: 19px; display: grid; place-items: center; background: #fff; font-size: 10.5px; font-weight: 700; color: #17151a; }
.${P}-dh { position: absolute; left: 14px; right: 14px; top: 12px; height: 22px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 600; color: #e9e8ee; }
.${P}-dh span { font-size: 8px; font-weight: 500; color: #8a8a93; }
.${P}-g { position: absolute; left: 14px; right: 14px; top: 44px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; background: #2a2930; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cover { position: absolute; inset: 0; background: #2a2930; }
.${P}-act { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; justify-content: center; gap: 16px; }
.${P}-act i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #fff; }
.${P}-act svg { width: 14px; height: 14px; fill: none; stroke: #17151a; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-act .tr svg { stroke: #f5366b; }
.${P}-nav { position: absolute; left: 0; right: 0; bottom: 0; height: 48px; display: flex; align-items: flex-start; justify-content: space-around; padding: 8px 6px 0; }
.${P}-nav span { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 7px; line-height: 9px; font-weight: 500; color: #8a8a93; white-space: nowrap; }
.${P}-nav span.on { color: #fff; }
.${P}-nav svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const NOTIFY_AT = 0.84;                            // the finger presses 'Notify Me When Ready'
const SWAP = 1.0;                                  // the pending screen is replaced by the finished page
const LAND = Array.from({ length: 10 }, (_, i) => 1.12 + i * 0.0715);   // tile i lands (reading order), the last at 1.76
const FADE = 0.05;                                 // a tile's cover thins away over this long before its photo lands
// the estimate along the beat: [layout seconds from which it holds, minutes]; 6, 4 and 3 are read from the footage, 5 and 2 are extrapolated
const ETA = [[0, 6], [0.3, 5], [0.5, 4], [0.68, 3], [0.88, 2]];
const eta = (s) => { let m = ETA[0][1]; for (const [a, v] of ETA) if (s >= a) m = v; return m; };
const GEAR = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>';
const TRASH = '<svg viewBox="0 0 16 16"><path d="M3 4.5h10M6.2 4.5V3h3.6v1.5M4.3 4.5l.6 8.5h6.2l.6-8.5"/></svg>';
const DOWN = '<svg viewBox="0 0 16 16"><path d="M8 2.5v8M4.8 7.6L8 10.8l3.2-3.2M3 13h10"/></svg>';
const WAND = '<svg viewBox="0 0 16 16"><path d="M3 13L10.5 5.5M9 4l3 3M12.5 1.5v2M11.5 2.5h2"/></svg>';
const PHOTOS = '<svg viewBox="0 0 16 16"><path d="M8 1.8l1.4 3.6 3.6 1.4-3.6 1.4L8 11.8 6.6 8.2 3 6.8l3.6-1.4zM12 11l.7 1.6 1.6.7-1.6.7L12 15.6l-.7-1.6-1.6-.7 1.6-.7z"/></svg>';
const FACE = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M5.8 9.4c.6.9 1.4 1.3 2.2 1.3s1.6-.4 2.2-1.3M6 6.4v.6M10 6.4v.6"/></svg>';
const FRAME = '<svg viewBox="0 0 16 16"><path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3"/><circle cx="8" cy="8" r="2"/></svg>';

export default {
  id: 'remini',
  label: 'Remini AI Photos (2023)',
  source: {
    platform: "Remini mobile app (iOS/Android), the 'AI Photos' tab (dark theme; two phone screen recordings on YouTube, 2023-07-14 and 2023-10-17)",
    feature: "a dark phone screen: 'AI Photos' with a gear, a small white 'Enhance' promo card, a small pink open arc turning over the bold 'We are working on your photos...', the grey 'Estimated time: N minutes', the 'first time takes longer' note and a white 'Notify Me When Ready' pill, then the finished photos replacing the screen in one frame (adapted to 10: a 4 + 4 + 2 block of photos landing one after another with the round trash and download buttons; the Remini wordmark, 'Generated with AI' watermark, PRO badge, prices and paywall are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=DNd2wcqCab4', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=qmXT3fYicL0', retrieved: '2026-10-14' },
    ],
    extrapolated: "the real wait is minutes and the footage cuts straight from the pending screen to the photos; here the estimate counts 6 -> 5 -> 4 -> 3 -> 2 minutes across the beat's window (6, 4 and 3 are read from the footage, 5 and 2 are interpolated) and ten photos land one after another after the swap",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'remini');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cover"></div></div>`;
    const tab = (on, ico, name) => `<span${on ? ' class="on"' : ''}>${ico}${name}</span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ph"><div class="${P}-hd"><b>AI Photos</b>${GEAR}</div><div class="${P}-pn"><div class="${P}-pend"><div class="${P}-promo"><i></i><span>In the meantime, <b>enhance</b> your photos in just <b>one tap!</b></span><em>Enhance</em></div><div class="${P}-arc"></div><div class="${P}-wk">We are working on your photos...</div><div class="${P}-eta">Estimated time: 6 minutes</div><div class="${P}-dw">Don't worry! The first time takes longer, the next will take less than 1 minute!</div><div class="${P}-nt">Notify Me When Ready</div></div><div class="${P}-done" style="visibility: hidden"><div class="${P}-dh">Your AI photos<span>${tiles.length} photos</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-act"><i class="tr">${TRASH}</i><i>${DOWN}</i></div></div></div><div class="${P}-nav">${tab(false, WAND, 'Enhance')}${tab(true, PHOTOS, 'AI Photos')}${tab(false, FACE, 'AI Avatars')}${tab(false, FRAME, 'AI Filters')}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const arc = q(`.${P}-arc`), etaEl = q(`.${P}-eta`), nt = q(`.${P}-nt`), pend = q(`.${P}-pend`), done = q(`.${P}-done`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-cover`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the pink arc turns with t alone (its own phase, covered or not)
        const deg = (((t * 430) % 360) + 360) % 360;
        put('arc', deg.toFixed(0), (d) => { arc.style.transform = `rotate(${d}deg)`; });
        // the estimate counts down in whole minutes
        const m = eta(s);
        put('eta', m, (v) => { etaEl.textContent = `Estimated time: ${v} minutes`; });
        const np = press(s, NOTIFY_AT, 0.05, 0.08, 0.14);
        put('nt', np.toFixed(3), () => { nt.style.transform = np > 0 ? `scale(${(1 - 0.04 * np).toFixed(4)})` : 'none'; });

        // the hard swap to the finished page
        put('swap', s >= SWAP, (v) => { pend.style.visibility = v ? 'hidden' : ''; done.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const fd = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, fd.toFixed(3), () => {
            if (fd >= 1) { c.cover.style.display = 'none'; c.cover.style.opacity = ''; } else { c.cover.style.display = ''; c.cover.style.opacity = fd > 0 ? (1 - fd).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
