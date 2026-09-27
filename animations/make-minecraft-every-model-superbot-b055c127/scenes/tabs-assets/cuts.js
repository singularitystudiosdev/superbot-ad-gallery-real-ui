// The three cuts of make-minecraft-every-model, one page: ?cut= picks one (the gallery lists each as its own ad).
// Every cut keeps the same hand-off order: Opus 5.5 writes the game, GitHub gets it, DeepSeek V4 Flash scrapes for
// decals, Gemini makes them, Opus 5.5 ships it. A cut varies the copy, the pacing (pace scales every beat's own
// clock), whether sam asks for each step, and the finale (zoom: the camera dives into the running game).
export const CUTS = {
  auto: {
    pace: 1, zoom: false, end: 'superbot',
    asks: ['I want to make minecraft', null, null, null, null],
    say: {
      code: 'On it. Writing the engine: terrain, chunks, meshing, physics, the renderer.',
      gh: 'Putting it on your GitHub.',
      scrape: 'Scraped 6 texture sites for block references and 4 sound libraries for the SFX.',
      gen: 'Here are your block decals, 16×16.',
      ship: 'Decals are in the atlas and the build is green. Here’s your game.',
    },
  },
  steps: {
    pace: 1.08, zoom: false, end: 'superbot',
    asks: ['I want to make minecraft', 'push it to my github', 'find block textures and sounds', 'make me the decals', 'put it all together'],
    say: {
      code: 'Opus 5.5 has the code. Engine first, then the player.',
      gh: 'Connect GitHub and I’ll push it.',
      scrape: 'DeepSeek went through 6 texture sites and 4 sound libraries.',
      gen: 'Gemini made 6 blocks from those references.',
      ship: 'Back to Opus 5.5. Textured, built and running.',
    },
  },
  zoom: {
    pace: 0.86, zoom: true, end: 'superbot',
    asks: ['I want to make minecraft', null, null, null, null],
    say: {
      code: 'Writing the whole thing. Engine, world gen, player, renderer.',
      gh: 'Pushing it to your GitHub.',
      scrape: 'Scraping texture sites and sound libraries.',
      gen: 'Your decals.',
      ship: 'Everything wired up. Hit play.',
    },
  },
};
export const CUT = (() => { const c = new URLSearchParams(location.search).get('cut'); return CUTS[c] ? c : 'auto'; })();
export const CFG = CUTS[CUT];
