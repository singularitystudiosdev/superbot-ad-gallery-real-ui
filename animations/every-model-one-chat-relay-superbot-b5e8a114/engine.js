// Seekable clock for a 1920x1080 spot. Every frame is a pure function of t, so window.__AD.seek(t)
// renders any instant (the shoot and render scripts drive it) and the loop plays it in real time.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutQuint = (k) => 1 - Math.pow(1 - k, 5);

// Fade + rise entrance used by every element that appears: returns the k it reached.
export function enter(el, t, at, dur = 0.32, rise = 10) {
  const k = easeOut(seg(t, at, at + dur));
  el.style.opacity = k;
  el.style.transform = k < 1 ? `translateY(${(1 - k) * rise}px)` : '';
  return k;
}

export function show(el, on) {
  el.style.visibility = on ? '' : 'hidden';
}

// Characters typed by time t at `cps` characters per second.
export const typed = (text, t, at, cps = 38) => text.slice(0, Math.max(0, Math.floor((t - at) * cps)));

export function html(str) {
  const d = document.createElement('div');
  d.innerHTML = str.trim();
  return d.firstElementChild;
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

export function fitStage(stage) {
  const fit = () => {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px, ${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
  };
  addEventListener('resize', fit);
  fit();
}

export function startClock(render, CYCLE) {
  let paused = false;
  let origin = performance.now();
  let last = 0;
  const loop = (now) => {
    if (!paused) {
      last = ((now - origin) / 1000) % CYCLE;
      render(last);
    }
    requestAnimationFrame(loop);
  };
  window.__AD = {
    CYCLE,
    seek(t) { paused = true; last = t; render(t); },
    pause() { paused = true; },
    play() { paused = false; origin = performance.now() - last * 1000; },
  };
  requestAnimationFrame(loop);
}
