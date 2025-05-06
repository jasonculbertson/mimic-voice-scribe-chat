
// This file defines the endpoints for our serverless functions

// Base URL for all API proxy endpoints
// In production, this should point to your permanent domain (e.g., your-app.vercel.app/api)
// rather than a deployment-specific URL which changes with each deployment
const BASE_URL = import.meta.env.VITE_API_PROXY_URL || '/api';

export const API_ENDPOINTS = {
  GPT: `${BASE_URL}/gpt`,
  CLAUDE: `${BASE_URL}/claude`,
  GEMINI: `${BASE_URL}/gemini`
};

// Type for streaming responses
export interface StreamChunk {
  content: string;
  done: boolean;
}

// Default timeout for fetch requests in milliseconds
const DEFAULT_TIMEOUT = 30000; // Increased timeout for real API calls

/**
 * Creates a fetch request with a timeout
 */
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Flag to determine if we should use mock data (set to false to prioritize real APIs)
let useMockData = false;

// Function to handle streaming API responses
export async function fetchStreamingResponse(
  endpoint: string,
  payload: any,
  onChunk: (chunk: StreamChunk) => void
): Promise<string> {
  try {
    console.log(`Making request to: ${endpoint}`);
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, DEFAULT_TIMEOUT);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} - ${errorText}`);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onChunk({ content: fullResponse, done: true });
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      try {
        // Handle each line as a separate JSON object
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line);
            fullResponse = data.content || fullResponse;
            onChunk({ content: fullResponse, done: data.done || false });
            
            if (data.done) break;
          }
        }
      } catch (e) {
        // If JSON parsing fails, treat it as a text chunk
        fullResponse += chunk;
        onChunk({ content: fullResponse, done: false });
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error in streaming request:', error);
    
    // If error is due to network or CORS, switch to mock data
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Failed to fetch. This could indicate a CORS issue, network problem, or incorrect API endpoint URL.');
      console.error(`Attempted to connect to: ${endpoint}`);
      
      // After failures, switch to mock data
      useMockData = true;
      console.log('Switching to mock data mode due to API availability issues');
      
      // Use mock data instead
      return simulateMockResponse(payload.prompt, payload.round, payload.systemPrompt, onChunk);
    }
    
    const errorMessage = error instanceof Error 
      ? `Error: ${error.message}` 
      : `Error: ${String(error)}`;
    
    onChunk({ 
      content: errorMessage,
      done: true 
    });
    return errorMessage;
  }
}

/**
 * Simulates a streaming response with mock data when APIs are not available
 */
async function simulateMockResponse(
  prompt: string, 
  round: number,
  systemPrompt: string,
  onChunk: (chunk: StreamChunk) => void
): Promise<string> {
  // Generate a response based on the prompt
  const modelType = systemPrompt.toLowerCase().includes('gpt') ? 'gpt' : 
                   systemPrompt.toLowerCase().includes('claude') ? 'claude' : 'gemini';
                   
  const mockResponses: Record<string, Record<number, string>> = {
    gpt: {
      1: `GPT-4 Round 1: This is a simulated response to "${prompt}". The server API endpoints are currently unavailable, so I'm showing you how the interface works with mock data. In a production environment, this would be powered by OpenAI's GPT-4 model.`,
      2: `GPT-4 Round 2: After reviewing Claude and Gemini's responses, I'd like to refine my thoughts. This is still a mock response since the API endpoints are unavailable. In production, this would show GPT-4's refined answer that incorporates insights from other models.`
    },
    claude: {
      1: `Claude Round 1: Here is Claude's simulated response to "${prompt}". I'm demonstrating the interface with mock data since the API endpoints are currently unavailable. In production, this would be powered by Anthropic's Claude model.`,
      2: `Claude Round 2: Building on what GPT-4 and Gemini shared, let me refine my thoughts. This is a simulated response with mock data. In production, Claude would provide unique insights that complement the other models.`
    },
    gemini: {
      1: `Gemini Round 1: This is Gemini's simulated response to "${prompt}". Since the API endpoints are unavailable, I'm showing mock data to demonstrate the interface. In production, this would show Google's Gemini model response.`,
      2: `Gemini Final Answer: After reviewing all perspectives, here's a synthesis of the discussion. This is mock data since the API endpoints are unavailable. In production, Gemini would synthesize insights from all three models to provide a comprehensive final answer.`
    }
  };

  const mockResponse = mockResponses[modelType][round] || 
    `Mock response for ${modelType} round ${round}: This is a simulated response to "${prompt}".`;

  // Simulate streaming by sending the response chunk by chunk
  let currentResponse = '';
  const words = mockResponse.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Delay between words
    currentResponse += (i > 0 ? ' ' : '') + words[i];
    onChunk({ content: currentResponse, done: i === words.length - 1 });
  }
  
  return mockResponse;
}
