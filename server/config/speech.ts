import { SpeechClient, protos } from '@google-cloud/speech';
import fs from 'fs';
import path from 'path';

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Initialize the Speech-to-Text client with credentials from file
let credentials: GoogleCredentials | undefined;

// Try to load credentials from different possible locations
const possiblePaths = [
  path.join(process.cwd(), 'gcp-key.json'),
  path.join(process.cwd(), 'serene-tooling-459814-m0-68749b48ca6b.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
].filter(Boolean);

// First try to load from environment variable
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) as GoogleCredentials;
    console.log('Successfully loaded Google Cloud credentials from environment variable');
  } catch (error) {
    console.warn('Failed to parse Google Cloud credentials from environment variable:', error);
  }
}

// If not loaded from environment, try file paths
if (!credentials) {
  for (const credentialsPath of possiblePaths) {
    try {
      if (credentialsPath && fs.existsSync(credentialsPath)) {
        const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsFile) as GoogleCredentials;
        console.log('Successfully loaded Google Cloud credentials from:', credentialsPath);
        break;
      }
    } catch (error) {
      console.warn(`Failed to load credentials from ${credentialsPath}:`, error);
    }
  }
}

if (!credentials) {
  console.error('❌ No Google Cloud credentials found');
  console.error('Please ensure gcp-key.json exists in the project root or GOOGLE_APPLICATION_CREDENTIALS_JSON is set');
  throw new Error('Google Cloud credentials not configured');
}

export const speechClient = new SpeechClient({
  credentials
});

// Speech recognition configuration
export const speechConfig: protos.google.cloud.speech.v1.IRecognitionConfig = {
  encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
  sampleRateHertz: 48000,
  languageCode: 'en-US',
  model: 'default',
  enableAutomaticPunctuation: true,
  useEnhanced: true,
  audioChannelCount: 1,
  enableWordTimeOffsets: true,
};

// Helper function to transcribe audio
export async function transcribeAudio(audioBytes: Buffer): Promise<string> {
  try {
    console.log('=== Speech-to-Text Process Start ===');
    console.log('Audio buffer details:', {
      size: audioBytes.length,
      isBuffer: Buffer.isBuffer(audioBytes),
      firstBytes: audioBytes.slice(0, 20).toString('hex')
    });

    if (!credentials) {
      console.error('❌ Google Cloud credentials not found');
      console.error('Please ensure gcp-key.json exists in the project root');
      throw new Error('Google Cloud credentials not configured');
    }

    console.log('✅ Google Cloud credentials loaded:', {
      projectId: credentials.project_id,
      clientEmail: credentials.client_email
    });

    console.log('📝 Speech recognition config:', {
      encoding: speechConfig.encoding,
      sampleRateHertz: speechConfig.sampleRateHertz,
      languageCode: speechConfig.languageCode,
      model: speechConfig.model,
      audioChannelCount: speechConfig.audioChannelCount
    });

    console.log('🔄 Sending request to Google Speech-to-Text...');
    const [response] = await speechClient.recognize({
      audio: { content: audioBytes.toString('base64') },
      config: speechConfig,
    });

    console.log('📊 Speech recognition response:', {
      hasResults: !!response.results,
      resultCount: response.results?.length,
      alternatives: response.results?.map(r => r.alternatives?.length)
    });

    if (!response.results || response.results.length === 0) {
      console.error('❌ No transcription results returned');
      throw new Error('No transcription results returned - the audio might be empty or in an unsupported format');
    }

    const transcription = response.results
      .map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => {
        const transcript = result.alternatives?.[0]?.transcript;
        const confidence = result.alternatives?.[0]?.confidence;
        console.log('🎯 Transcript result:', { 
          transcript, 
          confidence
        });
        return transcript;
      })
      .filter(Boolean)
      .join(' ');

    if (!transcription) {
      console.error('❌ No valid transcription found');
      throw new Error('Could not transcribe audio - no valid transcription found');
    }

    console.log('✅ Transcription successful:', transcription);
    console.log('=== Speech-to-Text Process End ===');

    return transcription;
  } catch (error) {
    console.error('❌ Speech-to-Text Error:', error);
    if (error instanceof Error) {
      throw new Error(`Speech-to-Text failed: ${error.message}`);
    }
    throw error;
  }
} 