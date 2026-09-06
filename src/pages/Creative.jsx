import { FaExternalLinkAlt, FaHandshake, FaInstagram } from 'react-icons/fa';
import CreativeHero from '../components/Creative/CreativeHero';
import CreatorImpact from '../components/Creative/CreatorImpact';
import TopReels from '../components/Creative/TopReels';
import useInstagramSnapshot from '../components/Creative/useInstagramSnapshot';
import { Reveal } from '../components/Reveal/Reveal';
import {
  brandCollabs,
  instagramHandle,
  instagramLastSynced,
  instagramUrl,
} from '../data/instagram';
import useSEO from '../utils/useSEO';

const creativeDescription = 'Harshil Patel’s automotive creator portfolio as @guywithblack350: approximately 70M+ public Instagram reel views, top-performing reels, and brand collaborations.';

const creativeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': 'https://www.harshilpatel.co.in/creative#profile',
      url: 'https://www.harshilpatel.co.in/creative',
      name: 'Guy With Black 350 — Automotive Content Creator',
      description: creativeDescription,
      dateModified: '2026-08-15',
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: 'https://www.harshilpatel.co.in/creative-og.jpg',
        width: 1200,
        height: 630,
      },
      mainEntity: { '@id': 'https://www.harshilpatel.co.in/creative#creator' },
    },
    {
      '@type': 'Person',
      '@id': 'https://www.harshilpatel.co.in/creative#creator',
      name: 'Harshil Patel',
      alternateName: ['Guy With Black 350', 'guywithblack350', '@guywithblack350'],
      url: 'https://www.harshilpatel.co.in/creative',
      image: 'https://www.harshilpatel.co.in/creative-og.jpg',
      description: 'Automotive content creator behind @guywithblack350, with approximately 70 million+ public Instagram reel views.',
      sameAs: [
        'https://www.instagram.com/guywithblack350/',
        'https://www.instagram.com/harshil_3105_/',
        'https://www.linkedin.com/in/harshil-patel-5a7373333',
      ],
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'WatchAction' },
        userInteractionCount: 67683149,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.harshilpatel.co.in/' },
        { '@type': 'ListItem', position: 2, name: 'Guy With Black 350', item: 'https://www.harshilpatel.co.in/creative' },
      ],
    },
  ],
};

export default function Creative() {
  const { triggerRef, data: snapshot, status } = useInstagramSnapshot();

  useSEO({
    title: 'Automotive Content Creator | Guy With Black 350',
    description: creativeDescription,
    path: '/creative',
    image: '/creative-og.jpg',
    jsonLd: creativeJsonLd,
  });

  return (
    <div className="creative-page">
      <CreativeHero instagramHandle={instagramHandle} instagramUrl={instagramUrl} />

      <CreatorImpact sectionRef={triggerRef} snapshot={snapshot} status={status} />

      <TopReels reels={snapshot?.topReels} instagramUrl={instagramUrl} syncedAt={instagramLastSynced} />

      <section className="section-pad border-b border-border" aria-labelledby="partnerships-title">
        <Reveal className="mb-[clamp(36px,5.5vw,64px)]">
          <div className="mono-label mb-4"><FaHandshake className="mr-2 inline" aria-hidden="true" /> 03 — Brand Collaborations</div>
          <h2 id="partnerships-title" className="m-0 text-[clamp(36px,5.2vw,74px)] font-bold leading-[0.98] tracking-[-0.05em]">
            Audience into action.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
            Automotive storytelling engineered for organic recall, algorithmic attention, and genuine enthusiast engagement.
          </p>
        </Reveal>

        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {brandCollabs.map((collab, index) => (
            <Reveal key={collab.name}>
              <a
                href={collab.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-40 flex-col justify-between bg-bg p-8 no-underline transition-colors hover:bg-white/[0.03] md:p-10"
              >
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">
                  <span>Collab 0{index + 1}</span>
                  <FaExternalLinkAlt className="text-xs text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-text-bright" aria-hidden="true" />
                </div>
                <div className="mt-6">
                  <h3 className="m-0 text-2xl font-bold tracking-tight text-text transition-colors group-hover:text-text-bright md:text-3xl">
                    {collab.name}
                  </h3>
                  <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
                    Automotive Partnership · Campaign Production
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Editorial Collaboration CTA */}
      <section className="section-pad" aria-labelledby="creative-cta-title">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface/60 to-surface/20 p-[clamp(32px,6vw,84px)] text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_65%)]" />
            <div className="relative z-10">
              <div className="mx-auto mb-6 inline-flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl text-text-bright">
                <FaInstagram aria-hidden="true" />
              </div>
              <h2 id="creative-cta-title" className="mx-auto my-0 max-w-3xl text-[clamp(36px,6vw,84px)] font-bold leading-[0.95] tracking-[-0.05em]">
                Build something people stop scrolling for.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-text-muted md:text-base">
                Whether it's a vehicle launch, aftermarket series, or bespoke road documentary—let's create automotive cinema that cuts through the feed.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="mailto:1080patelharshil@gmail.com?subject=Creator%20collaboration"
                  className="inline-flex min-h-12 items-center rounded-full bg-white px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-black no-underline shadow-xl transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
                >
                  Discuss a collaboration
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface/50 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text no-underline transition-colors hover:border-white/40 hover:text-white"
                >
                  <FaInstagram className="text-xs" aria-hidden="true" />
                  <span>{instagramHandle}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
