import { google } from 'googleapis';
import fs from 'fs';
import { SheetRow } from '@shared/schema';

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'Transactions';

// Function to save transaction to Google Sheets
export async function saveTransactionToSheets(transaction: SheetRow): Promise<void> {
  // Skip if Google Sheets ID is not configured
  if (!SHEET_ID) {
    console.log('Google Sheet ID not configured, skipping saving to sheets');
    return;
  }

  try {
    // Try to get credentials from environment variables
    const credentialsEnv = process.env.GOOGLE_CREDENTIALS;
    let credentials;
    
    if (credentialsEnv) {
      credentials = JSON.parse(credentialsEnv);
    } else {
      console.log('Google credentials not found in environment variables');
      return;
    }

    const { client_email, private_key } = credentials;
    
    if (!client_email || !private_key) {
      console.log('Missing required Google credentials');
      return;
    }

    // Create JWT client
    const jwtClient = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      SCOPES
    );

    // Authorize the client
    await jwtClient.authorize();

    // Create Google Sheets instance
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });

    // Format the row data
    const rowData = [
      transaction.timestamp,
      transaction.type,
      transaction.amount.toString(),
      transaction.category,
      transaction.description || '',
      transaction.userId.toString(),
      transaction.rawInput || '',
      transaction.transcription || ''
    ];

    // Append the row to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData]
      }
    });

    console.log('Transaction saved to Google Sheets successfully');
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    throw new Error(`Failed to save to Google Sheets: ${(error as Error).message}`);
  }
}

// Initialize the Google Sheet with headers if it doesn't exist
export async function initializeSheet(): Promise<void> {
  if (!SHEET_ID) {
    console.log('Google Sheet ID not configured, skipping initialization');
    return;
  }

  try {
    // Similar auth process as above...
    const credentialsEnv = process.env.GOOGLE_CREDENTIALS;
    let credentials;
    
    if (credentialsEnv) {
      credentials = JSON.parse(credentialsEnv);
    } else {
      console.log('Google credentials not found in environment variables');
      return;
    }

    const { client_email, private_key } = credentials;
    
    if (!client_email || !private_key) {
      console.log('Missing required Google credentials');
      return;
    }

    // Create JWT client
    const jwtClient = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      SCOPES
    );

    // Authorize the client
    await jwtClient.authorize();

    // Create Google Sheets instance
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });

    // Check if sheet exists
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    let sheetExists = false;
    
    if (response.data.sheets) {
      for (const sheet of response.data.sheets) {
        if (sheet.properties?.title === SHEET_NAME) {
          sheetExists = true;
          break;
        }
      }
    }

    // Create sheet if it doesn't exist
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME
                }
              }
            }
          ]
        }
      });

      // Add headers to the new sheet
      const headers = [
        'Timestamp', 'Type', 'Amount', 'Category', 'Description', 
        'User ID', 'Raw Input', 'Transcription'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      });

      console.log('Google Sheet initialized with headers');
    }
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
  }
}
