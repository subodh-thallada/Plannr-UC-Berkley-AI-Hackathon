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

export interface TaskUpdate {
  type: 'timeline' | 'location' | 'theme' | 'size' | 'none';
  details: string;
  taskId: string;
  phaseId: string;
}

// Store conversation history
let conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [
  {
    role: 'user',
    parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses. When users mention timeline, location, theme, or size information, you should extract that information and provide it in a structured format.'
  },
  {
    role: 'model',
    parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. I can also automatically update your project tasks when you provide timeline, location, theme, or size information. How can I help you today?'
  }
];

export const initializeChat = () => {
  if (!API_KEY) {
    console.error('Cannot initialize chat: API key is missing');
    return;
  }
  console.log('Chat initialized successfully');
};

// Function to detect task-related information in user messages
export const detectTaskUpdates = (message: string): TaskUpdate | null => {
  const lowerMessage = message.toLowerCase();
  
  // Timeline detection - more comprehensive patterns
  if (lowerMessage.includes('timeline') || lowerMessage.includes('date') || lowerMessage.includes('schedule') || 
      lowerMessage.includes('when') || lowerMessage.includes('time') || lowerMessage.includes('period')) {
    
    // Try to extract timeline information with various patterns
    const timelinePatterns = [
      /(?:timeline|date|schedule|when|time|period)[:\s]*([^.]+)/i,
      /([a-zA-Z]+\s+\d{1,2},?\s+\d{4})/i, // March 15, 2024
      /(\d{1,2}\/\d{1,2}\/\d{4})/i, // 3/15/2024
      /(\d{1,2}-\d{1,2}-\d{4})/i, // 15-3-2024
      /([a-zA-Z]+\s+\d{1,2}\s*[-–]\s*\d{1,2},?\s+\d{4})/i, // March 15-17, 2024
      /(\d{1,2}\s*[-–]\s*\d{1,2}\s+[a-zA-Z]+\s+\d{4})/i, // 15-17 March 2024
    ];
    
    for (const pattern of timelinePatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'timeline',
          details: match[1].trim(),
          taskId: '1-1',
          phaseId: '1'
        };
      }
    }
    
    // If no specific pattern matches but timeline is mentioned, extract the sentence
    const timelineMatch = message.match(/(?:timeline|date|schedule|when|time|period)[:\s]*([^.]+)/i);
    if (timelineMatch) {
      return {
        type: 'timeline',
        details: timelineMatch[1].trim(),
        taskId: '1-1',
        phaseId: '1'
      };
    }
  }
  
  // Location detection - more comprehensive patterns
  if (lowerMessage.includes('location') || lowerMessage.includes('venue') || lowerMessage.includes('where') || 
      lowerMessage.includes('place') || lowerMessage.includes('address') || lowerMessage.includes('site')) {
    
    // Try to extract location information with various patterns
    const locationPatterns = [
      /(?:location|venue|where|place|address|site)[:\s]*([^.]+)/i,
      /([a-zA-Z\s]+(?:convention center|hall|building|room|theater|stadium|arena|center|centre))/i,
      /([a-zA-Z\s]+(?:street|avenue|road|boulevard|drive|way|lane))/i,
      /([a-zA-Z\s]+(?:university|college|school|institute))/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'location',
          details: match[1].trim(),
          taskId: '1-3',
          phaseId: '1'
        };
      }
    }
    
    // If no specific pattern matches but location is mentioned, extract the sentence
    const locationMatch = message.match(/(?:location|venue|where|place|address|site)[:\s]*([^.]+)/i);
    if (locationMatch) {
      return {
        type: 'location',
        details: locationMatch[1].trim(),
        taskId: '1-3',
        phaseId: '1'
      };
    }
  }
  
  // Theme detection
  if (lowerMessage.includes('theme') || lowerMessage.includes('topic') || lowerMessage.includes('subject') || 
      lowerMessage.includes('focus') || lowerMessage.includes('concept')) {
    const themeMatch = message.match(/(?:theme|topic|subject|focus|concept)[:\s]*([^.]+)/i);
    if (themeMatch) {
      return {
        type: 'theme',
        details: themeMatch[1].trim(),
        taskId: '1-2',
        phaseId: '1'
      };
    }
  }
  
  // Size detection
  if (lowerMessage.includes('size') || lowerMessage.includes('capacity') || lowerMessage.includes('attendees') || 
      lowerMessage.includes('participants') || lowerMessage.includes('people') || lowerMessage.includes('guests')) {
    const sizeMatch = message.match(/(?:size|capacity|attendees|participants|people|guests)[:\s]*([^.]+)/i);
    if (sizeMatch) {
      return {
        type: 'size',
        details: sizeMatch[1].trim(),
        taskId: '1-4',
        phaseId: '1'
      };
    }
  }
  
  return null;
};

export const sendMessage = async (message: string): Promise<{ response: string; taskUpdate?: TaskUpdate }> => {
  if (!API_KEY) {
    return {
      response: 'Error: API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      taskUpdate: undefined
    };
  }

  try {
    console.log('Sending message to Gemini:', message);
    
    // Check for task updates first
    const taskUpdate = detectTaskUpdates(message);
    
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
    
    return { response: responseText, taskUpdate };
  } catch (error) {
    console.error('Detailed error sending message to Gemini:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('401')) {
        return {
          response: 'Error: Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.',
          taskUpdate: undefined
        };
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        return {
          response: 'Error: API quota exceeded. Please check your Google AI Studio usage.',
          taskUpdate: undefined
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          response: 'Error: Network issue. Please check your internet connection.',
          taskUpdate: undefined
        };
      } else if (error.message.includes('404') || error.message.includes('model')) {
        return {
          response: 'Error: Model not found. Please check if the model name is correct.',
          taskUpdate: undefined
        };
      }
    }
    
    return {
      response: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      taskUpdate: undefined
    };
  }
};

export const resetChat = () => {
  conversationHistory = [
    {
      role: 'user',
      parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses. When users mention timeline, location, theme, or size information, you should extract that information and provide it in a structured format.'
    },
    {
      role: 'model',
      parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. I can also automatically update your project tasks when you provide timeline, location, theme, or size information. How can I help you today?'
    }
  ];
  console.log('Chat reset successfully');
}; 