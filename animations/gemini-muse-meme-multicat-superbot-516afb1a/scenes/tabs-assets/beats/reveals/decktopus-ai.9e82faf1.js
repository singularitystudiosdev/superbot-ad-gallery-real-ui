// Decktopus AI deck generation, the full-viewport 'Building your blueprint' wait (a first-party Decktopus screen recording on YouTube, 'Decktopus AI Tutorial: The New Way to Build
// Presentations', IdYXwVydmTg, published 2026-04-24, a desktop Chrome walkthrough, t~25.6-33 s; spec .tmp/clone-9e82faf1/reveal-refs/decktopus-ai/spec.json, confidence 0.78; frames ap_decktopus_01..10.png).
// After the style step the app takes the whole viewport for a light page: a prompt field at the top, a lavender disc holding a presentation-board
// glyph inside a thin ring with one dot orbiting it, the H1 'Building your blueprint', the sub-line 'Analyzing your prompt and planning the perfect
// presentation structure.' and a four-row checklist ('Reading your prompt', 'Deciding slide structure', 'Choosing visual style', 'Blueprint ready')
// whose markers go from an empty ring to a turning arc to a check, one row at a time, in order. A second stage line, 'Analyzing your topic...',
// takes the place of the heading for a moment, and then the generated deck's slide list takes over the screen. There is no percentage, queue label
// or countdown anywhere in the sequence.
// Adapted to ten images: the wait screen above (its rows ticking over from render(t)), then the deck as a 5 x 2 block of ten slide cards, each a
// pale skeleton slide that hands over to its picture, one after another in strict reading order, each carrying its number and a title. Omitted:
// the wordmark top-left, the style-picker screen before it and the generate button on it, the cursor, and the footage's long outline text. The
// footage's pictures are never reproduced: every slide picture is our own meme, and no logo or platform font is drawn (a plain glyph, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dkt';
const ROOT_H = 316, COLS = 5, GAP = 8;
const INK = '#17181f', MUTED = '#6b6e7a', ACC = '#4448c9', LAV = '#dcdcfb';
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #fff; color: ${INK}; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e3e4ea; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; justify-content: flex-end; height: 26px; padding: 0 12px; }
.${P}-help { display: flex; align-items: center; gap: 4px; font-size: 7.5px; font-weight: 500; color: ${ACC}; white-space: nowrap; }
.${P}-help i { display: grid; place-items: center; box-sizing: border-box; width: 9px; height: 9px; border-radius: 50%; box-shadow: inset 0 0 0 1px ${ACC}; font-size: 6px; font-style: normal; line-height: 1; }
.${P}-field { position: absolute; left: 50%; top: 30px; box-sizing: border-box; width: 240px; height: 22px; margin-left: -120px; padding: 0 9px; border-radius: 5px; background: #f7f7f9; box-shadow: 0 0 0 1px #eeeef2; font-size: 7.5px; line-height: 22px; color: #3a3c46; white-space: nowrap; }
.${P}-wt { position: absolute; left: 0; right: 0; top: 60px; bottom: 0; display: flex; flex-direction: column; align-items: center; }
.${P}-ring { position: relative; flex: none; box-sizing: border-box; width: 52px; height: 52px; margin-top: 6px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 1px #cfd0f4, 0 0 0 4px #f4f4fe; }
.${P}-disc { position: absolute; left: 6px; top: 6px; width: 40px; height: 40px; border-radius: 50%; background: ${LAV}; display: grid; place-items: center; }
.${P}-disc svg { width: 20px; height: 20px; fill: none; stroke: ${ACC}; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-orb { position: absolute; left: 0; top: 0; width: 52px; height: 52px; }
.${P}-orb i { position: absolute; left: 24px; top: -3px; width: 7px; height: 7px; border-radius: 50%; background: ${ACC}; }
.${P}-h { flex: none; margin-top: 18px; height: 20px; font-size: 15px; line-height: 20px; font-weight: 700; color: ${INK}; white-space: nowrap; }
.${P}-sub { flex: none; margin-top: 6px; height: 12px; font-size: 7.5px; line-height: 12px; color: ${MUTED}; white-space: nowrap; }
.${P}-list { flex: none; margin-top: 16px; display: flex; flex-direction: column; gap: 9px; }
.${P}-row { display: flex; align-items: center; gap: 8px; height: 13px; font-size: 8.5px; font-weight: 600; color: ${INK}; white-space: nowrap; }
.${P}-mk { position: relative; flex: none; width: 12px; height: 12px; }
.${P}-mk svg { position: absolute; left: 0; top: 0; width: 12px; height: 12px; display: none; }
.${P}-mk .${P}-m-idle { display: block; fill: none; stroke: #d3d5de; stroke-width: 1.4; }
.${P}-mk .${P}-m-spin { fill: none; stroke: ${ACC}; stroke-width: 1.6; stroke-linecap: round; }
.${P}-mk .${P}-m-ok { fill: ${ACC}; }
.${P}-mk .${P}-m-ok path { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-deck { position: absolute; left: 0; right: 0; top: 60px; bottom: 0; padding: 0 14px; display: none; }
.${P}-dh { display: flex; align-items: center; justify-content: space-between; height: 22px; font-size: 9px; font-weight: 700; color: ${INK}; }
.${P}-dh span { font-size: 7px; font-weight: 500; color: ${MUTED}; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 9px ${GAP}px; margin-top: 4px; }
.${P}-c { min-width: 0; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 4px; overflow: hidden; background: #f1f1f6; box-shadow: 0 0 0 1px #e6e7ee; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; background: #f6f6fa; }
.${P}-cov i { position: absolute; left: 10%; display: block; height: 4px; border-radius: 2px; background: #dfe0ea; }
.${P}-cov b { position: absolute; right: 10%; bottom: 12%; width: 36%; height: 38%; border-radius: 3px; background: #e6e7ef; }
.${P}-n { position: absolute; left: 3px; top: 3px; display: grid; place-items: center; min-width: 11px; height: 11px; padding: 0 2px; border-radius: 4px; background: rgba(23, 24, 31, .72); font-size: 6px; font-weight: 600; line-height: 1; color: #fff; }
.${P}-lb { margin-top: 3px; height: 9px; font-size: 6.2px; line-height: 9px; font-weight: 600; color: #3a3c46; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const PROMPT = 'A deck of muse memes';
const TITLES = ['Why muse memes?', 'A guided first draft', 'Core ideas, one slide each', 'What the audience sees', 'Templates that fit', 'Fast, frictionless sharing', 'Made for every room', 'Value across the journey', 'How it compares', 'Next steps'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ROW = ['Reading your prompt', 'Deciding slide structure', 'Choosing visual style', 'Blueprint ready'];
const ROW_DONE = [0.26, 0.46, 0.66, 0.84];        // row i flips from its turning arc to a check at this layout second; row i+1 is then the active one
const TOPIC_AT = 0.88;                            // 'Analyzing your topic...' takes the heading's place
const DECK_AT = 1.04;                             // the wait screen gives way to the deck of ten pending slide cards
const LAND = Array.from({ length: 10 }, (_, i) => 1.2 + i * 0.0711);   // card i hands its skeleton over to the picture (reading order), the last at 1.84
const FADE = 0.05;                                // the skeleton thins away over this long before the picture lands
const SPIN = 560;                                 // degrees per layout second of the row arcs
const ORBIT = 300;                                // degrees per layout second of the orbiting dot

const CHECK = `<svg class="${P}-m-ok" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6"/><path d="M3.4 6.2l1.8 1.8 3.4-3.6"/></svg>`;

export default {
  id: 'decktopus-ai',
  label: 'Decktopus AI (2026)',
  source: {
    platform: "Decktopus AI web app in desktop Chrome (light theme; a first-party Decktopus walkthrough recording on YouTube, 1920x1080, the generating screen at t~25.6-33 s)",
    feature: "the full-viewport 'Building your blueprint' wait (a lavender glyph disc in a ring with one orbiting dot, the sub-line 'Analyzing your prompt and planning the perfect presentation structure.', a four-row checklist 'Reading your prompt' / 'Deciding slide structure' / 'Choosing visual style' / 'Blueprint ready' whose markers go from a turning arc to a check in order), then 'Analyzing your topic...', then the generated deck (adapted to 10: the deck as a 5 x 2 block of ten slide cards whose pictures land one after another in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=IdYXwVydmTg', retrieved: '2026-10-14' }],
    videoIds: ['IdYXwVydmTg'],
    dates: { published: '2026-04-24', retrieved: '2026-10-14' },
    extrapolated: "The footage's deck screen is a text outline (a list of slide titles with an expanded body), carries no pictures and is not a block of cards: the 5 x 2 block of ten slide cards, their numbers, their titles (our own wording), the pale skeleton that hands over to a picture and the strict one-by-one landing are all extrapolated, as is every timing (the checklist rows ticking at 0.26 / 0.46 / 0.66 / 0.84 s, 'Analyzing your topic...' at 0.88 s, the deck at 1.04 s, the first picture at 1.2 s and the last at 1.84 s; the footage's wait runs ~7 s). The placement of 'Analyzing your topic...' (it takes the heading's place and the sub-line and checklist leave) is a guess: the spec holds a single OCR sample of that line. The prompt text is ours ('A deck of muse memes'), the wordmark and the style-picker screen are omitted, and the orbit and arc speeds are guesses (the footage shows no measurable period).",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'decktopus-ai');
    const marker = `<span class="${P}-mk"><svg class="${P}-m-idle" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.8"/></svg><svg class="${P}-m-spin" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.8" stroke-dasharray="11 20"/></svg>${CHECK}</span>`;
    const rows = ROW.map((r) => `<div class="${P}-row">${marker}<span>${r}</span></div>`).join('');
    const skel = `<div class="${P}-cov" style="opacity: 1"><i style="top: 16%; width: 46%"></i><i style="top: 30%; width: 30%"></i><b></b></div>`;
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/>${skel}<span class="${P}-n">${i + 1}</span></div><div class="${P}-lb">${x.esc(TITLES[i])}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span class="${P}-help"><i>?</i>Need Help?</span></div><div class="${P}-field">${x.esc(PROMPT)}</div><div class="${P}-wt"><div class="${P}-ring"><div class="${P}-disc"><svg viewBox="0 0 24 24"><path d="M4 5h16v10H4z"/><path d="M12 15v4M8 21l4-2 4 2M12 5V3"/><path d="M8 12v-2M12 12V8M16 12v-3"/></svg></div><div class="${P}-orb"><i></i></div></div><div class="${P}-h">Building your blueprint</div><div class="${P}-sub">Analyzing your prompt and planning the perfect presentation structure.</div><div class="${P}-list">${rows}</div></div><div class="${P}-deck"><div class="${P}-dh"><b>Your presentation</b><span>10 slides</span></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const wt = q(`.${P}-wt`), deck = q(`.${P}-deck`), head = q(`.${P}-h`), sub = q(`.${P}-sub`), list = q(`.${P}-list`), orb = q(`.${P}-orb`);
    const rowEls = [...root.querySelectorAll(`.${P}-row`)].map((n) => ({ idle: n.querySelector(`.${P}-m-idle`), spin: n.querySelector(`.${P}-m-spin`), ok: n.querySelector(`.${P}-m-ok`) }));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sc = Math.min(Math.max(s, 0), DECK_AT);  // everything that turns stops here, when the wait screen leaves

        // the wait screen gives way to the deck
        const inDeck = s >= DECK_AT;
        put('screen', inDeck, (v) => { wt.style.display = v ? 'none' : ''; deck.style.display = v ? 'block' : 'none'; });

        // stage two: 'Analyzing your topic...' replaces the heading, and the sub-line and the checklist leave
        const topic = s >= TOPIC_AT;
        put('topic', topic, (v) => {
          head.textContent = v ? 'Analyzing your topic...' : 'Building your blueprint';
          sub.style.visibility = v ? 'hidden' : 'visible';
          list.style.visibility = v ? 'hidden' : 'visible';
        });

        // the orbiting dot, a function of the layout clock alone (frozen when the deck replaces the screen)
        const od = ((sc * ORBIT) % 360).toFixed(1);
        put('orb', od, (d) => { orb.style.transform = `rotate(${d}deg)`; });

        // the checklist: each row idle -> turning arc (once the row above is done) -> check
        const spinDeg = ((sc * SPIN) % 360).toFixed(1);
        rowEls.forEach((r, i) => {
          const done = s >= ROW_DONE[i];
          const active = !done && (i === 0 || s >= ROW_DONE[i - 1]);
          put(`m${i}`, `${done ? 2 : active ? 1 : 0}|${active ? spinDeg : ''}`, () => {
            r.idle.style.display = done || active ? 'none' : 'block';
            r.spin.style.display = active ? 'block' : 'none';
            r.spin.style.transform = active ? `rotate(${spinDeg}deg)` : 'none';
            r.ok.style.display = done ? 'block' : 'none';
          });
        });

        // each card's skeleton thins away, then the picture is all that is left
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          c.im.style.transform = restTransform(c.g);
          c.im.style.filter = restFilter(c.g);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cov.style.display = 'none'; c.cov.style.opacity = ''; } else { c.cov.style.display = ''; c.cov.style.opacity = (1 - f).toFixed(3); }
          });
        });
      },
    };
  },
};
