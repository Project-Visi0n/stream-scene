// client/ContentScheduler/ContentScheduler.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTag } from 'react-icons/fa';
import TagInput from '../components/TagInput';

// Custom SVG Icon Components
const SchedulerIcon = () => (
  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ConnectionIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
  </svg>
);

const MessageIcon = () => (
  <svg className="inline-block w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const AttachmentIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const PostIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
  </svg>
);

const TestIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ThreadsIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
  </svg>
);

const BulbIcon = () => (
  <svg className="w-4 h-4 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
  </svg>
);

const RemoveIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Types
type ProjectFile = {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
};

type ScheduledPost = {
  id: string;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  files: ProjectFile[];
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
};

interface ContentSchedulerProps {
  onSchedulePost?: (post: ScheduledPost) => void;
  onAddToCalendar?: (event: CalendarEvent) => void;
}

const ContentScheduler: React.FC<ContentSchedulerProps> = ({
  onSchedulePost,
  onAddToCalendar
}) => {
  // State management
  const [postContent, setPostContent] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<ProjectFile[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);

  // Platform state (Threads only)
  const [threadsConnected, setThreadsConnected] = useState(false);
  const [threadsAccountId, setThreadsAccountId] = useState<string | undefined>();

  // Project files state
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Character limit for Threads
  const charLimit = 500;

  // Load project files and check auth status on mount
  useEffect(() => {
    loadProjectFiles();
    checkThreadsAuth();
  }, []);

  const loadProjectFiles = async () => {
    setLoadingFiles(true);
    try {
      // Mock project files data
      const mockFiles: ProjectFile[] = [
        { id: '1', name: 'brand-logo.png', type: 'image/png', size: 245000 },
        { id: '2', name: 'product-demo.mp4', type: 'video/mp4', size: 5200000 },
        { id: '3', name: 'infographic.jpg', type: 'image/jpeg', size: 890000 },
        { id: '4', name: 'podcast-intro.mp3', type: 'audio/mpeg', size: 1500000 },
        { id: '5', name: 'presentation.pdf', type: 'application/pdf', size: 2100000 },
        { id: '6', name: 'banner-design.png', type: 'image/png', size: 670000 }
      ];
      setProjectFiles(mockFiles);
    } catch (error) {

      toast.error('Failed to load project files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const checkThreadsAuth = async () => {
    try {
      // Mock authentication check
      const isConnected = Math.random() > 0.5; // Random for demo
      setThreadsConnected(isConnected);
      if (isConnected) {
        setThreadsAccountId('threads_12345');
      }
    } catch (error) {

      setThreadsConnected(false);
    }
  };

  const connectThreads = async () => {
    try {
      toast.loading('Connecting to Threads...');
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setThreadsConnected(true);
      setThreadsAccountId('threads_12345');
      toast.success('Successfully connected to Threads!');
    } catch (error) {

      toast.error('Failed to connect to Threads');
    }
  };

  const disconnectThreads = async () => {
    try {
      setThreadsConnected(false);
      setThreadsAccountId(undefined);
      toast.success('Disconnected from Threads');
    } catch (error) {

      toast.error('Failed to disconnect from Threads');
    }
  };

  const toggleFileSelection = (file: ProjectFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handlePostNow = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter some content to post');
      return;
    }

    if (!threadsConnected) {
      toast.error('Please connect to Threads first');
      return;
    }

    try {
      toast.loading('Publishing to Threads...');
      // Simulate posting
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Successfully published to Threads!');
      
      // Reset form
      setPostContent('');
      setSelectedFiles([]);
    } catch (error) {

      toast.error('Failed to post to Threads');
    }
  };

  const handleSchedulePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter some content to schedule');
      return;
    }

    const now = new Date();
    const scheduledDateTime = scheduledDate && scheduledTime 
      ? new Date(`${scheduledDate}T${scheduledTime}`) 
      : null;

    if (scheduledDateTime && scheduledDateTime <= now) {
      toast.error('Please select a future date and time');
      return;
    }

    try {
      const post: ScheduledPost = {
        id: Date.now().toString(),
        content: postContent,
        scheduledDate: scheduledDate || '',
        scheduledTime: scheduledTime || '',
        platform: 'threads',
        files: selectedFiles
      };

      if (scheduledDateTime) {
        toast.success(`Post scheduled for ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString()}`);
        onSchedulePost?.(post);
      } else {
        toast.success('Post saved as draft');
      }

      // Reset form
      setPostContent('');
      setSelectedFiles([]);
      setScheduledDate('');
      setScheduledTime('');
    } catch (error) {

      toast.error('Failed to schedule post');
    }
  };

  const handleTestThreads = async () => {
    try {
      toast.loading('Testing Threads connection...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Threads connection is working!');
    } catch (error) {

      toast.error('Threads connection test failed');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    if (fileType.startsWith('video/')) {
      return (
        <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    }
    if (fileType.startsWith('audio/')) {
      return (
        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <SchedulerIcon />
            <span className="ml-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Content Scheduler
            </span>
          </h1>
          <p className="text-gray-300">Schedule and publish content to Threads with smart file management</p>
          
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={checkThreadsAuth}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
            >
              <RefreshIcon />
              Refresh Status
            </button>
            <button
              onClick={() => setShowPlatformSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
            >
              <SettingsIcon />
              Account Settings
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <ConnectionIcon />
            Threads Connection Status
          </h3>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${threadsConnected ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg ${threadsConnected ? 'shadow-emerald-500/50' : 'shadow-red-500/50'}`}></span>
            <span className="text-sm text-gray-300">
              {threadsConnected ? 'Connected to Threads' : 'Not connected to Threads'}
            </span>
            {threadsConnected && threadsAccountId && (
              <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full">
                ID: {threadsAccountId}
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          {/* Content Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MessageIcon />
              Content for Threads
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind? Share it on Threads..."
              className="w-full h-32 p-4 border border-slate-600 bg-slate-800/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-300 placeholder-gray-500 transition-all duration-200"
            />

            {/* Character count */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{postContent.length} characters</span>
              <span className={postContent.length > charLimit ? 'text-red-400' : 'text-gray-400'}>
                {charLimit - postContent.length} remaining (Threads limit)
              </span>
            </div>

            {/* Tags */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <FaTag className="inline-block w-4 h-4 mr-2" />
                Tags (Optional)
              </label>
              <TagInput
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                placeholder="Add tags to organize your content..."
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-2">
                Tag your content for better organization and searchability
              </p>
            </div>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-800/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
                <AttachmentIcon />
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedFiles.map(file => (
                  <div key={file.id} className="relative group">
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200">
                      {getFileIcon(file.type)}
                      <span className="text-xs text-gray-300 truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => toggleFileSelection(file)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded"
                      >
                        <RemoveIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <CalendarIcon />
                Schedule Date (optional)
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <ClockIcon />
                Schedule Time (optional)
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full p-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 transition-all duration-200"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowFileSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
            >
              <AttachmentIcon />
              Add Files
            </button>

            <button
              onClick={handlePostNow}
              disabled={!postContent.trim() || !threadsConnected}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
            >
              <PostIcon />
              Post Now
            </button>

            <button
              onClick={handleSchedulePost}
              disabled={!postContent.trim() || !threadsConnected}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25"
            >
              <SaveIcon />
              {scheduledDate && scheduledTime ? 'Schedule Post' : 'Save Draft'}
            </button>

            {/* Test Button for Threads */}
            {threadsConnected && (
              <button
                onClick={handleTestThreads}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
              >
                <TestIcon />
                Test Threads
              </button>
            )}
          </div>
        </div>

        {/* File Selector Modal */}
        {showFileSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-300 flex items-center">
                  <FolderIcon />
                  Select Files from Project Center
                </h2>
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="text-gray-400 hover:text-gray-300 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                {loadingFiles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading files...</p>
                  </div>
                ) : projectFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                      <FolderIcon />
                    </div>
                    <h3 className="text-gray-300 font-medium">No files found in Project Center</h3>
                    <p className="text-gray-400 text-sm mt-1">Upload some files to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projectFiles.map(file => (
                      <div
                        key={file.id}
                        onClick={() => toggleFileSelection(file)}
                        className={`cursor-pointer p-4 border-2 rounded-lg transition-all duration-200 ${
                          selectedFiles.some(f => f.id === file.id)
                            ? 'border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/20'
                            : 'border-slate-600/50 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium text-gray-300 truncate w-full text-center">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-600/50">
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  Add Selected Files ({selectedFiles.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Platform Settings Modal */}
        {showPlatformSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-purple-300 flex items-center">
                  <ThreadsIcon />
                  Threads Account
                </h2>
                <button
                  onClick={() => setShowPlatformSettings(false)}
                  className="text-gray-400 hover:text-gray-300 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-slate-600/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-300 flex items-center">
                      <ThreadsIcon />
                      Threads
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {threadsConnected
                        ? `Connected (Account ID: ${threadsAccountId})`
                        : 'Connect to start posting to Threads'
                      }
                    </p>
                  </div>
                  <div>
                    {threadsConnected ? (
                      <button
                        onClick={disconnectThreads}
                        className="px-3 py-1 text-sm bg-gradient-to-br from-red-800/50 to-rose-900/50 border border-red-500/30 hover:bg-red-700/50 hover:border-red-400/50 text-red-300 hover:text-red-200 rounded transition-all duration-200"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={connectThreads}
                        className="px-3 py-1 text-sm bg-gradient-to-br from-blue-800/50 to-purple-900/50 border border-blue-500/30 hover:bg-blue-700/50 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded transition-all duration-200"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-800/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-start">
                    <BulbIcon />
                    <span>
                      <strong>Tip:</strong> Once connected, you can post content directly to Threads and schedule posts for later.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Built with React, TypeScript, and Tailwind CSS • Smart Content Scheduling
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentScheduler;