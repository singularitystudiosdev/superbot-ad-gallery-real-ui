// Repo beat: Gemini reads the repo, the issue thread and CI. Its line streams and a card rises (the base fork's
// watch.js grammar: a compact card, a counter, rows that resolve). First the issue: GitHub's green issue-opened icon,
// the title and #482, the repo line kitebase/web, the labels bug and auth, and "23 comments", with a thin bar the
// thread is read along ("Reading the thread", spinner resolving to the check, 0/23 counting up). Then "Reading N files"
// ticks up to 1,284 and three findings resolve as rows (file glyph, mono path, one tag, the finding); the first,
// the root cause, carries the highlight. The footer lands: "Root cause found across 1,284 files and 6 CI runs".
// Every name, path and number is made up for the spot. Pure function of t: every moving value is written from t, so
// ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { oct } from './gh-icons.js?v=0cb69286';

const SAY = 'Read the repo, the issue thread and the last 6 CI runs.';
export const ISSUE = { n: 482, title: 'Users get logged out after 15 minutes even with Remember me checked', repo: 'kitebase/web', comments: 23 };
const TOTAL = 1284;
// the findings: [path, finding, tag, highlighted]
const FINDINGS = [
  ['src/auth/session.ts:88', 'Session refresh fires after the token has already expired', 'Root cause', true],
  ['src/auth/refresh.ts:41', 'Two open tabs refresh at once and the second one logs you out', 'Race', false],
  ['.github/workflows/ci.yml', 'e2e login test has been skipped since Aug 12', 'Gap', false],
];
const DONE = 'Root cause found across 1,284 files and 6 CI runs';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the thread starting to be read
const READ = 0.5; /* deliberate */     // the thread read end to end (its bar fills)
const COUNT_AT = 0.08;                 // the thread read to the file counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 1,284 (its bar fills with it)
const ROW_AT = 0.24;                   // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rp-card">
      <div class="rp-iss">
        ${oct('issue-opened', 'rp-io')}
        <div class="rp-meta">
          <span class="rp-title"><b>${x.esc(ISSUE.title)}</b><span class="rp-num">#${ISSUE.n}</span></span>
          <span class="rp-l2">${oct('repo', 'rp-ri')}<span class="rp-repo">${x.esc(ISSUE.repo)}</span><i class="rp-lb rp-bug">bug</i><i class="rp-lb rp-auth">auth</i><span class="rp-cm">${oct('comment')}${ISSUE.comments} comments</span></span>
          <span class="rp-hd"><span class="rp-st"><i class="rp-spin"></i>${x.OK}</span>Reading the thread<span class="rp-tc">0/${ISSUE.comments}</span></span>
          <i class="rp-bar"><i class="rp-fill"></i></i>
        </div>
      </div>
      <div class="rp-ch"><span class="rp-st"><i class="rp-spin"></i>${x.OK}</span><b>Reading <span class="rp-n">0</span> files</b></div>
      <i class="rp-cbar"><i></i></i>
      <div class="rp-list">${FINDINGS.map(([path, text, tag, hi]) => `<div class="rp-row${hi ? ' rp-hi' : ''}">${oct('file', 'rp-fi')}
        <div class="rp-main"><span class="rp-r1"><code>${x.esc(path)}</code><span class="rp-tag">${x.esc(tag)}</span></span><span class="rp-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="rp-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.rp-st')].map((n) => ({ spin: n.querySelector('.rp-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.rp-fill'), tc = $('.rp-tc');
    const ch = $('.rp-ch'), cbarW = $('.rp-cbar'), cbar = $('.rp-cbar i'), n = $('.rp-n'), ft = $('.rp-ft');
    const rows = [...card.querySelectorAll('.rp-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', read = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the thread: read end to end, its counter running 0/23 to 23/23
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        const c = `${Math.round(p * ISSUE.comments)}/${ISSUE.comments}`;
        if (c !== read) { tc.textContent = c; read = c; }
        status(vSt, t, T.card, T.p1);

        // the file counter and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
