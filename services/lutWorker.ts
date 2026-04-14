/// <reference lib="webworker" />
import { generateLutData } from './imageProcessing';
import type { LutSettings } from '../types';

interface WorkerMessage {
  settings: LutSettings;
  importedLut?: {
    name: string;
    size: number;
    data: ArrayBuffer;
  } | null;
}

addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  const { settings, importedLut } = e.data;

  // Always generate the color-graded LUT from current settings
  const generated = generateLutData(settings);

  if (importedLut && settings.agxBlend > 0) {
    // Blend: lerp each channel between generated and imported LUT
    const imported = new Uint8ClampedArray(importedLut.data);
    const t = Math.min(1, Math.max(0, settings.agxBlend / 100));
    const blended = new Uint8ClampedArray(generated.length);
    for (let i = 0; i < generated.length; i++) {
      blended[i] = Math.round(generated[i] * (1 - t) + imported[i] * t);
    }
    postMessage(blended, [blended.buffer]);
  } else {
    // No imported LUT or blend is 0 — just use the generated LUT
    postMessage(generated, [generated.buffer]);
  }
});

