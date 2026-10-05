// App beat: the app Opus just built opens on localhost:3000. A browser card lands in the chat and opens to the full
// frame (the strava.js layer pattern from the source: ONE client on a layer in the scene root, laid out at the frame
// over APP_SCALE, pinned over the card while it sits in the chat). Then the race plays: the Blender flyover runs from
// mile 4.1 to the finish, the HUD reads the mile, the stretch and the target from SPLITS, the runner rides the real
// elevation profile, and at mile 7 the coach card plays the Ocean Pkwy cue (the MP4 mixes media/voice/ocean.mp3 there).
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js';
import { sayLine, rise, setText, media } from './kit.9f1df009.js?v=9f1df009';
import { SPLITS, LAST } from './code.js?v=9f1df009';
import { VOICE } from '../../../media/data.9f1df009.js?v=9f1df009';
import { clientHTML, MI, whereAt, CUE, CUE_MI, cueWords, profileY } from './app-ui.9f1df009.js?v=9f1df009';

const SAY = 'Opening it on localhost:3000.';
const GOAL = SPLITS.reduce((a, b) => a + b, 0) + LAST;
const NF = 96, F0 = 30, FPS = 24;                   // the flyover plays frames F0..NF-1 at 24 fps
const mileOf = (f) => (f / (NF - 1)) * MI;
const F_CUE = Math.ceil((CUE_MI / MI) * (NF - 1));  // the frame where the runner crosses mile 7
const APP_SCALE = 1.4, RADIUS = 12;
const frame = (i) => media(`fly/f_${String(i).padStart(3, '0')}.jpg`);
const clockAt = (m) => { // planned elapsed time at mile m, h:mm:ss
  let s = 0; for (let i = 0; i < 13; i++) s += SPLITS[i] * Math.max(0, Math.min(1, m - i));
  s += LAST * Math.max(0, m - 13) / (MI - 13);
  const r = Math.floor(s);
  return `${Math.floor(r / 3600)}:${String(Math.floor((r % 3600) / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
};

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;
    T.grow = T.card + 0.55;
    T.full = T.grow + 0.45; /* deliberate */
    T.play = T.full + 0.15;
    T.cue = T.play + (F_CUE - F0) / FPS;           // the Ocean Pkwy cue starts (absolute, for the MP4 mix)
    T.last = T.play + (NF - 1 - F0) / FPS;
    T.end = T.last + 0.9; /* deliberate */          // the finish holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    for (let i = F0; i < NF; i++) new Image().src = frame(i);
    const say = sayLine(x, SAY, T.r + 0.05, 80);
    const card = x.el(`<div class="rk-card ap-card"><div class="ap-mini"><div class="ap-mbar"><i class="ap-dots"><b></b><b></b><b></b></i>
      <span class="ap-murl">localhost:3000</span></div><div class="ap-mvp"><img src="${media('hero.jpg')}" alt=""></div></div></div>`);
    const vp = card.querySelector('.ap-mini');
    const layer = x.el(`<div class="ap-full" aria-hidden="true">${clientHTML(x, SPLITS, GOAL)}</div>`);
    x.root.appendChild(layer);
    const client = layer.firstElementChild, $ = (s) => layer.querySelector(s);
    const img = $('.ap-fimg'), mile = $('.ap-mile'), where = $('.ap-where'), tp = $('.ap-tp'), clock = $('.ap-clock');
    const prog = $('.ap-prog i'), cr = $('.ap-cr'), dot = $('.ap-dot'), cells = [...layer.querySelectorAll('.ap-pace span')];
    const live = $('.ap-live'), wc = $('.ap-wc'), pl = $('.ap-pl'), words = [...layer.querySelectorAll('.ap-ctx span')];
    const p1 = $('.ap-p1'), pt = $('.ap-pt'), coach = $('.ap-coach');
    let AW = 1371, AH = 771, geo = '', feed = null, src = '';
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H || `${W}x${H}` === geo) return;
      geo = `${W}x${H}`; AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      client.style.width = `${AW}px`; client.style.height = `${AH}px`;
    };
    return {
      nodes: [say.n, card],
      marks: [[T.r, say.n], [T.card, card]],
      render(t) {
        say.render(t);
        rise(card, seg(t, T.card, T.card + 0.3));
      },
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(vp), W = x.root.offsetWidth, H = x.root.offsetHeight;
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = vp.offsetWidth ? b.w / vp.offsetWidth : 1;
        Object.assign(layer.style, { left: `${L.toFixed(2)}px`, top: `${Tp.toFixed(2)}px`, width: `${Wd.toFixed(2)}px`, height: `${Ht.toFixed(2)}px`,
          borderRadius: `${(RADIUS * s * (1 - g)).toFixed(2)}px`, opacity: outCubic(seg(t, T.grow, T.grow + 0.12)).toFixed(3) });
        const sc = Math.max(Wd / AW, Ht / AH);
        client.style.transform = `translate(${((Wd - AW * sc) / 2).toFixed(2)}px, ${((Ht - AH * sc) / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0)` : '';

        // the race: the flyover frame, and everything the HUD, profile and coach read off it
        const f = Math.max(F0, Math.min(NF - 1, F0 + Math.floor((t - T.play) * FPS)));
        const sf = frame(f); if (sf !== src) { img.src = sf; src = sf; }
        const m = t < T.play ? mileOf(F0) : Math.min(MI, mileOf(F0) + (t - T.play) * FPS * (MI / (NF - 1)));
        setText(mile, m >= MI - 0.01 ? 'FINISH' : `MILE ${m.toFixed(1)}`);
        setText(where, whereAt(m));
        setText(tp, `${Math.floor(SPLITS[Math.min(12, Math.floor(m))] / 60)}:${String(SPLITS[Math.min(12, Math.floor(m))] % 60).padStart(2, '0')}`);
        setText(clock, clockAt(m));
        prog.style.transform = `scaleX(${(m / MI).toFixed(4)})`;
        cr.setAttribute('width', ((m / MI) * 1000).toFixed(1));
        dot.style.left = `${((m / MI) * 100).toFixed(2)}%`; dot.style.top = `${(profileY(m) * 100).toFixed(2)}%`;
        cells.forEach((c, i) => { c.classList.toggle('on', Math.floor(m) === i); c.classList.toggle('dn', i < Math.floor(m)); });
        // the coach: "Up next" until mile 7, then the cue plays in real time, its words lighting as they are spoken
        const v = VOICE[CUE], cp = seg(t, T.cue, T.cue + v.dur);
        const on = t >= T.cue;
        setText(live, on && cp < 1 ? 'Now playing' : on ? 'Played' : 'Up next');
        live.classList.toggle('on', on && cp < 1);
        coach.classList.toggle('on', on);
        wc.style.width = `${(cp * 100).toFixed(2)}%`;
        pl.classList.toggle('on', on && cp < 1);
        const sp = seg(t, T.cue + v.on, T.cue + v.off);
        words.forEach((w, i) => w.classList.toggle('lit', on && sp * cueWords.length > i));
        // the photo: the hill until Ocean Pkwy, then the finish waiting at the end of it
        p1.style.opacity = outCubic(seg(t, T.cue, T.cue + 0.4)).toFixed(3);
        setText(pt, m >= 12.4 ? 'Now · Coney Island finish' : on ? 'Up next · Coney Island finish' : 'Now · East Drive hill');
      },
    };
  },
};
