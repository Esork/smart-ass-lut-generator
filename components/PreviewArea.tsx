import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LutSettings } from '../types';
import { applyGradingToPixel, createProcessingContext } from '../services/imageProcessing';

interface PreviewAreaProps {
  imageSrc: string | null;
  settings: LutSettings;
}

type ViewMode = 'preview' | 'original';

// Max pixels to process per frame to maintain 60fps (approx 1080p - 1440p range)
// This decouples UI performance from image resolution.
const MAX_RENDER_PIXELS = 2073600 * 1.2; // ~2.5MP

export const PreviewArea: React.FC<PreviewAreaProps> = ({ imageSrc, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  
  // Zoom & Pan State (CSS-space coordinates)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Zoom Input State
  const [zoomInputValue, setZoomInputValue] = useState("100");

  // 1. Canvas Sizing Logic
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Calculate optimal DPR (Device Pixel Ratio)
    // If high-dpi screen makes canvas too huge for JS loop, we downsample slightly.
    let dpr = window.devicePixelRatio || 1;
    if (cw * ch * dpr * dpr > MAX_RENDER_PIXELS) {
      dpr = Math.sqrt(MAX_RENDER_PIXELS / (cw * ch));
    }

    // Set actual buffer size
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
    }
    
    // Ensure canvas visually fills container
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // Initial sizing when container mounts
  useEffect(() => {
      updateCanvasSize();
  }, [updateCanvasSize]);

  // Auto-fit Helper
  const fitImageToScreen = useCallback(() => {
    if (!originalImage || !containerRef.current) return;
    const container = containerRef.current;
    const pad = 40; 
    
    const cWidth = Math.max(100, container.clientWidth);
    const cHeight = Math.max(100, container.clientHeight);

    const availW = Math.max(10, cWidth - pad);
    const availH = Math.max(10, cHeight - pad);
    
    const scaleX = availW / originalImage.width;
    const scaleY = availH / originalImage.height;
    
    let fitScale = Math.min(scaleX, scaleY, 1.0);
    
    if (!isFinite(fitScale) || fitScale <= 0) fitScale = 0.1;

    setScale(fitScale);
    setPosition({ x: 0, y: 0 });
  }, [originalImage]);

  // 2. Load Image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setOriginalImage(img);
      
      // Initial Fit logic duplicated to ensure it runs with fresh dimensions
      if (containerRef.current) {
          const container = containerRef.current;
          const pad = 40;
          const cWidth = Math.max(100, container.clientWidth);
          const cHeight = Math.max(100, container.clientHeight);
          const availW = Math.max(10, cWidth - pad);
          const availH = Math.max(10, cHeight - pad);
          const scaleX = availW / img.width;
          const scaleY = availH / img.height;
          let fitScale = Math.min(scaleX, scaleY, 1.0);
          if (!isFinite(fitScale) || fitScale <= 0) fitScale = 0.1;
          setScale(fitScale);
      }
      setPosition({ x: 0, y: 0 });
      // Trigger canvas resize now that we might have layout changes
      setTimeout(updateCanvasSize, 0);
    };
  }, [imageSrc, updateCanvasSize]);

  // Sync local zoom input
  useEffect(() => {
    setZoomInputValue(Math.round(scale * 100).toString());
  }, [scale]);

  // 3. Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!originalImage) return;
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(0.01, scale - e.deltaY * zoomSensitivity), 20);
    setScale(newScale);
  };

  // 4. Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!originalImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !originalImage) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Boundary Logic:
    // Center of image cannot be further from center of screen than half the image's visual size.
    const boundsX = (originalImage.width * scale) / 2;
    const boundsY = (originalImage.height * scale) / 2;

    const clampedX = Math.max(-boundsX, Math.min(boundsX, newX));
    const clampedY = Math.max(-boundsY, Math.min(boundsY, newY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom Input Handlers
  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(e.target.value);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyZoomInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleZoomInputBlur = () => applyZoomInput();

  const applyZoomInput = () => {
    let val = parseFloat(zoomInputValue);
    if (isNaN(val)) val = 100;
    val = Math.max(1, Math.min(2000, val));
    setScale(val / 100);
    setZoomInputValue(val.toString());
  };

  // 5. Render Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // NOTE: canvas dimensions are already set by updateCanvasSize to match viewport * DPR
    // We do NOT resize canvas here to avoid clearing buffer unnecessarily or fighting layout
    const w = canvas.width;
    const h = canvas.height;
    
    // Calculate DPR based on buffer vs css size
    const dpr = w / containerRef.current.clientWidth;

    ctx.clearRect(0, 0, w, h);

    if (!originalImage) {
        // Draw placeholder if needed
        return;
    }

    // --- STEP 1: Draw Image to Viewport (GPU/Browser optimized) ---
    ctx.save();
    // 1. Move origin to center of canvas
    ctx.translate(w / 2, h / 2);
    // 2. Apply Pan (scaled by DPR because we are in canvas pixels)
    ctx.translate(position.x * dpr, position.y * dpr);
    // 3. Apply Zoom (scaled by DPR)
    ctx.scale(scale * dpr, scale * dpr);
    // 4. Draw image centered at origin
    // Browser handles cropping and downscaling of huge images efficiently here
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
    ctx.restore();

    // --- STEP 2: Process Visible Pixels (CPU) ---
    if (viewMode === 'original') return;

    // Optimization: Skip if default settings
    const isDefault = 
      settings.exposure === 0 && 
      settings.brightness === 0 &&
      settings.offset === 0 &&
      settings.contrast === 1.0 &&
      settings.saturation === 1.0 &&
      settings.vibrance === 0.0 &&
      settings.temperature === 0 &&
      settings.tint === 0 &&
      settings.mixer.red.r === 1 && settings.mixer.red.g === 0 && settings.mixer.red.b === 0 &&
      settings.mixer.green.r === 0 && settings.mixer.green.g === 1 && settings.mixer.green.b === 0 &&
      settings.mixer.blue.r === 0 && settings.mixer.blue.g === 0 && settings.mixer.blue.b === 1 &&
      settings.curves.master.length === 2 && 
      settings.curves.red.length === 2 && 
      settings.curves.green.length === 2 && 
      settings.curves.blue.length === 2 &&
      settings.secondaries.hueVsHue.length === 0 &&
      settings.secondaries.hueVsSat.length === 0 &&
      settings.secondaries.hueVsLuma.length === 0 &&
      settings.secondaries.lumaVsSat.length === 0 &&
      settings.zones.shadows.l === 0 && settings.zones.shadows.r === 0 &&
      settings.zones.midtones.l === 0 && settings.zones.midtones.r === 0 &&
      settings.zones.highlights.l === 0 && settings.zones.highlights.r === 0;

    if (isDefault) return;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const len = data.length;
    const context = createProcessingContext(settings);

    // The loop only runs on visible pixels (~2MP max), regardless of original image size (16MP+)
    for (let i = 0; i < len; i += 4) {
      if (data[i + 3] === 0) continue; 
      const [r, g, b] = applyGradingToPixel(data[i], data[i+1], data[i+2], settings, context);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);

  }, [originalImage, settings, viewMode, scale, position]); // Removed updateCanvasSize from deps to avoid loops

  useEffect(() => {
    let rAF = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rAF);
  }, [draw]);


  return (
    <div className="flex flex-col h-full w-full bg-black relative">
      
      {/* Top Toolbar */}
      <div className="absolute top-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="bg-gray-800/90 backdrop-blur-md rounded-lg p-1 flex space-x-1 shadow-xl pointer-events-auto border border-gray-700">
          <button 
            onClick={() => setViewMode('original')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded transition-colors ${viewMode === 'original' ? 'bg-gray-200 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Original
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`px-4 py-1.5 text-xs font-bold uppercase rounded transition-colors ${viewMode === 'preview' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-gray-900 flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!originalImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Drag & Drop or Upload a Screenshot</p>
            </div>
          </div>
        )}
        
        {/* 
           Canvas is now static in the DOM (filling the container).
           Transforms are applied internally via Context2D in the draw function.
        */}
        <canvas 
          ref={canvasRef} 
          className="block touch-none"
          style={{ width: '100%', height: '100%' }} 
        />
        
        {originalImage && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-30">
            <div className="bg-black/80 backdrop-blur text-gray-300 text-xs px-3 py-1.5 rounded-full border border-gray-700 shadow-lg flex items-center space-x-3 pointer-events-auto">
                <span className="text-gray-500 font-mono">{originalImage.width} x {originalImage.height}</span>
                <div className="h-3 w-px bg-gray-700"></div>
                
                <div className="flex items-center bg-gray-800 rounded px-1">
                  <input 
                    type="text" 
                    value={zoomInputValue}
                    onChange={handleZoomInputChange}
                    onKeyDown={handleZoomInputKeyDown}
                    onBlur={handleZoomInputBlur}
                    className="w-8 bg-transparent text-right focus:outline-none text-cyan-400 font-bold"
                  />
                  <span className="ml-0.5">%</span>
                </div>

                <div className="h-3 w-px bg-gray-700"></div>
                
                <button 
                  onClick={fitImageToScreen}
                  className="hover:text-white transition-colors font-medium"
                  title="Fit to Screen"
                >
                  Fit
                </button>
                <button 
                  onClick={() => setScale(1.0)}
                  className="hover:text-white transition-colors font-medium"
                  title="100% Scale"
                >
                  1:1
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};