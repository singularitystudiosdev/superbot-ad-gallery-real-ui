// scenes/gh.js, beats B to E (0.75-5.85 s): the framed browser on the dark stage, driven through the DOM CONTRACT of
// gh/*.html (bible): issue #482 with its linked-PR event (B), PR #483's Commits tab where each commit lands with a
// different model as author and its check turns from the amber pending dot to the green check (C), the checks dialog
// of commit 4 ticking its 4 checks green (D), and the state badge morphing Open -> Merged (E). Beside it on the stage,
// the model rail (scenes/gh-rail.js) lights the author of each commit as it lands.
// Every value is a pure function of the global time t (ctx.t), so a seek to any frame draws the same pixels.
// The CAMERA scales the whole framed window (never a crop): its top-left corner sits at (L, T) on the stage and at
// every frame T >= 56 and L >= 56, so the window's top and left border always show with dark stage around them
// (bible MOTION ADDENDUM). Pushes stay within 1.8x of the resting fit.
import { seg, lerp, outCubic, inOutCubic, op } from '../lib.js';
import { mountRail, renderRail } from './gh-rail.js';

// both windows: one browser, 1064 x 590 CSS px. At rest it fits the 1920 x 1080 stage with >= 56 px on every side.
const WW = 1064, WH = 590;
const S0 = Math.min((1920 - 112) / WW, (1080 - 112) / WH); // 1.6407, the resting fit
const rest = (s) => ({ s, L: (1920 - WW * s) / 2, T: (1080 - WH * s) / 2 });

// ---------- the storyboard, in global seconds ----------
export const ROWS = [1.55, 2.25, 2.95, 3.65];          // commit rows 1-4 land (C)
const ROW_IN = 9 / 30;                                  // slide + fade
const TICK = 0.45;                                      // pending -> success after landing (rows 1-3)
const POP = 6 / 30;                                     // check tick scale pop 0.8 -> 1.08 -> 1
const LINK_AT = 1.04, LINK_IN = 8 / 30;                 // B: the linked-PR timeline event lands
const PR_IN = [1.33, 1.33 + 3 / 30];                    // B -> C: the PR page replaces the issue in the same window
const FOCUS_AT = 4.50;                                  // D: commit 4's status gets the focus ring it is opened from
const POP_OPEN = [4.60, 4.60 + 8 / 30];                 // D: the checks dialog opens
const CHECKS = [4.82, 4.94, 5.06, 5.18];                // D: its 4 check rows tick, 0.12 s apart
const POP_CLOSE = [5.27, 5.27 + 4 / 30];                // E: the dialog closes
const MERGE = [5.40, 5.40 + 10 / 30];                   // E: Open -> Merged crossfade + width morph (80 -> 96 px)
const BADGE_POP = [MERGE[1], MERGE[1] + POP];
const EXIT = [5.78, 5.98];                              // F: the browser falls back as the end card comes up
const IN = [0.60, 0.95];                                // B: the push into the browser

// camera keys {t, s, L, T}, inOutCubic between neighbours
const CAM = [
  { t: IN[0], ...rest(S0 * 0.9) },
  { t: IN[1], ...rest(S0) },
  { t: 1.28, s: 2.0, L: 56, T: 56 },     // B: in on the issue timeline as the linked PR lands
  // C: the Commits tab beside the model rail. At 1.80 (16 px titles -> 28.8 px) with the window at L 513, the frame's
  // right edge falls in the space between "expires" (window x 778) and "#483" (x 785): the title is cut before the
  // number, never inside it (measured with ghx2-729001be/render/title.cjs)
  { t: 1.62, s: 1.80, L: 513, T: 56 },
  { t: 4.48, s: 1.80, L: 513, T: 56 },
  { t: 4.80, s: 2.15, L: 56, T: 56 },    // D: the rail leaves, in on the checks dialog (13 px rows -> 28 px)
  { t: 5.26, s: 2.15, L: 56, T: 56 },
  // E: the whole header in frame: the title ends at window x 862 -> stage 1832 (88 px to spare), "Merged" (14 px)
  // renders at 28.8 px, the merged subline ends at x 698 -> stage 1494
  { t: 5.42, s: 2.06, L: 56, T: 56 },
];
// page scroll (px) under the browser chrome, per window
const SCROLL_ISSUE = [{ t: 0.88, v: 0 }, { t: 1.12, v: 230 }];
const SCROLL_PR = [{ t: 1.30, v: 0 }, { t: 1.62, v: 20 }, { t: 2.30, v: 60 }, { t: 3.00, v: 100 }, { t: 3.72, v: 145 },
  { t: 4.48, v: 145 }, { t: 4.80, v: 0 }]; // D: back to the header while the camera moves in on the dialog

function keyed(t, keys, f) {
  if (t <= keys[0].t) return f(keys[0], keys[0], 0);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) return f(keys[i - 1], keys[i], inOutCubic(seg(t, keys[i - 1].t, keys[i].t)));
  }
  const z = keys[keys.length - 1];
  return f(z, z, 0);
}
const camAt = (t) => keyed(t, CAM, (a, b, k) => ({ s: lerp(a.s, b.s, k), L: lerp(a.L, b.L, k), T: lerp(a.T, b.T, k) }));
const scrollAt = (t, keys) => keyed(t, keys, (a, b, k) => lerp(a.v, b.v, k));
/** the 6-frame tick pop: 0.8 -> 1.08 -> 1 */
function popScale(t, at) {
  if (t < at) return 0.8;
  const f = seg(t, at, at + POP);
  return f < 0.5 ? lerp(0.8, 1.08, outCubic(f / 0.5)) : lerp(1.08, 1, inOutCubic((f - 0.5) / 0.5));
}
const setState = (node, v) => { if (node.dataset.state !== v) node.dataset.state = v; };
const clearStyle = (node, ...props) => props.forEach((p) => node.style.removeProperty(p));

let el = null;

export default {
  id: 'gh',
  dur: 5.1,

  async mount(section) {
    const [issue, pr] = await Promise.all(['issue-482.html', 'pr-483-commits.html'].map(async (f) => {
      const res = await fetch(new URL(`../gh/${f}`, import.meta.url));
      if (!res.ok) throw new Error(`gh/${f}: HTTP ${res.status}`);
      return res.text();
    }));
    section.innerHTML = `<div class="gh-cam"><div class="gh-slot gh-slot-issue">${issue}</div><div class="gh-slot gh-slot-pr">${pr}</div></div>`;
    const q = (s) => section.querySelector(s);
    const qa = (s) => [...section.querySelectorAll(s)];
    for (const w of qa('.gh-window')) { w.style.setProperty('--gh-w', `${WW}px`); w.style.setProperty('--gh-h', `${WH}px`); }
    el = {
      cam: q('.gh-cam'), slotPr: q('.gh-slot-pr'),
      issue: q('#gh-issue'), pr: q('#gh-pr'), link: q('#gh-issue-link-event'),
      rows: [1, 2, 3, 4].map((i) => q(`.gh-commit-row[data-i="${i}"]`)),
      status: [1, 2, 3, 4].map((i) => q(`.gh-commit-row[data-i="${i}"] .gh-commit-status`)),
      popover: q('#gh-checks-popover'), dlg: q('#gh-checks-popover .gh-dlg'),
      checks: [1, 2, 3, 4].map((i) => q(`.gh-check-row[data-i="${i}"] .gh-check-status`)),
      state: q('#gh-pr-state'), sub: q('#gh-pr-subline'),
    };
    el.row4Count = el.status[3].querySelector('.gh-cs-n-pend');
    el.stateOpen = el.state.querySelector('.gh-state-open'); el.stateMerged = el.state.querySelector('.gh-state-merged');
    el.subOpen = el.sub.querySelector('.gh-sub-open'); el.subMerged = el.sub.querySelector('.gh-sub-merged');
    for (const n of [...el.rows, el.link, el.popover, el.state, el.sub, el.stateOpen, el.stateMerged, el.subOpen, el.subMerged]) {
      if (!n) throw new Error('gh fragments miss a DOM CONTRACT element');
    }
    el.rail = mountRail(section);
  },

  render(lt, ctx, section) {
    if (!el) return;
    const t = ctx.t;
    const on = t >= IN[0] && t < EXIT[1];
    section.classList.toggle('on', on);
    section.style.opacity = on ? '1' : '0';
    if (!on) return;

    // ---- camera: the whole framed window, scaled; it fades up as the ask pushes through, and falls back at F
    const c = camAt(t);
    const out = inOutCubic(seg(t, EXIT[0], EXIT[1]));
    const s = c.s * (1 - 0.05 * out);
    el.cam.style.transform = `translate(${c.L.toFixed(2)}px, ${c.T.toFixed(2)}px) scale(${s.toFixed(5)})`;
    op(el.cam, outCubic(seg(t, 0.68, 0.80)) * (1 - out));

    // ---- B: issue #482, scrolled down to its timeline, the linked-PR event lands
    el.issue.style.setProperty('--gh-scroll', `${scrollAt(t, SCROLL_ISSUE).toFixed(2)}px`);
    setState(el.link, t >= LINK_AT ? 'shown' : 'hidden');
    const li = outCubic(seg(t, LINK_AT, LINK_AT + LINK_IN));
    el.link.style.opacity = t >= LINK_AT ? li.toFixed(3) : '';
    el.link.style.transform = `translateY(${((1 - li) * 14).toFixed(2)}px)`;

    // ---- B -> C: the PR page comes up in the same window
    op(el.slotPr, outCubic(seg(t, PR_IN[0], PR_IN[1])));
    el.pr.style.setProperty('--gh-scroll', `${scrollAt(t, SCROLL_PR).toFixed(2)}px`);

    // ---- C: commit rows land one by one; each check goes pending -> success with a pop
    ROWS.forEach((at, i) => {
      const row = el.rows[i], st = el.status[i];
      const shown = t >= at;
      setState(row, shown ? 'shown' : 'hidden');
      const k = outCubic(seg(t, at, at + ROW_IN));
      if (shown && k < 1) { row.style.opacity = k.toFixed(3); row.style.transform = `translateY(${((1 - k) * 16).toFixed(2)}px)`; }
      else clearStyle(row, 'opacity', 'transform');
      // rows 1-3 pass 0.45 s after landing; row 4 (superbot's commit) stays pending through C and is the commit whose
      // checks dialog plays in D: its counter follows the dialog's ticks and it passes with the dialog's last check
      const okAt = i === 3 ? CHECKS[3] : at + TICK;
      const ok = t >= okAt;
      setState(st, ok ? 'success' : 'pending');
      st.style.transform = ok ? `scale(${popScale(t, okAt).toFixed(4)})` : '';
      if (i === 3) {
        const n = `${CHECKS.filter((c) => t >= c).length} / 4`;
        if (el.row4Count.textContent !== n) el.row4Count.textContent = n;
      }
    });
    // D: commit 4's status shows the focus ring it was opened from, while its dialog is up
    el.status[3].classList.toggle('ghx2-focus', t >= FOCUS_AT && t < POP_CLOSE[1]);

    // ---- D: the checks dialog opens, its check rows tick green one by one, then it closes (E)
    const pv = t >= POP_OPEN[0] && t < POP_CLOSE[1];
    setState(el.popover, pv ? 'shown' : 'hidden');
    if (pv) {
      const o = outCubic(seg(t, POP_OPEN[0], POP_OPEN[1])) * (1 - seg(t, POP_CLOSE[0], POP_CLOSE[1]));
      el.popover.style.opacity = o.toFixed(3);
      el.dlg.style.transform = `scale(${(0.96 + 0.04 * outCubic(seg(t, POP_OPEN[0], POP_OPEN[1]))).toFixed(4)})`;
    } else clearStyle(el.popover, 'opacity');
    CHECKS.forEach((at, i) => {
      const ck = el.checks[i];
      const ok = t >= at;
      setState(ck, ok ? 'success' : 'pending');
      ck.style.transform = ok ? `scale(${popScale(t, at).toFixed(4)})` : '';
    });

    // ---- E: Open -> Merged, a 10-frame crossfade with the badge width morphing 80 -> 96 px, then a pop
    const m = seg(t, MERGE[0], MERGE[1]);
    const morph = m > 0 && m < 1;
    setState(el.state, t >= MERGE[1] ? 'merged' : 'open');
    setState(el.sub, t >= MERGE[1] ? 'merged' : 'open');
    if (morph) {
      // the label of the green pill fades first, the purple pill then rises over it with its own label, and the
      // pill widens 80 -> 96 px under them, so the two labels never overprint; the sublines hand over in sequence
      el.state.style.width = `${lerp(80, 96, inOutCubic(seg(m, 0.2, 0.8))).toFixed(2)}px`;
      el.stateOpen.style.visibility = 'visible';
      el.stateOpen.style.opacity = '1';
      el.stateOpen.style.color = `rgba(255, 255, 255, ${(1 - seg(m, 0, 0.35)).toFixed(3)})`;
      const pairs = [[el.stateMerged, outCubic(seg(m, 0.35, 0.8))], [el.subOpen, 1 - seg(m, 0, 0.45)], [el.subMerged, seg(m, 0.55, 1)]];
      for (const [n, v] of pairs) {
        n.style.visibility = 'visible'; n.style.opacity = v.toFixed(3);
      }
    } else {
      clearStyle(el.state, 'width');
      clearStyle(el.stateOpen, 'color');
      for (const n of [el.stateOpen, el.stateMerged, el.subOpen, el.subMerged]) clearStyle(n, 'visibility', 'opacity');
    }
    // the landed badge pops once: 1 -> 1.08 -> 1 over 6 frames
    const bp = seg(t, BADGE_POP[0], BADGE_POP[1]);
    const bs = bp <= 0 || bp >= 1 ? 1 : (bp < 0.5 ? lerp(1, 1.08, outCubic(bp / 0.5)) : lerp(1.08, 1, inOutCubic((bp - 0.5) / 0.5)));
    el.state.style.transform = bs === 1 ? '' : `scale(${bs.toFixed(4)})`;

    // ---- the model rail on the stage beside the window (after the camera, so its connector finds the rows)
    renderRail(el.rail, t, el.rows, section);
  },
};
