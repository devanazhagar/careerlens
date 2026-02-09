const express = require('express');
const router = express.Router();
const { analyzeResume, chatWithFiles } = require('../controller/resumeController');
const uploadResume = require('../middleware/resumeUpload');

// Route for analyzing resume (upload or text)
router.post('/analyze', uploadResume.single('resume'), analyzeResume);

// Route for chat
// Route for chat
router.post('/chat', chatWithFiles);

// Route for generating refined resume
router.post('/generate', require('../controller/resumeController').generateResume);

module.exports = router;
