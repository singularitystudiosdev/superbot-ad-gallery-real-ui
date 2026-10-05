/* ui.js: DOM builders for the lifehub spots (command center window, area panels, tool chips, nudges, headline,
   kinetic bands, cursor, the live superbot mark). Builders return elements + refs; scenes animate them from t. */
import { h, $, $$, clamp, ease, prog, setStyle, setText, rand } from './lib.js';
import { AREAS, TODAY, USER } from './data.js';

export const KIT = new URL('.', import.meta.url).href;
export const logoSrc = (name) => `${KIT}brand/${name}.svg`;

export const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>',
};

/** brand logo img, or a kit icon when name is an ICONS key */
export function logo(name, size = 24) {
  if (ICONS[name]) return `<span class="lh-ico" style="width:${size}px;height:${size}px">${ICONS[name]}</span>`;
  return `<img class="lh-logo" src="${logoSrc(name)}" style="width:${size}px;height:${size}px" alt="">`;
}

/* ---------------- the live superbot mark, frozen off the wall clock (from bikeride shell.js makeMark) ---------------- */
export function makeMark(size = 64) {
  const host = document.createElement('span');
  host.className = 'lh-markhost';
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, lastT = NaN;
  return {
    el: host,
    render(t) {
      if (t === lastT) return; lastT = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { try { a.pause(); a.currentTime = Math.max(0, t) * 1000; } catch (e) { console.error(e); } }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}

/* ---------------- headline: lowercase heavy type, words rise in per line ---------------- */
/** lines: [{a, b, text}] shown over [a, b]. Returns { el, render(t) } */
export function makeHeadline(lines, { top = 64, size = 84 } = {}) {
  const el = h('<div class="lh-head"></div>');
  el.style.top = `${top}px`;
  el.style.fontSize = `${size}px`;
  const built = lines.map((ln) => {
    const line = h('<div class="lh-head-line"></div>');
    const words = ln.text.split(' ').map((w) => {
      const m = h(`<span class="lh-w"><span>${w}</span></span>`);
      line.appendChild(m);
      return m.firstElementChild;
    });
    el.appendChild(line);
    return { ...ln, line, words };
  });
  return {
    el,
    render(t) {
      for (const ln of built) {
        const on = t >= ln.a - 0.01 && t <= ln.b + 0.01;
        ln.line.style.visibility = on ? 'visible' : 'hidden';
        if (!on) continue;
        ln.words.forEach((w, i) => {
          const kin = ease.outQuint(prog(t, ln.a + i * 0.06, ln.a + i * 0.06 + 0.55));
          const kout = ease.inCubic(prog(t, ln.b - 0.32 + i * 0.03, ln.b + i * 0.03));
          const tf = `translateY(${((1 - kin) * 105 - kout * 105).toFixed(2)}%)`;
          if (w.__tf !== tf) { w.style.transform = tf; w.__tf = tf; }
        });
      }
    },
  };
}

/* ---------------- kinetic background bands (converge grammar) ---------------- */
export function makeBands(rows, { size = 200, gap = 18, top = 70, color } = {}) {
  const el = h('<div class="lh-bands"></div>');
  const built = rows.map((words, i) => {
    const row = h('<div class="lh-band"></div>');
    row.style.top = `${top + i * (size + gap)}px`;
    row.style.fontSize = `${size}px`;
    if (color) row.style.color = color;
    const txt = (words + '   ').repeat(6);
    row.textContent = txt;
    el.appendChild(row);
    return { row, dir: i % 2 ? 1 : -1, speed: 60 + rand(i + 3) * 40, off: -400 - rand(i + 9) * 600 };
  });
  return {
    el,
    render(t) {
      for (const b of built) setStyle(b.row, { x: b.off + b.dir * b.speed * t });
    },
  };
}

/* ---------------- tool chip: Connecting to X (spinner) -> Connected to X (check) ---------------- */
export function makeChip(logoName, runLabel, doneLabel = runLabel, { size = 26 } = {}) {
  const el = h(`<div class="lh-chip" style="font-size:${size}px">${logo(logoName, Math.round(size * 1.15))}<span class="lh-chip-t"></span><span class="lh-spin"></span></div>`);
  const label = $(el, '.lh-chip-t'), spin = $(el, '.lh-spin');
  return {
    el,
    /** k01: 0 running, >=1 done; spinT rotates the spinner */
    set(done, spinT) {
      setText(label, done ? doneLabel : runLabel);
      spin.classList.toggle('done', !!done);
      spin.style.transform = done ? 'none' : `rotate(${(spinT * 360 * 1.4) % 360}deg)`;
    },
  };
}

/* ---------------- nudge card ---------------- */
export function makeNudge({ area, logoName, title, body, primary, secondary, when = 'now' }) {
  const el = h(`<div class="lh-nudge">
    <div class="lh-nudge-top"><span class="lh-nudge-mark"></span><b>superbot</b><span class="lh-dot-sep"></span><span>${area}</span>${logoName ? logo(logoName, 22) : ''}<span class="lh-nudge-when">${when}</span></div>
    <div class="lh-nudge-title">${title}</div>
    <div class="lh-nudge-body">${body}</div>
    <div class="lh-nudge-acts">${primary ? `<span class="lh-btn pri">${primary}</span>` : ''}${secondary ? `<span class="lh-btn">${secondary}</span>` : ''}</div>
  </div>`);
  const mark = makeMark(30);
  $(el, '.lh-nudge-mark').appendChild(mark.el);
  return { el, mark, pri: $(el, '.lh-btn.pri'), acts: $(el, '.lh-nudge-acts') };
}

/* ---------------- task row ---------------- */
export function rowHTML(r) {
  const box = r.repeat ? `<span class="lh-box rep">${ICONS.repeat}</span>` : `<span class="lh-box">${ICONS.check}</span>`;
  const tag = r.tag ? `<span class="lh-tag${r.hot ? ' hot' : ''}">${r.tag}</span>` : (r.hot ? '<span class="lh-hot"></span>' : '');
  const blk = r.block ? ` data-block="${r.block}"` : '';
  return `<div class="lh-row${r.muted ? ' muted' : ''}"${blk}>${box}<div class="lh-row-main"><div class="lh-row-t">${r.text}</div><div class="lh-row-m">${r.meta || ''}</div></div>${tag}</div>`;
}

export function panelHTML(a) {
  const logos = a.logos.length ? a.logos.map((n) => logo(n, 26)).join('') : logo(a.icon || 'grid', 24);
  return `<section class="lh-panel" data-area="${a.key}">
    <header><span class="lh-panel-logos">${logos}</span><h3>${a.title}</h3><span class="lh-count">${a.count}</span></header>
    <div class="lh-rows">${a.rows.map(rowHTML).join('')}</div>
  </section>`;
}

/* ---------------- the command center window (the shared hero: all 7 areas on one page) ---------------- */
/** Returns { el, panels: {key: el}, rows: {key: [el]}, mark, greet, sub, side } . Window is 1680x900 at (120, 90). */
export function makeDashboard({ greeting = `Good morning, ${USER}.`, sub } = {}) {
  const subline = sub || `${TODAY} · 4 due this week · 3 people waiting · 1 application opens tomorrow`;
  const conns = [['gmail', 'Gmail'], ['gcal', 'Calendar'], ['canvas', 'Canvas'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['notion', 'Notion']];
  const el = h(`<div class="lh-win">
    <div class="lh-bar"><i></i><i></i><i></i><span class="lh-bar-t">superbot</span></div>
    <div class="lh-body">
      <aside class="lh-side">
        <div class="lh-brand"><span class="lh-brand-mark"></span><b>superbot</b></div>
        <div class="lh-nav on">${logo('grid', 20)}<span>Command center</span></div>
        <div class="lh-nav">${logo('chat', 20)}<span>Chats</span></div>
        <div class="lh-nav">${logo('bell', 20)}<span>Nudges</span><em>5</em></div>
        <div class="lh-side-h">Connected</div>
        ${conns.map(([n, l]) => `<div class="lh-conn" data-conn="${n}">${logo(n, 20)}<span>${l}</span><i></i></div>`).join('')}
      </aside>
      <main class="lh-main">
        <div class="lh-greet"><h2>${greeting}</h2><p>${subline}</p></div>
        <div class="lh-grid">${AREAS.map(panelHTML).join('')}</div>
      </main>
    </div>
  </div>`);
  const mark = makeMark(30);
  $(el, '.lh-brand-mark').appendChild(mark.el);
  const panels = {}, rows = {};
  for (const p of $$(el, '.lh-panel')) { panels[p.dataset.area] = p; rows[p.dataset.area] = $$(p, '.lh-row'); }
  return { el, panels, rows, mark, greet: $(el, '.lh-greet'), side: $(el, '.lh-side'), conns: $$(el, '.lh-conn') };
}

/** stagger panels + rows in over [t0, t0 + span]; order follows AREAS unless given */
export function revealDashboard(d, t, t0, { step = 0.12, order } = {}) {
  const keys = order || Object.keys(d.panels);
  keys.forEach((k, i) => {
    const a = t0 + i * step;
    const kp = ease.outQuint(prog(t, a, a + 0.6));
    setStyle(d.panels[k], { o: kp, y: (1 - kp) * 40, s: 0.97 + 0.03 * kp });
    d.rows[k].forEach((r, j) => {
      const kr = ease.outCubic(prog(t, a + 0.18 + j * 0.06, a + 0.6 + j * 0.06));
      setStyle(r, { o: kr, x: (1 - kr) * 16 });
    });
  });
}

/** mark a row done (check fills, text dims + strikes) with progress k */
export function setRowDone(row, k) {
  const box = $(row, '.lh-box');
  row.classList.toggle('done', k >= 0.5);
  if (box) setStyle(box, { s: k > 0 && k < 1 ? 1 + 0.25 * Math.sin(Math.PI * k) : 1 });
}

/* ---------------- cursor ---------------- */
export function makeCursor() {
  const el = h(`<div class="lh-cursor"><svg viewBox="0 0 28 28" width="44" height="44"><path d="M6 3.5v19.2l4.9-4.6 3.2 7.2 3.4-1.5-3.2-7h6.8z" fill="#fff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="lh-ripple"></span></div>`);
  const ripple = $(el, '.lh-ripple');
  return {
    el,
    /** x,y stage px; press 0..1 shrinks; rip 0..1 ripple */
    set(x, y, { o = 1, press = 0, rip = -1 } = {}) {
      setStyle(el, { x, y, o, s: 1 - 0.12 * press });
      if (rip >= 0 && rip <= 1) setStyle(ripple, { o: 1 - rip, s: 0.3 + rip * 1.6 }); else setStyle(ripple, { o: 0 });
    },
  };
}

/** a small floating card (chaos cards, task cards) */
export function makeCard({ logoName, text, meta }) {
  return h(`<div class="lh-card">${logoName ? logo(logoName, 30) : ''}<div><div class="lh-card-t">${text}</div>${meta ? `<div class="lh-card-m">${meta}</div>` : ''}</div></div>`);
}

export { clamp };
