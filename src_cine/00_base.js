// @ts-check
// =================================================================== CINEMATIC CORE: BASE
// Shared by the cinematic scenes (src_garden, src_bridge). Loads first: the timing constants and the pure helpers.
// A scene's own config comes next (W, H, IY0, IY1, IH, LOOP_S, CINE_S, PAL_HEX, its palette remaps), then
// 01_frame.js, then the scene, then 99_main.js. Everything shares one global scope.
'use strict';

const FPS = 60, DT = 1 / FPS;
const TAU = Math.PI * 2;
const T = 255;                                      // transparent index in sprite/layer buffers

// ------------------------------------------------------------------ palette remaps
function makeMap(pairs) {
  const m = new Uint8Array(256);
  for (let i = 0; i < 256; i++) m[i] = i;
  for (let i = 0; i < pairs.length; i += 2) m[pairs[i]] = pairs[i + 1];
  return m;
}

// ------------------------------------------------------------------ math / noise helpers
const BAYER = new Float32Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16));
function bay(x, y) { return BAYER[((y & 3) << 2) | (x & 3)]; }
// integer hash (0..65535, always a small int so calls never box a double) + tiny inlinable scaler
function hashi(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 16;
}
function hash(a, b) { return hashi(a, b) * 1.52587890625e-5; }   // [0,1)
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function smoother(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
function frac(v) { return v - Math.floor(v); }
// loop-locked oscillator: k whole cycles per loop
function osc(k, t, ph) { return Math.sin(TAU * (k * t / LOOP_S + ph)); }
// smooth 1D value noise, periodic with period p (integer)
function pnoise(x, p, seed) {
  const i = Math.floor(x), f = x - i, a = hash(((i % p) + p) % p, seed), b = hash((((i + 1) % p) + p) % p, seed);
  return lerp(a, b, f * f * (3 - 2 * f));
}
