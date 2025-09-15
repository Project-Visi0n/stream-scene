import React, { useState } from 'react';

interface NavbarProps {
  currentComponent: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler';
  onNavigate: (component: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler') => void;
  user?: {
    name: string;
    avatar?: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ currentComponent, onNavigate, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'landing',
      label: '🏠 Home',
      shortLabel: 'Home',
      description: 'Back to homepage'
    },
    {
      id: 'planner',
      label: '🤖 AI Weekly Planner',
      description: 'Smart task scheduling'
    },
    {
      id: 'budget-tracker',
      label: '💰 Budget Tracker',
      description: 'Track expenses'
    },
    {
      id: 'content-scheduler',
      label: '📅 Content Scheduler',
      description: 'Plan your content'
    },
    {
      id: 'project-center',
      label: '🎨 Project Center', 
      description: 'Creative workspace'
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavigate = (component: any) => {
    onNavigate(component);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo/Brand - Mobile Optimized */}
          <div 
            onClick={() => handleMobileNavigate('landing')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group transition-all duration-300 hover:scale-105 touch-manipulation"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-lg sm:text-xl">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                StreamScene
              </h1>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                Creative Workspace
              </p>
            </div>
            {/* Mobile Logo Text */}
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-white">StreamScene</h1>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`relative px-3 py-2 rounded-lg transition-all duration-300 group text-sm touch-manipulation ${
                  currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="font-medium">{item.label}</span>
                </div>
                
                {/* Active indicator */}
                {(currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                )}
                
                {/* Hover tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-gray-800 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    {item.description}
                    {item.id === 'content-scheduler' && (
                      <span className="block text-blue-300 font-medium">Project-based content planning</span>
                    )}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right Side - User & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Profile - Desktop */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-xs">Online</p>
                </div>
              </div>
            )}

            {/* Mobile User Avatar */}
            {user && (
              <div className="sm:hidden w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-white/10">
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigate(item.id)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all duration-300 relative touch-manipulation ${
                    currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg sm:text-xl">{item.label.split(' ')[0]}</span>
                    <span className="font-medium text-xs sm:text-sm">{item.shortLabel}</span>
                  </div>
                  {(currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')) && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-green-400/20 rounded-full animate-bounce"></div>
      </div>
    </nav>
  );
};

export default Navbar;