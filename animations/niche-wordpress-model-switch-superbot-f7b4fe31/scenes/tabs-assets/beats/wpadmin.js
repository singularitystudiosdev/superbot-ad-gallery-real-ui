// WordPress beat, the finale: superbot connects to the user's WordPress site and applies the four fixes it already
// tested on staging. WordPress core (5.6+) lets an outside app act on a site with an Application Password, and Site
// Health is exposed through core's REST routes (wp-site-health/v1), so there is no consent screen, login form or
// approve button here: a connect card lands in the chat (the superbot mark and core's dashicons-admin-site-alt3 globe
// side by side, a thin line drawing between them, the site "Kettlefern Bakery" and its domain; the WordPress W mark is
// not used anywhere, see brand/CREDITS.txt), then two rows tick green
// ("Connected with a WordPress application password", "Applying the 4 fixes tested on staging"). A mini window under
// the rows holds the site's wp-admin; the card holds and the window opens to the full frame (the base's grow
// machinery).
//
// Full frame is wp-admin's Tools > Site Health screen in core's default admin colour scheme (WordPress 7.1 "modern",
// every value measured headlessly from WordPress Playground, wpadmin.css), stripped of every control: the admin bar
// carries only the site title behind core's house glyph (dashicons-admin-home, as core's site-name item draws it in
// wp-admin; core's W menu is left out); the admin menu is static text with dashicons (16:9: full labels and
// Tools' open submenu; 4:5: core's auto-folded icon rail, as core draws it below 960 px); the header band has the
// title and core's small progress ring with its label (no Status/Info tabs); the body has "Site Health Status", core's
// intro, "2 critical issues" and "2 recommended improvements" with their rows (core labels, the category as plain
// muted text, no badge box, no chevron), and no "Passed tests" toggle and no footer links. The drain: superbot applies
// the fixes, one by one each row strikes through and slides out, its section's count ticks down (the 2 recommended
// first, then the 2 critical), the Plugins update bubble goes when the plugins row clears, the Site Health count bubble
// steps from 2 to 1 to gone with the critical rows, and core's ring advances by core's
// own formula (site-health.js recalculateProgression). The ONE bold moment: the last fix clears the last critical issue,
// the ring completes in core's green, its label flips to "Good" (the chime, window.__AD_MARKS.chime), and core's
// all-clear block (the smiley dashicon, "Great job!", "Everything is running smoothly here.", verbatim from
// src/wp-admin/site-health.php) blooms in where the lists were. The camera pushes onto the ring and the all-clear
// block, then a small superbot status card lands in the corner (hub card style, no close X). The final state holds.
//
// There is ONE wp-admin client, on a layer in the scene root (outside the camera). While the connect card sits in the
// chat the layer is pinned over the card's window; GROW interpolates it to the whole frame. The client is laid out
// once per frame size at a design size (the frame divided by APP_SCALE) and scaled to the layer. Every row and section
// height is measured once per frame size, so each collapse is a pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { oi } from './hub-icons.js?v=f7b4fe31';

const SITE = 'Kettlefern Bakery';
const DOMAIN = 'kettlefernbakery.com';
const STEPS = [
  ['key-round', 'Connected with a WordPress application password'],
  ['wrench', 'Applying the 4 fixes tested on staging'],
];
// the admin menu, core's order and dashicons (src/wp-admin/menu.php; codepoints from src/wp-includes/css/dashicons.css)
const MENU = [
  ['Dashboard', '\uf226'], null,
  ['Posts', '\uf109'], ['Media', '\uf104'], ['Pages', '\uf105'], ['Comments', '\uf101'], null,
  ['Appearance', '\uf100'], ['Plugins', '\uf106', 'bubble'], ['Users', '\uf110'], ['Tools', '\uf107', 'current'], ['Settings', '\uf108'],
];
// Tools' submenu as core lists it for a classic (child) theme; Site Health is the current page
const SUB = ['Available Tools', 'Import', 'Export', 'Site Health', 'Export Personal Data', 'Erase Personal Data'];
// the screen's strings, verbatim from core (src/wp-admin/site-health.php, src/wp-admin/includes/class-wp-site-health.php,
// src/js/_enqueues/admin/site-health.js); core's &#8217; is the typographic apostrophe
const STR = {
  h1: 'Site Health',
  status: 'Site Health Status',
  intro: 'The site health check shows information about your WordPress configuration and items that may need your attention.',
  critP: 'Critical issues are items that may have a high impact on your site’s performance or security. Resolving these issues should be prioritized.',
  recP: 'Recommended items are considered beneficial to your site, although not as important to prioritize as a critical issue. They may include improvements in areas such as security, performance, and user experience.',
  improve: 'Should be improved', good: 'Good',
  great: 'Great job!', smooth: 'Everything is running smoothly here.',
};
// the issues: [core label, core category], each with core's own severity (class-wp-site-health.php: plugin updates
// 'critical' line 405, label 407; autoloaded options over the limit 'critical' 2713, label 2714; a failed scheduled
// event 'recommended' 1698, label 1699; inactive themes on a child-theme site 'recommended' 627, label 629; categories
// Security 368 / 502, Performance 1670 / autoload). The fixes clear them in this order: the recommended ones first,
// then the critical ones, so the ring turns green on the last fix exactly as core's formula has it.
const CRIT = [
  ['You have plugins waiting to be updated', 'Security'],
  ['Autoloaded options could affect performance', 'Performance'],
];
const REC = [
  ['A scheduled event has failed', 'Performance'],
  ['You should remove inactive themes', 'Security'],
];
const FIX_ORDER = [['rec', 0], ['rec', 1], ['crit', 0], ['crit', 1]];
const FIX_PLUGINS = 2;                         // the fix that clears the plugins row (the Plugins bubble goes with it)
const GOOD_TESTS = 24; // the site's passing tests (core runs 28 here; Playground's fresh install: 22 good + 6 issues)
// core's ring value (site-health.js recalculateProgression): critical weighs 1.5, recommended 0.5
const ringVal = (crit, rec, good) => {
  const total = good + rec + crit * 1.5, failed = rec * 0.5 + crit * 1.5;
  return Math.max(0, Math.min(100, 100 - Math.ceil((failed / total) * 100)));
};
const VALS = [0, 1, 2, 3, 4].map((n) => {
  const done = FIX_ORDER.slice(0, n);
  const rec = REC.length - done.filter(([s]) => s === 'rec').length, crit = CRIT.length - done.filter(([s]) => s === 'crit').length;
  return ringVal(crit, rec, GOOD_TESTS + (4 - rec - crit));
}); // 86, 87, 89, 94, 100
const RING_C = 565.48;                         // core's stroke-dasharray (2 pi 90)
const DONE_TITLE = '4 Site Health issues fixed';
const DONE_SUB = 'Child theme patched, 3 plugins updated, tested on staging first';

const APP_SCALE = { wide: 1.3, tall: 1.1 };    // full frame: the client's px to frame px (4:5: 864 / 1.1 = 785 px, above
                                               // core's 782 px mobile break, so core's folded rail layout holds)
// timing (seconds from the reply start, or from the card where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.22;                     // one row to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.35; /* deliberate */        // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const READ_AT = 0.65; /* deliberate */          // full frame to the first fix (the screen and its issues read first)
const FIX = 0.52; /* deliberate */              // one fix to the next
const STRIKE = 0.2;                             // a row's title striking through
const OUT = 0.32;                               // ...then the row sliding out and closing up
const SEC_OUT = 0.32;                           // an emptied section closing up
const RING_IN = 0.3;                            // the ring advancing after a row has gone
const CLEAR_AT = 0.08;                          // the Good flip to the all-clear block blooming
const CLEAR_IN = 0.45;                          // the all-clear block blooming in
const PUSH_AT = 0.5; /* deliberate */           // the Good flip to the push onto the ring and the all-clear block
const PUSH_IN = 0.6; /* deliberate */           // the push, outQuint
const PUSH = { wide: 1.4, tall: 1.6 };          // the push's scale about the ring + all-clear group
const SHIFT = { wide: 0.5, tall: 0.5 };         // ...and the group travels this share of the way to the frame's centre, but
                                                // never so far that the admin bar (BAR px) comes back in at the top: it
                                                // leaves the frame whole, and the h1 above the ring stays whole
const BAR = 32;
const NOTE_AT = 0.15;                           // the push settled, then superbot's status card lands
const NOTE_IN = 0.32;
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card, eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const plural = (n, one, many) => `<span class="wp-n">${n}</span> ${n === 1 ? one : many}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect card lands
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.fix = FIX_ORDER.map((_, i) => T.full + READ_AT + i * FIX); // each fix: the strike starts
    T.gone = T.fix.map((f) => f + STRIKE + OUT);       // ...and the row has gone (the count ticks, the ring advances)
    T.zero = T.gone[FIX_ORDER.length - 1];             // the last critical row gone: Good (the chime)
    T.clear = T.zero + CLEAR_AT;
    T.push = T.zero + PUSH_AT;
    T.settle = T.push + PUSH_IN;
    T.note = T.settle + NOTE_AT;
    T.end = T.note + NOTE_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="vc-card">
      <div class="vc-top">
        <div class="vc-marks">${x.tile('superbot', 'vc-sb')}<i class="vc-line"><i></i></i><span class="vc-wp wp-di">\uf11f</span></div>
        <div class="vc-site"><b>${esc(SITE)}</b><span>${esc(DOMAIN)}</span></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="vc-step"><span class="vc-ic">${oi(ic)}</span><span class="vc-tx">${esc(txt)}</span><span class="vc-ok"><i class="vc-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const lineFill = card.querySelector('.vc-line i');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame wp-admin client ----
    const menu = MENU.map((m) => {
      if (!m) return '<li class="wp-sep"></li>';
      const [name, glyph, flag] = m;
      const cur = flag === 'current';
      const bub = flag === 'bubble' ? ' <span class="wp-bub wp-bub-pl">3</span>' : '';
      const sub = cur ? `<ul class="wp-sub">${SUB.map((s) => `<li class="${s === 'Site Health' ? 'wp-subcur' : ''}">${esc(s)}${s === 'Site Health' ? ' <span class="wp-bub wp-bub-sh">2</span>' : ''}</li>`).join('')}</ul>` : '';
      return `<li class="wp-mi${cur ? ' wp-cur' : ''}"><div class="wp-ma"><span class="wp-di wp-mg">${glyph}</span><span class="wp-mn">${esc(name)}${bub}</span></div>${sub}</li>`;
    }).join('');
    const row = ([label, cat]) => `<div class="wp-row"><div class="wp-trig"><span class="wp-title">${esc(label)}<i class="wp-strike"></i></span><span class="wp-cat">${esc(cat)}</span></div></div>`;
    const section = (key, items, one, many, p) => `<div class="wp-sec wp-sec-${key}">
        <h3 class="wp-h3">${plural(items.length, one, many)}</h3>
        <p class="wp-p">${esc(p)}</p>
        <div class="wp-acc">${items.map(row).join('')}</div>
      </div>`;
    const layer = x.el(`<div class="wp-full" aria-hidden="true"><div class="wp-app">
      <div class="wp-bar"><span class="wp-di wp-home">\uf102</span><span class="wp-site">${esc(SITE)}</span></div>
      <div class="wp-wrap">
        <aside class="wp-menu"><ul class="wp-mlist">${menu}</ul></aside>
        <main class="wp-content">
          <div class="wp-hdr">
            <div class="wp-ts"><h1 class="wp-h1">${esc(STR.h1)}</h1></div>
            <div class="wp-prog">
              <span class="wp-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="wp-track" r="90" cx="100" cy="100"/><circle class="wp-bar-c" r="90" cx="100" cy="100" stroke-dasharray="${RING_C}"/></svg></span>
              <span class="wp-pl"><span class="wp-pl-a">${esc(STR.improve)}</span><span class="wp-pl-b">${esc(STR.good)}</span></span>
            </div>
          </div>
          <div class="wp-body">
            <div class="wp-issues">
              <h2 class="wp-h2">${esc(STR.status)}</h2>
              <p class="wp-p wp-intro">${esc(STR.intro)}</p>
              ${section('crit', CRIT, 'critical issue', 'critical issues', STR.critP)}
              ${section('rec', REC, 'recommended improvement', 'recommended improvements', STR.recP)}
            </div>
            <div class="wp-clear">
              <p class="wp-icon"><span class="wp-di">\uf328</span></p>
              <p class="wp-enc">${esc(STR.great)}</p>
              <p class="wp-smooth">${esc(STR.smooth)}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
    <div class="wp-ov"><div class="wp-note">${x.OK}<span class="wp-nt"><b>${esc(DONE_TITLE)}</b><span>${esc(DONE_SUB)}</span></span></div></div></div>`);
    x.root.appendChild(layer);
    const app = layer.querySelector('.wp-app'), ov = layer.querySelector('.wp-ov'), note = layer.querySelector('.wp-note');
    const $ = (s) => layer.querySelector(s);
    const secs = { crit: $('.wp-sec-crit'), rec: $('.wp-sec-rec') };
    const h3s = { crit: secs.crit.querySelector('.wp-h3'), rec: secs.rec.querySelector('.wp-h3') };
    const rowsOf = { crit: [...secs.crit.querySelectorAll('.wp-row')], rec: [...secs.rec.querySelectorAll('.wp-row')] };
    const fixes = FIX_ORDER.map(([s, i]) => ({ s, n: rowsOf[s][i], strike: rowsOf[s][i].querySelector('.wp-strike') }));
    const issues = $('.wp-issues'), clear = $('.wp-clear');
    const bar = $('.wp-bar-c'), ringWrap = $('.wp-prog'), plA = $('.wp-pl-a'), plB = $('.wp-pl-b');
    const bubPl = $('.wp-bub-pl'), bubSh = $('.wp-bub-sh');
    const ONE = { crit: 'critical issue', rec: 'recommended improvement' }, MANY = { crit: 'critical issues', rec: 'recommended improvements' };

    let geo = '', AW = 1477, AH = 831, pushS = PUSH.wide, shiftK = SHIFT.wide;
    let L = null; // per frame size: measured heights and the push focus (design px)
    const lastCount = { crit: -1, rec: -1 };

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      ov.style.width = `${AW}px`; ov.style.height = `${AH}px`;
      app.classList.toggle('wp-folded', tall);
      ov.classList.toggle('wp-folded', tall);
      card.classList.toggle('vc-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      pushS = tall ? PUSH.tall : PUSH.wide; shiftK = tall ? SHIFT.tall : SHIFT.wide;
      // measure at rest: every row, every section, at full height
      [...fixes.map((f) => f.n), secs.crit, secs.rec].forEach((n) => { n.style.height = ''; n.style.marginTop = ''; });
      const rowH = fixes.map((f) => f.n.offsetHeight);
      const secH = { crit: secs.crit.offsetHeight, rec: secs.rec.offsetHeight };
      const secM = { crit: parseFloat(getComputedStyle(secs.crit).marginTop), rec: parseFloat(getComputedStyle(secs.rec).marginTop) };
      // the push's focus: the middle of the group from the ring's top to the all-clear block's bottom (design px)
      const ar = app.getBoundingClientRect(), kk = ar.width / AW || 1;
      const rr = ringWrap.getBoundingClientRect();
      const prevT = clear.style.transform; clear.style.transform = 'none';
      const cr = clear.getBoundingClientRect();
      clear.style.transform = prevT;
      const top = (rr.top - ar.top) / kk, bottom = (cr.bottom - ar.top) / kk;
      const content = $('.wp-content');
      const fx = content.offsetLeft + content.offsetWidth / 2;
      const fy = (top + bottom) / 2;
      L = { rowH, secH, secM, fx, fy, tall };
    };

    const ok = (t, a) => outCubic(seg(t, a, a + POP));

    return {
      nodes: [card],
      marks: [[T.card, card]],
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        lineFill.style.transform = `scaleX(${inOutCubic(seg(t, T.line, T.line + LINE)).toFixed(4)})`;
        checks.forEach((c, i) => {
          const o = ok(t, T.ok[i]);
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (!L) return;

        // the drain: each row strikes through, then slides out and closes up
        const left = { crit: CRIT.length, rec: REC.length };
        fixes.forEach((f, i) => {
          const st = inOutCubic(seg(t, T.fix[i], T.fix[i] + STRIKE));
          f.strike.style.transform = `scaleX(${st.toFixed(4)})`;
          const o = inOutCubic(seg(t, T.fix[i] + STRIKE, T.gone[i]));
          f.n.style.opacity = (1 - o).toFixed(3);
          f.n.style.transform = o > 0 ? `translateX(${(o * 18).toFixed(2)}px)` : '';
          f.n.style.height = o > 0 ? `${(L.rowH[i] * (1 - o)).toFixed(2)}px` : '';
          if (t >= T.gone[i]) left[f.s]--;
        });
        // the section counts tick as each row goes; an emptied section closes up
        ['crit', 'rec'].forEach((s) => {
          const n = left[s];
          if (n !== lastCount[s] && n > 0) h3s[s].innerHTML = plural(n, ONE[s], MANY[s]);
          lastCount[s] = n;
          const lastI = FIX_ORDER.map(([q], i) => (q === s ? i : -1)).filter((i) => i >= 0).pop();
          const p = inOutCubic(seg(t, T.gone[lastI], T.gone[lastI] + SEC_OUT));
          const rowsGone = FIX_ORDER.reduce((a, [q], i) => a + (q === s ? L.rowH[i] : 0), 0);
          const H0 = L.secH[s] - rowsGone;
          secs[s].style.height = p > 0 ? `${(H0 * (1 - p)).toFixed(2)}px` : '';
          secs[s].style.marginTop = p > 0 ? `${(L.secM[s] * (1 - p)).toFixed(2)}px` : '';
          secs[s].style.opacity = p > 0 ? (1 - p).toFixed(3) : '';
        });
        // the Plugins update bubble goes with the plugins row; the Site Health count (core counts the critical issues)
        // steps from 2 to 1 with the plugins row and goes with the last critical one
        const gp = T.gone[FIX_PLUGINS];
        const pb = 1 - outCubic(seg(t, gp - 0.05, gp + 0.15));
        bubPl.style.opacity = pb.toFixed(3);
        bubPl.style.transform = pb < 1 ? `scale(${lerp(0.4, 1, pb).toFixed(3)})` : '';
        bubPl.style.display = pb <= 0 ? 'none' : '';
        const shN = t >= gp ? '1' : '2';
        if (bubSh.textContent !== shN) bubSh.textContent = shN;
        const sb = 1 - outCubic(seg(t, T.zero - 0.05, T.zero + 0.15));
        bubSh.style.opacity = sb.toFixed(3);
        bubSh.style.display = sb <= 0 ? 'none' : '';

        // core's ring: advances after each row goes; orange and "Should be improved" until the critical issues are gone,
        // then core's green and "Good" (the bold moment)
        let v = VALS[0];
        T.gone.forEach((g, i) => { const q = i === T.gone.length - 1 ? seg(t, g - RING_IN, g) : seg(t, g, g + RING_IN); v = lerp(v, VALS[i + 1], inOutCubic(q)); });
        bar.style.strokeDashoffset = `${(((100 - v) / 100) * RING_C).toFixed(2)}px`;
        const good = t >= T.zero;
        ringWrap.classList.toggle('green', good);
        ringWrap.classList.toggle('orange', !good);
        plA.style.opacity = good ? '0' : '1';
        plB.style.opacity = good ? '1' : '0';

        // the all-clear block blooms in where the lists were
        const io = outCubic(seg(t, T.zero, T.zero + 0.25));
        issues.style.opacity = (1 - io).toFixed(3);
        const cb = outCubic(seg(t, T.clear, T.clear + CLEAR_IN));
        clear.style.opacity = cb.toFixed(3);
        clear.style.transform = cb >= 1 ? 'none' : `scale(${lerp(0.9, 1, cb).toFixed(4)})`;

        // superbot's status card in the corner
        const nb = outCubic(seg(t, T.note, T.note + NOTE_IN));
        note.style.opacity = nb.toFixed(3);
        note.style.transform = nb >= 1 ? 'none' : `translateY(${((1 - nb) * 12).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const Lx = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${Lx.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        // the push onto the ring and the all-clear block: scaled about the group's centre, which also travels part of
        // the way to the frame's centre
        const pz = g >= 1 ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        const ps = lerp(1, pushS, pz);
        const fx = L ? L.fx : 0, fy = L ? L.fy : 0;
        const dx = (AW / 2 - fx) * shiftK * pz, dy = Math.min((AH / 2 - fy) * shiftK, (fy - BAR) * pushS - fy) * pz;
        app.style.transform = pz > 0
          ? `translate(${(k0 * (fx * (1 - ps) + dx)).toFixed(2)}px, ${(k0 * (fy * (1 - ps) + dy)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})`
          : `scale(${k0.toFixed(5)})`;
        ov.style.transform = `scale(${k0.toFixed(5)})`;
        // while in the card, clip the window to the thread's visible band
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
