import React, { useState } from 'react';

const POLL_INTERVAL = 5000; // 5 seconds

interface ClosedCaptionButtonProps {
  fileId: number;
  onCaptionsGenerated?: () => void; // Callback when captions are successfully generated
}

const ClosedCaptionButton: React.FC<ClosedCaptionButtonProps> = ({ fileId, onCaptionsGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobName, setJobName] = useState<string | null>(null);
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);

  const handleGenerateCaptions = async () => {
    setIsProcessing(true);
    try {
      console.log('Generating captions for file:', fileId);
      
      // Start caption generation
      const response = await fetch(`/api/caption/${fileId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to start caption generation: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Full response result:', result);
      
      if (!result.jobName) {
        throw new Error('No job name returned from server');
      }
      
      setJobName(result.jobName);
      console.log('Caption job started:', result.jobName);

      // Poll for completion
      pollForCompletion(result.jobName);
    } catch (error) {
      console.error('Error generating captions:', error);
      setIsProcessing(false);
    }
  };

  const pollForCompletion = async (jobName: string) => {
    if (!jobName) {
      console.error('Cannot poll - jobName is undefined');
      setIsProcessing(false);
      return;
    }

    const checkStatus = async () => {
      try {
        console.log('Checking status for job:', jobName);

        const statusResponse = await fetch(`/api/caption/status/${jobName}`, {
          credentials: 'include',
        });

        if (!statusResponse.ok) {
          console.error('Status check failed:', statusResponse.status, statusResponse.statusText);
          setIsProcessing(false);
          return;
        }

        const statusResult = await statusResponse.json();
        console.log('Job status:', statusResult.status);

        if (statusResult.status === 'COMPLETED') {
          console.log('Job completed, fetching transcript...');
          
          // Get the final transcript
          const transcriptResponse = await fetch(`/api/caption/transcript/${jobName}`, {
            credentials: 'include',
          });
          
          if (!transcriptResponse.ok) {
            console.error('Transcript fetch failed:', transcriptResponse.status, transcriptResponse.statusText);
            setIsProcessing(false);
            return;
          }
          
          const transcriptResult = await transcriptResponse.json();
          setCaptionUrl(transcriptResult.captionUrl);
          setIsProcessing(false);
          console.log('Captions ready:', transcriptResult.captionUrl);
          
          // Notify parent component that captions are now available
          if (onCaptionsGenerated) {
            onCaptionsGenerated();
          }
        } else if (statusResult.status === 'FAILED') {
          console.error('Transcription job failed');
          setIsProcessing(false);
        } else {
          // Still processing, check again in 5 seconds
          console.log('Job still processing, checking again in 5 seconds...');
          setTimeout(checkStatus, POLL_INTERVAL);
        }
      } catch (error) {
        console.error('Error checking status:', error);
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


