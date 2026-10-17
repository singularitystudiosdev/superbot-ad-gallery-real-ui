// Apple's 'New Genmoji' sheet in Messages on iPhone (iOS 18.2, Apple Intelligence; YouTube EAEobt0AypQ, 2024-12-23, t=110.5-121.0 s; spec
// .tmp/clone-9e82faf1/reveal-refs/apple-genmoji/spec.json, confidence 0.64; frames ar_gen_110.5 .. ar_gen_121.0). A white modal sheet over the
// conversation: 'Cancel' (blue) left, 'New Genmoji' bold in the middle, 'Add' right (grey while pending, blue once an idea is in), a large
// empty idea area in the upper half, the grey caption 'Some descriptions may create unexpected results.' under it, then the description pill
// carrying the typed words with a small pink round stop button at its right. While the Genmoji is made the idea area holds ONE iridescent
// pastel sphere (pink through lavender to pale blue, a crescent highlight, a feathered edge) that breathes in scale and drifts in hue, with a
// tiny '...' under it; nothing else moves and no string says 'generating'. After ~6.4 s the sphere is replaced in one hard step by the first
// idea and 'Add' turns blue; paging to another idea repeats the wait.
// Adapted to ten ideas: the single sphere keeps the idea area for the long wait, then it is swapped (frozen and hidden) for a one-row strip of
// ten emoji-sized ideas that land in strict reading order, 'Add' turning blue with the first. This is deliberately not Image Playground:
// a light Messages sheet with text buttons, a disclaimer line, a pink stop button and a single row of small rounded ideas, where Playground is
// a dark full-screen surface with pills, concept chips and a 5 x 2 block of large orbs. Omitted: Apple logos, the phone status bar and the
// tinted system keyboard. The grey 'BETA' capsule beside the title is kept: it is a product-state label. The footage's Genmoji are never reproduced: every idea is our own meme and the face is the system UI stack.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gmj';
const ROOT_H = 318, COLS = 10, IGAP = 8;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 16px; background: #ffffff; color: #000000; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e5e5ea; }
.${P}-top { flex: none; position: relative; height: 52px; }
.${P}-top > span, .${P}-top > b { position: absolute; top: 16px; line-height: 22px; font-size: 16px; white-space: nowrap; }
.${P}-can { left: 20px; color: #0a84ff; }
.${P}-ttl { left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 6px; font-weight: 700; }
.${P}-ttl em { font-style: normal; font-size: 9px; font-weight: 600; line-height: 14px; padding: 0 5px; border-radius: 4px; background: #e5e5ea; color: #8e8e93; letter-spacing: .02em; }
.${P}-add { right: 20px; color: #c7c7cc; font-weight: 400; }
.${P}-area { flex: none; position: relative; height: 128px; margin-top: 4px; }
.${P}-orb { position: absolute; left: 50%; top: 50%; width: 88px; height: 88px; margin: -50px 0 0 -44px; }
.${P}-ob { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 40% 36%, #ffffff 0%, #fbe9f0 18%, #f6d8e4 40%, #e7d3f0 62%, #cfe0f5 82%, rgba(207, 224, 245, 0) 100%); filter: blur(1.6px); }
.${P}-oc { position: absolute; left: 14%; top: 10%; width: 74%; height: 74%; border-radius: 50%; box-shadow: inset 7px 6px 8px -3px rgba(255, 255, 255, .95); }
.${P}-od { position: absolute; left: 50%; top: 100%; display: flex; gap: 3px; margin: 8px 0 0 -9px; }
.${P}-od i { display: block; width: 3px; height: 3px; border-radius: 50%; background: #aeaeb2; }
.${P}-strip { position: absolute; left: 24px; right: 24px; top: 34px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${IGAP}px; }
.${P}-c { position: relative; aspect-ratio: 1; }
.${P}-w { position: absolute; inset: 0; border-radius: 12px; overflow: hidden; background: #f2f2f7; }
.${P}-w img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-sl { position: absolute; inset: 0; box-sizing: border-box; background: #f6f6f9; box-shadow: inset 0 0 0 1px #ececf1; }
.${P}-sel { position: absolute; left: -3px; top: -3px; right: -3px; bottom: -3px; border-radius: 15px; box-shadow: 0 0 0 1.5px #0a84ff; }
.${P}-pg { position: absolute; left: 0; right: 0; top: 98px; display: flex; justify-content: center; gap: 6px; }
.${P}-pg i { display: block; width: 6px; height: 6px; border-radius: 50%; background: #c7c7cc; }
.${P}-pg i:first-child { background: #1c1c1e; }
.${P}-cap { flex: none; margin-top: 6px; text-align: center; font-size: 13px; line-height: 18px; color: #8e8e93; white-space: nowrap; }
.${P}-sp { flex: 1; }
.${P}-pill { flex: none; position: relative; box-sizing: border-box; display: flex; align-items: center; gap: 10px; height: 40px; margin: 0 28px; padding: 0 10px 0 12px; border-radius: 20px; background: #ffffff; box-shadow: 0 0 0 1.5px #f4c3d4, 0 3px 14px rgba(246, 150, 190, .38); font-size: 15px; color: #000000; }
.${P}-gl { flex: none; width: 18px; height: 18px; border-radius: 50%; background: conic-gradient(from 20deg, #ff8fa8, #8a8cf0, #6ec6f5, #ff8fa8); -webkit-mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 52%, #000 58%); mask-image: radial-gradient(circle closest-side, rgba(0, 0, 0, 0) 52%, #000 58%); }
.${P}-dsc { flex: 1; white-space: nowrap; }
.${P}-stop, .${P}-clr { flex: none; position: relative; width: 22px; height: 22px; border-radius: 50%; }
.${P}-stop { background: #ff6b95; }
.${P}-stop::after { content: ""; position: absolute; left: 7.5px; top: 7.5px; width: 7px; height: 7px; border-radius: 2px; background: #ffffff; }
.${P}-clr { background: #c7c7cc; }
.${P}-clr::before, .${P}-clr::after { content: ""; position: absolute; left: 6px; top: 10.2px; width: 10px; height: 1.6px; border-radius: 1px; background: #ffffff; transform: rotate(45deg); }
.${P}-clr::after { transform: rotate(-45deg); }
.${P}-chip { flex: none; margin: 8px 0 14px 34px; font-size: 15px; line-height: 20px; color: #5e5ce6; white-space: nowrap; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.16;                               // the sheet opens on the pending sphere
const FIRST = 0.9;                                // the long wait ends: the sphere is swapped for the first idea in one step
const LAND = Array.from({ length: 10 }, (_, i) => FIRST + i * ((1.68 - FIRST) / 9));   // idea i lands in reading order, the last at 1.68
const BREATH = 1.1;                               // breaths per second of the sphere
const HUE = 70;                                   // the sphere's hue drift, degrees per second
const DESC = 'muse laughing at a meme';

export default {
  id: 'apple-genmoji',
  label: 'Apple Genmoji (2024)',
  source: {
    platform: "Apple's Messages on iPhone (iOS 18.2, Apple Intelligence), the 'New Genmoji' sheet reached from the emoji keyboard; a tutorial screen recording on YouTube, 2024-12-23",
    feature: "'New Genmoji' sheet: Cancel / New Genmoji / Add (grey while pending), the description pill with a pink stop button, the static caption 'Some descriptions may create unexpected results.', and in the empty idea area ONE pulsing iridescent pastel sphere (no string, bar or percentage) that is hard-swapped for the first Genmoji idea while 'Add' turns blue (adapted to 10: the sphere is frozen and hidden at the swap and ten emoji-sized ideas land in a one-row strip in reading order; Apple logos, the status bar and the keyboard omitted; the grey BETA capsule beside the title is kept)",
    videoIds: ['EAEobt0AypQ'],
    dates: ['2024-12-23 (video published)', '2026-10-14 (retrieved)'],
    refs: [
      { url: 'https://www.youtube.com/watch?v=EAEobt0AypQ', retrieved: '2026-10-14' },
      { url: 'https://support.apple.com/guide/iphone/create-your-own-emoji-with-genmoji-iph4e76f5667/ios', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten ideas: the source is a paged carousel that shows one idea at a time (a hard swap from the sphere to the first idea); the beat needs ten, so they land one after another in reading order in a 10-cell strip right after the swap',
      'strip layout: a single row of ten emoji-sized rounded ideas, with the first one selected and page dots under it (the source carousel shows the current idea large with the next peeking in); not a grid, so it stays distinct from Apple Image Playground',
      'timing: the long wait is kept (the sphere holds the idea area until about half-way through the beat), then the ten ideas land over the rest of it; the source wait was ~6.4 s',
      "the description text ('muse laughing at a meme') is ours, not the footage's 'face confused'",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'apple-genmoji');
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-w"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><i class="${P}-sl"></i></div>${i === 0 ? `<i class="${P}-sel" style="display: none"></i>` : ''}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-can">Cancel</span><b class="${P}-ttl"><span>New Genmoji</span><em>BETA</em></b><span class="${P}-add">Add</span></div><div class="${P}-area" style="visibility: hidden"><div class="${P}-orb"><i class="${P}-ob"></i><i class="${P}-oc"></i><div class="${P}-od"><i></i><i></i><i></i></div></div><div class="${P}-strip" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-pg" style="visibility: hidden"><i></i><i></i><i></i></div></div><div class="${P}-cap">Some descriptions may create unexpected results.</div><div class="${P}-sp"></div><div class="${P}-pill"><i class="${P}-gl"></i><span class="${P}-dsc">${x.esc(DESC)}</span><i class="${P}-stop"></i><i class="${P}-clr" style="display: none"></i></div><div class="${P}-chip">&ldquo;laughing&rdquo;</div></div>`);
    const area = root.querySelector(`.${P}-area`), orb = root.querySelector(`.${P}-orb`), ob = root.querySelector(`.${P}-ob`), oc = root.querySelector(`.${P}-oc`);
    const dots = [...root.querySelectorAll(`.${P}-od i`)], strip = root.querySelector(`.${P}-strip`), pg = root.querySelector(`.${P}-pg`);
    const add = root.querySelector(`.${P}-add`), stop = root.querySelector(`.${P}-stop`), clr = root.querySelector(`.${P}-clr`), sel = root.querySelector(`.${P}-sel`);
    const cells = [...root.querySelectorAll(`.${P}-c`)].map((n, i) => ({ im: n.querySelector('img'), sl: n.querySelector(`.${P}-sl`) }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the sheet opens on the pending sphere
        put('iss', s >= ISSUE, (v) => { area.style.visibility = v ? '' : 'hidden'; });

        // the sphere breathes (scale ~0.92 -> 1.05 -> 0.96) and drifts in hue from t; it freezes at the swap (a pure function of t)
        const swapped = s >= LAND[0];
        const tsec = Math.min(t, ctx.cardIn + LAND[0] * k);   // frozen once the first idea has replaced it
        const ph = tsec * BREATH * 2 * Math.PI;
        const sc = 0.985 + 0.065 * Math.sin(ph) - 0.02 * Math.sin(ph * 2 + 1);
        const hue = (tsec * HUE) % 360;
        put('orb', `${sc.toFixed(4)}|${hue.toFixed(1)}`, () => {
          ob.style.transform = `scale(${sc.toFixed(4)})`;
          ob.style.filter = `blur(1.6px) hue-rotate(${hue.toFixed(1)}deg)`;
          oc.style.transform = `scale(${(0.97 + (sc - 0.985) * 0.5).toFixed(4)}) rotate(${(Math.sin(ph * 0.5) * 14).toFixed(2)}deg)`;
        });
        dots.forEach((d, i) => { const o = 0.35 + 0.65 * Math.max(0, Math.sin(ph - i * 0.9)); put(`d${i}`, o.toFixed(2), () => { d.style.opacity = o.toFixed(2); }); });
        put('osw', swapped, (v) => { orb.style.visibility = v ? 'hidden' : ''; strip.style.visibility = v ? '' : 'hidden'; pg.style.visibility = v ? '' : 'hidden'; sel.style.display = v ? '' : 'none'; });

        // 'Add' is grey while the idea is pending and blue once an idea is in; the pink stop button gives way to a grey clear button
        put('add', swapped, (v) => { add.style.color = v ? '#0a84ff' : '#c7c7cc'; add.style.fontWeight = v ? '600' : '400'; stop.style.display = v ? 'none' : ''; clr.style.display = v ? '' : 'none'; });

        // the ideas land one after another in reading order (a hard swap of the empty slot for the idea)
        cells.forEach((c, i) => {
          put(`l${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.sl.style.display = v ? 'none' : ''; });
        });
      },
    };
  },
};
