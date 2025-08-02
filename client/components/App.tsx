import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StreamSceneLandingPage from './LandingPage';
import ProjectCenter from './ProjectCenter/ProjectCenter';
import AIWeeklyPlanner from './AIWeeklyPlanner';

const App: React.FC = () => {
  const location = useLocation();
  
  const pageVariants = {
    initial: {
      x: "100%",
      opacity: 0,
      scale: 0.8
    },
    in: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    out: {
      x: "-100%",
      opacity: 0,
      scale: 1.2
    }
  };
  
  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.6
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <StreamSceneLandingPage />
              </motion.div>
            } 
          />
          <Route 
            path="/project-center" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <ProjectCenter />
              </motion.div>
            } 
          />
          <Route 
            path="/ai-planner" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <AIWeeklyPlanner />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;