import React, { useEffect, useState, useRef } from 'react';
import { fileService } from '../services/fileService';
import WaveSurfer from 'wavesurfer.js';
import ClosedCaptionButton from './ClosedCaptionButton';
import useAuth from '../hooks/useAuth';

interface FileRecord {
  id: number;
  name: string;
  url: string;
  type: string;
  tags?: string[];
  captionUrl?: string;
}

const DemosTrailers: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioWaveforms, setAudioWaveforms] = useState<{ [id: number]: WaveSurfer }>({});
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
          const demoTrailerFiles = await fileService.getFiles(['demo', 'trailer']);
          setFiles(demoTrailerFiles);
        } catch (err) {
          setError('Failed to load demo/trailer files');
        } finally {
          setLoading(false);
        }
      };
      fetchFiles();
    }
  }, [authLoading, user]);

  useEffect(() => {
    // Clean up waveforms on unmount
    return () => {
      Object.values(audioWaveforms).forEach(wave => wave.destroy());
    };
  }, [audioWaveforms]);

  useEffect(() => {
    // Create waveform for each audio file
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        const containerId = `waveform-${file.id}`;
        if (!audioWaveforms[file.id] && document.getElementById(containerId)) {
          const wavesurfer = WaveSurfer.create({
            container: `#${containerId}`,
            waveColor: '#7c3aed',
            progressColor: '#6366f1',
            height: 80,
            barWidth: 2,
            url: file.url,
          });
          setAudioWaveforms(prev => ({ ...prev, [file.id]: wavesurfer }));
        }
      }
    });
    // eslint-disable-next-line
  }, [files]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <div className="text-gray-300">Loading your demos and trailers...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <div className="text-red-400 text-lg font-medium">Authentication Required</div>
            <div className="text-gray-300 mt-2">Please log in to access your demos and trailers</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-red-500/20 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-red-400 text-lg font-medium">Error Loading Content</div>
            <div className="text-gray-300 mt-2">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Filter for trailer-tagged files
  const trailerFiles = files.filter(file =>
    file.tags?.includes('trailer')
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <span className="mr-3 text-4xl">🎬</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Demos & Trailers
            </span>
          </h1>
          <p className="text-gray-300">Showcase your best work and creative content</p>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
          {trailerFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Demos or Trailers Found</h3>
              <p className="text-gray-300 mb-6">Upload your demo reels and trailers in the Project Center to showcase them here</p>
              <div className="bg-gradient-to-br from-blue-800/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-300">
                  💡 <strong>Tip:</strong> Tag your files with "demo" or "trailer" in the Project Center to have them appear here automatically
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your Showcase</h2>
                <div className="text-sm text-gray-400">
                  {trailerFiles.length} {trailerFiles.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              
              <div className="grid gap-8">
                {trailerFiles.map(file => (
                  <div key={file.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-2xl">
                        {file.type.startsWith('video/') ? '🎥' : 
                         file.type.startsWith('audio/') ? '🎵' : '📄'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{file.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {file.tags?.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {file.type.startsWith('video/') ? (
                      <div className="rounded-lg overflow-hidden bg-black">
                        <video
                          controls
                          width="100%"
                          crossOrigin="anonymous"
                          style={{ background: "#000", maxWidth: "800px" }}
                          className="mx-auto"
                        >
                          <source src={file.url} type={file.type} />
                          {file.captionUrl && (
                            <track
                              kind="subtitles"
                              src={file.captionUrl}
                              srcLang="en"
                              label="English"
                              default
                            />
                          )}
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : file.type.startsWith('audio/') ? (
                      <div className="space-y-4">
                        <div className="bg-black/20 rounded-lg p-4">
                          <div id={`waveform-${file.id}`} className="w-full mb-4" style={{ minHeight: '80px' }}></div>
                          <audio controls src={file.url} className="w-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">📄</div>
                        <div>Unsupported file type for preview</div>
                      </div>
                    )}

                    {/* File Details */}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-400">
                        <span>Type: {file.type}</span>
                        {file.captionUrl && (
                          <span className="text-green-400 flex items-center gap-1">
                            <span>✓</span> Captions available
                          </span>
                        )}
                      </div>
                      
                      {file.tags?.includes('trailer') && !file.captionUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-300">Add captions:</span>
                          <ClosedCaptionButton fileId={file.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemosTrailers;