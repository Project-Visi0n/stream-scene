import React, { useState, useEffect, useRef } from 'react';
import Navbar from './NavBar';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { shareService, SharedFileAccess } from '../services/shareService';
import { CommentSection } from './Comments';

const SharedFileViewer: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [fileData, setFileData] = useState<SharedFileAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (token) {
      loadSharedFile();
    }
  }, [token]);

  const loadSharedFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('No share token provided');
        return;
      }

      const data = await shareService.accessSharedFile(token);
      setFileData(data);
    } catch (error) {

      setError(error instanceof Error ? error.message : 'Failed to load shared file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const renderFilePreview = () => {
    if (!fileData) return null;

    const { file } = fileData;
    const { type, url, name } = file;

    if (isVideoFile(type)) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          {!videoError ? (
            <video 
              ref={videoRef}
              controls 
              className="w-full rounded-lg shadow-lg bg-black"
              style={{ maxHeight: '70vh' }}
              crossOrigin="anonymous"
              onError={() => setVideoError(true)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            >
              <source src={url} type={type} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded text-center">
              <p className="mb-2">Video preview not available</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Download video file
              </a>
            </div>
          )}
        </div>
      );
    }

    if (isAudioFile(type)) {
      return (
        <div className="w-full max-w-2xl mx-auto bg-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">🎵</span>
            <div>
              <h3 className="text-lg font-medium text-white">{name}</h3>
              <p className="text-gray-400">Audio File</p>
            </div>
          </div>
          {!audioError ? (
            <audio 
              ref={audioRef}
              controls 
              className="w-full"
              crossOrigin="anonymous"
              onError={() => setAudioError(true)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            >
              <source src={url} type={type} />
              Your browser does not support the audio tag.
            </audio>
          ) : (
            <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded text-center">
              <p className="mb-2">Audio preview not available</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Download audio file
              </a>
            </div>
          )}
        </div>
      );
    }

    if (isImageFile(type)) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          {!imageError ? (
            <img 
              src={url} 
              alt={name}
              className="w-full max-h-[70vh] rounded-lg shadow-lg object-contain bg-white/10"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 px-4 py-3 rounded text-center">
              <p className="mb-2">Image preview not available</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View image in new tab
              </a>
            </div>
          )}
        </div>
      );
    }

    if (isTextFile(type) || isPDFFile(type)) {
      return (
        <div className="w-full max-w-4xl mx-auto bg-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">📄</span>
            <div>
              <h3 className="text-lg font-medium text-white">{name}</h3>
              <p className="text-gray-400">Document</p>
            </div>
          </div>
          {isPDFFile(name) ? (
            <div className="bg-white/10 rounded p-4 text-center">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-lg"
              >
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-96 bg-white rounded border-none"
              title={name}
            />
          )}
        </div>
      );
    }

    // Default file preview
    return (
      <div className="w-full max-w-2xl mx-auto bg-slate-800/50 rounded-lg p-8">
        <div className="text-center">
          <span className="text-6xl mb-4 block">{getFileIcon(type)}</span>
          <h3 className="text-xl font-medium text-white mb-2">{name}</h3>
          <p className="text-gray-400 mb-4">{type || 'Unknown type'}</p>
          <a
            href={url}
            download={name}
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download File
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading shared file...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          
          {error.includes('expired') && (
            <p className="text-sm text-gray-400">
              This share link has expired or reached its access limit.
            </p>
          )}
          
          {error.includes('not found') && (
            <p className="text-sm text-gray-400">
              The share link is invalid or the file no longer exists.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-gray-300">No file data available</div>
      </div>
    );
  }

  const { file, share } = fileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Add NavBar for shared links */}
      <Navbar
        currentComponent={"landing"}
        onNavigate={(component) => {
          const viewToRouteMap = {
            'landing': '/',
            'planner': '/planner',
            'project-center': '/project-center',
            'budget-tracker': '/budget-tracker',
            'content-scheduler': '/content-scheduler'
          };
          const route = viewToRouteMap[component];
          if (route) navigate(route);
        }}
      />
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Shared File</h1>
              <p className="text-gray-400">
                {share.shareType === 'one-time' ? 'Single-use' : 'Multi-use'} share
                {share.remainingAccess !== null && (
                  <span className="ml-2">
                    ({share.remainingAccess} access{share.remainingAccess !== 1 ? 'es' : ''} remaining)
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">File Size</div>
              <div className="text-white font-medium">{formatFileSize(file.size)}</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* File Info */}
          <div className="bg-slate-800/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-3xl">{getFileIcon(file.type)}</span>
              <div>
                <h2 className="text-xl font-semibold text-white">{file.name}</h2>
                <p className="text-gray-400">
                  {file.type} • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {/* Access Info */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <div className="text-xs text-purple-200">
                Share accessed {share.accessCount} time{share.accessCount !== 1 ? 's' : ''}
                {share.maxAccess && ` of ${share.maxAccess} allowed`}
              </div>
            </div>
          </div>

          {/* File Preview/Download */}
          <div className="bg-slate-800/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            {renderFilePreview()}
          </div>

          {/* Download Button */}
          <div className="text-center">
            <motion.a
              href={file.url}
              download={file.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download {file.name}
            </motion.a>
          </div>

          {/* Comments Section */}
          <div className="bg-slate-800/30 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
            <CommentSection
              fileId={file.id}
              currentTime={isVideoFile(file.type) || isAudioFile(file.type) ? currentTime : undefined}
              isOwner={false} // Shared links are for guests
              allowAnonymous={true}
              className="bg-transparent border-0 shadow-none"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedFileViewer;
