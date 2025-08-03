# Revolt Motors Voice Assistant

A real-time conversational voice interface using the Gemini Live API, replicating the functionality of the Revolt Motors chatbot with interruption capabilities and low latency response.

## Features

- **Real-time Voice Chat**: Natural conversation flow with AI
- **Interruption Support**: Users can interrupt AI mid-response
- **Low Latency**: 1-2 second response time
- **Multi-language Support**: Inherited from Gemini Live API
- **Clean UI**: Modern, responsive interface
- **Server-to-Server Architecture**: Secure API key handling

## Tech Stack

- **Backend**: Node.js, Express.js, WebSocket
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini Live API
- **Audio**: Web Audio API, MediaRecorder API

## Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Gemini API key from [AI Studio](https://aistudio.google.com)
- Modern web browser with microphone support

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Jagmohan-Prajapati/Revolt-Motors-Voice-Assistant.git
cd revolt-motors-voice-chat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
MODEL_NAME=gemini-2.5-flash-preview-native-audio-dialog
PORT=3000
```

### 4. Get Gemini API Key

1. Visit [AI Studio](https://aistudio.google.com)
2. Create a free account
3. Generate an API key
4. Copy the key to your `.env` file

### 5. Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Model Configuration

### Production Model (Final Submission)
```env
MODEL_NAME=gemini-2.5-flash-preview-native-audio-dialog
```

### Development Models (For Testing)
```env
MODEL_NAME=gemini-2.0-flash-live-001
# or
MODEL_NAME=gemini-live-2.5-flash-preview
```

The development models have higher rate limits, making them better for extensive testing.

## Usage

1. **Start Conversation**: Click the microphone button or press spacebar
2. **Speak**: Talk naturally to the AI about Revolt Motors
3. **Stop Speaking**: Click the stop button or release spacebar
4. **Interrupt AI**: Click the "Interrupt" button or press Escape while AI is speaking
5. **Clear Chat**: Use the "Clear" button to reset the conversation

## System Instructions

The AI is configured with specific instructions to:
- Act as "Rev", the official Revolt Motors voice assistant
- Provide information about RV400 and RV1+ electric motorcycles
- Discuss features, pricing, dealerships, and services
- Maintain focus on Revolt Motors and electric mobility
- Redirect off-topic conversations back to Revolt Motors

## Architecture

```
Client (Browser)
    ↓ WebSocket
Server (Node.js/Express)
    ↓ HTTP/WebSocket
Gemini Live API
```

### Key Components:

- **WebSocket Server**: Handles real-time communication
- **Audio Processing**: Captures and streams audio data
- **Gemini Integration**: Manages Live API sessions
- **Interruption Handling**: Stops AI response when interrupted

## API Integration

The application uses Gemini Live API's server-to-server architecture:

1. Client captures audio via MediaRecorder
2. Audio streams to server via WebSocket
3. Server forwards audio to Gemini Live API
4. AI responses stream back through the same pipeline
5. Client plays audio responses while maintaining interrupt capability

## Browser Compatibility

- Chrome 66+ (Recommended)
- Firefox 60+
- Safari 14+
- Edge 79+

**Note**: Microphone access requires HTTPS in production.

## Troubleshooting

### Common Issues:

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify microphone hardware

2. **API Rate Limits**
   - Switch to development model for testing
   - Monitor usage in AI Studio console

3. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify port availability
   - Ensure server is running

4. **Audio Playback Issues**
   - Check browser audio permissions
   - Verify Web Audio API support
   - Test with different browsers


## Performance Optimization

- Audio streaming in 100ms chunks for low latency
- Efficient WebSocket message handling
- Minimal DOM manipulation
- Optimized audio buffer management

## Security Considerations

- API keys stored server-side only
- WebSocket connection validation
- Input sanitization
- CORS configuration for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Gemini Live API documentation
3. Create an issue in the repository

## References

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [Interactive Playground](https://aistudio.google.com/live)
- [Example Applications](https://ai.google.dev/gemini-api/docs/live#example-applications)
- [Revolt Motors Website](https://revoltmotors.com)
