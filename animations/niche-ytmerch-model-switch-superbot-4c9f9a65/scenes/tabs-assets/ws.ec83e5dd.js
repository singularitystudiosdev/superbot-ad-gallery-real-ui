// superbot's workspace panel: the right two-thirds of the 16:9 frame, where the tool that holds the job right now
// works in the open (the agent "computer" pattern). Three parts:
//   head   the tool on duty (its tile, name and what it is doing) and "Step n of 6"
//   body   each link's own screen (the beat module's ws element), swapped as its pill lands
//   strip  the chain itself: six nodes in hand-off order; the active one is ringed, a finished one shows its output
//          file, and that file rides the link to the next node during the hand-off
// renderWorkspace(w, t) is a pure function of the scene's local time.
import { lerp, seg, outCubic, inOutCubic, esc } from '../../lib.js';

const SHORT = { deepseek: 'DeepSeek', blender: 'Blender', gemini: 'Nano Banana', opus: 'Opus 5.5', eleven: 'ElevenLabs', studio: 'YouTube' };
const SWAP_IN = 0.36, SWAP_OUT = 0.18, SWAP_GAP = 0.12, SLIDE = 44; // the old screen clears before the new one lands

export function mountWorkspace(host, beats, ctx) {
  const { tile, APPS, el } = ctx;
  host.innerHTML = `
<div class="ws">
  <div class="ws-head"><div class="ws-whos"></div><div class="ws-meta"><span class="ws-live"><i></i>Working</span><span class="ws-step">Step 1 of ${beats.length}</span></div></div>
  <div class="ws-body"><div class="ws-idle"><span class="ws-idle-t">Planning ${beats.length} hand-offs</span><span class="ws-idle-s">${esc(beats.map((b) => SHORT[b.k.app]).join('  ·  '))}</span></div></div>
  <div class="ws-strip"></div>
</div>`;
  const q = (s) => host.querySelector(s);
  const whos = q('.ws-whos'), body = q('.ws-body'), strip = q('.ws-strip');
  const idle = q('.ws-idle');
  const w = { host, idle, step: q('.ws-step'), live: q('.ws-live'), items: [], lastStep: null };
  beats.forEach((b, i) => {
    const a = APPS[b.k.app];
    const who = el(`<div class="ws-who">${tile(b.k.app, 'ws-tile')}<div class="ws-names"><b>${esc(a.name)}</b><small>${esc(b.inst.head)}</small></div></div>`);
    whos.appendChild(who);
    const screen = el('<div class="ws-screen"></div>');
    screen.appendChild(b.inst.ws);
    body.appendChild(screen);
    if (i) strip.appendChild(el(`<i class="ws-link"><b></b><span class="ws-tok">${esc(beats[i - 1].inst.out)}</span></i>`));
    const node = el(`<div class="ws-node">${tile(b.k.app, 'ws-nt')}<span class="ws-nn">${esc(SHORT[b.k.app])}</span><span class="ws-no">${esc(b.inst.out)}</span></div>`);
    strip.appendChild(node);
    w.items.push({ k: b.k, who, screen, node, link: i ? node.previousElementSibling : null });
  });
  return w;
}

export function renderWorkspace(w, t) {
  const its = w.items;
  const plan = its[0].k.send;
  // before the first pill: "planning", the strip draws node by node
  const idleOut = seg(t, its[0].k.sw - 0.1, its[0].k.sw + 0.2);
  w.idle.style.opacity = (outCubic(seg(t, plan + 0.15, plan + 0.45)) * (1 - idleOut)).toFixed(3);
  let cur = -1;
  its.forEach((it, i) => {
    const { k } = it;
    const next = its[i + 1] ? its[i + 1].k.sw : Infinity;
    if (t >= k.sw) cur = i;
    // head: the tool's name slides up into place as its pill lands
    const hin = outCubic(seg(t, k.sw, k.sw + 0.35)), hout = next === Infinity ? 0 : seg(t, next, next + 0.25);
    it.who.style.opacity = (hin * (1 - hout)).toFixed(3);
    it.who.style.transform = `translateY(${((1 - hin) * 22 - hout * 22).toFixed(2)}px)`;
    // body: the screen slides in from the right and leaves to the left when the next one lands
    const bin = outCubic(seg(t, k.sw + SWAP_GAP, k.sw + SWAP_GAP + SWAP_IN)), bout = next === Infinity ? 0 : outCubic(seg(t, next, next + SWAP_OUT));
    const vis = bin * (1 - bout);
    it.screen.style.visibility = vis > 0.001 ? 'visible' : 'hidden';
    it.screen.style.opacity = vis.toFixed(3);
    it.screen.style.transform = vis >= 1 ? 'none' : `translateX(${((1 - bin) * SLIDE - bout * SLIDE).toFixed(2)}px)`;
    // strip
    const nin = outCubic(seg(t, plan + 0.2 + i * 0.07, plan + 0.5 + i * 0.07));
    it.node.style.opacity = lerp(0, t >= k.sw ? 1 : 0.42, nin).toFixed(3);
    it.node.style.transform = nin >= 1 ? 'none' : `translateY(${((1 - nin) * 12).toFixed(2)}px)`;
    it.node.classList.toggle('ws-on', t >= k.sw && t < k.end + 0.05);
    it.node.classList.toggle('ws-ok', t >= k.end);
    const o = outCubic(seg(t, k.end - 0.1, k.end + 0.15));
    const no = it.node.lastElementChild;
    no.style.opacity = o.toFixed(3);
    if (it.link) {
      const prev = its[i - 1].k;
      const lin = outCubic(seg(t, plan + 0.2 + i * 0.07, plan + 0.5 + i * 0.07));
      it.link.style.opacity = lin.toFixed(3);
      const f = inOutCubic(seg(t, prev.end - 0.05, k.sw + 0.05));
      it.link.style.setProperty('--fill', f.toFixed(4));
      const tok = it.link.lastElementChild;
      const tv = seg(f, 0.02, 0.12) * (1 - seg(t, k.sw + 0.02, k.sw + 0.12));
      tok.style.opacity = tv.toFixed(3);
      tok.style.left = `${(f * 100).toFixed(2)}%`;
      tok.style.transform = `translateX(${(-f * 100).toFixed(2)}%)`;
    }
  });
  const step = cur < 0 ? 1 : cur + 1;
  if (step !== w.lastStep) { w.step.textContent = `Step ${step} of ${its.length}`; w.lastStep = step; }
  const last = its[its.length - 1].k;
  w.live.classList.toggle('ws-live-done', t >= last.end - 0.2);
}
