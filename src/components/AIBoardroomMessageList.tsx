import { Message, AIModel } from '../lib/aiBoardroomService';

interface MessageListProps {
  messages: Message[];
}

const AIBoardroomMessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="space-y-6 pb-6">
      {messages.map((message, index) => (
        <div key={message.id} className="flex flex-col">
          {/* Message role/model label */}
          {message.role === 'assistant' && message.model && (
            <div className="mb-2 text-xs font-medium text-gray-500 flex items-center">
              <span className="flex items-center">
                {message.model === 'gpt' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                )}
                {message.model === 'claude' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                )}
                {message.model === 'gemini' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                )}
                {message.model === 'gpt' && (message.round === 2 ? 'GPT-4 (Round 2)' : 'GPT-4')}
                {message.model === 'claude' && (message.round === 2 ? 'Claude (Round 2)' : 'Claude')}
                {message.model === 'gemini' && (message.round === 2 ? 'Gemini (Final Answer)' : 'Gemini')}
              </span>
            </div>
          )}
          
          {/* User bubble */}
          {message.role === 'user' && (
            <div className="self-end bg-gray-100 rounded-2xl rounded-tr-sm py-3 px-4 max-w-[80%] text-gray-800">
              {message.content}
            </div>
          )}
          
          {/* AI bubbles with different colored indicators */}
          {message.role === 'assistant' && message.model === 'gpt' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-green-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">
                {message.content}
                {message.pending && (
                  <span className="inline-block animate-pulse">▌</span>
                )}
              </div>
            </div>
          )}

          {message.role === 'assistant' && message.model === 'claude' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-purple-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">
                {message.content}
                {message.pending && (
                  <span className="inline-block animate-pulse">▌</span>
                )}
              </div>
            </div>
          )}

          {message.role === 'assistant' && message.model === 'gemini' && (
            <div className="self-start bg-white border border-gray-200 border-l-[3px] border-l-blue-500 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">
                {message.content}
                {message.pending && (
                  <span className="inline-block animate-pulse">▌</span>
                )}
              </div>
            </div>
          )}

          {/* Generic assistant bubble (fallback) */}
          {message.role === 'assistant' && !message.model && (
            <div className="self-start bg-white border border-gray-200 rounded-2xl rounded-tl-sm py-3 px-4 max-w-[80%] text-gray-800">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}
          
          {/* Time indicator for some messages */}
          {(index === messages.length - 1 || index % 5 === 0) && message.role === 'assistant' && (
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
