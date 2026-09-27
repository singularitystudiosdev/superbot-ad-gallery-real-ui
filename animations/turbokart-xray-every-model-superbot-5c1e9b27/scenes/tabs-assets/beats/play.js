// Play beat, the finale and the payoff of the whole spot. Claude Opus 5.5 streams its done line, its two tool chips
// land and resolve (building, then loading Palm Cove Circuit), and the Turbo Kart Rally window opens on the EXACT frame
// the cold open froze on (img/tkr/freeze.jpg: LAP 1/3, 0:08.88, 7th, 132 km/h, lightning in the item box), still in
// the X-ray look (desaturated, faint blueprint grid) with a pause glyph in the middle. The glyph flips to play, the
// colour floods back in 200ms and the real clip (media/tkr-main.mp4) rolls on from that same frame while the window
// grows to full frame: the lightning fires, the rivals spin out, Toadly climbs 6th, 5th, 3rd, 2nd and takes 1st on
// the boost pad at 190 km/h. The clip stops on that 1st-place frame and holds it into the outro card.
//
// Every number about the clip comes from img/tkr/xray.json (the only place T lives): the clip starts at file time
// FREEZE = T - mainStart (3.0s) and stops at STOP, a frame inside Toadly's 1st place. xray.json `after` puts 1st at
// source ~30.5s (+/-0.25s); read frame by frame, the HUD shows 1st from file 9.433s to 9.667s (source 30.43 to 30.67)
// and 2nd again from 9.683s, so STOP = the 1st-place entry's time pulled onto the 9.650s frame (see STOP_FRAME below).
//
// The clip is a real <video>, so its clock follows t: want = clamp(FREEZE + t - T.c0, FREEZE, STOP).
// Held (a ?t= frame adds body.freeze, window.__AD.seek pauses the clock, or the clock has simply stopped), or any t
// outside the racing window: the video is paused and seeked to exactly want. Live inside the window: it plays and
// re-seeks only once it has drifted past DRIFT_TOL, and it is stopped by hand the moment it reaches STOP, so a live run
// never shows the 2nd place that follows. The source is silent: the video stays muted (autoplay policy).
//
// Geometry: the beat puts an invisible SLOT in the thread (it carries the scroll marks, so the chat lands it like any
// reply) and draws the visible window as an overlay in the scene root, laid over the slot's box every frame. The grow
// interpolates that box to the whole frame; the title bar folds away and the corners square off on the way, and the
// picture is shown whole (object-fit: contain) so the lap, standings and speed HUD at the frame edges stay in view.
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, streamCount } from '../../../lib.js';

const XR = await (async () => {
  const url = new URL('../../../img/tkr/xray.json', import.meta.url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`play.js: ${url} answered ${r.status}`);
  return r.json();
})();

const FZ = XR.freeze;
const FREEZE = +(XR.T - XR.mainStart).toFixed(4);          // 3.0: the frozen frame, in tkr-main.mp4 file seconds
const FIRST = XR.after.find((a) => a.place === 1);          // the boost pad: 1st at 190 km/h
// 9.650s: the last-but-one frame of Toadly's 1st place as the HUD shows it (1st from 9.433s, 2nd again at 9.683s),
// 0.15s after xray.json's recorded 1st-place moment. +0.005 puts a seek a hair inside that frame, never on the one before.
const STOP_FRAME = 579 / 60;
const STOP = +(STOP_FRAME + 0.005).toFixed(4);
const CLIP_SRC = new URL('../../../' + XR.clips.main.file, import.meta.url).href;
const FREEZE_IMG = new URL('../../../img/tkr/' + XR.freezeImg.full, import.meta.url).href;
const POSTER = new URL('../../../img/tkr/' + XR.freezeImg.w1280, import.meta.url).href;
const ASPECT = XR.clips.main.w / XR.clips.main.h;           // 1920 x 988

const SAY = `Built it. Lap ${FZ.lap} of ${FZ.lapOf}, you’re ${FZ.placeLabel} with ${FZ.item} in the box. Unpausing.`;
const CHIPS = [['Building Turbo Kart Rally', 'Built Turbo Kart Rally'], [`Loading ${FZ.track}`, `Racing, lap ${FZ.lap} of ${FZ.lapOf}`]];
const TITLE = `Turbo Kart Rally · ${FZ.track}`;

const SEED_TOL = 0.002;   // a held frame re-seeks whenever it is off at all (only skips re-writing the same value)
const DRIFT_TOL = 0.2;    // live playback only re-seeks once the element has drifted further than this
const STOP_GUARD = 0.03;  // live playback is stopped by hand once the element gets this close to STOP
const BAR = 30;           // the title bar, hub px
const FLOOD = 0.2;        // the colour flood

// the pause / play glyphs: Iconify material-symbols:pause-rounded and material-symbols:play-arrow-rounded
// (api.iconify.design, see play.CREDITS.txt)
const PAUSE = '<svg class="play-g-pause" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19"/></svg>';
const PLAY = '<svg class="play-g-play" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712"/></svg>';

// Is the scene clock held? window.__AD.seek (export/QA) pauses the timeline without body.freeze, so the beat marks every
// seek and holds until t moves away from where the seek left it (the clock was resumed). The timeline re-renders a
// paused clock every rAF at t rounded to 1/60, so "moved" means more than a 60th and change.
const HOLD = { on: false, fresh: false, t: NaN };
function hookSeek() {
  const ad = window.__AD;
  if (!ad || ad.__playHold) return !!ad;
  const wrap = (f) => (typeof f === 'function' ? function (...a) { HOLD.on = true; HOLD.fresh = true; return f.apply(this, a); } : f);
  let raw = ad.seek, wrapped = wrap(raw);
  Object.defineProperty(ad, 'seek', { configurable: true, enumerable: true, get: () => wrapped, set: (f) => { raw = f; wrapped = wrap(f); } });
  Object.defineProperty(ad, '__playHold', { value: true });
  return true;
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;                 // the window grows in on the frozen frame (0.55s)
    T.flip = T.v0 + 1.0;            // the pause glyph flips to play and the colour floods back over FLOOD
    T.c0 = T.flip + FLOOD;          // the clip rolls from file FREEZE once the frozen frame is back in full colour
    T.g0 = T.flip + 0.12;           // the window grows to full frame
    T.g1 = T.g0 + 0.8;
    T.first = T.c0 + (FIRST.src - XR.mainStart - FREEZE); // Toadly takes 1st (for QA / the tray)
    T.stop = T.c0 + (STOP - FREEZE); // the clip stops on the 1st-place frame and holds it
    T.end = T.stop;                 // the chat's own tail (+0.2) and the scene's (+0.4) hold it into the outro card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a route can give the finale its own line
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    // the slot: the window's footprint in the thread (bar + picture), never painted
    const slot = x.el('<div class="play-slot" aria-hidden="true"><div class="play-slot-bar"></div><div class="play-slot-screen"></div></div>');
    // the window itself: an overlay in the scene root, placed over the slot every frame
    const win = x.el(`<div class="play-win" aria-label="Turbo Kart Rally">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">${x.esc(TITLE)}</b></div>
      <div class="play-screen">
        <video class="play-vid" muted playsinline preload="auto" poster="${POSTER}" src="${CLIP_SRC}"></video>
        <img class="play-freeze" src="${FREEZE_IMG}" alt="" decoding="sync"/>
        <i class="play-grid"></i>
        <span class="play-glyph">${PAUSE}${PLAY}</span>
      </div>
    </div>`);
    const vid = win.querySelector('.play-vid');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const bar = win.querySelector('.play-bar'), frz = win.querySelector('.play-freeze'), grid = win.querySelector('.play-grid');
    const glyph = win.querySelector('.play-glyph'), gPause = glyph.firstElementChild, gPlay = glyph.lastElementChild;

    const start = () => {
      const p = vid.play();
      if (p && p.catch) p.catch((e) => { if (!(e && e.name === 'AbortError')) console.error('play.js: video.play() rejected', e); });
    };

    hookSeek();
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, geoKey = '', root = null;
    const clk = { t: NaN, at: 0 };
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    // the slot fit: as wide as the thread's content box, no taller than the room between the top veil and the fold
    // (renderScroll parks the slot's bottom at viewH - 8 once its marks have landed)
    const fit = () => {
      const feed = slot.closest('.feed'), main = slot.parentNode;
      if (!feed || !main) return;
      const fr = feed.getBoundingClientRect();
      const ar = (window.AR && window.AR.key) || '';
      const key = `${ar}|${feed.clientWidth}x${feed.clientHeight}|${fr.top.toFixed(1)}|${fr.width.toFixed(1)}`;
      if (key === geoKey) return;
      geoKey = key;
      const cs = getComputedStyle(feed);
      const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
      const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
      const contentW = feed.clientWidth - padL - padR;
      const viewH = feed.clientHeight - padT - padB;
      const s = feed.offsetWidth ? fr.width / feed.offsetWidth : 1;
      const indent = (main.getBoundingClientRect().left - fr.left) / s - padL;
      const edge = document.querySelector('#s-tabs .ask-edge');
      let top = 0;
      if (edge) { const er = edge.getBoundingClientRect(); top = Math.max(0, (er.bottom - fr.top) / s - padT); }
      const room = viewH - 8 - top - 6;
      const w = Math.floor(Math.max(200, Math.min(contentW, (room - BAR) * ASPECT)));
      slot.style.width = `${w}px`;
      slot.style.marginLeft = `${((contentW - w) / 2 - indent).toFixed(2)}px`;
    };

    return {
      nodes: [say, ...rows, slot],
      // the last two marks put the window in view as it lands and then settle it once it has finished growing in
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, slot], [T.v0 + 0.55, slot]],
      render(t) {
        fit();
        if (!root) {
          const site = slot.closest('.sbsite');
          if (site && site.parentNode) {
            root = site.parentNode;
            root.appendChild(win);
            // the element was parsed in x.el's inert <template> document, where Chrome refuses the load ("URL safety
            // check"); now that it lives in the page, load it for real
            vid.load();
          }
        }
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // ---------- the window: over the slot, then grown to the whole frame ----------
        if (root) {
          const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
          const g = inOutCubic(seg(t, T.g0, T.g1));
          const b = x.box(slot);
          const k = slot.offsetWidth ? b.w / slot.offsetWidth : 1; // screen px per hub px
          const FW = root.offsetWidth || 1920, FH = root.offsetHeight || 1080;
          // the grown-in scale (0.94 -> 1) and rise (22 hub px) act about the slot's centre
          const sc = lerp(0.94, 1, ci), dy = (1 - ci) * 22 * k;
          const sx = b.x + (b.w - b.w * sc) / 2, sy = b.y + (b.h - b.h * sc) / 2 + dy;
          const X0 = lerp(sx, 0, g), Y0 = lerp(sy, 0, g), X1 = lerp(sx + b.w * sc, FW, g), Y1 = lerp(sy + b.h * sc, FH, g);
          win.style.opacity = (t < T.v0 ? 0 : ci).toFixed(3);
          win.style.left = `${X0.toFixed(2)}px`;
          win.style.top = `${Y0.toFixed(2)}px`;
          win.style.width = `${(X1 - X0).toFixed(2)}px`;
          win.style.height = `${(Y1 - Y0).toFixed(2)}px`;
          win.style.borderRadius = `${(10 * k * sc * (1 - g)).toFixed(2)}px`;
          win.style.setProperty('--k', (k * sc).toFixed(4));
          // the title bar folds away as the window takes the frame
          bar.style.height = `${(BAR * k * sc * (1 - g)).toFixed(2)}px`;
          bar.style.opacity = (1 - seg(g, 0, 0.6)).toFixed(3);
          win.style.boxShadow = g >= 1 ? 'none' : '';
        }

        // ---------- frozen, then unpaused: glyph flip, colour flood ----------
        const fl = seg(t, T.flip, T.flip + FLOOD);
        frz.style.opacity = (1 - fl).toFixed(3);
        const sat = lerp(0.35, 1, fl);
        frz.style.filter = fl >= 1 ? 'none' : `saturate(${sat.toFixed(3)}) brightness(${lerp(0.88, 1, fl).toFixed(3)}) contrast(${lerp(1.06, 1, fl).toFixed(3)})`;
        grid.style.opacity = (0.55 * (1 - fl)).toFixed(3);
        // the pause glyph pops in with the window, flips to play on T.flip (a small punch), then clears off the picture
        const gin = outBack(seg(t, T.v0 + 0.3, T.v0 + 0.62));
        const flipped = t >= T.flip;
        gPause.style.display = flipped ? 'none' : '';
        gPlay.style.display = flipped ? '' : 'none';
        const punch = flipped ? 1 + 0.16 * Math.sin(Math.PI * seg(t, T.flip, T.flip + 0.22)) : 1;
        const gout = seg(t, T.flip + 0.18, T.flip + 0.5);
        glyph.style.opacity = (clamp(seg(t, T.v0 + 0.3, T.v0 + 0.5)) * (1 - gout)).toFixed(3);
        glyph.style.transform = `translate(-50%, -50%) scale(${(lerp(0.6, 1, gin) * punch * lerp(1, 1.25, outCubic(gout))).toFixed(4)})`;

        // ---------- the clip follows t ----------
        // it plays only while the clock is really running inside the racing window; every other time it is parked on
        // exactly the frame t asks for
        const now = performance.now();
        if (t !== clk.t) { clk.t = t; clk.at = now; }
        if (!window.__AD || !window.__AD.__playHold) hookSeek();
        if (HOLD.on) {
          if (HOLD.fresh) { HOLD.t = t; HOLD.fresh = false; } else if (Math.abs(t - HOLD.t) > 0.02) HOLD.on = false;
        }
        const running = !document.body.classList.contains('freeze') && !HOLD.on && now - clk.at < 150;
        const want = clamp(FREEZE + t - T.c0, FREEZE, STOP);
        const inWin = running && t >= T.c0 && t < T.stop;
        // the element ran ahead onto STOP while t is still in its last stretch: park it on 1st place, never past it
        const atStop = inWin && vid.currentTime >= STOP - STOP_GUARD && want >= STOP - DRIFT_TOL - STOP_GUARD;
        if (inWin && !atStop) {
          if (vid.paused) start();
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          if (!vid.paused) vid.pause();
          const park = atStop ? STOP : want;
          if (Math.abs(vid.currentTime - park) > SEED_TOL) vid.currentTime = park;
        }
      },
    };
  },
};
