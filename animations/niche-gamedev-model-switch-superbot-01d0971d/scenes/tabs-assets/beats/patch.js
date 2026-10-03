// Patch beat: Claude Opus 5.5 writes the fix and its test, in the github sibling's code-panel grammar (Cursor's agent
// panel, via bikeride-model-switch's code beat): a header with the branch fix/jump-buffer, the project chip and a
// state that reads "Working" with a spinner, then a check and "Done" (no clock: the spot shows no timers), the file
// tabs (player.gd active, then test_player.gd), and an editor body with a unified-diff gutter: the removed line tinted
// red with "-", the added lines tinted green with "+" (Primer's diff colours, chat.css --gh-diff-*). player.gd lands
// with its context and the removed line (line 42, the line Gemini named), the jump buffer and coyote time stream in
// behind a caret; then the tab switches to test_player.gd (a new GUT test, every line "+") and the test streams. The
// review bar counts the files ("Writing 1 of 2") and lands on "+24 -1 in 2 files, landing jump test added" with the
// green check. The code is valid Godot 4 GDScript (CharacterBody2D: get_gravity(), Input.is_action_just_pressed,
// the inline if/else expression) and the test uses GUT 9's own API (GutTest, add_child_autofree, await
// wait_physics_frames(n), assert_lt; checked against bitwes/Gut main, addons/gut/test.gd, GUT 9.6.1) plus Godot's
// Input.action_press / action_release. The counts are never smaller than what is visible: player.gd adds 7 visible
// lines plus 4 declarations above the hunk (2 consts, 2 vars), the test file is 13 new lines (9 visible: lines 1-4
// are extends GutTest, a blank, const Ledge = preload("res://test/scenes/ledge.tscn") and a blank). In the zoom
// cut the camera pushes in on the panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is
// written from t; line heights are constants, so the stream never measures layout.
import { seg, outCubic } from '../../../lib.js';
import { oct } from './glyphs.js?v=01d0971d';

const SAY = 'Added a jump buffer and coyote time, plus a landing test.';
const BRANCH = 'fix/jump-buffer';
const REPO = 'pocket-summit';
// the two files: [tab, [kind, line number, code]] with kind ' ' context, '-' removed, '+' added; tabs are GDScript's
const FILES = [
  ['player.gd', [
    [' ', 40, '\tif not is_on_floor():'],
    [' ', 41, '\t\tvelocity += get_gravity() * delta'],
    ['-', 42, '\tif Input.is_action_just_pressed("jump") and is_on_floor():'],
    ['+', 42, '\tif Input.is_action_just_pressed("jump"):'],
    ['+', 43, '\t\tbuffer_left = JUMP_BUFFER_TIME'],
    ['+', 44, '\tbuffer_left -= delta'],
    ['+', 45, '\tcoyote_left = COYOTE_TIME if is_on_floor() else coyote_left - delta'],
    ['+', 46, '\tif buffer_left > 0.0 and coyote_left > 0.0:'],
    ['+', 47, '\t\tbuffer_left = 0.0'],
    ['+', 48, '\t\tcoyote_left = 0.0'],
    [' ', 49, '\t\tvelocity.y = JUMP_VELOCITY'],
  ]],
  ['test_player.gd', [
    ['+', 5, 'func test_jump_pressed_just_before_landing():'],
    ['+', 6, '\tvar ledge = add_child_autofree(Ledge.instantiate())'],
    ['+', 7, '\tvar player = ledge.get_node("Player")'],
    ['+', 8, '\tawait wait_physics_frames(12)'],
    ['+', 9, '\tInput.action_press("jump")'],
    ['+', 10, '\tawait wait_physics_frames(4)'],
    ['+', 11, '\tInput.action_release("jump")'],
    ['+', 12, '\tawait wait_physics_frames(6)'],
    ['+', 13, '\tassert_lt(player.velocity.y, 0.0, "buffered jump fired on landing")'],
  ]],
];
const DONE = '+24 -1 in 2 files, landing jump test added';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first added character lands
const WRITE_A = 0.7; /* deliberate */ // the fix's seven added lines streaming in
const TAB_AT = 0.16;     // the fix written, then the tab switches to the test
const TAB_IN = 0.12;     // the test file's body fading up
const WRITE_B = 0.85; /* deliberate */ // the test streaming in (read while the camera holds)
const REST_AT = 0.06;    // the test written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Commit pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light GDScript highlighter in GitHub's dark syntax colours (chat.css --gh-syn-*): one span per character, so a
// partly streamed line keeps each character's final colour
const KW = new Set(['func', 'if', 'else', 'and', 'or', 'not', 'var', 'const', 'await', 'return', 'extends', 'true', 'false']);
function charsOf(code) {
  const toks = code.match(/#.*$|"[^"]*"|\d[\d_.]*|[A-Za-z_][\w]*|\s+|./g) || [];
  return toks.flatMap((tk, j) => {
    let c = '';
    if (tk.startsWith('#')) c = 'cm';
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

// per file: the streamed (added) lines' start offsets in that file's stream, and its stream length. In player.gd the
// context and the removed line are there from the start; only the added lines stream.
const STREAMS = FILES.map(([, lines]) => {
  let acc = 0;
  const starts = lines.map(([kind, , code]) => { if (kind !== '+') return -1; const s = acc; acc += code.length + 1; return s; });
  return { starts, total: acc - 1 };
});

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
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const body = (lines, f) => `<div class="em-bd df-bd" data-f="${f}">${lines.map(([kind, no]) => `<div class="em-l df-l${kind === '+' ? ' df-add' : kind === '-' ? ' df-del' : ''}"><u>${no}</u><s>${kind === ' ' ? '' : kind === '-' ? '-' : '+'}</s><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>`;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${oct('git-branch', 'em-ico')}<b>${BRANCH}</b></span><span class="em-br">${REPO}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span></em>
      </div>
      <div class="em-tabs">${FILES.map(([f], i) => `<span class="em-tab${i === 0 ? ' on' : ''}"><b class="em-fi">GD</b>${f}</span>`).join('')}</div>
      <div class="df-bds">${FILES.map(([, lines], f) => body(lines, f)).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${FILES.length}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Commit</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.em-tab')];
    const bodies = [...card.querySelectorAll('.df-bd')];
    const files = FILES.map(([, lines], f) => ({
      rows: [...bodies[f].querySelectorAll('.em-l')].map((n, i) => ({
        n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), chars: charsOf(lines[i][2]), kind: lines[i][0], shown: -1, caret: null,
      })),
    }));
    const state = $('.em-state'), stateL = $('.em-sl'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri');
    let said = -1, onTab = -1;

    // one file's stream at character count c: added lines fill in order, the caret riding the last character
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

        // the tab: player.gd until the switch, then test_player.gd (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((n, i) => { n.style.display = i === tab ? '' : 'none'; });
          onTab = tab;
        }
        bodies[1].style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(0, Math.round(STREAMS[0].total * seg(t, T.a0, T.a1)), t >= T.a0 && t < T.a1 + 0.2, t >= T.a0);
        stream(1, Math.round(STREAMS[1].total * seg(t, T.b0, T.b1)), t >= T.b0 && t < T.b1 + 0.3, t >= T.b0);

        // header: Working while it writes, Done once the summary lands (no clock)
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
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
