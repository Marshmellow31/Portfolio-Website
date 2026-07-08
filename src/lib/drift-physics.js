/* ────────────────────────────────────────────────────────────────
   Drift physics engine — arcade-sim hybrid.
   Manual throttle/brake, weight transfer, handbrake drift initiation,
   rear-wheel grip model with snap transitions, counter-steer assist.
   ──────────────────────────────────────────────────────────────── */

export const MAX_SPEED = 52;
const ACCEL = 28;
const BRAKE_DECEL = 2.8;
const BASE_STEER = 2.6;
const GRIP_FRONT = 1.05;
const GRIP_REAR = 0.82;
const GRIP_HB = 0.04;          // handbrake → near-zero rear grip
const WEIGHT_SHIFT = 4.0;
const DRAG = 0.32;
const COUNTER_ASSIST = 0.18;   // subtle auto-counter-steer

const PI2 = Math.PI * 2;
const wrap = (a) => {
  a %= PI2;
  return a > Math.PI ? a - PI2 : a < -Math.PI ? a + PI2 : a;
};

/* Create a fresh car state at the given position + heading. */
export function createCarState(x, z, heading) {
  return {
    x, z, heading,
    vx: 0, vz: 0, speed: 0,
    steer: 0,                   // smoothed -1..1
    slip: 0,                    // unsigned radians
    slipSign: 0,                // +1 or -1
    slipDeg: 0,                 // integer degrees (HUD)
    weightFront: 0.5,
    weightRear: 0.5,
    lateralG: 0,                // for body roll
    longG: 0,                   // for pitch
    drifting: false,
    driftJustEntered: false,    // true for exactly 1 physics step
    driftJustExited: false,
    onRoad: true,
    wheelSpin: 0,               // cumulative angle for wheel animation
  };
}

/* Advance the car one physics step.  Mutates `s` in place. */
export function stepCar(s, input, dt, onRoad) {
  dt = Math.min(dt, 0.04);
  const wasDrift = s.drifting;
  s.driftJustEntered = false;
  s.driftJustExited = false;
  s.onRoad = onRoad;

  /* ── Weight transfer ── */
  const twf = input.brake ? 0.66 : input.throttle ? 0.36 : 0.5;
  s.weightFront += (twf - s.weightFront) * Math.min(1, WEIGHT_SHIFT * dt);
  s.weightRear = 1 - s.weightFront;

  /* ── Steering ── */
  const raw = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  s.steer += (raw - s.steer) * Math.min(1, dt * 10);
  const spd = Math.min(1, s.speed / MAX_SPEED);
  const lock = BASE_STEER * (1 - spd * 0.55);  // less lock at speed
  const dm = s.drifting ? 1.45 : 1.0;           // sharper in drift
  s.heading += lock * dm * s.steer * Math.min(1, s.speed / 6) * dt;

  /* ── Forward vector ── */
  const fx = Math.sin(s.heading), fz = Math.cos(s.heading);

  /* ── Throttle / Brake ── */
  const rk = onRoad ? 1 : 0.28;
  const cap = onRoad ? MAX_SPEED : MAX_SPEED * 0.30;
  if (input.throttle && !input.brake) {
    s.vx += fx * ACCEL * rk * dt;
    s.vz += fz * ACCEL * rk * dt;
  }
  if (input.brake) {
    const bk = Math.max(0, 1 - BRAKE_DECEL * dt);
    s.vx *= bk;
    s.vz *= bk;
  }

  /* ── Speed cap ── */
  s.speed = Math.hypot(s.vx, s.vz);
  if (s.speed > cap) {
    const sc = cap / s.speed;
    s.vx *= sc; s.vz *= sc; s.speed = cap;
  }

  /* ── Slip angle ── */
  const va = Math.atan2(s.vx, s.vz);
  s.slip = s.speed > 2 ? Math.abs(wrap(va - s.heading)) : 0;
  s.slipSign = s.speed > 2 ? Math.sign(wrap(va - s.heading)) : 0;
  s.slipDeg = Math.round(s.slip * 57.2958);

  /* ── Lateral grip (the heart of the drift mechanic) ──
     Pull velocity toward heading.  Lower rear grip → velocity can't
     align → the car slides.  Handbrake kills rear grip instantly. */
  let rg = GRIP_REAR * s.weightRear * 2;
  const fg = GRIP_FRONT * s.weightFront * 2;
  if (input.handbrake) rg = GRIP_HB;
  if (!onRoad) rg *= 0.22;
  const gripRate = (fg * 0.35 + rg * 0.65) * (s.drifting ? 2.8 : 6.0);
  const ax = fx * s.speed, az = fz * s.speed;
  const k = Math.min(1, gripRate * dt);
  s.vx += (ax - s.vx) * k;
  s.vz += (az - s.vz) * k;

  /* ── Counter-steer assist ── */
  if (s.drifting && s.speed > 6) {
    s.heading += wrap(va - s.heading) * COUNTER_ASSIST * dt;
  }

  /* ── Drag + integrate ── */
  s.vx *= (1 - DRAG * dt);
  s.vz *= (1 - DRAG * dt);
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  /* ── Derived values ── */
  s.speed = Math.hypot(s.vx, s.vz);
  s.wheelSpin += s.speed * dt * 2.5;
  const rx = -fz, rz = fx;                       // right vector
  s.lateralG = s.speed > 1 ? (s.vx * rx + s.vz * rz) * 0.04 : 0;
  s.longG = input.brake ? -1 : input.throttle ? 0.5 : 0;

  /* ── Drift state machine ── */
  const now = s.slip > 0.20 && s.speed > 10 && onRoad;
  s.drifting = now;
  if (now && !wasDrift) s.driftJustEntered = true;
  if (!now && wasDrift) s.driftJustExited = true;

  return s;
}
