
import { API_ENDPOINTS, fetchStreamingResponse } from './apiProxy';
import { useToast } from "@/hooks/use-toast";

export type AIModel = 'gpt' | 'claude' | 'gemini';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: AIModel;
  pending?: boolean;
  round?: number;
}

// Function to generate a response from GPT-4 with streaming
const generateGPTResponse = async (
  prompt: string, 
  round: number,
  onChunk: (chunk: string, done: boolean) => void
) => {
  try {
    let systemPrompt = '';
    if (round === 1) {
      systemPrompt = `You are GPT-4, an advanced AI assistant. Analyze the user's question and provide a thoughtful, direct response. Be clear, concise, and accurate. If asked about facts like dates, time, or specific information, provide the factual answer without strategic analysis.`;
    } else {
      systemPrompt = `You are GPT-4, an advanced AI assistant. You've already provided an initial response to the user's question. Now, you've seen responses from Claude and Gemini on the same topic. Refine your original answer by incorporating valuable insights from their perspectives. Be direct and factual, especially for questions about dates, time, or specific information.`;
    }

    return await fetchStreamingResponse(
      API_ENDPOINTS.GPT,
      { 
        prompt, 
        systemPrompt,
        round 
      },
      ({ content, done }) => onChunk(content, done)
    );
  } catch (error) {
    console.error('Error generating GPT response:', error);
    onChunk('Error generating response from GPT-4. Please try again.', true);
    return 'Error generating response from GPT-4. Please try again.';
  }
};

// Function to generate a response from Claude with streaming
const generateClaudeResponse = async (
  prompt: string, 
  round: number,
  onChunk: (chunk: string, done: boolean) => void
) => {
  try {
    let systemPrompt = '';
    if (round === 1) {
      systemPrompt = `You are Claude, an AI assistant by Anthropic. Analyze the user's question and provide a direct, factual response. Be clear, concise, and accurate. If asked about facts like dates, time, or specific information, provide the factual answer without unnecessary analysis.`;
    } else {
      systemPrompt = `You are Claude, an AI assistant by Anthropic. You've already provided an initial response to the user's question. Now, you've seen responses from GPT-4 and Gemini on the same topic. Refine your original answer by incorporating valuable insights from their perspectives while maintaining your unique viewpoint. Be direct and factual, especially for questions about dates, time, or specific information.`;
    }

    return await fetchStreamingResponse(
      API_ENDPOINTS.CLAUDE,
      { 
        prompt, 
        systemPrompt,
        round 
      },
      ({ content, done }) => onChunk(content, done)
    );
  } catch (error) {
    console.error('Error generating Claude response:', error);
    onChunk('Error generating response from Claude. Please try again.', true);
    return 'Error generating response from Claude. Please try again.';
  }
};

// Function to generate a response from Gemini with streaming
const generateGeminiResponse = async (
  prompt: string, 
  round: number,
  onChunk: (chunk: string, done: boolean) => void
) => {
  try {
    let systemPrompt = '';
    if (round === 1) {
      systemPrompt = `You are Gemini, Google's advanced AI model. Analyze the user's question and provide a direct, factual response. Be clear, concise, and accurate. If asked about facts like dates, time, or specific information, provide the factual answer without unnecessary analysis.`;
    } else {
      systemPrompt = `You are Gemini, Google's advanced AI model. You've already provided an initial response to the user's question. Now, you've seen responses from GPT-4 and Claude on the same topic. Your task is to synthesize all three perspectives (including your own) into a comprehensive final response. Be direct and factual, especially for questions about dates, time, or specific information.`;
    }

    return await fetchStreamingResponse(
      API_ENDPOINTS.GEMINI,
      { 
        prompt, 
        systemPrompt,
        round 
      },
      ({ content, done }) => onChunk(content, done)
    );
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    onChunk('Error generating response from Gemini. Please try again.', true);
    return 'Error generating response from Gemini. Please try again.';
  }
};

// Function to handle the AI Boardroom process with real API calls and streaming
export const processAIBoardroom = async (
  prompt: string,
  onUpdate: (model: AIModel, content: string, round: number, done: boolean) => void
) => {
  try {
    // Round 1: Initial responses from each model
    const models: AIModel[] = ['gpt', 'claude', 'gemini'];
    
    // Process each model sequentially
    for (const model of models) {
      if (model === 'gpt') {
        await generateGPTResponse(prompt, 1, (content, done) => {
          onUpdate('gpt', content, 1, done);
        });
      } else if (model === 'claude') {
        await generateClaudeResponse(prompt, 1, (content, done) => {
          onUpdate('claude', content, 1, done);
        });
      } else if (model === 'gemini') {
        await generateGeminiResponse(prompt, 1, (content, done) => {
          onUpdate('gemini', content, 1, done);
        });
      }
    }
    
    // Round 2: Refined responses based on all models' inputs
    for (const model of models) {
      if (model === 'gpt') {
        await generateGPTResponse(prompt, 2, (content, done) => {
          onUpdate('gpt', content, 2, done);
        });
      } else if (model === 'claude') {
        await generateClaudeResponse(prompt, 2, (content, done) => {
          onUpdate('claude', content, 2, done);
        });
      } else if (model === 'gemini') {
        await generateGeminiResponse(prompt, 2, (content, done) => {
          onUpdate('gemini', content, 2, done);
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in AI Boardroom process:', error);
    return false;
  }
};

// For backward compatibility
export async function fetchAIBoardroomResponses(prompt: string, callbacks: {
  onGPT4Response: (response: string) => void;
  onClaudeResponse: (response: string) => void;
  onGeminiResponse: (response: string) => void;
  onGPT4Round2Response: (response: string) => void;
  onClaudeRound2Response: (response: string) => void;
  onGeminiRound2Response: (response: string) => void;
  onError: (error: string) => void;
}) {
  try {
    // Use the real implementation but map to the old callback interface
    await processAIBoardroom(prompt, (model, content, round, done) => {
      if (!done) return; // Only call callbacks when content is complete
      
      if (model === 'gpt' && round === 1) {
        callbacks.onGPT4Response(content);
      } else if (model === 'claude' && round === 1) {
        callbacks.onClaudeResponse(content);
      } else if (model === 'gemini' && round === 1) {
        callbacks.onGeminiResponse(content);
      } else if (model === 'gpt' && round === 2) {
        callbacks.onGPT4Round2Response(content);
      } else if (model === 'claude' && round === 2) {
        callbacks.onClaudeRound2Response(content);
      } else if (model === 'gemini' && round === 2) {
        callbacks.onGeminiRound2Response(content);
      }
    });
  } catch (error) {
    callbacks.onError(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
