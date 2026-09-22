// hero-edit: a small live editor for the hero. Open the page with ?edit and
// a panel appears with two sections —
//   words:  the wordmark and the tagline, their sizes, the gap to the mark,
//           and an x/y nudge (or DRAG the words)
//   layout: the whole lockup's size, the mark's size, the space above the
//           lockup, the space between it and the animation, and the
//           animation's width
// Values write straight to custom properties (hero-6.css) so what you see is
// what ships; "Copy CSS" puts the exact override lines + the .sb-words markup
// on the clipboard to paste back. Nothing here loads without ?edit.
(() => {
  const hero = document.querySelector(".hero");
  const lockup = hero && hero.querySelector(".sb-lockup");
  const words = lockup && lockup.querySelector(".sb-words");
  const h1 = words && words.querySelector("h1");
  const tag = words && words.querySelector(".tag");
  const desk = hero && hero.querySelector(".desk");
  if (!hero || !lockup || !words || !h1 || !tag || !desk) return;

  const KEY = "hero-tune-4";
  // the shipped defaults are read off the stylesheet so Reset means "as shipped"
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;
  const tok = (el, name, fallback) => { const s = getComputedStyle(el).getPropertyValue(name).trim(); const n = parseFloat(s); return Number.isFinite(n) ? n : fallback; };
  const DEFAULTS = {
    text: h1.textContent, tag: tag.textContent,
    h1: tok(lockup, "--hero-h1-scale", 1), tagScale: tok(lockup, "--hero-tag-scale", 1), gap: tok(lockup, "--hero-gap", 12), dx: tok(lockup, "--hero-h1-dx", 0), dy: tok(lockup, "--hero-h1-dy", 0),
    scale: tok(lockup, "--hero-scale", 1), mark: tok(lockup, "--hero-mark", 6.4), top: Math.round(px(hero.querySelector(".hero-copy"), "marginTop")), below: tok(hero, "--hero-below", 0), stage: Math.round(px(desk, "maxWidth") || desk.getBoundingClientRect().width),
  };
  // wide ranges, and every spacing control goes NEGATIVE (user, 2026-09-09):
  // the mark's SVG box has ~21% of air above the visible face, so pulling
  // "space above" below zero is how the icon reaches the nav
  const SECTIONS = [
    { title: "words", fields: [
      { k: "h1", label: "wordmark size", min: 0.2, max: 3, step: 0.01, unit: "×" },
      { k: "tagScale", label: "tagline size", min: 0.2, max: 4, step: 0.01, unit: "×" },
      { k: "gap", label: "gap to mark", min: -160, max: 240, step: 1, unit: "px" },
      { k: "dx", label: "words x", min: -600, max: 600, step: 1, unit: "px" },
      { k: "dy", label: "words y", min: -400, max: 400, step: 1, unit: "px" },
    ] },
    { title: "layout", fields: [
      { k: "scale", label: "lockup size", min: 0.2, max: 3, step: 0.01, unit: "×" },
      { k: "mark", label: "mark size", min: 1, max: 14, step: 0.05, unit: "em" },
      { k: "top", label: "space above", min: -300, max: 300, step: 1, unit: "px" },
      { k: "below", label: "space to animation", min: -300, max: 300, step: 1, unit: "px" },
      { k: "stage", label: "animation width", min: 320, max: 2000, step: 4, unit: "px" },
    ] },
  ];
  const FIELDS = SECTIONS.flatMap((s) => s.fields);
  let v = { ...DEFAULTS };
  try { v = { ...v, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { console.error("[hero-edit] saved values unreadable:", e); }

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const apply = () => {
    lockup.style.setProperty("--hero-scale", String(v.scale));
    lockup.style.setProperty("--hero-mark", v.mark + "em");
    lockup.style.setProperty("--hero-h1-scale", String(v.h1));
    lockup.style.setProperty("--hero-tag-scale", String(v.tagScale));
    lockup.style.setProperty("--hero-gap", v.gap + "px");
    lockup.style.setProperty("--hero-h1-dx", v.dx + "px");
    lockup.style.setProperty("--hero-h1-dy", v.dy + "px");
    hero.style.setProperty("--hero-top", v.top + "px");
    hero.style.setProperty("--hero-below", v.below + "px");
    hero.style.setProperty("--hero-stage-w", v.stage + "px");
    if (h1.textContent !== v.text) h1.textContent = v.text;
    if (tag.textContent !== v.tag) tag.textContent = v.tag;
    FIELDS.forEach((f) => { const o = out[f.k]; if (o) o.textContent = fmt(f, v[f.k]); const r = inputs[f.k]; if (r && +r.value !== v[f.k]) r.value = v[f.k]; });
  };
  const fmt = (f, x) => (f.step < 1 ? Number(x).toFixed(2) : String(Math.round(x))) + f.unit;
  const save = () => localStorage.setItem(KEY, JSON.stringify(v));

  const cssBlock = () =>
    ".sb-lockup { --hero-scale: " + v.scale + "; --hero-mark: " + v.mark + "em; --hero-h1-scale: " + v.h1 + "; --hero-tag-scale: " + v.tagScale + "; --hero-gap: " + v.gap + "px; --hero-h1-dx: " + v.dx + "px; --hero-h1-dy: " + v.dy + "px; }\n" +
    ".hero { --hero-top: " + v.top + "px; --hero-below: " + v.below + "px; --hero-stage-w: " + v.stage + "px; }\n" +
    '<div class="sb-words">\n  <h1>' + esc(v.text) + '</h1>\n  <p class="tag">' + esc(v.tag) + "</p>\n</div>";

  // ---- the panel ----
  const panel = document.createElement("div");
  panel.id = "hero-edit";
  panel.style.cssText = "position:fixed;top:12px;right:12px;z-index:9999;width:310px;max-height:calc(100vh - 24px);overflow:auto;padding:12px;border-radius:12px;background:#111;color:#eee;border:1px solid #333;box-shadow:0 12px 40px rgba(0,0,0,.6);font:12px/1.4 -apple-system,system-ui,sans-serif;";
  const field = (id, label) => '<label style="display:block;color:#aaa;margin:6px 0 3px">' + label + '</label><input id="' + id + '" style="width:100%;box-sizing:border-box;background:#000;color:#eee;border:1px solid #333;border-radius:8px;padding:6px;font:13px/1.3 inherit">';
  panel.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between"><b>hero editor</b><span style="color:#888">drag the words to move them</span></div>' +
    field("he-text", "wordmark") + field("he-tag", "tagline") +
    SECTIONS.map((s) => '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #222;color:#8ab;font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px">' + s.title + '</div><div data-section="' + s.title + '"></div>').join("") +
    '<div style="display:flex;gap:6px;margin-top:12px"><button id="he-copy" style="flex:1">Copy CSS</button><button id="he-reset">Reset</button></div>' +
    '<div id="he-msg" style="color:#8f8;margin-top:6px;min-height:1.2em"></div>';
  document.body.appendChild(panel);
  panel.querySelectorAll("button").forEach((b) => { b.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#eee;cursor:pointer;font:inherit;"; });

  const inputs = {}, out = {};
  SECTIONS.forEach((s) => {
    const host = panel.querySelector('[data-section="' + s.title + '"]');
    s.fields.forEach((f) => {
      const row = document.createElement("div");
      row.style.cssText = "display:grid;grid-template-columns:110px 1fr 56px;align-items:center;gap:6px;margin:3px 0";
      row.innerHTML = '<span style="color:#aaa">' + f.label + '</span><input type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" style="width:100%"><span style="text-align:right;color:#ccc"></span>';
      host.appendChild(row);
      inputs[f.k] = row.querySelector("input");
      out[f.k] = row.querySelector("span:last-child");
      inputs[f.k].addEventListener("input", () => { v[f.k] = +inputs[f.k].value; apply(); save(); });
    });
  });
  const tx = panel.querySelector("#he-text"), tg = panel.querySelector("#he-tag");
  tx.value = v.text; tg.value = v.tag;
  tx.addEventListener("input", () => { v.text = tx.value; apply(); save(); });
  tg.addEventListener("input", () => { v.tag = tg.value; apply(); save(); });
  panel.querySelector("#he-reset").addEventListener("click", () => { v = { ...DEFAULTS }; tx.value = v.text; tg.value = v.tag; apply(); save(); msg("reset to the shipped values"); });
  panel.querySelector("#he-copy").addEventListener("click", async () => {
    const s = cssBlock();
    try { await navigator.clipboard.writeText(s); msg("copied — paste the two CSS lines into hero-6.css and the .sb-words block into index.html"); }
    catch (e) { console.error("[hero-edit] clipboard refused:", e); window.prompt("copy this:", s); }
  });
  const msg = (t) => { panel.querySelector("#he-msg").textContent = t; };

  // ---- drag the words ----
  words.style.cursor = "move";
  words.style.userSelect = "none";
  let drag = null;
  words.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, dx: v.dx, dy: v.dy }; words.setPointerCapture(e.pointerId); e.preventDefault(); });
  words.addEventListener("pointermove", (e) => { if (!drag) return; v.dx = Math.round(drag.dx + e.clientX - drag.x); v.dy = Math.round(drag.dy + e.clientY - drag.y); apply(); });
  words.addEventListener("pointerup", () => { if (drag) { drag = null; save(); } });

  apply();
})();
