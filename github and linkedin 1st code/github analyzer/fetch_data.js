const axios = require('axios');

// 1. PASTE YOUR NEW TOKEN HERE
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; 

// Helper function to set up headers automatically
const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `token ${ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
    }
});

async function main() {
    try {
        // --- STEP 1: Get User's Repositories ---
        console.log("1. Fetching Repositories...");
        const reposResponse = await githubApi.get('/user/repos?sort=updated&per_page=5');
        
        const repos = reposResponse.data;
        if (repos.length === 0) {
            console.log("No repos found.");
            return;
        }

        // Just for demo: We will pick the FIRST repository in the list
        // In your real SaaS, you would let the user click one from a list.
        const selectedRepo = repos[0]; 
        console.log(`\n> Selected Repo: ${selectedRepo.name}`);
        console.log(`> Owner: ${selectedRepo.owner.login}`);
        console.log(`> Default Branch: ${selectedRepo.default_branch}`);

        // --- STEP 2: Get All Files in that Repo (Recursive Tree) ---
        // We use the "Git Tree" API because it's faster and gets nested files instantly
        console.log(`\n2. Fetching file list for ${selectedRepo.name}...`);
        
        const treeUrl = `/repos/${selectedRepo.owner.login}/${selectedRepo.name}/git/trees/${selectedRepo.default_branch}?recursive=1`;
        const treeResponse = await githubApi.get(treeUrl);
        
        const allFiles = treeResponse.data.tree;
        
        // Filter out folders, only keep "blob" (files)
        // Also let's ignore images or lock files for this demo
        const codeFiles = allFiles.filter(item => 
            item.type === 'blob' && 
            (item.path.endsWith('.js') || item.path.endsWith('.py') || item.path.endsWith('.json'))
        );

        console.log(`> Found ${codeFiles.length} code files.`);
        
        // --- STEP 3: Read the Content of the First File ---
        if (codeFiles.length > 0) {
            const fileToRead = codeFiles[0];
            console.log(`\n3. Reading content of: ${fileToRead.path}`);

            // To get raw text content cleanly, we use the "raw" header
            const contentResponse = await axios.get(fileToRead.url, {
                headers: {
                    Authorization: `token ${ACCESS_TOKEN}`,
                    Accept: 'application/vnd.github.v3.raw' // <--- This trick gets raw text, no Base64 decoding needed!
                }
            });

            console.log("\n--- FILE CONTENT START ---");
            console.log(contentResponse.data); // This is the actual code text
            console.log("--- FILE CONTENT END ---");
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

main();