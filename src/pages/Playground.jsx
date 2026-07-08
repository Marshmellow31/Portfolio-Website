import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSEO from '../utils/useSEO';

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
  useSEO({ title: 'Playground', description: 'Webcam hand-tracking physics playground — pinch, grab, and throw objects with your hands.', path: '/playground' });
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
    <div className="fixed inset-0 bg-bg text-text overflow-hidden font-sans">
      
      {/* ── stage (fills entirely) ── */}
      <div ref={stageRef} className="absolute inset-0">
        
        {/* error toast */}
        {error && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[12px] px-6 py-4 font-mono text-[12px] text-text border border-white/20 shadow-2xl z-50 flex flex-col items-center gap-3 text-center"
            style={{ background: '#161618' }}
          >
            <span>{msg}</span>
            <button onClick={startCam} className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-text hover:bg-white/20 cursor-pointer font-sans text-[13px] transition-colors">
              Retry Camera
            </button>
          </div>
        )}

        {/* running gesture hint */}
        {running && (
          <div className="absolute left-[clamp(16px,4vw,32px)] bottom-[clamp(90px,12vh,120px)] font-mono text-[9px] md:text-[10px] tracking-[.1em] text-text-dim leading-[1.9] pointer-events-none bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 max-w-[200px] md:max-w-none">
            {HINTS[mode]}
          </div>
        )}
      </div>

      {/* ── UI Overlay (Floating Glassmorphism) ── */}
      <div className="absolute inset-0 pointer-events-none p-[clamp(16px,4vw,32px)] flex flex-col justify-between z-10">
        
        {/* Top Row: Navigation & Camera Power */}
        <div className="flex justify-between items-start w-full gap-4">
          
          {/* Top Left: Site Back Button */}
          <Link
            to="/"
            className="pointer-events-auto flex items-center gap-2 font-mono text-[10px] tracking-[.12em] uppercase text-text-dim hover:text-white transition-colors bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full shadow-lg"
          >
            ← SITE
          </Link>

          {/* Top Right: Camera Controls & Stats */}
          <div className="flex flex-col items-end gap-2">
            
            <div className="pointer-events-auto">
              {running && (
                <button
                  onClick={stopCam}
                  className="flex items-center gap-2 font-mono text-[10px] tracking-[.1em] uppercase bg-white/5 text-text border border-white/10 rounded-full px-4 py-2.5 cursor-pointer whitespace-nowrap hover:bg-white/10 hover:border-white/30 backdrop-blur-xl shadow-lg transition-all"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-red-500" style={{ animation: 'hpPulse 1.4s ease-in-out infinite' }} />
                  STOP
                </button>
              )}
              {idle && (
                <button
                  onClick={startCam}
                  className="font-mono text-[10px] tracking-[.1em] uppercase bg-white text-black border-none rounded-full px-5 py-2.5 cursor-pointer font-bold whitespace-nowrap hover:bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                >
                  ENABLE CAMERA
                </button>
              )}
              {loading && (
                <div
                  className="font-mono text-[10px] tracking-[.1em] text-text-dim whitespace-nowrap bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10"
                  style={{ animation: 'hpPulse 1.2s ease-in-out infinite' }}
                >
                  {msg}
                </div>
              )}
            </div>

            {/* Floating Stats */}
            {running && (
              <div className="hidden sm:block font-mono text-[9px] tracking-[.1em] text-text-faint whitespace-nowrap bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                {statsLine}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: iOS Camera Style Mode Switcher */}
        <div className="flex justify-center items-end w-full pb-2 md:pb-6">
          <div className="pointer-events-auto flex gap-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-2xl overflow-x-auto max-w-full hide-scrollbar">
            {MODES.map(([id, label]) => (
              <button
                key={id}
                onClick={() => selectMode(id)}
                className="font-mono text-[9px] md:text-[10px] tracking-[.12em] uppercase border-none rounded-full px-4 md:px-6 py-2.5 cursor-pointer transition-all whitespace-nowrap"
                style={
                  mode === id
                    ? { background: 'white', color: 'black', fontWeight: 600 }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {label}
              </button>
            ))}
            <Link
              to="/drift"
              className="font-mono text-[9px] md:text-[10px] tracking-[.12em] uppercase rounded-full px-4 md:px-6 py-2.5 whitespace-nowrap no-underline font-semibold text-black"
              style={{ background: 'linear-gradient(90deg,#FF2E63,#FFD93D,#08D9D6)' }}
            >
              Drift 🏎
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
