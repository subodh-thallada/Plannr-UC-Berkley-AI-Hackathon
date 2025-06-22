import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { LettaClient } from '@letta-ai/letta-client';

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

const LETTA_API_KEY = import.meta.env.VITE_LETTA_API_KEY;

if (!LETTA_API_KEY) {
  console.error('VITE_LETTA_API_KEY is not set in environment variables');
}

const lettaClient = new LettaClient({ token: LETTA_API_KEY || '' });

let agentId: string | null = null;

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface TaskUpdate {
  type: 'timeline' | 'location' | 'theme' | 'size' | 'branding' | 'none';
  details: string;
  taskId: string;
  phaseId: string;
  colors?: { primary: string; secondary: string };
}

// Store conversation history
let conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [
  {
    role: 'user',
    parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses. When users mention timeline, location, theme, or size information, you should extract that information and provide it in a structured format with clear labels like **Timeline:**, **Location:**, **Theme:**, and **Size:**. Always format your responses with these labels when you detect relevant information.'
  },
  {
    role: 'model',
    parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. When you provide timeline, location, theme, or size information, I\'ll format it clearly with labels like **Timeline:**, **Location:**, **Theme:**, and **Size:** so it can be automatically processed. How can I help you today?'
  }
];

export const initializeChat = () => {
  if (!API_KEY) {
    console.error('Cannot initialize chat: API key is missing');
    return;
  }
  console.log('Chat initialized successfully');
};

// Function to extract multiple task updates from a single message
export const extractMultipleTaskUpdates = (message: string): TaskUpdate[] => {
  const updates: TaskUpdate[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Timeline detection - natural language patterns
  const timelinePatterns = [
    // Natural language patterns with prepositions
    /(?:from|between|during|on|at|starting|beginning|running)\s+([a-zA-Z]+\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4})/i,
    // Date ranges with various separators
    /([a-zA-Z]+\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{1,2}-\d{1,2}-\d{4})/i,
    // Specific date formats
    /(?:march|april|may|june|july|august|september|october|november|december|january|february)\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4}/i,
    // Legacy keyword patterns
    /(?:timeline|date|schedule|when|time|period)[:\s]*([^.]+)/i,
  ];
  
  for (const pattern of timelinePatterns) {
    const match = message.match(pattern);
    if (match) {
      updates.push({
        type: 'timeline',
        details: match[1].trim(),
        taskId: '1-1',
        phaseId: '1'
      });
      break; // Only take the first timeline match
    }
  }
  
  // Location detection - natural language patterns
  const locationPatterns = [
    // Natural language patterns with common location types
    /(?:in|at|hosting|held|taking place|located in)\s+([a-zA-Z\s]+(?:convention center|hall|building|room|theater|stadium|arena|center|centre|university|college|school|institute|hotel|resort|park|plaza|mall|office|space|library|museum|gallery|studio|lab|laboratory|workspace|campus|facility|venue|location|place))/i,
    /(?:in|at|hosting|held|taking place|located in)\s+([a-zA-Z\s]+(?:street|avenue|road|boulevard|drive|way|lane|place|square|circle|court|terrace|heights|valley|hills|beach|bay|harbor|port|airport|station|terminal))/i,
    // City names and common locations
    /(?:in|at|hosting|held|taking place|located in)\s+([a-zA-Z\s]+(?:san francisco|new york|los angeles|chicago|boston|seattle|austin|denver|miami|atlanta|dallas|houston|phoenix|las vegas|portland|nashville|orlando|philadelphia|detroit|minneapolis|cleveland|pittsburgh|cincinnati|indianapolis|columbus|milwaukee|kansas city|st louis|baltimore|charlotte|raleigh|jacksonville|tampa|orlando|miami|fort lauderdale|west palm beach|daytona|gainesville|tallahassee|jacksonville|tampa|orlando|miami|fort lauderdale|west palm beach|daytona|gainesville|tallahassee))/i,
    // Generic location patterns
    /(?:location|venue|where|place|address|site)[:\s]*([^.]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      updates.push({
        type: 'location',
        details: match[1].trim(),
        taskId: '1-3',
        phaseId: '1'
      });
      break; // Only take the first location match
    }
  }
  
  // Theme detection - natural language patterns
  if (lowerMessage.includes('theme') || lowerMessage.includes('topic') || lowerMessage.includes('subject') || 
      lowerMessage.includes('focus') || lowerMessage.includes('concept') || lowerMessage.includes('about') ||
      lowerMessage.includes('hackathon') || lowerMessage.includes('event') || lowerMessage.includes('conference')) {
    const themeMatch = message.match(/(?:theme|topic|subject|focus|concept|about)[:\s]*([^.]+)/i);
    if (themeMatch) {
      updates.push({
        type: 'theme',
        details: themeMatch[1].trim(),
        taskId: '1-2',
        phaseId: '1'
      });
    }
  }
  
  // Size detection - natural language patterns
  if (lowerMessage.includes('size') || lowerMessage.includes('capacity') || lowerMessage.includes('attendees') || 
      lowerMessage.includes('participants') || lowerMessage.includes('people') || lowerMessage.includes('guests') ||
      lowerMessage.includes('students') || lowerMessage.includes('developers') || lowerMessage.includes('hackers')) {
    const sizeMatch = message.match(/(?:size|capacity|attendees|participants|people|guests|students|developers|hackers)[:\s]*([^.]+)/i);
    if (sizeMatch) {
      updates.push({
        type: 'size',
        details: sizeMatch[1].trim(),
        taskId: '1-4',
        phaseId: '1'
      });
    }
  }
  
  // Branding/color detection - natural language patterns
  if (lowerMessage.includes('branding') || lowerMessage.includes('colors') || lowerMessage.includes('colour') || 
      lowerMessage.includes('color scheme') || lowerMessage.includes('theme colors') || lowerMessage.includes('brand colors')) {
    
    // Look for hex color codes
    const hexColorPattern = /#[0-9A-Fa-f]{6}/g;
    const hexColors = message.match(hexColorPattern);
    
    if (hexColors && hexColors.length >= 2) {
      updates.push({
        type: 'branding',
        details: `Primary: ${hexColors[0]}, Secondary: ${hexColors[1]}`,
        taskId: '1-5',
        phaseId: '1',
        colors: {
          primary: hexColors[0],
          secondary: hexColors[1]
        }
      });
    } else if (hexColors && hexColors.length === 1) {
      // If only one color is provided, use a default secondary
      updates.push({
        type: 'branding',
        details: `Primary: ${hexColors[0]}, Secondary: #10B981`,
        taskId: '1-5',
        phaseId: '1',
        colors: {
          primary: hexColors[0],
          secondary: '#10B981'
        }
      });
    }
  }
  
  return updates;
};

// Function to detect task-related information in user messages (legacy - keeping for backward compatibility)
export const detectTaskUpdates = (message: string): TaskUpdate | null => {
  const updates = extractMultipleTaskUpdates(message);
  return updates.length > 0 ? updates[0] : null;
};

// Function to extract task information from AI's formatted response
export const extractFromAIResponse = (response: string): TaskUpdate[] => {
  const updates: TaskUpdate[] = [];
  
  // Timeline extraction from AI response - handle various markdown formats
  const timelinePatterns = [
    /\*\*Timeline:\*\*\s*([^*\n]+)/i,
    /\*\*Timeline\*\*:\s*([^*\n]+)/i,
    /Timeline:\s*([^*\n]+)/i,
    /Timeline\s*:\s*([^*\n]+)/i,
  ];
  
  for (const pattern of timelinePatterns) {
    const match = response.match(pattern);
    if (match) {
      updates.push({
        type: 'timeline',
        details: match[1].trim(),
        taskId: '1-1',
        phaseId: '1'
      });
      break;
    }
  }
  
  // Location extraction from AI response
  const locationPatterns = [
    /\*\*Location:\*\*\s*([^*\n]+)/i,
    /\*\*Location\*\*:\s*([^*\n]+)/i,
    /Location:\s*([^*\n]+)/i,
    /Location\s*:\s*([^*\n]+)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = response.match(pattern);
    if (match) {
      updates.push({
        type: 'location',
        details: match[1].trim(),
        taskId: '1-3',
        phaseId: '1'
      });
      break;
    }
  }
  
  // Theme extraction from AI response
  const themePatterns = [
    /\*\*Theme:\*\*\s*([^*\n]+)/i,
    /\*\*Theme\*\*:\s*([^*\n]+)/i,
    /Theme:\s*([^*\n]+)/i,
    /Theme\s*:\s*([^*\n]+)/i,
  ];
  
  for (const pattern of themePatterns) {
    const match = response.match(pattern);
    if (match) {
      updates.push({
        type: 'theme',
        details: match[1].trim(),
        taskId: '1-2',
        phaseId: '1'
      });
      break;
    }
  }
  
  // Size extraction from AI response
  const sizePatterns = [
    /\*\*Size:\*\*\s*([^*\n]+)/i,
    /\*\*Size\*\*:\s*([^*\n]+)/i,
    /Size:\s*([^*\n]+)/i,
    /Size\s*:\s*([^*\n]+)/i,
  ];
  
  for (const pattern of sizePatterns) {
    const match = response.match(pattern);
    if (match) {
      updates.push({
        type: 'size',
        details: match[1].trim(),
        taskId: '1-4',
        phaseId: '1'
      });
      break;
    }
  }
  
  // Branding extraction from AI response
  const brandingPatterns = [
    /\*\*Branding:\*\*\s*([^*\n]+)/i,
    /\*\*Branding\*\*:\s*([^*\n]+)/i,
    /Branding:\s*([^*\n]+)/i,
    /Branding\s*:\s*([^*\n]+)/i,
  ];
  
  for (const pattern of brandingPatterns) {
    const match = response.match(pattern);
    if (match) {
      // Look for hex colors in the branding details
      const hexColorPattern = /#[0-9A-Fa-f]{6}/g;
      const hexColors = match[1].match(hexColorPattern);
      
      if (hexColors && hexColors.length >= 2) {
        updates.push({
          type: 'branding',
          details: match[1].trim(),
          taskId: '1-5',
          phaseId: '1',
          colors: {
            primary: hexColors[0],
            secondary: hexColors[1]
          }
        });
      } else if (hexColors && hexColors.length === 1) {
        updates.push({
          type: 'branding',
          details: match[1].trim(),
          taskId: '1-5',
          phaseId: '1',
          colors: {
            primary: hexColors[0],
            secondary: '#10B981'
          }
        });
      }
      break;
    }
  }
  
  return updates;
};

export const sendMessage = async (message: string): Promise<{ response: string; taskUpdates: TaskUpdate[] }> => {
  if (!API_KEY) {
    return {
      response: 'Error: API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      taskUpdates: []
    };
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
    
    // Extract task updates from the AI's formatted response
    const taskUpdates = extractFromAIResponse(responseText);
    
    return { response: responseText, taskUpdates };
  } catch (error) {
    console.error('Detailed error sending message to Gemini:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('401')) {
        return {
          response: 'Error: Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.',
          taskUpdates: []
        };
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        return {
          response: 'Error: API quota exceeded. Please check your Google AI Studio usage.',
          taskUpdates: []
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          response: 'Error: Network issue. Please check your internet connection.',
          taskUpdates: []
        };
      } else if (error.message.includes('404') || error.message.includes('model')) {
        return {
          response: 'Error: Model not found. Please check if the model name is correct.',
          taskUpdates: []
        };
      }
    }
    
    return {
      response: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      taskUpdates: []
    };
  }
};

export const resetChat = () => {
  conversationHistory = [
    {
      role: 'user',
      parts: 'You are a helpful project assistant. You can help with task management, calendar events, and workflow automation. Be concise and friendly in your responses. When users mention timeline, location, theme, or size information, you should extract that information and provide it in a structured format with clear labels like **Timeline:**, **Location:**, **Theme:**, and **Size:**. Always format your responses with these labels when you detect relevant information.'
    },
    {
      role: 'model',
      parts: 'Hello! I\'m your project assistant. I can help you manage tasks, create calendar events, and automate your workflow. I\'ll be concise and friendly in my responses. When you provide timeline, location, theme, or size information, I\'ll format it clearly with labels like **Timeline:**, **Location:**, **Theme:**, and **Size:** so it can be automatically processed. How can I help you today?'
    }
  ];
  console.log('Chat reset successfully');
};

export const sendMessageWithFiles = async (
  message: string,
  files: FileList
): Promise<{ response: string; taskUpdates: TaskUpdate[] }> => {
  if (!API_KEY) {
    return {
      response: 'Error: API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      taskUpdates: []
    };
  }

  try {
    // Upload all files and collect their metadata
    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Upload file to Gemini
      const uploaded = await ai.files.upload({
        file,
        config: { mimeType: file.type },
      });
      uploadedFiles.push(uploaded);
    }

    // Prepare multimodal prompt: files first, then message
    const fileParts = uploadedFiles.map(f => createPartFromUri(f.uri, f.mimeType));
    const contents = createUserContent([
      ...fileParts,
      message,
    ]);

    // Add to conversation history for context
    conversationHistory.push({ role: 'user', parts: `[FILE UPLOAD] ${message}` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [contents],
    });

    const responseText = response.text;
    conversationHistory.push({ role: 'model', parts: responseText });
    const taskUpdates = extractFromAIResponse(responseText);
    return { response: responseText, taskUpdates };
  } catch (error) {
    console.error('Error sending multimodal message to Gemini:', error);
    return {
      response: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      taskUpdates: []
    };
  }
};

export async function generateMarketingImages({ prompt, n }: { prompt: string; n: number }): Promise<{ url: string }[]> {
  // Use Gemini API for image generation
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + apiKey;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  // Assume the API returns an array of image URLs in data.images
  // If the API returns a different structure, adjust accordingly
  if (data && data.images && Array.isArray(data.images)) {
    return data.images.slice(0, n).map((url: string) => ({ url }));
  }
  // Fallback: try to extract from candidates/parts if that's the structure
  if (data && data.candidates && data.candidates[0]?.content?.parts) {
    const urls = data.candidates[0].content.parts
      .filter((p: any) => p.inline_data && p.inline_data.mime_type && p.inline_data.mime_type.startsWith('image/'))
      .map((p: any) => `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`);
    return urls.slice(0, n).map((url: string) => ({ url }));
  }
  throw new Error('No images returned from Gemini API');
}

export const initializeLettaAgent = async () => {
  if (agentId) return agentId;
  // Create a new agent if not already created
  const agent = await lettaClient.agents.create({
    model: 'openai/gpt-4.1',
    embedding: 'openai/text-embedding-3-small',
    memory_blocks: [
      { label: 'persona', value: 'You are a helpful project assistant for project management.' }
    ],
    tools: [],
  });
  agentId = agent.id;
  return agentId;
};

export const sendLettaMessage = async (message: string) => {
  if (!agentId) {
    await initializeLettaAgent();
  }
  const response = await lettaClient.agents.messages.create({
    agent_id: agentId!,
    messages: [
      { role: 'user', content: message }
    ]
  });
  // Find the assistant's reply
  const assistantMsg = response.messages.find((msg: any) => msg.message_type === 'assistant_message');
  return assistantMsg ? assistantMsg.content : '';
};

export const getLettaMemory = async () => {
  if (!agentId) {
    await initializeLettaAgent();
  }
  // Retrieve the agent's conversation history
  const history = await lettaClient.agents.messages.list({ agent_id: agentId! });
  return history.messages;
}; 