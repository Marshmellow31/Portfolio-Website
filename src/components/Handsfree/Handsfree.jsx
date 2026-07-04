import { useState, useRef, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import useHandTracking from './useHandTracking';

const GESTURES = [
  { icon: '🖐', name: 'Open palm', desc: 'Move the cursor' },
  { icon: '🤏', name: 'Pinch', desc: 'Click' },
  { icon: '↕', name: 'Pinch + drag', desc: 'Scroll the page' },
];

/**
 * Gesture-driven navigation. Only ever mounted after the user opts in from
 * the intro modal in App.jsx — this module (and @mediapipe/tasks-vision)
 * stays out of the initial bundle.
 */
export default function Handsfree({ onExit, onError }) {
  const [stage, setStage] = useState('legend'); // 'legend' | 'active'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);

  const { error, ready } = useHandTracking({
    enabled: stage === 'active',
    videoRef,
    canvasRef,
    cursorRef,
    onAutoStop: onExit,
  });

  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  return (
    <>
      {/* ── Gesture legend modal ── */}
      {stage === 'legend' && (
        <div className="fixed inset-0 z-[9900] bg-black/85 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-md border border-card-border bg-surface p-8">
            <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-4">Handsfree — Gestures</p>
            <div className="flex flex-col gap-5 mb-8">
              {GESTURES.map(g => (
                <div key={g.name} className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center shrink-0">{g.icon}</span>
                  <div>
                    <p className="font-mono text-sm text-white uppercase tracking-wider">{g.name}</p>
                    <p className="text-sm text-text-muted">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStage('active')}
                className="flex-1 font-mono text-xs tracking-widest uppercase px-4 py-3 bg-accent text-white hover:bg-accent/80 transition-colors duration-300"
              >
                Got it
              </button>
              <button
                onClick={onExit}
                className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-card-border text-text-muted hover:text-white transition-colors duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'active' && (
        <>
          {/* ── Robot cursor ── */}
          <div
            ref={cursorRef}
            className="fixed top-0 left-0 z-[10001] pointer-events-none opacity-0 transition-opacity duration-200"
            style={{ willChange: 'transform' }}
            aria-hidden="true"
          >
            <div className="w-12 h-12 rounded-full border-2 border-accent bg-accent/25 backdrop-blur-[2px] flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,0,127,0.5)] transition-colors duration-150">
              <span className="w-1.5 h-2.5 bg-accent rounded-[1px]" />
              <span className="w-1.5 h-2.5 bg-accent rounded-[1px]" />
            </div>
          </div>

          {/* ── Corner webcam preview + kill switch ── */}
          <div className="fixed bottom-4 right-4 z-[10002] pointer-events-none">
            <div className="relative w-[160px] h-[120px] border border-card-border bg-surface overflow-hidden">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                width={160}
                height={120}
                className="absolute inset-0 w-full h-full"
              />
              {!ready && (
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-text-muted uppercase tracking-widest bg-surface">
                  Loading...
                </span>
              )}
              <button
                onClick={onExit}
                className="absolute top-1 right-1 pointer-events-auto w-6 h-6 flex items-center justify-center bg-black/70 border border-card-border text-white hover:bg-accent hover:border-accent transition-colors duration-200"
                aria-label="Turn off handsfree mode"
              >
                <FiX size={13} />
              </button>
              <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-accent uppercase tracking-[0.2em] bg-black/60 px-1">
                Handsfree
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
