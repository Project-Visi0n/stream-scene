import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { uploadFileToS3, S3UploadResult, isS3Configured, deleteFileFromS3, getFileUrl } from '../../services/s3Service';
import { fileService, FileRecord, CreateFileRequest } from '../../services/fileService';
import { ShareRecord } from '../../services/shareService';
import useAuth from '../../hooks/useAuth';
import ShareModal from '../ShareModal';

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
  const [uploading, setUploading] = useState(false);
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

      // Refresh available tags
      loadUserTags();
      
      console.log('Tags saved for file:', file.name, tags);
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
      console.warn('[FileUpload] S3 not configured. Env:', process.env);
      return { url: URL.createObjectURL(file) };
    }

    // Always create a local blob URL for reliable preview
    const localUrl = URL.createObjectURL(file);

    try {
      console.log('[FileUpload] handleS3Upload: Uploading file:', file);
      const s3Result = await uploadFileToS3(file);
      console.log('[FileUpload] handleS3Upload: S3 upload result:', s3Result);
      
      // Use local blob URL for preview, but store S3 info for later use
      return { url: localUrl, s3Key: s3Result.key };
    } catch (s3Error) {
      console.warn('[FileUpload] S3 upload failed, using local preview:', s3Error);
      setError('S3 upload failed. Using local preview.');
      // Use local blob URL as fallback
      return { url: localUrl };
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      setError('Please log in to upload files.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      console.log('Starting upload for file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const { url, s3Key } = await handleS3Upload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(95);
      
      console.log('Upload completed. URL:', url, 'S3Key:', s3Key);
      
      // Create file record in database
      const fileData: CreateFileRequest = {
        name: file.name,
        originalName: file.name,
        type: file.type,
        size: file.size,
        url,
        s3Key,
        tags: selectedTags.length > 0 ? [...selectedTags] : undefined
      };

      const fileRecord = await fileService.createFile(fileData);
      console.log('File record created:', fileRecord);
      
      const newFile: UploadedFile = {
        id: `db-${fileRecord.id}`,
        name: fileRecord.name,
        type: fileRecord.type,
        size: fileRecord.size,
        url: fileRecord.url,
        s3Key: fileRecord.s3Key,
        tags: fileRecord.tags,
        uploadedAt: new Date(fileRecord.uploadedAt),
        fileRecordId: fileRecord.id
      };

      console.log('Adding file to state:', newFile);
      setUploadedFiles(prev => [...prev, newFile]);
      setUploadProgress(100);
      
      // Refresh available tags if new tags were added
      if (selectedTags.length > 0) {
        loadUserTags();
        setSelectedTags([]); // Clear selected tags after upload
      }
      
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
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
    const { type, url, name } = file;

    console.log('Rendering preview for file:', { name, type, url: url.substring(0, 50) + '...' });

    if (isVideoFile(type)) return <VideoPreview url={url} type={type} />;
    if (isAudioFile(type)) return <AudioPreview url={url} type={type} name={name} />;
    if (isImageFile(type)) return <ImagePreview url={url} name={name} />;
    if (isTextFile(type) || isPDFFile(type)) return <TextPreview url={url} name={name} />;
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <div className="text-gray-400">Loading your files...</div>
        </motion.div>
      )}

      {/* Upload Area - Only show if user is logged in */}
      {user && !loading && (
        <motion.div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging 
              ? 'border-purple-400 bg-purple-400/10' 
              : 'border-gray-600 hover:border-purple-500 bg-slate-800/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.02 }}
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
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-sm text-gray-400">
              Supports video, audio, images, and documents
            </p>
          </div>
          
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={uploading}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : 'Select Files'}
          </motion.button>

          {/* Upload Tags Input */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags for uploads (press Enter)"
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
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
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-purple-600/30 text-purple-200 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                      className="ml-1 text-purple-300 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Upload Progress Bar */}
          {uploading && (
            <div className="w-full max-w-xs mx-auto">
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-purple-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
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
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = selectedTags.includes(tag) 
                        ? selectedTags.filter(t => t !== tag)
                        : [...selectedTags, tag];
                      handleTagFilter(newTags);
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => handleTagFilter([])}
                    className="px-2 py-1 text-xs rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 shadow-xl"
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 z-10">
                  {/* Share button */}
                  {file.fileRecordId && (
                    <button
                      onClick={() => handleShareFile(file)}
                      className="w-6 h-6 bg-blue-600/80 hover:bg-blue-600 text-white text-xs rounded-full flex items-center justify-center transition-colors duration-200"
                      title="Share file"
                    >
                      🔗
                    </button>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded-full flex items-center justify-center transition-colors duration-200"
                    title="Delete file"
                  >
                    ×
                  </button>
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
                      <div className="flex flex-wrap gap-1">
                        {(currentFileTags[file.id] || file.tags || []).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs bg-purple-600/30 text-purple-200 rounded-full"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveFileTag(file.id, tag)}
                              className="ml-1 text-purple-300 hover:text-white"
                              title="Remove tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Add tag input */}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        className="flex-1 px-2 py-1 text-xs bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              handleAddFileTag(file.id, input.value);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      {(currentFileTags[file.id]?.length > 0 || 
                        (currentFileTags[file.id] || []).some(tag => !(file.tags || []).includes(tag))) && (
                        <button
                          onClick={() => saveFileTags(file)}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200"
                          title="Save tags"
                        >
                          ✓
                        </button>
                      )}
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
