import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectedWork } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';
import useSEO from '../utils/useSEO';

export default function Projects() {
  useSEO({ title: 'Projects', description: 'Nine shipped projects — payments, bookings, PWAs, native Android, and AI tools — each with a full case study.', path: '/projects' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const activeProject = selectedWork[activeIndex];
  const images = activeProject.images?.length ? activeProject.images : [activeProject.image];

  // Reset image carousel when switching projects
  useEffect(() => { setImgIndex(0); }, [activeIndex]);

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

        {/* ──────────── DESKTOP SPLIT-PANE ──────────── */}
        <div className="hidden lg:flex gap-12 lg:gap-24 relative items-stretch h-[calc(100vh-320px)] min-h-[400px]">
          
          {/* Left Column: Project List */}
          <div className="flex-[0_0_300px] flex flex-col justify-between h-full py-2">
            {selectedWork.map((p, i) => (
              <Link
                key={p.title}
                to={`/projects/${p.slug}`}
                onMouseEnter={() => setActiveIndex(i)}
                className={`no-underline cursor-pointer transition-all duration-300 ${
                  activeIndex === i
                    ? 'text-white opacity-100 translate-x-2'
                    : 'text-text-muted opacity-40 hover:opacity-70'
                }`}
              >
                <h2 className="m-0 font-bold text-3xl tracking-tight leading-none">
                  {p.title}
                </h2>
              </Link>
            ))}
          </div>

          {/* Right Column: Viewer */}
          <div className="flex-1 flex flex-col">
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-surface border border-border shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeIndex}-${imgIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Image Background */}
                  <div
                    className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${images[imgIndex]}")` }}
                  />
                  
                  {/* Gradient Overlay for Text Legibility - confined to bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

                  {/* Carousel controls — only shown when multiple images */}
                  {images.length > 1 && (
                    <>
                      {/* Prev arrow */}
                      <button
                        onClick={e => { e.stopPropagation(); setImgIndex(i => (i - 1 + images.length) % images.length); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                        aria-label="Previous image"
                      >‹</button>
                      {/* Next arrow */}
                      <button
                        onClick={e => { e.stopPropagation(); setImgIndex(i => (i + 1) % images.length); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                        aria-label="Next image"
                      >›</button>
                      {/* Dot indicators */}
                      <div className="absolute top-3 right-4 z-20 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={e => { e.stopPropagation(); setImgIndex(i); }}
                            className={`rounded-full transition-all duration-200 ${i === imgIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                            aria-label={`Image ${i + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Top-left Links */}
                  <div className="absolute top-6 left-8 z-30 flex gap-6 drop-shadow-lg">
                    <Link
                      to={`/projects/${activeProject.slug}`}
                      className="font-mono text-[12px] tracking-widest text-black bg-white hover:bg-white/85 no-underline rounded-[3px] px-2.5 py-1 transition-colors"
                    >
                      CASE STUDY →
                    </Link>
                    {activeProject.link && (
                      <a
                        href={activeProject.link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[12px] tracking-widest text-white hover:text-white/80 no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
                      >
                        VISIT ↗
                      </a>
                    )}
                    {activeProject.github && (
                      <a
                        href={activeProject.github}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[12px] tracking-widest text-white hover:text-white/80 no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
                      >
                        CODE ↗
                      </a>
                    )}
                  </div>

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-4">
                      {activeProject.live && (
                        <span className="font-mono text-[10px] tracking-[.14em] text-black bg-white rounded-[3px] px-2 py-0.5 mt-1">
                          LIVE
                        </span>
                      )}
                    </div>
                    
                    <p className="m-0 text-[16px] leading-relaxed text-white/80 max-w-[80%] mb-6">
                      {activeProject.description}
                    </p>

                    <div className="flex items-center justify-end">
                      <div className="font-mono text-[11px] tracking-widest text-white/60 text-right">
                        {activeProject.stackLine}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ──────────── MOBILE/TABLET FALLBACK (Original List) ──────────── */}
        <div className="flex lg:hidden flex-col">
          <div className="border-t border-border mt-8">
            {selectedWork.map((p) => (
              <Reveal
                key={p.title}
                className="group flex flex-wrap items-baseline gap-y-2 gap-x-8 py-[30px] border-b border-border transition-colors hover:bg-white/[0.025]"
              >
                <div className="font-mono text-[11px] text-text-faint w-8 flex-none">{p.num}</div>

                <div className="flex-[1_1_300px] min-w-[240px]">
                  <div className="flex items-baseline gap-3.5 flex-wrap">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="font-semibold text-text no-underline"
                      style={{ fontSize: 'clamp(20px,2.2vw,28px)', letterSpacing: '-0.02em' }}
                    >
                      {p.title}
                    </Link>
                    {p.live && (
                      <div className="font-mono text-[9px] tracking-[.14em] text-bg bg-text rounded-[3px] px-[7px] py-[3px]">
                        LIVE
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-text-dim max-w-[520px]">
                    {p.description}
                  </p>
                </div>

                <div className="flex-[1_1_220px] min-w-[200px] font-mono text-[11px] leading-[1.8] tracking-[.04em] text-text-faint">
                  {p.stackLine}
                </div>

                <div className="flex-none flex gap-[18px]">
                  <Link
                    to={`/projects/${p.slug}`}
                    className="font-mono text-[11px] tracking-[.1em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
                  >
                    CASE STUDY →
                  </Link>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
                    >
                      LIVE ↗
                    </a>
                  )}
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] tracking-[.1em] text-text-dim no-underline border-b border-white/[0.15] pb-0.5 hover:text-text transition-colors"
                    >
                      CODE ↗
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
