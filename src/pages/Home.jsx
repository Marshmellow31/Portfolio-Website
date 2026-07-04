import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import InfiniteMenu from '../components/InfiniteMenu/InfiniteMenu';
import Lanyard from '../components/Lanyard/Lanyard';
import TextReveal from '../components/TextReveal/TextReveal';
import Experience from '../components/Experience/Experience';
import SkillsMarquee from '../components/SkillsMarquee/SkillsMarquee';
import Section from '../components/Section/Section';
import Capabilities from '../components/Capabilities/Capabilities';
import Testimonials from '../components/Testimonials/Testimonials';
import { items } from '../data/portfolio';
import { fadeUp } from '../utils/animations';

export default function Home({ isLoaded }) {

  return (
    <div className="pt-20">
      {/* ──── Hero ──── */}
      <section className="relative w-full min-h-[calc(100vh-80px)] pb-12 flex items-center overflow-hidden border-b border-card-border">
        {/* Lanyard Graphic - Right Side Layer */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 z-0 cursor-grab active:cursor-grabbing">
          <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} transparent={true} />
        </div>

        {/* Text Content */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 w-full relative z-20 pointer-events-none">
          <div className="flex flex-col items-start justify-center pt-12 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-px w-12 bg-accent" />
              <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase">
                Creative Developer
              </p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-heading text-7xl md:text-8xl lg:text-[10rem] leading-none text-white m-0 p-0"
            >
              HARSHIL
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-heading text-7xl md:text-8xl lg:text-[10rem] leading-none text-outline m-0 p-0"
            >
              PATEL
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="font-serif italic text-xl md:text-3xl mt-8 max-w-xl text-left text-text-muted"
            >
              Crafting premium digital experiences, AI tools, &amp; robust architectures.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12 flex flex-wrap gap-6 pointer-events-auto"
            >
              <a
                href="#interactive"
                className="font-mono uppercase tracking-widest text-xs px-8 py-4 border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300"
              >
                Explore Work
              </a>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
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
      <Section id="about" className="py-32 border-t border-card-border">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Biography */}
          <div>
            <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">01 — About</motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-5xl md:text-6xl font-bold mb-10 uppercase">Who I Am</motion.h2>
            <div className="space-y-6">
              <TextReveal
                text='"I build production web apps, mobile apps, and AI tools — from corporate websites to real client work."'
                className="font-serif italic text-2xl md:text-3xl text-white leading-relaxed"
                delay={0.1}
                staggerDelay={0.03}
              />
              <TextReveal
                text='B.Tech student at IIIT Vadodara (third year, expected 2028). 15+ real projects across web, mobile (Android/Flutter), desktop (Electron), and AI. Shipped websites for real companies. Built and deployed apps used by actual local businesses.'
                className="font-mono text-sm leading-relaxed text-text-muted mt-8"
                delay={0.3}
                staggerDelay={0.01}
              />
            </div>


          </div>

          {/* Capabilities */}
          <motion.div variants={fadeUp}>
            <motion.p className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">Capabilities</motion.p>
            <Capabilities />
          </motion.div>
        </div>
      </Section>

      {/* ──── Projects Sphere ──── */}
      <section id="interactive" className="relative w-full h-[200vh] bg-black border-y border-card-border">
        {/* Sticky container that locks to the screen */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between">
          {/* Infinite Menu 3D Background */}
          <div className="absolute inset-0 z-0 h-full w-full">
            <InfiniteMenu items={items} scale={1.5} />
          </div>

          {/* Gradients to blend it into the page seamlessly without obscuring the center */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-bg to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent z-10" />

          <div className="relative z-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto w-full pt-24 pointer-events-none">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-2"
            >
              02 — Interactive Projects
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl md:text-5xl font-bold mb-8"
            >
              Explore My Work
            </motion.h2>
          </div>

          <div className="relative z-20 w-full flex items-end justify-center pb-12 pointer-events-none mt-auto">
            <p className="text-white font-mono text-xs tracking-widest uppercase opacity-70 bg-black/50 px-4 py-2 rounded-full border border-card-border">
              Drag to Rotate • Click to Visit
            </p>
          </div>
        </div>
      </section>

      {/* ──── View Projects Button ──── */}
      <Section id="featured-project" className="py-24 border-b border-card-border flex flex-col items-center justify-center text-center">
        <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-6">03 — Portfolio</motion.p>
        <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold mb-12">DISCOVER MORE WORK</motion.h2>

        <motion.div variants={fadeUp}>
          <Link
            to="/projects"
            className="inline-flex items-center gap-4 font-mono uppercase tracking-widest text-sm px-10 py-5 bg-white text-black hover:bg-accent hover:text-white transition-all duration-300 font-bold group"
          >
            View All Projects
            <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
          </Link>
        </motion.div>
      </Section>

      {/* ──── Skills ──── */}
      <SkillsMarquee />

      {/* ──── Experience ──── */}
      <Experience />

      {/* ──── Testimonials ──── */}
      <Testimonials />
    </div>
  );
}
