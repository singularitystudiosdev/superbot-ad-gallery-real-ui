// Scene "deck" (3.75 s): "...WITH ALL THE MODELS" made literal. A deck of model cards flicks through all 16 models of
// the roster, faster and faster, under superbot's routing chip ("Switching to <Model> ✓").
//   0.00 to 3.45  the deck: front card = logo + name + role, two dimmed cards peek below it. Each switch, the front
//                 card lifts up and back (rise, tilt, shrink, blur, fade) and the next rises from the pile to front.
//                 Cards 1 to 4 hold ~0.40 s, then the cadence tightens to 0.08 s for the last few.
//   3.45 to 3.75  the last card and the chip lift away together while the timeline fades the scene into the chat.
// render(lt) is a pure function of lt: every position, opacity and stroke is computed from lt here; nothing in
// deck.css animates on its own.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic } from '../lib.js';

const B = (f) => new URL('../brand/' + f, import.meta.url).href;

// the roster, in the order of appearance (shared spec; Hunyuan 3D replaced Lyria in slot 10). Veo is a Google
// DeepMind model: it carries the DeepMind mark. Hunyuan 3D is Tencent's: the Hunyuan mark. Seedance is ByteDance Seed's model: it carries the ByteDance mark.
export const ROSTER = [
  { name: 'Gemini', role: 'Images', logo: 'gemini-logo.svg' },
  { name: 'Opus 5.5', role: 'Code', logo: 'claude-logo.svg' },
  { name: 'DeepSeek', role: 'Research', logo: 'deepseek-logo.svg' },
  { name: 'Meshy', role: '3D models', logo: 'meshy-logo.svg' },
  { name: 'MiniMax', role: 'Video', logo: 'minimax-logo.svg' },
  { name: 'Kling', role: 'Video', logo: 'kling-logo.svg' },
  { name: 'Veo', role: 'Video', logo: 'deepmind-logo.svg' },
  { name: 'Suno', role: 'Music', logo: 'suno-logo.svg' },
  { name: 'ElevenLabs', role: 'Voice', logo: 'elevenlabs-logo.svg' },
  { name: 'Hunyuan 3D', role: '3D models', logo: 'hunyuan-logo.svg' },
  { name: 'Nano Banana', role: 'Images', logo: 'nanobanana-logo.svg' },
  { name: 'GPT', role: 'Reasoning', logo: 'openai-logo.svg' },
  { name: 'Grok', role: 'Live search', logo: 'grok-logo.svg' },
  { name: 'Runway', role: 'Video edit', logo: 'runway-logo.svg' },
  { name: 'Qwen', role: 'Multilingual', logo: 'qwen-logo.svg' },
  { name: 'Seedance', role: 'Motion', logo: 'bytedance-logo.svg' },
];
const N = ROSTER.length;

// ---------- the schedule (local s) ----------
// GAPS[i] = time from switch i to switch i+1 (switch 0 is the deck's entrance with Gemini already in front).
// Four cards at 0.40 s (Gemini's includes the entrance), then the cadence tightens down to 0.08 s.
const GAPS = [0.42, 0.40, 0.38, 0.38, 0.30, 0.24, 0.19, 0.15, 0.12, 0.10, 0.09, 0.08, 0.08, 0.08, 0.08];
export const SWITCH = [0];                     // SWITCH[i]: card i starts rising to the front
for (const g of GAPS) SWITCH.push(+(SWITCH[SWITCH.length - 1] + g).toFixed(4));
const END = 3.45;                              // the exit lift starts; the scene ends 0.30 s later
const gapAfter = (i) => (i + 1 < N ? SWITCH[i + 1] : END) - SWITCH[i];
// switch duration: short and snappy; at the fast end the switch fills its whole gap so the deck flows
const SW_DUR = (i) => Math.min(0.24, 0.92 * gapAfter(i));
const ENTER = 0.30;                            // the deck rises in (the join from the black card is a hard cut)

// the deck's continuous position: k = index of the front card, fractional mid-switch
function deckK(lt) {
  let k = 0;
  for (let i = 1; i < N; i++) k += outCubic(seg(lt, SWITCH[i], SWITCH[i] + SW_DUR(i)));
  return k;
}
// the card whose switch has started (the chip names it)
function current(lt) {
  let c = 0;
  for (let i = 1; i < N; i++) if (lt >= SWITCH[i]) c = i;
  return c;
}

// ---------- geometry (stage px; the stage is always 1080 tall) ----------
const PEEK_Y = 54, PEEK_S = 0.075;             // each card down the pile: lower by PEEK_Y, smaller by PEEK_S

let el = null;

function measure() {
  if (!el) return;
  const w = el.meas.map((m) => m.offsetWidth);
  if (w.every((x) => x > 0)) el.nameW = w;
}

export default {
  id: 'deck',
  dur: 3.75,

  mount(sec) {
    const card = (m, i) => `<div class="dk-card" data-i="${i}"><div class="dk-face"><img class="dk-logo" src="${B(m.logo)}" alt="" decoding="sync"/><div class="dk-name">${m.name}</div><div class="dk-role">${m.role}</div></div><i class="dk-shade"></i></div>`;
    sec.innerHTML = `
<div class="dk-chipwrap"><div class="dk-chip">
  <span class="dk-ct"><img class="dk-ci dk-ci-a" alt="" decoding="sync"/><img class="dk-ci dk-ci-b" alt="" decoding="sync"/></span>
  <span class="dk-cl">Switching to <span class="dk-nm"><span class="dk-n dk-n-a"></span><span class="dk-n dk-n-b"></span></span></span>
  <svg class="dk-ok" viewBox="0 0 24 24"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/></svg>
</div></div>
<div class="dk-deck">${ROSTER.map(card).join('')}</div>
<div class="dk-meas">${ROSTER.map((m) => `<span class="dk-n">${m.name}</span>`).join('')}</div>`;
    const q = (s) => sec.querySelector(s);
    const qa = (s) => [...sec.querySelectorAll(s)];
    el = {
      sec,
      chipWrap: q('.dk-chipwrap'), chip: q('.dk-chip'),
      ciA: q('.dk-ci-a'), ciB: q('.dk-ci-b'), nm: q('.dk-nm'), nA: q('.dk-n-a'), nB: q('.dk-n-b'),
      ok: q('.dk-ok path'),
      deck: q('.dk-deck'),
      cards: qa('.dk-card').map((c) => ({ c, face: c.querySelector('.dk-face'), shade: c.querySelector('.dk-shade') })),
      meas: qa('.dk-meas .dk-n'),
      nameW: null, shown: [-1, -1],
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  },

  render(lt) {
    if (!el) return;
    if (!el.nameW) measure();
    const t = clamp(lt, 0, this.dur);

    // ---------- the deck ----------
    const ent = outQuint(seg(t, 0, ENTER));
    // the exit: the last card lifts up and away under the timeline's fade into the chat
    const out = inOutCubic(seg(t, END, END + 0.3));
    el.deck.style.opacity = (ent * (1 - out)).toFixed(3);
    el.deck.style.transform = `translateY(${((1 - ent) * 70 - out * 60).toFixed(2)}px) scale(${lerp(1, 0.94, out).toFixed(4)})`;

    const k = deckK(t);
    el.cards.forEach(({ c, face, shade }, i) => {
      const p = i - k;                                   // 0 = front, 1, 2 = the pile, < 0 = lifting off
      if (p <= -1 || p >= 3) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      let ty, sc, rx = 0, blur = 0, o = 1, fo = 1, dim = 0, z;
      if (p >= 0) {
        ty = p * PEEK_Y; sc = 1 - p * PEEK_S;
        dim = Math.min(0.78, p * 0.36);
        o = 1 - seg(p, 2, 3);
        z = 100 - Math.round(p * 10);
      } else {
        const u = -p;                                    // 0..1 through the lift
        ty = -u * 170; sc = 1 - u * 0.1; rx = u * 26; blur = u * 6;
        // it lifts off the top of the deck, over the next card. Its face (logo, name, role) clears first, then the
        // blank card fades: the next card shows through an empty card, never text over text.
        fo = 1 - seg(u, 0, 0.25);
        o = 1 - seg(u, 0.22, 0.5);
        dim = 0.35 * seg(u, 0, 0.55);
        z = 200;
      }
      c.style.zIndex = String(z);
      c.style.opacity = o.toFixed(3);
      c.style.transform = rx > 0.01 ? `perspective(1500px) translateY(${ty.toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(4)})` : `translateY(${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`;
      c.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      face.style.opacity = fo.toFixed(3);
      shade.style.opacity = dim.toFixed(3);
    });

    // ---------- the routing chip ----------
    const cur = current(t);
    const prev = Math.max(0, cur - 1);
    const g = gapAfter(cur);
    // the name (and the logo in the chip's tile) crossfade per switch
    const f = cur === 0 ? 1 : outCubic(seg(t, SWITCH[cur], SWITCH[cur] + Math.min(0.16, 0.85 * g)));
    if (el.shown[0] !== prev) { el.nA.textContent = ROSTER[prev].name; el.ciA.src = B(ROSTER[prev].logo); el.shown[0] = prev; }
    if (el.shown[1] !== cur) { el.nB.textContent = ROSTER[cur].name; el.ciB.src = B(ROSTER[cur].logo); el.shown[1] = cur; }
    // a masked ticker: the old name rolls up and out as the new one rolls up into place; they barely coexist
    const outO = cur === 0 ? 0 : 1 - seg(f, 0, 0.5);
    const inO = seg(f, 0.25, 0.8);
    el.nA.style.opacity = outO.toFixed(3);
    el.nA.style.transform = `translateY(${(-f * 22).toFixed(2)}px)`;
    el.nB.style.opacity = inO.toFixed(3);
    el.nB.style.transform = `translateY(${((1 - f) * 22).toFixed(2)}px)`;
    el.ciA.style.opacity = outO.toFixed(3);
    el.ciA.style.transform = `scale(${lerp(1, 0.6, f).toFixed(4)})`;
    el.ciB.style.opacity = inO.toFixed(3);
    el.ciB.style.transform = `scale(${lerp(0.6, 1, f).toFixed(4)})`;
    if (el.nameW) el.nm.style.width = lerp(el.nameW[prev], el.nameW[cur], cur === 0 ? 1 : f).toFixed(2) + 'px';
    // the check re-draws on every switch, after the name lands
    let draw;
    if (cur === 0) draw = outCubic(seg(t, 0.16, 0.42));
    else {
      const dly = Math.min(0.06, 0.25 * g);
      draw = outCubic(seg(t, SWITCH[cur] + dly, SWITCH[cur] + dly + clamp(0.8 * g - dly, 0.05, 0.24)));
    }
    el.ok.style.strokeDashoffset = (1 - draw).toFixed(4);
    // the chip rides in with the deck and lifts out with it
    const cIn = outQuint(seg(t, 0.04, 0.34));
    el.chipWrap.style.opacity = (cIn * (1 - out)).toFixed(3);
    el.chipWrap.style.transform = `translateY(${((1 - cIn) * 24 - out * 60).toFixed(2)}px)`;
  },
};
