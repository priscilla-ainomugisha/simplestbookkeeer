import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendIcon, MicIcon } from 'lucide-react';

interface TransactionInputProps {
  onSendMessage: (text: string) => void;
}

export default function TransactionInput({ onSendMessage }: TransactionInputProps) {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
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
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="ml-2 bg-black text-white rounded-none p-2 flex items-center justify-center w-10 h-10 hover:bg-gray-900"
          size="icon"
          aria-label="Send message"
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}