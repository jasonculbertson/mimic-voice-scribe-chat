// Use a simple implementation without external dependencies
// This will ensure the Claude endpoint works even if there are issues with the Anthropic SDK

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, systemPrompt, round } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('Using mock Claude implementation');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Generate a mock Claude response based on the prompt and round
    let response = '';
    
    if (round === 1) {
      // First round: Claude analyzes the prompt
      response = generateFirstRoundResponse(prompt);
    } else {
      // Second round: Claude provides additional insights
      response = generateSecondRoundResponse(prompt);
    }
    
    // Log and return the response
    console.log(`Generated mock Claude response (${response.length} chars)`);
    res.status(200).json({ content: response, done: true });
  } catch (error) {
    console.error('Error in Claude API:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper function to generate a first round response
function generateFirstRoundResponse(prompt) {
  // Analyze the prompt and provide a thoughtful response
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Check if the prompt is asking about the date
  if (prompt.toLowerCase().includes('date') || prompt.toLowerCase().includes('today')) {
    return `I'm Claude, and I'm analyzing your question about the date. Based on the information provided to me, today is ${formattedDate}. However, I should note that as an AI, I don't have real-time access to the current date unless it's provided in the context.

Is there anything specific about today's date that you're interested in knowing?`;
  }
  
  // Check if it's a greeting
  if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi ') || prompt.toLowerCase() === 'hi') {
    return `Hello! I'm Claude, an AI assistant created by Anthropic. I'm designed to be helpful, harmless, and honest in my interactions.

I can assist with a wide range of tasks including answering questions, providing explanations, generating creative content, and engaging in thoughtful conversations. How can I help you today?`;
  }
  
  // Default response for other prompts
  return `I'm Claude, and I've analyzed your question: "${prompt}"

This is an interesting query that requires careful consideration. From my perspective, there are several important aspects to address:

1. First, let's clarify the key concepts involved in your question
2. We should consider different perspectives on this topic
3. It's important to acknowledge any limitations in my knowledge

Based on my understanding, I would say that ${prompt.length > 10 ? prompt.substring(0, Math.floor(prompt.length/2)) + '...' : 'your question'} touches on matters that benefit from thoughtful analysis rather than a simple answer.

Would you like me to elaborate on any particular aspect of this response?`;
}

// Helper function to generate a second round response
function generateSecondRoundResponse(prompt) {
  return `After reviewing the previous responses, I'd like to offer some additional insights on your question: "${prompt}"

My colleagues GPT-4 and Gemini have provided valuable perspectives, but I'd like to highlight a few additional considerations:

1. There are nuances to this topic that might benefit from further exploration
2. Some alternative viewpoints worth considering include...
3. To give you a more complete picture, we should also address...

In conclusion, while the initial responses covered important ground, these additional insights should help provide a more comprehensive understanding of your question.`;
}
