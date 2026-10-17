// SeaArt (海艺) as it appears on seaart.ai's 创作流 page (Bilibili BV178411q7pM, a 2023-09 tutorial recording, t=182.0-183.5 s;
// spec .tmp/clone-9e82faf1/reveal-refs/seaart/spec.json, confidence 0.78; frames o_seaart_pending_t182.2 / _tasklist / _progress_queue /
// _result_t183.3). A near-black chat-style page: a left nav (创作流 selected, 高级创作 with 图生图 / 条件生图, 工具), a top row with the
// 私人频道 dropdown and a search pill, a centre feed of task records (round robot avatar, '海艺-机器人', the chips 文生图 / 默认, a time
// stamp, the prompt line), a composer ('请输入提示词' and a send arrow) and a right rail (创作 | 实验室 tabs; 参数: 队列 普通队列,
// 模式 默认, 作品权限 公开; 模型设置; 基础设置 with 图片数量, 图片模式 高清, 图片尺寸 2:3, 宽 512, 高 768). Submitting raises a green toast
// '创建成功'. A record then shows three pending states: queued ('等待开始 .' and a red 取消任务), running (a flat green bar and
// '任务完成 N% .' and 取消任务), and dark placeholder tiles each with two small blue twinkle dots, swapped for the finished images.
// Adapted to ten images: three records issued in turn (4 + 4 + 2 tiles), each walking queued -> percentage -> twinkle tiles ->
// landed, the tiles landing strictly one after another (the dots twinkle from render(t)). Omitted: the credit-cost counter at the
// composer and the app's logo. The footage's pictures are never reproduced: every tile is our own meme, and the avatar is a plain
// neutral robot face, with no logo, wordmark or platform font (system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT, hash } from './util.9e82faf1.js';

const P = 'rv-sa';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_H = 520, NAV_W = 62, RAIL_W = 118, COLS = 5;
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #0b0e13; color: #dfe3ea; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a1f29; }
.${P}-nav { flex: none; box-sizing: border-box; width: ${NAV_W}px; padding: 8px 6px; background: #0b0e13; }
.${P}-brand { display: flex; align-items: center; gap: 4px; height: 22px; padding-left: 2px; font-size: 8px; font-weight: 600; color: #eef1f6; white-space: nowrap; }
.${P}-brand i { display: block; width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 2px #4c6bff; }
.${P}-ni { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; margin-top: 4px; padding: 0 5px; border-radius: 4px; font-size: 7px; color: #a6adba; white-space: nowrap; }
.${P}-ni.on { background: #1c2a4a; color: #eef1f6; }
.${P}-ni i { display: block; width: 7px; height: 6px; border-radius: 1.5px; box-shadow: inset 0 0 0 1.2px currentColor; }
.${P}-ni.sub { height: 17px; margin-top: 1px; padding-left: 17px; }
.${P}-ni b { margin-left: auto; font-size: 6px; font-weight: 400; color: #6a7282; }
.${P}-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; position: relative; background: #0d1016; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: space-between; height: 26px; padding: 0 8px; font-size: 7.5px; font-weight: 600; color: #e6e9ef; }
.${P}-top span { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.${P}-top s { text-decoration: none; display: flex; align-items: center; box-sizing: border-box; width: 78px; height: 15px; padding: 0 7px; border-radius: 8px; background: #1a1e27; font-size: 6.5px; font-weight: 400; color: #8c94a3; }
.${P}-feed { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; padding: 2px 8px 0; overflow: hidden; }
.${P}-rec { flex: none; padding: 7px 4px 6px; border-radius: 6px; background: #0d1016; }
.${P}-rh { display: flex; align-items: center; gap: 4px; height: 14px; font-size: 7.5px; font-weight: 600; color: #f1f3f8; white-space: nowrap; }
.${P}-av { flex: none; position: relative; display: block; width: 13px; height: 13px; border-radius: 50%; background: #3a4150; }
.${P}-av::before { content: ""; position: absolute; left: 3.2px; top: 5px; width: 1.6px; height: 1.6px; border-radius: 50%; background: #e4e8ef; box-shadow: 3.6px 0 0 #e4e8ef; }
.${P}-av::after { content: ""; position: absolute; left: 5.7px; top: 1.6px; width: 1.4px; height: 1.8px; background: #9aa2b2; }
.${P}-rh em { font-style: normal; font-size: 5.5px; font-weight: 500; line-height: 9px; padding: 0 3px; border-radius: 2px; }
.${P}-rh em.a { background: #172a52; color: #6e9bff; }
.${P}-rh em.b { background: #2a1f4d; color: #a18bff; }
.${P}-rh span { font-size: 6px; font-weight: 400; color: #7e8696; }
.${P}-pr { margin: 2px 0 0 17px; height: 11px; font-size: 6.5px; line-height: 11px; color: #aeb5c2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-st { margin: 4px 0 0 17px; }
.${P}-bar { height: 4px; border-radius: 2px; background: #2a2f3a; overflow: hidden; }
.${P}-bar u { display: block; width: 0%; height: 100%; border-radius: 2px; background: #00b96b; }
.${P}-sl { display: flex; align-items: center; justify-content: space-between; height: 17px; margin-top: 2px; font-size: 6.5px; color: #aab1be; white-space: nowrap; }
.${P}-sl b { font-weight: 700; color: #eceff5; }
.${P}-sl i { display: grid; place-items: center; width: 40px; height: 12px; border-radius: 3px; background: #e5484d; font-style: normal; font-size: 6px; font-weight: 600; color: #fff; }
.${P}-gr { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; margin: 5px 0 0 17px; overflow: hidden; }
.${P}-t { position: relative; aspect-ratio: 2 / 3; border-radius: 4px; overflow: hidden; background: #12161c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #12161c; box-shadow: inset 0 0 0 1px #171c25; }
.${P}-pend b { position: absolute; display: block; width: 2.6px; height: 2.6px; border-radius: 50%; }
.${P}-pend b:nth-child(1) { left: 56%; top: 46%; }
.${P}-pend b:nth-child(2) { left: 42%; top: 53%; }
.${P}-comp { flex: none; position: relative; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 34px; margin: 0 8px 7px; padding: 0 9px; border-radius: 8px; background: #151922; font-size: 7px; color: #7d8594; }
.${P}-send { display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #3d5bff; }
.${P}-send svg { width: 9px; height: 9px; fill: #fff; }
.${P}-toast { position: absolute; left: 50%; top: 8px; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 10px; border-radius: 3px; background: #e9f4d6; color: #3b8a1f; font-size: 7px; font-weight: 500; white-space: nowrap; transform: translateX(-50%); box-shadow: 0 2px 8px rgba(0, 0, 0, .35); }
.${P}-toast i { display: block; width: 7px; height: 7px; border-radius: 50%; background: #52b030; }
.${P}-rail { flex: none; box-sizing: border-box; width: ${RAIL_W}px; padding: 6px 6px 6px 6px; background: #0b0e13; overflow: hidden; }
.${P}-tabs { display: flex; height: 18px; font-size: 7.5px; font-weight: 600; color: #8e96a5; }
.${P}-tabs span { flex: 1; position: relative; text-align: center; line-height: 18px; }
.${P}-tabs .on { color: #f1f3f8; }
.${P}-tabs em { position: absolute; right: -1px; top: -3px; font-style: normal; font-size: 4.5px; line-height: 7px; padding: 0 2.5px; border-radius: 3px; background: #e5484d; color: #fff; }
.${P}-sec { margin-top: 5px; padding: 5px 5px 4px; border-radius: 5px; background: #12161e; }
.${P}-sec h6 { margin: 0 0 3px; font-size: 6.5px; font-weight: 600; color: #b7bfcd; }
.${P}-row { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 15px; margin-top: 2px; padding: 0 4px; border-radius: 3px; background: #181d27; font-size: 6px; color: #c3c9d5; white-space: nowrap; }
.${P}-row b { font-weight: 400; color: #747c8b; }
.${P}-wh { display: flex; align-items: center; justify-content: space-between; height: 15px; margin-top: 2px; font-size: 6px; color: #c3c9d5; }
.${P}-wh b { box-sizing: border-box; width: 30px; height: 12px; border-radius: 3px; background: #0b0e13; box-shadow: inset 0 0 0 1px #2a303c; font-weight: 400; font-size: 6px; line-height: 12px; text-align: center; color: #eceff5; }
`;

const FEED = [
  { time: '22:41:22', prompt: '缪斯在阶梯教室里举着手写便条，梗图风格，高分辨率，色彩明快，细节丰富', n: 4, first: 0, issue: 0.04, qEnd: 0.12, pEnd: 0.28 },
  { time: '22:42:23', prompt: '一位缪斯戴着学士帽，手里是一张写着标语的纸，表情夸张，梗图', n: 4, first: 4, issue: 0.30, qEnd: 0.56, pEnd: 0.95 },
  { time: '22:43:35', prompt: '黑板前的缪斯，粉笔字写着今日梗，暖色调，插画风格', n: 2, first: 8, issue: 0.62, qEnd: 1.10, pEnd: 1.55 },
];
const REF = 1.84;       // the beat in seconds from the card's entrance to the last landing, stretched with the real window
const TOAST = 0.30;     // how long the green '创建成功' toast stays after a submit
const NAV = [['创作流', 'on', ''], ['高级创作', '', '⌃'], ['图生图', 'sub', ''], ['条件生图', 'sub', ''], ['工具', '', '⌄']];

export default {
  id: 'seaart',
  label: 'SeaArt (海艺)',
  source: {
    platform: 'SeaArt AI web app, seaart.ai 创作流 page (desktop browser, dark theme; a 2023 tutorial screen recording on Bilibili)',
    feature: "dark chat-style task feed: a green toast '创建成功' on submit, then per record a queued state ('等待开始 .' + red 取消任务), a flat green progress bar with '任务完成 N% .', and dark placeholder tiles with small blue twinkle dots swapped for finished images; right rail 参数 (队列 普通队列, 模式 默认, 作品权限 公开) (adapted to 10: three records issued in turn, 4 + 4 + 2, each walking queued -> percentage -> twinkle tiles -> landed with the tiles landing strictly one after another; the credit-cost counter and the logo are omitted)",
    refs: [{ url: 'https://www.bilibili.com/video/BV178411q7pM', retrieved: '2026-10-14' }],
    extrapolated: 'the footage cuts at t~181.5 so the click-to-placeholder birth is not on screen, and the percentage was sampled once (18%): the queued -> percentage -> twinkle order, the timings and the toast per submit are an adaptation; the tile glyph (two small dots) is small at 480p',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'seaart');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><b></b><b></b></div></div>`;
    const rec = (r) => `<div class="${P}-rec" style="visibility: hidden"><div class="${P}-rh"><i class="${P}-av"></i>海艺-机器人<em class="a">文生图</em><em class="b">默认</em><span>${r.time}</span></div><div class="${P}-pr">${x.esc(r.prompt)}</div><div class="${P}-st"><div class="${P}-bar" style="display: none"><u></u></div><div class="${P}-sl"><span class="${P}-lbl">等待开始 .</span><i>取消任务</i></div></div><div class="${P}-gr" style="height: 0px">${tiles.slice(r.first, r.first + r.n).map((g, k) => cell(g, r.first + k)).join('')}</div></div>`;
    const nav = NAV.map(([n, c, e]) => `<div class="${P}-ni ${c}">${c === 'sub' ? '' : '<i></i>'}${n}${e ? `<b>${e}</b>` : ''}</div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><div class="${P}-brand"><i></i>创作</div>${nav}</div><div class="${P}-mid"><div class="${P}-top"><span>私人频道 ⌄</span><s>搜索</s></div><div class="${P}-feed">${FEED.map(rec).join('')}</div><div class="${P}-toast" style="visibility: hidden"><i></i>创建成功</div><div class="${P}-comp"><span>请输入提示词</span><div class="${P}-send"><svg viewBox="0 0 12 12"><path d="M1 1l10 5-10 5 2.2-5z"/></svg></div></div></div><div class="${P}-rail"><div class="${P}-tabs"><span class="on">创作</span><span>实验室<em>New</em></span></div><div class="${P}-sec"><h6>参数</h6><div class="${P}-row">队列<b>普通队列</b></div><div class="${P}-row">模式<b>默认</b></div><div class="${P}-row">作品权限<b>公开</b></div></div><div class="${P}-sec"><h6>模型设置</h6><div class="${P}-row">模型<b>ReV Animated</b></div><div class="${P}-row">风格<b>＋</b></div></div><div class="${P}-sec"><h6>基础设置</h6><div class="${P}-row">图片数量<b class="${P}-n">4</b></div><div class="${P}-row">图片模式<b>高清</b></div><div class="${P}-row">图片尺寸<b>2:3</b></div><div class="${P}-wh">宽<b>512</b>高<b>768</b></div></div></div></div>`);
    const send = root.querySelector(`.${P}-send`), toast = root.querySelector(`.${P}-toast`), numEl = root.querySelector(`.${P}-n`);
    const recs = [...root.querySelectorAll(`.${P}-rec`)].map((n) => ({ n, bar: n.querySelector(`.${P}-bar`), fill: n.querySelector(`.${P}-bar u`), sl: n.querySelector(`.${P}-sl`), lbl: n.querySelector(`.${P}-lbl`), gr: n.querySelector(`.${P}-gr`) }));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), dots: [...n.querySelectorAll(`.${P}-pend b`)], g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const land = (i) => (ctx.seq(i)[1] - ctx.cardIn) / k;

        // the send arrow is pressed at each submit; the green toast stays up a moment after it
        const sp = FEED.reduce((a, r) => Math.max(a, press(s, r.issue, 0.05, 0.04, 0.1)), 0);
        put('send', sp.toFixed(3), () => { send.style.transform = sp > 0 ? `scale(${(1 - 0.12 * sp).toFixed(4)})` : 'none'; });
        put('toast', FEED.some((r) => s >= r.issue && s < r.issue + TOAST), (v) => { toast.style.visibility = v ? '' : 'hidden'; });

        let latest = 0;
        FEED.forEach((r, ri) => {
          const c = recs[ri];
          const issued = s >= r.issue;
          if (issued) latest = r.n;
          put(`v${ri}`, issued, (v) => { c.n.style.visibility = v ? '' : 'hidden'; });
          const phase = s < r.qEnd ? 0 : s < r.pEnd ? 1 : 2;   // 0 queued, 1 running, 2 tiles
          put(`ph${ri}`, phase, (v) => {
            c.bar.style.display = v === 1 ? '' : 'none';
            c.sl.style.display = v === 2 ? 'none' : '';
            c.gr.style.height = v === 2 ? '' : '0px';
          });
          // '.' then '..' then '...': the line's trailing dots turn with t
          const dots = '.'.repeat(1 + (Math.floor(Math.max(s, 0) * 5) % 3));
          if (phase === 0) put(`l${ri}`, `q${dots}`, () => { c.lbl.textContent = `等待开始 ${dots}`; });
          if (phase === 1) {
            const pct = Math.floor(seg(s, r.qEnd, r.pEnd) * 100);
            put(`l${ri}`, `p${pct}${dots}`, () => { c.lbl.innerHTML = `任务完成 <b>${pct}%</b> ${dots}`; c.fill.style.width = `${pct}%`; });
          }
        });
        put('num', latest, (v) => { numEl.textContent = String(v || 4); });

        cells.forEach((c, i) => {
          const a = land(i);
          const on = s >= a;
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, on, (v) => { c.pend.style.display = v ? 'none' : ''; });
          if (!on) {
            // the two dots twinkle on their own phases, a function of t alone
            c.dots.forEach((d, j) => {
              const al = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 11 + hash(31, i * 2 + j) * 6.28));
              const col = j === 0 ? `rgba(110, 120, 255, ${al.toFixed(2)})` : `rgba(140, 150, 255, ${(1.0 - al * 0.6).toFixed(2)})`;
              d.style.background = col;
            });
          }
        });
        void count;
      },
    };
  },
};
