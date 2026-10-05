/* lifehub-chaos: everything everywhere (16 scattered life cards over kinetic bands) -> the superbot mark lands
   -> every card flies into its row on one command center page -> camera visits School, Networking, Email
   -> pull back: "your whole life. one page." */
import { ease, ep, prog, spring, win, rand, h, setStyle, camera, camAt, boxIn, lerp } from '../../assets/lifehub-209a81f4/lib.js';
import { makeDashboard, makeHeadline, makeBands, makeMark, makeCard, makeChip, revealDashboard, setRowDone, logo } from '../../assets/lifehub-209a81f4/ui.js';
import { areaByKey } from '../../assets/lifehub-209a81f4/data.js';

const DUR = 15.6;

// [area, row index, logo, card text, card meta]
const CHAOS = [
  ['school', 1, 'canvas', 'ECON 102 midterm', 'Oct 20'],
  ['email', 0, 'gmail', 'Lena: interview times?', 'Halcyon Labs'],
  ['network', 0, 'linkedin', 'Reply to Marcus', 'waiting 2 days'],
  ['apps', 0, 'doc', 'Research fellowship', 'opens tomorrow 9 AM'],
  ['cal', 3, 'gcal', 'Gym?', 'skipped Thu'],
  ['projects', 0, 'github', 'Ship streaks API', 'habit-tracker'],
  ['school', 0, 'canvas', 'PSET 4 due Thu', 'CS 161'],
  ['daily', 2, 'repeat', 'Laundry. Again.', 'since Sat'],
  ['email', 1, 'gmail', 'Financial aid form', 'due Fri'],
  ['network', 1, 'linkedin', 'Follow up with Priya', 'career fair'],
  ['apps', 1, 'doc', 'Internship apps open', 'Oct 14'],
  ['school', 3, 'canvas', 'Capstone proposal', 'Oct 30'],
  ['cal', 2, 'gcal', 'Coffee chat 1 PM', 'Marcus'],
  ['daily', 0, 'repeat', 'Read 20 pages', 'every day'],
  ['network', 2, 'gmail', 'Thank Prof. Alvarez', 'today'],
  ['projects', 1, 'notion', 'Portfolio case study', '60% drafted'],
];

// scattered start positions (stage px, card centre), clear of the headline band
const SPOTS = [
  [330, 300], [960, 280], [1590, 300], [250, 470], [700, 430], [1240, 440], [1690, 480], [420, 640],
  [960, 610], [1500, 650], [230, 820], [700, 800], [1180, 790], [1660, 830], [480, 960], [1420, 960],
];

const FULL = { cx: 960, cy: 506, z: 0.86 };

export default {
  id: 'chaos',
  dur: DUR,
  mount(sec) {
    const bands = makeBands(['school deadlines follow ups', 'applications inbox calendar', 'projects gym replies due', 'what did i forget'], { size: 210, top: 120 });
    sec.appendChild(bands.el);

    const layer = h('<div class="lh-layer"></div>');
    const dash = makeDashboard();
    layer.appendChild(dash.el);
    sec.appendChild(layer);

    const cardsEl = h('<div class="lh-layer" style="z-index:20"></div>');
    sec.appendChild(cardsEl);
    const cards = CHAOS.map(([area, ri, lg, text, meta], i) => {
      const el = makeCard({ logoName: lg, text, meta });
      el.classList.add('lh-abs');
      el.style.transformOrigin = '0 0';
      cardsEl.appendChild(el);
      return { el, area, ri, i, spot: SPOTS[i], rot: (rand(i + 1) - 0.5) * 14, t0: 0.35 + i * 0.16 };
    });

    const big = makeMark(260);
    const bigEl = h('<div class="lh-abs" style="z-index:25;transform-origin:0 0"></div>');
    bigEl.appendChild(big.el);
    sec.appendChild(bigEl);

    // stop-chips during the camera tour (stage coords, readable at feed size)
    const tour = [
      makeChip('canvas', 'Midterm in 15 days. Booking review blocks', 'Midterm in 15 days. 3 review blocks booked', { size: 40 }),
      makeChip('linkedin', 'Marcus is waiting. Drafting a reply', 'Marcus is waiting. Reply drafted', { size: 40 }),
      makeChip('gmail', 'Sorting 142 emails', '142 sorted. 3 need you', { size: 40 }),
    ];
    const scrim = h('<div class="lh-scrim"></div>');
    sec.appendChild(scrim);
    for (const c of tour) { c.el.classList.add('lh-abs'); c.el.style.zIndex = 28; sec.appendChild(c.el); }

    const head = makeHeadline([
      { a: 0.25, b: 3.85, text: 'everything is everywhere.' },
      { a: 4.0, b: 7.3, text: 'superbot sorts it.' },
      { a: 12.75, b: DUR, text: 'your whole life. one page.' },
    ]);
    sec.appendChild(head.el);

    // measure rows in layer coordinates while the layer is untransformed
    for (const c of cards) {
      c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
      c.row = dash.rows[c.area][c.ri];
      c.target = boxIn(c.row, layer);
    }
    const carded = new Set(cards.map((c) => c.row));
    const panelBox = Object.fromEntries(Object.entries(dash.panels).map(([k, p]) => [k, boxIn(p, layer)]));
    const brandBox = boxIn(dash.el.querySelector('.lh-brand-mark'), layer);
    const hot = {
      school: dash.rows.school[1], network: dash.rows.network[0], email: dash.rows.email[0],
    };
    for (const c of tour) { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; }

    const pz = 1.85;
    const keys = [
      { t: 0, ...FULL, z: 0.78 }, { t: 4.6, ...FULL, z: 0.78 }, { t: 7.0, ...FULL },
      { t: 7.6, ...FULL },
      { t: 8.5, cx: panelBox.school.cx, cy: panelBox.school.cy + 10, z: pz },
      { t: 9.4, cx: panelBox.school.cx, cy: panelBox.school.cy + 10, z: pz },
      { t: 10.1, cx: panelBox.network.cx, cy: panelBox.network.cy, z: pz },
      { t: 10.9, cx: panelBox.network.cx, cy: panelBox.network.cy, z: pz },
      { t: 11.6, cx: panelBox.email.cx, cy: panelBox.email.cy, z: pz },
      { t: 12.3, cx: panelBox.email.cx, cy: panelBox.email.cy, z: pz },
      { t: 13.3, ...FULL }, { t: DUR, ...FULL, z: 0.81 },
    ];
    return { scrim, bands, layer, dash, cards, carded, big, bigEl, brandBox, tour, hot, head, keys };
  },

  render(t, c) {
    c.bands.render(t);
    setStyle(c.bands.el, { o: ep(t, 0, 0.5) * (1 - 0.6 * ep(t, 4.6, 6.0)) });
    const cam = camAt(c.keys, t);
    camera(c.layer, cam.cx, cam.cy, cam.z);
    const toStage = (b) => ({ x: 960 + (b.x - cam.cx) * cam.z, y: 540 + (b.y - cam.cy) * cam.z });

    // dashboard: window fades up behind the cards, panels stagger in, carded rows wait for their card
    const kw = ep(t, 4.5, 5.6);
    setStyle(c.dash.el, { o: kw, y: (1 - kw) * 30 });
    revealDashboard(c.dash, t, 4.7, { step: 0.09 });
    c.dash.mark.render(t);

    // chaos cards: pop, drift, get nudged by the mark's arrival, then fly into their rows
    const push = ep(t, 3.7, 4.4) * (1 - ep(t, 4.4, 5.2));
    for (const k of c.cards) {
      const pop = spring(t, k.t0, { freq: 2.0, damp: 0.5 });
      const drift = Math.sin(t * 0.9 + k.i * 1.7) * 7;
      const [sx, sy] = k.spot;
      const dx = sx - 960, dy = sy - 560, dl = Math.hypot(dx, dy) || 1;
      const px = sx + (dx / dl) * 60 * push, py = sy + (dy / dl) * 60 * push + drift;
      const fa = 5.0 + k.i * 0.085, fb = fa + 0.95;
      const kf = ease.inOutCubic(prog(t, fa, fb));
      const tgt = toStage(k.target);
      const sTo = (k.target.h * cam.z * 0.92) / k.h;
      const s0 = (0.55 + 0.45 * pop) * 1.14;
      const s = lerp(s0, sTo, kf);
      const x = lerp(px - (k.w * s0) / 2, tgt.x, kf);
      const y = lerp(py - (k.h * s0) / 2, tgt.y, kf);
      const o = Math.min(1, pop * 1.4) * (1 - ep(t, fb - 0.2, fb + 0.05));
      setStyle(k.el, { x, y, s, r: k.rot * (1 - kf) * (0.4 + 0.6 * pop), o });
      setStyle(k.row, { o: ep(t, fb - 0.25, fb + 0.1) });
    }

    // the big mark lands in the middle, then flies to the sidebar brand slot
    const km = spring(t, 3.65, { freq: 1.7, damp: 0.55 });
    const kfly = ease.inOutCubic(prog(t, 5.2, 6.3));
    const bb = toStage(c.brandBox);
    const bs = lerp(1, (c.brandBox.w * cam.z) / 260, kfly);
    const bx = lerp(960 - 130, bb.x, kfly), by = lerp(560 - 130, bb.y, kfly);
    setStyle(c.bigEl, { x: bx, y: by, s: bs * (0.4 + 0.6 * km), o: t < 3.65 ? 0 : Math.min(1, km * 1.5) * (1 - ep(t, 6.15, 6.35)) });
    c.big.render(t);

    // tour: hot row highlight + a readable chip under the camera, over a bottom scrim
    setStyle(c.scrim, { o: win(t, 8.2, 12.8, 0.4, 0.5) });
    const stops = [[c.hot.school, 8.4, 9.6], [c.hot.network, 10.0, 11.0], [c.hot.email, 11.5, 12.5]];
    stops.forEach(([row, a, b], i) => {
      const ch = c.tour[i];
      const k = win(t, a, b, 0.35, 0.3);
      row.classList.toggle('lh-focus', k > 0.2);
      const kd = t > a + 0.75;
      ch.set(kd, t);
      const ks = ease.outBack(prog(t, a, a + 0.45));
      setStyle(ch.el, { x: 960 - ch.w / 2, y: 950 + (1 - ks) * 40, o: k });
    });

    // a couple of rows tick off during the pull back
    setRowDone(c.dash.rows.daily[0], ep(t, 13.9, 14.2));
    setRowDone(c.dash.rows.network[2], ep(t, 14.5, 14.8));

    c.head.render(t);
  },
};
