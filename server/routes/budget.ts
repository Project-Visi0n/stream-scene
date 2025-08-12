import express from 'express';
import { requireAuth } from '../middleware/authMiddleWare';

const router = express.Router();

// GET - Fetch user's income entries
router.get('/income', requireAuth, async (req, res) => {
  try {
    res.json({ message: 'Income routes not yet implemented' });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST - Create new income entry  
router.post('/income', requireAuth, async (req, res) => {
  try {
    res.json({ message: 'Income creation not yet implemented' });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income' });
  }
});

// GET - Fetch user's expense entries
router.get('/expense', requireAuth, async (req, res) => {
  try {
    res.json({ message: 'Expense routes not yet implemented' });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST - Create new expense entry
router.post('/expense', requireAuth, async (req, res) => {
  try {
    res.json({ message: 'Expense creation not yet implemented' });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;