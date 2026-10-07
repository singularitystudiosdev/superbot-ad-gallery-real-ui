// The canvas: superbot's output pane, docked right of the thread at 16:9. Every routed model writes its result here at
// full size (the thread keeps the short receipt), so the frame reads as chat on the left and the work on the right.
// Each beat hands back a `page` (its canvas body) and a `file` ({ name, by }); a page is live from its beat's reply until
// the next page lands, with a short crossfade. The header names the file and the model that made it, and the stepper
// under it walks the pipeline (Brief, Frames, Shots, Sound, Edit, Render). theater (0..1) grows the pane to the full
// hub for the premiere. renderCanvas(cv, t, open, theater) is a pure function of the scene's local time.
import { clamp, lerp, seg, outCubic } from '../../lib.js';

// hub design px (tabs.js lays the hub out at 1280x720)
export const HUB = { w: 1280, h: 720 };
export const PANE = { x: 500, y: 18, w: 762, h: 684 };
export const COL = { w: 452, open: 22, shut: (1280 - 452) / 2 };
const HEAD = 44, STEPS = 42;

const ICON = {
  file: '<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4M12 2v13"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
};

/** steps: [{ app, job, tile }] in pipeline order; pages: [{ at, page, file }] in time order */
export function mountCanvas(hub, steps, pages) {
  const cv = document.createElement('div');
  cv.className = 'cv';
  cv.innerHTML = `
<div class="cv-hd"><span class="cv-fic">${ICON.file}</span><b class="cv-fn"></b><span class="cv-by"></span>
  <span class="cv-acts"><span class="cv-ver">v1</span><span class="cv-act">${ICON.share}Share</span><span class="cv-act">${ICON.down}</span><span class="cv-act">${ICON.full}</span></span></div>
<div class="cv-steps">${steps.map((s, i) => `${i ? '<i class="cv-ln"><b></b></i>' : ''}<span class="cv-st">${s.tile}<span class="cv-stl">${s.job}</span></span>`).join('')}</div>
<div class="cv-body"></div>`;
  hub.appendChild(cv);
  const body = cv.querySelector('.cv-body');
  pages.forEach((p) => { p.page.classList.add('cv-page'); body.appendChild(p.page); });
  return {
    cv, body, pages, steps,
    hd: cv.querySelector('.cv-hd'), fn: cv.querySelector('.cv-fn'), by: cv.querySelector('.cv-by'),
    st: [...cv.querySelectorAll('.cv-st')], ln: [...cv.querySelectorAll('.cv-ln b')],
    stepsEl: cv.querySelector('.cv-steps'), last: -1,
  };
}

/** which page is live at t (the last one whose `at` has passed), or -1 before the first */
const liveAt = (pages, t) => pages.reduce((n, p, i) => (t >= p.at ? i : n), -1);

/** the pane's rect in hub px at theater amount th (0 docked, 1 full hub) */
export function paneRect(th) {
  return { x: lerp(PANE.x, 0, th), y: lerp(PANE.y, 0, th), w: lerp(PANE.w, HUB.w, th), h: lerp(PANE.h, HUB.h, th) };
}
/** the body's inner box (where a page lays out) at theater amount th */
export function bodyRect(th) {
  const r = paneRect(th), chrome = (HEAD + STEPS) * (1 - th), pad = 14 * (1 - th);
  return { w: r.w - pad * 2, h: r.h - chrome - pad * 2 };
}

export function renderCanvas(c, t, open, theater) {
  const o = clamp(open), th = clamp(theater);
  const r = paneRect(th);
  const s = c.cv.style;
  s.opacity = o.toFixed(3);
  s.visibility = o > 0.001 ? 'visible' : 'hidden';
  s.left = `${r.x.toFixed(2)}px`; s.top = `${r.y.toFixed(2)}px`; s.width = `${r.w.toFixed(2)}px`; s.height = `${r.h.toFixed(2)}px`;
  s.borderRadius = `${(14 * (1 - th)).toFixed(2)}px`;
  s.transform = o >= 1 ? 'none' : `translateX(${((1 - outCubic(o)) * 46).toFixed(2)}px)`;
  const chromeO = (1 - seg(th, 0, 0.5)).toFixed(3);
  c.hd.style.opacity = chromeO; c.stepsEl.style.opacity = chromeO;
  c.hd.style.height = `${(HEAD * (1 - th)).toFixed(2)}px`; c.stepsEl.style.height = `${(STEPS * (1 - th)).toFixed(2)}px`;
  c.body.style.setProperty('--cv-in', `${(14 * (1 - th)).toFixed(2)}px`);
  s.borderWidth = `${(1 - th).toFixed(3)}px`;

  const i = liveAt(c.pages, t);
  c.pages.forEach((p, j) => {
    const a = j === i ? outCubic(seg(t, p.at, p.at + 0.38)) : (j === i - 1 ? 1 - seg(t, c.pages[i].at, c.pages[i].at + 0.3) : 0);
    p.page.style.opacity = a.toFixed(3);
    p.page.style.visibility = a > 0.001 ? 'visible' : 'hidden';
    p.page.style.transform = j === i && a < 1 ? `translateY(${((1 - a) * 14).toFixed(2)}px)` : 'none';
  });
  if (i !== c.last && i >= 0) {
    const f = c.pages[i].file;
    c.fn.textContent = f.name; c.by.innerHTML = f.by;
    c.last = i;
  }
  const flick = i >= 0 ? seg(t, c.pages[i].at, c.pages[i].at + 0.3) : 1;
  c.fn.style.opacity = flick.toFixed(3);

  // the stepper: a step is done once the next page lands, current while its own page is live
  const stepOf = (p) => c.steps.findIndex((s) => s.app === p.app && s.job === p.job);
  const cur = i >= 0 ? stepOf(c.pages[i]) : -1;
  c.st.forEach((el, j) => {
    el.classList.toggle('on', j === cur);
    el.classList.toggle('done', j < cur || (j === cur && th > 0.5));
  });
  c.ln.forEach((el, j) => {
    const nx = c.pages.find((p) => stepOf(p) === j + 1);
    const me = c.pages.find((p) => stepOf(p) === j);
    const f = nx && me ? seg(t, lerp(me.at, nx.at, 0.35), nx.at) : 0;
    el.style.transform = `scaleX(${f.toFixed(3)})`;
  });
}
