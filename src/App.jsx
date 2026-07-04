import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import InfiniteMenu from './components/InfiniteMenu/InfiniteMenu'

/* ─── Project items for the sphere ─── */
const items = [
  {
    image: 'https://picsum.photos/seed/paymatrix/500/500',
    link: 'https://pay-matrix.vercel.app/',
    title: 'PayMatrix',
    description: 'AI-powered expense sharing'
  },
  {
    image: 'https://picsum.photos/seed/jarvis/500/500',
    link: '#projects',
    title: 'J.A.R.V.I.S',
    description: 'Offline voice AI assistant'
  },
  {
    image: 'https://picsum.photos/seed/ascend/500/500',
    link: 'https://github.com/Marshmellow31/Ascend',
    title: 'Ascend',
    description: 'Gamified productivity PWA'
  },
  {
    image: 'https://picsum.photos/seed/playhub/500/500',
    link: '#projects',
    title: 'PlayHub',
    description: 'Court & venue booking'
  },
  {
    image: 'https://picsum.photos/seed/titanic/500/500',
    link: '#projects',
    title: 'Titanic ML',
    description: 'ML prediction in the browser'
  },
  {
    image: 'https://picsum.photos/seed/picklerage/500/500',
    link: 'https://github.com/Marshmellow31/PickleRage-website',
    title: 'PickleRage',
    description: 'Sports venue website'
  },
]

/* ─── Skill categories ─── */
const skills = {
  'Languages': ['TypeScript', 'JavaScript', 'Python', 'C++', 'Java', 'Dart', 'Kotlin', 'SQL'],
  'Frontend': ['React 19', 'Next.js', 'Svelte 5', 'Tailwind CSS', 'Framer Motion', 'Three.js'],
  'Backend': ['Node.js', 'Express', 'Firebase', 'MySQL', 'REST APIs'],
  'Mobile': ['Android (Kotlin)', 'Flutter', 'PWA', 'Capacitor'],
  'AI / ML': ['Ollama', 'Claude API', 'Gemini Vision', 'Whisper STT', 'Embeddings'],
  'Tools': ['Git', 'GitHub Actions', 'Vercel', 'Docker', 'Vitest', 'ESLint'],
}

/* ─── Featured projects ─── */
const projects = [
  {
    title: 'PayMatrix',
    description: 'Premium group-expense platform with AI bill scanning via Gemini Vision, greedy debt-simplification, native UPI deep-linking, and real-time sync.',
    stack: ['React 19', 'Vite', 'Firebase', 'Tailwind CSS', 'Gemini API'],
    link: 'https://pay-matrix.vercel.app/',
    github: 'https://github.com/Marshmellow31/PayMatrix',
  },
  {
    title: 'J.A.R.V.I.S',
    description: 'Fully offline voice AI assistant for Windows — wake word detection, 20+ callable tools, semantic memory, swappable LLM backends.',
    stack: ['Python', 'Whisper', 'Ollama', 'Anthropic API', 'Embeddings'],
    link: null,
    github: null,
  },
  {
    title: 'Ascend',
    description: 'Frosted-glass gamified productivity PWA with XP/levels, Pomodoro timer, 24-week heatmaps, and a command palette.',
    stack: ['Svelte 5', 'Vite', 'Firebase', 'PWA'],
    link: null,
    github: 'https://github.com/Marshmellow31/Ascend',
  },
  {
    title: 'PlayHub',
    description: 'Court booking app with Razorpay payments, Google Wallet passes, Leaflet maps, and admin dashboard with role-based access.',
    stack: ['React 19', 'TypeScript', 'Firebase', 'Capacitor', 'Razorpay'],
    link: null,
    github: null,
  },
  {
    title: 'Titanic Survival Predictor',
    description: 'Interactive ML demo with a 3D Titanic model that reacts to predictions — logistic regression running entirely client-side.',
    stack: ['React', 'TypeScript', 'Three.js', 'Framer Motion'],
    link: null,
    github: null,
  },
  {
    title: 'PickleRage',
    description: 'Marketing website for a pickleball venue with premium animations and SEO optimization.',
    stack: ['React 19', 'React Router v7', 'Framer Motion', 'Vite'],
    link: null,
    github: 'https://github.com/Marshmellow31/PickleRage-website',
  },
]

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

/* ─── Section wrapper ─── */
function Section({ children, className = '', id }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={`relative px-6 md:px-12 lg:px-24 py-24 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </motion.section>
  )
}

/* ─── App ─── */
export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      {/* ──── Floating Nav ──── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg/60 border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 h-16 flex items-center justify-between">
          <a href="#" className="font-heading text-xl font-bold text-accent tracking-tight">HP</a>
          <div className="hidden md:flex gap-8">
            {['About', 'Projects', 'Skills', 'Experience', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-text-muted hover:text-text transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>
          <a
            href="mailto:1080patelharshil@gmail.com"
            className="text-sm px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all duration-300"
          >
            Get in touch
          </a>
        </div>
      </nav>

      {/* ──── Hero — Full-Screen Sphere ──── */}
      <section className="relative w-full h-screen bg-black overflow-hidden">
        <InfiniteMenu items={items} />

        {/* Gradient overlays for text readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/80 via-transparent to-bg/90" />

        {/* Hero text overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-20 md:pb-28">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-accent font-mono text-sm tracking-[0.3em] uppercase mb-4"
          >
            Full-Stack Developer
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-center tracking-tight"
          >
            Harshil Patel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-text-muted text-lg md:text-xl mt-4 max-w-xl text-center"
          >
            B.Tech @ IIIT Vadodara · Builds production apps, AI tools &amp; premium web experiences
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-8 pointer-events-auto flex gap-4"
          >
            <a
              href="#projects"
              className="px-6 py-3 rounded-full bg-accent text-white font-medium hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              View Projects
            </a>
            <a
              href="https://github.com/Marshmellow31"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full border border-white/10 text-text hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              GitHub ↗
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-1 h-1.5 rounded-full bg-accent"
            />
          </div>
        </motion.div>
      </section>

      {/* ──── About ──── */}
      <Section id="about">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2">01 — About</motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold mb-8">Who I Am</motion.h2>
        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4 text-text-muted leading-relaxed">
            <p>
              Full-stack developer and B.Tech student at <span className="text-text font-medium">IIIT Vadodara</span> (third year, expected 2028). 
              I build production web apps, mobile apps, and AI tools — from corporate websites shipped during internships to 
              real client work for local businesses.
            </p>
            <p>
              15+ real projects across web, mobile (Android/Flutter), desktop (Electron), and AI. 
              Shipped websites for real companies. Built and deployed apps used by actual local businesses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Projects Built', value: '15+' },
              { label: 'Tech Stacks', value: '8+' },
              { label: 'Live Deployments', value: '5+' },
              { label: 'Client Projects', value: '6+' },
            ].map(stat => (
              <div key={stat.label} className="p-6 rounded-2xl bg-card border border-card-border backdrop-blur-sm">
                <div className="font-heading text-3xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ──── Projects ──── */}
      <Section id="projects">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2">02 — Projects</motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold mb-12">Featured Work</motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="group relative p-6 rounded-2xl bg-card border border-card-border backdrop-blur-sm hover:border-accent/30 transition-colors duration-500"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-accent font-mono text-xs">0{i + 1}</span>
                  <div className="flex gap-2">
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent transition-colors text-sm">
                        GitHub ↗
                      </a>
                    )}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent transition-colors text-sm">
                        Live ↗
                      </a>
                    )}
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-accent transition-colors duration-300">{project.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map(tech => (
                    <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent/80 border border-accent/10">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ──── Skills ──── */}
      <Section id="skills">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2">03 — Skills</motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold mb-12">Tech Stack</motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([category, techs]) => (
            <motion.div
              key={category}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-card border border-card-border backdrop-blur-sm"
            >
              <h3 className="font-heading text-lg font-bold mb-4 text-accent">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {techs.map(tech => (
                  <span key={tech} className="text-sm px-3 py-1.5 rounded-lg bg-surface text-text-muted border border-card-border hover:text-text hover:border-accent/30 transition-all duration-300 cursor-default">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ──── Experience ──── */}
      <Section id="experience">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2">04 — Experience</motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold mb-12">Work History</motion.h2>
        <motion.div variants={fadeUp} className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-accent/30 to-transparent ml-4 md:ml-6" />
          <div className="pl-12 md:pl-16 space-y-12">
            <div>
              <div className="absolute left-2.5 md:left-4.5 w-3 h-3 rounded-full bg-accent border-2 border-bg" />
              <p className="text-accent font-mono text-xs tracking-wider uppercase mb-1">Freelance / Contract Developer</p>
              <h3 className="font-heading text-xl font-bold mb-1">PickleRage</h3>
              <p className="text-text-muted text-sm mb-4">Remote</p>
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-card border border-card-border">
                  <h4 className="font-medium mb-2">PickleRage — Court Booking App</h4>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Full-stack court booking application featuring payment gateway integration, digital wallet passes, interactive maps, and a comprehensive admin dashboard with role-based access.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['React 19', 'TypeScript', 'Firebase', 'Razorpay', 'Capacitor'].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent/70">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-card border border-card-border">
                  <h4 className="font-medium mb-2">PickleRage — Marketing Website</h4>
                  <p className="text-text-muted text-sm leading-relaxed">
                    High-performance marketing website with premium animations, SEO optimization, and dynamic routing for a pickleball venue.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['React 19', 'React Router v7', 'Tailwind CSS', 'Framer Motion'].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent/70">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-9.5 md:-left-11.5 w-3 h-3 rounded-full bg-accent border-2 border-bg" />
              <p className="text-accent font-mono text-xs tracking-wider uppercase mb-1">Web Development Intern</p>
              <h3 className="font-heading text-xl font-bold mb-1">Bhumi Developers / BD Buildcon LLP</h3>
              <p className="text-text-muted text-sm mb-4">Bharuch, Gujarat</p>
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-card border border-card-border">
                  <h4 className="font-medium mb-2">Bhumi Developers — Corporate Website</h4>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Corporate site and project portfolio for a real-estate firm. Lenis smooth scrolling, 3D elements, premium animations, PDF brochures.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Next.js', 'React 19', 'Tailwind CSS v4', 'Framer Motion'].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent/70">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-card border border-card-border">
                  <h4 className="font-medium mb-2">BD Buildcon LLP — Website</h4>
                  <p className="text-text-muted text-sm leading-relaxed">
                    Production-ready marketing site for a turnkey industrial EPC contractor. Filterable project gallery, employee portal, custom motion components.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Lenis'].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent/70">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ──── Contact ──── */}
      <Section id="contact">
        <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <p className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2">05 — Contact</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">Let's Build Something</h2>
          <p className="text-text-muted text-lg mb-10">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:1080patelharshil@gmail.com"
              className="px-8 py-3.5 rounded-full bg-accent text-white font-medium hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Send an Email
            </a>
            <a
              href="https://github.com/Marshmellow31"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border border-white/10 text-text hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/harshil-patel-5a7373333"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border border-white/10 text-text hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              LinkedIn
            </a>
          </div>
        </motion.div>
      </Section>

      {/* ──── Footer ──── */}
      <footer className="border-t border-card-border py-8 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">© 2025 Harshil Patel. All rights reserved.</p>
          <p className="text-text-muted text-xs font-mono">Built with React · Vite · Tailwind · Framer Motion</p>
        </div>
      </footer>
    </div>
  )
}
