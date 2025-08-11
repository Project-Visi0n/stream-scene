import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import AIWeeklyPlanner from './AIWeeklyPlanner';
import ProjectCenter from './ProjectCenter/ProjectCenter';
import SharedFileViewer from './SharedFileViewer';
import Navbar from './NavBar';
import ContentScheduler from '../ContentScheduler/ContentScheduler';

type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';

const BudgetTracker: React.FC = () => (
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

import DemosTrailers from './DemosTrailers';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>('landing');
  const navigate = useNavigate();
  const location = useLocation();

  // Update currentView based on the current route
  useEffect(() => {
    const routeToViewMap: Record<string, CurrentView> = {
      '/': 'landing',
      '/planner': 'planner',
      '/project-center': 'project-center',
      '/budget-tracker': 'budget-tracker',
      '/demos-trailers': 'demos-trailers',
      '/content-scheduler': 'content-scheduler'
    };

    const currentRoute = location.pathname;
    const matchedView = routeToViewMap[currentRoute];
    if (matchedView) {
      setCurrentView(matchedView);
    }
  }, [location.pathname]);

  const handleNavigation = (view: CurrentView) => {
    console.log('🚀 App handleNavigation called with:', view);
    
    // Map views to routes
    const viewToRouteMap: Record<CurrentView, string> = {
      'landing': '/',
      'planner': '/planner',
      'project-center': '/project-center',
      'budget-tracker': '/budget-tracker',
      'demos-trailers': '/demos-trailers',
      'content-scheduler': '/content-scheduler'
    };

    const route = viewToRouteMap[view];
    if (route) {
      console.log('🎯 Navigating to route:', route);
      navigate(route);
      setCurrentView(view);
    }
  };

  const showNavbar = !location.pathname.startsWith('/shared/') && location.pathname !== '/';

  return (
    <div className="min-h-screen">
      {showNavbar && (
        <Navbar
          currentComponent={currentView}
          onNavigate={handleNavigation}
        />
      )}
      <div className={showNavbar ? '' : 'min-h-screen'}>
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={handleNavigation} />} />
          <Route path="/planner" element={<AIWeeklyPlanner />} />
          <Route path="/project-center" element={<ProjectCenter />} />
          <Route path="/budget-tracker" element={<BudgetTracker />} />
          <Route path="/demos-trailers" element={<DemosTrailers />} />
          <Route path="/content-scheduler" element={<ContentScheduler />} />
          <Route path="/shared/:token" element={<SharedFileViewer />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;