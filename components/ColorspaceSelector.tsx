import React from 'react';
import { Colorspace, COLORSPACE_LABELS } from '../types';

interface ColorspaceSelectorProps {
  value: Colorspace;
  onChange: (cs: Colorspace) => void;
}

const COLORSPACES: Colorspace[] = ['sRGB', 'Linear', 'LogAlexa', 'LogC3', 'LogSony', 'Cineon'];

/**
 * Selects the input colorspace of the source image.
 * The pipeline will convert to sRGB working space before processing.
 */
export const ColorspaceSelector: React.FC<ColorspaceSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {COLORSPACES.map(cs => (
          <button
            key={cs}
            onClick={() => onChange(cs)}
            className={`px-2 py-1.5 text-[10px] font-medium rounded border transition-colors text-left ${
              value === cs
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {COLORSPACE_LABELS[cs]}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 leading-relaxed">
        Sets the input colorspace. Log options expand log-encoded footage before grading.
      </p>
    </div>
  );
};
