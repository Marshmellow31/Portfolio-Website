/* ────────────────────────────────────────────────────────────────
   WORLD — everything static: sky, terrain, the road ribbon, curbs,
   runoff, barriers, catch fencing and per-theme scenery.

   All of it is generated from the circuit description, so a new
   layout brings its own grandstands, trees, city blocks and lighting
   without any hand placement.
   ──────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CURB, RUNOFF, hash1, surfaceY } from '../../lib/circuits';
import { buildTree } from '../../lib/car-geometry';
import { detectQuality } from '../../lib/quality';
import {
  buildRibbon, buildWall, makeRoadMaterial, makeBarrierMaterial,
  makeRunoffMaterial, makeSkyMaterial, makeNoiseTexture,
} from '../../lib/track-materials';

/* ── Sky dome ──────────────────────────────────────────────────────
   Locked to the camera and drawn with depth testing off, so no matter
   how far the car travels the dome is always around the viewer and can
   never be sliced by the far plane. */
function Sky({ theme, detail }) {
  const ref = useRef();
  const mat = useMemo(() => makeSkyMaterial(theme, detail), [theme, detail]);
  useEffect(() => () => mat.dispose(), [mat]);
  /* Unit sphere scaled to sit comfortably inside the camera's far plane —
     hard-coding a radius meant a shorter draw distance clipped the whole
     dome away and the background went black. */
  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
    ref.current.scale.setScalar(camera.far * 0.45);
  }, -4);
  return (
    <mesh ref={ref} material={mat} frustumCulled={false} renderOrder={1000}>
      <sphereGeometry args={[1, 20, 12]} />
    </mesh>
  );
}

/* ── Sun + fill ───────────────────────────────────────────────── */
export function LightRig({ theme, focus }) {
  const sun = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  const dir = useMemo(() => new THREE.Vector3(...theme.sunPos).normalize(), [theme]);

  useFrame(() => {
    const f = focus();
    if (!sun.current || !f) return;
    sun.current.position.set(f.x + dir.x * 90, f.y + dir.y * 90, f.z + dir.z * 90);
    target.position.set(f.x, f.y, f.z);
    target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight color={theme.amb} intensity={theme.ambI} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, theme.hemiI]} />
      <directionalLight
        ref={sun} color={theme.sun} intensity={theme.sunI} target={target}
      />
      <primitive object={target} />
      {/* cool bounce from the opposite side so shadowed bodywork isn't dead */}
      <directionalLight
        color={theme.night ? '#4a6cff' : '#bcd6ff'}
        intensity={theme.night ? 0.5 : 0.6}
        position={[-dir.x * 60, 40, -dir.z * 60]}
      />
    </>
  );
}

/* ── Instanced helper ──────────────────────────────────────────── */
function Instances({ geometry, material, items, castShadow = false, receiveShadow = false }) {
  const ref = useRef();
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      d.position.set(it.p[0], it.p[1], it.p[2]);
      d.rotation.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0);
      if (Array.isArray(it.s)) d.scale.set(it.s[0], it.s[1], it.s[2]);
      else d.scale.setScalar(it.s ?? 1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      if (it.c && m.instanceColor !== undefined) m.setColorAt(i, c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
  );
}

/* Window-lit building texture for the night circuit. */
function buildingTexture() {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0d1018';
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 3; y < 124; y += 7) {
    for (let x = 4; x < 60; x += 8) {
      const r = Math.random();
      if (r < 0.42) continue;
      ctx.fillStyle = r > 0.9 ? '#ffe9a8' : r > 0.7 ? '#cfe4ff' : '#8fb4e8';
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.fillRect(x, y, 5, 4);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ═══════════════════════════════════════════════════════════════
   Speedway / circuit world
   ═══════════════════════════════════════════════════════════════ */
const NO_SCENERY = {};

export default function World({ circuit, theme }) {
  const { def, pts, N, lapLength, bounds } = circuit;
  const sc = def.scenery || NO_SCENERY;
  const q = detectQuality();

  /* ── Road, curbs, runoff, barriers ── */
  const geo = useMemo(() => {
    const inner = (p) => -p.half, outer = (p) => p.half;
    const road = buildRibbon(circuit, [
      { lat: (p) => -p.half - CURB, dy: (p) => 0.02 + 0.07 * p.curb, edge: () => 1.35 },
      { lat: inner, edge: () => 1.0 },
      { lat: (p) => -p.half * 0.5, edge: () => 0.5 },
      { lat: 0, edge: () => 0 },
      { lat: (p) => p.half * 0.5, edge: () => 0.5 },
      { lat: outer, edge: () => 1.0 },
      { lat: (p) => p.half + CURB, dy: (p) => 0.02 + 0.07 * p.curb, edge: () => 1.35 },
    ]);

    const runoffL = buildRibbon(circuit, [
      { lat: (p) => -p.half - CURB, dy: -0.04, edge: () => 0 },
      { lat: (p) => -p.half - CURB - RUNOFF * 0.45, dy: -0.3, edge: () => 0.5 },
      { lat: (p) => -p.half - CURB - RUNOFF, dy: -0.5, edge: () => 1 },
    ]);
    const runoffR = buildRibbon(circuit, [
      { lat: (p) => p.half + CURB, dy: -0.04, edge: () => 0 },
      { lat: (p) => p.half + CURB + RUNOFF * 0.45, dy: -0.3, edge: () => 0.5 },
      { lat: (p) => p.half + CURB + RUNOFF, dy: -0.5, edge: () => 1 },
    ]);

    const wallL = buildWall(circuit, (p) => -p.half - CURB - RUNOFF, 1.25, { rows: 3 });
    const wallR = buildWall(circuit, (p) => p.half + CURB + RUNOFF, 1.25, { rows: 3 });

    /* Terrain skirt. Without this the road is a ribbon hanging in space over
       a flat ground plane — anywhere the circuit climbs you can see straight
       under it. The skirt follows the track height at the barrier and ramps
       down to the flat terrain plane, so embankments read as hillside. */
    const gy = bounds.groundY;
    const skirt = (dir) => buildRibbon(circuit, [
      { lat: (p) => dir * (p.half + CURB + RUNOFF), dy: -0.45, edge: () => 0 },
      { lat: (p) => dir * (p.half + CURB + RUNOFF + 12), dy: -1.6, edge: () => 0.2 },
      { lat: (p) => dir * (p.half + CURB + RUNOFF + 44), dy: -5.5, edge: () => 0.6 },
      { lat: (p) => dir * (p.half + CURB + RUNOFF + 130), flat: true, edge: () => 1 },
    ], { flatY: gy });

    return { road, runoffL, runoffR, wallL, wallR, skirtL: skirt(-1), skirtR: skirt(1) };
  }, [circuit, bounds]);

  const roadMat = useMemo(() => makeRoadMaterial(circuit, theme, {
    lamps: !!sc.lamps,
    lampStep: 46,
    lampLat: circuit.pts[0].half + CURB + RUNOFF + 1.6,
    detail: q.detail,
  }), [circuit, theme, sc.lamps, q.detail]);
  const barrierMat = useMemo(() => makeBarrierMaterial(theme), [theme]);
  const runoffMat = useMemo(() => makeRunoffMaterial(theme, q.detail), [theme, q.detail]);
  const groundTex = useMemo(
    () => makeNoiseTexture(q.detail > 0 ? 256 : 128, {
      base: theme.ground, alt: theme.ground2, cells: 48,
      repeat: q.detail > 0 ? 90 : 40,
      anisotropy: q.detail > 0 ? 8 : 1,
    }),
    [theme, q.detail],
  );

  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose());
    roadMat.dispose(); barrierMat.dispose(); runoffMat.dispose(); groundTex.dispose();
  }, [geo, roadMat, barrierMat, runoffMat, groundTex]);

  /* ── Scenery placement ── */
  const scene = useMemo(() => {
    /* Height of the terrain at a lateral offset — road, then runoff, then
       the skirt profile. Scenery uses this so nothing floats above the
       embankment or sinks into it. Must mirror the skirt columns above. */
    const groundAt = (f, lat) => {
      const a = Math.abs(lat);
      const base = surfaceY(f, Math.max(-f.half, Math.min(f.half, lat)));
      const edge = f.half + CURB;
      if (a <= edge) return base;
      const barrier = f.half + CURB + RUNOFF;
      if (a <= barrier) return base - 0.04 - ((a - edge) / RUNOFF) * 0.46;
      const o = a - barrier;
      const keys = [[0, -0.45], [12, -1.6], [44, -5.5], [130, bounds.groundY - base]];
      for (let i = 1; i < keys.length; i++) {
        if (o <= keys[i][0]) {
          const t = (o - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
          return base + keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * t;
        }
      }
      return bounds.groundY;
    };
    const outsideAt = (s, lat, dy = 0) => {
      const f = circuit.frameAt(s);
      return [f.x + f.nx * lat, groundAt(f, lat) + dy, f.z + f.nz * lat];
    };
    const angAt = (s) => circuit.frameAt(s).ang;

    /* Grandstands: hunt for the two longest low-curvature stretches. */
    const stands = [];
    if (sc.stands) {
      const straightRuns = [];
      let run = null;
      // "straight enough" for a grandstand — a 400 m-radius sweeper still
      // reads as a straight from the stands, so the threshold is generous
      for (let i = 0; i < N; i++) {
        if (Math.abs(pts[i].curv) < 0.005) {
          if (!run) run = { a: i, b: i };
          else run.b = i;
        } else if (run) { straightRuns.push(run); run = null; }
      }
      if (run) straightRuns.push(run);
      straightRuns.sort((a, b) => (b.b - b.a) - (a.b - a.a));
      for (const r of straightRuns.slice(0, 2)) {
        const from = r.a * circuit.step + 10, to = r.b * circuit.step - 10;
        if (to - from < 60) continue;
        for (let s = from; s < to; s += (q.scenery < 0.7 ? 16 : 9)) {
          for (let row = 0; row < (q.scenery < 0.7 ? 2 : 4); row++) {
            for (const side of [1, -1]) {
              if (side < 0 && !sc.bothSides && !def.id.includes('speedway')) continue;
              const lat = side * (pts[0].half + CURB + RUNOFF + 4 + row * 2.6);
              const [x, y, z] = outsideAt(s, lat, 1.0 + row * 1.55);
              stands.push({ p: [x, y, z], r: [0, angAt(s), 0], s: [2.6, 1.5, 9.2], c: row % 2 ? '#5b5e66' : '#4a4d55' });
            }
          }
        }
      }
    }

    /* Crowd on the stands. */
    const crowd = [];
    for (let i = 0; i < stands.length; i += 1) {
      const st = stands[i];
      for (let k = 0; k < (q.scenery < 0.7 ? 1 : 3); k++) {
        if (hash1(i * 3.1 + k) < 0.35) continue;
        crowd.push({
          p: [st.p[0], st.p[1] + 1.1, st.p[2] + (k - 1) * 2.6],
          r: st.r, s: [0.5, 0.8, 0.5],
          c: new THREE.Color().setHSL(hash1(i * 9.1 + k * 2.3), 0.6, 0.55).getStyle(),
        });
      }
    }

    /* Trees ringing the circuit, thinned near the road. */
    const trees = [];
    const treeCount = Math.round((sc.trees || 0) * q.scenery);
    for (let i = 0; i < treeCount; i++) {
      const s = hash1(i * 2.7) * lapLength;
      const outward = hash1(i * 5.9) > 0.45 ? 1 : -1;
      const lat = outward * (pts[0].half + CURB + RUNOFF + 8 + hash1(i * 7.3) * 60);
      const [x, y, z] = outsideAt(s, lat, -0.4);
      trees.push({ p: [x, y, z], r: [0, hash1(i * 1.3) * 6.28, 0], s: 0.85 + hash1(i * 4.1) * 1.3 });
    }

    /* Marshal posts + brake boards at every apex. */
    const markers = [];
    circuit.apexes.forEach((ap, i) => {
      const s = ap.i * circuit.step;
      for (const d of [60, 40, 20]) {
        const lat = -ap.side * (pts[0].half + CURB + 2.5);
        const [x, y, z] = outsideAt((s - d + lapLength) % lapLength, lat, 0.9);
        markers.push({ p: [x, y, z], r: [0, angAt(s) + Math.PI / 2, 0], s: [0.1, 1.1, 1.5], c: d === 20 ? '#d43b2f' : '#e8e8ec' });
      }
      if (i % 2 === 0) {
        const [x, y, z] = outsideAt(s, ap.side * (pts[0].half + CURB + RUNOFF + 2), 1.4);
        markers.push({ p: [x, y, z], r: [0, angAt(s), 0], s: [1.2, 2.6, 1.2], c: '#f5a623' });
      }
    });

    /* Light towers (oval) or street lamps (night circuits). */
    const towers = [];
    if (sc.towers) {
      for (let k = 0; k < 6; k++) {
        const s = (k / 6) * lapLength;
        const [x, y, z] = outsideAt(s, pts[0].half + CURB + RUNOFF + 14, 0);
        towers.push({ p: [x, y, z] });
      }
    }
    const lampPoles = [], lampArms = [], lampBulbs = [];
    if (sc.lamps) {
      for (let s = 0; s < lapLength; s += 46) {
        for (const side of [1, -1]) {
          const [x, y, z] = outsideAt(s, side * (pts[0].half + CURB + RUNOFF + 1.6), 0);
          const yaw = angAt(s);
          const offset = (distance, height) => {
            const localX = -side * distance;
            return [x + Math.cos(yaw) * localX, y + height, z - Math.sin(yaw) * localX];
          };
          lampPoles.push({ p: [x, y + 3.4, z], r: [0, yaw, 0], s: [0.26, 6.8, 0.26] });
          lampArms.push({ p: offset(1.1, 6.7), r: [0, yaw, 0], s: [2.4, 0.16, 0.3] });
          lampBulbs.push({ p: offset(2.1, 6.5), r: [0, yaw, 0], s: [0.7, 0.16, 0.4] });
        }
      }
    }

    /* City blocks for the street circuit. */
    const city = [];
    if (sc.city) {
      const nCity = Math.round(70 * q.scenery);
      for (let i = 0; i < nCity; i++) {
        const s = hash1(i * 3.3) * lapLength;
        const side = hash1(i * 8.1) > 0.5 ? 1 : -1;
        const lat = side * (pts[0].half + CURB + RUNOFF + 22 + hash1(i * 6.7) * 130);
        const [x, y, z] = outsideAt(s, lat, 0);
        const h = 16 + hash1(i * 4.9) * 62;
        city.push({
          p: [x, y + h / 2, z], r: [0, angAt(s), 0],
          s: [10 + hash1(i * 2.1) * 16, h, 10 + hash1(i * 9.4) * 16],
        });
      }
    }

    /* Shipping containers for the drift complex. */
    const containers = [];
    if (sc.containers) {
      const palette = ['#c0392b', '#2980b9', '#d4a017', '#27ae60', '#7f8c8d'];
      const nBox = Math.round(46 * q.scenery);
      for (let i = 0; i < nBox; i++) {
        const s = hash1(i * 4.7) * lapLength;
        const side = hash1(i * 2.9) > 0.5 ? 1 : -1;
        const lat = side * (pts[0].half + CURB + RUNOFF + 6 + hash1(i * 8.8) * 34);
        const stack = hash1(i * 5.5) > 0.7 ? 2 : 1;
        for (let k = 0; k < stack; k++) {
          const [x, y, z] = outsideAt(s, lat, 1.3 + k * 2.6);
          containers.push({
            p: [x, y, z], r: [0, angAt(s) + (hash1(i * 1.9) - 0.5) * 0.6, 0],
            s: [2.6, 2.6, 6.2], c: palette[Math.floor(hash1(i * 7.1 + k) * palette.length)],
          });
        }
      }
    }

    /* Start/finish gantry straddling the line. */
    const line = circuit.frameAt(circuit.startIndex * circuit.step);
    const gantry = {
      pos: [line.x, surfaceY(line, 0), line.z],
      rot: line.ang,
      half: line.half + CURB + 1,
    };

    return { stands, crowd, trees, markers, towers, lampPoles, lampArms, lampBulbs, city, containers, gantry };
  }, [circuit, def, sc, pts, N, lapLength, bounds, q.scenery]);

  const treeGeo = useMemo(() => (sc.trees ? buildTree() : null), [sc.trees]);
  const cityTex = useMemo(() => (sc.city ? buildingTexture() : null), [sc.city]);
  useEffect(() => () => { treeGeo?.dispose(); cityTex?.dispose(); }, [treeGeo, cityTex]);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const standMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9 }), []);
  const crowdMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), []);
  const markerMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7 }), []);
  const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }), []);
  const containerMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.2 }), []);
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b3f47', roughness: 0.6, metalness: 0.45 }), []);
  const lampBulbMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fff0c0', emissive: '#ffdf9a', emissiveIntensity: theme.night ? 5 : 0.8,
  }), [theme.night]);
  useEffect(() => () => lampMat.dispose(), [lampMat]);
  useEffect(() => () => lampBulbMat.dispose(), [lampBulbMat]);
  const cityMat = useMemo(() => (cityTex ? new THREE.MeshStandardMaterial({
    color: '#2a3140', roughness: 0.85,
    map: cityTex, emissiveMap: cityTex,
    emissive: new THREE.Color(theme.night ? '#ffffff' : '#000000'),
    emissiveIntensity: theme.night ? 1.2 : 0,
  }) : null), [cityTex, theme]);

  return (
    <group>
      <Sky theme={theme} detail={q.detail} />

      {/* terrain — sits below the lowest point of the circuit; the skirt
          ribbons bridge from the barriers down onto it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.cx, bounds.groundY, bounds.cz]}>
        <circleGeometry args={[1500, 40]} />
        <meshStandardMaterial map={groundTex} color="#ffffff" roughness={1} />
      </mesh>

      {/* road + surroundings */}
      <mesh geometry={geo.skirtL} material={runoffMat} />
      <mesh geometry={geo.skirtR} material={runoffMat} />
      <mesh geometry={geo.runoffL} material={runoffMat} />
      <mesh geometry={geo.runoffR} material={runoffMat} />
      <mesh geometry={geo.road} material={roadMat} />
      <mesh geometry={geo.wallL} material={barrierMat} />
      <mesh geometry={geo.wallR} material={barrierMat} />

      {/* start/finish gantry */}
      <group position={scene.gantry.pos} rotation={[0, scene.gantry.rot, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * scene.gantry.half, 4.2, 0]}>
            <boxGeometry args={[0.6, 8.4, 0.6]} />
            <meshStandardMaterial color="#2b2c31" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 8.2, 0]}>
          <boxGeometry args={[scene.gantry.half * 2 + 0.6, 1.4, 1.6]} />
          <meshStandardMaterial color="#2b2c31" roughness={0.6} metalness={0.3} />
        </mesh>
        {[-9, -3, 3, 9].map((x) => (
          <mesh key={x} position={[x, 7.3, 0.85]}>
            <boxGeometry args={[1.5, 0.55, 0.12]} />
            <meshStandardMaterial color="#3a0d0d" emissive="#ff2020" emissiveIntensity={0.15} />
          </mesh>
        ))}
      </group>

      <Instances geometry={boxGeo} material={standMat} items={scene.stands} />
      <Instances geometry={boxGeo} material={crowdMat} items={scene.crowd} />
      <Instances geometry={boxGeo} material={markerMat} items={scene.markers} />
      {treeGeo && <Instances geometry={treeGeo} material={treeMat} items={scene.trees} />}
      {cityMat && <Instances geometry={boxGeo} material={cityMat} items={scene.city} />}
      <Instances geometry={boxGeo} material={containerMat} items={scene.containers} />
      <Instances geometry={boxGeo} material={lampMat} items={scene.lampPoles} />
      <Instances geometry={boxGeo} material={lampMat} items={scene.lampArms} />
      <Instances geometry={boxGeo} material={lampBulbMat} items={scene.lampBulbs} />

      {/* light towers */}
      {scene.towers.map((t, i) => (
        <group key={i} position={t.p}>
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.3, 0.55, 20, 8]} />
            <meshStandardMaterial color="#6b6e76" roughness={0.7} metalness={0.4} />
          </mesh>
          <mesh position={[0, 20.6, 0]}>
            <boxGeometry args={[5, 1.3, 0.5]} />
            <meshStandardMaterial color="#fffbe0" emissive="#fff8c9"
              emissiveIntensity={theme.night ? 4 : 1.4} />
          </mesh>
        </group>
      ))}

    </group>
  );
}
