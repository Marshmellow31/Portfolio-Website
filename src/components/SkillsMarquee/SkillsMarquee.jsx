import React from 'react';
import InfiniteMarquee from '../InfiniteMarquee/InfiniteMarquee';
import { motion } from 'framer-motion';
import { 
  SiReact, SiNextdotjs, SiSvelte, SiTailwindcss, 
  SiTypescript, SiJavascript, SiPython, SiCplusplus, 
  SiDart, SiKotlin, SiNodedotjs, SiExpress, 
  SiFirebase, SiMysql, SiFlutter, SiAndroid, 
  SiDocker, SiVercel, SiGithubactions, SiGit 
} from 'react-icons/si';

const marqueeData = [
  {
    speed: 55, // Slower speed since the line is much longer
    items: [
      { name: 'React 19', icon: <SiReact color="#61DAFB" /> },
      { name: 'Next.js', icon: <SiNextdotjs color="#ffffff" /> },
      { name: 'Svelte 5', icon: <SiSvelte color="#FF3E00" /> },
      { name: 'Tailwind CSS', icon: <SiTailwindcss color="#06B6D4" /> },
      { name: 'TypeScript', icon: <SiTypescript color="#3178C6" /> },
      { name: 'JavaScript', icon: <SiJavascript color="#F7DF1E" /> },
      { name: 'Node.js', icon: <SiNodedotjs color="#339933" /> },
      { name: 'Express', icon: <SiExpress color="#ffffff" /> },
      { name: 'Python', icon: <SiPython color="#3776AB" /> },
      { name: 'Firebase', icon: <SiFirebase color="#FFCA28" /> },
      { name: 'MySQL', icon: <SiMysql color="#4479A1" /> },
      { name: 'C++', icon: <SiCplusplus color="#00599C" /> },
      { name: 'Vercel', icon: <SiVercel color="#ffffff" /> },
      { name: 'Git', icon: <SiGit color="#F05032" /> },
      { name: 'GitHub Actions', icon: <SiGithubactions color="#2088FF" /> },
      { name: 'REST APIs', icon: <SiNodedotjs color="#339933" /> }, // fallback icon
    ]
  }
];

export default function SkillsMarquee() {
  return (
    <section id="skills" className="w-full relative overflow-hidden pt-12 pb-4">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 mb-6 relative z-20 pointer-events-none">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-accent font-mono text-sm tracking-[0.2em] uppercase mb-4"
        >
          03 — Capabilities
        </motion.p>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-5xl md:text-7xl font-bold uppercase"
        >
          Tech Stack
        </motion.h2>
      </div>

      <InfiniteMarquee rows={marqueeData} />
    </section>
  );
}
