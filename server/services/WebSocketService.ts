import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Comment from '../models/Comment.js';
import Canvas from '../models/Canvas.js';
import CanvasCollaborator from '../models/CanvasCollaborator.js';
import { User } from '../models/User.js';

interface SocketUserData {
  userId?: number;
  guestName?: string;
  guestIdentifier?: string;
  canvasId?: string;
  fileId?: string;
}

interface CanvasUpdateData {
  canvasData: any;
  operation: 'draw' | 'erase' | 'text' | 'clear' | 'undo' | 'redo';
  userId?: number;
  guestIdentifier?: string;
  timestamp: number;
}

interface CommentData {
  content: string;
  timestampSeconds?: number;
  parentCommentId?: number;
  guestName?: string;
  guestEmail?: string;
}

export class WebSocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://streamscene.net', 'https://www.streamscene.net']
          : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // Handle user authentication/identification
      socket.on('user-identify', (userData: SocketUserData) => {
        socket.data.user = userData;
      });

      // Canvas collaboration events
      socket.on('join-canvas', async (canvasId: string) => {
        try {
          let canvas = await Canvas.findByPk(canvasId);

          // Auto-create canvas if it doesn't exist
          if (!canvas) {
            const defaultCanvasData = JSON.stringify({
              version: 1,
              objects: [],
              background: '#ffffff'
            });

            canvas = await Canvas.create({
              id: canvasId,
              userId: 1, // Default user ID, could be made configurable
              name: canvasId,
              description: `Auto-created canvas: ${canvasId}`,
              width: 800,
              height: 600,
              backgroundColor: '#ffffff',
              isPublic: true,
              allowAnonymousEdit: true,
              canvasData: defaultCanvasData,
              version: 1,
              maxCollaborators: 10
            });
          }

          // Check permissions
          const userData = socket.data.user as SocketUserData;
          let canJoin = canvas.isPublic || canvas.allowAnonymousEdit;

          if (userData?.userId) {
            canJoin = canJoin || 
              canvas.userId === userData.userId ||
              Boolean(canvas.collaborators?.some((collab: any) => collab.userId === userData.userId));
          }

          if (!canJoin) {
            socket.emit('error', { message: 'Access denied to canvas' });
            return;
          }

          // Join canvas room
          socket.join(`canvas:${canvasId}`);
          socket.data.canvasId = canvasId;

          // Notify others of new collaborator
          socket.to(`canvas:${canvasId}`).emit('collaborator-joined', {
            socketId: socket.id,
            user: userData
          });

          // Send current canvas state
          socket.emit('canvas-state', {
            canvasData: JSON.parse(canvas.canvasData),
            version: canvas.version
          });
        } catch (error) {
          console.error('Error joining canvas:', error);
          socket.emit('error', { message: 'Failed to join canvas' });
        }
      });

      socket.on('leave-canvas', (canvasId: string) => {
        socket.leave(`canvas:${canvasId}`);
        socket.to(`canvas:${canvasId}`).emit('collaborator-left', {
          socketId: socket.id,
          user: socket.data.user
        });
        socket.data.canvasId = undefined;
      });

      // Real-time canvas updates
      socket.on('canvas-update', async (data: CanvasUpdateData) => {

        const canvasId = socket.data.canvasId;
        if (!canvasId) {
          socket.emit('error', { message: 'Not joined to any canvas' });
          return;
        }

        try {
          // Broadcast to other collaborators immediately for responsiveness
          socket.to(`canvas:${canvasId}`).emit('canvas-update', {
            ...data,
            socketId: socket.id,
            user: socket.data.user
          });

          // Update database periodically (not on every stroke for performance)
          if (data.operation === 'draw' && Math.random() < 0.1) { // 10% chance to save
            const canvas = await Canvas.findByPk(canvasId);
            if (canvas) {
              await canvas.update({
                canvasData: JSON.stringify(data.canvasData),
                version: canvas.version + 1,
                lastActivity: new Date()
              });
            }
          }
        } catch (error) {
          console.error('Error handling canvas update:', error);
          socket.emit('error', { message: 'Failed to update canvas' });
        }
      });

      // Cursor tracking for collaboration
      socket.on('cursor-move', (data: { x: number; y: number; canvasId: string }) => {
        socket.to(`canvas:${data.canvasId}`).emit('cursor-move', {
          ...data,
          socketId: socket.id,
          user: socket.data.user
        });
      });

      // Comments on files (video/audio with timestamps)
      socket.on('join-file', (fileId: string) => {
        socket.join(`file:${fileId}`);
        socket.data.fileId = fileId;
      });

      socket.on('leave-file', (fileId: string) => {
        socket.leave(`file:${fileId}`);
        socket.data.fileId = undefined;
      });

      // Real-time comments
      socket.on('new-comment', async (data: CommentData & { fileId: string }) => {
        try {
          const userData = socket.data.user as SocketUserData;
          
          let commentData: any = {
            fileId: data.fileId,
            content: data.content.trim(),
            timestampSeconds: data.timestampSeconds || null,
            parentCommentId: data.parentCommentId || null,
            isModerated: false
          };

          // Handle authenticated vs anonymous users
          if (userData?.userId) {
            commentData.userId = userData.userId;
          } else {
            if (!data.guestName || data.guestName.trim().length === 0) {
              socket.emit('error', { message: 'Guest name is required for anonymous comments' });
              return;
            }
            
            commentData.guestName = data.guestName.trim();
            commentData.guestEmail = data.guestEmail?.trim() || null;
            commentData.guestIdentifier = userData?.guestIdentifier || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }

          const comment = await Comment.create(commentData);
          
          // Fetch the created comment with associations
          const createdComment = await Comment.findByPk(comment.id, {
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'name'],
                required: false
              }
            ]
          });

          // Broadcast to all users viewing this file
          this.io.to(`file:${data.fileId}`).emit('comment-added', createdComment);

        } catch (error) {
          console.error('Error creating comment:', error);
          socket.emit('error', { message: 'Failed to create comment' });
        }
      });

      // Real-time comment reactions
      socket.on('comment-reaction', async (data: { 
        commentId: number; 
        emoji: string; 
        action: 'add' | 'remove';
        guestName?: string;
      }) => {
        try {
          const userData = socket.data.user as SocketUserData;

          if (data.action === 'add') {
            // Add reaction logic would go here
            // For now, just broadcast
            this.io.to(`file:${socket.data.fileId}`).emit('reaction-added', {
              commentId: data.commentId,
              emoji: data.emoji,
              user: userData
            });
          } else {
            // Remove reaction logic would go here
            this.io.to(`file:${socket.data.fileId}`).emit('reaction-removed', {
              commentId: data.commentId,
              emoji: data.emoji,
              user: userData
            });
          }
        } catch (error) {
          console.error('Error handling comment reaction:', error);
          socket.emit('error', { message: 'Failed to handle reaction' });
        }
      });

      // Video/audio synchronization for collaborative viewing
      socket.on('media-sync', (data: { 
        fileId: string; 
        currentTime: number; 
        isPlaying: boolean; 
        action: 'play' | 'pause' | 'seek';
      }) => {
        socket.to(`file:${data.fileId}`).emit('media-sync', {
          ...data,
          socketId: socket.id,
          user: socket.data.user
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        // Notify canvas collaborators
        if (socket.data.canvasId) {
          socket.to(`canvas:${socket.data.canvasId}`).emit('collaborator-left', {
            socketId: socket.id,
            user: socket.data.user
          });
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  // Method to emit events from REST API routes
  public emitToCanvas(canvasId: string, event: string, data: any) {
    this.io.to(`canvas:${canvasId}`).emit(event, data);
  }

  public emitToFile(fileId: string, event: string, data: any) {
    this.io.to(`file:${fileId}`).emit(event, data);
  }

  public getIO() {
    return this.io;
  }
}

let webSocketService: WebSocketService | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}