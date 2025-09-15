import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import Comment from '../models/Comment.js';
import CommentReaction from '../models/CommentReaction.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';

const router = express.Router();

// Middleware to handle optional authentication (supports anonymous users)
const optionalAuth = (req: Request, res: Response, next: express.NextFunction) => {
  // Check if user is authenticated
  let user = null;
  
  if ((req as any).user) {
    user = (req as any).user;
  } else if ((req as any).session?.user) {
    user = (req as any).session.user;
    (req as any).user = user;
  }
  
  // Continue regardless of auth status (anonymous users allowed)
  next();
};

// Get comments for a file with threading
router.get('/file/:fileId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    console.log(`📝 Loading comments for file ${fileId}`);
    
    // Verify file exists
    const file = await File.findByPk(fileId);
    if (!file) {
      console.log(`❌ File ${fileId} not found`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // Get comments with minimal data to avoid association issues
    const comments = await Comment.findAll({
      where: { 
        fileId: parseInt(fileId),
        parentCommentId: null, // Only top-level comments
        isDeleted: false // Don't show deleted comments
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'], // Use 'name' instead of 'displayName'
          required: false // Allow comments without users (anonymous)
        }
      ],
      order: [
        ['timestampSeconds', 'ASC'],
        ['createdAt', 'ASC']
      ],
      offset,
      limit: Number(limit)
    });
    
    console.log(`✅ Found ${comments.length} comments for file ${fileId}`);
    
    res.json(comments);
  } catch (error) {
    console.error('❌ Error fetching comments for file:', req.params.fileId, error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new comment (supports anonymous users)
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { 
      fileId,
      content, 
      timestampSeconds, 
      parentCommentId, 
      guestName, 
      guestEmail 
    } = req.body;
    
    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    // Verify file exists
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Verify parent comment exists if provided
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        where: { id: parentCommentId, fileId }
      });
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }
    
    const user = (req as any).user;
    const commentData = {
      fileId: parseInt(fileId),
      content: content.trim(),
      timestampSeconds: timestampSeconds || null,
      parentCommentId: parentCommentId || null,
      isDeleted: false,
      isModerationHidden: false,
      isEdited: false,
      isModerated: false,
      userId: user?.id || null,
      guestName: user ? null : (guestName?.trim() || null),
      guestEmail: user ? null : (guestEmail?.trim() || null),
      guestIdentifier: user ? null : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // For anonymous users, require guest name
    if (!user && !commentData.guestName) {
      return res.status(400).json({ error: 'Guest name is required for anonymous comments' });
    }
    
    const comment = await Comment.create(commentData);
    
    // Fetch the created comment with associations
    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    
    res.status(201).json(createdComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      error: 'Failed to create comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a comment (only by author or admin)
router.put('/:commentId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const user = (req as any).user;
    
    // Check if user can edit this comment
    const canEdit = user && (
      comment.userId === user.id || 
      user.role === 'admin' || 
      user.role === 'moderator'
    );
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }
    
    await comment.update({
      content: content.trim(),
      isEdited: true
    });
    
    // Fetch updated comment with associations
    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'displayName'],
          required: false
        }
      ]
    });
    
    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment (only by author or admin)
router.delete('/:commentId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const user = (req as any).user;
    
    // Check if user can delete this comment
    const canDelete = user && (
      comment.userId === user.id || 
      user.role === 'admin' || 
      user.role === 'moderator'
    );
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Soft delete or hard delete based on whether it has replies
    const hasReplies = await Comment.count({
      where: { parentCommentId: commentId }
    });
    
    if (hasReplies > 0) {
      // Soft delete - keep structure but mark as deleted
      await comment.update({
        content: '[Comment deleted]',
        isModerated: true,
        moderatedReason: 'Deleted by user'
      });
    } else {
      // Hard delete - no replies
      await comment.destroy();
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Add reaction to comment
router.post('/:commentId/reactions', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { emoji, guestName } = req.body;
    
    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const user = (req as any).user;
    let reactionData: any = {
      commentId,
      emoji
    };
    
    if (user) {
      // Check if user already reacted with this emoji
      const existingReaction = await CommentReaction.findOne({
        where: { commentId, userId: user.id, emoji }
      });
      
      if (existingReaction) {
        return res.status(400).json({ error: 'You have already reacted with this emoji' });
      }
      
      reactionData.userId = user.id;
    } else {
      // Anonymous user
      if (!guestName || guestName.trim().length === 0) {
        return res.status(400).json({ error: 'Guest name is required for anonymous reactions' });
      }
      
      reactionData.guestName = guestName.trim();
      reactionData.guestIdentifier = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const reaction = await CommentReaction.create(reactionData);
    
    // Fetch reaction with user info
    const createdReaction = await CommentReaction.findByPk(reaction.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName'],
          required: false
        }
      ]
    });
    
    res.status(201).json(createdReaction);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from comment
router.delete('/:commentId/reactions/:reactionId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { commentId, reactionId } = req.params;
    
    const reaction = await CommentReaction.findOne({
      where: { id: reactionId, commentId }
    });
    
    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found' });
    }
    
    const user = (req as any).user;
    
    // Check if user can remove this reaction
    const canRemove = user && reaction.userId === user.id;
    
    if (!canRemove) {
      return res.status(403).json({ error: 'Not authorized to remove this reaction' });
    }
    
    await reaction.destroy();
    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Get comments at specific timestamp (for video/audio sync)
router.get('/file/:fileId/timestamp/:timestamp', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { fileId, timestamp } = req.params;
    const timestampSeconds = parseFloat(timestamp);
    
    if (isNaN(timestampSeconds)) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
    }
    
    // Get comments within ±5 seconds of the timestamp
    const timeWindow = 5;
    const comments = await Comment.findAll({
      where: {
        fileId,
        timestampSeconds: {
          [Op.between]: [
            timestampSeconds - timeWindow,
            timestampSeconds + timeWindow
          ]
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'displayName'],
          required: false
        },
        {
          model: CommentReaction,
          as: 'reactions',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'displayName'],
              required: false
            }
          ]
        }
      ],
      order: [['timestampSeconds', 'ASC']]
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching timestamp comments:', error);
    res.status(500).json({ error: 'Failed to fetch timestamp comments' });
  }
});

export default router;