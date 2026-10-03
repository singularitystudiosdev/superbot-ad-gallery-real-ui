// Bandcamp beat, the finale: superbot releases the single on the artist's own Bandcamp. Its line streams and a status
// card lands in the chat (no consent sheet, no Connect or Cancel, no pointer: policy): five rows tick in turn, each a
// spinner that becomes the green check ("Bandcamp connected, signed in as Nell Ardmore", "Uploaded last-bus-home.wav",
// "Added lyrics, credits and 8 tags", "Price: name your price, $1 minimum", "Published to nellardmore.bandcamp.com"),
// with a mini window under them. The card holds and the window opens into a SUPERBOT FRAME (never a full-bleed
// third-party page): the thread dims behind a scrim, a superbot label bar ("superbot · Bandcamp, signed in as Nell
// Ardmore") sits above a margined window, and in the window is the single's Bandcamp track page in Bandcamp's own
// visual language (the stylesheets bandcamp.com serves, chat.css --bc-*): the artist's header, the track title in
// Helvetica Neue 28px, "by Nell Ardmore", the plain-text buy line "Digital Track · Streaming + Download · name your
// price", About, the lyrics excerpt, Credits and the tags as plain grey text, and the 350 px square cover (the real
// photograph, img/cover.jpg). No player, no Buy / Share / Wishlist / Follow, no dates, no counts: every Bandcamp
// control is omitted. The page's sections sweep in one by one; then THE bold moment (the chime, window.__AD_MARKS.chime):
// a toast rises inside the frame, "Last Bus Home is live on Bandcamp", "Lyrics, credits and 8 tags added" (no action
// link). The final state holds (READ). One page, on a layer in the scene root (outside the camera), laid out once at a
// design size and scaled to the layer, so the mini window and the framed window are the same pixels at two sizes. On
// a portrait frame (4:5) the right column and About drop out and the cover sits beside the title. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=cd0a8aa3';
import { REL } from './rel.js?v=cd0a8aa3';

const SAY = 'Releasing it on your Bandcamp.';
const STEPS = [
  ['bandcamp', `Bandcamp connected, signed in as <b>${REL.artist}</b>`],
  ['upload', `Uploaded <b>${REL.file}</b>`],
  ['tag', `Added lyrics, credits and <b>${REL.tags.length} tags</b>`],
  ['badge-dollar-sign', 'Price: <b>name your price</b>, $1 minimum'],
  ['globe', `Published to <b>${REL.domain}</b>`],
];
const APP_SCALE = { wide: 1.6, tall: 1.85 };   // framed window: the page's px to frame px (4:5 text >= 22 px at 1080)
// the superbot frame the window opens into: margins and the label bar above it (frame px), the roblox sibling's frame
const FRAME = { wide: { pad: 44, top: 112, bar: 44 }, tall: { pad: 22, top: 100, bar: 40 } };
const CPS = 80;                                 // the reply line streams
const CARD_AT = 0.25;                           // the line streams, then the status card lands
const CARD_IN = 0.3;                            // a card rising into the thread
const CHECK_AT = 0.3;                           // the card landing to the first row
const CHECK_STAGGER = 0.24;                     // one row to the next
const ROW_SPIN = 0.14;                          // a row appears with its spinner this long before its check
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.35; /* deliberate */        // the last check in, the card holds before it opens
const GROW = 0.5; /* deliberate */              // the window opens into the superbot frame
const SWEEP_AT = 0.3; /* deliberate */          // framed to the first page section
const SEC_STEP = 0.16; /* deliberate */         // one page section to the next
const SEC_IN = 0.24;                            // a section rising in
const BOLD_AT = 0.3;                            // the last section in to the toast (the chime)
const BOLD_IN = 0.36;                           // the toast rising in
const READ = 1.7; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the framed window's radius

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="bk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + ROW_SPIN + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.secs = [0, 1, 2, 3, 4].map((i) => T.full + SWEEP_AT + i * SEC_STEP);
    T.bold = T.secs[4] + SEC_IN + BOLD_AT;
    T.settle = T.bold + BOLD_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });
    const mark = x.brand('bandcamp-mark.svg');
    const cover = x.img('cover.jpg');

    // ---- the status card in the chat ----
    const say = x.el(`<div class="qc-say bk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const stepIcon = (kind) => (kind === 'bandcamp' ? `<span class="bk-ic bk-bc"><img src="${mark}" alt=""/></span>` : `<span class="bk-ic">${lc(kind)}</span>`);
    const card = x.el(`<div class="bk-card">
      ${STEPS.map(([kind, txt]) => `<div class="bk-step">${stepIcon(kind)}<span class="bk-tx">${txt}</span><span class="bk-ok"><i class="bk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="bk-shot"></div>
    </div>`);
    const shot = card.querySelector('.bk-shot');
    const steps = [...card.querySelectorAll('.bk-step')];
    const checks = [...card.querySelectorAll('.bk-ok')].map((n) => ({ spin: n.querySelector('.bk-spin'), ck: n.querySelector('.bk-ck') }));

    // ---- the superbot frame: a scrim over the thread, the label bar, the framed window ----
    const scrim = x.el('<div class="bc-scrim" aria-hidden="true"></div>');
    const bar = x.el(`<div class="bc-bar" aria-hidden="true"><img class="bc-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="bc-dot">·</i><span>Bandcamp, signed in as ${esc(REL.artist)}</span></div>`);
    const layer = x.el(`<div class="bc-full" aria-hidden="true"><div class="bc-app">
      <div class="bc-top"><img class="bc-mark" src="${mark}" alt=""/></div>
      <div class="bc-hdr"><img src="${cover}" alt=""/><b>${esc(REL.artist)}</b></div>
      <div class="bc-pg">
        <div class="bc-left">
          <div class="bc-name"><img class="bc-art bc-tall-only" src="${cover}" alt=""/><div>
            <h2 class="bc-title">${esc(REL.title)}</h2>
            <h3 class="bc-by">by <span>${esc(REL.artist)}</span></h3>
            <p class="bc-buy bc-sec"><span><b>Digital Track</b><i>·</i></span> <span>Streaming + Download<i>·</i></span> <span>name your price</span></p>
          </div></div>
          <div class="bc-data bc-about bc-sec bc-wide-only">${REL.about.map(esc).join(' ')}</div>
          <div class="bc-data bc-lyrics bc-sec"><h4>lyrics</h4>${REL.lyrics.map(esc).join('<br>')}</div>
          <div class="bc-data bc-credits bc-sec"><h4>credits</h4>${REL.credits.map(esc).join('<br>')}</div>
          <div class="bc-data bc-tags bc-sec"><h4>tags</h4><span>${REL.tags.map(esc).join('</span><span>')}</span></div>
        </div>
        <div class="bc-mid bc-wide-only"><img class="bc-art" src="${cover}" alt=""/></div>
        <div class="bc-right bc-wide-only"><b>${esc(REL.artist)}</b><p>Songs from the night bus.</p></div>
      </div>
      <div class="bc-toast">${lc('circle-check')}<span><b>${esc(REL.title)} is live on Bandcamp</b><small>Lyrics, credits and ${REL.tags.length} tags added</small></span></div>
    </div></div>`);
    x.root.append(scrim, layer, bar);
    const app = layer.firstElementChild;
    const toast = app.querySelector('.bc-toast');
    // the sweep order: the buy line, About, the lyrics, the credits, the tags (About is absent on 4:5: its slot just passes)
    const secs = ['.bc-buy', '.bc-about', '.bc-lyrics', '.bc-credits', '.bc-tags'].map((s) => app.querySelector(s));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', tall = false, F = null, AW = 1145, AH = 577;

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
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('bc-narrow', tall);
      shot.style.aspectRatio = `${F.w} / ${F.h}`;
      card.classList.toggle('bk-tall', tall);
      bar.classList.toggle('bc-bar-tall', tall);
      bar.style.left = `${F.x}px`; bar.style.width = `${F.w}px`;
      bar.style.top = `${F.y - f.bar - 12}px`; bar.style.height = `${f.bar}px`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, steps[0]], [T.ok[2] - ROW_SPIN, steps[2]], [T.ok[4] - ROW_SPIN, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const li = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        steps.forEach((s, i) => {
          const a = T.ok[i] - ROW_SPIN;
          const o = outCubic(seg(t, a, a + 0.18));
          s.style.opacity = o.toFixed(3);
          s.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 5).toFixed(2)}px)`;
        });
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        // the page's sections sweep in once the window is framed
        secs.forEach((s, i) => {
          if (!s) return;
          const o = outCubic(seg(t, T.secs[i], T.secs[i] + SEC_IN));
          s.style.opacity = o.toFixed(3);
          s.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const b = outCubic(seg(t, T.bold, T.bold + BOLD_IN));
        toast.style.opacity = b.toFixed(3);
        toast.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * 22).toFixed(2)}px) scale(${lerp(0.94, 1, b).toFixed(4)})`;
      },
      // after the camera: pin the layer over the card's window, then open it into the superbot frame
      after(t) {
        if (t < T.card || !F) { layer.style.opacity = '0'; scrim.style.opacity = '0'; bar.style.opacity = '0'; return; }
        layout();
        const bx = x.box(shot);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(bx.x, F.x, g), Tp = lerp(bx.y, F.y, g), Wd = lerp(bx.w, F.w, g), Ht = lerp(bx.h, F.h, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        const rad = lerp(6 * (bx.w / Math.max(1, shot.offsetWidth)), RADIUS, g);
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
      },
    };
  },
};
