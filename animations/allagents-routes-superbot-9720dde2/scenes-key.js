// scenes-key.js: the subscriptions you pay for pack into one superbot API key; the drop-in swap.
import { W, H, el, put, box, pose, fade, seg, sp, ez, lerp, ease, PRESETS, mascot, tile, esc, ICON, PLANS, KEY_MASK, BASE_URL, caption, camera, applyCam, typed } from './core.js';
import { shell } from './ui.js';

/** A: plan cards in a row fly into the dock of one key bar, morphing into chips; the key prints as they land */
export function keyRow({ caps }) {
  const { root, cam, over } = shell();
  const N = PLANS.length, CW = 300, CH = 176, GAP = 34, X0 = (W - (N * CW + (N - 1) * GAP)) / 2, CY = 268;
  const KX = 330, KY = 620, KW = 1260, KH = 150;
  const SLOT = 52, SG = 12, DOCKW = N * SLOT + (N - 1) * SG, DOCKX = KX + KW - 40 - DOCKW;
  const cards = PLANS.map((p, i) => {
    const c = put(cam, 'div', 'pcard');
    const t = tile(p.logo, 56); c.appendChild(t);
    const n = put(c, 'div', 'pcard-n', esc(p.name));
    const s = put(c, 'div', 'pcard-s', `<i class="dot"></i>${esc(p.who)} · connected`);
    return { el: c, t, txt: [n, s], x: X0 + i * (CW + GAP), y: CY };
  });
  const key = put(cam, 'div', 'keybar'); box(key, KX, KY, KW, KH);
  put(key, 'span', 'kicon', ICON.key);
  put(key, 'div', 'k-label', 'SUPERBOT_API_KEY');
  const kval = put(key, 'div', 'k-val');
  const caret = put(key, 'span', 'k-caret');
  const dock = put(key, 'div', 'k-dock'); box(dock, DOCKX - KX, (KH - SLOT) / 2, DOCKW, SLOT);
  const chips = PLANS.map((p) => { const s = put(dock, 'span', 'k-slot'); const t = tile(p.logo, SLOT); s.appendChild(t); return t; });
  const count = put(cam, 'div', 'k-count'); box(count, 0, KY + KH + 30, W);
  const cap1 = caption(over, [{ text: caps[0] }]);
  const cap2 = caption(over, [{ text: caps[1] }]);
  const dep = (i) => 1.75 + i * 0.3, FL = 0.72, land = (i) => dep(i) + FL;
  const tPush = land(N - 1) + 0.25;
  const dur = tPush + 2.3;
  const cam1 = camera([[0, { x: W / 2, y: 560, s: 1.03 }], [0.3, { s: 1, preset: PRESETS.heavy }], [1.6, { y: 600, s: 1.02 }], [tPush, { y: KY + KH / 2 + 30, s: 1.3, preset: PRESETS.heavy }]]);
  const cues = [];
  PLANS.forEach((p, i) => cues.push({ t: 0.15 + i * 0.07, type: 'tick', gain: 0.3 }, { t: dep(i), type: 'whoosh', gain: 0.25 }, { t: land(i), type: 'pop', gain: 0.65 }));
  cues.push({ t: tPush, type: 'thump', gain: 0.8 });

  function render(t) {
    applyCam(cam, cam1(t));
    const kk = sp(t, 1.15, PRESETS.heavy);
    let landed = 0;
    cards.forEach((c, i) => {
      const a = 0.15 + i * 0.07;
      const kin = sp(t, a, PRESETS.default);
      const f = ez(t, dep(i), land(i), ease.inOutCubic);
      const m = ez(t, dep(i), dep(i) + FL * 0.8, ease.outCubic);
      // morph the card into a chip-sized tile as it flies along an arc to its slot
      const sx = DOCKX + i * (SLOT + SG) + SLOT / 2, sy = KY + KH / 2;
      const cx0 = c.x + CW / 2, cy0 = c.y + CH / 2;
      const ctrlX = (cx0 + sx) / 2, ctrlY = Math.min(cy0, sy) - 90;
      const bx = (1 - f) ** 2 * cx0 + 2 * (1 - f) * f * ctrlX + f * f * sx;
      const by = (1 - f) ** 2 * cy0 + 2 * (1 - f) * f * ctrlY + f * f * sy;
      const w = lerp(CW, SLOT, m), h = lerp(CH, SLOT, m);
      c.el.style.left = `${(bx - w / 2).toFixed(2)}px`; c.el.style.top = `${(by - h / 2).toFixed(2)}px`;
      c.el.style.width = `${w.toFixed(2)}px`; c.el.style.height = `${h.toFixed(2)}px`;
      c.el.style.borderRadius = `${lerp(24, 16, m).toFixed(1)}px`;
      c.el.style.setProperty('--chrome', (1 - m).toFixed(3));
      c.t.style.left = `${lerp(24, (w - 56 * lerp(1, SLOT / 56, m)) / 2, m).toFixed(2)}px`;
      c.t.style.top = `${lerp(24, (h - 56 * lerp(1, SLOT / 56, m)) / 2, m).toFixed(2)}px`;
      c.t.style.transform = `scale(${lerp(1, SLOT / 56, m).toFixed(4)})`;
      c.txt.forEach((e) => fade(e, 1 - seg(m, 0, 0.3)));
      const gone = t >= land(i);
      pose(c.el, { y: (1 - kin) * 70, o: seg(t, a, a + 0.25) * (gone ? 0 : 1) });
      if (gone) landed++;
      const kc = sp(t, land(i), PRESETS.playful);
      pose(chips[i], { s: 0.55 + 0.45 * kc, o: t >= land(i) ? 1 : 0 });
    });
    const bump = cards.reduce((acc, c, i) => { const x = t - land(i); return acc + (x > 0 ? Math.exp(-x * 9) * Math.sin(x * 26) : 0); }, 0);
    pose(key, { y: (1 - kk) * 110, s: 1 + 0.012 * bump, o: seg(t, 1.15, 1.35) });
    const n = Math.round(KEY_MASK.length * seg(t, dep(0) + 0.3, land(N - 1) + 0.1));
    const v = KEY_MASK.slice(0, n);
    if (kval.textContent !== v) kval.textContent = v;
    fade(caret, t < land(N - 1) + 0.6 && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0);
    caret.style.left = `${112 + kval.offsetWidth + 3}px`;
    const ct = landed ? `<b>${landed}</b> subscription${landed > 1 ? 's' : ''} in <b>1</b> key` : '';
    if (count.innerHTML !== ct) count.innerHTML = ct;
    cap1.render(t, 0.25, tPush - 0.55);
    cap2.render(t, tPush - 0.25);
  }
  return { dur, root, render, cues };
}

/** B: plan cards dealt in a fan, gathered into one deck, and flipped over into the superbot key card */
export function keyStack({ caps }) {
  const { root, cam, over } = shell();
  const N = PLANS.length, CW = 420, CH = 260, CX = W / 2, CY = 600;
  const cards = PLANS.map((p, i) => {
    const c = put(cam, 'div', 'ccard');
    box(c, CX - CW / 2, CY - CH / 2, CW, CH);
    c.appendChild(tile(p.logo, 64));
    c.insertAdjacentHTML('beforeend', `<div class="cc-on"><i class="dot"></i>connected</div><div class="cc-n">${esc(p.name)}</div><div class="cc-m">•••• ${esc(p.who.toLowerCase())}</div>`);
    return c;
  });
  // the key card: the deck's back face
  const KW2 = 760, KH2 = 440;
  const kc = put(cam, 'div', 'kcard');
  box(kc, CX - KW2 / 2, CY - KH2 / 2, KW2, KH2);
  const km = mascot(58);
  const kh = put(kc, 'div', 'kc-h'); kh.appendChild(km.el); kh.insertAdjacentHTML('beforeend', '<b>superbot</b><span class="kc-tag">API key</span>');
  put(kc, 'div', 'k-label', 'SUPERBOT_API_KEY');
  const kval = put(kc, 'div', 'k-val', KEY_MASK);
  const row = put(kc, 'div', 'kc-row');
  const chips = PLANS.map((p) => { const t = tile(p.logo, 40); row.appendChild(t); return t; });
  const cnt = put(row, 'span', 'kc-cnt', `<b>${N}</b> subscriptions in <b>1</b> key`);
  const url = put(kc, 'div', 'kc-url', `<span class="mut">base_url</span> <span class="kc-urlv"></span><span class="sh-drop">drop-in</span>`);
  const urlv = url.querySelector('.kc-urlv'), drop = url.querySelector('.sh-drop');
  const cap1 = caption(over, [{ text: caps[0] }]);
  const cap2 = caption(over, [{ text: caps[1] }]);
  const tg = 1.75, tf = tg + N * 0.12 + 0.45; // gather, flip
  const tUrl = tf + 0.9;
  const dur = tUrl + 2.4;
  const cam1 = camera([[0, { x: W / 2, y: 580, s: 1 }], [tg, { y: 590, s: 1.06 }], [tf + 0.3, { y: CY + 10, s: 1.14, preset: PRESETS.heavy }]]);
  const cues = [];
  PLANS.forEach((p, i) => cues.push({ t: 0.12 + i * 0.11, type: 'whoosh', gain: 0.3 }, { t: tg + i * 0.12 + 0.18, type: 'tick', gain: 0.55 }));
  cues.push({ t: tf, type: 'whoosh', gain: 0.6 }, { t: tf + 0.42, type: 'thump', gain: 0.9 }, { t: tUrl, type: 'tick', gain: 0.4 }, { t: tUrl + 0.8, type: 'pop', gain: 0.5 });

  function render(t) {
    applyCam(cam, cam1(t));
    km.render(t);
    const flip = ez(t, tf, tf + 0.62, ease.inOutCubic); // 0..1 = 0..180deg
    cards.forEach((c, i) => {
      const a = 0.12 + i * 0.11;
      const kin = sp(t, a, PRESETS.default);
      const o = i - (N - 1) / 2;
      const fan = { x: o * 250, y: Math.abs(o) * 40 - 30, r: o * 9 };
      const kg = sp(t, tg + i * 0.12, PRESETS.snappy);
      const deck = { x: 0, y: -(N - 1 - i) * 7 + 14, r: (i - 2) * 0.8 };
      const x = lerp(fan.x, deck.x, kg), y = lerp(fan.y, deck.y, kg), r = lerp(fan.r, deck.r, kg);
      const enter = (1 - kin) * 720;
      const front = i === N - 1;
      const fl = front ? flip : flip; // the whole deck turns together
      const s = lerp(1, KW2 / CW, ez(t, tf, tf + 0.62, ease.inOutCubic));
      pose(c, { x, y: y + enter, r: r * (1 - fl), s: s * (0.96 + 0.04 * kin), ry: fl * 180, o: seg(t, a, a + 0.15) * (fl < 0.5 ? 1 : 0) });
    });
    const kf = sp(t, tf, PRESETS.default);
    pose(kc, { ry: -180 + flip * 180, s: lerp(CW / KW2, 1, ease.inOutCubic(seg(t, tf, tf + 0.62))) * (1 + 0.02 * Math.sin(Math.PI * seg(t, tf + 0.5, tf + 0.9))), o: flip >= 0.5 ? 1 : 0 });
    chips.forEach((c, i) => { const k = sp(t, tf + 0.5 + i * 0.07, PRESETS.playful); pose(c, { s: 0.5 + 0.5 * k, o: seg(t, tf + 0.5 + i * 0.07, tf + 0.6 + i * 0.07) }); });
    fade(cnt, seg(t, tf + 0.9, tf + 1.1));
    const u = typed(BASE_URL, t, tUrl, 48);
    if (urlv.textContent !== u) urlv.textContent = u;
    const kd = sp(t, tUrl + 0.65, PRESETS.playful);
    pose(drop, { s: 0.5 + 0.5 * kd, o: seg(t, tUrl + 0.65, tUrl + 0.75) });
    fade(url, seg(t, tUrl - 0.15, tUrl));
    cap1.render(t, 0.3, tf - 0.2);
    cap2.render(t, tf + 0.35);
  }
  return { dur, root, render, cues };
}

/** A: .env with four provider keys; each is struck, they collapse, and two lines take their place */
export function envSwap({ caps }) {
  const { root, cam, over } = shell();
  const EX = 300, EY = 330, EW = 1320, EH = 380, LH = 64;
  const ed = put(cam, 'div', 'win editor'); box(ed, EX, EY, EW, EH);
  ed.innerHTML = `<div class="win-bar"><span class="dots"><i></i><i></i><i></i></span><span class="ed-tab">.env</span><span class="ed-path">~/store</span></div>`;
  const bd = put(ed, 'div', 'ed-body');
  const OLD = [
    ['claude', 'ANTHROPIC_API_KEY', 'sk-ant-api03-••••••••••••'],
    ['openai', 'OPENAI_API_KEY', 'sk-proj-••••••••••••••••'],
    ['gemini', 'GEMINI_API_KEY', 'AIza••••••••••••••••••'],
    ['deepseek', 'DEEPSEEK_API_KEY', 'sk-••••••••••••••••••'],
  ];
  const NEW = [['OPENAI_BASE_URL', BASE_URL], ['OPENAI_API_KEY', 'sbc_live_••••••••7f3a']];
  const olds = OLD.map(([lg, k, v], i) => {
    const r = put(bd, 'div', 'ed-ln old'); box(r, 0, 28 + i * LH, EW, LH - 6);
    r.innerHTML = `<span class="ed-g">${i + 1}</span>`;
    r.appendChild(tile(lg, 30));
    r.insertAdjacentHTML('beforeend', `<span class="ed-k">${k}</span><span class="ed-eq">=</span><span class="ed-v">${esc(v)}</span><span class="ed-strike"></span>`);
    return { el: r, strike: r.querySelector('.ed-strike') };
  });
  const news = NEW.map(([k, v], i) => {
    const r = put(bd, 'div', 'ed-ln new'); box(r, 0, 28 + i * LH, EW, LH - 6);
    r.innerHTML = `<span class="ed-g">+</span>`;
    const m = mascot(30); r.appendChild(m.el);
    r.insertAdjacentHTML('beforeend', `<span class="ed-k">${k}</span><span class="ed-eq">=</span><span class="ed-v"></span>`);
    return { el: r, v: r.querySelector('.ed-v'), val: v, m };
  });
  const foot = put(bd, 'div', 'ed-foot'); box(foot, 0, 28 + 2 * LH + 30, EW);
  foot.innerHTML = '<span class="ok">same SDK</span><span class="ok">same code</span><span class="ok">every model on your plans</span>';
  const ts = (i) => 0.55 + i * 0.2, tcol = 1.6, tn = (i) => 2.15 + i * 0.75;
  const dur = tn(1) + 2.3;
  const cap1 = caption(over, [{ text: caps[0] }]);
  const cap2 = caption(over, [{ text: caps[1] }]);
  const cam1 = camera([[0, { x: W / 2, y: 560, s: 1 }], [tn(0) - 0.2, { x: W / 2, y: EY + 120, s: 1.16, preset: PRESETS.heavy }], [tn(1) + 0.9, { x: W / 2, y: 560, s: 1.06 }]]);
  const cues = [];
  OLD.forEach((o, i) => cues.push({ t: ts(i), type: 'tick', gain: 0.45 }));
  cues.push({ t: tcol, type: 'whoosh', gain: 0.5 }, { t: tn(0), type: 'click', gain: 0.5 }, { t: tn(1), type: 'click', gain: 0.5 }, { t: tn(1) + 0.9, type: 'pop', gain: 0.5 });

  function render(t) {
    applyCam(cam, cam1(t));
    const ke = sp(t, 0, PRESETS.default);
    pose(ed, { y: (1 - ke) * 70, o: seg(t, 0, 0.2) });
    olds.forEach((o, i) => {
      o.strike.style.setProperty('--p', ez(t, ts(i), ts(i) + 0.28, ease.outCubic).toFixed(3));
      o.el.classList.toggle('struck', t > ts(i) + 0.05);
      const kc = sp(t, tcol + (3 - i) * 0.05, PRESETS.default);
      pose(o.el, { y: -kc * i * LH, s: 1 - 0.04 * kc, o: 1 - seg(t, tcol + 0.1, tcol + 0.38) });
    });
    news.forEach((n, i) => {
      const k = sp(t, tn(i) - 0.1, PRESETS.snappy);
      pose(n.el, { y: (1 - k) * 18, o: seg(t, tn(i) - 0.1, tn(i)) });
      const v = typed(n.val, t, tn(i), 44);
      if (n.v.textContent !== v) n.v.textContent = v;
      n.m.render(t);
    });
    [...foot.children].forEach((c, i) => { const k = sp(t, tn(1) + 0.9 + i * 0.1, PRESETS.playful); pose(c, { s: 0.6 + 0.4 * k, o: seg(t, tn(1) + 0.9 + i * 0.1, tn(1) + 1 + i * 0.1) }); });
    cap1.render(t, 0.2, tn(0) + 0.3);
    cap2.render(t, tn(0) + 0.55);
  }
  return { dur, root, render, cues };
}
