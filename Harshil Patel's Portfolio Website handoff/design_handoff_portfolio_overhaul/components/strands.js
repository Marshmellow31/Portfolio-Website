/* <strands-bg> — port of Strands (features.md #4) to raw WebGL2, no ogl dependency.
   Attributes: colors="#hex,#hex", count, speed, amplitude, waviness, thickness,
   glow, taper, spread, intensity, saturation, opacity, scale */
(() => {
  const MAX_STRANDS = 12;
  const MAX_COLORS = 8;
  const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;
  const FRAG = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform int uStrandCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uOpacity;
uniform float uScale;
uniform float uSaturation;
out vec4 fragColor;
const float PI = 3.14159265;
vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(2.0 * PI * (t + vec3(0.00, 0.33, 0.67)));
}
vec3 samplePalette(float t) {
  t = fract(t);
  float scaled = t * float(uColorCount);
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  int nextIdx = idx + 1;
  if (nextIdx >= uColorCount) nextIdx = 0;
  return mix(uColors[idx], uColors[nextIdx], blend);
}
vec3 strandColor(float t) {
  if (uColorCount > 0) return samplePalette(t);
  return spectrum(t);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv /= max(uScale, 0.0001);
  float e = 0.06 + uIntensity * 0.94;
  float env = pow(max(cos(uv.x * PI * 1.3), 0.0), uTaper);
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${MAX_STRANDS}; i++) {
    if (i >= uStrandCount) break;
    float fi = float(i);
    float ph = fi * 1.7 * uSpread;
    float freq = (2.0 + fi * 0.35) * uWaviness;
    float spd = 1.4 + fi * 1.2;
    float tt = uTime * uSpeed;
    float w = sin(uv.x * freq + tt * spd + ph) * 0.60
            + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + ph * 1.7) * 0.40;
    float amp = (0.1 + 0.02 * e) * env * uAmplitude;
    float y = w * amp;
    float d = abs(uv.y - y);
    float thick = (0.001 + 0.05 * e) * (0.35 + env) * uThickness;
    float g = thick / (d + thick * 0.45);
    g = g * g;
    float h = fi / float(uStrandCount) + uv.x * 0.30 + uTime * 0.04 + uHueShift;
    col += strandColor(h) * g * env;
  }
  col *= 0.45 + 0.7 * e;
  col = 1.0 - exp(-col * uGlow);
  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(mix(vec3(gray), col, uSaturation), 0.0);
  float lum = max(max(col.r, col.g), col.b);
  float alpha = clamp(lum, 0.0, 1.0) * uOpacity;
  fragColor = vec4(col * uOpacity, alpha);
}
`;

  function hexToRgb(hex) {
    const h = hex.trim().replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  class StrandsBG extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      if (!this.style.display) this.style.display = 'block';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:100%;height:100%;display:block;';
      this.appendChild(canvas);
      const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
      if (!gl) { this.style.display = 'none'; return; }
      this._gl = gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
      gl.useProgram(prog);

      // fullscreen triangle
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U = {};
      ['uTime', 'uResolution', 'uColors', 'uColorCount', 'uStrandCount', 'uSpeed', 'uAmplitude', 'uWaviness',
        'uThickness', 'uGlow', 'uTaper', 'uSpread', 'uHueShift', 'uIntensity', 'uOpacity', 'uScale', 'uSaturation']
        .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

      const num = (name, dflt) => {
        const v = parseFloat(this.getAttribute(name));
        return Number.isFinite(v) ? v : dflt;
      };
      const applyUniforms = () => {
        const colors = (this.getAttribute('colors') || '#7C5CFF,#38BDF8,#C084FC')
          .split(',').map(hexToRgb);
        const padded = [];
        for (let i = 0; i < MAX_COLORS; i++) padded.push(colors[i] || colors[colors.length - 1]);
        gl.uniform3fv(U.uColors, new Float32Array(padded.flat()));
        gl.uniform1i(U.uColorCount, Math.min(colors.length, MAX_COLORS));
        gl.uniform1i(U.uStrandCount, Math.min(Math.max(Math.round(num('count', 3)), 1), MAX_STRANDS));
        gl.uniform1f(U.uSpeed, num('speed', 0.5));
        gl.uniform1f(U.uAmplitude, num('amplitude', 1));
        gl.uniform1f(U.uWaviness, num('waviness', 1));
        gl.uniform1f(U.uThickness, num('thickness', 0.7));
        gl.uniform1f(U.uGlow, num('glow', 2.6));
        gl.uniform1f(U.uTaper, num('taper', 3));
        gl.uniform1f(U.uSpread, num('spread', 1));
        gl.uniform1f(U.uHueShift, num('hue-shift', 0));
        gl.uniform1f(U.uIntensity, num('intensity', 0.6));
        gl.uniform1f(U.uOpacity, num('opacity', 1));
        gl.uniform1f(U.uScale, num('scale', 1.5));
        gl.uniform1f(U.uSaturation, num('saturation', 1.5));
      };
      applyUniforms();
      this._applyUniforms = applyUniforms;

      const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(this.clientWidth * dpr));
        const h = Math.max(1, Math.round(this.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
        gl.uniform2f(U.uResolution, w, h);
      };
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this);
      resize();

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const draw = t => {
        gl.uniform1f(U.uTime, t * 0.001);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      if (reduced) { requestAnimationFrame(() => draw(8000)); return; }

      this._visible = true;
      this._io = new IntersectionObserver(en => { this._visible = en[0].isIntersecting; });
      this._io.observe(this);
      const loop = t => {
        this._raf = requestAnimationFrame(loop);
        if (!this._visible || document.hidden) return;
        draw(t);
      };
      this._raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._ro?.disconnect();
      this._io?.disconnect();
      this._gl?.getExtension('WEBGL_lose_context')?.loseContext();
      this._init = false;
      this.innerHTML = '';
    }
  }
  if (!customElements.get('strands-bg')) customElements.define('strands-bg', StrandsBG);
})();
