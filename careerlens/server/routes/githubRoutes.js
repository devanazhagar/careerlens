const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/user');

const GLOBAL_IGNORES = [
    // Media
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp',
    '.mp4', '.mov', '.avi', '.mkv',
    '.mp3', '.wav', '.ogg',
    // Fonts
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    // Archives/Binaries
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.exe', '.dll', '.so', '.dylib', '.class', '.o',
];

const STACK_SIGNATURES = {
    node_js: {
        signatures: ['package.json', 'yarn.lock', 'pnpm-lock.yaml'],
        interestingFiles: [
            'package.json',
            'server.js', 'app.js', 'index.js', 'main.js',
            'vite.config.js', 'next.config.js', 'webpack.config.js',
            '.eslintrc', '.eslintrc.json', 'tsconfig.json'
        ],
        interestingExtensions: ['.js', '.jsx', '.ts', '.tsx'],
        ignoredDirectories: [
            'node_modules', 'dist', 'build', '.next', '.nuxt', '.cache', 'coverage', 'public', '.vercel'
        ],
        ignoredFiles: [
            '.env', '.env.local', '.DS_Store', 'npm-debug.log', 'yarn-error.log'
        ]
    },
    python: {
        signatures: ['requirements.txt', 'Pipfile', 'pyproject.toml', 'manage.py'],
        interestingFiles: [
            'requirements.txt', 'Pipfile', 'pyproject.toml',
            'manage.py', 'app.py', 'main.py', 'wsgi.py', 'settings.py'
        ],
        interestingExtensions: ['.py'],
        ignoredDirectories: [
            '__pycache__', 'venv', '.venv', 'env', '.env', '.pytest_cache', '.mypy_cache', 'dist', 'build'
        ],
        ignoredFiles: [
            '*.pyc', '.DS_Store'
        ]
    },
    java: {
        signatures: ['pom.xml', 'build.gradle'],
        interestingFiles: ['pom.xml', 'build.gradle', 'Dockerfile'],
        interestingExtensions: ['.java', '.properties', '.yml'],
        ignoredDirectories: [
            'target', 'build', '.gradle', '.idea', 'out'
        ],
        ignoredFiles: [
            '*.class', '.DS_Store'
        ]
    },
    go: {
        signatures: ['go.mod', 'main.go'],
        interestingFiles: [
            'go.mod', 'go.sum',
            'main.go', 'app.go',
            'Makefile', 'Dockerfile'
        ],
        interestingExtensions: ['.go'],
        ignoredDirectories: [
            'vendor', 'bin', 'dist'
        ],
        ignoredFiles: [
            '*.exe', '*.out', '.DS_Store'
        ]
    },
    rust: {
        signatures: ['Cargo.toml', 'Cargo.lock'],
        interestingFiles: [
            'Cargo.toml',
            'main.rs', 'lib.rs',
            'build.rs'
        ],
        interestingExtensions: ['.rs'],
        ignoredDirectories: [
            'target'
        ],
        ignoredFiles: [
            '.DS_Store'
        ]
    },
    php: {
        signatures: ['composer.json', 'artisan', 'index.php'],
        interestingFiles: [
            'composer.json',
            'artisan',
            'wp-config.php',
            'index.php', 'server.php',
            '.env.example', 'phpunit.xml'
        ],
        interestingExtensions: ['.php'],
        ignoredDirectories: [
            'vendor', 'node_modules', 'storage', 'bootstrap/cache'
        ],
        ignoredFiles: [
            '.env', '.DS_Store'
        ]
    },
    ruby: {
        signatures: ['Gemfile', 'Rakefile', 'config.ru'],
        interestingFiles: [
            'Gemfile', 'Gemfile.lock',
            'config.ru', 'Rakefile',
            'application.rb', 'routes.rb',
            'seeds.rb'
        ],
        interestingExtensions: ['.rb', '.erb', '.rake'],
        ignoredDirectories: [
            'vendor', '.bundle', 'log', 'tmp'
        ],
        ignoredFiles: [
            '.DS_Store'
        ]
    },
    c_cpp: {
        signatures: ['CMakeLists.txt', 'Makefile', 'configure.ac'],
        interestingFiles: [
            'CMakeLists.txt', 'Makefile',
            'main.c', 'main.cpp',
            'header.h', 'interface.hpp'
        ],
        interestingExtensions: ['.c', '.cpp', '.h', '.hpp', '.cc'],
        ignoredDirectories: [
            'build', 'bin', 'obj', '.vs'
        ],
        ignoredFiles: [
            '*.o', '*.exe', '.DS_Store'
        ]
    },
    flutter_dart: {
        signatures: ['pubspec.yaml'],
        interestingFiles: [
            'pubspec.yaml',
            'main.dart',
            'analysis_options.yaml'
        ],
        interestingExtensions: ['.dart'],
        ignoredDirectories: [
            'build', '.dart_tool', '.flutter-plugins'
        ],
        ignoredFiles: [
            '.DS_Store'
        ]
    },
    docker_devops: {
        signatures: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        interestingFiles: [
            'Dockerfile',
            'docker-compose.yml', 'docker-compose.yaml',
            'nginx.conf',
            'Jenkinsfile',
            '.gitlab-ci.yml',
            '.github/workflows/main.yml'
        ],
        interestingExtensions: ['.yaml', '.yml', '.conf', '.sh'],
        ignoredDirectories: [
            '.git', 'node_modules', 'dist', 'build'
        ],
        ignoredFiles: [
            '.env', '.DS_Store'
        ]
    }
};

// --- LOGIC FUNCTIONS ---

async function detectStackAndFiles(owner, repo, branch, token) {
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await axios.get(url, { headers: { Authorization: `token ${token}` } });

        console.log(`[GitHub API] Trees Remaining: ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']}`);

        const allFiles = response.data.tree.filter(item =>
            item.type === 'blob' && !item.path.includes('node_modules/')
        );
        const filePaths = allFiles.map(f => f.path);

        let detectedStack = null;
        let interestingFilesFound = [];
        let filteredTree = []; // To store the filtered file list

        for (const [stackName, stackConfig] of Object.entries(STACK_SIGNATURES)) {
            const hasSignature = stackConfig.signatures.some(sig =>
                filePaths.some(path => path.endsWith(sig) || path.includes(`/${sig}`))
            );

            if (hasSignature) {
                detectedStack = stackName;

                // --- 1. Find Interesting Files (Existing Logic) ---
                if (stackName === 'node_js' || stackName === 'docker_devops') {
                    interestingFilesFound = allFiles.filter(file => {
                        const path = file.path;
                        const fileName = path.split('/').pop();
                        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
                        const extension = fileName.substring(fileName.lastIndexOf('.'));

                        const isExactMatch = stackConfig.interestingFiles.some(interesting =>
                            path.endsWith(interesting) || path.includes(`/${interesting}`)
                        );
                        if (isExactMatch) return true;

                        if (stackConfig.interestingExtensions && stackConfig.interestingExtensions.includes(extension)) {
                            return stackConfig.interestingFiles.some(interesting => {
                                const interestingBase = interesting.substring(0, interesting.lastIndexOf('.'));
                                return interestingBase === baseName && interestingBase.length > 0;
                            });
                        }
                        return false;
                    });
                } else {
                    interestingFilesFound = allFiles.filter(file => {
                        const path = file.path;
                        const matchesInterestingFile = stackConfig.interestingFiles.some(interesting =>
                            path.endsWith(interesting) || path.includes(`/${interesting}`)
                        );
                        const matchesExtension = stackConfig.interestingExtensions &&
                            stackConfig.interestingExtensions.some(ext => path.endsWith(ext));
                        return matchesInterestingFile || matchesExtension;
                    });
                }

                // Sort Interesting Files
                interestingFilesFound.sort((a, b) => {
                    const aIsExact = stackConfig.interestingFiles.some(i => a.path.endsWith(i));
                    const bIsExact = stackConfig.interestingFiles.some(i => b.path.endsWith(i));
                    if (aIsExact && !bIsExact) return -1;
                    if (!aIsExact && bIsExact) return 1;
                    return a.path.length - b.path.length;
                });

                // --- 2. Create Search-Optimized File Tree (New Logic) ---
                filteredTree = allFiles.filter(file => {
                    const path = file.path;
                    const fileName = path.split('/').pop();

                    // Global Ignores
                    if (GLOBAL_IGNORES.some(ext => fileName.toLowerCase().endsWith(ext))) return false;

                    // Stack Specific Ignored Directories
                    if (stackConfig.ignoredDirectories &&
                        stackConfig.ignoredDirectories.some(dir => path.includes(`${dir}/`) || path.startsWith(`${dir}/`))) {
                        return false;
                    }

                    // Stack Specific Ignored Files
                    if (stackConfig.ignoredFiles &&
                        stackConfig.ignoredFiles.some(ignore => {
                            if (ignore.startsWith('*')) return fileName.endsWith(ignore.slice(1));
                            return fileName === ignore;
                        })) {
                        return false;
                    }
                    return true;
                }).map(f => f.path);

                break;
            }
        }

        const limitedFiles = interestingFilesFound.slice(0, 20);
        return {
            detectedStack,
            interestingFiles: limitedFiles.map(f => ({ path: f.path, url: f.url })),
            fileTree: filteredTree
        };

    } catch (error) {
        console.error(`Error detecting stack for ${repo}:`, error.message);
        return { detectedStack: null, interestingFiles: [], fileTree: [] };
    }
}

async function fetchFileContents(files, token) {
    if (!files || files.length === 0) return [];

    return await Promise.all(
        files.map(async (file) => {
            try {
                const response = await axios.get(file.url, {
                    headers: {
                        Authorization: `token ${token}`,
                        Accept: 'application/vnd.github.v3.raw'
                    }
                });
                console.log(`[GitHub API] File Fetch Remaining: ${response.headers['x-ratelimit-remaining']}`);
                return {
                    path: file.path,
                    content: response.data,
                    error: null
                };
            } catch (error) {
                return {
                    path: file.path,
                    content: null,
                    error: error.message
                };
            }
        })
    );
}

// --- ROUTES ---

// 1. Login
router.get('/login', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
    res.redirect(url);
});

// 2. Callback
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, { headers: { accept: 'application/json' } });

        const token = response.data.access_token;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Redirect to dashboard with token
        res.redirect(`${frontendUrl}/dashboard?githubToken=${token}`);
    } catch (error) {
        console.error("Login Failed:", error);
        res.status(500).send("Login Failed");
    }
});

// 3. Save Token
router.post('/save-token', async (req, res) => {
    const { userID, token } = req.body;
    if (!userID || !token) return res.status(400).json({ success: false, message: "Missing userID or token" });

    try {
        await User.findByIdAndUpdate(userID, { githubAccessToken: token }, { new: true });
        res.json({ success: true, message: "GitHub token saved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Analyze Last 5 Repos (Chain: GitHub -> Webhook 1 -> LinkedIn Scrape -> Webhook 2)
router.post('/analyze-repos', async (req, res) => {
    const { userID } = req.body;
    // Import LinkedIn Scraper
    let scrapeProfile;
    try {
        scrapeProfile = require('../utils/linkedinScraper').scrapeProfile;
    } catch (e) {
        console.error("LinkedIn Scraper missing or invalid:", e);
    }

    try {
        // --- 1. Fetch User Data ---
        const user = await User.findById(userID);
        if (!user || !user.githubAccessToken) {
            return res.status(401).json({ success: false, message: "User not found or no GitHub token" });
        }
        const token = user.githubAccessToken;
        const linkedinUrl = user.userLinkedinProfileUrl; // Updated field name based on user model

        // --- 2. Perform GitHub Analysis ---
        const reposRes = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=5', {
            headers: { Authorization: `token ${token}` }
        });
        console.log(`[GitHub API] Repos List Remaining: ${reposRes.headers['x-ratelimit-remaining']}`);
        const repos = reposRes.data;
        const githubResults = [];

        for (const repo of repos) {
            console.log(`Analyzing GitHub Repo: ${repo.name}...`);
            const { detectedStack, interestingFiles, fileTree } = await detectStackAndFiles(repo.owner.login, repo.name, repo.default_branch, token);
            let fileContents = [];
            if (interestingFiles.length > 0) {
                fileContents = await fetchFileContents(interestingFiles, token);
            }
            githubResults.push({
                repo: repo.name,
                owner: repo.owner.login,
                detectedStack,
                fileTree,
                files: fileContents.filter(f => !f.error)
            });
        }

        // --- 3. Send to Webhook 1 (GitHub Analysis) ---
        console.log("Sending to GitHub Webhook...");
        console.log(`Payload size: ${JSON.stringify(githubResults).length} characters`);
        // console.log("Payload snapshot:", JSON.stringify(githubResults).slice(0, 500)); 

        let githubReview = "Github analysis failed or returned no review.";
        try {
            const webhook1Res = await axios.post('https://escloop-n8n.escloop-gym.com.de/webhook/github-analyzer', githubResults);

            console.log("GitHub Webhook Response Status:", webhook1Res.status);
            console.log("GitHub Webhook Response Data Type:", typeof webhook1Res.data);
            console.log("GitHub Webhook Response Data:", JSON.stringify(webhook1Res.data, null, 2));

            // Assuming webhook returns the review in 'output' field of first item or similar, based on user description
            // User said: [ { "output": "..." } ]
            if (Array.isArray(webhook1Res.data) && webhook1Res.data.length > 0 && webhook1Res.data[0].output) {
                githubReview = webhook1Res.data[0].output;
                console.log("Extracted GitHub Review from Array[0].output");
            } else if (webhook1Res.data.output) {
                githubReview = webhook1Res.data.output;
                console.log("Extracted GitHub Review from Data.output");
            } else {
                console.warn("Could not extract 'output' field from GitHub Webhook response. Using default failure message.");
            }
        } catch (webhookError) {
            console.error("GitHub Webhook Error:", webhookError.message);
            if (webhookError.response) {
                console.error("Webhook Error Response Data:", webhookError.response.data);
                console.error("Webhook Error Response Status:", webhookError.response.status);
            }
        }

        // --- 4. Scrape LinkedIn (if URL exists) ---
        let linkedinData = { error: "No LinkedIn URL found for this user." };
        if (linkedinUrl && scrapeProfile) {
            console.log(`Scraping LinkedIn Profile: ${linkedinUrl}...`);
            try {
                linkedinData = await scrapeProfile(linkedinUrl);
                console.log("LinkedIn Scraping success.");
            } catch (scrapeError) {
                console.error("LinkedIn Scraping Error:", scrapeError.message);
                linkedinData = { error: scrapeError.message };
            }
        }

        // --- 5. Send to Webhook 2 (Final Combined Analysis) ---
        console.log("Sending to Final Webhook...");

        const finalPayload = {
            githubReview: githubReview,
            linkedinData: linkedinData
        };
        console.log("Final Payload Keys:", Object.keys(finalPayload));

        let finalReview = { success: true, message: "Analysis complete", data: finalPayload };

        try {
            const webhook2Res = await axios.post('https://escloop-n8n.escloop-gym.com.de/webhook/linkedin-analyzer', finalPayload);

            console.log("Final Webhook Response Status:", webhook2Res.status);
            console.log("Final Webhook Response Data:", JSON.stringify(webhook2Res.data, null, 2));

            // Assuming final webhook returns the final review for display
            if (Array.isArray(webhook2Res.data) && webhook2Res.data.length > 0) {
                finalReview = webhook2Res.data[0];
            } else {
                finalReview = webhook2Res.data;
            }
            console.log("Final Webhook success.");
        } catch (webhook2Error) {
            console.error("Final Webhook Error:", webhook2Error.message);
            if (webhook2Error.response) {
                console.error("Final Webhook Error Data:", webhook2Error.response.data);
            }
        }

        // --- 6. Return Final Result to Frontend ---
        res.json({ success: true, data: finalReview });

    } catch (error) {
        console.error("Analysis Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
