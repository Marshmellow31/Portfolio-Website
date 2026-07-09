/* ────────────────────────────────────────────────────────────────
   Superspeedway oval — a closed NASCAR-style stadium track.
   Two long straights + two banked 180° turns, generated once as a
   fixed loop of centerline points. Left-turn (counter-clockwise)
   racing, so you only steer in the corners.
   ──────────────────────────────────────────────────────────────── */

export const SEG = 4;              // arc length between centerline points
export const TRACK_HALF = 15;      // half road width (30 units wide)
export const WALL_OFF = TRACK_HALF + 0.7;  // lateral distance of the outer wall
export const MAX_BANK = 0.30;      // ~17° banking in the turns (radians)

export const STRAIGHT = 300;       // straight length
export const RADIUS = 130;         // turn radius (centerline)

/* Deterministic hash → [0,1). Used for scenery placement. */
export function hash1(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* Build the closed loop once.
   Each point: { x, z, ang, ox, oz, bank, slope, i }
     ang   — heading of travel at this point
     ox/oz — unit vector pointing to the OUTSIDE of the oval
     bank  — banking angle (0 on straights, MAX_BANK mid-turn)
     slope — tan(bank); road height = (lateralOffset + TRACK_HALF) * slope */
export function createTrack() {
  const nS = Math.round(STRAIGHT / SEG);           // points per straight
  const nT = Math.round((Math.PI * RADIUS) / SEG); // points per 180° turn
  const dA = -Math.PI / nT;                        // left turn (CCW loop)

  // 1) heading deltas for the whole lap: straight, turn, straight, turn
  const deltas = [];
  for (let k = 0; k < nS; k++) deltas.push(0);
  for (let k = 0; k < nT; k++) deltas.push(dA);
  for (let k = 0; k < nS; k++) deltas.push(0);
  for (let k = 0; k < nT; k++) deltas.push(dA);
  const N = deltas.length;

  // 2) integrate positions with midpoint headings (closes the loop cleanly)
  const pts = [];
  let x = 0, z = 0, ang = 0;
  for (let i = 0; i < N; i++) {
    pts.push({ x, z, ang, i });
    const mid = ang + deltas[i] / 2;
    x += Math.sin(mid) * SEG;
    z += Math.cos(mid) * SEG;
    ang += deltas[i];
  }
  // distribute any tiny floating-point closure error across the lap
  const ex = pts[0].x - x, ez = pts[0].z - z;
  for (let i = 0; i < N; i++) {
    pts[i].x += ex * (i / N);
    pts[i].z += ez * (i / N);
  }

  // 3) banking — proportional to |curvature|, smoothed so it ramps in/out
  const rawBank = deltas.map((d) => (Math.abs(d) > 1e-9 ? MAX_BANK : 0));
  const HALF_WIN = 7;
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let k = -HALF_WIN; k <= HALF_WIN; k++) sum += rawBank[(i + k + N) % N];
    const bank = sum / (HALF_WIN * 2 + 1);
    const p = pts[i];
    p.bank = bank;
    p.slope = Math.tan(bank);
    // outward = left of travel for this CCW loop
    p.ox = Math.cos(p.ang);
    p.oz = -Math.sin(p.ang);
  }

  return {
    pts,
    N,
    lapLength: N * SEG,
    startIndex: Math.floor(nS / 2),   // start/finish line, mid front straight
    get(i) { return pts[((i % N) + N) % N]; },
  };
}

/* Road-surface height at lateral offset d (−TRACK_HALF..+TRACK_HALF)
   from centerline point p. Inner edge sits at y=0. */
export function surfaceY(p, d) {
  const c = Math.max(-TRACK_HALF, Math.min(TRACK_HALF, d));
  return (c + TRACK_HALF) * p.slope;
}
