// Luau beat: Claude Opus 5.5 writes the save fix and its Jest Lua test, in the sibling's code-panel grammar (diff.js):
// a header with the branch fix/save-session-lock, the repo chip and a status ("Working", then a check and "Done"; no
// clock), the file tabs (DataManager.luau active, then DataManager.spec.luau), and an editor body with a
// unified-diff gutter: removed lines tinted red with "-", added lines tinted green with "+", hunk headers muted.
// DataManager.luau: `--!strict` on line 1, then the buggy load (old lines 57-58: a pcall'd GetAsync and the
// `table.clone(DEFAULT_DATA)` fallback that Gemini flagged at :58) gives way to a load that retries with
// `task.wait(2 ^ attempt)`, kicks the player with a plain message when every attempt fails and never saves a profile
// that did not load; then the save (old :91, SetAsync) gives way to `store:UpdateAsync(key, function(old, info:
// DataStoreKeyInfo) ... end)` with a session lock (a save locked by another server's game.JobId returns nil, which
// cancels the write: create.roblox.com/docs/reference/engine/classes/GlobalDataStore#UpdateAsync). The tab then
// switches to DataManager.spec.luau, a new Jest Lua spec (jsdotlua/jest-lua: JestGlobals.describe / it / expect,
// expect(x).toBe(y)). The body is an editor window of VIS lines that follows the caret down (a pure function of the
// stream position, so it never measures layout). The review bar counts the files ("Writing 1 of 2") and lands on
// "+41 -7 in 2 files, failed-load test added" with the green check. No Review / Commit buttons (policy: no fake
// tappable controls). In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS).
import { seg, outCubic } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=dfb32441';

const SAY = 'Made the load retry, locked each save to one server, and added a failed-load test.';
const BRANCH = 'fix/save-session-lock';
const REPO = 'lantern-bay-tycoon';
// the two files: [tab, [kind, line number, code]] with kind ' ' context, '-' removed, '+' added, '@' hunk header
const FILES = [
  ['DataManager.luau', [
    [' ', 1, '--!strict'],
    ['@', '', '@@ -56,3 +56,11 @@'],
    [' ', 56, '  local key = "player_" .. player.UserId'],
    ['-', 57, '  local ok, data = pcall(store.GetAsync, store, key)'],
    ['-', 58, '  if not ok then data = table.clone(DEFAULT_DATA) end'],
    ['+', 57, '  local ok: boolean, data: any = false, nil'],
    ['+', 58, '  for attempt = 1, MAX_ATTEMPTS do'],
    ['+', 59, '    ok, data = pcall(store.GetAsync, store, key)'],
    ['+', 60, '    if ok then break end'],
    ['+', 61, '    task.wait(2 ^ attempt)'],
    ['+', 62, '  end'],
    ['+', 63, '  if not ok then'],
    ['+', 64, '    player:Kick("Your save did not load. Please rejoin.")'],
    ['+', 65, '    return nil -- never save a profile that did not load'],
    ['+', 66, '  end'],
    ['@', '', '@@ -91,1 +99,6 @@'],
    ['-', 91, '  store:SetAsync(key, profile.data)'],
    ['+', 99, '  store:UpdateAsync(key, function(old, info: DataStoreKeyInfo)'],
    ['+', 100, '    if old and old.lockedBy ~= game.JobId then'],
    ['+', 101, '      return nil -- another server holds this save'],
    ['+', 102, '    end'],
    ['+', 103, '    return profile.data'],
    ['+', 104, '  end)'],
  ]],
  ['DataManager.spec.luau', [
    ['+', 1, '--!strict'],
    ['+', 2, 'local DevPackages = game.ReplicatedStorage.DevPackages'],
    ['+', 3, 'local JestGlobals = require(DevPackages.JestGlobals)'],
    ['+', 4, 'local describe, it = JestGlobals.describe, JestGlobals.it'],
    ['+', 5, 'local expect = JestGlobals.expect'],
    ['+', 6, 'local DataManager = require(script.Parent.DataManager)'],
    ['+', 7, ''],
    ['+', 8, 'describe("DataManager", function()'],
    ['+', 9, '  it("never saves over real data when a load fails", function()'],
    ['+', 10, '    local store = DataManager.testStore({ failedLoads = 3 })'],
    ['+', 11, '    store.saved.player_1 = { coins = 500 }'],
    ['+', 12, '    DataManager.join(1, store)'],
    ['+', 13, '    expect(store.saved.player_1.coins).toBe(500)'],
    ['+', 14, '  end)'],
    ['+', 15, 'end)'],
  ]],
];
const DONE = '+41 -7 in 2 files, failed-load test added';
const VIS = 11;          // the editor window, in lines
const LH = 19;           // one line (luau.css .df-l height)

// timing (seconds from the reply start, or from the panel where noted): the sibling's code beat, with the two
// longer streams given the time they need to be read while the camera holds
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first added character lands
const WRITE_A = 1.3; /* deliberate */  // the fix's sixteen added lines streaming in
const TAB_AT = 0.2;      // the fix written, then the tab switches to the test
const TAB_IN = 0.12;     // the test file's body fading up
const WRITE_B = 1.0; /* deliberate */  // the test streaming in (read while the camera holds)
const REST_AT = 0.06;    // the test written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.5; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light Luau highlighter in the panel's syntax colours (luau.css): one span per character, so a partly streamed
// line keeps each character's final colour
const KW = new Set(['local', 'function', 'if', 'then', 'else', 'end', 'for', 'do', 'return', 'not', 'and', 'or', 'nil', 'true', 'false', 'break']);
function charsOf(code, kind) {
  if (kind === '@') return [...code].map((ch) => `<i class="hk">${esc(ch)}</i>`);
  const toks = code.match(/--.*$|"[^"]*"|\d[\d_]*|[A-Za-z_][\w]*|\s+|./g) || [];
  return toks.flatMap((tk, j) => {
    let c = '';
    if (tk.startsWith('--')) c = 'cm';
    else if (tk[0] === '"') c = 'st';
    else if (/^\d/.test(tk) || /^[A-Z][A-Z0-9_]+$/.test(tk)) c = 'cn';
    else if (KW.has(tk)) c = 'kw';
    else if (/^[A-Za-z_]/.test(tk) && toks[j + 1] === '(') c = 'fn';
    return [...tk].map((ch) => (c ? `<i class="${c}">${esc(ch)}</i>` : esc(ch)));
  });
}
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// per file: the streamed (added) lines' start offsets in that file's stream, and its stream length. Context, removed
// and hunk-header lines are there from the start; only the added lines stream.
const STREAMS = FILES.map(([, lines]) => {
  let acc = 0;
  const starts = lines.map(([kind, , code]) => { if (kind !== '+') return -1; const s = acc; acc += code.length + 1; return s; });
  return { starts, total: acc - 1 };
});
// the editor window's scroll (in lines) at stream position c: the caret's row, fractional, kept two lines above the
// window's bottom edge; never past the last line
function scrollOf(f, c) {
  const S = STREAMS[f], lines = FILES[f][1];
  const n = lines.length;
  if (n <= VIS) return 0;
  let pos = 0;
  for (let i = 0; i < n; i++) {
    if (S.starts[i] < 0) continue;
    const len = lines[i][2].length + 1;
    if (c >= S.starts[i]) pos = i + Math.min(1, (c - S.starts[i]) / len);
  }
  return Math.max(0, Math.min(n - VIS, pos - (VIS - 2)));
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.n0 = T.b1 + REST_AT;
    T.done = T.n0 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + POP + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const sign = (kind) => (kind === '-' ? '-' : kind === '+' ? '+' : '');
    const cls = (kind) => (kind === '+' ? ' df-add' : kind === '-' ? ' df-del' : kind === '@' ? ' df-hunk' : '');
    const body = (lines, f) => `<div class="em-bd df-bd" data-f="${f}"><div class="df-scr">${lines.map(([kind, no]) => `<div class="em-l df-l${cls(kind)}"><u>${no}</u><s>${sign(kind)}</s><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div></div>`;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${lc('git-branch', 'em-ico')}<b>${BRANCH}</b></span><span class="em-br">${REPO}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span></em>
      </div>
      <div class="em-tabs">${FILES.map(([f], i) => `<span class="em-tab${i === 0 ? ' on' : ''}">${lc('file-code', 'em-fi')}${f}</span>`).join('')}</div>
      <div class="df-bds">${FILES.map(([, lines], f) => body(lines, f)).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${FILES.length}</span></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.em-tab')];
    const bodies = [...card.querySelectorAll('.df-bd')];
    const scrs = bodies.map((b) => b.querySelector('.df-scr'));
    const files = FILES.map(([, lines], f) => ({
      rows: [...bodies[f].querySelectorAll('.em-l')].map((n, i) => ({
        n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), chars: charsOf(lines[i][2], lines[i][0]), kind: lines[i][0], shown: -1, caret: null,
      })),
      scroll: '',
    }));
    const state = $('.em-state'), stateL = $('.em-sl'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft');
    let said = -1, onTab = -1;

    // one file's stream at character count c: added lines fill in order, the caret riding the last character; the
    // window follows the caret
    const stream = (f, c, writing, started) => {
      const S = STREAMS[f];
      files[f].rows.forEach((o, i) => {
        let k2, on = false;
        if (o.kind !== '+') { k2 = o.chars.length; }
        else {
          const st = S.starts[i];
          k2 = Math.max(0, Math.min(o.chars.length, c - st));
          const next = S.starts.slice(i + 1).find((v) => v >= 0);
          on = writing && c >= st && (next === undefined || c < next);
        }
        if (k2 !== o.shown) { o.v.innerHTML = o.chars.slice(0, k2).join(''); o.shown = k2; }
        // an added line shows its gutter once its first character is due (the first one as soon as writing starts)
        const visible = o.kind !== '+' || c > S.starts[i] || (started && S.starts[i] === 0) || c >= S.total;
        o.n.style.visibility = visible ? '' : 'hidden';
        if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
      });
      const sc = `translateY(${(-scrollOf(f, c) * LH).toFixed(2)}px)`;
      if (sc !== files[f].scroll) { scrs[f].style.transform = sc; files[f].scroll = sc; }
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the tab: DataManager.luau until the switch, then DataManager.spec.luau (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((n, i) => { n.style.display = i === tab ? '' : 'none'; });
          onTab = tab;
        }
        bodies[1].style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(0, Math.round(STREAMS[0].total * seg(t, T.a0, T.a1)), t >= T.a0 && t < T.a1 + 0.2, t >= T.a0);
        stream(1, Math.round(STREAMS[1].total * seg(t, T.b0, T.b1)), t >= T.b0 && t < T.b1 + 0.3, t >= T.b0);

        // header: the beat's own elapsed whole seconds from r
        // no clock (policy: no timers, no time-bound claims): Working, then Done
        setText(stateL, d ? 'Done' : 'Working');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the file being written (1 of 2, 2 of 2), then the summary
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${tab + 1} of ${FILES.length}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
      },
    };
  },
};
