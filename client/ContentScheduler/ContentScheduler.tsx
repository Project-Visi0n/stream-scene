import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Integration types - extend your existing types
interface XPost {
  id: string;
  content: string;
  scheduledAt: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: XMedia[];
  createdAt: string;
  publishedAt?: string;
  errorMessage?: string;
  // New integration fields
  weeklyPlanId?: string;
  projectFileIds?: string[];
  aiGenerated?: boolean;
  planThemes?: string[];
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
  weeklyPlanId?: string;
  projectFileIds?: string[];
}

interface XConnection {
  isConnected: boolean;
  username?: string;
  profileImage?: string;
  lastConnected?: string;
}

// Integration interfaces for connecting with your existing components
interface WeeklyPlanSummary {
  id: string;
  week: string;
  title: string;
  themes: string[];
  goals: string[];
  postsScheduled: number;
  targetPosts: number;
  status: 'active' | 'completed' | 'draft';
}

interface ProjectFileSummary {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'template';
  thumbnailUrl?: string;
  lastModified: string;
  size: string;
  usageCount: number;
}

// Integration service layer - connects to your existing components
interface IntegrationService {
  getWeeklyPlanSummaries: () => Promise<WeeklyPlanSummary[]>;
  getProjectFileSummaries: () => Promise<ProjectFileSummary[]>;
  generateAIContent: (planId: string, themes: string[]) => Promise<string[]>;
  linkPostToPlan: (postId: string, planId: string) => Promise<void>;
  attachFilesToPost: (postId: string, fileIds: string[]) => Promise<void>;
}

// Mock integration service - replace with calls to your actual components
const mockIntegrationService: IntegrationService = {
  getWeeklyPlanSummaries: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: '1',
        week: '2025-08-10',
        title: 'Product Launch Week',
        themes: ['Product updates', 'User testimonials', 'Behind the scenes'],
        goals: ['Launch feature X', 'Increase engagement 15%', 'Drive 500 visits'],
        postsScheduled: 8,
        targetPosts: 12,
        status: 'active'
      },
      {
        id: '2',
        week: '2025-08-17',
        title: 'Brand Awareness Campaign',
        themes: ['Industry insights', 'Company culture', 'Tech tips'],
        goals: ['Build thought leadership', 'Connect with developers'],
        postsScheduled: 5,
        targetPosts: 10,
        status: 'draft'
      }
    ];
  },

  getProjectFileSummaries: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      {
        id: '1',
        name: 'product-demo-video.mp4',
        type: 'video',
        thumbnailUrl: '/thumb1.jpg',
        lastModified: '2025-08-09',
        size: '15.2 MB',
        usageCount: 3
      },
      {
        id: '2',
        name: 'brand-announcement.jpg',
        type: 'image',
        thumbnailUrl: '/thumb2.jpg',
        lastModified: '2025-08-08',
        size: '2.4 MB',
        usageCount: 1
      },
      {
        id: '3',
        name: 'user-testimonial.png',
        type: 'image',
        thumbnailUrl: '/thumb3.jpg',
        lastModified: '2025-08-07',
        size: '1.8 MB',
        usageCount: 5
      },
      {
        id: '4',
        name: 'tech-infographic.svg',
        type: 'document',
        lastModified: '2025-08-06',
        size: '850 KB',
        usageCount: 2
      }
    ];
  },

  generateAIContent: async (planId: string, themes: string[]) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const suggestions = [
      `Excited to share how ${themes[0]} is transforming our approach! 🚀`,
      `Behind the scenes: Here's what we learned about ${themes[1]} this week`,
      `Pro tip: ${themes[2]} best practices that actually work in 2025`,
      `Why ${themes[0]} matters more than ever - a thread 🧵`,
      `Quick update on our ${themes[1]} progress - amazing results!`
    ];
    return suggestions.slice(0, 3);
  },

  linkPostToPlan: async (postId: string, planId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Linked post ${postId} to plan ${planId}`);
  },

  attachFilesToPost: async (postId: string, fileIds: string[]) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Attached files ${fileIds.join(', ')} to post ${postId}`);
  }
};

// Mock X Content Scheduler service
const xContentSchedulerService = {
  getPosts: async ({ limit, offset }: { limit: number; offset: number }) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockPosts: XPost[] = [
      {
        id: '1',
        content: 'Excited to share our latest product update! 🚀 New features transforming user experience.',
        scheduledAt: null,
        status: 'published' as const,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        publishedAt: new Date(Date.now() - 43200000).toISOString(),
        weeklyPlanId: '1',
        projectFileIds: ['1', '2'],
        planThemes: ['Product updates', 'User testimonials']
      },
      {
        id: '2',
        content: 'Behind the scenes: Our team working on amazing features! #TeamWork #Innovation',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled' as const,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        weeklyPlanId: '1',
        aiGenerated: true,
        planThemes: ['Behind the scenes']
      },
      {
        id: '3',
        content: 'Pro tip: Here are the development best practices that actually work in 2025 🔧',
        scheduledAt: null,
        status: 'draft' as const,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        weeklyPlanId: '2',
        projectFileIds: ['4'],
        planThemes: ['Tech tips']
      }
    ];
    return {
      posts: mockPosts.slice(offset, offset + limit),
      hasMore: offset + limit < mockPosts.length
    };
  },
  
  getConnection: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      isConnected: true,
      username: 'yourcompany',
      profileImage: '/profile.jpg',
      lastConnected: new Date().toISOString()
    };
  },
  
  createPost: async (postData: CreatePostRequest) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newPost: XPost = {
      id: Date.now().toString(),
      content: postData.content,
      scheduledAt: postData.scheduledAt || null,
      status: postData.scheduledAt ? 'scheduled' as const : 'published' as const,
      createdAt: new Date().toISOString(),
      publishedAt: postData.scheduledAt ? undefined : new Date().toISOString(),
      weeklyPlanId: postData.weeklyPlanId,
      projectFileIds: postData.projectFileIds
    };
    return newPost;
  },
  
  deletePost: async (postId: string) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log('Post deleted:', postId);
  },
  
  connectX: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      authUrl: 'https://api.twitter.com/oauth/authenticate?oauth_token=mock_token'
    };
  }
};

const IntegrationHub: React.FC = () => {
  // State from your existing X scheduler
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
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Integration state
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanSummary[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFileSummary[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showIntegrationPanel, setShowIntegrationPanel] = useState(true);

  // Load all data
  useEffect(() => {
    loadPosts();
    loadXConnection();
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      const [plans, files] = await Promise.all([
        mockIntegrationService.getWeeklyPlanSummaries(),
        mockIntegrationService.getProjectFileSummaries()
      ]);
      setWeeklyPlans(plans);
      setProjectFiles(files);
      if (plans.length > 0) {
        setSelectedPlan(plans[0].id);
      }
    } catch (err) {
      console.error('Failed to load integration data:', err);
    }
  };

  const loadPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      const response = await xContentSchedulerService.getPosts({
        limit,
        offset: currentOffset
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
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      showNotification('error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [offset, limit]);

  const loadXConnection = async () => {
    try {
      const connection = await xContentSchedulerService.getConnection();
      setXConnection(connection);
    } catch (err) {
      console.error('Failed to load X connection:', err);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const generateAIContent = async () => {
    if (!selectedPlan) return;
    
    const plan = weeklyPlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      setLoading(true);
      const suggestions = await mockIntegrationService.generateAIContent(selectedPlan, plan.themes);
      setAiSuggestions(suggestions);
      showNotification('success', `Generated ${suggestions.length} AI content suggestions!`);
    } catch (err) {
      showNotification('error', 'Failed to generate AI content');
    } finally {
      setLoading(false);
    }
  };

  const createPostFromSuggestion = async (content: string) => {
    try {
      const postData: CreatePostRequest = {
        content,
        weeklyPlanId: selectedPlan,
        projectFileIds: selectedFiles.length > 0 ? selectedFiles : undefined
      };
      
      const newPost = await xContentSchedulerService.createPost(postData);
      setPosts(prev => [{ ...newPost, aiGenerated: true }, ...prev]);
      showNotification('success', 'AI-generated post created!');
      
      // Clear the suggestion
      setAiSuggestions(prev => prev.filter(s => s !== content));
    } catch (err) {
      showNotification('error', 'Failed to create post');
    }
  };

  const handleCreatePost = async (postData: CreatePostRequest) => {
    try {
      setLoading(true);
      const newPost = await xContentSchedulerService.createPost(postData);
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await xContentSchedulerService.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      showNotification('success', 'Post deleted successfully');
    } catch (err) {
      showNotification('error', 'Failed to delete post');
    }
  };

  const handleConnectX = async () => {
    try {
      const result = await xContentSchedulerService.connectX();
      window.location.href = result.authUrl;
    } catch (err) {
      showNotification('error', 'Failed to connect to X');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'template': return '📋';
      default: return '📁';
    }
  };

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

  const IntegrationPanel: React.FC = () => {
    const currentPlan = weeklyPlans.find(p => p.id === selectedPlan);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🔗 Integration Hub
          </h2>
          <button
            onClick={() => setShowIntegrationPanel(!showIntegrationPanel)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showIntegrationPanel ? '−' : '+'}
          </button>
        </div>

        {showIntegrationPanel && (
          <div className="space-y-6">
            {/* Weekly Plan Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Weekly Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {weeklyPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} - Week of {plan.week}
                  </option>
                ))}
              </select>
              
              {currentPlan && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      Progress: {currentPlan.postsScheduled}/{currentPlan.targetPosts} posts
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentPlan.status === 'active' ? 'bg-green-100 text-green-700' :
                      currentPlan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {currentPlan.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {currentPlan.themes.map((theme, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {theme}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={generateAIContent}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    ⚡ Generate AI Content Suggestions
                  </button>
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">AI Content Suggestions</h3>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border border-purple-200 rounded-lg bg-purple-50">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{suggestion}</p>
                        <span className="text-xs text-purple-600">{suggestion.length}/280 characters</span>
                      </div>
                      <button
                        onClick={() => createPostFromSuggestion(suggestion)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Files */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Project Files ({selectedFiles.length} selected)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {projectFiles.slice(0, 8).map(file => (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedFiles.includes(file.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      {selectedFiles.includes(file.id) && (
                        <span className="text-blue-600 font-bold">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Used {file.usageCount}x
                    </div>
                  </div>
                ))}
              </div>
              {projectFiles.length > 8 && (
                <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all {projectFiles.length} files →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const EnhancedPostCard: React.FC<{ post: XPost }> = ({ post }) => {
    const linkedPlan = post.weeklyPlanId ? weeklyPlans.find(p => p.id === post.weeklyPlanId) : null;
    const linkedFiles = post.projectFileIds ? projectFiles.filter(f => post.projectFileIds!.includes(f.id)) : [];

    return (
      <div className="bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-black text-lg font-bold">𝕏</span>
            <span className="text-sm text-gray-500">X</span>
            {post.aiGenerated && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                ⚡ AI
              </span>
            )}
          </div>
          <StatusBadge status={post.status} />
        </div>
        
        <div className="mb-3">
          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
          <div className="text-sm text-gray-500 mt-1">
            {post.content.length}/280 characters
          </div>
        </div>

        {/* Integration indicators */}
        {(linkedPlan || linkedFiles.length > 0 || post.planThemes) && (
          <div className="space-y-2 mb-3">
            {linkedPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="flex items-center gap-2">
                  📅 <span className="text-sm font-medium text-blue-700">
                    {linkedPlan.title}
                  </span>
                </div>
              </div>
            )}
            
            {post.planThemes && post.planThemes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.planThemes.map((theme, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    {theme}
                  </span>
                ))}
              </div>
            )}
            
            {linkedFiles.length > 0 && (
              <div className="flex items-center gap-2">
                📁 <span className="text-sm text-gray-600">
                  {linkedFiles.length} file{linkedFiles.length !== 1 ? 's' : ''} attached
                </span>
              </div>
            )}
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
          <button
            onClick={() => handleDeletePost(post.id)}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
        
        {post.status === 'failed' && post.errorMessage && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            Error: {post.errorMessage}
          </div>
        )}
      </div>
    );
  };

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
        scheduledAt: isScheduled && scheduledAt ? scheduledAt : undefined,
        weeklyPlanId: selectedPlan || undefined,
        projectFileIds: selectedFiles.length > 0 ? selectedFiles : undefined
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

            {selectedPlan && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  Will be linked to: {weeklyPlans.find(p => p.id === selectedPlan)?.title}
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Attached Files ({selectedFiles.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedFiles.map(fileId => {
                    const file = projectFiles.find(f => f.id === fileId);
                    return file ? (
                      <span key={fileId} className="text-xs bg-white px-2 py-1 rounded border">
                        {getFileIcon(file.type)} {file.name}
                      </span>
                    ) : null;
                  })}
                </div>
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <NotificationContainer />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">𝕏 Content Hub</h1>
          <p className="text-gray-600 mt-1">Integrated scheduler with AI planning and project files</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/planner'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📅 Open Planner
          </button>
          <button
            onClick={() => window.location.href = '/project-center'}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📁 Project Center
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + New Post
          </button>
        </div>
      </div>

      {/* X Connection Status */}
      <XConnectionStatus />

      {/* Integration Panel */}
      <IntegrationPanel />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            ⚠️ <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
            𝕏
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Generated</p>
              <p className="text-2xl font-bold text-purple-600">
                {posts.filter(p => p.aiGenerated).length}
              </p>
            </div>
            ⚡
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Files</p>
              <p className="text-2xl font-bold text-green-600">
                {posts.filter(p => p.projectFileIds && p.projectFileIds.length > 0).length}
              </p>
            </div>
            📁
          </div>
        </div>
      </div>

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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{posts.filter(p => p.status === 'scheduled').length} scheduled</span>
              <span>•</span>
              <span>{posts.filter(p => p.status === 'published').length} published</span>
              <span>•</span>
              <span>{posts.filter(p => p.status === 'draft').length} drafts</span>
            </div>
          </div>
          
          {posts.map(post => (
            <EnhancedPostCard key={post.id} post={post} />
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
            Create your first post using AI suggestions or manual input.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Your First Post
            </button>
            <button
              onClick={generateAIContent}
              disabled={!selectedPlan}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              ⚡ Get AI Suggestions
            </button>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && <CreatePostModal />}
    </div>
  );
};

export default IntegrationHub;