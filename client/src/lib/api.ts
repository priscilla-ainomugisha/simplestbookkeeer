import { apiRequest } from './queryClient';
import { useAuth } from './AuthContext';

// Process a text message
export async function processTextMessage(message: string, userId: string) {
  const response = await apiRequest('POST', '/api/transactions/text', { 
    userId,
    text: message 
  });
  return await response.json();
}

// Process a voice note
export async function processVoiceNote(audioBlob: Blob, userId: string) {
  // Create a FormData object to send the audio file
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('voiceNote', audioBlob, 'recording.webm');
  
  const response = await apiRequest('POST', '/api/transactions/voice', formData);
  return await response.json();
}

// Get stats for today
export async function fetchTodayStats(userId: string) {
  const response = await apiRequest('GET', `/api/analytics/daily/${userId}`);
  return await response.json();
}

// Get sales history (was transaction history)
export async function fetchSalesHistory(userId: string, days: number = 7) {
  // Get today's date
  const today = new Date();
  
  // Calculate the start date (days ago)
  const startDate = new Date();
  startDate.setDate(today.getDate() - days);
  
  // Format dates for URL
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];
  
  const response = await apiRequest('GET', `/api/transactions/${userId}`);
  return await response.json();
}

// Edit a transaction (not implemented in the backend yet)
export async function editTransaction(transactionId: number, data: any) {
  // This would be implemented in a real app
  console.log(`Would edit transaction ${transactionId} with data:`, data);
  return { success: true, message: "Transaction updated (simulated)" };
}

// Fetch a transaction by its UUID
export async function fetchTransactionById(transactionId: string) {
  const response = await apiRequest('GET', `/api/transactions/by-id/${transactionId}`);
  return await response.json();
}
