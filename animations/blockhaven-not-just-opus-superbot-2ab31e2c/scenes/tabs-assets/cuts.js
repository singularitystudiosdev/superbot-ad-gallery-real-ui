// blockhaven-not-just-opus: one cut, one page (the ?cut= variants of the make-minecraft fork are gone). One ask, six
// hand-offs in a fixed order: DeepSeek V4 Flash scrapes the block and sound references, Gemini makes the textures,
// Meshy 5 models the blocks, ElevenLabs makes the sounds, Claude Opus 5.5 writes the engine, and Superbot ships the
// game with a Play card. asks[] and say{} follow that order (null = superbot carries on unasked). pace scales every
// beat's own clock; zoom: the camera pushes into the Play card as the scene hands off to the clip.
export const CFG = {
  pace: 1, zoom: true,
  end: 'superbot',
  asks: ['make me minecraft. call it BlockHaven', null, null, null, null, null],
  say: {
    scrape: 'Block and sound references from 6 texture sites and 4 sound libraries.',
    gen: 'Your block textures, 16×16, made from those references.',
    mesh: 'A grass block, an oak log and a wooden pickaxe, modeled from the textures.',
    sfx: 'The sounds: wood chop, grass step, block pop.',
    code: 'Writing the engine: chunk mesher, lighting, block breaking, crafting.',
    ship: 'BlockHaven is built and running. Hit play.',
  },
};
export const CUT = 'blockhaven';
export const CUTS = { blockhaven: CFG };
