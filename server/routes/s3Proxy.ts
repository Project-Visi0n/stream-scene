import express from 'express';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = express.Router();

// Get environment variables
const getEnvVars = () => ({
  AWS_REGION: process.env.AWS_REGION || 'us-east-2',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'stream-scene-bucket'
});

// Check if S3 is configured
const isS3Configured = () => {
  const env = getEnvVars();
  return !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
};

// Get S3 client
const getS3Client = () => {
  const env = getEnvVars();
  
  if (!isS3Configured()) {
    throw new Error('S3 not configured');
  }

  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

// S3 status endpoint
router.get('/status', (req, res) => {
  const configured = isS3Configured();
  
  res.json({
    configured,
    message: configured ? 'S3 is configured' : 'S3 credentials not found'
  });
});

// Generate presigned upload URL
router.post('/presigned-upload', async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;
  
  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required' });
  }

  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 not configured' });
  }

  try {
    const env = getEnvVars();
    const s3Client = getS3Client();
    
    // Generate unique key
    const fileExtension = fileName.split('.').pop();
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({
      presignedUrl,
      key,
      message: 'Presigned URL generated successfully'
    });
    
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// Delete file from S3
router.delete('/delete/:key(*)', async (req, res) => {
  const key = req.params.key;
  
  if (!key) {
    return res.status(400).json({ error: 'File key is required' });
  }

  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 not configured' });
  }

  try {
    const env = getEnvVars();
    const s3Client = getS3Client();
    
    const command = new DeleteObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    
    res.json({
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('S3 delete error:', error);
    res.status(500).json({ error: 'Failed to delete file from S3' });
  }
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
