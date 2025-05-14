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
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-primary px-4 py-4 shadow-lg dark:bg-card dark:border-primary">
      <div className="max-w-md mx-auto">
        <div className="flex items-center">
          {/* Voice input button - retro style */}
          <button 
            className={`w-14 h-14 text-white flex items-center justify-center mr-4 transition-all duration-200 border-2 border-black ${
              isRecording 
                ? 'bg-destructive' 
                : voiceEnabled 
                  ? 'bg-primary hover:bg-primary-foreground' 
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
            style={{ transform: "rotate(-2deg)", boxShadow: "4px 4px 0 #000" }}
          >
            <span className="material-icons text-xl">{voiceEnabled ? 'mic' : 'mic_off'}</span>
          </button>
          
          {/* Text input - retro style */}
          <div className="flex-1 bg-white dark:bg-muted border-4 border-primary flex items-center overflow-hidden shadow-md" 
               style={{ boxShadow: "4px 4px 0 #000" }}>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Type 'I sold items for 500'..." 
              className="flex-1 py-2 px-4 bg-transparent focus:outline-none text-foreground font-medium"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className={`p-2 m-1 transition-all duration-200 border-2 border-black ${
                inputValue.trim() 
                  ? 'bg-secondary text-white hover:bg-secondary/90' 
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={onSendMessage}
              disabled={!inputValue.trim()}
              title="Send message"
              style={{ transform: "rotate(2deg)" }}
            >
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
        
        {/* Recording indicator - retro style */}
        <div className={`mt-3 text-center animate-in ${isRecording ? '' : 'hidden'}`}>
          <div className="inline-block px-4 py-2 bg-black text-white border-2 border-primary" 
               style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.2)" }}>
            <div className="flex items-center">
              <span className="text-destructive blink mr-2">●</span>
              <span className="font-bold uppercase tracking-wide">Recording... Tap mic to stop</span>
            </div>
          </div>
        </div>
        
        {/* Decorative bottom pattern */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-secondary"></div>
      </div>
    </footer>
  );
}
