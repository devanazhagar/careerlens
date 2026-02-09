require('dotenv').config({ path: './server/.env' });
const { analyzeWithGemini } = require('./server/aiservice');

async function test() {
    console.log("Testing AI Bridge...");
    console.log("API KEY:", process.env.GEMINI_API_KEY ? "FOUND" : "MISSING");
    try {
        const result = await analyzeWithGemini("Hello, are you working?");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
