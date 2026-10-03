/* Recorded F1 engine layers with procedural tyre, wind and impact effects.
   Continuous voices are created once; controls
   run at 30 Hz and use smoothed parameters. Short voices disconnect on end. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

let decodedEngine = null;
export function loadRaceEngineBuffers(context) {
  if (!decodedEngine) {
    decodedEngine = Promise.all(['idle', 'mid', 'high'].map(async (name) => {
      for (const extension of ['ogg', 'mp3']) {
        try {
          const response = await fetch(`/audio/race/f1-${name}.${extension}`);
          if (!response.ok) throw new Error(`Engine sample HTTP ${response.status}`);
          return await context.decodeAudioData(await response.arrayBuffer());
        } catch (error) {
          if (extension === 'mp3') throw error;
        }
      }
    })).catch((error) => { decodedEngine = null; throw error; });
  }
  return decodedEngine;
}

export function createRaceAudio({ contextFactory } = {}) {
  let ctx, master, engineFilter, engineGain;
  let engineLoading = null, latestState = null;
  const engineVoices = [];
  let tyreGain, tyreFilter, tyreTone, windGain, windFilter, gravelGain, noiseBuffer;
  let muted = false, paused = false, previousGear = null, previousPhase = '', previousCount = -1;
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
    limiter.threshold.value = -16; limiter.knee.value = 12; limiter.ratio.value = 5;
    limiter.attack.value = 0.003; limiter.release.value = 0.15;
    master.connect(limiter); limiter.connect(ctx.destination);

    engineGain = track(ctx.createGain()); engineGain.gain.value = 0;
    engineFilter = track(ctx.createBiquadFilter()); engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 700; engineFilter.Q.value = 0.65;
    engineGain.connect(engineFilter); engineFilter.connect(master);
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
    const tyre = noiseVoice('bandpass', 1300, 1.8);
    tyreGain = tyre.gain; tyreFilter = tyre.filter;
    tyreTone = track(ctx.createOscillator()); tyreTone.type = 'triangle';
    const toneGain = track(ctx.createGain()); toneGain.gain.value = 0.08;
    tyreTone.connect(toneGain); toneGain.connect(tyreGain); sources.push(tyreTone); tyreTone.start();
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
      const rev = speed > 8 ? 0.42 + rpm * 0.58 : rpm * 0.6;
      const low = Math.max(0, 1 - rev * 2), high = Math.max(0, rev * 2 - 1);
      const weights = [low, 1 - low - high, high];
      for (let i = 0; i < engineVoices.length; i++) {
        const voice = engineVoices[i];
        smooth(voice.gain.gain, Math.sqrt(weights[i]), 0.085);
        smooth(voice.source.playbackRate, (drift ? 0.72 : 0.86) + rev * (i === 0 ? 0.34 : 0.28), 0.07);
      }
      const now = ctx.currentTime;
      if (previousGear !== null && state.gear !== previousGear && state.phase === 'racing' && speed > 5) {
        shiftUntil = now + 0.09;
        if (!muted) burst(state.gear > previousGear ? 100 : 150, 0.055, 0.045, 50);
      }
      previousGear = state.gear;
      smooth(engineGain.gain, (0.42 + rpm * 0.18 + (state.throttle ? 0.26 : 0)) * (now < shiftUntil ? 0.45 : 1), 0.025);
      smooth(engineFilter.frequency, 4000 + rpm * (drift ? 3500 : 6500) + (state.throttle ? 1200 : 0));
      const scrub = state.onRoad ? Math.min(0.18, slip * 0.3 + (state.braking ? 0.02 : 0)) * Math.min(1, speed / 14) : 0;
      smooth(tyreGain.gain, scrub, 0.08);
      smooth(tyreFilter.frequency, 900 + slip * 850 + rpm * 150, 0.1);
      smooth(tyreTone.frequency, 650 + slip * 300 + speed * 2, 0.09);
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
      ctx.close?.().catch(() => {}); ctx = null;
    },
  };
  return api;
}
