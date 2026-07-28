/* ────────────────────────────────────────────────────────────────
   Pooled particle systems — tyre smoke, skid marks, sparks, dirt.
   Each exposes an imperative `emit` through a ref so the physics
   loop can fire them without causing React renders.
   ──────────────────────────────────────────────────────────────── */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Tyre smoke ── */
const PUFF = 90;
export function TyreSmoke({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mat = useRef();
  const pool = useMemo(() => Array.from({ length: PUFF }, () => ({
    x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, s: 0, rot: 0, spin: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z, amt) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % PUFF;
      p.x = x + (Math.random() - 0.5) * 0.6;
      p.y = y + 0.15;
      p.z = z + (Math.random() - 0.5) * 0.6;
      p.vx = (Math.random() - 0.5) * 1.8;
      p.vy = 0.8 + Math.random() * 0.8;
      p.vz = (Math.random() - 0.5) * 1.8;
      p.max = p.life = 1.1 + amt * 1.0;
      p.s = 0.4 + amt * 0.9;
      p.rot = Math.random() * 6.28;
      p.spin = (Math.random() - 0.5) * 1.4;
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    let alive = 0;
    for (let i = 0; i < PUFF; i++) {
      const p = pool[i];
      if (p.life > 0) {
        alive++;
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.s += dt * 2.2;
        p.rot += p.spin * dt;
        p.vy *= (1 - dt * 0.55);
        p.vx *= (1 - dt * 0.5); p.vz *= (1 - dt * 0.5);
      }
      const vis = p.life > 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.setScalar(vis ? p.s : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    // fade the whole system out when only a few stale puffs remain
    if (mat.current) mat.current.opacity = 0.3 * Math.min(1, 0.35 + alive / 40);
  });

  return (
    <instancedMesh ref={ref} args={[null, null, PUFF]} frustumCulled={false}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial ref={mat} color="#e6e7ee" transparent opacity={0.3}
        roughness={1} depthWrite={false} />
    </instancedMesh>
  );
}

/* ── Skid marks ── */
const SKID = 300;
export function SkidMarks({ api }) {
  const ref = useRef();
  const dummy = useMemo(() => {
    const d = new THREE.Object3D();
    d.rotation.order = 'YZX';
    return d;
  }, []);
  const pool = useMemo(() => Array.from({ length: SKID }, () => ({
    x: 0, y: -999, z: 0, heading: 0, roll: 0, life: 0, w: 0.15,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z, heading, roll, heat = 1) {
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % SKID;
      p.x = x; p.y = y; p.z = z;
      p.heading = heading; p.roll = roll;
      p.w = 0.12 + heat * 0.1;
      p.life = 9;
    },
    clear() { pool.forEach((p) => { p.life = 0; }); },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SKID; i++) {
      const p = pool[i];
      if (p.life > 0) p.life -= dt;
      const vis = p.life > 0 ? 1 : 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      dummy.rotation.set(0, p.heading, p.roll);
      dummy.scale.set(p.w * vis, 1, 0.62 * vis);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SKID]} frustumCulled={false}>
      <boxGeometry args={[1, 0.012, 1]} />
      <meshBasicMaterial color="#0e0e10" transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ── Sparks ── */
const SPARK = 60;
export function Sparks({ api }) {
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
        p.gy = y - 0.3;
        p.z = z + (Math.random() - 0.5) * 0.6;
        p.vx = cvx * 0.35 + (Math.random() - 0.5) * 11;
        p.vy = 1.6 + Math.random() * 4.5;
        p.vz = cvz * 0.35 + (Math.random() - 0.5) * 11;
        p.life = 0.25 + Math.random() * 0.4;
      }
    },
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    for (let i = 0; i < SPARK; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 15 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < p.gy + 0.04) { p.y = p.gy + 0.04; p.vy *= -0.4; p.vx *= 0.7; p.vz *= 0.7; }
      }
      const vis = p.life > 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      // streak along the direction of travel
      dummy.scale.set(vis ? 0.05 : 0, vis ? 0.05 : 0, vis ? 0.05 + Math.min(0.35, p.life * 0.6) : 0);
      dummy.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SPARK]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffc266" toneMapped={false} />
    </instancedMesh>
  );
}

/* ── Dirt / gravel kick ── */
const DIRT = 48;
export function DirtKick({ api, color = '#5a7d3a' }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(() => Array.from({ length: DIRT }, () => ({
    x: 0, y: -999, z: 0, gy: 0, vx: 0, vy: 0, vz: 0, life: 0, s: 0,
  })), []);
  const cursor = useRef(0);

  api.current = {
    emit(x, y, z) {
      for (let k = 0; k < 2; k++) {
        const p = pool[cursor.current];
        cursor.current = (cursor.current + 1) % DIRT;
        p.x = x + (Math.random() - 0.5) * 1.6;
        p.y = y + 0.2; p.gy = y;
        p.z = z + (Math.random() - 0.5) * 1.6;
        p.vx = (Math.random() - 0.5) * 4;
        p.vy = 2.4 + Math.random() * 3.5;
        p.vz = (Math.random() - 0.5) * 4;
        p.life = 0.45 + Math.random() * 0.35;
        p.s = 0.1 + Math.random() * 0.18;
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
        if (p.y < p.gy) { p.y = p.gy; p.vy *= -0.3; }
      }
      const vis = p.life > 0;
      dummy.position.set(p.x, vis ? p.y : -999, p.z);
      dummy.scale.setScalar(vis ? p.s : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, DIRT]} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={1} />
    </instancedMesh>
  );
}
