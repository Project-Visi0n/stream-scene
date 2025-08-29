// client/ContentScheduler/ContentScheduler.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PostContent, SocialPlatform, ProjectFile, ScheduledPost, CalendarEvent } from '../types/contentScheduler';
import { getThreadsStatus, scheduleThreadsPost, publishThreadsNowById } from '../services/threads';

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

  // Load project files and check auth status on mount
  useEffect(() => {
    console.log('[ContentScheduler] useeEffect running')
    loadProjectFiles();
    checkThreadsAuth();
  }, []);

const loadProjectFiles = async () => {
  setLoadingFiles(true);
  try {
    console.log('[ContentScheduler] Loading files...');
    const response = await fetch('/api/files', {
      credentials: 'include'
    });
    
    console.log('[ContentScheduler] Response status:', response.status);
    
    if (response.status === 401) {
      console.warn('User not authenticated, cannot load files');
      setProjectFiles([]);
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('[ContentScheduler] Response data:', data);
      console.log('[ContentScheduler] Files array:', data.files);
      
      // Extract files from the response object
      const files = data.files || [];
      console.log('[ContentScheduler] Setting files:', files.length, 'files');
      setProjectFiles(Array.isArray(files) ? files : []);
    } else {
      console.warn('Failed to load files:', response.status, response.statusText);
      setProjectFiles([]);
    }
  } catch (error) {
    console.error('Failed to load project files:', error);
    setProjectFiles([]);
  } finally {
    setLoadingFiles(false);
  }
};

  // Threads character limit
  const threadsLimit = 500;
  const charLimit = threadsLimit;

  // Map selectedFiles -> Threads media payload
  const toThreadsMedia = () => {
    const imageUrls = selectedFiles
      .filter(f => f.type?.startsWith('image/'))
      .map(f => (f as any).url || (f as any).publicUrl || (f as any).s3Url)
      .filter(Boolean) as string[];

    const video = selectedFiles.find(f => f.type?.startsWith('video/'));
    const videoUrl = video ? ((video as any).url || (video as any).publicUrl || (video as any).s3Url) : null;

    return {
      imageUrls: imageUrls.length ? imageUrls : undefined,
      videoUrl: videoUrl || undefined,
    };
  };

  // Check Threads authentication status
  const checkThreadsAuth = async () => {
    try {
      const threads = await getThreadsStatus();
      setThreadsConnected(!!threads.connected);
      setThreadsAccountId(threads.accountId);
    } catch (error) {
      console.warn('[Auth] Threads status check failed', error);
      setThreadsConnected(false);
      setThreadsAccountId(undefined);
    }
  };

  // Threads authentication
  const connectThreads = async () => {
    try {
      window.location.href = '/api/threads/auth';
    } catch (error: any) {
      console.error('[Auth] Failed to connect to Threads:', error);
      toast.error(`Failed to connect to Threads: ${error.message}`);
    }
  };

  const disconnectThreads = async () => {
    try {
      const response = await fetch('/api/threads/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setThreadsConnected(false);
        setThreadsAccountId(undefined);
        toast.success('Disconnected from Threads');
      } else {
        throw new Error(`Failed to disconnect: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Failed to disconnect Threads:', error);
      toast.error(`Failed to disconnect Threads: ${error.message}`);
    }
  };

  // File selection
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

  // Post scheduling
  const handleSchedulePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (!threadsConnected) {
      toast.error('Please connect your Threads account first');
      return;
    }

    const scheduleDateTime = scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : undefined;

    if (!scheduleDateTime) {
      toast.error('Please select a date and time to schedule');
      return;
    }

    if (postContent.length > charLimit) {
      toast.error(`Content exceeds Threads character limit (${charLimit} chars)`);
      return;
    }

    const post: ScheduledPost = {
      id: Date.now().toString(),
      text: postContent,
      media: selectedFiles,
      platforms: ['threads'],
      scheduledDate: scheduleDateTime,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      calendarEventId: `cal_${Date.now()}`
    };

    try {
      if (!threadsAccountId) {
        throw new Error('Threads account not properly connected');
      }

      await scheduleThreadsPost({
        accountId: threadsAccountId,
        text: postContent,
        media: toThreadsMedia(),
        scheduledFor: scheduleDateTime.toISOString()
      });

      onSchedulePost?.(post);

      if (onAddToCalendar) {
        const calendarEvent: CalendarEvent = {
          id: post.calendarEventId!,
          title: 'Post to Threads',
          description: postContent.slice(0, 100) + (postContent.length > 100 ? '...' : ''),
          date: scheduleDateTime,
          type: 'post',
          postId: post.id,
          platforms: ['threads']
        };
        onAddToCalendar(calendarEvent);
      }

      // Reset form
      setPostContent('');
      setSelectedFiles([]);
      setScheduledDate('');
      setScheduledTime('');

      toast.success('Post scheduled successfully!');
    } catch (error: any) {
      console.error('Failed to schedule post:', error);
      toast.error(`Failed to schedule: ${error.message}`);
    }
  };

  // Post immediately
  const handlePostNow = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (!threadsConnected) {
      toast.error('Please connect your Threads account first');
      return;
    }

    if (postContent.length > charLimit) {
      toast.error(`Content exceeds Threads character limit (${charLimit} chars)`);
      return;
    }

    try {
      if (!threadsAccountId) {
        throw new Error('Threads account not properly connected');
      }

      const nowIso = new Date().toISOString();
      const media = toThreadsMedia();

      const { post } = await scheduleThreadsPost({
        accountId: threadsAccountId,
        text: postContent,
        media,
        scheduledFor: nowIso
      });

      await publishThreadsNowById(post.id);

      toast.success('Posted to Threads!');
      
      // Reset form
      setPostContent('');
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('[Post Now] Error:', error);
      toast.error(`Failed to post: ${error.message}`);
    }
  };

  // Test Threads posting
  const handleTestThreads = async () => {
    if (!postContent.trim()) {
      toast.error('Enter some content to test');
      return;
    }

    try {
      const response = await fetch('/api/content-scheduler/test-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: postContent })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Threads test post successful!');
      } else {
        throw new Error(data.details || data.error || 'Test failed');
      }
    } catch (error: any) {
      console.error('[Test Threads] Error:', error);
      toast.error(`Threads test failed: ${error.message}`);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    return '📄';
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

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <span className="mr-3 text-4xl">📆</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Content Scheduler
            </span>
          </h1>
          <p className="text-gray-300">Schedule and publish content to Threads with smart file management</p>
          
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={checkThreadsAuth}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
            >
              <span>🔄</span>
              Refresh Status
            </button>
            <button
              onClick={() => setShowPlatformSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50 text-gray-300 hover:text-purple-300 rounded-lg transition-all duration-200"
            >
              <span>⚙️</span>
              Account Settings
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <span className="mr-2">🔗</span>
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
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
          {/* Content Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-block w-4 h-4 mr-2 text-center">💬</span>
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
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-purple-800/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
                <span className="mr-2">📎</span>
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {selectedFiles.map(file => (
                  <div key={file.id} className="relative group">
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-200">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <span className="text-xs text-gray-300 truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => toggleFileSelection(file)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded"
                      >
                        <span className="text-sm">❌</span>
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
                <span className="inline-block w-4 h-4 mr-1 text-center">📅</span>
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
                <span className="inline-block w-4 h-4 mr-1 text-center">⏰</span>
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
              <span>📎</span>
              Add Files
            </button>

            <button
              onClick={handlePostNow}
              disabled={!postContent.trim() || !threadsConnected}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
            >
              <span>📤</span>
              Post Now
            </button>

            <button
              onClick={handleSchedulePost}
              disabled={!postContent.trim() || !threadsConnected}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25"
            >
              <span>⏰</span>
              {scheduledDate && scheduledTime ? 'Schedule Post' : 'Save Draft'}
            </button>

            {/* Test Button for Threads */}
            {threadsConnected && (
              <button
                onClick={handleTestThreads}
                disabled={!postContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-800/50 to-pink-900/50 border border-purple-500/30 hover:bg-purple-700/50 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-200"
              >
                <span>🧪</span>
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
                  <span className="mr-2">📁</span>
                  Select Files from Project Center
                </h2>
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="text-gray-400 hover:text-gray-300 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <span className="text-xl">❌</span>
                </button>
              </div>

              <div className="overflow-y-auto max-h-96 bg-slate-800/30 rounded-lg p-4">
                {loadingFiles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
                    <p className="text-gray-300">Loading files...</p>
                  </div>
                ) : projectFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">📁</div>
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
                          <span className="text-2xl">{getFileIcon(file.type)}</span>
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

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="px-4 py-2 text-gray-400 border border-slate-600 rounded-lg hover:bg-slate-700/50 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFileSelector(false)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-purple-500/25"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings Modal */}
        {showPlatformSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-300 flex items-center">
                  <span className="mr-2">🧵</span>
                  Threads Account
                </h2>
                <button
                  onClick={() => setShowPlatformSettings(false)}
                  className="text-gray-400 hover:text-gray-300 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <span className="text-xl">❌</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-slate-600/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-300 flex items-center">
                      <span className="mr-2">🧵</span>
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
                    <span className="mr-2 mt-0.5">💡</span>
                    <span>
                      <strong>Tip:</strong> Once connected, you can post content directly to Threads and schedule posts for later.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentScheduler;