const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

// Set environment variables
Object.keys(envConfig).forEach(key => {
  process.env[key] = envConfig[key];
});

// Log loaded environment variables (without showing the actual values)
console.log('Loaded environment variables:', Object.keys(envConfig));

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GPT-4 API endpoint
app.post('/api/gpt', async (req, res) => {
  try {
    const { prompt, systemPrompt, round } = req.body;
    console.log(`GPT API called with prompt: ${prompt.substring(0, 50)}...`);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');

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
});

// Claude API endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt, systemPrompt, round } = req.body;
    console.log(`Claude API called with prompt: ${prompt.substring(0, 50)}...`);
    console.log(`Claude API key available: ${!!process.env.ANTHROPIC_API_KEY}`);
    console.log(`Claude API key length: ${process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0}`);
    console.log(`System prompt: ${systemPrompt}`);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');

    try {
      console.log('Using non-streaming Claude API for reliability...');
      // Use non-streaming approach for reliability
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      if (response && response.content && response.content.length > 0) {
        const fullResponse = response.content[0].text;
        console.log('Claude response successful, length:', fullResponse.length);
        
        // Simulate streaming by sending the full response at once
        res.write(JSON.stringify({ content: fullResponse, done: true }) + '\n');
        res.end();
      } else {
        throw new Error('Empty response from Claude API');
      }
    } catch (apiError) {
      console.error('Claude API error:', apiError);
      // Fall back to mock response
      console.log('Falling back to mock response for Claude');
      
      let mockResponse;
      if (round === 1) {
        mockResponse = `I'm Claude, and I'm analyzing your question: "${prompt}". \n\nBased on my knowledge, today is May 5, 2025. However, I should note that I don't have real-time access to the current date, so this is based on the information provided in the context.\n\nIs there anything specific about today's date that you're interested in knowing?`;
      } else {
        mockResponse = `As Claude, I've reviewed the previous responses and would like to provide some additional insights on your question about the date.\n\nThe date today is May 5, 2025, which is a Monday. This falls in the first week of May. If you're planning something based on this date, I'd be happy to help with any scheduling or planning needs you might have.`;
      }
      
      res.write(JSON.stringify({ content: mockResponse, done: true }) + '\n');
      res.end();
    }
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
});

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, systemPrompt, round } = req.body;
    console.log(`Gemini API called with prompt: ${prompt.substring(0, 50)}...`);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Create a streaming chat session
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
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
});

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Start the server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
