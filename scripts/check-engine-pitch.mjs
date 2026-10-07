import assert from 'node:assert/strict';
import { createEnginePitchController } from '../src/lib/drift-audio.js';

const control = createEnginePitchController();
let lastRate = null, shifts = 0;
for (let frame = 0; frame < 150; frame++) {
  const jitter = frame >= 30 && frame < 60;
  const shifted = frame >= 60;
  const gear = jitter ? (frame % 2 ? 4 : 3) : shifted ? 4 : 3;
  const result = control({ mode: 'race', phase: 'racing', gear, speed: 40,
    rpm: gear === 3 ? 1 : 0, throttle: true }, frame / 30);
  assert.ok(result.rate <= 1.04, 'high-rev playback exceeds its pitch ceiling');
  if (lastRate !== null) assert.ok(Math.abs(result.rate - lastRate) < 0.012,
    'pitch chirps at a gear boundary');
  if (result.shifted) shifts++;
  lastRate = result.rate;
}
assert.equal(shifts, 1, 'gear threshold jitter must not trigger repeated shifts');
const held = control({ mode: 'race', phase: 'racing', gear: 4, speed: 92, rpm: 1 }, 6);
assert.ok(held.rate <= 1.04);
console.log('Verified stable gear-boundary pitch, slew limits, and high-RPM ceiling.');
