import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { buildCircuit, CIRCUITS, wrapAngle } from '../src/lib/circuits.js';
import { buildDrivingSurface, createRoadHeightSampler } from '../src/lib/track-materials.js';
import { F1_WHEELS, COUPE_WHEELS } from '../src/lib/car-geometry.js';

// Independent ray/triangle intersections verify contact against the visible
// geometry, including lap wrap, changing banks, curbs and runoff.
let checked = 0;
// Run the actual locator from GameLoop so this test covers its persistent
// progress state, rather than only testing surfaces with correct lap distances.
const source = readFileSync(new URL('../src/pages/Drift.jsx', import.meta.url), 'utf8');
const locateSource = source.slice(source.indexOf('    const prev = g.progress;'), source.indexOf('    const onRoad ='));
const locate = new Function('g', 'c', 'car', 'wrapAngle', `
  const { N } = c;
  ${locateSource}
  return { s: (bestI + seg) * c.step, frame: p };
`);
for (const def of CIRCUITS) {
  const circuit = buildCircuit(def);
  const sample = createRoadHeightSampler(circuit);
  const tracker = { progress: (circuit.startIndex - 3 + circuit.N) % circuit.N };
  for (let travelled = -3; travelled < circuit.lapLength + 20; travelled += 2) {
    const distance = circuit.startIndex * circuit.step + travelled;
    const frame = circuit.frameAt(distance);
    const car = { x: frame.x + frame.nx * -3.6, z: frame.z + frame.nz * -3.6 };
    const found = locate(tracker, circuit, car, wrapAngle);
    const error = Math.abs(((found.s - distance + circuit.lapLength * 1.5) % circuit.lapLength) - circuit.lapLength / 2);
    assert.ok(error < 5, `${def.id}: progress froze after travelling ${travelled}m (error ${error}m)`);
    assert.notEqual(sample(car.x, car.z, found.s), null, `${def.id}: lost road after travelling ${travelled}m`);
  }
  const geometry = buildDrivingSurface(circuit);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const meshes = Object.values(geometry).map((geo) => new THREE.Mesh(geo, material));
  meshes.forEach((mesh) => mesh.updateMatrixWorld());
  const ray = new THREE.Raycaster();
  const wheels = def.kind === 'drift' ? COUPE_WHEELS : F1_WHEELS;
  const rotation = new THREE.Euler(0, 0, 0, 'YZX');

  const indices = new Set([0, circuit.N - 1, 2460 % circuit.N]);
  for (let i = 0; i < circuit.N; i += 31) indices.add(i);
  for (const i of indices) {
    const s = (i + 0.35) * circuit.step;
    const frame = circuit.frameAt(s);
    for (const lat of [-frame.half - 4, -frame.half, -3.6, 0, 8, frame.half, frame.half + 4]) {
      // A stale lap distance plus a sideways collision correction must still
      // find the actual surface beneath the new world position.
      const x = frame.x + frame.nx * lat;
      const z = frame.z + frame.nz * lat;
      rotation.set(-Math.atan(frame.grade), frame.ang + 0.25, Math.atan(frame.tilt), 'YZX');
      const points = wheels.map((wheel) => {
        const offset = new THREE.Vector3(wheel.x, wheel.r, wheel.z).applyEuler(rotation);
        return { x: x + offset.x, z: z + offset.z, bottom: offset.y - wheel.r };
      });
      let y = sample(x, z, s - 3);
      assert.notEqual(y, null, `${def.id}: missing centre contact at ${i}/${lat}`);
      for (const point of points) {
        const height = sample(point.x, point.z, s - 3);
        assert.notEqual(height, null, `${def.id}: missing tyre contact at ${i}/${lat}`);
        y = Math.max(y, height - point.bottom + 0.012);
        ray.set(new THREE.Vector3(point.x, 100, point.z), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObjects(meshes)[0];
        assert.ok(hit, 'test contact must be on the rendered surface');
        assert.ok(Math.abs(height - hit.point.y) < 1e-4, `${def.id}: sampler disagrees with rendered triangle`);
        checked++;
      }
      for (const point of points) {
        assert.ok(y + point.bottom >= sample(point.x, point.z, s - 3) + 0.0119, 'tyre penetrates road');
      }
    }
  }
  Object.values(geometry).forEach((geo) => geo.dispose());
  material.dispose();
}
console.log(`Verified ${checked} tyre contacts against rendered road triangles.`);
