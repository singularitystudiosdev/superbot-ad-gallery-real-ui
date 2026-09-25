// scene 'browser': the frontend superbot just built, opened in the user's own Chrome on a macOS desktop.
//
// The Chrome window is drawn at a design width (1440 px at 16:9, less on narrower frames) and scaled so the
// viewport fills the stage. It does not appear: it grows out of the hub's build-card thumbnail
// (ctx.shared.thumb, stage px), so the viewport starts exactly on that rect and ends on the window's real
// rect while the desktop, the tab strip and the toolbar fade in from the hub's #0d0d0d.
//
// Then the site inside the viewport is scrolled, hovered and clicked exactly as cfg.scroll / cfg.hover /
// cfg.click say. render(lt) is a pure function of the scene clock: the scroll position is a function of lt,
// never accumulated; the overlay scrollbar's opacity comes from the analytic velocity of that same function,
// not from frame history; the cursor is placed on a keyframe path built from the plan. No timers, no CSS
// transitions, no CSS animations, no rAF. Call it with the same lt twice and you get the same frame.
import { clamp, lerp, seg, inOutCubic, outQuint, press, placeCursor, boxIn, path, esc } from '../lib.js';
import { makeCursor } from '../shell.js';

const A = (f) => new URL('./browser-assets/' + f, import.meta.url).href;

// ---------- the window's geometry (design px, before the frame scale) ----------
const MENU_H = 28;   // the macOS menu bar, drawn in stage px (it never scales)
const GAP_TOP = 34;  // below the menu bar
const GAP_BOT = 30;
const MX = 28;       // side margin
const TH = 80;       // chrome above the viewport: 40 px tab strip + 40 px toolbar
const MORPH = 1.0;   // seconds of the shared-element transition
const DUR_DEFAULT = 9.0;   // the browser beat's default length (cfg.dur.browser overrides)
// the viewport's design width per aspect ratio. Narrower frames get a narrower page, so the copy stays
// readable and the site still reflows inside the 720..1600 px fluid range the site contract guarantees.
const VW = { '16x9': 1440, '4x3': 1140, '1x1': 900, '4x5': 800 };

// the ordinary tabs already open in the user's Chrome, left to right. The last tab is the new one.
const TABS = [
  { t: 'Inbox (3)', host: 'mail.google.com', ic: 'google-gmail.svg' },
  { t: 'Google Calendar', host: 'calendar.google.com', ic: 'google-calendar.svg' },
  { t: 'YouTube', host: 'youtube.com', ic: 'youtube-icon.svg' },
];

let el = null;

const durOf = (cfg) => Math.max(3, (cfg && cfg.dur && cfg.dur.browser) || DUR_DEFAULT);
const clamp01 = (v) => clamp(v, 0, 1);

/** the shared-element source rect, in stage px: the hub's build-card thumbnail, else a centred 45% rect */
function thumbRect(ctx, W, H) {
  const t = ctx && ctx.shared && ctx.shared.thumb;
  if (t && t.w > 0 && t.h > 0) return { x: t.x, y: t.y, w: t.w, h: t.h };
  return { x: W * 0.275, y: H * 0.275, w: W * 0.45, h: H * 0.45 };
}

/** the window's placement for a stage width (memoized; re-derived whenever W or the ratio changes) */
function geoFor(W, arKey) {
  const key = W + '|' + arKey;
  if (el.geo && el.geo.key === key) return el.geo;
  const vw = VW[arKey] || Math.min(1500, Math.max(760, Math.round((W - MX * 2) / 1.295)));
  const k = (W - MX * 2) / vw;
  const vh = Math.max(320, Math.floor((1080 - MENU_H - GAP_TOP - GAP_BOT) / k) - TH);
  el.geo = { key, vw, vh, k, winX: MX, winY: MENU_H + GAP_TOP };
  return el.geo;
}

function urlHTML(url) {
  const s = String(url == null ? '' : url);
  const i = s.indexOf('/');
  const host = i < 0 ? s : s.slice(0, i);
  const tail = i < 0 ? '' : s.slice(i);
  return `<b>${esc(host)}</b>${esc(tail)}`;
}

const NAV = {
  back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  fwd: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  reload: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  star: '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z"/>',
  ext: '<path d="M14 4h3a2 2 0 0 1 2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 1-2 2h-3a2 2 0 1 0-4 0H7a2 2 0 0 1-2-2v-3a2 2 0 1 0 0-4V6a2 2 0 0 1 2-2h3a2 2 0 1 1 4 0Z"/>',
  kebab: '<circle cx="12" cy="5" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="2" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  apple: '<path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.8 2.3 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.8.7 1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.5-1-2.5-3.5Z"/><path d="M14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z"/>',
  wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/>',
};
const ic = (n, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" aria-hidden="true">${NAV[n]}</svg>`;

export default {
  id: 'browser',

  dur(cfg) { return durOf(cfg); },

  mount(section, ctx) {
    const cfg = ctx.cfg || {};
    const build = cfg.build || {};
    const slug = ctx.slug || (build.file ? String(build.file) : 'site');
    const tabTitle = build.tabTitle || 'Preview';
    const url = build.url || 'superbot.app';
    const favicon = (build.favicon && ctx.asset && ctx.asset(build.favicon)) || A('mark.svg');

    // the scene owns exactly ONE site root for the life of the ad: the site is mounted once, and a
    // re-mount (a new section, a new ctx.W, another "archange") moves that same root into the new
    // viewport and lets it reflow there. Two live roots would mean two live scroll positions, two
    // copies of the same page, and a browser scene that measures the wrong one.
    const prev = el;
    const kept = prev && prev.root ? prev.root : null;
    if (kept && kept.parentNode) kept.parentNode.removeChild(kept);
    if (prev && prev.section && prev.section !== section) prev.section.innerHTML = '';

    el = {
      section, cfg, slug,
      geo: null,
      scale: 1,
      tres: new Map(),     // selector -> element (hits only)
      measure: new Map(),  // per-frame cache: target selector -> measured scrollTop
      headOff: 0, headKey: '',
      warned: false, badKeys: [],
    };

    const tabs = TABS.map((t) => `<span class="bw-tab"><span class="bw-fav"><img src="${A(t.ic)}" alt=""/></span><span class="bw-tab-t">${esc(t.t)}</span><span class="bw-x">${ic('x')}</span><i class="bw-sep"></i></span>`).join('');

    section.innerHTML = `
<div class="bw-wall"></div>
<div class="bw-menu">
  <span class="bw-m-l"><span class="bw-apple">${ic('apple')}</span><b>Chrome</b><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Bookmarks</span><span>Window</span><span>Help</span></span>
  <span class="bw-m-r"><span class="bw-wifi">${ic('wifi')}</span><span class="bw-batt"><i></i></span><span class="bw-sb">${ic('search')}</span><span class="bw-clock">Mon 9:41 AM</span></span>
</div>
<div class="bw-win">
  <div class="bw-strip">
    <span class="bw-lights"><i></i><i></i><i></i></span>
    <span class="bw-tabs">${tabs}
      <span class="bw-tab on"><span class="bw-fav"><img src="${favicon}" alt="" onerror="this.onerror=null;this.src='${A('mark.svg')}'"/></span><span class="bw-tab-t">${esc(tabTitle)}</span><span class="bw-x">${ic('x')}</span></span>
    </span>
    <span class="bw-newtab">${ic('plus')}</span>
  </div>
  <div class="bw-toolbar">
    <span class="bw-tb">${ic('back')}</span>
    <span class="bw-tb dim">${ic('fwd')}</span>
    <span class="bw-tb">${ic('reload')}</span>
    <span class="bw-omni"><span class="bw-lock">${ic('lock')}</span><span class="bw-url">${urlHTML(url)}</span><span class="bw-star">${ic('star')}</span></span>
    <span class="bw-tb">${ic('ext')}</span>
    <span class="bw-tb bw-profile">S</span>
    <span class="bw-tb">${ic('kebab')}</span>
  </div>
  <div class="bw-view"></div>
  <!-- the overlay scrollbar is a sibling of the scroller, NOT a child of it: an absolutely positioned
       child of a scrolling box is laid out in the scrolled content, so it would sit at the top of the
       page and be off-screen the moment the plan scrolled (measured: top -2342 px at scroll 2164). -->
  <div class="bw-sbar"><i></i></div>
</div>`;

    el.win = section.querySelector('.bw-win');
    el.view = section.querySelector('.bw-view');
    el.strip = section.querySelector('.bw-strip');
    el.toolbar = section.querySelector('.bw-toolbar');
    el.menu = section.querySelector('.bw-menu');
    el.wall = section.querySelector('.bw-wall');
    el.sbar = section.querySelector('.bw-sbar');
    el.thumb = section.querySelector('.bw-sbar i');
    el.tabOn = section.querySelector('.bw-tab.on');
    el.cursor = makeCursor();
    section.appendChild(el.cursor);

    // ---- the site, mounted exactly ONCE, at the viewport's design width, inside the overflow:hidden
    // scroller we drive by scrollTop (so its own position:sticky works against this scrollport).
    // A re-mount re-inserts the same root here and never builds a second one: the page keeps its DOM,
    // its photos and its scroll width, and simply reflows to the new viewport width. ----
    const root = kept || document.createElement('div');
    if (!kept) {
      root.className = 'site site-' + slug;
      if (ctx.site && typeof ctx.site.default === 'function') ctx.site.default(root, { data: ctx.data, cfg: cfg });
    }
    el.view.appendChild(root);
    el.root = root;

    // ---- the plan: scroll keys, hover windows and click stops, in lt seconds ----
    const DUR = durOf(cfg);
    const PLAN = Math.max(0.001, DUR - MORPH);
    const at = (f) => MORPH + clamp(f, 0, 1) * PLAN;
    const skeys = (Array.isArray(cfg.scroll) && cfg.scroll.length ? cfg.scroll : [[0, 0], [1, 1]])
      .filter((k) => k && k.length >= 2)
      .map((k) => ({ f: clamp(Number(k[0]) || 0, 0, 1), target: k[1] }))
      .sort((a, b) => a.f - b.f);
    if (!skeys.length) skeys.push({ f: 0, target: 0 });
    const hovers = (cfg.hover || []).filter((hv) => hv && hv.length >= 3);
    const clicks = (cfg.click || []).filter((ck) => ck && ck.length >= 2);

    const stops = [];
    hovers.forEach((hv) => {
      let a = at(hv[0]), b = at(hv[1]);
      if (b < a) { const t = a; a = b; b = t; }
      stops.push({ a, b, sel: hv[2], clickAt: -1 });
    });
    clicks.forEach((ck) => {
      const t = at(ck[0]);
      stops.push({ a: Math.max(0, t - 0.42), b: t + 0.34, sel: ck[1], clickAt: t });
    });
    stops.sort((x, y) => x.a - y.a);

    el.plan = { DUR, PLAN, at, skeys, hovers, clicks, stops };
    // an f outside 0..1 is clamped, so that key never occurs as written: it is collected here and named
    // once at the beat's midpoint, never swallowed (a selector the site lacks is named the same way).
    el.badKeys = [
      ...(Array.isArray(cfg.scroll) ? cfg.scroll : []).map((k, i) => ['scroll', i, k && k[0]]),
      ...(cfg.hover || []).flatMap((k, i) => [['hover', i, k && k[0]], ['hover', i, k && k[1]]]),
      ...(cfg.click || []).map((k, i) => ['click', i, k && k[0]]),
    ].filter(([, , f]) => !(typeof f === 'number' && isFinite(f) && f >= 0 && f <= 1));
    el.hoverSels = [];
    el.clickSels = [];
    const seenH = new Set(), seenC = new Set();
    hovers.forEach((hv) => { if (!seenH.has(hv[2])) { seenH.add(hv[2]); el.hoverSels.push(hv[2]); } });
    clicks.forEach((ck) => { if (!seenC.has(ck[1])) { seenC.add(ck[1]); el.clickSels.push(ck[1]); } });
  },

  render(lt, ctx) {
    if (!el) return;
    const cfg = ctx.cfg || {};
    const W = ctx.W || 1920;
    const H = ctx.H || 1080;
    const arKey = ctx.ar || '16x9';
    lt = Math.max(0, lt);
    const G = geoFor(W, arKey);
    const P = el.plan;
    const DUR = P.DUR;
    const m = inOutCubic(seg(lt, 0, MORPH));
    const s = (() => {
      const tr = thumbRect(ctx, W, H);
      const vx = lerp(tr.x, G.winX, m);
      const vy = lerp(tr.y, G.winY + TH * G.k, m);
      const vwid = lerp(tr.w, G.vw * G.k, m);
      const vhei = lerp(tr.h, G.vh * G.k, m);
      const k = vwid / G.vw;
      const hd = vhei / k;
      el.win.style.width = G.vw + 'px';
      el.win.style.height = (TH + hd) + 'px';
      el.win.style.transform = `translate(${vx.toFixed(2)}px,${(vy - TH * k).toFixed(2)}px) scale(${k.toFixed(5)})`;
      // the window's corners are square while it is still the hub's build-card thumbnail (hub.css clips the
      // preview with a plain overflow:hidden box, no radius) and round to Chrome's 10 design px as the window
      // lands, so the morph's first frame is the published rect corner for corner, with no rounded notches cut
      // out of the page the thumbnail was already showing.
      el.win.style.borderRadius = (10 * m).toFixed(2) + 'px';
      el.scale = k;
      return { k, hd };
    })();
    const k = s.k, hd = s.hd;

    // the desktop and the Chrome chrome fade in over the morph, out of the hub's #0d0d0d
    const cop = outQuint(seg(lt, 0, MORPH * 0.86));
    const wop = inOutCubic(seg(lt, 0.06, MORPH * 1.02));
    el.strip.style.opacity = cop.toFixed(3);
    el.toolbar.style.opacity = cop.toFixed(3);
    el.win.style.boxShadow = `0 ${(34 * cop).toFixed(1)}px ${(90 * cop).toFixed(1)}px rgba(0,0,0,${(0.55 * cop).toFixed(3)})`;
    el.menu.style.opacity = wop.toFixed(3);
    el.wall.style.opacity = wop.toFixed(3);

    // ---- the plan (f = 0 at the end of the morph) ----
    const f = clamp01((lt - MORPH) / P.PLAN);

    // ---- hover and click classes on the site's own elements (pure toggles, correct under scrubbing) ----
    // These land BEFORE the scroll plan is measured and applied. A click that expands, filters or otherwise
    // re-lays out its target (f250 chip -> re-filtered grid) changes the layout the scroll plan, the sticky
    // bar's offset and the cursor's target point are all read from; toggling first means this frame's scroll
    // and this frame's cursor point both describe the final layout of this frame, not the previous one, so
    // the press never lands on a rect the page has already left. Pure in lt/f: nothing is cached across
    // frames, so scrubbing back re-arms every stop.
    const hot = new Set();
    P.hovers.forEach((hv) => {
      const a = P.at(hv[0]), b = P.at(hv[1]);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (lt >= lo && lt < hi) { const n = resolve(hv[2]); if (n) hot.add(n); }
    });
    P.stops.forEach((st) => { if (st.clickAt >= 0 && lt >= st.a && lt < st.b) { const n = resolve(st.sel); if (n) hot.add(n); } });
    el.hoverSels.concat(el.clickSels).forEach((sel) => {
      const n = resolve(sel);
      if (n) n.classList.toggle('is-hover', hot.has(n));
    });
    P.clicks.forEach((ck) => {
      const n = resolve(ck[1]);
      if (n) n.classList.toggle('is-active', f >= clamp(Number(ck[0]) || 0, 0, 1));
    });

    const max = Math.max(0, el.view.scrollHeight - hd);

    // per-frame measurement cache, so the velocity samples share one layout pass
    el.measure.clear();
    const posOfKey = (key) => {
      const t = key.target;
      if (typeof t === 'number') return clamp(t, 0, 1) * max;
      if (typeof t !== 'string') return 0;
      const c = el.measure.get(t);
      if (c !== undefined) return c;
      const px = measureSel(t, max);
      if (px !== null) el.measure.set(t, px);
      return px === null ? 0 : px;
    };
    const scrollAt = (ff) => {
      const keys = P.skeys;
      const x = clamp01(ff);
      if (x <= keys[0].f) return posOfKey(keys[0]);
      for (let i = 1; i < keys.length; i++) {
        const a = keys[i - 1], b = keys[i];
        if (x <= b.f) return lerp(posOfKey(a), posOfKey(b), inOutCubic(seg(x, a.f, b.f)));
      }
      return posOfKey(keys[keys.length - 1]);
    };
    const sy = scrollAt(f);
    el.view.scrollTop = sy;

    // ---- the overlay scrollbar, from the analytic velocity of scrollAt (never from frame history) ----
    const hf = 0.006;
    const vel = (scrollAt(f + hf) - scrollAt(f - hf)) / (2 * hf * P.PLAN);
    const sv = clamp(Math.pow(Math.abs(vel) / 460, 0.55), 0, 1);
    const trackH = Math.max(0, hd - 6);   // the track's own box: 3 px inset above and below the page area
    const thumbH = max > 0 ? Math.max(48, (hd / el.view.scrollHeight) * trackH) : trackH;
    el.sbar.style.opacity = (sv * 0.92).toFixed(3);
    el.thumb.style.height = thumbH.toFixed(2) + 'px';
    el.thumb.style.transform = `translateY(${(max > 0 ? (sy / max) * (trackH - thumbH) : 0).toFixed(2)}px)`;

    // ---- the cursor: a keyframe path across the plan's stops, with the press dip at each click ----
    const stops = P.stops.filter((st) => resolve(st.sel));
    if (!stops.length) {
      placeCursor(el.cursor, 0, 0, 0, 0);
    } else {
      const vb = viewBox();
      // the pointer is a mouse on the page: it never leaves the Chrome window's page area. A glide point is
      // held inside that box, so a stop whose element has scrolled out of view parks the pointer on the
      // nearest edge of the page instead of out over the toolbar, the menu bar or the desktop behind them.
      const box = { x0: vb.x + 6, y0: vb.y + 6, x1: vb.x + vb.w - 6, y1: vb.y + vb.h - 6 };
      const hold = (p) => ({ x: clamp(p.x, box.x0, box.x1), y: clamp(p.y, box.y0, box.y1) });
      const ptAt = (cp, scy) => ({ x: vb.x + cp.x * vb.k, y: vb.y + (cp.y - scy) * vb.k });
      const entry = hold({ x: W * 0.74, y: H * 0.88 });
      const keys = [];
      let prev = entry;
      let pressAmt = 0;
      let firstT = 0, lastT = 0;
      stops.forEach((st, i) => {
        const arm = st.a - 0.45;                       // the glide in starts here
        if (st.geo !== G.key) { st.armed = false; st.pt = null; st.frozen = null; st.geo = G.key; }
        if (lt >= arm) {
          st.armed = true;
          // the element's page position is read every frame, never cached: a site that re-lays out mid glide
          // (a filter landing, a card revealing its footer) would otherwise leave the press a fixed distance
          // away from the thing it clicks
          const cp = contentPoint(resolve(st.sel));
          if (cp) {
            if (st.clickAt >= 0 && lt >= st.clickAt) {
              // from the press on the point is frozen where the click landed: the page scrolls under a pointer
              // that stays put, exactly as a real mouse does. It is frozen from THIS frame's applied scroll
              // (sy), not from a re-evaluation of scrollAt(clickAt): lt is quantised to 1/60 s, so the frame
              // the press lands on can be up to a frame past clickAt, and scrollAt(clickAt) would freeze the
              // pointer that many px behind a page that has already moved (measured 33 px off at 16x9). The
              // pointer is placed where the target is RENDERED this frame, so the press lands on it.
              if (!st.frozen) st.frozen = ptAt(cp, sy);
              st.pt = st.frozen;
            } else {
              // before the press it rides the element's rendered point this frame, so the press always lands on it
              st.frozen = null;
              st.pt = ptAt(cp, sy);
            }
          }
        } else if (st.armed) { st.armed = false; st.pt = null; st.frozen = null; } // a scrub back re-arms the glide
        const p = hold(st.pt || entry);
        const start = Math.max(i ? stops[i - 1].b : 0, arm);
        if (i === 0) { firstT = Math.max(0, start - 0.02); keys.push({ t: firstT, x: entry.x, y: entry.y }); }
        keys.push({ t: start, x: prev.x, y: prev.y }, { t: st.a, x: p.x, y: p.y }, { t: st.b, x: p.x, y: p.y });
        prev = p;
        lastT = st.b;
        if (st.clickAt >= 0) pressAmt = Math.max(pressAmt, press(lt, st.clickAt));
      });
      const pt = path(lt, keys);
      const vin = seg(lt, firstT, firstT + 0.3);
      const vout = 1 - seg(lt, lastT + 0.22, lastT + 0.55);
      placeCursor(el.cursor, pt.x, pt.y, pressAmt, vin * vout);
    }

    // ---- a beat the plan cannot deliver is named once, at the midpoint, never swallowed ----
    if (!el.warned && lt >= MORPH + P.PLAN * 0.5) {
      el.warned = true;
      el.badKeys.forEach(([kind, i, f]) => console.warn(`[browser] cfg.${kind}[${i}] f=${f} is outside 0..1 and is clamped, so that key never occurs as written`));
      [...new Set([...P.skeys.map((k) => k.target), ...el.hoverSels, ...el.clickSels])]
        .filter((s) => typeof s === 'string' && !resolve(s))
        .forEach((s) => console.warn(`[browser] plan selector "${s}" matches nothing inside the site: that beat will not happen`));
    }

    // ---- the site's own tiny clock-driven bits ----
    const p = clamp01(lt / DUR);
    if (ctx.site && typeof ctx.site.render === 'function') ctx.site.render(el.root, p);

    // ---- the new tab arrives already open, but its title paints in as the window lands (Chrome does) ----
    el.tabOn.style.opacity = (0.35 + 0.65 * cop).toFixed(3);
  },
};

/** the element inside the site for a selector, cached on hit (misses are retried, the site may add nodes) */
function resolve(sel) {
  if (!el || !el.root || typeof sel !== 'string') return null;
  const hit = el.tres.get(sel);
  if (hit && hit.isConnected) return hit;
  const n = el.root.querySelector(sel);
  if (n) el.tres.set(sel, n);
  else el.tres.delete(sel);
  return n;
}

/** the sticky/fixed bar's height in design px: a selector target lands just under it, never behind it */
function headOffset() {
  const key = el.view.scrollHeight + '|' + el.geo.key;
  if (el.headKey === key) return el.headOff;
  let hh = 0;
  const probe = (n) => {
    const cs = getComputedStyle(n);
    if (cs.position !== 'sticky' && cs.position !== 'fixed') return false;
    const h = n.offsetHeight;
    if (h > 0 && h < 300) { hh = h; return true; }
    return false;
  };
  outer: for (const c of el.root.children) {
    if (probe(c)) break;
    for (const g of c.children) if (probe(g)) break outer;
  }
  el.headKey = key; el.headOff = hh;
  return hh;
}

/** a node's top inside the scroller's content, in design px. offsetTop chains are layout, never scroll:
    they read the same before and after browser.js sets scrollTop, which getBoundingClientRect does not
    (a rect read in the same frame as a programmatic scroll can still report the previous scroll offset,
    and a target measured that way drifts by the frame's scroll delta). The chain always ends at the
    scroller itself, because .bw-view is the one positioned ancestor every part of the site sits in. */
function contentTop(node) {
  let y = 0, n = node;
  while (n && n !== el.view) { y += n.offsetTop; n = n.offsetParent; }
  return n === el.view ? y : null;
}

/** the node's centre in the scroller's content coords (design px), or null when it is not in the site */
function contentPoint(node) {
  let x = 0, y = 0, n = node;
  while (n && n !== el.view) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  if (n !== el.view) return null;
  return { x: x + node.offsetWidth / 2, y: y + node.offsetHeight / 2 };
}

/** the scrollTop (design px) that brings a selector's top just under the sticky bar, clamped to the range */
function measureSel(sel, max) {
  const node = resolve(sel);
  if (!node || !el.view.offsetWidth) return null; // not laid out yet (scene hidden): retry on a later frame
  const top = contentTop(node);
  if (top === null) return null;
  return clamp(top - headOffset(), 0, max);
}

/** the scroller's box in the section's coords, and the scale its design px are drawn at */
function viewBox() {
  const b = boxIn(el.view, el.section);
  const k = b.w / (el.view.offsetWidth || b.w) || 1;
  return { x: b.x, y: b.y, w: b.w, h: b.h, k };
}
