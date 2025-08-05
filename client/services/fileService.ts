// Service for managing file operations with the backend
export interface FileRecord {
  id: number;
  userId: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface CreateFileRequest {
  name: string;
  originalName?: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
}

const API_BASE = 'http://localhost:8000/api/files';

export const fileService = {
  // Get all files for the authenticated user
  async getFiles(): Promise<FileRecord[]> {
    try {
      const response = await fetch(API_BASE, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // Create a new file record
  async createFile(fileData: CreateFileRequest): Promise<FileRecord> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(fileData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create file record: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error creating file record:', error);
      throw error;
    }
  },

  // Get a specific file by ID
  async getFile(id: number): Promise<FileRecord> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },

  // Delete a file
  async deleteFile(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Update file metadata
  async updateFile(id: number, updates: Partial<Pick<FileRecord, 'name'>>): Promise<FileRecord> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.file;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }
};
