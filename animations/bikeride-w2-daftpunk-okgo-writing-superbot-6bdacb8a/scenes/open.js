// scenes/open.js — the cold open of the titles cut. The ride's own world (img/bike/poster.jpg) full frame with a
// slow push, the superbot mark and the promise over it, then a hard cut to the empty composer. It mirrors the
// reference teaser's open: a logo and a claim over an establishing shot, before the footage proper begins.
// Pure function of lt, like every scene; driven by timeline.js.
import { seg, lerp, outCubic, op } from '../lib.js';
import { makeMark } from '../shell.js';

const DUR = 2.6; /* deliberate */ // the cold open holds ~2.6 s before the hard cut to the chat
const PROMISE = 'ONE ASK. EVERY MODEL.';

export default {
  id: 'open',
  dur: DUR,
  mount(section) {
    section.innerHTML = `
      <div class="open-root">
        <img class="open-bg" src="${new URL('../img/bike/poster.jpg', import.meta.url).href}" alt=""/>
        <div class="open-scrim" aria-hidden="true"></div>
        <div class="open-lock">
          <span class="open-mark" aria-hidden="true"></span>
          <span class="open-promise"></span>
        </div>
      </div>`;
    const mark = makeMark(66);
    section.querySelector('.open-mark').appendChild(mark.el);
    const promise = section.querySelector('.open-promise');
    promise.textContent = PROMISE;
    this.el = {
      bg: section.querySelector('.open-bg'),
      lock: section.querySelector('.open-lock'),
      promise,
      mark,
    };
  },
  render(lt) {
    const e = this.el;
    if (!e) return;
    // the world breathes in: a 1.16 -> 1.02 slow push, clamped
    const push = outCubic(seg(lt, 0, DUR + 0.4));
    e.bg.style.transform = `scale(${lerp(1.16, 1.02, push).toFixed(4)})`;
    // the lock-up rises: mark first, then the promise
    const markIn = outCubic(seg(lt, 0.15, 0.7));
    op(e.lock, markIn);
    e.lock.style.transform = `translateY(${((1 - markIn) * 16).toFixed(2)}px)`;
    const pIn = outCubic(seg(lt, 0.7, 1.25));
    op(e.promise, pIn);
    e.promise.style.transform = `translateY(${((1 - pIn) * 8).toFixed(2)}px)`;
    e.mark.render(lt);
  },
};