import React, { useState } from 'react';

interface ClosedCaptionButtonProps {
  fileId: number;
  onCaptionRequested?: () => void;
}

const ClosedCaptionButton: React.FC<ClosedCaptionButtonProps> = ({ fileId, onCaptionRequested }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/caption/${fileId}`, { method: 'POST' });
      if (onCaptionRequested) onCaptionRequested();
    } catch (error) {
      // Optionally handle error
      alert('Failed to start captioning.');
    }
    setIsProcessing(false);
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isProcessing}>
        {isProcessing ? 'Generating captions...' : 'CC'}
      </button>
      {isProcessing && (
        <p>Generating captions, please wait...</p>
      )}
    </div>
  );
};

export default ClosedCaptionButton;