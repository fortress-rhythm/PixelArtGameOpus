// @ts-check
// =================================================================== NIGHT BRIDGE: THE STORY (data, then evaluation)
// Every track is a function of the time t in seconds. Past STORY_S the story is over: everyone is indoors, the lamp
// is lit and the camera holds; only the ambient things (water, boats, lights, fireflies) keep moving.
const WALK = 1, HURRY = 1.3, RUN = 1.6;
const DOOR = INN_DOOR_X;
// moves: [t0, t1, x0, x1, gait]   views: [t, view, face]   z: [t, depth] (0 near railing .. 4 far railing, linear
// between keys)   acts: [t0, t1, gesture]   on: [t0, t1] visible
const STORY = {
  kidA: {
    on: [[5.0, 44.9]],
    moves: [[5.0, 10.2, -14, 232, RUN], [12.0, 12.8, 232, 254, WALK], [27.0, 38.4, 254, 530, WALK], [44.0, 44.9, 530, DOOR, WALK]],
    views: [[0, SIDE, 1], [12.9, BACK, 1], [16.3, SIDE, -1], [17.5, BACK, 1], [19.7, FRONT, 1], [25.1, SIDE, -1], [26.7, SIDE, 1], [44.5, BACK, 1]],
    z: [[0, 1.5], [12.8, 1.5], [12.9, 4], [19.6, 4], [20.2, 0], [25.0, 0], [26.8, 1.5]],
    acts: [[10.4, 12.0, 'lookBack'], [12.9, 16.3, 'rail'], [16.3, 17.5, 'callOver'], [17.5, 19.6, 'rail'], [20.2, 25.0, 'rail'],
           [25.1, 26.7, 'still'], [27.0, 38.6, 'held'], [38.6, 44.0, 'still']]
  },
  kidB: {
    on: [[5.4, 45.9]],
    moves: [[5.4, 10.4, -14, 214, RUN], [17.0, 17.6, 214, 240, RUN], [27.4, 38.8, 240, 512, WALK], [44.6, 45.9, 512, DOOR, WALK]],
    views: [[0, SIDE, 1], [17.7, BACK, 1], [19.7, FRONT, 1], [25.0, SIDE, -1], [27.2, SIDE, 1], [45.5, BACK, 1]],
    z: [[0, 2.5], [17.6, 2.5], [17.7, 4], [19.6, 4], [20.2, 0], [25.0, 0], [27.2, 3]],
    acts: [[10.4, 12.0, 'lookBack'], [12.0, 16.6, 'firefly'], [16.6, 17.0, 'lookUp'], [17.7, 19.6, 'rail'], [20.2, 25.0, 'rail'],
           [25.0, 27.2, 'still'], [38.8, 44.6, 'still']]
  },
  her: {
    on: [[21.0, 46.8], [52.0, 84.2]],
    moves: [[21.0, 25.6, -18, 247, HURRY], [27.0, 38.4, 247, 523, WALK], [46.0, 46.8, 523, DOOR, WALK], [52.0, 52.9, DOOR, 522, WALK],
            [58.0, 72.0, 522, LAY.peakX, WALK], [81.0, 82.6, LAY.peakX, LH_X, WALK]],
    views: [[0, SIDE, 1], [46.4, BACK, 1], [52.0, FRONT, 1], [52.4, SIDE, -1], [53.2, SIDE, 1], [57.6, SIDE, -1], [72.0, FRONT, 1],
            [74.3, SIDE, 1], [78.6, SIDE, -1], [79.6, SIDE, 1], [80.8, BACK, 1]],
    z: [[0, 2], [25.6, 1.5], [72.0, 2], [80.8, 2], [81.0, 4]],
    acts: [[25.2, 26.0, 'catch'], [26.0, 27.0, 'beckon'], [27.0, 38.6, 'hold'], [39.0, 44.0, 'talk'], [44.0, 46.0, 'still'],
           [53.4, 55.2, 'lookUp'], [55.3, 56.2, 'lookBack'], [72.2, 74.3, 'still'], [74.5, 75.55, 'throat'], [75.55, 77.5, 'slip'],
           [77.5, 84.2, 'carry'], [82.6, 83.7, 'unlock']],
    cloak: [74.5, 78.0]
  },
  keeper: {
    on: [[38.7, 47.2], [51.6, 53.4]],
    moves: [[38.7, 39.3, DOOR + 4, DOOR + 1, WALK]],
    views: [[0, FRONT, 1], [46.9, BACK, 1], [51.6, FRONT, 1], [53.0, BACK, 1]],
    z: [[0, 4]],
    acts: [[39.3, 42.4, 'still'], [42.4, 44.6, 'welcome'], [44.6, 46.9, 'still'], [51.6, 53.0, 'still']]
  },
  keeper2: {
    on: [[38.9, 45.9]],
    moves: [[38.9, 40.2, DOOR, DOOR + SIZE.innDoorW / 2 + 6, WALK], [45.3, 45.9, DOOR + SIZE.innDoorW / 2 + 6, DOOR, WALK]],
    views: [[0, SIDE, 1], [40.2, FRONT, 1], [45.2, BACK, 1]],
    z: [[0, 3]],
    acts: [[40.2, 43.6, 'still'], [43.6, 45.0, 'beckonKids']]
  }
};
const CAM_KEYS = [[0, LAY.shotOpen, 0], [27.0, LAY.shotOpen, 0], [38.0, LAY.shotDoor, 0], [58.6, LAY.shotDoor, 0], [71.0, LAY.shotTower, 0],
                  [86.8, LAY.shotTower, 0], [90.5, LAY.shotTower, LAY.towerUp]];
const INN_DOOR = [38.4, 38.9, 53.0, 53.5];          // opens, open, closes, shut
const TOWER_DOOR = [83.6, 83.9, 84.4, 84.8];
const INN_WINDOW_T = 47.8, LAMP_T = 86.0;
// boats: [t, x, scale]; scale 0.5 is the bridge's distance, bigger is nearer (and lower on the water)
const FISHER = [[11.0, 236, 0.22], [19.8, 234, 0.5], [23.0, 250, 0.8], [27.0, 300, 1.0], [34.0, 420, 1.2], [42.0, 600, 1.35], [48.0, 740, 1.4]];
const STEAMER = [[60.0, 108, 0.2], [70.5, 106, 0.5], [76.0, 80, 0.72], [84.0, -10, 0.9], [90.0, -140, 0.95]];
/** @type {[number, string][]} */
const CUES = [[18.6, 'bell'], [38.4, 'door'], [53.0, 'doorShut'], [73.5, 'horn'], [82.9, 'key'], [83.3, 'key'], [83.6, 'door'],
              [84.4, 'doorShut'], [86.0, 'lamp']];

// ------------------------------------------------------------------ evaluation
const storyT = (t) => Math.min(t, STORY_S);
function keyed(keys, t) {                          // linear between [t, v] keys, held at the ends
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (t - a[0]) / (b[0] - a[0]));
  }
  return keys[keys.length - 1][1];
}
function stepped(list, t) { let v = list[0]; for (const e of list) if (t >= e[0]) v = e; return v; }
function within(spans, t) { for (const s of spans) if (t >= s[0] && t < s[1]) return true; return false; }
function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

// where a mover is, how far it has walked (for the leg phase), and how hard it is striding
function moveAt(moves, t, stride) {
  let x = moves[0][2], dist = 0, amp = 0, gait = WALK;
  for (const [t0, t1, x0, x1, g] of moves) {
    if (t < t0) break;
    const u = clamp((t - t0) / (t1 - t0), 0, 1), a = 0.15, vmax = 1 / (1 - a);
    const e = u < a ? 0.5 * vmax * u * u / a : u < 1 - a ? vmax * (u - a / 2) : 1 - 0.5 * vmax * (1 - u) ** 2 / a;
    x = lerp(x0, x1, e); gait = g;
    dist += Math.abs(x - x0);
    amp = u >= 1 ? 0 : g * (u < a ? u / a : u > 1 - a ? (1 - u) / a : 1);
  }
  return { x, phase: frac(dist / (4 * stride * gait)), amp: Math.min(amp, gait) };
}

const POSES = { kidA: newPose('kidA'), kidB: newPose('kidB'), her: newPose('her'), keeper: newPose('keeper'), keeper2: newPose('keeper2') };
const ORDER = Object.keys(POSES);
function evalPerson(who, t) {
  const s = STORY[who], d = CAST[who], p = POSES[who];
  t = storyT(t);
  p.on = within(s.on, t) ? 1 : 0;
  const m = moveAt(s.moves, t, d.stride);
  const v = stepped(s.views, t);
  p.x = m.x; p.phase = m.phase; p.amp = m.amp; p.view = v[1]; p.face = v[2]; p.z = keyed(s.z, t);
  p.look = 0; p.lookUp = 0; p.lean = p.amp > 1.2 ? 1.5 : 0; p.hop = 0; p.rail = 0; p.key = 0; p.dim = 0;
  p.cloak = s.cloak ? ramp(t, s.cloak[0], s.cloak[1]) : 0;
  // arms swing with the legs while walking (opposite to the leg on the same side)
  const sw = 0.55 * p.amp;
  p.armF[0] = -Math.sin(TAU * p.phase) * sw; p.armF[1] = 0.2 + 0.25 * p.amp;
  p.armB[0] = Math.sin(TAU * p.phase) * sw; p.armB[1] = 0.2 + 0.25 * p.amp;
  if (p.view !== SIDE) { p.armF[0] = 0.12; p.armF[1] = 0.1; p.armB[0] = 0.12; p.armB[1] = 0.1; }
  for (const [t0, t1, g] of s.acts) if (t >= t0 && t < t1) gesture(p, g, (t - t0) / (t1 - t0), t - t0);
  // feet: on the deck (nearer is lower), on the street, or on the lighthouse stairs
  if (who === 'her' && t >= 81.0) p.y = lerp(deck(LAY.peakX) + 4, LH_DOOR, ramp(p.x, LAY.peakX, LH_X));
  else p.y = p.x >= LAY.rightX ? STREET_Y + 1 : deck(p.x) + 1 + Math.round(p.z * 0.6);
  if (who === 'keeper' || (p.x > DOOR - SIZE.innDoorW / 2 && p.x < DOOR + SIZE.innDoorW / 2 && p.view === BACK)) p.dim = 1;
  return p;
}
function gesture(p, g, u, el) {
  const A = p.armF, B = p.armB;
  switch (g) {
    case 'lookBack': p.look = 1; break;
    case 'lookUp': p.lookUp = 1; break;
    case 'still': A[0] = 0.08; A[1] = 0.15; B[0] = 0.05; B[1] = 0.15; break;
    case 'rail': p.rail = 1; p.lean = 2; break;
    case 'callOver': A[0] = 2.3 + 0.35 * Math.sin(TAU * el * 3); A[1] = 0.4; break;                 // waving the other over
    case 'firefly': {                                                                                // reach, clap, look, again
      const k = u * 2 % 1, clap = k > 0.32 && k < 0.42;
      A[0] = clap ? 1.55 : k < 0.32 ? 2.5 : 1.0; A[1] = clap ? 0 : k < 0.32 ? 0.2 : 0.9;
      B[0] = A[0] - 0.1; B[1] = A[1];
      p.hop = clap ? 2 : 0; p.lookUp = k < 0.42 ? 1 : 0;
      break;
    }
    case 'catch': A[0] = lerp(0.3, 1.3, smooth(u * 2)); A[1] = 0.1; p.lean = 1; break;
    case 'beckon': A[0] = 1.0; A[1] = 0.1; p.look = 1; B[0] = -1.2 - 0.35 * Math.sin(TAU * el * 3); B[1] = -0.5; break;
    case 'hold': A[0] = 0.95; A[1] = 0.15; break;
    case 'held': B[0] = -0.85; B[1] = 0; break;
    case 'talk': A[0] = 0.6 + 0.25 * Math.sin(TAU * el * 0.9); A[1] = 1.0 + 0.45 * Math.sin(TAU * el * 1.4); break;
    case 'welcome': A[0] = 0.9 * smooth(u * 4) * (1 - smooth((u - 0.85) * 6.6)); A[1] = 0.3; break;
    case 'beckonKids': B[0] = 0.8; B[1] = 0.8 + 0.6 * Math.sin(TAU * el * 2.5); break;
    case 'throat': A[0] = 0.4 * smooth(u * 3); A[1] = 2.6 * smooth(u * 3); break;
    case 'slip': A[0] = lerp(0.4, -0.3, smooth(u * 2)); A[1] = lerp(2.6, 0.6, smooth(u * 2)); B[0] = -0.4; B[1] = 0.3; p.lean = 0; break;
    case 'carry': A[0] = 0.2; A[1] = 1.45; break;
    case 'unlock': A[0] = 0.9; A[1] = 1.1; p.key = 1; break;
  }
}

// ------------------------------------------------------------------ the camera, doors, windows, lamp
const camOut = { x: 0, up: 0 };
function cameraAt(t) {
  t = storyT(t);
  let k = 0; while (k < CAM_KEYS.length - 2 && t >= CAM_KEYS[k + 1][0]) k++;
  const A = CAM_KEYS[k], B = CAM_KEYS[k + 1], w = smoother((t - A[0]) / (B[0] - A[0]));
  camOut.x = lerp(A[1], B[1], w); camOut.up = lerp(A[2], B[2], w);
  return camOut;
}
const doorOpen = (D, t) => { t = storyT(t); return t < D[2] ? ramp(t, D[0], D[1]) : 1 - ramp(t, D[2], D[3]); };
// the children's window: a few flickers, then lit
function innWindow(t) {
  t = storyT(t);
  if (t < INN_WINDOW_T) return 0;
  const e = t - INN_WINDOW_T;
  return e > 1.0 ? 1 : [1, 0, 1, 1, 0, 1, 0, 1, 1, 1][Math.floor(e * 10)];
}
function lampOn(t) {
  t = storyT(t);
  if (t < LAMP_T) return 0;
  const e = t - LAMP_T;
  return e > 0.8 ? 1 : [1, 0, 0, 1, 0, 1, 1, 1][Math.floor(e * 10)];
}
const boatAt = (keys, t) => keys.length && t >= keys[0][0] && t <= keys[keys.length - 1][0]
  ? { x: keyed(keys.map(k => [k[0], k[1]]), t), s: keyed(keys.map(k => [k[0], k[2]]), t) } : null;
