import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/opening.css';

const INTERNSHIP_ROLES = [
    "Android App Development", "Animation", "Artificial Intelligence (AI)", "Backend Development",
    "Big Data", "Brand Management", "Business Analytics", "Business Development (Sales)",
    "Campus Ambassador", "Chemical Engineering", "Civil Engineering", "Client Servicing",
    "Content Writing", "Copywriting", "Creative Writing", "Customer Success", "Cyber Security",
    "Data Entry", "Data Science", "Database Building", "Design", "Digital Marketing",
    "Editorial", "Electrical Engineering", "Electronics", "Embedded Systems", "Energy Science",
    "Engineering Design", "Finance", "Financial Analytics", "Frontend Development",
    "Full Stack Development", "Game Development", "General Management", "Graphic Design",
    "HR (Human Resources)", "IT Professional", "Industry Professional", "MBA",
    "Machine Learning", "Marketing", "Mechanical Engineering", "Media", "Mobile App Development",
    "Operations", "Product Management", "Public Relations (PR)", "Quality Assurance (QA)",
    "Research and Analytics", "SEO", "Sales", "Social Media Marketing", "Software Development",
    "Software Testing", "Teaching", "UI/UX Design", "Video Making/Editing", "Videography", "Volunteering",
    "Web Development", "Wordpress Development", "iOS App Development"
].sort();

const Opening = () => {
    const navigate = useNavigate();

    // User ID from localStorage
    const [userID, setUserID] = useState(null);

    // Job Search State
    const [jobForm, setJobForm] = useState({ role: '', city: '' });
    const [jobLoading, setJobLoading] = useState(false);
    const [jobResults, setJobResults] = useState(null);

    // Internship Search State
    const [internshipForm, setInternshipForm] = useState({ city: '', role: '' });
    const [internshipLoading, setInternshipLoading] = useState(false);
    const [internshipResults, setInternshipResults] = useState(null);

    // College Search State
    const [collegeForm, setCollegeForm] = useState({ city: '', course: '' });
    const [collegeLoading, setCollegeLoading] = useState(false);
    const [collegeResults, setCollegeResults] = useState(null);

    // Completion State - tracks if user has saved results
    const [completedSearches, setCompletedSearches] = useState({
        jobs: false,
        internships: false,
        colleges: false
    });

    // Get user ID and check for saved results on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user._id) {
            setUserID(user._id);
            checkSavedResults(user._id);
        } else {
            alert('Please login to use this feature');
            navigate('/login');
        }
    }, [navigate]);

    // Check if user has saved results
    const checkSavedResults = async (uid) => {
        const types = ['jobs', 'internships', 'colleges'];
        const newCompleted = {};

        for (const type of types) {
            try {
                const response = await fetch(`http://localhost:3000/careerlens/scraper/${type}-results/${uid}`);
                newCompleted[type] = response.ok;
            } catch {
                newCompleted[type] = false;
            }
        }

        setCompletedSearches(newCompleted);
    };

    // Load saved results
    const loadSavedResults = async (type) => {
        if (!userID) return;

        try {
            const response = await fetch(`http://localhost:3000/careerlens/scraper/${type}-results/${userID}`);
            if (!response.ok) throw new Error('No saved results');

            const data = await response.json();
            console.log(`Loaded ${type} data:`, data);

            if (type === 'jobs') {
                // Handle different saved structures
                if (data.data.webhookResponse) {
                    setJobResults(data.data.webhookResponse);
                } else if (data.data.formatted) {
                    setJobResults(data.data.formatted);
                } else {
                    // Legacy/Fallback raw array support
                    setJobResults({
                        results: Array.isArray(data.data.scraped) ? data.data.scraped : [],
                        answer: "Loaded from saved raw data."
                    });
                }
            } else if (type === 'internships') {
                setInternshipResults(data.data.results);
            } else if (type === 'colleges') {
                setCollegeResults(data.data.results);
            }

            alert(`Loaded saved ${type} results!`);
            // Scroll to results
            setTimeout(() => document.getElementById(`${type}-results-area`)?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            alert(`No saved ${type} results found or error loading them.`);
        }
    };

    // Download Report Handler
    const handleDownloadReport = (type, data) => {
        if (!data) {
            alert('No data to download');
            return;
        }

        const fileName = `${type}_report_${new Date().toISOString().slice(0, 10)}.json`;
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    // Job Search Handler
    const handleJobSearch = async (e) => {
        e.preventDefault();

        if (jobLoading) {
            alert('Job search already in progress. Please wait.');
            return;
        }

        if (!jobForm.role || !jobForm.city) {
            alert('Please enter both Role and Location');
            return;
        }

        if (!userID) {
            alert('Please login first');
            return;
        }

        setJobLoading(true);
        setJobResults(null);

        try {
            console.log(`Calling /careerlens/scraper/search-jobs-indeed with Role=${jobForm.role}, City=${jobForm.city}`);
            const response = await fetch('http://localhost:3000/careerlens/scraper/search-jobs-indeed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: jobForm.role, city: jobForm.city, userID })
            });

            const data = await response.json();
            console.log('Server Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // Handle Array response (n8n usually returns an array)
            const dataItem = Array.isArray(data) ? data[0] : data;
            setJobResults(dataItem);
            setCompletedSearches(prev => ({ ...prev, jobs: true }));

        } catch (err) {
            console.error('Search Error:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setJobLoading(false);
        }
    };

    // Internship Search Handler
    const handleInternshipSearch = async (e) => {
        e.preventDefault();

        if (internshipLoading) {
            alert('Internship search already in progress. Please wait.');
            return;
        }

        if (!internshipForm.city || !internshipForm.role) {
            alert('Please provide both City and Role.');
            return;
        }

        if (!userID) {
            alert('Please login first');
            return;
        }

        setInternshipLoading(true);
        setInternshipResults(null);

        try {
            const response = await fetch('http://localhost:3000/careerlens/scraper/search-internships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: internshipForm.city, role: internshipForm.role, userID })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Internship Results:', result.data);
                setInternshipResults(result.data);
                setCompletedSearches(prev => ({ ...prev, internships: true }));
            } else {
                alert(`Error: ${result.error}`);
            }

        } catch (err) {
            console.error('Search Request Failed:', err);
            alert('Failed to connect to server.');
        } finally {
            setInternshipLoading(false);
        }
    };

    // College Search Handler
    const handleCollegeSearch = async (e) => {
        e.preventDefault();

        if (collegeLoading) {
            alert('College search already in progress. Please wait.');
            return;
        }

        if (!collegeForm.city || !collegeForm.course) {
            alert('Please provide City and Course.');
            return;
        }

        if (!userID) {
            alert('Please login first');
            return;
        }

        setCollegeLoading(true);
        setCollegeResults(null);

        try {
            console.log(`Starting College Search: City=${collegeForm.city}, Course=${collegeForm.course}`);

            const response = await fetch('http://localhost:3000/careerlens/scraper/search-colleges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: collegeForm.city, course: collegeForm.course, userID })
            });

            const rawData = await response.json();

            if (rawData.error) {
                if (rawData.error.includes('524')) {
                    throw new Error('The request timed out (Cloudflare 524). The AI analysis took too long to respond. Please check your n8n workflow.');
                }
                throw new Error(rawData.error);
            }

            console.log('College Results:', rawData);

            if (Array.isArray(rawData)) {
                setCollegeResults(rawData);
                setCompletedSearches(prev => ({ ...prev, colleges: true }));
            } else if (rawData.colleges) {
                setCollegeResults(rawData.colleges);
                setCompletedSearches(prev => ({ ...prev, colleges: true }));
            } else {
                setCollegeResults(rawData);
                setCompletedSearches(prev => ({ ...prev, colleges: true }));
            }

        } catch (err) {
            console.error('College Search Error:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setCollegeLoading(false);
        }
    };

    return (
        <div className="opening-page">
            <div className="container">
                {/* Job Search Card */}
                <div className="search-card">
                    <div className="card-icon">💼</div>
                    <h2 className="card-title">Jobs</h2>
                    <p className="card-desc">Search for job opportunities across India</p>
                    <form onSubmit={handleJobSearch}>
                        <div className="form-group">
                            <label htmlFor="job-role">Job Role</label>
                            <input
                                type="text"
                                id="job-role"
                                placeholder="e.g. Software Engineer"
                                value={jobForm.role}
                                onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="job-city">City</label>
                            <input
                                type="text"
                                id="job-city"
                                placeholder="e.g. Bangalore"
                                value={jobForm.city}
                                onChange={(e) => setJobForm({ ...jobForm, city: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="search-btn" disabled={jobLoading}>
                            {jobLoading ? 'Searching...' : 'Search Jobs'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <div className="button-group">
                            {completedSearches.jobs && (
                                <button
                                    type="button"
                                    className="view-results-btn"
                                    onClick={() => loadSavedResults('jobs')}
                                >
                                    ✓ View Saved
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Internship Search Card */}
                <div className="search-card">
                    <div className="card-icon">🎓</div>
                    <h2 className="card-title">Internships</h2>
                    <p className="card-desc">Find internships that match your skills</p>
                    <form onSubmit={handleInternshipSearch}>
                        <div className="form-group">
                            <label htmlFor="internship-city">City</label>
                            <input
                                type="text"
                                id="internship-city"
                                placeholder="e.g. Mumbai"
                                value={internshipForm.city}
                                onChange={(e) => setInternshipForm({ ...internshipForm, city: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="internship-role">Role/Category</label>
                            <select
                                id="internship-role"
                                value={internshipForm.role}
                                onChange={(e) => setInternshipForm({ ...internshipForm, role: e.target.value })}
                                required
                            >
                                <option value="">Select a role...</option>
                                {INTERNSHIP_ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="search-btn" disabled={internshipLoading}>
                            {internshipLoading ? 'Searching...' : 'Search Internships'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <div className="button-group">
                            {completedSearches.internships && (
                                <button
                                    type="button"
                                    className="view-results-btn"
                                    onClick={() => loadSavedResults('internships')}
                                >
                                    ✓ View Saved
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* College Search Card */}
                <div className="search-card">
                    <div className="card-icon">🏫</div>
                    <h2 className="card-title">Colleges</h2>
                    <p className="card-desc">AI-powered college recommendations</p>
                    <form onSubmit={handleCollegeSearch}>
                        <div className="form-group">
                            <label htmlFor="college-city">City</label>
                            <input
                                type="text"
                                id="college-city"
                                placeholder="e.g. Delhi"
                                value={collegeForm.city}
                                onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="college-course">Course</label>
                            <input
                                type="text"
                                id="college-course"
                                placeholder="e.g. B.Tech, MBA"
                                value={collegeForm.course}
                                onChange={(e) => setCollegeForm({ ...collegeForm, course: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="search-btn" disabled={collegeLoading}>
                            {collegeLoading ? 'Analyzing...' : 'Explore Colleges'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <div className="button-group">
                            {completedSearches.colleges && (
                                <button
                                    type="button"
                                    className="view-results-btn"
                                    onClick={() => loadSavedResults('colleges')}
                                >
                                    ✓ View Saved
                                </button>
                            )}
                        </div>
                    </form>
                    {collegeLoading && (
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                            AI analysis in progress... This may take 3-5 minutes. Please be patient.
                        </p>
                    )}
                </div>
            </div>

            {/* Job Results Display */}
            {jobResults && (
                <div className="search-results-area" id="jobs-results-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Job Search Results</h3>
                        <button
                            className="download-btn"
                            onClick={() => handleDownloadReport('jobs', jobResults)}
                        >
                            📥 Download Report
                        </button>
                    </div>

                    {/* AI Insights */}
                    {jobResults.answer && (
                        <div className="ai-insights">
                            <h3>AI Insights</h3>
                            <p>{jobResults.answer}</p>
                        </div>
                    )}

                    {/* Job Listings */}
                    {jobResults.results && jobResults.results.length > 0 && (
                        <div className="job-listings">
                            <h3>Job Openings ({jobResults.results.length})</h3>
                            <div className="job-grid">
                                {jobResults.results.map((job, idx) => (
                                    <div key={idx} className="job-card">
                                        <h4>{job.title || 'Untitled Role'}</h4>
                                        <p className="job-company">{job.company || 'Company Name'}</p>
                                        <p className="job-location">{job.location || 'Location'}</p>
                                        {job.link && (
                                            <a
                                                className="job-link"
                                                href={job.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View Job →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!jobResults.answer && (!jobResults.results || jobResults.results.length === 0) && (
                        <p style={{ textAlign: 'center', color: '#cbd5e1' }}>
                            Search completed, but no specific results to display.
                        </p>
                    )}
                </div>
            )}

            {/* Internship Results Display */}
            {internshipResults && internshipResults.length > 0 && (
                <div className="search-results-area" id="internships-results-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Found {internshipResults.length} Internships in {internshipForm.city}</h3>
                        <button
                            className="download-btn"
                            onClick={() => handleDownloadReport('internships', internshipResults)}
                        >
                            📥 Download Report
                        </button>
                    </div>

                    <div className="internship-grid">
                        {internshipResults.map((internship, index) => (
                            <div key={internship.id || index} className="internship-card">
                                <h4>{internship.title || 'Unknown Position'}</h4>
                                <p className="internship-company">
                                    <strong>Company:</strong> {internship.company || 'N/A'}
                                </p>
                                <p className="internship-location">
                                    <strong>Location:</strong> {internship.location || 'N/A'}
                                </p>
                                <p className="internship-stipend">
                                    <strong>Stipend:</strong> {internship.stipend || 'Not specified'}
                                </p>
                                {internship.full_card_text && (
                                    <p className="internship-details">
                                        {internship.full_card_text.substring(0, 200)}...
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* College Results Display */}
            {collegeResults && collegeResults.length > 0 && (
                <div className="college-results-area" id="colleges-results-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Top Colleges for {collegeForm.course} in {collegeForm.city}</h3>
                        <button
                            className="download-btn"
                            onClick={() => handleDownloadReport('colleges', collegeResults)}
                        >
                            📥 Download Report
                        </button>
                    </div>

                    <div className="college-grid">
                        {collegeResults.map((college, index) => {
                            const name = college["College Name"] || "Unknown College";
                            const fees = college["Approximate Fees"] || "N/A";
                            const placements = college["Placement Stats"] || {};
                            const rank = college["rank"] || {};
                            const details = college["details"] || "";

                            return (
                                <div key={index} className="college-card">
                                    <h4>{name}</h4>
                                    <div className="college-info">
                                        <p><strong>Fees:</strong> {fees}</p>
                                        <p><strong>Avg Package:</strong> {placements["Average Package"] || "N/A"}</p>
                                        <p><strong>Highest:</strong> {placements["Highest Package"] || "N/A"}</p>
                                    </div>
                                    {rank["CD Rank"] && (
                                        <div className="college-rank">Rank: {rank["CD Rank"]}</div>
                                    )}
                                    <p className="college-details">
                                        {details ? details.substring(0, 150) + '...' : 'No details available.'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Opening;
