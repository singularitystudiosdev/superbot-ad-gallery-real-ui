// Beat F (9.50-11.30, 1.80 s): PR #483 Checks tab. The Actions run graph (lint, typecheck, unit, e2e, build) goes
// queued -> in_progress (amber spinner) -> success one by one; the edges fill green; the commit row, workflow row and
// Status text end on Success. Caption "CI turns green." sits in the bottom 140 px strip, clear of the graph.
import { dur, byId } from './budget.js';
import { mount } from '../gh/components/index.js';
import { mountCaption } from './caption.js';
import { seg } from '../lib.js';
import { FRAME, setScroll } from './e.js';

// compressed on-screen timing (spot seconds), with real GitHub durations reached at the end of each job
const START = { lint: 0.05, typecheck: 0.16, unit: 0.60, e2e: 0.72, build: 1.12 };
const END = { lint: 0.42, typecheck: 0.58, unit: 0.95, e2e: 1.10, build: 1.42 };
const SECS = { lint: 14, typecheck: 31, unit: 48, e2e: 82, build: 37 };
const FINAL = { lint: '14s', typecheck: '31s', unit: '48s', e2e: '1m 22s', build: '37s' };
const RUN_DONE = 1.42;

const fmt = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);
const stateOf = (id, lt) => (lt < START[id] ? 'queued' : lt < END[id] ? 'in_progress' : 'success');
function durOf(id, lt) {
  if (lt < START[id]) return '';
  if (lt >= END[id]) return FINAL[id];
  return fmt(Math.max(1, Math.round(SECS[id] * seg(lt, START[id], END[id]))));
}

export default {
  id: 'f',
  dur: dur('f'),
  mount(section) {
    const ghf = mount(section, 'checks', {}, FRAME);
    this.ghf = ghf;
    this.page = ghf.querySelector('.ghf-page');
    this.nodes = [...ghf.querySelectorAll('.gh-node')];
    this.ckJobs = [...ghf.querySelectorAll('.gh-ck-job')];
    this.edges = [...ghf.querySelectorAll('g.gh-edge')].map((g) => ({ g, to: g.dataset.to }));
    this.ckhead = ghf.querySelector('.gh-ckhead');
    this.wf = ghf.querySelector('.gh-ck-wf.is-open');
    this.runsum = ghf.querySelector('.gh-runsum');
    this.cap = mountCaption(section, { text: byId('f').caption, at: 0.18, dur: dur('f') - 0.16 });
    // seed the first frame as queued (the component defaults to success), never flash green before render drives it
    this.nodes.forEach((n) => { n.dataset.state = 'queued'; const d = n.querySelector('[data-slot="duration"]'); if (d) d.textContent = ''; });
    this.ckJobs.forEach((n) => { n.dataset.state = 'queued'; const d = n.querySelector('[data-slot="duration"]'); if (d) d.textContent = ''; });
    this.edges.forEach((e) => e.g.style.setProperty('--fill', '0'));
    [this.ckhead, this.wf, this.runsum].forEach((el) => { if (el) el.dataset.runState = 'queued'; });
  },
  render(lt) {
    setScroll(this.page, 165);
    const rs = lt < START.lint ? 'queued' : lt < RUN_DONE ? 'in_progress' : 'success';
    [this.ckhead, this.wf, this.runsum].forEach((el) => { if (el) el.dataset.runState = rs; });

    const spin = `${(((lt * 900) % 360) + 360) % 360 | 0}deg`;
    const paint = (el) => {
      const id = el.dataset.job;
      if (!id || !START[id]) return;
      const st = stateOf(id, lt);
      el.dataset.state = st;
      if (st === 'in_progress') el.style.setProperty('--spin', spin);
      const d = el.querySelector('[data-slot="duration"]');
      if (d) d.textContent = durOf(id, lt);
    };
    this.nodes.forEach(paint);
    this.ckJobs.forEach(paint);

    for (const e of this.edges) e.g.style.setProperty('--fill', seg(lt, START[e.to] - 0.02, START[e.to] + 0.16).toFixed(3));

    if (this.cap) this.cap(lt);
  },
};