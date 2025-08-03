const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(colors[color] + message + colors.reset);
}

function checkEnvironment() {
    log('cyan', '🔍 Checking environment setup...\n');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        log('yellow', 'No .env file found. Creating from template...');
        const envExamplePath = path.join(__dirname, '.env.example');
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            log('green', 'Created .env file from template');
        } else {
            // Create a basic .env file
            const envContent = `# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.0-flash-exp
PORT=3000
NODE_ENV=development`;
            fs.writeFileSync(envPath, envContent);
            log('green', 'Created basic .env file');
        }
    }
    
    // Load environment variables
    require('dotenv').config();
    
    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your-api-key-here') {
        log('red', 'GEMINI_API_KEY not configured!');
        log('yellow', '\nSetup Instructions:');
        log('white', '1. Visit https://aistudio.google.com');
        log('white', '2. Create a free account and generate an API key');
        log('white', '3. Edit the .env file and replace "your_gemini_api_key_here" with your actual API key');
        log('white', '4. Save the file and restart the server\n');
        log('red', 'Server will not work properly without a valid API key!');
        log('yellow', 'Continuing anyway for demonstration purposes...\n');
    } else {
        log('green', 'API key configured');
    }
    
    // Check model name
    const modelName = process.env.MODEL_NAME || 'gemini-2.0-flash-exp';
    log('blue', `Using model: ${modelName}`);
    
    // Check port
    const port = process.env.PORT || 3000;
    log('blue', `Server will run on port: ${port}`);
    
    log('cyan', '\nStarting Revolt Motors Voice Chat...\n');
}

function displayWelcome() {
    log('magenta', '╔════════════════════════════════════════╗');
    log('magenta', '║        REVOLT MOTORS VOICE CHAT        ║');
    log('magenta', '║             Powered by Gemini          ║');
    log('magenta', '╚════════════════════════════════════════╝\n');
}

function main() {
    displayWelcome();
    checkEnvironment();
    
    // Start the main server
    require('./server.js');
}

if (require.main === module) {
    main();

}
