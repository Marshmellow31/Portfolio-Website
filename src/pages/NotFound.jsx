import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSEO from '../utils/useSEO';

export default function NotFound() {
  useSEO({ title: '404 — Page Not Found', noindex: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      >
        <h1
          className="font-heading leading-none text-text-dim opacity-20"
          style={{ fontSize: 'clamp(8rem, 18vw, 16rem)' }}
        >
          404
        </h1>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="font-heading text-4xl md:text-5xl font-bold -mt-12 md:-mt-16 mb-4"
        style={{ letterSpacing: '-0.03em' }}
      >
        Page Not Found
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-[14px] text-text-muted max-w-md mb-10"
      >
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-3 font-mono uppercase tracking-widest text-[13px] px-[26px] py-3.5 rounded-[4px] bg-text text-bg no-underline hover:bg-white transition-colors"
        >
          <span>←</span>
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
