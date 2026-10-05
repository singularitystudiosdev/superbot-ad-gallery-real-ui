// chat-more: the ad's two later asks, played on in the same thread after the
// muse meme (hero-workspace-chat.js turn 1), routed the way superbot-desktop
// main routes them (packages/core/src/switch/provider-switch.ts):
//   "Scrape reddit and look for more" -> a website the task names is a
//     service switch: "Connecting to Reddit" -> "Connected to Reddit", its
//     progress riding the switch as nested steps (ProviderSwitchStepRow). The
//     steps are browser visits ("Went to r/memes"), not search/fetch calls:
//     with the search trail on (Thread.tsx searchTrailOn, the default) main
//     folds a switch whose steps are all trail calls into "Searched N sites"
//     (trailCoveredSwitchIds), so a scrape that keeps its block browses;
//   "Winning, order me a burger." -> the DoorDash service switch, the same
//     anatomy; the purchase stops on main's spend approval card
//     (spend-approval-embed.tsx: the amount is the hero, one primary button
//     whose label IS the amount) until the owner approves on the Mac, then
//     checks out and lands main's monitor card for the order
//     (monitor-embed.tsx, core examples-extra.ts `monitor`).
// No chat-model pill: main draws a full switch pill only when a turn dials out
// (media generation, a branded service, a website the task targets), so the
// composer's model chip stays on "superbot" for both turns.
//
//   const plan = planMore(t0);                 // timings, from t0 (s)
//   const more = mountMore(host, plan, w);     // w: turn 1's cached writers
//   more.render(t);                            // pure of t, write-on-change
//   more.marks;                                // [time, node, pin] scroll marks
//   more.frames;                               // the nodes the ad's camera frames
//
// Every node is laid out from the start (opacity only), so the column's
// geometry never changes and the scroll marks can be measured once.

const asset = (f) => new URL('./hero-chat/' + f, import.meta.url).href;
const TILES = {
  reddit: asset('reddit-tile.webp'),        // packages/ui/src/marks/tiles/reddit.png
  doordash: asset('doordash-tile.webp'),    // packages/ui/src/marks/tiles/doordash.png
};

// [running label, done label, detail] (the edge words each label for its
// state; detail is host + path, omitted for a root page)
const TURNS = [
  {
    ask: 'Scrape reddit and look for more',
    app: 'reddit', name: 'Reddit',
    steps: [
      ['Going to r/memes', 'Went to r/memes', 'reddit.com/r/memes/top'],
      ['Going to r/dankmemes', 'Went to r/dankmemes', 'reddit.com/r/dankmemes/top'],
      ['Going to r/me_irl', 'Went to r/me_irl', 'reddit.com/r/me_irl/top'],
    ],
    say: 'Found 3 more Muse memes blowing up.', cps: 80, beat: 'list',
  },
  {
    ask: 'Winning, order me a burger.',
    app: 'doordash', name: 'DoorDash',
    steps: [
      ['Opening DoorDash', 'Opened DoorDash', ''],
      ['Picking the best-rated burger near you', 'Picked Main Street Burger Co.', 'doordash.com/store/main-street-burger-co'],
      ['Checking out', 'Checked out', 'doordash.com/checkout'],
    ],
    gate: 2,                                 // this step waits on the owner's Approve
    say: 'Ordered. It arrives by 7:06 PM.', cps: 80, beat: 'dash',
  },
];

const FOUND = [
  ['r/memes', 'Muse at 3am', '12.4k'],
  ['r/dankmemes', '40 unread from Muse', '8.1k'],
  ['r/me_irl', 'me_irl when Muse texts back', '5.6k'],
];

// the spend approval's quote and the order's monitor card (made-up order data)
const SPEND = { title: 'Cheeseburger, Main Street Burger Co.', reason: 'Best-rated burger near you, delivered to 1480 Market St.', amount: '$14.40', currency: 'USD', billed: 'your DoorDash account’s card' };
const MONITOR = {
  title: 'DoorDash order from Main Street Burger Co.', status: 'Preparing your order', counter: '1 / 4', fill: 0.25,
  steps: [['Order placed', 'done'], ['At the restaurant', 'working'], ['On the way', 'pending'], ['Delivered', 'pending']],
  eta: '6:58 PM to 7:06 PM',
};

// ---- math ---------------------------------------------------------------------
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const outCubic = (p) => 1 - Math.pow(1 - p, 3);
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const frac = (x) => x - Math.floor(x);
const r3 = (x) => Math.round(x * 1000) / 1000;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- timings -------------------------------------------------------------------
// KEY: 30ms a key (the sent bubble is the read); SPIN: SWITCH_MIN_SPIN_MS 650;
// RISE: switch-row 420; a step runs STEP before its check lands and the next
// step rises at that check (the edge runs a site's steps one after another),
// long enough for each row to read at feed size
const K = { CARET: 0.15, KEY: 0.03, SEND_AFTER: 0.12, ROW: 0.3, SW_AFTER: 0.15, SPIN: 0.65, STEP_IN: 0.22, STEP: 0.55, REPLY: 0.14, ITEM: 0.16, REST: 0.15, END_HOLD: 0.9 };
// the approval: the card lands, the pointer travels to Approve and presses it,
// main's pending line ("Approving on this Mac.") holds until the Helper answers
const GATE = { CARD: 0.12, PTR_IN: 0.4, PTR_AT: 1.05, PRESS: 1.15, PENDING: 0.4, RESUME: 0.1 };

export function planMore(t0) {
  let s = t0;
  const turns = TURNS.map((d) => {
    const u = { ...d, s };
    const at = s + K.CARET;
    u.keys = [...d.ask].map((_, i) => r3(at + i * K.KEY));
    u.send = r3(u.keys[u.keys.length - 1] + K.SEND_AFTER);
    u.row = r3(u.send + K.ROW);
    u.sw = r3(u.row + K.SW_AFTER);
    u.ok = r3(u.sw + K.SPIN);                    // the check lands, the who header rises
    let c = u.ok + K.STEP_IN;
    u.stepAt = d.steps.map((_, j) => {
      if (j === d.gate) {                        // the purchase waits on the owner
        const A = u.A = { in: r3(c + GATE.CARD) };
        A.ptrIn = r3(A.in + GATE.PTR_IN); A.ptrAt = r3(A.in + GATE.PTR_AT); A.press = r3(A.in + GATE.PRESS);
        A.approved = r3(A.press + GATE.PENDING);
        c = A.approved + GATE.RESUME;
      }
      const a = { in: r3(c), done: r3(c + K.STEP) }; c = a.done; return a;
    });
    u.busyEnd = u.stepAt[u.stepAt.length - 1].done;
    u.r = r3(u.busyEnd + K.REPLY);               // the answer lead starts streaming
    u.sayEnd = r3(u.r + 0.06 + d.say.length / d.cps);
    const B = u.B = {};
    if (d.beat === 'list') {
      B.items = FOUND.map((_, i) => r3(u.sayEnd + 0.05 + i * K.ITEM));
      u.settle = B.items[B.items.length - 1];
      u.end = r3(u.settle + K.END_HOLD);
    } else {
      B.card = r3(u.sayEnd + 0.05);              // the monitor card lands
      B.fill = r3(B.card + 0.3);                 // its progress fills to the first step
      u.settle = r3(B.fill + 0.5);
      u.end = r3(u.settle + K.END_HOLD + 0.5);
    }
    s = u.end + K.REST;
    return u;
  });
  // service switches never move the composer's model chip (main: the chip
  // shows the routed MODEL; a site run routes no model)
  return { start: t0, turns, models: [], end: turns[turns.length - 1].end };
}

// ---- markup ----------------------------------------------------------------------
const SVG = (cls, d) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SPIN_D = '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>';                       // lucide loader-circle
const SPIN = SVG('hwc-spin', SPIN_D);
const CHECK = SVG('hwc-check', '<path d="M20 6 9 17l-5-5"/>');              // lucide check
const ARROW_UP = SVG('hwc-up', '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>');
// RunStatusIcon's glyphs (run-status.ts RUN_STATUS_ICON): done circle-check, working loader-circle, pending circle-dashed
const RUN_ICON = {
  done: SVG('', '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  working: SVG('', SPIN_D),
  pending: SVG('', '<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/>'),
};
// the macOS arrow pointer (the owner's own hand on Approve)
const POINTER = '<svg class="sbx-ptr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5v16.6l4.2-4 2.8 6.3 2.7-1.2-2.8-6.2h5.8Z"/></svg>';

const tile = (app, cls) => `<img class="${cls}" src="${TILES[app]}" width="128" height="128" alt="" draggable="false" decoding="async"/>`;

const pill = (u) => `<span class="hwc-pill">${tile(u.app, 'hwc-pill-tile')}<span class="hwc-pill-label"><span class="hwc-sweep"><span class="hwc-mask"><span class="hwc-ink">Connecting to ${esc(u.name)}</span></span></span></span><span class="hwc-status">${SPIN}${CHECK}</span></span>`;
const step = ([run, , detail]) => `<li class="hwc-step" data-state="running"><span class="hwc-step-g">${SPIN}${CHECK}</span>` +
  `<span class="hwc-step-x"><span class="hwc-step-l">${esc(run)}</span>${detail ? `<span class="hwc-step-d">${esc(detail)}</span>` : ''}</span></li>`;
const nest = (u) => `<div class="hwc-nest"><div class="hwc-who">${tile(u.app, 'hwc-who-tile')}<span class="hwc-who-name">${esc(u.name)}</span><span class="hwc-who-sub">in superbot</span></div>` +
  `<ol class="hwc-steps">${u.steps.map(step).join('')}</ol></div>`;

// spend-approval-embed.tsx: title, the agent's reason, the amount as hero, the
// label/value list, then by state either [Cancel] [Approve $X] or one state line
// (both drawn in one slot, so the card keeps its height as the state changes)
const spendCard = () => `
<div class="sbe-card sbs-card" data-state="requested">
  <div class="sbs-head"><h3 class="sbe-title">${esc(SPEND.title)}</h3><p class="sbs-reason">${esc(SPEND.reason)}</p></div>
  <p class="sbs-hero"><span class="sbs-amount">${SPEND.amount}</span></p>
  <dl class="sbs-terms"><dt>Currency</dt><dd>${SPEND.currency}</dd><dt>Billed to</dt><dd>${esc(SPEND.billed)}</dd></dl>
  <div class="sbs-slot">
    <p class="sbs-state"></p>
    <div class="sbs-actions"><span class="sbe-btn">Cancel</span><span class="sbe-btn primary sbs-approve">Approve ${SPEND.amount}</span></div>
  </div>
  ${POINTER}
</div>`;

// monitor-embed.tsx: eyebrow (RUN_STATUS_WORD), brand + title, the service's
// status line, the progress bar and its counter, the steps (RunStatusIcon +
// label), the meta captions (each its own, no middle dots), quiet link-outs
// and the Check now control (the accent: progress fill, active glyph, Check now)
const monitorCard = () => `
<div class="sbe-card sbm-card" data-status="active">
  <div class="sbm-heading">
    <p class="sbe-caption">Working</p>
    <div class="sbm-title-row"><img class="sbm-brand" src="${TILES.doordash}" width="128" height="128" alt=""/><h3 class="sbe-title">${esc(MONITOR.title)}</h3></div>
    <p class="sbm-status">${esc(MONITOR.status)}</p>
  </div>
  <div class="sbm-progress"><div class="sbm-track"><div class="sbm-fill"></div></div><span class="sbe-caption">${MONITOR.counter}</span></div>
  <ul class="sbm-steps">${MONITOR.steps.map(([label, st]) => `<li data-state="${st}"><span class="sbm-ic" data-status="${st}">${RUN_ICON[st]}</span><span class="sbm-l">${esc(label)}</span></li>`).join('')}</ul>
  <div class="sbm-meta"><span class="sbe-caption sbm-elapsed">Working for 0s</span><span class="sbe-caption">${MONITOR.eta}</span><span class="sbe-caption">Checked just now</span></div>
  <div class="sbm-footer"><span class="sbe-btn">Track order</span><span class="sbe-btn">View receipt</span><span class="sbe-btn primary sbm-check">Check now</span></div>
</div>`;

function payoff(u) {
  if (u.beat === 'list') {
    return `<ul class="hwc-list">${FOUND.map(([sub, title, votes]) =>
      `<li class="hwc-li"><b>${esc(sub)}</b><span class="hwc-li-t">“${esc(title)}”</span><span class="hwc-li-v">${ARROW_UP}${votes}</span></li>`).join('')}</ul>`;
  }
  return monitorCard();
}

const turnMarkup = (u) => `
<div class="hwc-turn">
  <div class="hwc-row hwc-user" data-variant="bubble"><span class="hwc-bubble"><p class="hwc-p">${esc(u.ask)}</p></span></div>
  <div class="hwc-row hwc-bot" data-variant="prose"><div class="hwc-prose">
    <div class="hwc-sw">${pill(u)}${nest(u)}</div>
    ${u.gate !== undefined ? `<div class="hwc-beat hwc-gate">${spendCard()}</div>` : ''}
    <p class="hwc-say"><span class="hwc-say-vis"></span><span class="hwc-say-hid">${esc(u.say)}</span></p>
    <div class="hwc-beat">${payoff(u)}</div>
  </div></div>
</div>`;

// ---- mount + render ---------------------------------------------------------------
export function mountMore(host, plan, w) {
  host.innerHTML = plan.turns.map(turnMarkup).join('');
  const { css, text, attr } = w;
  const rise = (node, t, at, dur, dy) => {
    const p = outCubic(seg(t, at, at + dur));
    css(node, 'opacity', p >= 1 ? '' : p.toFixed(3));
    css(node, 'transform', p >= 1 ? '' : `translateY(${((1 - p) * dy).toFixed(2)}px)`);
  };
  const marks = [];
  const turns = plan.turns.map((u, i) => {
    const root = host.children[i];
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    const n = {
      user: q('.hwc-user'), bot: q('.hwc-bot'), sw: q('.hwc-sw'), nest: q('.hwc-nest'), who: q('.hwc-who'),
      pill: q('.hwc-pill'), tile: q('.hwc-pill-tile'), sweep: q('.hwc-sweep'), ink: q('.hwc-ink'),
      spin: q('.hwc-pill .hwc-spin'), check: q('.hwc-pill .hwc-check'),
      steps: qa('.hwc-step').map((li) => ({ li, spin: li.querySelector('.hwc-spin'), check: li.querySelector('.hwc-check'), label: li.querySelector('.hwc-step-l') })),
      say: q('.hwc-say'), vis: q('.hwc-say-vis'), hid: q('.hwc-say-hid'),
      items: qa('.hwc-li'),
      spend: q('.sbs-card'), state: q('.sbs-state'), actions: q('.sbs-actions'), approve: q('.sbs-approve'), ptr: q('.sbx-ptr'),
      mon: q('.sbm-card'), fill: q('.sbm-fill'), elapsed: q('.sbm-elapsed'),
      spinIc: q('.sbm-ic[data-status="working"] svg'), pendIc: qa('.sbm-ic[data-status="pending"] svg'),
    };
    marks.push([u.send, n.user, true], [u.sw, n.pill, false], [u.ok, n.who, false]);
    // the step after the approval lands above the card: the thread keeps the card (its state line) in view
    u.stepAt.forEach((a, j) => { if (j === u.gate) marks.push([u.A.in, n.spend, false]); marks.push([a.in, j >= u.gate ? n.spend : n.steps[j].li, false]); });
    marks.push([u.r, n.say, false]);
    if (u.beat === 'list') u.B.items.forEach((a, j) => marks.push([a, n.items[j], false]));
    else marks.push([u.B.card, n.mon, false]);
    return { u, n };
  });
  marks.sort((a, b) => a[0] - b[0]);

  // a spinner-then-check status slot (the switch pill's and the step rows')
  const status = (spin, check, t, from, ok) => {
    const done = t >= ok;
    css(spin, 'transform', done ? '' : `rotate(${(((t - from) * 360) % 360).toFixed(1)}deg)`);
    css(spin, 'opacity', done ? (1 - seg(t, ok, ok + 0.14)).toFixed(3) : '1');
    const cp = seg(t, ok, ok + 0.3);
    css(check, 'opacity', !done ? '0' : (cp >= 1 ? '1' : cp.toFixed(3)));
    css(check, 'transform', !done || cp >= 1 ? '' : `scale(${lerp(0.3, 1, outBack(cp)).toFixed(4)})`);
  };
  const stream = (u, n, t) => {
    const c = Math.max(0, Math.min(u.say.length, Math.floor((t - (u.r + 0.06)) * u.cps + 1e-6)));
    text(n.vis, u.say.slice(0, c)); text(n.hid, u.say.slice(c));
  };

  function renderSwitch({ u, n }, t) {
    rise(n.sw, t, u.sw, 0.42, 10);
    const tp = outBack(seg(t, u.sw + 0.05, u.sw + 0.45));
    css(n.tile, 'transform', tp >= 1 ? '' : `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`);
    const ok = t >= u.ok;
    attr(n.pill, 'data-check', ok ? 'true' : null);
    text(n.ink, ok ? `Connected to ${u.name}` : `Connecting to ${u.name}`);
    const sp = ok ? 0 : frac((t - u.sw) / 1.4);
    css(n.sweep, 'transform', ok ? '' : `translateX(${(150 * sp).toFixed(2)}%)`);
    css(n.ink, 'transform', ok ? '' : `translateX(${(-150 * sp).toFixed(2)}%)`);
    status(n.spin, n.check, t, u.sw, u.ok);
    // the nested column: the who header rises with the check, each step as it starts
    rise(n.nest, t, u.ok, 0.42, 10);
    n.steps.forEach((s, j) => {
      const a = u.stepAt[j], done = t >= a.done;
      rise(s.li, t, a.in, 0.42, 10);
      attr(s.li, 'data-state', done ? 'done' : 'running');
      text(s.label, done ? u.steps[j][1] : u.steps[j][0]);
      status(s.spin, s.check, t, a.in, a.done);
    });
  }

  function renderList({ u, n }, t) {
    n.items.forEach((li, i) => rise(li, t, u.B.items[i], 0.32, 6));
  }

  function renderSpend({ u, n }, t) {
    const A = u.A;
    rise(n.spend, t, A.in, 0.45, 12);
    const state = t < A.press + 0.08 ? 'requested' : t < A.approved ? 'pending' : 'approved';
    attr(n.spend, 'data-state', state);
    text(n.state, state === 'pending' ? 'Approving on this Mac.' : state === 'approved' ? 'Approved on this Mac.' : '');
    // the Approve press: a 97% dip under the pointer, then the requested-only buttons give way to the state line
    const pr = seg(t, A.press - 0.06, A.press + 0.12);
    css(n.approve, 'transform', pr > 0 && pr < 1 ? `scale(${(1 - 0.03 * Math.sin(Math.PI * pr)).toFixed(4)})` : '');
    // the pointer: in from below right, onto Approve, pressed, then away
    const bx = n.approve.offsetLeft + n.approve.offsetWidth * 0.62, by = n.approve.offsetTop + n.approve.offsetHeight * 0.58;
    const m = inOutCubic(seg(t, A.ptrIn, A.ptrAt)), out = seg(t, A.approved, A.approved + 0.35);
    const x = lerp(bx + 120, bx, m) + out * 40, y = lerp(by + 70, by, m) + out * 30;
    const pin = seg(t, A.ptrIn, A.ptrIn + 0.2) * (1 - out);
    const ps = 1 - 0.12 * Math.sin(Math.PI * seg(t, A.press - 0.06, A.press + 0.12));
    css(n.ptr, 'opacity', pin <= 0 ? '0' : pin.toFixed(3));
    css(n.ptr, 'transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${ps.toFixed(3)})`);
  }

  function renderMonitor({ u, n }, t) {
    const B = u.B;
    const ci = outCubic(seg(t, B.card, B.card + 0.5));
    css(n.mon, 'opacity', ci >= 1 ? '' : ci.toFixed(3));
    css(n.mon, 'transform', ci >= 1 ? '' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`);
    css(n.fill, 'width', `${(100 * MONITOR.fill * outCubic(seg(t, B.fill, B.fill + 0.5))).toFixed(2)}%`);
    text(n.elapsed, `Working for ${Math.max(0, Math.floor(t - u.send))}s`);
    // RunStatusIcon motion: working turns once a second, pending crawls a turn in eight
    css(n.spinIc, 'transform', `rotate(${((t * 360) % 360).toFixed(1)}deg)`);
    n.pendIc.forEach((s) => css(s, 'transform', `rotate(${((t * 45) % 360).toFixed(1)}deg)`));
  }

  function render(t) {
    turns.forEach((tn) => {
      const { u, n } = tn;
      // the sent bubble lands at once (main: an appended bubble does not animate)
      css(n.user, 'opacity', t >= u.send ? '' : '0');
      rise(n.bot, t, u.row, 0.2, 4);
      renderSwitch(tn, t);
      stream(u, n, t);
      if (u.beat === 'list') renderList(tn, t);
      else { renderSpend(tn, t); renderMonitor(tn, t); }
    });
  }

  // the nodes the ad's camera frames, per turn, with the time each lands
  const frames = turns.map(({ u, n }) => ({
    user: n.user, pill: n.pill, nest: n.nest,
    steps: n.steps.map((s, j) => [u.stepAt[j].in, s.li]),
    gate: n.spend ? [u.A.in, n.spend] : null,
    say: n.say,
    payoff: u.beat === 'list' ? n.items.map((li, j) => [u.B.items[j], li]) : [[u.B.card, n.mon]],
  }));
  return { marks, render, frames };
}
