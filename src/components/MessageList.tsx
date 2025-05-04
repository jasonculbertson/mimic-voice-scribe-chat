
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="space-y-6 pb-6">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col">
          {/* User bubble */}
          {message.sender === 'user' && (
            <div className="self-end bg-gray-100 rounded-2xl rounded-tr-sm py-3 px-4 max-w-[80%] text-gray-800">
              {message.content}
            </div>
          )}
          
          {/* Assistant bubble */}
          {message.sender === 'assistant' && (
            <div className="self-start bg-white border border-gray-200 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              {message.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
