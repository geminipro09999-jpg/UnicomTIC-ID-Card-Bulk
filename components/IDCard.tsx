import React from 'react';
import { Edit2 } from 'lucide-react';
import UnicomLogo from './UnicomLogo';
import { Participant, AppSettings, Alignment, Position } from '../types';

interface IDCardProps {
  data: Participant;
  settings: AppSettings;
  index: number;
  customLogo: string | null;
  onEdit?: (index: number) => void;
}

// Internal utility for deep merging to ensure safe effective settings
const deepMerge = (target: any, source: any) => {
  if (!source) return target;
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

const IDCard: React.FC<IDCardProps> = ({ data, settings, index, customLogo, onEdit }) => {
  // Use deep merge instead of shallow spread to prevent loss of nested settings
  const effectiveSettings = data.designOverrides 
    ? deepMerge(settings, data.designOverrides) 
    : settings;

  // Defensive extraction with safe fallbacks to prevent crashes
  const { 
    cardWidthMM = 85.6, 
    cardHeightMM = 54, 
    logoSize = 50, 
    logoPos = { x: 0, y: 0 }, 
    logoAlign = { horizontal: 'left', vertical: 'top' }, 
    globalDate = '02/03/2025', 
    startId = '010701',
    fontSizes = { name: 16, id: 24, date: 14 }, 
    fontFamilies = { name: 'Roboto Slab', id: 'Roboto Slab' }, 
    namePos = { x: 0, y: 0 }, 
    nameAlign = { horizontal: 'center', vertical: 'middle' }, 
    idPos = { x: 0, y: 0 }, 
    idAlign = { horizontal: 'right', vertical: 'top' }, 
    cutMarkType = 'none'
  } = effectiveSettings;
  
  const idToDisplay = data.id || `UT${String(parseInt(startId || '0') + index).padStart(6, '0')}`;
  const dateToDisplay = data.date || globalDate;
  
  const CropMark = ({ style }: { style: React.CSSProperties }) => (
    <div className="absolute bg-black print:bg-black" style={{ ...style, position: 'absolute' }} />
  );

  const getAlignmentStyles = (align: Alignment, pos: Position): React.CSSProperties => {
    const styles: React.CSSProperties = { position: 'absolute', whiteSpace: 'nowrap', zIndex: 10 };
    
    // Horizontal
    if (align.horizontal === 'left') {
      styles.left = '4mm';
      styles.right = 'auto';
    } else if (align.horizontal === 'center') {
      styles.left = '50%';
      styles.right = 'auto';
    } else if (align.horizontal === 'right') {
      styles.right = '4mm';
      styles.left = 'auto';
    }

    // Vertical
    if (align.vertical === 'top') {
      styles.top = '4mm';
      styles.bottom = 'auto';
    } else if (align.vertical === 'middle') {
      styles.top = '50%';
      styles.bottom = 'auto';
    } else if (align.vertical === 'bottom') {
      styles.bottom = '4mm';
      styles.top = 'auto';
    }

    const hPercent = align.horizontal === 'center' ? '-50%' : '0%';
    const vPercent = align.vertical === 'middle' ? '-50%' : '0%';
    styles.transform = `translate(calc(${hPercent} + ${pos.x}px), calc(${vPercent} + ${pos.y}px))`;

    return styles;
  };

  return (
    <div 
      className={`group relative ${cutMarkType === 'border' ? 'cutting-border' : (cutMarkType === 'crop' ? '' : 'shadow-sm')}`}
      style={{
        width: `${cardWidthMM}mm`,
        height: `${cardHeightMM}mm`,
        boxSizing: 'border-box',
        overflow: 'visible'
      }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(index);
          }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 no-print hover:bg-teal-700 active:scale-90"
        >
          <Edit2 size={14} />
        </button>
      )}

      {cutMarkType === 'crop' && (
        <>
          <CropMark style={{ top: '0', left: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ top: '-5mm', left: '0', width: '1px', height: '5mm' }} />
          <CropMark style={{ top: '0', right: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ top: '-5mm', right: '0', width: '1px', height: '5mm' }} />
          <CropMark style={{ bottom: '0', left: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ bottom: '-5mm', left: '0', width: '1px', height: '5mm' }} />
          <CropMark style={{ bottom: '0', right: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ bottom: '-5mm', right: '0', width: '1px', height: '5mm' }} />
        </>
      )}

      <div 
        style={{ 
          width: '100%', 
          height: '100%',
          border: '2px solid #000',
          position: 'relative',
          backgroundColor: 'white',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Logo */}
        <div style={getAlignmentStyles(logoAlign, logoPos)}>
          <UnicomLogo size={logoSize} customLogo={customLogo} />
        </div>
        
        {/* ID Number */}
        <div style={getAlignmentStyles(idAlign, idPos)}>
          <span 
            className="block" 
            style={{ 
              fontSize: `${fontSizes.id}pt`, 
              fontFamily: fontFamilies.id,
              fontWeight: 'bold',
              lineHeight: 1, 
              letterSpacing: '1px',
              textAlign: idAlign.horizontal,
              color: '#333'
            }}
          >
            {idToDisplay}
          </span>
        </div>

        {/* Name */}
        <div style={getAlignmentStyles(nameAlign, namePos)}>
             <span 
                className="uppercase