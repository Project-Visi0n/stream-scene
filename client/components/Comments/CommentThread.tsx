// client/components/Comments/CommentThread.tsx
import React, { useState } from 'react';
import { Comment, CommentCreateData } from '../../types/comments';
import { CommentInput } from './CommentInput';

interface CommentThreadProps {
  comment: Comment;
  replies: Comment[];
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onReaction: (commentId: number, emoji: string) => Promise<void>;
  onReply: (data: CommentCreateData) => Promise<void>;
  isOwner?: boolean;
  allowAnonymous?: boolean;
  currentTime?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  replies,
  onUpdate,
  onDelete,
  onReaction,
  onReply,
  isOwner = false,
  allowAnonymous = true,
  currentTime
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const formatTimestamp = (seconds: number | null | undefined) => {
    if (!seconds && seconds !== 0) return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent component
      setEditContent(comment.content); // Reset on error
    }
  };

  const handleReply = async (data: CommentCreateData) => {
    const replyData = {
      ...data,
      parentCommentId: comment.id
    };
    await onReply(replyData);
    setShowReplyInput(false);
  };

  const handleQuickReaction = (emoji: string) => {
    onReaction(comment.id, emoji);
  };

  const canEdit = comment.userId && !comment.isDeleted;
  const canDelete = (comment.userId || isOwner) && !comment.isDeleted;
  const displayName = comment.user?.name || comment.guestName || 'Anonymous';
  const timestamp = formatTimestamp(comment.timestampSeconds);

  return (
    <div className="comment-thread">
      {/* Main comment */}
      <div className="flex space-x-3 p-4 hover:bg-gray-50 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user?.profilePic ? (
            <img
              src={comment.user.profilePic}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">
              {displayName}
            </span>
            
            {timestamp && (
              <button
                onClick={() => currentTime !== undefined && console.log('Jump to', comment.timestampSeconds)}
                className="text-xs text-blue-600 hover:text-blue-800 font-mono bg-blue-50 px-2 py-0.5 rounded"
                title="Jump to this time"
              >
                {timestamp}
              </button>
            )}
            
            <span className="text-xs text-gray-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
            
            {comment.isEdited && (
              <span className="text-xs text-gray-400 italic">edited</span>
            )}
          </div>

          {/* Comment text */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[60px] border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-900 text-sm whitespace-pre-wrap">
              {comment.isDeleted ? (
                <span className="text-gray-400 italic">[Comment deleted]</span>
              ) : comment.isModerationHidden ? (
                <div className="text-gray-400 italic">
                  [Comment hidden by moderator]
                  {comment.moderatedReason && (
                    <div className="text-xs mt-1">Reason: {comment.moderatedReason}</div>
                  )}
                </div>
              ) : (
                comment.content
              )}
            </div>
          )}

          {/* Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex items-center space-x-2 mt-2">
              {Object.entries(
                comment.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!comment.isDeleted && !comment.isModerationHidden && (
            <div className="flex items-center space-x-4 mt-2">
              {/* Quick reactions */}
              <div className="flex space-x-1">
                {['👍', '❤️', '😂', '😮'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    className="text-sm hover:bg-gray-100 rounded p-1 transition-colors"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Reply
              </button>

              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this comment?')) {
                      onDelete(comment.id);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                onSubmit={handleReply}
                currentTime={currentTime}
                allowAnonymous={allowAnonymous}
                placeholder="Write a reply..."
                parentCommentId={comment.id}
                isReply={true}
                onCancel={() => setShowReplyInput(false)}
                autoFocus={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <span className={`transform transition-transform ${showReplies ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span>{showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          </button>

          {showReplies && (
            <div className="border-l-2 border-gray-200 ml-4">
              {replies.map(reply => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  replies={[]} // Nested replies not implemented for simplicity
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onReaction={onReaction}
                  onReply={onReply}
                  isOwner={isOwner}
                  allowAnonymous={allowAnonymous}
                  currentTime={currentTime}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};