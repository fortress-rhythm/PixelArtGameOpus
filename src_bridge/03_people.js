// @ts-check
// =================================================================== NIGHT BRIDGE: PEOPLE (procedural sprites)
// Each figure is drawn every frame from a pose into a scratch sprite (feet at SAY, centre at SAX), then set into the
// framebuffer with moonlight on the edges that face the moon. Sizes are the brief's: her 30 px, the children 21 and
// 19. All five are original designs (docs/design-log/night-bridge.md).
const SPR = 52, SAX = 26, SAY = 47;
const spr = new Uint8Array(SPR * SPR);
const SIDE = 0, FRONT = 1, BACK = 2;

function sp(x, y, c) {
  const sx = Math.round(x) + SAX, sy = Math.round(y) + SAY;
  if (sx >= 0 && sy >= 0 && sx < SPR && sy < SPR) spr[sy * SPR + sx] = c;
}
function seg(x0, y0, x1, y1, c, w) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  const flat = Math.abs(x1 - x0) > Math.abs(y1 - y0);
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    sp(x, y, c);
    if (w > 1) flat ? sp(x, y + 1, c) : sp(x + 1, y, c);
  }
}
// fill a polygon given as [x, y, x, y, ...] (pixel centres inside it)
function poly(pts, c, edgeL, edgeR) {
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < pts.length; i += 2) { y0 = Math.min(y0, pts[i]); y1 = Math.max(y1, pts[i]); }
  for (let y = Math.ceil(y0 - 0.5); y <= Math.floor(y1 + 0.5); y++) {
    const xs = [], yc = y;
    for (let i = 0, n = pts.length / 2; i < n; i++) {
      const ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[((i + 1) % n) * 2], by = pts[((i + 1) % n) * 2 + 1];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.round(xs[k]), b = Math.round(xs[k + 1]) - 1;
      for (let x = a; x <= b; x++) sp(x, y, x === a && edgeL !== undefined ? edgeL : x === b && edgeR !== undefined ? edgeR : c);
    }
  }
}
// a head bitmap: rows of letters, cx = the column over the body's centre; the last row is the neck
function headBm(rows, cx, top, colours, flip) {
  for (let r = 0; r < rows.length; r++) for (let k = 0; k < rows[r].length; k++) {
    const ch = rows[r][k];
    if (ch !== '.') sp(flip ? cx - (k - Math.floor(rows[r].length / 2)) : cx + (k - Math.floor(rows[r].length / 2)), top + r, colours[ch]);
  }
}

// ------------------------------------------------------------------ the cast
// heads face right in SIDE; letters: h/H hair light/dark, t hair tie, S/s skin, e eye, n neck, m moustache, K/k cap, b bunch
const HER_HEADS = {
  [SIDE]: ['..hhh..', '.hHHHh.', 'HHHHSS.', 'HHHSeSS', 'tHHSSS.', 't.HSSs.', 't..nn..'],
  [FRONT]: ['..hhh..', '.hHHHh.', 'hHSSSHh', 'HSeSeSH', 'HSSSSSH', 'H.SsS.H', '...n...'],
  [BACK]: ['..hhh..', '.hHHHh.', 'hHHHHHh', 'HHHHHHH', 'HHHHHHH', 'H.HtH.H', '...n...']
};
const KIDA_HEADS = {
  [SIDE]: ['.KKKK..', 'KKKKKk.', 'hhSSS..', 'hSSeSS.', '.hSSs..', '..n....'],
  [FRONT]: ['.KKKKK.', 'KKKKKKK', '.hSSSh.', '.SeSeS.', '..SSS..', '...n...'],
  [BACK]: ['.KKKKK.', 'KKKKKKK', '.hhhhh.', '.hhhhh.', '..hhh..', '...n...']
};
const KIDB_HEADS = {
  [SIDE]: ['.hhh...', 'hhhhh..', 'bhhSSS.', 'bhSSeS.', '.hSSs..', '..n....'],
  [FRONT]: ['..hhh..', '.hhhhh.', 'bhSSShb', 'b.SeS.b', '..SSS..', '...n...'],
  [BACK]: ['..hhh..', '.hhhhh.', 'bhhhhhb', 'bhhhhhb', '..hhh..', '...n...']
};
const KEEP_HEADS = {
  [FRONT]: ['..SSS..', '.gSSSg.', 'gSeSeSg', 'gSSSSSg', '.SmmmS.', '..SSS..', '...n...'],
  [BACK]: ['..SSS..', '.gSSSg.', 'ggggggg', 'ggggggg', '.ggggg.', '..SSS..', '...n...']
};
const KEEP2_HEADS = {
  [FRONT]: ['..ggg..', '.gGGGg.', 'gGSSSGg', '.SeSeS.', '.SSSSS.', '..SsS..', '...n...'],
  [BACK]: ['..ggg..', '.ggGgg.', 'gGGGGGg', 'gGGGGGg', '.gGGGg.', '..ggg..', '...n...']
};
KEEP_HEADS[SIDE] = KEEP_HEADS[FRONT]; KEEP2_HEADS[SIDE] = KEEP2_HEADS[FRONT];

const CAST = {
  her: { h: 30, leg: 14, sh: 2.6, hip: 2, ua: 6, fa: 5, stride: 4.4, heads: HER_HEADS,
         col: { h: C.HR2, H: C.HR1, t: C.HR0, S: C.SKN0, s: C.SKN1, e: C.INK, n: C.SKN1 } },
  kidA: { h: 21, leg: 9, sh: 2, hip: 1.6, ua: 4, fa: 3.5, stride: 3.4, heads: KIDA_HEADS,
          col: { K: C.KA0, k: C.KH, h: C.KH, S: C.SKN0, s: C.SKN1, e: C.INK, n: C.SKN1 } },
  kidB: { h: 19, leg: 8, sh: 1.8, hip: 1.5, ua: 3.5, fa: 3, stride: 3.1, heads: KIDB_HEADS,
          col: { h: C.KA0, b: C.KA1, S: C.SKN0, s: C.SKN1, e: C.INK, n: C.SKN1 } },
  keeper: { h: 31, leg: 14, sh: 3, hip: 2.6, ua: 6, fa: 5, stride: 4, heads: KEEP_HEADS,
            col: { g: C.GRY, S: C.SKN1, e: C.INK, m: C.GRY, n: C.SKN2 } },
  keeper2: { h: 28, leg: 12, sh: 2.6, hip: 2.6, ua: 5, fa: 4.5, stride: 3.6, heads: KEEP2_HEADS,
             col: { g: C.GRY, G: C.PM1, S: C.SKN0, s: C.SKN1, e: C.INK, n: C.SKN1 } }
};

/** a pose: everything the drawing needs, filled in by the story each frame */
function newPose(who) {
  return { who, on: 0, x: 0, y: 0, z: 0, view: SIDE, face: 1, look: 0, lookUp: 0, lean: 0, phase: 0, amp: 0, hop: 0,
           armF: [0, 0.3], armB: [0, 0.3], cloak: 0, rail: 0, key: 0, clip0: -1e9, clip1: 1e9, dim: 0 };
}

// ------------------------------------------------------------------ drawing one figure into spr (facing right)
function legPts(d, p, front) {
  const ph = p.phase + (front ? 0 : 0.5), s = Math.sin(TAU * ph), c = Math.cos(TAU * ph);
  const amp = p.amp, lift = amp > 0.05 ? Math.max(0, c) * (1 + 0.8 * Math.max(0, amp - 1)) * 1.6 * Math.min(1, amp) : 0;
  const fx = s * d.stride * amp, hx = front ? 0.5 : -0.5, hy = -d.leg;
  const kx = (hx + fx) / 2 + 0.6 + lift * 0.7, ky = hy / 2 - lift * 0.6;
  return [hx, hy, kx, ky, fx, -lift];
}
function drawLeg(d, p, front, col, shoe, w) {
  const [hx, hy, kx, ky, fx, fy] = legPts(d, p, front);
  seg(hx, hy, kx, ky, col, w); seg(kx, ky, fx, fy, col, w);
  sp(fx, fy, shoe); sp(fx + 1, fy, shoe); if (w > 1) sp(fx + 2, fy, shoe);
}
function armPts(d, p, front, sy) {
  const [a, e] = front ? p.armF : p.armB, sx = p.lean * 0.9 + (front ? 0.5 : -0.5);
  const ex = sx + d.ua * Math.sin(a), ey = sy + d.ua * Math.cos(a);
  return [sx, sy, ex, ey, ex + d.fa * Math.sin(a + e), ey + d.fa * Math.cos(a + e)];
}
function drawArm(d, p, front, sy, sleeve, skin) {
  const [sx, syy, ex, ey, hx, hy] = armPts(d, p, front, sy);
  seg(sx, syy, ex, ey, sleeve, 1); seg(ex, ey, hx, hy, sleeve, 1); sp(hx, hy, skin);
  return [hx, hy, ex, ey];
}
// front and back views: arms hang from the shoulders and swing out by angle a (0 = down), elbow e
function drawArmFB(d, p, right, sy, sleeve, skin) {
  const [a, e] = right ? p.armF : p.armB, sgn = right ? 1 : -1, sx = sgn * (d.sh + 0.5);
  let ex = sx + sgn * d.ua * Math.sin(a), ey = sy + d.ua * Math.cos(a), hx = ex + sgn * d.fa * Math.sin(a - e), hy = ey + d.fa * Math.cos(a - e);
  if (p.rail) { ex = sx; ey = sy + d.ua * 0.6; hx = sgn * 1; hy = -(SIZE.rail - 1) + p.z * 0; }
  seg(sx, sy, ex, ey, sleeve, 1); seg(ex, ey, hx, hy, sleeve, 1); sp(hx, hy, skin);
}

function drawFigure(p) {
  spr.fill(T);
  const d = CAST[p.who], view = p.view, bob = p.amp > 0.2 && Math.cos(TAU * p.phase * 2) > 0.4 ? -1 : 0;
  const lift = -p.hop + bob, dip = p.rail ? Math.round(p.lean) : 0;     // leaning over a railing lowers the head
  const nRows = d.heads[view].length, headTop = -d.h + lift + dip, sy = headTop + nRows - 1, hy = -d.leg;
  const her = p.who === 'her', cl = p.cloak, cloakOn = her && cl < 0.3, slide = her ? clamp((cl - 0.3) / 0.35, 0, 1) : 0;
  const gather = her ? clamp((cl - 0.65) / 0.2, 0, 1) : 0;
  // garment colours: [main, shadow, light]
  const top = her ? (cloakOn ? [C.CK1, C.CK0, C.CK2] : [C.TU1, C.TU0, C.TU2])
            : p.who === 'kidA' ? [C.KA1, C.KA0, C.KA1] : p.who === 'kidB' ? [C.KB1, C.KB0, C.KB1]
            : p.who === 'keeper' ? [C.PW0, C.BT1, C.PW0] : [C.PS0, C.BT1, C.PS1];
  const legC = her ? C.TU0 : p.who === 'kidA' ? C.BT1 : p.who === 'kidB' ? C.BT2 : p.who === 'keeper' ? C.BT1 : C.PS1;
  const shoe = C.INK, skin = d.col.S, legW = her || p.who.startsWith('keep') ? 2 : 1;

  if (view === SIDE) {
    const lean = p.lean, hipY = hy + lift;
    // back arm and leg, in shadow
    drawArm(d, p, false, sy + 1, top[1], C.SKN1);
    drawLeg(d, p, false, legC === C.TU0 ? C.TU0 : C.BT0, shoe, legW);
    drawLeg(d, p, true, legC, shoe, legW);
    if (her && !cloakOn) {                                          // loose trousers: a flare at the back of each ankle
      for (const fr of [false, true]) { const q = legPts(d, p, fr); sp(q[4] - 1, q[5] - 1, C.TU0); sp(q[4] - 1, q[5] - 2, C.TU0); }
    }
    // torso and garment
    const sB = lean - d.sh * 0.7, sF = lean + d.sh * 0.9;
    if (p.who === 'keeper2') poly([sB, sy, sF, sy, 2.6, -1, -3, -1], top[0], top[1], top[2]);
    else if (p.who === 'kidB') poly([sB, sy, sF, sy, 2.2, hipY + 4, -2.4, hipY + 4], top[0], top[1], top[2]);
    else poly([sB, sy, sF, sy, d.hip * 0.9, hipY + (her ? 0 : 1), -d.hip, hipY + (her ? 0 : 1)], top[0], top[1], top[2]);
    if (p.who === 'keeper') poly([0.5, hipY - 2, d.hip + 0.8, hipY - 2, d.hip + 1.2, hipY + 7, 0.5, hipY + 7], C.PM0, C.PM1);
    if (her) {
      const fF = legPts(d, p, true)[4], fB = legPts(d, p, false)[4], sway = 0.6 * Math.sin(TAU * p.phase * 2) * p.amp;
      if (!cloakOn) poly([sB, sy, sF, sy, 2.4 + lean * 0.3, hy + 5 + lift, -2.6, hy + 5 + lift], C.TU1, C.TU0, C.TU2);
      if (gather < 1) {
        // the cloak, fitted to the waist and flaring to the ankle; while it comes off its top slides down the back
        const tY = lerp(sy - 0.5, hipY + 2, slide), flare = 1 + slide * 1.5, g = gather;
        const hand = armPts(d, p, true, sy + 1);
        const pts = [lerp(sB - 0.2, -2, slide), tY, lerp(sF + 0.3, 1.5, slide), tY, 1.9, hipY + 1,
                     Math.max(fF, 2) + 0.6 + sway, -1, Math.min(fB, -2.4) - 1 - sway - flare + 1, -1, -2.3 - slide, hipY + 1];
        for (let i = 0; i < pts.length; i += 2) { pts[i] = lerp(pts[i], hand[4] + (i % 4 ? 1 : -1), g); pts[i + 1] = lerp(pts[i + 1], hand[5] + (i < 4 ? 0 : 6), g); }
        poly(pts, C.CK1, C.CK0, C.CK2);
        if (cloakOn) sp(sF, sy + 1, C.CK2);                           // the clasp at the collar
      }
    }
    // head and hair
    const look = p.look ? -1 : 1, hx = Math.round(lean * 1.1);
    headBm(d.heads[SIDE], hx, headTop, d.col, look < 0);
    if (her) {                                                       // the low tail swings behind her
      const sw = p.amp > 0.05 ? Math.round(-0.7 * p.amp) : 0, bx = hx - 3 * look;
      sp(bx + sw * look, headTop + 7, C.HR0); sp(bx + sw * look, headTop + 8, C.HR0);
    }
    if (p.lookUp) sp(hx + 1 * look, headTop + 3, d.col.S);              // eye lifts: the eye row shows skin
    // front arm last (over the body), with the cloak bundle if she carries it
    const hand = drawArm(d, p, true, sy + 1, top[0], skin);
    if (her && gather >= 1) {
      const bx = (hand[0] + hand[2]) / 2, by = (hand[1] + hand[3]) / 2;
      poly([bx - 2, by, bx + 2, by, bx + 2.5, by + 7, bx - 1.5, by + 7], C.CK1, C.CK0, C.CK2);
      sp(bx, by + 3, C.CK0);
    }
    if (p.key) sp(hand[0] + 1, hand[1] - 1, C.AM3);
  } else {
    // FRONT and BACK: symmetric bodies, legs together, arms from the shoulders
    const fb = view === FRONT, w2 = d.sh + 0.5;
    for (const s of [-1, 1]) { seg(s * 1.2, hy + lift, s * 1.2, -1, legC, legW > 1 ? 1 : 1); sp(s * 1.2, 0, shoe); if (legW > 1) seg(s * 0.2, hy + lift, s * 0.2, -1, legC, 1); }
    let hem = hy + lift + (p.who === 'kidB' ? 4 : p.who === 'kidA' ? 1 : 0);
    if (her) hem = cloakOn ? -1 : hy + 5 + lift;
    if (p.who === 'keeper2') hem = -1;
    poly([-w2, sy + dip * 0, w2 + 1, sy, d.hip + 1.4 + (hem > -3 ? 1.5 : 0), hem, -d.hip - 0.4 - (hem > -3 ? 1.5 : 0), hem], top[0], fb ? top[0] : top[1], top[2]);
    if (p.who === 'keeper' && fb) poly([-2, hy + lift - 2, 3, hy + lift - 2, 3.5, hy + lift + 8, -2.5, hy + lift + 8], C.PM0, C.PM1, C.PM0);
    if (p.who === 'keeper2') poly([-w2 - 0.5, sy, w2 + 1.5, sy, w2 + 1.5, sy + 6, -w2 - 0.5, sy + 6], C.PS0, C.BT1, C.PS0);
    drawArmFB(d, p, true, sy + 1, top[fb ? 0 : 1], skin);
    drawArmFB(d, p, false, sy + 1, top[1], skin);
    headBm(d.heads[view], 0, headTop, d.col, false);
    if (her && view === BACK) { sp(0, headTop + 7, C.HR0); sp(0, headTop + 8, C.HR0); }
    if (her && view === BACK && p.key) sp(d.sh + 1, sy + 3, C.AM3);
  }
}

// set the drawn figure into the framebuffer at screen (sx, feet row sy), lit by the moon from moonSx
function placeFigure(p, sx, sy, moonSx) {
  const flip = p.view === SIDE && p.face < 0, toward = moonSx >= sx ? 1 : -1;
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    let c = spr[y * SPR + x];
    if (c === T) continue;
    const dx = flip ? SAX - x : x - SAX, X = sx + dx, Y = sy + (y - SAY);
    if (X < p.clip0 || X > p.clip1) continue;
    // moonlight on the edge that faces the moon, above the knees
    const nx = flip ? x - toward : x + toward;
    if (y < SAY - 6 && (nx < 0 || nx >= SPR || spr[y * SPR + nx] === T)) c = RIM[c];
    if (p.dim) c = SHD[c];
    pset(X, Y, c, L.PEOPLE);
  }
}
