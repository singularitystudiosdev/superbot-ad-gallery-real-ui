// ChatGPT's 2023 DALL-E 3 flow (spec .tmp/clone-9e82faf1/reveal-refs/chatgpt-dalle3/spec.json, confidence 0.74; bilibili
// BV1MB4y1Z7eo at ~45-52 s, frames reveal-refs/chatgpt-dalle3/frames/h2_dalle_pending_t49.8, h2_dalle_pending_blank_t50.0,
// h2_dalle_generating_t50.15, h2_dalle_complete_t52, h2_dalle_stop_generating, h2_dalle_regenerate): a LIGHT chat page (the 2023
// default). The user's message is a white row, the assistant's a pale-grey row under it with a round avatar. The assistant turn opens
// with a small bordered 'DALL·E 3' chip whose grey sub-line reads 'Creating images', then a 2x2 grid of flat light-grey tiles
// (#EEEEEE, a few px apart, barely rounded) each carrying that image's rewritten prompt as small dark text and a little 8-spoke
// spinner; the text clears to a plain blank tile and the chip flips to 'Created 4 images'; then the finished images swap into the
// tiles (a hard swap, no fade seen) as each render completes, and a sentence streams in under the grid. The button above the
// composer is 'Stop generating' (square icon) throughout and becomes 'Regenerate' (circular arrow) when the turn is done.
// This is NOT the 'chatgpt' reveal (the 2025 DARK full-width card: 'Creating images  n of 10', a timer, a progress bar, one row of
// shimmering tiles): here it is a light chat thread with a chip, a 2x2 grid of grey tiles, no counter, no timer, no bar.
// Adapted to ten: three DALL·E 3 chips in turn within one assistant reply (4 + 4 + 2 images, the last grid a single row of two),
// each 'Creating images' then 'Created N images', the tiles landing in reading order, the thread scrolling to the newest chip, and
// the button back to 'Regenerate' after the last. The avatar is a plain purple disc and the chip badge a plain picture glyph: no
// OpenAI or DALL·E logo, wordmark or font is drawn or shipped (the face is the system UI stack), the prompts in the tiles are our
// own wording, and no image, person or character from the footage is reproduced; the tiles are our own meme. Everything is drawn
// from render(t), pure in t: no CSS animation, transition or timer.
import { lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dl3';
const H = 460, HEAD_H = 30, STRIP_H = 34, COMP_H = 46, FOOT_H = 22;   // px: the frame, its model bar, and the strips under the thread
const BODY_H = H - HEAD_H - STRIP_H - COMP_H - FOOT_H;                  // the thread's visible height
const T = 118, GAP = 6, GRID_W = 2 * T + GAP;                           // a tile, the grid's gap, its width
const USER_H = 44, PAD = 14, GUTTER = 52, CHIP_H = 40, SENT_H = 20, JGAP = 14, SCROLL_PAD = 6;
const jobH = (n) => CHIP_H + 8 + (n > 2 ? 2 * T + GAP : T) + 8 + SENT_H;

const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${H}px; border-radius: 12px; background: #fff; box-shadow: inset 0 0 0 1px #e3e3ea; color: #343541; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { position: absolute; left: 0; top: 0; right: 0; height: ${HEAD_H}px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; background: #fff; box-shadow: 0 1px 0 #ececf1; z-index: 2; }
.${P}-seg { display: flex; padding: 2px; gap: 2px; border-radius: 7px; background: #ececf1; font-size: 11.5px; font-weight: 500; color: #6e6e80; }
.${P}-seg span { padding: 3px 14px; border-radius: 5px; }
.${P}-seg span:last-child { background: #fff; color: #343541; box-shadow: 0 1px 2px rgba(0, 0, 0, .12); }
.${P}-bd { position: absolute; left: 0; right: 0; top: ${HEAD_H}px; height: ${BODY_H}px; overflow: hidden; }
.${P}-th { position: absolute; left: 0; top: 0; right: 0; }
.${P}-us { position: absolute; left: 0; right: 0; top: 0; height: ${USER_H}px; display: flex; align-items: center; gap: 14px; padding: 0 16px; background: #fff; font-size: 13px; opacity: 0; }
.${P}-us i { flex: none; width: 24px; height: 24px; border-radius: 4px; background: #7aa89a; }
.${P}-as { position: absolute; left: 0; right: 0; background: #f7f7f8; box-shadow: 0 -1px 0 #ececf1; opacity: 0; }
.${P}-av { position: absolute; left: 16px; top: ${PAD}px; width: 24px; height: 24px; border-radius: 50%; background: #9b72d6; box-sizing: border-box; }
.${P}-av::after { content: ""; position: absolute; left: 7px; top: 7px; width: 10px; height: 10px; box-sizing: border-box; border-radius: 50%; border: 2px solid #fff; }
.${P}-j { position: absolute; left: ${GUTTER}px; right: 16px; opacity: 0; }
.${P}-chip { box-sizing: border-box; display: flex; align-items: center; gap: 9px; width: 156px; height: ${CHIP_H}px; padding: 0 10px 0 8px; border-radius: 9px; border: 1px solid #e0dcec; background: #fff; }
.${P}-bg { flex: none; position: relative; width: 24px; height: 24px; border-radius: 5px; background: #e6e6ee; overflow: hidden; }
.${P}-bg::before { content: ""; position: absolute; left: 6px; top: 5px; width: 5px; height: 5px; border-radius: 50%; background: #8d8da2; }
.${P}-bg::after { content: ""; position: absolute; left: 3px; right: 3px; bottom: 0; height: 9px; background: #8d8da2; clip-path: polygon(0 100%, 30% 25%, 55% 70%, 75% 40%, 100% 100%); }
.${P}-ct b { display: block; font-size: 12.5px; line-height: 15px; font-weight: 600; color: #343541; white-space: nowrap; }
.${P}-ct span { display: block; font-size: 10.5px; line-height: 13px; color: #8e8ea0; white-space: nowrap; }
.${P}-gr { margin-top: 8px; width: ${GRID_W}px; display: grid; grid-template-columns: repeat(2, ${T}px); gap: ${GAP}px; }
.${P}-t { position: relative; width: ${T}px; height: ${T}px; overflow: hidden; border-radius: 4px; background: #eee; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: #eee; }
.${P}-pt { position: absolute; left: 9px; right: 9px; top: 10px; height: 74px; overflow: hidden; font-size: 8px; line-height: 10.5px; color: #38474f; }
.${P}-sp { position: absolute; left: 50%; bottom: 9px; width: 14px; height: 14px; margin-left: -7px; }
.${P}-sp svg { display: block; width: 14px; height: 14px; }
.${P}-sp line { stroke: #38474f; stroke-width: 1.5; stroke-linecap: round; }
.${P}-sn { margin-top: 8px; height: ${SENT_H}px; font-size: 12.5px; line-height: ${SENT_H}px; color: #343541; white-space: nowrap; overflow: hidden; }
.${P}-bs { position: absolute; left: 0; right: 0; bottom: ${COMP_H + FOOT_H}px; height: ${STRIP_H}px; box-sizing: border-box; padding: 4px 18px 0 0; display: flex; justify-content: flex-end; align-items: center; background: #fff; opacity: 0; }
.${P}-bn { box-sizing: border-box; display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 11px; border-radius: 6px; border: 1px solid #d9d9e3; background: #fff; font-size: 12px; font-weight: 500; color: #40414f; white-space: nowrap; }
.${P}-bn svg { width: 12px; height: 12px; fill: none; stroke: #40414f; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cp { position: absolute; left: 0; right: 0; bottom: ${FOOT_H}px; height: ${COMP_H}px; box-sizing: border-box; padding: 0 18px 6px; background: #fff; }
.${P}-in { position: relative; height: 40px; box-sizing: border-box; border-radius: 9px; border: 1px solid #d9d9e3; background: #fff; box-shadow: 0 0 10px rgba(0, 0, 0, .06); display: flex; align-items: center; padding: 0 44px 0 14px; font-size: 13px; white-space: nowrap; overflow: hidden; }
.${P}-in::after { content: ""; position: absolute; right: 10px; top: 10px; width: 18px; height: 18px; border-radius: 5px; background: #ececf1; }
.${P}-in.on::after { background: #5a5a6b; }
.${P}-pl { color: #8e8ea0; }
.${P}-tx { color: #343541; }
.${P}-ft { position: absolute; left: 0; right: 0; bottom: 0; height: ${FOOT_H}px; box-sizing: border-box; padding: 2px 8px 0; text-align: center; font-size: 9.5px; line-height: 14px; color: #8e8ea0; white-space: nowrap; overflow: hidden; background: #fff; }
`;

const ASK = 'make me 10 muse memes';
const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a DALL·E 3 chip is up to four images
// each image's rewritten prompt, as the grey tile shows it before the pixels arrive (our own wording)
const PROMPTS = [
  'A meme-style illustration of a muse at a drawing desk, warm studio light, a bold white caption across the top.',
  'A cheerful cartoon muse holding a quill, a stack of sketches beside her, the caption set in heavy block letters.',
  'A close, playful scene of a muse looking at her own artwork, soft pastel colours, a short caption underneath.',
  'A wide illustration of a muse leaning on a window sill at dusk, calm colours, a witty caption at the bottom.',
  'A muse caught mid-idea with a lightbulb above her head, bright flat colours, a large caption in white.',
  'A friendly muse pointing at a blank canvas, simple background, the caption in a clean bold face.',
  'A sleepy muse with a coffee cup beside a messy desk, muted tones, a one-line caption across the bottom.',
  'A proud muse showing off a finished drawing, confetti around her, a bold caption at the top of the frame.',
  'A muse sitting cross-legged with a sketchbook, gentle light from the left, a small caption on the right.',
  'A final muse portrait in a tidy studio, balanced composition, the caption centred in large white letters.',
];
const SENT = [
  'Here are the illustrations based on your description.',
  'Here are four more, in the same spirit.',
  "And the last two. I hope you find them amusing!",
];
const LEAD_TYPE = 0.17, LEAD_USER = 0.09, LEAD_AS = 0.05, LEAD_CHIP = 0.03;   // s before a chip's first image starts: the composer typing, the user row, the reply row, the chip
const CLEAR = 0.34;                   // share of a job's run when the prompt text clears and the chip flips to 'Created N images'
const LAND = [0.45, 0.95];            // shares of a job's run in which its tiles swap to images, in reading order
const SAY = [0.5, 0.97];              // shares of a job's run in which its sentence streams in
const STOP = '<svg viewBox="0 0 16 16"><rect x="3.5" y="3.5" width="9" height="9" rx="1.6"/></svg>';
const REGEN = '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.5v3h-3"/></svg>';
const SPOKES = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a);
  return `<line x1="${(7 + 3.2 * s).toFixed(2)}" y1="${(7 - 3.2 * c).toFixed(2)}" x2="${(7 + 5.8 * s).toFixed(2)}" y2="${(7 - 5.8 * c).toFixed(2)}" opacity="${(1 - k * 0.11).toFixed(2)}"/>`;
}).join('');

export default {
  id: 'chatgpt-dalle3',
  label: 'ChatGPT (DALL·E 3, 2023)',
  source: {
    platform: 'ChatGPT web (chat.openai.com, light theme), DALL·E 3 image generation, October 2023',
    feature: "DALL·E 3 chip ('Creating images' then 'Created 4 images') over a 2x2 grid of flat grey tiles that fill with the finished images, the composer's 'Stop generating' button becoming 'Regenerate' (adapted to 10 as three chips in turn, 4 + 4 + 2)",
    refs: [
      { url: 'https://www.bilibili.com/video/BV1MB4y1Z7eo', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'chatgpt-dalle3');
    const tile = (i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><div class="${P}-ph"><div class="${P}-pt">${x.esc(PROMPTS[i])}</div><div class="${P}-sp"><svg viewBox="0 0 14 14">${SPOKES}</svg></div></div></div>`;
    const job = (ids, j) => `<div class="${P}-j">
<div class="${P}-chip"><i class="${P}-bg"></i><div class="${P}-ct"><b>DALL·E 3</b><span class="${P}-sub"></span></div></div>
<div class="${P}-gr" style="grid-template-rows: repeat(${ids.length > 2 ? 2 : 1}, ${T}px)">${ids.map(tile).join('')}</div>
<div class="${P}-sn"></div>
</div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-hd"><div class="${P}-seg"><span>GPT-3.5</span><span>GPT-4</span></div></div>
<div class="${P}-bd"><div class="${P}-th"><div class="${P}-us"><i></i><span>${x.esc(ASK)}</span></div><div class="${P}-as"><span class="${P}-av"></span>${JOBS.map(job).join('')}</div></div></div>
<div class="${P}-bs"><span class="${P}-bn"></span></div>
<div class="${P}-cp"><div class="${P}-in"><span class="${P}-pl">Send a message</span><span class="${P}-tx"></span></div></div>
<div class="${P}-ft">ChatGPT may produce inaccurate information about people, places, or facts. ChatGPT September 25 Version</div>
</div>`);
    const th = root.querySelector(`.${P}-th`), us = root.querySelector(`.${P}-us`), as = root.querySelector(`.${P}-as`);
    const bs = root.querySelector(`.${P}-bs`), bn = root.querySelector(`.${P}-bn`);
    const inp = root.querySelector(`.${P}-in`), pl = root.querySelector(`.${P}-pl`), tx = root.querySelector(`.${P}-tx`);
    const els = [...root.querySelectorAll(`.${P}-j`)];
    const jobs = JOBS.map((ids, j) => {
      const m = els[j];
      return {
        ids, m,
        chip: m.querySelector(`.${P}-chip`), sub: m.querySelector(`.${P}-sub`),
        gr: m.querySelector(`.${P}-gr`), sn: m.querySelector(`.${P}-sn`),
        cells: [...m.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), pt: n.querySelector(`.${P}-pt`), sp: n.querySelector(`.${P}-sp`) })),
      };
    });
    // each job's top in the reply row, the row's height, and the scroll that puts a job's bottom just above the composer strips
    const tops = []; let y = PAD;
    JOBS.forEach((ids, j) => { tops[j] = y; els[j].style.top = `${y}px`; y += jobH(ids.length) + JGAP; });
    const asH = y - JGAP + PAD;
    as.style.top = `${USER_H}px`; as.style.height = `${asH}px`;
    const scrolls = JOBS.map((ids, j) => Math.max(0, USER_H + tops[j] + jobH(ids.length) + SCROLL_PAD - BODY_H));
    ctx.gate([...root.querySelectorAll('img')]);
    const text = { sub: [], sn: [], tx: null, bn: null };

    const rise = (el, p, dy) => {
      const e = outCubic(p);
      el.style.opacity = e.toFixed(3);
      el.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
    };

    return {
      root,
      render(t) {
        const A0 = ctx.seq(0)[0];
        let scroll = 0;
        let allDone = true;
        JOBS.forEach((ids, j) => {
          const J = jobs[j];
          const A = ctx.seq(ids[0])[0], B = ctx.seq(ids[ids.length - 1])[1], L = B - A, u = t - A;
          const n = ids.length;

          J.m.style.opacity = u >= -LEAD_CHIP ? '1' : '0';
          rise(J.chip, seg(u, -LEAD_CHIP, -LEAD_CHIP + 0.08), 5);
          J.gr.style.opacity = outCubic(seg(u, -LEAD_CHIP + 0.02, -LEAD_CHIP + 0.1)).toFixed(3);

          // 'Creating images' while the tiles carry their prompt text; the text clears to a blank tile and the chip flips to 'Created N images'
          const cleared = u >= CLEAR * L;
          const sub = cleared ? `Created ${n} images` : 'Creating images';
          if (text.sub[j] !== sub) { J.sub.textContent = sub; text.sub[j] = sub; }
          const spin = `rotate(${(Math.floor(Math.max(u, 0) * 11) % 8) * 45}deg)`;
          let landed = 0;
          J.cells.forEach((c, k) => {
            const g = tiles[ids[k]];
            const land = (LAND[0] + (LAND[1] - LAND[0]) * (k + 1) / n) * L;
            c.im.style.filter = restFilter(g);
            c.im.style.transform = restTransform(g);
            // the swap from grey tile to image is a hard swap at the landing, as in the capture (no cross-fade seen)
            if (u >= land) { c.ph.style.display = 'none'; landed++; } else {
              c.ph.style.display = '';
              c.pt.style.display = cleared ? 'none' : '';
              c.sp.style.display = cleared ? 'none' : '';
              c.sp.style.transform = spin;
            }
          });
          if (landed < n) allDone = false;

          // the sentence under the grid streams in
          const full = SENT[j], sp = seg(u, SAY[0] * L, SAY[1] * L);
          const sn = full.slice(0, Math.ceil(full.length * sp));
          if (text.sn[j] !== sn) { J.sn.textContent = sn; text.sn[j] = sn; }

          // the thread scrolls to keep the newest chip and its grid in view
          scroll = lerp(scroll, scrolls[j], outCubic(seg(u, -LEAD_CHIP, -LEAD_CHIP + 0.2)));
        });
        th.style.transform = scroll === 0 ? 'none' : `translateY(${(-scroll).toFixed(2)}px)`;

        // the composer types the ask, the user row appears, then the reply row
        const tp = seg(t, A0 - LEAD_TYPE, A0 - LEAD_USER);
        const typed = t >= A0 - LEAD_TYPE && t < A0 - LEAD_USER ? ASK.slice(0, Math.ceil(ASK.length * tp)) : '';
        if (text.tx !== typed) { tx.textContent = typed; text.tx = typed; }
        pl.style.display = typed ? 'none' : '';
        inp.classList.toggle('on', typed !== '');
        rise(us, seg(t, A0 - LEAD_USER, A0 - LEAD_USER + 0.08), 5);
        as.style.opacity = t >= A0 - LEAD_AS ? '1' : '0';

        // 'Stop generating' from the moment the reply starts, 'Regenerate' once the last tile is in
        bs.style.opacity = outCubic(seg(t, A0 - LEAD_AS, A0 - LEAD_AS + 0.06)).toFixed(3);
        const label = allDone ? `${REGEN}Regenerate` : `${STOP}Stop generating`;
        if (text.bn !== label) { bn.innerHTML = label; text.bn = label; }
      },
    };
  },
};
