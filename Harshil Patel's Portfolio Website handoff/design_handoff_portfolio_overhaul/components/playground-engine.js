/* <hp-playground> — webcam playground engine (monochrome).
   Modes: objects (grab/throw/crush wireframe 3D), particles (hand-driven field),
   avatar (robot face mimics you). Head position parallaxes the scene in all modes.
   MediaPipe tasks-vision is lazy-loaded ONLY when start() is called. All processing local.
   API: el.start(), el.stop(), el.setMode('objects'|'particles'|'avatar')
   Events: 'hp-status' {state, msg}, 'hp-stats' {fps, hands, face} */
(function () {
  'use strict';
  if (customElements.get('hp-playground')) return;

  const MP_VER = '0.10.14';
  const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/vision_bundle.mjs`;
  const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}/wasm`;
  const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

  const HAND_EDGES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

  /* ── wireframe shape library (unit size) ── */
  function cube() {
    const v = [];
    for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) v.push([x,y,z]);
    return { v, e: [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]] };
  }
  function octa() {
    return { v: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
      e: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]] };
  }
  function tetra() {
    return { v: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]], e: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] };
  }
  function icosa() {
    const p = (1 + Math.sqrt(5)) / 2, v = [];
    for (const a of [-1,1]) for (const b of [-p,p]) { v.push([0,a,b]); v.push([a,b,0]); v.push([b,0,a]); }
    const e = [];
    for (let i = 0; i < v.length; i++) for (let j = i+1; j < v.length; j++) {
      const d = Math.hypot(v[i][0]-v[j][0], v[i][1]-v[j][1], v[i][2]-v[j][2]);
      if (Math.abs(d - 2) < 0.01) e.push([i,j]);
    }
    const s = 1/1.9;
    return { v: v.map(q => q.map(c => c*s)), e };
  }
  const SHAPES = [cube, octa, tetra, icosa];

  class HPPlayground extends HTMLElement {
    connectedCallback() {
      if (this._root) return;
      const root = this._root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
<style>
  :host { display: block; width: 100%; height: 100%; position: relative; overflow: hidden; background: #0A0A0B; }
  canvas.main { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .preview { position: absolute; right: 16px; bottom: 16px; width: 168px; border-radius: 8px; overflow: hidden;
             border: 1px solid rgba(255,255,255,.18); background: #000; display: none; box-shadow: 0 12px 40px rgba(0,0,0,.6); }
  .preview.show { display: block; }
  .preview video { width: 100%; display: block; transform: scaleX(-1); filter: grayscale(1) contrast(1.05); opacity: .85; }
  .preview canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .preview .tag { position: absolute; left: 8px; top: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9px;
                  letter-spacing: .14em; color: rgba(255,255,255,.75); text-shadow: 0 1px 4px #000; }
</style>
<canvas class="main"></canvas>
<div class="preview"><video playsinline muted></video><canvas></canvas><div class="tag">LOCAL ONLY</div></div>`;

      this._cv = root.querySelector('canvas.main');
      this._ctx = this._cv.getContext('2d');
      this._prevBox = root.querySelector('.preview');
      this._video = root.querySelector('video');
      this._pcv = root.querySelector('.preview canvas');
      this._pctx = this._pcv.getContext('2d');

      this._mode = this.getAttribute('mode') || 'objects';
      this._running = false;
      this._hands = [];           // [{lm:[{x,y}], pinch, fist, pinchPt:{x,y}, vel}]
      this._face = null;          // {yaw,pitch,roll,jaw,blinkL,blinkR,smile,browUp,nose:{x,y}}
      this._parallax = { x: 0, y: 0 };
      this._objects = [];
      this._particles = [];
      this._burst = [];
      this._fps = 0; this._frames = 0; this._fpsT = performance.now();

      const resize = () => {
        const dpr = Math.min(2, devicePixelRatio || 1);
        this._W = this.clientWidth; this._H = this.clientHeight;
        this._cv.width = this._W * dpr; this._cv.height = this._H * dpr;
        this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      this._ro = new ResizeObserver(resize); this._ro.observe(this); resize();

      this._onVis = () => { if (document.hidden && this._running) this.stop(true); };
      document.addEventListener('visibilitychange', this._onVis);

      this._seedObjects();
      this._seedParticles();
      this._idleLoop();  // renders ambient scene even before camera starts
    }

    disconnectedCallback() {
      this.stop();
      if (this._ro) this._ro.disconnect();
      document.removeEventListener('visibilitychange', this._onVis);
      cancelAnimationFrame(this._raf);
    }

    _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true })); }
    setMode(m) { this._mode = m; }

    /* ─────────── lifecycle ─────────── */
    async start() {
      if (this._running || this._starting) return;
      this._starting = true;
      try {
        this._emit('hp-status', { state: 'loading', msg: 'requesting camera…' });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        this._stream = stream;
        this._video.srcObject = stream;
        await this._video.play();

        this._emit('hp-status', { state: 'loading', msg: 'loading hand + face models…' });
        if (!this._hand) {
          const vision = await import(MP_URL);
          const fileset = await vision.FilesetResolver.forVisionTasks(MP_WASM);
          this._hand = await vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'GPU' },
            runningMode: 'VIDEO', numHands: 2,
          });
          this._faceLm = await vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
            runningMode: 'VIDEO', numFaces: 1,
            outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
          });
        }
        this._running = true;
        this._starting = false;
        this._prevBox.classList.add('show');
        this._emit('hp-status', { state: 'running', msg: 'tracking' });
      } catch (err) {
        this._starting = false;
        const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        this._emit('hp-status', { state: 'error', msg: denied ? 'camera permission denied' : ('failed: ' + (err.message || err)) });
        this.stop();
      }
    }

    stop(fromHidden) {
      this._running = false;
      if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); this._stream = null; }
      this._video.srcObject = null;
      this._prevBox.classList.remove('show');
      this._hands = []; this._face = null;
      this._emit('hp-status', { state: 'idle', msg: fromHidden ? 'paused (tab hidden)' : 'camera off' });
    }

    /* ─────────── tracking ─────────── */
    _track(now) {
      if (!this._running || this._video.readyState < 2) return;
      let hr = null, fr = null;
      try { hr = this._hand.detectForVideo(this._video, now); } catch {}
      if (!this._faceSkip) { try { fr = this._faceLm.detectForVideo(this._video, now + 0.5); } catch {} }
      this._faceSkip = !this._faceSkip; // face every 2nd frame

      // hands → screen space (mirrored)
      const prev = this._hands;
      this._hands = (hr && hr.landmarks ? hr.landmarks : []).map((lm, i) => {
        const pts = lm.map(p => ({ x: (1 - p.x) * this._W, y: p.y * this._H }));
        const size = Math.hypot(pts[0].x - pts[9].x, pts[0].y - pts[9].y) || 1;
        const pinchD = Math.hypot(pts[4].x - pts[8].x, pts[4].y - pts[8].y) / size;
        const old = prev[i];
        const wasPinch = old ? old.pinch : false;
        const pinch = wasPinch ? pinchD < 0.55 : pinchD < 0.38;      // hysteresis
        let curl = 0;
        for (const t of [8,12,16,20]) curl += Math.hypot(pts[t].x - pts[0].x, pts[t].y - pts[0].y);
        const fist = !pinch && (curl / (4 * size)) < 1.28;
        const pinchPt = { x: (pts[4].x + pts[8].x) / 2, y: (pts[4].y + pts[8].y) / 2 };
        const vel = old ? { x: pinchPt.x - old.pinchPt.x, y: pinchPt.y - old.pinchPt.y } : { x: 0, y: 0 };
        return { lm: pts, raw: lm, pinch, fist, pinchPt, vel, pinchStart: pinch && !wasPinch };
      });

      // face
      if (fr && fr.faceLandmarks && fr.faceLandmarks.length) {
        const lm = fr.faceLandmarks[0];
        const bs = {};
        if (fr.faceBlendshapes && fr.faceBlendshapes[0]) {
          for (const c of fr.faceBlendshapes[0].categories) bs[c.categoryName] = c.score;
        }
        let yaw = 0, pitch = 0, roll = 0;
        const M = fr.facialTransformationMatrixes && fr.facialTransformationMatrixes[0];
        if (M && M.data) {
          const m = M.data; // column-major 4x4
          yaw = Math.atan2(-m[8], m[10]);
          pitch = Math.asin(Math.max(-1, Math.min(1, m[9])));
          roll = Math.atan2(-m[1], m[5]);
        }
        this._face = {
          yaw: -yaw, pitch, roll: -roll,
          jaw: bs.jawOpen || 0,
          blinkL: bs.eyeBlinkLeft || 0, blinkR: bs.eyeBlinkRight || 0,
          smile: Math.max(bs.mouthSmileLeft || 0, bs.mouthSmileRight || 0),
          browUp: bs.browInnerUp || 0,
          nose: { x: (1 - lm[1].x), y: lm[1].y },
        };
      } else if (fr) this._face = null;

      // head parallax target (all modes)
      const f = this._face;
      const tx = f ? (f.nose.x - 0.5) * 60 : 0;
      const ty = f ? (f.nose.y - 0.5) * 40 : 0;
      this._parallax.x += (tx - this._parallax.x) * 0.06;
      this._parallax.y += (ty - this._parallax.y) * 0.06;
    }

    /* ─────────── scenes ─────────── */
    _seedObjects() {
      this._objects = [];
      const n = 6;
      for (let i = 0; i < n; i++) this._spawnObject();
    }
    _spawnObject(x, y) {
      if (this._objects.length >= 12) return;
      const make = SHAPES[Math.floor(Math.random() * SHAPES.length)]();
      this._objects.push({
        shape: make,
        x: x != null ? x : 120 + Math.random() * Math.max(200, (this._W || 800) - 240),
        y: y != null ? y : 120 + Math.random() * Math.max(160, (this._H || 600) - 240),
        z: (Math.random() - 0.5) * 240,
        vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2, vz: (Math.random() - 0.5) * 0.8,
        rx: Math.random() * 6.28, ry: Math.random() * 6.28, rz: 0,
        wx: (Math.random() - 0.5) * 0.02, wy: (Math.random() - 0.5) * 0.02, wz: (Math.random() - 0.5) * 0.01,
        r: 42 + Math.random() * 34, scale: 0.01, dying: 0, held: null,
      });
    }
    _seedParticles() {
      this._particles = [];
      for (let i = 0; i < 420; i++) {
        this._particles.push({
          x: Math.random() * (this._W || 800), y: Math.random() * (this._H || 600),
          vx: (Math.random() - 0.5) * .4, vy: (Math.random() - 0.5) * .4,
        });
      }
    }

    _project(o, px, py, pz) {
      // rotate
      let [x, y, z] = [px * o.r * o.scale, py * o.r * o.scale, pz * o.r * o.scale];
      const { rx, ry, rz } = o;
      let t;
      t = { y: y * Math.cos(rx) - z * Math.sin(rx), z: y * Math.sin(rx) + z * Math.cos(rx) }; y = t.y; z = t.z;
      t = { x: x * Math.cos(ry) + z * Math.sin(ry), z: -x * Math.sin(ry) + z * Math.cos(ry) }; x = t.x; z = t.z;
      t = { x: x * Math.cos(rz) - y * Math.sin(rz), y: x * Math.sin(rz) + y * Math.cos(rz) }; x = t.x; y = t.y;
      // perspective from object z + vertex z, camera parallax
      const depth = 900;
      const zz = o.z + z;
      const s = depth / (depth + zz);
      const par = this._parallax;
      const cx = this._W / 2, cy = this._H / 2;
      const sx = (o.x + x - cx - par.x * (zz / 240 + 1)) * s + cx;
      const sy = (o.y + y - cy - par.y * (zz / 240 + 1)) * s + cy;
      return { x: sx, y: sy, s };
    }

    _updateObjects() {
      const W = this._W, H = this._H;
      const hands = this._hands;

      // grabbing
      for (let hi = 0; hi < hands.length; hi++) {
        const h = hands[hi];
        if (h.pinchStart) {
          let best = null, bd = 1e9;
          for (const o of this._objects) {
            if (o.dying || o.held != null) continue;
            const d = Math.hypot(o.x - h.pinchPt.x, o.y - h.pinchPt.y);
            if (d < Math.max(110, o.r * 1.6) && d < bd) { bd = d; best = o; }
          }
          if (best) best.held = hi;
          else this._spawnObject(h.pinchPt.x, h.pinchPt.y);   // pinch empty space → spawn
        }
      }

      for (const o of this._objects) {
        if (o.scale < 1 && !o.dying) o.scale = Math.min(1, o.scale + 0.06);
        if (o.dying) {
          o.dying++;
          o.scale *= 0.82;
          o.rx += 0.3; o.ry += 0.35;
          if (o.dying > 18) { Object.assign(o, { dying: 0, scale: 0.01, x: 80 + Math.random() * (W - 160), y: 80 + Math.random() * (H - 160), z: (Math.random() - .5) * 240, vx: 0, vy: 0, held: null }); }
          continue;
        }

        const holder = o.held != null ? hands[o.held] : null;
        if (holder && holder.pinch) {
          o.vx = (holder.pinchPt.x - o.x) * 0.35;
          o.vy = (holder.pinchPt.y - o.y) * 0.35;
          o.x += o.vx; o.y += o.vy;
          o.wx = holder.vel.y * 0.002; o.wy = holder.vel.x * 0.003;
        } else {
          if (o.held != null) { // released → throw
            const h = hands[o.held];
            if (h) { o.vx = h.vel.x * 1.1; o.vy = h.vel.y * 1.1; }
            o.held = null;
          }
          // fist: attract, and crush when close
          for (const h of hands) {
            if (!h.fist) continue;
            const dx = h.pinchPt.x - o.x, dy = h.pinchPt.y - o.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < Math.max(90, o.r * 1.3)) { o.dying = 1; this._crushBurst(o.x, o.y); }
            else if (d < 420) { o.vx += (dx / d) * 0.5; o.vy += (dy / d) * 0.5; }
          }
          o.x += o.vx; o.y += o.vy; o.z += o.vz;
          o.vx *= 0.985; o.vy *= 0.985; o.vz *= 0.99;
          // walls
          if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx) * 0.85; }
          if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx) * 0.85; }
          if (o.y < o.r) { o.y = o.r; o.vy = Math.abs(o.vy) * 0.85; }
          if (o.y > H - o.r) { o.y = H - o.r; o.vy = -Math.abs(o.vy) * 0.85; }
          if (o.z < -260 || o.z > 260) o.vz *= -1;
        }
        o.rx += o.wx + 0.003; o.ry += o.wy + 0.004; o.rz += o.wz;
        o.wx *= 0.97; o.wy *= 0.97;
      }

      // bursts
      this._burst = this._burst.filter(p => (p.life -= 1) > 0);
      for (const p of this._burst) { p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; }
    }
    _crushBurst(x, y) {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.28, sp = 2 + Math.random() * 7;
        this._burst.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 22 + Math.random() * 16 });
      }
    }

    _drawObjects(ctx) {
      this._updateObjects();
      for (const o of this._objects) {
        if (o.scale <= 0.02 && o.dying) continue;
        const pts = o.shape.v.map(v => this._project(o, v[0], v[1], v[2]));
        const heldNow = o.held != null && this._hands[o.held] && this._hands[o.held].pinch;
        ctx.strokeStyle = heldNow ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.55)';
        ctx.lineWidth = heldNow ? 1.6 : 1;
        ctx.beginPath();
        for (const [a, b] of o.shape.e) { ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); }
        ctx.stroke();
        // depth dot
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        for (const p of pts) { ctx.fillRect(p.x - 1, p.y - 1, 2, 2); }
      }
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const p of this._burst) {
        ctx.globalAlpha = Math.min(1, p.life / 20);
        ctx.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
      }
      ctx.globalAlpha = 1;
    }

    _drawParticles(ctx) {
      const W = this._W, H = this._H;
      const tips = [];
      for (const h of this._hands) {
        for (const t of [4, 8, 12, 16, 20]) tips.push({ p: h.lm[t], pinch: h.pinch, fist: h.fist, c: h.pinchPt });
      }
      for (const pt of this._particles) {
        for (const t of tips) {
          const cx = t.fist ? t.c.x : t.p.x, cy = t.fist ? t.c.y : t.p.y;
          const dx = cx - pt.x, dy = cy - pt.y;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2) || 1;
          if (t.pinch) {           // pinch = repulse burst
            if (d < 260) { pt.vx -= (dx / d) * 900 / d2 * 60; pt.vy -= (dy / d) * 900 / d2 * 60; }
          } else if (t.fist) {     // fist = vortex
            if (d < 340) {
              pt.vx += (-dy / d) * 0.9 + (dx / d) * 0.12;
              pt.vy += (dx / d) * 0.9 + (dy / d) * 0.12;
            }
          } else if (d < 220) {    // open hand = gentle attract
            pt.vx += (dx / d) * 0.22; pt.vy += (dy / d) * 0.22;
          }
        }
        pt.vx *= 0.955; pt.vy *= 0.955;
        pt.x += pt.vx; pt.y += pt.vy;
        if (pt.x < 0) pt.x += W; if (pt.x > W) pt.x -= W;
        if (pt.y < 0) pt.y += H; if (pt.y > H) pt.y -= H;
        const sp = Math.min(1, Math.hypot(pt.vx, pt.vy) / 6);
        ctx.fillStyle = `rgba(255,255,255,${0.18 + sp * 0.72})`;
        const s = 1 + sp * 1.6;
        ctx.fillRect(pt.x - s / 2 - this._parallax.x * .3, pt.y - s / 2 - this._parallax.y * .3, s, s);
      }
    }

    _drawAvatar(ctx) {
      const W = this._W, H = this._H;
      const f = this._face;
      const cx = W / 2 + (f ? f.yaw * 240 : 0);
      const cy = H / 2 + (f ? f.pitch * 240 : 0) + 10;
      const roll = f ? f.roll : 0;
      const s = Math.min(W, H) / 640;          // scale factor
      const hw = 150 * s, hh = 180 * s;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll * 0.9);

      // head
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 44 * s); else ctx.rect(-hw, -hh, hw * 2, hh * 2);
      ctx.stroke();
      // antenna
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, -hh - 34 * s); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -hh - 42 * s, 7 * s, 0, 6.29); ctx.stroke();

      const yawOff = f ? f.yaw * 60 * s : 0;
      const pitchOff = f ? f.pitch * 46 * s : 0;

      // eyes (blink from blendshapes; note mirrored: user's left eye → screen right)
      const ew = 44 * s, ehBase = 30 * s;
      const browLift = f ? f.browUp * 18 * s : 0;
      for (const side of [-1, 1]) {
        const blink = f ? (side === 1 ? f.blinkL : f.blinkR) : 0;
        const eh = Math.max(2.5 * s, ehBase * (1 - blink * 1.05));
        const ex = side * 72 * s + yawOff, ey = -34 * s + pitchOff;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(ex - ew / 2, ey - eh / 2, ew, eh, Math.min(10 * s, eh / 2)); else ctx.rect(ex - ew / 2, ey - eh / 2, ew, eh);
        ctx.stroke();
        if (eh > 8 * s) { // pupil
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          ctx.fillRect(ex - 5 * s + yawOff * 0.35, ey - 5 * s + pitchOff * 0.3, 10 * s, 10 * s);
        }
        // brow
        ctx.beginPath();
        ctx.moveTo(ex - ew / 2, ey - eh / 2 - 14 * s - browLift);
        ctx.lineTo(ex + ew / 2, ey - eh / 2 - 14 * s - browLift);
        ctx.stroke();
      }

      // mouth: jawOpen = height, smile = curve
      const jaw = f ? f.jaw : 0, smile = f ? f.smile : 0;
      const mw = 108 * s, mh = Math.max(3 * s, jaw * 74 * s);
      const my = 74 * s + pitchOff * 0.6;
      ctx.beginPath();
      if (mh > 8 * s) {
        if (ctx.roundRect) ctx.roundRect(-mw / 2 + yawOff * 0.5, my, mw, mh, 12 * s); else ctx.rect(-mw / 2 + yawOff * 0.5, my, mw, mh);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-mw / 2 + yawOff * 0.5, my + mh * 0.45); ctx.lineTo(mw / 2 + yawOff * 0.5, my + mh * 0.45);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
      } else {
        ctx.moveTo(-mw / 2 + yawOff * 0.5, my);
        ctx.quadraticCurveTo(yawOff * 0.5, my + smile * 46 * s, mw / 2 + yawOff * 0.5, my);
        ctx.stroke();
      }

      // cheek bolts
      ctx.strokeStyle = 'rgba(255,255,255,.3)';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * (hw - 22 * s), 40 * s, 8 * s, 0, 6.29); ctx.stroke(); }
      ctx.restore();

      // status line under avatar
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.font = `${11 * Math.max(1, s)}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      const label = f
        ? `yaw ${(f.yaw * 57.3).toFixed(0).padStart(3)}°  pitch ${(f.pitch * 57.3).toFixed(0).padStart(3)}°  jaw ${(f.jaw * 100).toFixed(0)}%`
        : 'no face detected — step into frame';
      ctx.fillText(label, W / 2, cy + hh + 54 * s);
      ctx.textAlign = 'left';
    }

    /* ─────────── shared chrome ─────────── */
    _drawGrid(ctx) {
      const W = this._W, H = this._H, g = 56;
      const ox = -this._parallax.x * 0.5, oy = -this._parallax.y * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = (ox % g + g) % g; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = (oy % g + g) % g; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }
    _drawHandCursors(ctx) {
      for (const h of this._hands) {
        const p = h.pinchPt;
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, h.pinch ? 8 : (h.fist ? 22 : 14), 0, 6.29);
        ctx.stroke();
        if (h.fist) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.29); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill(); }
        // crosshair
        ctx.strokeStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath();
        ctx.moveTo(p.x - 26, p.y); ctx.lineTo(p.x - 14, p.y); ctx.moveTo(p.x + 14, p.y); ctx.lineTo(p.x + 26, p.y);
        ctx.moveTo(p.x, p.y - 26); ctx.lineTo(p.x, p.y - 14); ctx.moveTo(p.x, p.y + 14); ctx.lineTo(p.x, p.y + 26);
        ctx.stroke();
      }
    }
    _drawPreviewSkeleton() {
      const v = this._video;
      if (!v.videoWidth) return;
      const w = this._pcv.width = this._pcv.clientWidth * 2;
      const h = this._pcv.height = this._pcv.clientHeight * 2;
      const ctx = this._pctx;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.5;
      for (const hd of this._hands) {
        const pts = hd.raw.map(p => ({ x: (1 - p.x) * w, y: p.y * h }));
        ctx.beginPath();
        for (const [a, b] of HAND_EDGES) { ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); }
        ctx.stroke();
      }
    }

    _idleLoop() {
      const loop = (now) => {
        this._raf = requestAnimationFrame(loop);
        if (this._running) this._track(now);
        const ctx = this._ctx;
        ctx.clearRect(0, 0, this._W, this._H);
        this._drawGrid(ctx);
        if (this._mode === 'objects') this._drawObjects(ctx);
        else if (this._mode === 'particles') this._drawParticles(ctx);
        else this._drawAvatar(ctx);
        if (this._running) { this._drawHandCursors(ctx); this._drawPreviewSkeleton(); }

        this._frames++;
        if (now - this._fpsT > 500) {
          this._fps = Math.round(this._frames * 1000 / (now - this._fpsT));
          this._frames = 0; this._fpsT = now;
          this._emit('hp-stats', { fps: this._fps, hands: this._hands.length, face: !!this._face, running: this._running });
        }
      };
      this._raf = requestAnimationFrame(loop);
    }
  }

  customElements.define('hp-playground', HPPlayground);
})();
