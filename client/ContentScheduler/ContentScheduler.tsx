import React, { useState, useEffect, useCallback } from 'react';
import xContentSchedulerService from '../shared/services/xContentSchedulerService';

// Simplified types for X-only scheduler
interface XPost {
  id: string;
  content: string;
  scheduledAt: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: XMedia[];
  createdAt: string;
  publishedAt?: string;
  errorMessage?: string;
}

interface XMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'gif';
  filename: string;
}

interface CreatePostRequest {
  content: string;
  scheduledAt?: string;
  mediaIds?: string[];
}

interface XConnection {
  isConnected: boolean;
  username?: string;
  profileImage?: string;
  lastConnected?: string;
}

const XContentScheduler: React.FC = () => {
  // State management
  const [posts, setPosts] = useState<XPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [xConnection, setXConnection] = useState<XConnection>({ isConnected: false });
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  // Pagination
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Load initial data
  useEffect(() => {
    console.log('Component mounted, loading data...');
    loadPosts();
    loadXConnection();
  }, []);

  // Data loading functions
  const loadPosts = useCallback(async (reset = false) => {
    try {
      console.log('Loading posts...');
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const response = await xContentSchedulerService.getPosts({
        limit,
        offset: currentOffset
      });

      console.log('Posts loaded:', response);

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
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      showNotification('error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const loadXConnection = async () => {
    try {
      console.log('Loading X connection...');
      const connection = await xContentSchedulerService.getConnection();
      console.log('X connection loaded:', connection);
      setXConnection(connection);
    } catch (err) {
      console.error('Failed to load X connection:', err);
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

  // Post creation handler
  const handleCreatePost = async (postData: CreatePostRequest) => {
    try {
      console.log('Creating post:', postData);
      setLoading(true);
      const newPost = await xContentSchedulerService.createPost(postData);
      console.log('Post created:', newPost);
      setPosts(prev => [newPost, ...prev]);
      setShowCreateModal(false);
      showNotification('success', 'Post created successfully');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
      showNotification('error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Post management handlers
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      console.log('Deleting post:', postId);
      await xContentSchedulerService.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      showNotification('success', 'Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      showNotification('error', 'Failed to delete post');
    }
  };

  const handleConnectX = async () => {
    try {
      console.log('Connecting to X...');
      const result = await xContentSchedulerService.connectX();
      console.log('Connect X result:', result);
      window.location.href = result.authUrl;
    } catch (err) {
      console.error('Error connecting to X:', err);
      showNotification('error', 'Failed to connect to X');
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: XPost['status'] }> = ({ status }) => {
    const colors = {
      draft: 'bg-gray-500',
      scheduled: 'bg-blue-500',
      published: 'bg-green-500',
      failed: 'bg-red-500'
    };
    
    return (
      <span className={`${colors[status]} text-white px-2 py-1 rounded-full text-xs font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
  const PostCard: React.FC<{ post: XPost }> = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-black text-lg font-bold">𝕏</span>
          <span className="text-sm text-gray-500">X</span>
        </div>
        <StatusBadge status={post.status} />
      </div>
      
      <div className="mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
        <div className="text-sm text-gray-500 mt-1">
          {post.content.length}/280 characters
        </div>
      </div>
      
      {post.media && post.media.length > 0 && (
        <div className="flex gap-2 mb-3">
          {post.media.slice(0, 4).map(media => (
            <img
              key={media.id}
              src={media.thumbnailUrl || media.url}
              alt="Media preview"
              className="w-12 h-12 object-cover rounded"
            />
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {post.scheduledAt 
            ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`
            : post.publishedAt 
            ? `Published: ${new Date(post.publishedAt).toLocaleString()}`
            : `Created: ${new Date(post.createdAt).toLocaleString()}`
          }
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleDeletePost(post.id)}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
      
      {post.status === 'failed' && post.errorMessage && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          Error: {post.errorMessage}
        </div>
      )}
    </div>
  );

  // X connection status
  const XConnectionStatus: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md p-4 border mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-black text-2xl font-bold">𝕏</span>
          <div>
            <h3 className="font-semibold text-gray-900">X Account</h3>
            {xConnection.isConnected ? (
              <p className="text-sm text-green-600">
                Connected as @{xConnection.username}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Not connected</p>
            )}
          </div>
        </div>
        
        {!xConnection.isConnected ? (
          <button
            onClick={handleConnectX}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Connect X
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
        )}
      </div>
    </div>
  );

  // Simple Create Post Modal
  const CreatePostModal: React.FC = () => {
    const [content, setContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!content.trim()) {
        showNotification('error', 'Post content is required');
        return;
      }

      if (content.length > 280) {
        showNotification('error', 'Post content exceeds 280 character limit');
        return;
      }

      const postData: CreatePostRequest = {
        content: content.trim(),
        scheduledAt: isScheduled && scheduledAt ? scheduledAt : undefined
      };

      handleCreatePost(postData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                rows={4}
              />
              <div className="text-sm text-gray-500 mt-1">
                {content.length}/280 characters
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Schedule for later</span>
              </label>
            </div>

            {isScheduled && (
              <div className="mb-4">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim() || content.length > 280}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isScheduled ? 'Schedule Post' : 'Post Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="max-w-4xl mx-auto p-6">
      <NotificationContainer />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">𝕏 Scheduler</h1>
          <p className="text-gray-600 mt-1">Schedule and manage your posts on X</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* X Connection Status */}
      <XConnectionStatus />

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-2 text-gray-600">Loading posts...</span>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && posts.length > 0 && (
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
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 font-bold">𝕏</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first scheduled post.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Post
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && <CreatePostModal />}
    </div>
  );
};

export default XContentScheduler;