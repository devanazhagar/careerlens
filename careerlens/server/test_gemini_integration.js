const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Using API Key:", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 10) + "..." : "MISSING");

const runTest = () => {
    return new Promise((resolve, reject) => {
        // Match the path logic from the controller
        const pythonScriptPath = path.join(__dirname, '../server.py');
        console.log("Python Script Path:", pythonScriptPath);

        console.log("Spawning python process...");
        const pythonProcess = spawn('python', [pythonScriptPath, '--api']);

        let dataString = '';
        let errorString = '';

        const payload = JSON.stringify({
            apiKey: GEMINI_API_KEY,
            prompt: "Say 'Hello from Gemini!' if you can hear me."
        });

        console.log("Sending payload:", payload);

        pythonProcess.stdin.write(payload);
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            console.log("STDOUT:", data.toString());
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.log("STDERR:", data.toString());
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
            if (code !== 0) {
                console.error(`Error Output: ${errorString}`);
                reject(new Error(`Exit Code ${code}`));
            } else {
                resolve(dataString);
            }
        });

        pythonProcess.on('error', (err) => {
            console.error("Failed to start subprocess:", err);
        });
    });
};

runTest().then(res => console.log("Final Result:", res)).catch(err => console.error("Test Failed:", err));
