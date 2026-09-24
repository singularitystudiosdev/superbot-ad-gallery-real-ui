// Appling: "the app for making apps", as it launches in the build scene's phone emulator.
// The whole screen is a pure function of t (seconds from launch): same t => same pixels, any order.
//
//   0.00-0.90  launch: the icon grows into the splash, the splash lifts, home settles (staggered)
//   1.35       a finger taps the prompt field; the keyboard rises, the page scrolls the field up
//   1.62-2.85  "A habit tracker with streaks" types at a steady 22 chars/s (key balloons, predictions)
//   3.05       tap Build: press, the keyboard drops, the build view pushes in
//   3.62-5.94  live checklist (Designing screens, Writing code, Adding streaks, Testing on device),
//              progress bar + %, the app skeleton assembles above it, then a test scan sweeps it
//   6.02-6.60  the finished Habit Hero card grows into a full live preview
//   7.00       tap the last habit: check fills, "All done!", streak 6 -> 7 pops, today's cell fills
//   8.00-8.50  "Habit Hero is ready" sheet with Add to Home Screen + Share, confetti, then holds
//
// API: ?ad=1 exposes window.adRender(t) and window.AD_DUR and never runs a clock of its own.
//      ?t=<s> freezes one frame. With neither, it loops itself through requestAnimationFrame.
(function () {
  'use strict';

  var AD_DUR = 9.8;
  window.AD_DUR = AD_DUR;

  var Q = new URLSearchParams(location.search);
  var AD = Q.get('ad') === '1';
  var T_FIX = Q.has('t') ? parseFloat(Q.get('t')) : null;

  // ---------------------------------------------------------------- helpers
  var clamp = function (x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, x)); };
  var lerp = function (a, b, f) { return a + (b - a) * f; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var outCubic = function (x) { return 1 - Math.pow(1 - x, 3); };
  var outQuint = function (x) { return 1 - Math.pow(1 - x, 5); };
  var inOutCubic = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var outBack = function (x, k) { var c1 = k || 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  var bell = function (x) { return Math.sin(Math.PI * clamp(x)); };
  var mix = function (c1, c2, f) {
    return 'rgb(' + Math.round(lerp(c1[0], c2[0], f)) + ',' + Math.round(lerp(c1[1], c2[1], f)) + ',' + Math.round(lerp(c1[2], c2[2], f)) + ')';
  };
  var $ = function (id) { return document.getElementById(id); };
  var css = function (el, k, v) { if (el.style[k] !== v) el.style[k] = v; };
  var op = function (el, v) { css(el, 'opacity', String(+clamp(v).toFixed(3))); };
  var tf = function (el, v) { css(el, 'transform', v); };
  var txt = function (el, s) { if (el.textContent !== s) el.textContent = s; };
  var vis = function (el, on) { css(el, 'visibility', on ? 'visible' : 'hidden'); };
  var px = function (n) { return n.toFixed(2) + 'px'; };

  // ------------------------------------------------------------------ icons
  // lucide-style UI glyphs (ISC), inlined so the page needs no network.
  var ICONS = {
    sprout: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    'calendar-check': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    'chef-hat': '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    compass: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    del: '<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>',
    shift: '<path d="M9 18v-6H5l7-7 7 7h-4v6H9z"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
    'square-plus': '<rect width="18" height="18" x="3" y="3" rx="4"/><path d="M8 12h8"/><path d="M12 8v8"/>'
  };
  function paintIcons(root) {
    var els = root.querySelectorAll('i[data-icon]');
    for (var i = 0; i < els.length; i++) {
      var name = els[i].getAttribute('data-icon');
      els[i].innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    }
  }

  // ----------------------------------------------------------------- script
  var PROMPT = 'A habit tracker with streaks';
  var CPS = 22;                      // steady, no jitter
  var T = {
    launch0: 0.06, launch1: 0.5,     // icon grows into the splash
    word0: 0.28, word1: 0.5,         // wordmark
    splashOut0: 0.62, splashOut1: 0.9,
    homeIn: 0.64, homeStagger: 0.045, homeDur: 0.42,
    tapField: 1.35,
    focus0: 1.38, focus1: 1.6,
    kbUp0: 1.4, kbUp1: 1.76,
    type0: 1.62,
    tapBuild: 3.05,
    kbDown0: 3.1, kbDown1: 3.42,
    push0: 3.18, push1: 3.66,
    steps0: 3.62, stepDur: 0.58,     // 4 steps => done at 5.94
    scan0: 5.4, scan1: 5.92,
    expand0: 6.02, expand1: 6.6,
    tapCheck: 7.0,
    streak0: 7.3,
    sheet0: 8.0, sheet1: 8.5,
    confetti0: 8.28
  };
  var keyAt = [];
  for (var k = 0; k < PROMPT.length; k++) keyAt.push(T.type0 + k / CPS);
  var TYPE1 = keyAt[keyAt.length - 1];
  var STEP = [0, 1, 2, 3].map(function (i) { return [T.steps0 + i * T.stepDur, T.steps0 + (i + 1) * T.stepDur]; });

  // --------------------------------------------------------------- mounting
  paintIcons(document);
  var screen = $('screen');

  // keyboard (iOS light, lowercase keys, predictive bar)
  var KEY = {};
  var LETTERS = [];
  (function buildKeyboard() {
    var rows = $('kb-rows');
    var mk = function (cls, html) { var d = document.createElement('span'); d.className = 'key ' + (cls || ''); d.innerHTML = html; return d; };
    var row = function (cls) { var r = document.createElement('div'); r.className = 'kb-row ' + cls; rows.appendChild(r); return r; };
    var r1 = row('r1'), r2 = row('r2'), r3 = row('r3'), r4 = row('r4');
    'qwertyuiop'.split('').forEach(function (c) { var e = mk('', c); KEY[c] = e; LETTERS.push([c, e]); r1.appendChild(e); });
    'asdfghjkl'.split('').forEach(function (c) { var e = mk('', c); KEY[c] = e; LETTERS.push([c, e]); r2.appendChild(e); });
    var shift = mk('sp wide', '<i data-icon="shift"></i>'); shift.id = 'k-shift'; r3.appendChild(shift);
    var mid = document.createElement('span'); mid.className = 'mid'; r3.appendChild(mid);
    'zxcvbnm'.split('').forEach(function (c) { var e = mk('', c); KEY[c] = e; LETTERS.push([c, e]); mid.appendChild(e); });
    r3.appendChild(mk('sp wide', '<i data-icon="del"></i>'));
    r4.appendChild(mk('sp num', '123'));
    var sp = mk('space', 'space'); KEY[' '] = sp; r4.appendChild(sp);
    r4.appendChild(mk('sp ret', 'return'));
    paintIcons($('kbd'));
    // the bottom strip: emoji left, dictation right
    $('kbd').querySelector('.kb-bottom').innerHTML = '<i data-icon="smile"></i><i data-icon="mic"></i>';
    paintIcons($('kbd').querySelector('.kb-bottom'));
  })();

  // confetti, seeded so every run and every frame order agrees
  var CONF = [];
  (function buildConfetti() {
    var s = 0x9e3779b9;
    var rnd = function () { s |= 0; s = s + 0x6d2b79f5 | 0; var r = Math.imul(s ^ s >>> 15, 1 | s); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };
    var COLORS = ['#ff6a2c', '#ffc83d', '#10b981', '#3b82f6', '#f43f5e', '#a78bfa', '#ff9a3c'];
    var box = $('confetti');
    for (var i = 0; i < 34; i++) {
      var ang = lerp(-162, -18, rnd()) * Math.PI / 180;
      var sp = lerp(420, 760, rnd());
      var p = {
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        delay: rnd() * 0.08, spin: lerp(-900, 900, rnd()), rot0: rnd() * 360,
        w: lerp(7, 11, rnd()), h: lerp(4, 6.5, rnd()), el: document.createElement('b')
      };
      p.el.style.width = p.w.toFixed(1) + 'px';
      p.el.style.height = p.h.toFixed(1) + 'px';
      p.el.style.background = COLORS[i % COLORS.length];
      if (i % 5 === 0) p.el.style.borderRadius = '50%';
      box.appendChild(p.el);
      CONF.push(p);
    }
  })();

  // element handles
  var E = {
    wall: $('wall'), wallLabel: document.querySelector('.wall-label'), splash: $('splash'), splashIn: $('splash-in'),
    glyph: $('splash-glyph'), word: $('splash-word'),
    status: $('statusbar'), sbBack: $('sb-back'), homeind: $('homeind'),
    home: $('home'), homeScroll: $('home-scroll'), homeShade: $('home-shade'),
    ins: Array.prototype.slice.call(document.querySelectorAll('#home .in')),
    prompt: $('prompt'), placeholder: $('placeholder'), ptext: $('ptext'), caret: $('caret'),
    build: $('build'), buildBg: $('build-bg'), chipHabit: $('chip-habit'),
    touchField: $('touch-field'), touchBuild: $('touch-build'), touchCheck: $('touch-check'),
    kbd: $('kbd'), kbPop: $('kb-pop'), kbPopTxt: $('kb-pop').firstElementChild, shift: $('k-shift'),
    sg: [$('sg0'), $('sg1'), $('sg2')],
    gen: $('gen'), bubble: $('bubble'), card: $('appcard'), scan: $('scan'),
    ntBuild: $('nt-build'), ntLive: $('nt-live'), liveDot: document.querySelector('.live-dot'),
    progress: $('progress'), pgT1: $('pg-t1'), pgT2: $('pg-t2'), pgPct: $('pg-pct'), pgFill: $('pg-fill'),
    steps: [0, 1, 2, 3].map(function (i) { var li = $('st' + i); return { li: li, ic: li.querySelector('.st-ic'), spin: li.querySelector('.spin'), done: li.querySelector('.st-done') }; }),
    blocks: ['b-head', 'b-streak', 'b-lt', 'b-r1', 'b-r2', 'b-r3', 'b-tab'].map(function (id) { var b = $(id); return { el: b, real: b.querySelector('.real'), sk: b.querySelector('.sk') }; }),
    heat: Array.prototype.slice.call(document.querySelectorAll('.heat .cell .fill')),
    heatFuture: Array.prototype.slice.call(document.querySelectorAll('.heat .cell.future')),
    todayFill: $('today-fill'), numOld: $('num-old'), numNew: $('num-new'), flame: $('flame'),
    sparks: Array.prototype.slice.call(document.querySelectorAll('#flame .spark')),
    cntA: $('cnt-a'), cntB: $('cnt-b'), row3: $('row3'), check3Fill: $('check3-fill'), check3Path: $('check3-path'),
    dim: $('dim'), sheet: $('sheet'), shIcon: $('sh-icon'), shIns: Array.prototype.slice.call(document.querySelectorAll('#sheet .sh-in'))
  };

  // block choreography inside the generated app: [appear, reveal]
  var BLOCK_T = [
    [3.66, 4.28],   // header
    [3.73, 4.86],   // streak card (revealed during "Adding streaks")
    [3.80, 4.36],   // list title
    [3.87, 4.44],   // habit rows
    [3.94, 4.52],
    [4.01, 4.60],
    [4.08, 4.68]    // tab bar
  ];

  // predictive bar: what iOS would offer while each word is typed
  var WORDS = PROMPT.split(' ');
  var ALT = { A: 'I', habit: 'habits', tracker: 'track', 'with': 'will', streaks: 'streak' };
  var NEXT = { A: ['new', 'habit', 'simple'], habit: ['tracker', 'of', 'that'], tracker: ['for', 'with', 'app'], 'with': ['streaks', 'a', 'reminders'] };

  // ------------------------------------------------------------ touch ripple
  function touch(el, t, at) {
    var a = t - at;
    if (a < -0.16 || a > 0.55) { op(el, 0); return; }
    var dot = el.firstElementChild, ring = el.lastElementChild;
    var arrive = outCubic(seg(a, -0.16, -0.03));
    var leave = 1 - outCubic(seg(a, 0.16, 0.4));
    var press = a < 0 ? 0 : (a < 0.09 ? outCubic(a / 0.09) : 1 - outCubic(seg(a, 0.09, 0.26)));
    op(el, 1);
    op(dot, arrive * leave);
    tf(dot, 'scale(' + (lerp(1.25, 1, arrive) - 0.16 * press).toFixed(3) + ')');
    var r = seg(a, 0, 0.4);
    op(ring, a < 0 ? 0 : 0.9 * (1 - outCubic(r)));
    tf(ring, 'scale(' + (0.8 + 0.9 * outCubic(r)).toFixed(3) + ')');
  }

  // ------------------------------------------------------------------ render
  var lastCaps = null;
  function render(tIn) {
    var t = clamp(+tIn || 0, 0, AD_DUR);

    // ---- launch: icon -> splash -> home
    var le = outQuint(seg(t, T.launch0, T.launch1));
    var so = outCubic(seg(t, T.splashOut0, T.splashOut1));
    vis(E.wall, le < 1);
    op(E.wallLabel, 1 - seg(t, T.launch0, 0.18));
    vis(E.splash, so < 1);
    if (so < 1) {
      css(E.splash, 'left', px(lerp(151, 0, le)));
      css(E.splash, 'top', px(lerp(378, 0, le)));
      css(E.splash, 'width', px(lerp(88, 390, le)));
      css(E.splash, 'height', px(lerp(88, 844, le)));
      css(E.splash, 'borderRadius', px(lerp(20, 54, le)));
      op(E.splash, 1 - so);
      tf(E.splash, 'scale(' + (1 + 0.05 * so).toFixed(4) + ')');
      var g = lerp(52, 104, le);
      css(E.glyph, 'width', px(g)); css(E.glyph, 'height', px(g));
      var w = outCubic(seg(t, T.word0, T.word1));
      tf(E.splashIn, 'translateY(' + px(-26 * w) + ')');
      op(E.word, w);
      tf(E.word, 'translateY(' + px(10 * (1 - w)) + ')');
    }
    var white = 1 - so;   // status bar + home indicator are white over the launch, ink after
    var chrome = mix([255, 255, 255], [18, 20, 23], 1 - white);
    css(E.status, 'color', chrome);
    css(E.homeind, 'background', chrome);

    // staggered home entrance
    for (var i = 0; i < E.ins.length; i++) {
      var k2 = +E.ins[i].getAttribute('data-in');
      var st = T.homeIn + k2 * T.homeStagger;
      var p = outCubic(seg(t, st, st + T.homeDur));
      var under = k2 === 0 ? 1 - outCubic(seg(t, T.kbUp0, T.kbUp0 + 0.2)) : 1;   // the topbar slides under the status bar
      op(E.ins[i], p * under);
      tf(E.ins[i], p >= 1 ? 'none' : 'translateY(' + px(18 * (1 - p)) + ')');
    }

    // ---- tap the field, keyboard up, type
    touch(E.touchField, t, T.tapField);
    var f = outCubic(seg(t, T.focus0, T.focus1));
    css(E.prompt, 'borderColor', mix([229, 226, 220], [16, 185, 129], f));
    css(E.prompt, 'boxShadow', '0 0 0 ' + (4 * f).toFixed(2) + 'px rgba(16,185,129,' + (0.16 * f).toFixed(3) + '), 0 8px 24px rgba(20,20,20,.05)');
    var n = 0;
    while (n < keyAt.length && keyAt[n] <= t) n++;
    txt(E.ptext, PROMPT.slice(0, n));
    op(E.placeholder, n > 0 ? 0 : 1);
    var caretOn = 0;
    if (f > 0 && t < T.push1) {
      if (t >= T.type0 - 0.05 && t < TYPE1 + 0.45) caretOn = 1;
      else {
        var ref = t < T.type0 ? T.focus0 : TYPE1 + 0.45;
        caretOn = ((t - ref) % 1.0) < 0.55 ? 1 : 0;
      }
    }
    op(E.caret, caretOn * f);

    var sc = outCubic(seg(t, T.kbUp0, T.kbUp1));
    tf(E.homeScroll, sc > 0 ? 'translateY(' + px(-66 * sc) + ')' : 'none');

    var ku = outCubic(seg(t, T.kbUp0, T.kbUp1)) * (1 - outCubic(seg(t, T.kbDown0, T.kbDown1)));
    vis(E.kbd, ku > 0);
    tf(E.kbd, 'translateY(' + px(336 * (1 - ku)) + ')');
    if (ku > 0) renderKeyboard(t, n);

    // template chip lights up once "habit" is typed
    var hc = seg(t, keyAt[6] + 0.02, keyAt[6] + 0.32);
    css(E.chipHabit, 'background', mix([255, 255, 255], [220, 245, 234], hc));
    css(E.chipHabit, 'borderColor', mix([229, 226, 220], [16, 185, 129], hc));
    css(E.chipHabit, 'color', mix([18, 20, 23], [7, 128, 93], hc));
    tf(E.chipHabit, 'scale(' + (1 + 0.07 * bell(hc)).toFixed(4) + ')');

    // Build enables with the first character, then gets pressed
    var en = outCubic(seg(t, keyAt[0], keyAt[0] + 0.25));
    op(E.buildBg, en);
    css(E.build, 'color', mix([164, 167, 173], [255, 255, 255], en));
    var ba = t - T.tapBuild;
    var bp = ba < 0 ? 0 : (ba < 0.1 ? outCubic(ba / 0.1) : 1 - outCubic(seg(ba, 0.1, 0.34)));
    tf(E.build, 'scale(' + (1 - 0.07 * bp).toFixed(4) + ')');
    css(E.build, 'filter', bp > 0 ? 'brightness(' + (1 - 0.12 * bp).toFixed(3) + ')' : 'none');
    touch(E.touchBuild, t, T.tapBuild);

    // ---- push to the build view
    var pu = outCubic(seg(t, T.push0, T.push1));
    vis(E.home, pu < 1);
    tf(E.home, pu > 0 ? 'translateX(' + px(-120 * pu) + ')' : 'none');
    op(E.homeShade, 0.16 * pu);
    vis(E.gen, pu > 0);
    tf(E.gen, 'translateX(' + px(390 * (1 - pu)) + ')');
    op(E.sbBack, sc * (1 - pu));

    if (pu > 0) renderBuild(t);

    // ---- ready sheet
    var sh = outQuint(seg(t, T.sheet0, T.sheet1));
    vis(E.sheet, sh > 0); vis(E.dim, sh > 0);
    op(E.dim, 0.42 * outCubic(seg(t, T.sheet0, T.sheet0 + 0.35)));
    tf(E.sheet, 'translateY(' + px(420 * (1 - sh)) + ')');
    if (sh > 0) {
      var ic = seg(t, T.sheet0 + 0.12, T.sheet0 + 0.5);
      op(E.shIcon, seg(t, T.sheet0 + 0.12, T.sheet0 + 0.22));
      tf(E.shIcon, 'scale(' + lerp(0.45, 1, outBack(ic, 2.2)).toFixed(4) + ')');
      for (var j = 0; j < E.shIns.length; j++) {
        var s0 = T.sheet0 + 0.18 + j * 0.05;
        var q = outCubic(seg(t, s0, s0 + 0.36));
        op(E.shIns[j], q);
        tf(E.shIns[j], 'translateY(' + px(14 * (1 - q)) + ')');
      }
    }
    renderConfetti(t);
  }

  function renderKeyboard(t, n) {
    // shift (auto-capital) is on until the first character lands
    var caps = n === 0;
    if (caps !== lastCaps) {
      lastCaps = caps;
      for (var i = 0; i < LETTERS.length; i++) LETTERS[i][1].textContent = caps ? LETTERS[i][0].toUpperCase() : LETTERS[i][0];
      E.shift.style.background = caps ? '#fff' : '';
      E.shift.querySelector('svg').style.fill = caps ? '#000' : 'none';
    }
    // the key being struck: a balloon for letters, a darker space bar
    var hit = -1;
    for (var c = 0; c < keyAt.length; c++) if (t >= keyAt[c] && t < keyAt[c] + 0.1) hit = c;
    var space = KEY[' '];
    css(space, 'background', hit >= 0 && PROMPT[hit] === ' ' ? '#abb0b9' : '#fff');
    if (hit >= 0 && PROMPT[hit] !== ' ') {
      var ch = PROMPT[hit], key = KEY[ch.toLowerCase()];
      op(E.kbPop, 1);
      txt(E.kbPopTxt, ch);
      css(E.kbPop, 'left', px(key.offsetLeft + key.offsetWidth / 2 - 28));
      css(E.kbPop, 'top', px(key.offsetTop + 42 - 104));
    } else op(E.kbPop, 0);

    // predictions
    var typed = PROMPT.slice(0, n);
    var sg;
    if (n === 0) sg = ['I', 'The', "I'm", 1];
    else if (typed[typed.length - 1] === ' ') {
      var prev = typed.trim().split(' ').pop();
      var nx = NEXT[prev] || ['the', 'a', 'my'];
      sg = [nx[0], nx[1], nx[2], 0];
    } else {
      var parts = typed.split(' ');
      var partial = parts[parts.length - 1], word = WORDS[parts.length - 1];
      sg = ['“' + partial + '”', word, ALT[word] || word, 1];
    }
    for (var s = 0; s < 3; s++) {
      txt(E.sg[s], sg[s]);
      var best = sg[3] === 1 ? s === 1 : s === 0;
      if (E.sg[s].classList.contains('sg-best') !== best) E.sg[s].classList.toggle('sg-best', best);
    }
  }

  function renderBuild(t) {
    // prompt bubble and the card frame arrive with the push
    var b = outCubic(seg(t, 3.45, 3.8));
    var ex = outCubic(seg(t, T.expand0, T.expand0 + 0.24));
    op(E.bubble, b * (1 - ex));
    tf(E.bubble, 'translateY(' + px(10 * (1 - b) - 10 * ex) + ') scale(' + lerp(0.94, 1, b).toFixed(4) + ')');

    var c = outCubic(seg(t, 3.5, 3.86));
    var e = outQuint(seg(t, T.expand0, T.expand1));
    var s = lerp(0.5, 1, e) * lerp(0.92, 1, c);
    var x = 195 - 358 * s / 2;
    var y = lerp(166, 112, e) + 16 * (1 - c);
    op(E.card, c);
    tf(E.card, 'translate(' + px(x) + ',' + px(y) + ') scale(' + s.toFixed(4) + ')');
    css(E.card, 'boxShadow', '0 2px 6px rgba(40,20,10,.06), 0 ' + (10 + 14 * e).toFixed(1) + 'px ' + (24 + 22 * e).toFixed(1) + 'px rgba(40,20,10,' + (0.1 + 0.06 * e).toFixed(3) + ')');
    var shim = (140 - ((t * 0.9) % 1) * 180).toFixed(1) + '% 0';

    // skeleton -> real blocks
    for (var i = 0; i < E.blocks.length; i++) {
      var bl = E.blocks[i], bt = BLOCK_T[i];
      var a = outCubic(seg(t, bt[0], bt[0] + 0.32));
      var r = outCubic(seg(t, bt[1], bt[1] + 0.3));
      op(bl.el, a);
      tf(bl.el, a >= 1 ? 'none' : 'translateY(' + px(10 * (1 - a)) + ')');
      op(bl.real, r);
      op(bl.sk, 1 - r);
      if (r < 1) {
        css(bl.sk, 'backgroundPosition', shim);
        var bars = bl.sk.children;
        for (var z = 0; z < bars.length; z++) css(bars[z], 'backgroundPosition', shim);
      }
    }

    // streak card: count up, fill the week, then the scan tests it
    var cu = outCubic(seg(t, 4.9, 5.34));
    var sOld = Math.round(6 * cu);
    for (var h = 0; h < 3; h++) {
      var hp = seg(t, 4.95 + h * 0.08, 5.27 + h * 0.08);
      tf(E.heat[h], 'scale(' + lerp(0.3, 1, outBack(hp, 2)).toFixed(4) + ')');
      op(E.heat[h], seg(t, 4.95 + h * 0.08, 5.05 + h * 0.08));
    }
    for (var fu = 0; fu < E.heatFuture.length; fu++) op(E.heatFuture[fu], seg(t, 5.12 + fu * 0.05, 5.4 + fu * 0.05));

    var scn = seg(t, T.scan0, T.scan1);
    op(E.scan, bell(scn) * 1.4);
    tf(E.scan, 'translateY(' + px(lerp(-110, 690, inOutCubic(scn))) + ')');

    // progress + checklist
    var pin = outCubic(seg(t, 3.58, 3.92));
    var pout = outCubic(seg(t, T.expand0 - 0.04, T.expand0 + 0.14));   // gone before the card grows over it (the card also stacks above it)
    vis(E.progress, pout < 1);
    op(E.progress, pin * (1 - pout));
    tf(E.progress, 'translateY(' + px(14 * (1 - pin) + 50 * pout) + ')');
    var pct = 0;
    for (var k = 0; k < 4; k++) {
      var s0 = STEP[k][0], s1 = STEP[k][1], S = E.steps[k];
      pct += inOutCubic(seg(t, s0, s1)) * 25;
      var active = t >= s0 && t < s1, done = t >= s1;
      css(S.li, 'color', done || active ? '#121417' : '#aaaeb4');
      op(S.spin, active ? outCubic(seg(t, s0, s0 + 0.12)) : 0);
      if (active) tf(S.spin, 'rotate(' + ((t - s0) * 420 % 360).toFixed(1) + 'deg)');
      var dp = seg(t, s1, s1 + 0.3);
      tf(S.done, 'scale(' + (done ? outBack(dp, 2.4) : 0).toFixed(4) + ')');
    }
    var pr = Math.round(pct);
    txt(E.pgPct, pr + '%');
    css(E.pgFill, 'width', pct.toFixed(2) + '%');
    var tt = outCubic(seg(t, STEP[0][1] - 0.05, STEP[0][1] + 0.2));
    op(E.pgT1, 1 - tt); op(E.pgT2, tt);
    tf(E.pgT1, 'translateY(' + px(-8 * tt) + ')');
    tf(E.pgT2, 'translateY(' + px(8 * (1 - tt)) + ')');

    // nav title: New app -> live Habit Hero
    var nl = outCubic(seg(t, T.expand0 + 0.24, T.expand0 + 0.5));
    op(E.ntBuild, 1 - seg(t, T.expand0 + 0.12, T.expand0 + 0.26)); op(E.ntLive, nl);   // outgoing title clears before the new one reads
    tf(E.ntLive, 'translateY(' + px(6 * (1 - nl)) + ')');
    var pulse = ((t - T.expand0) % 1.2) / 1.2;
    css(E.liveDot, 'boxShadow', '0 0 0 ' + (3 + 5 * pulse).toFixed(2) + 'px rgba(34,197,94,' + (0.3 * (1 - pulse)).toFixed(3) + ')');

    // ---- the tap: last habit checked, streak 6 -> 7
    touch(E.touchCheck, t, T.tapCheck);
    tf(E.row3, 'scale(' + (1 - 0.025 * bell(seg(t, T.tapCheck - 0.02, T.tapCheck + 0.26))).toFixed(4) + ')');
    tf(E.check3Fill, 'scale(' + clamp(outBack(seg(t, T.tapCheck + 0.03, T.tapCheck + 0.3), 2.2), 0, 2).toFixed(4) + ')');
    css(E.check3Path, 'strokeDashoffset', (20 * (1 - outCubic(seg(t, T.tapCheck + 0.1, T.tapCheck + 0.36)))).toFixed(2));

    var cn = outCubic(seg(t, T.tapCheck + 0.22, T.tapCheck + 0.44));
    op(E.cntA, 1 - cn); op(E.cntB, cn);
    tf(E.cntA, 'translateY(' + px(-8 * cn) + ')');
    tf(E.cntB, 'translateY(' + px(8 * (1 - cn)) + ') scale(' + lerp(0.8, 1, outBack(cn, 2)).toFixed(4) + ')');

    var so = outCubic(seg(t, T.streak0, T.streak0 + 0.22));
    var sn = seg(t, T.streak0 + 0.05, T.streak0 + 0.45);
    txt(E.numOld, String(sOld));
    op(E.numOld, 1 - so);
    tf(E.numOld, 'translateY(' + px(-26 * so) + ')');
    op(E.numNew, seg(t, T.streak0 + 0.05, T.streak0 + 0.16));
    tf(E.numNew, 'translateY(' + px(12 * (1 - outCubic(sn))) + ') scale(' + lerp(0.4, 1, outBack(sn, 2.6)).toFixed(4) + ')');
    var fl = bell(seg(t, T.streak0 - 0.02, T.streak0 + 0.42));
    tf(E.flame, 'scale(' + (1 + 0.24 * fl).toFixed(4) + ') rotate(' + (-8 * fl).toFixed(2) + 'deg)');
    var sp = seg(t, T.streak0, T.streak0 + 0.55);
    for (var q = 0; q < E.sparks.length; q++) {
      var ang = (q * 60 - 90) * Math.PI / 180, d = 22 + 30 * outCubic(sp);
      op(E.sparks[q], sp > 0 && sp < 1 ? bell(sp) : 0);
      tf(E.sparks[q], 'translate(' + px(Math.cos(ang) * d) + ',' + px(Math.sin(ang) * d) + ') scale(' + (1 - 0.6 * sp).toFixed(3) + ')');
    }
    E.todayFill.style.setProperty('--f', clamp(outBack(seg(t, T.streak0, T.streak0 + 0.32), 2.2), 0, 2).toFixed(4));
  }

  function renderConfetti(t) {
    var a0 = t - T.confetti0;
    for (var i = 0; i < CONF.length; i++) {
      var p = CONF[i], a = a0 - p.delay;
      if (a <= 0 || a > 1.05) { if (p.el.style.opacity !== '0') p.el.style.opacity = '0'; continue; }
      var xx = 195 + p.vx * a * (1 - 0.35 * a);
      var yy = 516 + p.vy * a + 0.5 * 1500 * a * a;
      p.el.style.opacity = (a < 0.66 ? 1 : 1 - (a - 0.66) / 0.39).toFixed(3);
      p.el.style.transform = 'translate(' + xx.toFixed(1) + 'px,' + yy.toFixed(1) + 'px) rotate(' + (p.rot0 + p.spin * a).toFixed(1) + 'deg)';
    }
  }

  // ------------------------------------------------------------------ driver
  function fit() {
    var W = window.innerWidth, H = window.innerHeight, s, x = 0, y = 0;
    if (AD) {
      s = Math.min(W / 390, H / 844);
      x = (W - 390 * s) / 2; y = (H - 844 * s) / 2;
    } else {
      s = Math.min(1, (H - 48) / 844, (W - 48) / 390);
      x = (W - 390 * s) / 2; y = (H - 844 * s) / 2;
    }
    screen.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + s.toFixed(5) + ')';
  }
  if (!AD) document.body.classList.add('standalone');
  fit();
  window.addEventListener('resize', fit);

  window.adRender = render;

  if (T_FIX !== null && isFinite(T_FIX)) {
    render(T_FIX);
  } else if (AD) {
    render(0);
  } else {
    var t0 = null, LOOP = AD_DUR + 1.2;
    var tick = function (now) {
      if (t0 === null) t0 = now;
      render(Math.min(((now - t0) / 1000) % LOOP, AD_DUR));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
