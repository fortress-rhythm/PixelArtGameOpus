// @ts-check
// =================================================================== NIGHT BRIDGE: WATER AND BOATS
// The river runs towards us under the bridge, so a boat's distance shows as its size: scale 0.5 is the bridge's
// distance, smaller is upstream behind it, bigger is nearer (and lower on the water).
const boatWaterY = (s) => RIVER_Y - 3 * (s / 0.5);

// mirror everything above the waterline into the river, broken by ripples
function drawReflections(t, fl, cu) {
  const rowW = scrY(WATER_Y, 1, cu);
  const ph = TAU * (6 * t / LOOP_S);
  for (let r = Math.max(0, rowW + 1); r < H; r++) {
    const d = r - rowW, src = rowW - d;
    if (src < 0) continue;
    const dx = Math.round((0.3 + d * 0.05) * Math.sin(d * 0.9 + ph)), streak = d % 3 === 1;
    for (let x = 0; x < W; x++) {
      const sx = clamp(x + dx, 0, W - 1), c = fb[src * W + sx], i = r * W + x;
      let o = REFL[c];
      if (streak && hash((x + Math.round(8 * Math.sin(ph + r))) >> 3, r) < 0.12) o = REFL[o];   // darker ripple troughs
      fb[i] = o; lid[i] = L.WATER;
    }
  }
  // the moon's glitter: a broken column under it, re-rolled ten times a second
  const mx = MOON_X, g = Math.floor(fl / 6);
  for (let r = Math.max(0, rowW + 2); r < H; r++) {
    const d = r - rowW, half = 1 + d * 0.12;
    for (let x = Math.round(mx - half); x <= Math.round(mx + half); x++)
      if (x >= 0 && x < W && hash(x * 7 + r, g) < 0.18) { fb[r * W + x] = hash(x, r + g) < 0.4 ? C.MOONS : C.W4; lid[r * W + x] = L.WATER; }
  }
}

// a fishing boat side-on: hull, cabin, mast and lantern, and a dark reflection
function drawFisher(x, s, t, cx, cu, bob) {
  const wy = boatWaterY(s), sx = scrX(x, 1, cx), sy = scrY(wy, 1, cu) + bob, L0 = Math.max(6, Math.round(26 * s));
  const hh = Math.max(2, Math.round(4 * s));
  for (let k = 0; k < hh; k++) {                                     // reflection first, then the boat over it
    for (let i = 0; i < L0 - k * 2; i++) if ((i + k) % 3) pset(sx - (L0 >> 1) + k + i, sy + 1 + k, C.W3, L.WATER);
  }
  for (let k = 0; k < hh; k++) for (let i = k; i < L0 - k; i++) pset(sx - (L0 >> 1) + i, sy - k, k === hh - 1 ? C.BT2 : C.BT1, L.BOAT);
  const cw = Math.max(2, Math.round(7 * s)), ch = Math.max(2, Math.round(5 * s)), cx0 = sx + Math.round(L0 * 0.12);
  for (let k = 0; k < ch; k++) for (let i = 0; i < cw; i++) pset(cx0 + i, sy - hh - k, i === cw - 1 ? C.BT2 : C.BT1, L.BOAT);
  if (s > 0.6) pset(cx0 + 1, sy - hh - ch + 1, C.AM1, L.BOAT);      // a lit cabin window
  const mh = Math.round(15 * s), mx = sx - Math.round(L0 * 0.12);
  for (let k = 0; k < mh; k++) pset(mx, sy - hh - k, C.BT2, L.BOAT);
  const sway = Math.round(osc(8, t, 0.3) * s);                        // the lantern swings a little
  pset(mx + sway, sy - hh - mh + 2, C.AM3, L.LAMP); pset(mx + sway, sy - hh - mh + 3, C.AM2, L.LAMP);
  lightPool(mx + sway, sy - hh - mh + 3, 4 + 4 * s, 3 + 3 * s, 0.6, bit(L.BOAT, L.WATER), LIT);
  for (let i = 0; i < Math.round(3 * s); i++) pset(sx + (L0 >> 1) + i, sy, C.W4, L.WATER);   // a little foam at the bow
}
// the steamer: long hull, deckhouse with lit portholes, a funnel trailing smoke
function drawSteamer(x, s, t, cx, cu) {
  const wy = boatWaterY(s), sx = scrX(x, 1, cx), sy = scrY(wy, 1, cu), L0 = Math.round(70 * s), hh = Math.max(2, Math.round(8 * s));
  for (let k = 0; k < hh; k++) for (let i = 0; i < L0 - k * 3; i++) if ((i + k) % 4) pset(sx - (L0 >> 1) + k + i, sy + 1 + k, C.W3, L.WATER);
  for (let k = 0; k < hh; k++) {
    const inset = Math.round((hh - k) * 0.6);
    for (let i = inset; i < L0 - Math.round(k * 0.4); i++) pset(sx - (L0 >> 1) + i, sy - k, k === hh - 1 ? C.BT2 : k === 0 ? C.BT0 : C.BT1, L.BOAT);
  }
  const dw = Math.round(32 * s), dh = Math.max(2, Math.round(8 * s)), dx0 = sx - Math.round(L0 * 0.2);
  for (let k = 0; k < dh; k++) for (let i = 0; i < dw; i++) pset(dx0 + i, sy - hh - k, k === dh - 1 ? C.BT2 : C.BT1, L.BOAT);
  for (let i = 2; i < dw - 1; i += Math.max(2, Math.round(5 * s))) pset(dx0 + i, sy - hh - (dh >> 1), C.AM2, L.LAMP);
  const fw = Math.max(2, Math.round(5 * s)), fh = Math.round(14 * s), fx = dx0 + Math.round(dw * 0.55);
  for (let k = 0; k < fh; k++) for (let i = 0; i < fw; i++) pset(fx + i, sy - hh - dh - k, k > fh - 3 ? C.BT0 : i === fw - 1 ? C.FUN : C.WD1, L.BOAT);
  const mh = Math.round(22 * s); for (let k = 0; k < mh; k++) pset(dx0 - 3, sy - hh - k, C.BT2, L.BOAT);
  pset(dx0 - 3, sy - hh - mh, C.AM3, L.LAMP);
  // smoke: a puff every 0.6 s, rising and drifting back, growing, thinning out (dithered)
  const top = sy - hh - dh - fh;
  for (let k = 0; k < 9; k++) {
    const age = (t / 0.6 % 1 + k) * 0.6, px = fx + fw / 2 + age * 9 * s + age * age * 2, py = top - age * 7 * s - 1, r = 1 + age * 2.2 * s;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const X = Math.round(px + dx), Y = Math.round(py + dy);
      if (dx * dx + dy * dy <= r * r && bay(X, Y) < 0.75 - age * 0.13) pset(X, Y, C.SMK, L.BOAT);
    }
  }
}
