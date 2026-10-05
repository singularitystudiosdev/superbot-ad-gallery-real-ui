// scenes-agents.js: four agent windows merge into one superbot agent; the agent splits a task and routes each step.
import { W, H, el, put, box, pose, fade, seg, sp, ez, lerp, ease, PRESETS, mascot, tile, esc, ICON, MODELS, caption, camera, applyCam, typed, modelChip } from './core.js';
import { shell, sbWindow, SBW, WIN_Y, AGENTS, AW, agentWindow, composer } from './ui.js';

const CMP = { x: 200, w: 1040, top: 614 }; // composer inside the window body

/** the full superbot window as both scenes share it: chips shown, composer docked */
function sbFull(parent) {
  const sb = sbWindow(parent);
  const comp = composer(sb.body, CMP.x, CMP.top, CMP.w);
  const empty = put(sb.body, 'div', 'sb-empty');
  const em = mascot(96); empty.appendChild(em.el);
  empty.insertAdjacentHTML('beforeend', '<p><b>Claude Code, Codex, Gemini CLI and Cursor</b><br>in one agent, on one key.</p>');
  return { ...sb, comp, empty, em };
}

/**
 * merge: Claude Code, Codex, Gemini CLI and Cursor windows collapse into one superbot window.
 * mode: 'grid' (2x2 then converge), 'fan' (dealt like a hand, then slid together), 'limits' (grid, each hits its limit first)
 */
export function merge({ mode = 'grid', caps }) {
  const lim = mode === 'limits';
  const tc = mode === 'fan' ? 2.7 : lim ? 3.75 : 2.75; // converge
  const tm = tc + 0.55; // morph into superbot
  const dur = tm + 2.2;
  const { root, cam, over } = shell();
  const GAP = 28, GX = (W - (2 * AW.w + GAP)) / 2, GY = 214;
  const home = AGENTS.map((a, i) => {
    if (mode === 'fan') return { x: W / 2 - AW.w / 2 + (i - 1.5) * 300, y: 330 + Math.abs(i - 1.5) * 34, r: (i - 1.5) * 6.5, s: 0.86 };
    return { x: GX + (i % 2) * (AW.w + GAP), y: GY + Math.floor(i / 2) * (AW.h + GAP), r: 0, s: 1 };
  });
  const wins = AGENTS.map((a, i) => agentWindow(cam, a, home[i].x, home[i].y));
  const sb = sbFull(cam);
  const cap1 = caption(over, [{ text: caps[0] }], { size: 52, y: 70 });
  const cap2 = caption(over, [{ text: caps[1] }], { size: 52, y: 70 });
  const CX = W / 2, CY = SBW.y + SBW.h / 2;
  const STACK_S = 0.6;
  const cam1 = camera([[0, { x: W / 2, y: 600, s: 1.04 }], [0.4, { s: 1, y: 560, preset: PRESETS.heavy }], [tc, { y: WIN_Y, s: 1, preset: PRESETS.default }]]);
  const cues = [];
  AGENTS.forEach((a, i) => cues.push({ t: (mode === 'fan' ? 0.15 + i * 0.13 : 0.1 + i * 0.12), type: 'pop', gain: 0.5 }));
  if (lim) AGENTS.forEach((a, i) => cues.push({ t: 1.45 + i * 0.45, type: 'tick', gain: 0.8 }));
  cues.push({ t: tc, type: 'whoosh', gain: 0.7 }, { t: tm + 0.05, type: 'thump', gain: 0.9 });
  AGENTS.forEach((a, i) => cues.push({ t: tm + 0.5 + i * 0.09, type: 'click', gain: 0.45 }));

  function render(t) {
    applyCam(cam, cam1(t));
    wins.forEach((w, i) => {
      const h = home[i];
      const a0 = mode === 'fan' ? 0.15 + i * 0.13 : 0.1 + i * 0.12;
      const kin = sp(t, a0, PRESETS.default);
      // converge: to the centre, stacked
      const kc = sp(t, tc + i * 0.05, PRESETS.default);
      const sx = CX - AW.w / 2 + (i - 1.5) * 10, sy = CY - AW.h / 2 + (i - 1.5) * 8;
      const x = lerp(h.x, sx, kc), y = lerp(h.y, sy, kc);
      const enterY = mode === 'fan' ? (1 - kin) * 640 : (1 - kin) * 50;
      const enterR = mode === 'fan' ? (1 - kin) * h.r * 2 : 0;
      const s = lerp(h.s, STACK_S, kc) * (mode === 'fan' ? 1 : 0.95 + 0.05 * kin);
      const r = lerp(h.r + enterR, (i - 1.5) * 2.5, kc);
      w.el.style.left = `${x.toFixed(2)}px`; w.el.style.top = `${y.toFixed(2)}px`;
      pose(w.el, { y: enterY, s, r, o: seg(t, a0, a0 + 0.2) * (1 - seg(t, tm + 0.05, tm + 0.3)) });
      w.render(t, a0 + 0.25, lim ? 1.45 + i * 0.45 : Infinity);
    });
    // superbot window grows out of the stack
    const g = sp(t, tm, PRESETS.default);
    const w0 = AW.w * STACK_S, h0 = AW.h * STACK_S;
    const ww = lerp(w0, SBW.w, g), hh = lerp(h0, SBW.h, g);
    sb.el.style.left = `${(CX - ww / 2).toFixed(2)}px`; sb.el.style.top = `${(CY - hh / 2).toFixed(2)}px`;
    sb.el.style.width = `${ww.toFixed(2)}px`; sb.el.style.height = `${hh.toFixed(2)}px`;
    fade(sb.el, seg(t, tm, tm + 0.08));
    fade(sb.body, seg(t, tm + 0.25, tm + 0.55));
    sb.chips.forEach((c, i) => { const k = sp(t, tm + 0.5 + i * 0.09, PRESETS.playful); pose(c, { s: 0.4 + 0.6 * k, o: seg(t, tm + 0.5 + i * 0.09, tm + 0.6 + i * 0.09) }); });
    fade(sb.strip.firstChild, seg(t, tm + 0.4, tm + 0.6));
    sb.mascot.render(t); sb.em.render(t);
    sb.comp.render(t, {});
    cap1.render(t, 0.25, tc - 0.15);
    cap2.render(t, tm + 0.35);
  }
  return { dur, root, render, cues };
}

/** the superbot window, already merged; the task is split into steps, each tagged with the model it routed to */
export function steps({ mode = 'list', task, list, caps, summary }) {
  const { root, cam, over } = shell();
  const sb = sbFull(cam);
  const B = sb.body;
  const bodyTop = SBW.y + SBW.bar; // abs y of body top
  const COLX = CMP.x, COLW = CMP.w;
  const bubble = put(B, 'div', 'ubub', esc(task));
  bubble.style.right = `${SBW.w - (COLX + COLW)}px`; bubble.style.top = '26px';
  const head = put(B, 'div', 'ahead');
  box(head, COLX, 104, COLW);
  const hm = mascot(30); head.appendChild(hm.el);
  head.insertAdjacentHTML('beforeend', `<span>Splitting this into <b>${list.length} steps</b>. Each one goes to the model that fits it.</span>`);
  const typeEnd = 0.25 + task.length / 44;
  const tSend = typeEnd + 0.15;
  const t1 = tSend + 0.75; // first step
  const STEP = mode === 'pipeline' ? 0.95 : 0.9;
  const rows = list.map((s, i) => {
    const M = MODELS[s.m];
    if (mode === 'pipeline') {
      const CWD = 248, GAPX = 20, X0 = (SBW.w - (list.length * CWD + (list.length - 1) * GAPX)) / 2;
      const c = put(B, 'div', 'pnode');
      box(c, X0 + i * (CWD + GAPX), 176, CWD, 262);
      c.innerHTML = `<div class="pn-n">0${i + 1}</div><div class="pn-t">${esc(s.t)}</div><div class="pn-st"><span class="spin"></span><span class="ok">${ICON.check}</span></div>`;
      const chip = put(c, 'div', 'pn-m');
      chip.appendChild(tile(M.logo, 40));
      chip.insertAdjacentHTML('beforeend', `<b>${esc(M.name)}</b><i>via ${esc(M.plan)}</i>`);
      if (i < list.length - 1) { const ln = put(B, 'div', 'pn-link'); box(ln, X0 + i * (CWD + GAPX) + CWD, 176 + 131, GAPX); c.link = ln; }
      return { el: c, chip, spin: c.querySelector('.spin'), ok: c.querySelector('.ok'), cx: SBW.x + X0 + i * (CWD + GAPX) + CWD / 2, cy: bodyTop + 176 + 131 };
    }
    const r = put(B, 'div', 'srow');
    box(r, COLX, 160 + i * 74, COLW, 66);
    r.innerHTML = `<span class="sr-st"><span class="spin"></span><span class="ok">${ICON.check}</span></span><span class="sr-n">${i + 1}</span><span class="sr-t">${esc(s.t)}</span><span class="sr-gap"></span><span class="sr-to">routed to</span>`;
    const chip = modelChip(s.m, { plan: true, size: 30, cls: 'sr-chip' });
    r.appendChild(chip);
    return { el: r, chip, spin: r.querySelector('.spin'), ok: r.querySelector('.ok'), to: r.querySelector('.sr-to'), cx: W / 2, cy: bodyTop + 160 + i * 74 + 33 };
  });
  const sum = put(B, 'div', 'ssum');
  box(sum, COLX, mode === 'pipeline' ? 470 : 540, COLW);
  sum.innerHTML = `<span class="ssum-ok">${ICON.check}</span><span>${summary}</span>`;
  const tSum = t1 + list.length * STEP + 0.15;
  const dur = tSum + 2.4;
  const cap1 = caption(over, [{ text: caps[0] }], { size: 52, y: 70 });
  const cap2 = caption(over, [{ text: caps[1] }], { size: 52, y: 70 });
  const keys = [[0, { x: W / 2, y: WIN_Y, s: 1 }]];
  rows.forEach((r, i) => keys.push([t1 + i * STEP - 0.1, mode === 'pipeline' ? { x: r.cx, y: r.cy - 60, s: 1.32 } : { x: W / 2, y: r.cy - 60, s: 1.2 }]));
  keys.push([tSum - 0.1, { x: W / 2, y: WIN_Y, s: 1, preset: PRESETS.heavy }]);
  const cam1 = camera(keys);
  const cues = [{ t: 0.25, type: 'tick', gain: 0.25 }, { t: tSend, type: 'click', gain: 0.7 }];
  list.forEach((s, i) => { const a = t1 + i * STEP; cues.push({ t: a, type: 'tick', gain: 0.4 }, { t: a + 0.3, type: 'pop', gain: 0.6 }, { t: a + 0.72, type: 'click', gain: 0.4 }); });
  cues.push({ t: tSum, type: 'thump', gain: 0.8 });

  function render(t) {
    applyCam(cam, cam1(t));
    sb.mascot.render(t); hm.render(t); sb.em.render(t);
    const ke = ease.inCubic(seg(t, tSend - 0.1, tSend + 0.15));
    pose(sb.empty, { y: -ke * 30, s: 1 - 0.04 * ke, o: 1 - ke });
    sb.comp.render(t, { text: t < tSend ? typed(task, t, 0.25, 44) : '', press: seg(t, tSend, tSend + 0.22) });
    const kb = sp(t, tSend + 0.05, PRESETS.snappy);
    pose(bubble, { y: (1 - kb) * 40, s: 0.96 + 0.04 * kb, o: seg(t, tSend + 0.05, tSend + 0.2) });
    const kh = sp(t, tSend + 0.4, PRESETS.default);
    pose(head, { y: (1 - kh) * 18, o: seg(t, tSend + 0.4, tSend + 0.6) });
    rows.forEach((r, i) => {
      const a = t1 + i * STEP;
      const k = sp(t, a, PRESETS.snappy);
      pose(r.el, { y: (1 - k) * 22, o: seg(t, a, a + 0.15) });
      const kc = sp(t, a + 0.3, PRESETS.playful);
      pose(r.chip, { s: 0.6 + 0.4 * kc, o: seg(t, a + 0.3, a + 0.4) });
      if (r.to) fade(r.to, seg(t, a + 0.25, a + 0.4));
      r.chip.classList.toggle('hot', t > a + 0.3 && t < a + 0.95);
      r.spin.style.transform = `rotate(${((t - a) * 420) % 360}deg)`;
      fade(r.spin, seg(t, a, a + 0.1) * (1 - seg(t, a + 0.68, a + 0.76)));
      const ko = sp(t, a + 0.72, PRESETS.playful);
      pose(r.ok, { s: 0.3 + 0.7 * ko, o: seg(t, a + 0.72, a + 0.8) });
      r.el.classList.toggle('done', t > a + 0.72);
      r.el.classList.toggle('live', t > a && t < a + 0.72);
      if (r.el.link) r.el.link.style.setProperty('--p', ez(t, a + 0.72, a + 0.72 + STEP * 0.6, ease.inOutCubic).toFixed(3));
    });
    const ks = sp(t, tSum, PRESETS.snappy);
    pose(sum, { y: (1 - ks) * 16, o: seg(t, tSum, tSum + 0.15) });
    cap1.render(t, t1 - 0.2, tSum - 0.3);
    cap2.render(t, tSum + 0.05);
  }
  return { dur, root, render, cues };
}

/** C: inside the merged window, every plan you pay for collapses into one key (with the drop-in base_url) */
export function settingsKey({ caps, plans }) {
  const { root, cam, over } = shell();
  const sb = sbFull(cam);
  const scrim = put(sb.body, 'div', 'scrim');
  const SW = 860, SX = (SBW.w - SW) / 2;
  const sheet = put(sb.body, 'div', 'sheet');
  box(sheet, SX, 34, SW, 690);
  sheet.innerHTML = '<div class="sh-h">Connected plans <span class="sh-sub">Settings · Account</span></div>';
  const shH = sheet.querySelector('.sh-h');
  const rows = plans.map((p, i) => {
    const r = put(sheet, 'div', 'sh-row');
    box(r, 28, 84 + i * 68, SW - 56, 58);
    r.appendChild(tile(p.logo, 38));
    r.insertAdjacentHTML('beforeend', `<b>${esc(p.name)}</b><span class="sh-gap"></span><span class="sh-on"><i class="dot"></i>Connected</span>`);
    return r;
  });
  const kf = put(sheet, 'div', 'sh-key');
  const KY = 84 + plans.length * 68 + 20;
  box(kf, 28, KY, SW - 56, 112);
  kf.innerHTML = '<div class="k-label">SUPERBOT_API_KEY</div><div class="k-val"></div><div class="k-dock"></div>';
  const kval = kf.querySelector('.k-val'), dock = kf.querySelector('.k-dock');
  const chips = plans.map((p) => { const s = put(dock, 'span', 'k-slot'); const t = tile(p.logo, 40); s.appendChild(t); return t; });
  const bu = put(sheet, 'div', 'sh-url');
  box(bu, 28, KY + 128, SW - 56, 60);
  bu.innerHTML = '<span class="mut">base_url</span><span class="sh-urlv"></span><span class="sh-drop">drop-in</span>';
  const urlv = bu.querySelector('.sh-urlv');
  const KEY = 'sbc_live_••••••••••••••••7f3a', URL = 'https://beta.superbot.gg/v1';
  const dep = (i) => 1.5 + i * 0.32, FL = 0.5;
  const land = (i) => dep(i) + FL;
  const tUrl = land(plans.length - 1) + 0.3;
  const dur = tUrl + 2.6;
  const cap1 = caption(over, [{ text: caps[0] }], { size: 52, y: 70 });
  const cap2 = caption(over, [{ text: caps[1] }], { size: 52, y: 70 });
  const sheetAbsY = SBW.y + SBW.bar + 34;
  const cam1 = camera([[0, { x: W / 2, y: WIN_Y, s: 1 }], [1.2, { y: sheetAbsY + KY + 40, s: 1.18, preset: PRESETS.heavy }], [tUrl - 0.2, { y: sheetAbsY + KY + 110, s: 1.3 }]]);
  const cues = [{ t: 0.1, type: 'whoosh', gain: 0.4 }];
  plans.forEach((p, i) => cues.push({ t: land(i), type: 'pop', gain: 0.6 }));
  cues.push({ t: tUrl, type: 'tick', gain: 0.4 }, { t: tUrl + 0.9, type: 'click', gain: 0.6 });

  function render(t) {
    applyCam(cam, cam1(t));
    sb.mascot.render(t); sb.em.render(t); sb.comp.render(t, {});
    fade(scrim, seg(t, 0, 0.3));
    const k = sp(t, 0.05, PRESETS.default);
    pose(sheet, { y: (1 - k) * 60, s: 0.97 + 0.03 * k, o: seg(t, 0.05, 0.25) });
    let landed = 0;
    rows.forEach((r, i) => {
      const a = 0.3 + i * 0.07;
      const ki = sp(t, a, PRESETS.snappy);
      const f = ez(t, dep(i), land(i), ease.inOutCubic);
      const ty = KY + 26 - (84 + i * 68);
      pose(r, { y: (1 - ki) * 14 + f * ty, s: 1 - 0.35 * f, o: seg(t, a, a + 0.15) * (1 - seg(t, land(i) - 0.12, land(i))) });
      if (t >= land(i)) landed++;
      const kc = sp(t, land(i), PRESETS.playful);
      pose(chips[i], { s: 0.4 + 0.6 * kc, o: seg(t, land(i) - 0.04, land(i) + 0.06) });
    });
    const n = Math.round(KEY.length * seg(t, land(0), land(plans.length - 1) + 0.15));
    const v = KEY.slice(0, n);
    if (kval.textContent !== v) kval.textContent = v;
    const u = typed(URL, t, tUrl, 46);
    if (urlv.textContent !== u) urlv.textContent = u;
    const kd = sp(t, tUrl + 0.7, PRESETS.playful);
    pose(bu.querySelector('.sh-drop'), { s: 0.5 + 0.5 * kd, o: seg(t, tUrl + 0.7, tUrl + 0.8) });
    // the sheet closes from the top as its rows leave, so no empty panel is left behind
    const shrink = rows.reduce((acc, r, i) => acc + 68 * ez(t, dep(i) + 0.1, land(i) + 0.15, ease.inOutCubic), 0);
    sheet.style.clipPath = `inset(${shrink.toFixed(1)}px 0 0 0 round 26px)`;
    shH.style.transform = `translateY(${shrink.toFixed(1)}px)`;
    const bump = rows.reduce((acc, r, i) => { const x = t - land(i); return acc + (x > 0 ? Math.exp(-x * 10) * Math.sin(x * 28) : 0); }, 0);
    kf.style.transform = `scale(${(1 + 0.012 * bump).toFixed(4)})`;
    cap1.render(t, 0.2, tUrl - 0.3);
    cap2.render(t, tUrl - 0.05);
  }
  return { dur, root, render, cues };
}
