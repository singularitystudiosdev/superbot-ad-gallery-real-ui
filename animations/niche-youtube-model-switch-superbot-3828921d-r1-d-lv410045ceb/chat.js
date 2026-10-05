// The superbot chat: the attached video and the ask, four switch pills, Gemini's watch-and-chapter card, Claude's
// details panel (the real app's code-panel grammar: video-details, details.md, an honest clock, Review / Add to upload),
// Nano Banana Pro's frame-to-thumbnail card, the YouTube Studio hand-off checklist, and the composer whose model chip
// follows each switch. Native 1920x1080 px; render(t) writes every moving value, nothing transitions.
import { seg, lerp, op, esc, enter, spinner, outCubic, inOutCubic, press, el } from './lib.js';
import { ICON } from './icons.js';
import { ASK_LINES, FILE, VIDEO, CHAPTERS, THUMB_FRAME, DETAILS, DETAILS_DONE, THUMB, POSTED, SAY, MODELS, ACCOUNT, EMAIL, SCOPES } from './data.js';
import { T } from './timing.js';

const ms = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const LUCIDE = {
  plus: '<path d="M5 12h14M12 5v14"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};
const lu = (n, cls = 'lu') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${LUCIDE[n]}</svg>`;
const CHECK = (cls = 'ok') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>`;
const tile = (k) => `<span class="tile t-${k}">${MODELS[k].emoji ? `<i class="emo">${MODELS[k].emoji}</i>` : `<img src="${MODELS[k].icon}" alt="">`}</span>`;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const status = () => `<span class="st"><span class="spin"></span>${CHECK()}</span>`;
const KEYS = ['gemini', 'claude', 'banana', 'youtube'];

const switchPill = (k, verb) => `<div class="sw" data-k="sw-${k}">${tile(k)}<span class="swl">${verb} ${esc(MODELS[k].name)}</span>${status()}</div>`;
const who = (k, small) => `<div class="who" data-k="who-${k}">${tile(k)}<b>${esc(MODELS[k].name)}</b><small>${small}</small></div>`;
const say = (k) => `<div class="say" data-k="say-${k}">${esc(SAY[k])}</div>`;

/** the file the ask is about, attached above it the way the composer sends an attachment */
const attachment = () => `<div class="att" data-k="att"><div class="att-card">
  <span class="att-th"><img src="${FILE.poster}" alt=""><i>${VIDEO.length}</i></span>
  <span class="att-tx"><b>${esc(FILE.name)}</b><small>${esc(FILE.meta)}</small></span></div></div>`;

function gemCard() {
  const frames = CHAPTERS.map((c, i) => `<img class="g-fr" data-k="g-fr" src="${c.img}" alt="" style="z-index:${i + 1}">`).join('');
  const ticks = CHAPTERS.slice(1).map((c) => `<span class="g-tick" data-k="g-tick" style="left:${((c.s / VIDEO.lengthS) * 100).toFixed(2)}%"></span>`).join('');
  const pick = `<span class="g-tick up" data-k="g-pickt" style="left:${((THUMB_FRAME.s / VIDEO.lengthS) * 100).toFixed(2)}%"><i>${THUMB_FRAME.at} thumbnail</i></span>`;
  const rows = CHAPTERS.map((c) => `<div class="g-ch" data-k="g-ch"><span class="g-at">${c.at}</span><span class="g-cn">${esc(c.name)}</span></div>`).join('');
  return `<div class="card gem" data-k="gem">
    <div class="g-vid">
      <div class="g-player">${frames}<span class="g-dur">${VIDEO.length}</span><span class="g-prog" data-k="g-prog"></span></div>
      <div class="g-meta"><div class="g-title">${esc(FILE.name)}</div>
        <div class="g-wrow"><span data-k="g-wst">${status()}</span><span class="g-wl" data-k="g-wl">Watching the video</span><span class="g-time" data-k="g-time">0:00</span></div>
        <div class="g-track"><span class="g-fill" data-k="g-fill"></span>${ticks}${pick}<span class="g-knob" data-k="g-knob"></span></div>
      </div>
    </div>
    <div class="g-rh"><b>Chapters</b><span class="g-rr" data-k="g-rr">0 of 6</span></div>
    <div class="g-chs">${rows}</div>
  </div>`;
}

// details.md, one line per row; "Title:" and the chapter timestamps are highlighted as the editor would
const ROW_H = 37;
const STARTS = DETAILS.reduce((a, l, i) => (a.push(i ? a[i - 1] + DETAILS[i - 1].length + 1 : 0), a), []);
const TOTAL = STARTS[STARTS.length - 1] + DETAILS[DETAILS.length - 1].length;
const hl = (s) => {
  let m = /^(Title|Description):/.exec(s);
  if (m) return `<i class="k">${esc(m[0])}</i>${esc(s.slice(m[0].length))}`;
  m = /^\d+:\d\d/.exec(s);
  return m ? `<i class="ts">${esc(m[0])}</i>${esc(s.slice(m[0].length))}` : esc(s);
};

function detailsPanel() {
  return `<div class="card cx" data-k="cx">
    <div class="x-hd"><span class="x-proj">${lu('file', 'x-ico')}<b>video-details</b></span><span class="x-br">6 chapters</span>
      <em class="x-state" data-k="x-state"><span class="spin x-spin"></span>${CHECK('x-tk')}<span data-k="x-sl">Working</span><span class="x-clk" data-k="x-clk">0s</span></em></div>
    <div class="x-tabs"><span class="x-tab on"><b>MD</b>details.md</span></div>
    <div class="x-bd">${DETAILS.map((l, i) => `<div class="x-l" data-k="x-l"><u>${i + 1}</u><code><span class="x-v"></span><i class="x-caret"></i></code></div>`).join('')}</div>
    <div class="x-ft" data-k="x-ft"><span class="x-sum">${lu('chevR', 'x-chev')}${CHECK('x-dn')}<b data-k="x-nf">Writing</b></span>
      <span class="x-btns"><i class="x-b">Review</i><i class="x-b x-pri" data-k="x-pri">Add to upload</i></span></div>
  </div>`;
}

function bananaCard() {
  return `<div class="card nb" data-k="nb">
    <div class="n-row">
      <figure class="n-fig"><div class="n-img"><img src="${THUMB_FRAME.img}" alt=""><span class="n-badge">${THUMB_FRAME.at}</span></div><figcaption>Frame at ${THUMB_FRAME.at}</figcaption></figure>
      <span class="n-arrow" data-k="n-arrow">${lu('arrow', 'n-ar')}</span>
      <figure class="n-fig"><div class="n-img n-out"><span class="n-shim" data-k="n-shim"></span><img class="n-th" data-k="n-th" src="${THUMB.img}" alt=""></div><figcaption>Thumbnail</figcaption></figure>
    </div>
    <div class="n-st"><span data-k="n-stt">${status()}</span><b data-k="n-sl">Generating the thumbnail</b><span class="n-spec" data-k="n-spec">${esc(THUMB.spec)}</span></div>
  </div>`;
}

/** Google's OAuth consent card, as the source spot shows it in the chat: the pointer taps Continue */
function consentCard() {
  return `<div class="card gc" data-k="gc">
    <div class="gc-top"><img src="brand/google-g.svg" alt=""><span>Sign in with Google</span></div>
    <div class="gc-body">
      <div class="gc-title">superbot wants access to your Google Account</div>
      <span class="gc-acct"><i class="gc-av">S</i>${esc(EMAIL)}${ms('expand-more', 'gc-dd')}</span>
      <div class="gc-sel">Select what <b>superbot</b> can access</div>
      ${SCOPES.map((x) => `<div class="gc-row"><img src="${MODELS.youtube.icon}" alt=""><span>${esc(x)}</span><i class="gc-cb">${ms('check')}</i></div>`).join('')}
      <div class="gc-trust"><b>Make sure you trust superbot</b><br>You may be sharing sensitive info with this site or app. Learn how superbot will handle your data by reviewing its <a>privacy policy</a> and <a>Terms of Service</a>.</div>
      <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go" data-k="gc-go">Continue</span></div>
    </div>
  </div>`;
}

function postedCard() {
  const ic = { avatar: '<span class="p-ic p-av">S</span>', youtube: `<span class="p-ic p-yt"><img src="${MODELS.youtube.icon}" alt=""></span>`,
    chart: `<span class="p-ic p-blue">${ms('bar-chart')}</span>` };
  return `<div class="card posted" data-k="posted">${POSTED.map((p) => `<div class="p-row" data-k="p-row">${ic[p.icon]}<span class="p-tx">${p.text}</span>
    <span class="st p-st"><span class="spin"></span>${CHECK()}</span></div>`).join('')}<div class="p-shot" data-k="pshot"></div></div>`;
}

function composerRow(lit, onlySuper) {
  const sb = `<span class="pm" data-k="${onlySuper ? 'hpm' : 'pm-superbot'}"><svg class="sbcat" viewBox="10 16 80 74" aria-hidden="true">${['#00e5c3|-2.4', '#c026d3|2.4', '#ececec|0'].map((l) => { const [c, d] = l.split('|'); return `<g transform="translate(${d} ${d})" fill="${c}"><path fill-rule="evenodd" d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32ZM35 47a8 11 0 1 0 0.01 0ZM65 47a8 11 0 1 0 0.01 0Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32ZM86 46V28Q86 20 79 21Q72 24 64 32Z"/></g>`; }).join('')}</svg><span>Superbot</span></span>`;
  const chip = (k) => `<span class="pm" data-k="pm-${k}"><span class="pi">${tile(k)}</span><span>${esc(MODELS[k].name)}</span></span>`;
  return `<div class="row">
      <span class="plus">${lu('plus')}</span>
      <span class="super">SUPER<i class="tg"><b></b>OFF</i></span>
      <span class="plat"><span class="pms">${sb}${onlySuper ? '' : KEYS.map(chip).join('')}</span>${lu('chev')}</span>
      <span class="computer">${lu('monitor')}</span>
      <span class="mic">${lu('mic')}</span>
      <span class="send${lit ? ' lit' : ''}" ${lit ? 'data-k="hsend"' : ''}>${lu('up')}</span>
    </div>`;
}

/** the home screen, as the real app opens: the mark and the greeting over a centred composer that already holds the
 *  attached video and the typed ask (frame 0); it sends, the greeting lifts away and the composer docks */
function home() {
  return `<div class="hub" data-k="hub">
    <div class="hub-hero" data-k="hero"><img class="hub-cat" src="brand/mark-clean.svg" alt=""><h1>Good evening. Where do we go?</h1></div>
    <div class="composer hubc" data-k="hubc"><div class="pill">
      <div class="hc-body" data-k="hcb"><div class="hc-in" data-k="hci">
        <div class="hc-att"><span class="att-th"><img src="${FILE.poster}" alt=""><i>${VIDEO.length}</i></span><span class="att-tx"><b>${esc(FILE.name)}</b><small>${esc(FILE.meta)}</small></span></div>
        <div class="hc-txt">${ASK_LINES.map(esc).join('<br>')}<i class="hc-caret" data-k="hcc"></i></div>
      </div><div class="ph hc-ph" data-k="hcph">How can superbot help you today?</div></div>
      ${composerRow(true, true)}
    </div></div>
  </div>`;
}

function composer() {
  const chip = (k) => `<span class="pm" data-k="pm-${k}"><span class="pi">${tile(k)}</span><span>${esc(MODELS[k].name)}</span></span>`;
  // before the first switch the chip is superbot itself (the hub's cat mark, eyes cut out)
  const sb = `<span class="pm" data-k="pm-superbot"><svg class="sbcat" viewBox="10 16 80 74" aria-hidden="true">${['#00e5c3|-2.4', '#c026d3|2.4', '#ececec|0'].map((l) => { const [c, d] = l.split('|'); return `<g transform="translate(${d} ${d})" fill="${c}"><path fill-rule="evenodd" d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32ZM35 47a8 11 0 1 0 0.01 0ZM65 47a8 11 0 1 0 0.01 0Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32ZM86 46V28Q86 20 79 21Q72 24 64 32Z"/></g>`; }).join('')}</svg><span>Superbot</span></span>`;
  return `<div class="composer"><div class="pill">
    <div class="ph">How can superbot help you today?</div>
    <div class="row">
      <span class="plus">${lu('plus')}</span>
      <span class="super">SUPER<i class="tg"><b></b>OFF</i></span>
      <span class="plat"><span class="pms">${sb}${KEYS.map(chip).join('')}</span>${lu('chev')}</span>
      <span class="computer">${lu('monitor')}</span>
      <span class="mic">${lu('mic')}</span>
      <span class="send">${lu('up')}</span>
    </div>
  </div></div>`;
}

export function mountChat(root) {
  const sec = el(`<section id="chat" class="scene"><div class="cam" data-k="cam">
    <div class="feed" data-k="feed"><div class="col">
      ${attachment()}
      <div class="ask" data-k="ask"><div class="bubble">${ASK_LINES.map(esc).join('<br>')}</div></div>
      ${switchPill('gemini', 'Switching to')}
      ${who('gemini', 'in superbot')}
      ${say('gemini')}
      ${gemCard()}
      ${switchPill('claude', 'Switching to')}
      ${who('claude', 'in superbot')}
      ${say('claude')}
      ${detailsPanel()}
      ${switchPill('banana', 'Switching to')}
      ${who('banana', 'in superbot')}
      ${say('banana')}
      ${bananaCard()}
      ${switchPill('youtube', 'Connecting to')}
      ${consentCard()}
      ${who('youtube', 'connected')}
      ${say('youtube')}
      ${postedCard()}
      <div class="tail"></div>
    </div></div>
    <div class="fade"></div>
    ${composer()}
  </div><div class="edge"></div>${home()}<div class="dim" data-k="dim"></div>
    <svg class="cursor" data-k="ptr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg></section>`);
  root.appendChild(sec);
  const q = (k) => sec.querySelector(`[data-k="${k}"]`);
  const qa = (k) => [...sec.querySelectorAll(`[data-k="${k}"]`)];
  const by = (p) => Object.fromEntries(KEYS.map((k) => [k, q(`${p}-${k}`)]));
  const n = {
    sec, cam: q('cam'), feed: q('feed'), att: q('att'), ask: q('ask'),
    hub: q('hub'), hero: q('hero'), hubc: q('hubc'), hcb: q('hcb'), hci: q('hci'), hcph: q('hcph'), hcc: q('hcc'), hsend: q('hsend'),
    comp: sec.querySelector('.composer'), fade: sec.querySelector('.fade'),
    sw: by('sw'), who: by('who'), say: by('say'),
    gem: q('gem'), gFr: qa('g-fr'), gTicks: qa('g-tick'), gPickT: q('g-pickt'), gChs: qa('g-ch'), gProg: q('g-prog'), gFill: q('g-fill'), gKnob: q('g-knob'),
    gWst: q('g-wst'), gWl: q('g-wl'), gTime: q('g-time'), gRr: q('g-rr'),
    cx: q('cx'), xState: q('x-state'), xSl: q('x-sl'), xClk: q('x-clk'), xFt: q('x-ft'), xNf: q('x-nf'), xPri: q('x-pri'), xBd: sec.querySelector('.x-bd'),
    nb: q('nb'), nShim: q('n-shim'), nTh: q('n-th'), nStt: q('n-stt'), nSl: q('n-sl'), nSpec: q('n-spec'), nArrow: q('n-arrow'),
    posted: q('posted'), pRows: qa('p-row'), pshot: q('pshot'), gc: q('gc'), gcGo: q('gc-go'), ptr: q('ptr'), dim: q('dim'),
    pm: { superbot: q('pm-superbot'), ...by('pm') },
  };
  n.xLines = qa('x-l').map((row) => ({ row, v: row.querySelector('.x-v'), c: row.querySelector('.x-caret'), shown: -1 }));
  return n;
}

/** the home composer's dock and the thread's offsets (offsetTop is unaffected by the transforms render() writes) */
export function measureChat(n) {
  // the home composer docks where the chat's composer sits; its body collapses to the placeholder line
  n.dock = { top: n.comp.offsetTop, from: n.hubc.offsetTop, h0: n.hcb.offsetHeight, h1: n.hcph.offsetHeight };
  const top = (x) => { let y = 0; for (let e = x; e && e !== n.feed; e = e.offsetParent) y += e.offsetTop; return y; };
  n.top = top;
  n.s0 = top(n.att) - 50;   // the still after Send: the video and the ask high, the switch under them
}

/** bottom-anchored, like a real chat: whenever something new lands in the thread (a switch pill, a model's header,
 *  its card), the thread eases so that newest thing's foot sits just above the docked composer (y 820). The ease starts
 *  a beat before the element appears, so it fades in above the composer, never under it; a card that grows (Claude's
 *  editor) is followed live. */
function scrollAt(n, t) {
  const foot = (el) => Math.max(n.s0, n.top(el) + el.offsetHeight - 820);
  const events = [
    [T.sw1, n.sw.gemini], [T.who1, n.say.gemini], [T.card1, n.gem],
    [T.sw2, n.sw.claude], [T.who2, n.say.claude], [T.card2, n.cx],
    [T.sw3, n.sw.banana], [T.who3, n.say.banana], [T.card3, n.nb],
    [T.sw4, n.sw.youtube], [T.consent, n.gc], [T.who4, n.say.youtube], [T.posted, n.posted],
  ];
  let y = n.s0;
  for (const [te, el] of events) if (t >= te - 0.35) y = lerp(y, foot(el), inOutCubic(seg(t, te - 0.35, te + 0.3)));
  return y;
}

/** a spinner that resolves into the green check at tok */
function renderStatus(st, t, tok) {
  const spin = st.querySelector('.spin'), ok = st.querySelector('.ok');
  // a hard swap: the spinner is gone on the frame the check starts to grow, so no ring is left behind it
  const k = seg(t, tok, tok + 0.12);
  spinner(spin, t, t < tok);
  spin.style.opacity = t < tok ? '1' : '0';
  ok.style.opacity = t < tok ? '0' : '1';
  ok.style.transform = `scale(${lerp(0.7, 1, outCubic(k)).toFixed(3)})`;
}

function renderPill(p, t, tin, tok) {
  const a = outCubic(seg(t, tin, tin + 0.24));
  p.style.opacity = a.toFixed(3);
  p.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px) scale(${lerp(0.94, 1, a).toFixed(4)})`;
  renderStatus(p.querySelector('.st'), t, tok);
}

function renderHead(n, k, t, tw, done, doneAt) {   // tw is set after the switch pill's check
  enter(n.who[k], t, tw, 0.22, 10);
  enter(n.say[k], t, tw + 0.04, 0.22, 8);
  if (done) setText(n.say[k], t >= doneAt ? done : SAY[k]);  // past tense once the part is done
}

function renderGemini(n, t) {
  renderHead(n, 'gemini', t, T.who1, SAY.geminiDone, T.watch[1]);
  enter(n.gem, t, T.card1, 0.28, 16);
  const w = seg(t, T.watch[0], T.watch[1]), s = w * VIDEO.lengthS;
  setText(n.gWl, w < 1 ? 'Watching the video' : 'Watched the video');
  setText(n.gTime, w < 1 ? `${fmt(s)} / ${VIDEO.length}` : VIDEO.length);
  renderStatus(n.gWst, t, T.watch[1] - 0.12);   // the check has landed by the frame the text says Watched
  n.gProg.style.display = 'none';
  n.gFill.style.transform = `scaleX(${w.toFixed(4)})`;
  n.gKnob.style.left = `${(w * 100).toFixed(3)}%`;
  // the player shows the frame under the playhead: each chapter's shot dissolves in as it is reached
  const at = (sec) => lerp(T.watch[0], T.watch[1], sec / VIDEO.lengthS);
  let found = 0;
  CHAPTERS.forEach((c, i) => {
    const p = i ? outCubic(seg(t, at(c.s), at(c.s) + 0.16)) : 1;
    op(n.gFr[i], i && t < at(c.s) ? 0 : 1);   // the player cuts to each chapter's shot (no dissolve)
    enter(n.gChs[i], t, i ? at(c.s) : T.watch[0], 0.22, 12);
    if (s >= c.s && t >= T.watch[0]) found++;
    if (i) {
      op(n.gTicks[i - 1], p);
      n.gTicks[i - 1].style.transform = `scaleY(${lerp(0.2, 1, p).toFixed(3)})`;
    }
  });
  setText(n.gRr, w < 1 ? (found ? `${found} found` : 'Finding chapters…') : '6 chapters · first at 0:00');
  const pp = outCubic(seg(t, at(THUMB_FRAME.s), at(THUMB_FRAME.s) + 0.22));
  op(n.gPickT, pp);
  n.gPickT.style.transform = `scaleY(${lerp(0.2, 1, pp).toFixed(3)})`;
}

function renderDetails(n, t) {
  renderHead(n, 'claude', t, T.who2, SAY.claudeDone, T.done2);
  enter(n.cx, t, T.card2, 0.28, 16);
  const c = Math.round(TOTAL * seg(t, T.write[0], T.write[1]));
  const writing = t >= T.write[0] && t < T.write[1] + 0.2;
  n.xLines.forEach((o, i) => {
    const k = Math.max(0, Math.min(DETAILS[i].length, c - STARTS[i]));
    if (k !== o.shown) { o.v.innerHTML = hl(DETAILS[i].slice(0, k)); o.shown = k; }
    // the editor grows with its lines: each row opens to full height as Claude reaches it
    const ts = lerp(T.write[0], T.write[1], STARTS[i] / TOTAL);
    o.row.style.height = i === 0 ? '' : `${(ROW_H * outCubic(seg(t, ts - 0.1, ts + 0.04))).toFixed(2)}px`;
    o.row.style.visibility = c > STARTS[i] || (i === 0 && t >= T.write[0]) ? 'visible' : 'hidden';
    const on = writing && c >= STARTS[i] && (i === DETAILS.length - 1 || c < STARTS[i + 1]);
    o.c.style.opacity = on ? '1' : '0';
  });
  const d = t >= T.done2;
  n.cx.classList.toggle('done', d);
  n.xState.classList.toggle('is-ok', d);
  setText(n.xSl, d ? 'Worked for' : 'Working');
  // an honest clock: whole seconds since the panel opened
  setText(n.xClk, `${Math.ceil(Math.max(0, Math.min(t, T.done2) - T.card2))}s`);
  n.xState.querySelector('.x-spin').style.transform = `rotate(${(t * 380 % 360).toFixed(1)}deg)`;
  n.xFt.classList.toggle('on', d);
  setText(n.xNf, d ? DETAILS_DONE : 'Writing');
  // Add to upload: one pulse when the panel is done, then superbot presses it
  const pulse = seg(t, T.done2 + 0.1, T.done2 + 0.4), pr = press(t, T.add, 0.08, 0.1, 0.14);
  n.xPri.style.transform = `scale(${(1 + 0.07 * Math.sin(Math.PI * pulse) - 0.08 * pr).toFixed(4)})`;
  n.xPri.style.setProperty('--prs', pr.toFixed(3));
  setText(n.xPri, t >= T.add + 0.1 ? 'Added ✓' : 'Add to upload');
}

function renderBanana(n, t) {
  renderHead(n, 'banana', t, T.who3, SAY.bananaDone, T.gen[1]);
  enter(n.nb, t, T.card3, 0.28, 16);
  // the output pane: a shimmer while the model works, then the thumbnail resolves (blur and scale settle together)
  const g = seg(t, T.gen[0], T.gen[1]);
  const shim = t >= T.gen[0] - 0.3 ? 1 - outCubic(seg(t, T.gen[1] - 0.5, T.gen[1])) : 0.6;
  op(n.nShim, shim);
  n.nShim.style.backgroundPosition = `${(-140 + 260 * ((t * 0.9) % 1)).toFixed(1)}% 0`;
  const r = inOutCubic(seg(t, T.gen[1] - 0.45, T.gen[1]));
  op(n.nTh, r);
  n.nTh.style.filter = r >= 1 ? 'none' : `blur(${((1 - r) * 22).toFixed(2)}px)`;
  n.nTh.style.transform = r >= 1 ? 'none' : `scale(${lerp(1.06, 1, r).toFixed(4)})`;
  const a = outCubic(seg(t, T.gen[0], T.gen[0] + 0.3));
  n.nArrow.style.transform = `translateX(${lerp(-10, 0, a).toFixed(2)}px)`;
  op(n.nArrow, 0.35 + 0.65 * a);
  renderStatus(n.nStt, t, T.gen[1] - 0.06);
  setText(n.nSl, t >= T.gen[1] - 0.06 ? 'Thumbnail ready' : g > 0 ? 'Generating the thumbnail' : 'Reading the frame');
  enter(n.nSpec, t, T.gen[1] - 0.06, 0.2, 0);
}

function renderPosted(n, t) {
  renderHead(n, 'youtube', t, T.who4);   // only once Continue has granted access
  // the card arrives with its rows drawn; each check resolves in turn, the upload itself keeps spinning (Studio is
  // still uploading when the film cuts to it)
  // a white card over the dark thread: revealed top-down with a short rise (an opacity fade would pass through grey)
  const r = outCubic(seg(t, T.posted, T.posted + 0.18));
  n.posted.style.opacity = t >= T.posted ? '1' : '0';
  n.posted.style.clipPath = r >= 1 ? 'none' : `inset(0 0 ${((1 - r) * 100).toFixed(2)}% 0 round 28px)`;
  n.posted.style.transform = r >= 1 ? 'none' : `translateY(${((1 - r) * 14).toFixed(2)}px)`;
  n.pRows.forEach((row, i) => {
    row.style.opacity = '1';
    renderStatus(row.querySelector('.st'), t, T.ticks[i]);
    if (POSTED[i].done) setText(row.querySelector('.p-tx'), t >= T.ticks[i] ? POSTED[i].done : POSTED[i].text);
  });
}

export function renderChat(n, t) {
  // the home screen: frame 0 holds the typed ask. Send: the greeting and the typed content go (no double), the
  // composer collapses to its one line and then docks; the ask rises into the thread above it
  const sp = press(t, T.send, 0.07, 0.08, 0.14);
  n.hsend.style.transform = `scale(${(1 - 0.1 * sp).toFixed(4)})`;
  n.hsend.classList.toggle('lit', t < T.hubOut[0]);
  const gone = outCubic(seg(t, T.send, T.send + 0.12));
  op(n.hero, 1 - gone);
  n.hero.style.transform = `translateY(${(-30 * gone).toFixed(2)}px)`;
  n.hcc.style.opacity = t < T.send && Math.floor(t * 2.4) % 2 === 0 ? '1' : '0';
  const body = outCubic(seg(t, T.hubOut[0], T.hubOut[0] + 0.08)), col = inOutCubic(seg(t, T.hubOut[0], T.hubOut[1]));
  op(n.hci, 1 - body); op(n.hcph, outCubic(seg(t, T.hubOut[0] + 0.1, T.hubOut[0] + 0.2)));
  n.hci.style.transform = 'none';
  n.hcb.style.height = `${lerp(n.dock.h0, n.dock.h1, col).toFixed(2)}px`;
  n.hubc.style.top = `${lerp(n.dock.from, n.dock.top, col).toFixed(2)}px`;
  const docked = t >= T.hubOut[1];
  n.hub.style.visibility = docked ? 'hidden' : 'visible';
  n.comp.style.visibility = docked ? 'visible' : 'hidden';
  n.sec.style.visibility = t >= T.grow[1] ? 'hidden' : 'visible';
  enter(n.att, t, T.msgIn, 0.3, 90);
  enter(n.ask, t, T.msgIn + 0.03, 0.3, 90);
  renderPill(n.sw.gemini, t, T.sw1, T.sw1ok);
  renderGemini(n, t);
  renderPill(n.sw.claude, t, T.sw2, T.sw2ok);
  renderDetails(n, t);
  renderPill(n.sw.banana, t, T.sw3, T.sw3ok);
  renderBanana(n, t);
  renderPill(n.sw.youtube, t, T.sw4, T.sw4ok);
  renderPosted(n, t);
  // the composer chip follows the active model: a clean cut on the frame each switch lands
  const oks = [T.sw1ok, T.sw2ok, T.sw3ok, T.sw4];
  const cur = oks.filter((x) => t >= x).length;
  ['superbot', ...KEYS].forEach((key, i) => { op(n.pm[key], i === cur ? 1 : 0); n.pm[key].style.transform = 'none'; });
  // the thread follows its newest content (after this frame's layout changes); the consent card's own layout first
  n.cam.style.transform = 'none';
  renderConnect(n, t);
  n.feed.style.transform = `translateY(${(-scrollAt(n, t)).toFixed(2)}px)`;
  renderPointerChat(n, t);
  // the hand-off to Studio is a camera push into the checklist card's live view (the whole chat scales with it)
  // the hand-off: the chat fades away around the live view, and only the view grows to the full frame (studio.js)
  n.cam.style.opacity = (1 - outCubic(seg(t, T.grow[0], T.grow[0] + 0.22))).toFixed(3);
}

/** the connect beat: the consent card lands, the pointer comes onto Continue and taps it */
function renderConnect(n, t) {
  // Google's consent lands in the thread under the pill (the source spot's grammar) and stays there once accepted
  enter(n.gc, t, T.consent, 0.24, 18);
  const pr = press(t, T.cont, 0.07, 0.08, 0.14);
  n.gcGo.classList.toggle('hit', t >= T.cont);
  n.gcGo.style.transform = `scale(${(1 - 0.06 * pr).toFixed(4)})`;
}

function renderPointerChat(n, t) {
  const pr = press(t, T.cont, 0.07, 0.08, 0.14);
  const r = n.gcGo.getBoundingClientRect();
  const tx = r.left + r.width * 0.45, ty = r.top + r.height * 0.6;
  const mv = inOutCubic(seg(t, T.ptr[0], T.ptr[1])), out = inOutCubic(seg(t, T.cont + 0.25, T.cont + 0.6));
  if (t < T.cont + 0.3) { n.ptrAt = [tx, ty]; }
  const [hx, hy] = t < T.cont ? [tx, ty] : n.ptrAt || [tx, ty];
  const x = lerp(lerp(1560, hx, mv), 1700, out), y = lerp(lerp(1010, hy, mv), 1040, out);
  const v = outCubic(seg(t, T.ptr[0] - 0.15, T.ptr[0])) * (1 - seg(t, T.cont + 0.15, T.cont + 0.3));
  n.ptr.style.opacity = v.toFixed(3);
  n.ptr.style.transform = `translate(${(x - 17).toFixed(1)}px, ${(y - 11).toFixed(1)}px) scale(${(1 - 0.12 * pr).toFixed(3)})`;
  op(n.dim, 0);
}
