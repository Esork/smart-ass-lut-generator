
import React, { useState, useEffect, useCallback } from 'react';
import { LutSettings, Point, ZoneSettings, DEFAULT_SETTINGS } from '../types';
import { Slider } from './Slider';
import { generateLutUrl } from '../services/imageProcessing';
import { CurveEditor } from './CurveEditor';
import { HueCurveEditor } from './HueCurveEditor';
import { ZoneControls } from './ZoneControls';
import { PRESETS } from '../presets';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ControlsProps {
  settings: LutSettings;
  setSettings: (updater: React.SetStateAction<LutSettings>, label?: string) => void;
  setPreviewOverride: (override: Partial<LutSettings> | null) => void;
  onUpload: (file: File) => void;
  onDownloadImage?: () => void;
  isImageLoaded: boolean;
}

type Tab = 'presets' | 'basic' | 'curves' | 'advanced';
type CurveChannel = 'master' | 'red' | 'green' | 'blue';
type AdvSubTab = 'zones' | 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat';
type GroupName = 'light' | 'contrast' | 'color' | 'curves' | 'zones' | 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat';

// ── Group labels ──────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<GroupName, string> = {
  light:     'Light & Exposure',
  contrast:  'Contrast',
  color:     'Color Balance',
  curves:    'Curves',
  zones:     'Zones',
  hueVsHue:  'Hue vs Hue',
  hueVsSat:  'Hue vs Sat',
  hueVsLuma: 'Hue vs Luma',
  lumaVsSat: 'Luma vs Sat',
};

// ── Action label maps ─────────────────────────────────────────────────────────

const PARAM_LABELS: Partial<Record<keyof LutSettings, string>> = {
  exposure:    'Exposure',
  brightness:  'Brightness',
  offset:      'Offset',
  contrast:    'Contrast',
  pivot:       'Pivot',
  temperature: 'Temperature',
  tint:        'Tint',
  saturation:  'Saturation',
  vibrance:    'Vibrance',
};

const CURVE_LABELS: Record<CurveChannel, string> = {
  master: 'Curve: Master',
  red:    'Curve: Red',
  green:  'Curve: Green',
  blue:   'Curve: Blue',
};

const ADV_LABELS: Record<AdvSubTab, string> = {
  zones:      'Zone Controls',
  hueVsHue:   'Hue vs Hue',
  hueVsSat:   'Hue vs Sat',
  hueVsLuma:  'Hue vs Luma',
  lumaVsSat:  'Luma vs Sat',
};

// ── Small shared components ───────────────────────────────────────────────────

const ResetIcon = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
    title="Reset group to defaults"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  </button>
);

const BypassIcon = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded transition-colors ${
      active
        ? 'text-amber-400 hover:text-amber-300'
        : 'text-gray-500 hover:text-amber-400'
    }`}
    title={active ? 'Bypass active — click to restore' : 'Bypass group (A/B compare)'}
  >
    {active ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <path d="m1 1 22 22"/>
        <path d="M10.73 10.73a3 3 0 0 0 4.24 4.24"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const computeBypassOverride = (bypassedGroups: Set<GroupName>, settings: LutSettings): Partial<LutSettings> | null => {
  if (bypassedGroups.size === 0) return null;

  const override: Partial<LutSettings> = {};

  if (bypassedGroups.has('light')) {
    override.exposure = 0;
    override.brightness = 0;
    override.offset = 0;
  }
  if (bypassedGroups.has('contrast')) {
    override.contrast = 1.0;
    override.pivot = 0.5;
  }
  if (bypassedGroups.has('color')) {
    override.temperature = 0;
    override.tint = 0;
    override.saturation = 1.0;
    override.vibrance = 0;
  }
  if (bypassedGroups.has('curves')) {
    override.curves = {
      master: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      red: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      green: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      blue: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };
  }
  if (bypassedGroups.has('zones')) {
    override.zones = DEFAULT_SETTINGS.zones;
  }

  // Secondary curves — merge carefully
  const secondariesOverride: Partial<typeof DEFAULT_SETTINGS.secondaries> = {};
  if (bypassedGroups.has('hueVsHue')) secondariesOverride.hueVsHue = [];
  if (bypassedGroups.has('hueVsSat')) secondariesOverride.hueVsSat = [];
  if (bypassedGroups.has('hueVsLuma')) secondariesOverride.hueVsLuma = [];
  if (bypassedGroups.has('lumaVsSat')) secondariesOverride.lumaVsSat = [];

  if (Object.keys(secondariesOverride).length > 0) {
    override.secondaries = {
      hueVsHue: secondariesOverride.hueVsHue ?? settings.secondaries.hueVsHue,
      hueVsSat: secondariesOverride.hueVsSat ?? settings.secondaries.hueVsSat,
      hueVsLuma: secondariesOverride.hueVsLuma ?? settings.secondaries.hueVsLuma,
      lumaVsSat: secondariesOverride.lumaVsSat ?? settings.secondaries.lumaVsSat,
    };
  }

  return override;
};

// ── Main component ────────────────────────────────────────────────────────────

export const Controls = React.memo<ControlsProps>(({
  settings,
  setSettings,
  setPreviewOverride,
  onUpload,
  onDownloadImage,
  isImageLoaded,
}) => {
  const [activeTab, setActiveTab]       = useState<Tab>('presets');
  const [activeCurve, setActiveCurve]   = useState<CurveChannel>('master');
  const [activeAdvTab, setActiveAdvTab] = useState<AdvSubTab>('zones');
  const [isProcessing, setIsProcessing] = useState(false);

  const [bypassedGroups, setBypassedGroups] = useState<Set<GroupName>>(new Set());

  // Sync bypassed groups → previewOverride
  useEffect(() => {
    const override = computeBypassOverride(bypassedGroups, settings);
    setPreviewOverride(override);
  }, [bypassedGroups, settings, setPreviewOverride]);

  // ── Group actions ──────────────────────────────────────────────────────────

  const toggleBypass = useCallback((group: GroupName) => {
    setBypassedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const resetGroup = useCallback((group: GroupName) => {
    let resetSettings: Partial<LutSettings> = {};

    if (group === 'light') {
      resetSettings = { exposure: 0, brightness: 0, offset: 0 };
    } else if (group === 'contrast') {
      resetSettings = { contrast: 1.0, pivot: 0.5 };
    } else if (group === 'color') {
      resetSettings = { temperature: 0, tint: 0, saturation: 1.0, vibrance: 0 };
    } else if (group === 'curves') {
      resetSettings = { curves: DEFAULT_SETTINGS.curves };
    } else if (group === 'zones') {
      resetSettings = { zones: DEFAULT_SETTINGS.zones };
    } else if (group === 'hueVsHue') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsHue: [] } };
    } else if (group === 'hueVsSat') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsSat: [] } };
    } else if (group === 'hueVsLuma') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsLuma: [] } };
    } else if (group === 'lumaVsSat') {
      resetSettings = { secondaries: { ...settings.secondaries, lumaVsSat: [] } };
    }

    setSettings(
      prev => ({ ...prev, ...resetSettings }),
      `Reset: ${GROUP_LABELS[group]}`,
    );

    setBypassedGroups(prev => {
      const next = new Set(prev);
      next.delete(group);
      return next;
    });
  }, [settings, setSettings]);

  // ── Updaters ───────────────────────────────────────────────────────────────

  const updateSetting = (key: keyof LutSettings, value: number) => {
    setSettings(
      prev => ({ ...prev, [key]: value }),
      PARAM_LABELS[key] ?? String(key),
    );
  };

  const updateCurve = (points: Point[]) => {
    setSettings(
      prev => ({ ...prev, curves: { ...prev.curves, [activeCurve]: points } }),
      CURVE_LABELS[activeCurve],
    );
  };

  const updateSecondary = (points: Point[]) => {
    if (activeAdvTab === 'zones') return;
    setSettings(
      prev => ({ ...prev, secondaries: { ...prev.secondaries, [activeAdvTab]: points } }),
      ADV_LABELS[activeAdvTab],
    );
  };

  const updateZones = (z: ZoneSettings) => {
    setSettings(prev => ({ ...prev, zones: z }), 'Zone Controls');
  };

  const resetCurve = () => {
    if (activeTab === 'curves') {
      updateCurve([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    } else if (activeTab === 'advanced' && activeAdvTab !== 'zones') {
      updateSecondary([]);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const url = generateLutUrl(settings);
        const link = document.createElement('a');
        link.download = 'Advanced_LUT.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error('Failed to generate LUT', e);
        alert('Error generating LUT');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: Tab[] = ['presets', 'basic', 'curves', 'advanced'];
  const tabLabels: Record<Tab, string> = {
    presets:  'Presets',
    basic:    'Basic',
    curves:   'Curves',
    advanced: 'Adv',
  };

  const groupHeader = (group: GroupName) => (
    <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
        {GROUP_LABELS[group]}
      </div>
      <div className="flex items-center gap-0.5">
        <ResetIcon onClick={() => resetGroup(group)} />
        <BypassIcon active={bypassedGroups.has(group)} onClick={() => toggleBypass(group)} />
      </div>
    </div>
  );

  return (
    <div className="w-full md:w-96 bg-gray-850 border-l border-gray-800 flex flex-col h-full shadow-2xl z-10 relative">

      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-cyan-400 tracking-tight">
            LUT Lab <span className="text-xs text-gray-500 font-normal ml-1">Pro</span>
          </h2>
        </div>

        <div className="flex space-x-0.5 bg-gray-800 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-colors
                ${activeTab === tab
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar min-h-0">

        {/* ── PRESETS TAB ── */}
        {activeTab === 'presets' && (
          <div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Click a preset to apply it as a starting point. Fine-tune from there using the other tabs.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setSettings(
                    { ...DEFAULT_SETTINGS, ...preset.settings },
                    `Preset: ${preset.name}`,
                  )}
                  className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-left hover:border-cyan-500/60 transition-all group active:scale-95"
                >
                  <div
                    className="h-9 rounded-md mb-2.5 opacity-90 group-hover:opacity-100 transition-opacity"
                    style={{ background: preset.gradient }}
                  />
                  <div className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 leading-snug line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── BASIC TAB ── */}
        {activeTab === 'basic' && (
          <>
            {/* Light & Exposure */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('light')}
              <div className={bypassedGroups.has('light') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="exposure"   label="Exposure"      value={settings.exposure}   defaultValue={0}   min={-3}   max={3}   step={0.05} onChange={v => updateSetting('exposure',   v)} />
                <Slider id="brightness" label="Brightness"    value={settings.brightness} defaultValue={0}   min={-0.5} max={0.5} step={0.01} onChange={v => updateSetting('brightness', v)} />
                <Slider id="offset"     label="Offset (Lift)" value={settings.offset}     defaultValue={0}   min={-0.5} max={0.5} step={0.01} onChange={v => updateSetting('offset',     v)} />
              </div>
            </div>

            {/* Contrast */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('contrast')}
              <div className={bypassedGroups.has('contrast') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="contrast" label="Contrast"     value={settings.contrast} defaultValue={1}   min={0} max={2.0} step={0.05} onChange={v => updateSetting('contrast', v)} />
                <Slider id="pivot"    label="Pivot Center" value={settings.pivot}    defaultValue={0.5} min={0} max={1.0} step={0.05} onChange={v => updateSetting('pivot',    v)} />
              </div>
            </div>

            {/* Color Balance */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('color')}
              <div className={bypassedGroups.has('color') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="temp" label="Temp"                  value={settings.temperature} defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('temperature', v)} />
                <Slider id="tint" label="Tint"                  value={settings.tint}        defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('tint',        v)} />
                <div className="h-px bg-gray-800 my-3" />
                <Slider id="sat" label="Saturation"             value={settings.saturation}  defaultValue={1} min={0} max={2.0} step={0.05} onChange={v => updateSetting('saturation', v)} />
                <Slider id="vib" label="Vibrance (Skin Prot.)"  value={settings.vibrance}    defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('vibrance',  v)} />
              </div>
            </div>
          </>
        )}

        {/* ── CURVES TAB ── */}
        {activeTab === 'curves' && (
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-full flex flex-col">
            {groupHeader('curves')}
            <div className={bypassedGroups.has('curves') ? 'opacity-40 pointer-events-none select-none' : ''}>
              <div className="flex space-x-2 mb-4">
                {(['master', 'red', 'green', 'blue'] as CurveChannel[]).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActiveCurve(ch)}
                    className={`flex-1 text-xs py-1 rounded transition-colors ${
                      activeCurve === ch
                        ? ch === 'master' ? 'bg-gray-200 text-black'
                        : ch === 'red'    ? 'bg-red-500 text-white'
                        : ch === 'green'  ? 'bg-green-500 text-white'
                        :                   'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </button>
                ))}
              </div>

              <CurveEditor
                points={settings.curves[activeCurve]}
                onChange={updateCurve}
                color={
                  activeCurve === 'master' ? '#ffffff'
                  : activeCurve === 'red'  ? '#ef4444'
                  : activeCurve === 'green'? '#22c55e'
                  :                         '#3b82f6'
                }
              />

              <div className="mt-4 text-xs text-gray-500 text-center">
                Double-click to remove point. Drag to move.
              </div>
            </div>
          </div>
        )}

        {/* ── ADVANCED TAB ── */}
        {activeTab === 'advanced' && (
          <div className="h-full flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              {(['zones', 'hueVsHue', 'hueVsSat', 'hueVsLuma', 'lumaVsSat'] as AdvSubTab[]).map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveAdvTab(sub)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    activeAdvTab === sub
                      ? 'bg-cyan-500 border-cyan-500 text-black'
                      : 'border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {sub === 'zones' ? 'Zones' : sub === 'hueVsHue' ? 'H-H' : sub === 'hueVsSat' ? 'H-S' : sub === 'hueVsLuma' ? 'H-L' : 'L-S'}
                </button>
              ))}
            </div>

            <div className="flex-1">
              {activeAdvTab === 'zones' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-full flex flex-col">
                  {groupHeader('zones')}
                  <div className={bypassedGroups.has('zones') ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <ZoneControls zones={settings.zones} onChange={updateZones} />
                  </div>
                </div>
              )}
              {activeAdvTab !== 'zones' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 h-full flex flex-col">
                  {groupHeader(activeAdvTab as 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat')}
                  <div className={bypassedGroups.has(activeAdvTab) ? 'opacity-40 pointer-events-none select-none flex-1' : 'flex-1'}>
                    <HueCurveEditor
                      mode={activeAdvTab}
                      points={settings.secondaries[activeAdvTab]}
                      onChange={updateSecondary}
                    />
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      Left-Click to add point. Drag to adjust. Dbl-Click to remove.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div className="p-5 border-t border-gray-800 bg-gray-900/95 space-y-3 flex-shrink-0">
        <label className="block w-full cursor-pointer group">
          <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
          <div className="bg-gray-800 border border-dashed border-gray-600 rounded-lg p-3 text-center transition-all group-hover:border-cyan-400/50">
            <span className="block text-xs font-medium text-gray-300 group-hover:text-white">
              {isImageLoaded ? 'Upload New Image' : 'Upload Screenshot'}
            </span>
          </div>
        </label>

        <button
          onClick={onDownloadImage}
          disabled={!isImageLoaded}
          className={`w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all transform active:scale-95
            ${!isImageLoaded
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-black shadow-lg'
            }`}
        >
          Download Image
        </button>

        <button
          onClick={handleDownload}
          disabled={!isImageLoaded || isProcessing}
          className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all transform active:scale-95
            ${!isImageLoaded
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg'
            }`}
        >
          {isProcessing ? 'Generating...' : 'Download LUT'}
        </button>
      </div>
    </div>
  );
});
