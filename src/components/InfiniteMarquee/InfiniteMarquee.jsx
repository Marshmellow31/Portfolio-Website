import React from 'react';
import { motion } from 'framer-motion';

// We duplicate the children to create the infinite scroll effect
const MarqueeRow = ({ items, reverse = false, speed = 40 }) => {
  return (
    <div className="flex overflow-hidden group">
      <motion.div
        className="flex whitespace-nowrap flex-nowrap w-max"
        animate={{
          x: reverse ? ['-50%', '0%'] : ['0%', '-50%'],
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: speed,
        }}
      >
        {/* Render twice for seamless loop */}
        <div className="flex items-center justify-around w-max shrink-0 px-4">
          {items.map((item, idx) => (
            <div 
              key={`first-${idx}`} 
              className="flex items-center gap-4 px-8 md:px-12 py-2 group/item hover:scale-125 transition-transform duration-300 cursor-default"
            >
              <div className="text-[3rem] md:text-[4rem] lg:text-[5rem] opacity-60 group-hover/item:opacity-100 transition-opacity duration-300 drop-shadow-xl">
                {item.icon}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-around w-max shrink-0 px-4">
          {items.map((item, idx) => (
            <div 
              key={`second-${idx}`} 
              className="flex items-center gap-4 px-8 md:px-12 py-2 group/item hover:scale-125 transition-transform duration-300 cursor-default"
            >
              <div className="text-[3rem] md:text-[4rem] lg:text-[5rem] opacity-60 group-hover/item:opacity-100 transition-opacity duration-300 drop-shadow-xl">
                {item.icon}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default function InfiniteMarquee({ rows }) {
  return (
    <div className="w-full relative overflow-hidden py-4">
      {/* Gradients on edges to fade out the marquee */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
      
      <div className="flex flex-col gap-6 md:gap-10">
        {rows.map((row, index) => (
          <MarqueeRow 
            key={index} 
            items={row.items} 
            reverse={index % 2 !== 0} 
            speed={row.speed || 30} 
          />
        ))}
      </div>
    </div>
  );
}
