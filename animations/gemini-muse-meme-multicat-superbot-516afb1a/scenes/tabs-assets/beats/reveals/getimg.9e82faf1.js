// getimg.ai 2.0, the 'Create image' workspace generating (official getimg.ai channel Yc7xnLLO_80, 2026-05-22, t~204.7-208.25 s; spec
// .tmp/clone-9e82faf1/reveal-refs/getimg/spec.json, confidence 0.62; frames p_getimg_prompt.png, p_getimg_pending.png,
// p_getimg_complete.png). A near-black app shell: a left navigation (Create video, Create image, Resize image, ... Content,
// Personalisation), a top bar with a search pill, a date header over the canvas, and a bottom composer (Element / Reference chips, the
// prompt, a model chip, size, aspect and count chips, and a round blue send arrow that turns into a ring while it runs). Sending fills
// the canvas with a row of dark rounded 16:9 tiles, each badged top-left with a pill holding a thin spinning ring and a status verb
// (Imagining... / Envisioning... / Planning... / Orchestrating...), no percentage, bar or shimmer; the batch then swaps to its finished
// images (a hard swap in the footage). 'No more content found.' sits under the row.
// Adapted to ten: the grid is three batches of 4 + 4 + 2 tiles, each batch's pending tiles appearing as the previous batch finishes, the
// tiles of a batch landing one after another (a hard swap each) in strict sequence; the verb and the ring angle of every pill come from
// t alone. Omitted: the credit pill and its countdown, the getimg wordmark and every logo, the footage's own pictures (every tile is
// our meme); the navigation icons are plain outlined squares.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gi';
const ROOT_H = 400, SIDE_W = 92, COLS = 4;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #0d0e10; color: #d3d6da; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #24262b; }
.${P}-side { flex: none; box-sizing: border-box; width: ${SIDE_W}px; padding: 12px 6px 0; background: #101114; box-shadow: 1px 0 0 #1b1d21; }
.${P}-nh { margin: 7px 0 3px 5px; font-size: 5.8px; color: #6c727a; }
.${P}-ni { display: flex; align-items: center; gap: 4px; height: 15px; padding: 0 5px; border-radius: 4px; font-size: 6.6px; color: #9ba1a8; white-space: nowrap; }
.${P}-ni i { flex: none; display: block; width: 6px; height: 6px; box-sizing: border-box; border: 1.1px solid #7d848c; border-radius: 1.5px; }
.${P}-ni b { margin-left: auto; font-weight: 400; font-size: 5.8px; color: #8d939a; }
.${P}-ni.on { background: #1c1e22; color: #f1f3f5; }
.${P}-main { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 24px; padding: 0 10px; font-size: 7px; color: #e3e6e9; white-space: nowrap; }
.${P}-srch { flex: 1; max-width: 170px; box-sizing: border-box; height: 14px; margin-left: 20px; padding: 0 7px; border-radius: 7px; background: #181a1d; line-height: 14px; font-size: 6.2px; color: #6c727a; }
.${P}-btn { box-sizing: border-box; height: 13px; padding: 0 6px; border-radius: 4px; background: #1c1e22; line-height: 13px; font-size: 6.2px; color: #e3e6e9; }
.${P}-av { flex: none; display: block; width: 11px; height: 11px; border-radius: 50%; background: #4d52c9; }
.${P}-dt { flex: none; padding: 5px 10px 3px; font-size: 7.5px; color: #8d939a; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; padding: 0 8px; }
.${P}-t { position: relative; aspect-ratio: 16 / 9; border-radius: 5px; overflow: hidden; background: #1b1d21; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #2a2d32; }
.${P}-ph { position: absolute; left: 4px; top: 4px; display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 11px; padding: 0 6px 0 4px; border-radius: 6px; background: rgba(13, 14, 16, .86); font-size: 6.1px; color: #c4c9ce; white-space: nowrap; }
.${P}-ring { flex: none; display: block; box-sizing: border-box; width: 6px; height: 6px; border-radius: 50%; border: 1.1px solid #aab0b6; border-top-color: transparent; }
.${P}-end { padding-top: 16px; text-align: center; font-size: 6.6px; color: #6c727a; }
.${P}-comp { position: absolute; left: 50%; bottom: 10px; width: 318px; margin-left: -159px; box-sizing: border-box; padding: 6px 7px 7px; border-radius: 8px; background: #141518; box-shadow: 0 0 0 1px #23252a; }
.${P}-chips { display: flex; gap: 4px; }
.${P}-chips span { box-sizing: border-box; height: 11px; padding: 0 5px; border-radius: 3px; background: #1c1e22; line-height: 11px; font-size: 5.8px; color: #8d939a; }
.${P}-pt { margin: 6px 0 5px; font-size: 6.9px; line-height: 9px; color: #e3e6e9; height: 36px; overflow: hidden; }
.${P}-cr { display: flex; align-items: center; gap: 4px; }
.${P}-cr span { box-sizing: border-box; height: 14px; padding: 0 6px; border-radius: 4px; background: #1c1e22; line-height: 14px; font-size: 6.2px; color: #c9cdd2; white-space: nowrap; }
.${P}-go { position: relative; flex: none; margin-left: auto; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: #3b6ef5; }
.${P}-go svg { display: block; width: 8px; height: 8px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go .${P}-ring { position: absolute; left: 4px; top: 4px; width: 8px; height: 8px; border-color: #fff; border-top-color: transparent; }
`;

const PROMPT = 'a muse holding a handwritten note in a lecture hall, meme style, soft cinematic light, shallow depth of field, clean composition';
const VERBS = ['Imagining…', 'Envisioning…', 'Planning…', 'Orchestrating…'];
const BATCHES = [4, 4, 2];
const GEN_AT = 0.06;                                // the send arrow is pressed
const ISSUE = 0.14;                                 // the first batch's pending tiles appear
const NAV = [['Create video', ''], ['Create image', '3'], ['Resize image', ''], ['Remove background', ''], ['Upscale image', '']];

export default {
  id: 'getimg',
  label: 'getimg.ai (2026)',
  source: {
    platform: "getimg.ai 2.0 web app, 'Create image' workspace (dark theme; the official product tour, 2026-05-22)",
    feature: "dark shell with a bottom composer and a round blue send arrow; dark rounded 16:9 pending tiles each with a top-left pill of a spinning ring and a rotating status verb (Imagining… Envisioning… Planning… Orchestrating…), no percentage, bar or shimmer, swapping to the finished images (adapted to 10: batches of 4 + 4 + 2, each tile landing in strict sequence; the credit countdown is omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=Yc7xnLLO_80', retrieved: '2026-10-14' }],
    extrapolated: 'the 4 + 4 + 2 batches queued one after another and the one-at-a-time landing (the footage swaps all four tiles at once), the verb rotation rate',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'getimg');
    const cell = (g, i) => `<div class="${P}-t" style="visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-ph"><i class="${P}-ring"></i><em style="font-style: normal">${VERBS[i % 4]}</em></div></div></div>`;
    const nav = NAV.map(([n, b]) => `<div class="${P}-ni${n === 'Create image' ? ' on' : ''}"><i></i>${n}${b ? `<b>${b}</b>` : ''}</div>`).join('');
    const arrow = '<svg viewBox="0 0 12 12"><path d="M6 10V2.5M2.8 5.5L6 2.3l3.2 3.2"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-side"><div class="${P}-ni"><i></i>Home</div><div class="${P}-nh">Actions</div>${nav}<div class="${P}-nh">Content</div><div class="${P}-ni"><i></i>All media</div><div class="${P}-ni"><i></i>Favorites</div><div class="${P}-ni"><i></i>Uploads</div><div class="${P}-ni"><i></i>Trashed</div><div class="${P}-nh">Personalisation</div><div class="${P}-ni"><i></i>Elements</div></div><div class="${P}-main"><div class="${P}-top"><span>Create image</span><span class="${P}-srch">Search content</span><span class="${P}-btn">Feedback</span><span class="${P}-btn">Help</span><i class="${P}-av"></i></div><div class="${P}-dt">Thu, May 21</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-end">No more content found.</div><div class="${P}-comp"><div class="${P}-chips"><span>Element</span><span>Reference</span></div><div class="${P}-pt">${x.esc(PROMPT)}</div><div class="${P}-cr"><span>Nano Banana 2</span><span>4K</span><span>16:9</span><span>10</span><div class="${P}-go">${arrow}<i class="${P}-ring" style="display: none"></i></div></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), svg = q(`.${P}-go svg`), gring = q(`.${P}-go .${P}-ring`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), verb: n.querySelector('em'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);
    // the batch each tile belongs to, and the moment that batch's pending tiles appear (the first at the send, the others as the batch before finishes)
    const batchOf = [];
    BATCHES.forEach((n, b) => { for (let k = 0; k < n; k++) batchOf.push(b); });
    const firsts = BATCHES.map((_, b) => BATCHES.slice(0, b).reduce((s, n) => s + n, 0));
    const shownAt = (b) => (b === 0 ? ctx.cardIn + ISSUE : ends[firsts[b] - 1]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;
        const busy = s >= ISSUE && t < ctx.lastLand;

        // the send arrow is pressed, and shows a ring while the batches run
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.1 * gp).toFixed(4)})` : 'none'; });
        put('busy', busy, (v) => { svg.style.display = v ? 'none' : ''; gring.style.display = v ? '' : 'none'; go.style.background = v ? '#2c4fb3' : ''; });
        const gdeg = (((t * 520) % 360) + 360) % 360;
        put('gd', gdeg.toFixed(0), (d) => { gring.style.transform = `rotate(${d}deg)`; });

        cells.forEach((c, i) => {
          const landed = t >= ends[i];
          put(`v${i}`, t >= shownAt(batchOf[i]), (v) => { c.el.style.visibility = v ? '' : 'hidden'; });
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the pill's verb rotates with t and differs per tile; its ring turns with t (both a function of t alone, covered or not)
          const verb = VERBS[(Math.floor(t * 2.4) + i) % VERBS.length];
          put(`w${i}`, verb, (w) => { c.verb.textContent = w; });
          const deg = (((t * 520 + i * 61) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
