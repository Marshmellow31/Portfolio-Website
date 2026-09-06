import { motion, useReducedMotion } from 'framer-motion';
import { FaInstagram, FaPlay } from 'react-icons/fa';

function ReelSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3" aria-label="Loading top reels">
      {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-[4/5] animate-pulse border border-border bg-white/[0.025]" />)}
    </div>
  );
}

export default function TopReels({ reels, instagramUrl, syncedAt }) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="top-reels" className="section-pad border-b border-border" aria-labelledby="reels-title">
      <div className="mb-[clamp(36px,6vw,72px)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mono-label mb-4">02 — Ranked by Views</div>
          <h2 id="reels-title" className="m-0 text-[clamp(38px,5.5vw,78px)] font-bold leading-[0.96] tracking-[-0.05em]">
            The reels that travelled.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted md:text-base">
            Short-form automotive cinema that resonated across Instagram's algorithm. Tap any card to watch directly on Instagram.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface/50 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-text-dim">
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>Synced {syncedAt}</span>
        </div>
      </div>

      {!reels && <ReelSkeletons />}

      {reels && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
          {reels.map((reel, index) => (
            <motion.a
              key={reel.url}
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${reel.title}, ${reel.views}, on Instagram`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: Math.min(index * 0.05, 0.25) }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-lg bg-surface no-underline transition-all duration-300 hover:shadow-2xl ${
                index === 0 ? 'border border-white/30' : 'border border-border hover:border-white/20'
              }`}
            >
              {/* Background Thumbnail Image */}
              <img
                src={reel.image}
                alt={reel.alt}
                width="337"
                height="599"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              
              {/* Dark Gradient Wash */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/20 transition-opacity duration-300 group-hover:via-black/40" />

              {/* Top Meta Bar */}
              <div className="relative z-10 flex items-start justify-between p-3.5 md:p-5">
                <span className="font-heading text-[clamp(28px,4.5vw,56px)] font-bold leading-none tracking-[-0.06em] text-white/40 group-hover:text-white/70 transition-colors">
                  {String(reel.rank).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <span className="hidden rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-amber-300 sm:inline-block">
                      Flagship
                    </span>
                  )}
                  <div className="grid size-8 place-items-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 md:size-9">
                    <FaPlay className="ml-0.5 text-[9px] text-white/90" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Bottom Content Bar */}
              <div className="relative z-10 p-3.5 md:p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] md:text-[10px]">
                  <span className="font-semibold text-white">{reel.views}</span>
                  <span className="text-white/30" aria-hidden="true">•</span>
                  <span className="text-white/60">{reel.date}</span>
                </div>
                <h3 className="m-0 text-sm font-bold leading-snug text-white transition-colors group-hover:text-white sm:text-base md:text-xl">
                  {reel.title}
                </h3>
                <p className="mt-1.5 hidden text-xs leading-relaxed text-white/65 sm:line-clamp-2 md:text-sm">
                  {reel.caption}
                </p>
                
                {/* Watch Indicator */}
                <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 transition-colors group-hover:text-white">
                  <span>Watch on Instagram</span>
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">↗</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-surface/30 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim no-underline transition-all hover:border-white/40 hover:bg-surface hover:text-white"
        >
          <FaInstagram aria-hidden="true" />
          <span>Explore full Instagram archive</span>
        </a>
      </div>
    </section>
  );
}
