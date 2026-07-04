import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiDownload, FiVideo } from 'react-icons/fi';
import CustomCursor from './components/CustomCursor/CustomCursor';
import Preloader from './components/Preloader/Preloader';
import Skeleton from './components/Skeleton/Skeleton';

// Only loaded after the user opts in — keeps mediapipe out of the initial bundle
const Handsfree = lazy(() => import('./components/Handsfree/Handsfree'));

// Lazy-loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Creative = lazy(() => import('./pages/Creative'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const NotFound = lazy(() => import('./pages/NotFound'));

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Projects', path: '/projects' },
  { name: 'Creative', path: '/creative' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' },
];

/* ── Page transition wrapper ── */
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Skeleton fallback page ── */
function SkeletonPage() {
  return (
    <div className="pt-28 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 'off' | 'intro' | 'on'
  const [handsfree, setHandsfree] = useState('off');
  const [handsfreeError, setHandsfreeError] = useState(null);
  const location = useLocation();

  // Auto-dismiss the handsfree error toast
  useEffect(() => {
    if (!handsfreeError) return;
    const id = setTimeout(() => setHandsfreeError(null), 4000);
    return () => clearTimeout(id);
  }, [handsfreeError]);

  const toggleHandsfree = () => {
    setHandsfree(prev => (prev === 'off' ? 'intro' : 'off'));
  };

  const handleHandsfreeError = (message) => {
    setHandsfreeError(message);
    setHandsfree('off');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-bg text-text font-sans antialiased selection:bg-accent/30 selection:text-accent relative bg-grid">
      {!isLoaded && <Preloader onComplete={() => setIsLoaded(true)} />}
      <CustomCursor />
      
      {/* ──── Navigation ──── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-xl bg-bg/80' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 h-20 flex items-center justify-between">
          <NavLink to="/" className="font-heading text-xl md:text-2xl font-bold tracking-widest text-white transition-colors duration-300 flex items-center gap-1 group">
            <span>PORT</span>
            <span className="text-outline group-hover:text-white transition-colors duration-300">FOLIO</span>
            <span className="text-accent group-hover:translate-x-1 transition-transform duration-300 inline-block">.</span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex gap-8">
              {navLinks.map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `text-xs font-mono tracking-widest uppercase transition-colors duration-300 ${
                      isActive ? 'text-accent' : 'text-text-muted hover:text-white'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
            {/* Resume Button */}
            <a
              href="/resume.pdf"
              download
              className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300"
            >
              <FiDownload className="text-sm" />
              Resume
            </a>
            {/* Handsfree Mode Toggle */}
            <button
              onClick={toggleHandsfree}
              aria-label={handsfree === 'on' ? 'Disable handsfree mode' : 'Enable handsfree mode'}
              title="Handsfree mode"
              className={`p-2.5 border transition-all duration-300 ${
                handsfree === 'on'
                  ? 'border-accent bg-accent text-white'
                  : 'border-accent text-accent hover:bg-accent hover:text-white'
              }`}
            >
              <FiVideo className="text-sm" />
            </button>
            {/* Availability Indicator */}
            <div className="flex items-center gap-2 border border-card-border px-4 py-1.5 rounded-full bg-card/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-xs font-mono tracking-widest uppercase">Available for Work</span>
            </div>
          </div>

          {/* Mobile: Handsfree Toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleHandsfree}
              aria-label={handsfree === 'on' ? 'Disable handsfree mode' : 'Enable handsfree mode'}
              title="Handsfree mode"
              className={`p-2 border transition-all duration-300 ${
                handsfree === 'on'
                  ? 'border-accent bg-accent text-white'
                  : 'border-accent text-accent'
              }`}
            >
              <FiVideo size={16} />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-[60] text-white p-2"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ──── Mobile Menu Overlay ──── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[55] bg-bg/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              >
                <NavLink
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `font-heading text-4xl uppercase tracking-widest transition-colors duration-300 ${
                      isActive ? 'text-accent' : 'text-white hover:text-accent'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </motion.div>
            ))}
            
            {/* Mobile Resume Button */}
            <motion.a
              href="/resume.pdf"
              download
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center gap-3 text-sm font-mono tracking-widest uppercase px-6 py-3 border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300 mt-4"
            >
              <FiDownload />
              Download Resume
            </motion.a>

            {/* Mobile Availability Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-2 border border-card-border px-4 py-1.5 rounded-full bg-card/50 mt-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-xs font-mono tracking-widest uppercase">Available for Work</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Page Content with Transitions ──── */}
      <Suspense fallback={<SkeletonPage />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home isLoaded={isLoaded} /></PageTransition>} />
            <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
            <Route path="/creative" element={<PageTransition><Creative /></PageTransition>} />
            <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
            <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* ──── Handsfree intro modal (no mediapipe loaded yet) ──── */}
      <AnimatePresence>
        {handsfree === 'intro' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9900] bg-black/85 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <div className="w-full max-w-md border border-card-border bg-surface p-8">
              <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">Experimental</p>
              <h2 className="font-heading text-3xl uppercase tracking-wide text-white mb-4">Enable Handsfree Mode</h2>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Navigate this site with hand gestures using your webcam — move the cursor with an open palm, pinch to click, pinch and drag to scroll.
              </p>
              <p className="text-sm text-text-muted leading-relaxed mb-8">
                Video is processed locally and never leaves your device.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHandsfree('on')}
                  className="flex-1 font-mono text-xs tracking-widest uppercase px-4 py-3 bg-accent text-white hover:bg-accent/80 transition-colors duration-300"
                >
                  Enable
                </button>
                <button
                  onClick={() => setHandsfree('off')}
                  className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-card-border text-text-muted hover:text-white transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Handsfree mode (lazy — mediapipe chunk loads only now) ──── */}
      {handsfree === 'on' && (
        <Suspense fallback={null}>
          <Handsfree
            onExit={() => setHandsfree('off')}
            onError={handleHandsfreeError}
          />
        </Suspense>
      )}

      {/* ──── Handsfree error toast ──── */}
      <AnimatePresence>
        {handsfreeError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9950] border border-accent bg-surface px-5 py-3"
          >
            <p className="font-mono text-xs text-accent uppercase tracking-widest">{handsfreeError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Footer ──── */}
      <footer className="py-8 text-center border-t border-card-border relative z-20 bg-bg">
        <p className="font-mono text-xs text-text-muted uppercase tracking-widest">
          © {new Date().getFullYear()} Harshil Patel. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
