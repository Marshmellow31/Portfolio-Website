import { useRef } from 'react';
import { motion, useInView, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/* Scroll reveal — opacity 0→1, translateY 18px→0, .7s ease.
   Content is visible by default; only animates when JS runs (progressive).
   Elements already in the top 90% of viewport at load are shown instantly. */
export function Reveal({ children, className = '', as = 'div', delay = 0, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduced = useReducedMotion();

  // Check if element is already near the top of viewport at mount
  // (above 90% viewport height). If so, skip the animation.
  const [wasAboveFold, setWasAboveFold] = useState(false);
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        setWasAboveFold(true);
      }
    }
  }, []);

  const MotionTag = motion[as] || motion.div;
  const skipAnimation = reduced || wasAboveFold;

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={skipAnimation ? false : { opacity: 0, y: 18 }}
      animate={inView || skipAnimation ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={skipAnimation ? { duration: 0 } : { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* Count-up — animates 0 → target over 1100ms cubic ease-out when in view. */
export function CountUp({ target, suffix = '', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? target : 0);
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView || reduced) {
      if (reduced) setDisplay(target);
      return;
    }
    const controls = animate(mv, target, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, target, mv]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontSize: 'clamp(32px,3.5vw,48px)', letterSpacing: '-0.03em' }}
    >
      {display}
      {suffix}
    </span>
  );
}
