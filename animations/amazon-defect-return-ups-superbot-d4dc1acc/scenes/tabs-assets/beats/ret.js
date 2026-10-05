// Superbot does the return for real in Amazon: Your Orders with the Vortexa row lit and "Return or replace items"
// pressed; the return form (reason "Item defective or doesn't work", Claude's comment typed in, the clip attached,
// the refund to Visa ending 4242); the return method (UPS pickup Mon, Oct 5, 9 AM to 1 PM at 1480 Market St, the
// driver brings the label) and the gradient "Confirm your return" pill; then the screens fold to the confirmation with
// the UPS pickup tracker on step 1, and a Google Calendar reminder lands under it.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';
import { ITEM, CLIP, COMMENT, REASON, CARD, ADDR, PICKUP, METHODS, REMIND } from './returns.js';
import { clipThumbHTML } from './clip.js';

const SAY = 'Starting your Amazon return now.';
const CHIPS = [
  ['Opening Amazon', 'Opened Amazon'],
  ['Starting a defect return', 'Started a defect return'],
  ['Booking UPS pickup', `Booked UPS pickup Mon ${PICKUP.win}`],
  ['Setting a reminder', 'Set a reminder'],
];
const OPTIONS = ['Bought by mistake', REASON, 'Product damaged, but shipping box OK', 'No longer needed'];
const PICK_OPT = 1;
const TYPE_CPS = 92;
const STEPS = ['Your Orders', 'Return items', 'Return method', 'Return started'];
const CHEV = '<svg class="az-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const BOX = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/></svg>';
const OKC = '<svg class="ot-okc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>';
const CURSOR = '<svg class="ot-cur" viewBox="0 0 24 24"><path d="M5 2.5v17.2l4.3-4.1 2.8 6.4 2.9-1.3-2.8-6.3h6.1Z"/></svg>';
const PIN = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>';
const LABEL = '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4Z"/><path d="M7.5 9h9M7.5 12.5h5M7.5 16h3"/></svg>';
const BELL = '<svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
const I = (svg, cls = '') => `<span class="ot-i ${cls}">${svg}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.45;
    // A: Your Orders, the order lights up, the pointer presses "Return or replace items"
    T.lit = T.card + 0.45;
    T.cur = T.card + 0.6;
    T.tap = T.card + 1.35;
    // B: the return form
    T.b = T.tap + 0.4;
    T.sel = T.b + 0.45;
    T.opt = T.sel + 0.3;
    T.selDone = T.sel + 0.75;
    T.ty0 = T.selDone + 0.2;
    T.ty1 = T.ty0 + COMMENT.length / TYPE_CPS;
    T.att = T.ty1 + 0.1;
    T.ref = T.att + 0.3;
    // C: the return method, UPS pickup, confirm
    T.c = T.ref + 0.95;
    T.m = METHODS.map((_, i) => T.c + 0.3 + i * 0.09);
    T.pick = T.c + 0.75;
    T.press = T.pick + 1.15;
    T.done = T.press + 0.7;
    // D: the confirmation with the UPS tracker, then the reminder
    T.d = T.done + 0.35;
    T.ups = T.d + 0.4;
    T.gc = T.d + 0.75;
    T.chipIn = [r + 0.15, T.tap, T.c, T.gc - 0.15];
    T.chipDone = [T.card + 0.3, T.ref + 0.3, T.done, T.gc + 0.45];
    T.end = T.gc + 1.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el(`<div class="dd-chiprow eb-chiprow az-chips">${CHIPS.map(([run]) => `<div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div>`).join('')}</div>`);
    const prod = x.img('product.jpg');
    const stack = x.el(`<div class="az-stack">
      <div class="az-card">
        <div class="az-head"><b class="az-wm">amazon</b><span class="az-belt">${I(PIN)}Deliver to <b>${ADDR}</b></span><span class="az-step">${STEPS.map((s) => `<em>${s}</em>`).join('')}</span></div>
        <div class="az-body">
          <div class="az-scr az-a">
            <div class="az-h4">Your Orders</div>
            <div class="az-tabs"><span class="on">Orders</span><span>Buy Again</span><span>Not Yet Shipped</span></div>
            <div class="az-ord">
              <div class="az-oh"><div><small>ORDER PLACED</small><span>${ITEM.placed}</span></div><div><small>TOTAL</small><span>${ITEM.price}</span></div><div class="az-onum"><small>ORDER # ${ITEM.order}</small><span class="az-lk">View order details</span></div></div>
              <div class="az-ob">
                <div class="az-l"><b class="az-dl">${ITEM.deliveredLong}</b><small>Your package was left near the front door.</small>
                  <div class="az-it"><img src="${prod}" alt=""/><div><span class="az-lk">${x.esc(ITEM.name)}</span><small>Return items: ${ITEM.eligible}</small></div></div></div>
                <div class="az-btns"><span class="az-bt">Get product support</span><span class="az-bt az-ret">Return or replace items</span><span class="az-bt">Write a product review</span></div>
              </div>
            </div>
            ${CURSOR}<i class="ot-ring az-ring"></i>
          </div>
          <div class="az-scr az-b">
            <div class="az-it2"><img src="${prod}" alt=""/><div><b>${x.esc(ITEM.name)}</b><small>${ITEM.price} · Qty 1</small></div><i class="az-cbx">${TICK}</i></div>
            <small class="az-lab">Why are you returning this?</small>
            <div class="az-sel"><span class="az-sv">Choose a response</span>${CHEV}
              <div class="az-dd">${OPTIONS.map((o) => `<div class="az-opt">${x.esc(o)}</div>`).join('')}</div></div>
            <small class="az-lab">Comments (required)</small>
            <div class="az-ta"><span class="az-tt"></span><i class="az-caret"></i></div>
            <div class="az-att"><span class="vc-mini">${clipThumbHTML(x.img, 'vc-m')}</span><b>${x.esc(CLIP.file)}</b><span>${CLIP.len}</span><em>${TICK}Video attached</em></div>
            <div class="az-ref"><small class="az-lab">Refund</small><div class="az-rr"><span>Original payment, <b>${CARD}</b></span><b class="az-amt">${ITEM.price}</b></div></div>
          </div>
          <div class="az-scr az-c">
            <div class="az-h5">How would you like to return it?</div>
            <div class="az-ms">${METHODS.map((m) => `<div class="az-m${m.pick ? ' az-pk' : ''}"><i class="az-rad"></i><div class="az-mm"><b>${x.esc(m.name)}</b><small>${x.esc(m.sub)}</small>
              ${m.pick ? `<div class="az-mx"><span>${I(PIN)}Pickup at <b>${ADDR}</b></span><span>${I(LABEL)}${x.esc(PICKUP.note)}</span></div>` : ''}</div><span class="az-fee">${m.fee}</span></div>`).join('')}</div>
            <div class="dd-btn az-btn">
              <span class="dd-grp ot-grp-0">${BOX}<span>Confirm your return</span></span>
              <span class="dd-grp dd-grp-a"><span class="eb-bspin"></span><span class="dd-lab-a">Confirming</span></span>
              <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Confirmed</span></span>
              <i class="dd-shine" aria-hidden="true"></i>
            </div>
          </div>
          <div class="az-scr az-d">
            <div class="ot-ok az-ok">${OKC}<b>Return started</b><span>Refund ${ITEM.price}</span></div>
            <p class="az-msg">Refund of ${ITEM.price} to ${CARD} when UPS scans it.</p>
            <div class="ups">
              <div class="ups-h"><b class="ups-wm">UPS</b><span>Pickup ${PICKUP.day}, ${PICKUP.win}</span><small>${ADDR}</small></div>
              <div class="ups-steps"><span class="ups-s"><i>1</i><b>Scheduled</b></span><i class="ups-ln"><i></i></i><span class="ups-s"><i>2</i><b>Picked up</b></span><i class="ups-ln"></i><span class="ups-s"><i>3</i><b>Refunded</b></span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="gc-card az-gc">
        <div class="gc-top"><img src="${x.brand('gcal-logo.svg')}" alt=""/><span>Calendar</span><em>Reminder set</em></div>
        <div class="gc-ev"><i class="gc-sq"></i><div><b>${x.esc(REMIND.title)}</b><span>${REMIND.when} · ${REMIND.time}</span></div></div>
        <div class="gc-ln">${I(BELL)}<span>Before the UPS pickup, ${PICKUP.win}</span></div>
      </div>
    </div>`);
    const $ = (s) => stack.querySelector(s), $$ = (s) => [...stack.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = [...row.children];
    const card = $('.az-card'), body = $('.az-body'), scrs = $$('.az-scr'), steps = $$('.az-step em');
    const ord = $('.az-ord'), retB = $('.az-ret'), cur = $('.ot-cur'), ring = $('.az-ring'), scrA = $('.az-a');
    const sel = $('.az-sel'), sv = $('.az-sv'), dd = $('.az-dd'), opts = $$('.az-opt');
    const tt = $('.az-tt'), caret = $('.az-caret'), ta = $('.az-ta'), att = $('.az-att'), ref = $('.az-ref'), cbx = $('.az-cbx');
    const ms = $$('.az-m'), pk = $('.az-pk'), mx = $('.az-mx');
    const btn = $('.az-btn'), g0 = $('.az-btn .ot-grp-0'), grpA = $('.az-btn .dd-grp-a'), grpB = $('.az-btn .dd-grp-b'), labA = $('.az-btn .dd-lab-a');
    const shine = $('.az-btn .dd-shine'), check = $('.az-btn .dd-check'), checkP = $('.az-btn .dd-check-p'), bspin = $('.az-btn .eb-bspin');
    const okc = $('.az-ok .ot-okc'), okRow = $('.az-ok'), msg = $('.az-msg'), ups = $('.ups'), upsS = $$('.ups-s'), upsL = $('.ups-ln i');
    const gc = $('.az-gc');
    const SW = [T.b, T.c, T.d];
    let shown = -1, typedN = -1, svT = '';
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const xy = (node, root) => { let x0 = node.offsetWidth / 2, y0 = node.offsetHeight / 2, n = node; while (n && n !== root) { x0 += n.offsetLeft; y0 += n.offsetTop; n = n.offsetParent; } return [x0, y0]; };
    return {
      nodes: [say, row, stack],
      marks: [[T.r, say], [T.chipIn[0], row], [T.card, card], [T.gc, gc]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          const p = seg(t, T.chipIn[i], T.chipIn[i] + 0.3), e = outCubic(p);
          c.style.opacity = e.toFixed(3);
          c.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 8).toFixed(2)}px)`;
          const done = t >= T.chipDone[i], sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const ci = seg(t, T.card, T.card + 0.5);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // screens A -> B -> C -> D slide across; the body eases to each screen's height (measured live: C grows as
        // the UPS pickup row opens its details, and nothing is measured before the fonts are in)
        mx.style.height = 'auto';
        const mxh = mx.scrollHeight;
        mx.style.height = `${(mxh * inOutCubic(seg(t, T.pick + 0.05, T.pick + 0.4))).toFixed(2)}px`;
        const H = scrs.map((s) => s.scrollHeight);
        let h = H[0];
        SW.forEach((s, j) => { h = lerp(h, H[j + 1], inOutCubic(seg(t, s, s + 0.4))); });
        body.style.height = `${h.toFixed(2)}px`;
        scrs.forEach((s, i) => {
          const e = i === 0 ? 1 : inOutCubic(seg(t, SW[i - 1], SW[i - 1] + 0.35));
          const xo = i === scrs.length - 1 ? 0 : inOutCubic(seg(t, SW[i], SW[i] + 0.35));
          s.style.opacity = (e * (1 - xo)).toFixed(3);
          s.style.transform = e < 1 ? `translateX(${((1 - e) * 30).toFixed(2)}px)` : xo > 0 ? `translateX(${(-xo * 30).toFixed(2)}px)` : '';
          s.style.visibility = e > 0 && xo < 1 ? 'visible' : 'hidden';
        });
        const stepAt = SW.filter((s) => t >= s + 0.15).length;
        steps.forEach((s, i) => { s.style.opacity = i === stepAt ? '1' : '0'; });

        // A: the order lights up, the pointer presses "Return or replace items"
        ord.style.setProperty('--lit', outCubic(seg(t, T.lit, T.lit + 0.3)).toFixed(3));
        const down = seg(t, T.tap - 0.05, T.tap + 0.05) * (1 - seg(t, T.tap + 0.12, T.tap + 0.3));
        retB.style.transform = `scale(${(1 - 0.06 * down).toFixed(4)})`;
        retB.classList.toggle('on', t >= T.tap);
        const [rx, ry] = xy(retB, scrA);
        const m = inOutCubic(seg(t, T.cur, T.tap - 0.06));
        cur.style.opacity = (outCubic(seg(t, T.cur, T.cur + 0.15)) * (1 - seg(t, T.tap + 0.25, T.tap + 0.4))).toFixed(3);
        cur.style.transform = `translate(${lerp(rx - 260, rx - 6, m).toFixed(1)}px, ${lerp(ry + 60, ry - 2, m).toFixed(1)}px) scale(${(1 - 0.12 * down).toFixed(3)})`;
        const rp = seg(t, T.tap, T.tap + 0.4);
        ring.style.opacity = (rp > 0 && rp < 1 ? 1 - rp : 0).toFixed(3);
        ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px) translate(-50%, -50%) scale(${lerp(0.3, 1.6, outCubic(rp)).toFixed(3)})`;

        // B: the reason dropdown opens and picks, the comment types in, the clip attaches, the refund shows
        cbx.style.transform = `scale(${lerp(0.4, 1, outBack(seg(t, T.b + 0.2, T.b + 0.45))).toFixed(3)})`;
        cbx.style.opacity = outCubic(seg(t, T.b + 0.2, T.b + 0.4)).toFixed(3);
        const op = seg(t, T.sel, T.sel + 0.18) * (1 - seg(t, T.selDone - 0.08, T.selDone + 0.08));
        dd.style.opacity = op.toFixed(3);
        dd.style.transform = `scaleY(${lerp(0.85, 1, op).toFixed(4)})`;
        opts.forEach((o, i) => o.classList.toggle('on', i === PICK_OPT && t >= T.opt));
        sel.style.setProperty('--focus', (seg(t, T.sel - 0.1, T.sel) * (1 - seg(t, T.selDone + 0.2, T.selDone + 0.5))).toFixed(3));
        const svN = t >= T.selDone ? REASON : 'Choose a response';
        if (svN !== svT) { sv.textContent = svN; sv.classList.toggle('set', t >= T.selDone); svT = svN; }
        const tn = streamCount(COMMENT, T.ty0, TYPE_CPS, t);
        if (tn !== typedN) { tt.textContent = COMMENT.slice(0, tn); typedN = tn; }
        caret.style.opacity = t >= T.ty0 - 0.1 && t < T.ty1 + 0.15 ? '1' : '0';
        ta.style.setProperty('--focus', (seg(t, T.ty0 - 0.12, T.ty0) * (1 - seg(t, T.ty1 + 0.1, T.ty1 + 0.35))).toFixed(3));
        rise(att, seg(t, T.att, T.att + 0.3), 6);
        rise(ref, seg(t, T.ref, T.ref + 0.3), 6);

        // C: the methods come up, UPS pickup is picked and opens its details, the pill confirms
        ms.forEach((r0, i) => rise(r0, seg(t, T.m[i], T.m[i] + 0.3), 6));
        const pp = seg(t, T.pick, T.pick + 0.3);
        pk.style.setProperty('--pick', outCubic(pp).toFixed(3));
        pk.classList.toggle('on', t >= T.pick);
        mx.style.opacity = outCubic(seg(t, T.pick + 0.2, T.pick + 0.5)).toFixed(3);
        const P = T.press, D = T.done;
        const bd = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
        const pop = seg(t, D, D + 0.4);
        btn.style.transform = `scale(${(1 - 0.05 * bd + 0.03 * Math.sin(Math.PI * pop)).toFixed(4)})`;
        const r0 = seg(t, P + 0.02, P + 0.2);
        g0.style.opacity = (1 - outCubic(r0)).toFixed(3);
        g0.style.transform = `translate(-50%, calc(-50% - ${(outCubic(r0) * 10).toFixed(2)}px))`;
        const ai = seg(t, P + 0.08, P + 0.26), ao = seg(t, D - 0.02, D + 0.16);
        grpA.style.opacity = (outCubic(ai) * (1 - outCubic(ao))).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% + ${(((1 - outCubic(ai)) - outCubic(ao)) * 10).toFixed(2)}px))`;
        bspin.style.transform = `rotate(${(((t - P) * 540) % 360).toFixed(1)}deg)`;
        labA.textContent = 'Confirming' + '.'.repeat(1 + (Math.floor(Math.max(0, t - P) * 6) % 3));
        const bi = seg(t, D + 0.04, D + 0.3);
        grpB.style.opacity = outCubic(bi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(bi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(seg(t, D, D + 0.36))).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, D + 0.06, D + 0.3)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, D + 0.06, D + 0.3))).toFixed(3)})`;
        const sh = seg(t, D - 0.04, D + 0.5);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;

        // D: the confirmation, then the UPS tracker lights step 1
        const oc = seg(t, T.d + 0.1, T.d + 0.4);
        okc.style.transform = `scale(${lerp(0.4, 1, outBack(oc)).toFixed(4)})`;
        okRow.style.setProperty('--glow', (seg(t, T.d + 0.15, T.d + 0.35) * (1 - seg(t, T.d + 0.7, T.d + 1.2))).toFixed(3));
        rise(msg, seg(t, T.d + 0.2, T.d + 0.45), 6);
        rise(ups, seg(t, T.ups - 0.1, T.ups + 0.25), 8);
        const u1 = seg(t, T.ups + 0.1, T.ups + 0.35);
        upsS[0].style.setProperty('--on', outCubic(u1).toFixed(3));
        upsS[0].classList.toggle('on', t >= T.ups + 0.1);
        upsS[0].firstElementChild.style.transform = `scale(${lerp(0.6, 1, outBack(u1)).toFixed(3)})`;
        upsL.style.transform = `scaleX(${(0.35 * outCubic(seg(t, T.ups + 0.3, T.ups + 0.9))).toFixed(3)})`;

        rise(gc, seg(t, T.gc, T.gc + 0.4), 12);
      },
    };
  },
};
