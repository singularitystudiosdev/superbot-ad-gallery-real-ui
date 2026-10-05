// V1 "Workspace": the reference's grammar end to end. Keys page -> plans dock into one key ->
// composer push-in -> router lift-out -> four agent windows merge -> labelled steps -> price chart -> line.
import { boot, h, at, cam, sp, tr, P, clamp, lerp, win, typed, smooth, eio, ramp, blinkOn, mark, driveMark, tile, caption, pill, AGENTS } from './core.0cecc5e4.js';
import { browser, hub, composer, planCard, keyCard, router, agentWin, sbWin, stepRow, priceChart, endLock, codePanel } from './ui.0cecc5e4.js';

const DUR = 34;
const PLANS = [...AGENTS, { key: 'deepseek', name: 'DeepSeek', logo: 'deepseek', plan: 'DeepSeek API', via: 'pay as you go' }];
const GROUPS = ['7Hq2', 'k9Vd', '3Rmx', 'Lw8p', 'Tz4e'];
const TOG = [3.6, 3.85, 4.1, 4.35, 4.6];
const DOCK = [5.7, 5.95, 6.2, 6.45, 6.7];
const FLY = 0.55;
const REQ = 'Add Stripe checkout, read the payments code, then write the tests.';
const T_TYPE = 9.7, CPS = 34;
const T_SEND = T_TYPE + REQ.length / CPS + 0.25;
const T_R = T_SEND + 0.25;
const ROWS = [
  { task: 'Plan the checkout flow', opts: ['opus', 'gem', 'ds'], pick: 0, why: 'Hardest reasoning step' },
  { task: 'Read the payments code · 41 files', opts: ['opus', 'gem', 'ds'], pick: 1, why: '1M-token context, fast' },
  { task: 'Write the unit tests', opts: ['opus', 'gem', 'ds'], pick: 2, why: 'Routine code' },
];
const GRID = [[553, 293], [1367, 293], [553, 747], [1367, 747]];
const PROMPTS = ['plan the stripe checkout flow', 'write the webhook handler', 'read every file in src/payments', 'refactor the cart component'];
const OUTS = [
  '<span class="acc">⏺</span> I\'ll map the checkout flow first.\n  <span class="dim">⎿  Read 12 files</span>',
  '<span class="dim">• Working (4s • esc to interrupt)</span>',
  '<span class="blu">✦</span> Reading 41 files in src/payments…',
  '<div class="msg">Planning next moves…</div>',
];
const SB_PROMPT = 'ship stripe checkout with tests and docs';
const STEPS = [
  ['Plan the checkout flow', 'opus', '4.1s', 20.9, 22.2],
  ['Map payment code across 41 files', 'gem', '2.3s', 21.3, 22.6],
  ['Write the Stripe webhook handler', 'gpt', '6.8s', 21.7, 23.3],
  ['Generate 24 unit tests', 'ds', '5.2s', 22.1, 23.8],
  ['Update the README and changelog', 'ds', '1.9s', 22.5, 24.4],
  ['Review the full diff', 'opus', '3.4s', 22.9, 25.7],
];
const T_TERM = 24.0, T_TERM_OUT = 25.3;

boot({ dur: DUR, build });

function vis(el, t, a, b) { const on = t >= a && t < b; el.style.display = on ? '' : 'none'; return on; }

async function build(stage) {
  // ---- S0 title ----
  const s0 = h('div', 'layer'); stage.appendChild(s0);
  const row = h('div', 'wordrow'); row.style.top = '420px'; s0.appendChild(row);
  const words = AGENTS.map((a) => { const w = h('div', 'word'); w.appendChild(tile(a.logo)); w.appendChild(h('span', '', a.name)); row.appendChild(w); return w; });
  const t2 = h('div', 'title small', 'Four agents. Four bills.'); t2.style.top = '560px'; s0.appendChild(t2);

  // ---- S1 keys page ----
  const s1 = h('div', 'layer'); stage.appendChild(s1);
  const camA = h('div', 'layer'); s1.appendChild(camA);
  const B1 = browser({ url: 'beta.superbot.gg/keys', tab: 'Superbot · API keys' }); camA.appendChild(B1.el);
  const H1 = hub('API keys'); B1.body.appendChild(H1.el);
  H1.main.appendChild(h('div', 'main-h', 'API keys'));
  H1.main.appendChild(h('div', 'main-sub', 'Connect the plans you already pay for. Superbot routes every request through them.'));
  const l1 = h('div', 'sect', 'Connected plans'); l1.style.top = '150px'; H1.main.appendChild(l1);
  const cards = PLANS.map((p, i) => { const c = planCard(p); at(c.el, 56 + i * 240, 190); H1.main.appendChild(c.el); return c; });
  const l2 = h('div', 'sect', 'Your key'); l2.style.top = '410px'; H1.main.appendChild(l2);
  const kIn = keyCard(GROUPS, PLANS.map((p) => p.logo)); at(kIn.el, 56, 450); H1.main.appendChild(kIn.el);
  const scrim1 = h('div', 'scrim'); s1.appendChild(scrim1);
  const kUp = keyCard(GROUPS, PLANS.map((p) => p.logo)); at(kUp.el, 536, 612); s1.appendChild(kUp.el);
  const flyers = PLANS.map((p) => { const f = tile(p.logo, 46); f.style.position = 'absolute'; at(f, 0, 0); s1.appendChild(f); return f; });
  const env = codePanel('<span style="color:#d8d8dc">.env</span><span style="margin-left:auto;color:#6e6e76">2 lines changed</span>', [
    { sg: '+', no: 1, html: '<span class="vr">OPENAI_BASE_URL</span>=<span class="st">https://beta.superbot.gg/v1</span>' },
    { sg: '+', no: 2, html: '<span class="vr">OPENAI_API_KEY</span>=<span class="st">sbc_live_7Hq2k9Vd3RmxLw8pTz4e</span>' },
  ], 1000);
  at(env.el, 460, 660); s1.appendChild(env.el);

  // ---- S2 composer + router ----
  const s2 = h('div', 'layer'); stage.appendChild(s2);
  const camB = h('div', 'layer'); s2.appendChild(camB);
  const B2 = browser({ url: 'beta.superbot.gg/chat', tab: 'Superbot · New chat' }); camB.appendChild(B2.el);
  const H2 = hub('Chats'); B2.body.appendChild(H2.el);
  const greet = h('div', ''); at(greet, 0, 230); greet.style.cssText += 'position:absolute;width:100%;display:flex;flex-direction:column;align-items:center;gap:22px;font-size:40px;font-weight:650;letter-spacing:-.02em;color:#f2f2f4';
  const gm = mark(84); greet.appendChild(gm.host); greet.appendChild(h('div', '', 'What are we shipping today?'));
  H2.main.appendChild(greet);
  const bubble = h('div', 'bubble', REQ); bubble.style.right = '180px'; bubble.style.top = '300px'; H2.main.appendChild(bubble);
  const C = composer(); at(C.el, 180, 470); H2.main.appendChild(C.el);
  const scrim2 = h('div', 'scrim'); s2.appendChild(scrim2);
  const RT = router(ROWS); at(RT.el, 340, 250); s2.appendChild(RT.el);

  // ---- S3/S4 agents merge, labelled steps ----
  const s3 = h('div', 'layer'); stage.appendChild(s3);
  const wins = AGENTS.map((a) => { const w = agentWin(a.key); at(w.el, 0, 0); s3.appendChild(w.el); return w; });
  const SB = sbWin(); at(SB.el, 960 - 590, 520 - 350); s3.appendChild(SB.el);
  const steps = STEPS.map(([tx, m, ms]) => { const r = stepRow(tx, m, ms); SB.steps.appendChild(r.el); return r; });
  const scrim3 = h('div', 'scrim'); s3.appendChild(scrim3);
  const term = codePanel('Terminal <span style="color:#6e6e76">· step 4 ran on</span> <span style="color:#8fa2ff">deepseek-v4.1-flash</span>', [
    { no: '', html: '<span class="fn">$</span> npm test' },
    { no: '', html: ' <span style="color:#7ee2a8">✓</span> tests/checkout.test.ts  <span class="cm">(12)</span>' },
    { no: '', html: ' <span style="color:#7ee2a8">✓</span> tests/webhook.test.ts   <span class="cm">(8)</span>' },
    { no: '', html: ' <span style="color:#7ee2a8">✓</span> tests/cart.test.ts      <span class="cm">(4)</span>' },
    { no: '', html: ' <span style="color:#7ee2a8">Tests  24 passed</span> <span class="cm">(24)</span>' },
  ], 900);
  at(term.el, 510, 300); s3.appendChild(term.el);

  // ---- S5 chart, S6 end ----
  const s5 = h('div', 'layer'); stage.appendChild(s5);
  const CH = priceChart(['opus', 'gpt', 'gem', 'ds'], { title: 'List price per 1M output tokens', sub: 'OpenRouter, October 2026', hi: ['gem', 'ds'], bracket: { from: 2, to: 3, text: 'Where routine steps go' } });
  s5.appendChild(CH.el);
  const s6 = h('div', 'layer'); stage.appendChild(s6);
  const END = endLock('One API key · drop-in replacement · <b>beta.superbot.gg</b>'); s6.appendChild(END.el);

  const pillP = pill(stage, 'Superbot, all your agents in one');
  const cap = caption(stage, [
    [3.25, 5.1, 'Connect the plans you already pay for.'],
    [5.3, 7.65, 'Superbot packs them into <b>one API key</b>.'],
    [7.85, 9.0, 'Drop it in where your old key was.'],
    [9.35, 11.85, 'Ask the way you always do.'],
    [T_R + 0.1, T_R + 2.0, 'Superbot picks the model that fits each part.'],
    [T_R + 2.1, 15.0, '<b>Opus 5.5</b> only for the hard part.'],
    [15.25, 17.65, 'Four agents. Four windows. Four bills.'],
    [18.0, 20.6, 'Superbot runs them as <b>one agent</b>.'],
    [20.8, 23.9, 'It hands each step to the best model.'],
    [T_TERM + 0.05, T_TERM_OUT, 'The tests ran on <b>DeepSeek V4.1 Flash</b>.'],
    [T_TERM_OUT + 0.1, 27.0, 'Every step labeled with the model that ran it.'],
    [27.25, 29.9, 'Routine work stops paying Opus prices.'],
  ]);

  const paint = (t) => {
    // S0
    if (vis(s0, t, 0, 3.05)) {
      words.forEach((w, i) => {
        const u = sp(t, 0.2 + i * 0.38, P.heavy);
        w.style.opacity = clamp(u * 1.3).toFixed(3);
        w.style.transform = `translateY(${((1 - u) * 34).toFixed(2)}px)`;
        w.style.filter = u < 0.98 ? `blur(${((1 - u) * 10).toFixed(2)}px)` : 'none';
      });
      const u2 = sp(t, 1.85, P.heavy);
      t2.style.opacity = clamp(u2 * 1.2).toFixed(3);
      t2.style.transform = `translateY(${((1 - u2) * 24).toFixed(2)}px)`;
      const out = smooth((t - 2.7) / 0.35);
      s0.style.opacity = (1 - out).toFixed(3);
      s0.style.transform = `scale(${(1 + out * 0.05).toFixed(4)})`;
      s0.style.filter = out > 0.01 ? `blur(${(out * 8).toFixed(2)}px)` : 'none';
    }
    // S1
    if (vis(s1, t, 2.85, 9.15)) {
      s1.style.opacity = win(t, 2.9, 9.12, 0.3, 0.28).toFixed(3);
      const e = sp(t, 2.9, P.default);
      const L = sp(t, 5.2, P.default);
      camA.style.transform = `translateY(${((1 - e) * 70).toFixed(2)}px) scale(${(0.94 + 0.06 * e - 0.02 * L).toFixed(4)})`;
      camA.style.filter = L > 0.01 ? `blur(${(L * 3).toFixed(2)}px)` : 'none';
      driveMark(H1.mark, t);
      cards.forEach((c, i) => {
        const ce = sp(t, 3.15 + i * 0.07, P.default);
        c.el.style.opacity = clamp(ce * 1.4).toFixed(3);
        c.el.style.transform = `translateY(${((1 - ce) * 24).toFixed(2)}px)`;
        c.paint(sp(t, TOG[i], P.snappy));
        c.el.querySelector('.tile').style.opacity = t >= DOCK[i] ? 0.25 : 1;
      });
      kIn.paint(t, PLANS.map(() => 0));
      kIn.el.style.opacity = t < 5.2 ? 1 : 0;
      scrim1.style.opacity = win(t, 5.15, Infinity, 0.35).toFixed(3);
      const sK = 1 + 0.3 * L, kx = 1036 - 76 * L, ky = 737 - 297 * L;
      kUp.el.style.display = t >= 5.2 ? '' : 'none';
      kUp.el.style.transform = `translate(${(-76 * L).toFixed(2)}px,${(-297 * L).toFixed(2)}px) scale(${sK.toFixed(4)})`;
      const docked = DOCK.map((d) => (t >= d + FLY ? sp(t, d + FLY, P.snappy) : 0));
      kUp.paint(t, docked, { seal: ramp(t, 7.0, 7.6), copied: t >= 7.7, meta: t >= 6.95 ? 'Routes through 5 plans' : '' });
      flyers.forEach((f, i) => {
        const a = DOCK[i], b = a + FLY;
        const on = t >= a && t < b;
        f.style.display = on ? '' : 'none';
        if (!on) return;
        const u = eio(ramp(t, a, b));
        const x0 = 579 + i * 240, y0 = 395;
        const x1 = kx + (-444 + i * 54) * sK, y1 = ky + 77 * sK;
        const x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(Math.PI * u) * 150;
        const s = lerp(1.15, (44 * sK) / 46, u) * (1 + 0.15 * Math.sin(Math.PI * u));
        f.style.transform = `translate(${(x - 23).toFixed(2)}px,${(y - 23).toFixed(2)}px) scale(${s.toFixed(4)}) rotate(${(Math.sin(Math.PI * u) * (i - 2) * 6).toFixed(2)}deg)`;
      });
      const eu = sp(t, 7.85, P.default);
      env.el.style.opacity = clamp(eu * 1.4).toFixed(3);
      env.el.style.transform = `translateY(${((1 - eu) * 36).toFixed(2)}px)`;
      env.lines.forEach((ln, j) => { ln.style.opacity = win(t, 8.05 + j * 0.2, Infinity, 0.2).toFixed(3); });
    }
    // S2
    if (vis(s2, t, 8.95, 15.15)) {
      s2.style.opacity = win(t, 9.0, 15.1, 0.25, 0.3).toFixed(3);
      const z = tr(t, [[0, 0], [9.15, 1], [T_SEND + 0.05, 0]], P.heavy);
      const R = sp(t, T_R, P.default);
      cam(camB, lerp(960, 1110, z), lerp(540, 690, z), 1 + 0.42 * z - 0.03 * R);
      camB.style.filter = R > 0.01 ? `blur(${(R * 3).toFixed(2)}px)` : 'none';
      driveMark(H2.mark, t); driveMark(gm, t);
      const sent = t >= T_SEND;
      const press = sent ? Math.max(0, 1 - Math.abs(t - T_SEND - 0.08) / 0.12) : 0;
      C.set(sent ? '' : typed(REQ, t, T_TYPE, CPS), t, { caret: !sent || t > T_SEND + 0.4, press });
      greet.style.opacity = (1 - smooth((t - T_SEND) / 0.25)).toFixed(3);
      const bu = sp(t, T_SEND + 0.05, P.default);
      bubble.style.opacity = sent ? clamp(bu * 1.5).toFixed(3) : 0;
      bubble.style.transform = `translateY(${((1 - bu) * 40).toFixed(2)}px)`;
      scrim2.style.opacity = win(t, T_R - 0.05, Infinity, 0.3).toFixed(3);
      RT.el.style.display = t >= T_R ? '' : 'none';
      RT.el.style.opacity = clamp(R * 2).toFixed(3);
      RT.el.style.transform = `translate(${((1 - R) * 150).toFixed(2)}px,${((1 - R) * 215).toFixed(2)}px) scale(${(0.55 + 0.45 * R).toFixed(4)})`;
      RT.paintRow(0, t, T_R + 0.25, T_R + 0.95);
      RT.paintRow(1, t, T_R + 0.5, T_R + 1.55);
      RT.paintRow(2, t, T_R + 0.75, T_R + 2.15);
      driveMark(RT.mark, t);
    }
    // S3 + S4
    if (vis(s3, t, 14.95, 27.15)) {
      s3.style.opacity = win(t, 15.0, 27.1, 0.25, 0.3).toFixed(3);
      wins.forEach((w, i) => {
        const on = t < 18.85;
        w.el.style.display = on ? '' : 'none';
        if (!on) return;
        const [gx, gy] = GRID[i];
        const e = sp(t, 15.05 + i * 0.15, P.default);
        const m = sp(t, 17.7 + i * 0.05, P.default);
        const x = lerp(gx, 960 + (i - 1.5) * 16, m), y = lerp(gy, 520 + (i - 1.5) * 12, m);
        const s = 0.9 * (0.9 + 0.1 * e) * lerp(1, 0.6, m);
        const fo = smooth((t - 18.4) / 0.32);
        w.el.style.transform = `translate(${(x - 430).toFixed(2)}px,${(y - 235 + (1 - e) * 40).toFixed(2)}px) rotate(${(m * (i - 1.5) * 2.4).toFixed(3)}deg) scale(${s.toFixed(4)})`;
        w.el.style.opacity = (clamp(e * 1.4) * (1 - fo)).toFixed(3);
        w.el.style.filter = fo > 0.01 ? `blur(${(fo * 8).toFixed(2)}px)` : 'none';
        const tt = 15.6 + i * 0.14, tEnd = tt + PROMPTS[i].length / 30 + 0.3;
        const sent = t >= tEnd;
        w.inEl.textContent = sent ? '' : typed(PROMPTS[i], t, tt, 30);
        w.cur.style.opacity = blinkOn(t) || !sent ? 1 : 0;
        const html = sent ? (w.kind === 'cursor' ? `<div class="msg" style="background:#26262b">${PROMPTS[i]}</div>${OUTS[i]}` : `<span class="dim">&gt; ${PROMPTS[i]}</span>\n${OUTS[i]}`) : '';
        if (w.out.dataset.h !== String(sent)) { w.out.innerHTML = html; w.out.dataset.h = String(sent); }
      });
      const sb = sp(t, 18.35, P.heavy);
      const push = sp(t, 21.0, P.heavy) - sp(t, 26.2, P.heavy);
      SB.el.style.display = t >= 18.3 ? '' : 'none';
      SB.el.style.opacity = clamp((t - 18.35) / 0.25).toFixed(3);
      SB.el.style.transform = `translateY(${((1 - sb) * 24).toFixed(2)}px) scale(${(0.6 + 0.4 * sb + 0.05 * push).toFixed(4)})`;
      SB.tiles.forEach((x, j) => { const u = sp(t, 18.9 + j * 0.1, P.snappy); x.style.opacity = clamp(u * 1.5).toFixed(3); x.style.transform = `scale(${(0.4 + 0.6 * u).toFixed(3)})`; });
      driveMark(SB.mark, t, { happy: t > 19.0 && t < 19.7 }); driveMark(SB.titleMark, t);
      const pDone = 19.5 + SB_PROMPT.length / 34;
      SB.inEl.textContent = typed(SB_PROMPT, t, 19.5, 34);
      SB.cur.style.opacity = t < pDone || blinkOn(t) ? 1 : 0;
      steps.forEach((r, i) => r.paint(t, STEPS[i][3], STEPS[i][4]));
      scrim3.style.opacity = win(t, T_TERM, T_TERM_OUT, 0.3, 0.3).toFixed(3);
      const tu = sp(t, T_TERM, P.default), td = sp(t, T_TERM_OUT - 0.2, P.default);
      const lift = tu - td;
      term.el.style.display = t >= T_TERM && t < T_TERM_OUT + 0.4 ? '' : 'none';
      term.el.style.opacity = clamp(lift * 1.6).toFixed(3);
      term.el.style.transform = `translateY(${((1 - lift) * 120).toFixed(2)}px) scale(${(0.7 + 0.3 * lift).toFixed(4)})`;
      term.lines.forEach((ln, j) => { ln.style.opacity = win(t, T_TERM + 0.25 + j * 0.14, Infinity, 0.12).toFixed(3); });
    }
    // S5
    if (vis(s5, t, 26.95, 30.1)) {
      s5.style.opacity = win(t, 27.0, 30.05, 0.3, 0.3).toFixed(3);
      CH.paint(t, 27.0);
    }
    // S6
    if (vis(s6, t, 29.9, DUR + 1)) {
      s6.style.opacity = win(t, 29.95, Infinity, 0.25).toFixed(3);
      END.paint(t, 30.1);
    }
    pillP(t, Math.min(win(t, 3.4, 9.05, 0.3, 0.25) + win(t, T_SEND + 0.4, 14.8, 0.3, 0.3) + win(t, 19.2, 26.9, 0.3, 0.3), 1));
    cap(t);
  };
  paint.measure = () => RT.measure();
  return paint;
}
