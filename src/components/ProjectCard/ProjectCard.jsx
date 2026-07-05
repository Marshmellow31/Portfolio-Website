import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ProjectCard = ({ project, i, fadeUp }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  // Parallax effect: image moves slightly up/down as we scroll
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-24 items-center`}
    >
      {/* Image Side */}
      <div className="w-full lg:w-1/2 relative group">
        <div className="absolute inset-0 bg-accent/20 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
        <div className="relative w-full bg-surface border border-card-border overflow-hidden flex items-center justify-center p-8 md:p-12 lg:p-16">
          <motion.img 
            src={project.image} 
            alt={project.title}
            style={{ y, willChange: "transform" }}
            className="max-w-full h-auto max-h-[500px] object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-500 mix-blend-luminosity group-hover:mix-blend-normal origin-center"
          />
        </div>
      </div>
      
      {/* Text Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-start">
        <span className="text-accent font-mono text-4xl mb-6 opacity-50">0{i + 1}</span>
        <h3 className="font-heading text-4xl md:text-5xl font-bold mb-6 uppercase">{project.title}</h3>
        <div className="flex flex-wrap gap-3 mb-8">
          {project.stack.map(tech => (
            <span key={tech} className="text-xs font-mono px-3 py-1 border border-card-border text-text-muted">
              {tech}
            </span>
          ))}
        </div>
        <p className="font-serif text-lg leading-relaxed text-text-muted mb-10 max-w-lg">
          {project.description}
        </p>
        
        <div className="flex gap-4">
          {project.link && (
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="font-mono uppercase tracking-widest text-xs px-6 py-3 border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300">
              View Live
            </a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="font-mono uppercase tracking-widest text-xs px-6 py-3 border border-card-border hover:border-white transition-all duration-300">
              Source
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
