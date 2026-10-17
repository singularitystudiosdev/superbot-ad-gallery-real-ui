// StarryAI's 'Create Photos' web app as screen-recorded in 2023 (YouTube J2c0eLvc3hY, YourEverydayAI, 2023-08-21, 1280x720, t~118-206 s; spec
// .tmp/clone-9e82faf1/reveal-refs/starryai/spec.json, confidence 0.55; frames p_starryai_form.png, p_starryai_pending.png, p_starryai_pending2.png,
// p_starryai_complete.png). A light two-column page: a slim top bar (nav links, a green 'Create' pill, a rounded credits pill), a left composer
// ('Create Photos', a prompt box, a 'Prompt Builder' link, a 'Remove from Image' toggle, a wide purple 'Generate' button carrying a small credit
// chip, a 'Style' row) and, on the right, a results panel under a 'Projects / None' row with a 'Columns' density slider. Pressing Generate adds a
// portrait tile to the panel: a grey rounded rectangle with a soft radial gradient (lighter at the centre), a centred white circular spinner (twelve
// dots round a small clock-hand glyph) and the prompt along the foot, truncated with an ellipsis. There is NO percentage, 'Generating' word or bar;
// the one other cue is the grey fill lightening across the ~40 s wait, and then the finished picture simply takes the tile (a hard swap).
// Adapted to ten images: ten pending tiles in a 5 x 2 block that land one at a time on ctx.seq(i); every tile's fill lightens from render(t) and
// its dot ring turns with t. Omitted: the starryai wordmark and its top-bar badges (no logo of the platform is drawn), the credits count, the
// creator's webcam picture-in-picture, and the hover controls (crop / download / copy). Every picture is OUR meme, system UI face only.
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sty';
const COLS = 5, GAP = 5, ROOT_H = 328;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; overflow: hidden; background: #f2f2f2; color: #1c1c1e; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px rgba(0, 0, 0, .1); }
.${P}-bar { flex: none; display: flex; align-items: center; gap: 12px; height: 34px; padding: 0 12px; background: #fff; box-shadow: 0 1px 0 #e4e4e6; }
.${P}-nav { display: flex; gap: 11px; font-size: 8.5px; font-weight: 500; color: #8e8e93; white-space: nowrap; }
.${P}-sp { flex: 1 1 auto; }
.${P}-create { padding: 3.5px 10px; border-radius: 12px; background: #7ed13c; font-size: 8.5px; font-weight: 700; color: #fff; }
.${P}-cr { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 40px; height: 22px; border-radius: 11px; box-shadow: inset 0 0 0 1px #1c1c1e; font-size: 7px; line-height: 8px; font-weight: 700; }
.${P}-cr small { font-size: 5.5px; font-weight: 500; line-height: 7px; }
.${P}-body { flex: 1; min-height: 0; display: flex; gap: 12px; padding: 12px 12px 12px 12px; }
.${P}-left { flex: none; width: 138px; }
.${P}-h1 { height: 20px; font-size: 9.5px; line-height: 20px; white-space: nowrap; }
.${P}-h1 b { font-weight: 700; }
.${P}-card { box-sizing: border-box; margin-top: 4px; padding: 7px; border-radius: 7px; background: #fff; box-shadow: 0 0 0 1px #e8e8ea; }
.${P}-ta { box-sizing: border-box; height: 54px; padding: 6px 7px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px #e1e1e4; font-size: 7.5px; line-height: 10.5px; color: #2b2b2e; overflow: hidden; }
.${P}-pb { margin-top: 6px; font-size: 7.5px; color: #6a35d3; }
.${P}-tg { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 7.5px; color: #a3a3a8; }
.${P}-tg i { position: relative; display: block; width: 20px; height: 11px; border-radius: 6px; background: #5c5c61; }
.${P}-tg i::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
.${P}-gen { display: flex; align-items: center; justify-content: center; position: relative; margin-top: 9px; height: 24px; border-radius: 6px; background: #6b35d6; font-size: 9px; font-weight: 700; color: #fff; }
.${P}-gen em { position: absolute; right: 7px; top: 6px; display: grid; place-items: center; width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, .28); font-style: normal; font-size: 6.5px; line-height: 12px; }
.${P}-style { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; margin-top: 7px; height: 36px; padding: 0 7px; border-radius: 7px; background: #fff; box-shadow: 0 0 0 1px #e8e8ea; font-size: 8.5px; font-weight: 700; }
.${P}-sw { display: grid; place-items: end center; width: 36px; height: 24px; border-radius: 3px; background: linear-gradient(160deg, #5a3fb8 0%, #b0508d 55%, #e8a06a 100%); font-size: 5.5px; font-weight: 600; line-height: 8px; color: #fff; }
.${P}-right { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: space-between; height: 20px; font-size: 8.5px; font-weight: 600; }
.${P}-col { display: flex; align-items: center; gap: 6px; font-size: 7px; font-weight: 400; color: #a3a3a8; }
.${P}-trk { position: relative; width: 56px; height: 2.5px; border-radius: 2px; background: #dcdce0; }
.${P}-trk i { position: absolute; left: 11px; top: -2.5px; width: 7px; height: 7px; border-radius: 50%; background: #5b2fd0; }
.${P}-panel { flex: 1; min-height: 0; box-sizing: border-box; margin-top: 4px; padding: 10px; border-radius: 7px; background: #f7f7f7; box-shadow: 0 0 0 1px #e4e4e7; overflow: hidden; }
.${P}-grid { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 5px; overflow: hidden; background: #8a8a8a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; }
.${P}-spin { position: absolute; left: 50%; top: 42%; width: 21px; height: 21px; margin: -10.5px 0 0 -10.5px; }
.${P}-spin svg { display: block; width: 100%; height: 100%; }
.${P}-cap { position: absolute; left: 0; right: 0; bottom: 0; box-sizing: border-box; padding: 10px 4px 3px; background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, .55)); font-size: 6px; line-height: 7.5px; font-weight: 600; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;

const PROMPT = 'Muse meme in a lecture hall, hand-written note, bright colours';
const NAV = ['Projects', 'Styles', 'My Creations', 'Explore'];
const DOTS = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) * Math.PI * 2;
  return `<circle cx="${(16 + 12.4 * Math.sin(a)).toFixed(2)}" cy="${(16 - 12.4 * Math.cos(a)).toFixed(2)}" r="1.9" fill="#fff"/>`;
}).join('');
const SPIN = `<svg viewBox="0 0 32 32">${DOTS}<path d="M16 9.5V16.4h5.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const mix = (a, b, u) => Math.round(a + (b - a) * u);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default {
  id: 'starryai',
  label: 'starryai (2023)',
  source: {
    platform: 'starryai.com web app, Create Photos workspace (desktop browser, light theme; a 2023 screen-recorded review on YouTube)',
    feature: "light two-column page (composer with a purple Generate button, results panel with a Columns slider); Generate adds a grey radial-gradient tile with a centred white twelve-dot circular spinner and the prompt along its foot, the grey lightening across the wait (no percentage, queue label or bar), then the finished image takes the tile in a hard swap (adapted to 10: a 5 x 2 block of tiles landing one at a time in strict sequence; the platform wordmark, the credits count and the hover controls are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=J2c0eLvc3hY', retrieved: '2026-10-14' }],
    // the one real tile in the footage waits ~40-45 s, never shows a number, and is alone in its grid
    extrapolated: [
      'ten tiles, their 5 + 5 block and their one-at-a-time landing order (the footage has a single tile)',
      'the wait compressed from ~40 s to the beat, so the grey lightens over each tile\'s own ramp (the footage gives only "gradually lightens", no curve)',
      'the dot ring turning step by step (twelve dots; the rate is chosen, the footage gives the glyph and not its speed)',
      'the prompt text and the Generate chip showing 10 (the footage shows 1)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'starryai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><div class="${P}-pend"><div class="${P}-spin">${SPIN}</div><div class="${P}-cap">${x.esc(PROMPT)}</div></div></div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-bar"><span class="${P}-nav">${NAV.map((n) => `<span>${n}</span>`).join('')}</span><span class="${P}-sp"></span><span class="${P}-create">Create</span><span class="${P}-cr">${count}<small>images</small></span></div>
<div class="${P}-body">
<div class="${P}-left"><div class="${P}-h1">Create <b>Photos</b> &#9662;</div>
<div class="${P}-card"><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-pb">Prompt Builder</div><div class="${P}-tg">Remove from Image<i></i></div><div class="${P}-gen">Generate<em>${count}</em></div></div>
<div class="${P}-style">Style<span class="${P}-sw">Cinematic</span></div></div>
<div class="${P}-right"><div class="${P}-top"><span>Projects / None &#9662;</span><span class="${P}-col">Columns<span class="${P}-trk"><i></i></span></span></div>
<div class="${P}-panel"><div class="${P}-grid">${tiles.map(cell).join('')}</div></div></div>
</div></div>`);

    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({
      t: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), dots: [...n.querySelectorAll('circle')],
    }));
    ctx.gate(cells.map((c) => c.im));

    // each tile's grey starts lightening a seeded beat before the block appears and is at its lightest as the picture lands
    const tStart = Math.min(ctx.cardIn, ctx.seq(0)[0]);
    const ramps = cells.map((_, i) => ({ a: tStart - (0.5 + 0.6 * hash(41, i)), e: ctx.seq(i)[1] }));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          const landed = t >= ctx.seq(i)[1];
          put(`l${i}`, landed, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.visibility = v ? 'hidden' : 'visible'; });
          // the grey lightens: centre #A9A9A9 -> #C9C9C9, corners #6E6E6E -> #8A8A8A (the footage's two ends)
          const r = ramps[i];
          const u = Math.round(clamp01((t - r.a) / (r.e - r.a)) * 50) / 50;
          put(`g${i}`, u, (v) => { c.t.style.background = `radial-gradient(circle at 50% 42%, rgb(${mix(169, 201, v)},${mix(169, 201, v)},${mix(169, 201, v)}) 0%, rgb(${mix(110, 138, v)},${mix(110, 138, v)},${mix(110, 138, v)}) 100%)`; });
          // the dot ring turns one dot at a time; the phase differs per tile
          const head = (Math.floor(t * 11) + i * 5) % 12;
          put(`s${i}`, head, (h) => c.dots.forEach((d, k) => d.setAttribute('fill-opacity', (1 - 0.075 * ((h - k + 12) % 12)).toFixed(3))));
        });
      },
    };
  },
};
