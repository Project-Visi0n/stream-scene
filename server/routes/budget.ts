import express from 'express';
import { requireAuth } from '../middleware/authMiddleWare.js';
import BudgetEntry from '../models/BudgetEntry.js';
import BudgetProject from '../models/BudgetProject.js';

const router = express.Router();

// Test route to verify budget routes are loaded
router.get('/test', (req, res) => {
  console.log('📊 Budget test route accessed');
  res.json({ 
    message: 'Budget routes are working!', 
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, email: req.user.email } : 'Not authenticated',
    models: {
      BudgetEntry: typeof BudgetEntry,
      BudgetProject: typeof BudgetProject
    }
  });
});

// Helper function to safely get user ID
const getUserId = (req: express.Request): number | null => {
  return req.user?.id ?? null;
};

// GET - Fetch all user's budget entries (both income and expenses)
router.get('/entries', requireAuth, async (req, res) => {
  try {
    console.log('📊 Budget entries route accessed by user:', req.user?.id);
    const userId = req.user?.id;
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('🔍 Fetching entries for user:', userId);
    const entries = await BudgetEntry.findAll({
      where: { user_id: userId },
      include: [{
        model: BudgetProject,
        as: 'project',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ Found ${entries.length} budget entries`);
    res.json(entries);
  } catch (error) {
    console.error('❌ Error fetching budget entries:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST - Create new budget entry (income or expense)
router.post('/entries', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { type, amount, category, description, date, project_id, receipt_title, ocr_scanned, ocr_confidence, tags } = req.body;

    const entry = await BudgetEntry.create({
      user_id: userId,
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
      project_id: project_id || null,
      receipt_title,
      ocr_scanned: ocr_scanned || false,
      ocr_confidence: ocr_confidence || null,
      tags: tags || []
    });

    // Fetch the created entry with project info
    const entryWithProject = await BudgetEntry.findByPk(entry.id, {
      include: [{
        model: BudgetProject,
        as: 'project',
        required: false
      }]
    });

    res.status(201).json(entryWithProject);
  } catch (error) {
    console.error('Error creating budget entry:', error);
    res.status(500).json({ error: 'Failed to create budget entry' });
  }
});

// PUT - Update existing budget entry
router.put('/entries/:id', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const entryId = req.params.id;
    const { type, amount, category, description, date, project_id, receipt_title, ocr_scanned, ocr_confidence, tags } = req.body;

    const [updatedRows] = await BudgetEntry.update({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
      project_id: project_id || null,
      receipt_title,
      ocr_scanned: ocr_scanned || false,
      ocr_confidence: ocr_confidence || null,
      tags: tags || []
    }, {
      where: { id: entryId, user_id: userId }
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Budget entry not found' });
    }

    // Fetch the updated entry with project info
    const updatedEntry = await BudgetEntry.findByPk(entryId, {
      include: [{
        model: BudgetProject,
        as: 'project',
        required: false
      }]
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating budget entry:', error);
    res.status(500).json({ error: 'Failed to update budget entry' });
  }
});

// DELETE - Delete budget entry
router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const entryId = req.params.id;

    const deletedRows = await BudgetEntry.destroy({
      where: { id: entryId, user_id: userId }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Budget entry not found' });
    }

    res.json({ message: 'Budget entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget entry:', error);
    res.status(500).json({ error: 'Failed to delete budget entry' });
  }
});

// GET - Fetch all user's budget projects
router.get('/projects', requireAuth, async (req, res) => {
  try {
    console.log('📊 Budget projects route accessed by user:', req.user?.id);
    const userId = getUserId(req);
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('🔍 Fetching projects for user:', userId);
    const projects = await BudgetProject.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ Found ${projects.length} budget projects`);
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching budget projects:', error);
    res.status(500).json({ 
      error: 'Failed to fetch budget projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST - Create new budget project
router.post('/projects', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { name, description, color, is_active, tags } = req.body;

    const project = await BudgetProject.create({
      user_id: userId,
      name,
      description,
      color: color || '#8b5cf6',
      is_active: is_active !== undefined ? is_active : true,
      tags: tags || []
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating budget project:', error);
    res.status(500).json({ error: 'Failed to create budget project' });
  }
});

// PUT - Update existing budget project
router.put('/projects/:id', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const projectId = req.params.id;
    const { name, description, color, is_active, tags } = req.body;

    const [updatedRows] = await BudgetProject.update({
      name,
      description,
      color,
      is_active,
      tags: tags || []
    }, {
      where: { id: projectId, user_id: userId }
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Budget project not found' });
    }

    const updatedProject = await BudgetProject.findByPk(projectId);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating budget project:', error);
    res.status(500).json({ error: 'Failed to update budget project' });
  }
});

// DELETE - Delete budget project
router.delete('/projects/:id', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const projectId = req.params.id;

    const deletedRows = await BudgetProject.destroy({
      where: { id: projectId, user_id: userId }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Budget project not found' });
    }

    res.json({ message: 'Budget project deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget project:', error);
    res.status(500).json({ error: 'Failed to delete budget project' });
  }
});

// Legacy routes for backwards compatibility
router.get('/income', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const incomeEntries = await BudgetEntry.findAll({
      where: { 
        user_id: userId,
        type: 'income'
      },
      include: [{
        model: BudgetProject,
        as: 'project',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(incomeEntries);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

router.get('/expense', requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const expenseEntries = await BudgetEntry.findAll({
      where: { 
        user_id: userId,
        type: 'expense'
      },
      include: [{
        model: BudgetProject,
        as: 'project',
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(expenseEntries);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

export default router;