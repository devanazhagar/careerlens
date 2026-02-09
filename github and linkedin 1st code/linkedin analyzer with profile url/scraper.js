// scraper.js - Persistent Context Mode with Raw Data Extraction
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Enable stealth
chromium.use(stealth());

let browserContext; // We use 'context' instead of 'browser' for persistent profiles
let page;

// ⚠️ IMPORTANT: Point this to the folder for saved profile
const USER_DATA_DIR = "C:\\selenium\\ChromeProfile";

const humanDelay = async (min = 1000, max = 3000) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    if (page) await page.waitForTimeout(delay);
};

async function startBrowserAndLogin() {
    console.log("Launching Chrome with saved profile...");

    // 1. LAUNCH PERSISTENT CONTEXT
    // This opens Chrome using your saved folder. You do NOT need to open it manually.
    browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: true,        // Headless mode - browser runs invisibly
        channel: "chrome",     // Use real Google Chrome
        args: [
            "--start-maximized",
            "--disable-blink-features=AutomationControlled" // Hide automation signals
        ],
        viewport: null
    });

    // Get the first page
    page = browserContext.pages()[0] || await browserContext.newPage();

    console.log("Checking login status...");
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded' });

    // Check if we are logged in
    try {
        await page.waitForSelector('.global-nav__content', { timeout: 5000 });
        console.log("✅ Logged in automatically!");
        return { message: "Ready to scrape." };
    } catch (e) {
        console.log("⚠️ Not logged in. Please log in manually in the popup window.");
        // If not logged in, wait for user to do it
        await page.waitForSelector('.global-nav__content', { timeout: 0 });
        console.log("✅ Login detected!");
        return { message: "Login detected! Ready." };
    }
}

async function scrapeProfile(targetUrl) {
    if (!page) {
        console.log("Browser not connected. Attempting auto-connection...");
        try {
            await startBrowserAndLogin();
        } catch (e) {
            throw new Error("Browser not connected. Please click 'Login' first.");
        }
    }

    if (!page) {
        throw new Error("Browser connected but page not initialized.");
    }

    const results = {};

    // --- STEP 2: GO TO PROFILE ---
    console.log(`Navigating to Profile: ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await humanDelay(2000, 4000);

    // Capture URL
    let profileUrl = page.url().replace(/\/$/, ""); // Remove trailing slash
    results.profileUrl = profileUrl;

    // --- STEP 3: SCROLL TO LOAD ---
    console.log("Scrolling page...");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await humanDelay(2000, 3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await humanDelay(1000, 2000);

    // --- STEP 4: SCRAPE BASIC INFO - RAW DATA ---
    console.log("Scraping Main Info (RAW)...");

    // Name
    try {
        results.name = await page.locator('h1').first().innerText();
    } catch (e) { results.name = "Unknown"; }

    // About - Get ALL text from the about section without filtering
    try {
        // Look for the about section container and get all text
        const aboutContainer = await page.locator('section:has(#about)').innerText();
        results.about = aboutContainer || "No About section found";
    } catch (e) {
        results.about = "Error scraping about section";
    }

    console.log(`--- PROFILE DATA ---\nName: ${results.name}\n--------------------`);

    // --- STEP 5: RECENT ACTIVITY ---
    const activityUrl = `${profileUrl}/recent-activity/all/`;
    console.log(`Navigating to Activity: ${activityUrl}`);
    await page.goto(activityUrl, { waitUntil: 'domcontentloaded' });
    await humanDelay(2000, 4000);

    try {
        // Get all activity posts without filtering
        const posts = await page.evaluate(() => {
            const postElements = document.querySelectorAll('.feed-shared-update-v2');
            return Array.from(postElements).map(post => post.innerText.trim());
        });
        results.recentActivity = posts.length ? posts : ["No recent activity found"];
        console.log("--- RECENT ACTIVITY ---");
        console.log(`Found ${posts.length} posts`);
    } catch (e) {
        results.recentActivity = ["Error scraping activity"];
        console.log("Could not scrape activity");
    }

    // --- STEP 6: CERTIFICATIONS - RAW DATA ---
    const certificationsUrl = `${profileUrl}/details/certifications/`;
    console.log(`Navigating to Certifications: ${certificationsUrl}`);
    await page.goto(certificationsUrl, { waitUntil: 'domcontentloaded' });
    await humanDelay(2000, 4000);

    try {
        // Get all certification items without filtering specific spans
        const certifications = await page.evaluate(() => {
            const items = document.querySelectorAll('.pvs-list__paged-list-item');
            return Array.from(items).map(item => item.innerText.trim());
        });
        results.certifications = certifications.length ? certifications : ["No certifications found"];
        console.log("--- CERTIFICATIONS ---");
        console.log(`Found ${certifications.length} certifications`);
    } catch (e) {
        results.certifications = ["Error scraping certifications"];
        console.log("Could not scrape certifications");
    }

    // --- STEP 7: SKILLS - RAW DATA ---
    const skillsUrl = `${profileUrl}/details/skills/`;
    console.log(`Navigating to Skills: ${skillsUrl}`);
    await page.goto(skillsUrl, { waitUntil: 'domcontentloaded' });
    await humanDelay(2000, 4000);

    try {
        // Get all skill items without filtering
        const skills = await page.evaluate(() => {
            const items = document.querySelectorAll('.pvs-list__paged-list-item');
            return Array.from(items).map(item => item.innerText.trim());
        });
        results.skills = skills.length ? skills : ["No skills found"];
        console.log("--- SKILLS ---");
        console.log(`Found ${skills.length} skills`);
    } catch (e) {
        results.skills = ["Error scraping skills"];
        console.log("Could not scrape skills");
    }

    // --- SAVE TO JSON FILE ---
    console.log("Saving data to output.json...");
    fs.writeFileSync('output.json', JSON.stringify(results, null, 2));
    console.log("✅ Data saved successfully!");

    return results;
}

async function closeBrowser() {
    if (browserContext) {
        console.log("Closing browser...");
        await browserContext.close(); // This closes the window completely
        browserContext = null;
        page = null;
        return { message: "Browser closed." };
    }
    return { message: "No browser open." };
}

module.exports = { startBrowserAndLogin, scrapeProfile, closeBrowser };
