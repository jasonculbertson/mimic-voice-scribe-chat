import { useState, useRef, useEffect } from 'react';
import { Send, XCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AIBoardroomMessageList from '../components/AIBoardroomMessageList';
import { processAIBoardroom, AIModel, Message } from '../lib/aiBoardroomService';

const AIBoardroom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Function to stop generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Function to generate a unique ID
    const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    // Create placeholder messages for each model and round
    const gptMessage1: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'gpt',
      round: 1,
      pending: true
    };

    const claudeMessage1: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'claude',
      round: 1,
      pending: true
    };

    const geminiMessage1: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'gemini',
      round: 1,
      pending: true
    };

    const gptMessage2: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'gpt',
      round: 2,
      pending: true
    };

    const claudeMessage2: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'claude',
      round: 2,
      pending: true
    };

    const geminiMessage2: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      model: 'gemini',
      round: 2,
      pending: true
    };

    // Add all placeholder messages
    setMessages(prev => [
      ...prev,
      gptMessage1,
      claudeMessage1,
      geminiMessage1,
      gptMessage2,
      claudeMessage2,
      geminiMessage2
    ]);

    try {
      // Process AI Boardroom with streaming updates
      await processAIBoardroom(input, (model, content, round, done) => {
        // Update the corresponding message
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.model === model && msg.round === round) {
              return {
                ...msg,
                content,
                pending: !done
              };
            }
            return msg;
          });
        });

        // If the last model's last round is done, we're finished
        if (model === 'gemini' && round === 2 && done) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error('Error in AI Boardroom:', error);
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
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
          <p className="text-amber-600 max-w-md mx-auto mt-4 text-xs">
            Note: Using real API calls to OpenAI, Anthropic, and Google AI.
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
        <form onSubmit={handleSubmit} className="relative flex items-center rounded-full border border-gray-300 bg-white shadow-sm">
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your board of directors..."
            className="flex-1 py-3 px-4 bg-transparent border-none focus:outline-none text-base"
            disabled={isLoading}
          />
          
          {/* Send button */}
          <div className="flex items-center mr-2">
            <Button 
              type="submit"
              variant="default" 
              size="icon" 
              className={`rounded-full ${!input.trim() || isLoading ? 'bg-gray-200' : 'bg-black'}`}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
        
        {isGenerating && (
          <div className="flex justify-center mt-2">
            <button
              onClick={stopGeneration}
              className="text-xs text-red-600 hover:underline font-medium flex items-center"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Stop generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBoardroom;
