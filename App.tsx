import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Square, Grid, ZoomIn, ZoomOut, Monitor, Maximize, X, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import useStickyState from './hooks/useStickyState';
import IDCard from './components/IDCard';
import Sidebar from './components/Sidebar';
import { AppSettings, Participant, LayoutConfig } from './types';

const DEFAULT_CARD_WIDTH = 85.6;
const DEFAULT_CARD_HEIGHT = 54;
const PIXELS_PER_MM = 3.7795275591; // Standard 96 DPI

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilteredIndex, setSelectedFilteredIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [participants, setParticipants] = useState<Participant[]>([
      { name: 'Aliyar Arafath', id: 'UT010701', date: null },
      { name: 'Sarah Jenkins', id: 'UT010702', date: null },
      { name: 'Mohamed Riaz', id: 'UT010703', date: null },
      { name: 'Kavindi Perera', id: 'UT010704', date: null },
      { name: 'John Doe', id: 'UT010705', date: null },
      { name: 'Jane Smith', id: 'UT010706', date: null },
      { name: 'Michael Brown', id: 'UT010707', date: null },
      { name: 'Emily Davis', id: 'UT010708', date: null },
      { name: 'Robert Wilson', id: 'UT010709', date: null },
      { name: 'Linda Taylor', id: 'UT010710', date: null }
  ]);

  const [settings, setSettings] = useStickyState<AppSettings>({
    pageSize: 'A4',
    cardWidthMM: DEFAULT_CARD_WIDTH,
    cardHeightMM: DEFAULT_CARD_HEIGHT,
    manualGrid: { enabled: false, cols: 2, rows: 5 },
    cutMarkType: 'none',
    logoSize: 50,
    logoPos: { x: 0, y: 0 },
    logoAlign: { horizontal: 'left', vertical: 'top' },
    fontSizes: { name: 16, id: 24, date: 14 },
    fontFamilies: { name: 'Roboto Slab', id: 'Roboto Slab' },
    namePos: { x: 0, y: 0 },
    nameAlign: { horizontal: 'center', vertical: 'middle' },
    idPos: { x: 0, y: 0 },
    idAlign: { horizontal: 'right', vertical: 'top' },
    globalDate: '02/03/2025',
    startId: '010701'
  }, 'unicom_settings_v1_6');

  const paperSizes: Record<string, { width: number; height: number; name: string }> = {
      'A4': { width: 210, height: 297, name: 'A4' },
      'A3': { width: 297, height: 420, name: 'A3' },
      'A2': { width: 420, height: 594, name: 'A2' },
      'CR80': { width: 85.6, height: 54, name: 'Single CR80' } 
  };

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.id && p.id.toLowerCase().includes(q))
    );
  }, [participants, searchQuery]);

  useEffect(() => {
    if (selectedFilteredIndex >= filteredParticipants.length && filteredParticipants.length > 0) {
      setSelectedFilteredIndex(0);
    }
  }, [filteredParticipants.length, selectedFilteredIndex]);

  const layoutConfig: LayoutConfig = useMemo(() => {
      const paper = paperSizes[settings.pageSize];
      if (settings.pageSize === 'CR80') {
          return { ...paper, cols: 1, rows: 1, maxCols: 1, maxRows: 1, cardsPerPage: 1, margin: 0, gap: 0 };
      }
      const margin = 5; 
      const gap = 4;
      const availW = paper.width - (2 * margin);
      const availH = paper.height - (2 * margin);
      const maxCols = Math.floor((availW + gap) / (settings.cardWidthMM + gap));
      const maxRows = Math.floor((availH + gap) / (settings.cardHeightMM + gap));
      const safeMaxCols = Math.max(1, maxCols);
      const safeMaxRows = Math.max(1, maxRows);

      if (settings.manualGrid.enabled) {
          const effectiveCols = Math.min(settings.manualGrid.cols, safeMaxCols);
          const effectiveRows = Math.min(settings.manualGrid.rows, safeMaxRows);
          return { ...paper, cols: effectiveCols, rows: effectiveRows, maxCols: safeMaxCols, maxRows: safeMaxRows, cardsPerPage: effectiveCols * effectiveRows, margin, gap };
      }
      return { ...paper, cols: safeMaxCols, rows: safeMaxRows, maxCols: safeMaxCols, maxRows: safeMaxRows, cardsPerPage: safeMaxCols * safeMaxRows, margin, gap };
  }, [settings.pageSize, settings.cardWidthMM, settings.cardHeightMM, settings.manualGrid]);

  const totalPages = Math.ceil(filteredParticipants.length / layoutConfig.cardsPerPage);
  const handlePrint = () => window.print();

  const handleUpdateParticipant = (index: number, updated: Participant) => {
    setParticipants(prev => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
    setEditingIndex(null);
  };

  const PAGE_GAP_PX = 32;

  const contentDimensions = useMemo(() => {
    if (viewMode === 'single') {
      return { width: settings.cardWidthMM * PIXELS_PER_MM, height: settings.cardHeightMM * PIXELS_PER_MM, pageHeight: settings.cardHeightMM * PIXELS_PER_MM };
    } else {
      const pageW = layoutConfig.width * PIXELS_PER_MM;
      const pageH = layoutConfig.height * PIXELS_PER_MM;
      const totalH = (pageH * totalPages) + (Math.max(0, totalPages - 1) * PAGE_GAP_PX);
      return { width: pageW, height: totalH, pageHeight: pageH };
    }
  }, [viewMode, settings.cardWidthMM, settings.cardHeightMM, layoutConfig, totalPages]);

  const handleFitPage = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 80;
    const containerH = containerRef.current.clientHeight - 80;
    const scaleW = containerW / contentDimensions.width;
    const scaleH = containerH / contentDimensions.pageHeight;
    const optimalScale = Math.min(scaleW, scaleH);
    setZoomLevel(Math.max(0.1, optimalScale * 0.95));
  };

  const handleFitAll = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 80;
    const containerH = containerRef.current.clientHeight - 80;
    const scaleW = containerW / contentDimensions.width;
    const scaleH = containerH / contentDimensions.height;
    const optimalScale = Math.min(scaleW, scaleH);
    setZoomLevel(Math.max(0.1, optimalScale * 0.95));
  };

  useEffect(() => {
    const timer = setTimeout(handleFitPage, 10);
    return () => clearTimeout(timer);
  }, [viewMode, settings.pageSize, filteredParticipants.length]);

  const goToNext = () => setSelectedFilteredIndex(prev => (prev + 1) % filteredParticipants.length);
  const goToPrev = () => setSelectedFilteredIndex(prev => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        settings={settings} 
        setSettings={setSettings}
        customLogo={customLogo}
        setCustomLogo={setCustomLogo}
        setParticipants={(data) => setParticipants(data)}
        participants={participants}
        filteredParticipants={filteredParticipants}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedParticipant={filteredParticipants[selectedFilteredIndex]}
        onSelectParticipant={(p) => {
            const idx = filteredParticipants.indexOf(p);
            if (idx !== -1) {
                setSelectedFilteredIndex(idx);
                setViewMode('single');
            }
        }}
        totalCards={participants.length}
        totalPages={totalPages}
        layoutConfig={layoutConfig}
        handlePrint={handlePrint}
        viewMode={viewMode}
        onEditParticipant={setEditingIndex}
      />

      <div className="flex-grow bg-gray-500 flex flex-col h-screen overflow-hidden relative">
        <div className="h-14 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10 no-print flex-shrink-0">
            <div className="flex items-center gap-4">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                    {viewMode === 'single' ? 'Card Preview' : 'Sheet Preview'}
                </h2>
                {viewMode === 'single' && filteredParticipants.length > 0 && (
                    <div className="flex items-center gap-2 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 shadow-sm">
                        <button onClick={goToPrev} className="p-1 hover:bg-white rounded text-teal-700 transition-colors" title="Previous Card"><ChevronLeft size={16}/></button>
                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-tighter w-20 text-center">
                            {selectedFilteredIndex + 1} of {filteredParticipants.length}
                        </span>
                        <button onClick={goToNext} className="p-1 hover:bg-white rounded text-teal-700 transition-colors" title="Next Card"><ChevronRight size={16}/></button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom Out"><ZoomOut size={16} /></button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button type="button" onClick={() => setZoomLevel(z => Math.min(3, z + 0.1))} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom In"><ZoomIn size={16} /></button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => setZoomLevel(1)} className="p-1 hover:bg-white rounded text-gray-500" title="100%"><Monitor size={16} /></button>
                    <button type="button" onClick={handleFitPage} className="p-1 hover:bg-white rounded text-gray-500" title="Fit Page"><Maximize size={16} /></button>
                    {viewMode === 'grid' && (
                      <button type="button" onClick={handleFitAll} className="p-1 hover:bg-white rounded text-gray-500" title="Fit All"><Layers size={16} /></button>
                    )}
                </div>
                
                <div className="h-6 w-px bg-gray-300"></div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setViewMode('single')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'single' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Square size={16} /> Single</button>
                    <button type="button" onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Grid size={16} /> Sheet</button>
                </div>
            </div>
        </div>

        {editingIndex !== null && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b flex justify-between items-center bg-teal-50">
                <h3 className="font-bold text-teal-900">Modify Participant Card</h3>
                <button type="button" onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateParticipant(editingIndex, {
                    name: String(formData.get('name')),
                    id: String(formData.get('id')),
                    date: String(formData.get('date')) || null
                  });
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label htmlFor="edit-name" className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                  <input id="edit-name" name="name" type="text" defaultValue={participants[editingIndex].name} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" required />
                </div>
                <div>
                  <label htmlFor="edit-id" className="block text-xs font-bold text-gray-500 uppercase mb-1">ID / UT Number</label>
                  <input id="edit-id" name="id" type="text" defaultValue={participants[editingIndex].id || ''} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-xs font-bold text-gray-500 uppercase mb-1">Specific Date</label>
                  <input id="edit-date" name="date" type="text" placeholder="Default used if empty" defaultValue={participants[editingIndex].date || ''} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
                </div>
                <div className="pt-4 flex gap-2">
                  <button type="button" onClick={() => setEditingIndex(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors shadow-md">Apply Change</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div ref={containerRef} className="flex-grow overflow-auto p-8 print-container relative bg-gray-500 flex items-start justify-center">
            {filteredParticipants.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><X size={32} /></div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">No matches found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search query or mapping.</p>
              </div>
            ) : (
              <div style={{ width: contentDimensions.width * zoomLevel, height: contentDimensions.height * zoomLevel, position: 'relative', flexShrink: 0 }}>
                  <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: contentDimensions.width }}>
                      {viewMode === 'single' ? (
                          <div className="shadow-2xl inline-block">
                              <IDCard 
                                data={filteredParticipants[selectedFilteredIndex]} 
                                settings={settings} 
                                index={participants.indexOf(filteredParticipants[selectedFilteredIndex])} 
                                customLogo={customLogo} 
                                onEdit={(idx) => setEditingIndex(idx)} 
                              />
                          </div>
                      ) : (
                          <div className="space-y-8 inline-block">
                              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                                  <div key={pageIndex} className="preview-paper page-break" style={{ width: `${layoutConfig.width}mm`, height: `${layoutConfig.height}mm`, padding: `${layoutConfig.margin}mm`, display: 'grid', gridTemplateColumns: `repeat(${layoutConfig.cols}, max-content)`, gridAutoRows: 'max-content', gap: `${layoutConfig.gap}mm`, alignContent: 'start', justifyContent: 'center' }}>
                                      {filteredParticipants.slice(pageIndex * layoutConfig.cardsPerPage, (pageIndex + 1) * layoutConfig.cardsPerPage).map((person) => (
                                          <IDCard 
                                            key={participants.indexOf(person)} 
                                            data={person} 
                                            settings={settings} 
                                            index={participants.indexOf(person)} 
                                            customLogo={customLogo} 
                                            onEdit={(idx) => setEditingIndex(idx)} 
                                          />
                                      ))}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;