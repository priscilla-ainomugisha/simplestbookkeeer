import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicIcon, SendIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRecording } from "@/hooks/use-recording";

interface InputAreaProps {
  userId: number;
}

export default function InputArea({ userId }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Tap and hold to record");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isRecording, startRecording, stopRecording, uploadRecording } = useRecording(userId);

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
  const handleStartRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    await startRecording();
    setRecordingStatus("Recording... Release to send");
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!isRecording) return;
    
    setRecordingStatus("Processing your voice note...");
    const audioBlob = await stopRecording();
    
    if (audioBlob) {
      console.log('Stopping recording:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        userId
      });
      
      const result = await uploadRecording(audioBlob);
      if (result) {
        queryClient.invalidateQueries({ queryKey: [`/api/transactions/${userId}`] });
        setIsVoiceMode(false);
        toast({
          title: "Voice note processed",
          description: "Your transaction has been recorded.",
          variant: "default"
        });
      }
    }
  };

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
              onMouseDown={handleStartRecording}
              onTouchStart={handleStartRecording}
              onMouseUp={handleStopRecording}
              onTouchEnd={handleStopRecording}
              onMouseLeave={handleStopRecording}
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
