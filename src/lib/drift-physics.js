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
const REVERSE_MAX = 16;           // ≈ 58 km/h backwards
const REVERSE_ACCEL = 14;         // reverse-gear thrust (u/s²)

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
    yawRate: 0,                 // rad/s — own state in the drift model
    steer: 0,                   // smoothed -1..1
    slip: 0,                    // unsigned radians
    slipSign: 0,                // +1 or -1
    slipDeg: 0,                 // integer degrees (HUD)
    lateralG: 0,                // for body roll
    longG: 0,                   // for pitch
    drifting: false,
    reverse: false,             // true while backing up (HUD shows R)
    driftJustEntered: false,    // true for exactly 1 physics step
    onRoad: true,
    wheelSpin: 0,               // cumulative angle for wheel animation
    rpm: 0,                     // 0..1 within current gear, for exhaust FX
  };
}

/* Advance the car one physics step. Mutates `s` in place.
   `tune` optionally scales the handling for other car types:
   { top, accel, grip, steer, slide } — all multipliers, default 1. */
export function stepCar(s, input, dt, onRoad, tune) {
  dt = Math.min(dt, 0.04);
  const T = tune || {};
  const wasDrift = s.drifting;
  s.driftJustEntered = false;
  s.onRoad = onRoad;

  const topSpeed = MAX_SPEED * (T.top || 1);
  const spdN = Math.min(1, s.speed / topSpeed);

  /* ── Direction of travel: +1 forward, −1 reversing ── */
  const pfx = Math.sin(s.heading), pfz = Math.cos(s.heading);
  const fwd = s.vx * pfx + s.vz * pfz;   // signed forward speed
  const dir = fwd < -0.5 ? -1 : 1;
  s.reverse = dir < 0;

  /* ── Steering — direct yaw-rate control, softer at speed.
     Flipped while reversing so backing up steers like a real car. ── */
  const raw = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  s.steer += (raw - s.steer) * Math.min(1, dt * 9);
  const yawRate = (STEER_LOW + (STEER_HIGH - STEER_LOW) * spdN) * (T.steer || 1);
  s.heading += yawRate * s.steer * dir * Math.min(1, s.speed / 5) * dt;

  const fx = Math.sin(s.heading), fz = Math.cos(s.heading);

  /* ── Throttle / brakes ── */
  const cap = onRoad ? topSpeed : topSpeed * OFFROAD_CAP;
  if (input.throttle && !input.brake) {
    // power tapers near top speed
    const power = ACCEL * (T.accel || 1) * (1 - spdN * spdN * 0.75) * (onRoad ? 1 : 0.3);
    s.vx += fx * power * dt;
    s.vz += fz * power * dt;
  } else if (!input.brake && s.speed > 0.5) {
    const eb = Math.min(s.speed, ENGINE_BRAKE * dt);
    s.vx -= (s.vx / s.speed) * eb;
    s.vz -= (s.vz / s.speed) * eb;
  }
  if (input.brake) {
    if (fwd > 0.5 || (s.speed > 2 && dir > 0)) {
      // rolling forward → carbon brakes
      const bd = Math.min(s.speed, BRAKE_DECEL * dt);
      s.vx -= (s.vx / s.speed) * bd;
      s.vz -= (s.vz / s.speed) * bd;
    } else if (-fwd < REVERSE_MAX * (onRoad ? 1 : OFFROAD_CAP)) {
      // at (near) standstill → reverse gear
      s.vx -= fx * REVERSE_ACCEL * dt;
      s.vz -= fz * REVERSE_ACCEL * dt;
    }
  }

  /* ── Speed cap ── */
  s.speed = Math.hypot(s.vx, s.vz);
  if (s.speed > cap) {
    const sc = 1 - Math.min(1, dt * 3) * (1 - cap / s.speed);
    s.vx *= sc; s.vz *= sc; s.speed = Math.hypot(s.vx, s.vz);
  }

  /* ── Slip angle ── */
  const va = Math.atan2(s.vx, s.vz);
  const slipSigned = s.speed > 2 ? wrap(va - s.heading + (dir < 0 ? Math.PI : 0)) : 0;
  s.slip = Math.abs(slipSigned);
  s.slipSign = Math.sign(slipSigned);
  s.slipDeg = Math.round(s.slip * 57.2958);

  /* ── Grip — pull velocity toward heading. Downforce adds grip
     with speed, so the car is planted flat-out. ── */
  let gripRate = GRIP_BASE * (T.grip || 1) * (1 + GRIP_DOWNFORCE * spdN);
  if (input.handbrake) gripRate = GRIP_SLIDE * (T.slide || 1);
  if (!onRoad) gripRate *= OFFROAD_GRIP;
  const ax = fx * s.speed * dir, az = fz * s.speed * dir;
  const k = Math.min(1, gripRate * dt);
  s.vx += (ax - s.vx) * k;
  s.vz += (az - s.vz) * k;

  /* ── Integrate ── */
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  /* ── Derived values ── */
  s.speed = Math.hypot(s.vx, s.vz);
  s.wheelSpin += s.speed * dt * 2.9 * dir;
  const rx = -fz, rz = fx;
  s.lateralG = s.speed > 1 ? (s.vx * rx + s.vz * rz) * 0.05 : 0;
  s.longG = input.brake ? (s.reverse ? 0.4 : -1.4) : input.throttle ? 0.6 : -0.1;

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

/* ────────────────────────────────────────────────────────────────
   Drift coupe — momentum / oversteer model with counter-steering.
   Unlike the F1 arcade model (velocity pulled toward heading), this
   integrates yaw from saturating front/rear tyre forces. Provoke
   the rear (handbrake, power-over, a sharp flick) and it steps out
   and KEEPS rotating; you catch it by steering into the slide.
   ──────────────────────────────────────────────────────────────── */
const DC = {
  TOP: 42, ACCEL: 24, BRAKE: 34, EBRAKE: 4,
  STEER: 0.62,               // max front wheel angle (rad)
  STIFF_F: 62, STIFF_R: 84,  // cornering stiffness (accel per rad of slip)
  GRIP_F: 30, GRIP_R: 27,    // tyre force saturation (u/s²)
  A: 1.15, B: 1.2,           // CG → front/rear axle distance
  REV_MAX: 10, REV_ACCEL: 10,
};

export function stepDriftCar(s, input, dt, onRoad) {
  dt = Math.min(dt, 0.04);
  const wasDrift = s.drifting;
  s.driftJustEntered = false;
  s.onRoad = onRoad;
  if (s.yawRate === undefined) s.yawRate = 0;

  // fast steering response — catching a slide needs quick counter-steer
  const raw = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  s.steer += (raw - s.steer) * Math.min(1, dt * 14);
  const delta = s.steer * DC.STEER;

  const fx = Math.sin(s.heading), fz = Math.cos(s.heading);
  const lx = Math.cos(s.heading), lz = -Math.sin(s.heading);   // left axis
  const vF = s.vx * fx + s.vz * fz;                            // forward speed (signed)
  const vL = s.vx * lx + s.vz * lz;                            // lateral speed (left +)
  s.reverse = vF < -0.3;

  /* ── longitudinal ── */
  const top = onRoad ? DC.TOP : DC.TOP * 0.5;
  let aLong = 0;
  if (input.throttle && !input.brake) {
    aLong = DC.ACCEL * Math.max(0, 1 - (Math.max(0, vF) / top) ** 2) * (onRoad ? 1 : 0.4);
  } else if (!input.brake && Math.abs(vF) > 0.5) {
    aLong = -Math.sign(vF) * DC.EBRAKE;
  }
  if (input.brake) {
    if (vF > 0.5) aLong = -DC.BRAKE;
    else if (vF > -DC.REV_MAX) aLong = -DC.REV_ACCEL;          // reverse gear
  }

  /* ── tyre slip angles + saturating lateral forces ── */
  const spd = Math.max(1, Math.abs(vF));
  const dirF = vF >= 0 ? 1 : -1;
  const slipF = Math.atan2(vL + s.yawRate * DC.A, spd) * dirF - delta;
  const slipR = Math.atan2(vL - s.yawRate * DC.B, spd) * dirF;

  let gF = DC.GRIP_F, gR = DC.GRIP_R;
  if (input.handbrake) gR *= 0.4;                              // rear breaks away
  else if (input.throttle) {
    // wheelspin under power: the more sideways you are, the less rear grip —
    // this is what lets throttle SUSTAIN a drift instead of snapping straight
    const slideAmt = Math.min(1, Math.abs(Math.atan2(vL, spd)) / 0.5);
    gR *= 0.85 - 0.45 * slideAmt;
  }
  if (!onRoad) { gF *= 0.55; gR *= 0.5; }

  const sat = (v, m) => Math.max(-m, Math.min(m, v));
  const Ff = sat(-DC.STIFF_F * slipF, gF) * dirF;
  const Fr = sat(-DC.STIFF_R * slipR, gR) * dirF;

  /* ── yaw: dynamic at speed, kinematic when slow or reversing ── */
  const blend = Math.min(1, Math.abs(vF) / 7);
  s.yawRate += ((DC.A * Ff - DC.B * Fr) / 4) * blend * dt;
  const kin = (vF / (DC.A + DC.B)) * Math.tan(delta);
  s.yawRate += (kin - s.yawRate) * (1 - blend) * Math.min(1, dt * 10);
  s.yawRate *= 1 - Math.min(0.5, dt * 0.6);                    // mild damping
  s.yawRate = Math.max(-2.6, Math.min(2.6, s.yawRate));
  s.heading += s.yawRate * dt;

  /* ── integrate ── */
  const aLat = (Ff + Fr) * blend;
  s.vx += (fx * aLong + lx * aLat) * dt;
  s.vz += (fz * aLong + lz * aLat) * dt;
  if (Math.abs(vF) < 4) {
    // bleed lateral velocity at parking speeds so the car doesn't ice-skate
    const k = Math.min(1, dt * (6 - Math.abs(vF)));
    const nvF = s.vx * fx + s.vz * fz;
    const nvL = (s.vx * lx + s.vz * lz) * (1 - k);
    s.vx = fx * nvF + lx * nvL;
    s.vz = fz * nvF + lz * nvL;
  }
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  /* ── derived values (same contract as stepCar) ── */
  s.speed = Math.hypot(s.vx, s.vz);
  const va = Math.atan2(s.vx, s.vz);
  const slipSigned = s.speed > 2 ? wrap(va - s.heading + (s.reverse ? Math.PI : 0)) : 0;
  s.slip = Math.abs(slipSigned);
  s.slipSign = Math.sign(slipSigned);
  s.slipDeg = Math.round(s.slip * 57.2958);
  s.wheelSpin += vF * dt * 2.9;
  s.lateralG = -vL * 0.05;
  s.longG = input.brake ? (s.reverse ? 0.3 : -1.0) : input.throttle ? 0.5 : -0.1;
  const g = gearFor(s.speed) - 1;
  const lo = GEARS[g], hi = GEARS[g + 1] ?? MAX_SPEED;
  s.rpm = Math.min(1, Math.max(0, (s.speed - lo) / Math.max(1, hi - lo)));

  s.drifting = s.slip > 0.15 && s.speed > 6 && !s.reverse;
  if (s.drifting && !wasDrift) s.driftJustEntered = true;
  return s;
}
