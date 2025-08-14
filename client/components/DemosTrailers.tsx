import React, { useEffect, useState, useRef } from 'react';
import { fileService } from '../services/fileService';
import WaveSurfer from 'wavesurfer.js';
import ClosedCaptionButton from './ClosedCaptionButton';

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

  useEffect(() => {
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
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // Filter for trailer-tagged files
  const trailerFiles = files.filter(file =>
    (typeof file.tags === 'string'
      ? file.tags.includes('trailer')
      : file.tags?.includes('trailer'))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-5xl mx-auto pt-10">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🎬 Demos & Trailers</h1>
        <div className="grid gap-10">
          {trailerFiles.length === 0 && (
            <div className="text-center text-gray-400">No trailer files found.</div>
          )}
          {trailerFiles.map(file => (
            <div key={file.id} className="mb-8">
              <h3 className="text-2xl font-semibold text-white mb-4">{file.name}</h3>
              {file.type.startsWith('video/') ? (
                <div>
                  <video
                    controls
                    width={640}
                    crossOrigin="anonymous"
                    style={{ background: "#000" }}
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
                <div className="w-full max-w-2xl">
                  <div id={`waveform-${file.id}`} className="w-full mb-4" style={{ minHeight: '80px' }}></div>
                  <audio controls src={file.url} className="w-full" />
                </div>
              ) : (
                <div className="text-gray-400">Unsupported file type</div>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Tags: {JSON.stringify(file.tags)} | Has trailer: {file.tags?.includes('trailer') ? 'YES' : 'NO'} | Has caption: {file.captionUrl ? 'YES' : 'NO'}
              </div>
              {file.captionUrl && (
                <div className="text-green-500 text-xs mt-1">✓ Captions available</div>
              )}
              {file.tags?.includes('trailer') && !file.captionUrl && (
                <div className="mt-4">
                  <p className="text-green-400 text-sm">Showing CC Button</p>
                  <ClosedCaptionButton fileId={file.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemosTrailers;
