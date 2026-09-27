// GitHub beat: superbot connects GitHub, creates sam/liquid-glass and pushes the first three commits. Three tool
// chips spring in and resolve ("Authorizing GitHub" -> "Authorized as sam", repo, push), each on the 120 BPM grid;
// the repo card morphs out of a squat capsule, its three commits spring in one per 8th note while a glass selection
// capsule slides down onto the newest (stretching as it moves, like the clip's tab-bar lens), and when the push lands
// the main branch pill springs in blue with a drawn check, a refraction sheen crosses the pane and the TypeScript/GLSL
// language bar fills. The card is a Liquid Glass surface (chat rule r1) over the lilac-to-sky gradient.
// Pure function of t (the tabs scene's local time): no Date, no rAF, no per-frame state that depends on history.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Connected. Pushing Liquid Glass to GitHub.';
const OWNER = 'sam';
const REPO = 'liquid-glass';
const BRANCH = 'main';
const DESC = 'Liquid Glass motion reel, 8 scenes at 120 BPM';
// short shas are made up; the messages are the reel's first three commits
const COMMITS = [
  ['7c1f4a2', 'refraction lens + chromatic fringe'],
  ['e58b0c9', 'scenes 01-08 on the 120 BPM grid'],
  ['3d92a71', 'outro: Liquid Glass, designed to move'],
];
// the language bar: the reel is TypeScript scenes over a GLSL shader
const LANGS = [
  ['TypeScript', 76.4, '#3178c6'],
  ['GLSL', 23.6, '#5686a5'],
];
const BOOK = '<svg class="git-book" viewBox="0 0 24 24"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>';
const LOCK = '<svg class="git-lock" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';
const BRANCHIC = '<svg class="git-bic" viewBox="0 0 24 24"><path d="M6.5 3.5v13"/><circle cx="6.5" cy="19" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><path d="M17.5 8.5a8 8 0 0 1-8 8"/></svg>';
const CHECK = '<svg class="git-ck" viewBox="0 0 24 24"><path class="git-ck-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const BEAT = 0.5;   // 120 BPM: every chip, commit and the push land on this grid (beats and 8th notes from r)
const SEL = 0.34;   // the selection capsule's slide from one commit to the next

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + BEAT / 2, r + BEAT, r + BEAT * 1.5];                // one chip per 8th note
    T.chipDone = [r + BEAT * 1.25, r + BEAT * 2, r + BEAT * 2.75];       // each resolves 3/4 beat after it lands
    T.card = r + BEAT * 3;
    T.commit = COMMITS.map((_, i) => r + BEAT * 3.5 + i * BEAT / 2);    // one commit per 8th note
    T.pushed = T.chipDone[2];
    T.main = T.commit[COMMITS.length - 1] + BEAT / 4;   // the push lands a 16th after the last commit
    T.lang = T.main + BEAT / 4;   // the language bar fills a 16th after the branch pill lands
    T.end = r + 2.95;   // the branch check finishes drawing at r + 2.775 and the bar at r + 2.9, then the next switch
    return T;
  },
  build(k, x) {
    const T = k.T;
    const opts = k.opts || {};
    const say = opts.say || SAY;
    const owner = opts.owner || OWNER;
    const repo = opts.repo || REPO;
    const branch = opts.branch || BRANCH;
    const chips = [
      ['Authorizing GitHub', 'Authorized as ' + owner],
      ['Creating repo ' + owner + '/' + repo, 'Created ' + owner + '/' + repo],
      ['Pushing 3 commits to ' + branch, 'Pushed to ' + branch],
    ];
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
    const rows = chips.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="git-card">
      <div class="git-head">
        <span class="git-logo"><img src="${x.brand('github-logo.svg')}" alt="GitHub"/></span>
        ${BOOK}
        <span class="git-name"><b>${x.esc(owner)}</b><i>/</i><b class="git-repo">${x.esc(repo)}</b></span>
        <span class="git-priv">${LOCK}Private</span>
      </div>
      <div class="git-desc">${x.esc(DESC)}</div>
      <div class="git-commits"><i class="git-sel" aria-hidden="true"></i>
        ${COMMITS.map(([sha, msg]) => `<div class="git-commit"><span class="git-sha">${x.esc(sha)}</span><span class="git-msg">${x.esc(msg)}</span></div>`).join('')}
      </div>
      <div class="git-bar">
        <span class="git-branch">${BRANCHIC}${x.esc(branch)}${CHECK}</span>
        <span class="git-langs">${LANGS.map(([name, pct, c]) => `<span class="git-lang"><i class="git-dot" style="background:${c}"></i>${x.esc(name)} ${pct}%</span>`).join('')}</span>
      </div>
      <div class="git-lbar"><i class="git-lseg" style="width:${LANGS[0][1]}%;background-color:${LANGS[0][2]}"></i><i class="git-lseg" style="width:${LANGS[1][1]}%;background-color:${LANGS[1][2]}"></i></div>
      <i class="git-sheen" aria-hidden="true"></i>
    </div>`);
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    const commitRows = [...card.querySelectorAll('.git-commit')];
    const branchEl = card.querySelector('.git-branch');
    const checkP = card.querySelector('.git-ck-p');
    const langRow = card.querySelector('.git-langs');
    const langSegs = [...card.querySelectorAll('.git-lseg')];
    const sel = card.querySelector('.git-sel');
    const sheen = card.querySelector('.git-sheen');
    // glass motion: opacity eases in plainly, position and scale spring (outBack) so every arrival overshoots and
    // settles like a liquid drop
    const pop = (n, p, dx, dy, s0 = 1) => {
      n.style.opacity = outCubic(clamp(p * 1.6)).toFixed(3);
      if (p >= 1) { n.style.transform = ''; return; }
      const e = outBack(p);
      n.style.transform = `translate(${((1 - e) * dx).toFixed(2)}px, ${((1 - e) * dy).toFixed(2)}px)${s0 !== 1 ? ` scale(${lerp(s0, 1, e).toFixed(4)})` : ''}`;
    };
    // where the selection capsule sits at time u, in commit rows: it springs from row to row as each commit lands
    const selAt = (u) => T.commit.reduce((s, a, i) => (i ? s + outBack(seg(u, a, a + SEL)) : s), 0);
    let shown = -1;
    return {
      nodes: [sayEl, ...rows, card],
      marks: [[T.r, sayEl], ...rows.map((r, i) => [T.chipIn[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(say, T.r + 0.05, 90, t);
        if (n !== shown) { vis.textContent = say.slice(0, n); hid.textContent = say.slice(n); shown = n; }

        // the three tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          pop(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 0, 8, 0.94);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? chips[i][1] : chips[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the repo card morphs out of a squat, rounder capsule into the card over one beat, springing past its size
        const ci = seg(t, T.card, T.card + BEAT);
        card.style.opacity = outCubic(seg(t, T.card, T.card + 0.22)).toFixed(3);
        if (ci >= 1) { card.style.transform = ''; card.style.borderRadius = ''; }
        else {
          const e = outBack(ci);
          card.style.transform = `translateY(${((1 - e) * 14).toFixed(2)}px) scale(${lerp(0.9, 1, e).toFixed(4)}, ${lerp(0.7, 1, e).toFixed(4)})`;
          card.style.borderRadius = `${lerp(26, 14, outCubic(ci)).toFixed(2)}px`;
        }

        // the pushed commits spring in one per 8th note; the newest's sha takes the accent
        commitRows.forEach((row, i) => {
          const a = T.commit[i];
          pop(row, seg(t, a, a + 0.32), -10, 0);
          row.classList.toggle('is-new', t >= a && (i === COMMITS.length - 1 || t < T.commit[i + 1]));
        });

        // the glass selection capsule: it swells in under the first commit, springs down onto each new one, stretching
        // with its speed, and stays on the newest until the card settles
        const sp = selAt(t);
        const sv = clamp(Math.abs(sp - selAt(t - 1 / 30)) * 30 * 0.05, 0, 0.25);   // rows per second, damped
        const sin = seg(t, T.commit[0], T.commit[0] + 0.3);
        sel.style.opacity = outCubic(clamp(sin * 1.6)).toFixed(3);
        sel.style.transform = `translateY(${(sp * 100).toFixed(2)}%) scale(${(lerp(0.86, 1, outBack(sin)) * (1 - 0.08 * sv)).toFixed(4)}, ${(lerp(0.6, 1, outBack(sin)) * (1 + 0.8 * sv)).toFixed(4)})`;

        // main turns blue with a drawn check once the push has landed
        const bp = seg(t, T.main, T.main + 0.28);
        pop(branchEl, bp, 0, 6, 0.8);
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.main + 0.08, T.main + 0.4)))).toFixed(2);

        // the push lands: one refraction sheen crosses the pane over a beat, a chromatic fringe on its edges
        const sw = seg(t, T.main - 0.05, T.main + BEAT - 0.05);
        sheen.style.opacity = sw > 0 && sw < 1 ? Math.sin(Math.PI * sw).toFixed(3) : '0';
        sheen.style.transform = `translateX(${lerp(-140, 310, outCubic(sw)).toFixed(1)}%) skewX(-14deg)`;

        // the language bar: the shares grow out of the left edge, the legend settles beside them
        const lp = seg(t, T.lang, T.lang + 0.4);
        const le = outCubic(lp);
        // the shares grow as one bar: TypeScript scales out of the left edge and GLSL rides its front, so no gap opens
        let lead = 0;
        langSegs.forEach((s, i) => {
          const tx = -(1 - le) * lead / LANGS[i][1] * 100;
          s.style.transform = `translateX(${tx.toFixed(2)}%) scaleX(${Math.max(0.001, le).toFixed(4)})`;
          lead += LANGS[i][1];
        });
        langRow.style.opacity = le.toFixed(3);
      },
    };
  },
};