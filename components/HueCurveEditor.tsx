
import React, { useRef, useState } from 'react';
import { Point } from '../types';

interface HueCurveEditorProps {
  points: Point[];
  onChange: (points: Point[]) => void;
  mode: 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat';
}

export const HueCurveEditor: React.FC<HueCurveEditorProps> = ({ points, onChange, mode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const sortedPoints = [...points].sort((a, b) => a.x - b.x);

  const viewSize = 100;

  const toSvg = (p: Point) => ({
    x: p.x * viewSize,
    y: viewSize - (p.y * viewSize)
  });

  const getNormalizedPoint = (e: React.MouseEvent, rect: DOMRect) => {
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, 1 - ((e.clientY - rect.top) / rect.height)));
    return { x, y };
  };

  const getPathD = () => {
    if (sortedPoints.length === 0) {
        return `M 0 ${viewSize/2} L ${viewSize} ${viewSize/2}`;
    }
    
    let d = "";
    const start = toSvg(sortedPoints[0]);
    d = `M ${start.x} ${start.y}`;
    
    for (let i = 1; i < sortedPoints.length; i++) {
      const p = toSvg(sortedPoints[i]);
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (draggingIdx !== null) return;
    if ((e.target as Element).tagName === 'circle') return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newPoint = getNormalizedPoint(e, rect);

    const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingIdx === null) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const p = getNormalizedPoint(e, rect);
    const newPoints = [...points];
    
    newPoints[draggingIdx] = p;
    
    newPoints[draggingIdx].x = Math.min(1, Math.max(0, newPoints[draggingIdx].x));
    newPoints[draggingIdx].y = Math.min(1, Math.max(0, newPoints[draggingIdx].y));

    onChange(newPoints);
  };

  const handleMouseUp = () => setDraggingIdx(null);

  const handlePointDoubleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); 
    e.preventDefault();
    const newPoints = points.filter((_, i) => i !== index);
    onChange(newPoints);
  };

  const getGradient = () => {
    if (mode === 'lumaVsSat') {
        return 'linear-gradient(to right, #000, #fff)';
    }
    return 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)';
  };

  const getVerticalGradient = () => {
    // For hueVsHue, show input hue colors on the left (vertical)
    if (mode === 'hueVsHue') {
      return 'linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)';
    }
    return 'linear-gradient(to bottom, #888, #888)';
  };

  return (
    <div className="w-full aspect-square bg-gray-800 rounded-lg relative border border-gray-700 overflow-hidden"
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
      {/* Vertical Hue Band (left side, for hueVsHue mode) */}
      {mode === 'hueVsHue' && (
        <div className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none" style={{ background: getVerticalGradient() }}></div>
      )}

      {/* Gradient Bar at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-4 opacity-80" style={{ background: getGradient() }}></div>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-4 mb-4">
         {[...Array(16)].map((_, i) => (
           <div key={i} className="border-r border-b border-gray-700/50"></div>
         ))}
      </div>
      
      {/* Center Line (Neutral) */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/50 pointer-events-none transform -translate-y-1/2"></div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${viewSize} ${viewSize}`} 
        preserveAspectRatio="none"
        className="w-full h-full cursor-crosshair relative z-10 mb-4"
        style={{ height: 'calc(100% - 16px)' }} 
        onMouseDown={handleSvgMouseDown}
      >
        <path 
          d={getPathD()} 
          fill="none" 
          stroke="#00d9ff" 
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke"
          className="pointer-events-none shadow-sm"
        />

        {sortedPoints.map((p, i) => {
          const svgP = toSvg(p);
          return (
            <circle 
              key={i}
              cx={svgP.x}
              cy={svgP.y}
              r={draggingIdx === i ? 3 : 2}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={`cursor-pointer transition-all ${draggingIdx === i ? 'fill-white' : 'fill-gray-900 stroke-cyan-400 stroke-2'}`}
              onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDraggingIdx(i);
              }}
              onDoubleClick={(e) => handlePointDoubleClick(e, i)}
            />
          );
        })}
      </svg>
      
      {/* Helper Text */}
      <div className="absolute top-2 right-2 text-[10px] text-gray-400 pointer-events-none bg-black/50 px-1 rounded">
        {mode === 'hueVsHue' ? 'Hue Shift' : mode === 'hueVsSat' ? 'Sat Scale' : mode === 'hueVsLuma' ? 'Luma Shift' : 'Sat Scale'}
      </div>
    </div>
  );
};
