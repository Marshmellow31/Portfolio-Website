import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSEO from '../utils/useSEO';
import { createCarState, stepCar, MAX_SPEED } from '../lib/drift-physics';
import {
  createTrack, biomeIndexAt, biomeFloatAt, hash1,
  ROAD_HALF, BIOMES,
} from '../lib/drift-track';

/* ════════════════════════════════════════════════════════════════
   DRIFT — an endless procedural arcade drift racer.
   Arcade-sim physics, thick tyre smoke, low-poly sports car,
   cinematic chase camera, and addictive drift scoring.
   ════════════════════════════════════════════════════════════════ */

const WINDOW = 84;
const SEED = 7.13;

/* ── Biome colour palettes ── */
const STYLE = {
  mountains: { land: '#2f9e44', water: '#1f7a8c', sky: '#8ecae6' },
  beach:     { land: '#e9d8a6', water: '#00a8cc', sky: '#caf0f8' },
  river:     { land: '#40916c', water: '#0077b6', sky: '#90e0ef' },
};
const _c = (h) => new THREE.Color(h);
const LAND  = BIOMES.map((b) => _c(STYLE[b].land));
const WATER = BIOMES.map((b) => _c(STYLE[b].water));
const SKY   = BIOMES.map((b) => _c(STYLE[b].sky));

const tmpColor = new THREE.Color();
function blendBiome(colors, bf) {
  const i = Math.floor(bf) % 3;
  const n = (i + 1) % 3;
  return tmpColor.copy(colors[i]).lerp(colors[n], bf - Math.floor(bf));
}

const wrapAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

const WHEEL_POS = [
  [-0.88, 0.35, 1.15],   // FL
  [0.88, 0.35, 1.15],    // FR
  [-0.88, 0.35, -1.15],  // RL
  [0.88, 0.35, -1.15],   // RR
];

/* ── Game state factory ── */
function createGame(track) {
  const p0 = track.get(0);
  const p1 = track.get(1);
  return {
    track,
    car: createCarState(p0.x, p0.z, Math.atan2(p1.x - p0.x, p1.z - p0.z)),
    started: false,
    progress: 0, base: 0, biomeF: 0,
    score: 0, combo: 1, currentDriftPts: 0, driftTime: 0, grace: 0,
    best: Number(localStorage.getItem('hp-drift-best')) || 0,
    dist: 0,
    shake: 0, comboFlash: 0,
    driftPopup: null, driftPopupId: 0,
    input: { left: false, right: false, throttle: false, brake: false, handbrake: false },
  };
}

/* ═══════════════════════════════════════════════════════════════
   CarModel — low-poly sports car with animated wheels,
   suspension, body roll/pitch, and brake lights.
   ═══════════════════════════════════════════════════════════════ */
function CarModel({ game }) {
  const group  = useRef();
  const body   = useRef();
  const wFL = useRef(), wFR = useRef(), wRL = useRef(), wRR = useRef();
  const steerFL = useRef(), steerFR = useRef();
  const spinFL = useRef(), spinFR = useRef(), spinRL = useRef(), spinRR = useRef();
  const tailMatL = useRef(), tailMatR = useRef();

  const wRefs  = [wFL, wFR, wRL, wRR];
  const sRefs  = [spinFL, spinFR, spinRL, spinRR];
  const stRefs = [steerFL, steerFR];

  useFrame(() => {
    const car = game.current.car;
    // Position + heading
    group.current.position.set(car.x, 0, car.z);
    group.current.rotation.y = car.heading;

    // Body roll + pitch + counter-steer visual yaw
    if (body.current) {
      const velAng = Math.atan2(car.vx, car.vz);
      const bodyYaw = wrapAngle(velAng - car.heading) * -0.35;
      body.current.rotation.z += (-car.lateralG * 0.7 - body.current.rotation.z) * 0.15;
      body.current.rotation.x += (car.longG * 0.035 - body.current.rotation.x) * 0.12;
      body.current.rotation.y += (bodyYaw - body.current.rotation.y) * 0.1;
    }

    // Wheels — steering, spin, suspension
    const steerVis = car.steer * 0.45;
    if (stRefs[0].current) stRefs[0].current.rotation.y = steerVis;
    if (stRefs[1].current) stRefs[1].current.rotation.y = steerVis;

    const pitchOff = car.longG * 0.025;
    const latOff   = car.lateralG * 0.08;
    const susp = [
      pitchOff + latOff,   pitchOff - latOff,
      -pitchOff + latOff,  -pitchOff - latOff,
    ];
    for (let i = 0; i < 4; i++) {
      if (wRefs[i].current) wRefs[i].current.position.y = WHEEL_POS[i][1] + susp[i];
      if (sRefs[i].current) sRefs[i].current.rotation.x = -car.wheelSpin;
    }

    // Brake lights
    const brk = game.current.input.brake ? 3.5 : 0.5;
    if (tailMatL.current) tailMatL.current.emissiveIntensity = brk;
    if (tailMatR.current) tailMatR.current.emissiveIntensity = brk;
  });

  const wheelContent = (spinRef) => (
    <group ref={spinRef}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.24, 14]} />
        <meshStandardMaterial color="#1B1B24" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.26, 6]} />
        <meshStandardMaterial color="#666" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );

  return (
    <group ref={group}>
      {/* ── Body ── */}
      <group ref={body}>
        {/* Lower chassis */}
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[2.0, 0.45, 4.0]} />
          <meshStandardMaterial color="#FF2E63" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Hood */}
        <mesh castShadow position={[0, 0.52, 1.2]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[1.85, 0.12, 1.4]} />
          <meshStandardMaterial color="#FF2E63" metalness={0.5} roughness={0.25} />
        </mesh>
        {/* Cabin / greenhouse */}
        <mesh castShadow position={[0, 0.78, -0.2]}>
          <boxGeometry args={[1.5, 0.45, 1.5]} />
          <meshStandardMaterial color="#08D9D6" metalness={0.6} roughness={0.1} />
        </mesh>
        {/* Rear deck */}
        <mesh castShadow position={[0, 0.52, -1.3]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[1.85, 0.12, 1.0]} />
          <meshStandardMaterial color="#FF2E63" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Front bumper */}
        <mesh position={[0, 0.18, 2.05]}>
          <boxGeometry args={[2.1, 0.22, 0.25]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.9} />
        </mesh>
        {/* Rear bumper */}
        <mesh position={[0, 0.18, -2.05]}>
          <boxGeometry args={[2.1, 0.22, 0.25]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.9} />
        </mesh>
        {/* Fender flares */}
        {[[-1.02, 0.35, 0.95], [1.02, 0.35, 0.95], [-1.05, 0.35, -1.0], [1.05, 0.35, -1.0]].map(([x, y, z], j) => (
          <mesh key={j} castShadow position={[x, y, z]}>
            <boxGeometry args={[0.16, 0.36, 0.95]} />
            <meshStandardMaterial color="#FF2E63" metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
        {/* Spoiler */}
        <mesh castShadow position={[0, 0.88, -1.75]}>
          <boxGeometry args={[1.8, 0.07, 0.35]} />
          <meshStandardMaterial color="#FFD93D" />
        </mesh>
        <mesh position={[-0.55, 0.73, -1.75]}>
          <boxGeometry args={[0.08, 0.25, 0.08]} />
          <meshStandardMaterial color="#1a1a24" />
        </mesh>
        <mesh position={[0.55, 0.73, -1.75]}>
          <boxGeometry args={[0.08, 0.25, 0.08]} />
          <meshStandardMaterial color="#1a1a24" />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.6, 0.42, 2.01]}>
          <boxGeometry args={[0.35, 0.14, 0.05]} />
          <meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0.6, 0.42, 2.01]}>
          <boxGeometry args={[0.35, 0.14, 0.05]} />
          <meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.8} />
        </mesh>
        {/* Tail lights */}
        <mesh position={[-0.6, 0.42, -2.01]}>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshStandardMaterial ref={tailMatL} color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.6, 0.42, -2.01]}>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshStandardMaterial ref={tailMatR} color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={0.5} />
        </mesh>
        {/* Side intakes */}
        <mesh position={[-1.01, 0.3, 0.1]}>
          <boxGeometry args={[0.04, 0.12, 0.4]} />
          <meshStandardMaterial color="#1a1a24" />
        </mesh>
        <mesh position={[1.01, 0.3, 0.1]}>
          <boxGeometry args={[0.04, 0.12, 0.4]} />
          <meshStandardMaterial color="#1a1a24" />
        </mesh>
      </group>

      {/* ── Wheels ── */}
      {WHEEL_POS.map((pos, i) => (
        <group key={i} ref={wRefs[i]} position={pos}>
          {i < 2
            ? <group ref={stRefs[i]}>{wheelContent(sRefs[i])}</group>
            : wheelContent(sRefs[i])}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GameLoop — physics step, scoring, particle emission.
   Runs every rAF tick; does NOT render anything.
   ═══════════════════════════════════════════════════════════════ */
function GameLoop({ game, isMobile, smokeApi, skidApi, sparkApi, dirtApi }) {
  useFrame((_, dt) => {
    const g = game.current;
    dt = Math.min(dt, 0.04);

    // Auto-throttle on mobile once started
    if (isMobile && g.started && !g.input.brake) g.input.throttle = true;

    // Progress — nearest centerline point
    const track = g.track;
    let bestI = Math.floor(g.progress), bestD = Infinity;
    for (let k = Math.max(0, bestI - 3); k < bestI + 8; k++) {
      const p = track.get(k);
      const d = (p.x - g.car.x) ** 2 + (p.z - g.car.z) ** 2;
      if (d < bestD) { bestD = d; bestI = k; }
    }
    g.progress = bestI;
    g.base = Math.max(0, bestI - 6);
    track.ensure(bestI + WINDOW + 20);

    const nearDist = Math.sqrt(bestD);
    const onRoad = nearDist < ROAD_HALF + 1.2;
    g.biomeF = biomeFloatAt(bestI);

    // Respawn if player sailed off into the water
    if (nearDist > 46) {
      const p = track.get(bestI), pn = track.get(bestI + 1);
      g.car.x = p.x; g.car.z = p.z; g.car.vx = 0; g.car.vz = 0; g.car.speed = 0;
      g.car.heading = Math.atan2(pn.x - p.x, pn.z - p.z);
      g.combo = 1; g.currentDriftPts = 0; g.driftTime = 0;
    }

    // Step physics
    stepCar(g.car, g.input, dt, onRoad);

    // ── Scoring ──
    const isDrift = g.car.drifting;
    if (isDrift) {
      const edgeDist = ROAD_HALF - nearDist;
      const nearMiss = edgeDist > 0 && edgeDist < 1.5 ? 1.5 : 1.0;
      g.currentDriftPts += g.car.slip * g.car.speed * dt * 6 * g.combo * nearMiss;
      g.driftTime += dt;
      g.grace = 1.2;
      const nc = Math.min(12, 1 + Math.floor(g.driftTime / 1.2));
      if (nc > g.combo) g.comboFlash = 1;
      g.combo = nc;
    } else if (g.grace > 0) {
      g.grace -= dt;
      if (g.grace <= 0) {
        if (g.currentDriftPts > 5) {
          const pts = Math.round(g.currentDriftPts);
          g.score += pts;
          g.driftPopupId++;
          g.driftPopup = { id: g.driftPopupId, pts };
        }
        g.currentDriftPts = 0;
        g.driftTime = 0;
        g.combo = 1;
      }
    }
    if (g.score + g.currentDriftPts > g.best) {
      g.best = Math.round(g.score + g.currentDriftPts);
      localStorage.setItem('hp-drift-best', String(g.best));
    }
    g.dist += g.car.speed * dt;

    // ── Camera shake ──
    if (g.car.driftJustEntered) g.shake = 0.8;
    if (!onRoad && g.car.speed > 5) g.shake = Math.max(g.shake, 0.25);
    if (g.car.slipDeg > 50) g.shake = Math.max(g.shake, 0.4);
    g.shake *= (1 - dt * 6);
    g.comboFlash *= (1 - dt * 4);

    // ── Particles ──
    const fx = Math.sin(g.car.heading), fz = Math.cos(g.car.heading);
    const rx = -fz, rz = fx;
    if (isDrift) {
      if (smokeApi.current) {
        smokeApi.current.emit(g.car.x - fx * 1.3 + rx * -0.85, g.car.z - fz * 1.3 + rz * -0.85, g.car.slip);
        smokeApi.current.emit(g.car.x - fx * 1.3 + rx * 0.85, g.car.z - fz * 1.3 + rz * 0.85, g.car.slip);
      }
      if (skidApi.current) {
        skidApi.current.emit(g.car.x - fx * 1.3 + rx * -0.85, g.car.z - fz * 1.3 + rz * -0.85, g.car.heading);
        skidApi.current.emit(g.car.x - fx * 1.3 + rx * 0.85, g.car.z - fz * 1.3 + rz * 0.85, g.car.heading);
      }
    }
    if (g.car.slipDeg > 40 && sparkApi.current && Math.random() > 0.6) {
      sparkApi.current.emit(g.car.x - fx * 1.5, g.car.z - fz * 1.5, g.car.vx, g.car.vz);
    }
    if (!onRoad && g.car.speed > 5 && dirtApi.current) {
      dirtApi.current.emit(g.car.x - fx * 0.5, g.car.z - fz * 0.5);
    }
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Road — ribbon mesh that follows the centerline
   ═══════════════════════════════════════════════════════════════ */
function Road({ game }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WINDOW * 2 * 3), 3));
    const normals = new Float32Array(WINDOW * 2 * 3);
    for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    const idx = [];
    for (let w = 0; w < WINDOW - 1; w++) {
      const l = w * 2, r = w * 2 + 1, l2 = (w + 1) * 2, r2 = (w + 1) * 2 + 1;
      idx.push(l, r, l2, r, r2, l2);
    }
    g.setIndex(idx);
    return g;
  }, []);

  useFrame(() => {
    const g = game.current;
    const pos = geo.attributes.position.array;
    const track = g.track;
    for (let w = 0; w < WINDOW; w++) {
      const p = track.get(g.base + w);
      const lx = Math.cos(p.ang), lz = -Math.sin(p.ang);
      const o = w * 6;
      pos[o]     = p.x + lx * ROAD_HALF; pos[o + 1] = 0.06; pos[o + 2] = p.z + lz * ROAD_HALF;
      pos[o + 3] = p.x - lx * ROAD_HALF; pos[o + 4] = 0.06; pos[o + 5] = p.z - lz * ROAD_HALF;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  });

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#2b2b33" roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RoadMarkings — shader overlay: dashed centre line + edge lines
   ═══════════════════════════════════════════════════════════════ */
function RoadMarkings({ game }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WINDOW * 2 * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(WINDOW * 2 * 2), 2));
    const idx = [];
    for (let w = 0; w < WINDOW - 1; w++) {
      const l = w * 2, r = w * 2 + 1, l2 = (w + 1) * 2, r2 = (w + 1) * 2 + 1;
      idx.push(l, r, l2, r, r2, l2);
    }
    g.setIndex(idx);
    return g;
  }, []);

  useFrame(() => {
    const g = game.current;
    const pos = geo.attributes.position.array;
    const uvs = geo.attributes.uv.array;
    const track = g.track;
    for (let w = 0; w < WINDOW; w++) {
      const i = g.base + w;
      const p = track.get(i);
      const lx = Math.cos(p.ang), lz = -Math.sin(p.ang);
      const o = w * 6;
      pos[o]     = p.x + lx * ROAD_HALF; pos[o + 1] = 0.075; pos[o + 2] = p.z + lz * ROAD_HALF;
      pos[o + 3] = p.x - lx * ROAD_HALF; pos[o + 4] = 0.075; pos[o + 5] = p.z - lz * ROAD_HALF;
      const uo = w * 4;
      uvs[uo] = 0; uvs[uo + 1] = i * 0.5;
      uvs[uo + 2] = 1; uvs[uo + 3] = i * 0.5;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.uv.needsUpdate = true;
    geo.computeBoundingSphere();
  });

  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float u = vUv.x;
        float v = vUv.y;
        float el = 1.0 - smoothstep(0.0, 0.025, u);
        float er = 1.0 - smoothstep(0.975, 1.0, u);
        float cb = smoothstep(0.485, 0.495, u) * (1.0 - smoothstep(0.505, 0.515, u));
        float dash = step(0.5, fract(v));
        float cl = cb * dash;
        float a = max(max(el, er), cl) * 0.8;
        if (a < 0.05) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a);
      }
    `,
  }), []);

  return <mesh geometry={geo} material={mat} />;
}

/* ═══════════════════════════════════════════════════════════════
   Scenery — instanced pines / palms / rocks / peaks
   ═══════════════════════════════════════════════════════════════ */
const CAP = { pine: 120, palm: 70, rock: 90, peak: 40 };
function Scenery({ game }) {
  const refs = {
    pine: useRef(), pineTrunk: useRef(), palm: useRef(),
    palmTop: useRef(), rock: useRef(), peak: useRef(),
  };
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const last = useRef(-1);

  useFrame(() => {
    const g = game.current;
    if (g.base === last.current) return;
    last.current = g.base;
    const track = g.track;
    const count = { pine: 0, palm: 0, rock: 0, peak: 0 };

    const place = (ref, n, x, y, z, s, ry = 0) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(n, dummy.matrix);
    };

    for (let w = 0; w < WINDOW; w++) {
      const i = g.base + w;
      const p = track.get(i);
      const biome = biomeIndexAt(i);
      const lx = Math.cos(p.ang), lz = -Math.sin(p.ang);
      for (const side of [-1, 1]) {
        const h = hash1(i * 2 + (side > 0 ? 1 : 0));
        if (h > 0.72) continue;
        const off = ROAD_HALF + 2.5 + h * 10;
        const px = p.x + lx * off * side;
        const pz = p.z + lz * off * side;
        const r2 = hash1(i * 3.7 + side);
        if (biome === 0) {
          if (count.pine < CAP.pine) {
            const s = 0.8 + r2 * 0.8;
            place(refs.pine, count.pine, px, 1.5 * s, pz, s);
            place(refs.pineTrunk, count.pine, px, 0.5 * s, pz, s);
            count.pine++;
          }
          if (r2 > 0.88 && count.peak < CAP.peak) {
            const s = 2.4 + r2 * 2;
            place(refs.peak, count.peak, p.x + lx * (60 + r2 * 45) * side, 4.5 * s - 1, pz + r2 * 40, s);
            count.peak++;
          }
        } else if (biome === 1) {
          if (h < 0.4 && count.palm < CAP.palm) {
            const s = 0.9 + r2 * 0.6;
            place(refs.palm, count.palm, px, 1.4 * s, pz, s, r2 * 6.28);
            place(refs.palmTop, count.palm, px, 3.0 * s, pz, s, r2 * 6.28);
            count.palm++;
          } else if (count.rock < CAP.rock) {
            place(refs.rock, count.rock, px, 0.4, pz, 0.6 + r2 * 0.8);
            count.rock++;
          }
        } else {
          if (count.rock < CAP.rock) {
            place(refs.rock, count.rock, px, 0.3, pz, 0.5 + r2 * 1.1);
            count.rock++;
          }
        }
      }
    }
    // hide unused
    dummy.scale.setScalar(0); dummy.position.set(0, -999, 0); dummy.updateMatrix();
    for (const [key, ref] of [
      ['pine', refs.pine], ['pine', refs.pineTrunk],
      ['palm', refs.palm], ['palm', refs.palmTop],
      ['rock', refs.rock], ['peak', refs.peak],
    ]) {
      const cap = CAP[key];
      for (let n = count[key]; n < cap; n++) ref.current.setMatrixAt(n, dummy.matrix);
      ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={refs.pine} args={[null, null, CAP.pine]} castShadow>
        <coneGeometry args={[1.2, 3, 7]} /><meshStandardMaterial color="#1b5e20" />
      </instancedMesh>
      <instancedMesh ref={refs.pineTrunk} args={[null, null, CAP.pine]}>
        <cylinderGeometry args={[0.22, 0.28, 1, 5]} /><meshStandardMaterial color="#6b4423" />
      </instancedMesh>
      <instancedMesh ref={refs.peak} args={[null, null, CAP.peak]} castShadow>
        <coneGeometry args={[4, 9, 6]} /><meshStandardMaterial color="#6b7280" />
      </instancedMesh>
      <instancedMesh ref={refs.palm} args={[null, null, CAP.palm]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.8, 6]} /><meshStandardMaterial color="#8d6748" />
      </instancedMesh>
      <instancedMesh ref={refs.palmTop} args={[null, null, CAP.palm]} castShadow>
        <coneGeometry args={[1.6, 1.1, 6]} /><meshStandardMaterial color="#2d6a4f" />
      </instancedMesh>
      <instancedMesh ref={refs.rock} args={[null, null, CAP.rock]} castShadow>
        <icosahedronGeometry args={[0.8, 0]} /><meshStandardMaterial color="#8a8f98" flatShading />
      </instancedMesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Terrain — land island + surrounding water
   ═══════════════════════════════════════════════════════════════ */
function Terrain({ game }) {
  const land  = useRef();
  const water = useRef();
  useFrame(({ scene }) => {
    const g = game.current;
    if (land.current) {
      land.current.position.set(g.car.x, 0, g.car.z);
      land.current.material.color.copy(blendBiome(LAND, g.biomeF));
    }
    if (water.current) {
      water.current.position.set(g.car.x, -0.55, g.car.z);
      water.current.material.color.copy(blendBiome(WATER, g.biomeF));
    }
    const sky = blendBiome(SKY, g.biomeF);
    if (scene.background) scene.background.copy(sky); else scene.background = sky.clone();
    if (scene.fog) scene.fog.color.copy(sky);
  });
  return (
    <group>
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[600, 8]} />
        <meshStandardMaterial color="#00a8cc" transparent opacity={0.92} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh ref={land} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[120, 60]} />
        <meshStandardMaterial color="#2f9e44" roughness={1} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Particle Systems — all pooled instanced meshes
   ═══════════════════════════════════════════════════════════════ */

/* ── Tyre Smoke ── */
const PUFF = 120;
function TyreSmoke({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: PUFF }, () => ({
    x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, s: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, z, slip) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % PUFF;
      p.x = x + (Math.random() - 0.5) * 0.5;
      p.y = 0.3;
      p.z = z + (Math.random() - 0.5) * 0.5;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = 0.8 + Math.random() * 0.5;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.life = 1.2 + slip * 0.5;
      p.s = 0.4 + slip * 0.8;
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < PUFF; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.s += dt * 1.5;
        p.vy *= (1 - dt * 0.5);
      }
      dummy.position.set(p.x, p.life > 0 ? p.y : -999, p.z);
      dummy.scale.setScalar(p.life > 0 ? p.s : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, PUFF]}>
      <sphereGeometry args={[0.5, 6, 6]} />
      <meshStandardMaterial color="#e8e8ee" transparent opacity={0.35} roughness={1} />
    </instancedMesh>
  );
}

/* ── Skid Marks ── */
const SKID = 300;
function SkidMarks({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: SKID }, () => ({
    x: 0, y: -999, z: 0, heading: 0, life: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, z, heading) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % SKID;
      p.x = x; p.y = 0.065; p.z = z;
      p.heading = heading;
      p.life = 4;
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SKID; i++) {
      const p = pool[i];
      if (p.life > 0) p.life -= dt;
      const vis = p.life > 0 ? 1 : 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      dummy.rotation.set(0, p.heading, 0);
      dummy.scale.set(0.12 * vis, 1, 0.5 * vis);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SKID]}>
      <boxGeometry args={[1, 0.01, 1]} />
      <meshBasicMaterial color="#1a1a1a" transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ── Sparks ── */
const SPARK = 40;
function Sparks({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: SPARK }, () => ({
    x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, z, cvx, cvz) {
      for (let k = 0; k < 3; k++) {
        const p = pool[cursor.current];
        cursor.current = (cursor.current + 1) % SPARK;
        p.x = x + (Math.random() - 0.5);
        p.y = 0.15;
        p.z = z + (Math.random() - 0.5);
        p.vx = cvx * 0.3 + (Math.random() - 0.5) * 8;
        p.vy = 2 + Math.random() * 4;
        p.vz = cvz * 0.3 + (Math.random() - 0.5) * 8;
        p.life = 0.3 + Math.random() * 0.4;
      }
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SPARK; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 12 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.4; p.vx *= 0.7; p.vz *= 0.7; }
      }
      dummy.position.set(p.x, p.life > 0 ? p.y : -999, p.z);
      dummy.scale.setScalar(p.life > 0 ? 0.06 : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SPARK]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FFB347" />
    </instancedMesh>
  );
}

/* ── Dirt Particles ── */
const DIRT = 50;
function DirtKick({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: DIRT }, () => ({
    x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, s: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, z) {
      for (let k = 0; k < 2; k++) {
        const p = pool[cursor.current];
        cursor.current = (cursor.current + 1) % DIRT;
        p.x = x + (Math.random() - 0.5) * 1.5;
        p.y = 0.2;
        p.z = z + (Math.random() - 0.5) * 1.5;
        p.vx = (Math.random() - 0.5) * 3;
        p.vy = 2 + Math.random() * 3;
        p.vz = (Math.random() - 0.5) * 3;
        p.life = 0.4 + Math.random() * 0.3;
        p.s = 0.1 + Math.random() * 0.15;
      }
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < DIRT; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 9.8 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0) { p.y = 0; p.vy *= -0.3; }
      }
      dummy.position.set(p.x, p.life > 0 ? p.y : -999, p.z);
      dummy.scale.setScalar(p.life > 0 ? p.s : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, DIRT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial color="#8B7355" roughness={1} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ChaseCam — dynamic cinematic camera: drift swing, FOV zoom,
   height drop, and camera shake.
   ═══════════════════════════════════════════════════════════════ */
function ChaseCam({ game }) {
  useFrame(({ camera }, dt) => {
    const g = game.current;
    const car = g.car;
    const spd = car.speed / MAX_SPEED;

    // Base follow position
    const back = 10 + spd * 2;
    const up   = 5.5 - spd * 1.7;
    let tx = car.x - Math.sin(car.heading) * back;
    let tz = car.z - Math.cos(car.heading) * back;

    // Drift swing — camera offsets to outside of drift
    if (car.drifting && car.slip > 0.15) {
      const rx = -Math.cos(car.heading), rz = Math.sin(car.heading);
      const swing = Math.min(car.slip * 3.5, 4) * -car.slipSign;
      tx += rx * swing;
      tz += rz * swing;
    }

    // Smooth follow
    const k = 1 - Math.exp(-3.5 * Math.min(dt, 0.05));
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (up - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;

    // Shake
    if (g.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * g.shake * 0.3;
      camera.position.y += (Math.random() - 0.5) * g.shake * 0.15;
    }

    // FOV — widens at speed
    const targetFov = 58 + spd * 14;
    camera.fov += (targetFov - camera.fov) * k;
    camera.updateProjectionMatrix();

    camera.lookAt(car.x, 1, car.z);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   HUD — Speedometer SVG gauge
   ═══════════════════════════════════════════════════════════════ */
const GAUGE = { cx: 90, cy: 85, r: 65, start: 150, sweep: 240, max: 200 };

function gaugeArc(startDeg, sweepDeg) {
  if (sweepDeg < 0.5) return '';
  const toR = Math.PI / 180;
  const x1 = GAUGE.cx + GAUGE.r * Math.cos(startDeg * toR);
  const y1 = GAUGE.cy + GAUGE.r * Math.sin(startDeg * toR);
  const ed = startDeg + sweepDeg;
  const x2 = GAUGE.cx + GAUGE.r * Math.cos(ed * toR);
  const y2 = GAUGE.cy + GAUGE.r * Math.sin(ed * toR);
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${GAUGE.r} ${GAUGE.r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function Speedometer({ speed }) {
  const pct = Math.min(1, speed / GAUGE.max);
  return (
    <svg viewBox="0 0 180 130" className="w-[140px] md:w-[170px]">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08D9D6" />
          <stop offset="70%" stopColor="#FF2E63" />
          <stop offset="100%" stopColor="#FFD93D" />
        </linearGradient>
      </defs>
      <path d={gaugeArc(GAUGE.start, GAUGE.sweep)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" strokeLinecap="round" />
      {pct > 0 && (
        <path d={gaugeArc(GAUGE.start, pct * GAUGE.sweep)} fill="none" stroke="url(#sg)" strokeWidth="5" strokeLinecap="round" />
      )}
      <text x={GAUGE.cx} y={GAUGE.cy - 6} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{speed}</text>
      <text x={GAUGE.cx} y={GAUGE.cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'JetBrains Mono', monospace" letterSpacing="3">KM/H</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════ */
export default function Drift() {
  useSEO({ title: 'Drift', description: 'An endless procedural arcade drift racer. Manual throttle, handbrake drifts, thick tyre smoke, and addictive combo scoring.', path: '/drift' });

  const trackRef = useRef(null);
  if (!trackRef.current) trackRef.current = createTrack(SEED);
  const game    = useRef(createGame(trackRef.current));
  const smokeApi = useRef(null);
  const skidApi  = useRef(null);
  const sparkApi = useRef(null);
  const dirtApi  = useRef(null);

  const [touch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches);
  const [hud, setHud] = useState({
    speed: 0, score: 0, combo: 1, best: game.current.best, biome: 'mountains',
    drifting: false, started: false, dist: 0, slipDeg: 0,
    currentDriftPts: 0, comboFlash: 0, speedPct: 0,
  });
  const [popup, setPopup] = useState(null);
  const popupRef = useRef(0);

  /* ── Keyboard input ── */
  useEffect(() => {
    const map = {
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'throttle', KeyW: 'throttle',
      ArrowDown: 'brake', KeyS: 'brake',
      Space: 'handbrake', ShiftLeft: 'handbrake',
    };
    const set = (code, v) => {
      const key = map[code];
      if (!key) return;
      game.current.input[key] = v;
      if (v && !game.current.started) game.current.started = true;
    };
    const down = (e) => { if (map[e.code]) { e.preventDefault(); set(e.code, true); } };
    const up   = (e) => set(e.code, false);
    const blur = () => {
      const inp = game.current.input;
      inp.left = inp.right = inp.throttle = inp.brake = inp.handbrake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  /* ── HUD poll ── */
  useEffect(() => {
    const id = setInterval(() => {
      const g = game.current;
      if (import.meta.env.DEV) window.__hpDrift = g;
      setHud({
        speed: Math.round(g.car.speed * 3.4),
        score: Math.round(g.score + g.currentDriftPts),
        combo: g.combo,
        best: g.best,
        biome: BIOMES[biomeIndexAt(Math.floor(g.progress))],
        drifting: g.car.drifting,
        started: g.started,
        dist: Math.round(g.dist),
        slipDeg: g.car.slipDeg,
        currentDriftPts: Math.round(g.currentDriftPts),
        comboFlash: g.comboFlash,
        speedPct: g.car.speed / MAX_SPEED,
      });
      // Drift popup
      const dp = g.driftPopup;
      if (dp && dp.id > popupRef.current) {
        popupRef.current = dp.id;
        setPopup({ id: dp.id, pts: dp.pts });
        setTimeout(() => setPopup((p) => p && p.id === dp.id ? null : p), 1500);
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  const press = (key, v) => (e) => {
    e.preventDefault();
    game.current.input[key] = v;
    if (v) game.current.started = true;
  };

  const touchBtn = 'pointer-events-auto select-none flex items-center justify-center w-[68px] h-[68px] rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-white text-xl font-bold active:bg-white/30 touch-none';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans">
      <Canvas shadows camera={{ position: [0, 6, -12], fov: 58 }} dpr={[1, 1.75]}>
        <fog attach="fog" args={['#8ecae6', 70, 240]} />
        <ambientLight intensity={0.8} />
        <directionalLight castShadow position={[-30, 50, -20]} intensity={1.5}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-80} shadow-camera-right={80}
          shadow-camera-top={80} shadow-camera-bottom={-80}
        />
        <Terrain game={game} />
        <Road game={game} />
        <RoadMarkings game={game} />
        <SkidMarks api={skidApi} />
        <Scenery game={game} />
        <CarModel game={game} />
        <TyreSmoke api={smokeApi} />
        <Sparks api={sparkApi} />
        <DirtKick api={dirtApi} />
        <GameLoop game={game} isMobile={touch}
          smokeApi={smokeApi} skidApi={skidApi}
          sparkApi={sparkApi} dirtApi={dirtApi}
        />
        <ChaseCam game={game} />
      </Canvas>

      {/* ── HUD Overlay ── */}
      <div className="absolute inset-0 pointer-events-none p-[clamp(16px,4vw,32px)] flex flex-col justify-between z-10">

        {/* Top bar */}
        <div className="flex justify-between items-start w-full gap-4">
          {/* Nav pills */}
          <div className="flex gap-2">
            <Link to="/" className="pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">← SITE</Link>
            <Link to="/playground" className="pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">PLAYGROUND</Link>
          </div>

          {/* Score + combo + meta */}
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="font-mono text-white bg-black/30 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-2.5 shadow-lg">
              <span className="text-[24px] font-bold leading-none">{hud.score.toLocaleString()}</span>
              <span className="text-[10px] tracking-[.15em] text-white/60 ml-1.5">DRIFT PTS</span>
            </div>
            <div className={`font-mono text-[11px] tracking-[.12em] rounded-full px-4 py-1.5 border transition-colors ${hud.drifting ? 'text-black bg-[#FFD93D] border-[#FFD93D]' : 'text-white/80 bg-black/30 border-white/15'}`}>
              {hud.combo > 1 ? `COMBO ×${hud.combo}` : hud.drifting ? `DRIFT ${hud.slipDeg}°` : `${hud.speed} KM/H`}
            </div>
            {/* Live drift pts */}
            {hud.drifting && hud.currentDriftPts > 0 && (
              <div className="font-mono text-[13px] text-[#FFD93D] font-bold tracking-wider animate-pulse">
                +{hud.currentDriftPts.toLocaleString()}
              </div>
            )}
            <div className="font-mono text-[9px] tracking-[.14em] text-white/60 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 uppercase">
              {hud.biome} · {hud.dist}m · best {hud.best.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Start screen */}
        {!hud.started && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-black/45 backdrop-blur-xl border border-white/15 rounded-2xl px-9 py-8 shadow-2xl max-w-[440px] mx-4">
              <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-4">Playground / Drift</div>
              <div className="text-white font-bold text-[26px] leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
                An endless road through<br />mountains, beaches &amp; rivers.
              </div>
              <div className="font-mono text-[11px] tracking-[.1em] text-white/70 leading-[2]">
                {touch ? 'TAP ◀ ▶ TO STEER · HOLD DRIFT TO SLIDE' : 'W — GAS · A/D — STEER · SPACE — DRIFT'}<br />
                {touch ? 'CHAIN DRIFTS FOR COMBOS' : 'S — BRAKE · CHAIN DRIFTS FOR COMBOS'}
              </div>
            </div>
          </div>
        )}

        {/* Bottom row */}
        {touch ? (
          <div className="flex justify-between items-end w-full pb-3">
            <div className="flex gap-3">
              <button className={touchBtn} onPointerDown={press('left', true)} onPointerUp={press('left', false)} onPointerLeave={press('left', false)} onContextMenu={(e) => e.preventDefault()}>◀</button>
              <button className={touchBtn} onPointerDown={press('right', true)} onPointerUp={press('right', false)} onPointerLeave={press('right', false)} onContextMenu={(e) => e.preventDefault()}>▶</button>
            </div>
            <div className="flex gap-3 items-end">
              <button className={`${touchBtn} w-[60px] h-[60px] text-[14px] bg-red-500/20 border-red-500/40`} onPointerDown={press('brake', true)} onPointerUp={press('brake', false)} onPointerLeave={press('brake', false)} onContextMenu={(e) => e.preventDefault()}>BRK</button>
              <button className={`${touchBtn} w-[92px] bg-[#FFD93D]/80 text-black`} onPointerDown={press('handbrake', true)} onPointerUp={press('handbrake', false)} onPointerLeave={press('handbrake', false)} onContextMenu={(e) => e.preventDefault()}>DRIFT</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end">
            {/* Speedometer */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg">
              <Speedometer speed={hud.speed} />
            </div>
            {/* Controls hint */}
            <div className="font-mono text-[9px] md:text-[10px] tracking-[.1em] text-white/50 leading-[1.9] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              W GAS · A/D STEER · SPACE DRIFT · S BRAKE
            </div>
          </div>
        )}
      </div>

      {/* ── Drift Popup ── */}
      {popup && (
        <div key={popup.id} className="absolute left-1/2 top-[35%] -translate-x-1/2 pointer-events-none z-20"
          style={{ animation: 'driftPop 1.5s ease-out forwards' }}>
          <div className="text-[#FFD93D] font-bold text-3xl md:text-4xl font-mono tracking-wider text-center drop-shadow-lg">
            DRIFT +{popup.pts.toLocaleString()}
          </div>
        </div>
      )}

      {/* ── Combo Flash Vignette ── */}
      {hud.comboFlash > 0.05 && (
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ boxShadow: `inset 0 0 100px 25px rgba(255,217,61,${hud.comboFlash * 0.3})` }} />
      )}

      {/* ── Speed Vignette ── */}
      {hud.speedPct > 0.4 && (
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${(hud.speedPct - 0.4) * 0.5}) 100%)` }} />
      )}

      {/* ── Animation Keyframes ── */}
      <style>{`
        @keyframes driftPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.7); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.15); }
          30%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
