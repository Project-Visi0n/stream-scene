import express from 'express';
import multer from 'multer';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get environment variables
const getEnvVars = () => ({
  AWS_REGION: process.env.AWS_REGION || 'us-east-2',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  BUCKET_NAME: process.env.AWS_S3_BUCKET || 'stream-scene-bucket'
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

    // Use mime-types to determine the correct Content-Type
    const mimeType = mime.lookup(key) || response.ContentType || 'application/octet-stream';

    // Set appropriate headers
    res.set({
      'Content-Type': mimeType,
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

// Direct file upload to S3
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const env = getEnvVars();
    if (!isS3Configured()) {
      return res.status(500).json({ error: 'S3 not configured', details: env });
    }
    const s3Client = getS3Client();
    const file = req.file;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    // Convert any video file that is not already mp4
    if (file.mimetype.startsWith('video/') && file.mimetype !== 'video/mp4') {
      const tempInputPath = path.join('/tmp', `${Date.now()}-${file.originalname}`);
      const tempOutputPath = tempInputPath.replace(/\.[^.]+$/, '.mp4');
      fs.writeFileSync(tempInputPath, file.buffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInputPath)
          .output(tempOutputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run();
      });

      const mp4Buffer = fs.readFileSync(tempOutputPath);
      const mp4Key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;

      const putCommand = new PutObjectCommand({
        Bucket: env.BUCKET_NAME,
        Key: mp4Key,
        Body: mp4Buffer,
        ContentType: 'video/mp4',
      });
      await s3Client.send(putCommand);

      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);

      const fileUrl = `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${mp4Key}`;
      return res.json({ url: fileUrl, key: mp4Key, converted: true });
    }

    // If already mp4 or not a video, upload as usual
    const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const putCommand = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(putCommand);
    const fileUrl = `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    res.json({ url: fileUrl, key, converted: false });
  } catch (error: any) {
    console.error('[S3Proxy] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file to S3', details: error?.message || error });
  }
});

// NEW: Receipt upload route
router.post('/upload/receipt', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const expenseId = req.body.expenseId;
    const type = req.body.type; // Should be 'receipt'

    // Validate file type for receipts
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed for receipts.' 
      });
    }

    // Validate file size (5MB max for receipts)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size for receipts is 5MB.' 
      });
    }

    const env = getEnvVars();
    if (!isS3Configured()) {
      return res.status(500).json({ error: 'S3 not configured' });
    }

    const s3Client = getS3Client();
    
    // Create a specific key structure for receipts
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `receipts/${timestamp}-${sanitizedFileName}`;
    
    console.log(`[S3Proxy] Uploading receipt: ${file.originalname} as ${key}`);
    
    const putCommand = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'original-name': file.originalname,
        'expense-id': expenseId || 'unknown',
        'upload-type': 'receipt',
        'upload-date': new Date().toISOString()
      }
    });

    await s3Client.send(putCommand);
    
    // Return the proxy URL (consistent with your existing pattern)
    const proxyUrl = `/api/s3/proxy/${key}`;
    
    console.log(`[S3Proxy] Receipt uploaded successfully: ${key}`);
    
    res.json({
      url: proxyUrl,
      key: key,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
      expenseId: expenseId,
      message: 'Receipt uploaded successfully'
    });
    
  } catch (error: any) {
    console.error('[S3Proxy] Receipt upload error:', error);
    if (error?.name) console.error('Error name:', error.name);
    if (error?.message) console.error('Error message:', error.message);
    if (error?.stack) console.error('Error stack:', error.stack);
    if (error?.$metadata) console.error('AWS metadata:', error.$metadata);
    if (error?.Code) console.error('AWS error code:', error.Code);
    
    res.status(500).json({ 
      error: 'Failed to upload receipt to S3', 
      details: error?.message || error 
    });
  }
});

// File listing route
router.get('/files', async (req, res) => {
  try {
    const env = getEnvVars();
    if (!isS3Configured()) {
      return res.status(500).json({ error: 'S3 not configured' });
    }

    const s3Client = getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: env.BUCKET_NAME,
      Prefix: 'uploads/', // Adjust prefix if needed
    });

    const response = await s3Client.send(command);
    
    const files = response.Contents?.map(file => ({
      key: file.Key,
      url: `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${file.Key}`,
      // Include other metadata as needed
    })) || [];
    
    res.json({ files });
    
  } catch (error) {
    console.error('[S3Proxy] List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// NEW: File details route
router.get('/file/:key(*)', async (req, res) => {
  const key = req.params.key;
  const env = getEnvVars();

  if (!key) {
    return res.status(400).json({ error: 'File key is required' });
  }

  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 not configured' });
  }

  try {
    const s3Client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });

    const metadata = await s3Client.send(command);
    
    res.json({
      key,
      url: `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
      size: metadata.ContentLength,
      type: metadata.ContentType,
      // Include other metadata as needed
    });
    
  } catch (error) {
    console.error('[S3Proxy] Get file details error:', error);
    res.status(500).json({ error: 'Failed to get file details' });
  }
});

// NEW: File download route
router.get('/download/:key(*)', async (req, res) => {
  const key = req.params.key;
  const env = getEnvVars();

  if (!key) {
    return res.status(400).json({ error: 'File key is required' });
  }

  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 not configured' });
  }

  try {
    const s3Client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Use mime-types to determine the correct Content-Type
    const mimeType = mime.lookup(key) || response.ContentType || 'application/octet-stream';

    // Set appropriate headers for download
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
      'Content-Length': response.ContentLength?.toString() || '',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Stream the file
    const stream = response.Body as NodeJS.ReadableStream;
    stream.pipe(res);
    
  } catch (error) {
    console.error('S3 download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Proxy route for uploads
router.get('/proxy/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
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
      Key: `uploads/${filename}`,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Guess the MIME type based on the file extension
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    // Stream the file from S3
    const s3Stream = response.Body as NodeJS.ReadableStream;
    s3Stream.pipe(res);
    
  } catch (error) {
    console.error('S3 proxy uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Add this AFTER your existing routes, before the export

// Check conversion status route
router.post('/conversion-status', async (req, res) => {
  try {
    const { s3Key } = req.body;
    
    if (!s3Key) {
      return res.status(400).json({ error: 'S3 key required' });
    }

    const env = getEnvVars();
    if (!isS3Configured()) {
      return res.status(500).json({ error: 'S3 not configured' });
    }

    const s3Client = getS3Client();
    
    // Check if MP4 version exists
    const mp4Key = s3Key.replace(/\.[^/.]+$/, '.mp4'); // Replace extension with .mp4
    
    try {
      const command = new HeadObjectCommand({
        Bucket: env.BUCKET_NAME,
        Key: mp4Key
      });

      await s3Client.send(command);

      // MP4 exists, return converted URL
      const mp4Url = `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${mp4Key}`;
      
      res.json({
        converted: true,
        mp4Url,
        mp4Key
      });
    } catch (error) {
      // MP4 doesn't exist yet or other error
      res.json({
        converted: false,
        message: 'Conversion in progress or failed'
      });
    }
  } catch (error) {
    console.error('Error checking conversion status:', error);
    res.status(500).json({ error: 'Failed to check conversion status' });
  }
});

export default router;