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
  ['context-slow-poster', 'superbot can fix it!'],
  ['context-costly-poster', 'superbot can fix it!'],
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
  ['free-beta-flash-v04-superbot-ea5050ae', 'free-beta-flash-superbot-ea5050ae/v04.html', 'FREE BETA SUPERBOT FLASH · v4 strobe beats', 'Ad spots'],
  ['free-beta-flash-box-ticker-superbot-ea5050ae', 'free-beta-flash-superbot-ea5050ae/box-ticker.html', 'FREE BETA SUPERBOT FLASH · box logo ticker', 'Ad spots'],
    ['tabs-chaos-superbot-6f50ea56', 'tabs-chaos-superbot-6f50ea56/', 'KILL THE TABS', 'Ad spots'],
  ['youtube-refusal-superbot-7f2c9a41', 'youtube-refusal-superbot-7f2c9a41/', "WE DON'T REFUSE", 'Ad spots'],
  ['waffles-delivery-superbot-87a583a1', 'waffles-delivery-superbot-87a583a1/', 'order me waffles pls', 'Ad spots'],
  ['waffles-website-superbot-87a583a1', 'waffles-website-superbot-87a583a1/', '1 click publish', 'Ad spots'],
  ['do-that-too-superbot-9b4bf902', 'do-that-too-superbot-9b4bf902/', 'I can do that too!', 'Ad spots'],
  ['deny-cascade-superbot-440813d4', 'deny-cascade-superbot-440813d4/', '"ASK ME ANYTHING"', 'Ad spots'],
  ['agents-slower-superbot-7bf1a6c6', 'agents-slower-superbot-7bf1a6c6/', 'agents getting slower overtime?', 'Ad spots'],
  ['favorite-color', 'favorite-color/', 'favorite color · the chat pitch', 'Ad spots'],
  ['mayonnaise-superbot-5c2f8e47', 'mayonnaise-superbot-5c2f8e47/', 'is mayonnaise an instrument?', 'Ad spots'],
  ['who-are-you-superbot-4a7e2c19', 'who-are-you-superbot-4a7e2c19/', 'WHO ARE YOU', 'Ad spots'],
  ['free-tokens-still-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/free-tokens-still.html', 'FREE TOKENS · still', 'Ad spots'],
  ['free-tokens-type-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/free-tokens-type.html', 'FREE TOKENS · typed', 'Ad spots'],
  ['free-tokens-slam-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/free-tokens-slam.html', 'FREE TOKENS · slam', 'Ad spots'],
  ['comments-still-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/comments-still.html', 'FIRST 100 COMMENTS = EARLY ACCESS · still', 'Ad spots'],
  ['comments-counter-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/comments-counter.html', 'FIRST 100 COMMENTS = EARLY ACCESS · counter', 'Ad spots'],
  ['comments-beats-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/comments-beats.html', 'FIRST 100 COMMENTS = EARLY ACCESS · beats', 'Ad spots'],
  ['ready-100-flash-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/ready-100-flash.html', 'READY? · 100 codes flash', 'Ad spots'],
  ['ready-countdown-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/ready-countdown.html', 'READY? 3, 2, 1 · countdown to 100 codes', 'Ad spots'],
  ['dont-blink-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/dont-blink.html', 'DON\'T BLINK. · the codes hide in its blink', 'Ad spots'],
  ['wait-for-it-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/wait-for-it.html', 'WAIT FOR IT... · then comment AGAIN', 'Ad spots'],
  ['five-flashes-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/five-flashes.html', '5 FLASHES · 20 codes on every beat', 'Ad spots'],
  ['pause-at-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/pause-at.html', 'PAUSE AT 0:03 · a timecode that tells the truth', 'Ad spots'],
  ['invite-slot-type-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/invite-slot-type.html', 'Invite field · types itself', 'Ad spots'],
  ['slot-machine-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/slot-machine.html', 'Slot machine · reels lock', 'Ad spots'],
  ['terminal-giveaway-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/terminal-giveaway.html', 'Terminal · 100 codes issued', 'Ad spots'],
  ['odometer-100-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/odometer-100.html', 'Odometer · rolls to 100', 'Ad spots'],
  ['codes-left-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/codes-left.html', 'Codes left · counts down to gone', 'Ad spots'],
  ['drop-timer-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/drop-timer.html', 'Drop timer · 0.1 s drop', 'Ad spots'],
  ['comment-superbot-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/comment-superbot.html', 'COMMENT \'SUPERBOT\' · reply bot', 'Ad spots'],
  ['like-meter-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/like-meter.html', 'LIKES UNLOCK CODES · like meter', 'Ad spots'],
  ['tag-a-friend-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/tag-a-friend.html', 'TAG A FRIEND · two for one', 'Ad spots'],
  ['not-a-robot-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/not-a-robot.html', 'I\'M NOT A ROBOT · captcha confession', 'Ad spots'],
  ['find-happy-one-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/find-happy-one.html', 'FIND THE HAPPY ONE · crowd puzzle', 'Ad spots'],
  ['like-if-you-saw-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/like-if-you-saw.html', 'LIKE IF YOU SAW IT · one frame', 'Ad spots'],
  ['token-odometer-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/token-odometer.html', 'FREE TOKENS · 1,000,000 odometer', 'Ad spots'],
  ['hypno-rings-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/hypno-rings.html', 'FREE TOKENS · hypno rings', 'Ad spots'],
  ['ready-set-go-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/ready-set-go.html', 'READY SET GO · FREE TOKENS start lights', 'Ad spots'],
  ['scratch-card-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/scratch-card.html', 'FREE TOKENS · scratch card', 'Ad spots'],
  ['early-door-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/early-door.html', 'EARLY ACCESS · FIRST 100 COMMENTS doors', 'Ad spots'],
  ['tokens-stack-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/tokens-stack.html', 'FREE TOKENS · TOKENS avalanche', 'Ad spots'],
  ['matrix-rain-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/matrix-rain.html', 'CATCH ONE · code rain', 'Ad spots'],
  ['ticker-tokens-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/ticker-tokens.html', 'FREE TOKENS · ticker', 'Ad spots'],
  ['code-silhouette-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/code-silhouette.html', '100 CODES · silhouette', 'Ad spots'],
  ['glitch-reveal-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/glitch-reveal.html', 'CODES INSIDE · glitch reveal', 'Ad spots'],
  ['screenshot-shutter-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/screenshot-shutter.html', 'SCREENSHOT THIS · shutter', 'Ad spots'],
  ['one-works-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/one-works.html', 'ONE OF THESE WORKS · scan', 'Ad spots'],
  ['dvd-bounce-8h-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/dvd-bounce-8h.html', '8 HOURS · DVD bounce, hidden code flashes', 'Ad spots'],
  ['comments-release-superbot-d7bc1ed7', 'mascot-codes-superbot-d7bc1ed7/comments-release.html', 'FIRST 100 COMMENTS = EARLY ACCESS ON RELEASE · cards', 'Ad spots'],
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
for (const [name, src, title, group] of more) {
  items.push({ id: name, type: 'animation', group, title, src: `animations/${src}`,
    thumb: `assets/shots/${name}.png` });
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
  if (it.type !== 'animation') continue;
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
