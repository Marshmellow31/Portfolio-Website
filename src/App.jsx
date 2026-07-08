import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { FaCamera } from 'react-icons/fa';
import { useLenis } from 'lenis/react';
import { Analytics } from '@vercel/analytics/react';
import Skeleton from './components/Skeleton/Skeleton';
import FloatingTerminal from './components/FloatingTerminal/FloatingTerminal';
import StaggeredMenu from './components/StaggeredMenu/StaggeredMenu';
import Cursor from './components/Cursor/Cursor';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Creative = lazy(() => import('./pages/Creative'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Playground = lazy(() => import('./pages/Playground'));
const Drive = lazy(() => import('./pages/Drive'));
const Drift = lazy(() => import('./pages/Drift'));

// Nav items — route links to pages + in-page anchors (Home sections)
const navLinks = [
  { name: 'Home', to: '/' },
  { name: 'Projects', to: '/projects' },
  { name: 'Blog', to: '/blog' },
  { name: 'Creative', to: '/creative' },
  { name: 'Contact', to: '/contact' },
  { name: 'Download CV', href: '/resume.pdf', external: true, download: true },
];

function openTerminal() {
  window.dispatchEvent(new CustomEvent('hp-terminal-toggle'));
}

/* ── Skeleton fallback page ── */
function SkeletonPage() {
  return (
    <div className="pt-28 px-6 md:px-12 lg:px-24 w-full">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-16 w-full max-w-2xl mb-4" />
      <Skeleton className="h-16 w-full max-w-xl mb-12" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const onHome = location.pathname === '/';
  // Playground + Drive are their own full-viewport apps — hide the site nav + footer there.
  const isPlayground = ['/playground', '/drive', '/drift'].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change (Lenis-aware)
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [location.pathname, lenis]);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Section anchors work on Home; from any other route, route home first then jump.
  const sectionHref = (hash) => (onHome ? hash : `/${hash}`);
  // For nav items that are routes vs hash anchors
  const navHref = (item) => item.to || sectionHref(item.hash);

  // Reading-progress hairline under the nav
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  return (
    <div className="min-h-screen text-text font-sans antialiased relative">
      {/* ──────────── NAVIGATION (desktop) ──────────── */}
      {!isPlayground && (
        <nav
          className="hidden md:flex fixed top-0 left-0 right-0 z-[200] h-16 items-center justify-between px-[clamp(20px,4vw,48px)] transition-[background,border-color] duration-300"
          style={{
            background: isScrolled ? 'rgba(10,10,11,.72)' : 'rgba(10,10,11,0)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${isScrolled ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,0)'}`,
          }}
        >
          <Link to="/" className="text-[14px] font-semibold tracking-[-0.01em] text-text no-underline">
            Harshil Patel
          </Link>

          <div className="flex items-center gap-[clamp(16px,3vw,32px)]">
            {navLinks.map((item) =>
              item.href ? (
                <a
                  key={item.name}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  download={item.download ? true : undefined}
                  className="font-mono text-[11px] tracking-[.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
                >
                  {item.name}
                </a>
              ) : item.to ? (
                <Link
                  key={item.name}
                  to={item.to}
                  className="font-mono text-[11px] tracking-[.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={sectionHref(item.hash)}
                  className="font-mono text-[11px] tracking-[.12em] uppercase text-text-dim no-underline hover:text-text transition-colors"
                >
                  {item.name}
                </a>
              )
            )}
            <div className="flex items-center gap-3">
              <Link
                to="/playground"
                className="group flex items-center gap-2 font-mono text-[11px] tracking-[.1em] uppercase text-white/70 hover:text-white no-underline bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 transition-all duration-300 backdrop-blur-md"
              >
                <FaCamera className="text-[13px] opacity-80 group-hover:opacity-100 transition-opacity" />
                Playground
              </Link>

              <button
                onClick={openTerminal}
                title="Terminal (⌘K)"
                className="group flex items-center gap-2 font-mono text-[11px] tracking-widest text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 cursor-pointer transition-all duration-300 backdrop-blur-md shadow-sm"
              >
                <span className="uppercase tracking-[.1em]">Terminal</span>
                <span className="opacity-60 bg-black/20 rounded px-1.5 py-0.5 group-hover:opacity-100 transition-opacity">⌘K</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ──────────── NAVIGATION (mobile — StaggeredMenu) ──────────── */}
      {!isPlayground && (
        <div className="md:hidden">
          <StaggeredMenu
            isFixed
            position="right"
            items={[
              ...navLinks.map(item => ({ label: item.name, link: item.href || item.to || sectionHref(item.hash), download: item.download })),
              { label: 'Playground', link: '/playground' },
            ]}
            colors={['#111114', '#1a1a1e']}
            displaySocials={false}
            displayItemNumbering={true}
            accentColor="rgba(255,255,255,0.5)"
            menuButtonColor="#e9e9ef"
            openMenuButtonColor="#e9e9ef"
            logoContent={
              <Link to="/" className="text-[14px] font-semibold tracking-[-0.01em] text-text no-underline">
                Harshil Patel
              </Link>
            }
            onMenuOpen={() => setIsMenuOpen(true)}
            onMenuClose={() => setIsMenuOpen(false)}
          />
        </div>
      )}

      {/* scroll progress hairline */}
      {!isPlayground && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] bg-white/60 z-[210] origin-left"
          style={{ scaleX: progress }}
        />
      )}

      {/* ──────────── Page Content (fade-rise on route change) ──────────── */}
      <ErrorBoundary>
      <Suspense fallback={<SkeletonPage />}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/creative" element={<Creative />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/drive" element={<Drive />} />
          <Route path="/drift" element={<Drift />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </Suspense>
      </ErrorBoundary>

      {/* ──────────── Custom cursor (desktop only) ──────────── */}
      <Cursor />
      <Analytics />

      {/* ──────────── Floating ⌘K terminal (global) ──────────── */}
      <FloatingTerminal />

      {/* ──────────── Footer ──────────── */}
      {!isPlayground && (
        <footer className="flex flex-wrap gap-y-3 gap-x-8 items-center justify-between px-[clamp(20px,6vw,96px)] py-7 border-t border-border">
          <div className="font-mono text-[11px] tracking-[.08em] text-text-faint">
            © 2026 Harshil Patel — built with React, coffee &amp; questionable sleep
          </div>
          <a
            href="mailto:1080patelharshil@gmail.com"
            className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
          >
            <span className="w-[6px] h-[6px] rounded-full bg-text" style={{ animation: 'hpPulse 2s ease-in-out infinite' }} />
            OPEN FOR FREELANCE
          </a>
          <a
            href="#top"
            className="font-mono text-[11px] tracking-[.12em] text-text-dim no-underline hover:text-text transition-colors"
          >
            BACK TO TOP ↑
          </a>
        </footer>
      )}
    </div>
  );
}
