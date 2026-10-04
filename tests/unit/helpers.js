// shared by the unit tests: one loaded copy of the game per test file
const crypto = require('crypto');
const { loadGame } = require('../../tools/load_game');
function hash(arr) { return crypto.createHash('sha1').update(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength)).digest('hex').slice(0, 12); }
// the 26 x 42 window that ends one row below the feet: stable if the sprite canvas grows upwards
function feetWindow(g, f) {
  const out = new Uint8Array(g.SPR_W * 42), top = g.SPR_BY + 2 - 42;
  for (let y = 0; y < 42; y++) for (let x = 0; x < g.SPR_W; x++) out[y * g.SPR_W + x] = f[(top + y) * g.SPR_W + x];
  return out;
}
module.exports = { loadGame, hash, feetWindow };
