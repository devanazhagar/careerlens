const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const userauth = require('../middleware/userauth'); // Optional, if routes need to be protected
const { addStudentInfo, getStudentInfo } = require('../controller/student');

// Route to add student info (with file upload)
// 'profilePhoto' matches the key used in the form-data
router.post('/add', userauth, upload.single('profilePhoto'), addStudentInfo);

// Route to get student info
router.get('/get', userauth, getStudentInfo);

module.exports = router;
