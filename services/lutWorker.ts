/// <reference lib="webworker" />
import { generateLutData } from './imageProcessing';
import type { LutSettings } from '../types';

addEventListener('message', (e: MessageEvent<LutSettings>) => {
  const lut = generateLutData(e.data);
  // Transfer the buffer (zero-copy) back to the main thread
  postMessage(lut, [lut.buffer]);
});
