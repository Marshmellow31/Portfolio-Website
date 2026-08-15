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

const creativeDescription = 'Harshil Patel’s automotive creator portfolio as @guywithblack350: approximately 68M public Instagram reel views, top-performing reels, and brand collaborations.';

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
      description: 'Automotive content creator behind @guywithblack350, with approximately 68 million public Instagram reel views.',
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
        <Reveal className="mb-[clamp(32px,5vw,56px)]">
          <div className="mono-label mb-4"><FaHandshake className="mr-2 inline" aria-hidden="true" /> 03 — Partnerships</div>
          <h2 id="partnerships-title" className="m-0 text-[clamp(38px,5.5vw,76px)] font-bold leading-[0.95] tracking-[-0.05em]">
            Audience into action.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
            Automotive storytelling built for attention, recall, and genuine community response.
          </p>
        </Reveal>

        <div className="grid gap-px bg-border md:grid-cols-2">
          {brandCollabs.map((collab) => (
            <Reveal key={collab.name}>
              <a
                href={collab.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-36 items-center justify-between gap-5 bg-bg p-7 no-underline transition-colors hover:bg-white/[0.025] md:p-9"
              >
                <h3 className="m-0 text-2xl font-bold text-text transition-colors group-hover:text-text-bright md:text-3xl">{collab.name}</h3>
                <FaExternalLinkAlt className="shrink-0 text-xs text-text-faint transition-colors group-hover:text-text" aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad text-center" aria-labelledby="creative-cta-title">
        <Reveal>
          <FaInstagram className="mx-auto mb-5 text-xl text-text-dim" aria-hidden="true" />
          <h2 id="creative-cta-title" className="mx-auto my-0 max-w-4xl text-[clamp(42px,7vw,96px)] font-bold leading-[0.92] tracking-[-0.055em]">
            Build something people stop scrolling for.
          </h2>
          <a
            href="mailto:1080patelharshil@gmail.com?subject=Creator%20collaboration"
            className="mt-10 inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white px-6 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-black no-underline transition-colors hover:bg-white/90"
          >
            Discuss a collaboration
          </a>
        </Reveal>
      </section>
    </div>
  );
}
