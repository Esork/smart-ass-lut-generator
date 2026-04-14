import React from 'react';
import { ToneMappingSettings } from '../types';
import { Slider } from './Slider';

interface ToneMappingControlProps {
  settings: ToneMappingSettings;
  onChange: (next: ToneMappingSettings) => void;
}

/**
 * Sliders for the parametric S-curve tone mapping: Toe, Shoulder, Knee.
 */
export const ToneMappingControl: React.FC<ToneMappingControlProps> = ({ settings, onChange }) => {
  const set = (key: keyof ToneMappingSettings, v: number) =>
    onChange({ ...settings, [key]: v });

  return (
    <div className="space-y-1">
      <Slider
        id="tm-toe"
        label="Toe"
        value={settings.toe}
        defaultValue={0}
        min={0}
        max={1}
        step={0.01}
        onChange={v => set('toe', v)}
      />
      <Slider
        id="tm-shoulder"
        label="Shoulder"
        value={settings.shoulder}
        defaultValue={0}
        min={0}
        max={1}
        step={0.01}
        onChange={v => set('shoulder', v)}
      />
      <Slider
        id="tm-knee"
        label="Knee"
        value={settings.knee}
        defaultValue={0.7}
        min={0.3}
        max={0.95}
        step={0.01}
        onChange={v => set('knee', v)}
      />
      <p className="text-[10px] text-gray-600 pt-1 leading-relaxed">
        Toe lifts shadows. Shoulder rolls off highlights. Knee sets the pivot point.
      </p>
    </div>
  );
};
