import React from 'react';
import { motion } from 'framer-motion';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  s3Key?: string;
  tags?: string[];
  uploadedAt: Date;
  fileRecordId?: number;
}

interface FileCarouselProps {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  className?: string;
}

const FileCarousel: React.FC<FileCarouselProps> = ({
  files,
  selectedFile,
  onFileSelect,
  className = ''
}) => {
  if (files.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('text/') || type.includes('document') || type.includes('pdf')) return '📄';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getThumbnail = (file: UploadedFile) => {
    // For images, we can show a small preview
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-12 h-12 object-cover rounded-lg"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    // For other files, show the appropriate icon
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded-lg">
        <span className="text-2xl">{getFileIcon(file.type)}</span>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          Files ({files.length})
        </h3>
        <p className="text-sm text-gray-400">
          Select a file to preview
        </p>
      </div>

      {/* Carousel */}
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-slate-800/50">
        {files.map((file, index) => (
          <motion.button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className={`w-full p-3 rounded-lg border transition-all duration-200 ${
              selectedFile?.id === file.id
                ? 'bg-purple-600/20 border-purple-500 shadow-lg'
                : 'bg-slate-800/50 border-slate-600 hover:border-purple-400 hover:bg-slate-700/50'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail/Icon */}
              <div className="flex-shrink-0">
                {getThumbnail(file)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-white truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                </div>
                
                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-1.5 py-0.5 text-xs bg-blue-600/30 text-blue-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {file.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-600/30 text-gray-400 rounded">
                        +{file.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {selectedFile?.id === file.id && (
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FileCarousel;