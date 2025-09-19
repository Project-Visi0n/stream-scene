import React, { useState } from 'react';
import { 
  HiHome,
  HiBars3,
  HiXMark
} from 'react-icons/hi2';

interface NavbarProps {
  currentComponent: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler';
  onNavigate: (component: 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'content-scheduler') => void;
  user?: {
    name: string;
    avatar?: string;
  };
}

// Custom SVG Icon Components (matching your landing page with colors)
const AIIcon = () => (
  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const BudgetIcon = () => (
  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

const SchedulerIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

const ProjectIcon = () => (
  <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
  </svg>
);

const Navbar: React.FC<NavbarProps> = ({ currentComponent, onNavigate, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'landing',
      label: 'Home',
      shortLabel: 'Home',
      description: 'Back to homepage',
      icon: HiHome
    },
    {
      id: 'planner',
      label: 'AI Weekly Planner',
      shortLabel: 'Planner',
      description: 'Smart task scheduling',
      icon: AIIcon
    },
    {
      id: 'budget-tracker',
      label: 'Budget Tracker',
      shortLabel: 'Budget',
      description: 'Track expenses',
      icon: BudgetIcon
    },
    {
      id: 'content-scheduler',
      label: 'Content Scheduler',
      shortLabel: 'Content',
      description: 'Plan your content',
      icon: SchedulerIcon
    },
    {
      id: 'project-center',
      label: 'Project Center',
      shortLabel: 'Projects', 
      description: 'Creative workspace',
      icon: ProjectIcon
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
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="7" cy="7" r="1.5"/>
                  <circle cx="17" cy="7" r="1.5"/>
                  <circle cx="7" cy="17" r="1.5"/>
                  <circle cx="17" cy="17" r="1.5"/>
                  <circle cx="12" cy="6" r="1"/>
                  <circle cx="18" cy="12" r="1"/>
                  <circle cx="12" cy="18" r="1"/>
                  <circle cx="6" cy="12" r="1"/>
                </svg>
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
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
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
              {isMobileMenuOpen ? (
                <HiXMark className="w-6 h-6" />
              ) : (
                <HiBars3 className="w-6 h-6" />
              )}
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
                    <item.icon className="w-6 h-6" />
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