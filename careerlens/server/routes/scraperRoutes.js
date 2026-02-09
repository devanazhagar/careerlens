const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Enable stealth plugin
chromium.use(stealth);

const router = express.Router();

// Track active requests to prevent duplicates
const activeRequests = {
    jobs: new Set(),
    internships: new Set(),
    colleges: new Set()
};

// Prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Scraper] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Scraper] Uncaught Exception:', error);
});

// Helper: Save search results per user
async function saveUserSearchResults(userID, type, data) {
    try {
        const resultsDir = path.join(__dirname, '../search_results');
        await fs.mkdir(resultsDir, { recursive: true });

        const fileName = `user_${userID}_${type}.json`;
        const filePath = path.join(resultsDir, fileName);

        // Check if file exists (for logging)
        const fileExists = fsSync.existsSync(filePath);

        const resultData = {
            userID,
            type,
            timestamp: new Date().toISOString(),
            data
        };

        // writeFile OVERWRITES the old file automatically
        await fs.writeFile(filePath, JSON.stringify(resultData, null, 2));

        if (fileExists) {
            console.log(`[Storage] ✓ Replaced old ${type} results for user ${userID}`);
        } else {
            console.log(`[Storage] ✓ Saved new ${type} results for user ${userID}`);
        }

        return true;
    } catch (error) {
        console.error(`[Storage] Error saving ${type} results:`, error.message);
        return false;
    }
}

// Helper: Get search results for user
async function getUserSearchResults(userID, type) {
    try {
        const fileName = `user_${userID}_${type}.json`;
        const filePath = path.join(__dirname, '../search_results', fileName);

        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`[Storage] No saved ${type} results for user ${userID}`);
        return null;
    }
}

// Helper: Parse nested webhook response (unwrap output field if present)
function parseWebhookResponse(data, searchType = 'search') {
    try {
        // Check if response is array with output field: [{ "output": "{...}" }]
        if (Array.isArray(data) && data[0]?.output) {
            const outputString = data[0].output;

            // Remove markdown code fences if present (```json ... ```)
            const cleanedOutput = outputString
                .replace(/^```json\s*/, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/, '')
                .trim();

            const parsed = JSON.parse(cleanedOutput);
            console.log(`[${searchType}] ✓ Unwrapped nested JSON from output field`);
            return parsed;
        }

        return data; // Return as-is if not nested
    } catch (error) {
        console.error(`[${searchType}] Could not parse nested output:`, error.message);
        return data; // Return original if parsing fails
    }
}


// --- 1. Job Search with Indeed Scraping (with Retry Logic) ---
router.post('/search-jobs-indeed', async (req, res) => {
    const { role, city, userID } = req.body;

    if (!role || !city) {
        return res.status(400).json({ error: 'Role and City are required.' });
    }

    if (!userID) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Prevent duplicate requests
    if (activeRequests.jobs.has(userID)) {
        console.log(`[Job Search] Duplicate request blocked for user ${userID}`);
        return res.status(429).json({ error: 'A job search is already in progress for this user. Please wait.' });
    }

    activeRequests.jobs.add(userID);
    console.log(`[Job Search] User=${userID}, Role="${role}", City="${city}"`);

    const MAX_RETRIES = 3;
    let scrapedData = [];
    let lastError = null;

    // Try with different browser profiles if data is empty
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        let browserContext = null;
        try {
            // Use different profile directory for each attempt
            const profileSuffix = attempt > 1 ? `_attempt${attempt}` : '';
            const userDataDir = path.join(__dirname, `../scraper_data_jobs${profileSuffix}`);

            console.log(`[Job Search] Attempt ${attempt}/${MAX_RETRIES} - Using profile: ${userDataDir}`);

            // 1. Construct URL
            const formattedRole = role.trim().replace(/\s+/g, '+');
            const formattedCity = city.trim();
            const targetUrl = `https://in.indeed.com/jobs?q=${formattedRole}&l=${formattedCity}&fromage=1&radius=25`;

            console.log(`[Job Search] Target URL: ${targetUrl}`);

            // 2. Scrape Page - Headless with anti-detection
            browserContext = await chromium.launchPersistentContext(userDataDir, {
                headless: true,
                channel: 'chrome',
                viewport: { width: 1920, height: 1080 },
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--start-maximized',
                    '--window-size=1920,1080'
                ],
                ignoreDefaultArgs: ['--enable-automation']
            });

            let page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();

            console.log('[Job Search] Navigating...');
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Wait longer for dynamic content
            console.log('[Job Search] Waiting for page to fully load...');
            await page.waitForTimeout(5000);

            // Scroll to trigger lazy loading
            console.log('[Job Search] Scrolling...');
            for (let i = 0; i < 5; i++) {
                await page.evaluate(() => window.scrollBy(0, 500));
                await page.waitForTimeout(1500);
            }

            console.log('[Job Search] Parsing job cards...');

            // Try multiple Indeed selectors
            let cardSelector = null;
            const possibleSelectors = [
                '#mosaic-provider-jobcards ul li',
                '.job_seen_beacon',
                '.jobsearch-ResultsList li',
                '[data-testid="job-result"]',
                '.cardOutline',
                'div.slider_container div.slider_item'
            ];

            for (const selector of possibleSelectors) {
                const count = await page.locator(selector).count();
                console.log(`[Job Search] Trying selector "${selector}": found ${count} elements`);
                if (count > 0) {
                    cardSelector = selector;
                    break;
                }
            }

            if (!cardSelector) {
                console.error('[Job Search] No job cards found with any selector!');
                console.log('[Job Search] Page HTML sample:', await page.content().then(html => html.substring(0, 500)));
                throw new Error('Could not find job cards on Indeed. Selectors may need updating.');
            }

            const jobCards = page.locator(cardSelector);
            const count = await jobCards.count();
            console.log(`[Job Search] Found ${count} potential job cards using selector: ${cardSelector}`);

            scrapedData = [];

            for (let i = 0; i < count; i++) {
                const card = jobCards.nth(i);

                // Get all text first
                const textContent = await card.innerText().catch(() => '');
                console.log(`[Job Search] Card ${i + 1} text preview: ${textContent.substring(0, 100)}...`);

                if (!textContent || textContent.length < 30) {
                    console.log(`[Job Search] Skipping card ${i + 1} - insufficient text`);
                    continue;
                }

                let title = '', company = '', location = '', link = '';

                try {
                    // Multiple title selectors
                    const titleSelectors = ['h2', '.jobTitle', '[data-testid="job-title"]', 'h2 a span', '.job-title'];
                    for (const sel of titleSelectors) {
                        if (await card.locator(sel).count() > 0) {
                            title = await card.locator(sel).first().innerText();
                            if (title) break;
                        }
                    }

                    // Extract link
                    const h2 = card.locator('h2');
                    if (await h2.count() > 0) {
                        const aTag = h2.locator('a');
                        if (await aTag.count() > 0) {
                            const href = await aTag.getAttribute('href');
                            if (href) link = href.startsWith('http') ? href : `https://in.indeed.com${href}`;
                        }
                    }

                    // Company selectors
                    const companySelectors = ['[data-testid="company-name"]', '.companyName', 'span.company'];
                    for (const sel of companySelectors) {
                        if (await card.locator(sel).count() > 0) {
                            company = await card.locator(sel).first().innerText();
                            if (company) break;
                        }
                    }

                    // Location selectors
                    const locationSelectors = ['[data-testid="text-location"]', '.companyLocation', '.location'];
                    for (const sel of locationSelectors) {
                        if (await card.locator(sel).count() > 0) {
                            location = await card.locator(sel).first().innerText();
                            if (location) break;
                        }
                    }

                    // Fallback: parse from text
                    if (!title) {
                        const lines = textContent.split('\n').filter(l => l.trim());
                        title = lines[0] || 'Position Available';
                    }

                } catch (e) {
                    console.error(`[Job Search] Error parsing card ${i + 1}:`, e.message);
                }

                const jobData = {
                    title: title.replace(/\n/g, ' ').trim() || 'Job Opening',
                    company: company.trim() || 'Company',
                    location: location.trim() || 'Location not specified',
                    link: link,
                    full_card_text: textContent.replace(/\n/g, ' | ')
                };

                console.log(`[Job Search] Extracted job ${i + 1}: ${jobData.title} @ ${jobData.company}`);
                scrapedData.push(jobData);
            }

            console.log(`[Job Search] Scraped ${scrapedData.length} structured job items.`);

            await browserContext.close();
            browserContext = null;

            // If we got data, break out of retry loop
            if (scrapedData.length > 0) {
                console.log(`[Job Search] ✓ Success on attempt ${attempt}`);
                break;
            } else {
                console.log(`[Job Search] ⚠ No data found on attempt ${attempt}, will retry...`);
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                }
            }

        } catch (error) {
            console.error(`[Job Search] Error on attempt ${attempt}:`, error.message);
            lastError = error;
            if (browserContext) {
                try {
                    await browserContext.close();
                } catch (e) { }
            }

            // Wait before retrying
            if (attempt < MAX_RETRIES) {
                console.log(`[Job Search] Waiting 3 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // After all retries, check if we have data
    if (scrapedData.length === 0) {
        const errorMsg = lastError ? lastError.message : 'No jobs found after multiple attempts';
        console.error(`[Job Search] ✗ Failed after ${MAX_RETRIES} attempts`);
        console.error(`[Job Search] Last error:`, lastError);

        // Clean up before returning
        activeRequests.jobs.delete(userID);
        console.log(`[Job Search] Cleanup: Removed user ${userID} from active requests (scraping failed)`);

        return res.status(500).json({
            error: errorMsg,
            attempts: MAX_RETRIES,
            message: 'Unable to fetch jobs. The page may be blocking automated requests. Try using different search terms.'
        });
    }

    // 3. Send to Webhook
    console.log(`[Job Search] ━━━ WEBHOOK SECTION START ━━━`);
    console.log(`[Job Search] Time: ${new Date().toISOString()}`);
    console.log(`[Job Search] Scraped ${scrapedData.length} jobs, preparing to send to webhook`);

    try {
        const formattedRole = role.trim().replace(/\s+/g, '+');
        const formattedCity = city.trim();
        const targetUrl = `https://in.indeed.com/jobs?q=${formattedRole}&l=${formattedCity}&fromage=1&radius=25`;

        const n8nUrl = 'https://escloop-n8n.escloop-gym.com.de/webhook/jobs-search';
        console.log(`[Job Search] Webhook URL: ${n8nUrl}`);
        console.log(`[Job Search] Payload: ${scrapedData.length} jobs for "${role}" in "${city}"`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 600000); // 10 minutes

        try {
            // Build payload - only include scraped_data if there are jobs
            const payload = {
                role,
                city,
                url: targetUrl
            };

            // Only add scraped_data if we have jobs
            if (scrapedData.length > 0) {
                payload.scraped_data = scrapedData;
            }

            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`n8n Webhook responded with ${response.status}`);
            }

            // Safely parse webhook response
            let webhookData;
            try {
                const responseText = await response.text();
                console.log('[Job Search] Raw response length:', responseText.length);

                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response from webhook');
                }

                webhookData = JSON.parse(responseText);
                console.log('[Job Search] ✓ Successfully parsed webhook response');
            } catch (parseError) {
                console.error('[Job Search] Error parsing webhook response:', parseError.message);
                throw new Error(`Failed to parse webhook response: ${parseError.message}`);
            }

            console.log('[Job Search] ✓ Received response from Webhook.');

            // Parse nested response if wrapped in array with output field
            let parsedData = parseWebhookResponse(webhookData, 'Job Search');

            // Normalize structure to match frontend expectations
            // Backend returns: { jobs: [...], summary: "..." }
            // Frontend expects: { results: [...], answer: "..." }
            if (parsedData.jobs) {
                parsedData = {
                    results: parsedData.jobs,
                    answer: parsedData.summary || parsedData.message || '',
                    found_jobs: parsedData.found_jobs
                };
                console.log('[Job Search] ✓ Normalized data structure for frontend');
            }


            // Save results for user
            await saveUserSearchResults(userID, 'jobs', {
                query: { role, city },
                scraped: scrapedData,
                webhookResponse: parsedData
            });

            res.json(parsedData);

        } finally {
            clearTimeout(timeout);
            activeRequests.jobs.delete(userID);
            console.log(`[Job Search] Cleanup: Removed user ${userID} from active requests`);
        }

    } catch (error) {
        console.error('[Job Search] Webhook Error:', error);
        // Still save scraped data and return even if webhook fails
        // Still save scraped data and return even if webhook fails
        // Normalize fallback data to match webhook structure
        const fallbackData = {
            results: scrapedData,
            answer: "Webhook analysis failed, showing raw scraped data.",
            found_jobs: scrapedData.length
        };

        await saveUserSearchResults(userID, 'jobs', {
            query: { role, city },
            scraped: scrapedData,
            webhookFailed: true,
            formatted: fallbackData // Save formatted version for easier loading
        });

        res.json(fallbackData);
    } finally {
        activeRequests.jobs.delete(userID);
        console.log(`[Job Search] Cleanup: Removed user ${userID} from active requests`);
    }
});

// --- 2. Internship Search with Internshala Scraping ---
router.post('/search-internships', async (req, res) => {
    const { city, role, userID } = req.body;
    if (!city || !role) return res.status(400).json({ error: 'City and Role required.' });
    if (!userID) return res.status(400).json({ error: 'User ID is required.' });

    // Prevent duplicate requests
    if (activeRequests.internships.has(userID)) {
        console.log(`[Internship Search] Duplicate request blocked for user ${userID}`);
        return res.status(429).json({ error: 'An internship search is already in progress for this user. Please wait.' });
    }

    activeRequests.internships.add(userID);
    console.log(`[Internship Search] User=${userID}, City="${city}", Role="${role}"`);

    let browserContext = null;
    try {
        const formattedRole = role.trim().toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
        const formattedCity = city.trim().toLowerCase().replace(/\s+/g, '-');
        const targetUrl = `https://internshala.com/internships/${formattedRole}-internship-in-${formattedCity}/`;
        console.log(`[Internship Search] Target URL: ${targetUrl}`);

        const userDataDir = path.join(__dirname, '../scraper_data_internships');
        console.log(`[Internship Search] Launching browser with user data dir: ${userDataDir}`);
        browserContext = await chromium.launchPersistentContext(userDataDir, {
            headless: true,
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
            let title = '', company = '', location = '', stipend = '', fullCardText = '';
            try {
                // Try multiple selectors for title
                if (await card.locator('.profile').count() > 0) {
                    title = await card.locator('.profile').innerText();
                } else if (await card.locator('h3').count() > 0) {
                    title = await card.locator('h3').first().innerText();
                } else if (await card.locator('.internship_other_details_container .location_link').count() > 0) {
                    // Sometimes title is before location
                    const textBefore = await card.locator('.internship_other_details_container').first().innerText();
                    title = textBefore.split('\n')[0];
                }

                if (await card.locator('.company_name').count() > 0) company = await card.locator('.company_name').innerText();
                if (await card.locator('.location_link').count() > 0) location = await card.locator('.location_link').innerText();
                if (await card.locator('.stipend').count() > 0) stipend = await card.locator('.stipend').innerText();
                fullCardText = await card.innerText();

                // Fallback: Extract title from full card text if still empty
                if (!title || title.trim() === '') {
                    const lines = fullCardText.split('\n').filter(line => line.trim() !== '');
                    // First meaningful line is usually the title
                    for (let line of lines) {
                        if (line.length > 3 && !line.includes('Actively hiring') && !line.includes('₹')) {
                            title = line.trim();
                            break;
                        }
                    }
                }

            } catch (e) {
                console.error(`[Internship Search] Error parsing card ${i}:`, e.message);
            }

            scrapedData.push({
                id: i + 1,
                title: title.trim() || 'Internship Position',
                company: company.trim(),
                location: location.trim(),
                stipend: stipend.trim(),
                full_card_text: fullCardText ? fullCardText.replace(/\n/g, ' | ') : ''
            });
        }

        console.log(`[Internship Search] Scraped ${scrapedData.length} internships.`);

        await browserContext.close();

        // Save results for user
        await saveUserSearchResults(userID, 'internships', {
            query: { city, role },
            results: scrapedData
        });

        res.json({ success: true, count: scrapedData.length, data: scrapedData });

    } catch (error) {
        console.error('[Internship Search] FULL ERROR:', error);
        console.error('[Internship Search] Error Name:', error.name);
        console.error('[Internship Search] Error Message:', error.message);
        console.error('[Internship Search] Stack:', error.stack);
        if (browserContext) {
            try {
                await browserContext.close();
            } catch (closeError) {
                console.error('[Internship Search] Error closing browser:', closeError.message);
            }
        }
        res.status(500).json({ error: error.message, details: error.toString() });
    } finally {
        activeRequests.internships.delete(userID);
        console.log(`[Internship Search] Cleanup: Removed user ${userID} from active requests`);
    }
});

// --- 3. College Search (Proxy to n8n Webhook) ---
router.post('/search-colleges', async (req, res) => {
    const { city, course, userID } = req.body;
    const startTime = Date.now();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[College Search] ========== NEW REQUEST ==========`);
    console.log(`[College Search] Time: ${new Date().toISOString()}`);
    console.log(`[College Search] User: ${userID}, City: "${city}", Course: "${course}"`);
    console.log(`${'='.repeat(60)}\n`);

    if (!city || !course) {
        console.log('[College Search] ❌ Missing city or course');
        return res.status(400).json({ error: 'City and Course are required.' });
    }

    if (!userID) {
        console.log('[College Search] ❌ Missing userID');
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Prevent duplicate requests
    if (activeRequests.colleges.has(userID)) {
        console.log(`[College Search] ⚠️ Duplicate request blocked for user ${userID}`);
        return res.status(429).json({ error: 'A college search is already in progress for this user. Please wait.' });
    }

    activeRequests.colleges.add(userID);

    const n8nUrl = 'https://escloop-n8n.escloop-gym.com.de/webhook/college-search';
    const controller = new AbortController();
    const timeoutMs = 600000; // 10 minutes
    let timeoutId = null;

    try {
        timeoutId = setTimeout(() => {
            console.log(`[College Search] ⏰ TIMEOUT after ${timeoutMs / 1000} seconds - aborting request`);
            controller.abort();
        }, timeoutMs);

        console.log(`[College Search] 🌐 Webhook URL: ${n8nUrl}`);
        console.log(`[College Search] 📦 Sending payload: ${JSON.stringify({ city, course })}`);
        console.log(`[College Search] ⏳ Waiting for n8n response (timeout: ${timeoutMs / 1000}s)...`);

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, course }),
            signal: controller.signal
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[College Search] ✅ Response received after ${elapsed}s`);
        console.log(`[College Search] 📊 Status: ${response.status} ${response.statusText}`);
        console.log(`[College Search] 📋 Headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Could not read error body');
            console.error(`[College Search] ❌ Webhook error response: ${errorBody}`);
            throw new Error(`n8n responded with ${response.status}: ${errorBody.substring(0, 200)}`);
        }

        // Safely parse webhook response
        const responseText = await response.text();
        console.log(`[College Search] 📝 Raw response length: ${responseText.length} chars`);
        console.log(`[College Search] 📝 Raw response preview: ${responseText.substring(0, 500)}...`);

        if (!responseText || responseText.trim() === '') {
            console.error('[College Search] ❌ Empty response from webhook');
            throw new Error('Empty response from webhook - n8n may not be returning data');
        }

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('[College Search] ✅ JSON parsed successfully');
            console.log('[College Search] 📊 Data type:', Array.isArray(data) ? `Array[${data.length}]` : typeof data);
        } catch (parseError) {
            console.error('[College Search] ❌ JSON parse error:', parseError.message);
            console.error('[College Search] ❌ Invalid JSON:', responseText.substring(0, 300));
            throw new Error(`Failed to parse webhook response: ${parseError.message}`);
        }

        // Parse nested response if wrapped in array with output field
        const parsedData = parseWebhookResponse(data, 'College Search');
        console.log('[College Search] ✅ Data processed successfully');

        // Save results for user
        await saveUserSearchResults(userID, 'colleges', {
            query: { city, course },
            results: parsedData
        });
        console.log('[College Search] 💾 Results saved for user');

        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[College Search] ✅ SUCCESS - Total time: ${totalElapsed}s`);
        console.log(`${'='.repeat(60)}\n`);

        res.json(parsedData);

    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n${'!'.repeat(60)}`);
        console.error(`[College Search] ❌ ERROR after ${elapsed}s`);
        console.error(`[College Search] Error Name: ${error.name}`);
        console.error(`[College Search] Error Message: ${error.message}`);

        // Specific error handling
        let userMessage = error.message;
        if (error.name === 'AbortError') {
            userMessage = 'Request timed out after 10 minutes. The n8n webhook may be taking too long or is unresponsive.';
            console.error('[College Search] ⏰ Request was aborted due to timeout');
        } else if (error.code === 'ECONNREFUSED') {
            userMessage = 'Could not connect to the n8n webhook. The server may be down.';
            console.error('[College Search] 🔌 Connection refused - n8n server may be down');
        } else if (error.code === 'ENOTFOUND') {
            userMessage = 'DNS lookup failed for the n8n webhook URL.';
            console.error('[College Search] 🌐 DNS lookup failed');
        } else if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
            userMessage = 'Connection was reset by the server. The n8n workflow may have crashed or timed out.';
            console.error('[College Search] 🔌 Connection reset by server');
        }

        console.error(`[College Search] Stack: ${error.stack}`);
        console.error(`${'!'.repeat(60)}\n`);

        res.status(500).json({
            error: userMessage,
            details: error.toString(),
            elapsed: `${elapsed}s`
        });
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
        activeRequests.colleges.delete(userID);
        console.log(`[College Search] 🧹 Cleanup complete for user ${userID}`);
    }
});

// --- GET Routes: Retrieve Saved Results ---

// Get saved job results
router.get('/jobs-results/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const results = await getUserSearchResults(userID, 'jobs');

        if (results) {
            res.json(results);
        } else {
            res.status(404).json({ error: 'No saved job results found' });
        }
    } catch (error) {
        console.error('[Get Jobs] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get saved internship results
router.get('/internships-results/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const results = await getUserSearchResults(userID, 'internships');

        if (results) {
            res.json(results);
        } else {
            res.status(404).json({ error: 'No saved internship results found' });
        }
    } catch (error) {
        console.error('[Get Internships] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get saved college results
router.get('/colleges-results/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const results = await getUserSearchResults(userID, 'colleges');

        if (results) {
            res.json(results);
        } else {
            res.status(404).json({ error: 'No saved college results found' });
        }
    } catch (error) {
        console.error('[Get Colleges] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

