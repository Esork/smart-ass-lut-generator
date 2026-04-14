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

  // If an external LUT is loaded and we're blending with it, use it directly
  if (importedLut && settings.agxBlend > 0) {
    const lutData = new Uint8ClampedArray(importedLut.data);
    // Transfer the imported LUT back
    postMessage(lutData, [importedLut.data]);
  } else {
    // Generate LUT from settings
    const lut = generateLutData(settings);
    // Transfer the buffer (zero-copy) back to the main thread
    postMessage(lut, [lut.buffer]);
  }
});

