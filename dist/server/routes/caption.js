import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { db } from '../db/index.js';
const router = express.Router();
const { File } = db;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'stream-scene-bucket';
const s3Client = new S3Client({ region: AWS_REGION });
const transcribeClient = new TranscribeClient({ region: AWS_REGION });
// Add this near the top after imports
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
router.post('/:fileId', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1. Find the video file by ID and ensure user owns it
        const file = await File.findOne({
            where: {
                id: req.params.fileId,
                userId: userId
            }
        });
        if (!file)
            return res.status(404).json({ error: 'File not found' });
        // 2. Download file from S3 for processing
        let videoPath;
        if (file.s3Key) {
            // Create temp directory if it doesn't exist
            const tempDir = path.join(process.cwd(), 'temp');
            try {
                await fs.mkdir(tempDir, { recursive: true });
            }
            catch (err) {
                // Directory already exists
            }
            // Download file from S3 to temp location
            const tempFileName = `temp-${file.id}-${path.basename(file.s3Key)}`;
            videoPath = path.join(tempDir, tempFileName);
            console.log('Downloading file from S3 for processing...');
            console.log('S3 Key:', file.s3Key);
            console.log('Temp path:', videoPath);
            try {
                // Use AWS SDK to download the file with proper authentication
                console.log('Downloading from S3 using AWS SDK...');
                const getCommand = new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: file.s3Key,
                });
                const s3Response = await s3Client.send(getCommand);
                if (!s3Response.Body) {
                    throw new Error('No file data received from S3');
                }
                // Convert the stream to buffer
                const buffer = await s3Response.Body.transformToByteArray();
                await fs.writeFile(videoPath, Buffer.from(buffer));
                console.log('File downloaded successfully to:', videoPath);
                console.log('File size:', buffer.length, 'bytes');
            }
            catch (downloadErr) {
                console.error('Failed to download file from S3:', downloadErr);
                return res.status(500).json({ error: 'Failed to download video file for processing' });
            }
        }
        else {
            return res.status(400).json({ error: 'File S3 key not found' });
        }
        // 3. Define paths
        const audioOutputPath = path.join('/tmp', `audio-${file.id}.wav`);
        console.log('Processing video:', videoPath);
        // 4. Extract audio using ffmpeg
        const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 -f wav "${audioOutputPath}"`;
        exec(ffmpegCmd, async (error, stdout, stderr) => {
            // Clean up temp video file regardless of success/failure
            const cleanupTempFile = async () => {
                try {
                    await fs.unlink(videoPath);
                    console.log('Cleaned up temp video file:', videoPath);
                }
                catch (cleanupErr) {
                    console.log('Could not clean up temp file:', cleanupErr);
                }
            };
            if (error) {
                console.error('ffmpeg error:', stderr);
                await cleanupTempFile();
                return res.status(500).json({ error: 'Audio extraction failed' });
            }
            try {
                const audioBuffer = await fs.readFile(audioOutputPath);
                const s3Key = `audio/${file.id}-${Date.now()}.wav`;
                const putCommand = new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    Body: audioBuffer,
                    ContentType: 'audio/wav',
                });
                await s3Client.send(putCommand);
                await fs.unlink(audioOutputPath);
                // --- Start Transcribe job ---
                const jobName = `caption-job-${file.id}-${Date.now()}`;
                const mediaUri = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
                const transcribeCommand = new StartTranscriptionJobCommand({
                    TranscriptionJobName: jobName,
                    LanguageCode: 'en-US',
                    MediaFormat: 'wav',
                    Media: { MediaFileUri: mediaUri },
                    OutputBucketName: BUCKET_NAME,
                });
                await transcribeClient.send(transcribeCommand);
                // Clean up temp video file
                await cleanupTempFile();
                // Respond with job info
                res.json({ status: 'transcribe_started', jobName, mediaUri });
            }
            catch (uploadErr) {
                console.error('S3/Transcribe error:', uploadErr);
                await cleanupTempFile();
                return res.status(500).json({ error: 'Failed to upload audio or start transcription' });
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Poll for Transcribe job status
router.get('/status/:jobName', async (req, res) => {
    var _a, _b;
    try {
        const jobName = req.params.jobName;
        const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });
        const response = await transcribeClient.send(command);
        const job = response.TranscriptionJob;
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        // Add debug logging
        console.log('=== TRANSCRIBE JOB DEBUG ===');
        console.log('Job Status:', job.TranscriptionJobStatus);
        console.log('Transcript URI:', (_a = job.Transcript) === null || _a === void 0 ? void 0 : _a.TranscriptFileUri);
        console.log('Failure Reason:', job.FailureReason);
        console.log('Creation Time:', job.CreationTime);
        console.log('Completion Time:', job.CompletionTime);
        res.json({
            status: job.TranscriptionJobStatus,
            transcriptUri: ((_b = job.Transcript) === null || _b === void 0 ? void 0 : _b.TranscriptFileUri) || null,
            failureReason: job.FailureReason || null,
        });
    }
    catch (err) {
        console.error('Error polling Transcribe job:', err);
        res.status(500).json({ error: 'Failed to poll job status' });
    }
});
router.get('/transcript/:jobName', async (req, res) => {
    var _a;
    try {
        const jobName = req.params.jobName;
        // Extract fileId from jobName (format: caption-job-{fileId}-{timestamp})
        const fileIdMatch = jobName.match(/caption-job-(\d+)-/);
        if (!fileIdMatch) {
            return res.status(400).json({ error: 'Invalid job name format' });
        }
        const fileId = parseInt(fileIdMatch[1]);
        const command = new GetTranscriptionJobCommand({ TranscriptionJobName: jobName });
        const response = await transcribeClient.send(command);
        const job = response.TranscriptionJob;
        if (!job || job.TranscriptionJobStatus !== 'COMPLETED' || !((_a = job.Transcript) === null || _a === void 0 ? void 0 : _a.TranscriptFileUri)) {
            return res.status(400).json({ error: 'Transcript not available yet' });
        }
        // Fetch transcript JSON from S3 using AWS SDK instead of fetch
        console.log('Transcript URI:', job.Transcript.TranscriptFileUri);
        var transcriptJson;
        try {
            // Parse the S3 URL to get bucket and key
            const transcriptUrl = new URL(job.Transcript.TranscriptFileUri);
            // For URLs like https://s3.region.amazonaws.com/bucket/key, the pathname is /bucket/key
            // We need to extract just the key part (everything after the bucket name)
            const pathParts = transcriptUrl.pathname.substring(1).split('/'); // Remove leading slash and split
            const bucketFromUrl = pathParts[0]; // First part is bucket name
            const transcriptKey = pathParts.slice(1).join('/'); // Everything after bucket is the key
            console.log('URL:', job.Transcript.TranscriptFileUri);
            console.log('Parsed bucket:', bucketFromUrl);
            console.log('Parsed key:', transcriptKey);
            // Use AWS SDK to fetch the transcript
            const getTranscriptCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: transcriptKey,
            });
            const transcriptResponse = await s3Client.send(getTranscriptCommand);
            if (!transcriptResponse.Body) {
                throw new Error('No transcript data received from S3');
            }
            // Convert stream to string
            const transcriptText = await transcriptResponse.Body.transformToString();
            console.log('Raw transcript data:', transcriptText.substring(0, 200) + '...');
            // Parse as JSON
            transcriptJson = JSON.parse(transcriptText);
            console.log('Successfully parsed transcript JSON');
        }
        catch (fetchError) {
            console.error('Error fetching transcript from S3:', fetchError);
            // Fallback: try with node-fetch but add better error handling
            try {
                const transcriptRes = await fetch(job.Transcript.TranscriptFileUri);
                const responseText = await transcriptRes.text();
                console.log('Response status:', transcriptRes.status);
                console.log('Response headers:', Object.fromEntries(transcriptRes.headers.entries()));
                console.log('Raw response:', responseText.substring(0, 200) + '...');
                if (!transcriptRes.ok) {
                    throw new Error(`HTTP ${transcriptRes.status}: ${responseText}`);
                }
                // Check if response looks like JSON
                if (!responseText.trim().startsWith('{')) {
                    throw new Error(`Response is not JSON: ${responseText.substring(0, 100)}`);
                }
                const transcriptJson = JSON.parse(responseText);
            }
            catch (fallbackError) {
                console.error('Fallback fetch also failed:', fallbackError);
                return res.status(500).json({ error: 'Failed to fetch transcript data' });
            }
        }
        // Convert transcript to SRT then VTT
        const srt = jsonToSrt(transcriptJson);
        const vtt = srtToVtt(srt);
        // Save vtt to S3
        const vttKey = `captions/${fileId}-${Date.now()}.vtt`;
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: vttKey,
            Body: vtt,
            ContentType: 'text/vtt',
        });
        await s3Client.send(putCommand);
        const vttUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${vttKey}`;
        // Update File record with captionUrl (now VTT)
        await File.update({ captionUrl: vttUrl }, { where: { id: fileId } });
        res.json({ status: 'caption_ready', captionUrl: vttUrl });
    }
    catch (err) {
        console.error('Error fetching/converting transcript:', err);
        res.status(500).json({ error: 'Failed to fetch, convert, or save transcript' });
    }
});
// Add this temporary debug route
router.get('/debug/files', async (req, res) => {
    try {
        const uploadsPath = path.join(process.cwd(), 'uploads');
        console.log('Checking uploads directory:', uploadsPath);
        try {
            const files = await fs.readdir(uploadsPath);
            console.log('Files in uploads directory:', files);
            res.json({ uploadsPath, files });
        }
        catch (err) {
            console.log('Uploads directory does not exist or is not accessible');
            res.json({ error: 'Uploads directory not found', uploadsPath });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Debug failed' });
    }
});
// Helper: Convert Amazon Transcribe JSON to SRT
function jsonToSrt(transcriptJson) {
    if (!transcriptJson.results || !transcriptJson.results.items)
        return '';
    let srt = '';
    let index = 1;
    let currentLine = '';
    let startTime = '';
    let endTime = '';
    transcriptJson.results.items.forEach((item, i) => {
        if (item.type === 'pronunciation') {
            if (!currentLine)
                startTime = item.start_time;
            currentLine += item.alternatives[0].content + ' ';
            endTime = item.end_time;
            // Break line at punctuation or after a few words
            const nextItem = transcriptJson.results.items[i + 1];
            if (!nextItem ||
                nextItem.type === 'punctuation' ||
                currentLine.split(' ').length > 10) {
                srt += `${index}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${currentLine.trim()}\n\n`;
                index++;
                currentLine = '';
            }
        }
    });
    return srt;
}
function formatSrtTime(time) {
    const sec = parseFloat(time);
    const date = new Date(sec * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
}
// Converts SRT string to VTT string
function srtToVtt(srt) {
    // Add WEBVTT header
    let vtt = 'WEBVTT\n\n';
    // Replace commas in timestamps with periods
    vtt += srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return vtt;
}
export default router;
