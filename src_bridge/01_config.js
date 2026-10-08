// @ts-check
// =================================================================== NIGHT BRIDGE: CONFIG
// ------------------------------------------------------------------ screen and time
const W = 320, H = 180, BAR = 0, IH = H, IY0 = 0, IY1 = H;      // no letterbox: the whole frame is picture
const STORY_S = 92, LOOP_S = 24;                                 // the story once, then an ambient loop
const CINE_S = STORY_S + LOOP_S;
const STORY_F = STORY_S * FPS, LOOP_F = LOOP_S * FPS, CINE_F = CINE_S * FPS;

// ------------------------------------------------------------------ layout
// The layout tool's values (https://claude.ai/artifact/HWS7V8ao8GacL9atNQLFxC), same names. Paste a new "For the
// brief" layout over these. Heights in % are of the screen height, up from the bottom of the opening shot.
const LAY = {
  worldW: 620, headroom: 70,
  river: 16, leftX: -30, leftY: 22, peakX: 150, peakY: 40, rightX: 420, rightY: 24,
  thickTop: 6, thickEnd: 30, sharp: 3, approach: 44, openings: 2, panels: 12,
  lampEvery: 18, glowN: 6, spots: 3, trees: 7, larchEvery: 3,
  lhDx: 10, stairRise: 10, lhH: 96,
  mountX: 300, mountH: 64, mountW: 380, hills: 28, slope: 4, cliffs: 3,
  moonX: 200, moonY: 78, moonR: 10,
  shopsX: 470, shops: 4, inn: 2, camelliaX: 500,
  shotOpen: 0, shotDoor: 300, shotTower: 20, towerUp: 40,
  pSky: 0, pMount: 0.1, pHills: 0.3, pFore: 1
};
// Sizes the tool drew without people to measure against, set here to fit a 30 px woman (see the brief).
const SIZE = {
  treeH: 38,        // conifers in pots; larches are 0.8 of this (tool: 18)
  lhW: 18,          // lighthouse width, so she fits through its door (tool: 10)
  rail: 12,         // railing height above the deck
  doorW: 10, doorH: 33,   // the lighthouse door
  innDoorW: 16, innDoorH: 34
};
const pct = (v) => v / 100 * H;
const RIVER_Y = pct(LAY.river);          // far water line (world y)
const WATER_Y = RIVER_Y - 3;             // where piers, banks and the lighthouse meet the water: reflections mirror here
const STREET_Y = Math.round(pct(LAY.rightY));   // the town's street, level with the bridge's right end
const LH = H + LAY.headroom;             // world height covered by the layers

// ------------------------------------------------------------------ palette
// families keep colours apart: her hair, cloak and tunic, and skin, only ever remap among themselves
const PAL = [
  ['BLK', '07060a'], ['INK', '120f1c'],
  ['SK0', '0b0916'], ['SK1', '100d1d'], ['SK2', '151126'], ['SK3', '1a1530'], ['SK4', '201a3a'], ['SK5', '261f43'], ['SK6', '2c234b'],
  ['STAR', 'cfc8e6'], ['MOON', 'e4def4'], ['MOONS', 'b4aad6'], ['HALO', '3e3466'],
  ['MT0', '1d1733'], ['MT1', '272043'], ['MT2', '3a3160'], ['SNOW0', '6f6898'], ['SNOW1', 'a9a3c8'],
  ['HL0', '111a1d'], ['HL1', '172426'], ['HL2', '1f312f'], ['HL3', '2b4238'],
  ['CL0', '35203d'], ['CL1', '4f2c4b'], ['CL2', '6b3b5a'],
  ['W0', '05070c'], ['W1', '0b111d'], ['W2', '121b2e'], ['W3', '1c2a45'], ['W4', '34466c'],
  ['G0', '4c5276'], ['G1', '7a82a8'], ['G2', 'b3bbd8'], ['G3', 'e8ebf8'],
  ['AM0', '5a3820'], ['AM1', 'a8682e'], ['AM2', 'f0b464'], ['AM3', 'ffe4ae'],
  ['PH0', '1f4a48'], ['PH1', '3f9a88'], ['PH2', '8fe3c8'], ['PH3', 'd8fff0'],
  ['ST0', '2e2a40'], ['ST1', '4e4968'], ['ST2', '7f7a9c'], ['ST3', 'b9b4cc'],
  ['WL0', '1a1524'], ['WL1', '251e33'], ['WL2', '332a45'], ['WL3', '45395a'],
  ['WD0', '2a1a20'], ['WD1', '43292c'],
  ['LF0', '16231c'], ['LF1', '22362a'], ['BL0', '8c3f58'], ['BL1', 'd77a8e'],
  ['LA0', '7a6428'], ['LA1', 'cfae48'],
  ['SKN0', 'e8c0a0', 'skin'], ['SKN1', 'b88466', 'skin'], ['SKN2', '7a4e42', 'skin'],
  ['HR0', '5a2219', 'hair'], ['HR1', '93402a', 'hair'], ['HR2', 'c8714a', 'hair'],
  ['CK0', '35101a', 'cloak'], ['CK1', '621a26', 'cloak'], ['CK2', '8f2c36', 'cloak'],
  ['TU0', '1f4f72', 'tunic'], ['TU1', '3f86b8', 'tunic'], ['TU2', '82bde0', 'tunic'],
  ['KA0', '4a3d32'], ['KA1', '6e5c48'], ['KB0', '343c50'], ['KB1', '505c76'], ['KH', '2a1e1a'],
  ['PM0', '9e9584'], ['PM1', '6a6458'], ['PW0', '3a4a3e'], ['PS0', '47334a'], ['PS1', '5e5a6a'], ['GRY', '8e8a98'],
  ['BT0', '1d1828'], ['BT1', '30293f'], ['BT2', '4a4060'], ['FUN', '5a2a2e'], ['SMK', '2c2740']
];
const PAL_HEX = PAL.map(p => p[1]);
const PAL_FAM = PAL.map(p => p[2] || '');
const NPAL = PAL.length;
/** @type {Record<string, number>} */
const C = {};
PAL.forEach((p, i) => { C[p[0]] = i; });

// ------------------------------------------------------------------ light (palette remaps from colour rules)
const rgbOf = (n) => { const v = parseInt(PAL_HEX[C[n]], 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scl = (a, k, add) => [a[0] * k + add[0], a[1] * k + add[1], a[2] * k + add[2]];
const LIT = paletteMap(PAL_HEX, PAL_FAM, c => scl(c, 1.3, [34, 18, 0]));              // warm lamp light
const SHD = paletteMap(PAL_HEX, PAL_FAM, c => scl(c, 0.68, [0, 0, 4]));               // cool shadow
const GLASS = paletteMap(PAL_HEX, PAL_FAM, c => scl(mix(c, rgbOf('G1'), 0.2), 1.12, [4, 4, 10]));   // seen through the bridge
const GLASS2 = paletteMap(PAL_HEX, PAL_FAM, c => scl(mix(c, rgbOf('G1'), 0.1), 1.06, [2, 2, 6]));   // through a railing panel
const REFL = paletteMap(PAL_HEX, PAL_FAM, c => mix(scl(c, 0.62, [0, 0, 0]), rgbOf('W2'), 0.35));     // mirrored in the river
const BEAM = paletteMap(PAL_HEX, PAL_FAM, c => scl(mix(c, rgbOf('G2'), 0.16), 1.1, [6, 6, 10]));   // lamp beams, spotlights
const PHOS = paletteMap(PAL_HEX, PAL_FAM, c => scl(c, 1.1, [8, 34, 26]));             // the bridge's inner glow, fireflies
const RIM = paletteMap(PAL_HEX, PAL_FAM, c => mix(c, rgbOf('MOON'), 0.3));            // moonlight on an edge

// ------------------------------------------------------------------ layer ids (light masks)
const L = { NONE: 0, SKY: 1, MOUNT: 2, HILL: 3, WATER: 4, BANK: 5, TOWER: 6, BRIDGE: 7, TREE: 8, TOWN: 9, WIN: 10,
            PEOPLE: 11, BOAT: 12, FLY: 13, LAMP: 14 };
const bit = (...ids) => ids.reduce((m, i) => m | (1 << i), 0);
const M_ALL = 0x7fffffff;
const M_AIR = bit(L.SKY, L.MOUNT, L.HILL, L.WATER);                          // what a beam of light shows up against
const M_SOLID = bit(L.BANK, L.TOWER, L.BRIDGE, L.TREE, L.TOWN, L.PEOPLE, L.BOAT);
