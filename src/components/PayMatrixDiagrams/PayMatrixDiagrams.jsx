import { useState, useEffect, useRef } from 'react';
import { FiLayers, FiDatabase, FiCpu, FiRepeat, FiShield, FiExternalLink, FiX } from 'react-icons/fi';
import { paymatrixDiagrams } from '../../data/paymatrixDiagrams';
import MermaidCanvas from './MermaidCanvas';
import ArchitectureOverview from './ArchitectureOverview';
import { Reveal } from '../Reveal/Reveal';

const ICONS = {
  'system-architecture': FiLayers,
  'data-model': FiDatabase,
  'flow-bill-scan': FiCpu,
  'flow-settle-up': FiRepeat,
  'flow-auth-rbac': FiShield,
};

export default function PayMatrixDiagrams() {
  const [activeTabId, setActiveTabId] = useState('system-architecture');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showArchitectureDetail, setShowArchitectureDetail] = useState(false);
  const dialogRef = useRef(null);

  const activeDiagram = paymatrixDiagrams.find((d) => d.id === activeTabId) || paymatrixDiagrams[0];
  const IconComponent = ICONS[activeDiagram.id] || FiLayers;

  useEffect(() => {
    if (!isFullscreen) return;
    const dialog = dialogRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  return (
    <section
      id="architecture-diagrams"
      className="scroll-mt-24 px-[clamp(20px,6vw,96px)] py-[clamp(48px,6vw,88px)] border-t border-border"
    >
      {/* ── Section Header ── */}
      <div className="mb-8 sm:mb-12">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="mono-label">04 — System Specification &amp; Topology</div>
            <a
              href="https://github.com/Marshmellow31/paymatrix-showcase#readme"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[.14em] uppercase text-text-dim hover:text-white transition-colors"
            >
              <span>Source: paymatrix-showcase/README.md</span>
              <FiExternalLink className="text-[11px]" />
            </a>
          </div>

          <h2
            className="m-0 text-text-bright font-bold"
            style={{ fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '-0.04em', lineHeight: 1.05 }}
          >
            System Architecture &amp; Key Flows
          </h2>

          <p
            className="mt-4 max-w-[800px] text-text-muted"
            style={{ fontSize: 'clamp(14px,1.2vw,17px)', lineHeight: 1.65, textWrap: 'pretty' }}
          >
            Verified technical specifications directly from the canonical PayMatrix codebase.
            These models govern the hybrid client sync, relational document schema, multimodal
            OCR pipeline, O(N log N) min-cash-flow graph reduction, and server-side RBAC.
          </p>
        </Reveal>
      </div>

      {/* ── Interactive Tab Navigation ── */}
      <label className="mb-6 flex flex-col gap-2 text-sm text-text-muted sm:hidden">
        Choose a diagram
        <select className="min-h-12 w-full rounded-lg border border-border-strong bg-surface px-3 text-text-bright" value={activeTabId} onChange={(event) => setActiveTabId(event.target.value)}>
          {paymatrixDiagrams.map((diagram) => <option key={diagram.id} value={diagram.id}>{diagram.shortLabel}</option>)}
        </select>
      </label>
      <div className="mb-6 hidden sm:block">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {paymatrixDiagrams.map((diag, index) => {
            const TabIcon = ICONS[diag.id] || FiLayers;
            const isActive = diag.id === activeTabId;
            return (
              <button
                key={diag.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTabId(diag.id)}
                className={`flex items-center gap-2 min-h-11 px-3.5 py-2 rounded-lg font-mono text-[12px] tracking-[.04em] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/[0.06] border border-white/5'
                }`}
              >
                <TabIcon className={`text-[13px] ${isActive ? 'text-black' : 'text-text-faint'}`} />
                <span>
                  <span className={`mr-1.5 opacity-60 text-[10px]`}>
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  {diag.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Diagram Title & Summary Strip ── */}
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <IconComponent className="text-[15px] text-text-dim" />
            <h3 className="m-0 text-[18px] sm:text-[20px] font-semibold text-text-bright tracking-[-0.02em]">
              {activeDiagram.title}
            </h3>
          </div>
          <p className="m-0 text-[13px] sm:text-[14px] text-text-dim max-w-[700px] leading-relaxed">
            {activeDiagram.summary}
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-[.16em] uppercase text-text-faint bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded">
          {activeDiagram.badge}
        </span>
      </div>

      {/* ── Main Interactive Diagram Canvas ── */}
      <div className="mb-8">
        {activeTabId === 'system-architecture' && <>
          <ArchitectureOverview />
          <button type="button" aria-expanded={showArchitectureDetail} onClick={() => setShowArchitectureDetail(!showArchitectureDetail)} className="mt-4 min-h-11 rounded-lg border border-border-strong px-4 text-sm text-text-muted hover:text-white focus-visible:outline-2 focus-visible:outline-white">
            {showArchitectureDetail ? 'Hide detailed connections' : 'Explore detailed connections'}
          </button>
        </>}
        {(activeTabId !== 'system-architecture' || showArchitectureDetail) && <div className={activeTabId === 'system-architecture' ? 'mt-4' : ''}><MermaidCanvas
          diagram={activeDiagram}
          isFullscreen={false}
          onToggleFullscreen={() => setIsFullscreen(true)}
        /></div>}
      </div>

      {/* ── Architecture Highlights Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {activeDiagram.highlights.map((highlight, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-border bg-white/[0.02] flex flex-col justify-between"
          >
            <div className="font-mono text-[10px] tracking-[.16em] text-text-faint uppercase mb-2">
              KEY SPECIFICATION {String(idx + 1).padStart(2, '0')}
            </div>
            <p className="m-0 text-[13px] text-text-dim leading-relaxed">
              {highlight}
            </p>
          </div>
        ))}
      </div>

      {/* ── System Invariant & Design Trade-off Note ── */}
      <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.015] flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-text-dim shrink-0 mt-0.5">
          <FiShield className="text-[15px]" />
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-[.18em] text-text-faint uppercase mb-1">
            Engineering Rationale &amp; Boundary Guardrails
          </div>
          <p className="m-0 text-[13px] text-text-dim leading-relaxed">
            {activeDiagram.notes}
          </p>
        </div>
      </div>

      {/* ── Fullscreen Modal Overlay ── */}
      <dialog ref={dialogRef} className="diagram-dialog" aria-labelledby="diagram-dialog-title" onCancel={() => setIsFullscreen(false)} onClose={() => setIsFullscreen(false)}>
        {isFullscreen && <>
          {/* Modal Header */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-3">
              <IconComponent className="text-[18px] text-white" />
              <div>
                <div id="diagram-dialog-title" className="text-[16px] sm:text-[18px] font-semibold text-text-bright">
                  {activeDiagram.title}
                </div>
                <div className="font-mono text-[10px] tracking-[.12em] text-text-faint uppercase">
                  Press ESC or click close to exit
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 min-h-11 min-w-11 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] tracking-[.06em] transition-colors"
              >
                <FiX className="text-[14px]" />
                <span>CLOSE</span>
              </button>
            </div>
          </div>

          {/* Modal Diagram Viewport */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MermaidCanvas
              diagram={activeDiagram}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreen(false)}
            />
          </div>
        </>}
      </dialog>
    </section>
  );
}
