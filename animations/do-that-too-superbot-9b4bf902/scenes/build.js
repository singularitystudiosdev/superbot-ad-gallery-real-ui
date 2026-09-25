// build scene (HERO): "Make me an app for making apps".
// Superbot Code view: the prompt is typed and sent, Superbot replies with tool chips while the
// Preview pane (an iPhone 16 emulator) installs the app, then the camera pushes into the phone
// and the generated app (phone-app/index.html?ad=1, driven through its pure adRender(t)) plays live.
// Pure in lt: every frame is a function of lt (and ctx.W for layout-derived camera targets).
import { makeShell, makeCursor, setComposer, scrollFeed, feedOverflow, userBubble, botBlock, toolChip, setToolState, linkCard } from '../shell.js';
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, typed, typeEnd, stream, press, blink, placeCursor, boxIn, path, esc } from '../lib.js';

// ---- the beat table (scene-local seconds) ----
const PROMPT = 'Make me an app for making apps';
const REPLY = 'On it. Building an AI app builder you can use from your phone.';
const DONE = 'Appling is running on your iPhone 16.';
const B = {
  typeAt: 0.33, cps: 60,       // types as the section fade ends; done at 0.81
  sendAt: 1.02,                // cursor press on send
  sentAt: 1.08,                // composer clears, bubble enters
  replyAt: 1.34, rcps: 120,    // bot text streams (done ~1.86)
  chips: [                     // [enter, done]
    { label: 'Planning screens', a: 1.92, b: 2.36 },
    { label: 'Writing React Native code', a: 2.4, b: 2.86 },
    { label: 'Building for iOS', a: 2.9, b: 3.34 },
    { label: 'Running on iPhone 16', a: 3.38, b: 3.8 },
  ],
  building: 1.1,               // preview head -> Building
  wake: 0.98,                  // phone screen wakes (black -> wallpaper) on the send press
  iconIn: 1.3,                 // app icon pops onto the home screen, waiting/loading
  pieA: 1.45, pieB: 3.62,      // install progress fills across the chips
  launch: 3.8,                 // phoneT = 0 (the app's own icon launch)
  doneAt: 4.05,                // final chat line streams (behind the push)
  cardAt: 4.55,
  pushA: 2.85, pushB: 4.0,     // camera push from the chat+phone framing into the phone
  // pullA / pullB / dur are derived below from the phone clock (sheet settled + 0.15s)
};
const AD_SETTLED = 8.5;        // app beat: "Habit Hero is ready" sheet has landed

// Variable phone clock: rate (app-seconds per scene-second) as a function of app time, blended smoothly.
// 1.3x through launch + typing (typing stays readable), 1.9x through the build checklist and preview,
// 1.5x through the streak tap and the ready sheet. Integrated once into a lookup table (pure).
const PH_RATE = (p) => {
  const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  return 1.3 + (1.9 - 1.3) * sm(2.95, 3.3, p) + (1.5 - 1.9) * sm(6.8, 7.1, p);
};
const PH_DT = 1 / 600, PH_TAB = [0];
while (PH_TAB[PH_TAB.length - 1] < 9.8) { const pv = PH_TAB[PH_TAB.length - 1]; PH_TAB.push(pv + PH_RATE(pv) * PH_DT); }
const phoneClock = (u) => {
  if (u <= 0) return 0;
  const i = u / PH_DT, k = Math.floor(i);
  if (k >= PH_TAB.length - 1) return 9.8;
  return Math.min(9.8, lerp(PH_TAB[k], PH_TAB[k + 1], i - k));
};
const U_SETTLED = PH_TAB.findIndex((v) => v >= AD_SETTLED) * PH_DT;   // scene-seconds from launch to the settled sheet
B.pullA = Math.round((B.launch + U_SETTLED + 0.15) * 100) / 100;      // pull back to the chat+phone framing
B.pullB = Math.round((B.pullA + 1.05) * 100) / 100;
B.camTA = Math.round((B.pullB - 0.25) * 100) / 100;               // ease toward the top-right Publish button
B.camTB = Math.round((B.pullB + 0.7) * 100) / 100;
B.pub = Math.round((B.pullB + 0.8) * 100) / 100;                  // pointer presses Publish
B.dur = Math.round((B.pub + 2.15) * 100) / 100;                   // popover + domain, then ~1s settled hold
const HOST = 'appling.superbot.sh';
const LOCK = '<svg class="lucide" viewBox="0 0 24 24"><rect x="4.5" y="11" width="15" height="10" rx="2.2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
const AD_DUR = 9.8;
const PH_W = 432, PH_H = 880;          // phone design box (incl. side buttons), screen is 390x844 inside

const SPROUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>';

let S = null; // mounted refs + caches

function phoneHTML() {
  return `
<div class="bp-phone">
  <i class="bp-btn bp-action"></i><i class="bp-btn bp-volu"></i><i class="bp-btn bp-vold"></i>
  <i class="bp-btn bp-power"></i><i class="bp-btn bp-camctl"></i>
  <div class="bp-band">
    <div class="bp-bezel">
      <div class="bp-screen">
        <iframe class="bp-app" src="phone-app/index.html?ad=1" title="Appling" scrolling="no" tabindex="-1" aria-hidden="true"></iframe>
        <div class="bp-cover">
          <div class="bp-icon"><span class="bp-glyph">${SPROUT}</span><i class="bp-dim"></i>
            <svg class="bp-pie" viewBox="0 0 44 44"><circle class="bp-pie-bg" cx="22" cy="22" r="17"/><circle class="bp-pie-ring" cx="22" cy="22" r="17"/><circle class="bp-pie-fill" cx="22" cy="22" r="7.5" pathLength="100"/></svg>
          </div>
          <div class="bp-label"><span class="l1">Installing…</span><span class="l2">Appling</span></div>
        </div>
        <div class="bp-off"></div>
        <div class="bp-island"><i class="bp-lens"></i></div>
        <div class="bp-glass"></div>
      </div>
      <div class="bp-rim"></div>
    </div>
  </div>
  <div class="bp-caption">iPhone 16 · iOS 18</div>
</div>`;
}

export default {
  id: 'build',
  dur: B.dur,

  mount(section, ctx) {
    const refs = makeShell({
      mode: 'code', title: 'Appling', path: '~/projects/appling',
      projects: ['appling', 'waffle-rater', 'portfolio'], active: 0,
      preview: 'phone', previewLabel: 'iPhone 16',
    });
    refs.root.classList.add('bld');
    section.appendChild(refs.root);

    // ---- phone emulator in the Preview pane ----
    refs.phoneSlot.innerHTML = phoneHTML();
    const phone = refs.phoneSlot.querySelector('.bp-phone');
    const q = (s) => phone.querySelector(s);
    const iframe = q('.bp-app');

    // ---- chat feed: bubble, reply, chips, final line + link card (each in a height-animated wrapper) ----
    const wrap = (node, cls = '') => { const w = document.createElement('div'); w.className = 'bp-in ' + cls; w.appendChild(node); refs.feedIn.appendChild(w); return w; };
    const ub = userBubble(PROMPT);
    const wUser = wrap(ub.el || ub, 'bp-user');
    const reply = botBlock(`<p class="bp-p"></p>`);
    const wReply = wrap(reply.el || reply, 'bp-reply');
    const replyP = wReply.querySelector('.bp-p');
    const chips = B.chips.map((c) => {
      const chip = toolChip(c.label, 'run');
      const holder = document.createElement('div'); holder.className = 'bp-chip';
      holder.appendChild(chip.el || chip);
      return { ...c, chip, w: wrap(holder, 'bp-chipw') };
    });
    const fin = botBlock(`<p class="bp-p bp-fin"></p>`);
    const wFin = wrap(fin.el || fin, 'bp-finw');
    const finP = wFin.querySelector('.bp-fin');
    const card = linkCard({ title: 'Appling 1.0 on iPhone 16', url: 'testflight.apple.com/join/appling', icon: 'phone' });
    const wCard = wrap(card.el || card, 'bp-cardw');

    // live dot in the preview head
    const dot = document.createElement('i'); dot.className = 'bp-live';
    refs.previewState.parentNode.insertBefore(dot, refs.previewState);

    // cursor
    const cursor = makeCursor();
    const cEl = cursor.el || cursor;
    cEl.classList.add('bp-cursor');
    refs.win.appendChild(cEl);

    // Publish button: two stacked groups (rocket + Publish / check + Published!) for the Ordered!-style press
    const pub = refs.publish;
    const rk = pub.querySelector('.pub-ic svg');
    pub.classList.add('bp-pub');
    pub.innerHTML = `<span class="bp-pg bp-pg-a"><span class="bp-pic">${rk ? rk.outerHTML : ''}</span><span class="bp-pl">Publish</span></span>` +
      `<span class="bp-pg bp-pg-b"><svg class="lucide bp-ck" viewBox="0 0 24 24"><path class="bp-ck-p" pathLength="23" d="M4.5 12.5l5 5L19.5 7"/></svg><span class="bp-pl">Published!</span></span><i class="pub-shine"></i>`;
    // the live address popover that grows out under the button
    const pop = document.createElement('div');
    pop.className = 'bp-pop';
    pop.innerHTML = `<i class="bp-pop-caret"></i><div class="bp-pop-top"><i class="bp-pop-dot"><b></b></i><span>Live on the web</span></div>` +
      `<div class="bp-pop-url">${LOCK}<span class="bp-pop-host"></span></div>`;
    refs.win.appendChild(pop);

    S = {
      refs, phone, iframe, cEl, dot, ub, wUser, wReply, replyP, chips, wFin, finP, wCard,
      cover: q('.bp-cover'), icon: q('.bp-icon'), dim: q('.bp-dim'), pie: q('.bp-pie'), pieRing: q('.bp-pie-ring'), pieFill: q('.bp-pie-fill'),
      caption: q('.bp-caption'), l1: q('.bp-label .l1'), l2: q('.bp-label .l2'), off: q('.bp-off'),
      pub, gA: pub.querySelector('.bp-pg-a'), gB: pub.querySelector('.bp-pg-b'), pic: pub.querySelector('.bp-pic'),
      ck: pub.querySelector('.bp-ck'), ckP: pub.querySelector('.bp-ck-p'), shine: pub.querySelector('.pub-shine'),
      pop, popHost: pop.querySelector('.bp-pop-host'), popDot: pop.querySelector('.bp-pop-dot'),
      layoutW: -1, geo: null, ready: false, lastPT: NaN, last: {},
    };
    iframe.addEventListener('load', () => { S.lastPT = NaN; });
  },

  render(lt, ctx) {
    if (!S) return;
    const t = clamp(lt, 0, B.dur);
    const { refs } = S;
    const W = (ctx && ctx.W) || 1920, H = 1080;
    refs.renderMarks(ctx && typeof ctx.t === 'number' ? ctx.t : t);

    // ---------------- layout-derived geometry (once per W) ----------------
    if (S.layoutW !== W || !S.geo) layout(W, H);
    const G = S.geo;

    // ---------------- composer + cursor ----------------
    const draft = typed(PROMPT, B.typeAt, B.cps, t);
    const tEnd = typeEnd(PROMPT, B.typeAt, B.cps);
    const pSend = press(t, B.sendAt);
    const sent = t >= B.sentAt;
    if (!sent && draft.n === 0) {
      setComposer(refs, '', {});
      refs.composerText.innerHTML = blink(t) ? '<i class="rc-caret"></i>' : '';
      refs.composer.classList.add('bp-focus', 'bp-empty');
    } else if (!sent) {
      refs.composer.classList.remove('bp-empty');
      setComposer(refs, draft.text, { caret: draft.typing || blink(t - tEnd), lit: draft.n > 0, press: pSend });
      refs.composer.classList.add('bp-focus');
    } else {
      setComposer(refs, '', {});
      refs.composerText.innerHTML = '';
      refs.composer.classList.remove('bp-empty');
      refs.composer.classList.toggle('bp-focus', t < B.sentAt + 0.8);
    }
    if (G.cur && t >= B.camTA - 0.05) {
      const pk = G.cur.pub;
      const pt = path(t, [
        { t: B.camTA, x: pk.x0, y: pk.y0 },
        { t: B.pub - 0.14, x: pk.x, y: pk.y },
      ]);
      placeCursor(S.cEl, pt.x, pt.y, press(t, B.pub), seg(t, B.camTA, B.camTA + 0.25) * (1 - seg(t, B.pub + 0.45, B.pub + 0.8)));
    } else if (G.cur) {
      const pt = path(t, [
        { t: 0, x: G.cur.rest.x, y: G.cur.rest.y },
        { t: B.sendAt - 0.4, x: G.cur.rest.x, y: G.cur.rest.y },
        { t: B.sendAt - 0.06, x: G.cur.send.x, y: G.cur.send.y },
        { t: B.sendAt + 0.22, x: G.cur.send.x, y: G.cur.send.y },
        { t: B.sendAt + 0.8, x: G.cur.away.x, y: G.cur.away.y },
      ]);
      placeCursor(S.cEl, pt.x, pt.y, pSend, 1 - seg(t, B.sendAt + 0.3, B.sendAt + 0.75));
    }

    // ---------------- chat feed ----------------
    grow(S.wUser, seg(t, B.sentAt, B.sentAt + 0.28));
    const r = stream(REPLY, B.replyAt, B.rcps, t);
    const rText = typeof r === 'string' ? r : r.text;
    const rDone = typeof r === 'string' ? rText.length >= REPLY.length : r.done;
    setHTML(S.replyP, 'r', esc(rText) + (t >= B.replyAt && !rDone ? '<i class="lb-caret"></i>' : ''));
    grow(S.wReply, t >= B.replyAt ? 1 : 0);
    S.chips.forEach((c, i) => {
      grow(c.w, seg(t, c.a, c.a + 0.24));
      const st = t >= c.b ? 'done' : 'run';
      setToolState(c.chip, st, c.label, t - c.a);
    });
    const f = stream(DONE, B.doneAt, B.rcps, t);
    const fText = typeof f === 'string' ? f : f.text;
    const fDone = fText.length >= DONE.length;
    setHTML(S.finP, 'f', esc(fText) + (t >= B.doneAt && !fDone ? '<i class="lb-caret"></i>' : ''));
    grow(S.wFin, t >= B.doneAt ? 1 : 0);
    grow(S.wCard, seg(t, B.cardAt, B.cardAt + 0.3));
    const ov = feedOverflow(refs);
    scrollFeed(refs, ov);

    // ---------------- preview head ----------------
    const live = t >= B.launch;
    setText(refs.previewState, 'ps', t >= B.pub + 0.6 ? HOST + ' · Live' : live ? 'iPhone 16 · Live' : t >= B.building ? 'Building' : 'Ready');
    S.dot.className = 'bp-live' + (live ? ' on' : t >= B.building ? ' busy' : '');

    // ---------------- the phone ----------------
    renderPhone(t);

    // ---------------- Publish press + live address ----------------
    renderPublish(t);

    // ---------------- camera ----------------
    // two framings: F = chat + phone (~1.3x, slow eased creep), P = the phone filling ~88% of the frame
    // (eased hold drift). The push/pull blend between them in log-zoom; every move eases in and out.
    // a third framing T = the top-right Publish button + its popover (~1.7x) takes over after the pull-back.
    const sm = (x) => x * x * (3 - 2 * x);
    const zF = G.z0 * (0.975 + 0.05 * sm(seg(t, 0, B.pushB)) + 0.025 * sm(seg(t, B.pullA, B.camTB)));
    const zT = G.zT * (1 + 0.02 * sm(seg(t, B.camTB, B.dur)));
    const zP = G.S * (1 + 0.03 * sm(seg(t, B.pushB, B.pullA)));
    const wT = inOutCubic(seg(t, B.camTA, B.camTB));
    const zB = Math.exp(lerp(Math.log(zF), Math.log(zT), wT));
    const ccx = (c, zz, span) => clamp(c, span / (2 * zz), span - span / (2 * zz));   // keep the window covering the frame
    const bcx = lerp(ccx(G.fx, zF, W), ccx(G.tcx, G.zT, W), wT), bcy = lerp(ccx(G.fy, zF, H), ccx(G.tcy, G.zT, H), wT);
    const inF = inOutCubic(seg(t, B.pushA, B.pushB));
    const outF = inOutCubic(seg(t, B.pullA, B.pullB));
    const f01 = inF * (1 - outF);
    const z = Math.exp(lerp(Math.log(zB), Math.log(zP), f01));
    const wv = Math.abs(zP - zB) > 1e-6 ? clamp((z - zB) / (zP - zB)) : f01;   // focus follows the zoom
    const fcx = lerp(bcx, G.cx, wv), fcy = lerp(bcy, G.cy, wv);
    let tx = W / 2 - z * fcx, ty = H / 2 - z * fcy;
    tx = clamp(tx, W - z * W, 0); ty = clamp(ty, H - z * H, 0);
    const capV = (1 - clamp(f01 * 3)).toFixed(3);
    if (S.last.cap !== capV) { S.caption.style.opacity = capV; S.last.cap = capV; }
    const tf = Math.abs(z - 1) < 1e-6 ? 'none' : `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(5)})`;
    if (S.last.cam !== tf) { refs.root.style.transform = tf; S.last.cam = tf; }
  },
};

// height-animated wrapper: 0 = collapsed (not in layout), 1 = natural height
function grow(w, e) {
  if (e <= 0) { if (w.style.display !== 'none') w.style.display = 'none'; return; }
  if (w.style.display === 'none') w.style.display = '';
  if (e >= 1) { w.style.height = ''; w.style.opacity = ''; w.style.transform = ''; return; }
  const k = outCubic(e);
  const h = w.firstElementChild ? w.firstElementChild.offsetHeight : 0;
  const cs = getComputedStyle(w.firstElementChild || w);
  const full = h + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0);
  w.style.height = (full * k).toFixed(2) + 'px';
  w.style.opacity = clamp(e * 1.6).toFixed(3);
  w.style.transform = `translateY(${((1 - k) * 6).toFixed(2)}px)`;
}
function setHTML(el, key, html) { if (S.last[key] !== html) { el.innerHTML = html; S.last[key] = html; } }
function setText(el, key, s) { if (S.last[key] !== s) { el.textContent = s; S.last[key] = s; } }

// size the phone slot to the pane, and derive the camera push from where the pane landed
function layout(W, H) {
  const { refs, phone } = S;
  const prev = refs.root.style.transform;
  refs.root.style.transform = 'none';
  const body = boxIn(refs.previewBody, refs.root);            // stage px
  if (!body.w || !body.h) { refs.root.style.transform = prev; return; }
  const scaleWin = refs.win.getBoundingClientRect().height / (refs.win.offsetHeight || 1) /
    (refs.root.getBoundingClientRect().height / (refs.root.offsetHeight || 1)); // .sbx scale inside the cam (1.6)
  const cx = body.cx, cy = body.cy;
  const targetH = 0.88 * H;
  // smallest push that can put the phone centre on the frame centre without showing past the window edge
  const sNeed = Math.max(1.08, (W / 2) / Math.max(1, W - cx), W / (2 * Math.max(1, cx)), (H / 2) / Math.max(1, H - cy), H / (2 * Math.max(1, cy)));
  const fitH = Math.min(body.h - 40 * scaleWin, (body.w - 36 * scaleWin) * PH_H / PH_W);
  const restH = Math.max(80, Math.min(targetH / sNeed, fitH));
  const slotH = restH / scaleWin, slotW = slotH * PH_W / PH_H;   // layout px inside .sbx
  refs.phoneSlot.style.height = slotH.toFixed(2) + 'px';
  refs.phoneSlot.style.width = slotW.toFixed(2) + 'px';
  refs.phoneSlot.style.maxWidth = 'none';
  refs.phoneSlot.style.aspectRatio = 'auto';
  phone.style.transform = `scale(${(slotH / PH_H).toFixed(5)})`;
  // phone band centre is the slot centre; caption hangs below, so the band sits a touch high
  const pr = boxIn(refs.phoneSlot, refs.root);
  // cursor anchors (in .sbx layout px)
  const cb = boxIn(refs.composer, refs.win), sb = boxIn(refs.send, refs.win);
  const cur = {
    rest: { x: cb.x + cb.w * 0.7, y: cb.y + cb.h * 0.36 },
    send: { x: sb.cx + 1, y: sb.cy + 2 },
    away: { x: sb.cx + 60, y: sb.cy + 90 },
  };
  // chat + phone framing: feed top to composer bottom, chat left edge to the phone's right edge
  const fb = boxIn(refs.feed, refs.root), cbr = boxIn(refs.composer, refs.root);
  const m = 16 * scaleWin;
  const L = Math.min(fb.x, cbr.x) - m, T = Math.min(fb.y, pr.y) - m * 0.5;
  const R = Math.max(pr.x + pr.w, fb.x + fb.w) + m * 2.5, Bo = Math.max(cbr.y + cbr.h, pr.y + pr.h) + m * 0.5;
  const z0 = clamp(Math.min(W / (R - L), (H * 1.06) / (Bo - T), 1.35), 1, 1.35);
  // Publish button: widths of both states (groups are absolutely stacked inside), height from its Preview sibling
  const pub = S.pub, csb = getComputedStyle(pub);
  pub.style.transform = 'none';
  const padX = parseFloat(csb.paddingLeft) + parseFloat(csb.paddingRight);
  const prevBtn = pub.parentNode.querySelector('.preview-badge');
  S.pubW = [S.gA.offsetWidth + padX, S.gB.offsetWidth + padX];
  pub.style.height = (prevBtn ? prevBtn.offsetHeight : 26) + 'px';
  pub.style.width = S.pubW[0].toFixed(2) + 'px';
  const pb = boxIn(pub, refs.win);                                  // .sbx layout px
  cur.pub = { x0: pb.cx - 190, y0: pb.cy + 170, x: pb.x + pb.w * 0.84, y: pb.cy + 5 };
  S.pop.style.right = (refs.win.offsetWidth - (pb.x + pb.w)).toFixed(2) + 'px';
  S.pop.style.top = (pb.y + pb.h + 11).toFixed(2) + 'px';
  S.pop.style.setProperty('--caret-r', (pb.w * 0.5 - 6).toFixed(1) + 'px');
  // top-right framing: button + popover big, phone partly visible
  const pbs = boxIn(pub, refs.root);
  const zT = clamp(Math.min(1.72, W / (320 * scaleWin)), 1.2, 1.72);
  const fw = W / zT, fh = H / zT;
  const right = pbs.x + pbs.w + 26 * scaleWin, top = pbs.y - 22 * scaleWin;
  S.geo = { cx: pr.cx, cy: pr.cy, S: targetH / pr.h, cur, z0, fx: (L + R) / 2, fy: (T + Bo) / 2,
    zT, tcx: right - fw / 2, tcy: top + fh / 2 };
  S.layoutW = W;
  refs.root.style.transform = prev;
  S.last.cam = prev;
}

function renderPhone(t) {
  const w = S.iframe.contentWindow;
  const ready = !!(w && typeof w.adRender === 'function');
  if (ready !== S.ready) { S.ready = ready; S.phone.classList.toggle('is-ready', ready); S.lastPT = NaN; }
  const phoneT = clamp(phoneClock(t - B.launch), 0, AD_DUR);
  const pt = Math.round(phoneT * 1000) / 1000;
  if (ready && pt !== S.lastPT) { try { w.adRender(pt); S.lastPT = pt; } catch (e) { /* app not settled yet */ } }

  // screen: off (black) until it wakes, then the home wallpaper; stays black until the app has loaded
  const wakeV = ready ? outCubic(seg(t, B.wake, B.wake + 0.45)) : 0;
  const offV = (1 - wakeV).toFixed(3);
  if (S.last.off !== offV) { S.off.style.opacity = offV; S.last.off = offV; }

  // install: the icon pops onto the home screen dimmed with a progress pie, then the dim lifts and
  // the cover hands over to the app's own identical icon at the launch beat
  const coverV = t < B.launch ? 1 : 0;
  S.cover.style.visibility = coverV ? 'visible' : 'hidden';
  const pop = seg(t, B.iconIn, B.iconIn + 0.38);
  const sc = pop <= 0 ? 0 : 0.35 + 0.65 * outBack(pop, 2.2);
  S.icon.style.opacity = clamp(pop * 2.5).toFixed(3);
  S.icon.style.transform = `scale(${sc.toFixed(4)})`;
  const ps = seg(t, B.pieA, B.pieB);
  const prog = 0.55 * ps + 0.45 * ps * ps * (3 - 2 * ps);   // always moving, eased at both ends
  setText(S.l1, 'l1', t < B.chips[0].b ? 'Waiting…' : t < B.chips[2].b ? 'Loading…' : 'Installing…');
  const unDim = seg(t, B.pieB, B.pieB + 0.16);
  S.dim.style.opacity = (0.55 * (1 - unDim)).toFixed(3);
  S.pie.style.opacity = (1 - unDim).toFixed(3);
  S.pieFill.style.strokeDashoffset = (100 - 100 * prog).toFixed(2);
  const lab = seg(t, B.pieB, B.pieB + 0.14);
  S.l1.style.opacity = (pop > 0 ? 1 - lab : 0).toFixed(3);
  S.l2.style.opacity = lab.toFixed(3);
}

// the Ordered!-style press, scaled to the Publish pill: dip ~5%, shine sweep, rocket rotates out,
// check draws and pops, "Published!" slides in; then the live-address popover grows out underneath
function renderPublish(t) {
  const P = B.pub;
  const k = (v) => v.toFixed(4);
  const dip = press(t, P);
  const bump = Math.sin(Math.PI * seg(t, P + 0.12, P + 0.5));
  S.pub.style.transform = `scale(${k(1 - 0.05 * dip + 0.03 * bump)})`;
  const wg = outCubic(seg(t, P + 0.04, P + 0.4));
  S.pub.style.width = (S.pubW ? lerp(S.pubW[0], S.pubW[1], wg) : 0).toFixed(2) + 'px';
  const sh = seg(t, P + 0.02, P + 0.5);
  S.shine.style.opacity = sh > 0 && sh < 1 ? '1' : '0';
  S.shine.style.transform = `translateX(${(-160 + 520 * outCubic(sh)).toFixed(1)}%) skewX(-20deg)`;
  const ro = seg(t, P + 0.04, P + 0.3), roE = outCubic(ro);
  S.gA.style.opacity = k(1 - roE);
  S.gA.style.transform = `translate(-50%, calc(-50% - ${(6 * roE).toFixed(2)}px))`;
  S.pic.style.transform = `rotate(${(-40 * ro).toFixed(2)}deg) scale(${k(1 - 0.6 * ro)})`;
  const gi = outCubic(seg(t, P + 0.14, P + 0.4));
  S.gB.style.opacity = k(gi);
  S.gB.style.transform = `translate(-50%, calc(-50% + ${((1 - gi) * 6).toFixed(2)}px))`;
  const ck = seg(t, P + 0.16, P + 0.42);
  S.ckP.style.strokeDashoffset = (23 * (1 - outCubic(ck))).toFixed(2);
  const cp = seg(t, P + 0.14, P + 0.4);
  S.ck.style.transform = `scale(${k(cp <= 0 ? 0.55 : lerp(0.55, 1, outBack(cp)))})`;

  // popover
  const gp = seg(t, P + 0.5, P + 0.85);
  S.pop.style.visibility = gp > 0 ? 'visible' : 'hidden';
  S.pop.style.opacity = k(clamp(gp * 2.2));
  S.pop.style.transform = `translateY(${(-(1 - outCubic(gp)) * 6).toFixed(2)}px) scale(${k(lerp(0.86, 1, gp <= 0 ? 0 : outBack(gp)))})`;
  const hs = typed(HOST, P + 0.68, 45, t);
  setHTML(S.popHost, 'host', esc(hs.text) + (hs.n > 0 && !hs.done ? '<i class="rc-caret"></i>' : ''));
  const live = hs.done;
  S.popDot.classList.toggle('on', live);
  const ph = live ? ((t - (P + 1.1)) % 1.4 + 1.4) % 1.4 / 1.4 : 0;
  S.popDot.firstChild.style.transform = `scale(${k(1 + 1.6 * ph)})`;
  S.popDot.firstChild.style.opacity = live ? k(0.55 * (1 - ph)) : '0';
}
