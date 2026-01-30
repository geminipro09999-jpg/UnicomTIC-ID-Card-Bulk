import React, { useState, useMemo } from 'react';
import { Square, Grid } from 'lucide-react';
import useStickyState from './hooks/useStickyState';
import IDCard from './components/IDCard';
import Sidebar from './components/Sidebar';
import { AppSettings, Participant, LayoutConfig } from './types';

const DEFAULT_CARD_WIDTH = 85.6;
const DEFAULT_CARD_HEIGHT = 54;

const App: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  // Default Participants
  const [participants, setParticipants] = useState<Participant[]>([
      { name: 'Aliyar Arafath', id: 'UT010701', date: null },
      { name: 'Sarah Jenkins', id: 'UT010702', date: null },
      { name: 'Mohamed Riaz', id: 'UT010703', date: null },
      { name: 'Kavindi Perera', id: 'UT010704', date: null },
      { name: 'John Doe', id: 'UT010705', date: null },
      { name: 'Jane Smith', id: 'UT010706', date: null },
      { name: 'Michael Brown', id: 'UT010707', date: null },
      { name: 'Emily Davis', id: 'UT010708', date: null }
  ]);

  // Persisted Settings
  const [settings, setSettings] = useStickyState<AppSettings>({
    pageSize: 'A4',
    cardWidthMM: DEFAULT_CARD_WIDTH,
    cardHeightMM: DEFAULT_CARD_HEIGHT,
    manualGrid: { enabled: false, cols: 2, rows: 5 },
    showCutMarks: false,
    logoSize: 50,
    fontSizes: { name: 16, id: 24, date: 14 },
    nameOffset: 0,
    globalDate: '02/03/2025',
    startId: '010701'
  }, 'unicom_settings_v1');

  // Paper Sizes
  const paperSizes: Record<string, { width: number; height: number; name: string }> = {
      'A4': { width: 210, height: 297, name: 'A4' },
      'A3': { width: 297, height: 420, name: 'A3' },
      'A2': { width: 420, height: 594, name: 'A2' },
      'CR80': { width: 85.6, height: 54, name: 'Single CR80' } 
  };

  // Layout Calculation
  const layoutConfig: LayoutConfig = useMemo(() => {
      const paper = paperSizes[settings.pageSize];
      
      // CR80 Single Card Mode
      if (settings.pageSize === 'CR80') {
          return {
              ...paper,
              cols: 1,
              rows: 1,
              cardsPerPage: 1,
              margin: 0,
              gap: 0
          };
      }

      // If Manual Grid is enabled
      if (settings.manualGrid.enabled) {
          return {
              ...paper,
              cols: settings.manualGrid.cols,
              rows: settings.manualGrid.rows,
              cardsPerPage: settings.manualGrid.cols * settings.manualGrid.rows,
              margin: 8, 
              gap: 4
          };
      }

      // Auto Layout
      const margin = 8; // 8mm print margin
      const gap = 4;    // 4mm gap between cards
      const availW = paper.width - (2 * margin);
      const availH = paper.height - (2 * margin);
      const cols = Math.floor((availW + gap) / (settings.cardWidthMM + gap));
      const rows = Math.floor((availH + gap) / (settings.cardHeightMM + gap));
      const safeCols = Math.max(1, cols);
      const safeRows = Math.max(1, rows);

      return {
          ...paper,
          cols: safeCols,
          rows: safeRows,
          cardsPerPage: safeCols * safeRows,
          margin,
          gap
      };
  }, [settings.pageSize, settings.cardWidthMM, settings.cardHeightMM, settings.manualGrid]);

  const totalPages = Math.ceil(participants.length / layoutConfig.cardsPerPage);
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      <Sidebar 
        settings={settings} 
        setSettings={setSettings}
        customLogo={customLogo}
        setCustomLogo={setCustomLogo}
        setParticipants={(data) => setParticipants(data)}
        totalCards={participants.length}
        totalPages={totalPages}
        layoutConfig={layoutConfig}
        handlePrint={handlePrint}
        viewMode={viewMode}
      />

      {/* --- Preview Area --- */}
      <div className="flex-grow bg-gray-500 flex flex-col h-screen overflow-hidden">
        
         {/* Preview Toolbar */}
        <div className="h-14 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10 no-print flex-shrink-0">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
                {viewMode === 'single' ? 'Design Preview' : 'Print Preview'}
            </h2>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('single')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                        viewMode === 'single' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Square size={16} /> Single
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                        viewMode === 'grid' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Grid size={16} /> Grid / Sheet
                </button>
            </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-grow overflow-auto p-8 print-container relative bg-gray-500">
            
            {viewMode === 'single' ? (
                <div className="flex flex-col items-center justify-center min-h-full">
                    <div 
                        style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s'
                        }}
                        className="shadow-2xl"
                    >
                        <IDCard 
                            data={participants[0]} 
                            settings={settings} 
                            index={0}
                            customLogo={customLogo}
                        />
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="mt-8 flex gap-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg no-print">
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 font-bold text-gray-600">-</button>
                        <span className="flex items-center text-sm font-medium text-gray-600">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 font-bold text-gray-600">+</button>
                    </div>
                    <p className="mt-4 text-white/50 text-sm no-print">Showing first record for design reference</p>
                </div>
            ) : (
                <div className="flex justify-center min-w-min">
                    <div className="space-y-8">
                        {Array.from({ length: totalPages }).map((_, pageIndex) => (
                            <div 
                                key={pageIndex}
                                className="preview-paper page-break"
                                style={{ 
                                    width: `${layoutConfig.width}mm`, 
                                    height: `${layoutConfig.height}mm`,
                                    padding: `${layoutConfig.margin}mm`, 
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${layoutConfig.cols}, max-content)`,
                                    gridTemplateRows: `repeat(${layoutConfig.rows}, max-content)`,
                                    gap: `${layoutConfig.gap}mm`,
                                    alignContent: 'start',
                                    justifyContent: 'center'
                                }}
                            >
                                {participants
                                    .slice(pageIndex * layoutConfig.cardsPerPage, (pageIndex + 1) * layoutConfig.cardsPerPage)
                                    .map((person, i) => (
                                        <IDCard 
                                            key={i} 
                                            data={person} 
                                            settings={settings} 
                                            index={(pageIndex * layoutConfig.cardsPerPage) + i}
                                            customLogo={customLogo}
                                        />
                                    ))
                                }
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
