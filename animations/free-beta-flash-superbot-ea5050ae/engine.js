/* engine.js — the shared clock and end card for the FREE BETA SUPERBOT FLASH spots.
   Each vNN.html names its take in <html data-variant>; variants.js holds the ten takes as
   { title, D, build(root, x), render(t, x) }. This file owns everything around them: the 30fps
   story clock, the HARD CUT at D to the end card (the tabs-chaos end card: the live
   beta.superbot.gg mark scales in, the wordmark slides out from behind it), the loop, the fit,
   and the seek hooks: `?t=<s>` holds a frame, `?t=<s>&play=1` runs on from there. */
(function () {
  'use strict';
  const FPS = 30, END_LEN = 3.6;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const outQuint = (p) => 1 - Math.pow(1 - p, 5);
  const outCubic = (p) => 1 - Math.pow(1 - p, 3);
  const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const op = (el, v) => { el.style.opacity = String(clamp01(v)); };
  const hash = (n) => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; };

  function el(tag, cls, text, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function setText(e, s) { if (e.textContent !== s) e.textContent = s; }
  // a centered column of word lines, each sized --fs (design px at 1920 wide) times --k
  function stack(parent, words, fs) {
    const s = el('div', 'fb-stack', null, parent);
    return words.map((w) => { const l = el('div', 'fb-ln', w, s); l.style.setProperty('--fs', fs + 'px'); return l; });
  }
  // decaying camera shake summed over impact times; returns [dx, dy] px
  function shake(t, hits, amp) {
    let dx = 0, dy = 0;
    for (const h of hits) {
      if (t < h) continue;
      const d = Math.exp(-(t - h) * 14);
      dx += amp * d * Math.sin((t - h) * 95);
      dy += amp * d * Math.cos((t - h) * 77);
    }
    return [dx.toFixed(1), dy.toFixed(1)];
  }

  const key = document.documentElement.dataset.variant;
  const V = window.FBF_VARIANTS[key];
  if (!V) throw new Error(`free-beta-flash: unknown variant "${key}"`);

  const frame = document.getElementById('frame');
  const intro = el('section', 'scene', null, frame); intro.id = 'intro';
  intro.setAttribute('aria-label', 'FREE BETA SUPERBOT FLASH');
  const root = el('div', 'fb-root', null, intro);
  const end = el('section', 'scene', null, frame); end.id = 'end';
  end.setAttribute('aria-label', 'superbot.gg');
  end.innerHTML = '<div class="lock"><div class="face" id="end-face"></div><div class="words"><div id="end-slide"><h1>superbot.gg</h1><p>the agent to manage your agents.</p></div></div></div>';
  const flashEl = el('div', null, null, frame); flashEl.id = 'flash';
  const endFace = document.getElementById('end-face'), endSlide = document.getElementById('end-slide');
  sbMarkLive(endFace, { size: 220 });

  const x = {
    seg, lerp, clamp01, outQuint, outCubic, outBack, op, hash, el, setText, stack, shake,
    flash: (v) => op(flashEl, v),
    get W() { return window.AR.w; },
  };
  V.build(root, x);

  function render(t) {
    const cut = t >= V.D;
    intro.classList.toggle('on', !cut); op(intro, cut ? 0 : 1);
    end.classList.toggle('on', cut); op(end, cut ? 1 : 0);
    op(flashEl, 0);
    if (!cut) V.render(t, x);
    const u = t - V.D;
    const f = seg(u, 0, 0.5), w = seg(u, 0.7, 1.4);
    op(endFace, f); endFace.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(3)})`;
    endSlide.style.transform = `translateX(${((1 - outQuint(w)) * -110).toFixed(1)}%)`;
    op(endSlide, w);
  }

  // ---------- fit the frame to the viewport; --k scales the type to the ratio ----------
  function fit() {
    const k = Math.min(innerWidth / AR.w, innerHeight / AR.h);
    frame.style.transform = `translate(-50%, -50%) scale(${k})`;
    document.documentElement.style.setProperty('--k', String(Math.min(1, (AR.w / 1920) * 1.25)));
  }
  addEventListener('resize', fit);
  addEventListener('archange', fit);
  fit();

  // ---------- play ----------
  const q = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seekTo = q.has('t') ? parseFloat(q.get('t')) : null;
  let t0 = performance.now(), last = -1;
  function tick(now) {
    requestAnimationFrame(tick);
    let t = (now - t0) / 1000;
    if (t >= V.D + END_LEN) { t0 = now; t = 0; last = -1; }
    const fr = Math.floor(t * FPS);
    if (fr !== last) { last = fr; render(fr / FPS); }
  }
  function restart() { t0 = performance.now(); last = -1; }
  if (reduced) render(V.D + 2);
  else if (seekTo !== null && !q.has('play')) render(Math.floor(seekTo * FPS) / FPS);
  else {
    if (seekTo !== null) t0 -= seekTo * 1000;
    requestAnimationFrame(tick);
  }
  addEventListener('message', (e) => { if (e.data && e.data.type === 'replay') restart(); });
  window.__ad = { key, D: V.D, loop: V.D + END_LEN, render, restart };
})();
