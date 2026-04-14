
import React, { useEffect, useState } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue?: number;
  onChange: (val: number) => void;
  id: string;
  tooltip?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  defaultValue = 0,
  onChange,
  id,
  tooltip,
}) => {
  const [localVal, setLocalVal] = useState(value.toString());

  useEffect(() => {
    // Use 3 digits for display as requested
    setLocalVal(value.toFixed(3));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVal(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleReset = () => {
    onChange(defaultValue);
  };

  // Check if current value is significantly different from default
  const isChanged = Math.abs(value - defaultValue) > 0.0001;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} title={tooltip} className={`text-xs text-gray-400 font-medium tracking-wide uppercase ${tooltip ? 'cursor-help' : ''}`}>
          {label}{tooltip && <span className="ml-1 text-gray-600 text-[9px] normal-case font-normal">ⓘ</span>}
        </label>
        <div className="flex items-center space-x-2">
          {isChanged && (
            <button 
              onClick={handleReset}
              className="text-gray-500 hover:text-cyan-400 transition-colors focus:outline-none"
              title="Reset to default"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          )}
          <input
              type="number"
              step={step}
              value={localVal}
              onChange={handleInputChange}
              className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-right text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
      />
    </div>
  );
};
