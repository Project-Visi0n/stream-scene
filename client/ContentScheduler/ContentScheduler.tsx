// client/ContentScheduler/ContentScheduler.tsx
import React, { useState, useEffect } from 'react';
import { 
  ContentProject, 
  ContentItem, 
  ScheduledPost,
  ProjectCenterFile,
  ProjectCenterDrawing 
} from '../shared/types/contentScheduler';
import contentSchedulerService from '../shared/services/contentSchedulerService';
import { CreateProjectModal, AddContentModal, AssetPickerModal } from './Modals';

const ContentScheduler: React.FC = () => {
  // State management
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ContentProject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'schedule' | 'assets'>('overview');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Modal states
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  
  // Project Center integration
  const [projectCenterFiles, setProjectCenterFiles] = useState<ProjectCenterFile[]>([]);
  const [projectCenterDrawings, setProjectCenterDrawings] = useState<ProjectCenterDrawing[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // For now, use mock data since the API isn't set up yet
      const mockProjects = contentSchedulerService.generateMockProjects();
      const mockFiles = contentSchedulerService.generateMockFiles();
      const mockDrawings = contentSchedulerService.generateMockDrawings();
      
      setProjects(mockProjects);
      setProjectCenterFiles(mockFiles);
      setProjectCenterDrawings(mockDrawings);
      
      if (mockProjects.length > 0) {
        setSelectedProject(mockProjects[0]);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Content Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 pt-20">
          <h1 className="text-4xl font-bold text-white mb-4">🎬 Content Scheduler</h1>
          <p className="text-xl text-gray-300">Coming Soon! Project-based content planning and scheduling.</p>
          
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 What's Coming</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Project-based content organization</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Integration with Project Center assets</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">AI-powered optimal scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Export to AI Weekly Planner</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-yellow-400">⚡</span>
                <span className="text-gray-300">Multi-platform content planning</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-400">🔄</span>
                <span className="text-gray-300">Smart content recommendations</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 This feature will help you organize content by projects, link assets from Project Center, 
                generate optimal posting schedules, and export everything as tasks to your AI Weekly Planner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentScheduler;