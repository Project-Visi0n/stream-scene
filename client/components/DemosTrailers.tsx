import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fileService } from '../services/fileService';
import WaveSurfer from 'wavesurfer.js';

interface FileRecord {
  id: number;
  name: string;
  url: string;
  type: string;
  tags?: string[];
}

const DemosTrailers: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioWaveforms, setAudioWaveforms] = useState<{ [id: number]: WaveSurfer }>( {} );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-5xl mx-auto pt-10">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">🎬 Demos & Trailers</h1>
        <div className="grid gap-10">
          {files.length === 0 && (
            <div className="text-center text-gray-400">No demo or trailer files found.</div>
          )}
          {files.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/60 rounded-xl shadow-lg p-8 flex flex-col items-center"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">{file.name}</h2>
              {file.type.startsWith('video/') ? (
                <video
                  src={file.url}
                  controls
                  className="w-full max-w-3xl rounded-lg shadow-lg bg-black"
                  style={{ minHeight: '400px', maxHeight: '70vh' }}
                />
              ) : file.type.startsWith('audio/') ? (
                <div className="w-full max-w-2xl">
                  <div id={`waveform-${file.id}`} className="w-full mb-4"></div>
                  <audio controls src={file.url} className="w-full" />
                </div>
              ) : (
                <div className="text-gray-400">Unsupported file type</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemosTrailers;
