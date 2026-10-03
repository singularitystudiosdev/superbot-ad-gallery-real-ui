// Pocket Summit, the patched game, as it runs inside the itch.io embed. Composed ONLY from Kenney's CC0 "Pixel
// Platformer" pack (https://kenney.nl/assets/pixel-platformer, v1.2, game/KENNEY-LICENSE.txt): the packed 18 px tile
// sheet (game/kenney-tiles.png, 20 x 9 tiles), the 24 px character sheet (game/kenney-characters.png) and the 24 px
// background sheet (game/kenney-backgrounds.png). Nothing is drawn by hand: every pixel on the canvas is a drawImage of
// a whole tile from those sheets, nearest-neighbour (imageSmoothingEnabled off) at 4x into a 1920 x 1080 backing store,
// so the CSS scale of the embed only ever shrinks crisp 4 px blocks. Tile ids are the pack's own (Tilesheet (Tiles).txt
// order, row-major from 0): 101/102/103 snow top left/mid/right, 121/122/123 dirt left/mid/right, 126 pine, 145
// snowman, 111/112 the red flag's two frames over 131 its pole, 151/152 the coin face and edge, 158 "x" and 160-169
// the small digits (the HUD coin counter). Characters: 0 and 1, the green alien's two frames. Background: the pack's
// pale snow strip (columns 0-3 of the background sheet), its top row repeated up into the sky.
//
// The run is a pure function of the game's own time g (seconds since the embed loaded): the alien idles, runs right
// off the high ledge, falls onto the short strip and the player presses jump 4 frames (1/15 s) BEFORE it lands (the
// case 1.0.3 dropped: is_on_floor() was false that frame). With 1.0.4's jump buffer the jump fires on the landing
// frame, the alien clears the 3-tile gap, lands on the far ledge's lip and takes the coin on that same frame (LAND2:
// the bold moment, the chime). Then it slows to a stop. Constant gravity and launch speed, so every arc is exact.
const T = 18;                      // tile px (logical)
export const LW = 480, LH = 270;   // the game's logical viewport (16:9; 26.7 x 15 tiles)
const SCALE = 4;                   // backing store px per logical px
// physics (logical px, seconds)
const VX = 115, GRAV = 1000, V0 = 365;
const G0 = 0.2;                    // idle before the run starts
const X0 = 120;                    // the alien's centre at the start
const EDGE = 200;                  // centre x where it runs off the high ledge
const Y_HIGH = 9 * T, Y_LOW = 11 * T; // feet y on the high ledge, on the strip and the far ledge
export const FALL = G0 + (EDGE - X0) / VX;               // runs off the edge
export const LAND1 = FALL + Math.sqrt((2 * (Y_LOW - Y_HIGH)) / GRAV); // lands on the strip (and the buffered jump fires)
export const PRESS = LAND1 - 4 / 60;                       // jump pressed 4 frames before that landing
const AIR = (2 * V0) / GRAV;
export const LAND2 = LAND1 + AIR;                          // lands on the far ledge, takes the coin
const X1 = EDGE + VX * (LAND1 - FALL);
const X2 = X1 + VX * AIR;
const STOP = 0.35;                                         // slowing to a stop after LAND2
const COIN = { x: 318, y: Y_LOW - 15 };                    // the coin sits right where the alien lands
const KEY_ON = 0.35;                                       // the JUMP cue shows this long from PRESS

// the level: [tile id, column, row]
function level() {
  const L = [];
  for (let c = 0; c <= 10; c++) { L.push([c === 10 ? 103 : 102, c, 9]); for (let r = 10; r <= 14; r++) L.push([c === 10 ? 123 : 122, c, r]); }
  for (let c = 11; c <= 13; c++) { L.push([c === 13 ? 103 : 102, c, 11]); for (let r = 12; r <= 14; r++) L.push([c === 13 ? 123 : 122, c, r]); }
  for (let c = 17; c <= 26; c++) { L.push([c === 17 ? 101 : 102, c, 11]); for (let r = 12; r <= 14; r++) L.push([c === 17 ? 121 : 122, c, r]); }
  L.push([126, 2, 8], [126, 7, 8], [145, 21, 10], [131, 24, 10]);
  return L;
}
const LEVEL = level();

/** the alien's state at game time g: centre x, feet y, frame, the coin's pickup progress, the HUD count, the key */
export function stateAt(g) {
  let x, y, frame = 0;
  if (g < G0) { x = X0; y = Y_HIGH; }
  else if (g < FALL) { x = X0 + VX * (g - G0); y = Y_HIGH; frame = Math.floor((g - G0) / 0.09) % 2; }
  else if (g < LAND1) { const d = g - FALL; x = EDGE + VX * d; y = Y_HIGH + 0.5 * GRAV * d * d; frame = 1; }
  else if (g < LAND2) { const d = g - LAND1; x = X1 + VX * d; y = Y_LOW - (V0 * d - 0.5 * GRAV * d * d); frame = 1; }
  else {
    const d = Math.min(STOP, g - LAND2);
    x = X2 + VX * (d - (d * d) / (2 * STOP)); y = Y_LOW;
    frame = g - LAND2 < STOP ? Math.floor((g - LAND2) / 0.12) % 2 : 0;
  }
  const take = g < LAND2 ? 0 : Math.min(1, (g - LAND2) / 0.35);
  return { x, y, frame, take, coins: g >= LAND2 ? 1 : 0, key: g >= PRESS && g < PRESS + KEY_ON };
}

/** mount the game into `host` (the embed's game box). imgs: { tiles, chars, bg } loaded <img> elements.
    opts.hud = false draws the level and the alien only (the page's screenshots). */
export function makeGame(host, imgs, opts = {}) {
  const withHud = opts.hud !== false;
  const cv = document.createElement('canvas');
  cv.width = LW * SCALE; cv.height = LH * SCALE;
  cv.className = 'ps-cv';
  const hud = document.createElement('div');
  hud.className = 'ps-hud';
  // the in-game HUD text is Press Start 2P (OFL, fonts/press-start-2p-latin.woff2): the version, and the input cue
  // that shows the moment jump is pressed (plain text, there only while the press is fresh, never a control)
  hud.innerHTML = '<span class="ps-ver">v1.0.4</span><span class="ps-key">JUMP</span>';
  host.append(cv);
  if (withHud) host.append(hud);
  const key = hud.querySelector('.ps-key');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const tile = (id, x, y) => ctx.drawImage(imgs.tiles, (id % 20) * T, Math.floor(id / 20) * T, T, T, x * SCALE, y * SCALE, T * SCALE, T * SCALE);
  let last = '';

  function background() {
    const bg = imgs.bg, band = 104;   // the strip's top edge (logical y)
    for (let x = 0; x < LW; x += 96) {
      for (let y = band - 24; y > -24; y -= 24) ctx.drawImage(bg, 0, 0, 96, 24, x * SCALE, y * SCALE, 96 * SCALE, 24 * SCALE);
      ctx.drawImage(bg, 0, 0, 96, 72, x * SCALE, band * SCALE, 96 * SCALE, 72 * SCALE);
      for (let y = band + 72; y < LH; y += 24) ctx.drawImage(bg, 0, 48, 96, 24, x * SCALE, y * SCALE, 96 * SCALE, 24 * SCALE);
    }
  }

  return {
    /** draw game time g (g < 0: the frame before the run, the alien idle) */
    draw(g) {
      const s = stateAt(Math.max(0, g));
      const flag = Math.floor(Math.max(0, g) / 0.25) % 2;
      const spin = Math.floor(Math.max(0, g) / 0.18) % 2;
      const sig = `${s.x.toFixed(2)}|${s.y.toFixed(2)}|${s.frame}|${s.take.toFixed(3)}|${s.coins}|${flag}|${spin}`;
      key.classList.toggle('on', s.key);
      if (sig === last) return;
      last = sig;
      ctx.clearRect(0, 0, cv.width, cv.height);
      background();
      for (const [id, c, r] of LEVEL) tile(id, c * T, r * T);
      tile(flag ? 112 : 111, 24 * T, 9 * T);
      // the coin: spinning until it is taken, then it rises and fades
      if (s.take < 1) {
        ctx.globalAlpha = 1 - s.take;
        tile(s.take > 0 ? 151 : (spin ? 152 : 151), COIN.x - T / 2, Math.round(COIN.y - T / 2 - 12 * s.take));
        ctx.globalAlpha = 1;
      }
      // the alien (24 px frame, feet on its bottom row)
      ctx.drawImage(imgs.chars, s.frame * 24, 0, 24, 24, Math.round(s.x - 12) * SCALE, Math.round(s.y - 24) * SCALE, 24 * SCALE, 24 * SCALE);
      // the HUD: coin, "x", the count (the pack's own tiles)
      if (withHud) { tile(151, 6, 6); tile(158, 22, 6); tile(160 + s.coins, 36, 6); }
    },
  };
}
