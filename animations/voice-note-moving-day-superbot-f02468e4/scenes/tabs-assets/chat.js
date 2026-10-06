// The five-switch moving-day chat (voice-note-moving-day, forked from every-model-one-chat route=superbot). The ask
// is a 0:38 voice note: it finishes recording in the composer with the 0:52 walkthrough clip attached and is sent;
// superbot routes it (its routing chip and the composer's model picker follow the model): ElevenLabs Scribe
// transcribes it while the bubble plays and pulls three tasks (./beats/scribe-note.js), Gemini watches the
// walkthrough and lists what moves (./beats/gemini-walk.js), DeepSeek V4 Flash reads the lease and 3 years of email
// (./beats/deepseek-lease.js), Claude Opus 5.5 writes the deposit email (./beats/claude-email.js), then superbot
// switches itself to Superbot, which does it for real in TaskRabbit, USPS and Gmail (./beats/move-book.js). The thread
// is bottom-anchored so every message rises out of the composer.
// renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts the Pages cache.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import scribeNote from './beats/scribe-note.js?v=1';
import geminiWalk from './beats/gemini-walk.js?v=1';
import deepseekLease from './beats/deepseek-lease.js?v=1';
import claudeEmail from './beats/claude-email.js?v=1';
import moveBook from './beats/move-book.js?v=1';
import { waveHTML, waveBars, mmss } from './beats/kit.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('./img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 0.05; // no settle on the empty state: the ask starts typing at once

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  scribe: { name: 'ElevenLabs Scribe', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  claude: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the voice note: what it says (Scribe transcribes it), how long it is, and the clip sent with it
export const VOICE = { said: "we're moving to the new place saturday. sort the movers, change our address and get the deposit back", dur: 38, recFrom: 35, bars: 34 };
const CLIP = { img: 'walk-thumb.jpg', dur: '0:52', name: 'walkthrough.mov' };

const ASKS = [
  { app: 'scribe', mod: scribeNote, chips: [['scribe', 'Switching to ElevenLabs Scribe']], ask: VOICE.said, voice: true },
  { app: 'gemini', mod: geminiWalk, chips: [['gemini', 'Switching to Gemini']], ask: null },
  { app: 'deepseek', mod: deepseekLease, chips: [['deepseek', 'Switching to DeepSeek V4 Flash']], ask: null },
  { app: 'claude', mod: claudeEmail, chips: [['claude', 'Switching to Claude Opus 5.5']], ask: null },
  { app: 'superbot', mod: moveBook, chips: [['superbot', 'Switched to Superbot']], ask: null },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      // the voice note's last three seconds record, it stops, and it is sent
      k.typeEnd = s + 1.15;
      k.send = k.typeEnd + 0.16;
      k.sw = k.send + 0.22;   // superbot's routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.06;        // superbot carries on without being asked
    }
    // each chip lands, moves the model picker to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.12, done: at + 0.42 }; at = c.done + 0.1; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.06;  // the model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(ASKS);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.05;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    // the voice note lands as the walkthrough clip over a playing voice pill (play, waveform, time)
    const att = k.voice ? `<div class="qc-uatt"><span class="qc-uvid"><img src="${img(CLIP.img)}" alt="Walkthrough video of the old apartment"/><i></i><small>${CLIP.name}</small><b>${CLIP.dur}</b></span></div>` : '';
    const text = k.voice
      ? `<div class="m-text qc-vn" aria-label="${mmss(VOICE.dur)} voice note: ${esc(k.ask)}"><i class="qc-vbtn"></i><span class="qc-vw">${waveHTML(VOICE.bars, '')}<i class="qc-vhead"></i></span><b class="qc-vt">${mmss(VOICE.dur)}</b></div>`
      : `<div class="m-text">${esc(k.ask)}</div>`;
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div>${att}${text}</div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  // the walkthrough clip sits attached in the composer while the note records; the send carries it into the thread
  const first = BEATS.find(({ k }) => k.voice);
  const catt = first ? el(`<div class="qc-catt"><span class="qc-cvid"><img src="${img(CLIP.img)}" alt=""/><i></i><b>${CLIP.dur}</b></span></div>`) : null;
  if (catt) ph.parentNode.insertBefore(catt, ph);
  const vn = beats[0].u && beats[0].u.querySelector('.qc-vn');
  return {
    catt, attSend: first ? first.k.send : 0,
    recBars: waveBars(48).map((h) => `<i style="height:${(h * 100).toFixed(0)}%"></i>`),
    vn: vn && { btn: vn.querySelector('.qc-vbtn'), bars: [...vn.querySelectorAll('.qc-vw i:not(.qc-vhead)')], head: vn.querySelector('.qc-vhead'), time: vn.querySelector('.qc-vt'), lit: -1, last: '' },
    hub, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b && b.k.voice) {
    // recording: the timer runs 0:35 to 0:38, the bars grow with it, then it stops and waits for the send
    const p = seg(t, b.k.s, b.k.typeEnd);
    const sec = Math.min(VOICE.dur, Math.floor(lerp(VOICE.recFrom, VOICE.dur + 0.99, p)));
    const live = Math.round(48 * (VOICE.recFrom + p * (VOICE.dur - VOICE.recFrom)) / VOICE.dur);
    const stop = t >= b.k.typeEnd;
    ph = `<span class="qc-rec${stop ? ' qc-stop' : ''}"><i class="qc-dot"></i><b>${mmss(sec)}</b><span class="qc-rw">${c.recBars.slice(0, live).join('')}</span><span class="qc-rlab">${stop ? 'Voice note' : 'Recording'}</span></span>`;
  } else if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  if (c.catt) {
    const gone = seg(t, c.attSend - 0.04, c.attSend + 0.12);
    // the row folds away as the photos leave with the send, so the composer settles at its empty height
    c.catt.style.opacity = (1 - gone).toFixed(3);
    c.catt.style.height = ((1 - inOutCubic(gone)) * 62).toFixed(2) + 'px';
    c.catt.style.marginBottom = ((1 - inOutCubic(gone)) * 6).toFixed(2) + 'px';
  }
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

// the sent voice note plays in step with Scribe's waveform (play0..play1 of the first beat)
function renderVoice(c, t) {
  if (!c.vn) return;
  const T = c.beats[0].k.T;
  const p = seg(t, T.play0, T.play1);
  const playing = t >= T.play0 && t < T.play1;
  c.vn.btn.classList.toggle('on', playing);
  const lit = Math.round(p * c.vn.bars.length);
  if (lit !== c.vn.lit) { c.vn.bars.forEach((b, i) => b.classList.toggle('on', i < lit)); c.vn.lit = lit; }
  c.vn.head.style.left = (p * 100).toFixed(2) + '%';
  c.vn.head.style.opacity = t >= T.play0 - 0.05 ? '1' : '0';
  const s = playing ? mmss(p * VOICE.dur) : mmss(VOICE.dur);
  if (s !== c.vn.last) { c.vn.time.textContent = s; c.vn.last = s; }
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderVoice(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
