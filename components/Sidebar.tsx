import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { 
  Layout, Upload, Settings, Type, Printer, 
  ChevronDown, ChevronRight, Scissors, RefreshCw, 
  Grid, Move, CreditCard
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
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

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
        type="button"
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
        <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
          <CreditCard size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-800 leading-tight">Bulk ID Studio</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Custom Card Generator</p>
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
                  type="button"
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

            {settings.pageSize !== 'CR80' && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Grid Layout</span>
                  <div className="flex gap-2 text-xs">
                    <button 
                      type="button"
                      onClick={() => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, enabled: false } }))}
                      className={`px-2 py-1 rounded ${!settings.manualGrid.enabled ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                      Auto
                    </button>
                    <button 
                      type="button"
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
                      <label htmlFor="grid-cols" className="text-[10px] text-gray-500 uppercase font-bold flex justify-between">
                        Cols <span className="text-teal-600 font-normal">Max: {layoutConfig.maxCols}</span>
                      </label>
                      <input 
                        id="grid-cols"
                        name="grid-cols"
                        type="number" 
                        min="1" max="15"
                        value={settings.manualGrid.cols}
                        onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, cols: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        className={`w-full mt-1 p-1.5 border rounded text-sm text-center ${settings.manualGrid.cols > layoutConfig.maxCols ? 'border-amber-500 bg-amber-50' : ''}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="grid-rows" className="text-[10px] text-gray-500 uppercase font-bold flex justify-between">
                        Rows <span className="text-teal-600 font-normal">Max: {layoutConfig.maxRows}</span>
                      </label>
                      <input 
                        id="grid-rows"
                        name="grid-rows"
                        type="number" 
                        min="1" max="20"
                        value={settings.manualGrid.rows}
                        onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, rows: Math.max(1, parseInt(e.target.value) || 1) } }))}
                        className={`w-full mt-1 p-1.5 border rounded text-sm text-center ${settings.manualGrid.rows > layoutConfig.maxRows ? 'border-amber-500 bg-amber-50' : ''}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic text-center">
                     Auto-fitting <b>{layoutConfig.cols}</b> cols × <b>{layoutConfig.rows}</b> rows.
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
                <span className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1">
                    <Scissors size={12} /> Cutting Lines / Marks
                </span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['none', 'border', 'crop'] as const).map(type => (
                      <button
                          key={type}
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, cutMarkType: type }))}
                          className={`flex-1 py-1.5 text-xs font-medium rounded transition-all capitalize ${
                              settings.cutMarkType === type 
                              ? 'bg-white shadow text-teal-700' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                          {type}
                      </button>
                    ))}
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
              <label htmlFor="excel-upload" className="block text-xs font-medium text-gray-700 mb-1">Upload Participant File (.xlsx)</label>
              <input 
                id="excel-upload"
                name="excel-upload"
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>

            {excelHeaders.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Map Excel Columns</h4>
                
                <div>
                  <label htmlFor="map-name" className="text-xs text-gray-600 block mb-1 font-medium">Name Column</label>
                  <select 
                    id="map-name"
                    name="map-name"
                    className="w-full p-1.5 text-sm border rounded bg-white shadow-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    value={columnMapping.name}
                    onChange={e => setColumnMapping(p => ({...p, name: e.target.value}))}
                  >
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="map-id" className="text-xs text-gray-600 block mb-1 font-medium">ID Number Column</label>
                  <select 
                    id="map-id"
                    name="map-id"
                    className="w-full p-1.5 text-sm border rounded bg-white shadow-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    value={columnMapping.id}
                    onChange={e => setColumnMapping(p => ({...p, id: e.target.value}))}
                  >
                    <option value="">(Auto-Generate ID)</option>
                    {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="map-date" className="text-xs text-gray-600 block mb-1 font-medium">Date Column</label>
                  <select 
                    id="map-date"
                    name="map-date"
                    className="w-full p-1.5 text-sm border rounded bg-white shadow-sm focus:ring-1 focus:ring-teal-500 outline-none"
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
                <label htmlFor="default-date" className="text-xs text-gray-600 font-medium">Default Date</label>
                <input 
                  id="default-date"
                  name="default-date"
                  type="text" 
                  value={settings.globalDate}
                  onChange={(e) => setSettings(p => ({ ...p, globalDate: e.target.value }))}
                  className="w-full mt-1 p-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="start-id" className="text-xs text-gray-600 font-medium">Start ID</label>
                <input 
                  id="start-id"
                  name="start-id"
                  type="number" 
                  value={settings.startId}
                  onChange={(e) => setSettings(p => ({ ...p, startId: e.target.value }))}
                  className="w-full mt-1 p-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
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
                <span className="text-xs font-semibold text-gray-700">Dimensions</span>
                <div className="flex bg-gray-100 rounded p-0.5">
                  {(['mm', 'cm', 'px'] as const).map(unit => (
                    <button
                      key={unit}
                      type="button"
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
                  <label htmlFor="card-width" className="text-[10px] text-gray-500 uppercase font-bold">Width</label>
                  <input 
                    id="card-width"
                    name="card-width"
                    type="number" 
                    step="0.1"
                    value={toDisplayUnit(settings.cardWidthMM)}
                    onChange={(e) => setSettings(p => ({ ...p, cardWidthMM: fromDisplayUnit(e.target.value) }))}
                    className="w-full mt-1 p-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="card-height" className="text-[10px] text-gray-500 uppercase font-bold">Height</label>
                  <input 
                    id="card-height"
                    name="card-height"
                    type="number" 
                    step="0.1"
                    value={toDisplayUnit(settings.cardHeightMM)}
                    onChange={(e) => setSettings(p => ({ ...p, cardHeightMM: fromDisplayUnit(e.target.value) }))}
                    className="w-full mt-1 p-1.5 border rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={resetDimensions}
                className="w-full text-xs flex items-center justify-center gap-1 text-teal-600 hover:text-teal-800 mt-1"
              >
                <RefreshCw size={10} /> Reset to Standard (85.6 × 54mm)
              </button>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Move size={12} /> Logo Config
                    </span>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <label htmlFor="logo-size" className="font-medium">Size (Width)</label>
                            <span>{settings.logoSize}px</span>
                        </div>
                        <input 
                            id="logo-size"
                            name="logo-size"
                            type="range" min="30" max="250" 
                            value={settings.logoSize} 
                            onChange={(e) => setSettings(p => ({ ...p, logoSize: Number(e.target.value) }))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <label htmlFor="logo-x" className="font-medium">L / R</label>
                                <span className="text-[10px] text-gray-400">{settings.logoPos.x}px</span>
                            </div>
                            <input 
                                id="logo-x"
                                name="logo-x"
                                type="range" min="-100" max="200" 
                                value={settings.logoPos.x}
                                onChange={(e) => setSettings(p => ({ ...p, logoPos: { ...p.logoPos, x: Number(e.target.value) } }))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <label htmlFor="logo-y" className="font-medium">U / D</label>
                                <span className="text-[10px] text-gray-400">{settings.logoPos.y}px</span>
                            </div>
                            <input 
                                id="logo-y"
                                name="logo-y"
                                type="range" min="-100" max="100" 
                                value={settings.logoPos.y}
                                onChange={(e) => setSettings(p => ({ ...p, logoPos: { ...p.logoPos, y: Number(e.target.value) } }))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                            />
                        </div>
                    </div>

                    <div className="mt-2">
                        <div className="flex gap-2">
                            <label htmlFor="logo-upload" className="flex-grow cursor-pointer bg-white border border-dashed border-gray-300 rounded p-1.5 text-center hover:bg-gray-50 transition-colors">
                                <span className="text-xs text-gray-500 font-medium">{customLogo ? 'Change Logo' : 'Upload Logo'}</span>
                                <input id="logo-upload" name="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            {customLogo && (
                                <button type="button" onClick={() => setCustomLogo(null)} className="px-2 text-red-500 border border-red-200 rounded hover:bg-red-50 bg-white" title="Remove Logo">×</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Typography & Positioning */}
      <div>
        <SectionHeader title="Typography & Positioning" icon={Type} isOpen={openSections.typo} onClick={() => toggleSection('typo')} />
        {openSections.typo && (
          <div className="p-2 space-y-4 mb-4">
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-1">Name Layout</h4>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <label htmlFor="font-name" className="font-medium">Font Size</label>
                            <span>{settings.fontSizes.name}pt</span>
                        </div>
                        <input 
                            id="font-name"
                            name="font-name"
                            type="range" min="8" max="60" 
                            value={settings.fontSizes.name}
                            onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, name: Number(e.target.value) } }))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <label htmlFor="name-x" className="font-medium">L / R</label>
                                <span className="text-[10px] text-gray-400">{settings.namePos.x}px</span>
                            </div>
                            <input id="name-x" name="name-x" type="range" min="-200" max="200" value={settings.namePos.x} onChange={(e) => setSettings(p => ({ ...p, namePos: { ...p.namePos, x: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <label htmlFor="name-y" className="font-medium">U / D</label>
                                <span className="text-[10px] text-gray-400">{settings.namePos.y}px</span>
                            </div>
                            <input id="name-y" name="name-y" type="range" min="-100" max="100" value={settings.namePos.y} onChange={(e) => setSettings(p => ({ ...p, namePos: { ...p.namePos, y: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-1">ID Layout</h4>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <label htmlFor="font-id" className="font-medium">Font Size</label>
                            <span>{settings.fontSizes.id}pt</span>
                        </div>
                        <input id="font-id" name="font-id" type="range" min="10" max="60" value={settings.fontSizes.id} onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, id: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1"><label htmlFor="id-x" className="font-medium">L / R</label><span className="text-[10px] text-gray-400">{settings.idPos.x}px</span></div>
                            <input id="id-x" name="id-x" type="range" min="-200" max="200" value={settings.idPos.x} onChange={(e) => setSettings(p => ({ ...p, idPos: { ...p.idPos, x: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1"><label htmlFor="id-y" className="font-medium">U / D</label><span className="text-[10px] text-gray-400">{settings.idPos.y}px</span></div>
                            <input id="id-y" name="id-y" type="range" min="-100" max="100" value={settings.idPos.y} onChange={(e) => setSettings(p => ({ ...p, idPos: { ...p.idPos, y: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <label htmlFor="font-date" className="font-medium">Date Font Size</label>
                <span>{settings.fontSizes.date}pt</span>
              </div>
              <input id="font-date" name="font-date" type="range" min="8" max="20" value={settings.fontSizes.date} onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, date: Number(e.target.value) } }))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-600">Total: <b>{totalCards}</b> cards</span>
          <span className="text-xs text-gray-600"><b>{totalPages}</b> pages</span>
        </div>
        <button 
          type="button"
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