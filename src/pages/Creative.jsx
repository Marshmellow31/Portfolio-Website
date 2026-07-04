import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FaInstagram, FaPlay, FaEye, FaHandshake, FaChartLine } from 'react-icons/fa';
import Section from '../components/Section/Section';
import { fadeUp } from '../utils/animations';
import {
  instagramHandle,
  instagramUrl,
  stats,
  featuredReels,
  brandCollabs,
  insights,
} from '../data/instagram';

/* ── Animated counter hook ── */
function useCountUp(target, duration = 2000, startCounting = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start * 10) / 10);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);
  return count;
}

/* ── Stat Card with animated number ── */
function StatCard({ label, value, suffix }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const animatedValue = useCountUp(value, 1800, isInView);

  const display = Number.isInteger(value)
    ? Math.floor(animatedValue).toLocaleString()
    : animatedValue.toFixed(1);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      className="relative p-6 border border-card-border bg-surface group hover:border-accent/50 transition-all duration-500"
    >
      <div className="font-heading text-5xl md:text-6xl text-accent mb-2">
        {display}{suffix}
      </div>
      <div className="text-xs text-text-muted uppercase tracking-widest font-mono">{label}</div>
      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

export default function Creative() {
  return (
    <div className="pt-20">
      {/* ──── Hero ──── */}
      <section className="relative w-full min-h-[70vh] flex items-center overflow-hidden border-b border-card-border">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-bg to-accent/10 z-0" />
        <div className="absolute inset-0 bg-grid z-0" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="flex items-center gap-3 mb-6"
              >
                <FaInstagram className="text-accent text-xl" />
                <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase">
                  Content Creator
                </p>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="font-heading text-6xl md:text-8xl lg:text-9xl leading-none text-white"
              >
                GUY WITH
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="font-heading text-6xl md:text-8xl lg:text-9xl leading-none text-outline"
              >
                BLACK 350
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="font-serif italic text-xl md:text-2xl mt-8 text-text-muted max-w-lg"
              >
                Content Creator • Automotive Enthusiast • Brand Collaborator
              </motion.p>
            </div>

            <motion.a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-mono text-sm uppercase tracking-widest flex items-center gap-3 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
            >
              <FaInstagram className="text-lg" />
              <span>Follow {instagramHandle}</span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ──── Stats ──── */}
      <Section id="stats" className="py-24 border-b border-card-border">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">
          The Numbers
        </motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-12 uppercase">
          Growth & Impact
        </motion.h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Section>

      {/* ──── Featured Reels ──── */}
      <Section id="reels" className="py-24 border-b border-card-border">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">
          <FaPlay className="inline mr-2 text-xs" /> Top Performing
        </motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-12 uppercase">
          Featured Reels
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredReels.map((reel, i) => (
            <motion.a
              key={reel.title}
              href={reel.link}
              target="_blank"
              rel="noopener noreferrer"
              variants={fadeUp}
              className="group relative aspect-[9/16] border border-card-border bg-surface overflow-hidden cursor-pointer block"
            >
              {/* Placeholder gradient background when no thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-accent/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                <FaInstagram className="text-4xl text-white/40" />
                <span className="font-mono text-xs text-text-muted uppercase tracking-widest">Reel {i + 1}</span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaPlay className="text-3xl text-white" />
                <span className="font-mono text-xs text-white uppercase tracking-widest">Watch on Instagram</span>
              </div>

              {/* Bottom info strip */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="font-heading text-lg text-white uppercase">{reel.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <FaEye className="text-accent text-xs" />
                  <span className="font-mono text-xs text-accent">{reel.views} views</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </Section>

      {/* ──── Brand Collaborations ──── */}
      <Section id="collabs" className="py-24 border-b border-card-border">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">
          <FaHandshake className="inline mr-2" /> Partnerships
        </motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-12 uppercase">
          Brand Collaborations
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {brandCollabs.map((collab) => (
            <motion.div
              key={collab.name}
              variants={fadeUp}
              className="group p-8 border border-card-border bg-surface hover:border-accent/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="font-heading text-3xl uppercase text-white group-hover:text-accent transition-colors duration-300 mb-3">
                {collab.name}
              </h3>
              <p className="font-mono text-sm text-text-muted mb-4">{collab.description}</p>
              <div className="flex items-center gap-2">
                <FaEye className="text-accent text-xs" />
                <span className="font-mono text-xs text-accent">{collab.reach}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ──── Insights ──── */}
      <Section id="insights" className="py-24">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">
          <FaChartLine className="inline mr-2" /> Analytics
        </motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-12 uppercase">
          Key Insights
        </motion.h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight) => (
            <motion.div
              key={insight.label}
              variants={fadeUp}
              className="p-6 border border-card-border bg-surface group hover:border-accent/50 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="font-heading text-4xl md:text-5xl text-white group-hover:text-accent transition-colors duration-300 mb-2">
                  {insight.value}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-widest font-mono">{insight.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
