// Beat D (2.90-8.10): the race. The clip video/race-16x9.{webm,mp4} (5.20 s, 156 frames) is the whole beat: three
// terminal panes, three patches, Opus green, "Kept". It is registered with video.js (clip window = the beat's spot
// time) so the renderer seeks it frame-exactly; the stage adds only the beat caption in the clip's reserved bottom
// strip. Bridge before the cut into the PR: nothing moves here, the clip carries the beat.
import { dur, byId } from './budget.js';
import { mountCaption } from './caption.js';

export default {
  id: 'd',
  dur: dur('d'),
  mount(section, ctx) {
    const video = ctx.video; // the engine's own video.js instance, so video.sync(t) drives this clip
    section.innerHTML = `<video class="race-clip" muted playsinline preload="auto" aria-hidden="true">${video.sources('video/race-16x9')}</video>`;
    const v = section.querySelector('video');
    video.clip(v, byId('d').t0, byId('d').t1);
    this.cap = mountCaption(section, { text: byId('d').caption, at: 0.55, dur: dur('d') - 0.4 });
  },
  render(lt) { if (this.cap) this.cap(lt); },
};