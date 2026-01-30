import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { 
  Layout, Upload, Settings, Type, Printer, 
  ChevronDown, ChevronRight, Scissors, RefreshCw, 
  Grid
} from 'lucide-react';
import { AppSettings, ColumnMapping, LayoutConfig } from '../types';

interface SidebarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customLogo: string | null;
  setCustomLogo: (logo: string | null) => void;
  setParticipants: (data: any[]) => void;
  totalCards: number;
  totalPages: number;
  layoutConfig: LayoutConfig;
  handlePrint: () => void;
  viewMode: string;
}

const CONVERSION = {
  mm: 1,
  cm: 10,
  px: 0.264583
};

const Sidebar: React.FC<SidebarProps> = ({
  settings, setSettings, customLogo, setCustomLogo, 
  setParticipants, totalCards, totalPages, layoutConfig, handlePrint, viewMode
}) => {
  const [openSections, setOpenSections] = useState({ layout: true, data: true, typo: false, design: false });
  const [dimUnit, setDimUnit] = useState<'mm' | 'cm' | 'px'>('mm');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ name: '', id: '', date: '' });
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);

  const toggleSection = (key: keyof typeof openSections) => 
    setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const toDisplayUnit = (valMM: number) => parseFloat((valMM / CONVERSION[dimUnit]).toFixed(2));
  const fromDisplayUnit = (val: string) => parseFloat(val) * CONVERSION[dimUnit];

  const resetDimensions = () => {
    setSettings(prev => ({
      ...prev,
      cardWidthMM: 85.6,
      cardHeightMM: 54
    }));
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCustomLogo(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr === 'string') {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setExcelHeaders(headers);
          setRawExcelData(data);
          
          const newMapping = { name: '', id: '', date: '' };
          headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('name')) newMapping.name = h;
            else if (lower.includes('ut') || lower.includes('id')) newMapping.id = h;
            else if (lower.includes('date')) newMapping.date = h;
          });
          if (!newMapping.name && headers.length > 0) newMapping.name = headers[0];
          setColumnMapping(newMapping);
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // Re-process data when mapping changes
  React.useEffect(() => {
    if (rawExcelData.length === 0) return;
    const processed = rawExcelData.map(row => ({
      name: columnMapping.name ? row[columnMapping.name] : 'Unknown',
      id: columnMapping.id ? row[columnMapping.id] : null,
      date: columnMapping.date ? row[columnMapping.date] : null
    }));
    setParticipants(processed);
  }, [columnMapping, rawExcelData, setParticipants]);

  const SectionHeader = ({ title, icon: Icon, isOpen, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-2 transition-colors border border-gray-200"
    >
        <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Icon size={18} className="text-teal-600"/>
            {title}
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  );

  return (
    <div className="w-full md:w-96 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 no-print overflow-y-auto h-screen sticky top-0 shadow-xl z-20">
      <div className="flex items-center gap-3 border-b pb-4 mb-2">
        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          U
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-800">Unicom TIC</h1>
          <p className="text-xs text-gray-500">Bulk ID Generator</p>
        </div>
      </div>

      {/* 1. Layout Section */}
      <div>
        <SectionHeader title="Page Layout" icon={Layout} isOpen={openSections.layout} onClick={() => toggleSection('layout')} />
        {openSections.layout && (
          <div className="p-2 space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {['A4', 'A3', 'A2', 'CR80'].map(size => (
                <button
                  key={size}
                  onClick={() => setSettings(p => ({ ...p, pageSize: size }))}
                  className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                    settings.pageSize === size 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {size === 'CR80' ? 'Single' : size}
                </button>
              ))}
            </div>

            {/* Manual Grid Toggle */}
            {settings.pageSize !== 'CR80' && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Grid Layout</span>
                  <div className="flex gap-2 text-xs">
                    <button 
                      onClick={() => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, enabled: false } }))}
                      className={`px-2 py-1 rounded ${!settings.manualGrid.enabled ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      Auto
                    </button>
                    <button 
                      onClick={() => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, enabled: true } }))}
                      className={`px-2 py-1 rounded ${settings.manualGrid.enabled ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {settings.manualGrid.enabled ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">Columns</label>
                      <input 
                        type="number" 
                        min="1" max="10"
                        value={settings.manualGrid.cols}
                        onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, cols: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        className="w-full mt-1 p-1.5 border rounded text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">Rows</label>
                      <input 
                        type="number" 
                        min="1" max="15"
                        value={settings.manualGrid.rows}
                        onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, rows: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        className="w-full mt-1 p-1.5 border rounded text-sm text-center"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic text-center">
                    System aligns maximum cards automatically.
                  </div>
                )}

                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total: <b>{layoutConfig.cardsPerPage}</b> / page</span>
                </div>
              </div>
            )}

            {/* Cutting Guides Selection */}
            <div className="pt-2">
                <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1">
                    <Scissors size={12} /> Cutting Lines / Marks
                </label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setSettings(p => ({ ...p, cutMarkType: 'none' }))}
                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                            settings.cutMarkType === 'none' 
                            ? 'bg-white shadow text-teal-700' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        None
                    </button>
                    <button
                        onClick={() => setSettings(p => ({ ...p, cutMarkType: 'border' }))}
                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                            settings.cutMarkType === 'border' 
                            ? 'bg-white shadow text-teal-700' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Borders
                    </button>
                    <button
                        onClick={() => setSettings(p => ({ ...p, cutMarkType: 'crop' }))}
                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
                            settings.cutMarkType === 'crop' 
                            ? 'bg-white shadow text-teal-700' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Crop Marks
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Data & Mapping Section */}
      <div>
        <SectionHeader title="Data & Mapping" icon={Upload} isOpen={openSections.data} onClick={() => toggleSection('data')} />
        {openSections.data && (
          <div className="p-2 space-y-4 mb-4">
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>

            {/* Column Mapping UI */}
            {excelHeaders.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Map Excel Columns</h4>
                
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Name Column</label>
                  <select 
                    className="w-full p-1.5 text-sm border rounded bg-white"
                    value={columnMapping.name}
                    onChange={e => setColumnMapping(p => ({...p, name: e.target.value}))}
                  >
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1">ID / UT Number Column</label>
                  <select 
                    className="w-full p-1.5 text-sm border rounded bg-white"
                    value={columnMapping.id}
                    onChange={e => setColumnMapping(p => ({...p, id: e.target.value}))}
                  >
                    <option value="">(Auto-Generate UT ID)</option>
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1">Date Column</label>
                  <select 
                    className="w-full p-1.5 text-sm border rounded bg-white"
                    value={columnMapping.date}
                    onChange={e => setColumnMapping(p => ({...p, date: e.target.value}))}
                  >
                    <option value="">(Use Default Date)</option>
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Default Date</label>
                <input 
                  type="text" 
                  value={settings.globalDate}
                  onChange={(e) => setSettings(p => ({ ...p, globalDate: e.target.value }))}
                  className="w-full p-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Start ID</label>
                <input 
                  type="number" 
                  value={settings.startId}
                  onChange={(e) => setSettings(p => ({ ...p, startId: e.target.value }))}
                  className="w-full p-1.5 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Card Design */}
      <div>
        <SectionHeader title="Card Design" icon={Settings} isOpen={openSections.design} onClick={() => toggleSection('design')} />
        {openSections.design && (
          <div className="p-2 space-y-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Dimensions</label>
                <div className="flex bg-gray-100 rounded p-0.5">
                  {(['mm', 'cm', 'px'] as const).map(unit => (
                    <button
                      key={unit}
                      onClick={() => setDimUnit(unit)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${dimUnit === unit ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}
                    >
                      {unit.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Width</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={toDisplayUnit(settings.cardWidthMM)}
                    onChange={(e) => setSettings(p => ({ ...p, cardWidthMM: fromDisplayUnit(e.target.value) }))}
                    className="w-full mt-1 p-1.5 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Height</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={toDisplayUnit(settings.cardHeightMM)}
                    onChange={(e) => setSettings(p => ({ ...p, cardHeightMM: fromDisplayUnit(e.target.value) }))}
                    className="w-full mt-1 p-1.5 border rounded text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={resetDimensions}
                className="w-full text-xs flex items-center justify-center gap-1 text-teal-600 hover:text-teal-800 mt-1"
              >
                <RefreshCw size={10} /> Reset to Standard (85.6 × 54mm)
              </button>
            </div>

            <hr className="border-gray-100"/>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Logo Size ({settings.logoSize}px)</label>
              <input 
                type="range" min="30" max="100" 
                value={settings.logoSize} 
                onChange={(e) => setSettings(p => ({ ...p, logoSize: Number(e.target.value) }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Custom Logo</label>
              <div className="flex gap-2">
                <label className="flex-grow cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded p-1.5 text-center hover:bg-gray-100">
                  <span className="text-xs text-gray-500">{customLogo ? 'Change' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {customLogo && (
                  <button onClick={() => setCustomLogo(null)} className="px-2 text-red-500 border border-red-200 rounded hover:bg-red-50">×</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Typography & Alignment */}
      <div>
        <SectionHeader title="Typography & Alignment" icon={Type} isOpen={openSections.typo} onClick={() => toggleSection('typo')} />
        {openSections.typo && (
          <div className="p-2 space-y-4 mb-4">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Name Font Size</span>
                <span>{settings.fontSizes.name}pt</span>
              </div>
              <input 
                type="range" min="10" max="30" 
                value={settings.fontSizes.name}
                onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, name: Number(e.target.value) } }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Name Vertical Position</span>
                <span>{settings.nameOffset > 0 ? `+${settings.nameOffset}` : settings.nameOffset}px</span>
              </div>
              <input 
                type="range" min="-50" max="50" 
                value={settings.nameOffset}
                onChange={(e) => setSettings(p => ({ ...p, nameOffset: Number(e.target.value) }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <hr className="border-gray-100"/>

            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>ID/UT Number Size</span>
                <span>{settings.fontSizes.id}pt</span>
              </div>
              <input 
                type="range" min="14" max="40" 
                value={settings.fontSizes.id}
                onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, id: Number(e.target.value) } }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Date Font Size</span>
                <span>{settings.fontSizes.date}pt</span>
              </div>
              <input 
                type="range" min="8" max="20" 
                value={settings.fontSizes.date}
                onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, date: Number(e.target.value) } }))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-600">Total: <b>{totalCards}</b> cards</span>
          <span className="text-xs text-gray-600"><b>{totalPages}</b> pages</span>
        </div>

        {viewMode === 'single' && (
          <div className="mb-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex gap-2">
            <span className="font-bold">Note:</span> Switch to "Sheet View" to print all pages.
          </div>
        )}

        <button 
          onClick={handlePrint}
          className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-md font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Printer size={20} />
          Print {viewMode === 'single' ? 'Sample' : 'All Sheets'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;