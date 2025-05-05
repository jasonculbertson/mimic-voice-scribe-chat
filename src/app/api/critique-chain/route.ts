import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Create a custom response stream
export async function POST(request: NextRequest) {
  // Create a TransformStream for sending progressive updates
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  processRequest(request, writer).catch((error) => {
    console.error('Unhandled error in processRequest:', error);
    writer.write(encoder.encode(JSON.stringify({ error: 'Internal server error' })));
    writer.close();
  });

  // Return the stream immediately
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function processRequest(request: NextRequest, writer: WritableStreamDefaultWriter<Uint8Array>) {
  const encoder = new TextEncoder();
  
  try {
    console.log('API route called with request:', request.url);
    
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    if (!prompt) {
      console.log('Error: Prompt is required');
      writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Prompt is required' })}

`));
      writer.close();
      return;
    }
    
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Present (starts with ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)' : 'Missing');
    console.log('Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Present (starts with ' + process.env.ANTHROPIC_API_KEY.substring(0, 5) + '...)' : 'Missing');
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present (starts with ' + process.env.GEMINI_API_KEY.substring(0, 5) + '...)' : 'Missing');

    // Initialize variables for all three outputs
    let gpt4Output = '';
    let claudeOutput = '';
    let geminiOutput = '';

    // Step 1: Get GPT-4 response
    console.log('Starting GPT-4o API call...');
    try {
      const gpt4Response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are The Strategist, the first advisor in a 3-part expert panel. Provide direct, clear, and concise answers without unnecessary elaboration.' },
          { role: 'user', content: `You are The Strategist, the first advisor in a 3-part expert panel.

Answer the following question directly and concisely:
**${prompt}**

Guidelines:
• Be straightforward and to the point
• Use simple, clear language
• Organize information with bullet points when appropriate
• Provide practical, actionable advice
• Avoid unnecessary background information unless directly relevant
• Keep responses brief but complete
• Focus on the most important information first` }
        ],
        temperature: 0.7,
      });
      console.log('GPT-4o API call successful');
      gpt4Output = gpt4Response.choices[0]?.message.content || 'No response from GPT-4';
      console.log('GPT-4o output length:', gpt4Output.length);
      
      // Send GPT-4 response immediately
      writer.write(encoder.encode(`data: ${JSON.stringify({ step: 'gpt4', data: { gpt4: gpt4Output } })}

`));
      
    } catch (error) {
      console.error('Error in GPT-4o API call:', error);
      gpt4Output = 'Error getting response from GPT-4o: ' + (error instanceof Error ? error.message : String(error));
      
      // Send error response and close the stream
      writer.write(encoder.encode(`data: ${JSON.stringify({ 
        step: 'error', 
        data: {
          gpt4: gpt4Output,
          claude: 'Could not get critique due to error in initial response',
          gemini: 'Could not get final answer due to error in previous steps'
        }
      })}

`));
      writer.close();
      return;
    }

    // Step 2: Get Claude critique
    console.log('Starting Claude API call...');
    try {
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        system: 'You are The Challenger, the second advisor in a 3-part expert panel. Provide your own direct answer to the question.',
        messages: [
          {
            role: 'user',
            content: `You are The Challenger, the second advisor in a 3-part expert panel. The first advisor has already provided their perspective on this question.

Now, answer the same question directly and concisely with your own unique perspective:
**${prompt}**

Guidelines:
• Be straightforward and to the point
• Provide a perspective that might differ from conventional thinking
• Focus on practical, actionable advice
• Keep your response brief but complete`
          }
        ],
      });
      console.log('Claude API call successful');
      // Anthropic API returns content as an array of blocks, each with a type and value
      claudeOutput = claudeResponse.content[0]?.type === 'text' ? claudeResponse.content[0].text : 'No response from Claude';
      console.log('Claude output length:', claudeOutput.length);
      
      // Send Claude response immediately
      writer.write(encoder.encode(`data: ${JSON.stringify({ step: 'claude', data: { gpt4: gpt4Output, claude: claudeOutput } })}

`));
      
    } catch (error) {
      console.error('Error in Claude API call:', error);
      claudeOutput = 'Error getting critique from Claude: ' + (error instanceof Error ? error.message : String(error));
      
      // Send error response but continue with Gemini
      writer.write(encoder.encode(`data: ${JSON.stringify({ 
        step: 'claude-error', 
        data: {
          gpt4: gpt4Output,
          claude: claudeOutput,
          gemini: 'Processing...'
        }
      })}

`));
    }

    // Step 3: Get Gemini synthesis
    console.log('Starting Gemini API call...');
    try {
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const geminiPrompt = `You are The Synthesizer, the final advisor in a 3-part expert panel. Your job is to synthesize:

1. First perspective (GPT-4): ${gpt4Output}
2. Second perspective (Claude): ${claudeOutput}

Now, answer the same question: **${prompt}**

Synthesize the best insights from both perspectives and add your own unique value. Format your response as:

🔑 **Key Takeaways** (2-3 most important points)
🧠 **Best Advice** (most practical, actionable recommendations)
💡 **Final Insight** (one powerful conclusion)

Be concise, clear, and direct.`;
      
      const geminiResponse = await geminiModel.generateContent(geminiPrompt);
      console.log('Gemini API call successful');
      
      // Extract text from Gemini response
      geminiOutput = 'No response from Gemini';
      
      // Different versions of the Gemini API may have different response structures
      if (geminiResponse && geminiResponse.response) {
        if (typeof geminiResponse.response.text === 'function') {
          geminiOutput = geminiResponse.response.text() || geminiOutput;
        } else if (geminiResponse.response.candidates && geminiResponse.response.candidates[0]?.content?.parts) {
          const parts = geminiResponse.response.candidates[0].content.parts;
          if (parts.length > 0 && typeof parts[0].text === 'string') {
            geminiOutput = parts[0].text;
          }
        } else {
          // Fallback to string representation
          geminiOutput = String(geminiResponse.response) || geminiOutput;
        }
        console.log('Gemini output length:', geminiOutput.length);
      }
      
      // Send first round Gemini response
      writer.write(encoder.encode(`data: ${JSON.stringify({ 
        step: 'gemini', 
        data: {
          gpt4: gpt4Output,
          claude: claudeOutput,
          gemini: geminiOutput
        }
      })}

`));
      
      // Start Round 2: GPT-4 Reflection
      console.log('Starting Round 2: GPT-4 Reflection...');
      let gpt4Round2Output = '';
      let claudeRound2Output = '';
      let geminiRound2Output = '';
      
      try {
        // Step 4: Get GPT-4 reflection on all three initial responses
        const gpt4Round2Response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: 'You are The Strategist in Round 2 of the AI Boardroom. Your job is to analyze and improve upon the first round\'s final answer.' 
            },
            { 
              role: 'user', 
              content: `You are The Strategist in Round 2 of the AI Boardroom. Review Gemini's synthesized answer from Round 1 and improve upon it.

Original question: **${prompt}**

Gemini's synthesized answer from Round 1:
${geminiOutput}

Your task: Analyze this answer and provide improvements by addressing:
1. Any inaccuracies or logical flaws
2. Important missing information or perspectives
3. Areas where the advice could be more practical or actionable

Provide your improved answer directly and concisely. Focus on making the response more valuable, not just critiquing it.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        gpt4Round2Output = gpt4Round2Response.choices[0]?.message.content || 'No response from GPT-4 Round 2';
        console.log('GPT-4 Round 2 output length:', gpt4Round2Output.length);
        
        // Send GPT-4 Round 2 response immediately
        writer.write(encoder.encode(`data: ${JSON.stringify({ 
          step: 'gpt4-round2', 
          data: {
            gpt4Round2: gpt4Round2Output
          }
        })}

`));
        
        // Step 5: Get Claude re-critique
        console.log('Starting Round 2: Claude Re-Critique...');
        const claudeRound2Response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          system: 'You are The Challenger in Round 2 of the AI Boardroom. Your job is to analyze and improve upon the answers from Round 1 and Round 2.',
          messages: [
            {
              role: 'user',
              content: `You are The Challenger in Round 2 of the AI Boardroom. Review both Gemini's synthesized answer from Round 1 and The Strategist's improvements from Round 2.

Original question: **${prompt}**

Gemini's synthesized answer from Round 1:
${geminiOutput}

The Strategist's improvements in Round 2:
${gpt4Round2Output}

Your task: Provide your own improved answer that addresses:
1. Any remaining inaccuracies or logical flaws
2. Important perspectives that are still missing
3. Ways to make the advice even more practical and actionable

Provide your improved answer directly and concisely. Focus on making the response more valuable, not just critiquing it.`
            }
          ],
        });
        
        claudeRound2Output = claudeRound2Response.content[0]?.type === 'text' ? claudeRound2Response.content[0].text : 'No response from Claude Round 2';
        console.log('Claude Round 2 output length:', claudeRound2Output.length);
        
        // Send Claude Round 2 response immediately
        writer.write(encoder.encode(`data: ${JSON.stringify({ 
          step: 'claude-round2', 
          data: {
            claudeRound2: claudeRound2Output
          }
        })}

`));
        
        // Step 6: Get Gemini final synthesis
        console.log('Starting Round 2: Gemini Final Synthesis...');
        const geminiRound2Model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const geminiRound2Prompt = `You are The Synthesizer in Round 2 of the AI Boardroom. Your job is to provide the final, definitive answer by synthesizing all previous perspectives.

Original question: **${prompt}**

Round 1 perspectives:
1. Gemini's synthesized answer: ${geminiOutput}

Round 2 perspectives:
2. The Strategist's improvements: ${gpt4Round2Output}
3. The Challenger's improvements: ${claudeRound2Output}

Your task: Create the FINAL DEFINITIVE ANSWER that synthesizes all the best insights and improvements from both rounds. This should be the most accurate, comprehensive, and actionable response possible.

Format your response as:

🔑 **FINAL ANSWER**
• Key point 1
• Key point 2
• Key point 3

💡 **ACTIONABLE STEPS**
1. First step
2. Second step
3. Third step

Be clear, direct, and authoritative - this is the definitive answer to the question.`;
        
        const geminiRound2Response = await geminiRound2Model.generateContent(geminiRound2Prompt);
        console.log('Gemini Round 2 API call successful');
        
        // Extract text from Gemini Round 2 response
        geminiRound2Output = 'No response from Gemini Round 2';
        
        // Different versions of the Gemini API may have different response structures
        if (geminiRound2Response && geminiRound2Response.response) {
          if (typeof geminiRound2Response.response.text === 'function') {
            geminiRound2Output = geminiRound2Response.response.text() || geminiRound2Output;
          } else if (geminiRound2Response.response.candidates && geminiRound2Response.response.candidates[0]?.content?.parts) {
            const parts = geminiRound2Response.response.candidates[0].content.parts;
            if (parts.length > 0 && typeof parts[0].text === 'string') {
              geminiRound2Output = parts[0].text;
            }
          } else {
            // Fallback to string representation
            geminiRound2Output = String(geminiRound2Response.response) || geminiRound2Output;
          }
          console.log('Gemini Round 2 output length:', geminiRound2Output.length);
        }
        
        // Send final complete response with all rounds and close the stream
        writer.write(encoder.encode(`data: ${JSON.stringify({ 
          step: 'gemini-round2', 
          data: {
            finalGemini: geminiRound2Output
          }
        })}

`));
        
      } catch (error) {
        console.error('Error in Round 2:', error);
        const errorMessage = 'Error in Round 2: ' + (error instanceof Error ? error.message : String(error));
        
        // Send error response with available data
        writer.write(encoder.encode(`data: ${JSON.stringify({ 
          step: 'round2-error', 
          data: {
            error: errorMessage
          }
        })}

`));
      }
      
    } catch (error) {
      console.error('Error in Gemini API call:', error);
      geminiOutput = 'Error getting synthesis from Gemini: ' + (error instanceof Error ? error.message : String(error));
      
      // Send error response with available data
      writer.write(encoder.encode(`data: ${JSON.stringify({ 
        step: 'gemini-error', 
        data: {
          gpt4: gpt4Output,
          claude: claudeOutput,
          gemini: geminiOutput
        }
      })}

`));
    }
    
    // Send final response with all data
    writer.write(encoder.encode(`data: ${JSON.stringify({ 
      step: 'complete', 
      data: {
        gpt4: gpt4Output,
        claude: claudeOutput,
        gemini: geminiOutput
      }
    })}

`));
    
  } catch (error) {
    console.error('Unhandled error in processRequest:', error);
    writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Internal server error' })}

`));
  } finally {
    // Always close the writer
    writer.close();
  }
}
