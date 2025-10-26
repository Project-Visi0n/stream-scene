import React, { useState } from 'react';

const POLL_INTERVAL = 5000; // 5 seconds

interface ClosedCaptionButtonProps {
  fileId: number;
  onCaptionReady?: (captionUrl: string) => void; // Direct callback with caption URL
}

const ClosedCaptionButton: React.FC<ClosedCaptionButtonProps> = ({ fileId, onCaptionReady }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobName, setJobName] = useState<string | null>(null);
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);

  const handleGenerateCaptions = async () => {
    setIsProcessing(true);
    try {

      
      // Start caption generation
      const response = await fetch(`/api/caption/${fileId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });




      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`Failed to start caption generation: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      
      if (!result.jobName) {
        throw new Error('No job name returned from server');
      }
      
      setJobName(result.jobName);


      // Poll for completion
      pollForCompletion(result.jobName);
    } catch (error) {

      setIsProcessing(false);
    }
  };

  const pollForCompletion = async (jobName: string) => {
    if (!jobName) {

      setIsProcessing(false);
      return;
    }

    const checkStatus = async () => {
      try {


        const statusResponse = await fetch(`/api/caption/status/${jobName}`, {
          credentials: 'include',
        });

        if (!statusResponse.ok) {

          setIsProcessing(false);
          return;
        }

        const statusResult = await statusResponse.json();


        if (statusResult.status === 'COMPLETED') {

          
          // Get the final transcript
          const transcriptResponse = await fetch(`/api/caption/transcript/${jobName}`, {
            credentials: 'include',
          });
          
          if (!transcriptResponse.ok) {

            setIsProcessing(false);
            return;
          }
          
          const transcriptResult = await transcriptResponse.json();
          setCaptionUrl(transcriptResult.captionUrl);
          setIsProcessing(false);

          
          // Directly notify parent with the caption URL
          if (onCaptionReady) {
            onCaptionReady(transcriptResult.captionUrl);
          }
        } else if (statusResult.status === 'FAILED') {

          setIsProcessing(false);
        } else {
          // Still processing, check again in 5 seconds

          setTimeout(checkStatus, POLL_INTERVAL);
        }
      } catch (error) {

        setIsProcessing(false);
      }
    };

    checkStatus();
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleGenerateCaptions}
        disabled={isProcessing}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
      >
        {isProcessing ? 'Generating Captions...' : 'Generate Captions'}
      </button>
      {captionUrl && (
        <p className="text-green-400 text-sm mt-2">✓ Captions generated successfully!</p>
      )}
    </div>
  );
};

export default ClosedCaptionButton;


