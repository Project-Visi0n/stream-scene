import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import FilmReelLogo from './FilmReelLogo';
import useAuth from '../hooks/useAuth';

// Define the CurrentView type to match App.tsx
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';

interface LandingPageProps {
  onNavigate?: (destination: CurrentView) => void;
}


// Define a proper type for features
type Feature = {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly destination: CurrentView;
  readonly available: boolean;
};

// Features cards, put into alphabetical order for the users
const FEATURES: Feature[] = [
  { 
    icon: '🤖', 
    title: 'AI Weekly Planner', 
    desc: 'Smart task scheduling with AI assistance', 
    destination: 'planner' as CurrentView,
    available: true 
  },
  { 
    icon: '💰', 
    title: 'Budget Tracker', 
    desc: 'Keep your finances on track with smart tools',
    destination: 'budget-tracker' as CurrentView,
    available: true 
  },
  { 
    icon: '📅', 
    title: 'Content Scheduler', 
    desc: 'Plan and schedule your content across platforms',
    destination: 'content-scheduler' as CurrentView,
    available: true 
  },
  { 
    icon: '▶️', 
    title: 'Demos & Trailers', 
    desc: 'Showcase your best work professionally',
    destination: 'demos-trailers' as CurrentView,
    available: true 
  },
  { 
    icon: '📁', 
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
          <div className="text-4xl mb-4">🔒</div>
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

    console.log('🎯 NAVIGATING TO:', feature.destination);
    
    // Use React Router navigation
    const routeMap: Record<CurrentView, string> = {
      'landing': '/',
      'planner': '/planner',
      'project-center': '/project-center',
      'budget-tracker': '/budget-tracker',
      'demos-trailers': '/demos-trailers',
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
      className="group p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer select-none"
      onClick={handleClick}
      style={{ 
        opacity: feature.available ? 1 : 0.75,
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="text-xl sm:text-2xl mb-2" style={{ pointerEvents: 'none' }}>{feature.icon}</div>
      <h3 className="text-sm sm:text-base font-semibold text-purple-300 mb-2" style={{ pointerEvents: 'none' }}>
        {feature.title}
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed" style={{ pointerEvents: 'none' }}>
        {feature.desc}
      </p>
      <div 
        className={`mt-2 text-xs font-medium transition-colors ${
          feature.available 
            ? 'text-purple-400 group-hover:text-purple-300' 
            : 'text-gray-500'
        }`}
        style={{ pointerEvents: 'none' }}
      >
        {feature.available ? 'Click to explore →' : 'Coming soon...'}
      </div>
    </div>
  );
};

const StreamSceneLandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
        <div className="flex justify-between items-center">
          {/* Rocket Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer hover:scale-110 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <span className="text-xl" role="img" aria-label="rocket">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </div>

          {/* Google Login in Right Upper Corner */}
          <GoogleLoginButton />
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

          {/* Login Instructions */}
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl px-4 mx-auto mb-8">
            Sign in with Google to get started
          </p>
        </div>

        {/* Feature Cards - Responsive Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full max-w-6xl px-4 mb-8 sm:mb-12">
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