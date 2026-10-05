// The superbot chat: the ask, three switch pills, Gemini's watch-and-rank card, Claude's replies panel (the real app's
// code-panel grammar: comment-replies, replies.md / pin.md, Writing n of 5, Review / Post all), the YouTube hand-off
// checklist, and the composer whose model chip follows each switch. Native 1920x1080 px; render(t) writes every
// moving value, nothing transitions.
import { seg, lerp, op, esc, enter, spinner, outCubic, inOutCubic, press, el } from './lib.js';
import { ICON } from './icons.js';
import { ASK, VIDEO, TOP, TICKS, PIN_DECISION, POSTED, SAY, SAY_YT, MODELS } from './data.js';
import { T, SCROLL } from './timing.js';
import { thumbSVG } from './thumb.js';

const ms = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const LUCIDE = {
  plus: '<path d="M5 12h14M12 5v14"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};
const lu = (n, cls = 'lu') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${LUCIDE[n]}</svg>`;
const CHECK = (cls = 'ok') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>`;
const tile = (k) => `<span class="tile t-${k}"><img src="${MODELS[k].icon}" alt=""></span>`;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const status = () => `<span class="st"><span class="spin"></span>${CHECK()}</span>`;

const switchPill = (k, verb) => `<div class="sw" data-k="sw-${k}">${tile(k)}<span class="swl">${verb} ${esc(MODELS[k].name)}</span>${status()}</div>`;
const who = (k, small) => `<div class="who" data-k="who-${k}">${tile(k)}<b>${esc(MODELS[k].name)}</b><small>${small}</small></div>`;
const say = (k) => `<div class="say" data-k="say-${k}">${esc(SAY[k])}</div>`;

function gemCard() {
  const rows = TOP.map((c, i) => `<div class="g-row" data-k="g-row">
    <span class="g-rank">${i + 1}</span><span class="av" style="background:${c.color}">${c.init}</span>
    <span class="g-body"><span class="g-l1"><b>${esc(c.name)}</b><span class="g-likes">${ms('thumb-up-outline')}${c.likes}</span><span class="g-chip">${esc(c.chip)}</span></span>
      <span class="g-text">${esc(c.text)}</span></span>
  </div>`).join('');
  // 6:12 and 7:05 sit 53 s apart, so the answer moment's label rides above the track
  const ticks = TICKS.map((k) => `<span class="g-tick${k.up ? ' up' : ''}" data-k="g-tick" style="left:${((k.s / VIDEO.lengthS) * 100).toFixed(2)}%"><i>${k.label}</i></span>`).join('');
  return `<div class="card gem" data-k="gem">
    <div class="g-vid">
      <div class="g-thumb">${thumbSVG('gt')}<span class="g-dur">${VIDEO.length}</span><span class="g-prog" data-k="g-prog"></span></div>
      <div class="g-meta"><div class="g-title">${esc(VIDEO.title)}</div>
        <div class="g-wrow"><span data-k="g-wst">${status()}</span><span class="g-wl" data-k="g-wl">Watching the video</span><span class="g-time" data-k="g-time">0:00</span></div>
        <div class="g-track"><span class="g-fill" data-k="g-fill"></span>${ticks}<span class="g-knob" data-k="g-knob"></span></div>
      </div>
    </div>
    <div class="g-rh"><span data-k="g-rst">${status()}</span><b data-k="g-rl">Reading ${VIDEO.comments} comments</b><span class="g-rr" data-k="g-rr">Top 5 by likes and repeats</span></div>
    <div class="g-bar"><span class="g-barf" data-k="g-barf"></span></div>
    <div class="g-rows">${rows}</div>
  </div>`;
}

// replies.md: "Name: first line", continuation lines, a blank line between replies (the reference's file layout)
const LINES = [];
TOP.forEach((c, i) => {
  if (i) LINES.push({ text: '' });
  c.reply.forEach((r, j) => LINES.push(j ? { text: r } : { text: `${c.name.split(' ')[0]}: ${r}`, opens: true }));
});
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].text.length + 1 : 0), a), []);
const TOTAL = STARTS[STARTS.length - 1] + LINES[LINES.length - 1].text.length;
const hl = (s) => { const m = /^([A-Z][a-z]+):/.exec(s); return m ? `<i class="k">${esc(m[0])}</i>${esc(s.slice(m[0].length))}` : esc(s); };

function replyPanel() {
  return `<div class="card cx" data-k="cx">
    <div class="x-hd"><span class="x-proj">${lu('msg', 'x-ico')}<b>comment-replies</b></span><span class="x-br">5 replies</span>
      <em class="x-state" data-k="x-state"><span class="spin x-spin"></span>${CHECK('x-tk')}<span data-k="x-sl">Working</span><span class="x-clk" data-k="x-clk">0s</span></em></div>
    <div class="x-tabs"><span class="x-tab on"><b>MD</b>replies.md</span><span class="x-tab"><b>MD</b>pin.md</span></div>
    <div class="x-bd">${LINES.map((l, i) => `<div class="x-l" data-k="x-l"><u>${i + 1}</u><code><span class="x-v"></span><i class="x-caret"></i></code></div>`).join('')}</div>
    <div class="x-ft" data-k="x-ft"><span class="x-sum">${lu('chevR', 'x-chev')}${CHECK('x-dn')}<b data-k="x-nf">Writing</b><span class="x-cnt" data-k="x-cnt">1 of 5</span></span>
      <span class="x-btns"><i class="x-b">Review</i><i class="x-b x-pri" data-k="x-pri">Post all</i></span></div>
  </div>`;
}

function postedCard() {
  const ic = { avatar: '<span class="p-ic p-av">S</span>', youtube: `<span class="p-ic p-yt"><img src="${MODELS.youtube.icon}" alt=""></span>`,
    pin: `<span class="p-ic p-blue">${ms('keep')}</span>` };
  return `<div class="card posted" data-k="posted">${POSTED.map((p) => `<div class="p-row" data-k="p-row">${ic[p.icon]}<span class="p-tx">${p.text}</span>
    <span class="st p-st"><span class="spin"></span>${CHECK()}</span></div>`).join('')}</div>`;
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
      <span class="plat"><span class="pms">${sb}${chip('gemini')}${chip('claude')}${chip('youtube')}</span>${lu('chev')}</span>
      <span class="computer">${lu('monitor')}</span>
      <span class="mic">${lu('mic')}</span>
      <span class="send">${lu('up')}</span>
    </div>
  </div></div>`;
}

export function mountChat(root) {
  const sec = el(`<section id="chat" class="scene"><div class="cam" data-k="cam">
    <div class="feed" data-k="feed"><div class="col">
      <div class="ask" data-k="ask"><div class="bubble">${esc(ASK)}</div></div>
      ${switchPill('gemini', 'Switching to')}
      ${who('gemini', 'in superbot')}
      ${say('gemini')}
      ${gemCard()}
      ${switchPill('claude', 'Switching to')}
      ${who('claude', 'in superbot')}
      ${say('claude')}
      ${replyPanel()}
      ${switchPill('youtube', 'Connecting to')}
      ${who('youtube', 'connected')}
      <div class="say" data-k="say-youtube">${esc(SAY_YT)}</div>
      ${postedCard()}
      <div class="tail"></div>
    </div></div>
    <div class="fade"></div>
    ${composer()}
  </div><div class="edge"></div></section>`);
  root.appendChild(sec);
  const q = (k) => sec.querySelector(`[data-k="${k}"]`);
  const qa = (k) => [...sec.querySelectorAll(`[data-k="${k}"]`)];
  const n = {
    sec, cam: q('cam'), feed: q('feed'), ask: q('ask'), sayG: q('say-gemini'), sayC: q('say-claude'), sayY: q('say-youtube'),
    comp: sec.querySelector('.composer'), fade: sec.querySelector('.fade'),
    sw: { gemini: q('sw-gemini'), claude: q('sw-claude'), youtube: q('sw-youtube') },
    who: { gemini: q('who-gemini'), claude: q('who-claude'), youtube: q('who-youtube') },
    gem: q('gem'), gRows: qa('g-row'), gTicks: qa('g-tick'), gProg: q('g-prog'), gFill: q('g-fill'), gKnob: q('g-knob'),
    gWst: q('g-wst'), gWl: q('g-wl'), gTime: q('g-time'), gRst: q('g-rst'), gRl: q('g-rl'), gRr: q('g-rr'), gBarf: q('g-barf'),
    cx: q('cx'), xState: q('x-state'), xSl: q('x-sl'), xClk: q('x-clk'), xFt: q('x-ft'), xNf: q('x-nf'), xCnt: q('x-cnt'), xPri: q('x-pri'),
    posted: q('posted'), pRows: qa('p-row'),
    pm: { superbot: q('pm-superbot'), gemini: q('pm-gemini'), claude: q('pm-claude'), youtube: q('pm-youtube') },
  };
  n.xLines = qa('x-l').map((row) => ({ row, v: row.querySelector('.x-v'), c: row.querySelector('.x-caret'), shown: -1 }));
  return n;
}

/** scroll stops from the laid-out thread (offsetTop is unaffected by the transforms render() writes) */
export function measureChat(n) {
  const top = (x) => { let y = 0; for (let e = x; e && e !== n.feed; e = e.offsetParent) y += e.offsetTop; return y; };
  n.stops = {
    s0: top(n.ask) - 310,                 // the still: the ask and the switch, centred over the whole composer
    sA: top(n.ask) - 76,                  // the ask still on screen (below the top fade) while Gemini watches and counts
    s1: top(n.who.gemini) - 72,           // Gemini's header, line and the whole ranked card
    s2: top(n.sw.claude) - 430,
    s3: top(n.who.claude) - 72,
    s4: top(n.sw.youtube) - 200,          // after the 1.13x push: Claude's footer (the pin reason) under the top fade, the checklist centred
  };
  // each push is anchored on the model's header line (it stays put while the card grows under it), 1.13x so the card
  // keeps a 5% margin each side; the composer slides out of frame whole while it holds (renderChat)
  const push = (anchor, p) => ({ a: top(anchor), s: 1.13, p: p.t });
  n.focus = {
    gem: push(n.who.gemini, { stop: 's1', t: T.gemPush }),
    cx: push(n.who.claude, { stop: 's3', t: T.cxPush }),
    post: push(n.sw.youtube, { stop: 's4', t: T.postPush }),
  };
}

function scrollAt(n, t) {
  let y = n.stops[SCROLL[0][1]];
  for (let i = 1; i < SCROLL.length; i++) {
    const [ta, a] = SCROLL[i - 1], [tb, b] = SCROLL[i];
    if (t >= ta) y = lerp(n.stops[a], n.stops[b], inOutCubic(seg(t, ta, tb)));
  }
  return y;
}

/** a spinner that resolves into the green check at tok */
function renderStatus(st, t, tok) {
  const spin = st.querySelector('.spin'), ok = st.querySelector('.ok');
  const k = seg(t, tok, tok + 0.18);
  spinner(spin, t, k < 1);
  spin.style.opacity = (1 - k).toFixed(3);
  ok.style.opacity = k.toFixed(3);
  ok.style.transform = `scale(${lerp(0.4, 1, outCubic(k)).toFixed(3)})`;
}

function renderPill(p, t, tin, tok) {
  const a = outCubic(seg(t, tin, tin + 0.24));
  p.style.opacity = a.toFixed(3);
  p.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px) scale(${lerp(0.94, 1, a).toFixed(4)})`;
  renderStatus(p.querySelector('.st'), t, tok);
}

function renderGemini(n, t) {
  enter(n.who.gemini, t, T.who1, 0.22, 10);
  enter(n.sayG, t, T.who1 + 0.04, 0.22, 8);
  setText(n.sayG, t >= T.read[1] ? SAY.geminiDone : SAY.gemini);  // past tense once the read is done
  enter(n.gem, t, T.card1, 0.28, 16);
  const w = seg(t, T.watch[0], T.watch[1]), s = w * VIDEO.lengthS;
  setText(n.gWl, w < 1 ? 'Watching the video' : 'Watched the video');
  setText(n.gTime, w < 1 ? `${fmt(s)} / ${VIDEO.length}` : VIDEO.length);
  renderStatus(n.gWst, t, T.watch[1]);
  n.gProg.style.transform = n.gFill.style.transform = `scaleX(${w.toFixed(4)})`;
  n.gKnob.style.left = `${(w * 100).toFixed(3)}%`;
  TICKS.forEach((k, i) => {
    const at = lerp(T.watch[0], T.watch[1], k.s / VIDEO.lengthS);
    const p = outCubic(seg(t, at, at + 0.2));
    op(n.gTicks[i], p);
    n.gTicks[i].style.transform = `scaleY(${lerp(0.2, 1, p).toFixed(3)})`;
  });
  const r = seg(t, T.read[0], T.read[1]);
  // the count climbs as it reads (1,284 in the comments' own time)
  setText(n.gRl, r < 1 ? `Reading ${Math.round(1284 * r).toLocaleString('en-US')} of ${VIDEO.comments} comments` : `Read all ${VIDEO.comments} comments`);
  renderStatus(n.gRst, t, T.read[1]);
  n.gBarf.style.transform = `scaleX(${r.toFixed(4)})`;
  enter(n.gRr, t, T.read[1], 0.22, 0);
  n.gRows.forEach((row, i) => enter(row, t, T.gemRows[i], 0.22, 14));
}

function renderReplies(n, t) {
  enter(n.who.claude, t, T.who2, 0.22, 10);
  enter(n.sayC, t, T.who2 + 0.04, 0.22, 8);
  setText(n.sayC, t >= T.done ? SAY.claudeDone : SAY.claude);
  enter(n.cx, t, T.card2, 0.28, 16);
  const c = Math.round(TOTAL * seg(t, T.write[0], T.write[1]));
  const writing = t >= T.write[0] && t < T.write[1] + 0.2;
  let opened = 0;
  n.xLines.forEach((o, i) => {
    const k = Math.max(0, Math.min(LINES[i].text.length, c - STARTS[i]));
    if (k !== o.shown) { o.v.innerHTML = hl(LINES[i].text.slice(0, k)); o.shown = k; }
    o.row.style.visibility = c > STARTS[i] || (i === 0 && t >= T.write[0]) ? 'visible' : 'hidden';
    const on = writing && c >= STARTS[i] && (i === LINES.length - 1 || c < STARTS[i + 1]);
    o.c.style.opacity = on ? '1' : '0';
    if (LINES[i].opens && c > STARTS[i]) opened++;
  });
  const d = t >= T.done;
  n.cx.classList.toggle('done', d);
  n.xState.classList.toggle('is-ok', d);
  setText(n.xSl, d ? 'Worked for' : 'Working');
  // an honest clock: whole seconds since the panel opened, as the reference panel keeps it
  setText(n.xClk, `${Math.ceil(Math.max(0, Math.min(t, T.done) - T.card2))}s`);
  n.xState.querySelector('.x-spin').style.transform = `rotate(${(t * 380 % 360).toFixed(1)}deg)`;
  n.xFt.classList.toggle('on', d);
  setText(n.xNf, d ? PIN_DECISION : 'Writing');
  setText(n.xCnt, d ? '' : `${Math.max(1, opened)} of 5`);
  // Post all: one pulse when the panel is done, then superbot presses it; the button stays as the reference keeps it,
  // the posting itself is the YouTube Studio connection's checklist below
  const pulse = seg(t, T.done + 0.1, T.done + 0.4), pr = press(t, T.post, 0.08, 0.1, 0.14);
  n.xPri.style.transform = `scale(${(1 + 0.07 * Math.sin(Math.PI * pulse) - 0.08 * pr).toFixed(4)})`;
  n.xPri.style.setProperty('--prs', pr.toFixed(3));
}

function renderPosted(n, t) {
  enter(n.who.youtube, t, T.who3, 0.22, 10);
  enter(n.sayY, t, T.who3 + 0.04, 0.22, 8);
  enter(n.posted, t, T.posted[0] - 0.06, 0.24, 14);
  n.pRows.forEach((row, i) => {
    enter(row, t, T.posted[i], 0.2, 8);
    renderStatus(row.querySelector('.st'), t, T.posted[i] + T.tick);
  });
}

export function renderChat(n, t) {
  // the camera: a focus push on the Gemini card, then on the Claude panel (the card's centre stays put, it scales up
  // to read on a phone; the composer slides off the bottom, as in the reference's zoom cut)
  const scroll = scrollAt(n, t);
  let cam = 'none', kMax = 0;
  for (const f of Object.values(n.focus)) {
    const k = inOutCubic(seg(t, f.p[0], f.p[1])) * (1 - inOutCubic(seg(t, f.p[2], f.p[3])));
    if (k > 0) { n.cam.style.transformOrigin = `960px ${(f.a - scroll).toFixed(2)}px`; cam = `scale(${(1 + (f.s - 1) * k).toFixed(5)})`; kMax = k; }
  }
  n.cam.style.transform = cam;
  n.comp.style.transform = n.fade.style.transform = kMax > 0 ? `translateY(${(300 * kMax).toFixed(2)}px)` : 'none';
  // the chat, checklist card included, fades out as one layer before the watch page comes in (youtube.js)
  n.cam.style.opacity = (1 - outCubic(seg(t, T.chatOut[0], T.chatOut[1]))).toFixed(3);
  n.sec.style.visibility = t >= T.chatOut[1] ? 'hidden' : 'visible';
  n.feed.style.transform = `translateY(${(-scroll).toFixed(2)}px)`;
  renderPill(n.sw.gemini, t, -1, T.sw1ok);
  renderGemini(n, t);
  renderPill(n.sw.claude, t, T.sw2, T.sw2ok);
  renderReplies(n, t);
  renderPill(n.sw.youtube, t, T.sw3, T.sw3ok);
  renderPosted(n, t);
  // the composer chip follows the active model
  const toG = seg(t, T.sw1ok - 0.06, T.sw1ok + 0.12), toC = seg(t, T.sw2ok - 0.06, T.sw2ok + 0.12), toY = seg(t, T.sw3ok - 0.06, T.sw3ok + 0.12);
  op(n.pm.superbot, 1 - toG);
  op(n.pm.gemini, toG * (1 - toC));
  op(n.pm.claude, toC * (1 - toY));
  op(n.pm.youtube, toY);
}
