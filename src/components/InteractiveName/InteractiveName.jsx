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
    // 1. Desktop Mouse Movement Parallax
    const handleMouseMove = (e) => {
      // Normalize position to [-1, 1] from center of screen
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    // 2. Mobile Device Gyroscope Parallax
    const handleDeviceOrientation = (e) => {
      // gamma is left/right tilt (usually -90 to 90)
      // beta is front/back tilt (usually -180 to 180)
      
      // Normalize values. We cap them at 45 degrees for maximum effect so users
      // don't have to break their wrists to see the parallax.
      let x = e.gamma ? e.gamma / 45 : 0;
      let y = e.beta ? (e.beta - 45) / 45 : 0; // Assume 45deg tilt is the default holding position

      // Clamp values strictly to [-1, 1]
      x = Math.max(-1, Math.min(1, x));
      y = Math.max(-1, Math.min(1, y));

      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Check if device orientation is available (mobile)
    if (typeof window.DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (typeof window.DeviceOrientationEvent !== 'undefined') {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
    };
  }, [mouseX, mouseY]);

  return (
    <div className="relative pointer-events-none">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{ x: bgX, y: bgY }}
        className="font-heading text-7xl md:text-8xl lg:text-[10rem] leading-none text-white m-0 p-0 block"
      >
        HARSHIL
      </motion.h1>
      
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ x: fgX, y: fgY }}
        className="font-heading text-7xl md:text-8xl lg:text-[10rem] leading-none text-outline m-0 p-0 block"
      >
        PATEL
      </motion.h1>
    </div>
  );
}
