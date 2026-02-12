import React, { useState, ChangeEvent, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Layout, Upload, Settings, Type, Printer, 
  ChevronDown, ChevronRight, Scissors, RefreshCw, 
  Grid, Move, CreditCard, Save, FolderOpen, Trash2, Search, X, Users, Edit2
} from 'lucide-react';
import { AppSettings, ColumnMapping, LayoutConfig, Participant } from '../types';

interface SidebarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customLogo: string | null;
  setCustomLogo: (logo: string | null) => void;
  setParticipants: (data: any[]) => void;
  participants: Participant[];
  filteredParticipants: Participant[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalCards: number;
  totalPages: number;
  layoutConfig: LayoutConfig;
  handlePrint: () => void;
  viewMode: string;
  onEditParticipant: (index: number) => void;
}

const CONVERSION = {
  mm: 1,
  cm: 10,
  px: 0.264583
};

const Sidebar: React.FC<SidebarProps> = ({
  settings, setSettings, customLogo, setCustomLogo, 
  setParticipants, participants, filteredParticipants, searchQuery, setSearchQuery, 
  totalCards, totalPages, layoutConfig, handlePrint, viewMode, onEditParticipant
}) => {
  const [openSections, setOpenSections] = useState({ config: true, layout: false, data: true, list: true, typo: false, design: false });
  const [dimUnit, setDimUnit] = useState<'mm' | 'cm' | 'px'>('mm');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ name: '', id: '', date: '' });
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const toggleSection = (key: keyof typeof openSections) => 
    setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const toDisplayUnit = (valMM: number) => parseFloat((valMM / CONVERSION[dimUnit]).toFixed(2));
  const fromDisplayUnit = (val: string) => parseFloat(val) * CONVERSION[dimUnit];

  const saveConfiguration = () => {
    const configBundle = { settings, customLogo, columnMapping };
    localStorage.setItem('unicom_id_studio_saved_profile', JSON.stringify(configBundle));
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('unicom_id_studio_saved_profile');
    if (saved) {
      try {
        const bundle = JSON.parse(saved);
        setSettings(bundle.settings);
        setCustomLogo(bundle.customLogo);
        if (bundle.columnMapping) setColumnMapping(bundle.columnMapping);
        setSaveStatus('Loaded!');
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  };

  const resetDimensions = () => setSettings(p => ({ ...p, cardWidthMM: 85.6, cardHeightMM: 54 }));

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
        const data = XLSX.utils.sheet_to_json<any>(wb.Sheets[wsname]);
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setExcelHeaders(headers);
          setRawExcelData(data);
          if (!columnMapping.name) {
            const newMapping = { name: '', id: '', date: '' };
            headers.forEach(h => {
              const lower = h.toLowerCase();
              if (lower.includes('name')) newMapping.name = h;
              else if (lower.includes('id')) newMapping.id = h;
              else if (lower.includes('date')) newMapping.date = h;
            });
            if (!newMapping.name) newMapping.name = headers[0];
            setColumnMapping(newMapping);
          }
        }
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (rawExcelData.length === 0) return;
    const processed = rawExcelData.map(row => ({
      name: columnMapping.name ? row[columnMapping.name] : 'Unknown',
      id: columnMapping.id ? row[columnMapping.id] : null,
      date: columnMapping.date ? row[columnMapping.date] : null
    }));
    setParticipants(processed);
  }, [columnMapping, rawExcelData, setParticipants]);

  const SectionHeader = ({ title, icon: Icon, isOpen, onClick }: any) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-2 transition-colors border border-gray-200">
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
        <div className="p-2 bg-teal-100 rounded-lg text-teal-700"><CreditCard size={24} /></div>
        <div>
          <h1 className="font-bold text-lg text-gray-800 leading-tight">Bulk ID Studio</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Custom Card Generator</p>
        </div>
      </div>

      <SectionHeader title="App Configuration" icon={Save} isOpen={openSections.config} onClick={() => toggleSection('config')} />
      {openSections.config && (
        <div className="p-2 space-y-3 mb-4">
          <p className="text-[10px] text-gray-500 italic mb-2">Save your design and mappings as a preset.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={saveConfiguration} className="flex items-center justify-center gap-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold transition-all shadow-sm active:scale-95"><Save size={14} /> Save</button>
            <button type="button" onClick={loadConfiguration} className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 rounded text-xs font-bold transition-all shadow-sm active:scale-95"><FolderOpen size={14} /> Load</button>
          </div>
          {saveStatus && <div className="text-center text-[10px] font-bold text-teal-600 animate-pulse">{saveStatus}</div>}
        </div>
      )}

      <SectionHeader title="Manage Participants" icon={Users} isOpen={openSections.list} onClick={() => toggleSection('list')} />
      {openSections.list && (
        <div className="p-2 space-y-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg bg-gray-50 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Participant List</span>
              <span className="text-[10px] text-teal-600 font-bold">{filteredParticipants.length} showing</span>
            </div>
            <div className="max-height-[300px] overflow-y-auto divide-y divide-gray-100 bg-white" style={{ maxHeight: '300px' }}>
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p) => {
                  const originalIdx = participants.indexOf(p);
                  return (
                    <div key={originalIdx} className="group flex items-center justify-between p-2 hover:bg-teal-50 transition-colors">
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{p.id || 'No ID'}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => onEditParticipant(originalIdx)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Edit individual"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-xs italic">No results found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Data & Mapping" icon={Upload} isOpen={openSections.data} onClick={() => toggleSection('data')} />
      {openSections.data && (
        <div className="p-2 space-y-4 mb-4">
          <div>
            <label htmlFor="excel-upload" className="block text-xs font-medium text-gray-700 mb-1">Upload Excel (.xlsx)</label>
            <input id="excel-upload" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
          </div>

          {excelHeaders.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg space-y-3">
              <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Column Mapping</h4><button type="button" onClick={() => setColumnMapping({name: '', id: '', date: ''})} className="text-yellow-700 hover:text-yellow-900"><Trash2 size={12}/></button></div>
              <div><label className="text-xs text-gray-600 block mb-1 font-medium">Name</label><select className="w-full p-1.5 text-xs border rounded bg-white shadow-sm" value={columnMapping.name} onChange={e => setColumnMapping(p => ({...p, name: e.target.value}))}><option value="">-- Select --</option>{excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
              <div><label className="text-xs text-gray-600 block mb-1 font-medium">ID Number</label><select className="w-full p-1.5 text-xs border rounded bg-white shadow-sm" value={columnMapping.id} onChange={e => setColumnMapping(p => ({...p, id: e.target.value}))}><option value="">(Auto-Gen)</option>{excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
              <div><label className="text-xs text-gray-600 block mb-1 font-medium">Date</label><select className="w-full p-1.5 text-xs border rounded bg-white shadow-sm" value={columnMapping.date} onChange={e => setColumnMapping(p => ({...p, date: e.target.value}))}><option value="">(Default)</option>{excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-600 font-medium">Default Date</label><input type="text" value={settings.globalDate} onChange={(e) => setSettings(p => ({ ...p, globalDate: e.target.value }))} className="w-full mt-1 p-1.5 border rounded text-xs" /></div>
            <div><label className="text-xs text-gray-600 font-medium">Start ID</label><input type="number" value={settings.startId} onChange={(e) => setSettings(p => ({ ...p, startId: e.target.value }))} className="w-full mt-1 p-1.5 border rounded text-xs" /></div>
          </div>
        </div>
      )}

      <SectionHeader title="Page Layout" icon={Layout} isOpen={openSections.layout} onClick={() => toggleSection('layout')} />
      {openSections.layout && (
        <div className="p-2 space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-2">{['A4', 'A3', 'A2', 'CR80'].map(size => (<button key={size} type="button" onClick={() => setSettings(p => ({ ...p, pageSize: size }))} className={`py-2 px-3 rounded text-sm font-medium transition-colors ${settings.pageSize === size ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{size === 'CR80' ? 'Single' : size}</button>))}</div>
          {settings.pageSize !== 'CR80' && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-700">Grid</span><div className="flex gap-2 text-xs"><button type="button" onClick={() => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, enabled: false } }))} className={`px-2 py-1 rounded ${!settings.manualGrid.enabled ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Auto</button><button type="button" onClick={() => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, enabled: true } }))} className={`px-2 py-1 rounded ${settings.manualGrid.enabled ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Manual</button></div></div>
              {settings.manualGrid.enabled ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-gray-500 uppercase font-bold">Cols</label><input type="number" value={settings.manualGrid.cols} onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, cols: Math.max(1, parseInt(e.target.value) || 1) } }))} className="w-full mt-1 p-1.5 border rounded text-xs text-center" /></div>
                  <div><label className="text-[10px] text-gray-500 uppercase font-bold">Rows</label><input type="number" value={settings.manualGrid.rows} onChange={(e) => setSettings(p => ({ ...p, manualGrid: { ...p.manualGrid, rows: Math.max(1, parseInt(e.target.value) || 1) } }))} className="w-full mt-1 p-1.5 border rounded text-xs text-center" /></div>
                </div>
              ) : <div className="text-xs text-gray-500 italic text-center">Auto-fitting <b>{layoutConfig.cols}</b>×<b>{layoutConfig.rows}</b>.</div>}
            </div>
          )}
          <div className="pt-2"><span className="text-xs font-bold text-gray-700 block mb-2"><Scissors size={12} className="inline mr-1" /> Cutting Marks</span><div className="flex bg-gray-100 p-1 rounded-lg">{(['none', 'border', 'crop'] as const).map(type => (<button key={type} type="button" onClick={() => setSettings(p => ({ ...p, cutMarkType: type }))} className={`flex-1 py-1.5 text-xs font-medium rounded transition-all capitalize ${settings.cutMarkType === type ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}>{type}</button>))}</div></div>
        </div>
      )}

      <SectionHeader title="Card Design" icon={Settings} isOpen={openSections.design} onClick={() => toggleSection('design')} />
      {openSections.design && (
        <div className="p-2 space-y-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-700">Size</span><div className="flex bg-gray-100 rounded p-0.5">{(['mm', 'cm', 'px'] as const).map(unit => (<button key={unit} type="button" onClick={() => setDimUnit(unit)} className={`px-2 py-0.5 text-[10px] font-bold rounded ${dimUnit === unit ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>{unit.toUpperCase()}</button>))}</div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase font-bold">W</label><input type="number" step="0.1" value={toDisplayUnit(settings.cardWidthMM)} onChange={(e) => setSettings(p => ({ ...p, cardWidthMM: fromDisplayUnit(e.target.value) }))} className="w-full mt-1 p-1.5 border rounded text-xs" /></div>
              <div><label className="text-[10px] text-gray-500 uppercase font-bold">H</label><input type="number" step="0.1" value={toDisplayUnit(settings.cardHeightMM)} onChange={(e) => setSettings(p => ({ ...p, cardHeightMM: fromDisplayUnit(e.target.value) }))} className="w-full mt-1 p-1.5 border rounded text-xs" /></div>
            </div>
            <button type="button" onClick={resetDimensions} className="w-full text-[10px] text-teal-600 hover:underline"><RefreshCw size={10} className="inline mr-1" /> Reset Size</button>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100"><span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><Move size={12} /> Logo</span><div className="space-y-3 mt-2"><div><div className="flex justify-between text-[10px] mb-1"><span>Size</span><span>{settings.logoSize}px</span></div><input type="range" min="30" max="250" value={settings.logoSize} onChange={(e) => setSettings(p => ({ ...p, logoSize: Number(e.target.value) }))} className="w-full h-1 bg-gray-200 rounded accent-teal-600" /></div><div className="grid grid-cols-2 gap-3"><div><span className="text-[10px]">L/R</span><input type="range" min="-100" max="200" value={settings.logoPos.x} onChange={(e) => setSettings(p => ({ ...p, logoPos: { ...p.logoPos, x: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 rounded accent-teal-600" /></div><div><span className="text-[10px]">U/D</span><input type="range" min="-100" max="100" value={settings.logoPos.y} onChange={(e) => setSettings(p => ({ ...p, logoPos: { ...p.logoPos, y: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 rounded accent-teal-600" /></div></div><label className="block cursor-pointer bg-white border border-dashed text-center p-2 rounded text-[10px]">{customLogo ? 'Change' : 'Upload'} Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label></div></div>
        </div>
      )}

      <SectionHeader title="Typography" icon={Type} isOpen={openSections.typo} onClick={() => toggleSection('typo')} />
      {openSections.typo && (
        <div className="p-2 space-y-4 mb-4">
          <div className="bg-gray-50 p-2 rounded-lg"><h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Name</h4><div className="space-y-2"><div><span className="text-[10px]">Size {settings.fontSizes.name}pt</span><input type="range" min="8" max="60" value={settings.fontSizes.name} onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, name: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div><div className="grid grid-cols-2 gap-2"><div><span className="text-[10px]">L/R</span><input type="range" min="-200" max="200" value={settings.namePos.x} onChange={(e) => setSettings(p => ({ ...p, namePos: { ...p.namePos, x: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div><div><span className="text-[10px]">U/D</span><input type="range" min="-100" max="100" value={settings.namePos.y} onChange={(e) => setSettings(p => ({ ...p, namePos: { ...p.namePos, y: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div></div></div></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase">ID</h4><div className="space-y-2"><div><span className="text-[10px]">Size {settings.fontSizes.id}pt</span><input type="range" min="10" max="60" value={settings.fontSizes.id} onChange={(e) => setSettings(p => ({ ...p, fontSizes: { ...p.fontSizes, id: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div><div className="grid grid-cols-2 gap-2"><div><span className="text-[10px]">L/R</span><input type="range" min="-200" max="200" value={settings.idPos.x} onChange={(e) => setSettings(p => ({ ...p, idPos: { ...p.idPos, x: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div><div><span className="text-[10px]">U/D</span><input type="range" min="-100" max="100" value={settings.idPos.y} onChange={(e) => setSettings(p => ({ ...p, idPos: { ...p.idPos, y: Number(e.target.value) } }))} className="w-full h-1 bg-gray-200 accent-teal-600" /></div></div></div></div>
        </div>
      )}

      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-600">{filteredParticipants.length === totalCards ? `Total: ${totalCards}` : `Showing ${filteredParticipants.length} of ${totalCards}`} cards</span>
          <span className="text-xs text-gray-600"><b>{totalPages}</b> pages</span>
        </div>
        <button type="button" onClick={handlePrint} className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-md font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-95"><Printer size={20} /> Print {viewMode === 'single' ? 'Sample' : 'All Sheets'}</button>
      </div>
    </div>
  );
};

export default Sidebar;