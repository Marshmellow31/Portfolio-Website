import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function TextReveal({ 
  text, 
  className = "", 
  delay = 0, 
  duration = 0.5,
  staggerDelay = 0.02
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  // Split text into words
  const words = text.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0.1, y: 10, filter: "blur(4px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <motion.p
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`${className} flex flex-wrap`}
    >
      {words.map((word, i) => (
        <motion.span 
          key={`${word}-${i}`} 
          variants={childVariants}
          className="mr-[0.25em]" // standard space width
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}
