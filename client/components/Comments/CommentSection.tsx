// client/components/Comments/CommentSection.tsx
import React, { useState, useEffect } from 'react';
import { CommentInput } from './CommentInput';
import { CommentThread } from './CommentThread';
import { Comment, CommentCreateData } from '../../types/comments';

interface CommentSectionProps {
  fileId: number;
  currentTime?: number; // Current playback time for video/audio
  isOwner?: boolean;
  allowAnonymous?: boolean;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  fileId,
  currentTime = 0,
  isOwner = false,
  allowAnonymous = true,
  className = ''
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'timestamp'>('newest');
  const [filterByTime, setFilterByTime] = useState(false);

  // Fetch comments for the file
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/comments?fileId=${fileId}&sortBy=${sortBy}`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        
        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [fileId, sortBy]);

  // Handle new comment creation
  const handleCreateComment = async (commentData: CommentCreateData) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...commentData,
          fileId,
          timestampSeconds: commentData.timestampSeconds || currentTime
        }),
      });

      if (!response.ok) throw new Error('Failed to create comment');
      
      const newComment = await response.json();
      setComments(prev => [newComment, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
    }
  };

  // Handle comment update
  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to update comment');
      
      const updatedComment = await response.json();
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, isDeleted: true, content: '[Comment deleted]' }
            : comment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  // Handle comment reaction
  const handleReaction = async (commentId: number, emoji: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      
      // Update comments with new reaction data
      const reactionData = await response.json();
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, reactions: reactionData.reactions }
            : comment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
    }
  };

  // Filter comments based on current playback time
  const getFilteredComments = () => {
    if (!filterByTime || currentTime === undefined) return comments;
    
    const timeWindow = 30; // Show comments within 30 seconds of current time
    return comments.filter(comment => {
      if (!comment.timestampSeconds) return true;
      return Math.abs(comment.timestampSeconds - currentTime) <= timeWindow;
    });
  };

  // Group comments into threads (top-level and replies)
  const getCommentThreads = () => {
    const filtered = getFilteredComments();
    const topLevel = filtered.filter(comment => !comment.parentCommentId);
    
    return topLevel.map(comment => ({
      comment,
      replies: filtered.filter(reply => reply.parentCommentId === comment.id)
    }));
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`comment-section ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`comment-section bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Comments ({comments.length})
          </h3>
          
          <div className="flex items-center space-x-4">
            {/* Time filter toggle */}
            {currentTime !== undefined && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filterByTime}
                  onChange={(e) => setFilterByTime(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Show nearby ({formatTimestamp(currentTime)})</span>
              </label>
            )}
            
            {/* Sort options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="timestamp">By timestamp</option>
            </select>
          </div>
        </div>

        {/* Comment input */}
        <CommentInput
          onSubmit={handleCreateComment}
          currentTime={currentTime}
          allowAnonymous={allowAnonymous}
          placeholder="Add a comment..."
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Comments list */}
      <div className="max-h-96 overflow-y-auto">
        {getCommentThreads().length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {getCommentThreads().map(({ comment, replies }) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={replies}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                onReaction={handleReaction}
                onReply={handleCreateComment}
                isOwner={isOwner}
                allowAnonymous={allowAnonymous}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};