import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LutSettings, HistoryEntry } from '../types';
import { applyLutToPixel } from '../services/imageProcessing';

interface PreviewAreaProps {
  imageSrc: string | null;
  settings: LutSettings;
  onUndo: () => void;
  canUndo: boolean;
  history: HistoryEntry[];
  onJumpToHistory: (index: number) => void;
  onExportImage?: (download: () => void) => void;
}

type ViewMode = 'preview' | 'original';

// Hard cap on canvas buffer size — good quality vs speed tradeoff
const MAX_RENDER_PIXELS = 1920 * 1080;

const settingsAreDefault = (s: LutSettings) =>
  s.exposure === 0 && s.brightness === 0 && s.offset === 0 &&
  s.contrast === 1.0 && s.saturation === 1.0 && s.vibrance === 0 &&
  s.temperature === 0 && s.tint === 0 &&
  s.curves.master.length === 2 && s.curves.red.length === 2 &&
  s.curves.green.length === 2 && s.curves.blue.length === 2 &&
  s.secondaries.hueVsHue.length === 0 && s.secondaries.hueVsSat.length === 0 &&
  s.secondaries.hueVsLuma.length === 0 && s.secondaries.lumaVsSat.length === 0 &&
  s.zones.shadows.l === 0 && s.zones.shadows.r === 0 &&
  s.zones.shadows.g === 0 && s.zones.shadows.b === 0 &&
  s.zones.midtones.l === 0 && s.zones.midtones.r === 0 &&
  s.zones.midtones.g === 0 && s.zones.midtones.b === 0 &&
  s.zones.highlights.l === 0 && s.zones.highlights.r === 0 &&
  s.zones.highlights.g === 0 && s.zones.highlights.b === 0;

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  imageSrc,
  settings,
  onUndo,
  canUndo,
  history,
  onJumpToHistory,
  onExportImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [viewMode, setViewMode]           = useState<ViewMode>('preview');
  const [showHistory, setShowHistory]     = useState(false);

  const [scale, setScale]           = useState(1);
  const [position, setPosition]     = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 });
  const [zoomInputValue, setZoomInputValue] = useState('100');

  // Pre-baked 32³ LUT — updated by web worker, read by draw
  const lutRef = useRef<Uint8ClampedArray | null>(null);

  // Ref mirror of settings so draw callback never has a stale closure
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Bumped whenever the worker delivers a new LUT — triggers a redraw
  const [lutVersion, setLutVersion] = useState(0);

  // ── Web worker for LUT generation ──────────────────────────────────────────
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../services/lutWorker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent<Uint8ClampedArray>) => {
      lutRef.current = e.data;
      setLutVersion(v => v + 1);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  // ── LUT generation (debounced 50ms, off main thread) ───────────────────────
  useEffect(() => {
    if (settingsAreDefault(settings)) {
      lutRef.current = null;
      setLutVersion(v => v + 1); // trigger draw to show un-graded image
      return;
    }
    const id = setTimeout(() => {
      workerRef.current?.postMessage(settings);
    }, 50);
    return () => clearTimeout(id);
  }, [settings]);

  // ── Canvas sizing ───────────────────────────────────────────────────────────
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    let dpr = window.devicePixelRatio || 1;
    if (cw * ch * dpr * dpr > MAX_RENDER_PIXELS) dpr = Math.sqrt(MAX_RENDER_PIXELS / (cw * ch));
    const pw = Math.round(cw * dpr);
    const ph = Math.round(ch * dpr);
    if (canvasRef.current.width !== pw || canvasRef.current.height !== ph) {
      canvasRef.current.width  = pw;
      canvasRef.current.height = ph;
    }
    canvasRef.current.style.width  = `${cw}px`;
    canvasRef.current.style.height = `${ch}px`;
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  useEffect(() => { updateCanvasSize(); }, [updateCanvasSize]);

  // ── Auto-fit ────────────────────────────────────────────────────────────────
  const fitImageToScreen = useCallback(() => {
    if (!originalImage || !containerRef.current) return;
    const pad = 40;
    const cw  = Math.max(100, containerRef.current.clientWidth);
    const ch  = Math.max(100, containerRef.current.clientHeight);
    let fit = Math.min((cw - pad) / originalImage.width, (ch - pad) / originalImage.height, 1.0);
    if (!isFinite(fit) || fit <= 0) fit = 0.1;
    setScale(fit);
    setPosition({ x: 0, y: 0 });
  }, [originalImage]);

  // ── Image load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setOriginalImage(img);
      if (containerRef.current) {
        const pad = 40;
        const cw  = Math.max(100, containerRef.current.clientWidth);
        const ch  = Math.max(100, containerRef.current.clientHeight);
        let fit = Math.min((cw - pad) / img.width, (ch - pad) / img.height, 1.0);
        if (!isFinite(fit) || fit <= 0) fit = 0.1;
        setScale(fit);
      }
      setPosition({ x: 0, y: 0 });
      setTimeout(updateCanvasSize, 0);
    };
  }, [imageSrc, updateCanvasSize]);

  useEffect(() => { setZoomInputValue(Math.round(scale * 100).toString()); }, [scale]);

  // ── Draw ────────────────────────────────────────────────────────────────────
  // 'settings' is intentionally NOT in these deps — we read via settingsRef so
  // the draw only fires when the LUT is ready (lutVersion), or UI state changes.
  // This prevents the pixel loop from running on every single slider tick.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w   = canvas.width;
    const h   = canvas.height;
    const dpr = w / containerRef.current.clientWidth;

    ctx.clearRect(0, 0, w, h);
    if (!originalImage) return;

    // Step 1: draw image on GPU
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.translate(position.x * dpr, position.y * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
    ctx.restore();

    // Step 2: apply LUT via trilinear lookup (5–10× faster than full pipeline)
    if (viewMode === 'original') return;
    if (settingsAreDefault(settingsRef.current)) return;

    const lut = lutRef.current;
    if (!lut) return;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const len  = data.length;

    for (let i = 0; i < len; i += 4) {
      if (data[i + 3] === 0) continue;
      const [r, g, b] = applyLutToPixel(data[i], data[i + 1], data[i + 2], lut);
      data[i]     = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, viewMode, scale, position, lutVersion]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  // ── Interaction ─────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    if (!originalImage) return;
    e.preventDefault();
    setScale(s => Math.min(Math.max(0.01, s - e.deltaY * 0.001), 20));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!originalImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !originalImage) return;
    const bx = (originalImage.width  * scale) / 2;
    const by = (originalImage.height * scale) / 2;
    setPosition({
      x: Math.max(-bx, Math.min(bx, e.clientX - dragStart.x)),
      y: Math.max(-by, Math.min(by, e.clientY - dragStart.y)),
    });
  };

  const applyZoomInput = () => {
    let val = parseFloat(zoomInputValue);
    if (isNaN(val)) val = 100;
    val = Math.max(1, Math.min(2000, val));
    setScale(val / 100);
    setZoomInputValue(val.toString());
  };

  // ── Image export ────────────────────────────────────────────────────────────
  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  useEffect(() => {
    onExportImage?.(downloadImage);
  }, [downloadImage, onExportImage]);
  const historyPanel = showHistory ? (
    <div className="absolute top-14 left-4 z-40 w-60 bg-gray-900/97 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <span className="text-xs font-bold text-white tracking-wide uppercase">Action History</span>
        <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white transition-colors leading-none">✕</button>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-0.5 custom-scrollbar">
        <div className="flex items-center px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2.5 flex-shrink-0" />
          <span className="text-xs text-cyan-300 font-semibold">Current State</span>
        </div>

        {history.length === 0 ? (
          <p className="text-[10px] text-gray-600 text-center py-4">No history yet.</p>
        ) : (
          [...history].reverse().map((entry, revIdx) => {
            const realIdx = history.length - 1 - revIdx;
            return (
              <button
                key={revIdx}
                onClick={() => { onJumpToHistory(realIdx); setShowHistory(false); }}
                className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 text-left group transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2.5 flex-shrink-0 group-hover:bg-gray-400 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-gray-100 flex-1 transition-colors">{entry.label}</span>
                <span className="text-[9px] text-gray-600 group-hover:text-gray-500 ml-1 flex-shrink-0">↩</span>
              </button>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-800 flex-shrink-0">
        <p className="text-[9px] text-gray-600 text-center">Click any entry to restore · {history.length}/10 saved</p>
      </div>
    </div>
  ) : null;

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-black relative">

      {/* Top toolbar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">

        {/* Left pill: Undo + History */}
        <div className="bg-gray-800/90 backdrop-blur-md rounded-lg p-1 flex items-center shadow-xl pointer-events-auto border border-gray-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors
              ${canUndo ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v5h5"/><path d="M3 12a9 9 0 1 0 2.63-6.36L3 7"/>
            </svg>
            Undo
          </button>

          <div className="w-px h-4 bg-gray-700 mx-0.5" />

          <button
            onClick={() => setShowHistory(h => !h)}
            disabled={history.length === 0}
            title="Action History"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors
              ${showHistory ? 'bg-gray-700 text-white'
                : history.length > 0 ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 cursor-not-allowed'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            History
            {history.length > 0 && (
              <span className="bg-gray-600 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Right pill: Original / Preview */}
        <div className="bg-gray-800/90 backdrop-blur-md rounded-lg p-1 flex space-x-1 shadow-xl pointer-events-auto border border-gray-700">
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded transition-colors
              ${viewMode === 'original' ? 'bg-gray-200 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded transition-colors
              ${viewMode === 'preview' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Floating history panel */}
      {historyPanel}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-gray-900 flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {!originalImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Drag & Drop or Upload an Image</p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="block touch-none" style={{ width: '100%', height: '100%' }} />

        {originalImage && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-30">
            <div className="bg-black/80 backdrop-blur text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-700 shadow-lg flex items-center space-x-3 pointer-events-auto">
              <span className="text-gray-500 font-mono">{originalImage.width} × {originalImage.height}</span>
              <div className="h-3 w-px bg-gray-700" />
              <div className="flex items-center bg-gray-800 rounded px-1">
                <input
                  type="text"
                  value={zoomInputValue}
                  onChange={e => setZoomInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { applyZoomInput(); (e.target as HTMLInputElement).blur(); } }}
                  onBlur={applyZoomInput}
                  className="w-8 bg-transparent text-right focus:outline-none text-cyan-400 font-bold"
                />
                <span className="ml-0.5">%</span>
              </div>
              <div className="h-3 w-px bg-gray-700" />
              <button onClick={fitImageToScreen} className="hover:text-white transition-colors font-medium">Fit</button>
              <button onClick={() => setScale(1.0)} className="hover:text-white transition-colors font-medium">1:1</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
