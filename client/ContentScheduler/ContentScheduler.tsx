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
      window.location.href = '/auth/threads';
    } catch (error: any) {
      console.error('[Auth] Failed to connect to Threads:', error);
      toast.error(`Failed to connect to Threads: ${error.message}`);
    }
  };

  const disconnectThreads = async () => {
    try {
      const response = await fetch('/auth/threads/disconnect', {
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Threads Content Scheduler</h1>
        <div className="flex gap-2">
          <button
            onClick={checkThreadsAuth}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>🔄</span>
            Refresh Status
          </button>
          <button
            onClick={() => setShowPlatformSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>⚙️</span>
            Account Settings
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Threads Connection Status:</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${threadsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">
            {threadsConnected ? 'Connected to Threads' : 'Not connected to Threads'}
          </span>
          {threadsConnected && threadsAccountId && (
            <span className="text-xs text-gray-500">(ID: {threadsAccountId})</span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Content Input */}
        <div className="space-y-4">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind? Share it on Threads..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Character count */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>{postContent.length} characters</span>
            <span className={postContent.length > charLimit ? 'text-red-500' : ''}>
              {charLimit - postContent.length} remaining (Threads limit)
            </span>
          </div>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {selectedFiles.map(file => (
                <div key={file.id} className="relative group">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    {getFileIcon(file.type)}
                    <span className="text-xs truncate">{file.name}</span>
                    <button
                      onClick={() => toggleFileSelection(file)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-red-500 text-sm">❌</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Date (optional)
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Time (optional)
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowFileSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <span>📎</span>
            Add Files
          </button>

          <button
            onClick={handlePostNow}
            disabled={!postContent.trim() || !threadsConnected}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <span>📤</span>
            Post Now
          </button>

          <button
            onClick={handleSchedulePost}
            disabled={!postContent.trim() || !threadsConnected}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <span>⏰</span>
            {scheduledDate && scheduledTime ? 'Schedule Post' : 'Save Draft'}
          </button>

          {/* Test Button for Threads */}
          {threadsConnected && (
            <button
              onClick={handleTestThreads}
              disabled={!postContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              <span>🧪</span>
              Test Threads
            </button>
          )}
        </div>
      </div>

      {/* File Selector Modal */}
      {showFileSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Select Files from Project Center</h2>
              <button
                onClick={() => setShowFileSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">❌</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              {loadingFiles ? (
                <div className="text-center py-8">Loading files...</div>
              ) : projectFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files found in Project Center
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file)}
                      className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                        selectedFiles.some(f => f.id === file.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <span className="text-sm font-medium truncate w-full text-center">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowFileSelector(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowFileSelector(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showPlatformSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Threads Account</h2>
              <button
                onClick={() => setShowPlatformSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">❌</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Threads</h3>
                  <p className="text-sm text-gray-500">
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
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectThreads}
                      className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Once connected, you can post content directly to Threads and schedule posts for later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentScheduler;