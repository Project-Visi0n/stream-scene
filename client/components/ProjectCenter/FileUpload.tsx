import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { uploadFileToS3, S3UploadResult, isS3Configured, deleteFileFromS3, getFileUrl } from '../../services/s3Service';
import { fileService, FileRecord, CreateFileRequest } from '../../services/fileService';
import { ShareRecord } from '../../services/shareService';
import useAuth from '../../hooks/useAuth';
import ShareModal from '../ShareModal';
import LoadingScreen from '../LoadingScreen';
import InlineLoading from '../InlineLoading';
import FileCarousel from './FileCarousel';
import FilePreview from './FilePreview';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  s3Key?: string;
  tags?: string[];
  uploadedAt: Date;
  fileRecordId?: number; // Database record ID
}

const FileUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [currentFileTags, setCurrentFileTags] = useState<{ [fileId: string]: string[] }>({});

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<UploadedFile | null>(null);

  // File selection state for preview
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  // Load user's files when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserFiles();
      loadUserTags();
    } else {
      setUploadedFiles([]);
      setAvailableTags([]);
      setSelectedTags([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserFiles = async (filterTags?: string[]) => {
    try {
      setLoading(true);
      const fileRecords = await fileService.getFiles(filterTags);
      
      // Convert FileRecord to UploadedFile format
      const files: UploadedFile[] = fileRecords.map(record => ({
        id: `db-${record.id}`, // Prefix to distinguish from local IDs
        name: record.name,
        type: record.type,
        size: record.size,
        url: record.url,
        s3Key: record.s3Key,
        tags: record.tags,
        uploadedAt: new Date(record.uploadedAt),
        fileRecordId: record.id
      }));
      
      setUploadedFiles(files);
      console.log('Loaded user files:', files);
    } catch (error) {
      console.error('Failed to load user files:', error);
      setError('Failed to load your files. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserTags = async () => {
    try {
      const tags = await fileService.getUserTags();
      setAvailableTags(tags);
      console.log('Loaded user tags:', tags);
    } catch (error) {
      console.error('Failed to load user tags:', error);
    }
  };

  // Tag management functions
  const handleTagFilter = (tags: string[]) => {
    setSelectedTags(tags);
    loadUserFiles(tags.length > 0 ? tags : undefined);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags(prev => [...prev, trimmedTag].sort());
    }
  };

  const handleAddFileTag = (fileId: string, tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;

    setCurrentFileTags(prev => {
      const current = prev[fileId] || [];
      if (!current.includes(trimmedTag)) {
        return { ...prev, [fileId]: [...current, trimmedTag] };
      }
      return prev;
    });

    addTag(trimmedTag);
  };

  const handleRemoveFileTag = (fileId: string, tag: string) => {
    setCurrentFileTags(prev => {
      const current = prev[fileId] || [];
      return { ...prev, [fileId]: current.filter(t => t !== tag) };
    });
  };

  const saveFileTags = async (file: UploadedFile) => {
    if (!file.fileRecordId) return;

    try {
      const tags = currentFileTags[file.id] || file.tags || [];
      console.log('Saving tags for file:', file.name, 'Tags:', tags);
      
      // Send tags as array to backend
      await fileService.updateFile(file.fileRecordId, { tags });
      
      // Update local state
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, tags } : f
      ));
      
      // Clear temporary tags
      setCurrentFileTags(prev => {
        const { [file.id]: removed, ...rest } = prev;
        return rest;
      });

      // Refresh available tags and files to get updated data
      await loadUserTags();
      await loadUserFiles(); // Refresh to get updated tags from DB
      
      console.log('Tags saved successfully for file:', file.name);
    } catch (error) {
      console.error('Failed to save tags:', error);
      setError('Failed to save tags. Please try again.');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  // S3 upload handler
  const handleS3Upload = async (file: File): Promise<{ url: string; s3Key?: string }> => {
    console.log('[FileUpload] handleS3Upload: Checking S3 config...');
    if (!isS3Configured()) {
      setError('AWS S3 not configured. Files are stored locally for preview only.');
      console.warn('[FileUpload] S3 not configured');
      return { url: URL.createObjectURL(file) };
    }

    try {
      console.log('[FileUpload] handleS3Upload: Uploading file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/s3/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Add this for session handling
      });

      console.log('[FileUpload] Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FileUpload] Upload failed:', response.status, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Upload failed: ${response.status}`);
        } catch {
          throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('[FileUpload] Upload successful:', data);
      
      // Use the backend's returned URL and key (which will be .mp4 if converted)
      return { url: data.url, s3Key: data.key };
      
    } catch (s3Error) {
      console.error('[FileUpload] S3 upload failed:', s3Error);
      setError(`S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`);
      return { url: URL.createObjectURL(file) };
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log(`Starting upload for file: ${file.name} Type: ${file.type} Size: ${file.size}`);
      
      // Upload to S3
      const { url, s3Key } = await handleS3Upload(file);
      console.log(`Upload completed. Preview URL: ${url} S3Key: ${s3Key}`);
      
      // Create a display name based on whether file was converted
      const displayName = s3Key?.endsWith('.mp4') && !file.name.endsWith('.mp4') 
        ? file.name.replace(/\.[^/.]+$/, '.mp4')
        : file.name;

      // Create file record in database
      const fileData = {
        name: displayName, // Use the converted name if applicable
        originalName: file.name, // Keep original name for reference
        type: s3Key?.endsWith('.mp4') ? 'video/mp4' : file.type,
        size: file.size,
        url: url,
        s3Key: s3Key,
        tags: [],
      };

      const fileResponse = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(fileData),
      });

      if (!fileResponse.ok) {
        const errorData = await fileResponse.json();
        throw new Error(errorData.error || 'Failed to save file record');
      }

      const savedFile = await fileResponse.json();
      console.log('File record created:', savedFile);

      // Update local state with database record
      const newFile: UploadedFile = {
        id: `db-${savedFile.id}`,
        name: savedFile.name,
        type: savedFile.type,
        size: savedFile.size,
        url: savedFile.url,
        s3Key: savedFile.s3Key,
        tags: savedFile.tags || [],
        uploadedAt: new Date(savedFile.uploadedAt),
        fileRecordId: savedFile.id,
      };

      console.log('Adding file to state:', newFile);
      setUploadedFiles(prev => [...prev, newFile]);
      setUploadProgress(100);
      
      // Reload files to ensure consistency
      loadUserFiles();
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Custom hook for drag and drop functionality
  const useDragAndDrop = () => {
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    };

    return { handleDragOver, handleDragLeave, handleDrop };
  };

  const { handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File type utilities
  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/') || type.includes('document') || type.includes('pdf')) return '📄';
    return '📁';
  };

  const isVideoFile = (type: string) => type.startsWith('video/');
  const isAudioFile = (type: string) => type.startsWith('audio/');
  const isImageFile = (type: string) => type.startsWith('image/');
  const isTextFile = (type: string) => type.startsWith('text/') || type.includes('pdf');
  const isPDFFile = (type: string) => type.includes('pdf');

  // Individual file preview components
  const VideoPreview = ({ url, type }: { url: string; type: string }) => {
    const [videoError, setVideoError] = useState(false);
    
    return (
      <div className="w-full max-w-md">
        {!videoError ? (
          <video 
            controls 
            className="w-full rounded-lg shadow-lg bg-black"
            style={{ maxHeight: '300px' }}
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Video preview error:', e);
              setVideoError(true);
            }}
            onLoadStart={() => {
              console.log('Video loading started');
            }}
          >
            <source src={url} type={type} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-3 py-2 rounded text-sm">
            <p className="mb-2">Video preview not available</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              Download video file
            </a>
          </div>
        )}
      </div>
    );
  };  const AudioPreview = ({ url, type, name }: { url: string; type: string; name: string }) => {
    const [audioError, setAudioError] = useState(false);
    
    return (
      <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🎵</span>
          <span className="text-sm text-gray-300 truncate">{name}</span>
        </div>
        {!audioError ? (
          <audio 
            controls 
            className="w-full"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Audio preview error:', e);
              setAudioError(true);
            }}
            onLoadStart={() => {
              console.log('Audio loading started for:', name);
            }}
            onCanPlay={() => {
              console.log('Audio can play:', name);
            }}
          >
            <source src={url} type={type} />
            Your browser does not support the audio tag.
          </audio>
        ) : (
          <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-3 py-2 rounded text-sm">
            <p className="mb-2">Audio preview not available</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              Download audio file
            </a>
          </div>
        )}
      </div>
    );
  };

  const ImagePreview = ({ url, name }: { url: string; name: string }) => {
    const [imageError, setImageError] = useState(false);
    
    return (
      <div className="w-full max-w-md">
        {!imageError ? (
          <img 
            src={url} 
            alt={name}
            className="w-full max-h-80 rounded-lg shadow-lg object-contain bg-white/10"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Image preview error:', e);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', name);
            }}
          />
        ) : (
          <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-3 py-2 rounded text-sm">
            <p className="mb-2">Image preview not available</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              View image in new tab
            </a>
          </div>
        )}
      </div>
    );
  };

  const TextPreview = ({ url, name }: { url: string; name: string }) => (
    <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📄</span>
        <span className="text-sm text-gray-300 truncate">{name}</span>
      </div>
      {isPDFFile(name) ? (
        <div className="bg-white/10 rounded p-2 text-center">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Open PDF in new tab
          </a>
        </div>
      ) : (
        <iframe
          src={url}
          className="w-full h-40 bg-white rounded border-none"
          title={name}
          onError={(e) => {
            console.error('Text preview error:', e);
          }}
        />
      )}
    </div>
  );

  const DefaultFilePreview = ({ type, name }: { type: string; name: string }) => (
    <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4 min-h-[120px] flex items-center">
      <div className="flex items-center gap-3 w-full">
        <span className="text-4xl">{getFileIcon(type)}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-white truncate mb-1" title={name}>{name}</div>
          <div className="text-xs text-gray-400 mb-2">{type || 'Unknown type'}</div>
          <div className="text-xs text-blue-400">Click to download</div>
        </div>
      </div>
    </div>
  );

  const renderFilePreview = (file: UploadedFile) => {
  const { type, url, name, s3Key } = file;

  console.log('Rendering preview for file:', { name, type, url: url.substring(0, 50) + '...' });

  // For uploaded files, ensure we use the server proxy URL for preview
  let previewUrl = url;
  
  // If we have an S3 key and the URL is a direct S3 URL, use proxy instead
  if (s3Key && (url.includes('s3.') || url.includes('amazonaws.com'))) {
    previewUrl = `/api/s3/proxy/${s3Key}`;
    console.log('Using proxy URL for preview:', previewUrl);
  }
  
  if (url.startsWith('blob:')) {
    previewUrl = url; // Keep blob URLs as-is for local previews
  }

  if (isVideoFile(type)) return <VideoPreview url={previewUrl} type={type} />;
  if (isAudioFile(type)) return <AudioPreview url={previewUrl} type={type} name={name} />;
  if (isImageFile(type)) return <ImagePreview url={previewUrl} name={name} />;
  if (isTextFile(type) || isPDFFile(type)) return <TextPreview url={previewUrl} name={name} />;
  return <DefaultFilePreview type={type} name={name} />;
};

  // Helper: Clean up local blob URL
  const cleanupLocalUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  // Helper: Delete file from S3
  const cleanupS3 = async (s3Key?: string) => {
    if (s3Key) {
      try {
        await deleteFileFromS3(s3Key);
      } catch (err) {
        console.error('Failed to delete from S3:', err);
      }
    }
  };

  // Remove file handler
  const removeFile = async (fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (!fileToRemove) return;

    try {
      // Remove from UI immediately for better UX
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

      // If file has a database record, delete it
      if (fileToRemove.fileRecordId) {
        await fileService.deleteFile(fileToRemove.fileRecordId);
      }

      // Clean up local blob URL
      cleanupLocalUrl(fileToRemove.url);
      
      // Clean up S3 if needed
      await cleanupS3(fileToRemove.s3Key);
      
      console.log('File removed successfully:', fileToRemove.name);
    } catch (error) {
      console.error('Failed to remove file:', error);
      // Re-add the file to the list if deletion failed
      setUploadedFiles(prev => [...prev, fileToRemove]);
      setError('Failed to delete file. Please try again.');
    }
  };

  // Share handlers
  const handleShareFile = (file: UploadedFile) => {
    if (!file.fileRecordId) {
      setError('Cannot share file: File not properly saved to database');
      return;
    }
    setSelectedFileForShare(file);
    setShareModalOpen(true);
  };

  const handleShareCreated = (share: ShareRecord) => {
    console.log('Share created:', share);
    // Could show a success message or update UI state here
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedFileForShare(null);
  };

  const handleTagKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, fileId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const tag = input.value.trim().toLowerCase();
      
      if (!tag) return;

      // Find the file to update
      const file = uploadedFiles.find(f => f.id === fileId);
      if (!file || !file.fileRecordId) return;

      try {
        // Get current tags (either from temporary state or file)
        const currentTags = currentFileTags[fileId] || file.tags || [];
        
        // Check if tag already exists
        if (currentTags.includes(tag)) {
          input.value = ''; // Clear input if tag already exists
          return;
        }

        const newTags = [...currentTags, tag];
        
        console.log('Auto-saving tag:', tag, 'for file:', file.name);
        
        // Save immediately to backend using the PUT route
        const response = await fileService.updateFile(file.fileRecordId, { tags: newTags });
        
        console.log('Backend response:', response);
        
        // Update local state with the response from backend
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, tags: response.tags || newTags } : f
        ));
        
        // Update current tags state
        setCurrentFileTags(prev => ({
          ...prev,
          [fileId]: response.tags || newTags
        }));

        // Add to available tags
        addTag(tag);
        await loadUserTags(); // Refresh available tags
        
        // Clear input
        input.value = '';
        
        console.log('Tag saved successfully:', tag);
      } catch (error) {
        console.error('Failed to save tag:', error);
        setError('Failed to save tag. Please try again.');
      }
    }
  };

  // Add this function inside the FileUpload component
  const handleRemoveTag = async (fileId: string, tagToRemove: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.fileRecordId) return;

    try {
      const currentTags = file.tags || [];
      const newTags = currentTags.filter(tag => tag !== tagToRemove);
      
      console.log('Removing tag:', tagToRemove, 'from file:', file.name);
      
      // Update backend using existing fileService
      const response = await fileService.updateFile(file.fileRecordId, { tags: newTags });
      
      // Update local state
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, tags: response.tags || newTags } : f
      ));
      
      // Update current tags state
      setCurrentFileTags(prev => ({
        ...prev,
        [fileId]: response.tags || newTags
      }));

      await loadUserTags(); // Refresh available tags
      
      console.log('Tag removed successfully:', tagToRemove);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      setError('Failed to remove tag. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Authentication Check */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded-lg text-center"
        >
          <p className="text-sm">Please log in to upload and manage your files.</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && user && (
        <LoadingScreen 
          message="Loading your files..."
          size="md"
          speed="normal"
          overlay={false}
          className="py-16"
        />
      )}

      {/* Upload Area - Only show if user is logged in */}
      {user && !loading && (
        <motion.div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 backdrop-blur-sm ${
            isDragging 
              ? 'border-purple-400 bg-purple-400/10 shadow-lg' 
              : 'border-gray-600 hover:border-purple-500 bg-slate-800/30 hover:bg-slate-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={e => handleFileSelect(e.target.files)}
          className="hidden"
          accept="video/*,audio/*,image/*,text/*,.pdf,.doc,.docx"
        />
        
        <div className="space-y-4">
          <motion.div 
            className="text-4xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            📁
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-gray-400">
              Supports video, audio, images, and documents
            </p>
          </motion.div>
          
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg font-medium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isUploading}
          >
            {isUploading ? (
              <InlineLoading 
                size="sm" 
                speed="fast" 
                text="Processing video, please wait..." 
              />
            ) : (
              'Select Files'
            )}
          </motion.button>

          {/* Upload Tags Input */}
          <motion.div 
            className="max-w-md mx-auto space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags for uploads (press Enter)"
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm transition-all duration-200"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    const newTag = tagInput.trim().toLowerCase();
                    if (!selectedTags.includes(newTag)) {
                      setSelectedTags(prev => [...prev, newTag]);
                      addTag(newTag);
                    }
                    setTagInput('');
                  }
                }}
              />
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="text-xs text-gray-400">Upload tags:</span>
                {selectedTags.map((tag, index) => (
                  <motion.span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-purple-600/30 text-purple-200 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {tag}
                    <motion.button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                      className="ml-1 text-purple-300 hover:text-white transition-colors duration-200"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      ×
                    </motion.button>
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Upload Progress Bar */}
          {isUploading && (
            <motion.div 
              className="w-full max-w-xs mx-auto space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* StreamScene Loading Animation */}
              <div className="flex justify-center">
                <InlineLoading 
                  size="md" 
                  speed="fast" 
                  text={`Uploading... ${uploadProgress}%`}
                />
              </div>
              
              {/* Progress Bar */}
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
          
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm max-w-md mx-auto"
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      )}

      {/* Uploaded Files Display */}
      {user && !loading && uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-semibold text-white">Uploaded Files ({uploadedFiles.length})</h3>
            
            {/* Tag Filter */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-400">Filter by tags:</span>
                {availableTags.map((tag, index) => (
                  <motion.button
                    key={tag}
                    onClick={() => {
                      const newTags = selectedTags.includes(tag) 
                        ? selectedTags.filter(t => t !== tag)
                        : [...selectedTags, tag];
                      handleTagFilter(newTags);
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-all duration-200 shadow-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tag}
                  </motion.button>
                ))}
                {selectedTags.length > 0 && (
                  <motion.button
                    onClick={() => handleTagFilter([])}
                    className="px-2 py-1 text-xs rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200 shadow-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: availableTags.length * 0.05 + 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear
                  </motion.button>
                )}
              </div>
            )}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 shadow-xl hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 z-10">
                  {/* Share button */}
                  {file.fileRecordId && (
                    <motion.button
                      onClick={() => handleShareFile(file)}
                      className="w-6 h-6 bg-blue-600/80 hover:bg-blue-600 text-white text-xs rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                      title="Share file"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      🔗
                    </motion.button>
                  )}
                  
                  {/* Remove button */}
                  <motion.button
                    onClick={() => removeFile(file.id)}
                    className="w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                    title="Delete file"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </div>

                {/* File preview */}
                <div className="mb-3">
                  {renderFilePreview(file)}
                </div>

                {/* File info */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                  </div>
                  
                  {/* Tags Section */}
                  <div className="space-y-2">
                    {/* Display existing tags */}
                    {(file.tags || currentFileTags[file.id])?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {((currentFileTags[file.id] || file.tags || []) as string[]).map((tag, index) => (
                          <motion.span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full flex items-center gap-1"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            {tag}
                            <motion.button
                              onClick={() => handleRemoveTag(file.id, tag)}
                              className="text-white hover:text-red-300 font-bold transition-colors duration-200"
                              title="Remove tag"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                            >
                              ×
                            </motion.button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                    
                    {/* Auto-saving tag input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add tag (press Enter)"
                        onKeyPress={(e) => handleTagKeyPress(e, file.id)}
                        className="px-2 py-1 text-xs border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:border-blue-500"
                        style={{ width: '120px' }}
                      />
                      <span className="text-xs text-gray-400">Press Enter to save</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Share Modal */}
      {selectedFileForShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          fileId={selectedFileForShare.fileRecordId!}
          fileName={selectedFileForShare.name}
          onShareCreated={handleShareCreated}
        />
      )}
    </div>
  );
};

export default FileUpload;
