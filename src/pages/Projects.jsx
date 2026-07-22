import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectedWork } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';
import useSEO from '../utils/useSEO';

/* Each card's image area preserves the screenshot's real proportions
   (object-contain, letterboxed) instead of cropping to a fixed ratio —
   portrait phone shots and wide desktop shots both stay fully visible.
   All text lives in a solid panel below the image, so nothing ever
   overlaps the photo. */
function ShowcaseCard({ project }) {
  const images = project.images?.length ? project.images : [project.image];
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setImgIndex(i => (i + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="group rounded-2xl overflow-hidden border border-border bg-white/[0.02] hover:border-white/15 transition-colors duration-300 h-full flex flex-col">
      {/* Image box — sized to fit the photo, never crops or overlaps text */}
      <Link
        to={`/projects/${project.slug}`}
        className="relative flex items-center justify-center bg-black/30 h-80 sm:h-72 md:h-80 p-3 sm:p-5 md:p-6 flex-none"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIndex}
            src={images[imgIndex]}
            alt={project.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full object-contain"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-200 ${i === imgIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Text panel — always below the image, own background, never overlapping */}
      <div className="p-6 md:p-7 border-t border-border flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          {project.live ? (
            <span className="font-mono text-[10px] tracking-[.14em] text-black bg-white rounded-[3px] px-2 py-0.5">
              LIVE
            </span>
          ) : (
            <span className="font-mono text-[10px] tracking-[.14em] text-white/70 border border-white/20 rounded-[3px] px-2 py-0.5">
              {project.statusLabel || 'IN DEVELOPMENT'}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
            {project.type}
          </span>
        </div>

        <Link to={`/projects/${project.slug}`} className="no-underline">
          <h2 className="font-bold text-2xl md:text-[26px] text-text-bright mb-2 tracking-tight group-hover:text-white transition-colors">
            {project.title}
          </h2>
        </Link>

        <p className="text-text-dim text-[14px] leading-relaxed mb-4 max-w-[560px]">
          {project.description}
        </p>

        <div className="font-mono text-[11px] tracking-widest text-text-faint mb-5">
          {project.stackLine}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-5">
          <Link
            to={`/projects/${project.slug}`}
            className="font-mono text-[12px] tracking-widest text-black bg-white hover:bg-white/85 no-underline rounded-[3px] px-4 py-2 transition-colors font-bold"
          >
            SEE DETAILS →
          </Link>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] tracking-widest text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
            >
              VISIT ↗
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] tracking-widest text-text-dim no-underline border-b border-white/[0.15] pb-0.5 hover:text-text transition-colors"
            >
              CODE ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  useSEO({ title: 'Projects', description: 'Nine shipped projects — payments, bookings, PWAs, native Android, and AI tools — each with a full case study.', path: '/projects' });
  const featuredWork = selectedWork
    .filter(p => p.featured !== false)
    .map((p, i) => ({ ...p, num: String(i + 1).padStart(2, '0') }));
  const clientSites = selectedWork.filter(p => p.featured === false);

  return (
    <div className="min-h-screen">
      <section id="projects" className="px-[clamp(20px,6vw,96px)] pt-[90px] pb-6">
        <Reveal>
          <div className="flex items-center gap-[14px] mb-4">
            <div className="w-10 h-px bg-text" />
            <span className="mono-label">Projects</span>
          </div>
          <h1
            className="m-0 font-bold text-text-bright mb-8"
            style={{
              fontSize: 'clamp(40px,7vw,100px)',
              letterSpacing: '-0.045em',
              lineHeight: 0.92,
            }}
          >
            ALL PROJECTS
          </h1>
        </Reveal>

        {/* ──────────── FLAGSHIP WORK — box grid ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8 mt-10 max-w-[1800px]">
          {featuredWork.map((p) => (
            <Reveal key={p.title}>
              <ShowcaseCard project={p} />
            </Reveal>
          ))}
        </div>

        {/* ──────────── CLIENT WEBSITES — compact grid ──────────── */}
        {clientSites.length > 0 && (
          <div className="mt-20 pt-12 border-t border-border">
            <Reveal>
              <div className="flex items-center gap-[14px] mb-2">
                <div className="w-10 h-px bg-text-faint" />
                <span className="mono-label text-text-faint">Some More Client Projects</span>
              </div>
              <p className="text-text-dim text-sm max-w-[560px] mb-8">
                A few more client builds — restaurant sites, digital menus, and internal tools delivered fast for local businesses.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {clientSites.map((p) => (
                <Reveal key={p.title}>
                  <Link
                    to={`/projects/${p.slug}`}
                    className="group block no-underline rounded-xl overflow-hidden border border-border bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] relative bg-black/20 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
                        <span className="font-heading text-3xl text-text-faint" style={{ letterSpacing: '-0.02em' }}>
                          {p.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-4"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="font-mono text-[9px] tracking-[.14em] text-text-faint uppercase mb-2">
                        Client Project
                      </div>
                      <h3 className="font-semibold text-text text-base mb-1 group-hover:text-white transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-text-dim text-[13px] leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
