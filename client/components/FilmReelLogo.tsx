import React from 'react';

interface FilmReelLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

const FilmReelLogo: React.FC<FilmReelLogoProps> = ({ 
  size = 128, 
  animate = true, 
  className = '' 
}) => {
  // Use percentage-based positioning for better scalability
  const holePositions = [
    { x: 50.0, y: 15.0 },   // top
    { x: 83.3, y: 39.2 },   // top-right  
    { x: 70.6, y: 78.3 },   // bottom-right
    { x: 29.4, y: 78.3 },   // bottom-left
    { x: 16.7, y: 39.2 }    // top-left
  ];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spinReel {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning-reel {
            ${animate ? 'animation: spinReel 4s linear infinite;' : ''}
          }
          .spinning-reel:hover {
            ${animate ? 'animation-duration: 1s;' : ''}
          }
        `
      }} />
      <div
        className={`relative rounded-full shadow-lg ${animate ? 'spinning-reel' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#6b7280',
          border: `${Math.max(2, size * 0.03125)}px solid #4b5563`, // Scale border with size
        }}
      >
        {holePositions.map((pos, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              width: `${size * 0.1875}px`, // 12% of container size
              height: `${size * 0.1875}px`,
              backgroundColor: '#1e293b',
              top: `${pos.y}%`,
              left: `${pos.x}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        <div
          className="absolute rounded-full"
          style={{
            width: `${size * 0.25}px`, // 25% of container size
            height: `${size * 0.25}px`,
            backgroundColor: '#374151',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: `${Math.max(1, size * 0.015625)}px solid #4b5563` // Scale border with size
          }}
        />
      </div>
    </div>
  );
};

export default FilmReelLogo;