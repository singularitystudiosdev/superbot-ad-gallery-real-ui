// Superbot does it for real in three apps, drawn in code after each app's current light UI (wordmarks are text only):
//   TaskRabbit, Help Moving: Sat, Oct 10, 9:00 AM; the pointer picks 'Large, est. 4 hrs' and 'Truck', opens the
//     Tasker list, selects Marcus T. (4.98, 612 moving tasks, $79/hr) and presses 'Confirm and chat'; Marcus replies;
//   USPS Change of Address: Family, 218 Kent Ave, Apt 3R to 45 Prospect Pl, Apt 2, starting Oct 10, the $1.10
//     identity check on Visa ending 4242, Submit, confirmation number;
//   Gmail: Opus's email to Dana with the 24 photos attached, Send, 'Message sent'.
// The step chips resolve as each lands, the app card folds away and the three-row checklist lands with a chime a row.
import { clamp, lerp, seg, inOutCubic, outBack } from '../../../lib.js';
import { sayLine, rise, pop, show, stepChips, press, pointerPath } from './kit.js';
import { TO, SUBJECT, BODY } from './claude-email.js';

const SAY = 'On it. Booking movers, moving your mail and sending the email.';
const CHIPS = [
  ['Opening TaskRabbit', 'Opened TaskRabbit'],
  ['Booking Marcus T. + truck', 'Booked Marcus T. + truck, Sat 9 AM'],
  ['Filing USPS change of address', 'Filed USPS change of address'],
  ['Emailing Greenpoint Realty', 'Emailed Greenpoint Realty'],
];
const TASKERS = [
  { name: 'Marcus T.', rating: '4.98', reviews: '431 reviews', tasks: '612 moving tasks', rate: '$79/hr', photo: true },
  { name: 'Andre L.', rating: '4.95', reviews: '204 reviews', tasks: '388 moving tasks', rate: '$72/hr', ini: 'AL', bg: '#5b6b7a' },
  { name: 'Kevin R.', rating: '4.91', reviews: '156 reviews', tasks: '240 moving tasks', rate: '$68/hr', ini: 'KR', bg: '#7a6a5b' },
];
const DONE = [
  ['TaskRabbit', 'mdt-tr', 'Movers booked, Sat Oct 10, 9 AM, est. $316', 'Marcus T. + truck, Large, est. 4 hrs'],
  ['USPS', 'mdt-us', 'Mail forwarding starts Oct 10', '218 Kent Ave, Apt 3R to 45 Prospect Pl, Apt 2'],
  ['Gmail', 'mdt-gm', 'Deposit request sent, $2,800 due by Oct 24', 'To Dana, Greenpoint Realty Mgmt, 24 photos'],
];
const OKP = '<svg class="mb-ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const IC = {
  cal: '<svg class="mb-ic" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  pin: '<svg class="mb-ic" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/></svg>',
  star: '<svg class="mb-star" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>',
  min: '<svg class="gm-ic" viewBox="0 0 24 24"><path d="M6 17h12"/></svg>',
  max: '<svg class="gm-ic" viewBox="0 0 24 24"><path d="M14 5h5v5M10 19H5v-5M19 5l-5.5 5.5M5 19l5.5-5.5"/></svg>',
  x: '<svg class="gm-ic" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  clip: '<svg class="gm-ic" viewBox="0 0 24 24"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.1-8.1a3.3 3.3 0 0 1 4.7 4.7l-8.1 8.1a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"/></svg>',
  card: '<svg class="mb-ic" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 9.5h19"/></svg>',
};

export default {
  times(r) {
    const T = {
      say: r + 0.02, c1: r + 0.12, card: r + 0.25, fill: r + 0.55, ptrIn: r + 0.75, c1d: r + 0.9, c2: r + 1.0,
      large: r + 1.3, truck: r + 1.8, cta: r + 2.35, tr2: r + 2.5, rows: r + 2.6, select: r + 3.55, tr3: r + 3.7,
      confirm: r + 4.5, booked: r + 5.0, c2d: r + 5.05, msg: r + 5.2,
      c3: r + 5.3, us: r + 5.65, family: r + 6.15, from: r + 6.35, to: r + 6.6, date: r + 6.85, idc: r + 7.05,
      submit: r + 7.7, filed: r + 8.25, c3d: r + 8.3,
      c4: r + 8.4, gm: r + 8.75, att: r + 9.0, send: r + 9.85, sent: r + 10.05, c4d: r + 10.2, ptrOut: r + 10.0,
      fold: r + 10.7, done: r + 10.85,
    };
    T.rowsDone = [0, 1, 2].map((i) => T.done + 0.35 + i * 0.55);
    T.end = r + 14.2;
    return T;
  },

  cues(T) {
    return [
      ...[T.large, T.truck, T.cta, T.select, T.confirm, T.family, T.submit, T.send].map((t) => ({ t, kind: 'click' })),
      ...[T.c1d, T.c2d, T.c3d, T.c4d].map((t) => ({ t, kind: 'ok' })),
      { t: T.booked, kind: 'pop' }, { t: T.msg, kind: 'tag' }, { t: T.filed, kind: 'tag' },
      { t: T.send + 0.05, kind: 'swoosh', dur: 0.35 },
      { t: T.done, kind: 'pop' },
      ...T.rowsDone.map((t, step) => ({ t, kind: 'done', step })),
    ];
  },

  build(k, { el, esc, img, box }) {
    const T = k.T;
    const say = sayLine(el, esc, SAY);
    const chips = stepChips(el, esc, CHIPS);
    const steps = (on) => `<div class="tr-steps">${['Describe your task', 'Choose Tasker', 'Confirm'].map((s, i) => `<span class="${i < on ? 'on' : ''}"><b>${i + 1}</b>${s}</span>`).join('')}</div>`;
    const marcus = img('marcus.jpg');
    const av = (tk) => (tk.photo ? `<img class="tk-av" src="${marcus}" alt=""/>` : `<span class="tk-av tk-ini" style="background:${tk.bg}">${tk.ini}</span>`);
    const spinBtn = (cls, label, busy, okLabel) => `<span class="${cls} mb-btn"><span class="mb-b0">${label}</span><span class="mb-b1"><i class="mb-spin"></i>${busy}</span><span class="mb-b2">${OKP}${okLabel}</span></span>`;

    const card = el(`<div class="mb-wrap"><div class="mb-card">
  <div class="mb-tops">
    <div class="mb-top mb-top-tr"><span class="mb-wm mb-wm-tr">taskrabbit</span><span class="mb-url">taskrabbit.com/book/help-moving</span><span class="mb-pill">Help Moving</span></div>
    <div class="mb-top mb-top-us"><span class="mb-wm mb-wm-us">USPS.COM</span><span class="mb-url">moversguide.usps.com</span><span class="mb-pill">Change of Address</span></div>
    <div class="mb-top mb-top-gm"><span class="mb-wm mb-wm-gm">Gmail</span><span class="mb-url">mail.google.com</span><span class="mb-pill">Compose</span></div>
  </div>
  <div class="mb-body">
    <div class="mb-scr tr tr1">${steps(1)}<div class="tr-h">Help Moving</div>
      <div class="tr-q"><small>Date and time</small><div class="tr-in tr-v">${IC.cal}<b>Sat, Oct 10, 9:00 AM</b></div></div>
      <div class="tr-q"><small>Your locations</small><div class="tr-in tr-v">${IC.pin}<b>218 Kent Ave, Apt 3R</b><span class="tr-arr">to</span><b>45 Prospect Pl, Apt 2</b></div></div>
      <div class="tr-q"><small>How big is your task?</small><div class="tr-opts"><span>Small, est. 1 hr</span><span>Medium, est. 2 to 3 hrs</span><span class="tr-large">Large, est. 4 hrs</span></div></div>
      <div class="tr-q"><small>Vehicle requirements</small><div class="tr-opts"><span>Not needed</span><span>Car</span><span class="tr-truck">Truck</span></div></div>
      <span class="tr-cta">See Taskers and prices</span>
    </div>
    <div class="mb-scr tr tr2">${steps(2)}
      <div class="tr-filt"><span>Sat, Oct 10</span><span>9:00 AM</span><span>Large, est. 4 hrs</span><span>Truck</span><span class="tr-sort">Sorted by: Recommended</span></div>
      ${TASKERS.map((tk, i) => `<div class="tr-tk${i === 0 ? ' tk-first' : ''}">${av(tk)}<div class="tk-m"><b>${tk.name}</b><span>${IC.star}<b>${tk.rating}</b> (${tk.reviews})</span><span>${tk.tasks}, has a truck</span></div><div class="tk-r"><b>${tk.rate}</b><span class="tk-btn">Select &amp; Continue</span></div></div>`).join('')}
    </div>
    <div class="mb-scr tr tr3">${steps(3)}
      <div class="cf-who"><img class="tk-av" src="${marcus}" alt=""/><div><b>Marcus T.</b><span>${IC.star}<b>4.98</b> (431 reviews), 612 moving tasks</span></div><b class="cf-rate">$79/hr</b></div>
      <div class="cf-rows">
        <div><small>Task</small><b>Help Moving, Sat, Oct 10, 9:00 AM</b></div>
        <div><small>Details</small><b>Large, est. 4 hrs, Truck</b></div>
        <div><small>Estimate</small><b>$79/hr × 4 hrs = $316</b></div>
        <div><small>Payment</small><b>${IC.card}Visa ending 4242</b></div>
      </div>
      ${spinBtn('tr-btn', 'Confirm and chat', 'Booking...', 'Booked')}
      <div class="cf-msg"><img src="${marcus}" alt=""/><span><b>Marcus T.</b>Hi Sam! See you Saturday at 9 with the truck.</span></div>
    </div>
    <div class="mb-scr us">
      <div class="us-h">Change of Address</div>
      <div class="us-q"><small>Is this move for an Individual, a Family or a Business?</small><div class="us-seg"><span>Individual</span><span class="us-fam">Family</span><span>Business</span></div></div>
      <div class="us-2"><div class="us-f us-from"><small>Old address</small><b>218 Kent Ave, Apt 3R</b><span>Brooklyn, NY 11249</span></div><div class="us-f us-to"><small>New address</small><b>45 Prospect Pl, Apt 2</b><span>Brooklyn, NY 11238</span></div></div>
      <div class="us-2"><div class="us-f us-date"><small>Start date</small><b>Sat, Oct 10, 2026</b></div><div class="us-f us-id"><small>Identity verification</small><b>$1.10 on Visa ending 4242</b></div></div>
      <div class="us-foot">${spinBtn('us-btn', 'Submit', 'Submitting...', 'Submitted')}<span class="us-ok">${OKP}<span><b>Confirmation #: 2610 4471 8853</b>Mail forwarding starts Oct 10</span></span></div>
    </div>
    <div class="mb-scr gm">
      <div class="gm-sent"><div class="gm-fold">Sent</div><div class="gm-row"><b>To: Dana</b><span><b>${esc(SUBJECT)}</b> Hi Dana, we moved out of 218 Kent Ave, Apt 3R on Oct 10.</span>${IC.clip}<em>6:12 PM</em></div></div>
      <div class="gm-win">
        <div class="gm-h"><span>New message</span>${IC.min}${IC.max}${IC.x}</div>
        <div class="gm-r"><small>To</small><span class="gm-chip"><b>D</b>${esc(TO)}</span></div>
        <div class="gm-r"><span>${esc(SUBJECT)}</span></div>
        <div class="gm-b">${esc(BODY)}<br/>Thanks, Sam</div>
        <div class="gm-att">${[1, 7, 13, 21].map((i) => `<img src="${img(`mo-${String(i).padStart(2, '0')}.jpg`)}" alt=""/>`).join('')}<span class="gm-more">+20</span><span class="gm-al">24 photos, 21.4 MB</span></div>
        <div class="gm-f"><span class="gm-send"><span>Send</span><i></i></span></div>
      </div>
      <div class="gm-toast"><span>Message sent</span><b>Undo</b><b>View message</b></div>
    </div>
  </div>
</div></div>`.replace(/>\s+</g, '><'));

    const done = el(`<div class="mv-card md-card">
  <div class="md-h"><b>Moving day, Sat Oct 10</b><span class="md-n">0 of 3 done</span></div>
  ${DONE.map(([app, cls, line, sub]) => `<div class="md-r"><span class="mdt ${cls}">${app}</span><div class="md-t"><b>${esc(line)}</b><small>${esc(sub)}</small></div><span class="md-ck">${OKP}</span></div>`).join('')}
</div>`.replace(/>\s+</g, '><'));

    const q = (s) => card.querySelector(s);
    const btn = (s) => { const b = q(s); return { b, s0: b.querySelector('.mb-b0'), s1: b.querySelector('.mb-b1'), s2: b.querySelector('.mb-b2'), spin: b.querySelector('.mb-spin') }; };
    const n = {
      inner: q('.mb-card'),
      tops: ['.mb-top-tr', '.mb-top-us', '.mb-top-gm'].map(q),
      tr1: q('.tr1'), tr2: q('.tr2'), tr3: q('.tr3'), us: q('.mb-scr.us'), gm: q('.mb-scr.gm'),
      vals: [...card.querySelectorAll('.tr1 .tr-v')], large: q('.tr-large'), truck: q('.tr-truck'), cta: q('.tr-cta'),
      tks: [...card.querySelectorAll('.tr-tk')], sel: q('.tk-first .tk-btn'),
      cfm: btn('.tr-btn'), msg: q('.cf-msg'),
      fam: q('.us-fam'), usf: ['.us-from', '.us-to', '.us-date', '.us-id'].map(q), sub: btn('.us-btn'), usok: q('.us-ok'),
      win: q('.gm-win'), sent: q('.gm-sent'), atts: [...card.querySelectorAll('.gm-att > *')], send: q('.gm-send'), toast: q('.gm-toast'),
      rows: [...done.querySelectorAll('.md-r')], cks: [...done.querySelectorAll('.md-ck')], cnt: done.querySelector('.md-n'),
    };
    let fullH = 0, lastCnt = '';
    const spinState = (s, t, at, ok) => {
      const pr = press(t, at);
      s.b.style.transform = pr ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : 'none';
      const busy = t >= at + 0.06 && t < ok, fin = t >= ok;
      s.s0.style.opacity = !busy && !fin ? '1' : '0';
      s.s1.style.opacity = busy ? '1' : '0';
      s.s2.style.opacity = fin ? '1' : '0';
      s.b.classList.toggle('mb-ok', fin);
      s.spin.style.transform = `rotate(${((t - at) * 420).toFixed(1)}deg)`;
      if (fin) s.s2.firstElementChild.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, ok, ok + 0.3))).toFixed(4)})`;
    };

    return {
      nodes: [say.node, chips.node, card, done],
      marks: [[T.c1, chips.node], [T.card, card], [T.done, done]],
      render(t) {
        say.render(t, T.say);
        chips.render(t, [[T.c1, T.c1d], [T.c2, T.c2d], [T.c3, T.c3d], [T.c4, T.c4d]]);
        rise(n.inner, t, T.card, 14);

        // the app card folds away once everything is done, so the chips and the checklist share the frame
        if (!fullH && card.offsetHeight) fullH = card.offsetHeight;
        const f = inOutCubic(seg(t, T.fold, T.fold + 0.4));
        card.style.height = f > 0 && fullH ? `${(fullH * (1 - f)).toFixed(2)}px` : '';
        card.style.opacity = (1 - seg(t, T.fold, T.fold + 0.3)).toFixed(3);

        // screens and their header rows
        const sTr2 = inOutCubic(seg(t, T.tr2, T.tr2 + 0.24)), sTr3 = inOutCubic(seg(t, T.tr3, T.tr3 + 0.24));
        const sUs = inOutCubic(seg(t, T.us, T.us + 0.26)), sGm = inOutCubic(seg(t, T.gm, T.gm + 0.26));
        show(n.tr1, 1 - sTr2, 0);
        show(n.tr2, sTr2 * (1 - sTr3), 18);
        show(n.tr3, sTr3 * (1 - sUs), 18);
        show(n.us, sUs * (1 - sGm), 18);
        show(n.gm, sGm, 18);
        [1 - sUs, sUs * (1 - sGm), sGm].forEach((o, i) => { n.tops[i].style.opacity = o.toFixed(3); n.tops[i].style.visibility = o > 0 ? 'visible' : 'hidden'; });

        // TaskRabbit: details fill, size and vehicle picked, the Tasker list, Marcus selected, confirm and chat
        n.vals.forEach((v, i) => { v.classList.toggle('tr-on', t >= T.fill + i * 0.15); });
        n.large.classList.toggle('tr-sel', t >= T.large);
        n.truck.classList.toggle('tr-sel', t >= T.truck);
        n.cta.style.transform = press(t, T.cta) ? `scale(${(1 - 0.05 * press(t, T.cta)).toFixed(4)})` : 'none';
        n.cta.classList.toggle('tr-ready', t >= T.truck);
        n.tks.forEach((r, i) => rise(r, t, T.rows + i * 0.09, 10, 0.3));
        n.tks[0].classList.toggle('tk-sel', t >= T.select);
        n.sel.style.transform = press(t, T.select) ? `scale(${(1 - 0.06 * press(t, T.select)).toFixed(4)})` : 'none';
        spinState(n.cfm, t, T.confirm, T.booked);
        rise(n.msg, t, T.msg, 10, 0.3);

        // USPS: Family, the two addresses, the start date, the $1.10 check, Submit, confirmation
        n.fam.classList.toggle('us-sel', t >= T.family);
        [T.from, T.to, T.date, T.idc].forEach((a, i) => n.usf[i].classList.toggle('us-on', t >= a));
        spinState(n.sub, t, T.submit, T.filed);
        pop(n.usok, t, T.filed);

        // Gmail: the drafted email with its photos, Send, the window closes and the toast lands
        n.atts.forEach((a, i) => pop(a, t, T.att + i * 0.06));
        const sp = press(t, T.send);
        n.send.style.transform = sp ? `scale(${(1 - 0.06 * sp).toFixed(4)})` : 'none';
        const gone = inOutCubic(seg(t, T.sent - 0.1, T.sent + 0.25));
        n.win.style.opacity = (1 - gone).toFixed(3);
        n.win.style.transform = gone ? `translateY(${(gone * 40).toFixed(2)}px) scale(${(1 - 0.06 * gone).toFixed(4)})` : 'none';
        rise(n.toast, t, T.sent + 0.1, 10, 0.3);
        n.sent.style.opacity = seg(t, T.sent, T.sent + 0.3).toFixed(3);

        // the checklist
        rise(done, t, T.done, 16);
        n.rows.forEach((r, i) => rise(r, t, T.done + 0.08 + i * 0.08, 8, 0.3));
        let c = 0;
        n.cks.forEach((ck, i) => {
          const a = T.rowsDone[i];
          if (t >= a) c++;
          ck.classList.toggle('on', t >= a);
          ck.style.transform = `scale(${t >= a ? lerp(0.4, 1, outBack(seg(t, a, a + 0.3))).toFixed(4) : '1'})`;
        });
        const cs = `${c} of 3 done`;
        if (cs !== lastCnt) { n.cnt.textContent = cs; n.cnt.classList.toggle('all', c === 3); lastCnt = cs; }
      },

      pointer(t) {
        return pointerPath(box, t, [
          [T.large, n.large, 0.5, 0.55], [T.truck, n.truck, 0.5, 0.55], [T.cta, n.cta, 0.5, 0.55],
          [T.select, n.sel, 0.5, 0.55], [T.confirm, n.cfm.b, 0.5, 0.55], [T.family, n.fam, 0.5, 0.55],
          [T.submit, n.sub.b, 0.5, 0.55], [T.send, n.send, 0.35, 0.55],
        ], T.ptrIn, T.ptrOut);
      },
    };
  },
};
