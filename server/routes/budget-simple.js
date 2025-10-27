import express from 'express';

const router = express.Router();

// Simple test route with no dependencies
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Simple budget routes working!', 
    timestamp: new Date().toISOString()
  });
});

router.get('/simple', (req, res) => {
  res.json({ 
    message: 'This is a minimal budget route with no model dependencies',
    status: 'success'
  });
});

export default router;