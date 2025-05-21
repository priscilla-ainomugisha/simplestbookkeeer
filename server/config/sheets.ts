import { google } from 'googleapis';
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

// Initialize the Google Sheets client
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
    console.log('Successfully loaded Google Sheets credentials from environment variable');
  } catch (error) {
    console.warn('Failed to parse Google Sheets credentials from environment variable:', error);
  }
}

// If not loaded from environment, try file paths
if (!credentials) {
  for (const credentialsPath of possiblePaths) {
    try {
      if (credentialsPath && fs.existsSync(credentialsPath)) {
        const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsFile) as GoogleCredentials;
        console.log('Successfully loaded Google Sheets credentials from:', credentialsPath);
        break;
      }
    } catch (error) {
      console.warn(`Failed to load credentials from ${credentialsPath}:`, error);
    }
  }
}

if (!credentials) {
  console.warn('No Google Sheets credentials found. Please ensure gcp-key.json exists in the project root or GOOGLE_APPLICATION_CREDENTIALS_JSON is set.');
}

// Create auth client
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create sheets client
export const sheets = google.sheets({ version: 'v4', auth });

// Helper function to append data to a sheet
export async function appendToSheet(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  try {
    if (!credentials) {
      throw new Error('Google Sheets credentials not configured. Please ensure gcp-key.json exists in the project root.');
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    if (error instanceof Error) {
      throw new Error(`Google Sheets operation failed: ${error.message}`);
    }
    throw error;
  }
} 