
import ChatInterface from '../components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6">Welcome to Chat Assistant</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Click the chat button in the bottom right corner to start a conversation.
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
};

export default Index;
