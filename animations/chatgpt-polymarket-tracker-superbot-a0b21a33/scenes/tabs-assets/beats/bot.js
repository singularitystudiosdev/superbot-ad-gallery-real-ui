// Beat 1: "make me a Polymarket tracker". superbot routes to Polymarket the way the every-model spot routes to
// DoorDash (a "Connecting to Polymarket" chip that shimmers, spins and resolves to a check while the composer chip
// follows the app), answers as "Polymarket in superbot", then runs two work cards: the WATCHLIST (each tracked
// market with its live odds, its 24h volume and why it is tracked) and the ALERT RULES (three rules switching on).
// It closes on a summary card that asks to turn alerts on. Nothing here is bought, sold or held: every figure is a
// reading, not a holding. Every string and figure comes from ../../../variant.js; every value is written from lt.
import { lerp, seg, outCubic, outBack } from '../../../lib.js';
import { workBeat, stdTimes } from './wk.js';
import V from '../../../variant.js';

const W = V.watchlist, R = V.rules, M = V.summary;
const BELL = '<svg class="pb-fl" viewBox="0 0 24 24"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ab = (s) => s.slice(0, 3).toUpperCase();

export function times(r) {
  const T = { r };
  // the routing chip: lands, the composer chip swaps to Polymarket, it resolves
  T.sw = r + 0.05; T.swap = T.sw + 0.3; T.done = T.sw + 1.05; T.who = T.done + 0.08;
  // card 1: the watchlist
  T.c1 = stdTimes(T.who + 0.22, W.steps.length, 1.95, 0);
  // card 2: the alert rules (the first step holds while the rules arm)
  const r2 = T.c1.done + 0.35, card = r2 + 0.22;
  T.c2 = { r: r2, card, steps: [[card + 0.18, card + 1.15], [card + 0.6, card + 1.35]] };
  T.c2.body = card + 1.4; T.c2.bodyEnd = T.c2.body + 0.5; T.c2.done = T.c2.body + 1.35;
  // cards 1 and 2 read their rows off these clocks
  T.wRows = W.rows.map((_, i) => T.c1.body + 0.12 + i * 0.26);
  T.rRows = R.rows.map((_, i) => T.c2.body + 0.14 + i * 0.3);
  // the summary card
  T.sum = T.c2.done + 0.35;
  T.rows = M.rows.map((_, i) => T.sum + 0.35 + i * 0.16);
  T.q = T.rows[T.rows.length - 1] + 0.3;
  T.end = T.q + 0.95;
  return T;
}

// the watchlist body: [market, tag, odds %, 24h volume, why tracked]
function watchBody() {
  const rows = W.rows.map(([m, tag, odds, vol, why], i) => `<div class="pb-wl" style="--o:${odds}%">
    <span class="pb-ic pb-ic${i}">${ab(tag)}</span>
    <span class="pb-m"><b>${m}</b>
      <small>${tag} · Yes <em>${odds}%</em> · <em>${vol}</em> vol 24h</small>
      <span class="pb-ods"><i></i></span></span>
    <span class="pb-why">${why}</span>
    <i class="pb-sweep"></i></div>`).join('');
  return `<div class="pb-sc"><div class="pb-sch">${BELL}<b>${W.rows.length} markets tracked</b><span>on Polymarket · read-only</span></div>${rows}</div>`;
}

// the alert-rules body: [rule, threshold detail] — each row is a switch that arms on its own beat
function rulesBody() {
  const rows = R.rows.map(([rule, detail], i) => `<div class="pb-rl">
    <span class="pb-sw"><i></i></span>
    <span class="pb-rlt"><b>${rule}</b><small>${detail}</small></span>
    <span class="pb-st">on</span></div>`).join('');
  return `<div class="pb-sc"><div class="pb-sch">${BELL}<b>${R.rows.length} alert rules</b><span>fires a notification, never an action</span></div>${rows}</div>`;
}

export function build(k, x) {
  const T = k.T;
  const pm = x.img('polymarket-icon.svg');
  // the routing chip, then the routed app's header (the DoorDash route's exact parts, minus any account balance)
  const sw = x.el(`<div class="pb-swr"><span class="qc-sw"><span class="qc-tile qc-t-polymarket"><img src="${pm}" alt=""/></span><span class="qc-swl">Connecting to Polymarket</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span></div>`);
  const chip = sw.firstElementChild, tile = chip.querySelector('.qc-tile'), lbl = chip.querySelector('.qc-swl'),
    spin = chip.querySelector('.qc-spin'), ok = chip.querySelector('.qc-ok');
  const who = x.el(`<div class="qc-who"><span class="qc-tile qc-t-polymarket"><img src="${pm}" alt=""/></span><b>Polymarket</b><small>in superbot</small><span class="pb-acct">${CHECK}${V.connect.handle} · read-only</span></div>`);

  const c1 = workBeat(x, { T: T.c1 }, { say: W.say, title: W.title, sub: W.sub, steps: W.steps, body: watchBody(), cls: 'pb-card' });
  const c2 = workBeat(x, { T: T.c2 }, { say: R.say, title: R.title, sub: R.sub, steps: R.steps, body: rulesBody(), cls: 'pb-card' });
  const sum = x.el(`<div class="pb-sum"><div class="pb-smh"><img src="${x.sbSrc}" alt=""/><b>Summary</b><span>tracking only</span></div>
    ${M.rows.map(([a, b]) => `<div class="pb-smr"><span>${a}</span><b>${b}</b></div>`).join('')}
    <div class="pb-smq">${M.ask}</div></div>`);

  const wRows = c1.qa('.pb-wl').map((n, i) => ({ n, ods: n.querySelector('.pb-ods i'), why: n.querySelector('.pb-why'), sweep: n.querySelector('.pb-sweep'), d: W.rows[i] }));
  const rRows = c2.qa('.pb-rl').map((n, i) => ({ n, sw: n.querySelector('.pb-sw'), knob: n.querySelector('.pb-sw i'), st: n.querySelector('.pb-st'), d: R.rows[i] }));
  const smRows = [...sum.querySelectorAll('.pb-smr')], smQ = sum.querySelector('.pb-smq');
  const text = (n, s) => { if (n.textContent !== s) n.textContent = s; };

  function renderChip(t) {
    const a = seg(t, T.sw, T.sw + 0.4), e = outBack(a);
    sw.style.opacity = seg(t, T.sw, T.sw + 0.2).toFixed(3);
    tile.style.transform = `scale(${lerp(0.5, 1, e).toFixed(4)}) rotate(${lerp(-25, 0, e).toFixed(2)}deg)`;
    const done = t >= T.done;
    chip.classList.toggle('qc-done', done);
    text(lbl, done ? 'Connected Polymarket · read-only' : 'Connecting to Polymarket');
    chip.style.setProperty('--sh', `${(100 - ((t - T.sw) * 140) % 200).toFixed(1)}%`);
    spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.06)).toFixed(3);
    spin.style.transform = `rotate(${((t - T.sw) * 420).toFixed(1)}deg)`;
    const o = seg(t, T.done, T.done + 0.3);
    ok.style.opacity = o.toFixed(3);
    ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
    const w = outCubic(seg(t, T.who, T.who + 0.45));
    who.style.opacity = w.toFixed(3);
    who.style.transform = w >= 1 ? 'none' : `translateY(${((1 - w) * 8).toFixed(2)}px)`;
  }

  // the watchlist: each market lands, its odds bar fills to its live reading, and its "why tracked" tag pops
  function renderWatch(t) {
    wRows.forEach((r, i) => {
      const at = T.wRows[i], p = outCubic(seg(t, at, at + 0.42));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px) scale(${lerp(0.97, 1, p).toFixed(4)})`;
      const s = seg(t, at + 0.1, at + 0.7);
      r.sweep.style.opacity = (s > 0 && s < 1 ? Math.sin(Math.PI * s) : 0).toFixed(3);
      r.sweep.style.left = `${lerp(-30, 110, s).toFixed(1)}%`;
      r.ods.style.width = `${(r.d[2] * outCubic(seg(t, at + 0.15, at + 0.75))).toFixed(2)}%`;
      const wh = seg(t, at + 0.55, at + 0.95);
      r.why.style.opacity = seg(wh, 0, 0.35).toFixed(3);
      r.why.style.transform = `scale(${lerp(0.5, 1, outBack(wh)).toFixed(4)})`;
      if (t >= at + 0.55) r.n.classList.add('pb-see'); else r.n.classList.remove('pb-see');
    });
  }

  // the alert rules: each switch slides on, its "on" label brightens
  function renderRules(t) {
    rRows.forEach((r, i) => {
      const at = T.rRows[i], p = outCubic(seg(t, at, at + 0.4));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
      const on = seg(t, at + 0.12, at + 0.45);
      r.sw.classList.toggle('pb-on', on > 0.02);
      r.sw.style.background = on > 0.02 ? '' : '#2b3440';
      r.knob.style.left = `${lerp(3, 17, outCubic(on)).toFixed(2)}px`;
      r.knob.style.background = on > 0.5 ? '#eafff2' : '#8a94a3';
      r.st.style.opacity = seg(on, 0.4, 1).toFixed(3);
      r.st.style.transform = `scale(${lerp(0.6, 1, outBack(on)).toFixed(4)})`;
    });
  }

  function renderSummary(t) {
    const p = outCubic(seg(t, T.sum, T.sum + 0.5));
    sum.style.opacity = p.toFixed(3);
    sum.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 14).toFixed(2)}px) scale(${lerp(0.975, 1, p).toFixed(4)})`;
    smRows.forEach((n, i) => {
      const o = outCubic(seg(t, T.rows[i], T.rows[i] + 0.38));
      n.style.opacity = o.toFixed(3);
      n.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -8).toFixed(2)}px)`;
    });
    const q = outCubic(seg(t, T.q, T.q + 0.4));
    smQ.style.opacity = q.toFixed(3);
    smQ.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
  }

  return {
    nodes: [sw, who, c1.sayEl, c1.card, c2.sayEl, c2.card, sum],
    marks: [[T.sw, sw], [T.who, who], ...c1.marks, [T.c1.body + 0.5, c1.card], [T.c1.done, c1.card],
      ...c2.marks, [T.c2.body + 0.6, c2.card], [T.c2.done, c2.card], [T.sum, sum], [T.q, sum]],
    render(t) {
      renderChip(t);
      c1.render(t); renderWatch(t);
      c2.render(t); renderRules(t);
      renderSummary(t);
    },
  };
}

export default { times, build };