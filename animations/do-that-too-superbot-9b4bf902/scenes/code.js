// scenes/code.js: "But can it code like Cursor?" -> Superbot codes too, told purely as a conversation in the
// full-width hub chat (no editor pane). Beats: "Fix the login redirect bug" -> "I need access to your repo first."
// + GitHub connect card -> pointer clicks -> GitHub authorize sheet (camera settles first, ~1s hold, click,
// dissolve) -> card swaps to Connected as @devon -> clone / find / edit / test chips + reply -> "Add rate limiting
// to /login" -> edit chips + short reply -> "Ship it" -> PR #142 with green checks, hold. Pure function of lt.
//
// Brand marks: the GitHub mark and every GitHub glyph below are the real Primer Octicons paths
// (https://github.com/primer/octicons, icons/mark-github-24.svg, repo-16, git-pull-request-16, mail-16,
// check-16, check-circle-fill-16, lock-16, git-branch-16), the set github.com/logos points to.
// Copies of the downloaded SVGs sit in ./code-assets/.
import * as L from '../lib.js';
import { makeShell, userBubble, botBlock, toolChip, setToolState, setComposer, makeCursor, makeMark, scrollFeed } from '../shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, op } = L;
const H = 1080;

// ---------- octicons (verbatim paths) ----------
const oct = (d, vb = '0 0 16 16', cls = '') => `<svg class="oct ${cls}" viewBox="${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
const GH = oct('M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943', '0 0 24 24', 'gh');
const O_REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z');
const O_PR = oct('M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z');
const O_MAIL = oct('M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z');
const O_CHECK = oct('M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z');
const O_OK = oct('M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z', '0 0 16 16', 'okc');
const O_LOCK = oct('M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z');
const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');

// ---------- copy + timing (local lt) ----------
const P1 = 'Fix the login redirect bug in acme-web';
const P2 = 'Add rate limiting to /login';
const P3 = 'Ship it';
const R0 = 'I need access to your repo first.';
const R1 = 'Fixed. The redirect read returnTo before the session was saved.';
const R2 = 'Done. Five tries per minute per IP, then a 429.';

const T = {};
T.ty1 = 0.3; T.send1 = L.typeEnd(P1, T.ty1, 60) + 0.12;
T.b1 = T.send1 + 0.28;                 // "I need access..." streams
T.card = T.b1 + 0.18;                  // the GitHub connect card grows in
T.curIn = T.card + 0.1;                // pointer arrives
T.curAt1 = T.curIn + 0.5;
T.press1 = T.curAt1 + 0.08;
T.camS = T.press1 + 0.1;               // camera settles on the sheet framing (0.45) BEFORE the sheet enters
T.sheet = T.camS + 0.45;               // authorize sheet slides up (0.42)
T.curAt2 = T.sheet + 0.8;              // pointer drifts onto Authorize during the hold
T.press2 = T.sheet + 0.42 + 1.0;       // ~1.0s settled hold before the click
T.sheetOut = T.press2 + 0.22;          // sheet dissolves (0.3)
T.flip = T.sheetOut + 0.3;             // card swaps to Connected while the camera is still (0.35)
T.camBack = T.flip + 0.36;             // only then the camera returns to the chat (0.45)
const CH1 = [                          // [key, running label, done label]
  ['c1', 'Cloning acme/acme-web', 'Cloned acme/acme-web'],
  ['c2', 'Reading src/auth', 'Found it in src/auth/session.ts'],
  ['c3', 'Editing src/auth/session.ts', 'Edited src/auth/session.ts  +2 −2'],
  ['c4', 'Running tests', 'Tests passing (12)'],
];
T.chips1 = T.camBack + 0.14;           // one chip every 0.34s, each done as the next one starts
T.r1 = T.chips1 + CH1.length * 0.34 + 0.08;
T.ty2 = T.r1 + 0.62; T.send2 = L.typeEnd(P2, T.ty2, 80) + 0.12;
const CH2 = [
  ['c5', 'Editing src/routes/login.ts', 'Edited src/routes/login.ts  +5'],
  ['c6', 'Running tests', 'Rate limited /login: 5 per minute'],
];
T.chips2 = T.send2 + 0.28;
T.r2 = T.chips2 + CH2.length * 0.36 + 0.06;
T.ty3 = T.r2 + 0.5; T.send3 = L.typeEnd(P3, T.ty3, 80) + 0.12;
T.c7 = T.send3 + 0.26; T.c7d = T.c7 + 0.34;   // Opening pull request
T.camPR = T.send3 + 0.06;              // closer framing for "Ship it" + the PR card (0.5)
T.pr = T.c7d;                          // PR card grows (0.34)
T.chk = T.pr + 0.4;                    // checks land 0.1 apart
const DUR = +(T.chk + 0.42 + 1.1).toFixed(2);

// ---------- module state ----------
let S, cur, markA, markB;
const items = [];                      // thread items: { w, el, t, gap }
const chips = {};
let r0p, r1p, r2p, ghCard, ghBtn, ghOk, prChecks;
let auth, authDim, authSlot, authSheet, authBtn, authBtnTx;

function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function addItem(el, t, gap) {
  const w = document.createElement('div');
  w.className = 'cd-g';
  w.appendChild(el);
  S.feedIn.appendChild(w);
  items.push({ w, el, t, gap });
}
function wrapBot(el) { const b = botBlock(''); b.appendChild(el); return b; }
function botText(text) {
  const b = botBlock('<p><span class="cd-vis"></span><span class="cd-rest"></span></p>');
  b.vis = b.querySelector('.cd-vis'); b.rest = b.querySelector('.cd-rest'); b.full = text; b.shown = -1;
  return b;
}
function setStream(b, n) {
  if (n === b.shown) return; b.shown = n;
  b.vis.textContent = b.full.slice(0, n); b.rest.textContent = b.full.slice(n);
}

export default {
  id: 'code',
  dur: DUR,

  mount(section) {
    S = makeShell({ mode: 'chat', title: 'acme-web',
      projects: [{ name: 'Fix login redirect', when: 'now' }, { name: 'Appling', when: '2m' }, { name: 'Portfolio', when: '1h' }],
      active: 0 });
    section.appendChild(S.root);

    // ---- thread ----
    addItem(userBubble(P1), T.send1, 0);
    r0p = botText(R0); addItem(r0p, T.b1, 14);
    ghCard = h(`<div class="cd-gh">
      <div class="cd-gh-face fa"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>GitHub</b><small>Read and push to acme-web</small></span><span class="cd-gh-btn">${GH}<span>Connect GitHub</span></span></div>
      <div class="cd-gh-face fb"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>Connected as @devon &middot; acme-web</b><small>acme/acme-web &middot; read and write</small></span><span class="cd-gh-ok">${O_CHECK}<span>Connected</span></span></div>
    </div>`);
    ghBtn = ghCard.querySelector('.cd-gh-btn'); ghOk = ghCard.querySelector('.cd-gh-ok');
    addItem(wrapBot(ghCard), T.card, 8);
    CH1.forEach(([k, run], i) => { chips[k] = toolChip(run); addItem(wrapBot(chips[k]), T.chips1 + i * 0.34, i ? 6 : 14); });
    r1p = botText(R1); addItem(r1p, T.r1, 8);
    addItem(userBubble(P2), T.send2, 14);
    CH2.forEach(([k, run], i) => { chips[k] = toolChip(run); addItem(wrapBot(chips[k]), T.chips2 + i * 0.36, i ? 6 : 14); });
    r2p = botText(R2); addItem(r2p, T.r2, 8);
    addItem(userBubble(P3), T.send3, 14);
    chips.c7 = toolChip('Opening pull request'); addItem(wrapBot(chips.c7), T.c7, 14);
    const prCard = h(`<div class="cd-pr">
      <div class="cd-pr-h">${GH}<span>acme/acme-web</span><span class="cd-pr-st">${O_PR}Open</span></div>
      <div class="cd-pr-b">
        <b><span class="cd-pr-n">Opened #142</span> &middot; Fix login redirect + rate limit</b>
        <small>${O_BRANCH}fix/login-redirect &rarr; main &middot; 2 files &middot; <span class="ga">+7</span> <span class="gd">&minus;2</span></small>
        <div class="cd-pr-checks">
          <span class="cd-ck"><i class="cd-dot"></i>${O_OK}Tests 12 passed</span>
          <span class="cd-ck"><i class="cd-dot"></i>${O_OK}Lint</span>
          <span class="cd-ck"><i class="cd-dot"></i>${O_OK}Build</span>
        </div>
      </div>
    </div>`);
    prChecks = [...prCard.querySelectorAll('.cd-ck')];
    addItem(wrapBot(prCard), T.pr, 8);

    // ---- the GitHub authorize sheet (over the window, in window layout px) ----
    auth = h(`<div class="cd-auth"><div class="cd-dim"></div><div class="cd-slot"><div class="cd-sheet">
      <div class="cd-sh-url">${O_LOCK}<span>github.com/login/oauth/authorize</span></div>
      <div class="cd-sh-body">
        <div class="cd-sh-logos"><span class="cd-sh-app"></span><span class="cd-sh-link"><i></i><i></i><i></i><b>${O_CHECK}</b><i></i><i></i><i></i></span><span class="cd-sh-gh">${GH}</span></div>
        <h3>Authorize Superbot</h3>
        <div class="cd-sh-box">
          <div class="cd-sh-row first"><span class="cd-sh-mini"></span><span><b>Superbot</b> by <b>superbot-gg</b><small>wants to access your <b>@devon</b> account</small></span></div>
          <div class="cd-sh-row">${O_REPO}<span><b>Repositories</b><small>acme/acme-web</small></span><em>Read and write</em></div>
          <div class="cd-sh-row">${O_PR}<span><b>Pull requests</b><small>Open and update</small></span><em>Read and write</em></div>
          <div class="cd-sh-row">${O_MAIL}<span><b>Email addresses</b><small>devon@acme.dev</small></span><em>Read-only</em></div>
        </div>
        <div class="cd-sh-btn"><span>Authorize superbot</span></div>
        <p>Authorizing will redirect to <b>https://superbot.gg</b></p>
      </div>
    </div></div></div>`);
    authDim = auth.querySelector('.cd-dim'); authSlot = auth.querySelector('.cd-slot'); authSheet = auth.querySelector('.cd-sheet');
    authBtn = auth.querySelector('.cd-sh-btn'); authBtnTx = authBtn.firstElementChild;
    markA = makeMark(30); auth.querySelector('.cd-sh-app').appendChild(markA.el);
    markB = makeMark(14); auth.querySelector('.cd-sh-mini').appendChild(markB.el);
    S.win.appendChild(auth);

    cur = makeCursor();
    section.appendChild(cur);
  },

  render(lt, ctx) {
    const W = ctx.W, t = ctx.t;
    S.renderMarks(t); markA.render(t); markB.render(t);

    // ---- composer: three asks ----
    let draft = '', pr = 0;
    for (const [p, t0, cps, send] of [[P1, T.ty1, 60, T.send1], [P2, T.ty2, 80, T.send2], [P3, T.ty3, 80, T.send3]]) {
      if (lt >= t0 && lt < send) draft = L.typed(p, t0, cps, lt).text;
      pr = Math.max(pr, L.press(lt, send));
    }
    setComposer(S, draft, { press: pr });

    // ---- thread items grow in (height + fade + small rise); the thread is bottom-anchored (code.css) ----
    for (const it of items) {
      const f = seg(lt, it.t, it.t + 0.34);
      if (f <= 0) { it.w.style.display = 'none'; continue; }
      it.w.style.display = '';
      if (f >= 1) { it.w.style.height = ''; it.w.style.opacity = ''; it.el.style.transform = ''; it.w.style.marginTop = it.gap + 'px'; continue; }
      const e = outCubic(f);
      it.w.style.height = (it.el.offsetHeight * e).toFixed(2) + 'px';
      it.w.style.marginTop = (it.gap * e).toFixed(2) + 'px';
      it.w.style.opacity = e.toFixed(3);
      it.el.style.transform = `translateY(${((1 - e) * 8).toFixed(2)}px)`;
    }
    scrollFeed(S, 0);
    setStream(r0p, L.streamCount(R0, T.b1, 130, lt));
    setStream(r1p, L.streamCount(R1, T.r1, 150, lt));
    setStream(r2p, L.streamCount(R2, T.r2, 150, lt));

    // chips: each runs, then lands done as the next one starts
    const chip = (k, on, done, runL, doneL) => setToolState(chips[k], lt >= done ? 'done' : 'run', lt >= done ? doneL : runL, lt - on);
    CH1.forEach(([k, run, done], i) => chip(k, T.chips1 + i * 0.34, T.chips1 + (i + 1) * 0.34, run, done));
    CH2.forEach(([k, run, done], i) => chip(k, T.chips2 + i * 0.36, T.chips2 + (i + 1) * 0.36, run, done));
    chip('c7', T.c7, T.c7d, 'Opening pull request', 'Pushed fix/login-redirect');

    // GitHub connect card: press, then an in-place swap to Connected (the card box never changes size)
    ghBtn.style.transform = `scale(${L.pressScale(lt, T.press1, 0.06).toFixed(4)})`;
    const fl = inOutCubic(seg(lt, T.flip, T.flip + 0.35));
    const fa = ghCard.firstElementChild, fb = ghCard.lastElementChild;
    fa.style.transform = fl > 0 ? `translateY(${(-5 * fl).toFixed(2)}px)` : ''; op(fa, 1 - fl);
    fb.style.transform = fl < 1 ? `translateY(${(5 * (1 - fl)).toFixed(2)}px)` : ''; op(fb, fl);
    ghOk.style.transform = `scale(${lerp(0.7, 1, L.outBack(seg(lt, T.flip + 0.12, T.flip + 0.42))).toFixed(3)})`;

    // PR card checks: pending dot -> green check
    prChecks.forEach((c, i) => {
      const k = seg(lt, T.chk + i * 0.1, T.chk + i * 0.1 + 0.22);
      const dot = c.querySelector('.cd-dot'), ok = c.querySelector('.okc');
      op(dot, 1 - k); op(ok, k); ok.style.transform = `scale(${lerp(0.4, 1, L.outBack(k)).toFixed(3)})`;
    });

    // ---- the GitHub authorize sheet: dim with the camera move, slide in after it settles, dissolve in place ----
    const up = outQuint(seg(lt, T.sheet, T.sheet + 0.42)), dn = inOutCubic(seg(lt, T.sheetOut, T.sheetOut + 0.3));
    const dimIn = inOutCubic(seg(lt, T.camS, T.camS + 0.4));
    auth.style.visibility = dimIn > 0.001 && dn < 1 ? 'visible' : 'hidden';
    op(authDim, 0.62 * dimIn * (1 - dn));
    authSheet.style.transform = `translateY(${((1 - up) * 420).toFixed(2)}px) scale(${(1 - 0.03 * dn).toFixed(4)})`;
    op(authSheet, clamp(up * 3) * (1 - dn));
    authBtn.style.transform = `scale(${(1 - 0.05 * L.press(lt, T.press2)).toFixed(4)})`;
    authBtn.classList.toggle('dn', lt >= T.press2 - 0.04);
    authBtnTx.textContent = lt >= T.press2 + 0.04 ? 'Authorizing' : 'Authorize superbot';

    // ---- camera ----
    const cam = camera(lt, W);
    S.root.style.transform = `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.z.toFixed(4)})`;

    // ---- pointer: onto Connect GitHub, then onto Authorize ----
    if (lt >= T.curIn - 0.01 && lt < T.sheetOut + 0.5) {
      const toScr = (p) => ({ x: cam.tx + p.x * cam.z, y: cam.ty + p.y * cam.z });
      const bA = L.boxIn(ghBtn, S.root), bB = L.boxIn(authBtn, S.root);
      const pA = toScr({ x: bA.cx + bA.w * 0.12, y: bA.cy + 2 }), pB = toScr({ x: bB.cx + bB.w * 0.36, y: bB.cy + 4 });
      const start = { x: Math.min(W - 90, pA.x + 300), y: 1040 };
      const p = L.path(lt, [
        { t: T.curIn, ...start }, { t: T.curAt1, ...pA }, { t: T.sheet + 0.2, ...pA },
        { t: T.curAt2, ...pB }, { t: T.sheetOut, ...pB }, { t: T.sheetOut + 0.45, x: pB.x + 90, y: pB.y + 160 },
      ]);
      const v = seg(lt, T.curIn, T.curIn + 0.2) * (1 - seg(lt, T.sheetOut + 0.05, T.sheetOut + 0.4));
      L.placeCursor(cur, p.x, p.y, Math.max(L.press(lt, T.press1), L.press(lt, T.press2)), v);
    } else op(cur, 0);
  },
};

// ---------- camera: fixed framings, every move inOutCubic, never past the window's edges ----------
// Chat framings are bottom-anchored on the composer and centred on the conversation column, with a fixed scale per
// beat: the camera only moves in the explicit moves below, never by following the thread as it grows.
const CHAT_Z = { chat1: 1.75, chat2: 1.55, chat3: 1.7 };
function frame(name, W) {
  const R = S.root;
  if (name in CHAT_Z) {
    const cb = L.boxIn(S.win.querySelector('.composer'), R);
    const fb = L.boxIn(S.feed, R);
    // never a half-cut header: zoom enough to push it out of frame, or show the whole window (tall 4:5)
    const noHead = H / Math.max(1, H - fb.y);
    const fit = Math.min(CHAT_Z[name], (0.94 * W) / cb.w);
    const z = noHead <= fit ? Math.max(1, noHead, fit) : 1;
    return { fx: cb.cx, fy: H, z };
  }
  if (name === 'sheet') {
    const b = L.boxIn(authSlot, R);            // the static slot: measurable before the sheet enters
    const z = clamp(Math.min((0.58 * H) / b.h, (0.7 * W) / b.w), 1, 1.6);
    return { fx: b.cx, fy: b.cy, z };
  }
  return { fx: W / 2, fy: H / 2, z: 1 };
}
function fit(f, W) {
  const tx = clamp(W / 2 - f.fx * f.z, W - W * f.z, 0), ty = clamp(H / 2 - f.fy * f.z, H - H * f.z, 0);
  return { fx: (W / 2 - tx) / f.z, fy: (H / 2 - ty) / f.z, z: f.z };
}
function camera(lt, W) {
  const moves = [
    [T.ty1 - 0.1, 0.8, 'chat1'], [T.camS, 0.45, 'sheet'], [T.camBack, 0.45, 'chat2'], [T.camPR, 0.5, 'chat3'],
  ];
  let k = -1;
  while (k + 1 < moves.length && lt >= moves[k + 1][0]) k++;
  let c;
  if (k < 0) c = fit(frame('full', W), W);
  else {
    const [t0, d, nm] = moves[k];
    const f = inOutCubic(seg(lt, t0, t0 + d));
    const to = fit(frame(nm, W), W);
    if (f >= 1) c = to;
    else {
      const from = fit(frame(k ? moves[k - 1][2] : 'full', W), W);
      c = { fx: lerp(from.fx, to.fx, f), fy: lerp(from.fy, to.fy, f), z: lerp(from.z, to.z, f) };
    }
  }
  const z = c.z;
  return { tx: clamp(W / 2 - c.fx * z, W - W * z, 0), ty: clamp(H / 2 - c.fy * z, H - H * z, 0), z };
}
