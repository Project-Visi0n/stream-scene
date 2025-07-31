import React from 'react';
import Taskbar from './Taskbar';

const StreamSceneLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Taskbar */}
      <Taskbar />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
          {/* Auth Section */}
          <div className="w-full max-w-md mb-8">
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-center text-gray-200 mb-4">
                Welcome to StreamScene
              </h2>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-300">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  Secure authentication powered by Google
                </p>
              </div>
            </div>
          </div>

          {/* Logo Placeholder */}
          <div className="mb-8 text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-sm shadow-2xl">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                <div className="text-center">
                  <div className="text-6xl sm:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    S
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-medium">
                    LOGO HERE
                  </div>
                </div>
              </div>
            </div>
          </div>
          
                    {/* Brand Name */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 text-center max-w-4xl mb-12 font-light leading-relaxed">
            Your complete creative production platform
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
            {[
              { icon: '📁', title: 'Project Hub', desc: 'Organize all your creative projects' },
              { icon: '💰', title: 'Budget Tracker', desc: 'Keep your finances on track' },
              { icon: '▶️', title: 'Demos & Trailers', desc: 'Showcase your best work' },
              { icon: '📅', title: 'AI Weekly Planner', desc: 'Smart scheduling assistance' }
            ].map((feature, index) => (
              <div key={index} className="group p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Ready to streamline your creative workflow?
            </p>
            <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 transform">
              <span className="flex items-center">
                Explore Features
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </button>
          </div>
        </div>
        
        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/50 rounded-full animate-pulse"></div>
      </main>
    </div>
  );
};

export default StreamSceneLandingPage;