import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, X, Bot, User, CheckCircle } from "lucide-react";
import { sendMessage, sendMessageWithFiles, initializeChat, resetChat, ChatMessage, sendLettaMessage, initializeLettaAgent } from "@/lib/gemini";
import { useProject } from "@/lib/project-context";
import { saveTaskUpdate } from "@/lib/supabase";

interface ChatPanelProps {
  onClose?: () => void;
}

export const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const { addTaskDetails, updateTask, phases } = useProject();
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
  const [useLetta, setUseLetta] = useState(false);

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
      let botResponse: ChatMessage;
      if (useLetta) {
        await initializeLettaAgent();
        const lettaReply = await sendLettaMessage(inputValue);
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: lettaReply,
          timestamp: new Date()
        };
      } else {
        const result = await sendMessage(inputValue);
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: result.response,
          timestamp: new Date()
        };
        
        // Handle multiple task updates if detected
        if (result.taskUpdates && result.taskUpdates.length > 0) {
          // Apply all task updates
          result.taskUpdates.forEach(taskUpdate => {
            if (taskUpdate.type === 'branding' && taskUpdate.colors) {
              // Handle branding with colors
              updateTask(taskUpdate.phaseId, taskUpdate.taskId, {
                details: taskUpdate.details,
                colors: taskUpdate.colors,
                source: 'chatbot',
                completed: true,
                status: 'done'
              });
              // Save to Supabase
              const task = phases.flatMap(p => p.tasks).find(t => t.id === taskUpdate.taskId);
              saveTaskUpdate({
                phaseId: taskUpdate.phaseId,
                taskId: taskUpdate.taskId,
                taskName: task?.name || "",
                details: taskUpdate.details,
                colors: taskUpdate.colors,
                source: 'chatbot',
                status: 'done',
                completed: true,
              });
            } else {
              // Handle regular task updates
              addTaskDetails(taskUpdate.phaseId, taskUpdate.taskId, taskUpdate.details);
              const task = phases.flatMap(p => p.tasks).find(t => t.id === taskUpdate.taskId);
              saveTaskUpdate({
                phaseId: taskUpdate.phaseId,
                taskId: taskUpdate.taskId,
                taskName: task?.name || "",
                details: taskUpdate.details,
                source: 'chatbot',
                status: 'done',
                completed: true,
              });
            }
          });
          
          // Add confirmation messages for each update
          result.taskUpdates.forEach((taskUpdate, index) => {
            let updateContent = `✅ I've automatically updated your ${taskUpdate.type} task with: "${taskUpdate.details}"`;
            
            // Add color preview for branding updates
            if (taskUpdate.type === 'branding' && taskUpdate.colors) {
              updateContent = `✅ I've automatically updated your branding with: Primary: ${taskUpdate.colors.primary}, Secondary: ${taskUpdate.colors.secondary}`;
            }
            
            const updateMessage: ChatMessage = {
              id: (Date.now() + 2 + index).toString(),
              type: 'bot',
              content: updateContent,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, updateMessage]);
          });
        }
      }
      setMessages(prev => [...prev, botResponse]);
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
      {/* Letta toggle */}
      <div className="flex items-center justify-center p-2 bg-blue-50 border-b border-blue-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={useLetta} onChange={e => setUseLetta(e.target.checked)} />
          <span className="text-xs text-blue-700">Enable Letta Memory</span>
        </label>
      </div>
      {useLetta && (
        <div className="text-center text-xs text-blue-700 bg-blue-50 py-1 border-b border-blue-100">
          Letta memory is enabled. Your chat will be remembered across sessions.
        </div>
      )}
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
          onChange={async (e) => {
            if (e.target.files?.length) {
              setIsLoading(true);
              const prompt = inputValue.trim() || "Please analyze the uploaded document(s).";
              const userMsg: ChatMessage = {
                id: Date.now().toString(),
                type: 'user',
                content: `Uploaded file${e.target.files.length > 1 ? 's' : ''}: ${Array.from(e.target.files).map(f => f.name).join(', ')}${inputValue ? `\nPrompt: ${inputValue}` : ''}`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, userMsg]);
              setInputValue("");
              try {
                const result = await sendMessageWithFiles(prompt, e.target.files);
                const botResponse: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  type: 'bot',
                  content: result.response,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, botResponse]);
                if (result.taskUpdates && result.taskUpdates.length > 0) {
                  result.taskUpdates.forEach(taskUpdate => {
                    if (taskUpdate.type === 'branding' && taskUpdate.colors) {
                      updateTask(taskUpdate.phaseId, taskUpdate.taskId, {
                        details: taskUpdate.details,
                        colors: taskUpdate.colors,
                        source: 'chatbot',
                        completed: true,
                        status: 'done'
                      });
                      const task = phases.flatMap(p => p.tasks).find(t => t.id === taskUpdate.taskId);
                      saveTaskUpdate({
                        phaseId: taskUpdate.phaseId,
                        taskId: taskUpdate.taskId,
                        taskName: task?.name || "",
                        details: taskUpdate.details,
                        colors: taskUpdate.colors,
                        source: 'chatbot',
                        status: 'done',
                        completed: true,
                      });
                    } else {
                      addTaskDetails(taskUpdate.phaseId, taskUpdate.taskId, taskUpdate.details);
                      const task = phases.flatMap(p => p.tasks).find(t => t.id === taskUpdate.taskId);
                      saveTaskUpdate({
                        phaseId: taskUpdate.phaseId,
                        taskId: taskUpdate.taskId,
                        taskName: task?.name || "",
                        details: taskUpdate.details,
                        source: 'chatbot',
                        status: 'done',
                        completed: true,
                      });
                    }
                  });
                  result.taskUpdates.forEach((taskUpdate, index) => {
                    let updateContent = `✅ I've automatically updated your ${taskUpdate.type} task with: "${taskUpdate.details}"`;
                    if (taskUpdate.type === 'branding' && taskUpdate.colors) {
                      updateContent = `✅ I've automatically updated your branding with: Primary: ${taskUpdate.colors.primary}, Secondary: ${taskUpdate.colors.secondary}`;
                    }
                    const updateMessage: ChatMessage = {
                      id: (Date.now() + 2 + index).toString(),
                      type: 'bot',
                      content: updateContent,
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
                  content: "Sorry, I encountered an error processing your file(s). Please try again.",
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, errorResponse]);
              } finally {
                setIsLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }
          }}
        />
      </div>
    </Card>
  );
};
