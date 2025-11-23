
import React, { useRef, useState } from 'react';
import { Point } from '../types';

interface CurveEditorProps {
  points: Point[];
  onChange: (points: Point[]) => void;
  color: string;
}

export const CurveEditor: React.FC<CurveEditorProps> = ({ points, onChange, color }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Sort points for rendering
  const sortedPoints = [...points].sort((a, b) => a.x - b.x);

  // Use 100x100 viewBox for percentage-like logic
  const viewSize = 100;

  const toSvg = (p: Point) => ({
    x: p.x * viewSize,
    y: viewSize - (p.y * viewSize)
  });

  // Helper to get normalized 0-1 coords from MouseEvent based on actual element size
  const getNormalizedPoint = (e: React.MouseEvent, rect: DOMRect) => {
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, 1 - ((e.clientY - rect.top) / rect.height)));
    return { x, y };
  };

  const getPathD = () => {
    if (sortedPoints.length === 0) return "";
    const start = toSvg(sortedPoints[0]);
    let d = `M ${start.x} ${start.y}`;
    for (let i = 1; i < sortedPoints.length; i++) {
      const p = toSvg(sortedPoints[i]);
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  };

  const handlePointMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingIdx(index);
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (draggingIdx !== null) return;
    if ((e.target as Element).tagName === 'circle') return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newPoint = getNormalizedPoint(e, rect);

    // Add point
    const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIdx === null) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const p = getNormalizedPoint(e, rect);
    const newPoints = [...points];
    
    // Lock start/end X axis
    if (draggingIdx === 0) p.x = 0;
    if (draggingIdx === points.length - 1) p.x = 1;

    // Constraint X within neighbors
    if (draggingIdx > 0) p.x = Math.max(p.x, newPoints[draggingIdx - 1].x + 0.01);
    if (draggingIdx < points.length - 1) p.x = Math.min(p.x, newPoints[draggingIdx + 1].x - 0.01);

    newPoints[draggingIdx] = p;
    onChange(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingIdx(null);
  };

  const handlePointDoubleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();

    if (index === 0 || index === points.length - 1) return; 
    
    const newPoints = points.filter((_, i) => i !== index);
    onChange(newPoints);
  };

  return (
    <div className="w-full aspect-square bg-gray-800 rounded-lg relative border border-gray-700 overflow-hidden"
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-4">
         {[...Array(16)].map((_, i) => (
           <div key={i} className="border-r border-b border-gray-700/50"></div>
         ))}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeDasharray="4" />
      </svg>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${viewSize} ${viewSize}`} 
        preserveAspectRatio="none"
        className="w-full h-full cursor-crosshair relative z-10"
        onMouseDown={handleSvgMouseDown}
      >
        <path 
          d={getPathD()} 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke"
          className="pointer-events-none"
        />

        {sortedPoints.map((p, i) => {
          const svgP = toSvg(p);
          return (
            <circle 
              key={i}
              cx={svgP.x}
              cy={svgP.y}
              r={draggingIdx === i ? 3 : 2} // Using small relative radius might be tricky if viewBox is 100. 
                                            // Better to use pixels via vector-effect, but react doesn't support it well on circles. 
                                            // We'll use small values relative to 100.
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={`cursor-pointer transition-all ${draggingIdx === i ? 'fill-white' : 'fill-gray-900 stroke-2'}`}
              style={{ stroke: color }}
              onMouseDown={(e) => handlePointMouseDown(e, i)}
              onDoubleClick={(e) => handlePointDoubleClick(e, i)}
            />
          );
        })}
      </svg>
    </div>
  );
};
