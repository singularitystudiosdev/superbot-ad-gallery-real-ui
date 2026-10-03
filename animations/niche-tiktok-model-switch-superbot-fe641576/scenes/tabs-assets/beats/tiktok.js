// TikTok beat, the finale: superbot schedules the clip. Its line streams, a connect card lands in the chat ("superbot
// connected to TikTok", "Uploaded clip_3107.mp4", "Scheduled for 7:00 PM", three checks ticking in turn) with a mini
// window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the Discord
// remake's discord.js (and the source's play.js). Full frame is a real-looking TikTok Studio upload page, light theme:
// the sidebar, the uploaded file, the Details card (the caption, the cover from the GPT Image beat), the Settings card
// (Schedule picked: Oct 3, 7:00 PM; Everyone; comments, Duet and Stitch on) and the phone preview playing the clip.
// The pointer clicks Schedule and the toast reads "Your video is scheduled for 7:00 PM". Then a short time skip: the
// page dims and a clock pill flips from 6:59 PM to 7:00 PM with a red live dot, and the tiktok.com video page lands
// (dark theme; its root is .tt-live, whose opacity rising from 0 is the instant render.mjs times the chime on): the clip
// playing with word by word captions, the counts climbing from 0 (the heart turns red with a pop) and the comments
// sliding in one by one. On a portrait frame (4:5) both screens take their narrow layouts: Studio's collapsed sidebar,
// and TikTok's mobile video screen (full-bleed clip, the right action rail, the caption bottom-left). The final state
// holds (READ) before the end card.
//
// There is ONE TikTok window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes.
// The footage is real (img/clip/f001..f090.jpg, 6 s at 15 fps, img/CREDITS.txt): every frame is fetched AND decoded
// before this module finishes loading (top-level await), so timeline.js only reports window.__AD.ready once they all
// are, and each player draws frame floor((t - start) * 15) mod 90 onto its canvas: a pure function of t.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { coverHTML } from './image.js?v=fe641576';

// ---- the footage and the type, ready before the spot reports ready ----
const FPS_CLIP = 15, NF = 90;
const asset = (p) => new URL(`../../../${p}`, import.meta.url).href;
const CLIP = Array.from({ length: NF }, (_, i) => { const im = new Image(); im.src = asset(`img/clip/f${String(i + 1).padStart(3, '0')}.jpg`); return im; });
const COVER = new Image(); COVER.src = asset('img/cover-frame.jpg');
// TikTok Sans (SIL OFL 1.1, @fontsource/tiktok-sans 5.3.0, vendored under fonts/, fonts/CREDITS.txt)
const FACES = [400, 500, 600, 700, 800].map((w) => new FontFace('TikTok Sans', `url("${asset(`fonts/tiktok-sans-latin-${w}-normal.woff2`)}") format("woff2")`, { weight: String(w), style: 'normal', display: 'block' }));
FACES.forEach((f) => document.fonts.add(f));
await Promise.all([...FACES.map((f) => f.load()), ...CLIP.map((im) => im.decode()), COVER.decode()]);

const SAY = 'Scheduling the clip on TikTok for 7:00 PM tonight.';
const NAME = 'The Drift Pod', USER = 'thedriftpod';
const FILE = 'clip_3107.mp4';
// the caption, as typed into Studio (TikTok's hashtag picker leaves a space after the last tag)
const CAP_TEXT = "The scary part isn't quitting. It's month two. Full episode on the pod";
const TAGS = ['#podcast', '#careertok', '#quittingmyjob', '#money', '#fyp'];
const CAPTION = `${CAP_TEXT} ${TAGS.join(' ')} `;
const SOUND = `original sound - ${NAME}`;
// the counts the post lands on, and the comments (made up for the spot): [name, avatar colour, text, likes]
const COUNTS = { likes: 21400, comments: 1086, saves: 4912, shares: 2377 };
const COMMENTS = [
  ['Maya R.', '#ff7a59', 'month two is so real', 3104],
  ['jordanbuilds', '#5b8def', 'checking my bank app nine times a day. this is me', 1872],
  ['Priya K.', '#b05cff', 'needed this today', 944],
  ['sam.codes', '#21b37a', 'what episode is this? listening now', 611],
  ['Leo Martin', '#f2a93b', 'the Costco parking lot story next please', 402],
];
// the clip's own words, as burned-in captions: chunks of words, one popping in at a time
const WORDS = [['The', 'scary', 'part'], ["isn't", 'quitting.'], ["It's", 'month', 'two.'], ['Month', 'one', 'feels'], ['like', 'a', 'vacation.']];
const WORD = 0.27, CHUNK_HOLD = 0.32;  // one word to the next; a chunk's last word to the next chunk

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the window's px to frame px
// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const PTR_AT = 0.4;                              // full frame: the Studio page reads, then the pointer sets off
const PTR_MOVE = 0.5;                            // the pointer travelling to Schedule
const PRESS_AT = 0.06;                           // arrived, then the press
const TOAST_AT = 0.1, TOAST_IN = 0.2;            // the press, then the toast rising in
const TOAST_HOLD = 0.9;                          // the toast reads, then the time skip
const SKIP_IN = 0.25;                            // the page dimming, the clock pill coming up
const FLIP_AT = 0.3, FLIP = 0.24;                // the skip starting to the clock flipping to 7:00 PM
const LIVE_AT = 0.65, LIVE_IN = 0.3;             // the skip starting to the tiktok.com page landing (.tt-live)
const COUNT_AT = 0.25, COUNT = 2.0;              // the page landed to the counts climbing (easeOut)
const HEART_AT = 0.55, HEART_POP = 0.3;          // the page landed to the heart turning red
const CM_AT = 0.6, CM_STAGGER = 0.3, CM_IN = 0.35; // the comments sliding in, one by one
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="tk-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const st = (d) => svg(d, 'tk-st');
const fl = (d) => svg(d, 'tk-fl');
const I = {
  home: st('<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z"/>'),
  posts: st('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m10 8.8 5 3.2-5 3.2z"/>'),
  chart: st('<path d="M4 20h16M7 16.5v-5M12 16.5v-9M17 16.5v-7"/>'),
  bubble: st('<path d="M4 5h16v11H9.5L5 20v-4H4z"/>'),
  bulb: st('<path d="M9 17.5h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
  cap: st('<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z"/><path d="M6.5 11v5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2v-5M21.5 9v5"/>'),
  plus: st('<path d="M12 5v14M5 12h14"/>'),
  search: st('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>'),
  compass: st('<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  follow: st('<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 20a7 7 0 0 1 14 0M18 8v6M15 11h6"/>'),
  friends: st('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  live: st('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="m8 2.5 4 3.5 4-3.5"/>'),
  plane: st('<path d="M21 3.5 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/>'),
  bell: st('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>'),
  user: st('<circle cx="12" cy="8" r="4"/><path d="M4 20.5a8 8 0 0 1 16 0"/>'),
  upload: st('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>'),
  chev: st('<path d="m6 9 6 6 6-6"/>'),
  cal: st('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  clock: st('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  video: st('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9.2 4.8 2.8-4.8 2.8z"/>'),
  close: st('<path d="m6 6 12 12M18 6 6 18"/>'),
  up: st('<path d="m6 15 6-6 6 6"/>'),
  more: fl('<circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/>'),
  heart: fl('<path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11z"/>'),
  cmt: fl('<path d="M12 3.5c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.8-.1-2.6-.3L5 20.5l.9-3.6C4 15.5 3 13.5 3 11.2 3 6.9 7 3.5 12 3.5z"/>'),
  save: fl('<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1z"/>'),
  share: fl('<path d="M13.5 4.5 22 12l-8.5 7.5V15c-5 0-8.5 1.5-11 5.5.8-6 4-10.5 11-11.5z"/>'),
  note: fl('<path d="M9 17.5V6l11-2.5v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15" r="2.5"/>'),
  check: '<svg class="tk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  okc: '<svg class="tk-okc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
};
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const fmtLikes = (n) => (n >= 10000 ? `${(Math.floor(n / 100) / 10).toFixed(1)}K` : fmt(n));
const capHTML = (cls = '') => `${esc(CAP_TEXT)} ${TAGS.map((h) => `<b class="${cls}">${esc(h)}</b>`).join(' ')}`;

// a canvas the clip plays on: the frame for t is floor((t - t0) * 15) mod 90
function player(c, key) { return { c, key, x: c.getContext('2d'), i: -1 }; }
function drawClip(p, t, t0) {
  const i = ((Math.floor((t - t0) * FPS_CLIP) % NF) + NF) % NF;
  if (i !== p.i) { p.x.drawImage(CLIP[i], 0, 0, p.c.width, p.c.height); p.i = i; }
}
// the burned-in captions for t: the chunk being spoken, its words popping in one by one
const CHUNKS = (() => { let a = 0; return WORDS.map((w) => { const c = { w, a }; a += w.length * WORD + CHUNK_HOLD; c.b = a; return c; }); })();
const CAP_LOOP = CHUNKS[CHUNKS.length - 1].b;
function captionsFor(t, t0) {
  const u = (((t - t0) % CAP_LOOP) + CAP_LOOP) % CAP_LOOP;
  const c = CHUNKS.find((k) => u >= k.a && u < k.b) || CHUNKS[0];
  return c.w.map((w, j) => ({ w, p: seg(u, c.a + j * WORD, c.a + j * WORD + 0.12), key: `${c.a}:${j}` }));
}
function renderCaps(el, t, t0) {
  const ws = captionsFor(t, t0);
  const key = ws.map((w) => w.key).join('|');
  if (el.dataset.k !== key) { el.innerHTML = ws.map((w) => `<span>${esc(w.w)}</span>`).join(' '); el.dataset.k = key; }
  [...el.children].forEach((s, j) => {
    const p = ws[j].p;
    s.style.opacity = p > 0 ? '1' : '0';
    s.style.transform = p > 0 && p < 1 ? `scale(${(1.18 - 0.18 * outCubic(p)).toFixed(3)})` : 'none';
  });
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, uploaded, scheduled: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: TikTok Studio
    T.ptr = T.full + PTR_AT;                          // the pointer sets off for Schedule
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;                    // the press on Schedule
    T.toast = T.press + TOAST_AT;                     // "Your video is scheduled for 7:00 PM"
    T.skip = T.toast + TOAST_HOLD;                    // the time skip: dim, the clock pill
    T.flip = T.skip + FLIP_AT;                        // the clock flips to 7:00 PM
    T.live = T.skip + LIVE_AT;                        // the tiktok.com page lands (.tt-live opacity rises from 0)
    T.c0 = T.live + COUNT_AT; T.c1 = T.c0 + COUNT;    // the counts climb
    T.heart = T.live + HEART_AT;                      // the heart turns red
    T.cm = COMMENTS.map((_, i) => T.live + CM_AT + i * CM_STAGGER); // the comments slide in
    T.settle = Math.max(T.c1, T.cm[COMMENTS.length - 1] + CM_IN, T.heart + HEART_POP); // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('tiktok-logo.svg');
    const cover = x.img('cover-frame.jpg');
    const tile = (cls = '') => `<img class="tk-mark ${cls}" src="${mark}" alt=""/>`;

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say tk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="tk-ct tk-ct-tt">${tile()}</span>`, '<b>superbot connected to TikTok</b>'],
      [`<span class="tk-ct">${I.video}</span>`, `Uploaded <b>${esc(FILE)}</b>`],
      [`<span class="tk-ct">${I.clock}</span>`, 'Scheduled for <b>7:00 PM</b>'],
    ];
    const card = x.el(`<div class="tk-card">
      ${steps.map(([icon, txt]) => `<div class="tk-step">${icon}<span class="tk-tx">${txt}</span><span class="tk-ok"><i class="tk-spin"></i>${I.check}</span></div>`).join('')}
      <div class="tk-shot"></div>
    </div>`);
    const shot = card.querySelector('.tk-shot');
    const checks = [...card.querySelectorAll('.tk-ok')].map((n) => ({ spin: n.querySelector('.tk-spin'), ck: n.querySelector('.tk-ck') }));

    // ---- TikTok Studio: the upload page, light ----
    const NAV = [['home', 'Home'], ['posts', 'Posts'], ['chart', 'Analytics'], ['bubble', 'Comments'], ['bulb', 'Inspiration'], ['cap', 'Creator Academy']];
    const toggle = (label) => `<span class="ts-tg"><span>${label}</span><i class="ts-sw"><i></i></i></span>`;
    const studio = `<section class="tk-studio">
      <aside class="ts-side">
        <div class="ts-brand">${tile()}<b>TikTok Studio</b></div>
        <span class="ts-up">${I.plus}<b>Upload</b></span>
        <nav class="ts-nav">${NAV.map(([i, n]) => `<span class="ts-ni">${I[i]}<b>${n}</b></span>`).join('')}</nav>
        <div class="ts-back"><span>Back to TikTok</span></div>
      </aside>
      <main class="ts-main">
        <header class="ts-top"><b>Upload video</b><span class="ts-me"><i class="ts-av">D</i><span>${esc(NAME)}</span></span></header>
        <div class="ts-body">
          <div class="ts-col">
            <div class="ts-file">
              <span class="ts-fi">${I.video}</span>
              <div class="ts-fm"><b>${esc(FILE)}</b><span class="ts-fs">${I.okc}<span>Uploaded</span><i>&middot;</i><span>12.4 MB</span><i>&middot;</i><span>0:45</span></span></div>
              <span class="ts-repl">Replace</span>
              <i class="ts-bar"></i>
            </div>
            <div class="ts-card ts-det">
              <h3>Details</h3>
              <div class="ts-dr">
                <div class="ts-dl">
                  <label>Description</label>
                  <div class="ts-desc"><p>${capHTML('ts-hash')}</p>
                    <div class="ts-dft"><span class="ts-chip"><b>#</b> Hashtags</span><span class="ts-cnt">${CAPTION.length}/4000</span></div></div>
                </div>
                <div class="ts-cv">
                  <label>Cover</label>
                  <div class="ts-cvb">${coverHTML(cover, 'ts-cover')}</div><span class="ts-edit">Edit cover</span>
                </div>
              </div>
            </div>
            <div class="ts-card ts-set">
              <h3>Settings</h3>
              <div class="ts-sr">
                <div class="ts-sc">
                  <label>When to post</label>
                  <div class="ts-radios"><span class="ts-rd"><i></i>Now</span><span class="ts-rd on"><i></i>Schedule</span></div>
                  <div class="ts-fields"><span class="ts-fd">${I.cal}<b>Oct 3</b>${I.chev}</span><span class="ts-fd">${I.clock}<b>7:00 PM</b>${I.chev}</span></div>
                </div>
                <div class="ts-sc">
                  <label>Who can watch this video</label>
                  <span class="ts-sel"><b>Everyone</b>${I.chev}</span>
                  <div class="ts-tgs">${toggle('Allow comments')}${toggle('Duet')}${toggle('Stitch')}</div>
                </div>
              </div>
            </div>
            <div class="ts-acts"><span class="ts-btn ts-pri">Schedule</span><span class="ts-btn">Discard</span></div>
          </div>
          <div class="ts-prev">
            <div class="ts-phone"><canvas class="tk-cv" width="540" height="960"></canvas><i class="tk-shade"></i>
              <div class="ts-ptabs"><span>Following</span><b>For You</b></div>
              <div class="tk-caps"></div>
              <div class="ts-prail"><i class="ts-pav">D</i>${I.heart}${I.cmt}${I.save}${I.share}</div>
              <div class="ts-pinfo"><b>${esc(NAME)}</b><p>${capHTML()}</p><span>${I.note}${esc(SOUND)}</span></div>
            </div>
            <span class="ts-pl">Preview</span>
          </div>
        </div>
      </main>
      <div class="ts-toast">${I.okc}<span>Your video is scheduled for 7:00 PM</span></div>
    </section>`;

    // ---- the time skip ----
    const skip = `<div class="tk-skip"><span class="tk-clock"><i class="tk-dot"></i><span class="tk-flip"><b class="tk-f0">6:59 PM</b><b class="tk-f1">7:00 PM</b></span></span></div>`;

    // ---- tiktok.com: the video page, dark (wide) and the mobile video screen (tall) ----
    const LNAV = [['home', 'For You', true], ['compass', 'Explore'], ['follow', 'Following'], ['friends', 'Friends'], ['live', 'LIVE'], ['plane', 'Messages'], ['bell', 'Activity'], ['upload', 'Upload']];
    const acts = (cls) => [['heart', 'likes'], ['cmt', 'comments'], ['save', 'saves'], ['share', 'shares']]
      .map(([i, kk]) => `<span class="${cls} ${cls}-${kk}"><i class="tl-ab">${I[i]}</i><b data-k="${kk}">0</b></span>`).join('');
    const comment = ([n, c, txt, likes]) => `<div class="tl-cm"><i class="tl-cav" style="--c:${c}">${esc(n[0].toUpperCase())}</i>
      <div class="tl-cb"><b>${esc(n)}</b><p>${esc(txt)}</p><span>Today<i>&middot;</i>Reply</span></div>
      <span class="tl-cl">${I.heart}<b>${fmt(likes)}</b></span></div>`;
    const wide = `<div class="tl-wide">
      <aside class="tl-nav">
        <div class="tl-logo">${tile()}<b>TikTok</b></div>
        <span class="tl-search">${I.search}<span>Search</span></span>
        ${LNAV.map(([i, n, on]) => `<span class="tl-ni${on ? ' on' : ''}">${I[i]}<b>${n}</b></span>`).join('')}
        <span class="tl-ni"><i class="tl-me">D</i><b>Profile</b></span>
      </aside>
      <div class="tl-stage">
        <canvas class="tk-cv tl-bg" width="270" height="480"></canvas><i class="tl-dim"></i>
        <div class="tl-vid"><canvas class="tk-cv" width="540" height="960"></canvas><i class="tk-shade"></i><div class="tk-caps"></div><i class="tl-prog"><i></i></i></div>
        <span class="tl-x">${I.close}</span>
        <span class="tl-arw"><i>${I.up}</i><i class="tl-dn">${I.up}</i></span>
      </div>
      <aside class="tl-side">
        <div class="tl-cr"><i class="tl-av">D</i><div><b>${esc(NAME)}</b><span>${esc(USER)}<i>&middot;</i>Today 7:00 PM</span></div><span class="tl-fol">Follow</span></div>
        <p class="tl-cap">${capHTML('tl-hash')}</p>
        <div class="tl-snd">${I.note}<span>${esc(SOUND)}</span></div>
        <div class="tl-acts">${acts('tl-a')}</div>
        <div class="tl-tabs"><b>Comments (${fmt(COUNTS.comments)})</b><span>Creator videos</span></div>
        <div class="tl-cms">${COMMENTS.map(comment).join('')}</div>
        <div class="tl-add"><span>Add comment...</span></div>
      </aside>
    </div>`;
    const tall = `<div class="tl-tall">
      <canvas class="tk-cv tl-full" width="540" height="960"></canvas><i class="tl-tshade"></i>
      <div class="tl-ttop">${I.live}<span class="tl-tt"><span>Following</span><b>For You</b></span>${I.search}</div>
      <div class="tk-caps tl-tcaps"></div>
      <div class="tl-rail">
        <span class="tl-rav"><i>D</i><b>${I.plus}</b></span>
        ${acts('tl-r')}
        <span class="tl-disc"><i>D</i></span>
      </div>
      <div class="tl-info"><b>${esc(NAME)}</b><p>${capHTML('tl-hash')}</p><span class="tl-snd">${I.note}<span>${esc(SOUND)}</span></span></div>
      <nav class="tl-tab">${[['home', 'Home'], ['friends', 'Friends']].map(([i, n], j) => `<span class="${j ? '' : 'on'}">${I[i]}<b>${n}</b></span>`).join('')}<span class="tl-cr8"><i>${I.plus}</i></span>${[['bubble', 'Inbox'], ['user', 'Profile']].map(([i, n]) => `<span>${I[i]}<b>${n}</b></span>`).join('')}</nav>
    </div>`;

    const layer = x.el(`<div class="tk-full" aria-hidden="true"><div class="tk-app">${studio}${skip}<section class="tt-live">${wide}${tall}</section></div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const live = $('.tt-live'), skipEl = $('.tk-skip'), f0 = $('.tk-f0'), f1 = $('.tk-f1');
    const toast = $('.ts-toast'), btn = $('.ts-pri');
    // the players: the Studio preview, the wide page's backdrop and its clip, the tall page's full-bleed clip
    const P = {
      prev: player($('.ts-phone canvas')),
      bg: player($('.tl-bg')),
      wide: player($('.tl-vid canvas')),
      tall: player($('.tl-full')),
    };
    const caps = { prev: $('.ts-phone .tk-caps'), wide: $('.tl-vid .tk-caps'), tall: $('.tl-tcaps') };
    const prog = $('.tl-prog i');
    const counts = [...app.querySelectorAll('[data-k]')].map((n) => ({ n, k: n.dataset.k, s: '' }));
    const hearts = [...app.querySelectorAll('.tl-a-likes, .tl-r-likes')];
    const cms = [...app.querySelectorAll('.tl-cm')];
    const disc = $('.tl-disc');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tallMode = false;
    let AW = 1536, AH = 864;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layouts
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tallMode = W < H;
      const s = tallMode ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('tk-narrow', tallMode);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('tk-tall', tallMode);
      Object.values(P).forEach((p) => { p.i = -1; });
    };

    // the Schedule button's centre in the window's own px (transform-free: the window's rect over its current scale)
    const btnPt = () => {
      const a = app.getBoundingClientRect(), b = btn.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.42) / sc, y: (b.top - a.top + b.height * 0.58) / sc };
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
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (t < T.card) return;

        // ---- Studio: the preview plays; the Schedule press; the toast ----
        const onLive = t >= T.live + LIVE_IN;
        if (!onLive && !tallMode) { drawClip(P.prev, t, T.card); renderCaps(caps.prev, t, T.card); }
        const pr = press(t, T.press);
        btn.style.transform = pr > 0 ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : '';
        btn.style.filter = pr > 0 ? `brightness(${(1 - 0.16 * pr).toFixed(3)})` : '';
        const ti = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        toast.style.opacity = ti.toFixed(3);
        toast.style.transform = `translate(-50%, ${((1 - ti) * -14).toFixed(2)}px)`;

        // ---- the time skip: the page dims, the clock pill flips to 7:00 PM ----
        const sk = outCubic(seg(t, T.skip, T.skip + SKIP_IN));
        skipEl.style.opacity = sk.toFixed(3);
        skipEl.style.setProperty('--pill', outCubic(seg(t, T.skip + 0.05, T.skip + 0.3)).toFixed(3));
        const fp = inOutCubic(seg(t, T.flip, T.flip + FLIP));
        f0.style.transform = `translateY(${(-100 * fp).toFixed(2)}%) rotateX(${(80 * fp).toFixed(1)}deg)`;
        f0.style.opacity = (1 - fp).toFixed(3);
        f1.style.transform = `translateY(${(100 * (1 - fp)).toFixed(2)}%) rotateX(${(-80 * (1 - fp)).toFixed(1)}deg)`;
        f1.style.opacity = fp.toFixed(3);
        skipEl.style.setProperty('--dot', (t >= T.flip + FLIP ? 0.55 + 0.45 * Math.cos((t - T.flip) * 9) : 0.35).toFixed(3));

        // ---- tiktok.com: the page lands, the clip plays, the counts climb, the comments slide in ----
        const lv = outCubic(seg(t, T.live, T.live + LIVE_IN));
        live.style.opacity = lv.toFixed(3);
        live.style.transform = lv >= 1 ? 'none' : `scale(${lerp(1.03, 1, lv).toFixed(4)})`;
        if (t >= T.live) {
          if (tallMode) { drawClip(P.tall, t, T.live); renderCaps(caps.tall, t, T.live); }
          else { drawClip(P.bg, t, T.live); drawClip(P.wide, t, T.live); renderCaps(caps.wide, t, T.live); }
          prog.style.transform = `scaleX(${(((t - T.live) / 45) + 0.02).toFixed(4)})`;
        }
        const c = outCubic(seg(t, T.c0, T.c1));
        counts.forEach((o) => {
          const v = COUNTS[o.k] * c;
          const s = o.k === 'likes' ? fmtLikes(v) : fmt(v);
          if (s !== o.s) { o.n.textContent = s; o.s = s; }
        });
        const hp = seg(t, T.heart, T.heart + HEART_POP);
        hearts.forEach((h) => {
          h.classList.toggle('on', t >= T.heart);
          const ic = h.firstElementChild;
          ic.style.transform = hp > 0 && hp < 1 ? `scale(${(1 + 0.32 * Math.sin(Math.PI * hp)).toFixed(4)})` : '';
        });
        cms.forEach((m, i) => {
          const q = outCubic(seg(t, T.cm[i], T.cm[i] + CM_IN));
          m.style.opacity = q.toFixed(3);
          m.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * 24).toFixed(2)}px)`;
        });
        disc.style.transform = `rotate(${(((t - T.live) * 72) % 360).toFixed(1)}deg)`;
      },
      // the pointer: it sets off from the description for Schedule, presses it, and fades as the toast reads.
      // In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (t < T.ptr - 0.15 || t > T.toast + 0.6) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const bp = btnPt();
        const from = { x: bp.x + (tallMode ? 260 : 520), y: bp.y - (tallMode ? 300 : 360) };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.toast + 0.3, T.toast + 0.6));
        return { x: lerp(from.x, bp.x, m) * s, y: lerp(from.y, bp.y, m) * s, p: press(t, T.press), v };
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
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
