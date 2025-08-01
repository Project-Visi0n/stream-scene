import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { uploadFileToS3, S3UploadResult, isS3Configured, deleteFileFromS3 } from '../../services/s3Service';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  s3Key?: string;
  uploadedAt: Date;
}

const FileUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  // S3 upload handler
  const handleS3Upload = async (file: File): Promise<{ url: string; s3Key?: string }> => {
    if (!isS3Configured()) {
      setError('AWS S3 not configured. Files are stored locally for preview only.');
      return { url: URL.createObjectURL(file) };
    }

    try {
      const s3Result = await uploadFileToS3(file);
      return { url: s3Result.url, s3Key: s3Result.key };
    } catch (s3Error) {
      console.warn('S3 upload failed, falling back to local preview:', s3Error);
      setError('S3 upload failed. Using local preview. Check your AWS configuration.');
      return { url: URL.createObjectURL(file) };
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const { url, s3Key } = await handleS3Upload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url,
        s3Key,
        uploadedAt: new Date()
      };

      setUploadedFiles(prev => [...prev, newFile]);
      
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
    if (type.startsWith('text/') || type.includes('document')) return '📄';
    return '📁';
  };

  const isVideoFile = (type: string) => type.startsWith('video/');
  const isAudioFile = (type: string) => type.startsWith('audio/');
  const isImageFile = (type: string) => type.startsWith('image/');
  const isTextFile = (type: string) => type.startsWith('text/');

  // Individual file preview components
  const VideoPreview = ({ url, type }: { url: string; type: string }) => (
    <video 
      controls 
      className="w-full max-w-md rounded-lg shadow-lg"
      style={{ maxHeight: '300px' }}
    >
      <source src={url} type={type} />
      Your browser does not support the video tag.
    </video>
  );

  const AudioPreview = ({ url, type, name }: { url: string; type: string; name: string }) => (
    <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🎵</span>
        <span className="text-sm text-gray-300 truncate">{name}</span>
      </div>
      <audio controls className="w-full">
        <source src={url} type={type} />
        Your browser does not support the audio tag.
      </audio>
    </div>
  );

  const ImagePreview = ({ url, name }: { url: string; name: string }) => (
    <img 
      src={url} 
      alt={name}
      className="max-w-md max-h-80 rounded-lg shadow-lg object-contain"
    />
  );

  const TextPreview = ({ url, name }: { url: string; name: string }) => (
    <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📄</span>
        <span className="text-sm text-gray-300 truncate">{name}</span>
      </div>
      <iframe
        src={url}
        className="w-full h-40 bg-white rounded border-none"
        title={name}
      />
    </div>
  );

  const DefaultFilePreview = ({ type, name }: { type: string; name: string }) => (
    <div className="w-full max-w-md bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getFileIcon(type)}</span>
        <div>
          <div className="text-sm font-medium text-white truncate">{name}</div>
          <div className="text-xs text-gray-400">{type}</div>
        </div>
      </div>
    </div>
  );

  const renderFilePreview = (file: UploadedFile) => {
    const { type, url, name } = file;

    if (isVideoFile(type)) return <VideoPreview url={url} type={type} />;
    if (isAudioFile(type)) return <AudioPreview url={url} type={type} name={name} />;
    if (isImageFile(type)) return <ImagePreview url={url} name={name} />;
    if (isTextFile(type)) return <TextPreview url={url} name={name} />;
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
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        cleanupLocalUrl(fileToRemove.url);
        cleanupS3(fileToRemove.s3Key);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Upload Area */}
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

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-white">Uploaded Files ({uploadedFiles.length})</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 shadow-xl"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                >
                  ×
                </button>

                {/* File preview */}
                <div className="mb-3">
                  {renderFilePreview(file)}
                </div>

                {/* File info */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-white truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;
