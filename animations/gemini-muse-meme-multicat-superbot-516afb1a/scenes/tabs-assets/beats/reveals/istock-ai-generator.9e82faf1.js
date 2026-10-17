// iStock AI Generator (2024), the AI Generator page of istockphoto.com, the Getty Images family's stock site (a third-party
// walkthrough on YouTube, GaZ1DZk_0aU, 2024-02-15, t=87.5-92.0 s; spec .tmp/clone-9e82faf1/reveal-refs/getty-generative/spec.json,
// confidence 0.62; frames y_gty_pending_02.png, y_gty_resolved.png). This is istockphoto.com's own page, not generativeai.gettyimages.com,
// whose chrome differs. A black nav bar (Video / Photos / Illustrations / Vectors / Music / AI Generator / Resources), the page title
// 'AI Generator' with FAQ / User guide / Prompt builder, a composer box (the prompt, the chips Photos | 16:9 | All Color & Mood, an
// Exclude field), a 'Negative prompt' toggle, the counter 'N / 100 generations' with 'Auto-refill: Off' and the primary button.
// The button is red 'Generate' at rest; once a batch starts it turns green (#0FB786) with a white indeterminate arc spinner and no
// label, the counter ticks 20 -> 19, the result area fills with flat #E5E5E5 tiles each carrying a sparkle glyph (a dark #454545 star
// and pale #A1A1A1 ones, their weight varying from tile to tile) and a teal 'Did you know?' tip toast overlays the middle. When the
// pictures are in, the tiles swap to them one by one (hard swap, no wipe) and the button turns red 'Regenerate'.
// Adapted to ten images: ten tiles in a 4 + 4 + 2 grid, swapping in strict reading order; before Generate the grid slot holds a plain
// 'Inspiration from our experts' strip (the page's gallery, drawn as flat blocks). The sparkle twinkle is drawn from t and is an
// extrapolation (the footage was sampled at 3 fps). Omitted: the iStock / Getty Images logos and wordmarks, the presenter webcam.
// Every picture is our own meme; no logo, wordmark or platform font.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ist';
const ROOT_H = 452, COLS = 4;
const PROMPT = 'a cheerful ghost holding a handwritten note in a lecture hall';
const NAV = ['Video ⌄', 'Photos ⌄', 'Illustrations ⌄', 'Vectors ⌄', 'Music'];
const STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 3C10.7 8 12 9.3 17 10C12 10.7 10.7 12 10 17C9.3 12 8 10.7 3 10C8 9.3 9.3 8 10 3Z"/><path fill="currentColor" d="M18.5 4C18.8 6 19.3 6.5 21.3 6.8C19.3 7.1 18.8 7.6 18.5 9.6C18.2 7.6 17.7 7.1 15.7 6.8C17.7 6.5 18.2 6 18.5 4Z"/></svg>';
const SPARK = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 3C10.7 8 12 9.3 17 10C12 10.7 10.7 12 10 17C9.3 12 8 10.7 3 10C8 9.3 9.3 8 10 3Z"/><path fill="#a1a1a1" d="M18.5 4C18.8 6 19.3 6.5 21.3 6.8C19.3 7.1 18.8 7.6 18.5 9.6C18.2 7.6 17.7 7.1 15.7 6.8C17.7 6.5 18.2 6 18.5 4Z"/><path fill="#a1a1a1" d="M18 15.5C18.2 16.9 18.6 17.3 20 17.5C18.6 17.7 18.2 18.1 18 19.5C17.8 18.1 17.4 17.7 16 17.5C17.4 17.3 17.8 16.9 18 15.5Z"/></svg>';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f4f4f4; color: #1d1d1d; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d6d6d6; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 12px; height: 24px; padding: 0 14px; background: #0c0c0c; font-size: 7.5px; color: #f2f2f2; white-space: nowrap; }
.${P}-nav .ai { display: flex; align-items: center; gap: 3px; }
.${P}-nav .ai svg { width: 9px; height: 9px; color: #5ce0d4; }
.${P}-nav i { width: 1px; height: 11px; background: #555; }
.${P}-main { flex: 1; min-height: 0; box-sizing: border-box; padding: 8px 14px 10px; display: flex; flex-direction: column; }
.${P}-hd { flex: none; display: flex; align-items: center; height: 18px; }
.${P}-ttl { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; }
.${P}-ttl svg { width: 11px; height: 11px; color: #14b4a8; }
.${P}-ttl span { background: linear-gradient(90deg, #14b4a8, #3d4fd0); -webkit-background-clip: text; background-clip: text; color: transparent; }
.${P}-lnk { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 7px; color: #1d1d1d; white-space: nowrap; }
.${P}-lnk span::before { content: ""; display: inline-block; width: 7px; height: 6px; margin-right: 3px; border-radius: 1.5px; background: #1d1d1d; vertical-align: -0.5px; }
.${P}-comp { flex: none; box-sizing: border-box; margin-top: 5px; padding: 8px 9px 7px; border-radius: 6px; background: #fff; box-shadow: 0 0 0 1.2px #111; }
.${P}-pr { font-size: 8.5px; line-height: 12px; color: #1d1d1d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-chips { display: flex; gap: 4px; margin-top: 12px; }
.${P}-chips span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 15px; padding: 0 5px; border-radius: 3px; box-shadow: 0 0 0 1px #bdbdbd; font-size: 6.5px; color: #1d1d1d; white-space: nowrap; }
.${P}-chips em { display: block; width: 6px; height: 6px; box-sizing: border-box; border: 1px solid #1d1d1d; border-radius: 1.5px; }
.${P}-chips em.d { border: 0; border-radius: 50%; background: conic-gradient(#f2483c, #f0c33c, #43c26b, #3d7fe0, #b84fe0, #f2483c); }
.${P}-hr { height: 1px; margin: 7px 0 6px; background: #dadada; }
.${P}-ex { display: flex; align-items: center; gap: 4px; font-size: 7.5px; color: #1d1d1d; white-space: nowrap; }
.${P}-ex em { position: relative; display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #1d1d1d; border-radius: 50%; }
.${P}-ex em::after { content: ""; position: absolute; left: 0.5px; right: 0.5px; top: 2.4px; height: 1.2px; background: #1d1d1d; transform: rotate(-45deg); }
.${P}-row { flex: none; display: flex; align-items: center; height: 34px; padding: 0 3px; }
.${P}-neg { display: flex; align-items: center; gap: 4px; font-size: 7.5px; color: #1d1d1d; white-space: nowrap; }
.${P}-neg i { position: relative; display: block; width: 18px; height: 10px; border-radius: 5px; background: #12a97c; }
.${P}-neg i::after { content: ""; position: absolute; right: 1.5px; top: 1.5px; width: 7px; height: 7px; border-radius: 50%; background: #fff; }
.${P}-cnt { margin-left: auto; margin-right: 10px; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: 7.5px; color: #1d1d1d; white-space: nowrap; }
.${P}-cnt small { font-size: 5.5px; color: #555; }
.${P}-btn { position: relative; flex: none; display: grid; place-items: center; box-sizing: border-box; width: 104px; height: 26px; border-radius: 2px; background: #e4112d; font-size: 8px; font-weight: 600; color: #fff; }
.${P}-arc { position: absolute; left: 50%; top: 50%; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(255, 255, 255, 0) 0deg, #fff 240deg, rgba(255, 255, 255, 0) 256deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
.${P}-zone { position: relative; flex: 1; min-height: 0; margin-top: 4px; }
.${P}-insp { position: absolute; inset: 0; font-size: 8px; font-weight: 600; color: #1d1d1d; }
.${P}-insp div { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; margin-top: 7px; }
.${P}-insp span { aspect-ratio: 16 / 9; border-radius: 2px; background: #e9e9e9; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 3px; }
.${P}-t { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #e5e5e5; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #e5e5e5; }
.${P}-pend svg { width: 15px; height: 15px; }
.${P}-toast { position: absolute; left: 50%; top: 58px; display: flex; width: 214px; height: 44px; margin-left: -107px; border-radius: 4px; background: #fff; box-shadow: 0 1px 6px rgba(0, 0, 0, .22); overflow: hidden; }
.${P}-toast b { flex: none; display: grid; place-items: center; width: 40px; background: linear-gradient(135deg, #279f9e, #0badba); }
.${P}-toast b svg { width: 17px; height: 17px; }
.${P}-toast div { flex: 1; min-width: 0; box-sizing: border-box; padding: 6px 8px; font-size: 6px; line-height: 8px; color: #444; }
.${P}-toast strong { display: block; font-size: 7.5px; line-height: 9px; color: #111; white-space: nowrap; }
.${P}-toast em { display: block; font-style: normal; font-size: 6.5px; font-weight: 700; color: #0badba; }
`;

export default {
  id: 'istock-ai-generator',
  label: 'iStock AI Generator (2024)',
  source: {
    platform: "istockphoto.com's AI Generator page (Getty Images family; a third-party walkthrough on YouTube, 2024-02-15)",
    feature: "The primary button turns from red 'Generate' to green with a white arc spinner, the counter ticks 20 -> 19 / 100 generations, the result area fills with flat #E5E5E5 tiles each with a sparkle glyph and a teal 'Did you know?' tip toast, then the tiles swap to the pictures and the button reads 'Regenerate' (adapted to 10: a 4 + 4 + 2 grid swapping in strict reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=GaZ1DZk_0aU', retrieved: '2026-10-14' }],
    extrapolated: "The footage has four tiles and a 16:9 result ratio; ten tiles in a 4 + 4 + 2 grid, the strict landing order, the sparkle twinkle phase per tile, the 'Inspiration from our experts' strip drawn as flat blocks before Generate and the 'Exclude' text are extrapolated or ours.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'istock-ai-generator');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend">${SPARK}</div></div>`;
    const hour = '<svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 3h12M6 21h12M7.5 3c0 5 3 6 4.5 9c1.5-3 4.5-4 4.5-9M7.5 21c0-5 3-6 4.5-9c1.5 3 4.5 4 4.5 9"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-nav">${NAV.map((n) => `<span>${n}</span>`).join('')}<span class="ai">${STAR}AI Generator</span><i></i><span>Resources ⌄</span></div><div class="${P}-main"><div class="${P}-hd"><div class="${P}-ttl">${STAR}<span>AI Generator</span></div><div class="${P}-lnk"><span>FAQ</span><span>User guide</span><span>Prompt builder</span></div></div><div class="${P}-comp"><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-chips"><span><em></em>Photos</span><span><em></em>16:9</span><span><em class="d"></em>All Color &amp; Mood</span></div><div class="${P}-hr"></div><div class="${P}-ex"><em></em>Exclude: blurry, extra fingers</div></div><div class="${P}-row"><div class="${P}-neg"><i></i>Negative prompt</div><div class="${P}-cnt"><span>20 / 100 generations</span><small>Auto-refill: Off</small></div><div class="${P}-btn"><span>Generate</span><i class="${P}-arc" style="display: none"></i></div></div><div class="${P}-zone"><div class="${P}-insp">Inspiration from our experts<div><span></span><span></span><span></span><span></span></div></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-toast" style="display: none"><b>${hour}</b><div><strong>Enter prompts in your own language</strong><em>Did you know?</em>We support text prompts in 75 languages, empowering worldwide creativity.</div></div></div></div></div>`);
    const btn = root.querySelector(`.${P}-btn`), label = btn.firstElementChild, arc = root.querySelector(`.${P}-arc`), count = root.querySelector(`.${P}-cnt span`);
    const insp = root.querySelector(`.${P}-insp`), grid = root.querySelector(`.${P}-g`), toast = root.querySelector(`.${P}-toast`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), spark: n.querySelector('svg'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const GEN = ctx.cardIn + (ctx.seq(0)[0] - ctx.cardIn) * 0.5;   // the cursor presses Generate; the batch is accepted a beat later
    const TICK = GEN + 0.05;

    return {
      root,
      render(t) {
        const gp = press(t, GEN, 0.06, 0.06, 0.14);
        const state = t < GEN ? 0 : t < ctx.lastLand ? 1 : 2;
        put('btn', `${gp.toFixed(3)}${state}`, () => {
          btn.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none';
          btn.style.background = state === 1 ? '#0fb786' : '#e4112d';
          label.style.display = state === 1 ? 'none' : '';
          label.textContent = state === 2 ? 'Regenerate' : 'Generate';
          arc.style.display = state === 1 ? '' : 'none';
        });
        put('cnt', t >= TICK, (v) => { count.textContent = `${v ? 19 : 20} / 100 generations`; });
        put('gen', t >= GEN, (v) => { insp.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });
        put('toast', state === 1, (v) => { toast.style.display = v ? '' : 'none'; });
        arc.style.transform = `rotate(${((((t * 420) % 360) + 360) % 360).toFixed(1)}deg)`;
        cells.forEach((c, i) => {
          const on = t >= ctx.seq(i)[1];
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? 'visible' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          // the sparkle's dark star swells and fades per tile (colour alpha), a function of t alone
          const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.7));
          c.spark.style.color = `rgba(69, 69, 69, ${a.toFixed(2)})`;
        });
      },
    };
  },
};
