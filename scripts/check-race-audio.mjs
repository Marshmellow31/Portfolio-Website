import { createRaceAudio } from '../src/lib/drift-audio.js';

// Run in a browser with OfflineAudioContext. Exercises the actual audio graph
// without speakers, autoplay permissions, or a real-time rendering dependency.
export async function checkRaceAudio(OfflineContext = globalThis.OfflineAudioContext) {
  const scenarios = [
    ['idle', { rpm: 0, speed: 0, gear: 1, onRoad: true }],
    ['acceleration', { rpm: 0.85, speed: 70, gear: 6, onRoad: true, throttle: true }],
    ['drift', { mode: 'drift', rpm: 0.7, speed: 25, gear: 3, onRoad: true, slip: 0.8 }],
    ['gravel', { rpm: 0.5, speed: 30, gear: 3, onRoad: false }],
    ['impact', { rpm: 0.3, speed: 20, gear: 2, onRoad: true }],
    ['countdown', { rpm: 0, speed: 0, gear: 1, onRoad: true, phase: 'countdown', countdown: 3 }],
    ['muted', { rpm: 1, speed: 90, gear: 8, onRoad: true, throttle: true }],
  ];
  const results = [];
  for (const [name, state] of scenarios) {
    const context = new OfflineContext(2, 48000, 48000);
    const audio = createRaceAudio({ contextFactory: () => context });
    audio.setMuted(name === 'muted');
    await audio.start();
    audio.update({ mode: 'race', phase: 'racing', ...state });
    if (name === 'impact') audio.impact(1);
    const buffer = await context.startRendering();
    let peak = 0, sum = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      for (const value of buffer.getChannelData(channel)) {
        if (!Number.isFinite(value)) throw new Error(`${name}: invalid audio sample`);
        peak = Math.max(peak, Math.abs(value));
        sum += value * value;
      }
    }
    const rms = Math.sqrt(sum / (buffer.length * buffer.numberOfChannels));
    if (peak >= 1 || (name === 'muted' ? peak > 1e-7 : rms < 0.005)) {
      throw new Error(`${name}: clipping, unintended silence, or failed mute`);
    }
    results.push({ name, peak: +peak.toFixed(4), rms: +rms.toFixed(4) });
    audio.dispose();
  }
  return results;
}
