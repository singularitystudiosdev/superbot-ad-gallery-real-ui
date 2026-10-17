// ComfyUI's node-graph editor in its official Chinese locale (Bilibili BV1iT3u6UEXC, 2026-07-25, t=161.5-186 s; spec
// .tmp/clone-9e82faf1/reveal-refs/comfyui/spec.json, confidence 0.74; frames o_comfyui_queued_t161.5 / _toolbar / _running_t164.0 /
// _progress_t170.0 / _toast_done_t175.0 / _result_t186.0). A #151515 canvas of dark nodes joined by coloured wires - Checkpoint大模型加载器,
// CLIP文本编码器, 条件零化 (the negative branch the video uses), 空Latent, K采样器, VAE解码 and 预览图像 - under a toolbar with a blue 运行
// button and the active-job counter ('1 个活动任务'), with the queue readout under it ('全部: N%  当前节点: <节点> N%'). Queuing raises the toast
// '任务添加到队列'; the executing node carries a green outline that walks the graph (dashes flow along the wires into it), the
// K采样器 node draws a live latent preview that resolves from coloured noise into the picture while its own percentage climbs, and when the
// job ends the counter drops to 0, '作业已完成' is toasted and every node wears a duration badge (the footage's own: 0.651秒, 0.996秒, 0.021秒,
// 0.021秒, 12.154秒, 0.200秒, 0.365秒).
// Adapted to ten images: a batch of ten (空Latent 批量大小 10) whose 预览图像 node holds a grid of ten that land one after another; K采样器 resolves
// image i from noise inside its own window (its percentage runs 0-100 for each) while 全部 tracks the whole batch. The graph is scaled to the
// 560 px column. Omitted: the app's logo/title bar, the extension chips, the creator's burned-in subtitle and watermark. Every picture is
// our own meme; no logo, wordmark or platform font is drawn (plain squares, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT, hash } from './util.9e82faf1.js';

const P = 'rv-cf';
const FONT = `${UI_FONT}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif`;
const ROOT_W = 560, TOOL_H = 28, READ_H = 18, CANVAS_H = 432, ROOT_H = TOOL_H + READ_H + CANVAS_H, ROW = 9, TITLE_H = 12;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: ${ROOT_W}px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #151515; color: #d6d6d6; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-bar { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: ${TOOL_H}px; padding: 0 8px; background: #1a1a1a; box-shadow: 0 1px 0 #262626; }
.${P}-tab { margin-right: auto; font-size: 7.5px; color: #e8e8e8; white-space: nowrap; }
.${P}-tab i { display: inline-block; width: 4px; height: 4px; margin-left: 4px; border-radius: 50%; background: #9a9a9a; vertical-align: 1px; }
.${P}-batch { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: 30px; height: 17px; padding: 0 5px; border-radius: 4px; background: #262626; font-size: 7.5px; color: #e8e8e8; }
.${P}-batch em { font-style: normal; font-size: 4.5px; line-height: 5px; color: #7a7a7a; }
.${P}-run { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 17px; padding: 0 9px 0 7px; border-radius: 4px; background: #1c8cf2; font-size: 7.5px; font-weight: 500; color: #fff; white-space: nowrap; }
.${P}-run svg { width: 7px; height: 7px; fill: none; stroke: #fff; stroke-width: 1.3; stroke-linejoin: round; }
.${P}-dd { display: grid; place-items: center; width: 11px; height: 17px; border-radius: 4px; background: #262626; font-size: 6px; color: #b5b5b5; }
.${P}-x { display: grid; place-items: center; width: 17px; height: 17px; border-radius: 4px; background: #5a2724; font-size: 8px; color: #9a6a68; }
.${P}-x.${P}-on { background: #c0443b; color: #fff; }
.${P}-jobs { position: relative; display: flex; align-items: center; box-sizing: border-box; height: 17px; padding: 0 7px; border-radius: 4px; background: #262626; font-size: 7px; color: #ececec; white-space: nowrap; }
.${P}-jobs i { position: absolute; right: -1.5px; top: -2px; display: none; width: 4px; height: 4px; border-radius: 50%; background: #1c8cf2; }
.${P}-jobs.${P}-on i { display: block; }
.${P}-read { display: flex; align-items: center; justify-content: flex-end; gap: 8px; box-sizing: border-box; height: ${READ_H}px; padding: 0 10px; font-size: 6.5px; color: #cfcfcf; white-space: nowrap; }
.${P}-read b { color: #f2f2f2; }
.${P}-read s { text-decoration: none; position: relative; width: 120px; height: 2.5px; margin-right: auto; border-radius: 2px; background: #2a2a2a; overflow: hidden; }
.${P}-read s u { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: #1b6fc0; }
.${P}-cv { position: relative; height: ${CANVAS_H}px; background: #151515; overflow: hidden; }
.${P}-wires { position: absolute; left: 0; top: 0; width: ${ROOT_W}px; height: ${CANVAS_H}px; overflow: visible; }
.${P}-n { position: absolute; box-sizing: border-box; border-radius: 4px; background: #222; box-shadow: 0 0 0 1px #343434; }
.${P}-n.${P}-act { box-shadow: 0 0 0 1.5px #3fbf6f; }
.${P}-nt { height: ${TITLE_H}px; padding: 0 6px; border-radius: 4px 4px 0 0; background: #353535; font-size: 6.5px; line-height: ${TITLE_H}px; color: #d4d4d4; white-space: nowrap; overflow: hidden; }
.${P}-nt::before { content: ""; display: inline-block; width: 3px; height: 3px; margin-right: 4px; border-radius: 50%; background: #8a8a8a; vertical-align: 0.5px; }
.${P}-r { position: relative; display: flex; justify-content: space-between; height: ${ROW}px; padding: 0 6px; font-size: 5.5px; line-height: ${ROW}px; color: #b4b4b4; white-space: nowrap; }
.${P}-r i { position: absolute; top: 2.5px; width: 4px; height: 4px; border-radius: 50%; }
.${P}-r i.${P}-dl { left: -2px; }
.${P}-r i.${P}-do { right: -2px; }
.${P}-w { display: flex; justify-content: space-between; box-sizing: border-box; height: 8px; margin: 1px 4px 0; padding: 0 4px; border-radius: 4px; background: #303030; font-size: 5.2px; line-height: 8px; color: #a6a6a6; white-space: nowrap; overflow: hidden; }
.${P}-w b { font-weight: 400; color: #e4e4e4; }
.${P}-ta { box-sizing: border-box; height: 34px; margin: 2px 4px 0; padding: 3px 4px; border-radius: 3px; background: #2b2b2b; font-size: 5.5px; line-height: 8px; color: #d6d6d6; overflow: hidden; }
.${P}-bd { position: absolute; left: 0; top: -9px; box-sizing: border-box; height: 8px; padding: 0 3px; border-radius: 2px; background: #1c1c1c; box-shadow: 0 0 0 1px #2c2c2c; font-size: 5.3px; line-height: 8px; color: #bdbdbd; white-space: nowrap; }
.${P}-lp { position: relative; width: 100px; height: 100px; margin: 4px auto 0; background: #1b1b1b; overflow: hidden; }
.${P}-lp img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-lp canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; image-rendering: pixelated; }
.${P}-cap { height: 8px; margin-top: 1px; font-size: 5px; line-height: 8px; text-align: center; color: #8d8d8d; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; margin: 4px 6px 0; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; background: #2b2b2b; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #262626; box-shadow: inset 0 0 0 1px #2f2f2f; }
.${P}-toast { position: absolute; right: 8px; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 18px; padding: 0 9px 0 7px; border-radius: 4px; background: #272727; box-shadow: 0 2px 8px rgba(0, 0, 0, .5), 0 0 0 1px #333; font-size: 7px; color: #ececec; white-space: nowrap; }
.${P}-toast i { font-style: normal; font-size: 7px; color: #cfcfcf; }
`;

// node geometry (canvas px): [key, x, y, w, h, title, ins, outs]
const W_TYPE = { model: '#b39ddb', clip: '#ffd54f', vae: '#ef5350', latent: '#ff9ad5', cond: '#ffa726', image: '#64b5f6' };
const NODES = {
  A: { x: 8, y: 36, w: 104, title: 'Checkpoint大模型加载器', ins: [], outs: [['模型', 'model'], ['CLIP', 'clip'], ['VAE', 'vae']], widgets: [['', 'Krea2\\Krea2-Turbo…']], badge: '0.651秒', name: 'Checkpoint大模型加载器' },
  B: { x: 124, y: 24, w: 108, title: 'CLIP文本编码器', ins: [['clip', 'clip']], outs: [['条件', 'cond']], area: '一位缪斯举着手写便条，梗图风格，色彩明快', badge: '0.996秒', name: 'CLIP文本编码器' },
  C: { x: 124, y: 108, w: 84, title: '条件零化', ins: [['条件', 'cond']], outs: [['条件', 'cond']], badge: '0.021秒', name: '条件零化' },
  D: { x: 8, y: 116, w: 96, title: '空Latent', ins: [], outs: [['Latent', 'latent']], widgets: [['宽度', '512'], ['高度', '512'], ['批量大小', '10']], badge: '0.021秒', name: '空Latent' },
  E: { x: 244, y: 10, w: 124, title: 'K采样器', ins: [['模型', 'model'], ['正面条件', 'cond'], ['负面条件', 'cond'], ['Latent', 'latent']], outs: [['Latent', 'latent']], widgets: [['种子', '0'], ['生成前控制', 'randomize'], ['步数', '20'], ['cfg', '8.0'], ['采样器名称', 'euler'], ['调度器', 'simple'], ['降噪', '1.00']], preview: true, badge: '12.154秒', name: 'K采样器' },
  F: { x: 408, y: 24, w: 90, title: 'VAE解码', ins: [['Latent', 'latent'], ['vae', 'vae']], outs: [['图像', 'image']], badge: '0.200秒', name: 'VAE解码' },
  G: { x: 244, y: 252, w: 308, title: '预览图像', ins: [['图像', 'image']], outs: [], grid: true, badge: '0.365秒', name: '预览图像' },
};
// heights follow the content: title + slot rows + widgets + the body
const rowsOf = (n) => Math.max(n.ins.length, n.outs.length);
const heightOf = (n) => TITLE_H + rowsOf(n) * ROW + (n.widgets ? n.widgets.length * (8 + 1) + 2 : 0) + (n.area ? 38 : 0) + (n.preview ? 4 + 100 + 9 + 3 : 0) + (n.grid ? 4 + 2 * ((n.w - 12 - 16) / 5 * (1024 / 870)) + 4 + 12 : 0) + 4;
const slot = (k, side, idx) => { const n = NODES[k]; return [n.x + (side === 'o' ? n.w : 0), n.y + TITLE_H + idx * ROW + ROW / 2]; };
const EDGES = [
  ['A', 0, 'E', 0, 'model'], ['A', 1, 'B', 0, 'clip'], ['A', 2, 'F', 1, 'vae'], ['B', 0, 'E', 1, 'cond'], ['B', 0, 'C', 0, 'cond'],
  ['C', 0, 'E', 2, 'cond'], ['D', 0, 'E', 3, 'latent'], ['E', 0, 'F', 0, 'latent'], ['F', 0, 'G', 0, 'image'],
];
const curve = (a, b) => { const dx = Math.max(24, Math.abs(b[0] - a[0]) * 0.5); return `M${a[0]},${a[1]} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b[0]},${b[1]}`; };

const REF = 1.84;                                  // the beat in seconds from the card's entrance to the last landing
const RUN_AT = 0.03;                               // the cursor presses 运行
const QUEUED = [0.05, 0.6];                        // the toast '任务添加到队列'
const WALK = [['A', 0.07, 0.11], ['B', 0.11, 0.16], ['C', 0.16, 0.19], ['D', 0.19, null]];   // the green outline walks the graph, then rests on K采样器
const NOISE = 20;                                  // the latent preview's noise grid (cells per side)

export default {
  id: 'comfyui',
  label: 'ComfyUI',
  source: {
    platform: 'ComfyUI web app (official new frontend, zh-CN locale; node-graph canvas in a desktop browser; a screen recording on Bilibili, 2026-07-25)',
    feature: "node graph on a #151515 canvas (Checkpoint大模型加载器 -> CLIP文本编码器 / 条件零化 -> 空Latent -> K采样器 -> VAE解码 -> 预览图像) under a toolbar with a blue 运行 button and the '1 个活动任务' counter; the queue readout '全部: N% / 当前节点: <节点> N%', the green outline walking the graph with dashes flowing along the wires into it, the K采样器 in-node latent preview resolving from noise to the picture, the toasts '任务添加到队列' and '作业已完成', then per-node duration badges (adapted to 10: a batch of ten whose 预览图像 node holds a grid of ten landing strictly one after another)",
    refs: [{ url: 'https://www.bilibili.com/video/BV1iT3u6UEXC', retrieved: '2026-10-14' }],
    extrapolated: 'the footage runs one image per job: the batch of ten, the per-image K采样器 percentage and the grid in the preview node are an adaptation; the outline is not shown on VAE解码 / 预览图像 at the end, and the walk timings are ours',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'comfyui');
    const node = (key) => {
      const n = NODES[key], rows = rowsOf(n);
      const dot = (ty, side) => `<i class="${P}-d${side === 'l' ? 'l' : 'o'}" style="background: ${W_TYPE[ty]}"></i>`;
      const slots = Array.from({ length: rows }, (_, k) => { const a = n.ins[k], b = n.outs[k]; return `<div class="${P}-r"><span>${a ? `${dot(a[1], 'l')}${a[0]}` : ''}</span><span>${b ? `${b[0]}${dot(b[1], 'o')}` : ''}</span></div>`; }).join('');
      const wid = (n.widgets || []).map(([a, b]) => `<div class="${P}-w"><span>${a}</span><b>${b}</b></div>`).join('');
      const area = n.area ? `<div class="${P}-ta">${x.esc(n.area)}</div>` : '';
      const prev = n.preview ? `<div class="${P}-lp"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme sampler preview" style="visibility: hidden"/><canvas width="${NOISE}" height="${NOISE}" style="visibility: hidden"></canvas></div><div class="${P}-cap">512 × 512</div>` : '';
      const grid = n.grid ? `<div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`).join('')}</div><div class="${P}-cap">512 × 512</div>` : '';
      return `<div class="${P}-n" data-k="${key}" style="left: ${n.x}px; top: ${n.y}px; width: ${n.w}px; height: ${heightOf(n).toFixed(1)}px"><em class="${P}-bd" style="visibility: hidden">${n.badge}</em><div class="${P}-nt">${n.title}</div>${slots}${area}${wid}${prev}${grid}</div>`;
    };
    const wires = EDGES.map(([a, ai, b, bi, ty]) => curve(slot(a, 'o', ai), slot(b, 'l', bi)));
    const svg = `<svg class="${P}-wires" viewBox="0 0 ${ROOT_W} ${CANVAS_H}">${EDGES.map((e, k) => `<path d="${wires[k]}" fill="none" stroke="${W_TYPE[e[4]]}" stroke-width="1" opacity="0.85"/>`).join('')}${EDGES.map((e, k) => `<path data-e="${k}" d="${wires[k]}" fill="none" stroke="#3fbf6f" stroke-width="1.6" stroke-dasharray="4 5" style="visibility: hidden"/>`).join('')}</svg>`;
    const play = '<svg viewBox="0 0 10 10"><path d="M2 1.2l6.2 3.8L2 8.8z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-bar"><div class="${P}-tab">Unsaved Workflow<i></i></div><div class="${P}-batch">10<em>▲<br>▼</em></div><div class="${P}-run">${play}运行</div><div class="${P}-dd">▾</div><div class="${P}-x">✕</div><div class="${P}-jobs"><span>0 个活动任务</span><i></i></div></div><div class="${P}-read"><s><u></u></s><span class="${P}-all" style="visibility: hidden"><b>全部:</b> 0%</span><span class="${P}-cur" style="visibility: hidden">当前节点: K采样器 0%</span></div><div class="${P}-cv">${svg}${Object.keys(NODES).map(node).join('')}<div class="${P}-toast" style="top: 8px; visibility: hidden"><i>✓</i>任务添加到队列</div><div class="${P}-toast" style="top: 30px; visibility: hidden"><i>✓</i>作业已完成</div></div></div>`);
    const run = root.querySelector(`.${P}-run`), xb = root.querySelector(`.${P}-x`), jobs = root.querySelector(`.${P}-jobs`), jobsTxt = jobs.querySelector('span');
    const rbar = root.querySelector(`.${P}-read s`), rfill = rbar.querySelector('u'), rall = root.querySelector(`.${P}-all`), rcur = root.querySelector(`.${P}-cur`);
    const nodeEls = Object.fromEntries([...root.querySelectorAll(`.${P}-n`)].map((n) => [n.dataset.k, n]));
    const badges = [...root.querySelectorAll(`.${P}-bd`)];
    const flows = [...root.querySelectorAll('path[data-e]')];
    const [toastQ, toastD] = [...root.querySelectorAll(`.${P}-toast`)];
    const lpWrap = root.querySelector(`.${P}-lp`), lpImg = lpWrap.querySelector('img'), lpCv = lpWrap.querySelector('canvas'), cctx = lpCv.getContext('2d');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([lpImg, ...cells.map((c) => c.im)]);
    const img = cctx.createImageData(NOISE, NOISE);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const lay = (u) => (u - ctx.cardIn) / k;
        const S0 = lay(ctx.seq(0)[0]), L = (i) => lay(ctx.seq(i)[1]);
        const done = s >= L(9);
        const running = s >= QUEUED[0] && !done;

        // 运行 is pressed; the counter reads 1 while the job is live, 0 before and after
        const rp = press(s, RUN_AT, 0.05, 0.05, 0.12);
        put('run', rp.toFixed(3), () => { run.style.transform = rp > 0 ? `scale(${(1 - 0.06 * rp).toFixed(4)})` : 'none'; });
        put('job', running, (v) => { jobsTxt.textContent = `${v ? 1 : 0} 个活动任务`; jobs.classList.toggle(`${P}-on`, v); xb.classList.toggle(`${P}-on`, v); });
        put('tq', s >= QUEUED[0] && s < QUEUED[1], (v) => { toastQ.style.visibility = v ? '' : 'hidden'; });
        put('td', done, (v) => { toastD.style.visibility = v ? '' : 'hidden'; });

        // which node is executing, and how far along it is
        let act = null, cur = null, curP = 0;
        if (running) {
          for (const [key, a, b] of WALK) if (s >= a && (b === null ? s < S0 : s < b)) { act = key; cur = NODES[key].name; curP = 0; }
          if (s >= S0) { act = 'E'; cur = 'K采样器'; }
          if (!act) { act = null; cur = 'Checkpoint大模型加载器'; }
        }
        // the sampler's image: the one whose window we are in
        let ci = 0;
        while (ci < 9 && s >= L(ci)) ci++;
        const p = s >= S0 ? seg(s, lay(ctx.seq(ci)[0]), L(ci)) : 0;
        if (act === 'E') curP = Math.floor(p * 100);
        const total = done ? 100 : Math.floor(100 * seg(s, S0, L(9)));
        Object.keys(nodeEls).forEach((key) => put(`n${key}`, act === key, (v) => { nodeEls[key].classList.toggle(`${P}-act`, v); }));
        const live = running || done;
        put('rv', running, (v) => { rall.style.visibility = v ? '' : 'hidden'; rcur.style.visibility = v ? '' : 'hidden'; rbar.style.visibility = v ? '' : 'hidden'; });
        if (!running) rfill.style.width = '';
        if (running) put('rt', `${total}|${cur}|${curP}`, () => { rall.innerHTML = `<b>全部:</b> ${total}%`; rcur.textContent = `当前节点: ${cur} ${curP}%`; });
        if (running) rfill.style.width = `${total}%`;
        void live;

        // dashes flow along the wires into the executing node (their phase turns with t)
        const off = -((t * 38) % 9);
        flows.forEach((f, e) => {
          const on = act !== null && EDGES[e][2] === act;
          put(`f${e}`, on, (v) => { f.style.visibility = v ? '' : 'hidden'; });
          if (on) f.setAttribute('stroke-dashoffset', off.toFixed(2));
        });

        // the in-node latent preview: image ci resolves from coloured noise; at the end it rests on the last picture
        const showLp = s >= S0;
        const idx = done ? 9 : ci;
        const g = tiles[idx];
        put('lpv', showLp, (v) => { lpImg.style.visibility = v ? '' : 'hidden'; });
        put('lpo', idx, () => { lpImg.style.transformOrigin = g.origin; });
        lpImg.style.transform = restTransform(g);
        if (showLp && !done) {
          const blur = 9 * Math.pow(1 - p, 1.3), sat = 0.4 + 0.6 * p;
          lpImg.style.filter = `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(3)}) ${g.grade}`.trim();
          const al = Math.pow(1 - p, 1.25), fr = Math.floor(t * 24);
          put('lpn', `${idx}:${fr}`, () => {
            for (let c = 0; c < NOISE * NOISE; c++) { img.data[c * 4] = hash(idx * 31 + fr, c * 3) * 255; img.data[c * 4 + 1] = hash(idx * 31 + fr, c * 3 + 1) * 255; img.data[c * 4 + 2] = hash(idx * 31 + fr, c * 3 + 2) * 255; img.data[c * 4 + 3] = 255; }
            cctx.putImageData(img, 0, 0);
          });
          lpCv.style.opacity = al.toFixed(3);
          put('lpc', true, () => { lpCv.style.visibility = ''; });
        } else {
          lpImg.style.filter = restFilter(g);
          put('lpc', false, () => { lpCv.style.visibility = 'hidden'; lpCv.style.opacity = ''; });
          if (!showLp || done) lpCv.style.opacity = '';
        }

        // the preview node's grid: image i lands as its window ends
        cells.forEach((c, i) => {
          const on = s >= L(i);
          put(`i${i}`, on, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });

        // every node wears its duration badge once the job is done
        put('bd', done, (v) => { badges.forEach((b) => { b.style.visibility = v ? '' : 'hidden'; }); });
      },
    };
  },
};
