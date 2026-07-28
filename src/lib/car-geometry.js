/* ────────────────────────────────────────────────────────────────
   Car geometry factories.

   Kept out of the React layer so they can be built (and tested)
   without a renderer. Rival cars are merged down to a single
   vertex-coloured buffer each, which keeps a full grid at one draw
   call per car.
   ──────────────────────────────────────────────────────────────── */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const CARBON = '#15161a';

/* Profiles are authored in (length, height) and extruded across the
   car's width, then rotated so length runs along +Z. */
export function extrudeProfile(profile, width, bevel = 0.06) {
  const shape = new THREE.Shape();
  profile.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 2, curveSegments: 4,
  });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(Math.PI / 2);
  return geo;
}

export const F1_PROFILE = [
  [-2.25, 0.12], [-2.25, 0.34], [-1.70, 0.40], [-1.05, 0.46],
  [-0.62, 0.78], [-0.10, 0.84], [0.28, 0.66], [0.62, 0.50],
  [1.30, 0.40], [2.05, 0.32], [2.42, 0.26], [2.42, 0.14],
];

export const COUPE_PROFILE = [
  [-2.05, 0.26], [-2.10, 0.62], [-1.98, 0.84], [-0.80, 0.90],
  [-0.52, 1.30], [0.32, 1.34], [0.66, 0.94], [1.10, 0.84],
  [1.92, 0.74], [2.08, 0.44], [1.94, 0.24],
];

export const SIDEPOD_PROFILE = [
  [-1.30, 0.16], [-1.24, 0.56], [-0.30, 0.68], [0.62, 0.62], [0.90, 0.30], [0.86, 0.14],
];

export const COUPE_GLASS_PROFILE = [
  [-0.74, 0.92], [-0.50, 1.26], [0.30, 1.30], [0.60, 0.96],
];

export const F1_WHEELS = [
  { x: -0.86, z: 1.52, r: 0.36, w: 0.34, front: true },
  { x: 0.86, z: 1.52, r: 0.36, w: 0.34, front: true },
  { x: -0.90, z: -1.42, r: 0.40, w: 0.46, front: false },
  { x: 0.90, z: -1.42, r: 0.40, w: 0.46, front: false },
];

export const COUPE_WHEELS = [
  { x: -0.82, z: 1.24, r: 0.35, w: 0.30, front: true },
  { x: 0.82, z: 1.24, r: 0.35, w: 0.30, front: true },
  { x: -0.84, z: -1.28, r: 0.36, w: 0.36, front: false },
  { x: 0.84, z: -1.28, r: 0.36, w: 0.36, front: false },
];

/* Bake a flat colour into a geometry and normalise its attributes so
   a batch of parts can be merged in one go. ExtrudeGeometry comes back
   non-indexed while the primitives are indexed, and mergeGeometries
   refuses a mixed batch — so everything is flattened to non-indexed. */
export function paintGeo(source, hex) {
  const geo = source.index ? source.toNonIndexed() : source;
  if (geo !== source) source.dispose();
  const c = new THREE.Color(hex).convertSRGBToLinear();
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  if (geo.attributes.uv1) geo.deleteAttribute('uv1');
  return geo;
}

export function buildRivalBody(color, helmet) {
  const parts = [];
  const add = (geo, hex, pos = [0, 0, 0], rot = [0, 0, 0]) => {
    if (rot[0]) geo.rotateX(rot[0]);
    if (rot[1]) geo.rotateY(rot[1]);
    if (rot[2]) geo.rotateZ(rot[2]);
    geo.translate(pos[0], pos[1], pos[2]);
    parts.push(paintGeo(geo, hex));
  };
  add(extrudeProfile(F1_PROFILE, 0.82, 0.07), color);
  add(new THREE.BoxGeometry(1.55, 0.06, 4.4), CARBON, [0, 0.09, -0.1]);
  for (const x of [-0.62, 0.62]) add(extrudeProfile(SIDEPOD_PROFILE, 0.5, 0.06), color, [x, 0, -0.25]);
  add(new THREE.SphereGeometry(0.16, 10, 8), helmet, [0, 0.8, 0.2]);
  add(new THREE.TorusGeometry(0.33, 0.045, 6, 12, Math.PI), CARBON, [0, 0.8, 0.33]);
  add(new THREE.BoxGeometry(0.035, 0.36, 1.1), '#f2f3f6', [0, 0.86, -1.3]);
  add(new THREE.BoxGeometry(1.95, 0.05, 0.56), CARBON, [0, 0.14, 2.5]);
  add(new THREE.BoxGeometry(1.75, 0.035, 0.32), color, [0, 0.25, 2.36], [-0.34, 0, 0]);
  for (const x of [-0.97, 0.97]) add(new THREE.BoxGeometry(0.05, 0.32, 0.6), CARBON, [x, 0.27, 2.5]);
  add(new THREE.BoxGeometry(0.09, 0.55, 0.14), CARBON, [0, 0.74, -2.05]);
  add(new THREE.BoxGeometry(1.55, 0.05, 0.44), CARBON, [0, 0.98, -2.18]);
  add(new THREE.BoxGeometry(1.55, 0.04, 0.28), color, [0, 1.10, -2.30], [0.42, 0, 0]);
  for (const x of [-0.78, 0.78]) add(new THREE.BoxGeometry(0.05, 0.48, 0.52), color, [x, 0.96, -2.18]);
  add(new THREE.BoxGeometry(0.10, 0.22, 0.06), '#8a1212', [0, 0.42, -2.34]);
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  parts.forEach((p) => p.dispose());
  return merged;
}

/* The player's wheel, merged into a single vertex-coloured buffer.
   Built per-wheel-size and cached — as separate meshes this was ten draw
   calls per corner, forty for the car, which dominated the frame. */
const wheelCache = new Map();
export function buildWheel(r, w, rimHex) {
  const key = `${r}|${w}|${rimHex}`;
  if (wheelCache.has(key)) return wheelCache.get(key);
  const parts = [];
  const carcass = new THREE.CylinderGeometry(r * 0.94, r * 0.94, w, 14);
  carcass.rotateZ(Math.PI / 2);
  parts.push(paintGeo(carcass, '#0e0f13'));
  const tread = new THREE.CylinderGeometry(r, r, w * 0.72, 14);
  tread.rotateZ(Math.PI / 2);
  parts.push(paintGeo(tread, '#131418'));
  const barrel = new THREE.CylinderGeometry(r * 0.62, r * 0.62, w * 0.86, 12);
  barrel.rotateZ(Math.PI / 2);
  parts.push(paintGeo(barrel, rimHex));
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.BoxGeometry(w * 0.5, r * 1.1, 0.055);
    spoke.rotateX((i / 5) * Math.PI * 2);
    parts.push(paintGeo(spoke, rimHex));
  }
  const cap = new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 1.02, 8);
  cap.rotateZ(Math.PI / 2);
  parts.push(paintGeo(cap, '#e2b23a'));
  const caliper = new THREE.BoxGeometry(w * 0.34, 0.16, 0.2);
  caliper.translate(0, r * 0.42, 0);
  parts.push(paintGeo(caliper, '#c8481f'));
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  parts.forEach((p) => p.dispose());
  wheelCache.set(key, merged);
  return merged;
}

export function buildRivalWheel() {
  const tyre = new THREE.CylinderGeometry(0.38, 0.38, 0.40, 14);
  tyre.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.22, 0.22, 0.42, 10);
  rim.rotateZ(Math.PI / 2);
  const parts = [paintGeo(tyre, '#111116'), paintGeo(rim, '#a9acb4')];
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  parts.forEach((p) => p.dispose());
  return merged;
}

/* Low-poly tree used for circuit scenery. */
export function buildTree() {
  const trunk = new THREE.CylinderGeometry(0.16, 0.26, 1.8, 6);
  trunk.translate(0, 0.9, 0);
  const canopy = new THREE.IcosahedronGeometry(1.5, 0);
  canopy.translate(0, 2.9, 0);
  const canopy2 = new THREE.IcosahedronGeometry(1.05, 0);
  canopy2.translate(0.5, 3.9, -0.3);
  const parts = [
    paintGeo(trunk, '#5d4126'), paintGeo(canopy, '#2f7a35'), paintGeo(canopy2, '#3d9142'),
  ];
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  parts.forEach((p) => p.dispose());
  return merged;
}
