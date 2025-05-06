import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Initialize Google Generative AI client with API key from environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Create a streaming chat session
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });

    // Prepare the full prompt with system instructions
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    // Create a streaming response
    const result = await chat.sendMessageStream(fullPrompt);
    const stream = result.stream;

    let fullResponse = '';

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.text();
      fullResponse += content;
      
      // Send the chunk to the client
      res.write(JSON.stringify({ content: fullResponse, done: false }) + '\n');
    }

    // Send the final response
    res.write(JSON.stringify({ content: fullResponse, done: true }) + '\n');
    res.end();
  } catch (error) {
    console.error('Error in Gemini API:', error);
    
    // If headers have already been sent, we need to end the response
    if (res.headersSent) {
      res.write(JSON.stringify({ error: error.message, done: true }) + '\n');
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
