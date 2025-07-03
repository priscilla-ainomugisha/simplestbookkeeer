import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useRecording(userId: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('Your browser does not support audio recording. Please try using Chrome, Firefox, or Edge.');
      }

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

      // Find a supported MIME type, prioritizing WebM with Opus
      const mimeTypes = [
        'audio/webm;codecs=opus',  // Chrome's preferred format
        'audio/webm',              // Fallback for some browsers
        'audio/ogg;codecs=opus',   // Firefox's preferred format
        'audio/mp4'                // Safari's preferred format
      ];

      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        throw new Error('Your browser does not support any of the required audio formats. Please try using Chrome, Firefox, or Edge.');
      }

      console.log('Using audio format:', supportedMimeType);

      // Create MediaRecorder with the supported MIME type
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        audioBitsPerSecond: 48000
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
        title: 'Microphone Access Error',
        description: error instanceof Error ? error.message : 'Please allow microphone access to record voice notes.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder || !isRecording) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    return new Promise<Blob | null>((resolve) => {
      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          console.error('No audio chunks recorded');
          setIsProcessing(false);
          resolve(null);
          return;
        }
        
        // Create the WebM blob
        const webmBlob = new Blob(audioChunks, { 
          type: mediaRecorder.mimeType
        });

        // Log the audio blob details
        console.log('Audio blob created:', {
          size: webmBlob.size,
          type: webmBlob.type,
          chunks: audioChunks.length,
          totalSize: audioChunks.reduce((sum, chunk) => sum + chunk.size, 0)
        });

        // Verify the audio blob is not empty
        if (webmBlob.size === 0) {
          console.error('Created empty audio blob');
          setIsProcessing(false);
          resolve(null);
          return;
        }

        setIsProcessing(false);
        resolve(webmBlob);
        
        // Stop all tracks
        mediaRecorder.stream?.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.stop();
    });
  }, [mediaRecorder, isRecording, audioChunks]);

  const uploadRecording = useCallback(async (audioBlob: Blob) => {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data to upload');
      }

      console.log('Preparing to upload audio:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const formData = new FormData();
      formData.append('voiceNote', audioBlob, 'voice.webm');  // Ensure .webm extension
      formData.append('userId', userId);
      
      // Debug FormData contents
      console.log('FormData contents:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`${key}:`, value instanceof Blob ? {
          type: value.type,
          size: value.size
        } : value);
      });
      
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
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(errorText || 'Failed to upload voice note');
      }
      
      const result = await response.json();
      console.log('Voice note upload result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process voice note. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast, userId]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    uploadRecording
  };
}
