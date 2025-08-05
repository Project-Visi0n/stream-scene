import React, { useState } from 'react';
import LandingPage from './LandingPage';
import AIWeeklyPlanner from './AIWeeklyPlanner';
import ProjectCenter from './ProjectCenter/ProjectCenter';
import Navbar from './NavBar';

type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('landing');

  const handleNavigation = (view: CurrentView) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
  switch (currentView) {
    case 'landing':
      return <LandingPage onNavigate={handleNavigation} />;
    case 'planner':
      return <AIWeeklyPlanner />;
    case 'project-center':
      return <ProjectCenter />;
    case 'budget-tracker':
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">💰 Budget Tracker</h1>
              <p className="text-xl text-gray-300 mb-8">Coming Soon!</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <p className="text-gray-300">Track your project expenses and revenue streams.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'demos-trailers':
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
          <div className="max-w-4xl mx-auto pt-20">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">🎬 Demos & Trailers</h1>
              <p className="text-xl text-gray-300 mb-8">Coming Soon!</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <p className="text-gray-300">Create and showcase your project demos and trailers.</p>
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return <LandingPage onNavigate={handleNavigation} />
  }
};

  const showNavbar = currentView !== 'landing';

  return (
    <div className="min-h-screen">
      {showNavbar && (
        <Navbar
          currentComponent={currentView}
          onNavigate={handleNavigation}
        />
      )}
      <div className={showNavbar ? '' : 'min-h-screen'}>
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default App;