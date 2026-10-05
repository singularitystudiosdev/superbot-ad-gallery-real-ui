// pf-chat: act 3's thread inside superbot-desktop main's window (assets/hero-workspace-frontend.js drives the
// composer, sidebar and header through `ui`). createChat(ui) -> { T, DUR, el, nodes, render(t), focusAt(t), viewer }.
// render(t) is pure of t (write-on-change). structure(t) decides what main draws at t (the block grows a pill per
// switch, the who header rides the newest, a pending surface lives in the block until its card lands below);
// the scroll is main's feed: the send pins the ask under the top fade, then the bottom pin follows each change.
import { ASK, SAY, MEDIA, SITE, SWITCHES, CODE, TILE, plan } from './pf-plan.f108143e.js';
import { threadMarkup } from './pf-markup.f108143e.js';
import * as R from './pf-render.f108143e.js';
import { mountViewer } from './viewer3d.f108143e.js';

const FADE = 24, GLIDE = 0.42, FAR = 160, NEST_X = 63;   // NEST_X: the step labels' x (switch-nest 35 + glyph 20 + gap 8)
const ORBIT = 0.55, ORBIT0 = -1.3;                       // the 3D orbit (the viewer's autoRotate), opening on the face
const DEPTH = [1, 0.55, 0.3];                            // depthStyle: newest, the one behind it, older
const dateLabel = () => { try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(2026, 9, 5)); } catch { return 'Today'; } };

export function createChat(ui) {
  const T = plan();
  const el = document.createElement('div');
  el.className = 'hwc pfc';
  el.innerHTML = threadMarkup(dateLabel());
  ui.feed.appendChild(el);
  const $ = (s, r = el) => r.querySelector(s), $$ = (s, r = el) => [...r.querySelectorAll(s)];
  let memo = new Map(), last = {};
  const put = (node, key, val, fn) => { let m = memo.get(node); if (!m) { m = {}; memo.set(node, m); } if (m[key] === val) return; m[key] = val; fn(val); };
  const w = {
    css: (node, prop, val) => put(node, prop, val, (v) => { node.style[prop] = v; }),
    attr: (node, a, val) => put(node, '@' + a, val, (v) => { if (v === null) node.removeAttribute(a); else node.setAttribute(a, v); }),
    text: (node, val) => put(node, '#text', val, (v) => { node.textContent = v; }),
  };
  const show = (node, on, as = '') => w.css(node, 'display', on ? as : 'none');
  const call = (key, val, fn) => { if (last[key] === val) return; last[key] = val; fn(val); };

  const swNodes = (root) => ({ root, pill: $('.hwc-pill', root), tile: $('.hwc-pill-tile', root), sweep: $('.hwc-sweep', root), ink: $('.hwc-ink', root),
    spin: $('.hwc-pill .hwc-spin', root), check: $('.hwc-pill .hwc-check', root), nest: $('.hwc-nest', root), who: $('.hwc-who', root),
    rows: $$('.hwc-step', root).map((li) => ({ li, spin: $('.hwc-spin', li), check: $('.hwc-check', li), label: $('.hwc-step-l', li) })) });
  const n = {
    inner: $('.hwc-in'), date: $('.hwc-date'), user: $('.hwc-user'), attach: $('.pfc-attach'), bot: $('.hwc-bot'), think: $('.hwc-sonar-label'),
    site: swNodes($('.pfc-sw[data-k="site"]')),
    shots: { root: $('.pfc-shots'), cards: [0, 1, 2].map((i) => $(`.pfc-card[data-i="${i}"]`)) },
    media: SWITCHES.map((d) => {
      const pend = $(`.pfc-pend[data-k="${d.key}"], .pfc-apend[data-k="${d.key}"]`), fig = $(`[data-k="${d.key}"].pfc-fig, .pfc-audio[data-k="${d.key}"]`);
      return { d, sw: swNodes($(`.pfc-sw[data-k="${d.key}"]`)), pend, breath: $('.pfc-breath, .pfc-abreath', pend), bar: $('.pfc-abar', pend), clock: $('.pfc-ph-clock', pend),
        fig, media: $('video', fig) || $('.pfc-3d-canvas', fig), vid: $('video', fig), canvas: $('.pfc-3d-canvas', fig), foot: $('.pfc-3d-foot', fig) };
    }),
    code: $$('.pfc-step').map((li) => ({ li, verb: $('.pfc-verb', li), dot: $('.pfc-dot', li) })),
    codeList: $('.pfc-steps'), say: $('.hwc-say'), sayVis: $('.hwc-say-vis'), sayHid: $('.hwc-say-hid'), caret: $('.hwc-caret'), body: $('.pfc-body'),
    film: { fig: $('.pfc-film'), media: $('.pfc-film video'), vid: $('.pfc-film video') },
  };
  for (const v of $$('video')) { v.muted = true; v.defaultMuted = true; }
  const mesh = n.media.find((m) => m.d.task === 'model3d');
  const viewer = mountViewer(mesh.canvas, MEDIA.glb, MEDIA.still);
  viewer.ready.then(() => { mesh.foot.textContent = viewer.stats; }, () => { mesh.foot.textContent = '34,823 tri'; });
  const SW = [T.site.sw, ...T.media.map((m) => m.sw)];   // every switch's start, in order
  const latest = (t) => SW.filter((a) => t >= a).length - 1;

  // what main draws at t (layout-changing writes only; every key written every call, so a scrub leaves no stale state)
  function structure(t) {
    show(el, t >= T.send); show(n.bot, t >= T.row);
    const L = latest(t);
    [n.site, ...n.media.map((m) => m.sw)].forEach((s, i) => {
      show(s.root, t >= SW[i], 'contents');
      const ok = i === 0 ? T.site.ok : T.media[i - 1].ok;
      show(s.nest, t >= ok && (i === 0 || i === L));
      show(s.who, i === L);
    });
    n.media.forEach((m, i) => { const a = T.media[i]; show(m.pend, t >= a.ok && t < a.done); show(m.fig, t >= a.done); });
    show(n.shots.root, t >= T.site.shots[0]);
    w.attr(n.shots.root, 'data-nested', L === 0 ? 'true' : null);   // turn-inline.tsx: under its block only while the site answers
    n.code.forEach((r, j) => show(r.li, t >= T.code.steps[j].in));
    show(n.codeList, t >= T.code.steps[0].in);
    show(n.say, t >= T.say); show(n.body, t >= T.body); show(n.film.fig, t >= T.film);
  }

  // the composer: the ask typed and sent, the routed model on the chip while each switch holds (composer.tsx:
  // dips to .15 over 140ms, swaps, pops 1.08 -> 1 over 400ms out-cubic)
  const MODELS = [...T.media.map((m, i) => [m.ok, m.end, { name: SWITCHES[i].label, tile: TILE[SWITCHES[i].tile].img }]),
    [T.code.at, T.code.end + 0.1, { name: CODE.model, tile: TILE.anthropic.img }]];
  const SWAPS = MODELS.flatMap(([a, b]) => [a, b]);
  function composer(t) {
    const typed = t < T.send ? T.keys.filter((k) => t >= k).length : 0;
    call('draft', ASK.slice(0, typed), (v) => ui.setDraft(v));
    call('caret', t < T.send, (v) => ui.setCaret(v));
    call('armed', typed > 0, (v) => ui.setSendArmed(v));
    call('newChat', R.emphDecel(1 - R.seg(t, T.send, T.send + 0.4)).toFixed(4), (v) => ui.setNewChat(+v));
    call('title', t >= T.send ? ASK : 'New chat', (v) => ui.setTitle(v));
    call('sending', t >= T.send && t < T.settled, (v) => ui.setSending?.(v));
    const on = MODELS.find(([a, b]) => t >= a && t < b);
    call('model', on ? on[2].name : '', () => ui.setModel?.(on ? on[2] : null));
    const at = SWAPS.reduce((best, s) => (Math.abs(t - s) < Math.abs(t - best) ? s : best), SWAPS[0]);
    const mo = t < at ? 1 - 0.85 * R.seg(t, at - 0.14, at) : 1 - 0.85 * (1 - R.seg(t, at, at + 0.14));
    const ms = t < at ? 1 : R.lerp(1.08, 1, R.outCubic(R.seg(t, at, at + 0.4)));
    call('fx', `${mo.toFixed(3)}|${ms.toFixed(3)}`, () => ui.setModelFx?.(+mo.toFixed(3), +ms.toFixed(3)));
    if (ui.send) { const p = R.seg(t, T.send - 0.08, T.send + 0.1); w.css(ui.send, 'transform', p <= 0 || p >= 1 ? '' : `scale(${(1 - 0.04 * Math.sin(Math.PI * p)).toFixed(4)})`); }
  }

  // the sonar label: switchActivityLine (the running step, else "connecting to {name}" / "switching to {label}"),
  // then the step the code is on
  function activity(t) {
    const run = (times, f) => { const j = times.findIndex((a) => t >= a.in && t < a.done); return j < 0 ? null : f(j); };
    if (t >= T.site.sw && t < T.site.ok) return `connecting to ${SITE.name}`;
    if (t >= T.site.ok && t < T.site.end) return run(T.site.steps, (j) => SITE.steps[j][0]) || 'working on a launch video';
    for (let i = 0; i < T.media.length; i++) if (t >= T.media[i].sw && t < T.media[i].done) return `switching to ${SWITCHES[i].label}`;
    if (t >= T.code.at && t < T.code.end) return run(T.code.steps, (j) => `${CODE.steps[j][0].toLowerCase()} ${CODE.steps[j][2]}`) || 'cutting the film in code';
    return 'working on a launch video';
  }

  // ---- the scroll: a target per structure change, measured with the structure that change leaves, each one gliding
  // the column from wherever the last left it (so the scroll is one continuous, scrubbable curve). The bottom pin
  // follows new content, but never past the node the change is about: a new pill and its pending surface live in
  // the block ABOVE the results already landed, so the pin stops where that pill still sits under the top fade.
  const KEEP = new Map([[T.row, n.user], [T.site.sw, n.site.pill], [T.site.ok, n.site.pill], ...T.site.steps.map((a) => [a.in, n.site.pill]),
    [T.site.shots[0], n.site.pill], ...T.media.flatMap((m, i) => [[m.sw, n.media[i].sw.pill], [m.ok, n.media[i].sw.pill], [m.done, n.media[i].fig]]),
    ...T.code.steps.map((a) => [a.in, n.codeList]), [T.say, n.say], [T.body, n.say], [T.film, n.say]]);
  const EVENTS = [...KEEP.keys()].sort((a, b) => a - b);
  const topIn = (node) => { let y = 0, x = node; while (x && x !== n.inner) { y += x.offsetTop; x = x.offsetParent; } return y; };
  let M = null;
  function measure(t) {
    const V = el.clientHeight, W = n.inner.clientWidth;
    if (!V || !W) return null;
    if (M && M.V === V && M.W === W) return M;
    structure(T.send + 1e-3);
    const pin = topIn(n.user) - FADE;
    let prev = pin;
    const marks = EVENTS.map((a) => {
      structure(a + 1e-3);
      const tg = Math.max(pin, Math.min(n.inner.offsetHeight - V, topIn(KEEP.get(a)) - FADE)), dist = Math.abs(tg - prev), far = dist > FAR;
      prev = tg;
      return [a, tg, far ? Math.min(0.9, Math.max(GLIDE, dist / 600)) : GLIDE, far ? R.inOut : R.standard];
    });
    structure(t);
    return (M = { V, W, pin, marks });
  }
  function scroll(t) {
    const m = t >= T.send ? measure(t) : null;
    let s = m ? m.pin : 0;
    if (m) for (const [a, tg, d, ease] of m.marks) { if (t < a) break; s = R.lerp(s, tg, ease(R.seg(t, a, a + d))); }
    w.css(n.inner, 'transform', Math.abs(s) < 0.05 ? '' : `translateY(${(-s).toFixed(2)}px)`);
  }

  function render(tIn) {
    const t = Math.max(0, Math.min(T.dur, tIn));
    composer(t);
    structure(t);
    const shown = 1 - R.emphDecel(1 - R.seg(t, T.send, T.send + 0.4));   // the rows come up as main's new-chat tail collapses
    w.css(el, 'opacity', shown >= 1 ? '' : shown.toFixed(3));
    R.rise(w, n.bot, t, T.row, 0.2, 4);
    w.text(n.think, activity(t));
    w.css(n.think, 'opacity', t < T.settled ? '' : (1 - R.seg(t, T.settled, T.settled + 0.2)).toFixed(3));
    const dimOf = (i) => {   // eases to its depth's opacity as each newer pill rises
      let d = 1;
      for (let k = i + 1, depth = 1; k < SW.length; k++, depth++) d = R.lerp(d, DEPTH[Math.min(depth, 2)], R.outCubic(R.seg(t, SW[k], SW[k] + 0.3)));
      return d;
    };
    R.pill(w, n.site, t, T.site.sw, T.site.ok, `Connecting to ${SITE.name}`, `Connected to ${SITE.name}`, dimOf(0));
    R.steps(w, n.site.rows, t, T.site.steps, SITE.steps);
    R.shots(w, n.shots, t, T.site.shots);
    n.media.forEach((x, i) => {
      const m = T.media[i], d = x.d;
      R.pill(w, x.sw, t, m.sw, m.ok, `Switching to ${d.label}`, `Switched to ${d.label}`, dimOf(i + 1));
      R.pending(w, x, t, m.ok);
      R.reveal(w, x, t, m.done);
      if (x.vid) R.video(x.vid, t, m.done, 0, MEDIA.h3.len, t < T.film);
      else if (x.canvas) viewer.render(ORBIT0 + ORBIT * Math.max(0, t - m.done));
    });
    R.codeSteps(w, n.code, t, T.code.steps, CODE.steps);
    const c = Math.max(0, Math.min(SAY.length, Math.floor((t - (T.say + 0.06)) * 70 + 1e-6)));
    w.text(n.sayVis, SAY.slice(0, c)); w.text(n.sayHid, SAY.slice(c));
    w.css(n.caret, 'display', c < SAY.length ? '' : 'none');
    R.rise(w, n.body, t, T.body, 0.3, 4);
    R.reveal(w, n.film, t, T.film);
    R.video(n.film.vid, t, T.film, MEDIA.film.from, MEDIA.film.len, true);
    scroll(t);
  }

  // what the ad's camera frames at chat time t (null before the send: the ad frames the greeting)
  function focusAt(t) {
    if (t < T.send) return null;
    if (t < T.site.ok) return [n.user, n.attach, t >= T.site.sw && n.site.pill];
    const landed = (pairs) => pairs.filter(([a]) => t >= a).map(([, node]) => node);
    if (t < T.media[0].sw) return [n.site.pill, n.site.nest, ...landed([[T.site.shots[0], n.shots.root]])];
    for (let i = 0; i < T.media.length; i++) {
      const m = T.media[i], x = n.media[i];
      if (t >= m.end) continue;
      if (t < m.ok) return [x.sw.pill];
      if (t < m.done) return [x.sw.pill, x.sw.nest, x.pend];
      return [x.fig];
    }
    if (t < T.say) return [...landed(T.code.steps.map((a, j) => [a.in, n.code[j].li])), ui.composer];
    if (t < T.push) return [n.say, n.body, n.film.fig];
    return [n.film.fig];
  }
  render(0);
  return { T, DUR: T.dur, el, render, focusAt, viewer, nodes: n, reset() { memo = new Map(); last = {}; M = null; } };
}
