/* lifehub-build: one prompt in the real superbot chat builds the command center live.
   Composer push-in, the prompt types and sends -> superbot connects six apps (tool chips, spinner -> check) and
   reads the mail and the deadlines -> the chat gives way to the dashboard, panels assemble as the camera pans
   School, Networking, Applications -> pull back to all 7 areas: "your whole life. one page." */
import { ease, ep, prog, spring, win, h, $, $$, setStyle, setText, camera, camAt, boxIn, lerp, typed } from '../../assets/lifehub-209a81f4/lib.js';
import { makeDashboard, makeHeadline, makeMark, makeChip, makeCursor, revealDashboard, setRowDone, logo, ICONS } from '../../assets/lifehub-209a81f4/ui.js';
import { USER } from '../../assets/lifehub-209a81f4/data.js';

const DUR = 16.4;
const PROMPT = 'make me a command center for my whole life';
const SAY = 'On it. Connecting your apps first.';
const T = {
  type: 1.0, cps: 22,           // the prompt types into the composer
  click: 3.12, send: 3.22,      // cursor presses send
  sendTr: [3.25, 3.95],         // greeting leaves, composer drops, the bubble lands
  say: 3.75,
  chip0: 4.1, chipStep: 0.3, chipRun: 0.5,
  morph: [7.95, 8.4],            // chat gives way to the dashboard
};

// connect chips: [logo, running, done] in the sidebar's connection order
const CONNECT = [
  ['gmail', 'Connecting to Gmail', 'Connected to Gmail'],
  ['gcal', 'Connecting to Google Calendar', 'Connected to Google Calendar'],
  ['canvas', 'Connecting to Canvas', 'Connected to Canvas'],
  ['linkedin', 'Connecting to LinkedIn', 'Connected to LinkedIn'],
  ['github', 'Connecting to GitHub', 'Connected to GitHub'],
  ['notion', 'Connecting to Notion', 'Connected to Notion'],
];
// work chips: [logo, running, done, appear, done at]
const WORK = [
  ['gmail', 'Reading 3 weeks of email', '142 emails sorted, 3 need you', 6.15, 6.8],
  ['clock', 'Finding deadlines', '11 deadlines found', 6.5, 7.15],
  ['grid', 'Building your command center', 'Your command center is ready', 6.9, 7.8],
];

const FULL = { cx: 960, cy: 506, z: 0.86 };
const CHEV = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>';
const MON = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

export default {
  id: 'build',
  dur: DUR,
  mount(sec) {
    const layer = h('<div class="lh-layer"></div>');
    const dash = makeDashboard();
    layer.appendChild(dash.el);
    sec.appendChild(layer);
    const main = $(dash.el, '.lh-main');
    const navs = $$(dash.el, '.lh-nav');

    // ---- the chat pane, laid over the main column ----
    const chat = h(`<div class="bx-chat">
      <div class="bx-feed"><div class="bx-thread">
        <div class="bx-user"><span>${PROMPT}</span></div>
        <div class="bx-bot"><div class="bx-who"><span class="bx-who-m"></span>superbot</div><div class="bx-say"><span></span></div><div class="bx-chips"></div></div>
      </div></div>
      <div class="bx-hero"><span class="bx-hero-m"></span><h1>Good morning, ${USER}.</h1></div>
      <div class="bx-comp">
        <div class="bx-in"><span class="bx-ph">How can superbot help you today?</span><span class="bx-tx"><span></span><i class="bx-caret"></i></span></div>
        <div class="bx-tools">
          <span class="lh-ico" style="width:26px;height:26px">${PLUS}</span>
          <span class="bx-super">SUPER<span class="bx-tog"><i></i>OFF</span></span>
          <span class="bx-model"><span class="bx-model-m"></span>Superbot${CHEV}</span>
          <span class="bx-mon">${MON}</span>
          <span class="bx-mic">${MIC}</span>
          <span class="bx-send"><span class="bx-send-on"></span>${logo('arrow', 24)}</span>
        </div>
      </div>
    </div>`);
    main.appendChild(chat);
    const heroMark = makeMark(68), whoMark = makeMark(32), modelMark = makeMark(24);
    $(chat, '.bx-hero-m').appendChild(heroMark.el);
    $(chat, '.bx-who-m').appendChild(whoMark.el);
    $(chat, '.bx-model-m').appendChild(modelMark.el);

    const chipsEl = $(chat, '.bx-chips');
    const chips = [];
    CONNECT.forEach(([lg, run, done], i) => {
      const a = T.chip0 + i * T.chipStep;
      const c = makeChip(lg, run, done, { size: 23 });
      chipsEl.appendChild(c.el);
      chips.push({ ...c, a, d: a + T.chipRun, conn: dash.conns[i] });
    });
    for (const [lg, run, done, a, d] of WORK) {
      const c = makeChip(lg, run, done, { size: 23 });
      c.el.classList.add('bx-work');
      chipsEl.appendChild(c.el);
      chips.push({ ...c, a, d });
    }
    // longest label first so the measured layout never reflows when a label swaps
    for (const c of chips) c.set(true, 0);

    const hero = $(chat, '.bx-hero'), comp = $(chat, '.bx-comp'), feed = $(chat, '.bx-feed'), thread = $(chat, '.bx-thread');
    const user = $(chat, '.bx-user'), who = $(chat, '.bx-who'), sayEl = $(chat, '.bx-say span');
    const ph = $(chat, '.bx-ph'), tx = $(chat, '.bx-tx'), txText = $(chat, '.bx-tx span'), caret = $(chat, '.bx-caret');
    const send = $(chat, '.bx-send'), sendOn = $(chat, '.bx-send-on');

    // ---- layout in chat-local px (the pane is the main column) ----
    const H = chat.offsetHeight;
    const compH = comp.offsetHeight, heroH = hero.offsetHeight;
    const groupTop = Math.round(H * 0.46 - (heroH + 40 + compH) / 2);
    const heroY = groupTop, comp0 = groupTop + heroH + 40, comp1 = H - compH - 26;
    feed.style.height = `${comp1 - 10}px`;
    const limit = comp1 - 10 - 30;
    let prev = 0;
    for (const c of chips) {
      const bottom = c.el.offsetTop + c.el.offsetHeight; // offsetParent is .bx-thread
      const need = Math.max(0, bottom - limit);
      c.inc = Math.max(0, need - prev); prev = Math.max(prev, need);
    }

    // layer coordinates (layer untransformed, composer at its typing position)
    setStyle(comp, { y: comp0 }); setStyle(hero, { y: heroY });
    const mb = boxIn(main, layer);
    const compBox = boxIn(comp, layer);
    const sendBox = boxIn(send, layer);
    const panelBox = Object.fromEntries(Object.entries(dash.panels).map(([k, p]) => [k, boxIn(p, layer)]));

    const cursor = makeCursor();
    sec.appendChild(cursor.el);

    // tour chips over the bottom scrim (stage coords)
    const tour = [
      makeChip('canvas', 'Checking ECON 102 deadlines', 'Midterm Oct 20. Start now, not Oct 19', { size: 40 }),
      makeChip('linkedin', 'Checking who is waiting on you', 'Marcus is waiting. Reply drafted', { size: 40 }),
      makeChip('doc', 'Watching opening dates', 'Fellowship opens tomorrow 9 AM. Reminder set', { size: 40 }),
    ];
    const scrim = h('<div class="lh-scrim"></div>');
    sec.appendChild(scrim);
    for (const c of tour) { c.el.classList.add('lh-abs', 'bx-cap'); sec.appendChild(c.el); c.set(true, 0); c.w = c.el.offsetWidth; }

    const head = makeHeadline([{ a: 13.8, b: DUR, text: 'your whole life. one page.' }]);
    sec.appendChild(head.el);

    const pz = 1.8;
    // keep the window filling the frame: never show more than 40px of stage past its left or right edge
    const winL = 120, winR = 1800, half = 960 / pz;
    const P = (k, dy = 5) => ({ cx: Math.min(winR + 40 - half, Math.max(winL - 40 + half, panelBox[k].cx)), cy: panelBox[k].cy + dy, z: pz });
    const typeCam = { cx: mb.cx, cy: compBox.y + compBox.h / 2 - 60, z: 1.85 };
    const keys = [
      { t: 0, cx: 960, cy: 540, z: 0.98 }, { t: 0.3, cx: 960, cy: 540, z: 0.98 },
      { t: 1.45, ...typeCam }, { t: 3.25, ...typeCam },
      { t: 4.15, cx: mb.cx, cy: mb.y + 345, z: 1.62 },
      { t: 7.9, cx: mb.cx, cy: mb.y + 425, z: 1.5, ease: ease.inOutSine },
      { t: 8.95, ...P('school') }, { t: 10.0, ...P('school') },
      { t: 10.6, ...P('network') }, { t: 11.4, ...P('network') },
      { t: 12.15, ...P('apps') }, { t: 12.95, ...P('apps') },
      { t: 13.95, ...FULL }, { t: DUR, ...FULL, z: 0.83, ease: ease.inOutSine },
    ];
    const reveal = { school: 8.25, network: 9.75, projects: 10.2, apps: 11.2, cal: 13.15, email: 13.3, daily: 13.45 };
    const hot = { school: dash.rows.school[1], network: dash.rows.network[0], apps: dash.rows.apps[0] };

    return { layer, dash, navs, chat, hero, comp, thread, user, who, sayEl, ph, tx, txText, caret, sendOn, chips,
      heroMark, whoMark, modelMark, heroY, comp0, comp1, sendBox, cursor, tour, scrim, head, keys, reveal, hot };
  },

  render(t, c) {
    const cam = camAt(c.keys, t);
    camera(c.layer, cam.cx, cam.cy, cam.z);
    const toStage = (x, y) => ({ x: 960 + (x - cam.cx) * cam.z, y: 540 + (y - cam.cy) * cam.z });
    c.dash.mark.render(t); c.heroMark.render(t); c.whoMark.render(t); c.modelMark.render(t);
    

    // sidebar: Chats is the open tab until the command center exists, then its nav row slides in on top
    const kn = ep(t, 8.05, 8.6, ease.inOutCubic);
    const nav0 = c.navs[0];
    const nh = `${(41 * kn).toFixed(2)}px`;
    if (nav0.__h !== nh) {
      nav0.style.height = nh; nav0.style.paddingTop = nav0.style.paddingBottom = `${(10 * kn).toFixed(2)}px`;
      nav0.style.marginBottom = `${(-4 * (1 - kn)).toFixed(2)}px`; nav0.__h = nh;
    }
    setStyle(nav0, { o: kn });
    nav0.classList.toggle('on', t >= 8.3);
    c.navs[1].classList.toggle('on', t < 8.3);

    // ---- beat 1: greeting + composer, the prompt types in ----
    const kOut = ep(t, T.sendTr[0], T.sendTr[0] + 0.4);
    setStyle(c.hero, { y: c.heroY - 40 * kOut, o: 1 - kOut });
    const kc = ep(t, T.sendTr[0], T.sendTr[1], ease.inOutCubic);
    setStyle(c.comp, { y: lerp(c.comp0, c.comp1, kc) });
    const sent = t >= T.send;
    const draft = sent ? '' : typed(PROMPT, t, T.type, T.cps);
    setText(c.txText, draft);
    const typing = t >= T.type && t < T.type + PROMPT.length / T.cps + 0.05;
    const caretOn = !sent && t >= T.type - 0.4 && (typing || Math.floor(t * 2.4) % 2 === 0);
    setStyle(c.caret, { o: caretOn ? 1 : 0 });
    setStyle(c.ph, { o: draft.length || (t >= T.type - 0.4 && !sent) ? 0 : 1 });
    setStyle(c.sendOn, { o: draft.length ? 1 : 0 });

    // cursor glides to send and clicks (stage coords from the layer box)
    const kcur = ep(t, 2.5, T.click, ease.inOutCubic);
    const tgt = toStage(c.sendBox.cx, c.sendBox.cy);
    const cx = lerp(tgt.x + 260, tgt.x, kcur), cy = lerp(tgt.y + 300, tgt.y, kcur);
    const press = win(t, T.click - 0.02, T.click + 0.16, 0.06, 0.08);
    const rip = t >= T.click ? prog(t, T.click, T.click + 0.45) : -1;
    c.cursor.set(cx - 8, cy - 6, { o: win(t, 2.45, 3.75, 0.2, 0.3), press, rip: rip >= 1 ? -1 : rip });

    // ---- beat 2: the bubble lands, superbot answers with a stack of tool chips ----
    const kb = ease.outCubic(prog(t, T.send + 0.05, T.send + 0.55));
    setStyle(c.user, { o: kb, y: (1 - kb) * 120, s: 0.94 + 0.06 * kb });
    setStyle(c.who, { o: ep(t, T.say - 0.15, T.say + 0.2) });
    setText(c.sayEl, typed(SAY, t, T.say + 0.1, 46));
    let scroll = 0;
    for (const k of c.chips) {
      const ks = spring(t, k.a, { freq: 2.4, damp: 0.6 });
      const ko = ep(t, k.a, k.a + 0.22);
      setStyle(k.el, { o: ko, y: (1 - Math.min(1, ks)) * 22, s: 0.9 + 0.1 * ks });
      k.set(t >= k.d, t);
      scroll += k.inc * ep(t, k.a - 0.05, k.a + 0.5, ease.inOutCubic);
      if (k.conn) {
        const kd = spring(t, k.d, { freq: 2.6, damp: 0.5 });
        setStyle(k.conn, { o: 0.35 + 0.65 * ep(t, k.d, k.d + 0.25) });
        setStyle(k.conn.querySelector('i'), { o: t >= k.d ? 1 : 0, s: Math.max(0, kd) });
      }
    }
    setStyle(c.thread, { y: -scroll });

    // ---- beat 3: the chat gives way, panels assemble under the camera ----
    const km = ep(t, T.morph[0], T.morph[1], ease.inOutCubic);
    setStyle(c.chat, { o: 1 - km, y: -36 * km, s: 1 - 0.02 * km, blur: 8 * km });
    const kg = ep(t, 8.25, 8.8);
    setStyle(c.dash.greet, { o: kg, y: (1 - kg) * 18 });
    for (const [k, a] of Object.entries(c.reveal)) revealDashboard(c.dash, t, a, { order: [k], step: 0 });

    setStyle(c.scrim, { o: win(t, 8.8, 13.3, 0.4, 0.5) });
    const stops = [['school', 8.95, 10.15], ['network', 10.6, 11.55], ['apps', 12.15, 13.1]];
    stops.forEach(([key, a, b], i) => {
      const ch = c.tour[i];
      const k = win(t, a, b, 0.3, 0.3);
      c.hot[key].classList.toggle('lh-focus', t > a - 0.1 && t < b + 0.2);
      ch.set(t > a + 0.6, t);
      const ks = ease.outBack(prog(t, a, a + 0.45));
      setStyle(ch.el, { x: 960 - ch.w / 2, y: 950 + (1 - ks) * 40, o: k });
    });

    // close: the page is live, two things tick off
    setRowDone(c.dash.rows.network[2], ep(t, 14.6, 14.9));
    setRowDone(c.dash.rows.daily[0], ep(t, 15.2, 15.5));

    c.head.render(t);
  },
};
