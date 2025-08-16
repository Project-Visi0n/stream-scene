import React from 'react';

const FilmReelLogo = () => {
  const holePositions = [
    { x: 0, y: -40 },   // top
    { x: 38, y: -12 },  // top-right
    { x: 24, y: 32 },   // bottom-right
    { x: -24, y: 32 },  // bottom-left
    { x: -38, y: -12 }  // top-left
  ];

  return (
    <div className="flex items-center justify-center">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spinReel {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .spinning-reel {
            animation: spinReel 4s linear infinite;
          }
          
          .spinning-reel:hover {
            animation-duration: 1s;
          }
        `
      }} />
      
      <div
        className="relative w-32 h-32 rounded-full shadow-lg spinning-reel"
        style={{
          backgroundColor: '#6b7280',   
          border: '4px solid #4b5563',  
        }}
      >
        {holePositions.map((pos, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: '#1e293b', 
              top: `calc(50% + ${pos.y}px)`,
              left: `calc(50% + ${pos.x}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FilmReelLogo;