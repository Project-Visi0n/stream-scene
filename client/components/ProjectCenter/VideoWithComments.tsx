import React, { useRef, useState, useCallback, useEffect } from 'react';
import { HiChatBubbleLeft, HiPlus } from 'react-icons/hi2';
import ClosedCaptionButton from '../ClosedCaptionButton';

interface TimestampedComment {
  id: number;
  content: string;
  timestampSeconds: number;
  userId?: number | null;
  guestName?: string | null;
  createdAt: string;
  user?: {
    name: string;
  };
}

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
  captionUrl?: string;
}

interface VideoWithCommentsProps {
  file: UploadedFile;
  className?: string;
  onFileUpdated?: (fileId: string, updates: Partial<UploadedFile>) => void;
}

const VideoWithComments: React.FC<VideoWithCommentsProps> = ({
  file,
  className = '',
  onFileUpdated
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState<TimestampedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showInlineCommentBox, setShowInlineCommentBox] = useState(false);
  const [inlineCommentTimestamp, setInlineCommentTimestamp] = useState<number>(0);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [hoveredComment, setHoveredComment] = useState<TimestampedComment | null>(null);
  const [showCommentsPanel, setShowCommentsPanel] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the appropriate URL for video playback
  const getVideoUrl = (file: UploadedFile): string => {
    // For S3 files, always use the proxy for better CORS and range request handling
    if (file.s3Key) {
      return `/api/s3/proxy/${file.s3Key}`;
    }
    return file.url;
  };

  // Get fallback video URL in case primary fails
  const getFallbackVideoUrl = (file: UploadedFile): string => {
    // If we were using proxy, try direct URL
    if (file.s3Key && file.url !== `/api/s3/proxy/${file.s3Key}`) {
      return file.url;
    }
    // If we were using direct URL, try proxy
    if (file.s3Key && !file.url.includes('/api/s3/proxy/')) {
      return `/api/s3/proxy/${file.s3Key}`;
    }
    return file.url;
  };

  // Load comments for this file
  const loadComments = useCallback(async () => {
    if (!file.fileRecordId) return;
    
    try {
      const response = await fetch(`/api/comments/file/${file.fileRecordId}`);
      if (response.ok) {
        const fileComments = await response.json();
        // Filter only timestamped comments and sort by timestamp
        const timestampedComments = fileComments
          .filter((comment: TimestampedComment) => comment.timestampSeconds !== null)
          .sort((a: TimestampedComment, b: TimestampedComment) => a.timestampSeconds - b.timestampSeconds);
        setComments(timestampedComments);
      }
    } catch (error) {

    }
  }, [file.fileRecordId]);

  // Submit new comment
  const submitComment = async () => {
    if (!newComment.trim() || !file.fileRecordId) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.fileRecordId,
          content: newComment.trim(),
          timestampSeconds: inlineCommentTimestamp
        }),
      });

      if (response.ok) {
        setNewComment('');
        setShowInlineCommentBox(false);
        setNewComment('');
        await loadComments(); // Reload comments
      } else {

      }
    } catch (error) {

    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setDuration(video.duration);
      setVideoLoading(false);
      setVideoError(false);
      
      // Video metadata loaded successfully
      
      loadComments(); // Load comments when video metadata is ready
    }
  };

  // Handle video error with fallback attempt
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {

    const videoElement = e.currentTarget;
    const error = videoElement.error;
    const currentSrc = videoElement.src;
    const primaryUrl = getVideoUrl(file);
    const fallbackUrl = getFallbackVideoUrl(file);
    
    let message = 'Failed to load video';
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          message = 'Video loading was aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          message = 'Network error while loading video';
          break;
        case error.MEDIA_ERR_DECODE:
          message = 'Video format not supported or corrupted';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Video format not supported';
          break;
        default:
          message = 'Unknown video error occurred';
      }
    }
    
    // Try fallback URL if we haven't already and it's different
    if (currentSrc === primaryUrl && fallbackUrl !== primaryUrl) {

      videoElement.src = fallbackUrl;
      videoElement.load();
      return; // Don't show error yet, give fallback a chance
    }
    
    setVideoError(true);
    setVideoLoading(false);
    setErrorMessage(message);
    // Video error occurred - details available in console
  };

  // Handle video loading start
  const handleLoadStart = () => {
    setVideoLoading(true);
    setVideoError(false);
    setErrorMessage('');
  };

  // Handle progress bar click with better error handling
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    try {
      // Check if the video is ready for seeking
      if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      } else {

        // Try again after a short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
          }
        }, 100);
      }
    } catch (seekError) {

      // Don't crash the app, just log the error
    }
  };

  // Handle progress bar double click to add comment
  const handleProgressDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timestamp = (clickX / rect.width) * duration;
    setInlineCommentTimestamp(timestamp);
    setShowInlineCommentBox(true);
    setNewComment('');
  };

  // Jump to comment timestamp with error handling
  const jumpToComment = (timestamp: number) => {
    if (!videoRef.current) return;
    
    try {
      if (videoRef.current.readyState >= 2) {
        videoRef.current.currentTime = timestamp;
        setCurrentTime(timestamp);
      } else {

        // Wait for video to be ready
        const handleCanSeek = () => {
          if (videoRef.current) {
            videoRef.current.currentTime = timestamp;
            setCurrentTime(timestamp);
            videoRef.current.removeEventListener('canplay', handleCanSeek);
          }
        };
        videoRef.current.addEventListener('canplay', handleCanSeek);
      }
    } catch (seekError) {

    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target !== document.body) return; // Only when not in input fields
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 5);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 5);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, duration, isPlaying]);

  if (videoError) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="text-lg font-medium">{errorMessage || 'Failed to load video'}</div>
          </div>
          <div className="text-gray-400 text-sm mb-4">
            <div>File: {file.name}</div>
            <div>Type: {file.type}</div>
            <div>URL: {getVideoUrl(file)}</div>
          </div>
          <button
            onClick={() => {
              setVideoError(false);
              setVideoLoading(true);
              if (videoRef.current) {
                videoRef.current.load(); // Reload the video
              }
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Main Layout: Video + Comments Side by Side */}
      <div className="flex flex-col lg:flex-row">
        {/* Video Section */}
        <div className="flex-1 lg:max-w-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white truncate">
                {file.name}
              </h3>
              <div className="text-sm text-gray-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative bg-black">
            {/* Loading overlay */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <div>Loading video...</div>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              src={getVideoUrl(file)}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadStart={handleLoadStart}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              controls={false}
              crossOrigin="anonymous"
              preload="metadata"
            >
              {file.captionUrl && (
                <track
                  kind="captions"
                  src={file.captionUrl}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
            </video>

            {/* Quick Comment Button - Only show when playing and not already showing comment box */}
            {isPlaying && !showInlineCommentBox && (
              <button
                onClick={() => {
                  setInlineCommentTimestamp(currentTime);
                  setShowInlineCommentBox(true);
                  setNewComment('');
                }}
                className="absolute top-4 right-4 bg-purple-600/80 hover:bg-purple-700 text-white p-2 rounded-full transition-all duration-200 shadow-lg backdrop-blur-sm"
                title="Quick comment"
              >
                <HiPlus className="w-4 h-4" />
              </button>
            )}

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
              {/* Progress Bar with Enhanced Comment Markers */}
              <div className="mb-4">
                <div 
                  ref={progressBarRef}
                  className="relative w-full h-3 bg-gray-600 rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                  onDoubleClick={handleProgressDoubleClick}
                  title="Click to seek, double-click to add comment"
                >
                  {/* Progress */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  
                  {/* Comment markers with enhanced hover */}
                  {comments.map((comment) => {
                    const position = duration > 0 ? (comment.timestampSeconds / duration) * 100 : 0;
                    const isNearCurrent = Math.abs(comment.timestampSeconds - currentTime) < 5;
                    
                    return (
                      <div
                        key={comment.id}
                        className={`absolute top-0 w-2 h-3 cursor-pointer transition-all duration-200 ${
                          isNearCurrent ? 'bg-yellow-300 scale-150' : 'bg-yellow-400 hover:bg-yellow-300'
                        }`}
                        style={{ left: `${position}%`, marginLeft: '-4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToComment(comment.timestampSeconds);
                        }}
                        onMouseEnter={() => setHoveredComment(comment)}
                        onMouseLeave={() => setHoveredComment(null)}
                      >
                        {/* Comment popup on hover */}
                        {hoveredComment?.id === comment.id && (
                          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white p-2 rounded shadow-lg z-10 w-48 text-xs">
                            <div className="text-yellow-400 font-mono mb-1">{formatTime(comment.timestampSeconds)}</div>
                            <div className="text-gray-200">{comment.content}</div>
                            <div className="text-gray-400 text-xs mt-1">
                              {comment.user?.name || comment.guestName || 'Anonymous'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Skip buttons */}
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.max(0, currentTime - 5);
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-white transition-colors text-sm"
                    title="Skip backward 5s (←)"
                  >
                    -5s
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.min(duration, currentTime + 5);
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-white transition-colors text-sm"
                    title="Skip forward 5s (→)"
                  >
                    +5s
                  </button>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCommentsPanel(!showCommentsPanel)}
                    className="p-2 text-gray-300 hover:text-white transition-colors lg:hidden"
                    title="Toggle comments"
                  >
                    <HiChatBubbleLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setInlineCommentTimestamp(currentTime);
                      setShowInlineCommentBox(true);
                      setNewComment('');
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="Add comment at current time"
                  >
                    <HiPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Caption Controls */}
          {file.fileRecordId && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">
                    {file.captionUrl ? 'Captions available' : 'Add captions:'}
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

                      if (onFileUpdated) {
                        onFileUpdated(file.id, { captionUrl });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments Panel */}
        <div className={`lg:w-80 bg-gray-750 border-l border-gray-700 ${showCommentsPanel ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white flex items-center gap-2">
                <HiChatBubbleLeft className="w-5 h-5" />
                Comments
              </h4>
              <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded-full">
                {comments.length}
              </span>
            </div>
          </div>

          {/* Current Time Comment */}
          {(() => {
            const currentComment = comments.find(comment => 
              Math.abs(comment.timestampSeconds - currentTime) < 2
            );
            return currentComment ? (
              <div className="p-4 bg-purple-900/30 border-b border-gray-700">
                <div className="text-xs text-purple-300 mb-1">Now playing:</div>
                <div className="bg-purple-800/50 rounded p-3">
                  <div className="flex items-center justify-between text-xs text-purple-200 mb-2">
                    <span>{currentComment.user?.name || currentComment.guestName || 'Anonymous'}</span>
                    <span className="font-mono">{formatTime(currentComment.timestampSeconds)}</span>
                  </div>
                  <div className="text-white">{currentComment.content}</div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Inline Comment Input */}
          {showInlineCommentBox && (
            <div className="p-4 border-b border-gray-600 bg-gray-800">
              <div className="text-sm text-purple-300 mb-2">
                Add comment at {formatTime(inlineCommentTimestamp)}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comment..."
                className="w-full h-20 bg-gray-700 text-white rounded border border-gray-600 p-2 text-sm resize-none focus:outline-none focus:border-purple-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-1.5 px-3 rounded text-sm transition-colors"
                >
                  {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                </button>
                <button
                  onClick={() => {
                    setShowInlineCommentBox(false);
                    setNewComment('');
                  }}
                  className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <HiChatBubbleLeft className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <div className="text-sm">No comments yet</div>
                <div className="text-xs text-gray-500 mt-1">Double-click the timeline or use the + button</div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {comments.map((comment) => {
                  const isActive = Math.abs(comment.timestampSeconds - currentTime) < 2;
                  return (
                    <div 
                      key={comment.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'bg-purple-800/50 border border-purple-500/50 shadow-lg' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => jumpToComment(comment.timestampSeconds)}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className={isActive ? 'text-purple-200' : 'text-gray-400'}>
                          {comment.user?.name || comment.guestName || 'Anonymous'}
                        </span>
                        <span className={`font-mono ${isActive ? 'text-purple-300' : 'text-yellow-400'}`}>
                          {formatTime(comment.timestampSeconds)}
                        </span>
                      </div>
                      <div className={`text-sm ${isActive ? 'text-white' : 'text-gray-200'}`}>
                        {comment.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          💡 Space: Play/Pause | ← →: Skip 5s | Double-click timeline: Add comment | Click comment: Jump to time
        </div>
      </div>


    </div>
  );
};

export default VideoWithComments;