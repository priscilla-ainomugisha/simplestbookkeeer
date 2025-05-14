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
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center">
          {/* Voice input button */}
          <button 
            className={`w-12 h-12 text-white rounded-full flex items-center justify-center mr-3 transition-all duration-200 shadow-md ${
              isRecording 
                ? 'recording bg-error' 
                : voiceEnabled 
                  ? 'bg-primary hover:bg-primary-dark' 
                  : 'bg-neutral-400 cursor-not-allowed'
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
            <span className="material-icons">{voiceEnabled ? 'mic' : 'mic_off'}</span>
          </button>
          
          {/* Text input */}
          <div className="flex-1 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center overflow-hidden pr-2">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 py-2 px-4 bg-transparent focus:outline-none dark:text-white"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className={`p-2 hover:text-primary ${
                inputValue.trim() ? 'text-primary' : 'text-neutral-500 dark:text-neutral-300'
              }`}
              onClick={onSendMessage}
              disabled={!inputValue.trim()}
            >
              <span className="material-icons">send</span>
            </button>
          </div>
        </div>
        
        {/* Recording indicator */}
        <div className={`mt-2 text-center ${isRecording ? '' : 'hidden'}`}>
          <div className="inline-block px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm">
            <span className="text-error animate-pulse mr-2">●</span>
            <span>Recording... Tap mic to stop</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
