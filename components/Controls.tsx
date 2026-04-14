
import React, { useState, useEffect, useCallback } from 'react';
import { LutSettings, Point, ZoneSettings, DEFAULT_SETTINGS, Colorspace, ToneMappingSettings, FilmicLook, FILMIC_LOOK_LABELS, FILMIC_LOOK_DESCRIPTIONS } from '../types';
import { Slider } from './Slider';
import { generateLutUrl } from '../services/imageProcessing';
import { CurveEditor } from './CurveEditor';
import { HueCurveEditor } from './HueCurveEditor';
import { ColorWheelControl } from './ColorWheelControl';
import { ToneMappingControl } from './ToneMappingControl';
import { ColorspaceSelector } from './ColorspaceSelector';
import { PRESETS, Preset } from '../presets';

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
type AdvSubTab = 'zones' | 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat' | 'colorWheels' | 'toneMapping' | 'colorspace' | 'lutBlend';
type GroupName = 'light' | 'contrast' | 'color' | 'curves' | 'zones' | 'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat' | 'colorWheels' | 'toneMapping' | 'colorspace' | 'lutBlend';

// ── Group labels ──────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<GroupName, string> = {
  light:       'Light & Exposure',
  contrast:    'Contrast',
  color:       'Color Balance',
  curves:      'Curves',
  zones:       'Zones',
  hueVsHue:   'Hue vs Hue',
  hueVsSat:   'Hue vs Sat',
  hueVsLuma:  'Hue vs Luma',
  lumaVsSat:  'Luma vs Sat',
  colorWheels: 'Color Wheels',
  toneMapping: 'Tone Mapping',
  colorspace:  'Input Colorspace',
  lutBlend:    'Filmic LUT Blend',
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
  zones:       'Zone Controls',
  hueVsHue:    'Hue vs Hue',
  hueVsSat:    'Hue vs Sat',
  hueVsLuma:   'Hue vs Luma',
  lumaVsSat:   'Luma vs Sat',
  colorWheels: 'Color Wheels',
  toneMapping: 'Tone Mapping',
  colorspace:  'Input Colorspace',
  lutBlend:    'Filmic LUT Blend',
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
    // Zones (ranges) bypass: only reset the ranges, not the RGB/L color wheel values
    override.zones = {
      ...settings.zones,
      ranges: DEFAULT_SETTINGS.zones.ranges,
    };
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

  if (bypassedGroups.has('colorWheels')) {
    // Color wheels bypass: reset RGB and L offsets for all zones
    override.zones = {
      ...settings.zones,
      shadows:    { ...settings.zones.shadows,    r: 0, g: 0, b: 0, l: 0 },
      midtones:   { ...settings.zones.midtones,   r: 0, g: 0, b: 0, l: 0 },
      highlights: { ...settings.zones.highlights, r: 0, g: 0, b: 0, l: 0 },
    };
  }
  if (bypassedGroups.has('toneMapping')) {
    override.toneMapping = DEFAULT_SETTINGS.toneMapping;
  }
  if (bypassedGroups.has('colorspace')) {
    override.colorspace = 'sRGB';
  }
  if (bypassedGroups.has('lutBlend')) {
    override.agxBlend = 0;
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
  const [activePresetCategory, setActivePresetCategory] = useState<'lifestyle' | 'cinematic' | 'film' | 'custom'>('lifestyle');

  // Advanced tab: 3 top-level categories (Zones merged into Color & Tone)
  type AdvCategory = 'hueCurves' | 'look' | 'system';
  const [advCategory, setAdvCategory] = useState<AdvCategory>('look');
  const [hueCurveTab, setHueCurveTab] = useState<'hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat'>('hueVsHue');
  const [systemTab, setSystemTab]     = useState<'colorspace' | 'lutBlend'>('colorspace');

  // Derived activeAdvTab — used by R/B shortcuts and bypass logic
  const activeAdvTab: AdvSubTab = advCategory === 'hueCurves' ? hueCurveTab
    : advCategory === 'system'  ? systemTab
    : 'colorWheels';

  // Track which preset is currently active (by id)
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    try {
      const raw = localStorage.getItem('lut_lab_custom_presets');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const [bypassedGroups, setBypassedGroups] = useState<Set<GroupName>>(new Set());

  // Sync bypassed groups → previewOverride
  useEffect(() => {
    const override = computeBypassOverride(bypassedGroups, settings);
    setPreviewOverride(override);
  }, [bypassedGroups, settings, setPreviewOverride]);

  // ── Custom preset helpers ─────────────────────────────────────────────────

  const saveCustomPreset = useCallback(() => {
    const name = newPresetName.trim();
    if (!name) return;
    const preset: Preset = {
      id: `custom_${Date.now()}`,
      name,
      description: 'Custom saved preset',
      category: 'custom',
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      settings: { ...settings },
    };
    const next = [...customPresets, preset];
    setCustomPresets(next);
    localStorage.setItem('lut_lab_custom_presets', JSON.stringify(next));
    setNewPresetName('');
    setShowSaveForm(false);
  }, [newPresetName, settings, customPresets]);

  const deleteCustomPreset = useCallback((id: string) => {
    const next = customPresets.filter(p => p.id !== id);
    setCustomPresets(next);
    localStorage.setItem('lut_lab_custom_presets', JSON.stringify(next));
  }, [customPresets]);

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
      // Reset only the ranges, keep color wheel values
      resetSettings = { zones: { ...settings.zones, ranges: DEFAULT_SETTINGS.zones.ranges } };
    } else if (group === 'hueVsHue') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsHue: [] } };
    } else if (group === 'hueVsSat') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsSat: [] } };
    } else if (group === 'hueVsLuma') {
      resetSettings = { secondaries: { ...settings.secondaries, hueVsLuma: [] } };
    } else if (group === 'lumaVsSat') {
      resetSettings = { secondaries: { ...settings.secondaries, lumaVsSat: [] } };
    } else if (group === 'colorWheels') {
      // Reset RGB and L offsets for all zones
      resetSettings = {
        zones: {
          ...settings.zones,
          shadows:    { ...settings.zones.shadows,    r: 0, g: 0, b: 0, l: 0 },
          midtones:   { ...settings.zones.midtones,   r: 0, g: 0, b: 0, l: 0 },
          highlights: { ...settings.zones.highlights, r: 0, g: 0, b: 0, l: 0 },
        },
      };
    } else if (group === 'toneMapping') {
      resetSettings = { toneMapping: DEFAULT_SETTINGS.toneMapping };
    } else if (group === 'colorspace') {
      resetSettings = { colorspace: 'sRGB' };
    } else if (group === 'lutBlend') {
      resetSettings = { agxBlend: 0 };
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

  // ── R/B keyboard shortcuts (reset / bypass active group) ─────────────────
  // Must be declared AFTER resetGroup and toggleBypass.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'r' || e.key === 'R') {
        if (activeTab === 'curves') {
          setSettings(
            prev => ({ ...prev, curves: { ...prev.curves, [activeCurve]: [{ x: 0, y: 0 }, { x: 1, y: 1 }] } }),
            `Reset: ${CURVE_LABELS[activeCurve]}`,
          );
        } else if (activeTab === 'advanced') {
          resetGroup(activeAdvTab as GroupName);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        if (activeTab === 'curves') {
          toggleBypass('curves');
        } else if (activeTab === 'advanced') {
          toggleBypass(activeAdvTab as GroupName);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, activeAdvTab, activeCurve, setSettings, resetGroup, toggleBypass]);

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
    const hueTabs = ['hueVsHue', 'hueVsSat', 'hueVsLuma', 'lumaVsSat'];
    if (!hueTabs.includes(activeAdvTab)) return;
    setSettings(
      prev => ({ ...prev, secondaries: { ...prev.secondaries, [activeAdvTab]: points } }),
      ADV_LABELS[activeAdvTab],
    );
  };

  const updateZones = (z: ZoneSettings) => {
    setSettings(prev => ({ ...prev, zones: z }), 'Zone Controls');
  };

  const updateToneMapping = (tm: ToneMappingSettings) => {
    setSettings(prev => ({ ...prev, toneMapping: tm }), 'Tone Mapping');
  };

  const updateColorspace = (cs: Colorspace) => {
    setSettings(prev => ({ ...prev, colorspace: cs }), 'Colorspace');
  };

  const updateAgxBlend = (v: number) => {
    setSettings(prev => ({ ...prev, agxBlend: v }), 'Filmic Blend');
  };

  const updateFilmicLook = (look: FilmicLook) => {
    setSettings(prev => ({
      ...prev,
      filmicLook: look,
      agxBlend: look === 'none' ? 0 : (prev.agxBlend > 0 ? prev.agxBlend : 75),
    }), 'Filmic Look');
  };

  const resetCurve = () => {
    if (activeTab === 'curves') {
      updateCurve([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    } else if (activeTab === 'advanced' && ['hueVsHue','hueVsSat','hueVsLuma','lumaVsSat'].includes(activeAdvTab)) {
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
    <div className="w-full md:w-[28rem] bg-gray-850 border-l border-gray-800 flex flex-col h-full shadow-2xl z-10 relative">

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

            {/* Category sub-tabs */}
            <div className="flex gap-1.5 mb-4">
              {(['lifestyle', 'cinematic', 'film', 'custom'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActivePresetCategory(cat)}
                  className={`flex-1 px-2.5 py-1 text-[10px] font-semibold rounded border transition-colors ${
                    activePresetCategory === cat
                      ? 'bg-cyan-500 border-cyan-500 text-black'
                      : 'border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Presets grid filtered by category */}
            <div className="grid grid-cols-2 gap-3">
              {[...PRESETS, ...customPresets].filter(p => p.category === activePresetCategory).map(preset => (
                <div key={preset.id} className="relative group">
                  <button
                    onClick={() => {
                      setSettings(
                        { ...DEFAULT_SETTINGS, ...preset.settings },
                        `Preset: ${preset.name}`,
                      );
                      setActivePresetId(preset.id);
                    }}
                    className={`w-full bg-gray-900/60 border rounded-xl p-3 text-left transition-all group active:scale-95 ${
                      activePresetId === preset.id
                        ? 'border-cyan-500/60'
                        : 'border-gray-800 hover:border-cyan-500/60'
                    }`}
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
                  {preset.category === 'custom' && (
                    <button
                      onClick={() => deleteCustomPreset(preset.id)}
                      title="Delete preset"
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gray-800 text-gray-500 hover:bg-red-500/80 hover:text-white transition-colors flex items-center justify-center text-[10px] font-bold leading-none opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Custom tab: Save current settings as preset */}
            {activePresetCategory === 'custom' && (
              <div className="mt-4">
                {showSaveForm ? (
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-3 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Preset name…"
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCustomPreset(); if (e.key === 'Escape') setShowSaveForm(false); }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveCustomPreset}
                        disabled={!newPresetName.trim()}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setShowSaveForm(false); setNewPresetName(''); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveForm(true)}
                    className="w-full py-2 rounded-xl text-xs font-semibold border border-dashed border-gray-700 text-gray-500 hover:border-cyan-500/60 hover:text-cyan-400 transition-colors"
                  >
                    + Save Current Settings as Preset
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BASIC TAB ── */}
        {activeTab === 'basic' && (
          <>
            {/* Light & Exposure */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('light')}
              <div className={bypassedGroups.has('light') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="exposure"   label="Exposure"      value={settings.exposure}   defaultValue={0}   min={-3}   max={3}   step={0.05} onChange={v => updateSetting('exposure',   v)} tooltip="Exposure in stops. +1 = twice as bright, -1 = half as bright." />
                <Slider id="brightness" label="Brightness"    value={settings.brightness} defaultValue={0}   min={-0.5} max={0.5} step={0.01} onChange={v => updateSetting('brightness', v)} tooltip="Simple linear lift applied after exposure. Use for subtle brightness nudges." />
                <Slider id="offset"     label="Offset (Lift)" value={settings.offset}     defaultValue={0}   min={-0.5} max={0.5} step={0.01} onChange={v => updateSetting('offset',     v)} tooltip="Raises or lowers the black point (shadow floor). Also called 'lift'." />
              </div>
            </div>

            {/* Contrast */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('contrast')}
              <div className={bypassedGroups.has('contrast') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="contrast" label="Contrast"     value={settings.contrast} defaultValue={1}   min={0} max={2.0} step={0.05} onChange={v => updateSetting('contrast', v)} tooltip="S-curve contrast multiplier around the pivot. 1.0 = unchanged." />
                <Slider id="pivot"    label="Pivot Center" value={settings.pivot}    defaultValue={0.5} min={0} max={1.0} step={0.05} onChange={v => updateSetting('pivot',    v)} tooltip="Luminance value that contrast pivots around. 0.5 = mid-grey." />
              </div>
            </div>

            {/* Color Balance */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 space-y-1">
              {groupHeader('color')}
              <div className={bypassedGroups.has('color') ? 'opacity-40 pointer-events-none select-none' : ''}>
                <Slider id="temp" label="Temp"                  value={settings.temperature} defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('temperature', v)} tooltip="White balance shift. Negative = cooler (blue), positive = warmer (orange)." />
                <Slider id="tint" label="Tint"                  value={settings.tint}        defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('tint',        v)} tooltip="Green/Magenta axis. Negative = more green, positive = more magenta." />
                <div className="h-px bg-gray-800 my-3" />
                <Slider id="sat" label="Saturation"             value={settings.saturation}  defaultValue={1} min={0} max={2.0} step={0.05} onChange={v => updateSetting('saturation', v)} tooltip="Global saturation multiplier. 0 = greyscale, 1 = unchanged, 2 = double." />
                <Slider id="vib" label="Vibrance (Skin Prot.)"  value={settings.vibrance}    defaultValue={0} min={-1.0} max={1.0} step={0.05} onChange={v => updateSetting('vibrance',  v)} tooltip="Smart saturation that protects already-saturated skin tones from over-saturating." />
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
          <div className="h-full flex flex-col gap-3">

            {/* ── Category row ── */}
            <div className="grid grid-cols-3 gap-1.5">
              {([
                ['hueCurves', 'Hue Curves'],
                ['look',      'Color & Tone'],
                ['system',    'Technical'],
              ] as [AdvCategory, string][]).map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => setAdvCategory(cat)}
                  className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-colors leading-tight text-center ${
                    advCategory === cat
                      ? 'bg-cyan-500 border-cyan-500 text-black'
                      : 'border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── Hue Curves sub-row ── */}
            {advCategory === 'hueCurves' && (
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['hueVsHue',   'Hue vs Hue'],
                  ['hueVsSat',   'Hue vs Saturation'],
                  ['hueVsLuma',  'Hue vs Luma'],
                  ['lumaVsSat',  'Luma vs Saturation'],
                ] as ['hueVsHue' | 'hueVsSat' | 'hueVsLuma' | 'lumaVsSat', string][]).map(([sub, label]) => (
                  <button
                    key={sub}
                    onClick={() => setHueCurveTab(sub)}
                    className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                      hueCurveTab === sub
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Technical sub-row ── */}
            {advCategory === 'system' && (
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['colorspace', 'Input Colorspace'],
                  ['lutBlend',   'Filmic LUT Blend'],
                ] as ['colorspace' | 'lutBlend', string][]).map(([sub, label]) => (
                  <button
                    key={sub}
                    onClick={() => setSystemTab(sub)}
                    className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                      systemTab === sub
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Content ── */}
            <div className="flex-1 min-h-0">

              {/* Hue Curves */}
              {advCategory === 'hueCurves' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col">
                  {groupHeader(hueCurveTab as GroupName)}
                  <div className={bypassedGroups.has(hueCurveTab) ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <HueCurveEditor
                      mode={hueCurveTab}
                      points={settings.secondaries[hueCurveTab]}
                      onChange={updateSecondary}
                    />
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      Click to add · Drag to adjust · Double-click to remove
                    </div>
                  </div>
                </div>
              )}

              {/* Color & Tone — zone ranges + wheels + tone mapping in one panel */}
              {advCategory === 'look' && (
                <div className="space-y-4">
                  {/* Zone Ranges */}
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    {groupHeader('zones')}
                    <div className={bypassedGroups.has('zones') ? 'opacity-40 pointer-events-none select-none' : ''}>
                      <Slider
                        id="shadow-end"
                        label="Shadow Limit"
                        value={settings.zones.ranges.shadowEnd}
                        defaultValue={0.33}
                        min={0}
                        max={0.5}
                        step={0.01}
                        onChange={v => updateZones({ ...settings.zones, ranges: { ...settings.zones.ranges, shadowEnd: v } })}
                        tooltip="Upper boundary of the shadow zone. Pixels below this are treated as shadows."
                      />
                      <Slider
                        id="highlight-start"
                        label="Highlight Start"
                        value={settings.zones.ranges.highlightStart}
                        defaultValue={0.66}
                        min={0.5}
                        max={1}
                        step={0.01}
                        onChange={v => updateZones({ ...settings.zones, ranges: { ...settings.zones.ranges, highlightStart: v } })}
                        tooltip="Lower boundary of the highlight zone. Pixels above this are treated as highlights."
                      />
                      <Slider
                        id="zone-falloff"
                        label="Falloff"
                        value={settings.zones.ranges.falloff}
                        defaultValue={0.1}
                        min={0}
                        max={0.3}
                        step={0.01}
                        onChange={v => updateZones({ ...settings.zones, ranges: { ...settings.zones.ranges, falloff: v } })}
                        tooltip="Blend width between zones. Higher = softer transition between shadows, midtones, and highlights."
                      />
                    </div>
                  </div>

                  {/* Color Wheels */}
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    {groupHeader('colorWheels')}
                    <div className={bypassedGroups.has('colorWheels') ? 'opacity-40 pointer-events-none select-none' : ''}>
                      <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                        Drag to tint. Double-click to reset. L slider = luminance offset.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <ColorWheelControl
                          label="Shadows"
                          zone={settings.zones.shadows}
                          onChange={z => updateZones({ ...settings.zones, shadows: z })}
                        />
                        <ColorWheelControl
                          label="Midtones"
                          zone={settings.zones.midtones}
                          onChange={z => updateZones({ ...settings.zones, midtones: z })}
                        />
                        <ColorWheelControl
                          label="Highlights"
                          zone={settings.zones.highlights}
                          onChange={z => updateZones({ ...settings.zones, highlights: z })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tone Mapping */}
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    {groupHeader('toneMapping')}
                    <div className={bypassedGroups.has('toneMapping') ? 'opacity-40 pointer-events-none select-none' : ''}>
                      <ToneMappingControl
                        settings={settings.toneMapping}
                        onChange={updateToneMapping}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Technical */}
              {advCategory === 'system' && systemTab === 'colorspace' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  {groupHeader('colorspace')}
                  <div className={bypassedGroups.has('colorspace') ? 'opacity-40 pointer-events-none select-none' : ''}>
                    <ColorspaceSelector
                      value={settings.colorspace}
                      onChange={updateColorspace}
                    />
                  </div>
                </div>
              )}

              {advCategory === 'system' && systemTab === 'lutBlend' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  {groupHeader('lutBlend')}
                  <div className={bypassedGroups.has('lutBlend') ? 'opacity-40 pointer-events-none select-none' : ''}>
                    {/* Look selector buttons */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {((['none', 'agx', 'aces', 'reinhard', 'hable'] as FilmicLook[]).map(look => (
                        <button
                          key={look}
                          onClick={() => updateFilmicLook(look)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            settings.filmicLook === look
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'
                          }`}
                        >
                          {FILMIC_LOOK_LABELS[look]}
                        </button>
                      )))}
                    </div>
                    {/* Description */}
                    <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                      {FILMIC_LOOK_DESCRIPTIONS[settings.filmicLook]}
                    </p>
                    {/* Strength slider — hidden when None */}
                    {settings.filmicLook !== 'none' && (
                      <Slider
                        id="filmic-blend-strength"
                        label="Strength"
                        value={settings.agxBlend}
                        defaultValue={75}
                        min={0}
                        max={100}
                        step={1}
                        onChange={updateAgxBlend}
                        tooltip="0% = your color grade only. 100% = fully filmic look applied."
                      />
                    )}
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
