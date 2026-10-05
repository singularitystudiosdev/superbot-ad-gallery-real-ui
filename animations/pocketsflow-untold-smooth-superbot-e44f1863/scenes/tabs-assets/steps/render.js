// Step 6, superbot: render and play. superbot's own file card renders the composition (frames 0 -> 450 at 30 fps,
// 1080p), then the player under it plays the finished Pocketsflow launch film from its first frame (the mascot's
// "psst", the same gesture Hailuo animated), and focus() hands tabs.js how far to push the camera into the player.
import { seg, outExpo, inOutSine, inOutCubic, rise } from '../../../lib.js';
import { video, sync, clock, shimmer } from './media.js';

const REND = [0.35, 1.75], PLAY = 1.85, PUSH = [2.0, 3.1], FRAMES = 450, LEN = 15;

export default {
  id: 'render', app: 'superbot', model: 'superbot', logo: '', dur: 5.4,
  summary: 'Rendered LaunchFilm.mp4',

  build({ img, el }) {
    const n = el(`<div class="rn">
  <div class="rn-file">
    <span class="rn-ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4.2-2.5z"/></svg></span>
    <div class="rn-tx"><b>LaunchFilm.mp4</b><small><span class="rn-a">Rendering · 1080p · 30 fps</span><span class="rn-b">1920×1080 · 30 fps · 0:15</span></small></div>
    <em class="rn-pct">0 / ${FRAMES}</em>
  </div>
  <div class="rn-bar"><i></i></div>
  <div class="rn-player">
    <div class="rn-veil"><span class="rn-sh">Rendering frames</span></div>
    <div class="rn-ctrl"><svg class="rn-pp" viewBox="0 0 24 24"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg><div class="rn-scrub"><i></i></div><span class="rn-tc">0:00 / 0:15</span></div>
  </div>
</div>`);
    const player = n.querySelector('.rn-player');
    const v = video(img('pf/clip.mp4'), 'rn-vid');
    v.poster = img('pf/poster.jpg');
    player.prepend(v);
    const ui = { file: n.querySelector('.rn-file'), barWrap: n.querySelector('.rn-bar'), pct: n.querySelector('.rn-pct'), bar: n.querySelector('.rn-bar i'), a: n.querySelector('.rn-a'), b: n.querySelector('.rn-b'), veil: n.querySelector('.rn-veil'), sh: n.querySelector('.rn-sh'), ctrl: n.querySelector('.rn-ctrl'), scrub: n.querySelector('.rn-scrub i'), tc: n.querySelector('.rn-tc'), last: '', lastTc: '' };
    return {
      el: n, player,
      focus: (lt) => inOutCubic(seg(lt, PUSH[0], PUSH[1])),
      render(lt) {
        const p = seg(lt, REND[0], REND[1]);
        const f = `${Math.round(p * FRAMES)} / ${FRAMES}`;
        if (f !== ui.last) { ui.pct.textContent = f; ui.last = f; }
        ui.bar.style.transform = `scaleX(${p.toFixed(4)})`;
        // as the camera pushes in, the file row steps back so the film is all that is left
        const push = inOutSine(seg(lt, PUSH[0], PUSH[1]));
        ui.file.style.opacity = ui.barWrap.style.opacity = (1 - 0.85 * push).toFixed(3);
        const d = inOutSine(seg(lt, REND[1], REND[1] + 0.35));
        ui.a.style.opacity = (1 - d).toFixed(3);
        ui.b.style.opacity = d.toFixed(3);
        ui.pct.style.opacity = (1 - d).toFixed(3);
        ui.sh.style.setProperty('--sh', shimmer(lt));
        const open = inOutSine(seg(lt, REND[1], REND[1] + 0.5));
        ui.veil.style.opacity = (1 - open).toFixed(3);
        v.style.filter = open >= 1 ? 'none' : `blur(${((1 - open) * 10).toFixed(2)}px) brightness(${(0.55 + 0.45 * open).toFixed(3)})`;
        rise(ui.ctrl, outExpo(seg(lt, PLAY, PLAY + 0.6)) * (1 - inOutSine(seg(lt, PUSH[0] + 0.6, PUSH[1] + 0.4))), 6);
        const want = Math.max(0, lt - PLAY);
        ui.scrub.style.transform = `scaleX(${(want / LEN).toFixed(4)})`;
        const tc = `${clock(want)} / 0:15`;
        if (tc !== ui.lastTc) { ui.tc.textContent = tc; ui.lastTc = tc; }
        sync(v, want, lt >= PLAY && lt < 8, 14.9);
      },
    };
  },
};
