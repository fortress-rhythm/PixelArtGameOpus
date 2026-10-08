// @ts-check
// =================================================================== NIGHT BRIDGE: THE WORLD (built once)
// ------------------------------------------------------------------ bridge geometry (the layout tool's formulas)
const TOP_Y = pct(LAY.peakY);
const A_L = (TOP_Y - pct(LAY.leftY)) / Math.max(1, (LAY.peakX - LAY.leftX) ** 2);
const A_R = (TOP_Y - pct(LAY.rightY)) / Math.max(1, (LAY.rightX - LAY.peakX) ** 2);
const ARCH_L = LAY.leftX + LAY.approach, ARCH_R = LAY.rightX - LAY.approach;
/** world y of the walking surface at x: two half-parabolas meeting at the top, then the street */
function deck(x) {
  if (x >= LAY.rightX) return STREET_Y;
  if (x <= LAY.leftX) return pct(LAY.leftY);
  return TOP_Y - (x <= LAY.peakX ? A_L : A_R) * (x - LAY.peakX) ** 2;
}
/** how far the arch hangs below the deck: thin at the top, deep near the ends (hyperbola-shaped) */
function depthAt(x) {
  const span = x <= LAY.peakX ? LAY.peakX - ARCH_L : ARCH_R - LAY.peakX;
  const u = Math.min(1, Math.abs(x - LAY.peakX) / Math.max(1, span)), k = LAY.sharp;
  return LAY.thickTop + (LAY.thickEnd - LAY.thickTop) * (Math.sqrt(1 + (u * k) ** 2) - 1) / (Math.sqrt(1 + k * k) - 1);
}
const under = (x) => deck(x) - depthAt(x);
const LH_X = LAY.peakX + LAY.lhDx;                         // lighthouse centre
const LH_DOOR = Math.round(deck(LAY.peakX) + LAY.stairRise);   // world y of its doorstep
const LH_TOP = LH_DOOR + LAY.lhH;                          // the gallery
const STAIR_X0 = LAY.peakX - 6, STAIR_X1 = LH_X + 6;      // the far railing's gap for the stairs

// ------------------------------------------------------------------ layers in world coordinates
// A layer covers world x from x0 and world y from 0 (the bottom of the opening shot) up to its height.
/** @param {number} x0 @param {number} w @param {number} h @param {number} f @param {number} id */
function worldLayer(x0, w, h, f, id) { return Object.assign(makeLayer(w, h, f, id), { x0 }); }
function wset(ly, x, y, c, id) { lset(ly, Math.round(x) - ly.x0, ly.h - 1 - Math.round(y), c, id); }
function wget(ly, x, y) { return lget(ly, Math.round(x) - ly.x0, ly.h - 1 - Math.round(y)); }
// screen position of a world point on a layer moving at f, for the camera at (cx, cu)
const scrX = (x, f, cx) => Math.round(x) - Math.round(cx * f);
const scrY = (y, f, cu) => H - 1 - Math.round(y) + Math.round(cu * f);
function blitWorld(ly, cx, cu) { blit(ly, Math.round(cx * ly.f) - ly.x0, ly.h - H - Math.round(cu * ly.f)); }

const skyL = worldLayer(0, W, H, LAY.pSky, L.SKY);
const mountL = worldLayer(-10, W + 80, LH, LAY.pMount, L.MOUNT);
const hillL = worldLayer(-10, W + 160, LH, LAY.pHills, L.HILL);
const worldL = worldLayer(-40, LAY.worldW + 140, LH, 1, L.WATER);     // water, banks, lighthouse, town
const bridgeL = worldLayer(-40, LAY.worldW + 140, LH, 1, L.BRIDGE);   // the bridge's lines, pots and trees
const camelliaL = worldLayer(-40, LAY.worldW + 140, LH, LAY.pFore, L.TREE);
const glassMask = new Uint8Array(worldL.w * worldL.h);                // 1 bridge body, 2 far railing panel
function glassAt(x, y, v) {
  const lx = Math.round(x) - worldL.x0, ly = worldL.h - 1 - Math.round(y);
  if (lx >= 0 && ly >= 0 && lx < worldL.w && ly < worldL.h) glassMask[ly * worldL.w + lx] = v;
}

// ------------------------------------------------------------------ sky and moon (fixed on screen)
const SKY_BANDS = [C.SK6, C.SK5, C.SK4, C.SK3, C.SK2, C.SK1, C.SK0];
const MOON_X = LAY.moonX, MOON_Y = pct(LAY.moonY);
function buildSky() {
  for (let y = 0; y < H; y++) {
    const v = Math.min(SKY_BANDS.length - 1.001, (y / H) * 1.25 * SKY_BANDS.length - 1.2);
    for (let x = 0; x < W; x++) {
      const i = Math.max(0, Math.floor(v)), c = bay(x, y) < v - i ? Math.min(i + 1, SKY_BANDS.length - 1) : i;
      wset(skyL, x, y, SKY_BANDS[c], L.SKY);
    }
  }
  const R = LAY.moonR;
  for (let dy = -R - 9; dy <= R + 9; dy++) for (let dx = -R - 9; dx <= R + 9; dx++) {
    const d = Math.hypot(dx, dy), x = MOON_X + dx, y = MOON_Y + dy;
    if (d <= R) {
      const crater = hash(Math.round(dx / 3) + 40, Math.round(dy / 3) + 7) < 0.22 && d < R - 1.5;
      wset(skyL, x, y, d > R - 1 || crater ? C.MOONS : C.MOON, L.SKY);
    } else if (bay(x, y) < 0.55 * (1 - (d - R) / 9)) wset(skyL, x, y, C.HALO, L.SKY);
  }
}

// ------------------------------------------------------------------ mountain, hills, cliffs
const hillBase = (x) => pct(LAY.hills) + pct(LAY.slope) * (x / LAY.worldW - 0.5);
function mountainShape(u) {                     // 0..1 across a broad cone, flat-topped, a shoulder on the right
  const a = Math.abs(u);
  if (a >= 1) return 0;
  let s = u < 0 ? 1 - Math.pow(a, 1.55) : 1 - Math.pow(a, 1.3);
  s += 0.07 * Math.exp(-(((u - 0.42) / 0.11) ** 2));
  return Math.min(0.96, s);
}
function buildMountain() {
  const top = pct(LAY.mountH), half = LAY.mountW / 2;
  for (let x = mountL.x0; x < mountL.x0 + mountL.w; x++) {
    const u = (x - LAY.mountX) / half, s = mountainShape(u);
    if (s <= 0) continue;
    const base = hillBase(x) - 6, h = base + (top - base) * s;
    const snowLine = top - 14 - 5 * hash(Math.floor(x / 3), 3) - 3 * Math.sin(x / 5);
    for (let y = 0; y <= h; y++) {
      const lit = u > 0.05 + 0.04 * Math.sin(y / 3), snow = y > snowLine;
      let c = snow ? (lit ? C.SNOW1 : C.SNOW0) : (lit ? C.MT2 : C.MT1);
      if (!snow && y < base + 12 && bay(x, y) < (base + 12 - y) / 12) c = C.MT0;
      wset(mountL, x, y, c, L.MOUNT);
    }
  }
}
const hillTop = (x) => hillBase(x) + 6 * Math.sin(x / 37) + 4 * Math.sin(x / 13 + 1);
function buildHills() {
  for (let x = hillL.x0; x < hillL.x0 + hillL.w; x++) {
    const h = hillTop(x);
    for (let y = 0; y <= h; y++) {
      const d = h - y;           // depth below the crest
      const c = d < 1 ? C.HL3 : d < 3 + 2 * bay(x, y) ? C.HL2 : (Math.floor(x / 45) & 1) ? C.HL1 : C.HL0;
      wset(hillL, x, y, c, L.HILL);
    }
  }
  for (let k = 0; k < LAY.cliffs; k++) {            // violet-plum earth showing through
    const cx = ((k + 0.5) / LAY.cliffs) * LAY.worldW * 0.9 + 20, h = hillTop(cx) - 1;
    for (let r = 0; r < 12; r++) {
      const w = 12 - r * 0.7, x0 = cx - 7 + r * 0.5;
      for (let x = Math.round(x0); x < x0 + w; x++)
        wset(hillL, x, h - r, r % 4 === 3 || bay(x, r) < 0.3 ? C.CL0 : x > x0 + w - 3 ? C.CL2 : C.CL1, L.HILL);
    }
  }
}

// ------------------------------------------------------------------ water, banks, lighthouse, town
const SHOP_W = [46, 66, 52, 50], SHOP_H = [64, 92, 70, 58];
/** @type {{x: number, w: number, h: number, inn: boolean}[]} */
const SHOPS = [];
{ let x = LAY.shopsX; for (let i = 0; i < LAY.shops; i++) { const w = SHOP_W[i % 4]; SHOPS.push({ x, w, h: SHOP_H[i % 4], inn: i + 1 === LAY.inn }); x += w + 6; } }
const INN = SHOPS.find(s => s.inn) || SHOPS[0];
const INN_DOOR_X = INN.x + Math.round(INN.w * 0.42), INN_WIN_X = INN_DOOR_X + 2, INN_WIN_Y = STREET_Y + 58;
const INN_LAMP_X = INN_DOOR_X - SIZE.innDoorW / 2 - 4, INN_LAMP_Y = STREET_Y + 30;

function buildWater() {
  for (let x = worldL.x0; x < worldL.x0 + worldL.w; x++) for (let y = 0; y < RIVER_Y; y++) {
    const v = y / RIVER_Y + 0.25 * bay(x, y);      // lighter towards the far water, where it catches the sky
    wset(worldL, x, y, v > 0.9 ? C.W2 : v > 0.45 ? C.W1 : C.W0, L.WATER);
  }
}
function buildBanks() {
  const wall = (x0, x1) => {
    for (let x = x0; x < x1; x++) for (let y = Math.floor(WATER_Y); y <= STREET_Y; y++) {
      const course = Math.floor((y - WATER_Y) / 4), joint = (x + course * 5) % 11 === 0 || (y - Math.floor(WATER_Y)) % 4 === 0;
      wset(worldL, x, y, y >= STREET_Y - 1 ? C.ST2 : joint ? C.ST0 : C.ST1, L.BANK);
    }
  };
  wall(LAY.rightX - 2, worldL.x0 + worldL.w);
  wall(worldL.x0, LAY.leftX + 2);
}
function buildLighthouse() {
  for (let x = LH_X - 15; x <= LH_X + 15; x++) {                // the rock it stands on
    const h = WATER_Y + 7 - Math.abs(x - LH_X) * 0.4 + 2 * hash(x, 9);
    for (let y = WATER_Y - 1; y <= h; y++) wset(worldL, x, y, hash(x >> 1, y >> 1) < 0.3 ? C.ST0 : C.ST1, L.TOWER);
  }
  for (let y = Math.floor(WATER_Y + 4); y <= LH_TOP; y++) {     // the tower, tapering
    const half = (SIZE.lhW / 2) * (1 - 0.22 * (y - WATER_Y) / (LH_TOP - WATER_Y)), band = Math.abs(y - (LH_DOOR + LAY.lhH * 0.55)) < 3;
    for (let x = Math.round(LH_X - half); x <= Math.round(LH_X + half); x++) {
      const u = (x - LH_X) / half;                                // the moon is to the right
      let c = band ? (u > 0.1 ? C.ST2 : C.ST1) : u > 0.15 ? C.ST3 : u > -0.45 ? C.ST2 : C.ST1;
      if (Math.abs(u) > 0.9) c = C.ST1;
      if (y < deck(x) + 4) c = u > 0.15 ? C.ST1 : C.ST0;           // below the deck: behind the bridge, in its shadow
      wset(worldL, x, y, c, L.TOWER);
    }
  }
  for (const wy of [LH_DOOR + 46, LH_DOOR + 70]) for (let y = wy; y < wy + 5; y++) wset(worldL, LH_X + 1, y, C.WL0, L.TOWER);
  for (let x = LH_X - 9; x <= LH_X + 9; x++) { wset(worldL, x, LH_TOP + 1, C.G2, L.TOWER); wset(worldL, x, LH_TOP + 3, C.G1, L.TOWER); }
  for (let y = LH_TOP + 4; y <= LH_TOP + 12; y++) for (let x = LH_X - 5; x <= LH_X + 5; x++)       // the lamp room
    wset(worldL, x, y, Math.abs(x - LH_X) === 5 || x === LH_X ? C.G0 : C.WL1, L.TOWER);
  for (let r = 0; r < 5; r++) for (let x = LH_X - 6 + r; x <= LH_X + 6 - r; x++) wset(worldL, x, LH_TOP + 13 + r, r === 0 ? C.ST1 : C.ST0, L.TOWER);
  wset(worldL, LH_X, LH_TOP + 18, C.G2, L.TOWER); wset(worldL, LH_X, LH_TOP + 19, C.G2, L.TOWER);
  // the door, its arch, the lock
  const dw = SIZE.doorW / 2;
  for (let y = LH_DOOR; y < LH_DOOR + SIZE.doorH; y++) for (let x = LH_X - dw; x < LH_X + dw; x++) {
    const arch = y - LH_DOOR > SIZE.doorH - 4 && Math.hypot(x + 0.5 - LH_X, (y - (LH_DOOR + SIZE.doorH - 4)) * 1.3) > dw;
    if (!arch) wset(worldL, x, y, (x - LH_X + dw) % 3 === 0 ? C.WD0 : C.WD1, L.TOWER);
  }
  wset(worldL, LH_X + dw - 2, LH_DOOR + 15, C.AM1, L.TOWER);
  // the stairs from the top of the deck, climbing away from us to the door
  const n = Math.max(2, Math.round(LAY.stairRise / 2));
  for (let s = 0; s <= n; s++) {
    const t = s / n, cx = LAY.peakX + (LH_X - LAY.peakX) * t, y = lerp(deck(LAY.peakX) + 4, LH_DOOR, t), w = 12 - t * 3;
    for (let x = Math.round(cx - w / 2); x <= Math.round(cx + w / 2); x++) { wset(worldL, x, y, C.G1, L.BRIDGE); wset(worldL, x, y - 1, C.ST1, L.BRIDGE); }
  }
}
function buildTown() {
  for (const s of SHOPS) {
    const y0 = STREET_Y + 1;
    for (let y = y0; y < y0 + s.h; y++) for (let x = s.x; x < s.x + s.w; x++)
      wset(worldL, x, y, x >= s.x + s.w - 2 ? C.WL2 : x === s.x ? C.WL0 : C.WL1, L.TOWN);
    for (let x = s.x - 2; x < s.x + s.w + 2; x++) { wset(worldL, x, y0 + s.h, C.WL3, L.TOWN); wset(worldL, x, y0 + s.h + 1, C.WL2, L.TOWN); }
    for (let r = 0; r < 7; r++) for (let x = s.x + r; x < s.x + s.w - r; x++) wset(worldL, x, y0 + s.h + 2 + r, r ? C.BT0 : C.BT1, L.TOWN);
    // windows: a shop window below, smaller ones above (the inn's are lit dynamically)
    const rows = s.h > 80 ? [y0 + 36, y0 + 58] : [y0 + 36];
    for (const wy of rows) for (let wx = s.x + 6; wx + 8 <= s.x + s.w - 4; wx += 15) {
      if (s.inn && Math.abs(wx + 4 - INN_WIN_X) < 9 && wy === y0 + 58) continue;
      const lit = hash(wx, wy) < 0.3;
      for (let y = wy; y < wy + 10; y++) for (let x = wx; x < wx + 8; x++)
        wset(worldL, x, y, x === wx + 3 ? C.WL2 : lit ? (y < wy + 3 ? C.AM1 : C.AM0) : C.WL0, L.WIN);
    }
    if (!s.inn) for (let y = y0; y < y0 + 26; y++) for (let x = s.x + 6; x < s.x + 18; x++) wset(worldL, x, y, x === s.x + 6 ? C.WD1 : hash(x, 3) < 0.2 ? C.WL0 : C.WL1, L.TOWN);
    else for (let y = y0; y < y0 + 26; y++) for (let x = s.x + s.w - 16; x < s.x + s.w - 5; x++) wset(worldL, x, y, y > y0 + 12 ? C.AM0 : C.AM1, L.WIN);
  }
  // the inn's door, its sign and its lamp
  const dw = SIZE.innDoorW / 2;
  for (let y = STREET_Y + 1; y <= STREET_Y + SIZE.innDoorH; y++) for (let x = INN_DOOR_X - dw - 1; x <= INN_DOOR_X + dw; x++)
    wset(worldL, x, y, x === INN_DOOR_X - dw - 1 || x === INN_DOOR_X + dw || y === STREET_Y + SIZE.innDoorH ? C.WL3 : x === INN_DOOR_X ? C.WD0 : C.WD1, L.TOWN);
  for (let y = INN_WIN_Y; y < INN_WIN_Y + 12; y++) for (let x = INN_WIN_X - 5; x <= INN_WIN_X + 5; x++)
    wset(worldL, x, y, x === INN_WIN_X - 5 || x === INN_WIN_X + 5 || y === INN_WIN_Y ? C.WL3 : C.WL0, L.WIN);
  for (let y = INN_LAMP_Y; y < INN_LAMP_Y + 5; y++) wset(worldL, INN_LAMP_X - 2, y + 3, C.ST1, L.TOWN);
  for (let x = INN_LAMP_X - 2; x <= INN_LAMP_X; x++) wset(worldL, x, INN_LAMP_Y + 8, C.ST1, L.TOWN);
  for (let y = STREET_Y + 38; y < STREET_Y + 45; y++) for (let x = INN_DOOR_X - 12; x <= INN_DOOR_X + 12; x++)
    wset(worldL, x, y, y === STREET_Y + 38 || y === STREET_Y + 44 ? C.WD0 : C.AM0, L.TOWN);
}
function buildCamellia() {
  const x0 = LAY.camelliaX, g = STREET_Y + 1;
  for (let y = g; y < g + 52; y++) { wset(camelliaL, x0, y, C.WD0, L.TREE); if (y < g + 30) wset(camelliaL, x0 + 1, y, C.WD1, L.TREE); }
  for (let k = 0; k < 8; k++) {                                   // a few round masses of leaves, with gaps for the moon
    const cx = x0 + (hash(k, 1) - 0.5) * 30, cy = g + 60 + hash(k, 2) * 42, r = 7 + hash(k, 3) * 7;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r * 1.3; dx <= r * 1.3; dx++) {
      const d = Math.hypot(dx / 1.3, dy) / r;
      if (d > 1 || hash(Math.round(cx + dx), Math.round(cy + dy) + 50) < 0.18 * d) continue;
      const lit = dx > r * 0.3 && dy > -2;
      const bloom = hash(Math.round(cx + dx) * 3, Math.round(cy + dy)) < 0.045;
      wset(camelliaL, cx + dx, cy + dy, bloom ? (lit ? C.BL1 : C.BL0) : lit ? C.LF1 : C.LF0, L.TREE);
    }
  }
}

// ------------------------------------------------------------------ the bridge
/** @type {{x: number, larch: boolean, h: number}[]} */
const TREES = [];
const LAMPS = [];        // x positions along the near railing
const GLOWS = [];        // [x, y] inside the girders
function buildBridge() {
  const x0 = Math.ceil(LAY.leftX), x1 = Math.floor(LAY.rightX);
  for (let x = x0; x <= x1; x++) {
    const d = deck(x), inArch = x >= ARCH_L && x <= ARCH_R, u = inArch ? under(x) : WATER_Y;
    for (let y = Math.ceil(u); y < d - 1; y++) glassAt(x, y, 1);
    if (x < STAIR_X0 || x > STAIR_X1) for (let y = Math.round(d + 3); y < d + 3 + SIZE.rail; y++) glassAt(x, y, 2);
    wset(bridgeL, x, d, C.G3, L.BRIDGE); wset(bridgeL, x, d - 1, C.G2, L.BRIDGE);
    if (inArch) { wset(bridgeL, x, u, C.G1, L.BRIDGE); wset(bridgeL, x, u - 1, C.G0, L.BRIDGE); }
    if (x < STAIR_X0 || x > STAIR_X1) {
      wset(bridgeL, x, d + 3 + SIZE.rail, C.G1, L.BRIDGE);                         // far railing
      if (x % 9 === 0) for (let y = d + 3; y < d + 3 + SIZE.rail; y++) wset(bridgeL, x, y, C.G0, L.BRIDGE);
    }
  }
  // end spans: piers to the water, arched openings (clear glass), and the pier lines
  for (const side of [0, 1]) {
    const a = side ? ARCH_R : LAY.leftX, b = side ? LAY.rightX : ARCH_L;
    for (let y = WATER_Y; y < deck(side ? a : b) - 1; y++) for (const px of [side ? a : b, (side ? a : b) + (side ? -1 : 1)]) wset(bridgeL, px, y, C.G1, L.BRIDGE);
    for (let o = 0; o < LAY.openings; o++) {
      const ow = (b - a) / (LAY.openings + 0.5), oc = a + (o + 0.75) * ow, r = ow * 0.32, top = deck(oc) - 7 - r;
      for (let x = Math.round(oc - r); x <= Math.round(oc + r); x++) {
        const yTop = top + Math.sqrt(Math.max(0, r * r - (x - oc) ** 2));
        for (let y = WATER_Y; y <= yTop; y++) glassAt(x, y, 0);
        wset(bridgeL, x, yTop, C.G1, L.BRIDGE);
      }
      for (let y = WATER_Y; y <= top; y++) { wset(bridgeL, oc - r, y, C.G0, L.BRIDGE); wset(bridgeL, oc + r, y, C.G0, L.BRIDGE); }
    }
  }
  // girders: alternating diagonals between the deck and the arch
  const gx = (i) => ARCH_L + (ARCH_R - ARCH_L) * i / LAY.panels;
  for (let i = 0; i < LAY.panels; i++) {
    const a = gx(i), b = gx(i + 1), up = i % 2 === 0;
    const [xa, ya, xb, yb] = up ? [a, deck(a) - 2, b, under(b) + 1] : [a, under(a) + 1, b, deck(b) - 2];
    const n = Math.ceil(Math.max(Math.abs(xb - xa), Math.abs(yb - ya)));
    for (let k = 0; k <= n; k++) wset(bridgeL, xa + (xb - xa) * k / n, ya + (yb - ya) * k / n, C.G1, L.BRIDGE);
    wset(bridgeL, a, deck(a) - 2, C.G2, L.BRIDGE);
  }
  for (let i = 0; i < LAY.glowN; i++) { const x = ARCH_L + (ARCH_R - ARCH_L) * (i + 0.5) / LAY.glowN; GLOWS.push([x, (deck(x) + under(x)) / 2]); }
  for (let x = LAY.leftX + 4; x < LAY.rightX; x += LAY.lampEvery) LAMPS.push(x);
  // trees in translucent pots along the far railing, none at the top where the stairs are
  for (let i = 0; i < LAY.trees; i++) {
    let x = LAY.leftX + 20 + (LAY.rightX - LAY.leftX - 40) * (i + 0.5) / LAY.trees;
    if (x > STAIR_X0 - 8 && x < STAIR_X1 + 8) x = x < LAY.peakX ? STAIR_X0 - 8 : STAIR_X1 + 8;
    const larch = (i + 1) % LAY.larchEvery === 0;
    TREES.push({ x: Math.round(x), larch, h: Math.round(SIZE.treeH * (larch ? 0.8 : 1) * (0.9 + 0.2 * hash(i, 5))) });
  }
  for (const t of TREES) {
    const y0 = deck(t.x) + 4;
    for (let x = t.x - 3; x <= t.x + 3; x++) { wset(bridgeL, x, y0, C.G1, L.TREE); wset(bridgeL, x, y0 + 3, C.G2, L.TREE); }
    for (let x = t.x - 2; x <= t.x + 2; x++) { wset(bridgeL, x, y0 + 1, C.G0, L.TREE); wset(bridgeL, x, y0 + 2, C.WD0, L.TREE); }
    wset(bridgeL, t.x - 1, y0 + 4, C.WD1, L.TREE); wset(bridgeL, t.x, y0 + 4, C.WD1, L.TREE); wset(bridgeL, t.x + 1, y0 + 4, C.WD0, L.TREE);
    for (let r = 0; r < t.h; r++) {
      const v = r / t.h, w = t.larch ? 2.6 * (1 - v) + 0.6 + (r % 3 === 0 ? 0.8 : 0) : 1.9 * (1 - v * v) + 0.4;
      for (let x = Math.round(t.x - w); x <= Math.round(t.x + w); x++) {
        const lit = x > t.x;
        wset(bridgeL, x, y0 + 5 + r, t.larch ? (lit && (r + x) % 3 ? C.LA1 : C.LA0) : (lit ? C.HL3 : x === t.x ? C.LF1 : C.LF0), L.TREE);
      }
    }
    for (let k = 0; k < 3; k++) {                                // roots creeping down the glass
      let x = t.x - 2 + k * 2;
      const len = 3 + Math.round(hash(t.x, k) * 6);
      for (let r = 0; r < len; r++) { if (hash(t.x + r, k + 9) < 0.35) x += k - 1; wset(bridgeL, x, deck(x) - 2 - r, C.WD0, L.TREE); }
    }
  }
}
