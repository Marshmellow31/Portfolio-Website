import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSEO from '../utils/useSEO';
import { createCarState, stepCar, gearFor, MAX_SPEED } from '../lib/drift-physics';
import {
  createTrack, surfaceY, hash1,
  TRACK_HALF, WALL_OFF, STRAIGHT, RADIUS, SEG,
} from '../lib/drift-track';

/* ════════════════════════════════════════════════════════════════
   RACE — an F1 car on a banked NASCAR-style superspeedway oval.
   Long straights (no constant steering), banked turns, lap timing,
   wall contact sparks, tyre smoke, and a cinematic chase camera.
   ════════════════════════════════════════════════════════════════ */

const PAPAYA = '#FF7C00';
const CARBON = '#15161a';

const wrapAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

/* Wheel layout — F1: exposed wheels, wide track, long wheelbase */
const WHEELS = [
  { x: -0.80, z: 1.50, r: 0.33, w: 0.30, front: true },
  { x:  0.80, z: 1.50, r: 0.33, w: 0.30, front: true },
  { x: -0.82, z: -1.35, r: 0.35, w: 0.40, front: false },
  { x:  0.82, z: -1.35, r: 0.35, w: 0.40, front: false },
];

/* ── Game state factory ── */
function spawnCar(track) {
  const i0 = track.startIndex - 12;
  const p0 = track.get(i0);
  const p1 = track.get(i0 + 1);
  return createCarState(p0.x, p0.z, Math.atan2(p1.x - p0.x, p1.z - p0.z));
}

function createGame(track) {
  return {
    track,
    car: spawnCar(track),
    started: false,
    progress: track.startIndex - 12,
    visY: 0, visRoll: 0,
    lapTime: 0, lastLap: 0, laps: 0,
    bestLap: Number(localStorage.getItem('hp-race-best')) || 0,
    topSpeed: 0,
    shake: 0,
    popup: null, popupId: 0,
    input: { left: false, right: false, throttle: false, brake: false, handbrake: false },
  };
}

function resetToLine(g) {
  g.car = spawnCar(g.track);
  g.progress = g.track.startIndex - 12;
  g.lapTime = 0;
  g.visY = 0; g.visRoll = 0;
}

/* ═══════════════════════════════════════════════════════════════
   F1CarModel — low-poly open-wheel single seater.
   Front/rear wings, sidepods, halo, exposed wheels with steering
   + spin, suspension arms, exhaust flame, blinking rain light.
   ═══════════════════════════════════════════════════════════════ */
function F1CarModel({ game }) {
  const group = useRef();
  const body = useRef();
  const wheelRefs = [useRef(), useRef(), useRef(), useRef()];
  const steerRefs = [useRef(), useRef()];
  const spinRefs = [useRef(), useRef(), useRef(), useRef()];
  const rainMat = useRef();
  const flame = useRef();

  useEffect(() => {
    if (group.current) group.current.rotation.order = 'YZX';
  }, []);

  useFrame(({ clock }) => {
    const g = game.current;
    const car = g.car;
    if (!group.current) return;

    group.current.position.set(car.x, g.visY, car.z);
    group.current.rotation.y = car.heading;
    group.current.rotation.z = g.visRoll;

    // Body lean from G forces + slight yaw toward velocity
    if (body.current) {
      const velAng = Math.atan2(car.vx, car.vz);
      const bodyYaw = car.speed > 4 ? wrapAngle(velAng - car.heading) * -0.25 : 0;
      body.current.rotation.z += (-car.lateralG * 0.35 - body.current.rotation.z) * 0.15;
      body.current.rotation.x += (car.longG * 0.02 - body.current.rotation.x) * 0.12;
      body.current.rotation.y += (bodyYaw - body.current.rotation.y) * 0.1;
    }

    // Wheels — steering + spin + tiny suspension travel
    const steerVis = car.steer * 0.38;
    steerRefs.forEach((r) => { if (r.current) r.current.rotation.y = steerVis; });
    const pitchOff = car.longG * 0.012;
    for (let i = 0; i < 4; i++) {
      const wr = wheelRefs[i];
      if (wr.current) {
        const lat = car.lateralG * 0.03 * (WHEELS[i].x > 0 ? -1 : 1);
        wr.current.position.y = WHEELS[i].r + (i < 2 ? pitchOff : -pitchOff) + lat;
      }
      if (spinRefs[i].current) spinRefs[i].current.rotation.x = -car.wheelSpin;
    }

    // Rain light — blinks hard under braking, dim glow otherwise
    if (rainMat.current) {
      const t = clock.getElapsedTime();
      rainMat.current.emissiveIntensity = g.input.brake
        ? (Math.sin(t * 28) > 0 ? 5 : 0.4)
        : 0.6;
    }

    // Exhaust flame — flickers with throttle + revs
    if (flame.current) {
      const on = g.input.throttle && car.speed > 2;
      const s = on ? 0.6 + car.rpm * 0.6 + Math.random() * 0.5 : 0;
      flame.current.scale.set(s * 0.7, s * 0.7, s);
    }
  });

  const tire = (w) => (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[w.r, w.r, w.w, 16]} />
      <meshStandardMaterial color="#111116" roughness={0.9} />
    </mesh>
  );
  const rim = (w) => (
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[w.r * 0.55, w.r * 0.55, w.w + 0.02, 8]} />
      <meshStandardMaterial color="#3a3b40" metalness={0.8} roughness={0.3} />
    </mesh>
  );

  return (
    <group ref={group}>
      <group ref={body}>
        {/* Floor plank */}
        <mesh position={[0, 0.1, -0.1]}>
          <boxGeometry args={[1.5, 0.07, 4.3]} />
          <meshStandardMaterial color={CARBON} roughness={0.85} />
        </mesh>

        {/* Nose cone */}
        <mesh castShadow position={[0, 0.34, 1.85]} rotation={[0.055, 0, 0]}>
          <boxGeometry args={[0.34, 0.2, 1.5]} />
          <meshStandardMaterial color={PAPAYA} metalness={0.3} roughness={0.35} />
        </mesh>
        {/* Front wing — main plane + flap + endplates */}
        <mesh castShadow position={[0, 0.16, 2.42]}>
          <boxGeometry args={[1.9, 0.05, 0.52]} />
          <meshStandardMaterial color={CARBON} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.26, 2.3]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[1.7, 0.035, 0.3]} />
          <meshStandardMaterial color={PAPAYA} roughness={0.4} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, 0.28, 2.42]}>
            <boxGeometry args={[0.05, 0.28, 0.55]} />
            <meshStandardMaterial color={CARBON} roughness={0.5} />
          </mesh>
        ))}

        {/* Monocoque / cockpit */}
        <mesh castShadow position={[0, 0.42, 0.55]}>
          <boxGeometry args={[0.76, 0.4, 1.7]} />
          <meshStandardMaterial color={PAPAYA} metalness={0.35} roughness={0.3} />
        </mesh>
        {/* Cockpit opening */}
        <mesh position={[0, 0.63, 0.42]}>
          <boxGeometry args={[0.5, 0.06, 0.9]} />
          <meshStandardMaterial color="#0a0a0e" roughness={1} />
        </mesh>
        {/* Driver helmet + headrest */}
        <mesh position={[0, 0.68, 0.25]}>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color="#0b6cff" metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.62, 0.0]}>
          <boxGeometry args={[0.42, 0.18, 0.22]} />
          <meshStandardMaterial color={CARBON} roughness={0.7} />
        </mesh>
        {/* Halo */}
        <mesh position={[0, 0.68, 0.28]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.31, 0.045, 6, 14, Math.PI]} />
          <meshStandardMaterial color={CARBON} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.78, 0.52]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.55]} />
          <meshStandardMaterial color={CARBON} metalness={0.6} roughness={0.35} />
        </mesh>

        {/* Sidepods */}
        {[-0.56, 0.56].map((x) => (
          <group key={x}>
            <mesh castShadow position={[x, 0.36, -0.35]}>
              <boxGeometry args={[0.52, 0.34, 1.5]} />
              <meshStandardMaterial color={PAPAYA} metalness={0.3} roughness={0.35} />
            </mesh>
            <mesh position={[x, 0.36, 0.44]}>
              <boxGeometry args={[0.46, 0.26, 0.06]} />
              <meshStandardMaterial color="#0a0a0e" roughness={1} />
            </mesh>
          </group>
        ))}

        {/* Engine cover + airbox */}
        <mesh castShadow position={[0, 0.6, -0.85]}>
          <boxGeometry args={[0.4, 0.42, 1.7]} />
          <meshStandardMaterial color={PAPAYA} metalness={0.35} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.85, -0.15]}>
          <boxGeometry args={[0.26, 0.2, 0.3]} />
          <meshStandardMaterial color={CARBON} roughness={0.6} />
        </mesh>
        {/* Shark fin */}
        <mesh position={[0, 0.82, -1.45]}>
          <boxGeometry args={[0.04, 0.3, 0.9]} />
          <meshStandardMaterial color="#f5f5f7" roughness={0.4} />
        </mesh>

        {/* Rear wing — pylon, main plane, upper flap, endplates */}
        <mesh position={[0, 0.72, -2.0]}>
          <boxGeometry args={[0.08, 0.5, 0.12]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.92, -2.12]}>
          <boxGeometry args={[1.5, 0.05, 0.42]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.04, -2.2]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[1.5, 0.04, 0.26]} />
          <meshStandardMaterial color={PAPAYA} roughness={0.4} />
        </mesh>
        {[-0.76, 0.76].map((x) => (
          <mesh key={x} position={[x, 0.9, -2.12]}>
            <boxGeometry args={[0.05, 0.42, 0.5]} />
            <meshStandardMaterial color={PAPAYA} metalness={0.3} roughness={0.4} />
          </mesh>
        ))}

        {/* Diffuser + rain light */}
        <mesh position={[0, 0.22, -2.22]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[1.1, 0.1, 0.5]} />
          <meshStandardMaterial color={CARBON} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.42, -2.28]}>
          <boxGeometry args={[0.1, 0.22, 0.06]} />
          <meshStandardMaterial ref={rainMat} color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={0.6} />
        </mesh>
        {/* Exhaust flame */}
        <mesh ref={flame} position={[0, 0.5, -2.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.55, 7]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.85} />
        </mesh>

        {/* Mirrors */}
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.6, 0.95]}>
            <boxGeometry args={[0.14, 0.07, 0.05]} />
            <meshStandardMaterial color={CARBON} roughness={0.4} />
          </mesh>
        ))}

        {/* Suspension arms */}
        {WHEELS.map((w, i) => (
          <group key={i}>
            <mesh position={[w.x * 0.6, 0.36, w.z]}>
              <boxGeometry args={[Math.abs(w.x) * 0.95, 0.045, 0.13]} />
              <meshStandardMaterial color={CARBON} roughness={0.5} />
            </mesh>
            <mesh position={[w.x * 0.6, 0.28, w.z - 0.18]}>
              <boxGeometry args={[Math.abs(w.x) * 0.9, 0.035, 0.08]} />
              <meshStandardMaterial color={CARBON} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Wheels (outside body group so they don't inherit lean) */}
      {WHEELS.map((w, i) => (
        <group key={i} ref={wheelRefs[i]} position={[w.x, w.r, w.z]}>
          {w.front
            ? <group ref={steerRefs[i]}><group ref={spinRefs[i]}>{tire(w)}{rim(w)}</group></group>
            : <group ref={spinRefs[i]}>{tire(w)}{rim(w)}</group>}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GameLoop — physics, progress + lap timing, wall collision,
   banking visual state, particle emission. Renders nothing.
   ═══════════════════════════════════════════════════════════════ */
function GameLoop({ game, isMobile, smokeApi, skidApi, sparkApi, dirtApi }) {
  useFrame((_, dt) => {
    const g = game.current;
    dt = Math.min(dt, 0.04);
    const track = g.track;
    const N = track.N;

    if (isMobile && g.started && !g.input.brake) g.input.throttle = true;

    /* ── Progress: nearest centerline point (with wrap) ── */
    const prev = g.progress;
    let bestI = prev, bestD = Infinity;
    for (let k = prev - 3; k < prev + 14; k++) {
      const p = track.get(k);
      const d = (p.x - g.car.x) ** 2 + (p.z - g.car.z) ** 2;
      if (d < bestD) { bestD = d; bestI = ((k % N) + N) % N; }
    }
    if (bestD > 1600) {
      // lost (deep infield tour) — full rescan
      for (let k = 0; k < N; k += 2) {
        const p = track.get(k);
        const d = (p.x - g.car.x) ** 2 + (p.z - g.car.z) ** 2;
        if (d < bestD) { bestD = d; bestI = k; }
      }
    }

    /* ── Lap crossing ── */
    const delta = (bestI - prev + N) % N;
    if (delta > 0 && delta < N / 2) {
      const toLine = (track.startIndex - prev + N) % N;
      if (toLine > 0 && toLine <= delta) {
        if (g.lapTime > 10) {
          g.laps++;
          g.lastLap = g.lapTime;
          const isBest = !g.bestLap || g.lastLap < g.bestLap;
          if (isBest) {
            g.bestLap = g.lastLap;
            localStorage.setItem('hp-race-best', String(g.bestLap));
          }
          g.popupId++;
          g.popup = { id: g.popupId, t: g.lastLap, best: isBest };
        }
        g.lapTime = 0;
      }
    }
    g.progress = bestI;
    if (g.started) g.lapTime += dt;

    /* ── Track frame: lateral offset + banking ── */
    const p = track.get(bestI);
    const dLat = (g.car.x - p.x) * p.ox + (g.car.z - p.z) * p.oz;
    const onRoad = dLat > -(TRACK_HALF + 6.5) && dLat < TRACK_HALF + 0.6;

    /* ── Outer wall collision ── */
    const wallD = WALL_OFF - 0.85;
    if (dLat > wallD) {
      g.car.x -= p.ox * (dLat - wallD);
      g.car.z -= p.oz * (dLat - wallD);
      const vn = g.car.vx * p.ox + g.car.vz * p.oz;
      if (vn > 0) {
        g.car.vx -= p.ox * vn * 1.6;
        g.car.vz -= p.oz * vn * 1.6;
        g.car.vx *= 0.93; g.car.vz *= 0.93;
        g.shake = Math.max(g.shake, Math.min(1.2, vn * 0.06));
        if (sparkApi.current) {
          sparkApi.current.emit(g.car.x + p.ox * 0.8, g.visY + 0.5, g.car.z + p.oz * 0.8, g.car.vx, g.car.vz, 6);
        }
      }
    }

    /* ── Physics step ── */
    stepCar(g.car, g.input, dt, onRoad);
    if (g.car.speed > g.topSpeed) g.topSpeed = g.car.speed;

    /* ── Banking visuals: height + roll toward the infield ── */
    const targetY = surfaceY(p, dLat);
    const leftX = Math.cos(g.car.heading), leftZ = -Math.sin(g.car.heading);
    const rise = p.slope * (p.ox * leftX + p.oz * leftZ);
    const targetRoll = Math.atan(rise);
    const kv = Math.min(1, dt * 9);
    g.visY += (targetY - g.visY) * kv;
    g.visRoll += (targetRoll - g.visRoll) * kv;

    /* ── Camera shake ── */
    if (g.car.driftJustEntered) g.shake = Math.max(g.shake, 0.35);
    if (!onRoad && g.car.speed > 5) g.shake = Math.max(g.shake, 0.25);
    g.shake *= (1 - dt * 6);

    /* ── Particles ── */
    const fx = Math.sin(g.car.heading), fz = Math.cos(g.car.heading);
    const rx = -fz, rz = fx;
    const py = g.visY + 0.2;
    if (g.car.drifting && onRoad) {
      const amt = Math.max(g.car.slip, g.input.brake ? 0.25 : 0);
      if (smokeApi.current) {
        smokeApi.current.emit(g.car.x - fx * 1.4 + rx * -0.8, py, g.car.z - fz * 1.4 + rz * -0.8, amt);
        smokeApi.current.emit(g.car.x - fx * 1.4 + rx * 0.8, py, g.car.z - fz * 1.4 + rz * 0.8, amt);
      }
      if (skidApi.current) {
        skidApi.current.emit(g.car.x - fx * 1.4 + rx * -0.8, g.visY + 0.03, g.car.z - fz * 1.4 + rz * -0.8, g.car.heading, g.visRoll);
        skidApi.current.emit(g.car.x - fx * 1.4 + rx * 0.8, g.visY + 0.03, g.car.z - fz * 1.4 + rz * 0.8, g.car.heading, g.visRoll);
      }
    }
    // F1 floor sparks at very high speed
    if (g.car.speed > MAX_SPEED * 0.8 && sparkApi.current && Math.random() > 0.75) {
      sparkApi.current.emit(g.car.x - fx * 1.8, g.visY + 0.08, g.car.z - fz * 1.8, g.car.vx, g.car.vz, 2);
    }
    if (!onRoad && g.car.speed > 5 && dirtApi.current) {
      dirtApi.current.emit(g.car.x - fx * 0.5, g.car.z - fz * 0.5);
    }
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Ribbon geometry builder — closed loop strip between two lateral
   offsets, each with its own height function.
   ═══════════════════════════════════════════════════════════════ */
function buildRibbon(track, dIn, dOut, yIn, yOut) {
  const N = track.N;
  const pos = new Float32Array((N + 1) * 2 * 3);
  const nor = new Float32Array((N + 1) * 2 * 3);
  const uv = new Float32Array((N + 1) * 2 * 2);
  const T = new THREE.Vector3(), A = new THREE.Vector3(), Nv = new THREE.Vector3();
  for (let k = 0; k <= N; k++) {
    const p = track.get(k % N);
    const ya = yIn(p), yb = yOut(p);
    const o = k * 6;
    pos[o] = p.x + p.ox * dIn;  pos[o + 1] = ya; pos[o + 2] = p.z + p.oz * dIn;
    pos[o + 3] = p.x + p.ox * dOut; pos[o + 4] = yb; pos[o + 5] = p.z + p.oz * dOut;
    T.set(Math.sin(p.ang), 0, Math.cos(p.ang));
    A.set(p.ox * (dOut - dIn), yb - ya, p.oz * (dOut - dIn));
    if (A.lengthSq() < 1e-8) A.set(0, 1, 0);
    Nv.crossVectors(T, A).normalize();
    nor[o] = Nv.x; nor[o + 1] = Nv.y; nor[o + 2] = Nv.z;
    nor[o + 3] = Nv.x; nor[o + 4] = Nv.y; nor[o + 5] = Nv.z;
    const u = k * 4;
    uv[u] = 0; uv[u + 1] = k;
    uv[u + 2] = 1; uv[u + 3] = k;
  }
  const idx = [];
  for (let k = 0; k < N; k++) {
    const a = k * 2, b = k * 2 + 1, c = k * 2 + 2, d = k * 2 + 3;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/* ═══════════════════════════════════════════════════════════════
   Speedway — the whole static track: banked asphalt with painted
   lines + checkered start/finish, outer wall, embankment, apron,
   grandstands with crowd, light towers, gantry, pylon, trees.
   ═══════════════════════════════════════════════════════════════ */
function Speedway({ track }) {
  const { roadGeo, roadMat, wallGeo, bankGeo, apronGeo } = useMemo(() => {
    const inY = () => 0;
    const roadGeo = buildRibbon(track, -TRACK_HALF, TRACK_HALF, inY, (p) => surfaceY(p, TRACK_HALF));
    const wallGeo = buildRibbon(track, WALL_OFF, WALL_OFF,
      (p) => surfaceY(p, WALL_OFF), (p) => surfaceY(p, WALL_OFF) + 1.25);
    const bankGeo = buildRibbon(track, WALL_OFF, WALL_OFF + 18,
      (p) => surfaceY(p, WALL_OFF), () => 0);
    const apronGeo = buildRibbon(track, -(TRACK_HALF + 7), -TRACK_HALF, inY, inY);

    const roadMat = new THREE.ShaderMaterial({
      uniforms: {
        uStart: { value: track.startIndex },
        uN: { value: track.N },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uStart;
        uniform float uN;
        void main() {
          float u = vUv.x;
          float v = vUv.y;
          vec3 col = vec3(0.24, 0.24, 0.28);
          // racing groove — rubbered-in darker band
          float groove = smoothstep(0.40, 0.55, u) * (1.0 - smoothstep(0.78, 0.92, u));
          col *= 1.0 - groove * 0.22;
          // yellow line at the bottom (inside), white line at the wall
          float yl = smoothstep(0.018, 0.026, u) * (1.0 - smoothstep(0.046, 0.054, u));
          float wl = smoothstep(0.946, 0.954, u) * (1.0 - smoothstep(0.974, 0.982, u));
          col = mix(col, vec3(0.95, 0.78, 0.15), yl);
          col = mix(col, vec3(0.92), wl);
          // checkered start/finish strip
          float dv = abs(mod(v - uStart + uN * 0.5, uN) - uN * 0.5);
          if (dv < 0.9) {
            float c = mod(floor(u * 10.0) + floor(dv * 2.2), 2.0);
            col = mix(vec3(0.06), vec3(0.95), c);
          }
          // simple lambert
          float diff = clamp(dot(normalize(vNormal), normalize(vec3(-0.45, 0.85, -0.3))), 0.0, 1.0);
          col *= 0.78 + 0.3 * diff;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    return { roadGeo, roadMat, wallGeo, bankGeo, apronGeo };
  }, [track]);

  /* Static scenery placements */
  const scenery = useMemo(() => {
    const nS = Math.round(STRAIGHT / SEG);
    const nT = Math.round((Math.PI * RADIUS) / SEG);
    const towerIdx = [
      Math.floor(nS + nT * 0.25), Math.floor(nS + nT * 0.75),
      Math.floor(2 * nS + nT + nT * 0.25), Math.floor(2 * nS + nT + nT * 0.75),
    ];
    const towers = towerIdx.map((i) => {
      const p = track.get(i);
      return { x: p.x + p.ox * (WALL_OFF + 10), z: p.z + p.oz * (WALL_OFF + 10) };
    });
    const trees = Array.from({ length: 40 }, (_, i) => {
      const r = 25 + hash1(i * 3.1) * 70;
      const th = hash1(i * 7.7) * Math.PI * 2;
      return {
        x: -RADIUS + Math.cos(th) * r,
        z: STRAIGHT / 2 + Math.sin(th) * r * 1.6,
        s: 0.9 + hash1(i * 5.3) * 1.1,
      };
    });
    return { towers, trees };
  }, [track]);

  /* Crowd — colored instanced boxes on both grandstands */
  const crowdRef = useRef();
  const CROWD = 320;
  useEffect(() => {
    const mesh = crowdRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < CROWD; i++) {
      const backSide = hash1(i * 1.7) > 0.5;
      const row = Math.floor(hash1(i * 2.3) * 4);
      const z = 40 + hash1(i * 4.9) * 220;
      const x = backSide
        ? -(2 * RADIUS) - (WALL_OFF + 8) - row * 2.4
        : (WALL_OFF + 8) + row * 2.4;
      dummy.position.set(x, 1.6 + row * 1.5, z);
      dummy.scale.setScalar(0.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHSL(hash1(i * 9.1), 0.65, 0.55);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  const standRows = [0, 1, 2, 3];
  const backX = -(2 * RADIUS);

  return (
    <group>
      {/* Track surface + furniture */}
      <mesh geometry={roadGeo} material={roadMat} />
      <mesh geometry={wallGeo}>
        <meshStandardMaterial color="#e8e8ec" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bankGeo}>
        <meshStandardMaterial color="#3d8b40" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={apronGeo}>
        <meshStandardMaterial color="#2c2d33" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-RADIUS, -0.12, STRAIGHT / 2]}>
        <circleGeometry args={[900, 32]} />
        <meshStandardMaterial color="#4a9d4e" roughness={1} />
      </mesh>

      {/* Grandstands — front + back straight */}
      {[{ x0: WALL_OFF + 7, dir: 1 }, { x0: backX - (WALL_OFF + 7), dir: -1 }].map(({ x0, dir }, si) => (
        <group key={si}>
          {standRows.map((r) => (
            <mesh key={r} position={[x0 + dir * r * 2.4, 0.9 + r * 1.5, 150]} castShadow>
              <boxGeometry args={[2.4, 1.5 + r * 0.001, 236]} />
              <meshStandardMaterial color={r % 2 ? '#5b5e66' : '#4c4f57'} roughness={0.85} />
            </mesh>
          ))}
          {/* roof */}
          <mesh position={[x0 + dir * 4.2, 8.2, 150]}>
            <boxGeometry args={[13, 0.3, 240]} />
            <meshStandardMaterial color="#33343a" roughness={0.7} />
          </mesh>
          {[40, 260].map((z) => (
            <mesh key={z} position={[x0 + dir * 8, 4, z]}>
              <boxGeometry args={[0.4, 8.4, 0.4]} />
              <meshStandardMaterial color="#33343a" />
            </mesh>
          ))}
        </group>
      ))}
      <instancedMesh ref={crowdRef} args={[null, null, CROWD]}>
        <boxGeometry args={[0.5, 0.75, 0.5]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>

      {/* Light towers */}
      {scenery.towers.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, 9, 0]}>
            <cylinderGeometry args={[0.35, 0.5, 18, 8]} />
            <meshStandardMaterial color="#6b6e76" roughness={0.7} />
          </mesh>
          <mesh position={[0, 18.4, 0]}>
            <boxGeometry args={[4.4, 1.1, 0.5]} />
            <meshStandardMaterial color="#fffbe0" emissive="#fff8c9" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}

      {/* Start/finish gantry */}
      {[-(TRACK_HALF + 2), TRACK_HALF + 2].map((x) => (
        <mesh key={x} position={[x, 3.8, 150]}>
          <boxGeometry args={[0.5, 7.6, 0.5]} />
          <meshStandardMaterial color="#2b2c31" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 7.4, 150]}>
        <boxGeometry args={[(TRACK_HALF + 2) * 2 + 0.5, 1.1, 1.4]} />
        <meshStandardMaterial color="#2b2c31" roughness={0.6} />
      </mesh>
      {[-9, -3, 3, 9].map((x) => (
        <mesh key={x} position={[x, 6.6, 150]}>
          <boxGeometry args={[1.4, 0.5, 0.6]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={1.4} />
        </mesh>
      ))}

      {/* Scoring pylon */}
      <group position={[-52, 0, 150]}>
        <mesh position={[0, 13, 0]}>
          <boxGeometry args={[2.2, 26, 1.4]} />
          <meshStandardMaterial color="#26272c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 24.5, 0.72]}>
          <boxGeometry args={[1.8, 2.6, 0.1]} />
          <meshStandardMaterial color={PAPAYA} emissive={PAPAYA} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Infield trees */}
      {scenery.trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 1.4, 5]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[1.15, 2.8, 7]} />
            <meshStandardMaterial color="#2e7d32" />
          </mesh>
        </group>
      ))}

      {/* Clouds */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i}
          position={[
            -RADIUS + Math.cos(hash1(i * 11.3) * 6.28) * (280 + hash1(i * 3.7) * 220),
            55 + hash1(i * 5.1) * 30,
            STRAIGHT / 2 + Math.sin(hash1(i * 11.3) * 6.28) * (280 + hash1(i * 3.7) * 220),
          ]}
          scale={[10 + hash1(i * 2.9) * 9, 3.2 + hash1(i * 4.3) * 2, 10 + hash1(i * 6.1) * 9]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Particle systems — pooled instanced meshes
   ═══════════════════════════════════════════════════════════════ */

/* ── Tyre smoke ── */
const PUFF = 110;
function TyreSmoke({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: PUFF }, () => ({
    x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, s: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z, amt) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % PUFF;
      p.x = x + (Math.random() - 0.5) * 0.5;
      p.y = y + 0.15;
      p.z = z + (Math.random() - 0.5) * 0.5;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = 0.9 + Math.random() * 0.6;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.life = 0.9 + amt * 0.8;
      p.s = 0.35 + amt * 0.9;
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < PUFF; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.s += dt * 1.6;
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
      <meshStandardMaterial color="#e8e8ee" transparent opacity={0.32} roughness={1} depthWrite={false} />
    </instancedMesh>
  );
}

/* ── Skid marks ── */
const SKID = 320;
function SkidMarks({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => {
    const d = new THREE.Object3D();
    d.rotation.order = 'YZX';
    return d;
  }, []);
  const pool = useMemo(() => Array.from({ length: SKID }, () => ({
    x: 0, y: -999, z: 0, heading: 0, roll: 0, life: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z, heading, roll) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % SKID;
      p.x = x; p.y = y; p.z = z;
      p.heading = heading; p.roll = roll;
      p.life = 5;
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SKID; i++) {
      const p = pool[i];
      if (p.life > 0) p.life -= dt;
      const vis = p.life > 0 ? 1 : 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      dummy.rotation.set(0, p.heading, p.roll);
      dummy.scale.set(0.14 * vis, 1, 0.55 * vis);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SKID]}>
      <boxGeometry args={[1, 0.012, 1]} />
      <meshBasicMaterial color="#141416" transparent opacity={0.55} />
    </instancedMesh>
  );
}

/* ── Sparks — wall scrapes + F1 floor sparks ── */
const SPARK = 60;
function Sparks({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: SPARK }, () => ({
    x: 0, y: -999, z: 0, gy: 0, vx: 0, vy: 0, vz: 0, life: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z, cvx, cvz, n = 3) {
      for (let k = 0; k < n; k++) {
        const p = pool[cursor.current];
        cursor.current = (cursor.current + 1) % SPARK;
        p.x = x + (Math.random() - 0.5) * 0.6;
        p.y = y;
        p.gy = Math.max(0, y - 0.3);
        p.z = z + (Math.random() - 0.5) * 0.6;
        p.vx = cvx * 0.4 + (Math.random() - 0.5) * 9;
        p.vy = 1.5 + Math.random() * 4;
        p.vz = cvz * 0.4 + (Math.random() - 0.5) * 9;
        p.life = 0.25 + Math.random() * 0.35;
      }
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SPARK; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 14 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < p.gy + 0.04) { p.y = p.gy + 0.04; p.vy *= -0.4; p.vx *= 0.7; p.vz *= 0.7; }
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

/* ── Grass/dirt kick when off track ── */
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
      <meshStandardMaterial color="#5a7d3a" roughness={1} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Lighting rig that follows the car so shadows stay attached
   ═══════════════════════════════════════════════════════════════ */
function LightRig({ game }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const car = game.current.car;
    if (!light.current) return;
    light.current.position.set(car.x - 40, 65, car.z - 25);
    target.position.set(car.x, 0, car.z);
    target.updateMatrixWorld();
  });
  return (
    <>
      <directionalLight ref={light} castShadow intensity={1.6} target={target}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-50} shadow-camera-right={50}
        shadow-camera-top={50} shadow-camera-bottom={-50}
      />
      <primitive object={target} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ChaseCam — low F1 chase camera with speed FOV, banking follow,
   and shake
   ═══════════════════════════════════════════════════════════════ */
function ChaseCam({ game }) {
  // Camera position is computed rigidly from a *smoothed heading*, so the
  // car never rubber-bands away at speed — only the swing angle lags.
  const cs = useRef({ heading: null, y: 0 });
  useFrame(({ camera }, dt) => {
    const g = game.current;
    const car = g.car;
    const spd = car.speed / MAX_SPEED;
    const st = cs.current;
    if (st.heading === null) { st.heading = car.heading; st.y = g.visY; }

    const kh = 1 - Math.exp(-5.5 * Math.min(dt, 0.05));
    st.heading += wrapAngle(car.heading - st.heading) * kh;
    st.y += (g.visY - st.y) * kh;

    const back = 8.5 + spd * 3.5;
    const up = 3.2 + spd * 1.2;
    let tx = car.x - Math.sin(st.heading) * back;
    let tz = car.z - Math.cos(st.heading) * back;

    if (car.drifting && car.slip > 0.12) {
      const rx = -Math.cos(st.heading), rz = Math.sin(st.heading);
      const swing = Math.min(car.slip * 3, 3.5) * -car.slipSign;
      tx += rx * swing;
      tz += rz * swing;
    }

    camera.position.set(tx, st.y + up, tz);

    if (g.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * g.shake * 0.3;
      camera.position.y += (Math.random() - 0.5) * g.shake * 0.15;
    }

    const targetFov = 55 + spd * 18;
    camera.fov += (targetFov - camera.fov) * kh;
    camera.updateProjectionMatrix();

    camera.lookAt(car.x, g.visY + 0.9, car.z);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   HUD widgets
   ═══════════════════════════════════════════════════════════════ */
const GAUGE = { cx: 90, cy: 85, r: 65, start: 150, sweep: 240, max: 340 };

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

function Speedometer({ speed, gear }) {
  const pct = Math.min(1, speed / GAUGE.max);
  return (
    <svg viewBox="0 0 180 130" className="w-[140px] md:w-[170px]">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08D9D6" />
          <stop offset="70%" stopColor="#FF7C00" />
          <stop offset="100%" stopColor="#FF2E63" />
        </linearGradient>
      </defs>
      <path d={gaugeArc(GAUGE.start, GAUGE.sweep)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" strokeLinecap="round" />
      {pct > 0 && (
        <path d={gaugeArc(GAUGE.start, pct * GAUGE.sweep)} fill="none" stroke="url(#sg)" strokeWidth="5" strokeLinecap="round" />
      )}
      <text x={GAUGE.cx} y={GAUGE.cy - 10} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{speed}</text>
      <text x={GAUGE.cx} y={GAUGE.cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'JetBrains Mono', monospace" letterSpacing="3">KM/H</text>
      <text x={GAUGE.cx} y={GAUGE.cy + 34} textAnchor="middle" fill="#FF7C00" fontSize="22" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{gear}</text>
      <text x={GAUGE.cx + 20} y={GAUGE.cy + 34} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="'JetBrains Mono', monospace">GEAR</text>
    </svg>
  );
}

function Minimap({ track, carX, carZ }) {
  const { path, map, start } = useMemo(() => {
    const pts = track.pts.filter((_, i) => i % 5 === 0);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of track.pts) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    }
    const W = 148, H = 84, pad = 8;
    const map = (x, z) => [
      pad + ((z - minZ) / (maxZ - minZ)) * (W - pad * 2),
      pad + ((x - minX) / (maxX - minX)) * (H - pad * 2),
    ];
    const path = pts.map((p, i) => {
      const [sx, sy] = map(p.x, p.z);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' ') + ' Z';
    const sp = track.get(track.startIndex);
    return { path, map, start: map(sp.x, sp.z) };
  }, [track]);

  const [cx, cy] = map(carX, carZ);
  return (
    <svg viewBox="0 0 148 84" className="w-[120px] md:w-[148px]">
      <path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx={start[0]} cy={start[1]} r="2.6" fill="rgba(255,255,255,0.7)" />
      <circle cx={cx} cy={cy} r="3.4" fill="#FF7C00" />
    </svg>
  );
}

const fmtLap = (t) => {
  if (!t) return '--:--.--';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
};

/* ═══════════════════════════════════════════════════════════════
   Main page component
   ═══════════════════════════════════════════════════════════════ */
export default function Drift() {
  useSEO({ title: 'Race', description: 'A pocket F1 car flat-out on a banked superspeedway oval. Chase lap times, kiss the wall, light up the tyres.', path: '/drift' });

  const trackRef = useRef(null);
  if (!trackRef.current) trackRef.current = createTrack();
  const game = useRef(createGame(trackRef.current));
  const smokeApi = useRef(null);
  const skidApi = useRef(null);
  const sparkApi = useRef(null);
  const dirtApi = useRef(null);

  const [touch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches);
  const [hud, setHud] = useState({
    speed: 0, gear: 1, started: false,
    lapTime: 0, lastLap: 0, bestLap: game.current.bestLap, laps: 0,
    speedPct: 0, carX: game.current.car.x, carZ: game.current.car.z,
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
    const down = (e) => {
      if (e.code === 'KeyR') { resetToLine(game.current); return; }
      if (map[e.code]) { e.preventDefault(); set(e.code, true); }
    };
    const up = (e) => set(e.code, false);
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
        speed: Math.round(g.car.speed * 3.6),
        gear: gearFor(g.car.speed),
        started: g.started,
        lapTime: g.lapTime,
        lastLap: g.lastLap,
        bestLap: g.bestLap,
        laps: g.laps,
        speedPct: g.car.speed / MAX_SPEED,
        carX: g.car.x, carZ: g.car.z,
      });
      const dp = g.popup;
      if (dp && dp.id > popupRef.current) {
        popupRef.current = dp.id;
        setPopup(dp);
        setTimeout(() => setPopup((p) => p && p.id === dp.id ? null : p), 2200);
      }
    }, 70);
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
      <Canvas shadows camera={{ position: [0, 5, 90], fov: 55 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#7ec4ef']} />
        <fog attach="fog" args={['#8fccf2', 140, 560]} />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#bfe3ff', '#3f7a42', 0.5]} />
        <LightRig game={game} />
        <Speedway track={trackRef.current} />
        <SkidMarks api={skidApi} />
        <F1CarModel game={game} />
        <TyreSmoke api={smokeApi} />
        <Sparks api={sparkApi} />
        <DirtKick api={dirtApi} />
        <GameLoop game={game} isMobile={touch}
          smokeApi={smokeApi} skidApi={skidApi}
          sparkApi={sparkApi} dirtApi={dirtApi}
        />
        <ChaseCam game={game} />
      </Canvas>

      {/* ── HUD overlay ── */}
      <div className="absolute inset-0 pointer-events-none p-[clamp(16px,4vw,32px)] flex flex-col justify-between z-10">

        {/* Top bar */}
        <div className="flex justify-between items-start w-full gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Link to="/" className="pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">← SITE</Link>
              <Link to="/playground" className="pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">PLAYGROUND</Link>
            </div>
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-2 py-1 shadow-lg self-start">
              <Minimap track={trackRef.current} carX={hud.carX} carZ={hud.carZ} />
            </div>
          </div>

          {/* Lap panel */}
          <div className="font-mono text-white bg-black/30 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 shadow-lg text-right">
            <div className="text-[10px] tracking-[.2em] text-white/50 mb-1">LAP {hud.laps + 1}</div>
            <div className="text-[24px] font-bold leading-none tabular-nums">{fmtLap(hud.lapTime)}</div>
            <div className="text-[10px] tracking-[.1em] text-white/60 mt-2 tabular-nums">
              LAST {fmtLap(hud.lastLap)}
            </div>
            <div className="text-[10px] tracking-[.1em] tabular-nums" style={{ color: '#FF7C00' }}>
              BEST {fmtLap(hud.bestLap)}
            </div>
          </div>
        </div>

        {/* Start screen */}
        {!hud.started && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-black/45 backdrop-blur-xl border border-white/15 rounded-2xl px-9 py-8 shadow-2xl max-w-[460px] mx-4">
              <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-4">Playground / Race</div>
              <div className="text-white font-bold text-[26px] leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
                One car. One banked oval.<br />Flat out.
              </div>
              <div className="font-mono text-[11px] tracking-[.1em] text-white/70 leading-[2]">
                {touch ? 'TAP ◀ ▶ TO STEER · AUTO THROTTLE' : 'W — GAS · A/D — STEER · S — BRAKE'}<br />
                {touch ? 'BRAKE FOR THE TURNS · SET A LAP TIME' : 'SPACE — SLIDE · R — RESET · SET A LAP TIME'}
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
              <button className={`${touchBtn} w-[92px] text-[14px]`} style={{ background: 'rgba(255,124,0,0.75)', color: 'black' }} onPointerDown={press('handbrake', true)} onPointerUp={press('handbrake', false)} onPointerLeave={press('handbrake', false)} onContextMenu={(e) => e.preventDefault()}>SLIDE</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end">
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg">
              <Speedometer speed={hud.speed} gear={hud.gear} />
            </div>
            <div className="font-mono text-[9px] md:text-[10px] tracking-[.1em] text-white/50 leading-[1.9] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              W GAS · A/D STEER · S BRAKE · SPACE SLIDE · R RESET
            </div>
          </div>
        )}
      </div>

      {/* ── Lap popup ── */}
      {popup && (
        <div key={popup.id} className="absolute left-1/2 top-[32%] -translate-x-1/2 pointer-events-none z-20"
          style={{ animation: 'lapPop 2.2s ease-out forwards' }}>
          <div className={`font-bold text-3xl md:text-4xl font-mono tracking-wider text-center drop-shadow-lg ${popup.best ? 'text-[#FF7C00]' : 'text-white'}`}>
            {popup.best ? '★ BEST LAP' : 'LAP'} {fmtLap(popup.t)}
          </div>
        </div>
      )}

      {/* ── Speed vignette ── */}
      {hud.speedPct > 0.45 && (
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: `radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,${(hud.speedPct - 0.45) * 0.55}) 100%)` }} />
      )}

      <style>{`
        @keyframes lapPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.7); }
          12%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.12); }
          28%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(0.92); }
        }
      `}</style>
    </div>
  );
}
