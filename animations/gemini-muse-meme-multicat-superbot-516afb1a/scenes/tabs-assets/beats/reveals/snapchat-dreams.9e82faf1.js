// Snapchat Dreams, the 2023 AI portrait packs, on iOS (YouTube jfftjDv1_oo, 2023-10-25: generating panel t=244-253.5 s, finished
// viewer t=258-288 s; spec .tmp/clone-9e82faf1/reveal-refs/snapchat-dreams/spec.json, confidence 0.7; frames m_jfft_250 (generating),
// m_jfft_266 (viewer)). Picking a pack opens a full-screen purple panel, deep plum (#302948) at the edges with a violet glow (#733296)
// behind the centre, under a 'Dreams' title bar with a back chevron: a thin ring whose bright arc keeps travelling round a white
// four-point sparkle that pulses, the line 'Generating Dreams with AI...', 'You will receive a notification when your Dreams are
// ready.' and a purple 'Done' pill. The wait is a held screen (the app says 20-30 min; the recording sat on it ~9.5 s); there is no
// percentage or bar. The finished Dreams then open in a viewer: the 'Dreams' bar, a large rounded picture with the pack's name, page
// dots, and a white 'My Story' button beside a blue 'Send To' pill. The feature has since been folded into 'AI Snaps' in Memories.
// Adapted to ten images: the generating panel holds, then gives way to the pack viewer, where the ten pictures fill a 5 x 2 grid in
// strict sequence (the empty slots tinted until each one's turn) under the pack name, with the page dots and the two buttons.
// Omitted: the creator's face-cam badge, the Memories side tabs behind the panel and the Bitmoji on 'My Story'. The footage's pictures
// are never reproduced: every tile is our own meme; no Snapchat ghost, wordmark or platform font is drawn (a plain ring, a plain
// four-point star of our own, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-snp';
const ROOT_H = 424, HEAD_H = 46;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 14px; background: linear-gradient(180deg, #2a3150 0%, #302948 34%, #2d1a3d 72%, #290e2f 100%); color: #ffffff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { position: relative; display: flex; align-items: center; justify-content: center; height: ${HEAD_H}px; font-size: 15px; font-weight: 600; color: #ffffff; }
.${P}-hd svg { position: absolute; left: 16px; top: 15px; width: 14px; height: 16px; fill: none; stroke: #ffffff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-vw { box-sizing: border-box; display: flex; flex-direction: column; height: ${ROOT_H - HEAD_H}px; padding: 2px 14px 14px; }
.${P}-pk { flex: none; display: flex; align-items: baseline; justify-content: space-between; height: 24px; padding: 0 2px; font-size: 13px; font-weight: 600; color: #ffffff; }
.${P}-pk small { font-size: 10.5px; font-weight: 400; color: #b9aed2; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 10px; overflow: hidden; background: rgba(255, 255, 255, .07); }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; display: grid; place-items: center; background: #3a2b58; }
.${P}-c svg { display: block; width: 20px; height: 20px; fill: rgba(255, 255, 255, .22); }
.${P}-dots { flex: none; display: flex; justify-content: center; gap: 6px; height: 14px; margin-top: 10px; }
.${P}-dots i { display: block; width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, .32); }
.${P}-dots i.on { background: #ffffff; }
.${P}-ft { flex: none; display: flex; justify-content: center; gap: 12px; margin-top: auto; }
.${P}-ft span { display: grid; place-items: center; box-sizing: border-box; height: 40px; border-radius: 20px; font-size: 14.5px; font-weight: 600; }
.${P}-story { width: 110px; background: #ececf1; color: #16161d; }
.${P}-send { width: 114px; background: #0fadff; color: #ffffff; }
.${P}-ov { position: absolute; left: 0; right: 0; top: ${HEAD_H}px; bottom: 0; background: radial-gradient(ellipse 54% 42% at 50% 36%, rgba(115, 50, 150, .96) 0%, rgba(115, 50, 150, .5) 48%, rgba(115, 50, 150, 0) 100%), linear-gradient(180deg, #2a3150 0%, #302948 34%, #2d1a3d 72%, #290e2f 100%); }
.${P}-rg { position: absolute; left: 50%; top: 56px; width: 84px; height: 84px; margin-left: -42px; }
.${P}-trk { position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 5px rgba(202, 162, 196, .72); }
.${P}-arc { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, rgba(246, 238, 178, 0) 0deg, #f6eeb2 14deg, #f6eeb2 74deg, rgba(246, 238, 178, 0) 88deg, rgba(246, 238, 178, 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5.5px), #000 calc(100% - 5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 5.5px), #000 calc(100% - 5px)); }
.${P}-in { position: absolute; inset: 5px; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at 50% 40%, #8f3cb8, #7a2fa3 75%); }
.${P}-in svg { display: block; width: 46px; height: 46px; fill: #f6e9f4; }
.${P}-gn { position: absolute; left: 0; right: 0; top: 178px; text-align: center; font-size: 20px; font-weight: 500; color: #c6a3d6; }
.${P}-nt { position: absolute; left: 50%; top: 214px; width: 300px; margin-left: -150px; text-align: center; font-size: 14px; line-height: 21px; color: #f1ecf6; }
.${P}-dn { position: absolute; left: 50%; top: 270px; display: grid; place-items: center; width: 230px; height: 46px; margin-left: -115px; border-radius: 23px; background: linear-gradient(90deg, #8a3dbb, #7a30aa 70%, #45214f); font-size: 15px; font-weight: 600; color: #ffffff; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OV_OUT = 0.8;                               // the generating panel has held; it now gives way to the viewer over 0.1 s
const OV_FADE = 0.1;
const LAND = Array.from({ length: 10 }, (_, i) => 0.94 + i * 0.0956);   // tile i is filled (reading order), the last at 1.80
const FADE = 0.05;                                // an empty slot's tint thins away over this long before the picture lands
const SPARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 8c1.6 8.4 4.6 11.4 13 13-8.4 1.6-11.4 4.6-13 13-1.6-8.4-4.6-11.4-13-13 8.4-1.6 11.4-4.6 13-13z"/><path d="M36 22c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z"/><path d="M33 6c.5 2.8 1.5 3.8 4.3 4.3-2.8.5-3.8 1.5-4.3 4.3-.5-2.8-1.5-3.8-4.3-4.3 2.8-.5 3.8-1.5 4.3-4.3z"/></svg>';
const SLOT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8c1.8 9.6 5.4 13.2 15 15-9.6 1.8-13.2 5.4-15 15-1.8-9.6-5.4-13.2-15-15 9.6-1.8 13.2-5.4 15-15z"/></svg>';

export default {
  id: 'snapchat-dreams',
  label: 'Snapchat Dreams (2023)',
  source: {
    platform: 'Snapchat for iOS (dark theme), Dreams in Memories (a tutorial screen recording on YouTube, 2023-10-25; the feature has since been merged into AI Snaps)',
    feature: "full-screen purple panel (#302948 edges, #733296 glow) under a 'Dreams' bar: a ring whose bright arc travels round a pulsing white sparkle, 'Generating Dreams with AI...', 'You will receive a notification when your Dreams are ready.' and a purple 'Done' pill, held for the whole wait (no percentage or bar), then the finished Dreams viewer with the pack name, page dots and a My Story / Send To footer (adapted to 10: the generating panel holds, then the pack grid of ten fills in strict sequence; the feature later merged into AI Snaps, so the label carries its date; the face-cam badge and the Bitmoji are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=jfftjDv1_oo', retrieved: '2026-10-14' },
      { url: 'https://help.snapchat.com/hc/en-us/articles/18494402767252-What-are-AI-Snaps-in-Memories-and-how-do-they-work', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'snapchat-dreams');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c">${SLOT}</div></div>`;
    const back = '<svg viewBox="0 0 14 16" aria-hidden="true"><path d="M10 2 4 8l6 6"/></svg>';
    const dots = Array.from({ length: 10 }, (_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-hd">${back}Dreams</div><div class="${P}-vw"><div class="${P}-pk">Muse Pack<small>10 Dreams</small></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-dots">${dots}</div><div class="${P}-ft"><span class="${P}-story">My Story</span><span class="${P}-send">Send To</span></div></div><div class="${P}-ov"><div class="${P}-rg"><i class="${P}-trk"></i><i class="${P}-arc"></i><div class="${P}-in">${SPARK}</div></div><div class="${P}-gn">Generating Dreams with AI...</div><div class="${P}-nt">You will receive a notification when your Dreams are ready.</div><div class="${P}-dn">Done</div></div></div>`);
    const ov = root.querySelector(`.${P}-ov`), arc = root.querySelector(`.${P}-arc`), spark = root.querySelector(`.${P}-in svg`);
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

        // the arc travels round the ring and the sparkle pulses and turns slowly: functions of t alone, covered or not
        const deg = (((t * 300) % 360) + 360) % 360;
        put('arc', deg.toFixed(0), (d) => { arc.style.transform = `rotate(${d}deg)`; });
        const pulse = 1 + 0.09 * Math.sin(t * 5.2);
        put('sp', pulse.toFixed(3), () => { spark.style.transform = `scale(${pulse.toFixed(3)}) rotate(${(8 * Math.sin(t * 2.6)).toFixed(1)}deg)`; });

        // the generating panel gives way to the viewer
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
