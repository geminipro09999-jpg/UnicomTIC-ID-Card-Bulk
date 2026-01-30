import React from 'react';
import UnicomLogo from './UnicomLogo';
import { Participant, AppSettings } from '../types';

interface IDCardProps {
  data: Participant;
  settings: AppSettings;
  index: number;
  customLogo: string | null;
}

const IDCard: React.FC<IDCardProps> = ({ data, settings, index, customLogo }) => {
  const { 
    cardWidthMM, cardHeightMM, logoSize, globalDate, startId,
    fontSizes, nameOffset, cutMarkType
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
      className={`relative ${cutMarkType === 'border' ? 'cutting-border' : 'shadow-sm'}`}
      style={{
        width: `${cardWidthMM}mm`,
        height: `${cardHeightMM}mm`,
        boxSizing: 'border-box',
        overflow: 'visible' // Allow crop marks to protrude
      }}
    >
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
        className="flex flex-col"
      >
        {/* Top Row: Logo & ID */}
        <div className="flex justify-between items-start w-full">
          <div className="flex-shrink-0">
            <UnicomLogo size={logoSize} customLogo={customLogo} />
          </div>
          
          <div className="flex-grow flex justify-end items-start pt-2">
            <span 
              className="font-id font-bold text-[#333]" 
              style={{ 
                fontSize: `${fontSizes.id}pt`, 
                lineHeight: 1, 
                letterSpacing: '1px' 
              }}
            >
              {idToDisplay}
            </span>
          </div>
        </div>

        {/* Middle: Name with manual offset */}
        <div 
          className="flex-grow flex items-center justify-center -mt-4 relative"
          style={{ top: `${nameOffset}px` }}
        >
          <span 
            className="font-name font-bold text-[#2d3748] text-center uppercase" 
            style={{ fontSize: `${fontSizes.name}pt` }}
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