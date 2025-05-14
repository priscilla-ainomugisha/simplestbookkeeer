import { apiRequest } from './queryClient';

// Process a text message
export async function processTextMessage(message: string) {
  const response = await apiRequest('POST', '/api/messages/text', { message });
  return await response.json();
}

// Send a voice recording
export async function sendVoiceRecording(audioBlob: Blob) {
  // Create a FormData object to send the audio file
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  // Use fetch directly since we're sending FormData, not JSON
  const response = await fetch('/api/messages/voice', {
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
  const response = await apiRequest('GET', '/api/transactions/today-stats');
  return await response.json();
}

// Get transaction history
export async function fetchTransactionHistory(days: number = 7) {
  const response = await apiRequest('GET', `/api/transactions/history?days=${days}`);
  return await response.json();
}

// Edit a transaction
export async function editTransaction(transactionId: number, data: any) {
  const response = await apiRequest('PATCH', `/api/transactions/${transactionId}`, data);
  return await response.json();
}
