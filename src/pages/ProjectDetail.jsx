import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiFileText, FiGlobe, FiDownload } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import { FaInstagram } from 'react-icons/fa6';
import { SiAndroid } from 'react-icons/si';
import { selectedWork, getProjectBySlug } from '../data/portfolio';
import { Reveal } from '../components/Reveal/Reveal';
import CaseImage from '../components/CaseImage/CaseImage';
import GalleryImage from '../components/GalleryImage';
import PayMatrixDownloads from '../components/PayMatrixDownloads';
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
      {/* ── Side-by-Side Hero Section: Text on Left, Image Box on Right ── */}
      <section className="px-[clamp(20px,6vw,96px)] pt-[104px] pb-[clamp(40px,5vw,72px)] border-b border-border">
        <div className="grid gap-[clamp(32px,4vw,64px)] lg:grid-cols-[1.05fr_1.1fr] xl:grid-cols-[1fr_1.15fr] items-center">
          {/* Left Column: Title, description, and metadata */}
          <Reveal>
            <Link
              to="/projects"
              className="inline-block font-mono text-[11px] tracking-[.14em] text-text-dim no-underline hover:text-text transition-colors mb-6"
            >
              ← ALL PROJECTS
            </Link>

            <div className="flex items-center gap-[14px] mb-4">
              <div className="w-10 h-px bg-text" />
              <span className="mono-label">Case Study — {project.num} / {String(selectedWork.length).padStart(2, '0')}</span>
              {project.live && (
                <span className="font-mono text-[9px] tracking-[.14em] text-bg bg-text rounded-[3px] px-[7px] py-[2px]">
                  LIVE
                </span>
              )}
            </div>

            <h1
              className="m-0 font-bold text-text-bright"
              style={{ fontSize: 'clamp(40px,5.5vw,76px)', letterSpacing: '-0.045em', lineHeight: 0.96 }}
            >
              {project.title}
            </h1>

            <p
              className="mt-5 max-w-[580px] text-text-muted"
              style={{ fontSize: 'clamp(15px,1.25vw,18px)', lineHeight: 1.65, textWrap: 'pretty' }}
            >
              {project.description}
            </p>

            {/* Meta details strip */}
            <div className="mt-7 pt-5 border-t border-border flex flex-col gap-5">
              {/* Row 1: Timeline & Role */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-1.5">TIMELINE &amp; TYPE</div>
                  <div className="font-mono text-[12px] leading-[1.5] tracking-[.04em] text-text">{project.year} · {project.type}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-1.5">ROLE</div>
                  <div className="font-mono text-[12px] leading-[1.5] tracking-[.04em] text-text">{project.role}</div>
                </div>
              </div>

              {/* Row 2: Stack Pills */}
              <div>
                <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-2">CORE STACK</div>
                <div className="flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-[10.5px] tracking-[.04em] text-text bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded whitespace-nowrap"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 3: Action Links with Actual Platform Logos */}
              <div>
                <div className="font-mono text-[10px] tracking-[.2em] text-text-faint mb-2">PLATFORM LINKS</div>
                <div className="flex flex-wrap items-center gap-2">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.04em] text-text bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 rounded-md px-2.5 py-1.5 transition-all no-underline shadow-sm"
                    >
                      <FiGlobe className="text-[13px] opacity-70 group-hover:opacity-100 transition-opacity" />
                      <span>Live App</span>
                      <FiArrowUpRight className="text-[11px] opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.04em] text-text bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 rounded-md px-2.5 py-1.5 transition-all no-underline shadow-sm"
                    >
                      <FaGithub className="text-[13px] opacity-80 group-hover:opacity-100 transition-opacity" />
                      <span>GitHub</span>
                      <FiArrowUpRight className="text-[11px] opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {project.releaseRepo && (
                    <a
                      href="#paymatrix-downloads"
                      className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.04em] text-text bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 rounded-md px-2.5 py-1.5 transition-all no-underline shadow-sm"
                    >
                      <SiAndroid className="text-[13px] text-[#3DDC84] opacity-90 group-hover:opacity-100 transition-opacity" />
                      <span>Android APK</span>
                      <FiDownload className="text-[11px] opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {project.instagram && (
                    <a
                      href={project.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.04em] text-text bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 rounded-md px-2.5 py-1.5 transition-all no-underline shadow-sm"
                    >
                      <FaInstagram className="text-[13px] text-[#E1306C] opacity-90 group-hover:opacity-100 transition-opacity" />
                      <span>Instagram</span>
                      <FiArrowUpRight className="text-[11px] opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {project.paper && (
                    <a
                      href={project.paper}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Read the ${project.title} paper`}
                      className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.04em] text-black bg-white hover:bg-white/90 border border-white rounded-md px-2.5 py-1.5 transition-all no-underline shadow-sm"
                    >
                      <FiFileText className="text-[13px]" />
                      <span>Paper</span>
                      <FiArrowUpRight className="text-[11px]" />
                    </a>
                  )}
                  {!project.link && !project.github && !project.paper && !project.credentials && (
                    <span className="font-mono text-[11px] text-text-faint">PRIVATE CLIENT WORK</span>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Hero Image placed in a contained box beside the text */}
          <Reveal>
            <div className="rounded-2xl overflow-hidden border border-border-strong bg-[#0A0A0B] p-2 sm:p-3 md:p-3.5 shadow-2xl">
              <motion.div layoutId={`project-image-${project.slug}`}>
                {frames ? (
                  <CaseImage
                    id={frames.hero.id}
                    alt={frames.hero.alt}
                    ratio={frames.hero.ratio}
                    maxWidth="100%"
                    className="rounded-xl overflow-hidden w-full h-auto block"
                    priority
                  />
                ) : hasGallery ? (
                  <GalleryImage
                    src={heroImage}
                    alt={`${project.title} — main view`}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-xl block"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center py-16 px-8">
                    <img
                      src={heroImage}
                      alt={`${project.title} — logo`}
                      className="max-h-[120px] w-auto"
                      loading="eager"
                    />
                  </div>
                )}
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Problem & Approach Section ── */}
      <section className="px-[clamp(20px,6vw,96px)] py-[clamp(48px,6vw,88px)]">
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


      {project.releaseRepo && <PayMatrixDownloads repo={project.releaseRepo} />}

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
                  <GalleryImage
                    src={src}
                    alt={`${project.title} — screen ${i + 2}`}
                    className="w-full h-auto block"
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
                    <FiArrowUpRight className="text-[18px] text-text-dim group-hover:text-white transition-colors" aria-hidden="true" />
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
