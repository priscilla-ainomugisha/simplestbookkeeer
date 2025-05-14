import React, { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

type InputFooterProps = {
  isRecording: boolean;
  onToggleRecording: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  voiceEnabled?: boolean;
};

export default function InputFooter({
  isRecording,
  onToggleRecording,
  inputValue,
  onInputChange,
  onSendMessage,
  voiceEnabled = true
}: InputFooterProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle key press (enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm border-t border-border/30 px-4 py-4 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center">
          {/* Voice input button */}
          <button 
            className={`w-14 h-14 text-white rounded-full flex items-center justify-center mr-4 transition-all duration-200 shadow-md ${
              isRecording 
                ? 'recording bg-destructive scale-110' 
                : voiceEnabled 
                  ? 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={() => {
              if (voiceEnabled) {
                onToggleRecording();
              } else {
                toast({
                  title: "Voice recording unavailable",
                  description: "Voice processing is currently unavailable. Please use text input instead.",
                  variant: "default"
                });
              }
            }}
            title={voiceEnabled ? "Record voice note" : "Voice recording unavailable"}
          >
            <span className="material-icons text-xl">{voiceEnabled ? 'mic' : 'mic_off'}</span>
          </button>
          
          {/* Text input */}
          <div className="flex-1 bg-card dark:bg-card border border-border/50 rounded-full flex items-center overflow-hidden pr-1 shadow-sm">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Type a message like 'I sold items for 500'..." 
              className="flex-1 py-3 px-4 bg-transparent focus:outline-none text-foreground"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className={`p-3 rounded-full m-1 transition-all duration-200 ${
                inputValue.trim() 
                  ? 'bg-primary text-white hover:bg-primary/90' 
                  : 'text-muted-foreground'
              }`}
              onClick={onSendMessage}
              disabled={!inputValue.trim()}
              title="Send message"
            >
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
        
        {/* Recording indicator */}
        <div className={`mt-2 text-center animate-in ${isRecording ? '' : 'hidden'}`}>
          <div className="inline-block px-4 py-2 bg-card dark:bg-card/90 border border-border/50 rounded-full shadow-md">
            <div className="flex items-center">
              <span className="text-destructive animate-pulse mr-2">●</span>
              <span className="font-medium">Recording your voice note... Tap mic to stop</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
