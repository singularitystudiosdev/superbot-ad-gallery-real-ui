// Code beat: Claude Opus 5.5 writes the community's moderation, as a sped-up replay of an agent run in the grammar of
// Cursor's agent panel (ported from make-minecraft-every-model's beats/opus-code.js, via the e13744a9 source ad): a
// "Thought" and a "Read" tool row, file-edit cards whose green diff hunks stream past with line numbers (rules.md, then
// the star, automod.yaml: three AutoModerator rules in Reddit's documented syntax,
// https://www.reddit.com/wiki/automoderator/full-documentation), a collapsed edit row (welcome.md), a terminal block
// that dry-runs the rules against 20 sample posts, and the review bar "3 files changed +N -0" with Undo all /
// Accept all / Review. The transcript is bottom-anchored inside a fixed viewport, so every item that lands pushes the
// run up the way the real panel autoscrolls.
// Every number on screen is counted from the sources below, never typed: a card's +N is the lines it has streamed,
// an edit row's +N is the line count of that file's source, the review bar sums them, and the dry run's removed /
// reminded / approved counts are the three rules actually applied to the SAMPLE posts below.
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else (no Math.random, no layout reads). Item heights are constants in --u units, so the stacking
// is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the rules, the welcome post and AutoModerator, and tested them on 20 posts.';
const REPO_NAME = 'northside-sourdough';

// ---- the files. automod.yaml is the star: three rules, valid AutoModerator YAML (checked against the full
// documentation: type, a joined title+body search with the includes modifier, action / action_reason, a multi-line
// comment, comment_stickied, and the author sub-group's account_age with a unit). The two long comment lines are
// folded inside their | block scalars so they fit the panel; Reddit's markdown renders a single line break inside a
// paragraph as a space, so the posted comments read exactly as one line each. ----
const AUTOMOD = `# Rule 4: no selling starter
type: submission
title+body (includes): ["selling starter", "starter for sale", "dm to buy"]
action: remove
action_reason: "Rule 4: selling starter"
comment: |
    Thanks for posting! Selling starter isn't allowed here (rule 4).
    Bring some to a meetup instead.
---
# Rule 3: recipe in the comments
type: submission
flair_text: ["Bake", "Crumb shot"]
comment: |
    Looks great! Rule 3: drop your recipe in the comments
    so the club can bake it too.
comment_stickied: true
---
# Brand-new accounts wait for a mod
author:
    account_age: "< 1 days"
action: filter
action_reason: "New account"`;
const RULES_MD = `# r/NorthsideSourdough rules

1. **Be kind to beginners.** Everyone's first loaf was flat.
2. **Show your crumb.** Bakes need a crumb shot.
3. **Recipe in the comments.** So the club can bake it too.
4. **No selling starter.** Share it at a meetup instead.
5. **Flair every post.** Bake, Crumb shot, Starter help,
   Recipe or Meetup.`;
// ---- the file that lands as a collapsed edit row: never shown, but its +N is its real line count ----
const WELCOME_MD = `# Welcome to r/NorthsideSourdough, start here

This is the online home of the Northside Sourdough Club.
Post your bakes, your crumb shots and your starter questions.

**Before you post**
- Read the rules in the sidebar.
- Pick a flair: Bake, Crumb shot, Starter help, Recipe or Meetup.
- Bakes and crumb shots need the recipe in the comments.

**Meetups** are every second Sunday. Bring a jar of starter to share.

Happy baking!`;

// ---- the dry run: the three rules above, applied to 20 sample posts (made up for the spot). A post is removed when
// its title or body includes one of rule 4's phrases (case-insensitive, AutoModerator's includes modifier), reminded
// when its flair is Bake or Crumb shot (rule 3), filtered when its author's account is under a day old, and approved
// otherwise. Every sample author here is older than a day, so nothing is filtered. ----
const SAMPLE = [
  ['Starter for sale, DM to buy', 'Starter help'],
  ['First loaf, why is it so dense?', 'Starter help'],
  ['Crumb shot, 78% hydration', 'Crumb shot'],
  ['Selling starter, five dollars a jar', 'Meetup'],
  ['Starter not rising after 5 days', 'Starter help'],
  ['Saturday bake, rye and honey', 'Bake'],
  ['Bake swap this Sunday', 'Meetup'],
  ['Cold retard overnight, worth it?', 'Starter help'],
  ['Open crumb at last', 'Crumb shot'],
  ['Recipe: 70% whole wheat boule', 'Recipe'],
  ['Where do you buy rye flour?', 'Starter help'],
  ['Who is coming to the market meetup?', 'Meetup'],
  ['My first ear!', 'Bake'],
  ['Hooch on top of my starter', 'Starter help'],
  ['Focaccia with discard', 'Recipe'],
  ['Banneton or bowl?', 'Starter help'],
  ['Spelt sandwich loaf', 'Recipe'],
  ['How warm is your kitchen?', 'Starter help'],
  ['Picnic at the park, bring bread', 'Meetup'],
  ['Discard crackers', 'Recipe'],
];
const SELL = ['selling starter', 'starter for sale', 'dm to buy'];
const REMIND = ['Bake', 'Crumb shot'];
const verdict = ([title, flair]) => (SELL.some((w) => title.toLowerCase().includes(w)) ? 'removed' : REMIND.includes(flair) ? 'reminded' : 'approved');
const RESULTS = SAMPLE.map((p) => [p[0], verdict(p)]);
const count = (v) => RESULTS.filter(([, r]) => r === v).length;
const CHECKED = `Checked against ${SAMPLE.length} sample posts: ${count('removed')} removed, ${count('reminded')} reminded, ${count('approved')} approved`;
const shown = (v) => RESULTS.find(([, r]) => r === v)[0];

const lineCount = (src) => src.split('\n').length;

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: 'AutoModerator full documentation' },
  { k: 'card', f: 'rules.md', src: RULES_MD },
  { k: 'star', f: 'automod.yaml', src: AUTOMOD },
  { k: 'edit', f: 'welcome.md', src: WELCOME_MD },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  { k: 'term', cmd: `dry run on ${SAMPLE.length} sample posts` },
];
SCRIPT.forEach((s) => { if (s.src) s.n = lineCount(s.src); });
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, f) => a + f.n, 0);
const PASSED = `${SAMPLE.length} checked`;
const NRULES = AUTOMOD.split('\n---\n').length;
const TESTS = [
  ['', `Applying ${NRULES} AutoModerator rules to ${SAMPLE.length} sample posts`],
  ['', ''],
  ['rm', shown('removed'), 'removed'],
  ['rem', shown('reminded'), 'reminded'],
  ['ok', shown('approved'), 'approved'],
  ['', ''],
  ['sum', CHECKED],
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (0.8x v2). The star (automod.yaml) streams slower than a plain card, so its rules read while the camera holds.
const DUR = { row: 0.08, edit: 0.08, card: 0.4, star: 0.8, term: 0.36 };
const STEP = { row: 0.072, edit: 0.08, card: 0.36, star: 0.76, term: 0.36 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (v2 85)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the tests pass, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Accept all pulses once
const HOLD_DONE = 0.36; /* deliberate */ // done: the review bar reads, pushed in, before the camera pulls back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units (1px at narrow columns, a bit more on wide ones); GAP sits inside each item's slot
const BODY = 7, LH = 17; // a code/terminal body shows 7 lines of 17; the star shows STAR_BODY
const STAR_BODY = 11;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, star: 32 + STAR_BODY * LH + 12, term: 32 + BODY * LH + 12 };
const bodyOf = (k) => (k === 'star' ? STAR_BODY : BODY);
const GAP = 6;

// ---- a small highlighter per file type, run once at build ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls, s) => `<i class="${cls}">${esc(s)}</i>`;
// YAML: comments, the --- separator, keys (with their search modifiers), quoted strings, numbers and booleans, the
// block-scalar pipe; the folded lines inside a block scalar read as text
function hlYaml(line) {
  if (/^\s*#/.test(line)) return span('c', line);
  if (line === '---') return span('dim', line);
  const m = line.match(/^(\s*)([\w+]+(?: \([\w, -]+\))?)(:)(.*)$/);
  if (!m) return esc(line);
  const [, ind, key, colon, rest] = m;
  const val = rest.replace(/("[^"]*")|(\|)|(\btrue\b|\bfalse\b)|(\b\d+\b)|([^"|]+)/g, (t, str, pipe, bool, num) =>
    (str ? span('s', str) : pipe ? span('k', pipe) : bool ? span('n', bool) : num ? span('n', num) : esc(t)));
  const kh = key.replace(/^([\w+]+)(.*)$/, (_, k, mod) => span('p', k) + (mod ? span('t', mod) : ''));
  return esc(ind) + kh + esc(colon) + val;
}
// Markdown: headings, list numbers and bullets, bold runs
function hlMd(line) {
  if (/^#/.test(line)) return span('k', line);
  return esc(line)
    .replace(/^(\s*)(\d+\.|-)( )/, (_, a, n, b) => `${a}<i class="n">${n}</i>${b}`)
    .replace(/\*\*([^*]+)\*\*/g, (_, x) => `<i class="f">**${x}**</i>`);
}
const hl = (f, line) => (f.endsWith('.yaml') ? hlYaml(line) : hlMd(line));

// Primer octicons (github.com/primer/octicons, MIT) and the panel's glyphs, as in the reference's kit.js
const oct = (d) => `<svg class="oct" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z');
const TICK = '<svg class="code-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TERM = '<svg class="code-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
const CHEV = '<svg class="code-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';

const ext = (f) => f.slice(f.lastIndexOf('.') + 1);
const fileIco = (f) => `<b class="code-fi ${ext(f)}">${ext(f) === 'yaml' ? 'YML' : 'MD'}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="code-add">+${n}</span><span class="code-del">-0</span>`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="code-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="code-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card' || s.k === 'star') {
    const lines = s.src.split('\n');
    return `<div class="code-card${s.k === 'star' ? ' code-star' : ''}">
      <div class="code-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(0)}</em></div>
      <div class="code-bd"><div class="code-lines">${lines.map((l, i) => `<div class="code-l"><u>${i + 1}</u><code>${hl(s.f, l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block
  // the dry run: one sample post per verdict, then the tally with its green check
  const tl = TESTS.map(([kind, a, b]) => {
    if (kind === 'rm' || kind === 'rem' || kind === 'ok') return `<div class="code-l"><code><i class="${kind === 'ok' ? 'ok' : kind}">${b.padEnd(9)}</i> <i class="dim">"</i>${esc(a)}<i class="dim">"</i></code></div>`;
    if (kind === 'sum') return `<div class="code-l code-sumln"><code>${TICK}<i class="ok">${esc(a)}</i></code></div>`;
    return `<div class="code-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="code-term">
    <div class="code-ch">${TERM}<b class="code-tv">Running</b><span class="code-cmd">${esc(s.cmd)}</span><em class="code-tst"><i class="code-spin"></i><span></span></em></div>
    <div class="code-bd"><div class="code-lines">${tl}</div></div>
  </div>`;
}

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
function rise(n, p, dy) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    let at = T.card + FIRST;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] }; at += STEP[s.k]; return o; });
    T.done = T.items[T.items.length - 1].b + SETTLE; // the tests pass: review bar live, Worked for
    // zoom cut only (chat.js passes opts.zoom; nozoom has no camera move): the camera (scenes/tabs.js, via chat.js
    // FOCUS) pushes in on the panel once it is up, holds through the run, and pulls back to rest after done
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    // chat.js cues the next beat ("Press play.") from done, not from end: the settle (and the zoom cut's pull-back)
    // overlaps it
    T.next = T.done;
    // the beat's last visible change: the camera back at rest in the zoom cut; the panel itself settles at done + PULSE
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="code-x">
      <div class="code-hd">
        <span class="code-repo">${REPO}<b>${REPO_NAME}</b></span><span class="code-br">${O_BRANCH}main</span>
        <em class="code-state"><i class="code-spin"></i>${TICK}<span class="code-sl">Working</span><span class="code-clk">0s</span></em>
      </div>
      <div class="code-vp"><div class="code-stk">${SCRIPT.map((s) => `<div class="code-it">${itemHTML(s)}</div>`).join('')}<div class="code-sp"></div></div></div>
      <div class="code-ft">
        <span class="code-sum">${CHEV}<b class="code-nf">0 files</b><span class="code-add">+0</span><span class="code-del">-0</span></span>
        <span class="code-btns"><i class="code-b">Undo all</i><i class="code-b code-pri">Accept all</i><i class="code-b">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (as the reference): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('code-wide', w >= 760); card.classList.toggle('code-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.code-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'star' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.code-l')];
        o.box = n.querySelector('.code-lines');
        o.shown = -1;
      }
      if (s.k === 'card' || s.k === 'star') o.add = n.querySelector('.code-ch .code-add');
      if (s.k === 'term') { o.tv = n.querySelector('.code-tv'); o.tst = n.querySelector('.code-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.code-state'), stateL = $('.code-sl'), clk = $('.code-clk'), spin = $('.code-hd .code-spin'), stTk = state.querySelector('.code-tk');
    const nf = $('.code-nf'), fAdd = $('.code-ft .code-add'), ft = $('.code-ft'), pri = $('.code-pri');
    let said = -1;

    // lines streamed so far in a card/terminal body: a slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'star' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it also scrolls its 6-unit top padding away, so no sliver of a line peeks under the header
            const over = Math.max(0, nf2 - bodyOf(s.k));
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.k === 'card' || s.k === 'star') {
              // the header counts the lines that have actually streamed
              setText(o.add, `+${shown}`);
              lines += shown; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? PASSED : '');
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: an honest clock, this beat's own elapsed whole seconds from r: "Working 2s" with a spinner, then a
        // check and "Worked for 3s" (the whole seconds from r to done)
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${d ? TOTAL : lines}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('code-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
