// Superbot books it for real: it drives OpenTable (Casa Lumbre's page, 6 people on Fri, Oct 9, taps the 7:45 PM
// slot), types the diet notes into the special request, completes the reservation (the gradient pill spins, then
// "Reservation confirmed"), adds the Google Calendar event with five guests and sends Claude's draft to the
// "Fri crew" thread in Messages, where it reads Delivered and Priya answers. The OpenTable screen folds down to
// its confirmation so the three land as one stacked card.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';
import { PLACE, REQUEST, CONF, EVENT, GUESTS, GROUP, PEOPLE, DRAFT, REPLY } from './dinner.js';
import { NEED_IC } from './read.js';

const SAY = 'Booking Casa Lumbre on OpenTable now.';
const CHIPS = [
  ['Opening OpenTable', 'Opened OpenTable'],
  ['Booking 7:45 PM for 6', 'Booked 7:45 PM for 6'],
  ['Adding your diet notes', 'Added your diet notes'],
  ['Sending invite to 5', 'Sent invite to 5'],
  [`Texting ${GROUP}`, `Texted ${GROUP}`],
];
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>';
const CHEV = '<svg class="ot-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const CAL = '<svg class="dd-bag" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>';
const OKC = '<svg class="ot-okc" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>';
const CURSOR = '<svg class="ot-cur" viewBox="0 0 24 24"><path d="M5 2.5v17.2l4.3-4.1 2.8 6.4 2.9-1.3-2.8-6.3h6.1Z"/></svg>';
const SM = (ic) => `<span class="ot-i">${NEED_IC[ic]}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.45;
    T.field = [T.card + 0.3, T.card + 0.38, T.card + 0.46];
    T.slot = PLACE.slots.map((_, i) => T.card + 0.55 + i * 0.07);
    T.cur = T.card + 0.75;
    T.tap = T.card + 1.35;
    T.b = T.tap + 0.45;
    T.ty0 = T.b + 0.4;
    T.ty1 = T.ty0 + REQUEST.length / 52;
    T.press = T.ty1 + 0.25;
    T.done = T.press + 0.65;
    T.c = T.done + 0.3;
    T.gc = T.c + 0.55;
    T.av = GUESTS.map((_, i) => T.gc + 0.35 + i * 0.09);
    T.im = T.gc + 0.4;
    T.sent = T.im + 0.3;
    T.deliv = T.sent + 0.45;
    T.typing = T.deliv + 0.2;
    T.reply = T.typing + 0.6;
    T.chipIn = [r + 0.15, T.tap, T.ty0, T.gc, T.im];
    T.chipDone = [T.card + 0.25, T.c, T.ty1 + 0.05, T.av[GUESTS.length - 1] + 0.2, T.deliv];
    T.end = T.reply + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el(`<div class="dd-chiprow eb-chiprow">${CHIPS.map(([run]) => `<div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div>`).join('')}</div>`);
    const room = x.img('room.jpg');
    const av = (p, cls = '') => `<i class="${cls}" style="background:${p.col}">${p.init}</i>`;
    const stack = x.el(`<div class="ot-stack">
      <div class="ot-card">
        <div class="ot-head"><b class="ot-wm">OpenTable</b><i class="ot-sep"></i><span class="ot-ht">${x.esc(PLACE.name)}</span><span class="ot-step"><em class="ot-s0">Select a time</em><em class="ot-s1">Almost done</em><em class="ot-s2">Confirmed</em></span></div>
        <div class="ot-body">
          <div class="ot-scr ot-a">
            <div class="ot-hero"><img src="${room}" alt=""/></div>
            <div class="ot-cols">
              <div class="ot-info">
                <h4>${x.esc(PLACE.name)}</h4>
                <div class="ot-rate"><span class="ot-stars">${STAR.repeat(5)}</span><b>${PLACE.rating}</b><span>${PLACE.reviews} reviews</span></div>
                <div class="ot-meta"><span>${x.esc(PLACE.price)}</span><span>${PLACE.cuisine}</span><span>${PLACE.hood}</span></div>
                <div class="ot-tags"><span>${SM('leaf')}Vegan options</span><span>${SM('wheat')}Gluten-free options</span></div>
              </div>
              <div class="ot-wid">
                <b class="ot-wt">Make a reservation</b>
                <div class="ot-f"><small>Party size</small><span>${PLACE.party}</span>${CHEV}</div>
                <div class="ot-two"><div class="ot-f"><small>Date</small><span>${PLACE.date}</span>${CHEV}</div><div class="ot-f"><small>Time</small><span>${PLACE.ask}</span>${CHEV}</div></div>
                <small class="ot-sl">Select a time</small>
                <div class="ot-slots">${PLACE.slots.map((s) => `<span class="ot-slot">${s}</span>`).join('')}</div>
              </div>
            </div>
            ${CURSOR}<i class="ot-ring"></i>
          </div>
          <div class="ot-scr ot-b">
            <h5>You're almost done!</h5>
            <div class="ot-sum"><img src="${room}" alt=""/><div><b>${x.esc(PLACE.name)}</b><span>${SM('cal')}${PLACE.date}</span><span>${SM('clock')}${PLACE.slots[PLACE.pick]}</span><span>${SM('ppl')}${PLACE.party}</span></div></div>
            <div class="ot-hold">We're holding this table for you for <b class="ot-hm">5:00</b> minutes</div>
            <div class="ot-req"><small>Special request (optional)</small><div class="ot-ta"><span class="ot-rt"></span><i class="ot-caret"></i></div></div>
            <div class="dd-btn ot-btn">
              <span class="dd-grp ot-grp-0">${CAL}<span>Complete reservation</span></span>
              <span class="dd-grp dd-grp-a"><span class="eb-bspin"></span><span class="dd-lab-a">Booking</span></span>
              <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Booked</span></span>
              <i class="dd-shine" aria-hidden="true"></i>
            </div>
          </div>
          <div class="ot-scr ot-c">
            <div class="ot-ok">${OKC}<b>Reservation confirmed</b><span>Confirmation #${CONF}</span></div>
            <div class="ot-cd"><img src="${room}" alt=""/><div><b>${x.esc(PLACE.name)}</b><span>${PLACE.date} at ${PLACE.slots[PLACE.pick]} · Party of 6</span><span>${x.esc(PLACE.addr)}</span></div><span class="ot-note">${SM('leaf')}Diet notes sent</span></div>
          </div>
        </div>
      </div>
      <div class="ot-pair">
        <div class="gc-card">
          <div class="gc-top"><img src="${x.brand('gcal-logo.svg')}" alt=""/><span>Calendar</span><em>Event saved</em></div>
          <div class="gc-ev"><i class="gc-sq"></i><div><b>${x.esc(EVENT.title)}</b><span>${EVENT.when} · ${EVENT.time}</span></div></div>
          <div class="gc-ln">${SM('pin')}<span>${x.esc(EVENT.where)}</span></div>
          <div class="gc-ln">${SM('ppl')}<span><b>6 guests</b><small class="gc-rsvp">1 yes, 0 awaiting</small></span></div>
          <div class="gc-avs">${GUESTS.map((p) => `<span class="gc-g">${av(p)}<small>${p.name}</small></span>`).join('')}</div>
        </div>
        <div class="im-card">
          <div class="im-top"><span class="im-av4">${PEOPLE.map((p) => av(p)).join('')}</span><b>${x.esc(GROUP)}</b></div>
          <div class="im-body">
            <div class="im-out"><span class="im-bub">${x.esc(DRAFT)}</span></div>
            <div class="im-del">Delivered</div>
            <div class="im-inc"><small>${REPLY.from.name}</small><div class="im-row">${av(REPLY.from, 'im-av')}<span class="im-gbub"><span class="im-dots"><i></i><i></i><i></i></span><span class="im-txt">${x.esc(REPLY.msg)}</span></span></div></div>
          </div>
        </div>
      </div>
    </div>`);
    const $ = (s) => stack.querySelector(s), $$ = (s) => [...stack.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = [...row.children];
    const card = $('.ot-card'), body = $('.ot-body'), scrA = $('.ot-a'), scrB = $('.ot-b'), scrC = $('.ot-c');
    const steps = $$('.ot-step em');
    const fields = $$('.ot-a .ot-f'), slots = $$('.ot-slot'), cur = $('.ot-cur'), ring = $('.ot-ring');
    const hm = $('.ot-hm'), rt = $('.ot-rt'), caret = $('.ot-caret'), ta = $('.ot-ta');
    const btn = $('.ot-btn'), g0 = $('.ot-grp-0'), grpA = $('.ot-btn .dd-grp-a'), grpB = $('.ot-btn .dd-grp-b'), labA = $('.ot-btn .dd-lab-a');
    const shine = $('.ot-btn .dd-shine'), check = $('.ot-btn .dd-check'), checkP = $('.ot-btn .dd-check-p'), bspin = $('.ot-btn .eb-bspin');
    const okc = $('.ot-okc'), okRow = $('.ot-ok'), note = $('.ot-note');
    const gc = $('.gc-card'), gs = $$('.gc-g'), rsvp = $('.gc-rsvp');
    const im = $('.im-card'), out = $('.im-out'), del = $('.im-del'), inc = $('.im-inc'), dots = $('.im-dots'), itxt = $('.im-txt'), gbub = $('.im-gbub');
    const pair = $('.ot-pair');
    let shown = -1, typedN = -1, hmT = '', rsT = '';
    let HAB = 0, HC = 0;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // the pointer's target: the picked slot's centre, in .ot-a's own box
    const slotXY = () => { const s = slots[PLACE.pick]; let x0 = s.offsetWidth / 2, y0 = s.offsetHeight / 2, n = s; while (n && n !== scrA) { x0 += n.offsetLeft; y0 += n.offsetTop; n = n.offsetParent; } return [x0, y0]; };
    return {
      nodes: [say, row, stack],
      marks: [[T.r, say], [T.chipIn[0], row], [T.card, card], [T.gc, pair], [T.reply, pair]],
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

        // screens: A (pick a time) -> B (complete reservation) -> C (confirmed); the body folds to C's height
        if (!HAB) { HAB = Math.max(scrA.scrollHeight, scrB.scrollHeight); HC = scrC.scrollHeight; }
        const ab = inOutCubic(seg(t, T.b, T.b + 0.35)), bc = inOutCubic(seg(t, T.c, T.c + 0.4));
        body.style.height = `${lerp(HAB, HC, bc).toFixed(2)}px`;
        scrA.style.opacity = (1 - ab).toFixed(3);
        scrA.style.transform = ab > 0 ? `translateX(${(-ab * 30).toFixed(2)}px)` : '';
        scrA.style.visibility = ab >= 1 ? 'hidden' : 'visible';
        scrB.style.opacity = (ab * (1 - seg(t, T.c, T.c + 0.16))).toFixed(3);
        scrB.style.transform = ab < 1 ? `translateX(${((1 - ab) * 30).toFixed(2)}px)` : (bc > 0 ? `scale(${lerp(1, 0.98, bc).toFixed(4)})` : '');
        scrB.style.visibility = ab > 0 && bc < 1 ? 'visible' : 'hidden';
        scrC.style.opacity = outCubic(seg(t, T.c + 0.1, T.c + 0.4)).toFixed(3);
        scrC.style.transform = bc < 1 ? `translateY(${((1 - bc) * 10).toFixed(2)}px)` : '';
        scrC.style.visibility = bc > 0 ? 'visible' : 'hidden';
        steps.forEach((s, i) => { s.style.opacity = (i === 0 ? 1 - ab : i === 1 ? ab * (1 - bc) : bc).toFixed(3); });

        // A: the selects fill, the slots come up, the pointer taps 7:45 PM
        fields.forEach((f, i) => {
          const a = T.field[i];
          f.lastElementChild.previousElementSibling.style.opacity = outCubic(seg(t, a, a + 0.2)).toFixed(3);
          f.style.setProperty('--focus', (seg(t, a - 0.04, a + 0.06) * (1 - seg(t, a + 0.3, a + 0.55))).toFixed(3));
        });
        slots.forEach((s, i) => {
          const p = seg(t, T.slot[i], T.slot[i] + 0.3);
          s.style.opacity = outCubic(p).toFixed(3);
          const press = i === PLACE.pick ? seg(t, T.tap - 0.05, T.tap + 0.05) * (1 - seg(t, T.tap + 0.1, T.tap + 0.25)) : 0;
          s.style.transform = `scale(${(lerp(0.8, 1, outBack(p)) - 0.07 * press).toFixed(4)})`;
          s.classList.toggle('is-on', i === PLACE.pick && t >= T.tap);
        });
        const [sx, sy] = slotXY();
        const m = inOutCubic(seg(t, T.cur, T.tap - 0.06));
        cur.style.opacity = (outCubic(seg(t, T.cur, T.cur + 0.15)) * (1 - seg(t, T.tap + 0.25, T.tap + 0.4))).toFixed(3);
        cur.style.transform = `translate(${lerp(sx + 150, sx - 3, m).toFixed(1)}px, ${lerp(sy + 70, sy - 2, m).toFixed(1)}px) scale(${(1 - 0.12 * seg(t, T.tap - 0.05, T.tap) * (1 - seg(t, T.tap + 0.08, T.tap + 0.2))).toFixed(3)})`;
        const rp = seg(t, T.tap, T.tap + 0.4);
        ring.style.opacity = (rp > 0 && rp < 1 ? 1 - rp : 0).toFixed(3);
        ring.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%) scale(${lerp(0.3, 1.6, outCubic(rp)).toFixed(3)})`;

        // B: the hold timer runs, the diet notes type into the request, the pill books it
        const left = Math.max(0, 300 - Math.floor(Math.max(0, t - T.b) * 1));
        const hmN = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
        if (hmN !== hmT) { hm.textContent = hmN; hmT = hmN; }
        const tn = Math.round(REQUEST.length * seg(t, T.ty0, T.ty1));
        if (tn !== typedN) { rt.textContent = REQUEST.slice(0, tn); typedN = tn; }
        caret.style.opacity = t >= T.ty0 - 0.1 && t < T.ty1 + 0.2 ? '1' : '0';
        ta.style.setProperty('--focus', (seg(t, T.ty0 - 0.12, T.ty0) * (1 - seg(t, T.ty1 + 0.1, T.ty1 + 0.35))).toFixed(3));

        const P = T.press, D = T.done;
        const down = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
        const pop = seg(t, D, D + 0.4);
        btn.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * pop)).toFixed(4)})`;
        const r0 = seg(t, P + 0.02, P + 0.2);
        g0.style.opacity = (1 - outCubic(r0)).toFixed(3);
        g0.style.transform = `translate(-50%, calc(-50% - ${(outCubic(r0) * 10).toFixed(2)}px))`;
        const ai = seg(t, P + 0.08, P + 0.26), ao = seg(t, D - 0.02, D + 0.16);
        grpA.style.opacity = (outCubic(ai) * (1 - outCubic(ao))).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% + ${(((1 - outCubic(ai)) - outCubic(ao)) * 10).toFixed(2)}px))`;
        bspin.style.transform = `rotate(${(((t - P) * 540) % 360).toFixed(1)}deg)`;
        labA.textContent = 'Booking' + '.'.repeat(1 + (Math.floor(Math.max(0, t - P) * 6) % 3));
        const bi = seg(t, D + 0.04, D + 0.3);
        grpB.style.opacity = outCubic(bi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(bi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(seg(t, D, D + 0.36))).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, D + 0.06, D + 0.3)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, D + 0.06, D + 0.3))).toFixed(3)})`;
        const sh = seg(t, D - 0.04, D + 0.5);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;

        // C: the confirmation lands with its check
        const oc = seg(t, T.c + 0.1, T.c + 0.4);
        okc.style.transform = `scale(${lerp(0.4, 1, outBack(oc)).toFixed(4)})`;
        okRow.style.setProperty('--glow', (seg(t, T.c + 0.15, T.c + 0.35) * (1 - seg(t, T.c + 0.7, T.c + 1.2))).toFixed(3));
        note.style.opacity = outCubic(seg(t, T.c + 0.35, T.c + 0.6)).toFixed(3);

        // the calendar event and the group text land side by side under it
        rise(pair, seg(t, T.gc - 0.05, T.gc + 0.3), 0);
        rise(gc, seg(t, T.gc, T.gc + 0.4), 14);
        gs.forEach((g, i) => {
          const p = seg(t, T.av[i], T.av[i] + 0.3);
          g.style.opacity = outCubic(p).toFixed(3);
          g.style.transform = p >= 1 ? '' : `scale(${lerp(0.4, 1, outBack(p)).toFixed(4)})`;
        });
        const wait = T.av.filter((a) => t >= a).length;
        const rsN = `1 yes, ${wait} awaiting`;
        if (rsN !== rsT) { rsvp.textContent = rsN; rsT = rsN; }
        rise(im, seg(t, T.im, T.im + 0.4), 14);
        const so = seg(t, T.sent, T.sent + 0.35);
        out.style.opacity = outCubic(so).toFixed(3);
        out.style.transform = so >= 1 ? '' : `translate(${((1 - outCubic(so)) * 18).toFixed(2)}px, ${((1 - outCubic(so)) * 26).toFixed(2)}px) scale(${lerp(0.82, 1, outBack(so)).toFixed(4)})`;
        rise(del, seg(t, T.deliv, T.deliv + 0.25), 4);
        rise(inc, seg(t, T.typing, T.typing + 0.3), 8);
        const typing = t < T.reply;
        dots.style.display = typing ? '' : 'none';
        itxt.style.display = typing ? 'none' : '';
        dots.querySelectorAll('i').forEach((d, i) => { d.style.opacity = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin((t - T.typing) * 9 - i * 0.9))).toFixed(3); });
        gbub.style.transform = t >= T.reply ? `scale(${lerp(0.9, 1, outBack(seg(t, T.reply, T.reply + 0.3))).toFixed(4)})` : '';
      },
    };
  },
};
