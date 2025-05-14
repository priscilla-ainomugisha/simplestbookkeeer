import axios from 'axios';
import fs from 'fs';

// AssemblyAI API key
const API_KEY = 'f921c97ce6654ca9b01ca35cc0551366';
const BASE_URL = 'https://api.assemblyai.com/v2';

const headers = {
  'Authorization': API_KEY,
  'Content-Type': 'application/json'
};

/**
 * Upload audio file to AssemblyAI for processing
 */
export async function uploadAudio(audioFilePath: string): Promise<string> {
  try {
    // Create a read stream from the audio file
    const data = fs.readFileSync(audioFilePath);
    
    // Upload the file to AssemblyAI
    const uploadResponse = await axios.post(`${BASE_URL}/upload`, data, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/octet-stream'
      }
    });

    // Return the upload URL
    return uploadResponse.data.upload_url;
  } catch (error) {
    console.error('Error uploading audio to AssemblyAI:', error);
    throw new Error(`Failed to upload audio: ${(error as Error).message}`);
  }
}

/**
 * Request transcription for an uploaded audio file
 */
export async function requestTranscription(audioUrl: string): Promise<string> {
  try {
    // Request transcription
    const transcriptResponse = await axios.post(
      `${BASE_URL}/transcript`,
      {
        audio_url: audioUrl,
        language_code: 'en' // You can change this for other languages if needed
      },
      { headers }
    );
    
    // Return the transcription ID
    return transcriptResponse.data.id;
  } catch (error) {
    console.error('Error requesting transcription from AssemblyAI:', error);
    throw new Error(`Failed to request transcription: ${(error as Error).message}`);
  }
}

/**
 * Check transcription status and retrieve text when complete
 */
export async function getTranscriptionResult(transcriptId: string): Promise<{ text: string, duration: number }> {
  try {
    // Poll until transcription is complete
    let status = 'processing';
    let result;
    
    while (status === 'processing' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const response = await axios.get(`${BASE_URL}/transcript/${transcriptId}`, { headers });
      status = response.data.status;
      
      if (status === 'completed') {
        result = response.data;
        break;
      } else if (status === 'error') {
        throw new Error(`Transcription error: ${response.data.error}`);
      }
    }
    
    if (!result || !result.text) {
      throw new Error('Transcription completed but no text was returned');
    }
    
    // Get the duration in seconds
    const durationInSeconds = result.audio_duration || 0;
    
    return {
      text: result.text,
      duration: durationInSeconds
    };
  } catch (error) {
    console.error('Error getting transcription result from AssemblyAI:', error);
    throw new Error(`Failed to get transcription result: ${(error as Error).message}`);
  }
}

/**
 * Main function to transcribe audio file
 */
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    // Upload the audio file
    const uploadUrl = await uploadAudio(audioFilePath);
    
    // Request transcription
    const transcriptId = await requestTranscription(uploadUrl);
    
    // Get the transcription result
    return await getTranscriptionResult(transcriptId);
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw new Error(`AssemblyAI transcription failed: ${(error as Error).message}`);
  }
}