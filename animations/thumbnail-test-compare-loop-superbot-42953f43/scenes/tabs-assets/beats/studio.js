// Studio beat: superbot runs a Test & compare round in YouTube Studio itself. opts.round picks the round.
// In the chat: the line streams and the checklist card lands ("Connected as Sam Rivera", the video, the upload),
// spinners turning to checks, with Studio's window in the card. Then that window opens to the full frame: the video's
// details page (Title, Description, Thumbnail), and superbot's labelled pointer drives Test & compare: the dialog with
// the round's three thumbnails uploaded, Done, then the Thumbnail section's test panel with its "Testing" chip under a
// time-lapse day counter (Day 1 to Day 6) while each thumbnail's watch time share grows, "Test complete", and the
// Winner label. Round 1 (A, B, C: B wins with 47.3%) then closes back into the card and the chat goes on. Round 2
// (B, B2, B3: B2 wins with 44.8%) presses "Set as thumbnail" on the winner, the video's thumbnail becomes B2, the
// pointer opens Analytics and the Reach tab shows impressions click-through rate stepping up after each round (3.9% to
// 5.2% to 6.4%) and views 48,210 to 91,530, then superbot's result toast: 2 rounds, 6 thumbnails tested, 0 clicks
// from Sam.
// ONE Studio client per round, on a layer in the scene root (outside the camera): while the checklist card sits in
// chat the layer is pinned over the card's window (.gk-shot); GROW interpolates it to the whole frame. Studio's type
// is Roboto (vendored, studio.css) on YouTube's light palette (chat.css --yt-*). Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=42953f43';
import { ACCOUNT, VIDEO, THUMBS, ROUNDS, DAYS } from './studio-data.js?v=42953f43';

const COPY = {
  1: {
    say: 'Running Test & compare in your YouTube Studio, as you.',
    steps: [['avatar', `Connected as <b>${ACCOUNT}</b>`], ['video-library-outline', `Content › <b>${VIDEO.title}</b>`], ['compare', 'Thumbnail › Test & compare › <b>A, B, C</b> uploaded']],
  },
  2: {
    say: 'Same video, new test: B against B2 and B3.',
    steps: [['avatar', `Connected as <b>${ACCOUNT}</b>`], ['compare', 'Test & compare › <b>B, B2, B3</b> uploaded']],
  },
};
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const DESC = 'I filmed this whole video on both webcams. The $40 one won more of my tests than it had any right to.';
const APP_SCALE = 1.2;                           // full frame: the client's px to frame px
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const CPS = 80;
const CARD_AT = 0.15;                            // the line starts, then the checklist card lands
const CARD_IN = 0.3;
const CHECK_AT = 0.25;                           // the card landing to the first check
const CHECK_STAGGER = 0.16;
const POP = 0.16;
const CARD_HOLD = 0.2; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to full frame (and round 1 closes back)
const DLG_AT = 0.1;                              // full frame to the Test & compare dialog
const DLG_IN = 0.25;
const SLOT_AT = 0.2;                             // the dialog landing to the first thumbnail uploading in
const SLOT_STAGGER = 0.15;
const SLOT_IN = 0.28;
const TAP_AT = 0.32;                             // the last thumbnail in to Done being pressed
const PTR_MOVE = 0.42;                           // the pointer's travel onto a target, ending just before the press
const CLOSE = 0.22;                              // the dialog closing
const PANEL_IN = 0.3;                            // the test panel opening in the Thumbnail section
const LAPSE_AT = 0.22;                           // the panel open to Day 1
const DAY = 0.28; /* deliberate */                // one test day of the time-lapse (Day 1 to Day 6)
const DONE_AT = 0.12;                            // Day 6 to "Test complete"
const WIN_AT = 0.15;                             // "Test complete" to the Winner label
const WIN_IN = 0.28;
const R1_HOLD = 0.85; /* deliberate */            // round 1's result holds, readable, before the window closes back
const SET_AT = 0.3;                              // round 2: the Winner label to the pointer setting off for Set as thumbnail
const APPLY = 0.1;                               // the press to the thumbnail changing and the snackbar
const NAV_AT = 0.8;                             // the press to the pointer setting off for Analytics
const PAGE = 0.3;                                // the details page crossfading to Analytics
const DRAW = 1.0; /* deliberate */               // the CTR line drawing across the 12 days, the numbers counting with it
const TOAST_AT = 0.7;                            // the page in to superbot's result toast
const TOAST_IN = 0.3;
const READ = 0.8; /* deliberate */              // the final state holds, readable, before the scene's fade

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PTR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>';
const pct = (v) => `${v.toFixed(1)}%`;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const num = (s) => parseFloat(String(s).replace(/[^0-9.]/g, ''));
// a day-by-day share for slot i: noisy early, settling onto the final value by Day 6 (fixed, so every render matches)
const WOBBLE = [[4.1, -2.6, 1.8, -1.1, 0.6, 0], [-3.4, 2.2, -1.5, 0.9, -0.4, 0], [-0.7, 0.4, -0.3, 0.2, -0.2, 0]];

export default {
  times(r, opts = {}) {
    const round = opts.round || 1;
    const T = { r, round };
    const n = COPY[round].steps.length;
    T.list = r + CARD_AT;
    T.ok = COPY[round].steps.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[n - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.dlg = T.full + DLG_AT;
    T.slot = [0, 1, 2].map((i) => T.dlg + SLOT_AT + i * SLOT_STAGGER);
    T.tap = T.slot[2] + SLOT_IN + TAP_AT;
    T.close = T.tap + 0.08;
    T.panel = T.close + CLOSE * 0.6;
    T.d0 = T.panel + LAPSE_AT;                    // Day 1
    T.d1 = T.d0 + (DAYS - 1) * DAY;               // Day 6
    T.done = T.d1 + DONE_AT;                      // Test complete
    T.win = T.done + WIN_AT;
    if (round === 1) {
      T.shrink = T.win + WIN_IN + R1_HOLD;
      T.end = T.shrink + GROW;
    } else {
      T.set = T.win + WIN_IN + SET_AT + PTR_MOVE; // Set as thumbnail pressed
      T.apply = T.set + APPLY;
      T.nav = T.set + NAV_AT + PTR_MOVE;          // Analytics pressed
      T.page = T.nav + 0.06;
      T.draw = T.page + PAGE;
      T.toast = T.page + TOAST_AT;
      T.end = Math.max(T.draw + DRAW, T.toast + TOAST_IN) + READ;
    }
    return T;
  },
  build(k, x) {
    const T = k.T;
    const round = T.round;
    const R = ROUNDS[round], C = COPY[round];
    const icon = (f) => x.brand(f);
    if (round === 2) window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.apply });

    // ---- the checklist card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(C.say)}</span></div>`);
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>' : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${C.steps.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame YouTube Studio client ----
    const cur0 = round === 1 ? 'thumbs/old.jpg' : THUMBS.B[2];          // the video's thumbnail going into the round
    const curW = THUMBS[R.ids[R.win]][2];                               // ...and the winner (round 2 sets it)
    const col = (id, i) => `<div class="st-tc" data-i="${i}">
        <span class="st-tim"><img src="${x.img(THUMBS[id][2])}" width="1280" height="720" alt=""/></span>
        <span class="st-tl"><b>Thumbnail ${id}</b><em class="st-win">Winner</em></span>
        <span class="st-share"><i class="st-sbar"><i></i></i><span class="st-sv">0.0%</span></span>
        ${round === 2 && i === R.win ? '<span class="st-set">Set as thumbnail</span>' : ''}
      </div>`;
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
          ${NAV.map(([ic, label]) => `<div class="st-nv" data-k="${label}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <div class="st-pages">
        <section class="st-page st-det">
          <div class="st-h1row"><h1 class="st-h1">Video details</h1><span class="st-undo">Undo changes</span><span class="st-save">Save</span></div>
          <div class="st-cols">
            <div class="st-form">
              <div class="st-field"><small>Title (required)</small><span>${esc(VIDEO.title)}</span></div>
              <div class="st-field st-desc"><small>Description</small><span>${esc(DESC)}</span></div>
              <div class="st-sec"><b>Thumbnail</b><p>Set a thumbnail that stands out and draws viewers' attention.</p></div>
              <div class="st-tbox">
                <div class="st-opts">
                  <span class="st-opt">${ms('upload')}<em>Upload file</em></span>
                  <span class="st-opt">${ms('photo-library-outline')}<em>Auto-generated</em></span>
                  <span class="st-opt st-otc">${ms('compare')}<em>Test &amp; compare</em></span>
                  <span class="st-cur"><img src="${x.img(cur0)}" width="1280" height="720" alt=""/></span>
                </div>
                <div class="st-test">
                  <div class="st-thd"><b>Test &amp; compare</b><span class="st-chip-s"><i class="st-dot"></i>${ms('check-circle', 'st-cki')}<span class="st-stx">Testing</span></span>
                    <span class="st-lapse">${ms('schedule-outline')}<span class="st-dayn">Day 1</span><small>of ${DAYS}</small></span>
                    <span class="st-metric">Watch time share</span></div>
                  <div class="st-tcols">${R.ids.map(col).join('')}</div>
                </div>
              </div>
            </div>
            <aside class="st-side">
              <div class="st-player"><img class="st-p0" src="${x.img(cur0)}" width="1280" height="720" alt=""/><img class="st-p1" src="${x.img(curW)}" width="1280" height="720" alt=""/>
                <em class="st-pwin">Winner</em><i class="st-dur">${VIDEO.len}</i></div>
              <div class="st-kv"><small>Video link</small><span class="st-link">${esc(VIDEO.link)}</span></div>
              <div class="st-kv"><small>Filename</small><span>${esc(VIDEO.file)}</span></div>
              <div class="st-kv"><small>Video length</small><span>${VIDEO.len}</span></div>
            </aside>
          </div>
        </section>
        ${round === 2 ? `<section class="st-page st-ana">
          <h1 class="st-h1">Video analytics</h1>
          <div class="st-avid"><img src="${x.img(curW)}" width="1280" height="720" alt=""/><span><b>${esc(VIDEO.title)}</b><small>Thumbnail B2 · Winner</small></span></div>
          <div class="st-tabs"><span class="st-tab">Overview</span><span class="st-tab st-tab-on">Reach</span><span class="st-tab">Engagement</span><span class="st-tab">Audience</span></div>
          <div class="st-reach">
            <div class="st-kpis">
              <div class="st-kpi st-kon"><small>Impressions click-through rate</small><b class="st-kctr">${VIDEO.ctr0}</b><em>${VIDEO.ctr0} before the test</em></div>
              <div class="st-kpi"><small>Views</small><b class="st-kviews">${VIDEO.views}</b><em>${VIDEO.views} before the test</em></div>
            </div>
            <div class="st-chart">
              <svg class="st-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
                ${[3, 4, 5, 6, 7].map((v) => `<line class="st-grid" x1="0" x2="1000" y1="${300 - (v - 3) * 70}" y2="${300 - (v - 3) * 70}"/>`).join('')}
                <line class="st-rnd" x1="333" x2="333" y1="0" y2="300"/><line class="st-rnd" x1="666" x2="666" y1="0" y2="300"/>
                <path class="st-line" d="M0 237 L333 237 L333 146 L666 146 L666 62 L1000 62" pathLength="1"/>
              </svg>
              <span class="st-yl" style="top: ${(237 / 300 * 100).toFixed(2)}%">${VIDEO.ctr0}</span>
              <span class="st-yl st-y1" style="top: ${(146 / 300 * 100).toFixed(2)}%">${VIDEO.ctr1}</span>
              <span class="st-yl st-y2" style="top: ${(62 / 300 * 100).toFixed(2)}%">${VIDEO.ctr2}</span>
              <span class="st-mk" style="left: 33.3%"><b>Round 1</b>B set</span>
              <span class="st-mk st-mk2" style="left: 66.6%"><b>Round 2</b>B2 set</span>
              <div class="st-xl"><span>Day 0</span><span>Day 6</span><span>Day 12</span></div>
            </div>
          </div>
        </section>` : ''}
        </div>
      </div>
      <div class="st-dlgw"><div class="st-dlg">
        <div class="st-dh"><b>Test &amp; compare</b>${ms('close')}</div>
        <p class="st-dp">Add up to 3 thumbnails. YouTube shows them to viewers at random and picks the one with the highest watch time share.</p>
        <div class="st-slots">${R.ids.map((id) => `<div class="st-slot"><span class="st-sim"><img src="${x.img(THUMBS[id][2])}" width="1280" height="720" alt=""/></span><span>Thumbnail ${id}</span></div>`).join('')}</div>
        <div class="st-df"><span class="st-dinfo">${ms('info-outline')}Results can take a few days to 2 weeks</span><span class="st-dc">Cancel</span><span class="st-done">Done</span></div>
      </div></div>
      <div class="st-snack">Thumbnail B2 set as the video's thumbnail</div>
      ${round === 2 ? `<div class="st-toast"><span class="st-sbm"><img src="${x.sbSrc}" alt=""/></span><span><b>B2 is your thumbnail.</b> 2 rounds · 6 thumbnails tested · 0 clicks from Sam</span></div>` : ''}
      <div class="st-ptr">${PTR}<i>superbot</i></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const navs = Object.fromEntries([...layer.querySelectorAll('.st-nv[data-k]')].map((n) => [n.dataset.k, n]));
    const dlgw = $('.st-dlgw'), dlg = $('.st-dlg'), done = $('.st-done');
    const slots = [...layer.querySelectorAll('.st-slot')];
    const opts = $('.st-opts'), test = $('.st-test'), chipS = $('.st-chip-s'), stx = $('.st-stx'), lapse = $('.st-lapse'), dayn = $('.st-dayn');
    const cols = [...layer.querySelectorAll('.st-tc')].map((n) => ({
      n, bar: n.querySelector('.st-sbar i'), sv: n.querySelector('.st-sv'), win: n.querySelector('.st-win'), set: n.querySelector('.st-set'),
    }));
    const p1 = $('.st-p1'), pwin = $('.st-pwin'), snack = $('.st-snack');
    const det = $('.st-det'), ana = $('.st-ana'), toast = $('.st-toast');
    const kctr = $('.st-kctr'), kviews = $('.st-kviews'), line = $('.st-line');
    const yl = [...layer.querySelectorAll('.st-yl')], mk = [...layer.querySelectorAll('.st-mk')];
    const ptrEl = $('.st-ptr');
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, txt = {};
    let AW = 1600, AH = 900;
    const setText = (key, node, s) => { if (txt[key] !== s) { node.textContent = s; txt[key] = s; } };

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      shot.style.aspectRatio = `${W} / ${H}`;
    };
    // a node's centre in the app's own px (offset geometry ignores the layer's scale)
    const at = (node, fx = 0.5, fy = 0.5) => {
      let px = 0, py = 0;
      for (let n = node; n && n !== app; n = n.offsetParent) { px += n.offsetLeft; py += n.offsetTop; }
      return { x: px + node.offsetWidth * fx, y: py + node.offsetHeight * fy };
    };
    // superbot's pointer: [arrive, press, target] legs; it rests where it last pressed and fades out after the last
    const legs = round === 1 ? [[T.tap, () => at(done, 0.5, 0.55)]]
      : [[T.tap, () => at(done, 0.5, 0.55)], [T.set, () => at(cols[R.win].set, 0.5, 0.55)], [T.nav, () => at(navs.Analytics, 0.32, 0.5)]];
    // the camera inside Studio: [time, node (null = the whole page), zoom], eased from one to the next. It pushes in
    // on the dialog, then on the test panel while the days run and the winner lands (round 1 keeps that framing as
    // the window closes back into the card); round 2 pulls out for the trip to Analytics and settles on the Reach card
    const reach = $('.st-reach');
    const shots = [[T.full, null, 1], [T.dlg + 0.05, null, 1], [T.dlg + 0.45, dlg, 1.3], [T.close + 0.05, dlg, 1.3], [T.panel + 0.45, test, 1.55]];
    // (round 2 pulls out right after the press so the player turning B2 and the snackbar are in shot)
    if (round === 2) shots.push([T.set + 0.02, test, 1.55], [T.apply + 0.45, null, 1], [T.page + 0.05, null, 1], [T.page + 0.6, reach, 1.12]);
    const cam = (t) => {
      const pt = ([, node, z]) => ({ ...(node ? at(node) : { x: AW / 2, y: AH / 2 }), z });
      if (t <= shots[0][0]) return pt(shots[0]);
      for (let i = 1; i < shots.length; i++) {
        if (t <= shots[i][0]) {
          const a = pt(shots[i - 1]), b = pt(shots[i]), f = inOutCubic(seg(t, shots[i - 1][0], shots[i][0]));
          return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), z: lerp(a.z, b.z, f) };
        }
      }
      return pt(shots[shots.length - 1]);
    };
    // a leg whose next leg sets off soon after its press carries straight on; otherwise the pointer fades out after
    // the press and fades back in where it rests, so it never idles at the edge of a pushed-in shot
    const pointer = (t) => {
      let from = { x: AW * 0.78, y: AH * 0.92 };
      for (let i = 0; i < legs.length; i++) {
        const [tap, tgt] = legs[i];
        const to = tgt();
        const s = tap - 0.08 - PTR_MOVE;
        const next = legs[i + 1] ? legs[i + 1][0] - 0.08 - PTR_MOVE : Infinity;
        const chained = next - tap < 0.9;
        const prevChained = i > 0 && s - legs[i - 1][0] < 0.9;
        const a = prevChained ? legs[i - 1][0] + 0.2 : s - 0.15;
        const e = chained ? next : tap + 0.5;
        if (t >= a && t < e) {
          const m = inOutCubic(seg(t, s, tap - 0.08));
          const vin = prevChained ? 1 : seg(t, a, s);
          const vout = chained ? 1 : 1 - seg(t, tap + 0.25, e);
          return { x: lerp(from.x, to.x, m), y: lerp(from.y, to.y, m), p: press(t, tap), v: vin * vout };
        }
        from = to;
      }
      return null;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(C.say, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = C.say.slice(0, n); hid.textContent = C.say.slice(n); shown = n; }
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

        // nav: Content while on the video, Analytics once the pointer opens it (round 2)
        const onAna = round === 2 && t >= T.nav;
        navs.Content.classList.toggle('st-on', !onAna);
        navs.Analytics.classList.toggle('st-on', onAna);

        // the dialog: opens, the three thumbnails upload in, Done is pressed, it closes
        const di = outCubic(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - outCubic(seg(t, T.close, T.close + CLOSE)));
        dlgw.style.opacity = di.toFixed(3);
        dlgw.style.visibility = di > 0.001 ? 'visible' : 'hidden';
        dlg.style.transform = di >= 1 ? 'none' : `scale(${lerp(0.94, 1, di).toFixed(4)})`;
        slots.forEach((s, i) => {
          const o = outCubic(seg(t, T.slot[i], T.slot[i] + SLOT_IN));
          s.style.setProperty('--u', o.toFixed(3));
        });
        const dp = press(t, T.tap);
        done.style.transform = dp ? `scale(${(1 - 0.06 * dp).toFixed(4)})` : 'none';

        // the Thumbnail section: the option row gives way to the test panel
        const pi = outCubic(seg(t, T.panel, T.panel + PANEL_IN));
        opts.style.opacity = (1 - pi).toFixed(3);
        opts.style.visibility = pi >= 1 ? 'hidden' : 'visible';
        test.style.opacity = pi.toFixed(3);
        test.style.transform = pi >= 1 ? 'none' : `translateY(${((1 - pi) * 10).toFixed(2)}px)`;

        // the time-lapse: Day 1 .. Day 6 over the Testing chip, the shares wobbling and settling day by day
        const lap = (t - T.d0) / DAY;                       // 0 at Day 1, 5 at Day 6
        const day = Math.max(1, Math.min(DAYS, 1 + Math.floor(lap + 1e-6)));
        setText('day', dayn, `Day ${day}`);
        const li2 = outCubic(seg(t, T.d0 - 0.15, T.d0 + 0.05)) * (1 - outCubic(seg(t, T.done + 0.25, T.done + 0.5)));
        lapse.style.opacity = li2.toFixed(3);
        lapse.style.transform = `translateY(${((1 - li2) * 6).toFixed(2)}px)`;
        const complete = t >= T.done;
        chipS.classList.toggle('st-ok', complete);
        setText('stx', stx, complete ? 'Test complete' : 'Testing');
        const grow = outCubic(seg(t, T.d0 - 0.1, T.d0 + 0.5));
        cols.forEach((c, i) => {
          const fin = R.share[i];
          const d = Math.max(0, Math.min(DAYS - 1, lap));
          const k0 = Math.floor(d), f = d - k0;
          const wob = lerp(WOBBLE[i][k0], WOBBLE[i][Math.min(DAYS - 1, k0 + 1)], f);
          const v = t >= T.d1 ? fin : (fin + wob) * grow;
          c.bar.style.transform = `scaleX(${(v / 60).toFixed(4)})`;
          setText(`sv${i}`, c.sv, pct(Math.max(0, v)));
          const isWin = i === R.win;
          const w = isWin ? outCubic(seg(t, T.win, T.win + WIN_IN)) : 0;
          c.win.style.opacity = w.toFixed(3);
          c.win.style.transform = `scale(${lerp(0.6, 1, w).toFixed(4)})`;
          c.n.classList.toggle('st-won', isWin && t >= T.win);
          c.n.classList.toggle('st-lost', !isWin && t >= T.win);
          if (c.set) {
            c.set.style.opacity = outCubic(seg(t, T.win + 0.1, T.win + 0.4)).toFixed(3);
            const sp = press(t, T.set);
            c.set.style.transform = sp ? `scale(${(1 - 0.06 * sp).toFixed(4)})` : 'none';
            c.set.classList.toggle('st-hit', t >= T.set);
            setText('set', c.set, t >= T.apply ? 'Thumbnail set ✓' : 'Set as thumbnail');
          }
        });

        if (round === 2) {
          // Set as thumbnail: the player's thumbnail becomes B2 with its Winner label, the snackbar rises
          const ap = outCubic(seg(t, T.apply, T.apply + 0.3));
          p1.style.opacity = ap.toFixed(3);
          pwin.style.opacity = ap.toFixed(3);
          pwin.style.transform = `scale(${lerp(0.6, 1, ap).toFixed(4)})`;
          const sn = outCubic(seg(t, T.apply + 0.05, T.apply + 0.35)) * (1 - seg(t, T.page, T.page + 0.2));
          snack.style.opacity = sn.toFixed(3);
          snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
          // Analytics > Reach
          // the details page clears first, then Analytics comes up (a clean page change, never two pages at once)
          const pg = outCubic(seg(t, T.page + PAGE * 0.4, T.page + PAGE));
          det.style.opacity = (1 - seg(t, T.page, T.page + PAGE * 0.45)).toFixed(3);
          ana.style.opacity = pg.toFixed(3);
          ana.style.visibility = pg > 0 ? 'visible' : 'hidden';
          const dr = inOutCubic(seg(t, T.draw, T.draw + DRAW));
          line.style.strokeDashoffset = (1 - dr).toFixed(4);
          // the KPIs count with the line: CTR steps at each round, views climb across the 12 days
          const ctr = dr < 1 / 3 ? num(VIDEO.ctr0) : dr < 2 / 3 ? lerp(num(VIDEO.ctr0), num(VIDEO.ctr1), outCubic(seg(dr, 1 / 3, 0.42)))
            : lerp(num(VIDEO.ctr1), num(VIDEO.ctr2), outCubic(seg(dr, 2 / 3, 0.75)));
          setText('ctr', kctr, `${ctr.toFixed(1)}%`);
          setText('views', kviews, fmt(lerp(num(VIDEO.views), num(VIDEO.views1), dr)));
          yl[1].style.opacity = seg(dr, 0.36, 0.46).toFixed(3);
          yl[2].style.opacity = seg(dr, 0.7, 0.8).toFixed(3);
          mk[0].style.opacity = seg(dr, 0.3, 0.4).toFixed(3);
          mk[1].style.opacity = seg(dr, 0.64, 0.74).toFixed(3);
          const to = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
          toast.style.opacity = to.toFixed(3);
          toast.style.transform = `translate(-50%, ${((1 - to) * 24).toFixed(2)}px)`;
        }
      },
      // after the camera: pin the layer over the card's window, open it to the whole frame (round 1: and close it
      // back), and place superbot's pointer inside the client
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full)) * (round === 1 ? 1 - inOutCubic(seg(t, T.shrink, T.end)) : 1);
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        layer.style.zIndex = g > 0.001 ? '7' : '6';
        // the client at the window's scale, pushed in around the shot's node and clamped to the page's edges
        const c = cam(t), S = (Wd / AW) * c.z;
        const tx = Math.min(0, Math.max(Wd - S * AW, Wd / 2 - S * c.x)), ty = Math.min(0, Math.max(Ht - S * AH, Ht / 2 - S * c.y));
        app.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${S.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        const pt = g > 0.98 ? pointer(t) : null;
        if (pt) {
          ptrEl.style.opacity = Math.max(0, Math.min(1, pt.v)).toFixed(3);
          ptrEl.style.transform = `translate(${(pt.x - 6).toFixed(1)}px, ${(pt.y - 4).toFixed(1)}px) scale(${(1 - 0.12 * pt.p).toFixed(3)})`;
        } else ptrEl.style.opacity = '0';
      },
    };
  },
};
