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
  type: 'post' | 'reminder' | 'content-idea' | 'canvas-session' | 'canvas-meeting';
  postId?: string;
  platforms?: ['threads'];
  canvasId?: string;
  collaborators?: string[];
  duration?: number; // Duration in minutes
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
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

// Canvas-specific calendar interfaces
export interface CanvasSession {
  id: string;
  canvasId: string;
  title: string;
  description?: string;
  scheduledDate: Date;
  duration: number; // Duration in minutes
  organizer: string; // User ID of the organizer
  collaborators: string[]; // Array of user IDs or email addresses
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  calendarEventId?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasCalendarEvent extends CalendarEvent {
  type: 'canvas-session' | 'canvas-meeting';
  canvasId: string;
  collaborators: string[];
  duration: number;
  sessionId?: string;
}