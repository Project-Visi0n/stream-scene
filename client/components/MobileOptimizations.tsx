import React, { useEffect } from 'react';

/**
 * Mobile Optimizations Component
 * Handles mobile-specific performance and UX improvements
 */
const MobileOptimizations: React.FC = () => {
  useEffect(() => {
    // Prevent zoom on input focus (iOS Safari)
    const addInputZoomPrevention = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const element = input as HTMLElement;
        if (!element.style.fontSize || element.style.fontSize === '') {
          element.style.fontSize = '16px';
        }
      });
    };

    // Fix viewport height on mobile browsers (100vh bug)
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setViewportHeight();
        addInputZoomPrevention();
      }, 150);
    };

    // Add touch feedback for better mobile interaction
    const addTouchFeedback = () => {
      const interactiveElements = document.querySelectorAll(
        'button, [role="button"], .cursor-pointer, .touch-manipulation'
      );
      
      interactiveElements.forEach((element) => {
        element.addEventListener('touchstart', () => {
          element.classList.add('opacity-80');
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
          element.classList.remove('opacity-80');
        }, { passive: true });
        
        element.addEventListener('touchcancel', () => {
          element.classList.remove('opacity-80');
        }, { passive: true });
      });
    };

    // Optimize scroll performance
    const optimizeScrolling = () => {
      // Add smooth scrolling behavior
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Add scroll optimization to modal containers
      const scrollContainers = document.querySelectorAll('.mobile-scroll, .overflow-y-auto');
      scrollContainers.forEach((container) => {
        const element = container as HTMLElement;
        (element.style as any).webkitOverflowScrolling = 'touch';
        element.style.overscrollBehavior = 'contain';
      });
    };

    // Initialize all optimizations
    const initMobileOptimizations = () => {
      setViewportHeight();
      addInputZoomPrevention();
      addTouchFeedback();
      optimizeScrolling();
    };

    // Run on mount
    initMobileOptimizations();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Performance monitoring for mobile
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Reduce animations on slow connections
      if (connection && connection.effectiveType && 
          (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        document.documentElement.classList.add('reduce-motion');
      }
    }

    // Detect if device prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  }, []);

  return null; // This component doesn't render anything visible
};

export default MobileOptimizations;
