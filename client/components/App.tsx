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

  const showNavbar = !location.pathname.startsWith('/shared/') && 
                     location.pathname !== '/' && 
                     location.pathname !== '/privacy' && 
                     location.pathname !== '/terms';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <MobileOptimizations />
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
          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;