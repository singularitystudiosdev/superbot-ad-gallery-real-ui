// Hailuo AI's image agent, the pending state of a style-transfer thread (spec .tmp/clone-9e82faf1/reveal-refs/hailuo/spec.json,
// confidence 0.6; bilibili BV1bonyzyEx3 at 10.5-14.5 s, frames reveal-refs/hailuo/frames/g4b_style_pending_t* and sheets
// g4b_sheet_style_pending.png, g4b_sheet_3skills.png). A dark app frame: a plain-text 'Hailuo AI' header and a thread title; a
// thread of a user bubble over a reference-thumbnail row, an agent bubble '好的，我已经开始处理了', an indented '智能规划' plan
// block with a few plan rows, and an animated status line '正在详细描述中'; the '创作中...' indicator sits directly above the
// composer (placeholder '告诉我你脑海中的画面', a '+' attach, a purple round send arrow) while the canvas stays dark, then the
// canvas fills with the image. No percentage, bar or queue anywhere.
// Adapted to ten: the plan block and the status line run once, the thread scrolls to the dark canvas, and ten tiles fill it in
// reading order, tile i on ctx.seq(i); the indicator leaves and the send arrow lights once the last has landed. The promo bar and
// the account credit balance are left out. The tiles, the thumbnails and the plan rows are our own: nothing from the reference
// footage is reproduced, the avatar and the glyphs are plain shapes, and the face is the system UI stack: no logo, wordmark or
// font of the platform is drawn or shipped. The status dots and the plan rows are drawn from render(t), never CSS animation.
import { seg, lerp, outCubic, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hl';
const H = 436, HEAD_H = 34, BOTTOM_H = 106;   // px: the frame, its header, and the indicator + composer under the thread
const BODY_H = H - HEAD_H - BOTTOM_H;         // the thread's visible height
const PAD = 14, CANVAS_H = 219;               // the thread's side padding; the canvas panel's height
// the thread's own height down to the canvas's bottom edge (every block below has a fixed height), so the scroll is a constant
const U_H = 92, A_H = 22, PL_H = 86, ST_H = 16, GAP = [10, 8, 8, 12];
const THREAD_H = 10 + U_H + GAP[0] + A_H + GAP[1] + PL_H + GAP[2] + ST_H + GAP[3] + CANVAS_H;
const SCROLL = THREAD_H - BODY_H + 6;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${H}px; border-radius: 16px; background: #121016; box-shadow: inset 0 0 0 1px #221f29; color: #ecebf1; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { position: absolute; left: 0; top: 0; right: 0; height: ${HEAD_H}px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; padding: 0 ${PAD}px; font-size: 13px; z-index: 2; background: #121016; }
.${P}-hd b { font-weight: 600; color: #f4f3f8; }
.${P}-hd span { font-size: 11px; color: #8d8a96; }
.${P}-bd { position: absolute; left: 0; right: 0; top: ${HEAD_H}px; height: ${BODY_H}px; overflow: hidden; }
.${P}-th { position: absolute; left: 0; top: 0; right: 0; box-sizing: border-box; padding: 10px ${PAD}px 0; }
.${P}-u { height: ${U_H}px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.${P}-refs { display: flex; gap: 6px; }
.${P}-refs i { display: block; width: 56px; height: 56px; border-radius: 10px; overflow: hidden; background: #1c1a21; }
.${P}-refs img, .${P}-tl img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-bub { box-sizing: border-box; height: 30px; padding: 0 12px; border-radius: 10px; background: #1c1a21; font-size: 12px; line-height: 30px; color: #ecebf1; white-space: nowrap; }
.${P}-a { height: ${A_H}px; margin-top: ${GAP[0]}px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #f4f3f8; white-space: nowrap; }
.${P}-av { flex: none; width: 18px; height: 18px; border-radius: 50%; background: conic-gradient(from 40deg, #7c5cff, #d06bff, #4d7dff, #7c5cff); display: grid; place-items: center; }
.${P}-av::after { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #121016; }
.${P}-pl { box-sizing: border-box; height: ${PL_H}px; margin-top: ${GAP[1]}px; padding: 8px 10px; border-radius: 10px; background: rgba(124, 92, 255, .08); }
.${P}-chip { display: inline-flex; align-items: center; gap: 5px; height: 18px; padding: 0 8px 0 6px; border-radius: 9px; background: rgba(124, 92, 255, .16); font-size: 11px; color: #cfc4ff; white-space: nowrap; }
.${P}-chip svg { width: 10px; height: 10px; fill: #b7a6ff; }
.${P}-rw { display: flex; align-items: center; gap: 6px; height: 16px; margin-top: 4px; font-size: 11px; line-height: 16px; color: #a19eab; white-space: nowrap; }
.${P}-rw + .${P}-rw { margin-top: 0; }
.${P}-rw::before { content: ""; flex: none; width: 0; height: 0; border-left: 5px solid #7c5cff; border-top: 3.5px solid transparent; border-bottom: 3.5px solid transparent; }
.${P}-st { height: ${ST_H}px; margin-top: ${GAP[2]}px; font-size: 11px; line-height: ${ST_H}px; color: #7f7c89; white-space: nowrap; }
.${P}-st i { display: inline-block; width: 18px; font-style: normal; text-align: left; }
.${P}-cv { box-sizing: border-box; height: ${CANVAS_H}px; margin-top: ${GAP[3]}px; padding: 8px; border-radius: 12px; background: #0c0b10; box-shadow: inset 0 0 0 1px #1f1c26; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 6px; }
.${P}-tl { position: relative; border-radius: 8px; overflow: hidden; background: #15131a; }
.${P}-tl img { position: absolute; inset: 0; opacity: 0; }
.${P}-bt { position: absolute; left: 0; right: 0; bottom: 0; height: ${BOTTOM_H}px; box-sizing: border-box; padding: 0 ${PAD}px 12px; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; background: #121016; z-index: 2; }
.${P}-mk { display: flex; align-items: center; gap: 6px; height: 22px; font-size: 11px; color: #e4e2ea; white-space: nowrap; }
.${P}-mk .${P}-av { width: 16px; height: 16px; }
.${P}-mk .${P}-av::after { width: 7px; height: 7px; }
.${P}-mk svg { width: 10px; height: 10px; fill: #e4e2ea; }
.${P}-cp { position: relative; box-sizing: border-box; height: 68px; border-radius: 12px; background: #1c1a21; padding: 10px 12px; }
.${P}-ph { font-size: 12px; line-height: 16px; color: #6b6872; white-space: nowrap; }
.${P}-pl2 { position: absolute; left: 10px; bottom: 9px; width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; background: #29262f; }
.${P}-pl2::before, .${P}-pl2::after { content: ""; position: absolute; left: 50%; top: 50%; background: #a19eab; transform: translate(-50%, -50%); }
.${P}-pl2::before { width: 10px; height: 1.5px; }
.${P}-pl2::after { width: 1.5px; height: 10px; }
.${P}-go { position: absolute; right: 10px; bottom: 9px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; }
.${P}-go svg { width: 13px; height: 13px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
`;

const ASK = 'make me 10 muse memes';
const AGENT = '好的，我已经开始处理了';
const PLAN = '智能规划';
const ROWS = ['保留原图里的主体和笑点。', '为十张图分别设计不同的构图与色调。', '按顺序逐张生成这十张图片。'];
const STATUS = '正在详细描述中';
const MAKING = '创作中...';
const PH = '告诉我你脑海中的画面';
// the thread's beats in seconds from the card's entrance, laid out for the first tile's start S0 (the beat's own 0.25 s) and
// stretched with it: the agent bubble, the plan block and its rows, the status line, then the scroll to the canvas
const S0 = 0.25;
const AGENT_AT = [0.0, 0.1], PLAN_AT = [0.06, 0.14], ROW_AT = [0.1, 0.15, 0.2], ROW_LEN = 0.07;
const STATUS_AT = [0.22, 0.28], SCROLL_AT = [0.2, 0.5];
const DOT_S = 0.12;            // a status dot's step, seconds
const SPARK = '<svg viewBox="0 0 10 10"><path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>';
const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;
const DIM = [58, 48, 112], LIT = [124, 92, 255];

export default {
  id: 'hailuo',
  label: 'Hailuo AI (image agent)',
  source: {
    platform: 'Hailuo AI image agent (mobile app, style-transfer thread, dark theme)',
    feature: "Agent thread: user ask, '好的，我已经开始处理了', a '智能规划' plan block with rows, the animated status '正在详细描述中', and '创作中...' above the composer while the canvas stays dark, then the canvas filling with the image (adapted to 10: the plan and status run once, then ten tiles fill the canvas in reading order)",
    refs: [
      { url: 'https://www.bilibili.com/video/BV1bonyzyEx3', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'hailuo');
    const im = (g, alt) => `<img src="${src}" width="870" height="1024" decoding="sync" alt="${alt}" style="transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-hd"><b>Hailuo AI</b><span>Untitled</span></div>
<div class="${P}-bd"><div class="${P}-th">
<div class="${P}-u"><div class="${P}-refs"><i>${im(tiles[0], 'Reference 1')}</i><i>${im(tiles[1], 'Reference 2')}</i></div><div class="${P}-bub">${x.esc(ASK)}</div></div>
<div class="${P}-a"><span class="${P}-av"></span><span>${x.esc(AGENT)}</span></div>
<div class="${P}-pl"><span class="${P}-chip">${SPARK}${x.esc(PLAN)}</span>${ROWS.map((r) => `<div class="${P}-rw">${x.esc(r)}</div>`).join('')}</div>
<div class="${P}-st">${x.esc(STATUS)}<i></i></div>
<div class="${P}-cv">${tiles.map((g, i) => `<div class="${P}-tl">${im(g, `Muse meme ${i + 1}`)}</div>`).join('')}</div>
</div></div>
<div class="${P}-bt"><div class="${P}-mk"><span class="${P}-av"></span>${x.esc(MAKING)}${SPARK}</div><div class="${P}-cp"><div class="${P}-ph">${x.esc(PH)}</div><span class="${P}-pl2"></span><span class="${P}-go">${ARROW}</span></div></div>
</div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const th = q('th'), agent = q('a'), plan = q('pl'), rows = [...root.querySelectorAll(`.${P}-rw`)];
    const st = q('st'), dots = st.querySelector('i'), mk = q('mk'), go = q('go'), ph = q('ph');
    const cells = [...root.querySelectorAll(`.${P}-tl img`)];
    const imgs = [...root.querySelectorAll('img')];
    ctx.gate(imgs);
    let dotsN = -1;

    return {
      root,
      render(t) {
        const k = (ctx.seq(0)[0] - ctx.cardIn) / S0;   // the beat's first-tile start against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const rise = (el, a, len, dy) => {
          const p = outCubic(seg(s, a, a + len));
          el.style.opacity = p.toFixed(3);
          el.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
        };

        // the agent bubble, then the plan block (its chip, then its rows one after another)
        rise(agent, AGENT_AT[0], AGENT_AT[1], 6);
        rise(plan, PLAN_AT[0], PLAN_AT[1], 6);
        rows.forEach((r, i) => rise(r, ROW_AT[i], ROW_LEN, 4));

        // the status line, its dots stepping on (the dots' count is the only motion in the text)
        const sp = outCubic(seg(s, STATUS_AT[0], STATUS_AT[1]));
        const gone = seg(t, ctx.seq(0)[1], ctx.seq(0)[1] + 0.1);
        st.style.opacity = (sp * (1 - gone)).toFixed(3);
        const n = s < STATUS_AT[0] ? 0 : Math.floor((t - ctx.cardIn - STATUS_AT[0] * k) / (DOT_S * k)) % 4;
        if (n !== dotsN) { dotsN = n; dots.textContent = '.'.repeat(n); }

        // the thread scrolls down to the canvas, which is dark until each tile lands
        const sc = outCubic(seg(s, SCROLL_AT[0], SCROLL_AT[1]));
        th.style.transform = `translateY(${(-SCROLL * sc).toFixed(2)}px)`;

        // each tile fills in on its own window, from a touch of blur and oversize, and rests at its crop's CSS
        cells.forEach((el, i) => {
          const [a, b] = ctx.seq(i);
          const p = seg(t, a, b), e = outCubic(p), g = tiles[i];
          el.style.opacity = (p >= 1 ? 1 : clamp(e * 1.4)).toFixed(3);
          if (p >= 1) { el.style.filter = restFilter(g); el.style.transform = restTransform(g); return; }
          el.style.filter = `blur(${((1 - e) * 5).toFixed(2)}px) ${g.grade}`.trim();
          el.style.transform = `scale(${(g.zoom * lerp(1.06, 1, e)).toFixed(4)})`;
        });

        // '创作中...' stays above the composer until the last tile has landed; the send arrow lights as the composer frees up
        const done = seg(t, ctx.lastLand, ctx.lastLand + 0.2);
        mk.style.opacity = (1 - done).toFixed(3);
        mk.style.visibility = done >= 1 ? 'hidden' : '';
        go.style.background = mix(DIM, LIT, done);
        ph.style.opacity = lerp(0.7, 1, done).toFixed(3);
      },
    };
  },
};
