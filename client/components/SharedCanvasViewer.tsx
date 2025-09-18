import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CollaborativeCanvas from '../components/CollaborativeCanvas';
import { shareService, SharedFileAccess } from '../services/shareService';
import LoadingScreen from '../components/LoadingScreen';

const SharedCanvasViewer: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [sharedCanvas, setSharedCanvas] = useState<SharedFileAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid share token');
      setLoading(false);
      return;
    }

    const loadSharedCanvas = async () => {
      try {
        const data = await shareService.accessSharedFile(token);
        
        if (!data.canvas) {
          setError('This shared link is for a file, not a canvas');
          return;
        }
        
        setSharedCanvas(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to access shared canvas');
      } finally {
        setLoading(false);
      }
    };

    loadSharedCanvas();
  }, [token]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  if (!sharedCanvas?.canvas) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Canvas Not Found</h1>
          <p className="text-gray-300 mb-4">The shared canvas could not be loaded.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  const canvas = sharedCanvas.canvas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{canvas.name}</h1>
              {canvas.description && (
                <p className="text-gray-300 mt-1">{canvas.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Shared Canvas</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sharedCanvas.share.shareType === 'one-time' 
                    ? 'bg-orange-600 text-orange-100' 
                    : 'bg-green-600 text-green-100'
                }`}>
                  {sharedCanvas.share.shareType}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Accessed {sharedCanvas.share.accessCount} times
                {sharedCanvas.share.remainingAccess && 
                  ` (${sharedCanvas.share.remainingAccess} remaining)`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-[calc(100vh-140px)]">
        <CollaborativeCanvas
          canvasId={canvas.id.toString()}
          shareToken={canvas.shareToken}
          isOwner={false}
          allowAnonymousEdit={canvas.allowAnonymousEdit}
          initialBackgroundColor={canvas.backgroundColor}
        />
      </div>
    </div>
  );
};

export default SharedCanvasViewer;