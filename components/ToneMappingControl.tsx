import React, { useRef, useEffect } from 'react';
import { ToneMappingSettings } from '../types';
import { Slider } from './Slider';
import { applyToneMappingChannel } from '../services/lutUtils';

interface ToneMappingControlProps {
  settings: ToneMappingSettings;
  onChange: (next: ToneMappingSettings) => void;
}

const CURVE_W = 200;
const CURVE_H = 80;

const drawCurve = (canvas: HTMLCanvasElement, tm: ToneMappingSettings) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, CURVE_W, CURVE_H);

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, CURVE_W, CURVE_H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = (CURVE_W / 4) * i;
    const y = (CURVE_H / 4) * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CURVE_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CURVE_W, y); ctx.stroke();
  }

  // Identity line (linear reference)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(0, CURVE_H);
  ctx.lineTo(CURVE_W, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tone-mapped curve
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px <= CURVE_W; px++) {
    const input  = px / CURVE_W;
    const output = applyToneMappingChannel(input, tm);
    const cx = px;
    const cy = CURVE_H - output * CURVE_H;
    if (px === 0) ctx.moveTo(cx, cy);
    else          ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Knee indicator
  const kneeX = tm.knee * CURVE_W;
  ctx.strokeStyle = 'rgba(251,191,36,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(kneeX, 0);
  ctx.lineTo(kneeX, CURVE_H);
  ctx.stroke();
  ctx.setLineDash([]);
};

/**
 * Sliders for the parametric S-curve tone mapping: Toe, Shoulder, Knee.
 * Includes a live curve preview canvas.
 */
export const ToneMappingControl: React.FC<ToneMappingControlProps> = ({ settings, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawCurve(canvasRef.current, settings);
  }, [settings]);

  const set = (key: keyof ToneMappingSettings, v: number) =>
    onChange({ ...settings, [key]: v });

  return (
    <div className="space-y-3">
      {/* Curve preview */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CURVE_W}
          height={CURVE_H}
          className="rounded-lg border border-gray-800"
          style={{ width: CURVE_W, height: CURVE_H }}
        />
      </div>

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
          tooltip="Lifts and softens shadows. 0 = linear, 1 = heavy lift."
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
          tooltip="Rolls off highlights to prevent clipping. 0 = linear, 1 = strong rolloff."
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
          tooltip="Pivot point (shown as amber line) where the shoulder curve begins."
        />
      </div>
      <p className="text-[10px] text-gray-600 leading-relaxed">
        Toe lifts shadows · Shoulder rolls off highlights · Knee sets the pivot
      </p>
    </div>
  );
};
