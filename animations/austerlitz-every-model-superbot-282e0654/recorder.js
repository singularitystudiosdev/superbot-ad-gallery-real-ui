// the record button (user ask): click → pick "this tab" in the browser's
// share sheet → the loop rewinds to its first frame and plays ONCE while
// the browser's own compositor captures the tab (Screen Capture API, the
// show keeps its native frame rate; zero main-thread cost, so no lag), and
// the take downloads as a 16:9 webm. A second click (or Esc) ends it early.
// Tab capture sees the whole tab, so the page's own chrome (button, hint)
// is hidden for the duration of the take.
//
// Sound: every <video> on the page plays muted (autoplay policy), so the
// tab itself is silent and the capture asks for no audio. The film's own
// soundtrack is muxed in instead: timeline.js publishes
// window.__AUDIO_CUES__ ([{ file, at, from, dur }], ad seconds; here the
// play beat's window clip, img/film/clip-window.mp4, then the montage,
// img/film/clip-montage.mp4, back to back). Each cue's file is fetched and
// decoded once (Web Audio), and on the take's first frame every cue is
// scheduled on the AudioContext's clock at exactly its `at`, from its
// `from`, for its `dur`, into a MediaStreamDestination whose track is
// recorded beside the canvas (and played out, so the take can be heard).
// The cues are read live from the page when the take starts, never copied.
//
// The take ends on the ad's last frame: at CYCLE the show is parked on its
// final frame (the montage's last frame, the film's own last frame: black
// after its title card's fade) and held
// for END_HOLD so the capture's own lag never lets the loop's first frame
// into the file; the soundtrack has ended by then (the last cue stops at
// CYCLE).
(() => {
  'use strict';
  const W = 1920, H = 1080;            // 16:9 (user ask: same aspect ratio as the real thing)
  const FPS = 30;
  const END_HOLD = 0.15;               // seconds the last frame is held past CYCLE (covers the capture's lag)
  const FILE = 'superbot-austerlitz.webm';

  const btn = document.getElementById('recordBtn');
  const label = document.getElementById('recordLabel');
  const hud = document.getElementById('recHud');
  const hudTime = document.getElementById('recTime');
  const hint = document.getElementById('hint');
  const chromeBits = [btn, hud, hint].filter(Boolean);
  if (document.body.classList.contains('freeze')) btn.style.display = 'none';

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function pickMime(withAudio) {
    const list = withAudio
      ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const m of list) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }

  // decoded soundtracks, one per file, kept across takes
  const decoded = new Map();
  function decode(actx, file) {
    if (!decoded.has(file)) {
      decoded.set(file, fetch(new URL(file, document.baseURI).href)
        .then((r) => { if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`); return r.arrayBuffer(); })
        .then((buf) => actx.decodeAudioData(buf))
        .catch((err) => { decoded.delete(file); throw err; }));
    }
    return decoded.get(file);
  }

  // the take's soundtrack: the page's audio cues, decoded, ready to schedule. Resolves to null (a silent take,
  // with a warning) when the page has no cues or Web Audio cannot decode them.
  async function soundtrack() {
    const cues = (window.__AUDIO_CUES__ || []).filter((c) => c && c.file && c.dur > 0);
    if (!cues.length || !window.AudioContext) return null;
    const actx = new AudioContext({ sampleRate: 48000 });
    try {
      const bufs = await Promise.all(cues.map((c) => decode(actx, c.file)));
      const dest = actx.createMediaStreamDestination();
      return { actx, dest, cues: cues.map((c, i) => ({ ...c, buf: bufs[i] })), srcs: [] };
    } catch (err) {
      console.warn('recorder: the soundtrack could not be decoded, recording picture only:', err);
      actx.close();
      return null;
    }
  }

  let active = false; // a take is in flight

  async function record() {
    if (active || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia
        || !window.MediaRecorder || !window.__V7) return;
    active = true;
    // decode the soundtrack while the share sheet is up (the AudioContext is made inside the click)
    const soundP = soundtrack();
    let stream;
    try {
      // preferCurrentTab (Chrome 94+): the share sheet opens on this tab
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: FPS, cursor: 'never' },
        preferCurrentTab: true,
        audio: false,
      });
    } catch (err) {
      console.warn('recorder: capture cancelled or failed:', err);
      soundP.then((s) => { if (s) s.actx.close(); });
      active = false;
      return;
    }
    const sound = await soundP;

    // page chrome would be visible in a tab capture, so hide it for the take
    const prev = chromeBits.map(el => el.style.display);
    chromeBits.forEach(el => { el.style.display = 'none'; });
    hud.style.display = 'flex';

    // the stream is the tab: play it into a video, composite contain-fit
    // into the 16:9 canvas (the dark bars vanish into the page background),
    // and rewind the show so the take starts at the first frame
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    const tracks = out.captureStream(FPS).getVideoTracks();
    if (sound) tracks.push(...sound.dest.stream.getAudioTracks());
    const mime = pickMime(!!sound);
    const opts = { videoBitsPerSecond: 12_000_000 };
    if (sound) opts.audioBitsPerSecond = 192_000;
    if (mime) opts.mimeType = mime;
    const rec = new MediaRecorder(new MediaStream(tracks), opts);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const done = new Promise((res) => { rec.onstop = res; });

    const meta = window.__V7;
    const speed = meta.SPEED || 1;
    const wall = meta.CYCLE / speed;
    let parked = false;
    if (sound && sound.actx.state === 'suspended') await sound.actx.resume();

    rec.start(250);
    const started = performance.now();
    if (meta.restart) meta.restart();   // the show begins at frame one
    if (sound) {
      // every cue on the audio clock, from this very moment (= ad t 0)
      const a0 = sound.actx.currentTime + 0.005;
      for (const c of sound.cues) {
        const src = sound.actx.createBufferSource();
        src.buffer = c.buf;
        src.playbackRate.value = speed;
        src.connect(sound.dest);
        src.connect(sound.actx.destination);
        src.start(a0 + c.at / speed, c.from, c.dur);
        sound.srcs.push(src);
      }
    }
    const esc = (ev) => { if (ev.key === 'Escape') finish(); };
    window.addEventListener('keydown', esc);

    (function composite() {
      const t = (performance.now() - started) / 1000;
      // the loop is over: park the show on its last frame, so the take ends there and never on frame one
      if (!parked && t >= wall && window.__AD && window.__AD.seek) { window.__AD.seek(meta.CYCLE - 1e-4); parked = true; }
      const k = Math.min(W / video.videoWidth, H / video.videoHeight) || 1;
      const dw = video.videoWidth * k, dh = video.videoHeight * k;
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);
      if (dw) ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
      hudTime.textContent = fmt(Math.min(t, wall));
      if (active && t < wall + END_HOLD) requestAnimationFrame(composite);
      else finish();
    })();

    async function finish() {
      if (!active) return;
      active = false;
      window.removeEventListener('keydown', esc);
      if (rec.state !== 'inactive') rec.stop();
      await done;
      stream.getTracks().forEach(tr => tr.stop());
      if (sound) {
        sound.srcs.forEach((s) => { try { s.stop(); } catch (e) { /* already ended */ } });
        sound.actx.close();
      }
      chromeBits.forEach((el, i) => { el.style.display = prev[i]; });
      if (parked && meta.restart) meta.restart(); // the page loops on again
      const blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type || 'video/webm' : 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = FILE;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }

  btn.addEventListener('click', () => { if (!active) record(); });
})();
