
import React, { useState } from 'react';

interface TaskbarProps {
  className?: string;
}

const Taskbar: React.FC<TaskbarProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('project-hub');

  const navigationItems = [
    {
      id: 'project-hub',
      label: 'Project Hub',
      icon: '📁',
      href: '#project-hub'
    },
    {
      id: 'budget-tracker',
      label: 'Budget Tracker',
      icon: '💰',
      href: '#budget-tracker'
    },
    {
      id: 'demos-trailers',
      label: 'Demos & Trailers',
      icon: '▶️',
      href: '#demos-trailers'
    },
    {
      id: 'ai-planner',
      label: 'AI Weekly Planner',
      icon: '📅',
      href: '#ai-planner'
    }
  ];

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const isActive = activeItem === item.id;
                
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }}
                    className={`group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 shadow-lg shadow-purple-500/25'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-purple-200'
                    }`}
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-purple-300 hover:bg-purple-600/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
            >
              {isMobileMenuOpen ? (
                <span className="block text-xl">✕</span>
              ) : (
                <span className="block text-xl">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800/50 backdrop-blur-sm border-t border-purple-500/20">
            {navigationItems.map((item) => {
              const isActive = activeItem === item.id;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(item.id);
                  }}
                  className={`group flex items-center px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300'
                      : 'text-gray-300 hover:bg-purple-600/10 hover:text-purple-200'
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};