import express, { Request, Response } from 'express';
import Canvas from '../models/Canvas.js';
import CanvasCollaborator from '../models/CanvasCollaborator.js';
import { User } from '../models/User.js';

const router = express.Router();

// Middleware to handle optional authentication (supports anonymous users)
const optionalAuth = (req: Request, res: Response, next: express.NextFunction) => {
  let user = null;
  
  if ((req as any).user) {
    user = (req as any).user;
  } else if ((req as any).session?.user) {
    user = (req as any).session.user;
    (req as any).user = user;
  }
  
  next();
};

// Create a new canvas
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      isPublic = false, 
      allowAnonymousEdit = false,
      maxCollaborators = 10 
    } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Canvas title is required' });
    }
    
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to create canvas' });
    }
    
    // Generate a unique share token
    const shareToken = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    
    const canvas = await Canvas.create({
      name: title.trim(),
      description: description?.trim() || null,
      userId: user.id, // Use userId, not ownerId
      shareToken,
      isPublic,
      allowAnonymousEdit,
      maxCollaborators,
      canvasData: JSON.stringify({}), // Convert to string
      version: 1,
      width: 800, // Default dimensions
      height: 600,
      backgroundColor: '#ffffff'
    });
    
    // Add the creator as a collaborator with admin permissions
    await CanvasCollaborator.create({
      canvasId: canvas.id,
      userId: user.id,
      permission: 'admin',
      joinedAt: new Date()
    });
    
    // Fetch the created canvas with owner info
    const createdCanvas = await Canvas.findByPk(canvas.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name']
        }
      ]
    });
    
    res.status(201).json(createdCanvas);
  } catch (error) {
    console.error('Error creating canvas:', error);
    res.status(500).json({ error: 'Failed to create canvas' });
  }
});

// Get user's canvases
router.get('/my-canvases', optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Get canvases owned by user or where user is a collaborator
    const canvases = await Canvas.findAndCountAll({
      include: [
        {
          model: CanvasCollaborator,
          as: 'collaborators',
          where: { userId: user.id },
          required: true
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name']
        }
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit: Number(limit)
    });
    
    res.json({
      canvases: canvases.rows,
      pagination: {
        total: canvases.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(canvases.count / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user canvases:', error);
    res.status(500).json({ error: 'Failed to fetch canvases' });
  }
});

// Get canvas by share token (public access)
router.get('/shared/:shareToken', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    
    const canvas = await Canvas.findOne({
      where: { shareToken },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name']
        },
        {
          model: CanvasCollaborator,
          as: 'collaborators',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'name']
            }
          ]
        }
      ]
    });
    
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    // Check access permissions
    const user = (req as any).user;
    let hasAccess = canvas.isPublic;
    
    if (user) {
      // Check if user is owner or collaborator
      hasAccess = hasAccess || 
        canvas.userId === user.id ||
        Boolean(canvas.collaborators && canvas.collaborators.some((collab: any) => collab.userId === user.id));
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this canvas' });
    }
    
    res.json(canvas);
  } catch (error) {
    console.error('Error fetching shared canvas:', error);
    res.status(500).json({ error: 'Failed to fetch canvas' });
  }
});

// Update canvas data (drawing operations)
router.put('/:canvasId/data', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId } = req.params;
    const { canvasData, operation } = req.body;
    
    if (!canvasData) {
      return res.status(400).json({ error: 'Canvas data is required' });
    }
    
    const canvas = await Canvas.findByPk(canvasId, {
      include: [
        {
          model: CanvasCollaborator,
          as: 'collaborators'
        }
      ]
    });
    
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    
    // Check edit permissions
    let canEdit = canvas.allowAnonymousEdit;
    
    if (user) {
      canEdit = canEdit || 
        canvas.userId === user.id ||
        Boolean(canvas.collaborators && canvas.collaborators.some((collab: any) => 
          collab.userId === user.id && 
          ['admin', 'edit'].includes(collab.permission)
        ));
    }
    
    if (!canEdit) {
      return res.status(403).json({ error: 'No permission to edit this canvas' });
    }
    
    // Update canvas with version control
    await canvas.update({
      canvasData,
      version: canvas.version + 1,
      lastActivity: new Date()
    });
    
    // Fetch updated canvas
    const updatedCanvas = await Canvas.findByPk(canvasId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'name']
        }
      ]
    });
    
    res.json({
      canvas: updatedCanvas,
      operation: operation || 'update'
    });
  } catch (error) {
    console.error('Error updating canvas data:', error);
    res.status(500).json({ error: 'Failed to update canvas' });
  }
});

// Add collaborator to canvas
router.post('/:canvasId/collaborators', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId } = req.params;
    const { userEmail, permission = 'view' } = req.body;
    
    const canvas = await Canvas.findByPk(canvasId);
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    
    // Check if user can add collaborators (owner or admin)
    const canAddCollaborators = user && (
      canvas.userId === user.id ||
      await CanvasCollaborator.findOne({
        where: { 
          canvasId: Number(canvasId), 
          userId: user.id, 
          permission: 'admin' 
        }
      })
    );
    
    if (!canAddCollaborators) {
      return res.status(403).json({ error: 'No permission to add collaborators' });
    }
    
    // Find the user to add
    const targetUser = await User.findOne({ where: { email: userEmail } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already a collaborator
    const existingCollaborator = await CanvasCollaborator.findOne({
      where: { canvasId, userId: targetUser.id }
    });
    
    if (existingCollaborator) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }
    
    // Check max collaborators limit
    const collaboratorCount = await CanvasCollaborator.count({
      where: { canvasId }
    });
    
    if (collaboratorCount >= canvas.maxCollaborators) {
      return res.status(400).json({ error: 'Maximum collaborators limit reached' });
    }
    
    const collaborator = await CanvasCollaborator.create({
      canvasId: Number(canvasId),
      userId: targetUser.id,
      permission,
      joinedAt: new Date()
    });
    
    // Fetch collaborator with user info
    const createdCollaborator = await CanvasCollaborator.findByPk(collaborator.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }
      ]
    });
    
    res.status(201).json(createdCollaborator);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Update collaborator permissions
router.put('/:canvasId/collaborators/:collaboratorId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId, collaboratorId } = req.params;
    const { permission } = req.body;
    
    if (!['view', 'edit', 'admin'].includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission level' });
    }
    
    const canvas = await Canvas.findByPk(canvasId);
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    
    // Check if user can update permissions (owner only)
    if (!user || canvas.userId !== user.id) {
      return res.status(403).json({ error: 'Only canvas owner can update permissions' });
    }
    
    const collaborator = await CanvasCollaborator.findOne({
      where: { id: collaboratorId, canvasId }
    });
    
    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }
    
    // Can't change owner's permission
    if (collaborator.userId === canvas.userId) {
      return res.status(400).json({ error: 'Cannot change owner permissions' });
    }
    
    await collaborator.update({ permission });
    
    // Fetch updated collaborator
    const updatedCollaborator = await CanvasCollaborator.findByPk(collaboratorId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }
      ]
    });
    
    res.json(updatedCollaborator);
  } catch (error) {
    console.error('Error updating collaborator:', error);
    res.status(500).json({ error: 'Failed to update collaborator' });
  }
});

// Remove collaborator from canvas
router.delete('/:canvasId/collaborators/:collaboratorId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId, collaboratorId } = req.params;
    
    const canvas = await Canvas.findByPk(canvasId);
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    const collaborator = await CanvasCollaborator.findOne({
      where: { id: collaboratorId, canvasId }
    });
    
    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }
    
    // Check permissions (owner, or collaborator removing themselves)
    const canRemove = user && (
      canvas.userId === user.id ||
      collaborator.userId === user.id
    );
    
    if (!canRemove) {
      return res.status(403).json({ error: 'No permission to remove collaborator' });
    }
    
    // Can't remove owner
    if (collaborator.userId === canvas.userId) {
      return res.status(400).json({ error: 'Cannot remove canvas owner' });
    }
    
    await collaborator.destroy();
    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// Delete canvas (owner only)
router.delete('/:canvasId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId } = req.params;
    
    const canvas = await Canvas.findByPk(canvasId);
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    
    // Only owner can delete
    if (!user || canvas.userId !== user.id) {
      return res.status(403).json({ error: 'Only canvas owner can delete' });
    }
    
    // Delete all collaborators first (cascade)
    await CanvasCollaborator.destroy({
      where: { canvasId }
    });
    
    await canvas.destroy();
    res.json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    console.error('Error deleting canvas:', error);
    res.status(500).json({ error: 'Failed to delete canvas' });
  }
});

// Get canvas activity/version history
router.get('/:canvasId/history', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { canvasId } = req.params;
    
    const canvas = await Canvas.findByPk(canvasId, {
      include: [
        {
          model: CanvasCollaborator,
          as: 'collaborators'
        }
      ]
    });
    
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }
    
    const user = (req as any).user;
    
    // Check access
    let hasAccess = canvas.isPublic;
    if (user) {
      hasAccess = hasAccess || 
        canvas.userId === user.id ||
        Boolean(canvas.collaborators && canvas.collaborators.some((collab: any) => collab.userId === user.id));
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // For now, return basic version info
    // In a full implementation, you'd have a CanvasHistory table
    res.json({
      currentVersion: canvas.version,
      lastActivity: canvas.lastActivity,
      created: canvas.createdAt,
      updated: canvas.updatedAt
    });
  } catch (error) {
    console.error('Error fetching canvas history:', error);
    res.status(500).json({ error: 'Failed to fetch canvas history' });
  }
});

export default router;