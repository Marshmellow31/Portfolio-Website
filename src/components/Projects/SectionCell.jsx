/* Full-width section header. It sits above its own grid and is separated from
   the section before it by a rule, so where one group ends and the next begins
   is unambiguous — headings inline in the grid read as mixed-up.

   The figure is the section's position in the index (01, 02, 03…), not how many
   projects it holds — the count is spelled out next to it where it can't be
   mistaken for a number.

   `stacked` is for the two sections that share a band: their blocks are only a
   couple of columns wide, so the one-line layout crams the title and the count
   against each other. Stacking them, and mirroring the right-hand one, makes
   the pair read as a matched set instead of one heading stranded on the edge. */
export function SectionCell({ group, index, first, stacked, alignEnd }) {
  const number = String(index + 1).padStart(2, '0');
  const count = `${group.count} ${group.count === 1 ? 'project' : 'projects'}`;

  return (
    <header
      id={`section-${group.id}`}
      className={`scroll-mt-[132px] ${first ? 'pt-[clamp(20px,3vh,32px)]' : 'mt-[clamp(40px,6vh,72px)] border-t border-border pt-[clamp(20px,3vh,30px)]'}`}
    >
      {stacked ? (
        <div className={alignEnd ? 'lg:text-right' : ''}>
          <div
            className={`flex items-baseline gap-2.5 ${alignEnd ? 'lg:justify-end' : ''}`}
          >
            <span className="font-mono text-[10px] tracking-[.2em] text-text-faint tabular-nums">
              {number}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.16em] uppercase text-text-faint">
              {count}
            </span>
          </div>
          <h2
            className="m-0 mt-2 font-bold text-text-bright uppercase"
            style={{ fontSize: 'clamp(20px,2.4vw,32px)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {group.title}
          </h2>
          <div className={`mt-3 h-px w-10 bg-white/30 ${alignEnd ? 'lg:ml-auto' : ''}`} />
        </div>
      ) : (
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[.2em] text-text-faint tabular-nums">
            {number}
          </span>
          <h2
            className="m-0 font-bold text-text-bright uppercase"
            style={{ fontSize: 'clamp(20px,2.4vw,32px)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {group.title}
          </h2>
          <span className="font-mono text-[9.5px] tracking-[.16em] uppercase text-text-faint whitespace-nowrap">
            {count}
          </span>
          <span className="hidden sm:block flex-1 h-px bg-border" />
          <span className="hidden xl:block font-mono text-[10px] tracking-[.14em] uppercase text-text-faint max-w-[46ch] text-right leading-relaxed line-clamp-2">
            {group.blurb}
          </span>
        </div>
      )}
    </header>
  );
}
