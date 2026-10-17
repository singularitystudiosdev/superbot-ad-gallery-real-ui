// Draw Things, the on-device image generator, in its iPhone shell with the Japanese localisation (YouTube Q4gzWM4H5EA, a 2025-07-05
// iPhone screen recording, t~452-505 s; spec .tmp/clone-9e82faf1/reveal-refs/draw-things/spec.json, confidence 0.80; frames
// r_dt_01..08, r_dt_10_progress_series.png). Tapping the salmon '生成' (Generate) pill turns it into '停止' (Stop) with the batch
// stepper greyed out; the project canvas (a transparency checkerboard) first sits blank, then carries the denoiser's low-resolution
// preview, soft and blurred, sharpening as the steps advance; a floating pill pinned to the bottom of the canvas is a determinate
// bar, a dark #0F1013 fill growing left to right over #E3E4EB, reading '開始中…' (Starting…) with '00:00:00 / 推定 …' first, then
// 'サンプリング中… k / 30' with the elapsed time and '推定' (estimated) time. At the end the pill goes, the button reads '生成' again
// and the finished picture rests on the canvas under a '100%' zoom chip. The app's real pace is ~44 s a picture (the counters here
// are computed from t and run that clock across each job's window).
// Adapted to ten: ten jobs in strict sequence (the batch stepper reads 10), each finished picture filing into a version-history rail
// of ten slots (the macOS shell's right rail of thumbnails, from the second source clip, M9SFulHTv-E; the iPhone build has the
// clock icon in its toolbar for the same list). Omitted: the translucent job-parameter card over the canvas (the spec flags its
// provenance as unsettled), the keyboard and prompt chips, the iOS status bar and the creator's caption. No logo is drawn; the type
// is the system UI stack with a Japanese fallback, never the app's own face. The prompt text is ours, not the creator's.
import { seg, clamp, outCubic, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dwt';
const FONT = `${UI_FONT}, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans CJK JP', sans-serif`;
const ROOT_H = 452, PHONE_W = 300, PILL_W = 258, STEPS = 30;
const CSS = `
.${P} { box-sizing: border-box; display: flex; gap: 12px; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 12px; border-radius: 12px; background: #2b2b30; color: #1c1c1f; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-ph { flex: none; display: flex; flex-direction: column; width: ${PHONE_W}px; height: 100%; border-radius: 18px; background: #f4f3f6; overflow: hidden; }
.${P}-hd { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; font-size: 10.5px; font-weight: 600; color: #26262a; white-space: nowrap; }
.${P}-hd svg { flex: none; width: 13px; height: 13px; fill: none; stroke: #4a4a50; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd .${P}-sp { flex: 1; }
.${P}-sl { flex: none; position: relative; height: 10px; margin: 0 14px; }
.${P}-sl i { position: absolute; left: 0; right: 0; top: 4px; height: 2px; border-radius: 1px; background: #6a9be4; }
.${P}-sl b { position: absolute; right: -2px; top: 1px; width: 8px; height: 8px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .8px #cfcfd6, 0 1px 2px rgba(0, 0, 0, .25); }
.${P}-sl.${P}-low i { background: #f2c7c2; }
.${P}-pr { flex: none; box-sizing: border-box; height: 50px; margin: 4px 10px 0; padding: 6px 8px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1px #e1e1e7; font-size: 9.5px; line-height: 13px; color: #2c2c30; overflow: hidden; }
.${P}-row { flex: none; display: flex; gap: 6px; height: 32px; margin: 7px 10px 0; }
.${P}-pre { flex: none; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 4px; width: 84px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1px #f0c3be; font-size: 9.5px; font-weight: 500; color: #2c2c30; white-space: nowrap; }
.${P}-pre svg { width: 11px; height: 11px; fill: none; stroke: #3a3a40; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-gen { flex: 1; display: flex; border-radius: 9px; overflow: hidden; background: #ec6b5c; color: #fff; }
.${P}-gl { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 10.5px; font-weight: 600; white-space: nowrap; }
.${P}-gl svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-gs { flex: none; display: flex; align-items: center; gap: 7px; box-sizing: border-box; width: 62px; padding: 0 9px 0 11px; font-size: 10px; font-weight: 500; }
.${P}-gs svg { width: 8px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-cv { position: relative; flex: 1; min-height: 0; margin-top: 8px; background-color: #a4a5aa; background-image: conic-gradient(#56575c 25%, transparent 0 50%, #56575c 0 75%, transparent 0); background-size: 16px 16px; overflow: hidden; }
.${P}-art { position: absolute; left: 50%; top: 9px; width: 188px; height: 221px; margin-left: -94px; overflow: hidden; border-radius: 2px; background: #9fa0a6; }
.${P}-art img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-flat { position: absolute; inset: 0; background: #b7b8be; }
.${P}-bar { position: absolute; left: 50%; bottom: 8px; width: ${PILL_W}px; height: 24px; margin-left: ${-PILL_W / 2}px; border-radius: 9px; background: #e3e4eb; overflow: hidden; }
.${P}-bar .${P}-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #0f1013; overflow: hidden; }
.${P}-line { position: absolute; left: 0; top: 0; width: ${PILL_W}px; height: 24px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 9.5px; color: #6e6f77; white-space: nowrap; font-variant-numeric: tabular-nums; }
.${P}-bar .${P}-fill .${P}-line { color: #eeecef; }
.${P}-zoom { position: absolute; right: 8px; bottom: 8px; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 20px; padding: 0 7px; border-radius: 7px; background: #26262b; color: #f2f2f4; font-size: 9px; font-weight: 600; }
.${P}-zoom svg { width: 9px; height: 9px; fill: none; stroke: #f2f2f4; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-tb { flex: none; display: flex; align-items: center; justify-content: space-around; height: 38px; padding: 0 6px; }
.${P}-tb svg { width: 15px; height: 15px; fill: none; stroke: #55555c; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-rail { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.${P}-rh { flex: none; display: flex; align-items: center; gap: 6px; height: 16px; font-size: 9.5px; font-weight: 600; color: #c6c6cc; }
.${P}-rh svg { width: 11px; height: 11px; fill: none; stroke: #c6c6cc; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 4px; overflow: hidden; background: #3a3a41; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-slot { position: absolute; inset: 0; background: #3a3a41; box-shadow: inset 0 0 0 1px #46464e; }
`;

const PROMPT = 'ミューズが手書きのメモを掲げる、ミーム風、明るい色';
const PRESS_BEFORE = 0.1;          // the cursor taps 生成 this long before the first job's window opens
const START = 0.1;                 // the share of a job's window spent on 開始中… before sampling starts
const FADE = 0.04;                 // a thumbnail slot thins away over this long before its picture is settled
const TOTAL_S = 44;                // the real job took ~44 s on the phone: the elapsed counter runs that clock across a job's window
const hms = (s) => `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const svg = (d, vb = '0 0 16 16') => `<svg viewBox="${vb}">${d}</svg>`;
const ICON = {
  menu: svg('<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>'),
  chev: svg('<path d="M4 6.5l4 4 4-4"/>'),
  dots: svg('<circle cx="3.5" cy="8" r=".6"/><circle cx="8" cy="8" r=".6"/><circle cx="12.5" cy="8" r=".6"/>'),
  save: svg('<path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10"/>'),
  gear: svg('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8l1.2 1.5 1.9-.4.6 1.8 1.8.7-.5 1.9 1.2 1.5-1.4 1.3.1 2-1.9.4-1 1.7-1.8-.8-1.8.8-1-1.7-1.9-.4.1-2L1.2 8.8l1.2-1.5-.5-1.9 1.8-.7.6-1.8 1.9.4z"/>'),
  spark: svg('<path d="M8 1.5l1.4 4.1 4.1 1.4-4.1 1.4L8 12.5 6.6 8.4 2.5 7l4.1-1.4z"/><path d="M12.5 10.5v3M11 12h3"/>'),
  stop: svg('<circle cx="8" cy="8" r="5.5"/><rect x="6" y="6" width="4" height="4" rx=".8"/>'),
  updown: svg('<path d="M4 6l4-3.5L12 6M4 10l4 3.5L12 10"/>', '0 0 16 16'),
  zoom: svg('<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>'),
  wand: svg('<path d="M3 13L11 5M9.5 3.5l3 3M12.5 1.5v2M11.5 2.5h2"/>'),
  eraser: svg('<path d="M3 11l5.5-6.5 4 3.5L7 13.5H5z"/><path d="M7 13.5h6.5"/>'),
  brush: svg('<rect x="3" y="2.5" width="9" height="4" rx="1"/><path d="M12 4.5h1.5V8H8v2.5"/><rect x="7" y="10.5" width="2" height="3.5" rx=".6"/>'),
  page: svg('<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/>'),
  cam: svg('<path d="M2.5 5h2.2L6 3.5h4L11.3 5h2.2v7.5h-11z"/><circle cx="8" cy="8.6" r="2.2"/>'),
  clock: svg('<path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8M8 5v3.2l2 1.3"/>'),
};

export default {
  id: 'draw-things',
  label: 'Draw Things (iPhone)',
  source: {
    platform: 'Draw Things (drawthings.ai) on iPhone, Japanese localisation (a direct iOS screen recording on YouTube, 2025-07-05; the version-history rail is from its macOS shell)',
    feature: "the salmon 生成 pill turns into 停止 while the canvas shows a blurred low-resolution preview over the transparency checkerboard sharpening, and a floating determinate pill (dark #0F1013 fill over #E3E4EB) reads '開始中…' then 'サンプリング中… k / 30' with the elapsed and 推定 (estimated) times (adapted to 10: ten jobs in sequence, each finished picture filing into a ten-slot version-history rail; the job-parameter card is omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=Q4gzWM4H5EA', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=M9SFulHTv-E', retrieved: '2026-10-14' },
    ],
    // the footage shows one picture; the ten-job sequence, the 10 on the batch stepper and the rail filling are ours
    extrapolated: ['ten jobs in sequence with the batch stepper reading 10', 'the version-history rail as a 3-column grid of ten slots', 'the counters run at ten pictures in ~1.6 s (the real pace is ~44 s a picture)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'draw-things');
    const thumb = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-slot"></div></div>`;
    const line = `<span class="${P}-l"></span><span class="${P}-r"></span>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ph"><div class="${P}-hd">${ICON.menu}<span>Untitled-59220</span>${ICON.chev}<i class="${P}-sp"></i>${ICON.dots}${ICON.save}</div><div class="${P}-sl"><i></i><b></b></div><div class="${P}-pr">${x.esc(PROMPT)}</div><div class="${P}-row"><div class="${P}-pre">${ICON.gear}プリセット</div><div class="${P}-gen"><div class="${P}-gl"></div><div class="${P}-gs">${ICON.updown}<span>10</span></div></div></div><div class="${P}-cv"><div class="${P}-art" style="visibility: hidden"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme canvas" style="visibility: hidden"/><div class="${P}-flat"></div></div><div class="${P}-bar" style="display: none"><div class="${P}-line">${line}</div><div class="${P}-fill"><div class="${P}-line">${line}</div></div></div><div class="${P}-zoom" style="display: none">${ICON.zoom}<span>100%</span>${ICON.chev.replace('<svg', '<svg style="width:8px;height:8px"')}</div></div><div class="${P}-sl ${P}-low"><i></i><b></b></div><div class="${P}-tb">${ICON.wand}${ICON.eraser}${ICON.brush}${ICON.page}${ICON.cam}${ICON.clock}</div></div><div class="${P}-rail"><div class="${P}-rh">${ICON.clock}<span>10</span></div><div class="${P}-grid">${tiles.map(thumb).join('')}</div></div></div>`);
    const gl = root.querySelector(`.${P}-gl`), gs = root.querySelector(`.${P}-gs`), gen = root.querySelector(`.${P}-gen`);
    const art = root.querySelector(`.${P}-art`), cim = art.querySelector('img'), flat = art.querySelector(`.${P}-flat`);
    const bar = root.querySelector(`.${P}-bar`), fill = bar.querySelector(`.${P}-fill`), zoom = root.querySelector(`.${P}-zoom`);
    const lines = [...bar.querySelectorAll(`.${P}-line`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cover: n.querySelector(`.${P}-slot`), g: tiles[i] }));
    ctx.gate([cim, ...cells.map((c) => c.im)]);

    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const pressAt = ctx.seq(0)[0] - PRESS_BEFORE;

    return {
      root,
      render(t) {
        const first = ctx.seq(0)[0], end = ctx.lastLand;
        const running = t >= first && t < end;
        // which job is current: the last whose window has opened (none before the first)
        let j = -1;
        for (let i = 0; i < ctx.count; i++) if (t >= ctx.seq(i)[0]) j = i;
        const [a, b] = j >= 0 ? ctx.seq(j) : [0, 1];
        const p = j >= 0 ? seg(t, a, b) : 0;
        const sampling = running && p >= START;
        const k = sampling ? clamp(1 + Math.floor(seg(p, START, 1) * STEPS), 1, STEPS) : 0;

        // 生成 <-> 停止, the batch stepper greyed while a job runs; the tap dips the pill
        const gp = press(t, pressAt, 0.05, 0.05, 0.1);
        put('btn', running ? 'stop' : 'gen', (v) => {
          gl.innerHTML = v === 'stop' ? `${ICON.stop}停止` : `${ICON.spark}生成`;
          gs.style.background = v === 'stop' ? '#e8e7ec' : '';
          gs.style.color = v === 'stop' ? '#b4b4bb' : '#fff';
        });
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.04 * gp).toFixed(4)})` : 'none'; });

        // the canvas: blank until the first job, then job j's soft preview sharpening in place
        put('art', j >= 0, (v) => { art.style.visibility = v ? '' : 'hidden'; cim.style.visibility = v ? '' : 'hidden'; });
        if (j >= 0) {
          const g = tiles[j];
          put('cj', j, () => { cim.style.transformOrigin = g.origin; });
          const done = !running || p >= 1;
          const sharp = done ? 1 : outCubic(seg(p, 0.04, 0.96));
          const blur = done ? 0 : 16 * Math.pow(1 - sharp, 1.4);
          const fl = done ? 0 : 1 - seg(p, 0.06, 0.55);
          put('cf', `${blur.toFixed(2)}|${j}`, () => { cim.style.filter = blur > 0.04 ? `blur(${blur.toFixed(2)}px) ${g.grade}`.trim() : restFilter(g); });
          cim.style.transform = restTransform(g);
          put('cfl', fl.toFixed(3), () => { flat.style.display = fl > 0 ? '' : 'none'; flat.style.opacity = fl > 0 ? fl.toFixed(3) : ''; });
        }

        // the floating pill: 開始中… first, then サンプリング中… k / 30 with elapsed and 推定 times, the dark fill growing in step jumps
        put('bar', running, (v) => { bar.style.display = v ? '' : 'none'; zoom.style.display = v ? 'none' : (j >= 0 ? '' : 'none'); });
        if (running) {
          const el = Math.round(clamp((p - START) / (1 - START)) * TOTAL_S), eta = Math.round(64 + 24 * seg(p, 0.35, 0.75));
          const l = sampling ? `サンプリング中… ${k} / ${STEPS}` : '開始中…';
          const r = `${hms(sampling ? el : 0)} / 推定 ${hms(eta)}`;
          put('txt', `${l}|${r}`, () => lines.forEach((n) => { n.firstElementChild.textContent = l; n.lastElementChild.textContent = r; }));
          const w = sampling ? 0.05 + 0.95 * (k / STEPS) : 0;
          put('fw', w.toFixed(4), () => { fill.style.width = `${(PILL_W * w).toFixed(1)}px`; });
        }
        put('zm', !running && j >= 0, (v) => { zoom.style.display = v ? '' : 'none'; });

        // the version-history rail: slot j hands over to its picture as job j finishes, in order
        cells.forEach((c, i) => {
          const land = ctx.seq(i)[1];
          const f = seg(t, land - FADE, land);
          put(`v${i}`, t >= land - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`s${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cover.style.display = 'none'; c.cover.style.opacity = ''; } else { c.cover.style.display = ''; c.cover.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
