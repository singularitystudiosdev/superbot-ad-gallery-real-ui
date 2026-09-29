// Beat: SIGNING IN TO GITHUB, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the GitHub mark on it and states what superbot just opened, and the
// pill resolves "Connecting to GitHub" -> "Connected to GitHub" with the drawn check. The card is also the dive
// target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full GitHub desk
// (../gh.js) is revealed as the dive lands. The mark is the official Invertocat file from GitHub's brand toolkit
// (../../img/github-mark.svg, see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are
// the call-center spot's; the repo, the issue count and the base branch come from ../gh-data.js.
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { REPO, ISSUES } from '../gh-data.js';
import { STR } from '../gh-ui.js';

const N = ISSUES.length;
const CHIPS = [
  ['Signing in to GitHub', 'Signed in to GitHub'],
  [`Loading ${N} issues`, `Loaded ${N} issues`],
];
// the pill's icon: a pull request (UI chrome, drawn in the chip icons' stroke style)
const PR = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="18.5" r="2.2"/><path d="M6.5 7.7v8.6"/><path d="M17.5 16.3V9.5a2.5 2.5 0 0 0-2.5-2.5h-4"/><path d="m12.6 4.6-2.4 2.4 2.4 2.4"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to GitHub" -> "Connected to GitHub"
  T.done = r + 2.55;
  T.zoom = r + 2.60;       // the camera starts its dive into this card here
  T.zoomEnd = r + 3.20;
  T.end = r + 2.85;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-signin">
    <div class="cc-head">
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="GitHub"/></span>
      <span class="cc-ht"><b>GitHub</b><small>${x.esc(REPO.fullName)}</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in as ${x.esc(STR.me)}</span><span class="cc-seat-note">coding as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>issues assigned to you</small></div>
      <div class="cc-tile"><b>${x.esc(REPO.defaultBranch)}</b><small>base branch</small></div>
    </div>
    ${pillHTML(PR, 'Connecting to GitHub', 'Connected to GitHub')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const qn = card.querySelector('.cc-q');

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    // the scene reads this and dives the camera into the card (the b055c127 zoom cut's move)
    focus: { el: card, a: T.zoom, b: T.zoomEnd },
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      rise(seat, t, T.build);
      tiles.forEach((n, i) => rise(n, t, T.build + 0.08 + i * 0.12));
      // an issue count is a whole number while it counts up (the helper's default format keeps 3 decimals)
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t, (v) => String(Math.round(v)));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
