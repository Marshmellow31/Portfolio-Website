import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const capabilities = [
  { title: 'Frontend Dev', tools: ['React 19', 'Next.js', 'Svelte 5', 'Tailwind', 'Framer Motion'] },
  { title: 'Backend / APIs', tools: ['Node.js', 'Firebase', 'MySQL', 'REST APIs'] },
  { title: 'Mobile Dev', tools: ['Android (Kotlin)', 'Flutter', 'Capacitor'] },
  { title: 'AI Integration', tools: ['Ollama', 'Claude', 'Gemini', 'Whisper'] }
];

export default function Capabilities() {
  // Start with the first one open by default so the user sees it's interactive
  const [activeCap, setActiveCap] = useState(0);

  return (
    <div className="flex flex-col w-full border-t border-l border-r border-card-border bg-surface">
      {capabilities.map((cap, i) => {
        const isActive = activeCap === i;
        return (
          <div 
            key={cap.title} 
            className={`border-b border-card-border p-6 lg:p-8 cursor-pointer transition-colors duration-500 ${isActive ? 'bg-accent/5' : 'hover:bg-white/5'}`}
            onClick={() => setActiveCap(isActive ? null : i)}
          >
            <div className="flex justify-between items-center">
               <h4 className={`font-heading text-2xl md:text-3xl uppercase transition-colors duration-500 m-0 ${isActive ? 'text-accent' : 'text-white'}`}>
                 {cap.title}
               </h4>
               <span className={`text-2xl transition-transform duration-500 font-mono ${isActive ? 'rotate-45 text-accent' : 'text-text-muted'}`}>+</span>
            </div>
            <AnimatePresence>
              {isActive && (
                 <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                 >
                    <div className="pt-6 flex flex-wrap gap-2">
                       {cap.tools.map(tool => (
                          <span key={tool} className="px-3 py-1.5 border border-card-border bg-black/40 rounded-full font-mono text-xs tracking-widest text-text-muted uppercase">
                            {tool}
                          </span>
                       ))}
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
