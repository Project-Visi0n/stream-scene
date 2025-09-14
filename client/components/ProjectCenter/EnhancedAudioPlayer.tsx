import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { 
  HiMusicalNote, 
  HiExclamationTriangle 
} from 'react-icons/hi2';
import type { IconType } from 'react-icons';

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

interface EnhancedAudioPlayerProps {
  file: UploadedFile;
  className?: string;
}

const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({ 
  file, 
  className = '' 
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<string>('0:00');
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [error, setError] = useState<string | null>(null);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the appropriate URL for audio playback
  const getAudioUrl = (file: UploadedFile): string => {
    // If we have an S3 key and the URL is a direct S3 URL, use proxy instead
    if (file.s3Key && (file.url.includes('s3.') || file.url.includes('amazonaws.com'))) {
      return `/api/s3/proxy/${file.s3Key}`;
    }
    return file.url;
  };

  useEffect(() => {
    if (!waveformRef.current) return;

    // Clean up existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create WaveSurfer instance with enhanced settings
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#7c3aed', // Purple wave
        progressColor: '#6366f1', // Indigo progress
        cursorColor: '#ec4899', // Pink cursor
        barWidth: 2,
        barRadius: 1,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        mediaControls: false, // We'll create custom controls
        interact: true, // Allow clicking to seek
        hideScrollbar: true,
        url: getAudioUrl(file),
      });

      wavesurferRef.current = wavesurfer;

      // Event listeners
      wavesurfer.on('ready', () => {
        setIsLoading(false);
        setDuration(formatTime(wavesurfer.getDuration()));
        console.log('Audio waveform loaded for:', file.name);
      });

      wavesurfer.on('play', () => {
        setIsPlaying(true);
      });

      wavesurfer.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurfer.on('audioprocess', () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      wavesurfer.on('interaction', () => {
        setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
      });

      wavesurfer.on('error', (error) => {
        console.error('WaveSurfer error:', error);
        setError('Failed to load audio file');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Failed to create WaveSurfer instance:', err);
      setError('Failed to initialize audio player');
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [file.id, file.url]);

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
  };

  const handleSkip = (seconds: number) => {
    if (!wavesurferRef.current) return;
    const currentTime = wavesurferRef.current.getCurrentTime();
    const newTime = Math.max(0, Math.min(currentTime + seconds, wavesurferRef.current.getDuration()));
    wavesurferRef.current.seekTo(newTime / wavesurferRef.current.getDuration());
  };

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <HiExclamationTriangle className="w-6 h-6 text-red-400" />
          <div>
            <div className="text-red-400 font-medium">Audio Error</div>
            <div className="text-sm text-gray-400">{error}</div>
          </div>
        </div>
        <div className="mt-3">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            Download audio file
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <HiMusicalNote className="w-6 h-6 text-purple-400" />
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate" title={file.name}>
            {file.name}
          </div>
          <div className="text-sm text-gray-400">
            {currentTime} / {duration}
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="relative">
        <div 
          ref={waveformRef} 
          className="w-full bg-black/20 rounded-lg overflow-hidden"
          style={{ minHeight: '80px' }}
        />
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
        {/* Skip backward */}
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

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Stop */}
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

        {/* Skip forward */}
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
      </div>

      {/* Fallback audio controls */}
      <details className="text-sm">
        <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
          Show browser audio controls
        </summary>
        <div className="mt-2">
          <audio 
            controls 
            src={getAudioUrl(file)} 
            className="w-full"
            crossOrigin="anonymous"
          />
        </div>
      </details>
    </div>
  );
};

export default EnhancedAudioPlayer;