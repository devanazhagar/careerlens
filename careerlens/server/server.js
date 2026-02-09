require('dotenv').config()
// Forcing restart for .env load
// Forcing restart for .env load
const express = require('express')
const cors = require('cors')
const cookieparser = require('cookie-parser')
const { connection } = require('./database/db')
const Router = require('./routes/user')
const StudentRouter = require('./routes/student')
const CollegeStudentRouter = require('./routes/collegeStudent')
const IndustryWorkerRouter = require('./routes/industryWorker')
const ResumeRouter = require('./routes/resumeRoutes')
const app = express()
const PORT = process.env.PORT || 4000


app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'], credentials: true }))
app.use(cookieparser())
app.use('/careerlens/skill', require('./routes/skillRoutes'))
app.use('/careerlens', Router)
app.use('/careerlens/student', StudentRouter)
app.use('/careerlens/collegeStudent', CollegeStudentRouter)
app.use('/careerlens/industryWorker', IndustryWorkerRouter)
app.use('/careerlens/resume', ResumeRouter)
app.use('/careerlens/analysis', require('./routes/analysisRoutes'))
app.use('/careerlens/scraper', require('./routes/scraperRoutes'))
app.use('/careerlens/github', require('./routes/githubRoutes'))

app.use('/uploads', express.static('uploads'))
// Handle GitHub OAuth Callback at root (matching existing App credentials)
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const { default: axios } = await import('axios'); // Dynamic import or use require if strictly CJS

    if (!code) return res.status(400).send("No code provided");

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
        console.error("Login Failed:", error.message);
        res.status(500).send("Login Failed");
    }
});

app.use('/', (req, res) => {
    res.status(404).json({ success: false, message: "Route not found. Ensure you are using the correct endpoint." });
})

connection()

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})