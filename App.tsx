import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LutSettings, DEFAULT_SETTINGS, HistoryEntry } from './types';
import { Controls } from './components/Controls';
import { PreviewArea } from './components/PreviewArea';


const MAX_HISTORY = 100;
// Debounce window in ms: same action within this window gets merged into one history entry.
// Different action types always create a new entry immediately.
const DEBOUNCE_MS = 600;

const App: React.FC = () => {
  const [settings, setSettings] = useState<LutSettings>(DEFAULT_SETTINGS);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewOverride, setPreviewOverride] = useState<Partial<LutSettings> | null>(null);

  // Effective settings fed to the preview — may have group bypasses applied on top
  const effectiveSettings: LutSettings = previewOverride
    ? { ...settings, ...previewOverride }
    : settings;

  // Ref mirrors settings so callbacks don't capture stale closures
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // History kept in both a ref (for sync reads) and state (to drive the UI)
  const historyRef = useRef<HistoryEntry[]>([]);
  const [history, setHistoryState] = useState<HistoryEntry[]>([]);

  // Ref to the image download function (exposed by PreviewArea)
  const downloadImageRef = useRef<() => void>(() => {});

  const lastPushTime = useRef<number>(0);
  const lastPushLabel = useRef<string>('');

  const commitHistory = useCallback((next: HistoryEntry[]) => {
    historyRef.current = next;
    setHistoryState(next);
  }, []);

  /**
   * Drop-in replacement for setSettings.
   * Captures a history snapshot when:
   *   - The action label differs from the previous push  (new kind of action → always push)
   *   - OR the same label hasn't been pushed for DEBOUNCE_MS  (resumed drag after pause)
   */
  const setSettingsWithHistory = useCallback(
    (updater: React.SetStateAction<LutSettings>, label: string = 'Adjustment') => {
      const now = Date.now();
      const differentAction = label !== lastPushLabel.current;
      const tooLong = now - lastPushTime.current > DEBOUNCE_MS;

      if (differentAction || tooLong) {
        const snapshot = settingsRef.current;
        const next = [...historyRef.current.slice(-(MAX_HISTORY - 1)), { snapshot, label }];
        commitHistory(next);
        lastPushTime.current = now;
        lastPushLabel.current = label;
      }

      setSettings(updater);
    },
    [commitHistory],
  );

  const handleResetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    commitHistory([]);
    lastPushTime.current = 0;
    lastPushLabel.current = '';
  }, [commitHistory]);

  const handleUndo = useCallback(() => {
    const hist = historyRef.current;
    if (hist.length === 0) return;
    const entry = hist[hist.length - 1];
    commitHistory(hist.slice(0, -1));
    lastPushTime.current = 0;
    lastPushLabel.current = '';
    setSettings(entry.snapshot);
  }, [commitHistory]);

  /** Jump to (and restore) an arbitrary point in history. */
  const handleJumpToHistory = useCallback(
    (index: number) => {
      const hist = historyRef.current;
      if (index < 0 || index >= hist.length) return;
      const entry = hist[index];
      commitHistory(hist.slice(0, index));
      lastPushTime.current = 0;
      lastPushLabel.current = '';
      setSettings(entry.snapshot);
    },
    [commitHistory],
  );

  // Ctrl+Z / Cmd+Z + E (export) global listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          downloadImageRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  return (
    <div
      className="flex flex-col md:flex-row h-screen w-screen bg-black text-white overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 relative order-1 min-h-0 min-w-0">
        <PreviewArea
          imageSrc={imageSrc}
          settings={effectiveSettings}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          history={history}
          onJumpToHistory={handleJumpToHistory}
          onExportImage={(fn) => { downloadImageRef.current = fn; }}
          onResetAll={handleResetAll}
        />
      </div>

      {/* Collapse toggle — sits on the left edge of the controls panel */}
      <button
        onClick={() => setControlsCollapsed(c => !c)}
        title={controlsCollapsed ? 'Expand controls' : 'Collapse controls'}
        className="hidden md:flex order-2 self-center flex-shrink-0 z-30 items-center justify-center w-6 h-16 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-l-xl text-gray-500 hover:text-gray-200 transition-all cursor-pointer"
        style={{ marginRight: -1 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {controlsCollapsed
            ? <polyline points="15 18 9 12 15 6" />
            : <polyline points="9 18 15 12 9 6" />
          }
        </svg>
      </button>

      <div
        className={`order-3 w-full md:h-full md:w-[28rem] flex-shrink-0 z-20 border-t md:border-t-0 md:border-l border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden
          ${controlsCollapsed ? 'md:w-0 md:border-l-0 h-0' : 'h-[45vh] md:h-full'}`}
      >
        <Controls
          settings={settings}
          setSettings={setSettingsWithHistory}
          setPreviewOverride={setPreviewOverride}
          onUpload={handleUpload}
          isImageLoaded={!!imageSrc}
          onDownloadImage={() => downloadImageRef.current()}
        />
      </div>
    </div>
  );
};

export default App;
