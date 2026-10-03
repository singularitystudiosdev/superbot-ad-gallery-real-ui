// Discourse beat, the finale: superbot connects to the community's Discourse forum and posts the work. Its line streams
// and a superbot-native connect card lands in the chat (the hub's own card grammar, not a replica of Discourse's
// authorize page: no buttons, no toggles, no pointer): a header with Discourse's mark and name, the community's row
// "Fernote Community", then a checklist that ticks (Signed in as Maya, admin; Read and write access; 21 replies posted;
// Weekly roundup pinned; 2 posts left for you). The card holds (CARD_HOLD) and opens to full frame (GROW, the base
// ad's connect-beat grow machinery).
// Full frame is superbot's view of the forum: a slim superbot edge bar on top ("superbot", a dot, "Discourse"; the
// community's name as plain text on the right), and under it Discourse's "Latest" topic list in its default light
// scheme, laid out from meta.discourse.org's own list (fetched 2026-10-03): column heads Topic / Replies / Views as
// plain text (no Activity column, no relative times), each row a title, its category badge (a small colour square and
// the name), the posters' round letter avatars, the reply count and the views; on 16:9 a left sidebar lists the
// categories as plain labels. A plain status line sits above the list. Then the choreography: the list settles with
// every reply count at 0; the counts tick 0 to 1 down the list in a short ripple while Maya's letter avatar joins each
// row's posters (the two posts left for a person get the amber "Left for you" tag instead); then the bold moment, the
// "Weekly roundup" row slides in at the top as a pinned topic (Discourse's pin glyph, category Announcements, an
// excerpt) with Discourse's own new-row highlight (meta's .topic-list-item.highlighted keyframes: from --tertiary-low,
// eased out). The render's chime plays the instant it lands (render.2dc391dd.mjs measures .dc-pinslot opening). The
// status line resolves, and that final state holds (READ) before the end card.
// X ad policy: nothing is a control. No New topic / Reply / Sign up / Log in, no search field, no hamburger, no
// avatar menu, no nav pills, no checkbox, no chevron, no pointer, no clock or relative time anywhere.
//
// There is ONE Discourse view, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's box (and transparent); GROW fades it up as it opens from there to the whole frame.
// The view is laid out once at a design size (the frame divided by APP_SCALE, so its type reads like Discourse at
// that zoom) and scaled to the layer. On a portrait frame (4:5) it takes the narrow layout: no sidebar, the list with
// Topic and Replies only (views dropped), and fewer rows (both rows left for a person stay).
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Posted 21 replies in Fernote Community and pinned the weekly roundup.';
const FORUM = 'Fernote Community';
const CHECKS = ['Signed in as Maya, admin', 'Read and write access', '21 replies posted', 'Weekly roundup pinned', '2 posts left for you'];
const STATUS_A = 'Posting to Fernote Community';
const STATUS_B = '21 replies posted, 2 left for you, roundup pinned';
const TAG = 'Left for you';
// categories: [key, name] (colours: chat.css --dc-c-*, Discourse's default category_colors)
const CATS = [['news', 'Announcements'], ['questions', 'Questions'], ['features', 'Feature requests'], ['bugs', 'Bugs'], ['show', 'Show and tell'], ['intro', 'Introductions']];
const CAT = Object.fromEntries(CATS);
// the topic list before the pin: [title, category, poster, views, kind]; kind 'ans' gets Maya's reply in the ripple,
// 'hold' is left for a person (the amber tag, replies stay 0); wide: shown on 16:9 only (4:5 keeps 5 rows + the pin)
const TOPICS = [
  ['Sync stuck on "Waiting" after 4.2', 'bugs', 'jonas', 412, 'ans'],
  ['Export a notebook to PDF', 'questions', 'ana', 268, 'ans'],
  ['Share one page, not the whole notebook', 'features', 'tomas', 191, 'ans'],
  ['Templates for meeting notes', 'questions', 'lena', 157, 'ans', 'wide'],
  ['Dark mode on iPad', 'features', 'kofi', 133, 'ans', 'wide'],
  ['Refund for a yearly plan', 'questions', 'ravi', 74, 'hold'],
  ['Notes missing after import', 'bugs', 'kofi', 96, 'hold'],
];
const PIN = { title: 'Weekly roundup', cat: 'news', poster: 'maya', views: 1, excerpt: '4.2 is out: a new tag panel and faster search. Most helpful thread: Templates for meeting notes (thanks, Lena).' };

const APP_SCALE = { wide: 1.4, tall: 1.5 };     // full frame: the view's px to frame px (4:5: body type 15 px -> 22.5 px)
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.2;                             // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.24;                           // the card landing to its first check
const CHECK_STAGGER = 0.11;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the card opens to full frame
const RIPPLE_AT = 0.35;                          // full frame to the first reply count ticking
const RIPPLE = 0.1;                             // one row's tick to the next
const TICK = 0.26;                               // a count flipping 0 -> 1, Maya's avatar joining
const PIN_AT = 0.3;                              // the last tick to the roundup landing (the bold moment, the chime)
const LAND = 0.4;                                // the pinned row's slot opening and its content sliding in
const GLOW = 1.5; /* deliberate */               // Discourse's new-row highlight fading out (meta: 2.5 s ease-out)
const STATUS_AT = 0.5;                          // the roundup landing to the status line resolving
const STATUS_IN = 0.24;
const READ = 1.5; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 10;                               // the card's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Material Design Icons (Pictogrammers, Apache 2.0), path verbatim from the Iconify API (mdi set): the pin
const PIN_ICON = '<svg class="dc-pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2zm-7.2 2l1.2-1.2V4h4v8.8l1.2 1.2z"/></svg>';
// Discourse's letter avatar: the username's first letter on its LetterAvatar colour, drawn round
const avatar = (u, cls = '') => `<span class="dc-av ${cls}" style="background: var(--dc-a-${u})">${esc(u[0].toUpperCase())}</span>`;
const badge = (c) => `<span class="dc-badge"><i style="background: var(--dc-c-${c})"></i>${esc(CAT[c])}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = CHECKS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[CHECKS.length - 1] + POP + CARD_HOLD; // the card starts opening
    T.full = T.grow + GROW;                           // full frame
    T.rip = TOPICS.map((_, i) => T.full + RIPPLE_AT + i * RIPPLE); // each row's tick (16:9 order; 4:5 re-spaces below)
    T.pin = T.rip[TOPICS.length - 1] + TICK + PIN_AT; // the roundup lands: the bold moment, the chime
    T.status = T.pin + STATUS_AT;                     // the status line resolves
    T.settle = T.status + STATUS_IN;                  // the last visible change (the highlight is fading under it)
    T.end = Math.max(T.settle, T.pin + LAND + 0.2) + READ; // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('discourse-logo.svg');

    // ---- the connect card in the chat (superbot's own card) ----
    const say = x.el(`<div class="qc-say dk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="dk-card">
      <div class="dk-hd"><span class="dk-mark"><img src="${mark}" alt=""/></span><b>Discourse</b></div>
      <div class="dk-forum">${esc(FORUM)}</div>
      ${CHECKS.map((c) => `<div class="dk-step"><span class="dk-st"><i class="dk-spin"></i>${x.OK}</span><span>${esc(c)}</span></div>`).join('')}
    </div>`);
    const steps = [...card.querySelectorAll('.dk-step')].map((n) => ({ spin: n.querySelector('.dk-spin'), ok: n.querySelector('.qc-ok') }));

    // ---- the full-frame Discourse view ----
    const row = ([title, c, u, views, kind, only], i) => `<div class="dc-row dc-${kind}${only ? ' dc-wideonly' : ''}" data-i="${i}">
        <div class="dc-topic"><span class="dc-title">${esc(title)}</span>
          <span class="dc-meta">${badge(c)}${kind === 'hold' ? `<b class="dc-tag">${esc(TAG)}</b>` : ''}</span></div>
        <div class="dc-posters">${avatar(u)}${kind === 'ans' ? avatar('maya', 'dc-join') : ''}</div>
        <div class="dc-num dc-replies"><span class="dc-flip"><b>0</b><b>1</b></span></div>
        <div class="dc-num dc-views">${views}</div>
      </div>`;
    const layer = x.el(`<div class="dc-full" aria-hidden="true"><div class="dc-app">
      <div class="dc-edge"><img class="dc-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="dc-dot"></i><span class="dc-mk"><img src="${mark}" alt=""/></span><b>Discourse</b><span class="dc-edge-r">${esc(FORUM)}</span></div>
      <div class="dc-body">
        <aside class="dc-side"><div class="dc-sh">Categories</div>
          ${CATS.map(([c, n]) => `<div class="dc-cat"><i style="background: var(--dc-c-${c})"></i>${esc(n)}</div>`).join('')}</aside>
        <main class="dc-main">
          <div class="dc-status"><span class="dc-st"><i class="dc-spin"></i><svg class="dc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
            <span class="dc-sl"><span class="dc-sa">${esc(STATUS_A)}</span><span class="dc-sb2">${esc(STATUS_B)}</span></span></div>
          <div class="dc-list">
            <div class="dc-head"><span class="dc-topic">Topic</span><span class="dc-posters"></span><span class="dc-num">Replies</span><span class="dc-num dc-views">Views</span></div>
            <div class="dc-pinslot"><div class="dc-row dc-pinned">
              <div class="dc-topic"><span class="dc-title">${PIN_ICON}${esc(PIN.title)}</span>
                <span class="dc-meta">${badge(PIN.cat)}</span><span class="dc-excerpt">${esc(PIN.excerpt)}</span></div>
              <div class="dc-posters">${avatar(PIN.poster)}</div>
              <div class="dc-num dc-replies"><span class="dc-flip"><b>0</b></span></div>
              <div class="dc-num dc-views">${PIN.views}</div>
            </div></div>
            ${TOPICS.map(row).join('')}
          </div>
        </main>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const slot = layer.querySelector('.dc-pinslot'), pinned = slot.firstElementChild;
    const rows = [...layer.querySelectorAll('.dc-row[data-i]')].map((n) => {
      const i = +n.dataset.i;
      return { n, i, kind: TOPICS[i][4], wide: TOPICS[i][5] === 'wide', flip: n.querySelector('.dc-flip'), join: n.querySelector('.dc-join'), tag: n.querySelector('.dc-tag') };
    });
    const st = { spin: layer.querySelector('.dc-st .dc-spin'), ok: layer.querySelector('.dc-st .dc-ok'), a: layer.querySelector('.dc-sa'), b: layer.querySelector('.dc-sb2') };
    // the view's type is Inter (vendored, discourse.css): ask for every weight up front so a seek never measures the
    // pinned slot in the fallback face
    if (document.fonts && document.fonts.load) ['400', '600'].forEach((w) => document.fonts.load(`${w} 16px "Inter DC"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, lastH = '', tall = false;
    let AW = 1371, AH = 771;

    // the view's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('dc-narrow', tall);
    };
    // the ripple runs down the rows on screen: on 4:5 the 16:9-only rows are skipped and the rest close up, so the
    // ripple keeps one even step (it ends earlier there; the pin still lands at T.pin in both)
    const tickAt = (o) => {
      if (!tall) return T.rip[o.i];
      const seen = rows.filter((r) => !r.wide);
      return T.rip[seen.indexOf(o)];
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
        // the checklist: a spinner each, resolving to the hub's green check in turn
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the ripple: each answered row's count flips 0 -> 1 as Maya's avatar joins its posters; a row left for a
        // person gets its amber tag instead
        rows.forEach((o) => {
          const a = tickAt(o);
          const p = a === undefined ? 0 : inOutCubic(seg(t, a, a + TICK));
          if (o.kind === 'ans') {
            o.flip.style.transform = `translateY(${(-p * 50).toFixed(2)}%)`;
            const j = outCubic(seg(t, a, a + TICK));
            o.join.style.opacity = j.toFixed(3);
            o.join.style.transform = j >= 1 ? 'none' : `scale(${lerp(0.5, 1, j).toFixed(4)})`;
          } else {
            const g = outCubic(seg(t, a, a + TICK));
            o.tag.style.opacity = g.toFixed(3);
          }
        });

        // the bold moment: the roundup's pinned row opens its slot at the top of the list (pushing the list down)
        // and slides in, with Discourse's new-row highlight fading out under it
        const g = outCubic(seg(t, T.pin, T.pin + LAND));
        const h = g >= 1 ? 'auto' : `${(pinned.offsetHeight * g).toFixed(2)}px`;
        if (h !== lastH) { slot.style.height = h; lastH = h; }
        const f = outCubic(seg(t, T.pin + LAND * 0.25, T.pin + LAND));
        pinned.style.opacity = f.toFixed(3);
        pinned.style.transform = f >= 1 ? 'none' : `translateY(${((f - 1) * 18).toFixed(2)}px)`;
        const glow = t < T.pin ? 1 : 1 - outCubic(seg(t, T.pin + LAND * 0.5, T.pin + LAND * 0.5 + GLOW));
        pinned.style.setProperty('--glow', glow.toFixed(3));

        // the status line: a spinner and what superbot is doing, then the check and the outcome
        const s = outCubic(seg(t, T.status, T.status + STATUS_IN));
        st.spin.style.opacity = (1 - seg(t, T.status - 0.06, T.status + 0.04)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.full) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = s.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, s).toFixed(4)})`;
        st.a.style.opacity = (1 - s).toFixed(3);
        st.b.style.opacity = s.toFixed(3);
      },
      // after the camera: pin the layer over the card's box, then open it to the whole frame
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(card);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = card.offsetWidth ? b.w / card.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        // the view covers the box whatever its aspect on the way (the card is squarer than the frame), centred
        const sc = Math.max(Wd / AW, Ht / AH);
        app.style.transform = `translate(${((Wd - AW * sc) / 2).toFixed(2)}px, ${((Ht - AH * sc) / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
        // while it sits over the card the layer is cut to the feed's viewport, so it never draws over the composer
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        // a quick dissolve from the card to the view as the box starts to open (no long double exposure)
        layer.style.opacity = outCubic(seg(t, T.grow, T.grow + 0.12)).toFixed(3);
      },
    };
  },
};
