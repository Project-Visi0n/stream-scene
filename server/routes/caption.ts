import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { File } from '../models/File'; // Adjust import if needed

const router = express.Router();

router.post('/:fileId', async (req: Request, res: Response) => {
  try {
    // 1. Find the video file by ID
    const file = await File.findByPk(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // 2. Define paths
    const videoPath = file.url; // Adjust if you store local paths
    const audioOutputPath = path.join('/tmp', `audio-${file.id}.wav`);

    // 3. Extract audio using ffmpeg
    const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 -f wav "${audioOutputPath}"`;

    exec(ffmpegCmd, async (error, stdout, stderr) => {
      if (error) {
        console.error('ffmpeg error:', stderr);
        return res.status(500).json({ error: 'Audio extraction failed' });
      }

      // 4. Respond with success (or continue with upload/transcribe)
      res.json({ status: 'audio_extracted', audioPath: audioOutputPath });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;