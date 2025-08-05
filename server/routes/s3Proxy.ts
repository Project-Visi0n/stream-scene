import express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// Get environment variables
const getEnvVars = () => ({
  AWS_REGION: process.env.AWS_REGION || 'us-east-2',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'stream-scene-bucket'
});

// Proxy route to serve S3 files with proper CORS headers
router.get('/proxy/:key(*)', async (req, res) => {
  const key = req.params.key;
  const env = getEnvVars();

  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return res.status(500).json({ error: 'AWS credentials not configured' });
  }

  try {
    const s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Content-Length': response.ContentLength?.toString() || '',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Stream the file
    const stream = response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
    
  } catch (error) {
    console.error('S3 proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

export default router;
