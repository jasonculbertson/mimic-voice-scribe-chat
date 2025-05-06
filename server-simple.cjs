const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/json');

    // Create a streaming message
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
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
