import { useEffect, useRef } from 'react';

/* Mounts the framework-free <hp-terminal> web component once, globally.
   The component self-registers via customElements.define on import, listens for
   ⌘K / Ctrl+K and the `hp-terminal-toggle` window event, and manages its own
   open/minimize/maximize/drag state + localStorage position. */
export default function FloatingTerminal() {
  const hostRef = useRef(null);

  useEffect(() => {
    let el;
    let cancelled = false;
    // Dynamic import keeps the custom-element definition out of the critical path
    // and runs only in the browser.
    import('../../lib/hp-terminal.js').then(() => {
      if (cancelled || !hostRef.current) return;
      el = document.createElement('hp-terminal');
      hostRef.current.appendChild(el);
    });
    return () => {
      cancelled = true;
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" />;
}
