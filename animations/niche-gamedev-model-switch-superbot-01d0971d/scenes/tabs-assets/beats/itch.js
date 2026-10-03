// itch.io beat, the finale: superbot ships the patch from the user's own itch.io account. Its line streams and an
// itch.io authorization card lands in the chat, in itch.io's own light chrome (Lato, white, the #ff2449 button with its
// #c3223e text shadow, game.css .button / .button.outline): superbot's tile and the official itch.io logo (the press
// kit's itchio-logo-textless-white.svg on itch.io's #fa5c5c app-icon red, never redrawn) joined by the dotted
// connector, the account, the two scopes it asks for under their real names and itch.io's own descriptions
// (itch.io/docs/api/oauth: profile:me "View the user's public profile (username, avatar, etc.)", profile:games "List
// the games the user is developing."), and the two buttons the docs name ("buttons to approve or deny"): Deny and
// Approve. The pointer presses Approve, and the sibling's connect-card grammar follows: a checklist card ("Connected as
// noorhaddad", "Exported Web build 1.0.4", "Pushed with butler to noorhaddad/pocket-summit:html5", "Build processed
// and live", "Devlog posted: Patch 1.0.4") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and
// the window opens (GROW).
//
// It opens to a SUPERBOT WINDOW, never to a bare full-bleed page: a framed panel with a margin on every side over the
// dimmed superbot hub, superbot's title bar on top (its mark, "superbot", the page's address with the itch.io tile),
// and inside it the itch.io game page noorhaddad.itch.io/pocket-summit as its owner sees it right after the push. The
// page's anatomy is the live itch.io game page's (fetched headlessly 2026-10-03: k-ramstack.itch.io/leaftaker, a Godot
// HTML5 game, with ninja-muffin24.itch.io/funkin; game.css?1791049261): the owner's header bar (itch.io logo, the
// "Manage:" owner tools, the green Published status), the game title, the HTML5 embed (.game_frame) with itch.io's
// own "Run game" button (.button.load_iframe_btn with its icon_play svg) over the embed's background, then the
// description, the opened "More information" table (Updated, Status, Platforms, Author, Genre, Made with, Tags: the
// live table's row labels) and the "Development log" list. Dates are plain dates, never relative ("3 days ago" is what
// itch.io would print; the spot shows no time-bound claims). itch.io's chrome colours and fonts come from its live CSS
// (Lato, bundled from static.itch.io/fonts, OFL); the page THEME is the dev's and is sampled from the Kenney art.
//
// The Run game button shows for under a second: the page settles, the pointer goes straight to it and clicks, the
// button gives way and the embed boots into the patched game (pocket-summit.js), while the camera pushes in toward
// the embed inside the window (the window itself never moves or grows past its margins). In the game the alien runs off
// a ledge, the jump is pressed 4 frames before it lands, the buffered jump fires, clears the gap, lands on the far
// ledge and takes the coin: that landing is the ONE bold moment (the chime, window.__AD_MARKS.chime). The final state
// holds (READ). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { oct, ITCH_PLAY } from './glyphs.js?v=01d0971d';
import { makeGame, LAND2 } from './pocket-summit.js?v=01d0971d';

const SAY = 'Shipping it to your itch.io page, as you.';
const USER = 'noorhaddad', AUTHOR = 'Noor Haddad';
const GAME = 'Pocket Summit', SLUG = 'pocket-summit', VER = '1.0.4';
const PAGE = `${USER}.itch.io/${SLUG}`;
const DATE = 'Oct 03, 2026';
// itch.io's OAuth scopes, names and descriptions verbatim from https://itch.io/docs/api/oauth (fetched 2026-10-03)
const SCOPES = [
  ['profile:me', "View the user's public profile (username, avatar, etc.)"],
  ['profile:games', 'List the games the user is developing.'],
];
const STEPS = [
  ['avatar', `Connected as <b>${USER}</b>`],
  ['file', `Exported Web build ${VER}`],
  ['repo-push', `Pushed with butler to <code>${USER}/${SLUG}:html5</code>`],
  ['check-circle-fill', 'Build processed and live'],
  ['comment', `Devlog posted: Patch ${VER}`],
];
// the opened "More information" table (the live page's row labels)
const INFO = [['Updated', DATE], ['Status', 'Released'], ['Platforms', 'HTML5'], ['Author', AUTHOR], ['Genre', 'Platformer'],
  ['Made with', 'Godot'], ['Tags', '2D, Pixel Art, Retro']];
const DEVLOG = [[`Patch ${VER}: no more missed jumps`, DATE], ['Patch 1.0.3: icy ledges and a new summit', 'Sep 18, 2026']];

// the window: margin around it (frame px) and the page's design px to frame px
const MARGIN = { wide: 40, tall: 22 };
const APP_SCALE = { wide: 1.2, tall: 1.0 };
const BAR = 44;                                 // superbot's title bar (design px)
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the sibling's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorization card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the card landed to the press on Approve (it reads first)
const PTR_IN = 0.3;                             // the card landed to the pointer appearing
const PTR_MOVE = 0.38;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to its framed size
const RUN_AT = 0.7; /* deliberate */            // the window open to the press on Run game (the page settles first)
const RUN_MOVE = 0.48;                          // the pointer's travel onto Run game
const LOAD = 0.3;                               // the press to the game's first frame (the embed boots)
const PUSH_AT = 0.08, PUSH = 0.6; /* deliberate */ // the press, then the camera pushes in toward the embed (outQuint)
const PUSH_FILL = { wide: 0.94, tall: 0.98 };   // the embed fills this share of the window's page area when parked
const TAKE = 0.35;                              // the coin rising and fading after the landing
const READ = 1.25; /* deliberate */             // the final state holds, readable, before the scene's fade
const RADIUS = 14;                              // the window's corner radius (frame px at full size)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const DOWN_TICK = '<svg class="svgicon icon_down_tick" role="img" height="6" width="12" viewBox="0 0 37 20" aria-hidden="true"><path d="m2.0858 0c-1.1535 0-2.0858 0.86469-2.0858 1.9331 0 0.5139 0.21354 1.0183 0.38704 1.1881l18.113 16.879 18.112-16.879c0.174-0.1696 0.388-0.674 0.388-1.1879 0-1.0684-0.932-1.9331-2.086-1.9331-0.577 0-1.111 0.23008-1.49 0.57992l-14.924 13.894-14.925-13.893c-0.3777-0.34998-0.9134-0.581-1.4902-0.581z"/></svg>';
const gameAsset = (f) => new URL('../../../game/' + f, import.meta.url).href;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorization card lands
    T.tap = T.card + TAP_AT;                           // Approve is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the window is open (framed, margins all round)
    T.run = T.full + RUN_AT;                           // Run game is pressed
    T.boot = T.run + LOAD;                             // the game's time 0
    T.push0 = T.run + PUSH_AT; T.push1 = T.push0 + PUSH;
    T.land = T.boot + LAND2;                           // the far-ledge landing and the coin (the chime)
    T.settle = T.land + TAKE;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.land });
    const itchTile = (cls = '') => `<span class="qc-tile qc-t-itch ${cls}"><img src="${x.brand('itchio-logo-textless-white.svg')}" alt=""/></span>`;

    // ---- the authorization card in the chat (itch.io's light chrome) ----
    const say = x.el(`<div class="qc-say ia-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="ia-card">
      <div class="ia-logos">${x.tile('superbot', 'ia-sb')}<i class="ia-dots"></i>${itchTile('ia-it')}</div>
      <div class="ia-title">Connect <b>superbot</b> to itch.io</div>
      <div class="ia-acct">Signed in as <b>${USER}</b></div>
      <div class="ia-box">
        ${SCOPES.map(([name, text]) => `<div class="ia-row"><code>${esc(name)}</code><span>${esc(text)}</span></div>`).join('')}
      </div>
      <div class="ia-btns"><span class="button outline ia-deny">Deny</span><span class="button ia-go">Approve</span></div>
    </div>`);
    const go = consent.querySelector('.ia-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av"></span>' : `<span class="gk-ic gk-oc">${oct(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the superbot window with the itch.io game page in it ----
    const scrim = x.el('<div class="it-scrim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="it-full" aria-hidden="true"><div class="it-app">
      <div class="it-bar">${x.tile('superbot', 'it-sb')}<b>superbot</b><span class="it-url">${itchTile('it-ut')}<span>${PAGE}</span></span></div>
      <div class="it-view"><div class="it-page">
        <div class="header_widget gray"><div class="primary_header">
          <img class="header_logo" src="${x.brand('itchio-logo-white.svg')}" alt=""/>
          <div class="owner_tools"><span class="tool_button">Edit game</span><span class="tool_button">Edit theme</span><span class="tool_button ip-wide">Analytics</span></div>
          <div class="publish_status"><span class="pub_toggle published">Published</span></div>
          <div class="user_panel"><span class="ip-av"></span><span>${USER}</span></div>
        </div></div>
        <div class="wrapper game_page_wrapper"><div class="inner_column family_lato">
          <div class="header"><h1 class="game_title">${GAME}</h1></div>
          <div class="view_game_page"><div class="html_embed_widget"><div class="game_frame game_pending">
            <div class="ps-game"></div>
            <div class="ip-dim"></div>
            <div class="iframe_placeholder"><span class="button load_iframe_btn">${ITCH_PLAY} Run game</span></div>
          </div></div>
          <div class="columns">
            <div class="left_col column">
              <div class="formatted_description user_formatted">
                <p>Climb a frozen mountain one tiny ledge at a time. ${GAME} is a short pixel platformer about jumps that feel right.</p>
                <p><strong>Patch ${VER}</strong>: a jump you press just before landing now counts, and you get a few frames of grace after running off a ledge.</p>
                <p>Arrow keys or A and D to move, Space to jump.</p>
              </div>
              <div class="more_information_toggle open">
                <div class="toggle_row"><a class="toggle_info_btn">More information${DOWN_TICK}</a></div>
                <div class="info_panel_wrapper"><div class="game_info_panel_widget"><table><tbody>
                  ${INFO.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${a === 'Updated' || a === 'Status' ? esc(b) : b.split(', ').map((v) => `<a>${esc(v)}</a>`).join(', ')}</td></tr>`).join('')}
                </tbody></table></div></div>
              </div>
              <section class="game_devlog"><h2>Development log</h2><ul>
                ${DEVLOG.map(([a, d]) => `<li><a>${esc(a)}</a><div class="post_date">${esc(d)}</div></li>`).join('')}
              </ul></section>
            </div>
            <div class="right_col column"><div class="screenshot_list"><span class="ip-shot"></span><span class="ip-shot"></span></div></div>
          </div></div>
        </div></div>
      </div></div>
      <div class="it-imgs"><img class="it-im-t" src="${gameAsset('kenney-tiles.png')}" alt=""/><img class="it-im-c" src="${gameAsset('kenney-characters.png')}" alt=""/><img class="it-im-b" src="${gameAsset('kenney-backgrounds.png')}" alt=""/></div>
    </div></div>`);
    x.root.append(scrim, layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const view = $('.it-view'), page = $('.it-page'), frame = $('.game_frame'), dim = $('.ip-dim'), runBtn = $('.load_iframe_btn'), holder = $('.iframe_placeholder');
    const imgs = { tiles: $('.it-im-t'), chars: $('.it-im-c'), bg: $('.it-im-b') };
    let game = null, shots = null;
    const ensureGame = () => {
      if (game || !imgs.tiles.complete || !imgs.chars.complete || !imgs.bg.complete || !imgs.tiles.naturalWidth) return;
      game = makeGame($('.ps-game'), imgs);
      // the page's two screenshots: the same game, two moments (mid-jump over the gap, coin taken)
      shots = [...layer.querySelectorAll('.ip-shot')].map((h, i) => { const g = makeGame(h, imgs, { hud: false }); g.draw(i ? 2.4 : 1.45); return g; });
    };

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, emb = null;
    let AW = 1600, AH = 900, VW = 1600, VH = 856;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const m = tall ? MARGIN.tall : MARGIN.wide, s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round((W - 2 * m) / s); AH = Math.round((H - 2 * m) / s);
      VW = AW; VH = AH - BAR;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('it-narrow', tall);
      shot.style.aspectRatio = `${W - 2 * m} / ${H - 2 * m}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('ia-tall', tall);
      emb = null;
    };
    // the embed's box in the page's own (untransformed) px
    const embBox = () => {
      if (emb) return emb;
      let ex = 0, ey = 0, n = frame;
      while (n && n !== page) { ex += n.offsetLeft; ey += n.offsetTop; n = n.offsetParent; }
      emb = { x: ex, y: ey, w: frame.offsetWidth, h: frame.offsetHeight };
      return emb;
    };
    // the window's open rect in the scene root's px (margins all round)
    const target = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight, m = W < H ? MARGIN.tall : MARGIN.wide;
      return { x: m, y: m, w: W - 2 * m, h: H - 2 * m };
    };

    // the pointer: in the chat, onto Approve and a press; in the window, onto Run game and a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.tap - 0.08;
        const g = x.box(go);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      const a = T.run - RUN_MOVE - 0.1;
      if (t >= a && t <= T.run + 0.5) {
        const g = x.box(runBtn);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.17, ey = g.y + g.h * 0.6; // on the icon, so the label stays readable
        const m = inOutCubic(seg(t, a, T.run - 0.08));
        const leave = outCubic(seg(t, T.run + 0.2, T.run + 0.5));
        return { x: lerp(ex + 260, ex, m) + leave * 70, y: lerp(ey + 190, ey, m) + leave * 60, p: press(t, T.run), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      return null;
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        ensureGame();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Approve: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('ia-hit', t >= T.tap);

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

        // the embed: Run game shows only once the window is open and is pressed within a second, then the game boots
        const bIn = outCubic(seg(t, T.full - 0.12, T.full + 0.08)), bOut = outCubic(seg(t, T.run + 0.04, T.run + 0.18));
        holder.style.opacity = (bIn * (1 - bOut)).toFixed(3);
        holder.style.visibility = bIn * (1 - bOut) > 0.001 ? '' : 'hidden';
        const p1 = press(t, T.run);
        runBtn.style.transform = p1 ? `scale(${(1 - 0.06 * p1).toFixed(4)})` : 'none';
        dim.style.opacity = (0.42 * (1 - outCubic(seg(t, T.run + 0.04, T.boot)))).toFixed(3);
        frame.classList.toggle('game_loaded', t >= T.run);
        frame.classList.toggle('game_pending', t < T.run);
        if (game) game.draw(t - T.boot);
      },
      // after the camera: pin the window over the card's mini window, then open it to its framed rect
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; scrim.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot), F = target();
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, F.x, g), Tp = lerp(b.y, F.y, g), Wd = lerp(b.w, F.w, g), Ht = lerp(b.h, F.h, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(8 * s, RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // the push toward the embed, inside the window (the page moves, the window does not)
        const z = outQuint(seg(t, T.push0, T.push1));
        if (z > 0) {
          const e = embBox();
          const pf = app.classList.contains('it-narrow') ? PUSH_FILL.tall : PUSH_FILL.wide;
          const P = Math.max(1, Math.min((VW * pf) / e.w, (VH * pf) / e.h));
          const ks = lerp(1, P, z);
          const tx = lerp(0, VW / 2 - P * (e.x + e.w / 2), z), ty = lerp(0, VH / 2 - P * (e.y + e.h / 2), z);
          page.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${ks.toFixed(5)})`;
        } else page.style.transform = 'none';
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        scrim.style.opacity = (0.66 * g).toFixed(3);
      },
    };
  },
};
