import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const workHistory = [
  {
    company: "PickleRage",
    role: "Freelance / Contract Developer",
    location: "Remote",
    image: "https://placehold.co/600x400/1a1a1a/ff007f?text=PICKLERAGE\\nPROJECT",
    projects: [
      {
        title: "Court Booking App",
        description: "Full-stack court booking application featuring payment gateway integration, digital wallet passes, interactive maps, and a comprehensive admin dashboard with role-based access.",
        stack: ["React 19", "TypeScript", "Firebase", "Razorpay", "Capacitor"]
      },
      {
        title: "Marketing Website",
        description: "High-performance marketing website with premium animations, SEO optimization, and dynamic routing for a pickleball venue.",
        stack: ["React 19", "React Router v7", "Tailwind CSS", "Framer Motion"]
      }
    ]
  },
  {
    company: "Bhumi Developers",
    role: "Web Development Intern",
    location: "Bharuch, Gujarat",
    image: "https://placehold.co/600x400/1a1a1a/ff007f?text=BHUMI\\nDEVELOPERS",
    projects: [
      {
        title: "Corporate Website",
        description: "Corporate site and project portfolio for a real-estate firm. Lenis smooth scrolling, 3D elements, premium animations, PDF brochures.",
        stack: ["Next.js", "React 19", "Tailwind CSS v4", "Framer Motion"]
      },
      {
        title: "BD Buildcon LLP",
        description: "Production-ready marketing site for a turnkey industrial EPC contractor. Filterable project gallery, employee portal, custom motion components.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Lenis"]
      }
    ]
  }
];

export default function Experience() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section 
      id="experience" 
      className="relative w-full py-32 border-t border-card-border bg-bg overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 mb-16">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-4"
        >
          04 — Experience
        </motion.p>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-5xl md:text-7xl font-bold uppercase"
        >
          Work History
        </motion.h2>
      </div>

      <div className="w-full border-t border-card-border group/container">
        {workHistory.map((job, index) => {
          const isExpanded = expandedIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <div 
              key={job.company}
              className="border-b border-card-border group cursor-pointer relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => toggleExpand(index)}
            >
              {/* Massive Row */}
              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-500 hover:bg-surface/50">
                <div className="flex flex-col relative z-10">
                  <h3 className={`font-heading text-5xl md:text-7xl lg:text-[8rem] transition-all duration-500 uppercase m-0 leading-none ${isHovered ? 'text-accent' : 'text-text'} ${hoveredIndex !== null && !isHovered ? 'opacity-30' : 'opacity-100'}`}>
                    {job.company}
                  </h3>
                </div>
                
                <div className={`flex flex-col md:items-end text-left md:text-right relative z-10 transition-opacity duration-500 ${hoveredIndex !== null && !isHovered ? 'opacity-30' : 'opacity-100'}`}>
                  <p className="font-mono text-sm tracking-widest text-text-muted uppercase mb-2">
                    {job.role}
                  </p>
                  <p className="font-serif italic text-text-muted opacity-70">
                    {job.location}
                  </p>
                </div>
              </div>

              {/* Accordion Expansion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden bg-black/20"
                  >
                    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                      {job.projects.map((proj, i) => (
                        <div key={i} className="flex flex-col">
                          <h4 className="font-heading text-3xl mb-4 uppercase">{proj.title}</h4>
                          <p className="font-serif text-lg text-text-muted leading-relaxed mb-6">
                            {proj.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-auto">
                            {proj.stack.map(tech => (
                              <span key={tech} className="text-xs font-mono px-3 py-1 border border-card-border text-text-muted rounded-full">
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
  );
}
