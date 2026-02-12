import React from 'react';
import { Edit2 } from 'lucide-react';
import UnicomLogo from './UnicomLogo';
import { Participant, AppSettings } from '../types';

interface IDCardProps {
  data: Participant;
  settings: AppSettings;
  index: number;
  customLogo: string | null;
  onEdit?: (index: number) => void;
}

const IDCard: React.FC<IDCardProps> = ({ data, settings, index, customLogo, onEdit }) => {
  const { 
    cardWidthMM, cardHeightMM, logoSize, logoPos, globalDate, startId,
    fontSizes, namePos, idPos, cutMarkType
  } = settings;
  
  // Priority: Data from Excel > Generated ID
  const idToDisplay = data.id || `UT${String(parseInt(startId || '0') + index).padStart(6, '0')}`;
  // Priority: Data from Excel > Global Date setting
  const dateToDisplay = data.date || globalDate;
  
  // Crop Mark Helper
  const CropMark = ({ style }: { style: React.CSSProperties }) => (
    <div className="absolute bg-black print:bg-black" style={{ ...style, position: 'absolute' }} />
  );

  return (
    <div 
      className={`group relative ${cutMarkType === 'border' ? 'cutting-border' : (cutMarkType === 'crop' ? '' : 'shadow-sm')}`}
      style={{
        width: `${cardWidthMM}mm`,
        height: `${cardHeightMM}mm`,
        boxSizing: 'border-box',
        overflow: 'visible' // Allow crop marks to protrude
      }}
    >
      {/* Hover Edit Button (No-Print) */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(index);
          }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 no-print hover:bg-teal-700 active:scale-90"
          title="Edit individual card data"
        >
          <Edit2 size={14} />
        </button>
      )}

      {/* Crop Marks Implementation */}
      {cutMarkType === 'crop' && (
        <>
          {/* Top Left */}
          <CropMark style={{ top: '0', left: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ top: '-5mm', left: '0', width: '1px', height: '5mm' }} />
          {/* Top Right */}
          <CropMark style={{ top: '0', right: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ top: '-5mm', right: '0', width: '1px', height: '5mm' }} />
          {/* Bottom Left */}
          <CropMark style={{ bottom: '0', left: '-5mm', width: '5mm', height: '1px' }} />
          <CropMark style={{ bottom: '-5mm', left: '0', width: '1px', height: '5mm' }} />
          {/* Bottom Right */}
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
          boxSizing: 'border-box',
          padding: '4mm'
        }}
      >
        {/* Absolute Logo - Top Left Origin */}
        <div 
          className="absolute top-[4mm] left-[4mm] z-10"
          style={{
              transform: `translate(${logoPos.x}px, ${logoPos.y}px)`
          }}
        >
          <UnicomLogo size={logoSize} customLogo={customLogo} />
        </div>
        
        {/* Absolute ID - Top Right Origin */}
        <div 
            className="absolute top-[4mm] right-[4mm] z-10 text-right"
            style={{
                transform: `translate(${idPos.x}px, ${idPos.y}px)`
            }}
        >
          <span 
            className="font-id font-bold text-[#333] block whitespace-nowrap" 
            style={{ 
              fontSize: `${fontSizes.id}pt`, 
              lineHeight: 1, 
              letterSpacing: '1px'
            }}
          >
            {idToDisplay}
          </span>
        </div>

        {/* Centered Name Container */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
             <span 
                className="font-name font-bold text-[#2d3748] text-center uppercase" 
                style={{ 
                    fontSize: `${fontSizes.name}pt`,
                    transform: `translate(${namePos.x}px, ${namePos.y}px)`
                }}
            >
                {data.name}
            </span>
        </div>

        {/* Bottom Row: Date & Box */}
        <div className="absolute bottom-[4mm] left-[4mm] right-[4mm] flex justify-between items-end">
          <span 
            className="font-bold text-[#218089]" 
            style={{ fontSize: `${fontSizes.date}pt`, fontFamily: 'Roboto Slab' }}
          >
            {dateToDisplay}
          </span>
          
          {/* The empty box area */}
          <div 
            style={{ 
              width: '35mm', 
              height: '12mm', 
              border: '2px solid #000',
              backgroundColor: 'white'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default IDCard;