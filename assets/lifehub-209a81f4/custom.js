/* custom.js: "build your own command center" spots. One scene factory, driven by a config from cc-variants.js:
   type a prompt -> superbot connects the apps it needs -> skeleton panels draw in the layout the prompt asked for
   -> widgets fill (lists, big stats, bars, pipelines, countdowns, people, streaks, a week grid) -> follow-up
   prompts in the ask bar reflow the page (add, move, resize, remove, recolour) -> pull back + closing headline.
   Every frame is a pure function of t (engine.js contract). Panels are absolutely placed from grid layouts so a
   reflow interpolates rects frame by frame. */
import { h, $, $$, ease, ep, prog, spring, setStyle, setText, camera, camAt, typed, lerp, clamp, boxIn } from './lib.js';
import { makeMark, makeHeadline, makeChip, logo, ICONS, rowHTML } from './ui.js';
import { USER } from './data.js';

const CPS = 34, CPS_EDIT = 25, GAP = 16;
const AV = ['#7dd3fc', '#c4b5fd', '#fca5a5', '#86efac', '#fcd34d', '#f9a8d4', '#a5b4fc'];
const WIN = { cx: 960, cy: 540, z: 1.0 };
const FULL = { cx: 960, cy: 506, z: 0.86 };

/* ---------------- widgets: html(p), bind(el, p) -> refs, render(k, refs, p) with k = fill progress 0..1 ---------------- */
const num = (n, k) => {
  const v = n.num * k;
  return `${n.prefix || ''}${n.dec ? v.toFixed(n.dec) : Math.round(v).toLocaleString('en-US')}${n.suffix || ''}`;
};
const stagger = (k, i, n = 1.6, d = 0.16) => ease.outCubic(clamp(k * n - i * d));

const WIDGETS = {
  list: {
    html: (p) => `<div class="lh-rows">${p.items.map(rowHTML).join('')}</div>`,
    bind: (el) => ({ rows: $$(el, '.lh-row') }),
    render(k, r) { r.rows.forEach((row, i) => { const kk = stagger(k, i); setStyle(row, { o: kk, x: (1 - kk) * 14 }); }); },
  },
  stat: {
    html: (p) => `<div class="cc-stat"><div class="v"></div><div class="l">${p.label}</div>${p.delta ? `<div class="d${p.bad ? ' bad' : ''}">${p.delta}</div>` : ''}${p.spark ? `<div class="cc-spark">${p.spark.map(() => '<i></i>').join('')}</div>` : ''}</div>`,
    bind: (el) => ({ v: $(el, '.v'), bars: $$(el, '.cc-spark i') }),
    render(k, r, p) {
      setText(r.v, num(p.value, ease.outCubic(clamp(k * 1.25))));
      const mx = Math.max(...(p.spark || [1]));
      r.bars.forEach((b, i) => { const kk = stagger(k, i, 1.5, 0.05); const hh = `${((p.spark[i] / mx) * 100 * kk).toFixed(1)}%`; if (b.__h !== hh) { b.style.height = hh; b.__h = hh; } });
    },
  },
  bars: {
    html: (p) => `<div class="cc-bars"><div class="cc-bars-top"><b></b><span>${p.label}</span></div><div class="cc-bars-row">${p.values.map((v, i) => `<div class="cc-bar${v ? '' : ' zero'}"><i></i><span>${p.labels[i]}</span></div>`).join('')}</div></div>`,
    bind: (el) => ({ b: $(el, '.cc-bars-top b'), bars: $$(el, '.cc-bar i') }),
    render(k, r, p) {
      setText(r.b, num(p.total, ease.outCubic(clamp(k * 1.25))));
      const mx = Math.max(...p.values, 1);
      r.bars.forEach((b, i) => { const kk = stagger(k, i, 1.6, 0.07); const hh = `${(Math.max(p.values[i] / mx, 0.04) * 100 * kk).toFixed(1)}%`; if (b.__h !== hh) { b.style.height = hh; b.__h = hh; } });
    },
  },
  stages: {
    html: (p) => `<div class="cc-stages">${p.cols.map((c) => `<div class="cc-stage${c.hot ? ' hot' : ''}"><h4>${c.name}</h4><b></b>${(c.items || []).map((x) => `<span>${x}</span>`).join('')}</div>`).join('')}</div>`,
    bind: (el) => ({ b: $$(el, '.cc-stage b'), chips: $$(el, '.cc-stage').map((s) => $$(s, 'span')) }),
    render(k, r, p) {
      p.cols.forEach((c, i) => {
        setText(r.b[i], String(Math.round(c.n * ease.outCubic(clamp(k * 1.3)))));
        r.chips[i].forEach((ch, j) => { const kk = stagger(k, i + j, 1.7, 0.12); setStyle(ch, { o: kk, y: (1 - kk) * 8 }); });
      });
    },
  },
  countdown: {
    html: (p) => `<div class="cc-count"><div class="cc-count-top"><b></b><span>${p.unit}</span></div><div class="l">${p.label}</div><div class="cc-segs">${Array.from({ length: p.segs }, () => '<i></i>').join('')}</div><div class="n">${p.note}</div></div>`,
    bind: (el) => ({ b: $(el, '.cc-count-top b'), segs: $$(el, '.cc-segs i') }),
    render(k, r, p) {
      setText(r.b, String(Math.round(lerp(p.from ?? p.num + 6, p.num, ease.outCubic(clamp(k * 1.3))))));
      r.segs.forEach((s, i) => s.classList.toggle('on', i < p.on && k > 0.35 + i * 0.08));
    },
  },
  people: {
    html: (p) => `<div class="cc-people">${p.items.map((x, i) => `<div class="cc-person"><span class="cc-av" style="background:${AV[(i + (p.seed || 0)) % AV.length]}">${x.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span><div class="cc-person-m"><b>${x.name}</b><span>${x.meta}</span></div><span class="cc-wait${x.ok ? ' ok' : ''}">${x.wait}</span></div>`).join('')}</div>`,
    bind: (el) => ({ rows: $$(el, '.cc-person') }),
    render(k, r) { r.rows.forEach((row, i) => { const kk = stagger(k, i, 1.7, 0.15); setStyle(row, { o: kk, x: (1 - kk) * 14 }); }); },
  },
  streak: {
    html: (p) => `<div class="cc-streak"><div class="cc-streak-top"><b></b><span>${p.unit}</span></div><div class="cc-dots">${p.days.map(() => '<i></i>').join('')}</div><div class="n">${p.note}</div></div>`,
    bind: (el) => ({ b: $(el, '.cc-streak-top b'), dots: $$(el, '.cc-dots i') }),
    render(k, r, p) {
      setText(r.b, String(Math.round(p.num * ease.outCubic(clamp(k * 1.3)))));
      r.dots.forEach((d, i) => d.classList.toggle('on', !!p.days[i] && k > 0.2 + (i / p.days.length) * 0.7));
    },
  },
  week: {
    html: (p) => {
      const [h0, h1] = p.hours;
      const pct = (hr) => ((hr - h0) / (h1 - h0)) * 100;
      const marks = [];
      for (let hr = h0 + 2; hr < h1; hr += 3) marks.push(`<span style="top:${pct(hr)}%">${hr > 12 ? hr - 12 : hr}${hr >= 12 ? 'p' : 'a'}</span>`);
      return `<div class="cc-week"><div></div>${p.days.map((d) => `<div class="cc-week-h">${d}</div>`).join('')}<div class="cc-week-hours">${marks.join('')}</div>${p.days.map((_, di) => `<div class="cc-week-col">${p.blocks.filter((b) => b.d === di).map((b) => `<div class="cc-blk" data-k="${b.k}" style="top:${pct(b.s)}%;height:${pct(b.e) - pct(b.s)}%">${b.label}</div>`).join('')}</div>`).join('')}</div>`;
    },
    bind: (el) => ({ blks: $$(el, '.cc-blk') }),
    render(k, r) { r.blks.forEach((b, i) => { const kk = ease.outBack(clamp(k * 1.5 - i * 0.035)); setStyle(b, { o: clamp(kk * 1.4), s: 0.85 + 0.15 * kk }); }); },
  },
};

/* ---------------- timeline plan from config ---------------- */
function plan(cfg) {
  const T = { chips: [], tours: [], edits: [] };
  let t;
  if (!cfg.prebuilt) {
    T.typeA = 0.45; T.typeB = T.typeA + cfg.prompt.length / CPS;
    T.send = T.typeB + 0.3; T.bubble = T.send + 0.12; T.replyH = T.send + 0.45;
    const c0 = T.send + 0.7;
    cfg.connect.forEach((_, i) => T.chips.push({ a: c0 + i * 0.26, done: c0 + i * 0.26 + 0.42 }));
    const c1 = c0 + cfg.connect.length * 0.26 + 0.12;
    T.design = { a: c1, done: c1 + 0.55 };
    T.chatOut = c1 + 0.5;
    T.build = c1 + 0.7;
    T.fillA = T.build + 0.45;
    t = T.fillA + Object.keys(cfg.layouts[0].place).length * 0.12 + 0.9;
  } else {
    T.build = -10; T.fillA = -10; t = 1.1;
  }
  for (const id of cfg.tour || []) { T.tours.push({ id, a: t, b: t + 1.6 }); t += 1.6; }
  for (const e of cfg.edits || []) {
    const E = { ...e, a: t };
    E.typeA = t + 0.6; E.typeB = E.typeA + e.prompt.length / CPS_EDIT; E.send = E.typeB + 0.2;
    E.rA = E.send + 0.4; E.rB = E.rA + 0.9; t = E.rB + 0.4;
    if (e.focus) { E.fA = t; t += 1.5; E.fB = t; }
    T.edits.push(E);
  }
  T.close = t; T.dur = t + 2.7;
  return T;
}

const rectOf = (L, id, G) => {
  const pl = L.place[id];
  if (!pl) return null;
  const [c, r, w, hh] = pl;
  const cw = (G.w - (L.cols - 1) * GAP) / L.cols, ch = (G.h - (L.rows - 1) * GAP) / L.rows;
  return { x: c * (cw + GAP), y: r * (ch + GAP), w: w * cw + (w - 1) * GAP, h: hh * ch + (hh - 1) * GAP };
};

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a, b, k) => `rgb(${hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], k))).join(',')})`;

function panelEl(p) {
  const head = p.logos && p.logos.length ? p.logos.map((n) => logo(n, 26)).join('') : logo(p.icon || 'grid', 24);
  const el = h(`<section class="lh-panel" data-id="${p.id}"><header><span class="lh-panel-logos">${head}</span><h3>${p.title}</h3>${p.count ? `<span class="lh-count">${p.count}</span>` : ''}</header><div class="cc-body">${WIDGETS[p.type].html(p)}</div><div class="cc-skel"><i></i><i></i><i></i><i></i></div></section>`);
  return { el, p, body: $(el, '.cc-body'), skel: $(el, '.cc-skel'), skelBars: $$(el, '.cc-skel i'), refs: WIDGETS[p.type].bind(el, p) };
}

/* ---------------- the scene factory ---------------- */
export function makeCommandScene(cfg) {
  const T = plan(cfg);
  return {
    id: cfg.id,
    dur: T.dur,
    mount(sec) {
      const layer = h('<div class="lh-layer"></div>');
      sec.appendChild(layer);
      const conns = cfg.connect.map(([n, l]) => `<div class="lh-conn" data-conn="${n}">${logo(n, 20)}<span>${l}</span><i></i></div>`).join('');
      const centers = cfg.centers.map((c) => `<div class="cc-cc">${logo(c.icon || 'grid', 18)}<span>${c.name}</span>${c.show >= 0 ? '<em>new</em>' : ''}</div>`).join('');
      const win = h(`<div class="lh-win cc-win" style="--acc:${cfg.accent || '#5b8dff'}">
        <div class="lh-bar"><i></i><i></i><i></i><span class="lh-bar-t">superbot</span></div>
        <div class="lh-body">
          <aside class="lh-side">
            <div class="lh-brand"><span class="lh-brand-mark"></span><b>superbot</b></div>
            <div class="lh-nav">${logo('chat', 20)}<span>Chats</span></div>
            <div class="lh-side-h">Command centers</div>
            <div class="cc-side-list">${centers}</div>
            <div class="lh-side-h">Connected</div>
            ${conns}
          </aside>
          <main class="cc-main">
            <div class="cc-chat">
              <div class="cc-greet"><span class="cc-greet-mark"></span><h2>Good morning, ${USER}.</h2></div>
              <div class="cc-composer"><div class="cc-composer-t ph"></div><div class="cc-composer-row"><span class="cc-plus">+</span><span>Superbot builds it for you</span><span class="cc-model">${logo('spark', 18)}Superbot</span><span class="cc-send">${logo('arrow', 20)}</span></div></div>
              <div class="cc-thread">
                <div class="cc-bubble"></div>
                <div class="cc-reply"><div class="cc-reply-h"><span class="cc-reply-mark"></span><span>superbot</span></div></div>
              </div>
            </div>
            <div class="cc-head"><div class="cc-head-t"></div><p></p></div>
            <div class="cc-grid"></div>
            <div class="cc-ask">${logo('spark', 22)}<div class="cc-ask-t ph"></div><span class="cc-send">${logo('arrow', 20)}</span></div>
          </main>
        </div>
      </div>`);
      layer.appendChild(win);

      const marks = [makeMark(30), makeMark(58), makeMark(34)];
      $(win, '.lh-brand-mark').appendChild(marks[0].el);
      $(win, '.cc-greet-mark').appendChild(marks[1].el);
      $(win, '.cc-reply-mark').appendChild(marks[2].el);

      // titles: one h2 per distinct title so a montage edit can cross-fade them
      const titles = [cfg.title, ...(cfg.edits || []).map((e) => e.title).filter(Boolean)];
      const headT = $(win, '.cc-head-t');
      const titleEls = [...new Set(titles)].map((tt) => { const e = h(`<h2>${tt}</h2>`); headT.appendChild(e); return { tt, e }; });
      setText($(win, '.cc-head p'), cfg.sub || 'built from your prompt · Mon, Oct 5');

      // chat phase
      const reply = $(win, '.cc-reply');
      const chips = cfg.connect.map(([n, l]) => makeChip(n, `Connecting ${l}`, `${l} connected`, { size: 24 }));
      const design = makeChip('spark', 'Designing your command center', 'Command center ready', { size: 24 });
      for (const c of [...chips, design]) reply.appendChild(c.el);

      // panels: the union of every layout's ids
      const grid = $(win, '.cc-grid');
      const panels = {};
      for (const p of cfg.panels) { const P = panelEl(p); grid.appendChild(P.el); panels[p.id] = P; }

      const G = { w: grid.offsetWidth, h: grid.offsetHeight };
      const gridBox = boxIn(grid, layer);
      const comp = boxIn($(win, '.cc-composer'), layer);
      if (!cfg.prebuilt) $(win, '.cc-bubble').textContent = cfg.prompt;
      const thread = boxIn($(win, '.cc-thread'), layer);
      const ask = boxIn($(win, '.cc-ask'), layer);
      const chatC = { cx: thread.cx, cy: Math.min(thread.cy, thread.y + 330) };

      // which layout governs each moment, and when each panel first fills
      const L0 = cfg.layouts[0];
      const order0 = Object.keys(L0.place);
      const fillAt = {};
      order0.forEach((id, i) => { fillAt[id] = cfg.prebuilt ? -10 : T.fillA + i * 0.12; });
      const newWin = {};
      T.edits.forEach((E, i) => {
        const prev = cfg.layouts[i ? T.edits[i - 1].to : 0].place;
        const added = Object.keys(cfg.layouts[E.to].place).filter((id) => !prev[id]);
        for (const id of Object.keys(cfg.layouts[E.to].place)) {
          if (fillAt[id] === undefined) fillAt[id] = E.rA + 0.5;
          if ((added.includes(id) && added.length <= 2) || E.flash === id) newWin[id] = [E.rA, E.rB + 1.4];
        }
      });

      const centerOf = (id, Lidx) => { const r = rectOf(cfg.layouts[Lidx], id, G); return { cx: gridBox.x + r.x + r.w / 2, cy: gridBox.y + r.y + r.h / 2, w: r.w, h: r.h }; };
      const zoomFor = (b) => Math.min(1.9, (0.84 * 1920) / b.w, (0.78 * 1080) / b.h);
      const layoutAt = (t) => { let li = 0; for (const E of T.edits) if (t >= E.rB) li = E.to; return li; };

      // camera keys
      const keys = [];
      const go = (t, pos) => keys.push({ t, cx: pos.cx, cy: pos.cy, z: pos.z });
      const hold = (t) => { const l = keys[keys.length - 1]; if (t > l.t) keys.push({ ...l, t }); };
      if (!cfg.prebuilt) {
        go(0, { cx: comp.cx, cy: comp.cy - 30, z: 1.6 });
        go(T.typeB, { cx: comp.cx, cy: comp.cy - 20, z: 1.72 });
        go(T.send + 0.55, { ...chatC, z: 1.28 });
        hold(T.design.done - 0.15);
        go(T.build + 0.35, WIN);
      } else {
        go(0, { ...WIN, z: 1.06 }); go(1.0, WIN);
      }
      for (const tr of T.tours) {
        const c = centerOf(tr.id, layoutAt(tr.a));
        hold(tr.a); go(tr.a + 0.5, { ...c, z: zoomFor(c) }); hold(tr.b - 0.05);
      }
      for (const E of T.edits) {
        hold(E.a); go(E.a + 0.55, { cx: ask.cx - 260, cy: ask.cy - 90, z: 1.5 }); hold(E.send);
        go(E.rA + 0.15, WIN); hold(E.rB + 0.15);
        if (E.focus) { const c = centerOf(E.focus, E.to); go(E.fA + 0.5, { ...c, z: zoomFor(c) }); hold(E.fB - 0.05); }
      }
      hold(T.close); go(T.close + 0.85, FULL); go(T.dur, { ...FULL, z: 0.875 });

      const head = makeHeadline([{ a: T.close + 0.4, b: T.dur, text: cfg.headline }]);
      sec.appendChild(head.el);

      return {
        layer, win, marks, titleEls, chips, design, panels, G, keys, head,
        chat: $(win, '.cc-chat'), greet: $(win, '.cc-greet'), composer: $(win, '.cc-composer'), compT: $(win, '.cc-composer-t'),
        compSend: $(win, '.cc-composer .cc-send'), bubble: $(win, '.cc-bubble'), replyH: $(win, '.cc-reply-h'),
        headEl: $(win, '.cc-head'), grid, askEl: $(win, '.cc-ask'), askT: $(win, '.cc-ask-t'), askSend: $(win, '.cc-ask .cc-send'),
        ccs: $$(win, '.cc-cc'), connEls: $$(win, '.lh-conn'), fillAt, newWin,
      };
    },

    render(t, c) {
      const cam = camAt(c.keys, t);
      camera(c.layer, cam.cx, cam.cy, cam.z);
      c.marks.forEach((m) => m.render(t));
      const built = cfg.prebuilt ? 1 : ep(t, T.build - 0.1, T.build + 0.35);

      // chat phase
      if (!cfg.prebuilt) {
        setStyle(c.chat, { o: 1 - ep(t, T.chatOut, T.chatOut + 0.45) });
        const txt = typed(cfg.prompt, t, T.typeA, CPS);
        const caretOn = t < T.send && (t < T.typeB + 0.05 || Math.floor(t * 2.4) % 2 === 0);
        const html = txt ? `${txt}${caretOn ? '<span class="cc-caret"></span>' : ''}` : (caretOn ? '<span class="cc-caret"></span>How do you want your command center?' : 'How do you want your command center?');
        if (c.compT.__html !== html) { c.compT.innerHTML = html; c.compT.__html = html; }
        c.compT.classList.toggle('ph', !txt);
        c.compSend.classList.toggle('on', txt.length > 0);
        const ko = ep(t, T.send, T.send + 0.35);
        setStyle(c.composer, { o: 1 - ko, y: -30 * ko });
        setStyle(c.greet, { o: 1 - ko, y: -30 * ko });
        const kb = ease.outQuint(prog(t, T.bubble, T.bubble + 0.45));
        setStyle(c.bubble, { o: kb, y: (1 - kb) * 40 });
        setStyle(c.replyH, { o: ep(t, T.replyH, T.replyH + 0.3) });
        c.chips.forEach((ch, i) => {
          const a = T.chips[i];
          const ks = spring(t, a.a, { freq: 2.2, damp: 0.6 });
          setStyle(ch.el, { o: clamp(ks * 1.5), x: (1 - ks) * -30 });
          ch.set(t >= a.done, t);
        });
        const kd = spring(t, T.design.a, { freq: 2.2, damp: 0.6 });
        setStyle(c.design.el, { o: clamp(kd * 1.5), x: (1 - kd) * -30 });
        c.design.set(t >= T.design.done, t);
      } else {
        setStyle(c.chat, { o: 0 });
      }

      // sidebar: connected dots light as chips finish; the new command center slides in at build
      c.connEls.forEach((el, i) => el.classList.toggle('cc-conn-dim', !cfg.prebuilt && t < T.chips[i].done));
      let active = 0;
      cfg.centers.forEach((cc, i) => {
        const at = cc.show < 0 ? -10 : cc.show === 0 ? T.build : T.edits[cc.show - 1].rA;
        const k = cc.show < 0 ? 1 : ease.outQuint(prog(t, at, at + 0.5));
        setStyle(c.ccs[i], { o: k, x: (1 - k) * -24 });
        if (cc.show >= 0 && t >= at) active = i;
        else if (cc.show < 0 && cc.active && active === 0) active = i;
      });
      c.ccs.forEach((el, i) => el.classList.toggle('on', i === active));

      // head + ask bar
      setStyle(c.headEl, { o: built, y: (1 - built) * 16 });
      setStyle(c.askEl, { o: built });
      let title = cfg.title, acc = cfg.accent || '#5b8dff', prevAcc = acc, accK = 1;
      let askTxt = '', caret = false;
      for (const E of T.edits) {
        if (t >= E.typeA && t < E.rA) { askTxt = typed(E.prompt, t, E.typeA, CPS_EDIT); caret = t < E.typeB + 0.1 || Math.floor(t * 2.4) % 2 === 0; }
        if (E.title && t >= E.rA + 0.3) title = E.title;
        if (E.accent) { if (t >= E.rA) { prevAcc = acc; acc = E.accent; accK = ep(t, E.rA, E.rB); } }
      }
      c.titleEls.forEach(({ tt, e }) => setStyle(e, { o: tt === title ? 1 : 0 }));
      const askHtml = askTxt ? `${askTxt}${caret ? '<span class="cc-caret"></span>' : ''}` : 'Ask superbot to change anything';
      if (c.askT.__html !== askHtml) { c.askT.innerHTML = askHtml; c.askT.__html = askHtml; }
      c.askT.classList.toggle('ph', !askTxt);
      c.askSend.classList.toggle('on', !!askTxt);
      const accCss = accK >= 1 ? acc : mixHex(prevAcc, acc, accK);
      if (c.win.__acc !== accCss) { c.win.style.setProperty('--acc', accCss); c.win.__acc = accCss; }

      // panels: placement (with reflow), build-in, skeleton -> filled
      let from = 0, to = 0, kr = 1, edit = null;
      for (const E of T.edits) {
        if (t >= E.rA && t < E.rB) { from = to; to = E.to; kr = ease.inOutCubic(prog(t, E.rA, E.rB)); edit = E; break; }
        if (t >= E.rB) { from = E.to; to = E.to; }
      }
      if (!edit) from = to;
      const Lf = cfg.layouts[from], Lt = cfg.layouts[to];
      const order0 = Object.keys(cfg.layouts[0].place);
      for (const id of Object.keys(c.panels)) {
        const P = c.panels[id];
        const rf = rectOf(Lf, id, c.G), rt = rectOf(Lt, id, c.G);
        let r, o = 1, s = 1;
        if (rf && rt) r = { x: lerp(rf.x, rt.x, kr), y: lerp(rf.y, rt.y, kr), w: lerp(rf.w, rt.w, kr), h: lerp(rf.h, rt.h, kr) };
        else if (rf) { r = rf; o = 1 - ease.inCubic(clamp(kr / 0.45)); s = 1 - 0.06 * kr; }
        else if (rt) { r = rt; const ka = ease.outCubic(clamp((kr - 0.5) / 0.5)); o = ka; s = 0.92 + 0.08 * ka; }
        else { if (P.el.__vis !== 0) { P.el.style.visibility = 'hidden'; P.el.__vis = 0; } continue; }
        if (P.el.__vis !== 1) { P.el.style.visibility = 'visible'; P.el.__vis = 1; }
        const i0 = order0.indexOf(id);
        if (!cfg.prebuilt && i0 >= 0 && from === 0 && to === 0) {
          const ka = ease.outQuint(prog(t, T.build + i0 * 0.08, T.build + i0 * 0.08 + 0.55));
          o *= ka; s *= 0.95 + 0.05 * ka;
        }
        const geo = `${r.x.toFixed(1)}|${r.y.toFixed(1)}|${r.w.toFixed(1)}|${r.h.toFixed(1)}`;
        if (P.el.__geo !== geo) { Object.assign(P.el.style, { left: `${r.x.toFixed(1)}px`, top: `${r.y.toFixed(1)}px`, width: `${r.w.toFixed(1)}px`, height: `${r.h.toFixed(1)}px` }); P.el.__geo = geo; }
        setStyle(P.el, { o, s });
        const kf = prog(t, c.fillAt[id], c.fillAt[id] + 0.85);
        setStyle(P.body, { o: ease.outCubic(clamp(kf * 1.4)) });
        setStyle(P.skel, { o: 1 - ease.outCubic(clamp(kf * 2.2)) });
        if (kf < 1) { const bp = `${(((t * 0.9) % 1) * -200).toFixed(1)}% 0`; P.skelBars.forEach((b) => { if (b.__bp !== bp) { b.style.backgroundPosition = bp; b.__bp = bp; } }); }
        WIDGETS[P.p.type].render(kf, P.refs, P.p);
        const nw = c.newWin[id];
        P.el.classList.toggle('cc-new', !!nw && t >= nw[0] && t < nw[1]);
      }
      c.head.render(t);
    },
  };
}
