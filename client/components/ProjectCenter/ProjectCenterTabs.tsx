import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FileUpload from './FileUpload';
import ProjectCenterCanvas from './ProjectCenterCanvas';

interface Tab {
  id: string;
  label: string;
  icon: string;
  component: React.ReactNode;
}

const ProjectCenterTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('canvas');

  const tabs: Tab[] = [
    {
      id: 'canvas',
      label: 'Canvas',
      icon: '🎨',
      component: <ProjectCenterCanvas />
    },
    {
      id: 'files',
      label: 'Files',
      icon: '📁',
      component: <FileUpload />
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: '📝',
      component: <div className="text-center text-gray-400 py-12">Notes feature coming soon...</div>
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: '✅',
      component: <div className="text-center text-gray-400 py-12">Task management coming soon...</div>
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-8">
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
              <span className="text-lg">{tab.icon}</span>
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
        className="min-h-[400px]"
      >
        {activeTabData?.component}
      </motion.div>
    </div>
  );
};

export default ProjectCenterTabs;
