import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function Section({ children, className = '', id }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`relative px-6 md:px-12 lg:px-24 py-24 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </motion.section>
  );
}
