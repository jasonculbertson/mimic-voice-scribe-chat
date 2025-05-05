// This is a mock service that simulates the AI Boardroom functionality
// In a real implementation, this would make actual API calls to OpenAI, Anthropic, and Google

// Simulated delay for responses
const RESPONSE_DELAY = 1000;

// Mock responses for each AI model
const mockResponses = {
  gpt4: (prompt: string) => `**GPT-4 Response**\n\nHere's my strategic analysis of your question about "${prompt}":\n\n• The key strategic consideration is understanding the core objectives and constraints\n• Based on best practices, I recommend a phased approach to implementation\n• Consider measuring success through both quantitative and qualitative metrics\n\nThis approach balances short-term gains with long-term strategic positioning.`,
  
  claude: (prompt: string) => `**Claude's Perspective**\n\nLooking at "${prompt}" from a different angle:\n\n• While conventional wisdom suggests a direct approach, I recommend considering alternative frameworks\n• The most overlooked factor is typically the human element - how stakeholders will respond emotionally\n• A contrarian but valuable approach would be to start with small experiments rather than a comprehensive plan\n\nThis perspective complements traditional strategic thinking by incorporating adaptive learning.`,
  
  gemini: (prompt: string) => `🔑 **Key Takeaways**\n• Combine strategic planning with adaptive implementation\n• Balance stakeholder needs with technical feasibility\n• Measure both process and outcome metrics\n\n🧠 **Best Advice**\n• Start with small, high-impact experiments\n• Create feedback loops for continuous learning\n• Build coalitions of support across different stakeholder groups\n\n💡 **Final Insight**\n\nSuccess with "${prompt}" requires both analytical rigor and emotional intelligence - plan carefully but adapt quickly based on real-world feedback.`,
  
  gpt4Round2: (prompt: string) => `**GPT-4 Round 2 Analysis**\n\nBuilding on the previous insights about "${prompt}", I'd like to refine the recommendations:\n\n• The synthesis correctly identifies the need for both planning and adaptation, but should emphasize decision criteria for when to pivot\n• A critical missing element is competitive analysis - understanding how others have approached similar challenges\n• The advice on experiments could be more specific: start with 2-3 well-defined tests that can be completed within 2-4 weeks\n\nThese refinements make the strategy more immediately actionable while maintaining the balanced approach.`,
  
  claudeRound2: (prompt: string) => `**Claude's Round 2 Perspective**\n\nAfter reviewing the previous responses about "${prompt}", I'd add these important considerations:\n\n• The discussion of metrics should distinguish between leading indicators (which predict success) and lagging indicators (which confirm it)\n• A practical framework for stakeholder management would strengthen the implementation plan\n• The "small experiments" approach is sound, but needs a clear decision tree for scaling successful tests\n\nWith these additions, the strategy becomes more robust and implementation-ready.`,
  
  geminiRound2: (prompt: string) => `🔑 **FINAL ANSWER**\n• Approach "${prompt}" with a dual mindset: strategic vision paired with tactical experimentation\n• Build a stakeholder influence map to identify champions, resistors, and key decision-makers\n• Establish both leading indicators (predictive) and lagging indicators (confirmatory) for measuring progress\n\n💡 **ACTIONABLE STEPS**\n1. Define 2-3 specific experiments to test core assumptions within the next 30 days\n2. Create a decision tree with clear criteria for scaling, pivoting, or abandoning approaches\n3. Develop a communication strategy tailored to different stakeholder groups\n4. Implement regular review cycles that examine both data and qualitative feedback\n\nThis comprehensive approach combines analytical rigor with practical implementation steps, balancing short-term action with long-term strategic positioning.`
};

// Simulate the streaming API response
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
    // Simulate GPT-4 response
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
    callbacks.onGPT4Response(mockResponses.gpt4(prompt));
    
    // Simulate Claude response
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
    callbacks.onClaudeResponse(mockResponses.claude(prompt));
    
    // Simulate Gemini response
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
    callbacks.onGeminiResponse(mockResponses.gemini(prompt));
    
    // Simulate Round 2 responses
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY * 1.5));
    callbacks.onGPT4Round2Response(mockResponses.gpt4Round2(prompt));
    
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
    callbacks.onClaudeRound2Response(mockResponses.claudeRound2(prompt));
    
    await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY));
    callbacks.onGeminiRound2Response(mockResponses.geminiRound2(prompt));
    
  } catch (error) {
    callbacks.onError(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// In a real implementation, this would be replaced with actual API calls
// to OpenAI, Anthropic, and Google AI services
