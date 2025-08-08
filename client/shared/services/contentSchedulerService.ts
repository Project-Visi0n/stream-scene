// client/shared/services/contentSchedulerService.ts
import {
  ScheduledPost,
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsRequest,
  GetPostsResponse,
  AnalyticsRequest,
  AnalyticsResponse,
  ContentTemplate,
  PlatformConnection,
  BulkUploadJob,
  DraftPost,
  MediaAsset,
  Platform
} from '../types/contentScheduler';

class ContentSchedulerService {
  private baseUrl = '/api/content-scheduler';

  // Posts CRUD operations
  async createPost(data: CreatePostRequest): Promise<ScheduledPost> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`);
    }

    return response.json();
  }

  async getPosts(params: GetPostsRequest = {}): Promise<GetPostsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.set(key, value.toString());
        }
      }
    });

    const response = await fetch(`${this.baseUrl}/posts?${queryParams}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json();
  }

  async getPost(id: string): Promise<ScheduledPost> {
    const response = await fetch(`${this.baseUrl}/posts/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json();
  }

  async updatePost(data: UpdatePostRequest): Promise<ScheduledPost> {
    const response = await fetch(`${this.baseUrl}/posts/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.statusText}`);
    }

    return response.json();
  }

  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/posts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.statusText}`);
    }
  }

  async duplicatePost(id: string, newScheduledTime?: Date): Promise<ScheduledPost> {
    const response = await fetch(`${this.baseUrl}/posts/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ newScheduledTime }),
    });

    if (!response.ok) {
      throw new Error(`Failed to duplicate post: ${response.statusText}`);
    }

    return response.json();
  }

  // Media upload operations
  async uploadMedia(file: File, projectId?: string): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('media', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    const response = await fetch(`${this.baseUrl}/media/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.statusText}`);
    }

    return response.json();
  }

  async getMediaAssets(limit = 20, offset = 0): Promise<{ assets: MediaAsset[]; total: number }> {
    const response = await fetch(
      `${this.baseUrl}/media?limit=${limit}&offset=${offset}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch media assets: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteMedia(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/media/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete media: ${response.statusText}`);
    }
  }

  // Analytics operations
  async getAnalytics(params: AnalyticsRequest): Promise<AnalyticsResponse> {
    const queryParams = new URLSearchParams({
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
    });

    if (params.platforms) {
      params.platforms.forEach(platform => queryParams.append('platforms', platform));
    }
    if (params.postIds) {
      params.postIds.forEach(id => queryParams.append('postIds', id));
    }
    if (params.groupBy) {
      queryParams.set('groupBy', params.groupBy);
    }

    const response = await fetch(`${this.baseUrl}/analytics?${queryParams}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async refreshPostAnalytics(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/analytics/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh analytics: ${response.statusText}`);
    }
  }

  // Platform connections
  async getPlatformConnections(): Promise<PlatformConnection[]> {
    const response = await fetch(`${this.baseUrl}/platforms/connections`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch platform connections: ${response.statusText}`);
    }

    return response.json();
  }

  async connectPlatform(platform: Platform): Promise<{ authUrl: string }> {
    const response = await fetch(`${this.baseUrl}/platforms/${platform}/connect`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to connect platform: ${response.statusText}`);
    }

    return response.json();
  }

  async disconnectPlatform(platform: Platform): Promise<void> {
    const response = await fetch(`${this.baseUrl}/platforms/${platform}/disconnect`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to disconnect platform: ${response.statusText}`);
    }
  }

  // Templates
  async getTemplates(category?: string): Promise<ContentTemplate[]> {
    const url = category 
      ? `${this.baseUrl}/templates?category=${encodeURIComponent(category)}`
      : `${this.baseUrl}/templates`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    return response.json();
  }

  async createTemplate(template: Omit<ContentTemplate, 'id' | 'createdBy' | 'usageCount'>): Promise<ContentTemplate> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }

    return response.json();
  }

  async useTemplate(templateId: string): Promise<ContentTemplate> {
    const response = await fetch(`${this.baseUrl}/templates/${templateId}/use`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to use template: ${response.statusText}`);
    }

    return response.json();
  }

  // Bulk operations
  async bulkUpload(file: File): Promise<BulkUploadJob> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/bulk/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to start bulk upload: ${response.statusText}`);
    }

    return response.json();
  }

  async getBulkUploadStatus(jobId: string): Promise<BulkUploadJob> {
    const response = await fetch(`${this.baseUrl}/bulk/jobs/${jobId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bulk upload status: ${response.statusText}`);
    }

    return response.json();
  }

  async bulkUpdateStatus(postIds: string[], status: 'draft' | 'scheduled' | 'cancelled'): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bulk/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ postIds, status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update status: ${response.statusText}`);
    }
  }

  async bulkDelete(postIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bulk/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ postIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk delete posts: ${response.statusText}`);
    }
  }

  // Draft operations
  async saveDraft(data: Omit<DraftPost, 'id' | 'userId' | 'savedAt'>): Promise<DraftPost> {
    const response = await fetch(`${this.baseUrl}/drafts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to save draft: ${response.statusText}`);
    }

    return response.json();
  }

  async getDrafts(): Promise<DraftPost[]> {
    const response = await fetch(`${this.baseUrl}/drafts`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch drafts: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteDraft(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/drafts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete draft: ${response.statusText}`);
    }
  }

  // AI-powered features
  async generateHashtags(content: string, platforms: Platform[]): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/ai/hashtags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, platforms }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate hashtags: ${response.statusText}`);
    }

    const data = await response.json();
    return data.hashtags;
  }

  async optimizeContent(content: string, platform: Platform): Promise<string> {
    const response = await fetch(`${this.baseUrl}/ai/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, platform }),
    });

    if (!response.ok) {
      throw new Error(`Failed to optimize content: ${response.statusText}`);
    }

    const data = await response.json();
    return data.optimizedContent;
  }

  async suggestBestTimes(platforms: Platform[]): Promise<{ [K in Platform]?: Date[] }> {
    const response = await fetch(`${this.baseUrl}/ai/best-times`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ platforms }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get best time suggestions: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility methods
  async validateContent(content: string, platforms: Platform[]): Promise<{
    [K in Platform]?: {
      valid: boolean;
      issues: string[];
      suggestions: string[];
    };
  }> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, platforms }),
    });

    if (!response.ok) {
      throw new Error(`Failed to validate content: ${response.statusText}`);
    }

    return response.json();
  }

  async getPostPreview(postId: string, platform: Platform): Promise<{ previewUrl: string }> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/preview/${platform}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get post preview: ${response.statusText}`);
    }

    return response.json();
  }

  // Queue management
  async retryFailedPost(postId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/retry`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to retry post: ${response.statusText}`);
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    nextScheduled?: Date;
  }> {
    const response = await fetch(`${this.baseUrl}/queue/status`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get queue status: ${response.statusText}`);
    }

    return response.json();
  }
}

export const contentSchedulerService = new ContentSchedulerService();
export default contentSchedulerService;