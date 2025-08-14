// client/types/contentScheduler.ts

export interface SocialPlatform {
  id: 'threads';
  name: string;
  connected: boolean;
  accessToken?: string;
  userId?: string;
  username?: string;
}

export interface PostContent {
  id: string;
  text: string;
  media: ProjectFile[];
  platforms: ['threads'];
  scheduledDate?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  thumbnailUrl?: string;
}

export interface ScheduledPost extends PostContent {
  scheduledDate: Date;
  platforms: ['threads'];
  calendarEventId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'post' | 'reminder' | 'content-idea';
  postId?: string;
  platforms?: ['threads'];
}

export interface SocialAuthResponse {
  platform: 'threads';
  accessToken: string;
  refreshToken?: string;
  userId: string;
  username: string;
  expiresAt?: Date;
}

export interface PostAnalytics {
  platform: 'threads';
  postId: string;
  likes: number;
  shares: number;
  comments: number;
  impressions: number;
  engagement: number;
}

// Threads-specific interfaces
export interface ThreadsMedia {
  imageUrls?: string[];
  videoUrl?: string;
}

export interface ThreadsPostRequest {
  accountId: string;
  text: string;
  media?: ThreadsMedia;
  scheduledFor?: string;
}

export interface ThreadsPostResponse {
  post: {
    id: string;
    text: string;
    scheduledFor?: string;
    status: 'scheduled' | 'published' | 'failed';
  };
}

export interface ThreadsStatusResponse {
  ok: boolean;
  connected: boolean;
  accountId?: string;
}