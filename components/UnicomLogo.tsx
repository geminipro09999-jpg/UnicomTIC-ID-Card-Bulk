import React from 'react';

interface UnicomLogoProps {
  size: number;
  customLogo: string | null;
}

const UnicomLogo: React.FC<UnicomLogoProps> = ({ size, customLogo }) => {
  return (
    <div style={{ width: `${size}px` }} className="flex flex-col items-center">
      {customLogo ? (
        <img 
          src={customLogo} 
          alt="Logo" 
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            objectFit: 'contain',
            borderRadius: '8px'
          }} 
        />
      ) : (
        <div 
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            borderRadius: '20%',
            background: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <div style={{
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg 
              width="60%" 
              height="60%" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#333" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </div>
        </div>
      )}
      <div className="text-center mt-1 leading-none">
        <div style={{ fontSize: `${size * 0.25}px`, fontWeight: 'bold', color: '#333' }}>Unicom TIC</div>
        <div style={{ fontSize: `${size * 0.12}px`, color: '#666' }}>Training & Innovation Centre</div>
      </div>
    </div>
  );
};

export default UnicomLogo;
