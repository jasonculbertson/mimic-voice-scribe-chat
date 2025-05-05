import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AIBoardroomMessageList from '../components/AIBoardroomMessageList';
import { fetchAIBoardroomResponses } from '../lib/aiBoardroomService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'gpt4' | 'claude' | 'gemini';
  role?: string;
}

const AIBoardroom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerationStopped, setIsGenerationStopped] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      role: 'You'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setIsGenerationStopped(false);
    
    // Use our mock service to get AI responses
    fetchAIBoardroomResponses(inputValue.trim(), {
      onGPT4Response: (response) => {
        if (isGenerationStopped) return;
        const gpt4Message: Message = {
          id: `gpt4-${Date.now()}`,
          content: response,
          sender: 'gpt4',
          role: 'GPT-4'
        };
        setMessages(prev => [...prev, gpt4Message]);
      },
      onClaudeResponse: (response) => {
        if (isGenerationStopped) return;
        const claudeMessage: Message = {
          id: `claude-${Date.now()}`,
          content: response,
          sender: 'claude',
          role: 'Claude'
        };
        setMessages(prev => [...prev, claudeMessage]);
      },
      onGeminiResponse: (response) => {
        if (isGenerationStopped) return;
        const geminiMessage: Message = {
          id: `gemini-${Date.now()}`,
          content: response,
          sender: 'gemini',
          role: 'Gemini'
        };
        setMessages(prev => [...prev, geminiMessage]);
      },
      onGPT4Round2Response: (response) => {
        if (isGenerationStopped) return;
        const gpt4Round2Message: Message = {
          id: `gpt4-round2-${Date.now()}`,
          content: response,
          sender: 'gpt4',
          role: 'GPT-4 (Round 2)'
        };
        setMessages(prev => [...prev, gpt4Round2Message]);
      },
      onClaudeRound2Response: (response) => {
        if (isGenerationStopped) return;
        const claudeRound2Message: Message = {
          id: `claude-round2-${Date.now()}`,
          content: response,
          sender: 'claude',
          role: 'Claude (Round 2)'
        };
        setMessages(prev => [...prev, claudeRound2Message]);
      },
      onGeminiRound2Response: (response) => {
        if (isGenerationStopped) return;
        const geminiRound2Message: Message = {
          id: `gemini-round2-${Date.now()}`,
          content: response,
          sender: 'gemini',
          role: 'Gemini (Final Answer)'
        };
        setMessages(prev => [...prev, geminiRound2Message]);
        setIsLoading(false);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsLoading(false);
      }
    }).finally(() => {
      if (isGenerationStopped) {
        setIsLoading(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopGeneration = () => {
    setIsGenerationStopped(true);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      {messages.length === 0 && (
        <div className="w-full text-center py-10">
          <h1 className="text-4xl font-bold">AI Boardroom</h1>
          <p className="text-gray-600 max-w-md mx-auto mt-4 text-sm">
            Ask a question to consult with your AI Board of Directors. Get strategic insights from GPT-4, critical analysis from Claude, and a synthesized response from Gemini.
          </p>

        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 max-w-3xl mx-auto w-full">
        {error && (
          <div className="my-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          </div>
        )}
        
        {messages.length > 0 ? (
          <AIBoardroomMessageList messages={messages} />
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="relative flex items-center rounded-full border border-gray-300 bg-white shadow-sm">
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your board of directors..."
            className="flex-1 py-3 px-4 bg-transparent border-none focus:outline-none text-base"
            disabled={isLoading}
          />
          
          {/* Send button */}
          <div className="flex items-center mr-2">
            <Button 
              variant="default" 
              size="icon" 
              className={`rounded-full ${!inputValue.trim() || isLoading ? 'bg-gray-200' : 'bg-black'}`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {isLoading && (
          <div className="flex justify-center mt-2">
            <button
              onClick={stopGeneration}
              className="text-xs text-red-600 hover:underline font-medium"
            >
              Stop generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBoardroom;
