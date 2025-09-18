import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilmReelLogo from './FilmReelLogo';
import useAuth from '../hooks/useAuth';

// Define the CurrentView type to match App.tsx
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler';

interface LandingPageProps {
  onNavigate?: (destination: CurrentView) => void;
}


// Define a proper interface for features
interface Feature {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly desc: string;
  readonly destination: CurrentView;
  readonly available: boolean;
}

// SVG Icon Components
const AIIcon = () => (
  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const BudgetIcon = () => (
  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

const SchedulerIcon = () => (
  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

const ProjectIcon = () => (
  <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
  </svg>
);

// Features cards, put into alphabetical order for the users
const FEATURES: Feature[] = [
  { 
    icon: <AIIcon />, 
    title: 'AI Weekly Planner', 
    desc: 'Smart task scheduling with AI assistance', 
    destination: 'planner' as CurrentView,
    available: true 
  },
  { 
    icon: <BudgetIcon />, 
    title: 'Budget Tracker', 
    desc: 'Keep your finances on track with smart tools',
    destination: 'budget-tracker' as CurrentView,
    available: true 
  },
  { 
    icon: <SchedulerIcon />, 
    title: 'Content Scheduler', 
    desc: 'Plan and schedule your content across platforms',
    destination: 'content-scheduler' as CurrentView,
    available: true 
  },
  { 
    icon: <ProjectIcon />, 
    title: 'Project Center', 
    desc: 'Organize all your creative projects in one place', 
    destination: 'project-center' as CurrentView,
    available: true 
  }
] as const satisfies Feature[];

// Login Prompt Popup Component
const LoginPromptPopup: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl shadow-purple-500/20">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-purple-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Please sign in with Google to access StreamScene features and start managing your creative projects.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component - Using React Router navigation
const FeatureCard: React.FC<{
  feature: Feature;
  onNavigate?: (destination: CurrentView) => void;
  isAuthenticated: boolean;
  onShowLoginPrompt: () => void;
}> = ({ feature, onNavigate, isAuthenticated, onShowLoginPrompt }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      onShowLoginPrompt();
      return;
    }
    
    // Use React Router navigation
    const routeMap: Record<CurrentView, string> = {
      'landing': '/',
      'planner': '/planner',
      'project-center': '/project-center',
      'budget-tracker': '/budget-tracker',
      'content-scheduler': '/content-scheduler'
    };

    const route = routeMap[feature.destination];
    if (route) {
      navigate(route);
    }

    // Also call the prop function for state management
    if (onNavigate) {
      onNavigate(feature.destination);
    }
  };

  return (
    <div 
      className="group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer select-none touch-manipulation mobile-tap-target"
      onClick={handleClick}
      style={{ 
        opacity: feature.available ? 1 : 0.75,
        WebkitTapHighlightColor: 'rgba(139, 92, 246, 0.1)',
        minHeight: '120px'
      }}
    >
      <div className="flex justify-center mb-3" style={{ pointerEvents: 'none' }}>
        {feature.icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2 text-center" style={{ pointerEvents: 'none' }}>
        {feature.title}
      </h3>
      <p className="text-gray-400 text-sm sm:text-sm leading-relaxed text-center" style={{ pointerEvents: 'none' }}>
        {feature.desc}
      </p>
    </div>
  );
};

const StreamSceneLandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, checkAuthStatus } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Refresh auth status when component mounts (catches OAuth returns)
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleShowLoginPrompt = () => {
    setShowLoginPrompt(true);
  };

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>
      <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/50 rounded-full animate-pulse"></div>

      {/* Simple Navbar */}
      <nav className="relative z-20 p-4 sm:p-6">
        <div className="flex justify-start items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer hover:scale-110 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 sm:px-0">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-16">
          <div className="mb-6 sm:mb-8">
            <FilmReelLogo />
          </div>

          {/* Brand Name */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl px-4 mx-auto mb-4 font-light leading-relaxed">
            The ultimate project management tool for creative professionals and teams
          </p>

          {/* Conditional Content - Login Instructions or User Greeting */}
          {!user ? (
            <div className="flex flex-col items-center space-y-6 mb-8">
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl px-4 mx-auto">
                Sign in with Google to get started
              </p>
              {/* Large Google Login Button */}
              <button
                onClick={() => {
                  const loginUrl = `${window.location.origin}/auth/google`;
                  
                  window.location.href = loginUrl;
                }}
                className="flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-300 text-lg"
                type="button"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign In with Google
              </button>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-lg sm:text-xl text-purple-300 font-medium">
                Welcome back, {user.firstName}!
              </p>
              <p className="text-sm sm:text-base text-gray-400 mt-2">
                Ready to manage your creative projects?
              </p>
            </div>
          )}
        </div>

        {/* Feature Cards - Evenly Spaced Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl px-4 mb-8 sm:mb-12">
          {FEATURES.map((feature, index) => (
            <FeatureCard 
              key={`feature-${index}`}
              feature={feature} 
              onNavigate={onNavigate}
              isAuthenticated={!!user}
              onShowLoginPrompt={handleShowLoginPrompt}
            />
          ))}
        </div>

         {/* Footer Section with Legal Links */}
        <footer className="mt-12 pt-8 border-t border-purple-500/20 w-full max-w-6xl px-4">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-6 mb-4 flex-wrap gap-y-2">
              <button
                onClick={() => navigate('/privacy')}
                className="text-gray-400 hover:text-purple-400 text-sm transition-colors duration-200 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-gray-600 text-sm">•</span>
              <button
                onClick={() => navigate('/terms')}
                className="text-gray-400 hover:text-purple-400 text-sm transition-colors duration-200 cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} StreamScene. All rights reserved.
            </p>
          </div>
        </footer>

        {/* Login Prompt Popup */}
        <LoginPromptPopup 
          isVisible={showLoginPrompt} 
          onClose={handleCloseLoginPrompt} 
        />

      </main>
    </div>
  );
};

export default StreamSceneLandingPage;