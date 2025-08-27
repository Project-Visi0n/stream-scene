// server/services/ThreadsService.ts
import fetch from 'node-fetch';

export interface ThreadsConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  userId?: string;
}

export interface ThreadsPostResult {
  id: string;
  permalink?: string;
}

export class ThreadsService {
  private baseURL = 'https://graph.threads.net';
  private config: ThreadsConfig;

  constructor(config: ThreadsConfig) {
    this.config = config;
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(redirectUri: string, scopes: string[] = ['threads_basic', 'threads_content_publish']): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state: this.generateState()
    });

    return `https://threads.net/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string, redirectUri: string): Promise<{ access_token: string; user_id: string }> {
    try {
      const response = await fetch(`${this.baseURL}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code
        })
      });

      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error_description || data.error || 'Unknown error'}`);
      }

      this.config.accessToken = data.access_token;
      this.config.userId = data.user_id;

      return {
        access_token: data.access_token,
        user_id: data.user_id
      };
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Post text content to Threads
   */
  async postText(text: string, options?: {
    reply_control?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';
  }): Promise<ThreadsPostResult> {
    if (!this.config.accessToken || !this.config.userId) {
      throw new Error('Access token and user ID are required');
    }

    try {
      // Create media container
      const containerParams: any = {
        media_type: 'TEXT',
        text: text,
        access_token: this.config.accessToken
      };

      if (options?.reply_control) {
        containerParams.reply_control = options.reply_control;
      }

      const containerResponse = await fetch(
        `${this.baseURL}/${this.config.userId}/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(containerParams)
        }
      );

      const containerData = await containerResponse.json() as any;

      if (!containerResponse.ok) {
        throw new Error(`Container creation failed: ${containerData.error?.message || 'Unknown error'}`);
      }

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Publish the post
      const publishParams = new URLSearchParams({
        creation_id: containerData.id,
        access_token: this.config.accessToken
      });

      const publishResponse = await fetch(
        `${this.baseURL}/${this.config.userId}/threads_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: publishParams
        }
      );

      const publishData = await publishResponse.json() as any;

      if (!publishResponse.ok) {
        throw new Error(`Publish failed: ${publishData.error?.message || 'Unknown error'}`);
      }

      return {
        id: publishData.id,
        permalink: `https://threads.net/post/${publishData.id}`
      };
    } catch (error: any) {
      throw new Error(`Failed to post text: ${error.message}`);
    }
  }

  /**
   * Post image with caption
   */
  async postImage(imageUrl: string, caption?: string, options?: {
    reply_control?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';
  }): Promise<ThreadsPostResult> {
    if (!this.config.accessToken || !this.config.userId) {
      throw new Error('Access token and user ID are required');
    }

    try {
      // Create media container
      const containerParams: any = {
        media_type: 'IMAGE',
        image_url: imageUrl,
        access_token: this.config.accessToken
      };

      if (caption) containerParams.text = caption;
      if (options?.reply_control) containerParams.reply_control = options.reply_control;

      const containerResponse = await fetch(
        `${this.baseURL}/${this.config.userId}/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(containerParams)
        }
      );

      const containerData = await containerResponse.json() as any;

      if (!containerResponse.ok) {
        throw new Error(`Container creation failed: ${containerData.error?.message || 'Unknown error'}`);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Publish the post
      const publishParams = new URLSearchParams({
        creation_id: containerData.id,
        access_token: this.config.accessToken
      });

      const publishResponse = await fetch(
        `${this.baseURL}/${this.config.userId}/threads_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: publishParams
        }
      );

      const publishData = await publishResponse.json() as any;

      if (!publishResponse.ok) {
        throw new Error(`Publish failed: ${publishData.error?.message || 'Unknown error'}`);
      }

      return {
        id: publishData.id,
        permalink: `https://threads.net/post/${publishData.id}`
      };
    } catch (error: any) {
      throw new Error(`Failed to post image: ${error.message}`);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId?: string): Promise<any> {
    const targetUserId = userId || this.config.userId;
    
    if (!this.config.accessToken || !targetUserId) {
      throw new Error('Access token and user ID are required');
    }

    try {
      const params = new URLSearchParams({
        fields: 'id,username,name,biography,profile_picture_url,followers_count,media_count',
        access_token: this.config.accessToken
      });

      const response = await fetch(
        `${this.baseURL}/${targetUserId}?${params.toString()}`
      );

      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Test connection by getting user profile
   */
  async testConnection(): Promise<any> {
    return this.getUserProfile();
  }

  /**
   * Generate a random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export default ThreadsService;