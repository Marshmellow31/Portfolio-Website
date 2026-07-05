import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectedWork } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';

export default function Projects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = selectedWork[activeIndex];

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
              <div
                key={p.title}
                onMouseEnter={() => setActiveIndex(i)}
                className={`cursor-pointer transition-all duration-300 ${
                  activeIndex === i 
                    ? 'text-white opacity-100 translate-x-2' 
                    : 'text-text-muted opacity-40 hover:opacity-70'
                }`}
              >
                <h2 className="m-0 font-bold text-3xl tracking-tight leading-none">
                  {p.title}
                </h2>
              </div>
            ))}
          </div>

          {/* Right Column: Viewer */}
          <div className="flex-1 flex flex-col">
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-surface border border-border shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Image Background */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${activeProject.image})` }}
                  />
                  
                  {/* Gradient Overlay for Text Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="m-0 font-bold text-white text-4xl tracking-tight">
                        {activeProject.title}
                      </h3>
                      {activeProject.live && (
                        <span className="font-mono text-[10px] tracking-[.14em] text-black bg-white rounded-[3px] px-2 py-0.5 mt-1">
                          LIVE
                        </span>
                      )}
                    </div>
                    
                    <p className="m-0 text-[16px] leading-relaxed text-white/80 max-w-[80%] mb-6">
                      {activeProject.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[11px] tracking-widest text-white/60">
                        {activeProject.stackLine}
                      </div>
                      
                      <div className="flex gap-6">
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
                            className="font-mono text-[12px] tracking-widest text-white/70 hover:text-white no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors"
                          >
                            CODE ↗
                          </a>
                        )}
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
                    <div
                      className="font-semibold text-text"
                      style={{ fontSize: 'clamp(20px,2.2vw,28px)', letterSpacing: '-0.02em' }}
                    >
                      {p.title}
                    </div>
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
