
import React from 'react';
import { ZoneSettings, ZoneVector } from '../types';
import { Slider } from './Slider';

interface ZoneControlsProps {
  zones: ZoneSettings;
  onChange: (z: ZoneSettings) => void;
}

export const ZoneControls: React.FC<ZoneControlsProps> = ({ zones, onChange }) => {
  
  const updateRange = (key: keyof ZoneSettings['ranges'], val: number) => {
    onChange({
      ...zones,
      ranges: { ...zones.ranges, [key]: val }
    });
  };

  const updateZone = (zone: 'shadows' | 'midtones' | 'highlights', key: keyof ZoneVector, val: number) => {
    onChange({
      ...zones,
      [zone]: { ...zones[zone], [key]: val }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Ranges */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
         <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Zone Ranges</div>
         <Slider id="z-send" label="Shadow Limit" value={zones.ranges.shadowEnd} min={0} max={1} step={0.01} onChange={(v) => updateRange('shadowEnd', v)} />
         <Slider id="z-hstart" label="Highlight Start" value={zones.ranges.highlightStart} min={0} max={1} step={0.01} onChange={(v) => updateRange('highlightStart', v)} />
         <Slider id="z-fall" label="Falloff (Smoothness)" value={zones.ranges.falloff} min={0.01} max={0.5} step={0.01} onChange={(v) => updateRange('falloff', v)} />
      </div>

      {/* SHADOWS */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 relative overflow-hidden">
         <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-900"></div>
         <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Shadows</div>
         <div className="grid grid-cols-2 gap-4">
            <div>
                <Slider id="sr" label="Red" value={zones.shadows.r} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('shadows', 'r', v)} />
                <Slider id="sg" label="Green" value={zones.shadows.g} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('shadows', 'g', v)} />
            </div>
            <div>
                <Slider id="sb" label="Blue" value={zones.shadows.b} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('shadows', 'b', v)} />
                <Slider id="sl" label="Luma Offset" value={zones.shadows.l} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('shadows', 'l', v)} />
            </div>
         </div>
      </div>

      {/* MIDTONES */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 relative overflow-hidden">
         <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-500"></div>
         <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Midtones</div>
         <div className="grid grid-cols-2 gap-4">
            <div>
                <Slider id="mr" label="Red" value={zones.midtones.r} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('midtones', 'r', v)} />
                <Slider id="mg" label="Green" value={zones.midtones.g} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('midtones', 'g', v)} />
            </div>
            <div>
                <Slider id="mb" label="Blue" value={zones.midtones.b} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('midtones', 'b', v)} />
                <Slider id="ml" label="Luma Offset" value={zones.midtones.l} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('midtones', 'l', v)} />
            </div>
         </div>
      </div>

      {/* HIGHLIGHTS */}
      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 relative overflow-hidden">
         <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-200"></div>
         <div className="text-xs font-bold text-yellow-100 uppercase tracking-widest mb-4">Highlights</div>
         <div className="grid grid-cols-2 gap-4">
            <div>
                <Slider id="hr" label="Red" value={zones.highlights.r} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('highlights', 'r', v)} />
                <Slider id="hg" label="Green" value={zones.highlights.g} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('highlights', 'g', v)} />
            </div>
            <div>
                <Slider id="hb" label="Blue" value={zones.highlights.b} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('highlights', 'b', v)} />
                <Slider id="hl" label="Luma Offset" value={zones.highlights.l} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateZone('highlights', 'l', v)} />
            </div>
         </div>
      </div>
    </div>
  );
};
