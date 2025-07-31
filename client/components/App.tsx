import React from 'react';
import GoogleLoginButton from './GoogleLoginButton';
import StreamSceneLandingPage from './LandingPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <StreamSceneLandingPage />
      <div className="mt-6">
        <GoogleLoginButton />
      </div>
    </div>
  );
};

export default App;
