// client/shared/types/contentScheduler.ts
export interface ProjectCenterFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadedAt: string;
  processed: boolean;
  extractedData?: ExtractedContentData[];
}

export interface ProjectCenterDrawing {
  id: string;
  name: string;
  createdAt: string;
  thumbnail?: string;
  description?: string;
}

export interface ExtractedContentData {
  title: string;
  description?: string;
  type?: ContentType;
  platform?: Platform;
  tags?: string[];
  priority?: Priority;
  duration?: number;
  preparationTime?: number;
}

export interface ContentProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: string;
  updatedAt: string;
  contentItems: ContentItem[];
  scheduledPosts: ScheduledPost[];
  linkedFiles?: ProjectCenterFile[];
  linkedDrawings?: ProjectCenterDrawing[];
}

export interface ContentItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: ContentType;
  platform?: Platform;
  tags?: string[];
  priority: Priority;
  estimatedDuration?: number;
  preparationTime?: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  sourceFile?: string;
  sourceDrawing?: string;
}

export interface ScheduledPost {
  id: string;
  projectId: string;
  contentId: string;
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  status: ScheduleStatus;
  aiReason?: string;
  estimatedEngagement?: EngagementLevel;
  createdAt: string;
}

// Types
export type ContentType = 
  | 'tutorial' 
  | 'showcase' 
  | 'behind-scenes' 
  | 'live-stream' 
  | 'announcement' 
  | 'community';

export type Platform = 
  | 'youtube' 
  | 'twitch' 
  | 'twitter' 
  | 'instagram' 
  | 'tiktok' 
  | 'discord';

export type Priority = 'high' | 'medium' | 'low';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type ScheduleStatus = 'scheduled' | 'published' | 'failed' | 'cancelled';
export type EngagementLevel = 'high' | 'medium' | 'low';