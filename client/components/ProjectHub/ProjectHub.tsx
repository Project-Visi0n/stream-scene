
import React, { useState } from "react";
import ProjectHubTabs from "./ProjectHubTabs";


const ProjectHub: React.FC = () => {

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

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Project Hub
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-8 text-center max-w-2xl">
          Sketch your ideas, upload files, and manage your creative projects
        </p>
        <ProjectHubTabs />
      </div>
    </div>
  );
};

export default ProjectHub;
