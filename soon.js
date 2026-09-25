'use strict';

// ---- "coming soon" intro: a title card that plays in front of every ad, both as the lightbox
// pre-roll and inside the downloaded file. One canvas renderer serves both, so the preview is
// exactly what gets posted. gallery.js owns the top-right control; this file owns the card.
window.Soon = (() => {
  const VARIANTS = [
    { id: 'coming-soon', label: 'COMING SOON', lines: ['COMING SOON'] },
    { id: 'soon-x3', label: 'SOON SOON SOON', lines: ['SOON', 'SOON', 'SOON'] },
    { id: 'coming-soon-dot', label: 'coming soon.', lines: ['coming soon.'] },
    { id: 'soon', label: 'soon', lines: ['soon'] },
    { id: 'comment-waitlist', label: 'comment for waitlist', lines: ['comment for waitlist'] },
    { id: 'first-100', label: 'first 100 comments get waitlisted', lines: ['first 100 comments get waitlisted'] },
  ];
  const CARD_MS = 1800; // how long the card holds before the ad starts
  const IMAGE_HOLD_MS = 5000; // a static ad exports as card + this long on the poster
  const FONT = '"SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif';
  const KEY = 'gallery.soon.v1';

  let state = { on: false, variant: VARIANTS[0].id };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch (err) { console.error(err); }
  if (!VARIANTS.some(v => v.id === state.variant)) state.variant = VARIANTS[0].id;
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  const isOn = () => !!state.on;
  const setOn = (on) => { state.on = !!on; save(); };
  const variant = () => VARIANTS.find(v => v.id === state.variant);
  const setVariant = (id) => { if (VARIANTS.some(v => v.id === id)) { state.variant = id; save(); } };

  // ---- the card ----
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 4);

  function setFont(ctx, px) {
    ctx.font = `700 ${px}px ${FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(-0.02 * px).toFixed(2)}px`;
  }

  // small, caption-sized: 5% of the short side, shrunk only if the widest line would pass 80% of the width
  function fontPx(ctx, lines, w, h) {
    setFont(ctx, 100);
    const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
    return Math.min(Math.min(w, h) * 0.05, (w * 0.8 * 100) / widest);
  }

  // t in ms since the card started; each line rises into place 110 ms after the one above it
  function draw(ctx, w, h, t, v = variant()) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const px = fontPx(ctx, v.lines, w, h), lh = px * 1.15;
    setFont(ctx, px);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const top = h / 2 - (lh * (v.lines.length - 1)) / 2;
    v.lines.forEach((line, i) => {
      const k = easeOut((t - i * 110) / 340);
      if (k <= 0) return;
      ctx.globalAlpha = k;
      ctx.fillStyle = '#fff';
      ctx.fillText(line, w / 2, top + i * lh + (1 - k) * px * 0.35);
    });
    ctx.globalAlpha = 1;
  }

  // ---- lightbox pre-roll: a canvas over `box` runs the card; resolves with it (null if aborted) ----
  function playIntro(box, alive) {
    const c = document.createElement('canvas');
    c.className = 'soon-card';
    box.appendChild(c);
    const ctx = c.getContext('2d');
    // re-measured every frame: the caller may size the stage after this call, and the window can resize mid-card
    const fit = () => {
      const dpr = devicePixelRatio || 1;
      const w = Math.max(1, Math.round(box.offsetWidth * dpr)); // offset*, not the rect: the stage is mid-pop (scaled)
      const h = Math.max(1, Math.round(box.offsetHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    };
    fit();
    draw(ctx, c.width, c.height, 0); // paint black before the first frame so the ad never flashes
    const t0 = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        if (!alive() || !c.isConnected) return resolve(null);
        const t = now - t0;
        fit();
        draw(ctx, c.width, c.height, t);
        if (t < CARD_MS) requestAnimationFrame(tick); else resolve(c);
      };
      requestAnimationFrame(tick);
    });
  }

  function fadeOut(card) {
    if (!card || card.classList.contains('out')) return;
    card.classList.add('out');
    setTimeout(() => card.remove(), 260);
  }

  // ---- export: re-record card + ad in real time off a canvas (MediaRecorder, no dependencies) ----
  const MIMES = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4',
    'video/webm;codecs=vp9,opus', 'video/webm',
  ];

  async function loadMedia(kind, url) {
    const blob = await (await fetch(url)).blob(); // whole file up front: a network stall would freeze frames in the take
    const src = URL.createObjectURL(blob);
    if (kind === 'image') {
      const img = new Image();
      img.src = src;
      await img.decode();
      return { el: img, w: img.naturalWidth, h: img.naturalHeight, src };
    }
    const v = document.createElement('video');
    v.playsInline = true;
    v.preload = 'auto';
    v.src = src;
    await new Promise((ok, fail) => { v.onloadeddata = ok; v.onerror = () => fail(new Error(`cannot decode ${url}`)); });
    return { el: v, w: v.videoWidth, h: v.videoHeight, src };
  }

  // routes the clip's sound into the recording (12 of the renders carry audio); silent clips add a silent track
  function audioTrack(ac, v) {
    const dest = ac.createMediaStreamDestination();
    ac.createMediaElementSource(v).connect(dest);
    return dest.stream.getAudioTracks()[0];
  }

  async function playForRecording(v) {
    try { await v.play(); }
    catch (err) { // autoplay with sound refused (Safari after a long fetch): record the picture muted
      console.error(err);
      v.muted = true;
      await v.play();
    }
  }

  async function exportWithIntro({ kind, url, onProgress = () => {} }) {
    const mime = window.MediaRecorder && MIMES.find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('this browser cannot record video (no MediaRecorder)');
    const ac = kind === 'image' ? null : new AudioContext(); // made inside the click, so it starts running
    const media = await loadMedia(kind, url);
    const c = document.createElement('canvas');
    c.width = media.w & ~1; // h264 wants even dimensions
    c.height = media.h & ~1;
    const ctx = c.getContext('2d');
    const stream = c.captureStream(30);
    if (ac) stream.addTrack(audioTrack(ac, media.el));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16e6 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise((ok) => { rec.onstop = ok; });
    const total = CARD_MS + (kind === 'image' ? IMAGE_HOLD_MS : media.el.duration * 1000);
    const v = variant();
    rec.start(250);
    try {
      await runFrames(ctx, c, media, kind, v, total, onProgress);
    } finally {
      rec.stop();
      await stopped;
      URL.revokeObjectURL(media.src);
      if (ac) ac.close();
    }
    const type = mime.split(';')[0];
    return { blob: new Blob(chunks, { type }), ext: type === 'video/mp4' ? 'mp4' : 'webm' };
  }

  // card for CARD_MS, then the ad (video until it ends, poster for IMAGE_HOLD_MS); rAF-paced, so keep the tab visible
  function runFrames(ctx, c, media, kind, v, total, onProgress) {
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      let started = false, adT0 = 0;
      const tick = (now) => {
        const t = now - t0;
        if (t < CARD_MS) {
          draw(ctx, c.width, c.height, t, v);
          onProgress(t / total);
          return requestAnimationFrame(tick);
        }
        if (kind === 'image') {
          ctx.drawImage(media.el, 0, 0, c.width, c.height);
          onProgress(Math.min(t / total, 1));
          return t < total ? requestAnimationFrame(tick) : resolve();
        }
        if (!started) {
          started = true;
          adT0 = now;
          return playForRecording(media.el).then(() => requestAnimationFrame(tick), reject);
        }
        ctx.drawImage(media.el, 0, 0, c.width, c.height);
        onProgress(Math.min((CARD_MS + (now - adT0)) / total, 1));
        if (media.el.ended) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  return { VARIANTS, CARD_MS, isOn, setOn, variant, setVariant, draw, playIntro, fadeOut, exportWithIntro };
})();
