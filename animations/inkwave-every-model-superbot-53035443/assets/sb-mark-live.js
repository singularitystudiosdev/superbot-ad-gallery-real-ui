/* sb-mark-live.js
   The real superbot.gg animated mascot ("the mark"), extracted verbatim.

   Source URL : https://beta.superbot.gg/
   Snapshot   : /Users/adrianagne/Documents/cosmos/work/refs/beta.superbot.gg-2026-09-23.html
   Retrieved  : 2026-09-23
   Copied from: line 163 of that snapshot
                  the <svg class="sb-mark" viewBox="0 0 100 100"> block with mask id sb-gate-mark
                  (byte-for-byte, held in MARK_SVG below), and
                  the mark half of the inline <script> on that same line: pointer-following eyes
                  (.mark-eye-l / .mark-eye-r cx/cy, lerp 0.14, clamp+-1, rAF only while moving),
                  the random blink (20% one eye, else both, ry 1 for 120ms, next blink in
                  1800 + rand*3200 ms) and the click that adds .is-happy for 600ms.
   Styles     : assets/sb-mark-live.css (load it too, or the mark is unstyled).
   Fragment   : assets/sb-mark-live.html (the same markup + <div class="mark-wrap">).

   Usage:
     <link rel="stylesheet" href="assets/sb-mark-live.css">
     <script src="assets/sb-mark-live.js"></script>
     <div id="mark"></div>
     <script>sbMarkLive("#mark", { size: 96 });</script>

   window.sbMarkLive(elOrSelector, opts) -> { el, wrap, svg, html, happy(), blink(), destroy() }
     opts.size        box size in px for the svg, default 96 (the source sized it 96px)
     opts.interactive default true: eyes follow the pointer, click makes it happy
     opts.title       replaces the aria-label ("superbot")
   Each instance gets its own mask id, so several marks can live on one page. */
(function () {
  'use strict';

  /* Verbatim <svg class="sb-mark"> from the source (line 163). Its mask id sb-gate-mark is made
     unique per instance at injection time. */
  var MARK_SVG = '<svg class="sb-mark" viewBox="0 0 100 100" role="img" aria-label="superbot" focusable="false"><defs><mask id="sb-gate-mark" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path class="mark-ear mark-ear-l" d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path class="mark-ear mark-ear-r" d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse class="mark-eye mark-eye-l" cx="35" cy="58" rx="8" ry="11"/><ellipse class="mark-eye mark-eye-r" cx="65" cy="58" rx="8" ry="11"/></g><g class="mark-happy" fill="none" stroke="black" stroke-width="4.5" stroke-linecap="round"><path d="M27 61Q35 53.5 43 61"/><path d="M57 61Q65 53.5 73 61"/></g></mask></defs><g class="mark-body"><rect class="sb-mark-a" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/><rect class="sb-mark-b" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/><rect class="sb-mark-c" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/></g></svg>';

  var seq = 0;

  function clamp(v) {
    return !v || isNaN(v) ? 0 : Math.max(-1, Math.min(1, v));
  }

  function sbMarkLive(el, opts) {
    opts = opts || {};
    var host = typeof el === 'string' ? document.querySelector(el) : el;
    if (!host) throw new Error('sbMarkLive: no host element for ' + el);

    var uid = 'sb-gate-mark-' + (++seq);
    var wrap = document.createElement('span');
    wrap.className = 'mark-wrap';
    wrap.innerHTML = MARK_SVG.split('sb-gate-mark').join(uid);
    var svg = wrap.querySelector('svg.sb-mark');
    if (!svg) throw new Error('sbMarkLive: mark markup failed to parse');

    var size = opts.size == null ? 96 : opts.size;
    if (size) {
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
    }
    if (opts.title) svg.setAttribute('aria-label', String(opts.title));
    host.appendChild(wrap);

    /* the mark behaviour, copied from the beta page's inline script */
    var eyes = [svg.querySelector('.mark-eye-l'), svg.querySelector('.mark-eye-r')];
    var base = eyes.map(function (e) {
      return { cx: +e.getAttribute('cx'), cy: +e.getAttribute('cy'), ry: +e.getAttribute('ry') };
    });
    var tgt = { x: 0, y: 0 };
    var at = { x: 0, y: 0 };
    var raf = 0, happyT = 0, blinkT = 0, dead = false;

    function step() {
      at.x += (tgt.x - at.x) * 0.14;
      at.y += (tgt.y - at.y) * 0.14;
      for (var i = 0; i < eyes.length; i++) {
        eyes[i].setAttribute('cx', (base[i].cx + at.x).toFixed(2));
        eyes[i].setAttribute('cy', (base[i].cy + at.y).toFixed(2));
      }
      raf = Math.abs(tgt.x - at.x) > 0.04 || Math.abs(tgt.y - at.y) > 0.04 ? requestAnimationFrame(step) : 0;
    }

    function look(x, y) {
      if (dead) return;
      var r = svg.getBoundingClientRect();
      tgt.x = clamp((x - r.left - r.width / 2) / (r.width * 2)) * 2;
      tgt.y = clamp((y - r.top - r.height / 2) / (r.height * 2)) * 2;
      if (!raf) raf = requestAnimationFrame(step);
    }

    function happy() {
      if (dead || happyT) return;
      svg.classList.add('is-happy');
      happyT = setTimeout(function () {
        svg.classList.remove('is-happy');
        happyT = 0;
      }, 600);
    }

    function blink() {
      if (dead) return;
      var shut = Math.random() < 0.2 ? [1] : [0, 1];
      shut.forEach(function (i) { eyes[i].setAttribute('ry', '1'); });
      blinkT = setTimeout(function () {
        shut.forEach(function (i) { eyes[i].setAttribute('ry', String(base[i].ry)); });
        blinkT = setTimeout(blink, 1800 + Math.random() * 3200);
      }, 120);
    }

    function onMove(e) { look(e.clientX, e.clientY); }

    var fine = !window.matchMedia || !window.matchMedia('(pointer: coarse)').matches;
    if (opts.interactive !== false) {
      svg.addEventListener('click', happy);
      if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    }
    blinkT = setTimeout(blink, 1800 + Math.random() * 3200);

    function destroy() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(happyT);
      clearTimeout(blinkT);
      window.removeEventListener('pointermove', onMove);
      svg.removeEventListener('click', happy);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }

    return { el: host, wrap: wrap, svg: svg, html: MARK_SVG, happy: happy, blink: blink, destroy: destroy };
  }

  window.sbMarkLive = sbMarkLive;
  if (typeof module !== 'undefined' && module.exports) module.exports = sbMarkLive;
})();
