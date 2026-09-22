// sphere-intro: the hero's opening — the sphere-collapse bench's desktop
// intro (hero-loading-animations.html), adapted to this site's stage:
//   1. the agent apps — the rail's four wired vendors plus Devin, Hermes,
//      Grok, Copilot, Windsurf, Cline, Kiro and Zed, each with its actual
//      artwork in the rail's tile style — pop in on a fibonacci sphere and
//      spin up exponentially (0.35 → 21 rad/s), centered in the arena
//   2. they converge and merge (the bench's 450ms accelerating window) and
//      the superbot mascot mark flips and grows (fv-flip-icon-grow, exact)
//   3. the mark shrinks to the rail's tile size and the OTHER app icons drop
//      down from it, right there in the middle — a full replica of the rail
//      assembling beneath the mark (the bench's shrink-top + crew bloom)
//   4. the whole lockup (mark + dropped apps) glides LEFT as one, lands
//      exactly on the real rail, crossfades into it, and the sidebar, chat
//      lane and panel extend into view. hub-boot's story (chips, sorting,
//      transcript) is unused.
//   5. the phone (ported from hub-boot.js's 18.0-22.4, xdxdxd.dsh.sh): the
//      chat lane's first line lands, the mobile app's thread screen slides up
//      at the arena's right, the sync beam runs from the conversation to the
//      phone's shoulder, the same line lands on both screens in one frame
//      with the "synced" chip, and the phone docks beside the hub as a right
//      column (hub-boot.css .docked). Same markup, same stylesheet as the
//      source site — only the clock is this file's.
// No text dropdowns, no overlapping layers: one beat at a time.
// ad copy of site/site/assets/sphere-intro-28.js (cloned-xdxdxd, 2026-09-10): verbatim choreography,
// asset paths rebased to assets/, and the IIFE wrapped so the ad can re-run it on each loop and be
// told when the frontend has fully extended (onDone). Nothing else changed.
window.runSphereIntro = (onDone) => {
  let doneFired = false;
  const fireDone = () => { if (doneFired) return; doneFired = true; if (onDone) onDone(); };
  const stage = document.getElementById("stage");
  if (!stage) return;
  const arena = document.getElementById("arena") || stage;

  // the sphere plays for everyone: a prefers-reduced-motion match here was
  // silently skipping the whole intro (the machine reports reduce), leaving
  // hub-boot to run its story from zero — the opposite of the request

  // the spinning tiles: the rail's eight app tiles — same markup, same brand
  // rules (hub-boot.css), so the sphere and the sidebar match — plus five
  // popular AI coding IDEs that spin but never land in the rail (user,
  // 2026-09-09), picked for their purple / blue / green / orange brands and
  // drawn with their actual artwork. `app` keys the registry mark + data-app
  // ground; `img` is a full-bleed brand tile; `sym` + `bg`/`ink` is a
  // registry mark on a sphere-only ground; `logo` + `bg` is a transparent
  // brand mark set on a ground at the rail's 60% face
  const SPIN = [
    { app: "openai" },
    { app: "claude" },
    { app: "gemini" },
    { app: "cursor" },
    { app: "devin", name: "Devin", img: "assets/devin.png" },
    { app: "hermes", name: "Hermes", img: "assets/hermes.png" },
    { app: "grok", name: "Grok", img: "assets/grok.png" },
    { app: "copilot", name: "GitHub Copilot" },
    { name: "Kiro", img: "assets/kiro.ico" },                                           // purple
    { name: "VS Code", sym: "vscode", bg: "var(--brand-vscode)", ink: "var(--brand-vscode-ink)" },   // blue
    { name: "Windsurf", sym: "windsurf", bg: "var(--brand-windsurf)", ink: "var(--brand-windsurf-ink)" }, // green
    { name: "Replit", logo: "assets/replit.png", bg: "var(--surface)" },              // orange
    { name: "Lovable", logo: "assets/lovable.png", bg: "#ffffff" },                   // orange → pink → purple
    // five more, sphere-only (user, 2026-09-09) — real artwork again
    { name: "Zed", sym: "zed", bg: "var(--brand-zed)", ink: "var(--brand-zed-ink)" },              // blue
    { name: "JetBrains", logo: "assets/jetbrains.png", bg: "var(--surface)" },        // orange → magenta
    { name: "Bolt", img: "assets/bolt.png" },                                          // black
    { name: "Base44", logo: "assets/base44.png", bg: "var(--surface)" },              // orange
    { name: "v0", logo: "assets/v0.svg", bg: "#000000" },                              // black
  ];
  const SPIN_TILES = SPIN.length;

  // fixed coordinate space: 460px choreography, sphere R=175, 54px tiles
  const STAGE = 460, C = STAGE / 2, R = 175, TILE = 54;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.min(1, Math.max(0, t));
  const rotY3 = (v, a) => ({ x: v.x * Math.cos(a) + v.z * Math.sin(a), y: v.y, z: -v.x * Math.sin(a) + v.z * Math.cos(a) });
  const fibDirs = (n) => Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * i + 1) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = 2.399963 * i;
    return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
  });

  const MERGE_T = 4000;
  const POP_START = 120, POP_STAGGER = 60;
  const popAt = (i) => POP_START + i * POP_STAGGER;
  const OMEGA0 = 0.35, OMEGA_MAX = 21;
  const omegaAt = (tMs) => {
    const x = clamp01(tMs / MERGE_T);
    return OMEGA0 * Math.exp(Math.log(OMEGA_MAX / OMEGA0) * Math.pow(x, 1.55));
  };

  // overlay clips to the terminal BODY (the visible interior) — the arena's
  // own box is far larger than what's visible, so its geometric center lands
  // off-screen; one shared, true coordinate space for every beat
  const body = stage.querySelector(".body") || stage;
  // the transcript margin column is dead weight (hub-boot's story is unused):
  // collapse it from the very first frame so the arena — and the whole hub —
  // own the full stage width, with no empty panel on the left
  body.style.transition = "none";
  body.style.gridTemplateColumns = "0% minmax(0, 1fr)";
  // hide the margin in place — display:none would drop it from the grid flow
  // and auto-place the ARENA into the 0% column, collapsing it to nothing
  const mg = stage.querySelector(".margin");
  if (mg) { mg.style.opacity = "0"; mg.style.padding = "0"; mg.style.borderRight = "0"; mg.style.overflow = "hidden"; }
  const overlay = document.createElement("div");
  overlay.className = "sphere-intro";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = "position:absolute;inset:0;overflow:hidden;z-index:30;pointer-events:none;";
  body.appendChild(overlay);

  // the choreography's center in overlay px — the ARENA's center, which since
  // the margin collapse is the stage's center
  const acx = () => arena.offsetLeft + arena.clientWidth / 2;
  const acy = () => arena.offsetTop + arena.clientHeight / 2;
  let S = 1;
  const fit = () => {
    S = Math.min(1, Math.min(arena.clientWidth * 0.72, arena.clientHeight) / (STAGE + 40));
    holder.style.left = acx() + "px";
    holder.style.top = acy() + "px";
    holder.style.transform = "translate(-50%,-50%) scale(" + S + ")";
  };

  const holder = document.createElement("div");
  holder.style.cssText = "position:absolute;left:50%;top:50%;width:" + STAGE + "px;height:" + STAGE + "px;transform:translate(-50%,-50%);transform-style:preserve-3d;perspective:1100px;";
  overlay.appendChild(holder);
  fit();
  addEventListener("resize", fit);

  // the merge target — the rail's OWN superbot tile (brand/tile.svg: black
  // ground, storm ring, the mark), the same artwork .rail-item.sb shows, so
  // when the flipped tile lands on the rail slot nothing has to be swapped
  const MARK = 250; // design px
  const bloom = document.createElement("div");
  bloom.style.cssText = "position:absolute;left:50%;top:50%;width:" + MARK * S + "px;height:" + MARK * S + "px;margin:" + (-MARK * S) / 2 + "px 0 0 " + (-MARK * S) / 2 + "px;z-index:5;opacity:0;will-change:transform,filter;";
  const mark = new Image();
  mark.src = "assets/tile.svg";
  mark.alt = "";
  mark.draggable = false;
  mark.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  bloom.appendChild(mark);
  overlay.appendChild(bloom);
  const placeBloom = () => {
    bloom.style.left = acx() + "px";
    bloom.style.top = acy() + "px";
  };
  placeBloom();
  addEventListener("resize", placeBloom);

  const FIB = fibDirs(SPIN_TILES);
  const tiles = SPIN.map((a) => {
    // the rail's own markup, verbatim: .rail-item[data-app] gets its brand
    // ground, ink and hairline from hub-boot.css; .bleed carries the
    // full-bleed image exactly as the sidebar draws it
    const t = document.createElement("span");
    t.className = "rail-item" + (a.img ? " bleed" : "");
    if (a.app) t.dataset.app = a.app;
    t.title = a.name || a.app;
    t.style.cssText = "position:absolute;left:0;top:0;width:" + TILE + "px;height:" + TILE + "px;will-change:transform,opacity,filter;opacity:0;";
    const HAIRLINE = "inset 0 0 0 1px rgb(255 255 255 / .14)";
    if (a.img) {
      const img = new Image();
      img.src = a.img;
      img.alt = "";
      img.draggable = false;
      t.appendChild(img);
    } else if (a.logo) {
      // a transparent brand mark on a ground, at the registry marks' face
      t.style.background = a.bg;
      t.style.boxShadow = HAIRLINE;
      const img = new Image();
      img.src = a.logo;
      img.alt = "";
      img.draggable = false;
      img.style.cssText = "width:60%;height:60%;object-fit:contain;display:block;";
      t.appendChild(img);
    } else {
      if (a.sym) { t.style.background = a.bg; t.style.color = a.ink; t.style.boxShadow = HAIRLINE; }
      t.innerHTML = '<svg><use href="#sb-ic-' + (a.sym || a.app) + '"/></svg>';
      const svg = t.querySelector("svg");
      svg.style.width = "31px";
      svg.style.height = "31px";
    }
    holder.appendChild(t);
    return t;
  });

  const place3 = (el, x, y, z) => {
    el.style.transform = "translate3d(" + (C - TILE / 2 + x) + "px," + (C - TILE / 2 + y) + "px," + z + "px)";
  };

  // the handoff: hub-boot's story is not used — the sphere hands straight to
  // the real frontend
  let handedOff = false;
  const handoff = () => {
    handedOff = true;
  };

  // dissolve the overlay, revealing the frontend already in place
  const dissolve = () => {
    overlay.style.transition = "opacity 300ms ease";
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 320);
  };

  let ang = 0, last = null, phase = "run", raf = 0;
  // tester override: ?intro=<ms> jumps into the timeline — the bench's ?t= pattern
  const startAt = Math.max(0, parseInt(new URLSearchParams(location.search).get("intro") || "0", 10) || 0);
  let clock = startAt;
  const popped = new Array(SPIN_TILES).fill(false);
  const frame = (ts) => {
    if (last == null) last = ts;
    const dMs = Math.min(50, ts - last);
    last = ts;
    clock += dMs;
    ang += (dMs / 1000) * omegaAt(Math.min(clock, MERGE_T));

    for (let i = 0; i < SPIN_TILES; i++) {
      if (clock >= popAt(i) && !popped[i]) { popped[i] = true; tiles[i].style.opacity = "1"; }
    }
    for (let i = 0; i < SPIN_TILES; i++) {
      if (!popped[i]) continue;
      const v = rotY3(FIB[i], ang);
      const mergeT = Math.pow(clamp01((clock - (MERGE_T - 450)) / 450), 1.7);
      const x = lerp(v.x * R, 0, mergeT), y = lerp(v.y * R, 0, mergeT), z = v.z * lerp(R, 10, mergeT);
      const depth = (z + 190) / 380;
      place3(tiles[i], x, y, z);
      tiles[i].style.opacity = String(Math.min(1, (0.16 + 0.84 * depth) * (1 - clamp01((clock - MERGE_T) / 220))));
      const blurT = clamp01((clock - MERGE_T * 0.62) / (MERGE_T * 0.38));
      const blur = Math.pow(blurT, 2) * 3.6 + (depth < 0.5 ? (0.5 - depth) * 3 : 0);
      tiles[i].style.filter = blur > 0.05 ? "blur(" + blur.toFixed(2) + "px)" : "none";
    }
    if (phase !== "run" && clock >= MERGE_T + 220) tiles.forEach((t) => { t.style.visibility = "hidden"; });
    if (phase === "run" && clock >= MERGE_T) { phase = "finisher"; runFinisher(); }
    if (phase === "run" || (phase === "finisher" && clock < MERGE_T + 220)) raf = requestAnimationFrame(frame);
  };

  // beat 2 — fv-flip-icon-grow, exact: 0→0.76 flip 180°→0° + grow + brighten
  const runFinisher = () => {
    bloom.style.opacity = "1";
    const flip = bloom.animate([
      { transform: "perspective(900px) rotateY(180deg) scale(" + (TILE / 250) + ")", filter: "brightness(0.5)", easing: "cubic-bezier(.3,.85,.3,1.04)" },
      { transform: "perspective(900px) rotateY(0deg) scale(1.05)", filter: "brightness(1)", offset: 0.76, easing: "ease-out" },
      { transform: "scale(1)", filter: "brightness(1)" },
    ], { duration: 920, fill: "forwards" });
    flip.finished.then(() => {
      try { flip.commitStyles(); } catch (e) {}
      flip.cancel();
      showFrontend();
    }).catch((e) => {
      if (!e || e.name !== "AbortError") console.error("[sphere-intro] flip failed:", e);
    });
  };

  const anim = (el, keyframes, opts) =>
    el.animate(keyframes, opts).finished.catch((e) => {
      if (!e || e.name !== "AbortError") console.error("[sphere-intro] step failed:", e);
    });
  const px = (v) => v * S;
  // commit a finished fill:forwards animation to inline style and drop it —
  // a finished filling animation's effect can be garbage-collected otherwise
  const settle = (el) => {
    const a = el.getAnimations().pop();
    if (!a) return;
    try { a.commitStyles(); } catch (e) {}
    try { a.cancel(); } catch (e) {}
  };

  // beats 3 + 4 — the REAL rail assembles under the mark, in the middle of
  // the stage, then the whole lockup glides left into place. Nothing is
  // cloned and nothing crossfades: the icons that drop in ARE the sidebar's
  // icons (the real .rail translated to mid-stage), and the mark that lands
  // is the same tile.svg the rail slot draws, swapped in the same frame
  const showFrontend = async () => {
    const hub = document.getElementById("hub");
    if (!hub) { dissolve(); return; }
    const rail = hub.querySelector(".rail");
    const sb = hub.querySelector(".rail-item.sb");
    if (!rail || !sb) { hub.style.opacity = "1"; dissolve(); return; }
    const GLIDE = "cubic-bezier(.3,.7,.2,1)";

    // the hub is live from here, but invisible: window and rail grounds are
    // transparent until the glide, the superbot slot waits for the mark, and
    // the selection pill waits for the sidebar. The stylesheet gives .hub a
    // transition list (background-color, border-color…) that would turn
    // these instant changes into a visible fade — a one-frame flash of the
    // window ground — so transitions are off while the stage is set
    hub.style.transition = "none";
    rail.style.transition = "none";
    hub.style.background = "transparent";
    hub.style.borderColor = "transparent";
    hub.style.boxShadow = "none";
    rail.style.background = "transparent";
    rail.style.borderRightColor = "transparent";
    sb.classList.remove("sel");
    hub.style.opacity = "1";
    rail.style.opacity = "1";

    // measure the real rail at rest — the landing geometry. Rects come back
    // in SCREEN px, but transforms are applied in the stage's LOCAL px, and
    // an ancestor scales the stage (44px tiles render at 55px): Z converts
    // one to the other, or the tile lands 1.25× too big and 13px off-center
    const ovR = overlay.getBoundingClientRect();
    const sbR = sb.getBoundingClientRect();
    const Z = sbR.width / (parseFloat(getComputedStyle(sb).width) || sbR.width) || 1;
    const items = [...rail.children].filter((el) => el !== sb);
    const lastR = items.length ? items[items.length - 1].getBoundingClientRect() : sbR;
    const span = ((lastR.top + lastR.height / 2) - (sbR.top + sbR.height / 2)) / Z;
    const sbFx = (sbR.left + sbR.width / 2 - ovR.left) / Z; // slot center, overlay px
    const sbFy = (sbR.top + sbR.height / 2 - ovR.top) / Z;
    const homeY = acy() - span / 2; // the column, centered, superbot on top
    const k = (sbR.width / Z) / (MARK * S);

    // stand the real rail in mid-stage: its superbot slot under the mark;
    // every child waits hidden (the dividers have no hidden state of their
    // own in the stylesheet, only the tiles do)
    const rx = acx() - sbFx, ry = homeY - sbFy;
    rail.style.transform = "translate(" + rx + "px," + ry + "px)";
    items.forEach((el) => { el.style.opacity = "0"; });

    // beat 3a — the tile shrinks to the rail's size and rises to the column head
    await anim(bloom, [
      { transform: "translate(0,0) scale(1)" },
      { transform: "translate(0," + (homeY - acy()) + "px) scale(" + k + ")" },
    ], { duration: 620, easing: GLIDE, fill: "forwards" });
    settle(bloom);

    // beat 3b — the rail's own app icons drop down from the tile, one at a time
    await Promise.all(items.map((el, i) => anim(el, [
      { transform: "translateY(-34px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 },
    ], { duration: 480, delay: i * 90, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "both" })));
    items.forEach((el) => { settle(el); el.style.opacity = "1"; el.style.transform = ""; });

    // beat 4 — ALL of it moves left as one: the real rail glides home, the
    // tile rides its slot, and the window's ground grows in around them
    hub.style.transition = "background-color 520ms ease-out, border-color 520ms ease-out";
    rail.style.transition = "background-color 520ms ease-out, border-right-color 520ms ease-out";
    hub.style.background = "";
    hub.style.borderColor = "";
    rail.style.background = "";
    rail.style.borderRightColor = "";
    const gx = sbFx - acx(), gy = sbFy - homeY;
    await Promise.all([
      anim(rail, [
        { transform: "translate(" + rx + "px," + ry + "px)" },
        { transform: "translate(0,0)" },
      ], { duration: 640, easing: GLIDE, fill: "forwards" }),
      anim(bloom, [
        { transform: "translate(0," + (homeY - acy()) + "px) scale(" + k + ")" },
        { transform: "translate(" + gx + "px," + (homeY - acy() + gy) + "px) scale(" + k + ")" },
      ], { duration: 640, easing: GLIDE, fill: "forwards" }),
    ]);
    // landed: the rail is at rest and the tile sits exactly on its slot —
    // same artwork, same size, same pixel — so the slot takes over in the
    // same frame with no fade
    settle(rail);
    rail.style.transform = "";
    sb.style.opacity = "1";
    bloom.remove();
    hub.style.transition = "";
    rail.style.transition = "";
    hub.style.boxShadow = "";
    // the frontend extends: the sidebar, chat lane and panel fade into view,
    // and the selection pill takes its place beside the tile
    sb.classList.add("sel");
    const rest = [...hub.querySelectorAll(".inner")].filter((el) => !el.classList.contains("rail"));
    await Promise.all(rest.map((el) => anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: "forwards", easing: "ease-out" })));
    handoff();
    dissolve();
    playPhone();
    fireDone();
  };

  // beat 5 — the phone. hub-boot.js's helpers (seg/outQuint/outBack/popIn),
  // verbatim, so the beats read exactly as they do on the source site
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const outQuint = (p) => 1 - Math.pow(1 - p, 5);
  const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const inOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const op = (el, v) => { if (el) el.style.opacity = String(clamp01(v)); };
  const popIn = (el, t, at, dur = 0.25, dy = 6) => {
    if (!el) return;
    const p = seg(t, at, at + dur);
    op(el, p * 2);
    el.style.transform = "translateY(" + ((1 - outBack(p)) * dy).toFixed(1) + "px)";
  };
  let phonePlayed = false;
  const playPhone = () => {
    if (phonePlayed) return;
    phonePlayed = true;
    const hub = document.getElementById("hub"), phone = document.getElementById("phone");
    if (!hub || !phone) return;
    const sync = document.getElementById("sync");
    const beam = document.getElementById("beam"), beamPath = document.getElementById("beam-path"), beamRun = document.getElementById("beam-run-path");
    const beamFade = document.getElementById("beam-fade"), beamRunGrad = document.getElementById("beam-run");
    const feed = [1, 2].map((n) => hub.querySelector('.msg[data-m="' + n + '"]'));
    const phoneMsgs = [...phone.querySelectorAll(".msg")];
    // hub-boot.css .docked: the hub gives up its right quarter and the phone
    // becomes a full-height column there, on the stylesheet's own transitions.
    // The inline translateY stays: the sheet's rest transform is 120% (below
    // the arena), so clearing it would drop the phone back out of frame
    const dock = () => { phone.style.transform = "translateY(0%)"; phone.classList.add("docked"); hub.classList.add("docked"); };
    // the phone cut (<=640px) hides the phone and the beam — the
    // viewer is already on one. The lane's lines still land; nothing docks
    const noPhone = getComputedStyle(phone).display === "none";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      feed.forEach((el) => { op(el, 1); if (el) el.style.transform = ""; });
      if (noPhone) return;
      phoneMsgs.forEach((el) => { op(el, 1); el.style.transform = ""; });
      op(phone, 1); op(sync, 1);
      dock();
      return;
    }
    // the sync beam (hub-boot.js layout(), same geometry): it leaves the lower
    // half of the chat lane and lands on the phone's top-left shoulder, where
    // the "synced" chip lights a beat later. offset* ignores transforms, so the
    // phone's rest position is read while it still sits below the arena
    let B = null;
    if (!noPhone && beam && beamPath && beamRun && beamFade && beamRunGrad) {
      const W = arena.clientWidth, H = arena.clientHeight;
      const px = phone.offsetLeft, py = phone.offsetTop, pw = phone.offsetWidth;
      const x0 = W * 0.45, y0 = H * 0.62, x1 = px + pw * 0.22, y1 = py + 10;
      const cx = x0 + (x1 - x0) * 0.3, cy = y1 - 14;
      const d = "M " + x0.toFixed(1) + " " + y0.toFixed(1) + " Q " + cx.toFixed(1) + " " + cy.toFixed(1) + " " + x1.toFixed(1) + " " + y1.toFixed(1);
      beamPath.setAttribute("d", d);
      beamRun.setAttribute("d", d);
      B = { x0, x1, span: Math.max(90, (x1 - x0) * 0.42) };
      for (const g of [beamFade, beamRunGrad]) { g.setAttribute("y1", "0"); g.setAttribute("y2", "0"); }
      beamFade.setAttribute("x1", x0.toFixed(1));
      beamFade.setAttribute("x2", x1.toFixed(1));
      // the light parked wholly before the rail's start until its run
      beamRunGrad.setAttribute("x1", (B.x0 - B.span).toFixed(1));
      beamRunGrad.setAttribute("x2", B.x0.toFixed(1));
      beam.setAttribute("viewBox", "0 0 " + W + " " + H);
    }
    // hub-boot's story clock, rebased: its 17.0 (the chat lane has landed) is
    // 0 here, so the phone slides at 1.0, the light runs 2.4-4.0, the line
    // lands on both screens at 4.2 and the phone docks at 5.0
    const END = 5.6;
    let t0 = null, docked = false;
    const frame = (now) => {
      if (t0 == null) t0 = now;
      const t = (now - t0) / 1000;
      popIn(feed[0], t, 0.0);
      popIn(feed[1], t, 4.2);
      if (!noPhone) {
        const p = outQuint(seg(t, 1.0, 1.5));
        op(phone, p * 2);
        if (!docked) phone.style.transform = "translateY(" + ((1 - p) * 120).toFixed(1) + "%)";
        popIn(phoneMsgs[0], t, 1.5);
        popIn(phoneMsgs[1], t, 4.2);
        if (B) {
          op(beam, seg(t, 2.2, 2.5) * (1 - seg(t, 4.4, 4.8)));
          // one light, once: swept from wholly before the start to wholly past
          // the end, so it enters and leaves the rail as a comet
          const gx = lerp(B.x0 - B.span, B.x1 + B.span, inOut(seg(t, 2.4, 4.0)));
          beamRunGrad.setAttribute("x1", gx.toFixed(1));
          beamRunGrad.setAttribute("x2", (gx + B.span).toFixed(1));
        }
        // the "synced" chip in the phone's own header carries the fact (the
        // label that sat under the phone is gone, owner 2026-09-09)
        op(sync, seg(t, 4.2, 4.4));
        if (t >= 5.0 && !docked) { docked = true; dock(); }
      }
      if (t < END) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);

  // watchdog: if any step stalls (WAAPI promises can sit unresolved under
  // throttling), force the handoff and dissolve so the stage is never covered
  // — and play the phone anyway, so the end state is the source site's
  setTimeout(() => { handoff(); if (overlay.isConnected) dissolve(); playPhone(); fireDone(); }, startAt + 11000);
};
