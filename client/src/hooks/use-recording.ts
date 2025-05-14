import { useState, useEffect, useRef } from 'react';

interface RecordingResult {
  blob: Blob;
  duration: number;
}

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = async (): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }
      
      mediaRecorderRef.current.onstop = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000; // duration in seconds
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setIsRecording(false);
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        resolve({ blob: audioBlob, duration });
      };
      
      mediaRecorderRef.current.stop();
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording
  };
}
