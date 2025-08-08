import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScheduledPost, 
  Platform, 
  PostStatus, 
  ViewMode, 
  PLATFORM_CONFIG,
  CreatePostRequest,
  MediaAsset,
  ContentTemplate,
  PlatformConnection
} from '../shared/types/contentScheduler';
import contentSchedulerService from '../shared/services/contentSchedulerService';

// Enhanced component with real backend integration
const ContentScheduler: React.FC = () => {
  // State management
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', message: string}>>([]);

  // Pagination
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Load initial data
  useEffect(() => {
    loadPosts();
    loadPlatformConnections();
    loadTemplates();
    loadMediaAssets();
  }, []);

  // Data loading functions
  const loadPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const response = await contentSchedulerService.getPosts({
        limit,
        offset: currentOffset,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined
      });

      if (reset) {
        setPosts(response.posts);
        setOffset(limit);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      showNotification('error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [selectedPlatforms, offset]);

  const loadPlatformConnections = async () => {
    try {
      const connections = await contentSchedulerService.getPlatformConnections();
      setPlatformConnections(connections);
    } catch (err) {
      console.error('Failed to load platform connections:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const templates = await contentSchedulerService.getTemplates();
      setTemplates(templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadMediaAssets = async () => {
    try {
      const response = await contentSchedulerService.getMediaAssets(20, 0);
      setMediaAssets(response.assets);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    }
  };

  // Utility functions
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const isConnected = (platform: Platform) => {
    return platformConnections.find(conn => conn.platform === platform)?.isConnected || false;
  };

  // Filter posts based on selected platforms
  const filteredPosts = selectedPlatforms.length === 0 
    ? posts 
    : posts.filter(post => post.platforms.some(p => selectedPlatforms.includes(p)));

  // Enhanced components
  const PlatformBadge: React.FC<{ platform: Platform; size?: 'sm' | 'md'; showConnection?: boolean }> = ({ 
    platform, 
    size = 'sm', 
    showConnection = false 
  }) => {
    const config = PLATFORM_CONFIG[platform];
    const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
    const connected = isConnected(platform);
    
    return (
      <span className={`${config.color} text-white rounded-full ${sizeClasses} font-medium flex items-center gap-1 relative`}>
        <span>{config.icon}</span>
        <span>{config.name}</span>
        {showConnection && (
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        )}
      </span>
    );
  };

  const StatusBadge: React.FC<{ status: PostStatus }> = ({ status }) => {
    const colors = {
      draft: 'bg-gray-500',
      scheduled: 'bg-blue-500',
      published: 'bg-green-500',
      failed: 'bg-red-500',
      pending: 'bg-yellow-500'
    };
    
    return (
      <span className={`${colors[status]} text-white px-2 py-1 rounded-full text-xs font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Post creation handler
  const handleCreatePost = async (postData: CreatePostRequest) => {
    try {
      setLoading(true);
      const newPost = await contentSchedulerService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      setShowCreateModal(false);
      showNotification('success', 'Post created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      showNotification('error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Post management handlers
  const handleDeletePost = async (postId: string) => {
    try {
      await contentSchedulerService.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      showNotification('success', 'Post deleted successfully');
    } catch (err) {
      showNotification('error', 'Failed to delete post');
    }
  };

  const handleDuplicatePost = async (post: ScheduledPost) => {
    try {
      const duplicateData: CreatePostRequest = {
        content: post.content,
        platforms: post.platforms,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        mediaIds: post.media?.map(m => m.id) || [],
        templateId: post.templateId
      };
      await handleCreatePost(duplicateData);
    } catch (err) {
      showNotification('error', 'Failed to duplicate post');
    }
  };

  // Notification component
  const NotificationContainer: React.FC = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );

  // Post card component
  const PostCard: React.FC<{ post: ScheduledPost }> = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          {post.platforms.map(platform => (
            <PlatformBadge key={platform} platform={platform} />
          ))}
        </div>
        <StatusBadge status={post.status} />
      </div>
      
      <div className="mb-3">
        <p className="text-gray-800 line-clamp-3">{post.content}</p>
      </div>
      
      {post.media && post.media.length > 0 && (
        <div className="flex gap-2 mb-3">
          {post.media.slice(0, 3).map(media => (
            <img
              key={media.id}
              src={media.thumbnailUrl || media.url}
              alt="Media preview"
              className="w-12 h-12 object-cover rounded"
            />
          ))}
          {post.media.length > 3 && (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
              +{post.media.length - 3}
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'No schedule'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPost(post)}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleDuplicatePost(post)}
            className="text-green-500 hover:text-green-700"
          >
            Duplicate
          </button>
          <button
            onClick={() => handleDeletePost(post.id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Platform filter component
  const PlatformFilter: React.FC = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <span className="text-sm font-medium text-gray-700 flex items-center">Filter:</span>
      {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
        <button
          key={platform}
          onClick={() => {
            setSelectedPlatforms(prev => 
              prev.includes(platform as Platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform as Platform]
            );
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedPlatforms.includes(platform as Platform)
              ? `${config.color} text-white`
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span className="mr-1">{config.icon}</span>
          {config.name}
        </button>
      ))}
      {selectedPlatforms.length > 0 && (
        <button
          onClick={() => setSelectedPlatforms([])}
          className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
        >
          Clear All
        </button>
      )}
    </div>
  );

  // Main render
  return (
    <div className="max-w-7xl mx-auto p-6">
      <NotificationContainer />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Scheduler</h1>
          <p className="text-gray-600 mt-1">Manage your social media posts across platforms</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['calendar', 'list'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'calendar' ? '📅 Calendar' : '📋 List'}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Create Post
          </button>
        </div>
      </div>

      {/* Platform Filter */}
      <PlatformFilter />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading posts...</span>
        </div>
      )}

      {/* Posts Grid */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => loadPosts()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Load More Posts
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-6">
            {selectedPlatforms.length > 0 
              ? 'No posts found for the selected platforms.' 
              : 'Start by creating your first social media post.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Post
          </button>
        </div>
      )}

      {/* Modals would go here */}
      {/* CreatePostModal, EditPostModal, etc. */}
    </div>
  );
};

export default ContentScheduler;