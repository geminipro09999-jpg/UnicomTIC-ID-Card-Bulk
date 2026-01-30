import React from 'react';
import { Image } from 'lucide-react';

interface UnicomLogoProps {
  size: number;
  customLogo: string | null;
}

const UnicomLogo: React.FC<UnicomLogoProps> = ({ size, customLogo }) => {
  return (
    <div style={{ width: `${size}px` }} className="flex flex-col items-start relative">
      {customLogo ? (
        <img 
          src={customLogo} 
          alt="Logo" 
          style={{ 
            width: '100%',
            height: 'auto', // Allow natural aspect ratio
            display: 'block',
            objectFit: 'contain'
          }} 
        />
      ) : (
        <div 
          style={{ 
            width: `${size}px`, 
            height: `${size}px`, // Keep placeholder square
            borderRadius: '4px',
            background: '#f0f0f0',
            border: '1px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}
        >
          <Image size={size * 0.5} />
        </div>
      )}
    </div>
  );
};

export default UnicomLogo;