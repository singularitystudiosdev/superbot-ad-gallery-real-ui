// The three cuts of make-minecraft-every-model, one page: ?cut= picks one (the gallery lists each as its own ad).
// Every cut keeps the same hand-off order, Opus last: DeepSeek V4 Flash scrapes block references and sounds, Gemini
// makes the decals, GitHub gets the assets, then Opus 5.5 writes the game and ships it in one reply. asks[] and say{}
// follow that order (asks: deepseek, gemini, github, opus code, opus ship; null = superbot carries on unasked). A cut
// varies the copy, the pacing (pace scales every beat's own clock), whether sam asks for each step, and the finale
// (zoom: the camera dives into the running game).
export const CUTS = {
  auto: {
    pace: 1, zoom: false, end: 'superbot',
    asks: ['I want to make minecraft', null, null, null, null],
    say: {
      scrape: 'Assets first. Block references from 6 texture sites, SFX from 4 sound libraries.',
      gen: 'Here are your block decals, 16×16, made from those references.',
      gh: 'Putting the assets on your GitHub.',
      code: 'Assets are in. Writing the engine: terrain, chunks, meshing, physics, the renderer.',
      ship: 'Decals in the atlas, sounds wired, build is green. Here’s your game.',
    },
  },
  steps: {
    pace: 1.08, zoom: false, end: 'superbot',
    asks: ['I want to make minecraft', 'make me the decals', 'push it to my github', 'now write the game', null],
    say: {
      scrape: 'Assets first. DeepSeek went through 6 texture sites and 4 sound libraries.',
      gen: 'Gemini made 6 blocks from those references.',
      gh: 'Connect GitHub and I’ll push the assets.',
      code: 'Assets are in. Opus 5.5 writes the engine, then the player.',
      ship: 'Textured, built and running.',
    },
  },
  zoom: {
    pace: 0.86, zoom: true, end: 'superbot',
    asks: ['I want to make minecraft', null, null, null, null],
    say: {
      scrape: 'Assets first. Scraping texture sites and sound libraries.',
      gen: 'Your decals.',
      gh: 'Pushing the assets to your GitHub.',
      code: 'Assets are in. Writing the whole thing: engine, world gen, player, renderer.',
      ship: 'Everything wired up. Hit play.',
    },
  },
};
export const CUT = (() => { const c = new URLSearchParams(location.search).get('cut'); return CUTS[c] ? c : 'auto'; })();
export const CFG = CUTS[CUT];
