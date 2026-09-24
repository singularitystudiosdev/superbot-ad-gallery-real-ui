// scene 'dash': "I just want a burger from DoorDash". Superbot opens DoorDash, picks a burger, checks out,
// and the order card lands in the chat; the camera pushes onto it and the waffles-delivery "Order placed"
// button language (gradient Publish pill, 5% dip, light shine, bag turns into a drawn white check) resolves
// into a big "Ordered!" with the ETA. No IRL / delivery footage (user ask).
//
// Card photo: scenes/dash-assets/burger.jpg = "Cheeseburger.jpg" by Renee Comet (photographer), National
// Cancer Institute (NCI Visuals Online id 2652), Public domain.
// https://commons.wikimedia.org/wiki/File:Cheeseburger.jpg  (960px Commons thumbnail). See dash-assets/CREDITS.txt.
// DoorDash logomark: ../brand/doordash-logo.svg (see ../brand/CREDITS.txt).
// Restaurant "Main Street Burger Co." is a generic, made-up name.
import * as L from '../lib.js';
import { makeShell, userBubble, botBlock, toolChip, setToolState, setComposer } from '../shell.js';

const PROMPT = 'I just want a burger from DoorDash';
const REPLY = 'On it. Getting you a burger on DoorDash.';
const CHIPS = [
  ['Opening DoorDash', 'Opened DoorDash'],
  ['Picking the best-rated burger near you', 'Picked Main Street Burger Co.'],
  ['Checking out with your saved card', 'Checked out with your saved card'],
];

// beats (local seconds)
const B = {
  type: -0.12,                        // composer typing (60 cps) is already under way: ~25 chars in at lt 0.3
  send: 0.62,                         // send press right after the last key; the bubble rises
  reply: 0.88,                        // superbot streams its line (130 cps)
  chipIn: [1.13, 1.58, 2.03],         // tool chips land one by one
  chipDone: [1.68, 2.53, 4.83],       // the last one flips when the order is placed
  card: 2.58,                         // the order card rises in
  push: [3.03, 4.13],                 // camera pushes onto the card
  placed: 4.83,                       // "Placing order..." -> "Ordered!"
  eta: 5.28,                          // ETA line under the button
};
const DUR = 7.45;

const BAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12H6.2Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const PIN = '<svg viewBox="0 0 24 24"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z"/></svg>';

let S, u, b, replyVis, replyHid, chipRows = [], chips = [], card, btn, grpA, grpB, labA, bag, check, checkP, shine, etaPill, etaLine;

export default {
  id: 'dash',
  dur: DUR,
  mount(section) {
    S = makeShell({
      mode: 'chat', title: 'Burger from DoorDash',
      projects: [{ name: 'Burger from DoorDash', when: 'now' }, { name: 'Fix login redirect', when: '2m' }, { name: 'Appling', when: '5m' }],
      active: 0,
    });
    section.appendChild(S.root);

    u = userBubble(PROMPT);
    b = botBlock(`<p class="dd-reply"><span class="dd-vis"></span><span class="dd-hid">${L.esc(REPLY)}</span></p>`);
    replyVis = b.querySelector('.dd-vis'); replyHid = b.querySelector('.dd-hid');
    for (const [label] of CHIPS) {
      const row = document.createElement('div'); row.className = 'dd-chiprow';
      const c = toolChip(label, 'run'); row.appendChild(c); b.appendChild(row);
      chipRows.push(row); chips.push(c);
    }
    const logo = new URL('../brand/doordash-logo.svg', import.meta.url).href;
    const photo = new URL('./dash-assets/burger.jpg', import.meta.url).href;
    card = document.createElement('div');
    card.className = 'dd-card';
    card.innerHTML = `
      <div class="dd-head"><img class="dd-logo" src="${logo}" alt="DoorDash"/><b>DoorDash order</b><span class="dd-tag">1 item</span></div>
      <div class="dd-photo"><img src="${photo}" alt="Cheeseburger"/><span class="dd-place"><b>Main Street Burger Co.</b><i>${STAR}4.8</i><em>0.8 mi</em></span></div>
      <div class="dd-item"><span class="dd-thumb" style="background-image:url('${photo}')"></span><span class="dd-meta"><b>Cheeseburger</b><small>Cheddar, pickles, house sauce</small></span><span class="dd-qty">1x</span><span class="dd-price">$7.99</span></div>
      <div class="dd-fees">
        <div><span>Delivery fee</span><span>$1.99</span></div>
        <div><span>Service fee</span><span>$1.42</span></div>
        <div><span>Dasher tip</span><span>$3.00</span></div>
        <div class="dd-total"><span>Total</span><span>$14.40</span></div>
      </div>
      <div class="dd-addr"><span class="dd-pin">${PIN}</span><span class="dd-where"><b>Deliver to 1480 Market St, Apt 5</b><small>Visa ending 4242</small></span><span class="dd-eta"><span class="dd-eta-a">${CLOCK}24 min</span></span></div>
      <div class="dd-btn">
        <span class="dd-grp dd-grp-a">${BAG}<span class="dd-lab-a">Placing order</span></span>
        <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Ordered!</span></span>
        <i class="dd-shine" aria-hidden="true"></i>
      </div>
      <div class="dd-etaline">${CLOCK}<span>Arriving in <b>24 min</b> · your Dasher is on the way</span></div>`;
    b.appendChild(card);
    S.feedIn.append(u, b);

    btn = card.querySelector('.dd-btn'); grpA = card.querySelector('.dd-grp-a'); grpB = card.querySelector('.dd-grp-b');
    labA = card.querySelector('.dd-lab-a'); bag = card.querySelector('.dd-bag'); check = card.querySelector('.dd-check');
    checkP = card.querySelector('.dd-check-p'); shine = card.querySelector('.dd-shine');
    etaPill = card.querySelector('.dd-eta'); etaLine = card.querySelector('.dd-etaline');
  },

  render(lt, ctx) {
    const { W, H } = ctx;
    S.renderMarks(ctx.t);

    // ---- composer: the prompt types at 60 cps, the send button dips, the draft clears ----
    const ty = L.typed(PROMPT, B.type, 60, lt);
    setComposer(S, lt < B.send + 0.05 ? ty.text : '', { caret: lt < B.send + 0.05, press: L.press(lt, B.send) });

    // ---- thread: everything occupies its space from the start (no layout jumps); reveals are opacity + rise ----
    rise(u, L.seg(lt, B.send + 0.05, B.send + 0.4), 10);
    const n = L.streamCount(REPLY, B.reply, 130, lt);
    replyVis.textContent = REPLY.slice(0, n); replyHid.textContent = REPLY.slice(n);
    L.op(b.querySelector('.dd-reply'), lt >= B.reply ? 1 : 0);
    chips.forEach((c, i) => {
      rise(chipRows[i], L.seg(lt, B.chipIn[i], B.chipIn[i] + 0.35), 8);
      const done = lt >= B.chipDone[i];
      setToolState(c, done ? 'done' : 'run', done ? CHIPS[i][1] : CHIPS[i][0], lt);
    });
    const ci = L.seg(lt, B.card, B.card + 0.5);
    rise(card, ci, 18);

    // ---- feed: bottom-anchored like a live chat. The newest revealed line always sits just above the composer,
    // so the thread grows upward out of it and there is never an empty band between them. Every move eases
    // in and out (lib.path = inOutCubic). Unrevealed items keep their space below, clipped by the feed. ----
    const feedH = S.feed.clientHeight, pad = 18;
    const reply = b.querySelector('.dd-reply');
    const bot = (el, base = 0) => base + el.offsetTop + el.offsetHeight;
    const yU = bot(u), yR = bot(reply, b.offsetTop), yC = chipRows.map((r) => bot(r, b.offsetTop)), yK = bot(card, b.offsetTop);
    const LB = L.path(lt, [
      { t: 0, x: 0, y: yU }, { t: B.reply, x: 0, y: yU }, { t: B.reply + 0.3, x: 0, y: yR },
      { t: B.chipIn[0], x: 0, y: yR }, { t: B.chipIn[0] + 0.35, x: 0, y: yC[0] },
      { t: B.chipIn[1], x: 0, y: yC[0] }, { t: B.chipIn[1] + 0.35, x: 0, y: yC[1] },
      { t: B.chipIn[2], x: 0, y: yC[1] }, { t: B.chipIn[2] + 0.35, x: 0, y: yC[2] },
      { t: B.card, x: 0, y: yC[2] }, { t: B.card + 0.85, x: 0, y: yK }, { t: DUR, x: 0, y: yK }]).y;
    const y = LB - feedH + pad, yCard = yK - feedH + pad;             // may be negative (content pushed down)
    S.feedIn.style.transform = `translateY(${(-y).toFixed(2)}px)`;

    // ---- the order button: waffles-delivery's placing -> placed, resolving into "Ordered!" ----
    const P = B.placed;
    labA.textContent = 'Placing order' + '.'.repeat(1 + (Math.floor(Math.max(0, lt - B.card) * 4) % 3));
    const down = L.seg(lt, P - 0.06, P + 0.04) * (1 - L.seg(lt, P + 0.1, P + 0.24));
    const pop = L.outBack(L.seg(lt, P + 0.1, P + 0.5));
    btn.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * L.seg(lt, P + 0.1, P + 0.5))).toFixed(4)})`;
    const sh = L.seg(lt, P + 0.02, P + 0.62);
    L.op(shine, sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0);
    shine.style.transform = `translateX(${L.lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
    const ro = L.seg(lt, P + 0.04, P + 0.3);
    L.op(grpA, 1 - L.outCubic(ro));
    grpA.style.transform = `translate(-50%, calc(-50% - ${(L.outCubic(ro) * 10).toFixed(2)}px))`;
    bag.style.transform = `rotate(${(-40 * ro).toFixed(1)}deg) scale(${(1 - 0.6 * ro).toFixed(3)})`;
    const gi = L.seg(lt, P + 0.1, P + 0.45);
    L.op(grpB, L.outCubic(gi));
    grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - L.outCubic(gi)) * 10).toFixed(2)}px)) scale(${L.lerp(0.9, 1, pop).toFixed(4)})`;
    const ck = L.seg(lt, P + 0.14, P + 0.44);
    checkP.style.strokeDashoffset = (23 * (1 - L.outCubic(ck))).toFixed(2);
    check.style.transform = `scale(${L.lerp(0.55, 1, L.outBack(L.seg(lt, P + 0.14, P + 0.4))).toFixed(3)})`;
    card.classList.toggle('is-placed', lt >= P);

    // ETA: the pill in the address row lights up, then the arrival line settles under the button
    const ep = L.seg(lt, B.eta - 0.2, B.eta + 0.15);
    etaPill.style.setProperty('--lit', L.outCubic(ep).toFixed(3));
    etaPill.style.transform = `scale(${(1 + 0.08 * Math.sin(Math.PI * ep)).toFixed(4)})`;
    rise(etaLine, L.seg(lt, B.eta, B.eta + 0.45), 6);

    // ---- camera: no pans over empty feed. Bottom-anchored the whole chat phase (composer on the bottom edge,
    // header out of frame): a close-up on the typed prompt eases out to the thread framing, then one
    // inOutCubic push lands on the order card. ----
    S.root.style.transform = 'none';                         // measure with the camera off: exact, history-free
    const fb = L.boxIn(S.feed, S.root);                      // feed viewport in root px
    const q = fb.w / (S.feed.offsetWidth || 1);              // window layout px -> root px (the 1.6 window scale)
    const cb = L.boxIn(S.root.querySelector('.composer'), S.root);
    const colX = cb.x + cb.w / 2;
    // scales cap at the 16:9 values and shrink to keep the subject whole on narrower frames (?ar=1x1 / 4x5)
    // chat phase never shows a half-cut title bar: zoom enough to push the header fully out of frame, or, when
    // that would crop the column's sides (tall 4:5), show the whole window (header fully in)
    const sNoHead = H / Math.max(1, H - fb.y);
    const chatScale = (fit) => (sNoHead <= fit ? Math.max(1, sNoHead, fit) : 1);
    const sA = chatScale(Math.min(1.75, 0.94 * W / cb.w));
    const sB = chatScale(Math.min(1.6, 0.98 * W / (q * 640)));
    // final framing: top edge just above the order card (the chip above stays out), bottom edge at the composer's top
    const cardTopRoot = fb.y + q * ((b.offsetTop + card.offsetTop) - yCard);
    const top1 = cardTopRoot - q * 7, bot1 = cb.y - 1;
    const s1 = Math.max(1, Math.min(0.9 * W / (q * card.offsetWidth), H / (bot1 - top1)));
    const k0 = L.inOutCubic(L.seg(lt, B.send - 0.1, B.send + 0.75));  // prompt close-up -> thread framing
    const k = L.inOutCubic(L.seg(lt, B.push[0], B.push[1]));          // thread -> card
    const sChat = L.lerp(sA, sB, k0);
    const s = L.lerp(sChat, s1, k);
    // vertical: interpolate the frame's top edge (bottom-anchored top -> card top); horizontal: centre
    const topChat = H - H / sChat;
    const top = L.lerp(topChat, top1, k);
    const cx = L.lerp(colX, fb.x + q * (S.feedIn.offsetLeft + b.offsetLeft + card.offsetLeft + card.offsetWidth / 2), k);
    const tx = Math.min(0, Math.max(W - s * W, W / 2 - s * cx));
    const tyy = Math.min(0, Math.max(H - s * H, -s * top));
    S.root.style.transform = `translate(${tx.toFixed(2)}px, ${tyy.toFixed(2)}px) scale(${s.toFixed(4)})`;
  },
};

function rise(el, p, dy) {
  const e = L.outCubic(p);
  L.op(el, e);
  el.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}
