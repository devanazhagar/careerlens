const express = require('express');
const cors = require('cors');
const { startBrowserAndLogin, scrapeProfile } = require('./scraper');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Endpoint to start browser and wait for login
app.get('/api/login', async (req, res) => {
    try {
        console.log("Received login request...");
        const result = await startBrowserAndLogin();
        res.json({ success: true, message: result.message });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to scrape a specific profile
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
    }

    try {
        console.log(`Received scrape request for: ${url}`);
        const data = await scrapeProfile(url);
        res.json({ success: true, data });
    } catch (error) {
        console.error("Scraping error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to close browser (logout)
app.post('/api/logout', async (req, res) => {
    try {
        console.log("Received logout request...");
        const { closeBrowser } = require('./scraper'); // Re-import to ensure latest reference if needed, though top-level is fine usually. 
        // Actually, better to use the top level import.
        const result = await require('./scraper').closeBrowser();
        res.json({ success: true, message: result.message });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
