// Opus step (fifth in the chain): Claude Opus 5.5 cuts the Pocketsflow launch video as a Remotion (React) project, told
// as a sped-up agent run in the coding panel's grammar the Minecraft ad (make-minecraft-every-model-superbot-b055c127,
// beats/opus-code.js + beats/opus-ship.js) uses: tool rows, file-edit cards streaming green TSX hunks with line numbers
// (the composition, then one scene per beat of the 15s cut: Got something, the store, the Apple Pay checkout, the $9 a
// month plan, the payout counter, the end card), collapsed Edited rows with a TS/TSX badge, a terminal block running
// `npx remotion render` with live frame counters, and a review bar (Undo all / Accept all / Review). The replayed clock
// lands on 14m 52s, a nod to the post this spot answers ("Opus 5.5 did this in 15 minutes"). Under the card, chips wire
// in the other models' output (Meshy meshes, Hailuo clips, ElevenLabs tracks), the encoded file and the push.
// Ported into this ad (helpers in beats/opus-kit.js), never imported across ad folders.
// Sources and licenses: no raster imagery. Icons are GitHub Octicons (repo-16, git-branch-16; MIT,
// github.com/primer/octicons) and Lucide (check, terminal; ISC, lucide.dev). The chip tiles are the official app marks
// already in brand/ (meshy-logo.svg, minimax-logo.svg, elevenlabs-logo.svg; provenance in brand/CREDITS.txt), drawn
// through x.tile. The code in the hunks is written for this ad against Remotion's public API (remotion.dev/docs);
// the Pocketsflow copy in it (Got something, Courses, Ebooks, Apps, $9 a month, $12,465.92, You create. We flow.) is the
// copy of @achxvi's Pocketsflow video (x.com/achxvi/status/2103918792845963545). Every moving value is a pure function
// of t: no Date, no rAF, no CSS animation or transition.
import { seg, outCubic } from '../../../lib.js';
import { REPO, O_BRANCH, TICK, TERM, sayer, rise, fmt, setText, pbar } from './opus-kit.js?v=2';

const P = 1.5; // pace
const SAY = 'Assets are in. Cutting the launch video in Remotion.';
const WORK = 892; // the replayed clock: 14m 52s of work in the lapse

const LAUNCH = `// the 15s launch cut: 1920x1080, 30fps, 450 frames
import { Composition, Series } from 'remotion';
const CUT = [[GotSomething, 66], [StoreInMinutes, 72],
  [Checkout, 69], [Subscriptions, 63], [Payouts, 90],
  [EndCard, 90]];
export const Launch = () => (
  <Series>{CUT.map(([Scene, d], i) => (
    <Series.Sequence key={i} durationInFrames={d}>
      <Scene />
    </Series.Sequence>))}
  </Series>
);
export const Root = () => (
  <Composition id='Launch' component={Launch}
    width={1920} height={1080} fps={30}
    durationInFrames={450} />
);`;

const GOT = `// Got something: the mascot, then what you can sell
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
const KINDS = ['Courses', 'Ebooks', 'Apps'];
export const GotSomething = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill className='halftone'>
      <Mascot src={staticFile('mascot.glb')} />
      <Title>Got something</Title>
      {KINDS.map((k, i) => (
        <Pill key={k} s={spring({ frame: f - 10 * i, fps })}>
          {k}
        </Pill>))}
    </AbsoluteFill>
  );
};`;

const CHECKOUT = `// checkout: the Apple Pay sheet slides up and confirms
import { interpolate, useCurrentFrame } from 'remotion';
export const Checkout = () => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 18], [1080, 0], {
    extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Phone>
        <ApplePaySheet y={y} merchant='Pocketsflow'
          paid={f > 42} />
      </Phone>
      <Audio src={staticFile('checkout-swipe.mp3')} />
    </AbsoluteFill>
  );
};`;

const SUBS = `// subscriptions: one plan, billed every month
export const PLAN = { price: 9, interval: 'month' };
export const Subscriptions = () => {
  const f = useCurrentFrame();
  const s = spring({ frame: f, fps: 30 });
  return (
    <AbsoluteFill className='subs'>
      <PlanCard scale={s}>
        <b>{'$' + PLAN.price}</b>/{PLAN.interval}
      </PlanCard>
      <Upsell show={f > 36} />
    </AbsoluteFill>
  );
};`;

const PAYOUTS = `// payouts: the balance counts up, the hit lands on it
import { Easing, interpolate, useCurrentFrame } from 'remotion';
const TARGET = 12465.92;
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD' });
export const Payouts = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [6, 66], [0, TARGET], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill className='payouts'>
      <Counter>{usd.format(v)}</Counter>
      <Audio src={staticFile('payout-hit.mp3')} />
    </AbsoluteFill>
  );
};`;

const END = `// end card: the line, the logo, the call to action
export const EndCard = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12], [0, 1], {
    extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill className='end' style={{ opacity: o }}>
      <Title>You create. We flow.</Title>
      <Logo src={staticFile('pocketsflow.svg')} />
      <p>The payment infrastructure that you deserve.</p>
      <Button>Start selling</Button>
    </AbsoluteFill>
  );
};`;

const SCRIPT = [
  { k: 'row', v: 'Thought for', a: '4s' },
  { k: 'row', v: 'Ran', a: 'npx create-video@latest --blank' },
  { k: 'row', v: 'Listed', a: 'public/models, public/clips, public/audio' },
  { k: 'card', f: 'src/Launch.tsx', n: 64, src: LAUNCH },
  { k: 'card', f: 'src/scenes/GotSomething.tsx', n: 118, src: GOT },
  { k: 'edit', f: 'src/scenes/StoreInMinutes.tsx', n: 104 },
  { k: 'edit', f: 'src/components/Mascot.tsx', n: 87 },
  { k: 'card', f: 'src/scenes/Checkout.tsx', n: 132, src: CHECKOUT },
  { k: 'edit', f: 'src/components/ApplePaySheet.tsx', n: 146 },
  { k: 'card', f: 'src/scenes/Subscriptions.tsx', n: 96, src: SUBS },
  { k: 'card', f: 'src/scenes/Payouts.tsx', n: 88, src: PAYOUTS },
  { k: 'edit', f: 'src/components/Counter.tsx', n: 58 },
  { k: 'card', f: 'src/scenes/EndCard.tsx', n: 74, src: END },
  { k: 'edit', f: 'src/theme/halftone.ts', n: 69 },
  { k: 'edit', f: 'remotion.config.ts', n: 12 },
  { k: 'row', v: 'Thought for', a: '2s' },
  { k: 'term', cmd: 'npx remotion render Launch' },
];
// the render run: [kind, ...]. 'bar' lines fill between two fractions of the terminal's window, counting to their total
const FRAMES = 450;
const RUN = [
  ['$', 'npx remotion render Launch out/pocketsflow-launch.mp4'],
  ['kv', 'Composition', 'Launch, 1920x1080, 30fps'],
  ['kv', 'Codec      ', 'h264, 450 frames, 15.0s'],
  ['bar', 'Bundled    ', 0.04, 0.2, 100, '%'],
  ['bar', 'Rendered   ', 0.26, 0.8, FRAMES, ''],
  ['bar', 'Encoded    ', 0.8, 0.94, FRAMES, ''],
  ['', ''],
  ['out', '+ out/pocketsflow-launch.mp4', '3.8 MB'],
];
const RENDERED = `${FRAMES}/${FRAMES} frames`;
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, s) => a + s.n, 0); // 1,048

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
const clock = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;
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
    // the chips under the card: the other models' output wired in, then the encoded file, then the push
    T.c1 = T.done + 0.14 * P;
    T.c1s = [0, 0.06, 0.12].map((d) => T.c1 + d * P);
    T.c2 = T.c1 + 0.18 * P; T.c2ok = T.c2 + 0.24 * P;
    T.c3 = T.c2 + 0.2 * P; T.c3ok = T.c3 + 0.16 * P;
    T.end = T.c3 + 0.3 * P;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="ocx">
      <div class="ocx-hd">
        <span class="ocx-repo">${REPO}<b>pocketsflow-launch</b></span><span class="ocx-br">${O_BRANCH}main</span>
        <em class="ocx-state"><i class="ocx-spin"></i>${TICK}<span class="ocx-sl">Working</span><span class="ocx-clk">0m 00s</span></em>
      </div>
      <div class="ocx-vp"><div class="ocx-stk">${SCRIPT.map((s) => `<div class="ocx-it">${itemHTML(s)}</div>`).join('')}<div class="ocx-sp"></div></div></div>
      <div class="ocx-ft">
        <span class="ocx-sum"><svg class="ocx-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg><b class="ocx-nf">0 files</b><span class="ocx-add">+0</span><span class="ocx-del">-0</span></span>
        <span class="ocx-btns"><i class="ocx-b">Undo all</i><i class="ocx-b ocx-pri">Accept all</i><i class="ocx-b">Review</i></span>
      </div>
    </div>`);
    const chip = (ico, label) => `<span class="ocx-chip">${ico}<span class="ocx-cl">${label}</span><span class="ocx-ok">${TICK}</span></span>`;
    const rows = x.el(`<div class="ocx-rows">
      <div class="ocx-line ocx-l1">${chip(x.tile('meshy'), 'Imported <b>mascot.glb</b> + 3 meshes')}${chip(x.tile('hailuo'), '<b>4</b> clips')}${chip(x.tile('eleven'), '<b>3</b> tracks')}</div>
      <div class="ocx-line ocx-l2"><span class="ocx-chip ocx-wide"><span class="ocx-si">${TERM}</span><span class="ocx-cl"><code>out/pocketsflow-launch.mp4</code> <span class="ocx-dim">1080p, 15s</span></span><span class="ocx-run"><i class="ocx-spin"></i>Muxing</span><span class="ocx-okw">${TICK}Ready</span></span></div>
      <div class="ocx-line ocx-l3"><span class="ocx-chip ocx-wide"><span class="ocx-si">${O_BRANCH}</span><span class="ocx-cl">Pushed to <b>sam/pocketsflow-launch</b> <code>main</code> <span class="ocx-dim">· 3 commits</span></span><span class="ocx-ok">${TICK}</span></span></div>
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
    const l2 = rows.querySelector('.ocx-l2 .ocx-chip'), l3 = rows.querySelector('.ocx-l3 .ocx-chip');
    const run2 = l2.querySelector('.ocx-run'), ok2 = l2.querySelector('.ocx-okw'), spin2 = run2.firstElementChild;
    // a chip's tick pops in with a small overshoot once its work lands
    const tick = (ok, t, t0) => {
      const q = seg(t, t0, t0 + 0.2);
      ok.style.opacity = seg(t, t0, t0 + 0.1).toFixed(3);
      ok.style.transform = q >= 1 ? 'none' : `scale(${(0.5 + 0.5 * outBack(q)).toFixed(3)})`;
    };
    const oks = l1chips.map((c) => c.querySelector('.ocx-ok'));
    const ok3 = l3.querySelector('.ocx-ok');

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

        // header: the replayed clock races while Working, then Worked for 14m 52s with a tick
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
        rise(l3, seg(t, T.c3, T.c3 + 0.3), 8, 1);
        tick(ok3, t, T.c3ok);
      },
    };
  },
};
