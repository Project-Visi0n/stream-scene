// client/components/Comments/CommentInput.tsx
import React, { useState, useRef } from 'react';
import { CommentCreateData } from '../../types/comments';

interface CommentInputProps {
  onSubmit: (data: CommentCreateData) => Promise<void>;
  currentTime?: number;
  allowAnonymous?: boolean;
  placeholder?: string;
  parentCommentId?: number;
  isReply?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  currentTime,
  allowAnonymous = true,
  placeholder = "Add a comment...",
  parentCommentId,
  isReply = false,
  onCancel,
  autoFocus = false
}) => {
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [useTimestamp, setUseTimestamp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 2000) {
      setError('Comment too long (max 2000 characters)');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const commentData: CommentCreateData = {
        content: content.trim(),
        parentCommentId,
      };

      // Add timestamp if enabled and available
      if (useTimestamp && currentTime !== undefined && !isReply) {
        commentData.timestampSeconds = currentTime;
      }

      // Add guest name for anonymous users
      if (allowAnonymous && guestName.trim()) {
        commentData.guestName = guestName.trim();
      }

      await onSubmit(commentData);
      
      // Reset form on success
      setContent('');
      setGuestName('');
      if (onCancel) onCancel();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`comment-input ${isReply ? 'ml-12 mt-3' : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Anonymous user name input */}
        {allowAnonymous && (
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name (optional)"
              className="text-sm border border-gray-300 rounded px-3 py-1 w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
            {currentTime !== undefined && !isReply && (
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useTimestamp}
                  onChange={(e) => setUseTimestamp(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>@ {formatTimestamp(currentTime)}</span>
              </label>
            )}
          </div>
        )}

        {/* Comment textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            className={`
              w-full min-h-[80px] max-h-[200px] resize-none border border-gray-300 rounded-lg px-3 py-2 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${error ? 'border-red-300 ring-red-500' : ''}
            `}
            autoFocus={autoFocus}
            disabled={submitting}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {content.length}/2000
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Emoji quick reactions */}
            <div className="flex space-x-1">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setContent(prev => prev + emoji)}
                  className="text-lg hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isReply && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${content.trim() && !submitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {submitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                isReply ? 'Reply' : 'Comment'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};