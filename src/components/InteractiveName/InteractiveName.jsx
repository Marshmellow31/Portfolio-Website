import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function InteractiveName({ isLoaded }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the raw values for a premium, heavy feel
  const springConfig = { damping: 40, stiffness: 120, mass: 1.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // HARSHIL (Back layer - moves slightly in the opposite direction)
  const bgX = useTransform(smoothX, [-1, 1], [15, -15]);
  const bgY = useTransform(smoothY, [-1, 1], [15, -15]);
  
  // PATEL (Front layer - moves towards cursor/tilt, creating depth)
  const fgX = useTransform(smoothX, [-1, 1], [-25, 25]);
  const fgY = useTransform(smoothY, [-1, 1], [-25, 25]);

  useEffect(() => {
    // Only react to desktop mouse movement. Disable touch drag so it doesn't interfere with mobile scrolling.
    const handleMouseMove = (e) => {
      // Ignore touch events to prevent mobile issues
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="relative pointer-events-none">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ x: bgX, y: bgY }}
        className="font-heading text-[clamp(7rem,23vw,24rem)] leading-none text-white m-0 p-0 block tracking-tight whitespace-nowrap"
      >
        HARSHIL
      </motion.h1>
      
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ x: fgX, y: fgY }}
        className="font-heading text-[clamp(7rem,23vw,24rem)] leading-none text-outline m-0 p-0 block tracking-tight whitespace-nowrap"
      >
        PATEL
      </motion.h1>
    </div>
  );
}
