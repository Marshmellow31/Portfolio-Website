import { useEffect, useRef, useState, useId } from 'react';
import { FiZoomIn, FiZoomOut, FiCode, FiCopy, FiCheck, FiMaximize2, FiMinimize2, FiMove }  from 'react-icons/fi';

import './MermaidCanvas.css';

let mermaidPromise = null;

function getMermaid() {
  if (!mermaidPromise && typeof window !== 'undefined') {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default || m;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        flowchart: { useMaxWidth: false, nodeSpacing: 32, rankSpacing: 48 },
        sequence: { useMaxWidth: false },
        er: { useMaxWidth: false },
        themeVariables: {
          darkMode: true,
          fontSize: '16px',
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
  const dragRef = useRef(null);
  const rawId = useId();
  const [result, setResult] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [scale, setScale] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const code = diagram.id === 'system-architecture' && !compact
    ? diagram.code.replace('flowchart TD', 'flowchart LR') : diagram.code;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setRenderError(null);
    setScale(null);
    setShowCode(false);
    setDragEnabled(false);
    if (containerRef.current) containerRef.current.scrollTo(0, 0);
    async function render() {
      try {
        const mermaid = await getMermaid();
        if (cancelled) return;
        const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        const element = doc.documentElement;
        const box = element.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number);
        if (!box[2] || !box[3]) throw new Error('Diagram dimensions are unavailable.');
        // Mermaid can emit a max-width style that silently shrinks the graph.
        element.removeAttribute('style');
        element.setAttribute('width', '100%');
        element.setAttribute('height', '100%');
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', diagram.title);
        if (!cancelled) setResult({ svg: element.outerHTML, width: box[2], height: box[3] });
      } catch (error) {
        if (!cancelled) setRenderError(error.message || 'The diagram could not be displayed.');
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code, diagram.id, diagram.title, rawId]);

  const fitScale = result && viewport.width
    ? Math.min(1.5, (viewport.width - 48) / result.width, (viewport.height - 48) / result.height)
    : 1;
  // Readable on entry, even when a complete overview would make labels tiny.
  const readingScale = result && viewport.width ? Math.min(1.15, Math.max(0.9, (viewport.width - 48) / result.width)) : 1;
  const zoom = scale ?? readingScale;
  const changeZoom = (next) => {
    const element = containerRef.current;
    const previous = zoom;
    const centerX = (element.scrollLeft + element.clientWidth / 2) / previous;
    const centerY = (element.scrollTop + element.clientHeight / 2) / previous;
    const value = Math.min(3, Math.max(0.15, next));
    setScale(value);
    requestAnimationFrame(() => {
      element.scrollLeft = centerX * value - element.clientWidth / 2;
      element.scrollTop = centerY * value - element.clientHeight / 2;
    });
  };
  const fit = () => {
    setScale(fitScale);
    containerRef.current.scrollTo(0, 0);
  };
  const pointerDown = (event) => {
    if (!dragEnabled || showCode || event.pointerType === 'touch' || event.button !== 0) return;
    const element = containerRef.current;
    dragRef.current = { x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
    element.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };
  const stopDrag = () => { dragRef.current = null; setIsPanning(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); }
    catch { setCopied(false); }
  };

  return (
    <div className={`diagram-viewer ${isFullscreen ? 'diagram-viewer--fullscreen' : ''}`}>
      <div className="diagram-toolbar" role="toolbar" aria-label="Diagram controls">
        <div className="diagram-zoom-controls">
          <button type="button" onClick={() => changeZoom(zoom / 1.2)} disabled={!result || showCode || zoom <= 0.15} aria-label="Zoom out"><FiZoomOut /></button>
          <output aria-live="polite" aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => changeZoom(zoom * 1.2)} disabled={!result || showCode || zoom >= 3} aria-label="Zoom in"><FiZoomIn /></button>
          <button type="button" onClick={fit} disabled={!result || showCode}>Fit</button>
          <button type="button" onClick={() => changeZoom(1)} disabled={!result || showCode} aria-label="Actual size">100%</button>
        </div>
        <div className="diagram-actions">
          <button type="button" className="diagram-drag-toggle" aria-pressed={dragEnabled} onClick={() => setDragEnabled(!dragEnabled)} disabled={showCode} aria-label="Drag to pan"><FiMove /><span>Drag</span></button>
          <button type="button" aria-pressed={showCode} onClick={() => setShowCode(!showCode)} aria-label={showCode ? 'Show diagram' : 'Show source'}><FiCode /><span>{showCode ? 'Diagram' : 'Source'}</span></button>
          {showCode && <button type="button" onClick={copy} aria-label={copied ? 'Source copied' : 'Copy source'}>{copied ? <FiCheck /> : <FiCopy />}</button>}
          <button type="button" onClick={onToggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}>{isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}<span className="diagram-expand-label">{isFullscreen ? 'Close' : 'Expand'}</span></button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`diagram-viewport ${dragEnabled ? 'diagram-viewport--draggable' : ''} ${isPanning ? 'diagram-viewport--dragging' : ''}`}
        tabIndex={0}
        role="region"
        aria-label={`${diagram.shortLabel} diagram. Use arrow keys to scroll.`}
        data-lenis-prevent
        onPointerDown={pointerDown}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          containerRef.current.scrollLeft = dragRef.current.left - event.clientX + dragRef.current.x;
          containerRef.current.scrollTop = dragRef.current.top - event.clientY + dragRef.current.y;
        }}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setDragEnabled(false); stopDrag(); }
        }}
      >
        {showCode ? <pre className="diagram-source"><code>{code}</code></pre>
          : renderError ? <div className="diagram-status" role="alert"><p>{renderError}</p><button type="button" onClick={() => setShowCode(true)}>Read diagram source</button></div>
          : !result ? <div className="diagram-status" role="status">Loading diagram…</div>
          : <div className="diagram-stage" style={{ width: result.width * zoom + 48, minHeight: result.height * zoom + 48 }}>
            <div className="diagram-svg" style={{ width: result.width * zoom, height: result.height * zoom }} dangerouslySetInnerHTML={{ __html: result.svg }} />
          </div>}
      </div>
      <p className="diagram-help">{showCode ? 'Mermaid source for this view.' : 'Scroll within the diagram to explore. Fit shows the whole view; 100% restores readable labels.'}<span className="diagram-touch-help"> Swipe sideways to see more.</span></p>
    </div>
  );
}
