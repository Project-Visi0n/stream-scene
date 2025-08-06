import React from 'react';

interface NavbarProps {
  currentComponent: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';
  onNavigate: (component: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler') => void;
  user?: {
    name: string;
    avatar?: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ currentComponent, onNavigate, user }) => {
  const navigationItems = [
    {
      id: 'landing',
      label: '🏠 Home',
      description: 'Back to homepage'
    },
    {
      id: 'project-center',
      label: '🎨 Project Center', 
      description: 'Creative workspace'
    },
    {
      id: 'content-scheduler',
      label: '📅 Content Scheduler',
      description: 'Plan your content'
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
      id: 'demos-trailers',
      label: '🎬 Demos & Trailers',
      description: 'Showcase content'
    }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <span className="text-xl">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                StreamScene
              </h1>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                Creative Workspace
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`relative px-3 py-2 rounded-lg transition-all duration-300 group text-sm ${
                  currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="font-medium">{item.label}</span>
                  {/* Add a subtle indicator for the new Content Scheduler */}
                  {item.id === 'content-scheduler' && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full animate-pulse">
                      New
                    </span>
                  )}
                </div>
                
                {/* Active indicator */}
                {(currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                )}
                
                {/* Hover tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
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

          {/* User Profile */}
          <div className="flex items-center gap-4">
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

            {/* Mobile menu button */}
            <button className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`flex flex-col items-center p-3 rounded-lg transition-all duration-300 relative ${
                  currentComponent === item.id || (item.id === 'landing' && currentComponent === 'landing')
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  {/* Mobile "New" indicator */}
                  {item.id === 'content-scheduler' && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1">{item.description}</span>
              </button>
            ))}
          </div>
        </div>
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