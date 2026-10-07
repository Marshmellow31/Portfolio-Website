/* Recorded V10 engine with short stereo reflections with procedural tyre, wind and impact effects.
   Continuous voices are created once; controls
   run at 30 Hz and use smoothed parameters. Short voices disconnect on end. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

// The physics RPM resets at each gear boundary. Debounce that boundary and
// limit audible pitch movement so speed jitter cannot produce repeated chirps.
export function createEnginePitchController() {
  let rev = null, gear = null, pendingGear = null, pendingSince = 0, lastTime = null;
  return (state, now) => {
    const rpm = clamp(state.rpm, 0, 1);
    let target = state.speed > 8 ? 0.62 + rpm * 0.38 : rpm * 0.65;
    let shifted = false;
    if (gear === null || state.phase !== 'racing') {
      gear = state.gear; pendingGear = null;
    } else if (state.gear !== gear) {
      if (pendingGear !== state.gear) { pendingGear = state.gear; pendingSince = now; }
      if (now - pendingSince >= 0.1) {
        gear = state.gear; pendingGear = null; shifted = true;
      } else if (rev !== null) target = rev;
    } else pendingGear = null;
    const dt = lastTime === null ? 0 : clamp(now - lastTime, 0, 0.1);
    if (rev === null) rev = target;
    else rev += clamp(target - rev, -dt * 1.2, dt * 0.85);
    lastTime = now;
    return { rev, shifted, rate: (state.mode === 'drift' ? 0.64 : 0.78) + rev * 0.26 };
  };
}

let decodedEngine = null;
export function loadRaceEngineBuffers(context) {
  if (!decodedEngine) {
    decodedEngine = Promise.all(['idle', 'running'].map(async (name) => {
      const response = await fetch(`/audio/race/v10-${name}.wav`);
      if (!response.ok) throw new Error(`Engine sample HTTP ${response.status}`);
      return context.decodeAudioData(await response.arrayBuffer());
    })).catch((error) => { decodedEngine = null; throw error; });
  }
  return decodedEngine;
}

export function createRaceAudio({ contextFactory } = {}) {
  let ctx, master, engineFilter, engineGain;
  let engineLoading = null, latestState = null;
  const engineVoices = [];
  let tyreGain, tyreFilter, windGain, windFilter, gravelGain, noiseBuffer;
  let muted = false, paused = false, previousPhase = '', previousCount = -1;
  let pitchControl = createEnginePitchController();
  let lastImpact = -Infinity, shiftUntil = 0;
  const sources = [], nodes = [];
  const track = (node) => { nodes.push(node); return node; };
  const smooth = (param, value, time = 0.06) => param.setTargetAtTime(value, ctx.currentTime, time);

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!contextFactory && !AC) return false;
    ctx = contextFactory ? contextFactory() : new AC({ latencyHint: 'interactive' });
    master = track(ctx.createGain());
    master.gain.value = muted || paused ? 0 : 0.6;
    const limiter = track(ctx.createDynamicsCompressor());
    limiter.threshold.value = -10; limiter.knee.value = 6; limiter.ratio.value = 2.5;
    limiter.attack.value = 0.003; limiter.release.value = 0.15;
    master.connect(limiter); limiter.connect(ctx.destination);

    engineGain = track(ctx.createGain()); engineGain.gain.value = 0;
    engineFilter = track(ctx.createBiquadFilter()); engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 4800; engineFilter.Q.value = 0.5;
    engineGain.connect(engineFilter);
    const presence = track(ctx.createBiquadFilter());
    presence.type = 'highshelf'; presence.frequency.value = 2800; presence.gain.value = -7;
    const harshness = track(ctx.createBiquadFilter());
    harshness.type = 'peaking'; harshness.frequency.value = 3300;
    harshness.Q.value = 0.65; harshness.gain.value = -5;
    engineFilter.connect(harshness); harshness.connect(presence); presence.connect(master);
    // Quiet early reflections give the engine space without a repeating echo
    // or feedback tail. The dry engine stays centred and dominant.
    if (ctx.createStereoPanner) {
      for (const [time, pan] of [[0.027, -0.65], [0.043, 0.65]]) {
        const delay = track(ctx.createDelay(0.1)), filter = track(ctx.createBiquadFilter());
        const gain = track(ctx.createGain()), panner = track(ctx.createStereoPanner());
        delay.delayTime.value = time; filter.type = 'lowpass'; filter.frequency.value = 2600;
        gain.gain.value = 0.055; panner.pan.value = pan;
        presence.connect(delay); delay.connect(filter); filter.connect(gain);
        gain.connect(panner); panner.connect(master);
      }
    }
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noiseVoice = (type, frequency, q) => {
      const source = track(ctx.createBufferSource()), filter = track(ctx.createBiquadFilter());
      const gain = track(ctx.createGain()); gain.gain.value = 0;
      source.buffer = noiseBuffer; source.loop = true;
      filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
      source.connect(filter); filter.connect(gain); gain.connect(master);
      sources.push(source); source.start(); return { gain, filter };
    };
    const tyre = noiseVoice('bandpass', 1050, 0.7);
    tyreGain = tyre.gain; tyreFilter = tyre.filter;
    const wind = noiseVoice('lowpass', 400, 0.5);
    windGain = wind.gain; windFilter = wind.filter;
    gravelGain = noiseVoice('bandpass', 350, 0.7).gain;
    return true;
  }

  function burst(frequency, duration, volume, endFrequency = frequency) {
    const source = ctx.createOscillator(), gain = ctx.createGain();
    source.type = 'sine'; source.frequency.setValueAtTime(frequency, ctx.currentTime);
    source.frequency.exponentialRampToValueAtTime(endFrequency, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain); gain.connect(master);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(); source.stop(ctx.currentTime + duration + 0.01);
  }

  const api = {
    start() {
      if (!ctx && !build()) return Promise.resolve();
      if (!paused && ctx.state === 'suspended' && !contextFactory) ctx.resume().catch(() => {});
      if (!engineLoading) {
        const activeContext = ctx;
        engineLoading = loadRaceEngineBuffers(ctx).then((buffers) => {
          if (ctx !== activeContext || ctx.state === 'closed') return;
          for (const buffer of buffers) {
            const source = track(ctx.createBufferSource()), gain = track(ctx.createGain());
            source.buffer = buffer; source.loop = true; gain.gain.value = 0;
            source.connect(gain); gain.connect(engineGain);
            sources.push(source); engineVoices.push({ source, gain }); source.start();
          }
          if (latestState) api.update(latestState);
        }).catch((error) => {
          engineLoading = null;
          console.warn('Unable to load recorded racing engine:', error);
        });
      }
      return engineLoading;
    },
    setMuted(value) {
      muted = value;
      if (ctx) smooth(master.gain, muted || paused ? 0 : 0.6, 0.025);
    },
    setPaused(value) {
      paused = value;
      if (!ctx) return;
      smooth(master.gain, muted || paused ? 0 : 0.6, 0.025);
      if (paused && ctx.state === 'running') ctx.suspend().catch(() => {});
      else if (!paused && ctx.state === 'suspended' && !contextFactory) ctx.resume().catch(() => {});
    },
    update(state) {
      latestState = state;
      if (!ctx || paused || ctx.state === 'closed') return;
      const rpm = clamp(state.rpm, 0, 1), speed = clamp(state.speed, 0, 110);
      const slip = clamp(Math.abs(state.slip || 0), 0, 1.5);
      const drift = state.mode === 'drift';
      // A single running recording avoids two unrelated pitches beating
      // against one another. Only blend with idle while pulling away.
      const now = ctx.currentTime;
      const pitch = pitchControl(state, now);
      const running = clamp(speed / 9 + rpm * 0.25, 0, 1);
      for (let i = 0; i < engineVoices.length; i++) {
        const voice = engineVoices[i];
        smooth(voice.gain.gain, Math.sqrt(i === 0 ? 1 - running : running), 0.12);
        const rate = i === 0 ? 0.88 + pitch.rev * 0.12 : pitch.rate;
        smooth(voice.source.playbackRate, rate, 0.14);
      }
      if (pitch.shifted && speed > 5) shiftUntil = now + 0.07;
      smooth(engineGain.gain, (0.5 + pitch.rev * 0.06 + (state.throttle ? 0.16 : 0)) * (now < shiftUntil ? 0.93 : 1), 0.065);
      smooth(engineFilter.frequency, 4000 + pitch.rev * (drift ? 450 : 850), 0.12);
      const scrub = state.onRoad && (state.drifting || state.braking) ? Math.min(0.11, slip * 0.2 + (state.braking ? 0.015 : 0)) * Math.min(1, speed / 14) : 0;
      smooth(tyreGain.gain, scrub, 0.08);
      smooth(tyreFilter.frequency, 850 + Math.min(1, slip) * 400, 0.12);

      smooth(windGain.gain, Math.min(0.11, (speed / 92) ** 2 * 0.11), 0.15);
      smooth(windFilter.frequency, 250 + speed * 11, 0.15);
      smooth(gravelGain.gain, state.onRoad ? 0 : Math.min(0.14, speed / 92 * 0.2), 0.08);
      const count = Math.ceil(state.countdown || 0);
      if (!muted && state.phase === 'countdown' && count > 0 && count <= 3 && count !== previousCount) burst(660, 0.11, 0.14);
      if (!muted && previousPhase === 'countdown' && state.phase === 'racing') burst(990, 0.25, 0.16);
      previousCount = count; previousPhase = state.phase;
    },
    impact(strength) {
      if (!ctx || muted || paused || ctx.currentTime - lastImpact < 0.08) return;
      lastImpact = ctx.currentTime;
      const amount = clamp(strength, 0, 1), duration = 0.12 + amount * 0.16;
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = noiseBuffer; filter.type = 'lowpass'; filter.frequency.value = 500 + amount * 1600;
      gain.gain.setValueAtTime(0.12 + amount * 0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(filter); filter.connect(gain); gain.connect(master);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(); source.stop(ctx.currentTime + duration + 0.01);
      burst(75 + amount * 45, duration * 0.7, 0.12 + amount * 0.2, 32);
    },
    dispose() {
      if (!ctx) return;
      for (const source of sources) { try { source.stop(); } catch { /* already stopped */ } }
      nodes.forEach((node) => node.disconnect());
      sources.length = 0; nodes.length = 0; engineVoices.length = 0;
      engineLoading = null; latestState = null;
      pitchControl = createEnginePitchController();
      ctx.close?.().catch(() => {}); ctx = null;
    },
  };
  return api;
}
