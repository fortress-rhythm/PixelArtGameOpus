// ------------------------------------------------------------------ constants
const W = 320, H = 180, BAR = 23, IH = 134, IY0 = BAR, IY1 = BAR + IH;
const LOOP_S = 54, LOOP_F = LOOP_S * FPS;          // 3240 ticks
const CAM_MAX_X = 160, CAM_MAX_Y = 16;

// ------------------------------------------------------------------ palette (53)
const PAL_HEX = [
  '07060a', '141119',                                   //  0 black, 1 ink
  '1b1a2a', '2c3246', '4b4659', '86615f', 'c2744c',     //  2-6 sky zenith -> horizon
  'f2b86e', 'fff0cf',                                   //  7 glow, 8 hot
  '3a3446',                                             //  9 cloud body
  'a7adb6',                                             // 10 searchlight haze
  '121822', '273041',                                   // 11-12 bay
  '25243a', '36354b',                                   // 13-14 distant skyline
  'd9443a',                                             // 15 neon red / beacons
  '5ad1d2', '2b7580',                                   // 16-17 fusion cyan
  '121c1d', '213632', '475838', '8d8b4c',               // 18-21 foliage
  '2b2a33', '4b4955', '7b6e66',                         // 22-24 stone
  '7d6752', '4d392b', '24180f',                         // 25-27 soil dry -> wet
  '333a46', '626c79', '9ca7b1', 'd6dfe3',               // 28-31 steel
  'a3303b', 'd8605c', 'e0973a', 'eed27c', '8b7cb4', 'efe6cf', // 32-37 flowers
  'd8c6a2', '6f7b82', '2a2532',                         // 38-40 cottage
  'f1c7a0', 'c08a69', '744b47',                         // 41-43 skin
  '3b2220', '70402c',                                   // 44-45 hair
  '8a8c99',                                             // 46 cream shadow
  '5c1a2b', '321526',                                   // 47-48 dress oxblood, plum
  'ffffff', 'a8e6ee', '4a8db0',                         // 49-51 water
  'ffc46b'                                              // 52 rim light
];
const C = {
  BLK: 0, INK: 1, SK0: 2, SK1: 3, SK2: 4, SK3: 5, SK4: 6, GLOW: 7, HOT: 8, CLOUD: 9, HAZE: 10,
  BAY0: 11, BAY1: 12, CITY0: 13, CITY1: 14, RED: 15, CYAN: 16, CYAND: 17,
  F0: 18, F1: 19, F2: 20, F3: 21, ST0: 22, ST1: 23, ST2: 24, SOILD: 25, SOILM: 26, SOILW: 27,
  S0: 28, S1: 29, S2: 30, S3: 31, CRIM: 32, CORAL: 33, MARI: 34, PALEY: 35, LAV: 36, CREAM: 37,
  STUL: 38, STUS: 39, TRIM: 40, SKL: 41, SKM: 42, SKS: 43, HAIRD: 44, HAIRL: 45, CREAMS: 46,
  OX: 47, PLUM: 48, WHITE: 49, WL: 50, WM: 51, RIM: 52
};
const NPAL = PAL_HEX.length;

// ------------------------------------------------------------------ light ramps (palette remaps)
// warm lamp / blind-slat light: one step brighter and warmer
const LIT = makeMap([
  0, 1, 1, 40, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 5, 10, 31, 11, 12, 12, 23, 13, 14, 14, 4,
  15, 33, 16, 50, 17, 16, 18, 19, 19, 20, 20, 21, 21, 35, 22, 24, 23, 6, 24, 7,
  25, 6, 26, 25, 27, 26, 28, 29, 29, 30, 30, 31, 31, 8, 32, 33, 33, 34, 34, 35, 35, 8, 36, 37,
  37, 8, 38, 37, 39, 38, 40, 39, 41, 8, 42, 41, 43, 42, 44, 45, 45, 6, 46, 37, 47, 32, 48, 47,
  49, 49, 50, 49, 51, 50, 52, 8
]);
// cool shadow: one step darker and cooler
const SHD = makeMap([
  0, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 2, 10, 4, 11, 0, 12, 11, 13, 2, 14, 13,
  15, 47, 16, 17, 17, 12, 18, 1, 19, 18, 20, 19, 21, 20, 22, 1, 23, 22, 24, 23,
  25, 26, 26, 27, 27, 0, 28, 1, 29, 28, 30, 29, 31, 30, 32, 47, 33, 32, 34, 6, 35, 34, 36, 4,
  37, 46, 38, 39, 39, 40, 40, 1, 41, 42, 42, 43, 43, 44, 44, 1, 45, 44, 46, 28, 47, 48, 48, 0,
  49, 50, 50, 51, 51, 12, 52, 7
]);
// searchlight / fog haze: cold, lighter
const BEAM = makeMap([
  2, 3, 3, 4, 4, 10, 5, 10, 6, 7, 9, 4, 11, 12, 12, 4, 13, 14, 14, 4, 18, 19, 19, 12, 0, 1, 1, 13
]);
// aircar underglow: lifts only mid/high values
const UPG = makeMap([
  23, 24, 24, 7, 29, 30, 30, 31, 31, 8, 38, 37, 39, 38, 20, 21, 21, 35, 25, 6, 34, 35, 36, 37,
  32, 33, 42, 41, 37, 8, 46, 37, 5, 6, 6, 7
]);
// film grain on the darkest ramps (0 = not grain-eligible)
const GRN = new Uint8Array(256);
[[0, 1], [1, 0], [2, 1], [11, 12], [12, 11], [13, 2], [18, 19], [19, 18], [22, 1], [27, 26],
 [28, 1], [40, 1], [44, 1], [48, 0]].forEach(p => { GRN[p[0]] = p[1] + 1; });

const L = { NONE: 0, SKY: 1, CLOUD: 2, FAR: 3, BAY: 4, MID: 5, HILL: 6, WALL: 7, GROUND: 8,
            BED: 9, PROP: 10, HOUSE: 11, ROBOT: 12, HER: 13, WATER: 14, CAR: 15, FG: 16, GLASS: 17 };

const M_ALL = 0x7fffffff;
const M_SKYISH = (1 << L.SKY) | (1 << L.CLOUD);
const M_GROUNDISH = (1 << L.GROUND) | (1 << L.BED) | (1 << L.PROP) | (1 << L.WALL);
const M_LIT = M_GROUNDISH | (1 << L.HER) | (1 << L.ROBOT) | (1 << L.HOUSE) | (1 << L.GLASS);

// A cinematic scene needs CINE_S, the length of its timeline in seconds (?t= seeks within it).
const CINE_S = LOOP_S;
