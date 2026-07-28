/* ────────────────────────────────────────────────────────────────
   RACE AI — rivals that actually drive the circuit.

   Instead of rolling around at a fixed speed, each rival follows a
   pre-computed racing line and speed profile derived from the track's
   own curvature: brake to a corner's grip-limited entry speed, hit the
   apex, feed the power back in on exit. On top of that sits per-driver
   personality (pace, aggression, consistency), traffic awareness and
   overtaking, so the field shuffles instead of parading.
   ──────────────────────────────────────────────────────────────── */

import { wrapAngle, surfaceY } from './circuits.js';

/* Grip budget used to derive corner speeds (units/s²). */
const A_LAT = 26;
const A_BRAKE = 34;
const A_ACCEL = 17;

/* ── One-time per-circuit reference: racing line + speed profile ── */
export function raceReference(circuit) {
  if (circuit._ref) return circuit._ref;
  const { pts, N, step } = circuit;
  const at = (i) => pts[((i % N) + N) % N];

  /* Racing line: aim for the inside at the apex, drift out on entry
     and exit. Built by looking at curvature a little ahead and behind
     and then heavily smoothing, which naturally produces out-in-out. */
  let line = new Array(N);
  for (let i = 0; i < N; i++) {
    let c = 0;
    for (let k = -12; k <= 12; k++) c += at(i + k).curv;
    c /= 25;
    const grip = Math.min(1, Math.abs(c) * 260);
    line[i] = -Math.sign(c || 0) * at(i).half * 0.62 * grip;
  }
  for (let pass = 0; pass < 22; pass++) {
    const next = new Array(N);
    for (let i = 0; i < N; i++) next[i] = (line[(i - 1 + N) % N] + 2 * line[i] + line[(i + 1) % N]) / 4;
    line = next;
  }

  /* Curvature of the driven line, not of the centreline — a wide
     entry genuinely straightens the corner and allows more speed. */
  const lineCurv = new Array(N);
  for (let i = 0; i < N; i++) {
    const d2 = (line[(i + 1) % N] - 2 * line[i] + line[(i - 1 + N) % N]) / (step * step);
    lineCurv[i] = at(i).curv - d2;
  }

  /* Speed profile: grip limit, then a backward pass for braking
     distance and a forward pass for how fast you can actually pick
     the throttle back up. Two laps of relaxation to converge. */
  const v = new Array(N);
  for (let i = 0; i < N; i++) {
    const c = Math.abs(lineCurv[i]);
    // banking adds usable lateral grip in the turns
    const grip = A_LAT * (1 + Math.tan(at(i).bank) * 1.6);
    v[i] = c < 1e-5 ? Infinity : Math.sqrt(grip / c);
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = N - 1; i >= 0; i--) {
      const nxt = v[(i + 1) % N];
      v[i] = Math.min(v[i], Math.sqrt(nxt * nxt + 2 * A_BRAKE * step));
    }
    for (let i = 0; i < N; i++) {
      const prv = v[(i - 1 + N) % N];
      v[i] = Math.min(v[i], Math.sqrt(prv * prv + 2 * A_ACCEL * step));
    }
  }

  circuit._ref = { line, speed: v, lineCurv };
  return circuit._ref;
}

const NAMES = ['VRT', 'KAI', 'ODE', 'RIX', 'NOV', 'ZEN', 'AMU', 'LYN', 'TAO', 'BRK'];
const COLORS = [
  ['#2f6fd6', '#f5d90a'], ['#d63b2f', '#ffffff'], ['#3bb54a', '#111116'],
  ['#e0c22f', '#d63b2f'], ['#9b59b6', '#2f6fd6'], ['#e8eaed', '#d63b2f'],
  ['#ff7c00', '#111116'], ['#00b8d4', '#ffffff'], ['#ff2e63', '#111116'],
  ['#6f7b8c', '#e8eaed'],
];

/* Build the rival field. Grid slots run backwards from the line,
   staggered left/right like a real standing start. */
export function createField(circuit, count, topSpeed) {
  const ref = raceReference(circuit);
  const startS = circuit.startIndex * circuit.step;
  return Array.from({ length: count }, (_, i) => {
    const row = i + 1;                            // player starts on pole slot 0
    const [color, helmet] = COLORS[i % COLORS.length];
    return {
      id: i,
      name: NAMES[i % NAMES.length],
      color, helmet,
      // grid slot: 9 units of stagger per row, alternating sides
      s: startS - 12 - row * 9,
      lat: (row % 2 ? 1 : -1) * 3.6,
      v: 0,
      // everyone starts behind the line, so the grid-to-line crossing takes
      // them from -1 to 0 — lap 0 means "on lap 1". The player uses the same
      // convention, otherwise the field would score a full lap on the rivals.
      lap: -1,
      lastS: startS - 12 - row * 9,
      // personality
      pace: 0.955 + (i % 5) * 0.012,              // fraction of the reference speed
      aggression: 0.35 + ((i * 7) % 10) / 14,
      wobble: 0.5 + ((i * 3) % 7) / 8,
      phase: i * 1.7,
      top: topSpeed * (0.93 + (i % 4) * 0.022),
      // render state
      x: 0, y: 0, z: 0, ang: 0, roll: 0, pitch: 0, wheelSpin: 0, steer: 0,
      braking: false, drifting: false, slip: 0,
      finished: false, finishTime: 0,
      _ref: ref,
    };
  });
}

/* Advance one rival. `field` includes every other car on track plus a
   pseudo-entry for the player so they get raced, not driven through. */
export function stepRival(ai, circuit, dt, traffic, t) {
  const { N, step, lapLength } = circuit;
  const ref = ai._ref;
  const idx = Math.floor((((ai.s % lapLength) + lapLength) % lapLength) / step);
  const at = (o) => (idx + o + N * 2) % N;

  /* ── target speed: the tightest reference point in the braking zone ── */
  const look = Math.max(6, Math.round((ai.v * ai.v) / (2 * A_BRAKE) / step) + 4);
  let target = ref.speed[idx];
  for (let k = 1; k <= look; k++) {
    const j = at(k);
    // speed we must already be at now to still make point j
    const need = Math.sqrt(Math.max(0, ref.speed[j] ** 2 + 2 * A_BRAKE * k * step));
    if (need < target) target = need;
  }
  target = Math.min(target * ai.pace, ai.top);
  // a slow breathing variation so the field never runs metronomically
  target *= 1 + Math.sin(t * 0.31 + ai.phase) * 0.012;

  /* ── target line, plus a personal drift off the ideal ── */
  let lat = ref.line[idx] + Math.sin(t * 0.23 * ai.wobble + ai.phase) * 1.2;

  /* ── traffic: slow for a car ahead, pull out to pass ── */
  let blocked = 0, dodge = 0;
  for (const o of traffic) {
    if (o === ai) continue;
    let gap = o.s - ai.s;
    if (gap < -lapLength / 2) gap += lapLength;
    if (gap > lapLength / 2) gap -= lapLength;
    if (gap < -6 || gap > 46) continue;
    const dLat = o.lat - ai.lat;
    if (gap > 0 && Math.abs(dLat) < 4.2) {
      // directly behind: match pace until there's room, then commit
      const close = 1 - gap / 46;
      blocked = Math.max(blocked, close * (1 - ai.aggression * 0.55));
      const room = circuit.get(idx).half - 3.5;
      const side = o.lat > 0 ? -1 : 1;
      dodge += side * Math.min(room, 6.5) * close * (0.4 + ai.aggression);
    } else if (Math.abs(gap) < 7 && Math.abs(dLat) < 4.6) {
      // side by side: leave racing room
      dodge += (dLat > 0 ? -1 : 1) * 3.4;
    }
  }
  lat += dodge;
  const half = circuit.get(idx).half;
  lat = Math.max(-half + 1.6, Math.min(half - 1.6, lat));
  if (blocked > 0) target *= 1 - blocked * 0.42;

  /* ── longitudinal response ── */
  const dv = target - ai.v;
  const rate = dv > 0
    ? A_ACCEL * (1 - Math.min(0.75, (ai.v / ai.top) ** 2 * 0.75))
    : A_BRAKE * 1.15;
  ai.braking = dv < -1.5;
  ai.v += Math.max(-rate * dt, Math.min(rate * dt, dv));
  ai.v = Math.max(2, Math.min(ai.top, ai.v));

  /* ── move along the lap, tracking lap crossings ── */
  const prevS = ai.s;
  ai.s = (ai.s + ai.v * dt) % lapLength;
  const startS = circuit.startIndex * step;
  if (prevS < startS && (ai.s >= startS || ai.s < prevS)) ai.lap++;
  else if (prevS > ai.s && startS <= ai.s) ai.lap++;

  // lateral easing — cars can't teleport across the road
  const latRate = 7 * dt;
  ai.lat += Math.max(-latRate, Math.min(latRate, lat - ai.lat));

  /* ── world transform ── */
  const f = circuit.frameAt(ai.s);
  ai.x = f.x + f.nx * ai.lat;
  ai.z = f.z + f.nz * ai.lat;
  ai.y = surfaceY(f, ai.lat);
  // heading includes the lateral drift so the car points where it goes
  const latRateWorld = (lat - ai.lat) * 0.06;
  ai.ang = f.ang + Math.atan2(latRateWorld, 1) * 0.35;
  ai.roll = Math.atan(f.tilt) * (f.tilt ? 1 : 0);
  ai.pitch = -Math.atan(f.grade);
  ai.steer = Math.max(-1, Math.min(1, f.curv * 260));
  ai.wheelSpin += ai.v * dt * 2.9;
  ai.slip = Math.min(0.5, Math.abs(f.curv) * ai.v * 0.22);
  ai.drifting = ai.slip > 0.14 && ai.v > 12;
  return ai;
}

/* ── Standings ──────────────────────────────────────────────────
   Sorts everyone (player + rivals) by race distance covered.       */
export function standings(circuit, player, field) {
  const dist = (e) => e.lap * circuit.lapLength + e.s;
  const rows = [
    { id: 'you', name: 'YOU', color: '#FF7C00', player: true, lap: player.lap, s: player.s, d: dist(player) },
    ...field.map((a) => ({ id: a.id, name: a.name, color: a.color, player: false, lap: a.lap, s: a.s, d: dist(a) })),
  ];
  rows.sort((a, b) => b.d - a.d);
  rows.forEach((r, i) => { r.pos = i + 1; });
  return rows;
}

export { wrapAngle };
