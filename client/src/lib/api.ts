import { apiRequest } from './queryClient';
import { DEMO_USER } from '@/App';

// Process a text message
export async function processTextMessage(message: string) {
  const response = await apiRequest('POST', '/api/transactions/text', { 
    userId: DEMO_USER.id,
    text: message 
  });
  return await response.json();
}

// Send a voice recording
export async function sendVoiceRecording(audioBlob: Blob) {
  // Create a FormData object to send the audio file
  const formData = new FormData();
  formData.append('userId', DEMO_USER.id.toString());
  formData.append('voiceNote', audioBlob, 'recording.wav');
  
  // Use fetch directly since we're sending FormData, not JSON
  const response = await fetch('/api/transactions/voice', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  
  return await response.json();
}

// Get stats for today
export async function fetchTodayStats() {
  const response = await apiRequest('GET', `/api/analytics/daily/${DEMO_USER.id}`);
  return await response.json();
}

// Get transaction history
export async function fetchTransactionHistory(days: number = 7) {
  // Get today's date
  const today = new Date();
  
  // Calculate the start date (days ago)
  const startDate = new Date();
  startDate.setDate(today.getDate() - days);
  
  // Format dates for URL
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];
  
  const response = await apiRequest('GET', `/api/transactions/${DEMO_USER.id}`);
  return await response.json();
}

// Edit a transaction (not implemented in the backend yet)
export async function editTransaction(transactionId: number, data: any) {
  // This would be implemented in a real app
  console.log(`Would edit transaction ${transactionId} with data:`, data);
  return { success: true, message: "Transaction updated (simulated)" };
}
