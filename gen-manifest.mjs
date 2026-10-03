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
  // 3D cut (2026-10-01): the route=superbot spot as a floating 3D panel in a parallax void with a keyframed
  // camera — the panel tilts and the camera swings as the chips run, model logos bursting and converging, and
  // the order card punches in at the end. Same source spot as the three 2D entries above, rebuilt as a 3D one.
  ['every-model-one-chat-3d-sb-superbot-5af3c81d', 'every-model-one-chat-3d-sb-superbot-5af3c81d/?route=superbot', 'EVERY MODEL. ONE CHAT. · Switched to Superbot (3D cut)', 'Ad spots'],
  // 3D phone (2026-10-01): the same spot shot inside a moving 3D phone. The phone's screen drives the
  // route=superbot source spot (iframe, seeked by stage.js) and the model icons orbit, converge and merge
  // into the superbot tile as the camera swings. Poster = the merge beat (stage t 15.2).
  ['every-model-one-chat-3d-phone-superbot-ab7049c5', 'every-model-one-chat-3d-phone-superbot-ab7049c5/', 'EVERY MODEL. ONE CHAT. · on a moving 3D phone', 'Ad spots'],
  // I want to make minecraft (2026-09-26): Opus 5.5 codes, GitHub, DeepSeek V4 Flash scrapes decals, Gemini makes them,
  // Opus 5.5 ships the game; three cuts of one page (?cut=).
  ['make-minecraft-every-model-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/', 'I WANT TO MAKE MINECRAFT · every model, one chat', 'Ad spots'],
  ['make-minecraft-every-model-steps-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/?cut=steps', 'I WANT TO MAKE MINECRAFT · you ask, it switches', 'Ad spots'],
  ['make-minecraft-every-model-zoom-superbot-b055c127', 'make-minecraft-every-model-superbot-b055c127/?cut=zoom', 'I WANT TO MAKE MINECRAFT · into the game', 'Ad spots'],
  // BUT WE WILL, do my job call center (2026-09-28; v2 2026-09-29): standalone spot. "ChatGPT won't do your job for
  // you" with the red word "job", then a slam "BUT WE WILL", then the one ask "Do my job for me": superbot clocks in
  // at Comcast and the camera dives from the chat into a rebuilt Einstein 360 agent desktop, where it turns CTI on,
  // matches the voice, reads 1,284 past calls and works a queue of inbound calls to "Queue clear". All names/numbers fictional.
  ['do-my-job-callcenter-superbot-497a61f3', 'do-my-job-callcenter-superbot-497a61f3/', 'BUT WE WILL · Do my job for me: superbot answers Comcast calls in Einstein 360', 'Ad spots'],
  // BUT WE WILL, do my job lawyer (2026-09-29): the same intro and slam, then "Do my job for me" as a federal
  // litigator: superbot signs in to Clio Manage and the camera dives into the matter desk, where it connects, matches
  // your writing, reads your judges' rules and works the ECF notice queue (orders read, deadlines calendared, drafts
  // in your voice). Dockets, ECF entries and judges' rules are real (CourtListener RECAP, cited in img/CREDITS.txt);
  // drafts, task names and counts are the ad's own copy.
  ['do-my-job-lawyer-superbot-9c459cb1', 'do-my-job-lawyer-superbot-9c459cb1/', 'BUT WE WILL · Do my job for me: superbot works a litigator’s federal docket in Clio', 'Ad spots'],
  // BUT WE WILL, do my job data analyst (2026-09-29): the same intro and slam, then "Do my job for me" as a data
  // analyst: superbot signs in to BigQuery and Slack and the camera dives into BigQuery Studio beside a #data-requests
  // thread, where it writes the SQL, charts the result and replies with the chart for each request (World Cup final
  // trips out of the city, Hudson Yards Jul 4 fireworks pickups, CRZ congestion fees by fleet). Every table, result
  // and chart is real NYC TLC July 2026 trip data (cited in img/CREDITS.txt); request wording and replies are the ad's own copy.
  ['do-my-job-data-analyst-superbot-0368c93c', 'do-my-job-data-analyst-superbot-0368c93c/', 'BUT WE WILL · Do my job for me: superbot works a data analyst’s request queue in BigQuery', 'Ad spots'],
  // BUT WE WILL, do my job translator (2026-09-29): the same intro and slam, then "Do my job for me" as an
  // English-to-Spanish translator: superbot signs in to Phrase TMS and the camera dives into the CAT editor, where it
  // matches your translation style, reads your style guides and works the job queue (segments confirmed, term base
  // entries applied, QA warnings fixed). Every segment is a real US federal publication with its official Spanish (DOL
  // minimum wage poster, IRS Publication 1, Medicare & You 2027 and 9 more), term base entries are the official IRS
  // Publication 850 glossary terms and the QA catches quote RAE style rules (all cited in img/CREDITS.txt); job
  // statuses and counts are the ad's own copy.
  ['do-my-job-translator-superbot-e60f1bcc', 'do-my-job-translator-superbot-e60f1bcc/', 'BUT WE WILL · Do my job for me: superbot works an English-to-Spanish translator’s queue in Phrase TMS', 'Ad spots'],
  // BUT WE WILL, do my job copywriter (2026-09-29): the same intro and slam, then "Do my job for me" as a copywriter:
  // superbot signs in to Google Docs and the camera dives into a Mailchimp copy deck, where it matches your writing
  // style, reads the Mailchimp Content Style Guide and works the deck's request comments (Search ad headlines,
  // Subject lines, App Store subtitle: drafts streamed in as suggestions with a live character count, checks ticked,
  // reply posted, thread resolved). Every platform limit is quoted from the Google Ads, Apple App Store Connect,
  // Google Play, Meta, LinkedIn, X and Mailchimp help pages, the style rules from styleguide.mailchimp.com, each
  // drafted line's Sources quote from the Mailchimp homepage, pricing page and live App Store listing (all cited in
  // img/CREDITS.txt); the request comments and drafted copy are the ad's own.
  ['do-my-job-copywriter-superbot-cda60abe', 'do-my-job-copywriter-superbot-cda60abe/', 'BUT WE WILL · Do my job for me: superbot writes the Mailchimp copy deck in Google Docs', 'Ad spots'],
  // BUT WE WILL, do my job journalist (2026-09-29): the same intro and slam, then "Do my job for me" as a journalist:
  // superbot signs in to WordPress (7.1.2 block editor, rebuilt in HTML/CSS) and works a reporter's story budget of 12
  // real primary-source releases from Thu, Sept. 24, 2026 (BEA, DOL, Census, BLS, EIA, Freddie Mac, Fed, USDA NASS,
  // Costco, NASA): headline options with live character counts, dateline + lede + second paragraph typed, every
  // number fact-checked against the release, AP style fixes from 12 verbatim AP Stylebook rules, Submit for Review to
  // Pending (all cited in img/CREDITS.txt); the headlines, ledes and second paragraphs are the ad's own copy built
  // only from release facts.
  ['do-my-job-journalist-superbot-f8795b48', 'do-my-job-journalist-superbot-f8795b48/', 'BUT WE WILL · Do my job for me: superbot works a reporter’s story budget in WordPress', 'Ad spots'],
  // BUT WE WILL, do my job financial advisor (2026-09-29): the same intro and slam, then "Do my job for me" as a
  // financial advisor: superbot signs in to Wealthbox with Schwab connected and the camera dives into the CRM desk,
  // where it matches your writing, reads your past notes and works the client request queue (answer drafted with the
  // rule quoted, task ticked, reply posted in your writing). The 2026 RMD is the real IRS Pub. 590-B worked example
  // ($100,000 / Table III 24.6 = $4,065), contribution limits and the Roth catch-up wage rule are IRS's 2026 figures,
  // the Trump Account rules are IRS's, and the 60/40 drift uses real VTI/VXUS/BND closes Dec 31, 2025 to Sep 28, 2026
  // (all cited in img/CREDITS.txt); no person is named, request wording and replies are the ad's own copy.
  ['do-my-job-financial-advisor-superbot-38facc16', 'do-my-job-financial-advisor-superbot-38facc16/', 'BUT WE WILL · Do my job for me: superbot works a financial advisor’s client requests in Wealthbox', 'Ad spots'],
  // BUT WE WILL, do my job web developer (2026-09-29): the same intro and slam, then "Do my job for me" as a web
  // developer: superbot signs in to GitHub (issues, pull request, checks and merge box rebuilt in HTML/CSS from Primer
  // Octicons and Primer primitives) and works 12 real excalidraw/excalidraw issues assigned to you: the repo's rules
  // read verbatim, three real fix diffs typed (#11876 localize Sign up/Sign in, #7332 drop the dark-mode canvas filter
  // for Firefox, #11914 Cmd/Ctrl+Shift+S while editing text), the real checks pass, Merge pull request (all cited in
  // img/CREDITS.txt).
  ['do-my-job-webdev-superbot-80a211a0', 'do-my-job-webdev-superbot-80a211a0/', 'BUT WE WILL · Do my job for me: superbot works a web developer’s excalidraw issues on GitHub', 'Ad spots'],
  // BUT WE WILL, do my job market research analyst (2026-09-29): the same intro and slam, then "Do my job for me" as a
  // market research analyst: superbot signs in to Qualtrics XM (Data & Analysis > Crosstabs, rebuilt in HTML/CSS) and
  // works a saved crosstab queue on the Federal Reserve's SHED 2025 public-use data (12,934 respondents, weighted
  // column percents, 95% column stat tests), types each finding into the report and matches it to the Fed's published
  // figure in "Economic Well-Being of U.S. Households in 2025" (May 13, 2026); 12 verbatim codebook and report facts
  // (all cited in img/CREDITS.txt); the findings are the ad's own sentences built only from the tabulated data.
  ['do-my-job-market-research-analyst-superbot-5aa2de03', 'do-my-job-market-research-analyst-superbot-5aa2de03/', 'BUT WE WILL · Do my job for me: superbot works a market research analyst’s crosstab queue in Qualtrics', 'Ad spots'],
  // BUT WE WILL, do my job tax preparer (2026-09-29): the same intro and slam, then "Do my job for me" as a tax
  // preparer: superbot signs in to the Intuit ProConnect Tax desk with Intuit e-file connected and works the Oct 15, 2026
  // extension queue (client email answered from the IRS worked example, reply drafted in your writing, return e-filed,
  // rejects fixed). The answered returns are the IRS Schedule 1-A worked examples (tips $7,000 on line 5, overtime
  // $15,000 / 3 = $5,000, car loan interest $2,000 under Treas. Reg. 1.163-16), the MeF rejects IND-031-04, IND-181-01,
  // IND-507-01 and F8962-070 go from Rejected to Accepted with the IRS error text and fix, and the extended due date is
  // Oct 15, 2026 (all cited in img/CREDITS.txt); no person is named, client emails and replies are the ad's own copy.
  ['do-my-job-tax-preparer-superbot-0f0aa66c', 'do-my-job-tax-preparer-superbot-0f0aa66c/', 'BUT WE WILL · Do my job for me: superbot works a tax preparer’s extension queue in ProConnect Tax', 'Ad spots'],
  // BUT WE WILL, do my job travel agent (2026-09-29): the same intro and slam, then "Do my job for me" as a travel
  // agent: superbot signs in to Sabre Red 360 (queue list, PNR panel and command line rebuilt in HTML/CSS) and works
  // the PNR queue, typing real Sabre entries and answering each traveler: UA 852 TPE to SFO (Schedule change ·
  // Rebooked UA872 · Reissued); LH 440 FRA to IAH (Delay claim · EU261 · Filed with Lufthansa); UA 934 EWR to LHR
  // (Entry docs · UK ETA · DOCS added); real flights on their real routes and schedules, each case on a published
  // rule (all cited in img/CREDITS.txt); traveler names, record locators and ticket serials are fictional.
  ['do-my-job-travel-agent-superbot-8163d44c', 'do-my-job-travel-agent-superbot-8163d44c/', 'BUT WE WILL · Do my job for me: superbot works a travel agent’s Sabre queue', 'Ad spots'],
  // BUT WE WILL, do my job sales development rep (2026-09-29): the same intro and slam, then "Do my job for me" as a
  // sales development rep: superbot signs in to Outreach (Tasks list and the email, call and LinkedIn task flows
  // rebuilt in HTML/CSS/SVG from support.outreach.io, Outreach's documented step types only), reads 12 published
  // cold-outreach findings (Gong Labs, 30 Minutes to President's Club, Lavender, Belkins, each with its year and
  // dataset size) and works a 12-task queue on 12 real companies, each with a dated public sales-growth trigger from
  // its own release: the BackOps $42M Series B email (Sep 16, 2026), the AllianceHCM new Chief Revenue Officer call
  // logged Voicemail Left (Sep 28, 2026) and the Clinch London office LinkedIn connection request (Sep 9, 2026; note
  // under LinkedIn's 200-character limit), all cited in img/CREDITS.txt. No person is named: prospects show the title
  // their company's release gives; the email, voicemail and note are the ad's own copy restating only the sourced
  // trigger.
  ['do-my-job-sdr-superbot-b5acc09b', 'do-my-job-sdr-superbot-b5acc09b/', 'BUT WE WILL · Do my job for me: superbot works a sales development rep’s task queue in Outreach', 'Ad spots'],
  // BUT WE WILL, do my job proofreader and editor (2026-09-29): the same intro and slam, then "Do my job for me" as a
  // proofreader and editor: superbot signs in to Word for the web (Review tab, Track Changes and Navigation pane
  // rebuilt in HTML/CSS/SVG), turns on Track Changes, reads 12 style rules from the GPO Style Manual, the Guardian style
  // guide, the OFR Document Drafting Handbook and IUPAC, then fixes 12 real published errors: the missing serial comma
  // in Maine's overtime law, the "responsibilty" typo on Australia's $50 note, and an "or" that sat in a Federal Reserve
  // rule from 1980 until 2026. Every fix is matched to the correction the publisher printed (all cited in img/CREDITS.txt).
  ['do-my-job-proofreader-editor-superbot-c54c5ecd', 'do-my-job-proofreader-editor-superbot-c54c5ecd/', 'BUT WE WILL · Do my job for me: superbot proofreads and edits in Microsoft Word', 'Ad spots'],
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
  // make a k-pop music video about p(doom) (2026-09-27): the fantasy90s v3 routing rethemed to an M/V, ends on 10s of @donaldjewkes' one-prompt Opus 5.5 M/V.
  // make a relaxing Japanese bike riding game (2026-09-28): one chat switches Gemini (image decals), Blender (real 3D models shown in Blender), ElevenLabs (sound effects) and Claude Opus 5.5 (the code), then plays the real game. Clip X @prasenx https://x.com/prasenx/status/2102717687604633959, built in the browser with Claude Opus 5.5.
  // Two cuts of one page (?cut=): the default pushes the camera in on each switch pill and the code panel; ?cut=nozoom keeps the camera at rest.
  ['bikeride-model-switch-superbot-e13744a9', 'bikeride-model-switch-superbot-e13744a9/', 'make a relaxing Japanese bike riding game: Gemini, Blender, ElevenLabs, Opus 5.5, then the real Opus 5.5 build plays (4 switches; clip @prasenx)', 'Ad spots',
    { desc: 'Ends on a bike ride game by @prasenx (x.com/prasenx/status/2102717687604633959), built in the browser with Claude Opus 5.5.' }],
  ['bikeride-model-switch-nozoom-superbot-e13744a9', 'bikeride-model-switch-superbot-e13744a9/?cut=nozoom', 'make a relaxing Japanese bike riding game, no zoom: Gemini, Blender, ElevenLabs, Opus 5.5, then the real Opus 5.5 build plays (4 switches; clip @prasenx)', 'Ad spots',
    { desc: 'Ends on a bike ride game by @prasenx (x.com/prasenx/status/2102717687604633959), built in the browser with Claude Opus 5.5.' }],
  // Watch my portfolio (2026-10-03): stock-trading remake of bikeride-model-switch. One chat hands off to Gemini (watch
  // rule), Finnhub (live quotes), Twilio (SMS verified), Claude Opus 5.5 (read-only watch.js) and a view-only brokerage,
  // then NVDA slips past -5% and the lock-screen text lands. Watching only: no trade buttons, no return claims.
  ['niche-stocks-model-switch-superbot-8d2a45f0', 'niche-stocks-model-switch-superbot-8d2a45f0/', 'Watch my portfolio and text me if any position drops more than 5% today: Gemini, Finnhub, Twilio, Opus 5.5, your brokerage, then the text lands (5 switches)', 'Ad spots',
    { desc: 'One sentence in, five hand-offs: Gemini turns it into a watch rule, Finnhub streams live quotes, Twilio verifies your number, Claude Opus 5.5 writes the read-only watcher, and your brokerage connects with view-only access. NVDA slips past -5% and superbot texts you. Watching only, no trades placed.' }],
  // catch me up on #general and reply to my mentions (2026-10-03): one superbot chat switches Gemini (reads #general), ElevenLabs Scribe (transcribes the voice notes) and Claude Opus 5.5 (writes the catch-up and replies), then superbot posts the replies in Discord.
  ['niche-discord-model-switch-superbot-3b7e91c4', 'niche-discord-model-switch-superbot-3b7e91c4/', 'catch me up on #general and reply to my mentions: Gemini, ElevenLabs Scribe, Opus 5.5, then superbot posts the replies in Discord (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads #general, ElevenLabs Scribe transcribes the voice notes, Claude Opus 5.5 writes the catch-up and the replies, then superbot posts them in Discord.' }],
  // draft replies to every comment on my last post and show me before sending (2026-10-03): one superbot chat switches Grok (reads the comments), Gemini (learns your voice from your past replies) and Claude Opus 5.5 (drafts a reply to each comment), then superbot opens your post on X so you approve each draft before it posts.
  ['niche-x-model-switch-superbot-5e94b3a8', 'niche-x-model-switch-superbot-5e94b3a8/', 'Draft replies to every comment on my last post and show me before sending: Grok, Gemini, Opus 5.5, then superbot posts the approved replies on X (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Grok reads the comments, Gemini learns your voice from your past replies, Claude Opus 5.5 drafts a reply to each comment, then superbot opens your post on X so you approve each draft with one tap before it posts.' }],
  // Start a subreddit for my sourdough club (2026-10-03): Reddit remake of bikeride-model-switch. One superbot chat switches Gemini (reads bread communities, picks rules and flair), GPT Image 2.5 (banner and icon from the club photo) and Claude Opus 5.5 (automod.yaml, rules, welcome post), then connects to Reddit and builds r/NorthsideSourdough; AutoModerator greets the first member post.
  ['niche-reddit-model-switch-superbot-c61f0e27', 'niche-reddit-model-switch-superbot-c61f0e27/', 'Start a subreddit for my sourdough club with rules, flair and AutoMod: Gemini, GPT Image 2.5, Opus 5.5, then superbot builds it in Reddit (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads what bread communities post and picks the rules and flair, GPT Image 2.5 turns the club photo into the banner and icon, Claude Opus 5.5 writes the AutoModerator rules and the welcome post, then superbot connects to Reddit and builds r/NorthsideSourdough. The first member post gets AutoMod\'s recipe reminder.' }],
  // Email 40 Austin cafes a personal pitch for our cold brew and book tastings (2026-10-03): Gmail remake of bikeride-model-switch. One superbot chat switches Gemini (researches 212 Austin cafe sites, shortlists the ones with a reason to write), GPT-6 Astra (reads their menu photos for who already pours cold brew) and Claude Opus 5.5 (writes 40 personal emails), then superbot sends them from Gmail and books the first tasting.
  ['niche-email-model-switch-superbot-a07d6c19', 'niche-email-model-switch-superbot-a07d6c19/', 'Email 40 Austin cafes a personal pitch for our cold brew and book tastings: Gemini, GPT-6 Astra, Opus 5.5, then superbot sends from Gmail and books the first tasting (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini researches 212 Austin cafe sites, GPT-6 Astra reads their menu photos, Claude Opus 5.5 writes 40 personal emails, then superbot sends them from Gmail and books the first tasting.' }],
  // clean this sales CSV and build me a revenue dashboard (2026-10-03): one superbot chat switches Gemini (reads the CSV), Claude Opus 5.5 (writes and runs the pandas cleaning), DuckDB (rolls revenue up by month and region), then superbot connects to Google Sheets and writes the clean tab and the dashboard.
  ['niche-data-model-switch-superbot-f2c8e563', 'niche-data-model-switch-superbot-f2c8e563/', 'Clean this sales CSV and build me a revenue dashboard: Gemini, Opus 5.5, DuckDB, then superbot builds it in Google Sheets (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads the messy CSV, Claude Opus 5.5 writes and runs the cleaning script, DuckDB rolls revenue up by month and region, then superbot connects to Google Sheets: duplicates removed, dates and currencies fixed, and a revenue dashboard tab with charts by month and region.' }],
  // turn my podcast into a TikTok and post it tonight at 7 (2026-10-03): one superbot chat switches Gemini (watches the 52 minute episode and finds the best moment), Claude Opus 5.5 (cuts a 45 s vertical clip with captions and writes the hook), GPT Image 2.5 (makes the cover), then superbot connects to TikTok, schedules it for 7:00 PM and the post goes live.
  ['niche-tiktok-model-switch-superbot-fe641576', 'niche-tiktok-model-switch-superbot-fe641576/', 'Turn my podcast into a TikTok and post it tonight at 7: Gemini, Opus 5.5, GPT Image 2.5, then superbot posts it on TikTok (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini watches the whole episode and finds the best moment, Claude Opus 5.5 cuts a 45 second vertical clip with captions and writes the hook, GPT Image 2.5 makes the cover, then superbot connects to TikTok Studio, schedules it for 7:00 PM and the post goes live with likes and comments rolling in.' }],
  // Reply to all my DMs from brands and schedule this week's posts (2026-10-03): Instagram remake of bikeride-model-switch. One superbot chat switches Gemini (reads 64 DMs, finds 5 brand offers), Claude Opus 5.5 (writes 5 replies in the creator's voice) and GPT-6 Astra (picks and captions 7 posts from the camera roll), then superbot sends the replies in Instagram and fills the week in Planner.
  ['niche-instagram-model-switch-superbot-8ae18b85', 'niche-instagram-model-switch-superbot-8ae18b85/', 'Reply to all my DMs from brands and schedule this week\'s posts: Gemini, Opus 5.5, GPT-6 Astra, then superbot replies in Instagram and fills the week (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 64 Instagram DMs and finds 5 brand offers, Claude Opus 5.5 writes 5 replies in the creator\'s voice, GPT-6 Astra picks and captions 7 posts from the camera roll, then superbot sends the replies in Instagram and fills the week in Planner.' }],
  // make 3 thumbnails for my Iceland vlog and A/B test them (2026-10-03): one superbot chat switches Gemini (watches the vlog, picks three frames), Claude Opus 5.5 (writes three thumbnail concepts) and Nano Banana Pro (renders them), then superbot connects to YouTube Studio and runs an A/B test.
  ['niche-thumbnail-model-switch-superbot-94b1d7ea', 'niche-thumbnail-model-switch-superbot-94b1d7ea/', 'Make 3 thumbnails for my Iceland vlog and A/B test them: Gemini, Opus 5.5, Nano Banana Pro, then superbot runs the A/B test in YouTube Studio (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini watches the 18:42 vlog and picks three frames, Claude Opus 5.5 writes three thumbnail concepts, Nano Banana Pro renders them at 1280 x 720, then superbot connects to YouTube Studio and runs the A/B test until a winner is shown to all viewers.' }],
  // Answer the top comments on my latest video and pin the best one (2026-10-03): YouTube Studio remake of bikeride-model-switch. One superbot chat switches Gemini (watches the latest video and ranks its 1,284 comments), GPT-6 Astra (reads the frame a viewer asked about) and Claude Opus 5.5 (writes the replies in the creator's voice), then superbot posts them in YouTube Studio and pins the best one.
  ['niche-youtube-model-switch-superbot-3828921d', 'niche-youtube-model-switch-superbot-3828921d/', 'Answer the top comments on my latest video and pin the best one: Gemini, GPT-6 Astra, Opus 5.5, then superbot replies and pins in YouTube Studio (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini watches the latest video and ranks its 1,284 comments, GPT-6 Astra reads the frame a viewer asked about, Claude Opus 5.5 writes the replies in the creator\'s voice, then superbot posts them in YouTube Studio and pins the best one.' }],
  // apply to real jobs that fit my resume, skip the fake listings (2026-10-03): one superbot chat switches Gemini (reads 412 LinkedIn job posts, 21 fit), Perplexity (checks each against careers pages and news, drops 9 ghost listings), Claude Opus 5.5 (tailors the resume and writes a note to each hiring manager), then superbot connects to LinkedIn, applies to the 12 real roles with Easy Apply and the hiring manager replies.
  ['niche-linkedin-model-switch-superbot-05fd7f45', 'niche-linkedin-model-switch-superbot-05fd7f45/', 'Apply to real jobs that fit my resume, skip the fake listings: Gemini, Perplexity, Opus 5.5, then superbot applies on LinkedIn (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 412 LinkedIn job posts and finds 21 that fit the resume, Perplexity checks each one against the company careers page and the news and drops 9 ghost listings, Claude Opus 5.5 tailors the resume and writes a note to each hiring manager, then superbot connects to LinkedIn, applies to the 12 real roles with Easy Apply, and the hiring manager writes back to set up a call.' }],
  // Summarize every channel I missed while I was on vacation and draft my replies (2026-10-03): Slack remake of bikeride-model-switch. One superbot chat switches Gemini (reads 3,412 messages across 14 channels), ElevenLabs Scribe (transcribes the huddles you missed) and Claude Opus 5.5 (writes a per-channel catch-up and drafts your replies), then superbot connects to Slack and leaves 5 drafts waiting for one tap to send.
  ['niche-slack-model-switch-superbot-9156b108', 'niche-slack-model-switch-superbot-9156b108/', 'Summarize every channel I missed while I was on vacation and draft my replies: Gemini, ElevenLabs Scribe, Opus 5.5, then superbot catches you up in Slack (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 3,412 messages across 14 channels, ElevenLabs Scribe transcribes the huddles you missed, Claude Opus 5.5 writes a per-channel catch-up and drafts your replies, then superbot connects to Slack and leaves 5 drafts waiting for one tap to send.' }],
  // Set up a bot that answers the FAQs in my Telegram group (2026-10-03): Telegram remake of bikeride-model-switch. One superbot chat switches Gemini (reads 18,240 messages from the group's chat export and ranks the top questions), Claude Opus 5.5 (writes a grammY bot, tested on 40 past questions) and Cloudflare Workers (deploys it, webhook set), then superbot adds the bot to the group as an admin and it answers a new member in under a second.
  ['niche-telegram-model-switch-superbot-335da6e1', 'niche-telegram-model-switch-superbot-335da6e1/', 'Set up a bot that answers the FAQs in my Telegram group: Gemini, Opus 5.5, Cloudflare Workers, then superbot adds the bot to your Telegram group (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 18,240 messages from the group and ranks the questions members ask most, Claude Opus 5.5 writes the bot and tests it on 40 past questions, Cloudflare Workers keeps it online 24/7, then superbot adds it to the Telegram group as an admin and it answers a new member in under a second.' }],
  // Build me a landing page for my bakery and put it live (2026-10-03): web development remake of bikeride-model-switch. One superbot chat switches Gemini (plans the one-page site and writes its copy), Claude Opus 5.5 (writes app/page.tsx in Next.js and Tailwind, the build passes) and GitHub (pushes the repo maple-street-bakery), then superbot connects to Vercel, the deployment goes Ready and the live bakery site opens on maple-street-bakery.vercel.app.
  ['niche-webdev-model-switch-superbot-2b7aa677', 'niche-webdev-model-switch-superbot-2b7aa677/', 'Build me a landing page for my bakery and put it live: Gemini, Opus 5.5, GitHub, then superbot deploys it live on Vercel (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini plans the bakery\'s one-page site and writes the copy, Claude Opus 5.5 builds it in Next.js and Tailwind, superbot pushes the repo to GitHub, then deploys it on Vercel: Building to Ready, then the live Maple Street Bakery site.' }],
  // Reply to every customer on WhatsApp and send the weekend sale to my regulars (2026-10-03): Gemini sorts the WhatsApp inbox, ElevenLabs Scribe transcribes voice notes, GPT-6 Astra prices repair photos, Opus 5.5 writes replies + weekend sale, then WhatsApp Business connect, chat list + broadcast result.
  ['niche-whatsapp-model-switch-superbot-e9ba5a59', 'niche-whatsapp-model-switch-superbot-e9ba5a59/', 'Reply to every customer on WhatsApp and send the weekend sale to my regulars: Gemini, ElevenLabs Scribe, GPT-6 Astra, Opus 5.5, then superbot replies in WhatsApp and sends the sale (5 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini sorts 38 WhatsApp chats, ElevenLabs Scribe transcribes the voice notes in Spanish, Portuguese and English, GPT-6 Astra prices the repairs in 4 customer photos, Claude Opus 5.5 writes a reply in each customer\'s language and the weekend sale, and superbot sends it all from the shop\'s own WhatsApp Business number.' }],
  // Fix the random logouts in issue #482 and ship it (2026-10-03): GitHub remake of bikeride-model-switch. One superbot chat switches Gemini (reads the repo, the issue thread and CI to find the root cause), Claude Opus 5.5 (writes the fix and a Remember me test) and GPT-6 Astra (runs all 214 tests and reviews the diff), then superbot connects to GitHub, opens PR #483 and merges it once all four checks pass.
  ['niche-github-model-switch-superbot-0cb69286', 'niche-github-model-switch-superbot-0cb69286/', 'Fix the random logouts in issue #482 and ship it: Gemini, Opus 5.5, GPT-6 Astra, then superbot opens and merges the PR on GitHub (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads the repo, the issue thread and CI to find the root cause, Claude Opus 5.5 writes the fix and a Remember me test, GPT-6 Astra runs all 214 tests and reviews the diff, then superbot connects to GitHub, opens PR #483 and merges it once all four checks pass.' }],
  // Rewrite all my product descriptions and flag the ones missing photos (2026-10-03): Shopify remake of bikeride-model-switch. One superbot chat switches Gemini (reads all 48 products and every photo), Claude Opus 5.5 (rewrites each description in the store's voice) and GPT-6 Astra (checks every rewrite against the product specs), then superbot connects to Shopify, updates all 48 descriptions and flags the 5 products missing photos in a Missing photos view.
  ['niche-shopify-model-switch-superbot-a3b73360', 'niche-shopify-model-switch-superbot-a3b73360/', 'Rewrite all my product descriptions and flag the ones missing photos: Gemini, Opus 5.5, GPT-6 Astra, then superbot updates your Shopify store (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads all 48 products and every photo, Claude Opus 5.5 rewrites each description in the store\'s voice, GPT-6 Astra checks every rewrite against the product specs, then superbot connects to Shopify: all 48 descriptions updated and the 5 products missing photos flagged in a Missing photos view.' }],
  // Build my habit tracker app and get it on TestFlight (2026-10-03): mobile app development remake of bikeride-model-switch. One superbot chat switches Gemini (reads 3,412 App Store reviews of the top 10 habit trackers and ranks what reviewers ask for), Claude Opus 5.5 (writes the Steadyloop app in Expo, 14 of 14 tests passed in the iOS Simulator) and Expo (EAS Build makes the iOS build and sends it to App Store Connect), then superbot connects to App Store Connect, invites 4 testers and the app opens on an iPhone from the TestFlight banner.
  ['niche-appdev-model-switch-superbot-7ec80219', 'niche-appdev-model-switch-superbot-7ec80219/', 'Build my habit tracker app and get it on TestFlight: Gemini, Opus 5.5, Expo, then superbot ships the build to TestFlight in App Store Connect (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 3,412 App Store reviews and ranks what people ask for, Claude Opus 5.5 writes the app in Expo and passes 14 of 14 tests in the iOS Simulator, Expo builds it for iOS, then superbot connects to App Store Connect: build 1.0 (1) is in TestFlight, 4 testers are invited, and the app opens on an iPhone.' }],
  // Clear the weekend ticket backlog in Zendesk (2026-10-03): customer support remake of bikeride-model-switch. One superbot chat switches Gemini (reads 212 unassigned tickets and the help center, sorts them into 4 groups), Claude Opus 5.5 (drafts 209 replies from the help center articles) and GPT-6 Astra (checks every draft against the ticket and the policy, holds 3 double charges for a human), then superbot connects to Zendesk, sends the replies and clears the unassigned queue to 0.
  ['niche-support-model-switch-superbot-6e224be4', 'niche-support-model-switch-superbot-6e224be4/', 'Clear the weekend ticket backlog in Zendesk: Gemini, Opus 5.5, GPT-6 Astra, then superbot answers and solves 209 tickets in Zendesk (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads 212 unassigned tickets and the help center and sorts them into 4 groups, Claude Opus 5.5 drafts 209 replies from the help center articles, GPT-6 Astra checks every draft against the ticket and the policy and holds 3 double charges for a human, then superbot connects to Zendesk, sends the replies and clears the unassigned queue to 0.' }],
  // Fix my suppressed listings and win back the Buy Box (2026-10-03): Amazon sellers remake of bikeride-model-switch. One superbot chat switches Gemini (reads all 64 Copperline Kitchen listings and 1,280 competing offers), Claude Opus 5.5 (rewrites the 6 suppressed titles to Amazon's title rules) and GPT-6 Astra (checks every title and price against the floor and FBA fees), then superbot connects to Amazon Seller Central: 6 listings active again and the Buy Box back on 4.
  ['niche-amazon-model-switch-superbot-37d4e2c2', 'niche-amazon-model-switch-superbot-37d4e2c2/', 'Fix my suppressed listings and win back the Buy Box: Gemini, Opus 5.5, GPT-6 Astra, then superbot updates your Amazon Seller Central (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads all 64 listings and 1,280 competing offers, Claude Opus 5.5 rewrites the 6 suppressed titles to Amazon\'s title rules, GPT-6 Astra checks every title and price against your floor and FBA fees, then superbot connects to Amazon Seller Central: 6 listings active again and the Buy Box back on 4.' }],
  // Find 3-bedroom homes under $500k near good schools and book viewings (2026-10-03): home buying remake of bikeride-model-switch. One superbot chat switches Gemini (searches 214 homes for sale around Westerville, OH), GreatSchools (rates each home's assigned schools: 11 near schools rated 8+), GPT-6 Astra (reads the listing photos: 3 flagged, 8 pass) and Claude Opus 5.5 (ranks the 8, picks the top 3 and finds free time), then superbot connects to Zillow, requests the 3 tours on a map of matches with school ratings and the viewings land on the calendar.
  ['niche-realestate-model-switch-superbot-addab19b', 'niche-realestate-model-switch-superbot-addab19b/', 'Find 3-bedroom homes under $500k near good schools and book viewings: Gemini, GreatSchools, GPT-6 Astra, Opus 5.5, then superbot books the viewings on Zillow (5 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini searches 214 homes for sale, GreatSchools rates the schools near each one, GPT-6 Astra reads the listing photos, Claude Opus 5.5 picks the best three and finds free time, then superbot books the viewings on Zillow: a map of 8 matches with school ratings and 3 viewings on your calendar.' }],
  // Answer every buyer message and update my shipping times for the holidays (2026-10-03): Etsy sellers remake of bikeride-model-switch. One superbot chat switches Gemini (reads 23 buyer conversations and 31 open orders in WrenAndOakStudio), Claude Opus 5.5 (writes a reply to every buyer in the shop's voice) and GPT-6 Astra (sets holiday processing times and order-by dates on all 48 listings), then superbot connects to Etsy: every message answered and every listing ready for Dec 24.
  ['niche-etsy-model-switch-superbot-b01f62c6', 'niche-etsy-model-switch-superbot-b01f62c6/', 'Answer every buyer message and update my shipping times for the holidays: Gemini, Opus 5.5, GPT-6 Astra, then superbot updates your Etsy shop (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 23 buyer conversations and 31 open orders, Claude Opus 5.5 writes a reply to every buyer in the shop\'s voice, GPT-6 Astra sets holiday processing times and order-by dates on all 48 listings, then superbot connects to Etsy: every message answered and every listing ready for Dec 24.' }],
  // Build me a 12-week half marathon plan and sync it to my Strava (2026-10-03): running and fitness remake of bikeride-model-switch. One superbot chat switches Gemini (reads 36 half marathon plans and ranks what the best ones agree on), Claude Opus 5.5 (writes the 12-week plan in TypeScript) and GPT-6 Astra (checks the plan), then superbot connects to Strava and all 48 workouts sync to the training calendar.
  ['niche-fitness-model-switch-superbot-a832b003', 'niche-fitness-model-switch-superbot-a832b003/', 'Build me a 12-week half marathon plan and sync it to my Strava: Gemini, Opus 5.5, GPT-6 Astra, then superbot syncs all 48 workouts to Strava (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads 36 half marathon plans, Claude Opus 5.5 writes a 12-week plan in TypeScript, GPT-6 Astra checks it, and superbot connects to Strava, where all 48 workouts sync to the training calendar.' }],
  // Plan a relaxed 5-day Lisbon trip in May under $2,000 and book it (2026-10-03): travel remake of bikeride-model-switch. One superbot chat switches Gemini (compares 312 flights and 86 stays), Claude Opus 5.5 (plans five relaxed days, no more than 3 stops a day) and GPT-6 Astra (checks every fare, opening hour and the budget), then superbot connects to Expedia and books the flights, the stay (Pateo das Laranjeiras) and two activities: $1,657 of a $2,000 budget.
  ['niche-travel-model-switch-superbot-4808b6b8', 'niche-travel-model-switch-superbot-4808b6b8/', 'Plan a relaxed 5-day Lisbon trip in May under $2,000 and book it: Gemini, Opus 5.5, GPT-6 Astra, then superbot books it on Expedia (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini compares 312 flights and 86 stays, Claude Opus 5.5 plans five relaxed days with no more than 3 stops a day, GPT-6 Astra checks every fare, opening hour and the budget, then superbot connects to Expedia and books the flights, the stay and two activities: $1,657 of a $2,000 budget.' }],
  // Book my 6 client calls next week and fix the double bookings (2026-10-03): calendar scheduling remake of bikeride-model-switch. One superbot chat switches Gemini (reads 214 emails and next week's calendar, finds 6 call requests and 2 double bookings), GPT-6 Astra (fits all 6 calls inside each client's 9 to 5 across 5 time zones) and Claude Opus 5.5 (writes every invite with the time in the client's zone), then superbot connects to Google Calendar: 6 calls booked, 2 meetings moved, no overlaps.
  ['niche-calendar-model-switch-superbot-5cd6e70f', 'niche-calendar-model-switch-superbot-5cd6e70f/', 'Book my 6 client calls next week and fix the double bookings: Gemini, GPT-6 Astra, Opus 5.5, then superbot updates your Google Calendar (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 214 emails and next week\'s calendar and finds 6 call requests and 2 double bookings, GPT-6 Astra fits all 6 calls inside each client\'s 9 to 5 across 5 time zones, Claude Opus 5.5 writes every invite with the time in the client\'s zone, then superbot connects to Google Calendar: 6 calls booked, 2 meetings moved, no overlaps.' }],
  // Turn my messy meeting notes into a project tracker with owners and due dates (2026-10-03): Notion productivity remake of bikeride-model-switch. One superbot chat switches Gemini (reads 3 meetings of messy notes, finds 12 action items), Claude Opus 5.5 (writes each one as a task with one owner, turns vague dates into real ones) and GPT-6 Astra (checks every task has an owner and a workday due date), then superbot connects to Notion and builds the Launch tracker board with all 12 tasks assigned.
  ['niche-notion-model-switch-superbot-04836275', 'niche-notion-model-switch-superbot-04836275/', 'Turn my messy meeting notes into a project tracker with owners and due dates: Gemini, Opus 5.5, GPT-6 Astra, then superbot builds the tracker in Notion (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads 3 meetings of messy notes and finds 12 action items, Claude Opus 5.5 writes each one as a task with one owner and turns vague dates into real ones, GPT-6 Astra checks every task has an owner and a workday due date, then superbot connects to Notion and builds the Launch tracker board with all 12 tasks assigned.' }],
  // Edit my raw interview into episode 42 and publish it on Spotify (2026-10-03): podcast remake of bikeride-model-switch. One superbot chat switches Gemini (listens to a 74-minute raw interview, cuts 17:36), Claude Opus 5.5 (writes the title, show notes and 7 chapters) and GPT-6 Astra (checks every chapter, level and name), then superbot connects to Spotify for Creators and publishes episode 42 of Kiln and Counter: 56:32, live on Spotify.
  ['niche-podcast-model-switch-superbot-b26eacf4', 'niche-podcast-model-switch-superbot-b26eacf4/', 'Edit my raw interview into episode 42 and publish it on Spotify: Gemini, Opus 5.5, GPT-6 Astra, then superbot publishes it on Spotify for Creators (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini listens to a 74-minute raw interview and cuts 17:36, Claude Opus 5.5 writes the title, show notes and 7 chapters, GPT-6 Astra checks every chapter, level and name, then superbot connects to Spotify for Creators and publishes episode 42: 56:32, live on Spotify.' }],
  // Cut my 2-hour stream into 5 vertical clips with captions (2026-10-03): video editing remake of bikeride-model-switch. One superbot chat switches Gemini (watches all 2:03:41 of the stream and finds 23 moments where chat went wild), ElevenLabs Scribe (transcribes 18,400 words with word-level timestamps), Claude Opus 5.5 (picks the best 5, trims each under a minute with a hook in the first 2 seconds, writes the captions) and SAM 3 (tracks the streamer and reframes 16:9 to 9:16), then superbot connects to DaVinci Resolve and exports the 5 captioned vertical clips, ready to post.
  ['niche-videoedit-model-switch-superbot-55e22579', 'niche-videoedit-model-switch-superbot-55e22579/', 'Cut my 2-hour stream into 5 vertical clips with captions: Gemini, ElevenLabs Scribe, Opus 5.5, SAM 3, then superbot exports them in DaVinci Resolve (5 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini watches the 2-hour stream and finds 23 moments where chat went wild, ElevenLabs Scribe transcribes every word with timestamps, Claude Opus 5.5 picks the best 5 and writes the captions, SAM 3 reframes them to 9:16, then superbot connects to DaVinci Resolve and exports 5 captioned vertical clips ready to post.' }],
  // Write and publish 4 blog posts that target my top search keywords (2026-10-03): SEO and blogging remake of bikeride-model-switch. One superbot chat connects to Search Console (pulls the blog's top queries, 4 rank on page 2 with no post), switches Claude Opus 5.5 (writes the 4 posts, titles, meta descriptions and FAQ schema) and Nano Banana Pro (makes the 4 featured images), then superbot publishes all 4 on WordPress and the Search Console tab shows impressions climbing.
  ['niche-seo-model-switch-superbot-94f70a8d', 'niche-seo-model-switch-superbot-94f70a8d/', 'Write and publish 4 blog posts that target my top search keywords: Search Console, Opus 5.5, Nano Banana Pro, then superbot publishes them on WordPress (4 switches)', 'Ad spots',
    { desc: "One ask in superbot: superbot pulls the blog's top queries from Search Console, Claude Opus 5.5 writes 4 posts aimed at them, Nano Banana Pro makes the featured images, then superbot publishes all 4 on WordPress and search impressions climb." }],
  // Plan next week's streams around when my viewers show up and put them on my Twitch schedule (2026-10-03): Twitch streaming remake of bikeride-model-switch. One superbot chat switches Gemini (reads 14 past broadcasts, 61 hours, finds the 5 best time slots), Claude Opus 5.5 (writes 5 streams, each with a title and a category) and GPT-6 Astra (checks every slot, title and category), then superbot connects to Twitch and fills next week's stream schedule.
  ['niche-twitch-model-switch-superbot-936ae421', 'niche-twitch-model-switch-superbot-936ae421/', 'Plan next week\'s streams around when my viewers show up and put them on my Twitch schedule: Gemini, Opus 5.5, GPT-6 Astra, then superbot fills your Twitch schedule (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads 14 past broadcasts and finds the 5 best time slots, Claude Opus 5.5 writes 5 streams with a title and a category each, GPT-6 Astra checks every slot, title and category, then superbot connects to Twitch and fills next week\'s schedule, with Mon and Wed kept free.' }],
  // Turn my 6 workshop recordings into a course and launch it on Teachable (2026-10-03): online course creators remake of bikeride-model-switch. One superbot chat switches Gemini (watches 6 sourdough workshops, 5:48:20, and finds 24 lessons), Claude Opus 5.5 (writes the curriculum and 4 quizzes) and GPT-6 Astra (checks every lesson and answer), then superbot connects to Teachable and publishes Sourdough from Scratch for Crumb and Crust School: 24 lessons, $149, live.
  ['niche-courses-model-switch-superbot-9deaa5f6', 'niche-courses-model-switch-superbot-9deaa5f6/', 'Turn my 6 workshop recordings into a course and launch it on Teachable: Gemini, Opus 5.5, GPT-6 Astra, then superbot launches it on Teachable (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini watches 6 sourdough workshops (5:48:20) and finds 24 lessons, Claude Opus 5.5 writes the curriculum and 4 quizzes, GPT-6 Astra checks every lesson and answer, then superbot connects to Teachable and publishes Sourdough from Scratch: 24 lessons, $149, live.' }],
  // Mix and master my beat so it's ready for Spotify (2026-10-03): music producers remake of bikeride-model-switch. One superbot chat switches Gemini (listens to all 24 tracks and the reference: 3:12, 92 BPM, F minor, 4 problems), SAM Audio (pulls the air conditioner hum and headphone bleed out of the vocal chop), Claude Opus 5.5 (writes the mix as 38 moves for the Live set) and GPT-6 Astra (masters it against the reference to -14 LUFS, -1.0 dBTP), then superbot connects to Ableton Live, lands the moves and the Main chain, and bounces after hours (master).wav, ready for Spotify.
  ['niche-music-model-switch-superbot-fed85549', 'niche-music-model-switch-superbot-fed85549/', 'Mix and master my beat so it\'s ready for Spotify: Gemini, SAM Audio, Opus 5.5, GPT-6 Astra, then superbot mixes and bounces it in Ableton Live (5 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini listens to all 24 tracks and finds 4 problems, SAM Audio pulls the hum and headphone bleed out of the vocal chop, Claude Opus 5.5 writes the mix as 38 moves, GPT-6 Astra masters it to -14 LUFS against the reference, then superbot connects to Ableton Live and bounces the master, ready for Spotify.' }],
  // Turn my saved links into Sunday's issue and draft it in beehiiv (2026-10-03): newsletter writers remake of bikeride-model-switch. One superbot chat switches Gemini (reads 23 saved links and the last 12 issues of Gravel Letter and keeps the 5 best stories), GPT-6 Astra (picks the cover photo and writes its alt text) and Claude Opus 5.5 (writes issue 87 in the writer's voice, 1,140 words), then superbot connects to beehiiv through the official beehiiv MCP and drafts it, ready to schedule for Sunday 7:00 AM.
  ['niche-newsletter-model-switch-superbot-80d86619', 'niche-newsletter-model-switch-superbot-80d86619/', 'Turn my saved links into Sunday\'s issue and draft it in beehiiv: Gemini, GPT-6 Astra, Opus 5.5, then superbot drafts it in beehiiv (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 23 saved links and the last 12 issues and keeps the 5 best stories, GPT-6 Astra picks the cover photo and writes its alt text, Claude Opus 5.5 writes issue 87 in the writer\'s voice, then superbot connects to beehiiv and drafts it, ready to schedule for Sunday 7:00 AM.' }],
  // Cull my Hale wedding, edit the keepers and send the gallery (2026-10-03): photography remake of bikeride-model-switch. One superbot chat switches Gemini (culls 3,412 wedding photos to 624 keepers), Claude Opus 5.5 (plans the gallery in four sets) and Nano Banana Pro (edits every keeper to one look), then superbot connects to Pixieset, uploads the sets and sends the couple their gallery.
  ['niche-photo-model-switch-superbot-eea931bf', 'niche-photo-model-switch-superbot-eea931bf/', 'Cull my Hale wedding, edit the keepers and send the gallery: Gemini, Opus 5.5, Nano Banana Pro, then superbot delivers it in Pixieset (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini culls 3,412 wedding photos to 624 keepers, Claude Opus 5.5 plans the gallery in four sets, Nano Banana Pro edits every keeper to one look, then superbot connects to Pixieset, uploads the sets and sends the couple their gallery.' }],
  // Make 3 launch designs from this brief and put them in Canva (2026-10-03): graphic designers remake of bikeride-model-switch. One superbot chat switches Gemini (reads the 12-page Copperleaf Coffee brand brief, pulls 3 colours, 2 fonts and 3 sizes), Claude Opus 5.5 (writes launch_set.md, three layouts in the brand's voice) and Nano Banana Pro (renders the Instagram post, story and poster), then superbot connects to Canva and files all three in the Autumn Blend launch folder.
  ['niche-canva-model-switch-superbot-2486ff8d', 'niche-canva-model-switch-superbot-2486ff8d/', 'Make 3 launch designs from this brief and put them in Canva: Gemini, Opus 5.5, Nano Banana Pro, then superbot files them in Canva (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads the 12-page brand brief and pulls the colours, fonts and sizes, Claude Opus 5.5 writes three layouts in the brand\'s voice, Nano Banana Pro renders the post, story and poster, then superbot connects to Canva and files all three in the launch folder.' }],
  // Fix the jump bug players keep reporting and ship it to itch.io (2026-10-03): indie gamedev remake of bikeride-model-switch. One superbot chat switches Gemini (reads 312 player reports for Pocket Summit and finds why jumps get dropped), Claude Opus 5.5 (adds a jump buffer, coyote time and a landing test) and GPT-6 Astra (runs the tests and 500 bot playtests), then superbot connects to itch.io, pushes the Web build with butler and the patched game runs in the browser.
  ['niche-gamedev-model-switch-superbot-01d0971d', 'niche-gamedev-model-switch-superbot-01d0971d/', 'Fix the jump bug players keep reporting and ship it to itch.io: Gemini, Opus 5.5, GPT-6 Astra, then superbot ships the patch on itch.io (4 switches)', 'Ad spots',
    { desc: 'One ask in superbot: Gemini reads 312 player reports to find why jumps get dropped, Claude Opus 5.5 adds a jump buffer, coyote time and a landing test, GPT-6 Astra runs the tests and 500 bot playtests, then superbot connects to itch.io, pushes the Web build with butler and the patched game runs in the browser.' }],
  // Turn my 40 saved articles on sleep into linked notes in my Obsidian vault (2026-10-03): Obsidian note-takers remake of bikeride-model-switch. One superbot chat switches Gemini (reads 40 saved articles on sleep, 186,420 words, and pulls 46 ideas), Claude Opus 5.5 (writes 46 linked notes with 212 links and 58 quotes) and GPT-6 Astra (checks every note against its article), then superbot opens the Obsidian vault, adds the notes, links them to 31 of the 1,284 existing notes and builds a Sleep and Memory map.
  ['niche-obsidian-model-switch-superbot-d1018d78', 'niche-obsidian-model-switch-superbot-d1018d78/', 'Turn my 40 saved articles on sleep into linked notes in my Obsidian vault: Gemini, Opus 5.5, GPT-6 Astra, then superbot writes them into the vault (4 switches)', 'Ad spots',
    { desc: 'One prompt in superbot: Gemini reads 40 saved articles on sleep and pulls 46 ideas, Claude Opus 5.5 writes 46 linked notes, GPT-6 Astra checks every note against its article, then superbot opens the Obsidian vault, adds the notes, links them to 31 existing notes and builds a Sleep and Memory map.' }],
  ['pdoom-mv-every-model-v3-superbot-abba733b', 'pdoom-mv-every-model-superbot-abba733b/', 'make a k-pop music video about p(doom): Lyria, ElevenLabs, Gemini, Opus 5.5, DeepSeek, GitHub, then the real Opus 5.5 M/V plays (7 requests; clip @donaldjewkes)', 'Ad spots',
    { desc: "Ends on the 0:19 to 0:29 hook of the M/V 'Upping My P(doom)' by Donald Jewkes (@donaldjewkes), made with one prompt in Claude Opus 5.5." }],
  // Japan bikeride, every model (2026-09-28): "Make me relaxing Japan bikeride" typed into the hub, 14 model switch
  // pills burst past, and the Veo 3 reply card lands before 4 s and opens full frame on @prasenx's bike ride clip,
  // then a black superbot end card (animations/japan-bikeride-every-model-superbot-ad3eb59d/img/CREDITS.txt, brand/CREDITS.txt).
  ['japan-bikeride-every-model-superbot-ad3eb59d', 'japan-bikeride-every-model-superbot-ad3eb59d/', 'Japan bikeride, every model', 'Ad spots',
    { desc: 'One prompt, fourteen model switches, a relaxing Japan bike ride back in under four seconds.' }],
  // MAKE ME RELAXING JAPAN BIKERIDE (2026-09-28): clip X @prasenx https://x.com/prasenx/status/2102717687604633959; logos animations/japan-bikeride-every-model-superbot-fec00f6a/brand/CREDITS.txt.
  ['japan-bikeride-every-model-superbot-fec00f6a', 'japan-bikeride-every-model-superbot-fec00f6a/', 'MAKE ME RELAXING JAPAN BIKERIDE: one prompt, 16 model switches, the ride on screen at 3.3 s, superbot end card (clip @prasenx)', 'Ad spots'],
  // make a Splatoon-style ink game (2026-09-26): one ask routed to seven models on one page (v3, the default cut):
  // Lyria scores the match, Meshy models the props, Gemini draws the ink decals, DeepSeek scrapes CC0 prop
  // libraries, GitHub pushes Inkwave, Opus 5.5 codes the game and plays it.
  ['inkwave-every-model-superbot-3f9d27b4', 'inkwave-every-model-superbot-3f9d27b4/', 'make a Splatoon game: Lyria track, Meshy props, Gemini ink decals, Opus 5.5 codes Inkwave, DeepSeek scrapes props, GitHub (7 requests)', 'Ad spots'],
  // make a Splatoon game (2026-09-26): seven requests in one thread, ending on the Inkwave launch. The closing clip
  // is @JaydenDavisNC's Opus 5.5 Splatoon capture (game: Inkwave) — https://x.com/JaydenDavisNC/status/2103357848961036304
  ['splatoon-every-model-v3-superbot-3081f5d2', 'splatoon-every-model-superbot-3081f5d2/?v=3', 'Superbot: make a Splatoon game, every model: Lyria 2 scores it, Meshy builds the meshes, Gemini paints the arena, Opus 5.5 codes the ink sim, DeepSeek V4 Flash scrapes decals, GitHub takes the repo, Opus 5.5 launches Inkwave; ends on @JaydenDavisNC’s Opus 5.5 Splatoon clip (7 requests)', 'Ad spots'],
  // make a Mario Kart game (2026-09-27): the splatoon 3081f5d2 routing rethemed to a kart racer, each model switch an
  // item-box roll; ends on @bridgemindai's Opus 5.5 Mario Kart clip (game: Turbo Kart Rally, Palm Cove Circuit).
  ['mariokart-every-model-v3-superbot-7aec3197', 'mariokart-every-model-superbot-7aec3197/?v=3', 'Superbot: make a Mario Kart game, every model: Lyria 2 scores it, Meshy builds the karts, Gemini paints the roster, Opus 5.5 codes the drift physics, DeepSeek V4 Flash scrapes trackside boards, GitHub takes the repo, Opus 5.5 launches Turbo Kart Rally; each switch is an item-box roll; ends on @bridgemindai’s Opus 5.5 Mario Kart clip (7 requests)', 'Ad spots'],
  // make a Mario Kart game, one prompt, every model (2026-09-27): opens on @bridgemindai's real ONE SHOT post, VHS-rewinds
  // its clip to the title screen, then Opus 5.5 plans the build and routes 8 requests; ends on the post's real clip
  // (game: Turbo Kart Rally; every game frame trimmed from the post video).
  ['mariokart-rewind-every-model-superbot-c30de946', 'mariokart-rewind-every-model-superbot-c30de946/', 'Superbot: make a Mario Kart game, one prompt, every model: opens on @bridgemindai’s ONE SHOT post and VHS-rewinds its clip to the title screen; Opus 5.5 writes the build plan, Gemini paints the 8 racers, Meshy turns the portraits into karts, DeepSeek V4 Flash pulls item sprites and odds, Opus 5.5 wires the game, Lyria 2 scores it, GitHub ships one commit per model, Opus 5.5 launches Turbo Kart Rally; ends on the post’s real clip (8 requests)', 'Ad spots'],
  // THE TEARDOWN, make a kart racer (2026-09-27): the fantasy90s 042670d1 ?v=3 engine rethemed to Turbo Kart Rally. An X
  // cold open flexes real Opus 5.5 one-shot posts, @bridgemindai's Opus 5.5 kart racer (x.com/bridgemindai/status/2102451997395866021, game: Turbo
  // Kart Rally, Palm Cove Circuit) freezes mid-race and its HUD lifts off tagged by the model that built each piece, then
  // one chat builds it and the frozen frame resumes into the real clip (animations/turbokart-xray-every-model-superbot-5c1e9b27/img/tkr/xray.json).
  ['turbokart-xray-every-model-v3-superbot-5c1e9b27', 'turbokart-xray-every-model-superbot-5c1e9b27/?v=3', 'THE TEARDOWN: the X feed flexes Opus 5.5 one-shots, @bridgemindai’s Turbo Kart Rally freezes mid-race, the HUD lifts off tagged by model (wanna know how? it’s not just Opus 5.5.), then one chat builds it: DeepSeek V4 Flash research, Gemini roster, Nano Banana Pro portraits, Lyria 2 + ElevenLabs score, Opus 5.5 code, GPT-5 Codex playtest, GitHub; the frozen frame resumes into the real clip (clip @bridgemindai, 8 requests)', 'Ad spots'],
  // make a video on western civilization (2026-09-27): the mariokart 7aec3197 routing rethemed to Prometheus and the
  // fire, each model switch a fire pass; ends on @IterIntellectus's Claude-made western civilization film
  // (https://x.com/IterIntellectus/status/2103212539895017864; animations/prometheus-every-model-superbot-0a738a62/img/prometheus/assets.json).
  ['prometheus-every-model-v3-superbot-0a738a62', 'prometheus-every-model-superbot-0a738a62/?v=3', 'Superbot: make a video on western civilization, every model: Lyria 2 scores it, Meshy raises the monuments, Gemini paints the plates, Opus 5.5 codes the chapters, DeepSeek V4 Flash sweeps the archive, GitHub takes the repo, Opus 5.5 renders Prometheus II; each switch passes the fire; ends on @IterIntellectus’s Claude-made western civilization film (7 requests)', 'Ad spots'],
  // make a Splatoon game (2026-09-26): the whole ink build in one chat, one model per step. Opus 5.5 writes the
  // brief, DeepSeek V4 Flash scrapes the ink refs, Meshy 5 models the arena, HY-Motion animates the cast,
  // ElevenLabs and Suno score it, Gemini paints the ink, Opus 5.5 codes Inkwave, GitHub ships it, and the last
  // step is real gameplay from @JaydenDavisNC's Opus 5.5 Splatoon capture.
  ['inkwave-every-model-superbot-b7e4c219', 'inkwave-every-model-superbot-b7e4c219/', 'Superbot builds Inkwave: every model, one chat', 'Ad spots'],
  // make a Liquid Glass motion reel (2026-09-26): the splatoon 7cf3d4da routing rethemed to Apple Liquid Glass at 120 BPM,
  // ends on @motion_conquest's Opus 5.5 Liquid Glass clip (animations/liquidglass-every-model-superbot-956467aa/img/CREDITS.txt).
  ['liquidglass-every-model-v3-superbot-956467aa', 'liquidglass-every-model-superbot-956467aa/', 'make a Liquid Glass motion reel: Lyria 2 scores it, Meshy builds the glass primitives, Gemini paints the 8 scenes, Opus 5.5 writes the refraction shader, DeepSeek V4 Flash scrapes glyphs, GitHub takes the repo, Opus 5.5 renders; ends on @motion_conquest Opus 5.5 Liquid Glass clip (7 requests)', 'Ad spots'],
  // build a lens lab that explains camera focus (2026-09-27): the fantasy90s 042670d1 v3 routing rethemed to a lens lab, each switch a focus pull; ends on @RyanSael's Opus 5.5 Lens Lab clip (animations/lenslab-every-model-superbot-afb4ddca/img/CREDITS.txt).
  ['lenslab-every-model-v3-superbot-afb4ddca', 'lenslab-every-model-superbot-afb4ddca/?v=3', 'build a lens lab that explains camera focus: Lyria 2 scores it, Meshy builds the lens and the valley, Gemini paints the focus plates, Opus 5.5 writes the optics, DeepSeek V4 Flash scrapes glass catalogs, GitHub takes the repo, Opus 5.5 builds it; ends on @RyanSael Opus 5.5 Lens Lab clip (7 requests)', 'Ad spots'],
  // make a 15-second motion graphics showreel. go all out. (2026-09-27): the lenslab afb4ddca v3 routing rethemed to motion design, each model switch a motion-graphics move (cut, match cut, wipe, keyframe, whip, dissolve); ends on @shneural's same-prompt clip, Opus 5.5 Max then GPT 6 Astra Max (animations/showreel-every-model-superbot-f7a45e10/img/sr/CREDITS.txt).
  ['showreel-every-model-v3-superbot-f7a45e10', 'showreel-every-model-superbot-f7a45e10/?v=3', 'make a 15-second motion graphics showreel: Lyria 2 scores it, Meshy models the hero shapes, Gemini paints the style frames, Opus 5.5 writes the reel as code, DeepSeek V4 Flash samples the type and palette, GitHub takes the repo, then the same prompt to Opus 5.5 and GPT 6 Astra; ends on @shneural Opus 5.5 vs GPT 6 Astra showreel clip (7 requests)', 'Ad spots'],
  // make a dynamic 15-second motion graphics video, your showreel for a résumé (2026-09-27): the fantasy90s 042670d1 v3 routing rethemed to @stephanlivera's Opus 5.5 Max effort motion reel, each model switch eased on one of the clip's six curves (linear, ease-in-out, expo-out, back-out, elastic, bounce), the finale a spring; ends on the clip playing whole (animations/motionreel-every-model-superbot-fc1ce9e8/img/mr/CREDITS.txt).
  ['motionreel-every-model-v3-superbot-fc1ce9e8', 'motionreel-every-model-superbot-fc1ce9e8/?v=3', 'make a dynamic 15-second motion graphics video, your showreel for a résumé. go all out: each switch rides one of the clip’s easings, Lyria 2 scores it linear, Meshy builds the point clouds ease-in-out, Gemini paints the style frames expo-out, Opus 5.5 writes easing.ts back-out, DeepSeek V4 Flash sweeps the Truchet tiles elastic, GitHub bounces in the commits; ends on @stephanlivera’s Opus 5.5 Max effort clip playing whole (7 requests)', 'Ad spots'],
  // make a high-end netflix style documentary about superintelligence for normies (2026-09-27): the fantasy90s 042670d1 v3 cadence (by way of the prometheus 0a738a62 fork) rethemed to THE LAST INVENTION, @gavinpurcell's Opus 5.5 agent's superintelligence documentary (x.com/gavinpurcell/status/2103304514329854102), each model switch a lower third with its domino; ends on the film's window growing to full frame and its title card (animations/lastinvention-every-model-superbot-dda6c235/img/CREDITS.txt).
  ['lastinvention-every-model-v3-superbot-dda6c235', 'lastinvention-every-model-superbot-dda6c235/?v=3', 'make a high-end netflix style documentary about superintelligence for normies: Lyria 2 scores the cut, Meshy forms the props, Gemini grades the plates, Opus 5.5 writes the edit as code, DeepSeek V4 Flash checks the film’s claims, GitHub locks picture, Opus 5.5 renders The Last Invention; each switch a falling domino; ends on @gavinpurcell’s Opus 5.5 superintelligence documentary (7 requests)', 'Ad spots'],
  // Create a 4-5 minute cinematic video about the Battle of Austerlitz (1805), built entirely in code (2026-09-27): the lastinvention dda6c235 v3 cadence rethemed to AUSTERLITZ, @WinterArc2125's Opus 5.5 film of 2 December 1805 (x.com/WinterArc2125/status/2103116235009347650, code github.com/WinterArc21/Battle-of-Austerlitz-Film), each model switch one of the film's hour captions with the sun where it truly stood, each location caption a place on the field; ends on the film's window and its closing montage (animations/austerlitz-every-model-superbot-282e0654/img/CREDITS.txt).
  ['austerlitz-every-model-v3-superbot-282e0654', 'austerlitz-every-model-superbot-282e0654/?v=3', 'Create a 4-5 minute cinematic video about the Battle of Austerlitz (1805), built entirely in code: Lyria 2 writes the score, Meshy casts the soldiers, Gemini paints the look, Opus 5.5 writes the engine, DeepSeek V4 Flash surveys the hills, GitHub sends the dispatch, Opus 5.5 renders Austerlitz; each switch an hour of the film with the sun where it really stood; ends on @WinterArc2125’s Opus 5.5 film (7 requests)', 'Ad spots'],
  // make an animated video about the future (2026-09-26): three structurally different pipelines for one film (?v=1..3), ends on The Steep Part clip.
  // make Dark Souls (2026-09-26): three structurally different routings of one page (?v=1..3), coding always Opus 5.5 as result cards, ends on 13s of @The_Alex's Opus 5.5 Dark Souls clip.
  ['dark-souls-every-model-v1-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=1', 'make Dark Souls: ElevenLabs voices the boss, Opus 5.5 builds it, Superbot plays (3 switches)', 'Ad spots'],
  ['dark-souls-every-model-v2-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=2', 'make Dark Souls: Gemini paints the Gatewarden, Opus 5.5 builds the fight, Gemini textures the fog gate, GitHub, Superbot renders and plays (5 switches)', 'Ad spots'],
  ['dark-souls-every-model-v3-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=3', 'make Dark Souls: Opus 5.5 builds combat, DeepSeek assets, ElevenLabs score, Gemini art, Opus 5.5 live preview, GitHub, Superbot plays (7 switches)', 'Ad spots'],
  // v4 remake (2026-09-26): seven steps of the same page, reframed tight like one-agent-full-degen (no per-switch zoom):
  // Opus 5.5 cooks the codebase as a timelapse, DeepSeek V4 Flash searches the reference assets, Meshy 5 turns them
  // into real 3D meshes, MiniMax Hailuo 02 animates the casts, ElevenLabs scores, GitHub, Superbot plays.
  ['dark-souls-every-model-v4-superbot-80e24d9f', 'dark-souls-every-model-superbot-80e24d9f/?v=4', 'make Dark Souls: Opus 5.5 timelapse cooks the code, DeepSeek V4 Flash searches the assets, Meshy 5 models them in 3D, MiniMax Hailuo 02 animates, ElevenLabs score, GitHub, Superbot plays (v4 remake, 7 steps)', 'Ad spots'],
  // THEY WONT TELL YOU HOW (2026-09-27): a fork of the dark-souls v4 routing. A mock X post ("I made this in 1 prompt",
  // the embedded video @achxvi's Opus 5.5 Pocketsflow launch film) pushes in, "THEY / WONT / TELL / YOU / HOW" lands one
  // word at a time, then the how: the v4 steps rethemed to Pocketsflow, ending on Superbot playing the real clip.
  ['pocketsflow-untold-every-model-superbot-673c104b', 'pocketsflow-untold-every-model-superbot-673c104b/', 'THEY WONT TELL YOU HOW: "I made this in 1 prompt", then the how. DeepSeek V4 Flash, Meshy 5, MiniMax Hailuo 02, ElevenLabs, Opus 5.5 timelapse, Superbot renders the Pocketsflow launch film (clip @achxvi)', 'Ad spots'],
  // THEY WONT TELL YOU HOW, the Superbot cut (2026-09-27): a second fork of the dark-souls v4 routing. A fictional
  // X post (@julesbuilds, "I made this in 1 prompt", the embedded video @achxvi's Opus 5.5 Pocketsflow launch film)
  // pushes in, the word column lands one word at a time, then one chat takes "make a launch video for Pocketsflow":
  // DeepSeek V4 Flash, Meshy 5, MiniMax Hailuo 02, ElevenLabs, Opus 5.5 in Remotion, Superbot plays the real clip
  // (animations/they-wont-tell-you-how-superbot-fccab6d9/CREDITS.txt).
  ['they-wont-tell-you-how-superbot-fccab6d9', 'they-wont-tell-you-how-superbot-fccab6d9/', 'THEY WONT TELL YOU HOW: a “I made this in 1 prompt” post, then make a launch video for Pocketsflow: DeepSeek V4 Flash researches, Meshy 5 models the mascot, MiniMax Hailuo 02 animates, ElevenLabs scores, Opus 5.5 cuts it in Remotion, Superbot plays (video @achxvi)', 'Ad spots'],
  // THEY WONT TELL YOU HOW: 18 months to escape (2026-09-27): a fork of they-wont-tell-you-how fccab6d9. An X feed
  // decelerates onto a fictional "I made this in 1 prompt" post (footage @anabology's "18 MONTHS TO ESCAPE" film, the
  // most viewed Opus 5.5 video), the word column lands, then one chat builds that film: DeepSeek, Midjourney v7,
  // MiniMax Hailuo 02, ElevenLabs, Claude Opus 5.5 on a 15:00 clock, GitHub, and Superbot plays the real film with sound
  // (animations/escape-untold-every-model-superbot-a00325aa/CREDITS.txt).
  ['escape-untold-every-model-superbot-a00325aa', 'escape-untold-every-model-superbot-a00325aa/', 'THEY WONT TELL YOU HOW: 18 months to escape (every model, one prompt)', 'Ad spots'],
  // ITS A LIE (2026-09-27): a fork of the pocketsflow-untold engine. A mock X post ("I MADE THIS IN ONE PROMPT", the
  // embedded clip @noahwachnik's voxel game) freeze-frames and glitches, hard cut to ITS A LIE / THE SECRET IS / ITS NOT
  // JUST OPUS 5.5, then the superbot hub routes "make me minecraft in the browser" to DeepSeek, Nano Banana, Meshy,
  // ElevenLabs, Suno and Claude Opus 5.5, and the reveal plays BlockHaven by @kepochnik
  // (animations/its-a-lie-every-model-superbot-54829cd7/CREDITS.txt).
  ['its-a-lie-every-model-superbot-54829cd7', 'its-a-lie-every-model-superbot-54829cd7/', 'ITS A LIE: "I made this in one prompt", then the models behind BlockHaven', 'Ad spots'],
  // IT'S NOT JUST OPUS 5.5 (2026-09-27): a fork of make-minecraft b055c127 with the pocketsflow-untold X post, where the
  // viewer mines @noahwachnik's Opus 5.5 Minecraft post like a block, then one chat routes "make me minecraft. call it
  // BlockHaven" through six models before @kepochnik's clip plays
  // (animations/blockhaven-not-just-opus-superbot-2ab31e2c/img/CREDITS.txt).
  ['blockhaven-not-just-opus-superbot-2ab31e2c', 'blockhaven-not-just-opus-superbot-2ab31e2c/', 'IT\'S NOT JUST OPUS 5.5: mine @noahwachnik\'s post, then one chat builds BlockHaven. DeepSeek V4 Flash, Gemini, Meshy 5, ElevenLabs, Opus 5.5, Superbot plays it (clip @kepochnik)', 'Ad spots'],
  // Model switcher (2026-09-28): a fork of blockhaven 2ab31e2c. Opens on a deck of 16 model
  // cards switching faster and faster under the routing chip, then one 7 s chat
  // routes "Make a Japanese relaxing biking demo" to Meshy (3D), DeepSeek (textures + ambient audio) and Opus 5.5
  // (code) before @prasenx's Opus 5.5 bike ride plays full frame for 2.7 s
  // (animations/first-model-all-models-superbot-df54f063/img/CREDITS.txt, brand/CREDITS.txt).
  ['first-model-all-models-superbot-df54f063', 'first-model-all-models-superbot-df54f063/', 'MODEL SWITCHER: 16 model cards switch, then one 7 s chat builds a Japanese bike ride. Meshy, DeepSeek, Opus 5.5 (clip @prasenx)', 'Ad spots'],
  // THE FIRST MODEL WITH ALL THE MODELS (2026-09-28): a fork of pdoom abba733b. The title over a deck of 14 model
  // switches that deals out into the roster, then one 8 s chat routes "Make a Japanese relaxing biking demo" to Meshy
  // (a live grid of six 3D models), DeepSeek (the scraped thumbnails and waveforms) and Opus 5.5 (the agent run of the
  // minecraft zoom cut) with a zoom on each switch, and hard-cuts from the preview card into the post's real ride
  // footage (animations/first-model-every-model-superbot-7d540b7f: brand/, scenes/tabs-assets/scraped/ and
  // scenes/ride-assets/ CREDITS.txt).
  ['first-model-every-model-superbot-7d540b7f', 'first-model-every-model-superbot-7d540b7f/', 'THE FIRST MODEL WITH ALL THE MODELS: 14 model cards switch, then one 8 s chat zooms on each switch: Meshy models the 3D grid, DeepSeek scrapes the assets, Opus 5.5 codes, and the Japanese bike ride plays', 'Ad spots'],
  ['wsb-to-wings-switcher-superbot-cbe85cdb', 'wsb-to-wings-switcher-superbot-cbe85cdb/', 'From WSB to Wings in One Ask', 'Ad spots'],
  ['tendie-model-selector-superbot-3c27b88b', 'tendie-model-selector-superbot-3c27b88b/', 'The Right Model for Every Tendie', 'Ad spots'],
  ['one-agent-full-degen-superbot-129bca8b', 'one-agent-full-degen-superbot-129bca8b/', 'One Agent. Full Degen.', 'Ad spots'],
  // OPUS 5.5 SAYS YOU SHOULDN'T GAMBLE (2026-09-28): the one-agent-full-degen 129bca8b engine forked and
  // rethemed: two text cards ("Opus 5.5 says you shouldn't gamble" with the last word red, then "WE DONT CARE!"
  // under a confetti burst), then one ask — "Make a website of all my winnings" — and superbot's work card grows
  // sams-winnings.site out of the thread to fill the frame. Fictional winnings; no casino or sportsbook brands.
  ["we-dont-care-gamble-superbot-89be2ca4", "we-dont-care-gamble-superbot-89be2ca4/", "WE DONT CARE: Opus 5.5 says you shouldn't gamble, then superbot builds a website of all my winnings", "Ad spots"],
  // THE GAMBLE MATRIX (2026-09-28): the we-dont-care 89be2ca4 spot regenerated by tools/var89-generate.mjs into
  // the 12 cells of tools/var89-matrix.mjs — four AI voices x three provider content packs. On card 1 the variant
  // voice replaces Opus 5.5 in "<voice> says you shouldn't gamble"; card 2, the red word and the ask beat are
  // identical, and the ask then reads "Make a website of all my <memecoin|Polymarket|DraftKings> wins" while
  // superbot's work card grows that variant's site. Provider names are plain text only; every figure is fictional
  // mock UI data (each folder's img/CREDITS.txt). One row per cell; the base spot stays listed just above.
  ['chatgpt-memecoins-superbot-cae00e01', 'chatgpt-memecoins-superbot-cae00e01/', 'ChatGPT says you shouldn\'t gamble: superbot builds a site of all my memecoin wins', 'Ad spots'],
  // make me a memecoin trading bot (2026-09-28): the cae00e01 spot hand-built into its own folder: the red word the one intro card reads "WANNA STOP GETTING RUGGED?" with RUGGED in plain red (no "WE DONT CARE!" card), then the ask connects Axiom the way every-model-one-chat connects DoorDash, backtests 4 strategies, connects DeepSeek, scrapes 2,418 tickers and waits for a HIT, buys $POPCAT on an Axiom-style token page and exits up $174. Tokens, icons and stats are real (CoinGecko + DexScreener, 2026-09-29); only the scan scores and trade candles are illustration.
  ['chatgpt-memebot-axiom-superbot-6e571750', 'chatgpt-memebot-axiom-superbot-6e571750/', 'ChatGPT says you shouldn\'t gamble: make me a memecoin trading bot, superbot backtests on Axiom, DeepSeek scans every ticker to a HIT, buys $POPCAT and exits up $174', 'Ad spots'],
  // read-only tracker remake of the Axiom bot spot (2026-09-28): same page and venue, but the ask tracks a watchlist and alerts instead of trading, so the spot carries no buy/sell claim for X ad review.
  ['chatgpt-memecoin-tracker-axiom-superbot-fc161351', 'chatgpt-memecoin-tracker-axiom-superbot-fc161351/', 'ChatGPT can\'t watch Axiom for you: superbot builds a read-only memecoin tracker', 'Ad spots', { desc: 'superbot connects Axiom read-only, builds a memecoin watchlist with alert rules and flags a POPCAT volume spike. Tracking only, it never trades.' }],
  // make me a memecoin trading bot, fomo cut (2026-09-28; id kept from its first Phantom cut): cae00e01 hand-built into its own folder: "gamble" rises in plain red (no scale punch),
  // the ask connects fomo with every-model-one-chat's DoorDash chip, backtests 4 strategies, flags fomo's trending $PAID, $STONK, $JEANPHIL, reports a summary, then
  // "Look's good, let's do it" and the fomo portfolio screen (a 1:1 copy of the app's) zooms out of the thread to fill the frame, trading $6,000 through a loss, a climb, a spike and a drop to $8,579. The coins are real, every figure is fictional.
  ['chatgpt-memebot-phantom-superbot-293fef02', 'chatgpt-memebot-phantom-superbot-293fef02/', 'WANNA STOP GETTING RUGGED? make me a memecoin trading bot, superbot connects fomo, backtests, flags $PAID, $STONK and $JEANPHIL, then trades them live', 'Ad spots'],
  // read-only tracker remake of the fomo bot spot (2026-09-28): same page and venue, but the ask tracks a watchlist and alerts instead of trading, so the spot carries no buy/sell claim for X ad review.
  ['chatgpt-memecoin-tracker-fomo-superbot-2ccee0a4', 'chatgpt-memecoin-tracker-fomo-superbot-2ccee0a4/', 'WANNA TRACK EVERY MEMECOIN? superbot builds a read-only fomo tracker', 'Ad spots', { desc: 'superbot connects fomo read-only, builds an 8-token memecoin watchlist with alert rules, and pings you when volume, holders, liquidity or trending ranks move. Tracking only, it never trades.' }],
  // make me a prediction market trading bot (2026-09-28): cae00e01 hand-built into its own folder: "gamble" rises in plain red (no scale punch),
  // the ask connects Polymarket with every-model-one-chat's DoorDash chip (composer chip follows), backtests 5 strategies, scans 1,412 live markets, flags 3 buys,
  // reports a summary, then "Look's good, let's do it" and the Polymarket account grows out of the thread: 3 fills, the chance line climbs to Resolved Yes, wins burst, $2,500 to $5,654. Markets and figures are fictional.
  ['chatgpt-predictionbot-superbot-6cc423a0', 'chatgpt-predictionbot-superbot-6cc423a0/', 'ChatGPT says you shouldn\'t gamble: make me a prediction market trading bot, superbot connects Polymarket, backtests, flags buys, then trades it live', 'Ad spots'],
  // read-only tracker remake of the Polymarket bot spot (2026-09-28): same page and venue, but the ask tracks odds and volume alerts instead of trading, so the spot carries no buy/sell claim for X ad review.
  ['chatgpt-polymarket-tracker-superbot-a0b21a33', 'chatgpt-polymarket-tracker-superbot-a0b21a33/', 'ChatGPT can\'t watch Polymarket for you: superbot builds a read-only Polymarket tracker', 'Ad spots', { desc: 'superbot connects Polymarket read-only, builds a watchlist, arms odds and volume alerts, and pings you when the Fed market jumps 34% to 52%. Tracking only, it never trades.' }],
  ['chatgpt-polywins-superbot-cae00e02', 'chatgpt-polywins-superbot-cae00e02/', 'ChatGPT says you shouldn\'t gamble: superbot builds a site of all my Polymarket wins', 'Ad spots'],
  ['chatgpt-sportsbook-superbot-cae00e03', 'chatgpt-sportsbook-superbot-cae00e03/', 'ChatGPT says you shouldn\'t gamble: superbot builds a site of all my DraftKings wins', 'Ad spots'],
  ['claude-memecoins-superbot-cae00e04', 'claude-memecoins-superbot-cae00e04/', 'Claude says you shouldn\'t gamble: superbot builds a site of all my memecoin wins', 'Ad spots'],
  ['claude-polywins-superbot-cae00e05', 'claude-polywins-superbot-cae00e05/', 'Claude says you shouldn\'t gamble: superbot builds a site of all my Polymarket wins', 'Ad spots'],
  ['claude-sportsbook-superbot-cae00e06', 'claude-sportsbook-superbot-cae00e06/', 'Claude says you shouldn\'t gamble: superbot builds a site of all my DraftKings wins', 'Ad spots'],
  ['gemini-memecoins-superbot-cae00e07', 'gemini-memecoins-superbot-cae00e07/', 'Gemini says you shouldn\'t gamble: superbot builds a site of all my memecoin wins', 'Ad spots'],
  ['gemini-polywins-superbot-cae00e08', 'gemini-polywins-superbot-cae00e08/', 'Gemini says you shouldn\'t gamble: superbot builds a site of all my Polymarket wins', 'Ad spots'],
  ['gemini-sportsbook-superbot-cae00e09', 'gemini-sportsbook-superbot-cae00e09/', 'Gemini says you shouldn\'t gamble: superbot builds a site of all my DraftKings wins', 'Ad spots'],
  ['grok-memecoins-superbot-cae00e0a', 'grok-memecoins-superbot-cae00e0a/', 'Grok says you shouldn\'t gamble: superbot builds a site of all my memecoin wins', 'Ad spots'],
  ['grok-polywins-superbot-cae00e0b', 'grok-polywins-superbot-cae00e0b/', 'Grok says you shouldn\'t gamble: superbot builds a site of all my Polymarket wins', 'Ad spots'],
  ['grok-sportsbook-superbot-cae00e0c', 'grok-sportsbook-superbot-cae00e0c/', 'Grok says you shouldn\'t gamble: superbot builds a site of all my DraftKings wins', 'Ad spots'],
  // THE BOT CELLS (2026-09-28): the same we-dont-care spot with the user's own words typed lowercase into the
  // composer, "make me a memecoin trading bot" / "make me a prediction market trading bot", and superbot builds
  // a live trading bot dashboard (sams-memebot.site / sams-polybot.site) instead of a site of wins. Same two
  // cells as tools/var89-matrix.mjs; chain and venue names plain text only, every figure fictional mock UI data.
  ['chatgpt-memebot-superbot-cae00e0d', 'chatgpt-memebot-superbot-cae00e0d/', 'ChatGPT says you shouldn\'t gamble: superbot builds a memecoin trading bot', 'Ad spots'],
  ['claude-polybot-superbot-cae00e0e', 'claude-polybot-superbot-cae00e0e/', 'Claude says you shouldn\'t gamble: superbot builds a prediction market trading bot', 'Ad spots'],
  // THE LIVE CELLS (2026-09-28): the same two bot cells taken live — the paper backtest first, then a real
  // connect and live trades on Axiom / Polymarket (2k book, +186 / +142). Same we-dont-care engine; venue
  // names plain text only and every figure fictional mock UI data.
  ['chatgpt-memebot-live-superbot-cae00e0f', 'chatgpt-memebot-live-superbot-cae00e0f/', 'ChatGPT says you shouldn\'t gamble: superbot backtests, paper trades, then trades live on Axiom', 'Ad spots'],
  ['claude-polybot-live-superbot-cae00e10', 'claude-polybot-live-superbot-cae00e10/', 'Claude says you shouldn\'t gamble: superbot backtests, paper trades, then trades live on Polymarket', 'Ad spots'],
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
  // every model, one chat (2026-10-01): the 4:5 phone cut of the merge spot — ChatGPT, Claude, Gemini, Grok, Copilot and
  // Reddit land in one hand and the app tiles merge into one app, then Gemini makes the meme, DeepSeek digs through
  // Reddit and the order is placed on DoorDash. 26.4 s, 1080x1350, 30 fps, with sound; ships its own final.mp4.
  ['every-model-merge-phone-4x5-d10630b5', 'every-model-merge-phone-4x5-d10630b5/', "Every model, one chat: all your apps merge into Superbot", 'Ad spots', { download: 'animations/every-model-merge-phone-4x5-d10630b5/final.mp4', downloadLabel: 'MP4 4:5' }],
  // every model, one chat (2026-10-02): the converge cut of the same spot, built on a fork of the
  // every-model-4x5 engine retimed to a 26.4 s spine. Twelve real app icons sit on the iOS home
  // screen, lift OUT of the phone onto the full stage, spiral and implode into the Superbot tile,
  // and the tile dives back into the phone; then the superbot route plays out (Gemini meme,
  // DeepSeek V4 Flash scraping Reddit, a DoorDash burger order in 24 min) and the end card flies
  // the twelve icons back in from the frame edges into the superbot mark. 26.4 s, 1080x1350,
  // 30 fps, with sound; ships its own final.mp4.
  ['every-model-converge-4x5-398eded5', 'every-model-converge-4x5-398eded5/', "Every model, one chat: Superbot desktop on the knit phone", 'Ad spots', { download: 'animations/every-model-converge-4x5-398eded5/final.mp4', downloadLabel: 'MP4 4:5' }],
  // converge variants (2026-10-02): the same 21.6 s converge spine (identical beats, timing and score),
  // rethemed twice. apps: the hook throws the five apps you juggle (ChatGPT, Claude, Grok, Cursor,
  // Copilot) and the copy reads 'five apps, one chat'. day: the hook keeps the router pills and the copy
  // runs the whole day, standup meme to the 24 min burger. 21.6 s, 1080x1350, 30 fps, with sound.
  ['every-model-converge-apps-4x5-4741876c', 'every-model-converge-apps-4x5-4741876c/', "Five apps, one chat: Superbot desktop on the knit phone", 'Ad spots', { download: 'animations/every-model-converge-apps-4x5-4741876c/final.mp4', downloadLabel: 'MP4 4:5' }],
  ['every-model-converge-day-4x5-60e5248a', 'every-model-converge-day-4x5-60e5248a/', "One chat, all day: Superbot desktop on the knit phone", 'Ad spots', { download: 'animations/every-model-converge-day-4x5-60e5248a/final.mp4', downloadLabel: 'MP4 4:5' }],
  // converge variants 3 and 4 (2026-10-02): same 21.6 s spine and score, each hook aimed at a ranked
  // r/LLM complaint (sell-to-reddit llm_ai, 30 days). limit: usage limits and pricing (rank 1), 'hit a
  // limit? switch models'. nerfed: output quality regressions (rank 2, rising), 'model nerfed? use another'.
  ['every-model-converge-limit-4x5-7f41c37b', 'every-model-converge-limit-4x5-7f41c37b/', "Hit a limit? Switch models: Superbot desktop on the knit phone", 'Ad spots', { download: 'animations/every-model-converge-limit-4x5-7f41c37b/final.mp4', downloadLabel: 'MP4 4:5' }],
  ['every-model-converge-nerfed-4x5-04314497', 'every-model-converge-nerfed-4x5-04314497/', "Model nerfed? Use another: Superbot desktop on the knit phone", 'Ad spots', { download: 'animations/every-model-converge-nerfed-4x5-04314497/final.mp4', downloadLabel: 'MP4 4:5' }],
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
