const { spawn } = require('child_process');
const path = require('path');

/**
 * Communicates with the Python script to get AI responses.
 * @param {string} prompt - The specific instructions for the AI.
 */
const analyzeWithGemini = (prompt) => {
    return new Promise((resolve, reject) => {
        // Use the project's virtual environment python
        const pythonScriptPath = path.join(__dirname, '../server.py');
        const venvPythonPath = path.join(__dirname, '../.venv/Scripts/python.exe');
        const pythonProcess = spawn(venvPythonPath, [pythonScriptPath, '--api']);

        let result = '';
        let errorData = '';

        // Prepare the data to send to Python's Stdin
        const requestBody = JSON.stringify({
            apiKey: process.env.GEMINI_API_KEY, // Taken from your .env file
            prompt: prompt
        });

        // Send the data and close the pipe
        pythonProcess.stdin.write(requestBody);
        pythonProcess.stdin.end();

        // Listen for the AI response
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        // Listen for any Python errors
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // Listen for process-level errors (e.g. file not found)
        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start Python process: ${err.message}`));
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python Error (Code ${code}): ${errorData}`));
            }
            try {
                // Parse the JSON string coming from Python
                const parsedResult = JSON.parse(result);
                resolve(parsedResult);
            } catch (e) {
                console.error("❌ RAW AI RESPONSE FAILED TO PARSE:", result);
                reject(new Error("Failed to parse AI response: " + result));
            }
        });
    });
};

module.exports = { analyzeWithGemini };