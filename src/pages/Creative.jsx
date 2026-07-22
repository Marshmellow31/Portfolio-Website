import { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { FaInstagram, FaHandshake, FaChartLine, FaExternalLinkAlt } from 'react-icons/fa';
import { Reveal } from '../components/Reveal/Reveal';
import {
  instagramHandle,
  instagramUrl,
  stats,
  brandCollabs,
  insights,
} from '../data/instagram';
import useSEO from '../utils/useSEO';

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
    <Reveal>
      <div
        ref={ref}
        className="relative p-6 border border-border bg-bg group hover:border-border-strong transition-all duration-500"
      >
        <div className="font-heading text-5xl md:text-6xl text-text-bright mb-2" style={{ letterSpacing: '-0.03em' }}>
          {display}{suffix}
        </div>
        <div className="text-xs text-text-dim uppercase tracking-widest font-mono">{label}</div>
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Reveal>
  );
}

export default function Creative() {
  useSEO({ title: 'Guy With Black 350', description: 'The automotive content side of Harshil Patel — the guy with black 350. Reels, brand collaborations, and 22M+ views as @guywithblack350 on Instagram.', path: '/creative' });
  return (
    <div className="pt-24">
      {/* ──── Hero ──── */}
      <section className="relative w-full py-20 md:py-32 flex items-center overflow-hidden border-b border-border">
        <div className="w-full px-[clamp(20px,6vw,96px)] relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div>
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <FaInstagram className="text-text-dim text-xl" />
                  <span className="mono-label">Content Creator</span>
                </div>
              </Reveal>

              <h1
                className="m-0 font-bold leading-none"
                style={{
                  fontSize: 'clamp(40px,7vw,100px)',
                  letterSpacing: '-0.04em',
                }}
              >
                <Reveal as="span" delay={0.1} className="block text-text-bright">GUY WITH</Reveal>
                <Reveal as="span" delay={0.15} className="block text-text-dim">BLACK 350</Reveal>
              </h1>

              <Reveal delay={0.25}>
                <p className="mt-6 text-text-muted max-w-lg" style={{ fontSize: 'clamp(14px,1.2vw,18px)', lineHeight: 1.6 }}>
                  Content Creator • Automotive Enthusiast • Brand Collaborator
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.3}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 font-mono text-[13px] uppercase tracking-widest px-[26px] py-3.5 bg-text text-bg no-underline rounded-[4px] hover:bg-white transition-colors"
              >
                <FaInstagram className="text-lg" />
                <span>Follow {instagramHandle}</span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──── Stats ──── */}
      <section className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(24px,4vw,40px)]">
          <div className="mono-label mb-3">The Numbers</div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(28px,4vw,56px)', lineHeight: 1 }}>
            Growth &amp; Impact
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--color-border)' }}>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ──── Brand Collaborations ──── */}
      <section className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(32px,5vw,56px)]">
          <div className="mono-label mb-4">
            <FaHandshake className="inline mr-2" /> Partnerships
          </div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            Brand Collaborations
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>
          {brandCollabs.map((collab) => (
            <Reveal key={collab.name}>
              <a
                href={collab.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 p-8 bg-bg border border-border hover:border-border-strong transition-all duration-500 relative overflow-hidden no-underline"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-text-faint to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3
                  className="font-heading text-2xl md:text-3xl font-bold text-text group-hover:text-text-bright transition-colors duration-300 m-0"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {collab.name}
                </h3>
                <FaExternalLinkAlt className="text-text-faint text-sm group-hover:text-text transition-colors duration-300 flex-none" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ──── Insights ──── */}
      <section className="section-pad">
        <Reveal className="mb-[clamp(32px,5vw,56px)]">
          <div className="mono-label mb-4">
            <FaChartLine className="inline mr-2" /> Analytics
          </div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            Key Insights
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--color-border)' }}>
          {insights.map((insight) => (
            <Reveal key={insight.label}>
              <div className="p-6 bg-bg border border-border group hover:border-border-strong transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative">
                  <div
                    className="font-heading text-4xl md:text-5xl text-text group-hover:text-text-bright transition-colors duration-300 mb-2"
                    style={{ letterSpacing: '-0.03em' }}
                  >
                    {insight.value}
                  </div>
                  <div className="text-xs text-text-dim uppercase tracking-widest font-mono">{insight.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
