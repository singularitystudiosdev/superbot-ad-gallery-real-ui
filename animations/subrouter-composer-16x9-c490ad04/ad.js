// V3 "Composer": the hub chat, like the bikeride reference. The composer's "Auto" chip
// opens a fan of four plan cards that fold into one sbc_ key. Three asks are sent; each
// opens an OpenRouter-style model picker (per-token prices struck, "Included · <plan>"),
// settles on Opus 5.5 / Gemini 3.1 Pro / DeepSeek V4.1 Flash and collapses into the hub's
// switch pill. The usage rail holds $0.00 extra while the per-token counter climbs, then
// the month fast-forwards. Ends on the line.
import {
  W, H, clamp, lerp, seg, smooth, outCubic, sp, win, h, $, $$, op, tf, money, typed,
  PLANS, KEY_FULL, listCost, tile, makeMark, makeCursor, placeCursor, pressScale, camera,
  makePlanMeter, makeTokenMeter, makeEnd, boot, PRESETS, track, spring,
} from './kit.js';

const DUR = 24, T_FF = 18.2, T_END = 20.6;
const ASK = [
  { ask: 'Refactor auth/ into typed modules and keep every test green', win: 0, tin: 142000, tout: 9000, reply: 'Done. auth/ is now 6 typed modules and the suite is green.' },
  { ask: 'Summarize 14 earnings-call transcripts into one table', win: 2, tin: 610000, tout: 6000, reply: 'Here is the table: revenue, guidance and margin for all 14 calls.' },
  { ask: 'Tag 5,000 support tickets by intent', win: 3, tin: 2100000, tout: 160000, reply: 'Tagged: billing 1,812 · bugs 1,440 · how-to 1,103 · other 645.' },
];
ASK.forEach((a, k) => { a.t = 4.4 + k * 4.6; a.cost = listCost(PLANS[a.win], a.tin, a.tout); });
const BASE = ASK.reduce((s, a) => s + a.cost, 0);
const AVG = BASE / ASK.length;
const PER_DAY = 60; // requests a day in the fast-forward
const ffDays = (t) => 30 * smooth((t - T_FF - 0.3) / 1.9);
const BLOCK = 330, THREAD_TOP = 150;
const COMP = { x: 470, w: 860 }; // composer column (world)
const PICK_ROW = 66;

let R = {};

function mount(stage) {
  stage.innerHTML = '';
  const world = h('<div class="world"></div>');
  stage.appendChild(world);
  const winEl = h(`<div class="win" style="left:40px;top:40px;width:1840px;height:1000px">
    <div class="win-bar"><div class="dots"><i></i><i></i><i></i></div><div class="ttl"><b>superbot</b></div></div>
    <div class="side" style="width:260px">
      <div class="brand"><span class="m"></span>superbot</div>
      <div class="newchat">+ New chat</div>
      <div class="hist">${['Ticket triage', 'Q3 earnings table', 'auth/ refactor', 'Launch email v2.3', 'Postgres 18 plan', 'Pricing page copy'].map((s) => `<div>${s}</div>`).join('')}</div>
    </div>
    <div class="rail-r"></div></div>`);
  world.appendChild(winEl);
  const sideMark = makeMark(34);
  $(winEl, '.brand .m').appendChild(sideMark.el);

  // thread (clipped)
  const clip = h('<div class="abs tclip" style="left:300px;top:92px;width:1200px;height:760px"></div>');
  world.appendChild(clip);
  const thread = h('<div class="abs thread" style="left:0;top:0;width:1200px;height:2000px"></div>');
  clip.appendChild(thread);
  const blocks = ASK.map((a, k) => {
    const p = PLANS[a.win];
    const b = h(`<div class="abs blk" style="left:0;top:${k * BLOCK}px;width:1200px;height:${BLOCK}px">
      <div class="abs ubub" style="right:70px;top:0">${a.ask}</div>
      <div class="abs pick" style="left:110px;top:84px;width:780px">
        <div class="pk-head"><span class="pk-s mono">auto</span><span class="pk-l">Routing by request · billed to your plans</span></div>
        <div class="pk-rows">${PLANS.map((q, i) => `<div class="pk-row" data-i="${i}">${tile(q.id, 'sm')}<div class="pk-n"><b>${q.model}</b><span class="mono">${q.slug}</span></div><span class="pk-p mono"><span class="strike">$${q.pin} · $${q.pout} /M</span></span><span class="pk-inc">Included · ${q.plan}</span><span class="pk-ck"></span></div>`).join('')}
          <div class="pk-hl"></div></div>
      </div>
      <div class="abs pill swp" style="left:110px;top:84px"><span class="ptile">${tile(p.id)}</span><span class="plbl">Switched to <b>${p.model}</b> <span class="sub">· billed to ${p.plan}</span></span><span class="spin"></span><span class="chk"></span></div>
      <div class="abs reply" style="left:110px;top:168px"><span class="av"></span><span class="rtx"></span></div>
    </div>`);
    const av = makeMark(40);
    $(b, '.av').appendChild(av.el);
    thread.appendChild(b);
    return { el: b, av };
  });

  // composer + empty-state greeting
  const greet = h(`<div class="abs greet" style="left:${COMP.x}px;top:330px;width:${COMP.w}px">How can superbot help you today?</div>`);
  world.appendChild(greet);
  const comp = h(`<div class="abs comp" style="left:${COMP.x}px;width:${COMP.w}px;height:150px">
      <div class="cp-txt"><span class="ph">Ask anything</span><span class="tx"></span><span class="caret"></span></div>
      <div class="cp-row"><span class="cp-plus">+</span><span class="cp-chip"><span class="c0">Auto ▾</span><span class="c1"><span class="stack">${PLANS.map((p) => tile(p.id, 'xs')).join('')}</span>Auto · 4 plans ▾</span></span><span class="cp-send">↑</span></div></div>`);
  world.appendChild(comp);

  // P1 fan → key
  const fan = h('<div class="abs fan" style="left:0;top:0"></div>');
  world.appendChild(fan);
  const cards = PLANS.map((p) => { const c = h(`<div class="abs pcard"><div class="pc-top">${tile(p.id)}<span class="pc-ok"><i class="dot"></i>Connected</span></div><b>${p.plan}</b><span>${p.vendor}</span></div>`); fan.appendChild(c); return c; });
  const keyCard = h(`<div class="abs kcard"><span class="kl">superbot key</span><span class="kv mono">${KEY_FULL.slice(0, 8)}…${KEY_FULL.slice(-4)}</span><span class="ks">${PLANS.map((p) => tile(p.id, 'xs')).join('')}<em>4 subscriptions · 1 key</em></span></div>`);
  fan.appendChild(keyCard);

  // usage rail
  const rail = h(`<div class="abs urail" style="left:1500px;top:92px;width:380px;height:948px">
    <div class="ur-h">Usage <span class="mo">· October</span></div><div class="ur-day"><span class="d"></span></div></div>`);
  world.appendChild(rail);
  const pm = makePlanMeter('Billed to your plans');
  const tm = makeTokenMeter('Pay-per-token, same calls');
  rail.append(pm.el, tm.el);
  const flyCost = h('<div class="abs flycost mono"></div>');
  world.appendChild(flyCost);
  const cursor = makeCursor();
  world.appendChild(cursor);
  const end = makeEnd();
  stage.appendChild(end.el);
  R = { world, sideMark, thread, blocks, greet, comp, fan, cards, keyCard, rail, pm, tm, flyCost, cursor, end };
}

function render(t) {
  const { world, sideMark, thread, blocks, greet, comp, fan, cards, keyCard, rail, pm, tm, flyCost, cursor, end } = R;
  sideMark.render(t);

  // ---- camera
  const keys = [[0, 900, 520, 1.22], [0.5, 900, 400, 1.42], [3.3, 900, 520, 1.18]];
  ASK.forEach((a, k) => {
    const blkY = 92 + THREAD_TOP + 40;
    keys.push([a.t - 0.1, 900, k === 0 ? 560 : 900, k === 0 ? 1.3 : 1.36]);
    keys.push([a.t + 1.25, 820, blkY + 200, 1.22]);
    keys.push([a.t + 2.15, 760, blkY + 84 + 56 + a.win * PICK_ROW + 33, 1.62]);
    keys.push([a.t + 2.95, 780, blkY + 84 + 27, 1.72]);
    keys.push([a.t + 3.55, 1130, 560, 1.0]);
  });
  keys.push([T_FF, 1690, 560, 1.38], [T_FF + 1.4, 1690, 640, 1.5]);
  camera(world, t, keys, { k: 58, d: 15.5 });
  op(world, smooth(t / 0.4) * (1 - smooth((t - T_END) / 0.4)));

  // ---- composer: centred empty state, drops to the bottom on the first send
  const dropK = sp(t, ASK[0].t + 1.05, PRESETS.default);
  const compY = lerp(410, 870, dropK);
  tf(comp, `translateY(${compY}px)`);
  op(greet, (1 - smooth((t - ASK[0].t - 1.0) / 0.25)) * smooth((t - 0.1) / 0.4) * (1 - 0.8 * smooth((t - 0.6) / 0.3) * (1 - smooth((t - 3.1) / 0.3))));
  tf(greet, `translateY(${-30 * dropK}px)`);
  let cur = -1;
  ASK.forEach((a, k) => { if (t >= a.t) cur = k; });
  let txt = '';
  if (cur >= 0) { const a = ASK[cur]; txt = t < a.t + 1.05 ? typed(a.ask, t, a.t, 62) : ''; }
  $(comp, '.tx').textContent = txt;
  op($(comp, '.ph'), txt ? 0 : 1);
  $(comp, '.caret').style.opacity = cur >= 0 && t < ASK[cur].t + 1.05 && Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  const sendClicks = ASK.map((a) => a.t + 1.05);
  $(comp, '.cp-send').style.transform = `scale(${pressScale(t, sendClicks)})`;
  $(comp, '.cp-send').classList.toggle('on', !!txt);
  const chipK = smooth((t - 3.25) / 0.25);
  op($(comp, '.c0'), 1 - chipK); op($(comp, '.c1'), chipK);
  $(comp, '.c0').style.display = chipK > 0.99 ? 'none' : '';
  $(comp, '.c1').style.display = chipK < 0.01 ? 'none' : '';
  $(comp, '.cp-chip').style.transform = `scale(${pressScale(t, [0.6]) * (1 + 0.06 * Math.sin(Math.PI * seg(t, 3.2, 3.55)))})`;

  // ---- P1: fan of plan cards → fold → flip to key → into the chip
  const chipX = COMP.x + 140, chipY = 410 + 118;
  const open = sp(t, 0.65, PRESETS.default);
  const fold = sp(t, 1.85, { k: 200, d: 26 });
  const flip = smooth((t - 2.25) / 0.4);
  const home = sp(t, 2.95, { k: 160, d: 24 });
  cards.forEach((c, i) => {
    const ang = (i - 1.5) * 8 * (1 - fold);
    const fx = 900 + (i - 1.5) * 222 * (1 - fold), fy = 250 + Math.abs(i - 1.5) * 22 * (1 - fold);
    const x = lerp(chipX, fx, open), y = lerp(chipY, fy, open) - (i * 3) * fold;
    const sY = flip < 0.5 ? 1 - flip * 2 : 0;
    tf(c, `translate(${x - 130}px, ${y - 90}px) rotate(${ang}deg) scale(${lerp(0.2, 1, open)}, ${lerp(0.2, 1, open) * 1}) scaleX(${sY})`);
    op(c, smooth((t - 0.65 - i * 0.05) / 0.2) * (flip < 0.5 ? 1 : 0));
  });
  const kx = lerp(900, chipX, home), ky = lerp(250, chipY, home);
  const kS = (flip >= 0.5 ? (flip - 0.5) * 2 : 0) * lerp(1, 0.18, home);
  tf(keyCard, `translate(${kx - 220}px, ${ky - 100}px) scale(${lerp(1, 0.18, home)}, ${lerp(1, 0.18, home)}) scaleX(${flip >= 0.5 ? (flip - 0.5) * 2 : 0.0001})`);
  op(keyCard, (flip >= 0.5 ? 1 : 0) * (1 - smooth((t - 3.2) / 0.12)));
  void kS;
  op(fan, t < 3.5 ? 1 : 0);

  // ---- thread
  const scroll = track(t, [[0, 0], ...ASK.slice(1).map((a, k) => [a.t + 1.0, (k + 1) * BLOCK])], 120, 22);
  tf(thread, `translateY(${THREAD_TOP - scroll}px)`);
  blocks.forEach((b, k) => {
    const a = ASK[k], u = t - a.t, p = PLANS[a.win];
    b.av.render(t);
    op(b.el, u > 1.0 ? 1 : 0);
    const ub = $(b.el, '.ubub');
    const ubk = sp(t, a.t + 1.05, PRESETS.snappy);
    tf(ub, `translateY(${(1 - ubk) * 40}px) scale(${0.96 + 0.04 * ubk})`);
    op(ub, smooth((u - 1.05) / 0.15));
    // picker
    const pick = $(b.el, '.pick');
    const pin = sp(t, a.t + 1.25, PRESETS.default);
    const collapse = smooth((u - 2.85) / 0.3);
    op(pick, smooth((u - 1.25) / 0.2) * (1 - collapse));
    tf(pick, `translateY(${(1 - pin) * 24}px) scaleY(${lerp(1, 0.2, collapse)})`);
    const hlIdx = track(t, [[0, 0], [a.t + 1.55, 1], [a.t + 1.75, 2], [a.t + 1.95, 3], [a.t + 2.2, a.win]], 320, 30);
    tf($(pick, '.pk-hl'), `translateY(${hlIdx * PICK_ROW}px)`);
    op($(pick, '.pk-hl'), smooth((u - 1.45) / 0.15));
    $$(pick, '.pk-row').forEach((row, i) => {
      const settled = u > 2.3;
      row.classList.toggle('win', settled && i === a.win);
      op(row, smooth((u - 1.3 - i * 0.05) / 0.15) * (settled && i !== a.win ? 0.45 : 1));
      $(row, '.strike').style.setProperty('--k', outCubic((u - 1.6 - i * 0.07) / 0.25).toFixed(3));
      op($(row, '.pk-inc'), smooth((u - 1.75 - i * 0.07) / 0.2));
    });
    // pill
    const pill = $(b.el, '.swp');
    const pk = sp(t, a.t + 2.95, PRESETS.snappy);
    op(pill, smooth((u - 2.95) / 0.15));
    tf(pill, `scale(${0.88 + 0.12 * pk})`);
    $(pill, '.spin').style.display = u < 3.3 ? '' : 'none';
    $(pill, '.spin').style.transform = `rotate(${t * 720}deg)`;
    $(pill, '.chk').style.display = u < 3.3 ? 'none' : '';
    // reply
    const rp = $(b.el, '.reply');
    op(rp, smooth((u - 3.3) / 0.2));
    $(rp, '.rtx').textContent = typed(a.reply, t, a.t + 3.35, 70);
    void p;
  });

  // ---- usage rail
  let spend = 0, reqs = 0;
  ASK.forEach((a) => { const k = smooth((t - a.t - 3.9) / 0.2); spend += a.cost * k; reqs += k; });
  const days = ffDays(t);
  spend += days * PER_DAY * AVG; reqs += days * PER_DAY;
  const hist = [];
  for (let i = 0; i <= 40; i++) {
    const tt = 5 + (i / 40) * Math.max(0.01, t - 5);
    let s = 0;
    ASK.forEach((a) => { s += a.cost * smooth((tt - a.t - 3.9) / 0.2); });
    s += ffDays(tt) * PER_DAY * AVG;
    hist.push(s);
  }
  tm.set(spend, reqs, t > 5 ? hist : null);
  const use = [0.08, 0.05, 0.06, 0.04].map((b0, i) => {
    let u = b0;
    ASK.forEach((a) => { if (a.win === i) u += 0.04 * smooth((t - a.t - 3.9) / 0.2); });
    return u + days * [0.012, 0.007, 0.01, 0.009][i];
  });
  pm.set(use);
  const day = Math.min(31, 1 + Math.floor(days));
  $(rail, '.ur-day .d').textContent = t > T_FF ? `Oct ${day} · ${Math.round(reqs).toLocaleString('en-US')} calls` : 'Oct 1 · today';
  rail.classList.toggle('ff', t > T_FF);

  // flying "+$cost" chips
  let fly = null;
  ASK.forEach((a) => { if (t > a.t + 3.3 && t < a.t + 4.0) fly = a; });
  if (fly) {
    const u = spring(t - fly.t - 3.3, 150, 22);
    const sx = 300 + 110 + 520, sy = 92 + THREAD_TOP + 84 + 27, ex = 1600, ey = 680;
    tf(flyCost, `translate(${lerp(sx, ex, u)}px, ${lerp(sy, ey, u) - Math.sin(Math.PI * clamp(u)) * 120}px) scale(${lerp(1, 0.7, u)})`);
    flyCost.textContent = `+${money(fly.cost, 3)} at list price`;
    op(flyCost, smooth((t - fly.t - 3.3) / 0.1) * (1 - smooth((t - fly.t - 3.85) / 0.12)));
  } else op(flyCost, 0);

  // cursor: chip click in P1, then send clicks
  const ck = [[0, 900, 760], [0.45, chipX, chipY + 4], [1.6, chipX + 20, chipY + 60]];
  ASK.forEach((a, k) => { const sy = k === 0 ? 410 + 118 : 870 + 118; ck.push([a.t + 0.35, COMP.x + COMP.w - 120, sy + 60], [a.t + 0.95, COMP.x + COMP.w - 46, sy]); ck.push([a.t + 1.6, COMP.x + COMP.w + 40, sy + 90]); });
  placeCursor(cursor, t, ck, [0.6, ...sendClicks], win(t, 0.2, 14.4, 0.25, 0.3));

  op(end.el, smooth((t - T_END) / 0.4));
  end.render(Math.max(0, t - T_END));
}

boot({ DUR, mount, render });
