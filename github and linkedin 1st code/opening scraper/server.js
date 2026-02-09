const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // Dynamic import for fetch

// Prevent server crashes on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
});

// Enable stealth plugin
chromium.use(stealth);

const app = express();
const PORT = 3001;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// --- 1. n8n Proxy Endpoint ---
app.post('/n8n-job-proxy', async (req, res) => {
    const { role, pincode } = req.body;

    if (!role || !pincode) {
        return res.status(400).json({ error: 'Role and Pincode are required.' });
    }

    console.log(`[Server] Proxying to n8n: Role="${role}", Pincode="${pincode}"`);

    try {
        const n8nUrl = 'https://escloop-n8n.escloop-gym.com.de/webhook/jobs-search';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes

        try {
            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, pincode, city: req.body.city }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`n8n responded with ${response.status}`);
            }

            const data = await response.json();
            console.log("[Server] Received data from n8n.");
            res.json(data);
        } finally {
            clearTimeout(timeout);
        }

    } catch (error) {
        console.error("[Server] n8n Proxy Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 1.5. New Indeed Scraper + Webhook ---
app.post('/search-jobs-indeed', async (req, res) => {
    const { role, city } = req.body;

    if (!role || !city) {
        return res.status(400).json({ error: 'Role and City are required.' });
    }

    console.log(`[Server] Indeed Search Request: Role="${role}", City="${city}"`);

    let browserContext = null;
    try {
        // 1. Construct URL
        const formattedRole = role.trim().replace(/\s+/g, '+');
        const formattedCity = city.trim();
        const targetUrl = `https://in.indeed.com/jobs?q=${formattedRole}&l=${formattedCity}&fromage=1&radius=25`;

        console.log(`[Server] Target URL: ${targetUrl}`);

        // 2. Scrape Page
        const userDataDir = path.join(__dirname, 'user_data');
        browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome',
            viewport: { width: 1280, height: 720 },
            args: [
                '--disable-infobars',
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        });

        let page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();

        console.log("[Server] Navigating...");
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Scroll to trigger lazy loading
        console.log("[Server] Scrolling...");
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);
        }

        console.log("[Server] Parsing job cards...");

        // Indeed Selectors
        let cardSelector = '#mosaic-provider-jobcards ul li';
        if (await page.locator(cardSelector).count() === 0) {
            cardSelector = '.job_seen_beacon';
        }

        const jobCards = page.locator(cardSelector);
        const count = await jobCards.count();
        console.log(`[Server] Found ${count} potential job cards.`);

        const scrapedData = [];

        for (let i = 0; i < count; i++) {
            const card = jobCards.nth(i);
            const textContent = await card.innerText().catch(() => '');
            if (!textContent || textContent.length < 50) continue;

            let title = "Unknown Title";
            let company = "Unknown Company";
            let location = "Unknown Location";
            let link = "";

            try {
                const h2 = card.locator('h2');
                if (await h2.count() > 0) {
                    title = await h2.innerText();
                    const aTag = h2.locator('a');
                    if (await aTag.count() > 0) {
                        const href = await aTag.getAttribute('href');
                        if (href) link = href.startsWith('http') ? href : `https://in.indeed.com${href}`;
                    }
                }

                const companyLoc = card.locator('[data-testid="company-name"]');
                if (await companyLoc.count() > 0) company = await companyLoc.innerText();

                const locLoc = card.locator('[data-testid="text-location"]');
                if (await locLoc.count() > 0) location = await locLoc.innerText();

            } catch (e) { }

            scrapedData.push({
                title: title.replace(/\n/g, " ").trim(),
                company: company.trim(),
                location: location.trim(),
                link: link,
                full_card_text: textContent.replace(/\n/g, " | ")
            });
        }

        console.log(`[Server] Scraped ${scrapedData.length} structured job items.`);

        await browserContext.close();
        browserContext = null; // Prevent double close in finally

        // 3. Send to Webhook
        const n8nUrl = 'https://escloop-n8n.escloop-gym.com.de/webhook/jobs-search';
        console.log(`[Server] Sending data to Webhook: ${n8nUrl}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes

        try {
            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    city,
                    url: targetUrl,
                    scraped_data: scrapedData
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`n8n Webhook responded with ${response.status}`);
            }

            const webhookData = await response.json();
            console.log("[Server] Received response from Webhook.");
            res.json(webhookData);

        } finally {
            clearTimeout(timeout);
        }

    } catch (error) {
        console.error("[Server] Indeed Search Error:", error);
        if (browserContext) await browserContext.close();
        res.status(500).json({ error: error.message });
    }
});

// --- 2. Generic URL Scraper (Job Search) ---
app.post('/scrape-target-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Target URL is required.' });
    }

    console.log(`[Server] Received scraping request for URL: ${url}`);

    // Clear output for fresh start
    // fs.writeFileSync('output.json', JSON.stringify([], null, 4));

    let browserContext = null;
    try {
        const userDataDir = path.join(__dirname, 'user_data');

        console.log(`[Server] Launching Persistent Chrome Context (HEADLESS: FALSE)...`);
        browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome',
            viewport: { width: 1280, height: 720 },
            args: [
                '--disable-infobars',
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        });

        // Get generic page
        let page;
        const pages = browserContext.pages();
        if (pages.length > 0) page = pages[0];
        else page = await browserContext.newPage();

        console.log("[Server] Navigating to target URL...");
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Scroll logic to load jobs
        console.log("[Server] Scrolling to load content...");
        const SCROLL_count = 3;
        for (let i = 0; i < SCROLL_count; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(Math.random() * 1000 + 1000);
        }

        console.log("[Server] Parsing job cards...");

        // Indeed Selectors
        let cardSelector = '#mosaic-provider-jobcards ul li';
        if (await page.locator(cardSelector).count() === 0) {
            cardSelector = '.job_seen_beacon';
        }

        const jobCards = page.locator(cardSelector);
        const count = await jobCards.count();
        console.log(`[Server] Found ${count} potential job cards.`);

        const scrapedData = [];

        for (let i = 0; i < count; i++) {
            const card = jobCards.nth(i);
            const textContent = await card.innerText().catch(() => '');
            if (!textContent || textContent.length < 50) continue;

            let title = "Unknown Title";
            let company = "Unknown Company";
            let location = "Unknown Location";

            try {
                const h2 = card.locator('h2');
                if (await h2.count() > 0) title = await h2.innerText();

                const companyLoc = card.locator('[data-testid="company-name"]');
                if (await companyLoc.count() > 0) company = await companyLoc.innerText();

                const locLoc = card.locator('[data-testid="text-location"]');
                if (await locLoc.count() > 0) location = await locLoc.innerText();

            } catch (e) { }

            scrapedData.push({
                id: i + 1,
                title: title.replace(/\n/g, " ").trim(),
                company: company.trim(),
                location: location.trim(),
                city: location.split(',')[0].trim(), // Extract city from "City, State"
                full_card_text: textContent.replace(/\n/g, " | ")
            });
        }

        // Save
        fs.writeFileSync('jobs_output.json', JSON.stringify(scrapedData, null, 4));
        console.log(`[Server] Scraped ${scrapedData.length} jobs.`);

        if (browserContext) await browserContext.close();

        res.json({ success: true, count: scrapedData.length, data: scrapedData });

    } catch (error) {
        console.error("[Server] Scraping Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- 3. Intenship Search (Preserved) ---
app.post('/search-internships', async (req, res) => {
    const { city, role } = req.body;
    if (!city || !role) return res.status(400).json({ error: 'City and Role required.' });

    // ... (Keep existing logic or just refactor? Stick to rewriting file to ensure consistency)
    // For safety, I will include the full Internship Logic here again to avoid it getting lost in a full overwrite.

    console.log(`[Server] Internships: City="${city}", Role="${role}"`);
    // Clear output for fresh start
    fs.writeFileSync('internships_output.json', JSON.stringify([{ status: "Scraping started...", timestamp: new Date() }], null, 4));

    let browserContext = null;
    try {
        const formattedRole = role.trim().toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
        const formattedCity = city.trim().toLowerCase().replace(/\s+/g, "-");
        const targetUrl = `https://internshala.com/internships/${formattedRole}-internship-in-${formattedCity}/`;

        const userDataDir = path.join(__dirname, 'user_data');
        browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome',
            viewport: { width: 1280, height: 720 },
            args: ['--disable-infobars', '--no-sandbox', '--disable-blink-features=AutomationControlled', '--start-maximized']
        });

        let page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Popup logic
        try {
            const userPopupClose = page.locator('#close_popup');
            if (await userPopupClose.isVisible()) {
                await userPopupClose.click();
                await page.waitForTimeout(1000);
            }
            await page.keyboard.press('Escape');
        } catch (e) { }

        // Scroll
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(1000);
        }

        // Scrape
        let cardSelector = '.individual_internship';
        if (await page.locator(cardSelector).count() === 0) cardSelector = '.internship_meta';
        const internshipCards = page.locator(cardSelector);
        const count = await internshipCards.count();

        const scrapedData = [];
        for (let i = 0; i < count; i++) {
            const card = internshipCards.nth(i);
            if (!(await card.isVisible())) continue;
            let title = "", company = "", location = "", stipend = "";
            try {
                if (await card.locator('.profile').count() > 0) title = await card.locator('.profile').innerText();
                if (await card.locator('.company_name').count() > 0) company = await card.locator('.company_name').innerText();
                if (await card.locator('.location_link').count() > 0) location = await card.locator('.location_link').innerText();
                if (await card.locator('.stipend').count() > 0) stipend = await card.locator('.stipend').innerText();
                fullCardText = await card.innerText();
            } catch (e) { }
            scrapedData.push({
                id: i + 1,
                title: title.trim(),
                company: company.trim(),
                location: location.trim(),
                stipend: stipend.trim(),
                full_card_text: fullCardText ? fullCardText.replace(/\n/g, " | ") : ""
            });
        }

        fs.writeFileSync('internships_output.json', JSON.stringify(scrapedData, null, 4));
        if (browserContext) await browserContext.close();
        res.json({ success: true, count: scrapedData.length, data: scrapedData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// --- 4. College Search Proxy ---
app.post('/search-colleges', async (req, res) => {
    const { city, course } = req.body;

    if (!city || !course) {
        return res.status(400).json({ error: 'City and Course are required.' });
    }

    console.log(`[Server] Proxying to n8n (Colleges): City="${city}", Course="${course}"`);

    try {
        const n8nUrl = 'https://escloop-n8n.escloop-gym.com.de/webhook/college-search';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes

        try {
            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, course }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`n8n responded with ${response.status}`);
            }

            const data = await response.json();
            console.log("[Server] Received data from n8n (Colleges).");
            res.json(data);
        } finally {
            clearTimeout(timeout);
        }

    } catch (error) {
        console.error("[Server] n8n Proxy Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
