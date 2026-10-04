// B2 (0.55-3.25): the thumbnail race. Three framed panes side by side, one per model in img/models.json (slot a Nano
// Banana Pro, b GPT-5.4 Image 2, c FLUX.2 Pro). Each pane's model chip lands in a fast stagger and switches like the
// original's hand-off pills (tile pops in, spinner resolves to the green check); the three resolve sequences
// (media/resolve-{a,b,c}, 66 frames each, decoded before the first frame) play in parallel, drawn by frame index from
// t, each pane's bar and percentage following its own sequence to its finish frame (manifest finishFrame). Once all
// three are done superbot picks slot b: the storm ring and its Winner tag, the other two dim but stay; then
// "Testing all 3 in YouTube Studio" lands. Pane b's picture is handed to the flyer in B3 (studio.js).
import { lerp, seg, outCubic, inOutCubic, esc, clamp } from '../../../lib.js';
import { makeMark } from '../../../mark.js';
import { drawSeq, seqIndex } from '../frames.js';
import { RACE, WINNER, FPS } from '../marks.js';

const brand = (f) => new URL('../../../brand/' + f, import.meta.url).href;
const OK = '<svg class="x3-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the chip tile per logo (models.json chip_logo; FLUX.2 Pro has none there, so its maker's mark: brand/bfl-logo.svg)
const LOGO = { gemini: 'gemini-logo.svg', openai: 'openai-logo.svg', bfl: 'bfl-logo.svg' };

// the layout, in stage px at 1080 high (centred on the frame width)
export const PANE = { w: 576, imgH: 324, hd: 76, ft: 68, gap: 40, top: 336 };
const HEAD_TOP = 226, NEXT_TOP = 880;

export function buildRace(layer, models, seqs, finish) {
  const slots = models.slots;
  layer.innerHTML = `
  <div class="x3-head"><span class="x3-head-mark"></span><span class="x3-head-tx"><b>superbot</b><span>Racing 3 image models on the thumbnail for <em>${esc(models.video.title)}</em></span></span></div>
  ${slots.map((s, i) => `<div class="x3-pane" data-slot="${s.slot}">
    <div class="x3-pane-hd">
      <span class="x3-chip"><span class="x3-tile x3-t-${s.chip_logo || 'bfl'}"><img src="${brand(LOGO[s.chip_logo || 'bfl'])}" alt=""/></span><span class="x3-chip-l">${esc(s.display_name)}</span><span class="x3-st"><i class="x3-spin"></i>${OK}</span></span>
      <span class="x3-dim">${s.width} × ${s.height}</span>
    </div>
    <div class="x3-pane-img"><canvas width="${PANE.w}" height="${PANE.imgH}"></canvas></div>
    <div class="x3-pane-ft"><div class="x3-bar"><i></i></div><span class="x3-mid">${esc(s.model_id)}</span><span class="x3-pct"><span class="x3-pct-ok">${OK}</span><span class="x3-pct-t">0%</span></span></div>
  </div>`).join('')}
  <div class="x3-ring"></div>
  <span class="x3-win-tag"><span class="x3-win-mark"></span>Winner</span>
  <div class="x3-next"><span class="x3-next-pill"><span class="x3-tile x3-t-yt"><img src="${brand('youtube-icon.svg')}" alt=""/></span><span>Testing all 3 in YouTube Studio</span><span class="x3-st"><i class="x3-spin"></i>${OK}</span></span></div>`;
  const q = (s, r = layer) => r.querySelector(s);
  const headMark = makeMark(64), winMark = makeMark(34);
  q('.x3-head-mark').appendChild(headMark.el);
  q('.x3-win-mark').appendChild(winMark.el);
  const panes = [...layer.querySelectorAll('.x3-pane')].map((p, i) => ({
    p, slot: slots[i].slot, seq: seqs[i], finish: finish[i],
    chip: q('.x3-chip', p), tile: q('.x3-tile', p), spin: q('.x3-spin', p), ok: q('.x3-st .x3-ok', p),
    canvas: q('canvas', p), bar: q('.x3-bar i', p), pct: q('.x3-pct-t', p), pctOk: q('.x3-pct-ok', p), last: '',
  }));
  return {
    layer, panes, head: q('.x3-head'), ring: q('.x3-ring'), tag: q('.x3-win-tag'), next: q('.x3-next'),
    nextSpin: q('.x3-next .x3-spin'), headMark, winMark, W: 0,
  };
}

function place(r, W) {
  if (r.W === W) return;
  r.W = W;
  const total = 3 * PANE.w + 2 * PANE.gap, x0 = (W - total) / 2;
  r.panes.forEach((p, i) => {
    p.x = x0 + i * (PANE.w + PANE.gap);
    Object.assign(p.p.style, { left: p.x + 'px', top: PANE.top + 'px', width: PANE.w + 'px' });
  });
  r.head.style.top = HEAD_TOP + 'px';
  r.head.style.left = x0 + 'px';
  r.next.style.top = NEXT_TOP + 'px';
  const w = r.panes.find((p) => p.slot === WINNER);
  const PAD = 10, H = PANE.hd + PANE.imgH + PANE.ft;
  Object.assign(r.ring.style, { left: (w.x - PAD) + 'px', top: (PANE.top - PAD) + 'px', width: (PANE.w + 2 * PAD) + 'px', height: (H + 2 * PAD) + 'px' });
  r.tag.style.left = (w.x + PANE.w / 2) + 'px';
  r.tag.style.top = (PANE.top - PAD) + 'px';
}

/** the canvas of the winning pane, in stage px (studio.js flies the winner from here) */
export const winnerCanvas = (r) => r.panes.find((p) => p.slot === WINNER).canvas;

export function renderRace(r, t, W) {
  place(r, W);
  const vis = t >= RACE.in[0] - 0.01 && t < RACE.out[1] + 0.01;
  r.layer.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return;
  const out = inOutCubic(seg(t, RACE.out[0], RACE.out[1]));
  const hin = outCubic(seg(t, RACE.in[0], RACE.in[1]));
  r.head.style.opacity = (hin * (1 - out)).toFixed(3);
  r.head.style.transform = `translateY(${((1 - hin) * 18).toFixed(2)}px)`;
  r.headMark.render(t);
  const pick = outCubic(seg(t, RACE.pick, RACE.pick + 0.22));

  r.panes.forEach((p, i) => {
    const a = RACE.pane[i];
    const pin = outCubic(seg(t, a, a + 0.3));
    const win = p.slot === WINNER;
    // after the pick the other two dim (they stay in place); on the way out the losers fade, the winner's frame
    // fades while its picture is handed to the flyer
    const dim = win ? 1 : lerp(1, 0.4, pick);
    p.p.style.opacity = (pin * dim * (1 - out)).toFixed(3);
    p.p.style.transform = pin >= 1 ? 'none' : `translateY(${((1 - pin) * 28).toFixed(2)}px) scale(${lerp(0.97, 1, pin).toFixed(4)})`;
    p.p.style.filter = win || pick <= 0 ? 'none' : `saturate(${lerp(1, 0.35, pick).toFixed(3)})`;
    // the chip: tile pops, spinner turns, check lands (the model switch)
    const done = RACE.chipDone[i];
    const tp = outCubic(seg(t, a + 0.04, a + 0.26));
    p.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
    p.spin.style.opacity = (1 - seg(t, done - 0.08, done + 0.06)).toFixed(3);
    p.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
    const o = outCubic(seg(t, done, done + 0.2));
    p.ok.style.opacity = o.toFixed(3);
    p.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
    // the sequence, by frame index (frame 1 sits there until the race starts)
    const idx = clamp(seqIndex(t, RACE.seq0, FPS), 0, p.seq.length - 1);
    drawSeq(p.canvas, p.seq, idx);
    const f = clamp((idx + 1) / p.finish, 0, 1) * (t >= RACE.seq0 ? 1 : 0);
    p.bar.style.width = (f * 100).toFixed(2) + '%';
    const ready = f >= 1;
    const txt = ready ? 'Ready' : `${Math.floor(f * 100)}%`;
    if (txt !== p.last) { p.pct.textContent = txt; p.last = txt; p.p.classList.toggle('x3-ready', ready); }
    p.pctOk.style.opacity = ready ? '1' : '0';
  });

  // the pick: the storm ring draws in around pane b, its Winner tag pops on the ring's top edge
  r.ring.style.opacity = (pick * (1 - out)).toFixed(3);
  r.ring.style.transform = `scale(${lerp(1.035, 1, pick).toFixed(4)})`;
  const tg = outCubic(seg(t, RACE.pick + 0.06, RACE.pick + 0.26));
  r.tag.style.opacity = (tg * (1 - out)).toFixed(3);
  r.tag.style.transform = `translate(-50%, -50%) scale(${lerp(0.7, 1, tg).toFixed(4)})`;
  r.winMark.render(t);
  // the hand-off to Studio
  const nx = outCubic(seg(t, RACE.line, RACE.line + 0.22));
  r.next.style.opacity = (nx * (1 - out)).toFixed(3);
  r.next.style.transform = `translate(-50%, ${((1 - nx) * 14).toFixed(2)}px)`;
  r.nextSpin.style.transform = `rotate(${((t - RACE.line) * 420).toFixed(1)}deg)`;
}
