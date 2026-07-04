import { useRef, useEffect, useState } from 'react';
import './MagnetLines.css';

export default function MagnetLines({
  containerSize = '100%',
  lineColor = '#efefef',
  lineWidth = '1vmin',
  lineHeight = '5vmin',
  baseAngle = -10,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ rows: 10, columns: 10 });

  useEffect(() => {
    const updateGrid = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      
      // Calculate columns and rows based on screen space (approx 6vmin spacing)
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const spacing = 7 * vmin; // 7vmin spacing
      
      const cols = Math.max(5, Math.floor(width / spacing));
      const rws = Math.max(3, Math.floor(height / spacing));
      
      setGridSize({ rows: rws, columns: cols });
    };

    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('span');
    let cachedRects = [];

    const updateCache = () => {
      cachedRects = Array.from(items).map(item => item.getBoundingClientRect());
    };

    // Initial cache calculation
    updateCache();
    window.addEventListener('resize', updateCache);

    const onPointerMove = pointer => {
      items.forEach((item, index) => {
        const rect = cachedRects[index];
        if (!rect) return;

        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;

        const b = pointer.x - centerX;
        const a = pointer.y - centerY;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > centerY ? 1 : -1);

        item.style.setProperty('--rotate', `${r}deg`);
      });
    };

    window.addEventListener('pointermove', onPointerMove);

    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      const rect = cachedRects[middleIndex];
      if (rect) {
        onPointerMove({ x: rect.x, y: rect.y });
      }
    }

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', updateCache);
    };
  }, [gridSize]); // Re-run when grid size changes

  const total = gridSize.rows * gridSize.columns;
  const spans = Array.from({ length: total }, (_, i) => (
    <span
      key={i}
      style={{
        '--rotate': `${baseAngle}deg`,
        backgroundColor: lineColor,
        width: lineWidth,
        height: lineHeight
      }}
    />
  ));

  return (
    <div
      ref={containerRef}
      className={`magnetLines-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
        width: containerSize,
        height: containerSize,
        ...style
      }}
    >
      {spans}
    </div>
  );
}
