export interface TranscriptionResult {
  text: string;
  duration: number;
}

// This function sends the audio to our backend which uses AssemblyAI for transcription
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append("voiceNote", audioBlob, "recording.wav");
    
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      text: result.text,
      duration: result.duration || 0
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
