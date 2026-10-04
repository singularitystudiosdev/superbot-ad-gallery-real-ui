// workflowGraph: the Actions run graph card ("ci.yml / on: pull_request") with job nodes and GitHub's rounded
// orthogonal edges (source dot, horizontal, 8px corner, vertical, corner, target dot), measured from the real graph
// (ux/refs/run-graph-2x.png): node 150x26 at zoom 1, column pitch 191, row pitch 58. Rendered at zoom Z (GitHub's
// graph zoom control), default 1.35 so the nodes read on a 1920x1080 frame.
// Nodes: [data-job][data-state=queued|in_progress|success|failure|skipped], .gh-node-dur[data-slot=duration].
// Edges: g.gh-edge[data-from][data-to] style="--fill:0..1" (default 0 = GitHub's grey edge; 1 = fully drawn in --gh-edge-fill green).
import { esc, statusStack, oct } from './util.js';

export function workflowGraph(data, { zoom = 1.35, state = null } = {}) {
  const { ci } = data;
  const Z = zoom;
  const W = 150 * Z, H = 26 * Z, PX = 191 * Z, PY = 58 * Z, OX = 24 * Z, OY = 10 * Z, R = 8 * Z;
  const pos = {};
  for (const j of ci.jobs) pos[j.id] = { x: OX + j.col * PX, y: OY + j.row * PY };
  const cols = Math.max(...ci.jobs.map((j) => j.col)) + 1;
  const rows = Math.max(...ci.jobs.map((j) => j.row)) + 1;
  const cw = OX * 2 + (cols - 1) * PX + W, ch = OY * 2 + (rows - 1) * PY + H;

  const edges = [];
  for (const j of ci.jobs) for (const n of j.needs) {
    const a = pos[n], b = pos[j.id];
    const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
    const mx = (x1 + x2) / 2;
    let d;
    if (Math.abs(y2 - y1) < 0.5) d = `M${x1} ${y1}H${x2}`;
    else {
      const s = y2 > y1 ? 1 : -1, r = Math.min(R, Math.abs(y2 - y1) / 2);
      d = `M${x1} ${y1}H${mx - r}Q${mx} ${y1} ${mx} ${y1 + s * r}V${y2 - s * r}Q${mx} ${y2} ${mx + r} ${y2}H${x2}`;
    }
    edges.push(`<g class="gh-edge" data-from="${n}" data-to="${j.id}" style="--fill:${j.edgeFill ?? 0}"><path class="gh-edge-base" d="${d}"/><path class="gh-edge-fill" d="${d}" pathLength="1"/></g>`);
  }
  const dots = [];
  for (const j of ci.jobs) {
    const p = pos[j.id];
    if (j.needs.length) dots.push(`<circle cx="${p.x}" cy="${p.y + H / 2}" r="${2.6 * Z}"/>`);
    if (ci.jobs.some((k) => k.needs.includes(j.id))) dots.push(`<circle cx="${p.x + W}" cy="${p.y + H / 2}" r="${2.6 * Z}"/>`);
  }
  const nodes = ci.jobs.map((j) => {
    const p = pos[j.id];
    return `<div class="gh-node" data-job="${j.id}" data-state="${j.state || state || 'success'}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px">${statusStack(Math.round(14 * Z))}<span class="gh-node-name">${esc(j.name)}</span><span class="gh-node-dur" data-slot="duration">${esc(j.dur)}</span></div>`;
  }).join('');

  return `<div class="gh-graph" style="--gz:${Z}">
  <div class="gh-graph-hd"><a class="gh-graph-file">${esc(ci.file)}</a><div class="gh-muted gh-small">on: ${esc(ci.event)}</div></div>
  <div class="gh-graph-canvas" style="width:${cw}px;height:${ch}px">
    <svg class="gh-graph-svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">${edges.join('')}<g class="gh-graph-dots">${dots.join('')}</g></svg>
    ${nodes}
  </div>
  <div class="gh-graph-zoom"><span class="gh-iconbtn gh-iconbtn--sm">${oct('screen-full')}</span><span class="gh-btngroup"><span class="gh-iconbtn gh-iconbtn--sm">${oct('dash')}</span><span class="gh-iconbtn gh-iconbtn--sm">${oct('plus')}</span></span></div>
</div>`;
}
