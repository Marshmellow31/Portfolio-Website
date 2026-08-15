import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

export default function useInstagramSnapshot() {
  const triggerRef = useRef(null);
  const shouldLoad = useInView(triggerRef, { once: true, margin: '520px 0px' });
  const [state, setState] = useState({ status: 'idle', data: null });

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    setState({ status: 'loading', data: null });
    import('../../data/instagram-snapshot.json')
      .then((module) => {
        if (!cancelled) setState({ status: 'ready', data: module.default });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', data: null });
      });

    return () => { cancelled = true; };
  }, [shouldLoad]);

  return { triggerRef, ...state };
}
