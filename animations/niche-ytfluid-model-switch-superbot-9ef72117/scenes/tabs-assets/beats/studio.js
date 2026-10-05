// Studio beat (YouTube Studio, the platform). Under "Switching to YouTube Studio" one card rises: a live miniature of
// the video's Video comments page. It is the same full-frame layer the spot ends on, drawn into the card's box; on a
// spring the box grows to the whole frame (one shared-element move, no cut). The page is Studio's per-video view
// (Help 9482367: Pin only appears when viewing comments for an individual video): the video menu (Details, Analytics,
// Editor, Comments, Subtitles, Copyright, Clips), Video comments, Published / Held, the four comments Gemini picked.
// Opus's replies land one by one under their comments (posted through the Data API, so they simply appear, "Just now")
// and each comment gets Sam's heart. Pinning has no API, so superbot's own pointer (labelled) does it in the UI:
// More on Priya's comment, Pin, "Pin this comment?", Pin. "Pinned by Sam Rivera" opens above her name. Pure function
// of t.
import { esc, boxIn } from '../../../lib.js';
import { spring, smooth, rise, glide, click, lerp } from '../motion.js?v=9ef72117';
import { ms } from './yt-icons.js?v=9ef72117';
import { CHANNEL, VIDEO } from './connect.js?v=9ef72117';
import { TOP } from './watch.js?v=9ef72117';
import { REPLIES } from './replies.js?v=9ef72117';

const HANDLES = ['@priyanair', '@marco.ruiz', '@lenafischer', '@deeokafor'];
const AGO = ['1 hour ago', '1 hour ago', '58 minutes ago', '41 minutes ago'];
const S = 1.3;  // the page is laid out at (frame width / 1.3) x 831 and scaled up: Studio's own px at 130%

// seconds from the reply line
const CARD = 0.08;
const GROW_A = 0.85, GROW = 0.85;       // the card's box grows to the frame
const POST = 1.85, POST_STEP = 0.3;     // the replies land
const PTR = 3.0;                        // superbot's pointer enters
const MORE = 3.65;                      // clicks More on Priya's comment
const PIN_ITEM = 4.3;                   // clicks Pin in the menu
const DIALOG = 4.41;                    // "Pin this comment?"
const CONFIRM = 5.02;                   // clicks Pin in the dialog
const PINNED = 5.14;                    // "Pinned by Sam Rivera" opens
const HOLD = 6.25;                      // the last frame of the beat

// a timestamp in a reply is a link, as on YouTube
const linkify = (s) => esc(s).replace(/\b(\d{1,2}:\d{2})\b/g, '<a>$1</a>');

function pageHTML(ctx) {
  const nav = [['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-outline', 'Editor'], ['comment', 'Comments', 1], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'], ['content-cut', 'Clips']];
  const blocks = TOP.map(([n, col, txt, likes], i) => `
    <div class="st-blk" data-i="${i}">
      <div class="st-cm"><span class="st-av" style="--c:${col}">${n[0]}</span><div class="st-body">
        ${i === 0 ? `<div class="st-pslot"><div class="st-pinned">${ms('keep-outline', 'st-pi')}Pinned by ${esc(CHANNEL.handle)}</div></div>` : ''}
        <div class="st-meta">${HANDLES[i]} <span>· ${AGO[i]}</span></div>
        <div class="st-text">${esc(txt)}</div>
        <div class="st-acts"><span class="st-rb">Reply</span><span class="st-tog">${ms('arrow-drop-down')}1 reply</span>
          <span class="st-ib">${ms('thumb-up-outline')}</span><span class="st-n">${likes}</span><span class="st-ib">${ms('thumb-down-outline')}</span>
          <span class="st-ib st-hb"><span class="st-hrt">${ms('favorite-outline', 'st-hf0')}${ms('favorite', 'st-hf1')}<img class="st-hav" src="${ctx.img('avatar-sam.jpg')}" alt=""/></span></span>
          <span class="st-ib st-more">${ms('more-vert')}</span></div>
        <div class="st-rslot"><div class="st-rep"><img class="st-av st-av-s" src="${ctx.img('avatar-sam.jpg')}" alt=""/><div class="st-body">
          <div class="st-meta"><span class="st-owner">${esc(CHANNEL.handle)}</span> <span>· Just now</span></div>
          <div class="st-text">${linkify(REPLIES[i])}</div></div></div></div>
      </div></div>
    </div>`).join('');
  return `<div class="st-app">
  <div class="st-top"><span class="st-btn">${ms('menu')}</span><span class="st-logo"><img src="${ctx.brand('youtube-studio-logo.svg')}" alt="YouTube Studio"/></span>
    <span class="st-search">${ms('search')}<span>Search across your channel</span></span>
    <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline', 'st-cr')}Create</span><img class="st-me" src="${ctx.img('avatar-sam.jpg')}" alt=""/></span></div>
  <div class="st-main">
    <div class="st-nav">
      <div class="st-back">${ms('arrow-back')}<span>Channel content</span></div>
      <div class="st-vcard"><img src="${ctx.img('thumb.jpg')}" alt=""/><span class="st-vk">Your video</span><span class="st-vt">${esc(VIDEO.title)}</span></div>
      ${nav.map(([ic, l, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${l}</span></div>`).join('')}
      <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
    </div>
    <div class="st-page">
      <h1 class="st-h1">Video comments</h1>
      <div class="st-tabs"><span class="st-tab st-tab-on">Published</span><span class="st-tab">Held</span></div>
      <div class="st-filter">${ms('filter-list')}<span class="st-fph">Filter</span><span class="st-sort">${ms('sort')}<span>Top comments</span></span></div>
      <div class="st-list">${blocks}</div>
    </div>
  </div>
  <div class="st-menu">
    <div class="st-mi st-mi-pin">${ms('keep-outline')}<span>Pin</span></div>
    <div class="st-mi">${ms('manage-search')}<span>Find similar comments</span></div>
    <div class="st-mi">${ms('delete-outline')}<span>Remove</span></div>
    <div class="st-mi">${ms('flag-outline')}<span>Report</span></div>
    <div class="st-mi">${ms('block')}<span>Hide user from channel</span></div>
  </div>
  <div class="st-scrim"></div>
  <div class="st-dlg"><h2>Pin this comment?</h2><p>If you already pinned a comment, this will replace it.</p><div class="st-dbtns"><span>Cancel</span><span class="st-dpin">Pin</span></div></div>
</div>`;
}

export default {
  times(sw, base) {
    return { end: base.reply + HOLD };
  },

  build(k, ctx) {
    const r = k.reply;
    const card = ctx.el(`<div class="st-card"><div class="st-cap">${ms('comment-outline', 'st-ci')}<span>Opening <b>Video comments</b> in YouTube Studio</span></div><div class="st-slot"></div></div>`);
    const slot = card.querySelector('.st-slot'), feed = ctx.hub.querySelector('.feed');
    const layer = ctx.el(`<div class="st-full" aria-hidden="true">${pageHTML(ctx)}</div>`);
    ctx.root.appendChild(layer);
    const agent = ctx.el(`<div class="st-agent"><img src="${ctx.sbSrc}" alt=""/>superbot</div>`);
    ctx.root.appendChild(agent);
    const app = layer.querySelector('.st-app');
    const q = (s) => app.querySelector(s), qa = (s) => [...app.querySelectorAll(s)];
    const N = {
      blks: qa('.st-blk'), rslots: qa('.st-rslot'), reps: qa('.st-rep'), togs: qa('.st-tog'), hf1: qa('.st-hf1'), hav: qa('.st-hav'),
      pslot: q('.st-pslot'), more: q('.st-blk[data-i="0"] .st-more'), menu: q('.st-menu'), pinItem: q('.st-mi-pin'),
      scrim: q('.st-scrim'), dlg: q('.st-dlg'), dpin: q('.st-dpin'),
    };
    let G = null; // layout cache: page size, the slot heights, pointer targets (page px)

    const pagePos = (n) => { let x = 0, y = 0, e = n; while (e && e !== app) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x + n.offsetWidth / 2, y: y + n.offsetHeight / 2, w: n.offsetWidth, h: n.offsetHeight }; };
    const measure = () => {
      const W = ctx.root.offsetWidth || 1920, H = ctx.root.offsetHeight || 1080;
      const pw = W / S, ph = H / S;
      app.style.width = pw + 'px'; app.style.height = ph + 'px';
      app.classList.toggle('st-narrow', pw < 900);
      app.classList.toggle('st-tiny', pw < 560);
      N.rslots.forEach((s) => { s.style.height = 'auto'; });
      N.pslot.style.height = 'auto';
      const rh = N.rslots.map((s) => s.offsetHeight), phh = N.pslot.offsetHeight;
      N.pslot.style.height = '0px'; // the targets are clicked before the label opens
      slot.style.aspectRatio = `${W} / ${H}`;
      // menu: opens under-left of Priya's More button
      N.menu.style.display = 'block'; N.dlg.style.display = 'block';
      const more = pagePos(N.more);
      N.menu.style.left = Math.max(8, more.x + 16 - N.menu.offsetWidth) + 'px';
      N.menu.style.top = (more.y + 18) + 'px';
      const pin = pagePos(N.pinItem), dpin = pagePos(N.dpin);
      dpin.x -= N.dlg.offsetWidth / 2; dpin.y -= N.dlg.offsetHeight / 2; // the dialog is centred by translate(-50%,-50%)
      N.menu.style.display = ''; N.dlg.style.display = '';
      return { W, H, pw, ph, rh, phh, more, pin, dpin, ok: !document.fonts || document.fonts.status === 'loaded' };
    };

    // reply i lands at
    const postAt = (i) => r + POST + POST_STEP * i;

    return {
      nodes: [card],
      marks: [[r + CARD, card]],
      render(t) {
        rise(card, t, r + CARD, 14, 0.65);
      },
      after(t) {
        if (!G || !G.ok || G.W !== ctx.root.offsetWidth) G = measure();
        const show = t >= r + CARD;
        layer.style.visibility = show ? 'visible' : 'hidden';
        if (!show) return;
        // the box: the card's slot (live, in section px) -> the whole frame
        const b = boxIn(slot, ctx.root);
        const g = spring(t, r + GROW_A, GROW);
        const x = lerp(b.x, 0, g), y = lerp(b.y, 0, g), w = lerp(b.w, G.W, g);
        const h = lerp(b.h, G.H, g);
        layer.style.left = x.toFixed(2) + 'px'; layer.style.top = y.toFixed(2) + 'px';
        layer.style.width = w.toFixed(2) + 'px'; layer.style.height = h.toFixed(2) + 'px';
        // while it is still a card it is clipped to the thread (it must not draw over the composer); the clip lets go as it grows
        const f = boxIn(feed, ctx.root), u = 1 - g, rad = lerp(12 * (b.w / Math.max(1, slot.offsetWidth)), 0, g);
        const ct = Math.max(0, f.y - y) * u, cb = Math.max(0, y + h - (f.y + f.h)) * u;
        layer.style.clipPath = g >= 1 ? 'none' : `inset(${ct.toFixed(2)}px 0px ${cb.toFixed(2)}px 0px round ${rad.toFixed(2)}px)`;
        layer.style.opacity = card.style.opacity || '0';
        layer.style.boxShadow = g < 1 ? `0 ${lerp(10, 30, g).toFixed(1)}px ${lerp(30, 80, g).toFixed(1)}px rgba(0,0,0,${(0.45 * (1 - g)).toFixed(3)})` : 'none';
        app.style.transform = `scale(${(w / G.pw).toFixed(5)})`;
        if (g > 0) layer.style.opacity = '1';

        // the replies land: their slot opens on the spring, the row fades up, the heart fills
        N.rslots.forEach((s, i) => {
          const a = postAt(i);
          const o = spring(t, a, 0.55);
          s.style.height = (G.rh[i] * o).toFixed(2) + 'px';
          rise(N.reps[i], t, a + 0.06, 8, 0.5);
          const hf = smooth(t, a + 0.12, a + 0.32);
          N.hf1[i].style.opacity = hf.toFixed(3);
          N.hav[i].style.opacity = hf.toFixed(3);
          N.hf1[i].style.transform = `scale(${lerp(0.6, 1, spring(t, a + 0.12, 0.45)).toFixed(4)})`;
          N.togs[i].style.opacity = smooth(t, a + 0.1, a + 0.35).toFixed(3);
        });

        // More -> the menu
        const mOpen = spring(t, r + MORE + 0.02, 0.32), mClose = smooth(t, r + PIN_ITEM + 0.02, r + PIN_ITEM + 0.2);
        const mv = smooth(t, r + MORE + 0.02, r + MORE + 0.16) * (1 - mClose);
        N.menu.style.visibility = mv > 0 ? 'visible' : 'hidden';
        N.menu.style.opacity = mv.toFixed(3);
        N.menu.style.transform = `translate3d(0,${((1 - mOpen) * -6).toFixed(2)}px,0) scale(${lerp(0.96, 1, mOpen).toFixed(4)})`;
        N.pinItem.classList.toggle('on', t >= r + PIN_ITEM - 0.35 && t < r + PIN_ITEM + 0.2);
        N.more.classList.toggle('on', t >= r + MORE - 0.05 && t < r + PIN_ITEM + 0.2);

        // the dialog
        const dIn = spring(t, r + DIALOG, 0.42), dOut = smooth(t, r + CONFIRM + 0.04, r + CONFIRM + 0.26);
        const dv = smooth(t, r + DIALOG, r + DIALOG + 0.2) * (1 - dOut);
        N.dlg.style.visibility = dv > 0 ? 'visible' : 'hidden';
        N.dlg.style.opacity = dv.toFixed(3);
        N.dlg.style.transform = `translate(-50%,-50%) scale(${lerp(0.95, 1, dIn).toFixed(4)})`;
        N.scrim.style.opacity = (0.5 * dv).toFixed(3);
        N.dpin.classList.toggle('on', t >= r + CONFIRM - 0.06 && t < r + CONFIRM + 0.2);

        // pinned: the label opens above Priya's name, her block washes blue for a moment
        const p = spring(t, r + PINNED, 0.55);
        N.pslot.style.height = (G.phh * p).toFixed(2) + 'px';
        N.pslot.firstElementChild.style.opacity = smooth(t, r + PINNED + 0.1, r + PINNED + 0.4).toFixed(3);
        N.blks[0].style.setProperty('--wash', (smooth(t, r + PINNED, r + PINNED + 0.3) * (1 - smooth(t, r + PINNED + 0.9, r + PINNED + 1.5))).toFixed(3));
      },
      pointer(t) {
        if (!G) return null;
        const a = r + PTR;
        if (t < a - 0.05) { agent.style.opacity = '0'; return null; }
        // page px -> section px (the layer is full-frame by now)
        const k = G.W / G.pw;
        const P = (o, dx = 0, dy = 0) => [(o.x + dx) * k, (o.y + dy) * k];
        const [mx, my] = P(G.more), [px, py] = P(G.pin, -G.pin.w / 2 + 40), [dx, dy] = P(G.dpin);
        const pt = glide(t, [[a - 1, G.W * 0.86, G.H * 1.04], [a, mx, my], [r + MORE + 0.08, px, py], [r + PIN_ITEM + 0.15, dx, dy], [r + CONFIRM + 0.2, dx + 140, dy + 120]], 0.5);
        const p = Math.max(click(t, r + MORE), click(t, r + PIN_ITEM), click(t, r + CONFIRM));
        const v = smooth(t, a - 0.05, a + 0.25) * (1 - smooth(t, r + PINNED + 0.2, r + PINNED + 0.6));
        agent.style.opacity = v.toFixed(3);
        agent.style.transform = `translate3d(${(pt.x + 34).toFixed(1)}px,${(pt.y + 6).toFixed(1)}px,0)`;
        return { x: pt.x, y: pt.y, p, v };
      },
    };
  },
};
