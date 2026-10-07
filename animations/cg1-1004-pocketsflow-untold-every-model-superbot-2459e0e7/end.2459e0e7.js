// end.2459e0e7.js: the end card, 4.4 s as in 673c104b, now superbot's real brand lockup: MarkSuperbotEchoLockup
// (packages/ui marks/mark-superbot-echo.tsx), rendered to static markup from the app's own React source
// (end-lockup.2459e0e7.html) with its own stylesheets (end.2459e0e7.css): the bare white face with its cyan and
// magenta echoes, the lowercase "superbot" wordmark in the bot face, the split loop and the slow float. Drawn at the
// splash's proportions (144 px mark, 32 px word) scaled 3.2x. Its CSS loops are pinned to local time, so any
// frame is exact; the entrance (mark up from 0.62 on a damped spring, word rising in after it) is the only addition.
import { seg, spring, easeDecel, lerp } from './lib.2459e0e7.js';

const DUR = 4.4;
const SCALE = 3.2;
let el = null;

export default {
  id: 'end',
  dur: DUR,
  async mount(section) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('./end.2459e0e7.css', import.meta.url).href;
    const loaded = new Promise((r) => { css.onload = r; css.onerror = (e) => { console.error('end css', e); r(); }; });
    document.head.appendChild(css);
    const markup = await (await fetch(new URL('./end-lockup.2459e0e7.html', import.meta.url))).text();
    section.innerHTML = `<div class="end-wrap" style="transform:scale(${SCALE})">${markup}</div>`;
    await loaded;
    await document.fonts.load('700 32px Inter').catch((e) => console.warn('inter', e));
    el = {
      sec: section,
      mark: section.querySelector('.mark-superbot-echo'),
      word: section.querySelector('.mark-superbot-echo-word'),
    };
    el.mark.style.width = el.mark.style.height = 'var(--size-splash-hero-mark)';
    el.word.style.fontSize = 'var(--text-display)';
    el.word.style.lineHeight = 'var(--text-display--line-height)';
  },
  render(lt) {
    const m = spring(lt, 0.7);
    el.mark.style.opacity = seg(lt, 0, 0.22).toFixed(3);
    el.mark.style.transform = `scale(${lerp(0.62, 1, m).toFixed(4)})`;
    const w = easeDecel(seg(lt, 0.32, 0.95));
    el.word.style.opacity = w.toFixed(3);
    el.word.style.transform = `translateY(${((1 - w) * 14).toFixed(2)}px)`;
    // the brand's own loops, on this card's clock (the split's first burst lands at 1.79 s, its second at 2.41 s)
    for (const a of el.sec.getAnimations({ subtree: true })) {
      if (a.playState !== 'paused') a.pause();
      a.currentTime = lt * 1000;
    }
  },
};
