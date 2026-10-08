// @ts-check
// =================================================================== NIGHT BRIDGE: LIGHTS
// Light is a palette remap applied through a dithered falloff, only to the layers in mask.
function lightPool(cx, cy, rx, ry, strength, mask, map) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1 && bay(x, y) < strength * (1 - d)) premap(x, y, map, mask);
  }
}

// ------------------------------------------------------------------ stars (fixed on screen, twinkling)
const STARS = [];
function buildStars() {
  for (let i = 0; STARS.length < 70 && i < 400; i++) {
    const x = Math.floor(hash(i, 11) * W), y = Math.floor(hash(i, 12) * hash(i, 13) * 120);
    if (Math.hypot(x - MOON_X, (H - 1 - y) - MOON_Y) < LAY.moonR + 14) continue;
    STARS.push([x, y, 3 + (i % 7), hash(i, 14)]);
  }
}
function drawStars(t) {
  for (const [x, y, k, ph] of STARS) if (lid[y * W + x] === L.SKY) {
    const v = osc(k, t, ph);
    if (v > -0.3) pset(x, y, v > 0.6 ? C.STAR : C.SNOW0, L.SKY);
  }
}

// ------------------------------------------------------------------ the bridge's own light
function drawGlows(t, cx, cu) {
  for (let i = 0; i < GLOWS.length; i++) {
    const [x, y] = GLOWS[i], sx = scrX(x, 1, cx), sy = scrY(y, 1, cu), br = 0.75 + 0.2 * osc(2, t, i / GLOWS.length);
    lightPool(sx, sy, 9, 6, br * 0.8, M_ALL & ~bit(L.PEOPLE), PHOS);
    pset(sx, sy, C.PH3, L.LAMP); pset(sx + 1, sy, C.PH2, L.LAMP); pset(sx, sy + 1, C.PH2, L.LAMP); pset(sx - 1, sy, C.PH1, L.LAMP);
  }
}
const SPOTS = [[ARCH_L + 6, -0.25, 0.1], [ARCH_R - 6, 0.3, 0.6], [LH_X + 16, -0.5, 0.35]];   // [x, lean, sway phase]
function drawSpots(t, cx, cu) {
  for (let i = 0; i < Math.min(LAY.spots, SPOTS.length); i++) {
    const [x0, lean, ph] = SPOTS[i], tx = x0 + lean * 90 + 10 * osc(1, t, ph);
    const sx0 = scrX(x0, 1, cx), sy0 = scrY(WATER_Y + 1, 1, cu), sx1 = scrX(tx, 1, cx), sy1 = scrY(under(tx), 1, cu);
    for (let y = Math.min(sy0, sy1); y <= Math.max(sy0, sy1); y++) {
      const v = (y - sy0) / (sy1 - sy0 || 1), cxl = lerp(sx0, sx1, v), half = 1 + v * 11;
      for (let x = Math.round(cxl - half); x <= Math.round(cxl + half); x++) {
        const edge = 1 - Math.abs(x - cxl) / half;
        if (bay(x, y) < 0.42 * edge * (0.4 + 0.6 * v)) premap(x, y, BEAM, M_AIR);
      }
    }
    pset(sx0, sy0, C.AM3, L.LAMP); pset(sx0 + 1, sy0, C.AM2, L.LAMP);
  }
}
// the near railing, over the people: a glass panel, its top rail, posts and lamps
function drawNearRailing(cx, cu) {
  for (let x = 0; x < W; x++) {
    const wx = x + Math.round(cx);
    if (wx < LAY.leftX || wx > LAY.rightX) continue;
    const d = deck(wx), top = scrY(d + 1 + SIZE.rail, 1, cu), bot = scrY(d + 1, 1, cu);
    for (let y = top + 1; y <= bot; y++) premap(x, y, GLASS2, M_ALL);
    pset(x, top, C.G2, L.BRIDGE);
    if (wx % 9 === 4) for (let y = top + 1; y <= bot; y++) pset(x, y, C.G0, L.BRIDGE);
  }
  for (const lx of LAMPS) {
    const sx = scrX(lx, 1, cx);
    if (sx < -8 || sx > W + 8) continue;
    const top = scrY(deck(lx) + 1 + SIZE.rail, 1, cu);
    pset(sx, top - 1, C.G1, L.LAMP); pset(sx, top - 2, C.AM2, L.LAMP); pset(sx, top - 3, C.AM3, L.LAMP); pset(sx + 1, top - 2, C.AM1, L.LAMP);
    lightPool(sx, top - 2, 7, 6, 0.75, bit(L.PEOPLE, L.TREE, L.BRIDGE), LIT);
  }
}

// ------------------------------------------------------------------ the lighthouse lamp and its beam
function drawLighthouseLamp(t, cx, cu) {
  const on = lampOn(t), sx = scrX(LH_X, 1, cx), sy = scrY(LH_TOP + 8, 1, cu);
  if (!on) return;
  for (let y = sy - 3; y <= sy + 4; y++) for (let x = sx - 4; x <= sx + 4; x++) if (x !== sx - 4 && x !== sx + 4) pset(x, y, Math.abs(x - sx) + Math.abs(y - sy) < 3 ? C.AM3 : C.AM2, L.LAMP);
  lightPool(sx, sy, 14, 11, 0.8, M_AIR, BEAM);
  // the beam turns three times a loop; seen from the side it is longest when it points along the river bank
  const fade = ramp(t, LAMP_T + 0.6, LAMP_T + 2.0), a = TAU * (3 * t / LOOP_S), c = Math.cos(a), toward = Math.sin(a);
  if (fade <= 0) return;
  const len = 260 * Math.abs(c), dir = c >= 0 ? 1 : -1;
  for (let k = 3; k < len; k++) {
    const x = sx + dir * k, half = 1.5 + k * 0.09, v = 1 - k / len;
    for (let y = Math.round(sy - half); y <= Math.round(sy + half); y++)
      if (bay(x, y) < fade * (0.35 + 0.6 * v) * (1 - Math.abs(y - sy) / (half + 1))) premap(x, y, BEAM, M_AIR);
  }
  if (toward > 0.8) lightPool(sx, sy, 6 + 30 * (toward - 0.8), 5 + 22 * (toward - 0.8), fade * 0.9, M_ALL, BEAM);   // it sweeps past us
}
function drawTowerDoor(t, cx, cu) {
  const o = doorOpen(TOWER_DOOR, t);
  if (o <= 0) return;
  const sx = scrX(LH_X, 1, cx), y0 = scrY(LH_DOOR, 1, cu), dw = SIZE.doorW / 2, w = Math.round(SIZE.doorW * o);
  for (let y = y0 - SIZE.doorH + 4; y <= y0; y++) for (let x = Math.round(sx - dw); x < Math.round(sx - dw) + w; x++) pset(x, y, x === Math.round(sx - dw) + w - 1 ? C.WD1 : C.BLK, L.TOWER);
}

// ------------------------------------------------------------------ the inn
function drawInn(t, cx, cu) {
  const o = doorOpen(INN_DOOR, t), dx = scrX(INN_DOOR_X, 1, cx), y0 = scrY(STREET_Y + 1, 1, cu), dw = SIZE.innDoorW / 2;
  if (o > 0) {                                     // the open door: warm light inside, the leaf folded back
    const w = Math.round((SIZE.innDoorW) * o);
    for (let y = y0 - SIZE.innDoorH + 1; y <= y0; y++) for (let x = Math.round(dx - dw); x < Math.round(dx - dw) + w; x++)
      pset(x, y, x < Math.round(dx - dw) + 2 ? C.WD1 : bay(x, y) < (y - y0 + SIZE.innDoorH) / SIZE.innDoorH ? C.AM1 : C.AM0, L.WIN);
    lightPool(dx, y0 + 2, 16 * o + 4, 6, 0.7 * o, bit(L.BANK, L.PEOPLE, L.TOWN), LIT);
  }
  const win = innWindow(t), wx = scrX(INN_WIN_X, 1, cx), wy = scrY(INN_WIN_Y, 1, cu);
  if (win) {
    for (let y = wy - 10; y <= wy - 1; y++) for (let x = wx - 4; x <= wx + 4; x++) pset(x, y, x === wx || y === wy - 6 ? C.AM1 : y < wy - 7 ? C.AM3 : C.AM2, L.WIN);
    lightPool(wx, wy - 5, 13, 11, 0.55, bit(L.TOWN), LIT);
  }
  const lx = scrX(INN_LAMP_X, 1, cx), ly = scrY(INN_LAMP_Y + 6, 1, cu);   // the lamp that marks the inn
  pset(lx, ly, C.AM3, L.LAMP); pset(lx, ly + 1, C.AM2, L.LAMP); pset(lx - 1, ly + 1, C.AM1, L.LAMP); pset(lx + 1, ly + 1, C.AM1, L.LAMP); pset(lx, ly + 2, C.AM1, L.LAMP);
  lightPool(lx, ly + 2, 24, 18, 0.62, bit(L.TOWN, L.BANK, L.PEOPLE, L.TREE), LIT);
}

// ------------------------------------------------------------------ fireflies
// [x, height above the deck, sway x, sway y, cycles x, cycles y, blink cycles, phase]; all whole cycles per loop
const FLIES = [[214, 22, 8, 4, 2, 3, 9, 0.1], [60, 16, 10, 5, 1, 2, 7, 0.4], [98, 26, 7, 6, 3, 2, 11, 0.7], [170, 30, 9, 4, 2, 1, 8, 0.2],
               [280, 18, 12, 5, 1, 3, 10, 0.9], [330, 24, 8, 6, 2, 2, 6, 0.55], [20, 30, 9, 5, 3, 1, 12, 0.35], [130, 12, 6, 3, 1, 2, 9, 0.8]];
function fireflyPos(i, t) {
  const [x, h, ax, ay, kx, ky, , ph] = FLIES[i], fx = x + ax * osc(kx, t, ph), fy = deck(x) + h + ay * osc(ky, t, ph + 0.3);
  if (i !== 0) return [fx, fy];
  // the one the younger child tries to catch: it hangs just out of reach, then gets away upwards
  const st = storyT(t), w = smooth(ramp(st, 11.0, 11.6)) * (1 - smooth(ramp(st, 16.2, 17.4)));
  const kx0 = 214 + 6 + 2 * Math.sin(st * 5.1), ky0 = deck(214) + 1 + 20 + 2 * Math.sin(st * 3.7) + Math.max(0, st - 15.3) * 9;
  return [lerp(fx, kx0, w), lerp(fy, ky0, w)];
}
function drawFireflies(t, cx, cu) {
  for (let i = 0; i < FLIES.length; i++) {
    const [x, y] = fireflyPos(i, t), lit = osc(FLIES[i][6], t, FLIES[i][7]);
    if (lit < 0.1 && !(i === 0 && t > 11 && t < 17.4)) continue;
    const sx = scrX(x, 1, cx), sy = scrY(y, 1, cu);
    lightPool(sx, sy, 3, 3, 0.7, M_ALL, PHOS);
    pset(sx, sy, lit > 0.6 ? C.PH3 : C.PH2, L.FLY);
  }
}

// ------------------------------------------------------------------ vignette (dithered cool shadow in the corners)
const vig = new Uint8Array(W * H);
function buildVignette() {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - 159.5) / 160, dy = (y - 89.5) / 90, c = (dx * dx + dy * dy) * 0.5 + dx * dx * dy * dy * 1.5;
    vig[y * W + x] = bay(x, y) < smooth((c - 0.45) / 0.7) * 0.9 ? 1 : 0;
  }
}
