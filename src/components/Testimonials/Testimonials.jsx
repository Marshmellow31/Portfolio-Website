import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { testimonials } from '../../data/testimonials';
import { fadeUp } from '../../utils/animations';

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="relative px-6 md:px-12 lg:px-24 py-24 w-full border-t border-card-border"
    >
      <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">
        What Clients Say
      </motion.p>
      <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-16 uppercase">
        Testimonials
      </motion.h2>

      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Quote */}
        <div className="min-h-[200px] flex items-start">
          <div className="relative w-full">
            {/* Accent quote mark */}
            <span className="absolute -top-8 -left-2 font-heading text-8xl text-accent/20 leading-none select-none">"</span>
            
            <motion.blockquote
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="font-serif italic text-xl md:text-2xl lg:text-3xl text-white leading-relaxed max-w-4xl pl-8"
            >
              {testimonials[active].quote}
            </motion.blockquote>

            <motion.div
              key={`author-${active}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 pl-8"
            >
              <p className="font-heading text-xl text-accent uppercase">{testimonials[active].name}</p>
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest mt-1">
                {testimonials[active].role} — {testimonials[active].company}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex gap-3 mt-12 pl-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === active ? 'w-8 bg-accent' : 'w-2 bg-card-border hover:bg-text-muted'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

