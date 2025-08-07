import React from 'react';

// Mock GoogleLoginButton component
const GoogleLoginButton = () => (
  <button className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium">
    Sign in with Google
  </button>
);

// Define the CurrentView type to match App.tsx
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers';

interface LandingPageProps {
  onNavigate?: (destination: CurrentView) => void;
}

// Improved Professional Film Reel Component with Static Text
const AnimatedFilmReel = () => {
  return (
    <div className="inline-block group">
      {/* Professional CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cosmicFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }
          
          @keyframes starTwinkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes reelSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes filmPerforationFlow {
            0% { transform: translateY(-8px); opacity: 0.3; }
            50% { opacity: 1; }
            100% { transform: translateY(8px); opacity: 0.3; }
          }
          
          @keyframes nebulaGlow {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.6)); }
            50% { filter: drop-shadow(0 0 40px rgba(236, 72, 153, 0.8)); }
          }
          
          @keyframes holoShimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
          
          @keyframes filmStripGlow {
            0%, 100% { box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.2); }
            50% { box-shadow: inset 0 0 30px rgba(236, 72, 153, 0.3); }
          }
          
          @keyframes filmEdgeFlow {
            0% { opacity: 0.6; transform: scaleY(0.9); }
            50% { opacity: 1; transform: scaleY(1.1); }
            100% { opacity: 0.6; transform: scaleY(0.9); }
          }
          
          .cosmic-reel {
            animation: cosmicFloat 4s ease-in-out infinite;
            filter: drop-shadow(0 10px 30px rgba(139, 92, 246, 0.3));
          }
          
          .star-field {
            animation: starTwinkle 2s ease-in-out infinite;
          }
          
          .spinning-reel {
            animation: reelSpin 8s linear infinite;
            transform-origin: center;
          }
          
          .film-perforation-flowing {
            animation: filmPerforationFlow 2.5s ease-in-out infinite;
          }
          
          .film-strip-glow {
            animation: filmStripGlow 4s ease-in-out infinite;
          }
          
          .film-edge-flow {
            animation: filmEdgeFlow 3s ease-in-out infinite;
          }
          
          .nebula-glow {
            animation: nebulaGlow 6s ease-in-out infinite;
          }
          
          .holo-surface {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            background-size: 200px 100%;
            animation: holoShimmer 3s ease-in-out infinite;
          }
          
          .cosmic-reel:hover .spinning-reel {
            animation-duration: 2s !important;
          }
          
          .cosmic-reel:hover .film-perforation-flowing {
            animation-duration: 1s !important;
          }
          
          .cosmic-reel:hover {
            transform: scale(1.05);
            filter: drop-shadow(0 15px 40px rgba(139, 92, 246, 0.5));
          }
          
          .static-text {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
            font-weight: 700;
          }
        `
      }} />
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 320 380" 
        width="260" 
        height="320" 
        className="cosmic-reel"
      >
        {/* Professional gradients and filters */}
        <defs>
          {/* Cosmic gradients */}
          <radialGradient id="cosmicCore" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="20%" stopColor="#e2e8f0" />
            <stop offset="60%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>

          <radialGradient id="nebulaGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="30%" stopColor="#312e81" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          <linearGradient id="holographicSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#e2e8f0" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#94a3b8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="filmSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="10%" stopColor="#1e293b" />
            <stop offset="90%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Professional filters */}
          <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="professionalShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(139, 92, 246, 0.25)"/>
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0, 0, 0, 0.3)"/>
          </filter>

          <filter id="insetShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feFlood floodColor="rgba(0,0,0,0.3)"/>
            <feComposite in2="offset-blur" operator="in"/>
            <feComposite in2="SourceGraphic" operator="over"/>
          </filter>

          <filter id="textGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Star field background */}
        <g className="star-field">
          <circle cx="80" cy="40" r="1.5" fill="#e2e8f0" opacity="0.8" />
          <circle cx="240" cy="60" r="1" fill="#f8fafc" opacity="0.6" />
          <circle cx="50" cy="100" r="0.8" fill="#cbd5e1" opacity="0.7" />
          <circle cx="270" cy="120" r="1.2" fill="#e2e8f0" opacity="0.9" />
          <circle cx="30" cy="200" r="1" fill="#f1f5f9" opacity="0.5" />
          <circle cx="290" cy="250" r="0.9" fill="#e2e8f0" opacity="0.8" />
          <circle cx="70" cy="300" r="1.3" fill="#f8fafc" opacity="0.6" />
          <circle cx="250" cy="320" r="1.1" fill="#cbd5e1" opacity="0.7" />
        </g>

        {/* Top Film Reel - Premium Design */}
        <g transform="translate(160, 55)" className="spinning-reel">
          {/* Outer ring with professional finish */}
          <circle cx="0" cy="0" r="38" fill="url(#cosmicCore)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" filter="url(#professionalShadow)" />
          <circle cx="0" cy="0" r="35" fill="url(#holographicSheen)" stroke="none" />
          
          {/* Inner mechanical details */}
          <g stroke="rgba(100, 116, 139, 0.8)" strokeWidth="1.5" opacity="0.9">
            <circle cx="0" cy="0" r="28" fill="none" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="22" fill="none" />
            <line x1="-20" y1="0" x2="20" y2="0" />
            <line x1="0" y1="-20" x2="0" y2="20" />
            <line x1="-14" y1="-14" x2="14" y2="14" />
            <line x1="-14" y1="14" x2="14" y2="-14" />
          </g>
          
          {/* Center hub */}
          <circle cx="0" cy="0" r="12" fill="url(#nebulaGradient)" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" filter="url(#insetShadow)" />
          <circle cx="0" cy="0" r="4" fill="#0f172a" />
          
          {/* Holographic accent */}
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.7" className="holo-surface" />
        </g>

        {/* Bottom Film Reel - Premium Design */}
        <g transform="translate(160, 325)" className="spinning-reel" style={{animationDirection: 'reverse', animationDuration: '6s'}}>
          {/* Outer ring with professional finish */}
          <circle cx="0" cy="0" r="38" fill="url(#cosmicCore)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" filter="url(#professionalShadow)" />
          <circle cx="0" cy="0" r="35" fill="url(#holographicSheen)" stroke="none" />
          
          {/* Inner mechanical details */}
          <g stroke="rgba(100, 116, 139, 0.8)" strokeWidth="1.5" opacity="0.9">
            <circle cx="0" cy="0" r="28" fill="none" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="22" fill="none" />
            <line x1="-20" y1="0" x2="20" y2="0" />
            <line x1="0" y1="-20" x2="0" y2="20" />
            <line x1="-14" y1="-14" x2="14" y2="14" />
            <line x1="-14" y1="14" x2="14" y2="-14" />
          </g>
          
          {/* Center hub */}
          <circle cx="0" cy="0" r="12" fill="url(#nebulaGradient)" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" filter="url(#insetShadow)" />
          <circle cx="0" cy="0" r="4" fill="#0f172a" />
          
          {/* Holographic accent */}
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.7" className="holo-surface" />
        </g>

        {/* Professional Film Strip with animated elements but static text */}
        <g className="nebula-glow">
          {/* Main film body with premium finish */}
          <rect x="50" y="93" width="220" height="194" rx="12" fill="url(#filmSurface)" filter="url(#professionalShadow)" className="film-strip-glow" />
          
          {/* Holographic overlay */}
          <rect x="50" y="93" width="220" height="194" rx="12" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.4" className="holo-surface" />
          
          {/* Professional frame areas */}
          <rect x="75" y="115" width="170" height="65" rx="8" fill="url(#nebulaGradient)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
          <rect x="75" y="200" width="170" height="65" rx="8" fill="url(#nebulaGradient)" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="1" />
          
          {/* Animated perforations - these move but text doesn't */}
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={`perf-set-${i}`}>
              <rect 
                x="55" 
                y={100 + i * 18} 
                width="12" 
                height="8" 
                rx="6"
                fill="rgba(248, 250, 252, 0.9)" 
                stroke="rgba(203, 213, 225, 0.5)"
                strokeWidth="0.5"
                className="film-perforation-flowing"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
              <rect 
                x="253" 
                y={100 + i * 18} 
                width="12" 
                height="8" 
                rx="6"
                fill="rgba(248, 250, 252, 0.9)" 
                stroke="rgba(203, 213, 225, 0.5)"
                strokeWidth="0.5"
                className="film-perforation-flowing"
                style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
              />
            </g>
          ))}
          
          {/* Animated film edges */}
          <rect x="50" y="93" width="2" height="194" rx="1" fill="rgba(248, 250, 252, 0.2)" className="film-edge-flow" />
          <rect x="268" y="93" width="2" height="194" rx="1" fill="rgba(15, 23, 42, 0.6)" className="film-edge-flow" style={{animationDelay: '1s'}} />
          <rect x="50" y="93" width="220" height="2" rx="1" fill="rgba(248, 250, 252, 0.15)" className="film-edge-flow" style={{animationDelay: '0.5s'}} />
          <rect x="50" y="285" width="220" height="2" rx="1" fill="rgba(15, 23, 42, 0.6)" className="film-edge-flow" style={{animationDelay: '1.5s'}} />
          
          {/* STATIC TEXT - No animation classes applied */}
          <g className="static-text">
            {/* Modern typography that stays perfectly still */}
            <text 
              x="160" 
              y="155" 
              fill="url(#textGradient)" 
              fontSize="22" 
              fontWeight="700" 
              textAnchor="middle"
              filter="url(#textGlow)"
            >
              Stream
            </text>
            <text 
              x="160" 
              y="240" 
              fill="url(#textGradient)" 
              fontSize="22" 
              fontWeight="700" 
              textAnchor="middle"
              filter="url(#textGlow)"
            >
              Scene
            </text>
            
            {/* Professional frame markers - also static */}
            <text x="60" y="125" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(-90 60 125)">01</text>
            <text x="260" y="125" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(90 260 125)">01</text>
            <text x="60" y="210" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(-90 60 210)">02</text>
            <text x="260" y="210" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(90 260 210)">02</text>
          </g>
          
          {/* Subtle static accent elements around text */}
          <circle cx="160" cy="175" r="1.5" fill="rgba(139, 92, 246, 0.8)" />
          <circle cx="160" cy="182" r="1" fill="rgba(236, 72, 153, 0.6)" />
          <circle cx="160" cy="188" r="1.2" fill="rgba(139, 92, 246, 0.7)" />
        </g>

        {/* Connecting film strips with subtle animation */}
        <rect x="145" y="93" width="30" height="8" rx="4" fill="rgba(30, 41, 59, 0.8)" className="film-edge-flow" />
        <rect x="145" y="279" width="30" height="8" rx="4" fill="rgba(30, 41, 59, 0.8)" className="film-edge-flow" style={{animationDelay: '2s'}} />
        
        {/* Subtle cosmic aura */}
        <ellipse cx="160" cy="190" rx="110" ry="95" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="1" opacity="0.6" className="nebula-glow" />
      </svg>
    </div>
  );
};

// Define a proper type for features
type Feature = {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly destination: CurrentView;
  readonly available: boolean;
};

// Feature data for better maintainability
const FEATURES: Feature[] = [
  { 
    icon: '📁', 
    title: 'Project Center', 
    desc: 'Organize all your creative projects in one place', 
    destination: 'project-center' as CurrentView,
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
    icon: '▶️', 
    title: 'Demos & Trailers', 
    desc: 'Showcase your best work professionally',
    destination: 'demos-trailers' as CurrentView,
    available: true 
  },
  { 
    icon: '🤖', 
    title: 'AI Weekly Planner', 
    desc: 'Smart task scheduling with AI assistance', 
    destination: 'planner' as CurrentView,
    available: true 
  }
] as const satisfies Feature[];

// Feature Card Component - USING onMouseDown for more reliable clicking
const FeatureCard: React.FC<{
  feature: Feature;
  onNavigate?: (destination: CurrentView) => void;
}> = ({ feature, onNavigate }) => {
  const handleInteraction = () => {
    console.log('🎯 CARD CLICKED:', feature.title);
    alert(`🚀 Clicked: ${feature.title}`);
    if (feature.available && onNavigate) {
      onNavigate(feature.destination);
    }
  };

  return (
    <div 
      className="flex-1 min-w-[280px] max-w-[320px] sm:min-w-[250px] sm:max-w-[300px] group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer select-none"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      style={{ 
        opacity: feature.available ? 1 : 0.75,
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="text-2xl sm:text-3xl mb-3" style={{ pointerEvents: 'none' }}>{feature.icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2" style={{ pointerEvents: 'none' }}>
        {feature.title}
      </h3>
      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed" style={{ pointerEvents: 'none' }}>
        {feature.desc}
      </p>
      <div 
        className={`mt-3 text-xs font-medium transition-colors ${
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
            <AnimatedFilmReel />
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
          {FEATURES.map((feature, index) => (
            <FeatureCard 
              key={`feature-${index}`}
              feature={feature} 
              onNavigate={onNavigate} 
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center px-4">
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Ready to streamline your creative workflow?
          </p>
          <button 
            onClick={() => onNavigate?.('planner')}
            className="group inline-block px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 transform text-sm sm:text-base cursor-pointer"
          >
            <span className="flex items-center justify-center">
              Start with AI Planner
              <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300" role="img" aria-label="robot">🤖</span>
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default StreamSceneLandingPage;