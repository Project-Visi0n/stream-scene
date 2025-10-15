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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('S3 delete error:', error);
        res.status(500).json({ error: 'Failed to delete file from S3' });
    }
});
// Proxy route to serve S3 files with proper CORS headers and range request support
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
        // First, get the object metadata to get the total size
        const headCommand = new HeadObjectCommand({
            Bucket: env.BUCKET_NAME,
            Key: key,
        });
        const headResponse = await s3Client.send(headCommand);
        const totalSize = headResponse.ContentLength || 0;
        const mimeType = mime.lookup(key) || headResponse.ContentType || 'application/octet-stream';
        // Handle range requests for video streaming/seeking
        const range = req.headers.range;
        let start = 0;
        let end = totalSize - 1;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            start = parseInt(parts[0], 10) || 0;
            end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            // Ensure end doesn't exceed file size
            end = Math.min(end, totalSize - 1);
        }
        // Fetch the specific range from S3
        const getCommand = new GetObjectCommand({
            Bucket: env.BUCKET_NAME,
            Key: key,
            Range: range ? `bytes=${start}-${end}` : undefined,
        });
        const response = await s3Client.send(getCommand);
        if (!response.Body) {
            return res.status(404).json({ error: 'File not found' });
        }
        const chunkSize = (end - start) + 1;
        // Set appropriate headers
        const headers = {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Accept-Ranges': 'bytes',
        };
        if (range) {
            // Partial content response
            res.status(206);
            headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
            headers['Content-Length'] = chunkSize.toString();
        }
        else {
            // Full content response
            res.status(200);
            headers['Content-Length'] = totalSize.toString();
        }
        res.set(headers);
        // Stream the file
        const stream = response.Body;
        stream.pipe(res);
    }
    catch (error) {
        console.error('S3 proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});
// Direct file upload to S3
router.post('/upload', upload.single('file'), async (req, res) => {
    var _a, _b;
    try {
        console.log('[S3Proxy] Upload request received');
        if (!req.file) {
            console.error('[S3Proxy] No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const env = getEnvVars();
        console.log('[S3Proxy] Environment check:', {
            hasAccessKey: !!env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!env.AWS_SECRET_ACCESS_KEY,
            region: env.AWS_REGION,
            bucket: env.BUCKET_NAME
        });
        if (!isS3Configured()) {
            console.error('[S3Proxy] S3 not configured');
            return res.status(500).json({ error: 'S3 not configured', details: env });
        }
        const s3Client = getS3Client();
        const file = req.file;
        const fileExtension = (_a = file.originalname.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        console.log('[S3Proxy] Processing file:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            extension: fileExtension
        });
        // List of video formats that need conversion
        const videoFormatsToConvert = ['mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'];
        const needsConversion = videoFormatsToConvert.includes(fileExtension || '') ||
            (file.mimetype.startsWith('video/') && file.mimetype !== 'video/mp4');
        if (needsConversion) {
            console.log('[S3Proxy] Video needs conversion to MP4');
            // Check if ffmpeg is available
            try {
                const ffmpegPath = await new Promise((resolve, reject) => {
                    ffmpeg.getAvailableFormats((err, formats) => {
                        if (err) {
                            console.error('[S3Proxy] FFmpeg not available:', err);
                            reject(new Error('FFmpeg not installed or not accessible'));
                        }
                        else {
                            console.log('[S3Proxy] FFmpeg is available');
                            resolve('ffmpeg');
                        }
                    });
                });
            }
            catch (ffmpegError) {
                console.error('[S3Proxy] FFmpeg check failed:', ffmpegError);
                // Upload original file if ffmpeg is not available
                console.log('[S3Proxy] Falling back to original file upload due to missing ffmpeg');
            }
            const tempDir = process.env.TEMP_DIR || '/tmp';
            const tempInputPath = path.join(tempDir, `input-${Date.now()}-${file.originalname}`);
            const tempOutputPath = path.join(tempDir, `output-${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '.mp4')}`);
            try {
                // Write input file
                console.log('[S3Proxy] Writing temp file to:', tempInputPath);
                fs.writeFileSync(tempInputPath, file.buffer);
                console.log('[S3Proxy] Temp file written successfully, size:', fs.statSync(tempInputPath).size);
                // Convert video with better error handling
                await new Promise((resolve, reject) => {
                    console.log('[S3Proxy] Starting ffmpeg conversion...');
                    const command = ffmpeg(tempInputPath)
                        .outputOptions([
                        '-c:v libx264',
                        '-preset fast',
                        '-crf 23',
                        '-c:a aac',
                        '-b:a 128k',
                        '-movflags +faststart',
                        '-max_muxing_queue_size 9999' // Prevent muxing queue issues
                    ])
                        .output(tempOutputPath)
                        .on('start', (commandLine) => {
                        console.log('[S3Proxy] FFmpeg command:', commandLine);
                    })
                        .on('progress', (progress) => {
                        var _a;
                        console.log('[S3Proxy] Conversion progress:', ((_a = progress.percent) === null || _a === void 0 ? void 0 : _a.toFixed(2)) + '%');
                    })
                        .on('end', () => {
                        console.log('[S3Proxy] Video conversion completed successfully');
                        resolve();
                    })
                        .on('error', (err, stdout, stderr) => {
                        console.error('[S3Proxy] FFmpeg conversion error:', err.message);
                        console.error('[S3Proxy] FFmpeg stderr:', stderr);
                        reject(err);
                    });
                    command.run();
                });
                // Check if output file exists and has content
                if (!fs.existsSync(tempOutputPath)) {
                    throw new Error('Conversion output file not created');
                }
                const outputStats = fs.statSync(tempOutputPath);
                console.log('[S3Proxy] Converted file size:', outputStats.size);
                if (outputStats.size === 0) {
                    throw new Error('Conversion resulted in empty file');
                }
                // Read converted file
                const mp4Buffer = fs.readFileSync(tempOutputPath);
                // Generate MP4 filename maintaining original name but with .mp4 extension
                const originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
                const mp4Key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${originalNameWithoutExt}.mp4`;
                const putCommand = new PutObjectCommand({
                    Bucket: env.BUCKET_NAME,
                    Key: mp4Key,
                    Body: mp4Buffer,
                    ContentType: 'video/mp4',
                    Metadata: {
                        'original-filename': file.originalname,
                        'converted': 'true'
                    }
                });
                await s3Client.send(putCommand);
                // Clean up temp files
                try {
                    if (fs.existsSync(tempInputPath))
                        fs.unlinkSync(tempInputPath);
                    if (fs.existsSync(tempOutputPath))
                        fs.unlinkSync(tempOutputPath);
                }
                catch (cleanupErr) {
                    console.warn('[S3Proxy] Temp file cleanup warning:', cleanupErr);
                }
                // Return proxy URL for the MP4 file
                const proxyUrl = `/api/s3/proxy/${mp4Key}`;
                console.log('[S3Proxy] Video conversion and upload successful, proxy URL:', proxyUrl);
                return res.json({
                    url: proxyUrl,
                    key: mp4Key,
                    converted: true,
                    originalName: file.originalname,
                    convertedName: originalNameWithoutExt + '.mp4'
                });
            }
            catch (conversionError) {
                console.error('[S3Proxy] Video conversion failed:', conversionError.message);
                // Clean up temp files on error
                try {
                    if (fs.existsSync(tempInputPath))
                        fs.unlinkSync(tempInputPath);
                    if (fs.existsSync(tempOutputPath))
                        fs.unlinkSync(tempOutputPath);
                }
                catch (cleanupErr) {
                    console.warn('[S3Proxy] Temp file cleanup error:', cleanupErr);
                }
                // Fall back to uploading original file
                console.log('[S3Proxy] Falling back to original file upload');
            }
        }
        // If already mp4 or not a video, or if conversion failed, upload as usual
        const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
        console.log('[S3Proxy] Uploading original file to S3 with key:', key);
        const putCommand = new PutObjectCommand({
            Bucket: env.BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                'original-filename': file.originalname,
                'converted': 'false'
            }
        });
        await s3Client.send(putCommand);
        // Return proxy URL
        const proxyUrl = `/api/s3/proxy/${key}`;
        console.log('[S3Proxy] Upload successful, proxy URL:', proxyUrl);
        res.json({
            url: proxyUrl,
            key,
            converted: false,
            originalName: file.originalname
        });
    }
    catch (error) {
        console.error('[S3Proxy] Upload error:', error);
        console.error('[S3Proxy] Error details:', {
            message: error === null || error === void 0 ? void 0 : error.message,
            code: error === null || error === void 0 ? void 0 : error.code,
            statusCode: (_b = error === null || error === void 0 ? void 0 : error.$metadata) === null || _b === void 0 ? void 0 : _b.httpStatusCode,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
        res.status(500).json({
            error: 'Failed to upload file to S3',
            details: (error === null || error === void 0 ? void 0 : error.message) || error,
            code: error === null || error === void 0 ? void 0 : error.code
        });
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
    }
    catch (error) {
        console.error('[S3Proxy] Receipt upload error:', error);
        if (error === null || error === void 0 ? void 0 : error.name)
            console.error('Error name:', error.name);
        if (error === null || error === void 0 ? void 0 : error.message)
            console.error('Error message:', error.message);
        if (error === null || error === void 0 ? void 0 : error.stack)
            console.error('Error stack:', error.stack);
        if (error === null || error === void 0 ? void 0 : error.$metadata)
            console.error('AWS metadata:', error.$metadata);
        if (error === null || error === void 0 ? void 0 : error.Code)
            console.error('AWS error code:', error.Code);
        res.status(500).json({
            error: 'Failed to upload receipt to S3',
            details: (error === null || error === void 0 ? void 0 : error.message) || error
        });
    }
});
// File listing route
router.get('/files', async (req, res) => {
    var _a;
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
        const files = ((_a = response.Contents) === null || _a === void 0 ? void 0 : _a.map(file => ({
            key: file.Key,
            url: `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${file.Key}`,
            // Include other metadata as needed
        }))) || [];
        res.json({ files });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('[S3Proxy] Get file details error:', error);
        res.status(500).json({ error: 'Failed to get file details' });
    }
});
// NEW: File download route
router.get('/download/:key(*)', async (req, res) => {
    var _a;
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
            'Content-Length': ((_a = response.ContentLength) === null || _a === void 0 ? void 0 : _a.toString()) || '',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        // Stream the file
        const stream = response.Body;
        stream.pipe(res);
    }
    catch (error) {
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
        const s3Stream = response.Body;
        s3Stream.pipe(res);
    }
    catch (error) {
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
        }
        catch (error) {
            // MP4 doesn't exist yet or other error
            res.json({
                converted: false,
                message: 'Conversion in progress or failed'
            });
        }
    }
    catch (error) {
        console.error('Error checking conversion status:', error);
        res.status(500).json({ error: 'Failed to check conversion status' });
    }
});
export default router;
