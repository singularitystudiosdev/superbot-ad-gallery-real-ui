// V2 "Usage limit": cold open on four busy agents, two hit their limits -> windows collapse to
// their logos, which dock in one Superbot agent -> plans spiral into one key -> drop-in diff ->
// each step's model chip cycles Opus / Gemini / DeepSeek and locks -> line.
import { boot, h, at, cam, sp, tr, P, clamp, lerp, win, typed, smooth, eio, ramp, blinkOn, driveMark, tile, chip, caption, pill, AGENTS } from './core.0cecc5e4.js';
import { keyCard, agentWin, sbWin, stepRow, endLock, codePanel } from './ui.0cecc5e4.js';

const DUR = 29;
const GRID = [[553, 293], [1367, 293], [553, 747], [1367, 747]];
const PROMPTS = ['plan the stripe checkout flow', 'write the webhook handler', 'read every file in src/payments', 'refactor the cart component'];
const STREAM = [
  ['<span class="acc">⏺</span> I\'ll plan the checkout flow.', '  <span class="dim">⎿  Read src/cart.tsx</span>', '  <span class="dim">⎿  Read src/api.ts</span>', '<span class="acc">⏺</span> Drafting the plan…'],
  ['<span class="dim">• Explored</span>', '<span class="dim">  └ Read checkout.ts, api.ts</span>', '<span class="dim">• Working (6s • esc to interrupt)</span>'],
  ['<span class="blu">✦</span> Reading 41 files in src/payments…', '<span class="blu">✦</span> ReadManyFiles  src/payments/**', '<span class="blu">✦</span> Summarizing…'],
  ['<div class="msg">Planning next moves…</div>', '<div class="msg">Reading cart.tsx</div>'],
];
const LIMIT = [
  [0, 2.55, 'Claude usage limit reached · resets 3pm'],
  [1, 3.35, '■ You\'ve hit your usage limit. Try again in 2 hours.'],
];
const PLANS = AGENTS;
const GROUPS = ['7Hq2', 'k9Vd', '3Rmx', 'Lw8p'];
const SPIRAL = [11.5, 11.95, 12.4, 12.85];
const SPIN = 1.0;
const SB_PROMPT = 'ship stripe checkout with tests and docs';
const STEPS = [
  ['Plan the checkout flow', 'opus', '4.1s', 20.9, 21.7],
  ['Read src/payments · 41 files', 'gem', '2.3s', 21.35, 22.2],
  ['Generate 24 unit tests', 'ds', '5.2s', 21.8, 22.7],
  ['Write the Stripe webhook handler', 'gpt', '6.8s', 22.25, 23.2],
  ['Review the full diff', 'opus', '3.4s', 22.7, 23.7],
];
const CYCLE = ['opus', 'gem', 'ds'];

boot({ dur: DUR, build });

function vis(el, t, a, b) { const on = t >= a && t < b; el.style.display = on ? '' : 'none'; return on; }
// layout position of el's centre inside root (transforms ignored)
function centreIn(el, root) {
  let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return [x, y];
}

async function build(stage) {
  // ---- S0 grid of busy agents ----
  const s0 = h('div', 'layer'); stage.appendChild(s0);
  const camA = h('div', 'layer'); s0.appendChild(camA);
  const wins = AGENTS.map((a) => { const w = agentWin(a.key); at(w.el, GRID[AGENTS.indexOf(a)][0] - 430, GRID[AGENTS.indexOf(a)][1] - 235); camA.appendChild(w.el); return w; });
  const limits = LIMIT.map(([i, , txt]) => { const b = h('div', 'limit', txt); wins[i].body.appendChild(b); return b; });
  const logos = AGENTS.map((a) => { const x = tile(a.logo, 120); x.style.position = 'absolute'; x.style.borderRadius = '30px'; at(x, 0, 0); s0.appendChild(x); return x; });

  // ---- S1 one agent ----
  const SB = sbWin(); at(SB.el, 370, 170); s0.appendChild(SB.el);

  // ---- S2 keyring ----
  const s2 = h('div', 'layer'); stage.appendChild(s2);
  const K = keyCard(GROUPS, PLANS.map((p) => p.logo)); at(K.el, 460, 435); s2.appendChild(K.el);
  const pills = PLANS.map((p) => { const x = h('div', 'tabx'); x.appendChild(tile(p.logo)); x.appendChild(h('span', '', p.plan)); x.style.position = 'absolute'; at(x, 0, 0); s2.appendChild(x); return x; });

  // ---- S3 drop-in diff ----
  const s3 = h('div', 'layer'); stage.appendChild(s3);
  const D = codePanel('<span style="color:#d8d8dc">agent.py</span><span style="margin-left:auto;color:#6e6e76">+2  −1</span>', [
    { no: 1, html: '<span class="kw">from</span> openai <span class="kw">import</span> OpenAI' },
    { no: 2, html: '' },
    { no: 3, html: 'client = <span class="fn">OpenAI</span>(' },
    { no: 4, sg: '-', html: '    api_key=os.environ[<span class="st">"OPENAI_API_KEY"</span>],' },
    { no: 4, sg: '+', html: '    base_url=<span class="st">"https://beta.superbot.gg/v1"</span>,' },
    { no: 5, sg: '+', html: '    api_key=os.environ[<span class="st">"SUPERBOT_API_KEY"</span>],' },
    { no: 6, html: ')' },
    { no: 7, html: '<span class="cm"># the rest of your code stays the same</span>' },
  ], 1100);
  at(D.el, 410, 250); s3.appendChild(D.el);
  const strike = h('div', ''); strike.style.cssText = 'position:absolute;left:116px;top:50%;height:2px;background:#ff7b72;transform-origin:0 50%';
  D.lines[3].appendChild(strike);

  // ---- S4 routed steps ----
  const s4 = h('div', 'layer'); stage.appendChild(s4);
  const SB2 = sbWin({ sub: 'routing every step through your plans' }); at(SB2.el, 370, 170); s4.appendChild(SB2.el);
  const steps = STEPS.map(([tx, m, ms]) => {
    const r = stepRow(tx, m, ms);
    r.alts = CYCLE.map((k) => { const c = chip(k); r.el.insertBefore(c, r.chip); return c; });
    SB2.steps.appendChild(r.el);
    return r;
  });

  // ---- S5 end ----
  const s5 = h('div', 'layer'); stage.appendChild(s5);
  const END = endLock('One API key · drop-in replacement · <b>beta.superbot.gg</b>'); s5.appendChild(END.el);

  const pillP = pill(stage, 'Superbot, all your agents in one');
  const cap = caption(stage, [
    [0.35, 2.45, 'Four agents. Four subscriptions.'],
    [2.6, 6.0, 'And each one hits its own limit.'],
    [6.45, 10.1, 'Superbot turns them into <b>one agent</b>.'],
    [10.5, 13.2, 'You already pay for these plans.'],
    [13.35, 15.5, 'Superbot packs them into <b>one API key</b>.'],
    [15.9, 20.0, 'Drop-in replacement: change the key and the base URL.'],
    [20.45, 22.9, 'Every step goes to the model that fits it.'],
    [23.05, 25.4, '<b>Opus 5.5</b> only gets the hard ones.'],
  ]);

  let slots = [];
  const paint = (t) => {
    // S0 + S1
    if (vis(s0, t, 0, 10.75)) {
      s0.style.opacity = win(t, -1, 10.7, 0.2, 0.35).toFixed(3);
      const cx = tr(t, [[0, 960], [2.45, 553], [3.25, 1367], [4.25, 960]], P.heavy);
      const cy = tr(t, [[0, 540], [2.45, 293], [3.25, 293], [4.25, 540]], P.heavy);
      const cs = tr(t, [[0, 1.03], [0.05, 1], [2.45, 1.32], [4.25, 1]], P.heavy);
      cam(camA, cx, cy, cs);
      wins.forEach((w, i) => {
        const tc = 6.35 + i * 0.09;
        const c = sp(t, tc, P.default);
        const on = t < tc + 0.8;
        w.el.style.display = on ? '' : 'none';
        if (on) {
          const [gx, gy] = GRID[i];
          const tx = 960 + (i - 1.5) * 170, ty = 540;
          const x = lerp(gx, tx, c), y = lerp(gy, ty, c);
          w.el.style.transform = `translate(${(x - gx).toFixed(2)}px,${(y - gy).toFixed(2)}px) scale(${(0.9 * lerp(1, 0.14, c)).toFixed(4)})`;
          w.el.style.opacity = (1 - smooth((t - tc - 0.15) / 0.3)).toFixed(3);
          const tt = 0.15 + i * 0.16, tEnd = tt + PROMPTS[i].length / 32 + 0.25;
          const sent = t >= tEnd;
          w.inEl.textContent = sent ? '' : typed(PROMPTS[i], t, tt, 32);
          w.cur.style.opacity = !sent || blinkOn(t) ? 1 : 0;
          const n = sent ? clamp(Math.floor((t - tEnd) / 0.4) + 1, 0, STREAM[i].length) : 0;
          const key = String(n);
          if (w.out.dataset.n !== key) {
            const head = w.kind === 'cursor' ? `<div class="msg" style="background:#26262b">${PROMPTS[i]}</div>` : `<span class="dim">&gt; ${PROMPTS[i]}</span>\n`;
            w.out.innerHTML = sent ? head + STREAM[i].slice(0, n).join(w.kind === 'cursor' ? '' : '\n') : '';
            w.out.dataset.n = key;
          }
        }
      });
      limits.forEach((b, j) => {
        const [i, tl] = LIMIT[j];
        const u = sp(t, tl, P.snappy);
        b.style.opacity = (t >= tl ? clamp(u * 1.5) : 0).toFixed(3);
        b.style.transform = `translateY(${((1 - u) * 16).toFixed(2)}px)`;
        wins[i].el.style.boxShadow = t >= tl ? `inset 0 0 0 ${(1 + u).toFixed(2)}px #8a2f2f, 0 30px 90px rgba(0,0,0,.55)` : '';
      });
      // windows become their logos, logos dock in the superbot header
      const sbIn = sp(t, 7.75, P.heavy);
      SB.el.style.display = t >= 7.7 ? '' : 'none';
      SB.el.style.opacity = clamp((t - 7.75) / 0.3).toFixed(3);
      SB.el.style.transform = `translateY(${((1 - sbIn) * 30).toFixed(2)}px) scale(${(0.86 + 0.14 * sbIn - 0.25 * sp(t, 10.25, P.default)).toFixed(4)})`;
      driveMark(SB.mark, t, { happy: t > 8.9 && t < 9.6 }); driveMark(SB.titleMark, t);
      logos.forEach((lg, i) => {
        const tc = 6.35 + i * 0.09, td = 8.25 + i * 0.12;
        const a = sp(t, tc + 0.12, P.default);
        const on = t >= tc + 0.12 && t < td + 0.5;
        lg.style.display = on ? '' : 'none';
        if (!on) return;
        const [gx, gy] = GRID[i];
        const rx = 960 + (i - 1.5) * 170, ry = 540;
        let x = lerp(gx, rx, a), y = lerp(gy, ry, a), s = lerp(0.3, 1, a);
        const d = eio(ramp(t, td, td + 0.5));
        if (d > 0 && slots[i]) {
          x = lerp(rx, slots[i][0], d); y = lerp(ry, slots[i][1], d) - Math.sin(Math.PI * d) * 90;
          s = lerp(1, 34 / 120, d);
        }
        lg.style.transform = `translate(${(x - 60).toFixed(2)}px,${(y - 60).toFixed(2)}px) scale(${s.toFixed(4)})`;
        lg.style.opacity = clamp(a * 1.6).toFixed(3);
      });
      SB.tiles.forEach((x, j) => {
        const td = 8.25 + j * 0.12 + 0.5;
        const u = sp(t, td, P.snappy);
        x.style.opacity = t >= td ? 1 : 0;
        x.style.transform = `scale(${(0.8 + 0.2 * u).toFixed(3)})`;
      });
      SB.inEl.textContent = ''; SB.cur.style.opacity = blinkOn(t) ? 1 : 0;
    }
    // S2 keyring
    if (vis(s2, t, 10.3, 15.75)) {
      s2.style.opacity = win(t, 10.35, 15.7, 0.3, 0.3).toFixed(3);
      const ku = sp(t, 10.4, P.heavy);
      K.el.style.transform = `translateY(${((1 - ku) * 40).toFixed(2)}px) scale(${(1.05 + 0.2 * ku).toFixed(4)})`;
      const docked = SPIRAL.map((s) => (t >= s + SPIN ? sp(t, s + SPIN, P.snappy) : 0));
      K.paint(t, docked, { seal: ramp(t, 13.4, 14.0), copied: t >= 14.2, meta: t >= 13.0 ? 'Routes through 4 plans' : '' });
      pills.forEach((p, i) => {
        const a0 = (i * Math.PI) / 2 - Math.PI / 4;
        const ang = a0 + (t - 10.4) * 0.9;
        const u = eio(ramp(t, SPIRAL[i], SPIRAL[i] + SPIN));
        const ent = sp(t, 10.55 + i * 0.1, P.default);
        const r = (1 - u) * (0.75 + 0.25 * ent);
        const x = 960 + Math.cos(ang) * 720 * r, y = 560 + Math.sin(ang) * 330 * r;
        const kS = 1.05 + 0.2 * ku;
        const tgt = [960 + (-444 + i * 54) * kS, 560 + 77 * kS];
        const fx = lerp(x, tgt[0], u * u), fy = lerp(y, tgt[1], u * u);
        p.style.display = t < SPIRAL[i] + SPIN ? '' : 'none';
        p.style.opacity = clamp(ent * 1.4).toFixed(3);
        p.style.transform = `translate(${(fx - p.offsetWidth / 2).toFixed(2)}px,${(fy - 30).toFixed(2)}px) scale(${lerp(1.3, 0.4, u).toFixed(4)})`;
      });
    }
    // S3 diff
    if (vis(s3, t, 15.55, 20.35)) {
      s3.style.opacity = win(t, 15.6, 20.3, 0.3, 0.3).toFixed(3);
      const du = sp(t, 15.65, P.default);
      D.el.style.transform = `translateY(${((1 - du) * 50).toFixed(2)}px) scale(${(0.94 + 0.06 * du + 0.04 * sp(t, 17.2, P.heavy)).toFixed(4)})`;
      strike.style.width = (eio(ramp(t, 16.35, 16.75)) * 820).toFixed(1) + 'px';
      D.lines[3].style.opacity = (1 - 0.45 * smooth((t - 16.8) / 0.3)).toFixed(3);
      [4, 5].forEach((j, k) => {
        const tj = 16.95 + k * 0.45;
        const u = eio(ramp(t, tj, tj + 0.4));
        D.lines[j].style.clipPath = `inset(0 ${((1 - u) * 100).toFixed(2)}% 0 0)`;
        D.lines[j].style.opacity = t >= tj ? 1 : 0;
      });
    }
    // S4 steps
    if (vis(s4, t, 20.15, 25.75)) {
      s4.style.opacity = win(t, 20.2, 25.7, 0.3, 0.3).toFixed(3);
      const su = sp(t, 20.2, P.heavy);
      SB2.el.style.transform = `translateY(${((1 - su) * 30).toFixed(2)}px) scale(${(0.94 + 0.06 * su).toFixed(4)})`;
      SB2.tiles.forEach((x) => { x.style.opacity = 1; });
      driveMark(SB2.mark, t, { happy: t > 23.9 && t < 24.6 }); driveMark(SB2.titleMark, t);
      SB2.inEl.textContent = typed(SB_PROMPT, t, 20.45, 34);
      SB2.cur.style.opacity = t < 20.45 + SB_PROMPT.length / 34 || blinkOn(t) ? 1 : 0;
      steps.forEach((r, i) => {
        const [, , , tIn, tLock] = STEPS[i];
        r.paint(t, tIn, tLock + 0.9);
        const locked = t >= tLock;
        const idx = Math.floor((t - tIn) * 9) % CYCLE.length;
        r.alts.forEach((c, k) => {
          const on = !locked && t >= tIn + 0.15 && k === idx;
          c.style.display = on ? '' : 'none';
          c.style.opacity = 0.75;
        });
        r.chip.style.display = locked ? '' : 'none';
        if (locked) {
          const u = sp(t, tLock, P.playful);
          r.chip.style.opacity = 1;
          r.chip.style.transform = `scale(${(0.86 + 0.14 * u).toFixed(4)})`;
        }
      });
    }
    // S5 end
    if (vis(s5, t, 25.55, DUR + 1)) {
      s5.style.opacity = win(t, 25.6, Infinity, 0.3).toFixed(3);
      END.paint(t, 25.75);
    }
    pillP(t, win(t, 6.5, 25.4, 0.3, 0.3));
    cap(t);
  };
  paint.measure = () => { slots = SB.tiles.map((x) => centreIn(x, s0)); };
  return paint;
}
