import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicIcon, SendIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { recordAudio } from "@/lib/transactions";

interface InputAreaProps {
  userId: number;
}

export default function InputArea({ userId }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Tap and hold to record");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Process text input
  const textMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/transactions/text", {
        userId,
        text
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${userId}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Process voice note
  const voiceMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("voiceNote", audioBlob, "recording.wav");
      
      const response = await fetch("/api/transactions/voice", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${userId}`] });
      setIsVoiceMode(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to process voice note",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle sending text message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    textMutation.mutate(message);
  };

  // Handle pressing Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Handle showing voice input
  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    setRecordingStatus("Tap and hold to record");
  };

  // Start recording
  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("Recording... Release to send");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive"
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    setIsRecording(false);
    setRecordingStatus("Processing your voice note...");
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      voiceMutation.mutate(audioBlob);
      
      // Stop all tracks
      mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current.stop();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      {!isVoiceMode ? (
        // Text input mode - minimalist design
        <div className="flex items-center">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Record a transaction..."
            className="flex-1 border border-gray-300 rounded-none py-2 px-4 focus:outline-none focus:ring-1 focus:ring-black"
          />
          <Button
            onClick={toggleVoiceMode}
            className="ml-2 bg-white border border-gray-300 text-gray-800 rounded-none p-2 flex items-center justify-center w-10 h-10 hover:bg-gray-100"
            size="icon"
            aria-label="Switch to voice input"
          >
            <MicIcon className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || textMutation.isPending}
            className="ml-2 bg-black text-white rounded-none p-2 flex items-center justify-center w-10 h-10 hover:bg-gray-900"
            size="icon"
            aria-label="Send message"
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        // Voice input mode - minimalist design
        <div>
          <div className="flex items-center justify-between">
            <div className="flex-1 bg-gray-100 border border-gray-200 py-2 px-4 text-center text-sm text-gray-600">
              {recordingStatus}
            </div>
            <Button
              onClick={toggleVoiceMode}
              className="ml-2 bg-white border border-gray-300 text-gray-800 rounded-none p-2 flex items-center justify-center w-10 h-10 hover:bg-gray-100"
              size="icon"
              aria-label="Cancel voice input"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onMouseDown={startRecording}
              onTouchStart={startRecording}
              onMouseUp={stopRecording}
              onTouchEnd={stopRecording}
              onMouseLeave={stopRecording}
              disabled={voiceMutation.isPending}
              className={`${
                isRecording
                  ? "bg-black pulse"
                  : "bg-gray-800"
              } text-white rounded-none p-2 flex items-center justify-center w-14 h-14 hover:bg-gray-900`}
              size="icon"
              aria-label="Record voice"
            >
              <MicIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
