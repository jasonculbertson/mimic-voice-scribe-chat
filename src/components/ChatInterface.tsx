
import { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatButton from './ChatButton';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
}

const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleSendMessage = (content: string) => {
    const newUserMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user' as const,
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    
    // Simulate assistant response after a short delay
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: "I'm a simple assistant. This is a demo response.",
        sender: 'assistant' as const,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  // Close chat when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && <ChatButton onClick={toggleChat} />}
      
      {/* Chat Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] flex flex-col bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ChatHeader onClose={closeChat} />
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/25 z-40 sm:hidden"
          onClick={closeChat}
        />
      )}
    </>
  );
};

export default ChatInterface;
