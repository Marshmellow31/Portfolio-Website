/* ────────────────────────────────────────────────────────────────
   Procedural textures + the road shader.

   Everything here is generated at runtime — no image downloads, no
   extra bundle weight. The road is a real MeshStandardMaterial with
   its albedo/roughness patched via onBeforeCompile, so it still gets
   shadows, fog, IBL-ish hemisphere light and tone mapping for free.
   ──────────────────────────────────────────────────────────────── */

import * as THREE from 'three';

/* ── Canvas noise texture (grain for grass, concrete, gravel) ───── */
export function makeNoiseTexture(size = 256, {
  base = '#4d7c42', alt = '#3f6837', cells = 64, speckle = 0.5, repeat = 1,
  anisotropy = 8,
} = {}) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const c = size / cells;
  ctx.globalAlpha = 0.5;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const n = Math.random();
      if (n > speckle) continue;
      ctx.fillStyle = n > speckle * 0.5 ? alt : base;
      ctx.fillRect(x * c, y * c, c, c);
    }
  }
  // a few larger blotches so it doesn't read as uniform TV static
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = i % 2 ? alt : base;
    const r = size * (0.04 + Math.random() * 0.12);
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  // Anisotropic filtering is close to free on a GPU but brutal on a software
  // rasteriser — measured at 2.2 ms of a 3.6 ms frame for the ground plane
  // alone. The quality tier turns it down rather than off everywhere.
  tex.anisotropy = anisotropy;
  return tex;
}

/* ── Sky dome ──────────────────────────────────────────────────────
   Gradient + horizon haze + a real sun disc + layered fbm clouds
   (and stars at night).

   The dome follows the camera, so it can never be sliced by the far
   plane — that showed up as a huge black bite out of the sky on the
   bigger circuits. It is drawn AFTER the opaque scene with depth
   testing on but no depth writes: covered pixels are rejected before
   the fragment shader runs, so we only pay for sky that's actually
   visible. On a software rasteriser that's most of the sky's cost. */
export function makeSkyMaterial(theme, detail = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(theme.skyTop) },
      uBot: { value: new THREE.Color(theme.skyBot) },
      uHaze: { value: new THREE.Color(theme.horizon) },
      uNight: { value: theme.night ? 1 : 0 },
      uDetail: { value: detail },
      uSun: { value: new THREE.Vector3(...theme.sunPos).normalize() },
      uSunCol: { value: new THREE.Color(theme.sun) },
      uSunSize: { value: theme.sunSize ?? 1 },
      uCloud: { value: detail > 0 ? (theme.cloud ?? 0) : 0 },
      uCloudLit: { value: new THREE.Color(theme.cloudLit || '#ffffff') },
      uCloudDark: { value: new THREE.Color(theme.cloudDark || '#8a9aad') },
      uCloudH: { value: theme.cloudHeight ?? 0.28 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop, uBot, uHaze, uSunCol, uSun, uCloudLit, uCloudDark;
      uniform float uNight, uCloud, uCloudH, uSunSize, uDetail;

      float hash3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x),
                   mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.07; a *= 0.5; }
        return v;
      }

      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -1.0, 1.0);

        /* base gradient — deep overhead, pale toward the horizon */
        vec3 col = mix(uBot, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
        /* haze band hugging the horizon, fading upward */
        float haze = pow(1.0 - clamp(abs(h), 0.0, 1.0), 5.0);
        col = mix(col, uHaze, haze * 0.75);
        /* below the horizon settles to the haze colour so the ground blends in */
        col = mix(col, uHaze * 0.82, smoothstep(0.0, -0.25, h));

        /* sun: sharp disc + wide glow, both warmer than the sky */
        float sd = max(dot(d, normalize(uSun)), 0.0);
        float disc = smoothstep(0.9985, 0.99935, pow(sd, 1.0 / max(uSunSize, 0.2)));
        col += uSunCol * disc * 2.2;
        col += uSunCol * pow(sd, 90.0) * 0.9;
        col += uSunCol * pow(sd, 5.0) * 0.22;
        col += uSunCol * pow(sd, 1.6) * haze * 0.35;

        /* clouds — fbm on a plane projected above the camera */
        if (uCloud > 0.001 && d.y > 0.005) {
          vec2 uv = d.xz / (d.y + uCloudH) * 1.15;
          float f, f2;
          if (uDetail > 0.5) {
            f = fbm(uv * 0.75);
            f2 = fbm(uv * 1.9 + 13.7);
          } else {
            // cheap tier: two plain noise taps rather than eight octaves
            f = vnoise(uv * 0.75) * 0.65 + vnoise(uv * 1.6 + 5.3) * 0.35;
            f2 = vnoise(uv * 2.4 + 13.7);
          }
          float cover = smoothstep(0.50, 0.78, f * 0.75 + f2 * 0.25);
          float lit = smoothstep(0.42, 0.85, f);
          vec3 cloudCol = mix(uCloudDark, uCloudLit, lit);
          // clouds catch the sun near it
          cloudCol += uSunCol * pow(sd, 6.0) * 0.35;
          // fade them out at the horizon and directly overhead-thin
          float fade = smoothstep(0.0, 0.16, d.y) * (1.0 - smoothstep(0.75, 1.0, d.y) * 0.35);
          col = mix(col, cloudCol, clamp(cover * fade * uCloud, 0.0, 1.0));
        }

        /* stars, snapped to a coarse grid so they don't crawl */
        if (uNight > 0.5 && uDetail > 0.5) {
          vec3 g = floor(d * 220.0);
          float st = hash3(g);
          float tw = step(0.9975, st) * smoothstep(-0.02, 0.4, d.y);
          col += vec3(tw) * (0.5 + 0.5 * hash3(g + 3.1));
        }

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

/* ── Road material ─────────────────────────────────────────────────
   Expects the geometry to carry three extra attributes:
     aLat   lateral offset from the centreline (world units)
     aS     distance along the lap (world units)
     aEdge  |aLat| / halfWidth  → 1 at the white line, >1 on the curb
   plus uniforms describing where the start/finish line sits.        */
export function makeRoadMaterial(circuit, theme, opts = {}) {
  const detail = opts.detail ?? 1;
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  mat.userData.uniforms = {
    uStartS: { value: circuit.startIndex * circuit.step },
    uLap: { value: circuit.lapLength },
    uTarmac: { value: theme.tarmac },
    uWet: { value: theme.night ? 0.55 : 0.0 },
    // street-lamp light pools: spacing along the lap and lateral stand-off,
    // matched to the lamp placement in World.jsx
    uLampGlow: { value: opts.lamps ? (theme.lampGlow || 0) : 0 },
    uLampStep: { value: opts.lampStep || 46 },
    uLampLat: { value: opts.lampLat || 0 },
    uDetail: { value: detail },
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);

    shader.vertexShader = `
      attribute float aLat;
      attribute float aS;
      attribute float aEdge;
      varying float vLat;
      varying float vS;
      varying float vEdge;
    ` + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vLat = aLat; vS = aS; vEdge = aEdge;`,
    );

    shader.fragmentShader = `
      varying float vLat;
      varying float vS;
      varying float vEdge;
      uniform float uStartS;
      uniform float uLap;
      uniform float uTarmac;
      uniform float uWet;
      uniform float uLampGlow;
      uniform float uLampStep;
      uniform float uLampLat;
      uniform float uDetail;
      float rhash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float rnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(rhash(i), rhash(i + vec2(1.0, 0.0)), f.x),
                   mix(rhash(i + vec2(0.0, 1.0)), rhash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
    ` + shader.fragmentShader
      .replace('#include <map_fragment>', `
        float e = abs(vEdge);
        float onCurb = step(1.0, e);

        /* ── asphalt ── */
        vec3 col = vec3(uTarmac);
        // rubbered-in racing groove around the middle of the road
        float groove = 1.0 - smoothstep(0.0, 0.62, e);
        col *= 1.0 - groove * 0.20;
        if (uDetail > 0.5) {
          // three octaves of grain at very different scales
          float g1 = rnoise(vec2(vLat * 3.2, vS * 3.2));
          float g2 = rnoise(vec2(vLat * 0.55, vS * 0.55) + 11.3);
          float g3 = rhash(floor(vec2(vLat * 26.0, vS * 26.0)));
          col *= 0.84 + 0.20 * g1 + 0.16 * g2 + 0.10 * g3;
          // resurfacing patches — long low-frequency bands of a different mix
          // (named resurf because "patch" is a reserved word in GLSL)
          float resurf = smoothstep(0.55, 0.75, rnoise(vec2(vS * 0.012, vLat * 0.02)));
          col = mix(col, col * 1.22, resurf);
          // transverse paving joints
          float joint = 1.0 - smoothstep(0.0, 0.10, abs(fract(vS / 18.0) - 0.5) * 2.0 - 0.94);
          col *= 1.0 - joint * 0.22;
        } else {
          // cheap single-tap speckle so it isn't flat grey
          col *= 0.88 + 0.20 * rhash(floor(vec2(vLat * 4.0, vS * 4.0)));
        }

        /* ── painted lines ── */
        float line = smoothstep(0.90, 0.925, e) * (1.0 - smoothstep(0.975, 0.995, e));
        col = mix(col, vec3(0.88), line * 0.95);

        /* ── curb: red/white blocks past the white line ── */
        float blocks = step(0.5, fract(vS / 5.0));
        vec3 curbCol = mix(vec3(0.78, 0.09, 0.10), vec3(0.90, 0.90, 0.92), blocks);
        // grime in the curb grooves
        curbCol *= 0.86 + 0.2 * rhash(floor(vec2(vS * 3.0, vLat)));
        col = mix(col, curbCol, onCurb);

        /* ── start / finish: checkered band + grid boxes ── */
        float ds = abs(mod(vS - uStartS + uLap * 0.5, uLap) - uLap * 0.5);
        if (ds < 1.6 && onCurb < 0.5) {
          float c = mod(floor(vLat / 1.6) + floor(ds / 0.8), 2.0);
          col = mix(vec3(0.05), vec3(0.93), c);
        }
        // painted grid slots behind the line
        float gs = mod(vS - uStartS + uLap, uLap);
        if (gs > uLap - 74.0 && onCurb < 0.5) {
          float row = uLap - gs;
          float box = step(abs(fract(row / 12.0) - 0.06), 0.035);
          float side = step(abs(abs(vLat) - 3.4), 2.6);
          col = mix(col, vec3(0.85), box * side * 0.9);
        }

        diffuseColor.rgb *= col;
      `)
      .replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = roughness;
        float e2 = abs(vEdge);
        // the groove is polished by tyres; curbs are painted and slick;
        // night circuits get a damp sheen that catches the lights
        roughnessFactor *= 1.0 - (1.0 - smoothstep(0.0, 0.62, e2)) * 0.28;
        roughnessFactor *= mix(1.0, 0.55, step(1.0, e2));
        roughnessFactor = mix(roughnessFactor, 0.22, uWet * (1.0 - step(1.0, e2)));
      `)
      /* Street lamps as emissive pools on the tarmac. Real point lights per
         lamp would be dozens of extra lights; this reads the same at a
         fraction of the cost and gives night circuits their pooled look. */
      .replace('#include <emissivemap_fragment>', `
        #include <emissivemap_fragment>
        if (uLampGlow > 0.001) {
          float along = abs(fract(vS / uLampStep + 0.5) - 0.5) * uLampStep;
          float pool = exp(-along * along / 90.0);
          float across = abs(vLat) - uLampLat;
          float side = exp(-across * across / 150.0);
          // light spills inward across the road, brighter at the edges
          totalEmissiveRadiance += vec3(1.0, 0.84, 0.58) * pool * side * uLampGlow;
        }
      `);
  };

  // materials with different onBeforeCompile need distinct cache keys
  mat.customProgramCacheKey = () => `road-${circuit.id}-${theme.night ? 'n' : 'd'}-${opts.lamps ? 'L' : ''}-${detail}`;
  return mat;
}

/* ── Barrier material — painted concrete with sponsor-ish banding ── */
export function makeBarrierMaterial(theme) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = `
      varying float vLat;
      varying float vS;
      varying float vEdge;
      float bhash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    ` + shader.fragmentShader.replace('#include <map_fragment>', `
      float band = fract(vS / 22.0);
      vec3 col = vec3(0.86);
      col = mix(col, vec3(0.12, 0.36, 0.78), step(0.72, band) * step(band, 0.92));
      col = mix(col, vec3(0.85, 0.13, 0.18), step(0.34, band) * step(band, 0.46));
      // grubby concrete near the base
      float dirt = 1.0 - smoothstep(0.0, 0.55, vEdge);
      col *= 0.72 + 0.28 * (1.0 - dirt);
      col *= 0.9 + 0.14 * bhash(floor(vec2(vS * 0.7, vEdge * 6.0)));
      diffuseColor.rgb *= col;
    `);
    shader.vertexShader = `
      attribute float aLat; attribute float aS; attribute float aEdge;
      varying float vLat; varying float vS; varying float vEdge;
    ` + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vLat = aLat; vS = aS; vEdge = aEdge;');
  };
  mat.customProgramCacheKey = () => `barrier-${theme.night ? 'n' : 'd'}`;
  return mat;
}

/* ── Runoff (grass / gravel) ribbon material ─────────────────────── */
export function makeRunoffMaterial(theme, detail = 1) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(theme.ground), roughness: 1, metalness: 0, side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uAlt = { value: new THREE.Color(theme.ground2) };
    shader.uniforms.uDetail = { value: detail };
    shader.vertexShader = `
      attribute float aLat; attribute float aS; attribute float aEdge;
      varying float vLat; varying float vS; varying float vEdge;
    ` + shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vLat = aLat; vS = aS; vEdge = aEdge;');
    shader.fragmentShader = `
      varying float vLat; varying float vS; varying float vEdge;
      uniform vec3 uAlt;
      uniform float uDetail;
      float ghash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gnoise(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(ghash(i), ghash(i + vec2(1.0, 0.0)), f.x),
                   mix(ghash(i + vec2(0.0, 1.0)), ghash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
    ` + shader.fragmentShader.replace('#include <map_fragment>', `
      float n = uDetail > 0.5
        ? gnoise(vec2(vLat * 0.7, vS * 0.7)) * 0.6 + gnoise(vec2(vLat * 3.0, vS * 3.0)) * 0.4
        : ghash(floor(vec2(vLat * 0.5, vS * 0.5)));
      vec3 col = mix(diffuseColor.rgb, uAlt, n);
      // mown stripes running along the lap
      col *= 0.94 + 0.10 * step(0.5, fract(vS / 26.0));
      // scuffed astroturf right at the track edge
      col = mix(col * 1.05, vec3(0.30, 0.62, 0.32), (1.0 - smoothstep(0.0, 0.22, vEdge)) * 0.5);
      diffuseColor.rgb = col;
    `);
  };
  mat.customProgramCacheKey = () => `runoff-${theme.ground}-${detail}`;
  return mat;
}

/* ── Ribbon builder ────────────────────────────────────────────────
   Builds a closed strip through the circuit between a list of lateral
   "columns". Each column is { lat, dy } where lat may be a number or
   a function of the point (so it can follow variable track width),
   and dy is an extra height above the road surface.

   Emits aLat / aS / aEdge attributes for the shaders above.          */
export function buildRibbon(circuit, columns, opts = {}) {
  const { N, pts, step } = circuit;
  const cols = columns.length;
  const count = (N + 1) * cols;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const aLat = new Float32Array(count);
  const aS = new Float32Array(count);
  const aEdge = new Float32Array(count);

  const surf = (p, d) => p.y + p.tilt * Math.max(-p.half, Math.min(p.half, d));

  for (let k = 0; k <= N; k++) {
    const p = pts[k % N];
    for (let c = 0; c < cols; c++) {
      const col = columns[c];
      const lat = typeof col.lat === 'function' ? col.lat(p) : col.lat;
      const dy = typeof col.dy === 'function' ? col.dy(p) : (col.dy || 0);
      const idx = k * cols + c;
      pos[idx * 3] = p.x + p.nx * lat;
      pos[idx * 3 + 1] = (col.flat ? (opts.flatY ?? 0) : surf(p, lat)) + dy;
      pos[idx * 3 + 2] = p.z + p.nz * lat;
      aLat[idx] = lat;
      aS[idx] = k * step;
      aEdge[idx] = col.edge !== undefined
        ? (typeof col.edge === 'function' ? col.edge(p) : col.edge)
        : Math.abs(lat) / p.half;
      uv[idx * 2] = c / (cols - 1 || 1);
      uv[idx * 2 + 1] = (k * step) / 12;
    }
  }

  const idx = [];
  for (let k = 0; k < N; k++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = k * cols + c, b = a + 1;
      const d = (k + 1) * cols + c, e = d + 1;
      idx.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aLat', new THREE.BufferAttribute(aLat, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  geo.setAttribute('aEdge', new THREE.BufferAttribute(aEdge, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/* Vertical wall ribbon: a strip standing up at a lateral offset. */
export function buildWall(circuit, latOf, height, opts = {}) {
  const rows = opts.rows ?? 2;
  const { N, pts, step } = circuit;
  const count = (N + 1) * rows;
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const aLat = new Float32Array(count);
  const aS = new Float32Array(count);
  const aEdge = new Float32Array(count);
  const surf = (p, d) => p.y + p.tilt * Math.max(-p.half, Math.min(p.half, d));

  for (let k = 0; k <= N; k++) {
    const p = pts[k % N];
    const lat = typeof latOf === 'function' ? latOf(p) : latOf;
    const base = surf(p, lat);
    for (let r = 0; r < rows; r++) {
      const f = r / (rows - 1);
      const i = k * rows + r;
      pos[i * 3] = p.x + p.nx * lat;
      pos[i * 3 + 1] = base + f * height;
      pos[i * 3 + 2] = p.z + p.nz * lat;
      aLat[i] = lat;
      aS[i] = k * step;
      aEdge[i] = f;
      uv[i * 2] = f;
      uv[i * 2 + 1] = (k * step) / 8;
    }
  }
  const idx = [];
  for (let k = 0; k < N; k++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = k * rows + r, b = a + 1, c = (k + 1) * rows + r, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aLat', new THREE.BufferAttribute(aLat, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  geo.setAttribute('aEdge', new THREE.BufferAttribute(aEdge, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
