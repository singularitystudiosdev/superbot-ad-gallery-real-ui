// allin.js (27df33f2): shared pieces for the "Superbot is all your agents in one" spots.
// The four agent windows (Claude Code, Codex, Gemini CLI, Cursor), the superbot agent window
// that hands each step to a model, and small geometry helpers. Every paint is f(t), like kit.js.
import { h, $, $$, op, tf, clamp, lerp, smooth, outCubic, sp, PRESETS, tile, PLAN, PLANS, typed, makeMark, KEY_PRE } from './kit.js';

export const LINE = 'Superbot is all your agents in one.';

// Each agent window burns one subscription or key; the footer and the limit line say which.
export const AGENTS = [
  { id: 'cc', name: 'Claude Code', logo: 'claude', plan: 'claude', ask: 'migrate billing to stripe', foot: 'Opus 5.5 · Claude Max', lim: 'Claude usage limit reached. Your limit will reset at 3pm.' },
  { id: 'codex', name: 'Codex', logo: 'openai', plan: 'openai', ask: 'write tests for billing/', foot: 'gpt-6.1-sol · ChatGPT Pro', lim: "You've hit your usage limit. Try again in 2 days." },
  { id: 'gcli', name: 'Gemini CLI', logo: 'gemini', plan: 'gemini', ask: 'map the repo architecture', foot: 'gemini-3.1-pro · Google AI Pro', lim: '[API Error: 429] Quota exceeded for gemini-3.1-pro' },
  { id: 'cursor', name: 'Cursor', logo: 'cursor', plan: 'deepseek', ask: 'add the webhook handler', foot: 'deepseek-v4.1 · DeepSeek API key', lim: '402 Insufficient Balance' },
];

// One agent task, split into steps; each step names the model the router picks and why.
export const TASK = 'Migrate billing to Stripe and open a PR';
export const STEPS = [
  { text: 'Map the repo · 214 files', plan: 'gemini', why: '610k-token context' },
  { text: 'Plan the Stripe migration', plan: 'claude', why: 'deep reasoning' },
  { text: 'Rewrite 14 billing handlers', plan: 'claude', why: 'multi-file code' },
  { text: 'Generate 1,200 test fixtures', plan: 'deepseek', why: 'high volume, simple' },
  { text: 'Review the diff', plan: 'openai', why: 'second opinion' },
  { text: 'Write the PR summary', plan: 'deepseek', why: 'short, cheap' },
];

// offset of el inside root, through the offsetParent chain (ignores transforms: layout px)
export function posIn(el, root) {
  let x = 0, y = 0, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
}

// quadratic arc from a to b, lifted by `lift` px at the middle
export function arc(u, a, b, lift = 120) {
  const k = clamp(u), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - lift;
  const x = (1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * mx + k * k * b.x;
  const y = (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * my + k * k * b.y;
  return { x, y };
}

export const badge = (p, extra = '') => `<span class="mbadge ${extra}">${tile(p.id, 'xs')}<b>${p.short}</b><span class="via">via ${p.plan}</span></span>`;

// ---- agent windows -------------------------------------------------------------------------
function termBody(a) {
  if (a.id === 'cc') return `
    <div class="cc-box"><span class="cc-star">✻</span> Welcome to <b>Claude Code</b>!<div class="dim">/help for help, /status for your current setup</div><div class="dim">cwd: ~/app</div></div>
    <div class="ln prm"><span class="pr">&gt;</span> <span class="tp"></span><span class="caret"></span></div>
    <div class="ln act"><span class="cc-dot">⏺</span> Reading 214 files…</div>
    <div class="ln lim"><span class="dim">⎿</span> ${a.lim}</div>`;
  if (a.id === 'codex') return `
    <div class="cx-boxc"><b>&gt;_ OpenAI Codex</b> <span class="dim">(v0.61)</span><div><span class="dim">model:</span> gpt-6.1-sol high</div><div><span class="dim">directory:</span> ~/app</div></div>
    <div class="ln prm"><span class="pr">›</span> <span class="tp"></span><span class="caret"></span></div>
    <div class="ln act"><span class="dim">•</span> Working <span class="dim">(12s • esc to interrupt)</span></div>
    <div class="ln lim">■ ${a.lim}</div>`;
  if (a.id === 'gcli') return `
    <div class="gm-banner">GEMINI</div>
    <div class="dim gm-tips">Tips: ask questions, edit files, run commands.</div>
    <div class="gm-in"><span class="pr">&gt;</span> <span class="tp"></span><span class="caret"></span></div>
    <div class="ln act"><span class="gm-spin">⠋</span> Thinking… <span class="dim">(esc to cancel)</span></div>
    <div class="ln lim">✕ ${a.lim}</div>`;
  return '';
}

function cursorBody(a) {
  const code = [
    ['k', 'export async function '], ['f', 'handleWebhook'], ['p', '(req) {'],
  ];
  return `
    <div class="cu-tree"><div class="cu-h">APP</div>${['src/', '  billing/', '    invoice.ts', '    plans.ts', '    webhook.ts', '  api/', 'package.json'].map((f, i) => `<div class="${i === 4 ? 'on' : ''}">${f.replace(/ /g, '&nbsp;')}</div>`).join('')}</div>
    <div class="cu-ed"><div class="cu-tab">webhook.ts</div><div class="cu-code">
      <div><span class="no">1</span><span class="k">import</span> Stripe <span class="k">from</span> <span class="s">'stripe'</span></div>
      <div><span class="no">2</span></div>
      <div><span class="no">3</span>${code.map(([c, s]) => `<span class="${c}">${s}</span>`).join('')}</div>
      <div><span class="no">4</span>&nbsp;&nbsp;<span class="k">const</span> sig = req.headers[<span class="s">'stripe-sig'</span>]</div>
      <div><span class="no">5</span>&nbsp;&nbsp;<span class="c">// TODO</span></div>
      <div><span class="no">6</span>}</div></div></div>
    <div class="cu-ag"><div class="cu-agh">Agent <span class="cu-model">deepseek-v4.1 ▾</span></div>
      <div class="cu-msg"><span class="tp"></span><span class="caret"></span></div>
      <div class="ln act dim">Generating…</div>
      <div class="ln lim">✕ ${a.lim}</div></div>`;
}

export function makeAgentWin(a, w = 800, ht = 440) {
  const el = h(`<div class="aw aw-${a.id}" style="width:${w}px;height:${ht}px">
    <div class="aw-bar"><div class="dots"><i></i><i></i><i></i></div>${tile(a.logo, 'xs')}<span class="aw-ttl"><b>${a.name}</b> · ~/app</span></div>
    <div class="aw-body ${a.id === 'cursor' ? 'cu' : 'term-s'}">${a.id === 'cursor' ? cursorBody(a) : termBody(a)}</div>
    <div class="aw-foot"><span class="dotc" style="background:${PLAN[a.plan].color}"></span>${a.foot}</div>
  </div>`);
  const tp = $(el, '.tp'), caret = $(el, '.caret'), act = $(el, '.act'), lim = $(el, '.lim');
  return {
    el, lim,
    // lt: time since this window starts its run; prompt typed, then working, then the limit line
    render(lt) {
      const t1 = 0.1, cps = 34, tEnd = t1 + a.ask.length / cps;
      tp.textContent = typed(a.ask, lt, t1, cps);
      caret.style.opacity = lt > tEnd + 0.1 ? '0' : (Math.floor(lt * 2.4) % 2 ? '0.2' : '1');
      op(act, smooth((lt - tEnd - 0.15) / 0.15) * (1 - 0.45 * smooth((lt - tEnd - 0.75) / 0.2)));
      const k = sp(lt, tEnd + 0.75, PRESETS.snappy);
      op(lim, smooth((lt - tEnd - 0.75) / 0.12));
      tf(lim, `translateX(${(1 - k) * -18}px)`);
      return { limAt: tEnd + 0.75 };
    },
  };
}
// when each window's limit line lands, relative to its own run start (for SFX cues)
export const limAt = (a) => 0.1 + a.ask.length / 34 + 0.75;

// ---- superbot agent window ------------------------------------------------------------------
// Schedule (local seconds): task typed, plan header, then one step every GAP; each step is
// dispatched DISPATCH after it shows (packet to the rail), badged on arrival, done at DONE.
export const SBA = { task: 0.15, cps: 42, plan: 1.35, step0: 1.6, gap: 0.62, dispatch: 0.18, fly: 0.34, done: 0.95 };
export const stepAt = (i) => SBA.step0 + i * SBA.gap;
export const badgeAt = (i) => stepAt(i) + SBA.dispatch + SBA.fly;

export function makeSbAgent(w = 1500, ht = 840) {
  const used = ['claude', 'openai', 'gemini', 'deepseek'];
  const el = h(`<div class="sba" style="width:${w}px;height:${ht}px">
    <div class="aw-bar sba-bar"><div class="dots"><i></i><i></i><i></i></div><span class="sba-mk"></span><span class="aw-ttl"><b>superbot</b> agent · ~/app</span><span class="sba-auto">model: auto</span></div>
    <div class="sba-main">
      <div class="sba-user"><span class="tp"></span><span class="caret"></span></div>
      <div class="sba-plan"><span class="sba-pl">Plan</span><span class="dim">${STEPS.length} steps · routed per step</span></div>
      <div class="sba-steps">${STEPS.map((s, i) => `<div class="sst"><span class="st-ic"><i class="spin"></i><i class="chk"></i><b>${i + 1}</b></span><span class="st-tx">${s.text}</span><span class="st-bd">${badge(PLAN[s.plan])}</span></div>`).join('')}</div>
    </div>
    <div class="sba-rail"><div class="sba-rh">Routing through</div>
      ${used.map((id) => `<div class="rrow" data-id="${id}">${tile(id, 'sm')}<div><b>${PLAN[id].plan}</b><small>${PLAN[id].model}</small></div><span class="rc num">0</span></div>`).join('')}
      <div class="sba-key"><label>SUPERBOT_API_KEY</label><div class="mono">${KEY_PRE}7Kq9…pD8v</div></div>
    </div>
    <div class="sba-pk"></div>
  </div>`);
  const mark = makeMark(30);
  $(el, '.sba-mk').appendChild(mark.el);
  const tp = $(el, '.tp'), caret = $(el, '.caret'), plan = $(el, '.sba-plan');
  const rows = $$(el, '.sst'), rr = $$(el, '.rrow'), pk = $(el, '.sba-pk');
  const rrById = Object.fromEntries(rr.map((r) => [r.dataset.id, r]));
  let geo = null;
  return {
    el, mark,
    render(lt) {
      if (!geo && el.offsetWidth) {
        geo = {
          from: rows.map((r) => { const p = posIn($(r, '.st-bd'), el); return { x: p.x + p.w - 30, y: p.cy }; }),
          to: Object.fromEntries(rr.map((r) => { const p = posIn(r, el); return [r.dataset.id, { x: p.x + 30, y: p.cy }]; })),
        };
      }
      tp.textContent = typed(TASK, lt, SBA.task, SBA.cps);
      const tEnd = SBA.task + TASK.length / SBA.cps;
      caret.style.opacity = lt > tEnd + 0.15 ? '0' : (Math.floor(lt * 2.4) % 2 ? '0.2' : '1');
      op(plan, smooth((lt - SBA.plan) / 0.2));
      const counts = { claude: 0, openai: 0, gemini: 0, deepseek: 0 }, pulse = { claude: 0, openai: 0, gemini: 0, deepseek: 0 };
      let pkShown = false;
      rows.forEach((r, i) => {
        const t0 = stepAt(i), k = sp(lt, t0, PRESETS.snappy), s = STEPS[i];
        op(r, smooth((lt - t0) / 0.16));
        tf(r, `translateY(${(1 - k) * 22}px)`);
        const td = t0 + SBA.dispatch, ta = td + SBA.fly;
        const bd = $(r, '.st-bd'), kb = sp(lt, ta, PRESETS.playful);
        op(bd, smooth((lt - ta) / 0.1));
        tf(bd, `scale(${0.7 + 0.3 * kb})`);
        const done = lt > t0 + SBA.done;
        r.classList.toggle('run', lt >= t0 && !done);
        r.classList.toggle('ok', done);
        if (lt >= ta) counts[s.plan]++;
        pulse[s.plan] = Math.max(pulse[s.plan], lt >= ta ? Math.exp(-(lt - ta) * 3.2) : 0);
        if (geo && lt >= td && lt < ta) {
          const u = outCubic((lt - td) / SBA.fly), p = arc(u, geo.from[i], geo.to[s.plan], 40);
          tf(pk, `translate(${p.x}px, ${p.y}px)`); pk.style.background = PLAN[s.plan].color; pkShown = true;
        }
      });
      op(pk, pkShown ? 1 : 0);
      for (const id of used) {
        const r = rrById[id];
        r.style.setProperty('--p', pulse[id].toFixed(3));
        $(r, '.rc').textContent = counts[id] ? `${counts[id]} step${counts[id] > 1 ? 's' : ''}` : '';
      }
      mark.render(lt + 1);
    },
  };
}

// ---- token chip (a plan's key part in flight) --------------------------------------------------
export const tokChip = (p) => `<div class="tok" style="--c:${p.color}">${tile(p.id, 'xs')}<span class="mono">${p.seg}</span></div>`;
export { PLANS, PLAN };
