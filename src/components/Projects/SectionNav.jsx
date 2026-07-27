import { useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';

/* The site header is fixed at both sizes — a 64px bar on lg+, and the
   StaggeredMenu's ~56px bar below that — so the sticky bar has to clear it or
   it scrolls underneath and disappears. */
const NAV_OFFSET_DESKTOP = 64;
const NAV_OFFSET_MOBILE = 56;

/* Sticky jump-bar for the project sections.

   `items` are what the bar shows, which is not always one per group: sections
   sharing a band sit on the same row, so they're announced as a single entry
   ("Internship & Research"). Two entries pointing at the same row would fight
   over the active state and both scroll to the same place.

   Every section stays in the DOM — this only scrolls, it never filters — so
   Ctrl+F and crawlers still see all of the work. */
export default function SectionNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);
  const lenis = useLenis();
  const offset = typeof window !== 'undefined' && window.innerWidth >= 1024
    ? NAV_OFFSET_DESKTOP
    : NAV_OFFSET_MOBILE;

  /* Headings are their own elements above each grid, so the active section is
     simply the last heading that has passed under the bar. */
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const band = offset + 140;
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(`section-${item.id}`);
        if (el && el.getBoundingClientRect().top <= band) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items, offset]);

  const jump = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    /* Land the heading just under the sticky bar. Resolved to an absolute
       position rather than handing Lenis the element — a banded heading sits
       inside a nested grid, and the element form lands short of the mark. */
    const y = el.getBoundingClientRect().top + window.scrollY - (offset + 60);
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      className="sticky top-14 lg:top-16 z-[100] -mx-[clamp(16px,4vw,64px)] px-[clamp(16px,4vw,64px)] border-b border-border"
      style={{
        background: 'rgba(10,10,11,.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <nav
        aria-label="Project sections"
        className="flex items-stretch gap-6 md:gap-9 overflow-x-auto hide-scrollbar"
      >
        <span className="hidden md:flex items-center shrink-0 font-mono text-[9px] tracking-[.24em] uppercase text-text-faint pr-1">
          Jump to
        </span>
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => jump(item.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`group relative shrink-0 flex items-baseline gap-2 bg-transparent border-0 cursor-pointer py-3.5 ${
                isActive ? 'text-text-bright' : 'text-text-dim hover:text-text'
              } transition-colors`}
            >
              <span className="font-mono text-[9px] tracking-[.16em] text-text-faint tabular-nums">
                {item.number}
              </span>
              <span className="font-mono text-[11px] tracking-[.16em] uppercase whitespace-nowrap">
                {item.label}
              </span>
              <span className="font-mono text-[9px] text-text-faint tabular-nums">
                {item.count}
              </span>
              {/* underline instead of a pill — reads as an index, not a toolbar */}
              <span
                className={`absolute left-0 right-0 bottom-0 h-px origin-left transition-transform duration-300 bg-white ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 group-hover:bg-white/30'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
