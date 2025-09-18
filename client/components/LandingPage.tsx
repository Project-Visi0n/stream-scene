import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
import FilmReelLogo from './FilmReelLogo';
import useAuth from '../hooks/useAuth';

// Define the CurrentView type to match App.tsx
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler';

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
      <div className="text-2xl sm:text-3xl mb-3 flex justify-center" style={{ pointerEvents: 'none' }}>{feature.icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2 text-center" style={{ pointerEvents: 'none' }}>
        {feature.title}
      </h3>
      <p className="text-gray-400 text-sm sm:text-sm leading-relaxed text-center" style={{ pointerEvents: 'none' }}>
        {feature.desc}
      </p>
      <div 
        className={`mt-3 text-xs font-medium transition-colors text-center ${
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
      
      {/* Random Blinking Lights - Scattered All Over Page */}
      {/* Top area lights - enhanced top-middle section */}
      <div className="absolute top-12 left-16 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0s', animationDuration: '0.8s'}}></div>
      <div className="absolute top-20 right-32 w-6 h-6 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.3s', animationDuration: '2.5s'}}></div>
      <div className="absolute top-28 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1.2s', animationDuration: '1.1s'}}></div>
      <div className="absolute top-36 right-1/3 w-5 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.7s', animationDuration: '1.9s'}}></div>
      <div className="absolute top-44 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.8s', animationDuration: '0.9s'}}></div>
      <div className="absolute top-52 right-12 w-4 h-4 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s', animationDuration: '2.1s'}}></div>
      <div className="absolute top-60 left-2/3 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '1.5s', animationDuration: '1.3s'}}></div>
      <div className="absolute top-68 right-1/4 w-5 h-5 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '2.3s', animationDuration: '0.7s'}}></div>
      
      {/* Additional top-middle area lights */}
      <div className="absolute top-16 left-2/5 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.8s', animationDuration: '1.4s'}}></div>
      <div className="absolute top-24 right-2/5 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '1.7s', animationDuration: '0.9s'}}></div>
      <div className="absolute top-32 left-1/3 w-4 h-4 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.5s', animationDuration: '2.2s'}}></div>
      <div className="absolute top-40 right-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '2.0s', animationDuration: '1.0s'}}></div>
      <div className="absolute top-48 left-3/5 w-5 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '1.3s', animationDuration: '1.6s'}}></div>
      <div className="absolute top-56 right-3/5 w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.2s', animationDuration: '2.4s'}}></div>
      
      {/* Lights in navbar space (top 40px area) - reduced to 8 */}
      <div className="absolute top-4 left-1/5 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.9s', animationDuration: '1.8s'}}></div>
      <div className="absolute top-8 right-1/5 w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '2.1s', animationDuration: '0.7s'}}></div>
      <div className="absolute top-6 left-1/2 w-4 h-4 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1.4s', animationDuration: '2.3s'}}></div>
      <div className="absolute top-14 right-1/6 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.6s', animationDuration: '1.5s'}}></div>
      <div className="absolute top-18 left-1/6 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '2.8s', animationDuration: '0.9s'}}></div>
      <div className="absolute top-10 right-2/3 w-5 h-5 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.1s', animationDuration: '1.7s'}}></div>
      <div className="absolute top-22 left-2/3 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s', animationDuration: '2.0s'}}></div>
      <div className="absolute top-26 left-1/4 w-4 h-4 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.8s', animationDuration: '2.6s'}}></div>
      
      {/* Middle area lights */}
      <div className="absolute top-1/3 left-8 w-4 h-4 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.9s', animationDuration: '1.7s'}}></div>
      <div className="absolute top-1/3 right-16 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1.1s', animationDuration: '0.6s'}}></div>
      <div className="absolute top-2/5 right-1/3 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1.6s', animationDuration: '1.4s'}}></div>
      <div className="absolute top-1/2 left-1/4 w-5 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '2.1s', animationDuration: '0.8s'}}></div>
      <div className="absolute top-1/2 right-8 w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.6s', animationDuration: '1.8s'}}></div>
      <div className="absolute top-3/5 left-2/3 w-4 h-4 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1.4s', animationDuration: '1.2s'}}></div>
      <div className="absolute top-3/5 right-1/2 w-3 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '2.7s', animationDuration: '0.9s'}}></div>
      <div className="absolute top-2/3 left-12 w-6 h-6 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.8s', animationDuration: '2.0s'}}></div>
      <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1.9s', animationDuration: '1.5s'}}></div>
      
      {/* Bottom area lights */}
      <div className="absolute bottom-60 left-20 w-5 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '1.3s', animationDuration: '0.7s'}}></div>
      <div className="absolute bottom-52 right-28 w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.5s', animationDuration: '1.6s'}}></div>
      <div className="absolute bottom-44 left-1/3 w-4 h-4 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '2.2s', animationDuration: '1.0s'}}></div>
      <div className="absolute bottom-36 right-1/2 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.1s', animationDuration: '2.4s'}}></div>
      <div className="absolute bottom-28 left-2/3 w-6 h-6 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.7s', animationDuration: '0.8s'}}></div>
      <div className="absolute bottom-20 right-16 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '2.5s', animationDuration: '1.3s'}}></div>
      <div className="absolute bottom-12 left-1/4 w-5 h-5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s', animationDuration: '1.9s'}}></div>
      
      {/* Center area lights */}
      <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1.0s', animationDuration: '0.6s'}}></div>
      <div className="absolute top-3/4 right-1/6 w-4 h-4 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '2.6s', animationDuration: '1.4s'}}></div>
      <div className="absolute top-1/4 right-1/6 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s', animationDuration: '2.1s'}}></div>
      
      {/* Extra scattered lights */}
      <div className="absolute top-1/5 left-5/6 w-4 h-4 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '2.0s', animationDuration: '1.1s'}}></div>
      <div className="absolute top-4/5 right-5/6 w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.9s', animationDuration: '1.8s'}}></div>
      <div className="absolute top-2/5 left-1/12 w-5 h-5 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1.6s', animationDuration: '0.9s'}}></div>
      <div className="absolute top-3/5 right-1/12 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '2.4s', animationDuration: '1.5s'}}></div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 sm:px-0 pt-24 sm:pt-32">
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

        {/* Feature Cards - Mobile-Optimized Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full max-w-6xl px-4 mb-8 sm:mb-12">
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
        <footer className="mt-8 pt-6 w-full max-w-6xl px-4">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-3">
              <button
                onClick={() => navigate('/privacy')}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-gray-500 text-sm">•</span>
              <button
                onClick={() => navigate('/terms')}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200 cursor-pointer"
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