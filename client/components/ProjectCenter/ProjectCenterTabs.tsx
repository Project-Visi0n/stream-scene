import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FileUpload from './FileUpload';
import CollaborativeCanvas from '../CollaborativeCanvas';

// Custom SVG Icon Components (matching your navbar and landing page)
const ProjectIcon = () => (
  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ProjectCenterTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('canvas');

  const handleCollaboratorChange = (collaboratorId: string, action: string) => {
    // Handle collaborator changes in the main canvas

  };

  const tabs: Tab[] = [
    {
      id: 'canvas',
      label: 'Canvas',
      icon: <ProjectIcon />,
      component: (
        <CollaborativeCanvas 
          canvasId="project-center-main" 
          isOwner={true}
          allowAnonymousEdit={true}
          onCollaboratorChange={handleCollaboratorChange}
        />
      )
    },
    {
      id: 'files',
      label: 'Files',
      icon: <FolderIcon />,
      component: <FileUpload />
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Tab Navigation */}
      <div className="mb-8 w-full flex justify-center">
        <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-purple-500/20">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px] w-full flex justify-center"
      >
        {activeTabData?.component}
      </motion.div>
    </div>
  );
};

export default ProjectCenterTabs;