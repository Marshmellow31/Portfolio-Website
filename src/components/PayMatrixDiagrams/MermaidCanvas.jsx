import { useEffect, useRef, useState, useId } from 'react';
import { FiZoomIn, FiZoomOut, FiRotateCcw, FiCode, FiCopy, FiCheck, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

let mermaidPromise = null;

function getMermaid() {
  if (!mermaidPromise && typeof window !== 'undefined') {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default || m;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 13,
        themeVariables: {
          darkMode: true,
          background: '#070709',
          mainBkg: '#121216',
          primaryColor: '#18181D',
          primaryTextColor: '#F4F4F5',
          primaryBorderColor: '#3F3F46',
          lineColor: '#8E8E93',
          secondaryColor: '#141418',
          secondaryTextColor: '#E4E4E7',
          secondaryBorderColor: '#2E2E34',
          tertiaryColor: '#18181D',
          tertiaryTextColor: '#D4D4D8',
          tertiaryBorderColor: '#3F3F46',
          // Sequence diagram tokens
          actorBkg: '#18181D',
          actorBorder: '#3F3F46',
          actorTextColor: '#FAFAFA',
          actorLineColor: '#52525B',
          signalColor: '#A1A1AA',
          signalTextColor: '#F4F4F5',
          labelBoxBkgColor: '#18181D',
          labelBoxBorderColor: '#3F3F46',
          labelTextColor: '#F4F4F5',
          loopTextColor: '#E4E4E7',
          noteBkgColor: '#18181D',
          noteTextColor: '#FAFAFA',
          noteBorderColor: '#3F3F46',
          // State / Flowchart tokens
          nodeBorder: '#3F3F46',
          nodeTextColor: '#F4F4F5',
          clusterBkg: 'rgba(255, 255, 255, 0.02)',
          clusterBorder: '#27272A',
          edgeLabelBackground: '#0B0B0E',
          // ER tokens
          attributeBackgroundColorOdd: '#0F0F13',
          attributeBackgroundColorEven: '#15151B',
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

export default function MermaidCanvas({ diagram, isFullscreen, onToggleFullscreen }) {
  const containerRef = useRef(null);
  const rawId = useId();
  const sanitizedId = 'mermaid-' + rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const [svgHtml, setSvgHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pan state for dragging
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  // Reset zoom on diagram change
  useEffect(() => {
    setZoom(1);
    setShowCode(false);
  }, [diagram.id]);

  // Render mermaid code
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRenderError(null);

    async function renderDiagram() {
      try {
        const mermaid = await getMermaid();
        if (!mermaid || cancelled) return;
        const renderId = `${sanitizedId}-${diagram.id}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, diagram.code);
        if (!cancelled) {
          setSvgHtml(svg);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Mermaid render error:', err);
          setRenderError(err.message || 'Failed to render diagram');
          setLoading(false);
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [diagram.code, diagram.id, sanitizedId]);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(diagram.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e) => {
    if (showCode || !containerRef.current) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setScrollPos({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !containerRef.current) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    containerRef.current.scrollLeft = scrollPos.left - dx;
    containerRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="flex flex-col border border-border bg-[#08080A] rounded-xl overflow-hidden shadow-2xl">
      {/* ── Canvas Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[.18em] uppercase text-text-faint px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
            {diagram.badge}
          </span>
          <span className="font-mono text-[11px] text-text-dim hidden sm:inline-block">
            {diagram.tag}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls (only active in visual diagram view) */}
          {!showCode && (
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-md p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.45}
                title="Zoom Out"
                aria-label="Zoom Out"
                className="p-1.5 text-text-dim hover:text-white disabled:opacity-30 transition-colors rounded"
              >
                <FiZoomOut className="text-[14px]" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom (100%)"
                className="font-mono text-[10px] tracking-[.06em] text-text-muted hover:text-white px-1.5 py-0.5 transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.45}
                title="Zoom In"
                aria-label="Zoom In"
                className="p-1.5 text-text-dim hover:text-white disabled:opacity-30 transition-colors rounded"
              >
                <FiZoomIn className="text-[14px]" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset to default scale"
                  className="p-1.5 text-text-dim hover:text-white transition-colors rounded border-l border-white/10"
                >
                  <FiRotateCcw className="text-[12px]" />
                </button>
              )}
            </div>
          )}

          {/* Code Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCode((prev) => !prev)}
            title={showCode ? 'View Diagram Canvas' : 'View Raw Mermaid Source'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[11px] tracking-[.05em] border transition-all ${
              showCode
                ? 'bg-white text-black border-white'
                : 'bg-white/[0.03] text-text-dim hover:text-white border-white/10 hover:border-white/25'
            }`}
          >
            <FiCode className="text-[13px]" />
            <span className="hidden md:inline">{showCode ? 'Canvas' : 'Mermaid Source'}</span>
          </button>

          {/* Copy Button (available in code view) */}
          {showCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy Mermaid source"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[11px] tracking-[.05em] bg-white/[0.03] text-text-dim hover:text-white border border-white/10 hover:border-white/25 transition-all"
            >
              {copied ? <FiCheck className="text-[13px] text-emerald-400" /> : <FiCopy className="text-[13px]" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              className="p-2 rounded-md bg-white/[0.03] text-text-dim hover:text-white border border-white/10 hover:border-white/25 transition-all"
            >
              {isFullscreen ? <FiMinimize2 className="text-[13px]" /> : <FiMaximize2 className="text-[13px]" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Viewport ── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative overflow-auto transition-colors select-none ${
          isFullscreen ? 'min-h-[70vh] max-h-[82vh]' : 'min-h-[420px] max-h-[580px]'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} flex items-center justify-center p-4 sm:p-8 bg-[#070709] bg-[radial-gradient(#1c1c22_1px,transparent_1px)] [background-size:20px_20px]`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-faint">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="font-mono text-[11px] tracking-[.12em] uppercase">
              Rendering diagram specifications...
            </span>
          </div>
        ) : renderError ? (
          <div className="max-w-md p-5 border border-red-500/30 bg-red-950/20 rounded-lg text-center">
            <div className="font-mono text-[12px] text-red-400 font-semibold mb-1">
              Diagram Render Error
            </div>
            <p className="text-[12px] text-text-dim mb-3 font-mono">{renderError}</p>
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="px-3 py-1.5 bg-white/10 text-text-bright rounded font-mono text-[11px]"
            >
              View Raw Mermaid Code
            </button>
          </div>
        ) : showCode ? (
          <div className="w-full h-full p-2">
            <pre className="font-mono text-[12px] text-[#A1A1AA] bg-[#0E0E12] border border-white/10 rounded-lg p-5 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
              <code>{diagram.code}</code>
            </pre>
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center transition-transform duration-150 ease-out origin-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <div
              className="mermaid-svg-container [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto [&>svg]:drop-shadow-lg"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        )}

        {/* Drag Hint Overlay for users on desktop */}
        {!showCode && !loading && !renderError && (
          <div className="absolute bottom-2.5 right-3 pointer-events-none hidden sm:block">
            <span className="font-mono text-[9px] tracking-[.14em] uppercase text-text-faint bg-[#070709]/80 border border-white/5 px-2 py-0.5 rounded backdrop-blur-sm">
              Click &amp; Drag to Pan · Scroll to zoom
            </span>
          </div>
        )}
      </div>

      {/* ── Custom CSS for pristine dark mode Mermaid presentation ── */}
      <style>{`
        .mermaid-svg-container svg {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }
        .mermaid-svg-container svg text {
          font-family: 'JetBrains Mono', monospace !important;
          letter-spacing: -0.01em;
        }
        .mermaid-svg-container .node rect,
        .mermaid-svg-container .node polygon,
        .mermaid-svg-container .node circle {
          stroke: #3F3F46 !important;
          stroke-width: 1.2px !important;
          fill: #131317 !important;
        }
        .mermaid-svg-container .cluster rect {
          fill: rgba(255, 255, 255, 0.02) !important;
          stroke: #2E2E36 !important;
          stroke-dasharray: 3 3;
        }
        .mermaid-svg-container .edgePath path {
          stroke: #71717A !important;
          stroke-width: 1.4px !important;
        }
        .mermaid-svg-container .marker {
          fill: #A1A1AA !important;
          stroke: #A1A1AA !important;
        }
        .mermaid-svg-container .label {
          color: #EDEDED !important;
        }
        .mermaid-svg-container .er.entityBox {
          fill: #141418 !important;
          stroke: #3F3F46 !important;
        }
      `}</style>
    </div>
  );
}
