const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { registerCollegeStudent, getCollegeStudent } = require('../controller/collegeStudent');

router.post('/register', upload.single('profilePhoto'), registerCollegeStudent);
router.get('/:userID', getCollegeStudent);

module.exports = router;
