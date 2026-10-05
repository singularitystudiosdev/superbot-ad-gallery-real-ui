// Aurora components for the onekey-aurora spots (bdadac04), on top of kit.js.
// Every render(t) is a pure function of t: no timers, no CSS animation, no carried state.
import {
  W, H, h, $, $$, op, tf, clamp, lerp, seg, smooth, outCubic, outQuint, sp, PRESETS, track,
  mulberry32, PLAN, KEY_PRE, logoSrc, makeMark, money,
} from './kit.js';

export const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="currentColor"/></svg>';
export const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const blurPx = (k, max) => (k > 0.985 ? 0 : (1 - k) * max);
const blurF = (k, max) => { const b = blurPx(k, max); return b < 0.05 ? 'none' : `blur(${b.toFixed(2)}px)`; };

// ---- backdrop: wash + glowing horizon arc + perspective grid floor + diamonds ------------
// s: { ax, ay, as, glow, floor, lines, px, py } ; arc centre (ax, ay) in screen px, scale as
export function makeBackdrop() {
  const rnd = mulberry32(4107);
  const dias = Array.from({ length: 7 }, () => ({ x: 120 + rnd() * 1680, y: 90 + rnd() * 560, ph: rnd() * 6.28, sp: 0.6 + rnd() * 0.8 }));
  const el = h(`<div class="bd"><div class="wash"></div><div class="lines"></div><div class="floor"></div><div class="arc"></div>${dias.map(() => '<div class="dia"></div>').join('')}<div class="vig"></div></div>`);
  const wash = $(el, '.wash'), arc = $(el, '.arc'), floor = $(el, '.floor'), lines = $(el, '.lines');
  const dn = $$(el, '.dia');
  return {
    el,
    render(t, s) {
      tf(arc, `translate(${s.ax - 1500}px, ${s.ay - 1500}px) scale(${s.as ?? 1})`);
      op(arc, s.glow ?? 1);
      op(wash, 0.55 + 0.45 * (s.glow ?? 1));
      // parallax rides background offsets and wraps, so a camera pan of any length never shows an edge
      const px = s.px ?? 0, py = s.py ?? 0;
      tf(floor, 'perspective(760px) rotateX(74deg)');
      floor.style.backgroundPosition = `${(-px * 0.6).toFixed(1)}px ${(t * 34 - py * 0.5).toFixed(1)}px`;
      op(floor, s.floor ?? 1);
      lines.style.backgroundPosition = `calc(50% + ${(-px * 0.12).toFixed(1)}px) calc(50% + ${(-py * 0.12).toFixed(1)}px)`;
      op(lines, s.lines ?? 1);
      const wrap = (v, m) => ((v % m) + m) % m;
      dias.forEach((d, i) => {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * d.sp * 2.2 + d.ph));
        const dx = wrap(d.x - px * 0.18 + 60, 2040) - 60, dy = wrap(d.y - py * 0.18 + 60, 1200) - 60;
        tf(dn[i], `translate(${dx}px, ${dy + Math.sin(t * 0.6 + d.ph) * 10}px) rotate(45deg) scale(${0.7 + 0.5 * tw})`);
        op(dn[i], tw * (s.dia ?? 1));
      });
    },
  };
}

// ---- kinetic line: words rise out of a blur; {mark:true} drops the live mascot inline ---
// items: strings, {em:'word'} for gradient, {mark:true}; size in px
export function makeKinetic(items, size = 96, cls = '') {
  const marks = [];
  const el = h(`<div class="kin disp ${cls}" style="font-size:${size}px"></div>`);
  items.forEach((it) => {
    if (it.mark) {
      const g = h(`<span class="w glyph" style="width:${size * 1.08}px;height:${size * 1.08}px"></span>`);
      const m = makeMark(Math.round(size * 1.08));
      g.appendChild(m.el); marks.push(m); el.appendChild(g);
    } else {
      const em = typeof it === 'object' && it.em;
      el.appendChild(h(`<span class="w ${em ? 'em' : ''}">${em ? it.em : it}</span>`));
    }
  });
  const ws = $$(el, '.w');
  return {
    el, marks,
    // lt: local time; out: 0..1 exit progress (words fall away)
    render(lt, { stagger = 0.075, out = 0, rise = 70 } = {}) {
      ws.forEach((w, i) => {
        const t0 = i * stagger;
        const k = sp(lt, t0, w.classList.contains('glyph') ? PRESETS.playful : PRESETS.default);
        const ko = outCubic(out * 1.6 - i * 0.06);
        if (w.classList.contains('glyph')) {
          tf(w, `translateY(${(1 - k) * rise - ko * 40}px) scale(${Math.max(0, k)}) rotate(${(1 - k) * -90}deg)`);
        } else {
          tf(w, `translateY(${(1 - k) * rise - ko * 40}px)`);
          w.style.filter = blurF(Math.min(k, 1 - ko), 16);
        }
        op(w, smooth((lt - t0) / 0.22) * (1 - ko));
      });
      marks.forEach((m) => m.render(lt + 1.4));
    },
  };
}

// ---- dot cursor (first child is the ripple ring placeCursor drives) ---------------------
export const makeDot = () => h('<div class="dcur"><div class="ring"></div><div class="dot"></div></div>');

// ---- concentric rings that pulse outward from a point ------------------------------------
export function makeRings(n = 3) {
  const el = h(`<div class="rings">${'<i></i>'.repeat(n)}</div>`);
  const rs = $$(el, 'i');
  return {
    el,
    // pulses: [t...] each sends one ring out; base: [w,h] of the hugged shape
    render(t, x, y, base, pulses = [], alpha = 1) {
      tf(el, `translate(${x}px, ${y}px)`);
      rs.forEach((r, i) => {
        let best = -1;
        for (const p of pulses) { const d = t - p - i * 0.09; if (d >= 0 && d < 1.1) best = d; }
        if (best < 0) { op(r, 0); return; }
        const k = outCubic(best / 1.1);
        r.style.width = `${base[0] + 40 + k * 260}px`;
        r.style.height = `${base[1] + 40 + k * 260}px`;
        op(r, (1 - k) * 0.9 * alpha);
      });
    },
  };
}

// ---- provider console cards --------------------------------------------------------------
const WARN = {
  claude: 'Usage limit reached. Resets in 4h 12m',
  openai: 'Rate limit reached for gpt-6.1',
  gemini: 'Billing account required',
  deepseek: 'Insufficient balance',
};
export const OTP = { claude: '482913', openai: '730154', gemini: '916402', deepseek: '205871' };
export function provCard(p, kind) {
  let body = '';
  if (kind === 'login') {
    body = `<div class="pc-t">Sign in to ${p.vendor}</div>
      <div class="pc-f">you@studio.dev</div>
      <div class="pc-f">••••••••••••</div>
      <div class="pc-otp">${[...OTP[p.id]].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="pc-btn">Continue</div>`;
  } else if (kind === 'dash') {
    const rnd = mulberry32(p.id.length * 97 + 11);
    const bars = Array.from({ length: 12 }, (_, i) => 22 + rnd() * 50 + i * 3.5);
    body = `<div class="pc-t">Usage · October</div>
      <div class="pc-row"><span>${p.plan}</span><b>${p.id === 'deepseek' ? '$0.42 left' : p.id === 'gemini' ? 'No billing' : '97% used'}</b></div>
      <div class="pc-bars">${bars.map((v) => `<i style="height:${v.toFixed(0)}%"></i>`).join('')}</div>
      <div class="pc-meter"><i style="width:${p.id === 'claude' ? 100 : p.id === 'openai' ? 94 : p.id === 'deepseek' ? 88 : 64}%"></i></div>
      <div class="pc-warn">${WARN[p.id]}</div>`;
  } else {
    body = `<div class="pc-t">API keys</div>
      <div class="pc-env">${p.env}</div>
      <div class="pc-key"><span>${p.keyMask}</span><em>Copy</em></div>`;
  }
  return h(`<div class="pc pc--${kind}" style="--pc:${p.color}">
    <div class="pc-h"><span class="pc-logo"><img src="${logoSrc(p.id)}" alt=""></span><b>${p.console}</b><i>${p.host}</i></div>
    <div class="pc-b">${body}</div></div>`);
}

// ---- the one key: mark + sk-superbot- + four provider segments + logo stack + CTA --------
export function makeKeyPill(plans, cta = 'Copy') {
  const el = h(`<div class="kp">
    <div class="kp-face"></div>
    <div class="kp-txt"><span class="pre">${KEY_PRE}</span>${plans.map((p) => `<span class="s" style="--pc:${p.color}">${p.seg}</span>`).join('')}</div>
    <div class="kp-logos">${plans.map((p) => `<span><img src="${logoSrc(p.id)}" alt=""></span>`).join('')}</div>
    <div class="cta"><span class="lbl">${cta}</span></div></div>`);
  const mark = makeMark(84);
  $(el, '.kp-face').appendChild(mark.el);
  const segs = $$(el, '.kp-txt .s'), logos = $$(el, '.kp-logos span'), pre = $(el, '.pre'), ctaEl = $(el, '.cta'), lbl = $(el, '.lbl');
  return {
    el, mark, cta: ctaEl,
    // docks: [t...] per segment; label swaps to `copied` at tCopied
    render(t, { docks = [], tPre = 0, tCopied = 1e9, copiedText = 'Copied' } = {}) {
      op(pre, smooth((t - tPre) / 0.3));
      segs.forEach((s, i) => {
        const d = t - (docks[i] ?? 1e9);
        const k = sp(d, 0, PRESETS.snappy);
        op(s, d < 0 ? 0 : 1);
        tf(s, `translateY(${(1 - k) * -26}px) scale(${0.6 + 0.4 * k})`);
        const flash = d >= 0 ? Math.max(0, 1 - d / 0.7) : 0;
        s.style.color = flash > 0.01 ? `color-mix(in srgb, var(--pc) ${(flash * 100).toFixed(0)}%, #ffffff)` : '#ffffff';
        s.style.textShadow = flash > 0.01 ? `0 0 ${(24 * flash).toFixed(1)}px var(--pc)` : 'none';
        const kl = sp(d - 0.05, 0, PRESETS.playful);
        tf(logos[i], `scale(${d < 0.05 ? 0 : kl})`);
      });
      const want = t >= tCopied ? `${CHECK.replace('<svg', '<svg style="width:30px;height:30px;vertical-align:-5px;margin-right:8px"')}${copiedText}` : cta;
      if (lbl.dataset.v !== want) { lbl.innerHTML = want; lbl.dataset.v = want; }
      mark.render(t);
    },
  };
}

// ---- editor card ---------------------------------------------------------------------------
export function makeEditor(file, linesHtml, width = 1560) {
  return h(`<div class="ed" style="width:${width}px">
    <div class="ed-h"><span class="d"></span><span class="d"></span><span class="d"></span><span class="fn">${file}</span></div>
    <div class="ed-b">${linesHtml.map((l, i) => `<div class="l l${i}"><span class="ln">${i + 1}</span>${l}</div>`).join('')}</div></div>`);
}

// ---- model card (routing target) -----------------------------------------------------------
export function modelCard(p) {
  return h(`<div class="mc" style="--pc:${p.color}">
    <div class="top"><div class="lg"><img src="${logoSrc(p.id)}" alt=""></div><div><div class="nm">${p.short}</div><div class="via">via ${p.plan}</div></div></div>
    <div class="fit"><i></i></div>
    <div class="why"></div>
    <div class="badge">${CHECK.replace('<svg', '<svg style="width:20px;height:20px"')}Routed</div></div>`);
}
// fit: 0..1 bar; hot: 0..1 glow; why text appears with badge
export function renderModelCard(card, t, { fit = 0, hot = 0, why = '', dim = 0 }) {
  $(card, '.fit i').style.width = `${(fit * 100).toFixed(1)}%`;
  const b = $(card, '.badge');
  op(b, hot); tf(b, `scale(${0.7 + 0.3 * hot})`);
  const w = $(card, '.why');
  if (w.dataset.v !== why) { w.innerHTML = why; w.dataset.v = why; }
  op(w, hot);
  card.classList.toggle('hot', hot > 0.5);
  card.style.borderColor = hot > 0.01 ? `rgba(125,251,230,${(0.11 + 0.64 * hot).toFixed(3)})` : '';
  card.style.boxShadow = hot > 0.01 ? `0 0 ${(50 * hot).toFixed(0)}px rgba(0,229,195,${(0.34 * hot).toFixed(3)}), 0 30px 70px rgba(0,0,0,.5)` : '';
  card.style.filter = dim > 0.01 ? `saturate(${1 - 0.6 * dim}) brightness(${1 - 0.35 * dim})` : 'none';
}

// ---- cost bars ------------------------------------------------------------------------------
export function makeCost(rows, title, sub) {
  const el = h(`<div class="cost"><h3>${title}<small>${sub}</small></h3>
    ${rows.map((r) => `<div class="row"><div class="lb">${r.label}<small>${r.sub}</small></div><div class="tr"><i style="background:${r.bg}"></i></div><div class="v num">$0.00</div></div>`).join('')}</div>`);
  const fills = $$(el, '.tr i'), vals = $$(el, '.v'), rowsEl = $$(el, '.row'), head = $(el, 'h3');
  const max = Math.max(...rows.map((r) => r.v));
  return {
    el,
    render(lt) {
      const kh = sp(lt, 0, PRESETS.heavy);
      tf(head, `translateY(${(1 - kh) * 40}px)`); op(head, smooth(lt / 0.3));
      rows.forEach((r, i) => {
        const t0 = 0.3 + i * 0.35;
        const k = sp(lt, t0, PRESETS.default);
        tf(rowsEl[i], `translateY(${(1 - k) * 30}px)`); op(rowsEl[i], smooth((lt - t0) / 0.25));
        const f = outQuint(seg(lt, t0 + 0.1, t0 + 1.0));
        fills[i].style.width = `${(f * r.v / max * 100).toFixed(2)}%`;
        vals[i].textContent = money(r.v * f);
      });
    },
  };
}

// ---- lockup: mark + wordmark + Get started --------------------------------------------------
export function makeLockup({ size = 130, url = 'superbot.gg', cta = 'Get started' } = {}) {
  const el = h(`<div class="lockup"><div class="row1"><span class="face"></span><span class="wm gtext" style="font-size:${size}px">superbot</span></div>
    <div class="go"><span class="cta">${SPARK}${cta}</span><span class="url">${url}</span></div></div>`);
  const mark = makeMark(Math.round(size * 1.05));
  $(el, '.face').appendChild(mark.el);
  const row1 = $(el, '.row1'), go = $(el, '.go');
  return {
    el, mark,
    render(lt) {
      const a = sp(lt, 0, PRESETS.heavy);
      tf(row1, `translateY(${(1 - a) * 50}px) scale(${0.9 + 0.1 * a})`); op(row1, smooth(lt / 0.3));
      row1.style.filter = blurF(a, 14);
      const b = sp(lt, 0.35, PRESETS.default);
      tf(go, `translateY(${(1 - b) * 30}px)`); op(go, smooth((lt - 0.35) / 0.25));
      mark.render(lt + 2);
    },
  };
}

// position helper: place el's centre at (x, y) with scale/rotation
export function at(el, x, y, s = 1, r = 0, extra = '') {
  tf(el, `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotate(${r}deg) ${extra}`);
}
// quadratic bezier point
export function qb(a, c, b, k) {
  const u = 1 - k;
  return [u * u * a[0] + 2 * u * k * c[0] + k * k * b[0], u * u * a[1] + 2 * u * k * c[1] + k * k * b[1]];
}
export { W, H, h, $, $$, op, tf, clamp, lerp, seg, smooth, outCubic, outQuint, sp, PRESETS, track, mulberry32, PLAN, makeMark, money, blurF };
