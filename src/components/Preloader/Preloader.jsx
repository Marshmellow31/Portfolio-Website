import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Hamster.css';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rapidly count up to 100
    const duration = 2500; // Let the hamster run for 2.5s
    const intervalTime = 25; 
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(Math.floor((currentStep / steps) * 100), 100);
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-screen h-screen z-[100] bg-bg text-white overflow-hidden"
      initial={{ y: 0 }}
      animate={{ y: progress === 100 ? '-100%' : 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.76, 0, 0.24, 1], 
        delay: 0.2 // Brief pause at 100% before sliding up
      }}
      onAnimationComplete={(definition) => {
        if (definition.y === '-100%') {
          onComplete();
        }
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-12">
        {/* Hamster HTML structure */}
        <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
          <div className="wheel"></div>
          <div className="hamster">
            <div className="hamster__body">
              <div className="hamster__head">
                <div className="hamster__ear"></div>
                <div className="hamster__eye"></div>
                <div className="hamster__nose"></div>
              </div>
              <div className="hamster__limb hamster__limb--fr"></div>
              <div className="hamster__limb hamster__limb--fl"></div>
              <div className="hamster__limb hamster__limb--br"></div>
              <div className="hamster__limb hamster__limb--bl"></div>
              <div className="hamster__tail"></div>
            </div>
          </div>
          <div className="spoke"></div>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-1 w-64 bg-card-border overflow-hidden rounded-full">
            <motion.div 
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-text-muted">
            Powering up physics
          </p>
        </div>
      </div>
    </motion.div>
  );
}
