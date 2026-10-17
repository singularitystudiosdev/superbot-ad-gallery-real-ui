// Dawn AI avatars (2022), the phone app's 'AI Avatars' tab while a pack is being made (YouTube ITFLilD6fSU, 2022-12-15, wait panel
// t~160 s and rails t~200 s of the clip; spec .tmp/clone-9e82faf1/reveal-refs/dawn-ai/spec.json, confidence 0.64; frames
// ai_pending_14min_160s.png, ai_pending_13min_results_200s.png, ai_preclick_generate50_52s.png, ai_pick_photos_38s.png). A pale
// lavender page: the title 'AI Avatars', a white rounded prompt field reading '@me as a vampire' with a small dotted glyph at its
// left, and a centred wait panel: a flat illustration of a face (black hair, purple face, closed eyes) crossed by a thin black bar,
// the headline 'We are generating your avatars...' and the line about the '@me' tag. Below it a full-width purple bar splits into
// 'Time left: 14 min' and a lighter 'Notify Me' pill with a bell. There is no spinner ring, percentage or queue position: the dotted
// glyph is the only moving part, the minute count steps down about once a minute (14 -> 13 min), and further down the scroll view the
// themed avatar rails ('Vampire @me', 'Fairy @me', ...) fill with cards as the results arrive.
// Adapted to ten images: the wait panel gives way to two themed rails, 'Vampire @me' and 'Fairy @me', five tiles each, filling one at
// a time in reading order; the bar stays below them and its count steps 14 -> 13 min as the rails open, the one step the footage shows.
// Omitted: the purchase flow screens and the screen that starts the run, the status bar and
// the illustration itself (the face is drawn as a plain neutral shape of our own).
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dwn';
const ROOT_H = 500, COLS = 5, GAP = 8;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 18px; border-radius: 14px; background: #faf6ff; color: #1b1722; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e6ddf0; }
.${P}-top { flex: none; display: flex; align-items: center; height: 44px; font-size: 19px; font-weight: 500; color: #1b1722; }
.${P}-pf { flex: none; display: flex; align-items: center; gap: 10px; box-sizing: border-box; height: 38px; padding: 0 14px; border-radius: 12px; background: #ffffff; box-shadow: 0 0 0 1px #efe8f6; font-size: 12.5px; color: #9a94a5; }
.${P}-dots { flex: none; display: block; width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2.4px dotted #5d5870; }
.${P}-body { position: relative; flex: 1; min-height: 0; margin-top: 8px; }
.${P}-pane { position: absolute; inset: 0; }
.${P}-wait { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.${P}-fig { position: relative; width: 240px; height: 104px; }
.${P}-fig .${P}-dots { position: absolute; left: 36px; top: 36px; }
.${P}-hair { position: absolute; left: 100px; top: 0; width: 42px; height: 26px; border-radius: 16px 16px 4px 4px; background: #17151c; }
.${P}-face { position: absolute; left: 103px; top: 14px; width: 36px; height: 62px; border-radius: 10px 10px 18px 18px / 10px 10px 24px 24px; background: #9a3ff2; }
.${P}-face i { position: absolute; top: 14px; width: 8px; height: 4px; border-bottom: 1.4px solid #17151c; border-radius: 0 0 6px 6px; }
.${P}-bar { position: absolute; left: 60px; top: 62px; width: 120px; height: 2px; background: #17151c; }
.${P}-bar::before, .${P}-bar::after { content: ""; position: absolute; top: -4px; width: 2px; height: 10px; background: #17151c; }
.${P}-bar::before { left: 0; }
.${P}-bar::after { right: 0; }
.${P}-ghost { position: absolute; top: 56px; width: 12px; height: 12px; border-radius: 50%; background: #e7dcf5; }
.${P}-wait h2 { margin: 12px 0 0; font-size: 17px; font-weight: 600; line-height: 22px; color: #1b1722; }
.${P}-wait p { max-width: 420px; margin: 8px 0 0; font-size: 12.5px; line-height: 18px; color: #4a4455; }
.${P}-rail { height: 138px; }
.${P}-rail + .${P}-rail { margin-top: 8px; }
.${P}-cap { height: 20px; font-size: 12.5px; font-weight: 500; line-height: 20px; color: #1b1722; }
.${P}-cap span { color: #8a2be2; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 5 / 6; border-radius: 9px; background: #ebe2f6; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-time { flex: none; display: flex; align-items: center; box-sizing: border-box; height: 48px; margin-top: 10px; padding: 0 12px 0 22px; border-radius: 12px; background: #9b30ff; font-size: 13.5px; color: #ffffff; }
.${P}-time span { flex: 1; }
.${P}-time b { font-weight: 700; }
.${P}-note { flex: none; display: flex; align-items: center; gap: 8px; box-sizing: border-box; height: 34px; padding: 0 14px; border-radius: 9px; background: #c9a0ff; font-size: 13px; font-weight: 500; color: #8a2be2; }
.${P}-note svg { display: block; width: 14px; height: 14px; fill: none; stroke: #8a2be2; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-nav { flex: none; display: flex; height: 44px; margin: 8px -18px 0; border-top: 1px solid #e6ddf0; background: #ffffff; }
.${P}-nav span { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: 9.5px; color: #4a4455; }
.${P}-nav span.${P}-on { font-weight: 600; color: #1b1722; }
.${P}-nav svg { display: block; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const OPEN = 0.40;                                // the wait panel gives way to the rails; the count steps 14 -> 13 min
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1311);   // tile i fills (reading order), the last at 1.68
const GLYPH = '<i class="' + P + '-dots"></i>';
const BELL = '<svg viewBox="0 0 16 16"><path d="M3.8 11.4h8.4M4.6 11.4V7.2a3.4 3.4 0 0 1 6.8 0v4.2M6.8 13.4h2.4"/></svg>';
const NAV = [
  ['AI Avatar', '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M5.4 9.4c.7 1 1.5 1.4 2.6 1.4s1.9-.4 2.6-1.4"/></svg>', true],
  ['AI Art', '<svg viewBox="0 0 16 16"><path d="M8 2.4c-3.2 0-5.6 2.2-5.6 5 0 2.6 2 4.4 4.2 4.4h.8c.8 0 1.2.8.8 1.4-.2.4 0 .8.4.8 3 0 5-2.4 5-5.4 0-3.2-2.4-6.2-5.6-6.2z"/><circle cx="5.6" cy="7.4" r=".7"/><circle cx="8" cy="5.2" r=".7"/><circle cx="10.6" cy="7" r=".7"/></svg>'],
  ['Settings', '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4"/></svg>'],
];
const RAILS = [['Vampire', 0], ['Fairy', 5]];

export default {
  id: 'dawn-ai',
  label: 'Dawn AI avatars (2022)',
  source: {
    platform: "Dawn AI phone app, the 'AI Avatars' tab (iOS, light lavender theme; a tutorial screen recording on YouTube, 2022-12-15)",
    feature: "pale lavender phone page: a prompt field reading '@me as a vampire', a flat face illustration crossed by a thin black bar with a dotted glyph beside it, 'We are generating your avatars...', the '@me' tag line and a purple 'Time left: 14 min' bar with a 'Notify Me' bell (no spinner ring, percentage or queue position); the avatar rails below fill with '<Theme> @me' cards as results arrive (adapted to 10: the panel gives way to two rails, 'Vampire @me' and 'Fairy @me', five tiles each, filling one at a time in reading order; the purchase flow is omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=ITFLilD6fSU', title: 'Dawn AI avatars tutorial', published: '2022-12-15', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "the wait panel gives way to the rails: the footage jump-cuts between the panel (14 min, t~160 s) and the filled rails (13 min, t~200 s), so the swap and its timing are invented; the count steps 14 -> 13 min exactly there and only there (never counted down any faster than the footage shows)",
      "two rails of five tiles ('Vampire @me', 'Fairy @me'): the footage shows three cards in view per rail with the rest scrolled off; ten pictures fill one at a time in reading order (the footage's cards fill unobserved)",
      "the face illustration is a plain neutral shape of our own with a dotted glyph that turns with t until the last tile lands, then holds (the footage's illustration is a textured drawing and the glyph's motion is only described); the ghost circles beside the bar are static",
      "the purple bar stays below the rails (the footage scrolls it up out of view above them)",
      'the portrait phone page reflowed into the 560 px column: the page is stretched to the card width and the tab bar is shown whole',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dawn-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/></div>`;
    const rail = ([name, from]) => `<div class="${P}-rail"><div class="${P}-cap">${name} <span>@me</span></div><div class="${P}-g">${tiles.slice(from, from + 5).map((g, j) => cell(g, from + j)).join('')}</div></div>`;
    const nav = NAV.map(([n, svg, on]) => `<span${on ? ` class="${P}-on"` : ''}>${svg}${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top">AI Avatars</div><div class="${P}-pf">${GLYPH}@me as a vampire</div><div class="${P}-body"><div class="${P}-pane ${P}-wait"><div class="${P}-fig">${GLYPH}<i class="${P}-ghost" style="left: 38px"></i><i class="${P}-ghost" style="left: 52px; opacity: .6"></i><div class="${P}-hair"></div><div class="${P}-face"><i style="left: 7px"></i><i style="right: 7px"></i></div><i class="${P}-bar"></i></div><h2>We are generating your avatars...</h2><p>When the @me tag will be ready, you'll get 50 ready to use avatars, and you'll be able to generate countless alternatives.</p></div><div class="${P}-pane ${P}-rails" style="visibility: hidden">${RAILS.map(rail).join('')}</div></div><div class="${P}-time"><span>Time left: <b>14 min</b></span><div class="${P}-note">Notify Me${BELL}</div></div><div class="${P}-nav">${nav}</div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const wait = q('wait'), rails = q('rails'), left = q('time').querySelector('b'), glyphs = [...root.querySelectorAll(`.${P}-dots`)];
    const thumbs = [...root.querySelectorAll(`.${P}-t img`)];
    ctx.gate(thumbs);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the wait panel gives way to the rails, and the count steps once, 14 -> 13 min (the only step the footage shows)
        const open = s >= OPEN;
        put('open', open, (v) => { wait.style.visibility = v ? 'hidden' : ''; rails.style.visibility = v ? '' : 'hidden'; left.textContent = v ? '13 min' : '14 min'; });

        // the dotted glyph turns with t (the one moving part of the wait panel) until the last tile lands, then holds the angle it reached, so the landed state is static; a function of t alone, shown or not
        const tg = Math.min(t, ctx.cardIn + LAND[LAND.length - 1] * k);
        const deg = Math.round((((tg * 150) % 360) + 360) % 360);
        put('deg', deg, (d) => { glyphs.forEach((g) => { g.style.transform = `rotate(${d}deg)`; }); });

        // the tiles fill in reading order, each a hard swap
        thumbs.forEach((im, i) => put(`i${i}`, s >= LAND[i], (v) => { im.style.visibility = v ? '' : 'hidden'; }));
      },
    };
  },
};
