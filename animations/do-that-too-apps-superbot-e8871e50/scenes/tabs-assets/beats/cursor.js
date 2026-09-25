// Cursor beat: Cursor asks for GitHub first. The connect card lands, the pointer presses Connect and the card flips
// to Connected. Then Cursor's agent panel works the job the way Cursor shows it: Planning next moves -> a to-do list
// that checks itself off while file edits, a terminal run and a push land under it -> the Undo All / Keep All review
// bar -> the pointer keeps all. No code is ever typed on screen. Octicon paths are Primer's
// (github.com/primer/octicons), as in ../do-that-too code.js.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount, press, path } from '../../../lib.js';

const oct = (d, vb = '0 0 16 16', cls = '') => `<svg class="oct ${cls}" viewBox="${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
const GH = oct('M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943', '0 0 24 24', 'gh');
const O_CHECK = oct('M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z');
const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
const TERM = '<svg class="ca-ic" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
const LIST = '<svg class="ca-ic" viewBox="0 0 24 24"><path d="M11 5h10M11 12h10M11 19h10"/><path d="m3 5 1.5 1.5L7 4M3 12l1.5 1.5L7 11M3 19l1.5 1.5L7 18"/></svg>';
const TICK = '<svg class="ca-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const SAY = 'I’ll need your GitHub to set this up.';
const FIN = 'Done. The meme is live on all 4 of your accounts.';
const HANDLES = ['muse_daily', 'musememes', 'sam_builds', 'sam_alt'];
const TODOS = ['Create repo sam/muse-poster', 'Write post_to_x.py', 'Run it on your 4 accounts', 'Push to GitHub'];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.curIn = T.card + 0.1; T.curAt1 = T.curIn + 0.45; T.press1 = T.curAt1 + 0.08;
    T.flip = T.press1 + 0.2;               // Connect -> Connected
    const P = T.panel = T.flip + 0.45;     // Cursor's agent panel
    T.think = [P + 0.1, P + 0.6];
    T.todos = P + 0.5;
    T.task = [[P + 0.7, P + 1.05], [P + 1.05, P + 1.6], [P + 1.6, P + 2.1], [P + 2.1, P + 2.4]];
    T.review = P + 2.5;
    T.cur3In = P + 2.35; T.press3 = P + 3.0; T.kept = T.press3 + 0.1;
    T.fin = P + 3.3;
    T.hand = T.fin + 0.35;
    T.end = T.hand + 4 * 0.1 + 0.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cd-gh">
      <div class="cd-gh-face fa"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>GitHub</b><small>Create repos and push for Cursor</small></span><span class="cd-gh-btn"><span>Connect</span></span></div>
      <div class="cd-gh-face fb"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>Connected as @sam</b><small>github.com/sam &middot; read and write</small></span><span class="cd-gh-ok">${O_CHECK}<span>Connected</span></span></div>
    </div>`);
    const steps = [
      `<span class="ca-si gh">${GH}</span><span>Created repo</span><b>sam/muse-poster</b>`,
      '<span class="ca-si py">py</span><b>post_to_x.py</b><span class="ca-add" data-n="42">+0</span>',
      '<span class="ca-si js">{}</span><b>accounts.json</b><span class="ca-add" data-n="12">+0</span>',
      `<span class="ca-si tm">${TERM}</span><code>python post_to_x.py</code><span class="ca-run"><i class="ca-spin"></i>Running</span><span class="ca-okp">${TICK}Success</span>`,
      `<span class="ca-si gh">${O_BRANCH}</span><span>Pushed to</span><b>sam/muse-poster</b><span class="ca-dim">main &middot; 1 commit</span>`,
    ];
    const STEP_TASK = [0, 1, 1, 2, 3];
    const panel = x.el(`<div class="ca">
      <div class="ca-hd"><img src="${x.brand('cursor-logo.svg')}" alt=""/><b>Agent</b><span class="ca-pill">Auto</span><span class="ca-br">${O_BRANCH}sam/muse-poster</span></div>
      <div class="ca-bd">
        <div class="ca-think"><span class="ca-th-a">Planning next moves</span><span class="ca-th-b">Thought for 2s</span></div>
        <div class="ca-todos"><div class="ca-todos-h">${LIST}<b>To-dos</b><em>0 of 4 done</em></div>
          ${TODOS.map((s) => `<div class="ca-td"><i class="ca-cb"><i class="ca-cbr"></i>${TICK}</i><span>${x.esc(s)}</span></div>`).join('')}
        </div>
        <div class="ca-steps">${steps.map((s) => `<div class="ca-st">${s}</div>`).join('')}</div>
      </div>
      <div class="ca-rv"><span class="ca-rv-f"><b>2 files</b><em>+54</em></span><span class="ca-undo">Undo All</span><span class="ca-keep"><span>Keep All</span><kbd>&#8984;&#9166;</kbd></span><span class="ca-kept">${TICK}Kept 2 files</span></div>
    </div>`);
    const fin = x.el(`<div class="qc-say qc-fin2"><span class="qc-vis"></span><span class="qc-hid">${x.esc(FIN)}</span></div>`);
    const hands = x.el(`<div class="qc-hs">${HANDLES.map((h) => `<span class="qc-h">${x.OK}@${h}</span>`).join('')}</div>`);

    const $ = (s) => panel.querySelector(s), $$ = (s) => [...panel.querySelectorAll(s)];
    const ghBtn = card.querySelector('.cd-gh-btn'), ghOk = card.querySelector('.cd-gh-ok'), fa = card.firstElementChild, fb = card.lastElementChild;
    const thA = $('.ca-th-a'), thB = $('.ca-th-b'), todosEl = $('.ca-todos'), cnt = $('.ca-todos-h em');
    const tds = $$('.ca-td'), sts = $$('.ca-st'), rv = $('.ca-rv'), keep = $('.ca-keep'), kept = $('.ca-kept');
    const adds = sts.map((s) => s.querySelector('.ca-add'));
    const run = sts[3].querySelector('.ca-run'), runSpin = sts[3].querySelector('.ca-spin'), okp = sts[3].querySelector('.ca-okp');
    const hs = [...hands.children];
    const streams = [[say, SAY, T.r + 0.05], [fin, FIN, T.fin + 0.05]].map(([n, s, a]) => ({ vis: n.firstElementChild, hid: n.lastElementChild, s, a, shown: -1 }));
    const rise = (n, a, dy = 8, d = 0.4) => { const p = outCubic(seg(t0, a, a + d)); n.style.opacity = p.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`; return p; };
    // the panel grows as rows land (no empty reserved space); rem = layout px still to grow, for the camera
    const grow = (n, p, h, mt = 0) => { n.style.height = `${(h * p).toFixed(2)}px`; n.style.marginTop = `${(mt * p).toFixed(2)}px`; rem += (h + mt) * (1 - p); };
    let t0 = 0, rem = 0;

    return {
      nodes: [say, card, panel, fin, hands],
      marks: [[T.r, say], [T.card, card], [T.panel, panel], [T.fin, fin], [T.hand, hands]],
      cams: [
        [T.card - 0.05, 0.5, () => x.F.el(card, 1.5, 0.7)],
        [T.panel - 0.05, 0.7, () => x.F.el(panel, 1.42, 0.84, () => rem)],
        [T.fin - 0.1, 0.55, x.F.thread],
      ],
      render(t) {
        t0 = t;
        streams.forEach((s) => { const n = streamCount(s.s, s.a, 80, t); if (n !== s.shown) { s.vis.textContent = s.s.slice(0, n); s.hid.textContent = s.s.slice(n); s.shown = n; } });
        // connect card: rises, press, then an in-place swap to Connected
        rise(card, T.card, 10);
        ghBtn.style.transform = `scale(${(1 - 0.07 * press(t, T.press1)).toFixed(4)})`;
        const fl = inOutCubic(seg(t, T.flip, T.flip + 0.35));
        fa.style.transform = fl > 0 ? `translateY(${(-6 * fl).toFixed(2)}px)` : ''; fa.style.opacity = (1 - fl).toFixed(3);
        fb.style.transform = fl < 1 ? `translateY(${(6 * (1 - fl)).toFixed(2)}px)` : ''; fb.style.opacity = fl.toFixed(3);
        ghOk.style.transform = `scale(${lerp(0.6, 1, outBack(seg(t, T.flip + 0.1, T.flip + 0.42))).toFixed(3)})`;

        // agent panel
        const pp = outCubic(seg(t, T.panel, T.panel + 0.5));
        panel.style.opacity = pp.toFixed(3);
        panel.style.transform = pp >= 1 ? 'none' : `translateY(${((1 - pp) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, pp).toFixed(4)})`;
        const th = seg(t, T.think[1] - 0.15, T.think[1] + 0.15);
        thA.style.opacity = (1 - th).toFixed(3); thB.style.opacity = th.toFixed(3);
        thA.style.setProperty('--sh', `${(100 - ((t - T.think[0]) * 150) % 200).toFixed(1)}%`);
        rem = 0;
        // the to-do box grows with its header and rows (29 + 4 x 22 + 7 bottom pad)
        const p0 = rise(todosEl, T.todos, 8);
        let ch = 29 * p0, pl = 0;
        let done = 0;
        tds.forEach((n, i) => {
          const pr = rise(n, T.todos + 0.08 * (i + 1), 6, 0.3);
          n.style.height = `${(22 * pr).toFixed(2)}px`;
          ch += 22 * pr; pl = pr;
          const [a, b] = T.task[i];
          const on = t >= a && t < b, ok = t >= b;
          if (ok) done++;
          n.classList.toggle('on', on); n.classList.toggle('ok', ok);
          n.querySelector('.ca-cbr').style.transform = `rotate(${((t - a) * 400).toFixed(1)}deg)`;
          n.querySelector('.ca-tk').style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, b, b + 0.3))).toFixed(3)})`;
        });
        ch += 7 * pl;
        todosEl.style.height = `${ch.toFixed(2)}px`;
        rem += 124 - ch;
        cnt.textContent = `${done} of 4 done`;
        sts.forEach((n, i) => {
          const a = T.task[STEP_TASK[i]][0] + (i === 2 ? 0.32 : 0.1);
          grow(n, rise(n, a, 8, 0.35), 26, i ? 5 : 0);
          const ad = adds[i];
          if (ad) ad.textContent = `+${Math.round(Number(ad.dataset.n) * outCubic(seg(t, a + 0.05, a + 0.5)))}`;
        });
        const rEnd = T.task[2][1];
        run.style.opacity = (1 - seg(t, rEnd - 0.08, rEnd + 0.05)).toFixed(3);
        runSpin.style.transform = `rotate(${((t - T.task[2][0]) * 420).toFixed(1)}deg)`;
        okp.style.opacity = seg(t, rEnd, rEnd + 0.2).toFixed(3);
        okp.style.transform = `scale(${lerp(0.7, 1, outBack(seg(t, rEnd, rEnd + 0.3))).toFixed(3)})`;
        // review bar: slides up, the pointer keeps all, it resolves to "Kept"
        const rp = rise(rv, T.review, 10, 0.4);
        grow(rv, rp, 38, 4);
        keep.style.transform = `scale(${(1 - 0.08 * press(t, T.press3)).toFixed(4)})`;
        const kk = seg(t, T.kept, T.kept + 0.3);
        rv.classList.toggle('is-kept', t >= T.kept);
        kept.style.opacity = kk.toFixed(3);
        [...rv.children].slice(0, 3).forEach((n) => { n.style.opacity = (1 - kk).toFixed(3); });

        rise(fin, T.fin - 0.02, 6, 0.3);
        hs.forEach((n, i) => rise(n, T.hand + i * 0.1, 8, 0.32));
      },
      pointer(t, toScr) {
        const one = t >= T.curIn - 0.01 && t < T.flip + 0.6, two = t >= T.cur3In - 0.01 && t < T.kept + 0.6;
        if (!one && !two) return null;
        if (one) {
          const bA = x.box(ghBtn);
          const pA = toScr({ x: bA.cx + bA.w * 0.1, y: bA.cy + 3 });
          const p = path(t, [
            { t: T.curIn, x: pA.x + 280, y: pA.y + 260 }, { t: T.curAt1, ...pA }, { t: T.flip + 0.15, ...pA },
            { t: T.flip + 0.55, x: pA.x + 80, y: pA.y + 150 },
          ]);
          const v = seg(t, T.curIn, T.curIn + 0.18) * (1 - seg(t, T.flip + 0.15, T.flip + 0.5));
          return { ...p, p: press(t, T.press1), v };
        }
        const bK = x.box(keep);
        const pK = toScr({ x: bK.cx + bK.w * 0.1, y: bK.cy + 3 });
        const p = path(t, [{ t: T.cur3In, x: pK.x + 260, y: pK.y + 240 }, { t: T.press3 - 0.12, ...pK }, { t: T.kept + 0.15, ...pK }, { t: T.kept + 0.55, x: pK.x + 80, y: pK.y + 150 }]);
        const v = seg(t, T.cur3In, T.cur3In + 0.2) * (1 - seg(t, T.kept + 0.15, T.kept + 0.5));
        return { ...p, p: press(t, T.press3), v };
      },
    };
  },
};
