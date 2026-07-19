/* ────────────────────────────────────────────────────────────────
   Procedural race audio — no samples, pure Web Audio.
   Engine = two detuned saws + sub square through a lowpass, pitch
   from the physics rpm (resets each gear → audible shifts).
   Tyre screech = bandpass noise scaled by slip. Wind = lowpass
   noise with speed. Impacts = noise burst + pitch-dropping thump.
   Built lazily on first user input (autoplay policy).
   ──────────────────────────────────────────────────────────────── */
export function createRaceAudio() {
  let ctx = null, master = null, noiseBuf = null;
  let engOsc1, engOsc2, engSub, engGain;
  let screechGain, windGain;
  let muted = false;
  const T = 0.06;   // smoothing time constant for param changes

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);

    /* engine */
    engGain = ctx.createGain();
    engGain.gain.value = 0;
    const engFilter = ctx.createBiquadFilter();
    engFilter.type = 'lowpass';
    engFilter.frequency.value = 950;
    engFilter.Q.value = 0.7;
    engGain.connect(engFilter);
    engFilter.connect(master);

    engOsc1 = ctx.createOscillator(); engOsc1.type = 'sawtooth';
    engOsc2 = ctx.createOscillator(); engOsc2.type = 'sawtooth'; engOsc2.detune.value = 9;
    engSub = ctx.createOscillator(); engSub.type = 'square';
    const g1 = ctx.createGain(); g1.gain.value = 0.5;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    const g3 = ctx.createGain(); g3.gain.value = 0.4;
    engOsc1.connect(g1); g1.connect(engGain);
    engOsc2.connect(g2); g2.connect(engGain);
    engSub.connect(g3); g3.connect(engGain);
    engOsc1.start(); engOsc2.start(); engSub.start();

    /* shared looped white-noise source material */
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const mkNoise = () => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true; src.start();
      return src;
    };

    /* tyre screech */
    const screech = mkNoise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2.5;
    screechGain = ctx.createGain(); screechGain.gain.value = 0;
    screech.connect(bp); bp.connect(screechGain); screechGain.connect(master);

    /* wind / road rush */
    const wind = mkNoise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 480;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    wind.connect(lp); lp.connect(windGain); windGain.connect(master);

    return true;
  }

  return {
    start() {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },
    setMuted(m) {
      muted = m;
      if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
    },
    /* s: { mode, rpm, speed, throttle, drifting, slip, onRoad } */
    update(s) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const isDrift = s.mode === 'drift';
      const idle = isDrift ? 55 : 88;
      const span = isDrift ? 130 : 250;
      const f = idle + (s.rpm || 0) * span;
      engOsc1.frequency.setTargetAtTime(f, t, T);
      engOsc2.frequency.setTargetAtTime(f * 1.004, t, T);
      engSub.frequency.setTargetAtTime(f / 2, t, T);
      engGain.gain.setTargetAtTime(
        0.05 + (s.throttle ? 0.06 : 0.015) + (s.rpm || 0) * 0.05, t, T);
      const sc = s.drifting && s.onRoad
        ? Math.min(0.22, 0.05 + s.slip * 0.3) * Math.min(1, s.speed / 12) : 0;
      screechGain.gain.setTargetAtTime(sc, t, 0.05);
      windGain.gain.setTargetAtTime(Math.min(0.12, (s.speed / 92) * 0.12), t, 0.1);
    },
    impact(str) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const v = Math.min(0.5, 0.15 + str * 0.3);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = ctx.createGain();
      src.connect(lp); lp.connect(g); g.connect(master);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      src.start(t); src.stop(t + 0.3);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(35, t + 0.15);
      const og = ctx.createGain();
      og.gain.setValueAtTime(v * 0.8, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + 0.2);
    },
    dispose() {
      if (ctx) { try { ctx.close(); } catch { /* already closed */ } ctx = null; }
    },
  };
}
