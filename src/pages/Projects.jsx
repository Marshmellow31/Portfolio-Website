import { motion } from 'framer-motion';
import Section from '../components/Section/Section';
import ProjectCard from '../components/ProjectCard/ProjectCard';
import { projects } from '../data/portfolio';
import { fadeUp } from '../utils/animations';

export default function Projects() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <Section id="projects" className="py-12">
        <div className="flex items-end justify-between mb-24 border-b border-card-border pb-8">
          <div>
            <motion.p variants={fadeUp} className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-4">02 — Selected Work</motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-5xl md:text-7xl font-bold">ALL PROJECTS</motion.h2>
          </div>
        </div>
        
        <div className="flex flex-col gap-32">
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} i={i} fadeUp={fadeUp} />
          ))}
        </div>
      </Section>
    </div>
  );
}
