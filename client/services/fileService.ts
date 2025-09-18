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
  tags?: string[];
  uploadedAt: string;
  updatedAt: string;
  captionUrl?: string; // URL for video captions (VTT format)
}

export interface CreateFileRequest {
  name: string;
  originalName?: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
  tags?: string[];
}

const API_BASE = '/api/files';

export const fileService = {
  // Get all files for the authenticated user
  async getFiles(tags?: string[]): Promise<FileRecord[]> {
    try {
      let url = API_BASE;
      if (tags && tags.length > 0) {
        url += `?tags=${tags.join(',')}`;
      }
      
      const response = await fetch(url, {
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
  async updateFile(id: number, updates: Partial<FileRecord>): Promise<FileRecord> {
    try {
      console.log('Updating file:', id, 'with data:', updates);
      
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update failed:', response.status, errorData);
        throw new Error(`Failed to update file: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Update response:', result);
      return result;
    } catch (error) {
      console.error('Error in updateFile:', error);
      throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get all unique tags for the authenticated user
  async getUserTags(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/tags/list`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tags || [];
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }
};

// File upload and handling service
export const uploadFile = async (file: File): Promise<{ file: FileRecord; preview?: string }> => {
  try {
    console.log('Starting upload for file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // For video files, use the conversion-enabled upload
    if (file.type.startsWith('video/')) {
      return await handleVideoUpload(file);
    } else {
      return await handleRegularUpload(file);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

const handleVideoUpload = async (file: File): Promise<{ file: FileRecord; preview?: string }> => {
  console.log('[VideoUpload] Starting video processing for:', file.name);
  
  // Your S3 upload route already handles conversion!
  const uploadResult = await uploadToS3(file);
  
  if (!uploadResult.success || !uploadResult.url) {
    throw new Error('Video upload to S3 failed');
  }

  console.log('[VideoUpload] Upload successful. Converted:', uploadResult.converted);

  // Create file record in database with S3 URL (already converted if needed)
  const fileRecord = await createFileRecord({
    name: file.name,
    originalName: file.name,
    type: uploadResult.converted ? 'video/mp4' : file.type,
    size: file.size,
    s3Key: uploadResult.s3Key,
    url: uploadResult.url, // This is already the converted MP4 URL
    tags: []
  });

  console.log('[VideoUpload] File record created:', fileRecord.id);

  return {
    file: fileRecord,
    preview: uploadResult.url // Use S3 URL for preview
  };
};

const handleRegularUpload = async (file: File): Promise<{ file: FileRecord; preview?: string }> => {
  // Handle non-video files
  const uploadResult = await uploadToS3(file);
  
  if (!uploadResult.success || !uploadResult.url) {
    throw new Error('Upload to S3 failed');
  }

  const fileRecord = await createFileRecord({
    name: file.name,
    originalName: file.name,
    type: file.type,
    size: file.size,
    s3Key: uploadResult.s3Key,
    url: uploadResult.url,
    tags: []
  });

  return {
    file: fileRecord,
    preview: uploadResult.url
  };
};

// Update your uploadToS3 function to use the correct endpoint
const uploadToS3 = async (file: File): Promise<{ success: boolean; url?: string; s3Key?: string; converted?: boolean }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Use your conversion-enabled S3 upload endpoint
    const response = await fetch('/api/s3/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      url: result.url,
      s3Key: result.key,
      converted: result.converted || false
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { success: false };
  }
};
