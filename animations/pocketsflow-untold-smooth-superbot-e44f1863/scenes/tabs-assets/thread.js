// The thread for "make a launch video for Pocketsflow": the user attaches the brand mascot and asks once, superbot
// answers with one line, then hands each step to the model built for it, strictly one after another:
//   Gemini 3.1 Pro reads pocketsflow.com and storyboards -> Meshy 7.1 turns the mascot into a 3D model -> Hailuo 2.3
//   animates that model -> ElevenLabs scores it -> Claude Opus 5.5 cuts it in Remotion -> superbot renders and plays.
// Each step is its app's own surface (steps/<id>.js). While a step runs its card is open; when the next step starts it
// folds into a one-line receipt. The composer's model chip follows the step that is running.
// Smoothness: nothing is measured mid-motion. Every block's height is an eased function of t (open, then fold), the
// thread is bottom-anchored on those heights, so the whole column glides with them; nothing pops, nothing jumps.
import { clamp, lerp, seg, outExpo, inOutSine, inOutCubic, rise, esc } from '../../lib.js';
import gemini from './steps/gemini.js';
import meshy from './steps/meshy.js';
import hailuo from './steps/hailuo.js';
import eleven from './steps/eleven.js';
import opus from './steps/opus.js';
import render from './steps/render.js';
import { mountChip, renderChip } from './chip.js';

export const ASK = 'make a launch video for Pocketsflow';
const INTRO = 'On it. Each step goes to the model built for it.';
export const T = { attach: 0.85, type0: 1.3, typeEnd: 2.35, send: 2.65, user: 3.05, intro: 3.4, steps: 3.85 };
// a card folds over exactly the window the next one opens in, on the same curve, so the column height changes
// monotonically (no fold-then-open yo-yo); the old content clears early and the new content lands late, so they never
// ghost over each other
const SWAP = 1.0, LEAD = 0.15, FADE = 22;
let acc = T.steps;
export const STEPS = [gemini, meshy, hailuo, eleven, opus, render].map((m) => { const s = { m, t0: acc, t1: acc + m.dur }; acc += m.dur; return s; });
export const END = acc;

const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const CHECK = '<svg class="rx-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
export const tile = (app, logo) => `<span class="qc-tile qc-t-${app}">${app === 'superbot' ? '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>' : `<img src="${brand(logo)}" alt=""/>`}</span>`;

export function mountThread(hub) {
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  feed.replaceChildren(inner);
  const add = (html) => inner.appendChild(el(html));
  const ctx = { img, brand, el, esc, tile };

  const user = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><img class="u-att" src="${img('gen/mascot-attach.jpg')}" alt=""/><div class="m-text">${esc(ASK)}</div></div></div>`);
  const bot = add(`<div class="msg qc-m"><span class="avatar sb"><img src="${new URL('./mark-clean.svg', import.meta.url).href}" alt=""/></span><div class="m-main"><div class="qc-say"><span class="say-on"></span><span class="say-off">${esc(INTRO)}</span></div></div></div>`);
  const main = bot.querySelector('.m-main');
  const steps = STEPS.map((s) => {
    const inst = s.m.build(ctx);
    const block = el(`<div class="st st-${s.m.id}"><div class="st-row">${CHECK}${tile(s.m.app, s.m.logo)}<b>${esc(s.m.model)}</b><span>${esc(s.m.summary)}</span></div><div class="st-card"></div></div>`);
    block.querySelector('.st-card').appendChild(inst.el);
    main.appendChild(block);
    return { ...s, inst, block, row: block.querySelector('.st-row'), card: block.querySelector('.st-card'), H: 0 };
  });

  const composer = hub.querySelector('.composer');
  const fade = el('<div class="qc-v4fade"></div>');
  fade.style.setProperty('--qc-fade', FADE + 'px');
  composer.parentNode.insertBefore(fade, composer);
  hub.classList.add('qc-v4');
  const ph = hub.querySelector('.rc-ph');
  const att = el(`<div class="rc-att"><div class="rc-att-in"><img src="${img('gen/mascot-attach.jpg')}" alt=""/><span><b>mascot.png</b><small>PNG image</small></span></div></div>`);
  ph.parentNode.insertBefore(att, ph);
  const c = {
    hub, feed, inner, user, bot, say: bot.querySelector('.say-on'), sayBox: bot.querySelector('.qc-say'), steps, composer, fade, ph, att,
    phText: ph.textContent, lastPh: null, send: hub.querySelector('.rc-send'),
    chip: mountChip(hub.querySelector('.rc-plat'), STEPS.map((s) => s.m), brand),
    ready: Promise.all(steps.map((s) => s.inst.ready).filter(Boolean)),
  };
  return c;
}

// natural heights at rest, read (with the eased heights cleared) until the fonts have landed. Layout only:
// transforms never affect these, so every frame after that is a pure function of t.
function measure(c) {
  if (c.measured) return;
  const grow = [c.sayBox, ...c.steps.map((s) => s.block)];
  grow.forEach((n) => { n.style.height = ''; });
  c.SH = c.sayBox.scrollHeight;
  c.steps.forEach((s) => { s.H = s.card.firstElementChild.offsetHeight; s.R = s.row.offsetHeight; });
  if (!document.fonts || document.fonts.status === 'loaded') c.measured = true;
}

/** attachment strip height in the composer at t (grows in when the file is dropped, folds away on send) */
export const attH = (t) => 54 * inOutCubic(seg(t, T.attach, T.attach + 0.55)) * (1 - inOutCubic(seg(t, T.send, T.send + 0.45)));

function renderComposer(c, t) {
  const typing = t >= T.type0 && t < T.send;
  const n = Math.round(ASK.length * seg(t, T.type0, T.typeEnd));
  const ph = typing ? `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>` : esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', typing);
  const press = Math.sin(Math.PI * seg(t, T.send - 0.1, T.send + 0.2));
  c.send.style.transform = press > 0 ? `scale(${(1 - 0.14 * press).toFixed(4)})` : 'none';
  c.att.style.height = attH(t).toFixed(2) + 'px';
  rise(c.att.firstElementChild, outExpo(seg(t, T.attach + 0.15, T.attach + 0.8)) * (1 - seg(t, T.send, T.send + 0.25)), 8);
}

function renderSteps(c, t) {
  c.steps.forEach((s, i) => {
    const last = i === c.steps.length - 1;
    const open = inOutCubic(seg(t, s.t0 - LEAD, s.t0 - LEAD + SWAP));
    const fold = last ? 0 : inOutCubic(seg(t, s.t1 - LEAD, s.t1 - LEAD + SWAP));
    const h = lerp(s.H * open, s.R, fold);
    s.block.style.height = h.toFixed(2) + 'px';
    s.block.style.marginTop = (10 * open).toFixed(2) + 'px';
    // the folding card is rolled up by its own box (clipped, fading with the fold), never a hole in the column
    const cardIn = outExpo(seg(t, s.t0 + 0.15, s.t0 + 0.95)) * (1 - clamp(fold * 1.3));
    rise(s.card, cardIn, 18);
    rise(s.row, last ? 0 : outExpo(seg(t, s.t1 - LEAD + 0.5 * SWAP, s.t1 - LEAD + SWAP + 0.15)), 6);
    // every step renders every frame: each one parks its own media / GL outside its window
    s.inst.render(t - s.t0, s.t1 - s.t0 + (last ? 99 : SWAP));
  });
}

function renderScroll(c, t) {
  const fb = c.feed.getBoundingClientRect(), cb = c.composer.getBoundingClientRect();
  if (!fb.height) return;
  const k = c.feed.clientHeight / fb.height;
  const ct = getComputedStyle(c.composer).transform;
  const m42 = ct && ct !== 'none' ? new DOMMatrix(ct).m42 : 0;
  const padT = parseFloat(getComputedStyle(c.feed).paddingTop);
  const viewH = (cb.top - fb.top) * k - m42 - padT - FADE;
  const under = Math.max(0, (fb.bottom - cb.top) * k + m42);
  c.fade.style.height = (under + FADE).toFixed(2) + 'px';
  c.feed.style.clipPath = `inset(0px 0px ${under.toFixed(2)}px 0px)`;
  c.inner.style.transform = `translate3d(0,${(viewH - c.inner.offsetHeight).toFixed(2)}px,0)`;
}

export function renderThread(c, t) {
  measure(c);
  renderComposer(c, t);
  renderChip(c.chip, t, STEPS);
  rise(c.user, outExpo(seg(t, T.user, T.user + 0.7)), 16);
  c.sayBox.style.height = (c.SH * inOutCubic(seg(t, T.intro - 0.1, T.intro + 0.45))).toFixed(2) + 'px';
  const n = Math.round(INTRO.length * clamp((t - T.intro) * 70 / INTRO.length));
  if (n !== c.sayN) { c.sayN = n; c.say.textContent = INTRO.slice(0, n); c.say.nextElementSibling.textContent = INTRO.slice(n); }
  renderSteps(c, t);
  renderScroll(c, t);
}

/** the last step's player in site px, and how far the camera should push into it (0..1) */
export function focus(c, t, site, boxIn) {
  const r = c.steps[c.steps.length - 1];
  const a = r.inst.focus ? r.inst.focus(t - r.t0) : 0;
  return a > 0 ? { a, box: boxIn(r.inst.player, site) } : null;
}
