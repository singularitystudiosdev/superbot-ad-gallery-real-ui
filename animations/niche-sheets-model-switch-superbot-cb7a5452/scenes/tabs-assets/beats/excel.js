// Excel beat, the finale: superbot writes the fixes back into the user's own workbook in Excel. Its line streams and a
// superbot card lands in the chat (superbot's own styling, NOT a copy of Microsoft's sign-in or consent page):
// "Excel access for superbot", the account Priya Sandoval, and the two Microsoft Graph delegated permissions it holds,
// each in Graph's own consent display text (learn.microsoft.com/en-us/graph/permissions-reference, fetched 2026-10-03:
// Files.ReadWrite "Have full access to user files", User.Read "Sign in and read user profile"). There are no buttons
// and no pointer: a green "Access granted" row lands on its own. Then the sibling's connect-card grammar: a checklist
// card ("Signed in to Microsoft 365 as Priya Sandoval", "Opened Q3 Revenue.xlsx from OneDrive", "Wrote 37 formulas
// back to the workbook", "Recalculated the workbook") ticks in turn, with a mini window under it; the card holds and
// the window opens into a SUPERBOT FRAME (X ad policy: never a full-bleed native page): a superbot label bar above a
// framed, margined window, the thread dimmed behind. In the window, the workbook's Summary sheet as Excel for the web
// draws a grid (column letters A to F, row numbers, gridlines, the green selection border, the Name Box and the fx
// formula bar) and nothing else: no ribbon, toolbar, Share / Comments / Editing, sheet tabs, + or avatars. It lands
// with the broken totals (#REF! and the red variances); then the cascade: the selection steps B4 to B8, the formula
// bar shows each cell's rewritten formula, the B cell recalculates to its ledger value, its variance to $0 and its
// check to "Ties out". Last the selection lands on B10 (=SUM(B4:B8)), the total to $4,812,350, D10 to $0, and THE bold
// moment (the chime, window.__AD_MARKS.chime): E10 flips to "Ties out to the ledger". A small static superbot status
// card (text only) then settles inside the frame. One Excel grid, on a layer in the scene root (outside the camera),
// laid out once at a design size and scaled to the layer, so the mini window and the framed window are the same pixels
// at two sizes. No dates or times anywhere. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { fl } from './fluent-icons.js?v=cb7a5452';

const SAY = 'Writing the fixes back to Q3 Revenue.xlsx in Excel.';
const USER = 'Priya Sandoval';
// Microsoft Graph delegated permissions, DisplayText verbatim from the permissions reference: [display text, scope, icon]
export const SCOPES = [
  ['Have full access to user files', 'Files.ReadWrite', 'folder-open'],
  ['Sign in and read user profile', 'User.Read', 'person'],
];
const STEPS = [
  ['person', `Signed in to Microsoft 365 as <b>${USER}</b>`],
  ['cloud', 'Opened <b>Q3 Revenue.xlsx</b> from OneDrive'],
  ['document-edit', 'Wrote 37 formulas back to the workbook'],
  ['arrow-sync', 'Recalculated the workbook'],
];
// the Summary sheet: rows 4 to 8 and the total on row 10. [region, B before, D before, C ledger]; '#REF!' and a
// nonzero variance draw red
const REGIONS = [
  ['North America', '#REF!', '#REF!', '$1,942,600'],
  ['Europe', '$1,236,180', '-$52,270', '$1,288,450'],
  ['Asia Pacific', '#REF!', '#REF!', '$864,300'],
  ['Latin America', '$460,950', '$48,200', '$412,750'],
  ['Middle East', '$298,900', '-$5,350', '$304,250'],
];
const TOTAL = ['Total', '#REF!', '#REF!', '$4,812,350'];
const HEAD = ['Region', 'Revenue (USD)', 'Ledger', 'Variance', 'Check'];
const TITLE = 'Q3 Revenue by region';
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const NROWS = 24;                                // rows drawn (the window clips what does not fit)
// the cascade: the B cells in order, each with the formula the bar shows
const CASCADE = [4, 5, 6, 7, 8].map((r) => [r, `=SUMIFS(Sales[Revenue USD],Sales[Region],$A${r})`]).concat([[10, '=SUM(B4:B8)']]);
const STATUS = { title: 'Q3 Revenue ties out to the ledger', rows: ['37 formulas fixed', '0 errors left', 'Variance $0'] };

// the design grid (app px) per orientation: row header width, column widths A to E (F takes the rest), row height
// (the row height is fitted at layout so a whole number of rows fills the window to its bottom edge: no half row)
const GRID = { wide: { rh: 46, w: [196, 184, 170, 150, 160], h: 30 }, tall: { rh: 26, w: [115, 122, 100, 84, 100], h: 30 } };
const FBAR = 40;                                 // the formula bar's height (app px, excel.css .xl-fbar)
const APP_SCALE = { wide: 1.5, tall: 1.26 };    // framed window: the app px to frame px (4:5 cell text 15 x 1.26 = 18.9 px, the sibling 4:5 finale 14 x 1.35 = 18.9 px)
// the superbot frame the window opens into: margins and the label bar above it (frame px)
const FRAME = { wide: { pad: 64, top: 128, bar: 48 }, tall: { pad: 28, top: 108, bar: 42 } };
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the sibling's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the access card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const SCOPE_AT = 0.2;                           // the card landed to the first permission row
const SCOPE_STAGGER = 0.12;                     // one permission row to the next
const ROW_IN = 0.2;                             // a row fading up
const GRANT_AT = 0.7; /* deliberate */          // the card landed to "Access granted" (the sibling's press mark)
const LIST_AT = 0.25;                           // granted to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens into the superbot frame
const CAS_AT = 0.45; /* deliberate */           // framed (the broken totals read first) to the selection's first step
const CAS_GAPS = [0.4, 0.34, 0.3, 0.28, 0.42]; /* deliberate */ // B4 to B5 ... B8 to B10: quicker, then a beat for the total
const MOVE = 0.14;                              // the selection gliding to the next cell
const BAR_AT = 0.07;                            // the step to the Name Box and formula bar changing over (mid-glide)
const B_AT = 0.1, D_AT = 0.16, E_AT = 0.22;     // the step to B recalculating, D to $0, E to "Ties out"
const FLIP = 0.16;                              // a value giving way to the next one (out, then in)
const E_IN = 0.2;                               // the check landing
const FLASH = 0.6;                              // a recalculated B cell's soft green wash fading
const CARD2_AT = 0.75; /* deliberate */         // the chime to the status card rising
const CARD2_IN = 0.36;                          // the status card rising
const READ = 1.7; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the window's radius
// the status card (frame px): wide, at the window's lower right; tall, across the window's foot
const CARD2 = { wide: { w: 540, m: 36 }, tall: { m: 28 } };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the access card lands
    T.scope = SCOPES.map((_, i) => T.card + SCOPE_AT + i * SCOPE_STAGGER);
    T.grant = T.card + GRANT_AT;                       // "Access granted"
    T.list = T.grant + LIST_AT;                        // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // framed
    T.sel = [T.full + CAS_AT];
    CAS_GAPS.forEach((g) => T.sel.push(T.sel[T.sel.length - 1] + g));
    T.chime = T.sel[CASCADE.length - 1] + E_AT;        // E10: "Ties out to the ledger" (the chime)
    T.card2 = T.chime + CARD2_AT;                      // the status card rises
    T.settle = T.card2 + CARD2_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.chime });

    // ---- the access card in the chat (superbot's own card, no buttons) ----
    const say = x.el(`<div class="qc-say xa-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const access = x.el(`<div class="xa-card">
      <div class="xa-logos">${x.tile('superbot', 'xa-sb')}<i class="xa-dots"></i><span class="xa-xl">${fl('table')}</span></div>
      <div class="xa-title">Excel access for superbot</div>
      <div class="xa-acct">${fl('person', 'xa-ai')}<b>${esc(USER)}</b><span>Microsoft 365</span></div>
      <div class="xa-box">${SCOPES.map(([text, scope, ic]) => `<div class="xa-row">${fl(ic, 'xa-ri')}<span><b>${esc(text)}</b><code>${esc(scope)}</code></span></div>`).join('')}</div>
      <div class="xa-ok">${fl('checkmark-circle', 'xa-oki')}<b>Access granted</b></div>
    </div>`);
    const scopes = [...access.querySelectorAll('.xa-row')];
    const grant = access.querySelector('.xa-ok'), grantI = access.querySelector('.xa-oki');

    // ---- the checklist card (superbot's own, in the hub's greys) ----
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([ic, txt]) => `<div class="gk-step"><span class="gk-ic">${fl(ic)}</span><span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the superbot frame: a scrim over the thread, the label bar, the framed Excel window, the status card ----
    const scrim = x.el('<div class="xl-scrim" aria-hidden="true"></div>');
    const bar = x.el(`<div class="xl-bar" aria-hidden="true"><img class="xl-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><span>Q3 Revenue.xlsx in Excel, Summary sheet</span></div>`);
    // the cells: [row][col] = { v0 before, v1 after, cls }
    const cell = (cls, v0, v1 = null) => ({ cls, v0, v1 });
    const sheet = {};
    sheet[1] = { A: cell('xl-t xl-bold', TITLE) };
    sheet[3] = Object.fromEntries(HEAD.map((h, i) => [COLS[i], cell(`xl-t xl-bold xl-hrow${i > 0 && i < 4 ? ' xl-r' : ''}`, h)]));
    const dataRow = ([name, b, d, c], total) => ({
      A: cell(`xl-t${total ? ' xl-bold' : ''}`, name),
      B: cell(`xl-n${total ? ' xl-bold' : ''}`, b, c),
      C: cell(`xl-n${total ? ' xl-bold' : ''}`, c),
      D: cell(`xl-n${total ? ' xl-bold' : ''}`, d, '$0'),
      E: cell(`xl-t xl-chk${total ? ' xl-bold xl-fin' : ''}`, '', total ? 'Ties out to the ledger' : 'Ties out'),
    });
    REGIONS.forEach((reg, i) => { sheet[4 + i] = dataRow(reg, false); });
    sheet[10] = dataRow(TOTAL, true);
    const span = (v, extra) => `<span class="xl-v ${extra}${v === '#REF!' ? ' xl-err' : ''}">${esc(v)}</span>`;
    let gridHtml = '<span class="xl-corner"></span>' + COLS.map((c) => `<span class="xl-ch" data-c="${c}">${c}</span>`).join('');
    for (let r = 1; r <= NROWS; r++) {
      gridHtml += `<span class="xl-rhd" data-r="${r}">${r}</span>`;
      COLS.forEach((c) => {
        const o = sheet[r] && sheet[r][c];
        const top = r === 10 ? ' xl-top' : '';
        if (!o) { gridHtml += `<span class="xl-c${top}" data-k="${c}${r}"></span>`; return; }
        const red0 = o.v1 !== null && c === 'D' && o.v0 !== '#REF!' ? ' xl-red' : '';
        const finIcon = o.cls.includes('xl-fin') ? fl('checkmark-circle', 'xl-fi') : '';
        gridHtml += `<span class="xl-c ${o.cls}${top}" data-k="${c}${r}">${span(o.v0, `xl-v0${red0}`)}${o.v1 !== null ? `<span class="xl-v xl-v1">${finIcon}${esc(o.v1)}</span>` : ''}</span>`;
      });
    }
    const layer = x.el(`<div class="xl-full" aria-hidden="true"><div class="xl-app">
      <div class="xl-fbar"><span class="xl-nb">A1</span><i class="xl-fx">fx</i><span class="xl-f">${esc(TITLE)}</span></div>
      <div class="xl-gridw"><div class="xl-grid">${gridHtml}</div><i class="xl-sel"></i></div>
    </div></div>`);
    const status = x.el(`<div class="xl-card2" aria-hidden="true">
      <div class="xl-c2h"><img class="xl-sb" src="${x.sbSrc}" alt=""/><b>${esc(STATUS.title)}</b></div>
      ${STATUS.rows.map((s) => `<div class="xl-c2r">${fl('checkmark-circle')}<span>${esc(s)}</span></div>`).join('')}
    </div>`);
    x.root.append(scrim, layer, bar, status);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const grid = $('.xl-grid'), sel = $('.xl-sel'), nb = $('.xl-nb'), fx = $('.xl-f');
    const at = (key) => layer.querySelector(`[data-k="${key}"]`);
    const chs = Object.fromEntries(COLS.map((c) => [c, layer.querySelector(`.xl-ch[data-c="${c}"]`)]));
    const rhs = Object.fromEntries([...layer.querySelectorAll('.xl-rhd')].map((n) => [n.dataset.r, n]));
    // per cascade step: the B, D and E cells' before / after spans
    const pair = (n) => ({ n, v0: n.querySelector('.xl-v0'), v1: n.querySelector('.xl-v1') });
    const steps = CASCADE.map(([r]) => ({ r, B: pair(at(`B${r}`)), D: pair(at(`D${r}`)), E: pair(at(`E${r}`)) }));
    const fin = at('E10'), finIcon = fin.querySelector('.xl-fi');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', tall = false, F = null, G = GRID.wide, RH = 30, AW = 1600, AH = 900, lastSel = '', lastBar = '';

    // a cell's box in app px (the grid is laid out from constants, so nothing is measured)
    const colX = (c) => { const i = COLS.indexOf(c); let xx = G.rh; for (let j = 0; j < i; j++) xx += G.w[j]; return xx; };
    const colW = (c) => { const i = COLS.indexOf(c); return i < G.w.length ? G.w[i] : AW - G.w.reduce((a, b) => a + b, G.rh); };
    const rowY = (r) => RH * 0.85 + (r - 1) * RH; // under the column header (its height is 0.85 of a row)

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const g = `${W}x${H}`;
      if (g === geo) return;
      geo = g;
      tall = W < H;
      const f = tall ? FRAME.tall : FRAME.wide;
      F = { x: f.pad, y: f.top, w: W - 2 * f.pad, h: H - f.top - f.pad, bar: f.bar };
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(F.w / s); AH = Math.round(F.h / s);
      G = tall ? GRID.tall : GRID.wide;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('xl-narrow', tall);
      const fw = AW - G.w.reduce((a, b) => a + b, G.rh);
      grid.style.gridTemplateColumns = `${G.rh}px ${G.w.map((w) => `${w}px`).join(' ')} ${fw}px`;
      // fit the rows: n whole rows plus the header fill the space under the formula bar exactly
      const avail = AH - FBAR - 1, n = Math.min(NROWS, Math.floor(avail / G.h - 0.85));
      RH = avail / (n + 0.85);
      grid.style.gridTemplateRows = `${(RH * 0.85).toFixed(3)}px repeat(${NROWS}, ${RH.toFixed(3)}px)`;
      shot.style.aspectRatio = `${F.w} / ${F.h}`;
      card.classList.toggle('gk-tall', tall);
      access.classList.toggle('xa-tall', tall);
      status.classList.toggle('xl-c2-tall', tall);
      bar.style.left = `${F.x}px`; bar.style.width = `${F.w}px`;
      bar.style.top = `${F.y - f.bar - 14}px`; bar.style.height = `${f.bar}px`;
      lastSel = '';
    };

    // the selection at t: A1 as the window lands, then each cascade cell in turn (a short glide between)
    const selAt = (t) => {
      let from = ['A', 1], to = ['A', 1], m = 1, idx = -1;
      CASCADE.forEach(([r], i) => { if (t >= T.sel[i]) { from = to; to = ['B', r]; m = inOutCubic(seg(t, T.sel[i], T.sel[i] + MOVE)); idx = i; } });
      return { from, to, m, idx };
    };

    return {
      nodes: [say, access, card],
      marks: [[T.r, say], [T.card, access], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        access.style.opacity = ci.toFixed(3);
        access.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        scopes.forEach((row, i) => { row.style.opacity = outCubic(seg(t, T.scope[i], T.scope[i] + ROW_IN)).toFixed(3); });
        // "Access granted": the row lands green on its own (no button, no press)
        const gi = outCubic(seg(t, T.grant, T.grant + ROW_IN));
        grant.style.opacity = gi.toFixed(3);
        grant.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 6).toFixed(2)}px)`;
        grantI.style.transform = `scale(${lerp(0.5, 1, outCubic(seg(t, T.grant, T.grant + POP))).toFixed(4)})`;

        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the selection: the green border glides to each cell; the headers of the selected cell light up
        if (F) {
          const s = selAt(t);
          const bx = (c, r) => [colX(c), rowY(r), colW(c), RH];
          const [x0, y0, w0, h0] = bx(...s.from), [x1, y1, w1, h1] = bx(...s.to);
          const L = lerp(x0, x1, s.m), Tp = lerp(y0, y1, s.m), Wd = lerp(w0, w1, s.m), Ht = lerp(h0, h1, s.m);
          sel.style.transform = `translate(${(L - 1).toFixed(2)}px, ${(Tp - 1).toFixed(2)}px)`;
          sel.style.width = `${(Wd + 1).toFixed(2)}px`; sel.style.height = `${(Ht + 1).toFixed(2)}px`;
          const cur = s.m >= 0.5 ? s.to : s.from;
          const key = `${cur[0]}${cur[1]}`;
          if (key !== lastSel) {
            COLS.forEach((c) => chs[c].classList.toggle('xl-on', c === cur[0]));
            Object.entries(rhs).forEach(([r, nd]) => nd.classList.toggle('xl-on', +r === cur[1]));
            lastSel = key;
          }
          // the Name Box and the formula bar change over mid-glide
          let bi = -1;
          CASCADE.forEach((_, i) => { if (t >= T.sel[i] + BAR_AT) bi = i; });
          const bk = bi < 0 ? 'A1' : `B${CASCADE[bi][0]}`;
          if (bk !== lastBar) { nb.textContent = bk; fx.textContent = bi < 0 ? TITLE : CASCADE[bi][1]; lastBar = bk; }
        }

        // the cascade: each step's B recalculates (with a soft green wash), D goes to $0, E to "Ties out"
        steps.forEach((o, i) => {
          const s0 = T.sel[i];
          const flip = (p, a) => {
            if (p.v0) p.v0.style.opacity = (1 - outCubic(seg(t, a, a + FLIP / 2))).toFixed(3);
            p.v1.style.opacity = outCubic(seg(t, a + FLIP / 2, a + FLIP)).toFixed(3);
          };
          flip(o.B, s0 + B_AT);
          flip(o.D, s0 + D_AT);
          const e = outCubic(seg(t, s0 + E_AT, s0 + E_AT + E_IN));
          o.E.v1.style.opacity = e.toFixed(3);
          o.E.v1.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 4).toFixed(2)}px)`;
          const w = t >= s0 + B_AT ? 1 - seg(t, s0 + B_AT, s0 + B_AT + FLASH) : 0;
          o.B.n.style.backgroundColor = w > 0 ? `rgba(16,124,65,${(0.14 * w).toFixed(3)})` : '';
        });
        // the bold moment: E10's check pops as "Ties out to the ledger" lands (the chime); its text spills over F10
        const pf = seg(t, T.chime, T.chime + 0.3);
        finIcon.style.transform = pf > 0 && pf < 1 ? `scale(${(1 + 0.25 * Math.sin(Math.PI * pf)).toFixed(4)})` : '';
        fin.classList.toggle('xl-spill', t >= T.chime);

        // the status card: settles in once, then holds still (static, text only)
        const c2 = outCubic(seg(t, T.card2, T.card2 + CARD2_IN));
        status.style.opacity = c2.toFixed(3);
        status.style.transform = c2 >= 1 ? 'none' : `scale(${lerp(0.95, 1, c2).toFixed(4)})`;
      },
      // after the camera: pin the layer over the card's window, then open it into the superbot frame
      after(t) {
        if (t < T.list || !F) { layer.style.opacity = '0'; scrim.style.opacity = '0'; bar.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, F.x, g), Tp = lerp(b.y, F.y, g), Wd = lerp(b.w, F.w, g), Ht = lerp(b.h, F.h, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        const rad = lerp(6 * (b.w / Math.max(1, shot.offsetWidth)), RADIUS, g);
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the window still sits in the chat it is clipped to the thread's viewport
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        scrim.style.opacity = g.toFixed(3);
        bar.style.opacity = outCubic(seg(t, T.grow + GROW * 0.5, T.full + 0.15)).toFixed(3);
        // the status card, inside the frame with clear padding: wide, at the window's lower right; tall, across its foot
        const foot = x.root.offsetHeight - (F.y + F.h);
        if (tall) { const m = CARD2.tall.m; status.style.left = `${F.x + m}px`; status.style.width = `${F.w - 2 * m}px`; status.style.bottom = `${foot + m}px`; }
        else { const c = CARD2.wide; status.style.left = `${F.x + F.w - c.w - c.m}px`; status.style.width = `${c.w}px`; status.style.bottom = `${foot + c.m}px`; }
      },
    };
  },
};
