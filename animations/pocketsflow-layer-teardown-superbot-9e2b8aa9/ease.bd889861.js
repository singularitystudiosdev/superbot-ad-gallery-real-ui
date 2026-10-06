// Tween math: every on-screen value is a pure function of the timeline clock, eased, never stepped.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, b) => clamp((t - a) / (b - a));

export const E = {
  linear: (p) => p,
  outCubic: (p) => 1 - (1 - p) ** 3,
  outQuart: (p) => 1 - (1 - p) ** 4,
  outQuint: (p) => 1 - (1 - p) ** 5,
  inCubic: (p) => p ** 3,
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2),
  inOutSine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  // Superbot's pop token: a soft overshoot that settles (≈ spring, damping 0.8)
  outBack: (p) => { const s = 1.15; return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2; },
};

// eased 0..1 over [a,b]
export const tw = (t, a, b, e = E.inOutCubic) => e(prog(t, a, b));
// in over [a, a+d], out over [b-d2, b]; 0 outside
export const inOut = (t, a, b, d = 0.4, d2 = d, e = E.inOutCubic) => Math.min(tw(t, a, a + d, e), 1 - tw(t, b - d2, b, e));

// keyframed scalar: keys = [[time, value, ease?], ...] sorted by time
export function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e] = ks[i];
    if (t <= t1) { const [t0, v0] = ks[i - 1]; return lerp(v0, v1, (e || E.inOutCubic)(prog(t, t0, t1))); }
  }
  return ks[ks.length - 1][1];
}

export const px = (v) => `${v.toFixed(2)}px`;
export const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const tc = (s, fps = 24) => {
  const f = Math.floor((s % 1) * fps);
  const S = Math.floor(s);
  return `00:00:${String(S).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};
