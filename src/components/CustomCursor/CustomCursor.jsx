import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // useMotionValue avoids React state updates for 0 latency
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Spring physics for the outer ring (slight delay)
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const updateMousePosition = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e) => {
      const target = e.target;
      const isClickable = 
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' || 
        target.closest('a') || 
        target.closest('button') ||
        target.closest('.cursor-grab') ||
        target.closest('.cursor-pointer');
        
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, cursorX, cursorY]);

  // We only animate scale, opacity, and colors through Framer Motion variants
  const ringVariants = {
    default: {
      scale: 1,
      opacity: isVisible ? 1 : 0,
      backgroundColor: 'rgba(255, 0, 127, 0)',
      border: '2px solid rgba(255, 0, 127, 0.5)',
    },
    hover: {
      scale: 1.5,
      opacity: isVisible ? 1 : 0,
      backgroundColor: 'rgba(255, 0, 127, 0.1)',
      border: '2px solid rgba(255, 0, 127, 1)',
    },
  };

  const dotVariants = {
    default: { opacity: isVisible ? 1 : 0 },
    hover: { opacity: 0 },
  };

  return (
    <>
      {/* Outer Ring - Uses spring values */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        variants={ringVariants}
        animate={isHovering ? 'hover' : 'default'}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}
      />
      
      {/* Inner Dot - Uses raw motion values for instant tracking */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[10000] bg-accent"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        variants={dotVariants}
        animate={isHovering ? 'hover' : 'default'}
        transition={{ opacity: { duration: 0.2 } }}
      />
    </>
  );
}
