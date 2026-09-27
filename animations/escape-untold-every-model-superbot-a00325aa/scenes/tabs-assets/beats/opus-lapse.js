// Opus step (fifth in the chain): Claude Opus 5.5 writes the film and its code-drawn HUD as a Remotion (React) project,
// the way @achxvi's post was made ("Opus 5.5 did this in 15 minutes": a code-only film of kinetic type and UI cards),
// told as a sped-up agent run in the coding panel's grammar the Minecraft ad (make-minecraft-every-model-superbot-b055c127,
// beats/opus-code.js + beats/opus-ship.js) uses: tool rows, file-edit cards streaming green TSX hunks with line numbers
// (the composition, the paper ticket, the split-flap boards, the speed counter), collapsed Edited rows with a TS/TSX
// badge, a terminal block running `npx remotion render` with live frame counters, and a review bar (Undo all /
// Accept all / Review). A preview pane under the header shows the HUD element each file draws (the film's own HUD
// crops), and the run clock races 00:00 to 15:00. Under the card, chips wire in the other models' output (Midjourney
// plates, Hailuo clips, ElevenLabs tracks) and the encoded file.
// Ported into this ad (helpers in beats/opus-kit.js), never imported across ad folders.
// Sources and licenses: icons are GitHub Octicons (repo-16, git-branch-16; MIT, github.com/primer/octicons) and Lucide
// (check, terminal; ISC, lucide.dev). The chip tiles are the official app marks in brand/ (midjourney-logo.svg,
// minimax-logo.svg, elevenlabs-logo.svg; provenance in brand/CREDITS.txt), drawn through x.tile. The preview pane's
// pictures are img/esc/hud/*.jpg and img/esc/film-poster.jpg, crops of @anabology's "18 MONTHS TO ESCAPE" film
// (x.com/anabology/status/2103534482930491441; img/esc/CREDITS.txt). The code in the hunks is written for this ad
// against Remotion's public API (remotion.dev/docs); its copy (ESCAPE VELOCITY, LONGEVITY, PERMANENT UNDERCLASS 06
// MONTHS, 11.2 KM/S) is the film's own. Every moving value is a pure function of t: no Date, no rAF, no CSS animation
// or transition.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText, pbar } from './opus-kit.js?v=2';

const P = 1.5; // pace
const SAY = 'Assets are in. Writing the film and its HUD in Remotion.';
const WORK = 900; // the replayed clock: 15:00 of work in the lapse, the post's "15 minutes"

const FILM = `// the 23s cut: 1920x1080, 24fps, 560 frames
import { AbsoluteFill, Audio, Composition, OffthreadVideo,
  Sequence, staticFile } from 'remotion';
export const Film = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <OffthreadVideo src={staticFile('motion/walk.mp4')} />
    <Sequence durationInFrames={89}>
      <Kinetic words={['FEEL', 'THE', 'AGI']} />
    </Sequence>
    <Sequence from={89} durationInFrames={48}>
      <Ticket title='ESCAPE VELOCITY...' />
    </Sequence>
    <Sequence from={367}><SplitFlap /></Sequence>
    <Sequence from={487}>
      <Counter to={11.2} unit='KM/S' />
    </Sequence>
    <Audio src={staticFile('audio/feel-the-agi.mp3')} />
  </AbsoluteFill>
);
export const Root = () => (
  <Composition id='Film' component={Film} fps={24}
    width={1920} height={1080} durationInFrames={560} />
);`;

const TICKET = `// the paper ticket the HUD pins over a shot
import { interpolate, spring, useCurrentFrame,
  useVideoConfig } from 'remotion';
type Props = { title: string; code?: string };
export const Ticket = ({ title, code = '18MONTHS' }: Props) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  const r = interpolate(s, [0, 1], [-6, -2]);
  return (
    <div className='ticket'
      style={{ transform: 'scale(' + s + ') rotate(' + r + 'deg)' }}>
      <h2>{title}</h2>
      <Barcode value={code} />
    </div>
  );
};`;

const SPLIT = `// split-flap boards: every cell flips to its letter
import { useCurrentFrame } from 'remotion';
const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.';
const BOARDS = ['ESCAPE VELOCITY', 'LONGEVITY',
  'PERMANENT UNDERCLASS 06 MONTHS'];
export const SplitFlap = () => {
  const f = useCurrentFrame();
  return (
    <div className='boards'>
      {BOARDS.map((text, b) => (
        <Board key={b}>{[...text].map((c, i) => {
          const n = Math.min(CHARS.indexOf(c), f - 3 * i - 8 * b);
          return <Flap key={i} char={CHARS[Math.max(0, n)]} />;
        })}</Board>))}
    </div>
  );
};`;

const COUNTER = `// the speed counter under the eye: 10.8 to 11.2 KM/S
import { Easing, interpolate, useCurrentFrame } from 'remotion';
type Props = { to: number; unit: string };
export const Counter = ({ to, unit }: Props) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [0, 40], [10.8, to], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp' });
  return (
    <div className='counter'>
      <b>{v.toFixed(1)}</b> <small>{unit}</small>
    </div>
  );
};`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '3s' },
  { k: 'row', v: 'Ran', a: 'npx create-video@latest --blank' },
  { k: 'row', v: 'Listed', a: 'public/plates, public/motion, public/audio' },
  { k: 'card', f: 'src/Film.tsx', n: 96, src: FILM, pv: 'esc/film-poster.jpg' },
  { k: 'card', f: 'src/hud/Ticket.tsx', n: 84, src: TICKET, pv: 'esc/hud/phones-down.jpg' },
  { k: 'edit', f: 'src/hud/Receipt.tsx', n: 72, pv: 'esc/hud/half-pay.jpg' },
  { k: 'edit', f: 'src/hud/Headline.tsx', n: 51, pv: 'esc/hud/stop-hiring.jpg' },
  { k: 'card', f: 'src/hud/SplitFlap.tsx', n: 118, src: SPLIT, pv: 'esc/hud/splitflap-boards.jpg' },
  { k: 'card', f: 'src/hud/Counter.tsx', n: 66, src: COUNTER, pv: 'esc/hud/twelve-nine-b.jpg' },
  { k: 'edit', f: 'src/hud/ClaudeCard.tsx', n: 93, pv: 'esc/hud/feeling-agi.jpg' },
  { k: 'edit', f: 'src/hud/Poll.tsx', n: 58 },
  { k: 'edit', f: 'src/theme/grain.ts', n: 41 },
  { k: 'edit', f: 'remotion.config.ts', n: 12 },
  { k: 'row', v: 'Thought for', a: '2s' },
  { k: 'term', cmd: 'npx remotion render Film', pv: 'esc/film-poster.jpg' },
];
// the render run: [kind, ...]. 'bar' lines fill between two fractions of the terminal's window, counting to their total
const FRAMES = 560;
const RUN = [
  ['$', 'npx remotion render Film out/escape-velocity.mp4'],
  ['kv', 'Composition', 'Film, 1920x1080, 24fps'],
  ['kv', 'Codec      ', 'h264 + aac, 560 frames, 23.3s'],
  ['bar', 'Bundled    ', 0.04, 0.2, 100, '%'],
  ['bar', 'Rendered   ', 0.26, 0.8, FRAMES, ''],
  ['bar', 'Encoded    ', 0.8, 0.94, FRAMES, ''],
  ['', ''],
  ['out', '+ out/escape-velocity.mp4', '5.7 MB'],
];
const RENDERED = `${FRAMES}/${FRAMES} frames`;
const FILES = SCRIPT.filter((s) => s.f);
// the preview pane's pictures, each once, in the order they first show
const PVS = [...new Set(SCRIPT.filter((s) => s.pv).map((s) => s.pv))];
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 691

// transcript geometry in --u units (1px): the JS stacks the slots exactly, like the referent
const LH = 17, BODY = 7, GAP = 6;
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
// the terminal holds a little longer than a card so its frame counters read
const DUR = { row: 0.08, edit: 0.08, card: 0.2, term: 0.62 };
const STEP = { row: 0.05, edit: 0.034, card: 0.15, term: 0.62 };

const KW = new Set(['import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'new', 'class',
  'this', 'for', 'of', 'in', 'true', 'false', 'null', 'undefined', 'typeof', 'extends', 'constructor', 'while', 'break',
  'type', 'interface', 'as']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*")|(\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/gi;
  let out = '', m, prev = '';
  while ((m = re.exec(src))) {
    const [tok, cm, str, num, id, ws] = m;
    if (cm) out += `<i class="c">${esc(cm)}</i>`;
    else if (str) out += `<i class="s">${esc(str)}</i>`;
    else if (num) out += `<i class="n">${esc(num)}</i>`;
    else if (id) {
      const next = src.slice(re.lastIndex).trimStart()[0];
      const cls = KW.has(id) ? 'k' : next === '(' ? 'f' : /^[A-Z][A-Z0-9_]+$/.test(id) ? 'n' : /^[A-Z]/.test(id) ? 't' : prev === '.' ? 'p' : '';
      out += cls ? `<i class="${cls}">${esc(id)}</i>` : esc(id);
    } else out += esc(tok);
    if (!ws) prev = tok;
  }
  return out;
}

const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; };
const fileIco = (f) => `<b class="ocx-fi">${f.endsWith('.tsx') ? 'TSX' : 'TS'}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="ocx-add">+${fmt(n)}</span><span class="ocx-del">-0</span>`;
const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// one render-run counter at progress p: the bar, then n/total or n%
const barText = (p, total, unit) => {
  const n = Math.round(total * p);
  return { bar: pbar(p), val: unit === '%' ? `${n}%` : `${n}/${total}` };
};

function itemHTML(s) {
  if (s.k === 'row') return `<div class="ocx-row"><span>${esc(s.v)}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="ocx-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="ocx-card">
      <div class="ocx-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em><span class="ocx-add">+0</span><span class="ocx-del">-0</span></em></div>
      <div class="ocx-bd"><div class="ocx-lines">${lines.map((l, i) => `<div class="ocx-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  const tl = RUN.map(([kind, a, b]) => {
    if (kind === '$') return `<div class="ocx-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'kv') return `<div class="ocx-l"><code><i class="dim">${esc(a)}</i> ${esc(b)}</code></div>`;
    if (kind === 'bar') return `<div class="ocx-l"><code><i class="dim">${esc(a)}</i> <span class="ocx-pb"><i class="ok"></i><i class="ocx-pb0"></i></span> <i class="ocx-pv"></i></code></div>`;
    if (kind === 'out') return `<div class="ocx-l"><code><i class="ok">${esc(a)}</i>  <i class="dim">${esc(b)}</i></code></div>`;
    return `<div class="ocx-l"><code> </code></div>`;
  }).join('');
  return `<div class="ocx-term">
    <div class="ocx-ch">${TERM}<b class="ocx-tv">Running</b><span class="ocx-cmd">${esc(s.cmd)}</span><em class="ocx-tst"><i class="ocx-spin"></i><span></span></em></div>
    <div class="ocx-bd"><div class="ocx-lines">${tl}</div></div>
  </div>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08 * P;
    let at = T.card + 0.1 * P;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] * P }; at += STEP[s.k] * P; return o; });
    T.done = T.items[T.items.length - 1].b + 0.04 * P; // the render lands: review bar live, Worked for
    // the chips under the card: the other models' output wired in, then the encoded file
    T.c1 = T.done + 0.14 * P;
    T.c1s = [0, 0.06, 0.12].map((d) => T.c1 + d * P);
    T.c2 = T.c1 + 0.18 * P; T.c2ok = T.c2 + 0.24 * P;
    T.end = T.c2ok + 0.26 * P;   // no push chip here: the GitHub step that follows pushes the repo
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="ocx ocx-pv">
      <div class="ocx-hd">
        <span class="ocx-repo">${REPO}<b>escape-velocity</b></span><span class="ocx-br">${O_BRANCH}main</span>
        <em class="ocx-state"><i class="ocx-spin"></i>${TICK}<span class="ocx-sl">Working</span><span class="ocx-clk">00:00</span></em>
      </div>
      <div class="ocx-pvw">
        <div class="ocx-pvf">${PVS.map((f) => `<img src="${x.img(f)}" alt=""/>`).join('')}</div>
        <div class="ocx-pvm"><b>Preview</b><span class="ocx-pvn">Film.tsx</span><span class="ocx-pvt">frame 0 / ${FRAMES}</span></div>
        <span class="ocx-rs">Remotion Studio</span>
      </div>
      <div class="ocx-vp"><div class="ocx-stk">${SCRIPT.map((s) => `<div class="ocx-it">${itemHTML(s)}</div>`).join('')}<div class="ocx-sp"></div></div></div>
      <div class="ocx-ft">
        <span class="ocx-sum"><svg class="ocx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="ocx-nf">0 files</b><span class="ocx-add">+0</span><span class="ocx-del">-0</span></span>
        <span class="ocx-btns"><i class="ocx-b">Undo all</i><i class="ocx-b ocx-pri">Accept all</i><i class="ocx-b">Review</i></span>
      </div>
    </div>`);
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1">${chip(x.tile('mj'), 'Imported <b>4</b> plates')}${chip(x.tile('hailuo'), '<b>2</b> clips')}${chip(x.tile('eleven'), '<b>3</b> tracks')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>out/escape-velocity.mp4</code> <span class="ocx-dim">1080p, 23s</span></span><span class="ocx-run"><i class="ocx-spin"></i>Muxing</span><span class="ocx-okw">${TICK}Ready</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const items = [...card.querySelectorAll('.ocx-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.ocx-l')];
        o.box = n.querySelector('.ocx-lines');
        o.shown = -1;
        o.add = n.querySelector('.ocx-ch .ocx-add');
      }
      if (s.k === 'term') {
        o.tv = n.querySelector('.ocx-tv'); o.tst = n.querySelector('.ocx-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild;
        // the render run's live counters: each 'bar' line with its window and total, and the last text written to it
        const lines = o.lines;
        o.bars = RUN.map((r, q) => [r, lines[q]]).filter(([r]) => r[0] === 'bar').map(([r, l]) => ({
          f0: r[2], f1: r[3], total: r[4], unit: r[5],
          on: l.querySelector('.ocx-pb .ok'), off: l.querySelector('.ocx-pb0'), val: l.querySelector('.ocx-pv'),
        }));
      }
      return o;
    });
    const state = $('.ocx-state'), stateL = $('.ocx-sl'), clk = $('.ocx-clk'), spin = $('.ocx-hd .ocx-spin'), stTk = state.querySelector('.ocx-tk');
    const nf = $('.ocx-nf'), fAdd = $('.ocx-ft .ocx-add'), ft = $('.ocx-ft'), pri = $('.ocx-pri');
    const l1chips = [...rows.querySelectorAll('.ocx-l1 .ocx-chip')];
    const l2 = rows.querySelector('.ocx-l2 .ocx-chip');
    const run2 = l2.querySelector('.ocx-run'), ok2 = l2.querySelector('.ocx-okw'), spin2 = run2.firstElementChild;
    // a chip's tick pops in with a small overshoot once its work lands
    const tick = (ok, t, t0) => {
      const q = seg(t, t0, t0 + 0.2);
      ok.style.opacity = seg(t, t0, t0 + 0.1).toFixed(3);
      ok.style.transform = q >= 1 ? 'none' : `scale(${(0.5 + 0.5 * outBack(q)).toFixed(3)})`;
    };
    const oks = l1chips.map((c) => c.querySelector('.ocx-ok'));
    // the preview pane: one picture per file that draws a HUD element, cross-faded as each file lands
    const pvImgs = [...card.querySelectorAll('.ocx-pvf img')];
    const pvAt = SCRIPT.map((s, i) => [s, T.items[i].a]).filter(([s]) => s.pv).map(([s, a]) => ({ a, img: pvImgs[PVS.indexOf(s.pv)], f: s.f ? nameOf(s.f) : 'escape-velocity.mp4' }));
    const pvn = $('.ocx-pvn'), pvt = $('.ocx-pvt');

    // lines streamed so far in a card/terminal body: slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say.node, card, rows],
      marks: [[T.r, say.node], [T.card, card], [T.c1, rows]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.25), 16);
        const d = t >= T.done;
        let lines = 0, files = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up the bottom-anchored viewport
          const e = outCubic(seg(t, o.a, o.a + 0.1));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it scrolls, and its top padding goes with it so no sliver peeks under the header
            const over = Math.max(0, nf2 - BODY);
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.k === 'card') {
              const nl = s.n * seg(t, o.a, o.b);
              setText(o.add, `+${fmt(nl)}`);
              lines += nl; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? RENDERED : '');
              // the counters fill across their own slice of the run's window
              o.bars.forEach((b) => {
                const p = seg(t, o.a + b.f0 * (o.b - o.a), o.a + b.f1 * (o.b - o.a));
                const v = barText(p, b.total, b.unit);
                setText(b.on, v.bar[0]); setText(b.off, v.bar[1]); setText(b.val, v.val);
              });
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // the preview pane: the newest HUD element in view, its file name, and the composition's frame counter
        let cur = -1;
        pvAt.forEach((p, i) => { if (t >= p.a) cur = i; });
        // the newest picture fades in over 0.14s while the one before it fades out: a plain cross-fade
        const fin = cur < 0 ? 0 : seg(t, pvAt[cur].a, pvAt[cur].a + 0.14);
        pvImgs.forEach((im) => {
          let o = 0;
          if (cur >= 0 && pvAt[cur].img === im) o = fin;
          else if (cur >= 1 && pvAt[cur - 1].img === im) o = 1 - fin;
          const v = o.toFixed(3);
          if (im.style.opacity !== v) im.style.opacity = v;
        });
        setText(pvn, cur < 0 ? 'Film.tsx' : pvAt[cur].f);
        setText(pvt, `frame ${Math.round(FRAMES * seg(t, T.card, T.done))} / ${FRAMES}`);

        // header: the replayed clock races 00:00 to 15:00 while Working, then Worked for 15:00 with a tick
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, clock(WORK * seg(t, T.card, T.done)));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.22);
        stTk.style.transform = d && pop < 1 ? `scale(${outBack(pop).toFixed(3)})` : '';

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${fmt(d ? TOTAL : lines)}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('ocx-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + 0.3));
        pri.style.transform = d ? `scale(${(1 + 0.08 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';

        // chips: each rises in, then its tick lands; the mux spinner resolves into Ready
        rows.style.opacity = t >= T.c1 ? '1' : '0';
        l1chips.forEach((c, i) => { rise(c, seg(t, T.c1s[i], T.c1s[i] + 0.3), 8, 1); tick(oks[i], t, T.c1s[i] + 0.27); });
        rise(l2, seg(t, T.c2, T.c2 + 0.3), 8, 1);
        run2.style.opacity = (seg(t, T.c2, T.c2 + 0.1) * (1 - seg(t, T.c2ok - 0.08, T.c2ok + 0.02))).toFixed(3);
        run2.style.display = t >= T.c2ok + 0.02 ? 'none' : '';
        spin2.style.transform = `rotate(${((t - T.c2) * 420).toFixed(1)}deg)`;
        ok2.style.display = t >= T.c2ok ? '' : 'none';
        tick(ok2, t, T.c2ok);
      },
    };
  },
};
