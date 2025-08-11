// client/shared/services/xContentSchedulerService.ts

interface XPost {
  id: string;
  content: string;
  scheduledAt: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media?: XMedia[];
  createdAt: string;
  publishedAt?: string;
  errorMessage?: string;
  analytics?: {
    retweets?: number;
    likes?: number;
    replies?: number;
    views?: number;
  };
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

interface AnalyticsData {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  totalEngagement: number;
  metrics: {
    totalLikes: number;
    totalRetweets: number;
    totalReplies: number;
    totalViews: number;
  };
  recentActivity: Array<{
    date: string;
    posts: number;
    likes: number;
    retweets: number;
  }>;
}

class XContentSchedulerService {
  private readonly baseUrl = '/api/content-scheduler'; // Back to original

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Connection Management
  async getConnection(): Promise<XConnection> {
    return this.request<XConnection>('/connection');
  }

  async connectX(): Promise<{ authUrl: string }> {
    return this.request<{ authUrl: string }>('/connect', {
      method: 'POST',
    });
  }

  async handleOAuthCallback(oauthToken: string, oauthVerifier: string): Promise<XConnection> {
    return this.request<XConnection>('/callback', {
      method: 'POST',
      body: JSON.stringify({
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier,
      }),
    });
  }

  async disconnectX(): Promise<void> {
    return this.request<void>('/disconnect', {
      method: 'DELETE',
    });
  }

  // Post Management
  async getPosts(params: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<{ posts: XPost[]; hasMore: boolean; total: number }> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const endpoint = query ? `/posts?${query}` : '/posts';
    
    return this.request<{ posts: XPost[]; hasMore: boolean; total: number }>(endpoint);
  }

  async createPost(postData: CreatePostRequest): Promise<XPost> {
    return this.request<XPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: string): Promise<void> {
    return this.request<void>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Media Management
  async uploadMedia(file: File): Promise<XMedia> {
    const formData = new FormData();
    formData.append('media', file);

    // Don't set Content-Type header for FormData - let browser set it
    return fetch(`${this.baseUrl}/media/upload`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload media');
      }
      return response.json();
    });
  }

  // Analytics
  async getAnalytics(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AnalyticsData> {
    const searchParams = new URLSearchParams();
    
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const query = searchParams.toString();
    const endpoint = query ? `/analytics?${query}` : '/analytics';
    
    return this.request<AnalyticsData>(endpoint);
  }

  // Utility Methods
  validatePostContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content.trim()) {
      errors.push('Post content cannot be empty');
    }

    if (content.length > 280) {
      errors.push(`Content exceeds 280 character limit (current: ${content.length})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  formatScheduledDate(date: Date): string {
    return date.toISOString();
  }

  parseScheduledDate(dateString: string): Date {
    return new Date(dateString);
  }

  // Character count helper
  getCharacterCount(content: string): { count: number; remaining: number; isValid: boolean } {
    const count = content.length;
    const remaining = 280 - count;
    const isValid = count <= 280;

    return { count, remaining, isValid };
  }

  // Hashtag and mention extraction
  extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g) || [];
    return hashtags.map(tag => tag.slice(1)); // Remove the # symbol
  }

  extractMentions(content: string): string[] {
    const mentions = content.match(/@\w+/g) || [];
    return mentions.map(mention => mention.slice(1)); // Remove the @ symbol
  }

  // URL shortening helper (if needed)
  async shortenUrls(content: string): Promise<string> {
    // Implementation for URL shortening service integration
    // For now, just return the original content
    return content;
  }

  // Scheduling helpers
  getSchedulingOptions(): Array<{ label: string; value: Date }> {
    const now = new Date();
    const options = [
      {
        label: 'In 5 minutes',
        value: new Date(now.getTime() + 5 * 60 * 1000),
      },
      {
        label: 'In 1 hour',
        value: new Date(now.getTime() + 60 * 60 * 1000),
      },
      {
        label: 'In 4 hours',
        value: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      },
      {
        label: 'Tomorrow at 9 AM',
        value: (() => {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          return tomorrow;
        })(),
      },
      {
        label: 'Next week',
        value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    return options;
  }

  // Error handling helper
  handleApiError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error?.error) {
      return error.error;
    }

    return 'An unexpected error occurred';
  }

  // Local storage helpers for drafts
  saveDraft(content: string, scheduledAt?: string): void {
    const draft = {
      content,
      scheduledAt,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem('x-scheduler-draft', JSON.stringify(draft));
  }

  getDraft(): { content: string; scheduledAt?: string; savedAt: string } | null {
    try {
      const draftStr = localStorage.getItem('x-scheduler-draft');
      return draftStr ? JSON.parse(draftStr) : null;
    } catch {
      return null;
    }
  }

  clearDraft(): void {
    localStorage.removeItem('x-scheduler-draft');
  }

  // Statistics helpers
  calculateEngagementRate(post: XPost): number {
    if (!post.analytics) return 0;
    
    const { likes = 0, retweets = 0, replies = 0, views = 0 } = post.analytics;
    const totalEngagement = likes + retweets + replies;
    
    return views > 0 ? (totalEngagement / views) * 100 : 0;
  }

  getBestPostingTimes(): Array<{ hour: number; label: string; description: string }> {
    // Based on general X engagement data
    return [
      { hour: 9, label: '9:00 AM', description: 'Morning commute peak' },
      { hour: 12, label: '12:00 PM', description: 'Lunch break engagement' },
      { hour: 15, label: '3:00 PM', description: 'Afternoon peak' },
      { hour: 17, label: '5:00 PM', description: 'Evening commute' },
      { hour: 19, label: '7:00 PM', description: 'Prime time engagement' },
    ];
  }
}

// Export singleton instance
const xContentSchedulerService = new XContentSchedulerService();
export default xContentSchedulerService;