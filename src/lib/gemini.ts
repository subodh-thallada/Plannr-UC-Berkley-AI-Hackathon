import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Store conversation history
let conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [
  {
    role: 'user',
    parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses.'
  },
  {
    role: 'model',
    parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. How can I help you today?'
  }
];

export const initializeChat = () => {
  if (!API_KEY) {
    console.error('Cannot initialize chat: API key is missing');
    return;
  }
  console.log('Chat initialized successfully');
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!API_KEY) {
    return 'Error: API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.';
  }

  try {
    console.log('Sending message to Gemini:', message);
    
    // Add user message to history
    conversationHistory.push({ role: 'user', parts: message });
    
    // Prepare the conversation for the API
    const contents = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const responseText = response.text;
    console.log('Received response from Gemini:', responseText);
    
    // Add bot response to history
    conversationHistory.push({ role: 'model', parts: responseText });
    
    return responseText;
  } catch (error) {
    console.error('Detailed error sending message to Gemini:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('401')) {
        return 'Error: Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.';
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        return 'Error: API quota exceeded. Please check your Google AI Studio usage.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Error: Network issue. Please check your internet connection.';
      } else if (error.message.includes('404') || error.message.includes('model')) {
        return 'Error: Model not found. Please check if the model name is correct.';
      }
    }
    
    return `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
  }
};

export const resetChat = () => {
  conversationHistory = [
    {
      role: 'user',
      parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses.'
    },
    {
      role: 'model',
      parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. How can I help you today?'
    }
  ];
  console.log('Chat reset successfully');
}; 