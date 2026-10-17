// Midjourney's classic Discord /imagine flow (spec .tmp/clone-9e82faf1/reveal-refs/midjourney-discord/spec.json, confidence 0.72;
// bilibili BV14fgweqEna at 64-124 s, frames reveal-refs/midjourney-discord/frames/h_mj_prompt_typed, h_mj_prog93, h_mj_grid93/96/103,
// h_mj_buttons): a DARK Discord text channel (#313338 chat, #383A40 composer, #5865F2 blurple chips). The user posts
// '/imagine prompt: <ask>'; a small 'you used /imagine' reply line sits over the bot's own message, whose bold first line echoes the
// prompt, a '@' mention chip and the status token '(NN%) (fast)' (with Discord's small '(edited)' marker) while the bot's 2x2 grid
// refines in place from a soft, desaturated low-resolution preview to a sharp finished set; on completion the percentage leaves
// the line ('(fast)' stays) and two rows of grey button pills appear under the grid: U1 U2 U3 U4 + a circular reroll, then V1 V2 V3 V4.
// This is NOT the web 'midjourney' reveal (light create page, grey queued tiles, 'N% Complete' label): here the whole thing is a
// dark chat thread with a text status and button rows.
// Adapted to ten: three bot messages in turn (4 + 4 + 2 images, the last one a single row of two), each refining then landing, the
// thread scrolling to the newest message, the images in reading order. The composer types the command before each message. The
// avatar is a plain circle, the bot's name is a generic 'Image Bot', the channel is a generic '# imagine': no Discord or Midjourney
// logo, wordmark or font is drawn or shipped (the face is the system UI stack) and no image from the footage is reproduced; the
// tiles are our own meme. Everything is drawn from render(t), pure in t: no CSS animation, transition or timer.
import { lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mjd';
const H = 460, HEAD_H = 32, COMP_H = 56;       // px: the frame, its channel header, and the composer strip under the thread
const BODY_H = H - HEAD_H - COMP_H;            // the thread's visible height
const T = 100, GAP = 2, GRID_W = 2 * T + GAP;  // a tile, the grid's gap, its width
const BTN_W = (GRID_W - 4 * 5) / 5;            // five buttons span the grid's width, as in the frame
const CMD_H = 18, HEAD_ROW = 20, LINE_H = 20, GRID_TOP = 6, BTN_TOP = 8, BTN_H = 26, BTN_GAP = 5;
const BTNS_H = BTN_TOP + 2 * BTN_H + BTN_GAP;
const msgH = (n) => CMD_H + HEAD_ROW + LINE_H + GRID_TOP + (n > 2 ? 2 * T + GAP : T) + BTNS_H;
const PAD = 10, MGAP = 14, GUTTER = 52;

const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${H}px; border-radius: 12px; background: #313338; box-shadow: inset 0 0 0 1px #26282c; color: #dbdee1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { position: absolute; left: 0; top: 0; right: 0; height: ${HEAD_H}px; box-sizing: border-box; display: flex; align-items: center; gap: 7px; padding: 0 14px; background: #313338; box-shadow: 0 1px 0 #26282c; font-size: 13.5px; font-weight: 600; color: #f2f3f5; z-index: 2; }
.${P}-hd i { font-style: normal; font-weight: 500; font-size: 17px; color: #80848e; }
.${P}-bd { position: absolute; left: 0; right: 0; top: ${HEAD_H}px; height: ${BODY_H}px; overflow: hidden; }
.${P}-th { position: absolute; left: 0; top: 0; right: 0; }
.${P}-m { position: absolute; left: 0; right: 0; opacity: 0; }
.${P}-cmd { position: relative; height: ${CMD_H}px; margin-left: ${GUTTER}px; display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #b5bac1; white-space: nowrap; }
.${P}-cmd::before { content: ""; position: absolute; left: -22px; top: 9px; width: 20px; height: 8px; box-sizing: border-box; border-left: 2px solid #4e5058; border-top: 2px solid #4e5058; border-top-left-radius: 6px; }
.${P}-cmd s { display: block; width: 13px; height: 13px; border-radius: 50%; background: #80848e; }
.${P}-cmd b { font-weight: 500; color: #00a8fc; }
.${P}-av { position: absolute; left: 12px; top: ${CMD_H + 1}px; width: 34px; height: 34px; border-radius: 50%; background: #5d6270; }
.${P}-hr { height: ${HEAD_ROW}px; margin-left: ${GUTTER}px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.${P}-hr b { font-size: 13.5px; font-weight: 600; color: #f2f3f5; }
.${P}-hr em { font-style: normal; padding: 0 4px; height: 14px; border-radius: 3px; background: #5865f2; font-size: 9.5px; line-height: 14px; font-weight: 600; color: #fff; letter-spacing: .02em; }
.${P}-hr span { font-size: 11px; color: #949ba4; }
.${P}-ln { height: ${LINE_H}px; margin-left: ${GUTTER}px; font-size: 13.5px; line-height: ${LINE_H}px; color: #dbdee1; white-space: nowrap; overflow: hidden; }
.${P}-ln b { font-weight: 700; color: #f2f3f5; }
.${P}-ln u { text-decoration: none; padding: 0 2px; border-radius: 3px; background: rgba(88, 101, 242, .3); color: #c9cdfb; font-weight: 500; }
.${P}-ln small { font-size: 10px; color: #949ba4; }
.${P}-gr { margin: ${GRID_TOP}px 0 0 ${GUTTER}px; width: ${GRID_W}px; display: grid; grid-template-columns: repeat(2, ${T}px); gap: ${GAP}px; border-radius: 6px; overflow: hidden; background: #313338; }
.${P}-t { position: relative; width: ${T}px; height: ${T}px; overflow: hidden; background: #2b2d31; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
.${P}-bs { margin-left: ${GUTTER}px; padding-top: ${BTN_TOP}px; width: ${GRID_W}px; }
.${P}-br { display: flex; gap: 5px; height: ${BTN_H}px; opacity: 0; }
.${P}-br + .${P}-br { margin-top: ${BTN_GAP}px; }
.${P}-br span { box-sizing: border-box; width: ${BTN_W}px; height: ${BTN_H}px; border-radius: 4px; background: #4e5058; display: grid; place-items: center; font-size: 12px; font-weight: 500; color: #f2f3f5; }
.${P}-br svg { width: 14px; height: 14px; fill: none; stroke: #5b9dff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cp { position: absolute; left: 0; right: 0; bottom: 0; height: ${COMP_H}px; box-sizing: border-box; padding: 0 12px 12px; background: #313338; z-index: 2; }
.${P}-in { position: relative; height: 40px; box-sizing: border-box; border-radius: 8px; background: #383a40; display: flex; align-items: center; gap: 8px; padding: 0 12px 0 44px; font-size: 13.5px; white-space: nowrap; overflow: hidden; }
.${P}-in::before { content: ""; position: absolute; left: 12px; top: 10px; width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(#383a40, #383a40) center / 10px 2px no-repeat, linear-gradient(#383a40, #383a40) center / 2px 10px no-repeat, #b5bac1; }
.${P}-ph { color: #949ba4; }
.${P}-ck { display: none; height: 20px; padding: 0 6px; border-radius: 4px; background: rgba(88, 101, 242, .3); font-size: 12px; line-height: 20px; color: #c9cdfb; }
.${P}-tx { color: #dbdee1; }
`;

const ASK = 'make me 10 muse memes';
const PARAM = '--v 5.2 -';
const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a job is up to four images
const STAMPS = ['Today at 15:02', 'Today at 15:02', 'Today at 15:03'];
const LEAD_CMD = 0.14, LEAD_BOT = 0.09, LEAD_TYPE = 0.17, SEND = 0.03;   // s before a job's first image starts: the reply line, the bot message, the composer typing
const FILL = [0.06, 0.72];            // shares of a job's run: the soft preview starts, the percentage reaches 99 and the job finishes
const BTN_AT = [[0.74, 0.86], [0.8, 0.92]];   // shares of a job's run for the U row and the V row
const BLUR = 16;                      // the preview's blur in px
const REROLL = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>';

export default {
  id: 'midjourney-discord',
  label: 'Midjourney (Discord, classic)',
  source: {
    platform: 'Midjourney bot in a Discord text channel (desktop client, dark theme), classic /imagine flow',
    feature: "/imagine: the bot's message echoes the prompt with a mention and '(NN%) (fast)' while its 2x2 grid refines from a soft preview to sharp, then U1-U4 / V1-V4 button rows appear (adapted to 10 as three bot messages in turn, 4 + 4 + 2)",
    refs: [
      { url: 'https://www.bilibili.com/video/BV14fgweqEna', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'midjourney-discord');
    const tile = (i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/></div>`;
    const rowBtns = (labels) => labels.map((l) => `<span>${l}</span>`).join('');
    const msg = (ids, j) => {
      const n = ids.length;
      const U = ids.map((_, k) => `U${k + 1}`), V = ids.map((_, k) => `V${k + 1}`);
      return `<div class="${P}-m" style="top: ${PAD}px">
<div class="${P}-cmd"><s></s><span>you used</span><b>/imagine</b></div>
<span class="${P}-av"></span>
<div class="${P}-hr"><b>Image Bot</b><em>BOT</em><span>${x.esc(STAMPS[j])}</span></div>
<div class="${P}-ln"><b>${x.esc(`${ASK} ${PARAM}`)}</b> <u>@you</u> <span class="${P}-st"></span> <small class="${P}-ed">(edited)</small></div>
<div class="${P}-gr" style="grid-template-rows: repeat(${n > 2 ? 2 : 1}, ${T}px)">${ids.map(tile).join('')}</div>
<div class="${P}-bs"><div class="${P}-br">${rowBtns(U)}${n > 2 ? `<span>${REROLL}</span>` : ''}</div><div class="${P}-br">${rowBtns(V)}</div></div>
</div>`;
    };
    const root = x.el(`<div class="${P}">
<div class="${P}-hd"><i>#</i>imagine</div>
<div class="${P}-bd"><div class="${P}-th">${JOBS.map(msg).join('')}</div></div>
<div class="${P}-cp"><div class="${P}-in"><span class="${P}-ph">Message #imagine</span><span class="${P}-ck">imagine</span><span class="${P}-ck">prompt</span><span class="${P}-tx"></span></div></div>
</div>`);
    const th = root.querySelector(`.${P}-th`);
    const msgs = [...root.querySelectorAll(`.${P}-m`)];
    const ph = root.querySelector(`.${P}-ph`), chips = [...root.querySelectorAll(`.${P}-ck`)], tx = root.querySelector(`.${P}-tx`);
    const jobs = JOBS.map((ids, j) => {
      const m = msgs[j];
      return {
        ids, m,
        cmd: m.querySelector(`.${P}-cmd`), av: m.querySelector(`.${P}-av`),
        hr: m.querySelector(`.${P}-hr`), ln: m.querySelector(`.${P}-ln`),
        st: m.querySelector(`.${P}-st`), ed: m.querySelector(`.${P}-ed`),
        gr: m.querySelector(`.${P}-gr`),
        rows: [...m.querySelectorAll(`.${P}-br`)],
        ims: [...m.querySelectorAll('img')],
      };
    });
    // each message's top in the thread, and the scroll that puts its bottom just above the composer
    const tops = []; let y = PAD;
    JOBS.forEach((ids, j) => { tops[j] = y; msgs[j].style.top = `${y}px`; y += msgH(ids.length) + MGAP; });
    const scrolls = JOBS.map((ids, j) => Math.max(0, tops[j] + msgH(ids.length) + PAD - BODY_H));
    ctx.gate([...root.querySelectorAll('img')]);
    const text = { st: [], tx: null };

    const rise = (el, p, dy) => {
      const e = outCubic(p);
      el.style.opacity = e.toFixed(3);
      el.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
    };

    return {
      root,
      render(t) {
        let typed = '';   // what the composer shows: the command being typed before a message, else its placeholder
        let scroll = 0;
        JOBS.forEach((ids, j) => {
          const J = jobs[j];
          const A = ctx.seq(ids[0])[0], B = ctx.seq(ids[ids.length - 1])[1], L = B - A, u = t - A;

          // the composer types the command, sends it, and the reply line and the bot's message follow
          const tp = seg(t, A - LEAD_TYPE, A - SEND);
          if (t >= A - LEAD_TYPE && t < A) typed = ASK.slice(0, Math.ceil(ASK.length * tp));
          rise(J.cmd, seg(u, -LEAD_CMD, -LEAD_CMD + 0.08), 5);
          const bp = seg(u, -LEAD_BOT, -LEAD_BOT + 0.08);
          J.m.style.opacity = bp > 0 ? '1' : '0';
          J.av.style.opacity = bp.toFixed(3);
          rise(J.hr, bp, 5);
          rise(J.ln, bp, 5);
          J.gr.style.opacity = outCubic(bp).toFixed(3);

          // the status token: '(NN%) (fast)' counting up while the grid refines, then '(fast)' alone
          const f = seg(u, FILL[0] * L, FILL[1] * L);
          const done = u >= FILL[1] * L;
          const st = done ? '(fast)' : `(${Math.round(99 * f)}%) (fast)`;
          if (text.st[j] !== st) { J.st.textContent = st; text.st[j] = st; }
          J.ed.style.display = done ? 'none' : '';

          // all four cells fill together from a soft, desaturated preview; each then sharpens in place, in reading order, the last
          // one sharp as the job finishes
          const fade = seg(u, FILL[0] * L, (FILL[0] + 0.1) * L);
          J.ims.forEach((im, k) => {
            const g = tiles[ids[k]];
            const end = FILL[0] + (FILL[1] - FILL[0]) * (0.55 + 0.45 * (k + 1) / ids.length);
            const p = seg(u, (FILL[0] + 0.04) * L, end * L);
            im.style.opacity = fade >= 1 ? '1' : fade.toFixed(3);
            if (p >= 1) {
              im.style.filter = restFilter(g);
              im.style.transform = restTransform(g);
            } else {
              const e = outCubic(p);
              im.style.filter = `blur(${lerp(BLUR, 0, e).toFixed(2)}px) saturate(${lerp(0.55, 1, e).toFixed(3)}) ${g.grade}`.trim();
              im.style.transform = `scale(${(g.zoom * lerp(1.1, 1, e)).toFixed(4)})`;
            }
          });

          // the button rows, the U row then the V row
          J.rows.forEach((r, k) => rise(r, seg(u, BTN_AT[k][0] * L, BTN_AT[k][1] * L), 4));

          // the thread scrolls to keep the newest message in view as the next one is posted
          if (j > 0) scroll = lerp(scroll, scrolls[j], outCubic(seg(u, -LEAD_CMD, -LEAD_CMD + 0.2)));
        });
        th.style.transform = scroll === 0 ? 'none' : `translateY(${(-scroll).toFixed(2)}px)`;

        const shown = typed ? 1 : 0;
        ph.style.display = shown ? 'none' : '';
        chips.forEach((c) => { c.style.display = shown ? 'inline-block' : 'none'; });
        if (text.tx !== typed) { tx.textContent = typed; text.tx = typed; }
      },
    };
  },
};
