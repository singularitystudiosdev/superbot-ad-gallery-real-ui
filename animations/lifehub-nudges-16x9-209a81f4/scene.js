/* lifehub-nudges: "it nudges you. before it's late." Big left-aligned headline over a dimmed command center, a
   notification stack on the right (5 nudges land one at a time through the day, older ones fold upward), a cursor
   acts on them, then the stack clears and the camera pulls back to all 7 areas: "start early. stay ahead." */
import { ease, ep, prog, win, h, setStyle, camera, camAt, lerp } from '../../assets/lifehub-209a81f4/lib.js';
import { makeDashboard, makeHeadline, makeNudge, makeCursor, revealDashboard, setRowDone, logo } from '../../assets/lifehub-209a81f4/ui.js';

const DUR = 15.0;
const FULL = { cx: 960, cy: 506, z: 0.86 };

// the five nudges, in arrival order. click: when the cursor presses the primary button (null = no click)
const NUDGES = [
  {
    area: 'School', logoName: 'canvas', when: '8:30 AM',
    title: 'ECON 102 midterm in 15 days',
    body: 'Start now and it’s 30 minutes a day. Book 3 review blocks?',
    primary: 'Book them', secondary: 'Later', done: '3 blocks booked',
    at: 1.2, click: 2.45, verb: 'start early',
  },
  {
    area: 'Networking', logoName: 'linkedin', when: '9:40 AM',
    title: 'Marcus replied 2 days ago',
    body: 'Draft ready: “1 PM today works. See you there.”',
    primary: 'Send', secondary: 'Edit', done: 'Sent',
    at: 3.2, click: 4.4, verb: 'reply in time',
  },
  {
    area: 'Applications', logoName: 'doc', when: '11:15 AM',
    title: 'Research fellowship opens tomorrow, 9 AM',
    body: 'Essay outline started from your notes. Reminder set for 8:45.',
    primary: 'Open outline', secondary: null, done: null,
    at: 5.1, click: null, verb: 'apply on day one',
  },
  {
    area: 'Email', logoName: 'gmail', when: '12:20 PM',
    title: 'Lena from Halcyon Labs wants interview times',
    body: 'Flagged out of 142 new emails. You’re free Thu 10, 2 and 4.',
    primary: 'Reply with times', secondary: null, done: 'Reply sent',
    at: 6.9, click: 8.0, verb: 'answer what matters',
  },
  {
    area: 'Calendar', logoName: 'gcal', when: '2:45 PM',
    title: 'You planned 4h of deep work. 1h 10m done.',
    body: 'Next block starts at 3:00. Hold notifications until 5?',
    primary: 'Hold', secondary: null, done: 'Held until 5',
    at: 8.7, click: 9.85, verb: 'keep the plan',
  },
];

const TR = 0.7;        // arrival transition
const CLR = 10.9;      // stack clears
const X0 = 1040, BOTTOM = 975, GAP = 24;
const LIST_TOP = 478, LIST_PITCH = 80;

export default {
  id: 'nudges',
  dur: DUR,
  mount(sec) {
    // background: the command center, blurred under a veil
    const layer = h('<div class="lh-layer"></div>');
    const dash = makeDashboard();
    layer.appendChild(dash.el);
    sec.appendChild(layer);
    const veil = h('<div class="nz-veil"></div>');
    sec.appendChild(veil);

    // left: two-beat headline
    const head1 = makeHeadline([{ a: 0.25, b: CLR + 0.1, text: 'it nudges you.' }], { top: 150, size: 108 });
    const head2 = makeHeadline([{ a: 0.95, b: CLR + 0.2, text: 'before it’s late.' }], { top: 266, size: 108 });
    for (const hd of [head1, head2]) { hd.el.classList.add('nz-lefthead'); sec.appendChild(hd.el); }
    for (const w of head2.el.querySelectorAll('.lh-w')) w.classList.add('nz-grad');

    // left: what each nudge is for, the current one lit
    const list = h('<div class="nz-list"></div>');
    const items = NUDGES.map((n, i) => {
      const el = h(`<div class="nz-item"><span class="nz-bar"></span>${logo(n.logoName, 44)}<span>${n.verb}</span></div>`);
      el.style.top = `${LIST_TOP + i * LIST_PITCH}px`;
      list.appendChild(el);
      return { el, bar: el.querySelector('.nz-bar') };
    });
    sec.appendChild(list);

    // right: the nudge stack
    const stackEl = h('<div class="lh-layer" style="z-index:20"></div>');
    sec.appendChild(stackEl);
    const cards = NUDGES.map((n, i) => {
      const nd = makeNudge(n);
      nd.el.classList.add('lh-abs', 'nz-card');
      nd.el.style.transformOrigin = '0 0';
      nd.el.style.zIndex = String(i + 1);
      stackEl.appendChild(nd.el);
      const sec2 = nd.el.querySelector('.lh-btn:not(.pri)');
      return { ...n, i, nd, el: nd.el, pri: nd.pri, sec: sec2, priHTML: nd.pri ? nd.pri.innerHTML : '', state: null };
    });
    for (const c of cards) {
      c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
      if (c.pri) { c.bx = c.pri.offsetLeft + c.pri.offsetWidth * 0.5; c.by = c.pri.offsetTop + c.pri.offsetHeight * 0.55; }
    }

    const cursor = makeCursor();
    sec.appendChild(cursor.el);

    const close = makeHeadline([{ a: CLR + 0.65, b: DUR, text: 'start early. stay ahead.' }]);
    sec.appendChild(close.el);

    const keys = [
      { t: 0, cx: 960, cy: 540, z: 1.0 },
      { t: CLR, cx: 960, cy: 530, z: 1.05 },
      { t: CLR + 1.35, ...FULL, ease: ease.inOutCubic },
      { t: DUR, ...FULL, z: 0.83 },
    ];
    return { stackEl, layer, dash, veil, head1, head2, items, cards, cursor, close, keys };
  },

  render(t, c) {
    const cam = camAt(c.keys, t);
    camera(c.layer, cam.cx, cam.cy, cam.z);

    // background command center: fades in blurred, un-dims and sharpens on the pull back
    const kclr = ep(t, CLR + 0.1, CLR + 1.0, ease.inOutCubic);
    setStyle(c.dash.el, { o: ep(t, 0, 0.6), blur: 9 * (1 - kclr) });
    revealDashboard(c.dash, t, -5);
    c.dash.mark.render(t);
    setStyle(c.veil, { o: 1 - kclr });

    // stack layout
    const n = c.cards.filter((k) => t >= k.at).length;
    const kArr = n ? ease.outQuint(prog(t, c.cards[n - 1].at, c.cards[n - 1].at + TR)) : 1;
    // the newcomer slides in from the right once the stack has made room
    const kNew = n ? ease.outQuint(prog(t, c.cards[n - 1].at + 0.1, c.cards[n - 1].at + TR + 0.1)) : 1;
    const oNew = n ? ep(t, c.cards[n - 1].at + 0.12, c.cards[n - 1].at + 0.26) : 1;
    const kgo = ep(t, CLR + 0.15, CLR + 0.7);
    setStyle(c.stackEl, { o: 1 - kgo });
    const H = c.cards.map((k) => k.h), Wd = c.cards[0].w;
    const layout = (m, i) => {
      if (i >= m) return { x: X0 + 160, y: BOTTOM - H[i] + 110, s: 0.94, o: 0, b: 1 };
      const d = m - 1 - i;
      const top0 = BOTTOM - H[m - 1];
      if (d === 0) return { x: X0, y: top0, s: 1, o: 1, b: 1 };
      const s1 = 0.95, top1 = top0 - GAP - H[m - 2] * s1;
      if (d === 1) return { x: X0 + (Wd * (1 - s1)) / 2, y: top1, s: s1, o: 1, b: 0.72 };
      const s = [0, 0, 0.89, 0.83, 0.79][Math.min(d, 4)];
      const dy = [0, 0, 32, 58, 74][Math.min(d, 4)];
      return { x: X0 + (Wd * (1 - s)) / 2, y: top1 - dy, s, o: [0, 0, 1, 0.8, 0][Math.min(d, 4)], b: [0, 0, 0.6, 0.42, 0.3][Math.min(d, 4)] };
    };
    for (const k of c.cards) {
      const A = layout(Math.max(0, n - 1), k.i), B = layout(n, k.i);
      const L = k.i === n - 1
        ? { x: lerp(B.x + 200, B.x, kNew), y: lerp(B.y + 90, B.y, kNew), s: 1, o: oNew, b: 1 }
        : { x: lerp(A.x, B.x, kArr), y: lerp(A.y, B.y, kArr), s: lerp(A.s, B.s, kArr), o: lerp(A.o, B.o, kArr), b: lerp(A.b, B.b, kArr) };
      // clear: newest flies out first
      const depth = Math.max(0, n - 1 - k.i);
      const kx = ease.inCubic(prog(t, CLR + depth * 0.07, CLR + depth * 0.07 + 0.55));
      L.x += kx * 760;
      k.L = L;
      setStyle(k.el, { x: L.x, y: L.y, s: L.s, o: L.o });
      const f = L.b > 0.995 ? 'none' : `brightness(${L.b.toFixed(3)})`;
      if (k.el.__fl !== f) { k.el.style.filter = f; k.el.__fl = f; }
      k.nd.mark.render(t);
      // button state flips on the click
      const done = k.click != null && t >= k.click + 0.05;
      if (k.pri && k.state !== done) {
        k.state = done;
        k.pri.classList.toggle('pri', !done);
        k.pri.classList.toggle('ok', done);
        k.pri.innerHTML = done ? `${logo('check', 22)}${k.done}` : k.priHTML;
      }
      if (k.sec) setStyle(k.sec, { o: k.click != null ? 1 - ep(t, k.click, k.click + 0.3) : 1 });
      if (k.pri && k.click != null) {
        const kp = prog(t, k.click - 0.12, k.click + 0.05) * (1 - prog(t, k.click + 0.05, k.click + 0.3));
        setStyle(k.pri, { s: 1 - 0.06 * kp });
      }
    }

    // cursor: one visit per actionable nudge. drifts in from the lower right, presses, ripples, fades away
    const btn = (k) => ({ x: k.L.x + k.bx * k.L.s, y: k.L.y + k.by * k.L.s });
    let p = { x: 1960, y: 1140 }, press = 0, rip = -1, co = 0;
    for (const k of c.cards) {
      if (k.click == null || t < k.click - 0.75 || t > k.click + 0.75) continue;
      const to = btn(k);
      const km = ease.inOutCubic(prog(t, k.click - 0.7, k.click - 0.15));
      const kback = ease.outCubic(prog(t, k.click + 0.2, k.click + 0.6));
      p = { x: lerp(to.x + 170, to.x, km) + 10 * kback, y: lerp(to.y + 150, to.y, km) - Math.sin(Math.PI * km) * 30 + 16 * kback };
      press = prog(t, k.click - 0.12, k.click) * (1 - prog(t, k.click + 0.05, k.click + 0.25));
      rip = t >= k.click && t <= k.click + 0.45 ? prog(t, k.click, k.click + 0.45) : -1;
      co = win(t, k.click - 0.75, k.click + 0.75, 0.25, 0.3);
    }
    c.cursor.set(p.x - 8, p.y - 6, { o: co, press, rip });

    // left list: lit item follows the newest card
    c.items.forEach((it, i) => {
      const kin = ep(t, 0.9 + i * 0.07, 1.4 + i * 0.07, ease.outQuint);
      const nx = c.cards[i + 1];
      const lit = ep(t, c.cards[i].at + 0.1, c.cards[i].at + 0.45) * (nx ? 1 - ep(t, nx.at + 0.1, nx.at + 0.45) : 1);
      const kout = ease.inCubic(prog(t, CLR - 0.15 + i * 0.03, CLR + 0.25 + i * 0.03));
      setStyle(it.el, { x: (1 - kin) * -40 + lit * 18 - kout * 80, o: kin * (0.26 + 0.74 * lit) * (1 - kout) });
      setStyle(it.bar, { o: lit });
    });

    c.head1.render(t);
    c.head2.render(t);

    // the pull back: rows the nudges handled tick off
    setRowDone(c.dash.rows.network[0], ep(t, 12.6, 12.9));
    setRowDone(c.dash.rows.email[0], ep(t, 13.1, 13.4));
    c.dash.rows.school[1].classList.toggle('lh-focus', win(t, 13.6, DUR + 1, 0.2, 0.1) > 0.3);
    c.close.render(t);
  },
};
