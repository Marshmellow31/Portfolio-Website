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
      <div className="pointer-events-none absolute right-[-12%] top-[8%] size-[clamp(260px,40vw,650px)] rounded-full bg-white/[0.035] blur-[100px]" />
      <div className="relative mb-[clamp(36px,6vw,72px)] max-w-4xl">
        <div className="mono-label mb-4">01 — Audience signal</div>
        <h2 id="impact-title" className="m-0 text-[clamp(38px,6vw,86px)] font-bold leading-[0.96] tracking-[-0.05em]">
          Every view leaves<br />a measurable trail.
        </h2>
      </div>

      {status !== 'ready' && status !== 'error' && <LoadingState />}

      {status === 'error' && (
        <p role="status" className="border border-border bg-surface p-6 text-text-muted">
          The analytics snapshot could not be loaded. The reel links remain available below.
        </p>
      )}

      {snapshot && (
        <div aria-live="polite">
          <div className="grid gap-px bg-border lg:grid-cols-[1.35fr_.65fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-bg p-[clamp(24px,5vw,64px)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim">Estimated public reel views</div>
              <div
                className="mt-7 inline-flex items-baseline whitespace-nowrap font-heading text-[clamp(72px,13vw,190px)] font-bold leading-[0.78] text-text-bright"
                aria-label="Approximately 68 million public reel views"
              >
                <span aria-hidden="true" className="mr-[0.04em] tracking-normal">≈</span>
                <span aria-hidden="true" className="tracking-[-0.075em]"><AnimatedValue target={68} suffix="M" /></span>
              </div>
              <p className="mt-10 max-w-xl text-sm leading-relaxed text-text-muted md:text-base">
                Calculated from every accessible public reel count. Instagram rounds compact figures, so the defensible range is 66.2M–69.2M.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                { label: 'Profile posts', value: snapshot.profile.publishedPosts.toLocaleString() },
                { label: 'Followers', value: '4,300+' },
                { label: 'Million-view reels', value: snapshot.aggregate.millionViewReels.toLocaleString() },
                { label: 'Top six combined', value: `${Math.round(snapshot.aggregate.topSixViews / 1_000_000)}M` },
              ].map((metric) => (
                <div key={metric.label} className="flex min-h-40 flex-col justify-between bg-bg p-5 md:p-7">
                  <span className="font-heading text-[clamp(30px,4vw,58px)] font-semibold leading-none tracking-[-0.05em] text-text-bright">{metric.value}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-dim md:text-[10px]">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[clamp(56px,8vw,96px)] grid gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-20">
            <div>
              <div className="mono-label mb-4">View distribution</div>
              <h3 className="m-0 text-[clamp(28px,4vw,52px)] font-bold leading-none">Not one viral spike.</h3>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-text-muted md:text-base">
                Hundreds of reels contributed to the lifetime total. The chart groups {snapshot.profile.accessibleReelUrls} accessible reel URLs by their public view count.
              </p>
            </div>

            <div className="space-y-6">
              {snapshot.viewBands.map((band, index) => (
                <div key={band.label}>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">{band.label}</span>
                    <span className="font-heading text-2xl font-semibold tracking-[-0.04em]">{band.count} reels</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-white/[0.06]">
                    <motion.div
                      className="h-full origin-left bg-white/75"
                      initial={reducedMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: band.percentage / 50 }}
                      viewport={{ once: true, amount: 0.7 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.45, delay: index * 0.06 }}
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-14 border-t border-border pt-5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-text-faint md:text-[10px]">
            Public estimate captured {snapshot.capturedAt}. Profile header reports {snapshot.profile.publishedPosts} posts; Instagram exposed {snapshot.profile.accessibleReelUrls} unique reel URLs during the authenticated history scan. Private reach and impressions are excluded.
          </p>
        </div>
      )}
    </section>
  );
}
