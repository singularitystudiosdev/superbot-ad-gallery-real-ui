// Superbot's answer: it finds the couch used on Facebook Marketplace and sets up the pickup. One line, then four
// step chips that resolve as the card drives Marketplace for real: the search 'tan leather sofa 84' within 15 mi of
// Brooklyn types in and three listings land ($450 Park Slope, $600 Astoria, $380 Bushwick); the pointer opens the
// $380 one (Elena R., 1.6 mi away); Superbot writes the seller message into "Send seller a message" and the pointer
// presses Send; the pane turns into the Messenger thread, Elena types and replies "Yes! Saturday 11 works." (the
// sound bed's Messenger pop), and the pickup lands on the calendar (Sat, Oct 10, 11 AM). Marketplace and Messenger
// are drawn in code after facebook.com's current light UI (white, #0866FF blue, gray #F0F2F5 fields); the
// wordmarks are text, no Meta logos. The listing photos are generated for this spot. Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Found the same sofa used for $380, 1.6 mi away.';
const CHIPS = [['Opening Marketplace', 'Opened Marketplace'], ['Finding matches', 'Found 3 matches'],
  ['Messaging Elena', 'Messaged Elena'], ['Booking pickup', 'Pickup Sat 11 AM']];
const QUERY = 'tan leather sofa 84';
const MSG = 'Hi Elena, is this still available? I can pick up Saturday at 11 and pay $380.';
const REPLY = 'Yes! Saturday 11 works.';
const TITLE = 'Leather sofa, barely used, must go by Sunday';
const LISTINGS = [
  { img: 'l450.jpg', price: 450, title: 'Mid-century leather sofa', where: 'Park Slope, NY' },
  { img: 'l600.jpg', price: 600, title: 'Cognac leather couch, 84 in', where: 'Astoria, NY' },
  { img: 'l380.jpg', price: 380, title: TITLE, where: 'Bushwick, NY', pick: true },
];
const SPIN = '<i class="mk-spin"></i>';
const ICON = {
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5L14 14"/></svg>',
  pin: '<svg viewBox="0 0 16 16"><path d="M8 14.5s4.6-4.3 4.6-7.8A4.6 4.6 0 0 0 3.4 6.7c0 3.5 4.6 7.8 4.6 7.8z"/><circle cx="8" cy="6.6" r="1.6"/></svg>',
  msgr: '<svg viewBox="0 0 16 16"><path d="M8 1.6C4.3 1.6 1.6 4.3 1.6 7.7c0 1.8.8 3.4 2.1 4.5v2.2l2-1.1c.7.2 1.5.3 2.3.3 3.7 0 6.4-2.7 6.4-6S11.7 1.6 8 1.6z"/><path class="mk-bolt" d="M4.3 9.6l2.4-2.5 1.3 1.3 2.4-1.3-2.4 2.5-1.3-1.3z"/></svg>',
};

export default {
  times(r) {
    const T = {
      say: r + 0.02, c1: r + 0.08, card: r + 0.16, type: r + 0.3, c1d: r + 0.48, tiles: r + 0.6, c2: r + 0.58, c2d: r + 0.96,
      ptrIn: r + 0.96, pick: r + 1.36, listing: r + 1.46, c3: r + 1.86, write: r + 1.88, press: r + 2.74, msgr: r + 2.84,
      typing: r + 3.06, reply: r + 3.56, c4: r + 3.66, cal: r + 3.76, c4d: r + 4.02,
    };
    T.end = r + 5.12;
    return T;
  },

  build(k, { el, esc, img, box }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const chips = el(`<div class="sh-chips">${CHIPS.map(([run]) => `<span class="ch-tool"><i class="spin"></i><span class="sh-cl">${esc(run)}</span></span>`).join('')}</div>`);
    const tiles = LISTINGS.map((l, i) => `<div class="mk-tile${l.pick ? ' mk-pick' : ''}" data-i="${i}">
  <span class="mk-ph"><img src="${img(l.img)}" alt=""/></span>
  <b>$${l.price}</b><span class="mk-tt">${esc(l.title)}</span><small>${esc(l.where)}</small>
</div>`).join('');
    const card = el(`<div class="mk-card">
  <div class="mk-top"><span class="mk-wm">Marketplace</span><span class="mk-url">facebook.com/marketplace</span>
    <em class="mk-step"><span class="mk-st">Search</span><span class="mk-st">Listing</span><span class="mk-st">Messenger</span></em></div>
  <div class="mk-body">
    <div class="mk-search">
      <div class="mk-bar"><span class="mk-field">${ICON.search}<span class="mk-q"></span><i class="mk-caret"></i></span>
        <span class="mk-loc">${ICON.pin}Brooklyn, NY · Within 15 mi</span></div>
      <div class="mk-res"><b>Results for "${esc(QUERY)}"</b><small>3 listings</small></div>
      <div class="mk-grid">${tiles}</div>
    </div>
    <div class="mk-item">
      <div class="mk-big"><img src="${img('l380-lg.jpg')}" alt="Tan leather sofa listing"/><span class="mk-dots"><i class="on"></i><i></i><i></i><i></i></span></div>
      <div class="mk-side">
        <div class="mk-info">
          <h4>${esc(TITLE)}</h4>
          <div class="mk-price">$380</div>
          <small class="mk-when">Listed 2 days ago in Bushwick, NY</small>
          <span class="mk-away">${ICON.pin}1.6 mi away</span>
          <div class="mk-cond"><span>Condition</span><b>Used, like new</b></div>
          <div class="mk-seller"><img src="${img('elena.jpg')}" alt=""/><span><b>Elena R.</b><small>Seller details</small></span></div>
          <div class="mk-send">
            <div class="mk-send-h">${ICON.msgr}<b>Send seller a message</b></div>
            <div class="mk-box"><span class="mk-def">Hi, is this available?</span><span class="mk-msg"></span><i class="mk-caret mk-caret2"></i></div>
            <div class="mk-btn"><span class="mk-btn-a">Send</span><span class="mk-btn-b">${SPIN}Sending...</span></div>
          </div>
        </div>
        <div class="mk-chat">
          <div class="mk-ch"><span class="mk-av"><img src="${img('elena.jpg')}" alt=""/><i></i></span><span><b>Elena R.</b><small>Active now</small></span></div>
          <div class="mk-ctx"><img src="${img('l380.jpg')}" alt=""/><span><b>$380 · ${esc(TITLE)}</b><small>Marketplace listing</small></span></div>
          <div class="mk-thread">
            <small class="mk-time">Today 7:42 PM</small>
            <div class="mk-out">${esc(MSG)}</div>
            <small class="mk-seen">Sent</small>
            <div class="mk-inrow"><img src="${img('elena.jpg')}" alt=""/><div class="mk-typing"><i></i><i></i><i></i></div><div class="mk-in">${esc(REPLY)}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`.replace(/>\s+</g, '><'));
    const cal = el(`<div class="mk-cal"><span class="mk-cal-ic"><small>SAT</small><b>10</b></span><span class="mk-cal-t"><b>Couch pickup, Sat 11 AM, 1.6 mi</b><small>Added to your calendar · 214 Troutman St, Brooklyn</small></span><i class="mk-cal-ok"></i></div>`);
    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'),
      chips: [...chips.querySelectorAll('.ch-tool')].map((c) => ({ c, spin: c.querySelector('.spin'), lab: c.querySelector('.sh-cl') })),
      st: qa('.mk-st'), search: q('.mk-search'), q: q('.mk-q'), caret: q('.mk-caret'), res: q('.mk-res'), tiles: qa('.mk-tile'),
      pick: q('.mk-pick'), item: q('.mk-item'), info: q('.mk-info'), def: q('.mk-def'), msg: q('.mk-msg'), caret2: q('.mk-caret2'),
      btn: q('.mk-btn'), btnA: q('.mk-btn-a'), btnB: q('.mk-btn-b'), spin: q('.mk-btn .mk-spin'), chat: q('.mk-chat'),
      out: q('.mk-out'), seen: q('.mk-seen'), typing: q('.mk-typing'), dots: qa('.mk-typing i'), inb: q('.mk-in'),
      inrow: q('.mk-inrow'), time: q('.mk-time'), big: q('.mk-big'),
    };
    const chipT = [[T.c1, T.c1d], [T.c2, T.c2d], [T.c3, T.msgr], [T.c4, T.c4d]];
    let lastSay = -1, lastQ = -1, lastM = -1;

    return {
      nodes: [say, chips, card, cal],
      marks: [[T.c1, chips], [T.card, card], [T.cal, cal]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        n.chips.forEach((ch, i) => {
          const [a, d] = chipT[i];
          const p = outBack(seg(t, a, a + 0.3));
          ch.c.style.opacity = clamp(p * 1.3).toFixed(3);
          ch.c.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px) scale(${lerp(0.85, 1, p).toFixed(3)})`;
          const done = t >= d;
          ch.spin.classList.toggle('done', done);
          ch.c.classList.toggle('sh-ok', done);
          ch.lab.textContent = CHIPS[i][done ? 1 : 0];
          ch.spin.style.transform = done ? 'none' : `rotate(${((t - a) * 400).toFixed(1)}deg)`;
        });

        const a = outCubic(seg(t, T.card, T.card + 0.34));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 14).toFixed(2)}px)`;
        const step = t >= T.msgr ? 2 : t >= T.listing ? 1 : 0;
        n.st.forEach((s, i) => { s.style.display = i === step ? '' : 'none'; });

        // search: the query types in, the three listings land
        const qn = Math.round(QUERY.length * seg(t, T.type, T.type + 0.26));
        if (qn !== lastQ) { n.q.textContent = QUERY.slice(0, qn); lastQ = qn; }
        n.caret.style.opacity = t < T.tiles && Math.floor(t * 4) % 2 === 0 ? '1' : '0';
        n.res.style.opacity = seg(t, T.tiles - 0.05, T.tiles + 0.15).toFixed(3);
        n.tiles.forEach((tl, i) => {
          const p = outCubic(seg(t, T.tiles + i * 0.08, T.tiles + i * 0.08 + 0.3));
          tl.style.opacity = p.toFixed(3);
          tl.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
        });
        // the pick: the $380 tile presses and lights
        const pk = Math.sin(Math.PI * seg(t, T.pick - 0.04, T.pick + 0.14));
        n.pick.classList.toggle('mk-sel', t >= T.pick);
        if (t >= T.tiles + 0.46) n.pick.style.transform = pk > 0 ? `scale(${(1 - 0.03 * pk).toFixed(4)})` : 'none';

        // listing page over the results
        const li = inOutCubic(seg(t, T.listing, T.listing + 0.28));
        n.search.style.opacity = (1 - li).toFixed(3);
        n.search.style.visibility = li >= 1 ? 'hidden' : 'visible';
        n.item.style.opacity = li.toFixed(3);
        n.item.style.visibility = li > 0 ? 'visible' : 'hidden';
        n.big.style.transform = li >= 1 ? 'none' : `scale(${lerp(0.94, 1, li).toFixed(4)})`;

        // Superbot writes its own message over Marketplace's default, then presses Send
        const mn = Math.round(MSG.length * seg(t, T.write, T.write + 0.7));
        if (mn !== lastM) { n.msg.textContent = MSG.slice(0, mn); lastM = mn; }
        n.def.style.display = t >= T.write ? 'none' : '';
        n.caret2.style.opacity = t >= T.write && t < T.press && Math.floor(t * 4) % 2 === 0 ? '1' : '0';
        const bp = Math.sin(Math.PI * seg(t, T.press - 0.04, T.press + 0.14));
        n.btn.style.transform = bp > 0 ? `scale(${(1 - 0.05 * bp).toFixed(4)})` : 'none';
        const sp = seg(t, T.press + 0.02, T.press + 0.1);
        n.btnA.style.opacity = (1 - sp).toFixed(3);
        n.btnB.style.opacity = sp.toFixed(3);
        n.spin.style.transform = `rotate(${((t - T.press) * 520).toFixed(1)}deg)`;

        // Messenger: the side pane turns into the thread with Elena
        const m = inOutCubic(seg(t, T.msgr, T.msgr + 0.26));
        n.info.style.opacity = (1 - m).toFixed(3);
        n.info.style.visibility = m >= 1 ? 'hidden' : 'visible';
        n.chat.style.opacity = m.toFixed(3);
        n.chat.style.visibility = m > 0 ? 'visible' : 'hidden';
        n.chat.style.transform = m >= 1 ? 'none' : `translateX(${((1 - m) * 18).toFixed(2)}px)`;
        const o = outCubic(seg(t, T.msgr + 0.08, T.msgr + 0.36));
        n.out.style.opacity = o.toFixed(3);
        n.out.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 10).toFixed(2)}px)`;
        n.seen.style.opacity = seg(t, T.msgr + 0.3, T.msgr + 0.45).toFixed(3);
        n.time.style.opacity = m.toFixed(3);
        // typing dots, then the reply pops in
        const ty = seg(t, T.typing, T.typing + 0.12) * (1 - seg(t, T.reply - 0.06, T.reply));
        n.typing.style.display = t < T.reply ? '' : 'none';
        n.typing.style.opacity = ty.toFixed(3);
        n.dots.forEach((d, i) => { d.style.transform = `translateY(${(-2.2 * Math.max(0, Math.sin((t - T.typing) * 12 - i * 0.9))).toFixed(2)}px)`; });
        n.inrow.style.opacity = t >= T.typing ? '1' : '0';
        const rp = outBack(seg(t, T.reply, T.reply + 0.3));
        n.inb.style.display = t >= T.reply ? '' : 'none';
        n.inb.style.opacity = clamp(rp * 1.5).toFixed(3);
        n.inb.style.transform = `scale(${lerp(0.6, 1, rp).toFixed(4)})`;

        // the pickup lands on the calendar under the card
        const cp = outBack(seg(t, T.cal, T.cal + 0.34));
        cal.style.opacity = clamp(cp * 1.4).toFixed(3);
        cal.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 12).toFixed(2)}px) scale(${lerp(0.92, 1, cp).toFixed(4)})`;
        cal.classList.toggle('mk-cal-done', t >= T.c4d);
      },
      // the pointer opens the $380 listing, then presses Send (section px via box)
      pointer(t) {
        if (t < T.ptrIn || t > T.press + 0.4) return null;
        const pb = box(n.pick), sb = box(n.btn);
        const p0 = { x: pb.x + pb.w * 0.55, y: pb.y + pb.h * 0.42 }, p1 = { x: sb.x + sb.w * 0.62, y: sb.y + sb.h * 0.55 };
        const start = { x: p0.x - 60, y: p0.y + 150 };
        let x, y;
        if (t < T.pick) { const mm = inOutCubic(seg(t, T.ptrIn, T.pick - 0.05)); x = lerp(start.x, p0.x, mm); y = lerp(start.y, p0.y, mm); }
        else { const mm = inOutCubic(seg(t, T.write + 0.3, T.press - 0.05)); x = lerp(p0.x, p1.x, mm); y = lerp(p0.y, p1.y, mm); }
        const v = seg(t, T.ptrIn, T.ptrIn + 0.15) * (1 - seg(t, T.press + 0.2, T.press + 0.4));
        const press = Math.max(Math.sin(Math.PI * seg(t, T.pick - 0.04, T.pick + 0.14)), Math.sin(Math.PI * seg(t, T.press - 0.04, T.press + 0.14)));
        return { x, y, p: press, v };
      },
    };
  },
};
