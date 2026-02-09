// Data for Internship Profiles
const profiles = [
    "Accounts", "Analytics", "Android App Development", "Animation", "Architecture",
    "Artificial Intelligence (AI)", "Auditing", "Backend Development", "Bank",
    "Biotechnology Engineering", "Brand Management", "Business Development",
    "Business/MBA", "CAD Design", "CMA Articleship", "Campus Ambassador",
    "Chartered Accountancy (CA)", "Chemistry", "Cinematography", "Civil Engineering",
    "Client Servicing", "Cloud Computing", "Commerce", "Company Secretary (CS)",
    "Computer Science", "Computer Vision", "Content Writing", "Copywriting",
    "Creative Writing", "Customer Service", "Cyber Security", "Data Entry",
    "Data Science", "Database Building", "Design", "Digital Marketing",
    "E-commerce", "Editorial", "Electric Vehicle", "Electrical Engineering",
    "Electronics Engineering", "Embedded Systems", "Energy Science & Engineering",
    "Engineering", "Engineering Design", "Environmental Sciences", "Event Management",
    "Film Making", "Finance", "Flutter Development", "Front End Development",
    "Full Stack Development", "Fundraising", "Game Design", "Game Development",
    "General Management", "Graphic Design", "Hospitality", "Human Resources (HR)",
    "Humanities", "Industrial & Production Engineering", "Information Technology",
    "Interior Design", "International", "Internet of Things (IoT)", "Java Development",
    "Javascript Development", "Journalism", "Law", "Legal Research", "Machine Learning",
    "Manufacturing Engineering", "Market/Business Research", "Marketing",
    "Material Science", "Mechanical Engineering", "Mechatronics", "Media",
    "Mobile App Development", "Motion Graphics", "NGO",
    "Natural Language Processing (NLP)", "Naval Architecture and Ocean Engineering",
    "Network Engineering", "Node.js Development", "Operations", "PHP Development",
    "Photography", "Political/Economics/Policy Research", "Product Management",
    "Programming", "Project Management", "Psychology", "Python/Django Development",
    "Quality Analyst", "Recruitment", "Sales", "Science",
    "Search Engine Optimization (SEO)", "Social Media Marketing", "Social Work",
    "Software Development", "Software Testing", "Strategy", "Subject Matter Expert (SME)",
    "Talent Acquisition", "Teaching", "Telecalling", "Travel & Tourism",
    "UI/UX Design", "Video Making/Editing", "Videography", "Volunteering",
    "Web Development", "Wordpress Development", "iOS App Development"
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate Internship Role Dropdown
    const roleSelect = document.getElementById('internship-role');

    // Sort profiles alphabetically for better UX
    profiles.sort();

    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile;
        option.textContent = profile;
        roleSelect.appendChild(option);
    });

    // 2. Add Event Listeners for Buttons (Simulate functionalities)

    // Job Search (n8n Workflow)
    const jobBtn = document.querySelector('#job-search-form button');

    // Create a result container if it doesn't exist
    let resultContainer = document.getElementById('search-results-area');
    if (!resultContainer) {
        resultContainer = document.createElement('div');
        resultContainer.id = 'search-results-area';
        resultContainer.style.marginTop = '2rem';
        resultContainer.style.width = '100%';
        // Insert after the main container
        document.querySelector('.container').after(resultContainer);
    }

    jobBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const role = document.getElementById('job-role').value;
        const city = document.getElementById('job-pincode').value; // Using pincode input as city/location

        if (!role || !city) {
            alert("Please enter both Role and Location");
            return;
        }

        const originalText = jobBtn.innerHTML;
        jobBtn.innerHTML = 'Searching Indeed...';
        jobBtn.disabled = true;

        // Clear previous results
        resultContainer.innerHTML = '';

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'scraping-loader';
        loadingDiv.innerHTML = '<p style="text-align:center; color:#94a3b8;">Scraping Indeed and analyzing results... This may take a moment.</p>';
        resultContainer.appendChild(loadingDiv);

        try {
            console.log(`Step 1: Calling /search-jobs-indeed with Role=${role}, City=${city}`);

            const response = await fetch('/search-jobs-indeed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, city })
            });

            const data = await response.json();
            console.log("Server Response:", data);

            // Remove loader
            loadingDiv.remove();

            if (data.error) {
                throw new Error(data.error);
            }

            // Handle Array response (n8n usually returns an array)
            const dataItem = Array.isArray(data) ? data[0] : data;

            // 1. Display Answer/Insights if present
            if (dataItem.answer) {
                const answerHTML = `
                    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px);">
                        <h3 style="margin-bottom: 0.5rem; color: #a18cd1;">AI Insights</h3>
                        <p style="line-height: 1.6;">${dataItem.answer}</p>
                    </div>
                `;
                resultContainer.innerHTML += answerHTML;
            }

            // 2. Display Job Results if present
            // Provided logic assumes webhook returns 'results' array either at top level or inside dataItem
            const jobs = dataItem.results || (Array.isArray(data) ? data : []);

            if (Array.isArray(jobs) && jobs.length > 0 && jobs[0].title) { // Simple check if it looks like job data
                const jobsHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                        ${jobs.map(job => `
                            <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                                <h4 style="font-size: 1.2rem; color: #fff; margin-bottom: 0.5rem;">${job.title || 'No Title'}</h4>
                                <p style="color: #a18cd1; margin-bottom: 0.5rem;">${job.company || 'No Company'}</p>
                                <p style="color: #94a3b8; font-size: 0.9rem;">📍 ${job.location || 'Unknown Location'}</p>
                                ${job.link ? `<a href="${job.link}" target="_blank" style="display:inline-block; margin-top:0.5rem; color:#667eea; text-decoration:none;">View Job &rarr;</a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                const jobsContainer = document.createElement('div');
                jobsContainer.innerHTML = `<h3 style="margin: 2rem 0 1rem; color: #fff;">Job Listings</h3>` + jobsHTML;
                resultContainer.appendChild(jobsContainer);
            } else if (!dataItem.answer) {
                // If neither answer nor results found
                resultContainer.innerHTML += `<p style="text-align:center; color:#cbd5e1;">Search completed, but no specific results to display.</p>`;
            }

        } catch (err) {
            console.error("Search Error:", err);
            // Remove loader if it still exists (in case of error before removal)
            if (document.getElementById('scraping-loader')) document.getElementById('scraping-loader').remove();

            resultContainer.innerHTML += `<div style="color: #ff6b6b; text-align: center; margin-top: 1rem;">Error: ${err.message}</div>`;
        } finally {
            jobBtn.innerHTML = originalText;
            jobBtn.disabled = false;
        }
    });

    // Internship Search
    const internshipBtn = document.querySelector('#internship-search-form button');
    internshipBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const city = document.getElementById('internship-city').value;
        const role = document.getElementById('internship-role').value;

        if (!city || !role) {
            alert("Please provide both City and Role.");
            return;
        }

        const originalText = internshipBtn.innerHTML;
        internshipBtn.innerHTML = 'Searching Internshala...';
        internshipBtn.style.opacity = '0.8';
        internshipBtn.disabled = true;

        console.log(`Starting Internship Search: City=${city}, Role=${role}`);

        try {
            const response = await fetch('/search-internships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, role })
            });

            const result = await response.json();

            if (result.success) {
                console.log("Internship Results:", result.data);
                alert(`Search Complete! Found ${result.count} internships. Check console or internships_output.json.`);
            } else {
                alert(`Error: ${result.error}`);
            }

        } catch (err) {
            console.error("Search Request Failed:", err);
            alert("Failed to connect to server. Ensure it is running.");
        } finally {
            internshipBtn.innerHTML = originalText;
            internshipBtn.style.opacity = '1';
            internshipBtn.disabled = false;
        }
    });

    // College Search
    const collegeBtn = document.querySelector('#college-search-form button');

    // College Result Container
    let collegeResultContainer = document.getElementById('college-results-area');
    if (!collegeResultContainer) {
        collegeResultContainer = document.createElement('div');
        collegeResultContainer.id = 'college-results-area';
        collegeResultContainer.style.marginTop = '2rem';
        collegeResultContainer.style.width = '100%';
        document.querySelector('.container').after(collegeResultContainer); // Append to main area
    }

    collegeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const city = document.getElementById('college-place').value;
        const course = document.getElementById('college-course').value;

        if (!city || !course) {
            alert("Please provide City and Course.");
            return;
        }

        const originalText = collegeBtn.innerHTML;
        collegeBtn.innerHTML = 'Analyzing...';
        collegeBtn.disabled = true;
        collegeResultContainer.innerHTML = ''; // Clear previous

        // Add status message
        const statusMsg = document.createElement('p');
        statusMsg.id = 'college-status-msg';
        statusMsg.style.color = '#cbd5e1';
        statusMsg.style.fontSize = '0.9rem';
        statusMsg.style.marginTop = '1rem';
        statusMsg.style.textAlign = 'center';
        statusMsg.style.fontStyle = 'italic';
        statusMsg.innerText = "This might take a minute. Feel free to continue your other work while we fetch the data.";
        collegeBtn.after(statusMsg);

        console.log(`Starting College Search: City=${city}, Course=${course}`);

        try {
            const response = await fetch('/search-colleges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, course })
            });

            const rawData = await response.json();

            if (rawData.error) {
                if (rawData.error.includes('524')) {
                    throw new Error("The request timed out (Cloudflare 524). The AI analysis took too long to respond. Please check your n8n workflow.");
                }
                throw new Error(rawData.error);
            }

            // Data parsing logic
            // Expected format: array of objects, or single object with 'output' field containing the markdown string
            let colleges = [];

            // Handle the specific n8n structure: [{ "output": "```json ... ```" }]
            let outputString = "";
            if (Array.isArray(rawData) && rawData[0].output) {
                outputString = rawData[0].output;
            } else if (rawData.output) {
                outputString = rawData.output;
            } else {
                // Fallback: maybe it returned the array directly?
                colleges = Array.isArray(rawData) ? rawData : [];
            }

            if (outputString) {
                // Remove markdown code blocks if present
                const cleanJson = outputString.replace(/```json\n|\n```/g, '').trim();
                try {
                    colleges = JSON.parse(cleanJson);
                } catch (parseErr) {
                    console.error("Failed to parse inner JSON:", parseErr);
                    throw new Error("Received invalid data format from AI.");
                }
            }

            if (colleges.length > 0) {
                const collegesHTML = `
                    <h3 style="margin: 2rem 0 1rem; color: #fff; text-align: center;">Top Colleges for ${course} in ${city}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
                        ${colleges.map(college => {
                    // Safety checks for undefined fields
                    const name = college["College Name"] || "Unknown College";
                    const fees = college["Approximate Fees"] || "N/A";
                    const placements = college["Placement Stats"] || {};
                    const rank = college["rank"] || {};
                    const details = college["details"] || "";

                    return `
                                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px);">
                                    <h4 style="font-size: 1.1rem; color: #667eea; margin-bottom: 0.5rem; font-weight: 600;">${name}</h4>
                                    
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 1rem;">
                                        <p><strong>Fees:</strong> ${fees}</p>
                                        <p><strong>Avg Package:</strong> ${placements["Average Package"] || "N/A"}</p>
                                        <p><strong>Highest:</strong> ${placements["Highest Package"] || "N/A"}</p>
                                    </div>
                                    
                                    ${rank["CD Rank"] ? `<div style="display:inline-block; background: #764ba2; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 0.5rem;">Rank: ${rank["CD Rank"]}</div>` : ''}
                                    
                                    <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem; margin-top: 0.5rem;">
                                        ${details ? details.substring(0, 150) + '...' : 'No details available.'}
                                    </p>
                                </div>
                             `;
                }).join('')}
                    </div>
                `;
                collegeResultContainer.innerHTML = collegesHTML;
                // scroll to results
                collegeResultContainer.scrollIntoView({ behavior: 'smooth' });

            } else {
                alert("No colleges found for the given criteria.");
            }

        } catch (err) {
            console.error("College Search Error:", err);
            alert("Error: " + err.message);
        } finally {
            collegeBtn.innerHTML = originalText;
            collegeBtn.disabled = false;

            // Remove status message
            const statusMsg = document.getElementById('college-status-msg');
            if (statusMsg) statusMsg.remove();
        }
    });
});

function simulateSearch(button) {
    const originalText = button.innerHTML;
    button.innerHTML = 'Searching...';
    button.style.opacity = '0.8';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.opacity = '1';
        alert('Search function triggered! Check console for values.');
    }, 1000);
}

// --- Simulation / Debug Button ---
const simulateBtn = document.getElementById('simulate-college-btn');
if (simulateBtn) {
    simulateBtn.addEventListener('click', () => {
        const city = document.getElementById('college-place').value || "Coimbatore";
        const course = document.getElementById('college-course').value || "B.Tech";

        console.log("Simulating College Results...");

        // Mock Data from User
        const mockData = [
            {
                "College Name": "KPR Institute of Engineering & Technology - [KPRIET]",
                "Approximate Fees": "₹ 3,87,600",
                "Placement Stats": {
                    "Average Package": "₹ 4,80,000",
                    "Highest Package": "₹ 54,00,000",
                    "Placement Percentage": "92%",
                    "Median Package": "INR 4.50 LPA"
                },
                "rank": {
                    "CD Rank": "#18",
                    "Other Rankings": [
                        "#159th/238 in India for Engineering 2022 + 3 More",
                        "NIRF 2025: 101-150"
                    ]
                },
                "details": "Coimbatore, Tamil Nadu | AICTE, UGC, NBA Approved | NAAC A | BE Electronics & Communication Engineering - Total Fees | 4.4 / 5 Based on 113 User Reviews | Best in Infrastructure | Total Seats (B.Tech): 900 | Top Recruiters: Amazon, Autodesk, Tachibana Eletech, Out-Sourcing Inc., Lavendel Consulting"
            },
            {
                "College Name": "Sri Krishna College of Engineering and Technology - [SKCET]",
                "Approximate Fees": "₹ 2,20,000",
                "Placement Stats": {
                    "Average Package": "₹ 6,20,000",
                    "Highest Package": "₹ 47,00,000",
                    "Placement Percentage": "93%",
                    "Median Package": "INR 7 LPA"
                },
                "rank": {
                    "CD Rank": "#7"
                },
                "details": "Coimbatore, Tamil Nadu | AICTE, UGC, NBA, MHRD Approved | NAAC A++ | B.Tech Information Technology - Total Fees | 4.1 / 5 Based on 107 User Reviews | Best in Infrastructure | Total Seats (B.Tech): 1542 | Accepted Entrance Exam: TNEA, JEE Main | 12th Criteria: Must have passed 10+2 with a Minimum of 45% marks | TNEA Cutoff (Gen) 7942 (Artificial Intelligence and Data Science) - 39053 (Civil) | Top Recruiters: Google, Accenture, Amazon, Infosys, Bosch, Capgemini, HCL, Microsoft, JPMorgan Chase & Co. | ROI: 281.82%"
            },
            {
                "College Name": "PSG College of Technology - [PSGCT]",
                "Approximate Fees": "₹ 2,20,000",
                "Placement Stats": {
                    "Average Package": "INR 7 LPA",
                    "Highest Package": null,
                    "Placement Percentage": null,
                    "Median Package": "INR 7.00 LPA"
                },
                "rank": {
                    "CD Rank": "#1"
                },
                "details": "Coimbatore, Tamil Nadu | AICTE Approved | NAAC A | B.Tech Biotechnology - Total Fees | 4.2 / 5 Based on 150 User Reviews | Best in Placements | Total Seats (B.Tech): 1254 | Accepted Entrance Exam: TNEA, JEE Main | 12th Criteria: Must have passed 10+2 with a Minimum of 45% marks | TNEA Cutoff (Gen) 1124 (ECE) - 5072 (CE) | Top Recruiters: Google, Microsoft, Deloitte, Wipro, Decathlon, Intel | ROI: 318.18 %"
            }
        ];
        renderColleges(mockData, city, course);
    });
}

// Helper Function to Render Cards
function renderColleges(colleges, city, course) {
    const collegeResultContainer = document.getElementById('college-results-area');
    const collegesHTML = `
        <h3 style="margin: 2rem 0 1rem; color: #fff; text-align: center;">Top Colleges for ${course} in ${city}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
            ${colleges.map(college => {
        // Safety checks for undefined fields
        const name = college["College Name"] || "Unknown College";
        const fees = college["Approximate Fees"] || "N/A";
        const placements = college["Placement Stats"] || {};
        const rank = college["rank"] || {};
        const details = college["details"] || "";

        return `
                    <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px);">
                        <h4 style="font-size: 1.1rem; color: #667eea; margin-bottom: 0.5rem; font-weight: 600;">${name}</h4>
                        
                        <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 1rem;">
                            <p><strong>Fees:</strong> ${fees}</p>
                            <p><strong>Avg Package:</strong> ${placements["Average Package"] || "N/A"}</p>
                            <p><strong>Highest:</strong> ${placements["Highest Package"] || "N/A"}</p>
                        </div>
                        
                        ${rank["CD Rank"] ? `<div style="display:inline-block; background: #764ba2; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 0.5rem;">Rank: ${rank["CD Rank"]}</div>` : ''}
                        
                        <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem; margin-top: 0.5rem;">
                            ${details ? details.substring(0, 150) + '...' : 'No details available.'}
                        </p>
                    </div>
                 `;
    }).join('')}
        </div>
    `;
    collegeResultContainer.innerHTML = collegesHTML;
    // scroll to results
    collegeResultContainer.scrollIntoView({ behavior: 'smooth' });
}
