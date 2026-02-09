const express = require('express');
const router = express.Router();
const controller = require('../controller/skillController');

const userauth = require('../middleware/userauth');

router.post('/aptitude', userauth, controller.generateAptitude);
router.post('/games', userauth, controller.generateGamesContent);
router.post('/practical', userauth, controller.generatePractical);
router.post('/finalize', userauth, controller.finalizeAssessment);
router.post('/evaluate', userauth, controller.evaluateDetailed);

module.exports = router;
