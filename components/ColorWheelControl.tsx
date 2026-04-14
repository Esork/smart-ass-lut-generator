import React, { useRef, useEffect, useCallback } from 'react';
import { ZoneVector } from '../types';
import { rgbToWheel, wheelToRGB } from '../services/lutUtils';

interface ColorWheelProps {
  label: string;
  zone: ZoneVector;
  onChange: (next: ZoneVector) => void;
}

const SIZE = 120; // canvas px
const RADIUS = SIZE / 2 - 6;

/**
 * Draws a hue/saturation colour wheel onto the canvas.
 */
const drawWheel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  // Draw a ring of hue segments
  const steps = 360;
  for (let i = 0; i < steps; i++) {
    const angle1 = (i / steps) * 2 * Math.PI - Math.PI / 2;
    const angle2 = ((i + 1) / steps) * 2 * Math.PI - Math.PI / 2;

    // Outer edge: full saturation hue
    const grad = ctx.createLinearGradient(
      cx + Math.cos(angle1) * r, cy + Math.sin(angle1) * r,
      cx, cy,
    );
    const hue = i;
    grad.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
    grad.addColorStop(1, '#888888');

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle1, angle2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Overlay radial gradient: white center fading to transparent
  const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  radial.addColorStop(0, 'rgba(255,255,255,0.85)');
  radial.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  radial.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = radial;
  ctx.fill();
};

/**
 * Interactive colour wheel that maps to a zone's r/g/b values.
 * The dot position represents the current colour shift (hue + saturation).
 */
export const ColorWheelControl: React.FC<ColorWheelProps> = ({ label, zone, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging  = useRef(false);

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // Recover the current wheel position from zone r/g/b
  const [dotX, dotY] = rgbToWheel(zone.r, zone.g, zone.b);
  // dotX/dotY are in [-1,1]; map to canvas coordinates
  const dotCanvasX = cx + dotX * RADIUS;
  const dotCanvasY = cy - dotY * RADIUS; // y-axis flipped

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Wheel background (clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, 2 * Math.PI);
    ctx.clip();
    drawWheel(ctx, cx, cy, RADIUS);
    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cross-hair lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - RADIUS); ctx.lineTo(cx, cy + RADIUS); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - RADIUS, cy); ctx.lineTo(cx + RADIUS, cy); ctx.stroke();

    // Indicator dot
    const mag = Math.sqrt(dotX * dotX + dotY * dotY);
    const dotColor = mag < 0.05 ? '#ffffff' : `hsl(${Math.round(Math.atan2(dotY, dotX) * 180 / Math.PI + 360) % 360}, 90%, 65%)`;

    ctx.beginPath();
    ctx.arc(dotCanvasX, dotCanvasY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [cx, cy, dotX, dotY, dotCanvasX, dotCanvasY]);

  useEffect(() => { redraw(); }, [redraw]);

  const pointerToZone = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Normalize to [-1, 1] with y-axis flipped
    let nx = (px - cx) / RADIUS;
    let ny = -(py - cy) / RADIUS;

    // Clamp inside the wheel
    const dist = Math.sqrt(nx * nx + ny * ny);
    if (dist > 1) { nx /= dist; ny /= dist; }

    const [r, g, b] = wheelToRGB(nx, ny);
    onChange({ ...zone, r, g, b });
  }, [cx, zone, onChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    pointerToZone(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    pointerToZone(e);
  };
  const onPointerUp = () => { dragging.current = false; };

  // Double-click to reset colour to neutral
  const onDoubleClick = () => {
    onChange({ ...zone, r: 0, g: 0, b: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="cursor-crosshair rounded-full"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
      <span className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
};
