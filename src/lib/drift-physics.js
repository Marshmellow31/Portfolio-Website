/* ────────────────────────────────────────────────────────────────
   F1 physics — arcade single-seater model.
   Huge acceleration, carbon brakes, downforce that adds grip with
   speed, gentle speed-sensitive steering (stable on straights),
   and an optional handbrake slide for showing off.
   ──────────────────────────────────────────────────────────────── */

export const MAX_SPEED = 92;      // ≈ 331 km/h
const ACCEL = 32;                 // peak engine acceleration (u/s²)
const BRAKE_DECEL = 52;           // carbon brakes (u/s²)
const ENGINE_BRAKE = 4.5;         // lift-off deceleration
const STEER_LOW = 2.4;            // max yaw rate at low speed (rad/s)
const STEER_HIGH = 0.95;          // max yaw rate at top speed (rad/s)
const GRIP_BASE = 6.5;            // velocity→heading alignment rate
const GRIP_DOWNFORCE = 1.1;       // extra grip fraction at max speed
const GRIP_SLIDE = 1.3;           // grip while handbrake sliding
const OFFROAD_GRIP = 0.35;        // grass multiplier
const OFFROAD_CAP = 0.4;          // grass top-speed fraction

const PI2 = Math.PI * 2;
const wrap = (a) => {
  a %= PI2;
  return a > Math.PI ? a - PI2 : a < -Math.PI ? a + PI2 : a;
};

/* Sequential-gearbox readout for the HUD. */
const GEARS = [0, 9, 18, 28, 40, 54, 68, 80];
export function gearFor(speed) {
  let g = 1;
  for (let i = GEARS.length - 1; i >= 0; i--) {
    if (speed >= GEARS[i]) { g = i + 1; break; }
  }
  return g;
}

/* Create a fresh car state at the given position + heading. */
export function createCarState(x, z, heading) {
  return {
    x, z, heading,
    vx: 0, vz: 0, speed: 0,
    steer: 0,                   // smoothed -1..1
    slip: 0,                    // unsigned radians
    slipSign: 0,                // +1 or -1
    slipDeg: 0,                 // integer degrees (HUD)
    lateralG: 0,                // for body roll
    longG: 0,                   // for pitch
    drifting: false,
    driftJustEntered: false,    // true for exactly 1 physics step
    onRoad: true,
    wheelSpin: 0,               // cumulative angle for wheel animation
    rpm: 0,                     // 0..1 within current gear, for exhaust FX
  };
}

/* Advance the car one physics step. Mutates `s` in place. */
export function stepCar(s, input, dt, onRoad) {
  dt = Math.min(dt, 0.04);
  const wasDrift = s.drifting;
  s.driftJustEntered = false;
  s.onRoad = onRoad;

  const spdN = Math.min(1, s.speed / MAX_SPEED);

  /* ── Steering — direct yaw-rate control, softer at speed ── */
  const raw = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  s.steer += (raw - s.steer) * Math.min(1, dt * 9);
  const yawRate = STEER_LOW + (STEER_HIGH - STEER_LOW) * spdN;
  s.heading += yawRate * s.steer * Math.min(1, s.speed / 5) * dt;

  const fx = Math.sin(s.heading), fz = Math.cos(s.heading);

  /* ── Throttle / brakes ── */
  const cap = onRoad ? MAX_SPEED : MAX_SPEED * OFFROAD_CAP;
  if (input.throttle && !input.brake) {
    // power tapers near top speed
    const power = ACCEL * (1 - spdN * spdN * 0.75) * (onRoad ? 1 : 0.3);
    s.vx += fx * power * dt;
    s.vz += fz * power * dt;
  } else if (!input.brake && s.speed > 0.5) {
    const eb = Math.min(s.speed, ENGINE_BRAKE * dt);
    s.vx -= (s.vx / s.speed) * eb;
    s.vz -= (s.vz / s.speed) * eb;
  }
  if (input.brake && s.speed > 0.5) {
    const bd = Math.min(s.speed, BRAKE_DECEL * dt);
    s.vx -= (s.vx / s.speed) * bd;
    s.vz -= (s.vz / s.speed) * bd;
  }

  /* ── Speed cap ── */
  s.speed = Math.hypot(s.vx, s.vz);
  if (s.speed > cap) {
    const sc = 1 - Math.min(1, dt * 3) * (1 - cap / s.speed);
    s.vx *= sc; s.vz *= sc; s.speed = Math.hypot(s.vx, s.vz);
  }

  /* ── Slip angle ── */
  const va = Math.atan2(s.vx, s.vz);
  const slipSigned = s.speed > 2 ? wrap(va - s.heading) : 0;
  s.slip = Math.abs(slipSigned);
  s.slipSign = Math.sign(slipSigned);
  s.slipDeg = Math.round(s.slip * 57.2958);

  /* ── Grip — pull velocity toward heading. Downforce adds grip
     with speed, so the car is planted flat-out. ── */
  let gripRate = GRIP_BASE * (1 + GRIP_DOWNFORCE * spdN);
  if (input.handbrake) gripRate = GRIP_SLIDE;
  if (!onRoad) gripRate *= OFFROAD_GRIP;
  const ax = fx * s.speed, az = fz * s.speed;
  const k = Math.min(1, gripRate * dt);
  s.vx += (ax - s.vx) * k;
  s.vz += (az - s.vz) * k;

  /* ── Integrate ── */
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  /* ── Derived values ── */
  s.speed = Math.hypot(s.vx, s.vz);
  s.wheelSpin += s.speed * dt * 2.9;
  const rx = -fz, rz = fx;
  s.lateralG = s.speed > 1 ? (s.vx * rx + s.vz * rz) * 0.05 : 0;
  s.longG = input.brake ? -1.4 : input.throttle ? 0.6 : -0.1;

  // rpm 0..1 within the current gear band (for exhaust/shift FX)
  const g = gearFor(s.speed) - 1;
  const lo = GEARS[g], hi = GEARS[g + 1] ?? MAX_SPEED;
  s.rpm = Math.min(1, Math.max(0, (s.speed - lo) / Math.max(1, hi - lo)));

  /* ── Slide state (smoke + skids) ── */
  const now = (s.slip > 0.12 && s.speed > 8) || (input.brake && s.speed > 30);
  s.drifting = now;
  if (now && !wasDrift) s.driftJustEntered = true;

  return s;
}
