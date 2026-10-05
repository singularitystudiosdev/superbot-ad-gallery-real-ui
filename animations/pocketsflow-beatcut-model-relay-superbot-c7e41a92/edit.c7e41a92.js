// The film's edit timeline under the workspace: ruler, five tracks (one per model), the bar grid the
// score lays down, and the clips that fly out of each tool and snap onto their bars.
import { h } from './shell.c7e41a92.js';
import { icon } from './icons.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { PEAKS, PHASE, BAR } from './score.c7e41a92.js';
import { E, FILM0, FILM_LEN, PANEL, EDIT, TRACKS, CLIPS, xAt, trackY, barAt } from './plan.c7e41a92.js';

const GRID_IN = E + 5.75; // the bar grid appears once the score lands

function wavePath(w, hgt) {
  const n = PEAKS.length;
  let top = '', bot = '';
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * w;
    const a = (PEAKS[i] / 100) * (hgt / 2 - 2);
    top += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(hgt / 2 - a).toFixed(1)}`;
    bot = `L${x.toFixed(1)} ${(hgt / 2 + a).toFixed(1)}` + bot;
  }
  return `${top}${bot}Z`;
}

function clipHtml(c) {
  if (c.kind === 'wave') {
    return `<div class="clip wave"><svg viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="${wavePath(1000, 40)}"/></svg><span class="cl">${c.label}</span></div>`;
  }
  if (c.kind === 'img') return `<div class="clip img" style="background-image:url(${c.thumb})"><span class="cl">${c.label}</span></div>`;
  if (c.kind === 'text') return `<div class="clip text"><b>T</b><span class="cl">${c.label}</span></div>`;
  return `<div class="clip ui">${icon('code')}<span class="cl">${c.label}</span></div>`;
}

export function buildEdit(ui) {
  const edit = ui.edit;
  const lanesTop = EDIT.trackY - PANEL.editY;
  const bars = Array.from({ length: 7 }, (_, n) => n);
  const beats = Array.from({ length: 28 }, (_, i) => PHASE + i * (BAR / 4)).filter((s) => s < FILM_LEN);
  edit.innerHTML = `
<div class="ehead"><span class="nm">${icon('code')}LaunchFilm</span><span class="chip" data-bpm>120 BPM · 4/4</span><span class="chip" data-bars>7 bars · 0:14</span>
  <span class="tc" data-tc>00:00:00</span><span class="tp">${icon('arrowUp', 'play')}</span></div>
<div class="ruler" style="top:${EDIT.rulerY - PANEL.editY}px">
  ${bars.map((n) => `<span class="bar" data-grid style="left:${xAt(barAt(n)) - 1}px">${n + 1}</span>`).join('')}
  ${beats.map((s, i) => `<i class="tick ${i % 4 ? '' : 'down'}" data-grid style="left:${xAt(s)}px"></i>`).join('')}
  <span class="mark drop" data-grid style="left:${xAt(barAt(2)) + 6}px">DROP</span>
  <span class="mark hit" data-grid style="left:${xAt(barAt(6)) + 6}px">HIT</span>
  ${[0, 2, 4, 6, 8, 10, 12].map((s) => `<span class="sec" data-sec style="left:${xAt(s) + 3}px">0:${String(s).padStart(2, '0')}</span>`).join('')}
</div>
${TRACKS.map((tr) => `<div class="trk" data-trk="${tr.id}" style="top:${trackY(tr.id) - PANEL.editY}px">
  <div class="tlab"><span class="tile"><img src="${tr.logo}" alt=""></span><span class="tn">${tr.name}</span><span class="tk">${tr.kind}<em>${tr.model}</em></span></div>
  <div class="lane" style="left:${EDIT.laneX}px;width:${EDIT.laneW}px"></div></div>`).join('')}
<div class="gridlines" data-grid style="top:${lanesTop - 6}px;height:${TRACKS.length * (EDIT.trackH + EDIT.gap) + 6}px">
  ${bars.map((n) => `<i style="left:${xAt(barAt(n))}px"></i>`).join('')}</div>
<div class="phead" data-phead style="top:${EDIT.rulerY - PANEL.editY}px;height:${lanesTop - (EDIT.rulerY - PANEL.editY) + TRACKS.length * (EDIT.trackH + EDIT.gap)}px"><i></i></div>`;

  const layer = h('<div class="cliplayer"></div>');
  ui.panel.appendChild(layer);
  const clips = CLIPS.map((c) => {
    const el = h(clipHtml(c));
    layer.appendChild(el);
    const dst = [xAt(c.from), trackY(c.track) + 3, (c.to - c.from) * (EDIT.laneW / FILM_LEN) - 2, EDIT.trackH - 6];
    return { c, el, dst };
  });
  const q = (s) => edit.querySelector(s);
  const grid = [...edit.querySelectorAll('[data-grid]')];
  const secs = [...edit.querySelectorAll('[data-sec]')];
  const labs = new Map(TRACKS.map((tr) => [tr.id, edit.querySelector(`[data-trk="${tr.id}"] .tlab`)]));
  const firstLand = new Map();
  for (const { c } of clips) firstLand.set(c.track, Math.min(firstLand.get(c.track) ?? Infinity, c.land));
  const bpm = q('[data-bpm]'), barsChip = q('[data-bars]'), tc = q('[data-tc]'), phead = q('[data-phead]');

  return {
    update(t) {
      const g = prog(t, GRID_IN, 0.5, EASE.standard);
      grid.forEach((el) => (el.style.opacity = g.toFixed(3)));
      secs.forEach((el) => (el.style.opacity = (1 - g).toFixed(3)));
      bpm.style.opacity = g.toFixed(3);
      barsChip.style.opacity = prog(t, GRID_IN + 0.15, 0.4, EASE.standard).toFixed(3);
      for (const [id, el] of labs) el.style.opacity = lerp(0.42, 1, prog(t, firstLand.get(id), 0.3, EASE.standard)).toFixed(3);

      for (const { c, el, dst } of clips) {
        const fly0 = c.land - 0.62;
        if (t < fly0) {
          el.style.visibility = 'hidden';
          continue;
        }
        const k = EASE.inOut(clamp01((t - fly0) / 0.62));
        const arc = Math.sin(Math.PI * k) * -46;
        const r = c.src.map((v, i) => lerp(v, dst[i], k));
        el.style.visibility = 'visible';
        el.style.left = `${r[0].toFixed(2)}px`;
        el.style.top = `${(r[1] + arc).toFixed(2)}px`;
        el.style.width = `${r[2].toFixed(2)}px`;
        el.style.height = `${r[3].toFixed(2)}px`;
        el.style.opacity = prog(t, fly0, 0.12, EASE.standard).toFixed(3);
        const lift = Math.sin(Math.PI * k);
        const flash = 1 - prog(t, c.land, 0.45, EASE.standard);
        el.style.boxShadow = `0 ${(18 * lift).toFixed(1)}px ${(40 * lift).toFixed(1)}px rgba(0,0,0,${(0.55 * lift).toFixed(3)}), 0 0 0 ${(2 * flash * (t >= c.land)).toFixed(2)}px rgba(255,255,255,0.85)`;
        el.classList.toggle('landed', t >= c.land - 0.05);
      }

      const ft = t - FILM0;
      const play = ft >= 0 ? Math.min(ft, FILM_LEN) : 0;
      phead.style.transform = `translateX(${xAt(play).toFixed(2)}px)`;
      phead.style.opacity = prog(t, GRID_IN, 0.4, EASE.standard).toFixed(3);
      const fr = Math.floor((play % 1) * 30);
      tc.textContent = `00:00:${String(Math.floor(play)).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
    },
  };
}
