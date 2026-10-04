// B3 (3.25-4.80): YouTube Studio > Content, inside a framed browser window (ux/ux.js windowFrame, never full-bleed).
// The new upload's row shows its auto frame (img/frame-1.jpg, a frame of the video) while the in-window camera sits
// pushed in on the row. The winner (slot b) flies from its race pane into the row's thumbnail slot and replaces the
// auto frame; "A/B test running" lands on the row (the base's chime sounds as the winner lands); then the camera eases
// back to the whole page and Studio's A/B Test report rises over the scrim with all three thumbnails and their watch
// time share. Every YouTube surface comes from ux/ux.js (studioContent, testCompare, overlay, windowFrame).
import { lerp, seg, outCubic, inOutCubic, clamp, boxIn } from '../../../lib.js';
import { studioContent, testCompare, overlay, windowFrame } from '../../../ux/ux.js';
import { STUDIO, RACE } from '../marks.js';

const img = (f) => new URL('../../../img/' + f, import.meta.url).href;
// the framed window, in stage px at 1080 high: a visible margin all round
export const WIN = { x: 100, y: 58, w: 1720, h: 964 };
export const DESIGN_W = 1536; // ux.js components are measured at a 1536 px wide viewport
const ZOOM = 1.3;             // the in-window camera, pushed in on the top left: Studio's bar and menu, the new row

export function buildStudio(layer, data, models) {
  const v = data.video;
  // before the test the row carries the video's auto frame; the winner (data.video.thumb) arrives by air
  const d = { ...data, video: { ...v, thumb: v.frame } };
  const base = studioContent(d, { ab: 'running' });
  const dlg = testCompare(data, { state: 'running', buttons: false });
  const K = WIN.w / DESIGN_W;
  const win = windowFrame(overlay(base, dlg), {
    url: 'studio.youtube.com/channel/UC7s9xRw2kQm4Lp8tYv3nBaQ/videos/upload',
    tab: 'Channel content - YouTube Studio', scale: K,
  });
  layer.appendChild(win);
  const q = (s) => win.querySelector(`[data-ux="${s}"]`);
  const slot = q('row-thumb-slot');
  const winImg = document.createElement('img');
  winImg.className = 'x3-slot-win';
  winImg.src = img(models.slots.find((s) => s.slot === 'b').file);
  winImg.alt = '';
  slot.insertBefore(winImg, slot.querySelector('.ytx-len'));
  return {
    layer, win, K, slot, winImg, fit: win.querySelector('.ytx-win-fit'), view: q('window-view'),
    chip: q('ab-chip'), scrim: q('scrim'), dlayer: q('dialog-layer'), dlg: q('abtest'), fill: q('ab-progress-fill'), dk: null,
  };
}

// the A/B Test report needs ~745 design px of height (853 px at a 1760 px frame): it is scaled as a whole with a
// transform to fit the window's viewport (never squeezed, which would clip its last card), at most 1.1x
function dialogScale(s) {
  if (s.dk) return s.dk;
  const h = s.dlg.offsetHeight, avail = s.view.clientHeight / s.K - 32;
  if (!h) return 1;
  s.dk = Math.min(1.1, avail / h);
  return s.dk;
}

// the in-window camera: zoom z about the design point (fx, fy), clamped so the page never shows past its edges
function camera(s, z, fx, fy) {
  const VW = s.view.clientWidth, VH = s.view.clientHeight, k = s.K * z;
  const tx = clamp(VW / 2 - fx * k, VW * (1 - z), 0), ty = clamp(VH / 2 - fy * k, VH * (1 - z), 0);
  s.fit.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${k.toFixed(5)})`;
}

export function renderStudio(s, t, root, flyer, fromCanvas) {
  const vis = t >= STUDIO.in[0] - 0.01 && t < STUDIO.out[1] + 0.01;
  s.layer.style.visibility = vis ? 'visible' : 'hidden';
  flyer.style.visibility = 'hidden';
  if (!vis) return;
  const win = outCubic(seg(t, STUDIO.in[0], STUDIO.in[1]));
  const out = inOutCubic(seg(t, STUDIO.out[0], STUDIO.out[1]));
  s.layer.style.opacity = (win * (1 - out)).toFixed(3);
  s.layer.style.transform = `translateY(${(-out * 26).toFixed(2)}px) scale(${lerp(0.975, 1, win).toFixed(4)})`;

  // the camera: pushed in on the page's top left (the Studio logo and menu, Channel content, the new row with its
  // thumbnail, title and A/B chip), then back to the whole page
  s.slot.style.transform = 'none';
  const zo = inOutCubic(seg(t, STUDIO.zoomOut[0], STUDIO.zoomOut[1]));
  camera(s, lerp(ZOOM, 1, zo), 0, 0);

  // the flight: pane b's picture to the row's slot (an arc, radius 12 -> the slot's 8 px at the camera's scale)
  // (from RACE.out it already sits exactly over pane b's picture, so the pane can fade out under it)
  const [f0, f1] = STUDIO.fly;
  const landed = t >= f1;
  if (t >= RACE.out[0] && !landed) {
    const a = boxIn(fromCanvas, root), b = boxIn(s.slot, root);
    const f = inOutCubic(seg(t, f0, f1));
    const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f) - Math.sin(Math.PI * f) * 70;
    const w = lerp(a.w, b.w, f), h = lerp(a.h, b.h, f);
    Object.assign(flyer.style, {
      visibility: 'visible', left: x.toFixed(2) + 'px', top: y.toFixed(2) + 'px', width: w.toFixed(2) + 'px', height: h.toFixed(2) + 'px',
      borderRadius: lerp(0, b.h * 8 / 68, f).toFixed(2) + 'px',
    });
    flyer.style.boxShadow = `0 ${(18 * Math.sin(Math.PI * f)).toFixed(1)}px ${(48 * Math.sin(Math.PI * f)).toFixed(1)}px rgba(0,0,0,${(0.45 * Math.sin(Math.PI * f)).toFixed(3)})`;
  }
  // landed: the winner replaces the auto frame, with a small settle
  s.winImg.style.opacity = landed ? '1' : '0';
  const pop = seg(t, f1, f1 + 0.22);
  s.slot.style.transform = landed && pop < 1 ? `scale(${(1 + 0.08 * Math.sin(Math.PI * pop)).toFixed(4)})` : 'none';
  // the row's A/B chip lands
  const c = outCubic(seg(t, STUDIO.chip[0], STUDIO.chip[1]));
  s.chip.style.opacity = c.toFixed(3);
  s.chip.style.transform = c >= 1 ? 'none' : `scale(${lerp(0.8, 1, c).toFixed(4)})`;
  // the A/B Test report over the scrim
  const d = outCubic(seg(t, STUDIO.dlg[0], STUDIO.dlg[1]));
  s.scrim.style.opacity = d.toFixed(3);
  s.dlayer.style.opacity = d.toFixed(3);
  s.dlayer.style.transform = `translateY(${((1 - d) * 30).toFixed(2)}px)`;
  s.dlg.style.transform = `scale(${dialogScale(s).toFixed(4)})`;
  if (s.fill) s.fill.style.width = (lerp(0, 9, seg(t, STUDIO.dlg[0] + 0.1, STUDIO.out[1]))).toFixed(2) + '%';
}
