import express, { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import { SpeechClient, protos } from '@google-cloud/speech';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const storage = new Storage();
const speechClient = new SpeechClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

interface VoiceTransaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: Date;
}

function parseVoiceTransaction(transcription: string): VoiceTransaction {
  // Basic parsing logic - you may want to enhance this
  const words = transcription.toLowerCase().split(' ');
  const amount = parseFloat(words.find(word => !isNaN(parseFloat(word))) || '0');
  const type = words.includes('income') || words.includes('received') ? 'INCOME' : 'EXPENSE';
  const category = words.find(word => ['food', 'transport', 'utilities', 'entertainment'].includes(word)) || 'other';
  const description = transcription;
  const date = new Date();

  return {
    amount,
    type,
    category,
    description,
    date,
  };
}

router.post('/voice', upload.single('voiceNote'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No voice note file provided' });
    }

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Received voice note:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname
    });

    // Create a temporary file path for the converted audio
    const tempDir = os.tmpdir();
    const tempInputPath = path.join(tempDir, `${uuidv4()}.webm`);
    const tempOutputPath = path.join(tempDir, `${uuidv4()}.wav`);

    try {
      // Write the uploaded file to a temporary location
      await pipeline(
        Readable.from(req.file.buffer),
        createWriteStream(tempInputPath)
      );

      // Verify the input file was written correctly
      const inputStats = await fs.promises.stat(tempInputPath);
      console.log('Input file stats:', {
        path: tempInputPath,
        size: inputStats.size,
        created: inputStats.birthtime,
        modified: inputStats.mtime
      });

      console.log('Starting audio conversion:', {
        inputPath: tempInputPath,
        outputPath: tempOutputPath,
        inputSize: req.file.size
      });

      // Convert audio to WAV with 48kHz sample rate using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInputPath)
          .inputOptions([
            '-f webm',           // Force input format to WebM
            '-i_pipe 0'         // Read from pipe
          ])
          .outputOptions([
            '-f wav',
            '-ac 1',
            '-ar 48000',
            '-sample_fmt s16'
          ])
          .on('start', (commandLine) => {
            console.log('FFmpeg started with command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('FFmpeg progress:', progress);
          })
          .on('error', (err, stdout, stderr) => {
            console.error('FFmpeg error:', err);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
          })
          .on('end', () => {
            console.log('FFmpeg conversion completed');
            resolve();
          })
          .save(tempOutputPath);
      });

      // Read the converted WAV file
      const audioBytes = await fs.promises.readFile(tempOutputPath);
      console.log('Converted audio file size:', audioBytes.length);

      if (audioBytes.length === 0) {
        throw new Error('Converted audio file is empty');
      }

      // Configure the request for Google Speech-to-Text
      const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
        audio: {
          content: audioBytes.toString('base64'),
        },
        config: {
          encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'default',
          useEnhanced: true,
          audioChannelCount: 1,
          enableAutomaticPunctuation: true,
          speechContexts: [{
            phrases: [
              'income', 'expense', 'spent', 'received', 'paid', 'sold', 'bought',
              'transport', 'food', 'utilities', 'rent', 'salary', 'sales'
            ]
          }]
        },
      };

      console.log('Sending request to Google Speech-to-Text');
      // Perform the transcription
      const [response] = await speechClient.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join(' ');

      if (!transcription) {
        throw new Error('No transcription results returned - the audio might be empty or in an unsupported format');
      }

      console.log('Transcription result:', transcription);

      // Process the transcription to extract transaction details
      const transactionDetails = parseVoiceTransaction(transcription);
      
      // Store the voice note in Google Cloud Storage
      const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME!);
      const fileName = `voice-notes/${userId}/${uuidv4()}.webm`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Create the transaction record
      const transaction = await prisma.transaction.create({
        data: {
          ...transactionDetails,
          userId: parseInt(userId),
          voiceNoteUrl: fileName,
          transcription,
        },
      });

      res.json({
        success: true,
        transaction,
        transcription,
      });
    } finally {
      // Clean up temporary files
      try {
        await unlink(tempInputPath);
        await unlink(tempOutputPath);
      } catch (error) {
        console.error('Error cleaning up temporary files:', error);
      }
    }
  } catch (error) {
    console.error('Error processing voice note:', error);
    res.status(500).json({
      error: 'Failed to process voice note',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 