
import React, { useState } from 'react';
import { LutSettings, Point, ZoneSettings } from '../types';
import { Slider } from './Slider';
import { generateLutUrl } from '../services/imageProcessing';
import { CurveEditor } from './CurveEditor';
import { HueCurveEditor } from './HueCurveEditor';
import { ZoneControls } from './ZoneControls';

interface ControlsProps {
  settings: LutSettings;
  setSettings: React.Dispatch<React.SetStateAction<LutSettings>>;
  onUpload: (file: File) => void;
  isImageLoaded: boolean;
}

type Tab = 'basic' | 'mixer' | 'curves' | 'advanced';
type CurveChannel = 'master' | 'red' | 'green' | 'blue';
type AdvSubTab = 'zones' | 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat';

// Reset Icon Component for reuse in headers
const ResetIcon = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
    title="Reset Curve"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  </button>
);

export const Controls: React.FC<ControlsProps> = ({ settings, setSettings, onUpload, isImageLoaded }) => {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [activeCurve, setActiveCurve] = useState<CurveChannel>('master');
  const [activeAdvTab, setActiveAdvTab] = useState<AdvSubTab>('zones');
  const [isProcessing, setIsProcessing] = useState(false);

  const updateSetting = (key: keyof LutSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateMixer = (channel: 'red' | 'green' | 'blue', sub: 'r' | 'g' | 'b', val: number) => {
    setSettings(prev => ({
      ...prev,
      mixer: {
        ...prev.mixer,
        [channel]: {
          ...prev.mixer[channel],
          [sub]: val
        }
      }
    }));
  };

  const updateCurve = (points: Point[]) => {
    setSettings(prev => ({
      ...prev,
      curves: {
        ...prev.curves,
        [activeCurve]: points
      }
    }));
  };

  const updateSecondary = (points: Point[]) => {
      if (activeAdvTab === 'zones') return;
      setSettings(prev => ({
          ...prev,
          secondaries: {
              ...prev.secondaries,
              [activeAdvTab]: points
          }
      }));
  };

  const updateZones = (z: ZoneSettings) => {
      setSettings(prev => ({ ...prev, zones: z }));
  };

  const resetCurve = () => {
    if (activeTab === 'curves') {
        updateCurve([{x:0, y:0}, {x:1, y:1}]);
    } else if (activeTab === 'advanced' && activeAdvTab !== 'zones') {
        updateSecondary([]);
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const url = generateLutUrl(settings);
        const link = document.createElement('a');
        link.download = 'SPT_Advanced_LUT.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Failed to generate LUT", e);
        alert("Error generating LUT");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full md:w-96 bg-gray-850 border-l border-gray-800 flex flex-col h-full shadow-2xl z-10">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gray-900">
        <h2 className="text-xl font-bold text-cyan-400 tracking-tight">LUT Lab <span className="text-xs text-gray-500 font-normal ml-2">Pro</span></h2>
        
        <div className="mt-4 flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {(['basic', 'mixer', 'curves', 'advanced'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium uppercase rounded-md transition-colors
                ${activeTab === tab ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {activeTab === 'basic' && (
          <>
             {/* Exposure Section */}
             <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                Light & Exposure
              </div>
              <Slider id="exposure" label="Exposure" value={settings.exposure} defaultValue={0} min={-3} max={3} step={0.05} onChange={(v) => updateSetting('exposure', v)} />
              <Slider id="brightness" label="Brightness" value={settings.brightness} defaultValue={0} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateSetting('brightness', v)} />
              <Slider id="offset" label="Offset (Lift)" value={settings.offset} defaultValue={0} min={-0.5} max={0.5} step={0.01} onChange={(v) => updateSetting('offset', v)} />
            </div>

            {/* Contrast Section */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                Contrast
              </div>
              <Slider id="contrast" label="Contrast" value={settings.contrast} defaultValue={1} min={0} max={2.0} step={0.05} onChange={(v) => updateSetting('contrast', v)} />
              <Slider id="pivot" label="Pivot Center" value={settings.pivot} defaultValue={0.5} min={0} max={1.0} step={0.05} onChange={(v) => updateSetting('pivot', v)} />
            </div>

            {/* Color Section */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                Color Balance
              </div>
              <Slider id="temp" label="Temp" value={settings.temperature} defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={(v) => updateSetting('temperature', v)} />
              <Slider id="tint" label="Tint" value={settings.tint} defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={(v) => updateSetting('tint', v)} />
              <div className="h-px bg-gray-800 my-3"></div>
              <Slider id="sat" label="Saturation" value={settings.saturation} defaultValue={1} min={0} max={2.0} step={0.05} onChange={(v) => updateSetting('saturation', v)} />
              <Slider id="vib" label="Vibrance (Skin Prot.)" value={settings.vibrance} defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={(v) => updateSetting('vibrance', v)} />
            </div>
          </>
        )}

        {activeTab === 'mixer' && (
          <>
            {/* Red Output */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Red Output</div>
              <Slider id="rr" label="Red -> Red" value={settings.mixer.red.r} defaultValue={1} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('red', 'r', v)} />
              <Slider id="rg" label="Green -> Red" value={settings.mixer.red.g} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('red', 'g', v)} />
              <Slider id="rb" label="Blue -> Red" value={settings.mixer.red.b} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('red', 'b', v)} />
            </div>

            {/* Green Output */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
              <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Green Output</div>
              <Slider id="gr" label="Red -> Green" value={settings.mixer.green.r} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('green', 'r', v)} />
              <Slider id="gg" label="Green -> Green" value={settings.mixer.green.g} defaultValue={1} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('green', 'g', v)} />
              <Slider id="gb" label="Blue -> Green" value={settings.mixer.green.b} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('green', 'b', v)} />
            </div>

            {/* Blue Output */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Blue Output</div>
              <Slider id="br" label="Red -> Blue" value={settings.mixer.blue.r} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('blue', 'r', v)} />
              <Slider id="bg" label="Green -> Blue" value={settings.mixer.blue.g} defaultValue={0} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('blue', 'g', v)} />
              <Slider id="bb" label="Blue -> Blue" value={settings.mixer.blue.b} defaultValue={1} min={-2} max={2} step={0.05} onChange={(v) => updateMixer('blue', 'b', v)} />
            </div>
          </>
        )}

        {activeTab === 'curves' && (
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Custom Curves</div>
              <ResetIcon onClick={resetCurve} />
            </div>
            
            <div className="flex space-x-2 mb-4">
              <button onClick={() => setActiveCurve('master')} className={`flex-1 text-xs py-1 rounded ${activeCurve === 'master' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-gray-400'}`}>Master</button>
              <button onClick={() => setActiveCurve('red')} className={`flex-1 text-xs py-1 rounded ${activeCurve === 'red' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Red</button>
              <button onClick={() => setActiveCurve('green')} className={`flex-1 text-xs py-1 rounded ${activeCurve === 'green' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Green</button>
              <button onClick={() => setActiveCurve('blue')} className={`flex-1 text-xs py-1 rounded ${activeCurve === 'blue' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Blue</button>
            </div>

            <CurveEditor 
              points={settings.curves[activeCurve]} 
              onChange={updateCurve}
              color={activeCurve === 'master' ? '#ffffff' : activeCurve === 'red' ? '#ef4444' : activeCurve === 'green' ? '#22c55e' : '#3b82f6'}
            />
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              Double-click to remove point. Drag to move.
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
           <div className="h-full flex flex-col">
              {/* Sub Nav */}
              <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setActiveAdvTab('zones')} className={`px-3 py-1 text-xs rounded border ${activeAdvTab === 'zones' ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-700 text-gray-400'}`}>Zones</button>
                  <button onClick={() => setActiveAdvTab('hueVsHue')} className={`px-3 py-1 text-xs rounded border ${activeAdvTab === 'hueVsHue' ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-700 text-gray-400'}`}>H-H</button>
                  <button onClick={() => setActiveAdvTab('hueVsSat')} className={`px-3 py-1 text-xs rounded border ${activeAdvTab === 'hueVsSat' ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-700 text-gray-400'}`}>H-S</button>
                  <button onClick={() => setActiveAdvTab('hueVsLuma')} className={`px-3 py-1 text-xs rounded border ${activeAdvTab === 'hueVsLuma' ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-700 text-gray-400'}`}>H-L</button>
                  <button onClick={() => setActiveAdvTab('lumaVsSat')} className={`px-3 py-1 text-xs rounded border ${activeAdvTab === 'lumaVsSat' ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-700 text-gray-400'}`}>L-S</button>
              </div>
              
              <div className="flex-1">
                  {activeAdvTab === 'zones' && (
                      <ZoneControls zones={settings.zones} onChange={updateZones} />
                  )}
                  {activeAdvTab !== 'zones' && (
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-full">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xs font-bold uppercase text-gray-500">
                                 {activeAdvTab === 'hueVsHue' && 'Hue vs Hue Shift'}
                                 {activeAdvTab === 'hueVsSat' && 'Hue vs Saturation'}
                                 {activeAdvTab === 'hueVsLuma' && 'Hue vs Luminance'}
                                 {activeAdvTab === 'lumaVsSat' && 'Luminance vs Saturation'}
                             </h3>
                             <ResetIcon onClick={resetCurve} />
                         </div>
                         <HueCurveEditor 
                            mode={activeAdvTab}
                            points={settings.secondaries[activeAdvTab]}
                            onChange={updateSecondary}
                         />
                         <div className="mt-4 text-xs text-gray-500 text-center">
                            Left-Click to add point. Drag to adjust. Dbl-Click to remove.
                         </div>
                      </div>
                  )}
              </div>
           </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 bg-gray-900/95 space-y-4">
        {/* Upload Section */}
        <label className="block w-full cursor-pointer group">
            <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="bg-gray-800 border border-dashed border-gray-600 rounded-lg p-3 text-center transition-all group-hover:border-cyan-400/50">
            <span className="block text-xs font-medium text-gray-300 group-hover:text-white">
                {isImageLoaded ? 'Upload New Image' : 'Upload Screenshot'}
            </span>
            </div>
        </label>

        <button
          onClick={handleDownload}
          disabled={!isImageLoaded || isProcessing}
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all transform active:scale-95
            ${!isImageLoaded 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg'
            }
          `}
        >
          {isProcessing ? 'Generating...' : 'Download LUT'}
        </button>
      </div>
    </div>
  );
};
