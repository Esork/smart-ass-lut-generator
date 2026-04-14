import React, { useRef, useState } from 'react';
import { Slider } from './Slider';
import { loadLutFromFile } from '../services/lutFileLoader';

interface LUTBlendControlProps {
  value: number; // 0–100
  onChange: (v: number) => void;
  onLutLoad?: (lutData: { name: string; size: number; data: Uint8ClampedArray }) => void;
  loadedLutName?: string;
}

/**
 * Blends the graded result with a filmic (ACES-inspired) tone-mapped version,
 * or with an imported external LUT if one is loaded.
 *
 * 0 = untouched grade
 * 100 = fully blended with LUT/filmic effect
 */
export const LUTBlendControl: React.FC<LUTBlendControlProps> = ({
  value,
  onChange,
  onLutLoad,
  loadedLutName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lut = await loadLutFromFile(file);
      onLutLoad?.(lut);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load LUT');
      console.error('LUT loading error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-3">
      {/* Blend Strength Slider */}
      <Slider
        id="lut-blend-strength"
        label={`Blend${loadedLutName ? ` (${loadedLutName})` : ' (Filmic)'}`}
        value={value}
        defaultValue={0}
        min={0}
        max={100}
        step={1}
        onChange={onChange}
      />

      {/* LUT File Picker */}
      <div className="space-y-2">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg p-3 text-center transition-colors cursor-pointer bg-gray-900/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-[10px] text-gray-400 mb-1">
            {loadedLutName ? `📦 ${loadedLutName}` : 'Drop LUT here or click to select'}
          </p>
          {loadedLutName && (
            <p className="text-[9px] text-gray-500">
              Click to replace
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading && (
          <p className="text-[9px] text-blue-400 text-center">Loading LUT...</p>
        )}

        {error && (
          <p className="text-[9px] text-red-400 text-center">{error}</p>
        )}

        <p className="text-[10px] text-gray-600 leading-relaxed">
          {loadedLutName
            ? 'Using external LUT for blending with your grade.'
            : 'Load a 3D LUT (PNG format, 1024×32) to blend with your adjustments.'}
        </p>
      </div>
    </div>
  );
};

