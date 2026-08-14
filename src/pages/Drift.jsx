import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useSEO from '../utils/useSEO';
import useFullscreen from '../utils/useFullscreen';
import { createCarState, stepCar, stepDriftCar, gearFor, MAX_SPEED } from '../lib/drift-physics';
import { createRaceAudio } from '../lib/drift-audio';
import {
  CIRCUITS, THEMES, buildCircuit, circuitById, surfaceY, wrapAngle, CURB, RUNOFF,
} from '../lib/circuits';
import { createField, stepRival, standings, raceReference } from '../lib/race-ai';
import { detectQuality } from '../lib/quality';
import World, { LightRig } from '../components/race/World';
import {
  PlayerF1, PlayerCoupe, RivalField, F1_WHEELS, COUPE_WHEELS,
} from '../components/race/Cars';
import { TyreSmoke, SkidMarks, Sparks, DirtKick } from '../components/race/Effects';

/* ════════════════════════════════════════════════════════════════
   RACE — four circuits, a field of AI rivals that actually race,
   and a drift complex scored on angle, speed and clipping points.
   ════════════════════════════════════════════════════════════════ */

const ACCENT = '#FF7C00';
const DRIFT_PAINT = '#08D9D6';

const bestKey = (id) => `hp-race-best-${id}`;
const driftKey = (id) => `hp-drift-best-${id}`;

/* ── Game state ─────────────────────────────────────────────────── */
function createGame(circuit) {
  const isDrift = circuit.kind === 'drift';
  const startS = circuit.startIndex * circuit.step;
  const f = circuit.frameAt(startS - 12);
  const car = createCarState(f.x + f.nx * -3.6, f.z + f.nz * -3.6, f.ang);
  car.visY = surfaceY(f, -3.6);

  raceReference(circuit);

  return {
    circuit,
    isDrift,
    car,
    field: isDrift ? [] : createField(circuit, circuit.def.grid || 6, MAX_SPEED),
    input: { left: false, right: false, throttle: false, brake: false, handbrake: false },

    phase: 'ready',          // ready → countdown → racing → finished
    countdown: 0,
    raceTime: 0,

    progress: (circuit.startIndex - 3 + circuit.N) % circuit.N,
    s: startS - 12,
    lap: -1,              // 0 == "on lap 1"; see the lap-crossing block
    lapTime: 0,
    lastLap: 0,
    bestLap: Number(localStorage.getItem(bestKey(circuit.id))) || 0,
    position: 1,
    finishOrder: null,

    // drift scoring
    score: 0,
    chain: 0,
    mult: 1,
    chainCool: 0,
    best: Number(localStorage.getItem(driftKey(circuit.id))) || 0,
    clipped: new Set(),
    clipFlash: 0,

    shake: 0,
    impactId: 0,
    impactStr: 0,
    popup: null,
    popupId: 0,
    topSpeed: 0,
  };
}

function resetGame(g) {
  const c = g.circuit;
  const startS = c.startIndex * c.step;
  const f = c.frameAt(startS - 12);
  g.car = createCarState(f.x + f.nx * -3.6, f.z + f.nz * -3.6, f.ang);
  g.car.visY = surfaceY(f, -3.6);
  g.field = g.isDrift ? [] : createField(c, c.def.grid || 6, MAX_SPEED);
  g.progress = (c.startIndex - 3 + c.N) % c.N;
  g.s = startS - 12;
  g.lap = -1; g.lapTime = 0; g.lastLap = 0; g.raceTime = 0;
  g.score = 0; g.chain = 0; g.mult = 1; g.chainCool = 0;
  g.clipped = new Set();
  g.finishOrder = null;
  g.phase = 'countdown';
  g.countdown = 3.6;
  g.topSpeed = 0;
}

/* ═══════════════════════════════════════════════════════════════
   GameLoop — physics, race control, scoring, particle emission
   ═══════════════════════════════════════════════════════════════ */
function GameLoop({ game, isMobile, smokeApi, skidApi, sparkApi, dirtApi }) {
  const contactEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YZX'), []);
  const contactOffset = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, rawDt) => {
    const g = game.current;
    const dt = Math.min(rawDt, 0.04);
    const c = g.circuit;
    const { N, step, lapLength } = c;
    const car = g.car;
    const t = clock.getElapsedTime();

    /* ── Race control ── */
    if (g.phase === 'countdown') {
      g.countdown -= dt;
      if (g.countdown <= 0) { g.phase = 'racing'; g.countdown = 0; }
    }
    const live = g.phase === 'racing';
    if (live) g.raceTime += dt;

    // lights-out lock: no throttle until the countdown clears
    const input = live
      ? g.input
      : { left: false, right: false, throttle: false, brake: false, handbrake: false };
    if (isMobile && live && !g.input.brake) input.throttle = true;

    /* ── Rivals ── */
    if (live && g.field.length) {
      g._traffic = g._traffic || [];
      g._traffic.length = 0;
      for (const a of g.field) g._traffic.push(a);
      g._traffic.push({ s: g.s, lat: g.lat || 0 });
      for (const a of g.field) {
        if (a.finished) continue;
        stepRival(a, c, dt, g._traffic, t);
        if (!g.isDrift && a.lap >= c.laps) { a.finished = true; a.finishTime = g.raceTime; }
      }
    }

    /* ── Locate the player on the circuit ── */
    const prev = g.progress;
    let bestI = prev, bestD = Infinity;
    for (let k = prev - 5; k < prev + 18; k++) {
      const p = c.get(k);
      const d = (p.x - car.x) ** 2 + (p.z - car.z) ** 2;
      if (d < bestD) { bestD = d; bestI = ((k % N) + N) % N; }
    }
    if (bestD > 2200) {
      for (let k = 0; k < N; k += 2) {
        const p = c.get(k);
        const d = (p.x - car.x) ** 2 + (p.z - car.z) ** 2;
        if (d < bestD) { bestD = d; bestI = k; }
      }
    }

    /* Interpolated track frame under the car. */
    let pA = c.get(bestI), pB = c.get(bestI + 1);
    let sx = pB.x - pA.x, sz = pB.z - pA.z;
    let seg = ((car.x - pA.x) * sx + (car.z - pA.z) * sz) / (sx * sx + sz * sz || 1);
    if (seg < 0) {
      pB = pA; pA = c.get(bestI - 1);
      sx = pB.x - pA.x; sz = pB.z - pA.z;
      seg = ((car.x - pA.x) * sx + (car.z - pA.z) * sz) / (sx * sx + sz * sz || 1);
      bestI = ((bestI - 1) % N + N) % N;
    }
    seg = Math.max(0, Math.min(1, seg));
    const lp = (a, b) => a + (b - a) * seg;
    let nx = lp(pA.nx, pB.nx), nz = lp(pA.nz, pB.nz);
    const nl = Math.hypot(nx, nz) || 1;
    const p = {
      x: lp(pA.x, pB.x), y: lp(pA.y, pB.y), z: lp(pA.z, pB.z),
      nx: nx / nl, nz: nz / nl,
      ang: pA.ang + wrapAngle(pB.ang - pA.ang) * seg,
      tilt: lp(pA.tilt, pB.tilt), grade: lp(pA.grade, pB.grade),
      half: lp(pA.half, pB.half), curv: lp(pA.curv, pB.curv),
      curb: lp(pA.curb, pB.curb),
    };

    const dLat = (car.x - p.x) * p.nx + (car.z - p.z) * p.nz;
    g.lat = dLat;
    const onRoad = Math.abs(dLat) < p.half + CURB * 0.6;

    /* ── Lap crossing / finish ── */
    const prevS = g.s;
    g.s = bestI * step + seg * step;
    const startS = c.startIndex * step;
    const fwd = (g.s - prevS + lapLength) % lapLength;
    if (fwd > 0 && fwd < lapLength / 2) {
      const toLine = (startS - prevS + lapLength) % lapLength;
      if (toLine > 0 && toLine <= fwd && g.phase === 'racing') {
        g.lap++;
        // the grid-to-line crossing advances the counter but isn't a lap time
        if (g.lapTime > 5) {
          g.lastLap = g.lapTime;
          const isBest = !g.bestLap || g.lastLap < g.bestLap;
          if (isBest) {
            g.bestLap = g.lastLap;
            localStorage.setItem(bestKey(c.id), String(g.bestLap));
          }
          g.popupId++;
          g.popup = { id: g.popupId, kind: 'lap', t: g.lastLap, best: isBest };
        }
        if (!g.isDrift && g.lap >= c.laps) {
          g.phase = 'finished';
          g.finishOrder = standings(c, { lap: g.lap, s: g.s }, g.field);
        }
        g.lapTime = 0;
      }
    }
    if (g.phase === 'racing') g.lapTime += dt;

    /* ── Physics ── */
    car.grade = p.grade;
    if (g.isDrift) stepDriftCar(car, input, dt, onRoad);
    else stepCar(car, input, dt, onRoad);
    if (car.speed > g.topSpeed) g.topSpeed = car.speed;

    /* ── Barriers on both sides ── */
    const wallLat = p.half + CURB + RUNOFF - 0.9;
    if (Math.abs(dLat) > wallLat) {
      const sign = Math.sign(dLat);
      const over = Math.abs(dLat) - wallLat;
      car.x -= p.nx * sign * over;
      car.z -= p.nz * sign * over;
      const vn = (car.vx * p.nx + car.vz * p.nz) * sign;
      if (vn > 0) {
        car.vx -= p.nx * sign * vn * 1.55;
        car.vz -= p.nz * sign * vn * 1.55;
        car.vx *= 0.92; car.vz *= 0.92;
        if (car.yawRate !== undefined) car.yawRate *= 0.5;
        g.shake = Math.max(g.shake, Math.min(1.2, vn * 0.06));
        g.impactId++; g.impactStr = Math.min(1, vn * 0.05);
        sparkApi.current?.emit(car.x + p.nx * sign * 0.9, car.visY + 0.5, car.z + p.nz * sign * 0.9, car.vx, car.vz, 7);
        // a hit ends a drift chain
        if (g.isDrift && vn > 4) { g.chain = 0; g.mult = 1; }
      }
    }

    /* ── Surface following: height, roll, pitch ── */
    const fx = Math.sin(car.heading), fz = Math.cos(car.heading);
    const lx = Math.cos(car.heading), lz = -Math.sin(car.heading);
    // surface gradient = tilt across the track + grade along it
    const gx = p.tilt * p.nx + p.grade * Math.sin(p.ang);
    const gz = p.tilt * p.nz + p.grade * Math.cos(p.ang);
    const targetRoll = Math.atan(gx * lx + gz * lz);
    const targetPitch = -Math.atan(gx * fx + gz * fz);
    const kv = Math.min(1, dt * 14);
    car.visRoll += (targetRoll - car.visRoll) * kv;
    car.visPitch += (targetPitch - car.visPitch) * kv;

    /* Match the road at the four real tyre contact patches. The model uses a
       YZX Euler order, so rotate each local contact point with that exact same
       transform instead of approximating its height from pitch/roll. */
    let targetY = surfaceY(p, dLat);
    const wheels = g.isDrift ? COUPE_WHEELS : F1_WHEELS;
    contactEuler.set(car.visPitch, car.heading, car.visRoll, 'YZX');
    for (const wheel of wheels) {
      contactOffset.set(wheel.x, 0, wheel.z).applyEuler(contactEuler);
      const along = contactOffset.x * Math.sin(p.ang) + contactOffset.z * Math.cos(p.ang);
      const wf = c.frameAt(g.s + along);
      const worldX = car.x + contactOffset.x;
      const worldZ = car.z + contactOffset.z;
      const wheelLat = (worldX - wf.x) * wf.nx + (worldZ - wf.z) * wf.nz;
      const roadY = surfaceY(wf, wheelLat);
      targetY = Math.max(targetY, roadY - contactOffset.y + 0.012);
    }
    // Height must follow both rises and drops immediately. Smoothing only the
    // downward movement was the source of the visible hovering after crests.
    car.visY = targetY;

    /* ── Rival collisions ── */
    const cOff = 1.15, cR = 1.2, minD = cR * 2;
    for (const a of g.field) {
      const ddx = a.x - car.x, ddz = a.z - car.z;
      if (ddx * ddx + ddz * ddz > 64) continue;
      const afx = Math.sin(a.ang), afz = Math.cos(a.ang);
      const avx = afx * a.v, avz = afz * a.v;
      for (const oa of [-cOff, cOff]) {
        const pcx = car.x + fx * oa, pcz = car.z + fz * oa;
        for (const ob of [-cOff, cOff]) {
          let hx = pcx - (a.x + afx * ob), hz = pcz - (a.z + afz * ob);
          const d = Math.hypot(hx, hz);
          if (d >= minD || d < 1e-4) continue;
          hx /= d; hz /= d;
          const push = minD - d;
          car.x += hx * push * 0.7; car.z += hz * push * 0.7;
          const vn = (car.vx - avx) * hx + (car.vz - avz) * hz;
          if (vn < 0) {
            car.vx -= hx * vn * 1.4;
            car.vz -= hz * vn * 1.4;
            car.vx *= 0.95; car.vz *= 0.95;
            a.v = Math.max(4, a.v + vn * 0.25);    // they lose time too
            g.shake = Math.max(g.shake, Math.min(1.1, -vn * 0.05));
            if (-vn > 4) {
              g.impactId++; g.impactStr = Math.min(1, -vn * 0.04);
              sparkApi.current?.emit((pcx + a.x) / 2, a.y + 0.45, (pcz + a.z) / 2, car.vx, car.vz, 5);
            }
          }
        }
      }
    }

    /* ── Standings ── */
    if (!g.isDrift) {
      const rows = standings(c, { lap: g.lap, s: g.s }, g.field);
      g.position = rows.findIndex((r) => r.player) + 1;
      g.rows = rows;
    }

    /* ── Drift scoring ── */
    if (g.isDrift) {
      if (live && car.drifting && !car.reverse && car.speed > 7 && onRoad) {
        g.chainCool = 1.1;
        g.chain += car.speed * car.slip * dt * 3.2;
        g.mult = Math.min(6, 1 + g.chain / 900);

        // clipping points: brush an apex on the inside while sideways
        for (const ap of c.apexes) {
          if (g.clipped.has(ap.i)) continue;
          const as = ap.i * step;
          let ds = Math.abs(g.s - as);
          if (ds > lapLength / 2) ds = lapLength - ds;
          if (ds > 7) continue;
          const inside = ap.side > 0 ? dLat > p.half * 0.35 : dLat < -p.half * 0.35;
          if (!inside) continue;
          g.clipped.add(ap.i);
          g.chain += 260 * (0.6 + ap.tight);
          g.mult = Math.min(6, g.mult + 0.4);
          g.clipFlash = 1;
          g.popupId++;
          g.popup = { id: g.popupId, kind: 'clip', t: Math.round(260 * (0.6 + ap.tight)) };
        }
      } else if (g.chainCool > 0) {
        g.chainCool -= dt;
        if (g.chainCool <= 0) {
          // chain banked
          g.score += g.chain * g.mult;
          if (g.score > g.best) {
            g.best = g.score;
            localStorage.setItem(driftKey(c.id), String(Math.floor(g.best)));
          }
          if (g.chain > 200) {
            g.popupId++;
            g.popup = { id: g.popupId, kind: 'bank', t: Math.round(g.chain * g.mult) };
          }
          g.chain = 0; g.mult = 1;
          g.clipped = new Set();
        }
      }
      g.clipFlash *= (1 - dt * 3);
    }

    /* ── Camera shake + particles ── */
    if (car.driftJustEntered) g.shake = Math.max(g.shake, 0.3);
    if (!onRoad && car.speed > 6) g.shake = Math.max(g.shake, 0.22);
    g.shake *= (1 - dt * 6);

    const surfAt = (ox, oz) => surfaceY(p, dLat + p.nx * ox + p.nz * oz);
    const rx = -fz, rz = fx;
    if (car.drifting && onRoad) {
      const amt = Math.max(car.slip, input.brake ? 0.25 : 0);
      for (const side of [-0.85, 0.85]) {
        const ox = -fx * 1.4 + rx * side, oz = -fz * 1.4 + rz * side;
        const gy = surfAt(ox, oz);
        smokeApi.current?.emit(car.x + ox, gy + 0.2, car.z + oz, amt);
        skidApi.current?.emit(car.x + ox, gy + 0.035, car.z + oz, car.heading, car.visRoll, amt);
      }
    }
    if (!g.isDrift && car.speed > MAX_SPEED * 0.78 && Math.random() > 0.72) {
      sparkApi.current?.emit(car.x - fx * 1.9, surfAt(-fx * 1.9, -fz * 1.9) + 0.08, car.z - fz * 1.9, car.vx, car.vz, 2);
    }
    if (!onRoad && car.speed > 5) {
      dirtApi.current?.emit(car.x - fx * 0.6, surfAt(-fx * 0.6, -fz * 0.6), car.z - fz * 0.6);
    }
  }, -3);
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ChaseCam — chase during the race, orbit during the countdown
   ═══════════════════════════════════════════════════════════════ */
function ChaseCam({ game }) {
  const st = useRef({ heading: null, y: 0, spd: 0, swing: 0, look: 0 });
  const { camera } = useThree();

  useFrame(({ clock }, rawDt) => {
    const g = game.current;
    const car = g.car;
    const s = st.current;
    const dt = Math.min(rawDt, 0.05);
    if (s.heading === null) { s.heading = car.heading; s.y = car.visY; }

    /* Countdown: a slow cinematic orbit around the car on the grid. */
    if (g.phase === 'ready' || g.phase === 'countdown') {
      const t = clock.getElapsedTime() * 0.35;
      const r = 11;
      camera.position.set(
        car.x + Math.sin(t) * r,
        car.visY + 3.4 + Math.sin(t * 0.7) * 0.8,
        car.z + Math.cos(t) * r,
      );
      camera.lookAt(car.x, car.visY + 0.7, car.z);
      camera.fov += (46 - camera.fov) * 0.06;
      camera.updateProjectionMatrix();
      s.heading = car.heading;
      s.y = car.visY;
      return;
    }

    s.spd += (car.speed / MAX_SPEED - s.spd) * (1 - Math.exp(-6 * dt));
    const spd = s.spd;
    const kh = 1 - Math.exp(-(6 + 10 * spd) * dt);
    const ky = 1 - Math.exp(-12 * dt);
    s.heading += wrapAngle(car.heading - s.heading) * kh;
    s.y += (car.visY - s.y) * ky;

    const back = 8.5 + spd * 3.6;
    const up = 3.2 + spd * 1.1;
    let tx = car.x - Math.sin(s.heading) * back;
    let tz = car.z - Math.cos(s.heading) * back;

    const swingT = (car.drifting && car.slip > 0.12)
      ? Math.min(car.slip * 3, 3.6) * -car.slipSign : 0;
    s.swing += (swingT - s.swing) * (1 - Math.exp(-5 * dt));
    tx += -Math.cos(s.heading) * s.swing;
    tz += Math.sin(s.heading) * s.swing;

    camera.position.set(tx, s.y + up, tz);
    if (g.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * g.shake * 0.32;
      camera.position.y += (Math.random() - 0.5) * g.shake * 0.16;
      camera.position.z += (Math.random() - 0.5) * g.shake * 0.32;
    }

    const targetFov = 56 + spd * 20;
    camera.fov += (targetFov - camera.fov) * kh;
    camera.updateProjectionMatrix();

    // look slightly into the corner rather than straight at the gearbox
    const lookT = -(car.steer || 0) * 3.2;
    s.look += (lookT - s.look) * (1 - Math.exp(-4 * dt));
    camera.lookAt(
      car.x - Math.cos(car.heading) * s.look,
      s.y + 0.9,
      car.z + Math.sin(car.heading) * s.look,
    );
  }, -1);
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   AdaptiveQuality — keeps the frame rate up on whatever hardware is
   running it. Drops render resolution when needed.
   ═══════════════════════════════════════════════════════════════ */
function AdaptiveQuality({ quality }) {
  const { gl } = useThree();
  const maxDpr = quality.maxDpr;
  const st = useRef({ t: 0, n: 0, dpr: maxDpr });

  useFrame((_, dt) => {
    const s = st.current;
    s.t += dt; s.n++;
    if (s.t < 1) return;
    const fps = s.n / s.t;
    s.t = 0; s.n = 0;
    if (import.meta.env.DEV) window.__hpFps = Math.round(fps);

    if (fps < 50) {
      if (s.dpr > quality.minDpr) {
        s.dpr = Math.max(quality.minDpr, s.dpr - 0.2);
        gl.setPixelRatio(Math.min(window.devicePixelRatio, s.dpr));
      }
    } else if (fps > 58 && s.dpr < maxDpr) {
      s.dpr = Math.min(maxDpr, s.dpr + 0.1);
      gl.setPixelRatio(Math.min(window.devicePixelRatio, s.dpr));
    }
  });
  return null;
}

/* Renderer-level settings that R3F doesn't expose declaratively. */
function Rig({ theme }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __hpScene: scene, __hpGL: gl, __hpCam: camera });
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = theme.exposure;
    const far = camera.far;
    scene.fog = new THREE.Fog(
      theme.fog,
      Math.min(theme.fogNear, far * 0.25),
      Math.min(theme.fogFar, far * 0.82),
    );
  }, [gl, scene, camera, theme]);
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
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${GAUGE.r} ${GAUGE.r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function Speedometer({ speed, gear, rpm }) {
  const pct = Math.min(1, speed / GAUGE.max);
  return (
    <svg viewBox="0 0 180 132" className="w-[136px] md:w-[168px]">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08D9D6" />
          <stop offset="70%" stopColor="#FF7C00" />
          <stop offset="100%" stopColor="#FF2E63" />
        </linearGradient>
      </defs>
      <path d={gaugeArc(GAUGE.start, GAUGE.sweep)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" strokeLinecap="round" />
      {pct > 0 && <path d={gaugeArc(GAUGE.start, pct * GAUGE.sweep)} fill="none" stroke="url(#sg)" strokeWidth="5" strokeLinecap="round" />}
      {/* shift light bar */}
      <rect x="52" y="14" width="76" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      <rect x="52" y="14" width={76 * rpm} height="4" rx="2" fill={rpm > 0.88 ? '#FF2E63' : '#08D9D6'} />
      <text x={GAUGE.cx} y={GAUGE.cy - 10} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{speed}</text>
      <text x={GAUGE.cx} y={GAUGE.cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'JetBrains Mono', monospace" letterSpacing="3">KM/H</text>
      <text x={GAUGE.cx} y={GAUGE.cy + 34} textAnchor="middle" fill="#FF7C00" fontSize="22" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{gear}</text>
    </svg>
  );
}

function Minimap({ circuit, carX, carZ, rivals }) {
  const { path, map, start } = useMemo(() => {
    const b = circuit.bounds;
    const W = 150, H = 100, pad = 9;
    const spanX = Math.max(1, b.maxX - b.minX), spanZ = Math.max(1, b.maxZ - b.minZ);
    const k = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanZ);
    const map = (x, z) => [
      W / 2 + (x - b.cx) * k,
      H / 2 + (z - b.cz) * k,
    ];
    const pts = circuit.pts.filter((_, i) => i % 4 === 0);
    const path = pts.map((p, i) => {
      const [sx, sy] = map(p.x, p.z);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' ') + ' Z';
    const sp = circuit.get(circuit.startIndex);
    return { path, map, start: map(sp.x, sp.z) };
  }, [circuit]);

  const [cx, cy] = map(carX, carZ);
  return (
    <svg viewBox="0 0 150 100" className="w-[112px] md:w-[142px]">
      <path d={path} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="5.5" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx={start[0]} cy={start[1]} r="2.4" fill="rgba(255,255,255,0.8)" />
      {rivals.map((r, i) => {
        const [rx, ry] = map(r.x, r.z);
        return <circle key={i} cx={rx} cy={ry} r="2.1" fill={r.color} opacity="0.9" />;
      })}
      <circle cx={cx} cy={cy} r="3.4" fill="#FF7C00" stroke="#000" strokeWidth="0.8" />
    </svg>
  );
}

const fmtLap = (t) => {
  if (!t) return '--:--.--';
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, '0')}`;
};
const ord = (n) => `${n}${['TH', 'ST', 'ND', 'RD'][(n % 100 - n % 10 !== 10 && n % 10 < 4) ? n % 10 : 0]}`;

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */
export default function Drift() {
  useSEO({
    title: 'Race',
    description: 'Four hand-built circuits, a field of AI rivals and a drift complex — a pocket racing game built with three.js.',
    path: '/drift',
  });

  /* Playground opens directly on the race preview. The game remains in its
     ready phase until the visitor explicitly accepts the play prompt. */
  const [circuitId, setCircuitId] = useState('ridge');
  const circuit = useMemo(
    () => (circuitId ? buildCircuit(circuitById(circuitId)) : null),
    [circuitId],
  );
  const theme = circuit ? THEMES[circuit.theme] : THEMES.noon;
  /* The game object has to exist before the scene children render — they
     read the rival field on mount — so it is swapped during render rather
     than in an effect. Idempotent: only rebuilt when the circuit changes. */
  const game = useRef(null);
  if (circuit && (!game.current || game.current.circuit !== circuit)) {
    game.current = createGame(circuit);
  }

  useEffect(() => {
    if (circuit) localStorage.setItem('hp-race-circuit', circuit.id);
  }, [circuit]);

  const smokeApi = useRef(null);
  const skidApi = useRef(null);
  const sparkApi = useRef(null);
  const dirtApi = useRef(null);
  const rootRef = useRef(null);
  const { isFullscreen, supported: fsSupported, toggle: toggleFullscreen, enter: enterFullscreen, lockLandscape } = useFullscreen(rootRef);

  const fsArmed = useRef(false);
  const goFullscreenOnce = () => {
    if (fsArmed.current || !fsSupported) return;
    fsArmed.current = true;
    enterFullscreen().then(lockLandscape);
  };

  const [touch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches);
  const quality = useMemo(() => detectQuality(), []);
  const [picker, setPicker] = useState(false);
  const [hud, setHud] = useState({
    speed: 0, gear: 1, rpm: 0, phase: 'ready', countdown: 0,
    lap: 0, lapTime: 0, lastLap: 0, bestLap: 0, position: 1,
    score: 0, chain: 0, mult: 1, best: 0,
    carX: 0, carZ: 0, speedPct: 0, rivals: [], rows: [], finishOrder: null,
    slipDeg: 0, drifting: false,
  });
  const [popup, setPopup] = useState(null);
  const popupRef = useRef(0);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createRaceAudio();
    audioRef.current.start();
  }, []);
  const toggleSound = useCallback(() => setSoundOn((on) => {
    const next = !on;
    ensureAudio();
    audioRef.current.setMuted(!next);
    return next;
  }), [ensureAudio]);

  const startRace = useCallback(() => {
    const g = game.current;
    if (!g) return;
    if (g.phase === 'ready' || g.phase === 'finished') {
      resetGame(g);
      skidApi.current?.clear();
    }
    ensureAudio();
    goFullscreenOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureAudio]);

  const chooseCircuit = (id) => {
    setPicker(false);
    setCircuitId(id);
  };

  /* ── Audio ── */
  useEffect(() => {
    let raf, lastImpact = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const a = audioRef.current;
      const g = game.current;
      if (!a || !g) return;
      const c = g.car;
      a.update({
        mode: g.isDrift ? 'drift' : 'race',
        rpm: c.rpm, speed: c.speed,
        throttle: g.phase === 'racing' && g.input.throttle,
        drifting: c.drifting, slip: c.slip, onRoad: c.onRoad,
      });
      if (g.impactId > lastImpact) { lastImpact = g.impactId; a.impact(g.impactStr); }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  /* ── Keyboard ── */
  useEffect(() => {
    const map = {
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'throttle', KeyW: 'throttle',
      ArrowDown: 'brake', KeyS: 'brake',
      Space: 'handbrake', ShiftLeft: 'handbrake',
    };
    const down = (e) => {
      const g = game.current;
      if (!g) return;
      if (e.code === 'KeyR') { resetGame(g); skidApi.current?.clear(); ensureAudio(); return; }
      if (e.code === 'KeyM') { toggleSound(); return; }
      if (e.code === 'Tab') { e.preventDefault(); setPicker((v) => !v); return; }
      if (e.code === 'Enter' && g.phase !== 'racing') { startRace(); return; }
      if (!map[e.code]) return;
      e.preventDefault();
      if (g.phase === 'ready' || g.phase === 'finished') startRace();
      g.input[map[e.code]] = true;
      ensureAudio();
    };
    const up = (e) => { if (map[e.code] && game.current) game.current.input[map[e.code]] = false; };
    const blur = () => {
      if (!game.current) return;
      const i = game.current.input;
      i.left = i.right = i.throttle = i.brake = i.handbrake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [ensureAudio, startRace, toggleSound]);

  /* ── HUD poll ── */
  useEffect(() => {
    const id = setInterval(() => {
      const g = game.current;
      if (!g) return;
      if (import.meta.env.DEV) window.__hpRace = g;
      const c = g.car;
      setHud({
        speed: Math.round(c.speed * 3.6),
        gear: c.reverse ? 'R' : gearFor(c.speed),
        rpm: c.rpm,
        phase: g.phase,
        countdown: g.countdown,
        lap: g.lap,
        lapTime: g.lapTime,
        lastLap: g.lastLap,
        bestLap: g.bestLap,
        position: g.position,
        score: Math.floor(g.score),
        chain: Math.floor(g.chain),
        mult: g.mult,
        best: Math.floor(g.best),
        carX: c.x, carZ: c.z,
        speedPct: c.speed / MAX_SPEED,
        slipDeg: c.slipDeg,
        drifting: c.drifting,
        rivals: g.field.map((a) => ({ x: a.x, z: a.z, color: a.color })),
        rows: g.rows || [],
        finishOrder: g.finishOrder,
      });
      const dp = g.popup;
      if (dp && dp.id > popupRef.current) {
        popupRef.current = dp.id;
        setPopup(dp);
        setTimeout(() => setPopup((q) => (q && q.id === dp.id ? null : q)), 2000);
      }
    }, 70);
    return () => clearInterval(id);
  }, []);

  const press = (key, v) => (e) => {
    e.preventDefault();
    const g = game.current;
    if (!g) return;
    if (v && (g.phase === 'ready' || g.phase === 'finished')) startRace();
    g.input[key] = v;
    if (v) ensureAudio();
  };

  const carRef = useCallback(() => game.current?.car, []);
  const fieldRef = useRef([]);
  if (game.current) fieldRef.current = game.current.field;
  const focus = useCallback(() => {
    const c = game.current?.car;
    return c ? { x: c.x, y: c.visY, z: c.z } : null;
  }, []);

  const isDrift = circuit?.kind === 'drift';
  const touchBtn = 'pointer-events-auto select-none flex items-center justify-center w-[68px] h-[68px] rounded-full bg-white/10 backdrop-blur-xl border border-white/25 text-white text-xl font-bold active:bg-white/30 touch-none';
  const chip = 'pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase text-white/70 hover:text-white transition-colors bg-black/35 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-full shadow-lg no-underline cursor-pointer';

  const countLabel = hud.countdown > 3 ? 'READY'
    : hud.countdown > 0 ? String(Math.ceil(hud.countdown)) : 'GO';

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 bg-black overflow-hidden font-sans select-none"
      style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'manipulation' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {circuit && (
      <Canvas
        key={circuit.id}
        shadows={false}
        camera={{ position: [0, 6, 40], fov: 55, near: 0.4, far: quality.far }}
        dpr={[quality.minDpr, quality.maxDpr]}
        gl={{ antialias: quality.antialias, powerPreference: 'high-performance', stencil: false }}
      >
        <Rig theme={theme} />
        <AdaptiveQuality quality={quality} />
        <LightRig theme={theme} focus={focus} />
        <World circuit={circuit} theme={theme} />
        <RivalField fieldRef={fieldRef} />
        <SkidMarks api={skidApi} />
        {isDrift
          ? <PlayerCoupe carRef={carRef} paint={DRIFT_PAINT} night={theme.night} />
          : <PlayerF1 carRef={carRef} accent={ACCENT} />}
        <TyreSmoke api={smokeApi} />
        <Sparks api={sparkApi} />
        <DirtKick api={dirtApi} color={theme.ground} />
        <GameLoop
          game={game} isMobile={touch}
          smokeApi={smokeApi} skidApi={skidApi} sparkApi={sparkApi} dirtApi={dirtApi}
        />
        <ChaseCam game={game} />
      </Canvas>
      )}

      {/* ── HUD ── */}
      {circuit && (
      <div className="absolute inset-0 pointer-events-none p-[clamp(12px,3vw,28px)] flex flex-col justify-between z-10">

        {/* Top bar */}
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex flex-col gap-2 items-start">
            <div className="flex gap-2 flex-wrap">
              <Link to="/" className={chip}>← SITE</Link>
              <Link to="/playground" className={chip}>PLAYGROUND</Link>
              <button
                onClick={() => setPicker((v) => !v)}
                className="pointer-events-auto font-mono text-[10px] tracking-[.12em] uppercase font-bold border-none cursor-pointer px-4 py-2.5 rounded-full shadow-lg transition-colors"
                style={{ background: isDrift ? DRIFT_PAINT : ACCENT, color: 'black' }}
              >
                {circuit.name} ▾
              </button>
              <button onClick={toggleSound} className={chip} title={soundOn ? 'Mute (M)' : 'Unmute (M)'}>
                {soundOn ? '🔊' : '🔇'}
              </button>
              {fsSupported && (
                <button
                  onClick={() => { fsArmed.current = true; toggleFullscreen().then(() => !isFullscreen && lockLandscape()); }}
                  className={chip}
                >
                  {isFullscreen ? '⤡' : '⛶'}
                </button>
              )}
            </div>
            <div className="bg-black/35 backdrop-blur-xl border border-white/10 rounded-xl px-2 py-1 shadow-lg">
              <Minimap circuit={circuit} carX={hud.carX} carZ={hud.carZ} rivals={hud.rivals} />
            </div>
          </div>

          {/* Timing / scoring panel */}
          {isDrift ? (
            <div className="font-mono text-white bg-black/35 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 shadow-lg text-right min-w-[168px]">
              <div className="text-[10px] tracking-[.2em] text-white/50 mb-1">DRIFT SCORE</div>
              <div className="text-[26px] font-bold leading-none tabular-nums" style={{ color: DRIFT_PAINT }}>
                {hud.score.toLocaleString()}
              </div>
              {hud.chain > 0 && (
                <div className="mt-2 text-[13px] font-bold tabular-nums text-white">
                  +{hud.chain.toLocaleString()}
                  <span style={{ color: ACCENT }}> ×{hud.mult.toFixed(1)}</span>
                </div>
              )}
              <div className="text-[10px] tracking-[.1em] tabular-nums mt-2 text-white/60">
                BEST {hud.best.toLocaleString()}
              </div>
              {hud.drifting && (
                <div className="text-[10px] tracking-[.1em] tabular-nums mt-1" style={{ color: ACCENT }}>
                  {hud.slipDeg}° ANGLE
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="font-mono text-white bg-black/35 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 shadow-lg text-right min-w-[168px]">
                <div className="flex items-baseline justify-end gap-3 mb-1">
                  <span className="text-[10px] tracking-[.2em] text-white/50">
                    LAP {Math.max(1, Math.min(hud.lap + 1, circuit.laps))}/{circuit.laps}
                  </span>
                  <span className="text-[16px] font-bold" style={{ color: ACCENT }}>P{hud.position}</span>
                </div>
                <div className="text-[24px] font-bold leading-none tabular-nums">{fmtLap(hud.lapTime)}</div>
                <div className="text-[10px] tracking-[.1em] text-white/60 mt-2 tabular-nums">LAST {fmtLap(hud.lastLap)}</div>
                <div className="text-[10px] tracking-[.1em] tabular-nums" style={{ color: ACCENT }}>BEST {fmtLap(hud.bestLap)}</div>
              </div>
              {/* live standings */}
              {hud.rows.length > 0 && hud.phase === 'racing' && (
                <div className="hidden md:block font-mono bg-black/35 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-lg">
                  {hud.rows.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-[10px] leading-[1.7]">
                      <span className="text-white/40 w-3 text-right">{r.pos}</span>
                      <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      <span className={r.player ? 'text-white font-bold' : 'text-white/65'}>{r.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom row */}
        {touch ? (
          <div className="flex justify-between items-end w-full pb-2">
            <div className="flex gap-3">
              <button className={touchBtn} onPointerDown={press('left', true)} onPointerUp={press('left', false)} onPointerLeave={press('left', false)}>◀</button>
              <button className={touchBtn} onPointerDown={press('right', true)} onPointerUp={press('right', false)} onPointerLeave={press('right', false)}>▶</button>
            </div>
            <div className="flex gap-3 items-end">
              <button className={`${touchBtn} w-[60px] h-[60px] text-[13px] bg-red-500/20 border-red-500/40`} onPointerDown={press('brake', true)} onPointerUp={press('brake', false)} onPointerLeave={press('brake', false)}>BRK</button>
              <button className={`${touchBtn} w-[92px] text-[13px]`} style={{ background: 'rgba(255,124,0,0.75)', color: 'black' }} onPointerDown={press('handbrake', true)} onPointerUp={press('handbrake', false)} onPointerLeave={press('handbrake', false)}>SLIDE</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end">
            <div className="bg-black/35 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg">
              <Speedometer speed={hud.speed} gear={hud.gear} rpm={hud.rpm} />
            </div>
            <div className="font-mono text-[9px] md:text-[10px] tracking-[.1em] text-white/50 leading-[1.9] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              W GAS · A/D STEER · S BRAKE/REV · SPACE SLIDE · TAB CIRCUITS · R RESTART · M SOUND
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── Countdown ── */}
      {(hud.phase === 'countdown') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            key={countLabel}
            className="font-mono font-bold text-white text-[84px] md:text-[120px] drop-shadow-[0_4px_30px_rgba(0,0,0,0.7)]"
            style={{ color: countLabel === 'GO' ? '#3bff8f' : 'white', animation: 'countPop .5s ease-out' }}
          >
            {countLabel}
          </div>
        </div>
      )}

      {/* ── Start card ── */}
      {circuit && hud.phase === 'ready' && !picker && (
        <div className="absolute inset-0 flex items-center justify-center z-20 px-4">
          <div className="text-center bg-black/55 backdrop-blur-xl border border-white/15 rounded-2xl px-8 py-7 shadow-2xl max-w-[460px] pointer-events-auto">
            <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-3">
              Playground / {isDrift ? 'Drift' : 'Race'}
            </div>
            <div className="text-white font-bold text-[clamp(26px,4vw,38px)] leading-tight mb-3" style={{ letterSpacing: '-0.035em' }}>
              Do you want to play this?
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 mb-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: isDrift ? DRIFT_PAINT : ACCENT }} />
              <span className="font-mono text-[10px] tracking-[.14em] uppercase text-white/80">{circuit.name}</span>
            </div>
            <div className="font-mono text-[11px] text-white/55 mb-5 leading-relaxed">{circuit.def.blurb}</div>
            <div className="font-mono text-[11px] tracking-[.1em] text-white/70 leading-[2]">
              {touch
                ? 'TAP ◀ ▶ TO STEER · AUTO THROTTLE'
                : 'W GAS · A/D STEER · S BRAKE · SPACE SLIDE'}<br />
              {isDrift
                ? 'CHAIN ANGLE + SPEED · CLIP THE APEXES'
                : `${circuit.laps} LAPS · ${circuit.def.grid} RIVALS · ${(circuit.lapLength / 1000).toFixed(2)} KM`}
            </div>
            <button
              onClick={startRace}
              className="mt-6 pointer-events-auto font-mono text-[12px] tracking-[.16em] uppercase font-bold border-none cursor-pointer px-8 py-3 rounded-full"
              style={{ background: isDrift ? DRIFT_PAINT : ACCENT, color: 'black' }}
            >
              {isDrift ? 'Yes, start session' : 'Yes, start race'}
            </button>
            <button
              onClick={() => setPicker(true)}
              className="mt-3 block mx-auto pointer-events-auto font-mono text-[10px] tracking-[.16em] uppercase text-white/50 hover:text-white bg-transparent border-none cursor-pointer"
            >
              Change circuit (TAB)
            </button>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {circuit && hud.phase === 'finished' && hud.finishOrder && (
        <div className="absolute inset-0 flex items-center justify-center z-20 px-4">
          <div className="bg-black/65 backdrop-blur-xl border border-white/15 rounded-2xl px-8 py-7 shadow-2xl min-w-[300px] pointer-events-auto">
            <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-1 text-center">Result</div>
            <div className="text-center font-bold text-[30px] mb-1" style={{ color: ACCENT }}>
              {ord(hud.finishOrder.findIndex((r) => r.player) + 1)}
            </div>
            <div className="text-center font-mono text-[11px] text-white/60 mb-5">
              BEST LAP {fmtLap(hud.bestLap)}
            </div>
            {hud.finishOrder.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 font-mono text-[12px] leading-[2]">
                <span className="text-white/40 w-4 text-right">{i + 1}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                <span className={r.player ? 'text-white font-bold' : 'text-white/65'}>{r.name}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-6 justify-center">
              <button
                onClick={startRace}
                className="font-mono text-[11px] tracking-[.14em] uppercase font-bold border-none cursor-pointer px-6 py-2.5 rounded-full"
                style={{ background: ACCENT, color: 'black' }}
              >
                Race again
              </button>
              <button onClick={() => setPicker(true)} className={chip}>Circuits</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Circuit picker ── */}
      {(picker || !circuit) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 pointer-events-auto"
          onClick={() => circuit && setPicker(false)}>
          <div className="w-full max-w-[720px]" onClick={(e) => e.stopPropagation()}>
            {!circuit && (
              <div className="flex justify-center gap-2 mb-5">
                <Link to="/" className={chip}>← SITE</Link>
                <Link to="/playground" className={chip}>PLAYGROUND</Link>
              </div>
            )}
            <div className="font-mono text-[10px] tracking-[.3em] text-white/50 uppercase mb-4 text-center">
              {circuit ? 'Choose a circuit' : 'Playground / Race — pick a circuit to load'}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CIRCUITS.map((c) => {
                const active = c.id === circuit?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => chooseCircuit(c.id)}
                    className="text-left cursor-pointer rounded-2xl px-5 py-4 border transition-colors"
                    style={{
                      background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                      borderColor: active ? (c.kind === 'drift' ? DRIFT_PAINT : ACCENT) : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-white font-bold text-[15px]">{c.name}</span>
                      <span className="font-mono text-[9px] tracking-[.16em] uppercase px-2 py-1 rounded-full"
                        style={{ background: c.kind === 'drift' ? DRIFT_PAINT : ACCENT, color: 'black' }}>
                        {c.kind}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-white/55 leading-relaxed">{c.blurb}</div>
                    <div className="font-mono text-[9px] tracking-[.14em] uppercase text-white/35 mt-2">
                      {c.theme} · {c.kind === 'drift' ? 'free session' : `${c.laps} laps`}
                    </div>
                  </button>
                );
              })}
            </div>
            {circuit && (
              <div className="text-center mt-5">
                <button onClick={() => setPicker(false)} className={chip}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Popups ── */}
      {popup && (
        <div key={popup.id} className="absolute left-1/2 top-[30%] -translate-x-1/2 pointer-events-none z-20"
          style={{ animation: 'lapPop 2s ease-out forwards' }}>
          <div className="font-bold text-2xl md:text-4xl font-mono tracking-wider text-center drop-shadow-lg"
            style={{ color: popup.best || popup.kind === 'clip' ? ACCENT : 'white' }}>
            {popup.kind === 'lap' && `${popup.best ? '★ BEST LAP ' : 'LAP '}${fmtLap(popup.t)}`}
            {popup.kind === 'clip' && `CLIP +${popup.t}`}
            {popup.kind === 'bank' && `+${popup.t.toLocaleString()}`}
          </div>
        </div>
      )}

      {/* ── Speed vignette ── */}
      {circuit && hud.speedPct > 0.45 && (
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
        @keyframes countPop {
          0%   { opacity: 0; transform: scale(1.7); }
          40%  { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
