// @ts-check
// =================================================================== NIGHT BRIDGE: SOUND
// Generated with Web Audio, nothing recorded. Browsers only allow sound after a click or a key, so the scene starts
// silent with a hint; the first click or key starts the river, M mutes. Cues fire as the time passes them, so a seek
// or the loop point plays nothing it skipped.
/** @type {AudioContext | null} */
let actx = null;
let snd = null, sndMuted = false, sndLastT = -1;
function soundStart() {
  if (actx) return;
  const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AC) return;
  const ac = new AC();
  actx = ac;
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = hash(i, 77) * 2 - 1;
  const master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
  const loopNoise = (freq, type, q) => {
    const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); s.start(); return g;
  };
  const river = loopNoise(380, 'lowpass', 0.4); river.gain.value = 0.05; river.connect(master);
  // the fishing boat's engine: a low tone, chopped into thumps
  const putPan = ac.createStereoPanner(); putPan.connect(master);
  const put = ac.createGain(); put.gain.value = 0; put.connect(putPan);
  const thump = ac.createOscillator(); thump.frequency.value = 62; const chop = ac.createGain(); chop.gain.value = 0;
  const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 6.5; lfo.connect(chop.gain);
  thump.connect(chop); chop.connect(put); thump.start(); lfo.start();
  // the steamer: a low rumble
  const rumPan = ac.createStereoPanner(); rumPan.connect(master);
  const rum = loopNoise(110, 'lowpass', 1.2); rum.connect(rumPan);
  snd = { master, put, putPan, rum, rumPan, noise };
  const hint = document.getElementById('hint'); if (hint) hint.style.opacity = '0';
}
function soundCue(name) {
  if (!actx || !snd) return;
  const ac = actx, t0 = ac.currentTime, out = snd.master;
  const env = (node, peak, a, d) => { const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); node.connect(g); g.connect(out); return g; };
  const tone = (f, type, peak, a, d) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; env(o, peak, a, d); o.start(t0); o.stop(t0 + a + d + 0.05); return o; };
  const burst = (f, q, peak, d) => { const s = ac.createBufferSource(); s.buffer = snd.noise; const bf = ac.createBiquadFilter(); bf.type = 'bandpass';
    bf.frequency.value = f; bf.Q.value = q; s.connect(bf); env(bf, peak, 0.005, d); s.start(t0); s.stop(t0 + d + 0.05); };
  if (name === 'bell') { tone(1318, 'sine', 0.12, 0.004, 1.6); tone(2093, 'sine', 0.05, 0.004, 0.9); }
  else if (name === 'door') { burst(650, 2, 0.12, 0.35); tone(95, 'sine', 0.15, 0.01, 0.2); }
  else if (name === 'doorShut') { tone(80, 'sine', 0.25, 0.005, 0.18); burst(300, 1.5, 0.1, 0.12); }
  else if (name === 'key') burst(4200, 6, 0.08, 0.04);
  else if (name === 'lamp') { tone(55, 'sine', 0.2, 0.05, 0.5); burst(900, 0.8, 0.05, 0.4); }
  else if (name === 'horn') {
    for (const f of [110, 147]) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; o.connect(lp);
      const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.06, t0 + 0.25);
      g.gain.setValueAtTime(0.06, t0 + 1.6); g.gain.linearRampToValueAtTime(0, t0 + 2.2); lp.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 2.3);
    }
  }
}
function soundTick(t, cx) {
  if (!actx || !snd) return;
  const now = actx.currentTime, set = (p, v) => p.setTargetAtTime(v, now, 0.15);
  set(snd.master.gain, sndMuted ? 0 : 0.8);
  const st = storyT(t), b = boatAt(FISHER, st), s2 = boatAt(STEAMER, st);
  set(snd.put.gain, b ? 0.05 * Math.min(1, b.s * 1.4) : 0);
  if (b) set(snd.putPan.pan, clamp((b.x - cx - W / 2) / W, -1, 1));
  set(snd.rum.gain, s2 ? 0.12 * s2.s : 0);
  if (s2) set(snd.rumPan.pan, clamp((s2.x - cx - W / 2) / W, -1, 1));
  if (t > sndLastT && t - sndLastT < 0.5) for (const [ct, name] of CUES) if (ct > sndLastT && ct <= t) soundCue(name);
  sndLastT = t;
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pointerdown', () => soundStart());
  window.addEventListener('keydown', (e) => { if (actx && (e.key === 'm' || e.key === 'M')) sndMuted = !sndMuted; soundStart(); });
}
