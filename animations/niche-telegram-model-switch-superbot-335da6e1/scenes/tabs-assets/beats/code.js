// Code beat: Claude Opus 5.5 writes the FAQ bot, as a sped-up replay of an agent run in the grammar of Cursor's agent
// panel (ported from make-minecraft-every-model's beats/opus-code.js, via the e13744a9 source ad and the reddit fork's
// check line): a "Thought" and a "Read" tool row, file-edit cards whose green diff hunks stream past with line numbers
// (the star, src/bot.ts: a grammY bot on Cloudflare Workers, written to grammY's own hosting guide,
// https://grammy.dev/hosting/cloudflare-workers-nodejs: Bot with botInfo from env.BOT_INFO, webhookCallback with the
// "cloudflare-mod" adapter; then wrangler.toml), collapsed edit rows (src/faq.json, src/match.ts), a terminal block
// that replays 40 past questions from the group against the FAQ, and the review bar "4 files changed +N -0" with
// Undo all / Accept all / Review. The transcript is bottom-anchored inside a fixed viewport, so every item that lands
// pushes the run up the way the real panel autoscrolls.
// Every number on screen is counted from the sources below, never typed: a card's +N is the lines it has streamed,
// an edit row's +N is the line count of that file's source, the review bar sums them, and the test's answered / left
// counts are bestMatch (the same rule as src/match.ts) actually run over the PAST questions below.
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else (no Math.random, no layout reads). Item heights are constants in --u units, so the stacking
// is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the bot: grammY on Cloudflare Workers, answering from your 12 FAQs, tested on 40 past questions.';
const REPO_NAME = 'harbor-faq-bot';

// ---- the FAQ: 12 answers, each with the words that point to it (made up for the spot) ----
const FAQ = [
  { q: 'What time is the Saturday long run?', keys: ['saturday', 'long run', 'what time', 'start'],
    answer: 'Saturdays at 7:00 AM at the Harbor Lane boathouse. Pace groups run 9, 10 and 11 min/mile. Rain or shine, only lightning cancels.' },
  { q: 'Where do we meet?', keys: ['where', 'meet', 'boathouse', 'parking'],
    answer: 'At the Harbor Lane boathouse, by the kayak racks. Street parking on Dock Road.' },
  { q: 'Is it free to join?', keys: ['free', 'cost', 'fee', 'pay'],
    answer: 'Yes, the club is free. Just show up on Saturday.' },
  { q: 'Which pace group should I pick?', keys: ['pace', 'group', 'how fast', 'slow'],
    answer: 'Pick the group you could chat in: 9, 10 or 11 min/mile. Switch any week.' },
  { q: 'Do we run in the rain?', keys: ['rain', 'weather', 'cancel'],
    answer: 'Rain or shine. Only lightning cancels, posted here by 6:30 AM.' },
  { q: 'How do I join the race team?', keys: ['race team', 'racing', 'tryout'],
    answer: 'Race team tryouts are the first Tuesday of each month at the track.' },
  { q: 'Do I need to sign up?', keys: ['sign up', 'register', 'join'],
    answer: 'No sign-up needed. Come to any Saturday run.' },
  { q: 'Can I bring my dog?', keys: ['dog'],
    answer: 'Dogs on a short leash are welcome in the 11 min/mile group.' },
  { q: 'Are there weekday runs?', keys: ['thursday', 'weekday', 'tuesday', 'evening'],
    answer: 'Thursday bridge loop, 6:00 PM from the boathouse.' },
  { q: 'How far is the long run?', keys: ['how far', 'distance', 'miles', 'how long'],
    answer: 'Saturday is 6 to 10 miles. Turn back whenever you like.' },
  { q: 'Do you have club shirts?', keys: ['shirt', 'merch', 'singlet'],
    answer: 'Club shirts are $20, ask Sam on Saturday.' },
  { q: 'Is there a Strava club?', keys: ['strava'],
    answer: 'Yes, the Strava club is linked in the pinned post.' },
];
const FAQ_JSON = JSON.stringify(FAQ, null, 2);

// ---- the run's star: the bot (valid grammY on Cloudflare Workers, per grammY's hosting guide) ----
const BOT_TS = `import { Bot, webhookCallback } from "grammy";
import faq from "./faq.json";
import { bestMatch } from "./match";

interface Env { BOT_TOKEN: string; BOT_INFO: string }

export default {
  async fetch(req: Request, env: Env) {
    const bot = new Bot(env.BOT_TOKEN, {
      botInfo: JSON.parse(env.BOT_INFO),
    });
    bot.on("message:text", async (ctx) => {
      const hit = bestMatch(ctx.message.text, faq);
      if (!hit) return;
      await ctx.reply(hit.answer, {
        reply_parameters: { message_id: ctx.message.message_id },
      });
    });
    return webhookCallback(bot, "cloudflare-mod")(req);
  },
};`;
// ---- the matcher: the FAQ whose words the message mentions most (bestMatch below is the same rule, run for real) ----
const MATCH_TS = `type Faq = { q: string; keys: string[]; answer: string };

// the FAQ whose keywords the message mentions most, or null
export function bestMatch(text: string, faq: Faq[]): Faq | null {
  const t = text.toLowerCase();
  let best: Faq | null = null;
  let score = 0;
  for (const f of faq) {
    const s = f.keys.filter((k) => t.includes(k)).length;
    if (s > score) {
      best = f;
      score = s;
    }
  }
  return best;
}`;
const WRANGLER = `name = "harbor-faq-bot"
main = "src/bot.ts"
compatibility_date = "2026-09-28"

[vars]
BOT_INFO = """{
  "id": 7712049385,
  "is_bot": true,
  "first_name": "Harbor Lane FAQ"
}"""`;
function bestMatch(text, faq) {
  const t = text.toLowerCase();
  let best = null, score = 0;
  for (const f of faq) {
    const s = f.keys.filter((k) => t.includes(k)).length;
    if (s > score) { best = f; score = s; }
  }
  return best;
}

// ---- the test: 40 past questions from the group's export (made up for the spot), run through bestMatch. A question
// with no FAQ match gets no reply, so it is left for the group's admins. ----
const PAST = [
  "what time is saturday's run??", 'where do we meet', 'is this free?', 'which pace group am I',
  'do we run if it rains', 'how do I join the race team', 'saturday still on?', 'is there parking at the boathouse',
  'what time do we start', "where's the meeting point again", 'do I need to sign up first', 'how fast is the slow group',
  'rain today, are we running?', 'is it free for new people', 'which group for 10 min miles', 'first time, where do I go?',
  'time for the long run?', 'how much does it cost', 'can I bring my dog', 'are there any weekday runs',
  'how far is the long run', 'do you sell club shirts', 'is there a strava club', 'when are race team tryouts',
  'thursday run still happening?', 'what pace is the 9 group', 'where is the boathouse exactly', 'do I have to pay anything',
  'is the run cancelled for weather', 'how many miles on saturday', 'can I join mid season', 'any merch for sale?',
  'how long is the route', 'tuesday track session?', 'do I need to register', 'is the slow group really slow',
  'anyone have a spare foam roller?', 'congrats on the half marathon, everyone!', 'what time does it start',
  'any evening runs this week',
];
const RESULTS = PAST.map((q) => [q, bestMatch(q, FAQ)]);
const ANSWERED = RESULTS.filter(([, f]) => f).length;
const LEFT = PAST.length - ANSWERED;
const CHECKED = `Tested on ${PAST.length} past questions: ${ANSWERED} answered, ${LEFT} left for admins`;
const firstAnswered = RESULTS.find(([, f]) => f)[0];
const secondAnswered = RESULTS.filter(([, f]) => f)[2][0];
const firstLeft = RESULTS.find(([, f]) => !f)[0];

const lineCount = (src) => src.split('\n').length;

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: 'grammY docs: hosting on Cloudflare Workers' },
  { k: 'edit', f: 'src/faq.json', src: FAQ_JSON },
  { k: 'star', f: 'src/bot.ts', src: BOT_TS },
  { k: 'edit', f: 'src/match.ts', src: MATCH_TS },
  { k: 'card', f: 'wrangler.toml', src: WRANGLER },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  { k: 'term', cmd: `test on ${PAST.length} past questions` },
];
SCRIPT.forEach((s) => { if (s.src) s.n = lineCount(s.src); });
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, f) => a + f.n, 0);
const PASSED = `${PAST.length} checked`;
const TESTS = [
  ['', `Matching ${PAST.length} past questions against ${FAQ.length} answers`],
  ['', ''],
  ['ok', firstAnswered, 'answered'],
  ['ok', secondAnswered, 'answered'],
  ['adm', firstLeft, 'admins'],
  ['', ''],
  ['sum', CHECKED],
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (0.8x v2). The star (bot.ts) streams slower than a plain card, so its handler reads while the camera holds.
const DUR = { row: 0.08, edit: 0.08, card: 0.36, star: 0.84, term: 0.36 };
const STEP = { row: 0.072, edit: 0.08, card: 0.32, star: 0.8, term: 0.36 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (v2 85)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the tests pass, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Accept all pulses once
const HOLD_DONE = 0.4; /* deliberate */ // done: the check line reads, pushed in, before the camera pulls back
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
// TypeScript: keywords, strings, the grammY / Worker names, property keys, calls
const TS_KW = new Set(['import', 'from', 'export', 'default', 'async', 'await', 'const', 'let', 'return', 'if', 'new', 'interface', 'type', 'function', 'for', 'of', 'null']);
const TS_T = new Set(['Bot', 'Request', 'Env', 'JSON', 'string', 'Faq']);
function hlTs(line) {
  return line.replace(/("[^"]*")|(\/\/.*$)|([A-Za-z_$][\w$]*)(\s*:(?!:))?|([^"A-Za-z_$/]+|\/)/g, (m, str, com, id, colon, rest, at) => {
    if (str) return span('s', str);
    if (com) return span('c', com);
    if (id) {
      if (TS_KW.has(id)) return span('k', id) + (colon ? esc(colon) : '');
      if (TS_T.has(id)) return span('t', id) + (colon ? esc(colon) : '');
      if (colon) return span('p', id) + esc(colon);
      return line[at + m.length] === '(' ? span('f', id) : esc(id);
    }
    return esc(rest);
  });
}
// TOML: [sections], keys, strings (the triple-quoted JSON block reads as one string), numbers
function hlToml(line) {
  if (/^\[.*\]$/.test(line)) return span('k', line);
  const m = line.match(/^(\s*)([\w.]+)(\s*=\s*)(.*)$/);
  if (!m) return esc(line);
  const [, ind, key, eq, val] = m;
  const v = /^"/.test(val) ? span('s', val) : /^\d/.test(val) ? span('n', val) : esc(val);
  return esc(ind) + span('p', key) + esc(eq) + v;
}
function hlFile(f, src) {
  if (f.endsWith('.ts')) return src.split('\n').map(hlTs);
  let inStr = false;
  return src.split('\n').map((l) => {
    const n = (l.match(/"""/g) || []).length;
    const out = inStr ? span('s', l) : hlToml(l);
    if (n % 2 === 1) inStr = !inStr;
    return out;
  });
}

// Primer octicons (github.com/primer/octicons, MIT) and the panel's glyphs, as in the reference's kit.js
const oct = (d) => `<svg class="oct" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z');
const TICK = '<svg class="code-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TERM = '<svg class="code-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
const CHEV = '<svg class="code-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';

const ext = (f) => f.slice(f.lastIndexOf('.') + 1);
const BADGE = { ts: 'TS', json: '{ }', toml: 'TOML' };
const fileIco = (f) => `<b class="code-fi ${ext(f)}">${BADGE[ext(f)]}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="code-add">+${n}</span><span class="code-del">-0</span>`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="code-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="code-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card' || s.k === 'star') {
    const lines = hlFile(s.f, s.src);
    return `<div class="code-card${s.k === 'star' ? ' code-star' : ''}">
      <div class="code-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(0)}</em></div>
      <div class="code-bd"><div class="code-lines">${lines.map((l, i) => `<div class="code-l"><u>${i + 1}</u><code>${l || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block: two answered questions and one left for admins, then the tally with its green check
  const tl = TESTS.map(([kind, a, b]) => {
    if (kind === 'ok' || kind === 'adm') return `<div class="code-l"><code><i class="${kind}">${b.padEnd(9)}</i> <i class="dim">"</i>${esc(a)}<i class="dim">"</i></code></div>`;
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

// exported for the page's own checks (the copy the brief fixes)
export const CHECK_LINE = CHECKED;

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
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('code-wide', w >= 760); card.classList.toggle('code-mid', w < 600); card.classList.toggle('code-narrow', w <= 470); } };
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
