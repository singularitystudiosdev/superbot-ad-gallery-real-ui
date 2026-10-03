// Reddit beat, the finale: superbot sets the community up. Its line streams and a Reddit-styled authorize card lands in
// the chat ("superbot wants to connect to your Reddit account", three scopes, Decline / Allow). Allow is pressed, the
// consent folds away and the card turns into the run: "Signed in as u/sam_bakes", then five steps ticking in turn
// (created the community, banner and icon, rules and flair, AutoModerator, the welcome post), above a mini Reddit window.
// The card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the Discord fork's discord.js
// (niche-discord-model-switch-superbot-3b7e91c4). Full frame is Reddit's desktop web in dark mode (the 2024+ design),
// the new community page as its moderator sees it: top bar, left nav, banner, icon, title, Create Post / Mod Tools,
// Community highlights, the feed and the right rail (About, rules, post flair, moderators). It builds in (banner
// wipes in, icon pops, header, highlights, rail), then the one bold moment: a member's first post slides into the feed,
// the member count ticks 1 to 2, and AutoModerator's stickied comment lands under it (the chime plays here, render.mjs).
// The final state holds (READ) before the end card.
//
// There is ONE Reddit page, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The page is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it takes Reddit's narrow layout: no left nav and no
// right rail; the member count moves under the title and the rules become a compact strip under the feed.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { icon } from './rd-icons.js?v=c61f0e27';
import { FLAIRS, RULES } from './reads.js?v=c61f0e27';

const SUB = 'NorthsideSourdough';
const R = `r/${SUB}`;
const CLUB = 'Northside Sourdough Club';
const ABOUT = 'Bakes, crumb shots and starter help for the Northside Sourdough Club. Meetups every second Sunday.';
const CREATED = 'Created Oct 3, 2026';
const USER = 'sam_bakes', MEMBER = 'rye_and_shine';
const SAY = `Setting up ${R} on your Reddit account.`;
const SCOPES = [['users', 'Create and manage communities'], ['pin', 'Submit and pin posts'], ['shield', 'Edit rules, flair and AutoModerator']];
const STEPS = [`Created ${R}`, 'Banner and icon set', `${RULES.length} rules and ${FLAIRS.length} post flairs added`, 'AutoModerator on', 'Welcome post pinned'];
const HIGHLIGHTS = [
  [`Welcome to ${R}, start here`, ['Announcement', 'var(--rd-tag-brand-bg)', 'var(--rd-tag-brand)'], '1 vote', '0 comments'],
  ['Weekly starter help thread', FLAIRS.find(([f]) => f === 'Starter help'), '1 vote', '0 comments'],
];
const POST = { title: 'First bake with the club starter', flair: FLAIRS.find(([f]) => f === 'Bake') };
// exactly the text of automod.yaml's rule 3 comment (code.js), as Reddit renders it: one paragraph
export const AUTOMOD_COMMENT = 'Looks great! Rule 3: drop your recipe in the comments so the club can bake it too.';

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card / full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const ALLOW_AT = 0.5;                            // the card landing to Allow pressed
const SWAP_AT = 0.15, SWAP = 0.35;               // Allow to the consent folding away / the run opening
const SIGNED_AT = 0.2;                           // the run opening to "Signed in" checked
const CHECK_AT = 0.4;                            // the run opening to the first step checked
const CHECK_STAGGER = 0.13;                      // one step to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const POST_AT = 0.95;                            // full frame to the member's post landing (the page has built in)
const POST_IN = 0.4;                             // the post's slot opening
const TICK_AT = 0.25, TICK = 0.25;               // the post landing to the member count ticking 1 -> 2
const AUTO_AT = 0.55;                            // the post landing to AutoModerator's comment landing
const AUTO_IN = 0.45;                            // the comment's slot opening
const MARK = 1.2;                                // the comment's landing highlight fading out
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 12;                               // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const flair = ([f, bg, fg]) => `<span class="rx-flair" style="--bg: ${bg}; --fg: ${fg}">${esc(f)}</span>`;
// user avatars: an initial on a flair colour (no Snoo is redrawn); AutoModerator wears the Reddit mark itself
const AV = { [USER]: ['S', '#46D160'], [MEMBER]: ['R', '#FFB000'] };
// the page's build-in, from full frame: [selector, at, kind]
const BUILD = [
  ['.rx-banner', -0.05, 'wipe'], ['.rx-cicon', 0.2, 'pop'], ['.rx-title', 0.28, 'up'], ['.rx-hbtns', 0.32, 'up'],
  ['.rx-hl-h', 0.38, 'up'], ['.rx-hl:nth-child(1)', 0.44, 'up'], ['.rx-hl:nth-child(2)', 0.52, 'up'], ['.rx-sort', 0.58, 'up'],
  ['.rx-rail', 0.34, 'up'], ['.rx-about', 0.4, 'up'], ['.rx-rsec:nth-of-type(2)', 0.48, 'up'], ['.rx-rsec:nth-of-type(3)', 0.56, 'up'], ['.rx-rsec:nth-of-type(4)', 0.64, 'up'],
  ['.rx-strip', 0.6, 'up'],
];
const BUILD_IN = { wipe: 0.5, pop: 0.32, up: 0.3 };

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the authorize card lands, the mini window in it
    T.allow = T.card + ALLOW_AT;                      // Allow pressed
    T.swap = T.allow + SWAP_AT;                       // the consent folds away, the run opens
    T.signed = T.swap + SIGNED_AT;
    T.ok = STEPS.map((_, i) => T.swap + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                           // full frame
    T.post = T.full + POST_AT;                        // the member's first post lands
    T.tick = T.post + TICK_AT;                        // members 1 -> 2
    T.auto = T.post + AUTO_AT;                        // AutoModerator's stickied comment lands (the chime)
    T.settle = T.auto + AUTO_IN;                      // the last visible change but the highlight's fade
    T.end = Math.max(T.settle + READ, T.auto + MARK); // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const snoo = x.brand('reddit-logo.svg');
    const av = (who, cls = 'rx-av') => (who === 'AutoModerator'
      ? `<span class="${cls} rx-av-snoo"><img src="${snoo}" alt=""/></span>`
      : `<span class="${cls}" style="--c: ${AV[who][1]}">${AV[who][0]}</span>`);

    // ---- the authorize card in the chat ----
    const say = x.el(`<div class="qc-say rx-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rx-card">
      <div class="rx-fold rx-ask"><div class="rx-fold-in">
        <div class="rx-ah"><img class="rx-snoo" src="${snoo}" alt=""/><b>superbot wants to connect to your Reddit account</b></div>
        <ul class="rx-scopes">${SCOPES.map(([ic, s]) => `<li>${icon(ic, 'rx-si')}<span>${esc(s)}</span></li>`).join('')}</ul>
        <div class="rx-abtn"><span class="rx-b rx-b2">Decline</span><span class="rx-b rx-b1">Allow</span></div>
      </div></div>
      <div class="rx-fold rx-run"><div class="rx-fold-in">
        <div class="rx-step rx-signed">${av(USER, 'rx-sav')}<span class="rx-tx">Signed in as <b>u/${USER}</b></span><span class="rx-ok"><i class="rx-spin"></i>${icon('check', 'rx-ck')}</span></div>
        ${STEPS.map((s) => `<div class="rx-step"><span class="rx-tx">${esc(s)}</span><span class="rx-ok"><i class="rx-spin"></i>${icon('check', 'rx-ck')}</span></div>`).join('')}
      </div></div>
      <div class="rx-shot"></div>
    </div>`);
    const shot = card.querySelector('.rx-shot');
    const [ask, run] = [...card.querySelectorAll('.rx-fold')];
    const allow = card.querySelector('.rx-b1');
    const checks = [...card.querySelectorAll('.rx-ok')].map((n) => ({ spin: n.querySelector('.rx-spin'), ck: n.querySelector('.rx-ck') }));

    // ---- the full-frame Reddit page ----
    const counter = (cls) => `<span class="rx-cnt ${cls}"><span class="rx-cnt-in"><i>1</i><i>2</i></span></span>`;
    const layer = x.el(`<div class="rx-full" aria-hidden="true"><div class="rx-app">
      <header class="rx-top">
        <span class="rx-logo"><img src="${snoo}" alt=""/></span>
        <span class="rx-search">${icon('search')}<span>Search in ${R}</span></span>
        <span class="rx-acts"><span class="rx-create">${icon('plus')}Create</span><span class="rx-ib">${icon('bell')}</span>${av(USER, 'rx-av rx-me')}</span>
      </header>
      <div class="rx-body">
        <nav class="rx-nav">
          <a class="rx-ni">${icon('home')}Home</a><a class="rx-ni">${icon('arrow-up-right-circle')}Popular</a>
          <a class="rx-ni">${icon('compass')}Explore</a><a class="rx-ni">${icon('chart-bar')}All</a>
          <hr/><div class="rx-sec">MODERATION</div>
          <a class="rx-ni">${icon('layout-list')}Mod Queue</a><a class="rx-ni">${icon('messages')}Mod Mail</a><a class="rx-ni">${icon('shield')}r/Mod</a>
          <hr/><div class="rx-sec">COMMUNITIES</div>
          <a class="rx-ni rx-sel"><img class="rx-nicon" src="${x.img('icon.jpg')}" alt=""/>${R}<span class="rx-new">NEW</span></a>
        </nav>
        <main class="rx-main"><div class="rx-wrap">
          <div class="rx-banner"><img src="${x.img('banner.jpg')}" alt=""/></div>
          <div class="rx-head">
            <span class="rx-cicon"><img src="${x.img('icon.jpg')}" alt=""/></span>
            <div class="rx-title"><h1>${R}</h1><small><span>${counter('rx-cnt-m')} <span class="rx-mw">members</span></span><span><i class="rx-on"></i>${counter('rx-cnt-o')} online</span></small></div>
            <div class="rx-hbtns"><span class="rx-btn rx-bord">${icon('plus')}Create Post</span><span class="rx-btn rx-pri">${icon('shield')}Mod Tools</span><span class="rx-btn rx-dots">${icon('dots')}</span></div>
          </div>
          <div class="rx-cols">
            <div class="rx-feed">
              <div class="rx-hl-h">Community highlights</div>
              <div class="rx-hls">${HIGHLIGHTS.map(([ti, fl, v, c]) => `<div class="rx-hl">
                <div class="rx-hl-top">${icon('pin', 'rx-pin')}${flair(fl)}</div>
                <b>${esc(ti)}</b><small><span>${v}</span><span>${c}</span></small></div>`).join('')}</div>
              <div class="rx-sort"><span>Best${icon('chevron-down')}</span><span class="rx-view">${icon('layout-list')}${icon('chevron-down')}</span></div>
              <div class="rx-slot rx-ps"><article class="rx-post">
                <div class="rx-ph">${av(MEMBER, 'rx-av rx-pav')}<b>u/${MEMBER}</b><span class="rx-dot">•</span><time>just now</time></div>
                <div class="rx-pm"><div class="rx-ptx"><h3>${esc(POST.title)}</h3>${flair(POST.flair)}</div><span class="rx-thumb"><img src="${x.img('crumb.jpg')}" alt=""/></span></div>
                <div class="rx-pact"><span class="rx-pill rx-vote">${icon('arrow-big-up', 'rx-upv')}<b>1</b>${icon('arrow-big-down')}</span><span class="rx-pill">${icon('message-circle')}<b>1</b></span><span class="rx-pill">${icon('share-3')}<b>Share</b></span></div>
                <div class="rx-slot rx-as"><div class="rx-cmt">
                  <div class="rx-ch">${av('AutoModerator', 'rx-av rx-cav')}<b class="rx-mod">AutoModerator</b><span class="rx-modtag">${icon('shield')}MOD</span><span class="rx-dot">•</span><time>just now</time><span class="rx-pinned">${icon('pin')}Pinned</span></div>
                  <p>${esc(AUTOMOD_COMMENT)}</p>
                  <div class="rx-cact"><span>${icon('arrow-big-up')}<b>1</b>${icon('arrow-big-down')}</span><span>${icon('message-circle')}<b>Reply</b></span><span>${icon('share-3')}<b>Share</b></span></div>
                </div></div>
              </article></div>
              <div class="rx-strip"><div class="rx-rh">${R.toUpperCase()} RULES</div>
                <div class="rx-chips">${RULES.map((ru, i) => `<span class="rx-rc"><i>${i + 1}</i>${esc(ru)}</span>`).join('')}</div></div>
            </div>
            <aside class="rx-rail">
              <section class="rx-rsec rx-about"><h2>${CLUB}</h2><p>${esc(ABOUT)}</p>
                <div class="rx-meta"><span>${icon('cake')}${CREATED}</span><span>${icon('world')}Public</span></div>
                <div class="rx-stats"><span>${counter('rx-cnt-m')}<small>Members</small></span><span><span class="rx-onl"><i class="rx-on"></i>${counter('rx-cnt-o')}</span><small>Online</small></span></div></section>
              <section class="rx-rsec"><div class="rx-rh">${R.toUpperCase()} RULES</div>
                <ol>${RULES.map((ru, i) => `<li><i>${i + 1}</i>${esc(ru)}</li>`).join('')}</ol></section>
              <section class="rx-rsec"><div class="rx-rh">POST FLAIR</div><div class="rx-fls">${FLAIRS.map(flair).join('')}</div></section>
              <section class="rx-rsec"><div class="rx-rh">MODERATORS</div>
                <div class="rx-modr">${av(USER, 'rx-av rx-mav')}<b>u/${USER}</b></div><div class="rx-modr">${av('AutoModerator', 'rx-av rx-mav')}<b>AutoModerator</b></div></section>
            </aside>
          </div>
        </div></main>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const builds = BUILD.map(([sel, at, kind]) => ({ ns: [...app.querySelectorAll(sel)], at, kind }));
    const ps = app.querySelector('.rx-ps'), as = app.querySelector('.rx-as');
    const slots = [{ s: ps, c: ps.firstElementChild, at: T.post, dur: POST_IN, h: '' }, { s: as, c: as.firstElementChild, at: T.auto, dur: AUTO_IN, h: '' }];
    const cmt = app.querySelector('.rx-cmt');
    const cnts = [...app.querySelectorAll('.rx-cnt-in')];
    const mw = app.querySelector('.rx-mw');
    // the page's type is Reddit Sans (vendored, reddit.css): ask for every weight up front so a seek never measures a
    // slot in the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 16px "Reddit Sans RX"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, AW = 1536, AH = 864;
    // the page's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
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
      app.classList.toggle('rx-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('rx-tall', tall);
    };
    // a fold: its height follows its content's own height times g (0..1), its content fading with it
    const fold = (n, g) => {
      const h = n.firstElementChild.offsetHeight;
      n.style.height = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
      n.style.opacity = g.toFixed(3);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Allow: pressed (a short dip, no overshoot), then the consent folds away as the run opens
        const dip = Math.sin(Math.PI * seg(t, T.allow - 0.1, T.allow + 0.14));
        allow.style.transform = dip > 0 ? `scale(${(1 - 0.08 * dip).toFixed(4)})` : 'none';
        allow.classList.toggle('rx-down', t >= T.allow - 0.05);
        const sw = inOutCubic(seg(t, T.swap, T.swap + SWAP));
        fold(ask, 1 - sw);
        fold(run, sw);
        // signed in, then the five steps: a spinner each, resolving to a green check in turn
        [T.signed, ...T.ok].forEach((at, i) => {
          const c = checks[i], o = outCubic(seg(t, at, at + POP));
          c.spin.style.opacity = (1 - seg(t, at - 0.06, at + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.swap) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the page builds in from full frame (before it, only its chrome shows in the mini window)
        builds.forEach(({ ns, at, kind }) => {
          const a = T.full + at, f = outCubic(seg(t, a, a + BUILD_IN[kind]));
          ns.forEach((nd) => {
            if (kind === 'wipe') { nd.style.clipPath = f >= 1 ? 'none' : `inset(0 ${((1 - f) * 100).toFixed(2)}% 0 0 round 16px)`; nd.style.opacity = f > 0 ? '1' : '0'; return; }
            nd.style.opacity = f.toFixed(3);
            if (kind === 'pop') nd.style.transform = f >= 1 ? 'none' : `scale(${lerp(0.6, 1, f).toFixed(4)})`;
            else nd.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
          });
        });
        // the member's post, then AutoModerator's comment: each opens its slot (the content's own height) and fades up
        slots.forEach((m) => {
          const g = outCubic(seg(t, m.at, m.at + m.dur));
          const h = m.c.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== m.h) { m.s.style.height = want; m.h = want; }
          const f = outCubic(seg(t, m.at + m.dur * 0.3, m.at + m.dur));
          m.c.style.opacity = f.toFixed(3);
          m.c.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * -12).toFixed(2)}px)`;
        });
        // the landing mark: the comment's row lights and settles (Reddit's highlighted-comment wash), no glow
        cmt.style.setProperty('--mark', (1 - seg(t, T.auto + AUTO_IN * 0.5, T.auto + MARK)).toFixed(3));
        // members (and online) tick 1 -> 2 as the member's post lands
        const tk = inOutCubic(seg(t, T.tick, T.tick + TICK));
        cnts.forEach((c) => { c.style.transform = `translateY(${(-50 * tk).toFixed(2)}%)`; });
        mw.textContent = tk >= 0.5 ? 'members' : 'member';
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is, so it never
        // draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
