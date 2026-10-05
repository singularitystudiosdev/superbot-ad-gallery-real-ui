// Blender's own window, over superbot while Blender is the tool on duty. The window is the real Blender 5.2.2 LTS UI
// with this spot's scene loaded (media/blender-ui.jpg: two GUI captures of shockmount.blend, Layout workspace, the
// viewport looking through the render camera with the passepartout at 1.0, the Camera selected so the timeline shows
// its keys, the Render properties tab; the frame-1 and frame-630 captures are joined so neither playhead is in it).
// Over it, the parts that move when Blender plays: the camera view (media/blender-view, the EEVEE render of the
// same frames), the timeline's playhead, the current-frame field, and the viewport's "(frame) Scene Collection |
// Camera" line, which Blender draws in the keyframe colour on a frame the selected object has a key on.
import { B, seg, lerp, outCubic, inOutCubic } from './tl.js?v=1db9afb3';
import { makeVideo } from './media.js?v=1db9afb3';

const W_APP = 680;                    // the window's width over the app (app px)
const S = W_APP / 1920;               // capture px -> app px
const X = 1440 - W_APP - 26;          // where it sits: over the browser pane, a little in from the right
const Y = 74;
const PLAY_FROM = 30, PLAY_FPS = 30;  // the viewport plays from frame 30 in real time
const CAM_KEYS = new Set([1, 136, 193, 352, 382, 466, 529]);
const tx = (f) => 56.7 + (f - 1) * 2.3221;   // timeline frame -> capture px

export function buildBlender(ovl, media, base) {
  const k = B.blender;
  const open = k.back + 0.35;          // the window comes up once Blender has the file open
  const close = k.back + 4.2;         // and goes once the render is written
  const w = document.createElement('div');
  w.className = 'bw';
  w.innerHTML = `<div class="bw-bar"><span class="bw-dots"><i></i><i></i><i></i></span><span class="bw-title"><svg viewBox="0 0 17 20" aria-hidden="true"><path d="M2.5 1h8l4.5 4.5V18a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#e8e8e8"/><path d="M10.5 1v4.5H15" fill="#bdbdbd"/></svg>shockmount.blend - Blender 5.2.2 LTS</span></div>
    <div class="bw-ui"><img class="bw-base" alt="" src="${new URL('media/blender-ui.jpg', base).href}"><div class="bw-vp"></div><div class="bw-field">1</div><div class="bw-ph">1</div><div class="bw-vpl"></div></div>`;
  ovl.appendChild(w);
  const v = makeVideo(document, 'blender-view', base);
  w.querySelector('.bw-vp').appendChild(v);
  const frameAt = (t) => Math.min(630, PLAY_FROM + Math.max(0, Math.floor((t - (open + 0.4)) * PLAY_FPS)));
  media.add(v, (t) => (t >= open + 0.4 && t < close ? (frameAt(t) - 1) / 30 + 0.5 / 30 : null), (PLAY_FROM - 1) / 30 + 0.5 / 30);
  const ph = w.querySelector('.bw-ph'), field = w.querySelector('.bw-field'), vpl = w.querySelector('.bw-vpl');
  let lastF = -1;
  return {
    el: w,
    // the window's box in app px, for the camera
    box: { x: X, y: Y, w: W_APP, h: 1242.67 * S },
    render(t) {
      const p = outCubic(seg(t, open, open + 0.35));
      const q = inOutCubic(seg(t, close, close + 0.3));
      const vis = p * (1 - q);
      w.style.display = vis > 0.001 ? '' : 'none';
      if (vis <= 0.001) return;
      const sc = S * (0.94 + 0.06 * p) * (1 - 0.04 * q);
      w.style.opacity = vis.toFixed(3);
      w.style.transform = `translate(${(X + (1 - p) * 10).toFixed(2)}px, ${(Y + (1 - p) * 16 + q * 12).toFixed(2)}px) scale(${sc.toFixed(5)})`;
      const f = t < open + 0.4 ? PLAY_FROM : frameAt(t);
      if (f !== lastF) {
        ph.textContent = String(f);
        ph.style.left = `${tx(f).toFixed(2)}px`;
        field.textContent = String(f);
        const onKey = CAM_KEYS.has(f);
        vpl.textContent = `(${f}) Scene Collection | Camera`;
        vpl.style.color = onKey ? 'rgb(247,183,52)' : '#fff';
        lastF = f;
      }
    },
  };
}
