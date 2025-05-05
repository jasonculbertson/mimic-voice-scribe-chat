interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'gpt4' | 'claude' | 'gemini';
  role?: string;
}

interface MessageListProps {
  messages: Message[];
}

const AIBoardroomMessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="space-y-6 pb-6">
      {messages.map((message, index) => (
        <div key={message.id} className="flex flex-col">
          {/* Message role/sender label */}
          {message.role && message.sender !== 'user' && (
            <div className="mb-2 text-xs font-medium text-gray-500 flex items-center">
              <span className="flex items-center">
                {message.sender === 'gpt4' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                )}
                {message.sender === 'claude' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                )}
                {message.sender === 'gemini' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                )}
                {message.role}
              </span>
            </div>
          )}
          
          {/* User bubble */}
          {message.sender === 'user' && (
            <div className="self-end bg-gray-100 rounded-2xl rounded-tr-sm py-3 px-4 max-w-[80%] text-gray-800">
              {message.content}
            </div>
          )}
          
          {/* AI bubbles with different colored indicators */}
          {message.sender === 'gpt4' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-green-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}

          {message.sender === 'claude' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-purple-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}

          {message.sender === 'gemini' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-blue-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}

          {/* Generic assistant bubble (fallback) */}
          {message.sender === 'assistant' && (
            <div className="self-start bg-white border border-gray-200 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}
          
          {/* Time indicator for some messages */}
          {(index === messages.length - 1 || index % 5 === 0) && message.sender !== 'user' && (
            <div className="self-start mt-1 text-[10px] text-gray-400 pl-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AIBoardroomMessageList;
