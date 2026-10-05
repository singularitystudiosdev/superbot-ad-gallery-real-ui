// scenes-end.js: the mascot lands and the closing line rises; the film ends on that line.
import { W, put, box, pose, seg, sp, PRESETS, mascot, caption, el } from './core.js';
import { shell } from './ui.js';

export function end({ line = 'Superbot is all your agents in one.', dur = 4.6 } = {}) {
  const { root, cam } = shell();
  root.classList.add('endc');
  const holder = put(cam, 'div', 'end-m');
  const m = mascot(210);
  holder.appendChild(m.el);
  box(holder, W / 2 - 105, 250, 210, 210);
  const cap = caption(cam, [{ text: line }], { x: 0, y: 540, size: 88, align: 'center', w: W, scrim: false });
  cap.el.classList.add('end-line');
  const cues = [{ t: 0.12, type: 'pop', gain: 0.8 }, { t: 0.5, type: 'thump', gain: 0.6 }];
  function render(t) {
    m.render(t + 10);
    const k = sp(t, 0.12, PRESETS.playful);
    pose(holder, { s: 0.45 + 0.55 * k, y: (1 - k) * 30, o: seg(t, 0.12, 0.24) });
    cap.render(t, 0.5, Infinity, 0.07);
    cam.style.transform = `scale(${(1 + 0.012 * seg(t, 0, dur)).toFixed(4)})`;
    cam.style.transformOrigin = '50% 50%';
  }
  return { dur, root, render, cues };
}
