require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const PORT = 3000;

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
    // Locks (often noisy) - user said "remove unwanted stuff", but lock files are signatures?
    // Leaving lock files IN tree for signatures, but maybe ignoring from output?
    // User said "remove every files where the name include the ignoredFiles", which implies stack specific.
    // I'll stick to Binary/Media for global.
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
            'node_modules',
            'dist',
            'build',
            '.next',
            '.nuxt',
            '.cache',
            'coverage',
            'public',
            '.vercel'
        ],
        ignoredFiles: [
            '.env',
            '.env.local',
            '.DS_Store',
            'npm-debug.log',
            'yarn-error.log'
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
            '__pycache__',
            'venv',
            '.venv',
            'env',
            '.env',
            '.pytest_cache',
            '.mypy_cache',
            'dist',
            'build'
        ],
        ignoredFiles: [
            '*.pyc',
            '.DS_Store'
        ]
    },

    java: {
        signatures: ['pom.xml', 'build.gradle'],
        interestingFiles: ['pom.xml', 'build.gradle', 'Dockerfile'],
        interestingExtensions: ['.java', '.properties', '.yml'],
        ignoredDirectories: [
            'target',
            'build',
            '.gradle',
            '.idea',
            'out'
        ],
        ignoredFiles: [
            '*.class',
            '.DS_Store'
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
            'vendor',
            'bin',
            'dist'
        ],
        ignoredFiles: [
            '*.exe',
            '*.out',
            '.DS_Store'
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
            'vendor',
            'node_modules',
            'storage',
            'bootstrap/cache'
        ],
        ignoredFiles: [
            '.env',
            '.DS_Store'
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
            'vendor',
            '.bundle',
            'log',
            'tmp'
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
            'build',
            'bin',
            'obj',
            '.vs'
        ],
        ignoredFiles: [
            '*.o',
            '*.exe',
            '.DS_Store'
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
            'build',
            '.dart_tool',
            '.flutter-plugins'
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
            '.git',
            'node_modules',
            'dist',
            'build'
        ],
        ignoredFiles: [
            '.env',
            '.DS_Store'
        ]
    }
};



// Serve static files (HTML/CSS/JS) from a 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));

// Explicitly serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 1. LOGIN FLOW ---
app.get('/login', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code
        }, { headers: { accept: 'application/json' } });

        const token = response.data.access_token;
        // Redirect to the dashboard and pass the token in the URL (Simple method for demo)
        res.redirect(`/?token=${token}`);
    } catch (error) {
        res.send("Login Failed");
    }
});

// --- 2. API ENDPOINTS (The Logic from fetch_data.js) ---

// API: Get List of Repos
app.get('/api/repos', async (req, res) => {
    const token = req.headers.authorization;
    try {
        const response = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: { Authorization: token }
        });
        res.json(response.data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Get File Tree for one Repo
app.get('/api/files', async (req, res) => {
    const token = req.headers.authorization;
    const { owner, repo, branch } = req.query;
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await axios.get(url, { headers: { Authorization: token } });

        // Filter: Keep only files (blobs), remove folders/images for cleaner UI
        const files = response.data.tree.filter(item => item.type === 'blob');
        res.json(files);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Get Content of a specific File
app.post('/api/content', async (req, res) => {
    const token = req.headers.authorization;
    const { url } = req.body; // The GitHub API URL for the blob
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: token,
                Accept: 'application/vnd.github.v3.raw' // Returns raw text
            }
        });
        res.send(response.data); // Send text back
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API: Detect Stack and Find Interesting Files
app.get('/api/detect-stack', async (req, res) => {
    const token = req.headers.authorization;
    const { owner, repo, branch } = req.query;

    try {
        // Fetch the file tree
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const response = await axios.get(url, { headers: { Authorization: token } });

        // Filter: Keep only files (blobs), remove folders/images
        // AND CRITICAL: Exclude anything in node_modules
        const allFiles = response.data.tree.filter(item =>
            item.type === 'blob' &&
            !item.path.includes('node_modules/')
        );

        // Extract just the paths for easier searching
        const filePaths = allFiles.map(f => f.path);

        // Loop through STACK_SIGNATURES to detect stack
        let detectedStack = null;
        let interestingFilesFound = [];

        for (const [stackName, stackConfig] of Object.entries(STACK_SIGNATURES)) {
            // Check if any signature file exists (dynamic search - can be nested)
            const hasSignature = stackConfig.signatures.some(sig =>
                filePaths.some(path => path.endsWith(sig) || path.includes(`/${sig}`))
            );

            if (hasSignature) {
                detectedStack = stackName;

                // CORE LOGIC: Find interesting files
                if (stackName === 'node_js' || stackName === 'docker_devops') {
                    // Smart Matching for JS/TS & Docker: 
                    // Match by NAME (basename) + valid EXTENSION

                    interestingFilesFound = allFiles.filter(file => {
                        const path = file.path;
                        const fileName = path.split('/').pop(); // "index.js"
                        const baseName = fileName.substring(0, fileName.lastIndexOf('.')); // "index"
                        const extension = fileName.substring(fileName.lastIndexOf('.')); // ".js"

                        // 1. Check exact matches (e.g. package.json, Dockerfile)
                        const isExactMatch = stackConfig.interestingFiles.some(interesting =>
                            path.endsWith(interesting) || path.includes(`/${interesting}`)
                        );

                        if (isExactMatch) return true;

                        // 2. Smart Extension Expansion
                        // If we have "index.js" in our list, we want "index.ts", "index.tsx", etc.
                        // But ONLY if the base name matches one of our interesting files' base names
                        if (stackConfig.interestingExtensions && stackConfig.interestingExtensions.includes(extension)) {
                            // Check if the BASE name (e.g. "index", "app", "server") represents an interesting file
                            return stackConfig.interestingFiles.some(interesting => {
                                const interestingBase = interesting.substring(0, interesting.lastIndexOf('.')); // "index" from "index.js"
                                return interestingBase === baseName && interestingBase.length > 0;
                            });
                        }
                        return false;
                    });

                } else {
                    // Default Logic for other stacks (Python, etc.)
                    interestingFilesFound = allFiles.filter(file => {
                        const path = file.path;

                        // Check if file matches interesting files list (exact or nested)
                        const matchesInterestingFile = stackConfig.interestingFiles.some(interesting =>
                            path.endsWith(interesting) || path.includes(`/${interesting}`)
                        );

                        // Check if file has interesting extension (fallback for others)
                        const matchesExtension = stackConfig.interestingExtensions &&
                            stackConfig.interestingExtensions.some(ext => path.endsWith(ext));

                        return matchesInterestingFile || matchesExtension;
                    });
                }

                // Sort interesting files: exact matches first, then by path length
                interestingFilesFound.sort((a, b) => {
                    const aIsExact = stackConfig.interestingFiles.some(i => a.path.endsWith(i));
                    const bIsExact = stackConfig.interestingFiles.some(i => b.path.endsWith(i));

                    if (aIsExact && !bIsExact) return -1;
                    if (!aIsExact && bIsExact) return 1;
                    return a.path.length - b.path.length;
                });

                break; // Stop at first match
            }
        }

        // Limit to top 20 to avoid payload issues
        const limitedFiles = interestingFilesFound.slice(0, 20); // Top 20 most relevant

        // FILTER THE FULL FILE TREE FOR OUTPUT
        // Only keep files that are NOT in ignored directories or matching ignored files/global ignores
        let filteredTree = [];
        if (detectedStack) {
            const stackConfig = STACK_SIGNATURES[detectedStack];
            filteredTree = allFiles.filter(file => {
                const path = file.path;
                const fileName = path.split('/').pop();

                // 1. Global Ignores (Extensions)
                if (GLOBAL_IGNORES.some(ext => fileName.toLowerCase().endsWith(ext))) return false;

                // 2. Stack Specific Ignored Directories
                if (stackConfig.ignoredDirectories &&
                    stackConfig.ignoredDirectories.some(dir => path.includes(`${dir}/`) || path.startsWith(`${dir}/`))) {
                    return false;
                }

                // 3. Stack Specific Ignored Files (Exact Name or Globs-ish)
                if (stackConfig.ignoredFiles &&
                    stackConfig.ignoredFiles.some(ignore => {
                        if (ignore.startsWith('*')) return fileName.endsWith(ignore.slice(1));
                        return fileName === ignore;
                    })) {
                    return false;
                }

                return true;
            }).map(f => f.path);
        }

        res.json({
            detectedStack: detectedStack,
            interestingFiles: limitedFiles.map(f => ({ path: f.path, url: f.url })),
            fileTree: filteredTree
        });

    } catch (error) {
        console.error('Error in detect-stack:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Get Content of Multiple Files
app.post('/api/interesting-files-content', async (req, res) => {
    console.log('=== POST /api/interesting-files-content ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files received:', req.body?.files);

    const token = req.headers.authorization;
    const { files, owner, repo, detectedStack, fileTree } = req.body; // Array of { path, url } + metadata

    // Validate input
    if (!files || !Array.isArray(files)) {
        console.log('ERROR: Invalid files parameter');
        return res.status(400).json({ error: 'Invalid request: files array is required' });
    }

    if (files.length === 0) {
        console.log('No files to fetch, returning empty array');
        return res.json([]);
    }

    console.log(`Fetching ${files.length} files...`);

    try {
        const fileContents = await Promise.all(
            files.map(async (file) => {
                try {
                    const response = await axios.get(file.url, {
                        headers: {
                            Authorization: token,
                            Accept: 'application/vnd.github.v3.raw'
                        }
                    });
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

        // Save to output.json (only successful files, no errors)
        if (owner && repo && detectedStack) {
            const successfulFiles = fileContents.filter(f => f.error === null);

            const outputData = {
                repoName: `${owner}/${repo}`,
                detectedStack: detectedStack,
                timestamp: new Date().toISOString(),
                totalFiles: successfulFiles.length,
                fileTree: fileTree || [],
                files: successfulFiles.map(f => {
                    let formattedContent = f.content;

                    // Format content as array of lines for readability in JSON
                    if (typeof formattedContent === 'string') {
                        formattedContent = formattedContent.split(/\r?\n/);
                    } else if (typeof formattedContent === 'object' && formattedContent !== null) {
                        // If it's a JSON object, pretty print it and then split into lines
                        formattedContent = JSON.stringify(formattedContent, null, 2).split(/\r?\n/);
                    }

                    return {
                        path: f.path,
                        content: formattedContent
                    };
                })
            };

            // Write to output.json
            const outputPath = path.join(__dirname, 'output.json');
            fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
            console.log(`✅ Saved analysis to ${outputPath}`);
        }

        res.json(fileContents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));