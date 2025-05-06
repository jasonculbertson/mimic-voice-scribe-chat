import { Anthropic } from '@anthropic-ai/sdk';

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

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      res.status(500).json({ error: 'API key not configured' });
      return;
    }
    
    console.log(`Claude API key available: ${!!process.env.ANTHROPIC_API_KEY}`);
    console.log(`Claude API key length: ${process.env.ANTHROPIC_API_KEY.length}`);
    console.log(`Claude API key prefix: ${process.env.ANTHROPIC_API_KEY.substring(0, 7)}`);

    // Initialize Anthropic client with API key from environment variable
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Verify the client was initialized correctly
    if (!anthropic || !anthropic.messages) {
      console.error('Failed to initialize Anthropic client');
      res.status(500).json({ error: 'Failed to initialize API client' });
      return;
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Try a non-streaming request first to test if the API is working
    try {
      console.log('Testing Claude API with non-streaming request...');
      const testResponse = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        temperature: 0.7,
        system: 'You are a helpful assistant.',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      });
      console.log('Claude API test successful');
    } catch (testError) {
      console.error('Claude API test failed:', testError);
      res.status(500).json({ error: `Claude API test failed: ${testError.message}` });
      return;
    }
    
    // Create a streaming message
    const stream = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true
    });

    let fullResponse = '';

    // Stream the response
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text') {
        const content = chunk.delta.text || '';
        fullResponse += content;
        
        // Send the chunk to the client
        res.write(JSON.stringify({ content: fullResponse, done: false }) + '\n');
      }
    }

    // Send the final response
    res.write(JSON.stringify({ content: fullResponse, done: true }) + '\n');
    res.end();
  } catch (error) {
    console.error('Error in Claude API:', error);
    
    // If headers have already been sent, we need to end the response
    if (res.headersSent) {
      res.write(JSON.stringify({ error: error.message, done: true }) + '\n');
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
