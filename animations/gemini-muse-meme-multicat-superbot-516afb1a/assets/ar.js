/* ar.js — the aspect-ratio stage shared by every ad spot.
   Picks one of 16x9 / 4x3 / 1x1 / 4x5 from ?ar= (the gallery passes it) or, standalone, the
   nearest to the viewport. Exposes window.AR = { key, w, h, crop, ratio } in stage px (height is
   always 1080, width follows the ratio) and mirrors it onto <html> as data-ar + CSS vars:
     --ar-w      stage width in px            (1920 / 1440 / 1080 / 864)
     --ar-crop   (1920 - w) / 2 in px         how far a 1920-wide scene is shifted to center-crop
     --ar-ratio  "16 / 9" etc                 for the fluid ads' aspect-ratio
     --ar-f      w / h as a number            for calc() widths
   Load it synchronously in <head> before the ad's own styles so nothing paints at the wrong size. */
(function () {
  'use strict';
  var RATIOS = { '16x9': [16, 9], '4x3': [4, 3], '1x1': [1, 1], '4x5': [4, 5] };
  var H = 1080;
  var doc = document.documentElement;

  function fromQuery() {
    var q = new URLSearchParams(location.search).get('ar');
    if (!q) return null;
    q = q.replace(':', 'x').replace('-', 'x');
    return RATIOS[q] ? q : null;
  }
  function nearest() {
    var f = innerWidth / Math.max(1, innerHeight), best = '16x9', d = Infinity;
    for (var k in RATIOS) {
      var r = RATIOS[k][0] / RATIOS[k][1], dd = Math.abs(Math.log(f / r));
      if (dd < d) { d = dd; best = k; }
    }
    return best;
  }
  var locked = fromQuery();

  function apply(key) {
    var a = RATIOS[key][0], b = RATIOS[key][1];
    var w = Math.round(H * a / b);
    var prev = window.AR && window.AR.key;
    window.AR = { key: key, w: w, h: H, crop: (1920 - w) / 2, ratio: a / b, a: a, b: b };
    doc.dataset.ar = key;
    doc.style.setProperty('--ar-w', w + 'px');
    doc.style.setProperty('--ar-crop', ((1920 - w) / 2) + 'px');
    doc.style.setProperty('--ar-ratio', a + ' / ' + b);
    doc.style.setProperty('--ar-f', String(a / b));
    if (prev && prev !== key) dispatchEvent(new CustomEvent('archange', { detail: window.AR }));
  }

  apply(locked || nearest());
  if (!locked) addEventListener('resize', function () { apply(nearest()); });

  /* Hold the first paint until ar.css has applied, but only on a narrower-than-16:9 frame,
     where its rules are what reflow the scene. ar.js is a <script> in <head> and always runs
     before the body parses, while the ar.css <link> beside it can still be in flight when the
     iframe starts painting: in that window every scene designed at 1920 wide sits wider than
     the stage and is clipped on the right. Hiding for those few frames shows black instead of
     a broken frame. The reveal is unconditional: a 1.5s cap and the load event both release it,
     so a missing or failed ar.css costs a short delay, never a blank spot. */
  if ((window.AR && window.AR.key) !== '16x9') {
    var revealed = false;
    var reveal = function () {
      if (revealed) return;
      revealed = true;
      doc.style.visibility = '';
    };
    doc.style.visibility = 'hidden';
    var give_up_at = Date.now() + 1500;
    var poll = function () {
      var ready = getComputedStyle(doc).getPropertyValue('--ar-ready').trim() === '1';
      if (ready || Date.now() > give_up_at) reveal();
      else requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
    addEventListener('load', reveal);
    setTimeout(reveal, 1600);
  }
})();
