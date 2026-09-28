// japan-bikeride-every-model: the whole spot is render(t), a pure function of t = clock mod LOOP.
// Beats (seconds, /tmp/japan-bike-ad-fec00f6a.md): type 0.20-1.05, send 1.15, the switch pill 1.40 rolls through
// sixteen models to Claude Opus 5.5 at 3.135 (check lands 3.26), the clip card 3.32 grows to the full frame
// 3.50-3.90, hard cut to black 7.00, "superbot" 7.30, the mark 7.65, hold to 9.6.
// The clock starts at the load event (the renderer, .tmp/ar-render.*.mjs, records LOOP seconds from load) and the
// cycle is published as window.__ad = { loop }. ?t=<seconds> freezes the spot on that frame (and
// window.__ad.seek(t) returns a promise that resolves once that frame, video included, is on screen).
(function () {
  'use strict';

  var LOOP = 9.6;
  var BEAT = { typeA: 0.20, typeB: 1.05, send: 1.15, pill: 1.40, check1: 1.52, land: 3.26,
    card: 3.32, flipA: 3.50, flipB: 3.90, cut: 7.00, word: 7.30, mark: 7.65 };
  var PROMPT = 'Make me relaxing Japan bikeride';
  var CHAR = (BEAT.typeB - BEAT.typeA) / PROMPT.length;
  // how long each of the first sixteen models holds the pill (ms): fast, faster, then easing into the landing
  var SLOT_MS = [300, 220, 150, 110, 90, 80, 70, 67, 67, 67, 67, 67, 70, 80, 100, 130];
  // k = the mark's size as a fraction of the tile (marks fill their boxes differently)
  var ROSTER = [
    { name: 'Lyria 2', logo: 'gemini-logo.svg', k: 0.62 },
    { name: 'Veo 3', logo: 'deepmind-logo.svg', k: 0.6 },
    { name: 'Kling', logo: 'kling-logo.svg', k: 0.62 },
    { name: 'Runway', logo: 'runway-logo.svg', k: 0.54 },
    { name: 'Midjourney', logo: 'midjourney-logo.svg', k: 0.62 },
    { name: 'Nano Banana', logo: 'nanobanana-logo.svg', k: 0.64 },
    { name: 'FLUX', logo: 'flux-logo.svg', k: 0.62 },
    { name: 'Suno', logo: 'suno-logo.svg', k: 0.52 },
    { name: 'ElevenLabs', logo: 'elevenlabs-logo.svg', k: 0.48 },
    { name: 'Meshy', logo: 'meshy-logo.svg', k: 0.6 },
    { name: 'Hunyuan', logo: 'hunyuan-logo.svg', k: 0.6 },
    { name: 'MiniMax', logo: 'minimax-logo.svg', k: 0.6 },
    { name: 'Qwen', logo: 'qwen-logo.svg', k: 0.6 },
    { name: 'Grok', logo: 'grok-logo.svg', k: 0.56 },
    { name: 'DeepSeek', logo: 'deepseek-logo.svg', k: 0.64 },
    { name: 'ChatGPT', logo: 'openai-logo.svg', k: 0.7 },
    { name: 'Claude Opus 5.5', logo: 'claude-logo.svg', k: 0.6 }
  ];
  var N = ROSTER.length;
  // S[i]: model i lands. S[16] (Claude Opus 5.5) = 1.40 + 1.735 = 3.135
  var S = [BEAT.pill];
  for (var i = 0; i < SLOT_MS.length; i++) S.push(S[i] + SLOT_MS[i] / 1000);
  // the name/icon roll into model i: <= min(120ms, 70% of the slot it opens)
  // (the band allows 70%; 45% keeps most frames of the fastest slots on a settled, image-1 pill)
  var ROLL = S.map(function (_, i) { return i === 0 ? 0 : i === N - 1 ? 0.12 : Math.min(0.09, 0.45 * SLOT_MS[i] / 1000); });

  // ---------- helpers ----------
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function outCubic(p) { return 1 - Math.pow(1 - p, 3); }
  function inOutCubic(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function bump(p) { return Math.sin(Math.PI * clamp(p)); }
  // cubic-bezier(x1, y1, x2, y2) as a function of progress, solved for x by Newton then bisection
  function bezier(x1, y1, x2, y2) {
    function cx(s) { return 3 * x1 * s * (1 - s) * (1 - s) + 3 * x2 * s * s * (1 - s) + s * s * s; }
    function cy(s) { return 3 * y1 * s * (1 - s) * (1 - s) + 3 * y2 * s * s * (1 - s) + s * s * s; }
    function dx(s) { return 3 * x1 * (1 - s) * (1 - s) + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s; }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var s = x;
      for (var k = 0; k < 8; k++) { var d = dx(s); if (Math.abs(d) < 1e-6) break; s -= (cx(s) - x) / d; }
      if (!(s >= 0 && s <= 1) || Math.abs(cx(s) - x) > 1e-4) {
        var lo = 0, hi = 1; s = x;
        for (var j = 0; j < 40; j++) { if (cx(s) < x) lo = s; else hi = s; s = (lo + hi) / 2; }
      }
      return cy(s);
    };
  }
  var flipEase = bezier(0.2, 0.8, 0.2, 1);

  // ---------- the superbot cat: sb-mark-live's silhouette, eyes as slits (reference image 2) ----------
  var CAT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 18 76 70"><mask id="m"><g fill="white">' +
    '<rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/>' +
    '<path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="black">' +
    '<path d="M27.5 58Q35 56.6 42.5 58Q35 59.4 27.5 58Z"/><path d="M57.5 58Q65 56.6 72.5 58Q65 59.4 57.5 58Z"/>' +
    '</g></mask><rect x="0" y="0" width="100" height="100" mask="url(#m)"/></svg>';
  document.documentElement.style.setProperty('--cat', 'url("data:image/svg+xml,' + encodeURIComponent(CAT) + '")');

  // ---------- DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), chat = $('chat'), top = document.querySelector('#chat .top'), composer = $('composer'), thread = $('thread'), bubble = $('bubble'), sw = $('sw'), swTile = $('swTile'), swLab = $('swLab'),
    swWin = $('swWin'), swSpin = $('swSpin'), swOk = $('swOk'), slot = $('slot'), typed = $('typed'), caret = $('caret'),
    ph = $('ph'), send = $('send'), clip = $('clip'), vid = $('vid'), endcard = $('endcard'), word = $('word'), mark = $('mark');

  var LG = [], NM = [];
  ROSTER.forEach(function (m) {
    var lg = document.createElement('span');
    lg.className = 'lg';
    lg.style.setProperty('--lk', String(m.k));
    var im = document.createElement('img');
    im.src = 'brand/' + m.logo; im.alt = ''; im.decoding = 'sync';
    lg.appendChild(im); swTile.appendChild(lg); LG.push(lg);
    var nm = document.createElement('span');
    nm.className = 'nm'; nm.textContent = m.name;
    swWin.appendChild(nm); NM.push(nm);
  });

  // ---------- layout (measured, then every frame is arithmetic on these numbers) ----------
  // L (stage px, untransformed layout): comp0 = the composer's lift from its docked slot to the frame's vertical
  // centre (the new-chat empty state); ty1 = the thread's offset that centres bubble + pill between the header and
  // the docked composer (the burst); ty2 = the offset that centres bubble + pill + card there (the card beat)
  var W = 1920, H = 1080, fitK = 1, nameW = [], kpx = 1, L = { comp0: 0, ty1: 0, ty2: 0 };
  function measure() {
    W = (window.AR && window.AR.w) || 1920;
    fitK = Math.min(innerWidth / W, innerHeight / H);
    stage.style.setProperty('--fit', String(fitK));
    kpx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k')) || 1;
    nameW = NM.map(function (n) { return n.offsetWidth; });
    // offsets ignore transforms, so this reads the resting layout whatever frame is on screen
    var headB = top.offsetTop + top.offsetHeight;
    var compT = composer.offsetTop, compH = composer.offsetHeight;
    var rows = thread.children, pillRow = rows[1], slotRow = rows[2];
    var g1 = pillRow.offsetTop + pillRow.offsetHeight, g2 = slotRow.offsetTop + slotRow.offsetHeight;
    var A = headB, B = compT, C = (A + B) / 2, m = 24 * kpx;
    L.comp0 = H / 2 - (compT + compH / 2);
    L.ty1 = C - g1 / 2;
    L.ty2 = Math.min(Math.max(C - g2 / 2, A + m), B - m - g2);
    L.A = A; L.B = B; L.compT = compT; L.compH = compH; L.g1 = g1; L.g2 = g2;
    // the push is on the thread (bubble + pill), the header and composer hold still, so no edge of the frame is ever
    // approached. Origin (thread px): the centre of the landed (Claude Opus 5.5) pill, fixed for the whole push so the
    // frame never drifts as the pill's width follows the names
    var pillBase = sw.offsetWidth - swWin.offsetWidth;
    L.ox = sw.offsetLeft + (pillBase + nameW[N - 1]) / 2;
    L.oy = sw.offsetTop + sw.offsetHeight / 2;
    thread.style.transformOrigin = L.ox.toFixed(1) + 'px ' + L.oy.toFixed(1) + 'px';
    last = {};
  }

  // index of the model on the pill at time x, and the roll progress into it
  function rollAt(x) {
    var idx = -1;
    for (var i = 0; i < N; i++) if (x >= S[i]) idx = i;
    if (idx <= 0) return { i: Math.max(idx, 0), p: 1 };
    return { i: idx, p: outCubic(seg(x, S[idx], S[idx] + ROLL[idx])) };
  }
  // the names visible at x (the arriving one, and the leaving one while it rolls out)
  function needW(x) {
    var r = rollAt(x);
    return r.p >= 1 ? nameW[r.i] : Math.max(nameW[r.i - 1], nameW[r.i]);
  }
  // the pill's width. The timeline is known, so it looks ahead: env is the widest name on the pill anywhere in
  // [x - 0.10, x + 0.08], averaged over a 160ms window, so the pill opens BEFORE a longer name arrives and closes
  // after a shorter one settles; it never snaps and never clips a name
  function envW(x) {
    var m = 0;
    for (var i = 0; i < N; i++) {
      var a = S[i], b = i + 1 < N ? S[i + 1] + ROLL[i + 1] : Infinity; // model i is on the pill over [a, b)
      if (a <= x + 0.08 && b >= x - 0.10 && nameW[i] > m) m = nameW[i];
    }
    return m || nameW[0];
  }
  function pillW(x) {
    if (x < S[0]) return nameW[0];
    var acc = 0;
    for (var j = 0; j < 17; j++) acc += envW(x - 0.08 + 0.16 * j / 16);
    return Math.max(acc / 17, needW(x));
  }

  // write a style only when it changes
  var last = {};
  function set(el, key, prop, val) {
    if (last[key] === val) return;
    last[key] = val;
    el.style[prop] = val;
  }

  // ---------- the frame ----------
  var curT = 0;
  function render(t) {
    curT = t;

    // composer: typed char by char, cleared on send; the send button lights while there is text
    var n = t < BEAT.typeA || t >= BEAT.send ? 0 : Math.min(PROMPT.length, Math.floor((t - BEAT.typeA) / CHAR) + 1);
    if (last.n !== n) { typed.textContent = PROMPT.slice(0, n); ph.style.display = n ? 'none' : ''; send.classList.toggle('on', n > 0); last.n = n; }
    var typing = t >= BEAT.typeA && t < BEAT.typeB + 0.03;
    var ref = t < BEAT.send ? 0 : BEAT.send;
    set(caret, 'caret', 'opacity', typing || ((t - ref) % 1) < 0.55 ? '1' : '0');
    var press = bump(seg(t, BEAT.send - 0.05, BEAT.send + 0.13));
    set(send, 'send', 'transform', press > 0 ? 'scale(' + (1 - 0.08 * press).toFixed(4) + ')' : 'none');

    // the composer: centred in the empty chat, docks to the bottom on send (FLIP translate, 320ms ease-in-out)
    var dock = inOutCubic(seg(t, BEAT.send, BEAT.send + 0.32));
    set(composer, 'cy', 'transform', dock < 1 ? 'translateY(' + (L.comp0 * (1 - dock)).toFixed(2) + 'px)' : 'none');

    // the thread: bubble + pill centred through the burst; when the card arrives the group rises (280ms ease-out)
    // so bubble + pill + card sit centred in the same area
    // plus a restrained push on the pill through the burst (to 1.06, ease-in-out), easing back out as the group rises
    var up = outCubic(seg(t, BEAT.card, BEAT.card + 0.28));
    var cam = 1 + 0.06 * inOutCubic(seg(t, BEAT.pill, 3.30)) * (1 - up);
    set(thread, 'ty', 'transform', 'translateY(' + lerp(L.ty1, L.ty2, up).toFixed(2) + 'px)' + (cam > 1 ? ' scale(' + cam.toFixed(5) + ')' : ''));

    // the user's bubble lifts in (220ms ease-out)
    var b = outCubic(seg(t, BEAT.send, BEAT.send + 0.22));
    set(bubble, 'bo', 'opacity', t < BEAT.send ? '0' : b.toFixed(3));
    set(bubble, 'bt', 'transform', b < 1 ? 'translateY(' + ((1 - b) * 20 * kpx).toFixed(2) + 'px)' : 'none');

    // the switch pill enters (240ms ease-out)
    var pe = outCubic(seg(t, BEAT.pill, BEAT.pill + 0.24));
    set(sw, 'po', 'opacity', t < BEAT.pill ? '0' : pe.toFixed(3));
    set(sw, 'pt', 'transform', pe < 1 ? 'translateY(' + ((1 - pe) * 20 * kpx).toFixed(2) + 'px)' : 'none');

    // icon + name roll: the new one slides up in, the old one slides up out; "Switching to" never moves
    var r = rollAt(t), prev = r.p < 1 ? r.i - 1 : -1;
    for (var i = 0; i < N; i++) {
      var on = i === r.i || i === prev;
      var y = i === r.i ? (1 - r.p) * 100 : i === prev ? -r.p * 100 : 0;
      var tf = y === 0 ? 'none' : 'translateY(' + y.toFixed(2) + '%)';
      var op = i === r.i ? Math.min(1, r.p * 1.6) : i === prev ? Math.max(0, 1 - r.p * 1.6) : 1;
      set(LG[i], 'lv' + i, 'visibility', on ? 'visible' : 'hidden');
      set(NM[i], 'nv' + i, 'visibility', on ? 'visible' : 'hidden');
      set(LG[i], 'lt' + i, 'transform', tf);
      set(NM[i], 'nt' + i, 'transform', tf);
      set(LG[i], 'lo' + i, 'opacity', op.toFixed(3));
      set(NM[i], 'no' + i, 'opacity', op.toFixed(3));
    }
    set(swWin, 'ww', 'width', pillW(t).toFixed(2) + 'px');

    // status: spinner + shimmer until the first check, then the check stays; it lands again on Claude
    set(swSpin, 'so', 'opacity', (1 - seg(t, BEAT.check1 - 0.02, BEAT.check1 + 0.04)).toFixed(3));
    set(swSpin, 'sr', 'transform', 'rotate(' + (((t - BEAT.pill) * 520) % 360).toFixed(1) + 'deg)');
    var d = t >= S[N - 1] ? outCubic(seg(t, S[N - 1], BEAT.land)) : outCubic(seg(t, BEAT.check1, BEAT.check1 + 0.12));
    set(swOk, 'ok', 'strokeDashoffset', (1 - d).toFixed(4));
    var shim = t < BEAT.check1;
    if (last.shim !== shim) { swLab.classList.toggle('shim', shim); last.shim = shim; }
    if (shim) swLab.style.setProperty('--sh', (100 - ((Math.max(0, t - BEAT.pill) * 700) % 250)).toFixed(1) + '%');

    // the clip: a card on the thread's slot (220ms ease-out in), then FLIP to the full frame (400ms)
    var showClip = t >= BEAT.card && t < BEAT.cut;
    set(clip, 'cv', 'visibility', showClip ? 'visible' : 'hidden');
    if (showClip) {
      var e = outCubic(seg(t, BEAT.card, BEAT.card + 0.22));
      var q = flipEase(seg(t, BEAT.flipA, BEAT.flipB));
      var x0 = 0, y0 = 0, w0 = W, h0 = H;
      if (q < 1) {
        var sr = stage.getBoundingClientRect(), rr = slot.getBoundingClientRect();
        x0 = (rr.left - sr.left) / fitK; y0 = (rr.top - sr.top) / fitK + (1 - e) * 18 * kpx;
        w0 = rr.width / fitK; h0 = rr.height / fitK;
      }
      set(clip, 'cl', 'left', lerp(x0, 0, q).toFixed(2) + 'px');
      set(clip, 'ct', 'top', lerp(y0, 0, q).toFixed(2) + 'px');
      set(clip, 'cw', 'width', lerp(w0, W, q).toFixed(2) + 'px');
      set(clip, 'ch', 'height', lerp(h0, H, q).toFixed(2) + 'px');
      set(clip, 'cr', 'borderRadius', (16 * (1 - q)).toFixed(2) + 'px');
      set(clip, 'co', 'opacity', e.toFixed(3));
      // while the group is still rising the card's foot can sit below the composer's top edge: it slides out from
      // behind the composer like thread content, never over it. From the FLIP on it has cleared the composer
      var cut = 0;
      if (q === 0) {
        var cb = (composer.getBoundingClientRect().top - stage.getBoundingClientRect().top) / fitK;
        cut = Math.max(0, Math.min(h0, y0 + h0 - cb));
      }
      set(clip, 'cc', 'clipPath', cut > 0 ? 'inset(0 0 ' + cut.toFixed(2) + 'px 0)' : 'none');
    }

    // the end card: hard cut to black, the word in one frame, the mark in one frame
    var end = t >= BEAT.cut;
    if (last.end !== end) { endcard.classList.toggle('on', end); last.end = end; }
    if (last.word !== (t >= BEAT.word)) { last.word = t >= BEAT.word; word.classList.toggle('on', last.word); }
    if (last.mark !== (t >= BEAT.mark)) { last.mark = t >= BEAT.mark; mark.classList.toggle('on', last.mark); }
  }

  // ---------- the video follows the timeline ----------
  var lastSync = -1e9;
  function syncVideo(t, now) {
    if (t >= BEAT.card && t < BEAT.cut) {
      var want = t - BEAT.card;
      if (vid.paused) {
        if (Math.abs(vid.currentTime - want) > 0.08) vid.currentTime = want;
        var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
        lastSync = now;
      } else if (!vid.seeking && now - lastSync > 300 && Math.abs(vid.currentTime - want) > 0.08) {
        vid.currentTime = want; lastSync = now;
      }
    } else {
      if (!vid.paused) vid.pause();
      // parked on frame 0, ready for the next card beat
      if (t < BEAT.card - 0.3 && vid.currentTime !== 0 && !vid.seeking) vid.currentTime = 0;
    }
  }

  // ---------- clock ----------
  var q0 = new URLSearchParams(location.search).get('t');
  var frozen = q0 !== null && q0 !== '' && isFinite(+q0) ? ((+q0 % LOOP) + LOOP) % LOOP : null;
  var T0 = null;
  function now() { return performance.now(); }
  function clockT() { return T0 === null ? 0 : (((now() - T0) / 1000) % LOOP); }

  function tick() {
    if (frozen === null) {
      var t = clockT();
      render(t);
      syncVideo(t, now());
    }
    requestAnimationFrame(tick);
  }

  function raf2() { return new Promise(function (res) { requestAnimationFrame(function () { requestAnimationFrame(res); }); }); }
  function seekVideoTo(t) {
    return new Promise(function (res) {
      if (!vid.paused) vid.pause();
      var want = t >= BEAT.card && t < BEAT.cut ? Math.min(t - BEAT.card, 3.95) : 0;
      var ready = function () { return vid.readyState >= 2 && !vid.seeking; };
      var done = false, finish = function () { if (!done) { done = true; res(); } };
      setTimeout(finish, 4000);
      if (Math.abs(vid.currentTime - want) > 1 / 240) {
        vid.addEventListener('seeked', function h() { vid.removeEventListener('seeked', h); (function w() { ready() ? finish() : setTimeout(w, 20); })(); });
        vid.currentTime = want;
      } else (function w() { ready() ? finish() : setTimeout(w, 20); })();
    });
  }
  function seek(t) {
    frozen = ((+t % LOOP) + LOOP) % LOOP;
    render(frozen);
    return seekVideoTo(frozen).then(function () { render(frozen); return raf2(); });
  }

  window.LOOP = LOOP;
  window.__ad = { loop: LOOP, t: function () { return frozen !== null ? frozen : curT; }, seek: seek,
    play: function () { frozen = null; T0 = now(); } };

  function start() {
    measure();
    if (frozen !== null) seek(frozen);
    else if (T0 === null) T0 = now();
  }
  addEventListener('resize', function () { measure(); if (frozen !== null) render(frozen); });
  addEventListener('archange', function () { measure(); });
  measure();
  render(frozen !== null ? frozen : 0);
  requestAnimationFrame(tick);
  if (document.readyState === 'complete') start();
  else addEventListener('load', start);
  // system-ui metrics can settle after the first layout: re-measure the names once fonts are ready
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
})();
