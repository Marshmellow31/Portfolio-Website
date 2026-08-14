/* ────────────────────────────────────────────────────────────────
   CAR MODELS

   The player's car is built from extruded, bevelled profiles with
   proper materials — clear-coated paint, matte carbon, tinted glass,
   glowing brake discs and light cones. Rival cars use the same
   silhouettes merged down to a single vertex-coloured geometry (one
   draw call per car) with their wheels drawn as one instanced mesh,
   so a full grid stays cheap.
   ──────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  extrudeProfile, buildRivalBody, buildRivalWheel, buildWheel,
  F1_PROFILE, COUPE_PROFILE, SIDEPOD_PROFILE, COUPE_GLASS_PROFILE,
  F1_WHEELS, COUPE_WHEELS, CARBON,
} from '../../lib/car-geometry';

export { F1_WHEELS, COUPE_WHEELS };

/* ═══════════════════════════════════════════════════════════════
   Wheel — tyre with a shoulder, spoked rim, brake disc + caliper
   ═══════════════════════════════════════════════════════════════ */
function Wheel({ r = 0.34, w = 0.34, rim = '#b9bcc4', spin, discRef }) {
  const geo = useMemo(() => buildWheel(r, w, rim), [r, w, rim]);
  return (
    <group ref={spin}>
      {/* tyre + rim + spokes + caliper, merged into one draw call */}
      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors metalness={0.45} roughness={0.55} />
      </mesh>
      {/* brake disc — separate only because it glows under braking */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.52, r * 0.52, w * 0.3, 12]} />
        <meshStandardMaterial ref={discRef} color="#2a2b30" metalness={0.6}
          roughness={0.5} emissive="#ff4a12" emissiveIntensity={0} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Player F1 — open-wheeler
   ═══════════════════════════════════════════════════════════════ */
export function PlayerF1({ carRef, accent = '#FF7C00' }) {
  const group = useRef();
  const body = useRef();
  const hub = [useRef(), useRef(), useRef(), useRef()];
  const steer = [useRef(), useRef()];
  const spin = [useRef(), useRef(), useRef(), useRef()];
  const discs = [useRef(), useRef(), useRef(), useRef()];
  const rain = useRef();
  const flame = useRef();
  const drs = useRef();

  const tubGeo = useMemo(() => extrudeProfile(F1_PROFILE, 0.82, 0.07), []);
  const podGeo = useMemo(() => extrudeProfile(SIDEPOD_PROFILE, 0.5, 0.06), []);

  useEffect(() => { if (group.current) group.current.rotation.order = 'YZX'; }, []);

  useFrame(({ clock }) => {
    const c = carRef();
    if (!group.current || !c) return;
    group.current.position.set(c.x, c.visY, c.z);
    group.current.rotation.set(c.visPitch || 0, c.heading, c.visRoll || 0);

    if (body.current) {
      const lean = THREE.MathUtils.clamp(-c.lateralG * 0.32, -0.13, 0.13);
      body.current.rotation.z += (lean - body.current.rotation.z) * 0.15;
      body.current.rotation.x += (c.longG * 0.02 - body.current.rotation.x) * 0.12;
    }
    const sv = c.steer * 0.36;
    steer.forEach((r) => { if (r.current) r.current.rotation.y = sv; });

    const pitchOff = c.longG * 0.012;
    for (let i = 0; i < 4; i++) {
      if (hub[i].current) {
        const lat = THREE.MathUtils.clamp(c.lateralG * 0.03, -0.07, 0.07) * (F1_WHEELS[i].x > 0 ? -1 : 1);
        hub[i].current.position.y = F1_WHEELS[i].r + (i < 2 ? pitchOff : -pitchOff) + lat;
      }
      if (spin[i].current) spin[i].current.rotation.x = -c.wheelSpin;
      if (discs[i].current) {
        const want = c.braking && c.speed > 12 ? 1.4 + Math.min(1.6, c.speed / 40) : 0;
        discs[i].current.emissiveIntensity += (want - discs[i].current.emissiveIntensity) * 0.08;
      }
    }
    if (rain.current) {
      const t = clock.getElapsedTime();
      rain.current.emissiveIntensity = c.braking ? (Math.sin(t * 28) > 0 ? 6 : 0.4) : 0.7;
    }
    if (flame.current) {
      const on = c.throttle && c.speed > 2;
      const s = on ? 0.55 + c.rpm * 0.55 + Math.random() * 0.45 : 0;
      flame.current.scale.set(s * 0.7, s * 0.7, s);
    }
    // DRS-style rear flap drops open on the straights
    if (drs.current) {
      const open = c.throttle && Math.abs(c.steer) < 0.15 && c.speed > 55 ? 0.06 : 0.42;
      drs.current.rotation.x += (open - drs.current.rotation.x) * 0.1;
    }
  }, -2);

  return (
    <group ref={group}>
      <group ref={body}>
        <mesh geometry={tubGeo}>
          <meshStandardMaterial color={accent} metalness={0.5} roughness={0.26} />
        </mesh>
        {/* floor plank */}
        <mesh position={[0, 0.09, -0.1]}>
          <boxGeometry args={[1.55, 0.06, 4.4]} />
          <meshStandardMaterial color={CARBON} roughness={0.9} />
        </mesh>
        {/* sidepods */}
        {[-0.62, 0.62].map((x) => (
          <group key={x} position={[x, 0, -0.25]}>
            <mesh geometry={podGeo}>
              <meshStandardMaterial color={accent} metalness={0.45} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.42, 0.72]}>
              <boxGeometry args={[0.42, 0.3, 0.08]} />
              <meshStandardMaterial color="#07080b" roughness={1} />
            </mesh>
          </group>
        ))}
        {/* cockpit surround, driver, halo */}
        <mesh position={[0, 0.72, 0.36]}>
          <boxGeometry args={[0.48, 0.06, 0.86]} />
          <meshStandardMaterial color="#07080b" roughness={1} />
        </mesh>
        <mesh position={[0, 0.80, 0.2]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#0b6cff" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.80, 0.33]}>
          <torusGeometry args={[0.33, 0.045, 6, 12, Math.PI]} />
          <meshStandardMaterial color={CARBON} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.90, 0.6]} rotation={[0.52, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.58]} />
          <meshStandardMaterial color={CARBON} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* airbox + shark fin */}
        <mesh position={[0, 0.92, -0.2]}>
          <cylinderGeometry args={[0.16, 0.2, 0.3, 8]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.86, -1.3]}>
          <boxGeometry args={[0.035, 0.36, 1.1]} />
          <meshStandardMaterial color="#f2f3f6" roughness={0.4} />
        </mesh>

        {/* front wing */}
        <mesh position={[0, 0.14, 2.5]}>
          <boxGeometry args={[1.95, 0.05, 0.56]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 2.36]} rotation={[-0.34, 0, 0]}>
          <boxGeometry args={[1.75, 0.035, 0.32]} />
          <meshStandardMaterial color={accent} roughness={0.35} metalness={0.3} />
        </mesh>
        {[-0.97, 0.97].map((x) => (
          <mesh key={x} position={[x, 0.27, 2.5]}>
            <boxGeometry args={[0.05, 0.32, 0.6]} />
            <meshStandardMaterial color={CARBON} roughness={0.45} />
          </mesh>
        ))}
        {/* rear wing + DRS flap */}
        <mesh position={[0, 0.74, -2.05]}>
          <boxGeometry args={[0.09, 0.55, 0.14]} />
          <meshStandardMaterial color={CARBON} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.98, -2.18]}>
          <boxGeometry args={[1.55, 0.05, 0.44]} />
          <meshStandardMaterial color={CARBON} roughness={0.45} />
        </mesh>
        <group ref={drs} position={[0, 1.1, -2.24]}>
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[1.55, 0.04, 0.28]} />
            <meshStandardMaterial color={accent} roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
        {[-0.78, 0.78].map((x) => (
          <mesh key={x} position={[x, 0.96, -2.18]}>
            <boxGeometry args={[0.05, 0.48, 0.52]} />
            <meshStandardMaterial color={accent} metalness={0.4} roughness={0.34} />
          </mesh>
        ))}
        {/* diffuser, rain light, exhaust */}
        <mesh position={[0, 0.2, -2.28]} rotation={[-0.32, 0, 0]}>
          <boxGeometry args={[1.15, 0.1, 0.52]} />
          <meshStandardMaterial color={CARBON} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.42, -2.34]}>
          <boxGeometry args={[0.1, 0.22, 0.06]} />
          <meshStandardMaterial ref={rain} color="#ff1a1a" emissive="#ff1a1a" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0, 0.52, -2.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.22, 10]} />
          <meshStandardMaterial color="#3a3b40" metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh ref={flame} position={[0, 0.52, -2.46]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.6, 6]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.8} depthWrite={false} />
        </mesh>
        {/* suspension wishbones */}
        {F1_WHEELS.map((w, i) => (
          <group key={i}>
            <mesh position={[w.x * 0.55, 0.38, w.z]}>
              <boxGeometry args={[Math.abs(w.x) * 0.95, 0.04, 0.11]} />
              <meshStandardMaterial color={CARBON} roughness={0.5} />
            </mesh>
            <mesh position={[w.x * 0.55, 0.26, w.z - 0.2]}>
              <boxGeometry args={[Math.abs(w.x) * 0.92, 0.035, 0.08]} />
              <meshStandardMaterial color={CARBON} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {F1_WHEELS.map((w, i) => (
        <group key={i} ref={hub[i]} position={[w.x, w.r, w.z]}>
          {w.front ? (
            <group ref={steer[i]}>
              <Wheel r={w.r} w={w.w} spin={spin[i]} discRef={discs[i]} />
            </group>
          ) : (
            <Wheel r={w.r} w={w.w} spin={spin[i]} discRef={discs[i]} />
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Player drift coupe
   ═══════════════════════════════════════════════════════════════ */
export function PlayerCoupe({ carRef, paint = '#08D9D6', night = false }) {
  const group = useRef();
  const body = useRef();
  const steer = [useRef(), useRef()];
  const spin = [useRef(), useRef(), useRef(), useRef()];
  const discs = [useRef(), useRef(), useRef(), useRef()];
  const tail = useRef();
  const head = useRef();

  const shellGeo = useMemo(() => extrudeProfile(COUPE_PROFILE, 1.62, 0.09), []);
  const glassGeo = useMemo(() => extrudeProfile(COUPE_GLASS_PROFILE, 1.44, 0.03), []);

  useEffect(() => { if (group.current) group.current.rotation.order = 'YZX'; }, []);

  useFrame(() => {
    const c = carRef();
    if (!group.current || !c) return;
    group.current.position.set(c.x, c.visY || 0, c.z);
    group.current.rotation.set(c.visPitch || 0, c.heading, c.visRoll || 0);
    if (body.current) {
      const lean = THREE.MathUtils.clamp(-c.lateralG * 0.4, -0.16, 0.16);
      body.current.rotation.z += (lean - body.current.rotation.z) * 0.15;
      body.current.rotation.x += (c.longG * 0.025 - body.current.rotation.x) * 0.12;
    }
    const sv = c.steer * 0.5;
    steer.forEach((r) => { if (r.current) r.current.rotation.y = sv; });
    spin.forEach((r) => { if (r.current) r.current.rotation.x = -c.wheelSpin; });
    discs.forEach((d) => {
      if (!d.current) return;
      const want = c.braking && c.speed > 8 ? 1.6 : c.handbrake ? 2.2 : 0;
      d.current.emissiveIntensity += (want - d.current.emissiveIntensity) * 0.09;
    });
    if (tail.current) tail.current.emissiveIntensity = c.braking ? 5 : 1.1;
    if (head.current) head.current.intensity = night ? 3.2 : 0;
  }, -2);

  return (
    <group ref={group}>
      <group ref={body}>
        <mesh geometry={shellGeo}>
          <meshStandardMaterial color={paint} metalness={0.62} roughness={0.18} />
        </mesh>
        {/* plain transparent glass — `transmission` looks marginally better
            but forces three.js to re-render the whole scene into a buffer
            every frame, which was the single biggest cost in the game */}
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#0a1418" metalness={0.6} roughness={0.08}
            transparent opacity={0.72} />
        </mesh>
        {/* splitter + diffuser + side skirts */}
        <mesh position={[0, 0.2, 2.06]}>
          <boxGeometry args={[1.76, 0.08, 0.42]} />
          <meshStandardMaterial color={CARBON} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.24, -2.06]}>
          <boxGeometry args={[1.66, 0.16, 0.3]} />
          <meshStandardMaterial color={CARBON} roughness={0.6} />
        </mesh>
        {[-0.84, 0.84].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]}>
            <boxGeometry args={[0.1, 0.12, 2.4]} />
            <meshStandardMaterial color={CARBON} roughness={0.6} />
          </mesh>
        ))}
        {/* GT wing */}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 1.06, -1.9]}>
            <boxGeometry args={[0.07, 0.44, 0.28]} />
            <meshStandardMaterial color={CARBON} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.32, -1.95]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.86, 0.06, 0.5]} />
          <meshStandardMaterial color={CARBON} roughness={0.4} />
        </mesh>
        {/* lights */}
        <mesh position={[0, 0.6, -2.09]}>
          <boxGeometry args={[1.36, 0.12, 0.05]} />
          <meshStandardMaterial ref={tail} color="#ff1a1a" emissive="#ff2020" emissiveIntensity={1.1} />
        </mesh>
        {[-0.56, 0.56].map((x) => (
          <mesh key={x} position={[x, 0.62, 2.06]}>
            <boxGeometry args={[0.44, 0.14, 0.06]} />
            <meshStandardMaterial color="#fdf6e0" emissive="#fff3d0"
              emissiveIntensity={night ? 4 : 0.6} />
          </mesh>
        ))}
        {night && (
          <pointLight ref={head} position={[0, 0.6, 3.2]} distance={26} decay={1.6}
            color="#ffeec2" intensity={3.2} />
        )}
        {/* exhausts */}
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.3, -2.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.18, 10]} />
            <meshStandardMaterial color="#4a4b52" metalness={0.95} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {COUPE_WHEELS.map((w, i) => (
        <group key={i} position={[w.x, w.r, w.z]}>
          {w.front ? (
            <group ref={steer[i]}><Wheel r={w.r} w={w.w} rim="#d8b13c" spin={spin[i]} discRef={discs[i]} /></group>
          ) : (
            <Wheel r={w.r} w={w.w} rim="#d8b13c" spin={spin[i]} discRef={discs[i]} />
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Rival field — merged vertex-coloured bodies + instanced wheels
   ═══════════════════════════════════════════════════════════════ */
export function RivalField({ fieldRef }) {
  const bodyRefs = useRef([]);
  const wheelsRef = useRef();
  const field = fieldRef.current || [];

  const bodies = useMemo(
    () => field.map((a) => buildRivalBody(a.color, a.helmet)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field.length, field.map((a) => a.color).join()],
  );
  const wheelGeo = useMemo(() => buildRivalWheel(), []);
  const dummy = useMemo(() => {
    const d = new THREE.Object3D();
    d.rotation.order = 'YXZ';   // yaw the wheel, then spin it about its axle
    return d;
  }, []);
  const wheelCount = field.length * 4;

  useEffect(() => () => {
    bodies.forEach((b) => b.dispose());
  }, [bodies]);

  useFrame(() => {
    const list = fieldRef.current || [];
    let w = 0;
    for (let i = 0; i < list.length; i++) {
      const a = list[i], el = bodyRefs.current[i];
      if (el) {
        el.position.set(a.x, a.y, a.z);
        el.rotation.set(a.pitch || 0, a.ang, a.roll || 0);
      }
      if (wheelsRef.current) {
        for (const wh of F1_WHEELS) {
          const cs = Math.cos(a.ang), sn = Math.sin(a.ang);
          dummy.position.set(
            a.x + (wh.x * cs + wh.z * sn),
            a.y + wh.r,
            a.z + (-wh.x * sn + wh.z * cs),
          );
          dummy.rotation.set(-a.wheelSpin, a.ang, a.roll || 0);
          dummy.updateMatrix();
          wheelsRef.current.setMatrixAt(w++, dummy.matrix);
        }
      }
    }
    if (wheelsRef.current) wheelsRef.current.instanceMatrix.needsUpdate = true;
  }, -2);

  return (
    <group>
      {bodies.map((geo, i) => (
        <mesh key={i} geometry={geo}
          ref={(el) => { if (el) { el.rotation.order = 'YZX'; bodyRefs.current[i] = el; } }}>
          <meshStandardMaterial vertexColors metalness={0.4} roughness={0.34} />
        </mesh>
      ))}
      {wheelCount > 0 && (
        <instancedMesh ref={wheelsRef} args={[wheelGeo, null, wheelCount]} frustumCulled={false}>
          <meshStandardMaterial vertexColors roughness={0.8} />
        </instancedMesh>
      )}
    </group>
  );
}
