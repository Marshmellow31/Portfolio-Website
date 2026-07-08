import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useSEO from '../utils/useSEO';

/* ────────────────────────────────────────────────────────────────
   DRIVE — the colorful corner of an otherwise monochrome site.
   Arcade circuit racer: kinematic car physics, lap timing with
   localStorage best, chase cam. The world starts desaturated and
   floods into color the first time you hit the throttle.
   ──────────────────────────────────────────────────────────────── */

const TRACK_R = 40;        // centerline radius
const ROAD_HALF = 7;       // half road width
const MAX_SPEED = 40;      // u/s on tarmac
const OFFROAD_MAX = 14;    // u/s on grass

/* Shared mutable game state — physics writes, HUD polls. */
function createGame() {
  return {
    x: TRACK_R, z: 0, heading: Math.PI, speed: 0, steer: 0,
    started: false, raceOn: false,
    lap: 0, lapStart: 0, lapMs: 0, bestMs: Number(localStorage.getItem('hp-drive-best-ms')) || 0,
    angAcc: 0, prevPhi: null, onRoad: true, justLapped: 0,
    input: { up: false, down: false, left: false, right: false },
  };
}

function resetGame(g) {
  Object.assign(g, { x: TRACK_R, z: 0, heading: Math.PI, speed: 0, steer: 0, raceOn: false, lap: 0, lapMs: 0, angAcc: 0, prevPhi: null });
}

const wrapAngle = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const fmt = (ms) => {
  if (!ms) return '—:——.—';
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), t = Math.floor((ms % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${t}`;
};

/* ── The car: low-poly, unapologetically hot pink ── */
function Car({ game }) {
  const group = useRef();
  const body = useRef();
  const wheels = useRef([]);
  const frontWheels = useRef([]);

  useFrame((_, dt) => {
    const g = game.current;
    dt = Math.min(dt, 0.05);
    const { input } = g;

    // steering — tighter at low speed
    const steerTarget = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const speedFactor = 1 - Math.min(Math.abs(g.speed) / MAX_SPEED, 1) * 0.55;
    g.steer += (steerTarget * 0.52 * speedFactor - g.steer) * Math.min(1, dt * 10);

    // throttle / brake
    const dist = Math.hypot(g.x, g.z);
    g.onRoad = Math.abs(dist - TRACK_R) < ROAD_HALF;
    const cap = g.onRoad ? MAX_SPEED : OFFROAD_MAX;
    if (input.up) g.speed += 26 * dt;
    else if (input.down) g.speed -= (g.speed > 0 ? 42 : 16) * dt;
    else g.speed -= Math.sign(g.speed) * 10 * dt;
    if (!g.onRoad) g.speed -= Math.sign(g.speed) * 14 * dt;
    g.speed = THREE.MathUtils.clamp(g.speed, -12, cap);
    if (Math.abs(g.speed) < 0.05 && !input.up && !input.down) g.speed = 0;

    // kinematic bicycle-ish turn
    g.heading += (g.speed / 2.6) * Math.tan(g.steer) * dt;
    g.x += Math.sin(g.heading) * g.speed * dt;
    g.z += Math.cos(g.heading) * g.speed * dt;

    // lap accounting — accumulate angle around the circuit center.
    // Only while on tarmac, and reset the reference angle whenever the car
    // leaves the road, so cutting across the grass never counts as progress.
    if (g.raceOn && g.onRoad) {
      const phi = Math.atan2(g.z, g.x);
      if (g.prevPhi !== null) {
        const dphi = wrapAngle(phi - g.prevPhi);
        if (Math.abs(dphi) < 0.5) g.angAcc += dphi; // reject teleport-sized jumps
      }
      g.prevPhi = phi;
      if (Math.abs(g.angAcc) >= 2 * Math.PI) {
        g.angAcc -= Math.sign(g.angAcc) * 2 * Math.PI;
        g.lap += 1;
        const now = performance.now();
        const lapTime = now - g.lapStart;
        g.lapStart = now;
        g.justLapped = now;
        if (!g.bestMs || lapTime < g.bestMs) {
          g.bestMs = Math.round(lapTime);
          localStorage.setItem('hp-drive-best-ms', String(g.bestMs));
        }
      }
      g.lapMs = performance.now() - g.lapStart;
    } else {
      g.prevPhi = null;
      if (g.raceOn) g.lapMs = performance.now() - g.lapStart;
    }

    // apply to meshes
    group.current.position.set(g.x, 0, g.z);
    group.current.rotation.y = g.heading;
    if (body.current) {
      body.current.rotation.z = -g.steer * Math.min(Math.abs(g.speed) / MAX_SPEED, 1) * 0.35; // body roll
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, input.up ? -0.03 : input.down ? 0.04 : 0, dt * 6);
    }
    const spin = (g.speed * dt) / 0.42;
    wheels.current.forEach((w) => { if (w) w.rotation.x += spin; });
    frontWheels.current.forEach((w) => { if (w) w.rotation.y = g.steer * 0.9; });
  });

  return (
    <group ref={group}>
      <group ref={body}>
        {/* chassis */}
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[1.9, 0.55, 3.4]} />
          <meshStandardMaterial color="#FF2E63" metalness={0.35} roughness={0.35} />
        </mesh>
        {/* cabin */}
        <mesh castShadow position={[0, 1.0, -0.25]}>
          <boxGeometry args={[1.45, 0.5, 1.5]} />
          <meshStandardMaterial color="#08D9D6" metalness={0.55} roughness={0.15} />
        </mesh>
        {/* spoiler */}
        <mesh castShadow position={[0, 1.05, -1.65]}>
          <boxGeometry args={[1.7, 0.09, 0.42]} />
          <meshStandardMaterial color="#FFD93D" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[-0.6, 0.85, -1.65]}><boxGeometry args={[0.09, 0.35, 0.09]} /><meshStandardMaterial color="#252A34" /></mesh>
        <mesh position={[0.6, 0.85, -1.65]}><boxGeometry args={[0.09, 0.35, 0.09]} /><meshStandardMaterial color="#252A34" /></mesh>
        {/* headlights */}
        <mesh position={[-0.55, 0.58, 1.71]}><boxGeometry args={[0.32, 0.16, 0.05]} /><meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.6} /></mesh>
        <mesh position={[0.55, 0.58, 1.71]}><boxGeometry args={[0.32, 0.16, 0.05]} /><meshStandardMaterial color="#FFF6C3" emissive="#FFF6C3" emissiveIntensity={1.6} /></mesh>
      </group>
      {/* wheels — front pair steers */}
      {[[-0.95, 1.1, true], [0.95, 1.1, true], [-0.95, -1.15, false], [0.95, -1.15, false]].map(([wx, wz, front], i) => (
        <group key={i} position={[wx, 0.42, wz]} ref={front ? (el) => (frontWheels.current[i] = el) : undefined}>
          <mesh castShadow ref={(el) => (wheels.current[i] = el)} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
            <meshStandardMaterial color="#1B1B24" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Chase camera ── */
function ChaseCam({ game }) {
  useFrame(({ camera }, dt) => {
    const g = game.current;
    const back = 9.5, up = 4.6;
    const tx = g.x - Math.sin(g.heading) * back;
    const tz = g.z - Math.cos(g.heading) * back;
    const k = 1 - Math.exp(-5 * Math.min(dt, 0.05));
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (up - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(g.x, 1.1, g.z);
  });
  return null;
}

/* Deterministic pseudo-random scatter (no Math.random so SSR/StrictMode stay stable) */
function scatter(count, seed, minR, maxR) {
  const pts = [];
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = minR + rnd() * (maxR - minR);
    pts.push([Math.cos(a) * r, Math.sin(a) * r, rnd()]);
  }
  return pts;
}

const TREE_COLORS = ['#2ECC71', '#27AE60', '#A3E048', '#16A085'];
const BALLOON_COLORS = ['#FF2E63', '#FFD93D', '#08D9D6', '#B983FF', '#FF9A3C'];

/* ── The world: track, grass, trees, cones, arch, balloons ── */
function World() {
  const innerTrees = useMemo(() => scatter(26, 1337, 6, TRACK_R - ROAD_HALF - 5), []);
  const outerTrees = useMemo(() => scatter(40, 4242, TRACK_R + ROAD_HALF + 5, 95), []);
  const balloons = useRef([]);
  const dashes = useMemo(() => Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2), []);
  const cones = useMemo(() => Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    balloons.current.forEach((b, i) => { if (b) b.position.y = 7 + Math.sin(t * 0.8 + i * 1.7) * 1.2; });
  });

  return (
    <group>
      {/* grass */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[120, 48]} />
        <meshStandardMaterial color="#3DBE5B" />
      </mesh>
      {/* tarmac ring */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[TRACK_R - ROAD_HALF, TRACK_R + ROAD_HALF, 96]} />
        <meshStandardMaterial color="#33333E" />
      </mesh>
      {/* edge lines */}
      {[TRACK_R - ROAD_HALF + 0.3, TRACK_R + ROAD_HALF - 0.3].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r - 0.18, r + 0.18, 96]} />
          <meshStandardMaterial color={i ? '#FF9A3C' : '#F8F8FF'} />
        </mesh>
      ))}
      {/* center dashes */}
      {dashes.map((a) => (
        <mesh key={a} position={[Math.cos(a) * TRACK_R, 0.012, Math.sin(a) * TRACK_R]} rotation={[-Math.PI / 2, 0, -a + Math.PI / 2]}>
          <planeGeometry args={[0.35, 2.4]} />
          <meshStandardMaterial color="#FFD93D" />
        </mesh>
      ))}
      {/* start line */}
      <mesh position={[TRACK_R, 0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.6, ROAD_HALF * 2 - 0.8]} />
        <meshStandardMaterial color="#F8F8FF" />
      </mesh>
      {/* start arch */}
      <group position={[TRACK_R, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {[-(ROAD_HALF + 0.6), ROAD_HALF + 0.6].map((off, i) => (
          <mesh key={i} castShadow position={[off, 3, 0]}>
            <boxGeometry args={[0.6, 6, 0.6]} />
            <meshStandardMaterial color={i ? '#08D9D6' : '#FF2E63'} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 6.2, 0]}>
          <boxGeometry args={[(ROAD_HALF + 0.9) * 2, 1.1, 0.8]} />
          <meshStandardMaterial color="#FFD93D" />
        </mesh>
      </group>
      {/* trees */}
      {[...innerTrees, ...outerTrees].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} scale={0.8 + r * 0.7}>
          <mesh castShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.22, 0.3, 1.4, 6]} />
            <meshStandardMaterial color="#8D5A2B" />
          </mesh>
          <mesh castShadow position={[0, 2.1, 0]}>
            <coneGeometry args={[1.35, 2.8, 7]} />
            <meshStandardMaterial color={TREE_COLORS[i % TREE_COLORS.length]} />
          </mesh>
        </group>
      ))}
      {/* cones along edges */}
      {cones.map((a, i) => {
        const r = i % 2 ? TRACK_R - ROAD_HALF - 1 : TRACK_R + ROAD_HALF + 1;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * r, 0.35, Math.sin(a) * r]}>
            <coneGeometry args={[0.32, 0.75, 8]} />
            <meshStandardMaterial color="#FF9A3C" />
          </mesh>
        );
      })}
      {/* balloons */}
      {BALLOON_COLORS.map((c, i) => {
        const a = (i / BALLOON_COLORS.length) * Math.PI * 2 + 0.5;
        return (
          <mesh key={c} ref={(el) => (balloons.current[i] = el)} position={[Math.cos(a) * (TRACK_R + 16), 7, Math.sin(a) * (TRACK_R + 16)]}>
            <sphereGeometry args={[1.6, 12, 12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.15} />
          </mesh>
        );
      })}
      {/* sun */}
      <mesh position={[-70, 40, -90]}>
        <sphereGeometry args={[9, 16, 16]} />
        <meshBasicMaterial color="#FFE066" />
      </mesh>
    </group>
  );
}

/* ── Page ── */
export default function Drive() {
  const game = useRef(createGame());
  const [hud, setHud] = useState({ speed: 0, lap: 0, lapMs: 0, bestMs: game.current.bestMs, started: false, lappedFlash: false });
  const [touch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches);

  useSEO({ title: 'Drive', description: 'A playable arcade racer hidden in the portfolio. The world is gray until you drive.', path: '/drive' });

  // keyboard
  useEffect(() => {
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
    const set = (code, v) => {
      const g = game.current;
      const key = map[code];
      if (key) {
        g.input[key] = v;
        if (v && key === 'up' && !g.started) { g.started = true; g.raceOn = true; g.lapStart = performance.now(); }
      }
      if (v && code === 'KeyR') { resetGame(g); g.started = true; g.raceOn = true; g.lapStart = performance.now(); }
    };
    const down = (e) => { if (map[e.code] || e.code === 'KeyR') { e.preventDefault(); set(e.code, true); } };
    const up = (e) => set(e.code, false);
    // stuck-throttle guard: clear all input when the tab loses focus
    const blur = () => { const g = game.current; Object.keys(g.input).forEach((k) => (g.input[k] = false)); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  // HUD poll — 10Hz keeps React out of the frame loop
  useEffect(() => {
    const id = setInterval(() => {
      const g = game.current;
      if (import.meta.env.DEV) window.__hpDrive = g;
      setHud({
        speed: Math.round(Math.abs(g.speed) * 3.4),
        lap: g.lap, lapMs: g.raceOn ? g.lapMs : 0, bestMs: g.bestMs,
        started: g.started,
        lappedFlash: performance.now() - g.justLapped < 1600,
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  const press = (key, v) => (e) => {
    e.preventDefault();
    const g = game.current;
    g.input[key] = v;
    if (v && key === 'up' && !g.started) { g.started = true; g.raceOn = true; g.lapStart = performance.now(); }
  };

  const touchBtn = 'pointer-events-auto select-none flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-white text-xl font-bold active:bg-white/30 touch-none';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans">
      {/* Oz moment: world saturates on first throttle */}
      <div
        className="absolute inset-0"
        style={{ filter: hud.started ? 'saturate(1)' : 'saturate(0.05) contrast(1.02)', transition: 'filter 2.4s ease' }}
      >
        <Canvas shadows camera={{ position: [TRACK_R, 5, -12], fov: 60 }} dpr={[1, 1.75]}>
          <color attach="background" args={['#7EC8F8']} />
          <fog attach="fog" args={['#7EC8F8', 90, 190]} />
          <ambientLight intensity={0.75} />
          <directionalLight
            castShadow position={[-40, 55, -30]} intensity={1.6}
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70}
          />
          <World />
          <Car game={game} />
          <ChaseCam game={game} />
        </Canvas>
      </div>

      {/* ── HUD ── */}
      <div className="absolute inset-0 pointer-events-none p-[clamp(16px,4vw,32px)] flex flex-col justify-between z-10">
        {/* top row */}
        <div className="flex justify-between items-start w-full gap-4">
          <div className="flex gap-2">
            <Link to="/" className="pointer-events-auto flex items-center gap-2 font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">
              ← SITE
            </Link>
            <Link to="/playground" className="pointer-events-auto flex items-center gap-2 font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline">
              PLAYGROUND
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-white bg-black/30 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-2.5 shadow-lg text-right">
              <span className="text-[26px] font-bold leading-none">{hud.speed}</span>
              <span className="text-[10px] tracking-[.15em] text-white/60 ml-1.5">KM/H</span>
            </div>
            <div className="font-mono text-[10px] tracking-[.12em] text-white/80 bg-black/30 backdrop-blur-xl border border-white/15 rounded-full px-4 py-1.5">
              LAP {hud.lap} · {fmt(hud.lapMs)} · BEST {fmt(hud.bestMs)}
            </div>
          </div>
        </div>

        {/* lap flash */}
        {hud.lappedFlash && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 font-mono text-[13px] tracking-[.3em] text-white bg-black/40 backdrop-blur-xl border border-white/20 rounded-full px-7 py-3 uppercase">
            Lap {hud.lap} ✓
          </div>
        )}

        {/* intro */}
        {!hud.started && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-black/45 backdrop-blur-xl border border-white/15 rounded-2xl px-9 py-8 shadow-2xl max-w-[420px] mx-4">
              <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-4">Playground / Drive</div>
              <div className="text-white font-bold text-[28px] leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
                The world is gray<br />until you drive.
              </div>
              <div className="font-mono text-[11px] tracking-[.1em] text-white/70 leading-[2]">
                {touch ? 'TAP AND HOLD ▲ TO START' : 'W / ↑ — GAS · S / ↓ — BRAKE'}<br />
                {touch ? 'STEER WITH ◀ ▶' : 'A / D — STEER · R — RESET'}
              </div>
            </div>
          </div>
        )}

        {/* bottom row — touch controls */}
        {touch ? (
          <div className="flex justify-between items-end w-full pb-3">
            <div className="flex gap-3">
              <button className={touchBtn} onPointerDown={press('left', true)} onPointerUp={press('left', false)} onPointerLeave={press('left', false)}>◀</button>
              <button className={touchBtn} onPointerDown={press('right', true)} onPointerUp={press('right', false)} onPointerLeave={press('right', false)}>▶</button>
            </div>
            <div className="flex gap-3">
              <button className={touchBtn} onPointerDown={press('down', true)} onPointerUp={press('down', false)} onPointerLeave={press('down', false)}>▼</button>
              <button className={`${touchBtn} bg-white/20`} onPointerDown={press('up', true)} onPointerUp={press('up', false)} onPointerLeave={press('up', false)}>▲</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-start">
            <div className="font-mono text-[9px] md:text-[10px] tracking-[.1em] text-white/50 leading-[1.9] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              W/↑ GAS · S/↓ BRAKE · A/D STEER · R RESET
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
