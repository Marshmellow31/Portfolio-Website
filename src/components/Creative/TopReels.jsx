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
          <div className="mono-label mb-4">02 — Ranked by views</div>
          <h2 id="reels-title" className="m-0 text-[clamp(40px,6vw,82px)] font-bold leading-[0.95] tracking-[-0.05em]">The reels that travelled.</h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
          <span className="size-1.5 rounded-full bg-white/60" aria-hidden="true" /> Synced {syncedAt}
        </div>
      </div>

      {!reels && <ReelSkeletons />}

      {reels && (
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
          {reels.map((reel, index) => (
            <motion.a
              key={reel.url}
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${reel.title}, ${reel.views}, on Instagram`}
              initial={reducedMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45, delay: Math.min(index * 0.045, 0.2) }}
              whileTap={reducedMotion ? undefined : { scale: 0.985 }}
              className={`group relative block aspect-[4/5] overflow-hidden bg-surface no-underline ${index === 0 ? 'border border-white/25' : 'border border-border'}`}
            >
              <img
                src={reel.image}
                alt={reel.alt}
                width="337"
                height="599"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/10" />
              <div className="absolute left-3 top-3 font-heading text-[clamp(32px,5vw,68px)] font-bold leading-none tracking-[-0.06em] text-white/45 md:left-5 md:top-5">
                {String(reel.rank).padStart(2, '0')}
              </div>
              <div className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm md:right-5 md:top-5">
                <FaPlay className="ml-0.5 text-[10px]" aria-hidden="true" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <div className="mb-2 flex flex-wrap gap-x-2 font-mono text-[9px] uppercase tracking-[0.13em] md:text-[10px]">
                  <span className="text-white">{reel.views}</span>
                  <span className="text-white/35" aria-hidden="true">•</span>
                  <span className="text-white/60">{reel.date}</span>
                </div>
                <h3 className="m-0 text-base font-bold leading-tight text-white md:text-2xl">{reel.title}</h3>
                <p className="mt-2 hidden text-sm leading-snug text-white/65 sm:line-clamp-2">{reel.caption}</p>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim no-underline transition-colors hover:border-border-strong hover:text-text">
          <FaInstagram aria-hidden="true" /> Explore the full archive
        </a>
      </div>
    </section>
  );
}
