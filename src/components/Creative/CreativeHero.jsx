import { useEffect, useRef } from 'react';
import { FaInstagram } from 'react-icons/fa';

export default function CreativeHero({ instagramHandle, instagramUrl }) {
  const heroRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const handleViewerScroll = (event) => {
      if (event.source !== viewerRef.current?.contentWindow || event.data?.type !== 'bullet-scroll') return;
      window.scrollBy({ top: event.data.deltaY, behavior: 'auto' });
    };

    const observer = new IntersectionObserver(([entry]) => {
      viewerRef.current?.contentWindow?.postMessage({
        type: 'bullet-visibility',
        visible: entry.isIntersecting,
      }, window.location.origin);
    }, { threshold: 0.02 });
    window.addEventListener('message', handleViewerScroll);
    if (heroRef.current) observer.observe(heroRef.current);
    return () => {
      window.removeEventListener('message', handleViewerScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={heroRef} id="top" className="relative min-h-[100svh] overflow-hidden border-b border-white/10 bg-black" aria-labelledby="creative-title">
      <div className="absolute inset-0 pt-14 md:pt-0">
        <iframe ref={viewerRef} src="/bullet-reference/index.html" title="Interactive Royal Enfield Bullet 350" className="h-full w-full border-0" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.7)_0%,transparent_27%,transparent_61%,rgba(0,0,0,.94)_100%)]" />
      <div className="pointer-events-none relative z-[1] flex min-h-[100svh] flex-col px-[clamp(18px,5vw,72px)] pb-[max(22px,env(safe-area-inset-bottom))] pt-[clamp(86px,11vh,122px)]">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">Automotive creator</p>
          <h1 id="creative-title" className="mt-2 font-heading text-[clamp(2.7rem,10.5vw,10rem)] font-bold lowercase leading-[0.78] tracking-[-0.075em] text-white">
            guywithblack350
          </h1>
        </div>
        <div className="mt-auto flex items-end justify-between gap-5 pt-10">
          <div className="max-w-[19rem] pb-[8.5rem] sm:pb-[8.75rem] md:max-w-[25rem] md:pb-[4.5rem]">
            <p className="m-0 text-[clamp(1rem,1.5vw,1.25rem)] font-medium leading-snug tracking-[-0.02em] text-white/90">I document machines, roads and the stories around them.</p>
            <p className="mb-0 mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-white/45 md:text-[10px]">Automotive photography · films · stories</p>
            <a href="#top-reels" className="pointer-events-auto mt-5 inline-flex min-h-11 items-center border-b border-white/40 font-mono text-[10px] uppercase tracking-[0.18em] text-white no-underline transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explore stories ↗</a>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <p className="m-0 hidden max-w-[18rem] text-right font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 lg:block">Built around machines. Driven by stories.</p>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-black no-underline transition-transform hover:scale-[1.02] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <FaInstagram aria-hidden="true" /> {instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
