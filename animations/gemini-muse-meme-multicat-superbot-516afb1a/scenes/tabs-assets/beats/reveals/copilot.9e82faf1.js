// A 2026 assistant chat surface generating an image (one screen recording, frames c_gen_g001..g056 under
// .tmp/clone-9e82faf1/reveal-refs/copilot, spec confidence 0.66 for the product, here grounded by that single clip): a deep
// navy chat, the user's prompt as a right-aligned bubble, an assistant status line that streams while it works (the
// frames show 'Brushing soft watercolor dawn hues…'; here an ellipsis that animates), under it the image slot, first a dark
// navy square with two dots, then a soft, featureless grey rounded square that hard-swaps to the finished image (no fade),
// then a short 'ready' line with an action row (like, dislike, copy, share and an 'Edit in a page' link), and a rounded
// composer at the bottom whose round button shows a stop square while it works. For ten images the one message holds ten
// slots that swap in reading order. A stand-in disc is the assistant's mark; no Microsoft logo or wordmark is drawn.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cp';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 10px 14px 12px; border-radius: 14px; background: #0b0f1d; color: #dfe3f0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px #1a2036; }
.${P}-hd { display: flex; align-items: center; gap: 7px; height: 22px; font-size: 11px; font-weight: 600; color: #eef0f8; }
.${P}-hd i { display: block; width: 14px; height: 14px; border-radius: 50%; background: conic-gradient(#4f8cff, #a05cff, #ff6fa8, #ffb454, #4f8cff); }
.${P}-u { display: flex; justify-content: flex-end; margin-top: 8px; }
.${P}-u span { padding: 7px 12px; border-radius: 12px; background: #1b2138; font-size: 10.5px; line-height: 14px; color: #e6e9f4; }
.${P}-st { height: 18px; font-size: 11px; line-height: 18px; color: #a8aec6; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
.${P}-s { position: relative; aspect-ratio: 870 / 1024; border-radius: 12px; overflow: hidden; background: #8d8f97; }
.${P}-s b { position: absolute; inset: 0; background: radial-gradient(60% 45% at 30% 28%, rgba(196, 198, 205, .8), transparent 70%), radial-gradient(55% 40% at 72% 66%, rgba(110, 112, 120, .75), transparent 72%), linear-gradient(180deg, #9a9ca4, #80828a); filter: blur(5px); transform: scale(1.1); }
.${P}-s b::after { content: ""; position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -8px 0 0 -3px; border-radius: 50%; background: #5b6bd5; box-shadow: 7px 8px 0 -1px #5b6bd5; opacity: 0; }
.${P}-s.pre { background: #10162c; }
.${P}-s.pre b { opacity: 0; }
.${P}-s.pre b::after { opacity: 1; }
.${P}-s img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-line { position: relative; height: 18px; margin-top: 10px; }
.${P}-line > div { position: absolute; left: 0; top: 0; right: 0; }
.${P}-ok { height: 18px; font-size: 11px; line-height: 18px; color: #dfe3f0; }
.${P}-act { display: flex; align-items: center; gap: 12px; height: 22px; margin-top: 12px; font-size: 9.5px; color: #a8aec6; }
.${P}-act svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-act em { font-style: normal; display: flex; align-items: center; gap: 4px; }
.${P}-cmp { display: flex; align-items: center; gap: 9px; height: 40px; margin-top: 10px; padding: 0 7px 0 12px; border-radius: 18px; background: #131933; box-shadow: 0 0 0 1px #232b4a; }
.${P}-cmp .ph { flex: 1; min-width: 0; font-size: 10.5px; color: #8089aa; }
.${P}-cmp .pl { font-size: 15px; line-height: 1; color: #a8aec6; }
.${P}-cmp .md { padding: 3px 8px; border-radius: 999px; background: #1d2545; font-size: 9px; color: #c4c9de; }
.${P}-send { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #5568e8; }
.${P}-send i { display: block; width: 9px; height: 9px; border-radius: 2px; background: #fff; }
`;

const ICON = {
  up: '<path d="M8 11v8H5v-8z"/><path d="M8 11l3-6c1.5 0 2.2 1 2 2.4L12.6 10H18a1.8 1.8 0 0 1 1.8 2.1l-1 5.4A2 2 0 0 1 16.8 19H8"/>',
  down: '<path d="M8 13V5H5v8z"/><path d="M8 13l3 6c1.5 0 2.2-1 2-2.4L12.6 14H18a1.8 1.8 0 0 0 1.8-2.1l-1-5.4A2 2 0 0 0 16.8 5H8"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  share: '<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  edit: '<path d="M5 19l1-4 9-9 3 3-9 9z"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24">${ICON[k]}</svg>`;

export default {
  id: 'copilot',
  label: 'Copilot',
  source: {
    platform: 'Microsoft Copilot chat (copilot.microsoft.com), 2026 build',
    feature: 'Image generation in a chat message: animated ellipsis status, a soft grey rounded placeholder that hard-swaps to the image, then an action row (adapted to 10)',
    refs: [{ url: 'https://www.youtube.com/watch?v=bw8SRfe_-ug', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'copilot');
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><i></i>Copilot</div><div class="${P}-u"><span>Make 10 Muse memes of a cheerful ghost holding a handwritten note</span></div><div class="${P}-line"><div class="${P}-st"></div><div class="${P}-ok" style="visibility:hidden">Your Muse memes are ready now.</div></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-s pre"><b></b><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div><div class="${P}-act" style="visibility:hidden">${ic('up')}${ic('down')}${ic('copy')}${ic('share')}<em>${ic('edit')}Edit in a page</em></div><div class="${P}-cmp"><span class="pl">+</span><span class="ph"></span><span class="md">Smart</span><span class="${P}-send"><i></i></span></div></div>`);
    const st = root.querySelector(`.${P}-st`), ok = root.querySelector(`.${P}-ok`), act = root.querySelector(`.${P}-act`);
    const ph = root.querySelector(`.${P}-cmp .ph`), stop = root.querySelector(`.${P}-send`);
    const slots = [...root.querySelectorAll(`.${P}-s`)].map((n) => ({ n, im: n.querySelector('img'), mode: null }));
    ctx.gate(slots.map((s) => s.im));
    let stText = null, fin = null;

    return {
      root,
      render(t) {
        const pre = t < ctx.cardIn + 0.14;  // the empty dotted square that opens the slot, before the grey placeholder
        slots.forEach((s, i) => {
          const mode = t >= ctx.seq(i)[1] ? 'img' : pre ? 'pre' : 'grey';
          if (mode !== s.mode) {
            s.im.style.visibility = mode === 'img' ? 'visible' : 'hidden';
            s.n.classList.toggle('pre', mode === 'pre');
            s.n.firstElementChild.style.display = mode === 'img' ? 'none' : '';
            s.mode = mode;
          }
          s.im.style.filter = restFilter(tiles[i]);
          s.im.style.transform = restTransform(tiles[i]);
        });
        // the status line's ellipsis animates; the line is replaced by the 'ready' line with its action row at the end
        const finished = t >= ctx.lastLand;
        const txt = `Painting your Muse memes${'.'.repeat(1 + (Math.floor(t * 3) % 3))}`;
        if (txt !== stText) { st.textContent = txt; stText = txt; }
        if (finished !== fin) {
          st.style.visibility = finished ? 'hidden' : '';
          ok.style.visibility = finished ? '' : 'hidden';
          act.style.visibility = finished ? '' : 'hidden';
          ph.textContent = finished ? 'Ask anything' : 'Message Copilot';
          stop.style.display = finished ? 'none' : '';
          fin = finished;
        }
      },
    };
  },
};
