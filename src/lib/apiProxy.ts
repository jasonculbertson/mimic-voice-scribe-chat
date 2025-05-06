// This file defines the endpoints for our serverless functions
// Replace these with your actual deployed serverless function URLs when deployed

// Base URL for all API proxy endpoints
// In production, this would be your deployed serverless functions URL
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

// Function to handle streaming API responses
export async function fetchStreamingResponse(
  endpoint: string,
  payload: any,
  onChunk: (chunk: StreamChunk) => void
): Promise<string> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
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
    onChunk({ 
      content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      done: true 
    });
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
