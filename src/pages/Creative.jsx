import { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { FaInstagram, FaPlay, FaEye, FaHandshake, FaChartLine } from 'react-icons/fa';
import { Reveal } from '../components/Reveal/Reveal';
import {
  instagramHandle,
  instagramUrl,
  stats,
  featuredReels,
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

      {/* ──── Featured Reels ──── */}
      <section className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(24px,4vw,40px)]">
          <div className="mono-label mb-3">
            <FaPlay className="inline mr-2 text-[9px]" /> Top Performing
          </div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(28px,4vw,56px)', lineHeight: 1 }}>
            Featured Reels
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--color-border)' }}>
          {featuredReels.map((reel, i) => (
            <Reveal key={reel.title}>
              <a
                href={reel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative border border-border bg-bg overflow-hidden cursor-pointer block no-underline"
              >
                {/* Thumbnail / Placeholder */}
                {reel.thumbnail ? (
                  <img src={reel.thumbnail} alt={reel.title} className="w-full aspect-[4/5] object-cover opacity-60 group-hover:opacity-30 transition-opacity duration-500 block" />
                ) : (
                  <div className="w-full aspect-[16/9] md:aspect-[3/2] bg-surface flex flex-col items-center justify-center gap-3 opacity-100 group-hover:opacity-10 transition-opacity duration-300 px-4 text-center">
                    <FaInstagram className="text-3xl text-text-faint" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FaPlay className="text-3xl text-text" />
                  <span className="font-mono text-xs text-text uppercase tracking-widest">Watch on Instagram</span>
                </div>

                {/* Bottom info strip */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg/90 to-transparent pointer-events-none">
                  <p className="font-heading text-lg text-text m-0">{reel.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaEye className="text-text-faint text-xs" />
                    <span className="font-mono text-xs text-text-faint">{reel.views} views</span>
                  </div>
                </div>
              </a>
            </Reveal>
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
        <div className="grid md:grid-cols-3 gap-px" style={{ background: 'var(--color-border)' }}>
          {brandCollabs.map((collab) => (
            <Reveal key={collab.name}>
              <div className="group p-8 bg-bg border border-border hover:border-border-strong transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-text-faint to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3
                  className="font-heading text-2xl md:text-3xl font-bold text-text group-hover:text-text-bright transition-colors duration-300 mb-3 m-0"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {collab.name}
                </h3>
                <p className="text-[14px] text-text-muted mb-4 m-0">{collab.description}</p>
                <div className="flex items-center gap-2">
                  <FaEye className="text-text-faint text-xs" />
                  <span className="font-mono text-xs text-text-faint">{collab.reach}</span>
                </div>
              </div>
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
