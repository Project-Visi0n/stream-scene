// client/shared/types/contentScheduler.ts

export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending';

export type ViewMode = 'calendar' | 'list';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

// Platform configuration constant
export const PLATFORM_CONFIG = {
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-400',
    maxLength: 280
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600',
    maxLength: 63206
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-pink-500',
    maxLength: 2200
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700',
    maxLength: 3000
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    maxLength: 150
  },
  youtube: {
    name: 'YouTube',
    icon: '📺',
    color: 'bg-red-500',
    maxLength: 5000
  }
} as const;

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface PostContent {
  text: string;
  mediaAssets: MediaAsset[];
  hashtags: string[];
  mentions: string[];
}

export interface RecurrenceSettings {
  type: RecurrenceType;
  interval?: number; // Every X days/weeks/months
  endDate?: Date;
  daysOfWeek?: number[]; // For weekly recurrence (0 = Sunday)
}

export interface ScheduledPost {
  id: string;
  userId: string;
  platforms: Platform[];
  content: string; // Changed from PostContent to string to match your component
  media?: MediaAsset[]; // Added optional media array
  scheduledAt?: string; // Changed from scheduledTime and made optional
  createdAt: Date;
  updatedAt: Date;
  status: PostStatus;
  recurrence?: RecurrenceSettings;
  projectId?: string; // Link to Project Center
  templateId?: string; // Added templateId
  analytics?: {
    impressions?: number;
    engagement?: number;
    clicks?: number;
  };
  errorMessage?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  content: PostContent;
  platforms: Platform[];
  userId: string;
  createdAt: Date;
}

export interface PlatformConnection {
  platform: Platform;
  isConnected: boolean;
  username?: string;
  expiresAt?: Date;
  permissions?: string[];
}

export interface SchedulerFilters {
  platforms?: Platform[];
  status?: PostStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  platforms: Platform[];
  status: PostStatus;
  content: string;
}

export interface PlatformCredentials {
  platform: Platform;
  connected: boolean;
  username?: string;
  expiresAt?: Date;
  permissions?: string[];
}

export interface CreatePostRequest {
  platforms: Platform[];
  content: string; // Changed from PostContent to string
  scheduledAt: string; // Changed from scheduledTime
  mediaIds?: string[]; // Added mediaIds
  templateId?: string; // Added templateId
  recurrence?: RecurrenceSettings;
  projectId?: string;
}

export interface UpdatePostRequest {
  id: string;
  platforms?: Platform[];
  content?: string; // Changed from Partial<PostContent>
  scheduledAt?: string; // Changed from scheduledTime
  recurrence?: RecurrenceSettings;
}

export interface BulkScheduleRequest {
  posts: CreatePostRequest[];
  templateId?: string;
}

export interface AnalyticsResponse {
  totalPosts: number;
  publishedPosts: number;
  failedPosts: number;
  totalEngagement: number;
  platformBreakdown: Record<Platform, {
    posts: number;
    engagement: number;
  }>;
  recentActivity: {
    date: string;
    posts: number;
    engagement: number;
  }[];
}