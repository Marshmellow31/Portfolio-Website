/* ────────────────────────────────────────────────────────────────
   Quality tier detection.

   Some machines run WebGL through a CPU rasteriser (Windows' "Basic
   Render Driver"/WARP, SwiftShader, llvmpipe) — usually when there's
   no GPU driver, in a VM, or in an embedded webview. There, cost is
   almost entirely per-pixel: shadow passes, MSAA and multi-octave
   procedural shaders are what kill the frame rate, not triangles.

   So rather than tuning for a GPU and hoping, we ask what we're
   actually running on and pick a tier. `detail` gates the expensive
   fragment work in the sky and road shaders.
   ──────────────────────────────────────────────────────────────── */

const SOFTWARE = /basic render|swiftshader|llvmpipe|software|microsoft basic|generic renderer/i;

let cached = null;

export function detectQuality() {
  if (cached) return cached;

  let renderer = '';
  try {
    const cv = document.createElement('canvas');
    const gl = cv.getContext('webgl2') || cv.getContext('webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch { /* detection is best-effort; fall through to the safe default */ }

  const software = SOFTWARE.test(renderer);
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  const saveData = navigator.connection?.saveData === true;
  const weak = (navigator.hardwareConcurrency || 4) <= 4 || lowMemory || saveData;

  cached = software
    ? {
      tier: 'low', renderer, software,
      maxDpr: 0.75, minDpr: 0.4,
      shadows: false, antialias: false,
      detail: 0,              // cheap sky, no procedural grain
      particles: 0.45,
      scenery: 0.4,
      far: 850,
    }
    : {
      tier: coarse || weak ? 'medium' : 'high', renderer, software,
      maxDpr: coarse ? 0.9 : (weak ? 1 : 1.25), minDpr: 0.55,
      shadows: true, antialias: !coarse && !weak,
      detail: 1,
      particles: coarse ? 0.6 : 1,
      scenery: coarse ? 0.6 : 1,
      far: coarse || weak ? 1000 : 1400,
    };
  return cached;
}
