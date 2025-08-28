import React from 'react';
import { motion } from 'framer-motion';
import FilmReelLogo from './FilmReelLogo';

interface InlineLoadingProps {
  size?: 'xs' | 'sm' | 'md';
  speed?: 'slow' | 'normal' | 'fast';
  text?: string;
  className?: string;
}

const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  speed = 'fast',
  text,
  className = ''
}) => {
  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <FilmReelLogo 
        size={size}
        speed={speed}
        loading={true}
        showText={false}
      />
      
      {text && (
        <motion.span 
          className="text-sm text-gray-400"
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.span>
      )}
    </motion.div>
  );
};

export default InlineLoading;
