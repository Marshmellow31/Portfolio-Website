import { useEffect, useState } from 'react';
import { selectedWork, projectGroups } from '../data/portfolio';
import ProjectTile from '../components/Projects/ProjectTile';
import { SectionCell } from '../components/Projects/SectionCell';
import SectionNav from '../components/Projects/SectionNav';
import useSEO from '../utils/useSEO';

/* The page's column rhythm. Inline rather than an arbitrary Tailwind class —
   the nested commas in repeat(auto-fill, minmax(...)) don't survive the
   class-name parser — so it travels as a CSS variable instead. */
/* The track floor drives everything: on a desktop it's wide enough that the
   screenshots are actually readable, it shrinks with the viewport so narrower
   screens trade tile size for more tiles per row, and it bottoms out at 160px
   so phones keep the two-up layout they already had. */
const TRACKS = 'repeat(auto-fill, minmax(clamp(160px, 21vw, 310px), 1fr))';

/* Short sections share a band on wide screens: Internship's two tiles on the
   left, Research's one to the right of them, on the same row. Each block spans
   exactly as many of the page's columns as it has projects, so the tiles stay
   the same size as everywhere else — the saving is a whole row of height. */
const BANDS = [['internship', 'research']];

function SectionBlock({ group, index, first, inBand, alignEnd }) {
  /* End-anchored so the block hugs the right edge of the row rather than
     butting up against the block beside it. */
  const span = alignEnd ? `-${group.count + 1} / -1` : `span ${group.count}`;

  return (
    <section style={inBand ? { gridColumn: span } : undefined}>
      <SectionCell
        group={group}
        index={index}
        first={first}
        stacked={inBand}
        alignEnd={alignEnd}
      />

      <div
        className={`grid gap-3 md:gap-4 mt-[clamp(14px,2vh,20px)] [grid-template-columns:var(--tracks)] ${
          inBand ? 'lg:[grid-template-columns:var(--fixed)]' : ''
        }`}
        style={{ '--tracks': TRACKS, '--fixed': `repeat(${group.count}, minmax(0, 1fr))` }}
      >
        {group.projects.map((p) => (
          <ProjectTile key={p.slug} project={p} />
        ))}
      </div>
    </section>
  );
}

export default function Projects() {
  useSEO({
    title: 'Projects',
    description: `${selectedWork.length} projects across research, personal products, internships, and client work — payments, bookings, PWAs, native Android, embedded hardware, and AI tools, each with a full case study.`,
    path: '/projects',
  });

  const projectYears = selectedWork.map((p) => Number(p.year)).filter(Boolean);
  const years = `${Math.min(...projectYears)} — ${Math.max(...projectYears)}`;
  const stats = [
    [selectedWork.length, 'Projects'],
    [selectedWork.filter((p) => p.live).length, 'Live'],
    [projectGroups.length, 'Categories'],
  ];

  /* Group order still comes from the data; this only decides which of them
     share a row, so the sticky nav keeps reading left to right. Each group
     keeps its index in that order — that's the number its heading shows. */
  const rows = [];
  projectGroups.forEach((group, index) => {
    const entry = { group, index };
    const band = BANDS.find((b) => b.includes(group.id));
    const last = rows[rows.length - 1];
    if (band && last && band.includes(last[0].group.id)) last.push(entry);
    else rows.push([entry]);
  });

  /* Bands only exist from lg up. Below that the sections stack, so the bar goes
     back to listing them one by one. */
  const [banded, setBanded] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setBanded(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const num = (i) => String(i + 1).padStart(2, '0');
  const navItems = (banded ? rows : projectGroups.map((group, index) => [{ group, index }])).map(
    (row) => ({
      /* the row's first heading is what the bar scrolls to and tracks */
      id: row[0].group.id,
      label: row.map((e) => e.group.label).join(' & '),
      count: row.reduce((n, e) => n + e.group.count, 0),
      number: row.length > 1 ? `${num(row[0].index)}–${num(row[row.length - 1].index)}` : num(row[0].index),
    })
  );

  return (
    <div className="min-h-screen px-[clamp(16px,4vw,64px)]">
      {/* Masthead. Kept short enough that the first row of tiles still clears
          the fold, but with enough structure that it doesn't read as a stray
          line of text above a toolbar. */}
      <header className="pt-[clamp(64px,9vh,88px)] pb-[clamp(16px,2.5vh,26px)]">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9.5px] tracking-[.26em] uppercase text-text-faint whitespace-nowrap">
            Project Index
          </span>
          <span className="flex-1 h-px bg-border" />
          <span className="font-mono text-[9.5px] tracking-[.26em] uppercase text-text-faint whitespace-nowrap tabular-nums">
            {years}
          </span>
        </div>

        <h1
          className="m-0 mt-[clamp(14px,2vh,22px)] font-bold text-text-bright"
          style={{ fontSize: 'clamp(38px,6vw,86px)', letterSpacing: '-0.05em', lineHeight: 0.9 }}
        >
          ALL PROJECTS
        </h1>

        <div className="mt-[clamp(14px,2.2vh,24px)] flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <p className="m-0 max-w-[52ch] text-text-dim text-[13.5px] md:text-[15px] leading-relaxed">
            Published research, products I built because I wanted them to exist, internship work,
            and paid client builds — every one of them opens into a full case study.
          </p>
          <div className="flex gap-[clamp(24px,3vw,48px)]">
            {stats.map(([value, label]) => (
              <div key={label}>
                <div
                  className="font-bold text-text-bright tabular-nums"
                  style={{ fontSize: 'clamp(22px,2.2vw,34px)', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  {String(value).padStart(2, '0')}
                </div>
                <div className="font-mono text-[9px] tracking-[.18em] uppercase text-text-faint mt-1.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <SectionNav items={navItems} />

      {rows.map((row, i) =>
        row.length === 1 ? (
          <SectionBlock
            key={row[0].group.id}
            group={row[0].group}
            index={row[0].index}
            first={i === 0}
          />
        ) : (
          /* Only a grid from lg up — below that the blocks stack and each falls
             back to its own auto-filling grid. The gap matches the tile grid's
             md:gap-4 so both sides land on the same columns. */
          <div
            key={row.map((e) => e.group.id).join('-')}
            className="lg:grid lg:gap-x-4 lg:[grid-template-columns:var(--tracks)] lg:items-start"
            style={{ '--tracks': TRACKS }}
          >
            {row.map((entry, j) => (
              <SectionBlock
                key={entry.group.id}
                group={entry.group}
                index={entry.index}
                first={i === 0}
                inBand
                alignEnd={j === row.length - 1}
              />
            ))}
          </div>
        )
      )}

      <div className="h-[clamp(40px,6vh,80px)]" />
    </div>
  );
}
