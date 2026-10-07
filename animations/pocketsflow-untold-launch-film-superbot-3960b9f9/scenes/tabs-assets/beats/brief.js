// Beat 1, Gemini 3.1 Pro: reads pocketsflow.com and writes the launch brief. Thread: a receipt (pages read, the
// script's size, the file). Canvas: launch-brief.md, the brand board it pulled off the site (the PF mark, the site's
// own palette and faces, its published numbers) beside the 15 s script, one row per shot with a wireframe, the VO line
// and the on-screen line. Every later model works from this script, so its six shots are the film's six shots.
import { seg, outCubic, outQuint, clamp } from '../../../lib.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

const SOURCES = ['pocketsflow.com', '/pricing', '/features', '/creators', '/checkout', '/tax'];
const SWATCH = [['#0A0A0A', 'Ink'], ['#FFFFFF', 'Paper'], ['#2563EB', 'Accent'], ['#E5E5E5', 'Line']];
// [timecode, shot, VO, on screen, wireframe]
const ROWS = [
  ['0:00', 'Hook', 'Got something to sell?', 'Product cards float in', 'hook'],
  ['0:02', 'Upload', 'Name it, price it, add the files.', 'Product form fills', 'form'],
  ['0:05', 'Share', 'Share one link with everything you sell.', 'Creator page on a phone', 'phone'],
  ['0:07', 'Checkout', 'Buyers pay in their own currency. We handle the tax.', 'Price flips USD to JPY', 'card'],
  ['0:10', 'Dashboard', 'You watch it flow.', 'Revenue climbs, orders land', 'chart'],
  ['0:12', 'Lockup', 'Pocketsflow. The payment infrastructure that you deserve.', 'PF mark, pocketsflow.com', 'logo'],
];
const WF = {
  hook: '<rect x="3" y="3" width="58" height="32" rx="3"/><path d="M16 15h32M22 22h20"/><rect x="6" y="6" width="8" height="7"/><rect x="50" y="24" width="8" height="7"/>',
  form: '<rect x="3" y="3" width="58" height="32" rx="3"/><path d="M8 12h14M8 18h12"/><rect x="32" y="8" width="24" height="22" rx="2"/><path d="M35 13h18M35 18h18M35 24h9"/>',
  phone: '<rect x="3" y="3" width="58" height="32" rx="3"/><path d="M8 14h16M8 20h12"/><rect x="38" y="6" width="14" height="27" rx="3"/><path d="M41 22h8M41 26h8"/>',
  card: '<rect x="3" y="3" width="58" height="32" rx="3"/><rect x="22" y="7" width="22" height="24" rx="2"/><path d="M25 12h16M25 17h10M25 26h16"/><path d="M50 10h7M50 15h7"/>',
  chart: '<rect x="3" y="3" width="58" height="32" rx="3"/><path d="M8 28l9-6 7 3 9-9 8 4 9-8 6-3"/><path d="M8 9h12"/>',
  logo: '<rect x="3" y="3" width="58" height="32" rx="3" class="bk-wf-dk"/><rect x="20" y="13" width="9" height="9" rx="2"/><path d="M32 16h14M32 20h10"/>',
};

export default {
  times(r, o) {
    return { r, read: r + 0.25, readDone: r + 1.45, write: r + 1.55, writeDone: r + 3.55, file: r + 3.7, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Read pocketsflow.com and wrote the launch brief: the brand, the proof, and a 15 second script in six shots.');
    const rows = [{ run: 'Reading pocketsflow.com', done: 'Read 6 pages', count: '6 pages' }, { run: 'Writing the script', done: 'Script ready, 6 shots, 39 words VO' }];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'gemini', 'launch-brief.md', 'Brand, proof and shot list');
    const icon = x.brand('pocketsflow-icon.svg');

    const page = x.el(`<div class="bk">
  <div class="bk-src">${SOURCES.map((s) => `<span class="bk-sc"><i></i>${s}</span>`).join('')}</div>
  <div class="bk-cols">
    <div class="bk-brand">
      <div class="bk-lock"><img src="${icon}" alt=""/><b>Pocketsflow</b></div>
      <p class="bk-tl">The payment infrastructure that you deserve.</p>
      <span class="bk-h">Palette</span>
      <div class="bk-sw">${SWATCH.map(([h, n]) => `<div class="bk-s"><i style="background:${h}"></i><b>${n}</b><small>${h}</small></div>`).join('')}</div>
      <span class="bk-h">Type</span>
      <div class="bk-ty"><div><b class="bk-sat">Aa</b><small>Satoshi<br/>display, UI</small></div><div><b class="bk-mono">Aa</b><small>Geist Mono<br/>// labels</small></div></div>
      <span class="bk-h">Products on the site</span>
      <div class="bk-pd">${[['portra', 'Portra 400 Preset Pack', '$29'], ['nord', 'Nord Icons 2.0', '$49'], ['brush', 'Procreate Brush Box', '$18']].map(([c, n, p]) => `<span><i class="bk-pi bk-pi-${c}"></i>${n}<b>${p}</b></span>`).join('')}</div>
      <span class="bk-h">Proof, from the site</span>
      <div class="bk-pr"><span><b>65K+</b>people</span><span><b>160+</b>countries</span><span><b>$70M+</b>processed</span></div>
    </div>
    <div class="bk-doc">
      <div class="bk-dh"><b># Launch film, 15s</b><span>16:9, 6 shots, 39 words VO</span></div>
      <div class="bk-th"><span>TC</span><span>Shot</span><span>Voiceover</span><span>On screen</span></div>
      ${ROWS.map(([tc, shot, vo, os, wf]) => `<div class="bk-row"><span class="bk-tc">${tc}</span><span class="bk-shot"><svg viewBox="0 0 64 38">${WF[wf]}</svg><b>${shot}</b></span><span class="bk-vo"><span class="bk-on"></span><span class="bk-off">${x.esc(vo)}</span></span><span class="bk-os">${x.esc(os)}</span></div>`).join('')}
    </div>
  </div>
</div>`);
    const src = [...page.querySelectorAll('.bk-sc')];
    const brandParts = [page.querySelector('.bk-lock'), page.querySelector('.bk-tl'), ...page.querySelectorAll('.bk-h'), ...page.querySelectorAll('.bk-s'), page.querySelector('.bk-ty'), page.querySelector('.bk-pd'), page.querySelector('.bk-pr')];
    const rowEls = [...page.querySelectorAll('.bk-row')];
    const dh = [page.querySelector('.bk-dh'), page.querySelector('.bk-th')];

    return {
      nodes: [say, tools, file],
      marks: [[T.read, tools], [T.file, file]],
      page, file: { name: 'launch-brief.md', by: `${x.tile('gemini')}Gemini 3.1 Pro` },
      render(t) {
        renderSay(say, t, T.r + 0.05, 80);
        renderTools(tools, t, rows, [[T.read, T.readDone], [T.write, T.writeDone]]);
        renderPop(file, t, T.file);
        src.forEach((s, i) => { const a = T.r + 0.15 + i * 0.2; s.classList.toggle('on', t >= a + 0.18); s.style.opacity = (0.35 + 0.65 * seg(t, a, a + 0.2)).toFixed(3); });
        brandParts.forEach((n, i) => {
          const p = outQuint(seg(t, T.r + 0.35 + i * 0.09, T.r + 0.85 + i * 0.09));
          n.style.opacity = p.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
        });
        dh.forEach((n, i) => { const p = outCubic(seg(t, T.write - 0.1 + i * 0.08, T.write + 0.25 + i * 0.08)); n.style.opacity = p.toFixed(3); });
        rowEls.forEach((row, i) => {
          const a = T.write + 0.12 + i * 0.32;
          const p = outQuint(seg(t, a, a + 0.4));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -10).toFixed(2)}px)`;
          const vo = ROWS[i][2], n = clamp(Math.floor((t - a) * 60), 0, vo.length);
          const on = row.querySelector('.bk-on');
          if (on.dataset.n !== String(n)) { on.dataset.n = String(n); on.textContent = vo.slice(0, n); row.querySelector('.bk-off').textContent = vo.slice(n); }
          row.classList.toggle('live', t >= a && n < vo.length);
        });
      },
    };
  },
};
