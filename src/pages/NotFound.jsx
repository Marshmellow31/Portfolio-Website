import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      >
        <h1 className="font-heading text-[12rem] md:text-[16rem] leading-none text-accent opacity-20">
          404
        </h1>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="font-heading text-4xl md:text-5xl uppercase -mt-12 md:-mt-16 mb-4"
      >
        Page Not Found
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="font-mono text-sm text-text-muted max-w-md mb-10"
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
          className="inline-flex items-center gap-3 font-mono uppercase tracking-widest text-sm px-8 py-4 border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300"
        >
          <span>←</span>
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
