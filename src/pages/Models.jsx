import { FaArrowRight, FaCube, FaExternalLinkAlt } from 'react-icons/fa';
import { useState } from 'react';
import { Reveal } from '../components/Reveal/Reveal';
import { vehicleModels } from '../data/models';
import useSEO from '../utils/useSEO';
import FortunerModel from '../components/FortunerModel';

const description = 'Explore and download local 3D models of the Toyota Fortuner and Mahindra XUV 7XO.';

export default function Models() {
  const [selected, setSelected] = useState(() => vehicleModels.find(m => window.location.hash === `#${m.id}-viewer`) || vehicleModels[0]);
  function selectModel(event, model) {
    event.preventDefault();
    setSelected(model);
    window.history.replaceState(null, '', model.viewerUrl);
    document.getElementById('model-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  useSEO({
    title: 'Interactive Vehicle Models',
    description,
    path: '/model',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Interactive Vehicle Models',
      url: 'https://www.harshilpatel.co.in/model',
      description,
      hasPart: vehicleModels.map((model) => ({
        '@type': '3DModel',
        name: `${model.maker} ${model.name}`,
        url: model.viewerUrl,
      })),
    },
  });

  return (
    <div className="min-h-screen pt-16">
      <header className="section-pad border-b border-border">
        <Reveal>
          <div className="mono-label mb-5 flex items-center gap-2">
            <FaCube aria-hidden="true" /> Vehicle archive
          </div>
          <h1 className="m-0 max-w-5xl text-[clamp(52px,10vw,148px)] font-bold leading-[0.82] tracking-[-0.07em]">
            Models<span className="text-text-faint">.</span>
          </h1>
          <p className="mb-0 mt-8 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
            A curated shelf of interactive machines. Rotate them, inspect the details, and step inside the manufacturer experience.
          </p>
        </Reveal>
      </header>

      <section className="section-pad" aria-label="Interactive vehicle models">
        <div id="model-stage" className="scroll-mt-20">
          <div className="flex flex-wrap gap-3" aria-label="Select vehicle">
            {vehicleModels.map(model => <button key={model.id} type="button" aria-pressed={selected.id === model.id} onClick={event => selectModel(event, model)} className={`min-h-11 rounded-full border border-border px-5 py-2 ${selected.id === model.id ? 'bg-white text-black' : 'bg-surface text-text'}`}>{model.order} · {model.name}</button>)}
          </div>
          <FortunerModel key={selected.id} model={selected} />
        </div>
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
          <div className="mono-label">Available now</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">
            {String(vehicleModels.length).padStart(2, '0')} models
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {vehicleModels.map((model) => (
            <Reveal key={model.id}>
              <article className="group overflow-hidden rounded-2xl border border-border bg-surface/80 transition-colors hover:border-border-strong">
                <a
                  href={model.viewerUrl}
                  onClick={event => selectModel(event, model)}
                  className="relative block aspect-[16/10] overflow-hidden bg-[#090909] no-underline"
                  aria-label={`Explore the ${model.maker} ${model.name} model`}
                >
                  <img
                    src={model.image}
                    alt={`${model.maker} ${model.name}`}
                    className="h-full w-full object-contain p-[clamp(8px,2vw,24px)] transition duration-700 ease-out group-hover:scale-[1.035]"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-md">
                    Model {model.order}
                  </div>
                  <div className="absolute bottom-5 right-5 flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">
                    <FaExternalLinkAlt className="text-sm" aria-hidden="true" />
                  </div>
                </a>

                <div className="p-6 md:p-8">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">{model.maker}</div>
                  <h2 className="mb-0 mt-2 text-[clamp(32px,4vw,54px)] font-bold leading-none tracking-[-0.05em]">{model.name}</h2>
                  <p className="mb-0 mt-4 text-sm text-text-muted">{model.kind}</p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <a
                      href={model.viewerUrl}
                      onClick={event => selectModel(event, model)}
                      className="inline-flex min-h-11 items-center gap-3 rounded-full bg-white px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black no-underline transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Explore model <FaArrowRight aria-hidden="true" />
                    </a>
                    <a
                      href={model.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full border border-border px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim no-underline transition-colors hover:border-white/30 hover:text-text"
                    >
                      Official source
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 max-w-2xl font-mono text-[9px] leading-relaxed tracking-[0.08em] text-text-faint">
          Models and imagery by Toyota / ONE3D and Mahindra. Local model collection for learning.
        </p>
      </section>
    </div>
  );
}
