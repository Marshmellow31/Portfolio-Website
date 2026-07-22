/* <hp-terminal> — floating, draggable, closable macOS-style terminal (monochrome).
   Open with ⌘K/Ctrl+K, the `hp-terminal-toggle` window event, or el.toggle().
   Traffic lights: red = close, yellow = minimize to pill, green = maximize.
   Position + size persist in localStorage. Mobile (<640px): docked bottom sheet, no drag. */
(function () {
  'use strict';
  if (customElements.get('hp-terminal')) return;

  const LS_POS = 'hp-term-pos-v1';

  const SKILLS = {
    Languages: 'TypeScript, JavaScript, Python, C++, Java, Dart, Kotlin, SQL',
    Frontend: 'React 19, Next.js, Svelte 5, Tailwind CSS, Framer Motion, Three.js',
    Backend: 'Node.js, Express, Firebase, MySQL, REST APIs',
    Mobile: 'Android (Kotlin), Flutter, PWA, Capacitor',
    'AI/ML': 'Ollama, Claude API, Gemini Vision, Whisper STT, Embeddings',
    Tools: 'Git, GitHub Actions, Vercel, Docker, Vitest, ESLint',
  };
  const PROJECTS = [
    ['PayMatrix', 'AI-powered group expense platform — live in production'],
    ['Ascend', 'Gamified productivity PWA'],
    ['PlayHub', 'Court booking app with payments'],
    ['Mann Beauty', 'Loyalty CRM a salon uses daily'],
    ['Bhumi Developers', 'Corporate real-estate site'],
    ['BD Buildcon', 'Industrial EPC contractor site'],
    ['PickleRage', 'Sports venue marketing site'],
    ['Navigator+', 'Native Android GPS dashboard'],
  ];
  const OPEN_MAP = {
    paymatrix: 'https://pay-matrix.vercel.app/',
    ascend: 'https://github.com/Marshmellow31/Ascend',
    picklerage: 'https://github.com/Marshmellow31/PickleRage-website',
    mann: 'https://github.com/Marshmellow31/Mann-beauty-parlour',
  };
  const LINKS = {
    github: 'https://github.com/Marshmellow31',
    linkedin: 'https://linkedin.com/in/harshil-patel-5a7373333',
    email: 'mailto:1080patelharshil@gmail.com',
  };
  const COMMANDS = [
    ['help', 'list all commands'],
    ['about', 'a short bio'],
    ['skills', 'grouped tech stack'],
    ['projects', 'featured projects'],
    ['open <name>', 'open a project (paymatrix, ascend, picklerage, mann)'],
    ['github', 'open GitHub profile'],
    ['linkedin', 'open LinkedIn profile'],
    ['email', 'send me an email'],
    ['whoami', 'who are you?'],
    ['sudo hire-me', 'the fast track'],
    ['cv', 'download my resume'],
    ['drift', 'endless drift through mountains & beaches'],
    ['clear', 'clear the terminal'],
    ['exit', 'close the window'],
  ];
  const COMPLETIONS = ['help', 'about', 'skills', 'projects', 'open ', 'github', 'linkedin', 'email', 'whoami', 'sudo hire-me', 'cv', 'drift', 'clear', 'exit'];
  const BOOT = ["Welcome to Harshil's portfolio terminal.", "Type 'help' to get started."];

  function commonPrefix(arr) {
    if (!arr.length) return '';
    let p = arr[0];
    for (const s of arr.slice(1)) while (!s.startsWith(p)) p = p.slice(0, -1);
    return p;
  }

  class HPTerminal extends HTMLElement {
    constructor() {
      super();
      this._open = false;
      this._min = false;
      this._max = false;
      this._booted = false;
      this._history = [];
      this._hIndex = -1;
      this._draft = '';
      this._lastTab = 0;
    }

    connectedCallback() {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
<style>
  :host { position: fixed; inset: 0; pointer-events: none; z-index: 900; font-family: 'JetBrains Mono', ui-monospace, monospace; }
  * { box-sizing: border-box; }
  .win {
    position: fixed; display: none; flex-direction: column;
    width: min(680px, calc(100vw - 24px)); height: 420px;
    min-width: 300px; min-height: 200px;
    background: rgba(14,14,16,.92); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,.14); border-radius: 10px; overflow: hidden;
    box-shadow: 0 30px 90px rgba(0,0,0,.65), 0 2px 10px rgba(0,0,0,.4);
    pointer-events: auto;
    resize: both;
  }
  .win.open { display: flex; animation: pop .22s cubic-bezier(.2,.9,.3,1.2); }
  @keyframes pop { from { opacity: 0; transform: scale(.96) translateY(8px); } }
  .bar {
    display: flex; align-items: center; height: 38px; padding: 0 14px; flex: 0 0 auto;
    border-bottom: 1px solid rgba(255,255,255,.09); cursor: grab; user-select: none; position: relative;
    background: rgba(255,255,255,.03);
  }
  .bar.dragging { cursor: grabbing; }
  .dots { display: flex; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; border: none; padding: 0; cursor: pointer;
         display: grid; place-items: center; color: transparent; font-size: 9px; line-height: 1; transition: background .18s; }
  .d-close { background: #ff5f56; } .d-min { background: #ffbd2e; } .d-max { background: #27c93f; }
  .dots:hover .dot { color: rgba(0,0,0,.55); }
  .title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 11px; letter-spacing: .08em; color: #8A8A93; white-space: nowrap; }
  .hint { margin-left: auto; font-size: 10px; letter-spacing: .06em; color: #5A5A62; }
  .out { flex: 1; overflow-y: auto; padding: 14px 16px; font-size: 12.5px; line-height: 1.75; color: #A8A8B0; }
  .out::-webkit-scrollbar { width: 6px; } .out::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
  .line { white-space: pre-wrap; word-break: break-word; }
  .in-line .prompt, .prompt { color: #F2F2F3; }
  .cmd { color: #F2F2F3; }
  .err { color: #F2F2F3; text-decoration: underline; text-decoration-color: rgba(255,255,255,.35); text-underline-offset: 3px; }
  .live { display: flex; align-items: center; }
  .cursor { display: inline-block; width: 7px; height: 15px; margin-left: 2px; background: #F2F2F3; animation: blink 1.05s step-end infinite; vertical-align: text-bottom; }
  @keyframes blink { 50% { opacity: 0; } }
  input.ghost { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
  .pill {
    position: fixed; right: 20px; bottom: 20px; display: none; align-items: center; gap: 8px;
    background: rgba(14,14,16,.92); border: 1px solid rgba(255,255,255,.16); border-radius: 999px;
    padding: 9px 16px; color: #C9C9CE; font-size: 11px; letter-spacing: .08em; cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,.5); pointer-events: auto; backdrop-filter: blur(12px);
  }
  .pill.show { display: flex; }
  .pill:hover { border-color: rgba(255,255,255,.4); }
  .pill .dot-live { width: 6px; height: 6px; border-radius: 50%; background: #F2F2F3; animation: blink 1.4s step-end infinite; }
  @media (max-width: 640px) {
    .win { left: 12px !important; right: 12px; bottom: 12px !important; top: auto !important; width: auto; height: min(64vh, 460px); }
    .bar { cursor: default; }
  }
  @media (prefers-reduced-motion: reduce) { .win.open { animation: none; } .cursor, .pill .dot-live { animation: none; } }
</style>
<div class="win" role="dialog" aria-label="Terminal">
  <div class="bar">
    <div class="dots">
      <button class="dot d-close" title="Close (Esc)">×</button>
      <button class="dot d-min" title="Minimize">−</button>
      <button class="dot d-max" title="Maximize">+</button>
    </div>
    <div class="title">harshil@portfolio — zsh</div>
    <div class="hint">drag me</div>
  </div>
  <div class="out"></div>
  <input class="ghost" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal input">
</div>
<button class="pill"><span class="dot-live"></span>terminal</button>`;

      this._win = root.querySelector('.win');
      this._bar = root.querySelector('.bar');
      this._out = root.querySelector('.out');
      this._input = root.querySelector('input.ghost');
      this._pill = root.querySelector('.pill');

      root.querySelector('.d-close').addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
      root.querySelector('.d-min').addEventListener('click', (e) => { e.stopPropagation(); this.minimize(); });
      root.querySelector('.d-max').addEventListener('click', (e) => { e.stopPropagation(); this._toggleMax(); });
      this._pill.addEventListener('click', () => this.open());
      this._win.addEventListener('mousedown', () => setTimeout(() => this._input.focus({ preventScroll: true }), 0));
      this._win.addEventListener('click', () => this._input.focus({ preventScroll: true }));
      this._input.addEventListener('keydown', (e) => this._onKey(e));
      this._input.addEventListener('input', () => this._renderLive());

      // dragging
      this._bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.dot') || window.innerWidth <= 640) return;
        const r = this._win.getBoundingClientRect();
        this._drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        this._bar.classList.add('dragging');
        this._bar.setPointerCapture(e.pointerId);
      });
      this._bar.addEventListener('pointermove', (e) => {
        if (!this._drag) return;
        const w = this._win.offsetWidth;
        const x = Math.min(Math.max(8 - w * 0.6, e.clientX - this._drag.dx), window.innerWidth - w * 0.25);
        const y = Math.min(Math.max(8, e.clientY - this._drag.dy), window.innerHeight - 46);
        this._place(x, y);
      });
      const endDrag = () => {
        if (!this._drag) return;
        this._drag = null;
        this._bar.classList.remove('dragging');
        this._savePos();
      };
      this._bar.addEventListener('pointerup', endDrag);
      this._bar.addEventListener('pointercancel', endDrag);

      // global shortcut
      this._onGlobalKey = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.toggle(); }
        else if (e.key === 'Escape' && this._open) this.close();
      };
      window.addEventListener('keydown', this._onGlobalKey);
      this._onToggleEvt = () => this.toggle();
      window.addEventListener('hp-terminal-toggle', this._onToggleEvt);

      // restore position
      try {
        const p = JSON.parse(localStorage.getItem(LS_POS) || 'null');
        if (p && Number.isFinite(p.x)) this._place(p.x, p.y);
        else this._centerDefault();
      } catch { this._centerDefault(); }

      window.HPTerminal = this;
    }

    disconnectedCallback() {
      window.removeEventListener('keydown', this._onGlobalKey);
      window.removeEventListener('hp-terminal-toggle', this._onToggleEvt);
      clearInterval(this._bootTimer);
    }

    _centerDefault() {
      const w = Math.min(680, window.innerWidth - 24);
      this._place(Math.max(12, (window.innerWidth - w) / 2), Math.max(12, window.innerHeight * 0.18));
    }
    _place(x, y) { this._win.style.left = x + 'px'; this._win.style.top = y + 'px'; }
    _savePos() {
      const r = this._win.getBoundingClientRect();
      try { localStorage.setItem(LS_POS, JSON.stringify({ x: r.left, y: r.top })); } catch {}
    }

    open() {
      this._open = true; this._min = false;
      this._win.classList.add('open');
      this._pill.classList.remove('show');
      if (!this._booted) this._boot();
      setTimeout(() => this._input.focus({ preventScroll: true }), 60);
    }
    close() { this._open = false; this._win.classList.remove('open'); this._pill.classList.remove('show'); }
    minimize() { this._open = false; this._win.classList.remove('open'); this._pill.classList.add('show'); }
    toggle() { if (this._open) { this.minimize(); } else { this.open(); } }
    _toggleMax() {
      this._max = !this._max;
      if (this._max) {
        this._win.style.width = 'min(920px, calc(100vw - 24px))';
        this._win.style.height = 'min(620px, calc(100vh - 24px))';
      } else { this._win.style.width = ''; this._win.style.height = ''; }
      const r = this._win.getBoundingClientRect();
      if (r.right > window.innerWidth) this._place(Math.max(8, window.innerWidth - r.width - 12), r.top);
      if (r.bottom > window.innerHeight) this._place(r.left, Math.max(8, window.innerHeight - r.height - 12));
    }

    /* ── output helpers ── */
    _el(cls, text) { const d = document.createElement('div'); d.className = 'line ' + cls; d.textContent = text; return d; }
    _print(entries) {
      for (const [cls, text] of entries) {
        if (cls === 'input') {
          const d = document.createElement('div');
          d.className = 'line';
          const p = document.createElement('span'); p.className = 'prompt'; p.textContent = '➜ ~ ';
          const t = document.createElement('span'); t.className = 'cmd'; t.textContent = text;
          d.append(p, t);
          this._out.insertBefore(d, this._live || null);
        } else {
          this._out.insertBefore(this._el(cls, text), this._live || null);
        }
      }
      this._out.scrollTop = this._out.scrollHeight;
    }
    _renderLive() {
      if (!this._live) return;
      this._liveText.textContent = this._input.value;
      this._out.scrollTop = this._out.scrollHeight;
    }
    _mountPrompt() {
      this._live = document.createElement('div');
      this._live.className = 'line live';
      const p = document.createElement('span'); p.className = 'prompt'; p.textContent = '➜ ~ ';
      this._liveText = document.createElement('span'); this._liveText.className = 'cmd';
      const c = document.createElement('span'); c.className = 'cursor';
      this._live.append(p, this._liveText, c);
      this._out.appendChild(this._live);
    }

    _boot() {
      this._booted = true;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        this._print(BOOT.map(t => ['', t]));
        this._mountPrompt();
        return;
      }
      let line = 0, ch = 0;
      let cur = this._el('', '');
      this._out.appendChild(cur);
      this._bootTimer = setInterval(() => {
        if (line >= BOOT.length) { clearInterval(this._bootTimer); this._mountPrompt(); return; }
        ch++;
        cur.textContent = BOOT[line].slice(0, ch);
        if (ch >= BOOT[line].length) {
          line++; ch = 0;
          if (line < BOOT.length) { cur = this._el('', ''); this._out.appendChild(cur); }
        }
        this._out.scrollTop = this._out.scrollHeight;
      }, 32);
    }

    /* ── command execution ── */
    _run(raw) {
      const trimmed = raw.trim();
      this._print([['input', raw]]);
      if (!trimmed) return;
      this._history.push(trimmed);
      const parts = trimmed.toLowerCase().split(/\s+/);
      const cmd = parts[0], arg = parts[1];
      const out = (t) => this._print([['', t]]);
      const err = (t) => this._print([['err', t]]);

      switch (cmd) {
        case 'help': COMMANDS.forEach(([n, d]) => out(n.padEnd(14) + d)); break;
        case 'about':
          out('B.Tech CSE @ IIIT Vadodara — 3rd year, graduating 2028.');
          out('15+ shipped projects across web, mobile, and AI.');
          out('Client work in production: salons, sports venues, real estate.');
          break;
        case 'skills': Object.entries(SKILLS).forEach(([k, v]) => out(k.padEnd(10) + '→ ' + v)); break;
        case 'projects': PROJECTS.forEach(([n, d]) => out(n.padEnd(18) + d)); break;
        case 'open': {
          if (!arg) { err("usage: open <name> — try 'projects'"); break; }
          const url = OPEN_MAP[arg];
          if (url) { out('Opening ' + arg + ' → ' + url); window.open(url, '_blank', 'noopener,noreferrer'); }
          else err("project not found (or private repo). try: paymatrix, ascend, picklerage, mann");
          break;
        }
        case 'github': case 'linkedin':
          out('Opening ' + cmd + '...');
          window.open(LINKS[cmd], '_blank', 'noopener,noreferrer');
          break;
        case 'email': out('Opening your mail client...'); window.location.href = LINKS.email; break;
        case 'whoami': out('guest@portfolio — nice try, the admin seat is taken.'); break;
        case 'sudo':
          if (arg === 'hire-me') {
            out('Permission granted. Excellent decision — taking you to contact...');
            setTimeout(() => {
              const el = document.getElementById('contact');
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
              this.minimize();
            }, 700);
          } else err("sudo: only 'sudo hire-me' is permitted here.");
          break;
        case 'cv':
          out('Downloading resume.pdf ...');
          { const a = document.createElement('a'); a.href = '/resume.pdf'; a.download = ''; a.click(); }
          break;
        case 'drive': case 'drift':
          out('Igniting engine ...');
          out('Mountains, beaches, rivers. No finish line.');
          setTimeout(() => {
            this.close();
            // SPA navigation — react-router listens to popstate
            window.history.pushState({}, '', '/drift');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 900);
          break;
        case 'clear':
          this._out.querySelectorAll('.line:not(.live)').forEach(n => n.remove());
          break;
        case 'exit': this.close(); break;
        default: err('zsh: command not found: ' + cmd + ". Type 'help'.");
      }
    }

    _onKey(e) {
      if (e.key === 'Enter') {
        this._run(this._input.value);
        this._input.value = '';
        this._renderLive();
        this._hIndex = -1; this._draft = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this._history.length) return;
        if (this._hIndex === -1) { this._draft = this._input.value; this._hIndex = this._history.length - 1; }
        else this._hIndex = Math.max(0, this._hIndex - 1);
        this._input.value = this._history[this._hIndex]; this._renderLive();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this._hIndex === -1) return;
        this._hIndex++;
        if (this._hIndex >= this._history.length) { this._hIndex = -1; this._input.value = this._draft; }
        else this._input.value = this._history[this._hIndex];
        this._renderLive();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = this._input.value.toLowerCase();
        if (!v) return;
        const matches = COMPLETIONS.filter(c => c.startsWith(v));
        if (matches.length === 1) { this._input.value = matches[0]; this._renderLive(); }
        else if (matches.length > 1) {
          const now = Date.now();
          const prefix = commonPrefix(matches);
          if (prefix.length > v.length) { this._input.value = prefix; this._renderLive(); }
          else if (now - this._lastTab < 500) {
            this._print([['input', this._input.value], ['', matches.map(m => m.trim()).join('  ')]]);
          }
          this._lastTab = now;
        }
      }
    }
  }

  customElements.define('hp-terminal', HPTerminal);
})();
