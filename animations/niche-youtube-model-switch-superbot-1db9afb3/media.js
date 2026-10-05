// Every clip in the spot (the Blender viewport, the thread's video embeds, the pages in the browser pane) is a
// <video> whose time is a pure function of the spot's clock. Live playback lets each clip play and only corrects
// drift; a seek (?t=, the renderer, the gallery's scrubber) parks every clip on its exact frame and renderSettled
// waits for the seeks to land. WebM (VP9) first, MP4 (H.264) for Safari.
export function makeVideo(doc, name, base) {
  const v = doc.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  for (const [ext, type] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) {
    const s = doc.createElement('source');
    s.src = new URL(`media/${name}.${ext}`, base).href;
    s.type = type;
    v.appendChild(s);
  }
  return v;
}

export class Media {
  constructor() { this.clips = []; this.frozen = false; }
  // at(t) -> the clip's time in seconds, or null while the clip is not playing (it then holds `rest`)
  add(el, at, rest = 0) { this.clips.push({ el, at, rest }); return el; }
  sync(t) {
    for (const c of this.clips) {
      const want = c.at(t);
      const v = c.el;
      if (v.readyState < 1) continue;
      const target = want === null ? c.rest : Math.min(want, (v.duration || 1e9) - 0.04);
      if (this.frozen || want === null) {
        if (!v.paused) v.pause();
        if (Math.abs(v.currentTime - target) > 0.015) v.currentTime = target;
      } else {
        if (Math.abs(v.currentTime - target) > 0.25) v.currentTime = target;
        if (v.paused) v.play().catch(() => {});
      }
    }
  }
  // resolves once every clip has the frame for its current time
  settled() {
    return Promise.all(this.clips.map(({ el: v }) => new Promise((res) => {
      const done = () => res();
      if (v.readyState >= 2 && !v.seeking) return done();
      const t = setTimeout(done, 1500);
      const ok = () => { clearTimeout(t); done(); };
      v.addEventListener('seeked', ok, { once: true });
      v.addEventListener('loadeddata', ok, { once: true });
    })));
  }
  ready() {
    return Promise.all(this.clips.map(({ el: v }) => new Promise((res) => {
      if (v.readyState >= 2) return res();
      const t = setTimeout(res, 8000);
      v.addEventListener('loadeddata', () => { clearTimeout(t); res(); }, { once: true });
      v.load();
    })));
  }
}
