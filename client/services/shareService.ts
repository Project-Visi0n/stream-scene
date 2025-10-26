// Service for managing file sharing operations with the backend

export interface ShareRecord {
  id: number;
  fileId?: number;
  canvasId?: number;
  resourceType: 'file' | 'canvas';
  shareType: 'one-time' | 'indefinite';
  accessCount: number;
  maxAccess: number | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  canAccess: boolean;
  shareUrl: string;
  shareToken: string;
}

export interface CreateShareRequest {
  fileId?: number;
  canvasId?: number;
  resourceType: 'file' | 'canvas';
  shareType: 'one-time' | 'indefinite';
  expiresAt?: string; // ISO date string
}

export interface SharedFileAccess {
  file?: {
    id: number;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
  };
  canvas?: {
    id: number;
    name: string;
    description?: string;
    canvasData: string;
    backgroundColor?: string;
    shareToken: string;
    allowAnonymousEdit: boolean;
    isPublic: boolean;
  };
  share: {
    shareType: 'one-time' | 'indefinite';
    accessCount: number;
    maxAccess: number | null;
    remainingAccess: number | null;
  };
}

// Get the API base URL - works for both localhost and deployed environments
const getApiBaseUrl = (): string => {
  // If we're on localhost, use localhost backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api/shares';
  }
  
  // For deployed environments, use same domain with /api/shares
  return `${window.location.protocol}//${window.location.host}/api/shares`;
};

const API_BASE = getApiBaseUrl();

export const shareService = {
  // Create a new share for a file or canvas
  async createShare(shareData: CreateShareRequest): Promise<ShareRecord> {
    try {
      const endpoint = shareData.resourceType === 'canvas' ? `${API_BASE}/canvas` : API_BASE;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(shareData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create share: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.share;
    } catch (error) {

      throw error;
    }
  },

  // Get all shares for a specific file
  async getFileShares(fileId: number): Promise<ShareRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/file/${fileId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch file shares: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.shares || [];
    } catch (error) {

      throw error;
    }
  },

  // Get all shares for a specific canvas
  async getCanvasShares(canvasId: number): Promise<ShareRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/canvas/${canvasId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch canvas shares: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.shares || [];
    } catch (error) {

      throw error;
    }
  },

  // Get all shares for the authenticated user
  async getUserShares(): Promise<ShareRecord[]> {
    try {
      const response = await fetch(API_BASE, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch user shares: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.shares || [];
    } catch (error) {

      throw error;
    }
  },

  // Access a shared file (public endpoint)
  async accessSharedFile(token: string): Promise<SharedFileAccess> {
    try {
      const response = await fetch(`${API_BASE}/shared/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to access shared file: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {

      throw error;
    }
  },

  // Deactivate a share
  async deactivateShare(shareId: number): Promise<ShareRecord> {
    try {
      const response = await fetch(`${API_BASE}/${shareId}/deactivate`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to deactivate share: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.share;
    } catch (error) {

      throw error;
    }
  },

  // Delete a share
  async deleteShare(shareId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${shareId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete share: ${response.statusText}`);
      }
    } catch (error) {

      throw error;
    }
  },

  // Utility function to copy share URL to clipboard
  async copyShareUrl(shareUrl: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  }
};
