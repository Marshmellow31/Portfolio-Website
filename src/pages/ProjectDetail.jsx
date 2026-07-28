import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { selectedWork, getProjectBySlug } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';
import CaseImage from '../components/CaseImage/CaseImage';
import useSEO from '../utils/useSEO';
import { SITE_URL } from '../../site.config.mjs';

/* Case-study page for a single project — /projects/:slug */
export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  useSEO({
    title: project?.title,
    description: project?.description,
    path: `/projects/${slug}`,
    image: project?.image,
    jsonLd: project && {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: project.title,
          description: project.description,
          url: `${SITE_URL}/projects/${slug}`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: project.stack?.some(s => s.toLowerCase().includes('android') || s.toLowerCase().includes('kotlin')) ? 'Android, Web Browser' : 'Web Browser',
          author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: 'Harshil Patel', url: `${SITE_URL}/` },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/projects` },
            { '@type': 'ListItem', position: 3, name: project.title, item: `${SITE_URL}/projects/${slug}` },
          ],
        },
      ],
    },
  });

  if (!project) return <Navigate to="/projects" replace />;

  const idx = selectedWork.indexOf(project);
  const prev = selectedWork[(idx - 1 + selectedWork.length) % selectedWork.length];
  const next = selectedWork[(idx + 1) % selectedWork.length];
  // Projects without real screenshots only have a small logo — show it as a
  // centered band instead of stretching it full-width.
  const hasGallery = Boolean(project.images?.length);
  const [heroImage, ...restImages] = hasGallery ? project.images : [project.image];
  /* Projects with designed case-study frames opt out of the stock image
     treatment: the frames already contain the title, meta and per-feature
     copy, so the page hides the markup that would say it a second time. */
  const frames = project.frames;

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

          {/* The hero frame renders the title and tagline as artwork, so the
              real heading is kept for SEO and screen readers but not painted
              twice. Everything else still renders it normally. */}
          {frames ? (
            <>
              <h1 className="sr-only">{project.title}</h1>
              <p className="sr-only">{project.description}</p>
            </>
          ) : (
            <>
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
            </>
          )}
        </Reveal>

        {/* meta strip */}
        <Reveal className="mt-[clamp(32px,4vw,52px)] border-t border-border">
          <div className="grid gap-x-8 gap-y-5 pt-6 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {/* The hero frame already prints year / role / type / stack. */}
            {(frames ? [] : [
              ['YEAR', project.year],
              ['ROLE', project.role],
              ['TYPE', project.type],
              ['STACK', project.stackLine],
            ]).map(([label, value]) => (
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
                {project.paper && (
                  <a href={project.paper} target="_blank" rel="noreferrer"
                    className="font-mono text-[12px] tracking-[.08em] text-text no-underline border-b border-white/30 pb-0.5 hover:border-white transition-colors">
                    PAPER ↗
                  </a>
                )}
                {!project.link && !project.github && !project.paper && !project.credentials && (
                  <span className="font-mono text-[12px] text-text-faint">PRIVATE CLIENT WORK</span>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Designed hero frame — edge to edge, no card, no border. The band
             behind it is the frame's own #0A0A0B rather than the page's pure
             black, so the image has no visible rectangle edge. ── */}
      {frames && (
        <section className="bg-[#0A0A0B]">
          <motion.div layoutId={`project-image-${project.slug}`}>
            <CaseImage
              id={frames.hero.id}
              alt={frames.hero.alt}
              ratio={frames.hero.ratio}
              /* 132vh on a 16:10 frame renders ~83% of the viewport height, so
                 the hero always sits within one screen with room to breathe —
                 and 1800px stops it ballooning further on a wide monitor. */
              maxWidth="min(100%, 132vh, 1800px)"
              sizes="(min-width: 1800px) 1800px, 100vw"
              priority
            />
          </motion.div>
        </section>
      )}

      {/* ── Hero image (+ Problem/Approach flanking it on wide screens) ── */}
      <section className={`px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)] ${frames ? 'pt-[clamp(48px,6vw,88px)]' : ''}`}>
        {frames ? (
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
        ) : hasGallery ? (
          <div className="grid gap-[clamp(28px,3vw,48px)] xl:grid-cols-[auto_minmax(0,1fr)] xl:items-center">
            <div className="flex justify-center">
              <motion.div
                layoutId={`project-image-${project.slug}`}
                className="inline-flex max-w-full rounded-xl overflow-hidden border border-border bg-black/20"
              >
                <img
                  src={heroImage}
                  alt={`${project.title} — main view`}
                  className="h-[45vh] sm:h-[55vh] md:h-[70vh] w-auto max-w-full object-contain block"
                  loading="eager"
                />
              </motion.div>
            </div>

            <div className="grid gap-[clamp(28px,3vw,44px)]">
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
          </div>
        ) : (
          <>
            <motion.div
              layoutId={`project-image-${project.slug}`}
              className="rounded-xl overflow-hidden border border-border bg-surface flex items-center justify-center py-[clamp(48px,8vw,110px)] px-8"
            >
              <img
                src={heroImage}
                alt={`${project.title} — logo`}
                className="max-h-[120px] w-auto"
                loading="eager"
              />
            </motion.div>

            <div className="grid gap-[clamp(36px,5vw,80px)] mt-[clamp(48px,6vw,88px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
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
          </>
        )}
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

      {/* ── Designed frames — 2 × 2 on desktop, stacked below. Every frame is
             4:5, so rows align without a single height override. The band and
             the gaps are the frames' own background, which is what keeps the
             grid from reading as four separate cards. ── */}
      {frames && (
        <section className="bg-[#0A0A0B] mb-[clamp(48px,6vw,88px)]">
          <div className="grid gap-px lg:grid-cols-2 max-w-[1600px] mx-auto">
            {frames.sections.map((frame) => (
              <figure key={frame.id} className="m-0">
                <CaseImage
                  id={frame.id}
                  alt={frame.alt}
                  ratio="4 / 5"
                  sizes="(min-width: 1600px) 800px, (min-width: 1024px) 50vw, 100vw"
                />
                {/* The callouts live inside the raster, so restate them for
                    anyone who can't see it. */}
                <figcaption className="sr-only">{frame.sr}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {!frames && restImages.length > 0 && (
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

      {/* ── Credentials — the certificate and recommendation letter issued for
             this engagement, kept on the case study rather than the index ── */}
      {project.credentials && (
        <section className="px-[clamp(20px,6vw,96px)] pb-[clamp(56px,8vw,110px)]">
          <Reveal className="border-t border-border pt-[clamp(32px,4vw,52px)]">
            <div className="mono-label mb-6">Credentials</div>

            <div className="grid gap-[clamp(20px,3vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] max-w-[1000px]">
              <div className="grid gap-5 content-start">
                {[
                  ['ISSUED BY', project.credentials.issuer],
                  ['PERIOD', project.credentials.period],
                  ['REFERENCE', project.credentials.ref],
                  ['SIGNED BY', project.credentials.signatories],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-2">{label}</div>
                    <div className="font-mono text-[12px] leading-[1.7] tracking-[.04em] text-text">{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 content-start">
                {project.credentials.documents.map((doc) => (
                  <a
                    key={doc.href}
                    href={doc.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-6 rounded-xl border border-border bg-white/[0.02] px-5 py-5 no-underline hover:border-white/25 hover:bg-white/[0.04] transition-colors"
                  >
                    <span>
                      <span className="block font-semibold text-[15px] text-text-bright">{doc.label}</span>
                      <span className="block font-mono text-[10px] tracking-[.16em] uppercase text-text-faint mt-1.5">
                        PDF — opens in a new tab
                      </span>
                    </span>
                    <span className="font-mono text-[16px] text-text-dim group-hover:text-white transition-colors">↗</span>
                  </a>
                ))}
              </div>
            </div>
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
