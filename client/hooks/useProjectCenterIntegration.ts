
import { useState, useEffect, useCallback } from 'react';
import { ProjectFile } from '../types/contentScheduler';

interface ProjectCenterIntegrationHook {
  files: ProjectFile[];
  loading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
  getFilesByType: (type: string) => ProjectFile[];
  searchFiles: (query: string) => ProjectFile[];
  getFilePreview: (fileId: string) => Promise<string | null>;
}

export const useProjectCenterIntegration = (): ProjectCenterIntegrationHook => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load files from your existing file service
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

     
      const response = await fetch('/api/files');
      
      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.statusText}`);
      }

      const filesData = await response.json();
      
      // Transform the data to match our ProjectFile interface
      const transformedFiles: ProjectFile[] = filesData.map((file: any) => ({
        id: file.id || file._id,
        name: file.fileName || file.name,
        url: file.s3Url || file.url,
        type: file.mimeType || file.type,
        size: file.size,
        uploadedAt: new Date(file.uploadedAt || file.createdAt),
        thumbnailUrl: file.thumbnailUrl || generateThumbnailUrl(file)
      }));

      setFiles(transformedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');

    } finally {
      setLoading(false);
    }
  }, []);

  // Generate thumbnail URL for images
  const generateThumbnailUrl = (file: any) => {
    if (file.mimeType?.startsWith('image/')) {
      return file.s3Url ? `${file.s3Url}?w=200&h=200&fit=cover` : null;
    }
    return null;
  };

  // Refresh files
  const refreshFiles = useCallback(() => loadFiles(), [loadFiles]);

  // Filter files by type
  const getFilesByType = useCallback((type: string): ProjectFile[] => {
    return files.filter(file => {
      if (type === 'image') return file.type.startsWith('image/');
      if (type === 'video') return file.type.startsWith('video/');
      if (type === 'audio') return file.type.startsWith('audio/');
      if (type === 'document') return file.type.includes('text/') || file.type.includes('pdf') || file.type.includes('document');
      return file.type.includes(type);
    });
  }, [files]);

  // Search files by name or type
  const searchFiles = useCallback((query: string): ProjectFile[] => {
    const lowercaseQuery = query.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(lowercaseQuery) ||
      file.type.toLowerCase().includes(lowercaseQuery)
    );
  }, [files]);

  // Get file preview/content
  const getFilePreview = useCallback(async (fileId: string): Promise<string | null> => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return null;

      // For images, return the URL directly
      if (file.type.startsWith('image/')) {
        return file.url;
      }

      // For text files, fetch content
      if (file.type.startsWith('text/')) {
        const response = await fetch(file.url);
        if (response.ok) {
          const content = await response.text();
          return content.slice(0, 500) + (content.length > 500 ? '...' : '');
        }
      }

      // For other files, return thumbnail or null
      return file.thumbnailUrl || null;
    } catch (error) {

      return null;
    }
  }, [files]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    refreshFiles,
    getFilesByType,
    searchFiles,
    getFilePreview
  };
};