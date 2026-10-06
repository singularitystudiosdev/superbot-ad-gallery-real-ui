// Superbot's main pane, in superbot-desktop's own anatomy (hero-workspace-chat.css + sbchat css, ported from
// packages/ui provider-switch.tsx / media-embed.tsx / audio-row.tsx / step-line.tsx). One live turn: the ask, the
// sonar line, ONE provider-switch block (pills oldest first, depth opacity 1 / .55 / .3, the who header only on the
// latest switch, the pending surface last and flush), then the answer under it. Everything is a pure function of t.
import { E, tw, prog, clamp, lerp, keys, fmtClock } from './ease.bd889861.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SVG = (cls, d, fill = 'none') => `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const D = {
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', check: '<path d="M20 6 9 17l-5-5"/>', play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', chev: '<path d="m6 9 6 6 6-6"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', stop: '<rect width="10" height="10" x="7" y="7" rx="1.5"/>',
};
const SPIN = SVG('hwc-spin', D.spin), CHECK = SVG('hwc-check', D.check);

export const TILES = {
  pocketsflow: { site: 'tiles/pocketsflow.png' }, google: { img: 'tiles/google.png' }, generic: { img: 'tiles/generic-cpu.svg' },
  kling: { img: 'tiles/kling.svg' }, elevenlabs: { img: 'tiles/elevenlabs.svg' }, anthropic: { img: 'tiles/anthropic.png' },
};
const tile = (key, cls) => {
  const t = TILES[key];
  if (t.site) return `<span class="${cls} pfc-site"><img src="${t.site}" alt="" draggable="false"/></span>`;
  return `<img class="${cls}" src="${t.img}" alt="" draggable="false"/>`;
};

const pillHtml = (key, ink, done) => `<span class="hwc-pill">${tile(key, 'hwc-pill-tile')}<span class="hwc-pill-label sbp-lab">` +
  `<span class="sbp-a hwc-sweep"><span class="hwc-mask"><span class="hwc-ink">${esc(ink)}</span></span></span>` +
  `<span class="sbp-b"><span class="hwc-ink">${esc(done)}</span></span></span><span class="hwc-status">${SPIN}${CHECK}</span></span>`;
const stepHtml = ([label, detail]) => `<li class="hwc-step" data-state="running"><span class="hwc-step-g">${SPIN}${CHECK}</span>` +
  `<span class="hwc-step-x"><span class="hwc-step-l">${esc(label)}</span>${detail ? `<span class="hwc-step-d">${esc(detail)}</span>` : ''}</span></li>`;
const whoHtml = (key, name) => `<div class="hwc-who">${tile(key, 'hwc-who-tile')}<span class="hwc-who-name">${esc(name)}</span><span class="hwc-who-sub">in superbot</span></div>`;
const pendHtml = (s) => s.task === 'audio'
  ? `<div class="sb-grow" data-pend="${s.k}"><div class="pfc-apend"><span class="pfc-abreath"></span><span class="pfc-acol"><span class="pfc-ph">${tile(s.tile, 'pfc-ph-tile')}<span class="pfc-ph-l">Creating audio</span><span class="pfc-ph-clock">0:00</span></span><span class="pfc-abar"></span></span></div></div>`
  : `<div class="sb-grow" data-pend="${s.k}"><div class="pfc-pend" data-task="${s.task}"><span class="pfc-breath"></span><span class="pfc-ph">${tile(s.tile, 'pfc-ph-tile')}<span class="pfc-ph-l">${s.task === 'model3d' ? 'Creating 3D model' : s.task === 'video' ? 'Creating video' : 'Creating image'}</span><span class="pfc-ph-clock">0:00</span></span></div></div>`;
const head = (key, label, meta) => `<div class="pfc-head">${tile(key, 'pfc-head-tile')}<span class="pfc-head-l">${esc(label)}</span>${meta ? `<span class="pfc-head-m">${meta}</span>` : ''}</div>`;
const bars = (env) => `<span class="pfc-wave"><span class="pfc-bars">${env.map((h) => `<i style="--h:${h}"></i>`).join('')}</span></span>`;

function cardHtml(s, M) {
  if (s.task === 'audio') {
    return `<div class="sb-grow" data-card="${s.k}"><div class="pfc-audio"><div class="pfc-arow"><span class="pfc-play">${SVG('', D.play, 'currentColor')}</span>
      <span class="pfc-atext"><span class="pfc-atitle">${esc(s.title)}</span><span class="pfc-asrc">${tile(s.tile, 'pfc-asrc-tile')}<span>${esc(s.label)}</span></span></span>
      ${bars(s.env)}<span class="pfc-adur">${s.dur}</span></div></div></div>`;
  }
  let surface = '';
  if (s.task === 'image') surface = `<div class="pfc-surface sb-img"><img src="${M.keyart}" alt="key art"/></div>`;
  if (s.task === 'model3d') surface = `<div class="pfc-surface pfc-3d"><div class="pfc-3d-canvas" data-viewer></div><div class="pfc-3d-foot"></div></div>`;
  if (s.task === 'video') surface = `<div class="pfc-surface pfc-vid"><video class="pfc-video" data-clip muted playsinline preload="auto" src="${M.kling}"></video></div>`;
  return `<div class="sb-grow" data-card="${s.k}"><figure class="pfc-fig" data-task="${s.task}">${head(s.tile, s.label, s.meta)}${surface}</figure></div>`;
}

export function buildSuperbot(host, P, M) {
  const el = document.createElement('div');
  el.className = 'sbp';
  const shots = M.shots.map((src, i) => `<span class="pfc-card" data-i="${i}"><img src="${src}" alt=""/></span>`).reverse().join('');
  el.innerHTML = `
  <div class="sbp-home"><img class="sbp-mark" src="sb/brand/mono-mark-white.svg" alt=""/><div class="sbp-greet">Good evening. Where do we go?</div></div>
  <div class="sbp-view"><div class="sbp-cam"><div class="hwc pfc sbp-thread"><div class="hwc-in">
    <div class="hwc-date" role="separator"><span class="hwc-date-line"></span><span class="hwc-date-chip">Today</span><span class="hwc-date-line"></span></div>
    <div class="sb-grow" data-ask><div class="hwc-row hwc-user" data-variant="bubble"><span class="hwc-bubble"><p class="hwc-p">${esc(P.ask)}</p></span></div></div>
    <div class="hwc-row hwc-bot" data-variant="prose"><div class="hwc-prose">
      <div class="sb-grow" data-think><div class="hwc-think" role="status"><span class="hwc-sonar-label">${esc(P.think)}</span></div></div>
      <div class="hwc-sw pfc-block sbp-block">
        ${P.switches.map((s) => `<div class="sb-grow" data-pill="${s.k}">${pillHtml(s.tile, s.svc ? `Connecting to ${s.label}` : `Switching to ${s.label}`, s.svc ? `Connected to ${s.label}` : `Switched to ${s.label}`)}</div>
        <div class="sb-grow" data-nest="${s.k}"><div class="hwc-nest"><div class="sb-grow sb-who" data-who="${s.k}">${whoHtml(s.tile, s.label)}</div>${s.steps ? `<ol class="hwc-steps">${s.steps.map(stepHtml).join('')}</ol>` : ''}</div></div>`).join('')}
        ${P.switches.filter((s) => s.task).map((s) => pendHtml(s) + cardHtml(s, M)).join('')}
      </div>
      <div class="sb-grow" data-shots><div class="pfc-shots" data-form="deck" data-nested="true"><span class="pfc-deck"><span class="pfc-stack">${shots}</span>
        <span class="pfc-src">${tile('pocketsflow', 'pfc-src-fav')}<span class="pfc-src-host">pocketsflow.com</span></span></span></div></div>
      <div class="sb-grow" data-script><ol class="pfc-steps"><li class="pfc-step" data-status="running"><span class="pfc-mark"><i class="pfc-dot"></i>${SVG('pfc-check', D.check)}</span><span class="pfc-words"><span class="pfc-verb">Wrote</span> <span class="pfc-target">launch-script.md · facts from pocketsflow.com</span></span></li></ol></div>
      <div class="sb-grow" data-code><ol class="pfc-steps">${P.code.steps.map(([v, tg]) => `<li class="pfc-step" data-status="running"><span class="pfc-mark"><i class="pfc-dot"></i>${SVG('pfc-check', D.check)}</span><span class="pfc-words"><span class="pfc-verb">${esc(v)}</span> <span class="pfc-target">${esc(tg)}</span></span></li>`).join('')}</ol></div>
      <div class="sb-grow" data-say><p class="hwc-say"><span class="sbp-sayv"></span><span class="hwc-caret"></span></p></div>
      <div class="sb-grow" data-film><figure class="pfc-fig" data-task="video">${head('generic', P.code.film, '0:12')}<div class="pfc-surface pfc-vid"><img class="sbp-poster" src="${M.poster}" alt=""/></div></figure></div>
    </div></div>
  </div></div></div></div>
  <div class="sbp-comp">
    <div class="sbc-box">
      <div class="sbc-in"><span class="sbc-ph">How can superbot help you today?</span><span class="sbc-tx"></span><span class="sbc-caret"></span></div>
      <div class="sbc-foot">
        <span class="sbc-ic">${SVG('', D.plus)}</span>
        <span class="sbc-super"><b>SUPER</b><i></i></span>
        <span class="sbc-model"><span class="sbc-mw"><span class="sbc-m" data-chip="Superbot"><img src="sb/brand/superbot-app-icon.png" alt=""/>Superbot</span>${P.chipModels.map(([label, key]) => `<span class="sbc-m" data-chip="${esc(label)}">${tile(key, '')}${esc(label)}</span>`).join('')}</span>${SVG('sbc-chev', D.chev)}</span>
        <span class="sbc-sp"></span>
        <span class="sbc-ic">${SVG('', D.monitor)}</span><span class="sbc-ic">${SVG('', D.mic)}</span>
        <span class="sbc-send"><span class="sbc-up">${SVG('', D.up)}</span><span class="sbc-stop">${SVG('', D.stop, 'currentColor')}</span></span>
      </div>
    </div>
    <div class="sbc-ctx"><span>Context</span><span class="sbc-bar"><i></i></span><span class="sbc-ctxn">12k of 200k</span><span class="sbc-sp"></span><span>superbot is AI and can make mistakes.</span></div>
  </div>`;
  host.appendChild(el);

  const $ = (s, r = el) => r.querySelector(s), $$ = (s, r = el) => [...r.querySelectorAll(s)];
  // every growing row: its natural height measured once, then drawn at height * p (Superbot's 420ms switch-row)
  const grows = new Map();
  const g = (sel) => { const n = $(sel); if (!grows.has(n)) grows.set(n, { h: 0 }); return n; };
  const N = {
    home: $('.sbp-home'), view: $('.sbp-view'), cam: $('.sbp-cam'), inner: $('.hwc-in'), comp: $('.sbp-comp'),
    tx: $('.sbc-tx'), ph: $('.sbc-ph'), caret: $('.sbc-caret'), up: $('.sbc-up'), stop: $('.sbc-stop'), send: $('.sbc-send'),
    chips: $$('.sbc-m'), mw: $('.sbc-mw'), ctxn: $('.sbc-ctxn'), ctxbar: $('.sbc-bar i'),
    ask: g('[data-ask]'), think: g('[data-think]'), shots: g('[data-shots]'), script: g('[data-script]'), code: g('[data-code]'), say: g('[data-say]'), film: g('[data-film]'),
    sayv: $('.sbp-sayv'), sayCaret: $('[data-say] .hwc-caret'), cards: $$('.pfc-card'),
  };
  N.sw = P.switches.map((s) => ({
    s, pillRow: g(`[data-pill="${s.k}"]`), nestRow: g(`[data-nest="${s.k}"]`), whoRow: g(`[data-who="${s.k}"]`),
    pill: $(`[data-pill="${s.k}"] .hwc-pill`), a: $(`[data-pill="${s.k}"] .sbp-a`), b: $(`[data-pill="${s.k}"] .sbp-b`), mask: $(`[data-pill="${s.k}"] .hwc-mask`),
    steps: $$(`[data-nest="${s.k}"] .hwc-step`),
    pend: s.task ? g(`[data-pend="${s.k}"]`) : null, card: s.task ? g(`[data-card="${s.k}"]`) : null,
    clock: s.task ? $(`[data-pend="${s.k}"] .pfc-ph-clock`) : null, surf: s.task ? $(`[data-card="${s.k}"] .pfc-surface, [data-card="${s.k}"] .pfc-wave`) : null,
    lift: s.task ? $(`[data-card="${s.k}"] .pfc-surface, [data-card="${s.k}"] .pfc-arow`) : null, breath: s.task ? $(`[data-pend="${s.k}"] .pfc-breath, [data-pend="${s.k}"] .pfc-abar`) : null,
  }));
  N.codeRows = $$('[data-code] .pfc-step');
  N.video = $('[data-clip]');
  N.viewerHost = $('[data-viewer]');
  N.foot = $('.pfc-3d-foot');

  function measure() { for (const [n, m] of grows) { n.style.height = ''; n.style.paddingBottom = ''; n.style.visibility = ''; m.h = n.scrollHeight; } }

  // set a growing row: height eased (switch-row 420ms), content rises 6px and fades in (pop)
  const grow = (n, p, rise = 6) => {
    const m = grows.get(n); const h = m.h * p;
    n.style.height = p >= 0.999 ? '' : `${h.toFixed(2)}px`;
    n.style.opacity = clamp(p * 1.4 - 0.3).toFixed(3);
    n.style.transform = p < 1 ? `translateY(${((1 - p) * rise).toFixed(2)}px)` : '';
    // a row that has not arrived keeps its place at zero height (so the camera can aim at where it will be)
    n.style.paddingBottom = p <= 0.0005 ? '0px' : '';
    n.style.visibility = p <= 0.0005 ? 'hidden' : '';
  };
  const row = (t, at, out = Infinity, dur = 0.42) => Math.min(tw(t, at, at + dur, E.inOutCubic), Number.isFinite(out) ? 1 - tw(t, out, out + dur, E.inOutCubic) : 1);

  function render(t) {
    const C = P.t;
    el.style.setProperty("--spin", `${((t * 400) % 360).toFixed(1)}deg`);
    // home -> thread: the greeting leaves, the composer docks from the middle of the pane to its foot
    const dock = tw(t, C.dock[0], C.dock[1], E.inOutCubic);
    N.home.style.opacity = (1 - tw(t, C.dock[0], C.dock[0] + 0.3)).toFixed(3);
    N.home.style.transform = `translateY(${(-14 * dock).toFixed(2)}px)`;
    N.comp.style.transform = `translateY(${lerp(P.compMidY, 0, dock).toFixed(2)}px)`;
    N.view.style.opacity = dock.toFixed(3);

    // typing the ask (≈ 30 chars/s), then send; the send button is a stop button for the whole live turn
    const typed = Math.round(clamp((t - C.type[0]) / (C.type[1] - C.type[0])) * P.ask.length);
    const sent = t >= C.send;
    N.tx.textContent = sent ? '' : P.ask.slice(0, typed);
    N.ph.style.opacity = typed > 0 || sent ? '0' : '1';
    N.caret.style.opacity = !sent && (t < C.type[0] || Math.floor(t * 2.2) % 2 === 0 || (t > C.type[0] && t < C.type[1])) ? '1' : '0';
    const live = t >= C.send && t < C.done;
    const press = 1 - 0.1 * Math.sin(Math.PI * prog(t, C.send - 0.08, C.send + 0.14));
    N.send.style.transform = `scale(${press.toFixed(3)})`;
    N.send.dataset.on = typed > 0 || live ? '1' : '0';
    N.up.style.opacity = live ? '0' : '1'; N.stop.style.opacity = live ? '1' : '0';

    // the composer's model chip briefly shows the routed chat model (chat models draw no pill)
    // the composer chip briefly shows each routed model (200ms crossfade), then returns to Superbot
    const ws = N.chips.map((c) => c._w || (c._w = c.scrollWidth));
    const on = N.chips.map((c, i) => (i === 0 ? 1 : 0));
    for (const [label, , a, b] of P.chipT) { const i = N.chips.findIndex((c) => c.dataset.chip === label); const p = Math.min(tw(t, a, a + 0.22, E.inOutSine), 1 - tw(t, b, b + 0.22, E.inOutSine)); if (p > on[i]) on[i] = p; }
    const lit = Math.max(...on.slice(1)); on[0] = 1 - lit;
    N.chips.forEach((c, i) => { c.style.opacity = on[i].toFixed(3); });
    N.mw.style.width = `${on.reduce((s, o, i) => s + o * ws[i], 0).toFixed(2)}px`;
    const ctx = Math.round(lerp(12, 31, tw(t, C.send, C.done, E.linear)));
    N.ctxn.textContent = `${ctx}k of 200k`;
    N.ctxbar.style.width = `${((ctx / 200) * 100).toFixed(2)}%`;

    grow(N.ask, row(t, C.send + 0.05));
    grow(N.think, row(t, C.think, C.done - 0.2));

    // the block: pill rows, nests, depth opacity from the newest pill that has arrived
    const arrived = N.sw.filter((w) => t >= w.s.at);
    N.sw.forEach((w, i) => {
      const s = w.s;
      grow(w.pillRow, row(t, s.at));
      const depth = arrived.length - 1 - arrived.indexOf(w);
      const prevAt = arrived.length > 1 ? arrived[arrived.length - 1].s.at : 0;
      const dTarget = depth <= 0 ? 1 : depth === 1 ? 0.55 : 0.3;
      const dFrom = depth <= 0 ? 1 : depth === 1 ? 1 : 0.55;
      const dp = lerp(dFrom, dTarget, tw(t, prevAt, prevAt + 0.2, E.inOutSine));
      w.pillRow.style.opacity = (Number(w.pillRow.style.opacity) * (t >= s.at ? dp : 1)).toFixed(3);
      // shimmer while switching (1.4s sweep), then the check (300ms) and the label morph (200ms)
      // the check lands, then the label swaps in place: the old words leave before the new ones arrive (no overlap)
      const gone = tw(t, s.check, s.check + 0.12, E.inOutSine), done = tw(t, s.check + 0.1, s.check + 0.28, E.inOutSine);
      w.pill.dataset.check = t >= s.check ? 'true' : 'false';
      const ph = ((t - s.at) % 1.4) / 1.4;
      w.mask.style.webkitMaskPosition = `${(100 - ph * 100).toFixed(2)}% 0`;
      w.mask.style.maskPosition = `${(100 - ph * 100).toFixed(2)}% 0`;
      w.a.style.opacity = (1 - gone).toFixed(3); w.b.style.opacity = done.toFixed(3);
      w.b.style.transform = `translateY(${((1 - done) * 4).toFixed(2)}px)`;
      // the nest rides with its pill's depth; the who header only on the latest switch
      const latest = arrived.length && arrived[arrived.length - 1] === w;
      const nextAt = N.sw[i + 1] ? N.sw[i + 1].s.at : Infinity;
      grow(w.whoRow, row(t, s.at + 0.12, nextAt));
      grow(w.nestRow, w.steps.length ? row(t, s.at + 0.12) : row(t, s.at + 0.12, nextAt));
      w.nestRow.style.opacity = (Number(w.nestRow.style.opacity) * (t >= s.at ? dp : 1)).toFixed(3);
      void latest;
      w.steps.forEach((li, j) => {
        const [a, b] = s.stepT[j];
        const p = row(t, a, Infinity, 0.3);
        li.style.opacity = p.toFixed(3);
        li.style.transform = `translateY(${((1 - p) * 4).toFixed(2)}px)`;
        li.dataset.state = t >= b ? 'done' : 'running';
      });
      if (w.pend) {
        grow(w.pend, row(t, s.check + 0.15, s.ready - 0.2, 0.4));
        const el2 = (t - s.check - 0.15) / (s.ready - s.check - 0.15);
        w.clock.textContent = fmtClock(clamp(el2) * s.real);
        if (w.breath) w.breath.style.opacity = (0.55 + 0.45 * (0.5 + 0.5 * Math.cos((t - s.at) * Math.PI * 2 / 1.6))).toFixed(3);
        grow(w.card, row(t, s.ready - 0.2, s.out ?? Infinity, 0.4), 0);
        // MediaEmbed's reveal: the media under a blurred copy of itself that clears as it settles
        const blur = 1 - tw(t, s.ready, s.ready + 0.55, E.outCubic);
        if (w.surf) w.surf.style.filter = blur > 0.01 ? `blur(${(10 * blur).toFixed(2)}px)` : '';
      }
    });

    // the page shots, the cut's step lines, the say line, the film
    grow(N.shots, row(t, C.shots, C.shotsOut, 0.5), 10);
    grow(N.script, row(t, C.script[0] - 0.05, C.shotsOut, 0.42));
    { const li = N.script.querySelector('.pfc-step'); li.dataset.status = t >= C.script[1] ? 'done' : 'running'; li.querySelector('.pfc-dot').style.opacity = (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2 / 1.2))).toFixed(3); }
    N.cards.forEach((c, i) => { const p = tw(t, C.shots + 0.1 + i * 0.12, C.shots + 0.5 + i * 0.12, E.outBack); c.style.opacity = clamp(p * 2).toFixed(3); c.style.translate = `${((1 - p) * -16).toFixed(2)}px 0`; });
    grow(N.code, row(t, C.code[0][0] - 0.05, Infinity, 0.42));
    N.codeRows.forEach((li, j) => { const [a, b] = C.code[j]; const p = row(t, a, Infinity, 0.3); li.style.opacity = p.toFixed(3); li.style.transform = `translateY(${((1 - p) * 4).toFixed(2)}px)`; li.dataset.status = t >= b ? 'done' : 'running'; li.querySelector('.pfc-dot').style.opacity = (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2 / 1.2))).toFixed(3); });
    grow(N.say, row(t, C.say[0] - 0.1, Infinity, 0.3));
    const sayN = Math.round(clamp(prog(t, C.say[0], C.say[1])) * P.say.length);
    N.sayv.textContent = P.say.slice(0, sayN);
    N.sayCaret.style.opacity = t < C.say[1] + 0.2 ? '1' : '0';
    grow(N.film, row(t, C.film, Infinity, 0.55), 12);

    // Kling's clip plays in its card once it lands
    return { kling: Math.max(0, t - (P.switches.find((s) => s.k === 'kling').ready + 0.05)) };
  }

  // two cameras, both keyed and eased: the thread's own scroll (the key's span centred in the view) and the shot
  // over the whole pane (zoom + focus point in pane px). Returns the shot for main to place on the stage.
  function camera(t) {
    const fy = (node, anchor) => { let y = 0, n = node; while (n && n !== N.inner) { y += n.offsetTop; n = n.offsetParent; } return y + node.offsetHeight * anchor; };
    const fx = (node) => { const c = node.querySelector('.hwc-pill, .hwc-bubble, .pfc-fig, .pfc-audio, .pfc-pend, .pfc-apend, .pfc-steps, .pfc-shots, .hwc-who, .hwc-think') || node; let x = 0, n = c; while (n && n !== N.inner) { x += n.offsetLeft; n = n.offsetParent; } const w = c.classList.contains('pfc-steps') ? Math.max(...[...c.children].map((li) => li.scrollWidth)) : c.offsetWidth; return x + w / 2; };
    const ks = P.cam;
    const colX = (P.viewW - P.colW) / 2;
    const shot = (k) => {
      const a = k.y(N);
      const y = a.length > 2 ? (fy(a[0], a[1]) + fy(a[2], a[3])) / 2 : fy(a[0], a[1]);
      const half = 960 / k.z;
      const want = colX + (a.length > 2 ? (fx(a[0]) + fx(a[2])) / 2 : fx(a[0]));
      const cx = k.cx ?? (half * 2 > P.viewW + 48 ? P.viewW / 2 : Math.min(Math.max(want, half - 24), P.viewW - half + 24));
      return { y, z: k.z, cx, cy: k.cy ?? P.viewH * P.focusY };
    };
    let i = 0; while (i < ks.length - 1 && t >= ks[i + 1].t) i++;
    const k0 = ks[i], kp = ks[Math.max(0, i - 1)];
    const s0 = shot(kp), s1 = shot(k0);
    // a long travel pulls back mid-move so the thread stays readable while it scrolls, then pushes in on the result
    const far = i > 0 && Math.abs(s1.y - s0.y) > 220;
    const d = far ? Math.max(k0.d || 0.65, 1.0) : (k0.d || 0.65);
    const p = i === 0 ? 1 : tw(t, k0.t, k0.t + d, E.inOutCubic);
    const pull = far ? 1 - 0.48 * Math.sin(Math.PI * p) : 1;
    // a held shot keeps drifting in, so no frame is ever frozen
    const drift = 1 + 0.045 * E.inOutSine(clamp((t - k0.t - d) / 3));
    const y = lerp(s0.y, s1.y, p);
    N.cam.style.transform = `translate(${(P.viewW / 2).toFixed(2)}px, ${(P.viewH * P.focusY).toFixed(2)}px) translate(${(-P.colW / 2).toFixed(2)}px, ${(-y).toFixed(2)}px)`;
    // zoom eases in log space so a push and a pull feel the same speed
    const z = Math.exp(lerp(Math.log(s0.z), Math.log(s1.z), p)) * pull * drift;
    return { z, cx: lerp(s0.cx, s1.cx, p), cy: lerp(s0.cy, s1.cy, p), dip: 0 };
  }

  return { el, N, measure, render, camera };
}
