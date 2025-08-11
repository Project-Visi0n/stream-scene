// server/services/mockXApiService.ts

interface MockXPost {
  id: string;
  userId: string;
  content: string;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: any[];
  errorMessage?: string;
  xPostId?: string;
  analytics?: {
    retweets: number;
    likes: number;
    replies: number;
    views: number;
  };
}

interface MockXConnection {
  userId: string;
  username: string;
  profileImage: string;
  isConnected: boolean;
  connectedAt: Date;
}

class MockXApiService {
  private posts: Map<string, MockXPost> = new Map();
  private connections: Map<string, MockXConnection> = new Map();
  private mediaLibrary: Map<string, any> = new Map();

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample posts for demo
    const samplePosts: MockXPost[] = [
      {
        id: 'post_1',
        userId: 'user_123',
        content: 'Just launched our new X content scheduler! 🚀 Building the future of social media management. #XScheduler #ProductLaunch #TechInnovation',
        scheduledAt: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'published',
        xPostId: 'x_12345',
        analytics: {
          retweets: 23,
          likes: 156,
          replies: 12,
          views: 2341
        }
      },
      {
        id: 'post_2',
        userId: 'user_123',
        content: 'Working on some exciting new features for content creators. The future is automated! ✨ What features would you like to see?',
        scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        status: 'scheduled',
        analytics: {
          retweets: 0,
          likes: 0,
          replies: 0,
          views: 0
        }
      },
      {
        id: 'post_3',
        userId: 'user_123',
        content: 'Behind the scenes of building our content management platform. Here\'s what we learned about scaling social media automation...',
        scheduledAt: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'published',
        xPostId: 'x_67890',
        analytics: {
          retweets: 8,
          likes: 67,
          replies: 5,
          views: 892
        }
      }
    ];

    // Add sample posts
    samplePosts.forEach(post => {
      this.posts.set(post.id, post);
    });

    // Sample connection
    this.connections.set('user_123', {
      userId: 'user_123',
      username: 'streamscene_dev',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=streamscene',
      isConnected: true,
      connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    });
  }

  // Simulate API delays
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Simulate occasional API errors
  private shouldSimulateError(): boolean {
    // 5% chance of simulated error for testing
    return Math.random() < 0.05;
  }

  // Connection Management
  async getConnection(userId: string): Promise<MockXConnection | null> {
    await this.delay(300);
    return this.connections.get(userId) || null;
  }

  async connectUser(userId: string): Promise<{ authUrl: string }> {
    await this.delay(500);
    
    // Simulate OAuth flow
    const authUrl = `/mock-auth/x?user_id=${userId}&state=${Date.now()}`;
    return { authUrl };
  }

  async handleOAuthCallback(userId: string, oauthData: any): Promise<MockXConnection> {
    await this.delay(800);

    const connection: MockXConnection = {
      userId,
      username: `user_${userId.slice(-4)}`,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      isConnected: true,
      connectedAt: new Date()
    };

    this.connections.set(userId, connection);
    return connection;
  }

  async disconnectUser(userId: string): Promise<void> {
    await this.delay(300);
    this.connections.delete(userId);
  }

  // Post Management
  async getPosts(userId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<{ posts: MockXPost[]; hasMore: boolean; total: number }> {
    await this.delay(400);

    if (this.shouldSimulateError()) {
      throw new Error('Simulated API error - please try again');
    }

    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let filteredPosts = userPosts;

    // Apply status filter
    if (options.status) {
      const statusArray = options.status.split(',');
      filteredPosts = filteredPosts.filter(post => statusArray.includes(post.status));
    }

    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);
    const hasMore = offset + limit < filteredPosts.length;

    return {
      posts: paginatedPosts,
      hasMore,
      total: filteredPosts.length
    };
  }

  async createPost(userId: string, postData: {
    content: string;
    scheduledAt?: string;
    mediaIds?: string[];
  }): Promise<MockXPost> {
    await this.delay(600);

    if (this.shouldSimulateError()) {
      throw new Error('Failed to post to X - please try again');
    }

    // Validate connection
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('X account not connected');
    }

    // Validate content
    if (!postData.content.trim()) {
      throw new Error('Post content is required');
    }

    if (postData.content.length > 280) {
      throw new Error(`Content exceeds 280 character limit (${postData.content.length} characters)`);
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledAt = postData.scheduledAt ? new Date(postData.scheduledAt) : null;
    const isImmediate = !scheduledAt || scheduledAt <= new Date();

    const newPost: MockXPost = {
      id: postId,
      userId,
      content: postData.content,
      scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: isImmediate ? 'published' : 'scheduled',
      media: postData.mediaIds ? postData.mediaIds.map(id => this.mediaLibrary.get(id)) : [],
      xPostId: isImmediate ? `x_${Date.now()}` : undefined,
      analytics: isImmediate ? {
        retweets: 0,
        likes: 0,
        replies: 0,
        views: 0
      } : undefined
    };

    this.posts.set(postId, newPost);

    // Simulate engagement growth for published posts
    if (isImmediate) {
      this.simulateEngagementGrowth(postId);
    }

    return newPost;
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    await this.delay(300);

    const post = this.posts.get(postId);
    if (!post || post.userId !== userId) {
      throw new Error('Post not found');
    }

    this.posts.delete(postId);
  }

  // Media Management
  async uploadMedia(userId: string, file: any): Promise<any> {
    await this.delay(1000); // Simulate longer upload time

    if (this.shouldSimulateError()) {
      throw new Error('Media upload failed - please try again');
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockMedia = {
      id: mediaId,
      type: file.type?.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      xMediaId: `x_media_${Date.now()}`
    };

    this.mediaLibrary.set(mediaId, mockMedia);
    return mockMedia;
  }

  // Analytics
  async getAnalytics(userId: string, options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    await this.delay(500);

    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId && post.status === 'published');

    const totalPosts = Array.from(this.posts.values()).filter(p => p.userId === userId).length;
    const publishedPosts = userPosts.length;
    const scheduledPosts = Array.from(this.posts.values())
      .filter(p => p.userId === userId && p.status === 'scheduled').length;
    const failedPosts = Array.from(this.posts.values())
      .filter(p => p.userId === userId && p.status === 'failed').length;

    const totalLikes = userPosts.reduce((sum, post) => sum + (post.analytics?.likes || 0), 0);
    const totalRetweets = userPosts.reduce((sum, post) => sum + (post.analytics?.retweets || 0), 0);
    const totalReplies = userPosts.reduce((sum, post) => sum + (post.analytics?.replies || 0), 0);
    const totalViews = userPosts.reduce((sum, post) => sum + (post.analytics?.views || 0), 0);

    // Generate recent activity data
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      recentActivity.push({
        date: date.toISOString().split('T')[0],
        posts: Math.floor(Math.random() * 3) + 1,
        likes: Math.floor(Math.random() * 50) + 10,
        retweets: Math.floor(Math.random() * 20) + 2
      });
    }

    return {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      failedPosts,
      totalEngagement: totalLikes + totalRetweets + totalReplies,
      metrics: {
        totalLikes,
        totalRetweets,
        totalReplies,
        totalViews
      },
      recentActivity
    };
  }

  // Simulate realistic engagement growth
  private simulateEngagementGrowth(postId: string) {
    const post = this.posts.get(postId);
    if (!post || !post.analytics) return;

    // Simulate gradual engagement growth
    const intervals = [
      { delay: 30000, likes: 1, retweets: 0, replies: 0, views: 15 }, // 30 seconds
      { delay: 120000, likes: 3, retweets: 1, replies: 0, views: 45 }, // 2 minutes
      { delay: 300000, likes: 8, retweets: 2, replies: 1, views: 120 }, // 5 minutes
      { delay: 900000, likes: 15, retweets: 4, replies: 2, views: 280 }, // 15 minutes
    ];

    intervals.forEach(interval => {
      setTimeout(() => {
        const currentPost = this.posts.get(postId);
        if (currentPost && currentPost.analytics) {
          currentPost.analytics.likes += interval.likes;
          currentPost.analytics.retweets += interval.retweets;
          currentPost.analytics.replies += interval.replies;
          currentPost.analytics.views += interval.views;
          this.posts.set(postId, currentPost);
        }
      }, interval.delay);
    });
  }

  // Background job simulation
  async processScheduledPosts(): Promise<void> {
    const now = new Date();
    const readyPosts = Array.from(this.posts.values())
      .filter(post => 
        post.status === 'scheduled' && 
        post.scheduledAt && 
        post.scheduledAt <= now
      );

    for (const post of readyPosts) {
      // Simulate 5% failure rate
      if (Math.random() < 0.05) {
        post.status = 'failed';
        post.errorMessage = 'Failed to publish to X';
      } else {
        post.status = 'published';
        post.xPostId = `x_${Date.now()}`;
        post.analytics = {
          retweets: 0,
          likes: 0,
          replies: 0,
          views: 0
        };
        // Start engagement simulation
        this.simulateEngagementGrowth(post.id);
      }
      
      post.updatedAt = new Date();
      this.posts.set(post.id, post);
      
      console.log(`Mock: Published scheduled post ${post.id}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    await this.delay(100);
    return {
      status: 'healthy',
      message: 'Mock X API service is running'
    };
  }
}

// Export singleton instance
export const mockXApiService = new MockXApiService();

// Start background job simulation
setInterval(() => {
  mockXApiService.processScheduledPosts();
}, 60000); // Check every minute

export default mockXApiService;