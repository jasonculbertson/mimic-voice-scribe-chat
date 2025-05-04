
import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Mic, ArrowUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MessageList from '../components/MessageList';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newUserMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user' as const,
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: messages.length === 0 
          ? "Hello! How can I help you today?"
          : "I'm a simple assistant. This is a demo response.",
        sender: 'assistant' as const,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="w-full text-center py-10">
        <h1 className="text-4xl font-bold">Where should we begin?</h1>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 max-w-3xl mx-auto w-full">
        {messages.length > 0 ? (
          <MessageList messages={messages} />
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="relative flex items-center rounded-full border border-gray-300 bg-white shadow-sm">
          {/* Plus button */}
          <Button variant="ghost" size="icon" className="rounded-full ml-1">
            <Plus className="h-5 w-5" />
          </Button>
          
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="what's"
            className="flex-1 py-3 px-2 bg-transparent border-none focus:outline-none text-base"
          />
          
          {/* Action buttons */}
          <div className="flex items-center mr-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            
            <div className="px-2 py-1 rounded-full border border-gray-300 flex items-center mx-1">
              <Search className="h-4 w-4 mr-2" />
              <span className="text-sm">Deep research</span>
            </div>
            
            <div className="px-2 py-1 rounded-full border border-gray-300 flex items-center mx-1">
              <Search className="h-4 w-4 mr-2" />
              <span className="text-sm">Create image</span>
            </div>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <span className="text-xl">•••</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="rounded-full">
              <Mic className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              className={`rounded-full ml-1 ${!inputValue.trim() ? 'bg-gray-200' : 'bg-black'}`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
