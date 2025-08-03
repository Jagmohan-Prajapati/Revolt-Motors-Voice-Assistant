const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));

// Environment variables
const API_KEY = process.env.GEMINI_API_KEY || 'your-api-key-here';
const MODEL_NAME = process.env.MODEL_NAME || 'gemini-1.5-flash'; // Changed to a stable model

// System instructions for Revolt Motors
const SYSTEM_INSTRUCTIONS = `You are Rev, the official voice assistant for Revolt Motors, India's leading electric motorcycle company. 

Key Information about Revolt Motors:
- Revolt Motors is India's first AI-enabled electric motorcycle company
- Main products: RV400 and RV1+ electric motorcycles
- Founded with a mission to make electric mobility accessible and exciting
- Offers innovative features like swappable batteries, mobile app connectivity, and AI-powered riding insights
- Focus on sustainable transportation solutions for Indian roads
- Customer-centric approach with nationwide service network

Your Role:
- Speak naturally and conversationally in a friendly, helpful tone
- Answer questions about Revolt Motors products, features, pricing, and services
- Help users understand electric motorcycle benefits
- Provide information about dealerships, test rides, and purchasing options
- If asked about topics unrelated to Revolt Motors, politely redirect the conversation back to Revolt Motors and electric mobility
- Keep responses concise but informative (2-3 sentences max)
- Show enthusiasm for electric vehicles and sustainable transportation

Always maintain focus on Revolt Motors and avoid discussing competitor brands or unrelated topics.`;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let conversationHistory = [];
  let isProcessing = false;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'start_session':
          ws.send(JSON.stringify({ type: 'session_started' }));
          break;
          
        case 'text_message':
          if (!isProcessing) {
            await handleTextMessage(ws, data.text);
          }
          break;
          
        case 'audio_data':
          if (!isProcessing) {
            await handleAudioMessage(ws, data.audio);
          }
          break;
          
        case 'interrupt':
          isProcessing = false;
          ws.send(JSON.stringify({ type: 'interrupted' }));
          break;
          
        case 'clear_history':
          conversationHistory = [];
          ws.send(JSON.stringify({ type: 'history_cleared' }));
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  async function handleTextMessage(ws, userText) {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
      // Add user message to history
      conversationHistory.push({
        role: "user",
        parts: [{ text: userText }]
      });
      
      ws.send(JSON.stringify({ 
        type: 'user_transcript', 
        text: userText 
      }));
      
      // Generate response using Gemini API
      const response = await generateResponse(conversationHistory);
      
      if (!isProcessing) return; // Check if interrupted
      
      // Add AI response to history
      conversationHistory.push({
        role: "model",
        parts: [{ text: response }]
      });
      
      // Send text response
      ws.send(JSON.stringify({
        type: 'text_response',
        text: response
      }));
      
      // Generate speech from text
      const audioData = await textToSpeech(response);
      
      if (!isProcessing) return; // Check if interrupted
      
      if (audioData) {
        ws.send(JSON.stringify({
          type: 'audio_response',
          audio: audioData,
          transcript: response
        }));
      }
      
    } catch (error) {
      console.error('Error handling text message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
    } finally {
      isProcessing = false;
    }
  }
  
  async function handleAudioMessage(ws, audioData) {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
      // Convert audio to text using speech-to-text
      const userText = await speechToText(audioData);
      
      if (!isProcessing) return; // Check if interrupted
      
      if (userText) {
        await handleTextMessage(ws, userText);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Could not understand audio' }));
      }
      
    } catch (error) {
      console.error('Error handling audio message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process audio' }));
    } finally {
      isProcessing = false;
    }
  }
  
  async function generateResponse(history) {
    try {
      console.log('Making request to Gemini API with model:', MODEL_NAME);
      console.log('API Key present:', !!API_KEY && API_KEY !== 'your-api-key-here');
      
      const requestBody = {
        contents: history,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTIONS }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      }
      
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw error;
    }
  }
  
  async function speechToText(audioData) {
    // For now, return a placeholder - in production, you'd use Google Speech-to-Text API
    // or implement Web Speech API on the client side
    return "Hello, tell me about Revolt Motors"; // Placeholder
  }
  
  async function textToSpeech(text) {
    // For now, return null - in production, you'd use Google Text-to-Speech API
    // The client will handle TTS using Web Speech API
    return null;
  }
  
  ws.on('close', () => {
    console.log('Client disconnected');
    isProcessing = false;
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint for API key
app.get('/test-api', async (req, res) => {
  try {
    console.log('Testing API with model:', MODEL_NAME);
    console.log('API Key present:', !!API_KEY && API_KEY !== 'your-api-key-here');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    console.log('Test URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Hello" }]
        }],
        generationConfig: {
          maxOutputTokens: 50
        }
      })
    });
    
    console.log('Test response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      res.json({ 
        status: 'API key is working', 
        model: MODEL_NAME,
        response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text in response'
      });
    } else {
      const errorText = await response.text();
      console.error('Test API error:', errorText);
      res.status(400).json({ 
        status: 'API key issue', 
        error: response.statusText,
        details: errorText,
        model: MODEL_NAME
      });
    }
  } catch (error) {
    console.error('Test API exception:', error);
    res.status(500).json({ 
      status: 'Error testing API', 
      error: error.message,
      model: MODEL_NAME
    });
  }
});

// List available models endpoint
app.get('/models', async (req, res) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description
      })) || [];
      
      res.json({ models });
    } else {
      const errorText = await response.text();
      res.status(400).json({ error: errorText });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
  console.log(`Test API at http://localhost:${PORT}/test-api`);
  console.log(`List models at http://localhost:${PORT}/models`);
  console.log(`Using model: ${MODEL_NAME}`);
  console.log(`API Key configured: ${!!API_KEY && API_KEY !== 'your-api-key-here'}`);
});