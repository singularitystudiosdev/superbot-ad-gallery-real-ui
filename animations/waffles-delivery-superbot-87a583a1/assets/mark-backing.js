/* mark-backing.js: a black backing for the real superbot mark (../../../assets/sb-mark-live.js).
   Shared by build/mascot-layer.html (the mascot baked into the doorstep clip) and index.html
   (the same mascot, live, hopping out of the clip into the end card).
   The mark's eyes are cut-outs, so over footage they would show the video through them. markBacking()
   only ADDS a black rect under the body (fully inside its silhouette), so the eyes read black exactly as
   the mark looks on superbot.gg's black page. Nothing is redrawn and the face never changes. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function markBacking(mark) {
    var body = mark.svg.querySelector('.mark-body');
    var back = document.createElementNS(NS, 'rect');
    back.setAttribute('x', '21'); back.setAttribute('y', '43');
    back.setAttribute('width', '58'); back.setAttribute('height', '31'); back.setAttribute('rx', '9');
    back.setAttribute('fill', '#000');
    body.insertBefore(back, body.firstChild);
    return back;
  }
  window.markBacking = markBacking;
})();
