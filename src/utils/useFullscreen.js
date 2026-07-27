import { useCallback, useEffect, useState } from 'react';

/* Cross-browser fullscreen element getter (Safari/older WebKit use the webkit- prefix). */
const fsElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement || null;

const fsSupported = () =>
  typeof document !== 'undefined' &&
  !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

/**
 * Fullscreen control for the game pages.
 *
 * iOS Safari on iPhone has no Element.requestFullscreen — `supported` is false
 * there, so callers can hide the toggle instead of firing a rejected promise.
 */
export default function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(() => !!fsElement());
  const [supported] = useState(fsSupported);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!fsElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const enter = useCallback(() => {
    if (fsElement()) return Promise.resolve();
    const el = targetRef?.current || document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return Promise.resolve();
    // navigationUI hint is ignored where unsupported; the catch keeps a user
    // denying the prompt from surfacing an unhandled rejection.
    return Promise.resolve(req.call(el, { navigationUI: 'hide' })).catch(() => {});
  }, [targetRef]);

  const exit = useCallback(() => {
    if (!fsElement()) return Promise.resolve();
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (!ex) return Promise.resolve();
    return Promise.resolve(ex.call(document)).catch(() => {});
  }, []);

  const toggle = useCallback(() => (fsElement() ? exit() : enter()), [enter, exit]);

  /* Landscape lock is a nice-to-have on Android; it throws on desktop/iOS. */
  const lockLandscape = useCallback(() => {
    try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* unsupported */ }
  }, []);

  return { isFullscreen, supported, enter, exit, toggle, lockLandscape };
}
