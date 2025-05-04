
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader = ({ onClose }: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-800">
      <div className="font-medium">Chat Assistant</div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Close chat"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatHeader;
