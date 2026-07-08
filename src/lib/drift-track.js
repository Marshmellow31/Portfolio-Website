/* ────────────────────────────────────────────────────────────────
   Infinite drift track generator.
   Enhanced with hairpins, chicanes, sweepers, straights, and
   progressive difficulty that tightens corners over distance.
   ──────────────────────────────────────────────────────────────── */

export const SEG = 4;            // arc length between centerline points
export const ROAD_HALF = 6.5;    // half road width
export const BIOME_LEN = 90;     // centerline points per biome
export const BIOMES = ['mountains', 'beach', 'river'];

export function biomeIndexAt(i) {
  return Math.floor(i / BIOME_LEN) % BIOMES.length;
}

// Fractional biome position for smooth colour blends (0..3, wraps)
export function biomeFloatAt(i) {
  return (i / BIOME_LEN) % BIOMES.length;
}

/* Deterministic hash → [0,1).  Keeps scenery stable when the visible
   window is recomputed, without per-prop state. */
export function hash1(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* Progressive difficulty: curvature amplitude rises with distance. */
function progressive(i) {
  return 1 + Math.min(i * 0.00025, 1.2);
}

/* Corner overlay — occasional hairpins, chicanes, and straights
   layered on top of the base sine curvature. */
function cornerOverlay(i, seed) {
  const seg = Math.floor(i / 18);
  const h = hash1(seg * 17 + seed * 100);
  const phase = i % 18;

  if (h < 0.15 && phase < 8) {
    // Hairpin: high curvature for ~8 points
    const sign = hash1(seg * 31) > 0.5 ? 1 : -1;
    return sign * 2.5 * Math.sin(phase / 8 * Math.PI);
  }
  if (h >= 0.15 && h < 0.28 && phase < 6) {
    // Chicane: quick left→right→left
    return 2.0 * Math.sin(phase / 3 * Math.PI);
  }
  if (h >= 0.28 && h < 0.38 && phase < 12) {
    // Straight: cancel the base sine so the road runs straight
    return -0.85 * Math.sin(i * 0.026 + seed);
  }
  return 0;
}

/* Full curvature at a given centerline index.
   Exported so outside code can query it (e.g. rumble-strip placement). */
export function curvatureAt(i, seed) {
  return (
    0.85 * Math.sin(i * 0.026 + seed) +
    0.45 * Math.sin(i * 0.0093 + seed * 1.7) +
    0.30 * Math.sin(i * 0.061 + seed * 0.5) +
    cornerOverlay(i, seed)
  ) * progressive(i);
}

/* Create a lazy, ever-growing track seeded by `seed`. */
export function createTrack(seed = 7.13) {
  const pts = [];

  function push() {
    const i = pts.length;
    let x, z, ang;
    if (i === 0) {
      x = 0; z = 0; ang = 0;
    } else {
      const p = pts[i - 1];
      ang = p.ang + curvatureAt(i, seed) * 0.035;
      x = p.x + Math.sin(ang) * SEG;
      z = p.z + Math.cos(ang) * SEG;
    }
    pts.push({ x, z, ang, i });
  }

  return {
    pts,
    ensure(n) { while (pts.length <= n) push(); },
    get(i) { this.ensure(i); return pts[i]; },
  };
}
