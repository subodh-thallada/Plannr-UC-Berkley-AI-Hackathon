import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, X, Bot, User, CheckCircle } from "lucide-react";
import { sendMessage, initializeChat, resetChat, ChatMessage } from "@/lib/gemini";
import { useProject } from "@/lib/project-context";

interface ChatPanelProps {
  onClose?: () => void;
}

export const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const { addTaskDetails } = useProject();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. Just tell me about your project details naturally, and I'll format them clearly and automatically update your project tasks!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat on component mount
  useEffect(() => {
    initializeChat();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendMessage(inputValue);
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);

      // Handle multiple task updates if detected
      if (result.taskUpdates && result.taskUpdates.length > 0) {
        // Apply all task updates
        result.taskUpdates.forEach(taskUpdate => {
          addTaskDetails(taskUpdate.phaseId, taskUpdate.taskId, taskUpdate.details);
        });
        
        // Add confirmation messages for each update
        result.taskUpdates.forEach((taskUpdate, index) => {
          const updateMessage: ChatMessage = {
            id: (Date.now() + 2 + index).toString(),
            type: 'bot',
            content: `✅ I've automatically updated your ${taskUpdate.type} task with: "${taskUpdate.details}"`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, updateMessage]);
        });
      }
    } catch (error) {
      console.error('Error getting response:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="h-screen flex flex-col bg-white/80 backdrop-blur-sm border-r border-blue-100 rounded-none lg:rounded-r-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="bg-blue-500">
            <AvatarFallback>
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">Project Assistant</h2>
            <p className="text-xs text-blue-100">Online</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={`w-8 h-8 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                  <AvatarFallback className={message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.content.includes('✅') 
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarFallback className="bg-gray-200">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-gray-100 text-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-blue-100 bg-white/50">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            className="shrink-0 border-blue-200 hover:bg-blue-50"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me about your project details naturally..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="border-blue-200 focus:border-blue-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              console.log("Files selected:", e.target.files);
              // Handle file upload logic here
            }
          }}
        />
      </div>
    </Card>
  );
};
