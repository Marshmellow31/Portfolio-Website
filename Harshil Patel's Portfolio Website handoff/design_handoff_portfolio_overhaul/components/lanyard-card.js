/* <lanyard-card> — physics ID card on a draggable lanyard.
   Bundler-free adaptation of the Lanyard concept (features.md #2): a verlet-rope
   band rendered on canvas with a DOM ID card attached — draggable, gravity, momentum.
   Attributes: anchor-x (0..1 fraction of width, default .5), rope-length (px, default 260) */
(() => {
  const N = 16; // rope points

  class LanyardCard extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.position = this.style.position || 'relative';
      this.style.display = 'block';
      this.style.touchAction = 'none';

      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      this.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      // ---------- card DOM ----------
      const card = document.createElement('div');
      card.setAttribute('role', 'img');
      card.setAttribute('aria-label', 'ID card for Harshil Patel, Full-Stack Developer, IIIT Vadodara');
      card.style.cssText = [
        'position:absolute', 'left:0', 'top:0', 'width:216px', 'height:330px',
        'border-radius:18px', 'cursor:grab', 'user-select:none',
        'transform-origin:50% 14px', 'will-change:transform',
        'background:linear-gradient(160deg, #17171f 0%, #0d0d13 55%, #131320 100%)',
        'border:1px solid rgba(255,255,255,0.12)',
        'box-shadow:0 30px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        'display:flex', 'flex-direction:column', 'padding:26px 20px 18px', 'box-sizing:border-box',
        'color:#f2f2f7', 'font-family:"Space Grotesk", sans-serif'
      ].join(';');
      card.innerHTML = `
        <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);width:56px;height:9px;border-radius:99px;background:#050508;box-shadow:inset 0 1px 3px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.07);"></div>
        <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8a8a9d;">// DEV-ID 2028</div>
          <div style="width:8px;height:8px;border-radius:50%;background:var(--accent,#7C5CFF);box-shadow:0 0 12px var(--accent,#7C5CFF);"></div>
        </div>
        <div style="margin-top:26px;width:74px;height:74px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(140deg,var(--accent,#7C5CFF),rgba(124,92,255,.35));font-weight:700;font-size:28px;letter-spacing:-.02em;color:#fff;">HP</div>
        <div style="margin-top:18px;font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1.15;">Harshil<br>Patel</div>
        <div style="margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#8a8a9d;">FULL-STACK DEVELOPER</div>
        <div style="margin-top:auto;">
          <div style="height:26px;background:repeating-linear-gradient(90deg,#e8e8ee 0 2px,transparent 2px 5px,#e8e8ee 5px 6px,transparent 6px 10px);border-radius:3px;opacity:.85;"></div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;color:#6d6d80;">
            <span>IIIT VADODARA</span><span>B.TECH CSE</span>
          </div>
        </div>`;
      this.appendChild(card);

      // ---------- verlet rope ----------
      const anchorFrac = parseFloat(this.getAttribute('anchor-x') || '0.5');
      const ropeLen = parseFloat(this.getAttribute('rope-length') || '260');
      const seg = ropeLen / (N - 1);
      let W = 0, H = 0, anchorX = 0;
      const pts = [];
      for (let i = 0; i < N; i++) pts.push({ x: 0, y: i * seg, px: 0, py: i * seg });

      const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        W = this.clientWidth; H = this.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        anchorX = W * anchorFrac;
      };
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this);
      resize();
      // start hanging from anchor
      for (let i = 0; i < N; i++) { pts[i].x = pts[i].px = anchorX; pts[i].y = pts[i].py = i * seg - 8; }

      let dragging = false;
      const pointer = { x: 0, y: 0 };
      card.addEventListener('pointerdown', e => {
        dragging = true;
        card.setPointerCapture(e.pointerId);
        card.style.cursor = 'grabbing';
        const r = this.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        e.preventDefault();
      });
      card.addEventListener('pointermove', e => {
        if (!dragging) return;
        const r = this.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      });
      const release = () => { dragging = false; card.style.cursor = 'grab'; };
      card.addEventListener('pointerup', release);
      card.addEventListener('pointercancel', release);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const GRAV = 2400;
      let lastT = performance.now();
      let windT = Math.random() * 10;

      const step = dt => {
        windT += dt;
        const wind = reduced ? 0 : Math.sin(windT * 0.7) * 14 + Math.sin(windT * 1.9) * 6;
        for (let i = 1; i < N; i++) {
          const p = pts[i];
          const vx = (p.x - p.px) * 0.985;
          const vy = (p.y - p.py) * 0.985;
          p.px = p.x; p.py = p.y;
          p.x += vx + wind * dt * dt * (i / N);
          p.y += vy + GRAV * dt * dt;
        }
        pts[0].x = anchorX; pts[0].y = -8;
        if (dragging) {
          const tip = pts[N - 1];
          tip.px = tip.x; tip.py = tip.y;
          tip.x += (pointer.x - tip.x) * 0.55;
          tip.y += (pointer.y - 14 - tip.y) * 0.55;
        }
        for (let k = 0; k < 24; k++) {
          for (let i = 0; i < N - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
            const diff = (d - seg) / d;
            const f1 = i === 0 ? 0 : 0.5, f2 = i === 0 ? 1 : 0.5;
            const lockTip = dragging && i === N - 2;
            a.x += dx * diff * f1 * (lockTip ? 2 : 1) * (dragging && i === N - 2 ? 1 : 1);
            a.y += dy * diff * f1;
            if (!(dragging && i === N - 2)) { b.x -= dx * diff * f2; b.y -= dy * diff * f2; }
          }
          pts[0].x = anchorX; pts[0].y = -8;
        }
      };

      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        const accent = getComputedStyle(this).getPropertyValue('--accent').trim() || '#7C5CFF';
        // band
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < N - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[N - 1].x, pts[N - 1].y);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#15151d';
        ctx.lineWidth = 15;
        ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 11;
        ctx.stroke();
        // stitch line
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        const tip = pts[N - 1], prev = pts[N - 2];
        const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x) - Math.PI / 2;
        // clip ring
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#2a2a35';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
        card.style.transform = `translate(${tip.x - 108}px, ${tip.y - 2}px) rotate(${ang}rad)`;
      };

      this._visible = true;
      this._io = new IntersectionObserver(en => { this._visible = en[0].isIntersecting; });
      this._io.observe(this);

      const loop = t => {
        this._raf = requestAnimationFrame(loop);
        const dt = Math.min(0.032, (t - lastT) / 1000);
        lastT = t;
        if (!this._visible || document.hidden) return;
        step(dt);
        draw();
      };
      this._raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._ro?.disconnect();
      this._io?.disconnect();
      this._init = false;
      this.innerHTML = '';
    }
  }
  if (!customElements.get('lanyard-card')) customElements.define('lanyard-card', LanyardCard);
})();
