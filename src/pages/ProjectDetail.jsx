import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { selectedWork, getProjectBySlug } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';
import useSEO from '../utils/useSEO';

/* Case-study page for a single project — /projects/:slug */
export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  useSEO({
    title: project?.title,
    description: project?.description,
    path: `/projects/${slug}`,
  });

  if (!project) return <Navigate to="/projects" replace />;

  const idx = selectedWork.indexOf(project);
  const prev = selectedWork[(idx - 1 + selectedWork.length) % selectedWork.length];
  const next = selectedWork[(idx + 1) % selectedWork.length];
  // Projects without real screenshots only have a small logo — show it as a
  // centered band instead of stretching it full-width.
  const hasGallery = Boolean(project.images?.length);
  const [heroImage, ...restImages] = hasGallery ? project.images : [project.image];

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <section className="px-[clamp(20px,6vw,96px)] pt-[110px] pb-[clamp(32px,4vw,56px)]">
        <Reveal>
          <Link
            to="/projects"
            className="inline-block font-mono text-[11px] tracking-[.14em] text-text-dim no-underline hover:text-text transition-colors mb-8"
          >
            ← ALL PROJECTS
          </Link>

          <div className="flex items-center gap-[14px] mb-5">
            <div className="w-10 h-px bg-text" />
            <span className="mono-label">Case Study — {project.num} / {String(selectedWork.length).padStart(2, '0')}</span>
            {project.live && (
              <span className="font-mono text-[9px] tracking-[.14em] text-bg bg-text rounded-[3px] px-[7px] py-[3px]">
                LIVE
              </span>
            )}
          </div>

          <h1
            className="m-0 font-bold text-text-bright"
            style={{ fontSize: 'clamp(44px,8vw,110px)', letterSpacing: '-0.045em', lineHeight: 0.94 }}
          >
            {project.title}
          </h1>

          <p
            className="mt-7 max-w-[640px] text-text-muted"
            style={{ fontSize: 'clamp(16px,1.5vw,20px)', lineHeight: 1.6, textWrap: 'pretty' }}
          >
            {project.description}
          </p>
        </Reveal>

        {/* meta strip */}
        <Reveal className="mt-[clamp(32px,4vw,52px)] border-t border-border">
          <div className="grid gap-x-8 gap-y-5 pt-6 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {[
              ['YEAR', project.year],
              ['ROLE', project.role],
              ['TYPE', project.type],
              ['STACK', project.stackLine],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-2">{label}</div>
                <div className="font-mono text-[12px] leading-[1.7] tracking-[.04em] text-text">{value}</div>
              </div>
            ))}
            <div>
              <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-2">LINKS</div>
              <div className="flex gap-5">
                {project.link && (
                  <a href={project.link} target="_blank" rel="noreferrer"
                    className="font-mono text-[12px] tracking-[.08em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors">
                    VISIT ↗
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noreferrer"
                    className="font-mono text-[12px] tracking-[.08em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors">
                    CODE ↗
                  </a>
                )}
                {project.instagram && (
                  <a href={project.instagram} target="_blank" rel="noreferrer"
                    className="font-mono text-[12px] tracking-[.08em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors">
                    INSTAGRAM ↗
                  </a>
                )}
                {!project.link && !project.github && (
                  <span className="font-mono text-[12px] text-text-faint">PRIVATE CLIENT WORK</span>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Hero image ── */}
      <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)]">
        <motion.div
          layoutId={`project-image-${project.slug}`}
          className="rounded-xl overflow-hidden border border-border bg-surface"
        >
          {hasGallery ? (
            <img
              src={heroImage}
              alt={`${project.title} — main view`}
              className="w-full h-auto block"
              loading="eager"
            />
          ) : (
            <div className="flex items-center justify-center py-[clamp(48px,8vw,110px)] px-8">
              <img
                src={heroImage}
                alt={`${project.title} — logo`}
                className="max-h-[120px] w-auto"
                loading="eager"
              />
            </div>
          )}
        </motion.div>
      </section>

      {/* ── Problem / Approach ── */}
      <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)]">
        <div className="grid gap-[clamp(36px,5vw,80px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          <Reveal>
            <div className="mono-label mb-5">The Problem</div>
            <p className="m-0 text-text-muted" style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.7, textWrap: 'pretty' }}>
              {project.problem}
            </p>
          </Reveal>
          <Reveal>
            <div className="mono-label mb-5">The Approach</div>
            <p className="m-0 text-text-muted" style={{ fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.7, textWrap: 'pretty' }}>
              {project.approach}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)]">
        <Reveal className="mb-8">
          <div className="mono-label">What It Does</div>
        </Reveal>
        <div className="border-t border-border">
          {project.features.map(([title, text], i) => (
            <Reveal
              key={title}
              className="grid gap-x-8 gap-y-2 py-6 border-b border-border [grid-template-columns:auto_minmax(180px,1fr)_2fr] max-md:[grid-template-columns:auto_1fr]"
            >
              <div className="font-mono text-[11px] text-text-faint pt-1 w-8">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-semibold text-text text-[16px] md:text-[17px]" style={{ letterSpacing: '-0.01em' }}>
                {title}
              </div>
              <p className="m-0 text-[14px] leading-relaxed text-text-dim max-md:col-start-2">
                {text}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      {restImages.length > 0 && (
        <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)]">
          <Reveal className="mb-8">
            <div className="mono-label">In Detail</div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {restImages.map((src, i) => (
              <Reveal
                key={src}
                className={restImages.length % 2 !== 0 && i === restImages.length - 1 ? 'md:col-span-2' : ''}
              >
                <div className="rounded-xl overflow-hidden border border-border bg-surface">
                  <img
                    src={src}
                    alt={`${project.title} — screen ${i + 2}`}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Outcome ── */}
      {project.outcome && (
        <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(56px,8vw,110px)]">
          <Reveal className="border-t border-border pt-[clamp(32px,4vw,52px)]">
            <div className="mono-label mb-6">Outcome</div>
            <p
              className="m-0 font-semibold text-text-bright max-w-[820px]"
              style={{ fontSize: 'clamp(22px,3vw,38px)', letterSpacing: '-0.03em', lineHeight: 1.25, textWrap: 'pretty' }}
            >
              {project.outcome}
            </p>
          </Reveal>
        </section>
      )}

      {/* ── Prev / Next ── */}
      <section className="border-t border-border grid md:grid-cols-2">
        <Link
          to={`/projects/${prev.slug}`}
          className="group px-[clamp(20px,6vw,96px)] py-[clamp(32px,4vw,56px)] no-underline border-b md:border-b-0 md:border-r border-border hover:bg-white/[0.02] transition-colors"
        >
          <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-3">← PREVIOUS</div>
          <div
            className="font-bold text-text-dim group-hover:text-text-bright transition-colors"
            style={{ fontSize: 'clamp(24px,3vw,40px)', letterSpacing: '-0.03em' }}
          >
            {prev.title}
          </div>
        </Link>
        <Link
          to={`/projects/${next.slug}`}
          className="group px-[clamp(20px,6vw,96px)] py-[clamp(32px,4vw,56px)] no-underline md:text-right hover:bg-white/[0.02] transition-colors"
        >
          <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-3">NEXT →</div>
          <div
            className="font-bold text-text-dim group-hover:text-text-bright transition-colors"
            style={{ fontSize: 'clamp(24px,3vw,40px)', letterSpacing: '-0.03em' }}
          >
            {next.title}
          </div>
        </Link>
      </section>
    </div>
  );
}
