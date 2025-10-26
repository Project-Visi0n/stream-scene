import React from 'react';

interface FilmReelLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  loading?: boolean;
  showText?: boolean;
}

const FilmReelLogo: React.FC<FilmReelLogoProps> = ({ 
  size = 'lg',
  speed = 'normal',
  loading = false,
  showText = false 
}) => {
  // Size mappings for different contexts
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40'
  };

  const holeSizes = {
    xs: 'w-0.5 h-0.5',
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6'
  };

  const centerSizes = {
    xs: 'w-1 h-1',
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12'
  };

  const speedDurations = {
    slow: '4s',
    normal: '3s',
    fast: '1.2s'
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <div 
        className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 via-gray-500 to-gray-700 border-4 border-gray-300 shadow-2xl relative transition-all duration-300 hover:shadow-purple-500/30"
        style={{
          animation: `spin ${speedDurations[speed]} linear infinite`,
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.2), inset 0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.animation = `spin ${speedDurations.fast} linear infinite`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.animation = `spin ${speedDurations[speed]} linear infinite`;
        }}
      >
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{top: '8%', left: '50%', transform: 'translateX(-50%)'}}></div>
        
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{top: '25%', right: '12%'}}></div>
        
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{bottom: '25%', right: '12%'}}></div>
        
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{bottom: '8%', left: '50%', transform: 'translateX(-50%)'}}></div>
        
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{bottom: '25%', left: '12%'}}></div>
        
        <div className={`absolute ${holeSizes[size]} bg-gray-900 rounded-full border border-black`} 
             style={{top: '25%', left: '12%'}}></div>
        
        <div 
          className={`absolute ${centerSizes[size]} bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-2 border-gray-700`}
          style={{
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        ></div>
      </div>
      
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default FilmReelLogo;