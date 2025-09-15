import React, { useState } from 'react';
import { 
  HiPlay, 
  HiMusicalNote, 
  HiPhoto, 
  HiDocument, 
  HiFolder,
  HiArrowDownTray 
} from 'react-icons/hi2';
import WaveformWithComments from './WaveformWithComments';
import ClosedCaptionButton from '../ClosedCaptionButton';

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
  captionUrl?: string; // URL for video captions
}

interface FilePreviewProps {
  file: UploadedFile | null;
  className?: string;
  onFileUpdated?: (fileId: string, updates: Partial<UploadedFile>) => void; // Direct file update
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, className = '', onFileUpdated }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!file) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/30 rounded-lg border-2 border-dashed border-gray-600 ${className}`}>
        <div className="text-center py-12">
          <HiFolder className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <div className="text-xl text-gray-400 mb-2">No file selected</div>
          <div className="text-sm text-gray-500">Choose a file from the list to preview</div>
        </div>
      </div>
    );
  }

  const getPreviewUrl = (file: UploadedFile): string => {
    // If we have an S3 key and the URL is a direct S3 URL, use proxy instead
    if (file.s3Key && (file.url.includes('s3.') || file.url.includes('amazonaws.com'))) {
      return `/api/s3/proxy/${file.s3Key}`;
    }
    return file.url;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFilePreview = () => {
    const previewUrl = getPreviewUrl(file);

    if (file.type.startsWith('video/')) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-black">
            {!videoError ? (
              <video
                controls
                className="w-full max-h-96 mx-auto"
                crossOrigin="anonymous"
                onError={() => setVideoError(true)}
                onLoadStart={() => console.log('Video loading started for:', file.name)}
              >
                <source src={previewUrl} type={file.type} />
                {file.captionUrl && (
                  <track
                    kind="captions"
                    src={file.captionUrl}
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-8 text-center">
                <div className="text-red-400 mb-2 flex justify-center">
                  <HiPlay className="w-8 h-8" />
                </div>
                <div className="mb-2">Video preview not available</div>
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  Download video file
                </a>
              </div>
            )}
          </div>
          
          {/* Video file caption controls */}
          {file.fileRecordId && (
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">
                  {file.captionUrl ? 'Captions available' : 'Add captions to this video:'}
                </span>
                {file.captionUrl && (
                  <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded">
                    ✓ Ready
                  </span>
                )}
              </div>
              {!file.captionUrl && (
                <ClosedCaptionButton 
                  fileId={file.fileRecordId} 
                  onCaptionReady={(captionUrl) => {
                    console.log('🎬 Caption ready callback triggered:', { fileId: file.id, captionUrl });
                    if (onFileUpdated) {
                      onFileUpdated(file.id, { captionUrl });
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>
      );
    }

    if (file.type.startsWith('audio/')) {
      return <WaveformWithComments file={file} />;
    }

    if (file.type.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          {!imageError ? (
            <img 
              src={previewUrl} 
              alt={file.name}
              className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
              onLoad={() => console.log('Image loaded successfully:', file.name)}
            />
          ) : (
            <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-4 py-8 text-center rounded-lg">
              <div className="text-red-400 mb-2 flex justify-center">
                <HiPhoto className="w-8 h-8" />
              </div>
              <div className="mb-2">Image preview not available</div>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                View image in new tab
              </a>
            </div>
          )}
        </div>
      );
    }

    if (file.type.startsWith('text/') || file.type.includes('pdf')) {
      return (
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <HiDocument className="w-6 h-6 text-gray-400" />
              <div>
                <div className="font-medium text-white">{file.name}</div>
                <div className="text-sm text-gray-400">{file.type}</div>
              </div>
            </div>
            
            {file.type.includes('pdf') ? (
              <div className="bg-white/10 rounded p-4 text-center">
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-64 bg-white rounded border-none"
                title={file.name}
                onError={() => console.error('Text preview error for:', file.name)}
              />
            )}
          </div>
        </div>
      );
    }

    // Default preview for unsupported file types
    return (
      <div className="bg-slate-800/50 rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          {file.type.startsWith('video/') ? <HiPlay className="w-16 h-16 text-gray-400" /> : 
           file.type.startsWith('audio/') ? <HiMusicalNote className="w-16 h-16 text-gray-400" /> : 
           file.type.startsWith('image/') ? <HiPhoto className="w-16 h-16 text-gray-400" /> : 
           file.type.includes('document') || file.type.includes('pdf') ? <HiDocument className="w-16 h-16 text-gray-400" /> : <HiFolder className="w-16 h-16 text-gray-400" />}
        </div>
        <div className="text-xl font-medium text-white mb-2">{file.name}</div>
        <div className="text-sm text-gray-400 mb-4">
          {file.type} • {formatFileSize(file.size)}
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Preview not available for this file type
        </div>
        <a 
          href={getPreviewUrl(file)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <HiArrowDownTray className="w-4 h-4" />
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className={`bg-slate-800/30 rounded-lg border border-slate-600 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="text-gray-400">
              {file.type.startsWith('video/') ? <HiPlay className="w-6 h-6" /> : 
               file.type.startsWith('audio/') ? <HiMusicalNote className="w-6 h-6" /> : 
               file.type.startsWith('image/') ? <HiPhoto className="w-6 h-6" /> : 
               file.type.includes('document') || file.type.includes('pdf') ? <HiDocument className="w-6 h-6" /> : <HiFolder className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-sm text-gray-400">
                {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-4">
              {file.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-600/30 text-blue-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {file.tags.length > 4 && (
                <span className="px-2 py-1 text-xs bg-gray-600/30 text-gray-400 rounded-full">
                  +{file.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        {renderFilePreview()}
      </div>
    </div>
  );
};

export default FilePreview;