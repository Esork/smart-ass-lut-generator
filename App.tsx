import React, { useState, useCallback } from 'react';
import { LutSettings, DEFAULT_SETTINGS } from './types';
import { Controls } from './components/Controls';
import { PreviewArea } from './components/PreviewArea';

const App: React.FC = () => {
  const [settings, setSettings] = useState<LutSettings>(DEFAULT_SETTINGS);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle Drag and Drop on the main area
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="flex flex-col md:flex-row h-screen w-screen bg-black text-white overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Preview Area: Takes available space, but respects flex layout */}
      {/* Mobile: Order 1 (Top), Desktop: Order 1 (Left) */}
      <div className="flex-1 relative order-1 min-h-0 min-w-0">
        <PreviewArea imageSrc={imageSrc} settings={settings} />
      </div>

      {/* Controls: Fixed width on desktop, Fixed height percentage on mobile */}
      {/* Mobile: Order 2 (Bottom), Desktop: Order 2 (Right) */}
      {/* flex-shrink-0 ensures it doesn't get crushed by the preview area */}
      <div className="order-2 w-full h-[45vh] md:h-full md:w-96 flex-shrink-0 z-20 border-t md:border-t-0 md:border-l border-gray-800 shadow-2xl">
        <Controls 
          settings={settings} 
          setSettings={setSettings} 
          onUpload={handleUpload}
          isImageLoaded={!!imageSrc}
        />
      </div>
    </div>
  );
};

export default App;