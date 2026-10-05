// Orchestration: camera, the workspace opening, tool tabs and handoffs, the dive into the program
// monitor where the finished film takes the full frame, and the Superbot end card.
import { h, buildShell } from './shell.c7e41a92.js';
import { createThread, tileImg } from './thread.c7e41a92.js';
import { buildTurns, keystrokes, composerMotion, ASK } from './turns.c7e41a92.js';
import { superbotMark } from './icons.c7e41a92.js';
import { EASE, prog, lerp } from './ease.c7e41a92.js';
import { track, PRESETS } from './motion.c7e41a92.js';
import { buildEdit } from './edit.c7e41a92.js';
import { buildEleven } from './tool-eleven.c7e41a92.js';
import { buildDeepseek } from './tool-deepseek.c7e41a92.js';
import { buildGemini } from './tool-gemini.c7e41a92.js';
import { buildBlender } from './tool-blender.c7e41a92.js';
import { buildOpus } from './tool-opus.c7e41a92.js';
import { buildFilm } from './film.c7e41a92.js';
import { E, D, G, B, O, F, FILM0, END, DUR, T, WIN, PANEL, ROUTES } from './plan.c7e41a92.js';

export { DUR };
const OPENS = [E, D, G, B, O];
const MON = { x: PANEL.x + (PANEL.w - PANEL.toolH * 16 / 9) / 2, y: PANEL.tabsH, w: PANEL.toolH * 16 / 9, h: PANEL.toolH };
const CAM = {
  open: [1.42, 914, 610], wide: [1.0, 880, 480], tool: [1920 / PANEL.w, PANEL.x + PANEL.w / 2, 1080 * PANEL.w / 1920 / 2],
  mon: [1920 / MON.w, MON.x + MON.w / 2, MON.y + MON.h / 2],
};
const KEYS = [
  [0, CAM.open], [T.panel - 0.1, CAM.wide],
  [E + 0.45, CAM.tool], [E + 4.8, CAM.wide], [D + 0.45, CAM.tool], [D + 4.6, CAM.wide],
  [G + 0.45, CAM.tool], [G + 4.1, CAM.wide], [B + 0.45, CAM.tool], [B + 5.15, CAM.wide],
  [O + 0.45, CAM.tool], [O + 5.6, CAM.wide], [F, CAM.mon],
];
const camAt = (t) => [0, 1, 2].map((i) => track(t, KEYS.map(([at, v]) => [at, v[i]]), PRESETS.default.k, PRESETS.default.d));

function endCard(stage) {
  const relay = ROUTES.filter((r) => r.name).map((r) => `<span class="rl">${tileImg(r.logo, '#161618')}${r.name}</span>`).join('<i>›</i>');
  const el = h(`<div id="end">${superbotMark('mark')}<h2><span>EVERY</span><span>MODEL.</span><span>ONE</span><span>CHAT.</span></h2>
<div class="relay">${relay}</div><div class="url">superbot.gg</div></div>`);
  stage.appendChild(el);
  const mark = el.querySelector('.mark'), words = [...el.querySelectorAll('h2 span')], relayEl = el.querySelector('.relay'), url = el.querySelector('.url');
  return (t) => {
    const heavy = (at) => track(t, [[0, 0], [at, 1]], PRESETS.heavy.k, PRESETS.heavy.d);
    el.style.visibility = t < END - 0.1 ? 'hidden' : 'visible';
    mark.style.opacity = prog(t, END, 0.5, EASE.standard).toFixed(3);
    mark.style.transform = `scale(${lerp(0.86, 1, heavy(END)).toFixed(4)})`;
    words.forEach((w, i) => {
      const at = END + 0.22 + i * 0.12;
      w.style.opacity = prog(t, at, 0.45, EASE.standard).toFixed(3);
      w.style.transform = `translateY(${lerp(36, 0, heavy(at)).toFixed(2)}px)`;
    });
    relayEl.style.opacity = prog(t, END + 0.9, 0.5, EASE.standard).toFixed(3);
    url.style.opacity = prog(t, END + 1.2, 0.5, EASE.standard).toFixed(3);
    el.style.opacity = (1 - prog(t, DUR - 0.45, 0.45, EASE.standard)).toFixed(3);
  };
}

export function buildAd(stage) {
  const cam = h(`<div id="cam" style="width:${WIN.w}px;height:${WIN.h}px"></div>`);
  stage.appendChild(cam);
  const ui = buildShell(cam);
  const thread = createThread(ui.col, 760);
  buildTurns(thread);
  const tools = [buildEleven(), buildDeepseek(), buildGemini(), buildBlender(), buildOpus()];
  const empty = h(`<div class="tool t-empty">${superbotMark('mk')}<b>Workspace</b><span>Each model's tool opens here as Superbot routes the job.</span></div>`);
  ui.tools.appendChild(empty);
  const tabs = tools.map((tl) => {
    ui.tools.appendChild(tl.el);
    const tab = h(`<span class="ptab">${tileImg(tl.logo, tl.tileBg)}<span class="tl">${tl.label}</span></span>`);
    ui.tabs.insertBefore(tab, ui.tabs.querySelector('.live'));
    return tab;
  });
  const progTab = h(`<span class="ptab prog"><span class="tile play">▶</span><span class="tl">launch.mp4</span></span>`);
  ui.tabs.insertBefore(progTab, ui.tabs.querySelector('.live'));
  const edit = buildEdit(ui);
  const film = buildFilm();
  const filmWrap = h('<div id="filmwrap"></div>');
  filmWrap.appendChild(film.el);
  const poster = h('<div class="fposter"><span class="pl">▶</span><b>launch.mp4</b><em>1920×1080 · 0:14 · 7 cuts on 7 bars</em></div>');
  filmWrap.appendChild(poster);
  stage.appendChild(filmWrap);
  const end = endCard(stage);
  const strokes = keystrokes(ASK, T.type, T.send - 0.2);
  const cache = {};

  function layoutOpen(t) {
    const k = track(t, [[0, 0], [T.panel, 1]], PRESETS.default.k, PRESETS.default.d);
    const mainW = lerp(WIN.wideMain, WIN.chatW, k);
    ui.main.style.width = `${mainW.toFixed(2)}px`;
    const colX = (mainW - 440) / 2;
    ui.col.style.left = `${colX.toFixed(2)}px`;
    ui.comp.style.left = `${colX.toFixed(2)}px`;
    ui.greet.style.left = `${colX.toFixed(2)}px`;
    ui.greet.style.opacity = (1 - prog(t, T.send, 0.3, EASE.standard)).toFixed(3);
    ui.search.style.opacity = (1 - k).toFixed(3);
    ui.panel.style.transform = `translateX(${lerp(PANEL.w + 60, 0, k).toFixed(2)}px)`;
    ui.panelBtn.classList.toggle('on', k > 0.5);
    const ti = prog(t, T.title, 0.35, EASE.standard);
    ui.titleA.style.opacity = (1 - ti).toFixed(3);
    ui.titleB.style.opacity = ti.toFixed(3);
  }

  function toolsAt(t) {
    // Each tool slides in opaque over the previous one; the previous one hides once covered.
    const slide = (i) => (i < OPENS.length ? prog(t, OPENS[i] + 0.1, 0.4, EASE.outCubic) : 0);
    empty.style.opacity = (1 - prog(t, E + 0.1, 0.3, EASE.standard)).toFixed(3);
    tools.forEach((tl, i) => {
      const on = slide(i) > 0 && slide(i + 1) < 1;
      tl.el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      tl.el.style.opacity = prog(t, OPENS[i] + 0.1, 0.1, EASE.standard).toFixed(3);
      tl.el.style.transform = `translateX(${((1 - slide(i)) * 80).toFixed(2)}px)`;
      tl.el.style.boxShadow = slide(i) < 1 ? '-30px 0 60px rgba(0,0,0,0.45)' : 'none';
      tl.update(t);
    });
    tabs.forEach((tab, i) => {
      const tk = prog(t, OPENS[i], 0.4, EASE.outCubic);
      tab.style.maxWidth = `${(tk * 220).toFixed(1)}px`;
      tab.style.display = tk > 0 ? '' : 'none';
      tab.classList.toggle('on', t >= OPENS[i] && t < (OPENS[i + 1] ?? F - 0.2));
    });
    const pk = prog(t, F - 0.2, 0.4, EASE.outCubic);
    progTab.style.maxWidth = `${(pk * 220).toFixed(1)}px`;
    progTab.style.display = pk > 0 ? '' : 'none';
    progTab.classList.toggle('on', t >= F - 0.2);
  }

  function filmAt(t, c) {
    const ft = t - FILM0;
    const show = prog(t, F - 0.15, 0.3, EASE.standard);
    filmWrap.style.visibility = show > 0.001 && t < END + 0.6 ? 'visible' : 'hidden';
    if (filmWrap.style.visibility === 'hidden') return;
    const [s, fx, fy] = c;
    const x = 960 + (MON.x - fx) * s, y = 540 + (MON.y - fy) * s, k = (MON.w * s) / 1920;
    filmWrap.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(5)})`;
    filmWrap.style.opacity = show.toFixed(3);
    filmWrap.style.borderRadius = `${lerp(10, 0, prog(t, F, 0.6, EASE.standard)).toFixed(2)}px`;
    poster.style.opacity = (1 - prog(t, FILM0 - 0.12, 0.2, EASE.standard)).toFixed(3);
    film.update(Math.max(0, ft));
  }

  function seek(t) {
    const c = camAt(t);
    cam.style.transform = `translate(${(960 - c[1] * c[0]).toFixed(2)}px, ${(540 - c[2] * c[0]).toFixed(2)}px) scale(${c[0].toFixed(5)})`;
    const winIn = prog(t, 0, 0.5, EASE.standard);
    const camOn = t < FILM0 + 0.8;
    cam.style.visibility = camOn ? 'visible' : 'hidden';
    cam.style.opacity = winIn.toFixed(3);
    if (camOn) {
      layoutOpen(t);
      composerMotion(t, ui, strokes, cache);
      thread.layout(t);
      toolsAt(t);
      edit.update(t);
    }
    filmAt(t, c);
    end(t);
  }

  return { seek, measure: () => { thread.measure(); tools.forEach((tl) => tl.measure?.()); } };
}
