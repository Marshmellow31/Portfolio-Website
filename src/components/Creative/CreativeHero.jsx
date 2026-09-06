import { useEffect, useRef, useState } from 'react';
import { FaInstagram } from 'react-icons/fa';

export default function CreativeHero({ instagramHandle, instagramUrl }) {
  const heroRef = useRef(null);
  const viewerRef = useRef(null);
  const [activeFinish, setActiveFinish] = useState('premium');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [has3DFallback, setHas3DFallback] = useState(false);

  // Mobile dedicated 3D interactive stage state
  const [interactiveMode, setInteractiveMode] = useState('orbit'); // 'orbit' | 'move'
  const [touchFeedback, setTouchFeedback] = useState(null);

  const activeTouches = useRef(new Map());
  const initialPinchDist = useRef(null);
  const prevMidpoint = useRef(null);
  const lastSingleTouch = useRef(null);

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches
    );

    const handleViewerMessage = (event) => {
      if (event.source !== viewerRef.current?.contentWindow) return;

      if (event.data?.type === 'bullet-scroll') {
        window.scrollBy({ top: event.data.deltaY, behavior: 'auto' });
      } else if (event.data?.type === 'bullet-ready' || event.data?.type === 'bullet-finish-changed') {
        if (event.data.finish) setActiveFinish(event.data.finish);
      } else if (event.data?.type === 'bullet-unsupported') {
        setHas3DFallback(true);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        viewerRef.current?.contentWindow?.postMessage(
          {
            type: 'bullet-visibility',
            visible: entry.isIntersecting,
          },
          window.location.origin
        );
      },
      { threshold: 0.02 }
    );

    window.addEventListener('message', handleViewerMessage);
    if (heroRef.current) observer.observe(heroRef.current);

    return () => {
      window.removeEventListener('message', handleViewerMessage);
      observer.disconnect();
    };
  }, []);

  const handleSelectFinish = (finishKey) => {
    setActiveFinish(finishKey);
    viewerRef.current?.contentWindow?.postMessage(
      {
        type: 'set-finish',
        finish: finishKey,
      },
      window.location.origin
    );
  };

  // Dedicated Interactive 3D Stage Touch Handlers (pinch to zoom, 1-finger orbit, 1-finger or 2-finger pan)
  const handleStageTouchStart = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      activeTouches.current.set(t.identifier, { x: t.clientX, y: t.clientY });
    }

    if (activeTouches.current.size === 1) {
      const [t] = activeTouches.current.values();
      lastSingleTouch.current = { x: t.x, y: t.y };
      setTouchFeedback(interactiveMode === 'move' ? 'Moving anchor' : 'Rotating 360°');
    } else if (activeTouches.current.size >= 2) {
      const [t1, t2] = [...activeTouches.current.values()];
      initialPinchDist.current = Math.hypot(t1.x - t2.x, t1.y - t2.y);
      prevMidpoint.current = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };
      setTouchFeedback('Pinch to zoom · 2-finger move');
    }
  };

  const handleStageTouchMove = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (activeTouches.current.has(t.identifier)) {
        activeTouches.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
    }

    if (activeTouches.current.size === 1 && lastSingleTouch.current) {
      const [t] = activeTouches.current.values();
      const deltaX = t.x - lastSingleTouch.current.x;
      const deltaY = t.y - lastSingleTouch.current.y;
      lastSingleTouch.current = { x: t.x, y: t.y };

      if (interactiveMode === 'move') {
        viewerRef.current?.contentWindow?.postMessage(
          { type: 'bullet-pan', deltaX: deltaX * 1.4, deltaY: deltaY * 1.4 },
          window.location.origin
        );
      } else {
        viewerRef.current?.contentWindow?.postMessage(
          { type: 'bullet-drag', deltaX: deltaX * 1.8, deltaY: deltaY * 0.8 },
          window.location.origin
        );
      }
    } else if (activeTouches.current.size >= 2) {
      const [t1, t2] = [...activeTouches.current.values()];
      const currentDist = Math.hypot(t1.x - t2.x, t1.y - t2.y);
      const currentMid = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 };

      // Pinch to zoom: spreading fingers zooms in, pinching zooms out
      if (initialPinchDist.current !== null) {
        const distDelta = currentDist - initialPinchDist.current;
        if (Math.abs(distDelta) > 0.5) {
          viewerRef.current?.contentWindow?.postMessage(
            { type: 'bullet-zoom', delta: distDelta * 0.5 },
            window.location.origin
          );
          initialPinchDist.current = currentDist;
        }
      }

      // Two-finger pan
      if (prevMidpoint.current) {
        const panDeltaX = currentMid.x - prevMidpoint.current.x;
        const panDeltaY = currentMid.y - prevMidpoint.current.y;
        if (Math.hypot(panDeltaX, panDeltaY) > 1) {
          viewerRef.current?.contentWindow?.postMessage(
            { type: 'bullet-pan', deltaX: panDeltaX * 1.4, deltaY: panDeltaY * 1.4 },
            window.location.origin
          );
          prevMidpoint.current = currentMid;
        }
      }
    }
  };

  const handleStageTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      activeTouches.current.delete(e.changedTouches[i].identifier);
    }
    if (activeTouches.current.size === 0) {
      initialPinchDist.current = null;
      prevMidpoint.current = null;
      lastSingleTouch.current = null;
      setTouchFeedback(null);
    } else if (activeTouches.current.size === 1) {
      const [t] = activeTouches.current.values();
      lastSingleTouch.current = { x: t.x, y: t.y };
      initialPinchDist.current = null;
      prevMidpoint.current = null;
      setTouchFeedback(interactiveMode === 'move' ? 'Moving anchor' : 'Rotating 360°');
    }
  };

  const handleResetView = () => {
    viewerRef.current?.contentWindow?.postMessage(
      { type: 'bullet-reset' },
      window.location.origin
    );
  };

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative min-h-[100svh] overflow-hidden border-b border-white/10 bg-black text-white"
      aria-labelledby="creative-title"
    >
      {/* 3D Model Iframe Layer */}
      <div className="absolute inset-0 pt-16 md:pt-0">
        <iframe
          ref={viewerRef}
          src="/bullet-reference/index.html?embedded=1"
          title="Interactive Royal Enfield Bullet 350 3D Model"
          className={`h-full w-full border-0 transition-opacity duration-300 ${
            has3DFallback ? 'opacity-0 pointer-events-none' : isTouchDevice ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        />
      </div>

      {/* Fallback Static Visual if 3D context is completely unavailable */}
      {has3DFallback && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/creative-og.jpg"
            alt="Royal Enfield Bullet 350"
            className="h-full w-full object-cover object-center opacity-40 mix-blend-luminosity filter blur-[1px] md:blur-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}

      {/* Dedicated Interactive 3D Square in Center on Mobile: pinch to zoom, move & orbit; rest of screen scrolls freely */}
      {isTouchDevice && !has3DFallback && (
        <div
          className="absolute left-1/2 top-[47%] z-[2] aspect-square w-[min(84vw,340px)] -translate-x-1/2 -translate-y-1/2 touch-none select-none rounded-2xl border border-white/15 bg-white/[0.02] shadow-2xl backdrop-blur-[2px] transition-colors active:border-white/30"
          onTouchStart={handleStageTouchStart}
          onTouchMove={handleStageTouchMove}
          onTouchEnd={handleStageTouchEnd}
          onTouchCancel={handleStageTouchEnd}
          role="region"
          aria-label="3D Model Interactive Center Square. Drag to rotate or move; pinch to zoom. Touch outside to scroll."
        >
          {/* Corner Framing Brackets */}
          <span className="pointer-events-none absolute left-2 top-2 size-3.5 border-l-2 border-t-2 border-white/40 rounded-tl-sm" />
          <span className="pointer-events-none absolute right-2 top-2 size-3.5 border-r-2 border-t-2 border-white/40 rounded-tr-sm" />
          <span className="pointer-events-none absolute bottom-2 left-2 size-3.5 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
          <span className="pointer-events-none absolute bottom-2 right-2 size-3.5 border-b-2 border-r-2 border-white/40 rounded-br-sm" />

          {/* Top Control Bar of Interactive Square */}
          <div className="pointer-events-auto absolute left-2.5 right-2.5 top-2.5 flex items-center justify-between gap-2">
            {/* Mode Switcher */}
            <div className="inline-flex items-center rounded-full border border-white/15 bg-black/85 p-0.5 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setInteractiveMode('orbit'); }}
                aria-pressed={interactiveMode === 'orbit'}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] transition-all cursor-pointer ${
                  interactiveMode === 'orbit'
                    ? 'bg-white font-semibold text-black shadow-sm'
                    : 'bg-transparent text-white/55 hover:text-white'
                }`}
              >
                Orbit 360°
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setInteractiveMode('move'); }}
                aria-pressed={interactiveMode === 'move'}
                className={`rounded-full px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] transition-all cursor-pointer ${
                  interactiveMode === 'move'
                    ? 'bg-white font-semibold text-black shadow-sm'
                    : 'bg-transparent text-white/55 hover:text-white'
                }`}
              >
                Move
              </button>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleResetView(); }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/85 px-2.5 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.14em] text-white/70 shadow-lg backdrop-blur-md transition-all hover:border-white/30 hover:text-white active:scale-95 cursor-pointer"
            >
              <span>↺</span>
              <span>Reset</span>
            </button>
          </div>

          {/* Floating tactile guidance at bottom of the square */}
          <div className="pointer-events-none absolute inset-x-3 bottom-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.14em] text-white/45">
            <span>
              {touchFeedback || (interactiveMode === 'move' ? 'Drag to move anchor · Pinch to zoom' : '1-finger orbit · Pinch to zoom')}
            </span>
            <span className="opacity-40">Interactive Square</span>
          </div>
        </div>
      )}

      {/* Cinematic Vignette Gradients */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.8)_0%,transparent_22%,transparent_70%,rgba(0,0,0,0.95)_100%)]"
        aria-hidden="true"
      />

      {/* Overlay Content / HUD */}
      <div className="pointer-events-none relative z-[1] flex min-h-[100svh] flex-col justify-between px-[clamp(20px,5vw,72px)] pb-[max(24px,env(safe-area-inset-bottom))] pt-[clamp(88px,11vh,116px)]">
        {/* Top Header / Masthead */}
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/60 md:text-[10px]">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              <span>Automotive Creator · Digital Cinema</span>
            </div>
            <h1
              id="creative-title"
              className="mt-1 font-heading text-[clamp(2.1rem,7.5vw,7.5rem)] font-bold tracking-[-0.065em] text-white leading-[0.9]"
            >
              <span className="text-white/60">guywith</span>
              <span className="text-white">black350</span>
            </h1>
          </div>

        </div>

        {/* Bottom Control & Narrative Deck */}
        <div className="mt-auto flex flex-col items-start justify-between gap-4 pt-6 md:gap-6 lg:flex-row lg:items-end">
          {/* Left Narrative Block */}
          <div className="max-w-md lg:max-w-lg">
            <p className="m-0 font-heading text-[clamp(1.05rem,1.55vw,1.35rem)] font-semibold leading-[1.32] tracking-[-0.02em] text-white">
              I document machines, roads, and the stories built around them.
            </p>

            <div className="mt-2.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/50 md:text-[10px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white/80">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                70M+ Views
              </span>
              <span className="text-white/20" aria-hidden="true">/</span>
              <span>Automotive Cinema</span>
            </div>

            <div className="mt-3.5 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.16em] md:text-[9.5px]">
              <a
                href="#top-reels"
                className="pointer-events-auto inline-flex items-center gap-1 border-b border-white/40 pb-0.5 text-white transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Explore stories</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="#impact"
                className="pointer-events-auto inline-flex items-center gap-1 text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Audience signal</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          {/* Right Controls & CTA Deck */}
          <div className="flex w-full flex-col items-start gap-2.5 sm:w-auto sm:items-end">
            {/* Controls Row: Finish Switcher + Instagram CTA */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2.5 sm:w-auto sm:justify-end">
              {/* Finish Switcher Dock */}
              {!has3DFallback && (
                <div className="pointer-events-auto inline-flex items-center rounded-full border border-white/15 bg-black/80 p-0.5 sm:p-1 backdrop-blur-xl shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleSelectFinish('premium')}
                    aria-pressed={activeFinish === 'premium'}
                    className={`inline-flex min-h-6 sm:min-h-7 items-center rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.14em] cursor-pointer transition-all ${
                      activeFinish === 'premium'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-transparent text-white/55 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Black Gold
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFinish('black')}
                    aria-pressed={activeFinish === 'black'}
                    className={`inline-flex min-h-6 sm:min-h-7 items-center rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.14em] cursor-pointer transition-all ${
                      activeFinish === 'black'
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-transparent text-white/55 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Standard Black
                  </button>
                </div>
              )}

              {/* Instagram CTA */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex min-h-6 sm:min-h-7 items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.14em] text-black no-underline shadow-md transition-transform hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <FaInstagram className="text-[10px] sm:text-xs" aria-hidden="true" />
                <span>{instagramHandle}</span>
              </a>
            </div>

            {/* Interaction hint */}
            {!has3DFallback && (
              <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-white/40 md:text-[9px]">
                {isTouchDevice ? 'Use 360° Stage to orbit, zoom & move · Scroll freely outside' : 'Drag to orbit 360° · Scroll to zoom · Ctrl + drag to pan'}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
