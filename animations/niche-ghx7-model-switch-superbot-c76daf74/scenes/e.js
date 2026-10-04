// Beat E (8.10-9.50, 1.40 s): PR #483 Files changed. session.ts then refresh.ts diff, +24 -6 split stats,
// Viewed checkboxes, diff rows reveal line by line. The frame is 1760x880 at (80,38) so its bottom edge (918)
// stays clear of the 140 px caption strip (the bible reserves the bottom band for captions).
// This module also exports the small frame helper the sibling E/F/G/H scenes share (same worker owns all four).
import { dur } from './budget.js';
import { mount } from '../gh/components/index.js';
import { clamp, lerp, seg, outCubic } from '../lib.js';

// The framed browser window: 1760 wide (80 px stage margin each side), 880 tall at top 38 -> bottom 918 < 930.
export const FRAME = { width: 1760, height: 880, pageWidth: 1440 };
export const FRAME_POS = { left: 80, top: 38 };
export const setScroll = (page, px) => { if (page) page.style.setProperty('--scroll', (+px).toFixed(1)); };
export const revealY = (el, p, dist = 10) => {
  const q = clamp(p);
  el.style.opacity = q.toFixed(3);
  el.style.transform = `translateY(${((1 - outCubic(q)) * dist).toFixed(2)}px)`;
};

export default {
  id: 'e',
  dur: dur('e'),
  mount(section) {
    const ghf = mount(section, 'files', {}, FRAME);
    const page = ghf.querySelector('.ghf-page');
    const files = [...ghf.querySelectorAll('.gh-file[data-file]')];
    const byPath = (p) => files.find((f) => f.dataset.file === p) || null;
    this.ghf = ghf;
    this.page = page;
    const session = byPath('src/auth/session.ts');
    const refresh = byPath('src/auth/refresh.ts');
    const test = byPath('src/auth/session.test.ts');
    this.files = { session, refresh, test };
    this.rows = {
      session: session ? [...session.querySelectorAll('tr.gh-dl[data-ln]')] : [],
      refresh: refresh ? [...refresh.querySelectorAll('tr.gh-dl[data-ln]')] : [],
    };
    this.viewedCount = ghf.querySelector('[data-count="viewed"]');
    // seed: nothing viewed, all diff rows hidden (render sets them every frame from lt, this just avoids a first-frame flash)
    files.forEach((f) => { f.dataset.viewed = '0'; });
    [...ghf.querySelectorAll('tr.gh-dl[data-ln]')].forEach((r) => { r.style.opacity = '0'; r.style.transform = 'none'; });
    if (this.viewedCount) this.viewedCount.textContent = '0';
  },
  render(lt) {
    // gentle camera settle (scale <1 stays inside the reserved frame; never grows past the margin)
    const s = 0.972 + 0.028 * outCubic(seg(lt, 0, 0.85));
    this.ghf.style.transform = `scale(${s.toFixed(4)})`;

    // scroll: header -> session.ts diff -> refresh.ts diff
    const mid = lerp(60, 168, outCubic(seg(lt, 0.14, 0.42)));
    const low = lerp(168, 560, outCubic(seg(lt, 0.66, 0.84)));
    setScroll(this.page, seg(lt, 0.66, 0.84) > 0 ? low : mid);

    // diff rows reveal line by line (session.ts first, then refresh.ts)
    const sr = this.rows.session;
    for (let i = 0; i < sr.length; i++) revealY(sr[i], seg(lt, 0.03 + i * 0.014, 0.03 + i * 0.014 + 0.09), 8);
    const rr = this.rows.refresh;
    for (let i = 0; i < rr.length; i++) revealY(rr[i], seg(lt, 0.70 + i * 0.016, 0.70 + i * 0.016 + 0.11), 8);

    // Viewed checkboxes: the collapsed test file first (counter ticks to 1), then session.ts (visible tick, 2)
    const viewedTest = lt >= 0.12;
    const viewedSession = lt >= 0.46;
    if (this.files.test) this.files.test.dataset.viewed = viewedTest ? '1' : '0';
    if (this.files.session) this.files.session.dataset.viewed = viewedSession ? '1' : '0';
    if (this.viewedCount) this.viewedCount.textContent = String((viewedTest ? 1 : 0) + (viewedSession ? 1 : 0));
  },
};