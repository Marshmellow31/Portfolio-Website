import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { FaInstagram } from 'react-icons/fa';

const WORDMARK = 'guywithblack350';

const wordmarkVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035, delayChildren: 0.08 },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: '105%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', bounce: 0, duration: 0.42 },
  },
};

export default function CreativeHero({ instagramHandle, instagramUrl }) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.25 });
  const scale = useTransform(progress, [0, 0.82], [1, 0.68]);
  const y = useTransform(progress, [0, 0.82], [0, -88]);
  const opacity = useTransform(progress, [0, 0.72, 1], [1, 0.9, 0.08]);
  const detailOpacity = useTransform(progress, [0, 0.36], [1, 0]);

  return (
    <section ref={sectionRef} className="relative h-[155svh] border-b border-border" aria-labelledby="creative-title">
      <div className="sticky top-0 flex h-[100svh] min-h-[620px] items-center overflow-hidden px-[clamp(20px,6vw,96px)] pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative w-full">
          <motion.div
            style={reducedMotion ? undefined : { scale, y, opacity }}
            className="origin-left will-change-transform"
          >
            <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-text-dim md:text-[11px]">
              <FaInstagram aria-hidden="true" />
              <span>Automotive creator portfolio</span>
            </div>

            <motion.h1
              id="creative-title"
              aria-label="Guy With Black 350 — automotive content creator"
              variants={wordmarkVariants}
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              className="m-0 flex whitespace-nowrap font-heading font-bold lowercase leading-[0.82] tracking-[-0.065em]"
              style={{ fontSize: 'clamp(2.35rem, 10vw, 9.5rem)' }}
            >
              {WORDMARK.split('').map((letter, index) => (
                <span key={`${letter}-${index}`} className="inline-block overflow-hidden" aria-hidden="true">
                  <motion.span
                    variants={letterVariants}
                    className={`inline-block ${index >= 12 ? 'text-text-bright' : 'text-text-muted'}`}
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}
            </motion.h1>
          </motion.div>

          <motion.div
            style={reducedMotion ? undefined : { opacity: detailOpacity }}
            className="mt-9 flex flex-col items-start justify-between gap-7 md:flex-row md:items-end"
          >
            <p className="m-0 max-w-xl text-[clamp(14px,1.3vw,19px)] leading-relaxed text-text-muted">
              Automotive stories, audience insight, and the reels that turned an XUV into a creator identity.
            </p>
            <div className="flex items-center gap-4">
              <motion.a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-black no-underline transition-colors hover:bg-white/90"
              >
                <FaInstagram aria-hidden="true" /> Follow {instagramHandle}
              </motion.a>
              <a href="#impact" className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim no-underline hover:text-text">
                Scroll to the numbers ↓
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
