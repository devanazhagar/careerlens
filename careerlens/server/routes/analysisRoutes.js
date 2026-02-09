const express = require('express');
const router = express.Router();
const { analyzeProfile, getCareerStatus } = require('../controller/analysis');
const userauth = require('../middleware/userauth');

router.post('/analyze', userauth, analyzeProfile);
router.get('/get-status', getCareerStatus);

module.exports = router;
