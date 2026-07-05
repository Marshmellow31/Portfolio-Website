import { useRef, useEffect } from 'react';
import '../../lib/strands.js';

/**
 * React wrapper for the <strands-bg> WebGL2 custom element.
 * Desaturated white config per the monochrome Swiss design spec.
 */
export default function StrandsBG({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    // The custom element self-initialises in connectedCallback,
    // so we just need to make sure it's in the DOM (which React handles).
    return () => {
      // disconnectedCallback handles cleanup automatically
    };
  }, []);

  return (
    <strands-bg
      ref={ref}
      className={className}
      colors="#ffffff,#6a6a72"
      count="4"
      speed="0.4"
      amplitude="1"
      waviness="1"
      thickness="0.7"
      glow="2.6"
      taper="3"
      spread="1"
      intensity="0.28"
      saturation="0"
      opacity="0.5"
      scale="1.15"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
