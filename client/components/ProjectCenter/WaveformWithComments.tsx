import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { HiChatBubbleLeft, HiPlus, HiXMark } from 'react-icons/hi2';

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
}

interface WaveformWithCommentsProps {
  file: UploadedFile;
  className?: string;
}

const WaveformWithComments: React.FC<WaveformWithCommentsProps> = ({
  file,
  className = ''
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<string>('0:00');
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<TimestampedComment[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTimestamp, setCommentTimestamp] = useState<number>(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [hoveredComment, setHoveredComment] = useState<TimestampedComment | null>(null);
  const [showCommentsPanel, setShowCommentsPanel] = useState(true);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the appropriate URL for audio playback
  const getAudioUrl = (file: UploadedFile): string => {
    if (file.s3Key && (file.url.includes('s3.') || file.url.includes('amazonaws.com'))) {
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
          .filter((comment: any) => comment.timestampSeconds !== null)
          .sort((a: any, b: any) => a.timestampSeconds - b.timestampSeconds);
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
          timestampSeconds: commentTimestamp
        }),
      });

      if (response.ok) {
        setNewComment('');
        setShowCommentModal(false);
        await loadComments(); // Reload comments
      } else {

      }
    } catch (error) {

    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle waveform click to add comment
  const handleWaveformClick = (e: React.MouseEvent) => {
    if (!wavesurferRef.current) return;
    
    // Only add comment on double click to avoid interfering with seeking
    if (e.detail === 2) {
      const timestamp = wavesurferRef.current.getCurrentTime();
      setCommentTimestamp(timestamp);
      setShowCommentModal(true);
    }
  };

  // Jump to comment timestamp
  const jumpToComment = (timestamp: number) => {
    if (!wavesurferRef.current) return;
    const duration = wavesurferRef.current.getDuration();
    wavesurferRef.current.seekTo(timestamp / duration);
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    try {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#8B5CF6',
        progressColor: '#A855F7',
        cursorColor: '#FFFFFF',
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        mediaControls: false,
      });

      wavesurferRef.current = wavesurfer;

      wavesurfer.load(getAudioUrl(file));

      wavesurfer.on('ready', () => {
        setIsLoading(false);
        setDuration(formatTime(wavesurfer.getDuration()));
        loadComments(); // Load comments when audio is ready
      });

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));
      wavesurfer.on('finish', () => setIsPlaying(false));

      wavesurfer.on('audioprocess', () => {
        const currentSeconds = wavesurfer.getCurrentTime();
        setCurrentTime(formatTime(currentSeconds));
        setCurrentTimeSeconds(currentSeconds);
      });

      wavesurfer.on('interaction', () => {
        const currentSeconds = wavesurfer.getCurrentTime();
        setCurrentTime(formatTime(currentSeconds));
        setCurrentTimeSeconds(currentSeconds);
      });

      wavesurfer.on('error', (error) => {

        setError('Failed to load audio file');
        setIsLoading(false);
      });

    } catch (err) {

      setError('Failed to initialize audio player');
      setIsLoading(false);
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [file.id, file.url, loadComments]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };

  const handleStop = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.stop();
    setCurrentTime('0:00');
    setCurrentTimeSeconds(0);
  };

  const handleSkip = (seconds: number) => {
    if (!wavesurferRef.current) return;
    const currentTime = wavesurferRef.current.getCurrentTime();
    const newTime = Math.max(0, Math.min(currentTime + seconds, wavesurferRef.current.getDuration()));
    wavesurferRef.current.seekTo(newTime / wavesurferRef.current.getDuration());
  };

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white truncate">
          {file.name}
        </h3>
        <div className="text-sm text-gray-400">
          {currentTime} / {duration}
        </div>
      </div>

      {/* Waveform Container */}
      <div 
        className="relative bg-gray-900 rounded-lg p-2 cursor-pointer"
        onDoubleClick={handleWaveformClick}
        title="Double-click to add comment at current position"
      >
        <div ref={waveformRef} className="w-full" />
        
        {/* Comment markers on waveform */}
        {!isLoading && wavesurferRef.current && comments.map((comment) => {
          const duration = wavesurferRef.current?.getDuration() || 1;
          const position = (comment.timestampSeconds / duration) * 100;
          
          return (
            <div
              key={comment.id}
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 cursor-pointer hover:bg-yellow-300 transition-colors"
              style={{ left: `${position}%` }}
              onClick={() => jumpToComment(comment.timestampSeconds)}
              title={`${formatTime(comment.timestampSeconds)}: ${comment.content.substring(0, 50)}...`}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full border border-gray-800" />
            </div>
          );
        })}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <div className="flex items-center gap-2 text-gray-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
              <span className="text-sm">Loading waveform...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handleSkip(-10)}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Skip backward 10s"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors disabled:opacity-50"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Stop"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => handleSkip(10)}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Skip forward 10s"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Add comment button */}
        <button
          onClick={() => {
            setCommentTimestamp(currentTimeSeconds);
            setShowCommentModal(true);
          }}
          disabled={isLoading}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 ml-2"
          title="Add comment at current time"
        >
          <HiPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <HiChatBubbleLeft className="w-4 h-4" />
            Comments ({comments.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {comments.map((comment) => (
              <div 
                key={comment.id}
                className="bg-gray-700 rounded p-2 text-sm cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => jumpToComment(comment.timestampSeconds)}
              >
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{comment.user?.name || comment.guestName || 'Anonymous'}</span>
                  <span className="text-yellow-400 font-mono">
                    {formatTime(comment.timestampSeconds)}
                  </span>
                </div>
                <div className="text-gray-200">{comment.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Add Comment at {formatTime(commentTimestamp)}
              </h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full h-24 bg-gray-700 text-white rounded border border-gray-600 p-3 resize-none focus:outline-none focus:border-purple-500"
              autoFocus
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              >
                {isSubmittingComment ? 'Adding...' : 'Add Comment'}
              </button>
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformWithComments;