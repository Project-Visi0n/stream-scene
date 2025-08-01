import React from 'react';
import { Link } from 'react-router-dom';

const StreamSceneLandingPage: React.FC = () => {
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
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">S</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </div>

          {/* Google Login in Corner */}
          <button className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-300 text-sm">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Login</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 sm:px-0">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-16">
          {/* Logo Placeholder */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-block p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-sm shadow-2xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
                    S
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    LOGO
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl px-4 mx-auto mb-8 font-light leading-relaxed">
            Your complete creative production platform for streamlined workflows
          </p>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-6xl px-4 mb-8 sm:mb-12">
          {[
            { icon: '📁', title: 'Project Hub', desc: 'Organize all your creative projects in one place', link: '/project-hub' },
            { icon: '💰', title: 'Budget Tracker', desc: 'Keep your finances on track with smart tools' },
            { icon: '▶️', title: 'Demos & Trailers', desc: 'Showcase your best work professionally' },
            { icon: '📅', title: 'AI Weekly Planner', desc: 'Smart scheduling with AI assistance' }
          ].map((feature, index) => (
            feature.link ? (
              <Link
                key={index}
                to={feature.link}
                className="flex-1 min-w-[280px] max-w-[320px] sm:min-w-[250px] sm:max-w-[300px] group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-2xl sm:text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </Link>
            ) : (
              <div key={index} className="flex-1 min-w-[280px] max-w-[320px] sm:min-w-[250px] sm:max-w-[300px] group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <div className="text-2xl sm:text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </div>
            )
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center px-4">
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Ready to streamline your creative workflow?
          </p>
          <button className="group px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 transform text-sm sm:text-base">
            <span className="flex items-center justify-center">
              Explore Features
              <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default StreamSceneLandingPage;