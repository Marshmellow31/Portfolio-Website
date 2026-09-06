import { useEffect, useRef, useState } from 'react';
import { FaInstagram } from 'react-icons/fa';

export default function CreativeHero({ instagramHandle, instagramUrl }) {
  const heroRef = useRef(null);
  const viewerRef = useRef(null);
  const [activeFinish, setActiveFinish] = useState('premium');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFull3DActive, setIsFull3DActive] = useState(false);

  const [has3DFallback, setHas3DFallback] = useState(false);

  const lastTouchX = useRef(0);
  const touchActive = useRef(false);

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

  // Scroll-safe mobile touch handlers: allow vertical native scroll while swiping horizontally rotates the model
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouchX.current = e.touches[0].clientX;
      touchActive.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchActive.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - lastTouchX.current;
    lastTouchX.current = currentX;

    if (Math.abs(deltaX) > 0.5) {
      viewerRef.current?.contentWindow?.postMessage(
        {
          type: 'bullet-drag',
          deltaX: deltaX * 1.5,
        },
        window.location.origin
      );
    }
  };

  const handleTouchEnd = () => {
    touchActive.current = false;
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
            has3DFallback ? 'opacity-0 pointer-events-none' : isTouchDevice && !isFull3DActive ? 'pointer-events-none' : 'pointer-events-auto'
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

      {/* Scroll-Safe Touch Interceptor for Mobile (allows native vertical scroll, relays horizontal drag) */}
      {isTouchDevice && !isFull3DActive && (
        <div
          className="absolute inset-0 z-[2] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          aria-hidden="true"
        />
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
                68M+ Views
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
                {isTouchDevice ? 'Swipe ↔ to orbit · ↕ to scroll' : 'Drag to orbit 360° · Scroll to zoom · Ctrl + drag to pan'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Exit Pill when Mobile Full 3D is active */}
      {isTouchDevice && isFull3DActive && (
        <div className="pointer-events-auto fixed bottom-6 left-1/2 z-50 -translate-x-1/2 shadow-2xl">
          <button
            type="button"
            onClick={() => setIsFull3DActive(false)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-black/85 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl shadow-2xl transition-transform active:scale-95 cursor-pointer"
          >
            <span>✕</span>
            <span>Exit 3D · Resume Normal Scroll</span>
          </button>
        </div>
      )}
    </section>
  );
}
