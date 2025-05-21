import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Transaction } from "@shared/schema";

// Get credentials from environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// Check if Google Cloud credentials are configured
const isGoogleCloudConfigured = !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && SPREADSHEET_ID);

if (!isGoogleCloudConfigured) {
  console.log("Google Cloud credentials not configured - Google Sheets integration will be disabled");
}

/**
 * Add a transaction to Google Sheet
 */
export async function addTransactionToSheet(transaction: Transaction): Promise<void> {
  // If credentials or sheet ID not available, skip silently
  if (!isGoogleCloudConfigured) {
    return;
  }

  try {
    // Create a JWT client
    const jwt = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    // Create a new document
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt);

    // Load document properties and sheets
    await doc.loadInfo();

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];

    // Prepare row data
    const rowData = {
      date: new Date().toISOString(),
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || '',
      userId: transaction.userId,
      rawInput: transaction.rawInput || '',
      transcription: transaction.transcription || ''
    };

    // Add the row
    await sheet.addRow(rowData);

    console.log('Transaction saved to Google Sheets successfully');
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    // Don't throw the error, just log it and continue
    console.log('Continuing without Google Sheets integration');
  }
}
