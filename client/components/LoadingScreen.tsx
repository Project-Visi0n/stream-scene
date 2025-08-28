import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speed?: 'slow' | 'normal' | 'fast';
  overlay?: boolean;
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  size = 'lg',
  speed = 'normal',
  overlay = false,
  className = ''
}) => {
  const baseClasses = overlay 
    ? "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    : "flex items-center justify-center min-h-screen";

  return (
    <motion.div 
      className={`${baseClasses} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5,
          ease: "easeOut"
        }}
      >
        {/* Glassmorphic Loading Bar */}
        <div className="w-full max-w-xs mx-auto mb-6">
          <div className="relative h-6 rounded-xl overflow-hidden shadow-lg border border-purple-700/40 bg-gradient-to-br from-purple-900/60 via-purple-800/80 to-purple-950/80 backdrop-blur-md">
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0"
              initial={{ x: -120 }}
              animate={{ x: [0, 220] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
            >
              <div className="w-1/2 h-full bg-gradient-to-r from-purple-700/60 via-purple-400/30 to-transparent blur-md opacity-60" />
            </motion.div>
            {/* Progress bar base */}
            <div className="absolute inset-0 h-full rounded-xl bg-gradient-to-r from-purple-800/80 via-purple-900/80 to-purple-950/90 opacity-80" />
          </div>
        </div>
        {message && (
          <motion.p 
            className="text-lg text-purple-200 mt-6 drop-shadow"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
