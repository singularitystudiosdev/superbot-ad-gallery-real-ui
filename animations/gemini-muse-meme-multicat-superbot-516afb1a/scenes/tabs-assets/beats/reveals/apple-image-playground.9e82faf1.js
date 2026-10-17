// Apple's Image Playground create surface on iPhone (iOS 18.2, dark appearance; spec .tmp/clone-9e82faf1/reveal-refs/apple-image-playground/
// spec.json, confidence 0.58, frames in that folder: sheet.png, reveal-b1.png, chips-b2.png, official-a1.png). The surface is wordless while it
// works: a near-black screen, a grey 'Cancel' pill top-left and a yellow 'Done' pill top-right (dim while generating, bright once the image is
// in), and in the preview area ONE round glow orb (no text, percentage, timer, spinner or shimmer: a soft bloom whose hue drifts through
// magenta, blue, gold and cream and which pulses) with small concept chips layered around it. The finished image does not wipe or sharpen: it
// cross-dissolves in at the orb's centre inside the same round frame while the halo fades, and the frame settles to a rounded-square tile with
// a faint iridescent rim, the chips still around it. Below it the composer stays up: 'SUGGESTIONS' with 'SHOW MORE' over a strip of circular
// captioned chips, the 'Describe an image' pill with a round photo button and a round '+', and the 'BETA' disclaimer.
// Adapted to ten images: the preview area holds ten orbs in a 5 x 2 block, one per image, each dissolving into its image in reading order on
// the beat's overlapping cascade (ctx.win(i)); the 'Done' pill brightens as the last lands. The marks are plain shapes of our own (a colour
// ring for the prompt pill's glyph, gradient discs for chips), the face is the system UI stack: no Apple logo, wordmark, Genmoji, footage
// character or font is drawn or shipped, and the tiles show only our own meme.
import { clamp, seg, lerp, outBack, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ip';
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; padding: 14px 14px 12px; border-radius: 28px; background: #0c050d; color: #f4f2f4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-top { display: flex; justify-content: space-between; align-items: center; height: 30px; }
.${P}-pill { display: grid; place-items: center; height: 28px; padding: 0 14px; border-radius: 14px; font-size: 13px; line-height: 28px; font-weight: 600; white-space: nowrap; }
.${P}-cancel { background: #8c898d; color: #fff; }
.${P}-done { background: #fcd71a; color: #1b1500; }
.${P}-chips { position: relative; height: 54px; margin-top: 4px; }
.${P}-cc { position: absolute; top: 2px; width: 62px; text-align: center; font-size: 9px; line-height: 11px; color: #e9e6ea; white-space: nowrap; }
.${P}-cc i { position: relative; display: block; width: 34px; height: 34px; margin: 0 auto 3px; border-radius: 50%; box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .2); }
.${P}-cc b { position: absolute; left: -3px; top: -3px; width: 13px; height: 13px; border-radius: 50%; background: #2c2a2e; box-shadow: 0 0 0 1px rgba(255, 255, 255, .25); }
.${P}-cc b::after { content: ""; position: absolute; left: 3px; top: 6px; width: 7px; height: 1.5px; background: #fff; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; padding: 0 2px; }
.${P}-c { position: relative; aspect-ratio: 1; }
.${P}-halo, .${P}-ring { position: absolute; border-radius: 50%; pointer-events: none; }
.${P}-halo { inset: -12%; background: radial-gradient(circle closest-side, rgba(252, 217, 158, .22) 0%, rgba(248, 166, 243, .1) 45%, rgba(0, 0, 0, 0) 70%), conic-gradient(from var(--a, 0deg), rgba(248, 166, 243, .75), rgba(88, 105, 146, .75), rgba(252, 217, 158, .7), rgba(163, 102, 154, .75), rgba(248, 166, 243, .75)); -webkit-mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, .15) 38%, #000 58%, rgba(0, 0, 0, 0) 100%); mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, .15) 38%, #000 58%, rgba(0, 0, 0, 0) 100%); filter: blur(7px); }
.${P}-ring { inset: 14%; background: conic-gradient(from calc(var(--a, 0deg) + 60deg), #f8a6f3, #586992, #fcd99e, #cfc9db, #d29bbe, #f8a6f3); -webkit-mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 56%, #000 82%, rgba(0, 0, 0, 0) 100%); mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 56%, #000 82%, rgba(0, 0, 0, 0) 100%); filter: blur(1.2px); }
.${P}-f { position: absolute; display: none; overflow: hidden; background: #1a1620; }
.${P}-f img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-sg { margin-top: 10px; }
.${P}-sh { display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px; font-size: 9px; line-height: 12px; letter-spacing: .06em; font-weight: 600; text-transform: uppercase; color: #bdb9be; }
.${P}-sh span:last-child { color: #f2d23a; }
.${P}-strip { display: flex; justify-content: space-between; margin-top: 8px; padding: 0 4px; }
.${P}-sc { width: 64px; text-align: center; font-size: 9px; line-height: 12px; color: #e9e6ea; white-space: nowrap; }
.${P}-sc i { display: block; width: 42px; height: 42px; margin: 0 auto 4px; border-radius: 50%; box-shadow: 0 0 0 1.5px rgba(255, 255, 255, .14); }
.${P}-cp { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.${P}-bar { flex: 1; display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px 0 8px; border-radius: 18px; background: #28262a; font-size: 12.5px; color: #8e8b91; }
.${P}-glyph { flex: none; width: 18px; height: 18px; border-radius: 50%; background: conic-gradient(from 40deg, #f8a6f3, #586992, #fcd99e, #f8a6f3); -webkit-mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 46%, #000 52%); mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 46%, #000 52%); }
.${P}-photo { flex: none; position: relative; width: 36px; height: 36px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 2px #0c050d, 0 0 0 3.5px rgba(248, 166, 243, .55); background: #28262a; }
.${P}-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-plus { flex: none; position: relative; width: 36px; height: 36px; border-radius: 50%; background: #28262a; }
.${P}-plus::before, .${P}-plus::after { content: ""; position: absolute; left: 11px; top: 17px; width: 14px; height: 2px; border-radius: 1px; background: #d8d5d9; }
.${P}-plus::after { transform: rotate(90deg); }
.${P}-note { margin-top: 8px; font-size: 9px; line-height: 12px; color: #77737a; text-align: center; white-space: nowrap; }
.${P}-note b { display: inline-block; margin-right: 4px; padding: 0 4px; border-radius: 3px; background: #3a373c; color: #c9c5cb; font-weight: 600; font-size: 7.5px; }
`;

const CONCEPTS = [
  { t: 'Meme', g: 'radial-gradient(circle at 35% 30%, #f8a6f3, #5b2b6b)', x: '12%' },
  { t: 'Muse', g: 'radial-gradient(circle at 35% 30%, #fcd99e, #b0563c)', x: '44%' },
  { t: 'Remix', g: 'radial-gradient(circle at 35% 30%, #8fa4d6, #2a3a78)', x: '76%' },
];
const SUGGEST = [
  { t: 'Prairie', g: 'linear-gradient(180deg, #7fb3df 0%, #e8cf8a 52%, #6b8a3c 100%)' },
  { t: 'Sunglasses', g: 'radial-gradient(circle at 50% 40%, #ffd84a, #c98a10)' },
  { t: 'Fireworks', g: 'radial-gradient(circle at 50% 50%, #d98bff 0%, #4a1d8a 55%, #14082e 100%)' },
  { t: 'Beanie', g: 'radial-gradient(circle at 40% 35%, #ff9a5c, #8d3414)' },
  { t: 'Stadium', g: 'linear-gradient(180deg, #5d6aa8 0%, #3d7a52 100%)' },
];
const HUE = 80;            // the orb's hue drift, degrees per second
const PULSE = 1.1;         // pulses per second
const DONE_DIM = [107, 96, 20], DONE_ON = [252, 215, 26];
const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;

export default {
  id: 'apple-image-playground',
  label: 'Apple Image Playground',
  source: {
    platform: 'Image Playground on iPhone (iOS 18.2, Apple Intelligence), full-screen create surface, dark appearance',
    feature: 'Wordless pending state (a drifting, pulsing iridescent glow orb, concept chips around it, dim Done pill) that resolves by the finished image cross-dissolving in inside the orb into a rounded tile; composer (Suggestions, Describe an image, Beta line) stays up (adapted to 10: ten orbs, one per image, landing in reading order)',
    refs: [
      { url: 'https://www.bilibili.com/video/BV14uD7YtE9e', retrieved: '2026-10-14' },
      { url: 'https://www.bilibili.com/video/BV1d1DqYeEVp', retrieved: '2026-10-14' },
      { url: 'https://www.apple.com/newsroom/videos/videos-2024/autoplay/2024/apple-intelligence-image-playground-demo/large_2x.mp4', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'apple-image-playground');
    const img = (g, i) => `<img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-top"><span class="${P}-pill ${P}-cancel">Cancel</span><span class="${P}-pill ${P}-done">Done</span></div>
<div class="${P}-chips">${CONCEPTS.map((c) => `<div class="${P}-cc" style="left: ${c.x}"><i style="background: ${c.g}"><b></b></i>${x.esc(c.t)}</div>`).join('')}</div>
<div class="${P}-grid">${tiles.map((g, i) => `<div class="${P}-c"><i class="${P}-halo"></i><i class="${P}-ring"></i><div class="${P}-f">${img(g, i)}</div></div>`).join('')}</div>
<div class="${P}-sg"><div class="${P}-sh"><span>Suggestions</span><span>Show more</span></div><div class="${P}-strip">${SUGGEST.map((s) => `<div class="${P}-sc"><i style="background: ${s.g}"></i>${x.esc(s.t)}</div>`).join('')}</div></div>
<div class="${P}-cp"><div class="${P}-bar"><i class="${P}-glyph"></i><span>Describe an image</span></div><span class="${P}-photo"><img src="${src}" width="870" height="1024" decoding="sync" alt="Photo"/></span><span class="${P}-plus"></span></div>
<div class="${P}-note"><b>BETA</b>Image Playground may create unexpected results.</div></div>`);
    const done = root.querySelector(`.${P}-done`);
    const chips = [...root.querySelectorAll(`.${P}-cc`)];
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({
      n, halo: n.querySelector(`.${P}-halo`), ring: n.querySelector(`.${P}-ring`), fr: n.querySelector(`.${P}-f`), im: n.querySelector('img'), g: tiles[i], key: null,
    }));
    ctx.gate([...cells.map((c) => c.im), root.querySelector(`.${P}-photo img`)]);

    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const end = ctx.lastLand;
        const ts = Math.min(t, end);   // the drift and the pulse stop once the last image is in
        // the concept chips pop in around the orbs one after another and stay
        chips.forEach((c, i) => {
          const p = seg(t, ctx.cardIn + 0.02 + i * 0.07, ctx.cardIn + 0.26 + i * 0.07);
          c.style.opacity = clamp(p * 3).toFixed(3);
          c.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.4, 1, outBack(p)).toFixed(4)})`;
        });
        cells.forEach((c, i) => {
          const [a, b] = ctx.win(i);
          const p = seg(t, a, b);
          // the orb: hue drifting, pulsing; it re-pulses as each neighbouring image arrives. It fades as its image takes over
          const orbOn = p < 1;
          put(`o${i}`, orbOn, (on) => { c.halo.style.display = on ? '' : 'none'; c.ring.style.display = on ? '' : 'none'; if (!on) { c.n.style.removeProperty('--a'); c.halo.style.cssText = c.ring.style.cssText = 'display: none'; } });
          if (orbOn) {
            const ph = ts * PULSE * 2 * Math.PI + i * 0.9;
            const pulse = 1 + 0.06 * Math.sin(ph);
            const fade = 1 - seg(p, 0.3, 0.95);
            c.n.style.setProperty('--a', `${((ts * HUE + i * 37) % 360).toFixed(1)}deg`);
            c.halo.style.opacity = (fade * (0.85 + 0.15 * Math.sin(ph + 1))).toFixed(3);
            c.ring.style.opacity = fade.toFixed(3);
            c.halo.style.transform = c.ring.style.transform = `scale(${pulse.toFixed(4)})`;
          }
          // the image cross-dissolves in at the orb's centre inside the same round frame, which opens to the rounded tile
          const frOn = p > 0;
          put(`f${i}`, frOn, (on) => { c.fr.style.display = on ? 'block' : 'none'; });
          if (frOn) {
            const e = outCubic(p);
            const d = p >= 1 ? 0.94 : lerp(0.66, 0.94, e);
            c.fr.style.left = c.fr.style.top = `${(((1 - d) / 2) * 100).toFixed(3)}%`;
            c.fr.style.width = c.fr.style.height = `${(d * 100).toFixed(3)}%`;
            c.fr.style.borderRadius = `${lerp(50, 20, e).toFixed(2)}%`;
            c.fr.style.opacity = p >= 1 ? '' : seg(p, 0, 0.85).toFixed(3);
            // the rim: a faint pink and blue glow once settled
            const rim = seg(p, 0.6, 1);
            c.fr.style.boxShadow = rim <= 0 ? 'none' : `0 0 0 1.5px rgba(255, 130, 170, ${(0.55 * rim).toFixed(3)}), 0 0 ${(9 * rim).toFixed(2)}px rgba(214, 110, 235, ${(0.4 * rim).toFixed(3)})`;
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
          }
        });
        // 'Done' is dim while the orbs work and brightens as the last image lands
        const dn = seg(t, ctx.win(cells.length - 1)[0] + 0.1, end);
        done.style.background = mix(DONE_DIM, DONE_ON, dn);
        done.style.color = mix([120, 112, 60], [27, 21, 0], dn);
      },
    };
  },
};
