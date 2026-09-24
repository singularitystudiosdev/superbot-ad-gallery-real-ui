// scenes/code.js: "But can it code like Cursor?" -> Superbot codes too.
// Beats: ask to fix a bug -> Superbot asks for the repo -> Connect GitHub -> GitHub authorize sheet ->
// connected -> clone / read -> the session.ts diff lands in the editor -> tests pass -> "Add rate limiting"
// -> login.ts gains a limiter -> "Ship it" -> PR #142 with green checks. Pure function of lt.
//
// Brand marks: the GitHub mark and every GitHub glyph below are the real Primer Octicons paths
// (https://github.com/primer/octicons, icons/mark-github-24.svg, repo-16, git-pull-request-16, mail-16,
// check-16, check-circle-fill-16, lock-16, git-branch-16), the set github.com/logos points to.
// Copies of the downloaded SVGs sit in ./code-assets/.
import * as L from '../lib.js';
import { makeShell, userBubble, botBlock, toolChip, setToolState, setComposer, makeCursor, makeMark,
  scrollFeed, ICON } from '../shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, op } = L;

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

// ---------- the two files (' ' context, '-' removed, '+' added) ----------
const FILE1 = [
  [' ', "import { redirect } from '@/lib/http';"],
  [' ', "import { sessions } from '@/lib/store';"],
  [' ', "import type { Request, User } from '@/types';"],
  [' ', ''],
  [' ', '// Runs once the password or OAuth check has passed.'],
  [' ', 'export async function completeLogin(req: Request, user: User) {'],
  [' ', '  const session = await sessions.create(user.id, req.session);'],
  ['-', "  const to = req.session.returnTo ?? '/';"],
  ['-', '  sessions.save(session);'],
  ['+', '  await sessions.save(session);'],
  ['+', "  const to = session.returnTo ?? '/';"],
  [' ', '  return redirect(to, { cookie: session.cookie });'],
  [' ', '}'],
  [' ', ''],
  [' ', 'export function logout(req: Request) {'],
  [' ', '  sessions.destroy(req.session.id);'],
  [' ', "  return redirect('/login');"],
  [' ', '}'],
];
const FILE2 = [
  [' ', "import { Router } from 'express';"],
  [' ', "import { rateLimit } from '@/lib/rate-limit';"],
  [' ', "import { completeLogin } from '@/auth/session';"],
  [' ', "import { verifyPassword, resetPassword } from '@/auth/password';"],
  [' ', ''],
  [' ', 'export const login = Router();'],
  [' ', ''],
  [' ', 'login.post('],
  [' ', "  '/login',"],
  ['+', '  rateLimit({'],
  ['+', "    window: '1m',"],
  ['+', '    max: 5,'],
  ['+', '    key: (req) => req.ip,'],
  ['+', '  }),'],
  [' ', '  async (req, res) => {'],
  [' ', '    const user = await verifyPassword(req.body);'],
  [' ', '    if (!user) return res.status(401).end();'],
  [' ', '    return completeLogin(req, user);'],
  [' ', '  },'],
  [' ', ');'],
  [' ', ''],
  [' ', "login.post('/reset', rateLimit({ max: 3 }), resetPassword);"],
];

// a small TypeScript highlighter in VS Code Dark Modern colours, with bracket-pair colouring
const CTRL = new Set(['import', 'from', 'export', 'return', 'await', 'if', 'else', 'as', 'default']);
const STOR = new Set(['const', 'let', 'var', 'async', 'function', 'type', 'new', 'typeof', 'true', 'false', 'null']);
const BR = ['#ffd700', '#da70d6', '#179fff'];
function highlight(lines) {
  let depth = 0;
  return lines.map(([, src]) => {
    let out = '', m, prev = '';
    const re = /(\/\/.*$)|('(?:[^'\\]|\\.)*')|(\b\d[\d_]*\b)|([A-Za-z_$][\w$]*)|([{}()[\]])|(=>|\?\?|[=:;,.!?<>+\-*/|&])|(\s+)|(.)/g;
    while ((m = re.exec(src))) {
      const [tok, com, str, num, id, br, opr] = m;
      const e = L.esc(tok);
      if (com) out += `<i class="k-com">${e}</i>`;
      else if (str) out += `<i class="k-str">${e}</i>`;
      else if (num) out += `<i class="k-num">${e}</i>`;
      else if (id) {
        const next = src.slice(re.lastIndex).match(/^\s*(\S)/);
        const cls = CTRL.has(id) ? 'k-ctl' : STOR.has(id) ? 'k-sto' : next && next[1] === '(' ? 'k-fn'
          : /^[A-Z]/.test(id) ? 'k-typ' : prev === '.' ? 'k-prop' : 'k-var';
        out += `<i class="${cls}">${e}</i>`;
      } else if (br) {
        if ('{(['.includes(tok)) { out += `<i style="color:${BR[depth % 3]}">${e}</i>`; depth++; }
        else { depth = Math.max(0, depth - 1); out += `<i style="color:${BR[depth % 3]}">${e}</i>`; }
      } else if (opr) out += `<i class="k-op">${e}</i>`;
      else out += e;
      if (!/^\s+$/.test(tok)) prev = tok;
    }
    return out || '&nbsp;';
  });
}

// ---------- copy + timing (local lt) ----------
const P1 = 'Fix the login redirect bug in acme-web';
const P2 = 'Add rate limiting to /login';
const P3 = 'Ship it';
const R0 = 'I need access to your repo first.';
const R1 = 'Fixed. The redirect read returnTo before the session was saved.';
const CMD = 'pnpm test src/auth';

const T = {};
T.ty1 = 0.3; T.send1 = L.typeEnd(P1, T.ty1, 60) + 0.12;
T.u1 = T.send1;
T.b1 = T.send1 + 0.28;                 // "I need access..." streams
T.card = T.b1 + 0.18;                  // the GitHub connect card grows in
T.curIn = T.card + 0.1;                // pointer arrives
T.curAt1 = T.curIn + 0.5;
T.press1 = T.curAt1 + 0.08;
T.camS = T.press1 + 0.1;               // camera settles on the sheet framing (0.45) BEFORE the sheet enters
T.sheet = T.camS + 0.45;               // authorize sheet slides up (0.42)
T.curAt2 = T.sheet + 0.8;              // pointer drifts onto Authorize during the hold
T.press2 = T.sheet + 0.42 + 1.0;       // ~1.05s settled hold before the click
T.sheetOut = T.press2 + 0.22;          // sheet dissolves (0.3)
T.flip = T.sheetOut + 0.3;             // card swaps to Connected while the camera is still (0.35)
T.camBack = T.flip + 0.36;             // only then the camera returns to the chat (0.45)
T.c1 = T.camBack + 0.12; T.c1d = T.c1 + 0.36;  // Cloning
T.c2 = T.c1d; T.c2d = T.c2 + 0.36;             // Reading src/auth -> found
T.edOpen = T.c2 + 0.2;                          // editor opens (0.35)
T.push1 = T.c2d + 0.15;                         // camera into the editor (0.5)
T.D1 = T.push1 + 0.45;                          // the session.ts diff
T.c3 = T.D1 + 0.55;                             // Running tests (chat side)
T.test = T.D1 + 0.95;                           // terminal: command types, results land
T.c3d = T.test + 0.45;
T.back1 = T.test + 0.62;                        // camera back to the chat (0.45)
T.r1 = T.back1 + 0.2;                           // reply streams @150
T.ty2 = T.r1 + 0.4; T.send2 = L.typeEnd(P2, T.ty2, 80) + 0.12;
T.c4 = T.send2 + 0.28;
T.push2 = T.send2 + 0.32;                       // camera into the editor (0.45)
T.tab2 = T.push2 + 0.12;                        // login.ts tab opens, switch at +0.2
T.D2 = T.push2 + 0.55;                          // 5 added lines, 0.1 apart, 0.28 each
T.c4d = T.D2 + 0.72;
T.back2 = T.D2 + 0.8;                           // camera back (0.45)
T.ty3 = T.back2 + 0.3; T.send3 = L.typeEnd(P3, T.ty3, 80) + 0.12;
T.c5 = T.send3 + 0.25; T.c5d = T.c5 + 0.36;     // Opening pull request
T.pr = T.c5d;                                   // PR card grows (0.4)
T.chk = T.pr + 0.42;                            // checks land 0.1 apart
const DUR = +(T.chk + 0.35 + 1.0).toFixed(2);

// ---------- module state ----------
let S, cur, sec, markA, markB;
const items = [];                      // chat thread items: { w, t, gap }
let chips = {}, r0p, r1p, ghCard, ghBtn, ghOk, prCard, prChecks, veil;
let ed, edEmpty, edProg, edEmptyTx, tabs = {}, crumbs = [], files = [], term = {}, stateEl, lastState = '';
let auth, authDim, authSlot, authSheet, authBtn, authBtnTx;

function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function addItem(el, t, gap) {
  const w = document.createElement('div');
  w.className = 'cd-g';
  w.appendChild(el);
  S.feedIn.appendChild(w);
  const it = { w, el, t, gap };
  items.push(it);
  return it;
}
function botText(text) {
  const b = botBlock(`<p><span class="cd-vis"></span><span class="cd-rest"></span></p>`);
  b.vis = b.querySelector('.cd-vis'); b.rest = b.querySelector('.cd-rest'); b.full = text; b.shown = -1;
  return b;
}
function setStream(b, n) {
  if (n === b.shown) return; b.shown = n;
  b.vis.textContent = b.full.slice(0, n); b.rest.textContent = b.full.slice(n);
}

function buildFile(lines) {
  const hl = highlight(lines);
  const el = h('<div class="cd-file"></div>');
  const rows = lines.map(([k], i) => {
    const r = h(`<div class="cd-ln k${k === '-' ? 'd' : k === '+' ? 'a' : 'c'}"><span class="cd-no"></span><span class="cd-mk">${k === '-' ? '&minus;' : k === '+' ? '+' : ''}</span><span class="cd-tx">${hl[i]}</span></div>`);
    r.kind = k; r.no = r.firstElementChild; r.lastNo = null;
    el.appendChild(r);
    return r;
  });
  el.rows = rows;
  const caret = h('<i class="cd-caret"></i>');
  el.caret = caret;
  return el;
}

export default {
  id: 'code',
  dur: DUR,

  mount(section, ctx) {
    sec = section;
    S = makeShell({ mode: 'code', title: 'acme-web', path: '~/code/acme-web', projects: ['acme-web', 'appling', 'portfolio'],
      active: 0, preview: 'web', previewLabel: 'Editor' });
    section.appendChild(S.root);

    // preview pane -> the editor
    const ph = S.preview.querySelector('.pane-head');
    ph.firstElementChild.outerHTML = ICON.code;
    stateEl = S.previewState;
    S.previewBody.innerHTML = '';
    S.previewBody.classList.add('cd-body');
    edEmpty = h(`<div class="cd-empty"><span class="cd-empty-gh">${GH}</span><b>Connect GitHub to open acme-web</b><span class="cd-prog"><i></i></span></div>`);
    edEmptyTx = edEmpty.querySelector('b'); edProg = edEmpty.querySelector('.cd-prog i');
    ed = h(`<div class="cd-ed">
      <div class="cd-tabs">
        <div class="cd-tab t1"><i class="cd-ts">TS</i><span>session.ts</span><em>&times;</em></div>
        <div class="cd-tab t2"><i class="cd-ts">TS</i><span>login.ts</span><em>&times;</em></div>
        <span class="cd-tabs-fill"></span>
      </div>
      <div class="cd-crumbs">
        <div class="cd-crumb">src <b>&rsaquo;</b> auth <b>&rsaquo;</b> <i class="cd-ts">TS</i> session.ts <b>&rsaquo;</b> <span class="k-fn">completeLogin</span></div>
        <div class="cd-crumb">src <b>&rsaquo;</b> routes <b>&rsaquo;</b> <i class="cd-ts">TS</i> login.ts <b>&rsaquo;</b> <span class="k-var">login</span></div>
      </div>
      <div class="cd-code"></div>
      <div class="cd-term">
        <div class="cd-term-h"><b>TERMINAL</b><span>PROBLEMS</span><span>OUTPUT</span><em>zsh</em></div>
        <div class="cd-term-b">
          <div class="cd-tl l0"><span class="tp">~/code/acme-web</span> <span class="tb">(fix/login-redirect)</span> <span class="td">$</span> <span class="tc"></span></div>
          <div class="cd-tl l1"><span class="tok">&#10003;</span> src/auth/session.test.ts <span class="tm">(12 tests)</span> <span class="tm">184ms</span></div>
          <div class="cd-tl l2"><span class="tm">Tests</span>&nbsp;&nbsp;<b class="tok">12 passed</b> <span class="tm">(12)</span></div>
        </div>
      </div>
    </div>`);
    tabs.t1 = ed.querySelector('.t1'); tabs.t2 = ed.querySelector('.t2');
    crumbs = [...ed.querySelectorAll('.cd-crumb')];
    const code = ed.querySelector('.cd-code');
    files = [buildFile(FILE1), buildFile(FILE2)];
    files.forEach((f) => code.appendChild(f));
    term.l0 = ed.querySelector('.l0'); term.cmd = ed.querySelector('.tc'); term.l1 = ed.querySelector('.l1'); term.l2 = ed.querySelector('.l2');
    S.previewBody.append(edEmpty, ed);

    // chat thread
    const u1 = userBubble(P1), u2 = userBubble(P2), u3 = userBubble(P3);
    addItem(u1, T.u1, 0);
    r0p = botText(R0); addItem(r0p, T.b1, 12);
    ghCard = h(`<div class="cd-gh">
      <div class="cd-gh-face fa"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>GitHub</b><small>Read and push to acme-web</small></span><span class="cd-gh-btn">${GH}<span>Connect GitHub</span></span></div>
      <div class="cd-gh-face fb"><span class="cd-gh-ic">${GH}</span><span class="cd-gh-t"><b>Connected as @devon &middot; acme-web</b><small>acme/acme-web &middot; read and write</small></span><span class="cd-gh-ok">${O_CHECK}<span>Connected</span></span></div>
    </div>`);
    ghBtn = ghCard.querySelector('.cd-gh-btn'); ghOk = ghCard.querySelector('.cd-gh-ok');
    addItem(botBlock('').appendChild(ghCard).parentNode, T.card, 8);
    const mkChip = (k, label, t, gap) => { const c = toolChip(label); chips[k] = c; addItem(botBlock('').appendChild(c).parentNode, t, gap); };
    mkChip('c1', 'Cloning acme/acme-web', T.c1, 12);
    mkChip('c2', 'Reading src/auth', T.c2, 6);
    mkChip('c3', 'Running tests', T.c3, 6);
    r1p = botText(R1); addItem(r1p, T.r1, 8);
    addItem(u2, T.send2, 14);
    mkChip('c4', 'Editing src/routes/login.ts', T.c4, 12);
    addItem(u3, T.send3, 14);
    mkChip('c5', 'Opening pull request', T.c5, 12);
    prCard = h(`<div class="cd-pr">
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
    addItem(botBlock('').appendChild(prCard).parentNode, T.pr, 8);

    // the GitHub authorize sheet (over the window, in window layout px)
    auth = h(`<div class="cd-auth"><div class="cd-dim"></div><div class="cd-slot"><div class="cd-sheet">
      <div class="cd-sh-url">${O_LOCK}<span>github.com/login/oauth/authorize</span></div>
      <div class="cd-sh-body">
        <div class="cd-sh-logos"><span class="cd-sh-app"></span><span class="cd-sh-link"><i></i><i></i><i></i><b>${O_CHECK}</b><i></i><i></i><i></i></span><span class="cd-sh-gh">${GH}</span></div>
        <h3>Authorize Superbot</h3>
        <div class="cd-sh-box">
          <div class="cd-sh-row first"><span class="cd-sh-mini"></span><span><b>Superbot</b> by <b>superbot-gg</b><small>wants to access your <b>@devon</b> account</small></span></div>
          <div class="cd-sh-row">${O_REPO}<span><b>Repositories</b><small>acme/acme-web</small></span><em>Read and write</em></div>
          <div class="cd-sh-row">${O_PR}<span><b>Pull requests</b><small>Open and update</small></span><em>Read and write</em></div>
          <div class="cd-sh-row">${O_MAIL}<span><b>Email addresses</b><small>you@superbot.gg</small></span><em>Read-only</em></div>
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

    veil = h('<div class="cd-veil"></div>');
    S.win.querySelector('.pane.chatp').appendChild(veil);

    cur = makeCursor();
    section.appendChild(cur);
  },

  render(lt, ctx) {
    const W = ctx.W, t = ctx.t;
    S.renderMarks(t); markA.render(t); markB.render(t);

    // ---- composer: three asks ----
    let draft = '', pr = 0;
    const asks = [[P1, T.ty1, 60, T.send1], [P2, T.ty2, 80, T.send2], [P3, T.ty3, 80, T.send3]];
    for (const [p, t0, cps, send] of asks) {
      if (lt >= t0 && lt < send) draft = L.typed(p, t0, cps, lt).text;
      pr = Math.max(pr, L.press(lt, send));
    }
    setComposer(S, draft, { press: pr });

    // ---- thread items grow in (height + fade + small rise), no pops ----
    for (const it of items) {
      const f = seg(lt, it.t, it.t + 0.34);
      if (f <= 0) { it.w.style.display = 'none'; continue; }
      it.w.style.display = '';
      const e = outCubic(f);
      if (f >= 1) { it.w.style.height = ''; it.w.style.opacity = ''; it.el.style.transform = ''; it.w.style.marginTop = it.gap + 'px'; continue; }
      it.w.style.height = (it.el.offsetHeight * e).toFixed(2) + 'px';
      it.w.style.marginTop = (it.gap * e).toFixed(2) + 'px';
      it.w.style.opacity = e.toFixed(3);
      it.el.style.transform = `translateY(${((1 - e) * 8).toFixed(2)}px)`;
    }
    setStream(r0p, L.streamCount(R0, T.b1, 130, lt));
    setStream(r1p, L.streamCount(R1, T.r1, 150, lt));

    // chips
    const chip = (k, on, done, runL, doneL) => setToolState(chips[k], lt >= done ? 'done' : 'run', lt >= done ? doneL : runL, lt - on);
    chip('c1', T.c1, T.c1d, 'Cloning acme/acme-web', 'Cloned acme/acme-web');
    chip('c2', T.c2, T.c2d, 'Reading src/auth', 'Found it in src/auth/session.ts');
    chip('c3', T.c3, T.c3d, 'Running tests', 'Tests passing (12)');
    chip('c4', T.c4, T.c4d, 'Editing src/routes/login.ts', 'Rate limited /login: 5 per minute');
    chip('c5', T.c5, T.c5d, 'Opening pull request', 'Pushed fix/login-redirect');

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

    scrollFeed(S, 0); // thread is bottom-anchored (code.css); older turns clip off the top

    // ---- editor pane ----
    const st = lt < T.c1 ? 'Not connected' : lt < T.edOpen ? 'Cloning' : 'branch';
    if (st !== lastState) {
      lastState = st;
      stateEl.innerHTML = st === 'branch' ? `${O_BRANCH}fix/login-redirect` : L.esc(st);
      stateEl.classList.toggle('cd-br', st === 'branch');
    }
    const cl = seg(lt, T.c1, T.c2d - 0.05);
    edEmptyTx.textContent = lt < T.c1 ? 'Connect GitHub to open acme-web' : 'Cloning acme/acme-web';
    edProg.style.transform = `scaleX(${outCubic(cl).toFixed(3)})`;
    op(edProg.parentNode, seg(lt, T.c1, T.c1 + 0.2));
    const eo = outCubic(seg(lt, T.edOpen, T.edOpen + 0.35));
    op(edEmpty, 1 - eo); op(ed, eo);
    ed.style.transform = `translateY(${((1 - eo) * 10).toFixed(2)}px)`;

    // tabs: login.ts opens beside session.ts, then becomes active; the file crossfades
    const tg = outCubic(seg(lt, T.tab2, T.tab2 + 0.25));
    tabs.t2.style.maxWidth = (tg * 120).toFixed(1) + 'px'; op(tabs.t2, tg);
    const on2 = lt >= T.tab2 + 0.28;                 // hard switch on tab change, like an editor
    tabs.t1.classList.toggle('on', !on2); tabs.t2.classList.toggle('on', on2);
    op(files[0], on2 ? 0 : 1); op(files[1], on2 ? 1 : 0); op(crumbs[0], on2 ? 0 : 1); op(crumbs[1], on2 ? 1 : 0);

    // diff 1: removed lines turn red and collapse, added lines grow in one by one
    renderFile(files[0], lt, {
      del: (i) => ({ red: seg(lt, T.D1, T.D1 + 0.22), gone: inOutCubic(seg(lt, T.D1 + 0.32 + i * 0.06, T.D1 + 0.6 + i * 0.06)) }),
      add: (i) => outCubic(seg(lt, T.D1 + 0.52 + i * 0.16, T.D1 + 0.82 + i * 0.16)),
      caretOn: lt >= T.D1 + 0.98 && lt < T.tab2 + 0.2, lt, reveal: inOutCubic(seg(lt, T.D1 - 0.4, T.D1 - 0.05)),
    });
    renderFile(files[1], lt, {
      del: () => ({ red: 0, gone: 0 }),
      add: (i) => outCubic(seg(lt, T.D2 + i * 0.1, T.D2 + i * 0.1 + 0.28)),
      caretOn: lt >= T.D2 + 0.68, lt, reveal: inOutCubic(seg(lt, T.D2 - 0.35, T.D2)),
    });

    // terminal
    const tt = L.typed(CMD, T.test, 110, lt);
    term.cmd.innerHTML = L.esc(lt >= T.test ? tt.text : '') + ((lt < T.test + 0.3 && L.blink(lt)) || tt.typing ? L.caret() : '');
    const r1 = seg(lt, T.test + 0.28, T.test + 0.5), r2 = seg(lt, T.test + 0.38, T.test + 0.6);
    op(term.l1, outCubic(r1)); op(term.l2, outCubic(r2));
    term.l1.style.transform = `translateY(${((1 - outCubic(r1)) * 5).toFixed(2)}px)`;
    term.l2.style.transform = `translateY(${((1 - outCubic(r2)) * 5).toFixed(2)}px)`;

    // ---- the GitHub authorize sheet ----
    const up = outQuint(seg(lt, T.sheet, T.sheet + 0.42)), dn = inOutCubic(seg(lt, T.sheetOut, T.sheetOut + 0.3));
    const dimIn = inOutCubic(seg(lt, T.camS, T.camS + 0.4));
    auth.style.visibility = dimIn > 0.001 && dn < 1 ? 'visible' : 'hidden';
    op(authDim, 0.62 * dimIn * (1 - dn));
    authSheet.style.transform = `translateY(${((1 - up) * 420).toFixed(2)}px) scale(${(1 - 0.03 * dn).toFixed(4)})`;
    op(authSheet, clamp(up * 3) * (1 - dn));
    const bp = L.press(lt, T.press2);
    authBtn.style.transform = `scale(${(1 - 0.05 * bp).toFixed(4)})`;
    authBtn.classList.toggle('dn', lt >= T.press2 - 0.04);
    authBtnTx.textContent = lt >= T.press2 + 0.04 ? 'Authorizing' : 'Authorize superbot';

    // ---- camera ----
    const cam = camera(lt, W);
    S.root.style.transform = `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.z.toFixed(4)})`;
    op(veil, 0.78 * cam.ed);   // the chat recedes while the editor is framed, so no half-cut lines compete

    // ---- pointer: onto Connect GitHub, then onto Authorize ----
    const toScr = (p) => ({ x: cam.tx + p.x * cam.z, y: cam.ty + p.y * cam.z });
    if (lt >= T.curIn - 0.01 && lt < T.sheetOut + 0.5) {
      const bA = L.boxIn(ghBtn, S.root), bB = L.boxIn(authBtn, S.root);
      const pA = toScr({ x: bA.cx + bA.w * 0.12, y: bA.cy + 2 }), pB = toScr({ x: bB.cx + bB.w * 0.36, y: bB.cy + 4 });
      const start = { x: Math.min(W - 90, pA.x + 360), y: 1040 };
      const p = L.path(lt, [
        { t: T.curIn, ...start }, { t: T.curAt1, ...pA }, { t: T.sheet + 0.2, ...pA },
        { t: T.curAt2, ...pB }, { t: T.sheetOut, ...pB }, { t: T.sheetOut + 0.45, x: pB.x + 90, y: pB.y + 160 },
      ]);
      const v = seg(lt, T.curIn, T.curIn + 0.2) * (1 - seg(lt, T.sheetOut + 0.05, T.sheetOut + 0.4));
      L.placeCursor(cur, p.x, p.y, Math.max(L.press(lt, T.press1), L.press(lt, T.press2)), v);
    } else op(cur, 0);
  },
};

function renderFile(f, lt, o) {
  let n = 0, lastAdd = null;
  let di = 0, ai = 0;
  for (const r of f.rows) {
    let hgt = 1, show = true;
    if (r.kind === '-') {
      const { red, gone } = o.del(di++);
      r.style.setProperty('--red', red.toFixed(3));
      hgt = 1 - gone; show = hgt > 0.5;
      r.style.opacity = (1 - gone).toFixed(3);
    } else if (r.kind === '+') {
      const g = o.add(ai++);
      hgt = g; show = g > 0.5;
      r.style.opacity = g.toFixed(3);
      r.style.setProperty('--grow', g.toFixed(3));
      if (g > 0) lastAdd = r;
    }
    r.style.height = (16 * hgt).toFixed(2) + 'px';
    r.style.display = hgt <= 0.001 ? 'none' : '';
    const label = show ? String(++n) : '';
    if (label !== r.lastNo) { r.lastNo = label; r.no.textContent = label; }
    r.classList.toggle('cur', r === lastAdd && o.caretOn);
  }
  // caret at the end of the last added line (blinks, deterministic)
  if (lastAdd && o.caretOn) {
    const tx = lastAdd.lastElementChild;
    if (f.caret.parentNode !== tx) tx.appendChild(f.caret);
    f.caret.style.opacity = L.blink(o.lt) ? '1' : '0';
  } else if (f.caret.parentNode) f.caret.remove();
  // "reveal line": when the editor is short (stacked 1x1 / 4x5 layouts) scroll the hunk into view, like an editor
  // following an edit. At 16x9 the whole file fits, so this resolves to 0.
  const first = f.rows.findIndex((r) => r.kind !== ' ');
  const finalRows = f.rows.filter((r) => r.kind !== '-').length;
  const maxS = Math.max(0, finalRows * 16 + 6 - f.parentNode.clientHeight);
  const want = clamp(first * 16 - 40, 0, maxS) * (o.reveal || 0);
  f.style.transform = want > 0.01 ? `translateY(${(-want).toFixed(2)}px)` : '';
}

// ---------- camera: named framings, every move inOutCubic, never past the window's edges ----------
// Chat framings are FIXED per beat (bottom-aligned on the composer, centred on the chat column), so the camera
// only ever moves in the explicit moves below, never by following content as it grows.
const CHAT_Z = { chat1: 1.9, chat2: 1.5, chat3: 1.45, chat5: 1.7 };
function frame(name, W) {
  const R = S.root;
  if (name in CHAT_Z) {
    const cp = L.boxIn(S.win.querySelector('.pane.chatp'), R);
    const z = clamp(Math.min(CHAT_Z[name], (0.64 * W) / cp.w), 1, 2);
    return { fx: cp.x + cp.w / 2, fy: cp.y + cp.h + 14 - 540 / z, z };
  }
  if (name === 'sheet') {
    const b = L.boxIn(authSlot, R);            // the static slot: measurable before the sheet enters
    const z = clamp(Math.min((0.58 * 1080) / b.h, (0.7 * W) / b.w), 1, 1.6);
    return { fx: b.cx, fy: b.cy, z };
  }
  if (name === 'ed' || name === 'term') {
    const b = L.boxIn(S.previewBody, R);
    const z = clamp((0.97 * W) / b.w, 1, name === 'ed' ? 1.6 : 1.45);
    const fy = name === 'ed' ? b.y - 60 + 540 / z : b.y + b.h + 14 - 540 / z;
    return { fx: b.x + b.w / 2, fy, z };
  }
  return { fx: W / 2, fy: 540, z: 1 };
}
function fit(f, W) {
  const tx = clamp(W / 2 - f.fx * f.z, W - W * f.z, 0), ty = clamp(540 - f.fy * f.z, 1080 - 1080 * f.z, 0);
  return { fx: (W / 2 - tx) / f.z, fy: (540 - ty) / f.z, z: f.z };
}
const isEd = (n) => (n === 'ed' || n === 'term' ? 1 : 0);
function camera(lt, W) {
  const moves = [
    [T.ty1 - 0.1, 0.8, 'chat1'], [T.camS, 0.45, 'sheet'], [T.camBack, 0.45, 'chat2'],
    [T.push1, 0.5, 'term'], [T.back1, 0.45, 'chat3'],
    [T.push2, 0.45, 'ed'], [T.back2, 0.5, 'chat5'],
  ];
  let k = -1;
  while (k + 1 < moves.length && lt >= moves[k + 1][0]) k++;
  let c, ed = 0;
  if (k < 0) c = fit(frame('full', W), W);
  else {
    const [t0, d, nm] = moves[k];
    const f = inOutCubic(seg(lt, t0, t0 + d));
    const prev = k ? moves[k - 1][2] : 'full';
    const to = fit(frame(nm, W), W);
    ed = lerp(isEd(prev), isEd(nm), f);
    if (f >= 1) c = to;
    else {
      const from = fit(frame(prev, W), W);
      c = { fx: lerp(from.fx, to.fx, f), fy: lerp(from.fy, to.fy, f), z: lerp(from.z, to.z, f) };
    }
  }
  const z = c.z;
  const tx = clamp(W / 2 - c.fx * z, W - W * z, 0), ty = clamp(540 - c.fy * z, 1080 - 1080 * z, 0);
  return { tx, ty, z, ed };
}
