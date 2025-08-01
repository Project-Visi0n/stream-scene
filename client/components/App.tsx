
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StreamSceneLandingPage from './LandingPage';
import ProjectHub from './ProjectHub/ProjectHub';


const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<StreamSceneLandingPage />} />
        <Route path="/project-hub" element={<ProjectHub />} />
      </Routes>
    </div>
  );
};

export default App;

