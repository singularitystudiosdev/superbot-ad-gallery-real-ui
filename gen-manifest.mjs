// Generates manifest.json by scanning assets/. Run: node gen-manifest.mjs
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

const ONLY_GROUP = 'Ad spots';

// PNG IHDR: bytes 16-19 width, 20-23 height (big-endian)
function pngSize(path) {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const groups = [
  { dir: 'assets/img', group: 'App screenshots', type: 'image', match: f => f.startsWith('screenshot-'), titles: {
    'screenshot-activity': 'App — Activity', 'screenshot-credits': 'App — Credits',
    'screenshot-dashboard': 'App — Dashboard', 'screenshot-settings': 'App — Settings',
    'screenshot-setup': 'App — Setup' } },
  { dir: 'assets/img', group: 'SUPERBOT.GG', type: 'image', match: f => !f.startsWith('screenshot-'), titles: {
    'gg-preview': 'SUPERBOT.GG — preview', 'mono': 'Mono textmode', 'mono-fx': 'Mono — fx pass',
    'mono-home': 'Mono — home', 'mono-wipe': 'Mono — wipe' } },
  { dir: 'assets/img/icons', group: 'IDE icons', type: 'image', titles: null },
];

// Static image ads (v7-spb-vd sources). Each ships one PNG per gallery ratio —
// assets/ads/<id>.<ar>.png, height 1350 — so the poster reshapes with the ratio
// picker instead of sitting at a fixed 4:5. `src` carries the {ar} slot the
// gallery fills in; `sizes` gives each ratio's pixels for the tile and the
// download label.
const AD_ARS = ['4x5', '16x9', '4x3', '1x1'];
const ads = [
  ['stop-burning-tokens', 'STOP BURNING TOKENS'],
  ['agents-refusing-poster', 'superbot can do it!'],
  ['agents-slow-poster', 'superbot can do it!'],
  ['agent-workspace-poster', 'Your all in one agent workspace'],
  // the context before/after family, built from ads-src/context-storage (the
  // phone-cleaner "Optimize Storage" before/after bars, re-drawn for an agent's
  // context window; 2026-09-16)
  ['context-full-poster', 'superbot can fix it!'],
];

const anims = [
  ['gg-home', 'animations/gg/', 'SUPERBOT.GG — Pure ASCII', 'The .gg landing hero: full-ASCII mascot + wordmark, live.'],
  ['gg-crt', 'animations/gg/crt.html', 'SUPERBOT.GG — Pure Textmode (CRT)', 'Textmode variant of the landing page.'],
  ['app', 'animations/app/', 'superbot — setup wizard', 'Interactive onboarding demo: install, link, subscribe, activate.'],
  ['ide-merge', 'animations/ide-merge/', 'The IDE merge — every IDE, one bot', 'Ad spot: IDEs orbit, converge and merge into the superbot mascot.'],
  ['ide-orbit', 'animations/ide-orbit/', 'IDE orbit', 'Ad spot: IDE icons orbiting the superbot core.'],
  ['merge-hero', 'animations/merge-hero/', 'Merge hero', 'Hero ad: agents merge into superbot_.'],
  ['merge-hero-v2', 'animations/merge-hero-v2/', 'Merge hero — variant 2', 'Alternate cut of the merge hero.'],
  ['orbit-hero', 'animations/orbit-hero/', 'All agents, one — orbit hero', 'Hero ad: every agent card orbits, then converges.'],
];
const animThumbs = {
  'gg-home': 'gg-home-9s', 'gg-crt': 'gg-crt-9s', 'app': 'app-4s', 'ide-merge': 'ide-merge-9s',
  'ide-orbit': 'ide-orbit-4s', 'merge-hero': 'merge-hero-9s', 'merge-hero-v2': 'merge-hero-v2-9s',
  'orbit-hero': 'orbit-hero-4s',
};

const items = anims.map(([id, src, title, desc]) => ({
  id, type: 'animation', group: 'Animations', title, desc,
  src,
  thumb: `assets/shots/${animThumbs[id]}.png`,
}));

// Second sweep — ad spots, site variants, hero FX and related pages.
// [name, pagePath, title, group]
const more = [
    ['youtube-refusal-superbot-7f2c9a41', 'youtube-refusal-superbot-7f2c9a41/', "WE DON'T REFUSE", 'Ad spots'],
    ['waffles-website-superbot-87a583a1', 'waffles-website-superbot-87a583a1/', '1 click publish', 'Ad spots'],
  ['do-that-too-apps-superbot-e8871e50', 'do-that-too-apps-superbot-e8871e50/', 'I can do that too · every app in one chat', 'Ad spots'],
  ['it-does-what-you-ask-superbot-da5f6b38', 'it-does-what-you-ask-superbot-da5f6b38/', 'IT DOES WHAT YOU ASK · meme to Reddit to burger', 'Ad spots'],
  ['every-model-one-chat-superbot-efa8df82', 'every-model-one-chat-superbot-efa8df82/', 'EVERY MODEL. ONE CHAT. · Connecting to DoorDash', 'Ad spots'],
  ['every-model-one-chat-sb-superbot-efa8df82', 'every-model-one-chat-superbot-efa8df82/?route=superbot', 'EVERY MODEL. ONE CHAT. · Switched to Superbot', 'Ad spots'],
  ['every-model-one-chat-sb-combo-efa8df82', 'every-model-one-chat-superbot-efa8df82/?route=combo', 'EVERY MODEL. ONE CHAT. · Superbot, then DoorDash', 'Ad spots'],
  // I want to make minecraft (2026-09-26): Opus 5.5 codes, GitHub, DeepSeek V4 Flash scrapes decals, Gemini makes them,
  // Opus 5.5 ships the game; three cuts of one page (?cut=).
  ['make-minecraft-every-model-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/', 'I WANT TO MAKE MINECRAFT · every model, one chat', 'Ad spots'],
  ['make-minecraft-every-model-steps-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/?cut=steps', 'I WANT TO MAKE MINECRAFT · you ask, it switches', 'Ad spots'],
  ['make-minecraft-every-model-zoom-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/?cut=zoom', 'I WANT TO MAKE MINECRAFT · into the game', 'Ad spots'],
  // I want to make a MMO RPG (2026-09-26): five routings of one page (?v=1..5) through plan, code, git, art, play.
  ['mmorpg-every-model-v3-superbot-d231c019', 'mmorpg-every-model-superbot-d231c019/?v=3', 'I want to make a MMO RPG: Gemini art first, DeepSeek lore, Opus 5.5 codes', 'Ad spots'],
  ['mmorpg-every-model-v4-superbot-d231c019', 'mmorpg-every-model-superbot-d231c019/?v=4', 'I want to make a MMO RPG: DeepSeek, Codex server, Opus 5.5 client, Gemini, GitHub', 'Ad spots'],
  ['mmorpg-every-model-v5-superbot-d231c019', 'mmorpg-every-model-superbot-d231c019/?v=5', 'I want to make a MMO RPG: Opus 5.5 plans, DeepSeek codes, Gemini art, GitHub', 'Ad spots'],
  // build me an interactive 3D island world (2026-09-26): three storyboards of one page (?v=1..3: 3, 5, 7 switches), end on the island clip.
  ['island-world-every-model-v1-superbot-00836f02', 'island-world-every-model-superbot-00836f02/?v=1', '3D island world: Gemini images the terrain and sky, Claude Opus 5.5 builds it, Superbot runs it (3 switches)', 'Ad spots'],
  ['island-world-every-model-v2-superbot-00836f02', 'island-world-every-model-superbot-00836f02/?v=2', '3D island world: Claude Opus 5.5 builds, Meshy props, Gemini textures, GitHub, Superbot (5 switches)', 'Ad spots'],
  ['island-world-every-model-v3-superbot-00836f02', 'island-world-every-model-superbot-00836f02/?v=3', '3D island world: Veo flythrough, Opus water, ElevenLabs sound, Opus controls, DeepSeek tests, GitHub (7 switches)', 'Ad spots'],
  // make a 15-second motion graphics ad (2026-09-26): three routings of one page (?v=1..3), ends on a 13s cut of @ajith_io's 15s spot.
  ['motion-ad-every-model-v1-superbot-7734cfa7', 'motion-ad-every-model-superbot-7734cfa7/?v=1', 'make a 15-second motion graphics ad: Suno lays the bed, Opus 5.5 syncs the cuts, Superbot renders (3 switches)', 'Ad spots'],
  ['motion-ad-every-model-v2-superbot-7734cfa7', 'motion-ad-every-model-superbot-7734cfa7/?v=2', 'make a 15-second motion graphics ad: Nano Banana frames, Opus 5.5 builds, Suno scores, DeepSeek audits (5 switches)', 'Ad spots'],
  ['motion-ad-every-model-v3-superbot-7734cfa7', 'motion-ad-every-model-superbot-7734cfa7/?v=3', 'make a 15-second motion graphics ad: Opus 5.5 live preview, DeepSeek, Suno, Opus, GitHub, Opus renders (7 switches)', 'Ad spots'],
  // make a 90s fantasy 3D game (2026-09-26): three routings of one page (?v=1..3) through plan, code, art, music, git, play.
  ['fantasy90s-every-model-v1-superbot-042670d1', 'fantasy90s-every-model-superbot-042670d1/?v=1', 'make a 90s fantasy 3D game: Meshy meshes first, then Opus 5.5 and Gemini in parallel (3 requests)', 'Ad spots'],
  ['fantasy90s-every-model-v2-superbot-042670d1', 'fantasy90s-every-model-superbot-042670d1/?v=2', 'make a 90s fantasy 3D game: Codex in the terminal, Opus 5.5 reviews and hands it back, Gemini (5 requests)', 'Ad spots'],
  ['fantasy90s-every-model-v3-superbot-042670d1', 'fantasy90s-every-model-superbot-042670d1/?v=3', 'make a 90s fantasy 3D game: Lyria chiptune first, Meshy, Gemini decals, Opus 5.5, DeepSeek scrapes decals, GitHub (7 requests)', 'Ad spots'],
  // make a Splatoon-style ink game (2026-09-26): nine requests in one thread on the fantasy90s shell, ends on an 8.6s five-cut montage of @JaydenDavisNC's Opus 5.5 Inkwave build (VICTORY!).
  ['inkwave-every-model-superbot-53035443', 'inkwave-every-model-superbot-53035443/', 'make a Splatoon-style ink game: Nano Banana Pro squad, Meshy map kit, Opus 5.5 + Codex in parallel, DeepSeek bots, ElevenLabs SFX, Cursor HUD, Opus match flow, Vercel deploy (9 requests)', 'Ad spots'],
  // make a Splatoon game (2026-09-26): the one-ask nine-step ink build forked from fantasy90s v3's grammar. Opus 5.5
  // writes the script, then superbot carries it: DeepSeek V4 Flash scrapes the ink refs, Meshy 5 models the plaza and
  // Juno, HY-Motion 1.0 animates juno.glb, ElevenLabs and Suno v5 score it in parallel, Nano Banana paints the art,
  // Opus 5.5 codes the turf war, Vercel ships it, and the last step is real gameplay trimmed from a bit into the post
  // (@JaydenDavisNC's Opus 5.5 Splatoon capture, game: Inkwave).
  ['inkwave-every-model-v1-superbot-f1a86d6f', 'inkwave-every-model-superbot-f1a86d6f/?v=1', 'make a Splatoon game: Opus 5.5 scripts it, DeepSeek scrapes, Meshy 5 models, HY-Motion animates, ElevenLabs + Suno sound, Nano Banana art, Opus codes, Vercel ships (9 steps)', 'Ad spots'],
  // make a Splatoon-style ink game (2026-09-26): the fantasy90s v3 routing reskinned to an ink shooter, ends on 13s of @JaydenDavisNC's Opus 5.5 build.
  ['splatoon-every-model-v3-superbot-7cf3d4da', 'splatoon-every-model-superbot-7cf3d4da/', 'make a Splatoon-style ink game: Lyria, Meshy, Gemini, Opus 5.5, DeepSeek, GitHub, then the real Opus 5.5 build plays (7 requests; clip @JaydenDavisNC)', 'Ad spots'],
  // make a Splatoon-style ink game (2026-09-26): one ask routed to seven models on one page (v3, the default cut):
  // Lyria scores the match, Meshy models the props, Gemini draws the ink decals, DeepSeek scrapes CC0 prop
  // libraries, GitHub pushes Inkwave, Opus 5.5 codes the game and plays it.
  ['inkwave-every-model-superbot-3f9d27b4', 'inkwave-every-model-superbot-3f9d27b4/', 'make a Splatoon game: Lyria track, Meshy props, Gemini ink decals, Opus 5.5 codes Inkwave, DeepSeek scrapes props, GitHub (7 requests)', 'Ad spots'],
  // make a Splatoon game (2026-09-26): seven requests in one thread, ending on the Inkwave launch. The closing clip
  // is @JaydenDavisNC's Opus 5.5 Splatoon capture (game: Inkwave) — https://x.com/JaydenDavisNC/status/2103357848961036304
  ['splatoon-every-model-v3-superbot-3081f5d2', 'splatoon-every-model-superbot-3081f5d2/?v=3', 'Superbot: make a Splatoon game, every model: Lyria 2 scores it, Meshy builds the meshes, Gemini paints the arena, Opus 5.5 codes the ink sim, DeepSeek V4 Flash scrapes decals, GitHub takes the repo, Opus 5.5 launches Inkwave; ends on @JaydenDavisNC’s Opus 5.5 Splatoon clip (7 requests)', 'Ad spots'],
  // make an animated video about the future (2026-09-26): three structurally different pipelines for one film (?v=1..3), ends on The Steep Part clip.
  // make Dark Souls (2026-09-26): three structurally different routings of one page (?v=1..3), coding always Opus 5.5 as result cards, ends on 13s of @The_Alex's Opus 5.5 Dark Souls clip.
  ['dark-souls-every-model-v1-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=1', 'make Dark Souls: ElevenLabs voices the boss, Opus 5.5 builds it, Superbot plays (3 switches)', 'Ad spots'],
  ['dark-souls-every-model-v2-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=2', 'make Dark Souls: Gemini paints the Gatewarden, Opus 5.5 builds the fight, Gemini textures the fog gate, GitHub, Superbot renders and plays (5 switches)', 'Ad spots'],
  ['dark-souls-every-model-v3-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=3', 'make Dark Souls: Opus 5.5 builds combat, DeepSeek assets, ElevenLabs score, Gemini art, Opus 5.5 live preview, GitHub, Superbot plays (7 switches)', 'Ad spots'],
  // v4 remake (2026-09-26): seven steps of the same page, reframed tight like one-agent-full-degen (no per-switch zoom):
  // Opus 5.5 cooks the codebase as a timelapse, DeepSeek V4 Flash searches the reference assets, Meshy 5 turns them
  // into real 3D meshes, MiniMax Hailuo 02 animates the casts, ElevenLabs scores, GitHub, Superbot plays.
  ['dark-souls-every-model-v4-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=4', 'make Dark Souls: Opus 5.5 timelapse cooks the code, DeepSeek V4 Flash searches the assets, Meshy 5 models them in 3D, MiniMax Hailuo 02 animates, ElevenLabs score, GitHub, Superbot plays (v4 remake, 7 steps)', 'Ad spots'],
  ['wsb-to-wings-switcher-superbot-cbe85cdb', 'wsb-to-wings-switcher-superbot-cbe85cdb/', 'From WSB to Wings in One Ask', 'Ad spots'],
  ['tendie-model-selector-superbot-3c27b88b', 'tendie-model-selector-superbot-3c27b88b/', 'The Right Model for Every Tendie', 'Ad spots'],
  ['one-agent-full-degen-superbot-129bca8b', 'one-agent-full-degen-superbot-129bca8b/', 'One Agent. Full Degen.', 'Ad spots'],
    // the no-switch family (2026-09-25): forked from the context-switch spot, built on the real superbot
  // hub UI, each keeping the same thread while a new model joins the rail. One member still listed.
  // the "Superbot just works" family (2026-09-25): built on one kit (animations/just-works-kit-42aac446).
  // superbot aggregates a real ask across platforms and hands back a finished frontend in Chrome.
  ['just-works-waiver-night-gpt-superbot-42aac446', 'just-works-waiver-night-gpt-superbot-42aac446/', 'Waiver night, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-campsite-watch-superbot-42aac446', 'just-works-campsite-watch-superbot-42aac446/', 'Upper Pines, Jul 3 to 6', 'Ad spots'],
  ['just-works-pc-backlog-superbot-42aac446', 'just-works-pc-backlog-superbot-42aac446/', 'Steam + Epic + GOG, one backlog', 'Ad spots'],
  ['just-works-marathon-build-superbot-42aac446', 'just-works-marathon-build-superbot-42aac446/', 'Strava + Garmin + Nike Run Club, one training log', 'Ad spots'],
  ['just-works-home-audit-gpt-superbot-42aac446', 'just-works-home-audit-gpt-superbot-42aac446/', 'Home Assistant + Google Home + Alexa + SmartThings + Hue, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-trip-wallet-superbot-42aac446', 'just-works-trip-wallet-superbot-42aac446/', 'Gmail + United + Delta + Marriott + Airbnb, one trip timeline', 'Ad spots'],
  ['just-works-trip-wallet-gpt-superbot-42aac446', 'just-works-trip-wallet-gpt-superbot-42aac446/', 'Gmail + United + Delta + Marriott + Airbnb, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-job-hunt-superbot-42aac446', 'just-works-job-hunt-superbot-42aac446/', 'LinkedIn + Indeed + Gmail + 40 job boards, one job pipeline', 'Ad spots'],
  ['just-works-job-hunt-gpt-superbot-42aac446', 'just-works-job-hunt-gpt-superbot-42aac446/', 'LinkedIn + Indeed + Gmail + 40 job boards, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-reading-list-superbot-42aac446', 'just-works-reading-list-superbot-42aac446/', 'Libby + Goodreads + Kindle + Audible, one reading overview', 'Ad spots'],
  ['just-works-reading-list-gpt-superbot-42aac446', 'just-works-reading-list-gpt-superbot-42aac446/', 'Libby + Goodreads + Kindle + Audible, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-watchlist-gpt-superbot-42aac446', 'just-works-watchlist-gpt-superbot-42aac446/', 'Letterboxd + IMDb + Trakt, ChatGPT vs Superbot', 'Ad spots'],
  ['just-works-ev-hunt-superbot-42aac446', 'just-works-ev-hunt-superbot-42aac446/', 'Tesla + Carvana + CarMax + CarGurus, one Model Y shortlist', 'Ad spots'],
  ['just-works-mech-keys-superbot-42aac446', 'just-works-mech-keys-superbot-42aac446/', 'NovelKeys + CannonKeys + KBDfans + Drop + Keychron, one group-buy overview', 'Ad spots'],
  ['just-works-photo-gear-superbot-42aac446', 'just-works-photo-gear-superbot-42aac446/', 'Lightroom + B&H + MPB + KEH, one camera gear check', 'Ad spots'],
      ['deny-cascade-superbot-440813d4', 'deny-cascade-superbot-440813d4/', '"ASK ME ANYTHING"', 'Ad spots'],
  ['agents-slower-superbot-7bf1a6c6', 'agents-slower-superbot-7bf1a6c6/', 'agents getting slower overtime?', 'Ad spots'],
  ['favorite-color', 'favorite-color/', 'favorite color · the chat pitch', 'Ad spots'],
  ['mayonnaise-superbot-5c2f8e47', 'mayonnaise-superbot-5c2f8e47/', 'is mayonnaise an instrument?', 'Ad spots'],
  ['who-are-you-superbot-4a7e2c19', 'who-are-you-superbot-4a7e2c19/', 'WHO ARE YOU', 'Ad spots'],
  ['ready-100-flash-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/ready-100-flash.html', 'READY? · 100 codes flash', 'Ad spots'],
  ['dvd-bounce-8h-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/dvd-bounce-8h.html', '8 HOURS · DVD bounce, hidden code flashes', 'Ad spots', { download: 'https://github.com/singularitystudiosdev/superbot-ad-gallery/releases/download/dvd-bounce-8h-d7bc1ed7/dvd-bounce-8h-superbot-d7bc1ed7.16x9.mp4', downloadLabel: '16:9 · 8 hours' }],
  ['gg-site-variants', 'gg-site/variants.html', 'superbot.gg — character variants', 'Site variants'],
  ['gg-site-lander-zen', 'gg-site/lander-zen.html', 'lander — zen', 'Site variants'],
  ['gg-site-lander-minimal', 'gg-site/lander-minimal.html', 'lander — minimal', 'Site variants'],
  ['gg-site-lander-shell', 'gg-site/lander-shell.html', 'lander — shell', 'Site variants'],
  ['gg-site-lander-agent', 'gg-site/lander-agent.html', 'lander — the agent that helps your agents', 'Site variants'],
  ['gg-site-design-terminal', 'gg-site/design-terminal.html', 'design A — terminal', 'Site variants'],
  ['gg-site-design-pop', 'gg-site/design-pop.html', 'design B — pop', 'Site variants'],
  ['gg-site-design-paper', 'gg-site/design-paper.html', 'design C — paper terminal', 'Site variants'],
  ['ascii', 'ascii/', 'SUPERBOT.GG — ascii page', 'Site variants'],
  ['console', 'console/', 'superbot console', 'Site variants'],
  ['button-page', 'button-page/', 'button page', 'Site variants'],
  ['button-page-feed-grid', 'button-page/feed-grid.html', 'button page — feed grid', 'Site variants'],
  ['merge-mascot', 'merge-mascot/', 'merge — mascot cut', 'Site variants'],
  ['merge-loop', 'merge-loop/', 'every ide, one loop', 'Site variants'],
  ['hero-loading', 'hero-loading/', 'sphere collapse — loading fx', 'Hero reveal FX'],
  ['hero-combine', 'hero-combine/', 'hero load fx — circular combine · 10 takes', 'Hero reveal FX'],
  ['hero-finishers-dolly', 'hero-finishers/dolly.html', '3D dolly-in finishers', 'Hero reveal FX'],
  ['hero-finishers-sheen', 'hero-finishers/sheen.html', '3D sheen finishers', 'Hero reveal FX'],
  ['hero-flip-black-180', 'hero-flip/hero-flip-black-180.9f4c2e17.html', 'flip reveal · black back', 'Hero reveal FX'],
  ['hero-flip-black-drop', 'hero-flip/hero-flip-black-drop.9f4c2e17.html', 'flip reveal · black drop', 'Hero reveal FX'],
  ['hero-flip-black-edge', 'hero-flip/hero-flip-black-edge.9f4c2e17.html', 'flip reveal · black edge', 'Hero reveal FX'],
  ['hero-flip-double-ramp', 'hero-flip/hero-flip-double-ramp.9f4c2e17.html', 'flip reveal · double flip', 'Hero reveal FX'],
  ['hero-flip-icon-burst', 'hero-flip/hero-flip-icon-burst.9f4c2e17.html', 'flip reveal · icon burst', 'Hero reveal FX'],
  ['hero-flip-icon-start', 'hero-flip/hero-flip-icon-start.9f4c2e17.html', 'flip reveal · icon size', 'Hero reveal FX'],
  ['hero-flip-slow-cinema', 'hero-flip/hero-flip-slow-cinema.9f4c2e17.html', 'flip reveal · slow cinema', 'Hero reveal FX'],
  ['hero-flip-snap', 'hero-flip/hero-flip-snap.9f4c2e17.html', 'flip reveal · snap', 'Hero reveal FX'],
  ['hero-flip-reveals', 'hero-flip/hero-flip-reveals.356321a5.html', 'flip reveals — harness', 'Hero reveal FX'],
  ['rainbow-bench', 'rainbow-bench/', 'rainbow bench — the mascot in every color', 'Mascot & toys'],
  ['ai-dock', 'ai-dock/', 'AI dock — 10 AI apps, dock style', 'Mascot & toys'],
  ['swarm-console', 'swarm-console/', 'SWARM // command', 'Mascot & toys'],
  ['swarm-constellation', 'swarm-constellation/', 'SWARM.GG — agent constellation', 'Mascot & toys'],
  ['agent-feed', 'agent-feed/', 'superbot optimizer — agent feed', 'Mascot & toys'],
];
// an optional 5th field carries extra item fields, e.g. { download, downloadLabel } for a file too big for Pages
for (const [name, src, title, group, extra] of more) {
  items.push({ id: name, type: 'animation', group, title, src: `animations/${src}`,
    thumb: `assets/shots/${name}.png`, ...(extra || {}) });
}

for (const g of groups.filter(g => g.group === ONLY_GROUP)) {
  for (const f of readdirSync(g.dir).filter(f => f.endsWith('.png') && (!g.match || g.match(f))).sort()) {
    if (statSync(`${g.dir}/${f}`).isDirectory()) continue;
    const base = f.replace(/\.png$/, '');
    const title = g.titles ? (g.titles[base] ?? base) : base.replace(/-/g, ' ');
    const { w, h } = pngSize(`${g.dir}/${f}`);
    items.push({ id: base, type: 'image', group: g.group, title, w, h,
      src: `${g.dir}/${f}`, thumb: `${g.dir}/${f}` });
  }
}

for (const [id, title] of ads) {
  const sizes = {};
  for (const k of AD_ARS) sizes[k] = pngSize(`assets/ads/${id}.${k}.png`);
  items.push({ id, type: 'image', group: 'Ad spots', title, ars: AD_ARS, sizes,
    src: `assets/ads/${id}.{ar}.png`, thumb: `assets/ads/${id}.{ar}.png` });
}

// Ship only the ad spots; the other groups stay defined above for easy re-enable.
const shipped = items.filter(i => i.group === ONLY_GROUP);

writeFileSync('manifest.json', JSON.stringify(shipped, null, 2));
console.log(`manifest.json: ${shipped.length} items (${ONLY_GROUP})`);

// every shipped animation's download button points at assets/video/<id>.<ar>.mp4.
// Name the ones with no render, so a page added without its offline video shows up
// here instead of as a dead download in the gallery.
const VIDEO_ARS = ['16x9', '4x3', '1x1', '4x5'];
const noRender = [];
for (const it of shipped) {
  if (it.type !== 'animation' || it.download) continue; // an external download ships no per-ratio renders
  for (const k of VIDEO_ARS) {
    const p = `assets/video/${it.id}.${k}.mp4`;
    try { statSync(p); } catch { noRender.push(p); }
  }
}
if (noRender.length) {
  console.log(`\nWARNING: ${noRender.length} download${noRender.length === 1 ? '' : 's'} have no offline render:`);
  for (const p of noRender) console.log(`  ${p}`);
  console.log('  render with: node .tmp/ar-render.mjs <port> all <id ...>');
}
