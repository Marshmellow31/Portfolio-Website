import { useEffect, useState, useMemo } from 'react';

const GITHUB_USER = 'Marshmellow31';
const POLL_INTERVAL = 60 * 1000; // refetch every minute for near-real-time updates

// GitHub's actual green contribution scale
const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const SKELETON_WEEKS = 53;

export default function GithubActivity() {
  const [weeks, setWeeks] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    let hasLoaded = false;

    async function load() {
      const controller = new AbortController();
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
          { cache: 'no-store', signal: controller.signal }
        );
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        const days = data.contributions || [];
        const byWeek = [];
        let currentWeek = [];
        days.forEach((day, i) => {
          currentWeek.push(day);
          const date = new Date(day.date);
          if (date.getDay() === 6 || i === days.length - 1) {
            byWeek.push(currentWeek);
            currentWeek = [];
          }
        });
        const sum = days.reduce((acc, d) => acc + d.count, 0);
        setWeeks(byWeek);
        setTotal(sum);
        setError(false);
        hasLoaded = true;
      } catch {
        setError((prev) => (hasLoaded ? prev : true));
      }
      return controller;
    }

    const controllers = [];
    load().then((c) => controllers.push(c));
    const interval = setInterval(() => load().then((c) => controllers.push(c)), POLL_INTERVAL);
    const onFocus = () => load().then((c) => controllers.push(c));
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      controllers.forEach((c) => c.abort());
    };
  }, []);

  const monthLabels = useMemo(() => {
    if (!weeks) return [];
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const first = week[0];
      if (!first) return;
      const month = new Date(first.date).getMonth();
      if (month === lastMonth) return;
      lastMonth = month;
      // a month that starts within a couple of columns of the previous label
      // would collide with it — drop it rather than overlap the text
      const prev = labels[labels.length - 1];
      if (prev && i - prev.index < 3) return;
      labels.push({ index: i, label: new Date(first.date).toLocaleString('en-US', { month: 'short' }) });
    });
    return labels;
  }, [weeks]);

  if (error && !weeks) return null;

  return (
    <section id="activity" className="section-pad border-b border-border">
      <div className="mb-[clamp(32px,4vw,56px)]">
        <div className="mono-label mb-4">07 — Shipping cadence</div>
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <h2 className="m-0 font-bold" style={{ fontSize: 'clamp(34px,4.5vw,64px)', lineHeight: 1 }}>
            GitHub activity
          </h2>
          {total !== null && (
            <span className="font-mono text-[11px] tracking-[.14em] uppercase text-text-dim">
              {total.toLocaleString()} contributions, last 12 months
            </span>
          )}
        </div>
      </div>

      {/* The grid is laid out in fractional columns rather than fixed-pixel
          cells, so a full year always fits the available width — on a phone
          it shrinks instead of running off the side of the screen. */}
      <div className="w-full [--gap:1px] sm:[--gap:2px] md:[--gap:3px] lg:[--gap:4px]">
        {!weeks ? (
          <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: `repeat(${SKELETON_WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: SKELETON_WEEKS }).map((_, i) => (
              <div key={i} className="grid grid-rows-7 gap-[var(--gap)]">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="w-full aspect-square rounded-[1px] md:rounded-[3px]" style={{ background: LEVEL_COLORS[0] }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              className="grid gap-[var(--gap)] mb-2 h-[14px] md:h-[20px]"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {monthLabels.map(({ index, label }) => (
                <span
                  key={index}
                  className="font-mono text-[8px] sm:text-[10px] md:text-[12px] text-text-faint whitespace-nowrap"
                  style={{ gridColumnStart: index + 1 }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-rows-7 gap-[var(--gap)]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered((h) => (h === day ? null : h))}
                      className="w-full aspect-square rounded-[1px] md:rounded-[3px] cursor-pointer transition-transform hover:scale-125"
                      style={{ background: LEVEL_COLORS[Math.min(day.level, 4)] }}
                      title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
        <a
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] md:text-[13px] tracking-[.14em] uppercase text-text-dim no-underline hover:text-text transition-colors"
        >
          @{GITHUB_USER} ↗
        </a>
        <div className="flex items-center gap-1.5 md:gap-2 font-mono text-[10px] md:text-[12px] text-text-faint uppercase tracking-[.1em]">
          <span>Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className="w-[11px] h-[11px] md:w-[15px] md:h-[15px] rounded-[2px] md:rounded-[3px]" style={{ background: color }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="h-5 mt-2">
        {hovered && (
          <span className="font-mono text-[11px] md:text-[13px] text-text-muted">
            {hovered.count} contribution{hovered.count === 1 ? '' : 's'} on{' '}
            {new Date(hovered.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>
    </section>
  );
}
