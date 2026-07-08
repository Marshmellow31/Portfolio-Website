import { useEffect, useRef } from 'react';

/* Minimal monochrome cursor: 6px dot + trailing ring that swells over
   interactive elements. Desktop pointer devices only; disabled for
   prefers-reduced-motion. The native cursor stays visible — this is an
   accent, not a replacement. */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dot = dotRef.current, ring = ringRef.current;
    if (!dot || !ring) return;

    let x = -100, y = -100, rx = -100, ry = -100, hover = false, raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target;
      hover = !!(t.closest && t.closest('a, button, [role="button"], input, textarea, select, summary'));
    };
    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%) scale(${hover ? 2.1 : 1})`;
      ring.style.opacity = hover ? 0.9 : 0.45;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    dot.style.display = ring.style.display = 'block';
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  const base = {
    position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 9999,
    borderRadius: '50%', display: 'none', willChange: 'transform',
  };

  return (
    <>
      <div ref={dotRef} style={{ ...base, width: 6, height: 6, background: '#F2F2F3', mixBlendMode: 'difference' }} />
      <div
        ref={ringRef}
        style={{ ...base, width: 30, height: 30, border: '1px solid rgba(242,242,243,.7)', transition: 'opacity .25s ease', mixBlendMode: 'difference' }}
      />
    </>
  );
}
