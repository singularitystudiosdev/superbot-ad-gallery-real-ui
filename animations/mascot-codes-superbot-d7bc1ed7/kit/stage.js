/* stage.js: the runner every mascot-codes spot calls.

     SB.ad({
       loop: 6,                 seconds; the spot repeats exactly on this period
       period: 60,              optional: the marks' idle cycles are fitted to this instead of loop (long spots)
       thumbAt: 2.5,            the moment the gallery thumbnail is taken from
       build(frame, ctx) {},    make the DOM once (again on an aspect change); make marks with SB.mascot()
       frame(t, ctx) {}         set every moving style from t in [0, loop); a pure function of t
     });

   ctx = { w, h: 1080, ar: '16x9'|'4x3'|'1x1'|'4x5', narrow: w < 1200, loop }.
   All motion is a function of t so the recorder (?capture=1, window.__ad.seek) gets frame-exact loops:
   no CSS transitions, no setTimeout, no Math.random (use SB.rng(seed)). The marks' own CSS animations are
   paused and seeked to the ad clock here, and their idle periods are fitted to divide the loop.
   ?t=2.4 freezes a live page at one moment, for review. */
(function () {
  var params = new URLSearchParams(location.search);
  var CAPTURE = params.has('capture');
  var FREEZE = params.has('t') ? parseFloat(params.get('t')) : null;
  var ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // the invite page's code alphabet
  var marks = [], spec = null, frameEl = null, scale = 1, ctx = null;

  function el(tag, cls, parent, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  function letters(parent, text, cls) {
    return Array.prototype.map.call(text, function (ch) {
      var s = el('span', cls || '', parent, ch === ' ' ? ' ' : ch);
      s.style.display = 'inline-block';
      return s;
    });
  }

  function bezier(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
    function b(p1, p2) { return 3 * p2 - 6 * p1; }
    function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var d = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= (at(t, x1, x2) - x) / d;
      }
      return at(Math.max(0, Math.min(1, t)), y1, y2);
    };
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function backOut(p) { var s = 1.70158; p -= 1; return p * p * ((s + 1) * p + s) + 1; }

  function code(rand) {
    var out = '';
    for (var i = 0; i < 16; i++) {
      if (i && i % 4 === 0) out += '-';
      out += ALPHA[Math.floor(rand() * ALPHA.length)];
    }
    return out;
  }

  // n codes: the real ones in kit/codes.js first, then placeholders in the invite format.
  function codes(n, seed) {
    var rand = SBMark.rng(seed || 42), real = window.SB_CODES || [], out = [];
    for (var i = 0; i < n; i++) out.push(real[i] || code(rand));
    return out;
  }

  function fit(node, maxW, maxH) {
    node.style.transform = '';
    var w = node.offsetWidth, h = node.offsetHeight;
    var s = Math.min(1, maxW / Math.max(1, w), maxH / Math.max(1, h));
    node.style.transform = 'scale(' + s + ')';
    return s;
  }

  function place() {
    var s = Math.min(innerWidth / ctx.w, innerHeight / 1080);
    scale = s;
    frameEl.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  // A node's box in stage px (what SB.mascot look targets are in), transforms included.
  function box(node) {
    var r = node.getBoundingClientRect(), f = frameEl.getBoundingClientRect();
    var b = { left: (r.left - f.left) / scale, top: (r.top - f.top) / scale, width: r.width / scale, height: r.height / scale };
    b.x = b.left + b.width / 2;
    b.y = b.top + b.height / 2;
    b.right = b.left + b.width;
    return b;
  }

  function rectOf(m) { return box(m.svg); }

  function syncAnimations(t) {
    document.getAnimations().forEach(function (a) {
      if (a.playState !== 'paused') a.pause();
      if (a.animationName === 'mark-happy-bob') {
        var s = a.effect && a.effect.target ? a.effect.target.__happyStart : -1;
        a.currentTime = s >= 0 ? Math.min(SBMark.HAPPY_MS, Math.max(0, (t - s) * 1000)) : SBMark.HAPPY_MS;
      } else {
        a.currentTime = t * 1000;
      }
    });
  }

  function render(t) {
    var L = spec.loop;
    t = ((t % L) + L) % L;
    if (spec.frame) spec.frame(t, ctx);
    marks.forEach(function (m) { SBMark.update(m, t, rectOf(m)); });
    syncAnimations(t);
  }

  function build() {
    var AR = window.AR || { key: '16x9', w: 1920 };
    ctx = { w: AR.w, h: 1080, ar: AR.key, narrow: AR.w < 1200, loop: spec.loop };
    frameEl.innerHTML = '';
    frameEl.style.width = AR.w + 'px';
    marks = [];
    spec.build(frameEl, ctx);
    // A long spot (hours) can repeat its motion on a shorter period; the marks' idle cycles close on it.
    marks.forEach(function (m) { SBMark.retime(m, spec.period || spec.loop); });
    place();
  }

  function mascot(parent, opts) {
    var m = SBMark.mascot(parent, opts);
    marks.push(m);
    return m;
  }

  function ad(s) {
    spec = s;
    var start = function () {
      frameEl = document.getElementById('frame') || el('div', '', document.body);
      frameEl.id = 'frame';
      build();
      window.__ad = {
        loop: spec.loop, fps: 30, thumbAt: spec.thumbAt === undefined ? spec.loop / 2 : spec.thumbAt,
        seek: function (t) { render(t); return true; }, ready: true
      };
      addEventListener('resize', place);
      addEventListener('archange', function () { build(); });
      if (CAPTURE) { render(0); return; }
      if (FREEZE !== null) { render(FREEZE); return; }
      var t0 = performance.now();
      (function tick(now) {
        render((now - t0) / 1000);
        requestAnimationFrame(tick);
      })(t0);
    };
    var go = function () { (document.fonts ? document.fonts.ready : Promise.resolve()).then(start); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  window.SB = {
    ad: ad, mascot: mascot, el: el, letters: letters, fit: fit, box: box, codes: codes, code: code, rng: SBMark.rng,
    bezier: bezier, easeOut: bezier(0.16, 1, 0.3, 1), easeInOut: bezier(0.65, 0, 0.35, 1),
    backOut: backOut, clamp01: clamp01, seg: seg, lerp: lerp, ALPHA: ALPHA
  };
})();
