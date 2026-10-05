// Studio beat, the r1-e finale (the sub-7s cut): superbot posts the replies from the creator's own YouTube Studio.
// Under the "Connecting to YouTube Studio" pill (which holds, its check readable) the reply row lands with the
// reference's checklist card: "Connected as Sam Rivera" resolving to its check, and the live Studio window under it.
// That window then opens to the full frame (GROW): it is the same pixels the whole way, so nothing crossfades. The cut
// has no room for Google's consent card. Full frame is YouTube Studio, light theme, desktop layout as the reference
// shows it (left menu, search field, Create, the Community page with Published / Held, the filter bar narrowed to the
// latest video, "Top comments", the video column), the top comments in Studio's own row grammar. The camera pushes in
// on Lena's row (two rows fill the frame): superbot's replies post, each heart fills, and Lena's reply (the boom arm
// GPT-6 Astra found at 4:38) holds long enough to read, with Priya's comment in third place below it. The ONE bold
// moment (the chime): Priya's comment is pinned. It travels up past Lena and Marco as a lifted card (opaque, on top,
// so no text ever shows through it), the rows above it step down, "Pinned by Sam Rivera" opens as it lands, and the
// camera follows it to the top of the list. The payoff caption then slides up as one solid bar whose top edge is the
// row boundary under the pinned comment.
//
// There is ONE Studio client, on a layer in the scene root (outside the hub's camera), laid out once at a design size
// (the frame divided by APP_SCALE) and scaled to the layer: over the card's window while it sits in the chat, then
// opening past the whole frame. Its camera is a view rect in client px whose zoom moves in log space. Pure function of t.
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js';
import { ms } from './yt-icons.js?v=r1e1';
import { TOP, VIDEO } from './watch.js?v=r1e1';
import { REPLIES } from './replies.js?v=r1e1';

const ACCOUNT = 'Sam Rivera';
// superbot's reply to each commenter, from replies.md (replies.js), by first name
const REPLY = Object.fromEntries(REPLIES.split('\n\n').map((b) => {
  const s = b.replace(/\n/g, ' ');
  const i = s.indexOf(': ');
  return [s.slice(0, i), s.slice(i + 2)];
}));
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];               // indexes into watch.js TOP
const PINNED = 0;                            // TOP[0], Priya
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const SNACK = 'Comment pinned';
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// full frame: the client's px to frame px. The desktop client is laid out about 1040 px wide, so once the camera
// frames one comment column its 14px text lands near 64px on 1920 (about 13px on a phone).
const APP_SCALE = { wide: 1.85, tall: 1.2 };
const NARROW_BELOW = 900;                        // a client narrower than this drops the left menu and the video column
// timing (seconds from the reply start; the pill's check lands just before it)
const CARD_IN = 0.18;                            // the checklist card rising in with the reply row
const CARD_GLIDE = 0.45;                         // the thread's scroll to it (a tall step: a long, even glide)
const STEP_AT = 0.16, STEP_IN = 0.14;            // "Connected as Sam Rivera": its spinner resolving to the check
const GROW_AT = 0.38; /* deliberate */           // the reply row to the window opening: the pill's check reads 0.4 s
const GROW = 0.36;                               // the window opens to (just past) the full frame, one ease
const OVER = 0.012;                              // ...overshooting each frame edge by this fraction
const DIM = 0.9;                                 // the chat behind the opening window dims this far
const PUSH_AT = 0.7;                             // fraction of the grow at which the camera starts pushing in
const PUSH = 0.42;
const REP_AT = 0.02;                             // full frame to the first reply opening (Lena's is in as the push lands)
const REP_STAGGER = 0.07;                        // one reply to the next (top to bottom)
const REP_IN = 0.26;                             // a reply's slot opening, its content fading up with it
const HEART_AT = 0.08;                           // a reply opening to its comment's heart filling
const HEART_IN = 0.18;
const LENA_READ = 0.42; /* deliberate */          // Lena's reply settled to the pin (the chime): it reads first
const MOVE = 0.5;                                // the pinned comment travelling to the top (the camera holds still)
const LABEL_AT = 0.45;                           // ...its "Pinned by" line opening over the last part of the travel
const SNACK_IN = 0.2;                            // the snackbar rises once the pinned comment has landed
const WASH = 0.9;                                // the pinned comment's wash fading back to white after it lands
const FOLLOW_AT = -0.04, FOLLOW = 0.3;           // the landing to the camera following it up to the top of the list
const INSET_AT = -0.2, INSET = 0.3;              // the camera settled to the window easing in off the frame edges
const CAP_AT = 0.12, CAP_IN = 0.22;              // the inset starting to the caption rising on the black under it
const HOLD = 0.5; /* deliberate */               // the caption fully in, held, readable
const INSET_RECT = { x: 0.11, y: 0.04, w: 0.78, h: 0.78 }; // the inset window, fractions of the frame (16:9 kept)
const CAPTION = 'Replies posted. Best one pinned.';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r;                                        // the checklist card lands with the reply row
    T.step = T.card + STEP_AT;                         // "Connected as Sam Rivera" checks
    T.grow = r + GROW_AT;                              // the card's window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.push = T.grow + GROW * PUSH_AT;                  // the camera pushes in on Lena's row
    T.rep = ORDER.map((_, i) => T.full + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.pin = T.rep[1] + REP_IN + LENA_READ;             // Priya's comment is pinned (the chime)
    T.settle = T.pin + MOVE;                           // it has landed at the top
    T.snack = T.settle;
    T.follow = T.settle + FOLLOW_AT;                   // the camera follows it up
    T.inset = T.follow + FOLLOW + INSET_AT;            // the window eases in off the frame edges
    T.cap = T.inset + CAP_AT;                          // the payoff caption rises under it
    T.end = T.cap + CAP_IN + HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin });

    // ---- the checklist card in the chat: one step and the live Studio window ----
    const card = x.el(`<div class="gk-card"><div class="gk-step"><span class="gk-ic gk-av">S</span><span class="gk-tx">Connected as <b>${esc(ACCOUNT)}</b></span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div><div class="gk-shot"></div></div>`);
    const shot = card.querySelector('.gk-shot');
    const spin = card.querySelector('.gk-spin'), ck = card.querySelector('.gk-ck'), stepRow = card.querySelector('.gk-step');

    // ---- the full-frame YouTube Studio client ----
    const av = (name, c, cls = '') => `<span class="st-av ${cls}" style="--c: ${c}">${esc(name[0])}</span>`;
    const block = (ti) => {
      const [name, text, likes, , c] = TOP[ti];
      const first = name.split(' ')[0];
      return `<div class="st-blk" data-i="${ti}"><i class="st-wash"></i>
        <div class="st-cm">${av(name, c)}
          <div class="st-body">
            ${ti === PINNED ? `<div class="st-pslot"><div class="st-pinned">${ms('keep', 'st-pi')}<span>Pinned by ${esc(ACCOUNT)}</span></div></div>` : ''}
            <div class="st-meta"><b>${esc(name)}</b><span> • 2 hours ago</span></div>
            <div class="st-text">${esc(text)}</div>
            <div class="st-acts"><span class="st-rb">Reply</span><span class="st-tog">1 reply${ms('arrow-drop-down')}</span>
              <span class="st-ib">${ms('thumb-up-outline')}</span><span class="st-n">${likes}</span><span class="st-ib">${ms('thumb-down-outline')}</span>
              <span class="st-ib st-hb"><span class="st-hrt">${ms('favorite-outline', 'st-hf0')}${ms('favorite', 'st-hf1')}<i class="st-hav">S</i></span></span>
              <span class="st-ib">${ms('more-vert')}</span></div>
            <div class="st-rslot"><div class="st-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-av-s')}
              <div class="st-body"><div class="st-meta"><b class="st-owner">${esc(ACCOUNT)}</b><span> • Just now</span></div>
                <div class="st-text">${esc(REPLY[first])}</div></div></div></div>
          </div>
          <div class="st-vid"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><span>${esc(VIDEO.title)}</span></div>
        </div></div>`;
    };
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">S</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-chan"><span class="st-big">S</span><b>Your channel</b><small>${esc(ACCOUNT)}</small></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Community</h1>
          <div class="st-tabs"><span class="st-tab st-tab-on">Published</span><span class="st-tab">Held</span></div>
          <div class="st-filter">${ms('filter-list')}<span class="st-chip">Video: ${esc(VIDEO.title)}</span>
            <span class="st-sort">${ms('sort')}<span>Top comments</span>${ms('arrow-drop-down')}</span></div>
          <div class="st-list">${ORDER.map(block).join('')}</div>
        </section>
      </div>
      <div class="st-snack">${esc(SNACK)}</div>
    </div></div>`);
    // in front of the client: the payoff caption, an ad title over the app (not Studio UI): one solid bar
    const cap = x.el(`<div class="st-cap">${esc(CAPTION)}</div>`);
    x.root.appendChild(layer);
    x.root.appendChild(cap);
    const site = x.hub.closest('.sbsite');
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const list = $('.st-list');
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
      n, i: +n.dataset.i,
      rslot: n.querySelector('.st-rslot'), rep: n.querySelector('.st-rep'), tog: n.querySelector('.st-tog'),
      h1: n.querySelector('.st-hf1'), hav: n.querySelector('.st-hav'), hrt: n.querySelector('.st-hrt'), wash: n.querySelector('.st-wash'),
      rH: '',
    }));
    const pinIdx = blocks.findIndex((b) => b.i === PINNED);
    const pinB = blocks[pinIdx];
    const above = blocks.slice(0, pinIdx);
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    const snack = $('.st-snack');

    // ---- the client's camera: view rects in client px ----
    const rel = (n) => { let x0 = 0, y0 = 0; for (let e = n; e && e !== app; e = e.offsetParent) { x0 += e.offsetLeft; y0 += e.offsetTop; } return { x: x0, y: y0 }; };
    const colBody = blocks[0].n.querySelector('.st-body');
    // the comment column: from the rows' left edge (so a pinned row's wash meets the frame edge) to the end of the text
    const column = () => {
      const x0 = rel(blocks[0].n).x, bd = rel(colBody);
      return { x: x0, w: bd.x + colBody.offsetWidth + 20 - x0 };
    };
    const finalH = () => pinB.n.offsetHeight - pslot.offsetHeight + pinned.offsetHeight; // the pinned row, label open
    // Lena's row at the top of the frame, Priya's below it in third place
    const lenaView = (aspect) => {
      const c = column();
      return { x: c.x, y: rel(blocks[1].n).y - 6, w: c.w };
    };
    // the pinned comment tight at the top of the list, the whole row in view
    const pinView = (aspect) => {
      const c = column();
      return { x: c.x, y: rel(list).y - 4, w: Math.max(c.w, (finalH() + 16) / aspect) };
    };
    // between two view rects: the width in log space (a steady zoom), the corner along with it
    const blend = (A, B, e) => {
      if (e <= 0) return A;
      if (e >= 1) return B;
      const w = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
      const f = Math.abs(A.w - B.w) > 0.01 ? (A.w - w) / (A.w - B.w) : e;
      return { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), w };
    };
    const sine = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);
    // Studio's type is Roboto (vendored, studio.css): ask for every face up front so a seek never measures a slot in
    // the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
    }

    let geo = '';
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      // laid out as tall as a desktop window (the frame shows its top; the camera can travel down the list)
      app.style.width = `${AW}px`; app.style.height = `${tall ? AH : Math.round(AW * 0.85)}px`;
      app.classList.toggle('st-narrow', tall || AW < NARROW_BELOW);
      shot.style.aspectRatio = `${W} / ${H}`;
      blocks.forEach((b) => { b.rH = ''; });
    };

    return {
      nodes: [card],
      marks: [[T.card, card, CARD_GLIDE]],
      render(t) {
        layout();
        const li = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 10).toFixed(2)}px)`;
        spin.style.opacity = (1 - seg(t, T.step - 0.06, T.step + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const o = outCubic(seg(t, T.step, T.step + STEP_IN));
        ck.style.opacity = o.toFixed(3);
        ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;

        // superbot's replies open under the comments one by one, each reply's text fading up with its space, and
        // each heart fills
        blocks.forEach((b, i) => {
          b.n.style.opacity = '1';
          const g = outCubic(seg(t, T.rep[i], T.rep[i] + REP_IN));
          const h = b.rep.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== b.rH) { b.rslot.style.height = want; b.rH = want; }
          b.rep.style.opacity = g.toFixed(3);
          b.rep.style.transform = g >= 1 ? 'none' : `translateY(${((1 - g) * -6).toFixed(2)}px)`;
          b.tog.style.opacity = g.toFixed(3);
          const hp = outCubic(seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.h1.style.opacity = hp.toFixed(3);
          b.hav.style.opacity = hp.toFixed(3);
          const pop = Math.sin(Math.PI * seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.hrt.style.transform = pop > 0 ? `scale(${(1 + 0.18 * pop).toFixed(4)})` : 'none';
        });

        // the pin: Priya's row travels up to the top as a lifted card while the rows above it step down by its final
        // height; its "Pinned by" line opens as it lands, so the end state is exactly the reflowed list
        const lab = outCubic(seg(t, T.pin + MOVE * LABEL_AT, T.settle));
        pslot.style.height = lab >= 1 ? 'auto' : `${(pinned.offsetHeight * lab).toFixed(2)}px`;
        pinned.style.opacity = lab.toFixed(3);
        const m = inOutCubic(seg(t, T.pin, T.settle));
        const upBy = above.reduce((sum, b) => sum + b.n.offsetHeight, 0);
        const downBy = finalH();
        pinB.n.style.transform = m > 0 ? `translateY(${(-upBy * m).toFixed(2)}px)` : 'none';
        above.forEach((b) => { b.n.style.transform = m > 0 ? `translateY(${(downBy * m).toFixed(2)}px)` : 'none'; });
        pinB.n.classList.toggle('st-moving', m > 0);
        const lift = Math.sin(Math.PI * m);
        pinB.n.style.boxShadow = lift > 0.001 ? `0 ${(8 * lift).toFixed(2)}px ${(22 * lift).toFixed(2)}px rgba(0,0,0,${(0.18 * lift).toFixed(3)})` : '';
        pinB.wash.style.opacity = (outCubic(seg(t, T.pin, T.pin + MOVE * 0.5)) * (1 - inOutCubic(seg(t, T.settle, T.settle + WASH)))).toFixed(3);

        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
      },
      // after the hub's camera: the layer sits over the card's window, opens past the whole frame, then its camera
      // pushes in on Lena's row and follows the pinned comment to the top
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; cap.style.opacity = '0'; site.style.opacity = '1'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        // the full frame (just past its edges), then the inset window on black
        const ins = inOutCubic(seg(t, T.inset, T.inset + INSET));
        const FL = lerp(-OVER * W, INSET_RECT.x * W, ins), FT = lerp(-OVER * H, INSET_RECT.y * H, ins);
        const FW = lerp((1 + 2 * OVER) * W, INSET_RECT.w * W, ins), FH = lerp((1 + 2 * OVER) * H, INSET_RECT.h * H, ins);
        const L = lerp(b.x, FL, g), Tp = lerp(b.y, FT, g), Wd = lerp(b.w, FW, g), Ht = lerp(b.h, FH, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${((8 * s) * (1 - g) + 22 * ins).toFixed(2)}px`;
        layer.style.boxShadow = ins > 0 ? `0 0 0 ${(2 * ins).toFixed(2)}px rgba(255,255,255,${(0.14 * ins).toFixed(3)})` : '';
        // in the card it IS the card's window (same fade); opening, it is solid, and the card's own header gives way
        layer.style.opacity = t < T.grow ? card.style.opacity : '1';
        stepRow.style.opacity = (1 - seg(g, 0, 0.3)).toFixed(3);
        // the chat behind dims as the window opens over it, and is gone (pure black) by the inset
        site.style.opacity = ((1 - DIM * seg(g, 0, 0.6)) * (1 - seg(t, T.inset - 0.1, T.inset))).toFixed(3);
        // the client's camera: the whole page, Lena's row; it holds still while the pinned comment travels, then
        // follows it to the top of the list
        const aspect = Ht / Wd;
        let v = { x: 0, y: 0, w: AW };
        v = blend(v, lenaView(aspect), sine(seg(t, T.push, T.push + PUSH)));
        v = blend(v, pinView(aspect), sine(seg(t, T.follow, T.follow + FOLLOW)));
        app.style.transform = `scale(${(Wd / v.w).toFixed(5)}) translate(${(-v.x).toFixed(2)}px,${(-v.y).toFixed(2)}px)`;
        // the payoff caption, an ad title on the black under the inset window (off the app surface)
        const cp = outCubic(seg(t, T.cap, T.cap + CAP_IN));
        cap.style.opacity = cp.toFixed(3);
        cap.style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 18).toFixed(2)}px)`;
      },
    };
  },
};
