// V2 prism (91e2fa71): real-UI pieces floating on a dot grid. Four plan cards drop into a 3D deck
// and laminate into one sk-superbot key -> the key turns edge-on and becomes a prism: each request
// is a beam that refracts to the best model (Opus 5.5 / Gemini 3.1 Pro / DeepSeek V4.1) -> a
// config.toml line flips to the superbot base_url -> two stopwatch dials race the same agent task,
// superbot done 7x sooner -> seven superbot runs fit in one old run -> the line.
import {
  clamp, lerp, smooth, outCubic, inOutCubic, sp, win, h, $, $$, op, tf, scramble, track,
  PRESETS, PLANS, PLAN, KEY_PRE, BASE_URL, REQS, ROUTE_MODELS, tile, makeMark, camera, makeCaption, boot,
} from './kit.js';
import { STEPS, OLD_TOTAL, SB_TOTAL, RATIO, RACE, raceClock, speedX, fmt, stepStates, makeX7End, OLD_HOST, SB_HOST } from './x7.js';

const DUR = 30;
const T = {
  drop: [0.4, 0.9, 1.4, 1.9], stack: 2.6, lam: 3.7, flash: 3.95, dec: [4.5, 4.8, 5.1, 5.4], cnt: 5.75, turn: 6.0, prism: 6.4,
  tg: 6.8, req: [7.2, 9.2, 11.2], out: 12.95, cfg: 13.25, flip: 14.5, cfgOut: 16.6, dial: 16.85, race: 17.5,
  laps: 24.6, end: 27.0,
}; // 120 BPM: card drops, decodes and request launches on the half-beat grid
const SB_DONE = T.race + RACE.A, OLD_DONE = T.race + RACE.END;
const APEX = [960, 395], BL = [800, 675], BR = [1120, 675];
const IN_Y = 560, IN_X = 960 - 160 * (IN_Y - 395) / 280, EXIT = [960 + 160 * (575 - 395) / 280, 575];
const TG_TOP = [235, 465, 695], TG_Y = TG_TOP.map((y) => y + 75), TG_X = 1390;
const DC = [[560, 440], [1360, 440]]; // dial centres
const R = 220, C = 2 * Math.PI * R;
const LAPX = (k) => 760 + k * 150, LAPY = 470;
const CFG = [
  '<span class="h1">[agent]</span>',
  '<span class="ky">name</span> <span class="eq">=</span> <span class="st2">"billing-agent"</span>',
  '',
  '<span class="h1">[llm]</span>',
  `<span class="ky">base_url</span> <span class="eq">=</span> <span class="flip"><span class="od st2">"https://api.openai.com/v1"</span><span class="nw">"${BASE_URL}"</span></span>`,
  '<span class="ky">api_key_env</span> <span class="eq">=</span> <span class="st2">"OPENAI_API_KEY"</span>',
  '<span class="ky">timeout</span> <span class="eq">=</span> <span class="st2">600</span>',
];
const S = {};
const NS = 'http://www.w3.org/2000/svg';

function dialSvg(id, sb) {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2, r0 = i % 5 ? 248 : 242, r1 = 258;
    return `<line x1="${280 + r0 * Math.cos(a)}" y1="${280 + r0 * Math.sin(a)}" x2="${280 + r1 * Math.cos(a)}" y2="${280 + r1 * Math.sin(a)}" stroke="${i % 5 ? '#2a2c33' : '#4a4d57'}" stroke-width="${i % 5 ? 2 : 3}"/>`;
  }).join('');
  return `<svg viewBox="0 0 560 560"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
    ${ticks}<circle cx="280" cy="280" r="${R}" fill="none" stroke="#1b1c21" stroke-width="18"/>
    <circle class="pulse" cx="280" cy="280" r="${R}" fill="none" stroke="url(#${id})" stroke-width="6"/>
    <circle class="arc" cx="280" cy="280" r="${R}" fill="none" stroke="${sb ? `url(#${id})` : '#9a9da6'}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 280 280)"/>
    <circle class="head" r="13" fill="#fff"/></svg>`;
}

async function mount(stage) {
  S.marks = [];
  const mk = (n) => { const m = makeMark(n); S.marks.push(m); return m.el; };
  stage.appendChild(h('<div class="bgg"></div>'));
  S.L = h('<div class="layer"></div>');
  S.w = h('<div class="vw"></div>');
  S.L.appendChild(S.w);
  stage.appendChild(S.L);

  // ---- deck of plan cards + the key, in 3D
  S.flash = h('<div class="flash"></div>');
  S.d3 = h('<div class="d3"></div>');
  S.deck = h('<div class="deck"></div>');
  S.d3.appendChild(S.deck);
  S.w.append(S.flash, S.d3);
  S.cards = PLANS.map((p) => {
    const el = h(`<div class="pc"><div class="glo" style="background:radial-gradient(90% 120% at 0% 0%, ${p.color}55, transparent 60%)"></div>
      <div class="pc-top">${tile(p.id)}<span class="con"><i class="chk"></i>Connected</span></div>
      <div class="pc-nm">${p.plan}</div><div class="pc-sub">${p.vendor} · ${p.model}</div>
      <div class="pc-foot"><span class="chip plan">${tile(p.id)}${p.short}</span><span class="pc-num"><em>key part</em>${p.seg}</span></div></div>`);
    S.deck.appendChild(el);
    return el;
  });
  S.key = h(`<div class="kk"><div class="shine"></div><div class="rim"></div>
    <div class="kh"><span class="km"></span>superbot API key</div><span class="chip kc2"><i class="dot"></i>OpenAI-compatible</span>
    <div class="kl">One key · every plan you pay for</div>
    <div class="kkey"><span class="pre0">${KEY_PRE}</span>${PLANS.map((p) => `<span class="sg0">${p.seg}<i style="background:${p.color}"></i></span>`).join('')}</div>
    <div class="kplans">${PLANS.map((p) => `<span class="kp">${tile(p.id)}</span>`).join('')}<div class="kn"><b>4 plans → 1 key</b><span>drop-in for any OpenAI client</span></div></div></div>`);
  $(S.key, '.km').appendChild(mk(48));
  S.deck.appendChild(S.key);
  S.kshine = $(S.key, '.shine');
  S.ksegs = $$(S.key, '.sg0').map((el) => ({ el, u: $(el, 'i'), tx: el.firstChild }));
  S.kps = $$(S.key, '.kp');
  S.kn = $(S.key, '.kn');

  // ---- prism + beams
  S.svg = h(`<svg class="pz" viewBox="0 0 1920 1080"><defs>
      <linearGradient id="pg2" x1="800" y1="675" x2="1120" y2="395" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>
      <linearGradient id="pf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".13"/><stop offset="1" stop-color="#ffffff" stop-opacity=".03"/></linearGradient>
      <linearGradient id="bo2" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop class="bstop" offset="1" stop-color="#5b8dff"/></linearGradient>
    </defs>
    <g class="faint">${ROUTE_MODELS.map((id, j) => `<line x1="${EXIT[0]}" y1="${EXIT[1]}" x2="${TG_X}" y2="${TG_Y[j]}" stroke="${PLAN[id].color}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>
    <g class="bglow" style="filter:blur(8px)"><line class="g1" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity=".35"/><line class="g2" stroke="url(#bo2)" stroke-width="20" stroke-linecap="round" opacity=".45"/></g>
    <line class="bin" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <line class="bout" stroke="url(#bo2)" stroke-width="6" stroke-linecap="round"/>
    <g class="prism"><polygon points="${APEX} ${BL} ${BR}" fill="url(#pf2)" stroke="url(#pg2)" stroke-width="3.5" stroke-linejoin="round"/>
      <polyline points="${APEX[0]},${APEX[1] + 30} ${BL[0] + 40},${BL[1] - 16}" stroke="#ffffff" stroke-opacity=".18" stroke-width="2" fill="none"/>
      <line class="binner" x1="${IN_X}" y1="${IN_Y}" x2="${EXIT[0]}" y2="${EXIT[1]}" stroke="#ffffff" stroke-opacity=".75" stroke-width="4"/></g>
  </svg>`);
  S.w.appendChild(S.svg);
  S.prism = $(S.svg, '.prism');
  S.faint = $$(S.svg, '.faint line');
  S.bin = $(S.svg, '.bin');
  S.bout = $(S.svg, '.bout');
  S.g1 = $(S.svg, '.g1');
  S.g2 = $(S.svg, '.g2');
  S.bo2 = $(S.svg, '#bo2');
  S.bstop = $(S.svg, '.bstop');
  S.binner = $(S.svg, '.binner');
  S.pzm = h('<div class="pzm"></div>');
  S.pzm.appendChild(mk(80));
  S.w.appendChild(S.pzm);
  S.bubs = REQS.map((r) => { const el = h(`<div class="bub"><div class="bl">You<span>model: auto</span></div><div class="bt">${r.text}</div></div>`); S.w.appendChild(el); return el; });
  S.why = h(`<div class="whyb">${REQS.map((r) => `<div><em>why</em>${r.why}</div>`).join('')}</div>`);
  S.whys = $$(S.why, ':scope > div');
  S.w.appendChild(S.why);
  S.tgts = ROUTE_MODELS.map((id, j) => {
    const p = PLAN[id];
    const el = h(`<div class="tgt" style="top:${TG_TOP[j]}px"><div class="hl2"></div>${tile(id)}<div><b>${p.short}</b><span class="vi">via ${p.plan}</span></div><span class="fs">0%</span><span class="pk">picked</span></div>`);
    S.w.appendChild(el);
    return { el, id, hl: $(el, '.hl2'), fs: $(el, '.fs'), pk: $(el, '.pk') };
  });

  // ---- config.toml
  S.cfg = h(`<div class="cfg"><div class="ctab"><div class="tb">config.toml<span class="dt"></span></div><span class="pth">~/billing-agent/config.toml</span></div></div>`);
  S.cls = CFG.map((l, i) => {
    const el = h(`<div class="cl" style="top:${88 + i * 56}px"><span class="no">${i + 1}</span><span class="gg"></span><span class="tx2">${l}</span></div>`);
    S.cfg.appendChild(el);
    return el;
  });
  S.lbg = h('<div class="lbg"></div>');
  S.cls[4].prepend(S.lbg);
  S.gg = $(S.cls[4], '.gg');
  S.flip = $(S.cls[4], '.flip');
  S.fOld = $(S.flip, '.od');
  S.fNew = $(S.flip, '.nw');
  S.dt = $(S.cfg, '.dt');
  S.stamp = h('<div class="stamp"><i class="chk"></i>1 line changed</div>');
  S.cfg.appendChild(S.stamp);
  S.w.appendChild(S.cfg);

  // ---- dials
  S.dials = ['old', 'sb'].map((side, i) => {
    const sb = side === 'sb';
    const el = h(`<div class="dial" style="left:${DC[i][0] - 280}px;top:${DC[i][1] - 280}px">${dialSvg('dg' + i, sb)}
      <div class="dc"><div class="dt2">0:00.0</div><div class="dl">elapsed</div></div>
      <div class="dn">${sb ? '<span class="dm"></span>' : tile('openai')}${sb ? 'superbot' : 'Old endpoint'}<span class="hs">${sb ? SB_HOST : OLD_HOST}</span></div>
      <div class="dstep">${STEPS.map((s) => `<div>${s.label}${sb ? (s.model ? `<span class="mb">${tile(s.model)}${s.badge}</span>` : '<span class="mb loc">local</span>') : (s.model ? `<span class="mb">${tile('openai')}GPT-6.1</span>` : '<span class="mb loc">local</span>')}</div>`).join('')}<div><i class="chk"></i>PR #418 opened</div>${sb ? '' : '<div><span class="mb bad">429 Too Many Requests · retrying</span></div>'}</div></div>`);
    if (sb) $(el, '.dm').appendChild(mk(36));
    S.w.appendChild(el);
    return { el, sb, total: sb ? SB_TOTAL : OLD_TOTAL, arc: $(el, '.arc'), head: $(el, '.head'), pulse: $(el, '.pulse'), tm: $(el, '.dt2'), dl: $(el, '.dl'), steps: $$(el, '.dstep > div'), lbl: [$(el, '.dn'), $(el, '.dstep')] };
  });
  S.spd = h('<div class="spd2"><div class="speed"><span class="ff"><i></i><i></i></span><span class="x">10×</span> time-lapse</div></div>');
  S.spX = $(S.spd, '.x');
  S.vx = h(`<div class="vx"><div>${RATIO.toFixed(1)}× faster</div></div>`);
  S.w.append(S.spd, S.vx);

  // ---- laps
  S.laps = h('<div class="laps"></div>');
  S.lapEls = Array.from({ length: 7 }, (_, k) => {
    const el = h(`<div class="lap" style="left:${LAPX(k) - 66}px;top:${LAPY - 66}px"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="54" fill="none" stroke="#1b1c21" stroke-width="10"/><circle class="la" cx="66" cy="66" r="54" fill="none" stroke="url(#dg1)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 54}" transform="rotate(-90 66 66)"/></svg><div class="ln2">${k + 1}</div></div>`);
    S.laps.appendChild(el);
    return { el, a: $(el, '.la') };
  });
  S.lapOld = h(`<div class="lapl" style="left:330px;top:640px;transform:translateX(-50%)">Old endpoint <span>· 1 run</span></div>`);
  S.lapSb = h(`<div class="lapl" style="left:${LAPX(3)}px;top:640px;transform:translateX(-50%)">superbot <span>· </span><b class="lc">7 runs</b></div>`);
  S.lc = $(S.lapSb, '.lc');
  S.laps.append(S.lapOld, S.lapSb);
  S.w.appendChild(S.laps);

  S.cap = makeCaption([
    [0.6, 2.7, 'Four subscriptions you already pay for.'],
    [3.0, 6.1, 'Packed into one superbot API key.'],
    [7.0, 13.0, 'Every request bends to the best model.'],
    [13.6, 16.6, 'Change one line in your agent’s config.'],
    [17.1, 24.4, 'Same agent task. Old endpoint vs superbot.'],
    [24.8, 26.95, 'One old run. Seven superbot runs.'],
  ]);
  stage.appendChild(S.cap.el);
  S.end = makeX7End();
  stage.appendChild(S.end.el);
}

let measured = false;
function measure() {
  measured = true;
  const w = Math.max(S.fOld.offsetWidth, S.fNew.offsetWidth);
  S.flip.style.width = w + 'px';
  S.stamp.style.left = (S.flip.offsetLeft + w + 30) + 'px';
  S.stamp.style.top = (88 + 4 * 56 + 5) + 'px';
}

function render(t) {
  if (!measured) measure();
  S.marks.forEach((m) => m.render(t));
  camera(S.w, t, [
    [0, 960, 540, 1.0], [2.4, 960, 530, 1.04], [3.7, 960, 525, 1.1], [6.1, 960, 540, 1.0],
    [13.2, 960, 540, 1.0], [14.0, 880, 600, 1.42], [16.1, 960, 540, 1.0], [19.9, 960, 520, 1.04], [23.0, 960, 540, 1.0],
  ]);
  renderDeck(t);
  renderPrism(t);
  renderCfg(t);
  renderDials(t);
  renderLaps(t);
  S.cap.render(t);
  const ea = smooth((t - T.end) / 0.35);
  op(S.end.el, ea);
  if (ea > 0) S.end.render(t - T.end);
}

function renderDeck(t) {
  const ry = track(t, [[0, 0], [T.stack, -22], [T.lam, 10], [T.lam + 0.6, 0], [T.turn, 90]], 90, 20);
  const vis = 1 - smooth((t - T.turn - 0.32) / 0.14);
  tf(S.deck, `rotateY(${ry}deg)`);
  op(S.d3, vis);
  S.cards.forEach((el, i) => {
    const kd = sp(t, T.drop[i], PRESETS.default), ks = sp(t, T.stack + (3 - i) * 0.06, PRESETS.default), kl = sp(t, T.lam, PRESETS.heavy);
    const x = lerp((i - 1.5) * 400, 0, ks);
    const y = lerp(-900, 0, kd) + lerp(0, -(3 - i) * 10, ks) * (1 - kl);
    const z = lerp(0, (i - 3) * 55, ks) * (1 - kl);
    const rz = lerp((i - 1.5) * 3, (i - 1.5) * 1.2, ks) * (1 - kl);
    const rx = (1 - kd) * 50;
    const s = lerp(0.7, 1, ks) * lerp(1, 1.12, kl);
    tf(el, `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s})`);
    op(el, Math.min(smooth((t - T.drop[i]) / 0.12), 1 - smooth((t - T.flash + 0.05) / 0.14)));
  });
  op(S.flash, win(t, T.flash - 0.15, T.flash + 0.55, 0.12, 0.4));
  const kk = sp(t, T.flash, PRESETS.heavy);
  tf(S.key, `translateZ(1px) scale(${0.62 + 0.38 * kk})`);
  op(S.key, smooth((t - T.flash - 0.06) / 0.16));
  const sh = outCubic((t - T.flash - 0.1) / 0.8);
  tf(S.kshine, `translateX(${lerp(-300, 1000, sh)}px) rotate(16deg)`);
  op(S.kshine, t > T.flash && sh < 1 ? 1 : 0);
  S.ksegs.forEach((g, i) => {
    const d = T.dec[i];
    g.tx.textContent = t < d ? '····' : scramble(PLANS[i].seg, t, d, 0.3, 21 + i);
    g.el.style.color = t < d ? '#4a4d58' : '';
    tf(g.u, `scaleX(${outCubic((t - d) / 0.35).toFixed(3)})`);
  });
  S.kps.forEach((el, i) => {
    const k = sp(t, T.dec[i], PRESETS.snappy);
    op(el, smooth((t - T.dec[i]) / 0.12));
    tf(el, `translateY(${(1 - k) * 14}px)`);
  });
  op(S.kn, smooth((t - T.cnt) / 0.15));
  tf(S.kn, `translateY(${(1 - sp(t, T.cnt, PRESETS.snappy)) * 12}px)`);
}

function renderPrism(t) {
  const kp = sp(t, T.prism, PRESETS.default), ko = smooth((t - T.out) / 0.3);
  const pv = Math.min(smooth((t - T.prism) / 0.12), 1 - ko);
  S.prism.setAttribute('transform', `translate(960 535) scale(${Math.max(0.02, kp) * (1 - 0.3 * ko)} ${1 - 0.3 * ko}) translate(-960 -535)`);
  op(S.svg, pv);
  op(S.pzm, Math.min(smooth((t - T.prism - 0.2) / 0.2), 1 - ko));
  tf(S.pzm, `scale(${0.6 + 0.4 * sp(t, T.prism + 0.2, PRESETS.playful)})`);
  const ri = T.req.filter((x) => t >= x).length - 1;
  S.bubs.forEach((el, i) => {
    const a = T.req[i], k = sp(t, a, PRESETS.default), x = smooth((t - a - 1.78) / 0.22);
    op(el, Math.min(smooth((t - a) / 0.15), 1 - x));
    tf(el, `translate(${(1 - k) * -60 + x * 30}px, ${(1 - k) * 10}px)`);
  });
  S.whys.forEach((el, i) => op(el, win(t, T.req[i] + 0.95, T.req[i] + 1.9, 0.15, 0.15)));
  // beams
  const yEnd = track(t, [[0, TG_Y[1]], ...REQS.map((r, i) => [T.req[i] + 0.85, TG_Y[ROUTE_MODELS.indexOf(r.plan)]])], 200, 22);
  const a = ri >= 0 ? T.req[ri] : -9;
  const inV = win(t, a + 0.3, a + 1.9, 0.06, 0.2);
  const x2 = lerp(660, IN_X, outCubic((t - a - 0.3) / 0.25));
  [['x1', 660], ['y1', IN_Y], ['x2', x2], ['y2', IN_Y]].forEach(([k, v]) => { S.bin.setAttribute(k, v); S.g1.setAttribute(k, v); });
  op(S.bin, inV); op(S.g1, inV);
  op(S.binner, win(t, a + 0.52, a + 1.9, 0.08, 0.2));
  S.faint.forEach((l) => op(l, 0.32 * win(t, a + 0.55, a + 1.05, 0.12, 0.25)));
  const ov = win(t, a + 0.85, a + 1.9, 0.12, 0.2);
  const reach = outCubic((t - a - 0.85) / 0.22);
  const ex = lerp(EXIT[0], TG_X, reach), ey = lerp(EXIT[1], yEnd, reach);
  [['x1', EXIT[0]], ['y1', EXIT[1]], ['x2', ex], ['y2', ey]].forEach(([k, v]) => { S.bout.setAttribute(k, v); S.g2.setAttribute(k, v); S.bo2.setAttribute(k, v); });
  op(S.bout, ov); op(S.g2, ov);
  if (ri >= 0) S.bstop.setAttribute('stop-color', PLAN[REQS[ri].plan].color);
  S.tgts.forEach((g, j) => {
    const k = sp(t, T.tg + j * 0.1, PRESETS.default);
    let hl = 0, dim = 0;
    REQS.forEach((r, i) => {
      const w = win(t, T.req[i] + 1.0, T.req[i] + 1.9, 0.1, 0.2);
      if (r.plan === g.id) hl = Math.max(hl, w); else dim = Math.max(dim, w);
    });
    op(g.el, Math.min(smooth((t - T.tg - j * 0.1) / 0.2), 1 - ko) * (1 - 0.55 * dim));
    tf(g.el, `translateX(${(1 - k) * 60 + ko * 40}px) scale(${1 + 0.035 * hl})`);
    op(g.hl, hl);
    op(g.pk, hl);
    const v = track(t, [[0, 0], ...REQS.map((r, i) => [T.req[i] + 0.55, r.fit[j]])], 170, 26);
    g.fs.textContent = Math.round(clamp(v) * 100) + '%';
  });
}

function renderCfg(t) {
  const k = sp(t, T.cfg, PRESETS.heavy), ko = smooth((t - T.cfgOut) / 0.25);
  op(S.cfg, Math.min(smooth((t - T.cfg) / 0.2), 1 - ko));
  tf(S.cfg, `perspective(1600px) rotateX(${(1 - k) * 28}deg) translateY(${(1 - k) * 90}px) scale(${1 - 0.05 * ko})`);
  const a = sp(t, T.flip, PRESETS.snappy), b = sp(t, T.flip + 0.16, PRESETS.snappy);
  tf(S.fOld, `rotateX(${a * 90}deg) translateY(${-a * 8}px)`);
  op(S.fOld, a < 0.97 ? 1 : 0);
  tf(S.fNew, `rotateX(${(b - 1) * 90}deg)`);
  op(S.fNew, t >= T.flip + 0.16 ? 1 : 0);
  op(S.lbg, smooth((t - T.flip - 0.3) / 0.25));
  S.gg.style.background = t > T.flip + 0.3 ? 'var(--ok)' : 'transparent';
  op(S.dt, 1 - smooth((t - T.flip - 0.6) / 0.15));
  const ks = sp(t, T.flip + 0.6, PRESETS.snappy);
  op(S.stamp, smooth((t - T.flip - 0.6) / 0.12));
  tf(S.stamp, `scale(${0.6 + 0.4 * ks}) rotate(${(1 - ks) * -6}deg)`);
}

function renderDials(t) {
  const lt = t - T.race, D = raceClock(lt);
  const kL = sp(t, T.laps, PRESETS.default);
  S.dials.forEach((m, i) => {
    const k = sp(t, T.dial + i * 0.12, PRESETS.default);
    const d = Math.min(D, m.total), p = d / m.total;
    let tx = 0, ty = (1 - k) * 50, s = 0.9 + 0.1 * k, a = smooth((t - T.dial - i * 0.12) / 0.2);
    if (!m.sb) { tx = (330 - DC[0][0]) * kL; ty += (470 - DC[0][1]) * kL; s *= lerp(1, 0.5, kL); }
    else { tx = (LAPX(0) - DC[1][0]) * kL; ty += (LAPY - DC[1][1]) * kL; s *= lerp(1, 132 / 520, kL); a *= 1 - smooth((t - T.laps - 0.3) / 0.1); }
    a *= 1 - smooth((t - T.end + 0.1) / 0.2);
    tf(m.el, `translate(${tx}px, ${ty}px) scale(${s})`);
    op(m.el, a);
    m.lbl.forEach((el) => op(el, 1 - smooth((t - T.laps) / 0.2)));
    m.arc.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(2));
    const ang = p * Math.PI * 2 - Math.PI / 2;
    m.head.setAttribute('cx', (280 + R * Math.cos(ang)).toFixed(2));
    m.head.setAttribute('cy', (280 + R * Math.sin(ang)).toFixed(2));
    op(m.head, t >= T.race && p < 1 ? 1 : 0);
    m.tm.textContent = fmt(d);
    m.tm.style.color = p >= 1 && m.sb ? '#3ccf7b' : '';
    m.dl.textContent = p >= 1 ? 'done' : 'elapsed';
    const done = m.sb ? SB_DONE : OLD_DONE;
    const pu = clamp((t - done) / 0.7);
    m.pulse.setAttribute('r', (R + 70 * outCubic(pu)).toFixed(1));
    op(m.pulse, m.sb && pu > 0 && pu < 1 ? 1 - pu : 0);
    // live step line under the dial
    const st = stepStates(d, m.sb ? 'sb' : 'old');
    let cur = st.findIndex((s) => s.state === 'run');
    if (t < T.race) cur = 0;
    const retry = !m.sb && cur === 1 && st[1].el >= STEPS[1].retry[0] && st[1].el < STEPS[1].retry[1];
    const show = p >= 1 ? STEPS.length : retry ? STEPS.length + 1 : Math.max(0, cur);
    m.steps.forEach((el, q) => op(el, q === show ? 1 : 0));
  });
  op(S.spd, win(t, T.race - 0.15, OLD_DONE + 0.3, 0.2, 0.2));
  S.spX.textContent = speedX(lt) + '×';
  const kv = sp(t, OLD_DONE + 0.15, PRESETS.snappy);
  op(S.vx, win(t, OLD_DONE + 0.15, T.laps + 0.1, 0.12, 0.2));
  tf(S.vx, `scale(${0.6 + 0.4 * kv})`);
}

function renderLaps(t) {
  const lv = Math.min(smooth((t - T.laps - 0.3) / 0.12), 1 - smooth((t - T.end + 0.1) / 0.2));
  op(S.laps, lv);
  let n = 1;
  S.lapEls.forEach((L, k) => {
    const t0 = T.laps + 0.45 + (k - 1) * 0.2, f = k === 0 ? 1 : clamp((t - t0) / 0.2);
    if (k > 0 && f >= 1) n = k + 1;
    L.a.setAttribute('stroke-dashoffset', (2 * Math.PI * 54 * (1 - f)).toFixed(2));
    const ks = sp(t, k === 0 ? T.laps : t0 - 0.12, PRESETS.snappy);
    op(L.el, k === 0 ? 1 : smooth((t - t0 + 0.12) / 0.1));
    tf(L.el, `scale(${k === 0 ? 1 : 0.7 + 0.3 * ks})`);
  });
  S.lc.textContent = `${n} run${n > 1 ? 's' : ''}`;
  op(S.lapOld, smooth((t - T.laps - 0.4) / 0.2));
  op(S.lapSb, smooth((t - T.laps - 0.4) / 0.2));
}

boot({ DUR, mount, render });
