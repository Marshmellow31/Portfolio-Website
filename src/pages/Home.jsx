import { lazy, Suspense, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { Reveal, CountUp } from '../components/Reveal/Reveal';
import CopyButton from '../components/CopyButton';
import GithubActivity from '../components/GithubActivity/GithubActivity';
import { skillGroups, workHistory } from '../data/portfolio';
import { testimonials } from '../data/testimonials';
import useMediaQuery from '../utils/useMediaQuery';
import useSEO from '../utils/useSEO';
import { FaCamera, FaJava, FaDatabase } from 'react-icons/fa';
import {
  SiTypescript, SiJavascript, SiPython, SiCplusplus, SiKotlin,
  SiReact, SiSvelte, SiTailwindcss, SiFramer,
  SiNodedotjs, SiExpress, SiFirebase, SiMysql,
  SiAndroid, SiFlutter,
  SiGit, SiDocker, SiVercel, SiEslint
} from 'react-icons/si';

const stackIcons = [
  { Icon: SiTypescript, color: '#3178C6', name: 'TypeScript' },
  { Icon: SiJavascript, color: '#F7DF1E', name: 'JavaScript' },
  { Icon: SiPython, color: '#3776AB', name: 'Python' },
  { Icon: SiCplusplus, color: '#00599C', name: 'C++' },
  { Icon: FaJava, color: '#5382A1', name: 'Java' },
  { Icon: SiKotlin, color: '#7F52FF', name: 'Kotlin' },
  { Icon: FaDatabase, color: '#4479A1', name: 'SQL' },
  { Icon: SiReact, color: '#61DAFB', name: 'React' },
  { Icon: SiSvelte, color: '#FF3E00', name: 'Svelte' },
  { Icon: SiTailwindcss, color: '#06B6D4', name: 'Tailwind' },
  { Icon: SiFramer, color: '#0055FF', name: 'Framer' },
  { Icon: SiNodedotjs, color: '#339933', name: 'Node.js' },
  { Icon: SiExpress, color: '#FFFFFF', name: 'Express' }, // White for dark theme
  { Icon: SiFirebase, color: '#FFCA28', name: 'Firebase' },
  { Icon: SiMysql, color: '#4479A1', name: 'MySQL' },
  { Icon: SiAndroid, color: '#3DDC84', name: 'Android' },
  { Icon: SiFlutter, color: '#02569B', name: 'Flutter' },
  { Icon: SiGit, color: '#F05032', name: 'Git' },
  { Icon: SiVercel, color: '#FFFFFF', name: 'Vercel' }, // White for dark theme
  { Icon: SiDocker, color: '#2496ED', name: 'Docker' },
  { Icon: SiEslint, color: '#4B32C3', name: 'ESLint' }
];

// Desktop-only: keeps three.js + physics (the heaviest chunk) off phones
const StrandsBG = lazy(() => import('../components/StrandsBG/StrandsBG'));
// 3D car teaser for /drive — lazy so three.js loads only when scrolled near
const DriveTeaser = lazy(() => import('../components/DriveTeaser/DriveTeaser'));

/* Per-letter stagger reveal for the hero name */
function SplitLine({ text, delay = 0, reduced }) {
  if (reduced) return <span className="block">{text}</span>;
  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '105%', rotate: 4 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ duration: 0.7, delay: delay + i * 0.035, ease: [0.22, 1, 0.36, 1] }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function Home() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [openAccordion, setOpenAccordion] = useState(null);
  const reducedMotion = useReducedMotion();
  useSEO({ description: 'Full-stack developer at IIIT Vadodara shipping production web, mobile, and AI products for real businesses.', path: '/' });
  // Defer the three.js chunk until the teaser is near the viewport
  const teaserRef = useRef(null);
  const teaserNear = useInView(teaserRef, { margin: '600px 0px', once: true });

  return (
    <div>
      {/* ──────────── HERO ──────────── */}
      <header
        id="top"
        className="relative min-h-screen flex items-center overflow-hidden border-b border-border"
      >
        {/* Strands WebGL background — only shown on larger screens (xl+) to prevent text overlap, completely removed on mobile */}
        {isDesktop && (
          <div className="hidden xl:block absolute inset-y-0 w-full left-[10%] md:left-[17%] z-[1] pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] md:[mask-image:linear-gradient(to_right,transparent_10%,black_40%)]">
            <Suspense fallback={null}>
              <StrandsBG />
            </Suspense>
          </div>
        )}

        <div className="relative z-10 w-full px-[clamp(20px,6vw,96px)] pt-[120px] pb-20 pointer-events-none">
          <div
            className="flex items-center gap-[14px] mb-7 flex-wrap"
            style={{ animation: 'hpFadeUp .8s ease both' }}
          >
            <div className="w-10 h-px bg-text" />
            <span className="mono-label">Full-Stack Developer — IIIT Vadodara</span>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[.14em] uppercase text-text border border-border-strong rounded-full px-3 py-1">
              <span className="w-[6px] h-[6px] rounded-full bg-text" style={{ animation: 'hpPulse 2s ease-in-out infinite' }} />
              Available for freelance
            </span>
          </div>

          <h1
            className="m-0 font-bold text-text-bright"
            style={{
              fontSize: 'clamp(58px,11vw,168px)',
              letterSpacing: '-0.045em',
              lineHeight: 0.92,
            }}
          >
            <SplitLine text="Harshil" delay={0.15} reduced={reducedMotion} />
            <SplitLine text="Patel" delay={0.38} reduced={reducedMotion} />
          </h1>

          <p
            className="mt-9 max-w-[560px] text-text-muted"
            style={{
              fontSize: 'clamp(17px,1.6vw,21px)',
              lineHeight: 1.55,
              animation: 'hpFadeUp .8s .25s ease both',
            }}
          >
            I build production software — web, mobile, and AI tools — shipped to real
            businesses, not just repos.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-11 pointer-events-auto animate-[hpFadeUp_0.8s_ease_0.2s_both]">
            <a
              href="/projects"
              className="inline-flex items-center justify-center bg-text text-bg no-underline text-[13px] font-semibold px-[26px] h-[46px] rounded-[4px] transition-colors hover:bg-white"
            >
              See projects
            </a>
            <a
              href="/playground"
              className="inline-flex items-center justify-center gap-2 text-text no-underline text-[13px] font-medium px-[26px] h-[46px] rounded-[4px] border border-border-strong transition-colors hover:border-white/50"
            >
              <FaCamera className="text-[15px]" /> Playground
            </a>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('hp-terminal-toggle'))}
              className="inline-flex items-center justify-between gap-4 text-text no-underline bg-[#111] border border-border-strong px-5 h-[46px] rounded-[6px] transition-colors hover:border-white/50 cursor-pointer shadow-lg"
            >
              <span className="font-mono text-[13px] font-medium text-text-muted">Terminal</span>
              <div className="flex items-center gap-1.5 ml-2 opacity-80">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
              </div>
            </button>
            <a
              href="/creative"
              className="inline-flex items-center justify-center text-text no-underline text-[13px] font-medium px-[26px] h-[46px] rounded-[4px] border border-border-strong transition-colors hover:border-white/50"
            >
              Creative side
            </a>
          </div>
        </div>

        {/* SCROLL indicator */}
        <div
          className="absolute bottom-6 left-[clamp(20px,6vw,96px)] z-10 font-mono text-text-faint uppercase"
          style={{ fontSize: 10, letterSpacing: '.3em', animation: 'hpPulse 2.6s ease-in-out infinite' }}
        >
          Scroll
        </div>
      </header>

      {/* ──────────── ABOUT ──────────── */}
      <section id="about" className="section-pad border-b border-border">
        <div className="grid gap-[clamp(40px,6vw,96px)] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          <Reveal>
            <div className="mono-label mb-4">01 — About</div>
            <h2
              className="m-0 mb-8 font-bold"
              style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}
            >
              Software that leaves the repo
            </h2>
            <p
              className="m-0 text-text-muted max-w-[620px]"
              style={{ fontSize: 'clamp(17px,1.5vw,20px)', lineHeight: 1.65, textWrap: 'pretty' }}
            >
              Third-year B.Tech CSE at IIIT Vadodara. I've shipped corporate websites, a
              loyalty CRM a salon uses daily, a payments platform in production, and native
              Android tooling — across React, Svelte, Kotlin, Flutter, and AI APIs. I care
              about the last 10%: performance, motion, and the details recruiters can't fake.
            </p>
          </Reveal>

          <Reveal className="flex flex-col justify-end">
            {[
              { label: 'PROJECTS SHIPPED', target: 15, suffix: '+', link: '/projects' },
              { label: 'CLIENT PRODUCTS IN PRODUCTION', target: 6, suffix: '', link: '#experience' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.link}
                className="group flex items-baseline justify-between py-[22px] border-t border-border no-underline text-current hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="font-mono text-[11px] tracking-[.14em] text-text-dim group-hover:text-white transition-colors">
                  {s.label}
                </div>
                <div className="flex items-center gap-4">
                  <CountUp
                    target={s.target}
                    suffix={s.suffix}
                    className="font-bold group-hover:text-white transition-colors"
                  />
                  <span className="font-mono text-[12px] opacity-0 group-hover:opacity-100 transition-opacity text-white/50">
                    ↗
                  </span>
                </div>
              </a>
            ))}
            <div className="flex items-baseline justify-between py-[22px] border-t border-b border-border">
              <div className="font-mono text-[11px] tracking-[.14em] text-text-dim">GRADUATING</div>
              <div className="font-bold" style={{ fontSize: 'clamp(32px,3.5vw,48px)', letterSpacing: '-0.03em' }}>
                2028
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────── CAPABILITIES ──────────── */}
      <section id="capabilities" className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(40px,6vw,72px)]">
          <div className="mono-label mb-4">02 — Capabilities</div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            Stack
          </h2>
        </Reveal>
        <div className="relative overflow-hidden flex items-center py-12 bg-transparent">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 40s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          {/* Fade masks for smooth entry/exit */}
          <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee gap-[4.5rem] px-[2.25rem]">
            {stackIcons.map((item, i) => (
              <div key={i} className="group relative flex justify-center">
                <item.Icon 
                  className="text-[60px] group-hover:scale-110 transition-transform duration-300 cursor-pointer" 
                  style={{ color: item.color }} 
                />
                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] font-mono tracking-widest text-text-muted whitespace-nowrap pointer-events-none">
                  {item.name}
                </span>
              </div>
            ))}
            {stackIcons.map((item, i) => (
              <div key={'dup'+i} className="group relative flex justify-center">
                <item.Icon 
                  className="text-[60px] group-hover:scale-110 transition-transform duration-300 cursor-pointer" 
                  style={{ color: item.color }} 
                />
                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[11px] font-mono tracking-widest text-text-muted whitespace-nowrap pointer-events-none">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── EXPERIENCE ──────────── */}
      <section id="experience" className="border-b border-border" style={{ padding: 'clamp(60px,8vw,120px) 0' }}>
        <div className="px-[clamp(20px,6vw,96px)]">
          <Reveal className="mb-[clamp(40px,6vw,72px)]">
            <div className="mono-label mb-4">03 — Experience</div>
            <h2 className="m-0 font-bold uppercase tracking-tighter" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
              Work History
            </h2>
          </Reveal>
        </div>
        
        <div className="border-t border-border flex flex-col">
          {workHistory.map((job, idx) => {
            const isOpen = openAccordion === idx;
            return (
              <div key={job.company} className="border-b border-border group flex flex-col">
                <button
                  onClick={() => setOpenAccordion(isOpen ? null : idx)}
                  className="w-full text-left px-[clamp(20px,6vw,96px)] py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <h3 
                    className={`m-0 font-bold uppercase tracking-tighter transition-colors duration-500 ${isOpen ? 'text-white' : 'text-white/70 group-hover:text-white'}`} 
                    style={{ fontSize: 'clamp(32px,5vw,72px)', lineHeight: 0.9 }}
                  >
                    {job.company}
                  </h3>
                  <div className="flex flex-col items-start md:items-end mt-4 md:mt-0 opacity-60">
                    <span className="font-mono text-[10px] md:text-[11px] tracking-[.15em] uppercase">{job.role}</span>
                    <span className="font-serif italic text-text-muted mt-1 text-[13px]">{job.location}</span>
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-[clamp(20px,6vw,96px)] pb-8 pt-2 flex flex-col md:flex-row gap-12 md:gap-24">
                        {job.projects.map((proj, pIdx) => (
                          <div key={pIdx} className="flex-1">
                            <h4 className="m-0 font-bold uppercase tracking-tighter text-[18px] md:text-[20px] mb-3 text-white">
                              {proj.name}
                            </h4>
                            <p className="text-[14px] md:text-[15px] leading-relaxed text-text-muted max-w-lg mb-6 text-pretty">
                              {proj.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {proj.stack.map(tech => (
                                <span key={tech} className="font-mono text-[10px] tracking-[.1em] uppercase text-text-dim border border-white/10 rounded-full px-3 py-1">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────── TESTIMONIALS + CLIENTS ──────────── */}
      <section id="trust" className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(40px,6vw,72px)]">
          <div className="mono-label mb-4">04 — Word of mouth</div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            Clients say
          </h2>
        </Reveal>

        <div className="grid gap-px [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" style={{ background: 'var(--color-border)' }}>
          {testimonials.map((t) => (
            <Reveal key={t.name}>
              <figure className="m-0 h-full p-7 md:p-9 bg-bg flex flex-col justify-between gap-8 hover:bg-white/[0.02] transition-colors">
                <blockquote className="m-0 text-text-muted" style={{ fontSize: 15, lineHeight: 1.7, textWrap: 'pretty' }}>
                  “{t.quote}”
                </blockquote>
                <figcaption>
                  <div className="font-semibold text-text text-[14px]">{t.name}</div>
                  <div className="font-mono text-[10px] tracking-[.14em] uppercase text-text-faint mt-1.5">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* client wall */}
        <Reveal className="mt-[clamp(32px,4vw,56px)] pt-8 border-t border-border">
          <div className="flex flex-wrap items-baseline gap-x-[clamp(28px,5vw,64px)] gap-y-4">
            <span className="font-mono text-[10px] tracking-[.2em] text-text-faint uppercase">Shipped for</span>
            {['PickleRage', 'Bhumi Developers', 'BD Buildcon', 'Mann Beauty Studio', 'Hare Krishna', 'Taste of Punjab'].map((c) => (
              <span key={c} className="font-bold text-text-dim hover:text-text transition-colors" style={{ fontSize: 'clamp(17px,2vw,24px)', letterSpacing: '-0.02em' }}>
                {c}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ──────────── DRIVE TEASER ──────────── */}
      <section id="drive" className="section-pad border-b border-border">
        <Reveal className="mb-[clamp(32px,4vw,56px)]">
          <div className="mono-label mb-4">05 — Off the clock</div>
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            Work is monochrome.<br />Play isn't.
          </h2>
        </Reveal>
        <Reveal>
          <div ref={teaserRef}>
            {teaserNear ? (
              <Suspense fallback={<div className="h-[320px] md:h-[380px] rounded-2xl border border-border bg-surface" />}>
                <DriveTeaser />
              </Suspense>
            ) : (
              <div className="h-[320px] md:h-[380px] rounded-2xl border border-border bg-surface" />
            )}
          </div>
        </Reveal>
      </section>

      {/* ──────────── GITHUB ACTIVITY ──────────── */}
      <GithubActivity />

      {/* ──────────── CONTACT ──────────── */}
      <section id="contact" style={{ padding: 'clamp(100px,12vw,180px) clamp(20px,6vw,96px)' }}>
        <Reveal>
          <div className="mono-label mb-6">07 — Contact</div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <a
              href="mailto:1080patelharshil@gmail.com"
              className="block text-text-bright no-underline break-words hover:underline"
              style={{
                fontSize: 'clamp(26px,4.6vw,72px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                textDecorationThickness: '2px',
                textUnderlineOffset: '8px',
              }}
            >
              1080patelharshil@gmail.com
            </a>
            <CopyButton text="1080patelharshil@gmail.com" />
          </div>
          <div className="flex flex-wrap gap-7 mt-12">
            <a
              href="https://github.com/Marshmellow31"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
            >
              GITHUB ↗
            </a>
            <a
              href="https://linkedin.com/in/harshil-patel-5a7373333"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
            >
              LINKEDIN ↗
            </a>
            <div className="font-mono text-[12px] tracking-[.12em] text-text-faint">
              BHARUCH, GUJARAT — IN
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
