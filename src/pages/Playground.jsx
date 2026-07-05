import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const MODES = [
  ['objects', 'Objects'],
  ['particles', 'Particles'],
  ['avatar', 'Avatar'],
];

const HINTS = {
  objects: 'PINCH grab/throw · pinch empty space = spawn · FIST attract/crush',
  particles: 'OPEN HAND attract · PINCH burst · FIST vortex',
  avatar: 'move your head · blink · open mouth · smile · raise brows',
};

const LEGEND = [
  ['PINCH', 'grab an object · drag it · release to throw · pinch empty space to spawn'],
  ['FIST', 'attract objects · crush them up close · vortex in particle mode'],
  ['OPEN HAND', 'steer particles gently'],
  ['YOUR HEAD', 'parallaxes the scene · drives the robot in avatar mode'],
];

export default function Playground() {
  const stageRef = useRef(null);
  const elRef = useRef(null);
  const [mode, setMode] = useState('objects');
  const [status, setStatus] = useState('idle'); // idle | loading | running | error
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState({ fps: 0, hands: 0, face: false });

  // Mount the framework-free <hp-playground> engine once.
  useEffect(() => {
    let el;
    let cancelled = false;
    const onStatus = (e) => { setStatus(e.detail.state); setMsg(e.detail.msg); };
    const onStats = (e) => setStats({ fps: e.detail.fps, hands: e.detail.hands, face: e.detail.face });

    import('../lib/playground-engine.js').then(() => {
      if (cancelled || !stageRef.current) return;
      el = document.createElement('hp-playground');
      el.setAttribute('mode', 'objects');
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.addEventListener('hp-status', onStatus);
      el.addEventListener('hp-stats', onStats);
      stageRef.current.appendChild(el);
      elRef.current = el;
    });

    return () => {
      cancelled = true;
      if (el) {
        el.removeEventListener('hp-status', onStatus);
        el.removeEventListener('hp-stats', onStats);
        if (el.stop) el.stop();
        if (el.parentNode) el.parentNode.removeChild(el);
      }
      elRef.current = null;
    };
  }, []);

  const selectMode = (id) => {
    setMode(id);
    if (elRef.current?.setMode) elRef.current.setMode(id);
  };
  const startCam = () => elRef.current?.start?.();
  const stopCam = () => elRef.current?.stop?.();

  const running = status === 'running';
  const idle = status === 'idle';
  const loading = status === 'loading';
  const error = status === 'error';

  const statsLine = running
    ? `${stats.fps} FPS · ${stats.hands} HAND${stats.hands === 1 ? '' : 'S'} · FACE ${stats.face ? 'OK' : '—'}`
    : '';

  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-text overflow-hidden font-sans">
      {/* ── top bar ── */}
      <div className="flex-none flex items-center gap-[clamp(12px,2vw,24px)] h-[60px] px-[clamp(14px,3vw,32px)] border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-[11px] tracking-[.12em] text-text-dim no-underline whitespace-nowrap hover:text-text transition-colors"
        >
          ← SITE
        </Link>
        <div className="w-px h-5 bg-white/[0.12]" />
        <div className="text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap">Playground</div>

        {/* mode switcher */}
        <div className="flex gap-0.5 bg-white/[0.05] border border-white/10 rounded-[7px] p-[3px] ml-auto">
          {MODES.map(([id, label]) => (
            <button
              key={id}
              onClick={() => selectMode(id)}
              className="font-mono text-[10px] tracking-[.1em] uppercase border-none rounded-[5px] px-3 py-[7px] cursor-pointer transition-colors"
              style={
                mode === id
                  ? { background: '#F2F2F3', color: '#0A0A0B' }
                  : { background: 'transparent', color: '#8A8A93' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* stats */}
        {running && (
          <div className="font-mono text-[10px] tracking-[.1em] text-text-faint whitespace-nowrap">
            {statsLine}
          </div>
        )}

        {/* start / stop / loading */}
        {running && (
          <button
            onClick={stopCam}
            className="flex items-center gap-2 font-mono text-[11px] tracking-[.1em] bg-transparent text-text border border-border-strong rounded-[6px] px-3.5 py-2 cursor-pointer whitespace-nowrap hover:border-white transition-colors"
          >
            <span className="w-[7px] h-[7px] rounded-full bg-text" style={{ animation: 'hpPulse 1.4s ease-in-out infinite' }} />
            STOP
          </button>
        )}
        {idle && (
          <button
            onClick={startCam}
            className="font-mono text-[11px] tracking-[.1em] bg-text text-bg border-none rounded-[6px] px-4 py-[9px] cursor-pointer font-medium whitespace-nowrap hover:bg-white transition-colors"
          >
            ENABLE CAMERA
          </button>
        )}
        {loading && (
          <div
            className="font-mono text-[11px] tracking-[.1em] text-text-dim whitespace-nowrap"
            style={{ animation: 'hpPulse 1.2s ease-in-out infinite' }}
          >
            {msg}
          </div>
        )}
      </div>

      {/* ── stage ── */}
      <div ref={stageRef} className="relative flex-1 min-h-0">
        {/* idle intro overlay removed per user request */}

        {/* error toast */}
        {error && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-[8px] px-5 py-3 font-mono text-[12px] text-text border border-white/20"
            style={{ background: '#161618' }}
          >
            {msg} —{' '}
            <button onClick={startCam} className="bg-none border-none text-text underline cursor-pointer p-0 font-[inherit]">
              retry
            </button>
          </div>
        )}

        {/* running gesture hint */}
        {running && (
          <div className="absolute left-4 bottom-4 font-mono text-[10px] tracking-[.1em] text-text-faint leading-[1.9] pointer-events-none">
            {HINTS[mode]}
          </div>
        )}
      </div>
    </div>
  );
}
