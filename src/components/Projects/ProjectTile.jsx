import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* The original showcase box, kept at grid scale: a letterboxed image area that
   shows the whole screenshot (never cropped, portrait or landscape), then a
   solid panel below carrying the status, title and stack. No buttons — the
   whole box is the link.

   Projects with a gallery cycle through it on a timer, same as the old cards,
   with dots underneath so it's clear there's more than one screen. */
export default function ProjectTile({ project }) {
  const initials = project.title.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const images = project.images?.length ? project.images : [project.cover];
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    /* offset the start per project so the whole grid doesn't flip in lockstep */
    const stagger = (project.slug.length % 5) * 400;
    let timer;
    const delay = setTimeout(() => {
      setImgIndex((i) => (i + 1) % images.length);
      timer = setInterval(() => setImgIndex((i) => (i + 1) % images.length), 3200);
    }, 3200 + stagger);
    return () => {
      clearTimeout(delay);
      clearInterval(timer);
    };
  }, [images.length, project.slug]);

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex h-full flex-col no-underline rounded-2xl overflow-hidden border border-border bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-colors duration-300"
    >
      <div className="relative aspect-[4/3] flex-none flex items-center justify-center bg-black/30 p-2.5 lg:p-3 overflow-hidden">
        {/* initials sit behind the screenshot as the fallback */}
        <span
          className="absolute font-heading text-3xl text-white/10"
          style={{ letterSpacing: '-0.02em' }}
        >
          {initials}
        </span>

        <AnimatePresence mode="wait">
          <motion.img
            key={imgIndex}
            src={images[imgIndex]}
            alt={project.title}
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`relative w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500 ${
              project.hasShot ? '' : 'grayscale opacity-70 p-3'
            }`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((src, i) => (
              <span
                key={src}
                className={`rounded-full transition-all duration-200 ${
                  i === imgIndex ? 'w-3 h-1 bg-white' : 'w-1 h-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 py-3.5 lg:px-5 lg:py-4 border-t border-border">
        {/* one line, always — a wrapping badge makes every card in the row
            taller than it needs to be */}
        <div className="flex items-center gap-2 mb-2 min-w-0">
          {project.live ? (
            <span className="flex-none font-mono text-[8.5px] tracking-[.14em] whitespace-nowrap text-black bg-white rounded-[3px] px-1.5 py-0.5">
              LIVE
            </span>
          ) : (
            <span className="flex-none font-mono text-[8.5px] tracking-[.14em] whitespace-nowrap text-white/70 border border-white/20 rounded-[3px] px-1.5 py-0.5">
              {project.statusLabel || 'IN DEVELOPMENT'}
            </span>
          )}
          <span className="font-mono text-[8.5px] tracking-[.14em] text-text-faint uppercase truncate">
            {project.type}
          </span>
        </div>

        <h3 className="m-0 font-semibold text-[15px] lg:text-[17px] leading-snug text-text-bright tracking-tight group-hover:text-white transition-colors">
          {project.title}
        </h3>
        <div className="font-mono text-[9.5px] lg:text-[10.5px] tracking-[.1em] text-text-faint truncate mt-1.5">
          {project.stackLine}
        </div>
      </div>
    </Link>
  );
}
