import express from 'express';

const router = express.Router();

// Minimal test route with no dependencies
router.get('/test', (req, res) => {
  console.log('🔥 MINIMAL budget test route accessed');
  res.json({ 
    message: 'Minimal budget routes working!', 
    timestamp: new Date().toISOString(),
    status: 'SUCCESS'
  });
});

router.get('/debug', (req, res) => {
  res.json({
    status: 'Minimal budget routes loaded successfully',
    timestamp: new Date().toISOString(),
    imports: 'No model imports - testing basic functionality'
  });
});

export default router;