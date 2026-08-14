/* ────────────────────────────────────────────────────────────────
   CIRCUITS — data-driven track generation.

   A circuit is authored as a short list of control points and turned
   into a dense, arc-length-parameterised centreline with heading,
   curvature, banking, gradient and per-point width. Everything the
   game needs (rendering, physics, AI, minimap, scenery placement)
   reads from that one array, so adding a new layout is just adding a
   new entry to CIRCUITS.

   Control points are authored in POLAR form — [angleDeg, radius, y].
   A loop whose radius varies but whose angle strictly increases can
   never self-intersect, which makes hand-authoring interesting
   layouts safe: tightening the radius quickly makes a hairpin,
   holding it wide makes a fast sweeper.
   ──────────────────────────────────────────────────────────────── */

import * as THREE from 'three';

// One-metre samples keep the rendered triangles close enough to the same
// continuous surface used by vehicle contact. The old four-metre ribbon could
// visibly cut across a wheelbase on Ridge's short crest near the starting grid.
export const SEG = 1;
export const CURB = 1.5;            // curb width outside the white line
export const RUNOFF = 9;            // grass/asphalt runoff before the barrier

const DEG = Math.PI / 180;

export const wrapAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

/* Deterministic hash → [0,1). Scenery placement, crowd colours, etc. */
export function hash1(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ── Control-point helpers ─────────────────────────────────────── */

/* Polar spec → world points. */
function polarPoints(spec) {
  return spec.map(([deg, r, y = 0]) => new THREE.Vector3(
    Math.cos(deg * DEG) * r, y, Math.sin(deg * DEG) * r,
  ));
}

/* ── Circuit builder ───────────────────────────────────────────── */

function smoothLoop(arr, half) {
  const n = arr.length, out = new Array(n);
  const w = half * 2 + 1;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = -half; k <= half; k++) s += arr[(i + k + n) % n];
    out[i] = s / w;
  }
  return out;
}

/*  Build the full centreline for a circuit definition.

    Each point p:
      x, y, z    world position of the centreline
      s          distance along the lap
      ang        heading of travel (atan2(dx, dz))
      nx, nz     unit LEFT-of-travel vector (lateral offsets are +left)
      curv       signed curvature (rad/unit, + = turning left)
      grade      dy/ds
      bank       banking angle (rad)
      tilt       dSurfaceY/dLateral — outside of the corner sits higher
      half       half road width at this point
      curb       0..1 curb prominence (rides up in corners)                  */
export function buildCircuit(def) {
  const ctrl = def.points ? def.points() : polarPoints(def.polar);
  const curve = new THREE.CatmullRomCurve3(ctrl, true, 'catmullrom', 0.5);
  const lapLength = curve.getLength();
  const N = Math.max(96, Math.round(lapLength / SEG));
  const step = lapLength / N;
  const raw = curve.getSpacedPoints(N);   // N+1 points, last == first

  const pts = [];
  for (let i = 0; i < N; i++) {
    const v = raw[i];
    pts.push({ i, x: v.x, y: v.y, z: v.z, s: i * step });
  }
  const at = (i) => pts[((i % N) + N) % N];

  // headings from a central difference — smoother than forward differences
  for (let i = 0; i < N; i++) {
    const a = at(i - 1), b = at(i + 1);
    pts[i].ang = Math.atan2(b.x - a.x, b.z - a.z);
    pts[i].nx = Math.cos(pts[i].ang);
    pts[i].nz = -Math.sin(pts[i].ang);
  }

  // curvature + gradient, both smoothed (raw values are noisy at 4u spacing)
  const rawCurv = pts.map((_, i) => wrapAngle(at(i + 1).ang - at(i - 1).ang) / (2 * step));
  const rawGrade = pts.map((_, i) => (at(i + 1).y - at(i - 1).y) / (2 * step));
  const curv = smoothLoop(smoothLoop(rawCurv, 4), 4);
  const grade = smoothLoop(rawGrade, 3);

  const maxBank = (def.maxBank ?? 8) * DEG;
  const bankK = def.bankK ?? 900;          // curvature → banking gain
  const rawBank = curv.map((c) => Math.min(maxBank, Math.abs(c) * bankK * DEG));
  const bank = smoothLoop(rawBank, 6);

  const baseHalf = def.width / 2;
  const rawCurb = curv.map((c) => Math.min(1, Math.abs(c) * 260));
  const curb = smoothLoop(rawCurb, 3);

  for (let i = 0; i < N; i++) {
    const p = pts[i];
    p.curv = curv[i];
    p.grade = grade[i];
    p.bank = bank[i];
    // outside of the corner is higher: for a left turn (curv > 0) the
    // outside is the RIGHT side, i.e. negative lateral offset.
    p.tilt = -Math.sign(curv[i] || 0) * Math.tan(bank[i]);
    // corners open out a little — gives the track a hand-built feel
    p.half = baseHalf * (1 + (def.widen ?? 0.12) * Math.min(1, Math.abs(curv[i]) * 180));
    p.curb = curb[i];
  }

  const startIndex = Math.floor((def.startAt ?? 0) * N) % N;

  /* Apex list — local curvature maxima, used for drift clipping points,
     AI braking references and marshal-post/scenery placement. */
  const apexes = [];
  for (let i = 0; i < N; i++) {
    const c = Math.abs(pts[i].curv);
    if (c < 0.004) continue;
    let peak = true;
    for (let k = -10; k <= 10; k++) {
      if (Math.abs(at(i + k).curv) > c) { peak = false; break; }
    }
    if (peak && (!apexes.length || (i - apexes[apexes.length - 1].i) > 14)) {
      apexes.push({ i, side: Math.sign(pts[i].curv), tight: Math.min(1, c * 220) });
    }
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }

  return {
    def,
    id: def.id,
    name: def.name,
    kind: def.kind,
    theme: def.theme,
    laps: def.laps ?? 3,
    pts, N, step, lapLength, startIndex, apexes,
    bounds: {
      minX, maxX, minZ, maxZ, minY, maxY,
      cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2,
      // the flat terrain plane sits below the lowest point of the circuit; the
      // skirt ribbon bridges the gap so an elevated track never clips through it
      groundY: minY - 2,
    },
    get: at,
    /* Interpolated frame at an arbitrary lap distance. */
    frameAt(s) {
      const f = ((s % lapLength) + lapLength) % lapLength / step;
      const i = Math.floor(f), t = f - i;
      const a = at(i), b = at(i + 1);
      const lp = (u, v) => u + (v - u) * t;
      const nx = lp(a.nx, b.nx), nz = lp(a.nz, b.nz);
      const l = Math.hypot(nx, nz) || 1;
      return {
        x: lp(a.x, b.x), y: lp(a.y, b.y), z: lp(a.z, b.z),
        nx: nx / l, nz: nz / l,
        ang: a.ang + wrapAngle(b.ang - a.ang) * t,
        curv: lp(a.curv, b.curv), grade: lp(a.grade, b.grade),
        tilt: lp(a.tilt, b.tilt), half: lp(a.half, b.half), bank: lp(a.bank, b.bank),
        curb: lp(a.curb, b.curb),
      };
    },
  };
}

/* Surface height at lateral offset d from a centreline frame.

   This MUST agree with how the road ribbon is built, or the car floats
   above the tarmac or sinks into it. The mesh clamps the banking term at
   the road edge and then steps up onto the curb, so this does too. */
export function surfaceY(p, d) {
  const c = Math.max(-p.half, Math.min(p.half, d));
  let y = p.y + p.tilt * c;
  const over = Math.abs(d) - p.half;
  if (over > 0) y += Math.min(1, over / CURB) * (0.02 + 0.07 * (p.curb || 0));
  return y;
}

/* ════════════════════════════════════════════════════════════════
   THEMES — each circuit picks a mood; drives sky, sun, fog, ground.
   ════════════════════════════════════════════════════════════════ */
export const THEMES = {
  noon: {
    skyTop: '#2f6fce', skyBot: '#b9dcf7', horizon: '#e6f2fb',
    fog: '#cbe2f4', fogNear: 220, fogFar: 1000,
    sun: '#fff6e6', sunI: 2.9, sunPos: [-0.35, 0.72, -0.42], sunSize: 1,
    cloud: 0.85, cloudLit: '#ffffff', cloudDark: '#9fb4c9', cloudHeight: 0.30,
    amb: '#a8c9ea', ambI: 0.5, hemiSky: '#cfe8ff', hemiGround: '#4a6b3a', hemiI: 0.75,
    ground: '#4d7c42', ground2: '#3f6837', tarmac: 0.26,
    night: false, exposure: 1.0, lampGlow: 0,
  },
  sunset: {
    skyTop: '#1b2a72', skyBot: '#ff9d55', horizon: '#ffd39a',
    fog: '#e59a68', fogNear: 180, fogFar: 900,
    sun: '#ffb066', sunI: 3.1, sunPos: [0.75, 0.20, 0.4], sunSize: 2.2,
    cloud: 0.6, cloudLit: '#ffd0a0', cloudDark: '#7a5a72', cloudHeight: 0.24,
    amb: '#7d6b96', ambI: 0.48, hemiSky: '#ffc79a', hemiGround: '#3a2f2a', hemiI: 0.62,
    ground: '#6a6440', ground2: '#55502f', tarmac: 0.24,
    night: false, exposure: 1.05, lampGlow: 0,
  },
  night: {
    skyTop: '#050914', skyBot: '#1a2540', horizon: '#2c3f66',
    fog: '#141d33', fogNear: 120, fogFar: 620,
    sun: '#b6cbf5', sunI: 1.25, sunPos: [-0.4, 0.75, 0.35], sunSize: 1.6,
    cloud: 0.3, cloudLit: '#3d4d70', cloudDark: '#121a2c', cloudHeight: 0.26,
    amb: '#44598c', ambI: 0.85, hemiSky: '#5476b4', hemiGround: '#1b2230', hemiI: 0.9,
    ground: '#2a3547', ground2: '#212b3a', tarmac: 0.26,
    night: true, exposure: 1.15, lampGlow: 0.5,
  },
  dusk: {
    skyTop: '#14264a', skyBot: '#6d7fae', horizon: '#a8b6d8',
    fog: '#4b5c86', fogNear: 150, fogFar: 720,
    sun: '#cdd8ff', sunI: 1.35, sunPos: [0.5, 0.42, -0.5], sunSize: 1.8,
    cloud: 0.45, cloudLit: '#b9c4e2', cloudDark: '#414f74', cloudHeight: 0.26,
    amb: '#55658f', ambI: 0.8, hemiSky: '#8298cc', hemiGround: '#242a35', hemiI: 0.85,
    ground: '#37423a', ground2: '#2d3831', tarmac: 0.22,
    night: true, exposure: 1.1, lampGlow: 0.35,
  },
};

/* ════════════════════════════════════════════════════════════════
   CIRCUIT LIBRARY
   ════════════════════════════════════════════════════════════════ */

export const CIRCUITS = [
  {
    id: 'ridge',
    name: 'Ridge Grand Prix',
    blurb: 'Hillside road course · elevation, esses, two hairpins',
    kind: 'race',
    theme: 'noon',
    car: 'f1',
    width: 24,
    maxBank: 6,
    bankK: 700,
    aiGrip: 1.22,
    aiAccel: 1.2,
    aiPace: 1.06,
    aiTop: 1.04,
    laps: 3,
    grid: 7,
    startAt: 0.0,
    scenery: { stands: true, towers: false, trees: 130, hills: true, city: false },
    polar: [
      [0, 440, 0], [12, 448, 2], [24, 440, 5], [36, 402, 9],
      [48, 302, 12], [58, 212, 13], [68, 172, 12], [80, 202, 10],
      [94, 282, 8], [108, 350, 6], [120, 382, 4], [134, 330, 3],
      [146, 384, 4], [158, 322, 5], [170, 362, 7], [184, 300, 9],
      [198, 202, 10], [210, 162, 8], [224, 212, 5], [238, 300, 2],
      [252, 380, 0], [266, 420, -2], [280, 432, -3], [294, 380, -2],
      [308, 302, 0], [320, 242, 2], [332, 302, 3], [344, 402, 1],
    ],
  },
  {
    id: 'complex',
    name: 'Harbour Drift Complex',
    blurb: 'Flat technical loop · clipping points · combo chains',
    kind: 'drift',
    theme: 'dusk',
    car: 'coupe',
    width: 26,
    maxBank: 0,
    bankK: 0,
    widen: 0.2,
    laps: 99,
    grid: 3,
    startAt: 0.0,
    scenery: { stands: false, towers: false, trees: 22, city: false, containers: true, lamps: true },
    polar: [
      [0, 170, 0], [18, 178, 0], [36, 132, 0], [54, 96, 0],
      [72, 118, 0], [92, 168, 0], [112, 150, 0], [130, 92, 0],
      [148, 84, 0], [168, 128, 0], [188, 172, 0], [206, 140, 0],
      [224, 88, 0], [242, 96, 0], [260, 148, 0], [278, 176, 0],
      [296, 148, 0], [314, 94, 0], [332, 104, 0], [350, 152, 0],
    ],
  },
];

export const circuitById = (id) => CIRCUITS.find((c) => c.id === id) || CIRCUITS[0];
