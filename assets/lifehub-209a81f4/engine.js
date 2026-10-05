/* engine.js: the lifehub spots' timeline. One scene + the superbot end card, 1920x1080, every frame a pure
   function of t (no wall clock inside a frame). Same contract as the gallery's other code-rendered spots:
   window.__AD = { segments, CYCLE, ready, seek(t) }; ?t=<s> freezes on one frame; body.freeze hands the clock
   to an external renderer (frame-exact 60 fps export). */
import { ep, ease, prog, spring, setStyle, h } from './lib.js';
import { makeMark } from './ui.js';

export const FPS = 60;
export const W = 1920, H = 1080;
const q = (t) => Math.round(t * FPS) / FPS;

function buildEnd(stage, tagline) {
  const sec = h(`<section class="lh-scene" id="s-end">
    <div class="lh-end-lock"><div class="lh-end-face"></div><div class="lh-end-words"><div class="lh-end-slide"><h1>superbot</h1></div><p>${tagline}</p></div></div>
  </section>`);
  stage.appendChild(sec);
  const mark = makeMark(220);
  sec.querySelector('.lh-end-face').appendChild(mark.el);
  return { sec, mark, face: sec.querySelector('.lh-end-face'), slide: sec.querySelector('.lh-end-slide'), tag: sec.querySelector('p') };
}

function renderEnd(e, lt) {
  setStyle(e.sec, { o: ep(lt, 0, 0.35) });
  const kf = spring(lt, 0.05, { freq: 1.6, damp: 0.6 });
  setStyle(e.face, { s: 0.6 + 0.4 * kf, o: ep(lt, 0.05, 0.3) });
  const ks = ease.outQuint(prog(lt, 0.25, 1.0));
  setStyle(e.slide, { x: (1 - ks) * -120, o: ks });
  const kt = ep(lt, 0.7, 1.3);
  setStyle(e.tag, { y: (1 - kt) * 14, o: kt });
  e.mark.render(lt);
}

function fit(stage) {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(${((window.innerWidth - W * s) / 2).toFixed(1)}px,${((window.innerHeight - H * s) / 2).toFixed(1)}px) scale(${s})`;
}

async function settle(root) {
  try { await document.fonts.ready; } catch (e) { console.error(e); }
  const imgs = [...root.querySelectorAll('img')];
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch((e) => console.error('img', im.src, e)))));
}

/** scene: { id, dur, mount(sec) -> ctx, render(t, ctx) }; opts.tagline under the end card wordmark */
export async function run(scene, { tagline = 'your life. one command center.', endDur = 3.6 } = {}) {
  const stage = document.getElementById('stage');
  fit(stage);
  window.addEventListener('resize', () => fit(stage));

  const sec = h(`<section class="lh-scene" id="s-${scene.id}"></section>`);
  stage.appendChild(sec);
  const ctx = await scene.mount(sec);
  const end = buildEnd(stage, tagline);

  const CYCLE = scene.dur + endDur;
  const segments = [{ id: scene.id, start: 0, dur: scene.dur }, { id: 'end', start: scene.dur, dur: endDur }];
  let manual = false;

  function render(tRaw) {
    const t = Math.max(0, Math.min(CYCLE - 1e-6, tRaw));
    const inEnd = t >= scene.dur;
    sec.style.visibility = inEnd && t - scene.dur > 0.4 ? 'hidden' : 'visible';
    end.sec.style.visibility = inEnd ? 'visible' : 'hidden';
    if (!inEnd || t - scene.dur <= 0.4) scene.render(Math.min(t, scene.dur), ctx);
    if (inEnd) renderEnd(end, t - scene.dur);
  }

  window.__AD = {
    segments, CYCLE, ready: false, fps: FPS,
    seek(t) { manual = true; render(q(((t % CYCLE) + CYCLE) % CYCLE)); },
  };
  window.seek = (t) => window.__AD.seek(t);

  await settle(stage);
  const freezeAt = new URLSearchParams(location.search).get('t');
  render(freezeAt !== null ? q(parseFloat(freezeAt) || 0) : 0);
  window.__AD.ready = true;
  document.documentElement.dataset.ready = '1';
  if (freezeAt !== null) return;

  const t0 = performance.now();
  const loop = (now) => {
    if (!manual && !document.body.classList.contains('freeze')) render(q(((now - t0) / 1000) % CYCLE));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
