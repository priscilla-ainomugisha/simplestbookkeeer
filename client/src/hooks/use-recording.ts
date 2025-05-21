import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useRecording(userId: number) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      // Check if the browser supports the required MIME type
      const mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Your browser does not support the required audio format');
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      // Clear any existing chunks
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to record voice notes.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder || !isRecording) return;
    
    setIsRecording(false);
    
    return new Promise<Blob | null>((resolve) => {
      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          resolve(null);
          return;
        }
        
        const audioBlob = new Blob(audioChunks, { 
          type: 'audio/webm;codecs=opus'
        });

        // Log the audio blob details
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunks.length
        });

        resolve(audioBlob);
        
        // Stop all tracks
        mediaRecorder.stream?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.stop();
    });
  }, [mediaRecorder, isRecording, audioChunks]);

  const uploadRecording = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('voiceNote', audioBlob, 'recording.webm');
      formData.append('userId', userId.toString());
      
      console.log('Uploading voice note:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        userId
      });
      
      const response = await fetch('/api/transactions/voice', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload voice note');
      }
      
      const result = await response.json();
      console.log('Voice note upload result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process voice note. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast, userId]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    uploadRecording
  };
}
