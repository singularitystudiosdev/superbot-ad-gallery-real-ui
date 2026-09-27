// GitHub beat (chapter 06, bounce): superbot connects GitHub, creates sam/motion-reel and pushes the reel as seven
// commits, one per chapter, each message in the clip's own words. Three tool chips land and resolve ("Authorizing
// GitHub" -> "Authorized as sam", repo, push), the repo card rises, the seven commits drop in on sixteenth-ish steps
// and land with a bounceOut, the push progress steps forward a seventh per commit (each step a bounceOut), the 8-bar
// timeline chip lights each chapter's bars in that chapter's ground colour, and main turns green with a drawn check.
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Pushing the motion reel to GitHub, one commit per chapter.';
const OWNER = 'sam';
const REPO = 'motion-reel';
const BRANCH = 'main';

// the reel's flat grounds (CREDITS.txt COLOUR), read through the palette vars in style.css :root
const RED = 'var(--mr-red, #F04B3A)';
const CREAM = 'var(--mr-cream, #F2EFE7)';
const BLUE = 'var(--mr-blue, #302FF5)';
const INK = 'var(--mr-ink, #0F0F11)';
const LIME = 'var(--mr-lime, #E3FF46)';

// One commit per chapter. Short shas are made up; each message is the chapter's name plus the clip's own words for
// it (on-screen copy, or the CREDITS.txt description of what is on screen). bars = the chapter's bars on the 8-bar
// grid, ground = the chapter's ground colour, files = what the commit adds.
const COMMITS = [
  { sha: 'c1a0de0', ch: '01 identity', msg: 'CLAUDE, motion designer', bars: [1, 2], ground: RED,
    files: ['src/01-identity.ts', 'score/reel-128bpm.wav'] },
  { sha: '3e2a5f1', ch: '02 easing', msg: 'six ways to get from A to B', bars: [3], ground: CREAM,
    files: ['src/02-easing.ts', 'src/easing.ts'] },
  { sha: '9b04d7c', ch: '03 morphing', msg: 'circle, triangle, star, pentagon, square', bars: [4], ground: BLUE,
    files: ['src/03-morphing.ts'] },
  { sha: '47f1c2e', ch: '04 systems', msg: 'truchet tiles, a red band sweeps', bars: [5], ground: INK,
    files: ['src/04-systems.ts'] },
  { sha: 'd5e8a93', ch: '05 depth', msg: 'point grid, sphere, torus', bars: [6], ground: INK,
    files: ['src/05-depth.ts', 'meshes/*.glb'] },
  { sha: '6a7c0b4', ch: '06 kinetic type', msg: 'ease in. ease out. never linear.', bars: [7], ground: LIME,
    files: ['src/06-kinetic-type.ts'] },
  { sha: 'f1e0c07', ch: '07 fin', msg: 'every frame written in code', bars: [8], ground: RED,
    files: ['src/07-fin.ts'] },
];
const NBARS = 8;
// bar b (1..8) belongs to the commit whose chapter holds it
const BAR_OWNER = Array.from({ length: NBARS }, (_, b) => COMMITS.findIndex((c) => c.bars.includes(b + 1)));

const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const LOCK = '<svg class="git-lock" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const PUSHIC = '<svg class="git-pic" viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>';

// Penner bounceOut: the chapter 06 ease. Lands at 1 at p = 1/2.75, then two shrinking hops.
function bounceOut(p) {
  p = p <= 0 ? 0 : p >= 1 ? 1 : p;
  const n1 = 7.5625, d1 = 2.75;
  if (p < 1 / d1) return n1 * p * p;
  if (p < 2 / d1) { p -= 1.5 / d1; return n1 * p * p + 0.75; }
  if (p < 2.5 / d1) { p -= 2.25 / d1; return n1 * p * p + 0.9375; }
  p -= 2.625 / d1; return n1 * p * p + 0.984375;
}

const barLabel = (bars) => 'BAR ' + (bars.length > 1 ? bars[0] + '-' + bars[bars.length - 1] : bars[0]);

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.2, r + 0.42, r + 0.64];
    T.card = r + 0.86;
    // seven commits, 0.125s apart (a sixteenth at 120 BPM, close to the clip's 128 BPM sixteenth of 0.117s)
    T.commit = COMMITS.map((_, i) => r + 1.1 + i * 0.125);
    T.drop = 0.45;                                        // each commit's bounceOut drop
    T.pushed = T.commit[COMMITS.length - 1] + T.drop;     // the last push step has settled: r + 2.3
    T.chipDone = [r + 0.5, r + 0.78, T.pushed];
    T.main = T.pushed + 0.02;
    T.end = r + 2.95;   // same as the source beat; the branch check finishes drawing at r + 2.72, then 0.23s of dwell
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const say = opts.say || SAY;
    const owner = opts.owner || OWNER;
    const repo = opts.repo || REPO;
    const branch = opts.branch || BRANCH;
    const n = COMMITS.length;
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + owner],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      ['Pushing ' + n + ' commits to ' + branch, 'Pushed ' + n + ' commits to ' + branch],
    ];
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const rows = chips.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const commitHtml = COMMITS.map((c) => `<div class="git-slot"><span class="git-ghost"><i></i><b></b></span><div class="git-commit">
        <span class="git-sw" style="background:${c.ground}"></span>
        <div class="git-cm">
          <div class="git-line"><span class="git-msg"><b>${x.esc(c.ch)}:</b> ${x.esc(c.msg)}</span><span class="git-bars">${barLabel(c.bars)}</span></div>
          <div class="git-files"><span class="git-sha">${x.esc(c.sha)}</span>${c.files.map((f) => `<span class="git-file"><i>+</i>${x.esc(f)}</span>`).join('')}</div>
        </div>
      </div></div>`).join('');
    const cells = BAR_OWNER.map((ci) => `<span class="git-cell"><span class="git-cell-f" style="background:${COMMITS[ci].ground}"></span></span>`).join('');
    const card = x.el(`<div class="git-card">
      <div class="git-head">
        <span class="git-logo"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
        ${BOOK}
        <span class="git-name"><b>${x.esc(owner)}</b><i>/</i><b class="git-repo">${x.esc(repo)}</b></span>
        <span class="git-priv">${LOCK}Private</span>
        <span class="git-count">${n} commits</span>
      </div>
      <div class="git-commits">${commitHtml}</div>
      <div class="git-bar">
        <span class="git-branch">${BRANCHIC}${x.esc(branch)}${CHECK}</span>
        <span class="git-push">${PUSHIC}<span class="git-track"><span class="git-fill"></span></span><span class="git-pn">0/${n}</span></span>
        <span class="git-tl"><span class="git-tl-l">128 BPM</span><span class="git-cells">${cells}</span><span class="git-tl-n">0/${NBARS}</span></span>
      </div>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const commitRows = [...card.querySelectorAll('.git-commit')];
    const fileEls = commitRows.map((row) => [...row.querySelectorAll('.git-file')]);
    const ghostEls = [...card.querySelectorAll('.git-ghost')];
    const branchEl = card.querySelector('.git-branch');
    const checkP = card.querySelector('.git-ck-p');
    const fillEl = card.querySelector('.git-fill');
    const pnEl = card.querySelector('.git-pn');
    const cellEls = [...card.querySelectorAll('.git-cell-f')];
    const tlnEl = card.querySelector('.git-tl-n');
    const rise = (el, p, dy) => { const e = outCubic(p); el.style.opacity = e.toFixed(3); el.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };
    let shown = -1;
    // The repo card is 540px wide where the message row has the room (16x9) and exactly the row's width where it does
    // not (9x16, 4x5 and 1x1: 512). The reply's .m-main is capped at --hub-reply (471) and CSS inside it cannot see
    // the row, so measure the row from the card's host, as code.js does: the width depends on the page's layout (its
    // aspect ratio), never on t, and is written only when it changes. git.css's width 100% capped at 540px is the
    // fallback until the card is mounted.
    let fitW = -1;
    const fit = () => {
      const host = card.parentElement, row = host && host.parentElement;
      if (!row || !row.offsetWidth) return;
      const rr = row.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const w = Math.floor(Math.min(540, (rr.right - hr.left) / (rr.width / row.offsetWidth)));
      if (w > 0 && w !== fitW) { fitW = w; card.style.width = `${w}px`; }
    };
    return {
      nodes: [sayEl, ...rows, card],
      marks: [[T.r, sayEl], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, card]],
      render(t) {
        fit();
        const m = streamCount(say, T.r + 0.05, 90, t);
        if (m !== shown) { vis.textContent = say.slice(0, m); hid.textContent = say.slice(m); shown = m; }

        // the three tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          setText(c.lastElementChild, done ? chips[i][1] : chips[i][0]);
        });

        // the repo card rises
        const ci = seg(t, T.card, T.card + 0.5);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // the seven commits drop in and land with a bounceOut over their dim ghost slots; their files pop in right behind
        let landed = 0;
        commitRows.forEach((row, i) => {
          const a = T.commit[i];
          if (t >= a) landed++;
          ghostEls[i].style.opacity = (1 - seg(t, a, a + 0.12)).toFixed(3);
          row.style.opacity = outCubic(seg(t, a, a + 0.1)).toFixed(3);
          const d = seg(t, a, a + T.drop);
          row.style.transform = d >= 1 ? '' : `translateY(${(-(1 - bounceOut(d)) * 12).toFixed(2)}px)`;
          row.classList.toggle('is-new', t >= a && t < a + 0.55);
          fileEls[i].forEach((f, j) => {
            const fp = seg(t, a + 0.08 + j * 0.05, a + 0.08 + j * 0.05 + 0.38);
            f.style.opacity = outCubic(Math.min(1, fp * 3)).toFixed(3);
            f.style.transform = fp >= 1 ? '' : `scale(${lerp(0.55, 1, bounceOut(fp)).toFixed(4)})`;
          });
        });

        // push progress: a seventh per commit, each step bouncing in with bounceOut
        let fill = 0;
        for (let i = 0; i < n; i++) fill += bounceOut(seg(t, T.commit[i], T.commit[i] + T.drop)) / n;
        fillEl.style.transform = `scaleX(${Math.min(1, fill).toFixed(4)})`;
        setText(pnEl, landed + '/' + n);

        // the 8-bar timeline chip: each chapter's bars light in its ground colour as its commit lands
        let lit = 0;
        cellEls.forEach((c, b) => {
          const a = T.commit[BAR_OWNER[b]] + 0.04 * (COMMITS[BAR_OWNER[b]].bars.indexOf(b + 1));
          if (t >= a) lit++;
          const p = seg(t, a, a + T.drop);
          c.style.opacity = t >= a ? '1' : '0';
          c.style.transform = p >= 1 ? '' : `scaleY(${bounceOut(p).toFixed(4)})`;
        });
        setText(tlnEl, lit + '/' + NBARS);

        // main turns green with a drawn check once the push has landed
        const bp = seg(t, T.main, T.main + 0.28);
        branchEl.style.opacity = outCubic(bp).toFixed(3);
        branchEl.style.transform = bp >= 1 ? '' : `translateY(${((1 - outCubic(bp)) * 6).toFixed(2)}px) scale(${lerp(0.92, 1, outBack(bp)).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);
      },
    };
  },
};
