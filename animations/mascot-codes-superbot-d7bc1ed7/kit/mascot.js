/* mascot.js: the superbot mark for the mascot-codes ad spots, lifted from https://beta.superbot.gg/invite
   (retrieved 2026-09-24). MARK_SVG is the page's <svg class="sb-mark"> byte for byte; only the mask id
   is made unique per instance so several marks can share a frame. The motion is the page's inline mark
   script with the same constants, driven by the ad clock instead of setTimeout/rAF so a loop records
   frame-exact and repeats identically:

     blink : 20% of blinks shut only the right eye, else both; ry "1" for 120ms, then "11";
             the next blink comes 1800 + rand*3200 ms later (rand is seeded per mark, reset each loop)
     happy : .is-happy on the svg (the smile arcs, eyes hidden, mark-happy-bob 600ms)
     look  : tgt = clamp((x - r.left - r.width/2) / (r.width*2)) * 2 per axis; at += (tgt - at) * 0.14 per frame

   The page's script, verbatim, for reference:
   (function(){var d=document;d.documentElement.classList.add("js");var mark=d.querySelector(".sb-mark"),eyes=[],
   base=[],tgt={x:0,y:0},at={x:0,y:0},raf=0,happyT=0;function clamp(v){return !v||isNaN(v)?0:Math.max(-1,Math.min(1,v))}
   function step(){at.x+=(tgt.x-at.x)*0.14;at.y+=(tgt.y-at.y)*0.14;for(var i=0;i<eyes.length;i++){eyes[i].setAttribute(
   "cx",(base[i].cx+at.x).toFixed(2));eyes[i].setAttribute("cy",(base[i].cy+at.y).toFixed(2))}raf=Math.abs(tgt.x-at.x)>0.04
   ||Math.abs(tgt.y-at.y)>0.04?requestAnimationFrame(step):0}function look(x,y){if(!mark)return;var r=mark.getBoundingClientRect();
   tgt.x=clamp((x-r.left-r.width/2)/(r.width*2))*2;tgt.y=clamp((y-r.top-r.height/2)/(r.height*2))*2;if(!raf)raf=
   requestAnimationFrame(step)}function happy(){if(!mark||happyT)return;mark.classList.add("is-happy");happyT=setTimeout(
   function(){mark.classList.remove("is-happy");happyT=0},600)}if(mark){eyes=[mark.querySelector(".mark-eye-l"),
   mark.querySelector(".mark-eye-r")];base=eyes.map(function(e){return {cx:+e.getAttribute("cx"),cy:+e.getAttribute("cy")}});
   var blink=function(){var shut=Math.random()<0.2?[eyes[1]]:eyes;shut.forEach(function(e){e.setAttribute("ry","1")});
   setTimeout(function(){shut.forEach(function(e){e.setAttribute("ry","11")})},120);setTimeout(blink,1800+Math.random()*3200)};
   setTimeout(blink,1800+Math.random()*3200);mark.addEventListener("click",happy);if(!matchMedia("(pointer: coarse)").matches)
   {addEventListener("pointermove",function(e){look(e.clientX,e.clientY)},{passive:true})}}
*/
(function () {
  var MARK_SVG = '<svg class="sb-mark" viewBox="0 0 100 100" role="img" aria-label="superbot" focusable="false"><defs><mask id="sb-gate-mark" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160"><g fill="white"><rect x="14" y="32" width="72" height="54" rx="15"/><path class="mark-ear mark-ear-l" d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path class="mark-ear mark-ear-r" d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black"><ellipse class="mark-eye mark-eye-l" cx="35" cy="58" rx="8" ry="11"/><ellipse class="mark-eye mark-eye-r" cx="65" cy="58" rx="8" ry="11"/></g><g class="mark-happy" fill="none" stroke="black" stroke-width="4.5" stroke-linecap="round"><path d="M27 61Q35 53.5 43 61"/><path d="M57 61Q65 53.5 73 61"/></g></mask></defs><g class="mark-body"><rect class="sb-mark-a" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/><rect class="sb-mark-b" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/><rect class="sb-mark-c" x="-30" y="-30" width="160" height="160" mask="url(#sb-gate-mark)"/></g></svg>';

  // The page's idle periods (seconds), by selector inside one mark.
  var IDLE = [['.mark-body', 5.5], ['.sb-mark-a', 7], ['.sb-mark-b', 11], ['.mark-ear-l', 3.1], ['.mark-ear-r', 4.3]];
  var WRAP_BOB = 2.4;
  var BLINK_MS = 120, BLINK_GAP = 1800, BLINK_JITTER = 3200, LOOK_EASE = 0.14, HAPPY_MS = 600;
  var count = 0;

  function clamp(v) { return !v || isNaN(v) ? 0 : Math.max(-1, Math.min(1, v)); }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Nearest period to `d` that divides the loop, so every idle cycle closes on the loop seam.
  function loopPeriod(d, loop) {
    var n = Math.max(1, Math.round(loop / d)), best = loop / n, bestErr = Infinity;
    for (var k = Math.max(1, n - 1); k <= n + 1; k++) {
      var p = loop / k, err = Math.abs(Math.log(p / d));
      if (err < bestErr) { bestErr = err; best = p; }
    }
    return best;
  }

  function blinkSchedule(seed, loop) {
    var rand = mulberry32(seed), out = [], at = (BLINK_GAP + rand() * BLINK_JITTER) / 1000;
    while (at + BLINK_MS / 1000 < loop) {
      out.push({ t: at, right: rand() < 0.2 });
      at += (BLINK_GAP + rand() * BLINK_JITTER) / 1000;
    }
    return out;
  }

  /* SB.mascot(parent, opts) -> mark handle. Every field is read by update(t) on each frame:
       size     px edge of the svg (the page draws it at 144/176px; ads go bigger)
       blinks   'auto' (seeded, the page's timing) | false | [{t, right}] explicit
       happy    [[start, holdSeconds], ...] smile windows inside the loop
       look     function(t) -> {x, y} in stage px, or null to rest centred
       closed   function(t) -> true to hold both eyes shut (ry 1)
       phase    0..1 idle phase offset, for crowds of marks */
  function mascot(parent, opts) {
    opts = opts || {};
    var id = 'sb-gate-mark-' + (++count);
    var wrap = document.createElement('div');
    wrap.className = 'mark-wrap';
    wrap.innerHTML = MARK_SVG.split('sb-gate-mark').join(id);
    var svg = wrap.firstChild;
    var size = opts.size || 176;
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    parent.appendChild(wrap);
    var eyes = [svg.querySelector('.mark-eye-l'), svg.querySelector('.mark-eye-r')];
    return {
      el: wrap, svg: svg, eyes: eyes, size: size,
      base: eyes.map(function (e) { return { cx: +e.getAttribute('cx'), cy: +e.getAttribute('cy') }; }),
      blinks: opts.blinks === undefined ? 'auto' : opts.blinks,
      happy: opts.happy || [],
      look: opts.look || null,
      closed: opts.closed || null,
      phase: opts.phase || 0,
      seed: opts.seed || count * 7919,
      _loop: 0, _sched: null
    };
  }

  function retime(m, loop) {
    var bob = loopPeriod(WRAP_BOB, loop);
    m.el.style.animationDuration = bob + 's';
    m.el.style.animationDelay = (-m.phase * bob) + 's';
    IDLE.forEach(function (pair) {
      var node = m.svg.querySelector(pair[0]);
      var p = loopPeriod(pair[1], loop);
      node.style.animationDuration = p + 's';
      node.style.animationDelay = (-m.phase * p) + 's';
    });
    m._loop = loop;
    m._sched = m.blinks === 'auto' ? blinkSchedule(m.seed, loop) : (m.blinks || []);
  }

  function happyStart(m, t) {
    for (var i = 0; i < m.happy.length; i++) {
      var w = m.happy[i];
      if (t >= w[0] && t < w[0] + Math.max(w[1], HAPPY_MS / 1000)) return w[0];
    }
    return null;
  }

  function lookTarget(m, p, rect) {
    if (!p) return { x: 0, y: 0 };
    return {
      x: clamp((p.x - rect.left - rect.width / 2) / (rect.width * 2)) * 2,
      y: clamp((p.y - rect.top - rect.height / 2) / (rect.height * 2)) * 2
    };
  }

  // rect: the svg box in stage px (the runner passes it; see stage.js).
  function update(m, t, rect) {
    var shut = [false, false];
    var sched = m._sched || [];
    for (var i = 0; i < sched.length; i++) {
      var b = sched[i];
      if (t >= b.t && t < b.t + BLINK_MS / 1000) { shut[1] = true; if (!b.right) shut[0] = true; }
    }
    if (m.closed && m.closed(t)) shut = [true, true];
    var at = { x: 0, y: 0 };
    if (m.look) {
      // Settled on look(0) at the loop start, so a held gaze stays put across the seam.
      at = lookTarget(m, m.look(0), rect);
      var steps = Math.floor(t * 60);
      for (var k = 1; k <= steps; k++) {
        var tg = lookTarget(m, m.look(k / 60), rect);
        at.x += (tg.x - at.x) * LOOK_EASE;
        at.y += (tg.y - at.y) * LOOK_EASE;
      }
    }
    for (var e = 0; e < 2; e++) {
      m.eyes[e].setAttribute('ry', shut[e] ? '1' : '11');
      m.eyes[e].setAttribute('cx', (m.base[e].cx + at.x).toFixed(2));
      m.eyes[e].setAttribute('cy', (m.base[e].cy + at.y).toFixed(2));
    }
    var hs = happyStart(m, t);
    m.svg.classList.toggle('is-happy', hs !== null);
    m.svg.__happyStart = hs === null ? -1 : hs;
  }

  window.SBMark = { mascot: mascot, retime: retime, update: update, rng: mulberry32, HAPPY_MS: HAPPY_MS };
})();
