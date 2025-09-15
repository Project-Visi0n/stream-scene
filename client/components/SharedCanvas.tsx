import React from 'react';
import { useParams } from 'react-router-dom';
import CollaborativeCanvas from './CollaborativeCanvas';

const SharedCanvas: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Canvas Link</h1>
          <p className="text-gray-400">This shared canvas link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Shared Canvas</h1>
          <p className="text-gray-400 text-sm">
            You've been invited to collaborate on this canvas
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Canvas: {token}</h2>
              <p className="text-sm text-gray-400">Real-time collaborative drawing</p>
            </div>
            <div className="text-sm text-gray-400">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live Session
            </div>
          </div>
        </div>

        <CollaborativeCanvas canvasId={token} />
      </div>
    </div>
  );
};

export default SharedCanvas;