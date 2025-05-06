import OpenAI from 'openai';

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

    // Initialize OpenAI client with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Create a streaming chat completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    });

    let fullResponse = '';

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      
      // Send the chunk to the client
      res.write(JSON.stringify({ content: fullResponse, done: false }) + '\n');
    }

    // Send the final response
    res.write(JSON.stringify({ content: fullResponse, done: true }) + '\n');
    res.end();
  } catch (error) {
    console.error('Error in GPT API:', error);
    
    // If headers have already been sent, we need to end the response
    if (res.headersSent) {
      res.write(JSON.stringify({ error: error.message, done: true }) + '\n');
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
