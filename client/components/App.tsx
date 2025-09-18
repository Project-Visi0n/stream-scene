import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import AIWeeklyPlanner from './AIWeeklyPlanner';
import ProjectCenter from './ProjectCenter/ProjectCenter';
import SharedFileViewer from './SharedFileViewer';
import Navbar from './NavBar';
import ContentScheduler from '../ContentScheduler/ContentScheduler';
import DemosTrailers from './DemosTrailers';
import BudgetTracker from './BudgetTracker';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import MobileOptimizations from './MobileOptimizations';

export type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CurrentView>('landing');

  // Routes that should show the navbar (exclude landing page if you want different styling)
  const shouldShowNavbar = location.pathname !== '/';

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
      navigate(route);
      setCurrentView(view);
    }
  };

  return (
    <div className="min-h-screen">
      <MobileOptimizations />
      
      {/* Conditionally render Navbar */}
      {shouldShowNavbar && (
        <Navbar currentView={currentView} onNavigate={handleNavigation} />
      )}
      
      <div className="min-h-screen">
        <Routes>
          {/* Landing Page */}
          <Route 
            path="/" 
            element={<LandingPage onNavigate={handleNavigation} />} 
          />
          
          {/* Main App Routes */}
          <Route 
            path="/planner" 
            element={<AIWeeklyPlanner onNavigate={handleNavigation} />} 
          />
          <Route 
            path="/project-center" 
            element={<ProjectCenter onNavigate={handleNavigation} />} 
          />
          <Route 
            path="/budget-tracker" 
            element={<BudgetTracker onNavigate={handleNavigation} />} 
          />
          <Route 
            path="/demos-trailers" 
            element={<DemosTrailers onNavigate={handleNavigation} />} 
          />
          <Route 
            path="/content-scheduler" 
            element={<ContentScheduler onNavigate={handleNavigation} />} 
          />
          
          {/* Utility Pages */}
          <Route 
            path="/shared/:fileId" 
            element={<SharedFileViewer />} 
          />
          <Route 
            path="/privacy" 
            element={<PrivacyPolicyPage />} 
          />
          <Route 
            path="/terms" 
            element={<TermsOfServicePage />} 
          />
          
          {/* 404 Fallback */}
          <Route 
            path="*" 
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="mb-4">Page not found</p>
                  <button 
                    onClick={() => handleNavigation('landing')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;