import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'framer-motion';

function AnimatedValue({ target, decimals = 0, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const reducedMotion = useReducedMotion();
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplay(target);
      return;
    }
    const controls = animate(value, target, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, reducedMotion, target, value]);

  return <span ref={ref}>{display.toFixed(decimals)}{suffix}</span>;
}

function LoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading creator analytics">
      <div className="h-72 animate-pulse border border-border bg-white/[0.025]" />
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border border-border bg-white/[0.025]" />)}
      </div>
    </div>
  );
}

export default function CreatorImpact({ sectionRef, snapshot, status }) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="impact" ref={sectionRef} className="section-pad relative overflow-hidden border-b border-border" aria-labelledby="impact-title">
      <div className="pointer-events-none absolute right-[-10%] top-[10%] size-[clamp(280px,45vw,700px)] rounded-full bg-white/[0.03] blur-[120px]" />
      
      <div className="relative mb-[clamp(40px,6vw,80px)] max-w-4xl">
        <div className="mono-label mb-4">01 — Audience Signal</div>
        <h2 id="impact-title" className="m-0 text-[clamp(36px,5.5vw,80px)] font-bold leading-[0.98] tracking-[-0.05em]">
          Every view leaves<br />a measurable trail.
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
          Real-world reach across hundreds of short-form automotive stories. No algorithmic guesswork—structured public metrics grounded in verifiable engagement.
        </p>
      </div>

      {status !== 'ready' && status !== 'error' && <LoadingState />}

      {status === 'error' && (
        <div role="status" className="border border-border bg-surface p-6 text-text-muted">
          The analytics snapshot could not be loaded. The reel links remain available below.
        </div>
      )}

      {snapshot && (
        <div aria-live="polite">
          {/* Telemetry Core Grid */}
          <div className="grid gap-px border border-border bg-border lg:grid-cols-[1.3fr_0.7fr]">
            {/* Primary Stat Card */}
            <div className="relative flex min-h-[380px] flex-col justify-between overflow-hidden bg-bg p-[clamp(28px,5vw,68px)]">
              <div>
                <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">
                  <span>Aggregate public reel views</span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400">Verified signal</span>
                </div>
                <div
                  className="mt-8 inline-flex items-baseline whitespace-nowrap font-heading text-[clamp(68px,12vw,175px)] font-bold leading-[0.8] text-text-bright"
                  aria-label="Approximately 68 million public reel views"
                >
                  <span aria-hidden="true" className="mr-[0.04em] font-normal text-text-muted">≈</span>
                  <span aria-hidden="true" className="tracking-[-0.075em]"><AnimatedValue target={68} suffix="M" /></span>
                </div>
              </div>

              <div className="mt-10 border-t border-white/10 pt-6">
                <p className="m-0 max-w-xl text-sm leading-relaxed text-text-muted md:text-base">
                  Calculated from every accessible public reel count. Instagram reports rounded compact figures, yielding a defensible window of <strong className="font-semibold text-text">66.2M – 69.2M</strong> total impressions.
                </p>
              </div>
            </div>

            {/* 4-Box Telemetry Matrix */}
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                { label: 'Published posts', value: snapshot.profile.publishedPosts.toLocaleString(), note: '330+ active logs' },
                { label: 'Followers', value: '4,300+', note: 'Organic automotive niche' },
                { label: 'Million+ reels', value: snapshot.aggregate.millionViewReels.toLocaleString(), note: 'High viral penetration' },
                { label: 'Top 6 combined', value: `${Math.round(snapshot.aggregate.topSixViews / 1_000_000)}M`, note: 'Peak flagship reach' },
              ].map((metric, i) => (
                <div key={metric.label} className="group flex min-h-44 flex-col justify-between bg-bg p-6 transition-colors hover:bg-white/[0.025] md:p-8">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">
                    <span>{metric.label}</span>
                    <span className="opacity-40">0{i + 1}</span>
                  </div>
                  <div>
                    <span className="block font-heading text-[clamp(28px,3.8vw,52px)] font-semibold leading-none tracking-[-0.05em] text-text-bright">
                      {metric.value}
                    </span>
                    <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                      {metric.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* View Distribution Breakdown */}
          <div className="mt-[clamp(64px,9vw,110px)] grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="mono-label mb-4">Consistency Over Anomalies</div>
              <h3 className="m-0 text-[clamp(28px,4vw,50px)] font-bold leading-[1.05] tracking-[-0.04em]">
                Sustained momentum across hundreds of machines.
              </h3>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-text-muted md:text-base">
                Rather than relying on an isolated viral video, lifetime reach is distributed across {snapshot.profile.accessibleReelUrls} documented reels and cross-country journeys.
              </p>
            </div>

            <div className="space-y-7">
              {snapshot.viewBands.map((band, index) => (
                <div key={band.label} className="group rounded-lg border border-border/60 bg-surface/30 p-4 transition-colors hover:border-border hover:bg-surface/60">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
                      Tier: {band.label}
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-text-bright">
                      {band.count} {band.count === 1 ? 'reel' : 'reels'}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full origin-left rounded-full bg-gradient-to-r from-white/60 to-white/90"
                      initial={reducedMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: band.percentage / 50 }}
                      viewport={{ once: true, amount: 0.7 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: index * 0.05 }}
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Provenance Callout */}
          <div className="mt-16 flex flex-col justify-between gap-4 border border-border bg-surface/40 p-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-text-faint md:flex-row md:items-center md:text-[10px]">
            <span>
              Audit timestamp: {snapshot.capturedAt} · Profile reports {snapshot.profile.publishedPosts} posts · {snapshot.profile.accessibleReelUrls} unique URLs verified
            </span>
            <span className="shrink-0 text-text-dim">
              Data Scope: Public Engagement Only
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
