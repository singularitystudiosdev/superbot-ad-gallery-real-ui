// Independent harness for the ai-aggregator expand spot (chat 65ded84b).
// One headless Chromium (channel: chrome, dedicated profile) drives every seek
// point, captures console/page errors, screenshots each frame, and asserts DOM
// state that the render(t) clock should produce at that time.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const NODE_PATH = "/Users/adrianagne/.npm/_npx/e41f203b7505f1fb/node_modules";
const { chromium } = require(`${NODE_PATH}/playwright`);

const FILE = "file:///Users/adrianagne/Documents/cosmos/projects/cloned-xdxdxd/ads/ai-aggregator-superbot-a3f7c25e/index.html";
const OUT = "/Users/adrianagne/Documents/cosmos/projects/cloned-xdxdxd/.tmp/verify-a3f7c25e";

const frames = [500, 4200, 5800, 7100, 8800, 12000, 14300, 17200];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));

const results = [];
for (const t of frames) {
  await page.goto(`${FILE}?t=${t}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => {
    const sel = [...document.querySelectorAll(".row.chat")].findIndex(r => r.classList.contains("on"));
    return {
      cardOn: document.getElementById("card").classList.contains("on"),
      selectedRow: sel,
      tagOpacity: parseFloat(document.getElementById("tag").style.opacity) || 0,
      winOpacity: parseFloat(document.getElementById("win").style.opacity) || 0,
      sphereVisible: [...document.querySelectorAll(".tile")].some(el => el.style.visibility !== "hidden" && parseFloat(el.style.opacity || "0") > 0.2),
      railTransform: document.getElementById("rail").style.transform,
      title: document.getElementById("chTitle").textContent,
    };
  });
  const shot = `${OUT}/h${t}.png`;
  await page.screenshot({ path: shot });
  results.push({ t, state, shot });
}
await browser.close();

// assertions
const fails = [];
for (const r of results) {
  const { t, state } = r;
  if (state.winOpacity < 0.9) fails.push(`t${t}: window not visible (${state.winOpacity})`);
  if (t >= 7500 && t < 15900 && state.cardOn) fails.push(`t${t}: card visible too early`);
  if (t >= 15900 && !state.cardOn) fails.push(`t${t}: end card not shown`);
  if (t === 8800 && state.selectedRow !== 0) fails.push(`t${t}: expected chat row 0 selected, got ${state.selectedRow}`);
  if (t === 12000 && state.selectedRow !== 4) fails.push(`t${t}: expected chat row 4 selected, got ${state.selectedRow}`);
  if (t === 14300 && state.tagOpacity < 0.9) fails.push(`t${t}: tagline not fully visible (${state.tagOpacity})`);
  if (t === 500 && !state.sphereVisible) fails.push(`t${t}: sphere tiles not popping`);
  if (t === 17200 && !/translate\(0px, ?0px\)/.test(state.railTransform.replace(/\s/g, "")))
    fails.push(`t${t}: rail not gliding home, transform=${state.railTransform}`);
}
if (errors.length) fails.push(...errors);

console.log(JSON.stringify({ ok: fails.length === 0, fails, frames: results.map(r => ({ t: r.t, ...r.state })) }, null, 2));
