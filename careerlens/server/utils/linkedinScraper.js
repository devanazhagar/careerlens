const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Enable stealth
chromium.use(stealth());

// ⚠️ IMPORTANT: Point this to the folder for saved profile
// Using double backslashes for Windows path in JS string
const USER_DATA_DIR = "C:\\selenium\\ChromeProfile";

const humanDelay = async (page, min = 1000, max = 3000) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    if (page) await page.waitForTimeout(delay);
};

async function scrapeProfile(targetUrl) {
    console.log("Launching Chrome with saved profile...");
    let browserContext = null;
    let page = null;

    try {
        // 1. LAUNCH PERSISTENT CONTEXT
        browserContext = await chromium.launchPersistentContext(USER_DATA_DIR, {
            headless: true,        // Headless mode
            channel: "chrome",     // Use real Google Chrome
            args: [
                "--start-maximized",
                "--disable-blink-features=AutomationControlled"
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
        } catch (e) {
            console.log("⚠️ Not logged in. Please log in manually in the popup window.");
            // We can't really ask user to login in headless backend process easily, 
            // but we'll leave the logic here in case they run it locally with headless:false for debugging
            throw new Error("LinkedIn session inactive. Please login to LinkedIn in the Chrome Profile first.");
        }

        const results = {};

        // --- STEP 2: GO TO PROFILE ---
        console.log(`Navigating to Profile: ${targetUrl}...`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
        await humanDelay(page, 2000, 4000);

        // Capture URL
        let profileUrl = page.url().replace(/\/$/, "");
        results.profileUrl = profileUrl;

        // --- STEP 3: SCROLL TO LOAD ---
        console.log("Scrolling page...");
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await humanDelay(page, 2000, 3000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await humanDelay(page, 1000, 2000);

        // --- STEP 4: SCRAPE BASIC INFO - RAW DATA ---
        console.log("Scraping Main Info (RAW)...");

        // Name
        try {
            results.name = await page.locator('h1').first().innerText();
        } catch (e) { results.name = "Unknown"; }

        // About
        try {
            const aboutContainer = await page.locator('section:has(#about)').innerText();
            results.about = aboutContainer || "No About section found";
        } catch (e) {
            results.about = "Error scraping about section";
        }

        // --- STEP 5: RECENT ACTIVITY ---
        const activityUrl = `${profileUrl}/recent-activity/all/`;
        console.log(`Navigating to Activity: ${activityUrl}`);
        await page.goto(activityUrl, { waitUntil: 'domcontentloaded' });
        await humanDelay(page, 2000, 4000);

        try {
            const posts = await page.evaluate(() => {
                const postElements = document.querySelectorAll('.feed-shared-update-v2');
                return Array.from(postElements).map(post => post.innerText.trim());
            });
            results.recentActivity = posts.length ? posts : ["No recent activity found"];
        } catch (e) {
            results.recentActivity = ["Error scraping activity"];
        }

        // --- STEP 6: CERTIFICATIONS ---
        const certificationsUrl = `${profileUrl}/details/certifications/`;
        console.log(`Navigating to Certifications: ${certificationsUrl}`);
        await page.goto(certificationsUrl, { waitUntil: 'domcontentloaded' });
        await humanDelay(page, 2000, 4000);

        try {
            const certifications = await page.evaluate(() => {
                const items = document.querySelectorAll('.pvs-list__paged-list-item');
                return Array.from(items).map(item => item.innerText.trim());
            });
            results.certifications = certifications.length ? certifications : ["No certifications found"];
        } catch (e) {
            results.certifications = ["Error scraping certifications"];
        }

        // --- STEP 7: SKILLS ---
        const skillsUrl = `${profileUrl}/details/skills/`;
        console.log(`Navigating to Skills: ${skillsUrl}`);
        await page.goto(skillsUrl, { waitUntil: 'domcontentloaded' });
        await humanDelay(page, 2000, 4000);

        try {
            const skills = await page.evaluate(() => {
                const items = document.querySelectorAll('.pvs-list__paged-list-item');
                return Array.from(items).map(item => item.innerText.trim());
            });
            results.skills = skills.length ? skills : ["No skills found"];
        } catch (e) {
            results.skills = ["Error scraping skills"];
        }

        return results;

    } catch (error) {
        console.error("Scraping Error:", error);
        throw error;
    } finally {
        if (browserContext) {
            console.log("Closing browser...");
            await browserContext.close();
        }
    }
}

module.exports = { scrapeProfile };
