/* kawaii.js: the "kawaii" dressing for the real superbot mark (../../../assets/sb-mark-live.js).
   Shared by build/mascot-layer.html (the mascot baked into the doorstep clip) and index.html
   (the same mascot, live, hopping out of the clip into the end card), so both draw it the same way.

   Nothing here redraws the mark. kawaiiDress() only ADDS elements to an sbMarkLive instance:
   - a black backing rect under the mark's body (fully inside the body's silhouette), so the eye
     cut-outs read as black eyes on any background, exactly as the mark looks on its native black page;
   - two pink blush ellipses on the cheeks, in the same animated group as the body so they ride its
     breath and bob.
   kawaiiBurst() makes a small pool of hearts and sparkles that burst out of a point and fade:
   a pure function of the burst's age, so a frame capture draws the same picture every time. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function kawaiiDress(mark) {
    var body = mark.svg.querySelector('.mark-body');
    var back = document.createElementNS(NS, 'rect');
    back.setAttribute('x', '21'); back.setAttribute('y', '43');
    back.setAttribute('width', '58'); back.setAttribute('height', '31'); back.setAttribute('rx', '9');
    back.setAttribute('fill', '#000');
    back.setAttribute('class', 'kw-back');
    body.insertBefore(back, body.firstChild);
    var blush = [23.5, 76.5].map(function (cx) {
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', String(cx)); e.setAttribute('cy', '74');
      e.setAttribute('rx', '6.4'); e.setAttribute('ry', '3.5');
      e.setAttribute('fill', '#ff6fa6');
      e.setAttribute('class', 'kw-blush');
      e.style.opacity = '.78';
      body.appendChild(e);
      return e;
    });
    return {
      back: back, blush: blush,
      setBlush: function (v) { blush.forEach(function (e) { e.style.opacity = String(v); }); }
    };
  }

  var HEART = 'M10 18C3.2 13.2 0.8 9.4 2.6 5.8 4.4 2.4 8.4 2.8 10 6 11.6 2.8 15.6 2.4 17.4 5.8 19.2 9.4 16.8 13.2 10 18Z';
  var STAR = 'M10 0Q11.3 8.7 20 10 11.3 11.3 10 20 8.7 11.3 0 10 8.7 8.7 10 0Z';
  var COLORS = { heart: ['#ff5fa2', '#ff86bf', '#ff4d8d'], star: ['#ffe27a', '#ffffff', '#7ff5e0'] };

  // a deterministic pseudo-random stream from a seed
  function rng(seed) {
    var s = seed * 9301 + 49297;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // host: a positioned element in the coordinate space the burst is placed in.
  // n: pool size. Returns set(age, x, y, scale, seed, mix): mix 0 = all sparkles, 1 = all hearts.
  function kawaiiBurst(host, n) {
    var parts = [];
    for (var i = 0; i < n; i++) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.setAttribute('class', 'kw-p');
      svg.style.cssText = 'position:absolute;left:0;top:0;width:20px;height:20px;overflow:visible;pointer-events:none;opacity:0;filter:drop-shadow(0 0 3px rgba(255,255,255,.55)) drop-shadow(0 1px 2px rgba(0,0,0,.35));';
      var p = document.createElementNS(NS, 'path');
      svg.appendChild(p);
      host.appendChild(svg);
      parts.push({ svg: svg, path: p });
    }
    var LIFE = 0.8;
    function set(age, x, y, scale, seed, mix) {
      scale = scale || 1;
      var r = rng(seed || 1);
      for (var i = 0; i < parts.length; i++) {
        var q = parts[i];
        // every particle draws its randoms, visible or not, so the stream never shifts
        var ang = -Math.PI / 2 + (i / parts.length - 0.5) * Math.PI * 1.5 + (r() - 0.5) * 0.5;
        var dist = (60 + r() * 70) * scale;
        var size = (0.9 + r() * 0.8) * scale;
        var delay = r() * 0.08;
        var isHeart = r() < (mix == null ? 0.5 : mix);
        var col = r();
        var spin = (r() - 0.5) * 80;
        var a = age - delay;
        if (age < 0 || a < 0 || a > LIFE) { q.svg.style.opacity = '0'; continue; }
        var p = a / LIFE;
        var travel = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3);
        var px = x + Math.cos(ang) * dist * travel;
        var py = y + Math.sin(ang) * dist * travel - 26 * scale * p; // hearts float up as they go
        var pop = p < 0.18 ? p / 0.18 : 1;
        var s = size * (pop < 1 ? 1.25 * pop : 1 - 0.35 * p) * (isHeart ? 1.25 : 1);
        var fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
        var list = COLORS[isHeart ? 'heart' : 'star'];
        q.path.setAttribute('d', isHeart ? HEART : STAR);
        q.path.setAttribute('fill', list[Math.floor(col * list.length) % list.length]);
        q.svg.style.opacity = String(Math.max(0, fade));
        q.svg.style.transform = 'translate(' + (px - 10).toFixed(1) + 'px,' + (py - 10).toFixed(1) + 'px) rotate(' + (spin * p).toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
      }
    }
    return { set: set, life: LIFE };
  }

  window.kawaiiDress = kawaiiDress;
  window.kawaiiBurst = kawaiiBurst;
})();
