const express = require('express');
const router = express.Router();
const { createIndustryWorker, getIndustryWorker } = require('../controller/industryWorker');
const upload = require('../middleware/upload'); // Import the upload middleware

// Route to create a new industry worker profile (with file upload support)
router.post('/create', upload.single('profilePhoto'), createIndustryWorker);

// Route to get an industry worker profile by userID
router.get('/:userID', getIndustryWorker);

module.exports = router;
