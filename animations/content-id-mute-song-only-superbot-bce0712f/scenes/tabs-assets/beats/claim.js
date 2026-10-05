// Claim beat, the finale: superbot fixes the copyright claim in Jonah Plays' own YouTube Studio. Its line streams and
// a light checklist card lands in the chat ("Connected as Jonah Plays", the claim, Mute song only, the release;
// spinners turning to checks). The Studio window opens out of the card to full frame while the card lifts and floats
// to the top centre, so Studio plays BEHIND the checklist.
// Studio (light theme): Channel content, the Live tab. The stream VOD "Hollow Crown 100% Run, Final Boss (No Healing)
// LIVE" (3:41:16) carries a yellow "Copyright claim" in Restrictions and monetization Off. The pointer hovers the
// claim, the hover card opens, See details: the Video copyright info dialog (the player on 1:12:08, the claim:
// "Neon Harbor" by Kestrel Lane, claimant Brightline Music Rights, content used 1:12:08 to 1:15:31, monetized by
// claimant). Select action > Mute song: the dialog offers Mute all sound and Mute song only; Mute song only, Continue,
// the preview (the song's lane muted over the range, the voice lane kept), Save. The claim flips to "Claim released",
// the dialog closes and the row reads Restrictions "None", monetization "On" in green. Song, artist, claimant and VOD
// are fictional (listen.js holds them so both beats agree).
//
// There is ONE app client, on a layer in the scene root (outside the camera), laid out once at a design size (the frame
// divided by APP_SCALE) and scaled to the layer, so the opening window and the full frame are the same pixels at two
// sizes. The window's own push (onto the row, the dialogs) is written in after(). The floating checklist is a second
// copy of the chat's card, on the root above the layer. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, press, placeCursor, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=bce0712f';
import { VOD, SONG, RANGE } from './listen.js?v=bce0712f';

const CHANNEL = 'Jonah Plays';
const INITIAL = 'J';
const SAY = 'Fixing the claim in your YouTube Studio.';
const STEPS = [
  ['studio', `Connected as <b>${CHANNEL}</b>`],
  ['copyright-outline', `Claim: <b>${SONG.title}</b>, ${RANGE.label}`],
  ['volume-off-outline', '<b>Mute song only</b>, your commentary stays'],
  ['check-circle', '<b>Claim released</b>, monetization on'],
];
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const TABS = ['Inspiration', 'Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'];
// the Live tab: [thumbnail, title, length, date, views, comments, likes %, likes]; the claimed VOD first
const ROWS = [
  [VOD.thumb, VOD.title, VOD.length, VOD.streamed, '18,406', '642', '98.7%', '2,931 likes'],
  ['drowned-keep.jpg', 'Hollow Crown 100% Run, Part 3: The Drowned Keep LIVE', '4:02:55', 'Sep 27, 2026', '24,180', '811', '98.9%', '3,402 likes'],
  ['ashwood.jpg', 'Hollow Crown 100% Run, Part 2: Ashwood LIVE', '3:18:40', 'Sep 20, 2026', '31,592', '1,046', '99.0%', '4,115 likes'],
];
const TIP = { h: 'Copyright claim', p: 'Copyright-protected content was found in your video. The owner is allowing it to be viewed on YouTube and is monetizing it.' };
const ACTIONS = [['content-cut', 'Trim out segment'], ['swap-horiz', 'Replace song'], ['volume-off-outline', 'Mute song'], ['gavel', 'Dispute']];
const OPTS = [
  ['Mute all sound', 'Mutes all audio in the claimed segment, including your voice. Quicker and more likely to remove the claim.'],
  ['Mute song only', 'Mutes just the song. Other audio, like your commentary, stays.'],
];

const APP_SCALE = 1.2;                         // full frame: the client's px to frame px
const FLOAT = { w: 540, top: 20 };             // the floating checklist, top centre, in frame px
// timing (seconds from the beat start r, or from the window starting to open, G)
const CPS = 110, SAY_AT = 0.03;                // the line streams
const CARD_AT = 0.1;                           // r to the checklist card rising into the thread
const CARD_IN = 0.18;
const OK0 = 0.2;                               // the card starting to rise to "Connected as Jonah Plays" checking
const POP = 0.14;                              // a check popping in
const GROW_AT = 0.34;                          // the card starting to rise to the window opening (G)
const GROW = 0.36; /* deliberate */            // the window opens to full frame (Content, Live)
const HOV = 0.66, TIP_IN = 0.12;               // the pointer on "Copyright claim": the hover card opens
const SEE = 0.94;                              // See details clicked
const MODAL = 1.02, MODAL_IN = 0.2;            // Video copyright info opening
const SEL = 1.6, MENU_IN = 0.1;                // Select action clicked: the menu opens
const MUTE = 1.88;                             // "Mute song" clicked
const DLG = 1.96, DLG_IN = 0.18;               // the Mute song dialog opening
const ONLY = 2.4;                              // "Mute song only" clicked
const CONT = 2.7;                              // Continue clicked
const STEP2 = 2.78, STEP2_IN = 0.16;           // the dialog turning to its preview and Save
const SAVE = 3.14;                             // Save clicked
const DLG_OUT = 0.06, DLG_OUT_IN = 0.14;       // Save to the dialog closing
const REL = 3.3, REL_IN = 0.2;                 // the claim flipping to "Claim released"
const MODAL_OUT = 3.86, MODAL_OUT_IN = 0.18;   // Video copyright info closing
const FLIP = 4.06, FLIP_IN = 0.2;              // the row: Restrictions "None", monetization "On"
const READ = 0.5; /* deliberate */             // the final row holds before the scene's fade
// the window's push from G: [at, dur, zoom, focus], inOutCubic between
const PUSH = [
  [0.3, 0.3, 1.3, 'row'],
  [MODAL - 0.02, 0.28, 1.1, 'modal'],
  [DLG - 0.02, 0.26, 1.32, 'dlg'],
  [SAVE + DLG_OUT, 0.26, 1.28, 'claim'],
  [MODAL_OUT, 0.28, 1.26, 'done'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + GROW_AT;
    T.full = T.grow + GROW;
    const at = (d) => T.grow + d;
    Object.assign(T, {
      hov: at(HOV), see: at(SEE), modal: at(MODAL), sel: at(SEL), mute: at(MUTE), dlg: at(DLG), only: at(ONLY),
      cont: at(CONT), step2: at(STEP2), save: at(SAVE), rel: at(REL), modalOut: at(MODAL_OUT), flip: at(FLIP),
    });
    T.dlgOut = T.save + DLG_OUT;
    T.push = PUSH.map(([a, d, z, f]) => [at(a), d, z, f]);
    T.ok = [T.card + OK0, T.modal + MODAL_IN, T.save + 0.1, T.flip + 0.1];
    T.end = Math.max(T.flip + FLIP_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, {
      card: T.card, grow: T.grow, clicks: [T.see, T.sel, T.mute, T.only, T.cont, T.save], hover: T.hov,
      opens: [T.modal, T.dlg, T.step2], release: T.rel, flip: T.flip, oks: T.ok,
    });
    const icon = (f) => x.brand(f);
    const thumb = (f) => x.img('thumbs/' + f);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    // ---- the checklist card: one in the chat, one floating over the full-frame layer ----
    const stepIcon = (kind) => (kind === 'studio' ? `<span class="gk-ic gk-av">${INITIAL}</span>` : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const cardHTML = (cls) => `<div class="gk-card ${cls}">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
    </div>`;
    const card = x.el(cardHTML(''));
    const fcard = x.el(cardHTML('gk-float'));
    const checksOf = (n) => [...n.querySelectorAll('.gk-ok')].map((o) => ({ spin: o.querySelector('.gk-spin'), ck: o.querySelector('.gk-ck') }));
    const checks = [checksOf(card), checksOf(fcard)];

    // ---- the app client: YouTube Studio, Channel content (Live), Video copyright info, Mute song ----
    const av = (cls = '') => `<span class="pl-av ${cls}">${INITIAL}</span>`;
    const navItem = ([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`;
    const lanes = (cls) => `<div class="cl-pv ${cls}">
      <div class="cl-pvr"><i>${RANGE.label.split(' to ')[0]}</i><i>${RANGE.label.split(' to ')[1]}</i></div>
      <div class="cl-pvl"><span class="cl-pvn">${ms('music-note')}<span>${esc(SONG.title)}</span></span><span class="cl-pvt cl-pvt-m">${'<i></i>'.repeat(48)}<b class="cl-muted">${ms('volume-off-outline')}Muted</b></span></div>
      <div class="cl-pvl"><span class="cl-pvn">${ms('mic-outline')}<span>Your voice</span></span><span class="cl-pvt cl-pvt-v">${'<i></i>'.repeat(48)}<b class="cl-kept">Kept</b></span></div>
    </div>`;
    const layer = x.el(`<div class="st-full cl-full" aria-hidden="true"><div class="st-app cl-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        ${av('pl-me')}
      </header>
      <div class="st-main">
        <nav class="st-nav cl-nav">
          <div class="st-chan">${av('pl-av-xl')}<b>Your channel</b><small>${esc(CHANNEL)}</small></div>
          ${NAV.map(navItem).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page cl-content">
          <h1 class="st-h1">Channel content</h1>
          <div class="cl-tabs">${TABS.map((tb) => `<span class="cl-tab${tb === 'Live' ? ' cl-tab-on' : ''}">${tb}</span>`).join('')}</div>
          <div class="cl-filter">${ms('filter-list')}<span>Filter</span></div>
          <div class="cl-tr cl-th"><span class="cl-cb">${ms('check-box-outline-blank')}</span><span>Video</span><span>Visibility</span><span>Monetization</span><span>Restrictions</span><span>Date</span><span class="cl-num">Views</span><span class="cl-num">Comments</span><span class="cl-num">Likes (vs. dislikes)</span></div>
          ${ROWS.map(([f, title, len, date, views, cm, likes, n], i) => `<div class="cl-tr cl-row${i === 0 ? ' cl-vod' : ''}">
            <span class="cl-cb">${ms('check-box-outline-blank')}</span>
            <span class="cl-vid"><span class="cl-vth"><img src="${thumb(f)}" alt=""/><i>${len}</i></span><span class="cl-vt"><b>${esc(title)}</b><small>Hollow Crown, live with chat</small></span></span>
            <span class="cl-vis">${ms('public')}Public</span>
            ${i === 0 ? `<span class="cl-mon"><span class="cl-mon-off">${ms('money-off')}Off</span><span class="cl-mon-on">${ms('attach-money')}On</span></span>`
              : `<span class="cl-mon"><span class="cl-mon-on cl-static">${ms('attach-money')}On</span></span>`}
            ${i === 0 ? `<span class="cl-res"><span class="cl-claim">${ms('copyright')}<u>Copyright claim</u></span><span class="cl-none">None</span></span>` : '<span class="cl-res">None</span>'}
            <span class="cl-date">${date}<small>Streamed</small></span>
            <span class="cl-num">${views}</span><span class="cl-num">${cm}</span><span class="cl-num cl-likes">${likes}<small>${n}</small><i><b style="width:${likes}"></b></i></span>
          </div>`).join('')}
          <div class="cl-tip"><b>${esc(TIP.h)}</b><p>${esc(TIP.p)}</p><span class="cl-see">See details</span></div>
        </section>
      </div>
        <div class="cl-scrim cl-scrim-1"></div>
        <div class="cl-modal">
          <div class="cl-mh"><h2>Video copyright info</h2><span class="st-btn">${ms('close')}</span></div>
          <div class="cl-mtop">
            <div class="cl-player"><img src="${x.img('frames/boss-fight.jpg')}" alt=""/>
              <div class="cl-pbar"><i class="cl-pclaim"></i><i class="cl-pplay"></i></div>
              <div class="cl-pctl">${ms('play-arrow')}${ms('volume-up-outline')}<b>${RANGE.label.split(' to ')[0]} / ${VOD.length}</b></div>
            </div>
            <div class="cl-mdet">
              <b>${esc(VOD.title)}</b>
              <small>Streamed ${VOD.streamed} · ${VOD.length} · Public</small>
              <div class="cl-note">${ms('copyright')}<span>1 copyright claim. The claimant is monetizing this video.</span></div>
            </div>
          </div>
          <h3 class="cl-mh3">Content identified in this video</h3>
          <div class="cl-ct cl-cth"><span>Content</span><span>Content used</span><span>Claimant</span><span>Impact on the video</span><span>Actions</span></div>
          <div class="cl-ct cl-crow">
            <span class="cl-song"><span class="cl-songic">${ms('music-note')}</span><span><b>${esc(SONG.title)}</b><small>${esc(SONG.artist)}</small><small>Audio, Content ID</small></span></span>
            <span class="cl-used">${RANGE.label}<small>${RANGE.len} of ${VOD.length}</small></span>
            <span>${esc(SONG.claimant)}</span>
            <span class="cl-imp"><span class="cl-imp-a">${ms('attach-money')}Monetized by claimant</span><span class="cl-imp-b">${ms('check-circle')}Claim released</span></span>
            <span class="cl-act"><span class="cl-sel">Select action${ms('arrow-drop-down')}</span><span class="cl-done">${ms('volume-off-outline')}Song muted</span></span>
          </div>
          <div class="cl-menu">${ACTIONS.map(([ic, label]) => `<div class="cl-mi">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}</div>
        </div>
        <div class="cl-scrim cl-scrim-2"></div>
        <div class="cl-dlg">
          <div class="cl-d1">
            <h2>Mute song</h2>
            <small class="cl-dsub">${esc(SONG.title)}, ${esc(SONG.artist)} · ${RANGE.label}</small>
            ${OPTS.map(([h, p]) => `<div class="cl-opt"><span class="cl-rad">${ms('radio-button-unchecked', 'cl-r0')}${ms('radio-button-checked', 'cl-r1')}</span><span><b>${esc(h)}</b><small>${esc(p)}</small></span></div>`).join('')}
            <div class="cl-df"><span class="cl-txb">Cancel</span><span class="cl-btn cl-cont">Continue</span></div>
          </div>
          <div class="cl-d2">
            <h2>Mute song only</h2>
            <small class="cl-dsub">Preview, ${RANGE.label}</small>
            ${lanes('')}
            <p class="cl-dnote">${esc(SONG.title)} is removed from ${RANGE.label}. Your commentary stays.</p>
            <div class="cl-df"><span class="cl-txb">Back</span><span class="cl-btn cl-save">Save</span></div>
          </div>
        </div>
    </div></div>`);
    x.root.appendChild(layer);
    x.root.appendChild(fcard);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const vod = $('.cl-vod'), claimCell = $('.cl-claim'), claimTx = $('.cl-claim u'), none = $('.cl-none');
    const monOff = $('.cl-vod .cl-mon-off'), monOn = $('.cl-vod .cl-mon-on');
    const tip = $('.cl-tip'), see = $('.cl-see');
    const scrim1 = $('.cl-scrim-1'), scrim2 = $('.cl-scrim-2'), modal = $('.cl-modal'), crow = $('.cl-crow');
    const sel = $('.cl-sel'), menu = $('.cl-menu'), miMute = menu.children[2];
    const impA = $('.cl-imp-a'), impB = $('.cl-imp-b'), selWrap = sel, done = $('.cl-done');
    const dlg = $('.cl-dlg'), d1 = $('.cl-d1'), d2 = $('.cl-d2');
    const opts = [...layer.querySelectorAll('.cl-opt')], cont = $('.cl-cont'), saveBtn = $('.cl-save');
    const r1 = opts[1].querySelector('.cl-r1'), r0 = opts[1].querySelector('.cl-r0');
    const mBars = [...layer.querySelectorAll('.cl-pvt-m i')], muted = $('.cl-muted'), kept = $('.cl-kept');
    const pplay = $('.cl-pplay');
    const pointerEl = x.root.querySelector('.cursor');
    // the preview lanes: a beat-shaped song and speech-shaped voice, fixed heights (no randomness per frame)
    mBars.forEach((b, i) => { b.style.height = `${[88, 52, 70, 46][i % 4]}%`; });
    [...layer.querySelectorAll('.cl-pvt-v i')].forEach((b, i) => { b.style.height = `${i % 11 === 6 ? 8 : Math.round(30 + 50 * (0.5 + 0.5 * Math.sin(i * 0.61)))}%`; });
    // Studio is Roboto (vendored, claim.css): ask for every face up front so a seek never measures in the fallback
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));

    let geo = '', AW = 1600, AH = 900;
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      // 16:9 is the cut; a narrower frame (the gallery's other ratios) keeps the 1600-wide desktop layout, scaled down
      AW = Math.max(1600, Math.round(W / APP_SCALE)); AH = Math.round((H * AW) / W);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
    };
    // a node's centre in the app's own px (the app's transform is scale + translate only, so it divides out)
    const inApp = (n) => {
      const a = app.getBoundingClientRect(), b = n.getBoundingClientRect();
      const k = a.width / AW || 1;
      return { x: (b.left - a.left + b.width / 2) / k, y: (b.top - a.top + b.height / 2) / k };
    };
    const focusOf = (f) => {
      if (f === 'row') { const c = inApp(claimCell); return { x: c.x - 60, y: inApp(vod).y + 70 }; }
      if (f === 'modal') { const c = inApp(modal); return { x: c.x, y: c.y - 30 }; }
      if (f === 'dlg') { const c = inApp(dlg); return { x: c.x, y: c.y - 40 }; }
      if (f === 'claim') { const c = inApp(crow); return { x: c.x, y: c.y - 170 }; }   // the modal title clear of the checklist
      if (f === 'done') { const c = inApp(claimCell); return { x: c.x - 130, y: inApp(vod).y + 60 }; } // the whole row, thumbnail to likes
      return { x: AW / 2, y: AH / 2 };
    };

    // the pointer's stops, in order: [arrive by, node, press at]; it glides between them and leaves after Save
    const STOPS = [
      [T.hov, claimTx, null], [T.see, see, T.see], [T.sel, sel, T.sel], [T.mute, miMute, T.mute],
      [T.only, opts[1], T.only], [T.cont, cont, T.cont], [T.save, saveBtn, T.save],
    ];
    const ptr = (t) => {
      if (t < T.full - 0.1 || t > T.save + 0.4 || !pointerEl) return null;
      const pos = (n) => { const b = x.box(n); return n === opts[1] ? { x: b.x + 26, y: b.y + 22 } : { x: b.x + b.w * 0.5, y: b.y + b.h * 0.6 }; };
      let i = STOPS.findIndex(([a]) => t < a);
      if (i < 0) i = STOPS.length - 1;
      const to = pos(STOPS[i][1]);
      const from = i === 0 ? { x: to.x + 260, y: to.y + 200 } : pos(STOPS[i - 1][1]);
      const a0 = i === 0 ? T.full - 0.1 : STOPS[i - 1][0] + 0.05;
      const m = inOutCubic(seg(t, a0, Math.max(a0 + 0.01, STOPS[i][0])));
      const leave = outCubic(seg(t, T.save + 0.14, T.save + 0.4));
      const p = STOPS.reduce((acc, [, , at]) => Math.max(acc, at === null ? 0 : press(t, at)), 0);
      return { x: lerp(from.x, to.x, m) + leave * 50, y: lerp(from.y, to.y, m) + leave * 40, p, v: seg(t, T.full - 0.1, T.full) * (1 - leave) };
    };

    // the hover card hangs under "Copyright claim"; the action menu under Select action (both in their parent's px)
    const placeFloats = () => {
      const rel = (n, host) => {
        const hb = host.getBoundingClientRect(), k = hb.width / (host.offsetWidth || 1) || 1, b = n.getBoundingClientRect();
        return { x: (b.left - hb.left) / k, y: (b.top - hb.top) / k, w: b.width / k, h: b.height / k };
      };
      const page = tip.parentNode;
      const c = rel(claimCell, page);
      tip.style.left = `${(c.x - 16).toFixed(1)}px`;
      tip.style.top = `${(c.y + c.h + 10).toFixed(1)}px`;
      const s = rel(sel, modal);
      menu.style.left = `${(s.x + s.w - menu.offsetWidth).toFixed(1)}px`;
      menu.style.top = `${(s.y + s.h + 4).toFixed(1)}px`;
    };

    const renderChecks = (t) => checks.forEach((list) => list.forEach((c, i) => {
      const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
      c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
      c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
      c.ck.style.opacity = o.toFixed(3);
      c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
    }));
    const pop = (n, t, a, d = 0.16, s0 = 0.96, out = Infinity, od = 0.14) => {
      const p = outCubic(seg(t, a, a + d)) * (1 - seg(t, out, out + od));
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `scale(${lerp(s0, 1, p).toFixed(4)})`;
      return p;
    };
    const fade = (n, p) => { n.style.opacity = p.toFixed(3); };
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.r + 0.04, card]],   // the thread opens room for the card just after the line starts
      render(t) {
        layout();
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        renderChecks(t);

        // Content: the claim is hovered, its card opens, See details
        vod.classList.toggle('cl-hi', t >= T.hov - 0.1 && t < T.modalOut + 0.6);
        claimCell.classList.toggle('cl-claim-hov', t >= T.hov && t < T.modal);
        pop(tip, t, T.hov, TIP_IN, 0.94, T.see + 0.04, 0.1);
        see.classList.toggle('cl-see-hit', t >= T.see - 0.06);

        // Video copyright info: opens, Select action > Mute song, closes after the release
        const mIn = outCubic(seg(t, T.modal, T.modal + MODAL_IN)) * (1 - seg(t, T.modalOut, T.modalOut + MODAL_OUT_IN));
        fade(scrim1, mIn);
        modal.style.opacity = mIn.toFixed(3);
        modal.style.transform = mIn >= 1 ? 'translateX(-50%)' : `translateX(-50%) translateY(${((1 - mIn) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, mIn).toFixed(4)})`;
        sel.classList.toggle('cl-sel-on', t >= T.sel - 0.04 && t < T.dlg);
        pop(menu, t, T.sel, MENU_IN, 0.95, T.mute + 0.06, 0.08);
        miMute.classList.toggle('cl-mi-hi', t >= T.mute - 0.12);
        pplay.style.width = `${(seg(t, T.rel, T.modalOut + 0.2) * 1.2).toFixed(2)}%`;

        // the Mute song dialog: Mute song only, Continue, the preview, Save
        const dIn = outCubic(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - seg(t, T.dlgOut, T.dlgOut + DLG_OUT_IN));
        fade(scrim2, dIn * 0.9);
        dlg.style.opacity = dIn.toFixed(3);
        dlg.style.transform = dIn >= 1 ? 'translate(-50%, -50%)' : `translate(-50%, -50%) scale(${lerp(0.96, 1, dIn).toFixed(4)})`;
        const s2 = outCubic(seg(t, T.step2, T.step2 + STEP2_IN));
        fade(d1, 1 - s2);
        fade(d2, s2);
        d1.style.visibility = s2 >= 1 ? 'hidden' : '';
        const picked = seg(t, T.only, T.only + 0.08);
        fade(r1, picked); fade(r0, 1 - picked);
        opts[1].classList.toggle('cl-opt-on', t >= T.only);
        cont.classList.toggle('cl-btn-on', t >= T.only);
        const pc = press(t, T.cont), ps = press(t, T.save);
        cont.style.transform = pc ? `scale(${(1 - 0.07 * pc).toFixed(4)})` : 'none';
        saveBtn.style.transform = ps ? `scale(${(1 - 0.07 * ps).toFixed(4)})` : 'none';
        saveBtn.classList.toggle('cl-btn-hit', t >= T.save);
        // the preview: the song's bars sink to silence over the range, the voice stays
        const mute = outCubic(seg(t, T.step2 + 0.1, T.step2 + 0.4));
        mBars.forEach((b) => { b.style.transform = `scaleY(${lerp(1, 0.06, mute).toFixed(4)})`; });
        fade(muted, mute); fade(kept, mute);

        // the release: the claim flips, then the row reads None and On
        const rl = outCubic(seg(t, T.rel, T.rel + REL_IN));
        fade(impA, 1 - rl); fade(impB, rl);
        impB.style.transform = rl >= 1 ? 'none' : `scale(${lerp(0.9, 1, rl).toFixed(4)})`;
        fade(selWrap, 1 - rl); fade(done, rl);
        crow.classList.toggle('cl-crow-ok', t >= T.rel);
        const fl = outCubic(seg(t, T.flip, T.flip + FLIP_IN));
        fade(claimCell, 1 - fl); fade(none, fl);
        fade(monOff, 1 - fl); fade(monOn, fl);
        monOn.style.transform = fl >= 1 ? 'none' : `scale(${lerp(0.8, 1, fl).toFixed(4)})`;
        vod.classList.toggle('cl-fixed', t >= T.flip);
        placeFloats();
      },
      // after the camera: open the layer out of the card to the whole frame, float the card's copy over it, push
      // the window onto what is happening, and place the pointer on the pushed window
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; fcard.style.opacity = '0'; card.style.visibility = ''; return; }
        layout();
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const b = x.box(card);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const w0 = b.w, h0 = (b.w * H) / W;
        const L = lerp(b.x, 0, g), Tp = lerp(b.y + b.h / 2 - h0 / 2, 0, g), Wd = lerp(w0, W, g), Ht = lerp(h0, H, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(16 * (1 - g)).toFixed(2)}px`;
        layer.style.opacity = seg(t, T.grow, T.grow + 0.08).toFixed(3);
        // the window's own push, move by move
        const sc = Wd / AW;
        let cam = { z: 1, x: AW / 2, y: AH / 2 };
        for (const [a, d, z, f] of T.push) {
          if (t < a) break;
          const p = inOutCubic(seg(t, a, a + d)), to = focusOf(f);
          cam = { z: lerp(cam.z, z, p), x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p) };
        }
        // never push past the window's edges
        const hw = AW / 2 / cam.z, hh = AH / 2 / cam.z;
        cam.x = Math.min(AW - hw, Math.max(hw, cam.x)); cam.y = Math.min(AH - hh, Math.max(hh, cam.y));
        app.style.transform = `scale(${sc.toFixed(5)}) translate(${(AW / 2).toFixed(2)}px, ${(AH / 2).toFixed(2)}px) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px)`;
        // the card lifts out of the thread and glides to the top centre, shrinking to FLOAT.w
        card.style.visibility = 'hidden';
        const cw = card.offsetWidth || 1;
        const fw = Math.min(FLOAT.w, W * 0.62);
        const s0 = b.w / cw, s1 = fw / cw;
        const fx = lerp(b.x, (W - fw) / 2, g), fy = lerp(b.y, FLOAT.top, g);
        fcard.style.width = `${cw}px`;
        fcard.style.opacity = '1';
        fcard.style.transform = `translate(${fx.toFixed(2)}px, ${fy.toFixed(2)}px) scale(${lerp(s0, s1, g).toFixed(5)})`;
        const pt = ptr(t);
        if (pt) placeCursor(pointerEl, pt.x, pt.y, pt.p, pt.v);
      },
    };
  },
};
