import React from 'react';
import { Slider } from './Slider';

interface LUTBlendControlProps {
  value: number; // 0–100
  onChange: (v: number) => void;
}

/**
 * Blends the graded result with a filmic (ACES-inspired) tone-mapped version.
 * 0 % = untouched grade, 100 % = fully filmic.
 */
export const LUTBlendControl: React.FC<LUTBlendControlProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Slider
        id="agx-blend"
        label="Filmic Blend"
        value={value}
        defaultValue={0}
        min={0}
        max={100}
        step={1}
        onChange={onChange}
      />
      <p className="text-[10px] text-gray-600 leading-relaxed">
        Mixes your grade with a filmic (Hable/Uncharted) tone-mapping curve.
        Adds highlight rolloff and a cinematic S-curve at the extremes.
      </p>
    </div>
  );
};
