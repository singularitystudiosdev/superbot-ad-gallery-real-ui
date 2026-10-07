// Node 4, DeepSeek V4.1 Flash: the scrape nobody else wanted to run. The fetch log is the real one (Payhip refused a
// browser and answered as a link unfurler), the fees table and the script are DeepSeek's own output, verbatim
// (gen-data DS.table, DS.vo).
import { DS } from '../gen-data.js';
import { el, esc, brand } from './kit.js';
import { seg, outCubic, lerp } from '../../../lib.js';

const UA = 'Chrome 147';
const LOG = [
  { at: 0.0, html: '<b class="ds-p">$</b> deepseek-v4.1-flash <i>scrape → extract → write</i>' },
  { at: 0.18, html: '<b class="ds-a">GET</b> pocketsflow.com/pricing', st: '200', ok: 1 },
  { at: 0.34, html: '<b class="ds-a">GET</b> gumroad.com/pricing', st: '200', ok: 1 },
  { at: 0.5, html: '<b class="ds-a">GET</b> lemonsqueezy.com/pricing', st: '200', ok: 1 },
  { at: 0.66, html: '<b class="ds-a">GET</b> payhip.com/pricing', st: '403 bot wall', ok: 0 },
  { at: 0.9, html: '<b class="ds-r">↻</b> retry as <u>Slackbot-LinkExpanding 1.0</u>', st: '200', ok: 1, tag: 'no refusal' },
  { at: 1.1, html: '<b class="ds-a">EXTRACT</b> fee schedules → fees.json', st: `${DS.table.length} rows`, ok: 1 },
  { at: 1.55, html: '<b class="ds-a">WRITE</b> voiceover → script.txt', st: `${DS.vo.length} lines`, ok: 1 },
];
const MAX = Math.max(...DS.table.map((r) => r.fee_on_29_usd));
const fee = (r) => `${r.pct}%${r.fixed_usd ? ` + $${r.fixed_usd.toFixed(2)}` : ''}`;
const tagged = (line) => esc(line).replace(/^\[([^\]]+)\]/, '<i class="ds-tag">[$1]</i>');

export const deepseek = {
  key: 'deepseek',
  head: 'fees.json · script.txt',
  meta: `${DS.model} · ${UA} UA · ${(DS.ms / 1000).toFixed(1)}s`,
  done: `${DS.table.length} sites`,
  thumb: () => `<div class="fg-thumb ds-th">${DS.table.map((r) => `<span><b>${esc(r.platform)}</b><i style="width:${((r.fee_on_29_usd / MAX) * 100).toFixed(1)}%"></i><em>$${r.fee_on_29_usd.toFixed(2)}</em></span>`).join('')}</div>`,
  mount(body) {
    body.classList.add('ds');
    body.append(el(`<div class="ds-log">
      <div class="ds-hd"><img src="${brand('deepseek-logo.svg')}" alt=""/><b>DeepSeek</b><span>agent · tools: fetch, extract, write</span></div>
      ${LOG.map((l) => `<div class="ds-ln${l.ok === 0 ? ' ds-bad' : ''}"><span>${l.html}</span>${l.st ? `<em>${l.st}</em>` : ''}${l.tag ? `<i class="ds-nr">${l.tag}</i>` : ''}</div>`).join('')}
    </div>`), el(`<div class="ds-out">
      <div class="ds-card"><div class="ds-cap">fees.json <small>headline fee on a $29 sale</small></div>
        ${DS.table.map((r) => `<div class="ds-row${r.platform === 'Pocketsflow' ? ' ds-pf' : ''}"><b>${esc(r.platform)}</b><span>${fee(r)}${r.processor_fees_extra ? ' <small>+ processor</small>' : ''}</span><i><u style="--w:${((r.fee_on_29_usd / MAX) * 100).toFixed(1)}%"></u></i><em>$${r.fee_on_29_usd.toFixed(2)}</em></div>`).join('')}
      </div>
      <div class="ds-card ds-script"><div class="ds-cap">script.txt <small>for ElevenLabs v3</small></div>
        ${DS.vo.map((v) => `<p>${tagged(v)}</p>`).join('')}
      </div>
    </div>`));
    return { lns: [...body.querySelectorAll('.ds-ln')], rows: [...body.querySelectorAll('.ds-row')], bars: [...body.querySelectorAll('.ds-row u')], ps: [...body.querySelectorAll('.ds-script p')], cards: [...body.querySelectorAll('.ds-card')] };
  },
  render(s, p) {
    s.lns.forEach((n, i) => {
      const a = outCubic(seg(p, LOG[i].at, LOG[i].at + 0.18));
      n.style.opacity = a.toFixed(3);
      n.style.transform = `translateX(${((1 - a) * -8).toFixed(2)}px)`;
    });
    s.cards.forEach((c, i) => { c.style.opacity = outCubic(seg(p, 1.1 + i * 0.45, 1.35 + i * 0.45)).toFixed(3); });
    s.rows.forEach((r, i) => {
      const a = outCubic(seg(p, 1.2 + i * 0.1, 1.5 + i * 0.1));
      r.style.opacity = a.toFixed(3);
      s.bars[i].style.transform = `scaleX(${lerp(0, 1, a).toFixed(4)})`;
    });
    s.ps.forEach((n, i) => {
      const a = outCubic(seg(p, 1.65 + i * 0.18, 1.9 + i * 0.18));
      n.style.opacity = a.toFixed(3);
      n.style.transform = `translateY(${((1 - a) * 6).toFixed(2)}px)`;
    });
  },
};
