import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Transaction } from "@shared/schema";

// Default sheet ID to use if none provided
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || process.env.VITE_GOOGLE_SHEETS_ID;

// Get credentials from environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_PRIVATE_KEY;

/**
 * Add a transaction to Google Sheet
 */
export async function addTransactionToSheet(transaction: Transaction): Promise<void> {
  // If credentials or sheet ID not available, skip
  if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log("Google Sheets integration not configured, skipping");
    return;
  }

  try {
    // Authentication
    const serviceAccountAuth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    // Initialize the sheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Look for transactions sheet, create it if it doesn't exist
    let sheet = doc.sheetsByTitle['Transactions'];
    if (!sheet) {
      // Create sheet with headers
      sheet = await doc.addSheet({
        title: 'Transactions',
        headerValues: [
          'ID', 'User ID', 'Type', 'Amount', 'Category', 
          'Description', 'Created At', 'Raw Input', 'Transcription'
        ]
      });
    }

    // Format date to readable string
    const createdAt = new Date(transaction.createdAt).toLocaleString();

    // Add the row
    await sheet.addRow({
      'ID': transaction.id,
      'User ID': transaction.userId,
      'Type': transaction.type,
      'Amount': transaction.amount,
      'Category': transaction.category,
      'Description': transaction.description || '',
      'Created At': createdAt,
      'Raw Input': transaction.rawInput || '',
      'Transcription': transaction.transcription || ''
    });

    console.log(`Transaction #${transaction.id} added to Google Sheet.`);
  } catch (error) {
    console.error("Error adding transaction to Google Sheet:", error);
    throw error;
  }
}
