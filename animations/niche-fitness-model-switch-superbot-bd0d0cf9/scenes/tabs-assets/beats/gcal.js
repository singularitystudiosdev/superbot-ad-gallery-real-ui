// Google Calendar beat, the finale: superbot takes the job back as itself (no pill, like the Strava step) and puts the
// plan where Sam will see it. Its line streams ("Adding all 48 runs to a new calendar, Half Marathon Plan."), Google's
// consent page opens in superbot's sign-in sheet (gcal-ui.js consentMarkup: the calendar.app.created scope) and the
// pointer presses Continue; a checklist ticks (the calendar created; 48 events, Oct 6 to Dec 27), holds, and opens to
// full frame on the real Google Calendar web client in month view (gcal-ui.js clientMarkup): the new "Half Marathon
// Plan" calendar fades into My calendars and October's 15 runs pop onto the grid in date order as the inserts arrive.
// The pointer clicks the next-month chevron twice (November, December: the runs already there, race week included),
// then race day, Sunday Dec 27, an all-day Tangerine bar; the event card opens beside it, the camera pushes in on it
// and the frame holds, readable. The full-frame layer's geometry lives in gcal-frame.js. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js?v=bd0d0cf9';
import { ico } from './ui-icons.js?v=bd0d0cf9';
import { SESSIONS, RACE, md } from './plan-data.js?v=bd0d0cf9';
import { clientMarkup, popoverMarkup, consentMarkup, VIEW_MONTHS, monthTitle } from './gcal-ui.js?v=bd0d0cf9';
import { makeFrame } from './gcal-frame.js?v=bd0d0cf9';

const N = SESSIONS.length;
const SAY = `Adding all ${N} runs to a new calendar, Half Marathon Plan.`;
const CHECKS = ['Created calendar: Half Marathon Plan', `${N} events, ${md(SESSIONS[0].date)} to ${md(RACE.date)}`];
const OCT = SESSIONS.filter((s) => s.date.getMonth() === 9).length;  // 15 land while October is on screen

const CPS = 100;
const WEB_AT = 0.12, WEB_IN = 0.28;        // reply start to Google's consent page rising in
const CONT_AT = 0.85; /* deliberate */     // the page landing to the press on Continue (time to read it)
const CARD_AT = 0.12, CARD_IN = 0.24;      // the press to the checklist rising in
const CHECK_STAGGER = 0.13, POP = 0.16;
const CARD_HOLD = 0.22; /* deliberate */   // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */        // the card opens to full frame
const FILL_AT = 0.16, EV_STEP = 0.045, EV_IN = 0.18;
const NEXT_AT = 0.25;                      // the last October run to the first chevron press
const NEXT_GAP = 0.8; /* deliberate */     // one chevron press to the next: November readable between
const PICK_AT = 0.5;                       // the December press to the click on race day
const POP_IN = 0.22;
const READ = 1.1; /* deliberate */         // the event card holds, pushed in and readable, before the scene's fade

export default {
  times(r) {
    const T = { r };
    T.web = r + WEB_AT;
    T.cont = T.web + CONT_AT;
    T.card = T.cont + CARD_AT;
    T.ok = CHECKS.map((_, i) => T.card + 0.06 + i * CHECK_STAGGER);
    T.grow = T.ok[CHECKS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.ev = Array.from({ length: OCT }, (_, j) => T.full + FILL_AT + j * EV_STEP);
    T.n1 = T.ev[OCT - 1] + EV_IN + NEXT_AT;   // November
    T.n2 = T.n1 + NEXT_GAP;                   // December
    T.pick = T.n2 + PICK_AT;                  // race day clicked: the event card opens
    T.zoom = T.pick + 0.08;                   // ...and the camera pushes in on it
    T.end = T.pick + POP_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const web = x.el(consentMarkup({ ico, esc: x.esc, brand: x.brand }));
    const card = x.el(`<div class="gk-card">${CHECKS.map((c) => `<div class="gk-step"><span class="gk-ok"><i class="gk-spin"></i>${x.OK}</span><span>${x.esc(c)}</span></div>`).join('')}</div>`);
    const cont = web.querySelector('.go-cont');
    const steps = [...card.querySelectorAll('.gk-step')].map((n) => ({ n, spin: n.querySelector('.gk-spin'), ok: n.querySelector('.qc-ok') }));

    const layer = x.el(`<div class="gc-full" aria-hidden="true">${clientMarkup({ ico, logo: x.brand('gcal-day5.png'), esc: x.esc, brand: x.brand })}${popoverMarkup({ ico, esc: x.esc })}</div>`);
    if (x.pointer && x.pointer.parentNode === x.root) x.root.insertBefore(layer, x.pointer); else x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const client = $('.gc-client'), pop = $('.gc-pop');
    client.appendChild(pop);
    const title = $('.gc-title'), next = $('.gc-next'), newCal = $('.gc-new');
    const months = [...layer.querySelectorAll('.gc-month')], minis = [...layer.querySelectorAll('.gc-mini')];
    const octEv = [...months[0].querySelectorAll('.gc-ev')].filter((e) => SESSIONS[+e.dataset.i].date.getMonth() === 9);
    const raceEv = months[2].querySelector('.gc-raceev');
    const frame = makeFrame(x, T, { layer, client, card, pop, raceEv });
    if (document.fonts && document.fonts.load) ['400', '500'].forEach((w) => { document.fonts.load(`${w} 16px "Google Sans"`); document.fonts.load(`${w} 16px "Roboto GC"`); });

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastM = -1;
    const monthAt = (t) => (t < T.n1 ? 0 : t < T.n2 ? 1 : 2);
    const rise = (node, t, at, len, dy) => {
      const p = outCubic(seg(t, at, at + len));
      node.style.opacity = p.toFixed(3);
      node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
    };

    return {
      nodes: [say, web, card],
      marks: [[T.r, say], [T.web, web], [T.card, card]],
      pointer(t) {
        // Google's page: in from below right, onto the lower left of Continue, the press, and away
        if (t >= T.web + 0.3 && t <= T.cont + 0.4) {
          const b = x.box(cont), m = outCubic(seg(t, T.web + 0.3, T.cont - 0.12));
          const tx = b.x + b.w * 0.3, ty = b.cy + b.h * 0.24;
          const v = seg(t, T.web + 0.3, T.web + 0.45) * (1 - seg(t, T.cont + 0.22, T.cont + 0.4));
          return { x: tx + lerp(b.w * 1.2, 0, m), y: ty + lerp(b.h * 3, 0, m), p: press(t, T.cont), v };
        }
        // the calendar: onto the next-month chevron, two presses, then down onto race day and the click
        if (t < T.n1 - 0.4 || t > T.pick + 0.5) return null;
        frame.place(t);
        const a = frame.measure('next', next), race = t >= T.n2 ? frame.measure('race', raceEv) : null;
        if (!a) return null;
        const A = frame.toRoot(a.cx, a.cy);
        const B = race ? frame.toRoot(race.x + Math.min(race.w * 0.35, 60), race.cy) : A;
        const m1 = outCubic(seg(t, T.n1 - 0.4, T.n1 - 0.08)), m2 = inOutCubic(seg(t, T.n2 + 0.1, T.pick - 0.08));
        const px = lerp(lerp(A.x + 160, A.x, m1), B.x, m2), py = lerp(lerp(A.y + 140, A.y, m1), B.y, m2);
        const v = seg(t, T.n1 - 0.4, T.n1 - 0.25) * (1 - seg(t, T.pick + 0.3, T.pick + 0.5));
        return { x: px, y: py, p: Math.max(press(t, T.n1), press(t, T.n2), press(t, T.pick)), v };
      },
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(web, t, T.web, WEB_IN, 14);
        const pr = press(t, T.cont);
        cont.style.transform = pr ? `scale(${(1 - 0.04 * pr).toFixed(4)})` : 'none';
        cont.classList.toggle('on', t >= T.cont - 0.06 && t < T.cont + 0.25);
        rise(card, t, T.card, CARD_IN, 12);
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (t < T.grow) return;
        // the month on screen (the real client swaps months without a slide), its title and the mini month with it
        const m = monthAt(t);
        if (m !== lastM) {
          months.forEach((g, i) => g.classList.toggle('on', i === m));
          minis.forEach((g, i) => g.classList.toggle('on', i === m));
          title.textContent = monthTitle(VIEW_MONTHS[m]);
          lastM = m;
        }
        next.classList.toggle('on', press(t, T.n1) > 0 || press(t, T.n2) > 0);
        newCal.style.opacity = outCubic(seg(t, T.full, T.full + 0.25)).toFixed(3);
        octEv.forEach((e, j) => rise(e, t, T.ev[j], EV_IN, 4));
        raceEv.classList.toggle('on', t >= T.pick - 0.04);
        const po = outCubic(seg(t, T.pick, T.pick + POP_IN));
        pop.style.opacity = po.toFixed(3);
        pop.style.transform = `scale(${lerp(0.94, 1, po).toFixed(4)})`;
      },
      after(t) { frame.place(t); },
    };
  },
};
