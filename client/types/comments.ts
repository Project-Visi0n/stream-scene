// client/types/comments.ts
export interface Comment {
  id: number;
  fileId: number;
  userId?: number | null;
  guestName?: string | null;
  guestIdentifier?: string | null;
  content: string;
  timestampSeconds?: number | null;
  parentCommentId?: number | null;
  isDeleted: boolean;
  isModerationHidden: boolean;
  isEdited: boolean;
  isModerated: boolean;
  moderatedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Populated associations
  user?: {
    id: number;
    name: string;
    profilePic?: string;
  };
  
  reactions?: CommentReaction[];
  replies?: Comment[];
  parentComment?: Comment;
}

export interface CommentReaction {
  id: number;
  commentId: number;
  userId?: number | null;
  guestIdentifier?: string | null;
  emoji: string;
  createdAt: string;
  
  // Populated user data
  user?: {
    id: number;
    name: string;
    profilePic?: string;
  };
}

export interface CommentCreateData {
  content: string;
  timestampSeconds?: number;
  parentCommentId?: number;
  guestName?: string;
}

export interface CommentUpdateData {
  content: string;
}

export interface CommentReactionData {
  emoji: string;
}

// WebSocket events for real-time comment updates
export interface CommentWebSocketEvents {
  'comment:created': Comment;
  'comment:updated': Comment;
  'comment:deleted': { commentId: number };
  'comment:reaction:added': { commentId: number; reaction: CommentReaction };
  'comment:reaction:removed': { commentId: number; reactionId: number };
}