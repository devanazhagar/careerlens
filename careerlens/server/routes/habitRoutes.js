const express = require('express');
const router = express.Router();
const { generateHabitPlan, getHabitPlan, toggleHabitDay } = require('../controller/habitController');

router.post('/generate', generateHabitPlan);
router.get('/get-plan', getHabitPlan);
router.post('/toggle-day', toggleHabitDay);

module.exports = router;
